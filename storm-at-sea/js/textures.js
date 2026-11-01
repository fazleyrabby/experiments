import * as THREE from 'three';

// All textures are generated procedurally on canvases — no external assets.

export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTex(c, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function periodicNoise(seed) {
  const r = rng(seed);
  const grids = new Map();
  const grid = (gx, gy) => {
    const key = gx * 8192 + gy;
    let g = grids.get(key);
    if (!g) { g = new Float32Array(gx * gy); for (let i = 0; i < g.length; i++) g[i] = r(); grids.set(key, g); }
    return g;
  };
  const noise = (x, y, gx, gy = gx) => {
    const g = grid(gx, gy);
    const fx = x * gx, fy = y * gy;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    let tx = fx - ix, ty = fy - iy;
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
    const x0 = ((ix % gx) + gx) % gx, x1 = (x0 + 1) % gx;
    const y0 = ((iy % gy) + gy) % gy, y1 = (y0 + 1) % gy;
    const a = g[y0 * gx + x0], b = g[y0 * gx + x1], c = g[y1 * gx + x0], d = g[y1 * gx + x1];
    const top = a + (b - a) * tx, bot = c + (d - c) * tx;
    return top + (bot - top) * ty;
  };
  const fbm = (x, y, gx, gy, oct) => {
    let s = 0, amp = 0.5, n = 0;
    for (let o = 0; o < oct; o++) { s += amp * noise(x, y, gx, gy); n += amp; amp *= 0.5; gx *= 2; gy *= 2; }
    return s / n;
  };
  return { noise, fbm };
}

/* ---------------------------------------------------------------- water */

export function makeWaterNormalMap(size = 256) {
  const r = rng(91);
  const waves = [];
  for (let i = 0; i < 96; i++) {
    const f = 2 + Math.floor(Math.pow(r(), 1.7) * 34);
    const ang = r() * Math.PI * 2;
    const kx = Math.round(Math.cos(ang) * f), ky = Math.round(Math.sin(ang) * f);
    if (!kx && !ky) continue;
    waves.push({ kx, ky, amp: 1 / Math.pow(Math.hypot(kx, ky), 1.45), ph: r() * Math.PI * 2 });
  }
  const gx = new Float32Array(size * size), gy = new Float32Array(size * size);
  let ss = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let dx = 0, dy = 0;
    for (const w of waves) {
      const c = Math.cos((2 * Math.PI * (w.kx * x + w.ky * y)) / size + w.ph) * w.amp;
      dx += c * w.kx; dy += c * w.ky;
    }
    const i = y * size + x;
    gx[i] = dx; gy[i] = dy; ss += dx * dx + dy * dy;
  }
  const k = 0.42 / Math.sqrt(ss / (size * size));
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = clamp(128 - gx[i] * k * 127, 0, 255);
    data[i * 4 + 1] = clamp(128 - gy[i] * k * 127, 0, 255);
    data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 8; t.needsUpdate = true;
  return t;
}

// r: lacy foam cells, g: soft fbm, b: wind streaks (anisotropic)
// periodic Worley (cellular) noise: returns F2-F1 edge distance, the shape of foam lace
function worley(cells, seed) {
  const r = rng(seed);
  const pts = new Float32Array(cells * cells * 2);
  for (let i = 0; i < pts.length; i++) pts[i] = r();
  return (u, v) => {
    const fx = u * cells, fy = v * cells;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    let f1 = 9, f2 = 9;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx, cy = iy + dy;
      const wx = ((cx % cells) + cells) % cells, wy = ((cy % cells) + cells) % cells;
      const px = cx + pts[(wy * cells + wx) * 2], py = cy + pts[(wy * cells + wx) * 2 + 1];
      const d = Math.hypot(px - fx, py - fy);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    return f2 - f1;
  };
}

export function makeFoamMap(size = 256) {
  const N = periodicNoise(5);
  const W1 = worley(7, 21), W2 = worley(17, 22), W3 = worley(38, 23);
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    const a = N.fbm(u, v, 8, 8, 5);
    // warp the lookup so the cells read as torn, organic foam rather than tiles
    const wu = u + (N.fbm(u, v, 4, 4, 3) - 0.5) * 0.08, wv = v + (N.fbm(u + 0.5, v + 0.5, 4, 4, 3) - 0.5) * 0.08;
    const e1 = 1 - Math.min(1, W1(wu, wv) * 3.2);
    const e2 = 1 - Math.min(1, W2(wu, wv) * 2.6);
    const e3 = 1 - Math.min(1, W3(u, v) * 2.2);
    const lace = clamp((e1 * 0.55 + e2 * 0.5 + e3 * 0.35) * (0.55 + a * 0.9) - 0.25, 0, 1);
    const g = clamp((N.fbm(u + 0.31, v + 0.17, 16, 16, 4) - 0.5) * 2.2 + 0.5, 0, 1);
    const st = clamp((N.fbm(u, v, 3, 40, 4) - 0.5) * 2.6 + 0.5, 0, 1);
    const i = (y * size + x) * 4;
    data[i] = lace * 255; data[i + 1] = g * 255; data[i + 2] = st * 255; data[i + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

export function makeGlowTexture() {
  const [c, x] = cv(128, 128);
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return toTex(c);
}

/* ----------------------------------------------------------- containers */

const BRANDS = ['KAIROS', 'NORDVIK', 'SEALINK', 'ARCTA', 'MERIDIAN', 'ORIENTA', 'HANSEMAR', 'TRITON'];
const PREFIX = ['KRSU', 'NDVU', 'SLKU', 'ARCU', 'MRDU', 'ORTU', 'HMRU', 'TRIU', 'TGHU', 'CAIU'];

function grime(x, w, h, r, amount = 1) {
  const g = x.createLinearGradient(0, h, 0, h * 0.45);
  g.addColorStop(0, `rgba(45,32,22,${0.32 * amount})`);
  g.addColorStop(1, 'rgba(45,32,22,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 60 * amount; i++) {
    const px = r() * w, py = r() * h, s = 2 + r() * 10;
    x.fillStyle = `rgba(${90 + r() * 40},${45 + r() * 20},${20 + r() * 10},${0.08 + r() * 0.22})`;
    x.beginPath(); x.ellipse(px, py, s, s * (0.5 + r()), r() * 3, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 24 * amount; i++) {
    const px = r() * w, py = r() * h * 0.6, len = 10 + r() * 80;
    const g2 = x.createLinearGradient(0, py, 0, py + len);
    g2.addColorStop(0, `rgba(95,50,25,${0.2 + r() * 0.25})`);
    g2.addColorStop(1, 'rgba(95,50,25,0)');
    x.fillStyle = g2; x.fillRect(px, py, 1 + r() * 3, len);
  }
}

function containerSide(w, h, ribs, seed, brand) {
  const r = rng(seed);
  const [c, x] = cv(w, h);
  const [bc, b] = cv(w, h);
  x.fillStyle = '#c4c4c4'; x.fillRect(0, 0, w, h);
  b.fillStyle = '#808080'; b.fillRect(0, 0, w, h);
  const post = Math.round(w * 0.018), railT = 12, railB = 16;
  const rw = (w - post * 2) / ribs;
  for (let i = 0; i < ribs; i++) {
    const x0 = post + i * rw;
    const g = x.createLinearGradient(x0, 0, x0 + rw, 0);
    g.addColorStop(0, '#d2d2d2'); g.addColorStop(0.2, '#e4e4e4'); g.addColorStop(0.45, '#c2c2c2');
    g.addColorStop(0.7, '#a2a2a2'); g.addColorStop(1, '#cbcbcb');
    x.fillStyle = g; x.fillRect(x0, railT, rw + 0.5, h - railT - railB);
    const gb = b.createLinearGradient(x0, 0, x0 + rw, 0);
    gb.addColorStop(0, '#202020'); gb.addColorStop(0.25, '#f0f0f0'); gb.addColorStop(0.5, '#f8f8f8');
    gb.addColorStop(0.75, '#202020'); gb.addColorStop(1, '#101010');
    b.fillStyle = gb; b.fillRect(x0, railT, rw + 0.5, h - railT - railB);
  }
  // rails & corner posts
  x.fillStyle = '#9c9c9c'; x.fillRect(0, 0, w, railT); x.fillRect(0, h - railB, w, railB);
  x.fillStyle = '#d6d6d6'; x.fillRect(0, railT - 2, w, 2); x.fillRect(0, h - railB, w, 2);
  x.fillStyle = '#a3a3a3'; x.fillRect(0, 0, post, h); x.fillRect(w - post, 0, post, h);
  x.fillStyle = '#4a4a4a';
  for (const [px, py] of [[0, 0], [w - post, 0], [0, h - 14], [w - post, h - 14]]) x.fillRect(px, py, post, 14);
  b.fillStyle = '#d0d0d0'; b.fillRect(0, 0, w, railT); b.fillRect(0, h - railB, w, railB);
  b.fillRect(0, 0, post, h); b.fillRect(w - post, 0, post, h);
  // markings (lighter than base -> read as faded white paint after tint)
  x.fillStyle = 'rgba(255,255,255,0.8)';
  x.font = 'bold 13px "Helvetica Neue", Arial, sans-serif';
  x.textAlign = 'right';
  const pre = PREFIX[Math.floor(r() * PREFIX.length)];
  x.fillText(`${pre} ${String(Math.floor(r() * 900000) + 100000)} ${Math.floor(r() * 9)}`, w - post - 10, railT + 18);
  x.font = 'bold 11px "Helvetica Neue", Arial, sans-serif';
  x.fillText(r() < 0.5 ? '45G1' : '42G1', w - post - 10, railT + 32);
  if (brand) {
    x.save();
    x.globalAlpha = 0.62;
    x.font = `900 ${Math.round(h * 0.34)}px "Helvetica Neue", Arial, sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff';
    x.fillText(brand, w / 2, h * 0.52);
    x.restore();
  }
  grime(x, w, h, r, 1);
  return { map: toTex(c), bump: toTex(bc, { srgb: false }) };
}

function containerDoor(seed) {
  const r = rng(seed);
  const w = 256, h = 256;
  const [c, x] = cv(w, h);
  x.fillStyle = '#9d9d9d'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#c6c6c6'; x.fillRect(10, 14, w / 2 - 12, h - 30); x.fillRect(w / 2 + 2, 14, w / 2 - 12, h - 30);
  // horizontal door corrugation
  for (let y = 30; y < h - 30; y += 22) {
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(10, y, w - 20, 6);
    x.fillStyle = 'rgba(255,255,255,0.15)'; x.fillRect(10, y + 6, w - 20, 3);
  }
  // locking bars + cams
  for (const bx of [38, 96, 160, 218]) {
    x.fillStyle = '#4c4c4c'; x.fillRect(bx, 10, 5, h - 20);
    x.fillStyle = '#2f2f2f'; x.fillRect(bx - 4, 10, 13, 9); x.fillRect(bx - 4, h - 19, 13, 9);
    x.fillStyle = '#5a5a5a'; x.fillRect(bx - 10, h * 0.55, 22, 6);
  }
  x.fillStyle = '#3a3a3a'; x.fillRect(w / 2 - 1, 14, 2, h - 30);
  // hinges
  x.fillStyle = '#5c5c5c';
  for (const hy of [30, 90, 160, 220]) { x.fillRect(6, hy, 8, 12); x.fillRect(w - 14, hy, 8, 12); }
  // CSC plate & code
  x.fillStyle = '#b0b0b0'; x.fillRect(176, 196, 34, 22);
  x.fillStyle = 'rgba(255,255,255,0.8)'; x.font = 'bold 12px Arial'; x.textAlign = 'left';
  x.fillText(`${PREFIX[Math.floor(r() * PREFIX.length)]} ${Math.floor(r() * 900000) + 100000}`, 140, 34);
  grime(x, w, h, r, 0.8);
  return toTex(c);
}

function containerRoof(seed) {
  const r = rng(seed);
  const [c, x] = cv(512, 128);
  x.fillStyle = '#bcbcbc'; x.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(0,0,0,${r() * 0.08})`;
    x.beginPath(); x.ellipse(r() * 512, r() * 128, 10 + r() * 40, 6 + r() * 20, 0, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#8f8f8f'; x.fillRect(0, 0, 512, 6); x.fillRect(0, 122, 512, 6); x.fillRect(0, 0, 8, 128); x.fillRect(504, 0, 8, 128);
  grime(x, 512, 128, r, 0.6);
  return toTex(c);
}

export function makeContainerTextures() {
  const sides40 = [0, 1, 2, 3].map((i) => containerSide(1024, 256, 50, 11 + i, i === 3 ? null : BRANDS[(i * 3) % BRANDS.length]));
  const sides20 = [0, 1].map((i) => containerSide(512, 256, 24, 31 + i, i === 0 ? BRANDS[(i + 5) % BRANDS.length] : null));
  return { sides40, sides20, door: containerDoor(7), roof: containerRoof(9) };
}

/* -------------------------------------------------------------- hull */

function stretchedText(x, s, px, py, hm, pxm, pym, color, weight = '800', align = 'center', spacing = 0) {
  x.save();
  x.translate(px, py);
  x.scale(pxm / pym, 1);
  x.font = `${weight} ${hm * pym}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  x.textAlign = align; x.textBaseline = 'alphabetic';
  x.fillStyle = color;
  if ('letterSpacing' in x) x.letterSpacing = `${spacing * pym}px`;
  x.fillText(s, 0, 0);
  x.restore();
}

export function makeHullTextures(o) {
  const { L, D, T, W = 4096, hull, boot = '#151617', red = '#74241b', name, brand, brandColor = '#ecebe6', seed = 1, port = 'MONROVIA',
    brandX = -6, brandH = 5.6, brandSpacing = 0.9, bowStripes = false, bowMark = null, sheerLine = null } = o;
  const H = W / 4;
  const r = rng(seed);
  const [c, x] = cv(W, H);
  const [bc, b] = cv(W / 2, H / 2);
  b.fillStyle = '#808080'; b.fillRect(0, 0, W / 2, H / 2);
  const bh = H / 2, pxm = W / L, pym = bh / (D + 3);

  for (const side of [1, -1]) {
    const top = side > 0 ? 0 : bh;
    const X = (xm) => (side > 0 ? (xm + L / 2) : (L / 2 - xm)) * pxm;
    const Y = (ym) => top + bh - ym * pym;

    // topside paint with subtle tonal variation
    x.fillStyle = hull; x.fillRect(0, top, W, bh);
    for (let i = 0; i < 260; i++) {
      x.fillStyle = r() < 0.5 ? `rgba(255,255,255,${r() * 0.035})` : `rgba(0,0,0,${r() * 0.06})`;
      x.fillRect(r() * W, top + r() * bh, 40 + r() * 300, 8 + r() * 60);
    }
    // antifouling & boot top
    x.fillStyle = red; x.fillRect(0, Y(T - 0.5), W, top + bh - Y(T - 0.5));
    x.fillStyle = boot; x.fillRect(0, Y(T + 1.5), W, 2.0 * pym);
    // salt / wash line above boot top
    const wg = x.createLinearGradient(0, Y(T + 3.5), 0, Y(T + 1.5));
    wg.addColorStop(0, 'rgba(220,225,220,0)'); wg.addColorStop(1, 'rgba(220,225,220,0.10)');
    x.fillStyle = wg; x.fillRect(0, Y(T + 3.5), W, 2 * pym);
    // antifouling weathering
    for (let i = 0; i < 300; i++) {
      x.fillStyle = `rgba(${40 + r() * 40},${30 + r() * 20},${20},${r() * 0.12})`;
      x.fillRect(r() * W, Y(T - 0.5) + r() * (T - 0.5) * pym, 20 + r() * 120, 4 + r() * 20);
    }

    // plate seams (paint + bump)
    for (let ym = 2.4; ym < D + 3; ym += 2.4) {
      x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(0, Y(ym), W, 1.5);
      x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, Y(ym) + 1.5, W, 1);
      b.fillStyle = '#505050'; b.fillRect(0, Y(ym) / 2, W / 2, 1.2);
    }
    for (let xm = -L / 2; xm < L / 2; xm += 9.6) {
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(X(xm), top, 1.5, bh);
      b.fillStyle = '#5a5a5a'; b.fillRect(X(xm) / 2, top / 2, 1, bh / 2);
    }
    // frame dimples (subtle vertical banding)
    for (let xm = -L / 2; xm < L / 2; xm += 0.8) {
      b.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.04)`; b.fillRect(X(xm) / 2, Y(D) / 2, 1, (D - T) * pym / 2);
    }

    // freeing ports / scuppers below the deck edge
    for (let xm = -L / 2 + 8; xm < L / 2 - 30; xm += 7.5 + r() * 3) {
      const px = X(xm), py = Y(D - 0.9);
      x.fillStyle = '#0b0c0d'; x.fillRect(px, py, 0.6 * pxm, 0.35 * pym);
      const rg = x.createLinearGradient(0, py, 0, py + (2 + r() * 5) * pym);
      rg.addColorStop(0, `rgba(110,55,28,${0.35 + r() * 0.3})`); rg.addColorStop(1, 'rgba(110,55,28,0)');
      x.fillStyle = rg; x.fillRect(px + 1, py, 0.3 * pxm, (2 + r() * 5) * pym);
    }
    // general rust streaks
    for (let i = 0; i < 180; i++) {
      const xm = -L / 2 + r() * L, ym = T + 2 + r() * (D - T - 1);
      const len = (0.5 + r() * 4) * pym, wd = (0.05 + r() * 0.25) * pxm;
      const rg = x.createLinearGradient(0, Y(ym), 0, Y(ym) + len);
      rg.addColorStop(0, `rgba(${100 + r() * 30},${48 + r() * 15},${22},${0.25 + r() * 0.35})`);
      rg.addColorStop(1, 'rgba(100,50,22,0)');
      x.fillStyle = rg; x.fillRect(X(xm), Y(ym), wd, len);
    }

    // hawse pipe / anchor pocket
    const ax = X(L / 2 - 13), ay = Y(D - 2.4);
    x.fillStyle = '#070809';
    x.beginPath(); x.ellipse(ax, ay, 1.6 * pxm, 1.7 * pym, 0, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 6; i++) {
      const rg = x.createLinearGradient(0, ay, 0, ay + (3 + r() * 6) * pym);
      rg.addColorStop(0, 'rgba(120,58,26,0.75)'); rg.addColorStop(1, 'rgba(120,58,26,0)');
      x.fillStyle = rg; x.fillRect(ax + (r() - 0.5) * 2.2 * pxm, ay, (0.15 + r() * 0.3) * pxm, (3 + r() * 6) * pym);
    }

    // brand along the hull
    if (brand) stretchedText(x, brand, X(brandX), Y(D - 1.6 - brandH), brandH, pxm, pym, brandColor, bowStripes ? '500' : '900', 'center', brandSpacing);
    // coloured sheer line along the deck edge
    if (sheerLine) { x.fillStyle = sheerLine; x.fillRect(0, Y(D + 3), W, 3.6 * pym); }
    // bow speed stripes + roundel
    if (bowStripes) {
      x.fillStyle = '#e9ebe8';
      const rows = [[D - 2.6, 44, 0.85], [D - 4.6, 38, 0.8], [D - 6.6, 32, 0.75]];
      for (const [ym, len, th] of rows) {
        const xa = X(L / 2 - 7), xb = X(L / 2 - 7 - len);
        x.beginPath();
        x.moveTo(xa, Y(ym)); x.lineTo(xb, Y(ym)); x.lineTo(xb + (xa > xb ? 1 : -1) * 1.5 * pxm, Y(ym - th)); x.lineTo(xa, Y(ym - th));
        x.closePath(); x.fill();
      }
      const cx = X(L / 2 - 17), cy = Y(D - 4.6), rr = 3.6;
      x.fillStyle = hull; x.strokeStyle = '#e9ebe8'; x.lineWidth = 0.45 * pym;
      x.beginPath(); x.ellipse(cx, cy, rr * pxm, rr * pym, 0, 0, Math.PI * 2); x.fill(); x.stroke();
      if (bowMark) {
        stretchedText(x, bowMark, cx, cy + 0.1 * pym, 2.2, pxm, pym, '#e9ebe8', '800', 'center', 0);
      }
    }
    // name at the bow (aft of the stripes when present)
    stretchedText(x, name, X(L / 2 - (bowStripes ? 62 : 34)), Y(D - (bowStripes ? 5.2 : 3.6)), bowStripes ? 2.4 : 1.9, pxm, pym, '#f1f0eb', '700', 'center', 0.25);

    // draft marks bow / mid / stern
    for (const xm of [L / 2 - 7, 0.0, -L / 2 + 9]) {
      for (let ym = 4; ym <= D - 2; ym += 2) {
        const col = ym < T - 0.5 ? '#e8e3d8' : '#f3f2ee';
        stretchedText(x, `${ym}M`, X(xm), Y(ym), 0.42, pxm, pym, col, '700');
        x.fillStyle = col; x.fillRect(X(xm) - 0.35 * pxm, Y(ym + 1), 0.7 * pxm, 0.08 * pym);
      }
    }
    // bow thruster + bulbous bow symbols
    const sym = (xm, ym, kind) => {
      const px = X(xm), py = Y(ym), rr = 0.75;
      x.strokeStyle = '#f2f1ec'; x.lineWidth = 3;
      x.beginPath(); x.ellipse(px, py, rr * pxm, rr * pym, 0, 0, Math.PI * 2); x.stroke();
      x.beginPath();
      if (kind === 'thruster') {
        x.moveTo(px - rr * 0.7 * pxm, py - rr * 0.7 * pym); x.lineTo(px + rr * 0.7 * pxm, py + rr * 0.7 * pym);
        x.moveTo(px + rr * 0.7 * pxm, py - rr * 0.7 * pym); x.lineTo(px - rr * 0.7 * pxm, py + rr * 0.7 * pym);
      } else {
        x.moveTo(px, py - rr * pym); x.lineTo(px, py + rr * pym);
      }
      x.stroke();
    };
    sym(L / 2 - 21, T + 2.6, 'thruster');
    sym(L / 2 - 4.5, T + 2.6, 'bulb');
    sym(-L / 2 + 16, T + 2.6, 'thruster');
    // Plimsoll mark
    {
      const px = X(4), py = Y(T + 1.2);
      x.strokeStyle = '#f2f1ec'; x.lineWidth = 3;
      x.beginPath(); x.ellipse(px, py, 0.6 * pxm, 0.6 * pym, 0, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#f2f1ec';
      x.fillRect(px - 0.9 * pxm, py - 1, 1.8 * pxm, 3);
      x.fillRect(px - 0.9 * pxm, Y(T + 2.4), 1.8 * pxm, 3);
      x.fillRect(px + 1.4 * pxm, Y(T + 1.8), 0.1 * pxm, 1.4 * pym);
      for (let k = 0; k < 4; k++) x.fillRect(px + 1.4 * pxm, Y(T + 1.0 + k * 0.28), 0.7 * pxm, 3);
    }
    // waterline weed / grime band
    for (let i = 0; i < 200; i++) {
      x.fillStyle = `rgba(${30 + r() * 30},${45 + r() * 30},${30},${r() * 0.18})`;
      x.fillRect(r() * W, Y(T + 0.4) + r() * 1.6 * pym, 20 + r() * 160, 2 + r() * 8);
    }
  }
  const map = toTex(c);
  const bump = toTex(bc, { srgb: false });
  return { map, bump };
}

export function makeTransomTexture({ B, D, T, hull, red = '#74241b', boot = '#151617', name, port = 'MONROVIA' }) {
  const w = 1024, h = 512;
  const [c, x] = cv(w, h);
  const pxm = w / B, pym = h / (D + 3);
  const Y = (ym) => h - ym * pym;
  x.fillStyle = hull; x.fillRect(0, 0, w, h);
  x.fillStyle = red; x.fillRect(0, Y(T - 0.5), w, h);
  x.fillStyle = boot; x.fillRect(0, Y(T + 1.5), w, 2 * pym);
  stretchedText(x, name, w / 2, Y(D - 2.8), 1.6, pxm, pym, '#f1f0eb', '700', 'center', 0.2);
  stretchedText(x, port, w / 2, Y(D - 4.9), 1.1, pxm, pym, '#f1f0eb', '700', 'center', 0.2);
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * w, py = Y(D - 0.5) + Math.random() * 3 * pym;
    const g = x.createLinearGradient(0, py, 0, py + 80);
    g.addColorStop(0, 'rgba(110,55,25,0.4)'); g.addColorStop(1, 'rgba(110,55,25,0)');
    x.fillStyle = g; x.fillRect(px, py, 3, 80);
  }
  return toTex(c);
}

export function makeDeckTexture() {
  const N = periodicNoise(17);
  const s = 256;
  const [c, x] = cv(s, s);
  const img = x.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let i = 0; i < s; i++) {
    const n = N.fbm(i / s, y / s, 8, 8, 5);
    const k = (y * s + i) * 4;
    img.data[k] = 58 + n * 30; img.data[k + 1] = 72 + n * 30; img.data[k + 2] = 64 + n * 26; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  x.fillStyle = 'rgba(0,0,0,0.25)';
  x.fillRect(0, 0, s, 2); x.fillRect(0, 0, 2, s);
  const r = rng(3);
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(110,60,30,${r() * 0.3})`;
    x.beginPath(); x.ellipse(r() * s, r() * s, 2 + r() * 12, 2 + r() * 6, r() * 3, 0, Math.PI * 2); x.fill();
  }
  return toTex(c, { repeat: true });
}

/* ---------------------------------------------------------- superstructure */

export function makeFacade(wm, floors, floorH, seed, { spacing = 2.9, lowerDoors = true } = {}) {
  const r = rng(seed);
  const pxm = 40;
  const W = Math.round(wm * pxm), H = Math.round(floors * floorH * pxm);
  const [c, x] = cv(W, H);
  const [ec, e] = cv(W, H);
  x.fillStyle = '#dcddd7'; x.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  // panelling
  for (let px = 0; px < W; px += 1.5 * pxm) { x.fillStyle = 'rgba(0,0,0,0.05)'; x.fillRect(px, 0, 1, H); }
  for (let f = 0; f <= floors; f++) {
    const y = H - f * floorH * pxm;
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, y - 3, W, 3);
    const g = x.createLinearGradient(0, y, 0, y + 0.6 * pxm);
    g.addColorStop(0, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, y, W, 0.6 * pxm);
  }
  const cols = Math.max(1, Math.floor((wm - 1.5) / spacing));
  const x0 = (wm - (cols - 1) * spacing) / 2;
  for (let f = 0; f < floors; f++) {
    const fb = H - f * floorH * pxm; // floor bottom in canvas
    for (let ci = 0; ci < cols; ci++) {
      const cx = (x0 + ci * spacing) * pxm;
      if (f === 0 && lowerDoors) {
        if (ci % 3 === 1) {
          x.fillStyle = '#9ea2a2'; x.fillRect(cx - 0.45 * pxm, fb - 2.1 * pxm, 0.9 * pxm, 2.0 * pxm);
          x.fillStyle = '#6d7272'; x.fillRect(cx + 0.25 * pxm, fb - 1.1 * pxm, 0.08 * pxm, 0.25 * pxm);
        } else if (ci % 3 === 0) {
          x.fillStyle = '#1a2229'; x.beginPath(); x.arc(cx, fb - 1.6 * pxm, 0.22 * pxm, 0, Math.PI * 2); x.fill();
        }
        continue;
      }
      const ww = 1.25 * pxm, wh = 1.0 * pxm;
      const wx = cx - ww / 2, wy = fb - 1.15 * pxm - wh;
      x.fillStyle = '#8c9193'; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const lit = r() < 0.38;
      const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
      if (lit) {
        const warm = r() < 0.75;
        g.addColorStop(0, warm ? '#6a5a40' : '#4c5a66'); g.addColorStop(1, warm ? '#3e3427' : '#2f3a44');
        e.fillStyle = warm ? `rgb(255,${170 + r() * 40},${100 + r() * 40})` : 'rgb(190,215,255)';
        e.globalAlpha = 0.55 + r() * 0.45;
        e.fillRect(wx, wy, ww, wh);
        e.globalAlpha = 1;
      } else {
        g.addColorStop(0, '#2a3842'); g.addColorStop(0.5, '#141c22'); g.addColorStop(1, '#1d2830');
      }
      x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
      if (r() < 0.3) { x.fillStyle = 'rgba(190,175,150,0.55)'; x.fillRect(wx, wy, ww * (0.3 + r() * 0.4), wh); }
      x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(wx, wy, ww, 2);
      // rust tears under window corners
      if (r() < 0.35) {
        const rg = x.createLinearGradient(0, wy + wh, 0, wy + wh + 30 + r() * 50);
        rg.addColorStop(0, 'rgba(120,60,25,0.45)'); rg.addColorStop(1, 'rgba(120,60,25,0)');
        x.fillStyle = rg; x.fillRect(wx + r() * ww, wy + wh + 3, 2, 30 + r() * 50);
      }
    }
  }
  for (let i = 0; i < 50; i++) {
    x.fillStyle = `rgba(0,0,0,${r() * 0.05})`;
    x.fillRect(r() * W, r() * H, 20 + r() * 80, 20 + r() * 120);
  }
  const map = toTex(c);
  const emissiveMap = toTex(ec);
  return { map, emissiveMap };
}

export function makeBridgeTexture(wm, hm, seed) {
  const r = rng(seed);
  const pxm = 40, W = Math.round(wm * pxm), H = Math.round(hm * pxm);
  const [c, x] = cv(W, H);
  const [ec, e] = cv(W, H);
  x.fillStyle = '#dedfd9'; x.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const y0 = H - 2.75 * pxm, y1 = H - 0.95 * pxm;
  const g = x.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#24323b'); g.addColorStop(0.55, '#0c1216'); g.addColorStop(1, '#141c21');
  x.fillStyle = g; x.fillRect(0, y0, W, y1 - y0);
  // console glow
  for (let px = 0; px < W; px += 14) {
    const v = r();
    if (v < 0.5) continue;
    e.fillStyle = v < 0.8 ? 'rgba(80,190,150,0.55)' : v < 0.95 ? 'rgba(255,170,70,0.6)' : 'rgba(255,60,50,0.8)';
    e.fillRect(px, y1 - 8 - r() * 10, 6 + r() * 10, 3 + r() * 4);
  }
  const eg = e.createLinearGradient(0, y0, 0, y1);
  eg.addColorStop(0, 'rgba(40,70,70,0)'); eg.addColorStop(1, 'rgba(40,90,80,0.35)');
  e.fillStyle = eg; e.fillRect(0, y0, W, y1 - y0);
  // mullions
  x.fillStyle = '#c9cbc6';
  for (let px = 0; px < W; px += 1.35 * pxm) x.fillRect(px, y0, 5, y1 - y0);
  x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(0, y0, W, 3);
  // sun-visor shadow
  const sg = x.createLinearGradient(0, y0 - 14, 0, y0);
  sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = sg; x.fillRect(0, y0 - 14, W, 14);
  return { map: toTex(c), emissiveMap: toTex(ec) };
}

export function makeFunnelTexture({ base = '#d8d6cc', band = '#b52a1f', emblem = '#f4f2ea', circ = 28, height = 19, seed = 1 }) {
  const r = rng(seed);
  const W = 1024, H = 512;
  const pxu = W / circ, pyu = H / height;
  const [c, x] = cv(W, H);
  x.fillStyle = base; x.fillRect(0, 0, W, H);
  const vb0 = H * (1 - 0.8), vb1 = H * (1 - 0.56);
  x.fillStyle = band; x.fillRect(0, vb0, W, vb1 - vb0);
  x.fillStyle = emblem; x.fillRect(0, vb0 - 6, W, 6); x.fillRect(0, vb1, W, 6);
  // emblem on each side (u=.25 and .75)
  for (const u of [0.25, 0.75]) {
    const cx = u * W, cy = (vb0 + vb1) / 2, rx = 2.0 * pxu, ry = 2.0 * pyu;
    x.fillStyle = emblem;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = band;
    x.beginPath(); x.ellipse(cx, cy, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2); x.fill();
    // stylised compass star
    x.fillStyle = emblem;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? 0.72 : 0.22;
      x.lineTo(cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr);
    }
    x.closePath(); x.fill();
  }
  // black top + soot
  x.fillStyle = '#121212'; x.fillRect(0, 0, W, H * 0.1);
  const sg = x.createLinearGradient(0, H * 0.1, 0, H * 0.32);
  sg.addColorStop(0, 'rgba(20,18,16,0.7)'); sg.addColorStop(1, 'rgba(20,18,16,0)');
  x.fillStyle = sg; x.fillRect(0, H * 0.1, W, H * 0.22);
  for (let i = 0; i < 70; i++) {
    const px = r() * W, py = H * 0.1 + r() * H * 0.7, len = 20 + r() * 120;
    const g = x.createLinearGradient(0, py, 0, py + len);
    g.addColorStop(0, `rgba(${r() < 0.5 ? '30,26,22' : '110,55,25'},${0.2 + r() * 0.3})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(px, py, 1 + r() * 3, len);
  }
  // vertical seams
  for (let px = 0; px < W; px += 1.6 * pxu) { x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(px, H * 0.1, 1, H); }
  return toTex(c);
}

/* ---------------------------------------------------------- cruise ship */

// White hull, navy boot band, two rows of portholes, name and wave livery at the bow.
export function makeCruiseHullTextures({ L, D, T, W = 4096, name = 'AURELIA', line = 'SEAVANTE', navy = '#13294a', accent = '#2f7fc1', seed = 5 }) {
  const H = W / 4;
  const r = rng(seed);
  const [c, x] = cv(W, H);
  const [ec, e] = cv(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const bh = H / 2, pxm = W / L, pym = bh / (D + 3);
  for (const side of [1, -1]) {
    const top = side > 0 ? 0 : bh;
    const X = (xm) => (side > 0 ? (xm + L / 2) : (L / 2 - xm)) * pxm;
    const Y = (ym) => top + bh - ym * pym;
    x.fillStyle = '#f1f1ec'; x.fillRect(0, top, W, bh);
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.03})`; x.fillRect(r() * W, top + r() * bh, 60 + r() * 300, 6 + r() * 40); }
    x.fillStyle = '#8a2a22'; x.fillRect(0, Y(T - 0.3), W, top + bh - Y(T - 0.3));
    x.fillStyle = navy; x.fillRect(0, Y(T + 2.3), W, 2.6 * pym);
    x.fillStyle = accent; x.fillRect(0, Y(T + 2.75), W, 0.22 * pym);
    // plate seams
    for (let ym = 2.2; ym < D + 3; ym += 2.2) { x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(0, Y(ym), W, 1); }
    for (let xm = -L / 2; xm < L / 2; xm += 9.6) { x.fillStyle = 'rgba(0,0,0,0.06)'; x.fillRect(X(xm), top, 1, bh); }
    // portholes (crew / lower decks), some lit
    for (const ym of [T + 3.6, T + 5.7]) {
      for (let xm = -L / 2 + 26; xm < L / 2 - 38; xm += 2.6) {
        const px = X(xm), py = Y(ym), rr = 0.27;
        x.fillStyle = '#1b2733'; x.beginPath(); x.ellipse(px, py, rr * pxm, rr * pym, 0, 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(120,120,120,0.6)'; x.lineWidth = 1.5; x.stroke();
        if (r() < 0.45) { e.fillStyle = r() < 0.8 ? 'rgb(255,200,140)' : 'rgb(200,225,255)'; e.beginPath(); e.ellipse(px, py, rr * pxm * 0.8, rr * pym * 0.8, 0, 0, Math.PI * 2); e.fill(); }
      }
    }
    // mooring / pilot doors
    for (const xm of [-L / 2 + 40, L / 2 - 70, 10]) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X(xm), Y(T + 5.4), 1.8 * pxm, 2.2 * pym); }
    // bow livery: sweeping waves
    for (let k = 0; k < 3; k++) {
      x.strokeStyle = k === 1 ? accent : navy; x.lineWidth = (0.45 - k * 0.1) * pym;
      x.beginPath();
      for (let i = 0; i <= 60; i++) {
        const xm = L / 2 - 6 - i * 0.9;
        const ym = D - 1.2 - k * 1.1 - Math.sin(i * 0.11 + k) * 1.2 - i * 0.05;
        i ? x.lineTo(X(xm), Y(ym)) : x.moveTo(X(xm), Y(ym));
      }
      x.stroke();
    }
    stretchedText(x, name, X(L / 2 - 75), Y(D - 3.4), 2.4, pxm, pym, navy, '600', 'center', 0.5);
    stretchedText(x, line, X(-L / 2 + 50), Y(D - 3.4), 2.0, pxm, pym, navy, '600', 'center', 0.6);
    // draft marks
    for (const xm of [L / 2 - 7, -L / 2 + 9]) for (let ym = 2; ym <= T + 2; ym += 2) stretchedText(x, `${ym}M`, X(xm), Y(ym), 0.4, pxm, pym, ym < T ? '#e6e1d6' : '#33404a', '700');
  }
  return { map: toTex(c), emissiveMap: toTex(ec) };
}

// Balcony cabins: tileable band of `cabins` x `decks`, each cabin 3 m wide, each deck 2.95 m.
export function makeBalconyTexture(cabins = 16, decks = 4, seed = 3) {
  const r = rng(seed);
  const pxm = 32, cw = 3, dh = 2.95;
  const W = cabins * cw * pxm, H = Math.round(decks * dh * pxm);
  const [c, x] = cv(W, H);
  const [ec, e] = cv(W, H);
  x.fillStyle = '#eceeea'; x.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  for (let d = 0; d < decks; d++) {
    const y0 = H - (d + 1) * dh * pxm; // top of this deck band
    for (let k = 0; k < cabins; k++) {
      const x0 = k * cw * pxm;
      // recessed cabin front: sliding door glass + curtain
      const gx = x0 + 0.2 * pxm, gw = (cw - 0.4) * pxm, gy = y0 + 0.35 * pxm, gh = 2.2 * pxm;
      const g = x.createLinearGradient(0, gy, 0, gy + gh);
      g.addColorStop(0, '#3c4b57'); g.addColorStop(1, '#1d2730');
      x.fillStyle = g; x.fillRect(gx, gy, gw, gh);
      const lit = r() < 0.42;
      if (lit) {
        const warm = r() < 0.8;
        x.fillStyle = warm ? 'rgba(170,140,100,0.55)' : 'rgba(130,150,170,0.5)'; x.fillRect(gx, gy, gw, gh);
        e.fillStyle = warm ? `rgb(255,${180 + r() * 40},${110 + r() * 50})` : 'rgb(190,215,255)';
        e.globalAlpha = 0.5 + r() * 0.5; e.fillRect(gx, gy + 0.2 * pxm, gw, gh - 0.2 * pxm); e.globalAlpha = 1;
      }
      if (r() < 0.5) { x.fillStyle = 'rgba(220,210,190,0.7)'; x.fillRect(gx + (r() < 0.5 ? 0 : gw * 0.6), gy, gw * 0.4, gh); }
      x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(gx + gw / 2, gy, 2, gh);
      // ceiling shadow
      const sg = x.createLinearGradient(0, y0, 0, y0 + 0.6 * pxm);
      sg.addColorStop(0, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = sg; x.fillRect(x0, y0 + 0.25 * pxm, cw * pxm, 0.6 * pxm);
      // glass balustrade with a handrail
      const by = y0 + (dh - 1.25) * pxm;
      x.fillStyle = 'rgba(160,190,205,0.55)'; x.fillRect(x0, by, cw * pxm, 1.0 * pxm);
      x.fillStyle = '#d9dcd8'; x.fillRect(x0, by - 3, cw * pxm, 4);
      // partitions
      x.fillStyle = '#f4f5f2'; x.fillRect(x0, y0 + 0.25 * pxm, 0.14 * pxm, (dh - 0.25) * pxm);
    }
    // deck slab edge
    x.fillStyle = '#f7f7f4'; x.fillRect(0, y0, W, 0.26 * pxm);
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, y0 + 0.26 * pxm, W, 2);
  }
  const map = toTex(c, { repeat: true }), emissiveMap = toTex(ec, { repeat: true });
  return { map, emissiveMap, tileW: cabins * cw, tileH: decks * dh };
}

// Public decks: floor-to-ceiling glazing with mullions, restaurants and lounges lit at night.
export function makePublicTexture(seed = 4) {
  const r = rng(seed);
  const pxm = 32, wm = 36, dh = 2.95, decks = 2;
  const W = wm * pxm, H = Math.round(decks * dh * pxm);
  const [c, x] = cv(W, H);
  const [ec, e] = cv(W, H);
  x.fillStyle = '#eef0ec'; x.fillRect(0, 0, W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  for (let d = 0; d < decks; d++) {
    const y0 = H - (d + 1) * dh * pxm;
    const g = x.createLinearGradient(0, y0, 0, y0 + dh * pxm);
    g.addColorStop(0, '#2d3c48'); g.addColorStop(1, '#141c23');
    x.fillStyle = g; x.fillRect(0, y0 + 0.3 * pxm, W, (dh - 0.55) * pxm);
    for (let m = 0; m < wm; m += 1.5) { x.fillStyle = '#c9ccc8'; x.fillRect(m * pxm, y0 + 0.3 * pxm, 3, (dh - 0.55) * pxm); }
    // interior lighting zones
    for (let z = 0; z < wm; z += 4 + r() * 6) {
      const len = (2 + r() * 6) * pxm;
      e.fillStyle = r() < 0.7 ? 'rgba(255,196,130,0.8)' : 'rgba(170,200,255,0.75)';
      e.fillRect(z * pxm, y0 + 0.5 * pxm, len, (dh - 0.9) * pxm);
      x.fillStyle = 'rgba(150,120,90,0.35)'; x.fillRect(z * pxm, y0 + 0.5 * pxm, len, (dh - 0.9) * pxm);
    }
    x.fillStyle = '#f7f7f4'; x.fillRect(0, y0, W, 0.3 * pxm);
  }
  return { map: toTex(c, { repeat: true }), emissiveMap: toTex(ec, { repeat: true }), tileW: wm, tileH: decks * dh };
}
