// Main entry point for Overland Camp — first-person explorable forest camp.
import * as THREE from 'three';
import { createCampScene } from './scene.js';
import { createWeatherSystem } from './weather.js';
import { createOverlandTerrain } from './terrain.js';
import { createCampTrees } from './trees.js';
import { createOverlandVehicle } from './vehicle.js';
import { createOverlandShelter } from './shelter.js';
import { createCampProps } from './props.js';
import { createFirstPersonController } from './fps.js';
import { createPostFX } from './postfx.js';
import { campAudio } from './audio.js';
import { setMaxAnisotropy } from './textures.js';
import { updateWind } from './wind.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('stage');
  const loader = document.getElementById('loader');

  // 1. Scene & camera
  const sceneCtx = createCampScene(canvas);
  const { scene, camera, renderer, controls } = sceneCtx;
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  // 2. Weather / atmosphere
  const weather = createWeatherSystem(scene, renderer);
  scene.add(weather.group);

  // 3. Terrain, grass, puddles, ferns, boulders
  const terrain = createOverlandTerrain();
  scene.add(terrain.group);

  // 4. Forest
  const forest = createCampTrees();
  scene.add(forest.group);

  // 5. Vehicle
  const vehicle = createOverlandVehicle();
  scene.add(vehicle.group);

  // 6. Awning shelter
  const shelter = createOverlandShelter();
  scene.add(shelter.group);

  // 7. Camp props (fire, chairs, gear)
  const props = createCampProps({ getHeight: terrain.getHeight });
  scene.add(props.group);

  // 8. Post-processing
  const postfx = createPostFX(renderer, scene, camera);

  // Default states
  let isHeadlightsOn = true;
  let isLanternsOn = true;
  vehicle.setHeadlights(isHeadlightsOn);
  shelter.setLanterns(isLanternsOn);

  const initialWeather = 'heavyRain';
  let currentFire = 1;
  weather.setWeather(initialWeather);
  campAudio.setWeather(initialWeather);
  currentFire = props.setWeather(initialWeather, true);
  campAudio.setFireLevel(currentFire);
  vehicle.setWetness(1.0);
  shelter.setWetness(1.0);
  terrain.setWetness(1.0);
  forest.setWetness(1.0);
  terrain.setWind(0.65);

  // Rain: land on the real terrain, know what surface it hits, stay out from
  // under the awning and the rig (and bounce off their roofs instead)
  weather.rain.setGroundSampler(terrain.getHeight);
  weather.rain.setSurface(terrain.surface.texture, terrain.surface.extent);
  weather.rain.setOccluders([
    // 4x4: hood at the front, roof rack / gear behind the windscreen
    { x: -1.4, z: 0.6, rot: 0.22, hw: 1.08, hl: 2.5, top: 2.6, roofFront: 1.47, roofBack: 2.24, split: 1.02, slope: 0 },
    // awning roof, a touch higher on the rig side
    { x: 1.25, z: 0.5, rot: 0, hw: 1.6, hl: 1.8, top: 2.5, roofFront: 2.27, roofBack: 2.27, split: 0, slope: -0.07 }
  ]);

  // Drips: tree crowns, the roof-rack edges and the awning's outer eave
  {
    const sources = [...terrain.surface.dripSources];
    vehicle.group.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    for (let z = -1.85; z <= 1.0; z += 0.32) {
      [-1.0, 1.0].forEach(x => {
        v.set(x, 2.17, z);
        vehicle.group.localToWorld(v);
        sources.push({ x: v.x, y: v.y, z: v.z, period: 1.1 });
      });
    }
    for (let z = -1.15; z <= 2.2; z += 0.28) sources.push({ x: 2.88, y: 2.12, z, period: 0.8 });
    for (let x = -0.2; x <= 2.8; x += 0.3) sources.push({ x, y: 2.1, z: 2.33, period: 0.9 });
    weather.rain.setDripSources(sources, terrain.getHeight);
  }

  // Rain glows where it falls through the headlight beams and near warm lights
  const rainSpots = [];
  const rainLamps = [];
  {
    const findLights = (root, hexes) => {
      const out = [];
      root.traverse(o => { if (o.isPointLight && hexes.includes(o.color.getHex())) out.push(o); });
      return out;
    };
    const fireLights = findLights(props.group, [0xff7a2a, 0xffa94f]);
    const festoon = findLights(shelter.group, [0xffc27a]);
    [...fireLights, ...festoon].slice(0, 3).forEach(l => rainLamps.push({ light: l, base: l.intensity }));
  }
  const _sp = new THREE.Vector3();
  const _st = new THREE.Vector3();
  function updateRainLights(fireLevel) {
    const spots = vehicle.lights.headlightBeams.slice(0, 3).map(b => {
      b.getWorldPosition(_sp);
      b.target.getWorldPosition(_st);
      return {
        pos: _sp.clone(),
        dir: _st.clone().sub(_sp).normalize(),
        cos: Math.cos(b.angle * 0.92),
        range: b.distance * 0.55,
        intensity: b.intensity > 0 ? 0.2 : 0
      };
    });
    const lamps = rainLamps.map(({ light, base }) => ({
      pos: light.getWorldPosition(new THREE.Vector3()),
      intensity: base > 0 ? (light.intensity / base) * (light.color.getHex() === 0xff7a2a ? 0.35 * fireLevel : 0.22) : 0,
      color: light.color
    }));
    weather.rain.setLights(spots, lamps);
  }

  // Local light shadows (tent lantern cube map, headlights) only see static
  // things, so render them once instead of re-drawing the forest every frame.
  const localShadowLights = [];
  scene.traverse(o => {
    if ((o.isSpotLight || o.isPointLight) && o.castShadow) {
      o.shadow.autoUpdate = false;
      o.shadow.needsUpdate = true;
      localShadowLights.push(o);
    }
  });
  let shadowWarmFrames = 3;

  // 9. First-person controller
  const colliders = [
    ...terrain.colliders,
    ...forest.colliders,
    ...vehicle.colliders,
    ...shelter.colliders,
    ...props.colliders
  ];

  const fps = createFirstPersonController({
    camera,
    domElement: canvas,
    getHeight: terrain.getHeight,
    colliders,
    onStep: (intensity) => campAudio.footstep(intensity),
    onLockChange: (locked) => {
      const overlay = document.getElementById('walk-lock');
      if (!overlay) return;
      if (walking && !locked && !fps.isTouch()) overlay.classList.add('show');
      else overlay.classList.remove('show');
    }
  });

  // --- UI bindings ---------------------------------------------------------
  const weatherBtns = document.querySelectorAll('.weather-btn');
  const cameraBtns = document.querySelectorAll('.cam-btn');
  const lightToggleBtn = document.getElementById('toggle-lanterns');
  const vehicleLightBtn = document.getElementById('toggle-headlights');
  const soundBtn = document.getElementById('toggle-sound');
  const orbitBtn = document.getElementById('toggle-orbit');
  const walkBtn = document.getElementById('toggle-walk');
  const walkExitBtn = document.getElementById('exit-walk');
  const walkLockOverlay = document.getElementById('walk-lock');
  const walkHint = document.getElementById('walk-hint');
  const cameraRow = document.getElementById('camera-row');

  function setWeatherMode(modeKey) {
    weather.setWeather(modeKey);
    campAudio.setWeather(modeKey);
    currentFire = props.setWeather(modeKey);
    campAudio.setFireLevel(currentFire);
    weatherBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.weather === modeKey ? 'true' : 'false');
    });
  }

  weatherBtns.forEach(btn => {
    btn.addEventListener('click', () => setWeatherMode(btn.dataset.weather));
  });

  cameraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (walking) return;
      sceneCtx.setCameraPreset(btn.dataset.preset);
      cameraBtns.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    });
  });

  if (lightToggleBtn) {
    lightToggleBtn.addEventListener('click', () => {
      isLanternsOn = !isLanternsOn;
      shelter.setLanterns(isLanternsOn);
      lightToggleBtn.setAttribute('aria-pressed', isLanternsOn ? 'true' : 'false');
    });
  }

  if (vehicleLightBtn) {
    vehicleLightBtn.addEventListener('click', () => {
      isHeadlightsOn = !isHeadlightsOn;
      vehicle.setHeadlights(isHeadlightsOn);
      vehicleLightBtn.setAttribute('aria-pressed', isHeadlightsOn ? 'true' : 'false');
    });
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isPlaying = campAudio.toggleSound();
      soundBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      soundBtn.classList.remove('hint');
    });
    // Browsers block audio until a gesture, so sound is nudged on and then
    // switched on by the first interaction anywhere on the page.
    soundBtn.classList.add('hint');
    const unlock = (e) => {
      if (e.target && e.target.closest && e.target.closest('#toggle-sound')) return;
      if (e.type === 'keydown' && (e.key === 'm' || e.key === 'M')) return;
      if (e.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      if (campAudio.autoEnable()) {
        soundBtn.setAttribute('aria-pressed', 'true');
        soundBtn.classList.remove('hint');
      }
      ['pointerdown', 'keydown', 'touchend'].forEach(t => window.removeEventListener(t, unlock, true));
    };
    ['pointerdown', 'keydown', 'touchend'].forEach(t => window.addEventListener(t, unlock, true));
  }

  if (orbitBtn) {
    orbitBtn.addEventListener('click', () => {
      if (walking) return;
      controls.autoRotate = !controls.autoRotate;
      orbitBtn.setAttribute('aria-pressed', controls.autoRotate ? 'true' : 'false');
    });
  }

  // --- Walk mode -----------------------------------------------------------
  let walking = false;
  let savedView = null;

  function enterWalk() {
    if (walking) return;
    walking = true;
    savedView = {
      pos: camera.position.clone(),
      target: controls.target.clone()
    };

    sceneCtx.setControlsEnabled(false);
    controls.autoRotate = false;
    if (orbitBtn) orbitBtn.setAttribute('aria-pressed', 'false');

    document.body.classList.add('walking');
    if (walkBtn) walkBtn.setAttribute('aria-pressed', 'true');
    if (walkLockOverlay) walkLockOverlay.classList.toggle('show', !fps.isTouch());

    // Spawn on the trail with the camp in view
    const spawnX = 6.3;
    const spawnZ = 7.6;
    const targetX = 0.4;
    const targetZ = 0.9;
    const dx = targetX - spawnX;
    const dz = targetZ - spawnZ;
    const yaw = Math.atan2(-dx, -dz);

    const walkFov = window.innerWidth < window.innerHeight ? 70 : 54;
    fps.enter({ x: spawnX, z: spawnZ, yaw, pitch: -0.04, fov: walkFov });

    if (walkHint) walkHint.classList.add('show');
    resetIdle();
  }

  function exitWalk() {
    if (!walking) return;
    walking = false;
    fps.exit();
    document.body.classList.remove('walking');
    if (walkBtn) walkBtn.setAttribute('aria-pressed', 'false');
    if (walkHint) walkHint.classList.remove('show');
    if (walkLockOverlay) walkLockOverlay.classList.remove('show');

    camera.fov = camera.aspect < 0.95 ? 64 : 50;
    camera.updateProjectionMatrix();

    sceneCtx.setControlsEnabled(true);
    if (savedView) {
      camera.position.copy(savedView.pos);
      controls.target.copy(savedView.target);
      controls.update();
    }
    resetIdle();
  }

  if (walkBtn) {
    walkBtn.addEventListener('click', () => {
      walkBtn.blur();
      if (walking) exitWalk();
      else enterWalk();
    });
  }
  if (walkExitBtn) walkExitBtn.addEventListener('click', exitWalk);
  if (walkLockOverlay) {
    walkLockOverlay.addEventListener('click', () => {
      walkLockOverlay.classList.remove('show');
      if (walking) fps.requestLock();
    });
  }

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'v' && walking) exitWalk();
    if (e.key === 'Escape' && walking && !fps.isLocked()) exitWalk();
  });

  // Hide camera preset row in walk mode (weather stays accessible)
  if (cameraRow) cameraRow.classList.toggle('walk-hidden', false);

  // --- Ambient drift --------------------------------------------------------
  const ambientBtn = document.getElementById('toggle-ambient');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastInput = performance.now();
  const AMBIENT_AFTER_MS = 35000;
  function setAmbient(on) {
    if (on && !walking) sceneCtx.startAmbient();
    else sceneCtx.stopAmbient();
    if (ambientBtn) ambientBtn.setAttribute('aria-pressed', sceneCtx.isAmbient() ? 'true' : 'false');
    if (on && orbitBtn) { controls.autoRotate = false; orbitBtn.setAttribute('aria-pressed', 'false'); }
  }
  if (ambientBtn) {
    ambientBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setAmbient(!sceneCtx.isAmbient());
      lastInput = performance.now();
    });
  }
  const interrupt = (e) => {
    if (e.target && e.target.closest && e.target.closest('#toggle-ambient')) return;
    lastInput = performance.now();
    if (sceneCtx.isAmbient()) setAmbient(false);
  };
  canvas.addEventListener('pointerdown', interrupt);
  canvas.addEventListener('wheel', interrupt, { passive: true });
  canvas.addEventListener('touchstart', interrupt, { passive: true });
  window.addEventListener('keydown', (e) => {
    // weather / light / sound shortcuts keep the drift going
    if (['Shift', '1', '2', '3', '4', '5', 'l', 'L', 'h', 'H', 'm', 'M'].includes(e.key)) { lastInput = performance.now(); return; }
    interrupt(e);
  });
  document.querySelectorAll('.cam-btn, #toggle-orbit, #toggle-walk').forEach(b => b.addEventListener('click', interrupt));
  setInterval(() => {
    if (reduceMotion || walking || sceneCtx.isAmbient() || controls.autoRotate) return;
    if (document.hidden) return;
    if (performance.now() - lastInput > AMBIENT_AFTER_MS) setAmbient(true);
  }, 1000);

  // --- Idle HUD fade -------------------------------------------------------
  let idleTimeout = null;
  function resetIdle() {
    document.body.classList.remove('idle');
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      document.body.classList.add('idle');
    }, 6000);
  }
  ['pointerdown', 'pointermove', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetIdle, { passive: true });
  });
  resetIdle();

  // Hide loader
  setTimeout(() => {
    if (loader) {
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 700);
    }
  }, 450);

  // Resize
  window.addEventListener('resize', () => {
    sceneCtx.onResize();
    postfx.setSize(window.innerWidth, window.innerHeight);
  });

  // Debug handle (handy for tweaking the scene from the console)
  window.__camp = { sceneCtx, setAmbient, scene, camera, renderer, controls, fps, weather, terrain, forest, vehicle, shelter, props, colliders, postfx };

  // --- Render loop ---------------------------------------------------------
  const clock = new THREE.Clock();
  let swellTimer = 0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsedTime = clock.getElapsedTime();
    const currentMode = weather.getWeatherKey();
    const isRaining = currentMode === 'heavyRain' || currentMode === 'lightRain';

    weather.update(elapsedTime, delta, {
      fov: camera.fov,
      onWetnessChange: (wetness) => {
        vehicle.setWetness(wetness);
        shelter.setWetness(wetness);
        terrain.setWetness(wetness);
        forest.setWetness(wetness);
      },
      onWindChange: (wind) => {
        terrain.setWind(wind);
      },
      onThunder: () => {
        if (campAudio.enabled && campAudio.triggerThunder) {
          campAudio.triggerThunder();
        }
      }
    }, camera.position);

    const swell = weather.getSwell();
    terrain.setRain(isRaining ? (currentMode === 'heavyRain' ? 1 : 0.55) * swell : 0);
    terrain.update(elapsedTime, delta, isRaining);
    const windStr = weather.getPreset(currentMode).windStrength || 0.25;
    updateWind(elapsedTime, windStr * (0.85 + swell * 0.3), isRaining ? (currentMode === 'heavyRain' ? 1 : 0.5) : 0);
    forest.update(elapsedTime, delta, windStr);
    vehicle.update(elapsedTime, isRaining ? 1 : 0);
    updateRainLights(currentFire);
    swellTimer -= delta;
    if (swellTimer <= 0) {
      swellTimer = 0.5;
      campAudio.setRainSwell(swell);
    }
    shelter.update(elapsedTime, delta, currentMode);
    props.update(elapsedTime, delta);

    if (walking) {
      fps.update(delta);
    } else {
      sceneCtx.update(delta);
    }

    if (shadowWarmFrames > 0) {
      shadowWarmFrames--;
      localShadowLights.forEach(l => { l.shadow.needsUpdate = true; });
    }

    postfx.render(delta);
    adaptResolution(delta);
  }

  // Adaptive resolution: keep the drift smooth on slower GPUs, sharpen back up
  // when there is headroom. Ignores throttled/background frames.
  const dprMax = Math.min(window.devicePixelRatio || 1, 2);
  let dpr = dprMax;
  let perfAcc = 0;
  let perfN = 0;
  let lastRaise = 0;
  function applyDpr() {
    renderer.setPixelRatio(dpr);
    postfx.composer.setPixelRatio(dpr);
    postfx.setSize(window.innerWidth, window.innerHeight);
  }
  function adaptResolution(delta) {
    if (document.hidden || delta > 0.2) return;
    perfAcc += delta;
    perfN++;
    if (perfAcc < 2.0) return;
    const avg = perfAcc / perfN;
    perfAcc = 0;
    perfN = 0;
    const now = performance.now();
    if (avg > 1 / 50 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      applyDpr();
    } else if (avg < 1 / 57 && dpr < dprMax && now - lastRaise > 12000) {
      dpr = Math.min(dprMax, dpr + 0.25);
      lastRaise = now;
      applyDpr();
    }
  }

  animate();
});
