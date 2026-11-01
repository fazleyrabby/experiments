import type { CamMode } from './camera';

export interface HudActions {
  togglePause(): void;
  cycleCamera(): void;
  setCamera(m: CamMode): void;
  speed(delta: number): void;
  toggleSound(): void;
  whistle(on: boolean): void;
  replay(): void;
  toggleFullscreen(): void;
  toggleQuality(): void;
}

const ICONS: Record<string, string> = {
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2h6.8L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  whistle: '<svg viewBox="0 0 24 24"><path d="M6 16V9.5C6 7 8 6 10 6h4.2c2 0 3.8 1.2 3.8 3.4V16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 16h14M9 19c0 1.5 1.2 2.5 3 2.5s3-1 3-2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  replay: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 107-7H8.5M8.5 2.8L5.5 5.5 8.5 8.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const MODE_LABEL: Record<CamMode, string> = { cinematic: 'Cinematic', orbit: 'Orbit', follow: 'Follow train' };

const CAPTIONS: [number, number, string, string][] = [
  [1.2, 8.2, 'Glen Dessary', 'Western Highlands · 1894'],
  [12, 19.5, 'No. 17 “Glen Affric”', 'Highland Railway 4-6-2 · 6 ft 4 in drivers'],
  [24, 31.5, 'Walschaerts valve gear', 'Every rod driven from the wheel angle'],
  [35, 45, 'Nine arches, 168 metres', 'Dressed granite · 38 metres above the river'],
  [62, 72, 'The Highland Express', 'Drag the view to take control'],
];

export class Hud {
  private root: HTMLElement;
  private bar: HTMLElement;
  private cap: HTMLElement;
  private speedEl!: HTMLElement;
  private camBtn!: HTMLButtonElement;
  private camLabel!: HTMLElement;
  private pauseBtn!: HTMLButtonElement;
  private soundBtn!: HTMLButtonElement;
  private fullBtn!: HTMLButtonElement;
  private qualBtn!: HTMLButtonElement;
  private hideT = 0;
  private hidden = false;
  private whistleDown = false;
  private statEl!: HTMLElement;

  constructor(private act: HudActions) {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div class="hud-title"><span class="t1">Highland Express</span><span class="t2" id="hud-status">Glen Dessary Viaduct</span></div>
      <div class="hud-cap" id="hud-cap"><div class="c1"></div><div class="c2"></div></div>
      <div class="hud-stat"><span id="hud-fps"></span></div>
      <div class="hud-bar" id="hud-bar">
        <button id="b-pause" title="Pause / resume (Space)"></button>
        <span class="sep"></span>
        <button id="b-cam" title="Camera mode (C)"></button><span class="camlabel" id="b-camlabel">Cinematic</span>
        <span class="sep"></span>
        <button id="b-slow" title="Slower (−)"></button>
        <span class="speed" id="b-speed">0<small> km/h</small></span>
        <button id="b-fast" title="Faster (+)"></button>
        <span class="sep"></span>
        <button id="b-whistle" title="Hold to blow the whistle (W)"></button>
        <button id="b-sound" title="Sound (M)"></button>
        <button id="b-qual" title="Graphics quality (Q)"><span class="qlabel">HI</span></button>
        <button id="b-full" title="Fullscreen (X)"></button>
        <button id="b-replay" title="Replay the opening sequence (R)"></button>
      </div>`;
    document.body.appendChild(this.root);
    this.bar = this.root.querySelector('#hud-bar') as HTMLElement;
    this.cap = this.root.querySelector('#hud-cap') as HTMLElement;
    this.speedEl = this.root.querySelector('#b-speed') as HTMLElement;
    this.camLabel = this.root.querySelector('#b-camlabel') as HTMLElement;
    this.statEl = this.root.querySelector('#hud-fps') as HTMLElement;
    const q = (id: string) => this.root.querySelector(id) as HTMLButtonElement;
    this.pauseBtn = q('#b-pause');
    this.camBtn = q('#b-cam');
    this.soundBtn = q('#b-sound');
    this.fullBtn = q('#b-full');
    this.qualBtn = q('#b-qual');
    this.pauseBtn.innerHTML = ICONS.pause;
    this.camBtn.innerHTML = ICONS.cam;
    q('#b-slow').innerHTML = ICONS.minus;
    q('#b-fast').innerHTML = ICONS.plus;
    q('#b-whistle').innerHTML = ICONS.whistle;
    this.soundBtn.innerHTML = ICONS.mute;
    this.fullBtn.innerHTML = ICONS.full;
    q('#b-replay').innerHTML = ICONS.replay;

    this.pauseBtn.onclick = () => act.togglePause();
    this.camBtn.onclick = () => act.cycleCamera();
    q('#b-slow').onclick = () => act.speed(-1);
    q('#b-fast').onclick = () => act.speed(1);
    this.soundBtn.onclick = () => act.toggleSound();
    this.fullBtn.onclick = () => act.toggleFullscreen();
    this.qualBtn.onclick = () => act.toggleQuality();
    q('#b-replay').onclick = () => act.replay();
    const wb = q('#b-whistle');
    const wOn = (e: Event) => { e.preventDefault(); act.whistle(true); wb.classList.add('on'); };
    const wOff = () => { act.whistle(false); wb.classList.remove('on'); };
    wb.addEventListener('pointerdown', wOn);
    window.addEventListener('pointerup', wOff);

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); act.togglePause(); break;
        case 'KeyC': act.cycleCamera(); break;
        case 'KeyF': act.setCamera('follow'); break;
        case 'KeyO': act.setCamera('orbit'); break;
        case 'KeyM': act.toggleSound(); break;
        case 'KeyW':
          if (!this.whistleDown) { this.whistleDown = true; act.whistle(true); wb.classList.add('on'); }
          break;
        case 'KeyR': act.replay(); break;
        case 'KeyX': act.toggleFullscreen(); break;
        case 'KeyQ': act.toggleQuality(); break;
        case 'Equal': case 'NumpadAdd': act.speed(1); break;
        case 'Minus': case 'NumpadSubtract': act.speed(-1); break;
        case 'KeyH': this.toggleHidden(); break;
      }
      this.wake();
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW') { this.whistleDown = false; act.whistle(false); wb.classList.remove('on'); }
    });
    window.addEventListener('pointermove', () => this.wake());
    window.addEventListener('pointerdown', () => this.wake());
  }

  setQuality(t: 'high' | 'lite') {
    (this.qualBtn.querySelector('.qlabel') as HTMLElement).textContent = t === 'high' ? 'HI' : 'LITE';
    this.qualBtn.classList.toggle('on', t === 'lite');
  }

  destroy() {
    this.root.remove();
  }

  private toggleHidden() {
    this.hidden = !this.hidden;
    this.root.classList.toggle('off', this.hidden);
  }

  private wake() {
    this.hideT = 0;
    this.bar.classList.remove('idle');
  }

  setPaused(p: boolean) {
    this.pauseBtn.innerHTML = p ? ICONS.play : ICONS.pause;
    this.pauseBtn.classList.toggle('on', p);
  }

  setMode(m: CamMode) {
    this.camLabel.textContent = MODE_LABEL[m];
  }

  setSound(on: boolean) {
    this.soundBtn.innerHTML = on ? ICONS.sound : ICONS.mute;
    this.soundBtn.classList.toggle('on', on);
  }

  update(dt: number, speedKmh: number, introT: number | null, fps: number) {
    this.hideT += dt;
    if (this.hideT > 6) this.bar.classList.add('idle');
    this.speedEl.innerHTML = `${Math.round(speedKmh)}<small> km/h</small>`;
    this.statEl.textContent = `${Math.round(fps)} fps`;
    if (introT !== null) {
      let shown = false;
      for (const [a, b, h, s] of CAPTIONS) {
        if (introT >= a && introT <= b) {
          const k = Math.min(1, (introT - a) / 0.9, (b - introT) / 0.9);
          this.cap.style.opacity = String(Math.max(0, k));
          this.cap.style.transform = `translateY(${(1 - Math.max(0, Math.min(1, k))) * 8}px)`;
          (this.cap.children[0] as HTMLElement).textContent = h;
          (this.cap.children[1] as HTMLElement).textContent = s;
          shown = true;
          break;
        }
      }
      if (!shown) this.cap.style.opacity = '0';
    } else {
      this.cap.style.opacity = '0';
    }
  }
}
