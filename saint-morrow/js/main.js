import * as THREE from 'three/webgpu';
import { createAudio } from './audio/mixer.js';
import { createBench } from './debug/bench.js';
import { createHud } from './debug/hud.js';
import { createPlayer } from './player/controller.js';
import { createPost } from './render/post.js';
import { createRenderer } from './render/renderer.js';
import { createStreet } from './world/street.js';

const GPU_SAMPLE_FRAMES = 30;
const params = new URLSearchParams(location.search);
const status = document.getElementById('status');
const enter = document.getElementById('enter');

async function boot() {
  const benchMode = params.has('bench');
  const shotIndex = params.has('shot') ? Number(params.get('shot')) - 1 : -1;
  const hudMode = benchMode || params.has('hud');
  const { renderer, tier, isWebGPU, resize } = await createRenderer(document.getElementById('stage'), {
    tierName: params.get('tier') ?? 'ultra',
    forceWebGL: params.get('renderer') === 'webgl',
    timing: hudMode,
  });

  status.textContent = 'Wetting the streets';
  const world = await createStreet(renderer, tier);
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

  window.addEventListener('resize', () => {
    camera.aspect = resize();
    camera.updateProjectionMatrix();
  });

  if (interactive) {
    enter.hidden = false;
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
    if (frame === 3) status.classList.add('done');
  });

  window.__morrow = { renderer, tier, camera, world, player, bench, audio, post };
}

boot().catch((error) => {
  console.error(error);
  status.textContent = 'This browser could not start the city renderer.';
  status.classList.add('error');
});
