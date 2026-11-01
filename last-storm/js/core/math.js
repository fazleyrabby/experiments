// Deterministic math helpers: easing, seeded RNG, hash noise.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, k) => a + (b - a) * k;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const smooth = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
export const smoother = (k) => { k = clamp(k); return k * k * k * (k * (k * 6 - 15) + 10); };
export const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = (k) => Math.pow(clamp(k), 3);
// 0 → 1 over [a, b], smoothstepped
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
// rises over [a, b], falls over [c, d]
export const window4 = (t, a, b, c, d) => ramp(t, a, b) * (1 - ramp(t, c, d));
export const TAU = Math.PI * 2;

// mulberry32
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

// Stateless hash → [0, 1)
export function hash(i, seed = 0) {
  let x = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(seed | 0, 0x165667b1)) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d);
  x = Math.imul(x ^ (x >>> 12), 0x297a2d39);
  return ((x ^ (x >>> 15)) >>> 0) / 4294967296;
}

// 1D value noise, smooth, period-free
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed), hash(i + 1, seed), u) * 2 - 1;
}

export function fbm1(x, seed = 0, oct = 3) {
  let a = 0.5, s = 0, n = 0;
  for (let o = 0; o < oct; o++) { s += a * noise1(x, seed + o * 31); n += a; x *= 2.03; a *= 0.5; }
  return s / n;
}

// 2D value noise for texture generation
export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const h = (a, b) => hash(a * 73856093 ^ b * 19349663, seed);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
}

export function fbm2(x, y, seed = 0, oct = 4) {
  let a = 0.5, s = 0, n = 0;
  for (let o = 0; o < oct; o++) { s += a * noise2(x, y, seed + o * 17); n += a; x *= 2.01; y *= 2.01; a *= 0.5; }
  return s / n;
}
