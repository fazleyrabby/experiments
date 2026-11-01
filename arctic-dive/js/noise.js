import * as THREE from 'three';

// Tileable 3D cloud noise, baked once on the CPU.
// R: value fBm   G: Worley fBm (low)   B: Worley fBm (mid)   A: Worley fBm (high)
function hash(x, y, z, s) {
  let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791) ^ (s * 2654435761);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = v => Math.min(1, Math.max(0, v));
export const smooth = t => t * t * (3 - 2 * t);

// Table-driven value and Worley noise for the texture bake: lattice values and
// feature points are hashed once per period instead of per lookup.
function latticeTable(p, channels, seed) {
  const t = new Float32Array(p * p * p * channels);
  let k = 0;
  for (let z = 0; z < p; z++) for (let y = 0; y < p; y++) for (let x = 0; x < p; x++)
    for (let c = 0; c < channels; c++) t[k++] = hash(x, y, z, seed + c);
  return t;
}

function vnoiseT(x, y, z, p, t) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi);
  const x0 = xi % p, x1 = (xi + 1) % p, y0 = (yi % p) * p, y1 = ((yi + 1) % p) * p, z0 = (zi % p) * p * p, z1 = ((zi + 1) % p) * p * p;
  return lerp(
    lerp(lerp(t[z0 + y0 + x0], t[z0 + y0 + x1], fx), lerp(t[z0 + y1 + x0], t[z0 + y1 + x1], fx), fy),
    lerp(lerp(t[z1 + y0 + x0], t[z1 + y0 + x1], fx), lerp(t[z1 + y1 + x0], t[z1 + y1 + x1], fx), fy),
    fz);
}

function worleyT(x, y, z, p, t) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let md = 10;
  for (let dz = -1; dz <= 1; dz++) {
    const cz = zi + dz, wz = ((cz + p) % p) * p * p;
    for (let dy = -1; dy <= 1; dy++) {
      const cy = yi + dy, wy = ((cy + p) % p) * p;
      for (let dx = -1; dx <= 1; dx++) {
        const cx = xi + dx, k = (wz + wy + (cx + p) % p) * 3;
        const ox = x - cx - t[k], oy = y - cy - t[k + 1], oz = z - cz - t[k + 2];
        const d = ox * ox + oy * oy + oz * oz;
        if (d < md) md = d;
      }
    }
  }
  return 1 - Math.min(Math.sqrt(md), 1);
}

export function makeCloudNoise(N) {
  const data = new Uint8Array(N * N * N * 4);
  const P = [4, 8, 16, 32];
  const vt = P.map(p => latticeTable(p, 1, 11));
  const wt = P.map(p => latticeTable(p, 3, p * 3 + 1));
  let i = 0;
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, w = z / N;
    const vf = (vnoiseT(u * 4, v * 4, w * 4, 4, vt[0]) * 0.5 + vnoiseT(u * 8, v * 8, w * 8, 8, vt[1]) * 0.25 +
      vnoiseT(u * 16, v * 16, w * 16, 16, vt[2]) * 0.125 + vnoiseT(u * 32, v * 32, w * 32, 32, vt[3]) * 0.0625) / 0.9375;
    const w4 = worleyT(u * 4, v * 4, w * 4, 4, wt[0]), w8 = worleyT(u * 8, v * 8, w * 8, 8, wt[1]);
    const w16 = worleyT(u * 16, v * 16, w * 16, 16, wt[2]), w32 = worleyT(u * 32, v * 32, w * 32, 32, wt[3]);
    data[i++] = clamp01((vf - 0.22) / 0.56) * 255;
    data[i++] = (w4 * 0.625 + w8 * 0.25 + w16 * 0.125) * 255;
    data[i++] = (w8 * 0.625 + w16 * 0.25 + w32 * 0.125) * 255;
    data[i++] = (w16 * 0.75 + w32 * 0.25) * 255;
  }
  const tex = new THREE.Data3DTexture(data, N, N, N);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

// Tileable ripple normals for the sea surface. RG: surface slope (x, z) packed
// to 0..1, B: height (also used as a slow calm/rippled patch mask). Mipmapped so
// distant water averages out to a calm mirror instead of aliasing.
export function makeWaterNormals(N = 256) {
  const P = [4, 8, 16, 32, 64], A = [1, 0.55, 0.32, 0.18, 0.1];
  const tables = P.map(p => latticeTable(p, 1, 31 + p));
  const h = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0;
    for (let k = 0; k < P.length; k++) {
      const n = vnoiseT((x / N) * P[k], (y / N) * P[k], 0, P[k], tables[k]);
      // sharpen the small octaves into crested ripples
      s += A[k] * (k < 2 ? n : 1 - Math.abs(n * 2 - 1));
    }
    h[y * N + x] = s;
  }
  let lo = Infinity, hi = -Infinity;
  for (const v of h) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const at = (i, j) => h[((j + N) % N) * N + ((i + N) % N)];
    const sx = (at(x + 1, y) - at(x - 1, y)) * N * 0.06, sz = (at(x, y + 1) - at(x, y - 1)) * N * 0.06;
    const i = (y * N + x) * 4;
    data[i] = clamp01(sx * 0.5 + 0.5) * 255;
    data[i + 1] = clamp01(sz * 0.5 + 0.5) * 255;
    data[i + 2] = ((at(x, y) - lo) / (hi - lo)) * 255;
    data[i + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}
