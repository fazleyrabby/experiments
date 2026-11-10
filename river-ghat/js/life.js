// Everything that moves: boats, people, birds, ripples, splashes and smoke.
import { W, H, TAU, RNG, clamp, lerp, smooth, bayer } from './util.js';
import { HZ, WL, ST, stepTop, stepX, PERCHES } from './scene.js';
import { MAN_A, MAN_B, SHOP, WASHER, KID, FISHER, ROWER, RIDERS, CROW, CROW_FLY, makeNouka, makeFerry, makeSail } from './sprites.js';

// draw rows of a sprite above its waterline mirrored below it, with a gentle wobble
export function reflect(g, cv, x, y, wl, t, alpha = 0.45, flip = false) {
  const n = Math.min(cv.height, wl - y);
  if (n <= 0) return;
  g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const sy = wl - 1 - i - y;
    if (sy < 0) break;
    const dy = wl + i;
    const off = Math.round(Math.sin(dy * 0.7 + t * 2.2) * (0.5 + i * 0.05));
    if (flip) {
      g.save();
      g.translate(Math.round(x) + cv.width + off, 0);
      g.scale(-1, 1);
      g.drawImage(cv, 0, sy, cv.width, 1, 0, dy, cv.width, 1);
      g.restore();
    } else g.drawImage(cv, 0, sy, cv.width, 1, Math.round(x) + off, dy, cv.width, 1);
  }
  g.globalAlpha = 1;
}
function blit(g, cv, x, y, flip = false) {
  if (!flip) return g.drawImage(cv, Math.round(x), Math.round(y));
  g.save();
  g.translate(Math.round(x) + cv.width, Math.round(y));
  g.scale(-1, 1);
  g.drawImage(cv, 0, 0);
  g.restore();
}

// ---------------------------------------------------------------- ripples & splashes
export class Ripples {
  constructor() {
    this.r = [];
  }
  spawn(x, y, max = 8, life = 1.4, a = 0.8) {
    if (this.r.length < 90) this.r.push({ x, y, max, life, a, age: 0 });
  }
  update(dt) {
    for (const r of this.r) r.age += dt;
    this.r = this.r.filter((r) => r.age < r.life);
  }
  draw(g, col) {
    g.fillStyle = col;
    for (const r of this.r) {
      const k = r.age / r.life;
      const rad = 1 + r.max * Math.pow(k, 0.6);
      const a = r.a * (1 - k);
      const ry = rad * 0.28;
      const n = Math.max(10, Math.round(rad * 4));
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU;
        const px = Math.round(r.x + Math.cos(ang) * rad),
          py = Math.round(r.y + Math.sin(ang) * ry);
        if (bayer(px, py) > a) continue;
        g.fillRect(px, py, 1, 1);
      }
    }
  }
}

export class Splashes {
  constructor() {
    this.p = [];
  }
  burst(x, y, n = 8, power = 1) {
    for (let i = 0; i < n; i++) this.p.push({ x: x + (Math.random() - 0.5) * 4, y, vx: (Math.random() - 0.5) * 30 * power, vy: -(20 + Math.random() * 40) * power, floor: y + Math.random() * 2, age: 0 });
  }
  update(dt) {
    for (const p of this.p) {
      p.age += dt;
      p.vy += 140 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.p = this.p.filter((p) => p.y < p.floor || p.vy < 0);
  }
  draw(g, col) {
    g.fillStyle = col;
    for (const p of this.p) g.fillRect(p.x | 0, p.y | 0, 1, 1);
  }
}

// ---------------------------------------------------------------- smoke / steam
export class Smoke {
  constructor(x, y, o) {
    this.x = x;
    this.y = y;
    this.o = o; // { rate, rise, size, life, drift }
    this.p = [];
    this.acc = 0;
  }
  update(dt, wind, on = 1) {
    this.acc += dt * this.o.rate * on;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.p.push({ x: this.x + (Math.random() - 0.5) * 2, y: this.y, vx: (Math.random() - 0.5) * 2, vy: -this.o.rise * (0.7 + Math.random() * 0.5), age: 0, life: this.o.life * (0.8 + Math.random() * 0.4), ph: Math.random() * 9 });
    }
    for (const q of this.p) {
      q.age += dt;
      q.vx += (this.o.drift * (0.6 + wind) - q.vx) * dt * 0.5;
      q.vy *= 1 - dt * 0.25;
      q.x += (q.vx + Math.sin(q.age * 1.3 + q.ph) * 1.2) * dt;
      q.y += q.vy * dt;
    }
    while (this.p.length && this.p[0].age > this.p[0].life) this.p.shift();
  }
  draw(g, rgb, alpha = 1) {
    for (const q of this.p) {
      const k = q.age / q.life;
      const r = Math.max(0, Math.round(this.o.size * (0.3 + k)));
      const a = (1 - k) * this.o.a * alpha;
      g.fillStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a.toFixed(3)})`;
      const cx = Math.round(q.x),
        cy = Math.round(q.y);
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.floor(Math.sqrt(r * r + 0.5 - dy * dy));
        g.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
      }
    }
  }
}

// ---------------------------------------------------------------- river launch
export class Ferry {
  constructor(hooks) {
    this.s = makeFerry();
    this.hooks = hooks;
    this.dir = -1;
    this.x = W + 40;
    this.wait = 6;
    this.wl = 136;
    this.honked = false;
    this.smoke = new Smoke(0, 0, { rate: 5, rise: 6, size: 2.2, life: 5, drift: 5, a: 0.55 });
    this.wake = [];
  }
  get active() {
    return this.wait <= 0;
  }
  summon() {
    if (this.wait > 1) this.wait = 0.5;
    else if (this.active) this.hooks.onHorn && this.hooks.onHorn(this.x);
  }
  update(dt, t, wind) {
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.x = this.dir < 0 ? W + 20 : -this.s.w - 20;
        this.honked = false;
      }
    } else {
      this.x += this.dir * 9 * dt;
      const cx = this.x + this.s.w / 2;
      if (!this.honked && cx > 60 && cx < W - 60) {
        this.honked = true;
        this.hooks.onHorn && this.hooks.onHorn(cx);
      }
      if ((this.dir < 0 && this.x < -this.s.w - 30) || (this.dir > 0 && this.x > W + 30)) {
        this.wait = 26 + Math.random() * 20;
        this.dir *= -1;
      }
    }
    const fx = this.dir < 0 ? this.x + this.s.funnel.x : this.x + this.s.w - this.s.funnel.x;
    this.smoke.x = fx;
    this.smoke.y = this.wl - this.s.wl + this.s.funnel.y;
    this.smoke.o.drift = 4 - this.dir * 4;
    this.smoke.update(dt, wind, this.active ? 1 : 0);
    this.bob = Math.round(Math.sin(t * 1.3) * 0.6);
  }
  draw(g, t) {
    if (!this.active) return;
    const y = this.wl - this.s.wl + this.bob;
    reflect(g, this.s.c, this.x, y, this.wl, t, 0.4, this.dir > 0);
    // wake behind the stern
    g.fillStyle = 'rgba(236,238,236,0.6)';
    const stern = this.dir < 0 ? this.x + this.s.w - 4 : this.x + 4;
    for (let i = 0; i < 26; i++) {
      const xx = stern - this.dir * i * 2,
        sp = i * 0.18;
      if ((i + Math.floor(t * 6)) % 3 === 0) continue;
      g.fillRect(Math.round(xx), Math.round(this.wl + 1 + sp), 2, 1);
      g.fillRect(Math.round(xx), Math.round(this.wl - 0 - sp * 0.2), 1, 1);
    }
    const bow = this.dir < 0 ? this.x + 2 : this.x + this.s.w - 4;
    g.fillRect(Math.round(bow - this.dir * 2), this.wl, 3, 1);
    blit(g, this.s.c, this.x, y, this.dir > 0);
  }
  lights() {
    if (!this.active) return [];
    const y = this.wl - this.s.wl + this.bob;
    return this.s.windows.map(([wx, wy]) => [this.dir < 0 ? this.x + wx : this.x + this.s.w - 1 - wx, y + wy]);
  }
}

// ---------------------------------------------------------------- distant sail boat
export class Sailboat {
  constructor() {
    this.s = makeSail();
    this.x = 150;
    this.wl = 127;
  }
  update(dt) {
    this.x += 2.6 * dt;
    if (this.x > W + 60) this.x = -120;
  }
  draw(g, t) {
    const bob = Math.round(Math.sin(t * 1.1 + 2) * 0.5);
    const hy = this.wl - this.s.hull.wl + bob;
    const sy = hy + this.s.hull.wl - this.s.wl - 2;
    reflect(g, this.s.c, this.x, sy, this.wl, t, 0.3);
    reflect(g, this.s.hull.c, this.x + 2, hy, this.wl, t, 0.3);
    blit(g, this.s.c, this.x, sy);
    blit(g, this.s.hull.c, this.x + 2, hy);
    blit(g, ROWER, this.x + 27, hy - 7);
  }
}

// ---------------------------------------------------------------- fisherman casting a net
export class Fisher {
  constructor(hooks) {
    this.hooks = hooks;
    this.boat = makeNouka(28, { h: 6, band: '#3a6a8a' });
    this.x = 296;
    this.wl = 174;
    this.t = 0;
    this.cycle = 13;
    this.net = null;
  }
  update(dt) {
    const prev = this.t;
    this.t = (this.t + dt) % this.cycle;
    const c = this.t;
    if (prev < 4.6 && c >= 4.6) this.net = { age: 0, x0: this.x + 16, y0: this.wl - 12, x1: this.x + 50, y1: this.wl + 2, landed: false };
    if (this.net) {
      const n = this.net;
      n.age += dt;
      if (!n.landed && n.age >= 0.8) {
        n.landed = true;
        this.hooks.onNet && this.hooks.onNet(n.x1, n.y1);
      }
      if (n.age > 6.5) this.net = null;
    }
  }
  pose() {
    const c = this.t;
    if (c < 3.8) return FISHER.idle;
    if (c < 4.6) return FISHER.wind;
    if (c < 5.6) return FISHER.throw;
    if (c > 7.4 && c < 11.5) return Math.floor(c * 2) % 2 ? FISHER.pull : FISHER.idle;
    return FISHER.idle;
  }
  draw(g, t) {
    const bob = Math.round(Math.sin(t * 1.6) * 0.7);
    const by = this.wl - this.boat.wl + bob;
    const fig = this.pose();
    reflect(g, this.boat.c, this.x, by, this.wl, t, 0.4);
    reflect(g, fig, this.x + 12, by + this.boat.wl - 13, this.wl, t, 0.35);
    blit(g, fig, this.x + 12, by + this.boat.wl - 13);
    blit(g, this.boat.c, this.x, by);
    // net in flight, then lying on the water, then hauled in
    const n = this.net;
    if (n) {
      g.fillStyle = 'rgba(214,206,186,0.9)';
      if (!n.landed) {
        const k = n.age / 0.8;
        const cx = lerp(n.x0, n.x1, k),
          cy = lerp(n.y0, n.y1, k) - Math.sin(k * Math.PI) * 10;
        const rx = 1 + k * 8,
          ry = 1 + k * 2.2;
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * TAU;
          g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
        }
      } else {
        const k = clamp((n.age - 0.8) / 2.5, 0, 1);
        const pull = clamp((n.age - 3.2) / 3.3, 0, 1);
        const cx = lerp(n.x1, this.x + 20, pull),
          a = (1 - k * 0.6) * (1 - pull);
        g.fillStyle = `rgba(214,206,186,${(0.85 * a + 0.15).toFixed(2)})`;
        const rx = 9 * (1 - pull * 0.8),
          ry = 2.2 * (1 - pull * 0.6);
        for (let i = 0; i < 22; i++) {
          const ang = (i / 22) * TAU;
          if ((i + Math.floor(n.age * 4)) % 4 === 0) continue;
          g.fillRect(Math.round(cx + Math.cos(ang) * rx), Math.round(n.y1 + Math.sin(ang) * ry), 1, 1);
        }
        // rope back to the boat
        g.fillStyle = 'rgba(200,190,170,0.7)';
        const hx = this.x + 17,
          hy = by + this.boat.wl - 9;
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          g.fillRect(Math.round(lerp(hx, cx, u)), Math.round(lerp(hy, n.y1, u) + Math.sin(u * Math.PI) * 2), 1, 1);
        }
      }
    }
  }
  lantern() {
    return [this.x + 6, this.wl - this.boat.wl + this.boat.wl - 3];
  }
}

// ---------------------------------------------------------------- crossing boat (kheya)
export class Kheya {
  constructor(hooks) {
    this.hooks = hooks;
    this.boat = makeNouka(44, { h: 9, band: '#3a8a5a' });
    this.x = -60;
    this.wl = 200;
    this.dir = 1;
    this.wait = 3;
    this.ph = 0;
  }
  update(dt) {
    if (this.wait > 0) {
      this.wait -= dt;
      return;
    }
    const stroke = 0.5 + 0.5 * Math.sin(this.ph);
    this.x += this.dir * (3 + 5 * stroke) * dt;
    const before = Math.floor(this.ph / TAU);
    this.ph += dt * 2.6;
    if (Math.floor(this.ph / TAU) !== before) this.hooks.onOar && this.hooks.onOar(this.x + 22, this.wl);
    if ((this.dir > 0 && this.x > W + 20) || (this.dir < 0 && this.x < -70)) {
      this.dir *= -1;
      this.wait = 18 + Math.random() * 16;
    }
  }
  draw(g, t) {
    if (this.wait > 0 && (this.x < -50 || this.x > W)) return;
    const bob = Math.round(Math.sin(t * 1.4 + 1) * 0.7);
    const by = this.wl - this.boat.wl + bob;
    const f = this.dir < 0;
    const sternX = f ? this.x + 36 : this.x + 4;
    const ry = by + this.boat.wl - 13;
    reflect(g, this.boat.c, this.x, by, this.wl, t, 0.42, f);
    blit(g, this.boat.c, this.x, by, f);
    RIDERS.forEach((r, i) => blit(g, r, this.x + 14 + i * 7, by + this.boat.wl - 7, f));
    blit(g, ROWER, sternX, ry, f);
    // the long oar sweeping behind
    const a = Math.sin(this.ph) * 0.5;
    const hx = sternX + 2,
      hy = ry + 4;
    const ox = hx - this.dir * (10 + a * 6),
      oy = this.wl + 2 - Math.max(0, a) * 2;
    g.strokeStyle = 'transparent';
    g.fillStyle = '#4a3a2a';
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      g.fillRect(Math.round(lerp(hx, ox, u)), Math.round(lerp(hy, oy, u)), 1, 1);
    }
  }
}

// ---------------------------------------------------------------- moored boats
export class Moored {
  constructor() {
    this.big = makeNouka(92, { h: 18, hood: true, band: '#b8402c' });
    this.small = makeNouka(52, { h: 11, band: '#2a6a8a' });
    this.boats = [
      { s: this.big, x: 236, wl: 244, ph: 0, sp: 1.1, pole: [235, 200] },
      { s: this.small, x: 342, wl: 218, ph: 2, sp: 1.4, pole: [339, 205] },
    ];
  }
  pos(b, t) {
    return { y: b.wl - b.s.wl + Math.round(Math.sin(t * b.sp + b.ph) * 0.8), x: b.x + Math.round(Math.sin(t * 0.4 + b.ph) * 1.2) };
  }
  reflections(g, t) {
    for (const b of this.boats) {
      const p = this.pos(b, t);
      reflect(g, b.s.c, p.x, p.y, b.wl, t, 0.42);
    }
  }
  draw(g, t) {
    for (const b of this.boats) {
      const p = this.pos(b, t);
      blit(g, b.s.c, p.x, p.y);
      // rope to the pole
      g.fillStyle = '#8a7a5a';
      const bx = p.x + 3,
        byy = p.y + b.s.wl - 6;
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        g.fillRect(Math.round(lerp(b.pole[0], bx, u)), Math.round(lerp(b.pole[1], byy, u) + Math.sin(u * Math.PI) * 1.5), 1, 1);
      }
    }
  }
}

// ---------------------------------------------------------------- people at the ghat
export class People {
  constructor(hooks) {
    this.hooks = hooks;
    this.sipT = 3;
    this.sip = 0;
    this.paper = 0;
    this.paperT = 9;
    this.stir = 0;
    this.stirT = 6;
    this.wash = 0;
    this.washT = 0;
    this.kid = { st: 'stand', t: 2, x: stepX(4) + 5, y: stepTop(4) - 10 };
  }
  update(dt, hour) {
    // tea
    this.sipT -= dt;
    if (this.sipT <= 0) {
      this.sip = 1.6;
      this.sipT = 5 + Math.random() * 6;
    }
    this.sip -= dt;
    this.paperT -= dt;
    if (this.paperT <= 0) {
      this.paper = 0.5;
      this.paperT = 7 + Math.random() * 8;
    }
    this.paper -= dt;
    this.stirT -= dt;
    if (this.stirT <= 0) {
      this.stir = 2.4;
      this.stirT = 6 + Math.random() * 8;
    }
    if (this.stir > 0) {
      const b = Math.floor(this.stir * 5);
      this.stir -= dt;
      if (Math.floor(this.stir * 5) !== b && b % 2 === 0) this.hooks.onClink && this.hooks.onClink();
    }
    // washing: lift, slam, lift, slam ... then rinse
    this.washing = hour > 5.9;
    if (this.washing) {
      const b = this.washT;
      this.washT += dt;
      const per = 1.3;
      if (this.washT % 9 < 6.5 && Math.floor(b / per) !== Math.floor(this.washT / per)) {
        this.hooks.onSlap && this.hooks.onSlap(stepX(8) + 9, stepTop(8) - 1);
      }
    }
    this.jumping = hour > 6.45;
    this._kid(dt);
  }
  _kid(dt) {
    const k = this.kid;
    k.t -= dt;
    const sx = stepX(4) + 5,
      sy = stepTop(4) - 10;
    if (!this.jumping) {
      k.st = 'away';
      return;
    }
    if (k.st === 'away') {
      k.st = 'stand';
      k.t = 2;
    }
    if (k.st === 'stand' && k.t <= 0) {
      k.st = 'crouch';
      k.t = 0.45;
    } else if (k.st === 'crouch' && k.t <= 0) {
      k.st = 'air';
      k.t = 0.75;
      k.age = 0;
    } else if (k.st === 'air') {
      k.age += dt;
      const u = clamp(k.age / 0.75, 0, 1);
      k.x = lerp(sx, 204, u);
      k.y = lerp(sy, 222, u) - Math.sin(u * Math.PI) * 14;
      if (u >= 1) {
        k.st = 'under';
        k.t = 0.7;
        this.hooks.onJump && this.hooks.onJump(206, 230);
      }
    } else if (k.st === 'under' && k.t <= 0) {
      k.st = 'swim';
      k.t = 4.2;
      k.x = 207;
      k.y = 229;
    } else if (k.st === 'swim') {
      k.x -= 3.2 * dt;
      k.y -= 0.2 * dt;
      k.ph = (k.ph || 0) + dt * 4;
      if (Math.random() < dt * 2) this.hooks.onSwim && this.hooks.onSwim(k.x + 2, k.y + 1);
      if (k.t <= 0) {
        k.st = 'out';
        k.t = 3;
      }
    } else if (k.st === 'out' && k.t <= 0) {
      k.st = 'stand';
      k.t = 2.5 + Math.random() * 3;
      k.x = sx;
      k.y = sy;
    }
  }
  drawBack(g) {
    // shopkeeper shows above the counter only
    g.save();
    g.beginPath();
    g.rect(0, 0, 120, 156);
    g.clip();
    blit(g, SHOP[this.stir > 0 && Math.floor(this.stir * 5) % 2 ? 1 : 0], 26, 140);
    g.restore();
  }
  draw(g) {
    blit(g, MAN_A[this.sip > 0 && this.sip < 1.3 ? 1 : 0], 67, 151);
    blit(g, MAN_B[this.paper > 0 ? 2 : this.sip > 1 ? 1 : 0], 81, 151);
    if (this.washing) {
      const c = this.washT % 9;
      let f = 0;
      if (c < 6.5) f = (this.washT % 1.3) / 1.3 < 0.55 ? 0 : 1;
      else f = 2;
      blit(g, WASHER[f], stepX(8) - 1, stepTop(8) - 11);
    }
    const k = this.kid;
    if (k.st === 'stand') blit(g, KID.stand, k.x, k.y);
    else if (k.st === 'crouch') blit(g, KID.crouch, k.x, k.y);
    else if (k.st === 'air') blit(g, KID.air, k.x, k.y);
    else if (k.st === 'swim') blit(g, Math.floor(k.ph) % 2 ? KID.swimA : KID.swimB, k.x, k.y);
  }
}

// ---------------------------------------------------------------- crows in the banyan
export class Crows {
  constructor(hooks) {
    this.hooks = hooks;
    this.c = [
      { at: 0, t: 3, f: 0, fly: null },
      { at: 1, t: 6, f: 0, fly: null },
    ];
  }
  update(dt, hour) {
    for (const c of this.c) {
      c.t -= dt;
      if (c.fly) {
        const F = c.fly;
        F.age += dt;
        const u = clamp(F.age / F.dur, 0, 1);
        c.x = lerp(F.a.x, F.b.x, u);
        c.y = lerp(F.a.y, F.b.y, u) - Math.sin(u * Math.PI) * 14;
        if (u >= 1) {
          c.at = F.to;
          c.fly = null;
        }
        continue;
      }
      const p = PERCHES[c.at];
      c.x = p.x - 2;
      c.y = p.y - 5;
      if (c.t <= 0) {
        const r = Math.random();
        if (r < 0.45) {
          c.f = 1;
          this.hooks.onCaw && this.hooks.onCaw(c.x, hour < 7 ? 3 : 2);
          c.t = 0.9;
        } else if (r < 0.7) {
          const opts = [0, 1, 2].filter((i) => i !== c.at && !this.c.some((o) => o !== c && o.at === i));
          if (opts.length) {
            const to = opts[Math.floor(Math.random() * opts.length)];
            const b = PERCHES[to];
            c.fly = { a: { x: c.x, y: c.y }, b: { x: b.x - 2, y: b.y - 5 }, age: 0, dur: 1.6, to };
          }
          c.t = 4 + Math.random() * 5;
        } else {
          c.f = 0;
          c.t = 2 + Math.random() * 5;
        }
      }
      if (c.t < 0.4) c.f = 0;
    }
  }
  draw(g, t) {
    for (const c of this.c) {
      if (c.fly) g.drawImage(CROW_FLY[Math.floor(t * 8) % 2], Math.round(c.x), Math.round(c.y));
      else {
        const left = c.fly == null && c.at === 0;
        g.save();
        if (left) {
          g.translate(Math.round(c.x) + 5, Math.round(c.y));
          g.scale(-1, 1);
          g.drawImage(CROW[c.f], 0, 0);
        } else g.drawImage(CROW[c.f], Math.round(c.x), Math.round(c.y));
        g.restore();
      }
    }
  }
}

// ---------------------------------------------------------------- birds crossing the sky
export class Flock {
  constructor() {
    this.b = [];
    this.t = 8;
  }
  update(dt, hour) {
    this.t -= dt;
    if (this.t <= 0 && hour > 5.6 && !this.b.length) {
      this.t = 22 + Math.random() * 25;
      const n = 5 + Math.floor(Math.random() * 5),
        y = 30 + Math.random() * 50,
        dir = Math.random() < 0.6 ? -1 : 1;
      for (let i = 0; i < n; i++) this.b.push({ x: (dir < 0 ? W + 10 : -10) - dir * (Math.abs(i - n / 2) * 6 + Math.random() * 3), y: y + Math.abs(i - n / 2) * 3 + Math.random() * 2, dir, ph: Math.random() * 6, sp: 18 + Math.random() * 3 });
    }
    for (const b of this.b) {
      b.x += b.dir * b.sp * dt;
      b.y += Math.sin(b.ph + b.x * 0.05) * 0.1;
    }
    this.b = this.b.filter((b) => b.x > -30 && b.x < W + 30);
  }
  draw(g, t, col) {
    g.fillStyle = col;
    for (const b of this.b) {
      const up = Math.sin(t * 9 + b.ph) > 0;
      const x = Math.round(b.x),
        y = Math.round(b.y);
      g.fillRect(x, y, 1, 1);
      if (up) {
        g.fillRect(x - 1, y - 1, 1, 1);
        g.fillRect(x + 1, y - 1, 1, 1);
      } else {
        g.fillRect(x - 1, y, 1, 1);
        g.fillRect(x + 1, y, 1, 1);
      }
    }
  }
}
