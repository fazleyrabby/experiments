// Original synthesized soundtrack (Web Audio API). Two stems — ambience and effects — are rendered
// once with an OfflineAudioContext from the film timeline, then played back from the film offset.
// Seeking restarts the sources, so sound stays sample-locked to the picture; export reuses the same mix.
import { DURATION, STRIKES, BEATS, at, draft } from './timeline.js';
import { rng, ramp, clamp, smooth } from './core/math.js';

const W = (t, a, b, c, d) => ramp(t, a, b) * (1 - ramp(t, c, d));

// ——— Level curves over the film (0..1) ———
// Written on the draft timeline: each takes film time and reads its curve at draft(t).
function oceanLevel(t) {
  t = draft(t);
  return 0.55 * W(t, 0, 1.5, 9.6, 10.2) + 0.32 * W(t, 6.6, 7.2, 10, 10.6) // scene 1 (closer in 1B)
    + 0.5 * W(t, 9.8, 10.6, 15.2, 15.6) // 2A
    + 0.25 * W(t, 18.4, 18.8, 22, 22.4) // 2C–2D, distant
    + 0.12 * W(t, 22, 22.6, 31, 31.6) // cabin, muffled
    + 0.05 * W(t, 31.2, 31.6, 38.5, 38.8) // the still sea: almost nothing
    + 0.95 * W(t, 39.2, 40.4, 44.8, 45.05) // the storm
    + 0.05 * W(t, 45, 45.1, 47.4, 47.7) // the reveal: hush
    + 0.75 * W(t, 47.6, 47.9, 49.8, 50.4)
    + 0.45 * W(t, 50, 50.8, 53.2, 53.5) + 0.2 * W(t, 53.4, 53.6, 55.4, 55.8) + 0.35 * W(t, 55.6, 56.2, 57.6, 58.6);
}
function oceanCutoff(t) {
  t = draft(t);
  if (t > 22 && t < 31.4) return 260; // heard through cabin walls
  if (t > 39.2 && t < 45) return 1400;
  return 700;
}
function windLevel(t) {
  t = draft(t);
  return 0.22 * W(t, 0, 2, 9.5, 10.2) + 0.2 * W(t, 10, 11, 15, 15.4) + 0.1 * W(t, 22, 23, 30, 31)
    + 0.75 * W(t, 38.8, 40.5, 44.8, 45.05) + 0.06 * W(t, 45, 45.1, 47.3, 47.6) + 0.55 * W(t, 47.6, 47.9, 49.5, 51)
    + 0.08 * W(t, 50.5, 52, 57.4, 58.4);
}
function rainLevel(t) {
  t = draft(t);
  return 0.25 * W(t, 13.6, 15, 15.3, 15.45) + 0.85 * W(t, 15.4, 15.45, 18.5, 18.65) + 0.3 * W(t, 18.6, 18.7, 21.8, 22.2)
    + 0.05 * W(t, 22, 23, 30, 31)
    + 0.9 * W(t, 41, 43, 44.9, 45.05) + 0.1 * W(t, 45, 45.1, 47.4, 47.7) + 0.95 * W(t, 47.6, 47.7, 49.6, 50.5)
    + 0.5 * W(t, 50, 50.5, 52.6, 53.6) + 0.18 * W(t, 53.4, 53.8, 55.4, 56) + 0.06 * W(t, 55.6, 56, 57.4, 58.4);
}
function roomLevel(t) { return 0.12 * W(draft(t), 22, 22.8, 34, 35.2); }

function noiseBuffer(ctx, seconds, seed, kind = 'white') {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const r = rng(seed + c * 101);
    const d = buf.getChannelData(c);
    let b = 0, p0 = 0, p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      if (kind === 'brown') { b = (b + 0.02 * w) / 1.02; d[i] = b * 3.5; }
      else if (kind === 'pink') { p0 = 0.99765 * p0 + w * 0.099; p1 = 0.963 * p1 + w * 0.2965; p2 = 0.57 * p2 + w * 1.0527; d[i] = (p0 + p1 + p2 + w * 0.1848) * 0.2; }
      else d[i] = w;
    }
  }
  return buf;
}

function curve(fn, sr = 40) {
  const n = Math.ceil(DURATION * sr) + 1;
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = fn(i / sr);
  return a;
}

function loopSource(ctx, buf, rate = 1) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.playbackRate.value = rate;
  s.start(0);
  return s;
}

function impulse(ctx, seconds, seed) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const r = rng(seed + c);
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 3.2);
  }
  return buf;
}

// ——— Ambience stem ———
function buildAmbience(ctx) {
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);
  const brown = noiseBuffer(ctx, 6, 7, 'brown');
  const pink = noiseBuffer(ctx, 6, 9, 'pink');
  const white = noiseBuffer(ctx, 4, 11, 'white');

  // Sea: brown noise swelling and receding, plus a hiss of breaking crests on each swell.
  const sea = loopSource(ctx, brown);
  const seaLp = ctx.createBiquadFilter();
  seaLp.type = 'lowpass';
  seaLp.frequency.setValueCurveAtTime(curve((t) => oceanCutoff(t) * (0.7 + 0.3 * Math.sin(t * 0.9))), 0, DURATION);
  const swell = (t) => 0.55 + 0.45 * Math.sin((t / 6.3) * Math.PI * 2) * Math.sin((t / 2.9) * Math.PI * 2 + 1);
  const seaG = ctx.createGain();
  seaG.gain.setValueCurveAtTime(curve((t) => oceanLevel(t) * swell(t) * 1.2), 0, DURATION);
  sea.connect(seaLp).connect(seaG).connect(out);
  const crest = loopSource(ctx, pink, 0.9);
  const crestF = ctx.createBiquadFilter();
  crestF.type = 'bandpass'; crestF.frequency.value = 2400; crestF.Q.value = 0.6;
  const crestG = ctx.createGain();
  crestG.gain.setValueCurveAtTime(curve((t) => {
    const lvl = t > at(22) && t < at(31.4) ? 0.1 : 1;
    return oceanLevel(t) * lvl * 0.35 * Math.pow(clamp(swell(t + 0.6) - 0.35), 2) * 2.2;
  }), 0, DURATION);
  crest.connect(crestF).connect(crestG).connect(out);

  // Wind: band-passed pink noise with a wandering centre.
  const wind = loopSource(ctx, pink, 1.1);
  const windF = ctx.createBiquadFilter();
  windF.type = 'bandpass'; windF.Q.value = 1.8;
  windF.frequency.setValueCurveAtTime(curve((t) => Math.max(120, 420 + 200 * Math.sin(t * 0.37) + 120 * Math.sin(t * 1.13 + 2) + windLevel(t) * 500)), 0, DURATION);
  const windG = ctx.createGain();
  windG.gain.setValueCurveAtTime(curve((t) => windLevel(t) * (0.8 + 0.2 * Math.sin(t * 0.7)) * 0.9), 0, DURATION);
  wind.connect(windF).connect(windG).connect(out);

  // Rain: a bright wash plus individual drops.
  const rain = loopSource(ctx, white, 1);
  const rainHp = ctx.createBiquadFilter(); rainHp.type = 'highpass'; rainHp.frequency.value = 1400;
  const rainLp = ctx.createBiquadFilter(); rainLp.type = 'lowpass'; rainLp.frequency.value = 8500;
  const rainG = ctx.createGain();
  rainG.gain.setValueCurveAtTime(curve((t) => rainLevel(t) * 0.16), 0, DURATION);
  rain.connect(rainHp).connect(rainLp).connect(rainG).connect(out);
  const r = rng(404);
  for (let t = 0; t < DURATION; t += 0.018) {
    const lvl = rainLevel(t);
    if (r() > lvl * 0.45) continue;
    const s = ctx.createBufferSource();
    s.buffer = white;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800 + r() * 5000; f.Q.value = 6;
    const g = ctx.createGain();
    const a = (0.04 + r() * 0.08) * lvl;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + r() * 0.04);
    const pan = ctx.createStereoPanner(); pan.pan.value = r() * 2 - 1;
    s.connect(f).connect(g).connect(pan).connect(out);
    s.start(t, r() * 3, 0.08);
  }

  // Cabin room tone: a low, close hum of wood and lamp.
  const room = loopSource(ctx, brown, 0.6);
  const roomF = ctx.createBiquadFilter(); roomF.type = 'lowpass'; roomF.frequency.value = 160;
  const roomG = ctx.createGain();
  roomG.gain.setValueCurveAtTime(curve(roomLevel), 0, DURATION);
  room.connect(roomF).connect(roomG).connect(out);
  return ctx;
}

// ——— Effects stem ———
function buildEffects(ctx) {
  const dry = ctx.createGain();
  dry.gain.value = 0.85;
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 2.8, 77);
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
  dry.connect(comp);
  dry.connect(verb).connect(wet).connect(comp);
  comp.connect(ctx.destination);
  const white = noiseBuffer(ctx, 3, 21, 'white');
  const brown = noiseBuffer(ctx, 6, 23, 'brown');
  const r = rng(909);

  const env = (g, t, a, att, dec) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(a, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec);
  };
  const pan = (p) => { const n = ctx.createStereoPanner(); n.pan.value = p; n.connect(dry); return n; };

  // Wooden boat creak: stick-slip pulses through a resonant body.
  const creak = (t, f0, dur, a, p = 0) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f0 * (0.8 + r() * 0.5), t + dur);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + r() * 600; bp.Q.value = 4;
    const g = ctx.createGain();
    const n = Math.max(8, Math.floor(dur * 60));
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) c[i] = a * (r() < 0.6 ? r() : 0.1) * Math.sin((i / (n - 1)) * Math.PI);
    g.gain.setValueAtTime(0, t);
    g.gain.setValueCurveAtTime(c, t + 0.001, dur);
    o.connect(bp).connect(g).connect(pan(p));
    o.start(t); o.stop(t + dur + 0.05);
  };
  for (const [t, f, d, a] of [[0.9, 110, 0.6, 0.06], [3.9, 95, 0.7, 0.05], [7.3, 130, 0.5, 0.09], [9.1, 105, 0.6, 0.08], [11.6, 120, 0.5, 0.05],
    [40.2, 140, 0.4, 0.12], [41.4, 100, 0.6, 0.14], [42.9, 160, 0.35, 0.12], [44.1, 120, 0.5, 0.13], [48.1, 110, 0.6, 0.12], [49.3, 95, 0.7, 0.08],
    [51.2, 90, 0.8, 0.05], [56.4, 85, 0.9, 0.04]]) creak(at(t), f, d, a, r() * 0.6 - 0.3);
  // Rope tension in the storm: higher, strained.
  for (const t of [39.9, 40.8, 41.7, 42.6, 43.4, 44.3, 48.8]) creak(at(t), 260 + r() * 140, 0.25 + r() * 0.2, 0.06, 0.4);

  // Distant gulls.
  const gull = (t, a, p) => {
    for (let k = 0; k < 2; k++) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      const t0 = t + k * 0.32;
      o.frequency.setValueAtTime(1500, t0);
      o.frequency.linearRampToValueAtTime(2300, t0 + 0.06);
      o.frequency.exponentialRampToValueAtTime(1100, t0 + 0.28);
      const vib = ctx.createOscillator(); vib.frequency.value = 28;
      const vg = ctx.createGain(); vg.gain.value = 60;
      vib.connect(vg).connect(o.frequency);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 2;
      const g = ctx.createGain();
      env(g, t0, a * (k ? 0.7 : 1), 0.03, 0.27);
      o.connect(bp).connect(g).connect(pan(p));
      o.start(t0); o.stop(t0 + 0.35); vib.start(t0); vib.stop(t0 + 0.35);
    }
  };
  for (const [t, a, p] of [[1.2, 0.025, -0.5], [2.9, 0.018, -0.3], [5.2, 0.02, -0.6], [56.2, 0.018, 0.4], [57.3, 0.012, 0.5]]) gull(at(t), a, p);

  // Glass: struck partials (taps, rings) and a sustained bowed tone for the reveal.
  const glass = (t, f, a, dec, p = 0) => {
    for (const [m, k] of [[1, 1], [2.32, 0.5], [4.25, 0.25], [6.8, 0.12]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
      const g = ctx.createGain();
      env(g, t, a * k, 0.002, dec / m);
      o.connect(g).connect(pan(p));
      o.start(t); o.stop(t + dec + 0.1);
    }
  };
  glass(at(7.0), 1760, 0.05, 2.2, 0.2);
  glass(at(18.62), 1480, 0.07, 2.6, 0.3);
  glass(at(31.7), 1320, 0.03, 3.2, 0.2);
  glass(at(35.3), 1568, 0.035, 2.4, 0);
  const bowed = (t0, t1, freqs, a) => {
    for (const f of freqs) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.2 + r();
      const lg = ctx.createGain(); lg.gain.value = f * 0.003;
      lfo.connect(lg).connect(o.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(a, t0 + 0.6);
      g.gain.setValueAtTime(a, t1 - 0.8);
      g.gain.linearRampToValueAtTime(0.0001, t1);
      o.connect(g).connect(dry);
      o.start(t0); o.stop(t1 + 0.1); lfo.start(t0); lfo.stop(t1 + 0.1);
    }
  };
  bowed(at(45.05), at(48.2), [880, 1318.5, 1760.3], 0.022);
  bowed(at(53.5), at(56.0), [659.3, 987.8, 1318.5], 0.014);

  // Coins.
  for (const t of BEATS.coins) {
    for (const f of [3150, 4870, 6230, 8400]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (0.98 + r() * 0.04);
      const g = ctx.createGain();
      env(g, t, 0.035, 0.001, 0.18 + r() * 0.2);
      o.connect(g).connect(pan(-0.1));
      o.start(t); o.stop(t + 0.5);
    }
  }

  // Swooshes: a storm leaving its bottle.
  const whoosh = (t, dur, f0, f1, a, p = 0) => {
    const s = ctx.createBufferSource(); s.buffer = white;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(a, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(pan(p));
    s.start(t, 0, dur + 0.1);
  };
  whoosh(BEATS.release, 2.2, 300, 2600, 0.12, -0.4);

  // The cork: a pop, a thump, a rush.
  {
    const t = BEATS.cork;
    const s = ctx.createBufferSource(); s.buffer = white;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
    const g = ctx.createGain(); env(g, t, 0.35, 0.001, 0.05);
    s.connect(hp).connect(g).connect(dry); s.start(t, 0, 0.1);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.09);
    const g2 = ctx.createGain(); env(g2, t, 0.3, 0.002, 0.12);
    o.connect(g2).connect(dry); o.start(t); o.stop(t + 0.2);
    glass(t + 0.01, 2093, 0.06, 1.6, 0);
    whoosh(t + 0.05, 2.4, 200, 3200, 0.22, 0);
    whoosh(at(39.4), 4.0, 120, 900, 0.18, 0.2);
  }

  // Thunder after each strike: a crack, then a long rolling rumble.
  for (const s of STRIKES) {
    const delay = s.far ? 1.6 : 0.15 + (1 - s.s) * 0.6;
    const t = s.t + delay;
    const a = s.far ? 0.12 : 0.5 * s.s;
    if (!s.far) {
      const c = ctx.createBufferSource(); c.buffer = white;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      const g = ctx.createGain(); env(g, t, a * 0.5, 0.004, 0.35);
      c.connect(lp).connect(g).connect(dry); c.start(t, r() * 2, 0.5);
    }
    const b = ctx.createBufferSource(); b.buffer = brown;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = s.far ? 140 : 260;
    const g = ctx.createGain();
    const dur = s.far ? 3.5 : 3.2;
    const n = 64, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const k = i / (n - 1); c[i] = a * Math.pow(1 - k, 1.6) * (0.55 + 0.45 * r()) * smooth(k * 8); }
    g.gain.setValueAtTime(0, t);
    g.gain.setValueCurveAtTime(c, t + 0.001, dur);
    b.connect(lp).connect(g).connect(pan(r() * 0.6 - 0.3)); b.start(t, r() * 3, dur + 0.2);
  }

  // A low pad under the cabin and under the ending, and a final swell for the title.
  const pad = (t0, t1, freqs, a) => {
    for (const f of freqs) {
      for (const det of [-3, 3]) {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(a, t0 + (t1 - t0) * 0.35);
        g.gain.linearRampToValueAtTime(0.0001, t1);
        o.connect(lp).connect(g).connect(dry);
        o.start(t0); o.stop(t1 + 0.1);
      }
    }
  };
  pad(at(26.8), at(35.4), [110, 164.8, 261.6], 0.012);
  pad(at(50.4), DURATION, [110, 164.8, 220, 277.2], 0.011);
  pad(at(58.2), DURATION, [55, 82.4], 0.02);
  return ctx;
}

async function renderStem(build, sr) {
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * DURATION), sr);
  build(ctx);
  return ctx.startRendering();
}

// Mix stems (and optional narration) into one stereo buffer for export.
export async function renderMix(sr = 48000, narration = null) {
  const [amb, fx] = await Promise.all([renderStem(buildAmbience, sr), renderStem(buildEffects, sr)]);
  const n = amb.length;
  const L = new Float32Array(n), R = new Float32Array(n);
  const al = amb.getChannelData(0), ar = amb.getChannelData(1), fl = fx.getChannelData(0), fr = fx.getChannelData(1);
  for (let i = 0; i < n; i++) { L[i] = al[i] + fl[i]; R[i] = ar[i] + fr[i]; }
  if (narration) {
    const off = Math.round((narration.offset || 0) * sr);
    const nl = narration.buffer.getChannelData(0), nr = narration.buffer.getChannelData(narration.buffer.numberOfChannels > 1 ? 1 : 0);
    const ratio = narration.buffer.sampleRate / sr;
    for (let i = 0; i < n; i++) {
      const j = Math.floor((i - off) * ratio);
      if (j >= 0 && j < nl.length) { L[i] += nl[j]; R[i] += nr[j]; }
    }
  }
  // Soft limit.
  for (let i = 0; i < n; i++) { L[i] = Math.tanh(L[i] * 1.1) * 0.95; R[i] = Math.tanh(R[i] * 1.1) * 0.95; }
  return { sampleRate: sr, channels: [L, R] };
}

// Returns the WAV file as an ArrayBuffer.
export function encodeWav({ sampleRate, channels }) {
  const n = channels[0].length, nc = channels.length;
  const buf = new ArrayBuffer(44 + n * nc * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * nc * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * nc * 2, true); v.setUint16(32, nc * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * nc * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { v.setInt16(o, Math.max(-1, Math.min(1, channels[c][i])) * 0x7fff, true); o += 2; }
  return buf;
}

export async function loadNarrationConfig(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const cfg = await res.json();
  if (!cfg || !cfg.src) return null;
  const data = await (await fetch(new URL(cfg.src, new URL(url, location.href)))).arrayBuffer();
  const buffer = await new OfflineAudioContext(2, 1, 48000).decodeAudioData(data);
  return { ...cfg, buffer };
}

export class Soundtrack {
  constructor() {
    this.ready = false;
    this.running = false;
    this.master = 0.85;
    this.amb = 1;
    this.fx = 1;
    this.muted = false;
    this.ctx = null;
    this.sources = [];
    this.stems = null;
    this.narration = null;
    this._prep = null;
  }

  async unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
      this.gAmb = this.ctx.createGain(); this.gAmb.connect(this.out);
      this.gFx = this.ctx.createGain(); this.gFx.connect(this.out);
      this.gNar = this.ctx.createGain(); this.gNar.connect(this.out);
      this.apply();
    }
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  prepare() {
    if (!this._prep) {
      this._prep = Promise.all([renderStem(buildAmbience, 44100), renderStem(buildEffects, 44100)]).then(([amb, fx]) => {
        this.stems = { amb, fx };
        this.ready = true;
      });
    }
    return this._prep;
  }

  play(t) {
    if (!this.ctx || !this.ready) return;
    this.stop();
    const offset = clamp(t, 0, DURATION);
    const now = this.ctx.currentTime + 0.03;
    const add = (buf, dest, off = 0) => {
      const s = this.ctx.createBufferSource();
      s.buffer = buf;
      s.connect(dest);
      const o = offset - off;
      if (o >= 0) s.start(now, o); else s.start(now - o, 0);
      this.sources.push(s);
    };
    add(this.stems.amb, this.gAmb);
    add(this.stems.fx, this.gFx);
    if (this.narration) add(this.narration.buffer, this.gNar, this.narration.offset || 0);
    this.t0 = now;
    this.offset = offset;
    this.running = true;
  }

  stop() {
    for (const s of this.sources) { try { s.stop(); } catch { /* already stopped */ } }
    this.sources = [];
    this.running = false;
  }

  time() {
    return this.offset + Math.max(0, this.ctx.currentTime - this.t0);
  }

  apply() {
    if (!this.out) return;
    const now = this.ctx.currentTime;
    this.out.gain.setTargetAtTime(this.muted ? 0 : this.master, now, 0.03);
    this.gAmb.gain.setTargetAtTime(this.amb, now, 0.03);
    this.gFx.gain.setTargetAtTime(this.fx, now, 0.03);
  }

  setLevels({ master, amb, fx }) {
    this.master = master; this.amb = amb; this.fx = fx;
    this.apply();
  }

  setMuted(m) { this.muted = m; this.apply(); }

  async loadNarration(url) {
    const n = await loadNarrationConfig(url);
    this.narration = n;
    return n;
  }
}
