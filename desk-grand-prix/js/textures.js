// Every surface texture is painted here from code: oak desk planks, the moulded
// orange track, paper, book cloth, keycap legends, sticky notes, the blister card,
// the sky outside the window. Nothing is downloaded.
import * as THREE from 'three';

// ---------------------------------------------------------------- noise
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function makeNoise(seed = 7) {
  const r = rng(seed), P = new Uint8Array(512), G = new Float32Array(256);
  for (let i = 0; i < 256; i++) { P[i] = i; G[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; [P[i], P[j]] = [P[j], P[i]]; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = G[P[P[X] + Y]], b = G[P[P[X + 1] + Y]], c = G[P[P[X] + Y + 1]], d = G[P[P[X + 1] + Y + 1]];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; };
  return { n2, fbm };
}

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function tex(cv, { srgb = true, repeat = false, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// height field (Float32, 0..1) to a tangent-space normal map
export function normalFromHeight(h, w, hh, strength = 2, wrap = true) {
  const cv = canvas(w, hh), c = cv.getContext('2d'), img = c.createImageData(w, hh), d = img.data;
  const at = (x, y) => {
    if (wrap) { x = (x + w) % w; y = (y + hh) % hh; } else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(hh - 1, y)); }
    return h[y * w + x];
  };
  for (let y = 0; y < hh; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return tex(cv, { srgb: false, repeat: wrap });
}

// ---------------------------------------------------------------- oak desk planks
// 4096 x 512 covers 140 cm of grain by 17.5 cm across: about a third of a millimetre per texel.
export function oakPlank(seed = 3) {
  const W = 4096, H = 512, N = makeNoise(seed), N2 = makeNoise(seed + 9);
  const col = canvas(W, H), cc = col.getContext('2d'), ci = cc.createImageData(W, H), cd = ci.data;
  const rc = canvas(W, H), rcc = rc.getContext('2d'), ri = rcc.createImageData(W, H), rd = ri.data;
  const height = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const v = y / H * 17.5;
    for (let x = 0; x < W; x++) {
      const u = x / W * 140;
      const warp = N.fbm(u * 0.012, v * 0.06, 3) * 2.6 + N2.fbm(u * 0.08, v * 0.9, 2) * 0.35;
      const yy = v + warp;
      const ring = Math.pow(Math.abs(Math.sin(yy * Math.PI * 3.1)), 9);
      const late = Math.pow(Math.abs(Math.sin(yy * Math.PI * 3.1 + 0.6)), 3) * (0.5 + N2.n2(u * 0.05, v * 0.6));
      const pn = N2.n2(u * 2.2, v * 260);
      const pore = pn > 0.8 ? (pn - 0.8) * 3.5 : 0;
      const ray = 0;
      const tone = N.fbm(u * 0.02 + 30, v * 0.08, 3);
      const i = y * W + x, p = i * 4;
      const k = 0.55 + tone * 0.45;
      let r = 196 * k, g = 146 * k, b = 94 * k;
      const dark = ring * 0.3 + late * 0.07 + pore * 0.16;
      r *= 1 - dark; g *= 1 - dark * 1.1; b *= 1 - dark * 1.25;
      r += ray * 14; g += ray * 10; b += ray * 6;
      cd[p] = r; cd[p + 1] = g; cd[p + 2] = b; cd[p + 3] = 255;
      height[i] = 1 - ring * 0.3 - pore * 0.5;
      const rough = 0.34 + pore * 0.25 + ring * 0.05 + (N2.fbm(u * 0.08, v * 0.3, 2) - 0.5) * 0.18;
      rd[p] = rd[p + 1] = rd[p + 2] = Math.max(0, Math.min(255, rough * 255)); rd[p + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0); rcc.putImageData(ri, 0, 0);
  return { map: tex(col, { repeat: true }), roughnessMap: tex(rc, { srgb: false, repeat: true }), normalMap: normalFromHeight(height, W, H, 1.6) };
}

// ---------------------------------------------------------------- moulded orange track
// u runs along the track (one texture = one 30.5 cm piece), v across the moulded profile.
export function trackTextures() {
  const W = 1024, H = 256, N = makeNoise(21);
  const col = canvas(W, H), c = col.getContext('2d');
  const h = new Float32Array(W * H);
  const img = c.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 4;
    const n = N.fbm(x * 0.05, y * 0.05, 3);
    const seam = Math.min(x, W - 1 - x);
    const s = seam < 3 ? 1 : 0;
    const flow = N.fbm(x * 0.004, y * 0.02, 2);   // faint injection-moulding flow lines
    const k = 0.93 + n * 0.06 + flow * 0.05 - s * 0.55;
    d[p] = 255 * k; d[p + 1] = 255 * k; d[p + 2] = 255 * k; d[p + 3] = 255;
    h[i] = (N.n2(x * 0.7, y * 0.7) * 0.25) - s * 1.2 + (seam > 3 && seam < 9 ? 0.25 : 0);
  }
  c.putImageData(img, 0, 0);
  return { map: tex(col, { repeat: true }), normalMap: normalFromHeight(h, W, H, 1.2) };
}

// ---------------------------------------------------------------- paper
export function notebookPage(drawSketch) {
  const W = 1400, H = 990, cv = canvas(W, H), c = cv.getContext('2d'), N = makeNoise(5);
  c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, W, H);
  const img = c.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < W * H; i++) { const n = (N.n2((i % W) * 0.6, ((i / W) | 0) * 0.6) - 0.5) * 9; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n; }
  c.putImageData(img, 0, 0);
  c.strokeStyle = 'rgba(90,140,200,0.55)'; c.lineWidth = 1.4;
  for (let y = 120; y < H - 30; y += 33) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = 'rgba(220,70,70,0.6)'; c.beginPath(); c.moveTo(130, 0); c.lineTo(130, H); c.stroke();
  c.fillStyle = '#1d2c6b'; c.font = '600 54px "Caveat", cursive'; c.fillText('Desk GP — layout v3', 170, 95);
  c.font = '500 34px "Caveat", cursive';
  c.fillText('jump off the books!!', 960, 270);
  c.fillText('mug hairpin = bank it', 940, 640);
  c.fillText('3 laps · lights out', 170, 930);
  c.save(); c.translate(700, 520); drawSketch && drawSketch(c); c.restore();
  return tex(cv);
}

export function stickyNote(lines, bg = '#ffe873', ink = '#1d2c6b', seed = 2) {
  const S = 512, cv = canvas(S, S), c = cv.getContext('2d'), N = makeNoise(seed);
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
  const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(0,0,0,0.06)'); g.addColorStop(0.18, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S);
  const img = c.getImageData(0, 0, S, S), d = img.data;
  for (let i = 0; i < S * S; i++) { const n = (N.n2((i % S) * 0.8, ((i / S) | 0) * 0.8) - 0.5) * 10; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n; }
  c.putImageData(img, 0, 0);
  c.fillStyle = ink; c.textAlign = 'center';
  lines.forEach((l, i) => { c.font = `${l.w || 600} ${l.s || 92}px "Caveat", cursive`; c.save(); c.translate(S / 2, 150 + i * 120); c.rotate((l.r || 0) * Math.PI / 180); c.fillText(l.t, 0, 0); c.restore(); });
  return tex(cv);
}

// ---------------------------------------------------------------- books
export function bookCover(base, title, sub, seed) {
  const W = 1024, H = 1024, cv = canvas(W, H), c = cv.getContext('2d'), N = makeNoise(seed);
  c.fillStyle = base; c.fillRect(0, 0, W, H);
  const img = c.getImageData(0, 0, W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, weave = ((x % 4 < 2) !== (y % 4 < 2) ? 6 : -6) + (N.n2(x * 0.08, y * 0.08) - 0.5) * 22;
    d[i] += weave; d[i + 1] += weave; d[i + 2] += weave;
  }
  c.putImageData(img, 0, 0);
  c.fillStyle = 'rgba(232,212,160,0.92)'; c.textAlign = 'center';
  c.font = '700 64px Georgia, "Times New Roman", serif'; c.fillText(title, W / 2, H * 0.38);
  c.font = 'italic 36px Georgia, serif'; c.fillText(sub, W / 2, H * 0.46);
  c.strokeStyle = 'rgba(232,212,160,0.8)'; c.lineWidth = 4; c.strokeRect(70, 70, W - 140, H - 140);
  return tex(cv);
}

export function pageEdges() {
  const W = 256, H = 64, cv = canvas(W, H), c = cv.getContext('2d');
  c.fillStyle = '#efe8d6'; c.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 1) { c.fillStyle = `rgba(120,100,70,${0.05 + Math.random() * 0.12})`; c.fillRect(0, y, W, 0.6); }
  const t = tex(cv); t.wrapS = THREE.RepeatWrapping; return t;
}

// ---------------------------------------------------------------- keyboard legends (10 x 10 atlas)
export function keyAtlas(labels) {
  const S = 1280, cell = S / 10, cv = canvas(S, S), c = cv.getContext('2d');
  labels.forEach((k, i) => {
    const x = (i % 10) * cell, y = Math.floor(i / 10) * cell;
    c.fillStyle = k.bg; c.fillRect(x, y, cell, cell);
    const g = c.createRadialGradient(x + cell / 2, y + cell / 2, cell * 0.1, x + cell / 2, y + cell / 2, cell * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.12)'); c.fillStyle = g; c.fillRect(x, y, cell, cell);
    c.fillStyle = k.ink; c.textAlign = 'left'; c.textBaseline = 'top';
    c.font = `600 ${k.t.length > 2 ? 17 : 24}px "JetBrains Mono", ui-monospace, monospace`;
    c.fillText(k.t, x + cell * 0.2, y + cell * 0.2);
  });
  return tex(cv);
}

// ---------------------------------------------------------------- blister card
export function blisterCard() {
  const W = 768, H = 1024, cv = canvas(W, H), c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0f1f4d'); g.addColorStop(1, '#1a3c9a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, H * 0.62); c.rotate(-0.25);
  for (let i = -8; i < 9; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.0)'; c.fillRect(i * 60, -700, 30, 1400); }
  c.restore();
  // hang tab hole
  c.fillStyle = '#d9d5cc'; c.beginPath(); c.ellipse(W / 2, 70, 70, 24, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ff6a10'; c.beginPath(); c.moveTo(60, 150); c.lineTo(W - 60, 130); c.lineTo(W - 80, 330); c.lineTo(80, 345); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.font = '900 118px "Archivo", "Arial Black", sans-serif'; c.textAlign = 'center';
  c.save(); c.translate(W / 2, 270); c.rotate(-0.025); c.fillText('DESK GP', 0, 0); c.restore();
  c.font = '800 34px "Archivo", Arial, sans-serif'; c.fillStyle = '#ffd23a'; c.fillText('1:64 DIE-CAST · COLLECTOR SERIES', W / 2, 400);
  c.fillStyle = '#fff'; c.font = '800 46px "Archivo", Arial, sans-serif'; c.fillText('COUNTACH LP400', W / 2, H - 120);
  c.font = '600 24px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillText('No. 064 / 250  ·  AGES 3+', W / 2, H - 70);
  return tex(cv);
}

// ---------------------------------------------------------------- room surfaces
export function plasterWall(color = '#e9e2d6', seed = 4) {
  const S = 512, cv = canvas(S, S), c = cv.getContext('2d'), N = makeNoise(seed);
  c.fillStyle = color; c.fillRect(0, 0, S, S);
  const img = c.getImageData(0, 0, S, S), d = img.data;
  for (let i = 0; i < S * S; i++) { const x = i % S, y = (i / S) | 0; const n = (N.fbm(x * 0.04, y * 0.04, 4) - 0.5) * 14; d[i * 4] += n; d[i * 4 + 1] += n; d[i * 4 + 2] += n; }
  c.putImageData(img, 0, 0);
  return tex(cv, { repeat: true });
}

export function floorBoards() {
  const W = 1024, H = 1024, cv = canvas(W, H), c = cv.getContext('2d'), N = makeNoise(31);
  const img = c.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const board = Math.floor(y / 128), off = (board * 337) % W;
    const xx = (x + off) % W, seam = (y % 128 < 2) || (xx % 512 < 2);
    const g = N.fbm(xx * 0.004 + board * 9, (y % 128) * 0.06, 3);
    const k = (0.55 + g * 0.35 + (board % 3) * 0.04) * (seam ? 0.45 : 1);
    const i = (y * W + x) * 4; d[i] = 150 * k; d[i + 1] = 104 * k; d[i + 2] = 70 * k; d[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return tex(cv, { repeat: true });
}

export function skyView() {
  // what a phone exposed for the desk sees through the window: bright, soft, mostly blown out
  const W = 1024, H = 512, cv = canvas(W, H), c = cv.getContext('2d'), N = makeNoise(44);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#cfe0f2'); g.addColorStop(0.5, '#eef3f6'); g.addColorStop(1, '#e9e4d8');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.filter = 'blur(14px)';
  c.fillStyle = 'rgba(120,140,104,0.75)';
  c.beginPath(); c.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, H * 0.66 - N.fbm(x * 0.01, 2, 4) * 170);
  c.lineTo(W, H); c.closePath(); c.fill();
  c.fillStyle = 'rgba(190,150,130,0.55)'; c.fillRect(600, H * 0.6, 220, 120);
  c.filter = 'none';
  return tex(cv);
}

export function screenCanvas() { return canvas(1024, 576); }
export { tex as canvasTexture };
