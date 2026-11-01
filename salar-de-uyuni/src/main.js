import * as THREE from 'three';
import './style.css';
import { atmosphere, SUN_DIRECTION } from './scene/atmosphere.js';
import { createSky, createEnvironment } from './scene/Sky.js';
import { Clouds } from './scene/Clouds.js';
import { createMountains } from './scene/Mountains.js';
import { MirrorWater } from './scene/Water.js';
import { Cyclist } from './cyclist/Cyclist.js';
import { CameraRig, CAMERA_MODES } from './camera/CameraRig.js';
import { ControlPanel } from './ui/ControlPanel.js';

const isMobile = matchMedia('(pointer: coarse)').matches;
const SUN_INTENSITY = 3.0;
const params = new URLSearchParams(location.search);
// ?record: deterministic frame-stepped mode driven by scripts/record.mjs.
const recording = params.has('record');

const state = {
  paused: false,
  speed: 2.4,
  mode: 'cinematic',
  daylight: 1,
  frame: params.get('frame') === 'full' ? 'full' : 'portrait',
};

const frameEl = document.getElementById('frame');
const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 9 / 16, 0.1, 60000);

const sky = createSky();
scene.add(sky);
scene.environment = createEnvironment(renderer);

// Tight shadow frustum that travels with the rider: crisp, cheap soft shadows.
const sun = new THREE.DirectionalLight(atmosphere.uSunColor.value.clone(), SUN_INTENSITY);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 5, far: 60 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.015;
scene.add(sun, sun.target);

const mountains = createMountains();
const clouds = new Clouds();
const water = new MirrorWater();
const cyclist = new Cyclist();
scene.add(mountains, clouds.mesh, water.mesh, cyclist.root);

const rig = new CameraRig(camera, canvas);

const panel = new ControlPanel(frameEl, state, {
  onPause: (v) => { state.paused = v; panel.sync(); },
  onSpeed: (v) => { state.speed = v; panel.sync(); },
  onMode: (m) => rig.setMode(m),
  onDaylight: (v) => applyDaylight(v),
  onFrame: (f) => { state.frame = f; layout(); panel.sync(); },
});
rig.onModeChange = (m) => {
  state.mode = m;
  panel.sync();
  if (m === 'orbit') frameEl.classList.add('interacted');
};

function applyDaylight(v) {
  state.daylight = v;
  atmosphere.uDaylight.value = v;
  sun.intensity = SUN_INTENSITY * v;
  scene.environmentIntensity = v;
  panel.sync();
}

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let w = vw;
  const h = vh;
  if (state.frame === 'portrait' && vw / vh > 9 / 16) w = Math.round(vh * (9 / 16));
  frameEl.style.width = `${w}px`;
  frameEl.style.height = `${h}px`;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w / h < 1 ? 52 : 34;
  camera.updateProjectionMatrix();
  const pr = renderer.getPixelRatio();
  const rs = recording ? 1 : isMobile ? 0.6 : 0.85;
  water.setSize(Math.round(w * pr * rs), Math.round(h * pr * rs));
}
window.addEventListener('resize', layout);
layout();

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === 'Space') {
    e.preventDefault();
    state.paused = !state.paused;
    panel.sync();
  } else if (/^Digit[1-4]$/.test(e.code)) {
    rig.setMode(CAMERA_MODES[Number(e.code.slice(5)) - 1]);
  } else if (e.code === 'KeyH') {
    frameEl.classList.toggle('ui-hidden');
  }
});

// Each tyre drops a ripple every few tens of centimetres travelled.
const RIPPLE_SPACING = 0.34;
const contacts = [new THREE.Vector3(), new THREE.Vector3()];
const rippleTravel = [0, RIPPLE_SPACING / 2];
let simTime = 0;

function emitRipples(ds) {
  if (ds <= 0) return;
  cyclist.contactPoints(contacts);
  const amp = 0.0035 * Math.min(state.speed / 2.4, 1.6);
  for (let i = 0; i < 2; i++) {
    rippleTravel[i] += ds;
    if (rippleTravel[i] >= RIPPLE_SPACING) {
      rippleTravel[i] = 0;
      water.addRipple(contacts[i].x, contacts[i].z, simTime, amp);
    }
  }
}

const clock = new THREE.Clock();
let firstFrame = true;

function tick(dt) {
  const sdt = state.paused ? 0 : dt;
  simTime += sdt;
  atmosphere.uTime.value = simTime;

  const before = cyclist.distance;
  cyclist.update(sdt, state.speed, simTime);
  emitRipples(cyclist.distance - before);

  rig.update(dt, cyclist);
  sky.position.copy(camera.position);
  mountains.position.set(camera.position.x, 0, camera.position.z);
  water.follow(camera.position);
  water.setBike(cyclist.position, cyclist.forward);
  clouds.update(camera, dt);

  sun.position.copy(cyclist.position).addScaledVector(SUN_DIRECTION, 30);
  sun.target.position.copy(cyclist.position);

  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    requestAnimationFrame(() => frameEl.classList.add('ready'));
  }
}

if (recording) {
  frameEl.classList.add('recording');
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  window.__record = {
    // Advance the simulation without capturing (lets the ripple trail build up).
    warmup(seconds, fps) {
      for (let i = 0; i < Math.round(seconds * fps); i++) tick(1 / fps);
    },
    startShowcase() {
      rig.setMode('showcase');
    },
    // Render one frame and return the bare canvas (no DOM overlays) as a PNG data URL.
    snapshot(fps) {
      tick(1 / fps);
      return canvas.toDataURL('image/png');
    },
    // Render one frame and wait until it is composited so a screenshot sees it.
    async step(fps) {
      tick(1 / fps);
      await nextFrame();
      await nextFrame();
    },
  };
} else {
  renderer.setAnimationLoop(() => tick(Math.min(clock.getDelta(), 1 / 20)));
}

// Handy for debugging from the console.
window.__uyuni = { scene, camera, renderer, cyclist, rig, state };
