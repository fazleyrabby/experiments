// Scene geometry: lake outline, stream, paths and raster masks shared by terrain, layout and audio.
import { W, H, M, HOR, makeCanvas, smooth } from './util.js';

export const CW = W + M * 2; // canvas width of parallax layers

export function nearY(x) {
  const u = (x - 245) / 160;
  const k = Math.max(0, 1 - u * u);
  return HOR + 76 * Math.pow(k, 0.55) + 2.2 * Math.sin(x * 0.21) + 1.4 * Math.sin(x * 0.083 + 1);
}
export const isLake = (x, y) => y >= HOR + 1 && y < nearY(x);

// Catmull-Rom through [x, y, r] points, sampled roughly every `step` px.
export function spline(pts, step = 1) {
  const out = [];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(len / step));
    for (let s = 0; s < n; s++) {
      const t = s / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]), r: f(p0[2], p1[2], p2[2], p3[2]) });
    }
  }
  const l = pts[pts.length - 1];
  out.push({ x: l[0], y: l[1], r: l[2] });
  return out;
}

// Lake outlet stream flowing toward the viewer, under the bridge.  [x, y, radius]
export const STREAM_PTS = [[318, 203, 2.4], [320, 213, 3.2], [326, 224, 4.6], [334, 235, 7.5], [337, 247, 11], [336, 259, 13], [341, 272, 14], [348, 286, 15]];
export const STREAM = spline(STREAM_PTS, 1);

export const PATH_PTS_A = [[52, 190, 3.4], [62, 197, 3.6], [88, 208, 4], [128, 224, 4.6], [168, 238, 5], [214, 246, 5.2], [262, 249, 5.4], [296, 246, 5.4], [312, 243, 5.4]];
export const PATH_PTS_B = [[362, 243, 5.4], [380, 241, 5.2], [404, 234, 5], [430, 224, 4.6], [456, 210, 4.2], [484, 198, 3.8], [512, 188, 3.4]];
export const PATH_A = spline(PATH_PTS_A, 1);
export const PATH_B = spline(PATH_PTS_B, 1);

export const CABIN_POS = { x: 64, y: 187 };
export const BRIDGE_POS = { x: 337, y: 259 };

// Rasterise a variable-width polyline into a mask over the layer canvas (x offset by M).
export function rasterMask(samples, grow = 0, wobble = null) {
  const cv = makeCanvas(CW, H);
  const x = cv.getContext('2d');
  x.fillStyle = '#fff';
  for (const s of samples) {
    const r = s.r + grow + (wobble ? wobble(s.x, s.y) : 0);
    x.beginPath();
    x.arc(s.x + M, s.y, Math.max(0.5, r), 0, Math.PI * 2);
    x.fill();
  }
  const d = x.getImageData(0, 0, CW, H).data;
  const m = new Uint8Array(CW * H);
  for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 140 ? 1 : 0;
  return m;
}

// Chamfer distance (approx. euclidean) from every pixel to the nearest set pixel of `src`.
export function distanceField(src) {
  const D = new Float32Array(CW * H).fill(999);
  for (let i = 0; i < D.length; i++) if (src[i]) D[i] = 0;
  const A = 3, B = 4;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < CW; x++) {
      const i = y * CW + x;
      let v = D[i];
      if (x > 0) v = Math.min(v, D[i - 1] + A);
      if (y > 0) {
        v = Math.min(v, D[i - CW] + A);
        if (x > 0) v = Math.min(v, D[i - CW - 1] + B);
        if (x < CW - 1) v = Math.min(v, D[i - CW + 1] + B);
      }
      D[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = CW - 1; x >= 0; x--) {
      const i = y * CW + x;
      let v = D[i];
      if (x < CW - 1) v = Math.min(v, D[i + 1] + A);
      if (y < H - 1) {
        v = Math.min(v, D[i + CW] + A);
        if (x < CW - 1) v = Math.min(v, D[i + CW + 1] + B);
        if (x > 0) v = Math.min(v, D[i + CW - 1] + B);
      }
      D[i] = v;
    }
  for (let i = 0; i < D.length; i++) D[i] /= 3;
  return D;
}

// Terrain masks (computed once).
export function buildMasks() {
  const lake = new Uint8Array(CW * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < CW; x++) lake[y * CW + x] = isLake(x - M, y) ? 1 : 0;
  const stream = rasterMask(STREAM);
  const pathCore = new Uint8Array(CW * H);
  const pa = rasterMask(PATH_A), pb = rasterMask(PATH_B);
  for (let i = 0; i < pathCore.length; i++) pathCore[i] = pa[i] | pb[i];
  const pa2 = rasterMask(PATH_A, 2.2, (x, y) => Math.sin(x * 0.7 + y * 0.4) * 0.9);
  const pb2 = rasterMask(PATH_B, 2.2, (x, y) => Math.sin(x * 0.7 + y * 0.4) * 0.9);
  const pathOuter = new Uint8Array(CW * H);
  for (let i = 0; i < pathOuter.length; i++) pathOuter[i] = pa2[i] | pb2[i];
  const water = new Uint8Array(CW * H);
  for (let i = 0; i < water.length; i++) water[i] = lake[i] | stream[i];
  return { lake, stream, pathCore, pathOuter, water };
}

export const idx = (x, y) => (y | 0) * CW + ((x | 0) + M);
export { smooth };
