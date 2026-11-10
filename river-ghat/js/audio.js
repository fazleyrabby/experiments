// Synthesised soundscape: the river, lapping at the steps, the dawn chorus, crows, a rooster across the water,
// the launch's horn, oars, splashes, wet cloth on stone and tea glasses. No samples.

const tick = () => new Promise((r) => setTimeout(r, 0));

function noiseBuffer(ctx, seconds, kind, channels = 1) {
  const sr = ctx.sampleRate;
  const n = Math.floor(seconds * sr);
  const fade = Math.floor(sr * 0.25);
  const buf = ctx.createBuffer(channels, n, sr);
  for (let ch = 0; ch < channels; ch++) {
    const tmp = new Float32Array(n + fade);
    if (kind === 'white') for (let i = 0; i < tmp.length; i++) tmp[i] = Math.random() * 2 - 1;
    else if (kind === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < tmp.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        tmp[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < tmp.length; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        tmp[i] = last * 3.5;
      }
    }
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = tmp[i];
    for (let i = 0; i < fade; i++) {
      const k = i / fade;
      d[i] = tmp[i] * k + tmp[n + i] * (1 - k);
    }
  }
  return buf;
}

function impulse(ctx, seconds) {
  const sr = ctx.sampleRate;
  const n = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      lp += ((Math.random() * 2 - 1) * Math.pow(1 - t, 3) - lp) * (0.6 - 0.45 * t);
      d[i] = lp * (i < 200 ? i / 200 : 1);
    }
  }
  return buf;
}

const panOf = (x) => Math.max(-1, Math.min(1, (x / 480) * 2 - 1));

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.starting = false;
    this.muted = false;
    this.lv = { master: 0.8, water: 1, village: 1, birds: 1 };
    this.lapT = 0.5;
    this.chirpT = 1;
    this.roosterT = 6;
  }

  async start(onProgress = () => {}, offlineSeconds = 0) {
    let ctx;
    if (offlineSeconds) {
      ctx = this.ctx = new OfflineAudioContext(2, Math.ceil(offlineSeconds * 48000), 48000);
      this.offline = true;
      this.clock = 0;
    } else {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = this.ctx = new AC();
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    }
    onProgress(0.1, 'water');
    await tick();
    this.white = noiseBuffer(ctx, 3, 'white');
    onProgress(0.35, 'water');
    await tick();
    this.pink = noiseBuffer(ctx, 8, 'pink', 2);
    onProgress(0.65, 'birds');
    await tick();
    this.brown = noiseBuffer(ctx, 6, 'brown', 2);
    onProgress(0.85, 'birds');
    await tick();

    const G = (v) => {
      const g = ctx.createGain();
      g.gain.value = v;
      return g;
    };
    const F = (type, f, q = 0.7) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = f;
      b.Q.value = q;
      return b;
    };
    const loop = (buf, off = 0) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, off);
      return s;
    };
    this.G = G;
    this.F = F;

    this.out = G(0);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.out.connect(comp).connect(ctx.destination);
    const rev = ctx.createConvolver();
    rev.buffer = impulse(ctx, 3.4);
    rev.connect(G(0.8)).connect(this.out);

    this.bus = {};
    for (const k of ['water', 'village', 'birds']) {
      const dry = G(1),
        wet = G(1);
      dry.connect(this.out);
      wet.connect(rev);
      this.bus[k] = { dry, wet };
    }
    // the broad river
    this.riverG = G(0.12);
    loop(this.brown).connect(F('lowpass', 380)).connect(this.riverG).connect(this.bus.water.dry);
    this.flowG = G(0.03);
    loop(this.pink, 2).connect(F('bandpass', 900, 0.6)).connect(this.flowG).connect(this.bus.water.dry);
    // morning air
    this.airG = G(0.015);
    loop(this.pink, 5).connect(F('highpass', 3000)).connect(this.airG).connect(this.bus.birds.dry);

    this.ready = true;
    if (this.offline) this.out.gain.value = this.lv.master * 0.9;
    else this._applyMaster(1.2);
    onProgress(1, 'birds');
  }

  _now() {
    return this.offline ? this.clock : this.ctx.currentTime;
  }
  renderOffline() {
    return this.ctx.startRendering();
  }
  _applyMaster(tc = 0.08) {
    if (!this.ready) return;
    this.out.gain.setTargetAtTime(this.muted ? 0 : this.lv.master * 0.9, this._now(), tc);
  }
  setMuted(m) {
    this.muted = m;
    this._applyMaster();
  }
  setPaused(p) {
    if (!this.ready || this.offline) return;
    if (p) this.ctx.suspend();
    else this.ctx.resume();
  }
  setLevel(k, v) {
    this.lv[k] = v;
    if (!this.ready) return;
    if (k === 'master') return this._applyMaster();
    const b = this.bus[k];
    if (!b) return;
    b.dry.gain.setTargetAtTime(v, this._now(), 0.08);
    b.wet.gain.setTargetAtTime(v, this._now(), 0.08);
  }

  // one shot through a filter into a bus
  _noise(buf, at, dur, peak, filt, freq, q, panV, bus, wet = 0.3, attack = 0.005) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = buf;
    const f = this.F(filt, freq, q);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = panV;
    s.connect(f).connect(g).connect(p);
    p.connect(this.bus[bus].dry);
    if (wet) p.connect(this.G(wet)).connect(this.bus[bus].wet);
    s.start(at, Math.random() * 2, dur + 0.05);
    return f;
  }
  _osc(type, at, dur, f0, f1, peak, panV, bus, wet = 0.4, filt = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + Math.min(0.02, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = panV;
    let n = o;
    if (filt) n = n.connect(filt);
    n.connect(g).connect(p);
    p.connect(this.bus[bus].dry);
    if (wet) p.connect(this.G(wet)).connect(this.bus[bus].wet);
    o.start(at);
    o.stop(at + dur + 0.05);
    return o;
  }

  // s: { hour, day, night, dawn }
  update(dt, s) {
    if (!this.ready || (!this.offline && this.ctx.state !== 'running')) return;
    const now = this._now();
    this.riverG.gain.setTargetAtTime(0.1 + 0.03 * Math.sin(now * 0.3), now, 0.5);
    this.airG.gain.setTargetAtTime(0.008 + 0.012 * s.day, now, 1);
    // water lapping at the steps
    this.lapT -= dt;
    if (this.lapT <= 0) {
      this.lapT = 0.5 + Math.random() * 1.6;
      const at = now + 0.02;
      const f = this._noise(this.brown, at, 0.5 + Math.random() * 0.3, 0.16 + Math.random() * 0.1, 'bandpass', 320 + Math.random() * 260, 1.4, -0.35 + Math.random() * 0.3, 'water', 0.15, 0.12);
      f.frequency.setValueAtTime(f.frequency.value, at);
      f.frequency.exponentialRampToValueAtTime(f.frequency.value * 1.6, at + 0.4);
    }
    // dawn chorus: busiest around sunrise
    const chorus = Math.exp(-Math.pow((s.hour - 6.1) / 0.9, 2)) * 0.85 + 0.25 * s.day + 0.08;
    this.chirpT -= dt * chorus;
    if (this.chirpT <= 0) {
      this.chirpT = 0.5 + Math.random() * 1.8;
      Math.random() < 0.35 ? this._robin(now) : this._chirps(now);
    }
    // a rooster across the river
    this.roosterT -= dt;
    if (this.roosterT <= 0) {
      this.roosterT = 26 + Math.random() * 30;
      if (s.hour > 5.1 && s.hour < 7.4) this._rooster(now + 0.1);
    }
  }

  _chirps(now) {
    const panV = Math.random() * 1.6 - 0.8;
    const base = 3200 + Math.random() * 2200;
    const n = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const at = now + 0.05 + i * (0.09 + Math.random() * 0.05);
      this._osc('sine', at, 0.06 + Math.random() * 0.04, base * (1 + Math.random() * 0.15), base * (0.7 + Math.random() * 0.2), 0.018, panV, 'birds', 0.5);
    }
  }
  // magpie-robin style whistled phrase
  _robin(now) {
    const panV = -0.6 + Math.random() * 0.5;
    let at = now + 0.05;
    const notes = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < notes; i++) {
      const f0 = 1800 + Math.random() * 1600,
        f1 = f0 * (0.75 + Math.random() * 0.6),
        d = 0.08 + Math.random() * 0.18;
      this._osc('sine', at, d, f0, f1, 0.03, panV, 'birds', 0.55);
      at += d + 0.03 + Math.random() * 0.08;
    }
  }
  _rooster(at) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f = 520;
    const seg = [[0, f * 0.9], [0.18, f * 1.05], [0.36, f * 1.0], [0.55, f * 1.25], [1.2, f * 1.15], [1.45, f * 0.8]];
    o.frequency.setValueAtTime(seg[0][1], at);
    for (const [t, v] of seg.slice(1)) o.frequency.linearRampToValueAtTime(v, at + t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    for (const [t, v] of [[0.02, 0.05], [0.16, 0.012], [0.2, 0.05], [0.34, 0.012], [0.38, 0.05], [0.53, 0.015], [0.6, 0.06], [1.3, 0.05], [1.5, 0]]) g.gain.linearRampToValueAtTime(v, at + t);
    const bp = this.F('bandpass', 1400, 1.4);
    const lp = this.F('lowpass', 2600);
    const p = ctx.createStereoPanner();
    p.pan.value = 0.55;
    o.connect(bp).connect(lp).connect(g).connect(p);
    p.connect(this.G(0.35)).connect(this.bus.village.dry);
    p.connect(this.bus.village.wet);
    o.start(at);
    o.stop(at + 1.6);
  }

  // ---- event sounds
  caw(x = 200, n = 2) {
    if (!this.ready) return;
    const now = this._now();
    for (let i = 0; i < n; i++) {
      const at = now + 0.03 + i * (0.32 + Math.random() * 0.08);
      const bp = this.F('bandpass', 1300, 2.2);
      this._osc('sawtooth', at, 0.24, 640, 470, 0.09, panOf(x), 'birds', 0.25, bp);
      this._noise(this.white, at, 0.2, 0.025, 'bandpass', 1800, 2, panOf(x), 'birds', 0.1, 0.02);
    }
  }
  horn(x = 240) {
    if (!this.ready) return;
    const ctx = this.ctx,
      at = this._now() + 0.05;
    const p = ctx.createStereoPanner();
    p.pan.value = panOf(x) * 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.12, at + 0.12);
    g.gain.setValueAtTime(0.12, at + 1.7);
    g.gain.linearRampToValueAtTime(0, at + 2.2);
    const lp = this.F('lowpass', 780);
    lp.connect(g).connect(p);
    p.connect(this.G(0.45)).connect(this.bus.village.dry);
    p.connect(this.G(1.3)).connect(this.bus.village.wet);
    for (const [f, a] of [[146, 1], [220, 0.7], [293, 0.25]]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(this.G(a)).connect(lp);
      o.start(at);
      o.stop(at + 2.3);
    }
  }
  oar(x = 240) {
    if (!this.ready) return;
    const at = this._now() + 0.02;
    const f = this._noise(this.white, at, 0.45, 0.05, 'bandpass', 700, 1.1, panOf(x), 'water', 0.2, 0.08);
    f.frequency.setValueAtTime(600, at);
    f.frequency.exponentialRampToValueAtTime(1600, at + 0.35);
    this._noise(this.brown, at + 0.05, 0.3, 0.08, 'lowpass', 300, 0.7, panOf(x), 'water', 0.1, 0.03);
  }
  splash(x = 206, power = 1) {
    if (!this.ready) return;
    const at = this._now() + 0.01;
    this._noise(this.brown, at, 0.5, 0.5 * power, 'lowpass', 500, 0.8, panOf(x), 'water', 0.25, 0.006);
    this._noise(this.white, at, 0.9, 0.12 * power, 'bandpass', 2400, 0.7, panOf(x), 'water', 0.35, 0.01);
    for (let i = 0; i < 7; i++) this._noise(this.white, at + 0.25 + Math.random() * 0.7, 0.05, 0.03, 'bandpass', 2000 + Math.random() * 3000, 3, panOf(x), 'water', 0.2, 0.002);
  }
  net(x = 330) {
    if (!this.ready) return;
    const at = this._now() + 0.01;
    this._noise(this.white, at, 0.6, 0.05, 'highpass', 2500, 0.7, panOf(x) * 0.8, 'water', 0.4, 0.03);
    this._noise(this.brown, at, 0.3, 0.1, 'lowpass', 600, 0.7, panOf(x) * 0.8, 'water', 0.3, 0.01);
  }
  slap(x = 180) {
    if (!this.ready) return;
    const at = this._now() + 0.01;
    this._noise(this.white, at, 0.09, 0.22, 'bandpass', 950, 0.9, panOf(x), 'village', 0.35, 0.002);
    this._noise(this.brown, at, 0.14, 0.25, 'lowpass', 260, 0.7, panOf(x), 'village', 0.2, 0.003);
  }
  clink() {
    if (!this.ready) return;
    const at = this._now() + 0.01;
    const f = 3000 + Math.random() * 800;
    this._osc('sine', at, 0.25, f, f, 0.02, -0.8, 'village', 0.2);
    this._osc('sine', at, 0.18, f * 1.52, f * 1.52, 0.012, -0.8, 'village', 0.2);
  }
}
