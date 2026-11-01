// The film's single source of timing: scenes, shots, narration, lightning and sound cues.
// Everything that animates reads from here, so picture, subtitles and audio cannot drift.

export const FPS = 24;

// Beats were first laid out on a 60 s draft cut. The final cut gives each shot its own length;
// at() moves a draft time onto the final clock, keeping it at the same point within its shot,
// and draft() maps back. Waves, rain and flicker run on the real clock, so nothing plays in slow motion.
const DRAFT = [0, 6.6, 10, 15.4, 18.6, 20, 22, 27, 31.2, 35, 39.4, 45, 47.6, 50, 53.4, 55.6, 58.4, 60];
const LENGTHS = [9, 5, 7, 4.5, 2.5, 3.5, 7, 7, 5.5, 6, 7, 5, 3.5, 5, 4.5, 4.5, 3.5];
const FINAL = LENGTHS.reduce((acc, d) => [...acc, acc[acc.length - 1] + d], [0]);

function remap(x, from, to) {
  let i = 0;
  while (i < from.length - 2 && x > from[i + 1]) i++;
  return to[i] + ((x - from[i]) / (from[i + 1] - from[i])) * (to[i + 1] - to[i]);
}
export const at = (x) => Math.round(remap(x, DRAFT, FINAL) * 1000) / 1000;
export const draft = (t) => remap(t, FINAL, DRAFT);

export const DURATION = FINAL[FINAL.length - 1];
export const FRAMES = FPS * DURATION;

export const SCENES = [
  { id: 1, title: 'The Collector', start: 0 },
  { id: 2, title: 'The Trade', start: at(10) },
  { id: 3, title: 'The Price', start: at(22) },
  { id: 4, title: 'The Last Storm', start: at(35) },
  { id: 5, title: 'Letting Go', start: at(50) },
];

// `in`: how this shot arrives. dissolve/fade durations overlap the end of the previous shot.
export const SHOTS = [
  { id: '1A', scene: 1, start: FINAL[0], end: FINAL[1], in: { type: 'fade', dur: 2.0 } },
  { id: '1B', scene: 1, start: FINAL[1], end: FINAL[2], in: { type: 'dissolve', dur: 1.2 } },
  { id: '2A', scene: 2, start: FINAL[2], end: FINAL[3], in: { type: 'dissolve', dur: 1.2 } },
  { id: '2B', scene: 2, start: FINAL[3], end: FINAL[4], in: { type: 'cut' } },
  { id: '2C', scene: 2, start: FINAL[4], end: FINAL[5], in: { type: 'cut' } },
  { id: '2D', scene: 2, start: FINAL[5], end: FINAL[6], in: { type: 'cut' } },
  { id: '3A', scene: 3, start: FINAL[6], end: FINAL[7], in: { type: 'dissolve', dur: 1.6 } },
  { id: '3B', scene: 3, start: FINAL[7], end: FINAL[8], in: { type: 'dissolve', dur: 1.2 } },
  { id: '3C', scene: 3, start: FINAL[8], end: FINAL[9], in: { type: 'dissolve', dur: 1.2 } },
  { id: '4A', scene: 4, start: FINAL[9], end: FINAL[10], in: { type: 'dissolve', dur: 1.0 } },
  { id: '4B', scene: 4, start: FINAL[10], end: FINAL[11], in: { type: 'cut' } },
  { id: '4C', scene: 4, start: FINAL[11], end: FINAL[12], in: { type: 'cut' } },
  { id: '4D', scene: 4, start: FINAL[12], end: FINAL[13], in: { type: 'cut' } },
  { id: '5A', scene: 5, start: FINAL[13], end: FINAL[14], in: { type: 'dissolve', dur: 1.8 } },
  { id: '5B', scene: 5, start: FINAL[14], end: FINAL[15], in: { type: 'dissolve', dur: 1.2 } },
  { id: '5C', scene: 5, start: FINAL[15], end: FINAL[16], in: { type: 'dissolve', dur: 1.2 } },
  { id: '5D', scene: 5, start: FINAL[16], end: FINAL[17], in: { type: 'cut' } },
];

export const CUES = [
  { start: at(1.6), end: at(4.8), text: 'The old man collected storms.' },
  { start: at(5.4), end: at(9.4), text: 'He sold them to villages that had forgotten the rain.' },
  { start: at(19.8), end: at(22.0), text: 'In return, he asked for gold.' },
  { start: at(23.0), end: at(26.6), text: 'But every storm he released took something from him.' },
  { start: at(27.4), end: at(30.8), text: 'A face. A voice. A memory.' },
  { start: at(31.6), end: at(34.6), text: 'Until only one bottle remained.' },
  { start: at(35.2), end: at(38.4), text: 'He had saved it for the day he could no longer bear the silence.' },
  { start: at(41.0), end: at(43.6), text: 'When he opened it, the sea remembered.' },
  { start: at(47.8), end: at(49.9), text: 'For one moment, she was there.' },
  { start: at(50.6), end: at(53.2), text: 'Then the rain washed everything away.' },
  { start: at(55.7), end: at(58.2), text: 'Some storms are worth keeping. Some are worth letting go.' },
];

// Story beats shared by picture and sound.
export const BEATS = {
  release: at(10.9), // first storm leaves its bottle over the coast
  coins: [at(20.35), at(20.62), at(20.86)],
  memory: [at(27.4), at(28.6), at(29.8)], // "A face." "A voice." "A memory."
  cork: at(38.7),
  reveal: [at(45.55), at(47.2)], // daughter in the storm reflection
  reveal2: [at(53.9), at(55.2)], // second, calm reflection
  fadeOut: [at(57.4), at(58.4)],
};

// Lightning strikes: time, horizontal position (0..1 of frame width), strength.
// Spaced so no one-second window holds more than three flashes.
export const STRIKES = [
  { t: at(3.4), x: 0.22, s: 0.25, far: true },
  { t: at(40.5), x: 0.62, s: 1.0 },
  { t: at(42.3), x: 0.34, s: 0.9 },
  { t: at(43.95), x: 0.78, s: 0.75 },
  { t: at(45.35), x: 0.4, s: 0.85 },
  { t: at(46.75), x: 0.7, s: 0.6 },
  { t: at(48.5), x: 0.25, s: 0.5 },
];

// Lightning luminance envelope at time t (0..~1).
export function flashAt(t, filter) {
  let f = 0;
  for (const s of STRIKES) {
    if (filter && !filter(s)) continue;
    const d = t - s.t;
    if (d < 0 || d > 0.9) continue;
    const e = (d < 0.03 ? d / 0.03 : Math.exp(-(d - 0.03) / 0.09)) + (d > 0.15 ? 0.55 * Math.exp(-(d - 0.15) / 0.07) : 0);
    f = Math.max(f, e * s.s);
  }
  return f;
}

// Flash for a shot's view, softened when the viewer prefers reduced motion.
export function flashFor(V, filter) {
  return flashAt(V.t, filter) * (V.flashScale ?? 1);
}

export function shotAt(t) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return i;
  return 0;
}

export function sceneAt(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].start) return SCENES[i];
  return SCENES[0];
}

export function cueAt(t) {
  return CUES.find((c) => t >= c.start && t < c.end) || null;
}
