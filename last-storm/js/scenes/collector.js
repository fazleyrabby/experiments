// Scene 1 — The Collector.
import { P } from '../core/color.js';
import { easeInOut, lerp } from '../core/math.js';
import { seascape, camera } from './seascape.js';
import { flashFor } from '../timeline.js';

// The opening sky: two burnt-orange towers framing a low sun, the boat in its light path.
export function openSea(V, o = {}) {
  const pt = V.portrait;
  return {
    horizon: pt ? 0.6 : 0.62,
    warm: 1,
    sun: { x: pt ? 0.5 : 0.55, y: pt ? 0.565 : 0.585, r: pt ? 0.75 : 0.62, a: 1 },
    sunFront: 0.22,
    streaks: { count: 26, y: pt ? 0.56 : 0.58, spread: 0.05, color: P.orange, color2: P.amber, a: 0.35, seed: 4 },
    clouds: pt
      ? [
        { seed: 21, shape: 'bank', x: 0.12, y: 0.605, width: 0.8, a: 0.85, drift: 0.4, par: 0.1 },
        { seed: 22, shape: 'bank', x: 0.9, y: 0.6, width: 0.8, a: 0.85, drift: -0.3, par: 0.1 },
        { seed: 14, x: 0.55, y: 0.52, width: 0.55, a: 0.5, drift: 0.2, par: 0.15 },
        { seed: 7, x: 0.1, y: 0.58, width: 0.7, drift: 0.6 },
        { seed: 9, x: 0.92, y: 0.585, width: 0.78, drift: -0.5 },
      ]
      : [
        { seed: 21, shape: 'bank', x: 0.18, y: 0.615, width: 0.95, a: 0.85, drift: 0.5, par: 0.1 },
        { seed: 22, shape: 'bank', x: 0.88, y: 0.61, width: 1.05, a: 0.85, drift: -0.4, par: 0.1 },
        { seed: 14, x: 0.5, y: 0.57, width: 0.62, a: 0.5, drift: 0.2, par: 0.15 },
        { seed: 7, x: 0.2, y: 0.6, width: 0.9, drift: 0.7 },
        { seed: 3, x: 0.83, y: 0.61, width: 1.05, drift: -0.5 },
      ],
    lightX: pt ? 0.5 : 0.55,
    light: 0.9,
    amp: 0.8,
    mist: { y: pt ? 0.62 : 0.64, n: 7, a: 0.1 },
    gulls: { n: 4, x: pt ? 0.3 : 0.32, y: pt ? 0.45 : 0.44, spread: 0.12, size: 0.9, t: 0, seed: 2 },
    boat: { x: pt ? 0.56 : 0.6, y: pt ? 0.76 : 0.79, scale: pt ? 1.15 : 1.0, crate: 7, lantern: 0.9, wind: 0.35,
      man: { raise: 0.85, look: 0.5, bottle: { glow: 1 } } },
    ...o,
  };
}

export const shots = {
  '1A'(g, V) {
    const k = easeInOut(V.k);
    const s = openSea(V);
    s.flash = flashFor(V);
    s.flashX = 0.22;
    const b = s.boat;
    camera(g, V, lerp(1.0, 1.18, k), lerp(V.w * 0.5, b.x * V.w, k * 0.5), lerp(V.h * 0.5, b.y * V.h, k * 0.35));
    seascape(g, V, s);
  },

  '1B'(g, V) {
    // Medium: the collector holding up a bottle against the cloud light; push in toward the bottle.
    const k = easeInOut(V.k);
    const pt = V.portrait;
    const s = openSea(V, {
      horizon: pt ? 0.66 : 0.7,
      sun: { x: pt ? 0.62 : 0.66, y: pt ? 0.42 : 0.4, r: 0.9, a: 1 },
      sunFront: 0.4,
      clouds: [
        { seed: 14, x: 0.62, y: pt ? 0.62 : 0.66, width: 0.9, a: 0.5, drift: 0.4, par: 0.1 },
        { seed: 7, x: pt ? 0.05 : 0.12, y: pt ? 0.66 : 0.72, width: 1.3, drift: 1.2 },
        { seed: 3, x: pt ? 1.0 : 0.98, y: pt ? 0.64 : 0.7, width: 1.5, drift: -0.9 },
      ],
      streaks: { count: 16, y: pt ? 0.64 : 0.68, spread: 0.04, color: P.orange, color2: P.amber, a: 0.3, seed: 6 },
      lightX: pt ? 0.62 : 0.66,
      gulls: null,
      mist: null,
      boat: { x: pt ? 0.74 : 0.66, y: pt ? 1.0 : 1.08, scale: pt ? 6.2 : 7.2, crate: 7, lantern: 0.9, wind: 0.4, bob: 0.4, roll: 0.25,
        man: { x: -30, raise: 1, look: 0.45, bottle: { glow: 1.2 }, bottleScale: 1.7 } },
      lightSide: 1,
      rimA: 1,
    });
    const sc = s.boat.scale * V.u;
    const fx = s.boat.x * V.w + sc * -10, fy = s.boat.y * V.h - sc * 82;
    camera(g, V, lerp(1.0, 1.3, k), lerp(V.w / 2, fx, k), lerp(V.h / 2, fy, k));
    seascape(g, V, s);
  },
};

