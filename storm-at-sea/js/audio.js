// Fully synthesized storm soundscape (Web Audio, no samples):
// gusting wind with howl resonances, rain with individual drop transients,
// surf bed + breaking crests, hull slams, and distance-filtered thunder whose
// delay follows the speed of sound.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class StormAudio {
  constructor() {
    this.ctx = null;
    this.vol = 0.85;
    this.muted = false;
    this.gust = 0.5; this.gustTarget = 0.6; this.gustTimer = 0;
    this.crashTimer = 1.5;
    this.t = 0;
  }

  get ready() { return !!this.ctx; }

  // time base; tOffset lets an OfflineAudioContext be scheduled ahead of rendering
  now() { return this.ctx.currentTime + (this.tOffset || 0); }

  start(offlineCtx) {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = offlineCtx || new AC());
    this.tOffset = 0;
    this.sr = ctx.sampleRate;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -15; comp.knee.value = 12; comp.ratio.value = 4.5;
    comp.attack.value = 0.005; comp.release.value = 0.35;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.comp = comp;
    this.master.gain.setTargetAtTime(this.vol, ctx.currentTime + 0.1, offlineCtx ? 0.6 : 1.8);

    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(5.5);
    this.verbOut = ctx.createGain();
    this.verbOut.gain.value = 0.5;
    this.verb.connect(this.verbOut);
    this.verbOut.connect(this.master);

    this.pink = this.noise(14, 'pink');
    this.brown = this.noise(14, 'brown');
    this.white = this.noise(7, 'white');
    this.rainBuf = this.makeRain(9);

    // wind
    this.windLow = this.loop(this.brown, [this.filter('lowpass', 380, 0.5)], 0.3);
    this.windMid = this.loop(this.pink, [this.filter('bandpass', 600, 0.55)], 0.15);
    this.howl1 = this.loop(this.pink, [this.filter('bandpass', 620, 9)], 0.04);
    this.howl2 = this.loop(this.pink, [this.filter('bandpass', 1180, 14)], 0.02);
    this.whistle = this.loop(this.white, [this.filter('bandpass', 2600, 22)], 0.0);
    // rain
    this.rain = this.loop(this.rainBuf, [this.filter('highpass', 350, 0.5), this.filter('lowpass', 11000, 0.5)], 0.3);
    this.hiss = this.loop(this.white, [this.filter('bandpass', 6500, 0.4)], 0.05);
    // sea
    this.sea = this.loop(this.brown, [this.filter('lowpass', 420, 0.6)], 0.35);
    this.seaMid = this.loop(this.pink, [this.filter('bandpass', 380, 0.7)], 0.08);
    this.rogue = this.loop(this.brown, [this.filter('lowpass', 650, 0.7)], 0.0);
    // ship
    this.engine = this.loop(this.brown, [this.filter('lowpass', 85, 1.2)], 0.0);
    for (const l of [this.windLow, this.windMid, this.sea]) l.out.connect(this.verb);
  }

  filter(type, freq, Q) {
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = Q;
    return f;
  }

  loop(buf, filters, gain) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true;
    let node = s;
    for (const f of filters) { node.connect(f); node = f; }
    const g = ctx.createGain();
    g.gain.value = gain;
    node.connect(g); g.connect(this.master);
    s.start(0, Math.random() * buf.duration);
    return { src: s, filters, gain: g, out: g };
  }

  noise(sec, type) {
    const n = Math.floor(sec * this.sr), F = 4096;
    const buf = this.ctx.createBuffer(2, n, this.sr);
    for (let ch = 0; ch < 2; ch++) {
      const tmp = new Float32Array(n + F);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < n + F; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') tmp[i] = w * 0.5;
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          tmp[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { last = (last + 0.02 * w) / 1.02; tmp[i] = last * 3.5; }
      }
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = tmp[i];
      for (let i = 0; i < F; i++) { const k = i / F; d[i] = tmp[i] * k + tmp[n + i] * (1 - k); }
    }
    return buf;
  }

  makeRain(sec) {
    const n = Math.floor(sec * this.sr), F = 4096, sr = this.sr;
    const buf = this.ctx.createBuffer(2, n, sr);
    for (let ch = 0; ch < 2; ch++) {
      const tmp = new Float32Array(n + F);
      let prev = 0;
      for (let i = 0; i < n + F; i++) { const w = Math.random() * 2 - 1; tmp[i] = (w - prev) * 0.035; prev = w; }
      const drops = Math.floor(sec * 2600);
      for (let k = 0; k < drops; k++) {
        const p = Math.floor(Math.random() * (n + F - 2000));
        const amp = 0.02 + Math.pow(Math.random(), 4) * 0.5;
        const len = 20 + Math.floor(Math.random() * 220);
        if (Math.random() < 0.22) {
          // bubble "plink" of a drop entering water
          const f = 1400 + Math.random() * 3600, dec = 0.003 + Math.random() * 0.008;
          for (let i = 0; i < 1500; i++) tmp[p + i] += Math.sin((2 * Math.PI * f * i) / sr) * Math.exp(-i / sr / dec) * amp * 0.35;
        } else {
          for (let i = 0; i < len; i++) tmp[p + i] += (Math.random() * 2 - 1) * Math.exp((-i / len) * 5) * amp;
        }
      }
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = tmp[i];
      for (let i = 0; i < F; i++) { const k = i / F; d[i] = tmp[i] * k + tmp[n + i] * (1 - k); }
    }
    return buf;
  }

  impulse(sec) {
    const n = Math.floor(sec * this.sr);
    const buf = this.ctx.createBuffer(2, n, this.sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let y = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const a = 0.9 - t * 0.85; // darker as it decays
        y += ((Math.random() * 2 - 1) - y) * a;
        d[i] = y * Math.pow(1 - t, 3.2) * (i < 600 ? i / 600 : 1);
      }
    }
    return buf;
  }

  set(param, v, tc = 0.25) { param.setTargetAtTime(v, this.now(), tc); }

  setVolume(v) {
    this.vol = v;
    if (this.ctx && !this.muted) this.set(this.master.gain, v, 0.2);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) this.set(this.master.gain, this.muted ? 0 : this.vol, 0.2);
    return this.muted;
  }

  // per-frame: s = { storm, wind, rain, close (0..1 camera near water), shipNear (0..1), rogue (0..1) }
  update(dt, s) {
    if (!this.ctx) return;
    this.t += dt;
    this.gustTimer -= dt;
    if (this.gustTimer <= 0) {
      this.gustTarget = clamp(0.2 + Math.pow(Math.random(), 0.7) * 0.85, 0, 1);
      this.gustTimer = 1.2 + Math.random() * 4.5;
    }
    this.gust += (this.gustTarget - this.gust) * (1 - Math.exp(-dt / 1.1));
    const g = this.gust, W = s.wind;
    this.set(this.windLow.gain.gain, (0.22 + 0.32 * g) * W);
    this.set(this.windMid.gain.gain, (0.06 + 0.2 * g) * W);
    this.set(this.windMid.filters[0].frequency, 320 + 760 * g);
    this.set(this.howl1.gain.gain, (0.015 + 0.11 * g * g) * W);
    this.set(this.howl1.filters[0].frequency, 480 + 420 * g + Math.sin(this.t * 0.7) * 35);
    this.set(this.howl2.gain.gain, (0.006 + 0.07 * g * g * g) * W);
    this.set(this.howl2.filters[0].frequency, 1000 + 650 * g + Math.sin(this.t * 1.3) * 60);
    // rigging whistle only in the strongest gusts, close to the ship
    this.set(this.whistle.gain.gain, Math.max(0, g - 0.7) * 0.18 * W * (0.3 + s.shipNear));
    this.set(this.whistle.filters[0].frequency, 2300 + 900 * g);

    this.set(this.rain.gain.gain, 0.3 * s.rain * (0.85 + 0.25 * g));
    this.set(this.hiss.gain.gain, 0.045 * s.rain);

    this.set(this.sea.gain.gain, (0.22 + 0.4 * s.close) * s.storm);
    this.set(this.sea.filters[0].frequency, 280 + 380 * s.close);
    this.set(this.seaMid.gain.gain, (0.03 + 0.09 * s.close) * s.storm);
    this.set(this.rogue.gain.gain, s.rogue * 0.9, 0.6);
    this.set(this.rogue.filters[0].frequency, 300 + 900 * s.rogue, 0.6);
    this.set(this.engine.gain.gain, s.shipNear * 0.35, 0.5);

    this.crashTimer -= dt;
    if (this.crashTimer <= 0) {
      this.crash((0.35 + Math.random() * 0.65) * s.storm * (0.35 + 0.65 * s.close));
      this.crashTimer = 0.9 + Math.random() * 3.2 / Math.max(0.4, s.storm);
    }
  }

  burst(buf, { at = 0, chain, env, pan = 0, verb = 0.3, dur = 4 }) {
    const ctx = this.ctx, t0 = this.now() + at;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    let node = src;
    for (const f of chain) { node.connect(f); node = f; }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    env(g.gain, t0);
    const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    node.connect(g);
    if (p) { p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(this.master); if (verb) { const v = ctx.createGain(); v.gain.value = verb; p.connect(v); v.connect(this.verb); } }
    else g.connect(this.master);
    src.start(t0, Math.random() * Math.max(0, buf.duration - dur - 0.1));
    src.stop(t0 + dur);
    return t0;
  }

  // a crest collapsing somewhere nearby
  crash(I) {
    if (!this.ctx || I < 0.05) return;
    const bp = this.filter('bandpass', 1500, 0.6);
    const t = this.now();
    bp.frequency.setValueAtTime(900 + Math.random() * 1200, t);
    bp.frequency.exponentialRampToValueAtTime(260 + Math.random() * 150, t + 3.2);
    const dur = 4.5;
    this.burst(this.pink, {
      chain: [bp, this.filter('lowpass', 3200, 0.5)], pan: (Math.random() - 0.5) * 1.6, verb: 0.35, dur,
      env: (gp, t0) => {
        const rise = 0.35 + Math.random() * 0.5;
        gp.linearRampToValueAtTime(I * 0.42, t0 + rise);
        gp.setTargetAtTime(0, t0 + rise, 0.9 + Math.random() * 0.6);
      },
    });
  }

  // bow slamming into a sea: low hull boom + sheet of water + falling spray
  slam(I, att = 1, pan = 0) {
    if (!this.ctx) return;
    const A = I * att;
    if (A < 0.03) return;
    this.burst(this.brown, {
      chain: [this.filter('lowpass', 120, 1.2)], pan, verb: 0.5, dur: 2.5,
      env: (gp, t0) => { gp.linearRampToValueAtTime(A * 1.6, t0 + 0.025); gp.setTargetAtTime(0, t0 + 0.03, 0.35); },
    });
    this.burst(this.pink, {
      chain: [this.filter('bandpass', 700, 0.5)], pan, verb: 0.4, dur: 3,
      env: (gp, t0) => { gp.linearRampToValueAtTime(A * 0.7, t0 + 0.06); gp.setTargetAtTime(0, t0 + 0.1, 0.55); },
    });
    this.burst(this.white, {
      at: 0.35, chain: [this.filter('highpass', 2200, 0.5), this.filter('lowpass', 9000, 0.5)], pan: pan * 0.7, verb: 0.3, dur: 3.2,
      env: (gp, t0) => { gp.linearRampToValueAtTime(A * 0.28, t0 + 0.35); gp.setTargetAtTime(0, t0 + 0.4, 0.8); },
    });
  }

  // Ship's whistle: two detuned brass-like reed tones a fifth apart, held while pressed.
  hornStart(base = 70, gain = 0.55, pan = 0, lp = 1100) {
    if (!this.ctx || this.horn) return;
    const ctx = this.ctx, t0 = this.now();
    const out = ctx.createGain(); out.gain.value = 0;
    const filt = this.filter('lowpass', lp, 1.2);
    const peak = this.filter('peaking', base * 4, 2); peak.gain.value = 6;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    filt.connect(peak); peak.connect(out); out.connect(p); p.connect(this.master);
    const v = ctx.createGain(); v.gain.value = 0.8; p.connect(v); v.connect(this.verb);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 4.6;
    const lfoG = ctx.createGain(); lfoG.gain.value = base * 0.006; lfo.connect(lfoG);
    const oscs = [];
    for (const [mul, det, g] of [[1, -4, 0.5], [1, 5, 0.5], [1.5, 3, 0.32], [2, -2, 0.14]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = base * mul; o.detune.value = det;
      lfoG.connect(o.frequency);
      const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(filt);
      o.start(t0); oscs.push(o);
    }
    lfo.start(t0);
    out.gain.setValueAtTime(0, t0);
    out.gain.linearRampToValueAtTime(gain * 0.6, t0 + 0.08);
    out.gain.linearRampToValueAtTime(gain, t0 + 0.35);
    this.horn = { out, oscs, lfo };
  }

  hornStop() {
    if (!this.horn) return;
    const { out, oscs, lfo } = this.horn, t = this.now();
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);
    for (const o of [...oscs, lfo]) o.stop(t + 1.0);
    this.horn = null;
  }

  // a distant ship answering: lower, quieter, muffled by distance
  hornReply(delay, dur, dist, pan) {
    if (!this.ctx) return;
    setTimeout(() => {
      const keep = this.horn;
      this.horn = null;
      this.hornStart(62 + Math.random() * 10, Math.min(0.4, 220 / dist), pan, Math.max(260, 1400 - dist * 0.6));
      const mine = this.horn;
      this.horn = keep;
      setTimeout(() => { const k2 = this.horn; this.horn = mine; this.hornStop(); this.horn = k2; }, dur * 1000);
    }, delay * 1000);
  }

  makeThunder(dist, cloud) {
    const sr = this.sr;
    const dur = Math.min(11, 4.5 + dist / 900);
    const n = Math.floor(dur * sr);
    const buf = this.ctx.createBuffer(2, n, sr);
    const close = cloud ? 0 : clamp(1 - (dist - 220) / 1600, 0, 1);
    const env = new Float32Array(n), crk = new Float32Array(n);
    const peaks = 5 + Math.floor(Math.random() * 8);
    for (let p = 0; p < peaks; p++) {
      const tc = 0.05 + Math.pow(Math.random(), 1.4) * dur * 0.55;
      const a = (0.35 + Math.random() * 0.65) * Math.exp(-tc / (dur * 0.5));
      const rise = 0.04 + Math.random() * 0.25, fall = 0.25 + Math.random() * 1.3;
      const i0 = Math.max(0, Math.floor((tc - rise * 3) * sr)), i1 = Math.min(n, Math.floor((tc + fall * 5) * sr));
      for (let i = i0; i < i1; i++) {
        const t = i / sr;
        env[i] += a * (t < tc ? Math.exp(-(((tc - t) / rise) ** 2)) : Math.exp(-(t - tc) / fall));
      }
    }
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      env[i] += 0.25 * Math.exp(-t / (dur * 0.3)) * Math.min(1, t / 0.4);
      if (close > 0 && t < 1.5) crk[i] = close * (Math.exp(-t / 0.07) + 0.45 * Math.exp(-Math.max(0, t - 0.1) / 0.3) * (t > 0.1 ? 1 : 0));
    }
    let peak = 0;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let br = 0, br2 = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        br = (br + 0.02 * w) / 1.02;
        br2 = (br2 + 0.08 * w) / 1.08;
        // crackle: sparse impulsive bursts riding on the rumble
        const spike = Math.random() < 0.002 * (1 + close * 4) ? (Math.random() * 2 - 1) * 2 : 0;
        d[i] = env[i] * (br * 3.6 + br2 * close * 0.8) + crk[i] * (w * 0.7 + spike) + env[i] * spike * close * 0.4;
        peak = Math.max(peak, Math.abs(d[i]));
      }
    }
    const k = 0.95 / (peak || 1);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) d[i] *= k; }
    return { buf, dur };
  }

  thunder(dist, pan = 0, cloud = false) {
    if (!this.ctx) return;
    const { buf, dur } = this.makeThunder(dist, cloud);
    const delay = Math.min(8, 0.08 + dist / 480);
    const cutoff = cloud ? 260 + Math.random() * 200 : clamp(5200 - dist * 1.1, 240, 5200);
    const gain = (cloud ? 0.35 : 1.25) * clamp(1500 / dist, 0.16, 1.0);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const lp = this.filter('lowpass', cutoff, 0.6), hp = this.filter('highpass', 22, 0.7);
    const g = this.ctx.createGain(); g.gain.value = gain;
    const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -0.9, 0.9);
    const v = this.ctx.createGain(); v.gain.value = 0.55;
    src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(p); p.connect(this.master); p.connect(v); v.connect(this.verb);
    src.start(this.now() + delay);
    src.stop(this.now() + delay + dur + 0.1);
    return delay;
  }
}
