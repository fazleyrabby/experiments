// Procedural Web Audio engine for Overland Camp.
// Everything is synthesised: layered rain (awning drum, roof patter, hiss, ground wash,
// individual drips and heavy drops), wind through pines, fire crackle, crickets,
// birdsong, forest-reverbed thunder and wet footsteps.
//
// Browsers only allow audio after a user gesture, so main.js calls autoEnable() on the
// first pointer/key press. Sound then stays on until the player mutes it.

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function poisson(mean) {
  // Knuth; fine for the small means used per scheduler window.
  const L = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do { k++; p *= Math.random(); } while (p > L && k < 40);
  return k - 1;
}

const SCHEDULER_MS = 140;
const LOOKAHEAD = 0.16;

class CampAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.userMuted = false;
    this.isInitialized = false;
    this.currentWeather = 'heavyRain';
    this.fireLevel = 1;
    this.rates = { drip: 0, thud: 0, crackle: 0, cricket: 0, bird: 0, thunder: 0, frog: 0 };
    this.timer = null;
    this.nextThunderAt = 0;
  }

  // --- setup ---------------------------------------------------------------
  init() {
    if (this.isInitialized) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    const ctx = this.ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3.5;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.25;
    this.masterGain.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.connect(this.masterGain);
    this.buildReverb();

    this.buildNoise();
    this.buildRain();
    this.buildWind();
    this.buildFire();

    this.isInitialized = true;
    this.applyWeather(this.currentWeather, true);
    this.timer = setInterval(() => this.schedule(), SCHEDULER_MS);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx || !this.enabled) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  }

  buildNoise() {
    const ctx = this.ctx;
    const len = ctx.sampleRate * 6;
    this.pinkBuffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = this.pinkBuffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    // Back-compat name used by footstep()
    this.noiseBuffer = this.pinkBuffer;

    const wlen = ctx.sampleRate * 5;
    this.whiteBuffer = ctx.createBuffer(1, wlen, ctx.sampleRate);
    const wd = this.whiteBuffer.getChannelData(0);
    for (let i = 0; i < wlen; i++) wd[i] = Math.random() * 2 - 1;
  }

  buildReverb() {
    // Damp, short-ish forest tail from decaying noise.
    const ctx = this.ctx;
    const secs = 2.6;
    const len = Math.floor(ctx.sampleRate * secs);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const w = Math.random() * 2 - 1;
        lp += (w - lp) * (0.55 - 0.45 * t); // darkens over time
        d[i] = lp * Math.pow(1 - t, 2.6);
      }
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = ir;
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 1;
    this.reverbReturn = ctx.createGain();
    this.reverbReturn.gain.value = 0.55;
    this.reverbSend.connect(this.reverb);
    this.reverb.connect(this.reverbReturn);
    this.reverbReturn.connect(this.masterGain);
  }

  loopNoise(buffer = this.pinkBuffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    // Loop the whole buffer from a random entry point. (A random loopStart
    // near the end of a short buffer makes a loop a few ms long = a buzz.)
    const dur = buffer.duration;
    src.loopStart = 0;
    src.loopEnd = dur;
    src.start(0, Math.random() * dur * 0.9);
    return src;
  }

  filter(type, freq, q = 0.7) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  lfo(rate, depth, target) {
    const o = this.ctx.createOscillator();
    o.frequency.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    g.connect(target);
    o.start();
    return o;
  }

  buildRain() {
    const ctx = this.ctx;
    // All rain layers share a bus so the downpour can swell and ebb as one
    this.rainBus = ctx.createGain();
    this.rainBus.gain.value = 1;
    this.rainBus.connect(this.bus);

    // Awning drum: warm resonant thrum with slow breathing.
    const drum = this.loopNoise();
    const drumBp = this.filter('bandpass', 420, 2.2);
    const drumLp = this.filter('lowpass', 1300);
    this.rainDrumGain = ctx.createGain();
    this.rainDrumGain.gain.value = 0;
    const drumTrem = ctx.createGain();
    drumTrem.gain.value = 1;
    drum.connect(drumBp); drumBp.connect(drumLp); drumLp.connect(drumTrem); drumTrem.connect(this.rainDrumGain);
    this.rainDrumGain.connect(this.rainBus);
    this.lfo(0.37, 0.18, drumTrem.gain);
    this.lfo(2.9, 0.06, drumTrem.gain);

    // Roof patter: mid-band grain that gives the drumming texture.
    const patter = this.loopNoise(this.whiteBuffer);
    patter.playbackRate.value = 0.8;
    const patterBp = this.filter('bandpass', 1500, 0.8);
    this.rainPatterGain = ctx.createGain();
    this.rainPatterGain.gain.value = 0;
    const patterAm = ctx.createGain();
    patterAm.gain.value = 0.7;
    patter.connect(patterBp); patterBp.connect(patterAm); patterAm.connect(this.rainPatterGain);
    this.rainPatterGain.connect(this.rainBus);
    // Slow, uneven breathing only: an audio-rate wobble here reads as a buzz
    this.lfo(0.21, 0.15, patterAm.gain);
    this.lfo(0.53, 0.08, patterAm.gain);

    // Hiss: the broadband wash of rain on leaves.
    const hiss = this.loopNoise(this.whiteBuffer);
    const hissHp = this.filter('highpass', 2200);
    const hissLp = this.filter('lowpass', 9500);
    this.rainHissGain = ctx.createGain();
    this.rainHissGain.gain.value = 0;
    hiss.connect(hissHp); hissHp.connect(hissLp); hissLp.connect(this.rainHissGain);
    this.rainHissGain.connect(this.rainBus);

    // Ground wash: distant surface of falling water.
    const wash = this.loopNoise();
    const washBp = this.filter('bandpass', 5200, 0.4);
    this.rainWashGain = ctx.createGain();
    this.rainWashGain.gain.value = 0;
    wash.connect(washBp); washBp.connect(this.rainWashGain);
    this.rainWashGain.connect(this.rainBus);
    this.lfo(0.13, 0.04, this.rainWashGain.gain);
  }

  buildWind() {
    const ctx = this.ctx;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.06;
    this.windGain.connect(this.bus);

    // Low rolling gusts
    const low = this.loopNoise();
    const lowLp = this.filter('lowpass', 360);
    const gust = ctx.createGain();
    gust.gain.value = 0.7;
    low.connect(lowLp); lowLp.connect(gust); gust.connect(this.windGain);
    this.lfo(0.18, 160, lowLp.frequency);
    this.lfo(0.07, 0.3, gust.gain);

    // Needle hush: swishing high pines
    const hush = this.loopNoise();
    const hushBp = this.filter('bandpass', 1100, 1.1);
    const hushGain = ctx.createGain();
    hushGain.gain.value = 0.32;
    hush.connect(hushBp); hushBp.connect(hushGain); hushGain.connect(this.windGain);
    this.lfo(0.11, 420, hushBp.frequency);
    this.lfo(0.23, 0.18, hushGain.gain);
  }

  buildFire() {
    const ctx = this.ctx;
    this.fireGain = ctx.createGain();
    this.fireGain.gain.value = this.fireLevel;
    this.fireGain.connect(this.bus);

    // Soft roar
    const roar = this.loopNoise();
    const roarBp = this.filter('bandpass', 170, 0.7);
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.11;
    roar.connect(roarBp); roarBp.connect(roarGain); roarGain.connect(this.fireGain);
    this.lfo(5.7, 0.04, roarGain.gain);
    this.lfo(0.6, 0.04, roarGain.gain);
  }

  // --- event scheduler -----------------------------------------------------
  schedule() {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const dt = SCHEDULER_MS / 1000;
    const at = () => now + 0.03 + Math.random() * LOOKAHEAD;
    const r = this.rates;

    for (let i = poisson(r.drip * dt); i > 0; i--) this.drip(at());
    for (let i = poisson(r.thud * dt); i > 0; i--) this.awningThud(at());
    for (let i = poisson(r.crackle * this.fireLevel * dt); i > 0; i--) this.crackle(at());
    for (let i = poisson(r.cricket * dt); i > 0; i--) this.cricket(at());
    for (let i = poisson(r.bird * dt); i > 0; i--) this.bird(at());
    for (let i = poisson((r.frog || 0) * dt); i > 0; i--) this.frog(at());

    if (r.thunder > 0 && now > this.nextThunderAt) {
      this.nextThunderAt = now + rand(14, 34) / r.thunder;
      if (Math.random() < 0.7) this.triggerThunder();
    }
  }

  panner(pan) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }

  // Water drip: a short pitched plink that rises as the bubble forms.
  drip(t) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f0 = rand(700, 2300);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f0 * rand(1.5, 2.1), t + 0.05);
    const peak = rand(0.012, 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.05, 0.11));
    const p = this.panner(rand(-0.9, 0.9));
    osc.connect(g); g.connect(p); p.connect(this.bus);
    if (Math.random() < 0.5) { const s = ctx.createGain(); s.gain.value = 0.7; p.connect(s); s.connect(this.reverbSend); }
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Big drop landing on the taut vinyl/canvas.
  awningThud(t) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuffer;
    const bp = this.filter('bandpass', rand(180, 360), 3.2);
    const g = ctx.createGain();
    const peak = rand(0.05, 0.16);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.05, 0.1));
    const p = this.panner(rand(-0.5, 0.5));
    src.connect(bp); bp.connect(g); g.connect(p); p.connect(this.bus);
    src.start(t, Math.random());
    src.stop(t + 0.12);
  }

  crackle(t) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteBuffer;
    const hp = this.filter('highpass', rand(1400, 4200), 0.9);
    const g = ctx.createGain();
    const peak = Math.random() < 0.12 ? rand(0.16, 0.3) : rand(0.03, 0.12);
    const dur = rand(0.008, 0.03);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = this.panner(rand(0.15, 0.7));
    src.connect(hp); hp.connect(g); g.connect(p); p.connect(this.fireGain);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);

    if (Math.random() < 0.18) {
      // A log "pop"
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'sine';
      const f = rand(110, 260);
      o.frequency.setValueAtTime(f * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(rand(0.05, 0.12), t + 0.004);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(og); og.connect(p);
      o.start(t); o.stop(t + 0.1);
    }
  }

  cricket(t) {
    const ctx = this.ctx;
    const f = rand(4300, 5100);
    const pulses = 3 + Math.floor(Math.random() * 3);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    for (let i = 0; i < pulses; i++) {
      const s = t + i * 0.055;
      g.gain.exponentialRampToValueAtTime(rand(0.04, 0.08), s + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.04);
    }
    const p = this.panner(rand(-1, 1));
    osc.connect(g); g.connect(p); p.connect(this.bus);
    osc.start(t); osc.stop(t + pulses * 0.055 + 0.08);
  }

  bird(t) {
    const ctx = this.ctx;
    const kind = Math.floor(Math.random() * 3);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    const base = rand(2000, 3400);
    g.gain.setValueAtTime(0.0001, t);
    let end = t;
    if (kind === 0) {
      // Two-note whistle
      const notes = [base, base * rand(0.72, 0.84)];
      notes.forEach((f, i) => {
        const s = t + i * 0.26;
        osc.frequency.setValueAtTime(f * 0.97, s);
        osc.frequency.exponentialRampToValueAtTime(f, s + 0.06);
        g.gain.exponentialRampToValueAtTime(0.07, s + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.22);
        end = s + 0.24;
      });
    } else if (kind === 1) {
      // Chirp run
      const n = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) {
        const s = t + i * 0.085;
        const f = base * (1 + Math.sin(i * 0.9) * 0.12);
        osc.frequency.setValueAtTime(f, s);
        osc.frequency.exponentialRampToValueAtTime(f * 1.35, s + 0.05);
        g.gain.exponentialRampToValueAtTime(0.06, s + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.06);
        end = s + 0.07;
      }
    } else {
      // Rising trill with vibrato
      const dur = rand(0.5, 0.9);
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.6, t + dur);
      const vib = ctx.createOscillator();
      const vg = ctx.createGain();
      vib.frequency.value = rand(24, 36);
      vg.gain.value = 90;
      vib.connect(vg); vg.connect(osc.frequency);
      vib.start(t); vib.stop(t + dur + 0.1);
      g.gain.exponentialRampToValueAtTime(0.055, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      end = t + dur;
    }
    const p = this.panner(rand(-0.9, 0.9));
    osc.connect(g); g.connect(p); p.connect(this.bus);
    const s = ctx.createGain(); s.gain.value = 0.6; p.connect(s); s.connect(this.reverbSend);
    osc.start(t); osc.stop(end + 0.1);
  }

  // Distant tree frog: a soft two- or three-pulse "rrib-bit" deep in the reverb.
  frog(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const f = rand(190, 340);
    o.frequency.setValueAtTime(f, t);
    const bp = this.filter('bandpass', f * rand(2.6, 3.4), 5);
    const lp = this.filter('lowpass', 1800);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    const pulses = 2 + Math.floor(Math.random() * 2);
    const peak = rand(0.025, 0.06);
    for (let i = 0; i < pulses; i++) {
      const s = t + i * rand(0.11, 0.15);
      o.frequency.setValueAtTime(f * (i === pulses - 1 ? 1.12 : 1), s);
      g.gain.exponentialRampToValueAtTime(peak, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + 0.07);
    }
    const p = this.panner(rand(-0.95, 0.95));
    o.connect(bp); bp.connect(lp); lp.connect(g); g.connect(p);
    const dry = ctx.createGain(); dry.gain.value = 0.45; p.connect(dry); dry.connect(this.bus);
    const wet = ctx.createGain(); wet.gain.value = 1.0; p.connect(wet); wet.connect(this.reverbSend);
    o.start(t);
    o.stop(t + pulses * 0.16 + 0.1);
  }

  // Slow swell of the downpour (weather.js); ~0.74..1
  setRainSwell(v) {
    if (!this.ctx || !this.rainBus) return;
    const target = 0.62 + (v - 0.74) / 0.26 * 0.5;
    this.rainBus.gain.setTargetAtTime(Math.max(0.4, target), this.ctx.currentTime, 1.5);
  }

  // Thunder: a sharp crack for close strikes, then a long multi-bump rumble through the reverb.
  triggerThunder(distance = Math.random()) {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const now = ctx.currentTime + 0.02;
    const near = 1 - distance;
    const level = 0.45 + near * 0.55;

    if (near > 0.45) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.whiteBuffer;
      const hp = this.filter('highpass', 700);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.5 * near, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      crack.connect(hp); hp.connect(g); g.connect(this.bus); g.connect(this.reverbSend);
      crack.start(now, Math.random());
      crack.stop(now + 0.3);
    }

    const delay = 0.05 + distance * 0.4;
    const t0 = now + delay;
    const dur = 5 + distance * 4 + Math.random() * 2;

    const rumble = ctx.createBufferSource();
    rumble.buffer = this.pinkBuffer;
    const lp = this.filter('lowpass', 90);
    lp.frequency.setValueAtTime(260 - distance * 120, t0);
    lp.frequency.exponentialRampToValueAtTime(55, t0 + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.55 * level, t0 + 0.35);
    const bumps = 3 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= bumps; i++) {
      const tt = t0 + (i / (bumps + 1)) * dur * 0.8;
      env.gain.exponentialRampToValueAtTime(rand(0.18, 0.5) * level, tt);
      env.gain.exponentialRampToValueAtTime(rand(0.07, 0.16) * level, tt + rand(0.4, 0.9));
    }
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    rumble.connect(lp); lp.connect(env); env.connect(this.bus);
    const send = ctx.createGain(); send.gain.value = 0.8; env.connect(send); send.connect(this.reverbSend);
    rumble.start(t0, Math.random() * 3);
    rumble.stop(t0 + dur + 0.1);

    // Sub thump
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(rand(52, 70), t0);
    sub.frequency.exponentialRampToValueAtTime(30, t0 + 2.2);
    sg.gain.setValueAtTime(0.0001, t0);
    sg.gain.exponentialRampToValueAtTime(0.28 * level, t0 + 0.2);
    sg.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6);
    sub.connect(sg); sg.connect(this.bus);
    sub.start(t0); sub.stop(t0 + 2.7);
  }

  // --- state ---------------------------------------------------------------
  setWeather(weatherKey) {
    this.currentWeather = weatherKey;
    if (!this.ctx) return;
    this.applyWeather(weatherKey);
  }

  // 0 = out, 1 = full blaze. props.js drives this from the weather.
  setFireLevel(level) {
    this.fireLevel = Math.max(0, Math.min(1, level));
    if (!this.ctx || !this.fireGain) return;
    const now = this.ctx.currentTime;
    this.fireGain.gain.cancelScheduledValues(now);
    this.fireGain.gain.setValueAtTime(this.fireGain.gain.value, now);
    this.fireGain.gain.linearRampToValueAtTime(this.fireLevel, now + 1.5);
  }

  applyWeather(weatherKey, immediate = false) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const ramp = immediate ? 0.05 : 2.0;

    const t = {
      drum: 0, patter: 0, hiss: 0, wash: 0, wind: 0.06,
      drip: 0, thud: 0, crackle: 11, cricket: 0, bird: 0, thunder: 0, frog: 0
    };

    switch (weatherKey) {
      case 'heavyRain':
        Object.assign(t, { drum: 0.4, patter: 0.18, hiss: 0.22, wash: 0.2, wind: 0.15, drip: 14, thud: 6, thunder: 0.35, frog: 0.12 });
        break;
      case 'lightRain':
        Object.assign(t, { drum: 0.15, patter: 0.07, hiss: 0.09, wash: 0.07, wind: 0.08, drip: 6, thud: 2, frog: 0.45 });
        break;
      case 'moonlitNight':
        Object.assign(t, { cricket: 3.2, wind: 0.06, frog: 0.3, drip: 1.2 });
        break;
      case 'dawn':
        Object.assign(t, { bird: 0.7, wind: 0.05 });
        break;
      case 'sunny':
        Object.assign(t, { bird: 0.45, wind: 0.07 });
        break;
    }

    const smooth = (param, v) => {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(v, now + ramp);
    };
    smooth(this.rainDrumGain.gain, t.drum);
    smooth(this.rainPatterGain.gain, t.patter);
    smooth(this.rainHissGain.gain, t.hiss);
    smooth(this.rainWashGain.gain, t.wash);
    smooth(this.windGain.gain, t.wind);

    // Event rates are read by the scheduler; no ramp needed.
    this.rates = {
      drip: t.drip, thud: t.thud, crackle: t.crackle,
      cricket: t.cricket, bird: t.bird, thunder: t.thunder, frog: t.frog
    };
  }

  // Wet footstep: a soft low thud plus a short splashy squelch.
  footstep(intensity = 1) {
    if (!this.ctx || !this.enabled || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.75 + Math.random() * 0.5;
    const filter = this.filter('bandpass', 300 + Math.random() * 180, 1.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1 * intensity, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    src.connect(filter); filter.connect(gain); gain.connect(this.bus);
    src.start(now, Math.random() * 4);
    src.stop(now + 0.16);

    const splash = this.ctx.createBufferSource();
    splash.buffer = this.whiteBuffer;
    splash.playbackRate.value = 1.2 + Math.random() * 0.6;
    const sf = this.filter('highpass', 2200);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.exponentialRampToValueAtTime(0.03 * intensity, now + 0.02);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    splash.connect(sf); sf.connect(sg); sg.connect(this.bus);
    splash.start(now, Math.random());
    splash.stop(now + 0.11);
  }

  toggleSound(enable = !this.enabled) {
    if (!this.isInitialized) this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.enabled = enable;
    this.userMuted = !enable;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(enable ? 0.9 : 0.0001, now + 0.6);
    return this.enabled;
  }

  // First user gesture: turn sound on unless the player has already muted it.
  autoEnable() {
    if (this.enabled || this.userMuted) return this.enabled;
    return this.toggleSound(true);
  }
}

export const campAudio = new CampAudioEngine();
