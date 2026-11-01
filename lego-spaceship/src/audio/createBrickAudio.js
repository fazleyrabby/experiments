// Procedural brick sounds, synthesised with the Web Audio API — no audio files.
// A brick "click" is a very short burst of band-passed noise (the plastic
// clack) plus a quick falling tone (the body of the knock).
//
// Browsers only allow audio after a user gesture, so the context is created
// lazily by unlock(), which main.js calls on the first pointer / key press.

const STORAGE_KEY = 'brick-labs-sound';
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

    /** Low swell as the engines spool up once the ship is complete. */
    powerUp() {
      if (!ready()) return;
      const now = context.currentTime;
      const hum = context.createOscillator();
      hum.type = 'sine';
      hum.frequency.setValueAtTime(52, now);
      hum.frequency.exponentialRampToValueAtTime(128, now + 1.3);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);
      hum.connect(gain).connect(master);
      hum.start(now);
      hum.stop(now + 2);
    },

    dispose() {
      context?.close();
      context = null;
    },
  };
}
