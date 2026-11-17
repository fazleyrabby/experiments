// Turns a meshed SDF body into a 1:64 die-cast: candy paint with metal flake and
// clearcoat, tampo-printed graphics, glass and chrome zones painted from four
// projected canvases, chipped edges, chrome wheels on steel axle pins and an
// unpainted zamak base with embossed text.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CARS, STEP } from './cars.js';
import { surfaceNets } from './sdf.js';

export const SCALE = 100 / 64;            // centimetres of toy per metre of real car

// ------------------------------------------------------------------ meshing (workers)
export async function meshAll(ids, onProgress) {
  const out = {};
  let done = 0;
  const viaWorker = (id) => new Promise((resolve, reject) => {
    let w;
    try { w = new Worker(new URL('./meshWorker.js', import.meta.url), { type: 'module' }); } catch (err) { reject(err); return; }
    w.onmessage = (e) => { resolve(e.data); w.terminate(); };
    w.onerror = (err) => { w.terminate(); reject(err); };
    w.postMessage({ id });
  });
  const local = (id) => { const d = CARS[id]; return { id, ...surfaceNets((x, y, z) => d.sdf(x, y, z), d.bounds.min, d.bounds.max, STEP) }; };
  await Promise.all(ids.map(async (id) => {
    let m;
    try { m = await viaWorker(id); } catch (_) { m = local(id); }
    out[id] = m; done++; onProgress && onProgress(done / ids.length, id);
  }));
  return out;
}

function bodyGeometry(m) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normal, 3));
  g.setAttribute('aWear', new THREE.BufferAttribute(m.wear, 1));
  g.setIndex(new THREE.BufferAttribute(m.index, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ------------------------------------------------------------------ projected tampo canvases
const GLASS = '#ff0000', TRIM = '#00ff00', CHROME = '#0000ff', TRIM_HALF = '#007f00';

class Proj {
  // kind: side (x,y) | top (z,x) | front (z,y) | back (z,y). uv(a, b) is linear.
  constructor(kind, def, w, h) {
    const b = def.bounds, x0 = b.min[0], Lx = b.max[0] - b.min[0], ym = b.max[1] + 0.02, zm = b.max[2];
    this.kind = kind; this.w = w; this.h = h;
    let U, V; // coefficient vectors over (x, y, z, 1)
    if (kind === 'side') { U = [1 / Lx, 0, 0, -x0 / Lx]; V = [0, 1 / ym, 0, 0]; this.ab = (x, y, z) => [x, y]; }
    if (kind === 'top') { U = [0, 0, 1 / (2 * zm), 0.5]; V = [1 / Lx, 0, 0, -x0 / Lx]; this.ab = (x, y, z) => [z, x]; }
    if (kind === 'front') { U = [0, 0, -1 / (2 * zm), 0.5]; V = [0, 1 / ym, 0, 0]; this.ab = (x, y, z) => [z, y]; }
    if (kind === 'back') { U = [0, 0, 1 / (2 * zm), 0.5]; V = [0, 1 / ym, 0, 0]; this.ab = (x, y, z) => [z, y]; }
    this.U = new THREE.Vector4(...U); this.V = new THREE.Vector4(...V);
    // affine from the drawing coords (a, b) to uv
    const uvOf = (a, bb) => {
      const p = kind === 'side' ? [a, bb, 0] : kind === 'top' ? [bb, 0, a] : [0, bb, a];
      return [U[0] * p[0] + U[1] * p[1] + U[2] * p[2] + U[3], V[0] * p[0] + V[1] * p[1] + V[2] * p[2] + V[3]];
    };
    const o = uvOf(0, 0), ea = uvOf(1, 0), eb = uvOf(0, 1);
    this.T = [w * (ea[0] - o[0]), -h * (ea[1] - o[1]), w * (eb[0] - o[0]), -h * (eb[1] - o[1]), w * o[0], h * (1 - o[1])];
    this.pxPerM = Math.hypot(this.T[0], this.T[1]);
    this.cc = document.createElement('canvas'); this.cc.width = w; this.cc.height = h;
    this.zc = document.createElement('canvas'); this.zc.width = w; this.zc.height = h;
    this.c = this.cc.getContext('2d'); this.z = this.zc.getContext('2d');
    this.z.fillStyle = '#000'; this.z.fillRect(0, 0, w, h);
    for (const ctx of [this.c, this.z]) { ctx.setTransform(...this.T); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
    this.mirror = kind !== 'side';
  }
  toPx(a, b) { const T = this.T; return [T[0] * a + T[2] * b + T[4], T[1] * a + T[3] * b + T[5]]; }
  path(ctx, pts, close = true) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  // draw pts and (on symmetric projections) its mirror in a = -a
  each(pts, fn, sym = this.mirror) {
    fn(pts);
    if (sym) { const m = pts.slice(); for (let i = 0; i < m.length; i += 2) m[i] = -m[i]; fn(m); }
  }
  fill(ctx, pts, style, sym) { this.each(pts, (p) => { this.path(ctx, p); ctx.fillStyle = style; ctx.fill(); }, sym); }
  stroke(ctx, pts, style, width, close = false, sym) { this.each(pts, (p) => { this.path(ctx, p, close); ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke(); }, sym); }
  rect(ctx, a0, b0, a1, b1, style, sym) { this.fill(ctx, [a0, b0, a1, b0, a1, b1, a0, b1], style, sym); }
  rrect(ctx, a0, b0, a1, b1, r, style, sym) {
    this.each([a0, b0, a1, b1], (p) => {
      const [x0, y0, x1, y1] = [Math.min(p[0], p[2]), Math.min(p[1], p[3]), Math.max(p[0], p[2]), Math.max(p[1], p[3])];
      ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r); ctx.fillStyle = style; ctx.fill();
    }, sym);
  }
  circle(ctx, a, b, r, style, sym) { this.each([a, b], (p) => { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fillStyle = style; ctx.fill(); }, sym); }
  ring(ctx, a, b, r, style, width, sym) { this.each([a, b], (p) => { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke(); }, sym); }
  // text, readable from the projection's viewer; size in metres
  text(str, a, b, size, style, weight = 800, font = '"Archivo", "Arial Black", system-ui, sans-serif', ctx = this.c) {
    const [px, py] = this.toPx(a, b);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = `${weight} ${size * this.pxPerM}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = style; ctx.fillText(str, px, py); ctx.restore();
  }
  textures() {
    const make = (cv, srgb) => {
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8; t.premultiplyAlpha = srgb; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      return t;
    };
    return { c: make(this.cc, true), z: make(this.zc, false) };
  }
}

const panel = 'rgba(8,6,6,0.62)';
const LINE = 0.011;   // engraved shut line width, metres

// ---------------------------------------------------------------- liveries
const LIVERY = {
  countach(P, opt) {
    const { side: S, top: T, front: F, back: B } = P;
    // side glass, frame and quarter-vent slats
    const win = [0.70, 0.805, -0.10, 1.035, -0.60, 1.038, -0.62, 0.885, 0.42, 0.838];
    S.fill(S.z, win, GLASS); S.stroke(S.z, win, TRIM, 0.022, true);
    const vent = [-0.68, 1.025, -0.68, 0.89, -1.10, 0.925, -0.97, 1.0];
    S.fill(S.z, vent, TRIM);
    for (let x = -0.72; x > -1.07; x -= 0.055) S.stroke(S.z, [x, 0.9, x + 0.02, 1.02], '#000', 0.014);
    // door, sill and lid shut lines
    S.stroke(S.c, [0.74, 0.79, 0.77, 0.52, 0.72, 0.21], panel, LINE);
    S.stroke(S.c, [-0.64, 0.88, -0.66, 0.22], panel, LINE);
    S.stroke(S.c, [0.74, 0.215, -0.66, 0.215], panel, LINE * 0.8);
    // gold pinstripe along the crease, side markers
    const pin = [];
    for (let x = 0.72; x >= -1.02; x -= 0.05) pin.push(x, 0.50 + (0.85 - x) * 0.085 + 0.012);
    S.stroke(S.c, pin, opt.pin || 'rgba(214,170,74,0.95)', 0.016);
    S.rrect(S.c, 1.86, 0.40, 1.98, 0.445, 0.01, '#f2a01b');
    S.rrect(S.z, 1.86, 0.40, 1.98, 0.445, 0.01, GLASS);
    S.rrect(S.c, -1.98, 0.62, -1.86, 0.665, 0.01, '#c01818');
    S.rrect(S.z, -1.98, 0.62, -1.86, 0.665, 0.01, GLASS);

    // top: windshield, wiper, periscope glass, rear screen, louvres
    T.fill(T.z, [-0.60, 0.80, 0.60, 0.80, 0.52, -0.10, -0.52, -0.10], GLASS, false);
    T.stroke(T.z, [-0.61, 0.81, 0.61, 0.81, 0.53, -0.11, -0.53, -0.11], TRIM, 0.02, true, false);
    T.stroke(T.c, [0.34, 0.79, -0.30, 0.42], 'rgba(10,10,10,0.95)', 0.02, false, false);
    T.rect(T.z, -0.25, -0.58, 0.25, -0.64, GLASS, false);
    T.fill(T.z, [-0.48, -0.74, 0.48, -0.74, 0.55, -0.97, -0.55, -0.97], GLASS, false);
    T.rect(T.z, -0.46, -1.08, 0.46, -1.86, TRIM, false);
    for (let x = -1.12; x > -1.84; x -= 0.068) T.rect(T.z, -0.44, x, 0.44, x - 0.026, '#000', false);
    T.fill(T.z, [0.62, -0.74, 0.84, -0.80, 0.84, -1.22, 0.70, -1.22], TRIM);
    for (let x = -0.80; x > -1.2; x -= 0.06) T.stroke(T.z, [0.64, x, 0.83, x], '#000', 0.018);
    // front lid and pop-up lamp covers
    T.stroke(T.c, [-0.70, 0.86, 0.70, 0.86, 0.72, 1.95, -0.72, 1.95], panel, LINE, true, false);
    T.stroke(T.c, [0.36, 1.36, 0.70, 1.36, 0.70, 1.74, 0.36, 1.74], panel, LINE * 0.8, true);
    // hood roundel
    T.circle(T.c, 0, 1.36, 0.2, opt.roundel || '#f6f3ea', false);
    T.ring(T.c, 0, 1.36, 0.2, 'rgba(0,0,0,0.85)', 0.018, false);
    T.text(opt.number || '64', 0, 1.355, 0.25, '#111');
    T.rect(T.c, -0.85, -1.95, 0.85, -2.02, 'rgba(0,0,0,0)', false);

    // front: intake slot, lamps
    F.rect(F.z, -0.62, 0.26, 0.62, 0.355, TRIM, false);
    for (let y = 0.275; y < 0.35; y += 0.022) F.stroke(F.z, [-0.6, y, 0.6, y], '#003000', 0.006, false, false);
    F.rrect(F.c, 0.44, 0.385, 0.70, 0.44, 0.015, '#f3f0e6');
    F.rrect(F.c, 0.70, 0.385, 0.80, 0.44, 0.012, '#f0a020');
    F.rrect(F.z, 0.44, 0.385, 0.80, 0.44, 0.015, GLASS);
    F.fill(F.z, [-0.56, 0.78, 0.56, 0.78, 0.50, 1.05, -0.50, 1.05], GLASS, false);

    // back: grille, tail lamps, plate
    B.rect(B.z, -0.6, 0.48, 0.6, 0.72, TRIM, false);
    for (let y = 0.50; y < 0.71; y += 0.035) B.stroke(B.z, [-0.58, y, 0.58, y], '#000', 0.012, false, false);
    for (const [a0, a1, col] of [[0.62, 0.72, '#b8141a'], [0.72, 0.80, '#e8861a'], [0.80, 0.90, '#b8141a']]) {
      B.rect(B.c, a0, 0.50, a1, 0.70, col); B.rect(B.z, a0, 0.50, a1, 0.70, GLASS);
    }
    B.stroke(B.c, [0.62, 0.50, 0.62, 0.70], 'rgba(0,0,0,.6)', 0.01);
    B.rrect(B.c, -0.27, 0.31, 0.27, 0.44, 0.015, '#f4f1e8', false);
    B.text('DGP·64', 0, 0.375, 0.085, '#1b1b1b', 700, '"JetBrains Mono", ui-monospace, monospace');
    B.fill(B.z, [-0.44, 0.93, 0.44, 0.93, 0.40, 1.0, -0.40, 1.0], GLASS, false);
  },

  brawler(P) {
    const { side: S, top: T, front: F, back: B } = P;
    const win = [0.50, 0.935, -0.22, 1.215, -0.95, 1.232, -1.55, 1.04, -1.62, 0.955];
    S.fill(S.z, win, GLASS); S.stroke(S.z, win, CHROME, 0.026, true);
    S.stroke(S.z, [-0.42, 0.945, -0.42, 1.22], CHROME, 0.02);
    S.stroke(S.c, [0.52, 0.92, 0.54, 0.30], panel, LINE);
    S.stroke(S.c, [-0.86, 0.95, -0.88, 0.30], panel, LINE);
    S.stroke(S.c, [0.52, 0.30, -0.88, 0.30], panel, LINE * 0.8);
    // side stripe and chrome rocker
    S.fill(S.c, [2.30, 0.66, 2.30, 0.74, -2.0, 0.80, -2.0, 0.72], '#141414');
    S.fill(S.c, [2.30, 0.66, 2.30, 0.68, -2.0, 0.74, -2.0, 0.72], '#f6f3ea');
    S.rect(S.z, 1.0, 0.255, -1.0, 0.29, CHROME);
    S.rrect(S.c, 2.18, 0.48, 2.3, 0.53, 0.01, '#f2a01b'); S.rrect(S.c, -2.3, 0.6, -2.18, 0.65, 0.01, '#b8141a');
    S.text('440', 1.7, 0.72, 0.16, '#141414', 900);
    // top: glass, twin stripes, roundel
    const ws = [-0.66, 0.62, 0.66, 0.62, 0.60, -0.22, -0.60, -0.22];
    const bk = [-0.60, -0.95, 0.60, -0.95, 0.66, -1.95, -0.66, -1.95];
    T.rect(T.c, 0.07, -2.45, 0.30, 2.45, '#141414');
    T.rect(T.c, 0.315, -2.45, 0.33, 2.45, '#f6f3ea');
    T.c.save(); T.c.globalCompositeOperation = 'destination-out'; T.fill(T.c, ws, '#000', false); T.fill(T.c, bk, '#000', false); T.c.restore();
    T.fill(T.z, ws, GLASS, false); T.fill(T.z, bk, GLASS, false);
    T.stroke(T.z, ws, CHROME, 0.022, true, false); T.stroke(T.z, bk, CHROME, 0.022, true, false);
    T.rect(T.z, -0.2, 1.53, 0.2, 1.62, TRIM, false);
    T.circle(T.c, 0, -0.58, 0.19, '#f6f3ea', false);
    T.text('7', 0, -0.585, 0.27, '#141414', 900);
    T.stroke(T.c, [-0.78, 0.66, 0.78, 0.66, 0.80, 2.28, -0.80, 2.28], panel, LINE, true, false);
    T.stroke(T.c, [-0.80, -2.0, 0.80, -2.0, 0.80, -2.33, -0.80, -2.33], panel, LINE, true, false);
    // front: chrome bumper, grille, quad lamps
    F.rect(F.z, -0.9, 0.29, 0.9, 0.42, CHROME, false);
    F.rect(F.z, -0.78, 0.50, 0.78, 0.74, TRIM, false);
    F.stroke(F.z, [-0.78, 0.50, 0.78, 0.50, 0.78, 0.74, -0.78, 0.74], CHROME, 0.025, true, false);
    for (let a = -0.7; a < 0.71; a += 0.07) F.stroke(F.z, [a, 0.52, a, 0.72], '#003000', 0.012, false, false);
    for (const a of [0.40, 0.60]) {
      F.circle(F.z, a, 0.62, 0.075, CHROME); F.circle(F.z, a, 0.62, 0.058, GLASS);
      F.circle(F.c, a, 0.62, 0.05, 'rgba(236,236,226,0.92)');
    }
    F.rrect(F.c, -0.18, 0.31, 0.18, 0.4, 0.01, '#f4f1e8', false);
    // back: bumper, tail bars, gas cap
    B.rect(B.z, -0.9, 0.36, 0.9, 0.48, CHROME, false);
    B.rect(B.c, 0.15, 0.56, 0.82, 0.68, '#b8141a'); B.rect(B.z, 0.15, 0.56, 0.82, 0.68, GLASS);
    B.stroke(B.z, [0.15, 0.56, 0.82, 0.56, 0.82, 0.68, 0.15, 0.68], CHROME, 0.018, true);
    B.circle(B.z, 0, 0.62, 0.06, CHROME, false);
    B.rrect(B.c, -0.24, 0.38, 0.24, 0.47, 0.01, '#f4f1e8', false);
    B.text('BRWL 7', 0, 0.425, 0.06, '#1b1b1b', 700, '"JetBrains Mono", ui-monospace, monospace');
  },

  hatch(P) {
    const { side: S, top: T, front: F, back: B } = P;
    const w1 = [0.66, 0.935, 0.0, 1.33, -0.74, 1.345, -0.74, 0.935];
    const w2 = [-0.86, 0.935, -0.86, 1.345, -1.56, 1.355, -1.82, 1.27, -1.86, 0.94];
    for (const w of [w1, w2]) { S.fill(S.z, w, GLASS); S.stroke(S.z, w, TRIM, 0.03, true); }
    S.rect(S.z, -0.74, 0.93, -0.86, 1.36, TRIM);
    S.stroke(S.c, [0.70, 0.92, 0.72, 0.32], panel, LINE);
    S.stroke(S.c, [-0.80, 0.93, -0.80, 0.32], panel, LINE);
    S.rect(S.z, 2.0, 0.22, -2.0, 0.33, TRIM);
    // diagonal rally stripes
    S.fill(S.c, [1.98, 0.42, 1.98, 0.52, -1.98, 0.86, -1.98, 0.76], '#1f4fd6');
    S.fill(S.c, [1.98, 0.36, 1.98, 0.40, -1.98, 0.74, -1.98, 0.70], '#e2231a');
    S.text('RALLY', -0.12, 0.47, 0.13, '#141414', 900);
    // top
    const ws = [-0.66, 0.86, 0.66, 0.86, 0.62, 0.0, -0.62, 0.0];
    T.fill(T.z, ws, GLASS, false); T.stroke(T.z, ws, TRIM, 0.03, true, false);
    T.fill(T.z, [-0.62, -1.62, 0.62, -1.62, 0.60, -1.94, -0.60, -1.94], GLASS, false);
    T.rect(T.z, -0.68, -1.68, 0.68, -2.0, TRIM, false);
    T.rect(T.c, -0.20, 0.86, -0.08, 2.0, '#1f4fd6', false); T.rect(T.c, -0.06, 0.86, -0.01, 2.0, '#e2231a', false);
    T.rect(T.c, -0.20, 0.0, -0.08, -1.6, '#1f4fd6', false); T.rect(T.c, -0.06, 0.0, -0.01, -1.6, '#e2231a', false);
    T.circle(T.c, 0.3, -0.8, 0.22, '#f6f3ea', false); T.ring(T.c, 0.3, -0.8, 0.22, '#141414', 0.02, false);
    T.text('12', 0.3, -0.805, 0.24, '#141414', 900);
    T.stroke(T.c, [-0.72, 0.9, 0.72, 0.9, 0.74, 1.95, -0.74, 1.95], panel, LINE, true, false);
    // front: grille band with square lamps, black bumper
    F.rect(F.z, -0.62, 0.62, 0.62, 0.78, TRIM, false);
    for (const a of [0.48]) { F.rrect(F.z, a - 0.11, 0.645, a + 0.11, 0.755, 0.02, GLASS); F.rrect(F.c, a - 0.09, 0.66, a + 0.09, 0.74, 0.015, 'rgba(238,238,228,0.9)'); }
    F.rect(F.z, -0.82, 0.25, 0.82, 0.42, TRIM, false);
    F.rrect(F.c, -0.2, 0.28, 0.2, 0.38, 0.01, '#f4f1e8', false);
    F.fill(F.z, [-0.66, 0.89, 0.66, 0.89, 0.62, 1.35, -0.62, 1.35], GLASS, false);
    // back
    B.fill(B.z, [-0.62, 0.96, 0.62, 0.96, 0.60, 1.28, -0.60, 1.28], GLASS, false);
    B.rect(B.c, 0.5, 0.62, 0.76, 0.80, '#b8141a'); B.rect(B.z, 0.5, 0.62, 0.76, 0.80, GLASS);
    B.rect(B.z, -0.82, 0.25, 0.82, 0.42, TRIM, false);
    B.rrect(B.c, -0.24, 0.5, 0.24, 0.6, 0.01, '#f4f1e8', false);
    B.text('RLY 12', 0, 0.55, 0.06, '#1b1b1b', 700, '"JetBrains Mono", ui-monospace, monospace');
  },

  van(P) {
    const { side: S, top: T, front: F, back: B } = P;
    const w = [1.0, 1.12, 0.56, 1.70, 0.14, 1.72, 0.14, 1.14];
    S.fill(S.z, w, GLASS); S.stroke(S.z, w, CHROME, 0.025, true);
    S.stroke(S.c, [1.04, 1.06, 1.06, 0.33], panel, LINE);
    S.stroke(S.c, [0.06, 1.74, 0.06, 0.33], panel, LINE);
    S.stroke(S.c, [-0.10, 1.70, -0.10, 0.36, -1.3, 0.36, -1.3, 1.70, -0.10, 1.70], panel, LINE * 0.8);
    // flames: licking back from the front wheel
    const g = S.c.createLinearGradient(2.1, 0.8, -0.6, 0.8);
    g.addColorStop(0, '#ffe14a'); g.addColorStop(0.45, '#ff9a1a'); g.addColorStop(1, '#e8361b');
    S.c.save(); S.c.setTransform(...S.T);
    S.c.beginPath(); S.c.moveTo(2.16, 0.42); S.c.lineTo(2.16, 1.0);
    const tongues = [[1.0, 1.02, 0.30], [0.25, 0.92, 0.16], [-0.55, 0.80, 0.0], [0.05, 0.66, -0.08], [-0.85, 0.56, -0.22], [0.15, 0.45, -0.18]];
    let px = 1.7, py = 1.0;
    for (const [tx, ty, bias] of tongues) {
      S.c.bezierCurveTo(px - 0.3, py + 0.03, tx + 0.35, ty + 0.12 + bias * 0.2, tx, ty);
      const rx = tx + 0.55, ry = ty - 0.12;
      S.c.bezierCurveTo(tx + 0.2, ty - 0.02, rx - 0.2, ry + 0.05, rx, ry);
      px = rx; py = ry;
    }
    S.c.lineTo(2.16, 0.42); S.c.closePath();
    S.c.fillStyle = g; S.c.fill(); S.c.strokeStyle = 'rgba(150,20,10,0.9)'; S.c.lineWidth = 0.014; S.c.stroke();
    S.c.restore();
    S.text('HAULER', -0.75, 1.35, 0.17, '#ffd23a', 900);
    S.rect(S.z, 2.0, 0.27, -2.0, 0.30, TRIM);
    // top: windshield and roof stripe
    T.fill(T.z, [-0.78, 1.06, 0.78, 1.06, 0.74, 0.58, -0.74, 0.58], GLASS, false);
    T.rect(T.c, -0.12, 0.4, 0.12, -1.9, '#ffd23a', false);
    T.circle(T.c, 0, -0.9, 0.26, '#f6f3ea', false); T.text('3', 0, -0.905, 0.34, '#141414', 900);
    // front
    F.fill(F.z, [-0.76, 1.09, 0.76, 1.09, 0.70, 1.72, -0.70, 1.72], GLASS, false);
    F.stroke(F.z, [-0.77, 1.08, 0.77, 1.08, 0.71, 1.73, -0.71, 1.73], CHROME, 0.025, true, false);
    F.rect(F.z, -0.6, 0.46, 0.6, 0.76, CHROME, false);
    for (let y = 0.49; y < 0.75; y += 0.045) F.rect(F.z, -0.56, y, 0.56, y + 0.02, TRIM, false);
    F.circle(F.z, 0.72, 0.78, 0.1, CHROME); F.circle(F.z, 0.72, 0.78, 0.075, GLASS); F.circle(F.c, 0.72, 0.78, 0.065, 'rgba(238,238,228,0.92)');
    F.rect(F.z, -0.9, 0.28, 0.9, 0.40, CHROME, false);
    // back
    B.stroke(B.c, [0, 0.32, 0, 1.74], panel, LINE, false, false);
    B.rrect(B.z, 0.12, 1.25, 0.68, 1.65, 0.04, GLASS);
    B.rect(B.c, 0.78, 0.5, 0.86, 0.92, '#b8141a'); B.rect(B.z, 0.78, 0.5, 0.86, 0.92, GLASS);
    B.rect(B.z, -0.9, 0.3, 0.9, 0.42, CHROME, false);
    B.rrect(B.c, -0.24, 0.48, 0.24, 0.58, 0.01, '#f4f1e8', false);
    B.text('HAUL 3', 0, 0.53, 0.06, '#1b1b1b', 700, '"JetBrains Mono", ui-monospace, monospace');
  },
};

// ---------------------------------------------------------------- paint shader
const VERT_PARS = 'attribute float aWear;\nvarying vec3 vLP;\nvarying vec3 vLN;\nvarying float vWear;\n';
const FRAG_PARS = /* glsl */`
uniform sampler2D tC0; uniform sampler2D tZ0; uniform sampler2D tC1; uniform sampler2D tZ1;
uniform sampler2D tC2; uniform sampler2D tZ2; uniform sampler2D tC3; uniform sampler2D tZ3;
uniform vec4 uU0; uniform vec4 uV0; uniform vec4 uU1; uniform vec4 uV1;
uniform vec4 uU2; uniform vec4 uV2; uniform vec4 uU3; uniform vec4 uV3;
uniform vec3 uPaint; uniform float uPaintMetal; uniform float uPaintRough; uniform float uWearAmt; uniform float uFlake;
varying vec3 vLP; varying vec3 vLN; varying float vWear;
float dcH(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dcN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dcH(i), dcH(i + vec3(1,0,0)), f.x), mix(dcH(i + vec3(0,1,0)), dcH(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(dcH(i + vec3(0,0,1)), dcH(i + vec3(1,0,1)), f.x), mix(dcH(i + vec3(0,1,1)), dcH(i + vec3(1,1,1)), f.x), f.y), f.z); }
vec2 dcUV(vec4 U, vec4 V){ vec4 p = vec4(vLP, 1.0); return vec2(dot(U, p), dot(V, p)); }
float dcIn(vec2 uv){ return step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); }
`;
const FRAG_ZONES = /* glsl */`
  vec3 dcn = normalize(vLN);
  vec3 dcw = pow(abs(dcn), vec3(5.0));
  float dsum = dcw.x + dcw.y + dcw.z + 1e-5;
  float w0 = dcw.z / dsum, w1 = (dcn.y > 0.0 ? dcw.y : 0.0) / dsum;
  float w2 = (dcn.x > 0.0 ? dcw.x : 0.0) / dsum, w3 = (dcn.x < 0.0 ? dcw.x : 0.0) / dsum;
  vec2 u0 = dcUV(uU0, uV0), u1 = dcUV(uU1, uV1), u2 = dcUV(uU2, uV2), u3 = dcUV(uU3, uV3);
  w0 *= dcIn(u0); w1 *= dcIn(u1); w2 *= dcIn(u2); w3 *= dcIn(u3);
  vec4 dC = texture2D(tC0, u0) * w0 + texture2D(tC1, u1) * w1 + texture2D(tC2, u2) * w2 + texture2D(tC3, u3) * w3;
  vec3 dZ = texture2D(tZ0, u0).rgb * w0 + texture2D(tZ1, u1).rgb * w1 + texture2D(tZ2, u2).rgb * w2 + texture2D(tZ3, u3).rgb * w3;
  float zg = dZ.r, zt = dZ.g, zc = dZ.b;
  float zp = clamp(1.0 - zg - zt - zc, 0.0, 1.0);
  float chipN = dcN(vLP * 40.0) * 0.65 + dcN(vLP * 130.0) * 0.35;
  float chip = zp * uWearAmt * smoothstep(0.66, 0.70, chipN) * smoothstep(16.0, 42.0, vWear);
  vec3 base = uPaint * zp + vec3(0.010) * zg + vec3(0.016) * zt + vec3(0.93) * zc;
  float zMet = uPaintMetal * zp + zc;
  float zRou = uPaintRough * zp + 0.035 * zg + 0.52 * zt + 0.06 * zc;
  float zCoat = zp + zg;
  base = base * (1.0 - dC.a) + dC.rgb;
  zMet *= 1.0 - dC.a;
  zRou = mix(zRou, mix(0.24, 0.05, zg), dC.a);
  base = mix(base, vec3(0.56, 0.57, 0.59), chip);
  zMet = mix(zMet, 1.0, chip); zRou = mix(zRou, 0.36, chip); zCoat *= 1.0 - chip;
  float zFlake = zp * (1.0 - dC.a) * (1.0 - chip) * uFlake;
  diffuseColor.rgb = base;
`;

export function paintMaterial(projs, paint) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.035,
  });
  const order = ['side', 'top', 'front', 'back'];
  const uniforms = {
    uPaint: { value: new THREE.Color(paint.color) },
    uPaintMetal: { value: paint.metal ?? 1 },
    uPaintRough: { value: paint.rough ?? 0.2 },
    uWearAmt: { value: paint.wear ?? 1 },
    uFlake: { value: paint.flake ?? 1 },
  };
  order.forEach((k, i) => {
    const t = projs[k].textures();
    uniforms['tC' + i] = { value: t.c }; uniforms['tZ' + i] = { value: t.z };
    uniforms['uU' + i] = { value: projs[k].U }; uniforms['uV' + i] = { value: projs[k].V };
  });
  mat.userData.uniforms = uniforms;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = VERT_PARS + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLP = position; vLN = normal; vWear = aWear;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + FRAG_ZONES)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = zRou;')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n metalnessFactor = zMet;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 fc = floor(vLP * 320.0);
          vec3 fr = vec3(dcH(fc), dcH(fc + 17.0), dcH(fc + 41.0)) * 2.0 - 1.0;
          normal = normalize(normal + fr * 0.045 * zFlake); }`)
      .replace('#include <lights_physical_fragment>', '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\n material.clearcoat *= zCoat;\n#endif');
  };
  mat.customProgramCacheKey = () => 'diecast-paint';
  return mat;
}

// ---------------------------------------------------------------- wheels
const chromeMat = () => new THREE.MeshPhysicalMaterial({ color: 0xeef0f2, metalness: 1, roughness: 0.07, clearcoat: 0.6, clearcoatRoughness: 0.05 });
const goldMat = () => new THREE.MeshPhysicalMaterial({ color: 0xe0b45a, metalness: 1, roughness: 0.16, clearcoat: 0.5 });
const tireMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, metalness: 0, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 });
const steelMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.25 });

function rimShape(style, R) {
  const s = new THREE.Shape(); s.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = (fn) => { const p = new THREE.Path(); fn(p); s.holes.push(p); };
  if (style === 'dial') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + 0.3, r = R * 0.56;
      hole((p) => p.absarc(Math.cos(a) * r, Math.sin(a) * r, R * 0.2, 0, Math.PI * 2, true));
    }
  } else if (style === 'dish') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r0 = R * 0.42, r1 = R * 0.78, hw = R * 0.1;
      hole((p) => {
        p.moveTo(ca * r0 - sa * hw, sa * r0 + ca * hw);
        p.lineTo(ca * r1 - sa * hw, sa * r1 + ca * hw);
        p.absarc(ca * r1, sa * r1, hw, a + Math.PI / 2, a - Math.PI / 2, true);
        p.lineTo(ca * r0 + sa * hw, sa * r0 - ca * hw);
        p.absarc(ca * r0, sa * r0, hw, a - Math.PI / 2, a - Math.PI * 1.5, true);
      });
    }
  } else {
    const n = style === 'six' ? 6 : 5, spoke = style === 'six' ? 0.17 : 0.23;
    for (let i = 0; i < n; i++) {
      const a0 = (i + spoke) / n * Math.PI * 2, a1 = (i + 1 - spoke) / n * Math.PI * 2;
      const ro = R * 0.84, ri = R * 0.36;
      hole((p) => {
        p.absarc(0, 0, ro, a0 + 0.03, a1 - 0.03, false);
        p.lineTo(Math.cos((a0 + a1) / 2) * ri * 1.15, Math.sin((a0 + a1) / 2) * ri * 1.15);
        p.closePath();
      });
    }
  }
  return s;
}

function makeWheel(r, w, style, finish) {
  const g = new THREE.Group();
  const rim = r * 0.68;
  // tyre: lathe around y, turned so the axle runs along z
  const pts = [];
  const lip = 0.025;
  pts.push(new THREE.Vector2(rim * 0.98, -w / 2));
  pts.push(new THREE.Vector2(r - lip, -w / 2));
  pts.push(new THREE.Vector2(r - lip * 0.3, -w / 2 + lip * 0.3));
  pts.push(new THREE.Vector2(r, -w / 2 + lip));
  for (const t of [-0.22, 0.22]) {
    pts.push(new THREE.Vector2(r, w * t - 0.012)); pts.push(new THREE.Vector2(r - 0.008, w * t - 0.006));
    pts.push(new THREE.Vector2(r - 0.008, w * t + 0.006)); pts.push(new THREE.Vector2(r, w * t + 0.012));
  }
  pts.push(new THREE.Vector2(r, w / 2 - lip));
  pts.push(new THREE.Vector2(r - lip * 0.3, w / 2 - lip * 0.3));
  pts.push(new THREE.Vector2(r - lip, w / 2));
  pts.push(new THREE.Vector2(rim * 0.98, w / 2));
  const tg = new THREE.LatheGeometry(pts, 48);
  tg.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tg, tireMat); tire.castShadow = true; tire.receiveShadow = true;
  g.add(tire);
  const metal = finish === 'gold' ? goldMat() : chromeMat();
  // rim barrel, recessed face, dark well behind the holes
  const dish = style === 'dish' ? 0.07 : 0.02;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rim, rim, w * 0.92, 40, 1, true), metal);
  barrel.rotation.x = Math.PI / 2; g.add(barrel);
  const face = new THREE.Mesh(new THREE.ExtrudeGeometry(rimShape(style, rim * 0.97), { depth: 0.025, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 40 }), metal);
  face.position.z = w / 2 - dish - 0.025; g.add(face);
  if (style === 'dish') {
    const lipRing = new THREE.Mesh(new THREE.TorusGeometry(rim * 0.98, 0.018, 8, 48), metal);
    lipRing.position.z = w / 2 - 0.01; g.add(lipRing);
  }
  const well = new THREE.Mesh(new THREE.CircleGeometry(rim * 0.97, 40), darkMat);
  well.position.z = w / 2 - dish - 0.09; g.add(well);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(rim * 0.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal);
  cap.rotation.x = Math.PI / 2; cap.position.z = w / 2 - dish + 0.005; cap.scale.set(1, 0.45, 1); g.add(cap);
  // the axle pin's peened head in the middle of the cap
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.02, 16), steelMat);
  pin.rotation.x = Math.PI / 2; pin.position.z = w / 2 - dish + 0.03; g.add(pin);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

// ---------------------------------------------------------------- base plate
function baseTexture(def) {
  const W = 1024, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#808080'; c.fillRect(0, 0, W, H);
  c.fillStyle = '#c4c4c4'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '900 46px "Archivo", "Arial Black", sans-serif'; c.fillText('DESK GP', W * 0.5, H * 0.32);
  c.font = '700 26px "Archivo", Arial, sans-serif'; c.fillText(def.name.toUpperCase() + '  ·  1:64', W * 0.5, H * 0.56);
  c.font = '600 18px "JetBrains Mono", monospace'; c.fillText('© 2026  ·  MADE IN THE STUDIO  ·  DIE-CAST METAL', W * 0.5, H * 0.76);
  c.strokeStyle = '#c4c4c4'; c.lineWidth = 6; c.strokeRect(14, 14, W - 28, H - 28);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4;
  return t;
}

// ---------------------------------------------------------------- assembly
export const PAINTS = [
  { id: 'candy-red', name: 'Candy red', color: '#b0060f', css: '#c3121c' },
  { id: 'lime', name: 'Spectra lime', color: '#5fae08', css: '#7bd11a' },
  { id: 'aqua', name: 'Aqua', color: '#0a6fb0', css: '#1c8fd8' },
  { id: 'magenta', name: 'Magenta', color: '#a1084f', css: '#d01a72' },
  { id: 'gold', name: 'Gold', color: '#b0820f', css: '#d8a62a' },
  { id: 'black', name: 'Gloss black', color: '#0b0b0d', css: '#18181c', rough: 0.2, metal: 0.6 },
  { id: 'white', name: 'Pearl white', color: '#e8e6e0', css: '#f2f0ea', rough: 0.32, metal: 0.25 },
];

const RIVAL_PAINT = {
  brawler: { color: '#d4520a', rough: 0.2 },
  hatch: { color: '#ece9e2', rough: 0.33, metal: 0.22 },
  van: { color: '#4b1590', rough: 0.2 },
};

export function buildCar(id, meshData, opts = {}) {
  const def = CARS[id];
  const projs = {
    side: new Proj('side', def, 2048, 512),
    top: new Proj('top', def, 1024, 2048),
    front: new Proj('front', def, 1024, 512),
    back: new Proj('back', def, 1024, 512),
  };
  LIVERY[id](projs, opts.livery || {});
  const paint = opts.paint || RIVAL_PAINT[id] || PAINTS[0];
  const body = new THREE.Mesh(bodyGeometry(meshData), paintMaterial(projs, paint));
  body.castShadow = true; body.receiveShadow = true;

  const model = new THREE.Group();
  model.scale.setScalar(SCALE);
  model.add(body);

  // zamak base plate with embossed text, rivets and axle pins
  const baseLen = def.length - 0.36, baseW = Math.min(def.trackF - def.tireWF / 2, def.trackR - def.tireWR / 2) * 2 - 0.1;
  const zamak = new THREE.MeshStandardMaterial({ color: 0xa4a7ab, metalness: 1, roughness: 0.42, bumpMap: baseTexture(def), bumpScale: 1.5 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(baseLen, 0.06, baseW, 3, 0.02), zamak);
  base.position.set((def.axleF + def.axleR) / 2 * 0.15, 0.175, 0);
  // the embossed lettering faces the ground
  base.geometry.attributes.uv && remapBaseUV(base.geometry, baseLen, baseW);
  base.castShadow = true; model.add(base);
  for (const x of [def.axleF - 0.48, def.axleR + 0.45]) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steelMat);
    rivet.position.set(x, 0.145, 0); rivet.scale.set(1, 0.5, 1); model.add(rivet);
  }
  const wheels = [];
  const addAxle = (x, r, w, track) => {
    const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, track * 2, 10), steelMat);
    ax.rotation.x = Math.PI / 2; ax.position.set(x, r, 0); model.add(ax);
    for (const side of [1, -1]) {
      const wheel = makeWheel(r, w, def.wheelStyle, def.wheelFinish);
      const holder = new THREE.Group();
      holder.position.set(x, r, side * track);
      if (side < 0) holder.rotation.y = Math.PI;
      holder.add(wheel);
      model.add(holder);
      wheels.push({ holder, wheel, side, front: x > 0, r });
    }
  };
  addAxle(def.axleF, def.rF, def.tireWF, def.trackF);
  addAxle(def.axleR, def.rR, def.tireWR, def.trackR);
  addExtras(id, def, model);

  const root = new THREE.Group();
  root.add(model);
  root.userData.def = def;
  return {
    id, def, root, model, body, wheels, material: body.material,
    length: def.length * SCALE, width: def.width * SCALE, height: def.height * SCALE,
    wheelbase: (def.axleF - def.axleR) * SCALE,
    cgToFront: def.axleF * SCALE, cgToRear: -def.axleR * SCALE,
    setPaint(p) {
      const u = body.material.userData.uniforms;
      u.uPaint.value.set(p.color); u.uPaintRough.value = p.rough ?? 0.2; u.uPaintMetal.value = p.metal ?? 1;
    },
  };
}

function remapBaseUV(g, L, W) {
  const pos = g.attributes.position, uv = g.attributes.uv, nrm = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    if (nrm.getY(i) < -0.5) uv.setXY(i, 1 - (pos.getX(i) / L + 0.5), pos.getZ(i) / W + 0.5);
    else uv.setXY(i, 0.01, 0.01);
  }
  uv.needsUpdate = true;
}

function addExtras(id, def, model) {
  const chrome = chromeMat();
  const blackPlastic = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.5 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = true; model.add(m); return m;
  };
  if (id === 'countach') {
    // four exhaust tips under the tail
    for (const z of [-0.33, -0.21, 0.21, 0.33]) add(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 16, 1, true), chrome, -2.05, 0.27, z, 0, 0, Math.PI / 2);
    // side mirrors on stalks
    for (const s of [1, -1]) {
      add(new THREE.BoxGeometry(0.03, 0.03, 0.12), chrome, 0.62, 0.86, s * 0.74);
      add(new RoundedBoxGeometry(0.16, 0.09, 0.08, 2, 0.025), chrome, 0.6, 0.88, s * 0.83);
    }
  }
  if (id === 'brawler') {
    for (const z of [-0.55, 0.55]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16, 1, true), chrome, -2.38, 0.3, z, 0, 0, Math.PI / 2);
    for (const s of [1, -1]) add(new RoundedBoxGeometry(0.13, 0.08, 0.1, 2, 0.03), chrome, 0.5, 0.98, s * 0.88);
  }
  if (id === 'hatch') {
    // roof-bar of rally lamps and mud flaps
    for (const z of [-0.45, -0.15, 0.15, 0.45]) {
      const lamp = add(new THREE.CylinderGeometry(0.085, 0.085, 0.07, 24), chrome, 2.02, 0.56, z, 0, 0, Math.PI / 2);
      const lens = add(new THREE.CircleGeometry(0.07, 24), new THREE.MeshPhysicalMaterial({ color: 0xfff6d8, roughness: 0.05, transmission: 0, emissive: 0x332a10 }), 2.06, 0.56, z, 0, Math.PI / 2, 0);
      lamp.castShadow = lens.castShadow = true;
    }
    add(new THREE.BoxGeometry(0.04, 0.04, 0.9), blackPlastic, 2.0, 0.56, 0);
    for (const s of [1, -1]) add(new THREE.BoxGeometry(0.02, 0.2, 0.26), blackPlastic, -1.62, 0.2, s * 0.74);
  }
  if (id === 'van') {
    // supercharger blower through the hood, side pipes
    add(new RoundedBoxGeometry(0.42, 0.22, 0.3, 3, 0.05), chrome, 1.62, 1.08, 0);
    add(new RoundedBoxGeometry(0.3, 0.16, 0.24, 3, 0.04), chrome, 1.66, 1.26, 0);
    add(new RoundedBoxGeometry(0.06, 0.12, 0.18, 2, 0.02), blackPlastic, 1.83, 1.27, 0);
    add(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20), blackPlastic, 1.88, 1.08, 0, 0, 0, Math.PI / 2);
    for (const s of [1, -1]) {
      add(new THREE.CylinderGeometry(0.045, 0.045, 1.9, 16), chrome, 0.1, 0.3, s * 0.93, 0, 0, Math.PI / 2);
      for (let x = -0.6; x <= 0.8; x += 0.35) add(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 12), chrome, x, 0.4, s * 0.91);
    }
  }
}
