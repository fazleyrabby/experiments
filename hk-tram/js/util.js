/* util.js — small helpers shared across modules. */
import * as THREE from 'three';

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const mod = (a, n) => ((a % n) + n) % n;

/** Concatenate geometries (all must carry the same attribute set) into one non-indexed geometry. */
export function mergeGeometries(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  const names = Object.keys(geos[0].attributes);
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const out = new THREE.BufferGeometry();
  for (const n of names) {
    const size = geos[0].attributes[n].itemSize;
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of geos) { arr.set(g.attributes[n].array, o); o += g.attributes[n].array.length; }
    out.setAttribute(n, new THREE.BufferAttribute(arr, size));
  }
  return out;
}

/** Soft radial glow texture used by sprites, points and light pools. */
export function glowTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Accumulates transformed primitives with per-vertex colour into one non-indexed geometry. */
const _unitBox = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();
export class Mesher {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  /** add a (non-indexed or indexed) geometry transformed by matrix; colour = THREE.Color | hex | (nx,ny,nz)=>Color */
  add(geo, matrix, color) {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(matrix);
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    const fixed = typeof color === 'function' ? null : (color && color.isColor ? color : _c.set(color));
    const fr = fixed ? fixed.r : 0, fg = fixed ? fixed.g : 0, fb = fixed ? fixed.b : 0;
    for (let i = 0; i < P.length; i += 3) {
      this.pos.push(P[i], P[i + 1], P[i + 2]);
      this.nor.push(N[i], N[i + 1], N[i + 2]);
      if (fixed) this.col.push(fr, fg, fb);
      else { const c = color(N[i], N[i + 1], N[i + 2]); this.col.push(c.r, c.g, c.b); }
    }
    g.dispose();
    return this;
  }
  /** axis-aligned (optionally y-rotated / euler-rotated) box centred at x,y,z */
  box(x, y, z, sx, sy, sz, color, rot = null) {
    _p.set(x, y, z); _s.set(sx, sy, sz);
    if (rot === null) _q.identity();
    else if (typeof rot === 'number') _q.setFromEuler(_e.set(0, rot, 0));
    else _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
    return this.add(_unitBox, _m.compose(_p, _q, _s), color);
  }
  /** box spanning from point a to point b (thickness t × t) — handy for rails and struts */
  strut(a, b, t, color, t2 = t) {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    _p.addVectors(a, b).multiplyScalar(0.5);
    _s.set(t, len, t2);
    return this.add(_unitBox, _m.compose(_p, _q, _s), color);
  }
  geo(geo, x, y, z, color, rot = null, scale = 1) {
    _p.set(x, y, z);
    if (typeof scale === 'number') _s.set(scale, scale, scale); else _s.set(scale[0], scale[1], scale[2]);
    if (rot === null) _q.identity();
    else if (typeof rot === 'number') _q.setFromEuler(_e.set(0, rot, 0));
    else _q.setFromEuler(_e.set(rot[0], rot[1], rot[2]));
    return this.add(geo, _m.compose(_p, _q, _s), color);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
}
export const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
