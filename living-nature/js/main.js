import { W, H, clamp, smooth, wrap } from './util.js';
import { computeLook, weatherTarget } from './look.js';
import { buildMasks } from './geometry.js';
import { buildBackdrop, buildLand } from './terrain.js';
import { buildSprites, buildLayout, sprites } from './layout.js';
import { World, windAt } from './world.js';
import { Scene } from './render.js';
import { NatureAudio } from './audio.js';
import { birdAct, frogAct } from './activity.js';
import { buildUI } from './ui.js';

const canvas = document.getElementById('stage');
const state = {
  hour: 6.9, playing: true, weather: 'clear', wx: { cover: 0.14, rain: 0, fog: 0 }, t: 0, dayLength: 270, dirty: true,
};

const audio = new NatureAudio();
const hooks = {
  birdCall: (b) => audio.birdCall(b),
  frogCroak: (f) => audio.frogCroak(f),
  splash: (s) => audio.splash(s),
};
const masks = buildMasks();
const backdrop = buildBackdrop();
const S = buildSprites();
const layout = buildLayout(S, masks);
const land = buildLand(masks, layout.ao);
const world = new World(layout, hooks);
const scene = new Scene(canvas, { S, layout, backdrop, land, masks, world, sprites });
window.nature = { state, scene, world, audio };

// ---- integer pixel scaling with nearest-neighbour ----
function fit() {
  const dpr = window.devicePixelRatio || 1;
  const s = Math.min((innerWidth * dpr) / W, (innerHeight * dpr) / H);
  let k = Math.floor(s);
  if (k < 1 || (s - k) / k > 0.2) k = s;
  canvas.style.width = (W * k) / dpr + 'px';
  canvas.style.height = (H * k) / dpr + 'px';
}
addEventListener('resize', fit);
fit();

// ---- controls ----
const ui = buildUI({
  state, audio,
  onTime: (h) => { state.hour = h; state.dirty = true; },
  onWeather: (w) => { state.weather = w; },
  onPlay: () => { state.playing = !state.playing; audio.setPaused(!state.playing); },
  onSound: async (forceOn) => {
    if (!audio.enabled) { await audio.enable(); audio.setMuted(false); }
    else if (!forceOn) audio.setMuted(!audio.muted);
  },
  onFullscreen: () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); },
});
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.key !== ' ') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); document.getElementById('play').click(); }
  else if (k === 'm') document.getElementById('sound').click();
  else if (k === 'f') document.getElementById('full').click();
  else if (k === 'arrowright') { state.hour = wrap(state.hour + 0.25, 24); state.dirty = true; }
  else if (k === 'arrowleft') { state.hour = wrap(state.hour - 0.25, 24); state.dirty = true; }
  else if ('1234'.includes(k) && k) { document.querySelectorAll('[data-wx]')[+k - 1]?.click(); }
});
document.addEventListener('visibilitychange', () => {
  if (!audio.ctx || !audio.enabled) return;
  if (document.hidden) audio.ctx.suspend();
  else if (state.playing) audio.ctx.resume();
});

// pointer parallax: looking around also moves the listener
const cam = { x: 0, tx: 0 };
addEventListener('pointermove', (e) => { cam.tx = clamp((e.clientX / innerWidth - 0.5) * 2, -1, 1); });

function frameEnv(look, wind) {
  const rain = state.wx.rain;
  return {
    look, wind, rain, hour: look.hour, night: look.night, cover: look.cover, mist: look.mist, lights: look.lights, windT: state.t, camX: cam.x,
    birdActivity: birdAct(look.hour) * (1 - rain * 0.85) * (1 - look.cover * 0.2),
    frogActivity: frogAct(look.hour, rain),
    fishAct: clamp(look.day * 0.9 + 0.3) * (1 - rain * 0.6),
    butterflyVis: clamp(smooth(0.1, 0.5, look.day) * (1 - rain * 1.5) * (1 - look.cover * 0.5) * (1 - look.mist * 0.4)),
    fireflyVis: smooth(0.5, 0.95, look.night) * (1 - rain * 0.9),
    dirty: state.dirty,
  };
}

const CAPTURE = new URLSearchParams(location.search).has('capture');
let tintClock = 0, first = true;

// One simulation + render step. `dt` seconds; used by the live loop and by the offline capture.
function tick(dt, force) {
  if (!state.playing) dt = 0;
  state.t += dt;
  if (state.playing && !force) state.hour = wrap(state.hour + (dt * 24) / state.dayLength, 24);
  const tw = weatherTarget(state.weather);
  const k = 1 - Math.exp(-dt * 0.45);
  state.wx.cover += (tw.cover - state.wx.cover) * k;
  state.wx.rain += (tw.rain - state.wx.rain) * k * 1.2;
  state.wx.fog += (tw.fog - state.wx.fog) * k * 0.8;
  cam.tx += Math.sin(state.t * 0.05) * 0.0006;
  cam.x += (cam.tx - cam.x) * (1 - Math.exp(-dt * 2.2));
  scene.cam.x = cam.x;
  const look = computeLook(state.hour, state.wx);
  const wind = windAt(state.t, state.wx.rain);
  const e = frameEnv(look, wind);
  tintClock -= dt || 0.016;
  if (first || state.dirty || tintClock <= 0) { scene.retint(look); tintClock = 0.14; }
  world.update(dt, e);
  if (!CAPTURE) audio.update(dt, e);
  scene.frame(state.t, e, wind);
  state.dirty = false;
  first = false;
  return e;
}

if (!CAPTURE) {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    ui.update(state.hour);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
} else {
  // Offline capture API (see tools/capture.mjs): deterministic stepping, event log, offline soundtrack.
  const log = { env: [], events: [] };
  hooks.birdCall = (d) => log.events.push({ t: state.t, type: 'bird', data: d });
  hooks.frogCroak = (d) => log.events.push({ t: state.t, type: 'frog', data: d });
  hooks.splash = (d) => log.events.push({ t: state.t, type: 'splash', data: d });
  window.__cap = {
    log,
    set(o) {
      if (o.weather) state.weather = o.weather;
      if (o.camTarget !== undefined) cam.tx = o.camTarget;
      if (o.hour !== undefined) { state.hour = o.hour; }
    },
    step(dt, hour, focus) {
      state.hour = hour;
      const e = tick(dt, true);
      log.env.push({ t: state.t, hour: e.hour, wind: e.wind, windT: e.windT, rain: e.rain, cover: e.cover, mist: e.mist, lights: e.lights, night: e.night, camX: e.camX, focus });
    },
    // 1920x1080 frame; view = {cx, cy, z} crops into the scene (centre in land coordinates, z = zoom)
    png(view) {
      if (!this._big) {
        this._big = document.createElement('canvas'); this._big.width = 1920; this._big.height = 1080;
        this._out = document.createElement('canvas'); this._out.width = 1920; this._out.height = 1080;
        this._big.getContext('2d').imageSmoothingEnabled = false;
      }
      const b = this._big.getContext('2d');
      b.drawImage(canvas, 0, 0, 1920, 1080); // exact 4x nearest-neighbour
      if (!view || view.z <= 1.001) return this._big.toDataURL('image/png').split(',')[1];
      const o = this._out.getContext('2d');
      o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high';
      const w = 480 / view.z, h = 270 / view.z;
      const cx = Math.min(480 - w / 2, Math.max(w / 2, view.cx - Math.round(cam.x * 13))); // follow the land layer's parallax
      const cy = Math.min(270 - h / 2, Math.max(h / 2, view.cy));
      o.drawImage(this._big, (cx - w / 2) * 4, (cy - h / 2) * 4, w * 4, h * 4, 0, 0, 1920, 1080);
      return this._out.toDataURL('image/png').split(',')[1];
    },
    async audio(duration, volume) {
      const a = new NatureAudio();
      const buf = await a.renderOffline({ duration, envLog: log.env, events: log.events, volume });
      const ch = [buf.getChannelData(0), buf.getChannelData(1)];
      const n = buf.length, out = new DataView(new ArrayBuffer(44 + n * 4));
      const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true);
      out.setUint32(24, buf.sampleRate, true); out.setUint32(28, buf.sampleRate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
      for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) out.setInt16(44 + i * 4 + c * 2, Math.max(-1, Math.min(1, ch[c][i])) * 32767, true);
      const bytes = new Uint8Array(out.buffer);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    },
  };
}
