// Hand-built pixel art: cabin, bridge, creatures, sun/moon.
import { PX, Rng, clamp } from './util.js';
import { PAL } from './art.js';

// Build a sprite from ascii rows + legend.
export function fromMap(rows, legend) {
  const w = Math.max(...rows.map((r) => r.length));
  const px = new PX(w, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = legend[row[x]];
      if (c) px.p(x, y, c);
    }
  });
  return px.cv;
}

// ---------------- cabin ----------------
export const CABIN = { w: 66, h: 54, chimney: [48, 5], windows: [[35, 34, 6, 8], [42, 34, 5, 8]], attic: [30, 15, 4, 4], door: [16, 35, 8, 12], lantern: [27, 38] };

export function makeCabin() {
  const px = new PX(CABIN.w, CABIN.h);
  const r = new Rng(7);
  const g = CABIN.h - 1; // ground line
  // foundation stones
  for (let y = g - 4; y <= g; y++)
    for (let x = 9; x <= 56; x++) {
      const bx = Math.floor((x + (y % 2 ? 3 : 0)) / 6);
      const tone = (bx * 7 + y) % 3;
      let c = PAL.rock[tone + 1];
      if ((x + (y % 2 ? 3 : 0)) % 6 === 0) c = PAL.rock[0];
      if (y === g) c = PAL.rock[0];
      px.p(x, y, c);
    }
  // log walls
  const wallTop = 31, wallBot = g - 5;
  const logC = ['#d79a5c', '#b4713f', '#8a5230', '#5e3820'];
  for (let y = wallTop; y <= wallBot; y++) {
    const k = (y - wallTop) % 3;
    for (let x = 10; x <= 55; x++) {
      let c = k === 0 ? logC[0] : k === 1 ? logC[1] : logC[2];
      if (k === 1 && (x * 13 + y * 7) % 11 === 0) c = logC[2];
      if (k === 0 && (x * 5 + y) % 9 === 0) c = logC[1];
      if (x === 55) c = logC[3];
      px.p(x, y, c);
    }
  }
  // protruding log ends on the corners
  for (let y = wallTop; y <= wallBot; y += 3) {
    for (const x0 of [8, 55]) {
      px.rect(x0, y, 3, 3, logC[1]);
      px.rect(x0, y, 3, 1, logC[0]);
      px.p(x0 + 1, y + 1, '#e9b87a');
      px.rect(x0, y + 2, 3, 1, logC[3]);
    }
  }
  // door
  const [dx, dy, dw, dh] = CABIN.door;
  px.rect(dx - 1, dy - 1, dw + 2, dh + 1, '#3a2214');
  for (let y = dy; y < dy + dh; y++)
    for (let x = dx; x < dx + dw; x++) px.p(x, y, (x - dx) % 3 === 2 ? '#56341d' : (x - dx) % 3 === 0 ? '#7a4b2a' : '#68402a');
  px.rect(dx, dy + 4, dw, 1, '#4a2c1a');
  px.rect(dx, dy + dh - 4, dw, 1, '#4a2c1a');
  px.p(dx + dw - 2, dy + 6, '#f0d27a');
  px.p(dx + dw - 2, dy + 7, '#b8923a');
  px.rect(dx - 2, g - 4, dw + 4, 1, PAL.rock[4]);
  px.rect(dx - 2, g - 3, dw + 4, 1, PAL.rock[2]);
  // window with shutters
  px.rect(33, 32, 1, 11, '#2f5a52'); px.rect(34, 32, 1, 11, '#3c7468');
  px.rect(48, 32, 1, 11, '#3c7468'); px.rect(49, 32, 1, 11, '#2f5a52');
  px.rect(34, 33, 15, 10, '#3a2214');
  px.rect(35, 34, 6, 8, '#7ca9c6'); px.rect(42, 34, 6, 8, '#7ca9c6');
  px.rect(35, 34, 6, 3, '#a3cbe0'); px.rect(42, 34, 6, 3, '#a3cbe0');
  px.p(36, 35, '#e8f6ff'); px.p(43, 35, '#e8f6ff');
  px.rect(41, 34, 1, 8, '#4a2c1a'); px.rect(35, 38, 13, 1, '#4a2c1a');
  px.rect(33, 43, 17, 2, '#5a3a22'); px.rect(33, 43, 17, 1, '#7a5230');
  for (let x = 34; x < 49; x += 2) {
    px.p(x, 42, r.pick(['#e85a7a', '#f5d84a', '#f2f2f2', '#c26ae0']));
    px.p(x + 1, 43, '#3d9a38');
  }
  // lantern
  px.rect(27, 36, 1, 1, '#3a2a1a');
  px.rect(26, 37, 3, 4, '#2a2018');
  px.rect(27, 38, 1, 2, '#f7c35a');
  // eave shadow on the wall
  for (let x = 10; x <= 55; x++) {
    px.p(x, wallTop, '#5e3820');
    px.p(x, wallTop + 1, (x % 2) ? '#7a4a2a' : '#8a5230');
  }
  // roof
  const apexX = 32.5, apexY = 2, eaveY = 30, halfEave = 31;
  const shC = ['#d0765a', '#b25a44', '#964636', '#783428', '#552420'];
  for (let y = apexY; y <= eaveY; y++) {
    const t = (y - apexY) / (eaveY - apexY);
    const hw = 1.5 + t * (halfEave - 1.5);
    const x0 = Math.round(apexX - hw), x1 = Math.round(apexX + hw);
    const row = Math.floor((y - apexY) / 3);
    for (let x = x0; x <= x1; x++) {
      const off = row % 2 ? 2 : 0;
      const seg = Math.floor((x + off) / 5);
      const inRow = (y - apexY) % 3;
      let c = inRow === 0 ? shC[0] : inRow === 1 ? shC[1] : shC[2];
      if ((x + off) % 5 === 0) c = shC[3];
      if (inRow === 2) c = (seg + row) % 2 ? shC[2] : shC[3];
      if (x === x0) c = shC[0];
      if (x === x1) c = shC[3];
      if (x1 - x0 > 2 && x < apexX && (x + y) % 7 === 0) c = shC[0];
      px.p(x, y, c);
    }
    // bargeboard trim
    px.p(x0 - 1, y, '#4a2c1a'); px.p(x0, y, '#e0b078');
    px.p(x1 + 1, y, '#3a2214'); px.p(x1, y, '#8a5a34');
  }
  px.rect(1, eaveY + 1, 63, 1, '#4a2c1a');
  px.rect(1, eaveY + 2, 63, 1, '#2a180e');
  // attic window
  px.rect(29, 14, 6, 6, '#3a2214');
  px.rect(30, 15, 4, 4, '#7ca9c6');
  px.p(31, 16, '#e8f6ff'); px.rect(32, 15, 1, 4, '#4a2c1a');
  // chimney
  const [cx0] = CABIN.chimney;
  for (let y = 5; y <= 23; y++)
    for (let x = cx0 - 3; x <= cx0 + 3; x++) {
      const bk = Math.floor((x + (y % 3 === 0 ? 2 : 0)) / 3);
      let c = PAL.rock[(bk + y) % 3 + 2];
      if (x === cx0 + 3) c = PAL.rock[1];
      if (x === cx0 - 3) c = PAL.rock[4];
      if (y % 3 === 0) c = PAL.rock[1];
      px.p(x, y, c);
    }
  px.rect(cx0 - 4, 4, 9, 2, PAL.rock[3]);
  px.rect(cx0 - 4, 4, 9, 1, PAL.rock[5]);
  px.rect(cx0 - 2, 3, 5, 1, '#16181c');
  // firewood stack on the left
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 4 - (row ? 0 : 0); i++) {
      const x = 1 + i * 2 + (row % 2), y = g - 4 - row * 2;
      px.rect(x, y, 2, 2, '#9a6a3a');
      px.p(x, y, '#e0b078');
      px.p(x + 1, y + 1, '#5e3820');
    }
  // stump with axe on the right
  px.rect(58, g - 6, 6, 6, '#6e4626');
  px.rect(58, g - 7, 6, 2, '#c99a62');
  px.rect(59, g - 7, 4, 1, '#e6c08a');
  px.rect(60, g - 6, 2, 1, '#a07040');
  px.rect(63, g - 6, 1, 6, '#3d2414');
  px.line(61, g - 7, 61, g - 12, '#5a3a22');
  px.rect(59, g - 13, 3, 3, '#9aa6b0');
  px.p(59, g - 13, '#d6dde2');
  return px.cv;
}

// window / lamp glow overlay (drawn emissive over the cabin when lights are on)
export function makeCabinGlow() {
  const px = new PX(CABIN.w, CABIN.h);
  const [dx, dy, dw, dh] = CABIN.door;
  const warm = ['#fff0b0', '#ffd878', '#ffb347', '#e8862a'];
  const pane = (x, y, w, h) => {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) px.p(x + i, y + j, warm[Math.min(3, 1 + Math.floor((j / h) * 2.2) + (i === 0 || i === w - 1 ? 1 : 0))]);
    px.p(x + 1, y + 1, warm[0]);
    px.p(x + 2, y + 1, warm[0]);
  };
  pane(35, 34, 6, 8); pane(42, 34, 6, 8);
  px.rect(41, 34, 1, 8, '#7a4a20'); px.rect(35, 38, 13, 1, '#7a4a20');
  pane(30, 15, 4, 4); px.rect(32, 15, 1, 4, '#7a4a20');
  px.rect(27, 38, 1, 2, '#fff0b0'); px.p(27, 37, '#ffd878'); px.p(27, 40, '#ffb347');
  void dx; void dy; void dw; void dh;
  return px.cv;
}

// ---------------- bridge ----------------
export const BRIDGE = { w: 96, h: 44, span: 38 };
export function makeBridge() {
  const px = new PX(BRIDGE.w, BRIDGE.h);
  const cx = (BRIDGE.w - 1) / 2, g = BRIDGE.h - 1;
  const deckAt = (x) => {
    const t = (x - cx) / 40;
    return Math.round(27 - 10 * (1 - Math.min(1, t * t)));
  };
  const wood = ['#d8a468', '#bd8650', '#9a6a3c', '#6e4626', '#46281a'];
  // stone abutments
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 0 : BRIDGE.w - 14;
    for (let y = 26; y <= g; y++)
      for (let x = x0; x < x0 + 14; x++) {
        const rowI = Math.floor((y - 26) / 4);
        const bx = Math.floor((x + (rowI % 2 ? 4 : 0)) / 7);
        let c = PAL.rock[2 + ((bx + rowI) % 3)];
        if ((x + (rowI % 2 ? 4 : 0)) % 7 === 0 || (y - 26) % 4 === 0) c = PAL.rock[1];
        if (y === 26) c = PAL.rock[5];
        if (y > g - 3 && (x + y) % 2) c = '#2c5a30';
        px.p(x, y, c);
      }
  }
  // arch underside beams
  for (let x = 12; x <= BRIDGE.w - 13; x++) {
    const d = deckAt(x);
    px.rect(x, d + 4, 1, 2, wood[3]);
    px.p(x, d + 6, wood[4]);
  }
  // deck: planks in front view
  for (let x = 0; x < BRIDGE.w; x++) {
    const d = deckAt(x);
    const plank = Math.floor(x / 4) % 2;
    px.p(x, d - 1, x % 4 === 0 ? wood[2] : wood[0]);
    px.p(x, d, x % 4 === 0 ? wood[3] : plank ? wood[1] : wood[0]);
    px.p(x, d + 1, x % 4 === 0 ? wood[4] : plank ? wood[2] : wood[1]);
    px.p(x, d + 2, wood[3]);
    px.p(x, d + 3, wood[4]);
  }
  // railings
  for (let x = 2; x < BRIDGE.w - 2; x++) {
    const d = deckAt(x);
    px.p(x, d - 10, wood[0]);
    px.p(x, d - 9, wood[2]);
    px.p(x, d - 5, wood[3]);
  }
  for (let x = 3; x < BRIDGE.w - 3; x += 11) {
    const d = deckAt(x);
    for (let y = d - 11; y < d; y++) {
      px.p(x, y, wood[1]);
      px.p(x + 1, y, wood[3]);
    }
    px.p(x, d - 12, wood[0]);
    px.p(x + 1, d - 12, wood[2]);
  }
  // moss tufts
  const r = new Rng(3);
  for (let i = 0; i < 24; i++) {
    const x = r.int(13, BRIDGE.w - 14);
    px.p(x, deckAt(x) + 4, '#4a8a3c');
  }
  return px.cv;
}

// ---------------- creatures ----------------
export function makeBirdFrames(dark = '#1e2432', wing = '#3b4358') {
  const L = { d: dark, w: wing, l: '#6a7288' };
  const f = [
    ['w.....w', 'ww...ww', '.wwdww.', '...d...'],
    ['.wwwwww.', 'ww.dd.ww', '...dl...'],
    ['...d...', '..wwdww.', '.ww.d.ww', 'ww.....w'],
  ];
  return f.map((rows) => fromMap(rows, L));
}

export function makeButterflyFrames(a, b) {
  const L = { o: a, p: b, B: '#2a1a14' };
  return [
    fromMap(['oo.oo', 'opBpo', '.oBo.', '..B..'], L),
    fromMap(['.....', '..oB.', '.oBo.', '..B..'], L),
  ];
}

export function makeFishFrames() {
  const frames = [];
  for (const ang of [-0.95, -0.3, 0.45, 1.0]) {
    const px = new PX(15, 15);
    const prof = [0.5, 1, 1.6, 1.9, 1.9, 1.6, 1.1, 0.7, 0.9, 1.4];
    for (let i = 0; i < prof.length; i++) {
      const s = i - 5;
      for (let v = -prof[i]; v <= prof[i]; v += 0.5) {
        const rx = s * Math.cos(ang) - v * Math.sin(ang), ry = s * Math.sin(ang) + v * Math.cos(ang);
        const back = v < -0.2;
        px.p(Math.round(7 + rx), Math.round(7 + ry), back ? (i > 7 ? '#2b5a8a' : '#3b78a8') : v > 0.6 ? '#dfe9ee' : '#a9c4d2');
      }
    }
    const ex = Math.round(7 + -4 * Math.cos(ang)), ey = Math.round(7 + -4 * Math.sin(ang));
    px.p(ex, ey, '#10202c');
    frames.push(px.cv);
  }
  return frames;
}

export function makeFrogFrames() {
  const L = { k: '#101810', y: '#e8c43a', a: '#1f5a2a', b: '#2f7a36', c: '#4c9e48', w: '#b8d88a', s: '#e8a0a0' };
  return [
    fromMap(['..ky.yk..', '.abbbbbba.', 'abcbbbbcba', 'abbbbbbbba', '.abbwwbba.', '.aa.....aa'.slice(0, 10)], L),
    fromMap(['..ky.yk..', '.abbbbbba.', 'abcbbbbcba', 'abbwwwwbba'.slice(0, 10), '.abwssswba'.slice(0, 10), '.aaasssaaa'.slice(0, 10)], L),
  ];
}

export function makeLeafFrames(c1, c2) {
  const L = { a: c1, b: c2 };
  return [
    fromMap(['ab.', '.ba'], L),
    fromMap(['.a', 'ab', 'b.'], L),
    fromMap(['.ba', 'ab.'], L),
    fromMap(['a.', 'ba', '.b'], L),
  ];
}

// ---------------- sky bodies ----------------
export function makeMoon() {
  const s = 19;
  const px = new PX(s, s);
  const c = (s - 1) / 2, rad = 8.6;
  const craters = [[-2, -3, 2], [3, -1, 2.2], [-3, 3, 1.6], [2, 4, 1.4], [0, 0, 1.2]];
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const dx = x - c, dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d > rad) continue;
      // lit from the right: terminator curve (waxing gibbous)
      const term = 0.35 * rad * Math.sqrt(Math.max(0, 1 - (dy / rad) ** 2));
      const lit = dx > -term;
      let col = lit ? (dx > 0 ? '#f6f2dc' : '#e2dec6') : '#2a3256';
      if (lit && craters.some(([cx, cy, cr]) => Math.hypot(dx - cx, dy - cy) < cr)) col = '#c8c4ac';
      if (lit && d > rad - 1.1) col = '#d8d4bc';
      if (!lit && d > rad - 1) col = '#3a4470';
      px.p(x, y, col);
    }
  return px.cv;
}
