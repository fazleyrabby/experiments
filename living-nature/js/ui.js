// Floating controls: play/pause, time of day, weather, sound, fullscreen.
import { fmtHour, phaseName } from './look.js';

const ICONS = {
  play: ['.#.......', '.##......', '.###.....', '.####....', '.#####...', '.####....', '.###.....', '.##......', '.#.......'],
  pause: ['.........', '.###.###.', '.###.###.', '.###.###.', '.###.###.', '.###.###.', '.###.###.', '.###.###.', '.........'],
  clear: ['....#....', '.#.....#.', '...###...', '..#####..', '#.#####.#', '..#####..', '...###...', '.#.....#.', '....#....'],
  clouds: ['.........', '....##...', '...####..', '.#######.', '#########', '#########', '.#######.', '.........', '.........'],
  rain: ['...###...', '..#####..', '.#######.', '#########', '.#######.', '..#.#.#..', '.#.#.#...', '..#.#.#..', '.#.#.#...'],
  fog: ['.........', '#########', '.........', '.#######.', '.........', '#########', '.........', '.#######.', '.........'],
  sound: ['...#.....', '..##..#..', '#####..#.', '#####.#.#', '#####.#.#', '#####.#.#', '#####..#.', '..##..#..', '...#.....'],
  muted: ['...#.....', '..##.....', '#####....', '#####.#.#', '#####..#.', '#####.#.#', '#####....', '..##.....', '...#.....'],
  full: ['###...###', '#.......#', '#.......#', '.........', '.........', '.........', '#.......#', '#.......#', '###...###'],
  window: ['.........', '.##...##.', '.#.....#.', '.........', '.........', '.........', '.#.....#.', '.##...##.', '.........'],
};

export function icon(name) {
  const rows = ICONS[name];
  let d = '';
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') d += `M${x} ${y}h1v1h-1z`; });
  return `<svg viewBox="0 0 9 9" width="18" height="18" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;
}

const CSS = `
.dock{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px;
 background:var(--chip);border:1px solid var(--line);border-radius:10px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(0,0,0,.35);
 transition:opacity .5s,transform .5s;z-index:5;max-width:calc(100vw - 16px)}
.dock.idle{opacity:0;transform:translateX(-50%) translateY(8px);pointer-events:none}
.dock .sep{width:1px;align-self:stretch;margin:4px 2px;background:var(--line)}
.dock button{all:unset;box-sizing:border-box;cursor:pointer;width:34px;height:34px;display:grid;place-items:center;border-radius:7px;color:var(--ink);opacity:.82;position:relative}
.dock button:hover{background:rgba(255,255,255,.09);opacity:1}
.dock button:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.dock button[aria-pressed="true"]{background:var(--ink);color:#0c1218;opacity:1}
.dock button[data-tip]:hover::after,.dock button[data-tip]:focus-visible::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);white-space:nowrap;
 padding:5px 8px;border-radius:6px;color:var(--ink);background:rgba(8,12,16,.92);border:1px solid var(--line);font-size:10px;letter-spacing:.08em;text-transform:uppercase;pointer-events:none}
.time{display:flex;align-items:center;gap:10px;padding:0 6px 0 4px}
.time .clock{min-width:82px;line-height:1.15;font-variant-numeric:tabular-nums}
.time .clock b{display:block;font-size:13px;font-weight:600;letter-spacing:.06em}
.time .clock span{display:block;font-size:9px;letter-spacing:.16em;text-transform:uppercase;opacity:.62}
input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;margin:0;height:34px;cursor:pointer}
input[type=range]:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:2px;background:var(--track,#444);border:1px solid var(--line)}
input[type=range]::-moz-range-track{height:8px;border-radius:2px;background:var(--track,#444);border:1px solid var(--line)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:18px;margin-top:-6px;background:var(--ink);border:2px solid #0c1218;border-radius:2px}
input[type=range]::-moz-range-thumb{width:6px;height:14px;background:var(--ink);border:2px solid #0c1218;border-radius:2px}
#time{width:min(240px,34vw);--track:linear-gradient(90deg,#070b1c 0%,#101a44 17%,#c0707a 24%,#ffcf8a 28%,#79b9ee 36%,#6ab0ee 54%,#79b9ee 68%,#ff9a5a 78%,#5a4a8a 84%,#101a44 90%,#070b1c 100%)}
.snd{position:relative;display:flex;align-items:center}
.snd .pop{position:absolute;bottom:calc(100% + 12px);left:50%;transform:translateX(-50%) translateY(4px);width:196px;padding:12px;background:rgba(8,12,16,.9);border:1px solid var(--line);border-radius:10px;
 opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.snd:hover .pop,.snd:focus-within .pop,.snd.open .pop{opacity:1;pointer-events:auto;transform:translateX(-50%)}
.snd::before{content:"";position:absolute;left:-20px;right:-20px;bottom:100%;height:16px}
.pop h4{margin:0 0 8px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;opacity:.6;font-weight:500}
.pop .vol{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.pop .vol input{flex:1;min-width:0;--track:linear-gradient(90deg,var(--accent) var(--v,70%),#2a3640 var(--v,70%))}
.meter{display:grid;grid-template-columns:62px 1fr;gap:5px 8px;align-items:center;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
.meter label{opacity:.7}
.seg{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;height:6px}
.seg i{background:rgba(255,255,255,.1)}
.seg i.on{background:var(--accent)}
.pop p{margin:10px 0 0;font-size:9px;line-height:1.5;opacity:.5;letter-spacing:.04em}
.title{position:fixed;left:18px;top:16px;font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.7;text-shadow:0 1px 6px rgba(0,0,0,.6);transition:opacity 1.2s;z-index:4;pointer-events:none}
.title.hide{opacity:0}
.hint{position:fixed;left:50%;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 62px);transform:translateX(-50%);padding:6px 10px;border-radius:6px;background:rgba(8,12,16,.8);border:1px solid var(--line);
 font-size:10px;letter-spacing:.12em;text-transform:uppercase;transition:opacity .6s;z-index:4;pointer-events:none;white-space:nowrap}
.hint.hide{opacity:0}
@media (max-width:640px){.dock{gap:2px;padding:4px}.dock button{width:30px;height:30px}.time .clock{min-width:60px}.time .clock span{display:none}.hide-sm{display:none!important}.title{left:12px}}
@media (hover:none){.dock.idle{opacity:.9;transform:translateX(-50%);pointer-events:auto}}
`;

export function buildUI({ state, audio, onTime, onWeather, onPlay, onSound, onFullscreen }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Living Nature';
  document.body.appendChild(title);
  setTimeout(() => title.classList.add('hide'), 6000);

  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.setAttribute('role', 'toolbar');
  dock.setAttribute('aria-label', 'Scene controls');
  const WX = [['clear', 'Clear'], ['clouds', 'Cloudy'], ['rain', 'Rain'], ['fog', 'Fog']];
  dock.innerHTML = `
    <button id="play" data-tip="Pause (space)" aria-label="Pause" aria-pressed="false">${icon('pause')}</button>
    <span class="sep"></span>
    <div class="time"><div class="clock"><b id="clock">00:00</b><span id="phase">Morning</span></div>
      <input id="time" type="range" min="0" max="24" step="0.02" value="${state.hour}" aria-label="Time of day"></div>
    <span class="sep"></span>
    <div class="wx" role="group" aria-label="Weather" style="display:flex;gap:2px">
      ${WX.map(([k, n]) => `<button data-wx="${k}" data-tip="${n}" aria-label="${n}" aria-pressed="${k === state.weather}">${icon(k === 'clouds' ? 'clouds' : k)}</button>`).join('')}
    </div>
    <span class="sep"></span>
    <div class="snd" id="snd">
      <button id="sound" data-tip="Sound on (m)" aria-label="Turn sound on" aria-pressed="false">${icon('muted')}</button>
      <div class="pop" role="group" aria-label="Sound settings">
        <h4>Volume</h4>
        <div class="vol"><input id="vol" type="range" min="0" max="1" step="0.01" value="${audio.volume}" aria-label="Volume"></div>
        <h4>Living mix</h4>
        <div class="meter">${['birds', 'crickets', 'frogs', 'water', 'wind', 'rain'].map((k) => `<label>${k}</label><div class="seg" data-k="${k}">${'<i></i>'.repeat(10)}</div>`).join('')}</div>
        <p>Sources are placed in the scene. Headphones give the best spatial effect. Move the pointer to look around.</p>
      </div>
    </div>
    <button id="full" class="hide-sm" data-tip="Fullscreen (f)" aria-label="Fullscreen">${icon('full')}</button>`;
  document.body.appendChild(dock);

  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.textContent = 'Click the speaker for ambient sound';
  document.body.appendChild(hint);

  const $ = (s) => dock.querySelector(s);
  const play = $('#play'), time = $('#time'), clock = $('#clock'), phase = $('#phase'), sound = $('#sound'), vol = $('#vol'), full = $('#full'), snd = $('#snd');
  const segs = {};
  dock.querySelectorAll('.seg').forEach((s) => (segs[s.dataset.k] = [...s.children]));
  const setVolFill = () => vol.style.setProperty('--v', vol.value * 100 + '%');
  setVolFill();

  let dragging = false;
  const syncPlay = () => {
    play.innerHTML = icon(state.playing ? 'pause' : 'play');
    play.dataset.tip = state.playing ? 'Pause (space)' : 'Play (space)';
    play.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
    play.setAttribute('aria-pressed', String(!state.playing));
  };
  const syncSound = () => {
    const on = audio.enabled && !audio.muted;
    sound.innerHTML = icon(on ? 'sound' : 'muted');
    sound.setAttribute('aria-pressed', String(on));
    sound.setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
    sound.dataset.tip = on ? 'Mute (m)' : 'Sound on (m)';
    if (on) hint.classList.add('hide');
  };
  const syncWx = () => dock.querySelectorAll('[data-wx]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.wx === state.weather)));

  play.onclick = () => { onPlay(); syncPlay(); };
  time.addEventListener('pointerdown', () => (dragging = true));
  addEventListener('pointerup', () => (dragging = false));
  time.addEventListener('input', () => { onTime(parseFloat(time.value)); });
  dock.querySelectorAll('[data-wx]').forEach((b) => (b.onclick = () => { onWeather(b.dataset.wx); syncWx(); }));
  sound.onclick = async () => { await onSound(); syncSound(); };
  vol.addEventListener('input', () => { audio.setVolume(parseFloat(vol.value)); setVolFill(); if (!audio.enabled) onSound(true).then(syncSound); });
  full.onclick = onFullscreen;
  document.addEventListener('fullscreenchange', () => { full.innerHTML = icon(document.fullscreenElement ? 'window' : 'full'); });

  // auto-hide
  let idleT;
  const wake = () => { dock.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => { if (!dock.matches(':hover, :focus-within')) dock.classList.add('idle'); }, 4200); };
  addEventListener('pointermove', wake); addEventListener('keydown', wake); addEventListener('pointerdown', wake);
  wake();
  setTimeout(() => hint.classList.add('hide'), 14000);

  return {
    syncPlay, syncSound, syncWx,
    update(hour) {
      if (!dragging) time.value = hour;
      clock.textContent = fmtHour(hour);
      phase.textContent = phaseName(hour);
      const L = audio.levels;
      for (const k in segs) {
        const n = Math.round(Math.min(1, L[k] || 0) * 10);
        segs[k].forEach((el, i) => el.classList.toggle('on', i < n));
      }
    },
  };
}
