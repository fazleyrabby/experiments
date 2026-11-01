import './style.css';
import { TIMING } from './config.js';
import { AnimationManager, ShipState } from './animation/AnimationManager.js';
import { createBrickAudio } from './audio/createBrickAudio.js';
import { damp } from './animation/easing.js';
import { createCameraRig } from './scene/createCamera.js';
import { createLighting } from './scene/createLighting.js';
import { createPlatform } from './scene/createPlatform.js';
import { createScene, getPixelRatio } from './scene/createScene.js';
import { createStarfield } from './scene/createStarfield.js';
import { createSpaceship } from './spaceship/createSpaceship.js';
import { createControls } from './ui/controls.js';
import { createStatus } from './ui/status.js';
import { createViewerCount } from './ui/viewerCount.js';

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

  // --- World ---------------------------------------------------------------
  const ship = createSpaceship();
  const { layout } = ship;
  scene.add(ship.pivot);

  const lighting = createLighting(scene, { radius: layout.radius, shadowMapSize: lowPower ? 1024 : 2048 });
  const starfield = createStarfield(scene, {
    count: lowPower ? 800 : 1300,
    pixelRatio: renderer.getPixelRatio(),
  });
  const platform = createPlatform(scene, { radius: layout.radius * 0.9, y: layout.platformY });

  const rig = createCameraRig(canvas, {
    normal: { h: layout.radius * 0.85, v: layout.radius * 0.5, targetY: -0.8 },
    wide: { h: layout.radius * 1.3, v: layout.radius * 0.74, targetY: 4.6 },
  });

  // --- UI + animation state -----------------------------------------------
  const status = createStatus();
  const viewerCount = createViewerCount();
  document.querySelector('#meta-bricks').textContent = String(ship.bricks.length);
  document.querySelector('#meta-sections').textContent = String(Object.keys(layout.sections).length);

  const audio = createBrickAudio();

  const manager = new AnimationManager(ship.bricks, {
    onBrickPlaced: (brick) => audio.brickPlaced(brick.mass),
    onBrickReleased: (brick) => audio.brickReleased(brick.mass),
    onStateChange(state) {
      status.setState(state);
      controls.sync(manager);
      // Frame the exploded view; come back in as the ship rebuilds.
      if (state === ShipState.BREAKING_DOWN) rig.setMode('wide', 2.0);
      if (state === ShipState.REASSEMBLING) rig.setMode('normal', 2.6);
      if (state === ShipState.ASSEMBLED) {
        hint.classList.add('is-visible');
        audio.powerUp();
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
    const pixelRatio = getPixelRatio();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    starfield.setPixelRatio(pixelRatio);
    rig.resize(width, height);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  window.addEventListener('orientationchange', resize);
  resize();

  // --- Go ------------------------------------------------------------------
  manager.startInitialAssembly();
  const introDuration = TIMING.assemble.spread + TIMING.assemble.duration + TIMING.assemble.durationJitter;
  rig.playIntro(introDuration + 0.4);

  let previous = null;
  let elapsed = 0;
  let spinSpeed = 0;
  let enginePower = 0;

  // The one and only animation loop.
  renderer.setAnimationLoop((now) => {
    // Clamp so a background tab or a hitch never teleports the animation.
    const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += dt;

    manager.update(dt);
    const state = manager.state;

    // Showcase rotation: full speed once assembled, a slow drift while pieces
    // fly in, stopped while exploded and whenever the user is on the camera.
    let targetSpeed = 0;
    if (!rig.userActive) {
      if (state === ShipState.ASSEMBLED) {
        targetSpeed = rig.idleTime > TIMING.resumeDelay ? TIMING.showcaseSpeed : 0;
      } else if (state === ShipState.ASSEMBLING || state === ShipState.REASSEMBLING) {
        targetSpeed = TIMING.buildDriftSpeed;
      }
    }
    spinSpeed += (targetSpeed - spinSpeed) * damp(targetSpeed > spinSpeed ? 1.4 : 4, dt);
    ship.pivot.rotation.y += spinSpeed * dt;
    platform.setRotation(ship.pivot.rotation.y);

    // Engines spool up once the last brick is in and cut out on breakdown.
    const powerTarget = state === ShipState.ASSEMBLED ? 1 : 0;
    enginePower += (powerTarget - enginePower) * damp(powerTarget ? 1.5 : 7, dt);
    ship.setEnginePower(enginePower, elapsed);

    starfield.update(dt, elapsed);
    platform.update(elapsed);
    rig.update(dt);
    status.setProgress(manager.integrity, manager.placedCount, manager.total);

    renderer.render(scene, rig.camera);
  });

  // Handy for poking at the scene from the console during development.
  if (import.meta.env.DEV) window.__brickLab = { manager, ship, rig, renderer };

  // --- Cleanup -------------------------------------------------------------
  return function dispose() {
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    window.removeEventListener('orientationchange', resize);
    rig.controls.removeEventListener('start', hideHint);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    audio.dispose();
    viewerCount.dispose();
    controls.dispose();
    rig.dispose();
    platform.dispose();
    starfield.dispose();
    lighting.dispose();
    ship.dispose();
    sceneKit.dispose();
  };
}

const dispose = start();

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
