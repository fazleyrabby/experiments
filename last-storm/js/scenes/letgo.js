// Scene 5 — Letting Go: gentle rain, a calm sea, a second reflection, the horizon, the title.
import { P, mix, rgba } from '../core/color.js';
import { easeInOut, lerp, ramp, smooth } from '../core/math.js';
import { seascape, camera } from './seascape.js';
import { reflectionShot, ring } from './reflection.js';
import { drawSky, drawCloud, cloudSprite, spriteRes, drawHaze } from '../art/sky.js';
import { drawMotes, glow } from '../art/atmos.js';
import { BEATS, DURATION, at } from '../timeline.js';

function dawn(V, o) {
  const pt = V.portrait;
  return {
    horizon: pt ? 0.6 : 0.62, warm: 0.65, cold: 0.12,
    sun: { x: 0.5, y: pt ? 0.6 : 0.62, r: 0.8, a: 0.85 }, sunFront: 0.2, sunLight: false,
    streaks: { count: 22, y: pt ? 0.57 : 0.59, spread: 0.05, color: mix(P.parch, P.amber, 0.4), color2: P.paleGold, a: 0.35, seed: 14 },
    lightX: 0.5, light: 0.85, lightColor: P.paleGold, column: 0.3, columnW: 0.07,
    rimA: 0.8, rim: P.paleGold, lightSide: 1,
    ...o,
  };
}

export const shots = {
  '5A'(g, V) {
    const { w, h, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const clear = ramp(t, at(50), at(53.4));
    const s = dawn(V, {
      clouds: [
        { seed: 61, x: 0.18, y: pt ? 0.6 : 0.62, width: 1.1, mood: 'pale', a: 0.9 - clear * 0.45, drift: 1.4, light: -Math.PI * 0.4 },
        { seed: 65, x: 0.84, y: pt ? 0.6 : 0.62, width: 1.2, mood: 'pale', a: 0.9 - clear * 0.45, drift: -1.2, light: -Math.PI * 0.6 },
        { seed: 71, x: 0.5, y: pt ? 0.3 : 0.26, width: 0.85, mood: 'pale', a: 0.5 - clear * 0.4, drift: 0.6, light: Math.PI * 0.5 },
      ],
      amp: lerp(0.9, 0.35, clear), rain: lerp(0.65, 0.15, clear), rainWind: 0.08, rainWarm: 0.8,
      boat: { x: pt ? 0.46 : 0.42, y: pt ? 0.78 : 0.8, scale: pt ? 1.7 : 1.4, crate: 0, lantern: 0.5, wind: 0.15, bob: 0.6,
        man: { seated: 1, look: 0.15 } },
      mist: { y: pt ? 0.61 : 0.63, n: 7, a: 0.12, color: mix(P.parch, P.amber, 0.3) },
    });
    camera(g, V, lerp(1.08, 1.0, k), w / 2, h / 2);
    seascape(g, V, s);
  },

  '5B'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const [r0, r1] = BEATS.reveal2;
    const girl = ramp(t, r0, r0 + 0.5) * (1 - ramp(t, r1 - 0.45, r1));
    const sky = (gg) => {
      drawSky(gg, V, { horizon: h * (pt ? 0.56 : 0.6), warm: 0.7, cold: 0.1, sun: { x: w * 0.62, y: h * 0.6, r: 1000 * u, a: 0.8 } });
      const res = spriteRes(V, 1200 * u);
      drawCloud(gg, cloudSprite(65, 'pale', 'bank', res, -Math.PI * 0.5), w * 0.2 + t * 4 * u, h * 0.6, 1200 * u, 0.7);
      drawHaze(gg, V, h * (pt ? 0.56 : 0.6), 50 * u, P.paleGold, 0.6);
    };
    camera(g, V, lerp(1.0, 1.05, easeInOut(V.k)), w / 2, h * 0.55);
    const res = reflectionShot(g, V, {
      t, wl: pt ? 0.56 : 0.6, sky, boatX: pt ? 0.44 : 0.4, scale: pt ? 6.4 : 5.4,
      man: { x: -20, seated: 1, look: -0.4 }, girl: { a: girl, x: 30, seated: true },
      wind: 0.12, lantern: 0.4, ripple: 0.45 + ramp(t, r1 - 0.6, r1 + 0.3) * 1.6, ripples: 14, rain: 0.2, rainWarm: 0.9,
      tint: mix(P.teal, P.paleGold, 0.18), rim: P.paleGold, lightSide: 1, girlRim: P.paleGold, bob: 0.4,
    });
    // One raindrop lands where she is and its ring carries her away.
    const gx = res.bx + 30 * res.sc, gy = res.wl + 24 * res.sc;
    ring(g, V, gx, gy, (t - (r1 - 0.7)) / 1.4, 0.7);
    ring(g, V, gx, gy, (t - (r1 - 0.45)) / 1.4, 0.5);
  },

  '5C'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const s = dawn(V, {
      horizon: pt ? 0.58 : 0.6,
      sun: { x: 0.62, y: pt ? 0.58 : 0.6, r: 1.0, a: 1 },
      clouds: [
        { seed: 21, shape: 'bank', x: 0.15, y: pt ? 0.585 : 0.605, width: 0.9, mood: 'pale', a: 0.55, drift: 0.4 },
        { seed: 22, shape: 'bank', x: 0.95, y: pt ? 0.58 : 0.6, width: 0.9, mood: 'pale', a: 0.5, drift: -0.3 },
      ],
      lightX: 0.62, amp: 0.3, rain: 0.06, rainWarm: 1,
      boat: { x: pt ? 0.44 : 0.4, y: pt ? 0.7 : 0.72, scale: pt ? 0.9 : 0.75, crate: 0, lantern: 0.3, wind: 0.1, bob: 0.4,
        man: { seated: 1, look: 0.25 } },
      gulls: { n: 3, x: 0.7, y: pt ? 0.45 : 0.42, spread: 0.15, size: 0.8, t: 0, seed: 6, a: 0.6, color: mix(P.night, P.teal, 0.4) },
      mist: { y: pt ? 0.6 : 0.62, n: 6, a: 0.1, color: P.paleGold },
    });
    camera(g, V, lerp(1.12, 1.0, k), w * 0.5, h * 0.62);
    seascape(g, V, s);
    drawMotes(g, V, { t, n: 14, x: w * 0.62, y: h * 0.55, spread: w * 0.6, rise: 60 * u, color: P.paleGold, a: 0.35, size: 0.7, seed: 19 });
  },

  '5D'(g, V) {
    const { w, h, u, t } = V;
    g.fillStyle = rgba(mix(P.night, [0, 0, 0], 0.7));
    g.fillRect(0, 0, w, h);
    const a = smooth((t - at(58.5)) / 1.4) * (1 - smooth((t - (DURATION - 0.9)) / 0.9));
    const size = Math.round((V.portrait ? 64 : 78) * u);
    const title = 'THE LAST STORM';
    g.font = `400 ${size}px "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`;
    g.textBaseline = 'middle';
    const track = size * 0.32;
    const widths = [...title].map((c) => g.measureText(c).width);
    const total = widths.reduce((s, x) => s + x, 0) + track * (title.length - 1);
    let x = w / 2 - total / 2;
    const y = h * 0.48;
    glow(g, w / 2, y, total * 0.6, P.orange, 0.1 * a);
    g.fillStyle = rgba(P.parch, a);
    [...title].forEach((c, i) => { g.fillText(c, x, y); x += widths[i] + track; });
    // A thin gold rule draws out beneath.
    const rule = smooth((t - at(58.9)) / 1.6) * total * 0.34;
    g.strokeStyle = rgba(P.amber, 0.7 * a);
    g.lineWidth = Math.max(1, 1.4 * u);
    g.beginPath(); g.moveTo(w / 2 - rule, y + size * 0.85); g.lineTo(w / 2 + rule, y + size * 0.85); g.stroke();
  },
};
