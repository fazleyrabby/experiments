// The stag that wanders out of the treeline, and the owl in the near pine.
import { W, RNG, P } from './util.js';
import { Pix } from './pix.js';
import { DEER_Y } from './scene.js';

const D = {
  body: P('#4f3d36'),
  back: P('#8a7c7c'),
  dark: P('#2c2226'),
  far: P('#211a20'),
  white: P('#c8d2e8'),
  ant: P('#a39a94'),
  antF: P('#665e5c'),
  eye: P('#0b0810'),
};

// head: 0 up, 1 down, 2 down + nibble; phase: null = standing
function deerFrame(head, phase, ear) {
  const p = new Pix(42, 36);
  const ox = 10,
    oy = 12;
  const top = oy + 12,
    len = 9;
  const leg = (hx, far, off, front) => {
    const c = far ? D.far : D.dark;
    let dx = 0,
      lift = 0,
      knee = 0;
    if (phase !== null) {
      const a = phase + off;
      dx = Math.sin(a) * 2.3;
      lift = Math.max(0, Math.cos(a)) * 1.7;
      knee = lift > 0.6 ? (front ? -1 : 1) : 0;
    }
    const kx = Math.round(hx + dx * 0.35 + knee);
    p.line(hx, top, kx, top + 4, c);
    p.line(kx, top + 4, Math.round(hx + dx), Math.round(top + len - lift), c);
  };
  leg(ox + 10, true, Math.PI, true);
  leg(ox + 19, true, Math.PI * 0.5, false);
  leg(ox + 8, false, 0, true);
  leg(ox + 21, false, Math.PI * 1.5, false);
  // body
  p.ell(ox + 14, oy + 9, 8, 3.4, D.body);
  p.disc(ox + 8, oy + 9, 3.2, D.body);
  p.disc(ox + 20, oy + 8.6, 3.4, D.body);
  p.hl(ox + 8, ox + 20, oy + 12, D.dark);
  p.hl(ox + 10, ox + 18, oy + 11, D.dark);
  // moonlit back
  for (let x = ox + 5; x <= ox + 23; x++)
    for (let y = oy + 3; y < oy + 10; y++)
      if (p.get(x, y) === D.body) {
        p.set(x, y, D.back);
        break;
      }
  // tail
  p.set(ox + 24, oy + 6, D.white);
  p.set(ox + 24, oy + 7, D.white);
  p.set(ox + 23, oy + 8, D.white);
  if (head === 0) {
    for (let k = 0; k < 3; k++) p.line(ox + 6 + k, oy + 8, ox + 3 + k, oy - 1, k === 2 ? D.back : D.body);
    p.rect(ox + 1, oy - 3, 5, 3, D.body);
    p.rect(ox - 2, oy - 2, 3, 2, D.body);
    p.hl(ox + 1, ox + 5, oy - 4, D.back);
    p.set(ox - 2, oy - 2, D.eye);
    p.set(ox + 2, oy - 2, D.eye);
    p.set(ox + 3, oy + 1, D.white);
    p.set(ox + 3, oy + 2, D.white);
    if (ear) {
      p.set(ox + 6, oy - 4, D.body);
      p.set(ox + 7, oy - 4, D.body);
      p.set(ox + 8, oy - 3, D.body);
    } else {
      p.set(ox + 6, oy - 5, D.body);
      p.set(ox + 7, oy - 6, D.body);
    }
    // antlers
    p.line(ox + 6, oy - 5, ox + 6, oy - 8, D.antF);
    p.line(ox + 6, oy - 8, ox + 8, oy - 11, D.antF);
    p.set(ox + 8, oy - 8, D.antF);
    p.line(ox + 4, oy - 5, ox + 3, oy - 8, D.ant);
    p.line(ox + 3, oy - 8, ox + 5, oy - 11, D.ant);
    p.line(ox + 3, oy - 8, ox + 1, oy - 10, D.ant);
    p.set(ox + 2, oy - 6, D.ant);
  } else {
    const n = head === 2 ? 1 : 0;
    for (let k = 0; k < 3; k++) p.line(ox + 6 + k, oy + 7, ox + 1 + k, oy + 15 + n, k === 2 ? D.back : D.body);
    p.rect(ox - 1, oy + 15 + n, 4, 3, D.body);
    p.rect(ox - 2, oy + 17 + n, 3, 2, D.body);
    p.set(ox, oy + 16 + n, D.eye);
    p.set(ox + 3, oy + 14 + n, D.body);
    p.set(ox + 4, oy + 13 + n, D.body);
    p.line(ox + 2, oy + 14 + n, ox - 1, oy + 11 + n, D.ant);
    p.line(ox - 1, oy + 11 + n, ox - 4, oy + 10 + n, D.ant);
    p.set(ox - 2, oy + 9 + n, D.ant);
    p.line(ox + 3, oy + 13 + n, ox + 1, oy + 10 + n, D.antF);
    p.set(ox, oy + 9 + n, D.antF);
  }
  return p.sprite(ox + 14, oy + 21);
}

export class Deer {
  constructor(onStep) {
    this.onStep = onStep;
    this.rng = new RNG(4242);
    this.state = 'away';
    this.timer = 7;
    this.x = W + 30;
    this.dir = -1;
    this.phase = 0;
    this.head = 0;
    this.ear = false;
    this.cache = new Map();
    this.plan = 0;
    this.act = null;
    this.actT = 0;
    this.leaving = false;
    this.target = 0;
  }
  get visible() {
    return this.state !== 'away';
  }
  summon() {
    if (this.state === 'away') this.timer = 0;
  }
  _frame() {
    const walking = this.state === 'walk';
    const ph = walking ? Math.floor(((this.phase % (Math.PI * 2)) / (Math.PI * 2)) * 8) : -1;
    const key = `${this.head}|${ph}|${this.ear ? 1 : 0}`;
    let f = this.cache.get(key);
    if (!f) {
      f = deerFrame(this.head, ph < 0 ? null : (ph / 8) * Math.PI * 2, this.ear);
      this.cache.set(key, f);
    }
    return f;
  }
  _next() {
    const r = this.rng;
    if (this.plan-- <= 0) return this._leave();
    const k = r.next();
    if (k < 0.45) {
      this.act = 'graze';
      this.actT = r.range(4, 8);
    } else if (k < 0.82) {
      this.act = 'look';
      this.actT = r.range(2.5, 5);
      this.head = 0;
    } else {
      this.act = null;
      this.state = 'walk';
      this.head = 0;
      this.target = Math.max(300, Math.min(396, this.x + r.sign() * r.range(10, 26)));
      this.dir = this.target < this.x ? -1 : 1;
    }
  }
  _leave() {
    this.leaving = true;
    this.state = 'walk';
    this.head = 0;
    this.ear = false;
    this.dir = 1;
    this.target = W + 30;
  }
  update(dt, wind, t) {
    const r = this.rng;
    const calm = wind.speed < 0.6;
    if (this.state === 'away') {
      this.timer -= dt;
      if (this.timer <= 0 && calm) {
        this.state = 'walk';
        this.leaving = false;
        this.dir = -1;
        this.x = W + 26;
        this.target = r.range(308, 392);
        this.plan = r.int(3, 6);
        this.head = 0;
      }
      return;
    }
    if (!calm && !this.leaving) this._leave();
    if (this.state === 'walk') {
      const sp = this.leaving && !calm ? 26 : 10;
      this.x += this.dir * sp * dt;
      const before = Math.floor(this.phase / Math.PI);
      this.phase += dt * (sp > 12 ? 13 : 7.2);
      if (Math.floor(this.phase / Math.PI) !== before && this.onStep) this.onStep(this.x);
      if ((this.dir < 0 && this.x <= this.target) || (this.dir > 0 && this.x >= this.target)) {
        if (this.leaving) {
          this.state = 'away';
          this.timer = r.range(30, 65);
        } else {
          this.state = 'idle';
          this.act = 'look';
          this.actT = r.range(1.5, 3);
        }
      }
      return;
    }
    // idle
    this.actT -= dt;
    if (this.act === 'graze') this.head = Math.sin(t * 5.5) > 0.2 ? 2 : 1;
    else {
      this.head = 0;
      this.ear = (t * 0.7) % 3.1 < 0.22;
    }
    if (this.actT <= 0) this._next();
  }
  draw(g) {
    if (this.state === 'away') return;
    const f = this._frame();
    const x = Math.round(this.x);
    g.fillStyle = 'rgba(22,30,70,0.4)';
    g.fillRect(x - 9, DEER_Y, 16, 1);
    g.fillRect(x - 6, DEER_Y + 1, 10, 1);
    if (this.dir < 0) g.drawImage(f.c, x - f.ox, DEER_Y - f.oy);
    else {
      g.save();
      g.translate(x, 0);
      g.scale(-1, 1);
      g.drawImage(f.c, -f.ox, DEER_Y - f.oy);
      g.restore();
    }
  }
}

// ---------------------------------------------------------------- owl
const OWL = ['.b...b.', '.bbbbb.', '.bbbbb.', 'bblllbb', 'bllwllb', 'blwlwlb', 'bllwllb', '.blllb.', '..f.f..'];
const OC = { b: '#3a3342', l: '#6f6878', w: '#a7a2b6', f: '#c9a25a' };

export class Owl {
  constructor(onHoot) {
    this.onHoot = onHoot;
    this.rng = new RNG(808);
    this.blink = 3;
    this.blinkOn = 0;
    this.look = 0;
    this.lookT = 5;
    this.hootT = 14;
    this.hooting = 0;
  }
  update(dt, wind) {
    const r = this.rng;
    this.blink -= dt;
    this.blinkOn -= dt;
    if (this.blink <= 0) {
      this.blink = r.range(2.5, 7);
      this.blinkOn = 0.16;
    }
    this.lookT -= dt;
    if (this.lookT <= 0) {
      this.lookT = r.range(3, 9);
      this.look = r.pick([-1, 0, 0, 1]);
    }
    this.hooting -= dt;
    this.hootT -= dt;
    if (this.hootT <= 0) {
      this.hootT = r.range(26, 55);
      if (wind.speed < 0.55) {
        this.hooting = 2.7;
        this.onHoot && this.onHoot();
      }
    }
  }
  draw(g, x, y) {
    // x,y = feet
    const x0 = Math.round(x) - 3,
      y0 = Math.round(y) - 8;
    const puff = this.hooting > 0 && Math.sin(this.hooting * 9) > 0 ? 1 : 0;
    for (let r = 0; r < OWL.length; r++)
      for (let c = 0; c < 7; c++) {
        const ch = OWL[r][c];
        if (ch === '.') continue;
        g.fillStyle = OC[ch];
        g.fillRect(x0 + c, y0 + r - (r < 3 ? puff : 0), 1, 1);
      }
    if (puff) {
      g.fillStyle = OC.b;
      g.fillRect(x0 + 1, y0 + 2, 5, 1);
    }
    const ey = y0 + 2 - puff;
    const ex = x0 + 3 + this.look;
    if (this.blinkOn > 0) {
      g.fillStyle = '#1c1722';
      g.fillRect(ex - 1, ey, 1, 1);
      g.fillRect(ex + 1, ey, 1, 1);
    } else {
      g.fillStyle = '#ffd648';
      g.fillRect(ex - 1, ey, 1, 1);
      g.fillRect(ex + 1, ey, 1, 1);
    }
    g.fillStyle = OC.f;
    g.fillRect(ex, ey + 1, 1, 1);
  }
}
