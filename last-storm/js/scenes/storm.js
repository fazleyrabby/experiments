// Scene 4 — The Last Storm: the cork, the storm unfolding, her reflection, the rain after.
import { P, mix, rgba } from '../core/color.js';
import { easeInOut, easeOut, lerp, ramp, clamp, hash, TAU } from '../core/math.js';
import { seascape, camera } from './seascape.js';
import { openSea } from './collector.js';
import { vapour } from './trade.js';
import { reflectionShot } from './reflection.js';
import { drawSky, drawCloud, cloudSprite, spriteRes, drawHaze } from '../art/sky.js';
import { drawOcean } from '../art/ocean.js';
import { drawBottle } from '../art/bottle.js';
import { drawGrip, drawCorkThumb } from '../art/hands.js';
import { drawMotes, drawBolt, flashWash, glow, drawRain } from '../art/atmos.js';
import { BEATS, STRIKES, flashFor, at } from '../timeline.js';

function boltsAt(g, V, t, y0, y1, scale = 1) {
  for (let i = 0; i < STRIKES.length; i++) {
    const s = STRIKES[i];
    if (s.far) continue;
    const d = t - s.t;
    if (d < 0 || d > 0.35) continue;
    const a = (d < 0.04 ? 1 : Math.exp(-(d - 0.04) / 0.07)) + (d > 0.15 && d < 0.24 ? 0.6 : 0);
    drawBolt(g, V, V.w * s.x, y0, y1, 100 + i, clamp(a) * s.s * (V.flashScale ?? 1) * scale);
  }
}

// Storm towers that grow out of the bottle at (ox, oy) frame fractions.
function stormClouds(V, t, ox, oy) {
  const pt = V.portrait;
  const g0 = 39.5;
  const grow = (d, dur = 2.6) => easeOut(clamp((t - g0 - d) / dur));
  const list = pt
    ? [
      [61, 0.5, 0.42, 1.25, 0.0], [63, 0.12, 0.5, 0.9, 0.5], [65, 0.88, 0.52, 0.95, 0.7],
      [67, 0.3, 0.3, 1.0, 1.1], [69, 0.75, 0.28, 1.0, 1.3], [71, 0.5, 0.18, 1.3, 1.7],
    ]
    : [
      [61, 0.5, 0.6, 0.95, 0.0], [63, 0.2, 0.64, 0.8, 0.5], [65, 0.8, 0.645, 0.85, 0.7],
      [67, 0.02, 0.6, 0.7, 1.2], [69, 0.99, 0.6, 0.72, 1.3], [71, 0.33, 0.42, 0.7, 1.6], [73, 0.68, 0.4, 0.75, 1.8],
    ];
  return list.map(([seed, x, y, width, d]) => ({
    seed, x, y, width, mood: 'storm', grow: grow(d), fromX: ox, fromY: oy, drift: (x - 0.5) * 1.2, light: Math.PI * 0.5, par: 0.2,
  }));
}

export const shots = {
  '4A'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const pop = ramp(t, BEATS.cork, BEATS.cork + 0.5);
    // Night sea behind, out of focus; the bottle's light takes over after the cork.
    const hz = h * (pt ? 0.62 : 0.66);
    drawSky(g, V, { horizon: hz, warm: 0.15 + pop * 0.6, cold: 0.8 - pop * 0.6, sun: null });
    drawHaze(g, V, hz, 60 * u, mix(P.cold, P.amber, pop), 0.35);
    drawOcean(g, V, { horizon: hz, t, amp: 0.2 + pop * 0.3, stillness: 0.9 - pop * 0.6, warm: pop * 0.6, cold: 0.8 - pop * 0.6, light: 0.2 + pop * 0.6, lightX: w * 0.5, contour: 0.4 });
    g.save();
    g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 10; i++) {
      const x = w * hash(i, 1), y = h * (0.15 + hash(i, 2) * 0.5);
      g.fillStyle = rgba(mix(P.cold, P.amber, pop), 0.05 + hash(i, 3) * 0.06);
      g.beginPath(); g.arc(x, y, (30 + hash(i, 4) * 60) * u, 0, TAU); g.fill();
    }
    g.restore();

    const zoom = lerp(1.0, 1.14, k);
    const bh = h * (pt ? 0.44 : 0.6);
    const sc = bh / 100;
    const bx = w * 0.5, by = h * (pt ? 0.74 : 0.86);
    camera(g, V, zoom, bx, by - bh * 0.62);
    const spin = 1 + ramp(t, at(35), BEATS.cork) * 2.6;
    g.save();
    g.translate(bx, by);
    g.rotate(Math.sin(t * 0.8) * 0.01);
    g.scale(sc, sc);
    drawBottle(g, {
      t: t * spin * 0.6 + t * 0.4, storm: 1, glow: 0.7 + ramp(t, at(37), BEATS.cork) * 0.4 - pop * 0.3, cork: pop,
      sweep: (t - (BEATS.cork - 0.05)) / 0.4, flick: ramp(t, at(36.5), BEATS.cork) * 0.5, tag: true, spin: 1,
    });
    drawGrip(g, { side: -1, y: -12, px: sc, rim: mix(P.amber, P.cold, 0.5 - pop * 0.5) });
    g.save();
    g.translate(0, -92);
    g.scale(0.72, 0.72);
    g.translate(0, 92);
    drawCorkThumb(g, { push: ramp(t, at(37.4), BEATS.cork), px: sc * 0.72, rim: mix(P.amber, P.cold, 0.4 - pop * 0.4) });
    g.restore();
    g.restore();
    // Release: a burst of light and amber particles from the neck.
    const neck = [bx, by - 92 * sc];
    if (t >= BEATS.cork) {
      const d = t - BEATS.cork;
      glow(g, neck[0], neck[1], 260 * u * (1 + d), P.amber, 0.7 * Math.exp(-d * 2.5));
      vapour(g, V, neck, [neck[0] + 60 * u, -h * 0.2], ramp(t, BEATS.cork, BEATS.cork + 0.7), t, 2.2, 1);
      drawMotes(g, V, { t, t0: BEATS.cork, n: 60, x: neck[0], y: neck[1] - 80 * u * Math.min(1, d * 2), spread: 260 * u * (0.3 + d), rise: 380 * u, drift: 40 * u, size: 1.4, a: Math.min(1, d * 6), seed: 11 });
    }
  },

  '4B'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const f = flashFor(V, (s) => !s.far);
    const strike = STRIKES.filter((s) => !s.far && t >= s.t).pop();
    const boat = { x: 0.5, y: pt ? 0.8 : 0.82, scale: pt ? 1.9 : 1.6 };
    const ox = boat.x, oy = boat.y - (pt ? 0.07 : 0.12);
    const rage = ramp(t, at(39.6), at(42.5));
    const s = {
      horizon: pt ? 0.62 : 0.66, warm: 0.55, cold: 0.25 * (1 - rage),
      sun: { x: 0.5, y: pt ? 0.62 : 0.66, r: 0.9, a: 0.35 + rage * 0.4 }, sunLight: false,
      clouds: [
        { seed: 23, shape: 'bank', x: 0.25, y: pt ? 0.63 : 0.67, width: 1.1, a: 0.8, mood: 'storm', drift: 1.5, light: Math.PI * 0.5 },
        { seed: 24, shape: 'bank', x: 0.8, y: pt ? 0.62 : 0.665, width: 1.1, a: 0.8, mood: 'storm', drift: -1.5, light: Math.PI * 0.5 },
        ...stormClouds(V, t, ox, oy),
      ],
      flash: f, flashX: strike ? strike.x : 0.5,
      lightX: 0.5, light: 0.75 + rage * 0.25 + f * 0.5, lightColor: mix(P.amber, P.parch, f * 0.6), lightSpread: 1.4, column: 0.35,
      amp: lerp(0.7, 2.3, rage), seaSpeed: 1 + rage * 0.6, contour: 1.2, foam: 1.6,
      rain: ramp(t, at(41.0), at(43.0)) * 0.9, rainWind: 0.3, rainWarm: 0.85,
      boat: { ...boat, crate: 0, lantern: 1, wind: 0.4 + rage * 0.6, whip: rage, bob: 1 + rage,
        man: { raise: lerp(1, 0.8, rage), look: 0.9, bottle: { glow: 0.6 * (1 - rage), cork: false } } },
      mist: { y: pt ? 0.63 : 0.67, n: 6, a: 0.12, color: mix(P.amber, P.rust, 0.5) },
      haze: 0.7, rim: P.amber, rimA: 1, lightSide: 1,
    };
    const shake = f * 3 * u;
    camera(g, V, lerp(1.22, 1.0, easeOut(V.k)), w / 2, h * lerp(0.62, 0.5, k), Math.sin(t * 53) * shake, Math.cos(t * 47) * shake);
    // Bolts sit behind the nearer clouds: draw them from the sky hook.
    s.under = (gg) => boltsAt(gg, V, t, h * (pt ? 0.35 : 0.42), h * s.horizon);
    seascape(g, V, s);
    const neck = [w * ox, h * (oy - 0.02)];
    vapour(g, V, neck, [w * 0.52, -h * 0.05], ramp(t, at(39.4), at(41.2)), t, pt ? 2.4 : 3, 1 - ramp(t, at(43), at(45)) * 0.6);
    drawMotes(g, V, { t, t0: 39.4, n: 70, x: w * 0.5, y: h * 0.42, spread: w * 0.9, rise: 300 * u, drift: 60 * u, size: 1.2, a: 0.8, seed: 13 });
    flashWash(g, V, f * 0.75, w * (strike ? strike.x : 0.5), h * 0.3);
  },

  '4C'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const f = flashFor(V, (s) => !s.far);
    const [r0, r1] = BEATS.reveal;
    const girl = ramp(t, r0, r0 + 0.45) * (1 - ramp(t, r1 - 0.5, r1));
    const sky = (gg) => {
      drawSky(gg, V, { horizon: h * (pt ? 0.56 : 0.6), warm: 0.6, cold: 0.15, sun: { x: w * 0.5, y: h * 0.6, r: 900 * u, a: 0.6 } });
      boltsAt(gg, V, t, h * 0.05, h * (pt ? 0.56 : 0.6), 0.9);
      const res = spriteRes(V, 1300 * u);
      [[23, 0.2, 0.36, 1.6], [24, 0.85, 0.4, 1.7], [25, 0.5, 0.6, 1.8]].forEach(([seed, x, y, wd]) =>
        drawCloud(gg, cloudSprite(seed, 'storm', 'bank', res, Math.PI * 0.5), w * x + t * 8 * u * (x - 0.5), h * y, wd * 1000 * u, 1, f));
      drawHaze(gg, V, h * (pt ? 0.56 : 0.6), 40 * u, mix(P.amber, P.rust, 0.3), 0.55);
      flashWash(gg, V, f * 0.6, w * 0.5, h * 0.2);
    };
    camera(g, V, lerp(1.0, 1.06, easeInOut(V.k)), w / 2, h * 0.55);
    reflectionShot(g, V, {
      t, wl: pt ? 0.56 : 0.6, sky, boatX: pt ? 0.46 : 0.42, scale: pt ? 6.4 : 5.4,
      man: { x: -18, raise: 0.25, look: -0.75, bottle: true }, girl: { a: girl, x: 30 },
      wind: 0.7, whip: 0.6, lantern: 1, ripple: 1 + ramp(t, r1 - 0.6, r1) * 2.2, ripples: 40, rain: 0.55, rainWarm: 0.7,
      tint: mix(P.teal, P.rust, 0.2), flash: f, lightSide: 1, girlRim: mix(P.parch, P.amber, 0.3 + f * 0.4),
    });
    flashWash(g, V, f * 0.35, w * 0.5, h * 0.8, P.parch);
  },

  '4D'(g, V) {
    const { w, h, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const f = flashFor(V, (s) => !s.far);
    const calm = ramp(t, at(48.6), at(50.2));
    const s = openSea(V, {
      horizon: pt ? 0.66 : 0.7, warm: 0.5, cold: 0.2, sunLight: false,
      sun: { x: 0.6, y: pt ? 0.66 : 0.7, r: 0.8, a: 0.4 },
      clouds: [
        { seed: 61, x: 0.25, y: pt ? 0.66 : 0.72, width: 1.4, mood: 'storm', drift: 1.0, light: Math.PI * 0.5 },
        { seed: 65, x: 0.9, y: pt ? 0.64 : 0.7, width: 1.5, mood: 'storm', drift: -0.8, light: Math.PI * 0.5 },
        { seed: 73, x: 0.55, y: pt ? 0.42 : 0.4, width: 1.6, mood: 'storm', drift: 0.4, a: 0.95, light: Math.PI * 0.5 },
      ],
      streaks: null, gulls: null, mist: null,
      flash: f, flashX: 0.25,
      lightX: 0.6, light: 0.6, amp: lerp(1.6, 1.0, calm), contour: 1,
      rain: lerp(1, 0.75, calm), rainWind: lerp(0.32, 0.2, calm), rainWarm: 0.55,
      boat: { x: pt ? 0.74 : 0.66, y: pt ? 1.0 : 1.08, scale: pt ? 6.2 : 7.2, crate: 0, lantern: 1, wind: 0.9 - calm * 0.4, whip: 0.8 - calm * 0.5, bob: 0.6, roll: 0.3,
        man: { x: -30, raise: 0.15, look: -0.55, bottle: { glow: 0, cork: false } } },
      lightSide: 1, rimA: 1, rim: mix(P.amber, P.parch, 0.3),
    });
    camera(g, V, lerp(1.06, 1.0, k), w / 2, h / 2);
    seascape(g, V, s);
    flashWash(g, V, f * 0.6, w * 0.25, h * 0.2);
    drawRain(g, V, { t: t + 3, amount: 0.6 * (1 - calm * 0.5), wind: 0.3, lightX: w * 0.6, warm: 0.4, seed: 51, lenScale: 1.6 });
  },
};
