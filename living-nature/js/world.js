// Living things and weather: clouds, birds, butterflies, fish, frogs, fireflies, leaves, smoke, rain, mist.
import { W, H, M, HOR, Rng, PX, makeNoise, makeCanvas, tintInto, clamp, lerp, smooth, css, hex, mixc, bay } from './util.js';
import { makeCloud, makeWisp } from './art.js';
import { makeBirdFrames, makeButterflyFrames, makeFishFrames, makeFrogFrames, makeLeafFrames, CABIN } from './art2.js';
import { Sprite } from './layout.js';
import { isLake, nearY, CABIN_POS, STREAM } from './geometry.js';

export function windAt(t, rain = 0) {
  const g = 0.5 + 0.28 * Math.sin(t * 0.23) + 0.18 * Math.sin(t * 0.61 + 1.7) + 0.12 * Math.sin(t * 1.7 + 0.4);
  return clamp(g * 0.7 + rain * 0.22, 0, 1);
}

const hash = (a, b = 0) => {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export { hash };

// A cloud-like sprite tinted by one colour (no haze variants).
class Tinted {
  constructor(cv) {
    this.src = cv;
    this.w = cv.width;
    this.h = cv.height;
    this.out = makeCanvas(cv.width, cv.height);
    this.out.getContext('2d').drawImage(cv, 0, 0);
  }
  retint(c, hazeC = null, hazeA = 0) {
    tintInto(this.out, this.src, c, hazeC || c, hazeA);
  }
}

// ---------------- sky: stars + clouds ----------------
export class Sky {
  constructor() {
    const r = new Rng(88);
    this.stars = Array.from({ length: 130 }, () => ({
      x: r.range(0, W), y: r.range(0, HOR - 12) ** 1 * (r.next() * 0.6 + 0.4) * 1, ph: r.range(0, 6.28), sp: r.range(0.6, 2.6),
      big: r.chance(0.1), c: r.pick(['#ffffff', '#cfe0ff', '#fff2cc', '#ffffff']),
    }));
    this.clouds = [];
    const sizes = [[110, 32], [84, 26], [132, 36], [62, 20], [96, 30], [48, 16], [118, 34], [72, 22], [90, 28], [56, 18], [104, 30], [76, 24], [124, 34], [66, 20]];
    sizes.forEach(([w, h], i) => {
      this.clouds.push({
        sp: new Tinted(makeCloud(300 + i, w, h)), x: r.range(-40, W + 20), y: r.range(8, 88) * (h > 28 ? 0.8 : 1),
        spd: r.range(1.2, 3.8) * (h / 26), thresh: i / sizes.length * 0.82 + r.range(0, 0.12), alpha: 1,
      });
    });
    this.wisps = [0, 1, 2].map((i) => ({ sp: new Tinted(makeWisp(40 + i, 100 + i * 20, 9)), x: r.range(0, W), y: 14 + i * 20, spd: 0.8 + i * 0.4 }));
    this.shoot = null;
    this.shootT = 8;
  }
  retint(look) {
    const g = 1 - look.rain * 0.4 - look.cover * 0.12;
    const c = look.tint.map((v) => clamp(v * 1.08 * g + 8 * look.day, 0, 255));
    for (const c2 of this.clouds) c2.sp.retint(c);
    for (const w of this.wisps) w.sp.retint(c);
  }
  update(dt, wind, look) {
    for (const c of this.clouds) {
      c.x += c.spd * dt * (0.5 + wind * 0.9);
      if (c.x > W + 20) { c.x = -c.sp.w - 10; }
    }
    for (const w of this.wisps) {
      w.x += w.spd * dt;
      if (w.x > W + 10) w.x = -w.sp.w;
    }
    if (look.night > 0.7) {
      this.shootT -= dt;
      if (this.shootT <= 0) {
        this.shootT = 9 + Math.random() * 16;
        this.shoot = { x: Math.random() * W * 0.8, y: Math.random() * 50 + 4, age: 0, vx: 150 + Math.random() * 60, vy: 55 + Math.random() * 40 };
      }
    }
    if (this.shoot) {
      this.shoot.age += dt;
      if (this.shoot.age > 0.9) this.shoot = null;
    }
  }
  drawStars(ctx, look, t, hidden) {
    const a0 = smooth(0.35, 0.95, look.night) * (1 - look.cover * 0.92);
    if (a0 < 0.02) return;
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
      ctx.globalAlpha = a0 * (0.35 + 0.65 * tw) * (0.5 + 0.5 * (1 - s.y / HOR));
      ctx.fillStyle = s.c;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      if (s.big && tw > 0.7) {
        ctx.globalAlpha *= 0.55;
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y) - 1, 1, 3);
      }
    }
    if (this.shoot) {
      const s = this.shoot;
      for (let k = 0; k < 9; k++) {
        const tt = s.age - k * 0.012;
        if (tt < 0) continue;
        ctx.globalAlpha = a0 * (1 - k / 9) * (1 - s.age / 0.9);
        ctx.fillStyle = k < 2 ? '#ffffff' : '#bcd0ff';
        ctx.fillRect(Math.round(s.x + s.vx * tt), Math.round(s.y + s.vy * tt), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
  drawClouds(ctx, look, ox) {
    const cover = look.cover;
    for (const w of this.wisps) {
      const a = (1 - cover) * 0.6 * (0.35 + look.day * 0.65);
      if (a < 0.03) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(w.sp.out, Math.round(w.x + ox * 0.3), w.y);
    }
    for (const c of this.clouds) {
      const a = smooth(c.thresh - 0.08, c.thresh + 0.16, cover);
      if (a < 0.03) continue;
      ctx.globalAlpha = a * (0.9 - look.night * 0.15);
      const dark = look.rain * 0.0;
      void dark;
      ctx.drawImage(c.sp.out, Math.round(c.x + ox * (c.sp.h / 34)), Math.round(c.y + cover * 6));
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- birds ----------------
export class Birds {
  constructor(hooks) {
    this.hooks = hooks;
    this.flocks = [];
    this.timer = 4;
    this.r = new Rng(1313);
    this.sets = [makeBirdFrames('#1b2130', '#394156'), makeBirdFrames('#33281e', '#5b4a38')].map((fr) => fr.map((c) => new Tinted(c)));
  }
  retint(look) {
    const c = look.tint.map((v) => v * 0.9);
    for (const s of this.sets) for (const f of s) f.retint(c);
  }
  update(dt, env) {
    const act = env.birdActivity; // 0..1
    this.timer -= dt;
    if (this.timer <= 0 && act > 0.05) {
      this.timer = this.r.range(7, 20) / (0.25 + act * 1.2);
      if (this.flocks.length < 3) this.spawn();
    }
    for (const f of this.flocks) {
      f.x += f.vx * dt;
      f.y += Math.sin(f.t * 0.6 + f.ph) * 3 * dt;
      f.t += dt;
      for (const b of f.birds) {
        b.t += dt * b.rate;
        b.callT -= dt;
        if (b.callT <= 0) {
          b.callT = this.r.range(2.4, 7);
          if (this.r.chance(0.7 * act + 0.1)) this.hooks.birdCall?.({ x: f.x + b.ox, y: f.y + b.oy, vx: f.vx, species: f.species, far: f.far });
        }
      }
    }
    this.flocks = this.flocks.filter((f) => (f.vx > 0 ? f.x < W + 40 : f.x > -40));
  }
  spawn() {
    const r = this.r;
    const dir = r.chance(0.5) ? 1 : -1;
    const n = r.int(1, 5);
    const far = r.range(0, 1);
    const f = {
      x: dir > 0 ? -20 : W + 20, y: r.range(18, 88), vx: dir * r.range(16, 30) * (1 - far * 0.35), t: 0, ph: r.range(0, 6),
      species: r.int(0, 2), far, set: r.chance(0.35) ? 1 : 0,
      birds: Array.from({ length: n }, (_, i) => ({ ox: -dir * (i * r.range(7, 11)), oy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * r.range(3, 6), t: r.range(0, 5), rate: r.range(7, 10), callT: r.range(0.5, 4) })),
    };
    this.flocks.push(f);
  }
  draw(ctx, look, ox) {
    const dayA = 0.35 + 0.65 * look.day;
    for (const f of this.flocks) {
      const set = this.sets[f.set];
      for (const b of f.birds) {
        const ph = Math.floor(b.t) % 4;
        const frame = [0, 1, 2, 1][ph];
        ctx.globalAlpha = dayA * (1 - f.far * 0.3);
        const spr = set[frame].out;
        ctx.drawImage(spr, Math.round(f.x + b.ox + ox * 0.4), Math.round(f.y + b.oy + (frame === 2 ? 1 : 0)));
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- butterflies ----------------
export class Butterflies {
  constructor() {
    const r = new Rng(404);
    this.pal = [['#f59a2a', '#fff2b0'], ['#6aa8f0', '#e8f4ff'], ['#f4e04a', '#c4781e'], ['#fafafa', '#8aa0b8'], ['#e86aa8', '#ffd0e8']];
    this.sprites = this.pal.map(([a, b]) => makeButterflyFrames(a, b).map((c) => new Tinted(c)));
    this.list = Array.from({ length: 8 }, (_, i) => ({
      x: r.range(130, 470), y: r.range(196, 258), vx: 0, vy: 0, t: r.range(0, 10), set: i % this.pal.length,
      tx: r.range(130, 470), ty: r.range(196, 258), wait: 0,
    }));
    this.r = r;
  }
  retint(look) {
    for (const s of this.sprites) for (const f of s) f.retint(look.tint);
  }
  update(dt, env) {
    for (const b of this.list) {
      b.t += dt;
      b.wait -= dt;
      const dx = b.tx - b.x, dy = b.ty - b.y;
      if (Math.hypot(dx, dy) < 6 && b.wait <= 0) {
        b.tx = clamp(b.x + this.r.range(-90, 90), 10, W - 10);
        b.ty = clamp(b.y + this.r.range(-34, 34), 190, 262);
        b.wait = this.r.range(0, 1.5);
      }
      b.vx += (dx * 0.5 - b.vx) * dt * 1.2 + (this.r.next() - 0.5) * 30 * dt + env.wind * 12 * dt;
      b.vy += (dy * 0.5 - b.vy) * dt * 1.2 + (this.r.next() - 0.5) * 30 * dt;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > 18) { b.vx *= 18 / sp; b.vy *= 18 / sp; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
  }
  draw(ctx, look, ox, vis) {
    if (vis < 0.02) return;
    ctx.globalAlpha = vis;
    for (const b of this.list) {
      const fr = Math.floor(b.t * 9) % 2;
      const bob = Math.round(Math.sin(b.t * 5) * 1.4);
      ctx.drawImage(this.sprites[b.set][fr].out, Math.round(b.x + ox), Math.round(b.y + bob - 12));
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- ripples (fish, rain, drops) ----------------
export class Ripples {
  constructor() { this.list = []; }
  add(x, y, max = 6, life = 1, str = 1) { if (this.list.length < 80) this.list.push({ x, y, age: 0, life, max, str }); }
  update(dt) {
    for (const r of this.list) r.age += dt;
    this.list = this.list.filter((r) => r.age < r.life);
  }
  draw(ctx, look) {
    const col = look.hor.map((v) => clamp(v * 0.5 + 135, 0, 255));
    for (const r of this.list) {
      const t = r.age / r.life;
      const rad = 1 + (r.max - 1) * (1 - (1 - t) * (1 - t));
      const a = (1 - t) * 0.75 * r.str;
      ctx.globalAlpha = a;
      ctx.fillStyle = css(col);
      const rx = rad, ry = rad * 0.38;
      const steps = Math.max(8, Math.round(rx * 5));
      for (let i = 0; i < steps; i++) {
        const ang = (i / steps) * 6.283;
        ctx.fillRect(Math.round(r.x + Math.cos(ang) * rx), Math.round(r.y + Math.sin(ang) * ry), 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- fish ----------------
export class Fish {
  constructor(hooks, ripples) {
    this.hooks = hooks;
    this.ripples = ripples;
    this.frames = makeFishFrames().map((c) => new Tinted(c));
    this.timer = 5;
    this.jump = null;
    this.drops = [];
    this.r = new Rng(555);
  }
  retint(look) {
    for (const f of this.frames) f.retint(look.tint.map((v) => clamp(v * 1.05, 0, 255)));
  }
  update(dt, env) {
    this.timer -= dt;
    const calm = 1 - env.rain * 0.7;
    if (this.timer <= 0 && !this.jump) {
      this.timer = this.r.range(6, 15) / (0.4 + 0.6 * env.fishAct * calm);
      if (env.fishAct > 0.15 && this.r.chance(0.8)) {
        const x = this.r.range(150, 330);
        const y = this.r.range(HOR + 22, HOR + 52);
        if (isLake(x, y) && isLake(x + 18, y) && isLake(x - 18, y)) {
          this.jump = { x0: x, y0: y, vx: this.r.pick([-1, 1]) * this.r.range(10, 22), t: 0, dur: this.r.range(0.7, 0.95), h: this.r.range(16, 26), big: this.r.chance(0.3) };
          this.ripples.add(x, y, 7, 1.1);
          this.hooks.splash?.({ x, y, size: this.jump.big ? 1 : 0.7, kind: 'breach' });
          for (let i = 0; i < 5; i++) this.drops.push({ x, y: y - 2, vx: this.r.range(-18, 18), vy: -this.r.range(20, 44), life: 0.5 });
        }
      }
    }
    const j = this.jump;
    if (j) {
      j.t += dt;
      if (j.t >= j.dur) {
        const x = j.x0 + j.vx * j.dur;
        this.ripples.add(x, j.y0, 8, 1.2);
        this.ripples.add(x, j.y0, 4, 0.8);
        this.hooks.splash?.({ x, y: j.y0, size: j.big ? 0.9 : 0.6, kind: 'land' });
        for (let i = 0; i < 4; i++) this.drops.push({ x, y: j.y0 - 1, vx: this.r.range(-14, 14), vy: -this.r.range(14, 30), life: 0.4 });
        this.jump = null;
      }
    }
    for (const d of this.drops) {
      d.vy += 120 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
    }
    this.drops = this.drops.filter((d) => d.life > 0);
  }
  draw(ctx, look) {
    const j = this.jump;
    if (j) {
      const u = j.t / j.dur;
      const x = j.x0 + j.vx * j.t;
      const y = j.y0 - j.h * 4 * u * (1 - u);
      const slope = 4 * (1 - 2 * u); // dy/du, positive going up
      const dir = j.vx > 0 ? 1 : -1;
      const f = slope > 1.6 ? 0 : slope > 0 ? 1 : slope > -1.6 ? 2 : 3;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      if (dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(this.frames[f].out, -7, -7);
      ctx.restore();
    }
    ctx.fillStyle = css(look.hor.map((v) => clamp(v * 0.4 + 150, 0, 255)));
    for (const d of this.drops) {
      ctx.globalAlpha = clamp(d.life * 2.4);
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- frogs ----------------
export class Frogs {
  constructor(spots, hooks) {
    this.hooks = hooks;
    this.frames = makeFrogFrames().map((c) => new Sprite(c, 5, c.height));
    this.r = new Rng(808);
    this.list = spots.map((s, i) => ({ ...s, croak: 0, next: this.r.range(3, 10) + i * 2, pulses: 0, flip: i % 2 }));
  }
  retint(look) { for (const f of this.frames) f.retint(look); }
  update(dt, env) {
    const act = env.frogActivity;
    for (const f of this.list) {
      f.next -= dt * (0.25 + act * 1.6);
      if (f.croak > 0) {
        f.croak -= dt;
        f.pulses = Math.floor(f.croak * 13) % 2;
      }
      if (f.next <= 0 && act > 0.06) {
        f.next = this.r.range(5, 14);
        f.croak = 0.55;
        this.hooks.frogCroak?.({ x: f.x, y: f.y });
      }
    }
  }
  draw(ctx, look, ox) {
    for (const f of this.list) {
      const fr = f.croak > 0 && f.pulses ? 1 : 0;
      const sp = this.frames[fr];
      const v = sp.v[2];
      ctx.save();
      ctx.translate(Math.round(f.x + ox), f.y);
      if (f.flip) ctx.scale(-1, 1);
      ctx.drawImage(v, -5, -sp.h);
      ctx.restore();
    }
  }
}

// ---------------- fireflies ----------------
export class Fireflies {
  constructor() {
    const r = new Rng(99);
    this.list = Array.from({ length: 54 }, () => ({
      x: r.range(0, W), y: r.range(150, 262), ph: r.range(0, 99), sp: r.range(0.5, 1.4), glow: r.range(0.5, 1.6), a: r.range(14, 36), z: r.next(),
    }));
  }
  draw(ctx, look, t, ox, vis) {
    if (vis < 0.03) return;
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.list) {
      const g = Math.pow(Math.max(0, Math.sin(t * f.glow * 1.3 + f.ph)), 3) * vis;
      if (g < 0.04) continue;
      const x = f.x + Math.sin(t * 0.31 * f.sp + f.ph) * f.a + Math.sin(t * 0.77 * f.sp + f.ph * 2) * 6 + ox * (0.6 + f.z * 0.6);
      const y = f.y + Math.cos(t * 0.27 * f.sp + f.ph) * f.a * 0.35 + Math.sin(t * 0.9 + f.ph) * 3;
      const px = Math.round(x), py = Math.round(y);
      ctx.fillStyle = `rgba(190,255,90,${0.1 * g})`;
      ctx.fillRect(px - 3, py - 1, 7, 3);
      ctx.fillRect(px - 1, py - 3, 3, 7);
      ctx.fillStyle = `rgba(210,255,110,${0.32 * g})`;
      ctx.fillRect(px - 1, py, 3, 1);
      ctx.fillRect(px, py - 1, 1, 3);
      ctx.fillStyle = `rgba(255,252,190,${0.95 * g})`;
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------- falling leaves ----------------
export class Leaves {
  constructor(treeSpots) {
    this.spots = treeSpots;
    this.r = new Rng(246);
    const cols = [['#5aa83a', '#3a8030'], ['#7ec04a', '#4d9a38'], ['#c8d24a', '#8fa832'], ['#e0a838', '#b8722a'], ['#d8602e', '#a84020']];
    this.sets = cols.map(([a, b]) => makeLeafFrames(a, b).map((c) => new Tinted(c)));
    this.list = [];
    this.timer = 1;
  }
  retint(look) { for (const s of this.sets) for (const f of s) f.retint(look.tint); }
  update(dt, env) {
    this.timer -= dt;
    if (this.timer <= 0 && this.list.length < 24 && env.rain < 0.6) {
      this.timer = this.r.range(0.6, 2.4) / (0.4 + env.wind * 1.5);
      const s = this.r.pick(this.spots);
      const set = this.r.chance(0.78) ? this.r.int(0, 2) : this.r.int(3, 4);
      this.list.push({ x: s.x + this.r.range(-s.w * 0.3, s.w * 0.3), y: s.y - s.h * this.r.range(0.4, 0.8), vy: this.r.range(7, 14), ph: this.r.range(0, 6.28), t: 0, set, gy: s.y + this.r.range(0, 10) });
    }
    for (const l of this.list) {
      l.t += dt;
      l.y += l.vy * dt * (1 + Math.sin(l.t * 2 + l.ph) * 0.25);
      l.x += (env.wind * 20 + 3 + Math.sin(l.t * 1.8 + l.ph) * 9) * dt;
    }
    this.list = this.list.filter((l) => l.y < l.gy && l.x < W + 10);
  }
  draw(ctx, look, ox) {
    for (const l of this.list) {
      const fr = Math.floor(l.t * 4 + l.ph) % 4;
      ctx.drawImage(this.sets[l.set][fr].out, Math.round(l.x + ox), Math.round(l.y));
    }
  }
}

// ---------------- chimney smoke ----------------
export class Smoke {
  constructor() { this.list = []; this.timer = 0; this.r = new Rng(31); }
  update(dt, env) {
    this.timer -= dt;
    const rate = 0.55 + env.look.lights * 0.9;
    if (this.timer <= 0) {
      this.timer = 1 / (rate * 2.6) * this.r.range(0.7, 1.3);
      this.list.push({ x: CABIN_POS.x - 33 + 48 + this.r.range(-1, 1), y: CABIN_POS.y - 54 + 3, age: 0, life: this.r.range(3.2, 5), vx: this.r.range(-1, 1.5) });
    }
    for (const p of this.list) {
      p.age += dt;
      p.y -= (9 + p.age * 1.5) * dt;
      p.x += (p.vx + env.wind * 20 * Math.min(1, p.age / 1.6)) * dt;
    }
    this.list = this.list.filter((p) => p.age < p.life);
  }
  draw(ctx, look, ox) {
    const lum = look.tint.map((v) => clamp(v * 0.8 + 30, 0, 255));
    for (const p of this.list) {
      const t = p.age / p.life;
      const a = (1 - t) * (t < 0.1 ? t * 10 : 1) * 0.7;
      const s = t < 0.25 ? 2 : t < 0.55 ? 3 : 4;
      ctx.globalAlpha = a;
      ctx.fillStyle = css(lum);
      const x = Math.round(p.x + ox), y = Math.round(p.y);
      if (s === 2) ctx.fillRect(x, y, 2, 2);
      else if (s === 3) { ctx.fillRect(x, y - 1, 3, 3); ctx.fillStyle = css(lum.map((v) => v * 0.85)); ctx.fillRect(x + 2, y, 1, 2); }
      else {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2 === 0 || bay(i + x, j + y) > 0.6) ctx.fillRect(x + i - 1, y + j - 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- rain ----------------
export class Rain {
  constructor(ripples) {
    this.ripples = ripples;
    const r = new Rng(77);
    this.drops = Array.from({ length: 340 }, (_, i) => ({ x: r.range(-20, W + 40), y: r.range(-20, H), z: i % 3, v: r.range(0.85, 1.15), gy: r.range(HOR + 30, H) }));
    this.splash = [];
    this.r = r;
  }
  update(dt, env) {
    const level = env.rain;
    const n = Math.floor(this.drops.length * level);
    const slant = 0.12 + env.wind * 0.35;
    for (let i = 0; i < n; i++) {
      const d = this.drops[i];
      const sp = [210, 270, 340][d.z] * d.v;
      d.y += sp * dt;
      d.x += sp * slant * dt;
      if (d.y > d.gy) {
        d.y = -this.r.range(2, 30);
        d.x = this.r.range(-20, W + 40);
        d.gy = this.r.range(HOR + 24, H + 4);
        if (d.z > 0 && this.splash.length < 60) {
          const sx = d.x, sy = d.gy;
          if (!isLake(sx, sy) || sy < HOR + 4) this.splash.push({ x: sx, y: sy, age: 0 });
        }
      }
    }
    // rings on the lake
    const rate = level * 70;
    const k = rate * dt;
    for (let m = 0; m < Math.floor(k) + (this.r.next() < k % 1 ? 1 : 0); m++) {
      const y = this.r.range(HOR + 3, 219), x = this.r.range(60, 420);
      if (isLake(x, y)) {
        const near = (y - HOR) / 76;
        this.ripples.add(x, y, 1.5 + near * 3.2, 0.55 + near * 0.35, 0.6);
      }
    }
    for (const s of this.splash) s.age += dt;
    this.splash = this.splash.filter((s) => s.age < 0.16);
  }
  draw(ctx, look, env) {
    const level = env.rain;
    if (level < 0.02) return;
    const n = Math.floor(this.drops.length * level);
    const slant = 0.12 + env.wind * 0.35;
    const c = look.tint.map((v) => clamp(v * 0.55 + 100, 0, 255));
    for (let i = 0; i < n; i++) {
      const d = this.drops[i];
      const len = 2 + d.z;
      ctx.globalAlpha = [0.28, 0.4, 0.55][d.z];
      ctx.fillStyle = css(c);
      const x = Math.round(d.x), y = Math.round(d.y);
      for (let k = 0; k < len; k++) ctx.fillRect(Math.round(x - k * slant), y - k, 1, 1);
    }
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = css(c);
    for (const s of this.splash) {
      const x = Math.round(s.x), y = Math.round(s.y);
      if (s.age < 0.08) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); }
      else { ctx.fillRect(x - 2, y - 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1); }
    }
    ctx.globalAlpha = 1;
  }
}

// ---------------- mist ----------------
export class Mist {
  constructor() {
    const r = new Rng(21);
    const noise = makeNoise(21);
    this.sprites = [];
    for (let i = 0; i < 5; i++) {
      const w = r.int(120, 220), h = r.int(14, 26);
      const px = new PX(w, h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const ex = (x - w / 2) / (w / 2), ey = (y - h / 2) / (h / 2);
          let d = 1 - Math.sqrt(ex * ex * 0.9 + ey * ey * 1.6);
          d += (noise(x * 0.05 + i * 9, y * 0.16) - 0.5) * 0.7;
          if (d > bay(x, y) * 0.6 + 0.12) px.p(x, y, d > 0.5 ? '#ffffff' : '#e6eef6');
        }
      this.sprites.push(new Tinted(px.cv));
    }
    this.list = Array.from({ length: 11 }, (_, i) => ({
      sp: this.sprites[i % 5], x: r.range(-80, W), y: HOR - 8 + r.range(0, 70) * (i % 3 === 0 ? 0.35 : 1), spd: r.range(2, 6), a: r.range(0.55, 1), front: i % 4 === 0, ph: r.range(0, 6),
    }));
  }
  retint(look) {
    const c = look.tint.map((v) => clamp(v * 0.9 + 28, 0, 255));
    for (const s of this.sprites) s.retint(c);
  }
  update(dt, wind) {
    for (const m of this.list) {
      m.x += (m.spd + wind * 10) * dt;
      if (m.x > W + 20) m.x = -m.sp.w - 20;
    }
  }
  draw(ctx, look, t, front, ox) {
    const amt = look.mist;
    if (amt < 0.02) return;
    for (const m of this.list) {
      if (m.front !== front) continue;
      ctx.globalAlpha = amt * m.a * (front ? 0.45 : 0.62) * (0.8 + 0.2 * Math.sin(t * 0.3 + m.ph));
      ctx.drawImage(m.sp.out, Math.round(m.x + ox), Math.round(m.y + Math.sin(t * 0.2 + m.ph) * 1.5));
    }
    ctx.globalAlpha = 1;
  }
}
export { STREAM, nearY };

// ---------------- aggregate ----------------
export class World {
  constructor(layout, hooks) {
    this.hooks = hooks;
    this.sky = new Sky();
    this.ripples = new Ripples();
    this.birds = new Birds(hooks);
    this.butterflies = new Butterflies();
    this.fish = new Fish(hooks, this.ripples);
    this.frogs = new Frogs(layout.frogs, hooks);
    this.fireflies = new Fireflies();
    const canopies = layout.props.filter((p) => p.type === 'tree' && p.kind !== 'pine' && p.sp.h > 36).map((p) => ({ x: p.x, y: p.y, w: p.sp.w, h: p.sp.h }));
    this.leaves = new Leaves(canopies);
    this.smoke = new Smoke();
    this.rain = new Rain(this.ripples);
    this.mist = new Mist();
    this.streamPts = STREAM;
    const r = new Rng(12);
    this.flow = Array.from({ length: 70 }, () => ({ s: r.range(0, STREAM.length), v: r.range(9, 20), o: r.range(-1, 1), len: r.int(1, 4), dark: r.chance(0.35) }));
  }
  retint(look) {
    this.sky.retint(look);
    this.birds.retint(look);
    this.butterflies.retint(look);
    this.fish.retint(look);
    this.leaves.retint(look);
    this.mist.retint(look);
  }
  update(dt, env) {
    this.sky.update(dt, env.wind, env.look);
    this.birds.update(dt, env);
    this.butterflies.update(dt, env);
    this.fish.update(dt, env);
    this.frogs.update(dt, env);
    this.leaves.update(dt, env);
    this.smoke.update(dt, env);
    this.rain.update(dt, env);
    this.ripples.update(dt);
    this.mist.update(dt, env.wind);
  }
}
