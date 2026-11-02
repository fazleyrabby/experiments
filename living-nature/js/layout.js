// Sprite registry and the placement of every static prop in the scene.
import { W, H, HOR, Rng, makeNoise, makeCanvas, tintInto, clamp } from './util.js';
import { PAL, makePine, makeOak, makeBirch, makeBush, makeGrass, makeReed, makeFlower, makeRock, makeMushroom } from './art.js';
import { makeCabin, makeCabinGlow, makeBridge, CABIN, BRIDGE } from './art2.js';
import { nearY, idx, CABIN_POS, BRIDGE_POS } from './geometry.js';

export const HAZE_MULT = [1, 0.5, 0.16];
export const sprites = [];

export class Sprite {
  constructor(cv, ax = cv.width / 2, ay = cv.height) {
    this.src = cv;
    this.w = cv.width;
    this.h = cv.height;
    this.ax = ax;
    this.ay = ay;
    this.v = [makeCanvas(this.w, this.h), makeCanvas(this.w, this.h), makeCanvas(this.w, this.h)];
    sprites.push(this);
    for (let i = 0; i < 3; i++) this.v[i].getContext('2d').drawImage(cv, 0, 0);
  }
  retint(look) {
    for (let i = 0; i < 3; i++) tintInto(this.v[i], this.src, look.tint, look.haze, look.hazeA * HAZE_MULT[i]);
  }
}

const nearest = (arr, h) => arr.reduce((a, b) => (Math.abs(b.h - h) < Math.abs(a.h - h) ? b : a));

export function buildSprites() {
  const S = { pine: [], oak: [], oakWarm: [], birch: [], bush: [], grass: [], reed: [], rock: [], mush: [], flower: {} };
  for (const h of [30, 38, 48, 60, 74, 90, 106, 150]) for (let v = 0; v < 2; v++) S.pine.push(new Sprite(makePine(h * 13 + v * 7, h)));
  for (const h of [30, 40, 52, 66, 82, 98]) for (let v = 0; v < 2; v++) S.oak.push(new Sprite(makeOak(h * 17 + v * 5, h)));
  for (const h of [34, 44, 58]) S.oakWarm.push(new Sprite(makeOak(h * 19, h, { ramp: PAL.oakWarm })));
  for (const h of [34, 46, 60]) for (let v = 0; v < 2; v++) S.birch.push(new Sprite(makeBirch(h * 11 + v * 3, h)));
  for (let v = 0; v < 5; v++) S.bush.push(new Sprite(makeBush(80 + v, 18 + v * 4, 12 + v * 2)));
  const wild = ['#ffffff', '#f6e04a', '#f6a6cc', '#e85a7a'];
  for (let v = 0; v < 3; v++) S.bush.push(new Sprite(makeBush(120 + v, 24 + v * 4, 14, PAL.oak, wild)));
  for (const h of [6, 8, 10, 13, 16, 20]) for (let v = 0; v < 3; v++) S.grass.push(new Sprite(makeGrass(h * 5 + v, h)));
  for (const h of [14, 18, 22, 26]) for (let v = 0; v < 3; v++) S.reed.push(new Sprite(makeReed(h * 3 + v, h)));
  for (const [w, h] of [[8, 6], [12, 8], [16, 10], [22, 13], [30, 17]]) for (let v = 0; v < 2; v++) S.rock.push(new Sprite(makeRock(w * 3 + v, w, h, 0.45)));
  for (let v = 0; v < 4; v++) S.mush.push(new Sprite(makeMushroom(v)));
  for (const k of ['daisy', 'poppy', 'lupine', 'buttercup', 'bluebell', 'cosmos', 'allium']) S.flower[k] = [0, 1].map((v) => new Sprite(makeFlower(k, v)));
  S.cabin = new Sprite(makeCabin());
  S.cabinGlow = makeCabinGlow();
  S.bridge = new Sprite(makeBridge());
  return S;
}

export function buildLayout(S, masks) {
  const R = new Rng(2024);
  const noise = makeNoise(77);
  const props = [];
  const ao = [];
  const taken = [];
  const water = (x, y) => masks.water[idx(x, y)];
  const pathy = (x, y) => masks.pathOuter[idx(x, y)];
  const inRect = (x, y, a, b, c, d) => x >= a && x <= c && y >= b && y <= d;

  const ok = (x, y, r, tree = true) => {
    if (y < HOR + 3 || y > H + 6) return false;
    if (water(x, y) || pathy(x, y)) return false;
    if (tree) {
      if (inRect(x, y, 26, 160, 112, 198)) return false;
      if (inRect(x, y, 282, 232, 392, 272)) return false;
    }
    for (const t of taken) if (Math.hypot(t.x - x, (t.y - y) * 2.2) < t.r + r) return false;
    return true;
  };

  const add = (o) => { props.push(o); return o; };
  const tree = (kind, x, y, h, opts = {}) => {
    const pool = S[kind];
    const sp = nearest(pool, h);
    if (!opts.force && !ok(x, y, sp.w * 0.26)) return null;
    taken.push({ x, y, r: sp.w * 0.26 });
    ao.push({ x, y, r: sp.w * 0.46, a: clamp(0.35 + sp.h / 160) });
    return add({
      type: 'tree', kind, sp, x, y, amp: sp.h * (kind === 'pine' ? 0.05 : 0.042), ph: R.range(0, 6.28),
      strip: sp.h > 90 ? 3 : 2, reflect: !!opts.reflect, leaf: kind !== 'pine' || undefined,
    });
  };

  // --- hero framing trees ---
  tree('pine', 6, 240, 150, { force: true });
  tree('pine', 470, 246, 150, { force: true });
  tree('oak', 436, 216, 82);
  tree('oak', 22, 214, 66);
  tree('pine', 36, 228, 90);

  // --- left forest: tall pines behind the cabin ---
  for (let x = -6; x < 140; x += R.range(11, 17)) {
    const y = R.range(147, 160);
    const k = R.chance(0.72) ? 'pine' : 'oak';
    tree(k, x, y, R.range(66, 106));
  }
  // lake corner trees
  for (let n = 0; n < 14; n++) tree(R.chance(0.6) ? 'pine' : 'birch', R.range(78, 112), R.range(150, 178), R.range(34, 60), { reflect: true });
  for (let n = 0; n < 14; n++) tree(R.chance(0.6) ? 'pine' : 'oak', R.range(388, 420), R.range(150, 180), R.range(34, 64), { reflect: true });
  // --- right forest ---
  for (let x = 392; x < 500; x += R.range(10, 16)) {
    const y = R.range(148, 172);
    tree(R.chance(0.62) ? 'pine' : 'oak', x, y, R.range(60, 100));
  }
  for (let n = 0; n < 12; n++) tree(R.pick(['pine', 'oak', 'birch', 'oakWarm']), R.range(396, 490), R.range(176, 212), R.range(44, 80));
  // left mid-ground
  for (let n = 0; n < 16; n++) tree(R.pick(['pine', 'oak', 'birch', 'oakWarm']), R.range(-6, 40), R.range(176, 236), R.range(40, 84));
  tree('birch', 108, 192, 52, { reflect: true });
  tree('birch', 115, 198, 44, { reflect: true });
  tree('oak', 134, 214, 54, { reflect: true });
  tree('birch', 396, 238, 48);
  tree('oak', 424, 252, 58);

  // --- bushes ---
  for (let n = 0; n < 60; n++) {
    const x = R.range(-10, W + 10), y = R.range(150, 262);
    if (!ok(x, y, 8, false) || (inRect(x, y, 26, 170, 112, 198) && n % 2)) continue;
    if (noise(x * 0.03, y * 0.05) < 0.4 && y < 200) continue;
    const sp = R.pick(S.bush);
    add({ type: 'static', sp, x, y, amp: 1.2, ph: R.range(0, 6), strip: 2, reflect: false });
    taken.push({ x, y, r: 4 });
  }
  // --- rocks & mushrooms ---
  const rockSpots = [];
  for (let n = 0; n < 40; n++) {
    const x = R.range(-5, W + 5), y = R.range(160, 268);
    if (water(x, y) || inRect(x, y, 26, 160, 112, 198)) continue;
    const nearWater = masks.water[idx(x + 6, y)] || masks.water[idx(x - 6, y)] || masks.water[idx(x, y - 6)];
    if (!nearWater && n % 3) continue;
    const sp = R.pick(S.rock);
    add({ type: 'static', sp, x, y, amp: 0, ph: 0, strip: 99, reflect: false });
    rockSpots.push({ x, y });
  }
  for (let n = 0; n < 14; n++) {
    const t = R.pick(props.filter((p) => p.type === 'tree'));
    if (!t) continue;
    const x = t.x + R.range(-12, 12), y = t.y + R.range(0, 5);
    if (!ok(x, y, 2, false)) continue;
    add({ type: 'static', sp: R.pick(S.mush), x, y, amp: 0, ph: 0, strip: 99 });
  }

  // --- reeds along the lake edge and stream mouth ---
  for (let x = 128; x < 310; x += R.range(4, 12)) {
    if (R.chance(0.45)) continue;
    const y0 = nearY(x);
    const n = R.int(2, 5);
    for (let k = 0; k < n; k++) {
      const rx = x + R.range(-5, 5), ry = y0 + R.range(1, 4);
      if (water(rx, ry) && !masks.stream[idx(rx, ry)] && ry < y0 - 1) continue;
      add({ type: 'sway', sp: R.pick(S.reed), x: rx, y: ry, amp: 1.7, ph: R.range(0, 6), strip: 2, reflect: true });
    }
  }
  for (let n = 0; n < 16; n++) {
    const sx = 306 + R.range(-6, 30), sy = 206 + R.range(0, 20);
    if (!masks.water[idx(sx, sy)] && !masks.pathOuter[idx(sx, sy)]) add({ type: 'sway', sp: R.pick(S.reed), x: sx, y: sy, amp: 1.7, ph: R.range(0, 6), strip: 2, reflect: true });
  }

  // --- grass tufts ---
  for (let n = 0; n < 340; n++) {
    const x = R.range(-14, W + 14), y = R.range(HOR + 12, H + 4);
    if (!ok(x, y, 1, false)) continue;
    const dep = (y - HOR) / (H - HOR);
    const want = 6 + dep * 14 + R.range(-2, 3);
    const sp = nearest(S.grass, want);
    add({ type: 'sway', sp, x, y, amp: 1.2 + dep * 1.4, ph: R.range(0, 6), strip: 2, reflect: false, fore: y > 252 });
  }

  // --- wildflower drifts ---
  const kinds = Object.keys(S.flower);
  const centers = [];
  for (let n = 0; n < 34; n++) {
    const x = R.range(-6, W + 6), y = R.range(188, 268);
    if (!ok(x, y, 0, false)) continue;
    centers.push({ x, y, kind: R.pick(kinds), r: R.range(8, 22) });
  }
  // window box garden by the cabin + clearing
  centers.push({ x: 40, y: 192, kind: 'daisy', r: 8 }, { x: 94, y: 190, kind: 'poppy', r: 6 }, { x: 76, y: 200, kind: 'lupine', r: 10 });
  for (const c of centers) {
    const n = Math.round(c.r * 0.9);
    for (let k = 0; k < n; k++) {
      const a = R.range(0, 6.28), d = Math.sqrt(R.next()) * c.r;
      const x = c.x + Math.cos(a) * d * 1.5, y = c.y + Math.sin(a) * d * 0.55;
      if (!ok(x, y, 0, false)) continue;
      const kind = R.chance(0.82) ? c.kind : R.pick(kinds);
      const sp = R.pick(S.flower[kind]);
      add({ type: 'sway', sp, x, y, amp: 1.4, ph: R.range(0, 6), strip: 2, reflect: false, fore: y > 252 });
    }
  }

  // --- landmarks ---
  add({ type: 'cabin', sp: S.cabin, x: CABIN_POS.x, y: CABIN_POS.y, amp: 0, ph: 0, strip: 99 });
  add({ type: 'bridge', sp: S.bridge, x: BRIDGE_POS.x, y: BRIDGE_POS.y, amp: 0, ph: 0, strip: 99 });
  ao.push({ x: CABIN_POS.x, y: CABIN_POS.y - 2, r: 40, a: 0.6 });

  props.sort((a, b) => a.y - b.y);
  const frogs = [172, 226, 282].map((x) => ({ x, y: Math.round(nearY(x)) + 3 }));
  const lilies = [];
  for (let n = 0; n < 12; n++) {
    const x = R.range(150, 290), y = R.range(190, 212);
    if (y < nearY(x) - 5) lilies.push({ x, y, r: R.range(2.5, 4), ph: R.range(0, 6.28), bloom: R.chance(0.35) });
  }
  return { props, ao, frogs, lilies, rockSpots };
}
export { CABIN, BRIDGE };
