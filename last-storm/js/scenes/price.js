// Scene 3 — The Price: the cabin, the fading portrait, the still sea and the last bottle.
import { P, mix, rgba } from '../core/color.js';
import { easeInOut, lerp, ramp, TAU } from '../core/math.js';
import { drawWall, lanternLight, drawLantern, drawShelf, drawPortrait, drawChair, drawWindow, lanternFlicker } from '../art/cabin.js';
import { drawSky, drawCloud, cloudSprite, spriteRes, drawHaze } from '../art/sky.js';
import { drawOcean, drawMirrorColumn } from '../art/ocean.js';
import { drawFisherman } from '../art/figures.js';
import { drawBottle } from '../art/bottle.js';
import { drawMotes, glow } from '../art/atmos.js';
import { camera } from './seascape.js';
import { BEATS, at } from '../timeline.js';

function eveningSea(g, V, x, y, w, h, still, cold, t) {
  const hz = y + h * 0.56;
  drawSky(g, V, { horizon: hz, warm: 0.55 * (1 - cold), cold, sun: { x: x + w * 0.3, y: hz, r: w * 0.9, a: 0.5 * (1 - cold) } });
  const res = spriteRes(V, w * 0.8);
  drawCloud(g, cloudSprite(22, cold > 0.5 ? 'cold' : 'pale', 'bank', res, Math.PI * 0.5), x + w * 0.35 + t * 2 * V.u, hz - h * 0.02, w * 0.9, 0.7);
  drawHaze(g, V, hz, h * 0.05, mix(mix(P.amber, P.parch, 0.5), P.cold, cold), 0.5);
  drawOcean(g, V, { horizon: hz, bottom: y + h * 1.4, t, amp: 0.5, stillness: still, warm: 0.4 * (1 - cold), cold, light: 0.4 * (1 - cold * 0.5), lightX: x + w * 0.3, contour: 0.7 });
  if (still > 0.2) drawMirrorColumn(g, V, x + w * 0.3, hz, y + h, w * 0.08, mix(P.parch, P.cold, cold), 0.25 * still);
}

// Cabin layout in units of u (min dimension / 1000), x from the left wall.
const L = { floor: 0.84, world: 2500, shelfX: [70, 1060], shelfY: [-580, -400, -220], lantern: [1290, -560],
  table: [960, 1560, -160], window: [1780, -660, 380, 330], portrait: [2300, -470, 220], chair: [2150, 0, 300] };

export const shots = {
  '3A'(g, V) {
    const { w, h, u, t } = V;
    const k = easeInOut(V.k);
    const fl = h * L.floor;
    const pan = lerp(0, L.world * u - w, k);
    g.save();
    g.translate(-pan, 0);
    drawWall(g, V, { x0: -20 * u, x1: L.world * u + 20 * u, y0: -h, y1: fl, scale: 1 });
    // Floor.
    g.fillStyle = rgba(mix(P.night, P.rust, 0.28));
    g.fillRect(-20 * u, fl, L.world * u + 40 * u, h - fl + 4);
    g.strokeStyle = rgba(P.ink, 0.5);
    g.lineWidth = 1.2 * u;
    for (let i = 0; i < 6; i++) {
      const yy = fl + (h - fl) * Math.pow(i / 6, 1.4);
      g.beginPath(); g.moveTo(-20 * u, yy); g.lineTo(L.world * u, yy); g.stroke();
    }
    const lx = L.lantern[0] * u, ly = fl + L.lantern[1] * u;
    for (let r = 0; r < 3; r++) drawShelf(g, V, L.shelfX[0] * u, L.shelfX[1] * u, fl + L.shelfY[r] * u, 1.25, 10 + r * 13, t, lx, ly, 1300 * u);
    const [wx, wy, ww, wh] = L.window;
    drawWindow(g, V, wx * u, fl + wy * u, ww * u, wh * u, (gg) => eveningSea(gg, V, wx * u, fl + wy * u, ww * u, wh * u, 0.2, 0.25, t), 0.6);
    drawChair(g, L.chair[0] * u, fl + 4 * u, L.chair[2] * u * 1.35, 0.4);
    drawPortrait(g, L.portrait[0] * u, fl + L.portrait[1] * u, L.portrait[2] * u, [0, 0, 0], 0.5, t);
    // Table with a coiled rope and a logbook.
    const [t0, t1, ty] = L.table;
    g.fillStyle = rgba(mix(P.rust, P.night, 0.6));
    g.fillRect(t0 * u, fl + (ty - 14) * u, (t1 - t0) * u, 16 * u);
    g.fillRect(t0 * u + 20 * u, fl + ty * u, 14 * u, -ty * u);
    g.fillRect(t1 * u - 34 * u, fl + ty * u, 14 * u, -ty * u);
    g.strokeStyle = rgba(mix(P.parch, P.rust, 0.5), 0.8);
    g.lineWidth = 3 * u;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(t0 * u + 160 * u, fl + (ty - 26) * u + i * -4 * u, 60 * u, 14 * u, 0, 0, TAU); g.stroke(); }
    g.fillStyle = rgba(mix(P.parch, P.rust, 0.3));
    g.beginPath(); g.moveTo(t0 * u + 330 * u, fl + (ty - 16) * u); g.lineTo(t0 * u + 420 * u, fl + (ty - 26) * u); g.lineTo(t0 * u + 510 * u, fl + (ty - 16) * u); g.lineTo(t0 * u + 420 * u, fl + (ty - 12) * u); g.fill();
    lanternLight(g, V, lx, ly, 700 * u, lanternFlicker(t), 0.15);
    drawLantern(g, V, lx, ly, 2.2 * u, t);
    g.restore();
    drawMotes(g, V, { t, n: 18, x: lx - pan, y: ly + 100 * u, spread: 900 * u, rise: 120 * u, color: P.amber, a: 0.35, size: 0.7, seed: 8 });
  },

  '3B'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const px = w * (pt ? 0.5 : 0.38), py = h * (pt ? 0.34 : 0.4);
    camera(g, V, lerp(1.0, 1.08, k), px, py, (w / 2 - px) * 0.0, 0);
    drawWall(g, V, { x0: -100 * u, x1: w + 100 * u, y0: -h, y1: h * 0.92, scale: 1.6 });
    g.fillStyle = rgba(mix(P.night, P.rust, 0.25));
    g.fillRect(-100 * u, h * 0.92, w + 200 * u, h);
    const erase = [ramp(t, BEATS.memory[0], BEATS.memory[0] + 0.7), ramp(t, BEATS.memory[1], BEATS.memory[1] + 0.8), ramp(t, BEATS.memory[2], BEATS.memory[2] + 1.2)];
    const f = lanternFlicker(t);
    drawChair(g, w * (pt ? 0.32 : 0.6), h * 0.97, h * (pt ? 0.32 : 0.62), 0.8 * f);
    drawPortrait(g, px, py, h * (pt ? 0.26 : 0.46), erase, f, t);
    lanternLight(g, V, w * (pt ? 0.0 : 0.1), h * 0.2, w * (pt ? 1.1 : 0.75), f, 0.1);
    drawMotes(g, V, { t, n: 12, x: w * 0.4, y: h * 0.4, spread: w * 0.7, rise: 80 * u, color: P.amber, a: 0.3, size: 0.6, seed: 5 });
  },

  '3C'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const cold = ramp(t, at(31.4), at(34.4));
    const still = lerp(0.25, 1, ramp(t, at(31.4), at(33.6)));
    camera(g, V, lerp(1.04, 1.0, k), w / 2, h / 2);
    drawWall(g, V, { x0: -60 * u, x1: w + 60 * u, y0: -h, y1: h, scale: 1.4 });
    const win = pt ? [w * 0.22, h * 0.16, w * 0.68, h * 0.34] : [w * 0.44, h * 0.12, w * 0.44, h * 0.56];
    drawWindow(g, V, win[0], win[1], win[2], win[3], (gg) => eveningSea(gg, V, win[0], win[1], win[2], win[3], still, cold, t), 0.5 * (1 - cold));
    // Cold light from the window across the wall.
    g.save();
    g.globalCompositeOperation = 'screen';
    glow(g, win[0] + win[2] / 2, win[1] + win[3] / 2, Math.max(win[2], win[3]) * 1.2, mix(P.cold, P.parch, 0.2), 0.14 + cold * 0.1);
    g.restore();
    lanternLight(g, V, -w * 0.2, h * 0.3, w * 0.7, lanternFlicker(t) * (1 - cold * 0.7), 0.3 + cold * 0.5);
    // The last bottle on the sill.
    const sill = win[1] + win[3] + 14 * u * 1.6;
    const bs = h * (pt ? 0.0009 : 0.0015);
    g.save();
    g.translate(win[0] + win[2] * (pt ? 0.7 : 0.66), sill - 2 * u);
    g.scale(bs, bs);
    drawBottle(g, { t, storm: 0.55, glow: 0.45 + 0.15 * Math.sin(t * 1.4), spin: 0.5, tag: true });
    g.restore();
    // The fisherman, seated, looking out.
    const fs = h * (pt ? 0.0062 : 0.0095);
    g.save();
    g.translate(w * (pt ? 0.32 : 0.2), h * (pt ? 0.84 : 1.02));
    g.scale(fs, fs);
    drawFisherman(g, { t, seated: 1, look: 0.1, wind: 0, px: fs }, mix(P.night, P.teal, 0.12), mix(P.cold, P.parch, 0.3), 1, -0.4, 0.8);
    g.restore();
    drawMotes(g, V, { t, n: 10, x: win[0] + win[2] * 0.4, y: win[1] + win[3] * 0.7, spread: win[2], rise: 50 * u, color: mix(P.parch, P.cold, 0.5), a: 0.3, size: 0.6, seed: 9 });
  },
};
