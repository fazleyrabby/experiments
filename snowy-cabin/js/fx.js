// Particles and light sprites: snowfall, chimney smoke, falling snow clumps, glints, spindrift.
import { W, H, TAU, RNG, P, clamp, smooth, bayer, pack, hexRGB, hash2 } from './util.js';
import { Pix } from './pix.js';
import { CHIMNEY, WIN } from './scene.js';

// dithered radial glow, drawn with 'lighter'
export function glowSprite(r, rgb, pow = 1.5, sx = 1, sy = 1) {
  const w = Math.round(r * sx) * 2 + 1,
    h = Math.round(r * sy) * 2 + 1;
  const p = new Pix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - (w - 1) / 2) / (r * sx), (y - (h - 1) / 2) / (r * sy));
      if (d >= 1) continue;
      const v = Math.pow(1 - d, pow);
      const lvl = Math.floor(v * 5 + bayer(x, y) * 0.999);
      if (lvl >= 1) p.d[y * w + x] = pack(rgb[0], rgb[1], rgb[2], Math.min(255, 26 + lvl * 34));
    }
  return p.toCanvas();
}

// warm light thrown from the window onto the snow
export function spillSprite() {
  const w = 70,
    h = 26;
  const p = new Pix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = y / (h - 1);
      const half = 12 + t * 20;
      const dx = Math.abs(x - w / 2 + 6 * t) / half;
      if (dx >= 1) continue;
      const v = (1 - dx * dx) * Math.pow(1 - t, 1.3);
      const lvl = Math.floor(v * 4 + bayer(x, y) * 0.999);
      if (lvl >= 1) p.d[y * w + x] = pack(255, 168, 84, Math.min(255, 22 + lvl * 34));
    }
  return p.toCanvas();
}

// ---------------------------------------------------------------- snowfall
export class Snow {
  constructor() {
    const r = new RNG(9);
    this.layers = [
      { n: 700, vy: [7, 12], size: 1, wind: 15, sway: 3, col: '#6f86bb', f: [] },
      { n: 520, vy: [14, 22], size: 1, wind: 32, sway: 5, col: '#c6d5f2', f: [] },
      { n: 170, vy: [30, 46], size: 2, wind: 66, sway: 8, col: '#f4f8ff', f: [] },
    ];
    for (const L of this.layers)
      for (let i = 0; i < L.n; i++) L.f.push({ x: r.range(-20, W + 20), y: r.range(-6, H), vy: r.range(L.vy[0], L.vy[1]), ph: r.range(0, TAU), sw: r.range(0.6, 1.5) });
  }
  update(dt, wind, t) {
    const push = wind.speed * 0.6 + wind.speed * wind.speed * 1.7;
    const fall = 1 + wind.speed * 0.6;
    for (const L of this.layers) {
      const wx = push * L.wind;
      for (const f of L.f) {
        f.y += f.vy * fall * dt;
        f.x += (wx * (0.5 + 0.5 * f.sw) + Math.sin(t * 1.3 * f.sw + f.ph) * L.sway) * dt;
        if (f.y > H + 3) {
          f.y = -3;
          f.x = Math.random() * (W + 40) - 20;
        }
        if (f.x > W + 20) f.x -= W + 40;
        else if (f.x < -20) f.x += W + 40;
      }
    }
  }
  draw(g, li, intensity, wind) {
    const L = this.layers[li];
    const n = Math.round(L.n * Math.pow(clamp(intensity, 0, 1), 1.55));
    if (!n) return;
    const streak = wind.speed > 0.6 ? li : 0;
    g.fillStyle = L.col;
    const wcx = WIN.x + WIN.w / 2,
      wcy = WIN.y + WIN.h / 2 + 6;
    const warm = [];
    for (let i = 0; i < n; i++) {
      const f = L.f[i];
      const x = f.x | 0,
        y = f.y | 0;
      if (li === 1 && Math.abs(x - wcx) < 24 && Math.abs(y - wcy) < 22 && (x - wcx) ** 2 + (y - wcy) ** 2 < 520) {
        warm.push(x, y);
        continue;
      }
      g.fillRect(x, y, L.size + streak, L.size);
    }
    if (warm.length) {
      g.fillStyle = '#ffdca6';
      for (let i = 0; i < warm.length; i += 2) g.fillRect(warm[i], warm[i + 1], 1 + streak, 1);
    }
  }
}

// ---------------------------------------------------------------- chimney smoke
const PUFF_COL = ['#c2b3a4', '#a0a6be', '#7a86aa', '#5f6d98', '#4c5a88'];
const PUFF_DEN = [1, 1, 1, 0.55, 0.26];
export class Smoke {
  constructor() {
    this.p = [];
    this.acc = 0;
    this.puffs = [];
    for (let r = 1; r <= 6; r++) {
      const row = [];
      for (let l = 0; l < 5; l++) {
        const s = r * 2 + 1;
        const px = new Pix(s, s);
        const c = hexRGB(PUFF_COL[l]);
        for (let y = 0; y < s; y++)
          for (let x = 0; x < s; x++) {
            const dx = x - r,
              dy = y - r;
            if (dx * dx + dy * dy > r * r + r * 0.6) continue;
            if ((l >= 3 ? hash2(x, y, r * 7 + l) : bayer(x, y)) >= PUFF_DEN[l]) continue;
            const k = dx - dy > r * 0.5 ? 1.16 : dx - dy < -r * 0.6 ? 0.82 : 1;
            px.d[y * s + x] = pack(Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k));
          }
        row.push(px.toCanvas());
      }
      this.puffs[r] = row;
    }
  }
  update(dt, wind, t) {
    this.acc += dt * 8.5;
    while (this.acc >= 1) {
      this.acc -= 1;
      this.p.push({ x: CHIMNEY.x + Math.random() * 3 - 1.5, y: CHIMNEY.y, vx: Math.random() * 2 - 1, vy: -(7 + Math.random() * 4), age: 0, life: 6 + Math.random() * 3.5, s: 0.85 + Math.random() * 0.5, ph: Math.random() * 9 });
    }
    const tx = 3 + wind.speed * 46;
    for (const q of this.p) {
      q.age += dt * (1 + wind.speed * 0.8);
      q.vx += (tx - q.vx) * dt * 0.55;
      q.vy += (-2.2 - q.vy) * dt * 0.28;
      q.x += (q.vx + Math.sin(t * 0.9 + q.ph) * 2.2) * dt;
      q.y += q.vy * dt;
    }
    while (this.p.length && this.p[0].age >= this.p[0].life) this.p.shift();
  }
  draw(g) {
    for (const q of this.p) {
      const k = q.age / q.life;
      if (k >= 1) continue;
      const r = clamp(Math.round(1 + Math.sin(Math.min(1, k * 1.25) * 1.5708) * 4.4 * q.s), 1, 6);
      const l = Math.min(4, Math.floor(k * 5));
      g.drawImage(this.puffs[r][l], Math.round(q.x) - r, Math.round(q.y) - r);
    }
  }
}

// ---------------------------------------------------------------- snow sliding off boughs
export class Clumps {
  constructor(trees, onLand) {
    this.trees = trees;
    this.onLand = onLand;
    this.parts = [];
    this.dust = [];
    this.timer = 5;
    this.rng = new RNG(123);
  }
  shed() {
    const r = this.rng;
    const tr = r.pick(this.trees);
    const m = tr.model;
    const T = m.tiers[r.int(Math.min(2, m.tiers.length - 1), m.tiers.length - 1)];
    const dx = r.sign() * T.hw * r.range(0.45, 0.85);
    const wx = tr.wx(m.cx + dx),
      wy = tr.wy(m.surf(T, dx));
    if (wy < 4 || wy > H - 20 || wx < 2 || wx > W - 2) return;
    const front = tr.amp > 2;
    const n = r.int(4, 8);
    for (let i = 0; i < n; i++)
      this.parts.push({ x: wx + r.range(-3, 3), y: wy + r.range(-1, 2), vx: r.range(-4, 4), vy: r.range(0, 10), big: i < 2, floor: tr.floor + r.range(-1, 2), front, lead: i === 0, d: i * 0.03 });
  }
  update(dt, wind) {
    this.timer -= dt * (1 + wind.speed * 2.5);
    if (this.timer <= 0) {
      this.timer = this.rng.range(8, 20);
      this.shed();
    }
    for (const q of this.parts) {
      if (q.d > 0) {
        q.d -= dt;
        continue;
      }
      q.vy += 130 * dt;
      q.vx += (wind.speed * 30 - q.vx) * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (Math.random() < dt * 22) this.dust.push({ x: q.x, y: q.y, vx: wind.speed * 14 + Math.random() * 6 - 3, vy: 4 + Math.random() * 6, age: 0, life: 0.5 + Math.random() * 0.5, front: q.front });
      if (q.y >= q.floor) {
        q.dead = true;
        if (q.floor < H) {
          for (let i = 0; i < 4; i++) this.dust.push({ x: q.x, y: q.floor, vx: Math.random() * 16 - 8 + wind.speed * 10, vy: -(4 + Math.random() * 12), age: 0, life: 0.5 + Math.random() * 0.5, front: q.front });
        }
        if (q.lead && this.onLand) this.onLand(q.x, q.floor >= H ? 1 : 0.6);
      }
    }
    this.parts = this.parts.filter((q) => !q.dead);
    for (const d of this.dust) {
      d.age += dt;
      d.vy += 26 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    this.dust = this.dust.filter((d) => d.age < d.life);
  }
  draw(g, front) {
    g.fillStyle = '#e8f0fd';
    for (const q of this.parts) if (q.front === front && q.d <= 0) g.fillRect(q.x | 0, q.y | 0, q.big ? 2 : 1, q.big ? 2 : 1);
    g.fillStyle = '#a2bae4';
    for (const d of this.dust) if (d.front === front && bayer(d.x | 0, d.y | 0) > d.age / d.life - 0.2) g.fillRect(d.x | 0, d.y | 0, 1, 1);
  }
}

// ---------------------------------------------------------------- moonlit sparkle on the snow
export class Glints {
  constructor(spots) {
    const r = new RNG(55);
    this.s = spots.map((s) => ({ x: s.x, y: s.y, ph: r.range(0, 20), per: r.range(4, 13), big: r.chance(0.12) }));
  }
  draw(g, t, k) {
    if (k <= 0.02) return;
    g.fillStyle = '#ffffff';
    const n = Math.round(this.s.length * k);
    for (let i = 0; i < n; i++) {
      const s = this.s[i];
      const a = (t + s.ph) % s.per;
      if (a > 0.22) continue;
      g.fillRect(s.x, s.y, 1, 1);
      if (s.big && a > 0.06 && a < 0.16) {
        g.fillRect(s.x - 1, s.y, 3, 1);
        g.fillRect(s.x, s.y - 1, 1, 3);
      }
    }
  }
}

// ---------------------------------------------------------------- wind-driven snow skimming the ground
export class Spindrift {
  constructor() {
    const r = new RNG(71);
    this.s = [];
    for (let i = 0; i < 70; i++) this.s.push({ x: r.range(0, W), y: r.range(176, H), len: r.int(3, 9), v: r.range(90, 190), ph: r.range(0, TAU) });
  }
  update(dt, wind, t) {
    for (const s of this.s) {
      s.x += s.v * (0.4 + wind.speed) * dt;
      s.y += Math.sin(t * 2 + s.ph) * 4 * dt;
      if (s.x > W + 10) {
        s.x = -12;
        s.y = 176 + Math.random() * (H - 176);
      }
    }
  }
  draw(g, wind) {
    const k = smooth(0.42, 1, wind.speed);
    const n = Math.round(this.s.length * k);
    if (!n) return;
    g.fillStyle = `rgba(214,228,250,${(0.18 + 0.3 * k).toFixed(2)})`;
    for (let i = 0; i < n; i++) {
      const s = this.s[i];
      g.fillRect(s.x | 0, s.y | 0, s.len, 1);
    }
  }
}
