import * as THREE from 'three/webgpu';
import { createAudio } from './audio/mixer.js';
import { createBench } from './debug/bench.js';
import { createHud } from './debug/hud.js';
import { createPlayer } from './player/controller.js';
import { createGovernor } from './render/governor.js';
import { createPost } from './render/post.js';
import { createRenderer } from './render/renderer.js';
import { createLoader } from './ui/loader.js';
import { createStreet } from './world/street.js';

const GPU_SAMPLE_FRAMES = 30;
const ROOMS_START_FRAME = 45;
const params = new URLSearchParams(location.search);
const enter = document.getElementById('enter');
const loader = createLoader();

function pickTier() {
  const phone = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 600;
  if (phone) return 'medium';
  const lowMemory = (navigator.deviceMemory ?? 8) <= 4;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  return lowMemory || fewCores ? 'high' : 'ultra';
}

async function boot() {
  const benchMode = params.has('bench');
  const shotIndex = params.has('shot') ? Number(params.get('shot')) - 1 : -1;
  const hudMode = benchMode || params.has('hud');

  loader.stage('Waking the renderer', 0.04, 0.08);
  const { renderer, tier, isWebGPU, resize, setScale } = await createRenderer(document.getElementById('stage'), {
    tierName: params.get('tier') ?? pickTier(),
    forceWebGL: params.get('renderer') === 'webgl',
    timing: hudMode,
  });

  const world = await createStreet(renderer, tier, loader);
  const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.08, 420);
  const shot = params.has('shop') ? world.shopShots[Number(params.get('shop'))] : world.shots[shotIndex];
  if (shot) {
    camera.position.set(...shot.position);
    camera.lookAt(...shot.target);
  }

  const canvas = renderer.domElement;
  const player = createPlayer(camera, world.collider, canvas, world.spawn);
  const audio = createAudio();
  const post = createPost(renderer, world.scene, camera, tier);
  const hud = createHud(document.getElementById('hud'), {
    backend: isWebGPU ? 'WebGPU' : 'WebGL2',
    tier: tier.name,
    lights: world.lightCount,
    size: new THREE.Vector2(),
  }, hudMode);
  const bench = benchMode ? createBench(camera, world.route) : null;
  const interactive = !bench && !shot;
  const governor = interactive ? createGovernor((level) => {
    setScale(level.scale);
    world.setDetail(level);
  }) : null;

  // Every shader compiles here, behind the loader, instead of freezing the page when it first comes into view.
  loader.stage('Preparing shaders', 0.78, 0.97);
  await loader.paint();
  player.update(0.001);
  await post.precompile(world.scene, world.scene, (event) => loader.progress((event.loaded / Math.max(event.total, 1)) * 0.8));
  loader.progress(0.8);
  await world.compileReflection(renderer, camera);
  loader.progress(1);
  // Verification views need the finished rooms; visitors get them streamed in after the street appears.
  if (!interactive) await world.shopRooms.load(post.precompile);

  window.addEventListener('resize', () => {
    camera.aspect = resize();
    camera.updateProjectionMatrix();
  });

  if (interactive) {
    enter.addEventListener('click', async () => {
      audio.start().catch((error) => console.warn('Audio unavailable', error));
      try {
        await canvas.requestPointerLock();
      } catch (error) {
        console.warn('Pointer lock unavailable', error);
      }
    });
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) canvas.requestPointerLock()?.catch?.(() => {});
    });
    document.addEventListener('pointerlockchange', () => {
      enter.hidden = document.pointerLockElement === canvas;
    });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyM') audio.toggle();
    });
  }

  loader.stage('Lighting the lamps', 0.97, 1);
  let last = performance.now();
  let frame = 0;
  renderer.setAnimationLoop((now) => {
    const dtMs = Math.min(now - last, 100);
    last = now;
    const dt = dtMs / 1000;
    renderer.info.reset();
    if (interactive) player.update(Math.max(dt, 0.001));
    bench?.update(dtMs);
    world.update(now / 1000, dt, camera.position);
    post.render();
    bench?.record(dtMs, renderer);
    hud.update(dtMs, renderer, bench?.label);

    frame++;
    if (hudMode && frame % GPU_SAMPLE_FRAMES === 0 && renderer.hasFeature('timestamp-query')) {
      // The query pool returns the summed duration of every frame since the last resolve.
      renderer.resolveTimestampsAsync('render')
        .then((ms) => hud.setGpuMs((ms ?? renderer.info.render.timestamp) / GPU_SAMPLE_FRAMES))
        .catch(() => {});
    }
    if (frame === 3) {
      loader.finish();
      if (interactive) enter.hidden = false;
    }
    if (frame > 3) governor?.update(dtMs);
    if (interactive && frame === ROOMS_START_FRAME) {
      world.shopRooms.load(post.precompile).catch((error) => console.warn('Shop interiors unavailable', error));
    }
  });

  window.__morrow = { renderer, tier, camera, world, player, bench, audio, post, governor };
}

boot().catch((error) => {
  console.error(error);
  loader.fail('This browser could not start the city renderer.');
});
