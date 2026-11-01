// Film player: playback clock, scrubbing, subtitles, sound controls, aspect/quality, debug overlay.
import { renderFrame } from './film.js';
import { DURATION, SCENES, SHOTS, FPS, cueAt, sceneAt, shotAt, CUES } from './timeline.js';
import { Soundtrack } from './audio.js';

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

if (params.has('export')) {
  import('./export.js').then((m) => m.runExport(params)).catch(showFatal);
} else {
  try { player(); } catch (e) { showFatal(e); }
}

function showFatal(e) {
  console.error(e);
  const el = $('error');
  el.hidden = false;
  el.textContent = `Something went wrong drawing the film.\n${e && e.message ? e.message : e}\n\nServe this folder over HTTP (for example: python3 -m http.server 4190) and open it in a current Chrome, Edge, Firefox or Safari.`;
}

function player() {
  const root = $('player');
  const canvas = $('film');
  const stage = $('stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    t: params.has('t') ? Math.min(DURATION, Math.max(0, parseFloat(params.get('t')) || 0)) : 4.2,
    playing: false,
    started: params.has('t'),
    quality: params.get('q') === 'preview' ? 0.5 : 1,
    aspect: params.get('aspect') === 'tall' ? 'tall' : 'wide',
    subs: true,
    dirty: true,
    wallT0: 0,
    wallStart: 0,
    debug: params.has('debug'),
    layers: { grade: true, bloom: true, texture: true, clouds: true, ocean: true, figures: true, atmosphere: true },
    lastCue: null,
    errored: false,
  };

  const sound = new Soundtrack();
  // Dev hook: render one still offscreen and upload it to the capture server.
  const still = async (t, w = 1280, h = 720, name = `still_${t}.jpg`) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    renderFrame(c, t, { quality: 1, subtitles: true, frame: Math.floor(t * FPS) });
    await fetch(`/upload/${name}`, { method: 'POST', body: c.toDataURL('image/jpeg', 0.9), headers: { 'X-Encoding': 'base64' } });
    return name;
  };
  window.__film = { state, sound, seek: (t) => seek(t), render: () => draw(), still };

  // ——— sizing ———
  function resize() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cap = state.quality < 1 ? 960 : 1920;
    let w = r.width * dpr * state.quality, h = r.height * dpr * state.quality;
    const long = Math.max(w, h);
    if (long > cap) { w *= cap / long; h *= cap / long; }
    canvas.width = Math.max(2, Math.round(w));
    canvas.height = Math.max(2, Math.round(h));
    state.dirty = true;
  }
  new ResizeObserver(resize).observe(stage);

  // ——— rendering ———
  let fpsAcc = 0, fpsN = 0, fps = 0, frameMs = 0, fpsT = performance.now();
  function draw() {
    const t0 = performance.now();
    try {
      renderFrame(canvas, state.t, { quality: state.quality, layers: state.layers, frame: Math.floor(state.t * FPS), flashScale: reduced ? 0.5 : 1 });
    } catch (e) {
      if (!state.errored) { state.errored = true; pause(); showFatal(e); }
      return;
    }
    frameMs = performance.now() - t0;
    fpsN++;
    if (t0 - fpsT > 500) { fps = (fpsN * 1000) / (t0 - fpsT); fpsN = 0; fpsT = t0; }
    updateUI();
  }

  function clock(now) {
    if (sound.running) return sound.time();
    return state.wallT0 + (now - state.wallStart) / 1000;
  }

  function loop(now) {
    if (state.playing) {
      state.t = clock(now);
      if (state.t >= DURATION) { state.t = DURATION - 1e-3; pause(); }
      state.dirty = true;
    }
    if (state.dirty) { state.dirty = false; draw(); }
    requestAnimationFrame(loop);
  }

  // ——— transport ———
  async function play() {
    if (state.t >= DURATION - 0.05) state.t = 0;
    state.playing = true;
    root.classList.add('playing');
    $('play').setAttribute('aria-label', 'Pause');
    state.wallT0 = state.t;
    state.wallStart = performance.now();
    try {
      await sound.unlock();
      if (!sound.ready) {
        status('Preparing sound…');
        sound.prepare().then(() => {
          status('');
          if (state.playing) { sound.play(clock(performance.now())); }
        }).catch((e) => { console.warn(e); status('Sound unavailable — playing silently.'); });
      } else sound.play(state.t);
    } catch (e) { console.warn(e); status('Sound unavailable — playing silently.'); }
  }

  function pause() {
    if (state.playing) state.t = clock(performance.now());
    state.playing = false;
    root.classList.remove('playing');
    $('play').setAttribute('aria-label', 'Play');
    sound.stop();
    narrator.cancel();
    state.dirty = true;
  }

  function seek(t) {
    state.t = Math.min(DURATION - 1e-3, Math.max(0, t));
    state.wallT0 = state.t;
    state.wallStart = performance.now();
    if (state.playing && sound.ready) sound.play(state.t);
    narrator.cancel();
    state.lastCue = null;
    state.dirty = true;
  }

  function start() {
    if (!state.started) { state.started = true; state.t = 0; }
    $('poster').classList.add('gone');
    play();
  }

  // ——— narration preview (browser TTS) ———
  const narrator = {
    on: false,
    cancel() { if ('speechSynthesis' in window) speechSynthesis.cancel(); },
    speak(text) {
      if (!this.on || !('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.86; u.pitch = 0.8; u.volume = Math.min(1, sound.master);
      speechSynthesis.speak(u);
    },
  };

  // ——— UI ———
  const markers = $('markers');
  for (const s of SCENES) {
    const m = document.createElement('span');
    m.style.left = `${(s.start / DURATION) * 100}%`;
    m.dataset.n = String(s.id);
    m.title = s.title;
    markers.appendChild(m);
  }

  const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
  const total = `${Math.floor(DURATION / 60)}:${String(Math.round(DURATION % 60)).padStart(2, '0')}`;
  let lastScene = null;
  function updateUI() {
    const t = state.t;
    const k = t / DURATION;
    $('scrubFill').style.width = `${k * 100}%`;
    $('scrubHead').style.left = `${k * 100}%`;
    $('scrub').setAttribute('aria-valuenow', t.toFixed(1));
    $('time').textContent = `${fmt(t)} / ${total}`;
    const sc = sceneAt(t);
    if (sc !== lastScene) { $('sceneName').textContent = sc.title; lastScene = sc; }
    const cue = state.started ? cueAt(t) : null;
    const subs = $('subs');
    if (cue !== state.lastCue) {
      if (cue) { subs.textContent = cue.text; if (state.playing) narrator.speak(cue.text); }
      state.lastCue = cue;
    }
    subs.classList.toggle('on', !!cue && state.subs);
    if (state.debug) debugPanel();
  }

  function status(s) { $('status').textContent = s; }

  $('posterPlay').addEventListener('click', start);
  $('play').addEventListener('click', () => {
    if (!state.started) return start();
    state.playing ? pause() : play();
  });
  $('restart').addEventListener('click', () => {
    if (!state.started) return start();
    seek(0);
    if (!state.playing) play();
  });

  // Scrubbing.
  const scrub = $('scrub');
  const tip = $('scrubTip');
  let dragging = false, resume = false;
  const tAt = (e) => {
    const r = scrub.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * DURATION;
  };
  scrub.addEventListener('pointerdown', (e) => {
    dragging = true;
    resume = state.playing;
    if (state.playing) pause();
    if (!state.started) { state.started = true; $('poster').classList.add('gone'); }
    scrub.setPointerCapture(e.pointerId);
    seek(tAt(e));
  });
  scrub.addEventListener('pointermove', (e) => {
    const t = tAt(e);
    const r = scrub.getBoundingClientRect();
    tip.hidden = false;
    tip.style.left = `${((t / DURATION) * r.width)}px`;
    tip.textContent = `${fmt(t)} · ${sceneAt(t).title} · ${SHOTS[shotAt(t)].id}`;
    if (dragging) seek(t);
  });
  scrub.addEventListener('pointerleave', () => { if (!dragging) tip.hidden = true; });
  const endDrag = () => { if (!dragging) return; dragging = false; tip.hidden = true; if (resume) play(); };
  scrub.addEventListener('pointerup', endDrag);
  scrub.addEventListener('pointercancel', endDrag);
  scrub.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); seek(state.t + (e.key === 'ArrowLeft' ? -2 : 2)); }
  });

  // Sound controls.
  const vol = $('volume');
  const applyVol = () => {
    sound.setLevels({ master: parseFloat(vol.value), amb: parseFloat($('ambVol').value), fx: parseFloat($('fxVol').value) });
  };
  vol.addEventListener('input', () => { if (sound.muted && parseFloat(vol.value) > 0) toggleMute(); applyVol(); });
  $('ambVol').addEventListener('input', applyVol);
  $('fxVol').addEventListener('input', applyVol);
  applyVol();
  function toggleMute() {
    sound.setMuted(!sound.muted);
    root.classList.toggle('muted', sound.muted);
    $('mute').setAttribute('aria-label', sound.muted ? 'Unmute' : 'Mute');
  }
  $('mute').addEventListener('click', toggleMute);
  $('mixBtn').addEventListener('click', () => {
    const m = $('mix');
    m.hidden = !m.hidden;
    $('mixBtn').setAttribute('aria-expanded', String(!m.hidden));
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.menu-wrap')) { $('mix').hidden = true; $('mixBtn').setAttribute('aria-expanded', 'false'); }
  });
  $('tts').addEventListener('change', (e) => {
    narrator.on = e.target.checked;
    if (!narrator.on) narrator.cancel();
    if (narrator.on && !('speechSynthesis' in window)) status('This browser has no speech synthesis.');
  });

  sound.loadNarration('audio/narration.json').then((info) => {
    if (info) $('narrationNote').textContent = `Narration: ${info.label || info.src}.`;
  }).catch((e) => console.warn('narration', e));

  // View toggles.
  const ccBtn = $('cc');
  ccBtn.addEventListener('click', () => {
    state.subs = !state.subs;
    ccBtn.setAttribute('aria-pressed', String(state.subs));
    state.dirty = true;
  });
  const aspectBtn = $('aspect');
  const setAspect = (a) => {
    state.aspect = a;
    root.dataset.aspect = a;
    aspectBtn.textContent = a === 'tall' ? '9:16' : '16:9';
    aspectBtn.title = a === 'tall' ? 'Switch to widescreen 16:9' : 'Switch to vertical 9:16';
    resize();
  };
  aspectBtn.addEventListener('click', () => setAspect(state.aspect === 'tall' ? 'wide' : 'tall'));
  const qBtn = $('quality');
  const setQuality = (q) => {
    state.quality = q;
    qBtn.textContent = q < 1 ? 'Preview' : 'High';
    resize();
  };
  qBtn.addEventListener('click', () => setQuality(state.quality < 1 ? 1 : 0.5));
  $('fs').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.requestFullscreen?.().catch(() => status('Fullscreen is not available here.'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); $('play').click(); }
    else if (e.key === 'ArrowLeft') seek(state.t - 2);
    else if (e.key === 'ArrowRight') seek(state.t + 2);
    else if (e.key === 'm') toggleMute();
    else if (e.key === 'c') ccBtn.click();
    else if (e.key === 'f') $('fs').click();
  });

  // Debug overlay (?debug).
  const dbg = $('debug');
  if (state.debug) {
    dbg.hidden = false;
    dbg.innerHTML = `<div id="dbgInfo"></div><hr>${Object.keys(state.layers).map((k) => `<label><input type="checkbox" data-layer="${k}" checked> ${k}</label>`).join('')}`;
    dbg.addEventListener('change', (e) => {
      const k = e.target.dataset.layer;
      if (k) { state.layers[k] = e.target.checked; state.dirty = true; }
    });
  }
  function debugPanel() {
    const i = shotAt(state.t);
    $('dbgInfo').innerHTML = `fps ${fps.toFixed(0)} · ${frameMs.toFixed(1)} ms<br>t ${state.t.toFixed(3)} · frame ${Math.floor(state.t * FPS)}<br>scene ${sceneAt(state.t).id} · shot ${SHOTS[i].id}<br>${canvas.width}×${canvas.height} · q ${state.quality}`;
  }

  if (state.started) $('poster').classList.add('gone');
  setAspect(state.aspect);
  setQuality(state.quality);
  requestAnimationFrame(loop);
  // Warm the soundtrack and every shot's painted cloud sprites in the background,
  // one shot per idle tick, so playback does not hitch on first sight of a shot.
  sound.prepare().catch((e) => console.warn('sound', e));
  let warmKey = '';
  const prewarm = () => {
    const key = `${canvas.width}x${canvas.height}`;
    if (key === warmKey) return;
    warmKey = key;
    const scratch = document.createElement('canvas');
    let i = 0;
    const step = () => {
      if (warmKey !== key || i >= SHOTS.length) return;
      if (state.playing) { setTimeout(step, 400); return; }
      scratch.width = canvas.width; scratch.height = canvas.height;
      const s = SHOTS[i++];
      try { renderFrame(scratch, (s.start + s.end) / 2, { quality: state.quality, layers: state.layers }); } catch (e) { console.warn(e); }
      setTimeout(step, 30);
    };
    setTimeout(step, 1200);
  };
  new ResizeObserver(() => setTimeout(prewarm, 500)).observe(stage);
  void CUES;
}
