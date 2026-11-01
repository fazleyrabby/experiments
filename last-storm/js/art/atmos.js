// Atmosphere: rain, ripples, drifting motes, lightning bolts and glows.
// Every particle position is a closed-form function of time and a seeded index.
import { P, mix, rgba } from '../core/color.js';
import { hash, rng, TAU } from '../core/math.js';

// Rain in three depth layers. p: { t, amount (0..1), wind (slant), lightX, lightY, warm, seed }
const off = (V) => V.layers && V.layers.atmosphere === false;

export function drawRain(g, V, p) {
  if (off(V)) return;
  const { w, h, u, q } = V;
  const amount = p.amount ?? 1;
  if (amount <= 0.01) return;
  const layers = [
    { n: 260, len: 14, wid: 0.6, a: 0.18, speed: 1.1, z: 0.3 },
    { n: 170, len: 26, wid: 0.9, a: 0.26, speed: 1.6, z: 0.6 },
    { n: 60, len: 46, wid: 1.4, a: 0.32, speed: 2.4, z: 1 },
  ];
  const slant = p.wind ?? 0.25;
  const lx = p.lightX ?? w * 0.5;
  const top = p.top ?? 0, bot = p.bottom ?? h;
  g.save();
  g.lineCap = 'round';
  for (let L = 0; L < layers.length; L++) {
    const ly = layers[L];
    const n = Math.round(ly.n * amount * (q < 1 ? 0.6 : 1) * (w / h > 1 ? 1 : 0.8));
    const len = ly.len * u * (p.lenScale ?? 1);
    const span = bot - top + len;
    // Light-catching gradient across the frame: warm near the light source.
    const gr = g.createLinearGradient(lx - w * 0.5, 0, lx + w * 0.5, 0);
    const cool = mix(P.parch, P.teal, 0.35);
    const warmC = mix(P.amber, P.parch, 0.35);
    const wk = p.warm ?? 0.6;
    gr.addColorStop(0, rgba(cool, ly.a * amount));
    gr.addColorStop(0.5, rgba(mix(cool, warmC, wk), Math.min(1, ly.a * amount * (1 + wk))));
    gr.addColorStop(1, rgba(cool, ly.a * amount));
    g.strokeStyle = gr;
    g.lineWidth = ly.wid * u * 1.4;
    const extra = Math.abs(slant) * span;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const s = (p.seed || 0) * 1000 + L * 10000 + i;
      const x0 = hash(s, 1) * (w + extra) - (slant > 0 ? extra : 0);
      const sp = (0.8 + hash(s, 2) * 0.4) * ly.speed;
      const y = top + (((hash(s, 3) + p.t * sp * (h / span) * 0.9) % 1) * span) - len;
      const x = x0 + (y - top) * slant;
      g.moveTo(x, y);
      g.lineTo(x + len * slant, y + len);
    }
    g.stroke();
  }
  g.restore();
}

// Expanding ring ripples on a water plane between y0 and y1 (perspective-squashed).
export function drawRipples(g, V, p) {
  if (off(V)) return;
  const { w, u } = V;
  const n = Math.round((p.count ?? 40) * (V.q < 1 ? 0.6 : 1));
  g.save();
  g.lineWidth = Math.max(0.6, 0.9 * u);
  for (let i = 0; i < n; i++) {
    const life = 0.9 + hash(i, 9) * 0.6;
    const ph = (p.t / life + hash(i, 1)) % 1;
    const cycle = Math.floor(p.t / life + hash(i, 1));
    const x = hash(i * 7 + cycle, 2) * w;
    const zy = hash(i * 7 + cycle, 3);
    const y = p.y0 + (p.y1 - p.y0) * zy * zy;
    const per = 0.25 + zy * 0.9;
    const r = (4 + ph * 34) * u * per;
    g.strokeStyle = rgba(p.color || P.parch, (1 - ph) * (p.a ?? 0.35));
    g.beginPath();
    g.ellipse(x, y, r, r * 0.22, 0, 0, TAU);
    g.stroke();
  }
  g.restore();
}

// Drifting glowing motes (amber particles). p: { t, n, x, y, spread, rise, color, a, seed }
export function drawMotes(g, V, p) {
  if (off(V)) return;
  const { u } = V;
  g.save();
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < p.n; i++) {
    const s = (p.seed || 0) * 977 + i;
    const life = 2.5 + hash(s, 1) * 3;
    const ph = ((p.t - (p.t0 || 0)) / life + hash(s, 2)) % 1;
    const x = p.x + (hash(s, 3) - 0.5) * p.spread + Math.sin(p.t * 0.7 + s) * 14 * u + ph * (p.drift || 0);
    const y = p.y + (hash(s, 4) - 0.5) * p.spread * 0.5 - ph * p.rise;
    const a = Math.sin(ph * Math.PI) * (p.a ?? 0.7);
    const r = (0.8 + hash(s, 5) * 2.2) * u * (p.size ?? 1);
    glow(g, x, y, r * 4, p.color || P.amber, a * 0.35);
    g.fillStyle = rgba(mix(p.color || P.amber, P.parch, 0.5), a);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.restore();
}

export function glow(g, x, y, r, c, a) {
  if (a <= 0.003 || r <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(c, a));
  gr.addColorStop(0.4, rgba(c, a * 0.35));
  gr.addColorStop(1, rgba(c, 0));
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

// A forked lightning bolt from (x, y0) to the horizon y1, seeded, with layered glow strokes.
const bolts = new Map();
function boltPath(seed, len) {
  const key = seed;
  if (bolts.has(key)) return bolts.get(key);
  const r = rng(seed);
  const main = [[0, 0]];
  let x = 0;
  const steps = 22;
  for (let i = 1; i <= steps; i++) {
    x += (r() - 0.5) * 0.12;
    main.push([x, i / steps]);
  }
  const branches = [];
  for (let b = 0; b < 4; b++) {
    const at = 3 + ((r() * (steps - 8)) | 0);
    const pts = [main[at].slice()];
    let bx = main[at][0], by = main[at][1];
    const dir = r() < 0.5 ? -1 : 1;
    const n = 4 + ((r() * 6) | 0);
    for (let i = 0; i < n; i++) {
      bx += dir * (0.02 + r() * 0.05);
      by += 0.025 + r() * 0.03;
      pts.push([bx, by]);
    }
    branches.push(pts);
  }
  const res = { main, branches };
  bolts.set(key, res);
  return res;
}

export function drawBolt(g, V, x, y0, y1, seed, a) {
  if (a <= 0.01) return;
  const { u } = V;
  const b = boltPath(seed);
  const H = y1 - y0;
  const W = H * 0.9;
  const path = (pts) => {
    g.beginPath();
    pts.forEach(([px, py], i) => (i ? g.lineTo(x + px * W, y0 + py * H) : g.moveTo(x + px * W, y0 + py * H)));
  };
  g.save();
  g.globalCompositeOperation = 'screen';
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const passes = [[14, 0.08, P.orange], [6, 0.22, P.amber], [2.2, 0.85, mix(P.parch, P.amber, 0.2)]];
  for (const [lw, al, c] of passes) {
    g.strokeStyle = rgba(c, al * a);
    g.lineWidth = lw * u;
    path(b.main); g.stroke();
    g.lineWidth = lw * u * 0.55;
    for (const br of b.branches) { path(br); g.stroke(); }
  }
  g.restore();
}

// Full-frame flash wash (screen). Strength already flash-safe from the timeline.
export function flashWash(g, V, f, x, y, color = P.amber) {
  if (f <= 0.01) return;
  g.save();
  g.globalCompositeOperation = 'screen';
  const r = Math.max(V.w, V.h) * 1.1;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(mix(color, P.parch, 0.4), 0.55 * f));
  gr.addColorStop(0.5, rgba(color, 0.22 * f));
  gr.addColorStop(1, rgba(color, 0.06 * f));
  g.fillStyle = gr;
  g.fillRect(-V.w, -V.h, V.w * 3, V.h * 3);
  g.restore();
}

// Low drifting mist banks.
export function drawMist(g, V, p) {
  if (off(V)) return;
  const { w, u } = V;
  g.save();
  for (let i = 0; i < p.n; i++) {
    const s = (p.seed || 0) * 31 + i;
    const len = (300 + hash(s, 1) * 600) * u;
    const x = (((hash(s, 2) * 1.6 - 0.3) * w + p.t * (8 + hash(s, 3) * 14) * u * (p.speed ?? 1)) % (w * 1.6 + len)) - len * 0.5;
    const y = p.y + (hash(s, 4) - 0.5) * p.spread;
    const th = (14 + hash(s, 5) * 40) * u;
    const gr = g.createRadialGradient(x, y, 0, x, y, len * 0.5);
    gr.addColorStop(0, rgba(p.color, p.a));
    gr.addColorStop(1, rgba(p.color, 0));
    g.fillStyle = gr;
    g.save();
    g.translate(x, y);
    g.scale(1, th / (len * 0.5));
    g.translate(-x, -y);
    g.fillRect(x - len * 0.5, y - len * 0.5, len, len);
    g.restore();
  }
  g.restore();
}
