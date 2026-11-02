// Procedural pixel-art sprite generators: trees, plants, rocks, clouds.
import { PX, Rng, clamp, bay, makeNoise } from './util.js';

export const PAL = {
  pine: ['#06201d', '#0d3629', '#154d30', '#206838', '#34853f', '#4fa24a', '#7dc15a'],
  oak: ['#0f3520', '#19501f', '#26692a', '#3a8634', '#56a43c', '#80c14a', '#b4dc62'],
  oakWarm: ['#1c3a1a', '#2f5a1e', '#487a25', '#6a9a2c', '#92b838', '#bdd44a', '#e6e870'],
  birch: ['#2c5c2c', '#42782f', '#62963a', '#86b448', '#addc5c', '#d2ee7c'],
  grass: ['#173e1f', '#205524', '#2c7229', '#3d8e34', '#58a940', '#7cc352', '#a8da66'],
  bark: ['#1e110c', '#34200f', '#4e301a', '#6c4626', '#8c6236'],
  rock: ['#242a32', '#3a424d', '#525d69', '#6f7c89', '#93a0ac', '#b8c3cc'],
  sand: ['#6b5a3a', '#907c52', '#b49c68', '#d2bf8a', '#e8dcaa'],
  dirt: ['#3a2616', '#53361e', '#6e4a2b', '#8a6339', '#a98249', '#c4a064'],
  water: ['#0a2a40', '#10405c', '#1a5d7c', '#2a7f9c', '#46a4b4', '#7ccdc8', '#c2eee6'],
  cloud: ['#8696b8', '#a8b8d4', '#c8d6ea', '#e4edf8', '#ffffff'],
};

// ---------- pine ----------
export function makePine(seed, h) {
  const r = new Rng(seed);
  const w = (Math.round(h * 0.5) | 1) + 0;
  const px = new PX(w, h);
  const cx = (w - 1) / 2;
  const R = PAL.pine, n = R.length;
  const trunkH = Math.max(3, Math.round(h * 0.075));
  const bot = h - trunkH;
  const tiers = Math.max(3, Math.round(h / 8.5));
  const tH = bot / tiers;
  // trunk (drawn first so low branches overlap it)
  const tw = h > 70 ? 3 : 2;
  for (let y = bot - 2; y < h; y++)
    for (let k = 0; k < tw; k++) {
      const x = Math.round(cx - (tw - 1) / 2 + k);
      px.p(x, y, PAL.bark[k === 0 ? 3 : k === tw - 1 ? 1 : 2]);
    }
  px.p(Math.round(cx - tw / 2) - 1, h - 1, PAL.bark[2]);
  px.p(Math.round(cx + tw / 2), h - 1, PAL.bark[1]);
  for (let y = 0; y < bot; y++) {
    const ti = Math.floor(y / tH);
    const local = y / tH - ti;
    const tierEnd = Math.min(bot, (ti + 1) * tH);
    const Rend = (w / 2 - 0.6) * (0.1 + 0.9 * (tierEnd / bot));
    let rad = Rend * (0.4 + 0.6 * Math.pow(local, 0.8));
    rad += (r.next() - 0.5) * (local > 0.55 ? 1.3 : 0.4);
    if (local > 0.84) rad += 1.1;
    if (y === 0) rad = 0.2;
    rad = Math.max(rad, 0.3);
    const x0 = Math.round(cx - rad), x1 = Math.round(cx + rad);
    for (let x = x0; x <= x1; x++) {
      const u = (x - cx) / (rad + 0.4);
      let s = 0.66 - u * 0.34 - local * 0.24 + (r.next() - 0.5) * 0.14;
      if (ti % 2) s -= 0.03;
      let idx = clamp(Math.floor(s * (n - 1) + bay(x, y)), 0, n - 1);
      if (x === x1 && x1 > x0) idx = Math.max(0, idx - 1);
      if (x === x0 && x1 - x0 > 2) idx = Math.min(n - 1, idx + 1);
      if (local > 0.9) idx = Math.max(0, idx - 1);
      if (r.next() < 0.05 && u < 0.1) idx = Math.min(n - 1, idx + 1);
      px.p(x, y, R[idx]);
    }
  }
  return px.cv;
}

// ---------- broadleaf ----------
function shadeClump(px, R, ccx, ccy, rad, cluster, r, bias = 0) {
  const n = R.length;
  const y0 = Math.floor(ccy - rad), y1 = Math.ceil(ccy + rad);
  const x0 = Math.floor(ccx - rad), x1 = Math.ceil(ccx + rad);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const dx = (x + 0.5 - ccx) / rad, dy = (y + 0.5 - ccy) / rad;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2);
      let s = 0.44 + 0.5 * (-0.55 * dx - 0.66 * dy + 0.46 * nz) + bias;
      s += (r.next() - 0.5) * 0.16;
      if (d2 > 0.72 && dx + dy > 0) s -= 0.14;
      if (d2 > 0.78 && dx + dy < -0.2) s += 0.06;
      let idx = clamp(Math.floor(s * (n - 1) + bay(x, y) - 0.1), 0, n - 1);
      // leaf-cluster speckle
      const q = r.next();
      if (q < 0.07 && dx + dy < 0.4) idx = Math.min(n - 1, idx + 1);
      else if (q > 0.95) idx = Math.max(0, idx - 1);
      px.p(x, y, R[idx]);
    }
}

export function makeOak(seed, h, opts = {}) {
  const r = new Rng(seed);
  const w = Math.round(h * (opts.wide || 0.92)) | 1;
  const px = new PX(w, h);
  const R = opts.ramp || PAL.oak;
  const cx = (w - 1) / 2;
  const trunkTop = Math.round(h * 0.42);
  const tw = Math.max(2, Math.round(h * 0.07));
  for (let y = trunkTop; y < h; y++) {
    const f = (y - trunkTop) / (h - trunkTop);
    const half = tw / 2 + f * 1.1 + (y >= h - 3 ? 1.4 : 0);
    const bend = Math.sin(f * 2.4 + seed) * 1.2 * (1 - f);
    const x0 = Math.round(cx + bend - half), x1 = Math.round(cx + bend + half);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / Math.max(1, x1 - x0);
      let idx = u < 0.34 ? 3 : u < 0.72 ? 2 : 1;
      if (r.next() < 0.1) idx = Math.max(0, idx - 1);
      px.p(x, y, PAL.bark[idx]);
    }
  }
  // limbs
  for (let k = 0; k < 3; k++) {
    const dir = k === 0 ? -1 : k === 1 ? 1 : r.chance(0.5) ? -1 : 1;
    const sy = trunkTop + 6 + k * 3;
    px.line(cx, sy, cx + dir * (6 + k * 2), sy - 8 - k, PAL.bark[2]);
  }
  const rx = w * 0.47, ry = h * 0.35, ccx = cx, ccy = h * 0.37;
  const cnt = Math.round(7 + h / 8);
  const clumps = [];
  for (let i = 0; i < cnt; i++) {
    const a = r.next() * Math.PI * 2, d = Math.sqrt(r.next());
    const x = ccx + Math.cos(a) * d * rx * 0.66;
    const y = ccy + Math.sin(a) * d * ry * 0.7;
    clumps.push({ x, y, rad: r.range(h * 0.11, h * 0.18) });
  }
  clumps.sort((a, b) => a.y - b.y);
  for (const c of clumps) shadeClump(px, R, c.x, c.y, c.rad, 0, r, (0.5 - c.y / h) * 0.12);
  return px.cv;
}

export function makeBirch(seed, h) {
  const r = new Rng(seed);
  const w = Math.round(h * 0.7) | 1;
  const px = new PX(w, h);
  const cx = (w - 1) / 2;
  const trunkTop = Math.round(h * 0.4);
  for (let y = trunkTop; y < h; y++) {
    const bend = Math.sin((y / h) * 3 + seed) * 0.8;
    const x = Math.round(cx + bend);
    px.p(x - 1, y, '#f0ecdf');
    px.p(x, y, '#c9c4b4');
    if (y > h - 3) px.p(x + 1, y, '#8a8678');
    if (r.next() < 0.22) px.p(x - 1, y, '#2a2a2e');
    if (r.next() < 0.1) px.p(x, y, '#3a3a40');
  }
  const cnt = Math.round(5 + h / 9);
  const clumps = [];
  for (let i = 0; i < cnt; i++) {
    const a = r.next() * Math.PI * 2, d = Math.sqrt(r.next());
    clumps.push({ x: cx + Math.cos(a) * d * w * 0.3, y: h * 0.3 + Math.sin(a) * d * h * 0.26, rad: r.range(h * 0.1, h * 0.15) });
  }
  clumps.sort((a, b) => a.y - b.y);
  for (const c of clumps) shadeClump(px, PAL.birch, c.x, c.y, c.rad, 0, r, 0.06);
  return px.cv;
}

export function makeBush(seed, w, h, ramp = PAL.oak, flowers = null) {
  const r = new Rng(seed);
  const px = new PX(w, h);
  const cnt = Math.max(3, Math.round(w / 6));
  const cl = [];
  for (let i = 0; i < cnt; i++) {
    const t = cnt === 1 ? 0.5 : i / (cnt - 1);
    const rad = r.range(h * 0.34, h * 0.52);
    cl.push({ x: 3 + t * (w - 6), y: h - rad - r.range(0, h * 0.2), rad });
  }
  cl.sort((a, b) => a.y - b.y);
  for (const c of cl) shadeClump(px, ramp, c.x, c.y, c.rad, 0, r, 0);
  if (flowers) for (let i = 0; i < w / 2.5; i++) px.p(r.int(2, w - 3), r.int(1, h - 3), r.pick(flowers));
  return px.cv;
}

// ---------- ground cover ----------
export function makeGrass(seed, h, ramp = PAL.grass) {
  const r = new Rng(seed);
  const w = Math.round(h * 0.9) | 1;
  const px = new PX(w, h);
  const blades = 5 + Math.floor(h / 4);
  for (let b = 0; b < blades; b++) {
    const bx = r.range(1, w - 2);
    const len = r.range(h * 0.45, h);
    const lean = r.range(-1, 1) * h * 0.35 + (bx - w / 2) * 0.25;
    for (let s = 0; s < len; s++) {
      const t = s / len;
      const x = Math.round(bx + lean * t * t);
      const y = h - 1 - s;
      let idx = Math.round(1 + t * 4 + r.range(-0.4, 0.5));
      idx = clamp(idx, 0, ramp.length - 1);
      px.p(x, y, ramp[idx]);
      if (t > 0.88 && r.next() < 0.3) px.p(x + 1, y + 1, ramp[Math.max(0, idx - 1)]);
    }
  }
  return px.cv;
}

export function makeReed(seed, h) {
  const r = new Rng(seed);
  const px = new PX(7, h);
  const bend = r.range(-2, 2);
  for (let s = 0; s < h; s++) {
    const t = s / h;
    const x = Math.round(3 + bend * t * t);
    px.p(x, h - 1 - s, t < 0.5 ? '#2a5a2a' : '#4a8a3c');
    if (t > 0.12 && t < 0.5 && r.next() < 0.5) px.p(x + (r.chance(0.5) ? 1 : -1), h - 1 - s, '#3d7a34');
  }
  const top = h - 1 - Math.round(h * 0.88);
  const tx = Math.round(3 + bend * 0.77);
  if (r.chance(0.7)) {
    px.rect(tx - 1, top, 2, 5, '#5a3a22');
    px.rect(tx - 1, top, 1, 5, '#7a5230');
    px.p(tx, top - 1, '#3d7a34');
  }
  return px.cv;
}

export function makeFlower(kind, seed) {
  const r = new Rng(seed);
  const px = new PX(9, 12);
  const sx = 4;
  const stem = (len, c = '#2f7a2d') => {
    for (let i = 0; i < len; i++) px.p(sx, 11 - i, i % 3 === 0 ? '#3d9a38' : c);
    px.p(sx - 1, 10 - (len >> 2), '#4aa93e');
    px.p(sx + 1, 9 - (len >> 2), '#3d8e34');
  };
  const sets = {
    daisy: () => {
      stem(6);
      const cy = 4;
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) px.p(sx + dx, cy + dy, '#fbfbf0');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px.p(sx + dx, cy + dy, '#e4e8d8');
      px.p(sx, cy, '#f6c334');
    },
    poppy: () => {
      stem(6);
      for (const [dx, dy] of [[-2, 3], [-1, 2], [0, 2], [1, 2], [2, 3], [-2, 4], [2, 4], [-1, 5], [0, 5], [1, 5]]) px.p(sx + dx, dy, '#d6362a');
      for (const [dx, dy] of [[-1, 3], [1, 3], [-1, 4], [1, 4]]) px.p(sx + dx, dy, '#f0553a');
      px.p(sx, 3, '#2a1418'); px.p(sx, 4, '#3a1c20');
      px.p(sx - 2, 3, '#a8261e');
    },
    lupine: () => {
      stem(5);
      const cols = ['#a58af0', '#8c6ae0', '#7552cc', '#5b3ea8'];
      for (let i = 0; i < 8; i++) {
        const wdt = i < 2 ? 1 : i < 5 ? 3 : 3;
        for (let k = 0; k < wdt; k++) px.p(sx - (wdt >> 1) + k, 1 + i, cols[(i + k + (i > 4 ? 1 : 0)) % cols.length]);
      }
      px.p(sx, 0, '#c8b6ff');
    },
    buttercup: () => {
      stem(6);
      for (const [dx, dy] of [[-1, 3], [1, 3], [0, 2], [0, 4]]) px.p(sx + dx, dy, '#ffd93a');
      px.p(sx, 3, '#fff2a0');
      px.p(sx - 1, 2, '#e8b020'); px.p(sx + 1, 4, '#e8b020');
    },
    bluebell: () => {
      stem(8);
      for (const [dx, dy, c] of [[0, 1, '#6a8cf0'], [1, 2, '#4d6cd8'], [1, 3, '#7a9cff'], [-1, 3, '#4d6cd8'], [-1, 4, '#6a8cf0'], [0, 4, '#4d6cd8'], [0, 5, '#7a9cff'], [1, 5, '#5476e0']])
        px.p(sx + dx, dy + 1, c);
    },
    cosmos: () => {
      stem(6);
      const cy = 4;
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0], [-1, -1], [1, 1], [-1, 1], [1, -1]]) px.p(sx + dx, cy + dy, '#f27cb8');
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) px.p(sx + dx, cy + dy, '#fba6d2');
      px.p(sx, cy, '#ffd93a');
      px.p(sx - 2, cy - 1, '#d8589a');
    },
    allium: () => {
      stem(7);
      for (const [dx, dy] of [[-1, 1], [0, 0], [1, 1], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [-1, 3], [0, 3], [1, 3], [0, 1]])
        px.p(sx + dx, dy + 1, (dx + dy) % 2 ? '#c46ae0' : '#a24ac8');
      px.p(sx - 1, 2, '#e6a0f6');
    },
  };
  sets[kind]();
  return px.cv;
}

export function makeRock(seed, w, h, moss = 0.4) {
  const r = new Rng(seed);
  const px = new PX(w, h);
  const R = PAL.rock, n = R.length;
  const cx = (w - 1) / 2, cy = h * 0.62;
  const noise = makeNoise(seed);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / (w / 2), dy = (y - cy) / (h * 0.5);
      const edge = 1 + (noise(x * 0.35, y * 0.35) - 0.5) * 0.5;
      const d2 = dx * dx + dy * dy * (dy < 0 ? 1.3 : 2.4);
      if (d2 > edge) continue;
      const nz = Math.sqrt(Math.max(0, 1 - d2 / edge));
      let s = 0.5 + 0.5 * (-0.5 * dx - 0.7 * dy + 0.5 * nz) - 0.12;
      s += (noise(x * 0.9, y * 0.9) - 0.5) * 0.3;
      let idx = clamp(Math.floor(s * (n - 1) + bay(x, y)), 0, n - 1);
      if (y > h - 2) idx = Math.min(idx, 1);
      let col = R[idx];
      if (moss > 0 && dy < -0.15 && noise(x * 0.5 + 9, y * 0.5) < moss) col = PAL.grass[clamp(idx, 1, 5)];
      px.p(x, y, col);
    }
  return px.cv;
}

export function makeMushroom(seed) {
  const px = new PX(7, 7);
  const big = seed % 2;
  px.rect(3, 4, 1, 3, '#e8dfc8');
  px.p(4, 5, '#bdb39a');
  const capC = ['#d6362a', '#f0553a', '#a8261e'];
  for (const [x, y, c] of [[2, 2, 0], [3, 2, 1], [4, 2, 0], [1, 3, 0], [2, 3, 1], [3, 3, 1], [4, 3, 0], [5, 3, 2], [3, 1, 1]]) px.p(x + (big ? 0 : 0), y, capC[c]);
  px.p(2, 2, '#fbf3e2'); px.p(4, 3, '#fbf3e2');
  return px.cv;
}

// ---------- clouds ----------
export function makeCloud(seed, w, h) {
  const r = new Rng(seed);
  const px = new PX(w, h);
  const R = PAL.cloud, n = R.length;
  const base = h - 2;
  const puffs = [];
  const cnt = Math.round(3 + w / 22);
  for (let i = 0; i < cnt; i++) {
    const t = (i + 0.5) / cnt;
    const mid = 1 - Math.abs(t - 0.5) * 1.5;
    const rad = r.range(h * 0.3, h * 0.55) * (0.55 + 0.6 * mid);
    puffs.push({ x: 4 + t * (w - 8) + r.range(-3, 3), y: base - rad * r.range(0.45, 0.85), rad });
  }
  puffs.sort((a, b) => a.rad - b.rad);
  for (const c of puffs) {
    for (let y = Math.floor(c.y - c.rad); y <= base; y++)
      for (let x = Math.floor(c.x - c.rad); x <= Math.ceil(c.x + c.rad); x++) {
        const dx = (x + 0.5 - c.x) / c.rad, dy = (y + 0.5 - c.y) / c.rad;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1 || y > base) continue;
        const nz = Math.sqrt(1 - d2);
        let s = 0.55 + 0.5 * (-0.25 * dx - 0.75 * dy + 0.5 * nz) - ((y - c.y) / h) * 0.2;
        const idx = clamp(Math.floor(s * (n - 1) + bay(x, y) - 0.2), 0, n - 1);
        px.p(x, y, R[idx]);
      }
  }
  // flat, shaded underside
  for (let x = 0; x < w; x++) {
    const d = r.chance(0.6) ? 1 : 0;
    px.p(x, base + d, R[0]);
  }
  return px.cv;
}

// wispy cirrus: 1px streaks
export function makeWisp(seed, w, h) {
  const r = new Rng(seed);
  const px = new PX(w, h);
  for (let row = 0; row < h; row++) {
    const y = row;
    const len = Math.round(w * r.range(0.4, 1) * (1 - Math.abs(row - h / 2) / (h * 0.9)));
    const x0 = Math.round((w - len) / 2 + r.range(-6, 6));
    for (let x = x0; x < x0 + len; x++) if (bay(x, y) < 0.7 - (Math.abs(x - w / 2) / w)) px.p(x, y, row % 2 ? PAL.cloud[3] : PAL.cloud[4]);
  }
  return px.cv;
}
