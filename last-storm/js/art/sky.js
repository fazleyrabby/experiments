// Sky gradients and painted cloud masses. Clouds are pre-rendered sprites (base + lightning-lit)
// built from overlapping shaded puffs with ink contours and pigment staining.
import { P, mix, rgba } from '../core/color.js';
import { rng, clamp, TAU } from '../core/math.js';
import { makeCanvas, textures } from '../core/textures.js';

const MOODS = {
  // Sunset towers: amber tops, burnt-orange bodies, midnight undersides.
  warm: { top: mix(P.amber, P.parch, 0.3), body: mix(P.orange, P.amber, 0.15), mid: mix(P.orange, P.rust, 0.55), shadow: mix(P.rust, P.night, 0.4), ink: mix(P.rust, P.night, 0.75) },
  // Storm: dark bodies under-lit from the sea by amber.
  storm: { top: mix(P.amber, P.parch, 0.2), body: mix(P.orange, P.rust, 0.4), mid: mix(P.rust, P.night, 0.45), shadow: mix(P.night, P.teal, 0.2), ink: P.ink, under: P.amber, heightK: -0.2 },
  // Dawn after rain: pale gold, low contrast.
  pale: { top: mix(P.parch, P.amber, 0.35), body: mix(P.parch, P.orange, 0.22), mid: mix(mix(P.parch, P.teal, 0.4), P.orange, 0.15), shadow: mix(P.teal, P.parch, 0.25), ink: mix(P.teal, P.night, 0.45) },
  // Cold, drained (scene 3 window).
  cold: { top: mix(P.parch, P.teal, 0.35), body: mix(P.teal, P.parch, 0.18), mid: P.teal, shadow: P.deep, ink: P.night },
};

const sprites = new Map();
// Debug layer switches for draws that have no view object (set from the film's view).
export const layerOff = { clouds: false };

function genPuffs(seed, W, H, shape) {
  const r = rng(seed);
  const puffs = [];
  const pad = W * 0.02;
  const base = H * 0.92;
  const tower = shape === 'tower';
  const n = tower ? 260 : 150;
  const cx = 0.5 + (r() - 0.5) * 0.12;
  const lean = (r() - 0.5) * 0.25;
  for (let i = 0; i < n; i++) {
    const yn0 = Math.pow(r(), 0.85);
    // Towers narrow as they rise and lean a little; banks stay long and low.
    const half = tower ? 0.44 * (1 - yn0 * 0.55) * (0.85 + 0.15 * Math.sin(yn0 * 9 + seed)) : 0.46;
    const xn = cx + lean * yn0 + (r() * 2 - 1) * half;
    const d = (xn - cx - lean * yn0) / half;
    const env = tower ? 1 - 0.35 * d * d : Math.pow(Math.max(0, 1 - d * d), 0.5) * (0.4 + 0.14 * Math.sin(xn * 17 + seed));
    const yn = yn0 * env;
    let rad = W * (0.022 + 0.048 * Math.pow(r(), 1.5)) * (tower ? 1.15 - yn * 0.45 : 0.8);
    const x = xn * W, y = base - yn * (H * 0.86);
    rad = Math.min(rad, x - pad, W - pad - x, y - pad);
    if (rad > W * 0.006) puffs.push({ x, y, r: rad });
  }
  // Higher lobes are drawn first so lower ones overlap them (cauliflower layering).
  puffs.sort((a, b) => a.y - b.y);
  return puffs;
}

// Tile noise sampled from the pigment and paper textures (read once).
let noiseTiles = null;
function noiseTile() {
  if (noiseTiles) return noiseTiles;
  const t = textures();
  const read = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  noiseTiles = { a: read(t.pigment), b: read(t.paper), n: t.pigment.width };
  return noiseTiles;
}

const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// Paint a cloud sprite per pixel. Lobes are sphere caps merged with a soft maximum into a
// heightfield, so every lobe has a real rounded surface; normals from that surface drive a
// posterised light ramp, with brush-streak noise, rim light on lit edges and ink on shadowed ones.
function paintCloud(canvas, puffs, m, lit, light) {
  const W = canvas.width, H = canvas.height;
  const g = canvas.getContext('2d');
  const hf = new Float32Array(W * H);
  const k = 16 * (W / 1100); // smooth-max blend width (px)
  for (const p of puffs) {
    const R = p.r, R2 = R * R;
    const x0 = Math.max(0, Math.floor(p.x - R)), x1 = Math.min(W - 1, Math.ceil(p.x + R));
    const y0 = Math.max(0, Math.floor(p.y - R)), y1 = Math.min(H - 1, Math.ceil(p.y + R));
    for (let y = y0; y <= y1; y++) {
      const dy = y - p.y;
      for (let x = x0; x <= x1; x++) {
        const dx = x - p.x;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R2) continue;
        const hs = Math.sqrt(R2 - d2);
        const j = y * W + x;
        const a = hf[j];
        if (a === 0) { hf[j] = hs; continue; }
        // Polynomial smooth max: C1-continuous, so lobe edges leave no rings.
        const hh = Math.max(k - Math.abs(a - hs), 0) / k;
        hf[j] = (a > hs ? a : hs) + hh * hh * k * 0.25;
      }
    }
  }

  const img = g.createImageData(W, H);
  const d = img.data;
  const nt = noiseTile();
  const N = nt.n;
  const lx = Math.cos(light), ly = Math.sin(light), lz = 0.62;
  const ll = Math.hypot(lx, ly, lz);
  const ramp = lit
    ? [mix(P.rust, P.orange, 0.5), P.orange, P.amber, mix(P.amber, P.parch, 0.5), mix(P.parch, [255, 250, 235], 0.4)]
    : [m.shadow, m.mid, m.body, mix(m.body, m.top, 0.6), m.top];
  const col = [0, 0, 0];
  const rampAt = (v) => {
    const x = clamp(v) * (ramp.length - 1);
    const i = Math.min(ramp.length - 2, Math.floor(x)), f = x - i;
    const a = ramp[i], b = ramp[i + 1];
    col[0] = a[0] + (b[0] - a[0]) * f; col[1] = a[1] + (b[1] - a[1]) * f; col[2] = a[2] + (b[2] - a[2]) * f;
  };
  const blend = (c, kk) => { col[0] += (c[0] - col[0]) * kk; col[1] += (c[1] - col[1]) * kk; col[2] += (c[2] - col[2]) * kk; };
  const rim = lit ? P.parch : mix(m.top, P.parch, 0.45);
  const ink = m.ink, under = m.under;
  const ns = 1100 / W;
  const edgePx = 7 / ns;
  for (let y = 1; y < H - 1; y++) {
    const yn = y / H;
    const baseFade = 1 - sstep(0.8, 0.99, yn);
    for (let x = 1; x < W - 1; x++) {
      const j = y * W + x;
      const h0 = hf[j];
      // Brush noise: streaked (stretched horizontally) pigment, plus a finer paper tooth.
      const b1 = nt.a[((((y * ns * 2.6) | 0) % N) * N + (((x * ns * 0.55) | 0) % N)) * 4 + 3] / 255;
      const b2 = nt.b[((((y * ns * 0.7) | 0) % N) * N + (((x * ns * 0.7) | 0) % N)) * 4] / 255;
      const b3 = nt.b[((((y * ns * 3.1) | 0) % N) * N + (((x * ns * 3.1 + 37) | 0) % N)) * 4] / 255;
      const hn = h0 + (b1 - 0.5) * 9 / ns + (b2 - 0.5) * 4 / ns;
      const alpha = sstep(0.4, 4 / ns, hn) * baseFade;
      const o = j * 4;
      if (alpha <= 0.002) continue;
      const nx = -(hf[j + 1] - hf[j - 1]) * 0.5, ny = -(hf[j + W] - hf[j - W]) * 0.5;
      const nl = Math.hypot(nx, ny, 1);
      const lam = (nx * lx + ny * ly + lz) / (nl * ll);
      let v;
      if (lit) v = 0.25 + lam * 0.45 + clamp(h0 / (60 / ns)) * 0.35 + (b1 - 0.5) * 0.24 + (b3 - 0.5) * 0.08;
      else v = lam * 0.6 + (m.heightK ?? 0.32) * (1 - yn) + ((m.heightK ?? 0.32) < 0 ? 0.25 : 0.02) + (b1 - 0.5) * 0.3 + (b2 - 0.5) * 0.08 + (b3 - 0.5) * 0.1;
      const q = Math.round(v * 5) / 5;
      rampAt(v * 0.65 + q * 0.35);
      const edge = 1 - sstep(0, edgePx, hn);
      if (edge > 0.01) {
        if (lam > 0.5) blend(rim, edge * sstep(0.5, 0.85, lam) * (lit ? 0.9 : 0.8));
        else blend(ink, edge * 0.6 * (1 - lam));
      }
      if (under && !lit) blend(under, sstep(0.55, 0.95, yn) * clamp(0.6 - lam) * 0.85);
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2];
      d[o + 3] = alpha * 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// Returns { base, lit, aspect }. `light` is the direction toward the light (radians, y down).
export function cloudSprite(seed, mood = 'warm', shape = 'tower', res = 1100, light = -Math.PI * 0.72) {
  const key = `${seed}|${mood}|${shape}|${res}|${light.toFixed(2)}`;
  let s = sprites.get(key);
  if (s) return s;
  const W = res, H = Math.round(res * (shape === 'tower' ? 0.95 : 0.42));
  const puffs = genPuffs(seed, W, H, shape);
  const base = makeCanvas(W, H), lit = makeCanvas(W, H);
  paintCloud(base, puffs, MOODS[mood], false, light);
  paintCloud(lit, puffs, MOODS[mood], true, light);
  s = { base, lit, aspect: H / W };
  sprites.set(key, s);
  return s;
}

// Sprite resolution from the cloud's drawn width, so close-ups stay crisp and previews stay cheap.
export function spriteRes(V, drawnW = 900) {
  const need = drawnW * (V.q < 1 ? 0.8 : 1);
  return need > 1250 ? 1400 : need > 760 ? 1100 : 700;
}

// Draw a cloud anchored at its bottom centre.
export function drawCloud(g, spr, x, y, width, alpha = 1, flash = 0) {
  if (layerOff.clouds) return;
  const h = width * spr.aspect;
  g.globalAlpha = alpha;
  g.drawImage(spr.base, x - width / 2, y - h, width, h);
  if (flash > 0.01) {
    g.globalAlpha = alpha * Math.min(1, flash);
    g.drawImage(spr.lit, x - width / 2, y - h, width, h);
  }
  g.globalAlpha = 1;
}

// Painted sky: vertical gradient, sun glow behind cloud, horizon haze.
export function drawSky(g, V, p) {
  const { w, h } = V;
  const hz = p.horizon;
  const warm = p.warm ?? 1, cold = p.cold ?? 0;
  const topC = mix(P.night, P.coldDeep, cold);
  const midC = mix(mix(P.rust, P.teal, 0.25), P.teal, cold);
  const lowC = mix(mix(P.orange, P.amber, 0.35), P.cold, cold);
  const sky = g.createLinearGradient(0, -h * 0.2, 0, hz);
  sky.addColorStop(0, rgba(topC));
  sky.addColorStop(0.5, rgba(mix(topC, midC, warm)));
  sky.addColorStop(0.86, rgba(mix(midC, lowC, warm * 0.85)));
  sky.addColorStop(1, rgba(mix(lowC, P.parch, 0.25 * warm)));
  g.fillStyle = sky;
  g.fillRect(-w, -h, w * 3, hz + h + 2);
  if (p.sun) {
    const { x, y, r, a } = p.sun;
    const gl = g.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, rgba(mix(P.parch, P.amber, 0.3), 0.9 * a));
    gl.addColorStop(0.08, rgba(P.amber, 0.65 * a));
    gl.addColorStop(0.35, rgba(P.orange, 0.22 * a));
    gl.addColorStop(1, rgba(P.orange, 0));
    g.fillStyle = gl;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// Soft horizontal haze band at the horizon.
export function drawHaze(g, V, y, height, color, a) {
  const hg = g.createLinearGradient(0, y - height, 0, y + height);
  hg.addColorStop(0, rgba(color, 0));
  hg.addColorStop(0.5, rgba(color, a));
  hg.addColorStop(1, rgba(color, 0));
  g.fillStyle = hg;
  g.fillRect(-V.w, y - height, V.w * 3, height * 2);
}

// Distant brushed cloud streaks near the horizon (stratus), procedural each frame.
export function drawStreaks(g, V, p) {
  const r = rng(p.seed || 5);
  const { w, u } = V;
  for (let i = 0; i < p.count; i++) {
    const y = p.y + (r() - 0.6) * p.spread;
    const len = (200 + r() * 520) * u;
    const x = ((r() * 1.4 - 0.2) * w + (p.drift || 0) * (0.5 + r())) % (w * 1.4) - w * 0.1;
    const th = (1.5 + r() * 5) * u;
    g.fillStyle = rgba(mix(p.color, p.color2 || p.color, r()), p.a * (0.4 + r() * 0.6));
    g.beginPath();
    g.ellipse(x, y, len / 2, th, 0, 0, TAU);
    g.fill();
  }
}
