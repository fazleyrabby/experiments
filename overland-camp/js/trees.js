// Procedural forest: real branching structure instead of stacked cones.
//
//  - Spruce / fir: one tapering, root-flared trunk, whorls of drooping branches
//    with upturned tips, each carrying flat needle sprays; dead snags low down.
//  - Broadleaf: trunk forking into gnarled limbs -> branches -> leaf clusters.
//  - Birch: slender white trunk, ascending branches, fine drooping foliage.
//
// A handful of variants per species are generated once and instanced across
// the seeded layout (layout.js), so the forest is dense but cheap. Wind is
// done on the GPU (wind.js) including the shadow pass.
import * as THREE from 'three';
import { getTreeBarkMaps, getNeedleSprayTexture, getLeafClusterTexture } from './textures.js';
import { TREE_LAYOUT, mulberry32, IS_MOBILE } from './layout.js';
import { applyWind, windDepthMaterial } from './wind.js';
import { groundHeight } from './surface.js';

// ---------------------------------------------------------------------------
// Geometry builder
// ---------------------------------------------------------------------------
export class GeoBuilder {
  constructor() {
    this.pos = []; this.nor = []; this.uv = []; this.col = []; this.flut = []; this.idx = [];
  }
  get count() { return this.pos.length / 3; }
  vert(p, n, u, v, c, f) {
    this.pos.push(p.x, p.y, p.z);
    this.nor.push(n.x, n.y, n.z);
    this.uv.push(u, v);
    this.col.push(c[0], c[1], c[2]);
    this.flut.push(f);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aFlutter', new THREE.Float32BufferAttribute(this.flut, 1));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();

// Tube through points with per-point radius. radiusFn(i, theta) can add
// root flare lobes; colorFn(i, theta, p) gives per-vertex tint (moss, AO).
function addTube(b, pts, radii, radial, { barkScale = 0.38, vScale = 0.55, radiusFn, colorFn, flutter = 0 } = {}) {
  const n = pts.length;
  const tangents = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const c = pts[Math.min(n - 1, i + 1)];
    tangents.push(new THREE.Vector3().subVectors(c, a).normalize());
  }
  // Parallel-transport frames
  let normal = new THREE.Vector3();
  const t0 = tangents[0];
  normal.set(1, 0, 0);
  if (Math.abs(t0.x) > 0.9) normal.set(0, 0, 1);
  normal.sub(_v.copy(t0).multiplyScalar(normal.dot(t0))).normalize();
  const normals = [normal.clone()];
  for (let i = 1; i < n; i++) {
    _q.setFromUnitVectors(tangents[i - 1], tangents[i]);
    normal = normal.clone().applyQuaternion(_q);
    normals.push(normal);
  }

  const around = Math.max(1, Math.round((Math.PI * 2 * radii[0]) / barkScale));
  const base = b.count;
  let vAcc = 0;
  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (i > 0) vAcc += pts[i].distanceTo(pts[i - 1]) / vScale;
    const T = tangents[i];
    const N = normals[i];
    const B = new THREE.Vector3().crossVectors(T, N);
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const cs = Math.cos(th), sn = Math.sin(th);
      const r = radiusFn ? radiusFn(i, th) : radii[i];
      nrm.copy(N).multiplyScalar(cs).addScaledVector(B, sn);
      p.copy(pts[i]).addScaledVector(nrm, r);
      const c = colorFn ? colorFn(i, th, p) : [1, 1, 1];
      b.vert(p, nrm, (j / radial) * around, vAcc, c, flutter * (i / (n - 1)));
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = base + i * (radial + 1) + j;
      const c = a + radial + 1;
      b.idx.push(a, c, a + 1, c, c + 1, a + 1);
    }
  }
}

// Foliage card: origin at its attach point, `vDir` runs base -> tip (texture v),
// `uDir` across. Normals are bent towards `outward` so crowns shade softly.
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
export function addCard(b, origin, vDir, uDir, w, h, color, outward, bend = 0.65, flutBase = 0.15) {
  const cardN = new THREE.Vector3().crossVectors(uDir, vDir).normalize();
  if (cardN.dot(outward) < 0) cardN.negate();
  _n.copy(cardN).lerp(outward, bend).normalize();
  const base = b.count;
  const rows = 2;
  for (let r = 0; r <= rows; r++) {
    const v = r / rows;
    // slight droop of the free end makes cards read less flat
    const sag = v * v * h * 0.12;
    for (let k = 0; k <= 1; k++) {
      const u = k;
      _p.copy(origin).addScaledVector(uDir, (u - 0.5) * w).addScaledVector(vDir, v * h);
      _p.y -= sag;
      const shade = 0.82 + v * 0.18;
      b.vert(_p, _n, u, v, [color[0] * shade, color[1] * shade, color[2] * shade], flutBase + v * (1 - flutBase));
    }
  }
  for (let r = 0; r < rows; r++) {
    const a = base + r * 2;
    b.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
}

export function hsl(h, s, l) {
  const c = new THREE.Color().setHSL(h, s, l);
  return [c.r, c.g, c.b];
}

// ---------------------------------------------------------------------------
// Conifers
// ---------------------------------------------------------------------------
function buildConifer(seed, lod, fir = false) {
  const rnd = mulberry32(seed);
  const H = fir ? 11 : 12;
  const wood = new GeoBuilder();
  const leaves = new GeoBuilder();

  const leanX = (rnd() - 0.5) * 0.05;
  const leanZ = (rnd() - 0.5) * 0.05;
  const ph = rnd() * 10;
  const trunkAt = (y) => new THREE.Vector3(
    leanX * y + Math.sin(y * 0.45 + ph) * 0.035,
    y,
    leanZ * y + Math.cos(y * 0.38 + ph) * 0.035
  );
  const r0 = H * (fir ? 0.02 : 0.023);
  const trunkR = (y) => r0 * Math.pow(Math.max(0, 1 - y / H), 0.8) + 0.012;

  // Trunk with buttress flare and moss on the shaded side
  const segs = lod === 2 ? 5 : 14;
  const radial = lod === 0 ? 12 : lod === 1 ? 8 : 5;
  const tPts = [];
  const tR = [];
  for (let i = 0; i < segs; i++) {
    const y = Math.pow(i / (segs - 1), 1.35) * H * 0.985;
    tPts.push(trunkAt(y));
    tR.push(trunkR(y));
  }
  const lobePh = rnd() * 6;
  const mossDir = rnd() * Math.PI * 2;
  addTube(wood, tPts, tR, radial, {
    radiusFn: (i, th) => {
      const y = tPts[i].y;
      const flare = Math.exp(-y / 0.45);
      return tR[i] * (1 + flare * (0.55 + 0.35 * Math.sin(th * 5 + lobePh)));
    },
    colorFn: (i, th) => {
      const y = tPts[i].y;
      const ao = 0.55 + 0.45 * Math.min(1, y / 1.4);
      const moss = Math.max(0, 1 - y / 1.8) * Math.max(0, Math.cos(th - mossDir)) * 0.85;
      return [ao * (1 - moss * 0.45), ao * (1 - moss * 0.12), ao * (1 - moss * 0.5)];
    }
  });

  // Surface roots
  if (lod === 0) {
    const roots = 5;
    for (let k = 0; k < roots; k++) {
      const a = (k / roots) * Math.PI * 2 + rnd() * 0.6 + lobePh;
      const len = 0.6 + rnd() * 0.7;
      const pts = [];
      const rr = [];
      for (let s = 0; s < 5; s++) {
        const t = s / 4;
        pts.push(new THREE.Vector3(Math.cos(a) * (r0 * 0.8 + t * len), 0.12 * (1 - t) - 0.03 * t, Math.sin(a) * (r0 * 0.8 + t * len)));
        rr.push(r0 * 0.42 * (1 - t * 0.8));
      }
      addTube(wood, pts, rr, 5, { colorFn: () => [0.5, 0.52, 0.45] });
    }
  }

  // Whorls
  const crownBase = H * (fir ? 0.16 : 0.2 + rnd() * 0.08);
  const Rmax = H * (fir ? 0.165 : 0.21);
  const hue = fir ? 0.27 + rnd() * 0.02 : 0.31 + rnd() * 0.03;
  const step = lod === 2 ? 0.75 : lod === 1 ? 0.5 : 0.36;
  let y = H * 0.07;
  let whorl = 0;
  while (y < H - 0.25) {
    const t = Math.max(0, (y - crownBase) / (H - crownBase));
    const baseYaw = whorl * 2.4 + rnd();
    if (y < crownBase) {
      // Dead lower snags: bare, grey, a few broken short
      if (lod < 2) {
        const nDead = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < nDead; k++) {
          if (rnd() < 0.35) continue;
          const yaw = baseYaw + (k / nDead) * Math.PI * 2;
          const d = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
          const L = (0.3 + rnd() * 0.9) * (rnd() < 0.3 ? 0.4 : 1);
          const p0 = trunkAt(y).addScaledVector(d, trunkR(y) * 0.7);
          const pts = [p0, p0.clone().addScaledVector(d, L * 0.5).add(new THREE.Vector3(0, -L * 0.12, 0)),
            p0.clone().addScaledVector(d, L).add(new THREE.Vector3(0, -L * 0.18, 0))];
          addTube(wood, pts, [0.018, 0.011, 0.004], 4, { colorFn: () => [0.62, 0.6, 0.58] });
        }
      }
    } else {
      let R = Rmax * Math.pow(1 - t, fir ? 0.85 : 0.95) * (0.82 + rnd() * 0.32);
      if (t < 0.08) R *= 0.7 + t * 3.5;
      const nB = lod === 2 ? 3 : 4 + Math.floor(rnd() * 3);
      for (let k = 0; k < nB; k++) {
        const yaw = baseYaw + (k / nB) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
        const L = R * (0.85 + rnd() * 0.3);
        if (L < 0.12) continue;
        addConiferBranch(wood, leaves, rnd, lod, y, yaw, L, t, trunkAt, trunkR, hue, fir, Rmax);
      }
    }
    y += step * (0.8 + rnd() * 0.4) * (t > 0.7 ? 0.8 : 1);
    whorl++;
  }

  // Leader tip
  const tip = trunkAt(H * 0.95);
  for (let k = 0; k < (lod === 2 ? 2 : 3); k++) {
    const a = (k / 3) * Math.PI;
    const u = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    addCard(leaves, tip.clone().add(new THREE.Vector3(0, -0.15, 0)), UP, u, 0.32, 0.75, hsl(hue, 0.4, 0.3), new THREE.Vector3(u.z, 0.5, -u.x).normalize(), 0.4, 0.3);
  }

  return { wood: wood.build(), leaves: leaves.build(), H, trunkR: r0 };
}

function addConiferBranch(wood, leaves, rnd, lod, y0, yaw, L, t, trunkAt, trunkR, hue, fir, Rmax) {
  const d = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  const p0 = trunkAt(y0).addScaledVector(d, trunkR(y0) * 0.8);
  const pitch = THREE.MathUtils.lerp(fir ? -0.12 : -0.3, 0.55, Math.pow(t, 1.4)) + (rnd() - 0.5) * 0.15;
  const droop = THREE.MathUtils.lerp(fir ? 0.12 : 0.24, 0.04, t) * L;
  const rise = Math.sin(pitch) * L;
  const curve = new THREE.CatmullRomCurve3([
    p0,
    p0.clone().addScaledVector(d, L * 0.33).add(new THREE.Vector3(0, rise * 0.4, 0)),
    p0.clone().addScaledVector(d, L * 0.68).add(new THREE.Vector3(0, rise * 0.7 - droop, 0)),
    p0.clone().addScaledVector(d, L).add(new THREE.Vector3(0, rise * 0.85 - droop * 0.8 + L * 0.07, 0))
  ]);

  if (lod === 0 || (lod === 1 && L > 1.3)) {
    const pts = curve.getPoints(lod === 0 ? 5 : 3);
    const rb = Math.max(0.012, trunkR(y0) * 0.3 * Math.sqrt(L / Rmax));
    const rr = pts.map((_, i) => rb * (1 - (i / (pts.length - 1)) * 0.8));
    addTube(wood, pts, rr, lod === 0 ? 5 : 3, { colorFn: () => [0.55, 0.5, 0.46], flutter: 0.1 });
  }

  // Needle sprays along the branch
  const spacing = lod === 2 ? 0.55 : lod === 1 ? 0.34 : 0.24;
  const nC = Math.max(lod === 2 ? 1 : 2, Math.round(L / spacing));
  const lightBase = 0.17 + t * 0.07;
  for (let k = 0; k < nC; k++) {
    const s = nC === 1 ? 0.6 : 0.12 + (k / (nC - 1)) * 0.86;
    const pt = curve.getPoint(s);
    const tan = curve.getTangent(s);
    const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
    const alt = (k % 2 ? 1 : -1) * (0.35 + rnd() * 0.35);
    const vDir = tan.clone().addScaledVector(side, alt * (1 - s * 0.6)).normalize();
    // roll the spray a little around its axis
    const uDir = new THREE.Vector3().crossVectors(UP, vDir).normalize();
    uDir.applyAxisAngle(vDir, (rnd() - 0.5) * 0.7);
    const sz = (fir ? 0.5 : 0.46) * (1 - s * 0.3) * (0.8 + rnd() * 0.4) * THREE.MathUtils.clamp(L / 1.1, 0.65, 1.25) * (lod === 2 ? 1.8 : 1);
    const h = sz;
    const w = sz * (fir ? 0.62 : 0.7);
    const origin = pt.clone().addScaledVector(vDir, -h * 0.18);
    const outward = new THREE.Vector3(pt.x, 0, pt.z).normalize().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.6, 0)).normalize();
    // Inner sprays darker (self shadowing), tips and upper crown brighter
    const ao = 0.62 + 0.38 * s;
    const light = lightBase * ao + (s > 0.85 && rnd() < 0.35 ? 0.06 : 0);
    const col = hsl(hue + (rnd() - 0.5) * 0.02, fir ? 0.42 : 0.36, light * 2.2);
    addCard(leaves, origin, vDir, uDir, w, h, col, outward, 0.6, 0.15 + s * 0.3);
    if (lod === 0) {
      const u2 = uDir.clone().applyAxisAngle(vDir, Math.PI * 0.5 + (rnd() - 0.5) * 0.5);
      addCard(leaves, origin, vDir, u2, w * 0.7, h * 0.92, col.map(c => c * 0.88), outward, 0.6, 0.15 + s * 0.3);
    }
  }
}

// ---------------------------------------------------------------------------
// Broadleaf & birch
// ---------------------------------------------------------------------------
function randomPerp(dir, rnd) {
  const a = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5);
  a.sub(_v.copy(dir).multiplyScalar(a.dot(dir)));
  if (a.lengthSq() < 1e-4) a.set(1, 0, 0);
  return a.normalize();
}

function buildBroadleaf(seed, lod, birch = false) {
  const rnd = mulberry32(seed);
  const H = birch ? 10 : 11;
  const wood = new GeoBuilder();
  const leaves = new GeoBuilder();
  const crownC = new THREE.Vector3(0, H * (birch ? 0.66 : 0.64), 0);
  const hue = birch ? 0.21 + rnd() * 0.02 : 0.23 + rnd() * 0.035;
  const r0 = H * (birch ? 0.017 : 0.028);
  const mossDir = rnd() * Math.PI * 2;
  const maxLevel = 2;
  const cardSize = birch ? 0.52 : 0.78;

  const radialFor = (level) => lod === 2 ? (level === 0 ? 5 : 3) : lod === 1 ? [8, 5, 3][level] : [12, 7, 4][level];

  function leafCards(curve, level, len) {
    const spacing = lod === 2 ? 0.7 : lod === 1 ? 0.42 : 0.3;
    const n = Math.max(1, Math.round((len * (level === 1 ? 0.45 : 0.85)) / spacing));
    for (let k = 0; k < n; k++) {
      const s = level === 1 ? 0.6 + 0.4 * (k / Math.max(1, n - 1)) : 0.15 + 0.85 * (k / Math.max(1, n - 1));
      const pt = curve.getPoint(Math.min(1, s));
      const tan = curve.getTangent(Math.min(1, s));
      const outward = pt.clone().sub(crownC);
      outward.y *= 0.6;
      outward.normalize();
      const vDir = new THREE.Vector3()
        .addScaledVector(outward, 0.6)
        .addScaledVector(tan, 0.6)
        .add(new THREE.Vector3((rnd() - 0.5) * 0.9, birch ? -0.55 - rnd() * 0.4 : (rnd() - 0.3) * 0.8, (rnd() - 0.5) * 0.9))
        .normalize();
      const uDir = randomPerp(vDir, rnd);
      const sz = cardSize * (0.75 + rnd() * 0.5) * (lod === 2 ? 1.9 : lod === 1 ? 1.25 : 1);
      const depth = THREE.MathUtils.clamp(pt.distanceTo(crownC) / (H * 0.35), 0, 1);
      const light = (birch ? 0.3 : 0.24) * (0.6 + 0.4 * depth) + (pt.y / H) * 0.05;
      const col = hsl(hue + (rnd() - 0.5) * 0.03, birch ? 0.45 : 0.4, light * 1.9);
      addCard(leaves, pt.clone().addScaledVector(vDir, -sz * 0.1), vDir, uDir, sz, sz, col, outward, 0.7, 0.25);
      if (lod === 0 && rnd() < 0.7) {
        const u2 = uDir.clone().applyAxisAngle(vDir, Math.PI * 0.5);
        addCard(leaves, pt, vDir, u2, sz * 0.85, sz * 0.85, col.map(c => c * 0.9), outward, 0.7, 0.25);
      }
    }
  }

  function grow(p, dir, len, r, level) {
    const nseg = level === 0 ? (lod === 2 ? 4 : 9) : lod === 2 ? 3 : 5;
    const gnarl = [birch ? 0.03 : 0.07, birch ? 0.12 : 0.2, 0.26][level];
    const trop = [0.05, birch ? 0.1 : 0.06, birch ? -0.12 : 0.02][level];
    const pts = [p.clone()];
    const d = dir.clone();
    for (let i = 1; i <= nseg; i++) {
      d.add(new THREE.Vector3((rnd() - 0.5) * gnarl, (rnd() - 0.5) * gnarl + trop, (rnd() - 0.5) * gnarl)).normalize();
      pts.push(pts[i - 1].clone().addScaledVector(d, len / nseg));
    }
    const radii = pts.map((_, i) => r * (1 - (i / nseg) * (level === 0 ? 0.45 : 0.7)) + 0.004);
    const curve = new THREE.CatmullRomCurve3(pts);
    if (r > 0.007 && !(lod === 2 && level === 2)) {
      addTube(wood, pts, radii, radialFor(level), {
        barkScale: birch ? 0.55 : 0.4,
        vScale: birch ? 1.4 : 0.6,
        flutter: level === 0 ? 0 : 0.08 * level,
        radiusFn: level === 0 ? (i, th) => {
          const y = pts[i].y;
          return radii[i] * (1 + Math.exp(-y / 0.5) * (0.6 + 0.3 * Math.sin(th * 4 + seed)));
        } : null,
        colorFn: level === 0 ? (i, th) => {
          const y = pts[i].y;
          const ao = 0.6 + 0.4 * Math.min(1, y / 1.3);
          const moss = birch ? 0 : Math.max(0, 1 - y / 2.2) * Math.max(0, Math.cos(th - mossDir)) * 0.8;
          return [ao * (1 - moss * 0.45), ao * (1 - moss * 0.1), ao * (1 - moss * 0.5)];
        } : () => [0.8, 0.8, 0.8]
      });
    }

    if (level >= 1) leafCards(curve, level, len);
    if (level >= maxLevel) return;

    let kids, sMin, sMax, angMin, angMax, lenF;
    if (level === 0) {
      kids = birch ? 7 + Math.floor(rnd() * 4) : 3 + Math.floor(rnd() * 2);
      sMin = birch ? 0.3 : 0.78; sMax = birch ? 0.95 : 1.0;
      angMin = birch ? 0.75 : 0.45; angMax = birch ? 1.1 : 0.8;
      lenF = birch ? 0.42 : 0.72;
    } else {
      kids = lod === 2 ? 3 : 6 + Math.floor(rnd() * 3);
      sMin = 0.2; sMax = 0.95;
      angMin = 0.6; angMax = 1.1;
      lenF = 0.5;
    }
    let az = rnd() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const s = sMin + (sMax - sMin) * (kids === 1 ? 0.5 : k / (kids - 1)) + (rnd() - 0.5) * 0.06;
      const sp = curve.getPoint(Math.min(1, Math.max(0, s)));
      const st = curve.getTangent(Math.min(1, Math.max(0, s)));
      az += 2.39996; // golden angle
      const perp = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
      perp.sub(_v.copy(st).multiplyScalar(perp.dot(st))).normalize();
      const ang = angMin + rnd() * (angMax - angMin);
      const cd = st.clone().multiplyScalar(Math.cos(ang)).addScaledVector(perp, Math.sin(ang)).normalize();
      // shorter children near the top of birches give the narrow crown
      const taper = level === 0 && birch ? (1 - s) * 0.9 + 0.35 : 1;
      const cl = len * lenF * (0.8 + rnd() * 0.4) * taper * (level === 0 && !birch ? 1.0 : 1);
      const cr = radii[Math.min(radii.length - 1, Math.round(s * nseg))] * (level === 0 ? (birch ? 0.35 : 0.62) : 0.5);
      grow(sp, cd, cl, cr, level + 1);
    }
  }

  const trunkLen = birch ? H * 0.88 : H * (0.36 + rnd() * 0.08);
  const trunkDir = new THREE.Vector3((rnd() - 0.5) * 0.08, 1, (rnd() - 0.5) * 0.08).normalize();
  grow(new THREE.Vector3(0, -0.05, 0), trunkDir, trunkLen, r0, 0);

  // Broadleaf: limbs from the fork need extra length to fill the crown
  return { wood: wood.build(), leaves: leaves.build(), H, trunkR: r0 };
}

// Far trees can't be reached by the camp's lanterns, fire or headlights, so
// their shaders skip the point/spot light loops entirely (big fill-rate win).
export function stripLocalLights(material) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    const chunk = THREE.ShaderChunk.lights_fragment_begin
      .replace('#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0')
      .replace('#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )', '#if 0');
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', chunk);
  };
  const prevKey = material.customProgramCacheKey;
  material.customProgramCacheKey = () => (prevKey ? prevKey.call(material) : '') + '_far';
  return material;
}

// ---------------------------------------------------------------------------
// Forest assembly
// ---------------------------------------------------------------------------
export function createCampTrees() {
  const forestGroup = new THREE.Group();
  forestGroup.name = 'CampForest';
  const useA2C = !IS_MOBILE;

  const barkMats = {};
  const makeBark = (kind) => {
    const maps = getTreeBarkMaps(kind);
    const m = new THREE.MeshStandardMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughnessMap: maps.roughnessMap,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.45
    });
    applyWind(m, 'tree');
    barkMats[kind] = m;
    return m;
  };
  makeBark('conifer');
  makeBark('broad');
  makeBark('birch');

  // Foliage: alpha-to-coverage for soft edges, normals not flipped on back faces
  // (crown normals are pre-bent outward so both sides light like a volume).
  const foliageMats = [];
  const makeFoliage = (map, alphaTest) => {
    const m = new THREE.MeshStandardMaterial({
      map,
      alphaTest,
      alphaToCoverage: useA2C,
      side: THREE.DoubleSide,
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.0,
      envMapIntensity: 0.35
    });
    applyWind(m, 'tree');
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (shader, r) => {
      prev(shader, r);
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '')
      );
      // Soft translucency: light passing through leaves from behind
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += diffuseColor.rgb * 0.045;`
      );
    };
    foliageMats.push(m);
    return m;
  };
  const needleMat = makeFoliage(getNeedleSprayTexture(), 0.42);
  const leafMat = makeFoliage(getLeafClusterTexture('broad'), 0.45);
  const birchLeafMat = makeFoliage(getLeafClusterTexture('birch'), 0.45);

  const farOf = new Map();
  const farMaterial = (m) => {
    if (!farOf.has(m)) {
      const f = m.clone();
      f.onBeforeCompile = m.onBeforeCompile;
      f.customProgramCacheKey = m.customProgramCacheKey;
      stripLocalLights(f);
      farOf.set(m, f);
      if (foliageMats.includes(m)) foliageMats.push(f);
      else barkFar.push({ src: m, far: f });
    }
    return farOf.get(m);
  };
  const barkFar = [];

  const needleDepth = windDepthMaterial(needleMat.map, 0.42);
  const leafDepth = windDepthMaterial(leafMat.map, 0.45);
  const birchDepth = windDepthMaterial(birchLeafMat.map, 0.45);
  const woodDepth = windDepthMaterial(null, 0);

  // --- Variants -------------------------------------------------------------
  const variantDefs = {
    spruce: { count: [3, 2, 1], build: (s, l) => buildConifer(s, l, false), bark: 'conifer', leaf: needleMat, depth: needleDepth },
    fir: { count: [2, 1, 1], build: (s, l) => buildConifer(s, l, true), bark: 'conifer', leaf: needleMat, depth: needleDepth },
    broad: { count: [2, 1, 1], build: (s, l) => buildBroadleaf(s, l, false), bark: 'broad', leaf: leafMat, depth: leafDepth },
    birch: { count: [2, 1, 1], build: (s, l) => buildBroadleaf(s, l, true), bark: 'birch', leaf: birchLeafMat, depth: birchDepth }
  };
  const variants = {};
  Object.entries(variantDefs).forEach(([kind, def]) => {
    variants[kind] = [0, 1, 2].map(lod => {
      const list = [];
      for (let i = 0; i < def.count[lod]; i++) list.push(def.build(1000 + i * 131 + kind.length * 17 + lod * 7, lod));
      return list;
    });
  });

  // --- Instance placement ---------------------------------------------------
  const buckets = new Map();
  const colliders = [];
  TREE_LAYOUT.forEach((t, idx) => {
    const lod = t.lod;
    const kind = t.kind;
    const list = variants[kind][lod];
    const vi = Math.floor((Math.abs(Math.sin(t.seed * 12.9898)) * 43758.5453) % list.length);
    const key = `${kind}|${lod}|${vi}`;
    if (!buckets.has(key)) buckets.set(key, { kind, lod, v: list[vi], items: [] });
    buckets.get(key).items.push(t);
    if (lod < 2) {
      const s = (t.h / list[vi].H) * t.scale;
      colliders.push({ type: 'circle', x: t.x, z: t.z, r: Math.max(0.28, list[vi].trunkR * s * 1.35 + 0.12) });
    }
    void idx;
  });

  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  buckets.forEach(({ kind, lod, v, items }) => {
    const def = variantDefs[kind];
    // Trees beyond the clearing never receive camp light
    const far = lod > 0 || items.every(t => Math.hypot(t.x - 1.5, t.z - 1.5) > 13);
    const woodMat = far ? farMaterial(barkMats[def.bark]) : barkMats[def.bark];
    const leafMatUse = far ? farMaterial(def.leaf) : def.leaf;
    const woodMesh = new THREE.InstancedMesh(v.wood, woodMat, items.length);
    const leafMesh = new THREE.InstancedMesh(v.leaves, leafMatUse, items.length);
    items.forEach((t, i) => {
      const s = (t.h / v.H) * t.scale;
      const gy = Math.abs(t.x) < 29.5 && Math.abs(t.z) < 29.5 ? groundHeight(t.x, t.z) : -0.32;
      dummy.position.set(t.x, gy - 0.05, t.z);
      dummy.rotation.set(0, t.yaw, 0);
      dummy.scale.set(s * (0.94 + (t.seed % 0.12)), s, s * (0.94 + ((t.seed * 3.1) % 0.12)));
      dummy.updateMatrix();
      woodMesh.setMatrixAt(i, dummy.matrix);
      leafMesh.setMatrixAt(i, dummy.matrix);
      // gentle per-tree colour variety; far trees fade a touch bluer/darker
      const r = (Math.sin(t.seed * 3.7) * 0.5 + 0.5);
      tint.setRGB(0.9 + r * 0.18, 0.92 + r * 0.14, 0.88 + (1 - r) * 0.12);
      if (lod === 2) tint.multiplyScalar(0.85);
      leafMesh.setColorAt(i, tint);
      woodMesh.setColorAt(i, tint.setRGB(1, 1, 1));
    });
    woodMesh.instanceMatrix.needsUpdate = true;
    leafMesh.instanceMatrix.needsUpdate = true;
    if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
    if (woodMesh.instanceColor) woodMesh.instanceColor.needsUpdate = true;
    woodMesh.castShadow = leafMesh.castShadow = lod === 0;
    woodMesh.receiveShadow = leafMesh.receiveShadow = lod < 2;
    woodMesh.customDepthMaterial = woodDepth;
    leafMesh.customDepthMaterial = def.depth;
    woodMesh.computeBoundingSphere();
    leafMesh.computeBoundingSphere();
    forestGroup.add(woodMesh, leafMesh);
  });

  return {
    group: forestGroup,
    colliders,
    setWetness: (amount) => {
      [...Object.values(barkMats), ...barkFar.map(b => b.far)].forEach(m => {
        m.roughness = THREE.MathUtils.lerp(0.95, 0.5, amount);
        m.color.setScalar(THREE.MathUtils.lerp(1.0, 0.72, amount));
      });
      foliageMats.forEach(m => {
        m.roughness = THREE.MathUtils.lerp(0.78, 0.42, amount);
        m.envMapIntensity = THREE.MathUtils.lerp(0.35, 0.6, amount);
      });
    },
    update: () => {}
  };
}
