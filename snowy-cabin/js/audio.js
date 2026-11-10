// Fully synthesised soundscape: wind in the pines, falling snow, a fire heard through log walls,
// an owl, a far-off wolf, snow thumping off boughs. No samples.

const tick = () => new Promise((r) => setTimeout(r, 0));

function noiseBuffer(ctx, seconds, kind, channels = 1) {
  const sr = ctx.sampleRate;
  const n = Math.floor(seconds * sr);
  const fade = Math.floor(sr * 0.25);
  const buf = ctx.createBuffer(channels, n, sr);
  for (let ch = 0; ch < channels; ch++) {
    const tmp = new Float32Array(n + fade);
    if (kind === 'white') {
      for (let i = 0; i < tmp.length; i++) tmp[i] = Math.random() * 2 - 1;
    } else if (kind === 'pink') {
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
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
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        tmp[i] = last * 3.5;
      }
    }
    // crossfade the tail into the head so the loop has no seam
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
      const w = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2);
      lp += (w - lp) * (0.55 - 0.4 * t);
      d[i] = lp * (i < 200 ? i / 200 : 1);
    }
  }
  return buf;
}

export class AudioEngine {
  constructor() {
    this.ready = false;
    this.starting = false;
    this.muted = false;
    this.lv = { master: 0.8, wind: 1, fire: 1, life: 1 };
    this.crackT = 0.3;
    this.wolfT = 50;
    this.fireFl = 0;
  }

  // offlineSeconds: render into an OfflineAudioContext instead (for video capture);
  // drive it by setting this.clock before each update, then call renderOffline().
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
    onProgress(0.08, 'wind');
    await tick();
    this.white = noiseBuffer(ctx, 3, 'white');
    onProgress(0.3, 'wind');
    await tick();
    this.pink = noiseBuffer(ctx, 9, 'pink', 2);
    onProgress(0.6, 'fire');
    await tick();
    this.brown = noiseBuffer(ctx, 6, 'brown');
    onProgress(0.82, 'fire');
    await tick();

    this.out = ctx.createGain();
    this.out.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    this.out.connect(comp).connect(ctx.destination);

    const rev = ctx.createConvolver();
    rev.buffer = impulse(ctx, 3.2);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.9;
    rev.connect(revOut).connect(this.out);
    this.rev = rev;

    const loop = (buf, off = 0) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start(0, off);
      return s;
    };
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
    const pan = (v) => {
      const p = ctx.createStereoPanner();
      p.pan.value = v;
      return p;
    };

    // ---- wind
    this.windBus = G(1);
    this.windBus.connect(this.out);
    this.windBP = F('bandpass', 420, 0.55);
    this.windG = G(0);
    loop(this.pink).connect(this.windBP).connect(this.windG).connect(this.windBus);
    this.pineBP = F('bandpass', 1900, 0.9); // needles hissing
    this.pineG = G(0);
    loop(this.pink, 3.1).connect(this.pineBP).connect(this.pineG).connect(this.windBus);
    this.whisBP = F('bandpass', 1500, 11);
    this.whisG = G(0);
    loop(this.white, 1).connect(this.whisBP).connect(this.whisG).connect(pan(0.35)).connect(this.windBus);
    this.rumG = G(0);
    loop(this.brown).connect(F('lowpass', 130)).connect(this.rumG).connect(this.windBus);
    this.hushG = G(0);
    loop(this.white, 2).connect(F('highpass', 6500)).connect(this.hushG).connect(this.windBus);

    // ---- fire, muffled by the cabin walls
    this.fireBus = G(1);
    this.fireLP = F('lowpass', 1500, 0.5);
    this.fireBus.connect(this.fireLP).connect(pan(-0.18)).connect(this.out);
    this.roarG = G(0.1);
    loop(this.brown, 2.4).connect(F('bandpass', 150, 0.6)).connect(this.roarG).connect(this.fireBus);

    // ---- creatures and one-shots
    this.lifeBus = G(1);
    this.lifeBus.connect(this.out);
    this.lifeRev = G(1);
    this.lifeRev.connect(this.rev);

    this.ready = true;
    if (this.offline) this.out.gain.value = this.lv.master * 0.9;
    else this._applyMaster(1.2);
    onProgress(1, 'fire');
  }

  _now() {
    return this.offline ? this.clock : this.ctx.currentTime;
  }
  renderOffline() {
    return this.ctx.startRendering();
  }

  _applyMaster(tc = 0.08) {
    if (!this.ready) return;
    const v = this.muted ? 0 : this.lv.master * 0.9;
    this.out.gain.setTargetAtTime(v, this._now(), tc);
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
    const now = this._now();
    if (k === 'master') this._applyMaster();
    else if (k === 'wind') this.windBus.gain.setTargetAtTime(v, now, 0.08);
    else if (k === 'fire') this.fireBus.gain.setTargetAtTime(v, now, 0.08);
    else if (k === 'life') {
      this.lifeBus.gain.setTargetAtTime(v, now, 0.08);
      this.lifeRev.gain.setTargetAtTime(v, now, 0.08);
    }
  }

  // s: { snow, wind (0..1 incl. gusts), t }
  update(dt, s) {
    if (!this.ready || (!this.offline && this.ctx.state !== 'running')) return;
    const now = this._now();
    const w = s.wind;
    this.windG.gain.setTargetAtTime(0.05 + 0.75 * Math.pow(w, 1.4), now, 0.35);
    this.windBP.frequency.setTargetAtTime(280 + 620 * w, now, 0.5);
    this.pineG.gain.setTargetAtTime(0.012 + 0.2 * Math.pow(w, 1.3), now, 0.3);
    this.pineBP.frequency.setTargetAtTime(1500 + 1400 * w, now, 0.5);
    const wh = Math.max(0, w - 0.45);
    this.whisG.gain.setTargetAtTime(wh * wh * 1.1, now, 0.4);
    this.whisBP.frequency.setTargetAtTime(1100 + 900 * w + 260 * Math.sin(s.t * 0.7) + 140 * Math.sin(s.t * 1.9), now, 0.25);
    this.rumG.gain.setTargetAtTime(0.03 + 0.5 * w * w, now, 0.5);
    this.hushG.gain.setTargetAtTime(0.002 + 0.016 * s.snow, now, 0.6);

    // fire
    this.fireFl += (Math.random() - 0.5) * dt * 3;
    this.fireFl *= 1 - dt * 1.5;
    this.roarG.gain.setTargetAtTime(0.085 + this.fireFl * 0.05, now, 0.15);
    this.crackT -= dt;
    let guard = 0;
    while (this.crackT <= 0 && guard++ < 6) {
      this._crackle(now + Math.random() * 0.03);
      this.crackT += Math.random() < 0.3 ? 0.015 + Math.random() * 0.05 : -Math.log(1 - Math.random() * 0.999) * 0.2;
    }

    // a wolf, far away, on quiet nights
    this.wolfT -= dt;
    if (this.wolfT <= 0) {
      this.wolfT = 80 + Math.random() * 120;
      if (w < 0.4) this._wolf();
    }
  }

  _crackle(at) {
    const ctx = this.ctx;
    const pw = Math.pow(Math.random(), 3.2);
    const dur = 0.004 + Math.random() * 0.02 + pw * 0.03;
    const s = ctx.createBufferSource();
    s.buffer = this.white;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700 + Math.random() * 3200;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    const peak = 0.05 + pw * 0.75;
    g.gain.setValueAtTime(peak, at);
    g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
    s.connect(bp).connect(g).connect(this.fireBus);
    s.start(at, Math.random() * 2.5, dur + 0.02);
  }

  _tone(f0, f1, at, dur, peak, panV, wet = 0.5, type = 'sine') {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    o.frequency.linearRampToValueAtTime(f1, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + Math.min(0.06, dur * 0.3));
    g.gain.setValueAtTime(peak, at + dur * 0.55);
    g.gain.linearRampToValueAtTime(0, at + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1000;
    const p = ctx.createStereoPanner();
    p.pan.value = panV;
    const send = ctx.createGain();
    send.gain.value = wet;
    o.connect(g).connect(lp).connect(p);
    p.connect(this.lifeBus);
    p.connect(send).connect(this.lifeRev);
    o.start(at);
    o.stop(at + dur + 0.05);
    return o;
  }

  hoot(x = 40) {
    if (!this.ready) return;
    const at = this._now() + 0.05;
    const panV = (x / 480) * 2 - 1;
    const f = 318 + Math.random() * 22;
    const pat = [
      [0, 0.36, 1],
      [0.54, 0.16, 0.7],
      [0.76, 0.34, 1],
      [1.42, 0.4, 0.9],
      [2.06, 0.5, 0.8],
    ];
    for (const [t, d, a] of pat) {
      this._tone(f * 1.06, f * 0.95, at + t, d, 0.2 * a, panV * 0.8, 0.55);
      this._tone(f * 2.12, f * 1.9, at + t, d, 0.022 * a, panV * 0.8, 0.5);
    }
  }

  _wolf() {
    const ctx = this.ctx;
    const at = this._now() + 0.1;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    const base = 270 + Math.random() * 40;
    o.frequency.setValueAtTime(base, at);
    o.frequency.exponentialRampToValueAtTime(base * 1.78, at + 0.9);
    o.frequency.setValueAtTime(base * 1.78, at + 2.6);
    o.frequency.exponentialRampToValueAtTime(base * 1.3, at + 4.2);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vg = ctx.createGain();
    vg.gain.value = 5;
    vib.connect(vg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.05, at + 0.7);
    g.gain.setValueAtTime(0.05, at + 2.4);
    g.gain.linearRampToValueAtTime(0, at + 4.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 620;
    bp.Q.value = 1.1;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.4 - 0.7;
    const dry = ctx.createGain();
    dry.gain.value = 0.25;
    o.connect(g).connect(bp).connect(p);
    p.connect(dry).connect(this.lifeBus);
    p.connect(this.lifeRev);
    o.start(at);
    vib.start(at);
    o.stop(at + 4.5);
    vib.stop(at + 4.5);
  }

  // snow sliding off a bough and landing
  thump(x = 240, power = 1) {
    if (!this.ready) return;
    const ctx = this.ctx,
      at = this._now() + 0.01;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, (x / 480) * 2 - 1)) * 0.8;
    p.connect(this.lifeBus);
    const s = ctx.createBufferSource();
    s.buffer = this.brown;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 240;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.6 * power, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.26);
    s.connect(lp).connect(g).connect(p);
    s.start(at, Math.random() * 4, 0.3);
    const h = ctx.createBufferSource();
    h.buffer = this.white;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2800;
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0, at);
    hg.gain.linearRampToValueAtTime(0.03 * power, at + 0.03);
    hg.gain.exponentialRampToValueAtTime(0.0005, at + 0.45);
    h.connect(hp).connect(hg).connect(p);
    h.start(at, Math.random() * 2, 0.5);
  }

  // a hoof pressing into crusted snow
  crunch(x = 350) {
    if (!this.ready) return;
    const ctx = this.ctx,
      at = this._now() + 0.01;
    const s = ctx.createBufferSource();
    s.buffer = this.white;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1700 + Math.random() * 900;
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.022, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, at + 0.07);
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, (x / 480) * 2 - 1)) * 0.7;
    s.connect(bp).connect(g).connect(p).connect(this.lifeBus);
    s.start(at, Math.random() * 2.5, 0.09);
  }
}
