// Ocean: perspective bands of independently moving Bézier waves with gold ink contours,
// foam, and a light column of broken reflections. `stillness` flattens it to a mirror.
import { P, mix, rgba } from '../core/color.js';
import { hash, clamp } from '../core/math.js';

const BANDS = 18;

function waveY(x, t, b, A) {
  // Swell groups: amplitude rises and falls along the band.
  A *= 0.55 + 0.45 * Math.sin(x * b.k1 * 0.17 + b.p2 + t * 0.15);
  const s = 0.55 * Math.sin(x * b.k1 + t * b.w1 + b.p1)
    + 0.3 * Math.sin(x * b.k2 - t * b.w2 + b.p2)
    + 0.15 * Math.sin(x * b.k3 + t * b.w3 + b.p3);
  // Taller, sharper crests and flatter troughs.
  return -A * (s > 0 ? s * (1 + 0.45 * s) : s * 0.7);
}

function bandParams(i, u, chop) {
  const z = (i + 1) / BANDS;
  const lam = (30 + 1300 * Math.pow(z, 1.6)) * u;
  const k = (Math.PI * 2) / lam;
  return {
    z,
    k1: k, k2: k * 1.83, k3: k * 3.1,
    w1: 0.9 + hash(i, 1) * 0.5, w2: 1.3 + hash(i, 2) * 0.6, w3: 2.1 + hash(i, 3),
    p1: hash(i, 4) * 6.28, p2: hash(i, 5) * 6.28, p3: hash(i, 6) * 6.28,
    amp: (0.5 + 34 * Math.pow(z, 2.2)) * u * chop,
  };
}

// p: { horizon, t, amp, stillness, warm, cold, lightX, light, lightColor, camX, contour, part, split }
// part: 'all' | 'back' | 'front' — split by band baseline relative to `split` (y px)
export function drawOcean(g, V, p) {
  if (V.layers && V.layers.ocean === false) return;
  const { w, h, u } = V;
  const hz = p.horizon;
  const depth = (p.bottom ?? h) - hz;
  const still = p.stillness || 0;
  const amp = (p.amp ?? 1) * (1 - still * 0.97);
  const t = p.t;
  const warm = p.warm ?? 1, cold = p.cold ?? 0;
  const part = p.part || 'all';
  const lightC = p.lightColor || P.amber;
  const camX = p.camX || 0;
  const x0 = -w * 0.25, x1 = w * 1.25;

  const farC = mix(mix(P.seaLight, P.orange, 0.35 * warm), P.cold, cold);
  const nearC = mix(P.night, P.coldDeep, cold * 0.5);

  if (part !== 'front') {
    const base = g.createLinearGradient(0, hz, 0, hz + depth);
    base.addColorStop(0, rgba(mix(farC, P.parch, 0.15)));
    base.addColorStop(0.15, rgba(mix(farC, P.teal, 0.5)));
    base.addColorStop(1, rgba(nearC));
    g.fillStyle = base;
    g.fillRect(x0, hz, x1 - x0, depth + h);
  }

  const step0 = Math.max(4, 7 * u);
  for (let i = 0; i < BANDS; i++) {
    const b = bandParams(i, u, 1);
    const z = b.z;
    const y0 = hz + depth * Math.pow(z, 1.85);
    if (part === 'back' && y0 > p.split) continue;
    if (part === 'front' && y0 <= p.split) continue;
    const A = b.amp * amp;
    const off = camX * (0.15 + z);
    const step = Math.max(step0, Math.min(40 * u, (1 / b.k1) * 0.9));
    const tt = t * (0.55 + 0.45 * (p.speed ?? 1));

    // Band body.
    const crestC = mix(mix(P.teal, P.seaLight, 0.6 - z * 0.4), mix(P.orange, P.amber, 0.4), 0.22 * warm * (1 - z));
    const bodyC = mix(mix(P.teal, P.night, 0.25 + z * 0.55), P.coldDeep, cold * 0.6);
    const gr = g.createLinearGradient(0, y0 - A * 1.4, 0, y0 + depth * 0.08 + A);
    gr.addColorStop(0, rgba(mix(crestC, P.cold, cold * 0.6)));
    gr.addColorStop(0.35, rgba(bodyC));
    gr.addColorStop(1, rgba(mix(bodyC, P.night, 0.4)));
    g.fillStyle = gr;
    g.beginPath();
    let px = x0, py = y0 + waveY(px + off, tt, b, A);
    g.moveTo(px, py);
    for (let x = x0 + step; x <= x1 + step; x += step) {
      const y = y0 + waveY(x + off, tt, b, A);
      g.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
      px = x; py = y;
    }
    g.lineTo(x1 + step, h * 2);
    g.lineTo(x0, h * 2);
    g.closePath();
    g.fill();

    // Contours: dark ink line just below crest, gold line on top, both broken.
    const cA = (p.contour ?? 1) * (z < 0.2 ? z * 1.2 : 0.25 + 0.6 * z);
    if (cA > 0.02 && still < 0.95) {
      g.save();
      g.lineCap = 'round';
      const dash = (seed, a, b) => [0, 1, 2, 3, 4, 5].map((j) => (j % 2 ? b : a) * (0.3 + hash(i * 6 + j, seed) * 1.4) * u * (0.4 + z));
      g.setLineDash(dash(7, 60, 22));
      g.lineDashOffset = -off;
      g.strokeStyle = rgba(P.ink, cA * 0.55);
      g.lineWidth = (0.5 + 1.8 * z) * u;
      strokeWave(g, x0, x1, step, y0 + 1.6 * u * (0.5 + z), off, tt, b, A);
      const gold = mix(mix(P.amber, P.parch, 0.3), P.cold, cold * 0.8);
      g.strokeStyle = rgba(gold, cA * (0.35 + 0.65 * (p.light ?? 0.6)));
      g.lineWidth = (0.4 + 1.3 * z) * u;
      g.setLineDash(dash(9, 80, 45));
      strokeWave(g, x0, x1, step, y0, off, tt, b, A);
      g.restore();
    }

    // Foam caps on the nearer crests.
    if (z > 0.35 && amp > 0.25 && (p.foam ?? 1) > 0) {
      const n = Math.round((4 + 10 * z) * (p.foam ?? 1) * V.q);
      g.fillStyle = rgba(mix(P.parch, P.cold, cold), 0.35 + 0.25 * amp);
      for (let j = 0; j < n; j++) {
        const fx = x0 + ((hash(j, i * 31) * (x1 - x0) - off * 0.2 + t * 6 * u * z) % (x1 - x0) + (x1 - x0)) % (x1 - x0);
        const fy = y0 + waveY(fx + off, tt, b, A);
        // Only near the crest.
        if (fy > y0 - A * 0.55) continue;
        const fl = (6 + 26 * z * hash(j, i)) * u * Math.min(1.6, amp);
        g.beginPath();
        g.ellipse(fx, fy + 1.2 * u, fl, (0.8 + 1.8 * z) * u, 0, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Light column: broken horizontal glints under the light source.
    const L = p.light ?? 0;
    if (L > 0.02 && p.lightX !== undefined) {
      g.save();
      g.globalCompositeOperation = 'screen';
      const n = 5 + Math.round(6 * z);
      const spread = (40 + 420 * z) * u * (p.lightSpread ?? 1);
      for (let j = 0; j < n; j++) {
        const r = hash(j + i * 17, 41);
        const wob = Math.sin(t * (1.5 + r * 2) + j * 3.1 + i) * 0.5 + 0.5;
        const dx = (r - 0.5) * 2 * spread * (0.6 + 0.4 * wob);
        const fall = 1 - Math.abs(dx) / spread;
        const gx = p.lightX + dx;
        const gy = y0 + waveY(gx + off, tt, b, A) + (1 + 2 * z) * u;
        const a = L * fall * fall * (0.25 + 0.6 * wob) * (0.4 + 0.6 * (1 - z * 0.5));
        if (a < 0.02) continue;
        g.fillStyle = rgba(lightC, Math.min(1, a));
        g.beginPath();
        g.ellipse(gx, gy, (6 + 50 * z) * u * (0.4 + hash(j, i * 3)), (0.6 + 1.6 * z) * u, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  }
}

function strokeWave(g, x0, x1, step, y0, off, t, b, A) {
  g.beginPath();
  let px = x0, py = y0 + waveY(px + off, t, b, A);
  g.moveTo(px, py);
  for (let x = x0 + step; x <= x1 + step; x += step) {
    const y = y0 + waveY(x + off, t, b, A);
    g.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
    px = x; py = y;
  }
  g.stroke();
}

// Height of the surface at screen x for the band nearest to y (used to seat the boat).
export function surfaceAt(V, p, x, y) {
  const { h, u } = V;
  const depth = (p.bottom ?? h) - p.horizon;
  const zf = Math.pow(clamp((y - p.horizon) / depth), 1 / 1.85);
  const i = clamp(Math.round(zf * BANDS - 1), 0, BANDS - 1);
  const b = bandParams(i, u, 1);
  const amp = (p.amp ?? 1) * (1 - (p.stillness || 0) * 0.97);
  const off = (p.camX || 0) * (0.15 + b.z);
  const tt = p.t * (0.55 + 0.45 * (p.speed ?? 1));
  // Slope too, for the boat's roll.
  const y1 = waveY(x + off - 20 * u, tt, b, b.amp * amp), y2 = waveY(x + off + 20 * u, tt, b, b.amp * amp);
  return { dy: waveY(x + off, tt, b, b.amp * amp) * 0.6, slope: Math.atan2(y2 - y1, 40 * u) * 0.5 };
}

// Smooth vertical mirror column for still water.
export function drawMirrorColumn(g, V, x, y0, y1, width, color, a) {
  const gr = g.createLinearGradient(x - width, 0, x + width, 0);
  gr.addColorStop(0, rgba(color, 0));
  gr.addColorStop(0.5, rgba(color, a));
  gr.addColorStop(1, rgba(color, 0));
  g.save();
  g.globalCompositeOperation = 'screen';
  g.fillStyle = gr;
  g.fillRect(x - width, y0, width * 2, y1 - y0);
  g.restore();
}
