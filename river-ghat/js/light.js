// Time of day -> colours. Keyframes from the hour before dawn to bright mid-morning.
import { W, H, clamp, lerp, smooth, bayer, fbm, pack, makeCanvas, RNG, hash2 } from './util.js';
import { Pix } from './pix.js';
import { HZ } from './scene.js';

const KEYS = [
  { h: 4.8, top: [8, 12, 34], mid: [20, 28, 64], hz: [46, 54, 98], sun: [255, 120, 80], mul: [0.36, 0.42, 0.66], add: [4, 6, 18], sat: 0.45, body: [20, 30, 50], mist: [70, 80, 124] },
  { h: 5.4, top: [20, 28, 68], mid: [64, 64, 122], hz: [196, 118, 126], sun: [255, 128, 84], mul: [0.54, 0.52, 0.74], add: [14, 8, 24], sat: 0.62, body: [40, 46, 72], mist: [160, 138, 164] },
  { h: 5.95, top: [44, 66, 128], mid: [146, 118, 156], hz: [255, 166, 104], sun: [255, 178, 100], mul: [0.86, 0.72, 0.68], add: [26, 12, 6], sat: 0.9, body: [66, 64, 76], mist: [232, 188, 164] },
  { h: 6.6, top: [72, 118, 180], mid: [168, 164, 188], hz: [255, 206, 148], sun: [255, 222, 156], mul: [1.0, 0.88, 0.74], add: [18, 10, 0], sat: 1.05, body: [84, 88, 90], mist: [240, 220, 198] },
  { h: 7.6, top: [92, 148, 206], mid: [166, 196, 224], hz: [234, 226, 212], sun: [255, 244, 214], mul: [1.04, 0.98, 0.9], add: [8, 6, 2], sat: 1.02, body: [92, 106, 104], mist: [230, 230, 226] },
  { h: 9.8, top: [82, 148, 214], mid: [148, 196, 234], hz: [212, 228, 238], sun: [255, 252, 236], mul: [1.06, 1.04, 1.0], add: [4, 4, 4], sat: 1.0, body: [90, 110, 110], mist: [228, 234, 240] },
];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export function computeLight(hour) {
  let i = 0;
  while (i < KEYS.length - 2 && hour > KEYS[i + 1].h) i++;
  const A = KEYS[i],
    B = KEYS[i + 1];
  let t = clamp((hour - A.h) / (B.h - A.h), 0, 1);
  t = t * t * (3 - 2 * t);
  const L = {};
  for (const k of ['top', 'mid', 'hz', 'sun', 'mul', 'add', 'body', 'mist']) L[k] = mix3(A[k], B[k], t);
  L.sat = lerp(A.sat, B.sat, t);
  L.hour = hour;
  L.sunX = 372 - (hour - 5.85) * 7;
  L.sunY = HZ - 2 - (hour - 5.85) * 30;
  L.sunVis = smooth(5.55, 5.95, hour);
  L.low = 1 - smooth(6.2, 8.2, hour); // how low and warm the sun is
  L.night = 1 - smooth(5.15, 6.05, hour);
  L.day = smooth(5.7, 7.2, hour);
  return L;
}

// grade an RGBA buffer in place: multiply, lift, saturation, then haze toward a colour
export function grade(data, L, haze = 0, hz = null) {
  const [mr, mg, mb] = L.mul,
    [ar, ag, ab] = L.add,
    s = L.sat;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    let r = data[i] * mr + ar,
      g = data[i + 1] * mg + ag,
      b = data[i + 2] * mb + ab;
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    r = l + (r - l) * s;
    g = l + (g - l) * s;
    b = l + (b - l) * s;
    if (haze > 0) {
      r += (hz[0] - r) * haze;
      g += (hz[1] - g) * haze;
      b += (hz[2] - b) * haze;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

// ---------------------------------------------------------------- sky
export class Sky {
  constructor() {
    const s = makeCanvas(W, HZ + 2);
    this.cv = s.c;
    this.g = s.g;
    this.img = s.g.createImageData(W, HZ + 2);
    this.buf = new Uint32Array(this.img.data.buffer);
    this.rows = []; // sky colour per row, used by the water
    // stars
    const r = new RNG(12);
    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push({ x: r.int(150, W - 1), y: Math.floor(Math.pow(r.next(), 1.4) * 80), b: r.range(0.4, 1), ph: r.range(0, 6.28) });
    // cloud level maps (wrap at 2W)
    this.cw = W * 2;
    this.clouds = [
      { y0: 14, h: 30, sp: 1.4, seed: 3, sc: 0.007, th: 0.56, off: 0 },
      { y0: 40, h: 34, sp: 2.4, seed: 8, sc: 0.009, th: 0.6, off: 0 },
      { y0: 70, h: 26, sp: 3.4, seed: 15, sc: 0.012, th: 0.62, off: 0 },
    ].map((c) => {
      const lv = new Uint8Array(this.cw * c.h);
      for (let y = 0; y < c.h; y++)
        for (let x = 0; x < this.cw; x++) {
          const band = Math.sin((y / (c.h - 1)) * Math.PI);
          const per = Math.round(this.cw * c.sc);
          const v = fbm((x * per) / this.cw, y * 0.12, c.seed, 4, per) * (0.55 + 0.45 * band);
          const q = (v - c.th) / 0.12 + (bayer(x, y) - 0.5) * 0.9;
          lv[y * this.cw + x] = q < 0 ? 0 : q < 1 ? 1 : q < 2 ? 2 : 3;
        }
      const cc = makeCanvas(this.cw, c.h);
      return { ...c, lv, cv: cc.c, g: cc.g, img: cc.g.createImageData(this.cw, c.h) };
    });
    this.last = -1;
  }
  rebuild(L) {
    const { buf } = this;
    const sx = L.sunX,
      sy = Math.max(L.sunY, HZ - 30);
    const glow = L.sunVis * (0.3 + 0.7 * L.low) + (1 - L.sunVis) * 0.5 * (1 - L.night * 0.6);
    for (let y = 0; y < HZ + 2; y++) {
      const t = y / HZ;
      const base = t < 0.55 ? mix3(L.top, L.mid, smooth(0, 0.55, t)) : mix3(L.mid, L.hz, smooth(0.55, 1, t));
      this.rows[y] = base;
      for (let x = 0; x < W; x++) {
        const d = Math.hypot((x - sx) * 0.6, (y - sy) * 1.1);
        const k = glow * Math.exp(-d / 70) * 0.85;
        const j = (bayer(x, y) - 0.5) * 6;
        const r = lerp(base[0], L.sun[0], k) + j,
          g = lerp(base[1], L.sun[1], k) + j,
          b = lerp(base[2], L.sun[2], k) + j;
        buf[y * W + x] = pack(clamp(Math.round(r / 4) * 4, 0, 255), clamp(Math.round(g / 4) * 4, 0, 255), clamp(Math.round(b / 4) * 4, 0, 255));
      }
    }
    this.g.putImageData(this.img, 0, 0);
    // colour the cloud maps
    const dark = mix3(L.mid, [40, 40, 70], 0.35 * (1 - L.day));
    const lit = mix3(mix3(L.hz, [255, 255, 255], 0.45 * L.day), L.sun, 0.55 * L.low * L.sunVis);
    const under = mix3(L.mid, L.sun, 0.35 * L.low * (0.3 + 0.7 * L.sunVis));
    for (const c of this.clouds) {
      const out = new Uint32Array(c.img.data.buffer);
      const cols = [0, mix3(this.rows[c.y0 + (c.h >> 1)] || L.mid, under, 0.45), mix3(under, dark, 0.2), lit];
      const pk = cols.map((v, i) => (i ? pack(v[0], v[1], v[2]) : 0));
      for (let i = 0; i < c.lv.length; i++) out[i] = pk[c.lv[i]];
      c.g.putImageData(c.img, 0, 0);
    }
  }
  draw(g, L, t, dt) {
    if (Math.abs(L.hour - this.last) > 0.004) {
      this.rebuild(L);
      this.last = L.hour;
    }
    g.drawImage(this.cv, 0, 0);
    // stars before dawn
    if (L.night > 0.05) {
      for (const s of this.stars) {
        const a = L.night * s.b * (0.6 + 0.4 * Math.sin(t * 1.7 + s.ph));
        if (a < 0.25) continue;
        g.fillStyle = `rgba(220,226,255,${a.toFixed(2)})`;
        g.fillRect(s.x, s.y, 1, 1);
      }
    }
    // sun
    if (L.sunVis > 0) {
      const r = 7;
      const c = mix3(L.sun, [255, 255, 245], 0.55);
      g.fillStyle = `rgb(${c.map(Math.round).join(',')})`;
      for (let dy = -r; dy <= r; dy++) {
        const hw = Math.floor(Math.sqrt(r * r + r * 0.6 - dy * dy));
        g.fillRect(Math.round(L.sunX - hw), Math.round(L.sunY + dy), hw * 2 + 1, 1);
      }
    }
    // clouds drift right
    for (const c of this.clouds) {
      c.off = (c.off + c.sp * dt) % this.cw;
      const o = Math.round(c.off);
      g.drawImage(c.cv, o - this.cw, c.y0);
      g.drawImage(c.cv, o, c.y0);
    }
  }
}

// ---------------------------------------------------------------- dithered glow, drawn with 'lighter'
export function glowSprite(r, rgb, pow = 1.5, sy = 1) {
  const w = r * 2 + 1,
    h = Math.round(r * sy) * 2 + 1;
  const p = new Pix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - r) / r, (y - (h - 1) / 2) / (r * sy));
      if (d >= 1) continue;
      const lvl = Math.floor(Math.pow(1 - d, pow) * 5 + bayer(x, y) * 0.999);
      if (lvl >= 1) p.d[y * w + x] = pack(rgb[0], rgb[1], rgb[2], Math.min(255, 26 + lvl * 34));
    }
  return p.toCanvas();
}

// ---------------------------------------------------------------- mist bands (alpha masks)
export function mistBand(h, seed, dens) {
  const w = W * 2;
  const p = new Pix(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const prof = Math.sin((y / (h - 1)) * Math.PI);
      const n = fbm((x * 12) / w, y * 0.09, seed, 3, 12);
      const v = prof * (0.25 + 0.95 * n) * dens;
      const lvl = Math.floor(v * 4 + bayer(x, y) * 0.999);
      if (lvl > 0) p.d[y * w + x] = pack(255, 255, 255, Math.min(255, lvl * 62));
    }
  return p.toCanvas();
}

export function tint(src, rgb) {
  const { c, g } = makeCanvas(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = `rgb(${rgb.map(Math.round).join(',')})`;
  g.fillRect(0, 0, src.width, src.height);
  return c;
}
