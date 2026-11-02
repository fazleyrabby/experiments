// Pre-rendered static layers: mountains, forested hills, far shore, and the land with its stream/path.
import { W, H, M, HOR, PX, Rng, makeNoise, makeCanvas, bay, clamp, lerp, hex, mixc, css, smooth } from './util.js';
import { PAL, makePine, makeOak } from './art.js';
import { CW, nearY, distanceField, idx } from './geometry.js';

const toRgb = (arr) => arr.map(hex);

// ---------- mountains ----------
function ridgeFn(peaks, seed, notchAmt) {
  const n = makeNoise(seed);
  return (x) => {
    let h = 0;
    for (const [px, ph, s] of peaks) h = Math.max(h, ph - Math.abs(x - px) * s);
    h = Math.max(0, h);
    h += (n(x * 0.06, 1.7) - 0.5) * 12 * Math.min(1, h / 40) + (n(x * 0.35, 5.3) - 0.5) * 3.2 * Math.min(1, h / 20);
    const notch = 1 - notchAmt * (Math.exp(-(((x - 74) / 24) ** 2)) + Math.exp(-(((x - 404) / 24) ** 2)));
    return Math.max(0, h * notch);
  };
}

function makeMountains({ seed, base, peaks, ramp, snow, haze, hazeLow, notch }) {
  const cv = makeCanvas(CW, HOR + 2);
  const x2 = cv.getContext('2d');
  const noise = makeNoise(seed + 5);
  const hAt = ridgeFn(peaks, seed, notch);
  const R = toRgb(ramp);
  const S = snow ? toRgb(snow) : null;
  const hz = hex(haze);
  const img = x2.createImageData(CW, HOR + 2);
  const d = img.data;
  const hs = new Float32Array(CW);
  for (let i = 0; i < CW; i++) hs[i] = hAt(i - M);
  for (let i = 0; i < CW; i++) {
    const wx = i - M;
    const h = hs[i];
    if (h < 1) continue;
    const slope = (hs[Math.min(CW - 1, i + 2)] - hs[Math.max(0, i - 2)]) / 4;
    const top = Math.round(base - h);
    for (let y = top; y <= base; y++) {
      const dep = y - top;
      const t = dep / Math.max(8, h);
      const gully = noise(wx * 0.085 + slope * 0.4, y * 0.16);
      const crag = noise(wx * 0.4, y * 0.4);
      let s = 0.5 + clamp(slope * 0.3, -0.34, 0.34) + (gully - 0.5) * 0.62 + (crag - 0.5) * 0.12 - t * 0.14;
      if (dep < 1.4 && slope > 0.1) s += 0.22;
      let col;
      const snowLine = h * 0.36 + (noise(wx * 0.18, y * 0.22) - 0.5) * 9;
      if (S && h > 52 && dep < snowLine && gully > 0.2 - (dep / snowLine) * 0.2) {
        const si = clamp(Math.floor(s * S.length + bay(wx, y) - 0.15), 0, S.length - 1);
        col = S[si];
      } else {
        const ri = clamp(Math.floor(s * R.length + bay(wx, y) - 0.4), 0, R.length - 1);
        col = R[ri];
      }
      const hzMix = clamp(hazeLow * Math.pow(t, 1.4) + 0.07);
      col = mixc(col, hz, hzMix);
      const o = (y * CW + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
  }
  x2.putImageData(img, 0, 0);
  return cv;
}

// forested rolling hills with conifer-teeth silhouette
function makeForestHills({ seed, base, peaks, ramp, notch, hz }) {
  const cv = makeCanvas(CW, HOR + 2);
  const x2 = cv.getContext('2d');
  const r = new Rng(seed);
  const noise = makeNoise(seed);
  const hAt = ridgeFn(peaks, seed, notch);
  const R = toRgb(ramp);
  const teeth = new Float32Array(CW);
  for (let x = 0; x < CW; ) {
    const sp = r.int(4, 8), ht = r.range(2, 7);
    for (let k = 0; k < sp && x + k < CW; k++) teeth[x + k] = ht * (1 - Math.abs(k - sp / 2) / (sp / 2));
    x += sp;
  }
  const img = x2.createImageData(CW, HOR + 2);
  const d = img.data;
  const hzc = hex(hz);
  for (let i = 0; i < CW; i++) {
    const wx = i - M;
    const h = hAt(wx);
    if (h < 1) continue;
    const top = Math.round(base - h - teeth[i]);
    for (let y = top; y <= base; y++) {
      const dep = y - top;
      const t = dep / (h + 6);
      let s = 0.55 + (noise(wx * 0.12, y * 0.22) - 0.5) * 0.7 - t * 0.35 + (dep < 2 ? 0.16 : 0);
      // tree columns
      s += Math.sin(wx * 1.9 + noise(wx * 0.3, 2) * 4) * 0.08;
      const ri = clamp(Math.floor(s * R.length + bay(wx, y) - 0.3), 0, R.length - 1);
      const col = mixc(R[ri], hzc, 0.18 + 0.42 * Math.pow(1 - t, 3) * 0);
      const o = (y * CW + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
  }
  x2.putImageData(img, 0, 0);
  return cv;
}

// row(s) of small trees along the far shoreline
function makeShoreTrees({ seed, base, hMin, hMax, pineChance, step, dark }) {
  const cv = makeCanvas(CW, HOR + 4);
  const x2 = cv.getContext('2d');
  const r = new Rng(seed);
  const pines = [], oaks = [];
  for (let i = 0; i < 6; i++) {
    pines.push(makePine(seed + i, r.int(hMin, hMax)));
    oaks.push(makeOak(seed + 50 + i, r.int(hMin, hMax), { wide: 0.9 }));
  }
  for (let x = -10; x < CW + 10; x += r.range(step * 0.6, step * 1.3)) {
    const wx = x - M;
    const nearNotch = Math.exp(-(((wx - 74) / 34) ** 2)) + Math.exp(-(((wx - 404) / 34) ** 2));
    const spr = r.chance(pineChance) ? r.pick(pines) : r.pick(oaks);
    const sc = 1 - Math.min(0.6, nearNotch * 0.7);
    const w = Math.round(spr.width * sc), h = Math.round(spr.height * sc);
    x2.drawImage(spr, Math.round(x - w / 2), base - h + r.int(0, 2), w, h);
  }
  if (dark) {
    x2.globalCompositeOperation = 'source-atop';
    x2.fillStyle = css(hex(dark), 0.5);
    x2.fillRect(0, 0, CW, HOR + 4);
  }
  return cv;
}

export function buildBackdrop() {
  const mtnFar = makeMountains({
    seed: 11, base: HOR - 4, notch: 0.9,
    peaks: [[10, 66, 1.5], [150, 98, 1.25], [224, 122, 1.4], [300, 96, 1.3], [352, 74, 1.45], [466, 72, 1.5]],
    ramp: ['#334566', '#465b82', '#5d739b', '#788fb4', '#97aecb'],
    snow: ['#7d96bc', '#a9bfdc', '#d6e4f2', '#ffffff'],
    haze: '#b6c8dc', hazeLow: 0.62,
  });
  const mtnNear = makeMountains({
    seed: 23, base: HOR - 2, notch: 0.8,
    peaks: [[44, 42, 1.0], [186, 56, 1.55], [262, 44, 1.3], [378, 60, 1.35], [450, 46, 1.2]],
    ramp: ['#1f3a46', '#2a4c58', '#3a6068', '#4f7a78', '#6c9488'],
    snow: null,
    haze: '#9db8c8', hazeLow: 0.5,
  });
  const hills = makeForestHills({
    seed: 31, base: HOR, notch: 0.55,
    peaks: [[20, 36, 1.0], [130, 22, 1.4], [255, 16, 1.6], [340, 24, 1.3], [440, 34, 1.0]],
    ramp: ['#0f2e2a', '#16443a', '#215a40', '#2f7448', '#43905a'],
    hz: '#9fbdc8',
  });
  const shoreBack = makeShoreTrees({ seed: 41, base: HOR - 1, hMin: 12, hMax: 22, pineChance: 0.7, step: 7, dark: '#355a62' });
  const shoreFront = makeShoreTrees({ seed: 71, base: HOR + 1, hMin: 14, hMax: 32, pineChance: 0.55, step: 8 });
  return { mtnFar, mtnNear, hills, shoreBack, shoreFront };
}

// ---------- land ----------
export function buildLand(masks, aoSpots) {
  const cv = makeCanvas(CW, H);
  const x2 = cv.getContext('2d');
  const img = x2.createImageData(CW, H);
  const d = img.data;
  const noise = makeNoise(99);
  const r = new Rng(5);
  const G = toRgb(PAL.grass), SA = toRgb(PAL.sand), DI = toRgb(PAL.dirt), RO = toRgb(PAL.rock), WA = toRgb(PAL.water);
  const dW = distanceField(masks.water);
  const dS = distanceField(masks.stream.map((v, i) => (v ? 0 : 1)));
  // soft occlusion under trees
  const ao = new Float32Array(CW * H);
  for (const s of aoSpots) {
    const rx = s.r * 1.15, ry = s.r * 0.42;
    for (let y = Math.max(0, Math.floor(s.y - ry)); y < Math.min(H, Math.ceil(s.y + ry)); y++)
      for (let x = Math.max(0, Math.floor(s.x + M - rx)); x < Math.min(CW, Math.ceil(s.x + M + rx)); x++) {
        const dx = (x - M - s.x) / rx, dy = (y - s.y) / ry;
        const q = 1 - (dx * dx + dy * dy);
        if (q > 0) ao[y * CW + x] = Math.max(ao[y * CW + x], q * s.a);
      }
  }
  for (let y = HOR - 1; y < H; y++) {
    for (let xi = 0; xi < CW; xi++) {
      const i = y * CW + xi;
      const x = xi - M;
      if (masks.lake[i] && !masks.stream[i]) continue;
      if (y <= HOR + 2 && nearY(x) > HOR + 4) continue;
      const depth = (y - HOR) / (H - HOR);
      let col;
      if (masks.stream[i]) {
        const e = dS[i];
        // water body of the stream
        const depthT = clamp((e - 1) / 7);
        let wi = 2 + depthT * 1.6 + (noise(x * 0.25, y * 0.25) - 0.5) * 1.1;
        wi += (bay(x, y) - 0.5) * 0.9;
        col = WA[clamp(Math.round(wi), 1, 5)];
        if (e < 1.6) col = DI[clamp(Math.floor(1 + noise(x * 0.5, y * 0.5) * 2), 0, 3)];
        else if (e < 2.4) col = WA[1];
      } else {
        // land
        const dw = dW[i];
        const sandW = 2.2 + noise(x * 0.07, y * 0.1) * 3.4 * (0.35 + depth);
        let v = 0.62 * noise.fbm(x * 0.03, y * 0.07, 3) + 0.3 * noise(x * 0.011 + 4, y * 0.02) + 0.1;
        v = v * 0.86 + 0.14 + depth * 0.1 - ao[i] * 0.55;
        v += (noise(x * 0.33, y * 0.4) - 0.5) * 0.12;
        let gi = clamp(Math.floor(v * (G.length - 1) + bay(x, y) - 0.15), 0, G.length - 1);
        col = G[gi];
        if (dw < sandW + 1.6) {
          const m = dw <= 1 ? 0 : dw <= 2 ? 1 : dw < sandW ? 2 : 3;
          if (m <= 2) col = SA[clamp(m + (bay(x, y) > 0.7 ? 1 : 0), 0, 4)];
          else if (bay(x, y) > 0.5) col = SA[2];
          if (m === 0 && (x * 7 + y * 13) % 5 === 0) col = RO[2];
        }
        if (masks.pathOuter[i] || masks.pathCore[i]) {
          const core = masks.pathCore[i];
          const dv = 0.5 + (noise(x * 0.18, y * 0.3) - 0.5) * 0.9;
          let di = clamp(Math.floor(dv * 4 + bay(x, y) - 0.1 + (core ? 0.7 : 0)), 0, 4);
          if (!core && bay(x, y) > 0.55) di = -1;
          if (di >= 0) col = DI[di];
          if (core && r.next() < 0.02) col = RO[3];
        }
      }
      const o = i * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
  }
  // blades and speckles for texture
  x2.putImageData(img, 0, 0);
  const px = { p: (x, y, c) => { x2.fillStyle = c; x2.fillRect(x + M, y, 1, 1); } };
  for (let n = 0; n < 2600; n++) {
    const x = r.int(-M + 2, W + M - 3), y = r.int(HOR + 4, H - 1);
    const i = y * CW + x + M;
    if (masks.water[i] || masks.pathOuter[i] || dW[i] < 5) continue;
    const dep = (y - HOR) / (H - HOR);
    const len = 1 + (dep > 0.5 ? 1 : 0) + (r.chance(0.3) ? 1 : 0);
    const k = clamp(Math.floor(noise(x * 0.05, y * 0.1) * 5 + r.range(-1, 1.5)), 1, 6);
    px.p(x, y, PAL.grass[Math.max(0, k - 2)]);
    for (let j = 1; j <= len; j++) px.p(x, y - j, PAL.grass[Math.min(6, k + (j === len ? 1 : 0))]);
    if (r.chance(0.4)) px.p(x + 1, y - 1, PAL.grass[Math.min(6, k)]);
  }
  // clover and tiny wildflowers baked into the grass
  const fl = ['#ffffff', '#f6e04a', '#f6a6cc', '#c8a8ff'];
  for (let n = 0; n < 900; n++) {
    const x = r.int(-M + 2, W + M - 3), y = r.int(HOR + 20, H - 1);
    const i = y * CW + x + M;
    if (masks.water[i] || masks.pathOuter[i] || dW[i] < 6) continue;
    if (noise(x * 0.06 + 20, y * 0.09) < 0.55) continue;
    px.p(x, y, r.pick(fl));
  }
  // pebbles near the water, mossy stones along the stream
  for (let n = 0; n < 420; n++) {
    const x = r.int(-M + 2, W + M - 3), y = r.int(HOR + 6, H - 2);
    const i = y * CW + x + M;
    if (masks.water[i] || (dW[i] > 6 && !masks.pathCore[i])) continue;
    const c = RO[r.int(1, 4)];
    px.p(x, y, c);
    if (r.chance(0.5)) px.p(x + 1, y, RO[r.int(0, 2)]);
  }
  return { cv, dW, ao };
}

export { idx, smooth, lerp, PX };
