// Three.js Scene Setup, Camera Presets & Smooth OrbitControls
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCampScene(canvas) {
  const scene = new THREE.Scene();

  const aspect = window.innerWidth / window.innerHeight;
  const baseFov = aspect < 0.95 ? 64 : 50;
  const camera = new THREE.PerspectiveCamera(
    baseFov,
    aspect,
    0.08,
    220
  );

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.minDistance = 1.6;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI * 0.487; // Prevent camera dipping below ground
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.45;
  controls.enablePan = true;
  controls.panSpeed = 1.4;
  controls.zoomSpeed = 0.85;

  // Camera Presets
  const PRESETS = {
    overland: {
      pos: new THREE.Vector3(2.0, 3.3, 10.7),
      target: new THREE.Vector3(0.35, 1.15, 0.45)
    },
    inside: {
      pos: new THREE.Vector3(2.0, 1.48, -0.75),
      target: new THREE.Vector3(0.65, 0.9, 2.4)
    },
    jeep: {
      pos: new THREE.Vector3(-5.6, 2.05, 5.2),
      target: new THREE.Vector3(-1.5, 1.05, 0.8)
    },
    eaves: {
      pos: new THREE.Vector3(5.2, 2.1, 4.35),
      target: new THREE.Vector3(2.5, 1.25, 0.75)
    }
  };

  // Pull the wide shot back on portrait screens so the whole camp fits
  if (aspect < 0.95) {
    const p = PRESETS.overland;
    p.target.x = 0.9;
    const away = p.pos.clone().sub(p.target);
    away.x *= 1.45;
    away.z *= 1.45;
    away.y *= 1.12;
    p.pos.copy(p.target).add(away);
  }

  // Initial position: Overland Preset
  camera.position.copy(PRESETS.overland.pos);
  controls.target.copy(PRESETS.overland.target);
  controls.update();

  // Smooth camera transition system
  let camTween = null;

  // Ambient drift: slow cinematic dollies between quiet corners of the camp.
  // Starts on its own when the visitor leaves the page alone, stops on input.
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const SHOTS = [
    { from: V(3.4, 3.0, 12.6), to: V(2.3, 2.5, 9.6), tFrom: V(0.4, 1.1, 0.5), tTo: V(0.5, 1.0, 0.7), dur: 30 },
    { from: V(1.9, 0.62, 9.2), to: V(0.6, 0.6, 6.6), tFrom: V(-1.2, 0.7, 2.6), tTo: V(-1.3, 0.85, 1.4), dur: 28 },
    { from: V(5.3, 0.95, 3.6), to: V(4.4, 1.05, 0.9), tFrom: V(2.9, 0.6, 1.2), tTo: V(2.8, 0.85, -0.3), dur: 26 },
    { from: V(8.0, 1.55, 6.4), to: V(6.9, 1.3, 7.0), tFrom: V(4.9, 0.6, 3.3), tTo: V(4.6, 0.7, 3.0), dur: 28 },
    { from: V(-5.6, 1.45, 4.4), to: V(-4.4, 1.3, 6.4), tFrom: V(-0.9, 0.9, 4.6), tTo: V(-0.4, 0.8, 6.2), dur: 28 },
    { from: V(-6.5, 6.8, 10.5), to: V(-3.2, 6.0, 12.0), tFrom: V(0.5, 0.9, 0.8), tTo: V(0.8, 0.9, 1.0), dur: 32 },
    { from: V(2.7, 1.25, 4.3), to: V(2.1, 1.35, 3.3), tFrom: V(1.0, 1.0, 0.2), tTo: V(1.1, 0.95, 0.0), dur: 26 }
  ];
  let ambient = null;
  const _shotPos = new THREE.Vector3();
  const _shotTgt = new THREE.Vector3();

  function startAmbient() {
    if (ambient || !controls.enabled) return;
    camTween = null;
    controls.autoRotate = false;
    ambient = {
      i: Math.floor(Math.random() * SHOTS.length),
      t: 0,
      blendDur: 6,
      fromPos: camera.position.clone(),
      fromTgt: controls.target.clone()
    };
  }
  function stopAmbient() { ambient = null; }
  function updateAmbient(delta) {
    const shot = SHOTS[ambient.i];
    ambient.t += delta;
    const u = Math.min(1, ambient.t / shot.dur);
    const e = 0.5 - 0.5 * Math.cos(u * Math.PI);
    // mostly linear glide with soft ends
    const k = THREE.MathUtils.lerp(u, e, 0.5);
    _shotPos.lerpVectors(shot.from, shot.to, k);
    _shotTgt.lerpVectors(shot.tFrom, shot.tTo, k);
    // a breath of handheld float
    const tt = performance.now() * 0.001;
    _shotPos.x += Math.sin(tt * 0.23) * 0.04;
    _shotPos.y += Math.sin(tt * 0.31 + 1.3) * 0.03;
    if (ambient.t < ambient.blendDur) {
      const b = THREE.MathUtils.smootherstep(ambient.t / ambient.blendDur, 0, 1);
      camera.position.lerpVectors(ambient.fromPos, _shotPos, b);
      controls.target.lerpVectors(ambient.fromTgt, _shotTgt, b);
    } else {
      camera.position.copy(_shotPos);
      controls.target.copy(_shotTgt);
    }
    if (u >= 1) {
      ambient.fromPos = camera.position.clone();
      ambient.fromTgt = controls.target.clone();
      ambient.i = (ambient.i + 1) % SHOTS.length;
      ambient.t = 0;
    }
  }

  function setCameraPreset(presetKey, duration = 1.5) {
    const p = PRESETS[presetKey];
    if (!p) return;
    ambient = null;

    camTween = {
      startPos: camera.position.clone(),
      endPos: p.pos.clone(),
      startTarget: controls.target.clone(),
      endTarget: p.target.clone(),
      duration,
      elapsed: 0
    };
  }

  function setControlsEnabled(enabled) {
    controls.enabled = enabled;
    if (!enabled) {
      controls.autoRotate = false;
      camTween = null;
      ambient = null;
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    // Wider vertical FOV on portrait screens so the camp still fits sideways
    if (controls.enabled) {
      camera.fov = camera.aspect < 0.95 ? 64 : 50;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', onResize);

  function update(delta) {
    if (ambient) {
      updateAmbient(delta);
      controls.update();
      return;
    }
    if (camTween) {
      camTween.elapsed += delta;
      const progress = Math.min(camTween.elapsed / camTween.duration, 1.0);
      const ease = THREE.MathUtils.smootherstep(progress, 0, 1);

      camera.position.lerpVectors(camTween.startPos, camTween.endPos, ease);
      controls.target.lerpVectors(camTween.startTarget, camTween.endTarget, ease);

      if (progress >= 1.0) {
        camTween = null;
      }
    }
    controls.update();
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    setCameraPreset,
    setControlsEnabled,
    startAmbient,
    stopAmbient,
    isAmbient: () => !!ambient,
    update,
    onResize,
    getCanvas: () => canvas
  };
}
