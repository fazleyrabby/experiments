// renderFrame(t): the whole film as a pure function of time and output size.
// Picks the active shot, composites transitions, then runs the post pass.
import { SHOTS, FPS, DURATION, shotAt, cueAt, BEATS, at } from './timeline.js';
import { P, mix, rgba } from './core/color.js';
import { ramp, smooth, clamp } from './core/math.js';
import { post } from './core/post.js';
import { makeCanvas } from './core/textures.js';
import { layerOff } from './art/sky.js';
import { shots as s1 } from './scenes/collector.js';
import { shots as s2 } from './scenes/trade.js';
import { shots as s3 } from './scenes/price.js';
import { shots as s4 } from './scenes/storm.js';
import { shots as s5 } from './scenes/letgo.js';

const RENDER = { ...s1, ...s2, ...s3, ...s4, ...s5 };

// Colour story over the whole film.
function gradeAt(t) {
  const cold = ramp(t, at(23.5), at(28)) * 0.22 + ramp(t, at(31.4), at(34.6)) * 0.62 - ramp(t, at(38.6), at(39.6)) * 0.84 + ramp(t, at(50), at(53)) * 0.12 - ramp(t, at(55), at(58)) * 0.06;
  const warm = ramp(t, at(0), at(2)) * 0.25 * (1 - ramp(t, at(22), at(24))) + ramp(t, at(39), at(40)) * 0.35 * (1 - ramp(t, at(49), at(51))) + ramp(t, at(52), at(56)) * 0.18;
  return {
    cold: clamp(cold),
    warm: clamp(warm),
    bloom: 0.32 + ramp(t, at(38.6), at(39.4)) * 0.18 * (1 - ramp(t, at(47), at(50))),
    contrast: 0.12,
    vignette: 0.85,
    fade: ramp(t, BEATS.fadeOut[0], BEATS.fadeOut[1]) * (t < at(58.4) ? 1 : 0),
  };
}

let buffer = null;

function view(w, h, t, shot, opts, frame) {
  const lt = t - shot.start;
  return {
    w, h, u: Math.min(w, h) / 1000, q: opts.quality ?? 1, portrait: h > w, t, lt,
    k: clamp(lt / (shot.end - shot.start)), frame, shot,
    layers: opts.layers || {}, flashScale: opts.flashScale ?? 1,
  };
}

function drawShot(g, w, h, t, i, opts, frame) {
  const shot = SHOTS[i];
  const V = view(w, h, t, shot, opts, frame);
  g.save();
  g.fillStyle = rgba(P.night);
  g.fillRect(0, 0, w, h);
  const fn = RENDER[shot.id];
  if (fn) fn(g, V);
  g.restore();
}

// opts: { quality (0.5|1), layers, subtitles (burn in), frame }
export function renderFrame(canvas, t, opts = {}) {
  const w = canvas.width, h = canvas.height;
  const g = canvas.getContext('2d');
  layerOff.clouds = !!opts.layers && opts.layers.clouds === false;
  const frame = opts.frame ?? Math.floor(t * FPS);
  t = clamp(t, 0, DURATION - 0.001);
  const i = shotAt(t);
  const shot = SHOTS[i];
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.imageSmoothingEnabled = true;

  drawShot(g, w, h, t, i, opts, frame);

  const grade = gradeAt(t);
  grade.frame = frame;
  const tin = shot.in;
  const since = t - shot.start;
  if (tin.type === 'dissolve' && i > 0 && since < tin.dur) {
    if (!buffer || buffer.width !== w || buffer.height !== h) buffer = makeCanvas(w, h);
    const b = buffer.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    drawShot(b, w, h, t, i - 1, opts, frame);
    g.globalAlpha = 1 - smooth(since / tin.dur);
    g.drawImage(buffer, 0, 0);
    g.globalAlpha = 1;
  }
  if (tin.type === 'fade' && since < tin.dur) grade.fade = Math.max(grade.fade, 1 - smooth(since / tin.dur));

  post(g, canvas, w, h, grade, opts.layers || {});

  if (opts.subtitles) drawSubtitle(g, w, h, t, 1 - grade.fade);
  return { shot, grade };
}

export function drawSubtitle(g, w, h, t, alpha = 1) {
  const cue = cueAt(t);
  if (!cue) return;
  const a = alpha * smooth((t - cue.start) / 0.35) * (1 - smooth((t - (cue.end - 0.35)) / 0.35));
  const u = Math.min(w, h) / 1000;
  const size = Math.round((h > w ? 38 : 34) * u);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = `italic ${size}px "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  const maxW = w * (h > w ? 0.84 : 0.7);
  const lines = wrap(g, cue.text, maxW);
  const lh = size * 1.32;
  const y0 = h * (h > w ? 0.83 : 0.9) - (lines.length - 1) * lh;
  g.shadowColor = rgba(mix(P.night, [0, 0, 0], 0.5), 0.85 * a);
  g.shadowBlur = 10 * u;
  g.fillStyle = rgba(P.parch, 0.94 * a);
  lines.forEach((ln, k) => g.fillText(ln, w / 2, y0 + k * lh));
  g.restore();
}

function greedy(g, words, maxW) {
  const lines = [];
  let cur = '';
  for (const wd of words) {
    const test = cur ? cur + ' ' + wd : wd;
    if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// Balanced wrap: keep the greedy line count, then narrow the measure so lines come out even (no orphans).
function wrap(g, text, maxW) {
  const words = text.split(' ');
  const lines = greedy(g, words, maxW);
  if (lines.length < 2) return lines;
  const total = g.measureText(text).width;
  for (let m = total / lines.length; m < maxW; m *= 1.04) {
    const l = greedy(g, words, m);
    if (l.length === lines.length) return l;
  }
  return lines;
}
