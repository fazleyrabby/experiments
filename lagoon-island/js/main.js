import * as THREE from 'three';
import { clamp, lerp, makeNoiseTexture, nextFrame } from './util.js';
import { WORLD, buildTerrain } from './world.js';
import { buildFlora } from './flora.js';
import { buildStructures } from './structures.js';
import { Sky, sunState } from './sky.js';
import { Water } from './water.js';
import { Pipeline } from './post.js';
import { buildLife } from './life.js';
import { Soundscape, mixFor } from './audio.js';
import { RIPPLES, SHOT, shotAt } from './showreel.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const loader = $('loader');
const bar = $('loadBar');
const label = $('loadLabel');
const params = new URLSearchParams(location.search);

function fail(message) {
  label.textContent = message;
  bar.parentElement.hidden = true;
  loader.classList.add('failed');
}

const step = async (text, pct) => {
  label.textContent = text;
  bar.style.transform = `scaleX(${pct})`;
  await nextFrame();
  await nextFrame();
};

const formatHour = (h) => {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const period = hh >= 12 ? 'PM' : 'AM';
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${period}`;
};

async function boot() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
  } catch {
    fail('This scene needs WebGL 2, which this browser could not start.');
    return;
  }
  if (!renderer.capabilities.isWebGL2 || !renderer.extensions.has('EXT_color_buffer_float')) {
    fail('This scene needs WebGL 2 with float render targets.');
    return;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 1);
  renderer.info.autoReset = true;

  const U = {
    uTime: { value: 0 },
    uWind: { value: 0.42 },
    tNoise: { value: null },
  };

  await step('Weaving noise', 0.06);
  U.tNoise.value = makeNoiseTexture(256);

  const scene = new THREE.Scene();

  await step('Raising the island', 0.16);
  const terrain = buildTerrain(U);
  scene.add(terrain.group);

  await step('Growing the jungle', 0.34);
  const flora = buildFlora(U);
  scene.add(flora);

  await step('Building the boathouse', 0.66);
  const structures = buildStructures(U);
  scene.add(structures.group);

  await step('Filling the lagoon', 0.78);
  const light = new THREE.DirectionalLight(0xffffff, 5);
  light.castShadow = true;
  const shadowSize = params.has('lowshadow') ? 2048 : 4096;
  light.shadow.mapSize.set(shadowSize, shadowSize);
  const sc = light.shadow.camera;
  sc.left = -20;
  sc.right = 20;
  sc.top = 20;
  sc.bottom = -20;
  sc.near = 1;
  sc.far = 95;
  light.shadow.bias = -0.00028;
  light.shadow.normalBias = 0.022;
  light.shadow.radius = 2.2;
  scene.add(light, light.target);

  const sky = new Sky(renderer, scene, U);
  const water = new Water(renderer, U, terrain.heightTex);
  const life = buildLife(U);
  scene.add(life.group);

  const camera = new THREE.PerspectiveCamera(25, 1, 3, 280);
  const pipeline = new Pipeline(renderer);

  const orbit = {
    az: -0.34,
    el: 0.36,
    dist: 47,
    tAz: -0.34,
    tEl: 0.36,
    tDist: 41,
    fit: 41,
    zoomed: false,
    placed: false,
    target: new THREE.Vector3(0.1, -0.95, 0.55),
    idle: 0,
  };

  let hour = clamp(Number(params.get('hour')) || 17.15, 5.5, 20.5);
  let shownHour = hour;
  let state = sunState(hour);
  let scale = clamp(Number(params.get('scale')) || 0.68, 0.4, 1);
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;

  const resize = () => {
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    camera.aspect = cssW / cssH;
    camera.fov = camera.aspect < 0.9 ? 34 : 25;
    camera.updateProjectionMatrix();
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    orbit.fit = Math.max((WORLD.R * 1.07) / (tanV * camera.aspect), 9.8 / tanV);
    if (!orbit.zoomed) orbit.tDist = orbit.fit;
    if (!orbit.placed) {
      orbit.dist = orbit.fit * 1.12;
      orbit.placed = true;
    }
    pipeline.setSize(Math.round(cssW * dpr), Math.round(cssH * dpr), scale);
    water.reflRT.setSize(Math.max(2, Math.round(cssW * dpr * 0.5)), Math.max(2, Math.round(cssH * dpr * 0.5)));
  };
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  resize();

  const applyLight = () => {
    state = sunState(shownHour);
    light.position.copy(state.light).multiplyScalar(48);
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
    light.color.copy(state.color);
    light.intensity = state.intensity;
    scene.traverse((o) => {
      if (o.isMesh && o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = state.envIntensity;
    });
    sky.update(state);
  };
  applyLight();

  // Interaction.
  const pointers = new Map();
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pinch = 0;
  let downAt = null;
  let moved = 0;
  let lastHover = 0;

  const waterPoint = (e) => {
    ndc.set((e.clientX / cssW) * 2 - 1, -(e.clientY / cssH) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin;
    const d = ray.ray.direction;
    if (d.y >= -0.001) return null;
    const t = -o.y / d.y;
    const x = o.x + d.x * t;
    const z = o.z + d.z * t;
    return Math.hypot(x, z) < WORLD.R - 0.05 ? { x, z } : null;
  };

  const sound = new Soundscape();
  const soundBtn = $('sound');
  const paintSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.enabled));
    soundBtn.textContent = sound.enabled ? 'Sound on' : 'Sound off';
  };
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sound.setEnabled(!sound.enabled);
    paintSound();
  });
  paintSound();
  // Browsers only allow audio after a gesture, so the first touch of the page starts it.
  const wake = () => {
    if (sound.enabled) sound.start();
  };
  window.addEventListener('pointerdown', wake, { once: true });
  window.addEventListener('keydown', wake, { once: true });

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY };
    moved = 0;
    orbit.idle = 0;
    canvas.classList.add('dragging');
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse' && performance.now() - lastHover > 42) {
        const w = waterPoint(e);
        if (w) {
          water.addDrop(w.x, w.z, 0.006);
          lastHover = performance.now();
        }
      }
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    orbit.idle = 0;
    if (pointers.size === 1) {
      orbit.tAz -= dx * 0.0052;
      orbit.tEl = clamp(orbit.tEl + dy * 0.0036, 0.07, 1.22);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0) {
        orbit.zoomed = true;
        orbit.tDist = clamp(orbit.tDist * (pinch / d), 15, orbit.fit * 1.4);
      }
      pinch = d;
    }
  });
  const release = (e) => {
    if (pointers.has(e.pointerId) && pointers.size === 1 && downAt && moved < 7) {
      const w = waterPoint(e);
      if (w) {
        water.addDrop(w.x, w.z, 0.16);
        setTimeout(() => water.addDrop(w.x + 0.05, w.z - 0.03, 0.07), 90);
        sound.plop();
      }
    }
    pointers.delete(e.pointerId);
    if (!pointers.size) canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', (e) => pointers.delete(e.pointerId));
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    orbit.idle = 0;
    orbit.zoomed = true;
    orbit.tDist = clamp(orbit.tDist * Math.exp(e.deltaY * 0.0011), 15, orbit.fit * 1.4);
  }, { passive: false });

  const hourInput = $('hour');
  const windInput = $('wind');
  const hourValue = $('hourValue');
  const windValue = $('windValue');
  const windWord = (v) => (v < 0.14 ? 'Still' : v < 0.42 ? 'Light' : v < 0.72 ? 'Breezy' : 'Gusty');
  hourInput.value = hour;
  hourValue.textContent = formatHour(hour);
  windInput.value = U.uWind.value;
  windValue.textContent = windWord(U.uWind.value);
  hourInput.addEventListener('input', () => {
    hour = Number(hourInput.value);
    hourValue.textContent = formatHour(hour);
  });
  windInput.addEventListener('input', () => {
    U.uWind.value = Number(windInput.value);
    windValue.textContent = windWord(U.uWind.value);
  });
  document.querySelectorAll('[data-hour]').forEach((b) => b.addEventListener('click', () => {
    hour = Number(b.dataset.hour);
    hourInput.value = hour;
    hourValue.textContent = formatHour(hour);
  }));
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) return;
    if (e.key.toLowerCase() === 'h') document.body.classList.toggle('clean');
    if (e.key.toLowerCase() === 'm') {
      sound.setEnabled(!sound.enabled);
      paintSound();
    }
  });

  // First frames compile every shader, so do them behind the loader.
  await step('Lighting the scene', 0.9);
  let time = 0;
  let prev = performance.now();
  let avg = 16;
  let sampled = 0;
  const fixedScale = params.has('scale');

  const place = () => {
    const ce = Math.cos(orbit.el);
    camera.position.set(
      orbit.target.x + Math.sin(orbit.az) * ce * orbit.dist,
      orbit.target.y + Math.sin(orbit.el) * orbit.dist,
      orbit.target.z + Math.cos(orbit.az) * ce * orbit.dist,
    );
    camera.lookAt(orbit.target);
    camera.updateMatrixWorld();
  };

  const frame = (dt) => {
    time += dt;
    U.uTime.value = time;
    orbit.idle += dt;
    if (orbit.idle > 3.5 && !pointers.size) orbit.tAz += dt * 0.026 * Math.min(1, (orbit.idle - 3.5) / 3);
    const k = 1 - Math.exp(-dt * 5.2);
    orbit.az = lerp(orbit.az, orbit.tAz, k);
    orbit.el = lerp(orbit.el, orbit.tEl, k);
    orbit.dist = lerp(orbit.dist, orbit.tDist, 1 - Math.exp(-dt * 2.6));
    place();

    if (Math.abs(hour - shownHour) > 0.002) {
      shownHour = lerp(shownHour, hour, 1 - Math.exp(-dt * 4.5));
      applyLight();
    }
    structures.update(time, U.uWind.value, clamp(state.night * 1.4));
    life.update(time, state.night, pipeline, camera);
    water.stepSim();
    sound.update(state, U.uWind.value, orbit.dist / orbit.fit);
    pipeline.render({ scene, camera, water, fxScene: life.fxScene, light, state, time, noise: U.tNoise.value, sky });
  };

  // Frame-exact showreel: every frame is rendered at a fixed time step, so the video cannot stutter.
  let paused = false;
  const capture = {
    total: Math.round(SHOT.duration * SHOT.fps),
    done: 0,
    status: 'idle',
    begin(w = SHOT.width, h = SHOT.height) {
      paused = true;
      document.body.classList.add('clean');
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = 25;
      camera.updateProjectionMatrix();
      pipeline.setSize(w, h, 1);
      pipeline.everyFrame = true;
      water.reflRT.setSize(Math.round(w * 0.75), Math.round(h * 0.75));
      sky.envStep = 0.02;
      for (let i = 0; i < 16; i++) capture.render(0);
    },
    render(index) {
      const T = index / SHOT.fps;
      const s = shotAt(T);
      time = 6 + T * SHOT.speed;
      U.uTime.value = time;
      U.uWind.value = s.wind;
      const ce = Math.cos(s.el);
      camera.position.set(s.x + Math.sin(s.az) * ce * s.dist, s.y + Math.sin(s.el) * s.dist, s.z + Math.cos(s.az) * ce * s.dist);
      camera.lookAt(s.x, s.y, s.z);
      camera.updateMatrixWorld();
      hour = shownHour = s.hour;
      applyLight();
      for (const [at, x, z, power] of RIPPLES) {
        if (Math.round(at * SHOT.fps) === index) water.addDrop(x, z, power);
      }
      structures.update(time, s.wind, clamp(state.night * 1.4));
      life.update(time, state.night, pipeline, camera);
      for (let i = 0; i < SHOT.speed; i++) water.stepSim();
      pipeline.render({ scene, camera, water, fxScene: life.fxScene, light, state, time, noise: U.tNoise.value, sky });
    },
    async run(from = 0, to = capture.total, quality = 0.965) {
      capture.status = 'running';
      try {
        for (let i = from; i < to; i++) {
          capture.render(i);
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
          const res = await fetch(`/upload/f${String(i).padStart(5, '0')}.jpg`, { method: 'POST', body: blob });
          if (!res.ok) throw new Error(`Upload failed at ${i}`);
          capture.done = i + 1;
        }
        capture.status = 'done';
      } catch (err) {
        capture.status = `error: ${err.message}`;
      }
    },
    // Hardware H.264 in the browser: about 8x faster than uploading each frame as an image.
    async encode(from = 0, to = capture.total, name = 'video.h264', bitrate = 48e6) {
      capture.status = 'encoding';
      capture.done = from;
      const started = performance.now();
      const yieldTask = () => new Promise((resolve) => {
        const ch = new MessageChannel();
        ch.port1.onmessage = () => resolve();
        ch.port2.postMessage(0);
      });
      try {
        const chunks = [];
        let failure = null;
        const encoder = new VideoEncoder({
          output: (chunk) => {
            const bytes = new Uint8Array(chunk.byteLength);
            chunk.copyTo(bytes);
            chunks.push(bytes);
          },
          error: (e) => { failure = e; },
        });
        encoder.configure({
          codec: 'avc1.640033',
          width: canvas.width,
          height: canvas.height,
          bitrate,
          framerate: SHOT.fps,
          hardwareAcceleration: 'prefer-hardware',
          latencyMode: 'quality',
          bitrateMode: 'variable',
          avc: { format: 'annexb' },
        });
        const step = 1e6 / SHOT.fps;
        for (let i = from; i < to; i++) {
          capture.render(i);
          const videoFrame = new VideoFrame(canvas, { timestamp: Math.round((i - from) * step), duration: Math.round(step) });
          encoder.encode(videoFrame, { keyFrame: (i - from) % 60 === 0 });
          videoFrame.close();
          capture.done = i + 1;
          while (encoder.encodeQueueSize > 3) await yieldTask();
          await yieldTask();
          if (failure) throw failure;
        }
        await encoder.flush();
        encoder.close();
        if (failure) throw failure;
        const blob = new Blob(chunks, { type: 'video/h264' });
        const res = await fetch(`/upload/${name}`, { method: 'POST', body: blob });
        if (!res.ok) throw new Error('Upload failed');
        capture.msPerFrame = Math.round((performance.now() - started) / (to - from));
        capture.bytes = blob.size;
        capture.status = 'done';
      } catch (err) {
        capture.status = `error: ${err.message}`;
      }
    },
    // Per-frame layer levels, used to mix the video's soundtrack to match the picture.
    audioCurve(rate = 20) {
      const rows = [];
      const n = Math.ceil(SHOT.duration * rate);
      for (let i = 0; i <= n; i++) {
        const s = shotAt(i / rate);
        rows.push({ t: i / rate, ...mixFor(sunState(s.hour), s.wind, s.dist / 50) });
      }
      return rows;
    },
  };

  frame(0.016);
  await nextFrame();
  frame(0.016);
  await step('Ready', 1);
  loader.classList.add('done');
  document.body.classList.add('ready');
  setTimeout(() => loader.remove(), 1400);

  window.__island = {
    get stats() {
      return { flora: flora.userData.stats, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, scale, avgMs: Math.round(avg * 10) / 10, size: [pipeline.iw, pipeline.ih, pipeline.w, pipeline.h], view: [orbit.tAz, orbit.tEl, orbit.tDist].map((v) => Math.round(v * 100) / 100), hour, wind: U.uWind.value, drops: water.drops.length };
    },
    setHour(h) {
      hour = shownHour = h;
      hourInput.value = h;
      hourValue.textContent = formatHour(h);
      applyLight();
    },
    setView(az, el, dist) {
      orbit.az = orbit.tAz = az;
      orbit.el = orbit.tEl = el;
      orbit.dist = orbit.tDist = dist;
      orbit.zoomed = true;
      orbit.idle = -9999;
      pipeline.hasHistory = false;
    },
    drop: (x, z, s) => water.addDrop(x, z, s),
    capture,
    sound,
    bench(n = 24) {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      frame(0.016);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now();
      for (let i = 0; i < n; i++) {
        frame(0.016);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      }
      return Math.round(((performance.now() - t0) / n) * 10) / 10;
    },
  };

  prev = performance.now();
  const loop = (now) => {
    if (paused) return;
    const ms = now - prev;
    prev = now;
    frame(Math.min(ms / 1000, 0.05));
    // Very long gaps mean the page was throttled or hidden, not that the GPU is slow.
    if (ms < 160) {
      avg = lerp(avg, ms, 0.05);
      sampled++;
    }
    if (!fixedScale && sampled > 90 && document.visibilityState === 'visible') {
      sampled = 0;
      const next = avg > 40 ? scale - 0.06 : avg < 19 ? scale + 0.04 : scale;
      const clamped = clamp(next, 0.58, 1);
      if (Math.abs(clamped - scale) > 0.005) {
        scale = clamped;
        resize();
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot().catch((err) => {
  console.error(err);
  fail('The island could not load. Try a recent desktop browser.');
});
