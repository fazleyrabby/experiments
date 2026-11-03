import * as THREE from 'three';
import { LIGHTS, SkyLUT, createSkyDome, sunDirection, sunColor, fullscreenQuad } from './sky.js';
import { Mountains } from './mountains.js';
import { createGround } from './ground.js';
import { createGrass, createFlowers, createStones } from './grass.js';
import { createRoad, railShadow } from './road.js';
import { createPropMaterial } from './props.js';
import { Traffic } from './vehicles.js';
import { Clouds, SHADOW_RECT } from './clouds.js';
import { createCompositeMaterial, createFinalMaterial } from './post.js';
import { frameAt, LANE, PERIOD } from './roadpath.js';
import { DriveAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const status = (s) => { const el = $('loadStatus'); if (el) el.textContent = s; };

const params = new URLSearchParams(location.search);
const PREFS = (() => {
  const d = { light: 'day', sound: false };
  try { return { ...d, ...JSON.parse(localStorage.getItem('highroad.prefs') || '{}') }; } catch { return d; }
})();
const savePrefs = () => { try { localStorage.setItem('highroad.prefs', JSON.stringify(PREFS)); } catch {} };
if (params.get('light') && LIGHTS[params.get('light')]) PREFS.light = params.get('light');

const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
renderer.autoClear = false;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const SPEED = 17; // m/s, about 60 km/h
const CAM_H = 1.62;

const shared = {
  uSkyLUT: { value: null },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunColor: { value: new THREE.Vector3(3, 3, 3) },
  uSkyAmbient: { value: new THREE.Vector3(0.2, 0.3, 0.5) },
  uGroundBounce: { value: new THREE.Vector3(0.15, 0.1, 0.06) },
  uHaze: { value: 1 },
  uSkyExposure: { value: 1 },
  uCloudShadow: { value: null },
  uCloudShadowRect: { value: new THREE.Vector4(SHADOW_RECT.x0, SHADOW_RECT.z0, 1 / SHADOW_RECT.size, 1 / SHADOW_RECT.size) },
  uCamW: { value: new THREE.Vector3() },
  uCamB: { value: new THREE.Vector3() },
  uShadowStrip: { value: new THREE.Vector3() },
  uPixAngle: { value: 0.0008 },
  uHeadPos: { value: new THREE.Vector3() },
  uHeadDir: { value: new THREE.Vector3(0, 0, -1) },
  uHeadRight: { value: new THREE.Vector3(1, 0, 0) },
  uHeadOn: { value: 0 },
  uLampBoost: { value: 1 },
};
let glow = 0;

// ---------- scenes ----------
const farScene = new THREE.Scene();
const nearScene = new THREE.Scene();
const farCam = new THREE.PerspectiveCamera(42, 16 / 9, 40, 420000);
const nearCam = new THREE.PerspectiveCamera(42, 16 / 9, 0.12, 9000);

const skyLUT = new SkyLUT(renderer);
shared.uSkyLUT.value = skyLUT.texture;
const skyDome = createSkyDome(shared);
farScene.add(skyDome);

const mountains = new Mountains(renderer, shared);
mountains.mesh.material.uniforms.uCamB = shared.uCamB;
const backdrop = new THREE.Group();
backdrop.add(mountains.mesh);
farScene.add(backdrop);

const clouds = new Clouds(renderer, shared);
shared.uCloudShadow.value = clouds.shadow.texture;

const ground = createGround(shared);
nearScene.add(ground);
const cover = [createGrass(shared), createFlowers(shared), createStones(shared)];
nearScene.add(...cover);
const propMat = createPropMaterial(shared);
const road = createRoad(shared, propMat);
nearScene.add(road);
const traffic = new Traffic(nearScene, propMat);

// ---------- render targets ----------
let rtFar, rtMain, W = 1, H = 1, scale = 1;
const composite = createCompositeMaterial();
const finalMat = createFinalMaterial();
const quadScene = new THREE.Scene();
const quad = fullscreenQuad(composite);
quadScene.add(quad);
const quadCam = new THREE.Camera();

function maxScale() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const px = innerWidth * innerHeight * dpr * dpr;
  const budget = 2.6e6;
  return px > budget ? dpr * Math.sqrt(budget / px) : dpr;
}

function resize() {
  scale = maxScale() * quality;
  W = Math.max(2, Math.round(innerWidth * scale));
  H = Math.max(2, Math.round(innerHeight * scale));
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  rtFar?.dispose(); rtMain?.dispose();
  rtFar = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true });
  rtFar.depthTexture = new THREE.DepthTexture(W, H);
  rtFar.depthTexture.type = THREE.UnsignedIntType;
  rtMain = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true, samples: 4 });
  clouds.resize(Math.ceil(W / 2), Math.ceil(H / 2));
  // portrait screens get a wider view so the range still fits
  const aspect = W / H;
  const fov = aspect < 1 ? 62 : 42;
  for (const c of [farCam, nearCam]) { c.aspect = aspect; c.fov = fov; c.updateProjectionMatrix(); }
  finalMat.uniforms.uRes.value.set(W, H);
  shared.uPixAngle.value = (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) / H;
  traffic.setPixelScale(H / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2)));
}

// ---------- lighting ----------
let lightKey = PREFS.light;
let warm = 0;
function applyLight(key) {
  const L = LIGHTS[key];
  lightKey = key;
  const dir = sunDirection(L);
  shared.uSunDir.value.copy(dir);
  shared.uSunColor.value.copy(sunColor(L, dir));
  shared.uHaze.value = L.haze;
  shared.uSkyExposure.value = L.skyExposure;
  const night = L.night ? 1 : 0;
  if (night) {
    shared.uSkyAmbient.value.set(0.013, 0.019, 0.036);
    shared.uGroundBounce.value.set(0.004, 0.0035, 0.003);
  } else if (key === 'golden') {
    shared.uSkyAmbient.value.set(0.10, 0.13, 0.20);
    shared.uGroundBounce.value.set(0.10, 0.06, 0.03);
  } else {
    shared.uSkyAmbient.value.set(0.17, 0.25, 0.42);
    shared.uGroundBounce.value.set(0.17, 0.11, 0.06);
  }
  clouds.uniforms.uCoverage.value = L.coverage;
  skyLUT.bake(dir, L.haze);
  mountains.bakeLighting(dir);
  shared.uShadowStrip.value.copy(railShadow(dir));
  finalMat.uniforms.uExposure.value = L.exposure;
  warm = L.warm;
  finalMat.uniforms.uWarm.value = warm;
  finalMat.uniforms.uNight.value = night;
  skyDome.material.uniforms.uNight.value = night;
  shared.uHeadOn.value = night ? 450 : 0;
  shared.uLampBoost.value = night ? 12 : 1;
  glow = night;
  audio.setNight?.(night);
  clouds.reset();
  const btn = $('lightBtn');
  if (btn) btn.textContent = L.label;
}

// ---------- drive ----------
let s = 120;
let yaw = frameAt(s + 25).heading;
let t = 0;
let paused = false;
const f = {};
const look = {};

function noise1(x) {
  const i = Math.floor(x), fr = x - i;
  const h = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const u = fr * fr * (3 - 2 * fr);
  return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
}

function updateCamera(dt) {
  frameAt(s, f);
  frameAt(s + 28, look);
  const target = Math.atan2(-(look.x + look.rx * LANE - (f.x + f.rx * LANE)), -(look.z + look.rz * LANE - (f.z + f.rz * LANE)));
  yaw += (target - yaw) * Math.min(1, dt * 1.6);
  const x = f.x + f.rx * LANE, z = f.z + f.rz * LANE;
  const vib = t * 9.0;
  const y = CAM_H + 0.012 * noise1(vib) + 0.006 * noise1(vib * 2.7 + 4);
  const pitch = THREE.MathUtils.degToRad(4.6 + 0.06 * noise1(vib * 0.8 + 9) + 0.25 * noise1(t * 0.11));
  const roll = THREE.MathUtils.degToRad(0.08 * noise1(vib * 0.6 + 2) + 0.2 * noise1(t * 0.07 + 5));
  const yawJ = THREE.MathUtils.degToRad(0.04 * noise1(vib * 0.5 + 7) + 0.35 * noise1(t * 0.05 + 11));
  for (const c of [farCam, nearCam]) {
    c.position.set(x, y, z);
    c.rotation.set(pitch, yaw + yawJ, roll, 'YXZ');
    c.updateMatrixWorld();
  }
  shared.uCamW.value.set(x, y, z);
  // our low beams sit at bumper height, aimed along the car's heading and dipped slightly
  const hy = yaw + yawJ * 0.3;
  const fx = -Math.sin(hy), fz = -Math.cos(hy);
  shared.uHeadPos.value.set(x + fx * 1.7, 0.72, z + fz * 1.7);
  shared.uHeadDir.value.set(fx, -0.012, fz).normalize();
  shared.uHeadRight.value.set(-fz, 0, fx);
  shared.uCamB.value.set(0, y, 0);
  backdrop.position.set(x, 0, z);
  backdrop.updateMatrixWorld();
  const step = ground.userData.cellStep;
  ground.position.set(Math.round(x / step) * step, 0, Math.round(z / step) * step);
  ground.updateMatrixWorld();
  for (const c of cover) c.update(x, z, t);
  window.__hr?.camHook?.(farCam, nearCam);
}

// ---------- adaptive quality ----------
let quality = params.get('q') ? parseFloat(params.get('q')) : 1;
let frameTimes = [];
function adapt(dt) {
  if (params.get('q')) return;
  frameTimes.push(dt);
  if (frameTimes.length < 90) return;
  frameTimes.sort((a, b) => a - b);
  const med = frameTimes[45];
  frameTimes = [];
  if (med > 0.024 && quality > 0.55) { quality = Math.max(0.55, quality * 0.85); resize(); }
  else if (med < 0.012 && quality < 1) { quality = Math.min(1, quality * 1.1); resize(); }
}

// ---------- frame ----------
const audio = new DriveAudio();
let fade = 0;
let last = performance.now();

function render() {
  const r = renderer;
  // far: sky + mountains
  r.setRenderTarget(rtFar);
  r.clear(true, true, false);
  r.render(farScene, farCam);
  // clouds over the far scene
  clouds.render(farCam, rtFar.depthTexture);
  // composite into the main target, then the near world on top
  r.setRenderTarget(rtMain);
  r.clear(false, true, false);
  quad.material = composite;
  composite.uniforms.uFar.value = rtFar.texture;
  composite.uniforms.uClouds.value = clouds.texture;
  r.render(quadScene, quadCam);
  r.render(nearScene, nearCam);
  // to screen
  r.setRenderTarget(null);
  quad.material = finalMat;
  finalMat.uniforms.uSrc.value = rtMain.texture;
  r.render(quadScene, quadCam);
}

function tick(now) {
  requestAnimationFrame(tick);
  let dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (document.hidden) return;
  adapt(dt);
  if (paused) dt = 0;
  t += dt;
  s += SPEED * dt;
  if (s > PERIOD) { s -= PERIOD; traffic.wrap(); }
  updateCamera(dt);
  clouds.update(dt, t);
  traffic.update(dt, t, s, SPEED, shared.uSunDir.value, glow);
  skyDome.material.uniforms.uTime.value = t;
  fade = Math.min(1, fade + (now > 0 ? 0.02 : 0));
  finalMat.uniforms.uFade.value = fade * fade;
  finalMat.uniforms.uTime.value = t;
  audio.update(dt, traffic.list, s, SPEED);
  render();
}

// ---------- UI ----------
function setupUI() {
  const lightBtn = $('lightBtn'), soundBtn = $('soundBtn'), pauseBtn = $('pauseBtn'), hideBtn = $('hideBtn');
  const keys = Object.keys(LIGHTS);
  const cycleLight = () => {
    const next = keys[(keys.indexOf(lightKey) + 1) % keys.length];
    fade = 0.35;
    applyLight(next);
    PREFS.light = next; savePrefs();
  };
  const toggleSound = async () => {
    PREFS.sound = !audio.on;
    await audio.setOn(PREFS.sound);
    soundBtn.setAttribute('aria-pressed', String(audio.on));
    soundBtn.textContent = audio.on ? 'Sound on' : 'Sound off';
    savePrefs();
  };
  const togglePause = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Drive' : 'Pause';
    pauseBtn.setAttribute('aria-pressed', String(paused));
    audio.setPaused(paused);
  };
  const toggleHud = () => document.body.classList.toggle('clean');
  lightBtn.addEventListener('click', cycleLight);
  soundBtn.addEventListener('click', toggleSound);
  pauseBtn.addEventListener('click', togglePause);
  hideBtn.addEventListener('click', toggleHud);
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'l') cycleLight();
    else if (k === 'm') toggleSound();
    else if (k === 'h') toggleHud();
    else if (k === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
  });
  // the controls drift away while you watch
  let idle;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idle);
    idle = setTimeout(() => document.body.classList.add('idle'), 3500);
  };
  addEventListener('pointermove', wake);
  addEventListener('keydown', wake);
  wake();
  soundBtn.textContent = 'Sound off';
}

async function start() {
  if (!renderer.capabilities.isWebGL2) { status('This needs WebGL2.'); return; }
  quality = params.get('q') ? parseFloat(params.get('q')) : 1;
  resize();
  status('Weaving cloud noise');
  await nextFrame();
  clouds.bake();
  status('Raising the mountains');
  await nextFrame();
  mountains.bakeHeights();
  status('Letting the light in');
  await nextFrame();
  applyLight(lightKey);
  frameAt(s, f);
  traffic.init(s, SPEED);
  updateCamera(0);
  clouds.update(0, 0);
  // warm the cloud history so the first visible frame is already smooth
  for (let i = 0; i < 12; i++) render();
  await nextFrame();
  $('loader').classList.add('done');
  setupUI();
  addEventListener('resize', resize);
  last = performance.now();
  requestAnimationFrame(tick);
}

window.__hr = { THREE, farCam, nearCam, renderer, farScene, nearScene, ground, road, traffic, clouds, mountains, skyLUT, shared, composite, finalMat, get s() { return s; }, set s(v) { s = v; }, get t() { return t; }, get rtMain() { return rtMain; } };

start().catch((e) => { console.error(e); status('Something went wrong: ' + e.message); });
