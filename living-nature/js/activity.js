// How active each sound/creature layer is at a given hour of day. Shared by visuals and audio.
import { clamp, smooth } from './util.js';

const g = (h, c, w) => Math.exp(-(((h - c) / w) ** 2));

// songbirds: dawn chorus -> steady day -> small evening bump -> silent by dark
export function birdAct(h) {
  const day = smooth(4.6, 6.0, h) * (1 - smooth(19.0, 20.7, h));
  return clamp(day * (0.3 + 0.72 * g(h, 6.3, 1.5) + 0.38 * g(h, 17.2, 1.3)));
}
// crickets: start at dusk, full all night, fade as the dawn chorus begins
export function cricketAct(h) {
  return h >= 12 ? smooth(18.6, 20.8, h) : 1 - smooth(4.4, 6.0, h);
}
// frogs begin a little after crickets and stop earlier; rain brings them out
export function frogAct(h, rain = 0) {
  const base = h >= 12 ? smooth(19.2, 21.2, h) : 1 - smooth(3.6, 5.2, h);
  return clamp(Math.max(base, rain * 0.55 * (0.4 + 0.6 * Math.max(base, 0.3))));
}
export function owlAct(h) {
  return h >= 12 ? smooth(21, 22.4, h) : 1 - smooth(3.2, 4.4, h);
}
