// Spatial, context-aware ambient sound, synthesised live with the Web Audio API (no sample files).
//
//  - Point sources (birds, frogs, fish splashes, stream, fire, crickets) sit at positions derived from the
//    picture, so they pan, filter and gain-drop with distance. Discrete sources use HRTF panning.
//  - Everything shares a procedurally generated forest/lake reverb and a distant mountain-slap echo.
//  - Layers cross-fade with the time of day and weather: dawn chorus -> day birds -> dusk silence ->
//    crickets, frogs and owls; fog muffles the air; rain ducks the birds and brings the frogs out.
import { clamp, lerp, smooth, Rng } from './util.js';
import { birdAct, cricketAct, frogAct, owlAct } from './activity.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

// screen position -> metres in front of the listener (x right, y up, -z forward)
const depthFromY = (sy) => 3 * Math.exp((270 - clamp(sy, 142, 270)) / 40.6); // 3 m at the bottom edge, ~70 m at the far shore
export function toWorld(sx, sy, sky = false, farness = 0.5) {
  if (sky) {
    const d = lerp(24, 85, farness);
    return { x: ((sx - 240) / 480) * 1.5 * d, y: Math.max(1, (142 - sy) * d * 0.006 + 6), z: -d, d };
  }
  const d = depthFromY(sy);
  return { x: ((sx - 240) / 480) * 1.5 * d, y: 0.4, z: -d, d };
}

function setPos(p, x, y, z) {
  if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; }
  else p.setPosition(x, y, z);
}
function rampPos(p, x, y, z, t) {
  if (p.positionX) { p.positionX.linearRampToValueAtTime(x, t); p.positionY.linearRampToValueAtTime(y, t); p.positionZ.linearRampToValueAtTime(z, t); }
}

function pinkBuffer(ctx, secs, seed) {
  const n = Math.floor(ctx.sampleRate * secs);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  const r = new Rng(seed);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = r.next() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  const f = Math.floor(ctx.sampleRate * 0.05); // crossfade the loop seam
  for (let i = 0; i < f; i++) { const t = i / f; d[i] = d[i] * t + d[n - f + i] * (1 - t); }
  return b;
}
function whiteBuffer(ctx, secs, seed) {
  const n = Math.floor(ctx.sampleRate * secs);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  const r = new Rng(seed);
  for (let i = 0; i < n; i++) d[i] = r.next() * 2 - 1;
  return b;
}

function reverbIR(ctx, secs = 2.8) {
  const sr = ctx.sampleRate, len = Math.floor(sr * secs);
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    const r = new Rng(900 + ch * 31);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.pow(1 - t, 2.6);
      const a = lerp(0.6, 0.05, Math.pow(t, 0.5));
      lp += a * ((r.next() * 2 - 1) - lp);
      d[i] = lp * env * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
    }
    // sparse early reflections from trunks and the far shore
    for (let k = 0; k < 14; k++) d[Math.floor(sr * (0.018 + r.next() * 0.11))] += (r.next() - 0.5) * 0.9;
  }
  return buf;
}

export class NatureAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.muted = false;
    this.volume = 0.7;
    this.paused = false;
    this.levels = { birds: 0, crickets: 0, frogs: 0, water: 0, wind: 0, rain: 0 };
    this.active = 0;
    this.timers = { bird: 1, frog: 4, owl: 12, drop: 0, pop: 0, bubble: 0, crickMod: 0 };
    this.envNow = null;
    this.later = [];
    this.offline = false;
  }

  // ---------- setup ----------
  async enable() {
    if (!this.ctx) this.build(new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' }));
    if (this.ctx.state !== 'running') await this.ctx.resume().catch(() => {});
    this.enabled = true;
    this.applyMaster();
  }

  build(ctx) {
    const c = (this.ctx = ctx);
    const G = (v = 1) => { const g = c.createGain(); g.gain.value = v; return g; };
    this.G = G;
    this.master = G(0);
    this.mixIn = G(1);
    this.air = c.createBiquadFilter();
    this.air.type = 'lowpass'; this.air.frequency.value = 16000; this.air.Q.value = 0.4;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -14; this.limiter.knee.value = 14; this.limiter.ratio.value = 5; this.limiter.attack.value = 0.006; this.limiter.release.value = 0.3;
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 1024;
    this.mixIn.connect(this.air); this.air.connect(this.master); this.master.connect(this.limiter); this.limiter.connect(c.destination); this.limiter.connect(this.analyser);

    // reverb
    this.conv = c.createConvolver();
    this.conv.buffer = reverbIR(c);
    this.revOut = G(0.9);
    this.conv.connect(this.revOut); this.revOut.connect(this.mixIn);
    this.revBoost = 1;
    // mountain echo (two staggered, filtered taps)
    this.echoIn = G(1);
    for (const [t, pan, lvl, f] of [[0.62, -0.45, 0.5, 1700], [1.07, 0.5, 0.3, 1200]]) {
      const dl = c.createDelay(2); dl.delayTime.value = t;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f;
      const fb = G(0.28), out = G(lvl), sp = c.createStereoPanner(); sp.pan.value = pan;
      this.echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(out); out.connect(sp); sp.connect(this.mixIn);
    }

    this.pink = [pinkBuffer(c, 6, 1), pinkBuffer(c, 6, 2), pinkBuffer(c, 6, 3), pinkBuffer(c, 6, 4)];
    this.white = whiteBuffer(c, 1, 5);
    this.buildBeds();
    this.buildCrickets();
    this.setListener(0);
  }

  loop(buf, offset = 0) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    s.start(0, offset);
    return s;
  }
  filt(type, f, q = 0.7) {
    const b = this.ctx.createBiquadFilter();
    b.type = type; b.frequency.value = f; b.Q.value = q;
    return b;
  }
  stereo(pan) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }
  panner(x, y, z, hrtf = true) {
    const p = this.ctx.createPanner();
    p.panningModel = hrtf ? 'HRTF' : 'equalpower';
    p.distanceModel = 'linear'; p.rolloffFactor = 0; p.refDistance = 1; p.maxDistance = 1000;
    setPos(p, x, y, z);
    return p;
  }
  // a persistent positional emitter: input -> lowpass -> panner -> mix, with reverb send
  emitter(sx, sy, { hrtf = true, wet = 0.2 } = {}) {
    const w = toWorld(sx, sy);
    const input = this.G(1);
    const lp = this.filt('lowpass', clamp(17000 / (1 + w.d / 14), 1800, 16000), 0.5);
    const pan = this.panner(w.x, w.y, w.z, hrtf);
    const rs = this.G(wet);
    input.connect(lp); lp.connect(pan); pan.connect(this.mixIn); lp.connect(rs); rs.connect(this.conv);
    return { input, pan, w, gainAtten: 1 / (1 + w.d / 14) };
  }
  setListener(x) {
    const L = this.ctx.listener;
    if (L.positionX) {
      L.positionX.value = x; L.positionY.value = 1.6; L.positionZ.value = 0;
      L.forwardX.value = 0; L.forwardY.value = 0; L.forwardZ.value = -1; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(x, 1.6, 0); L.setOrientation(0, 0, -1, 0, 1, 0); }
  }

  // ---------- continuous layers ----------
  buildBeds() {
    const c = this.ctx, G = this.G;
    const lfo = (f, depth, target) => {
      const o = c.createOscillator(); o.frequency.value = f; const g = G(depth);
      o.connect(g); g.connect(target); o.start();
      return o;
    };
    // lake: two decorrelated lapping channels, wide stereo
    this.lake = G(0);
    this.lake.connect(this.mixIn);
    [[-0.78, 0, 520, 0.11], [0.78, 1, 680, 0.15]].forEach(([pan, bi, f, lf]) => {
      const s = this.loop(this.pink[bi], bi * 2.1);
      const bp = this.filt('bandpass', f, 0.5);
      const g = G(0.5);
      s.connect(bp); bp.connect(g); g.connect(this.stereo(pan)).connect(this.lake);
      lfo(lf, 0.32, g.gain);
    });
    const low = this.loop(this.pink[2], 1.3), lpf = this.filt('lowpass', 240, 0.6), lg = G(0.8);
    low.connect(lpf); lpf.connect(lg); lg.connect(this.lake);
    lfo(0.07, 0.35, lg.gain);

    // stream: positional, bright babble
    this.stream = G(0);
    const src = this.loop(this.pink[3], 0.4);
    const bp = this.filt('bandpass', 1900, 0.7), hs = this.filt('highshelf', 3500, 0.7); hs.gain.value = 3;
    src.connect(bp); bp.connect(hs); hs.connect(this.stream);
    this.bubbleBp = this.filt('bandpass', 1200, 5);
    const bsrc = this.loop(this.pink[0], 2.2), bg = G(0.9);
    bsrc.connect(this.bubbleBp); this.bubbleBp.connect(bg); bg.connect(this.stream);
    lfo(7.3, 0.4, bg.gain);
    this.streamEm = this.emitter(337, 240, { wet: 0.12 });
    this.streamEm2 = this.emitter(320, 206, { wet: 0.3 });
    const tap2 = G(0.35);
    this.stream.connect(this.streamEm.input); this.stream.connect(tap2); tap2.connect(this.streamEm2.input);

    // wind: body + leaf rustle
    this.windBody = G(0); this.windPan = this.stereo(0);
    const ws = this.loop(this.pink[1], 3.3), wbp = this.filt('bandpass', 500, 0.6);
    ws.connect(wbp); wbp.connect(this.windBody); this.windBody.connect(this.windPan); this.windPan.connect(this.mixIn);
    this.windBp = wbp;
    this.rustle = [-0.7, 0.7].map((pan, i) => {
      const g = G(0), s = this.loop(this.pink[i * 2], i * 1.7 + 0.5);
      const hp = this.filt('highpass', 2600, 0.5), bp2 = this.filt('bandpass', 4600, 0.5);
      s.connect(hp); hp.connect(bp2); bp2.connect(g); g.connect(this.stereo(pan)).connect(this.mixIn);
      lfo(0.31 + i * 0.09, 0.3, g.gain);
      return g;
    });

    // rain: wash (wide) + body + positional patter on the cabin roof
    this.rainWash = [-0.85, 0.85].map((pan, i) => {
      const g = G(0), s = this.loop(this.pink[i], i * 2.5 + 0.9);
      const hp = this.filt('highpass', 650, 0.5), lp = this.filt('lowpass', 9000, 0.5);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(this.stereo(pan)).connect(this.mixIn);
      return g;
    });
    this.rainBody = G(0);
    const rb = this.loop(this.pink[2], 4.1), rlp = this.filt('lowpass', 420, 0.6);
    rb.connect(rlp); rlp.connect(this.rainBody); this.rainBody.connect(this.mixIn);

    // fire at the cabin
    this.fire = G(0);
    const fs = this.loop(this.pink[3], 5), flp = this.filt('lowpass', 280, 0.7);
    fs.connect(flp); flp.connect(this.fire);
    this.fireEm = this.emitter(86, 186, { wet: 0.25 });
    this.fire.connect(this.fireEm.input);
  }

  buildCrickets() {
    const c = this.ctx, G = this.G;
    this.cricketBus = G(0);
    this.cricketBus.connect(this.mixIn);
    const clip = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; clip[i] = Math.max(0, x); }
    this.crickets = [];
    for (let i = 0; i < 9; i++) {
      const sx = 40 + (i / 8) * 400 + rnd(-20, 20), sy = rnd(204, 262);
      const w = toWorld(sx, sy);
      const car = c.createOscillator(); car.type = 'sine'; car.frequency.value = rnd(4300, 5100);
      const am = G(0.5), trill = c.createOscillator(); trill.frequency.value = rnd(26, 33);
      const tg = G(0.5); trill.connect(tg); tg.connect(am.gain);
      const gate = c.createOscillator(); gate.frequency.value = rnd(1.6, 2.7);
      const sc = G(7), sh = c.createWaveShaper(); sh.curve = clip;
      const chirp = G(0); gate.connect(sc); sc.connect(sh); sh.connect(chirp.gain);
      const out = G(0.026 / (1 + w.d / 18) * 5.2);
      const pan = this.panner(w.x, w.y, w.z, false);
      const lp = this.filt('lowpass', 7500, 0.4);
      car.connect(am); am.connect(chirp); chirp.connect(out); out.connect(lp); lp.connect(pan); pan.connect(this.cricketBus);
      [car, trill, gate].forEach((o) => o.start(c.currentTime + Math.random()));
      this.crickets.push({ trill, base: trill.frequency.value });
    }
  }

  // ---------- one-shot voices ----------
  voice(w, { gain = 1, dur = 1, wet = null, echo = false, hrtf = true } = {}) {
    if (this.active > 12) return null;
    const c = this.ctx;
    const g = this.G(gain / (1 + w.d / 14));
    const lp = this.filt('lowpass', clamp(17000 / (1 + w.d / 14), 1700, 16000), 0.5);
    const pan = this.panner(w.x, w.y, w.z, hrtf);
    g.connect(lp); lp.connect(pan); pan.connect(this.mixIn);
    const rs = this.G(wet ?? clamp(0.1 + w.d / 70, 0.1, 0.65) * this.revBoost);
    lp.connect(rs); rs.connect(this.conv);
    const nodes = [g, lp, pan, rs];
    if (echo && w.d > 22) {
      const es = this.G(clamp((w.d - 22) / 110, 0, 0.5));
      lp.connect(es); es.connect(this.echoIn); nodes.push(es);
    }
    this.active++;
    this.later.push({ at: c.currentTime + dur + 1.2, fn: () => { this.active--; nodes.forEach((n) => n.disconnect()); } });
    return { input: g, pan, t: c.currentTime + 0.02 };
  }
  tone(v, t0, f0, f1, dur, vol = 0.5, type = 'sine', att = 0.008, vib = 0) {
    const c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(v.input);
    if (vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = rnd(5, 8); lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency);
      l.start(t0); l.stop(t0 + dur + 0.05);
    }
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  noiseBurst(v, t0, dur, f0, f1, vol, q = 1.5, type = 'bandpass') {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.white; s.loop = true;
    const bp = this.filt(type, f0, q), g = c.createGain();
    bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.01, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(bp); bp.connect(g); g.connect(v.input);
    s.start(t0, Math.random() * 0.8); s.stop(t0 + dur + 0.05);
  }

  // --- birds ---
  birdCall(info = {}) {
    if (!this.enabled || this.paused || !this.ctx) return;
    const env = this.envNow;
    if (!env) return;
    const act = birdAct(env.hour) * (1 - env.rain * 0.9) * (1 - env.wind * 0.3);
    if (act < 0.02) return;
    const hidden = info.x === undefined;
    const sp = info.species ?? pickOne([0, 0, 0, 1, 1, 2, 3, 3, 4, 5]);
    const far = info.far ?? Math.random();
    let w;
    if (hidden) {
      const d = rnd(12, 62) * (1 + (1 - act) * 0.8);
      w = { x: rnd(-1, 1) * d * 0.7, y: rnd(3, 14), z: -d, d };
    } else w = toWorld(info.x, info.y, true, far);
    const dur = sp === 5 ? 1.3 : sp === 3 ? 1.4 : 1.2;
    const v = this.voice(w, { gain: 0.5 + 0.5 * act, dur, echo: true });
    if (!v) return;
    const t = v.t;
    if (!hidden && info.vx) rampPos(v.pan, w.x + info.vx * 0.9 * 1.5 * (w.d / 20), w.y, w.z, t + dur);
    if (sp === 0 || sp === 4) { // warbler / sparrow
      const base = sp === 0 ? rnd(3000, 4000) : rnd(2400, 3000), n = sp === 0 ? Math.round(rnd(5, 9)) : Math.round(rnd(3, 5));
      let f = base;
      for (let i = 0; i < n; i++) {
        f = clamp(f * rnd(0.86, 1.18), base * 0.7, base * 1.3);
        const d = rnd(0.045, 0.09), t0 = t + i * rnd(0.07, 0.11);
        this.tone(v, t0, f, f * pickOne([1.22, 0.8, 1.1]), d, 0.5);
        this.tone(v, t0, f * 2, f * 2.2, d, 0.07);
      }
    } else if (sp === 1) { // fee-bee whistle
      const f = rnd(3200, 3800);
      this.tone(v, t, f, f * 0.97, 0.38, 0.45, 'sine', 0.04, 18);
      this.tone(v, t + 0.46, f * 0.82, f * 0.78, 0.5, 0.42, 'sine', 0.05, 14);
    } else if (sp === 2) { // thrush: liquid glides
      let f = rnd(2300, 3000);
      for (let i = 0; i < 4; i++) {
        const nf = clamp(f * rnd(0.75, 1.35), 1900, 3600), t0 = t + i * rnd(0.2, 0.3);
        this.tone(v, t0, f, nf, rnd(0.14, 0.26), 0.5, 'sine', 0.03, 22);
        f = nf;
      }
    } else if (sp === 3) { // dove: soft coo-COO-coo-coo
      const f = rnd(420, 520);
      [[0, 1, 0.3], [0.38, 1.18, 0.34], [0.84, 1, 0.26], [1.2, 0.96, 0.4]].forEach(([dt, m, d]) => {
        this.tone(v, t + dt, f * m * 1.08, f * m, d, 0.5, 'sine', 0.08, 4);
        this.tone(v, t + dt, f * m * 2, f * m * 2, d, 0.08, 'sine', 0.08);
      });
    } else if (sp === 5 && Math.random() < 0.5 && env.hour > 7 && env.hour < 17.5) { // distant crow
      for (let i = 0; i < 3; i++) {
        const t0 = t + i * 0.42;
        this.tone(v, t0, 420, 300, 0.26, 0.4, 'sawtooth', 0.02);
        this.noiseBurst(v, t0, 0.2, 900, 700, 0.12, 2);
      }
    } else { // woodpecker tapping
      const n = Math.round(rnd(8, 14));
      for (let i = 0; i < n; i++) this.noiseBurst(v, t + i * 0.065, 0.03, 2200, 1500, 0.3, 3);
    }
  }

  // --- frogs ---
  frogCroak(info = {}) {
    if (!this.enabled || this.paused || !this.ctx) return;
    const hidden = info.x === undefined;
    const x = hidden ? rnd(90, 440) : info.x, y = hidden ? rnd(198, 232) : info.y;
    const w = toWorld(x, y);
    const peeper = hidden && Math.random() < 0.55;
    const v = this.voice(w, { gain: peeper ? 0.45 : 0.7, dur: 1.2, hrtf: true, wet: 0.35 });
    if (!v) return;
    const t = v.t, c = this.ctx;
    if (peeper) {
      const f = rnd(2700, 3200), n = Math.round(rnd(3, 7));
      for (let i = 0; i < n; i++) this.tone(v, t + i * 0.19, f * 0.93, f * 1.06, 0.085, 0.35, 'sine', 0.01);
      return;
    }
    // ribbit: pulsed sawtooth through two formants
    const f0 = rnd(120, 165);
    [[0, 1, 0.26], [0.3, 0.84, 0.3]].forEach(([dt, m, d]) => {
      const t0 = t + dt;
      const o = c.createOscillator(), am = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * m * 1.25, t0); o.frequency.exponentialRampToValueAtTime(f0 * m * 0.9, t0 + d);
      am.gain.setValueAtTime(0.0001, t0); am.gain.linearRampToValueAtTime(0.5, t0 + 0.03); am.gain.setValueAtTime(0.5, t0 + d - 0.05); am.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      l.frequency.value = rnd(36, 46); lg.gain.value = 0.35; l.connect(lg); lg.connect(am.gain);
      const f1 = this.filt('bandpass', 420, 3), f2 = this.filt('bandpass', 1150, 4), mix = this.G(1.6), s2 = this.G(0.5);
      o.connect(am); am.connect(f1); am.connect(f2); f1.connect(mix); f2.connect(s2); s2.connect(mix); mix.connect(v.input);
      o.start(t0); l.start(t0); o.stop(t0 + d + 0.05); l.stop(t0 + d + 0.05);
    });
  }

  // --- water ---
  splash({ x, y, size = 0.7, kind = 'breach' } = {}) {
    if (!this.enabled || this.paused || !this.ctx) return;
    const w = toWorld(x, y);
    const v = this.voice(w, { gain: 1.3 * size, dur: 0.8, wet: 0.2 });
    if (!v) return;
    const t = v.t;
    if (kind === 'breach') {
      this.noiseBurst(v, t, 0.28, 2600, 900, 0.5, 1.2);
      this.tone(v, t + 0.03, 330, 150, 0.12, 0.3);
    } else {
      this.noiseBurst(v, t, 0.4, 1900, 600, 0.6, 1);
      this.tone(v, t, 220, 90, 0.16, 0.5);
      this.tone(v, t + 0.11, 360, 160, 0.1, 0.22);
    }
  }

  owl() {
    const env = this.envNow;
    if (!env) return;
    const d = rnd(40, 72);
    const w = { x: rnd(-1, 1) * d * 0.6, y: rnd(6, 14), z: -d, d };
    const v = this.voice(w, { gain: 1.5, dur: 3, echo: true, wet: 0.55 });
    if (!v) return;
    const f = rnd(300, 360), t = v.t;
    [[0, 0.34, 0.9], [0.55, 0.3, 0.85], [1.12, 0.7, 1]].forEach(([dt, d2, k]) => {
      this.tone(v, t + dt, f * 1.06, f * 0.95 * k, d2, 0.55, 'sine', 0.07, 3);
      this.tone(v, t + dt, f * 2.1, f * 1.9, d2, 0.08, 'sine', 0.07);
      this.noiseBurst(v, t + dt, d2, 700, 500, 0.05, 1.2, 'lowpass');
    });
  }

  // droplets and fire pops use cheap stereo voices
  tick(pan, f, vol, dur = 0.03) {
    const c = this.ctx, t = c.currentTime + 0.01;
    const s = c.createBufferSource(); s.buffer = this.white; s.loop = true;
    const bp = this.filt('bandpass', f, 2.5), g = c.createGain(), p = this.stereo(pan);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(p); p.connect(this.mixIn);
    s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.02);
    s.onended = () => { p.disconnect(); };
  }
  plink(pan, vol) {
    const c = this.ctx, t = c.currentTime + 0.01, o = c.createOscillator(), g = c.createGain(), p = this.stereo(pan);
    const f = rnd(700, 1900);
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.05);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(p); p.connect(this.mixIn); o.start(t); o.stop(t + 0.09); o.onended = () => p.disconnect();
  }

  // ---------- per-frame mixing ----------
  applyMaster() {
    if (!this.ctx) return;
    const v = this.muted || this.paused || !this.enabled ? 0 : Math.pow(this.volume, 1.6) * 1.15;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.12);
  }
  setVolume(v) { this.volume = v; this.applyMaster(); }
  setMuted(m) { this.muted = m; this.applyMaster(); }
  async setPaused(p) {
    this.paused = p;
    this.applyMaster();
    if (!this.ctx || !this.enabled) return;
    if (p) setTimeout(() => { if (this.paused) this.ctx.suspend(); }, 450);
    else await this.ctx.resume();
  }

  // env: { hour, wind, windT, rain, cover, mist, lights, camX, night }
  update(dt, env) {
    this.envNow = env;
    const c = this.ctx;
    if (!c || !this.enabled || this.paused || (!this.offline && c.state !== 'running')) return;
    const now = c.currentTime;
    for (let i = this.later.length - 1; i >= 0; i--) if (this.later[i].at <= now) this.later.splice(i, 1)[0].fn();
    const h = env.hour, rain = env.rain, wind = env.wind, night = env.night;
    const bAct = birdAct(h) * (1 - rain * 0.9) * (1 - wind * 0.25);
    const cAct = cricketAct(h) * (1 - rain * 0.75) * (1 - env.cover * 0.1);
    const fAct = frogAct(h, rain);
    const warm = h >= 12 ? smooth(24, 19, h) : smooth(3, 5.5, h);
    const T = (p, v, tc = 1.4) => p.setTargetAtTime(v, now, tc);

    this.setListener(env.camX * 2.5);
    // context: fog and rain muffle the air; night stretches the reverb tail
    T(this.air.frequency, 16500 - env.mist * 7500 - rain * 2600, 1.2);
    this.revBoost = (1 + night * 0.5 + env.mist * 0.3) * (1 + rain * 0.2);
    T(this.revOut.gain, 0.8 * this.revBoost, 1.5);

    // beds
    T(this.lake.gain, 0.2 + wind * 0.12 + night * 0.04 - rain * 0.04, 2);
    T(this.stream.gain, 0.42 + night * 0.1, 2);
    const g1 = wind * wind;
    T(this.windBody.gain, g1 * 0.5 + 0.015, 0.5);
    T(this.windBp.frequency, 280 + wind * 800, 0.6);
    this.windPan.pan.setTargetAtTime(Math.sin(env.windT * 0.23) * 0.65, now, 0.3);
    const foliage = 0.35 + 0.65 * (1 - night * 0.6);
    this.rustle.forEach((g) => T(g.gain, Math.pow(wind, 1.2) * 0.13 * foliage, 0.5));
    this.rainWash.forEach((g) => T(g.gain, Math.pow(rain, 1.2) * 0.14, 1.8));
    T(this.rainBody.gain, rain * 0.2, 1.8);
    const fireOn = env.lights * (1 - 0.3 * rain);
    T(this.fire.gain, fireOn * 0.09, 2);
    T(this.cricketBus.gain, cAct * 0.85, 2.5);
    for (const k of this.crickets) T(k.trill.frequency, k.base * lerp(0.8, 1.14, warm), 3);

    // event schedulers, driven by the same curves as the visuals
    const tm = this.timers;
    tm.bird -= dt;
    if (tm.bird <= 0) {
      tm.bird = rnd(0.7, 2.2) / (0.12 + bAct * 1.3);
      if (bAct > 0.03) this.birdCall({});
    }
    tm.frog -= dt;
    if (tm.frog <= 0) {
      tm.frog = rnd(1.5, 4.5) / (0.1 + fAct * 1.5);
      if (fAct > 0.04) this.frogCroak({});
    }
    tm.owl -= dt;
    if (tm.owl <= 0) {
      tm.owl = rnd(14, 34);
      if (owlAct(h) > 0.6 && rain < 0.5) this.owl();
    }
    tm.drop -= dt;
    if (rain > 0.05 && tm.drop <= 0) {
      tm.drop = 1 / (8 + rain * 26);
      const p = rnd(-0.9, 0.9);
      this.tick(p, rnd(2500, 6500), 0.05 * rain, 0.02);
      if (Math.random() < 0.3) this.plink(p, 0.022 * rain);
    }
    tm.pop -= dt;
    if (fireOn > 0.1 && tm.pop <= 0) {
      tm.pop = rnd(0.12, 0.6);
      this.tick(clamp(-0.55 + rnd(-0.1, 0.1) - env.camX * 0.2, -1, 1), rnd(1200, 4200), 0.1 * fireOn, rnd(0.015, 0.045));
    }
    tm.bubble -= dt;
    if (tm.bubble <= 0) {
      tm.bubble = 0.09;
      T(this.bubbleBp.frequency, rnd(600, 2800), 0.05);
    }

    // smoothed levels for the on-screen mix meter
    const L = this.levels, s = 1 - Math.exp(-dt * 2);
    const tgt = { birds: bAct, crickets: cAct, frogs: fAct, water: 0.55 + night * 0.1, wind: wind, rain: rain };
    for (const k in L) L[k] += (tgt[k] - L[k]) * s;
  }

  // Render a soundtrack offline. envLog: [{t, ...env}], events: [{t, type, data}] captured from the visuals.
  async renderOffline({ duration, sampleRate = 48000, envLog, events, volume = 0.8, fadeIn = 1, fadeOut = 1.4 }) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * duration), sampleRate);
    this.offline = true;
    this.build(ctx);
    this.enabled = true;
    this.paused = false;
    const v = Math.pow(volume, 1.6) * 1.15;
    this.master.gain.setValueAtTime(0, 0);
    this.master.gain.linearRampToValueAtTime(v, fadeIn);
    this.master.gain.setValueAtTime(v, duration - fadeOut);
    this.master.gain.linearRampToValueAtTime(0, duration);
    const step = 0.05;
    let li = 0, ei = 0;
    const tick = (t) => {
      while (li + 1 < envLog.length && envLog[li + 1].t <= t) li++;
      const env = envLog[li];
      this.envNow = env;
      while (ei < events.length && events[ei].t <= t) {
        const e = events[ei++];
        if (e.type === 'bird') this.birdCall(e.data);
        else if (e.type === 'frog') this.frogCroak(e.data);
        else if (e.type === 'splash') this.splash(e.data);
      }
      this.update(step, env);
    };
    tick(0);
    for (let t = step; t < duration - 0.1; t += step) ctx.suspend(t).then(() => { tick(ctx.currentTime); ctx.resume(); });
    return ctx.startRendering();
  }

  rms() {
    if (!this.analyser) return 0;
    const d = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(d);
    let s = 0;
    for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    return Math.sqrt(s / d.length);
  }
}
