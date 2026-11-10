// Night sky: dithered gradient, stars, moon, shooting stars and the aurora.
import { W, H, TAU, RNG, P, clamp, lerp, smooth, bayer, fbm, vnoise, makeCanvas, pack } from './util.js';
import { Pix } from './pix.js';
import { MOON, HORIZON } from './scene.js';
import { glowSprite } from './fx.js';

const AH = 156; // aurora canvas height

function bakeGradient() {
  const p = new Pix(W, H);
  const stops = [
    [0, [4, 6, 20]],
    [0.32, [8, 13, 38]],
    [0.62, [13, 26, 66]],
    [0.86, [22, 44, 92]],
    [1, [34, 62, 112]],
  ];
  const N = 15;
  const cols = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const a = stops[k],
      b = stops[k + 1];
    const u = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    cols.push(pack(lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u), lerp(a[1][2], b[1][2], u)));
  }
  const yMax = HORIZON + 8;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = Math.min(1, y / yMax);
      p.d[y * W + x] = cols[clamp(Math.floor(t * (N - 1) + bayer(x, y)), 0, N - 1)];
    }
  return p.toCanvas();
}

function bakeStars() {
  const p = new Pix(W, H);
  const r = new RNG(404);
  const dim = [P('#39497a'), P('#55689c'), P('#8a9bc8'), P('#c9d6f4')];
  // faint band of the milky way
  for (let i = 0; i < 420; i++) {
    const t = r.next();
    const x = lerp(-20, 330, t) + (r.next() + r.next() - 1) * 46;
    const y = lerp(150, -10, t) + (r.next() + r.next() - 1) * 26;
    if (y < 0 || y > 150) continue;
    p.set(x, y, dim[r.chance(0.8) ? 0 : 1]);
  }
  for (let i = 0; i < 230; i++) {
    const y = Math.pow(r.next(), 1.3) * 158;
    p.set(r.range(0, W), y, dim[Math.min(3, Math.floor(Math.pow(r.next(), 2.2) * 4))]);
  }
  const tw = [];
  for (let i = 0; i < 64; i++) tw.push({ x: r.int(2, W - 3), y: Math.floor(Math.pow(r.next(), 1.2) * 150) + 2, ph: r.range(0, TAU), sp: r.range(0.6, 2.4), big: i < 9, warm: r.chance(0.2) });
  return { cv: p.toCanvas(), tw };
}

function bakeMoon() {
  const r = MOON.r;
  const s = r * 2 + 3;
  const p = new Pix(s, s);
  const c = r + 1;
  for (let dy = -r - 1; dy <= r + 1; dy++)
    for (let dx = -r - 1; dx <= r + 1; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r + r * 0.6) continue;
      const term = -0.38 * Math.sqrt(Math.max(0, r * r - dy * dy));
      let col;
      if (dx < term - 0.5) col = P('#1a2850');
      else {
        const n = fbm(dx * 0.33 + 5, dy * 0.33 + 2, 7, 3);
        col = dx < term + 1.2 ? P('#a9abb0') : n > 0.6 ? P('#cfcdbc') : dx > r * 0.3 && d2 > r * r * 0.45 ? P('#fdfbee') : P('#eeebd6');
      }
      p.set(c + dx, c + dy, col);
    }
  return p.toCanvas();
}

const BANDS = [
  { y0: 92, amp: 13, k: 0.011, sp: 0.16, h: 70, seed: 3, gain: 1.0, drift: 0.008, ray: 0.5 },
  { y0: 66, amp: 10, k: 0.016, sp: -0.12, h: 50, seed: 11, gain: 0.8, drift: -0.006, ray: -0.38 },
  { y0: 116, amp: 8, k: 0.021, sp: 0.2, h: 40, seed: 19, gain: 0.62, drift: 0.011, ray: 0.7 },
];

export class Sky {
  constructor() {
    this.grad = bakeGradient();
    const st = bakeStars();
    this.stars = st.cv;
    this.tw = st.tw;
    this.moon = bakeMoon();
    this.halo = glowSprite(46, [120, 155, 235], 1.9);
    const a = makeCanvas(W, AH);
    this.acv = a.c;
    this.ag = a.g;
    this.img = a.g.createImageData(W, AH);
    this.out = new Uint32Array(this.img.data.buffer);
    this.acc = new Float32Array(W * AH * 3);
    this.col = new Float32Array(W); // per-column brightness, for reflections
    this.level = 0;
    this.clock = 1;
    this.shoot = null;
    this.shootT = 11;
    this.rng = new RNG(77);
  }

  _aurora(t, strength) {
    const { acc, out, col } = this;
    acc.fill(0);
    col.fill(0);
    let sum = 0;
    if (strength > 0.01) {
      for (const b of BANDS) {
        for (let x = 0; x < W; x++) {
          const pres = smooth(0.34, 0.66, fbm(x * 0.0055 + t * b.drift + b.seed, t * 0.021 + b.seed * 2, b.seed, 2));
          let I = pres * strength * b.gain;
          if (I < 0.03) continue;
          const ray = 0.3 + 0.7 * Math.pow(vnoise(x * 0.33 + t * b.ray, t * 0.23, b.seed + 5), 1.5) * 1.5;
          const fold = 0.5 + 0.5 * vnoise(x * 0.07 - t * 0.09, t * 0.06, b.seed + 9);
          I *= ray * (0.55 + 0.6 * fold) * 1.6;
          col[x] += I;
          const yb = b.y0 + b.amp * Math.sin(x * b.k + t * b.sp + b.seed) + b.amp * 0.45 * Math.sin(x * b.k * 2.7 - t * b.sp * 1.6 + 1.3);
          const hgt = b.h * (0.5 + 0.75 * fold);
          const y1 = Math.min(AH - 1, Math.round(yb) + 3),
            y0 = Math.max(0, Math.round(yb - hgt));
          for (let y = y0; y <= y1; y++) {
            const v = (yb - y) / hgt;
            let a = v < 0 ? 0.3 * (1 + (v * hgt) / 3.5) : v < 0.07 ? 0.62 + 0.38 * (v / 0.07) : Math.pow(1 - v, 1.7);
            a *= I;
            if (a <= 0.02) continue;
            const c1 = smooth(0.1, 0.5, v),
              c2 = smooth(0.48, 0.95, v);
            const i3 = (y * W + x) * 3;
            acc[i3] += lerp(lerp(60, 44, c1), 176, c2) * a;
            acc[i3 + 1] += lerp(lerp(255, 196, c1), 84, c2) * a;
            acc[i3 + 2] += lerp(lerp(150, 226, c1), 236, c2) * a;
          }
        }
      }
    }
    for (let y = 0; y < AH; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x,
          i3 = i * 3;
        const r = acc[i3],
          g = acc[i3 + 1],
          b = acc[i3 + 2];
        const m = Math.max(r, g, b) / 255;
        if (m < 0.03) {
          out[i] = 0xff000000;
          continue;
        }
        const lvl = Math.min(6, Math.floor(Math.min(1, m) * 6 + bayer(x, y)));
        if (lvl <= 0) {
          out[i] = 0xff000000;
          continue;
        }
        const s = lvl / 6 / m;
        out[i] = pack(Math.min(255, r * s), Math.min(255, g * s), Math.min(255, b * s));
      }
    for (let x = 0; x < W; x++) sum += col[x];
    this.level = clamp(sum / W / 0.55, 0, 1);
    this.ag.putImageData(this.img, 0, 0);
  }

  // clear: 0 overcast .. 1 crisp; aurora: 0..1
  draw(g, t, dt, clear, aurora) {
    g.globalAlpha = 1;
    g.drawImage(this.grad, 0, 0);
    if (clear > 0.02) {
      g.globalAlpha = clear;
      g.drawImage(this.stars, 0, 0);
      // twinkle
      const cols = ['#55689c', '#aebde6', '#ffffff'];
      for (const s of this.tw) {
        const b = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const l = b > 0.8 ? 2 : b > 0.4 ? 1 : 0;
        g.fillStyle = l === 2 && s.warm ? '#fff0cc' : cols[l];
        g.fillRect(s.x, s.y, 1, 1);
        if (s.big && l > 0) {
          g.fillStyle = l === 2 ? '#aebde6' : '#55689c';
          g.fillRect(s.x - 1, s.y, 1, 1);
          g.fillRect(s.x + 1, s.y, 1, 1);
          g.fillRect(s.x, s.y - 1, 1, 1);
          g.fillRect(s.x, s.y + 1, 1, 1);
          if (l === 2 && b > 0.95) {
            g.fillRect(s.x - 2, s.y, 1, 1);
            g.fillRect(s.x + 2, s.y, 1, 1);
          }
        }
      }
      // shooting star
      this.shootT -= dt;
      if (!this.shoot && this.shootT <= 0 && clear > 0.6) {
        const r = this.rng;
        const d = r.sign();
        this.shoot = { x: r.range(70, 340), y: r.range(8, 60), vx: d * r.range(150, 230), vy: r.range(60, 110), age: 0, life: r.range(0.45, 0.8) };
        this.shootT = r.range(16, 44);
      }
      if (this.shoot) {
        const s = this.shoot;
        s.age += dt;
        const k = s.age / s.life;
        if (k >= 1) this.shoot = null;
        else {
          const hx = s.x + s.vx * s.age,
            hy = s.y + s.vy * s.age;
          const len = 16 * Math.sin(k * Math.PI) + 3;
          const sp = Math.hypot(s.vx, s.vy);
          for (let i = 0; i < len; i++) {
            g.fillStyle = i < 2 ? '#ffffff' : i < 6 ? '#aebde6' : '#55689c';
            if (i >= 6 && i % 2) continue;
            g.fillRect(Math.round(hx - (s.vx / sp) * i), Math.round(hy - (s.vy / sp) * i), 1, 1);
          }
        }
      }
      // moon
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.55 * clear;
      g.drawImage(this.halo, MOON.x - (this.halo.width >> 1), MOON.y - (this.halo.height >> 1));
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = Math.pow(clear, 0.7);
      g.drawImage(this.moon, MOON.x - MOON.r - 1, MOON.y - MOON.r - 1);
    }
    // aurora, stepped at 15 fps for a hand-animated feel
    this.clock += dt;
    const str = aurora * clear;
    if (this.clock >= 1 / 15) {
      this.clock = 0;
      this._aurora(t, str);
    }
    if (str > 0.01) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 1;
      g.drawImage(this.acv, 0, 0);
      g.globalCompositeOperation = 'source-over';
    }
    g.globalAlpha = 1;
  }
}
