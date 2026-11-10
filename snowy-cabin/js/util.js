// Shared math, colour and noise helpers.
export const W = 480;
export const H = 270;
export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed = 1) {
    this.f = mulberry32(seed);
  }
  next() {
    return this.f();
  }
  range(a, b) {
    return a + (b - a) * this.f();
  }
  int(a, b) {
    return Math.floor(a + (b - a + 1) * this.f());
  }
  chance(p) {
    return this.f() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.f() * arr.length)];
  }
  sign() {
    return this.f() < 0.5 ? -1 : 1;
  }
}

// ---- colour -------------------------------------------------------------
export const hexRGB = (h) => {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const css = (c, a = 1) =>
  a >= 1
    ? `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
    : `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
// Packed little-endian ABGR so Uint32Array pixel buffers match canvas ImageData.
export const pack = (r, g, b, a = 255) =>
  (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0;
const pcache = new Map();
export function P(hex) {
  let v = pcache.get(hex);
  if (v === undefined) {
    const c = hexRGB(hex);
    v = pack(c[0], c[1], c[2]);
    pcache.set(hex, v);
  }
  return v;
}
export const unpack = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, v >>> 24];
export function mixPacked(a, b, t) {
  const A = unpack(a),
    B = unpack(b);
  return pack(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, 255);
}

// ---- ordered dithering ----------------------------------------------------
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (BAYER4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// ---- value noise ----------------------------------------------------------
function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const hash2 = hash;
export function vnoise(x, y, s = 0, per = 0) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  const fx = x - ix,
    fy = y - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  let x0 = ix,
    x1 = ix + 1;
  if (per) {
    x0 = ((ix % per) + per) % per;
    x1 = (((ix + 1) % per) + per) % per;
  }
  const a = hash(x0, iy, s),
    b = hash(x1, iy, s),
    c = hash(x0, iy + 1, s),
    d = hash(x1, iy + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s = 0, oct = 4, per = 0) {
  let a = 0.5,
    f = 1,
    sum = 0,
    norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += a * vnoise(x * f, y * f, s + i * 17, per ? per * f : 0);
    norm += a;
    a *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}
