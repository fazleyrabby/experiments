import './style.css';
import { DEFAULT_FINISH, SECTION_LABELS, TIMING } from './config.js';
import { AnimationManager, CarState } from './animation/AnimationManager.js';
import { createBrickAudio } from './audio/createBrickAudio.js';
import { damp } from './animation/easing.js';
import { createCameraRig } from './scene/createCamera.js';
import { createLighting } from './scene/createLighting.js';
import { createFloor } from './scene/createFloor.js';
import { createComposer, createScene, getPixelRatio } from './scene/createScene.js';
import { createCar } from './car/createCar.js';
import { getFinish, setFinish } from './car/brickMaterials.js';
import { createControls } from './ui/controls.js';
import { createStatus } from './ui/status.js';

const FINISH_KEY = 'countach-finish';

function readFinish() {
  try {
    return window.localStorage.getItem(FINISH_KEY) || DEFAULT_FINISH;
  } catch {
    return DEFAULT_FINISH;
  }
}

function writeFinish(finish) {
  try {
    window.localStorage.setItem(FINISH_KEY, finish);
  } catch {
    // Storage can be unavailable (private mode); the finish still applies for this visit.
  }
}

function showFallback() {
  document.querySelector('#fallback').hidden = false;
  for (const element of document.querySelectorAll('.hud, .hint, .scene')) element.hidden = true;
}

function start() {
  const canvas = document.querySelector('#scene');
  const hint = document.querySelector('#hint');

  let sceneKit;
  try {
    sceneKit = createScene(canvas);
  } catch (error) {
    console.error('WebGL initialisation failed', error);
    showFallback();
    return () => {};
  }
  const { renderer, scene } = sceneKit;

  const lowPower = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- World ---------------------------------------------------------------
  setFinish(readFinish());
  const car = createCar();
  const { layout } = car;
  scene.add(car.pivot);

  const lighting = createLighting(scene, { radius: layout.radius, shadowMapSize: lowPower ? 1024 : 2048 });
  const floor = createFloor(scene, {
    radius: layout.radius * 1.28,
    y: layout.floorY,
    reflections: false,
    textureSize: 1024,
  });

  const rig = createCameraRig(canvas, {
    normal: { h: layout.radius * 0.8, v: 9.5, targetY: 0.6 },
    wide: { h: layout.radius * 1.85, v: 30, targetY: 11 },
  });
  const composer = createComposer(renderer, scene, rig.camera, { bloom: false });

  // --- UI + animation state -----------------------------------------------
  const status = createStatus();
  document.querySelector('#meta-bricks').textContent = car.stats.bricks.toLocaleString('en-US');
  document.querySelector('#meta-sections').textContent = String(
    new Set(layout.bricks.map((brick) => (brick.section.startsWith('door') ? 'door' : brick.section))).size,
  );

  const audio = createBrickAudio();

  // Which section is being worked on, looked up from how many bricks are home.
  const byOrder = [...car.bricks].sort((a, b) => a.order - b.order);
  const sectionAt = (placed, assembling) => {
    const index = Math.min(byOrder.length - 1, Math.max(0, assembling ? placed : placed - 1));
    return SECTION_LABELS[byOrder[index].section] ?? '';
  };

  const manager = new AnimationManager(car.bricks, {
    onBrickPlaced: (brick) => audio.brickPlaced(brick.mass),
    onBrickReleased: (brick) => audio.brickReleased(brick.mass),
    onStateChange(state) {
      status.setState(state);
      controls.sync(manager);
      // Frame the exploded view; come back in as the car rebuilds.
      if (state === CarState.BREAKING_DOWN) rig.setMode('wide', 2.0);
      if (state === CarState.REASSEMBLING) rig.setMode('normal', 2.6);
      if (state === CarState.ASSEMBLED) {
        hint.classList.add('is-visible');
        audio.engineStart();
      }
    },
  });

  const controls = createControls({
    onBreakDown: () => manager.breakDown(),
    onReassemble: () => manager.reassemble(),
    onResetView: () => rig.reset(),
    onToggleSound: () => audio.toggle(),
    onFinish: (finish) => {
      setFinish(finish);
      writeFinish(finish);
    },
    finish: getFinish(),
    soundEnabled: audio.enabled,
    soundSupported: audio.supported,
  });

  // Browsers keep audio locked until the first user gesture.
  const unlockAudio = () => audio.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  const hideHint = () => hint.classList.remove('is-visible');
  rig.controls.addEventListener('start', hideHint);

  // --- Resize --------------------------------------------------------------
  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    const pixelRatio = getPixelRatio();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    rig.resize(width, height);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('orientationchange', resize);
  resize();

  // --- Go ------------------------------------------------------------------
  manager.startInitialAssembly();
  car.sync();
  const introDuration = TIMING.assemble.spread + TIMING.assemble.duration + TIMING.assemble.durationJitter;
  rig.playIntro(introDuration + 0.4);

  let previous = null;
  let elapsed = 0;
  let spinSpeed = 0;
  let lampPower = 0;
  let wasSettled = false;

  // The one and only animation loop.
  renderer.setAnimationLoop((now) => {
    // Clamp so a background tab or a hitch never teleports the animation.
    const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += dt;

    manager.update(dt);
    const state = manager.state;

    // Brick transforms only need uploading while something is moving.
    const settled = state === CarState.ASSEMBLED && !manager.run;
    if (!settled || !wasSettled) car.sync();
    wasSettled = settled;

    // Showcase rotation: full speed once assembled, a slow drift while pieces
    // fly in, stopped while exploded and whenever the user is on the camera.
    let targetSpeed = 0;
    if (!rig.userActive && !reducedMotion) {
      if (state === CarState.ASSEMBLED) {
        targetSpeed = rig.idleTime > TIMING.resumeDelay ? TIMING.showcaseSpeed : 0;
      } else if (state === CarState.ASSEMBLING || state === CarState.REASSEMBLING) {
        targetSpeed = TIMING.buildDriftSpeed;
      }
    }
    spinSpeed += (targetSpeed - spinSpeed) * damp(targetSpeed > spinSpeed ? 1.4 : 4, dt);
    car.pivot.rotation.y += spinSpeed * dt;
    floor.setRotation(car.pivot.rotation.y);

    // Lamps come on once the last brick is in and go dark on breakdown.
    const powerTarget = state === CarState.ASSEMBLED ? 1 : 0;
    lampPower += (powerTarget - lampPower) * damp(powerTarget ? 2.2 : 8, dt);
    car.setLights(lampPower, elapsed);

    floor.update(elapsed);
    rig.update(dt);
    status.setProgress(manager.integrity, manager.placedCount, manager.total);
    status.setSection(
      state === CarState.ASSEMBLED
        ? 'Every brick in place'
        : state === CarState.DISASSEMBLED
          ? 'Drag to inspect the parts'
          : sectionAt(manager.placedCount, state === CarState.ASSEMBLING || state === CarState.REASSEMBLING),
    );

    composer.render();
  });

  // Handy for poking at the scene from the console during development.
  if (import.meta.env.DEV) window.__brickLab = { manager, car, rig, renderer, scene, composer };

  // --- Cleanup -------------------------------------------------------------
  return function dispose() {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    window.removeEventListener('orientationchange', resize);
    rig.controls.removeEventListener('start', hideHint);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    audio.dispose();
    controls.dispose();
    rig.dispose();
    floor.dispose();
    lighting.dispose();
    composer.dispose();
    car.dispose();
    sceneKit.dispose();
  };
}

const dispose = start();

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
