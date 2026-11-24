import { clamp, lerp } from './util.js';

/** 15 seconds of screen time showing 30 seconds of island life (2x). */
export const SHOT = { duration: 15, fps: 60, speed: 2, width: 1920, height: 1080 };

// One slow push in, one pull out, then a gentle settle on the lit dock.
const ZOOM = [[0, 49], [5.6, 31], [10.2, 47], [15, 36]];
const TILT = [[0, 0.4], [5.6, 0.29], [10.2, 0.43], [15, 0.3]];
const CLOCK = [[0, 6.55], [2.6, 9.4], [5.2, 12.7], [8.1, 16.5], [11, 18.45], [13.2, 19.75], [15, 20.35]];
const BREEZE = [[0, 0.3], [4, 0.4], [8.1, 0.6], [11, 0.46], [15, 0.24]];

const smoother = (u) => u * u * u * (u * (u * 6 - 15) + 10);

function eased(track, t, log = false) {
  let i = 0;
  while (i < track.length - 2 && t >= track[i + 1][0]) i++;
  const [t0, a] = track[i];
  const [t1, b] = track[i + 1];
  const u = smoother(clamp((t - t0) / (t1 - t0)));
  return log ? Math.exp(lerp(Math.log(a), Math.log(b), u)) : lerp(a, b, u);
}

/** Catmull-Rom through the keys, so the clock never pauses between times of day. */
function flowing(track, t) {
  let i = 0;
  while (i < track.length - 2 && t >= track[i + 1][0]) i++;
  const k1 = track[i];
  const k2 = track[i + 1];
  const k0 = track[Math.max(0, i - 1)];
  const k3 = track[Math.min(track.length - 1, i + 2)];
  const span = k2[0] - k1[0];
  const m1 = ((k2[1] - k0[1]) / (k2[0] - k0[0])) * span;
  const m2 = ((k3[1] - k1[1]) / (k3[0] - k1[0])) * span;
  const u = (t - k1[0]) / span;
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * k1[1] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * k2[1] + (u3 - u2) * m2;
}

export function shotAt(T) {
  const time = clamp(T, 0, SHOT.duration);
  const dist = eased(ZOOM, time, true);
  const close = clamp((49 - dist) / 18);
  const ending = smoother(clamp((time - 11.5) / 3.5));
  return {
    az: 0.2 + (Math.PI * 2 * time) / SHOT.duration,
    el: eased(TILT, time),
    dist,
    x: lerp(0.1, 1.3, ending),
    y: lerp(-0.8, 0.1, close),
    z: lerp(0.5, 1.9, ending),
    hour: clamp(flowing(CLOCK, time), 5.5, 20.5),
    wind: clamp(flowing(BREEZE, time), 0, 1),
  };
}

export const RIPPLES = [
  [1.1, 5.2, 8.1, 0.14],
  [2.3, 7.2, 6.4, 0.12],
  [4.4, -4.6, 9.8, 0.14],
  [6.5, -8.4, 5.6, 0.12],
  [8.6, -10.2, -1.2, 0.14],
  [11.7, 8.6, 7.4, 0.12],
  [13.1, 5.4, 7.6, 0.13],
];
