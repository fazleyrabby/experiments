// Shared constants and tiny helpers.
export const W = 480;
export const H = 270;
export const M = 28; // horizontal margin baked into parallax layers
export const HOR = 142; // waterline of the far shore

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const wrap = (v, n) => ((v % n) + n) % n;

export class Rng {
  constructor(seed = 1) {
    this.s = seed >>> 0 || 1;
  }
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) {
    return a + (b - a) * this.next();
  }
  int(a, b) {
    return Math.floor(this.range(a, b + 1));
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  chance(p) {
    return this.next() < p;
  }
}

export function hex(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const css = (c, a = 1) =>
  a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

// Value noise with fbm. n(x, y) -> [0, 1]
export function makeNoise(seed) {
  const r = new Rng(seed);
  const P = new Uint8Array(512);
  const V = new Float32Array(256);
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = (r.next() * (i + 1)) | 0;
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  for (let i = 0; i < 256; i++) V[i] = r.next();
  const n2 = (x, y) => {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = x - xi,
      yf = y - yi;
    const u = xf * xf * (3 - 2 * xf),
      v = yf * yf * (3 - 2 * yf);
    const a = V[P[(P[xi & 255] + yi) & 255]];
    const b = V[P[(P[(xi + 1) & 255] + yi) & 255]];
    const c = V[P[(P[xi & 255] + yi + 1) & 255]];
    const d = V[P[(P[(xi + 1) & 255] + yi + 1) & 255]];
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  };
  n2.fbm = (x, y, o = 4) => {
    let s = 0,
      a = 0.5,
      f = 1,
      t = 0;
    for (let i = 0; i < o; i++) {
      s += a * n2(x * f, y * f);
      t += a;
      a *= 0.5;
      f *= 2.03;
    }
    return s / t;
  };
  return n2;
}

// 4x4 ordered dither thresholds in (0, 1)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bay = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];

// Pixel painter used by all sprite generators.
export class PX {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cv = makeCanvas(w, h);
    this.cx = this.cv.getContext('2d');
  }
  p(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.cx.fillStyle = c;
    this.cx.fillRect(x | 0, y | 0, 1, 1);
  }
  rect(x, y, w, h, c) {
    this.cx.fillStyle = c;
    this.cx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }
  line(x0, y0, x1, y1, c) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.p(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // pick from the pixel buffer for read-back (rarely used)
  data() {
    return this.cx.getImageData(0, 0, this.w, this.h);
  }
}

// Re-colour a sprite: multiply by a tint, then blend toward a haze colour. Keeps alpha.
export function tintInto(dst, src, tint, haze, hazeA, extra) {
  const x = dst.getContext('2d');
  const w = dst.width, h = dst.height;
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = 1;
  x.clearRect(0, 0, w, h);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'multiply';
  x.fillStyle = css(tint);
  x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'destination-in';
  x.drawImage(src, 0, 0);
  if (hazeA > 0.004) {
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = css(haze, hazeA);
    x.fillRect(0, 0, w, h);
  }
  if (extra) {
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = css(extra.c, extra.a);
    x.fillRect(0, 0, w, h);
  }
  x.globalCompositeOperation = 'source-over';
}
