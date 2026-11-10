import { W, H, clamp } from './util.js';
import { Renderer } from './render.js';
import { AudioEngine } from './audio.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');
const H0 = 4.85,
  H1 = 10;

// --------------------------------------------------------------- state
const MOODS = {
  predawn: { hour: 5.05, mist: 0.6 },
  sunrise: { hour: 5.95, mist: 0.85 },
  golden: { hour: 6.55, mist: 0.6 },
  morning: { hour: 8.4, mist: 0.3 },
};

const state = { t: 0, hour: 5.95, hourTarget: null, mist: 0.85, mistTarget: 0.85, playing: false, auto: false, mood: 'sunrise' };

const audio = new AudioEngine();
let renderer;
try {
  renderer = new Renderer(canvas, {
    onHorn: (x) => audio.horn(x),
    onCaw: (x, n) => audio.caw(x, n),
    onOar: (x) => audio.oar(x),
    onSplash: (x, p) => audio.splash(x, p),
    onNet: (x) => audio.net(x),
    onSlap: (x) => audio.slap(x),
    onClink: () => audio.clink(),
  });
} catch (e) {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#fbb;padding:20px;position:fixed;inset:0;background:#200;z-index:99;white-space:pre-wrap">${e.stack || e}</pre>`);
  throw e;
}

// --------------------------------------------------------------- sizing
function fit() {
  const vw = window.innerWidth,
    vh = window.innerHeight;
  let s = Math.floor(Math.min(vw / W, vh / H));
  if (s < 1) s = Math.min(vw / W, vh / H);
  canvas.style.width = Math.round(W * s) + 'px';
  canvas.style.height = Math.round(H * s) + 'px';
  document.body.classList.toggle('fs', !!document.fullscreenElement);
  $('#scale').textContent = s >= 1 ? `${s}×` : '';
}
window.addEventListener('resize', fit);
document.addEventListener('fullscreenchange', fit);
fit();

// --------------------------------------------------------------- UI
const fmt = (h) => {
  const m = Math.round(h * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const period = (h) => (h < 5.4 ? 'Before dawn' : h < 5.8 ? 'First light' : h < 6.25 ? 'Sunrise' : h < 7.1 ? 'Golden hour' : 'Morning');
const mistName = (v) => (v < 0.08 ? 'Clear' : v < 0.35 ? 'Light' : v < 0.7 ? 'Hazy' : 'Thick');

function syncUI() {
  $('#time').value = Math.round(state.hour * 60);
  $('#timeVal').textContent = `${fmt(state.hour)} · ${period(state.hour)}`;
  $('#mist').value = Math.round(state.mistTarget * 100);
  $('#mistVal').textContent = mistName(state.mistTarget);
  document.querySelectorAll('[data-mood]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === state.mood)));
  $('#play').setAttribute('aria-pressed', String(state.playing));
  $('#play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
  $('#auto').setAttribute('aria-pressed', String(state.auto));
}
function setMood(key, instant = false) {
  const m = MOODS[key];
  if (!m) return;
  state.mood = key;
  state.mistTarget = m.mist;
  if (instant) {
    state.hour = m.hour;
    state.mist = m.mist;
    state.hourTarget = null;
  } else state.hourTarget = m.hour;
  syncUI();
}
const unmood = () => {
  state.mood = '';
  syncUI();
};
document.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => setMood(b.dataset.mood)));
$('#time').addEventListener('input', (e) => {
  state.hour = e.target.value / 60;
  state.hourTarget = null;
  unmood();
});
$('#mist').addEventListener('input', (e) => {
  state.mistTarget = e.target.value / 100;
  unmood();
});
$('#auto').addEventListener('click', () => {
  state.auto = !state.auto;
  if (state.auto && state.hour > H1 - 0.05) state.hour = H0;
  syncUI();
});
function setPlaying(p) {
  state.playing = p;
  audio.setPaused(!p);
  syncUI();
}
$('#play').addEventListener('click', () => setPlaying(!state.playing));

let soundOn = true;
function setSound(on) {
  soundOn = on;
  audio.setMuted(!on);
  $('#sound').setAttribute('aria-pressed', String(on));
  $('#sound').setAttribute('aria-label', on ? 'Mute' : 'Unmute');
}
$('#sound').addEventListener('click', async () => {
  if (!audio.ready && !audio.starting) {
    await startAudio();
    setSound(audio.ready);
    return;
  }
  setSound(!soundOn);
});
$('#vol').addEventListener('input', (e) => {
  audio.setLevel('master', e.target.value / 100);
  if (!soundOn && e.target.value > 0 && audio.ready) setSound(true);
});
document.querySelectorAll('[data-mix]').forEach((el) => el.addEventListener('input', () => audio.setLevel(el.dataset.mix, el.value / 100)));
$('#mixBtn').addEventListener('click', () => {
  const open = $('#mix').hidden;
  $('#mix').hidden = !open;
  $('#mixBtn').setAttribute('aria-expanded', String(open));
});
$('#fs').addEventListener('click', toggleFS);
function toggleFS() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
}

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === ' ' && !(e.target.matches && e.target.matches('button'))) {
    e.preventDefault();
    if (started) setPlaying(!state.playing);
  } else if (k === 'm') $('#sound').click();
  else if (k === 'f') toggleFS();
  else if (k === 'arrowright' || k === 'arrowleft') {
    state.hour = clamp(state.hour + (k === 'arrowright' ? 0.1 : -0.1), H0, H1);
    state.hourTarget = null;
    unmood();
  } else if (k === 'arrowup' || k === 'arrowdown') {
    state.mistTarget = clamp(state.mistTarget + (k === 'arrowup' ? 0.05 : -0.05), 0, 1);
    unmood();
  } else if (k === 'h') renderer.ferry.summon();
  else if (k >= '1' && k <= '4') setMood(Object.keys(MOODS)[Number(k) - 1]);
});

let idleT;
const wake = () => {
  document.body.classList.remove('idle');
  clearTimeout(idleT);
  idleT = setTimeout(() => started && !$('#dock').matches(':hover') && document.body.classList.add('idle'), 3600);
};
['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));

// --------------------------------------------------------------- start
let started = false;
async function startAudio() {
  audio.starting = true;
  try {
    await audio.start((p, name) => {
      $('#loadbar').style.width = Math.round(p * 100) + '%';
      $('#loadmsg').textContent = name === 'birds' ? 'Waking the birds…' : 'Listening to the river…';
    });
    for (const el of document.querySelectorAll('[data-mix]')) audio.setLevel(el.dataset.mix, el.value / 100);
    audio.setLevel('master', $('#vol').value / 100);
  } catch (e) {
    console.error('audio failed', e);
  }
  audio.starting = false;
}
async function enter(withSound) {
  const intro = $('#intro');
  intro.classList.add('loading');
  if (withSound) await startAudio();
  setSound(withSound && audio.ready);
  started = true;
  intro.classList.add('gone');
  setTimeout(() => (intro.hidden = true), 1400);
  setPlaying(true);
  wake();
  document.body.classList.add('live');
}
$('#enterSound').addEventListener('click', () => enter(true));
$('#enterQuiet').addEventListener('click', () => enter(false));

// --------------------------------------------------------------- loop
let last = performance.now();
let capturing = false;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (capturing) return;
  if (!state.playing) dt = 0;
  advance(dt);
}
let lastSync = '';
function advance(dt) {
  state.t += dt;
  if (state.hourTarget !== null) {
    const d = state.hourTarget - state.hour;
    const step = Math.sign(d) * Math.min(Math.abs(d), Math.max(0.25, Math.abs(d) * 1.2) * dt);
    state.hour += step;
    if (Math.abs(d) < 0.01) {
      state.hour = state.hourTarget;
      state.hourTarget = null;
    }
  } else if (state.auto && dt > 0) {
    state.hour += dt * 0.025;
    if (state.hour >= H1) {
      state.hour = H1;
      state.auto = false;
      syncUI();
    }
  }
  state.mist += (state.mistTarget - state.mist) * Math.min(1, dt * 0.8);
  const s = fmt(state.hour);
  if (s !== lastSync) {
    lastSync = s;
    $('#time').value = Math.round(state.hour * 60);
    $('#timeVal').textContent = `${s} · ${period(state.hour)}`;
  }
  renderer.frame(state, dt);
  if (audio.ready) {
    const L = renderer.L;
    audio.update(dt, { hour: state.hour, day: L.day, night: L.night });
  }
}

setMood('sunrise', true);
renderer.frame(state, 0);
syncUI();
requestAnimationFrame((t) => {
  last = t;
  loop(t);
});
window.__rg = { state, renderer, audio, setMood, step: advance, capture: (v) => (capturing = v) };
