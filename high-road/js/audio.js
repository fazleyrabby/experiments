// Synthesised cabin sound: wind over the glass, tyre roar, a low engine drone, the whoosh
// of oncoming traffic and a soft pad whose chord follows the light. Nothing is loaded;
// it is all filtered noise and oscillators. The same graph renders live or offline.

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

// Pad voicings (Hz) per light: open and unresolved, so they sit under the road noise.
const CHORDS = {
  day: [146.83, 220.0, 277.18, 329.63, 440.0],      // D  A  C# E  A  (Dmaj9 colour)
  golden: [130.81, 196.0, 246.94, 293.66, 392.0],   // C  G  B  D  G  (Cmaj7 add9)
  night: [123.47, 185.0, 220.0, 277.18, 369.99],    // B  F# A  C# F# (Bm9)
};

const gust = (t) => 0.5 + 0.5 * Math.sin(t * 0.21) * Math.sin(t * 0.077 + 1.3);

export class DriveAudio {
  constructor() { this.on = false; this.ctx = null; this.passing = new Map(); this.mood = 'day'; this.t = 0; }

  build(ctx) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    const pink = noiseBuffer(ctx, 6, 'pink');
    const brown = noiseBuffer(ctx, 6, 'brown');
    this.pink = pink;
    const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 5); return s; };

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

    // pad: each voice is a pair of slightly detuned triangles, slowly swelling, through a
    // warm lowpass and a long feedback delay for space
    const padBus = ctx.createGain(); padBus.gain.value = 0.03;
    const padLp = ctx.createBiquadFilter(); padLp.type = 'lowpass'; padLp.frequency.value = 900; padLp.Q.value = 0.3;
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.61;
    const fb = ctx.createGain(); fb.gain.value = 0.42;
    const wet = ctx.createGain(); wet.gain.value = 0.5;
    padBus.connect(padLp); padLp.connect(this.master);
    padLp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(this.master);
    this.voices = CHORDS.day.map((f, i) => {
      const g = ctx.createGain(); g.gain.value = 0;
      const pan = ctx.createStereoPanner(); pan.pan.value = (i / 4 - 0.5) * 0.8;
      const oscs = [-4, 4].map((cents) => { const o = ctx.createOscillator(); o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = cents; o.connect(g); o.start(); return o; });
      // slow independent swell per voice
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045 + i * 0.013;
      const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 0.35;
      const base = ctx.createConstantSource(); base.offset.value = 0.65; base.start();
      lfo.connect(lfoAmt); lfoAmt.connect(g.gain); base.connect(g.gain); lfo.start();
      g.connect(pan); pan.connect(padBus);
      return { oscs, gain: g };
    });
  }

  init() { this.build(new (window.AudioContext || window.webkitAudioContext)()); }

  async setOn(v) {
    if (v && !this.ctx) this.init();
    if (!this.ctx) return;
    if (v) await this.ctx.resume();
    this.on = v;
    if (v) this.setMood(this.mood, this.ctx.currentTime, 0.01);
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(v && !this.paused ? 0.7 : 0, now, 0.6);
  }

  setPaused(p) {
    this.paused = p;
    if (this.ctx && this.on) this.master.gain.setTargetAtTime(p ? 0 : 0.7, this.ctx.currentTime, 0.4);
  }

  // glide the pad to the chord for this light
  setMood(key, when, glide = 2.5) {
    this.mood = CHORDS[key] ? key : 'day';
    if (!this.ctx || !this.voices) return;
    const at = when ?? this.ctx.currentTime;
    CHORDS[this.mood].forEach((f, i) => { for (const o of this.voices[i].oscs) o.frequency.setTargetAtTime(f, at, glide / 3); });
  }

  whoosh(gainPeak, pan, when) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = this.pink;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    src.connect(bp); bp.connect(g); g.connect(p); p.connect(this.master);
    const now = when ?? ctx.currentTime;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.linearRampToValueAtTime(1500, now + 0.9);
    bp.frequency.exponentialRampToValueAtTime(260, now + 2.0);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gainPeak, now + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 2.4);
    p.pan.setValueAtTime(pan, now);
    p.pan.linearRampToValueAtTime(pan - 0.6, now + 1.6);
    src.start(now, Math.random() * 3);
    src.stop(now + 2.6);
  }

  // Oncoming vehicles about to pass: returns the ones that should whoosh now.
  passes(vehicles, sCam) {
    const out = [];
    for (const v of vehicles) {
      if (v.dir > 0) continue;
      const d = v.s - sCam;
      if (d < 55 && d > 0 && !this.passing.has(v)) { this.passing.set(v, true); out.push(v); }
    }
    for (const v of this.passing.keys()) if (!vehicles.includes(v)) this.passing.delete(v);
    return out;
  }

  update(dt, vehicles, sCam) {
    this.t += dt;
    const passing = this.passes(vehicles, sCam);
    if (!this.ctx || !this.on) return;
    const g = gust(this.t);
    this.wind.frequency.setTargetAtTime(520 + 420 * g, this.ctx.currentTime, 0.5);
    this.windGain.gain.setTargetAtTime(0.1 + 0.12 * g, this.ctx.currentTime, 0.5);
    for (const v of passing) this.whoosh(v.kind === 'truck' ? 0.5 : 0.3, -0.5);
  }

  // Render a soundtrack offline from a timeline of { moods: [{t, key}], whooshes: [{t, kind}] }.
  static async renderOffline({ duration, moods, whooshes, fadeIn = 1.2, fadeOut = 1.5, sampleRate = 48000 }) {
    const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
    const a = new DriveAudio();
    a.build(ctx);
    a.setMood(moods[0]?.key || 'day', 0, 0.01);
    for (const m of moods.slice(1)) a.setMood(m.key, m.t);
    for (let t = 0; t < duration; t += 0.25) {
      const g = gust(t);
      a.wind.frequency.setTargetAtTime(520 + 420 * g, t, 0.5);
      a.windGain.gain.setTargetAtTime(0.1 + 0.12 * g, t, 0.5);
    }
    for (const w of whooshes) a.whoosh(w.kind === 'truck' ? 0.5 : 0.3, -0.5, w.t);
    a.master.gain.setValueAtTime(0, 0);
    a.master.gain.linearRampToValueAtTime(0.7, fadeIn);
    a.master.gain.setValueAtTime(0.7, duration - fadeOut);
    a.master.gain.linearRampToValueAtTime(0, duration);
    return ctx.startRendering();
  }
}

// 16-bit PCM WAV, for handing an offline render to an encoder.
export function encodeWav(buffer) {
  const ch = buffer.numberOfChannels, n = buffer.length, sr = buffer.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  str(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { out.setInt16(o, Math.max(-1, Math.min(1, data[c][i])) * 0x7fff, true); o += 2; }
  return new Uint8Array(out.buffer);
}
