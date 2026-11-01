// Textures generated once from fixed seeds and reused every frame.
import { rng, fbm2, noise2 } from './math.js';

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function fromField(size, fn) {
  const c = makeCanvas(size, size);
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const d = img.data;
  for (let y = 0, i = 0; y < size; y++) {
    for (let x = 0; x < size; x++, i += 4) {
      const [v, a] = fn(x, y);
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = a;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

let cache = null;

export function textures() {
  if (cache) return cache;
  const S = 512;
  // Tileable fbm: sample on a torus-ish blend of four offsets.
  const tile = (x, y, f, seed, oct) => {
    const u = x / S, v = y / S;
    const a = fbm2(u * f, v * f, seed, oct), b = fbm2((u - 1) * f, v * f, seed, oct);
    const c = fbm2(u * f, (v - 1) * f, seed, oct), d = fbm2((u - 1) * f, (v - 1) * f, seed, oct);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };

  // Paper: fine fibres over soft mottling, centred on mid-grey for overlay blending.
  const r = rng(11);
  const paper = fromField(S, (x, y) => {
    const m = tile(x, y, 6, 3, 4);
    const fib = noise2(x * 0.9, y * 0.06, 9) * 0.5 + noise2(x * 0.05, y * 0.8, 13) * 0.5;
    const v = 128 + (m - 0.5) * 70 + (fib - 0.5) * 34 + (r() - 0.5) * 16;
    return [Math.max(0, Math.min(255, v)), 255];
  });

  // Pigment: blotchy, low-frequency, alpha-varying, for source-atop staining.
  const pigment = fromField(S, (x, y) => {
    const m = tile(x, y, 4, 21, 5);
    const n = tile(x, y, 16, 27, 2);
    const v = m * 0.8 + n * 0.2;
    return [v > 0.5 ? 255 : 0, Math.min(255, Math.abs(v - 0.5) * 2 * 255 * 1.4)];
  });

  // Film grain: four small tiles, chosen by frame number.
  const grain = [];
  for (let k = 0; k < 4; k++) {
    const gr = rng(100 + k);
    grain.push(fromField(256, () => [128 + (gr() + gr() + gr() - 1.5) * 90, 255]));
  }

  // Scratches and specks on a 1600×900 sheet, stretched to the frame.
  const scratches = makeCanvas(1600, 900);
  {
    const g = scratches.getContext('2d');
    const sr = rng(77);
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = sr() * 1600, y = sr() * 900, len = 40 + sr() * 260, ang = -1.2 + sr() * 0.5;
      g.strokeStyle = `rgba(232,213,178,${0.05 + sr() * 0.09})`;
      g.lineWidth = 0.6 + sr() * 0.9;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (sr() - 0.5) * 20, y + Math.sin(ang) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      g.stroke();
    }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = sr() < 0.5 ? `rgba(232,213,178,${0.04 + sr() * 0.08})` : `rgba(6,28,39,${0.08 + sr() * 0.12})`;
      g.beginPath();
      g.arc(sr() * 1600, sr() * 900, 0.4 + sr() * 1.6, 0, Math.PI * 2);
      g.fill();
    }
  }

  cache = { paper, pigment, grain, scratches, patterns: new WeakMap() };
  return cache;
}

// createPattern is per-context; memoise per context.
export function pattern(ctx, canvas) {
  const t = textures();
  let m = t.patterns.get(ctx);
  if (!m) { m = new Map(); t.patterns.set(ctx, m); }
  let p = m.get(canvas);
  if (!p) { p = ctx.createPattern(canvas, 'repeat'); m.set(canvas, p); }
  return p;
}
