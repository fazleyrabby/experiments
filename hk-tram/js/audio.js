/* audio.js — synthesised rain, city hum, tram motor, rail clacks and the ding-ding bell. Off until enabled. */
export class TramAudio {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.lastJoint = 0;
  }

  async enable() {
    if (!this.ctx) this._build();
    await this.ctx.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.2);
  }
  disable() {
    if (!this.ctx) return;
    this.enabled = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  _noise(seconds = 3) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.start();
    return src;
  }

  _build() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(ctx.destination);

    // rain: broad band + hiss
    const n1 = this._noise(); const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.35;
    this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0.2;
    n1.connect(bp); bp.connect(this.rainGain); this.rainGain.connect(this.master);
    const n2 = this._noise(); const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 6500;
    const hg = ctx.createGain(); hg.gain.value = 0.06;
    n2.connect(hp); hp.connect(hg); hg.connect(this.master);

    // distant city hum
    const n3 = this._noise(); const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 240;
    const cg = ctx.createGain(); cg.gain.value = 0.42;
    n3.connect(lp); lp.connect(cg); cg.connect(this.master);

    // tram motor: detuned saws through a low-pass, plus whine
    this.motorGain = ctx.createGain(); this.motorGain.gain.value = 0;
    const mlp = ctx.createBiquadFilter(); mlp.type = 'lowpass'; mlp.frequency.value = 520;
    this.saw1 = ctx.createOscillator(); this.saw1.type = 'sawtooth';
    this.saw2 = ctx.createOscillator(); this.saw2.type = 'sawtooth';
    this.whine = ctx.createOscillator(); this.whine.type = 'sine';
    this.whineGain = ctx.createGain(); this.whineGain.gain.value = 0;
    this.saw1.connect(mlp); this.saw2.connect(mlp); mlp.connect(this.motorGain); this.motorGain.connect(this.master);
    this.whine.connect(this.whineGain); this.whineGain.connect(this.master);
    this.saw1.start(); this.saw2.start(); this.whine.start();
    this.setSpeed(0);

    this.clackNoise = this._noise(1);
    this.clackBus = ctx.createGain(); this.clackBus.gain.value = 0;
    const clp = ctx.createBiquadFilter(); clp.type = 'lowpass'; clp.frequency.value = 900;
    this.clackNoise.connect(clp); clp.connect(this.clackBus); this.clackBus.connect(this.master);
  }

  setSpeed(v) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.saw1.frequency.setTargetAtTime(38 + v * 9, t, 0.1);
    this.saw2.frequency.setTargetAtTime(38.7 + v * 9, t, 0.1);
    this.whine.frequency.setTargetAtTime(180 + v * 55, t, 0.1);
    this.motorGain.gain.setTargetAtTime(Math.min(0.1, v * 0.012), t, 0.15);
    this.whineGain.gain.setTargetAtTime(Math.min(0.018, v * 0.0022), t, 0.15);
  }

  /** call each frame with total distance travelled; plays a bogie clack at each rail joint */
  update(dist, speed, t) {
    if (!this.ctx || !this.enabled) return;
    this.rainGain.gain.setTargetAtTime(0.18 + 0.05 * Math.sin(t * 0.3) + 0.03 * Math.sin(t * 0.83), this.ctx.currentTime, 0.5);
    const jointLen = 12.5;
    const j = Math.floor(dist / jointLen);
    if (j !== this.lastJoint && speed > 0.1) {
      this.lastJoint = j;
      this._clack(0, speed);
      this._clack(0.14, speed * 0.8);
    }
  }
  _clack(delay, speed) {
    const t = this.ctx.currentTime + delay;
    const g = this.clackBus.gain;
    const amp = Math.min(0.38, 0.1 + speed * 0.03);
    g.cancelScheduledValues(t);
    g.setValueAtTime(amp, t);
    g.exponentialRampToValueAtTime(0.0008, t + 0.09);
  }

  ding(strikes = 2) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    for (let k = 0; k < strikes; k++) {
      const t = ctx.currentTime + k * 0.19;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      out.connect(this.master);
      for (const [f, a, d] of [[1320, 1, 1.0], [2640, 0.5, 0.7], [3960, 0.28, 0.45], [5590, 0.12, 0.25]]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.002);
        const g = ctx.createGain();
        g.gain.setValueAtTime(a, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + 1.2);
      }
    }
  }
}
