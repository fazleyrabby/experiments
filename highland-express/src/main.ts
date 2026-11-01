import * as THREE from 'three';
import { Stage } from './core/stage';
import { Track } from './world/track';
import { Landscape } from './world/landscape';
import { Terrain } from './world/terrain';
import { TrackMeshes } from './world/trackMesh';
import { Viaduct } from './world/viaduct';
import { Water } from './world/water';
import { Vegetation } from './world/vegetation';
import { Lineside } from './world/lineside';
import { SheepFlocks } from './world/sheep';
import { Train } from './train/train';
import { Effects } from './fx/effects';
import { CameraRig, CamMode, INTRO_LENGTH } from './ui/camera';
import { Hud } from './ui/hud';
import { AudioEngine } from './core/audio';
import { shared } from './core/shaders';
import { SUN_DIR } from './world/layout';
import { detectQuality, setStoredQuality } from './core/quality';

const app = document.getElementById('app')!;
const statusEl = document.getElementById('status')!;
const barEl = document.querySelector('#bar i') as HTMLElement;
const tick = () =>
  new Promise<void>((r) => {
    // yield to the event loop without depending on rAF/timers (both throttle in background tabs)
    const ch = new MessageChannel();
    ch.port1.onmessage = () => r();
    ch.port2.postMessage(0);
  });
function progress(p: number, msg: string) {
  barEl.style.width = `${Math.round(p * 100)}%`;
  statusEl.textContent = msg;
}

async function boot() {
  const qs = new URLSearchParams(location.search);
  const view = qs.get('view');
  if (view) {
    const { runViewer } = await import('./dev/viewer');
    runViewer(app, view);
    return;
  }
  const t0 = performance.now();
  const quality = detectQuality();
  const stage = new Stage(app, quality);
  shared.uSunDir.value.copy(SUN_DIR);
  progress(0.04, 'Laying the permanent way…');
  await tick();
  const track = new Track();
  progress(0.12, 'Surveying the glen…');
  await tick();
  const land = new Landscape(track);
  progress(0.22, 'Raising mountains…');
  await tick();
  const terrain = new Terrain(land, quality.terrainLite);
  stage.scene.add(terrain.group);
  progress(0.45, 'Laying rails…');
  await tick();
  const tm = new TrackMeshes(track);
  stage.scene.add(tm.group);
  progress(0.52, 'Quarrying stone…');
  await tick();
  const viaduct = new Viaduct(land);
  stage.scene.add(viaduct.group);
  progress(0.62, 'Running the river…');
  await tick();
  const water = new Water(land);
  stage.scene.add(water.group);
  progress(0.7, 'Planting the glen…');
  await tick();
  const veg = new Vegetation(land, track, quality);
  stage.scene.add(veg.group);
  const lineside = new Lineside(track, land);
  stage.scene.add(lineside.group);
  progress(0.82, 'Gathering the flock…');
  await tick();
  const sheep = new SheepFlocks(land, quality.tier === 'high' ? 380 : 170, quality.tier === 'high');
  stage.scene.add(sheep.group);
  progress(0.86, 'Firing the boiler…');
  await tick();
  const train = new Train(track, 4);
  stage.scene.add(train.group);
  const fx = new Effects(train, water, land, quality);
  stage.scene.add(fx.group);
  progress(0.96, 'Raising steam…');
  await tick();
  console.log(`[highland] quality=${quality.tier} ready in ${(performance.now() - t0).toFixed(0)} ms`, veg.stats, 'stones', viaduct.stoneCount);

  // --- opening state: train 190 m before the viaduct entrance, already at speed
  const introStart = track.length - 190;
  train.targetSpeed = qs.get('speed') ? Number(qs.get('speed')) : 8.5;
  const rig = new CameraRig(stage, train, land, viaduct, veg);
  const audio = new AudioEngine();

  const startPos = qs.get('s') ? Number(qs.get('s')) : introStart;
  train.setDistance(startPos);
  train.state.speed = train.targetSpeed;
  const camQ = qs.get('cam');
  if (camQ) {
    const n = camQ.split(',').map(Number);
    stage.camera.position.set(n[0], n[1], n[2]);
    stage.camera.lookAt(n[3], n[4], n[5]);
    rig.setMode('orbit');
    rig.controls.target.set(n[3], n[4], n[5]);
    rig.controls.update();
  }
  const jump = qs.get('t');
  if (jump && !camQ) {
    // debugging: skip into the opening sequence
    const T = Number(jump);
    for (let t = 0; t < T; t += 0.1) {
      train.update(0.1, t);
      rig.update(0.1, t);
    }
  }

  const hud = new Hud({
    togglePause: () => {
      train.paused = !train.paused;
      hud.setPaused(train.paused);
    },
    cycleCamera: () => {
      const order: CamMode[] = ['cinematic', 'orbit', 'follow'];
      const next = order[(order.indexOf(rig.mode) + 1) % order.length];
      if (next === 'cinematic') rig.restartIntro(introStart);
      else rig.setMode(next);
    },
    setCamera: (m) => rig.setMode(m),
    speed: (d) => {
      train.targetSpeed = Math.max(0, Math.min(22, train.targetSpeed + d * 1.5));
    },
    toggleSound: async () => {
      if (audio.enabled) audio.disable();
      else await audio.enable();
      hud.setSound(audio.enabled);
    },
    whistle: (on) => {
      fx.whistle = on;
      if (on) audio.startWhistle();
      else audio.stopWhistle();
    },
    replay: () => rig.restartIntro(introStart),
    toggleQuality: () => {
      const next = quality.tier === 'high' ? 'lite' : 'high';
      setStoredQuality(next);
      const u = new URL(location.href);
      u.searchParams.set('quality', next);
      location.href = u.toString();
    },
    toggleFullscreen: () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.();
    },
  });
  rig.onModeChange = (m) => hud.setMode(m);
  hud.setMode(rig.mode);
  hud.setQuality(quality.tier);

  progress(0.99, 'Compiling shaders…');
  await tick();
  try {
    await Promise.race([stage.renderer.compileAsync(stage.scene, stage.camera), new Promise((r) => setTimeout(r, 9000))]);
  } catch {
    /* compile happens lazily on first render instead */
  }
  const loader = document.getElementById('loader')!;
  loader.style.opacity = '0';
  setTimeout(() => loader.remove(), 1300);

  // ---- main loop
  const clock = new THREE.Clock();
  let last = 0;
  let fpsAcc = 0, fpsN = 0, fps = 60;
  let slowT = 0, fastT = 0;
  const focus = new THREE.Vector3(0, 30, 0);
  const tmp = new THREE.Vector3();
  let raf = 0;
  const loop = () => {
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last);
    last = t;
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 0.5) { fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    shared.uTime.value = t;
    // dynamic resolution: back off when the frame time stays high, recover when there is headroom
    if (fps < 38) { slowT += dt; fastT = 0; } else if (fps > 56) { fastT += dt; slowT = 0; } else { slowT = 0; fastT = 0; }
    if (slowT > 2.5 && stage.pixelScale > quality.minScale) { stage.setPixelScale(stage.pixelScale - 0.125); slowT = 0; }
    if (fastT > 8 && stage.pixelScale < 1) { stage.setPixelScale(stage.pixelScale + 0.125); fastT = 0; }

    train.update(dt, t);
    rig.update(dt, t);
    fx.update(train.paused ? 0 : dt, t, stage.camera);
    veg.update(stage.camera.position);
    sheep.update(dt, t, train.locoFrame.p, stage.camera.position);
    if (sheep.bleat > 0) audio.bleat(sheep.bleat);

    // shadow region: follow the train when the camera is near it, otherwise frame the viaduct
    const camToLoco = stage.camera.position.distanceTo(train.locoFrame.p);
    const nearTrain = camToLoco < 130;
    const wantFocus = nearTrain ? tmp.copy(train.locoFrame.p) : tmp.set(-10, 28, -30);
    focus.lerp(wantFocus, Math.min(1, dt * 2.5));
    const wantR = nearTrain ? Math.max(48, Math.min(150, camToLoco * 0.9 + 32)) : 270;
    stage.updateShadow(focus, wantR);

    audio.update({
      time: t,
      camera: stage.camera,
      trainPos: train.locoFrame.p,
      speed: train.state.speed,
      chuffs: train.state.chuffs,
      joints: train.state.jointHits,
      steam: fx.events.steamBurst,
      camHeight: stage.camera.position.y - land.fastHeight(stage.camera.position.x, stage.camera.position.z),
      riverDist: land.riverDist(stage.camera.position.x, stage.camera.position.z),
      fallsPos: water.fallsBase,
      paused: train.paused,
    });
    hud.update(dt, train.state.speed * 3.6, rig.mode === 'cinematic' ? rig.introTime : null, fps);
    stage.render(t);
    raf = requestAnimationFrame(loop);
  };
  const seek = (tt: number) => {
    train.setDistance(introStart + train.targetSpeed * tt);
    train.state.speed = train.targetSpeed;
    rig.seek(tt);
  };
  (window as unknown as Record<string, unknown>).__seek = seek;
  (window as unknown as Record<string, unknown>).__he = { shared, stage, track, land, train, viaduct, rig, fx, veg, water, audio, sheep, INTRO_LENGTH };
  loop();

  // ---- orderly teardown (HMR / page hide): free GPU memory, listeners and audio
  const dispose = () => {
    cancelAnimationFrame(raf);
    rig.controls.dispose();
    audio.dispose();
    hud.destroy();
    fx.dispose();
    sheep.dispose();
    stage.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mm of mats) {
        for (const v of Object.values(mm as unknown as Record<string, unknown>)) if (v instanceof THREE.Texture) v.dispose();
        mm.dispose();
      }
    });
    tm.dispose();
    stage.dispose();
    app.innerHTML = '';
  };
  window.addEventListener('pagehide', dispose, { once: true });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
}
boot().catch((err) => {
  console.error(err);
  const loader = document.getElementById('loader');
  const status = document.getElementById('status');
  if (loader && status) {
    status.textContent = /webgl/i.test(String(err)) ? 'This experience needs a WebGL 2 capable browser.' : 'Something went wrong while building the scene — see the console.';
    status.style.color = '#e0907a';
  }
});
