import * as THREE from 'three';

/**
 * Fully synthesised soundscape (Web Audio): exhaust chuffs locked to the wheel beat, rail
 * clatter, flange rumble, steam hiss, a chime whistle, wind, river and birdsong.
 * Nothing is created until the user switches sound on (autoplay-policy friendly).
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private trainBus!: GainNode;
  private panner!: PannerNode;
  private noiseBuf!: AudioBuffer;
  private brownBuf!: AudioBuffer;
  private rumble!: { gain: GainNode; filter: BiquadFilterNode };
  private hiss!: { gain: GainNode; filter: BiquadFilterNode };
  private wind!: { gain: GainNode; filter: BiquadFilterNode };
  private river!: { gain: GainNode; filter: BiquadFilterNode };
  private falls!: { gain: GainNode; panner: PannerNode };
  private whistleNodes: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  enabled = false;
  private nextBird = 4;
  private lastChuff = 0;
  private lastJoint = 0;
  private chuffToggle = 0;
  private lastT = 0;

  get isOn() {
    return this.enabled && !!this.ctx && this.ctx.state === 'running';
  }

  async enable() {
    if (!this.ctx) this.init();
    await this.ctx!.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.9, this.ctx!.currentTime, 0.3);
  }

  dispose() {
    this.stopWhistle();
    this.enabled = false;
    void this.ctx?.close();
    this.ctx = null;
  }

  disable() {
    this.enabled = false;
    if (this.ctx) this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
  }

  private init() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    // noise buffers
    const len = ctx.sampleRate * 3;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.brownBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = this.brownBuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      b[i] = last * 3.5;
    }

    // spatialised train bus
    this.trainBus = ctx.createGain();
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 14;
    this.panner.rolloffFactor = 1.15;
    this.panner.maxDistance = 2500;
    this.trainBus.connect(this.panner).connect(this.master);

    // continuous layers
    const loop = (buf: AudioBuffer) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.start();
      return s;
    };
    const mk = (buf: AudioBuffer, type: BiquadFilterType, freq: number, q: number, dest: AudioNode) => {
      const src = loop(buf);
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(dest);
      return { gain, filter };
    };
    this.rumble = mk(this.brownBuf, 'lowpass', 220, 0.7, this.trainBus);
    this.hiss = mk(this.noiseBuf, 'highpass', 3200, 0.5, this.trainBus);
    this.wind = mk(this.noiseBuf, 'bandpass', 380, 0.6, this.master);
    this.river = mk(this.noiseBuf, 'bandpass', 1400, 0.45, this.master);
    // waterfall: positional low roar
    const fsrc = loop(this.noiseBuf);
    const ff = ctx.createBiquadFilter();
    ff.type = 'lowpass';
    ff.frequency.value = 1800;
    const fg = ctx.createGain();
    fg.gain.value = 0;
    const fp = ctx.createPanner();
    fp.panningModel = 'HRTF';
    fp.distanceModel = 'inverse';
    fp.refDistance = 30;
    fp.rolloffFactor = 1.2;
    fsrc.connect(ff).connect(fg).connect(fp).connect(this.master);
    this.falls = { gain: fg, panner: fp };
  }

  // ------------------------------------------------------------ one-shots
  private noiseBurst(dest: AudioNode, t: number, freq: number, q: number, peak: number, attack: number, decay: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loopStart = 0;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 2, attack + decay + 0.05);
  }

  private thump(t: number, f0: number, peak: number, decay: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(this.trainBus);
    o.start(t);
    o.stop(t + decay + 0.02);
  }

  private chuff(speed: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.005;
    const hard = this.chuffToggle++ % 2 === 0;
    const v = Math.min(1, speed / 9);
    const peak = (0.55 + 0.35 * v) * (hard ? 1 : 0.72);
    // the exhaust "cough": band-limited noise with a quick attack and a short tail
    this.noiseBurst(this.trainBus, t, hard ? 420 : 520, 0.9, peak, 0.006, 0.11 + 0.05 * (1 - v));
    this.noiseBurst(this.trainBus, t, 1500, 0.7, peak * 0.22, 0.004, 0.06);
    this.thump(t, hard ? 78 : 92, peak * 0.9, 0.16);
    // cylinder "ring"
    this.noiseBurst(this.trainBus, t + 0.02, 180, 3, peak * 0.3, 0.01, 0.1, 'bandpass');
  }

  private clack(speed: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.002;
    const v = Math.min(1, speed / 9);
    const peak = 0.07 + 0.2 * v;
    for (const dt of [0, 0.045]) {
      this.noiseBurst(this.trainBus, t + dt, 1700 + Math.random() * 500, 1.4, peak, 0.002, 0.04);
      this.noiseBurst(this.trainBus, t + dt, 420, 2.5, peak * 0.9, 0.002, 0.07);
    }
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 880 + Math.random() * 140;
    const g = ctx.createGain();
    g.gain.setValueAtTime(peak * 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.trainBus);
    o.start(t);
    o.stop(t + 0.14);
  }

  startWhistle() {
    if (!this.isOn || this.whistleNodes) return;
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.07);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vg = ctx.createGain();
    vg.gain.value = 6;
    vib.connect(vg);
    const osc: OscillatorNode[] = [];
    // a three-chime Victorian whistle: close minor-third partials with a breathy noise bed
    for (const f of [392, 466, 587, 1176]) {
      const o = ctx.createOscillator();
      o.type = f > 1000 ? 'sine' : 'sawtooth';
      o.frequency.value = f;
      vg.connect(o.frequency);
      const og = ctx.createGain();
      og.gain.value = f > 1000 ? 0.12 : 0.22;
      o.connect(og).connect(lp);
      o.start();
      osc.push(o);
    }
    vib.start();
    osc.push(vib);
    lp.connect(g).connect(this.trainBus);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 2400;
    nf.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.value = 0.22;
    src.connect(nf).connect(ng).connect(g);
    src.start();
    this.whistleNodes = { osc: [...osc], gain: g };
    (this.whistleNodes as unknown as { src: AudioBufferSourceNode }).src = src;
  }

  stopWhistle() {
    const w = this.whistleNodes;
    if (!w || !this.ctx) return;
    const t = this.ctx.currentTime;
    w.gain.gain.cancelScheduledValues(t);
    w.gain.gain.setValueAtTime(Math.max(0.0001, w.gain.gain.value), t);
    w.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    const src = (w as unknown as { src: AudioBufferSourceNode }).src;
    for (const o of w.osc) o.stop(t + 0.4);
    src.stop(t + 0.4);
    this.whistleNodes = null;
  }

  /** a distant ba-aa: sawtooth with a fast tremor through two vowel formants */
  bleat(near: number) {
    if (!this.isOn || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.02;
    const dur = 0.55 + Math.random() * 0.5;
    const f0 = 240 + Math.random() * 120;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0 * 1.15, t);
    o.frequency.linearRampToValueAtTime(f0, t + dur * 0.35);
    o.frequency.linearRampToValueAtTime(f0 * 0.82, t + dur);
    const trem = ctx.createOscillator();
    trem.frequency.value = 26 + Math.random() * 10;
    const tg = ctx.createGain();
    tg.gain.value = 0.35;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.5, t + 0.07);
    amp.gain.setValueAtTime(0.5, t + dur * 0.7);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    trem.connect(tg).connect(amp.gain);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(650, t);
    f1.frequency.linearRampToValueAtTime(900, t + dur * 0.5);
    f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 1500;
    f2.Q.value = 4;
    const mix = ctx.createGain();
    mix.gain.value = 0.05 + 0.16 * near;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    o.connect(f1).connect(amp);
    o.connect(f2).connect(amp);
    amp.connect(mix).connect(pan).connect(this.master);
    o.start(t);
    trem.start(t);
    o.stop(t + dur + 0.05);
    trem.stop(t + dur + 0.05);
  }

  private bird() {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + 0.01;
    const base = 2200 + Math.random() * 2200;
    const n = 2 + Math.floor(Math.random() * 5);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 2 - 1;
    const bus = ctx.createGain();
    bus.gain.value = 0.035 + Math.random() * 0.03;
    bus.connect(pan).connect(this.master);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * (0.09 + Math.random() * 0.05);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (1 + Math.random() * 0.2), t);
      o.frequency.exponentialRampToValueAtTime(base * (0.6 + Math.random() * 0.9), t + 0.07);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + 0.1);
    }
  }

  // --------------------------------------------------------------- update
  update(opts: {
    time: number;
    camera: THREE.Camera;
    trainPos: THREE.Vector3;
    speed: number;
    chuffs: number;
    joints: number;
    steam: number;
    camHeight: number;
    riverDist: number;
    fallsPos: THREE.Vector3;
    paused: boolean;
  }) {
    if (!this.ctx || !this.enabled) {
      this.lastChuff = opts.chuffs;
      this.lastJoint = opts.joints;
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const L = ctx.listener;
    const c = opts.camera.position;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(opts.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(opts.camera.quaternion);
    if (L.positionX) {
      L.positionX.setTargetAtTime(c.x, now, 0.03);
      L.positionY.setTargetAtTime(c.y, now, 0.03);
      L.positionZ.setTargetAtTime(c.z, now, 0.03);
      L.forwardX.setTargetAtTime(fwd.x, now, 0.03);
      L.forwardY.setTargetAtTime(fwd.y, now, 0.03);
      L.forwardZ.setTargetAtTime(fwd.z, now, 0.03);
      L.upX.setTargetAtTime(up.x, now, 0.03);
      L.upY.setTargetAtTime(up.y, now, 0.03);
      L.upZ.setTargetAtTime(up.z, now, 0.03);
    }
    this.panner.positionX.setTargetAtTime(opts.trainPos.x, now, 0.05);
    this.panner.positionY.setTargetAtTime(opts.trainPos.y, now, 0.05);
    this.panner.positionZ.setTargetAtTime(opts.trainPos.z, now, 0.05);
    this.falls.panner.positionX.value = opts.fallsPos.x;
    this.falls.panner.positionY.value = opts.fallsPos.y;
    this.falls.panner.positionZ.value = opts.fallsPos.z;

    const v = Math.min(1, opts.speed / 9);
    // chuffs and clatter locked to the simulation's wheel / rail events
    const nc = Math.min(3, opts.chuffs - this.lastChuff);
    for (let i = 0; i < nc; i++) this.chuff(opts.speed);
    this.lastChuff = opts.chuffs;
    const nj = Math.min(3, opts.joints - this.lastJoint);
    for (let i = 0; i < nj; i++) this.clack(opts.speed);
    this.lastJoint = opts.joints;

    this.rumble.gain.gain.setTargetAtTime(0.5 * v, now, 0.15);
    this.rumble.filter.frequency.setTargetAtTime(150 + 160 * v, now, 0.2);
    this.hiss.gain.gain.setTargetAtTime(0.02 + 0.5 * opts.steam, now, 0.1);

    // ambience
    const gust = 0.55 + 0.45 * Math.sin(opts.time * 0.21) * Math.sin(opts.time * 0.07 + 1.3);
    const alt = Math.min(1, Math.max(0, (opts.camHeight - 10) / 100));
    this.wind.gain.gain.setTargetAtTime(0.045 + 0.1 * gust + 0.06 * alt, now, 0.4);
    this.wind.filter.frequency.setTargetAtTime(320 + 260 * gust, now, 0.3);
    const rn = Math.max(0, 1 - opts.riverDist / 90);
    this.river.gain.gain.setTargetAtTime(0.012 + 0.07 * rn * rn, now, 0.3);
    const dFalls = c.distanceTo(opts.fallsPos);
    this.falls.gain.gain.setTargetAtTime(0.55, now, 0.5);
    void dFalls;

    if (opts.time > this.nextBird) {
      this.bird();
      this.nextBird = opts.time + 3 + Math.random() * 9;
    }
    this.lastT = opts.time;
  }
}
