// The coastal village: a distant coast with houses and a lighthouse, and a close rooftop set.
import { P, mix, rgba } from '../core/color.js';
import { hash, fbm1, clamp, TAU } from '../core/math.js';
import { pattern, textures } from '../core/textures.js';
import { glow } from './atmos.js';

// Distant coast on the horizon. p: { x0, x1 (screen px), y (horizon px), h (cliff height px), t, lights, fog, cold }
export function drawCoast(g, V, p) {
  const { u } = V;
  const { x0, x1, y } = p;
  const H = p.h;
  const prof = (x, seed, amp) => {
    const k = (x - x0) / (x1 - x0);
    const rise = clamp(k * 6) * (0.75 + 0.25 * fbm1(k * 4, seed));
    return y - H * rise * (0.55 + amp * fbm1(k * 9 + 3, seed + 5));
  };
  // Two hill layers, the farther one hazier.
  const layers = [
    { seed: 41, c: mix(mix(P.rust, P.teal, 0.5), P.amber, 0.18), amp: 0.5, lift: 1.25 },
    { seed: 43, c: mix(P.night, P.rust, 0.25), amp: 0.35, lift: 1 },
  ];
  for (const L of layers) {
    g.fillStyle = rgba(L.c);
    g.beginPath();
    g.moveTo(x0, y + 2 * u);
    for (let x = x0; x <= x1 + 10; x += 6 * u) g.lineTo(x, y - (y - prof(x, L.seed, L.amp)) * L.lift);
    g.lineTo(x1 + 10, y + 2 * u);
    g.closePath();
    g.fill();
  }
  // Cliff face strokes.
  g.strokeStyle = rgba(P.ink, 0.35);
  g.lineWidth = 0.8 * u;
  for (let i = 0; i < 24; i++) {
    const x = x0 + (x1 - x0) * (0.03 + hash(i, 3) * 0.3);
    const top = prof(x, 43, 0.35);
    g.beginPath(); g.moveTo(x, top + 4 * u); g.lineTo(x + (hash(i, 4) - 0.5) * 6 * u, y); g.stroke();
  }
  // Houses climbing the slope.
  const n = 26;
  for (let i = 0; i < n; i++) {
    const k = 0.12 + hash(i, 11) * 0.5;
    const x = x0 + (x1 - x0) * k;
    const gy = prof(x, 43, 0.35) + (hash(i, 12) * 0.25 + 0.05) * (y - prof(x, 43, 0.35));
    const w = (9 + hash(i, 13) * 8) * u * p.scale, h = w * (0.6 + hash(i, 14) * 0.4);
    const wall = mix(mix(P.parch, P.rust, 0.55), P.night, 0.35 + hash(i, 15) * 0.25);
    g.fillStyle = rgba(wall);
    g.fillRect(x - w / 2, gy - h, w, h);
    g.fillStyle = rgba(mix(P.rust, P.night, 0.45 + hash(i, 16) * 0.2));
    g.beginPath(); g.moveTo(x - w * 0.6, gy - h); g.lineTo(x, gy - h - w * 0.45); g.lineTo(x + w * 0.6, gy - h); g.fill();
    if (hash(i, 17) < 0.6) {
      const flick = 0.8 + 0.2 * Math.sin(p.t * 3 + i * 7);
      const wx = x - w * 0.2, wy = gy - h * 0.6;
      glow(g, wx, wy, 7 * u * p.scale, P.amber, 0.35 * p.lights * flick);
      g.fillStyle = rgba(mix(P.amber, P.parch, 0.3), p.lights * flick);
      g.fillRect(wx - 1.2 * u * p.scale, wy - 1.5 * u * p.scale, 2.4 * u * p.scale, 3 * u * p.scale);
    }
  }
  // Lighthouse on the point.
  const lx = x0 + (x1 - x0) * 0.05, ly = prof(lx, 43, 0.35) + 2 * u;
  const lh = 46 * u * p.scale, lw = 7 * u * p.scale;
  g.fillStyle = rgba(mix(P.parch, P.night, 0.45));
  g.beginPath(); g.moveTo(lx - lw / 2, ly); g.lineTo(lx - lw * 0.32, ly - lh); g.lineTo(lx + lw * 0.32, ly - lh); g.lineTo(lx + lw / 2, ly); g.fill();
  g.fillStyle = rgba(mix(P.rust, P.night, 0.3));
  for (let s = 0; s < 3; s++) {
    const a = ly - lh * (0.2 + s * 0.28), b = a - lh * 0.12;
    const wa = lw / 2 - (lw * 0.18) * (ly - a) / lh, wb = lw / 2 - (lw * 0.18) * (ly - b) / lh;
    g.beginPath(); g.moveTo(lx - wa, a); g.lineTo(lx - wb, b); g.lineTo(lx + wb, b); g.lineTo(lx + wa, a); g.fill();
  }
  g.fillStyle = rgba(P.night);
  g.fillRect(lx - lw * 0.42, ly - lh - 2 * u * p.scale, lw * 0.84, 2 * u * p.scale);
  const beam = 0.6 + 0.4 * Math.sin(p.t * 1.6);
  glow(g, lx, ly - lh - 5 * u * p.scale, 26 * u * p.scale, P.amber, 0.5 * p.lights * beam);
  g.fillStyle = rgba(mix(P.amber, P.parch, 0.5), p.lights);
  g.fillRect(lx - lw * 0.22, ly - lh - 7 * u * p.scale, lw * 0.44, 5 * u * p.scale);
  g.fillStyle = rgba(P.night);
  g.beginPath(); g.moveTo(lx - lw * 0.36, ly - lh - 7 * u * p.scale); g.lineTo(lx, ly - lh - 12 * u * p.scale); g.lineTo(lx + lw * 0.36, ly - lh - 7 * u * p.scale); g.fill();
  return { lighthouse: [lx, ly - lh] };
}

// ——— Close village set: rooftops in the rain, lighthouse fixed at `lh.x` for the match cut. ———
function house(g, x, base, w, h, roofH, i, p) {
  const { u } = p;
  const wallC = mix(mix(P.parch, P.rust, 0.45 + hash(i, 2) * 0.25), P.night, 0.58 + hash(i, 3) * 0.15);
  g.fillStyle = rgba(wallC);
  g.fillRect(x, base - h, w, h + 2);
  // Plaster staining.
  g.save();
  g.beginPath(); g.rect(x, base - h, w, h); g.clip();
  g.globalAlpha = 0.3;
  g.fillStyle = pattern(g, textures().pigment);
  g.fillRect(x, base - h, w, h);
  g.globalAlpha = 1;
  const wet = g.createLinearGradient(0, base - h, 0, base);
  wet.addColorStop(0, rgba(P.night, 0.1));
  wet.addColorStop(1, rgba(P.night, 0.45));
  g.fillStyle = wet;
  g.fillRect(x, base - h, w, h);
  g.restore();
  // Roof, overhanging, with tile courses.
  const ov = w * 0.08;
  const roofC = mix(mix(P.rust, P.orange, 0.2), P.night, 0.5 + hash(i, 4) * 0.15);
  g.fillStyle = rgba(roofC);
  g.beginPath();
  g.moveTo(x - ov, base - h); g.lineTo(x + w / 2, base - h - roofH); g.lineTo(x + w + ov, base - h); g.closePath();
  g.fill();
  g.strokeStyle = rgba(P.ink, 0.45);
  g.lineWidth = 0.8 * u;
  for (let k = 1; k < 6; k++) {
    const yy = base - h - roofH * (k / 6);
    const half = (w / 2 + ov) * (1 - k / 6);
    g.beginPath(); g.moveTo(x + w / 2 - half, yy); g.lineTo(x + w / 2 + half, yy); g.stroke();
  }
  // Wet roof highlight along the ridge on the lit side.
  g.strokeStyle = rgba(mix(P.amber, P.parch, 0.3), 0.45);
  g.lineWidth = 1.4 * u;
  g.beginPath(); g.moveTo(x + w / 2, base - h - roofH); g.lineTo(x - ov, base - h); g.stroke();
  // Chimney.
  if (hash(i, 5) < 0.7) {
    const cx = x + w * (0.62 + hash(i, 6) * 0.15);
    const cy = base - h - roofH * (1 - (cx - x - w / 2) / (w / 2 + ov)) ;
    g.fillStyle = rgba(mix(roofC, P.night, 0.3));
    g.fillRect(cx, cy - roofH * 0.45, w * 0.09, roofH * 0.5);
  }
  // Windows: warm, flickering, with rain catching their light.
  const rows = h > 90 * u ? 2 : 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 2; c++) {
      if (hash(i * 7 + r * 3 + c, 8) < 0.25) continue;
      const wx = x + w * (0.22 + c * 0.38), wy = base - h * (0.72 - r * 0.42);
      const ww = w * 0.18, wh = h * 0.22;
      const flick = 0.85 + 0.15 * Math.sin(p.t * 2.6 + i * 3 + c);
      glow(g, wx + ww / 2, wy + wh / 2, ww * 2.6, P.amber, 0.35 * flick * p.lights);
      g.fillStyle = rgba(mix(P.amber, P.orange, 0.3), 0.95 * p.lights * flick);
      g.fillRect(wx, wy, ww, wh);
      g.strokeStyle = rgba(mix(P.night, P.rust, 0.3));
      g.lineWidth = 1.2 * u;
      g.strokeRect(wx, wy, ww, wh);
      g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
    }
  }
  // Door.
  g.fillStyle = rgba(mix(P.night, P.rust, 0.2));
  g.fillRect(x + w * 0.6, base - h * 0.32, w * 0.16, h * 0.32);
}

export function drawLighthouse(g, V, x, base, top, width, t, lights) {
  const lh = base - top;
  const lw = width;
  const body = mix(P.parch, P.night, 0.5);
  g.fillStyle = rgba(body);
  g.beginPath(); g.moveTo(x - lw / 2, base); g.lineTo(x - lw * 0.34, top + lh * 0.12); g.lineTo(x + lw * 0.34, top + lh * 0.12); g.lineTo(x + lw / 2, base); g.fill();
  const band = mix(P.rust, P.night, 0.35);
  g.fillStyle = rgba(band);
  for (let s = 0; s < 3; s++) {
    const a = base - lh * (0.18 + s * 0.24), b = a - lh * 0.1;
    const wa = lw / 2 - (lw * 0.16) * (base - a) / lh, wb = lw / 2 - (lw * 0.16) * (base - b) / lh;
    g.beginPath(); g.moveTo(x - wa, a); g.lineTo(x - wb, b); g.lineTo(x + wb, b); g.lineTo(x + wa, a); g.fill();
  }
  // Rim light on the left edge.
  g.strokeStyle = rgba(P.amber, 0.45);
  g.lineWidth = Math.max(1, lw * 0.03);
  g.beginPath(); g.moveTo(x - lw / 2 + 1, base); g.lineTo(x - lw * 0.34 + 1, top + lh * 0.12); g.stroke();
  // Gallery and lantern room.
  g.fillStyle = rgba(P.night);
  g.fillRect(x - lw * 0.46, top + lh * 0.1, lw * 0.92, lh * 0.025);
  const lamp = top + lh * 0.04;
  glow(g, x, lamp, lw * 2.4, P.amber, 0.55 * lights);
  g.fillStyle = rgba(mix(P.amber, P.parch, 0.45), lights);
  g.fillRect(x - lw * 0.22, lamp - lh * 0.03, lw * 0.44, lh * 0.06);
  g.fillStyle = rgba(P.night);
  g.beginPath(); g.moveTo(x - lw * 0.32, lamp - lh * 0.03); g.lineTo(x, top - lh * 0.02); g.lineTo(x + lw * 0.32, lamp - lh * 0.03); g.fill();
  // Slow beam.
  const a = t * 0.9;
  g.save();
  g.globalCompositeOperation = 'screen';
  const len = V.w * 0.6;
  const bg = g.createLinearGradient(x, lamp, x + Math.cos(a) * len, lamp + Math.sin(a) * len * 0.15);
  bg.addColorStop(0, rgba(P.amber, 0.22 * lights * Math.abs(Math.cos(a))));
  bg.addColorStop(1, rgba(P.amber, 0));
  g.fillStyle = bg;
  g.beginPath();
  g.moveTo(x, lamp);
  g.lineTo(x + Math.cos(a) * len, lamp - lw * 1.2);
  g.lineTo(x + Math.cos(a) * len, lamp + lw * 1.2);
  g.fill();
  g.restore();
}

// p: { t, lights, lh: {x, top, base, w} }
export function drawVillageClose(g, V, p) {
  const { w, h, u } = V;
  const base = h * (V.portrait ? 0.8 : 0.86);
  // Back row (hazier), then the front row.
  const rows = [
    { y: base - h * 0.1, sc: 0.7, n: 7, seed: 50, haze: 0.45 },
    { y: base, sc: 1, n: 5, seed: 60, haze: 0 },
  ];
  for (const R of rows) {
    let x = -w * 0.05 + hash(R.seed, 1) * 30 * u;
    let i = 0;
    while (x < w * 1.05) {
      const hw = (V.portrait ? 170 : 200) * u * R.sc * (0.8 + hash(R.seed + i, 2) * 0.5);
      const hh = hw * (0.6 + hash(R.seed + i, 3) * 0.5);
      // Leave room for the lighthouse.
      if (Math.abs(x + hw / 2 - p.lh.x) < hw * 0.55 + p.lh.w && R.sc === 1) { x += hw * 0.6; i++; continue; }
      house(g, x, R.y, hw, hh, hw * 0.42, R.seed + i, { u, t: p.t, lights: p.lights });
      x += hw * (0.92 + hash(R.seed + i, 4) * 0.2);
      i++;
    }
    if (R.haze) {
      g.fillStyle = rgba(mix(P.teal, P.rust, 0.25), R.haze * 0.6);
      g.fillRect(0, 0, w, R.y + 2);
    }
    if (R.sc < 1) drawLighthouse(g, V, p.lh.x, p.lh.base, p.lh.top, p.lh.w, p.t, p.lights);
  }
  // Wet street with reflected window light.
  const st = g.createLinearGradient(0, base, 0, h);
  st.addColorStop(0, rgba(mix(P.night, P.rust, 0.25)));
  st.addColorStop(1, rgba(P.night));
  g.fillStyle = st;
  g.fillRect(0, base, w, h - base);
  g.save();
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const x = w * hash(i, 31), y = base + (h - base) * (0.2 + hash(i, 32) * 0.6);
    const a = 0.12 + 0.1 * Math.sin(p.t * 2 + i);
    g.fillStyle = rgba(P.amber, a * p.lights);
    g.beginPath(); g.ellipse(x, y, (20 + hash(i, 33) * 50) * u, 2 * u, 0, 0, TAU); g.fill();
  }
  g.restore();
  // Villagers on the street, faces up to the rain.
  const people = [[0.2, 1], [0.27, 0.9], [0.44, 1.05]];
  for (let k = 0; k < people.length; k++) {
    const [fx, s] = people[k];
    const x = w * (V.portrait ? 0.15 + fx * 0.9 : fx), y = base + 14 * u;
    villager(g, x, y, 34 * u * s, p.t + k * 1.7, k);
  }
}

function villager(g, x, y, H, t, k) {
  g.save();
  g.translate(x, y);
  g.scale(H / 60, H / 60);
  const c = rgba(mix(P.night, P.rust, 0.2));
  g.fillStyle = c;
  g.strokeStyle = c;
  g.lineCap = 'round';
  // Body, head tilted back, arms open to the rain.
  g.beginPath();
  g.moveTo(-8, 0); g.quadraticCurveTo(-9, -24, -5, -40); g.lineTo(5, -40); g.quadraticCurveTo(9, -24, 8, 0); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(1, -47, 5, 6, -0.4, 0, TAU); g.fill();
  const lift = 0.5 + 0.5 * Math.sin(t * 0.8);
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(-4, -37); g.quadraticCurveTo(-14, -42 - lift * 6, -18, -54 - lift * 8); g.stroke();
  g.beginPath(); g.moveTo(4, -37); g.quadraticCurveTo(14, -42 - lift * 6, 18 + k, -54 - lift * 8); g.stroke();
  g.strokeStyle = rgba(P.amber, 0.5);
  g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(5.5, -40); g.quadraticCurveTo(9.5, -24, 8.5, 0); g.stroke();
  g.restore();
}
