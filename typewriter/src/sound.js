export class TypewriterSound {
  enabled = true;
  context = null;
  destination = null;

  async unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.destination = this.context.createMediaStreamDestination();
      this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * .14, this.context.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.context.state === 'suspended') await this.context.resume();
  }

  output(node) {
    node.connect(this.context.destination);
    node.connect(this.destination);
  }

  strike(isSpace = false) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = isSpace ? 750 : 1600 + Math.random() * 850;
    filter.Q.value = .6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(isSpace ? .1 : .17, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .045);
    noise.connect(filter).connect(gain);
    this.output(gain);
    noise.start(now);
    noise.stop(now + .07);
    this.tone(isSpace ? 115 : 180 + Math.random() * 45, .035, .055, now + .012);
    this.tone(3100 + Math.random() * 400, .006, .014, now);
  }

  tone(frequency, volume, duration, when = this.context.currentTime) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.setValueAtTime(frequency, when);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .6, when + duration);
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(.001, when + duration);
    oscillator.connect(gain);
    this.output(gain);
    oscillator.start(when);
    oscillator.stop(when + duration);
  }

  bell() {
    if (!this.enabled || !this.context) return;
    this.tone(2093, .045, .6);
    this.tone(4186, .012, .4);
  }

  carriage() {
    if (!this.enabled || !this.context) return;
    for (let i = 0; i < 8; i++) this.tone(120 + i * 16, .012, .035, this.context.currentTime + i * .025);
  }
}
