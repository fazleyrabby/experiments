const ICONS = {
  pause: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
};

const MODE_LABELS = { cinematic: 'Cinematic', chase: 'Chase', mirror: 'Mirror', orbit: 'Orbit' };

export class ControlPanel {
  /**
   * state: { paused, speed, mode, daylight, frame }
   * handlers: { onPause, onSpeed, onMode, onDaylight, onFrame }
   */
  constructor(container, state, handlers) {
    this.state = state;
    this.handlers = handlers;

    const el = (this.el = document.createElement('div'));
    el.className = 'panel';
    el.innerHTML = `
      <button class="panel-toggle" data-role="expand" aria-label="Show controls">${ICONS.sliders}</button>
      <div class="panel-body">
        <div class="panel-row">
          <button class="icon-btn" data-role="pause" aria-label="Pause">${ICONS.pause}</button>
          <label class="slider">
            <span class="slider-label">Speed <output data-role="speedOut"></output></span>
            <input type="range" data-role="speed" min="0" max="6" step="0.1" />
          </label>
          <label class="slider">
            <span class="slider-label">Daylight <output data-role="dayOut"></output></span>
            <input type="range" data-role="daylight" min="0.35" max="1.5" step="0.01" />
          </label>
        </div>
        <div class="panel-row">
          <div class="segmented" role="radiogroup" aria-label="Camera">
            ${Object.entries(MODE_LABELS).map(([k, v]) => `<button role="radio" data-mode="${k}">${v}</button>`).join('')}
          </div>
          <button class="chip" data-role="frame" title="Toggle vertical frame"></button>
          <button class="icon-btn small" data-role="collapse" aria-label="Hide controls">${ICONS.close}</button>
        </div>
      </div>`;
    container.appendChild(el);

    const q = (r) => el.querySelector(`[data-role="${r}"]`);
    this.pauseBtn = q('pause');
    this.speed = q('speed');
    this.speedOut = q('speedOut');
    this.daylight = q('daylight');
    this.dayOut = q('dayOut');
    this.frameBtn = q('frame');
    this.modeBtns = [...el.querySelectorAll('[data-mode]')];

    this.speed.value = state.speed;
    this.daylight.value = state.daylight;

    this.pauseBtn.addEventListener('click', () => handlers.onPause(!this.state.paused));
    this.speed.addEventListener('input', () => handlers.onSpeed(parseFloat(this.speed.value)));
    this.daylight.addEventListener('input', () => handlers.onDaylight(parseFloat(this.daylight.value)));
    this.frameBtn.addEventListener('click', () => handlers.onFrame(this.state.frame === 'portrait' ? 'full' : 'portrait'));
    this.modeBtns.forEach((b) => b.addEventListener('click', () => handlers.onMode(b.dataset.mode)));
    q('collapse').addEventListener('click', () => this.setCollapsed(true));
    q('expand').addEventListener('click', () => this.setCollapsed(false));

    this.sync();
  }

  setCollapsed(v) {
    this.el.classList.toggle('collapsed', v);
  }

  sync() {
    const s = this.state;
    this.pauseBtn.innerHTML = s.paused ? ICONS.play : ICONS.pause;
    this.pauseBtn.setAttribute('aria-label', s.paused ? 'Play' : 'Pause');
    this.speed.value = s.speed;
    this.speedOut.textContent = `${(s.speed * 3.6).toFixed(0)} km/h`;
    this.daylight.value = s.daylight;
    this.dayOut.textContent = `${Math.round(s.daylight * 100)}%`;
    this.frameBtn.textContent = s.frame === 'portrait' ? '9:16' : 'Full';
    this.modeBtns.forEach((b) => {
      const on = b.dataset.mode === s.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on);
    });
  }
}
