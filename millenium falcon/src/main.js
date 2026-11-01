import './style.css';
import { SECTION_LABELS, TIMING } from './config.js';
import { AnimationManager, ShipState } from './animation/AnimationManager.js';
import { createBrickAudio } from './audio/createBrickAudio.js';
import { damp } from './animation/easing.js';
import { createCameraRig } from './scene/createCamera.js';
import { createLighting } from './scene/createLighting.js';
import { createComposer, createScene, getPixelRatio } from './scene/createScene.js';
import { createSpace } from './scene/createSpace.js';
import { createStarfield } from './scene/createStarfield.js';
import { createFalcon } from './falcon/createFalcon.js';
import { createControls } from './ui/controls.js';
import { createStatus } from './ui/status.js';

function showFallback() {
  document.querySelector('#fallback').hidden = false;
  for (const element of document.querySelectorAll('.hud, .hint, .scene')) element.hidden = true;
}

function start() {
  const canvas = document.querySelector('#scene');
  const hint = document.querySelector('#hint');

  const lowPower = window.matchMedia('(pointer: coarse)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let sceneKit;
  try {
    sceneKit = createScene(canvas, { lowPower });
  } catch (error) {
    console.error('WebGL initialisation failed', error);
    showFallback();
    return () => {};
  }
  const { renderer, scene } = sceneKit;

  // --- World ---------------------------------------------------------------
  const falcon = createFalcon();
  const { layout } = falcon;
  scene.add(falcon.root);
  // A slight bank so the saucer reads as a flying ship rather than a model on a stand.
  falcon.root.rotation.set(-0.05, 0, 0.07);

  const lighting = createLighting(scene, { radius: layout.radius, shadowMapSize: lowPower ? 1024 : 2048 });
  const starfield = createStarfield(scene, {
    count: lowPower ? 1400 : 2600,
    radius: 1500,
    pixelRatio: renderer.getPixelRatio(),
  });
  const space = createSpace(scene, { radius: layout.radius, lowPower });

  const rig = createCameraRig(canvas, {
    normal: { h: layout.radius * 0.92, v: layout.radius * 0.42, targetY: 0 },
    wide: { h: layout.radius * 1.35, v: layout.radius * 1.15, targetY: 1 },
  });
  const composer = createComposer(renderer, scene, rig.camera, { bloom: !lowPower });

  // --- UI + animation state -----------------------------------------------
  const status = createStatus();
  document.querySelector('#meta-bricks').textContent = falcon.stats.bricks.toLocaleString('en-US');
  document.querySelector('#meta-sections').textContent = String(Object.keys(layout.sections).length);

  const audio = createBrickAudio();

  // Which section is being worked on, looked up from how many bricks are home.
  const byOrder = [...falcon.bricks].sort((a, b) => a.order - b.order);
  const sectionAt = (placed, assembling) => {
    const index = Math.min(byOrder.length - 1, Math.max(0, assembling ? placed : placed - 1));
    return SECTION_LABELS[byOrder[index].section] ?? '';
  };

  let ignition = 0;
  const manager = new AnimationManager(falcon.bricks, {
    onBrickPlaced: (brick) => audio.brickPlaced(brick.mass),
    onBrickReleased: (brick) => audio.brickReleased(brick.mass),
    onStateChange(state) {
      status.setState(state);
      controls.sync(manager);
      // Frame the exploded view; come back in as the ship rebuilds.
      if (state === ShipState.BREAKING_DOWN) rig.setMode('wide', 2.2);
      if (state === ShipState.REASSEMBLING) rig.setMode('normal', 2.8);
      if (state === ShipState.ASSEMBLED) {
        hint.classList.add('is-visible');
        audio.engineStart();
        ignition = 1;
      }
    },
  });

  const controls = createControls({
    onBreakDown: () => manager.breakDown(),
    onReassemble: () => manager.reassemble(),
    onResetView: () => rig.reset(),
    onToggleSound: () => audio.toggle(),
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
    // A hidden or collapsed view reports 0 x 0; framing against that would put the camera at infinity.
    if (!width || !height) return;
    const pixelRatio = getPixelRatio();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    starfield.setPixelRatio(pixelRatio);
    rig.resize(width, height);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('orientationchange', resize);
  resize();

  // --- Go ------------------------------------------------------------------
  manager.startInitialAssembly();
  falcon.sync();
  const introDuration =
    TIMING.hold + TIMING.assemble.spread + TIMING.assemble.duration + TIMING.assemble.durationJitter;
  rig.playIntro(introDuration + 0.4);

  let previous = null;
  let elapsed = 0;
  let spinSpeed = 0;
  let enginePower = 0;
  let lampPower = 0;
  let bob = 0;
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
    const settled = state === ShipState.ASSEMBLED && !manager.run;
    if (!settled || !wasSettled) falcon.sync();
    wasSettled = settled;

    // Showcase rotation: full speed once assembled, a slow drift while pieces
    // fly in, stopped while exploded and whenever the user is on the camera.
    let targetSpeed = 0;
    if (!rig.userActive && !reducedMotion) {
      if (state === ShipState.ASSEMBLED) {
        targetSpeed = rig.idleTime > TIMING.resumeDelay ? TIMING.showcaseSpeed : 0;
      } else if (state === ShipState.ASSEMBLING || state === ShipState.REASSEMBLING) {
        targetSpeed = TIMING.buildDriftSpeed;
      }
    }
    spinSpeed += (targetSpeed - spinSpeed) * damp(targetSpeed > spinSpeed ? 1.4 : 4, dt);
    falcon.pivot.rotation.y += spinSpeed * dt;

    // A slow weightless bob once the ship is whole.
    const bobTarget = state === ShipState.ASSEMBLED && !reducedMotion ? 1 : 0;
    bob += (bobTarget - bob) * damp(1.2, dt);
    falcon.root.position.y = Math.sin(elapsed * 0.55) * 0.35 * bob;
    falcon.root.rotation.z = 0.07 + Math.sin(elapsed * 0.37) * 0.015 * bob;

    // Sublights flare on ignition, settle to a steady glow, cut out on breakdown.
    const powerTarget = state === ShipState.ASSEMBLED ? 1 : 0;
    enginePower += (powerTarget - enginePower) * damp(powerTarget ? 1.6 : 6, dt);
    lampPower += (powerTarget - lampPower) * damp(powerTarget ? 2.2 : 8, dt);
    ignition = Math.max(0, ignition - dt * 0.7);
    falcon.setLights(enginePower * (1 + 0.6 * Math.sin(Math.min(ignition, 1) * Math.PI)), lampPower, elapsed);

    starfield.update(dt, elapsed);
    space.update(elapsed);
    rig.update(dt);
    status.setProgress(manager.integrity, manager.placedCount, manager.total);
    status.setSection(
      state === ShipState.ASSEMBLED
        ? 'Every brick in place'
        : state === ShipState.DISASSEMBLED
          ? 'Drag to inspect the parts'
          : sectionAt(manager.placedCount, state === ShipState.ASSEMBLING || state === ShipState.REASSEMBLING),
    );

    composer.render();
  });

  // Handy for poking at the scene from the console during development.
  if (import.meta.env.DEV) window.__brickLab = { manager, falcon, rig, renderer, scene, composer };

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
    space.dispose();
    starfield.dispose();
    lighting.dispose();
    composer.dispose();
    falcon.dispose();
    sceneKit.dispose();
  };
}

const dispose = start();

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
