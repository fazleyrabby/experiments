import { FLIGHT_START, LANDING_TIME, smooth } from './flight.js';

// Generated locally with Web Audio. Levels follow replay time, including slow motion,
// seeking, looping, and pauses; no sound files or background audio are required.
export function createFlightAudio() {
  let context, master, motor, harmonic, road, wind, jet, rumble, impact;
  let motorGain, harmonicGain, roadGain, windGain, jetGain, rumbleGain, impactGain;
  const targets = new WeakMap();
  function set(parameter, value, response = .035) {
    if (Math.abs((targets.get(parameter) ?? Infinity) - value) < .0001) return;
    targets.set(parameter, value);
    parameter.setTargetAtTime(value, context.currentTime, response);
  }
  function gain() {
    const node = context.createGain();
    node.gain.value = 0;
    node.connect(master);
    return node;
  }
  function oscillator(type, output) {
    const node = context.createOscillator();
    node.type = type;
    node.connect(output);
    node.start();
    return node;
  }
  function filteredNoise(buffer, type, frequency, output) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = .65;
    source.connect(filter).connect(output);
    source.start();
    return filter;
  }
  function init() {
    if (context) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    context = new Audio();
    master = context.createGain();
    master.gain.value = 0;
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -8;
    compressor.knee.value = 6;
    compressor.ratio.value = 12;
    compressor.attack.value = .003;
    compressor.release.value = .12;
    master.connect(compressor).connect(context.destination);
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    motorGain = gain(); harmonicGain = gain(); roadGain = gain(); windGain = gain();
    jetGain = gain(); rumbleGain = gain(); impactGain = gain();
    motor = oscillator('sine', motorGain);
    harmonic = oscillator('triangle', harmonicGain);
    impact = oscillator('sine', impactGain);
    road = filteredNoise(buffer, 'lowpass', 450, roadGain);
    wind = filteredNoise(buffer, 'bandpass', 700, windGain);
    jet = filteredNoise(buffer, 'bandpass', 1400, jetGain);
    rumble = filteredNoise(buffer, 'lowpass', 150, rumbleGain);
  }
  function start() {
    try {
      init();
      // Called only from Play or the mute button, so browser audio is unlocked
      // by a user gesture. Do not let unavailable audio interrupt the simulation.
      if (context && context.state !== 'running') context.resume().catch(error => console.warn('Audio could not start. Click the speaker button to retry.', error));
    } catch (error) {
      console.error('Flight audio initialization failed', error);
      context?.close().catch(() => {});
      context = undefined;
    }
  }
  function update(flight, { playing, muted, rate, hidden }) {
    if (!context || !master) return;
    const active = playing && !muted && !hidden;
    set(master.gain, active ? .9 : 0, .018);
    const speed = Math.min(1, flight.speed / 52);
    const onRamp = 1 - smooth((flight.time - FLIGHT_START) / .22);
    const onGround = smooth((flight.time - LANDING_TIME) / .12);
    const contact = Math.max(onRamp, onGround);
    const pitchScale = Math.sqrt(rate);
    set(motor.frequency, (85 + speed * 340) * pitchScale);
    set(harmonic.frequency, (170 + speed * 680) * pitchScale);
    set(motorGain.gain, (.018 + speed * (.1 + contact * .26)));
    set(harmonicGain.gain, speed * (.025 + contact * .04));
    set(road.frequency, 250 + speed * 550);
    set(roadGain.gain, speed * contact * .22);
    set(wind.frequency, 500 + speed * 900);
    set(windGain.gain, speed * .1);
    set(jet.frequency, (900 + flight.thrust * 1000) * pitchScale);
    set(jetGain.gain, Math.pow(flight.thrust, .8) * .8);
    const elapsed = flight.time - LANDING_TIME;
    const landing = elapsed >= 0 ? Math.min(1, elapsed / .025) * Math.exp(-elapsed * 5.5) : 0;
    set(impact.frequency, (38 + landing * 43) * pitchScale);
    set(impactGain.gain, landing * .65, .008);
    set(rumbleGain.gain, landing * 1.2 + flight.thrust * onGround * .2, .012);
  }
  function silence() { if (context && master) set(master.gain, 0, .012); }
  function suspend() { silence(); context?.suspend().catch(() => {}); }
  return { start, update, silence, suspend };
}
