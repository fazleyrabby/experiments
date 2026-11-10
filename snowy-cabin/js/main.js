import { W, H, clamp } from './util.js';
import { Renderer } from './render.js';
import { AudioEngine } from './audio.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#scene');

// --------------------------------------------------------------- state
const MOODS = {
  quiet: { name: 'Quiet snowfall', snow: 0.4, wind: 0.15, aurora: 0.7 },
  clear: { name: 'Clear and still', snow: 0.04, wind: 0.04, aurora: 0.3 },
  lights: { name: 'Northern lights', snow: 0.12, wind: 0.08, aurora: 1 },
  blizzard: { name: 'Blizzard', snow: 1, wind: 0.95, aurora: 0.2 },
};

const state = {
  t: 0,
  snow: 0.4,
  snowTarget: 0.4,
  windTarget: 0.15,
  aurora: 0.7,
  auroraTarget: 0.7,
  playing: false,
  mood: 'quiet',
  wind: { speed: 0.1, lean: 0.1, osc: 0.2 },
};

const audio = new AudioEngine();
let renderer;
try {
  renderer = new Renderer(canvas, {
    onThump: (x, p) => audio.thump(x, p),
    onStep: (x) => audio.crunch(x),
    onHoot: (x) => audio.hoot(x),
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
const snowName = (v) => (v < 0.03 ? 'None' : v < 0.2 ? 'Flurries' : v < 0.5 ? 'Steady' : v < 0.8 ? 'Heavy' : 'Whiteout');
const windName = (v) => (v < 0.06 ? 'Still' : v < 0.3 ? 'Breeze' : v < 0.6 ? 'Gusty' : v < 0.85 ? 'Strong' : 'Gale');
const auroraName = (v) => (v < 0.04 ? 'Off' : v < 0.35 ? 'Faint' : v < 0.75 ? 'Bright' : 'Blazing');

function syncUI() {
  $('#snow').value = Math.round(state.snowTarget * 100);
  $('#snowVal').textContent = snowName(state.snowTarget);
  $('#wind').value = Math.round(state.windTarget * 100);
  $('#windVal').textContent = windName(state.windTarget);
  $('#aurora').value = Math.round(state.auroraTarget * 100);
  $('#auroraVal').textContent = auroraName(state.auroraTarget);
  document.querySelectorAll('[data-mood]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mood === state.mood)));
  $('#play').setAttribute('aria-pressed', String(state.playing));
  $('#play').setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
}

function setMood(key, instant = false) {
  const m = MOODS[key];
  if (!m) return;
  state.mood = key;
  state.snowTarget = m.snow;
  state.windTarget = m.wind;
  state.auroraTarget = m.aurora;
  if (instant) {
    state.snow = m.snow;
    state.aurora = m.aurora;
    state.wind.speed = m.wind;
  }
  syncUI();
}
const manual = (key, v) => {
  state[key] = clamp(v, 0, 1);
  state.mood = '';
  syncUI();
};

document.querySelectorAll('[data-mood]').forEach((b) => b.addEventListener('click', () => setMood(b.dataset.mood)));
$('#snow').addEventListener('input', (e) => manual('snowTarget', e.target.value / 100));
$('#wind').addEventListener('input', (e) => manual('windTarget', e.target.value / 100));
$('#aurora').addEventListener('input', (e) => manual('auroraTarget', e.target.value / 100));

function setPlaying(p) {
  state.playing = p;
  audio.setPaused(!p);
  syncUI();
}
$('#play').addEventListener('click', () => setPlaying(!state.playing));

// sound
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

// keyboard
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === ' ' && !(e.target.matches && e.target.matches('button'))) {
    e.preventDefault();
    if (started) setPlaying(!state.playing);
  } else if (k === 'm') $('#sound').click();
  else if (k === 'f') toggleFS();
  else if (k === 'arrowup') manual('snowTarget', state.snowTarget + 0.05);
  else if (k === 'arrowdown') manual('snowTarget', state.snowTarget - 0.05);
  else if (k === 'arrowright') manual('windTarget', state.windTarget + 0.05);
  else if (k === 'arrowleft') manual('windTarget', state.windTarget - 0.05);
  else if (k === 'd') renderer.deer.summon();
  else if (k >= '1' && k <= '4') setMood(Object.keys(MOODS)[Number(k) - 1]);
});

// idle UI hide
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
  const bar = $('#loadbar');
  try {
    await audio.start((p, name) => {
      bar.style.width = Math.round(p * 100) + '%';
      $('#loadmsg').textContent = name === 'fire' ? 'Lighting the fire…' : 'Gathering the wind…';
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
let gustPhase = 0;
let capturing = false;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (capturing) return;
  if (!state.playing) dt = 0;
  advance(dt);
}
function advance(dt) {
  state.t += dt;
  state.snow += (state.snowTarget - state.snow) * Math.min(1, dt * 0.7);
  state.aurora += (state.auroraTarget - state.aurora) * Math.min(1, dt * 0.5);

  // wind breathes in gusts around its set point
  gustPhase += dt;
  const g = 0.5 + 0.5 * Math.sin(gustPhase * 0.31) * Math.sin(gustPhase * 0.83 + 1.2);
  const speed = clamp(state.windTarget * (0.5 + 0.95 * g) + 0.02, 0, 1);
  state.wind.speed += (speed - state.wind.speed) * Math.min(1, dt * 1.4);
  state.wind.lean = clamp(state.wind.speed * 1.1, 0, 1.1);
  state.wind.osc = 0.14 + state.wind.speed * 0.9;

  renderer.frame(state, dt);
  if (audio.ready) audio.update(dt, { snow: state.snow, wind: state.wind.speed, t: state.t });
}

// first frame behind the intro
setMood('quiet', true);
renderer.frame(state, 0);
syncUI();
requestAnimationFrame((t) => {
  last = t;
  loop(t);
});
window.__sc = { state, renderer, audio, setMood, step: advance, capture: (v) => (capturing = v) };
