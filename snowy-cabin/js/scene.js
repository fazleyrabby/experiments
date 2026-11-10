// Static art, baked once: mountains, treeline, snowfield, cabin and the pines.
import { W, H, RNG, P, clamp, lerp, smooth, bayer, fbm, vnoise, hash2 } from './util.js';
import { Pix } from './pix.js';

export const HORIZON = 168;
export const MOON = { x: 370, y: 44, r: 11 };
export const WIN = { x: 193, y: 190, w: 21, h: 13 }; // glass of the big window
export const WIN2 = { x: 224, y: 192, w: 7, h: 8 };
export const LANTERN = { x: 183, y: 195 };
export const CHIMNEY = { x: 217, y: 140 };
export const POND = { cx: 352, cy: 238, rx: 44, ry: 8 };
export const DEER_Y = 225;

export const groundY = (x) => HORIZON + Math.round(2.4 * Math.sin(x * 0.013 + 1) + 1.6 * Math.sin(x * 0.031 + 0.4));

const ramp = (a) => a.map(P);
// dithered pick from a colour ramp, v in 0..1
function pick(r, v, x, y, d = 0.6) {
  const f = clamp(v, 0, 0.9999) * (r.length - 1);
  const i = Math.floor(f + bayer(x, y) * d + (1 - d) / 2);
  return r[clamp(i, 0, r.length - 1)];
}

const SNOW = ramp(['#1c2752', '#253466', '#2f447c', '#3b5692', '#4a6aa8', '#5f81bd', '#7c9ad0', '#a2bae4', '#cddcf6']);
const ROOF = ramp(['#4a64a0', '#6381bd', '#7f9dd3', '#a2bae4', '#c4d5f3', '#e6eefc']);
const ICE = ramp(['#101c44', '#162856', '#1d3568', '#27467e', '#35599a']);

export const PAL_MID = {
  g: ramp(['#081820', '#0e2a2e', '#16403e']),
  s: ramp(['#4a64a0', '#7d98cf', '#b4c8ec', '#e8f0fd']),
  trunk: P('#1c1410'),
};
export const PAL_FORE = {
  g: ramp(['#040b14', '#09181f', '#0f272c']),
  s: ramp(['#34498a', '#5874b2', '#8aa5d8', '#c4d5f3']),
  trunk: P('#0e0a0a'),
};
const PAL_FAR = {
  g: ramp(['#0a1430', '#0d1a3a', '#112248']),
  s: ramp(['#1f3466', '#2a467e', '#375a96', '#4468a8']),
  trunk: P('#0a1430'),
};
const PAL_FAR2 = {
  g: ramp(['#0e1a3c', '#122145', '#162a52']),
  s: ramp(['#1d3162', '#243c72', '#2c4882', '#345390']),
  trunk: P('#0e1a3c'),
};

// ---------------------------------------------------------------- pines
// Chevron tiers of boughs, each loaded with snow on its upper side.
export function makePine(o) {
  const { h, w, seed = 1, pal = PAL_MID, snow = 1 } = o;
  const step = o.step || clamp(Math.round(3 + h * 0.04), 3, 13);
  const top = 4;
  const n = Math.max(3, Math.round((h - top - 2.3 * step) / step) + 1);
  const pw = w + 12,
    ph = top + (n - 1) * step + Math.round(2.3 * step) + 1;
  const p = new Pix(pw, ph);
  const cx = pw >> 1;
  const rng = new RNG(seed);
  const big = h > 110 ? 1 : h > 50 ? 0.5 : 0;
  const tw = Math.max(1, Math.round(w * 0.04));
  p.rect(cx - tw, top + (n - 1) * step, tw * 2 + 1, ph - (top + (n - 1) * step), pal.trunk);
  // dark core so tiers never leave holes
  p.poly(
    [
      [cx, top],
      [cx - w * 0.2, top + (n - 0.4) * step],
      [cx + w * 0.2 + 1, top + (n - 0.4) * step],
    ],
    pal.g[0]
  );
  p.vl(cx, top - 3, top + 1, pal.g[0]);
  if (snow > 0.3) p.set(cx, top - 3, pal.s[2]);
  const tiers = [];
  for (let i = 0; i < n; i++) {
    const f = (i + 1) / n;
    const ty = top + i * step;
    const hw = Math.max(2, (w / 2) * Math.pow(f, 0.8) * rng.range(0.86, 1.05));
    const drop = step * rng.range(1.2, 1.55) * (0.7 + 0.3 * f);
    const thick = step * rng.range(1.0, 1.25);
    const sk = rng.range(-0.12, 0.12);
    const T = { ty, hw, drop, sk, i };
    tiers.push(T);
    const ihw = Math.ceil(hw);
    for (let dx = -ihw; dx <= ihw; dx++) {
      const e = Math.abs(dx) / hw;
      if (e > 1) continue;
      const yt = surf(T, dx);
      const tooth = hash2(dx + 500, i, seed);
      const th = thick * (1 - 0.5 * e) + tooth * (1.4 + big * 2);
      const clump = big ? 0.3 + 1.25 * vnoise(dx * (0.3 - big * 0.14) + 9, i * 3.1, seed + 3) : 0.75 + 0.5 * hash2(dx >> 1, i, seed + 3);
      let st = snow * th * 0.52 * clump;
      if (e > 0.88) st *= 0.35;
      const y0 = Math.round(yt),
        y1 = Math.round(yt + th);
      const sn = Math.round(st);
      const lit = dx > -hw * 0.2;
      for (let y = y0; y <= y1; y++) {
        const k = y - y0;
        let c;
        if (k < sn) {
          if (k === 0) c = lit ? pal.s[3] : pal.s[1];
          else if (lit) c = k === sn - 1 && sn > 2 ? pal.s[1] : pal.s[2];
          else c = pal.s[0];
        } else {
          const gk = (k - sn) / Math.max(1, y1 - y0 - sn);
          c = gk > 0.5 ? pal.g[0] : dx > 0 && hash2(dx, y, seed) > 0.55 ? pal.g[2] : pal.g[1];
        }
        p.set(cx + dx, y, c);
      }
    }
  }
  function surf(T, dx) {
    const e = Math.min(1, Math.abs(dx) / T.hw);
    const wob = big ? (vnoise(dx * 0.2 + 31, T.i * 5.3, seed) - 0.5) * step * 0.55 * big : 0;
    return T.ty + T.drop * Math.pow(e, 0.85) * (1 + T.sk * Math.sign(dx)) + wob;
  }
  return { p, cx, baseY: ph - 1, tiers, surf };
}

function tree(o, x, y, amp, slice) {
  const m = makePine(o);
  const spr = m.p.sprite(m.cx, m.baseY);
  return {
    spr,
    x,
    y,
    amp,
    slice,
    sp: 0.9 + hash2(x, y, 3) * 0.6,
    ph: hash2(x, y, 9) * 6.28,
    model: m,
    floor: Math.min(H + 8, y + 1),
    // pine-buffer point -> world
    wx: (px) => x - m.cx + px,
    wy: (py) => y - m.baseY + py,
    row: (py) => py - (m.baseY - spr.oy),
  };
}

function makeTrees() {
  const mid = [
    tree({ h: 58, w: 32, seed: 61, pal: PAL_MID }, 86, 207, 1.0, 4),
    tree({ h: 82, w: 46, seed: 14, pal: PAL_MID }, 134, 211, 1.2, 4),
    tree({ h: 98, w: 54, seed: 27, pal: PAL_MID }, 254, 212, 1.3, 4),
    tree({ h: 62, w: 36, seed: 38, pal: PAL_MID }, 296, 208, 1.0, 4),
  ];
  const fore = [
    tree({ h: 226, w: 96, seed: 5, pal: PAL_FORE, step: 12 }, 20, 294, 2.2, 6),
    tree({ h: 268, w: 132, seed: 9, pal: PAL_FORE, step: 13 }, 466, 296, 2.4, 6),
  ];
  return { mid, fore };
}

// ---------------------------------------------------------------- mountains
function ridged(x, seed, oct = 4) {
  let a = 0.5,
    f = 1,
    s = 0,
    n = 0;
  for (let i = 0; i < oct; i++) {
    const v = vnoise(x * f, seed * 3.7 + i * 11, seed);
    s += a * (1 - Math.abs(2 * v - 1));
    n += a;
    a *= 0.5;
    f *= 2.1;
  }
  return s / n;
}

function drawRange(p, top, pal, haze, seed, hz0) {
  for (let x = 0; x < W; x++) {
    const yt = Math.round(top(x));
    for (let y = yt; y <= HORIZON + 5; y++) {
      const d = y - yt;
      const sx = x - d * 0.6;
      const slope = top(sx + 2.5) - top(sx - 2.5);
      let v = slope > 0.5 ? 0.82 : slope < -0.5 ? 0.2 : 0.5;
      v += (fbm(x * 0.09, y * 0.13, seed, 3) - 0.5) * 0.42;
      if (d < 2 && slope >= -0.5) v += 0.2;
      let c = pick(pal, v, x, y, 0.5);
      const hz = smooth(hz0, HORIZON + 2, y);
      if (bayer(x + 1, y + 2) < hz * 0.9) c = haze;
      p.set(x, y, c);
    }
  }
}

function bakeMountains() {
  const p = new Pix(W, H);
  const far = (x) => 152 - 82 * Math.pow(ridged(x * 0.0082 + 2.3, 3), 1.7);
  const near = (x) => 162 - 58 * Math.pow(ridged(x * 0.0125 + 7.1, 9), 1.5) - 10 * smooth(380, 480, x);
  drawRange(p, far, ramp(['#101b42', '#16264f', '#1d3160', '#2a4479', '#3d5c98', '#5a7ab4']), P('#1d3462'), 3, 104);
  drawRange(p, near, ramp(['#0c1638', '#111f48', '#18295a', '#24396f', '#37528e', '#5876b0', '#86a2d6']), P('#172a56'), 9, 128);
  return p.toCanvas();
}

function bakeTreeline() {
  const p = new Pix(W, H);
  const rng = new RNG(31);
  const rows = [
    { pal: PAL_FAR2, h: [20, 36], gap: [5, 10], dy: 1, snow: 0.6 },
    { pal: PAL_FAR, h: [13, 27], gap: [5, 11], dy: 3, snow: 0.75 },
  ];
  for (const r of rows) {
    let x = -6;
    while (x < W + 8) {
      const h = Math.round(rng.range(r.h[0], r.h[1]));
      const m = makePine({ h, w: Math.round(h * rng.range(0.42, 0.56)), seed: rng.int(1, 9999), pal: r.pal, snow: r.snow, step: h < 18 ? 3 : 4 });
      p.blit(m.p, Math.round(x) - m.cx, groundY(clamp(Math.round(x), 0, W - 1)) + r.dy - m.baseY);
      x += rng.range(r.gap[0], r.gap[1]);
    }
  }
  return p.toCanvas();
}

// ---------------------------------------------------------------- ground
const PATH = [
  [171, 217],
  [166, 244],
  [214, 274],
];
const bez = (t) => {
  const u = 1 - t;
  return [u * u * PATH[0][0] + 2 * u * t * PATH[1][0] + t * t * PATH[2][0], u * u * PATH[0][1] + 2 * u * t * PATH[1][1] + t * t * PATH[2][1]];
};
const pondE = (x, y) => ((x - POND.cx) / POND.rx) ** 2 + ((y - POND.cy) / POND.ry) ** 2;

function bakeGround(trees) {
  const p = new Pix(W, H);
  const lv = new Float32Array(W * H).fill(-1);
  for (let y = HORIZON - 5; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < groundY(x)) continue;
      const d = (y - HORIZON) / (H - HORIZON);
      const sx = x * (0.019 - 0.008 * d),
        sy = y * (0.13 - 0.075 * d);
      const n = fbm(sx, sy, 21, 3),
        nR = fbm(sx + 0.05, sy, 21, 3);
      let v = 0.52 + (n - 0.5) * 0.62 + (n - nR) * 3.6;
      v -= 0.13 * smooth(0.7, 1, d);
      v -= 0.14 * (1 - smooth(0, 0.1, d));
      lv[y * W + x] = v;
    }
  }
  const sub = (x, y, a) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (lv[i] >= 0) lv[i] = Math.max(0, lv[i] - a);
  };
  // cabin shadow, thrown down-left by the moon
  const sh = new Pix(W, H);
  sh.poly(
    [
      [146, 216],
      [240, 216],
      [204, 233],
      [106, 233],
    ],
    1
  );
  for (let i = 0; i < W * H; i++) if (sh.d[i] && lv[i] >= 0) lv[i] = Math.max(0, lv[i] - 0.2);
  // pine shadows
  for (const t of trees.mid) for (let dy = -2; dy <= 3; dy++) for (let dx = -16; dx <= 6; dx++) if ((dx + 5) ** 2 / 121 + dy ** 2 / 6 < 1) sub(t.x + dx - dy * 2, t.y + 1 + dy, 0.13);
  // trodden path
  const path = new Float32Array(W * H);
  for (let k = 0; k <= 160; k++) {
    const t = k / 160;
    const [bx, by] = bez(t);
    const r = lerp(2.4, 9.5, t);
    for (let y = Math.floor(by - r * 0.5); y <= by + r * 0.5; y++)
      for (let x = Math.floor(bx - r); x <= bx + r; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const dd = Math.hypot((x - bx) / r, (y - by) / (r * 0.5));
        if (dd < 1) path[y * W + x] = Math.max(path[y * W + x], 1 - dd);
      }
  }
  for (let i = 0; i < W * H; i++) if (path[i] > 0 && lv[i] >= 0) lv[i] = Math.max(0, lv[i] - 0.2 * smooth(0, 0.5, path[i]));
  for (let k = 1; k < 15; k++) {
    const t = k / 15;
    const [bx, by] = bez(t);
    const r = lerp(2.4, 9.5, t);
    const side = k % 2 ? 1 : -1;
    const fx = bx + side * r * 0.32;
    const wdt = t > 0.55 ? 3 : 2;
    for (let j = 0; j < wdt; j++) sub(fx + j, by, 0.3);
    if (t > 0.7) for (let j = 0; j < wdt; j++) sub(fx + j, by + 1, 0.16);
  }
  // pond bank
  for (let y = POND.cy - 14; y <= POND.cy + 14; y++)
    for (let x = POND.cx - 60; x <= POND.cx + 60; x++) {
      const e = pondE(x, y);
      if (e >= 1 && e < 1.42 && lv[y * W + x] >= 0) lv[y * W + x] += y < POND.cy ? -0.16 : 0.13;
    }

  const glints = [];
  const gr = new RNG(88);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = lv[y * W + x];
      if (v < 0) continue;
      p.d[y * W + x] = pick(SNOW, v, x, y, 0.5);
      if (v > 0.6 && gr.chance(0.012)) glints.push({ x, y });
    }

  // ice
  const mask = new Pix(W, H);
  for (let y = POND.cy - 10; y <= POND.cy + 10; y++)
    for (let x = POND.cx - 46; x <= POND.cx + 46; x++) {
      const e = pondE(x, y);
      if (e >= 1) continue;
      let v = 0.22 + 0.55 * fbm(x * 0.05, y * 0.5, 5, 3) + 0.12 * ((y - POND.cy) / POND.ry);
      if (e > 0.82) v -= y < POND.cy ? 0.25 : -0.3;
      let c = pick(ICE, v, x, y, 0.7);
      if (e > 0.25 && fbm(x * 0.07 + 4, y * 0.55, 11, 2) > 0.68) c = SNOW[4 + (bayer(x, y) > 0.5 ? 1 : 0)];
      p.d[y * W + x] = c;
      mask.d[y * W + x] = 0xffffffff;
    }
  const crack = P('#4a70b0');
  const cr = (a, b, c, d) => p.line(a, b, c, d, (x, y) => (pondE(x, y) < 0.85 ? crack : 0));
  cr(326, 238, 341, 235);
  cr(341, 235, 360, 241);
  cr(349, 237, 356, 233);
  cr(372, 240, 384, 236);

  // old fence leading the eye back to the cabin
  const wood = P('#241812'),
    woodL = P('#4a3526'),
    cap = P('#b4c8ec'),
    capH = P('#e6eefc'),
    capS = P('#6381bd');
  const posts = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    posts.push({ x: Math.round(lerp(264, 322, t)), y: Math.round(lerp(226, 268, t)), h: Math.round(lerp(8, 17, t)), w: t > 0.4 ? 3 : 2 });
  }
  for (let i = 0; i < posts.length - 1; i++) {
    const a = posts[i],
      b = posts[i + 1];
    for (const f of [0.32, 0.7]) {
      const ya = a.y - a.h * f,
        yb = b.y - b.h * f;
      p.line(a.x + 1, ya, b.x, yb, wood);
      if (i > 1) p.line(a.x + 1, ya + 1, b.x, yb + 1, wood);
      for (let x = a.x + 2; x < b.x; x++) if (hash2(x, i, 4) > 0.35) p.set(x, Math.round(lerp(ya, yb, (x - a.x) / (b.x - a.x))) - 1, f > 0.5 ? cap : capS);
    }
  }
  for (const q of posts) {
    p.rect(q.x, q.y - q.h, q.w, q.h, wood);
    p.vl(q.x + q.w - 1, q.y - q.h, q.y - 1, woodL);
    p.rect(q.x - 1, q.y - q.h - 2, q.w + 2, 2, cap);
    p.hl(q.x, q.x + q.w - 1, q.y - q.h - 3, capH);
    p.hl(q.x - 1, q.x + q.w, q.y, capS);
  }
  return { cv: p.toCanvas(), pondMask: mask.toCanvas(), glints };
}

// ---------------------------------------------------------------- cabin
function bakeCabin() {
  const p = new Pix(W, H);
  const x0 = 146,
    x1 = 238,
    yT = 182,
    yB = 215;
  const L = { hi: P('#6a4730'), base: P('#523524'), lo: P('#3a2418'), gap: P('#1d120e'), end: P('#7a5638'), endD: P('#3c2619') };
  const dark = P('#24160f');
  // log wall
  for (let y = yT; y < yB; y++) {
    const r = (y - yT) % 4;
    for (let x = x0; x <= x1; x++) {
      let c = r === 0 ? L.hi : r === 3 ? L.gap : r === 2 ? L.lo : L.base;
      if (r === 1 && hash2(x >> 1, y, 5) < 0.16) c = L.lo;
      if (r === 0 && hash2(x >> 2, y, 6) < 0.2) c = L.base;
      p.set(x, y, c);
    }
  }
  // corner log ends
  for (let y = yT; y < yB; y += 4) {
    for (const cx of [x0 - 2, x1 - 1]) {
      p.rect(cx, y, 4, 3, L.end);
      p.set(cx + 1, y + 1, L.endD);
      p.set(cx + 2, y + 1, L.endD);
      p.hl(cx, cx + 3, y + 3, L.gap);
    }
  }
  // door
  p.rect(164, 191, 15, 24, dark);
  for (let y = 192; y < 215; y++) for (let x = 165; x <= 177; x++) p.set(x, y, (x - 165) % 4 === 3 ? P('#33200f') : hash2(x, y >> 2, 3) < 0.2 ? P('#553722') : P('#4a2f1e'));
  p.hl(165, 177, 198, P('#33200f'));
  p.hl(165, 177, 208, P('#33200f'));
  p.set(175, 204, P('#e2aa3c'));
  p.set(175, 205, P('#a8742a'));
  // lantern by the door
  p.hl(181, 184, 192, dark);
  p.set(183, 193, dark);
  p.rect(182, 194, 3, 4, P('#ffcf73'));
  p.set(183, 195, P('#fff3d0'));
  p.set(183, 196, P('#fff3d0'));
  p.hl(182, 184, 198, dark);
  p.hl(182, 184, 194, P('#7a4a1e'));

  // big window
  p.rect(WIN.x - 2, WIN.y - 2, WIN.w + 4, WIN.h + 4, dark);
  for (let y = 0; y < WIN.h; y++)
    for (let x = 0; x < WIN.w; x++) {
      const dx = (x - WIN.w / 2 + 0.5) / (WIN.w / 2),
        dy = (y - WIN.h * 0.45) / (WIN.h / 2);
      const d = Math.sqrt(dx * dx + dy * dy * 1.2);
      const v = 1 - d * 0.62 - (y > WIN.h - 4 ? 0.12 : 0);
      p.set(WIN.x + x, WIN.y + y, pick(ramp(['#d9762a', '#ee9a3a', '#fbb955', '#ffd27a', '#ffe9a6']), v, x, y, 0.7));
    }
  // curtains
  const cur = P('#b5482a'),
    curD = P('#8a3220');
  for (let k = 0; k < 6; k++) {
    p.hl(WIN.x, WIN.x + 5 - k, WIN.y + k, k % 2 ? curD : cur);
    p.hl(WIN.x + WIN.w - 6 + k, WIN.x + WIN.w - 1, WIN.y + k, k % 2 ? curD : cur);
  }
  // frost in the lower corners, snow on the sill
  for (const [fx, fy] of [[0, 12], [1, 12], [0, 11], [20, 12], [19, 12], [20, 11], [9, 12], [11, 12]]) p.set(WIN.x + fx, WIN.y + fy, P('#fff6dc'));
  p.hl(WIN.x - 3, WIN.x + WIN.w + 2, WIN.y + WIN.h + 2, L.hi);
  for (let x = WIN.x - 3; x <= WIN.x + WIN.w + 2; x++) {
    p.set(x, WIN.y + WIN.h + 1, ROOF[4]);
    if (hash2(x >> 1, 2, 7) > 0.45) p.set(x, WIN.y + WIN.h, ROOF[5]);
  }
  // shutters
  for (const sx of [WIN.x - 6, WIN.x + WIN.w + 3]) {
    p.rect(sx, WIN.y - 2, 3, WIN.h + 4, P('#2c4636'));
    for (let y = WIN.y - 1; y < WIN.y + WIN.h + 2; y += 2) p.hl(sx, sx + 2, y, P('#1d3026'));
  }
  // small window
  p.rect(WIN2.x - 1, WIN2.y - 1, WIN2.w + 2, WIN2.h + 2, dark);
  for (let y = 0; y < WIN2.h; y++) for (let x = 0; x < WIN2.w; x++) p.set(WIN2.x + x, WIN2.y + y, pick(ramp(['#e58a32', '#fbb955', '#ffd27a']), 0.75 - Math.abs(x - 3) * 0.12 - y * 0.05, x, y, 0.8));
  p.vl(WIN2.x + 3, WIN2.y, WIN2.y + WIN2.h - 1, dark);
  p.hl(WIN2.x, WIN2.x + WIN2.w - 1, WIN2.y + 3, dark);
  p.hl(WIN2.x - 1, WIN2.x + WIN2.w, WIN2.y + WIN2.h + 1, ROOF[4]);

  // snowy roof
  const rY = 157,
    eY = 183;
  const RL = (y) => lerp(152, 137, (y - rY) / (eY - rY)),
    RR = (y) => lerp(232, 247, (y - rY) / (eY - rY));
  for (let x = 132; x <= 252; x++) {
    const yTop = rY - 1 - Math.round(1.6 * vnoise(x * 0.2, 1, 4));
    const yBot = eY + 1 + Math.round(0.9 * Math.sin(x * 0.33) + 1.3 * vnoise(x * 0.42, 3, 8));
    for (let y = yTop; y <= yBot; y++) {
      const yy = clamp(y, rY, eY);
      if (x < RL(yy) || x > RR(yy)) continue;
      const u = (x - RL(yy)) / (RR(yy) - RL(yy)),
        vv = (yy - rY) / (eY - rY);
      let v = 0.74 - vv * 0.2 + (u - 0.5) * 0.2 + (fbm(x * 0.07, y * 0.17, 12, 3) - 0.5) * 0.45;
      if (y <= yTop + 1) v += 0.22;
      if (y >= yBot) v -= 0.35;
      else if (y >= yBot - 1) v -= 0.12;
      p.set(x, y, pick(ROOF, v, x, y, 0.55));
    }
    // shadow under the snow lip
    if (x >= x0 - 2 && x <= x1 + 2) {
      p.set(x, yBot + 1, L.gap);
      if (hash2(x, 1, 2) > 0.4) p.set(x, yBot + 2, L.lo);
    }
    // icicles
    if (x > 138 && x < 246 && hash2(x, 9, 13) > 0.72) {
      const len = 1 + Math.floor(hash2(x, 3, 17) * 4);
      p.vl(x, yBot + 1, yBot + len, ROOF[4]);
      p.set(x, yBot + len, ROOF[2]);
    }
  }
  p.line(151, rY, 136, eY, ROOF[0]);
  p.line(233, rY, 248, eY, ROOF[5]);

  // stone chimney
  const cx0 = 211,
    cx1 = 222,
    cy0 = 145,
    cy1 = 172;
  for (let y = cy0; y <= cy1; y++)
    for (let x = cx0; x <= cx1; x++) {
      const row = Math.floor((y - cy0) / 3);
      const mortar = (y - cy0) % 3 === 2 || (x - cx0 + (row % 2) * 3) % 6 === 0;
      let c = x >= cx1 - 2 ? P('#7b8298') : x <= cx0 + 1 ? P('#3c4256') : P('#575d74');
      if (hash2(x >> 1, row, 21) < 0.25) c = P('#4a5066');
      p.set(x, y, mortar ? P('#272c3e') : c);
    }
  p.rect(cx0 - 1, cy0 - 2, cx1 - cx0 + 3, 2, P('#6a7086'));
  p.hl(cx0 - 1, cx1 + 1, cy0 - 3, ROOF[4]);
  p.hl(cx0, cx1, cy0 - 4, ROOF[5]);
  p.hl(cx0 + 4, cx1 - 4, cy0 - 3, P('#1a1c28'));
  p.hl(cx0 - 2, cx1 + 2, cy1 + 1, ROOF[4]);
  p.hl(cx0 - 1, cx1 + 3, cy1 + 2, ROOF[3]);

  // doorstep, drift against the wall
  p.rect(161, 213, 21, 3, ROOF[3]);
  p.hl(162, 180, 212, ROOF[5]);
  for (let x = x0 - 4; x <= x1 + 4; x++) {
    if (x >= 161 && x <= 181) continue;
    const hgt = Math.round(1.2 + 1.4 * vnoise(x * 0.18, 5, 19));
    for (let k = 0; k < hgt; k++) p.set(x, yB - k, k === hgt - 1 ? ROOF[4] : ROOF[2]);
    p.set(x, yB + 1, SNOW[5]);
  }

  // woodpile
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4 - (r === 2 ? 1 : 0); c++) {
      const lx = 243 + c * 4 + (r % 2) * 2,
        ly = 212 - r * 4;
      p.rect(lx, ly, 3, 3, L.end);
      p.set(lx + 1, ly + 1, L.endD);
      p.hl(lx, lx + 2, ly + 3, L.gap);
    }
  p.hl(244, 257, 203, ROOF[4]);
  p.hl(245, 256, 202, ROOF[5]);
  p.hl(243, 258, 216, SNOW[5]);

  // snowman
  const sm = 116;
  const ball = (cx, cy, r) => {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++)
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy > r * r + r * 0.7) continue;
        const l = (dx * 0.8 - dy * 0.6) / r;
        p.set(cx + dx, cy + dy, l > 0.35 ? ROOF[5] : l > -0.35 ? ROOF[3] : ROOF[1]);
      }
  };
  ball(sm, 214, 5.2);
  ball(sm, 206, 4);
  ball(sm, 200, 2.8);
  p.hl(sm - 4, sm + 3, 219, SNOW[2]);
  p.line(sm - 4, 205, sm - 9, 201, P('#2c1c12'));
  p.line(sm + 4, 205, sm + 9, 202, P('#2c1c12'));
  p.set(sm + 9, 201, P('#2c1c12'));
  p.hl(sm - 3, sm + 3, 203, P('#b03434'));
  p.set(sm + 3, 204, P('#b03434'));
  p.set(sm + 4, 205, P('#8a2626'));
  p.set(sm - 1, 199, P('#12101a'));
  p.set(sm + 1, 199, P('#12101a'));
  p.set(sm + 2, 200, P('#ff9a3c'));
  p.set(sm + 3, 200, P('#ff9a3c'));
  p.set(sm, 206, P('#12101a'));
  p.set(sm, 209, P('#12101a'));
  p.rect(sm - 2, 194, 5, 3, P('#16121e'));
  p.hl(sm - 3, sm + 3, 197, P('#16121e'));
  p.hl(sm - 2, sm + 2, 196, P('#b03434'));
  p.hl(sm - 2, sm + 2, 193, ROOF[4]);
  return p.toCanvas();
}

export function buildScene() {
  const trees = makeTrees();
  const ground = bakeGround(trees);
  return {
    mountains: bakeMountains(),
    treeline: bakeTreeline(),
    ground: ground.cv,
    pondMask: ground.pondMask,
    glints: ground.glints,
    cabin: bakeCabin(),
    trees,
  };
}
