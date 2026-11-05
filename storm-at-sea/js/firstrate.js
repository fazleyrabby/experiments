import * as THREE from 'three';
import { Batch, M, V3, BOX, CYL, CYL8, SPH, shared } from './ship.js';
import { rng } from './textures.js';
import {
  SAIL, windState, sailMaterial, squareSail, foreAftSail, flagMesh, finish, sailTexture, deckTexture, galleryTexture, glowMat,
} from './wooden.js';
import { buildCrew } from './humans.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/*
  First-rate ship of the line, rebuilt as one sculpted form:
  - a single lofted hull with round bilge, tumblehome, a raked stem, and a stern counter
    that sweeps up and aft into a curved, many-windowed stern gallery with open stern walks;
  - planking with real relief (normal map), copper sheathing below the waterline,
    black and ochre strakes, raised wales, weathering, red-painted inner bulwarks;
  - a cutwater and curved headrails carrying a gilded lion figurehead;
  - tapered masts with tops and crosstrees, tapered yards, trapezoid sails, ratlines,
    deadeyes and chainplates, stays and running rigging;
  - gun decks with hinged red-lined port lids, guns, capstan, wheel, boats, and a working crew.
*/

const lerp = THREE.MathUtils.lerp;
const sstep = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/* ------------------------------------------------------------------ hull materials */

// One 8 m tile of hull, full height. Colour, height (for the normal map) and roughness are drawn together.
export function hullTextures({ Hmax, T, bands, ghost, seed, hi, copper = true, plank = 0.27, tile = 8, paint = null }) {
  const r = rng(seed);
  const W = hi ? 1024 : 512, H = hi ? 2048 : 1024;
  const pxm = W / tile, pym = H / Hmax;
  const Y = (ym) => H - ym * pym;
  const [c, x] = canvas(W, H);
  const [hc, h] = canvas(W, H);
  const [rc, rx] = canvas(W, H);
  h.fillStyle = '#808080'; h.fillRect(0, 0, W, H);
  // paint bands
  for (const b of bands) { x.fillStyle = b.color; x.fillRect(0, Y(b.to), W, (b.to - b.from) * pym + 1); rx.fillStyle = b.rough; rx.fillRect(0, Y(b.to), W, (b.to - b.from) * pym + 1); }
  // copper sheathing: staggered plates with nail lines and verdigris
  const cu = copper ? T + 0.15 : 0;
  for (let ym = 0, row = 0; ym < cu; ym += 0.36, row++) {
    for (let xm = (row % 2) * 0.6 - 1.2; xm < tile; xm += 1.2) {
      const k = 0.85 + r() * 0.3;
      x.fillStyle = ghost ? `rgba(${40 * k},${70 * k},${58 * k},1)` : `rgb(${165 * k | 0},${96 * k | 0},${58 * k | 0})`;
      x.fillRect(xm * pxm + 1, Y(ym + 0.36) + 1, 1.2 * pxm - 2, 0.36 * pym - 2);
      h.fillStyle = '#9a9a9a'; h.fillRect(xm * pxm + 1, Y(ym + 0.36) + 1, 1.2 * pxm - 2, 0.36 * pym - 2);
      h.fillStyle = '#5a5a5a'; h.fillRect(xm * pxm, Y(ym + 0.36), 1.2 * pxm, 1);
    }
  }
  for (let i = 0; i < (copper ? 220 : 0); i++) { x.fillStyle = `rgba(${70 + r() * 30},${140 + r() * 40},${110 + r() * 30},${r() * 0.35})`; x.beginPath(); x.ellipse(r() * W, Y(r() * cu), 4 + r() * 40, 3 + r() * 14, 0, 0, Math.PI * 2); x.fill(); }
  // planking above the copper: strakes, staggered butts, treenails, grain
  for (let ym = cu; ym < Hmax; ym += plank) {
    h.fillStyle = '#3c3c3c'; h.fillRect(0, Y(ym), W, 2);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, Y(ym), W, 1.5);
    x.fillStyle = 'rgba(255,240,210,0.05)'; x.fillRect(0, Y(ym) + 2, W, 1);
    for (let xm = r() * 3; xm < tile; xm += 2.6 + r() * 3) {
      h.fillStyle = '#4a4a4a'; h.fillRect(xm * pxm, Y(ym + plank), 2, plank * pym);
      x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(xm * pxm, Y(ym + plank), 1.5, plank * pym);
      for (const dy of [0.08, 0.19]) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(xm * pxm + 5, Y(ym + dy), 2, 2); }
    }
    for (let k = 0; k < 14; k++) {
      const gy = Y(ym + r() * plank), gx = r() * W, gl = 30 + r() * 160;
      h.fillStyle = r() < 0.5 ? 'rgba(150,150,150,0.35)' : 'rgba(100,100,100,0.35)'; h.fillRect(gx, gy, gl, 1);
      x.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.06})`; x.fillRect(gx, gy, gl, 1);
    }
  }
  // weathering: wet line, salt crust, streaks running down from above
  let g = x.createLinearGradient(0, Y(T + 1.2), 0, Y(T - 0.2));
  g.addColorStop(0, 'rgba(230,235,225,0)'); g.addColorStop(0.6, 'rgba(230,235,225,0.10)'); g.addColorStop(1, 'rgba(20,25,20,0.35)');
  x.fillStyle = g; x.fillRect(0, Y(T + 1.2), W, 1.4 * pym);
  for (let i = 0; i < 70; i++) {
    const sx = r() * W, sy = Y(cu + 0.5 + r() * (Hmax - cu - 1)), len = (0.6 + r() * 2.5) * pym;
    g = x.createLinearGradient(0, sy, 0, sy + len);
    const rust = r() < 0.4;
    g.addColorStop(0, rust ? 'rgba(120,60,25,0.35)' : 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(sx, sy, 1 + r() * 4, len);
  }
  if (ghost) {
    for (let i = 0; i < 40; i++) { const hx = r() * W, hy = Y(cu + 1 + r() * (Hmax - cu - 2)); x.fillStyle = 'rgba(3,5,4,0.95)'; x.fillRect(hx, hy, (0.4 + r()) * pxm, (0.15 + r() * 0.3) * pym); h.fillStyle = '#202020'; h.fillRect(hx, hy, (0.4 + r()) * pxm, (0.15 + r() * 0.3) * pym); }
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(160,165,140,${r() * 0.4})`; x.beginPath(); x.arc(r() * W, Y(r() * (T + 1.5)), 1 + r() * 4, 0, Math.PI * 2); x.fill(); }
  }
  if (paint) paint({ x, h, Y, pxm, pym, W, H, r });
  // height -> tangent-space normal map
  const nW = W / 2, nH = H / 2;
  const [nc, nx] = canvas(nW, nH);
  nx.drawImage(hc, 0, 0, nW, nH);
  const src = nx.getImageData(0, 0, nW, nH), d = src.data, outD = nx.createImageData(nW, nH);
  const hgt = (i, j) => d[(((j + nH) % nH) * nW + ((i + nW) % nW)) * 4] / 255;
  for (let j = 0; j < nH; j++) for (let i = 0; i < nW; i++) {
    const dx = (hgt(i + 1, j) - hgt(i - 1, j)) * 3.0, dy = (hgt(i, j + 1) - hgt(i, j - 1)) * 3.0;
    const len = Math.hypot(dx, dy, 1), k = (j * nW + i) * 4;
    outD.data[k] = (-dx / len * 0.5 + 0.5) * 255; outD.data[k + 1] = (dy / len * 0.5 + 0.5) * 255; outD.data[k + 2] = (1 / len * 0.5 + 0.5) * 255; outD.data[k + 3] = 255;
  }
  nx.putImageData(outD, 0, 0);
  const wrap = (t2) => { t2.wrapS = THREE.RepeatWrapping; t2.wrapT = THREE.ClampToEdgeWrapping; return t2; };
  return { map: wrap(tex(c)), normalMap: wrap(tex(nc, false)), roughnessMap: wrap(tex(rc, false)) };
}

function ratlineTexture() {
  const [c, x] = canvas(256, 32);
  x.clearRect(0, 0, 256, 32);
  x.fillStyle = '#1a140e';
  for (let k = 0; k < 7; k++) x.fillRect(4 + k * (248 / 6) - 2, 0, 4, 32);   // shrouds
  x.fillRect(0, 15, 256, 2);                                               // one ratline per tile
  const t = tex(c); t.wrapT = THREE.RepeatWrapping;
  return t;
}

function gratingTexture() {
  const [c, x] = canvas(128, 128);
  x.fillStyle = '#6b4a2b'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#120c08';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) x.fillRect(i * 16 + 4, j * 16 + 4, 9, 9);
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ------------------------------------------------------------------ carved work (Blender) */

// Stern galleries, quarter galleries, figurehead and gun barrels are modelled by
// tools/blender/firstrate_carved.py (all generated from code, AO baked into vertex colours).
const carvedP = {};
export function loadCarved(file) {
  if (!carvedP[file]) {
    const draco = new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/');
    carvedP[file] = new GLTFLoader().setDRACOLoader(draco).loadAsync(new URL(`../assets/${file}`, import.meta.url).href);
  }
  return carvedP[file];
}

// lift the baked occlusion so crevices darken without going black (once per shared geometry)
export function liftAO(g, floor = 0.3) {
  const c = g.attributes.color;
  if (!c || g.userData.lifted) return;
  for (let i = 0; i < c.count; i++) { const k = floor + (1 - floor) * c.getX(i); c.setXYZ(i, k, k, k); }
  g.userData.lifted = true;
}

function fitCarved(gltf, { group, carvedGroup, gunXf, carriageXf, glowMats, ghost, mats }) {
  const aoMat = (base, extra = {}) => { const m = base.clone(); m.vertexColors = true; Object.assign(m, extra); return m; };
  const glass = (color, glow) => {
    const m = new THREE.MeshStandardMaterial({ color: ghost ? '#0b1210' : '#22323d', roughness: 0.04, metalness: 0.92, envMapIntensity: 1.8, emissive: color, emissiveIntensity: glow, vertexColors: true });
    m.userData.baseGlow = glow; m.userData.flicker = true; glowMats.push(m); return m;
  };
  const table = {
    FR_gilt: aoMat(mats.gilt),
    FR_frame: aoMat(ghost ? mats.blackPaint : mats.ochrePaint),
    FR_stern: aoMat(mats.blackPaint, { side: THREE.DoubleSide }),
    FR_wood: aoMat(mats.darkWood),
    FR_iron: aoMat(mats.iron),
    FR_rope: new THREE.MeshStandardMaterial({ color: ghost ? '#3b3f35' : '#8c7550', roughness: 0.9, vertexColors: true }),
    FR_glass: glass(ghost ? '#5dffb0' : '#ffb35c', ghost ? 0.8 : 1.1),
    FR_lampglass: glass(ghost ? '#4dffa6' : '#ffc070', ghost ? 0.9 : 1.6),
  };
  const out = new THREE.Group();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.name.replace(/[._]\d+$/, '');
    const g = o.geometry;
    liftAO(g);
    const inst = (m, list) => { const im = new THREE.InstancedMesh(g, m, list.length); list.forEach((x, i) => im.setMatrixAt(i, x)); im.computeBoundingSphere(); out.add(im); };
    if (name === 'FR_carriage') inst(aoMat(ghost ? mats.darkWood : mats.redLid), carriageXf);
    else if (name === 'FR_gun') {
      const inst = new THREE.InstancedMesh(g, aoMat(mats.iron), gunXf.length);
      gunXf.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.computeBoundingSphere();
      out.add(inst);
    } else if (table[name]) {
      out.add(new THREE.Mesh(g, table[name]));
    }
  });
  group.remove(carvedGroup);
  group.add(out);
}

/* ------------------------------------------------------------------ the ship */

export function buildFirstRate(o = {}) {
  const ghost = !!o.ghost;
  const hi = o.spots !== false;
  const L = 60, B = 15.8, D = 14.6, T = 6.6;
  const S = shared();
  const r = rng(ghost ? 77 : 61);
  const group = new THREE.Group();
  const batch = new Batch();
  // carved work drawn in code until the Blender-built GLB arrives (and if it never does)
  const carved = new Batch(), carvedGroup = new THREE.Group(), gunXf = [], carriageXf = [];
  group.add(carvedGroup);
  const glowMats = [];

  /* ---------- form */
  const half = B / 2;
  const keelY = (u) => 3.4 * Math.pow(Math.max(0, (u - 0.86) / 0.14), 2.2) + 0.8 * Math.pow(Math.max(0, (0.1 - u) / 0.1), 2);
  // sheer, stepped up for the quarterdeck, poop and forecastle so each has its own bulwark
  const topY = (u) => D + 0.6 * Math.pow(2 * u - 1, 2) + 1.9 * (1 - sstep(u, 0.36, 0.44)) + 1.5 * (1 - sstep(u, 0.17, 0.22)) + 1.4 * sstep(u, 0.7, 0.78);
  const xAt = (u, hn) => -L / 2 + u * L - 3.6 * sstep(hn, 0.42, 1) * Math.pow(1 - u, 7) + 2.4 * Math.pow(hn, 1.6) * Math.pow(u, 14);
  const plan = (u, hn) => {
    if (u >= 0.5) { const q = (u - 0.5) / 0.5; return Math.sqrt(Math.max(0, 1 - Math.pow(q, 3))); } // round, bluff bow
    const q = u / 0.5;
    const low = Math.pow(Math.sin((Math.PI / 2) * Math.min(1, q * 1.08)), 1.35);
    const high = lerp(0.64, 1, sstep(q, 0, 0.6));
    return lerp(low, high, sstep(hn, 0.3, 0.74));
  };
  const section = (hn) => Math.pow(1 - Math.pow(1 - hn, 2.3), 1 / 2.3) * (1 - 0.15 * sstep(hn, 0.55, 1));
  const P = (u, hn) => [xAt(u, hn), lerp(keelY(u), topY(u), hn) - T, half * plan(u, hn) * section(hn)];
  const hnAt = (u, y) => clamp((y + T - keelY(u)) / (topY(u) - keelY(u)), 0, 1);
  const zAt = (u, y) => P(u, hnAt(u, y))[2];
  const uOf = (x) => clamp((x + L / 2) / L, 0, 1);
  const Hmax = D + 4.1;

  const yMain = D - T - 1.6;                  // upper deck (waist)
  const yQ = yMain + 2.1;                     // quarterdeck
  const yP = yQ + 2.0;                        // poop
  const yF = yMain + 1.9;                     // forecastle
  const gunRows = [2.2, 4.6, yMain + 0.65];  // port centres of the lower, middle and upper gun decks

  /* ---------- hull surface */
  const NS = hi ? 170 : 110, NP = hi ? 30 : 20;
  const us = []; for (let i = 0; i <= NS; i++) { const t = i / NS; us.push(t * 0.4 + (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.6); }
  const ring = [];
  for (let j = NP - 1; j >= 0; j--) ring.push([j / (NP - 1), -1]);
  for (let j = 1; j < NP; j++) ring.push([j / (NP - 1), 1]);
  const R = ring.length;
  const pos = [], uv = [], idx = [];
  for (const u of us) for (const [hn, s] of ring) {
    const [x, y, z] = P(u, hn);
    pos.push(x, y, z * s); uv.push(x / 8, (y + T) / Hmax);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < R - 1; j++) { const a = i * R + j, b = (i + 1) * R + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // close the stern below the gallery and the stem
  for (const [i, flip] of [[0, true], [NS, false]]) {
    const base = pos.length / 3; let cx = 0, cy = 0;
    for (let j = 0; j < R; j++) { cx += pos[(i * R + j) * 3]; cy += pos[(i * R + j) * 3 + 1]; }
    pos.push(cx / R, cy / R, 0); uv.push(cx / R / 8, (cy / R + T) / Hmax);
    for (let j = 0; j < R - 1; j++) flip ? idx.push(base, i * R + j, i * R + j + 1) : idx.push(base, i * R + j + 1, i * R + j);
  }
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  hullGeo.setIndex(idx); hullGeo.computeVertexNormals();

  const ochre = ghost ? '#3b3f37' : '#a8834a', black = ghost ? '#262923' : '#151413';
  const bands = [
    { from: 0, to: Hmax, color: black, rough: '#8a8a8a' },
    ...gunRows.map((y) => ({ from: y + T - 0.72, to: y + T + 0.62, color: ochre, rough: '#7d7d7d' })),
    { from: 0, to: T + 0.15, color: ghost ? '#2a3a32' : '#9c5c36', rough: '#6a6a6a' },
  ];
  const ht = hullTextures({ Hmax, T, bands, ghost, seed: ghost ? 81 : 71, hi });
  let glowK = 1;
  const hullMat = new THREE.MeshStandardMaterial({
    map: ht.map, normalMap: ht.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughnessMap: ht.roughnessMap,
    roughness: 1, metalness: 0.05, envMapIntensity: 0.7, side: THREE.DoubleSide,
  });
  // the inside of the bulwarks is painted red, as it was
  hullMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (!gl_FrontFacing) diffuseColor.rgb = ${ghost ? 'vec3(0.10, 0.11, 0.10)' : 'vec3(0.42, 0.12, 0.08)'};`);
  };
  group.add(new THREE.Mesh(hullGeo, hullMat));

  const wood = new THREE.MeshStandardMaterial({ color: ghost ? '#2d2a23' : '#6e4b2a', roughness: 0.72 });
  const darkWood = new THREE.MeshStandardMaterial({ color: ghost ? '#1f1d18' : '#3d2816', roughness: 0.75 });
  const blackPaint = new THREE.MeshStandardMaterial({ color: black, roughness: 0.55 });
  const ochrePaint = new THREE.MeshStandardMaterial({ color: ochre, roughness: 0.55 });
  const gilt = new THREE.MeshStandardMaterial({ color: ghost ? '#4a5244' : '#d4a548', roughness: 0.28, metalness: ghost ? 0.2 : 0.95, envMapIntensity: 1.3 });
  const iron = new THREE.MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.45, metalness: 0.75 });
  const redLid = new THREE.MeshStandardMaterial({ color: ghost ? '#2b2a24' : '#8f2a1e', roughness: 0.6 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: ghost ? '#3b4039' : '#b3ab95', roughness: 0.95 });
  const portGlow = glowMat(glowMats, ghost ? '#5dffb0' : '#ffad55', ghost ? 1.0 : 0.85);
  portGlow.userData.flicker = true;

  /* ---------- decks */
  const deckT = deckTexture(32, ghost);
  const deckMat = new THREE.MeshStandardMaterial({ map: deckT, roughness: 0.78 });
  const deckStrip = (u0, u1, y, inset = 0.15) => {
    const p = [], ix = [], t = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = lerp(u0, u1, i / n), x = P(u, hnAt(u, y))[0], z = Math.max(0.2, zAt(u, y) - inset);
      p.push(x, y, -z, x, y, z); t.push(x / 4, -z / 4, x / 4, z / 4);
      if (i < n) { const k = i * 2; ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(t, 2));
    g.setIndex(ix); g.computeVertexNormals();
    group.add(new THREE.Mesh(g, deckMat));
  };
  deckStrip(0.03, 0.97, yMain);
  deckStrip(0.0, 0.36, yQ);
  deckStrip(0.0, 0.17, yP);
  deckStrip(0.78, 0.965, yF);
  // bulkheads at the break of the quarterdeck, poop and forecastle: planked, with doors and gilt rails
  const bulkhead = (u, y0, y1, faceAft) => {
    const x = lerp(-L / 2, L / 2, u), z = zAt(u, y1) - 0.1;
    batch.box(blackPaint, x, (y0 + y1) / 2, 0, 0.3, y1 - y0, z * 2);
    batch.box(ochrePaint, x + (faceAft ? -0.17 : 0.17), y0 + (y1 - y0) * 0.55, 0, 0.04, (y1 - y0) * 0.5, z * 2 - 0.4);
    for (const dz of [-z * 0.55, 0, z * 0.55]) batch.box(darkWood, x + (faceAft ? 0.17 : -0.17), y0 + 0.95, dz, 0.06, 1.8, 0.9);
    for (let zz = -z + 0.3; zz < z; zz += 0.5) batch.box(gilt, x, y1 + 0.45, zz, 0.08, 0.8, 0.08);
    batch.box(gilt, x, y1 + 0.88, 0, 0.18, 0.08, z * 2);
  };
  bulkhead(0.36, yMain, yQ, false);
  bulkhead(0.17, yQ, yP, false);
  bulkhead(0.78, yMain, yF, true);

  /* ---------- rail caps & wales (sculpted strips following the hull) */
  const sweep = (fn, u0, u1, n, make) => { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(lerp(u0, u1, i / n))); make(pts); };
  for (const s of [-1, 1]) {
    // rail cap along the whole sheer
    sweep((u) => { const [x, y, z] = P(u, 1); return V3(x, y + 0.08, s * (z - 0.06)); }, 0.0, 0.985, 80,
      (pts) => batch.add(blackPaint, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.17, 6, false)));
    // three main wales, each just below a gun deck, plus a gilt moulding at the top of the ochre
    for (const y of gunRows.map((g) => g - 0.95)) {
      const u0 = 0.03, u1 = 0.95;
      sweep((u) => V3(lerp(-L / 2, L / 2, u), y, s * (zAt(u, y) + 0.06)), u0, u1, 70,
        (pts) => batch.add(blackPaint, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.2, 5, false)));
    }
    for (const y of gunRows.map((g) => g + 0.64)) {
      sweep((u) => V3(lerp(-L / 2, L / 2, u), y, s * (zAt(u, y) + 0.02)), 0.04, 0.94, 60,
        (pts) => batch.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.05, 4, false)));
    }
  }

  /* ---------- gun ports, lids and guns */
  const portSpacing = 3.35;
  const rows = [{ y: gunRows[0], u0: 0.13, u1: 0.83 }, { y: gunRows[1], u0: 0.1, u1: 0.86 }, { y: gunRows[2], u0: 0.2, u1: 0.8 }];
  const ports = [];
  for (const [ri, row] of rows.entries()) {
    const x0 = lerp(-L / 2, L / 2, row.u0), x1 = lerp(-L / 2, L / 2, row.u1);
    for (let x = x0; x <= x1; x += portSpacing) ports.push({ x, y: row.y, row: ri });
  }
  for (const s of [-1, 1]) for (const p of ports) {
    const u = uOf(p.x), z = zAt(u, p.y);
    const tilt = Math.atan2(zAt(u, p.y + 0.6) - zAt(u, p.y - 0.6), 1.2); // tumblehome lean of the side
    if (ghost && r() < 0.25) continue;
    batch.add(portGlow, BOX, M(p.x, p.y, s * (z + 0.03), s * tilt, 0, 0, 0.88, 0.78, 0.05));
    for (const dx of [-0.48, 0.48]) batch.add(blackPaint, BOX, M(p.x + dx, p.y, s * (z + 0.06), s * tilt, 0, 0, 0.09, 0.9, 0.1));
    batch.add(blackPaint, BOX, M(p.x, p.y - 0.44, s * (z + 0.06), s * tilt, 0, 0, 1.06, 0.09, 0.14));
    // lid hinged at the top edge, swung up and out (red inside)
    const phi = 1.9, hx = p.x, hy = p.y + 0.43, hz = s * (z + 0.08);
    batch.add(redLid, BOX, M(hx, hy - 0.425 * Math.cos(phi), hz + s * 0.425 * Math.sin(phi), -s * phi, 0, 0, 0.96, 0.85, 0.07));
    // the gun, run out
    carved.add(iron, CYL8, M(p.x, p.y - 0.05, s * (z + 0.35), s * (Math.PI / 2 + 0.04), 0, 0, 0.16, 1.35, 0.16));
    carved.add(iron, CYL8, M(p.x, p.y - 0.05, s * (z + 1.0), s * Math.PI / 2, 0, 0, 0.2, 0.12, 0.2));
    // upper-deck guns in the waist show their carriages from above
    const pu = uOf(p.x);
    if (p.row === 2 && pu > 0.37 && pu < 0.77) carriageXf.push(new THREE.Matrix4().compose(V3(p.x, yMain, s * (z - 0.65)), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s > 0 ? 0 : Math.PI, 0)), V3(1, 1, 1)));
    gunXf.push(new THREE.Matrix4().compose(V3(p.x, p.y - 0.05, s * (z - 1.85)), new THREE.Quaternion().setFromEuler(new THREE.Euler(s * (Math.PI / 2 + 0.04), 0, 0)), V3(1, 1, 1)));
  }

  /* ---------- stern: counter, curved gallery with stern walks, taffrail, lanterns, rudder */
  const hG0 = 0.55;
  const gt = galleryTexture(ghost ? 47 : 37, ghost, 3);
  const galMat = new THREE.MeshStandardMaterial({ map: gt.map, emissiveMap: gt.emissiveMap, emissive: 0xffffff, emissiveIntensity: ghost ? 0.6 : 1.0, roughness: 0.4, metalness: 0.3, envMapIntensity: 0.9, side: THREE.DoubleSide });
  galMat.userData.baseGlow = galMat.emissiveIntensity; galMat.userData.flicker = true; glowMats.push(galMat);
  const GR = 14, GC = 18, gp = [], gu = [], gi = [];
  const sternAt = (hn, w) => { const [x, y, z] = P(0, hn); return [x - 0.95 * (1 - w * w) - 0.15, y, z * w]; };
  for (let j = 0; j <= GR; j++) for (let i = 0; i <= GC; i++) {
    const hn = lerp(hG0, 1, j / GR), w = lerp(-1, 1, i / GC);
    const [x, y, z] = sternAt(hn, w);
    gp.push(x, y, z); gu.push(i / GC, j / GR);
  }
  for (let j = 0; j < GR; j++) for (let i = 0; i < GC; i++) { const a = j * (GC + 1) + i, b = a + GC + 1; gi.push(a, a + 1, b, a + 1, b + 1, b); }
  const galGeo = new THREE.BufferGeometry();
  galGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); galGeo.setAttribute('uv', new THREE.Float32BufferAttribute(gu, 2));
  galGeo.setIndex(gi); galGeo.computeVertexNormals();
  carvedGroup.add(new THREE.Mesh(galGeo, galMat));
  // open stern walks at the bottom of the lower two tiers: floor, balustrade, gilt rail
  for (const tier of [0, 1]) {
    const hn = lerp(hG0, 1, tier / 3) + 0.004;
    const floor = [], rail = [];
    for (let i = 0; i <= 24; i++) {
      const w = lerp(-0.96, 0.96, i / 24);
      const [x, y, z] = sternAt(hn, w);
      floor.push(V3(x - 0.55, y, z * 1.02)); rail.push(V3(x - 1.05, y + 1.0, z * 1.04));
      if (i % 2 === 0) carved.add(gilt, CYL8, M(x - 1.05, y + 0.5, z * 1.04, 0, 0, 0, 0.05, 1.0, 0.05));
    }
    for (let i = 0; i < floor.length - 1; i++) {
      const a = floor[i], b = floor[i + 1], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      carved.box(darkWood, mx - 0.1, a.y - 0.06, mz, 1.3, 0.14, Math.hypot(b.x - a.x, b.z - a.z) + 0.05, 0, Math.atan2(b.x - a.x, b.z - a.z), 0);
    }
    carved.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail), 60, 0.07, 5, false));
    carved.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rail.map((p) => p.clone().setY(p.y - 1.0))), 60, 0.06, 5, false));
  }
  // carved taffrail and its lanterns
  const taff = []; for (let i = 0; i <= 20; i++) { const [x, y, z] = sternAt(1, lerp(-1, 1, i / 20)); taff.push(V3(x - 0.05, y + 0.45 + 0.35 * (1 - Math.pow(lerp(-1, 1, i / 20), 2)), z)); }
  carved.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(taff), 50, 0.32, 8, false));
  const LAMP = ghost ? [0.35, 1.5, 0.85] : [2.4, 1.5, 0.6];
  const lampGlass = glowMat(glowMats, ghost ? '#4dffa6' : '#ffbf66', ghost ? 0.9 : 1.6);
  lampGlass.userData.flicker = true;
  const LANTERN = new THREE.CylinderGeometry(1, 0.8, 1, 6);
  const lights = [];
  for (const w of [-0.75, 0, 0.75]) {
    const [x, y, z] = sternAt(1, w);
    const ly = y + 1.35 + (w === 0 ? 0.35 : 0), lx = x - 0.55;
    carved.rod(gilt, V3(x, y + 0.6, z), V3(lx, ly - 0.6, z), 0.07, CYL8);
    carved.add(gilt, LANTERN, M(lx, ly, z, 0, 0, 0, 0.5, 1.3, 0.5));
    carved.add(lampGlass, LANTERN, M(lx, ly, z, 0, 0, 0, 0.52, 0.95, 0.52));
    carved.add(gilt, new THREE.ConeGeometry(0.55, 0.7, 6), M(lx, ly + 1.0, z));
    carved.add(gilt, SPH, M(lx, ly + 1.45, z, 0, 0, 0, 0.12, 0.12, 0.12));
    lights.push({ p: V3(lx, ly, z), c: LAMP, size: 1.8, reflect: true });
  }
  // rudder on the sternpost
  {
    const [sx, sy] = P(0, 0.05);
    const rg = new THREE.BoxGeometry(2.4, 1, 0.55); rg.translate(-1.2, 0.5, 0);
    batch.add(blackPaint, rg, M(sx + 0.2, -T + 0.3, 0, 0, 0, 0.06, 1, yMain + T - 2, 1));
    for (let k = 0; k < 5; k++) batch.box(iron, sx - 0.1, -T + 1.5 + k * 2.6, 0, 0.6, 0.18, 0.7);
  }
  // quarter galleries: bulging lantern-like structures on each quarter, crowned with a cupola
  const qt = galleryTexture(ghost ? 48 : 38, ghost, 2);
  const qMat = new THREE.MeshStandardMaterial({ map: qt.map, emissiveMap: qt.emissiveMap, emissive: 0xffffff, emissiveIntensity: ghost ? 0.6 : 1.0, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide });
  qMat.userData.baseGlow = qMat.emissiveIntensity; qMat.userData.flicker = true; glowMats.push(qMat);
  for (const s of [-1, 1]) {
    const QS = 12, QT = 10, qp = [], qu = [], qi = [];
    for (let j = 0; j <= QT; j++) for (let i = 0; i <= QS; i++) {
      const u = lerp(0.02, 0.13, i / QS), y = lerp(gunRows[2] - 0.6, yP - 0.4, j / QT);
      const bulge = 1.15 * Math.pow(Math.sin(Math.PI * i / QS), 0.7) * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * j / QT)), 0.6);
      qp.push(lerp(-L / 2, L / 2, u), y, s * (zAt(u, y) + bulge)); qu.push(s > 0 ? i / QS : 1 - i / QS, j / QT);
    }
    for (let j = 0; j < QT; j++) for (let i = 0; i < QS; i++) { const a = j * (QS + 1) + i, b = a + QS + 1; s > 0 ? qi.push(a, b, a + 1, a + 1, b, b + 1) : qi.push(a, a + 1, b, a + 1, b + 1, b); }
    const qg = new THREE.BufferGeometry();
    qg.setAttribute('position', new THREE.Float32BufferAttribute(qp, 3)); qg.setAttribute('uv', new THREE.Float32BufferAttribute(qu, 2));
    qg.setIndex(qi); qg.computeVertexNormals();
    carvedGroup.add(new THREE.Mesh(qg, qMat));
    const cx = lerp(-L / 2, L / 2, 0.075), cz = s * (zAt(0.075, yP) + 0.6);
    carved.add(blackPaint, new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(cx, yP - 0.4, cz - s * 0.2, 0, 0, 0, 2.7, 0.9, 0.85));
    carved.add(gilt, SPH, M(cx, yP + 0.6, cz - s * 0.2, 0, 0, 0, 0.16, 0.26, 0.16));
    carved.add(gilt, new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(cx, gunRows[2] - 0.6, cz - s * 0.25, 0, 0, 0, 2.5, 1.1, 0.8));
  }

  /* ---------- head: cutwater, headrails, grating, lion figurehead, catheads & anchors */
  const yBow = topY(1) - T;
  const stemX = (hn) => P(0.999, hn)[0];
  {
    const sh = new THREE.Shape();
    sh.moveTo(stemX(0.12) - 0.2, P(1, 0.12)[1]);
    sh.bezierCurveTo(L / 2 + 2.5, -T + 3.6, L / 2 + 4.6, yBow - 3.6, L / 2 + 5.6, yBow - 1.6);
    sh.lineTo(L / 2 + 5.0, yBow - 0.9);
    sh.bezierCurveTo(L / 2 + 3.2, yBow - 2.6, L / 2 + 2.2, yBow - 4.0, stemX(0.7) - 0.2, yBow - 5.2);
    sh.closePath();
    const cw = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 2, curveSegments: 18 });
    cw.translate(0, 0, -0.35);
    batch.add(blackPaint, cw);
    // gilt trailboards along the cutwater
    for (const s of [-1, 1]) {
      const tb = []; for (let i = 0; i <= 12; i++) { const t = i / 12; tb.push(V3(lerp(stemX(0.62) + 0.6, L / 2 + 4.6, t), lerp(yBow - 5.2, yBow - 1.4, t) + Math.sin(t * Math.PI) * 0.4, s * 0.47)); }
      batch.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tb), 30, 0.16, 6, false));
      batch.add(ochrePaint, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tb.map((p) => p.clone().add(V3(-0.3, -0.5, 0)))), 30, 0.1, 5, false));
    }
    // curved headrails from the bows to the figurehead
    for (const s of [-1, 1]) for (const [k, dy] of [[0, 0], [1, -0.8]]) {
      const a = P(0.955 - k * 0.02, 0.97 - k * 0.07);
      const pts = [V3(a[0], a[1] + dy * 0.2, s * a[2]), V3(L / 2 + 1.6, yBow - 0.7 + dy, s * 1.6), V3(L / 2 + 3.6, yBow - 1.1 + dy, s * 0.8), V3(L / 2 + 5.0, yBow - 1.1 + dy * 0.6, s * 0.38)];
      batch.add(ochrePaint, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.13, 6, false));
      if (k === 0) batch.add(gilt, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => p.clone().add(V3(0, 0.14, 0)))), 40, 0.05, 4, false));
    }
    for (const t of [0.35, 0.6]) for (const s of [-1, 1]) batch.rod(blackPaint, V3(L / 2 + 1 + t * 3.4, yBow - 2.2, s * lerp(1.4, 0.6, t)), V3(L / 2 + 1 + t * 3.4, yBow - 0.8, s * lerp(1.5, 0.7, t)), 0.08, CYL8);
    const grat = new THREE.MeshStandardMaterial({ map: gratingTexture(), roughness: 0.8 });
    grat.map.repeat.set(3, 1.5);
    batch.add(grat, new THREE.BoxGeometry(4.2, 0.12, 2.4), M(L / 2 + 2.3, yBow - 1.9, 0, 0, 0, 0.12));
    // gilded lion figurehead, leaping forward
    const fx = L / 2 + 5.4, fy = yBow - 1.0;
    carved.add(gilt, new THREE.CapsuleGeometry(0.42, 1.2, 6, 12), M(fx - 0.6, fy - 0.2, 0, 0, 0, 0.95));
    carved.add(gilt, SPH, M(fx + 0.15, fy + 0.55, 0, 0, 0, 0, 0.44, 0.42, 0.4));
    carved.add(gilt, new THREE.TorusGeometry(0.4, 0.17, 8, 16), M(fx + 0.05, fy + 0.5, 0, 0, Math.PI / 2, 0.35, 1, 1, 1));
    carved.add(gilt, SPH, M(fx + 0.5, fy + 0.45, 0, 0, 0, 0, 0.2, 0.16, 0.18));                   // muzzle
    for (const s of [-1, 1]) carved.rod(gilt, V3(fx - 0.1, fy, s * 0.22), V3(fx + 0.55, fy - 0.45, s * 0.25), 0.11, CYL8); // forepaws
    carved.add(gilt, CYL8, M(fx + 0.05, fy + 1.0, 0, 0, 0, 0.3, 0.22, 0.22, 0.22));             // crown
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; carved.add(gilt, SPH, M(fx + 0.05 + Math.cos(a) * 0.2, fy + 1.15, Math.sin(a) * 0.2, 0, 0, 0, 0.06, 0.06, 0.06)); }
  }
  for (const s of [-1, 1]) {
    // cathead with the best bower anchor hanging below
    const u = 0.93, [x, y, z] = P(u, 0.98);
    batch.add(darkWood, BOX, M(x + 0.4, y - 0.2, s * (z + 0.9), 0, -s * 0.5, 0, 0.6, 0.55, 2.6));
    const ax = x - 1.0, ay = y - 3.6, az = s * (zAt(uOf(ax), ay) + 0.45);
    batch.add(iron, CYL8, M(ax, ay - 0.6, az, 0, 0, 0.08, 0.17, 5.6, 0.17));
    batch.add(darkWood, BOX, M(ax + 0.2, ay + 2.0, az, 0, 0, 0.08, 0.32, 0.38, 3.2));       // stock
    batch.add(iron, new THREE.TorusGeometry(1.4, 0.15, 6, 16, Math.PI), M(ax - 0.25, ay - 2.0, az, 0, 0, Math.PI + 0.08));
    for (const k of [-1, 1]) batch.add(iron, BOX, M(ax - 0.25 + k * 1.4, ay - 2.05, az, 0, 0, k * 0.6, 0.65, 0.9, 0.14)); // flukes
    batch.add(iron, new THREE.TorusGeometry(0.3, 0.06, 5, 10), M(ax + 0.25, ay + 2.5, az, 0, Math.PI / 2, 0)); // ring
  }

  /* ---------- channels, deadeyes, chainplates */
  const masts = [
    { x: 19, lower: 23, top: 16, tg: 10, scale: 0.92 },
    { x: -1, lower: 26, top: 18, tg: 11.5, scale: 1 },
    { x: -19, lower: 18, top: 12.5, tg: 7.5, scale: 0.72 },
  ];
  const chanY = gunRows[2] + 1.05;
  const deadeye = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 10);
  const chains = {};
  for (const mm of masts) {
    const u = uOf(mm.x);
    for (const s of [-1, 1]) {
      const z = zAt(u, chanY);
      batch.box(blackPaint, mm.x - 0.8, chanY, s * (z + 0.55), 7.5 * mm.scale, 0.2, 1.1);
      chains[`${mm.x}${s}`] = [];
      for (let k = 0; k < 7; k++) {
        const dx = mm.x - 0.8 - 3.2 * mm.scale + k * 1.05 * mm.scale, zz = s * (zAt(uOf(dx), chanY) + 1.0);
        batch.add(darkWood, deadeye, M(dx, chanY + 0.3, zz, Math.PI / 2, 0, 0));
        batch.rod(iron, V3(dx, chanY + 0.2, zz), V3(dx, chanY - 2.2, s * (zAt(uOf(dx), chanY - 2.2) + 0.12)), 0.035, CYL8);
        chains[`${mm.x}${s}`].push(V3(dx, chanY + 0.4, zz));
      }
    }
  }

  /* ---------- masts, tops, yards, sails, ratlines */
  const WIND = windState();
  const sailT = sailTexture({ seed: ghost ? 43 : 33, color: ghost ? '#4a4f47' : '#ebe4d0', seams: 16, ghost });
  const sMat = sailMaterial(sailT, ghost, WIND);
  const fMat = sailMaterial(sailT, ghost, WIND, true);
  if (ghost) for (const mm of [sMat, fMat]) { mm.userData.baseGlow = 0.05; glowMats.push(mm); }
  const ratTex = ratlineTexture();
  const ratMat = new THREE.MeshBasicMaterial({ map: ratTex, alphaTest: 0.4, side: THREE.DoubleSide, color: ghost ? '#4f5a52' : '#ffffff' });
  const rigMat = new THREE.LineBasicMaterial({ color: ghost ? 0x26332b : 0x241a10, transparent: true, opacity: 0.85 });
  const sails = [], braces = [];
  const rig = [];
  const line = (a, b) => rig.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const taper = (r0, r1, h) => new THREE.CylinderGeometry(r1, r0, h, 12);
  const ratlines = (top, base) => {
    // trapezoid of shrouds + ratlines from a masthead down to the channel deadeyes
    const [a, b] = [base[0], base[base.length - 1]];
    const g = new THREE.BufferGeometry();
    const len = top[0].distanceTo(a);
    g.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, top[1].x, top[1].y, top[1].z, top[0].x, top[0].y, top[0].z], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, len / 0.45, 0, len / 0.45], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    group.add(new THREE.Mesh(g, ratMat));
  };
  const yardGeo = (w, rr) => {
    const half1 = new THREE.CylinderGeometry(rr * 0.45, rr, w / 2, 10); half1.translate(0, w / 4, 0);
    const half2 = half1.clone(); half2.rotateZ(Math.PI);
    return [half1, half2];
  };
  const y0 = yMain;
  for (const [mi, mm] of masts.entries()) {
    const k = mm.scale;
    const lowTop = y0 + mm.lower, topTop = lowTop - 3.6 + mm.top, tgTop = topTop - 2.2 + mm.tg;
    batch.add(wood, taper(0.62 * k, 0.48 * k, mm.lower + T), M(mm.x, y0 + (mm.lower - T) / 2, 0));
    for (let h2 = 2; h2 < mm.lower - 2; h2 += 1.6) batch.add(iron, CYL8, M(mm.x, y0 + h2, 0, 0, 0, 0, 0.66 * k, 0.1, 0.66 * k)); // mast bands
    // the top: platform with rim and a rail at its after edge
    batch.box(darkWood, mm.x - 0.2, lowTop - 1.2, 0, 3.6 * k, 0.18, 5.4 * k);
    batch.rail(darkWood, [V3(mm.x - 1.9 * k, lowTop - 1.1, -2.7 * k), V3(mm.x - 1.9 * k, lowTop - 1.1, 2.7 * k)], 0.9, 0.9, 0.03);
    batch.box(darkWood, mm.x + 0.3, lowTop - 0.05, 0, 1.6 * k, 0.5, 0.9 * k);                    // cap
    batch.add(wood, taper(0.36 * k, 0.28 * k, mm.top), M(mm.x + 0.65 * k, lowTop - 3.6 + mm.top / 2, 0));
    batch.box(darkWood, mm.x + 0.65 * k, topTop - 1.6, 0, 1.0 * k, 0.14, 2.8 * k);                 // crosstrees
    batch.add(wood, taper(0.2 * k, 0.12 * k, mm.tg), M(mm.x + 0.95 * k, topTop - 2.2 + mm.tg / 2, 0));
    batch.add(gilt, SPH, M(mm.x + 0.95 * k, tgTop + 0.15, 0, 0, 0, 0, 0.22, 0.14, 0.22));         // truck

    // yards & sails swing together on the braces
    const brace = new THREE.Group(); brace.position.set(mm.x, 0, 0); group.add(brace); braces.push(brace);
    const yardRig = [];
    const yards = mi === 2
      ? [[lowTop - 2.6, 17 * k, 0.32], [topTop - 4.5, 12 * k, 0.22]]
      : [[lowTop - 2.6, 31 * k, 0.4], [lowTop + mm.top * 0.48, 23 * k, 0.3], [topTop + mm.tg * 0.45, 15 * k, 0.2]];
    yards.forEach(([yy, w, rr], j) => {
      for (const hgeo of yardGeo(w, rr)) { const ym = new THREE.Mesh(hgeo, wood); ym.position.set(0.6 + j * 0.25, yy, 0); ym.rotation.x = Math.PI / 2; brace.add(ym); }
      // footrope sagging under the yard
      for (let q = 0; q < 6; q++) {
        const fy = (t) => yy - 0.9 - Math.sin(t * Math.PI) * 0.35;
        yardRig.push(0.6 + j * 0.25, fy(q / 6), lerp(-w / 2, w / 2, q / 6), 0.6 + j * 0.25, fy((q + 1) / 6), lerp(-w / 2, w / 2, (q + 1) / 6));
      }
      // the sail hangs to the next yard down (courses to just above the bulwarks)
      const below = j === 0 ? (mi === 2 ? null : y0 + 7.5) : yards[j - 1][0] + 0.6;
      if (below === null) return;
      const h = yy - 0.25 - below, head = w * 0.92, footW = j === 0 ? 1.02 : (yards[j - 1][1] * 0.9) / head;
      const sail = squareSail(sMat, 0.95 + j * 0.25, yy - 0.25, head, h, w * 0.085, footW, hi ? [22, 14] : [12, 8]);
      brace.add(sail);
      sails.push({ mesh: sail, reefAt: j === 2 ? 0.25 : j === 0 ? 0.55 : 0.85, reefTo: j === 1 ? 0.45 : 0.08 });
      // braces lead aft from the yardarms; clewlines from the sail's lower corners
      for (const s of [-1, 1]) {
        line(V3(mm.x + 0.6, yy, s * w / 2), V3(mm.x - 14 * k, y0 + 2.5, s * (half - 0.4)));
        line(V3(mm.x + 0.95, below + 0.2, s * w * 0.45), V3(mm.x - 2, y0 + 1.2, s * (half - 1)));
      }
    });
    // shrouds with ratlines: lower (mast top to the channels) and topmast (to the top's rim)
    for (const s of [-1, 1]) {
      const base = chains[`${mm.x}${s}`];
      ratlines([V3(mm.x - 0.5, lowTop - 1.2, s * 0.55), V3(mm.x + 0.4, lowTop - 1.2, s * 0.55)], base);
      ratlines([V3(mm.x + 0.4 * k, topTop - 1.6, s * 0.35), V3(mm.x + 0.9 * k, topTop - 1.6, s * 0.35)],
        [V3(mm.x - 1.4 * k, lowTop - 1.1, s * 2.6 * k), V3(mm.x + 1.2 * k, lowTop - 1.1, s * 2.6 * k)]);
      // backstays from the topmast head to the channels
      const ch = base[base.length - 1];
      line(V3(mm.x + 0.65 * k, topTop - 1.4, s * 0.3), V3(ch.x - 2.6, ch.y, ch.z));
      line(V3(mm.x + 0.95 * k, tgTop - 0.5, s * 0.2), V3(ch.x - 3.2, ch.y, ch.z));
    }
    const yg = new THREE.BufferGeometry(); yg.setAttribute('position', new THREE.Float32BufferAttribute(yardRig, 3));
    brace.add(new THREE.LineSegments(yg, rigMat));
    mm.lowTop = lowTop; mm.topTop = topTop; mm.tgTop = tgTop;
  }
  // stays (heavy ones as rods, light ones as lines)
  const [fore, main, miz] = masts;
  const bsBase = V3(L / 2 - 5, yF + 0.8, 0), bsTip = V3(L / 2 + 17, yF + 10.5, 0), jbTip = V3(L / 2 + 28, yF + 14.2, 0);
  batch.add(wood, taper(0.55, 0.38, bsBase.distanceTo(bsTip)), (() => { const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), bsTip.clone().sub(bsBase).normalize()); return new THREE.Matrix4().compose(bsBase.clone().lerp(bsTip, 0.5), q, V3(1, 1, 1)); })());
  batch.rod(wood, bsBase.clone().lerp(bsTip, 0.62), jbTip, 0.2, CYL8);
  batch.rod(darkWood, bsTip.clone().add(V3(-0.4, 0, -6)), bsTip.clone().add(V3(-0.4, 0, 6)), 0.15, CYL8);     // spritsail yard
  batch.add(canvasMat, CYL8, M(bsTip.x - 0.4, bsTip.y - 0.35, 0, Math.PI / 2, 0, 0, 0.32, 10, 0.32));         // furled spritsail
  batch.rod(iron, bsTip.clone().add(V3(-1.2, -0.4, 0)), bsTip.clone().add(V3(-0.6, -3.2, 0)), 0.06, CYL8);      // dolphin striker
  batch.rod(darkWood, V3(fore.x + 0.3, fore.lowTop - 1.0, 0), bsBase.clone().lerp(bsTip, 0.55), 0.13, CYL8);    // forestay
  batch.rod(darkWood, V3(main.x + 0.3, main.lowTop - 1.0, 0), V3(fore.x - 0.6, y0 + 1.5, 0), 0.13, CYL8);      // mainstay
  batch.rod(darkWood, V3(miz.x + 0.3, miz.lowTop - 1.0, 0), V3(main.x - 0.6, y0 + 1.5, 0), 0.1, CYL8);
  line(V3(fore.x + 0.65, fore.topTop - 1.3, 0), bsTip); line(V3(fore.x + 0.95, fore.tgTop - 0.4, 0), jbTip);
  line(V3(main.x + 0.65, main.topTop - 1.3, 0), V3(fore.x + 0.3, fore.lowTop - 1.0, 0));
  line(V3(main.x + 0.95, main.tgTop - 0.4, 0), V3(fore.x + 0.65, fore.topTop - 1.5, 0));
  line(V3(miz.x + 0.65, miz.topTop - 1.3, 0), V3(main.x + 0.3, main.lowTop - 1.0, 0));
  line(bsTip.clone().add(V3(-0.6, -0.3, 0)), V3(L / 2 + 3.5, -T + 3.4, 0)); line(jbTip, bsTip.clone().add(V3(-0.6, -3.2, 0)));
  // jibs and staysails on the stays, spanker on the mizzen gaff
  const stayPt = (a, b, t) => a.clone().lerp(b, t);
  const foreHead = V3(fore.x + 0.95, fore.tgTop - 0.4, 0), foreTop = V3(fore.x + 0.65, fore.topTop - 1.3, 0);
  for (const [a, b, c2, belly] of [
    [stayPt(foreHead, jbTip, 0.25), stayPt(foreHead, jbTip, 0.97), V3(L / 2 + 8, yF + 7.2, 0), 1.6],
    [stayPt(foreTop, bsTip, 0.3), stayPt(foreTop, bsTip, 0.96), V3(L / 2 + 1, yF + 4.0, 0), 1.4],
  ]) { const j = foreAftSail(fMat, [a, b, c2], belly); group.add(j); sails.push({ mesh: j, reefAt: 2, reefTo: 1 }); }
  const gaff0 = V3(miz.x - 0.3, miz.lowTop - 3, 0), gaff1 = V3(miz.x - 13, miz.lowTop - 0.5, 0);
  const boom0 = V3(miz.x - 0.3, yQ + 2.6, 0), boom1 = V3(-L / 2 - 6.5, yQ + 3.4, 0);
  batch.rod(wood, gaff0, gaff1, 0.17, CYL8); batch.rod(wood, boom0, boom1, 0.2, CYL8);
  const spk = foreAftSail(fMat, [gaff0, gaff1, boom1.clone().add(V3(0.6, 0.2, 0)), boom0.clone().add(V3(0, 0.2, 0))], 1.8);
  group.add(spk); sails.push({ mesh: spk, reefAt: 2, reefTo: 1 });
  const rl = new THREE.BufferGeometry(); rl.setAttribute('position', new THREE.Float32BufferAttribute(rig, 3));
  group.add(new THREE.LineSegments(rl, rigMat));

  /* ---------- deck fittings */
  // capstan
  batch.add(darkWood, new THREE.CylinderGeometry(0.75, 0.95, 1.2, 14), M(-8, yMain + 0.6, 0));
  batch.add(wood, CYL, M(-8, yMain + 1.25, 0, 0, 0, 0, 1.1, 0.15, 1.1));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI, c = Math.cos(a) * 2.1, sn = Math.sin(a) * 2.1; batch.rod(wood, V3(-8 - c, yMain + 1.15, -sn), V3(-8 + c, yMain + 1.15, sn), 0.06, CYL8); }
  // double wheel and binnacle at the front of the quarterdeck
  const wx = lerp(-L / 2, L / 2, 0.31);
  const WHEEL = new THREE.TorusGeometry(0.95, 0.06, 6, 24);
  for (const dx of [-0.38, 0.38]) {
    const cx = wx + dx, cy = yQ + 1.25;
    batch.add(darkWood, WHEEL, M(cx, cy, 0, 0, Math.PI / 2, 0));
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; batch.rod(darkWood, V3(cx, cy, 0), V3(cx, cy + Math.sin(a) * 1.18, Math.cos(a) * 1.18), 0.03, CYL8); }
    batch.add(darkWood, CYL8, M(cx, cy, 0, 0, 0, Math.PI / 2, 0.14, 0.18, 0.14));
  }
  batch.rod(iron, V3(wx - 0.5, yQ + 1.25, 0), V3(wx + 0.5, yQ + 1.25, 0), 0.05, CYL8);
  for (const dx of [-0.6, 0.6]) batch.box(darkWood, wx + dx, yQ + 0.65, 0, 0.18, 1.3, 0.3);
  batch.box(wood, wx + 1.4, yQ + 0.55, 0, 0.8, 1.1, 0.8);
  batch.add(gilt, new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(wx + 1.4, yQ + 1.1, 0));
  // hatch gratings in the waist, skylight on the quarterdeck
  const grat = new THREE.MeshStandardMaterial({ map: gratingTexture(), roughness: 0.8 });
  for (const hx of [-14, 4, 12]) batch.add(grat, BOX, M(hx, yMain + 0.2, 0, 0, 0, 0, 3.4, 0.4, 3.2));
  batch.box(gilt, lerp(-L / 2, L / 2, 0.2), yQ + 0.5, 0, 2.4, 0.9, 2.0);
  batch.add(new THREE.MeshStandardMaterial({ color: '#203038', roughness: 0.1, metalness: 0.6 }), BOX, M(lerp(-L / 2, L / 2, 0.2), yQ + 1.0, 0, 0, 0, 0, 2.2, 0.1, 1.8));
  // boats nested on the booms in the waist
  const boatShape = (len, w, dep) => { const g = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(len / 2, dep, w / 2); return g; };
  batch.add(new THREE.MeshStandardMaterial({ color: ghost ? '#2b2e28' : '#3b2f24', roughness: 0.6 }), boatShape(9, 2.5, 0.9), M(8, yMain + 2.45, 0));
  batch.add(new THREE.MeshStandardMaterial({ color: ghost ? '#30332d' : '#e3dccb', roughness: 0.6 }), boatShape(7, 2.0, 0.7), M(8, yMain + 3.05, 0));
  for (const bx of [4, 12]) batch.box(darkWood, bx, yMain + 1.6, 0, 0.35, 0.35, 9);
  for (const s of [-1, 1]) for (const bx of [4, 12]) batch.box(darkWood, bx, yMain + 0.8, s * 3.5, 0.3, 1.6, 0.3);
  // hammock nettings along the rails (rolled canvas, roped every few feet)
  for (const s of [-1, 1]) {
    const pts = []; for (let i = 0; i <= 30; i++) { const u = lerp(0.36, 0.78, i / 30); const [x, y, z] = P(u, 1); pts.push(V3(x, y + 0.5, s * (z - 0.35))); }
    batch.add(canvasMat, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.32, 6, false));
    for (let i = 0; i <= 30; i += 2) batch.rod(darkWood, pts[i].clone().add(V3(0, -0.6, 0)), pts[i].clone().add(V3(0, 0.45, 0)), 0.04, CYL8);
  }
  // belfry on the forecastle
  const bfx = lerp(-L / 2, L / 2, 0.8);
  for (const dz of [-0.6, 0.6]) batch.box(gilt, bfx, yF + 0.8, dz, 0.12, 1.6, 0.12);
  batch.add(gilt, new THREE.TorusGeometry(0.62, 0.07, 6, 14, Math.PI), M(bfx, yF + 1.6, 0, 0, Math.PI / 2, 0));
  batch.add(gilt, new THREE.CylinderGeometry(0.16, 0.3, 0.42, 12, 1, true), M(bfx, yF + 1.3, 0));
  // carronades on the forecastle and poop
  for (const s of [-1, 1]) for (const [cx, cy] of [[lerp(-L / 2, L / 2, 0.86), yF], [lerp(-L / 2, L / 2, 0.08), yP]]) {
    batch.box(darkWood, cx, cy + 0.35, s * (zAt(uOf(cx), cy) - 1.2), 1.2, 0.5, 0.9);
    batch.add(iron, CYL8, M(cx, cy + 0.75, s * (zAt(uOf(cx), cy) - 0.8), s * Math.PI / 2, 0, 0, 0.22, 1.4, 0.22));
  }

  /* ---------- colours, lights */
  const ens = flagMesh(ghost ? '#1d2620' : '#b42a20', 5, 2.8, SAIL.uTime);
  const ensX = -L / 2 - 3.8;
  ens.position.set(ensX, yP + 5.5, 0); group.add(ens);
  batch.rod(darkWood, V3(ensX + 0.6, yP + 0.5, 0), V3(ensX, yP + 7.2, 0), 0.07, CYL8);
  if (!ghost) {
    const jack = flagMesh('#b42a20', 2.4, 1.4, SAIL.uTime); jack.position.set(jbTip.x - 2, jbTip.y + 0.8, 0); group.add(jack);
  }
  const pen = flagMesh(ghost ? '#26302a' : '#b42a20', 9, 0.45, SAIL.uTime);
  pen.position.set(main.x + 0.95, main.tgTop + 0.3, 0); group.add(pen);
  lights.push({ p: V3(main.x - 0.2, main.lowTop - 0.6, 0), c: LAMP, size: 1.6 });
  for (const x of [-10, 6, 16]) for (const s of [-1, 1]) lights.push({ p: V3(x, yMain + 2.0, s * (zAt(uOf(x), yMain) - 0.9)), c: LAMP, size: 1.4, night: true, reflect: x === 6 });

  /* ---------- crew */
  // the ghost's crew: a few pale figures that never quite move like the living
  const ghostCrew = [
    { x: lerp(-L / 2, L / 2, 0.31) - 0.9, y: yQ, z: 0, face: Math.PI / 2, role: 'ghost', action: 'wheel', speed: 0.35 },
    { x: lerp(-L / 2, L / 2, 0.88), y: yF, z: 0.8, face: Math.PI / 2, role: 'ghost', action: 'lookout', speed: 0.3, seed: 1 },
    { x: lerp(-L / 2, L / 2, 0.08), y: yP, z: 3.4, face: -Math.PI / 2, role: 'ghost', action: 'idle', rail: true, speed: 0.25, seed: 2 },
    { x: -4, y: yMain, z: 4.4, face: -Math.PI / 2, role: 'ghost', action: 'haul', speed: 0.4, seed: 3 },
    { x: 6, y: yMain, z: -1.5, face: 0, role: 'ghost', action: 'walk', walk: 4, walkDir: 0, speed: 0.4, seed: 4 },
  ];
  const crewFigures = ghost ? ghostCrew.slice(0, hi ? 5 : 3) : [
    { x: wx - 0.9, y: yQ, z: -0.6, face: Math.PI / 2, role: 'sailor', action: 'wheel' },
    { x: wx - 0.9, y: yQ, z: 0.6, face: Math.PI / 2, role: 'sailor', action: 'wheel', phase: 2 },
    { x: wx - 4, y: yQ, z: 2.6, face: Math.PI / 2 + 0.4, role: 'officer', action: 'lookout' },
    { x: wx - 6, y: yQ, z: -2.2, face: 1.2, role: 'officer', action: 'idle', rail: true },
    { x: wx - 2.5, y: yQ, z: -4.5, face: 0, role: 'officer', action: 'walk', walk: 3, walkDir: 0 },
    { x: lerp(-L / 2, L / 2, 0.08), y: yP, z: 3.6, face: -Math.PI / 2, role: 'marine', action: 'idle', rail: true },
    { x: lerp(-L / 2, L / 2, 0.11), y: yP, z: -3.4, face: -Math.PI / 2, role: 'marine', action: 'idle' },
    { x: -3, y: yMain, z: 4.6, face: -Math.PI / 2, role: 'sailor', action: 'haul' },
    { x: -1.8, y: yMain, z: 4.6, face: -Math.PI / 2, role: 'sailor', action: 'haul', phase: 0.4 },
    { x: -0.6, y: yMain, z: 4.6, face: -Math.PI / 2, role: 'sailor', action: 'haul', phase: 0.8 },
    { x: 1, y: yMain, z: -4.4, face: Math.PI / 2, role: 'sailor', action: 'haul', phase: 1.3 },
    { x: 2.2, y: yMain, z: -4.4, face: Math.PI / 2, role: 'sailor', action: 'haul', phase: 1.7 },
    { x: -12, y: yMain, z: -1.5, face: 0, role: 'sailor', action: 'walk', walk: 5, walkDir: 0, seed: 1 },
    { x: 14, y: yMain, z: 1.8, face: 0, role: 'sailor', action: 'walk', walk: 4, walkDir: 0, seed: 2 },
    { x: lerp(-L / 2, L / 2, 0.88), y: yF, z: 0.8, face: Math.PI / 2, role: 'sailor', action: 'lookout', seed: 3 },
    { x: fore.x - 0.4, y: fore.lowTop - 1.1, z: 1.4, face: Math.PI / 2, role: 'sailor', action: 'lookout', seed: 4 },
  ].slice(0, hi ? 16 : 8);
  const crewUpdate = buildCrew(group, crewFigures);

  carved.build(carvedGroup);
  const ship = finish({
    group, batch, lights, glowMats, S, L, B, D, T,
    H: { deckY: () => yMain, halfB: (x) => zAt(uOf(x), yMain + 1), halfBAt: (x, y) => zAt(uOf(x), y) },
    eye: V3(wx - 3.2, yQ + 1.72, 0), bowLocal: V3(L / 2 + 2, 0, 0), sails, braces, WIND,
    crew: crewUpdate,
    // the ghost hull breathes a faint green light
    extra: ghost ? (dt, t) => { hullMat.emissiveIntensity = (0.1 + 0.06 * Math.sin(t * 1.3)) * glowK; } : null,
  });
  ship.kind = ghost ? 'ghost' : 'sail';
  ship.camL = 160;
  if (ghost) {
    hullMat.emissive.set('#2aff9a'); hullMat.emissiveMap = ht.map;
    const setLights = ship.setLights;
    ship.setLights = (windows, nav) => { glowK = clamp(windows - 0.3, 0, 1.6); setLights(windows, nav); };
    loadCarved('ghost_extras.glb').then((gltf) => {
      const kelp = new THREE.MeshStandardMaterial({ color: '#2c3a22', roughness: 0.7, side: THREE.DoubleSide, vertexColors: true });
      kelp.onBeforeCompile = (sh) => {
        sh.uniforms.uKelpT = SAIL.uTime;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uKelpT;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            float kd = clamp(1.0 - color.r, 0.0, 1.0) + 0.3;
            transformed.x += sin(uKelpT * 1.4 + position.x * 0.7 + position.y * 1.3) * 0.12 * kd;`);
      };
      const barn = new THREE.MeshStandardMaterial({ color: '#8e8c7c', roughness: 0.95, vertexColors: true });
      gltf.scene.traverse((m) => {
        if (!m.isMesh) return;
        liftAO(m.geometry, 0.25);
        const name = m.name.replace(/[._]\d+$/, '');
        group.add(new THREE.Mesh(m.geometry, name === 'GH_kelp' ? kelp : barn));
      });
    }).catch(() => {});
  }
  loadCarved('firstrate_carved.glb').then((gltf) => fitCarved(gltf, { group, carvedGroup, gunXf, carriageXf, glowMats, ghost, mats: { gilt, blackPaint, ochrePaint, darkWood, iron, redLid } })).catch(() => {});
  return ship;
}
