import * as THREE from 'three';
import './style.css';
import { createEngine } from './engine/createEngine.js';
import { updateMechanism } from './engine/mechanics.js';
import { createStudio } from './scene.js';
import { EngineAnimation } from './animation.js';
import { createUI } from './ui.js';
import { createMovie } from './movie.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let dispose = () => {};
try {
  const studio = createStudio(document.getElementById('viewport'), reducedMotion);
  const engine = createEngine();
  studio.scene.add(engine.root);
  const animation = new EngineAnimation(engine.parts, { reducedMotion });
  const ui = createUI(animation, engine, studio);
  const record = new URLSearchParams(window.location.search).has('record') || new URLSearchParams(window.location.search).has('frames');
  const movie = record ? createMovie(studio, engine, animation) : null;
  const clock = new THREE.Clock();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const canvas = studio.renderer.domElement;
  let down = null;
  const abort = new AbortController();
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; }, { signal: abort.signal });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const bounds = canvas.getBoundingClientRect();
    pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -((e.clientY - bounds.top) / bounds.height) * 2 + 1);
    raycaster.setFromCamera(pointer, studio.camera);
    const hit = raycaster.intersectObject(engine.root, true)[0];
    let object = hit?.object;
    while (object && !object.userData.category) object = object.parent;
    if (object) ui.select(engine.selection === object.userData.category ? null : object.userData.category);
    else ui.select(null);
    down = null;
  }, { signal: abort.signal });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); studio.renderer.setAnimationLoop(null); document.getElementById('error').hidden = false;
  }, { signal: abort.signal });
  document.addEventListener('visibilitychange', () => { clock.getDelta(); }, { signal: abort.signal });
  let ready = false;
  let frameCount = 0, frameTime = 0;
  studio.renderer.setAnimationLoop(() => {
    const rawDelta = clock.getDelta();
    const dt = Math.min(rawDelta, .05);
    // A background tab cannot jump across multiple animation phases on return.
    if (document.hidden) return;
    if (movie) movie.update(dt);
    else {
      animation.update(dt);
      engine.root.rotation.y = animation.rotation;
      updateMechanism(engine.mechanism, animation.crankAngle);
      studio.update(dt, animation.progress); ui.update(); studio.renderer.render(studio.scene, studio.camera);
    }
    if (import.meta.env.DEV) {
      frameCount++; frameTime += rawDelta;
      if (frameTime > .5) {
        const viewport = document.getElementById('viewport');
        viewport.dataset.fps = String(Math.round(frameCount / frameTime));
        viewport.dataset.drawCalls = String(studio.renderer.info.render.calls);
        frameCount = 0; frameTime = 0;
      }
    }
    if (!ready) { document.getElementById('loading').classList.add('done'); ready = true; }
  });
  dispose = () => { abort.abort(); movie?.dispose(); ui.dispose(); engine.dispose(); studio.dispose(); };
  // Read-only development inspection hooks for mechanical and animation QA.
  if (import.meta.env.DEV) window.__v8 = { engine, animation, studio };
} catch (error) {
  console.error('Unable to initialize the V8 study:', error);
  document.getElementById('loading').classList.add('done');
  document.getElementById('error').hidden = false;
}
window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(() => dispose());
