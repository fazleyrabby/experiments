// Sound. The engine is a real recording: assets/engine.wav is "Racing car engine
// sound loops" (loop_0) by domasx2, CC0, https://opengameart.org/content/racing-car-engine-sound-loops
// (cut from a public-domain pdsounds.org recording), the same loop the Desert Huracán uses.
// It is re-pitched through a pretend 4-speed box for the player and played quieter for
// each rival by distance. Die-cast hits are modal syntheses of a small zinc casting
// (a few inharmonic partials with fast decays); hard plastic wheels on plastic track
// are band-passed noise. Audio starts on the first key press or click.
const GEARS = [0, 18, 33, 47, 60, 76];

export class Sound {
  constructor() { this.ctx = null; this.on = true; this.buffer = null; this.voices = []; }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = this.on ? 0.85 : 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.stream = ctx.createMediaStreamDestination();
    comp.connect(this.stream);
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const bed = (type, f, q) => {
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(fl).connect(g).connect(this.master); s.start();
      return { f: fl, g };
    };
    this.roll = bed('bandpass', 2400, 0.9);
    this.scrape = bed('bandpass', 3800, 5);
    this.room = bed('lowpass', 300, 0.4); this.room.g.gain.value = 0.012;
    fetch('assets/engine.wav').then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((ab) => ctx.decodeAudioData(ab)).then((b) => { this.buffer = b; this.buildVoices(); }).catch(() => {});
  }

  buildVoices() {
    const ctx = this.ctx;
    this.engBus = ctx.createBiquadFilter(); this.engBus.type = 'lowpass'; this.engBus.frequency.value = 2400;
    this.engBus.connect(this.master);
    const mk = () => {
      const s = ctx.createBufferSource(); s.buffer = this.buffer; s.loop = true;
      const g = ctx.createGain(); g.gain.value = 0;
      const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (p) s.connect(g).connect(p).connect(this.engBus); else s.connect(g).connect(this.engBus);
      s.start(0, Math.random() * this.buffer.duration);
      return { s, g, p };
    };
    this.player = [mk(), mk()];
    this.rivals = [mk(), mk(), mk()];
  }

  setOn(on) { this.on = on; if (this.master) this.master.gain.setTargetAtTime(on ? 0.85 : 0, this.ctx.currentTime, 0.05); }

  rpm(u) {
    let g = 1; while (g < GEARS.length - 1 && u > GEARS[g]) g++;
    const lo = GEARS[g - 1], hi = GEARS[g];
    return { gear: g, rpm: 0.28 + 0.72 * Math.max(0, Math.min(1, (u - lo) / (hi - lo))) };
  }

  update(dt, player, rivals, listener, timeScale) {
    if (!this.ctx || !this.player) return;
    const t = this.ctx.currentTime, k = 0.06;
    const ts = Math.max(0.25, timeScale);
    if (player) {
      const b = player.body, u = Math.abs(b.u || b.speed);
      const { rpm } = this.rpm(u);
      const thr = b.input.throttle;
      const rate = (0.62 + rpm * 1.05) * (0.7 + 0.3 * ts);
      this.player[0].s.playbackRate.setTargetAtTime(rate, t, k);
      this.player[1].s.playbackRate.setTargetAtTime(rate * 1.5, t, k);
      this.player[0].g.gain.setTargetAtTime(0.28 + thr * 0.22, t, k);
      this.player[1].g.gain.setTargetAtTime(0.05 + thr * 0.13 * rpm, t, k);
      this.engBus.frequency.setTargetAtTime(900 + thr * 2600, t, 0.08);
      const ground = b.air || b.crashed > 0 ? 0 : 1;
      this.roll.g.gain.setTargetAtTime(Math.min(0.14, u / 550) * ground, t, 0.05);
      this.roll.f.frequency.setTargetAtTime(1200 + u * 36, t, 0.05);
      this.scrape.g.gain.setTargetAtTime(Math.min(0.12, b.wallScrape * 0.4) + Math.min(0.06, b.slip * 0.25) * ground, t, 0.03);
      b.wallScrape *= Math.exp(-dt * 8);
    }
    rivals.forEach((r, i) => {
      const v = this.rivals[i]; if (!v) return;
      const b = r.body, u = Math.abs(b.u || b.speed);
      const dist = listener.distanceTo(b.pos);
      const { rpm } = this.rpm(u);
      v.s.playbackRate.setTargetAtTime((0.66 + rpm * 1.0) * (1 + i * 0.04) * (0.7 + 0.3 * ts), t, k);
      v.g.gain.setTargetAtTime(Math.min(0.2, 6 / (dist + 10)) * (0.3 + b.input.throttle * 0.7), t, 0.08);
      if (v.p) v.p.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, (b.pos.x - listener.x) / 60)), t, 0.1);
    });
  }

  // a small zinc casting struck: inharmonic partials with fast decay
  clink(strength = 1, pitch = 1) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime, a = Math.min(1, strength);
    const out = ctx.createGain(); out.gain.value = 0.22 * a; out.connect(this.master);
    for (const [f, dec, amp] of [[2290, 0.16, 1], [3870, 0.11, 0.7], [5420, 0.08, 0.5], [7310, 0.05, 0.35], [9650, 0.035, 0.25]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * pitch * (0.93 + Math.random() * 0.14);
      const g = ctx.createGain(); g.gain.setValueAtTime(amp, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec * (0.7 + a * 0.6));
      o.connect(g).connect(out); o.start(t); o.stop(t + dec * 1.4 + 0.02);
    }
    this.tick(a * 0.6, 6000);
  }

  // plastic knock: short low-mid noise burst
  thunk(strength = 1, freq = 700) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 2.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5 * Math.min(1, strength), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.connect(f).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + 0.09);
  }

  tick(a, f) {
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = f;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.3 * a, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    s.connect(hp).connect(g).connect(this.master); s.start(t, Math.random()); s.stop(t + 0.02);
  }

  beep(high) {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = high ? 1320 : 660;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (high ? 0.5 : 0.22));
    o.connect(lp).connect(g).connect(this.master); o.start(t); o.stop(t + 0.55);
  }
}
