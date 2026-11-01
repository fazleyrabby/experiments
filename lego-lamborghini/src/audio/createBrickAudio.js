// Procedural brick sounds, synthesised with the Web Audio API — no audio files.
// A brick "click" is a very short burst of band-passed noise (the plastic
// clack) plus a quick falling tone (the body of the knock).
//
// Browsers only allow audio after a user gesture, so the context is created
// lazily by unlock(), which main.js calls on the first pointer / key press.

const STORAGE_KEY = 'countach-sound';
/** Minimum spacing between clicks, so hundreds of bricks become a soft patter, not a roar. */
const MIN_INTERVAL = 0.055;

function readPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function writePreference(enabled) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this visit.
  }
}

export function createBrickAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const supported = Boolean(AudioContextClass);

  let enabled = supported && readPreference();
  let context = null;
  let master = null;
  let noise = null;
  let lastClick = 0;

  function ensureContext() {
    if (context || !supported) return;
    context = new AudioContextClass();

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 6;
    compressor.connect(context.destination);

    master = context.createGain();
    master.gain.value = 0.26;
    master.connect(compressor);

    // One second of white noise, shared by every click.
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  const ready = () => enabled && context !== null && context.state === 'running';

  /**
   * @param {number} mass      brick volume in stud-plates; bigger bricks sound lower
   * @param {number} loudness  0..1
   * @param {number} brightness centre frequency multiplier
   */
  function click(mass, loudness, brightness) {
    if (!ready()) return;
    const now = context.currentTime;
    if (now - lastClick < MIN_INTERVAL) return;
    lastClick = now;

    const size = Math.min(1, Math.log2(1 + mass) / 6);
    // Uneven levels keep the patter from sounding mechanical.
    const level = loudness * (0.55 + Math.random() * 0.45);
    const vary = 0.88 + Math.random() * 0.24;

    const burst = context.createBufferSource();
    burst.buffer = noise;
    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = (2300 - size * 1200) * brightness * vary;
    band.Q.value = 1.1;
    const burstGain = context.createGain();
    burstGain.gain.setValueAtTime(0.0001, now);
    burstGain.gain.exponentialRampToValueAtTime(level, now + 0.003);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    burst.connect(band).connect(burstGain).connect(master);
    burst.start(now, Math.random() * 0.9, 0.06);

    const knock = context.createOscillator();
    knock.type = 'triangle';
    const pitch = (520 - size * 300) * brightness * vary;
    knock.frequency.setValueAtTime(pitch, now);
    knock.frequency.exponentialRampToValueAtTime(pitch * 0.55, now + 0.05);
    const knockGain = context.createGain();
    knockGain.gain.setValueAtTime(0.0001, now);
    knockGain.gain.exponentialRampToValueAtTime(level * 0.4, now + 0.004);
    knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    knock.connect(knockGain).connect(master);
    knock.start(now);
    knock.stop(now + 0.07);
  }

  return {
    supported,

    get enabled() {
      return enabled;
    },

    /** Call from a user gesture: creates / resumes the audio context. */
    unlock() {
      if (!enabled) return;
      ensureContext();
      if (context?.state === 'suspended') context.resume();
    },

    /** Returns the new state. Must be called from a user gesture to take effect. */
    toggle() {
      enabled = supported && !enabled;
      writePreference(enabled);
      if (enabled) this.unlock();
      return enabled;
    },

    /** A brick clicking home onto its studs. */
    brickPlaced(mass) {
      click(mass, 0.3, 1);
    },

    /** A brick popping off during breakdown: softer and duller. */
    brickReleased(mass) {
      click(mass, 0.12, 0.6);
    },

    /** A V12 catching: starter whirr, ignition thump, a rev and a settle to idle. */
    engineStart() {
      if (!ready()) return;
      const now = context.currentTime;

      // Starter motor: a quick pulsing whirr.
      const starter = context.createOscillator();
      starter.type = 'square';
      starter.frequency.setValueAtTime(34, now);
      starter.frequency.linearRampToValueAtTime(52, now + 0.55);
      const starterFilter = context.createBiquadFilter();
      starterFilter.type = 'lowpass';
      starterFilter.frequency.value = 260;
      const starterGain = context.createGain();
      starterGain.gain.setValueAtTime(0.0001, now);
      starterGain.gain.exponentialRampToValueAtTime(0.09, now + 0.08);
      starterGain.gain.setValueAtTime(0.09, now + 0.5);
      starterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      starter.connect(starterFilter).connect(starterGain).connect(master);
      starter.start(now);
      starter.stop(now + 0.65);

      // The engine: a stack of detuned saws through a lowpass, amplitude-modulated at the firing rate.
      const start = now + 0.55;
      const engineGain = context.createGain();
      engineGain.gain.setValueAtTime(0.0001, start);
      engineGain.gain.exponentialRampToValueAtTime(0.22, start + 0.06);
      engineGain.gain.setValueAtTime(0.22, start + 1.35);
      engineGain.gain.exponentialRampToValueAtTime(0.0001, start + 3.1);
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.Q.value = 2.2;
      lowpass.frequency.setValueAtTime(380, start);
      lowpass.frequency.exponentialRampToValueAtTime(1500, start + 0.55);
      lowpass.frequency.exponentialRampToValueAtTime(520, start + 1.9);
      lowpass.connect(engineGain).connect(master);

      const lfo = context.createOscillator();
      const lfoDepth = context.createGain();
      lfo.frequency.setValueAtTime(22, start);
      lfo.frequency.exponentialRampToValueAtTime(76, start + 0.55);
      lfo.frequency.exponentialRampToValueAtTime(26, start + 1.9);
      lfoDepth.gain.value = 0.35;
      lfo.connect(lfoDepth).connect(engineGain.gain);
      lfo.start(start);
      lfo.stop(start + 3.2);

      for (const detune of [-14, 0, 11, 1200]) {
        const saw = context.createOscillator();
        saw.type = 'sawtooth';
        saw.detune.value = detune;
        saw.frequency.setValueAtTime(44, start);
        saw.frequency.exponentialRampToValueAtTime(190, start + 0.55);
        saw.frequency.exponentialRampToValueAtTime(58, start + 1.9);
        const level = context.createGain();
        level.gain.value = detune === 1200 ? 0.18 : 0.5;
        saw.connect(level).connect(lowpass);
        saw.start(start);
        saw.stop(start + 3.2);
      }
    },

    dispose() {
      context?.close();
      context = null;
    },
  };
}
