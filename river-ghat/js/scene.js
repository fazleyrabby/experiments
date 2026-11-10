// Static art, baked once in neutral morning light. The renderer grades it for the time of day.
import { W, H, RNG, P, clamp, lerp, smooth, bayer, fbm, vnoise, hash2 } from './util.js';
import { Pix } from './pix.js';

export const HZ = 118; // far bank waterline
export const WL = 222; // waterline at the ghat
export const ST = { x0: 96, w: 11, y0: 170, h: 6 };
export const stepTop = (k) => ST.y0 + k * ST.h;
export const stepX = (k) => ST.x0 + (k - 1) * ST.w;
export const KILN = { x: 262, y: 78 };
export const STOVE = { x: 48, y: 155 };
export const KETTLE = { x: 49, y: 144 };
export const LANTERN = { x: 39, y: 141 };
export const PERCHES = [
  { x: 205, y: 32 },
  { x: 112, y: 63 },
  { x: 54, y: 129 },
];

const ramp = (a) => a.map(P);
export function pick(r, v, x, y, d = 0.6) {
  const f = clamp(v, 0, 0.9999) * (r.length - 1);
  const i = Math.floor(f + bayer(x, y) * d + (1 - d) / 2);
  return r[clamp(i, 0, r.length - 1)];
}

// ---------------------------------------------------------------- far bank
function bakeFar() {
  const p = new Pix(W, H);
  const rng = new RNG(7);
  const G = ramp(['#1c3324', '#26442e', '#315738', '#426c42', '#5a8650', '#76a05e']);
  // land strip
  for (let x = 0; x < W; x++) {
    const top = HZ - 3 - Math.round(1.6 * fbm(x * 0.03, 0, 2, 2));
    for (let y = top; y < HZ; y++) p.set(x, y, y === HZ - 1 ? P('#3c3a2c') : G[1 + (hash2(x, y, 1) > 0.6 ? 1 : 0)]);
  }
  // canopy blobs, lit from the right where the sun comes up
  const blob = (cx, cy, r, ry) => {
    for (let dy = -Math.ceil(ry); dy <= ry; dy++)
      for (let dx = -Math.ceil(r); dx <= r; dx++) {
        const e = (dx * dx) / (r * r) + (dy * dy) / (ry * ry);
        if (e > 1 + (hash2(cx + dx, cy + dy, 3) - 0.5) * 0.4) continue;
        if (cy + dy >= HZ - 1) continue;
        const l = (dx / r) * 0.5 - (dy / ry) * 0.55 + (hash2((cx + dx) >> 1, cy + dy, 5) - 0.5) * 0.45;
        p.set(cx + dx, cy + dy, pick(G, 0.4 + l * 0.38, cx + dx, cy + dy, 0.7));
      }
  };
  let x = -8;
  while (x < W + 8) {
    const grove = fbm(x * 0.012, 3, 4, 2);
    const r = rng.range(3, 5.5) + grove * 5;
    const cy = HZ - 3 - r * 0.5 - grove * 6 - rng.range(0, 2);
    blob(Math.round(x), Math.round(cy), r, r * 0.72);
    x += rng.range(3, 7) + (grove < 0.42 ? rng.range(5, 15) : 0);
  }
  // coconut palms poking above the groves
  const palm = (bx, h, lean) => {
    let tx = bx,
      ty = HZ - 3;
    for (let i = 0; i < h; i++) {
      tx = Math.round(bx + lean * Math.pow(i / h, 2) * 4);
      ty = HZ - 3 - i;
      p.set(tx, ty, P('#4a3e30'));
    }
    const fr = [[-6, 2], [-5, -1], [-2, -3], [2, -3], [5, -1], [6, 2], [0, -4]];
    for (const [fx, fy] of fr) {
      const c = fx > 0 ? G[3] : G[1];
      p.line(tx, ty, tx + fx, ty + fy, c);
      if (Math.abs(fx) > 4) p.set(tx + fx + Math.sign(fx), ty + fy + 1, c);
    }
    p.set(tx, ty, G[2]);
  };
  for (let i = 0; i < 15; i++) palm(rng.int(8, 472), rng.int(12, 22), rng.range(-1.6, 1.6));
  // huts with tin and thatch roofs
  for (let i = 0; i < 8; i++) {
    const hx = rng.int(140, 460),
      w = rng.int(6, 9),
      tin = rng.chance(0.6);
    p.rect(hx, HZ - 7, w, 4, P('#8a6c4a'));
    p.vl(hx + w - 1, HZ - 7, HZ - 4, P('#a8885e'));
    p.rect(hx + 2, HZ - 6, 1, 3, P('#2a2018'));
    for (let k = 0; k < 3; k++) p.hl(hx - 1 + k, hx + w - k, HZ - 8 - k, tin ? (k === 0 ? P('#8c9296') : P('#b6babb')) : k === 0 ? P('#8c784c') : P('#a8945e'));
  }
  // brick kiln
  p.rect(KILN.x - 11, HZ - 6, 23, 4, P('#7a4c38'));
  p.hl(KILN.x - 11, KILN.x + 11, HZ - 7, P('#946048'));
  for (let y = KILN.y; y < HZ - 6; y++) {
    const t = (y - KILN.y) / (HZ - KILN.y);
    const hw = 1 + t * 1.8;
    for (let xx = Math.round(KILN.x - hw); xx <= Math.round(KILN.x + hw); xx++) p.set(xx, y, xx < KILN.x ? P('#5a3428') : P('#84523c'));
  }
  p.hl(KILN.x - 1, KILN.x + 1, KILN.y, P('#2a201c'));
  // sandbar (char) on the right
  for (let xx = 368; xx < W; xx++) {
    const h = Math.round(1 + 2.5 * smooth(368, 420, xx) + Math.sin(xx * 0.08));
    for (let y = HZ - h; y < HZ; y++) p.set(xx, y, y === HZ - h ? P('#e2d2a6') : P('#c4b088'));
  }
  return p;
}

// ---------------------------------------------------------------- banyan
function banyan(p) {
  const rng = new RNG(19);
  const L = ramp(['#0e1d13', '#15301c', '#1e4224', '#29552c', '#386a35', '#4f8344', '#6c9e56']);
  const bark = ramp(['#24180f', '#36261a', '#4a3423', '#62462f', '#7a5a3c']);
  const edgeY = (x) => (x < 214 ? 64 + 16 * Math.sin(x * 0.05) + 8 * Math.sin(x * 0.13) - smooth(100, 214, x) * 46 : -99);

  // trunk, lit from the right
  for (let y = 30; y < ST.y0; y++) {
    const x0 = Math.round(-4 + Math.sin(y * 0.05) * 2);
    const x1 = Math.round(24 + Math.sin(y * 0.07 + 1) * 2 + (y > 146 ? Math.pow(y - 146, 1.3) * 0.45 : 0));
    for (let x = Math.max(0, x0); x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      const ridge = Math.sin(x * 1.1 + Math.sin(y * 0.09) * 2.5) * 0.5 + 0.5;
      p.set(x, y, pick(bark, 0.18 + u * 0.62 + (ridge - 0.5) * 0.35, x, y, 0.6));
    }
  }
  const limb = (x0, y0, x1, y1, w) => {
    for (let k = 0; k < w; k++) p.line(x0, y0 + k - (w >> 1), x1, y1 + (k - (w >> 1)) * 0.6, k === 0 ? bark[3] : k === w - 1 ? bark[0] : bark[1]);
  };
  // canopy clusters, back to front
  const cl = [];
  for (let i = 0; i < 170; i++) {
    const cx = rng.range(-12, 216);
    const ey = edgeY(cx);
    if (ey < -20) continue;
    cl.push({ cx, cy: rng.range(-16, ey), r: rng.range(7, 15) * (cx > 170 ? 0.7 : 1) });
  }
  cl.sort((a, b) => a.cy - b.cy);
  limb(24, 74, 168, 40, 4);
  limb(22, 58, 96, 16, 4);
  for (const c of cl) {
    const ri = Math.ceil(c.r);
    for (let dy = -ri; dy <= ri; dy++)
      for (let dx = -ri; dx <= ri; dx++) {
        const x = Math.round(c.cx + dx),
          y = Math.round(c.cy + dy);
        const e = (dx * dx + dy * dy * 1.25) / (c.r * c.r);
        if (e > 1 - 0.3 * hash2(x >> 1, y, 2)) continue;
        let v = 0.5 + (dx / c.r) * 0.32 - (dy / c.r) * 0.42 + (hash2(x >> 1, y, 7) - 0.5) * 0.4;
        if (dy > c.r * 0.55) v -= 0.22;
        p.set(x, y, pick(L, v, x, y, 0.5));
      }
  }
  // limbs that show below the leaves, and a bare branch out into the sky
  limb(20, 92, 124, 60, 5);
  limb(18, 104, 74, 98, 3);
  limb(150, 50, 214, 30, 2);
  p.line(196, 34, 202, 26, bark[2]);
  p.line(180, 39, 184, 33, bark[2]);
  for (const t of [[204, 29], [190, 33], [212, 28]]) {
    p.set(t[0], t[1], L[4]);
    p.set(t[0] + 1, t[1], L[3]);
    p.set(t[0], t[1] - 1, L[5]);
  }
  // aerial roots
  const roots = [[40, 168], [47, 120], [58, 168], [66, 112], [79, 130], [93, 104], [108, 96], [121, 88], [137, 70], [152, 64]];
  for (const [rx, ry] of roots) {
    const y0 = Math.round(edgeY(rx)) - 4;
    for (let y = y0; y < ry; y++) {
      const xx = Math.round(rx + Math.sin(y * 0.12 + rx) * 1.2);
      p.set(xx, y, (y + rx) % 7 === 0 ? bark[3] : bark[1]);
      if (ry > 160 && y > ry - 10) p.set(xx + 1, y, bark[0]);
    }
  }
}

// ---------------------------------------------------------------- ghat
function ghat(p, sub) {
  const stone = ramp(['#7c6a58', '#9a8670', '#b6a288', '#d0bea2']);
  const brick = ramp(['#4c2c22', '#603a2c', '#764836', '#8c5842', '#a06c52']);
  const plaster = ramp(['#6e5e50', '#8a7866', '#a2907a']);
  const top = (x) => (x < ST.x0 ? ST.y0 : stepTop(Math.floor((x - ST.x0) / ST.w) + 1));
  for (let x = 0; x < W; x++) {
    const ty = top(x);
    if (ty >= H) break;
    const lx = x < ST.x0 ? -1 : (x - ST.x0) % ST.w;
    for (let y = ty; y < H; y++) {
      const d = y - ty;
      let c;
      if (d === 0) c = stone[3];
      else if (d === 1) c = stone[2];
      else if (d === 2) c = stone[1];
      else {
        const row = Math.floor((y - ST.y0) / 3);
        const bx = Math.floor((x + (row % 2) * 3) / 6);
        const mortar = (y - ST.y0) % 3 === 2 || (x + (row % 2) * 3) % 6 === 0;
        let v = 0.42 + (hash2(bx, row, 9) - 0.5) * 0.5 - smooth(0, 40, d) * 0.12;
        if (y >= WL - 8) v -= 0.2;
        if (fbm(x * 0.16, y * 0.2, 4, 2) > 0.74) c = pick(plaster, v + 0.05, x, y);
        else c = mortar ? brick[0] : pick(brick, v, x, y, 0.4);
        if (y >= WL - 5 && hash2(x, y, 4) > 0.45) c = P('#3e4a2a');
      }
      // lit outer corner of each step (faces the sun)
      if (lx === ST.w - 1 && d < ST.h + 2) c = d < 3 ? stone[3] : stone[2];
      (y >= WL ? sub : p).set(x, y, c);
    }
  }
  // packed earth on the platform
  for (let x = 0; x < ST.x0; x++)
    for (let y = ST.y0 - 3; y < ST.y0; y++) p.set(x, y, pick(ramp(['#5e4632', '#76583e', '#8e6c4c']), 0.5 + (hash2(x, y, 6) - 0.5) * 0.7 + (y - ST.y0 + 3) * 0.12, x, y));
}

// ---------------------------------------------------------------- tea stall
function stall(p) {
  const bam = P('#a08850'),
    bamD = P('#6e5a34');
  // woven back panel
  for (let y = 133; y < ST.y0 - 2; y++)
    for (let x = 15; x <= 57; x++) {
      const w = ((x >> 1) + (y >> 1)) % 2;
      p.set(x, y, y % 6 === 0 ? P('#6a5432') : w ? P('#b4985e') : P('#9a7e4a'));
    }
  // shelf with cups and tins
  p.hl(17, 55, 146, P('#5a3e26'));
  for (let x = 18; x < 34; x += 3) {
    p.set(x, 145, P('#d8d4c8'));
    p.set(x, 144, P('#d8d4c8'));
  }
  p.rect(38, 141, 3, 5, P('#c03a2a'));
  p.rect(42, 142, 3, 4, P('#3a6aa0'));
  // posts
  p.vl(14, 130, ST.y0 - 3, bam);
  p.vl(13, 130, ST.y0 - 3, bamD);
  p.vl(58, 133, ST.y0 - 3, bam);
  p.vl(59, 133, ST.y0 - 3, bamD);
  for (const yy of [140, 152, 162]) {
    p.set(14, yy, bamD);
    p.set(58, yy, bamD);
  }
  // tin roof, sloping down to the front
  for (let x = 6; x <= 66; x++) {
    const yT = Math.round(lerp(127, 134, (x - 6) / 60));
    for (let y = yT; y < yT + 4; y++) {
      let c = x % 3 === 0 ? P('#7e868c') : P('#a2a8ac');
      if (y === yT) c = P('#c4c8c8');
      if (y === yT + 3) c = P('#5c6266');
      if (hash2(x >> 1, y, 12) > 0.82) c = P('#8a5a3a');
      p.set(x, y, c);
    }
    p.set(x, yT + 4, P('#2a2420'));
  }
  // counter
  for (let y = 156; y < ST.y0 - 2; y++)
    for (let x = 18; x <= 54; x++) {
      let c = (y - 156) % 4 === 3 ? P('#4a3020') : hash2(x >> 2, y >> 2, 3) > 0.7 ? P('#6a4630') : P('#7a5236');
      if (y === 156) c = P('#a0744c');
      p.set(x, y, c);
    }
  // biscuit jars
  for (const [jx, lid] of [[20, '#c03a2a'], [25, '#2a6aa0'], [30, '#e0b030']]) {
    p.rect(jx, 151, 4, 5, P('#9ab4b0'));
    p.rect(jx + 1, 152, 2, 3, P('#d8a050'));
    p.hl(jx, jx + 3, 150, P(lid));
    p.set(jx + 3, 152, P('#e4f0ee'));
  }
  // glasses of tea
  for (const gx of [36, 39]) {
    p.rect(gx, 153, 2, 3, P('#b8642a'));
    p.set(gx, 153, P('#e0d0b0'));
  }
  // clay stove and kettle
  p.rect(44, 150, 10, 6, P('#a4583a'));
  p.hl(44, 53, 150, P('#c07050'));
  p.rect(46, 152, 4, 3, P('#3a1a10'));
  p.rect(45, 144, 7, 6, P('#a8acb0'));
  p.hl(46, 50, 143, P('#c8ccd0'));
  p.vl(51, 145, 148, P('#d8dcde'));
  p.vl(45, 145, 149, P('#7a7e84'));
  p.set(48, 142, P('#2a2a2a'));
  p.line(44, 146, 42, 144, P('#a8acb0'));
  // bananas
  for (let k = 0; k < 6; k++) {
    p.set(33 + (k % 3), 137 + (k >> 1), P('#d8c040'));
    p.set(34 + (k % 2), 138 + (k >> 1), P('#b0a030'));
  }
  p.vl(34, 134, 136, P('#5a4a2a'));
  // lantern hook
  p.vl(LANTERN.x, 135, 137, P('#2a2420'));
  p.rect(LANTERN.x - 1, 138, 3, 4, P('#e8c070'));
  p.hl(LANTERN.x - 1, LANTERN.x + 1, 137, P('#3a3028'));
  p.hl(LANTERN.x - 1, LANTERN.x + 1, 142, P('#3a3028'));
  // bench
  p.hl(64, 93, 162, P('#a0744c'));
  p.hl(64, 93, 163, P('#6a4630'));
  for (const bx of [66, 91]) p.vl(bx, 164, ST.y0 - 3, P('#4a3020'));
  // cycle leaning on the banyan
  const wheel = (cx, cy) => {
    for (let a = 0; a < 24; a++) p.set(Math.round(cx + Math.cos((a / 24) * 6.283) * 4), Math.round(cy + Math.sin((a / 24) * 6.283) * 4), P('#1e1a18'));
    p.set(cx, cy, P('#8a8a8a'));
  };
  wheel(-1, 163);
  wheel(10, 163);
  p.line(-1, 163, 4, 157, P('#2a5a8a'));
  p.line(4, 157, 10, 163, P('#2a5a8a'));
  p.line(4, 157, 9, 156, P('#2a5a8a'));
  p.line(9, 156, 10, 163, P('#2a5a8a'));
  p.hl(2, 5, 155, P('#2a2420'));
  p.line(9, 156, 11, 153, P('#3a3a3a'));
}

// ---------------------------------------------------------------- props on the steps
function props(p) {
  // laundry heap and a steel bucket
  const heap = [P('#2a5aa8'), P('#e0b030'), P('#c03a3a'), P('#e8e4d8'), P('#3a8a5a')];
  const k7 = stepTop(7);
  for (let x = 0; x < 9; x++) {
    const h = Math.round(3 - Math.abs(x - 4) * 0.6);
    for (let y = 0; y < h; y++) p.set(stepX(7) + 1 + x, k7 - 1 - y, heap[Math.floor(hash2(x >> 1, y, 3) * heap.length)]);
  }
  const k6 = stepTop(6);
  p.rect(stepX(6) + 3, k6 - 5, 5, 5, P('#9ca2a6'));
  p.hl(stepX(6) + 2, stepX(6) + 8, k6 - 6, P('#c8ced0'));
  p.vl(stepX(6) + 7, k6 - 5, k6 - 1, P('#d8dcde'));
  p.vl(stepX(6) + 3, k6 - 5, k6 - 1, P('#70767a'));
  // a pair of sandals left on the top step
  p.hl(stepX(1) + 3, stepX(1) + 5, stepTop(1) - 1, P('#3a2a1e'));
  p.hl(stepX(1) + 6, stepX(1) + 8, stepTop(1) - 1, P('#3a2a1e'));
  // mooring poles in the water
  for (const [px, y0, y1] of [[234, 196, 244], [338, 200, 217]]) {
    p.vl(px, y0, y1, P('#8a7448'));
    p.vl(px + 1, y0, y1, P('#5e4c2c'));
    for (let y = y0 + 4; y < y1; y += 5) p.set(px, y, P('#5e4c2c'));
  }
}

export function buildScene() {
  const far = bakeFar();
  const near = new Pix(W, H);
  const sub = new Pix(W, H);
  ghat(near, sub);
  banyan(near);
  stall(near);
  props(near);
  return { far, near: near.toCanvas(), sub: sub.toCanvas(), nearPix: near };
}
