// Boats and people, drawn once into small canvases.
import { P, clamp, lerp, hash2 } from './util.js';
import { Pix } from './pix.js';
import { pick } from './scene.js';

const ramp = (a) => a.map(P);

export const PAL = {
  k: '#1a1412', s: '#7a4a30', S: '#5a3420', w: '#dcd6c8', W: '#a8a090', l: '#2e4f86', L: '#1e3460', c: '#8aa0c8',
  b: '#4a78a8', B: '#34587e', n: '#e8e2d2', N: '#9a9488', r: '#b42a3a', R: '#861c2a', g: '#3a8a3a', o: '#c88a3a',
  u: '#2a6a5a', y: '#e0b030', m: '#b8b0a0', e: '#c03a3a', d: '#4a3a2a', p: '#c85a8a',
};

export function spr(rows, pal = PAL) {
  const h = rows.length,
    w = Math.max(...rows.map((r) => r.length));
  const p = new Pix(w, h);
  rows.forEach((r, y) => {
    for (let x = 0; x < r.length; x++) if (r[x] !== '.' && pal[r[x]]) p.set(x, y, P(pal[r[x]]));
  });
  return p.toCanvas();
}

const LEGS_A = ['lllllllL.', 'lclclclL.', 'll.......', 'll.......', 'ss.......', 'sss......'];
export const MAN_A = [
  spr(['...kkk...', '..kkkkk..', '..skkkk..', '..sssk...', '...ss....', '..wwwww..', '.wwwwwwW.', '.wwwwwwW.', '.swwwwwW.', '.o.wwwwW.', ...LEGS_A]),
  spr(['...kkk...', '..kkkkk..', 'o.skkkk..', 'ossssk...', '.s.ss....', '..swwww..', '..swwwwW.', '.wwwwwwW.', '.wwwwwwW.', '..wwwwwW.', ...LEGS_A]),
];
const LEGS_B = ['LLLLLLLLL', 'LLLLLLLLl', 'LL.......', 'LL.......', 'ss.......', 'sss......'];
export const MAN_B = [
  spr(['....kkk..', '...kkkkk.', 'nnnnkkkk.', 'nNNnssk..', 'nnnnss...', 'nNNnbbbb.', 'nnnnbbbbB', 'nNNnbbbbB', 'nnnnbbbbB', '.ss.bbbbB', ...LEGS_B]),
  spr(['....kkk..', '...kkkkk.', '...skkkk.', '...sssk..', 'nnnnss...', 'nNNnbbbb.', 'nnnnbbbbB', 'nNNnbbbbB', 'nnnnbbbbB', '.ss.bbbbB', ...LEGS_B]),
  spr(['....kkk..', '...kkkkk.', '.nnnkkkk.', 'nNnnssk..', 'nnNnss...', 'nnnnbbbb.', 'nNNnbbbbB', 'nnnnbbbbB', '.nnnbbbbB', '.ss.bbbbB', ...LEGS_B]),
];
const SHOP_BODY = ['..www...', '..www...', '..www...', '..www...', '..www...', '..www...'];
export const SHOP = [
  spr(['..kkk...', '.kkkkk..', '.kkkss..', '..sss...', '...s....', '.ewwwe..', 'sewwwes.', 's.www.s.', 's.www.s.', '..www...', ...SHOP_BODY]),
  spr(['..kkk...', '.kkkkk..', '.kkkss..', '..sss...', '...s....', '.ewwwe..', 'sewwwess', 's.www...', 's.www...', '..www...', ...SHOP_BODY]),
];
export const WASHER = [
  spr(['......nn..', '.....nnnn.', '..kk..sn..', '.kkkss....', '.kssr.....', '..rrrrs...', '.rrRrr....', '.rrRRr....', '.rrrrrg...', '..ggrrs...', '..ss.ss...']),
  spr(['..........', '..........', '..kk......', '.kkks.....', '.ksss.....', '..rrrrs...', '.rrRrr.s..', '.rrRRr..s.', '.rrrrrg.ss', '..ggrrs.nn', '..ss.ss.nn']),
  spr(['..........', '..........', '..kk......', '.kkks.....', '.ksss.....', '..rrrrss..', '.rrRrr..s.', '.rrRRr..nn', '.rrrrrg.nn', '..ggrrs...', '..ss.ss...']),
];
export const KID = {
  stand: spr(['.kk..', 'kkks.', '.ss..', 'sssss', 's.s.s', '..s..', '.uuu.', '.u.u.', '.s.s.', '.s.s.']),
  crouch: spr(['.....', '.kk..', 'kkks.', '.ss..', 'ssss.', 's.ss.', '.uuu.', 'uu.uu', 's...s', 's...s']),
  air: spr(['s...s', '.s.s.', '.kks.', 'kkss.', '.sss.', '..s..', '.uuu.', '.u.u.', 's...s']),
  swimA: spr(['.kk..', 'skks.']),
  swimB: spr(['.kk..', '.kk.s', 's....']),
};
const FL = ['.ll...', '.ll...', '.ll...', '.l.l..', '.s.s..'];
export const FISHER = {
  idle: spr(['.kk...', '.sk...', 'wwwm..', 'wwwmm.', 'swwm..', ...FL]),
  wind: spr(['.kk...', 'msk...', 'mwww..', 'mwwws.', '.www..', ...FL]),
  throw: spr(['.kk...', '.sk.ss', '.wwss.', '.www..', '.www..', ...FL]),
  pull: spr(['kk....', 'sk....', 'wwwss.', 'www...', 'www...', ...FL]),
};
export const ROWER = spr(['.kk..', '.ks..', '.ww..', 'wwws.', '.ww..', '.ll..', '.ll..', '.ll..', '.l.l.', '.s.s.']);
export const RIDERS = [spr(['.yy.', 'yssy', '.yy.', 'yyyy', 'yyyy']), spr(['.ww.', '.ss.', '.bb.', 'bbbb', 'bbbb']), spr(['.pp.', 'pssp', '.pp.', 'pppp', 'pppp'])];
export const CROW = [spr(['.kk..', 'kkkk.', '.kkkk', '..kk.', '..d.d'], { k: '#141214', d: '#3a3030' }), spr(['.kk..', 'kkkkk', '.kkk.', '..kk.', '..d.d'], { k: '#141214', d: '#3a3030' })];
export const CROW_FLY = [spr(['k...k', '.kkk.', '..k..'], { k: '#141214' }), spr(['.....', 'kkkkk', '..k..'], { k: '#141214' })];

// ---------------------------------------------------------------- country boat (nouka)
export function makeNouka(len, o = {}) {
  const h = o.h || Math.round(len * 0.24);
  const m = o.hood ? Math.ceil(h * 0.95) + 2 : 2;
  const p = new Pix(len + 3, h + m + 3);
  const hull = ramp(['#1c1410', '#2a1e16', '#3c2a1c', '#563c26', '#725238']);
  const gunY = (u) => h * 0.42 - Math.pow(Math.abs(2 * u - 1), 3.2) * h * 0.5;
  const botY = (u) => h * 0.42 + (1 - Math.pow(Math.abs(2 * u - 1), 2.2)) * h * 0.5 + 1;
  for (let x = 0; x <= len; x++) {
    const u = x / len;
    const g = Math.round(gunY(u)),
      b = Math.round(botY(u));
    for (let y = g; y <= b; y++) {
      const t = (y - g) / Math.max(1, b - g);
      let c = pick(hull, 0.6 - t * 0.5 + (u - 0.5) * 0.25 + (hash2(x >> 1, y, 3) - 0.5) * 0.15, x, y, 0.5);
      if (y === g) c = hull[4];
      if (o.band && y === g + 1 && u > 0.1 && u < 0.9) c = P(o.band);
      p.set(x + 1, y + m, c);
    }
  }
  if (o.hood) {
    const x0 = Math.round(len * 0.27),
      x1 = Math.round(len * 0.71),
      cx = (x0 + x1) / 2,
      rx = (x1 - x0) / 2,
      ry = h * 0.62;
    const base = Math.round(gunY(0.5)) + 1;
    for (let x = x0; x <= x1; x++)
      for (let y = Math.round(base - ry); y <= base; y++) {
        const e = Math.pow(Math.abs((x - cx) / rx), 3) + ((y - base) / ry) ** 2;
        if (e > 1) continue;
        let c = (x + ((y >> 1) & 1)) % 3 === 0 ? P('#6e5430') : P('#8e6e40');
        if (x > cx + rx * 0.45) c = (x + y) % 3 === 0 ? P('#9a7a48') : P('#b08c56');
        if (e > 0.8 && y < base - ry * 0.6) c = P('#c4a066');
        if (y > base - ry * 0.55 && x < x0 + 3) c = P('#2a2014');
        p.set(x + 1, y + m, c);
      }
  }
  return { c: p.toCanvas(), wl: m + Math.round(h * 0.42 + h * 0.3), w: len + 3 };
}

// ---------------------------------------------------------------- river launch (faces left)
export function makeFerry() {
  const w = 84,
    hh = 40;
  const p = new Pix(w, hh);
  const white = P('#e8e6de'),
    whiteL = P('#f6f4ee'),
    shade = P('#bcbab4'),
    win = P('#2a3448'),
    red = P('#b02a2a'),
    green = P('#2a8a5a'),
    dark = P('#24262c');
  const windows = [];
  // hull
  for (let y = 30; y <= 36; y++) {
    const x0 = 2 + Math.round((y - 30) * 1.4),
      x1 = 78 - Math.round((y - 30) * 0.4);
    for (let x = x0; x <= x1; x++) p.set(x, y, y === 30 ? whiteL : y < 33 ? red : dark);
  }
  for (const tx of [22, 36, 50, 64]) p.rect(tx, 31, 2, 2, P('#141414'));
  // lower deck
  for (let y = 22; y < 30; y++)
    for (let x = 6; x <= 74; x++) {
      let c = x > 60 ? whiteL : white;
      if (y === 29) c = shade;
      if (y >= 24 && y <= 26 && x % 4 < 2 && x > 8 && x < 72) {
        c = win;
        windows.push([x, y]);
      }
      p.set(x, y, c);
    }
  for (let x = 6; x <= 74; x += 2) p.set(x, 21, P('#cfcac0'));
  // upper deck
  for (let y = 13; y < 21; y++)
    for (let x = 14; x <= 66; x++) {
      let c = x > 52 ? whiteL : white;
      if (y === 19) c = green;
      if (y === 20) c = shade;
      if (y >= 15 && y <= 16 && x % 5 < 2 && x > 16 && x < 64) {
        c = win;
        windows.push([x, y]);
      }
      p.set(x, y, c);
    }
  for (let x = 14; x <= 66; x += 2) p.set(x, 12, P('#cfcac0'));
  // passengers along the top rail
  for (const [hx, col] of [[34, '#2a6aa0'], [38, '#c03a3a'], [44, '#e0b030'], [47, '#dcd6c8']]) {
    p.set(hx, 11, P('#1a1412'));
    p.set(hx, 12, P(col));
  }
  // wheelhouse
  p.rect(18, 7, 13, 6, white);
  for (let x = 19; x < 30; x += 2) p.set(x, 9, win);
  p.hl(17, 31, 6, red);
  // funnel
  p.rect(54, 2, 4, 11, P('#e2dccc'));
  p.rect(54, 2, 4, 2, P('#141414'));
  p.rect(54, 4, 4, 2, red);
  // flag
  p.vl(79, 6, 30, P('#3a3a3a'));
  p.rect(80, 6, 4, 3, P('#1a7a4a'));
  p.set(81, 7, red);
  return { c: p.toCanvas(), wl: 35, w, windows, funnel: { x: 55, y: 1 } };
}

// ---------------------------------------------------------------- patched square sail boat
export function makeSail() {
  const p = new Pix(36, 36);
  const hull = makeNouka(30, { h: 7 });
  const pc = ['#c8a878', '#e4dcc8', '#9a7a56', '#b2664c', '#d8c49c'].map(P);
  // mast
  p.vl(17, 1, 28, P('#4a3a2a'));
  // sail
  const quad = (y) => [lerp(6, 5, y / 25), lerp(28, 30, y / 25)];
  for (let y = 3; y < 27; y++) {
    const [a, b] = quad(y - 3);
    const bow = Math.sin(((y - 3) / 24) * Math.PI) * 1.5;
    for (let x = Math.round(a + bow); x <= Math.round(b + bow); x++) {
      const cx = Math.floor((x - 5) / 5),
        cy = Math.floor((y - 3) / 6);
      let c = pc[Math.floor(hash2(cx, cy, 4) * pc.length)];
      if ((x - 5) % 5 === 0 || (y - 3) % 6 === 0) c = P('#7a5e40');
      if (x > b + bow - 4) c = P('#f0e6d0');
      p.set(x, y, c);
    }
  }
  p.hl(5, 30, 2, P('#4a3a2a'));
  return { c: p.toCanvas(), hull, wl: 30 };
}
