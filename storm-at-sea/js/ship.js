import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  rng, makeContainerTextures, makeHullTextures, makeTransomTexture, makeDeckTexture,
  makeFacade, makeBridgeTexture, makeFunnelTexture, makeGlowTexture,
} from './textures.js';

/*
  Procedural post-Panamax container ship.
  Local frame: +x = bow, +y = up, +z = starboard. Origin at midship on the design waterline.
*/

const lerp = THREE.MathUtils.lerp;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sstep = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20, 1);
const CYL8 = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
const ROD = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true);
const SPH = new THREE.SphereGeometry(1, 22, 14);
const UP = new THREE.Vector3(0, 1, 0);

function M(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  );
}

// Collects primitives per material and merges them into a single draw call each.
class Batch {
  constructor() { this.map = new Map(); }
  add(mat, geo, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (m) g.applyMatrix4(m);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(g);
  }
  box(mat, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) { this.add(mat, BOX, M(x, y, z, rx, ry, rz, sx, sy, sz)); }
  cyl(mat, x, y, z, r, h, rx = 0, ry = 0, rz = 0, geo = CYL) { this.add(mat, geo, M(x, y, z, rx, ry, rz, r, h, r)); }
  sph(mat, x, y, z, sx, sy = sx, sz = sx) { this.add(mat, SPH, M(x, y, z, 0, 0, 0, sx, sy, sz)); }
  rod(mat, a, b, r, geo = ROD) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    if (len < 1e-3) return;
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.divideScalar(len));
    this.add(mat, geo, new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(r, len, r)));
  }
  // wall panel between two xz points
  wall(mat, a, b, y0, h, t) {
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
    this.box(mat, (a.x + b.x) / 2, y0 + h / 2, (a.z + b.z) / 2, len, h, t, 0, Math.atan2(-dz, dx), 0);
  }
  rail(mat, pts, h = 1.1, spacing = 1.9, r = 0.035) {
    let since = spacing;
    const up = (p, dy) => V3(p.x, p.y + dy, p.z);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i > 0) since += p.distanceTo(pts[i - 1]);
      if (since >= spacing || i === pts.length - 1) { this.rod(mat, p, up(p, h), r); since = 0; }
      if (i > 0) {
        const a = pts[i - 1];
        this.rod(mat, up(a, h), up(p, h), r * 1.15);
        this.rod(mat, up(a, h * 0.52), up(p, h * 0.52), r * 0.8);
      }
    }
  }
  build(parent) {
    for (const [mat, list] of this.map) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      parent.add(mesh);
    }
    this.map.clear();
  }
}

/* ---------------------------------------------------------------- hull form */

function hullModel(L, B, D, T) {
  const half = B / 2;
  const xF = (hn) => L / 2 - 5.5 + 5.5 * Math.pow(hn, 1.3); // raked stem
  const xA = (hn) => -L / 2 + 8 * Math.pow(1 - hn, 1.5);   // transom overhang
  const width = (u, hn) => {
    let f = 1;
    if (u > 0.68) { // fine entrance, strong flare up high
      const s = (u - 0.68) / 0.32;
      const e = lerp(1.55, 4.6, Math.pow(hn, 0.75));
      f *= Math.max(0, 1 - Math.pow(s, e));
    }
    if (u < 0.24) { // run aft into the skeg, wide transom above
      const s = (0.24 - u) / 0.24;
      const k = lerp(0.97, 0.1, sstep(0.28, 0.72, hn));
      f *= 1 - k * Math.pow(s, 1.25);
    }
    return f;
  };
  const rise = (u) => {
    let r = 0;
    if (u < 0.2) r += 9.5 * Math.pow((0.2 - u) / 0.2, 2.1);
    if (u > 0.9) r += 8 * Math.pow((u - 0.9) / 0.1, 2.2);
    return r;
  };
  const sheer = (u) => (u > 0.72 ? 2.6 * Math.pow((u - 0.72) / 0.28, 2) : 0) + (u < 0.15 ? 0.8 * Math.pow((0.15 - u) / 0.15, 2) : 0);
  const point = (u, bz, by) => {
    const hn = by / D;
    return [lerp(xA(hn), xF(hn), u), by + rise(u) * (1 - hn) + sheer(u) * hn - T, bz * width(u, hn)];
  };
  const uDeck = (x) => clamp01((x + L / 2) / L);
  const deckY = (x) => D + sheer(uDeck(x)) - T;
  const halfB = (x) => { const u = (x + L / 2) / L; return u <= 0 || u >= 1 ? 0 : half * width(u, 1); };
  const halfBAt = (x, y) => {
    const hn = clamp01((y + T) / D);
    const u = (x - xA(hn)) / (xF(hn) - xA(hn));
    return u <= 0 || u >= 1 ? 0 : half * width(u, hn);
  };
  return { point, deckY, halfB, halfBAt, xA, xF };
}

function buildHullGeometry(H, L, B, D, T) {
  const R = 2.8, half = B / 2;
  const sec = [];
  for (let i = 0; i < 5; i++) sec.push([(half - R) * i / 5, 0]);
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * i / 8; sec.push([half - R + R * Math.cos(a), R + R * Math.sin(a)]); }
  for (let i = 1; i <= 18; i++) sec.push([half, R + (D - R) * i / 18]);
  const NP = sec.length, NS = 180;
  const us = [];
  for (let i = 0; i <= NS; i++) { const t = i / NS; us.push(t * 0.5 + (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.5); }
  const VH = D + 3;

  const pos = [], uv = [], idx = [];
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= NS; i++) for (let j = 0; j < NP; j++) {
      const [x, y, z] = H.point(us[i], sec[j][0], sec[j][1]);
      pos.push(x, y, z * side);
      const U = side > 0 ? (x + L / 2) / L : (L / 2 - x) / L;
      const va = clamp01((y + T) / VH);
      uv.push(U, side > 0 ? 0.5 + 0.5 * va : 0.5 * va * 0.999);
    }
    for (let i = 0; i < NS; i++) for (let j = 0; j < NP - 1; j++) {
      const a = base + i * NP + j, b = base + (i + 1) * NP + j, c = b + 1, d = a + 1;
      if (side > 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
    }
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hull.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  hull.setIndex(idx);
  hull.computeVertexNormals();

  // deck
  const dp = [], duv = [], di = [];
  const edge = [];
  for (let i = 0; i <= NS; i++) {
    const [x, y, z] = H.point(us[i], half, D);
    edge.push(V3(x, y, z));
    dp.push(x, y, -z, x, y, z);
    duv.push(x / 9, -z / 9, x / 9, z / 9);
    if (i < NS) { const k = i * 2; di.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const deck = new THREE.BufferGeometry();
  deck.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  deck.setAttribute('uv', new THREE.Float32BufferAttribute(duv, 2));
  deck.setIndex(di);
  deck.computeVertexNormals();

  // transom
  const tp = [], tuv = [], ti = [];
  const ring = [];
  for (let j = 0; j < NP; j++) { const [x, y, z] = H.point(0, sec[j][0], sec[j][1]); ring.push([x, y, z]); }
  for (let j = NP - 1; j >= 0; j--) { const [x, y, z] = H.point(0, sec[j][0], sec[j][1]); ring.push([x, y, -z]); }
  let cx = 0, cy = 0;
  ring.forEach((p) => { cx += p[0]; cy += p[1]; });
  cx /= ring.length; cy /= ring.length;
  tp.push(cx, cy, 0); tuv.push(0.5, (cy + T) / VH);
  ring.forEach((p) => { tp.push(p[0], p[1], p[2]); tuv.push(p[2] / B + 0.5, (p[1] + T) / VH); });
  for (let k = 1; k < ring.length; k++) ti.push(0, k, k + 1 > ring.length ? 1 : k + 1);
  const transom = new THREE.BufferGeometry();
  transom.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  transom.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
  transom.setIndex(ti);
  transom.computeVertexNormals();

  return { hull, deck, transom, edge };
}

/* ------------------------------------------------------------ shared assets */

let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const ct = makeContainerTextures();
  const cmat = (map, bump) => new THREE.MeshStandardMaterial({ map, bumpMap: bump || null, bumpScale: 1.2, roughness: 0.6, metalness: 0.35, envMapIntensity: 0.6 });
  const end = cmat(ct.door), roof = cmat(ct.roof);
  const mats40 = ct.sides40.map((s) => { const side = cmat(s.map, s.bump); return [end, end, roof, roof, side, side]; });
  const mats20 = ct.sides20.map((s) => { const side = cmat(s.map, s.bump); return [end, end, roof, roof, side, side]; });
  const std = (color, roughness = 0.55, metalness = 0.3, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 0.7, ...extra });
  SHARED = {
    mats40, mats20,
    geo40: new THREE.BoxGeometry(12.19, 1, 2.44),
    geo20: new THREE.BoxGeometry(6.06, 1, 2.44),
    glow: makeGlowTexture(),
    deckTex: makeDeckTexture(),
    m: {
      white: std('#dcddd7', 0.48, 0.25),
      offwhite: std('#c9cbc5', 0.5, 0.3),
      light: std('#bfc2bd', 0.5, 0.45),
      grey: std('#8b9092', 0.5, 0.5),
      dark: std('#26292b', 0.55, 0.6),
      black: std('#111213', 0.6, 0.4),
      rail: std('#d4d5cf', 0.45, 0.4),
      yellow: std('#c99b22', 0.5, 0.3),
      orange: std('#e2601a', 0.42, 0.1),
      equip: std('#4f6158', 0.55, 0.35),
      red: std('#6d2219', 0.75, 0.15),
      bronze: std('#b58d4f', 0.28, 1.0, { envMapIntensity: 1.2 }),
      glass: std('#0b1418', 0.06, 0.9, { envMapIntensity: 1.3 }),
      hatch: std('#46564e', 0.65, 0.35),
      steelBlue: std('#33495a', 0.5, 0.4),
    },
  };
  return SHARED;
}

const PALETTE = [
  ['#2f6fa3', 9], ['#1f4f7a', 7], ['#9a2a22', 8], ['#6e1f1a', 6], ['#c96a1e', 5], ['#d79a26', 3],
  ['#2f6a3c', 4], ['#3c7f6c', 3], ['#6c7174', 7], ['#d8d8d2', 5], ['#22314a', 5], ['#5a2c1f', 3],
  ['#b0435f', 2], ['#e4ddc6', 2], ['#7a8a2e', 1], ['#4d93b8', 3],
];

/* -------------------------------------------------------------------- ship */

export function buildShip(o = {}) {
  const L = o.L ?? 230;
  const B = o.B ?? +(L * 0.14).toFixed(1);
  const D = o.D ?? L * 0.083;
  const T = o.T ?? L * 0.05;
  const stackMax = o.stackMax ?? 7;
  const r = rng(o.seed ?? 1);
  const S = shared();
  const m = S.m;
  const group = new THREE.Group();
  const batch = new Batch();
  const glowMats = [], sprites = [];
  // emissive materials whose intensity follows the time of day
  const glow = (mat) => { mat.userData.baseGlow = mat.emissiveIntensity; glowMats.push(mat); return mat; };

  const H = hullModel(L, B, D, T);
  const G = buildHullGeometry(H, L, B, D, T);
  const { deckY, halfB, halfBAt } = H;

  /* ---- hull materials */
  const ht = makeHullTextures({ L, D, T, W: o.texW ?? 4096, hull: o.hull ?? '#14212b', red: o.red, boot: o.boot, name: o.name ?? 'MERIDIAN STAR', brand: o.brand, brandColor: o.brandColor, seed: o.seed ?? 1,
    brandX: o.brandX ?? -6, brandH: o.brandH ?? 5.6, brandSpacing: o.brandSpacing ?? 0.9, bowStripes: !!o.bowStripes, bowMark: o.bowMark, sheerLine: o.sheerLine });
  const hullMat = new THREE.MeshStandardMaterial({ map: ht.map, bumpMap: ht.bump, bumpScale: 1.5, roughness: 0.46, metalness: 0.35, envMapIntensity: 0.85 });
  const hullPlain = new THREE.MeshStandardMaterial({ color: o.hull ?? '#14212b', roughness: 0.48, metalness: 0.35, envMapIntensity: 0.85 });
  const deckMat = new THREE.MeshStandardMaterial({ map: S.deckTex, roughness: 0.62, metalness: 0.3, envMapIntensity: 0.6 });
  const transomMat = new THREE.MeshStandardMaterial({ map: makeTransomTexture({ B, D, T, hull: o.hull ?? '#14212b', red: o.red, name: o.name ?? 'MERIDIAN STAR', port: o.port ?? 'MONROVIA' }), roughness: 0.48, metalness: 0.35, envMapIntensity: 0.85 });
  group.add(new THREE.Mesh(G.hull, hullMat));
  group.add(new THREE.Mesh(G.deck, deckMat));
  group.add(new THREE.Mesh(G.transom, transomMat));

  /* ---- underwater body: bulb, skeg, bilge keels, rudder, shaft */
  batch.sph(m.red, L / 2 - 7.5, -T + 5.3, 0, 8.5, 3.1, 2.6);
  batch.box(m.red, -L / 2 + 13.5, -T + 4.2, 0, 13, 5.5, 1.3);
  for (const s of [1, -1]) batch.box(m.red, 0, -T + 0.9, s * (B / 2 - 1.6), 80, 0.12, 1.0, s * 0.75, 0, 0);
  batch.box(m.red, -L / 2 + 3.4, -T + 7.2, 0, 4.8, 14, 0.9);
  batch.cyl(m.bronze, -L / 2 + 10.5, -T + 4.5, 0, 0.42, 7, 0, 0, Math.PI / 2);

  /* ---- propeller */
  const prop = new THREE.Group();
  {
    const pb = new Batch();
    pb.cyl(m.bronze, 0, 0, 0, 0.95, 1.9, 0, 0, Math.PI / 2);
    pb.add(m.bronze, new THREE.ConeGeometry(0.95, 1.4, 20), M(-1.6, 0, 0, 0, 0, Math.PI / 2));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      const mat = new THREE.Matrix4().makeRotationX(a)
        .multiply(new THREE.Matrix4().makeTranslation(0, 2.05, 0))
        .multiply(new THREE.Matrix4().makeRotationY(0.65))
        .multiply(new THREE.Matrix4().makeScale(0.16, 1.75, 1.1));
      pb.add(m.bronze, SPH, mat);
    }
    pb.build(prop);
    prop.position.set(-L / 2 + 6.6, -T + 4.5, 0);
    group.add(prop);
  }

  /* ---- layout */
  // classic layout: bridge aft-midships with a separate funnel; ULCV layout: bridge well forward, engine block aft
  const ulcv = o.layout === 'ulcv';
  const xH = -L / 2 + (ulcv ? 0.64 : 0.32) * L, hLen = 12.5, hW = ulcv ? 18 : Math.min(B - 6, 26);
  const xFun = -L / 2 + (ulcv ? 0.13 : 0.155) * L, fLen = ulcv ? 14 : 11;
  const lashMat = o.lashColor ? new THREE.MeshStandardMaterial({ color: o.lashColor, roughness: 0.55, metalness: 0.4, envMapIntensity: 0.7 }) : m.light;
  const bulMat = o.bulwark ? new THREE.MeshStandardMaterial({ color: o.bulwark, roughness: 0.5, metalness: 0.3, envMapIntensity: 0.7 }) : null;
  const xFc = L / 2 - 30, xBw = xFc - 3.5;
  const C40 = 12.19, ROWP = 2.45, P = 14.2;
  const bays = [];
  for (let x = xH + hLen / 2 + 1.6 + C40 / 2; x + C40 / 2 < xBw - 1.5; x += P) bays.push({ x, reg: 'fwd' });
  for (let x = xH - hLen / 2 - 1.6 - C40 / 2; x - C40 / 2 > xFun + fLen / 2 + 1.2; x -= P) bays.push({ x, reg: 'mid' });
  for (let x = xFun - fLen / 2 - 1.6 - C40 / 2; x - C40 / 2 > -L / 2 + 13; x -= P) bays.push({ x, reg: 'aft' });

  const pick = () => {
    const pal = o.palette ?? PALETTE;
    let tot = 0; for (const p of pal) tot += p[1];
    let v = r() * tot;
    for (const p of pal) { v -= p[1]; if (v <= 0) return p[0]; }
    return pal[0][0];
  };

  const c40 = S.mats40.map(() => []), c20 = S.mats20.map(() => []);
  const lash = [];
  let maxStackTop = 0;
  for (const bay of bays) {
    const bx = bay.x;
    const base = deckY(bx) + 1.85;
    const hb = Math.min(halfB(bx - C40 / 2), halfB(bx + C40 / 2)) - 0.2;
    const rows = Math.floor((2 * hb) / ROWP);
    if (rows < 2) continue;
    let cap = stackMax;
    if (bay.reg === 'fwd') { const t = (bx - xH) / (xBw - xH); cap = Math.round(stackMax - t * t * 3.4 - t * 0.8); }
    if (bay.reg === 'aft') cap = stackMax - 1;
    bay.base = base; bay.hb = hb; bay.rows = rows;

    // hatch coaming + covers
    batch.box(m.hatch, bx, base - 1.4, 0, C40 + 0.8, 0.9, rows * ROWP + 0.6);
    batch.box(m.hatch, bx, base - 0.55, 0, C40 + 1.0, 0.8, rows * ROWP + 0.4);
    for (let k = -1; k <= 1; k += 2) batch.box(m.dark, bx + k * 3.05, base - 0.13, 0, 0.12, 0.06, rows * ROWP);

    const bayCol = pick();
    for (let ri = 0; ri < rows; ri++) {
      const z = (ri - (rows - 1) / 2) * ROWP;
      const outer = ri === 0 || ri === rows - 1;
      let tiers = cap - (outer && r() < 0.5 ? 1 : 0);
      if (r() < 0.22) tiers -= 1 + Math.floor(r() * 2);
      if (r() < 0.035) tiers = 0;
      tiers = Math.max(0, tiers);
      const twenty = r() < 0.2;
      let y = base;
      for (let t = 0; t < tiers; t++) {
        const h = r() < 0.55 ? 2.896 : 2.591;
        const top = t === tiers - 1;
        const shade = Math.min(1.05, 0.6 + 0.24 * (t / Math.max(1, cap - 1)) + (outer ? 0.12 : 0) + (top ? 0.1 : 0) + (r() - 0.5) * 0.12);
        const make = () => new THREE.Color(r() < 0.4 ? bayCol : pick()).multiplyScalar(shade);
        if (twenty) {
          for (const dx of [-3.06, 3.06]) c20[Math.floor(r() * c20.length)].push({ x: bx + dx, y: y + h / 2, z, h, c: make() });
        } else {
          c40[Math.floor(r() * c40.length)].push({ x: bx, y: y + h / 2, z, h, c: make() });
        }
        if (t === 1) {
          // cross lashing rods on both bay ends
          for (const e of [-1, 1]) {
            const ex = bx + e * (C40 / 2 + 0.06);
            const yTop = y + h;
            lash.push(ex, base + 0.1, z - 0.95, ex, yTop, z + 1.15, ex, base + 0.1, z + 0.95, ex, yTop, z - 1.15);
            lash.push(ex, base + 0.1, z - 0.95, ex, y, z + 1.15, ex, base + 0.1, z + 0.95, ex, y, z - 1.15);
          }
        }
        y += h + 0.02;
      }
      maxStackTop = Math.max(maxStackTop, y);
    }
  }

  // instanced containers
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const makeInst = (list, geo, mats) => {
    if (!list.length) return;
    const im = new THREE.InstancedMesh(geo, mats, list.length);
    list.forEach((c, i) => {
      tmpM.compose(tmpP.set(c.x, c.y, c.z), tmpQ, tmpS.set(1, c.h, 1));
      im.setMatrixAt(i, tmpM);
      im.setColorAt(i, c.c);
    });
    im.instanceMatrix.needsUpdate = true;
    im.instanceColor.needsUpdate = true;
    im.frustumCulled = false;
    group.add(im);
  };
  c40.forEach((l, i) => makeInst(l, S.geo40, S.mats40[i]));
  c20.forEach((l, i) => makeInst(l, S.geo20, S.mats20[i]));
  if (lash.length) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lash, 3));
    group.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2d2e, transparent: true, opacity: 0.85 })));
  }

  /* ---- lashing bridges */
  const bridgeXs = [];
  for (const bay of bays) {
    if (!bay.rows) continue;
    for (const e of [-1, 1]) {
      const x = bay.x + e * (C40 / 2 + 0.85);
      if (Math.abs(x - xH) < hLen / 2 + 0.6) continue;
      if (Math.abs(x - xFun) < fLen / 2 + 0.6) continue;
      if (x > xBw - 0.8 || x < -L / 2 + 12) continue;
      const near = bridgeXs.find((b) => Math.abs(b.x - x) < 1.6);
      if (near) { near.x = (near.x + x) / 2; continue; }
      bridgeXs.push({ x, base: bay.base, rows: bay.rows });
    }
  }
  for (const lb of bridgeXs) {
    const w = lb.rows * ROWP + 0.4, y0 = lb.base, hgt = 5.6;
    for (let k = 0; k <= lb.rows; k++) {
      const z = (k - lb.rows / 2) * ROWP;
      for (const dx of [-0.55, 0.55]) batch.box(lashMat, lb.x + dx, y0 + hgt / 2, z, 0.16, hgt, 0.16);
    }
    for (const yy of [2.65, 5.35]) {
      batch.box(lashMat, lb.x, y0 + yy, 0, 1.3, 0.08, w);
      batch.rod(m.yellow, V3(lb.x - 0.62, y0 + yy + 1.0, -w / 2), V3(lb.x - 0.62, y0 + yy + 1.0, w / 2), 0.04);
      batch.rod(m.yellow, V3(lb.x + 0.62, y0 + yy + 1.0, -w / 2), V3(lb.x + 0.62, y0 + yy + 1.0, w / 2), 0.04);
    }
    // access ladders at the ends
    for (const s of [-1, 1]) batch.box(lashMat, lb.x, y0 + hgt / 2, s * (w / 2 + 0.3), 0.7, hgt, 0.08);
  }

  /* ---- breakwater */
  {
    const yb = deckY(xBw), hbw = halfB(xBw) - 0.5, hgt = 6.2;
    const apex = V3(xBw + 2.8, 0, 0);
    for (const s of [-1, 1]) {
      const end = V3(xBw - 0.6, 0, s * hbw);
      batch.wall(bulMat || m.white, apex, end, yb, hgt, 0.25);
      for (let t = 0.08; t < 1; t += 0.11) {
        const p = apex.clone().lerp(end, t);
        batch.box(m.offwhite, p.x - 0.55, yb + hgt * 0.45, p.z, 0.9, hgt * 0.9, 0.12, 0, Math.atan2(-(end.z - apex.z), end.x - apex.x), 0);
      }
      batch.wall(m.offwhite, V3(apex.x - 0.2, 0, 0), V3(end.x - 0.2, 0, end.z), yb + hgt, 0.18, 0.9);
    }
  }

  /* ---- forecastle */
  const fcTop = deckY(L / 2) + 1.6;
  {
    const yb = deckY(xFc) - 0.3;
    const stb = G.edge.filter((p) => p.x > xFc);
    const shape = new THREE.Shape();
    shape.moveTo(xFc, -halfB(xFc));
    stb.forEach((p) => shape.lineTo(p.x, -p.z));
    for (let i = stb.length - 1; i >= 0; i--) shape.lineTo(stb[i].x, stb[i].z);
    shape.lineTo(xFc, halfB(xFc));
    shape.closePath();
    const eg = new THREE.ExtrudeGeometry(shape, { depth: fcTop - yb, bevelEnabled: false, curveSegments: 2 });
    eg.rotateX(-Math.PI / 2);
    eg.translate(0, yb, 0);
    eg.computeVertexNormals();
    // world-scale uvs for the deck cap
    const p = eg.attributes.position, u = eg.attributes.uv;
    for (let i = 0; i < p.count; i++) u.setXY(i, p.getX(i) / 9, p.getZ(i) / 9);
    group.add(new THREE.Mesh(eg, [deckMat, hullPlain]));
    // forecastle bulwark rail
    const outline = [V3(xFc, fcTop, halfB(xFc) - 0.3), ...stb.map((q) => V3(q.x, fcTop, Math.max(0, q.z - 0.3)))];
    const port = outline.slice().reverse().map((q) => V3(q.x, q.y, -q.z));
    if (bulMat) {
      const ring = outline.concat(port.slice(1));
      for (let i = 1; i < ring.length; i++) batch.wall(bulMat, ring[i - 1], ring[i], fcTop - 0.2, 2.3, 0.3);
    } else batch.rail(m.rail, outline.concat(port.slice(1)), 1.1, 1.7);
    // aft face of the forecastle (step down to the main deck)
    batch.rail(m.rail, [V3(xFc, fcTop, -halfB(xFc) + 0.3), V3(xFc, fcTop, -2), ], 1.1);
    batch.rail(m.rail, [V3(xFc, fcTop, 2), V3(xFc, fcTop, halfB(xFc) - 0.3)], 1.1);
  }

  /* ---- forecastle machinery */
  {
    const y = fcTop;
    for (const s of [-1, 1]) {
      const wx = L / 2 - 17, wz = s * 4.3;
      batch.box(m.equip, wx, y + 0.5, wz, 3.4, 1.0, 2.6);
      batch.cyl(m.equip, wx, y + 1.5, wz - s * 1.6, 0.95, 1.4, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, wx, y + 1.5, wz + s * 0.2, 1.25, 0.45, Math.PI / 2, 0, 0, CYL8);
      batch.cyl(m.grey, wx, y + 1.5, wz, 0.25, 4.4, Math.PI / 2, 0, 0);
      batch.box(m.equip, wx - 1.9, y + 1.1, wz + s * 1.3, 1.4, 1.6, 1.2);
      // anchor chain to the hawse
      const hx = L / 2 - 12, hz = s * (halfB(hx) - 1.2);
      batch.rod(m.black, V3(wx, y + 1.2, wz + s * 0.2), V3(hx, y + 0.15, hz), 0.22, CYL8);
      batch.rod(m.black, V3(wx + 0.6, y + 0.3, wz + s * 0.2), V3(wx - 4, y + 0.3, wz + s * 0.2), 0.2, CYL8);
      batch.cyl(m.dark, hx, y + 0.2, hz, 0.8, 0.4);
      batch.box(m.dark, wx + 2.3, y + 0.35, wz + s * 0.2, 1.0, 0.7, 0.9);
      // mooring winch
      const mx = L / 2 - 26;
      batch.box(m.equip, mx, y + 0.45, s * 5.2, 2.6, 0.9, 2.2);
      batch.cyl(m.equip, mx, y + 1.3, s * 5.2, 0.85, 2.6, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, mx, y + 1.3, s * 6.7, 1.15, 0.2, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, mx, y + 1.3, s * 3.7, 1.15, 0.2, Math.PI / 2, 0, 0);
      // bollards & fairleads
      for (const bxp of [L / 2 - 9, L / 2 - 22]) {
        const bz = s * (halfB(bxp) - 1.4);
        batch.box(m.dark, bxp, y + 0.12, bz, 2.4, 0.24, 1.0);
        batch.cyl(m.dark, bxp - 0.6, y + 0.6, bz, 0.34, 1.0, 0, 0, 0, CYL8);
        batch.cyl(m.dark, bxp + 0.6, y + 0.6, bz, 0.34, 1.0, 0, 0, 0, CYL8);
      }
      // mushroom vents
      for (const vx of [L / 2 - 12, L / 2 - 30 + 3]) {
        batch.cyl(m.white, vx, y + 0.7, s * 1.6, 0.25, 1.4, 0, 0, 0, CYL8);
        batch.sph(m.white, vx, y + 1.45, s * 1.6, 0.45, 0.25, 0.45);
      }
    }
    // foremast
    const fx = L / 2 - 7;
    if (ulcv) {
      // lattice foremast (tapered four-legged truss)
      const Hm = 15, b0 = 2.2, b1 = 0.45;
      const leg = (k, t) => { const w = b0 + (b1 - b0) * t; return V3(fx - 1 + (k & 1 ? w : -w) * 0.5, y + t * Hm, (k & 2 ? w : -w) * 0.5); };
      for (let k = 0; k < 4; k++) batch.rod(m.white, leg(k, 0), leg(k, 1), 0.09, CYL8);
      const nb = 7;
      for (let i = 0; i < nb; i++) {
        const t0 = i / nb, t1 = (i + 1) / nb;
        for (const [a, b] of [[0, 1], [1, 3], [3, 2], [2, 0]]) {
          batch.rod(m.white, leg(a, t0), leg(b, t1), 0.045, ROD);
          batch.rod(m.white, leg(a, t1), leg(b, t1), 0.04, ROD);
        }
      }
      batch.box(m.white, fx - 1, y + Hm * 0.62, 0, 1.4, 0.12, 2.6);
      batch.cyl(m.white, fx - 1, y + Hm + 1.2, 0, 0.12, 2.4, 0, 0, 0, CYL8);
      batch.cyl(m.grey, fx - 0.4, y + Hm * 0.8, 0, 0.35, 0.8, 0, 0, Math.PI / 2, CYL8);
    } else {
      batch.cyl(m.white, fx, y + 5, 0, 0.22, 10, 0, 0, 0, CYL8);
      batch.box(m.white, fx, y + 7.6, 0, 0.2, 0.2, 2.4);
      batch.box(m.white, fx - 0.4, y + 3, 0, 0.6, 0.12, 1.2);
    }
    // spare propeller blade-ish deck store
    batch.box(m.grey, L / 2 - 33, deckY(L / 2 - 33) + 0.6, 0, 2.2, 1.2, 4.0);
  }

  /* ---- anchors in the hawse pockets */
  for (const s of [-1, 1]) {
    const ax = L / 2 - 13, ay = deckY(ax) - 2.6, az = s * (halfBAt(ax, ay) + 0.2);
    const tilt = s * 0.32;
    const base = M(ax, ay, az, tilt, 0, 0);
    const parts = [
      [0, 0.1, 0, 0.45, 3.0, 0.42],
      [0, -1.35, 0, 2.5, 0.6, 0.55],
    ];
    for (const [px, py, pz, sx, sy, sz] of parts) batch.add(m.black, BOX, base.clone().multiply(M(px, py, pz, 0, 0, 0, sx, sy, sz)));
    for (const k of [-1, 1]) batch.add(m.black, BOX, base.clone().multiply(M(k * 1.05, -0.75, 0.1, 0, 0, k * 0.5, 0.7, 1.5, 0.35)));
  }

  /* ---- main deck fittings */
  {
    const edgeS = G.edge.filter((p) => p.x > -L / 2 + 0.6 && p.x < xFc - 0.2);
    for (const s of [-1, 1]) {
      const pts = edgeS.map((p) => V3(p.x, p.y, s * Math.max(0, p.z - 0.15)));
      batch.rail(m.rail, pts, 1.1, 1.9);
      // fire/cargo main along the deck edge
      const pipe = edgeS.filter((p, i) => i % 6 === 0).map((p) => V3(p.x, p.y + 0.45, s * (p.z - 1.0)));
      for (let i = 1; i < pipe.length; i++) batch.rod(m.grey, pipe[i - 1], pipe[i], 0.14, CYL8);
      // bollards
      for (const bxp of [-L / 2 + 30, -L / 2 + 70, 20, 60]) {
        const bz = s * (halfB(bxp) - 1.3), by = deckY(bxp);
        batch.box(m.dark, bxp, by + 0.12, bz, 2.2, 0.24, 0.9);
        batch.cyl(m.dark, bxp - 0.55, by + 0.55, bz, 0.3, 0.9, 0, 0, 0, CYL8);
        batch.cyl(m.dark, bxp + 0.55, by + 0.55, bz, 0.3, 0.9, 0, 0, 0, CYL8);
      }
    }
    // stern rail across the transom
    const se = G.edge[0];
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push(V3(se.x + 0.2, se.y, lerp(-se.z + 0.2, se.z - 0.2, k / 12)));
    batch.rail(m.rail, pts, 1.1, 1.9);
    // aft mooring deck
    const ax = -L / 2 + 6.5, ay = deckY(ax);
    for (const s of [-1, 1]) {
      batch.box(m.equip, ax, ay + 0.45, s * 5.5, 2.6, 0.9, 2.2);
      batch.cyl(m.equip, ax, ay + 1.3, s * 5.5, 0.85, 2.6, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, ax, ay + 1.3, s * 7.0, 1.15, 0.2, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, ax, ay + 1.3, s * 4.0, 1.15, 0.2, Math.PI / 2, 0, 0);
      batch.cyl(m.dark, ax - 3, ay + 0.55, s * (halfB(ax - 3) - 1.3), 0.32, 0.9, 0, 0, 0, CYL8);
      batch.cyl(m.dark, ax - 1.8, ay + 0.55, s * (halfB(ax - 3) - 1.3), 0.32, 0.9, 0, 0, 0, CYL8);
    }
    // flag staff
    batch.cyl(m.white, -L / 2 + 1.0, deckY(-L / 2) + 3.5, 0, 0.08, 7, 0, 0, 0, CYL8);
  }

  /* ---- accommodation block */
  const radars = [];
  const lights = [];
  const fH = 2.8;
  // the bridge must see over the highest stack (SOLAS visibility line)
  const nF = Math.max(o.floors ?? 7, Math.ceil((maxStackTop - deckY(xH) + 1.5) / fH));
  const hBase = deckY(xH);
  const yBridge = hBase + nF * fH;
  {
    const front = makeFacade(hW, nF, fH, (o.seed ?? 1) * 7 + 1);
    const back = makeFacade(hW, nF, fH, (o.seed ?? 1) * 7 + 2, { spacing: 3.6 });
    const side = makeFacade(hLen, nF, fH, (o.seed ?? 1) * 7 + 3, { spacing: 3.1 });
    const fm = (t) => glow(new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.45, metalness: 0.25, envMapIntensity: 0.7 }));
    const sideM = fm(side);
    const house = new THREE.Mesh(new THREE.BoxGeometry(hLen, nF * fH, hW), [fm(front), fm(back), m.white, m.white, sideM, sideM]);
    house.position.set(xH, hBase + (nF * fH) / 2, 0);
    group.add(house);

    // side walkways every other deck
    for (let k = 1; k < nF; k++) {
      const y = hBase + k * fH;
      for (const s of [-1, 1]) {
        if (k % 2 === 0) {
          batch.box(m.offwhite, xH, y - 0.09, s * (hW / 2 + 0.6), hLen + 0.4, 0.18, 1.2);
          batch.rail(m.rail, [V3(xH - hLen / 2 - 0.2, y, s * (hW / 2 + 1.15)), V3(xH + hLen / 2 + 0.2, y, s * (hW / 2 + 1.15))], 1.05, 1.6, 0.03);
        }
      }
      // aft external stairs (zig-zag)
      const sz = k % 2 ? 1 : -1;
      const sx = xH - hLen / 2 - 0.7;
      batch.box(m.offwhite, sx, y - fH / 2, sz * (hW / 2 - 4.5), 0.95, 0.12, Math.hypot(fH, 4.2), Math.atan2(fH, 4.2) * sz * -1, 0, 0);
      batch.box(m.offwhite, sx, y - 0.06, sz * (hW / 2 - 1.6), 1.1, 0.12, 2.2);
      batch.rod(m.rail, V3(sx - 0.5, y - fH + 1.0, sz * (hW / 2 - 6.6)), V3(sx - 0.5, y + 1.0, sz * (hW / 2 - 2.4)), 0.03);
    }
    // deck lines (balcony lips) on the front
    for (let k = 1; k < nF; k++) batch.box(m.offwhite, xH + hLen / 2 + 0.12, hBase + k * fH, 0, 0.25, 0.14, hW + 0.2);

    // lifeboats on davits
    const lbGeo = new THREE.CapsuleGeometry(1.45, 5.4, 6, 18);
    for (const s of [-1, 1]) {
      const lx = xH - 1.0, ly = hBase + 2 * fH + 2.0, lz = s * (hW / 2 + 2.2);
      batch.add(m.orange, lbGeo, M(lx, ly, lz, 0, 0, Math.PI / 2, 1, 1, 0.82));
      batch.box(m.white, lx, ly + 1.15, lz, 5.0, 0.35, 1.6);
      for (let w = -2; w <= 2; w++) batch.box(m.glass, lx + w * 1.1, ly + 0.7, lz + s * 1.15, 0.5, 0.3, 0.1);
      for (const dx of [-2.6, 2.6]) {
        batch.rod(m.grey, V3(lx + dx, ly - 2.4, s * (hW / 2)), V3(lx + dx, ly + 2.2, s * (hW / 2 + 1.4)), 0.16, CYL8);
        batch.rod(m.grey, V3(lx + dx, ly + 2.2, s * (hW / 2 + 1.4)), V3(lx + dx, ly + 1.5, lz), 0.12, CYL8);
        batch.rod(m.dark, V3(lx + dx, ly + 1.5, lz), V3(lx + dx, ly + 1.3, lz), 0.03);
      }
    }

    // navigation bridge
    const br = makeBridgeTexture(hW, 3.2, (o.seed ?? 1) * 5 + 1);
    const brS = makeBridgeTexture(10, 3.2, (o.seed ?? 1) * 5 + 2);
    const bm = (t) => glow(new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.35, metalness: 0.3, envMapIntensity: 0.9 }));
    const bF = bm(br), bS = bm(brS);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(10, 3.2, hW), [bF, bF, m.white, m.white, bS, bS]);
    bridge.position.set(xH + 0.6, yBridge + 1.6, 0);
    group.add(bridge);
    const wingLen = B / 2 + 0.8 - hW / 2;
    if (ulcv) {
      // goalpost frame: full-beam bridge carried on two outboard legs with diagonal braces
      const legZ = B / 2 - 1.4;
      for (const s of [-1, 1]) {
        batch.box(m.white, xH + 1.0, (hBase + yBridge) / 2, s * legZ, 3.2, yBridge - hBase, 1.8);
        batch.rod(m.white, V3(xH + 1.0, yBridge - 13, s * (legZ - 0.6)), V3(xH + 1.0, yBridge - 0.4, s * (hW / 2 + 2.5)), 0.55, CYL8);
        batch.rod(m.white, V3(xH + 1.0, yBridge - 13, s * (hW / 2)), V3(xH + 1.0, yBridge - 0.4, s * (hW / 2 + 5.5)), 0.4, CYL8);
        batch.box(m.white, xH + 1.0, yBridge - 0.6, s * (hW / 2 + wingLen / 2), 5.0, 1.2, wingLen);
        // ladders up the legs
        batch.box(m.offwhite, xH - 0.9, (hBase + yBridge) / 2, s * legZ, 0.5, yBridge - hBase, 0.9);
      }
    }
    const wingM = bm(makeBridgeTexture(wingLen, 3.0, (o.seed ?? 1) * 5 + 3));
    const wingE = bm(makeBridgeTexture(4.2, 3.0, (o.seed ?? 1) * 5 + 4));
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, wingLen), [wingM, wingM, m.white, m.white, wingE, wingE]);
      wing.position.set(xH + 3.0, yBridge + 1.55, s * (hW / 2 + wingLen / 2));
      group.add(wing);
      // brackets under the wing
      for (const dx of [-1.5, 1.5]) batch.rod(m.white, V3(xH + 3 + dx, yBridge - 3.0, s * (hW / 2)), V3(xH + 3 + dx, yBridge, s * (hW / 2 + wingLen * 0.7)), 0.16, CYL8);
      // open wing deck behind, with rail
      batch.box(m.offwhite, xH - 1.0, yBridge + 0.05, s * (hW / 2 + wingLen / 2), 3.6, 0.15, wingLen);
      batch.rail(m.rail, [V3(xH - 2.8, yBridge + 0.1, s * (hW / 2 + 0.1)), V3(xH - 2.8, yBridge + 0.1, s * (B / 2 + 0.7)), V3(xH + 0.9, yBridge + 0.1, s * (B / 2 + 0.7))], 1.1, 1.4, 0.03);
      // sidelights
      lights.push({ p: V3(xH + 4.8, yBridge + 2.0, s * (B / 2 + 0.85)), c: s < 0 ? [3.0, 0.15, 0.12] : [0.15, 2.6, 0.6], size: 4.2 });
    }
    // visor
    batch.box(m.white, xH + 6.0, yBridge + 3.15, 0, 1.6, 0.14, hW + 2 * wingLen);
    if (o.bridgeAccent) {
      const acc = new THREE.MeshStandardMaterial({ color: o.bridgeAccent, roughness: 0.5, metalness: 0.2, emissive: o.bridgeAccent, emissiveIntensity: 0.08 });
      batch.box(acc, xH + 3.0, yBridge + 3.0, 0, 4.4, 0.55, hW + 2 * wingLen + 0.2);
      batch.box(acc, xH + 0.6, yBridge + 3.05, 0, 10.2, 0.45, hW + 0.25);
    }
    batch.box(m.white, xH + 0.6, yBridge + 3.3, 0, 10.4, 0.25, hW + 0.3);

    // compass deck & mast
    const yC = yBridge + 3.45;
    const rr = [V3(xH - 4.5, yC, -hW / 2 + 0.3), V3(xH + 5.6, yC, -hW / 2 + 0.3), V3(xH + 5.6, yC, hW / 2 - 0.3), V3(xH - 4.5, yC, hW / 2 - 0.3), V3(xH - 4.5, yC, -hW / 2 + 0.3)];
    batch.rail(m.rail, rr, 1.0, 1.8, 0.03);
    const mx = xH - 1.0;
    batch.box(m.white, mx, yC + 2.0, 0, 1.4, 4.0, 1.4);
    batch.cyl(m.white, mx, yC + 7.5, 0, 0.32, 7.0, 0, 0, 0, CYL8);
    batch.box(m.white, mx, yC + 4.1, 0, 2.8, 0.18, 8.0);
    batch.rail(m.rail, [V3(mx - 1.3, yC + 4.2, -3.9), V3(mx + 1.3, yC + 4.2, -3.9), V3(mx + 1.3, yC + 4.2, 3.9), V3(mx - 1.3, yC + 4.2, 3.9), V3(mx - 1.3, yC + 4.2, -3.9)], 0.9, 1.4, 0.025);
    batch.box(m.white, mx, yC + 8.4, 0, 0.18, 0.18, 6.2);
    batch.box(m.white, mx + 0.3, yC + 9.3, 0, 1.4, 0.14, 1.4);
    for (const s of [-1, 1]) {
      // radomes, whips, horn, searchlights
      batch.cyl(m.white, xH - 4.0, yC + 0.8, s * 7.5, 0.25, 1.6, 0, 0, 0, CYL8);
      batch.sph(m.white, xH - 4.0, yC + 2.1, s * 7.5, 0.85);
      batch.cyl(m.white, xH - 2.8, yC + 0.5, s * 10.0, 0.18, 1.0, 0, 0, 0, CYL8);
      batch.sph(m.offwhite, xH - 2.8, yC + 1.1, s * 10.0, 0.35, 0.18, 0.35);
      batch.rod(m.white, V3(mx + 0.9, yC + 8.4, s * 3.0), V3(mx + 0.9, yC + 13.5, s * 3.0), 0.03);
      batch.rod(m.white, V3(xH + 3.5, yC, s * 5.5), V3(xH + 3.5, yC + 5.5, s * 5.5), 0.025);
      batch.cyl(m.dark, xH + 5.0, yC + 0.9, s * (hW / 2 - 1.2), 0.32, 0.6, 0, 0, Math.PI / 2, CYL8);
      batch.box(m.grey, xH + 4.8, yC + 0.3, s * (hW / 2 - 1.2), 0.4, 0.6, 0.4);
      lights.push({ p: V3(mx, yC + 8.4, s * 3.1), c: [2.2, 2.2, 2.0], size: 1.6 });
    }
    batch.cyl(m.grey, mx + 0.9, yC + 6.0, 0, 0.18, 0.9, 0, 0, Math.PI / 2, CYL8);

    // radars
    const addRadar = (x, y, z, len, speed) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      batch.box(m.dark, x, y + 0.4, z, 0.7, 0.8, 0.7);
      const sc = new THREE.Mesh(BOX, m.offwhite);
      sc.scale.set(len, 0.32, 0.3);
      sc.position.y = 1.0;
      g.add(sc);
      group.add(g);
      radars.push({ g, speed, phase: r() * 6 });
    };
    addRadar(mx, yC + 4.2, -2.4, 4.2, 2.2);
    addRadar(mx + 0.3, yC + 9.35, 0, 3.2, 2.9);
    lights.push({ p: V3(mx, yC + 11.2, 0), c: [2.6, 2.6, 2.4], size: 3.6 });
  }

  /* ---- funnel & engine casing */
  const fBase = deckY(xFun);
  const casingH = 9;
  const funnelTopY = ulcv ? maxStackTop + 2.5 : Math.max(maxStackTop + 5, fBase + casingH + 12);
  const fHgt = funnelTopY - (fBase + casingH);
  const rake = 0.13;
  if (ulcv) {
    // integrated engine block with exhaust uptakes (modern ULCV)
    const blockMat = new THREE.MeshStandardMaterial({ color: o.funnelBase ?? '#e3d9a6', roughness: 0.5, metalness: 0.25, envMapIntensity: 0.7 });
    const topY = funnelTopY;
    batch.box(blockMat, xFun, (fBase + topY) / 2, 0, fLen, topY - fBase, B * 0.62);
    batch.box(m.black, xFun, topY + 0.6, 0, fLen + 0.2, 1.2, B * 0.62 + 0.2);
    for (let k = 1; k < 7; k++) batch.box(m.offwhite, xFun + fLen / 2 + 0.05, fBase + k * (topY - fBase) / 7, 0, 0.1, 0.2, B * 0.62);
    for (const dz of [-3.5, -1.2, 1.2, 3.5]) {
      batch.cyl(m.dark, xFun - 1.5, topY + 2.4, dz, 0.75, 3.6);
      batch.cyl(m.black, xFun - 1.5, topY + 4.25, dz, 0.84, 0.12);
    }
    batch.rail(m.rail, [V3(xFun - fLen / 2, topY + 1.2, -B * 0.3), V3(xFun + fLen / 2, topY + 1.2, -B * 0.3), V3(xFun + fLen / 2, topY + 1.2, B * 0.3), V3(xFun - fLen / 2, topY + 1.2, B * 0.3)], 1.0, 1.8, 0.03);
    lights.push({ p: V3(-L / 2 + 0.7, deckY(-L / 2) + 2.6, 0), c: [2.4, 2.4, 2.2], size: 3.4 });
  } else {
    batch.box(m.white, xFun, fBase + casingH / 2, 0, fLen + 2, casingH, 14);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 6; k++) batch.box(m.grey, xFun - 4.5 + k * 1.8, fBase + casingH - 2.0, s * 7.02, 1.2, 1.6, 0.06);
      batch.rail(m.rail, [V3(xFun - fLen / 2 - 0.8, fBase + casingH, s * 6.8), V3(xFun + fLen / 2 + 0.8, fBase + casingH, s * 6.8)], 1.0, 1.6, 0.03);
    }
    batch.box(m.white, xFun + 3.5, fBase + casingH + 1.4, 0, 3.0, 2.8, 4.0);
    const circ = 2 * Math.PI * Math.sqrt((25 + 13) / 2);
    const tex = makeFunnelTexture({ band: o.funnelBand ?? '#b52a1f', base: o.funnelBase ?? '#d8d6cc', circ, height: fHgt, seed: o.seed ?? 1 });
    const fg = new THREE.CylinderGeometry(1, 1.07, 1, 56, 8, true);
    fg.rotateY(Math.PI / 2);
    fg.scale(5.0, fHgt, 3.6);
    const pa = fg.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setX(i, pa.getX(i) - (pa.getY(i) + fHgt / 2) * rake);
    fg.translate(xFun, fBase + casingH + fHgt / 2, 0);
    fg.computeVertexNormals();
    group.add(new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.25, envMapIntensity: 0.7, side: THREE.DoubleSide })));
    const tx = xFun - fHgt * rake;
    batch.add(m.black, CYL, M(tx, funnelTopY - 0.6, 0, 0, 0, 0, 4.85, 0.2, 3.5));
    for (const [dx, dz, rr] of [[0.6, -1.2, 0.85], [0.6, 1.2, 0.85], [-1.8, 0, 0.6], [2.6, 0, 0.45]]) {
      batch.cyl(m.dark, tx + dx, funnelTopY + 0.6, dz, rr, 3.0);
      batch.cyl(m.black, tx + dx, funnelTopY + 2.12, dz, rr * 1.12, 0.12);
    }
    batch.rail(m.rail, [V3(tx - 5, funnelTopY - 0.5, -3.6), V3(tx + 5, funnelTopY - 0.5, -3.6)], 0.9, 1.4, 0.025);
    lights.push({ p: V3(-L / 2 + 0.7, deckY(-L / 2) + 2.6, 0), c: [2.4, 2.4, 2.2], size: 3.4 });
  }

  // forward masthead light + a few warm deck floods
  lights.push({ p: ulcv ? V3(L / 2 - 8, fcTop + 16.6, 0) : V3(L / 2 - 7, fcTop + 10.2, 0), c: [2.6, 2.6, 2.4], size: 3.6 });
  for (const s of [-1, 1]) lights.push({ p: V3(xH + hLen / 2 + 0.3, hBase + fH * 1.5, s * (hW / 2 - 1.5)), c: [1.6, 1.25, 0.8], size: 5.5 });

  /* ---- working lights for night: walkway lamps, lashing-bridge floods, obstruction lights */
  const WARM = [1.7, 1.25, 0.75], SODIUM = [1.9, 1.1, 0.45], RED = [2.6, 0.18, 0.12];
  for (const s of [-1, 1]) {
    for (let x = -L / 2 + 14; x < xFc - 4; x += 19) lights.push({ p: V3(x, deckY(x) + 1.6, s * (halfB(x) - 0.3)), c: WARM, size: 2.2, night: true });
  }
  for (const lb of bridgeXs) {
    for (const s of [-1, 1]) lights.push({ p: V3(lb.x, lb.base + 6.4, s * (lb.rows * ROWP / 2 + 0.2)), c: SODIUM, size: 3.2, night: true, reflect: true });
  }
  lights.push({ p: V3(xH - 1.0, yBridge + 3.45 + 12.2, 0), c: RED, size: 2.6 });
  lights.push({ p: ulcv ? V3(xFun - 1.5, funnelTopY + 5.0, 0) : V3(xFun - fHgt * rake, funnelTopY + 3.4, 0), c: RED, size: 2.6 });
  for (const s of [-1, 1]) {
    lights.push({ p: V3(xH + 6.2, yBridge + 3.4, s * (hW / 2 + 1.0)), c: [2.2, 2.1, 1.9], size: 3.0, night: true, reflect: true });
    lights.push({ p: V3(-L / 2 + 4, deckY(-L / 2 + 4) + 5, s * 6), c: WARM, size: 3.4, night: true, reflect: true });
    lights.push({ p: V3(L / 2 - 20, fcTop + 4.5, s * 3), c: WARM, size: 3.0, night: true, reflect: true });
  }

  /* ---- real floodlights (hero ship only) with soft volumetric cones in the rain */
  const spots = [];
  if (o.spots) {
    const coneMat = (color) => new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uI: { value: 0 }, uH: { value: 1 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        uniform float uH; varying float vT; varying float vEdge;
        void main() {
          vT = clamp(-position.y / uH, 0.0, 1.0);
          vec3 n = normalMatrix * normal;
          float ln = length(n);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // the cone tip has a zero normal; guard it so no NaN reaches the bloom chain
          vEdge = ln > 1e-4 ? abs(dot(n / ln, normalize(-mv.xyz))) : 0.0;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uI; varying float vT; varying float vEdge;
        void main() {
          float a = pow(1.0 - vT, 1.6) * smoothstep(0.0, 0.08, vT) * pow(vEdge, 1.5) * uI;
          gl_FragColor = vec4(clamp(uColor * a * 0.16, 0.0, 4.0), 1.0);
        }`,
    });
    const addSpot = (from, to, color, angle, dist) => {
      const sp = new THREE.SpotLight(color, 0, dist, angle, 0.65, 1.2);
      sp.position.copy(from);
      sp.target.position.copy(to);
      group.add(sp, sp.target);
      const len = Math.min(dist * 0.55, from.distanceTo(to) * 1.25);
      const cg = new THREE.ConeGeometry(Math.tan(angle) * len, len, 28, 1, true);
      cg.translate(0, -len / 2, 0);
      const mat = coneMat(color);
      mat.uniforms.uH.value = len;
      const cone = new THREE.Mesh(cg, mat);
      cone.position.copy(from);
      cone.quaternion.setFromUnitVectors(V3(0, -1, 0), to.clone().sub(from).normalize());
      cone.renderOrder = 6;
      group.add(cone);
      spots.push({ light: sp, cone, base: 1 });
      lights.push({ p: from.clone(), c: [2.6, 2.4, 2.0], size: 4.5, night: true, reflect: true });
    };
    const fwdDeck = deckY(xH + 40) + 12;
    for (const s of [-1, 1]) addSpot(V3(xH + 6.4, yBridge + 3.2, s * 5), V3(xH + 70, fwdDeck, s * 8), '#ffe7c4', 0.5, 190);
    addSpot(V3(xH - 7, yBridge + 1.5, 0), V3(xH - 70, deckY(xH - 60) + 14, 0), '#ffe2b8', 0.55, 170);
    addSpot(V3(L / 2 - 8, fcTop + 9, 0), V3(L / 2 - 4, fcTop, 0), '#fff1d6', 0.9, 60);
  }

  batch.build(group);

  const reflectLights = [];
  for (const l of lights) {
    const mat = new THREE.SpriteMaterial({ map: S.glow, color: new THREE.Color(...l.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    mat.userData.baseColor = mat.color.clone();
    mat.userData.night = !!l.night;
    const sp = new THREE.Sprite(mat);
    sprites.push(sp);
    sp.position.copy(l.p);
    sp.scale.setScalar(l.size);
    group.add(sp);
    if (l.reflect || (!l.night && l.size >= 3.4)) reflectLights.push({ p: l.p.clone(), c: new THREE.Color(...l.c), night: !!l.night });
  }

  let propAngle = 0, nightAmt = 0, navAmt = 1;
  const _w = new THREE.Vector3();
  return {
    group, L, B, D, T, deckY, halfB, halfBAt,
    setLights(windows, nav) {
      nightAmt = Math.min(1, Math.max(0, (windows - 0.6) / 1.2));
      navAmt = nav;
      for (const m of glowMats) m.emissiveIntensity = m.userData.baseGlow * windows;
      for (const sp of sprites) {
        const k = sp.material.userData.night ? nav * nightAmt : nav;
        sp.material.color.copy(sp.material.userData.baseColor).multiplyScalar(k);
        sp.visible = k > 0.01;
      }
      for (const s of spots) {
        s.light.intensity = 260 * nightAmt;
        s.light.visible = nightAmt > 0.01;
        s.cone.material.uniforms.uI.value = nightAmt * 0.7;
        s.cone.visible = nightAmt > 0.01;
      }
    },
    // the brightest lamps in world space, for reflections on the water
    reflections(outPos, outCol, max = 8) {
      let n = 0;
      for (const r of reflectLights) {
        if (n >= max) break;
        const k = r.night ? navAmt * nightAmt : navAmt * (0.04 + 0.96 * nightAmt);
        if (k < 0.01) continue;
        outPos[n].copy(_w.copy(r.p).applyMatrix4(group.matrixWorld));
        outCol[n].copy(r.c).multiplyScalar(k * 0.022);
        n++;
      }
      for (let i = n; i < max; i++) outCol[i].setRGB(0, 0, 0);
    },
    bowLocal: V3(L / 2 - 2, 0, 0),
    eye: V3(xH + 5.95, yBridge + 1.75, 0),
    funnelTop: ulcv ? V3(xFun - 1.5, funnelTopY + 4.5, 0) : V3(xFun - fHgt * rake, funnelTopY + 2.4, 0),
    propLocal: prop.position.clone(),
    update(dt, t, racing = 0) {
      for (const rd of radars) rd.g.rotation.y = t * rd.speed + rd.phase;
      propAngle += dt * (8 + racing * 10);
      prop.rotation.x = propAngle;
    },
  };
}

// shared building blocks for other hull types (cruise ship)
export { Batch, M, V3, BOX, CYL, CYL8, ROD, SPH, hullModel, buildHullGeometry, shared };
