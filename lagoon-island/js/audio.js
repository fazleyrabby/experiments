import { clamp, sstep } from './util.js';

const LAYERS = ['waves', 'jungle', 'cicada', 'crickets'];

/** Field-recording ambience. Each layer's level follows the clock and the breeze. */
export class Soundscape {
  constructor(base = './assets/audio/') {
    this.base = base;
    this.ctx = null;
    this.enabled = true;
    this.started = false;
    this.gains = {};
    this.available = false;
  }

  async start() {
    if (this.started) {
      if (this.ctx?.state === 'suspended' && this.enabled) await this.ctx.resume();
      return;
    }
    this.started = true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 2.5;
    this.master.connect(comp).connect(ctx.destination);
    await ctx.resume();

    this.addWind();
    const results = await Promise.allSettled(LAYERS.map((name) => this.loadLayer(name)));
    this.available = results.some((r) => r.status === 'fulfilled');
    if (this.enabled) this.master.gain.setTargetAtTime(0.9, ctx.currentTime, 1.1);
  }

  async loadLayer(name) {
    const res = await fetch(`${this.base}${name}.mp3`);
    if (!res.ok) throw new Error(`Missing ${name}`);
    const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    // Skip MP3 encoder padding so the crossfaded loop point stays seamless.
    src.loopStart = 0.06;
    src.loopEnd = buffer.duration - 0.06;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain).connect(this.master);
    src.start(0, Math.random() * buffer.duration);
    this.gains[name] = gain;
  }

  /** Soft air movement under the recordings, driven by the Breeze slider. */
  addWind() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buffer.getChannelData(c);
      let b0 = 0;
      let b1 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.05;
        b1 = 0.96 * b1 + w * 0.1;
        d[i] = (b0 + b1) * 0.42;
      }
      for (let i = 0; i < 4000; i++) {
        const k = i / 4000;
        d[i] = d[i] * k + d[len - 4000 + i] * (1 - k);
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.loopEnd = (len - 4000) / ctx.sampleRate;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.45;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);
    src.start();
    this.gains.wind = gain;
    this.windFilter = filter;
  }

  update(state, wind, zoom = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const levels = mixFor(state, wind, zoom);
    for (const [name, value] of Object.entries(levels)) {
      this.gains[name]?.gain.setTargetAtTime(value, t, 0.35);
    }
    this.windFilter?.frequency.setTargetAtTime(380 + wind * 620, t, 0.5);
  }

  /** A single water drop for clicks on the lagoon. */
  plop(strength = 1) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const f = 420 + Math.random() * 260;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 2.6, t + 0.085);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  async setEnabled(on) {
    this.enabled = on;
    if (on) await this.start();
    if (!this.ctx) return;
    if (on) await this.ctx.resume();
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, on ? 0.5 : 0.12);
  }
}

/** Layer levels for a moment of the day; shared by the live scene and the video mix. */
export function mixFor(state, wind, zoom = 1) {
  const day = clamp(1 - state.night);
  const close = 1 - sstep(0.45, 1.05, zoom);
  return {
    waves: 0.46 + close * 0.24 + wind * 0.12,
    jungle: 0.42 * day * (0.72 + close * 0.42),
    cicada: 0.2 * day * sstep(0.12, 0.72, state.warm),
    crickets: 0.4 * sstep(0.25, 0.9, state.night),
    wind: 0.035 + wind * wind * 0.2,
  };
}
