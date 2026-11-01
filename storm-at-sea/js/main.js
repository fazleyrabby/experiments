import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { WaveField } from './waves.js';
import { createOcean } from './ocean.js';
import { createSky, createSkyMaterial } from './sky.js';
import { buildShip } from './ship.js';
import { ShipMotion } from './motion.js';
import { Rain, Lightning, Particles } from './weather.js';
import { StormAudio } from './audio.js';
import { makeWaterNormalMap, makeFoamMap } from './textures.js';
import { TIERS, detectTier } from './quality.js';
import { HERO_SHIPS } from './presets.js';
import { Atmosphere, TIMES, WEATHERS } from './atmosphere.js';
import { SeaLife } from './creatures.js';
import { buildCruiseShip } from './cruise.js';
import { Voyage } from './voyage.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const status = (s) => { const el = $('loadStatus'); if (el) el.textContent = s; };
const nextFrame = () => new Promise((r) => setTimeout(r, 16));

/* ------------------------------------------------------------- renderer */
const CAPTURE = new URLSearchParams(location.search).has('capture');
const canvas = $('scene');
const Q = CAPTURE ? TIERS.high : detectTier();
// MSAA happens in the composer's render target, so the canvas itself needs none
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: CAPTURE });
const DPR_CAP = CAPTURE ? 1 : Math.min(window.devicePixelRatio, 1.5);
let DPR = CAPTURE ? 1 : Math.min(window.devicePixelRatio, Q.dprMax);
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 1.0, 40000);

/* ---------------------------------------------------------- environment */
const WIND_ANGLE = 0.35;
const windDir = new THREE.Vector2(Math.cos(WIND_ANGLE), Math.sin(WIND_ANGLE));
const C = (h) => new THREE.Color(h);
const env = {
  uTime: { value: 0 },
  uFlash: { value: 0 },
  uFlashDir: { value: new THREE.Vector3(0, 1, 0) },
  uFlashPos: { value: new THREE.Vector3(0, 0, 3000) },
  uFlashColor: { value: C('#c3d3ff') },
  uFogColor: { value: C('#424c53') },
  uFogDensity: { value: 0.00031 },
  uAmbient: { value: C('#3b464d') },
  uWindDir: { value: windDir },
  uStorm: { value: 1 },
  uSkyTop: { value: C('#1a2027') },
  uSkyHorizon: { value: C('#525c63') },
  uKeyDir: { value: new THREE.Vector3(-0.55, 0.22, -0.8).normalize() },
  uKeyColor: { value: C('#8a8f8c') },
  uCover: { value: 0.95 },
  uSunVis: { value: 0 },
  uStars: { value: 0 },
  uDisc: { value: 1 },
  uMoon: { value: 0 },
};

const params = new URLSearchParams(location.search);
const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const atmos = new Atmosphere(
  TIMES[params.get('time')] ? params.get('time') : TIMES[stored('storm.time')] ? stored('storm.time') : 'day',
  WEATHERS[params.get('weather')] ? params.get('weather') : WEATHERS[stored('storm.weather')] ? stored('storm.weather') : 'storm',
);
scene.fog = new THREE.FogExp2(env.uFogColor.value.clone(), env.uFogDensity.value);

const hemi = new THREE.HemisphereLight(C('#93a2ae'), C('#18272c'), 1.25);
scene.add(hemi);
const key = new THREE.DirectionalLight(C('#b9c0c4'), 0.9);
key.position.copy(env.uKeyDir.value).multiplyScalar(1000);
scene.add(key);
const flashLight = new THREE.DirectionalLight(C('#d6e2ff'), 0);
scene.add(flashLight, flashLight.target);

const waves = new WaveField(WIND_ANGLE);

/* ---------------------------------------------------------------- build */
let pmrem, envScene, envTimers = [];
let sealife;
let hero, fleet, ocean, sky, rain, lightning, particles, composer, bloom, grainPass, controls;
const audio = new StormAudio();

async function build() {
  status('Generating sea surface…'); await nextFrame();
  const normalMap = makeWaterNormalMap(256);
  const foamMap = makeFoamMap(256);
  ocean = createOcean(waves, env, normalMap, foamMap, { rings: Q.oceanRings, segs: Q.oceanSegs, detail: Q.waterDetail, lights: Q.name === 'low' ? 4 : 8 });
  scene.add(ocean.mesh);
  sky = createSky(env, Q.skyOctaves);
  scene.add(sky);

  status('Building storm deck…'); await nextFrame();
  pmrem = new THREE.PMREMGenerator(renderer);
  envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 64, 32), createSkyMaterial(env, Q.skyOctaves)));
  applyAtmosphere(0);
  refreshEnv();

  status('Welding the hull…'); await nextFrame();
  hero = heroShip(heroKey);
  scene.add(hero.group);
  status('Loading containers…'); await nextFrame();
  const s2 = buildShip({ L: 262, seed: 11, name: 'KESTREL BAY', brand: 'ORIENTA', hull: '#1c4b48', funnelBand: '#2b6db2', funnelBase: '#e2e0d8', stackMax: 8, texW: Q.shipTexW, floors: 8 });
  scene.add(s2.group);
  const s3 = Q.extraShips > 1 ? buildShip({ L: 198, seed: 23, name: 'AURORA', brand: 'HANSEMAR', hull: '#4a1b19', funnelBand: '#1d1d1d', stackMax: 6, texW: Q.shipTexW, floors: 6 }) : null;
  if (s3) scene.add(s3.group);

  const heading = -(WIND_ANGLE + Math.PI - 0.38);
  const F = new THREE.Vector2(Math.cos(heading), -Math.sin(heading));
  const Rt = new THREE.Vector2(Math.sin(heading), Math.cos(heading));
  fleet = [
    new ShipMotion(hero, waves, { x: 0, z: 0, heading, speed: 5.2 }),
    new ShipMotion(s2, waves, { x: F.x * 1150 - Rt.x * 900, z: F.y * 1150 - Rt.y * 900, heading: heading + 0.06, speed: 5.6 }),
  ];
  if (s3) fleet.push(new ShipMotion(s3, waves, { x: -F.x * 700 + Rt.x * 1250, z: -F.y * 700 + Rt.y * 1250, heading: heading - 0.05, speed: 4.6 }));
  fleet.forEach((m) => { m.onSlam = onSlam; });

  status('Charging the clouds…'); await nextFrame();
  rain = new Rain(Q.rain, env);
  scene.add(rain.mesh);
  particles = new Particles(Q.particles, env, foamMap);
  const ps = renderer.getContext().getParameter(renderer.getContext().ALIASED_POINT_SIZE_RANGE);
  if (ps) particles.uniforms.uMaxPoint.value = Math.min(720, ps[1]);
  scene.add(particles.points);
  sealife = new SeaLife(scene, waves, particles, { dolphins: Q.name === 'low' ? 4 : 8, whale: true });
  sealife.onSplash = (pt, I) => {
    _v.set(pt.x, 0, pt.z);
    audio.slam(I * 0.5, THREE.MathUtils.clamp(140 / camera.position.distanceTo(_v), 0.03, 1), panOf(_v));
  };
  lightning = new Lightning(scene, env);
  lightning.onStrike = onStrike;

  /* post */
  const rt = new THREE.WebGLRenderTarget(innerWidth * DPR, innerHeight * DPR, { type: THREE.HalfFloatType, samples: Q.msaa });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.65, 0.9);
  bloom.enabled = Q.bloom;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  grainPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 }, uSat: { value: 0.86 }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uFlash, uSat; uniform vec2 uRes; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec3 c = texture2D(tDiffuse, vUv).rgb;
        float l = dot(c, vec3(0.299,0.587,0.114));
        c = mix(vec3(l), c, uSat);                      // storm light is desaturated, clear light isn't
        c *= vec3(0.97, 1.0, 1.03);
        vec2 q = vUv - 0.5;
        c *= 1.0 - dot(q, q) * (0.9 - uFlash * 0.25);  // vignette
        c += (h(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.035;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  composer.addPass(grainPass);

  /* camera */
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 45;
  controls.maxDistance = 2600;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 14, 0);
  controls.addEventListener('start', () => { userIdle = 0; cine.paused = true; });
  setShot(0, true);
}

/* ----------------------------------------------------------- ship select */
const shipCache = {};
let heroKey = (() => {
  const q = new URLSearchParams(location.search).get('ship');
  if (q && HERO_SHIPS[q]) return q;
  try { const v = localStorage.getItem('storm.ship'); if (v && HERO_SHIPS[v]) return v; } catch {}
  return 'meridian';
})();

function heroShip(key) {
  if (!shipCache[key]) {
    const p = HERO_SHIPS[key];
    const opts = { ...p.opts, texW: Q.heroTexW, spots: Q.name !== 'low' };
    shipCache[key] = p.kind === 'cruise' ? buildCruiseShip(opts) : buildShip(opts);
  }
  return shipCache[key];
}

function switchShip(key) {
  if (!HERO_SHIPS[key] || key === heroKey) return;
  heroKey = key;
  const next = heroShip(key);
  scene.remove(hero.group);
  hero = next;
  scene.add(hero.group);
  fleet[0].setShip(hero);
  fleet[0].update(0, time);
  try { localStorage.setItem('storm.ship', key); } catch {}
  syncShipUi();
  updateUrl();
}

function syncShipUi() {
  const p = HERO_SHIPS[heroKey];
  $('tShip').textContent = p.tag;
  $('shipNote').textContent = p.note || '';
  document.querySelectorAll('[data-ship]').forEach((b) => {
    const on = b.dataset.ship === heroKey;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

/* --------------------------------------------------------------- events */
function heroDist(p) { return camera.position.distanceTo(p); }

function panOf(p) {
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const d = new THREE.Vector3().subVectors(p, camera.position).normalize();
  return right.dot(d);
}

const eventLog = [];
function onStrike(ev) {
  const dist = Math.hypot(ev.pos.x - camera.position.x, ev.pos.z - camera.position.z);
  eventLog.push({ type: 'thunder', t: time, dist: Math.max(150, dist), pan: panOf(ev.mid), cloud: ev.kind === 'cloud' });
  audio.thunder(Math.max(150, dist), panOf(ev.mid), ev.kind === 'cloud');
  if (ev.kind === 'bolt' && dist < 900) {
    const delay = 0.08 + dist / 480;
    setTimeout(() => { shake = Math.max(shake, (900 - dist) / 900 * 1.4); }, delay * 1000);
  }
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion();
function onSlam(m, I) {
  const s = m.ship, g = s.group;
  g.updateMatrixWorld();
  _q.setFromRotationMatrix(g.matrixWorld);
  const f = m.forward;
  const n = Math.floor(170 * I * (m === fleet[0] ? 1 : 0.6));
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const lx = s.L / 2 - 3 - Math.pow(Math.random(), 1.6) * 34;
    const lz = side * (s.halfB(Math.min(lx, s.L / 2 - 1)) + 0.6);
    _v.set(lx, s.deckY(lx) - 4 + Math.random() * 5, lz).applyMatrix4(g.matrixWorld);
    _w.set(1 + Math.random() * 5, (7 + Math.random() * 19) * I, side * (4 + Math.random() * 13) * I).applyQuaternion(_q);
    particles.emit(_v.x, _v.y, _v.z, _w.x + f.x * m.speed, _w.y, _w.z + f.y * m.speed,
      1.6 + Math.random() * 2.0, 2 + Math.random() * 3, 9 + Math.random() * 16 * I, 0.38 + Math.random() * 0.3, 1, 6.5, 0.3);
  }
  // green water sheet over the bow
  for (let i = 0; i < 40 * I; i++) {
    _v.set(s.L / 2 - 2 - Math.random() * 8, s.deckY(s.L / 2) + Math.random() * 2, (Math.random() - 0.5) * 8).applyMatrix4(g.matrixWorld);
    _w.set(-3 - Math.random() * 6, (10 + Math.random() * 14) * I, (Math.random() - 0.5) * 8).applyQuaternion(_q);
    particles.emit(_v.x, _v.y, _v.z, _w.x, _w.y, _w.z, 1.8 + Math.random() * 1.6, 3, 14 + Math.random() * 10, 0.5, 1, 8, 0.25);
  }
  _v.set(s.L / 2, 0, 0).applyMatrix4(g.matrixWorld);
  const d = heroDist(_v);
  audio.slam(I, THREE.MathUtils.clamp(180 / d, 0.04, 1), panOf(_v));
  eventLog.push({ type: 'slam', t: time, I, att: THREE.MathUtils.clamp(180 / d, 0.04, 1), pan: panOf(_v) });
  if (m === fleet[0] && d < 260) shake = Math.max(shake, 0.25 * I);
  if (m === fleet[0] && view === 'bridge') { splashGlass(Math.round(70 * I), true); shake = Math.max(shake, 0.5 * I); }
}

/* --------------------------------------------------------- cinematics */
const SHOTS = [
  { name: 'Overhead', f: (t) => [215 - t * 1.6, 105 - t * 0.9, 25 + t * 2.2], look: [40, 0, 0] },
  { name: 'Low starboard', f: (t) => [70 - t * 7, 10 + Math.sin(t * 0.35) * 2, 135], look: [0, 6, 0] },
  { name: 'Storm wide', f: (t) => [-120 + t * 3, 55, -430 + t * 4], look: [20, 0, 0] },
  { name: 'Bow wash', f: (t) => [125, 9, -62 + t * 5.5], look: [60, 2, 0] },
  { name: 'Chase', f: (t) => [-330, 95 - t * 1.5, 70 - t * 2], look: [30, 10, 0] },
  { name: 'Broadside', f: (t) => [10 + t * 2, 30, 280 - t * 3], look: [0, 8, 0] },
];
const cine = { on: true, paused: false, shot: 0, t: 0 };
let userIdle = 0, shake = 0;
const prevTarget = new THREE.Vector3();
const shakeOff = new THREE.Vector3();

function localToWorldOffset(o, out) {
  const m = fleet[0];
  const c = Math.cos(m.heading), s = Math.sin(m.heading);
  return out.set(o[0] * c + o[2] * s, o[1], -o[0] * s + o[2] * c);
}

function setShot(i, snap) {
  cine.shot = (i + SHOTS.length) % SHOTS.length;
  cine.t = 0;
  if (snap) placeCine(1, true);
  const el = $('shotName');
  if (el) el.textContent = SHOTS[cine.shot].name;
}

function heroTarget(out) {
  const g = fleet[0].ship.group.position;
  return out.set(g.x, fleet[0].heave * 0.4 + 12, g.z);
}

const _t = new THREE.Vector3(), _o = new THREE.Vector3(), _look = new THREE.Vector3();
function placeCine(dt, snap) {
  const shot = SHOTS[cine.shot];
  heroTarget(_t);
  localToWorldOffset(shot.f(cine.t), _o);
  localToWorldOffset(shot.look, _look);
  const desired = _t.clone().add(_o);
  const k = snap ? 1 : 1 - Math.exp(-dt * 2.2);
  camera.position.lerp(desired, k);
  controls.target.lerp(_t.clone().add(_look), k);
}

/* ----------------------------------------------------------- atmosphere */
/* ----------------------------------------------------------------- views */
const VIEWS = ['cine', 'orbit', 'bridge', 'heli'];
const VIEW_LABEL = { cine: 'Cinematic', orbit: 'Orbit', bridge: 'Bridge', heli: 'Helicopter' };
let view = 'cine';
const look = { yaw: 0, pitch: -0.05 };
let heliA = 0;
const _qa = new THREE.Quaternion(), _eu = new THREE.Euler();
function setView(v) {
  view = v;
  cine.on = v === 'cine'; cine.paused = false;
  if (typeof updateUrl === 'function' && fleet) updateUrl();
  controls.enabled = v === 'orbit' || v === 'cine';
  document.body.classList.toggle('bridge', v === 'bridge');
  $('btnView').innerHTML = `${VIEW_LABEL[v]}<kbd>V</kbd>`;
  $('btnCine').classList.toggle('on', v === 'cine');
  if (v === 'cine') setShot(cine.shot, true);
  if (v === 'bridge') { look.yaw = 0; look.pitch = -0.05; }
  if (v === 'heli') { heroTarget(_t); heliA = Math.atan2(camera.position.z - _t.z, camera.position.x - _t.x); }
  if (v === 'orbit') { heroTarget(_t); controls.target.copy(_t); }
}

/* ---------------------------------------------------- rain on the bridge glass */
const glass = { cv: null, ctx: null, drops: [], sprite: null, acc: 0, flash: 0 };
function initGlass() {
  glass.cv = $('glass');
  glass.ctx = glass.cv.getContext('2d');
  // a water drop on glass acts as a tiny lens: dark rim, bright inverted sky at the bottom, pin highlight on top
  const sp = document.createElement('canvas'); sp.width = sp.height = 48;
  const x = sp.getContext('2d');
  x.translate(24, 24);
  let g = x.createRadialGradient(0, 2, 2, 0, 0, 22);
  g.addColorStop(0, 'rgba(160,175,185,0.05)'); g.addColorStop(0.7, 'rgba(120,135,145,0.10)'); g.addColorStop(0.92, 'rgba(10,14,18,0.38)'); g.addColorStop(1, 'rgba(10,14,18,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.fill();
  g = x.createLinearGradient(0, 4, 0, 20);
  g.addColorStop(0, 'rgba(220,230,235,0)'); g.addColorStop(1, 'rgba(220,230,235,0.32)');
  x.fillStyle = g; x.beginPath(); x.ellipse(0, 11, 15, 8, 0, 0, Math.PI); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(-7, -9, 3.2, 2.2, -0.6, 0, Math.PI * 2); x.fill();
  glass.sprite = sp;
  const fit = () => { glass.cv.width = Math.round(innerWidth * 0.75); glass.cv.height = Math.round(innerHeight * 0.75); };
  fit(); addEventListener('resize', fit);
}
function splashGlass(n, big) {
  const W = glass.cv.width, H = glass.cv.height;
  for (let i = 0; i < n; i++) {
    const r = big ? 2.2 + Math.pow(Math.random(), 2) * 7 : 0.7 + Math.pow(Math.random(), 3) * 3.2;
    glass.drops.push({ x: Math.random() * W, y: Math.random() * H * 0.9, r, sx: 0.8 + Math.random() * 0.45, vy: 0, life: 5 + Math.random() * 8 });
  }
  if (big) glass.flash = Math.min(1, glass.flash + 0.7);
}
function updateGlass(dt) {
  if (view !== 'bridge' || !glass.ctx) return;
  const max = Q.name === 'low' ? 70 : 160;
  glass.acc += dt * rainAmt * (30 + 40 * windAmt);
  while (glass.acc > 1 && glass.drops.length < max) { glass.acc -= 1; splashGlass(1, false); }
  glass.acc = Math.min(glass.acc, 2);
  const c = glass.ctx, W = glass.cv.width, H = glass.cv.height;
  c.clearRect(0, 0, W, H);
  // a sheet of spray blurs the view through the glass and drains away
  glass.flash *= Math.exp(-dt * 1.1);
  const sheet = $('sheet');
  if (sheet) sheet.style.opacity = glass.flash > 0.01 ? glass.flash.toFixed(3) : '0';
  for (let i = glass.drops.length - 1; i >= 0; i--) {
    const d = glass.drops[i];
    d.life -= dt;
    if (d.r > 3.2) { d.vy += dt * 40 * (d.r / 6); d.y += d.vy * dt; d.r -= dt * 0.25; }
    if (d.life <= 0 || d.y > H + 20 || d.r < 0.6) { glass.drops.splice(i, 1); continue; }
    const a = Math.min(1, d.life);
    c.globalAlpha = a;
    c.drawImage(glass.sprite, d.x - d.r * d.sx, d.y - d.r, d.r * 2 * d.sx, d.r * 2.15);
    if (d.vy > 4) { c.globalAlpha = a * 0.28; c.drawImage(glass.sprite, d.x - d.r * 0.3, d.y - d.r * 7, d.r * 0.6, d.r * 6.5); }
  }
  c.globalAlpha = 1;
}

/* ------------------------------------------------------------ helm & horn */
const TELEGRAPH = [['Stop', 0], ['Slow', 0.4], ['Half', 0.7], ['Full', 1], ['Flank', 1.15]];
let helmTarget = 0, telegraphIdx = 3, hornT = 0;
function setTelegraph(i) {
  telegraphIdx = THREE.MathUtils.clamp(i, 0, TELEGRAPH.length - 1);
  fleet[0].telegraph = TELEGRAPH[telegraphIdx][1];
  document.querySelectorAll('[data-tele]').forEach((b) => { const on = +b.dataset.tele === telegraphIdx; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
}
function hornDown() {
  if (!audio.ctx) audio.start();
  audio.hornStart();
  hornT = performance.now();
  $('btnHorn').classList.add('on');
}
function hornUp() {
  if (!hornT) return;
  audio.hornStop();
  $('btnHorn').classList.remove('on');
  const held = (performance.now() - hornT) / 1000;
  hornT = 0;
  if (held < 0.4) return;
  for (const m of fleet.slice(1)) {
    const p = m.ship.group.position;
    const dist = camera.position.distanceTo(p);
    audio.hornReply(2.2 + Math.random() * 3 + dist / 1200, 1.4 + Math.random() * 1.2, dist, THREE.MathUtils.clamp(panOf(p), -0.9, 0.9));
  }
}

/* ------------------------------------------------- photo mode, clips, sharing */
let paused = false;
const photo = { on: false, prevView: 'cine', exp: 1 };
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2200);
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function enterPhoto() {
  if (photo.on) return;
  if (fly) endFly();
  photo.on = true; photo.prevView = view; photo.exp = 1;
  paused = true;
  if (view !== 'bridge') setView('orbit');
  document.body.classList.add('photo');
  $('phFov').value = String(Math.round(camera.fov));
  $('phExp').value = '1';
}
function exitPhoto() {
  if (!photo.on) return;
  photo.on = false; paused = false; photo.exp = 1;
  document.body.classList.remove('photo');
  resizeTo(innerWidth, innerHeight);
  setView(photo.prevView);
}
function setFov(f) {
  camera.fov = f; camera.updateProjectionMatrix();
  particles.uniforms.uScale.value = (innerHeight * DPR) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
async function capturePhoto() {
  // re-render once at high resolution (up to 4K wide), grab it, then restore
  const prev = DPR, fov = camera.fov;
  const pr = Math.min(3840 / innerWidth, Q.name === 'low' ? 2 : 3);
  renderer.setPixelRatio(pr); composer.setPixelRatio(pr); resizeTo(innerWidth, innerHeight); setFov(fov);
  composer.render();
  const blob = await new Promise((r) => renderer.domElement.toBlob(r, 'image/jpeg', 0.95));
  renderer.setPixelRatio(prev); composer.setPixelRatio(prev); resizeTo(innerWidth, innerHeight); setFov(fov);
  $('shutter').classList.remove('go'); void $('shutter').offsetWidth; $('shutter').classList.add('go');
  if (blob) { download(blob, `storm-at-sea-${atmos.weather}-${atmos.time}.jpg`); toast('Photo saved'); }
}

const rec = { mr: null, chunks: [], timer: null, left: 0 };
function toggleRecord() {
  if (rec.mr) { rec.mr.stop(); return; }
  if (!window.MediaRecorder || !renderer.domElement.captureStream) { toast('Recording is not supported in this browser'); return; }
  const stream = renderer.domElement.captureStream(30);
  if (audio.ctx) {
    if (!audio.recDest) { audio.recDest = audio.ctx.createMediaStreamDestination(); audio.comp.connect(audio.recDest); }
    audio.recDest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  }
  const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  rec.chunks = [];
  rec.mr = new MediaRecorder(stream, { mimeType: mime || undefined, videoBitsPerSecond: Q.name === 'low' ? 6e6 : 14e6 });
  rec.mr.ondataavailable = (e) => { if (e.data.size) rec.chunks.push(e.data); };
  rec.mr.onstop = () => {
    clearInterval(rec.timer);
    document.body.classList.remove('recording');
    $('btnRec').classList.remove('on');
    const type = rec.mr.mimeType || mime || 'video/webm';
    download(new Blob(rec.chunks, { type }), `storm-at-sea.${type.includes('mp4') ? 'mp4' : 'webm'}`);
    toast('Clip saved');
    rec.mr = null;
  };
  rec.mr.start(250);
  rec.left = 15;
  document.body.classList.add('recording');
  $('btnRec').classList.add('on');
  $('recTime').textContent = '0:15';
  rec.timer = setInterval(() => {
    rec.left -= 1;
    $('recTime').textContent = `0:${String(Math.max(0, rec.left)).padStart(2, '0')}`;
    if (rec.left <= 0 && rec.mr) rec.mr.stop();
  }, 1000);
}

async function share() {
  updateUrl();
  const url = location.href;
  const text = `${WEATHERS[atmos.weather].label} · ${TIMES[atmos.time].label} aboard ${HERO_SHIPS[heroKey].tag}`;
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ title: 'Storm at Sea', text, url }); return; } catch { /* fall through to copy */ }
  }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { prompt('Copy this link', url); }
}

/* ------------------------------------------------- fly-in, captain's log, voyage */
let logTimer = null, logHide = null;
function logLine(text) {
  const el = $('log'), tx = $('logText');
  clearInterval(logTimer); clearTimeout(logHide);
  el.classList.add('show');
  tx.textContent = '';
  let i = 0;
  const step = () => { tx.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(logTimer); };
  if (REDUCED) tx.textContent = text; else logTimer = setInterval(step, 26);
  logHide = setTimeout(() => el.classList.remove('show'), 9000 + text.length * 26);
}

// Descend from above the cloud deck to the ship along a smooth curve, in ship-relative space.
const flyPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-1700, 760, 1300), new THREE.Vector3(-820, 420, 700),
  new THREE.Vector3(-160, 200, 300), new THREE.Vector3(215, 105, 25),
]);
const flyLook = new THREE.CatmullRomCurve3([
  new THREE.Vector3(1500, 60, -700), new THREE.Vector3(500, 20, -150), new THREE.Vector3(60, 4, 0), new THREE.Vector3(40, 0, 0),
]);
let fly = null;
function flyIn(done) {
  if (REDUCED) { done(); return; }
  fly = { t: 0, dur: 11, done, struck: 0 };
  document.body.classList.add('flying');
  camHook = (dt, t, target) => {
    fly.t += dt;
    const u = Math.min(1, fly.t / fly.dur);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    localToWorldOffset(flyPath.getPoint(e).toArray(), _o);
    localToWorldOffset(flyLook.getPoint(e).toArray(), _look);
    camera.position.copy(target).add(_o);
    camera.lookAt(_look.add(target));
    $('veil').style.opacity = String(Math.max(0, 1 - THREE.MathUtils.smoothstep(e, 0.08, 0.42)) * 0.92);
    if (fly.struck === 0 && u > 0.22) { fly.struck = 1; lightning.strike(camera, { dist: 1600, ahead: true }); }
    if (fly.struck === 1 && u > 0.55) { fly.struck = 2; lightning.strike(camera, { dist: 900, ahead: true }); }
    if (u >= 1) endFly();
  };
}
function endFly() {
  if (!fly) return;
  const done = fly.done;
  fly = null; camHook = null;
  $('veil').style.opacity = '0';
  document.body.classList.remove('flying');
  controls.target.copy(heroTarget(_t));
  done();
}

const voyage = new Voyage({
  onStart() {
    document.body.classList.add('voyage');
    setView('cine');
    atmos.tau = 6;
    cine.on = true; cine.paused = false; cine.voyage = true;
    $('btnCine').classList.add('on');
  },
  onEnd(finished) {
    document.body.classList.remove('voyage');
    atmos.tau = 1.6;
    cine.voyage = false;
    if (finished) $('endCard').classList.add('show');
  },
  setAtmosphere: (t, w) => setAtmosphere(t, w),
  setShot: (i) => setShot(i, true),
  log: logLine,
  strike: (d) => lightning.strike(camera, { dist: d, ahead: true }),
  rogue: (inSec) => {
    const p = fleet[0].ship.group.position;
    waves.triggerRogue(new THREE.Vector2(p.x, p.z), time);
    waves.rogue.t0 = time - (950 - inSec * 18.5) / 13.5;
    rogueTimer = 200;
  },
  dolphins: () => { sealife.podTimer = 0; sealife.podOn = false; },
  whale: () => { sealife.whaleTimer = 0; },
  progress: (p) => { $('voyageFill').style.transform = `scaleX(${p})`; },
});

function begin(mode, sound) {
  if (sound) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
    audio.start();
    $('btnSound').classList.add('on');
  }
  document.body.classList.add('entered');
  $('endCard').classList.remove('show');
  if (mode === 'voyage') {
    setAtmosphere('dusk', 'rough');
    atmos.snap();
    flyIn(() => { voyage.start(); });
  } else {
    flyIn(() => { setShot(0, true); const pv = params.get('view'); if (pv && VIEWS.includes(pv) && pv !== 'cine') setView(pv); logLine(`${TIMES[atmos.time].clock} · North Atlantic, 47°N 32°W. ${WEATHERS[atmos.weather].label} seas.`); });
  }
}

const _keyDir = new THREE.Vector3();
let lastWaves = -1;
function applyAtmosphere(dt) {
  const a = atmos.update(dt);
  env.uSkyTop.value.copy(a.top);
  env.uSkyHorizon.value.copy(a.hor);
  env.uFogColor.value.copy(a.fog);
  env.uAmbient.value.copy(a.amb);
  env.uKeyColor.value.copy(a.key).multiplyScalar(0.55 + 0.45 * a.keyInt);
  const el = THREE.MathUtils.degToRad(a.sunEl), az = Math.atan2(-0.8, -0.55);
  _keyDir.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  env.uKeyDir.value.copy(_keyDir);
  env.uCover.value = a.cover;
  env.uSunVis.value = THREE.MathUtils.clamp(1 - a.overcast * 1.15, 0, 1);
  env.uStars.value = a.stars * (1 - a.cover * 0.8);
  env.uDisc.value = a.disc;
  env.uMoon.value = a.moon;
  env.uFogDensity.value = a.fogD;
  scene.fog.color.copy(a.fog);
  scene.fog.density = a.fogD;
  hemiBase = 1.25;
  hemi.color.copy(a.amb).multiplyScalar(6.0);
  hemi.groundColor.copy(a.deep).multiplyScalar(1.4);
  key.color.copy(a.key);
  key.intensity = a.keyInt;
  key.position.copy(_keyDir).multiplyScalar(1000);
  if (!CAPTURE) renderer.toneMappingExposure = a.exposure * photo.exp;
  if (Math.abs(a.waves - lastWaves) > 0.002) { waves.setIntensity(a.waves); lastWaves = a.waves; }
  env.uStorm.value = a.waves;
  windAmt = a.wind;
  rainAmt = a.rain;
  if (lightning) lightning.freq = a.lightning;
  if (ocean) {
    ocean.mesh.material.uniforms.uDeep.value.copy(a.deep);
    ocean.mesh.material.uniforms.uScatter.value.copy(a.scatter);
  }
  if (fleet) for (const m of fleet) m.ship.setLights(a.windows, a.nav);
  // bright daylight scenes need less bloom, or every highlight turns to milk
  if (bloom) {
    const sv = env.uSunVis.value;
    bloom.threshold = 0.9 + 0.9 * sv;
    bloom.strength = 0.55 - 0.3 * sv;
  }
}

// reflections: rebuild the environment map from the sky once a change has settled
function refreshEnv() {
  const old = scene.environment;
  scene.environment = pmrem.fromScene(envScene, 0.03, 0.1, 1000).texture;
  if (old) old.dispose();
}
function scheduleEnvRefresh() {
  envTimers.forEach(clearTimeout);
  envTimers = [1500, 4000, 8000].map((ms) => setTimeout(refreshEnv, ms));
}

function setAtmosphere(time, weather) {
  atmos.set(time ?? atmos.time, weather ?? atmos.weather);
  try { localStorage.setItem('storm.time', atmos.time); localStorage.setItem('storm.weather', atmos.weather); } catch {}
  syncAtmosUi();
  scheduleEnvRefresh();
  updateUrl();
}

function updateUrl() {
  if (CAPTURE) return;
  const u = new URL(location.href);
  u.searchParams.set('ship', heroKey);
  u.searchParams.set('weather', atmos.weather);
  u.searchParams.set('time', atmos.time);
  if (view !== 'cine') u.searchParams.set('view', view); else u.searchParams.delete('view');
  history.replaceState(null, '', u);
}

function syncAtmosUi() {
  document.querySelectorAll('[data-weather]').forEach((b) => { const on = b.dataset.weather === atmos.weather; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  document.querySelectorAll('[data-time]').forEach((b) => { const on = b.dataset.time === atmos.time; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
  const t = atmos.tgt;
  $('storm').value = t.waves; $('bolts').value = t.lightning; $('rainAmt').value = t.rain;
  const eb = $('introClock');
  if (eb) eb.textContent = `${TIMES[atmos.time].clock} UTC`;
}
let hemiBase = 1.25;

/* --------------------------------------------------------------- loop */
const clock = new THREE.Clock();
let time = 0, hudTimer = 0, rogueTimer = 38;
const windVel = new THREE.Vector3();
const sampleOut = { x: 0, y: 0, z: 0, jac: 1 };
let rainAmt = 1, windAmt = 1;

let camHook = null;
const mixLog = [];

const gov = { t: 0, frames: 0, warm: 3, good: 0 };
function frame() {
  requestAnimationFrame(frame);
  const raw = clock.getDelta();
  tick(paused ? 0 : Math.min(raw, 0.05));
  if (!paused) governor(raw);
}

// Adaptive quality: shed bloom, then resolution, when the frame rate sags; win it back when there's headroom.
function governor(raw) {
  if (document.hidden || raw > 0.5) return;
  gov.warm -= raw;
  if (gov.warm > 0) return;
  gov.t += raw; gov.frames++;
  if (gov.t < 2) return;
  const fps = gov.frames / gov.t;
  gov.t = 0; gov.frames = 0;
  if (fps < 40) {
    gov.good = 0;
    if (bloom.enabled && fps < 34) bloom.enabled = false;
    else if (DPR > Q.dprMin + 0.01) setDpr(Math.max(Q.dprMin, DPR - 0.15));
    else if (rainAmtScale > 0.4) { rainAmtScale -= 0.3; rain.mesh.geometry.setDrawRange(0, Math.floor(Q.rain * rainAmtScale) * 2); }
  } else if (fps > 57) {
    if (++gov.good >= 3 && DPR < DPR_CAP - 0.01) { setDpr(Math.min(DPR_CAP, DPR + 0.1)); gov.good = 0; }
  } else gov.good = 0;
}
let rainAmtScale = 1;
function setDpr(v) {
  DPR = v;
  renderer.setPixelRatio(v);
  composer.setPixelRatio(v);
  resizeTo(innerWidth, innerHeight);
}

function tick(dt) {
  time += dt;
  env.uTime.value = time;
  camera.position.sub(shakeOff);

  applyAtmosphere(dt);
  voyage.update(dt);
  waves.update(time);
  for (const m of fleet) m.update(dt, time);

  // auto rogue waves
  rogueTimer -= dt;
  if (rogueTimer <= 0 && !waves.rogue.active) triggerRogue();

  lightning.update(dt, camera);
  if (REDUCED) env.uFlash.value *= 0.45;
  const f = env.uFlash.value;
  hemi.intensity = hemiBase + f * 0.9;
  if (lightning.best) {
    const hp = fleet[0].ship.group.position;
    flashLight.position.copy(lightning.best.mid).sub(hp).normalize().multiplyScalar(800).add(hp);
    flashLight.target.position.copy(hp);
  }
  flashLight.intensity = f * 3.2;

  // camera
  heroTarget(_t);
  if (!prevTarget.lengthSq()) prevTarget.copy(_t);
  const delta = _t.clone().sub(prevTarget);
  prevTarget.copy(_t);
  userIdle += dt;
  if (cine.on && cine.paused && userIdle > 18) cine.paused = false;
  fleet[0].rudder += (helmTarget - fleet[0].rudder) * (1 - Math.exp(-dt * 1.2));
  if (camHook) {
    camHook(dt, time, _t);
  } else if (view === 'bridge') {
    const g = fleet[0].ship.group;
    g.updateMatrixWorld();
    camera.position.copy(fleet[0].ship.eye).applyMatrix4(g.matrixWorld);
    _qa.setFromEuler(_eu.set(look.pitch, -Math.PI / 2 + look.yaw, 0, 'YXZ'));
    camera.quaternion.copy(g.quaternion).multiply(_qa);
  } else if (view === 'heli') {
    heliA += dt * 0.07;
    const r = 520 + 60 * Math.sin(time * 0.05);
    camera.position.set(_t.x + Math.cos(heliA) * r, 170 + 25 * Math.sin(time * 0.21) + Math.sin(time * 1.7) * 0.6, _t.z + Math.sin(heliA) * r);
    camera.lookAt(_t.x, _t.y + 4, _t.z);
  } else {
    if (cine.on && !cine.paused) {
      cine.t += dt;
      if (cine.t > (cine.voyage ? 40 : 16)) setShot(cine.shot + 1, true);
      else placeCine(dt, false);
    } else {
      camera.position.add(delta);
      controls.target.add(delta);
    }
    controls.update();
  }
  const wh = waves.heightAt(camera.position.x, camera.position.z, time) + 3.0;
  if (camera.position.y < wh) camera.position.y = wh;
  // handheld drift + thunder shake
  shake *= Math.exp(-dt * 2.5);
  if (REDUCED) shake = 0;
  shakeOff.set(Math.sin(time * 1.3) * 0.12 + (Math.random() - 0.5) * shake, Math.sin(time * 0.9 + 1) * 0.1 + (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  camera.position.add(shakeOff);
  camera.updateMatrixWorld();

  // particles: spume torn off crests, bow wash, funnel smoke
  windVel.set(windDir.x * 17 * windAmt, 0, windDir.y * 17 * windAmt);
  const hp = fleet[0].ship.group.position;
  for (let i = 0; i < Q.spume; i++) {
    const a = Math.random() * Math.PI * 2, rr = 40 + Math.sqrt(Math.random()) * 700;
    const x0 = (Math.random() < 0.6 ? hp.x : camera.position.x) + Math.cos(a) * rr;
    const z0 = (Math.random() < 0.6 ? hp.z : camera.position.z) + Math.sin(a) * rr;
    waves.sample(x0, z0, time, sampleOut, true);
    if (sampleOut.jac < 0.7 && sampleOut.y > 3.2 * waves.intensity) {
      const n = 2 + Math.floor(Math.random() * 4);
      for (let k = 0; k < n; k++) {
        particles.emit(x0 + sampleOut.x + (Math.random() - 0.5) * 6, sampleOut.y + Math.random(), z0 + sampleOut.z + (Math.random() - 0.5) * 6,
          windVel.x * (0.5 + Math.random() * 0.4), 2 + Math.random() * 4, windVel.z * (0.5 + Math.random() * 0.4),
          1.2 + Math.random() * 1.5, 1.5 + Math.random() * 2, 6 + Math.random() * 8, 0.3 + Math.random() * 0.2, 1, 1.5, 0.7);
      }
    }
  }
  for (const m of fleet) {
    const g = m.ship.group;
    // smoke
    if (Math.random() < 0.85) {
      _v.copy(m.ship.funnelTop).applyMatrix4(g.matrixWorld);
      particles.emit(_v.x + (Math.random() - 0.5) * 2, _v.y, _v.z + (Math.random() - 0.5) * 2,
        windVel.x * 0.4, 3 + Math.random() * 2, windVel.z * 0.4,
        6 + Math.random() * 4, 3, 26 + Math.random() * 18, m.ship.smoke ? m.ship.smoke.alpha : 0.28, m.ship.smoke ? m.ship.smoke.shade : 0.12, -0.25, 0.25);
    }
    // continuous bow wash when the bow is buried
    if (m.bowImm > 0.3 && Math.random() < 0.9) {
      const s = m.ship;
      _q.setFromRotationMatrix(g.matrixWorld);
      for (let k = 0; k < 3; k++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const lx = s.L / 2 - 2 - Math.random() * 18;
        _v.set(lx, -1 + Math.random() * 3, side * (s.halfB(lx) + 0.5)).applyMatrix4(g.matrixWorld);
        _w.set(Math.random() * 3, 3 + Math.random() * 6, side * (2 + Math.random() * 5)).applyQuaternion(_q);
        particles.emit(_v.x, _v.y, _v.z, _w.x, _w.y, _w.z, 1 + Math.random(), 1.5, 6 + Math.random() * 6, 0.3, 1, 7, 0.3);
      }
    }
  }
  sealife.setVisible(atmos.cur.waves < 1.15);
  sealife.update(dt, time, fleet[0]);
  particles.update(dt, windVel);
  updateGlass(dt);
  rain.update(camera, windDir, rainAmt);
  ocean.update(camera, fleet);
  {
    const u = ocean.mesh.material.uniforms;
    hero.reflections(u.uPtPos.value, u.uPtCol.value, Q.name === 'low' ? 4 : 8);
  }
  sky.position.copy(camera.position);

  // audio mix
  {
    const above = camera.position.y - wh + 3;
    const close = THREE.MathUtils.clamp(1 - (above - 4) / 160, 0, 1);
    const shipNear = THREE.MathUtils.clamp(1 - (camera.position.distanceTo(hp) - 60) / 260, 0, 1);
    const mix = {
      storm: 0.4 + 0.6 * waves.intensity, wind: windAmt, rain: rainAmt, close, shipNear,
      rogue: waves.rogueEnvelope(camera.position.x, camera.position.z),
    };
    if (audio.ready) audio.update(dt, mix);
    if (CAPTURE) mixLog.push({ t: time, dt, ...mix });
  }

  grainPass.uniforms.uTime.value = time;
  grainPass.uniforms.uFlash.value = Math.min(f, 1);
  grainPass.uniforms.uSat.value = 1.08 - 0.22 * atmos.cur.overcast;
  composer.render();

  hudTimer -= dt;
  if (hudTimer <= 0) { hudTimer = 0.25; updateHud(); }
}

function triggerRogue() {
  const p = fleet[0].ship.group.position;
  waves.triggerRogue(new THREE.Vector2(p.x, p.z), time);
  rogueTimer = 85 + Math.random() * 50;
}

/* ----------------------------------------------------------------- HUD */
function beaufort(kn) {
  if (kn >= 64) return 'Force 12 · Hurricane';
  if (kn >= 56) return 'Force 11 · Violent storm';
  if (kn >= 48) return 'Force 10 · Storm';
  if (kn >= 41) return 'Force 9 · Severe gale';
  if (kn >= 34) return 'Force 8 · Gale';
  if (kn >= 28) return 'Force 7 · Near gale';
  if (kn >= 22) return 'Force 6 · Strong breeze';
  if (kn >= 17) return 'Force 5 · Fresh breeze';
  return 'Force 4 · Moderate breeze';
}
function updateHud() {
  const m = fleet[0];
  const hdg = ((90 - THREE.MathUtils.radToDeg(Math.atan2(m.forward.y, m.forward.x)) + 360) % 360);
  const kn = Math.min(92, 8 + 58 * Math.pow(windAmt * waves.intensity, 0.8));
  $('tForce').textContent = beaufort(kn);
  $('tHs').textContent = `${waves.Hs.toFixed(1)} m`;
  $('tWind').textContent = `${Math.round(kn)} kn`;
  $('tHdg').textContent = `${String(Math.round(hdg)).padStart(3, '0')}°`;
  $('tSog').textContent = `${(m.speed * 1.944).toFixed(1)} kn`;
  $('bfHdg').textContent = String(Math.round(hdg)).padStart(3, '0');
  $('bfSog').textContent = (m.speed * 1.944).toFixed(1);
  $('tRoll').textContent = `${Math.abs(THREE.MathUtils.radToDeg(m.roll)).toFixed(1)}° ${m.roll < 0 ? 'S' : 'P'}`;
  $('tPitch').textContent = `${THREE.MathUtils.radToDeg(m.pitch).toFixed(1)}°`;
  {
    // where the seas are coming from, relative to the bow
    const fx = m.forward.x, fz = m.forward.y, wx = -windDir.x, wz = -windDir.y;
    const rel = THREE.MathUtils.radToDeg(Math.atan2(fx * wz - fz * wx, fx * wx + fz * wz));
    const a = Math.abs(rel), side = rel > 0 ? 'S' : 'P';
    const kind = a < 35 ? 'Head' : a < 145 ? 'Beam' : 'Following';
    $('tSeas').textContent = `${kind} ${Math.round(a)}° ${side}`;
    const rd = m.rudder * 35;
    $('tRudder').textContent = Math.abs(rd) < 0.5 ? `Mid · ${TELEGRAPH[telegraphIdx][0]}` : `${Math.abs(rd).toFixed(0)}° ${rd > 0 ? 'S' : 'P'} · ${TELEGRAPH[telegraphIdx][0]}`;
  }
  const r = waves.rogue;
  const warn = $('rogueWarn');
  if (r.active) {
    const p = m.ship.group.position;
    const s = (p.x - r.origin.x) * r.dir.x + (p.z - r.origin.y) * r.dir.y;
    const dist = s - r.sc;
    warn.classList.toggle('show', dist > -150 && dist < 950);
    $('rogueDist').textContent = dist > 0 ? `${Math.round(dist)} m` : 'impact';
  } else warn.classList.remove('show');
}

/* -------------------------------------------------------------- inputs */
function bindUi() {
  const storm = $('storm'), bolt = $('bolts'), vol = $('vol'), rainEl = $('rainAmt');
  storm.addEventListener('input', () => {
    const v = +storm.value;
    atmos.override('waves', v);
    atmos.override('wind', 0.25 + 0.75 * v);
  });
  bolt.addEventListener('input', () => atmos.override('lightning', +bolt.value));
  rainEl.addEventListener('input', () => atmos.override('rain', +rainEl.value));
  document.querySelectorAll('[data-weather]').forEach((b) => b.addEventListener('click', () => setAtmosphere(null, b.dataset.weather)));
  document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => setAtmosphere(b.dataset.time, null)));
  syncAtmosUi();
  updateUrl();
  vol.addEventListener('input', () => audio.setVolume(+vol.value));
  $('btnRogue').addEventListener('click', triggerRogue);
  document.querySelectorAll('[data-ship]').forEach((b) => b.addEventListener('click', () => switchShip(b.dataset.ship)));
  syncShipUi();
  const tog = $('ctlToggle');
  tog.addEventListener('click', () => {
    const open = $('controls').classList.toggle('open');
    tog.setAttribute('aria-expanded', String(open));
    tog.classList.toggle('on', open);
  });
  $('btnStrike').addEventListener('click', () => lightning.strike(camera, { dist: 380 + Math.random() * 500, ahead: true }));
  const cineBtn = $('btnCine');
  const setCine = (on) => setView(on ? 'cine' : 'orbit');
  cineBtn.addEventListener('click', () => setCine(view !== 'cine'));
  $('btnView').addEventListener('click', () => setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]));
  initGlass();
  $('btnPhoto').addEventListener('click', enterPhoto);
  $('phExit').addEventListener('click', exitPhoto);
  $('phShot').addEventListener('click', capturePhoto);
  $('phFov').addEventListener('input', (e) => setFov(+e.target.value));
  $('phExp').addEventListener('input', (e) => { photo.exp = +e.target.value; });
  $('btnRec').addEventListener('click', toggleRecord);
  $('btnShare').addEventListener('click', share);
  // bridge look-around (mouse or touch drag)
  let drag = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { if (view === 'bridge') drag = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointermove', (e) => {
    if (!drag || view !== 'bridge') return;
    look.yaw = THREE.MathUtils.clamp(look.yaw - (e.clientX - drag.x) * 0.0035, -2.3, 2.3);
    look.pitch = THREE.MathUtils.clamp(look.pitch - (e.clientY - drag.y) * 0.0035, -0.6, 0.45);
    drag.x = e.clientX; drag.y = e.clientY;
  });
  // helm and horn (hold buttons)
  const hold = (el, down, up) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture?.(e.pointerId); down(); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, up);
  };
  hold($('helmP'), () => { helmTarget = -1; }, () => { helmTarget = 0; });
  hold($('helmS'), () => { helmTarget = 1; }, () => { helmTarget = 0; });
  hold($('btnHorn'), hornDown, hornUp);
  document.querySelectorAll('[data-tele]').forEach((b) => b.addEventListener('click', () => setTelegraph(+b.dataset.tele)));
  setTelegraph(3);
  addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if ((k === 'a' && helmTarget < 0) || (k === 'd' && helmTarget > 0)) helmTarget = 0;
    if (k === 'b') hornUp();
  });
  const sndBtn = $('btnSound');
  sndBtn.addEventListener('click', () => { const m = audio.toggleMute(); sndBtn.classList.toggle('on', !m); });
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'r') triggerRogue();
    if (k === 'l') lightning.strike(camera, { dist: 300 + Math.random() * 600, ahead: true });
    if (k === 'p') { photo.on ? exitPhoto() : enterPhoto(); return; }
    if (photo.on && (k === 'enter' || k === ' ')) { e.preventDefault(); capturePhoto(); return; }
    if (photo.on && k === 'escape') { exitPhoto(); return; }
    if (k === 'c') setCine(view !== 'cine');
    if (k === 'v') setView(VIEWS[(VIEWS.indexOf(view) + 1) % VIEWS.length]);
    if (k === 'a') helmTarget = -1;
    if (k === 'd') helmTarget = 1;
    if (k === 'w') setTelegraph(telegraphIdx + 1);
    if (k === 's') setTelegraph(telegraphIdx - 1);
    if (k === 'b' && !e.repeat) hornDown();
    if (k === 'm') sndBtn.click();
    if (k === 'h') document.body.classList.toggle('clean');
    if (k >= '1' && k <= '6') { setView('cine'); setShot(+k - 1, true); }
    if (k === 'arrowright') setShot(cine.shot + 1, true);
  });
}

function resizeTo(w, h) {
  camera.aspect = w / h;
  // keep roughly a 64° horizontal view in portrait so the ship isn't cropped on phones
  camera.fov = camera.aspect >= 1 ? 48 : Math.min(88, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(32)) / camera.aspect)));
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, !CAPTURE);
  if (!composer) return;
  composer.setSize(w, h);
  grainPass.uniforms.uRes.value.set(w, h);
  particles.uniforms.uScale.value = (h * DPR) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
}
addEventListener('resize', () => { if (!CAPTURE) resizeTo(innerWidth, innerHeight); });

/* --------------------------------------------------------------- start */
(async () => {
  try {
    await build();
  } catch (err) {
    status(`Failed to build scene: ${err.message}`);
    throw err;
  }
  particles.uniforms.uScale.value = (innerHeight * DPR) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  bindUi();
  resizeTo(innerWidth, innerHeight);
  status('');
  document.body.classList.add('ready');
  if (CAPTURE) {
    // offline capture: the page is stepped frame-by-frame from outside
    document.body.classList.add('entered', 'clean');
    resizeTo(1920, 1080);
  } else frame();
  const soundPref = () => $('soundPref').getAttribute('aria-pressed') === 'true';
  $('soundPref').addEventListener('click', (e) => { const b = e.currentTarget; b.setAttribute('aria-pressed', String(!soundPref())); b.textContent = soundPref() ? 'Sound on' : 'Sound off'; });
  $('enter').addEventListener('click', () => begin('voyage', soundPref()));
  $('enterFree').addEventListener('click', () => begin('free', soundPref()));
  $('voyageExit').addEventListener('click', () => voyage.stop(false));
  $('btnVoyage').addEventListener('click', () => begin('voyage', !!audio.ctx || soundPref()));
  $('replay').addEventListener('click', () => begin('voyage', !!audio.ctx));
  $('freeRoam').addEventListener('click', () => { $('endCard').classList.remove('show'); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (fly) endFly(); else voyage.stop(false); }
    if (e.key === ' ' && fly) { e.preventDefault(); endFly(); }
  });
  renderer.domElement.addEventListener('pointerdown', () => { if (fly) endFly(); });
  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx) return;
    if (document.hidden) audio.ctx.suspend(); else audio.ctx.resume();
  });
  window.__storm = {
    waves, fleet, lightning, camera, env, audio, triggerRogue, setShot, cine, renderer, eventLog, mixLog,
    Q, atmos, sealife, voyage, begin, setView, setAtmosphere, switchShip, tick, resizeTo, setCamHook: (f) => { camHook = f; }, getTime: () => time,
  };
})();
