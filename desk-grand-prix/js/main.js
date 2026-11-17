// Desk Grand Prix: boot, game states, input, HUD and the frame loop.
import * as THREE from 'three';
import { meshAll, buildCar, PAINTS, SCALE } from './diecast.js';
import { Track, PIECE } from './track.js';
import { trackTextures, canvasTexture, canvas as mkCanvas } from './textures.js';
import { buildWorld, drawScreen } from './world.js';
import { CarBody, collideCars, applyDraft } from './physics.js';
import { Race, AIDriver, fmtTime } from './race.js';
import { CameraRig, SHOTS } from './camera.js';
import { Post } from './post.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);
const store = { get(k, d) { try { const v = localStorage.getItem('dgp.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } }, set(k, v) { try { localStorage.setItem('dgp.' + k, JSON.stringify(v)); } catch (_) {} } };
const status = (t, p) => { $('loadStatus').textContent = t; if (p !== undefined) $('loadFill').style.width = (p * 100).toFixed(0) + '%'; };
const params = new URLSearchParams(location.search);

const CAM_NAMES = { chase: 'Chase', front: 'Front', low: 'Low', tv: 'Trackside', hood: 'Hood', heli: 'Heli', director: 'Director', intro: 'Showroom', orbit: 'Orbit' };

async function boot() {
  status('Loading type…', 0.03);
  try {
    await Promise.race([
      Promise.all(['900 40px Archivo', '800 20px Archivo', '600 20px "JetBrains Mono"', '600 40px Caveat'].map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (_) { /* fall back to system fonts */ }

  const canvas = $('stage');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const dprCap = params.has('lowq') ? 1 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(Math.max(1, innerWidth), Math.max(1, innerHeight), false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, Math.max(1, innerWidth) / Math.max(1, innerHeight), 0.25, 2000);
  camera.position.set(-40, 10, 50);

  status('Laying the track…', 0.08);
  const track = new Track();
  scene.add(track.build(trackTextures()));
  status('Setting up the desk…', 0.14);
  const world = buildWorld(scene, renderer, track);

  status('Casting die-cast bodies…', 0.2);
  const ids = ['countach', 'brawler', 'hatch', 'van'];
  const meshes = await meshAll(ids, (p, id) => status(`Casting die-cast bodies… ${Math.round(p * 4)}/4`, 0.2 + p * 0.65));

  status('Painting tampo graphics…', 0.88);
  let paintIdx = Math.max(0, PAINTS.findIndex((p) => p.id === store.get('paint', 'candy-red')));
  const roster = [
    { id: 'countach', name: 'You', short: 'YOU', css: PAINTS[paintIdx].css, player: true },
    { id: 'brawler', name: 'Brawler 440', short: 'BRW', css: '#e2621a', skill: 0.91, power: 0.93, bias: -1.1 },
    { id: 'hatch', name: 'Rally 12', short: 'RLY', css: '#e8e4dc', skill: 0.89, power: 0.91, bias: 0.9 },
    { id: 'van', name: 'Hauler', short: 'HAU', css: '#7b3cd0', skill: 0.87, power: 0.9, bias: 0.1 },
  ];
  const shadowTex = (() => {
    const cv = mkCanvas(128, 128), c = cv.getContext('2d');
    const g = c.createRadialGradient(64, 64, 6, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.55, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); return canvasTexture(cv, { srgb: false });
  })();
  const racers = roster.map((r, i) => {
    const car = buildCar(r.id, meshes[r.id], r.player ? { paint: PAINTS[paintIdx] } : {});
    scene.add(car.root);
    const body = new CarBody(track, car);
    body.power = r.power || 1;
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(car.length * 1.25, car.width * 1.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4 }));
    blob.userData.noAO = true; blob.renderOrder = 1;
    scene.add(blob);
    const racer = { ...r, car, body, blob, isPlayer: !!r.player, lapTimes: [], best: null, progress: 0, crossings: 0, seam: 0 };
    racer.ai = new AIDriver(racer, track, r.skill || 0.97, r.bias || 0, i + 1);
    return racer;
  });
  const player = racers[0];
  const rivals = racers.slice(1);
  const race = new Race(track, racers, 3);
  race.grid(3);

  const rig = new CameraRig(camera, canvas);
  rig.setTarget(player);
  rig.setMode('intro');
  const post = new Post(renderer, scene, camera);
  const sound = new Sound();
  sound.setOn(store.get('sound', true));
  $('soundBtn').setAttribute('aria-pressed', String(sound.on));

  // ---------------------------------------------------------------- UI state
  let mode = 'title';               // title | countdown | race | done | watch
  let photo = false, timeScale = 1, slowTarget = 1;
  let playMode = 'chase';
  const body = document.body;
  const setMode = (m) => {
    mode = m;
    $('title').hidden = m !== 'title';
    $('results').hidden = m !== 'done';
    body.classList.toggle('racing', m === 'countdown' || m === 'race');
  };

  const paintsEl = $('paints');
  PAINTS.forEach((p, i) => {
    const b = document.createElement('button');
    b.style.background = p.css; b.title = p.name; b.setAttribute('aria-label', p.name);
    b.setAttribute('aria-pressed', String(i === paintIdx));
    b.onclick = () => {
      paintIdx = i; player.car.setPaint(p); player.css = p.css; store.set('paint', p.id);
      [...paintsEl.children].forEach((c, j) => c.setAttribute('aria-pressed', String(j === i)));
      sound.unlock(); sound.clink(0.4, 1.2);
    };
    paintsEl.appendChild(b);
  });

  let toastTimer = 0;
  const toast = (html, secs = 1.6) => { const t = $('toast'); t.innerHTML = html; t.classList.add('on'); toastTimer = secs; };
  const camLabel = () => { $('camName').textContent = CAM_NAMES[rig.mode] || rig.mode; };

  const startRace = () => {
    sound.unlock();
    race.grid(3);
    for (const r of racers) r.body.events.length = 0;
    race.startCountdown();
    setMode('countdown');
    rig.setTarget(player);
    rig.setMode(playMode);
    camLabel();
    $('lapTot').textContent = race.laps;
    canvas.focus();
  };
  const toShowroom = () => {
    race.grid(3); race.state = 'idle'; setMode('title');
    rig.setTarget(player); rig.setMode('intro'); camLabel();
  };
  const watch = () => {
    sound.unlock();
    race.grid(3); race.startDemo(); setMode('watch');
    rig.setTarget(player); rig.setMode('director'); camLabel();
    toast('Watching the AI<small>C to change camera · Esc for the showroom</small>', 2.4);
  };
  $('raceBtn').onclick = startRace;
  $('againBtn').onclick = startRace;
  $('menuBtn').onclick = toShowroom;
  $('watchBtn').onclick = watch;

  const cycleCam = () => {
    const list = [...SHOTS, 'director'];
    const cur = list.indexOf(rig.mode);
    const next = list[(cur + 1) % list.length];
    rig.setMode(next); if (mode !== 'watch' && mode !== 'title') playMode = next; camLabel();
  };
  $('camBtn').onclick = () => { if (mode === 'title') { watch(); return; } cycleCam(); };
  const toggleClean = () => body.classList.toggle('clean');
  $('cleanBtn').onclick = toggleClean;
  const toggleSound = () => { sound.unlock(); sound.setOn(!sound.on); store.set('sound', sound.on); $('soundBtn').setAttribute('aria-pressed', String(sound.on)); };
  $('soundBtn').onclick = toggleSound;

  // ---------------------------------------------------------------- photo mode
  let prePhotoMode = 'chase';
  const setPhoto = (on) => {
    photo = on;
    $('photoBar').hidden = !on;
    $('photoBtn').setAttribute('aria-pressed', String(on));
    if (on) { prePhotoMode = rig.mode; rig.setMode('orbit'); $('apSlider').value = rig.aperture.toFixed(1); }
    else { rig.setMode(prePhotoMode); }
    camLabel();
  };
  $('photoBtn').onclick = () => setPhoto(!photo);
  $('photoExit').onclick = () => setPhoto(false);
  let photoAperture = 14;
  $('apSlider').oninput = (e) => { photoAperture = +e.target.value; };
  const ray = new THREE.Raycaster();
  let downAt = null;
  canvas.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; sound.unlock(); });
  canvas.addEventListener('pointerup', (e) => {
    if (!photo || !downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) return;
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.visible && !h.object.isPoints && !h.object.isSprite);
    if (hit) { rig.focusOverride = hit.point.clone(); }
  });
  let wantShot = false;
  $('shotBtn').onclick = () => { wantShot = true; };

  // ---------------------------------------------------------------- recording
  let recorder = null, chunks = [];
  const toggleRec = () => {
    sound.unlock();
    if (recorder) { recorder.stop(); return; }
    const types = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const type = types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    if (!type) { toast('Recording is not supported in this browser'); return; }
    const stream = canvas.captureStream(60);
    if (sound.stream) sound.stream.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    chunks = [];
    recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 24e6 });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `desk-grand-prix-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${type.includes('mp4') ? 'mp4' : 'webm'}`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      recorder = null; body.classList.remove('recording'); $('recLbl').textContent = 'Record';
      toast('Clip saved');
    };
    recorder.start(250);
    body.classList.add('recording'); $('recLbl').textContent = 'Stop';
  };
  $('recBtn').onclick = toggleRec;

  // ---------------------------------------------------------------- input
  const keys = new Set();
  const map = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'hb' };
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    sound.unlock();
    if (map[e.code]) { keys.add(map[e.code]); e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'KeyC') cycleCam();
    if (e.code === 'KeyH') toggleClean();
    if (e.code === 'KeyM') toggleSound();
    if (e.code === 'KeyP') setPhoto(!photo);
    if (e.code === 'KeyV') toggleRec();
    if (e.code === 'KeyR' && (mode === 'race')) player.body.respawn();
    if (e.code === 'Escape') { if (photo) setPhoto(false); else if (mode !== 'title') toShowroom(); }
    if ((e.code === 'Enter') && (mode === 'title' || mode === 'done')) startRace();
  });
  addEventListener('keyup', (e) => { if (map[e.code]) keys.delete(map[e.code]); });
  addEventListener('blur', () => keys.clear());
  for (const [id, k] of [['tL', 'left'], ['tR', 'right'], ['tB', 'down'], ['tG', 'up']]) {
    const el = $(id);
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); sound.unlock(); keys.add(k); el.setPointerCapture(e.pointerId); });
    const up = () => keys.delete(k);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  let steerCmd = 0;
  const playerInput = (dt) => {
    const inp = player.body.input;
    const want = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const rate = want === 0 ? 7 : (Math.sign(want) !== Math.sign(steerCmd) ? 9 : 4.5);
    steerCmd += Math.max(-rate * dt, Math.min(rate * dt, want - steerCmd));
    inp.steer = steerCmd;
    inp.throttle = keys.has('up') ? 1 : 0;
    inp.brake = keys.has('down') ? 1 : 0;
    inp.handbrake = keys.has('hb') ? 1 : 0;
  };

  // ---------------------------------------------------------------- HUD
  const mapCv = $('map'), mctx = mapCv.getContext('2d');
  const plan = track.plan(6);
  let xs = plan.map((p) => p[0]), zs = plan.map((p) => p[1]);
  const mx0 = Math.min(...xs), mx1 = Math.max(...xs), mz0 = Math.min(...zs), mz1 = Math.max(...zs);
  const ms = Math.min((mapCv.width - 24) / (mx1 - mx0), (mapCv.height - 24) / (mz1 - mz0));
  const mpx = (x, z) => [12 + (x - mx0) * ms + ((mapCv.width - 24) - (mx1 - mx0) * ms) / 2, 12 + (z - mz0) * ms + ((mapCv.height - 24) - (mz1 - mz0) * ms) / 2];
  const drawMap = () => {
    mctx.clearRect(0, 0, mapCv.width, mapCv.height);
    mctx.lineJoin = 'round'; mctx.lineCap = 'round';
    mctx.strokeStyle = 'rgba(255,106,16,0.9)'; mctx.lineWidth = 9; mctx.beginPath();
    plan.forEach(([x, z, g], i) => { const [a, b] = mpx(x, z); if (g) { mctx.stroke(); mctx.beginPath(); return; } i && !plan[i - 1][2] ? mctx.lineTo(a, b) : mctx.moveTo(a, b); });
    mctx.closePath(); mctx.stroke();
    const sl = track.sample(track.sStart), [sa, sb] = mpx(sl.p.x, sl.p.z);
    mctx.fillStyle = '#fff'; mctx.fillRect(sa - 1.5, sb - 9, 3, 18);
    for (const r of [...racers].reverse()) {
      const [a, b] = mpx(r.body.pos.x, r.body.pos.z);
      mctx.beginPath(); mctx.arc(a, b, r.isPlayer ? 7 : 5.5, 0, Math.PI * 2);
      mctx.fillStyle = r.isPlayer ? player.css : r.css; mctx.fill();
      mctx.lineWidth = 2.5; mctx.strokeStyle = r.isPlayer ? '#fff' : 'rgba(0,0,0,.6)'; mctx.stroke();
    }
  };
  let hudT = 0, screenT = 0;
  const updateHud = (dt) => {
    hudT -= dt; screenT -= dt;
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('on'); }
    if (screenT <= 0) {
      screenT = 0.5;
      const lead = race.order[0];
      drawScreen(world, race.order.map((r) => ({ name: r.isPlayer ? 'YOU · LP400' : r.name.toUpperCase(), color: r.isPlayer ? player.css : r.css, gap: r === lead ? (r.finished ? 'WIN' : 'LEADER') : `+${((lead.progress - r.progress) / 95).toFixed(2)}s` })),
        mode === 'race' || mode === 'done' ? `LAP ${Math.min(race.laps, (player.lapTimes.length || 0) + 1)}/${race.laps}` : mode === 'watch' ? 'DEMO' : 'GRID');
    }
    if (hudT > 0) return;
    hudT = 1 / 20;
    const b = player.body;
    const kmh = Math.round(b.speed * 64 * 0.036);
    $('speed').textContent = kmh;
    const { gear, rpm } = sound.rpm(Math.abs(b.u));
    $('gear').textContent = b.speed < 1 ? 'N' : b.u < -1 ? 'R' : gear;
    $('revFill').style.width = (rpm * 100).toFixed(0) + '%';
    if (mode === 'race' || mode === 'countdown') {
      const pos = race.position(player);
      $('pos').innerHTML = `P${pos}<small>/${racers.length}</small>`;
      $('lapNo').textContent = Math.min(race.laps, player.lapTimes.length + 1);
      $('lapNow').textContent = mode === 'race' && player.crossings > 0 ? fmtTime(race.raceTime - player.lapStart) : '0.00';
      $('lapLast').textContent = fmtTime(player.lapTimes[player.lapTimes.length - 1]);
      $('lapBest').textContent = fmtTime(player.best);
      $('board').innerHTML = race.order.map((r, i) => `<div class="${r.isPlayer ? 'me' : ''}"><span>${i + 1}</span><i style="background:${r.isPlayer ? player.css : r.css}"></i>${r.short}</div>`).join('');
      drawMap();
    }
  };

  const showResults = () => {
    const pos = race.position(player);
    $('resTitle').textContent = pos === 1 ? 'You win!' : `P${pos} at the flag`;
    const best = player.best;
    const allTime = store.get('best', null);
    if (best && (!allTime || best < allTime)) store.set('best', best);
    $('resSub').textContent = `Best lap ${fmtTime(best)} · all-time ${fmtTime(Math.min(best || 1e9, allTime || 1e9))}`;
    $('resultRows').innerHTML = race.order.map((r, i) => {
      const t = r.finished ? fmtTime(r.finishTime) : 'running';
      return `<div class="${r.isPlayer ? 'me' : ''}"><span>${i + 1}</span><i style="background:${r.isPlayer ? player.css : r.css}"></i><span>${r.isPlayer ? 'You · Countach' : r.name}</span><em>best ${fmtTime(r.best)}</em><span>${t}</span></div>`;
    }).join('');
    setMode('done');
  };

  // ---------------------------------------------------------------- events
  const handleEvents = (events) => {
    for (const ev of events) {
      if (ev.type === 'light') { const spans = $('lights').children; for (let i = 0; i < 3; i++) spans[i].classList.toggle('lit', i < ev.n); $('lights').classList.add('on'); $('lights').classList.remove('go'); sound.beep(false); }
      if (ev.type === 'go') { const L = $('lights'); [...L.children].forEach((s) => s.classList.remove('lit')); L.classList.add('go'); setTimeout(() => L.classList.remove('on', 'go'), 900); sound.beep(true); setMode('race'); toast('GO!', 0.8); }
      if (ev.type === 'lap' && ev.racer.isPlayer) toast(`Lap ${ev.lap}/${race.laps}<small>${fmtTime(ev.t)}${ev.racer.best === ev.t ? ' · best' : ''}</small>`, 1.6);
      if (ev.type === 'finish' && ev.racer.isPlayer) {
        toast(ev.pos === 1 ? 'Chequered flag. You win!' : `Finished P${ev.pos}`, 2.2);
        player.ai.skill = 0.9;
        setTimeout(() => { if (mode === 'race') showResults(); }, 2600);
      }
    }
  };
  const handleBodyEvents = (r) => {
    const near = r.isPlayer ? 1 : Math.min(1, 40 / (camera.position.distanceTo(r.body.pos) + 10));
    for (const ev of r.body.events) {
      if (ev.type === 'wall') { sound.thunk(Math.min(1, ev.v / 80) * near, 620); if (r === rig.target) rig.bump(Math.min(0.6, ev.v / 150)); }
      if (ev.type === 'land') { sound.clink(Math.min(1, ev.v / 60) * near, 0.9); sound.thunk(Math.min(1, ev.v / 50) * near, 420); if (r === rig.target && ev.v > 25) rig.bump(Math.min(0.5, ev.v / 90)); }
      if (ev.type === 'crash') { sound.clink(near, 0.8); sound.thunk(near, 300); if (r.isPlayer && mode === 'race') toast('Off the track!', 1.1); }
    }
    r.body.events.length = 0;
  };

  // ---------------------------------------------------------------- loop
  // a page opened in a hidden or zero-height frame gets its real size later: check every frame
  let lastW = 0, lastH = 0;
  const fit = () => {
    const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    post.setSize(w, h);
  };
  addEventListener('resize', fit);
  fit();
  const clock = new THREE.Clock();
  let time = 0, fpsAcc = 0, fpsN = 0, lowered = false;
  const focusV = new THREE.Vector3();
  const qTmp = new THREE.Quaternion();

  status('Ready', 1);
  setMode('title'); camLabel();
  setTimeout(() => $('loader').classList.add('done'), 150);

  const frame = () => {
    const rawDt = Math.min(0.05, clock.getDelta());
    fit();
    // adaptive quality: drop the pixel ratio once if we can't hold ~40 fps
    fpsAcc += rawDt; fpsN++;
    if (!lowered && fpsAcc > 4) { if (fpsN / fpsAcc < 38 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight, false); post.setSize(innerWidth, innerHeight); lowered = true; } fpsAcc = 0; fpsN = 0; }

    // slow motion while the camera's car is in the air over the gap
    const tgt = rig.target;
    const jumping = tgt && tgt.body.air && tgt.body.pos.x < -45 && tgt.body.pos.x > -85 && tgt.body.pos.z < 0;
    slowTarget = photo ? 0 : jumping && (mode === 'race' || mode === 'watch') ? 0.3 : 1;
    timeScale += (slowTarget - timeScale) * Math.min(1, rawDt * (slowTarget < timeScale ? 18 : 5));
    if (photo) timeScale = 0;
    const dt = rawDt * timeScale;
    time += rawDt;

    // drivers
    const events = [];
    if (mode === 'race' || mode === 'done' || mode === 'watch') {
      for (const r of racers) {
        if (r.isPlayer && mode === 'race' && !r.finished) playerInput(rawDt);
        else r.ai.update(dt, racers, mode === 'watch' ? null : player);
      }
    } else if (mode === 'countdown') {
      playerInput(rawDt);
      for (const r of racers) { r.body.input.throttle = r.isPlayer ? player.body.input.throttle : 0.3; r.body.input.brake = 0; r.body.input.steer = 0; }
    }
    if (dt > 0) {
      if (mode === 'countdown' || mode === 'title') {
        for (const r of racers) r.body.updatePose();
      } else {
        applyDraft(racers.map((r) => r.body), track);
        for (const r of racers) r.body.step(dt);
        collideCars(racers.map((r) => r.body), (A, B, J) => {
          if (J < 6) return;
          const near = Math.min(1, 40 / (camera.position.distanceTo(A.pos) + 10));
          sound.clink(Math.min(1, J / 40) * near, 1.05);
          if (rig.target && (rig.target.body === A || rig.target.body === B)) rig.bump(Math.min(0.5, J / 80));
        });
      }
      race.update(dt, events);
    }
    handleEvents(events);
    racers.forEach(handleBodyEvents);

    // track-seam clicks under the player
    if (mode === 'race' && !player.body.air) {
      const seam = Math.floor(player.body.s / PIECE);
      if (seam !== player.seam) { player.seam = seam; sound.tick && sound.ctx && sound.tick(Math.min(0.9, Math.abs(player.body.u) / 65) * 0.8, 2500); }
    }

    // visuals
    for (const r of racers) {
      const b = r.body, root = r.car.root;
      root.position.copy(b.pos);
      if (b.air || b.crashed > 0) root.quaternion.copy(b.quat);
      else root.quaternion.slerp(b.quat, 1 - Math.exp(-rawDt * 35));
      // a hair of chassis buzz from rolling over the moulding
      if (!b.air && Math.abs(b.u) > 5) root.position.y += Math.sin(time * 90 + r.car.def.length * 7) * 0.004 * Math.min(1, Math.abs(b.u) / 50);
      root.visible = !(b.ghost > 0 && Math.floor(time * 12) % 2 === 0);
      for (const w of r.car.wheels) {
        const rr = w.r * SCALE;
        w.wheel.rotation.z = -w.side * (b.spin / rr);
        if (w.front) w.holder.rotation.y = (w.side > 0 ? 0 : Math.PI) - b.delta;
      }
      // contact shadow: sits on the track (or desk) under the car, fades with height
      const bl = r.blob;
      if (b.air || b.crashed > 0) {
        const pr = track.project(b.pos, b.hint, r._pr || (r._pr = {}));
        const f = track.sample(pr.s);
        const over = !pr.gap && Math.abs(pr.d) < 6.4;
        const gy = over ? f.p.y + f.N.y * 0 + 0.02 : 0.03;
        bl.position.set(b.pos.x, gy, b.pos.z);
        bl.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        bl.material.opacity = 0.55 * Math.max(0, 1 - (b.pos.y - gy) / 6);
      } else {
        const f = track.sample(b.s);
        bl.position.copy(b.pos).addScaledVector(f.N, 0.02);
        qTmp.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.N);
        bl.quaternion.copy(root.quaternion).multiply(qTmp.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
        bl.material.opacity = 0.55;
      }
      bl.visible = root.visible;
    }

    world.update(rawDt, time);
    rig.update(rawDt, { timeScale, jumpWatch: rig.mode === 'director' && jumping });
    focusV.copy(rig.focusPoint);
    world.followShadow(focusV);
    sound.update(rawDt, player, rivals, camera.position, timeScale);
    updateHud(rawDt);
    const ap = photo ? photoAperture : rig.aperture;
    post.render(rawDt, rig.focusDist, ap);
    if (wantShot) {
      wantShot = false;
      renderer.domElement.toBlob((blob) => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `desk-grand-prix-${Date.now()}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        toast('Photo saved');
      }, 'image/png');
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // ?demo[=seconds]: one click films a hands-free clip (AI race, director camera, no UI) and downloads it
  if (params.has('demo')) {
    const secs = +params.get('demo') || 28;
    const go = () => {
      removeEventListener('pointerdown', go);
      watch(); body.classList.add('clean'); toggleRec();
      setTimeout(() => { if (recorder) toggleRec(); body.classList.remove('clean'); }, secs * 1000);
    };
    setTimeout(() => toast(`Click anywhere to film a ${secs}s demo clip`, 60), 400);
    addEventListener('pointerdown', go);
  }

  // debugging hooks
  window.__dgp = { scene, camera, renderer, track, racers, race, rig, post, world, startRace, watch, setMode: (m) => setMode(m) };
}

boot().catch((err) => {
  console.error(err);
  status('Something went wrong: ' + (err && err.message ? err.message : err));
});
