const CROSSFADE = 1.4;

function loopBed(context, buffer, destination, offset, pan) {
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(destination);
  let stopped = false;

  const schedule = (when, startOffset) => {
    if (stopped) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = 0.97 + Math.random() * 0.06;
    const length = (buffer.duration - startOffset) / source.playbackRate.value;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(1, when + CROSSFADE);
    gain.gain.setValueAtTime(1, when + length - CROSSFADE);
    gain.gain.linearRampToValueAtTime(0.0001, when + length);
    source.connect(gain).connect(panner);
    source.start(when, startOffset);
    source.stop(when + length);
    const next = when + length - CROSSFADE;
    window.setTimeout(() => schedule(next, Math.random() * 1.5), Math.max(0, (next - context.currentTime - 1) * 1000));
  };
  schedule(context.currentTime + 0.05, offset);
  return () => { stopped = true; };
}

export function createAudio() {
  let context = null;
  let master = null;
  let thunder = null;
  let thunderTimer = 0;
  let muted = false;
  let starting = null;

  const rumble = () => {
    if (!context || !thunder) return;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = thunder;
    source.playbackRate.value = 0.72 + Math.random() * 0.2;
    filter.type = 'lowpass';
    filter.frequency.value = 520 + Math.random() * 520;
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.42 + Math.random() * 0.3, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + thunder.duration / source.playbackRate.value);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    thunderTimer = window.setTimeout(rumble, 26000 + Math.random() * 42000);
  };

  async function start() {
    if (context) return context.resume();
    if (starting) return starting;
    starting = (async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
      await context.resume();
      master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const { RECORDINGS } = await import('./recordings.js');
      const decode = async (uri) => context.decodeAudioData(await (await fetch(uri)).arrayBuffer());
      const [rain, storm] = await Promise.all([decode(RECORDINGS.rain), decode(RECORDINGS.thunder)]);
      thunder = storm;

      const bed = context.createGain();
      bed.gain.value = 0.58;
      const shelf = context.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = 5200;
      shelf.gain.value = -3;
      bed.connect(shelf).connect(master);
      loopBed(context, rain, bed, 0, -0.55);
      loopBed(context, rain, bed, Math.min(4.2, rain.duration * 0.4), 0.55);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.9, context.currentTime + 2.5);
      thunderTimer = window.setTimeout(rumble, 14000);
    })();
    return starting;
  }

  return {
    start,
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      if (context && master) master.gain.setTargetAtTime(muted ? 0 : 0.9, context.currentTime, 0.08);
      return muted;
    },
    dispose() {
      window.clearTimeout(thunderTimer);
      context?.close();
    },
  };
}
