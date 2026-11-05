import * as THREE from 'three';
import { LIGHTS, SkyLUT, createSkyDome, sunDirection, sunColor, fullscreenQuad } from './sky.js';
import { Mountains } from './mountains.js';
import { createGround } from './ground.js';
import { createGrass, createFlowers, createStones, createConifers, createBroadleaf } from './grass.js';
import { createRoad, railShadow } from './road.js';
import { createPropMaterial } from './props.js';
import { Traffic, createShadowMaterial } from './vehicles.js';
import { Clouds, SHADOW_RECT } from './clouds.js';
import { createCompositeMaterial, createFinalMaterial } from './post.js';
import { frameAt, LANE, PERIOD, ROUTES, setRoute, routeLen, route, roadUniforms, terrainApprox } from './roadpath.js';
import { BIOMES, SCENES, VIEWS, PAINTS, PACES, setBiome, biomeUniforms } from './scenes.js';
import { PlayerCar } from './car.js';
import { DriveAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const status = (s) => { const el = $('loadStatus'); if (el) el.textContent = s; };

const params = new URLSearchParams(location.search);
const PREFS = (() => {
  const d = { light: 'day', sound: false, scene: 'plateau', route: null, land: null, view: 'windscreen', pace: 'cruise', paint: 'red', tour: false };
  try { return { ...d, ...JSON.parse(localStorage.getItem('highroad.prefs') || '{}') }; } catch { return d; }
})();
const savePrefs = () => { try { localStorage.setItem('highroad.prefs', JSON.stringify(PREFS)); } catch {} };
const pick = (k, table) => { const v = params.get(k); if (v && table[v]) PREFS[k === 'land' ? 'land' : k] = v; };
pick('light', LIGHTS); pick('scene', SCENES); pick('route', ROUTES); pick('land', BIOMES); pick('view', VIEWS); pick('pace', PACES); pick('paint', PAINTS);
if (params.get('scene')) { PREFS.route = params.get('route') || null; PREFS.land = params.get('land') || null; if (!params.get('light')) PREFS.light = SCENES[PREFS.scene].light; }
if (!SCENES[PREFS.scene]) PREFS.scene = 'plateau';
if (!VIEWS[PREFS.view]) PREFS.view = 'windscreen';
if (!PACES[PREFS.pace]) PREFS.pace = 'cruise';
if (!PAINTS[PREFS.paint]) PREFS.paint = 'red';
if (!LIGHTS[PREFS.light]) PREFS.light = 'day';

const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
renderer.autoClear = false;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

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
  ...roadUniforms,
  ...biomeUniforms,
};
let glow = 0;

// the route and land must be live before any shader compiles against them
setRoute(PREFS.route || SCENES[PREFS.scene].route);
setBiome(PREFS.land || SCENES[PREFS.scene].biome);

// ---------- scenes ----------
const farScene = new THREE.Scene();
const nearScene = new THREE.Scene();
const farCam = new THREE.PerspectiveCamera(42, 16 / 9, 40, 420000);
const nearCam = new THREE.PerspectiveCamera(42, 16 / 9, 0.08, 9000);

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
const trees = [createConifers(shared), createBroadleaf(shared)];
const cover = [createGrass(shared), createFlowers(shared), createStones(shared), ...trees];
nearScene.add(...cover);
const propMat = createPropMaterial(shared);
const cabinMat = createPropMaterial(shared, { interior: true });
const road = createRoad(shared, propMat);
nearScene.add(road);
const traffic = new Traffic(nearScene, propMat);
const car = new PlayerCar(nearScene, propMat, cabinMat, createShadowMaterial());
traffic.extra.push({ mesh: car.exterior, root: car.root, model: car.model, brake: () => car.brake });

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

// field of view per camera; portrait screens get a wider one so the scene still fits
const FOV = { windscreen: 42, cockpit: 54, hood: 50, bumper: 54, chase: 52, far: 48, cinema: 40 };
let fovNow = 42, fovTarget = 42;
function applyFov(fov) {
  fovNow = fov;
  const aspect = W / H;
  const f = aspect < 1 ? Math.min(fov * 1.45, 80) : fov;
  for (const c of [farCam, nearCam]) { c.aspect = aspect; c.fov = f; c.updateProjectionMatrix(); }
  shared.uPixAngle.value = (2 * Math.tan(THREE.MathUtils.degToRad(f) / 2)) / H;
  traffic.setPixelScale(H / (2 * Math.tan(THREE.MathUtils.degToRad(f) / 2)));
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
  finalMat.uniforms.uRes.value.set(W, H);
  applyFov(fovNow);
}

// ---------- lighting ----------
let lightKey = PREFS.light;
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
  // snow throws a lot more light back up
  if (biomeUniforms.uSnowCover.value > 0) shared.uGroundBounce.value.multiplyScalar(2.2).add(new THREE.Vector3(0.02, 0.025, 0.035).multiplyScalar(night ? 0.05 : 1));
  clouds.uniforms.uCoverage.value = L.coverage;
  skyLUT.bake(dir, L.haze);
  mountains.bakeLighting(dir);
  shared.uShadowStrip.value.copy(railShadow(dir));
  // snow fields run a stop darker so they don't blow out
  finalMat.uniforms.uExposure.value = L.exposure * (biomeUniforms.uSnowCover.value > 0 ? 0.78 : 1);
  finalMat.uniforms.uWarm.value = L.warm;
  finalMat.uniforms.uNight.value = night;
  skyDome.material.uniforms.uNight.value = night;
  shared.uHeadOn.value = night ? 450 : 0;
  shared.uLampBoost.value = night ? 12 : 1;
  glow = night;
  audio.setMood(key);
  clouds.reset();
}

// ---------- drive ----------
// s: our car's distance along the road; v: its speed. The windscreen view keeps the
// original eye-level drive; the other views ride on the car.
let s = 120;
let v = 15;
let accelNow = 0, latAccNow = 0;
let lat = LANE, latPrev = LANE;
let t = 0;
let paused = false;
let viewKey = PREFS.view;
let paceKey = PREFS.pace;
let yaw = frameAt(s + 25).heading;
let gradeCam = 0;
const f = {};
const look = {};
const fc = {};

function noise1(x) {
  const i = Math.floor(x), fr = x - i;
  const h = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  const u = fr * fr * (3 - 2 * fr);
  return (h(i) * (1 - u) + h(i + 1) * u) * 2 - 1;
}

const vmax = () => route().vmax * PACES[paceKey].speed;
function targetSpeed() {
  // slow for the sharpest bend within braking distance ahead
  const P = PACES[paceKey];
  const reach = 30 + v * v / 4 + v * 2;
  let kmax = 0;
  const g = {};
  for (let d = 0; d <= reach; d += 6) { frameAt(s + d, g); kmax = Math.max(kmax, Math.abs(g.curv) - d * 1e-5); }
  return Math.max(8, Math.min(vmax(), Math.sqrt(P.lat / Math.max(kmax, 1e-5))));
}

function drive(dt) {
  if (dt <= 0) { accelNow = 0; return; }
  const P = PACES[paceKey];
  const tv = targetSpeed();
  const up = paceKey === 'cruise' ? 0.9 : paceKey === 'brisk' ? 2.2 : 3.6;
  const down = paceKey === 'cruise' ? 1.8 : 4.5;
  const a = THREE.MathUtils.clamp((tv - v) * 0.8, -down, up);
  accelNow += (a - accelNow) * Math.min(1, dt * 3);
  v = Math.max(0, v + accelNow * dt);
  s += v * dt;
  frameAt(s, f);
  latAccNow = v * v * f.curv;
  // hold the lane, easing a little toward the inside of bends
  latPrev = lat;
  const inside = THREE.MathUtils.clamp(f.curv * (paceKey === 'cruise' ? 18 : 40), -0.45, 0.45);
  const latT = LANE + inside + 0.12 * noise1(t * 0.07 + 3) + 0.05 * noise1(t * 0.31);
  lat += (latT - lat) * Math.min(1, dt * 1.2);
  car.yawOff = -Math.atan((lat - latPrev) / Math.max(v * dt, 1e-3));
  car.brake += ((accelNow < -0.6 ? 1 : 0) - car.brake) * Math.min(1, dt * 5);
}

// ---------- cameras ----------
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _w = new THREE.Vector3();
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
const chase = { pos: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, -1), ready: false };
const shot = { kind: '', t: 0, len: 0, p: new THREE.Vector3(), a: 0, s: 0, side: 1, look: new THREE.Vector3(), ready: false };
let headYaw = 0;

function placeCam(pos, quat) {
  for (const c of [farCam, nearCam]) { c.position.copy(pos); c.quaternion.copy(quat); c.updateMatrixWorld(); }
}
function lookCam(pos, target, roll = 0) {
  const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0));
  _q.setFromRotationMatrix(m);
  if (roll) _q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  placeCam(pos, _q);
}
// a point in the car body's frame, to world
const carPoint = (x, y, z, out = new THREE.Vector3()) => out.set(x, y, z).applyMatrix4(car.body.matrixWorld);
// keep a free camera out of the ground beside the road
function aboveGround(p, minH) {
  frameAt(s, fc);
  // lateral offset and along-road distance of p from the car's frame
  const dx = p.x - fc.x, dz = p.z - fc.z;
  const along = dx * fc.tx + dz * fc.tz, side = dx * fc.rx + dz * fc.rz;
  const gy = terrainApprox(s + along, side);
  if (p.y < gy + minH) p.y = gy + minH;
}

const SHOTS = ['trackside', 'tracking', 'front', 'drone', 'wheel', 'aerial', 'trackside'];
function nextShot() {
  let k;
  do { k = SHOTS[Math.floor(Math.random() * SHOTS.length)]; } while (k === shot.kind);
  shot.kind = k; shot.t = 0; shot.ready = false;
  shot.len = k === 'trackside' ? 6 + Math.random() * 2 : 7 + Math.random() * 4;
  shot.side = Math.random() < 0.5 ? -1 : 1;
  shot.a = Math.random() * Math.PI * 2;
}

function updateCamera(dt) {
  const viewMode = viewKey;
  car.setMode(viewMode === 'windscreen' ? 'none' : viewMode === 'cockpit' ? 'cabin' : 'full');
  frameAt(s, f);
  car.update(dt, f, lat, v, accelNow, latAccNow, t, shared.uSunDir.value);
  fovTarget = FOV[viewMode];
  const vib = t * 9.0;

  if (viewMode === 'windscreen') {
    frameAt(s + 28, look);
    const target = Math.atan2(-(look.x + look.rx * LANE - (f.x + f.rx * LANE)), -(look.z + look.rz * LANE - (f.z + f.rz * LANE)));
    let dy = target - yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    yaw += dy * Math.min(1, dt * 1.6);
    gradeCam += (Math.atan(frameAt(s + 12, look).grade) - gradeCam) * Math.min(1, dt * 2);
    const x = f.x + f.rx * LANE, z = f.z + f.rz * LANE;
    const y = f.y + CAM_H + 0.012 * noise1(vib) + 0.006 * noise1(vib * 2.7 + 4);
    const pitch = THREE.MathUtils.degToRad(4.6 + 0.06 * noise1(vib * 0.8 + 9) + 0.25 * noise1(t * 0.11)) + gradeCam * 0.8;
    const roll = THREE.MathUtils.degToRad(0.08 * noise1(vib * 0.6 + 2) + 0.2 * noise1(t * 0.07 + 5));
    const yawJ = THREE.MathUtils.degToRad(0.04 * noise1(vib * 0.5 + 7) + 0.35 * noise1(t * 0.05 + 11));
    camPos.set(x, y, z);
    _e.set(pitch, yaw + yawJ, roll, 'YXZ');
    placeCam(camPos, _q.setFromEuler(_e));
    // our low beams sit at bumper height, aimed along the car's heading and dipped slightly
    const hy = yaw + yawJ * 0.3;
    const fx = -Math.sin(hy), fz = -Math.cos(hy);
    shared.uHeadPos.value.set(x + fx * 1.7, f.y + 0.72, z + fz * 1.7);
    shared.uHeadDir.value.set(fx, -0.012 + Math.tan(gradeCam), fz).normalize();
    shared.uHeadRight.value.set(-fz, 0, fx);
  } else {
    // headlamps ride on the car
    carPoint(0, 0.66, -2.3, shared.uHeadPos.value);
    _v.set(0, -0.012, -1).transformDirection(car.root.matrixWorld);
    shared.uHeadDir.value.copy(_v);
    _w.set(1, 0, 0).transformDirection(car.root.matrixWorld);
    shared.uHeadRight.value.set(_w.x, 0, _w.z).normalize();

    if (viewMode === 'cockpit' || viewMode === 'hood' || viewMode === 'bumper') {
      // the driver glances into the bends
      headYaw += ((viewMode === 'cockpit' ? -f.curv * 9 : -f.curv * 3) - headYaw) * Math.min(1, dt * 1.5);
      headYaw = THREE.MathUtils.clamp(headYaw, -0.3, 0.3);
      const eye = viewMode === 'cockpit' ? [-0.37, 1.12, 0.06] : viewMode === 'hood' ? [0, 1.12, -1.06] : [0, 0.5, -2.38];
      carPoint(eye[0], eye[1], eye[2], camPos);
      const pitch = THREE.MathUtils.degToRad(viewMode === 'cockpit' ? -3.5 : viewMode === 'hood' ? -1.5 : 0.5);
      const shake = viewMode === 'cockpit' ? 1 : 0.6;
      _e.set(pitch + 0.0012 * shake * noise1(vib * 1.3), headYaw + 0.001 * noise1(vib + 3), 0.0008 * noise1(vib * 0.9 + 5), 'YXZ');
      car.body.getWorldQuaternion(_q);
      _q.multiply(new THREE.Quaternion().setFromEuler(_e));
      placeCam(camPos, _q);
    } else if (viewMode === 'chase' || viewMode === 'far') {
      const far = viewMode === 'far';
      const dist = far ? 12.5 : 5.9, h = far ? 4.4 : 1.75;
      const carC = car.root.position;
      // the camera swings round lazily, so bends show the car's flank
      _v.set(f.tx, 0, f.tz);
      if (!chase.ready) { chase.fwd.copy(_v); }
      chase.fwd.lerp(_v, Math.min(1, dt * (far ? 1.6 : 2.4))).normalize();
      _w.copy(carC).addScaledVector(chase.fwd, -dist);
      _w.y = carC.y + h + Math.tan(Math.atan(f.grade)) * -dist * 0.8;
      if (!chase.ready) { chase.pos.copy(_w); chase.ready = true; }
      chase.pos.lerp(_w, Math.min(1, dt * 6));
      aboveGround(chase.pos, 0.8);
      camLook.copy(carC).addScaledVector(chase.fwd, far ? 6 : 3.2);
      camLook.y += far ? 0.6 : 0.95;
      lookCam(chase.pos, camLook, -latAccNow * 0.004);
    } else {
      cinema(dt);
    }
  }
  chase.ready = viewMode === 'chase' || viewMode === 'far' ? chase.ready : false;

  const cp = nearCam.position;
  shared.uCamW.value.copy(cp);
  shared.uCamB.value.set(0, cp.y, 0);
  backdrop.position.set(cp.x, 0, cp.z);
  backdrop.updateMatrixWorld();
  const step = ground.userData.cellStep;
  ground.position.set(Math.round(cp.x / step) * step, 0, Math.round(cp.z / step) * step);
  ground.updateMatrixWorld();
  for (const c of cover) c.update(cp.x, cp.z, t);
  window.__hr?.camHook?.(farCam, nearCam);
}

function cinema(dt) {
  if (!shot.kind || shot.t > shot.len) nextShot();
  shot.t += dt;
  const carC = car.root.position;
  const fwd = _v.set(f.tx, 0, f.tz);
  const right = _w.set(f.rx, 0, f.rz);
  let p = camPos, target = camLook;
  fovTarget = 40;
  switch (shot.kind) {
    case 'trackside': {
      // a camera planted by the road ahead pans as we sweep past
      if (!shot.ready) {
        shot.s = s + 45 + v * 2.2;
        const g = frameAt(shot.s, {});
        const off = shot.side > 0 ? 7.5 + Math.random() * 4 : -(6.5 + Math.random() * 5);
        shot.p.set(g.x + g.rx * off, 0, g.z + g.rz * off);
        shot.p.y = terrainApprox(shot.s, off) + 0.9 + Math.random() * 1.4;
        shot.ready = true;
      }
      p.copy(shot.p);
      target.copy(carC); target.y += 0.7;
      fovTarget = THREE.MathUtils.clamp(24 + p.distanceTo(carC) * 0.25, 24, 50);
      if (s > shot.s + 40) shot.t = shot.len + 1;
      break;
    }
    case 'tracking': {
      // a camera car running alongside in the other lane
      p.copy(carC).addScaledVector(right, -5.2).addScaledVector(fwd, 1.5 + Math.sin(shot.t * 0.25) * 2.0);
      p.y = carC.y + 1.1;
      target.copy(carC).addScaledVector(fwd, 0.4); target.y += 0.55;
      fovTarget = 40;
      break;
    }
    case 'front': {
      p.copy(carC).addScaledVector(fwd, 8 + Math.sin(shot.t * 0.3) * 1.2).addScaledVector(right, 0.6 * shot.side);
      p.y = carC.y + 0.85;
      target.copy(carC); target.y += 0.6;
      fovTarget = 38;
      break;
    }
    case 'drone': {
      shot.a += dt * 0.16 * shot.side;
      p.set(carC.x + Math.sin(shot.a) * 14, carC.y + 6.5, carC.z + Math.cos(shot.a) * 14);
      target.copy(carC).addScaledVector(fwd, 2); target.y += 0.5;
      fovTarget = 44;
      break;
    }
    case 'wheel': {
      carPoint(shot.side * 1.25, 0.42, 1.6, p);
      carPoint(shot.side * 0.95, 0.55, -6, target);
      fovTarget = 50;
      break;
    }
    case 'aerial': {
      p.copy(carC).addScaledVector(fwd, -30 + shot.t * 2.0).addScaledVector(right, 12 * shot.side);
      p.y = carC.y + 34;
      target.copy(carC).addScaledVector(fwd, 18);
      fovTarget = 42;
      break;
    }
  }
  aboveGround(p, 0.5);
  lookCam(p, target);
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
let pending = null; // a change waiting for the screen to go dark

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

// Offline capture drives the clock itself (see window.__hr.capture below).
let manual = false;
let fadeOverride = null;

function tick(now) {
  requestAnimationFrame(tick);
  let dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (document.hidden || manual) return;
  adapt(dt);
  if (pending) {
    fade = Math.max(0, fade - dt * 3.5);
    if (fade === 0) { const fn = pending; pending = null; fn(); }
  }
  if (paused) dt = 0;
  advance(dt);
  render();
  tour(dt);
}

function advance(dt) {
  t += dt;
  drive(dt);
  const len = routeLen();
  if (s > len) {
    s -= len;
    traffic.wrap(len);
    const shift = new THREE.Vector3(0, 0, PERIOD);
    chase.pos.add(shift);
    shot.p.add(shift); shot.s -= len;
  }
  if (Math.abs(fovTarget - fovNow) > 0.01) applyFov(fovNow + (fovTarget - fovNow) * Math.min(1, dt * (viewKey === 'cinema' ? 1.2 : 4)));
  updateCamera(dt);
  clouds.update(dt, t);
  traffic.update(dt, t, s, v, shared.uSunDir.value, glow);
  skyDome.material.uniforms.uTime.value = t;
  shared.uWater.value.z = t;
  if (!pending) fade = Math.min(1, fade + 0.02);
  finalMat.uniforms.uFade.value = fadeOverride ?? fade * fade;
  finalMat.uniforms.uTime.value = t;
  audio.update(dt, traffic.list, s, v);
}

// ---------- scene switching ----------
let sceneKey = PREFS.scene;
let routeKey = PREFS.route || SCENES[sceneKey].route;
let landKey = PREFS.land || SCENES[sceneKey].biome;

function restartDrive() {
  traffic.clear();
  s = 120; lat = LANE; latPrev = LANE;
  frameAt(s, f);
  v = Math.min(vmax(), targetSpeed());
  yaw = frameAt(s + 25).heading;
  chase.ready = false; shot.kind = '';
  traffic.init(s, v, paceKey === 'cruise');
}
function useRoute(key) {
  routeKey = key;
  setRoute(key);
  road.rebuild();
  restartDrive();
}
function useLand(key) {
  landKey = key;
  setBiome(key);
  trees[0].visible = biomeUniforms.uTrees.value.x > 0;
  trees[1].visible = biomeUniforms.uTrees.value.y > 0;
  cover[1].visible = biomeUniforms.uCover.value.z > 0;
  applyLight(lightKey);
}
function change(fn) {
  // fade to dark, rebuild, fade back up
  if (manual) { fn(); return; }
  const prev = pending;
  pending = prev ? () => { prev(); fn(); } : fn;
}
function goScene(key, { instant = false } = {}) {
  const S = SCENES[key];
  const run = () => {
    sceneKey = key;
    if (S.route !== routeKey) useRoute(S.route);
    lightKey = S.light;
    useLand(S.biome);
    PREFS.scene = key; PREFS.route = null; PREFS.land = null; PREFS.light = S.light; savePrefs();
    syncUI();
  };
  instant ? run() : change(run);
}

// ---------- auto tour ----------
let tourOn = PREFS.tour;
let tourT = 0;
const TOUR_SCENE = 150, TOUR_VIEW = 40;
let tourViewT = 0;
function tour(dt) {
  if (!tourOn || paused || pending) return;
  tourT += dt; tourViewT += dt;
  if (tourT > TOUR_SCENE) {
    tourT = 0;
    const keys = Object.keys(SCENES);
    goScene(keys[(keys.indexOf(sceneKey) + 1) % keys.length]);
  }
  if (tourViewT > TOUR_VIEW) {
    tourViewT = 0;
    const order = ['windscreen', 'chase', 'cinema', 'cockpit', 'far', 'cinema', 'hood'];
    setView(order[(order.indexOf(viewKey) + 1) % order.length] || 'chase');
  }
}

// ---------- UI ----------
function setView(key) {
  viewKey = key;
  PREFS.view = key; savePrefs();
  if (key !== 'cinema') shot.kind = '';
  syncUI();
}
function cycle(table, cur) { const k = Object.keys(table); return k[(k.indexOf(cur) + 1) % k.length]; }

function chips(el, table, cur, onPick) {
  el.innerHTML = '';
  for (const [k, d] of Object.entries(table)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d.label;
    b.setAttribute('aria-pressed', String(k === cur));
    if (d.desc) b.title = d.desc;
    b.addEventListener('click', () => onPick(k));
    el.appendChild(b);
  }
}

function syncUI() {
  const S = SCENES[sceneKey];
  const custom = routeKey !== S.route || landKey !== S.biome;
  $('sceneBtn').textContent = custom ? 'Custom drive' : S.label;
  $('viewBtn').textContent = VIEWS[viewKey].label;
  $('lightBtn').textContent = LIGHTS[lightKey].label;
  $('sceneName').textContent = custom ? `${ROUTES[routeKey].label} · ${BIOMES[landKey].label}` : S.label;
  $('sceneDesc').textContent = ROUTES[routeKey].desc;
  chips($('pScene'), SCENES, custom ? '' : sceneKey, (k) => goScene(k));
  chips($('pRoute'), ROUTES, routeKey, (k) => change(() => { useRoute(k); PREFS.route = k; savePrefs(); syncUI(); }));
  chips($('pLand'), BIOMES, landKey, (k) => change(() => { useLand(k); PREFS.land = k; savePrefs(); syncUI(); }));
  chips($('pLight'), LIGHTS, lightKey, (k) => setLight(k));
  chips($('pView'), VIEWS, viewKey, (k) => setView(k));
  chips($('pPace'), PACES, paceKey, (k) => setPace(k));
  chips($('pPaint'), PAINTS, PREFS.paint, (k) => setPaint(k));
  const tb = $('tourBtn');
  tb.setAttribute('aria-pressed', String(tourOn));
  tb.textContent = tourOn ? 'Auto tour on' : 'Auto tour off';
}
function setLight(k) {
  fade = Math.min(fade, 0.35);
  lightKey = k;
  applyLight(k);
  PREFS.light = k; savePrefs();
  syncUI();
}
function setPace(k) {
  paceKey = k;
  PREFS.pace = k; savePrefs();
  // the truck we follow only belongs to the slow drive
  if (k !== 'cruise' && traffic.lead) { traffic.lead.dir = 1; traffic.lead.base = v * 0.7; traffic.lead = null; }
  syncUI();
}
function setPaint(k) {
  PREFS.paint = k; savePrefs();
  car.setPaint(PAINTS[k].color);
  syncUI();
}

function setupUI() {
  const soundBtn = $('soundBtn'), pauseBtn = $('pauseBtn'), hideBtn = $('hideBtn'), panel = $('panel');
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
  const togglePanel = (open = panel.hidden) => {
    panel.hidden = !open;
    $('sceneBtn').setAttribute('aria-expanded', String(open));
  };
  const toggleTour = () => { tourOn = !tourOn; tourT = 0; tourViewT = 0; PREFS.tour = tourOn; savePrefs(); syncUI(); };
  $('sceneBtn').addEventListener('click', () => togglePanel());
  $('closePanel').addEventListener('click', () => togglePanel(false));
  $('viewBtn').addEventListener('click', () => setView(cycle(VIEWS, viewKey)));
  $('lightBtn').addEventListener('click', () => setLight(cycle(LIGHTS, lightKey)));
  $('tourBtn').addEventListener('click', toggleTour);
  soundBtn.addEventListener('click', toggleSound);
  pauseBtn.addEventListener('click', togglePause);
  hideBtn.addEventListener('click', toggleHud);
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const viewByKey = Object.entries(VIEWS).find(([, d]) => d.key === k);
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (viewByKey) setView(viewByKey[0]);
    else if (k === 'v' || k === 'c') setView(cycle(VIEWS, viewKey));
    else if (k === 'n') goScene(cycle(SCENES, sceneKey));
    else if (k === 'l') setLight(cycle(LIGHTS, lightKey));
    else if (k === 'p') setPace(cycle(PACES, paceKey));
    else if (k === 'k') setPaint(cycle(PAINTS, PREFS.paint));
    else if (k === 't') toggleTour();
    else if (k === 's') togglePanel();
    else if (k === 'escape') togglePanel(false);
    else if (k === 'm') toggleSound();
    else if (k === 'h') toggleHud();
    else if (k === 'f') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); }
  });
  // the controls drift away while you watch (not while the panel is open)
  let idle;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idle);
    idle = setTimeout(() => { if (panel.hidden) document.body.classList.add('idle'); }, 3500);
  };
  addEventListener('pointermove', wake);
  addEventListener('keydown', wake);
  wake();
  soundBtn.textContent = 'Sound off';
  syncUI();
}

async function start() {
  if (!renderer.capabilities.isWebGL2) { status('This needs WebGL2.'); return; }
  quality = params.get('q') ? parseFloat(params.get('q')) : 1;
  fovNow = fovTarget = FOV[viewKey];
  resize();
  status('Weaving cloud noise');
  await nextFrame();
  clouds.bake();
  status('Raising the mountains');
  await nextFrame();
  mountains.bakeHeights();
  status('Laying the road');
  await nextFrame();
  car.setPaint(PAINTS[PREFS.paint].color);
  useLand(landKey);
  restartDrive();
  status('Letting the light in');
  await nextFrame();
  applyLight(lightKey);
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

window.__hr = {
  // deterministic capture: stop the live loop, then step and render at a fixed rate
  capture: {
    start() { manual = true; quality = 1; resize(); },
    step(dt) { advance(dt); render(); },
    light(key) { applyLight(key); },
    fade(v) { fadeOverride = v; },
  },
  scene: (k) => goScene(k, { instant: true }),
  route: (k) => { useRoute(k); syncUI(); },
  land: (k) => { useLand(k); syncUI(); },
  view: setView, pace: setPace, paint: setPaint, light: setLight,
  THREE, farCam, nearCam, renderer, farScene, nearScene, ground, road, traffic, clouds, mountains, skyLUT, shared, composite, finalMat, car, shot,
  get s() { return s; }, set s(x) { s = x; }, get v() { return v; }, get t() { return t; }, get rtMain() { return rtMain; } };

start().catch((e) => { console.error(e); status('Something went wrong: ' + e.message); });
