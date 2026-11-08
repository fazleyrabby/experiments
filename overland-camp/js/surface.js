// The ground "surface field": one RGBA texture describing what every patch of
// forest floor is made of, plus the height function with tyre ruts pressed in.
//
//   R  mud        churned soil (ruts, footpath, puddle rims, drip lines)
//   G  water      puddle depth; the shader floods everything above (1 - fill)
//   B  canopy     how sheltered a spot is by tree crowns (drier, fewer splashes)
//   A  micro      fine height (ruts, tread, boot prints) for per-pixel normals
//
// The ground shader, grass scatter, rain splashes and canopy drips all sample it,
// so raindrops behave differently on puddles, mud, grass, roofs and under trees.
import * as THREE from 'three';
import {
  TRACK_PATH, TRACK_HALF_WIDTH, FOOT_PATH, PUDDLES, TREE_LAYOUT,
  polylineDistance, mulberry32, IS_MOBILE
} from './layout.js';

// --- small noise kit --------------------------------------------------------
function fract(x) { return x - Math.floor(x); }
function hash2(x, y) { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123); }
function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbm(x, y, oct = 3) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += vnoise(x, y) * a; n += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return s / n;
}
const sstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// --- base terrain -----------------------------------------------------------
function baseHeight(x, z) {
  let h = Math.sin(x * 0.18) * 0.12 + Math.cos(z * 0.15) * 0.14;
  h += Math.sin(x * 0.45 + z * 0.35) * 0.05;
  h += Math.sin(x * 0.09 + 1.3) * Math.cos(z * 0.11 - 0.6) * 0.16;
  h += (fbm(x * 0.35, z * 0.35, 2) - 0.5) * 0.08;
  const campDist = Math.hypot(x - 0.2, z - 0.5);
  if (campDist < 5.0) h *= THREE.MathUtils.smoothstep(campDist, 1.2, 5.0);
  return h;
}

// Rut profile across one wheel track (r = distance from the rut centre)
function rutProfile(r) {
  const core = 1 - sstep(0.07, 0.21, r);
  const berm = Math.exp(-Math.pow((r - 0.29) / 0.075, 2));
  return -0.065 * core + 0.022 * berm;
}

function trackInfo(x, z) {
  const info = polylineDistance(x, z, TRACK_PATH);
  if (info.d > 1.9) return null;
  const s = info.d * info.side;
  const rA = Math.abs(s - TRACK_HALF_WIDTH);
  const rB = Math.abs(s + TRACK_HALF_WIDTH);
  // Ruts fade out as the trail heads into the trees
  // ...and emerge from under the parked rear wheels instead of ending in a ring
  const u = info.t * info.length;
  const fade = (1 - sstep(0.8, 1.0, info.t)) * sstep(0.05, 0.6, u);
  return { t: info.t, length: info.length, s, r: Math.min(rA, rB), fade };
}

function puddleShape(p, x, z) {
  const dx = x - p.x, dz = z - p.z;
  const a = Math.atan2(dz, dx);
  const wob = 0.8 + Math.abs(Math.sin(a * 3.1 + p.r * 4.2)) * 0.2 + Math.abs(Math.cos(a * 5.7 - p.r)) * 0.12 +
    (vnoise(x * 1.7, z * 1.7) - 0.5) * 0.3;
  return Math.hypot(dx, dz) / (p.r * wob); // < 1 inside
}

export function groundHeight(x, z) {
  let h = baseHeight(x, z);
  const tr = trackInfo(x, z);
  if (tr) h += rutProfile(tr.r) * tr.fade;
  const fp = polylineDistance(x, z, FOOT_PATH);
  if (fp.d < 0.7) h -= 0.018 * (1 - sstep(0.15, 0.7, fp.d));
  for (const p of PUDDLES) {
    if (Math.abs(x - p.x) > p.r * 1.6 || Math.abs(z - p.z) > p.r * 1.6) continue;
    const q = puddleShape(p, x, z);
    if (q < 1.25) h -= 0.035 * (1 - sstep(0.2, 1.25, q));
  }
  return h;
}

// ---------------------------------------------------------------------------
export function createSurface() {
  const EXTENT = 44;
  const RES = IS_MOBILE ? 512 : 1024;
  const texel = EXTENT / RES;
  const data = new Uint8Array(RES * RES * 4);
  const mudA = new Float32Array(RES * RES);
  const waterA = new Float32Array(RES * RES);
  const canopyA = new Float32Array(RES * RES);
  const microA = new Float32Array(RES * RES);

  const toWorld = (i) => (i + 0.5) * texel - EXTENT * 0.5;
  const toTex = (w) => Math.floor((w + EXTENT * 0.5) / texel);

  // Boot prints along the footpath (alternating left / right)
  const prints = [];
  {
    const rnd = mulberry32(5150);
    for (let i = 0; i < FOOT_PATH.length - 1; i++) {
      const [ax, az] = FOOT_PATH[i];
      const [bx, bz] = FOOT_PATH[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const dirx = (bx - ax) / len, dirz = (bz - az) / len;
      for (let s = 0; s < len; s += 0.36) {
        const side = (prints.length % 2) ? 1 : -1;
        prints.push({
          x: ax + dirx * s - dirz * side * 0.12 + (rnd() - 0.5) * 0.08,
          z: az + dirz * s + dirx * side * 0.12 + (rnd() - 0.5) * 0.08,
          a: Math.atan2(dirx, dirz) + (rnd() - 0.5) * 0.3
        });
      }
    }
  }

  // 1. Per-texel: ruts, footpath, open-ground mud patches
  for (let j = 0; j < RES; j++) {
    const z = toWorld(j);
    for (let i = 0; i < RES; i++) {
      const x = toWorld(i);
      const k = j * RES + i;
      const n1 = fbm(x * 0.9, z * 0.9, 3);
      const n2 = vnoise(x * 3.7 + 11.3, z * 3.7 - 4.1);
      let mud = 0;
      let water = 0;
      let micro = 0.5;

      const tr = trackInfo(x, z);
      if (tr) {
        const core = 1 - sstep(0.16, 0.36 + n2 * 0.12, tr.r);
        const between = Math.abs(tr.s) < TRACK_HALF_WIDTH ? 0.38 + n1 * 0.35 : 0;
        const edge = 1 - sstep(TRACK_HALF_WIDTH + 0.3, TRACK_HALF_WIDTH + 0.85 + n1 * 0.4, Math.abs(tr.s));
        mud = Math.max(core, between * edge) * tr.fade;
        // Big chevron lugs printed into the rut floor
        const u = tr.t * tr.length;
        const across = Math.abs(tr.s) - TRACK_HALF_WIDTH;
        const tread = Math.sin((u + Math.abs(across) * 0.9) * (Math.PI * 2 / 0.17)) > 0.35 ? 1 : 0;
        const inCore = 1 - sstep(0.1, 0.17, tr.r);
        micro += (rutProfile(tr.r) * 5.5 - tread * 0.07 * inCore) * tr.fade;
        // Rain pooled along stretches of the ruts
        const pool = sstep(0.42, 0.7, vnoise(u * 0.55 + (tr.s > 0 ? 7 : 0), 3.3));
        water = Math.max(water, (1 - sstep(0.05, 0.2, tr.r)) * pool * 0.95 * tr.fade);
      }

      const fp = polylineDistance(x, z, FOOT_PATH);
      if (fp.d < 1.2) {
        const w = 0.32 + n1 * 0.28;
        mud = Math.max(mud, (1 - sstep(w * 0.5, w + 0.3, fp.d)) * (0.65 + n2 * 0.35));
        micro -= (1 - sstep(0.1, 0.6, fp.d)) * 0.05;
      }

      // Drip line under the awning's outer eave and the rig's rear quarter
      const eave = Math.abs(x - 2.9);
      if (z > -1.4 && z < 2.5 && eave < 0.6) {
        const line = 1 - sstep(0.08, 0.5, eave + n2 * 0.08);
        mud = Math.max(mud, line * 0.95);
        water = Math.max(water, (1 - sstep(0.03, 0.2, eave + (n1 - 0.5) * 0.12)) * 0.8);
        micro -= line * 0.06;
      }

      // Patchy trampled soil around the fire ring and the tent door
      const fire = Math.hypot(x - 4.9, z - 3.3);
      if (fire < 2.9) mud = Math.max(mud, sstep(0.5, 0.75, n1) * (1 - sstep(2.0, 2.9, fire)) * 0.85);
      const door = Math.hypot(x - 1.25, z - 2.6);
      if (door < 1.2) mud = Math.max(mud, (1 - sstep(0.3, 1.2, door)) * (0.6 + n2 * 0.4));

      // Low wet hollows out in the meadow
      const hollow = fbm(x * 0.21 + 40, z * 0.21 - 13, 3);
      if (hollow > 0.66) mud = Math.max(mud, sstep(0.66, 0.78, hollow) * (0.5 + n2 * 0.5) * 0.8);

      mudA[k] = Math.min(1, mud);
      waterA[k] = water;
      microA[k] = micro;
    }
  }

  // 2. Puddles (only touch the texels they cover)
  for (const p of PUDDLES) {
    const span = p.r * 1.7;
    const i0 = Math.max(0, toTex(p.x - span)), i1 = Math.min(RES - 1, toTex(p.x + span));
    const j0 = Math.max(0, toTex(p.z - span)), j1 = Math.min(RES - 1, toTex(p.z + span));
    for (let j = j0; j <= j1; j++) {
      const z = toWorld(j);
      for (let i = i0; i <= i1; i++) {
        const x = toWorld(i);
        const k = j * RES + i;
        const q = puddleShape(p, x, z);
        const depth = 1 - sstep(0.0, 1.0, q);
        waterA[k] = Math.max(waterA[k], Math.min(1, depth * 1.15));
        mudA[k] = Math.max(mudA[k], (1 - sstep(0.8, 1.5, q)) * 0.9);
      }
    }
  }

  // 3. Boot prints: small dips that hold a film of water
  for (const pr of prints) {
    const span = 0.2;
    const i0 = Math.max(0, toTex(pr.x - span)), i1 = Math.min(RES - 1, toTex(pr.x + span));
    const j0 = Math.max(0, toTex(pr.z - span)), j1 = Math.min(RES - 1, toTex(pr.z + span));
    const ca = Math.cos(pr.a), sa = Math.sin(pr.a);
    for (let j = j0; j <= j1; j++) {
      const z = toWorld(j) - pr.z;
      for (let i = i0; i <= i1; i++) {
        const x = toWorld(i) - pr.x;
        const lx = x * ca - z * sa;
        const lz = x * sa + z * ca;
        const e = Math.hypot(lx / 0.055, lz / 0.14);
        if (e > 1.3) continue;
        const k = j * RES + i;
        const dip = 1 - sstep(0.55, 1.15, e);
        microA[k] -= dip * 0.09;
        waterA[k] = Math.max(waterA[k], dip * 0.45);
        mudA[k] = Math.max(mudA[k], dip * 0.95);
      }
    }
  }

  // 4. Canopy cover: rasterise each crown footprint
  for (const t of TREE_LAYOUT) {
    const cr = t.crown * (t.scale || 1);
    if (Math.abs(t.x) > EXTENT * 0.5 + cr || Math.abs(t.z) > EXTENT * 0.5 + cr) continue;
    const dens = t.kind === 'broad' ? 0.82 : t.kind === 'birch' ? 0.55 : 0.92;
    const i0 = Math.max(0, toTex(t.x - cr)), i1 = Math.min(RES - 1, toTex(t.x + cr));
    const j0 = Math.max(0, toTex(t.z - cr)), j1 = Math.min(RES - 1, toTex(t.z + cr));
    for (let j = j0; j <= j1; j++) {
      const z = toWorld(j);
      for (let i = i0; i <= i1; i++) {
        const x = toWorld(i);
        const d = Math.hypot(x - t.x, z - t.z);
        if (d > cr) continue;
        const k = j * RES + i;
        const c = (1 - sstep(cr * 0.25, cr, d)) * dens;
        canopyA[k] = Math.min(1, canopyA[k] + c * (1 - canopyA[k]));
      }
    }
  }

  // Sheltered ground stays firmer: little mud or standing water under crowns
  for (let k = 0; k < RES * RES; k++) {
    const c = canopyA[k];
    mudA[k] *= 1 - c * 0.55;
    waterA[k] *= 1 - c * 0.7;
    data[k * 4] = Math.round(Math.min(1, mudA[k]) * 255);
    data[k * 4 + 1] = Math.round(Math.min(1, waterA[k]) * 255);
    data[k * 4 + 2] = Math.round(c * 255);
    data[k * 4 + 3] = Math.round(Math.min(1, Math.max(0, microA[k])) * 255);
  }

  const texture = new THREE.DataTexture(data, RES, RES, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;

  function sample(x, z) {
    const i = toTex(x), j = toTex(z);
    if (i < 0 || j < 0 || i >= RES || j >= RES) return { mud: 0, water: 0, canopy: 0 };
    const k = j * RES + i;
    return { mud: mudA[k], water: waterA[k], canopy: canopyA[k] };
  }

  // Points under tree crowns where gathered rain falls as big slow drops
  const dripSources = [];
  {
    const rnd = mulberry32(777);
    const near = TREE_LAYOUT.filter(t => t.lod < 2 && Math.hypot(t.x - 1, t.z - 1) < 20);
    const perTree = IS_MOBILE ? 3 : 7;
    near.forEach(t => {
      for (let n = 0; n < perTree; n++) {
        const a = rnd() * Math.PI * 2;
        const r = t.crown * (0.35 + rnd() * 0.6);
        dripSources.push({
          x: t.x + Math.cos(a) * r,
          y: t.h * (0.22 + rnd() * 0.3),
          z: t.z + Math.sin(a) * r
        });
      }
    });
  }

  return { texture, extent: EXTENT, sample, getHeight: groundHeight, dripSources };
}
