// Synthesised cabin sound: wind over the glass, tyre roar, a low engine drone and the
// whoosh of oncoming traffic. Nothing is loaded; it is all filtered noise and oscillators.

function noiseBuffer(ctx, seconds, color) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else { // pink (Paul Kellet, economy)
        b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
      }
    }
  }
  return buf;
}

export class DriveAudio {
  constructor() { this.on = false; this.ctx = null; this.passing = new Map(); }

  init() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const pink = noiseBuffer(ctx, 6, 'pink');
    const brown = noiseBuffer(ctx, 6, 'brown');
    const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(ctx.currentTime + Math.random()); return s; };

    // wind: band-passed pink noise whose centre and level breathe slowly
    this.wind = ctx.createBiquadFilter(); this.wind.type = 'bandpass'; this.wind.frequency.value = 700; this.wind.Q.value = 0.6;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0.16;
    loop(pink).connect(this.wind); this.wind.connect(this.windGain); this.windGain.connect(this.master);
    // tyre roar
    const roar = ctx.createBiquadFilter(); roar.type = 'lowpass'; roar.frequency.value = 220; roar.Q.value = 0.4;
    this.roarGain = ctx.createGain(); this.roarGain.gain.value = 0.32;
    loop(brown).connect(roar); roar.connect(this.roarGain); this.roarGain.connect(this.master);
    // tyre hiss
    const hiss = ctx.createBiquadFilter(); hiss.type = 'highpass'; hiss.frequency.value = 2400;
    const hissGain = ctx.createGain(); hissGain.gain.value = 0.018;
    loop(pink).connect(hiss); hiss.connect(hissGain); hissGain.connect(this.master);
    // engine: two detuned low oscillators through a soft lowpass
    const eng = ctx.createBiquadFilter(); eng.type = 'lowpass'; eng.frequency.value = 160;
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0.05;
    for (const [f, type] of [[46, 'sawtooth'], [46.7, 'triangle'], [92.3, 'sine']]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(eng); o.start();
    }
    eng.connect(this.engGain); this.engGain.connect(this.master);
    this.pink = pink;
  }

  async setOn(v) {
    if (v && !this.ctx) this.init();
    if (!this.ctx) return;
    if (v) await this.ctx.resume();
    this.on = v;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(v && !this.paused ? 0.7 : 0, now, 0.6);
  }

  setPaused(p) {
    this.paused = p;
    if (this.ctx && this.on) this.master.gain.setTargetAtTime(p ? 0 : 0.7, this.ctx.currentTime, 0.4);
  }

  whoosh(gainPeak, pan) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.pink;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    src.connect(bp); bp.connect(g); g.connect(p); p.connect(this.master);
    const now = ctx.currentTime;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.linearRampToValueAtTime(1500, now + 0.9);
    bp.frequency.exponentialRampToValueAtTime(260, now + 2.0);
    g.gain.linearRampToValueAtTime(gainPeak, now + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 2.4);
    p.pan.linearRampToValueAtTime(pan - 0.6, now + 1.6);
    src.start(now, Math.random() * 4);
    src.stop(now + 2.6);
  }

  update(dt, vehicles, sCam) {
    if (!this.ctx || !this.on) return;
    this.t = (this.t || 0) + dt;
    const t = this.t;
    const gust = 0.5 + 0.5 * Math.sin(t * 0.21) * Math.sin(t * 0.077 + 1.3);
    this.wind.frequency.setTargetAtTime(520 + 420 * gust, this.ctx.currentTime, 0.5);
    this.windGain.gain.setTargetAtTime(0.1 + 0.12 * gust, this.ctx.currentTime, 0.5);
    // oncoming vehicles: whoosh once as they arrive
    for (const v of vehicles) {
      if (v.dir > 0) continue;
      const d = v.s - sCam;
      if (d < 55 && d > 0 && !this.passing.has(v)) {
        this.passing.set(v, true);
        this.whoosh(v.kind === 'truck' ? 0.5 : 0.3, -0.5);
      }
    }
    for (const v of this.passing.keys()) if (!vehicles.includes(v)) this.passing.delete(v);
  }
}
