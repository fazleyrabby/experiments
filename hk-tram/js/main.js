/* main.js — renderer, planar reflection, loop, style switching and UI wiring. */
import * as THREE from 'three';
import { createWorld, shared, L, TRACK_Z } from './world.js';
import { createTram } from './tram.js';
import { createTraffic } from './traffic.js';
import { createRain } from './rain.js';
import { Post, STYLES } from './post.js';
import { CameraRig } from './camera.js';
import { createNeonEnvironment } from './env.js';
import { createFacades } from './facade.js';
import { TramAudio } from './audio.js';
import { clamp, mod } from './util.js';

const $ = (id) => document.getElementById(id);
const errorEl = $('error');
const showError = (e) => { errorEl.hidden = false; errorEl.textContent = 'Could not start: ' + (e && e.message ? e.message : e); console.error(e); };

try { boot(); } catch (e) { showError(e); }

function boot() {
  const params = new URLSearchParams(location.search);
  const stage = $('stage');

  /* ── renderer ── */
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL 2 is required.');
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  const baseDpr = dpr;
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  stage.appendChild(renderer.domElement);

  /* ── scene ── */
  const world = createWorld();
  const scene = new THREE.Scene();
  scene.fog = world.fog;
  scene.background = world.fogColor;
  renderer.setClearColor(world.fogColor, 1);
  scene.add(world.root, world.sky);

  scene.environment = createNeonEnvironment(renderer);
  scene.add(new THREE.HemisphereLight(0x7a5cc8, 0x14304a, 0.55));
  const lightA = new THREE.PointLight(0xff2e88, 420, 46, 2);
  const lightB = new THREE.PointLight(0x27e6ff, 380, 46, 2);
  scene.add(lightA, lightB);

  const hero = createTram('hero');
  hero.group.position.z = TRACK_Z.hero;
  const oncoming = createTram('oncoming');
  oncoming.group.position.z = TRACK_Z.oncoming;
  oncoming.group.rotation.y = Math.PI;
  scene.add(hero.group, oncoming.group);

  const traffic = createTraffic(scene);
  let facades = null;
  createFacades(scene, world.near).then((f) => { facades = f; }).catch(showError);
  const rain = createRain();
  scene.add(rain);

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 400);
  camera.position.set(0, 3, 12);

  /* ── planar reflection for the wet road ── */
  const reflRT = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  shared.tRefl.value = reflRT.texture;
  const virt = new THREE.PerspectiveCamera();
  const tmpRot = new THREE.Matrix4();
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const texBias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);

  function renderReflection() {
    const cp = camera.position;
    virt.position.set(cp.x, -cp.y, cp.z);
    tmpRot.extractRotation(camera.matrixWorld);
    tmpA.set(0, 0, -1).applyMatrix4(tmpRot).add(cp);
    tmpB.set(tmpA.x, -tmpA.y, tmpA.z);
    virt.up.set(0, 1, 0).applyMatrix4(tmpRot);
    virt.up.y *= -1;
    virt.lookAt(tmpB);
    virt.updateMatrixWorld();
    virt.projectionMatrix.copy(camera.projectionMatrix);
    virt.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    shared.uReflM.value.copy(texBias).multiply(virt.projectionMatrix).multiply(virt.matrixWorldInverse);

    world.setGroundVisible(false);
    rain.visible = false;
    renderer.setRenderTarget(reflRT);
    renderer.render(scene, virt);
    world.setGroundVisible(true);
    rain.visible = true;
  }

  /* ── post ── */
  const post = new Post(renderer);
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    post.resize(w, h, dpr);
    reflRT.setSize(Math.max(2, Math.floor(w * dpr * 0.5)), Math.max(2, Math.floor(h * dpr * 0.5)));
    updateHandle();
  }

  /* ── state ── */
  const tram = { x: 0 };
  let simT = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speedMul = 1;
  const audio = new TramAudio();
  const rig = new CameraRig(camera, renderer.domElement, () => setCam('orbit'));
  let wantShot = false;

  /* ── styles ── */
  const su = post.style.uniforms;
  const S = { a: 0, b: 0, wipe: -0.1, anim: null, split: false, splitPos: 0.5, auto: false, autoT: 0 };
  const stylesEl = $('styles');
  const SWATCH = [
    ['#ff2e88', '#27e6ff', '#ffd23d'], ['#0d0d14', '#f0e8cc'], ['#1a2a55', '#c8321f', '#e6a63e', '#efe3c6'],
    ['#00a8e8', '#ff1f94', '#ffec1f', '#18141f'], ['#0a2a62', '#e0f0ff'], ['#1a0040', '#c01860', '#ff8a00', '#fff7b0'],
    ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  ];
  const chips = STYLES.map((st, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'tab'); b.dataset.i = i;
    b.innerHTML = `<span class="sw">${SWATCH[i].map((c) => `<i style="background:${c}"></i>`).join('')}</span><span class="nm"><span class="no">${i + 1}</span>${st.short}</span>`;
    b.addEventListener('click', (e) => setStyle(i, e.shiftKey));
    stylesEl.appendChild(b);
    return b;
  });

  function paintChips() {
    chips.forEach((c, i) => {
      c.classList.toggle('on', !S.split && i === S.b);
      c.classList.toggle('left', S.split && i === S.b);
      c.classList.toggle('right', S.split && i === S.a);
      c.setAttribute('aria-selected', i === S.b ? 'true' : 'false');
    });
    document.body.dataset.style = STYLES[S.b].key;
    if (S.split) { $('tag-l').textContent = '◀ ' + STYLES[S.b].name; $('tag-r').textContent = STYLES[S.a].name + ' ▶'; }
  }

  function setStyle(i, alt = false) {
    i = ((i % STYLES.length) + STYLES.length) % STYLES.length;
    if (S.split) {
      if (alt) S.a = i; else S.b = i;
      paintChips();
      return;
    }
    if (i === S.b && S.wipe <= -0.05) return;
    if (S.anim) { S.a = S.b; }          // finish an in-flight wipe instantly
    S.b = i;
    S.anim = { t: 0, dur: 0.95 };
    S.wipe = -0.04;
    su.uSlant.value = 0.18;
    su.uLine.value = 1;
    paintChips();
  }

  function setSplit(on) {
    S.split = on;
    $('btn-split').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('handle').hidden = !on; $('split-tags').hidden = !on;
    document.body.classList.toggle('split', on);
    if (on) {
      S.anim = null;
      if (S.a === S.b) S.a = (S.b + 1) % STYLES.length;
      su.uSlant.value = 0; su.uLine.value = 1; S.wipe = S.splitPos;
      $('hint').textContent = 'Click a style to set the left side · Shift-click sets the right · drag the divider';
    } else {
      S.a = S.b; S.wipe = -0.1; su.uLine.value = 0; su.uSlant.value = 0.18;
      $('hint').textContent = HINT;
    }
    paintChips(); updateHandle();
  }
  const HINT = $('hint').textContent;

  function updateHandle() { $('handle').style.left = S.splitPos * 100 + '%'; }
  {
    const h = $('handle');
    let drag = false;
    h.addEventListener('pointerdown', (e) => { drag = true; h.setPointerCapture(e.pointerId); });
    h.addEventListener('pointermove', (e) => { if (!drag) return; S.splitPos = clamp(e.clientX / innerWidth, 0.04, 0.96); S.wipe = S.splitPos; updateHandle(); });
    h.addEventListener('pointerup', () => { drag = false; });
  }

  function stepStyles(dt) {
    if (S.anim) {
      S.anim.t += dt;
      const k = clamp(S.anim.t / S.anim.dur, 0, 1);
      const e = k * k * (3 - 2 * k);
      S.wipe = -0.04 + e * 1.14;
      if (k >= 1) { S.anim = null; S.a = S.b; S.wipe = -0.1; su.uLine.value = 0; }
    }
    if (S.auto && !S.split) {
      S.autoT += dt;
      if (S.autoT > S.autoEvery) { S.autoT = 0; setStyle(S.b + 1); }
    }
    su.uA.value = S.a; su.uB.value = S.b; su.uWipe.value = S.wipe;
  }

  /* ── camera / speed / bell ── */
  function setCam(m) {
    rig.setMode(m, tram);
    document.querySelectorAll('#seg-cam button').forEach((b) => b.classList.toggle('on', b.dataset.cam === m));
  }
  document.querySelectorAll('#seg-cam button').forEach((b) => b.addEventListener('click', () => setCam(b.dataset.cam)));
  document.querySelectorAll('#seg-speed button').forEach((b) => b.addEventListener('click', () => {
    speedMul = parseFloat(b.dataset.speed);
    document.querySelectorAll('#seg-speed button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  const pauseBtn = $('btn-pause');
  function setPaused(p) { paused = p; pauseBtn.textContent = p ? 'Play' : 'Pause'; }
  pauseBtn.addEventListener('click', () => setPaused(!paused));
  setPaused(paused);

  const sfx = $('sfx');
  function bell() {
    audio.ding(2);
    sfx.classList.remove('pop'); void sfx.offsetWidth; sfx.classList.add('pop');
  }
  $('btn-bell').addEventListener('click', bell);
  $('btn-split').addEventListener('click', () => setSplit(!S.split));
  $('btn-auto').addEventListener('click', () => setAuto(!S.auto));
  function setAuto(on, every = 3.4) {
    S.auto = on; S.autoEvery = every; S.autoT = 0;
    $('btn-auto').setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on && S.split) setSplit(false);
  }
  S.autoEvery = 3.4;

  const soundBtn = $('btn-sound');
  soundBtn.addEventListener('click', async () => {
    if (audio.enabled) { audio.disable(); soundBtn.textContent = 'Sound off'; soundBtn.setAttribute('aria-pressed', 'false'); }
    else { await audio.enable(); soundBtn.textContent = 'Sound on'; soundBtn.setAttribute('aria-pressed', 'true'); }
  });

  /* ── photo + clip ── */
  $('btn-photo').addEventListener('click', () => { wantShot = true; });
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  let recorder = null;
  const recBtn = $('btn-rec');
  recBtn.addEventListener('click', () => {
    if (recorder) { recorder.stop(); return; }
    if (!renderer.domElement.captureStream || typeof MediaRecorder === 'undefined') { showError('Recording is not supported in this browser.'); return; }
    if (S.split) setSplit(false);
    const stream = renderer.domElement.captureStream(60);
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14e6 });
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      download(new Blob(chunks, { type: 'video/webm' }), 'ding-ding-style-tour.webm');
      recorder = null; recBtn.classList.remove('live'); recBtn.textContent = '● Record tour';
      setAuto(false);
    };
    setStyle(0);
    setAuto(true, 2.7);
    recBtn.classList.add('live'); recBtn.textContent = '■ Stop';
    recorder.start();
    setTimeout(() => recorder && recorder.stop(), STYLES.length * 2700 + 1500);
  });

  /* ── keys ── */
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '7') setStyle(parseInt(k, 10) - 1, e.shiftKey);
    else if (k === ' ') { e.preventDefault(); setPaused(!paused); }
    else if (k === 'b') bell();
    else if (k === 'c') setCam(rig.mode === 'cinematic' ? 'orbit' : 'cinematic');
    else if (k === 's') setSplit(!S.split);
    else if (k === 'a') setAuto(!S.auto);
    else if (k === 'p') wantShot = true;
    else if (k === 'n' && rig.mode === 'cinematic') rig.nextShot(tram);
  });

  /* ── thermal readout ── */
  const tMax = $('t-max'), tMin = $('t-min');
  let thermalT = 0;

  /* ── loop ── */
  addEventListener('resize', resize);
  resize();
  paintChips();
  if (params.has('style')) { S.a = S.b = clamp(parseInt(params.get('style'), 10) || 0, 0, STYLES.length - 1); paintChips(); }
  if (params.get('split') === '1') { S.a = clamp(parseInt(params.get('a') || '0', 10), 0, 6); S.b = clamp(parseInt(params.get('b') || '2', 10), 0, 6); setSplit(true); }
  if (params.get('cam') === 'orbit') setCam('orbit');
  if (params.has('t')) { const t = parseFloat(params.get('t')); tram.x += t * 8; simT += t; }
  tram.x += 6;
  rig.startShot(parseInt(params.get('shot') || '0', 10) || 0, tram.x);
  rig.shotT = parseFloat(params.get('u') || '0');
  tram.x += rig.shotT * 8; simT += rig.shotT;
  const freeze = params.get('freeze') === '1';
  if (freeze) $('loading').style.display = 'none';

  const clock = new THREE.Clock();
  let fpsAcc = 0, fpsN = 0, lastAdapt = 0;
  const TAU = Math.PI * 2;
  let bellT = 9;

  function frame() {
    requestAnimationFrame(frame);
    const dt = freeze ? 0 : Math.min(clock.getDelta(), 0.05);
    const go = paused ? 0 : speedMul;
    const sdt = dt * go;
    simT += sdt;
    tram.x += 8 * sdt;
    const time = performance.now() / 1000;
    shared.uTime.value = time;

    world.recentre(tram.x);
    if (facades) facades.update(tram.x);
    hero.group.position.x = tram.x;
    // oncoming tram circulates in a window around the hero
    const lo = tram.x - L / 2;
    oncoming.group.position.x = lo + mod(150 - 7.5 * simT - lo, L);

    hero.update(time, go);
    oncoming.update(time + 3, 0);
    traffic.update(simT, tram.x);

    lightA.position.set(tram.x - 4, 6.5, 6.5);
    lightB.position.set(tram.x + 5, 6.5, -8);

    rig.update(dt, tram);
    world.sky.position.copy(camera.position);
    shared.uCam.value.copy(camera.position);
    rain.material.uniforms.uTime.value = time;
    rain.material.uniforms.uCam.value.copy(camera.position);

    stepStyles(dt);
    audio.setSpeed(go * 8);
    audio.update(tram.x, go * 8, time);
    bellT -= dt;
    if (bellT <= 0) { bellT = 22 + Math.random() * 14; if (!document.hidden && !paused) bell(); }

    if (document.body.dataset.style === 'thermal') {
      thermalT -= dt;
      if (thermalT < 0) {
        thermalT = 0.25;
        tMax.textContent = 'MAX ' + (39 + Math.random() * 4).toFixed(1) + '°C';
        tMin.textContent = 'MIN ' + (11 + Math.random() * 2).toFixed(1) + '°C';
      }
    }

    renderReflection();
    post.render(scene, camera, time);

    if (wantShot) {
      wantShot = false;
      renderer.domElement.toBlob((b) => b && download(b, `ding-ding-${STYLES[S.b].key}.png`), 'image/png');
    }

    // adaptive resolution
    fpsAcc += dt; fpsN++;
    if (time - lastAdapt > 2.5 && fpsN > 20) {
      const avg = fpsAcc / fpsN;
      lastAdapt = time; fpsAcc = 0; fpsN = 0;
      if (avg > 1 / 36 && dpr > 0.7) { dpr = Math.max(0.7, dpr - 0.15); resize(); }
      else if (avg < 1 / 57 && dpr < baseDpr) { dpr = Math.min(baseDpr, dpr + 0.1); resize(); }
    }
    if (firstFrame) { firstFrame = false; $('loading').classList.add('done'); }
  }
  let firstFrame = true;
  frame();

  window.__tram = { setStyle, setSplit, setCam, rig, S, tram, camera, renderer, post, scene, world, get facades() { return facades; } };
}
