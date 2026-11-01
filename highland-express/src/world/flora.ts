import * as THREE from 'three';
import { Rng, noise } from '../core/noise';

/** Tiny immutable-style mesh accumulator for hand-built vegetation geometry. */
export class MB {
  pos: number[] = [];
  col: number[] = [];
  nor: number[] = [];

  tri(
    a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    ca: THREE.Color, cb: THREE.Color, cc: THREE.Color,
    na?: THREE.Vector3, nb?: THREE.Vector3, nc?: THREE.Vector3,
  ) {
    const fn = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const [p, col, n] of [[a, ca, na], [b, cb, nb], [c, cc, nc]] as [THREE.Vector3, THREE.Color, THREE.Vector3 | undefined][]) {
      this.pos.push(p.x, p.y, p.z);
      this.col.push(col.r, col.g, col.b);
      const nn = n ?? fn;
      this.nor.push(nn.x, nn.y, nn.z);
    }
  }

  /** Add an existing (indexed or not) geometry, transformed, with a colour function. */
  geo(g: THREE.BufferGeometry, m: THREE.Matrix4, colour: (p: THREE.Vector3, n: THREE.Vector3) => THREE.Color) {
    const gg = g.index ? g.toNonIndexed() : g;
    const p = gg.attributes.position, nrm = gg.attributes.normal;
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m);
      n.fromBufferAttribute(nrm, i).applyMatrix3(nm).normalize();
      const c = colour(v, n);
      this.pos.push(v.x, v.y, v.z);
      this.col.push(c.r, c.g, c.b);
      this.nor.push(n.x, n.y, n.z);
    }
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const lerpC = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);

// ----------------------------------------------------------------- conifers
export interface PineSpec {
  height: number; clear: number; tiers: number; radius: number; droop: number;
  blades: [number, number]; dark: THREE.Color; light: THREE.Color; taper: number; jag: number;
}

export function buildPine(spec: PineSpec, seed: number): { hi: THREE.BufferGeometry; lo: THREE.BufferGeometry } {
  const rng = new Rng(seed);
  const hi = new MB();
  const bark = C(0.20, 0.12, 0.07), bark2 = C(0.12, 0.08, 0.05);
  // trunk
  const trunk = new THREE.CylinderGeometry(0.03, 0.2, spec.height * 0.98, 7, 4);
  trunk.translate(0, spec.height * 0.49, 0);
  hi.geo(trunk, new THREE.Matrix4(), (p) => lerpC(bark, bark2, Math.min(1, p.y / spec.height)));
  const a = V(), b = V(), c = V(), d = V();
  for (let i = 0; i < spec.tiers; i++) {
    const t = i / (spec.tiers - 1);
    const y = spec.clear + (spec.height - spec.clear) * (1 - Math.pow(t, 1.08)) - 0.05;
    const r = spec.radius * Math.pow(1 - t, spec.taper) * rng.range(0.9, 1.1) + 0.12;
    const nb = Math.round(spec.blades[0] + (spec.blades[1] - spec.blades[0]) * t);
    const a0 = rng.range(0, Math.PI * 2);
    for (let k = 0; k < nb; k++) {
      const ang = a0 + ((k + rng.range(-0.25, 0.25)) * Math.PI * 2) / nb;
      const len = r * rng.range(0.78, 1.18);
      const dr = spec.droop * (1 - 0.35 * t) * rng.range(0.8, 1.2);
      const dir = V(Math.cos(ang), 0, Math.sin(ang));
      const tip = V(dir.x * len, y - dr * len + 0.1, dir.z * len);
      const base = V(dir.x * 0.08, y + 0.04, dir.z * 0.08);
      const perp = V(-dir.z, 0, dir.x);
      const wd = len * rng.range(0.13, 0.21) * (1 + spec.jag);
      const mid = base.clone().lerp(tip, 0.5).add(V(0, 0.12 * len, 0));
      a.copy(mid).addScaledVector(perp, wd);
      b.copy(mid).addScaledVector(perp, -wd);
      const shade = 0.7 + 0.5 * t + rng.range(-0.1, 0.1);
      const cIn = spec.dark.clone().multiplyScalar(shade * 0.8);
      const cOut = lerpC(spec.dark, spec.light, 0.45 + 0.5 * t + rng.range(-0.1, 0.15)).multiplyScalar(shade);
      // normals: outward + up for rounded shading
      const nOut = (p: THREE.Vector3) => V(p.x, p.y - (y - 0.4) * 0.0 + (spec.height * 0.45 - p.y) * -0.0, p.z).normalize().multiplyScalar(0.6).add(V(0, 0.8, 0)).normalize();
      hi.tri(base, a, tip, cIn, cOut, cOut, V(0, 1, 0).add(dir).normalize(), nOut(a), nOut(tip));
      hi.tri(base, tip, b, cIn, cOut, cOut, V(0, 1, 0).add(dir).normalize(), nOut(tip), nOut(b));
      // a second, upright fan gives the branch some thickness from the side
      c.copy(mid).add(V(0, wd * 0.9, 0));
      d.copy(mid).add(V(0, -wd * 0.5, 0));
      hi.tri(base, c, tip, cIn, cOut, cOut, V(0, 1, 0), dir, dir);
      hi.tri(base, tip, d, cIn, cOut, cOut, V(0, 1, 0), dir, dir);
    }
  }
  // low-poly stand-in: stacked cones
  const lo = new MB();
  const tg = new THREE.CylinderGeometry(0.05, 0.2, spec.height * 0.5, 5, 1);
  tg.translate(0, spec.height * 0.25, 0);
  lo.geo(tg, new THREE.Matrix4(), () => bark);
  const cones = 4;
  for (let i = 0; i < cones; i++) {
    const t = i / (cones - 1);
    const y0 = spec.clear + (spec.height - spec.clear) * (1 - t) * 0.82 - 0.2;
    const h = (spec.height - spec.clear) * 0.45;
    const r = spec.radius * (1.0 - t * 0.78) * 0.95 + 0.15;
    const cg = new THREE.ConeGeometry(r, h, 7, 1, true);
    cg.translate(0, y0 + h * 0.35, 0);
    const col = lerpC(spec.dark, spec.light, 0.25 + 0.5 * t).multiplyScalar(0.9 + 0.2 * t);
    lo.geo(cg, new THREE.Matrix4(), () => col);
  }
  return { hi: hi.build(), lo: lo.build() };
}

/** Caledonian Scots pine: tall bare trunk, flat-topped cloud pads. */
export function buildScots(seed: number): { hi: THREE.BufferGeometry; lo: THREE.BufferGeometry } {
  const rng = new Rng(seed);
  const hi = new MB(), lo = new MB();
  const H = rng.range(10, 13.5);
  const barkLow = C(0.21, 0.15, 0.11), barkHi = C(0.38, 0.20, 0.10);
  const lean = V(rng.range(-0.5, 0.5), 0, rng.range(-0.5, 0.5));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 5; i++) {
    const t = i / 5;
    pts.push(V(lean.x * t * t * 1.2 + Math.sin(t * 3 + seed) * 0.12, H * t, lean.z * t * t * 1.2));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = (cu: THREE.CatmullRomCurve3, r0: number, r1: number, seg: number, radial: number, mb: MB, colA: THREE.Color, colB: THREE.Color) => {
    const g = new THREE.TubeGeometry(cu, seg, 1, radial, false);
    const p = g.attributes.position;
    const tmp = V();
    const n = g.attributes.normal;
    const rows = seg + 1;
    for (let i = 0; i < p.count; i++) {
      const row = Math.floor(i / (radial + 1));
      const t = row / (rows - 1);
      const center = cu.getPointAt(Math.min(1, t));
      tmp.fromBufferAttribute(p, i).sub(center);
      const nr = V().fromBufferAttribute(n, i);
      const r = r0 + (r1 - r0) * t;
      p.setXYZ(i, center.x + nr.x * r, center.y + nr.y * r, center.z + nr.z * r);
    }
    mb.geo(g, new THREE.Matrix4(), (pp) => lerpC(colA, colB, Math.max(0, Math.min(1, pp.y / H))));
  };
  tube(curve, 0.2, 0.07, 14, 7, hi, barkLow, barkHi);
  tube(curve, 0.2, 0.07, 6, 5, lo, barkLow, barkHi);
  const top = curve.getPointAt(1);
  const padCol = C(0.055, 0.13, 0.07), padCol2 = C(0.10, 0.20, 0.09);
  const pads: { p: THREE.Vector3; r: number }[] = [{ p: top.clone().add(V(0, 0.4, 0)), r: rng.range(1.7, 2.3) }];
  const nBr = rng.int(3, 5);
  for (let i = 0; i < nBr; i++) {
    const ang = (i / nBr) * Math.PI * 2 + rng.range(-0.4, 0.4);
    const y = H * rng.range(0.62, 0.9);
    const base = curve.getPointAt(y / H);
    const len = rng.range(1.7, 3.0);
    const end = base.clone().add(V(Math.cos(ang) * len, rng.range(0.1, 0.9), Math.sin(ang) * len));
    const bc = new THREE.CatmullRomCurve3([base, base.clone().lerp(end, 0.5).add(V(0, 0.25, 0)), end]);
    tube(bc, 0.07, 0.025, 4, 5, hi, barkHi, barkHi);
    pads.push({ p: end.clone().add(V(0, 0.3, 0)), r: rng.range(1.2, 1.9) });
  }
  for (const pd of pads) {
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const pp = ico.attributes.position;
    const v = V();
    for (let i = 0; i < pp.count; i++) {
      v.fromBufferAttribute(pp, i);
      const nz = 1 + 0.28 * noise.n3(v.x * 2 + seed, v.y * 2, v.z * 2);
      pp.setXYZ(i, v.x * nz, v.y * nz * 0.5, v.z * nz);
    }
    ico.computeVertexNormals();
    const m = new THREE.Matrix4().compose(pd.p, new THREE.Quaternion(), V(pd.r, pd.r, pd.r));
    const colf = (p: THREE.Vector3, _n: THREE.Vector3) => {
      const t = Math.max(0, Math.min(1, (p.y - pd.p.y) / (pd.r * 0.55) * 0.5 + 0.5));
      return lerpC(padCol, padCol2, t * 0.9 + rng.range(-0.08, 0.08));
    };
    hi.geo(ico, m, colf);
    // finer tufts: little satellite blobs around the rim give a ragged silhouette
    for (let k = 0; k < 5; k++) {
      const ang = rng.range(0, Math.PI * 2);
      const q = pd.p.clone().add(V(Math.cos(ang) * pd.r * 0.8, rng.range(-0.1, 0.25) * pd.r, Math.sin(ang) * pd.r * 0.8));
      const s = pd.r * rng.range(0.28, 0.45);
      hi.geo(new THREE.IcosahedronGeometry(1, 0), new THREE.Matrix4().compose(q, new THREE.Quaternion(), V(s, s * 0.6, s)), colf);
    }
    lo.geo(new THREE.IcosahedronGeometry(1, 0), m, colf);
  }
  return { hi: hi.build(), lo: lo.build() };
}

// --------------------------------------------------------------- broadleaves
export interface BroadSpec {
  trunkH: number; trunkR: number; spread: number; levels: number; blobR: number;
  bark: THREE.Color; barkMark: THREE.Color; leaf: THREE.Color; leaf2: THREE.Color; droop: number; berries?: boolean;
  trunkLean?: number;
}

export function buildBroadleaf(spec: BroadSpec, seed: number): { hi: THREE.BufferGeometry; lo: THREE.BufferGeometry } {
  const rng = new Rng(seed);
  const hi = new MB(), lo = new MB();
  const blobs: { p: THREE.Vector3; r: number }[] = [];
  const addTube = (a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, mid?: THREE.Vector3) => {
    const pts = [a, mid ?? a.clone().lerp(b, 0.5).add(V(rng.range(-0.15, 0.15), 0.1, rng.range(-0.15, 0.15))), b];
    const cu = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(cu, 5, 1, 6, false);
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const row = Math.floor(i / 7);
      const t = row / 5;
      const ctr = cu.getPointAt(Math.min(1, t));
      const r = r0 + (r1 - r0) * t;
      const nr = V().fromBufferAttribute(n, i);
      p.setXYZ(i, ctr.x + nr.x * r, ctr.y + nr.y * r, ctr.z + nr.z * r);
    }
    hi.geo(g, new THREE.Matrix4(), (pp) => {
      const k = noise.n3(pp.x * 9, pp.y * 3.5 + seed, pp.z * 9);
      return k > 0.28 ? spec.barkMark : spec.bark;
    });
  };
  const trunkTop = V((rng.next() - 0.5) * (spec.trunkLean ?? 0.5), spec.trunkH, (rng.next() - 0.5) * (spec.trunkLean ?? 0.5));
  addTube(V(0, -0.1, 0), trunkTop, spec.trunkR, spec.trunkR * 0.55, V(trunkTop.x * 0.3, spec.trunkH * 0.5, trunkTop.z * 0.3));
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, r: number, level: number) => {
    const to = from.clone().addScaledVector(dir, len);
    addTube(from, to, r, r * 0.55);
    if (level >= spec.levels) {
      blobs.push({ p: to.clone().add(V(0, spec.blobR * 0.25, 0)), r: spec.blobR * rng.range(0.85, 1.25) });
      return;
    }
    const nCh = level === 0 ? rng.int(4, 6) : rng.int(2, 3);
    for (let i = 0; i < nCh; i++) {
      const ang = (i / nCh) * Math.PI * 2 + rng.range(-0.5, 0.5);
      const up = rng.range(0.35, 0.9) - spec.droop * level * 0.25;
      const d = V(Math.cos(ang) * (1 - up * 0.5), up, Math.sin(ang) * (1 - up * 0.5)).normalize();
      grow(to, d, len * rng.range(0.6, 0.85), r * 0.55, level + 1);
    }
    // foliage along the branch too
    if (level >= 1) blobs.push({ p: to.clone().lerp(from, 0.3).add(V(0, spec.blobR * 0.3, 0)), r: spec.blobR * 0.8 });
  };
  grow(trunkTop.clone().add(V(0, -spec.trunkH * 0.12, 0)), V(0, 1, 0), spec.spread * 0.6, spec.trunkR * 0.55, 0);
  // crown
  for (const b of blobs) {
    const ico = new THREE.IcosahedronGeometry(1, 2);
    const pp = ico.attributes.position;
    const v = V();
    const sd = rng.range(0, 99);
    for (let i = 0; i < pp.count; i++) {
      v.fromBufferAttribute(pp, i);
      const k = 1 + 0.42 * noise.n3(v.x * 2.4 + sd, v.y * 2.4, v.z * 2.4);
      pp.setXYZ(i, v.x * k, v.y * k * 0.82, v.z * k);
    }
    ico.computeVertexNormals();
    const m = new THREE.Matrix4().compose(b.p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.range(0, 3), rng.range(0, 3), 0)), V(b.r, b.r, b.r));
    const tone = rng.range(0, 1);
    hi.geo(ico, m, (p, n) => {
      const up = Math.max(0, Math.min(1, n.y * 0.5 + 0.5));
      const cc = lerpC(spec.leaf, spec.leaf2, tone * 0.7 + up * 0.45);
      cc.multiplyScalar(0.55 + 0.6 * up);
      return cc;
    });
    if (spec.berries) {
      for (let k = 0; k < 4; k++) {
        const q = b.p.clone().add(V(rng.range(-1, 1), rng.range(-0.1, 0.8), rng.range(-1, 1)).normalize().multiplyScalar(b.r * 0.95));
        hi.geo(new THREE.IcosahedronGeometry(0.16, 0), new THREE.Matrix4().makeTranslation(q.x, q.y, q.z), () => C(0.72, 0.1, 0.06));
      }
    }
  }
  // low LOD
  const t2 = new THREE.CylinderGeometry(spec.trunkR * 0.6, spec.trunkR, spec.trunkH, 5, 1);
  t2.translate(0, spec.trunkH / 2, 0);
  lo.geo(t2, new THREE.Matrix4(), () => spec.bark);
  const crown = new THREE.IcosahedronGeometry(1, 1);
  const cp = crown.attributes.position;
  const vv = V();
  for (let i = 0; i < cp.count; i++) {
    vv.fromBufferAttribute(cp, i);
    const k = 1 + 0.25 * noise.n3(vv.x * 2 + seed, vv.y * 2, vv.z * 2);
    cp.setXYZ(i, vv.x * k, vv.y * k * 0.85, vv.z * k);
  }
  crown.computeVertexNormals();
  const cr = spec.spread * 0.95 + spec.blobR * 0.4;
  lo.geo(crown, new THREE.Matrix4().compose(V(0, spec.trunkH + cr * 0.55, 0), new THREE.Quaternion(), V(cr, cr * 0.8, cr)), (_p, n) =>
    lerpC(spec.leaf, spec.leaf2, 0.4 + n.y * 0.3).multiplyScalar(0.7 + 0.4 * (n.y * 0.5 + 0.5)));
  return { hi: hi.build(), lo: lo.build() };
}

// ------------------------------------------------------------------- shrubs
export function buildHeather(seed: number): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const mb = new MB();
  const nBlob = 4;
  for (let i = 0; i < nBlob; i++) {
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const p = ico.attributes.position;
    const v = V();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      const nz = 1 + 0.35 * noise.n3(v.x * 3 + seed + i, v.y * 3, v.z * 3);
      p.setXYZ(k, v.x * nz, Math.max(v.y, -0.15) * nz * 0.75, v.z * nz);
    }
    ico.computeVertexNormals();
    const s = rng.range(0.28, 0.5);
    const m = new THREE.Matrix4().compose(V(rng.range(-0.3, 0.3), 0.1, rng.range(-0.3, 0.3)), new THREE.Quaternion(), V(s, s * 0.9, s));
    mb.geo(ico, m, (pp, n) => {
      const sp = noise.n3(pp.x * 18, pp.y * 18, pp.z * 18) > 0.1;
      const base = sp ? C(0.46, 0.2, 0.36) : C(0.17, 0.15, 0.08);
      return base.multiplyScalar(0.55 + 0.6 * (n.y * 0.5 + 0.5));
    });
  }
  return mb.build();
}

export function buildGorse(seed: number): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const mb = new MB();
  for (let i = 0; i < 5; i++) {
    const ico = new THREE.IcosahedronGeometry(1, 1);
    const p = ico.attributes.position;
    const v = V();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k);
      const nz = 1 + 0.5 * noise.n3(v.x * 3 + seed + i, v.y * 3, v.z * 3);
      p.setXYZ(k, v.x * nz, Math.max(v.y, -0.2) * nz * 0.9, v.z * nz);
    }
    ico.computeVertexNormals();
    const s = rng.range(0.4, 0.7);
    const pos = V(rng.range(-0.4, 0.4), 0.15, rng.range(-0.4, 0.4));
    mb.geo(ico, new THREE.Matrix4().compose(pos, new THREE.Quaternion(), V(s, s, s)), (pp, n) => {
      const fl = noise.n3(pp.x * 41, pp.y * 41, pp.z * 41) > 0.22;
      return (fl ? C(0.86, 0.64, 0.07) : C(0.12, 0.22, 0.07)).multiplyScalar(0.7 + 0.5 * (n.y * 0.5 + 0.5));
    });
  }
  return mb.build();
}

export function buildBracken(seed: number): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const mb = new MB();
  const n = 7;
  const c0 = C(0.15, 0.30, 0.07), c1 = C(0.36, 0.44, 0.10), c2 = C(0.58, 0.38, 0.12);
  const tone = rng.range(0, 1);
  for (let f = 0; f < n; f++) {
    const ang = (f / n) * Math.PI * 2 + rng.range(-0.3, 0.3);
    const len = rng.range(0.7, 1.15);
    const lift = rng.range(0.7, 1.2);
    const segs = 6;
    let prev: [THREE.Vector3, THREE.Vector3] | null = null;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const r = len * t * 0.85;
      const y = Math.sin(t * 1.9) * lift * 0.55 - t * t * 0.1;
      const ctr = V(Math.cos(ang) * r, y, Math.sin(ang) * r);
      const w = 0.22 * Math.sin(Math.min(1, t * 1.08 + 0.12) * Math.PI) * len * (1 - t * 0.2) + 0.01;
      const perp = V(-Math.sin(ang), 0, Math.cos(ang));
      const l = ctr.clone().addScaledVector(perp, w).add(V(0, -0.04 * (1 - t), 0));
      const rr = ctr.clone().addScaledVector(perp, -w).add(V(0, -0.04 * (1 - t), 0));
      if (prev) {
        const cA = lerpC(c0, lerpC(c1, c2, tone), t * 0.9);
        const cB = lerpC(c0, lerpC(c1, c2, tone), Math.min(1, t * 0.9 + 0.1));
        mb.tri(prev[0], prev[1], l, cA, cA, cB, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
        mb.tri(prev[1], rr, l, cA, cB, cB, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
      }
      prev = [l, rr];
    }
  }
  return mb.build();
}

export function buildGrass(seed: number): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const mb = new MB();
  const base = C(0.10, 0.17, 0.04), tip = C(0.46, 0.52, 0.17);
  const blades = 7;
  for (let k = 0; k < blades; k++) {
    const ang = rng.range(0, Math.PI * 2);
    const off = rng.range(0, 0.12);
    const h = rng.range(0.28, 0.62);
    const lean = rng.range(0.06, 0.32);
    const w = rng.range(0.016, 0.03);
    const dir = V(Math.cos(ang), 0, Math.sin(ang));
    const perp = V(-dir.z, 0, dir.x);
    const segs = 3;
    let pl: THREE.Vector3 | null = null, pr: THREE.Vector3 | null = null, pc: THREE.Color | null = null;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const ctr = V(dir.x * (off + lean * t * t * h), h * t, dir.z * (off + lean * t * t * h));
      const ww = w * (1 - t * 0.92);
      const l = ctr.clone().addScaledVector(perp, ww), r = ctr.clone().addScaledVector(perp, -ww);
      const cc = lerpC(base, tip, Math.pow(t, 0.85) * rng.range(0.85, 1.1));
      if (pl && pr && pc) {
        mb.tri(pl, pr, l, pc, pc, cc, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
        mb.tri(pr, r, l, pc, cc, cc, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
      }
      pl = l; pr = r; pc = cc;
    }
  }
  return mb.build();
}

export function buildFlower(seed: number): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const mb = new MB();
  const stem = C(0.1, 0.25, 0.06), petal = C(1, 1, 1), heart = C(0.95, 0.75, 0.2);
  const h = rng.range(0.22, 0.4);
  const a = V(0.008, 0, 0), b = V(-0.008, 0, 0), c = V(0, h, 0);
  mb.tri(a, c, b, stem, stem, stem, V(0, 0, 1), V(0, 0, 1), V(0, 0, 1));
  const top = V(0, h, 0);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const r = 0.07;
    const p0 = V(Math.cos(a0) * r * 0.5, h + 0.01, Math.sin(a0) * r * 0.5);
    const p1 = V(Math.cos(am) * r, h - 0.005, Math.sin(am) * r);
    const p2 = V(Math.cos(a1) * r * 0.5, h + 0.01, Math.sin(a1) * r * 0.5);
    mb.tri(top, p0, p1, heart, petal, petal, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
    mb.tri(top, p1, p2, heart, petal, petal, V(0, 1, 0), V(0, 1, 0), V(0, 1, 0));
  }
  return mb.build();
}

export function buildRock(seed: number, flat = 0.7, detail = 3): THREE.BufferGeometry {
  const rng = new Rng(seed);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position;
  const v = V();
  const sx = rng.range(0.8, 1.3), sz = rng.range(0.8, 1.3);
  const col: number[] = [];
  const cBase = C(0.52, 0.48, 0.42), cDark = C(0.22, 0.21, 0.22), cMoss = C(0.16, 0.27, 0.08), cLich = C(0.62, 0.54, 0.26);
  const cWarm = C(0.55, 0.40, 0.30);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n1 = noise.n3(v.x * 1.3 + seed, v.y * 1.3, v.z * 1.3);
    const n2 = noise.ridged2(v.x * 2.4 + seed, v.z * 2.4 + v.y * 2.0, 3);
    let k = 1 + 0.22 * n1 + 0.14 * (n2 - 0.5);
    // faceting: quantise the radius a little for angular, blocky rock
    k = Math.round(k * 9) / 9 * 0.65 + k * 0.35;
    p.setXYZ(i, v.x * k * sx, Math.max(v.y * k * flat, -0.45 * flat), v.z * k * sz);
  }
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  const nn = V();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    nn.fromBufferAttribute(nrm, i);
    const strata = Math.sin(v.y * 7 + noise.n3(v.x * 2, v.y, v.z * 2) * 3) * 0.5 + 0.5;
    const c = lerpC(cBase, cDark, strata * 0.55 + (noise.n3(v.x * 5, v.y * 5, v.z * 5) * 0.5 + 0.5) * 0.4);
    c.lerp(cWarm, Math.max(0, noise.n3(v.x * 2 + 9, v.y * 2, v.z * 2)) * 0.5);
    const mossW = Math.max(0, nn.y - 0.45) * 1.8 * (0.5 + 0.5 * noise.n3(v.x * 3 + 7, v.y * 3, v.z * 3));
    c.lerp(cMoss, Math.min(1, mossW));
    if (noise.n3(v.x * 6 + 3, v.y * 6, v.z * 6) > 0.4) c.lerp(cLich, 0.4);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  g.computeBoundingSphere();
  return g;
}
