import * as THREE from 'three';
import { Batch, M, V3, BOX, CYL, CYL8, ROD, SPH, shared } from './ship.js';
import { rng } from './textures.js';

/*
  Wooden ships, all procedural:
   - buildTrireme(): Greek trireme — slender oak hull, bronze ram, painted eyes,
     curled stern post, square linen sail, three banks of oars rowing in time.
   - buildSailShip(): a first-rate ship of the line — tumblehome hull in black and
     ochre bands, three gun decks, stern gallery, three masts with billowing sails
     that reef as the weather builds. With { ghost: true } it becomes an original
     cursed ghost ship: rotten hull, torn sails, green lanterns, mist.
  Same interface as buildShip()/buildCruiseShip().
*/

const lerp = THREE.MathUtils.lerp;
const sstep = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;

// sail state shared by every sail in the scene; main.js drives it each frame
export const SAIL = { uTime: { value: 0 }, uWind: { value: 1 }, reef: 0 };

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/* ------------------------------------------------------------------ textures */

// Hull planking mapped over the whole hull: u = along length, v = height above keel.
function hullTexture({ L, Hmax, T, bands, seed, ghost, eye, oarports }) {
  const r = rng(seed);
  const W = 2048, H = 512, pxm = W / L, pym = H / Hmax;
  const [c, x] = canvas(W, H);
  const [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const Y = (ym) => H - ym * pym;
  for (const b of bands) { x.fillStyle = b.color; x.fillRect(0, Y(b.to), W, (b.to - b.from) * pym + 1); }
  // planks: long horizontal strakes with staggered butt joints and grain
  for (let ym = 0; ym < Hmax; ym += 0.28) {
    x.fillStyle = 'rgba(0,0,0,0.28)'; x.fillRect(0, Y(ym), W, 1);
    x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, Y(ym) + 1, W, 1);
    for (let xm = r() * 6; xm < L; xm += 5 + r() * 4) { x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(xm * pxm, Y(ym + 0.28), 1, 0.28 * pym); }
  }
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${r() * 0.12})` : `rgba(255,230,190,${r() * 0.06})`;
    x.fillRect(r() * W, r() * H, 8 + r() * 60, 1 + r() * 1.5);
  }
  // waterline weed and salt
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${40 + r() * 30},${60 + r() * 30},${30},${r() * 0.3})`; x.fillRect(r() * W, Y(T + 0.4) + r() * 0.8 * pym, 10 + r() * 60, 2 + r() * 6); }
  if (ghost) {
    // rot, holes through the planking, barnacle crusts and hanging weed
    for (let i = 0; i < 90; i++) {
      const hx = r() * W, hy = Y(T + 0.5 + r() * (Hmax - T - 1.5));
      x.fillStyle = 'rgba(4,6,5,0.95)'; x.fillRect(hx, hy, (0.4 + r() * 1.6) * pxm, (0.2 + r() * 0.4) * pym);
      e.fillStyle = 'rgba(90,255,170,0.35)'; e.fillRect(hx + 2, hy + 2, (0.3 + r() * 1.2) * pxm, (0.12 + r() * 0.2) * pym);
    }
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${150 + r() * 60},${150 + r() * 50},${130},${r() * 0.35})`; x.beginPath(); x.arc(r() * W, Y(r() * (T + 1.5)), 1 + r() * 3, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 160; i++) {
      const hx = r() * W, hy = Y(Hmax - 0.3 - r() * 3), len = (0.5 + r() * 3) * pym;
      const g = x.createLinearGradient(0, hy, 0, hy + len);
      g.addColorStop(0, 'rgba(40,70,40,0.8)'); g.addColorStop(1, 'rgba(40,70,40,0)');
      x.fillStyle = g; x.fillRect(hx, hy, 2 + r() * 4, len);
    }
  }
  if (oarports) {
    // rows of oar-ports with leather sleeves, staggered between banks
    for (const [k, ym] of oarports.entries()) {
      for (let xm = L * 0.17 + k * 0.6; xm < L * 0.8; xm += 1.15) {
        x.fillStyle = '#0b0806'; x.beginPath(); x.ellipse(xm * pxm, Y(ym), 0.13 * pxm, 0.11 * pym, 0, 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(70,40,20,0.8)'; x.lineWidth = 2; x.stroke();
      }
    }
  }
  if (eye) {
    // Greek apotropaic eye at the bow, both sides share the texture column
    const ex = eye.x * pxm, ey = Y(eye.y), rx = 0.55 * pxm, ry = 0.38 * pym;
    x.fillStyle = '#efe7d6'; x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#20314d'; x.beginPath(); x.ellipse(ex, ey, ry * 0.85, ry * 0.85, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#0a0a0a'; x.beginPath(); x.ellipse(ex, ey, ry * 0.4, ry * 0.4, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#7a1d17'; x.lineWidth = 4; x.beginPath(); x.ellipse(ex, ey, rx * 1.15, ry * 1.25, 0, 0, Math.PI * 2); x.stroke();
  }
  const map = tex(c); map.wrapS = THREE.ClampToEdgeWrapping;
  return { map, emissiveMap: tex(ec) };
}

function deckTexture(seed, ghost) {
  const r = rng(seed);
  const [c, x] = canvas(256, 256);
  x.fillStyle = ghost ? '#3a3a32' : '#a0784c'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, i * 16, 256, 1); x.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,230,190'},${r() * 0.08})`; x.fillRect(0, i * 16 + 1, 256, 15); }
  for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.1})`; x.fillRect(r() * 256, r() * 256, 10 + r() * 40, 1); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function sailTexture({ seed, color = '#e8e0cb', seams = 12, grid = 0, ghost = false }) {
  const r = rng(seed);
  const [c, x] = canvas(256, 256);
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 1; i < seams; i++) { x.fillStyle = 'rgba(80,60,40,0.18)'; x.fillRect((i / seams) * 256, 0, 1.5, 256); }
  for (let i = 1; i < grid; i++) { x.fillStyle = 'rgba(60,40,25,0.4)'; x.fillRect(0, (i / grid) * 256, 256, 2); x.fillRect((i / grid) * 256, 0, 2, 256); }
  for (const y of [22, 40, 58]) { x.fillStyle = 'rgba(80,60,40,0.22)'; x.fillRect(0, y, 256, 1.5); for (let k = 6; k < 256; k += 10) x.fillRect(k, y - 2, 1, 5); }
  const g = x.createLinearGradient(0, 160, 0, 256); g.addColorStop(0, 'rgba(90,70,40,0)'); g.addColorStop(1, 'rgba(90,70,40,0.25)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(90,70,40,${r() * 0.08})`; x.beginPath(); x.arc(r() * 256, r() * 256, 4 + r() * 20, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = 'rgba(70,50,30,0.6)'; x.lineWidth = 3; x.strokeRect(1, 1, 254, 254);
  let alpha = null;
  if (ghost) {
    // rags: ragged foot, holes and slashes; cut out with alphaTest
    const [ac, a] = canvas(256, 256);
    a.fillStyle = '#fff'; a.fillRect(0, 0, 256, 256);
    a.fillStyle = '#000';
    a.beginPath(); a.moveTo(0, 256);
    for (let xx = 0; xx <= 256; xx += 8) a.lineTo(xx, 256 - 20 - r() * 70);
    a.lineTo(256, 256); a.closePath(); a.fill();
    for (let i = 0; i < 16; i++) {
      // ragged tear: a jittered polygon, longer than it is wide
      const cx = r() * 256, cy = 40 + r() * 170, rr = 5 + r() * 24, rot = r() * 3, k = 9 + Math.floor(r() * 6);
      a.beginPath();
      for (let j = 0; j <= k; j++) {
        const t = (j / k) * Math.PI * 2, q = rr * (0.45 + r() * 0.9);
        const px = Math.cos(t) * q * 1.6, py = Math.sin(t) * q * 0.7;
        a.lineTo(cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot));
      }
      a.closePath(); a.fill();
    }
    for (let i = 0; i < 6; i++) { a.save(); a.translate(r() * 256, 60 + r() * 150); a.rotate(1.2 + r() * 0.6); a.fillRect(-2, 0, 4, 40 + r() * 60); a.restore(); }
    alpha = tex(ac, false);
  }
  return { map: tex(c), alphaMap: alpha };
}

// Carved stern gallery: tiers of many-paned windows between gilded pilasters and carved bands.
function galleryTexture(seed, ghost, tiers = 3) {
  const r = rng(seed);
  const W = 512, H = 256;
  const [c, x] = canvas(W, H);
  const [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  const base = ghost ? '#2b2f2a' : '#16120e', gilt = ghost ? '#4c5446' : '#c9a04a', giltDk = ghost ? '#2f352c' : '#7d5a22';
  x.fillStyle = base; x.fillRect(0, 0, W, H);
  const th = H / tiers, cols = 9, cw = W / cols;
  for (let t = 0; t < tiers; t++) {
    const y0 = t * th;
    // carved band (scrollwork) across the top of each tier
    x.fillStyle = giltDk; x.fillRect(0, y0, W, th * 0.18);
    x.strokeStyle = gilt; x.lineWidth = 2;
    for (let k = 0; k < W; k += 22) { x.beginPath(); x.arc(k + 11, y0 + th * 0.09, 7, Math.PI * 0.1, Math.PI * 1.6); x.stroke(); }
    x.fillStyle = gilt; x.fillRect(0, y0 + th * 0.18, W, 2); x.fillRect(0, y0 + th - 3, W, 3);
    for (let k = 0; k < cols; k++) {
      const wx = k * cw + cw * 0.16, wy = y0 + th * 0.26, ww = cw * 0.68, wh = th * 0.64;
      // window: lead-light panes in a gilt frame
      const lit = ghost ? r() < 0.25 : r() < 0.72, broken = ghost && r() < 0.35;
      x.fillStyle = gilt; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      x.fillStyle = broken ? '#050605' : lit ? (ghost ? '#29453a' : '#6b4a26') : '#0e1418'; x.fillRect(wx, wy, ww, wh);
      x.fillStyle = 'rgba(0,0,0,0.55)';
      for (let i = 1; i < 4; i++) x.fillRect(wx + (ww * i) / 4, wy, 1.5, wh);
      for (let j = 1; j < 5; j++) x.fillRect(wx, wy + (wh * j) / 5, ww, 1.5);
      if (lit && !broken) {
        const g = e.createRadialGradient(wx + ww / 2, wy + wh * 0.65, 2, wx + ww / 2, wy + wh / 2, ww);
        const k2 = 0.5 + r() * 0.5;
        g.addColorStop(0, ghost ? `rgba(110,255,190,${0.55 * k2})` : `rgba(255,190,110,${k2})`); g.addColorStop(1, ghost ? 'rgba(40,120,90,0.15)' : 'rgba(180,90,30,0.35)');
        e.fillStyle = g; e.fillRect(wx, wy, ww, wh);
        e.fillStyle = 'rgba(0,0,0,0.6)';
        for (let i = 1; i < 4; i++) e.fillRect(wx + (ww * i) / 4, wy, 1.5, wh);
        for (let j = 1; j < 5; j++) e.fillRect(wx, wy + (wh * j) / 5, ww, 1.5);
      }
      if (broken) { x.strokeStyle = 'rgba(120,140,120,0.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(wx + r() * ww, wy); x.lineTo(wx + r() * ww, wy + wh); x.stroke(); }
      // pilaster between windows
      x.fillStyle = giltDk; x.fillRect(k * cw, y0 + th * 0.2, cw * 0.08, th * 0.78);
      x.fillStyle = gilt; x.fillRect(k * cw + 1, y0 + th * 0.2, 2, th * 0.78);
    }
  }
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(0,0,0,${r() * 0.15})`; x.fillRect(r() * W, r() * H, 2 + r() * 10, 1 + r() * 4); }
  return { map: tex(c), emissiveMap: tex(ec) };
}

/* ------------------------------------------------------------------ hull loft */

// Section-by-section loft. u: 0 stern .. 1 bow, hn: 0 keel .. 1 gunwale.
function loftHull(L, D, T, f) {
  const NS = 96, NP = 18;
  const pos = [], uv = [], idx = [];
  const P = (u, hn) => {
    const x = -L / 2 + u * L + f.bowRake * hn * sstep(u, 0.82, 1) - f.sternRake * hn * sstep(u, 0.18, 0);
    const yk = f.rocker * Math.pow(Math.abs(2 * u - 1), 4);
    const yt = D + f.sheer * Math.pow(Math.abs(2 * u - 1), 2.2);
    const y = lerp(yk, yt, Math.pow(hn, 0.9)) - T;
    const z = f.halfB * f.plan(u, hn) * f.section(hn);
    return [x, y, z];
  };
  const ring = [];
  for (let j = NP - 1; j >= 0; j--) ring.push([j / (NP - 1), -1]);
  for (let j = 1; j < NP; j++) ring.push([j / (NP - 1), 1]);
  const R = ring.length;
  const Hmax = D + f.sheer + T + 0.5;
  for (let i = 0; i <= NS; i++) {
    const u = i / NS;
    for (const [hn, s] of ring) {
      const [x, y, z] = P(u, hn);
      pos.push(x, y, z * s);
      uv.push((x + L / 2) / L, (y + T) / Hmax);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < R - 1; j++) {
    const a = i * R + j, b = (i + 1) * R + j;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  // end caps (transom / stem) as fans
  for (const [i, flip] of [[0, true], [NS, false]]) {
    const base = pos.length / 3;
    let cx = 0, cy = 0;
    for (let j = 0; j < R; j++) { cx += pos[(i * R + j) * 3]; cy += pos[(i * R + j) * 3 + 1]; }
    pos.push(cx / R, cy / R, 0); uv.push(i ? 1 : 0, 0.5);
    for (let j = 0; j < R - 1; j++) flip ? idx.push(base, i * R + j, i * R + j + 1) : idx.push(base, i * R + j + 1, i * R + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // flat deck between the gunwales, slightly below the rail
  const dp = [], du = [], di = [];
  for (let i = 0; i <= NS; i++) {
    const u = i / NS;
    const [x, y, z] = P(u, 0.94);
    dp.push(x, y, -z, x, y, z); du.push(x / 4, -z / 4, x / 4, z / 4);
    if (i < NS) { const k = i * 2; di.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const deck = new THREE.BufferGeometry();
  deck.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  deck.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2));
  deck.setIndex(di); deck.computeVertexNormals();
  const uAt = (x) => clamp((x + L / 2) / L, 0, 1);
  return {
    hull: g, deck, Hmax, P,
    deckY: (x) => P(uAt(x), 0.94)[1],
    halfB: (x) => P(uAt(x), 1)[2],
    halfBAt: (x, y) => { const u = uAt(x); for (let k = 0; k <= 12; k++) { const p = P(u, k / 12); if (p[1] >= y) return p[2]; } return P(u, 1)[2]; },
  };
}

/* ------------------------------------------------------------------ sails & rigging */

// Per-ship wind state: uFill (how hard the canvas is pressed; negative = aback),
// uLuff (flogging when pinched too close to the wind), uSide (leeward side for fore-and-aft sails).
function windState() { return { uFill: { value: 0.8 }, uLuff: { value: 0 }, uSide: { value: 1 } }; }

function sailMaterial(t, ghost, W, foreAft = false) {
  const mat = new THREE.MeshStandardMaterial({
    map: t.map, alphaMap: t.alphaMap || null, alphaTest: t.alphaMap ? 0.5 : 0,
    side: THREE.DoubleSide, roughness: 0.92, metalness: 0, envMapIntensity: 0.4,
    emissive: ghost ? new THREE.Color('#16392c') : new THREE.Color(0, 0, 0), emissiveIntensity: ghost ? 0.06 : 0,
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSailT = SAIL.uTime; sh.uniforms.uFill = W.uFill; sh.uniforms.uLuff = W.uLuff; sh.uniforms.uSide = W.uSide;
    const side = foreAft ? 'uSide' : '1.0';
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSailT, uFill, uLuff, uSide;\nattribute float aBelly;')
      // curve the normals with the belly so the light shows the shape of the canvas
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float su = 2.0 * uv.x - 1.0;
        float k = 0.11 * (uFill + 0.15 * uLuff) * ${side};
        objectNormal = normalize(objectNormal + vec3(4.0 * su * (0.35 + 0.65 * (1.0 - uv.y)) * k, 0.95 * (1.0 - su * su) * k, 0.0));`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float bu = 1.0 - su * su;
        float bv = 0.35 + 0.65 * (1.0 - uv.y);
        float gust = 1.0 + 0.06 * sin(uSailT * 2.3 + uv.x * 5.0 + uv.y * 3.0);
        float flog = sin(uSailT * 11.0 + uv.x * 10.0 - uv.y * 4.0) * uLuff * (0.3 + 0.7 * uv.x);
        transformed.z += bu * bv * aBelly * (uFill * gust + flog * 0.55) * ${side};`);
    // canvas is thin: with the sun behind it, light comes through and the cloth glows warm
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      #if NUM_DIR_LIGHTS > 0
        float sailTr = max(0.0, -dot(normal, directionalLights[0].direction));
        totalEmissiveRadiance += diffuseColor.rgb * directionalLights[0].color * (0.08 + 0.32 * sailTr * sailTr) * ${ghost ? '0.3' : '1.0'};
      #endif`);
  };
  return mat;
}

// a square sail hanging from a yard at (x, y); width across the ship, depth down
function squareSail(mat, x, y, w, h, belly, foot = 1, segs = [12, 8]) {
  const g = new THREE.PlaneGeometry(w, h, segs[0], segs[1]);
  if (foot !== 1) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * lerp(foot, 1, (p.getY(i) + h / 2) / h)); }
  g.translate(0, -h / 2, 0);
  g.setAttribute('aBelly', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(belly), 1));
  const m = new THREE.Mesh(g, mat);
  m.rotation.y = Math.PI / 2; // face forward, billow toward the bow
  m.position.set(x, y, 0);
  return m;
}

function yardMesh(mat, x, y, w, r) {
  const m = new THREE.Mesh(CYL8, mat);
  m.position.set(x, y, 0); m.rotation.x = Math.PI / 2; m.scale.set(r, w, r);
  return m;
}

// fore-and-aft sail from a list of 3 or 4 corners in the centre plane (belly sideways)
function foreAftSail(mat, pts, belly) {
  const g = new THREE.BufferGeometry();
  const n = 8;
  const pos = [], uv = [], idx = [], b = [];
  const quad = pts.length === 4 ? pts : [pts[0], pts[1], pts[2], pts[2]];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const u = i / n, v = j / n;
    const top = quad[0].clone().lerp(quad[1], u), bot = quad[3].clone().lerp(quad[2], u);
    const p = bot.lerp(top, v);
    pos.push(p.x, p.y, p.z); uv.push(u, v); b.push(belly);
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, c = a + n + 1; idx.push(a, c, a + 1, c, c + 1, a + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aBelly', new THREE.Float32BufferAttribute(b, 1));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function flagMesh(color, w, h, timeU) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uFlagT = timeU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFlagT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fw = position.x + ${(w / 2).toFixed(2)};
        transformed.z += sin(uFlagT * 7.0 - fw * 3.0) * 0.12 * fw + sin(uFlagT * 12.0 - fw * 5.0) * 0.04 * fw;`);
  };
  const g = new THREE.PlaneGeometry(w, h, 12, 4);
  g.translate(-w / 2, 0, 0);
  return new THREE.Mesh(g, mat);
}

/* ------------------------------------------------------------------ shared finishing */

// a few figures working the deck: instanced, with idle sway and short walks
function crewMesh(group, spots, palette) {
  const body = new THREE.CapsuleGeometry(0.22, 0.95, 4, 8); body.translate(0, 0.7, 0);
  const head = new THREE.SphereGeometry(0.16, 10, 8); head.translate(0, 1.5, 0);
  const g = mergeAll([body, head]);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const im = new THREE.InstancedMesh(g, mat, spots.length);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const c = new THREE.Color();
  spots.forEach((sp, i) => { im.setColorAt(i, c.set(palette[i % palette.length])); });
  im.frustumCulled = false;
  group.add(im);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  return (t) => {
    spots.forEach((sp, i) => {
      const w = sp.walk ? Math.sin(t * 0.18 + i * 1.7) * sp.walk : 0;
      p.set(sp.x + w, sp.y, sp.z);
      e.set(Math.sin(t * 1.3 + i) * 0.05, sp.face + (sp.walk ? (Math.cos(t * 0.18 + i * 1.7) > 0 ? 0 : Math.PI) : 0), Math.sin(t * 0.9 + i * 2) * 0.06);
      q.setFromEuler(e);
      im.setMatrixAt(i, m4.compose(p, q, one));
    });
    im.instanceMatrix.needsUpdate = true;
  };
}
function mergeAll(list) {
  const pos = [], nor = [], idx = [];
  let off = 0;
  for (const g of list) {
    const gp = g.attributes.position, gn = g.attributes.normal;
    for (let i = 0; i < gp.count; i++) { pos.push(gp.getX(i), gp.getY(i), gp.getZ(i)); nor.push(gn.getX(i), gn.getY(i), gn.getZ(i)); }
    const gi = g.index.array; for (let i = 0; i < gi.length; i++) idx.push(gi[i] + off);
    off += gp.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}

function finish({ group, batch, lights, glowMats, S, L, B, D, T, H, eye, bowLocal, sails, braces = [], WIND, extra, crew }) {
  batch.build(group);
  const sprites = [], reflect = [];
  for (const l of lights) {
    const mat = new THREE.SpriteMaterial({ map: S.glow, color: new THREE.Color(...l.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    mat.userData.baseColor = mat.color.clone(); mat.userData.night = !!l.night;
    const sp = new THREE.Sprite(mat); sp.position.copy(l.p); sp.scale.setScalar(l.size);
    group.add(sp); sprites.push(sp);
    if (l.reflect) reflect.push({ p: l.p.clone(), c: new THREE.Color(...l.c), night: !!l.night });
  }
  let nightAmt = 0, navAmt = 1, braceT = 0;
  const _w = new THREE.Vector3();
  return {
    group, L, B, D, T, deckY: H.deckY, halfB: H.halfB, halfBAt: H.halfBAt,
    bowLocal, eye, funnelTop: null, smoke: null, sails,
    // phi: direction the apparent wind blows toward, in ship space (0 = from dead astern, +: toward starboard)
    setWind(phi, strength) {
      if (!WIND) return;
      braceT = clamp(-phi, -0.62, 0.62);                       // yards swing round as far as the braces allow
      const fill = Math.cos(phi + braceT);                       // how squarely the wind meets the canvas
      const s = 0.35 + 0.65 * Math.min(strength, 1.4);
      WIND.uFill.value += (clamp(fill, -0.3, 1) * s - WIND.uFill.value) * 0.05;
      WIND.uLuff.value += (clamp((0.45 - fill) / 0.6, 0, 1) * s - WIND.uLuff.value) * 0.05;
      const side = Math.sin(phi) >= 0 ? 1 : -1;
      WIND.uSide.value += (side - WIND.uSide.value) * 0.03;
    },
    setLights(windows, nav) {
      nightAmt = clamp((windows - 0.6) / 1.2, 0, 1); navAmt = nav;
      for (const m of glowMats) m.emissiveIntensity = m.userData.baseGlow * windows;
      for (const sp of sprites) {
        const k = sp.material.userData.night ? nav * nightAmt : nav;
        sp.material.color.copy(sp.material.userData.baseColor).multiplyScalar(k);
        sp.visible = k > 0.01;
      }
    },
    reflections(outPos, outCol, max = 8) {
      let n = 0;
      for (const r of reflect) {
        if (n >= max) break;
        const k = r.night ? navAmt * nightAmt : navAmt * (0.04 + 0.96 * nightAmt);
        if (k < 0.01) continue;
        outPos[n].copy(_w.copy(r.p).applyMatrix4(group.matrixWorld));
        outCol[n].copy(r.c).multiplyScalar(k * 0.022); n++;
      }
      for (let i = n; i < max; i++) outCol[i].setRGB(0, 0, 0);
    },
    update(dt, t, racing = 0) {
      // reef: shorten sail as the wind builds (topgallants first, then courses)
      for (const b of braces) b.rotation.y += (braceT - b.rotation.y) * (1 - Math.exp(-dt * 0.6));
      // candle and oil-lamp flicker
      const fl = 0.86 + 0.1 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 29.7 + 1.3) + 0.04 * Math.random();
      for (const m of glowMats) if (m.userData.flicker) m.emissiveIntensity *= fl;
      if (crew) crew(t);
      for (const s of sails) {
        const target = SAIL.reef > s.reefAt ? s.reefTo : 1;
        s.mesh.scale.y += (target - s.mesh.scale.y) * (1 - Math.exp(-dt * 0.8));
      }
      if (extra) extra(dt, t, racing);
    },
  };
}

const glowMat = (glowMats, color, intensity) => {
  const m = new THREE.MeshStandardMaterial({ color: '#1a1206', emissive: color, emissiveIntensity: intensity, roughness: 0.6 });
  m.userData.baseGlow = intensity; glowMats.push(m); return m;
};

/* ================================================================== TRIREME */

export function buildTrireme(o = {}) {
  const L = 37, B = 5.4, D = 2.7, T = 1.1;
  const S = shared();
  const m = S.m;
  const detail = o.spots !== false;
  const group = new THREE.Group();
  const batch = new Batch();
  const glowMats = [];
  const H = loftHull(L, D, T, {
    halfB: B / 2 - 0.4, rocker: 1.1, sheer: 1.2, bowRake: 0.6, sternRake: 2.2,
    plan: (u) => Math.pow(Math.sin(Math.PI * clamp(u * 0.96 + 0.02, 0, 1)), 0.62),
    section: (hn) => Math.pow(1 - Math.pow(1 - hn, 2.6), 1 / 2.6) * (1 + 0.1 * sstep(hn, 0.6, 1)),
  });
  const ht = hullTexture({
    L, Hmax: H.Hmax, T, seed: 21, eye: { x: L - 3.4, y: T + 0.7 },
    bands: [
      { from: 0, to: T + 0.25, color: '#15110d' },              // pitch-coated bottom
      { from: T + 0.25, to: H.Hmax, color: '#9c6a3c' },          // oiled oak
      { from: D + T - 0.55, to: D + T - 0.2, color: '#7c2a1f' }, // painted strake
      { from: D + T - 0.95, to: D + T - 0.75, color: '#22436b' },
    ],
    oarports: [T + 0.55, T + 0.95],
  });
  const wood = new THREE.MeshStandardMaterial({ map: ht.map, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6 });
  group.add(new THREE.Mesh(H.hull, wood));
  const deckT = deckTexture(22);
  group.add(new THREE.Mesh(H.deck, new THREE.MeshStandardMaterial({ map: deckT, roughness: 0.75 })));
  const oak = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.6 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#4a2f1a', roughness: 0.7 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#a8743a', roughness: 0.35, metalness: 0.9, envMapIntensity: 1.1 });

  // bronze ram at the waterline, three-finned
  batch.add(bronze, new THREE.ConeGeometry(0.45, 2.6, 4), M(L / 2 + 0.9, -T + 0.85, 0, 0, 0, -Math.PI / 2, 1, 1, 1));
  for (const dy of [-0.25, 0, 0.25]) batch.box(bronze, L / 2 + 0.2, -T + 0.85 + dy, 0, 1.8, 0.08, 0.9 - Math.abs(dy));
  // outrigger box (parexeiresia) for the top bank, and canopy deck with shields
  const yR = H.deckY(0) + 0.35;
  for (const s of [-1, 1]) {
    batch.box(oak, 0, yR - 0.1, s * (B / 2 - 0.15), L * 0.7, 0.55, 0.5);
    batch.box(darkWood, 0, yR + 0.25, s * (B / 2 - 0.15), L * 0.7, 0.12, 0.6);
    for (let x = -L * 0.32; x < L * 0.32; x += 1.15) {
      batch.add(bronze, CYL, M(x, yR + 0.75, s * (B / 2 - 0.05), Math.PI / 2, 0, 0, 0.45, 0.06, 0.45));
      batch.add(s > 0 ? m.red : m.steelBlue, CYL, M(x, yR + 0.75, s * (B / 2 - 0.02), Math.PI / 2, 0, 0, 0.32, 0.07, 0.32));
    }
  }
  for (let x = -L * 0.35; x < L * 0.36; x += 2.2) batch.box(darkWood, x, yR + 1.1, 0, 0.12, 0.12, B - 1.0);
  batch.box(oak, 0, yR + 1.18, 0, L * 0.72, 0.06, B - 1.2);
  // curled stern post (aphlaston) and the stem post
  const spiral = [];
  for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 1.6; const rr = 2.6 - i / 40 * 1.9; spiral.push(V3(-L / 2 - 1.2 - Math.sin(a) * rr * 0.6, H.deckY(-L / 2) + 1.4 + (1 - Math.cos(a)) * rr * 0.9, 0)); }
  batch.add(oak, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 60, 0.22, 8, false));
  batch.rod(oak, V3(L / 2 - 0.4, H.deckY(L / 2) - 0.5, 0), V3(L / 2 + 0.4, H.deckY(L / 2) + 1.6, 0), 0.2, CYL8);
  // steering oars at the stern quarters
  for (const s of [-1, 1]) {
    batch.rod(darkWood, V3(-L / 2 + 4, yR + 0.8, s * (B / 2)), V3(-L / 2 + 1.5, -T - 0.4, s * (B / 2 + 0.6)), 0.09, CYL8);
    batch.box(darkWood, -L / 2 + 1.4, -T - 0.2, s * (B / 2 + 0.62), 1.6, 0.9, 0.06);
  }
  // little deckhouse (helmsman's shelter) at the stern
  batch.box(oak, -L / 2 + 6, yR + 1.8, 0, 2.6, 1.3, 2.4);
  batch.box(darkWood, -L / 2 + 6, yR + 2.5, 0, 2.9, 0.12, 2.7);

  // mast, yard and big square sail; small foresail (artemon) on a raked bow mast
  const mastX = 1.5, mastH = 13, yardY = yR + mastH - 0.6;
  batch.cyl(oak, mastX, yR + mastH / 2, 0, 0.18, mastH, 0, 0, 0, CYL8);
  const st = sailTexture({ seed: 23, color: '#e2d3b2', seams: 1, grid: 6 });
  const WIND = windState();
  const sailMat = sailMaterial(st, false, WIND);
  const sails = [], braces = [];
  const mainBrace = new THREE.Group(); mainBrace.position.set(mastX, 0, 0); group.add(mainBrace); braces.push(mainBrace);
  mainBrace.add(yardMesh(oak, 0.25, yardY, 15, 0.12));
  const main = squareSail(sailMat, 0.45, yardY, 14, 9.5, 1.6);
  mainBrace.add(main); sails.push({ mesh: main, reefAt: 0.55, reefTo: 0.12 });
  const art0 = V3(L / 2 - 4, yR + 0.2, 0), art1 = V3(L / 2 + 0.5, yR + 5.2, 0);
  batch.rod(oak, art0, art1, 0.1, CYL8);
  const artBrace = new THREE.Group(); artBrace.position.set(art1.x - 0.2, 0, 0); group.add(artBrace); braces.push(artBrace);
  artBrace.add(yardMesh(oak, 0, art1.y - 0.2, 4.5, 0.07));
  const art = squareSail(sailMat, 0.15, art1.y - 0.2, 4.2, 3, 0.45);
  artBrace.add(art); sails.push({ mesh: art, reefAt: 0.45, reefTo: 0.12 });

  // rigging
  const rig = [];
  const add = (a, b) => rig.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const top = V3(mastX, yR + mastH, 0);
  add(top, V3(L / 2 - 1, H.deckY(L / 2) + 1.2, 0)); add(top, V3(-L / 2 + 2, H.deckY(-L / 2) + 1.4, 0));
  for (const s of [-1, 1]) { add(top, V3(mastX - 1, yR, s * (B / 2 - 0.3))); add(top, V3(mastX + 1.5, yR, s * (B / 2 - 0.3))); add(V3(mastX + 0.3, yardY, s * 7), V3(mastX - 3, yR + 0.8, s * 2)); }
  const rl = new THREE.BufferGeometry(); rl.setAttribute('position', new THREE.Float32BufferAttribute(rig, 3));
  group.add(new THREE.LineSegments(rl, new THREE.LineBasicMaterial({ color: 0x2b1d12, transparent: true, opacity: 0.8 })));

  // three banks of oars, rowing together (thranite, zygite, thalamite)
  const banks = detail ? [
    { n: 31, y: yR - 0.1, out: B / 2 + 0.15, len: 4.6, pitch: 0.55 },
    { n: 27, y: yR - 0.55, out: B / 2 - 0.05, len: 4.3, pitch: 0.45 },
    { n: 27, y: yR - 1.0, out: B / 2 - 0.35, len: 4.0, pitch: 0.32 },
  ] : [{ n: 27, y: yR - 0.4, out: B / 2, len: 4.4, pitch: 0.45 }];
  const oarGeo = (() => {
    const shaft = new THREE.CylinderGeometry(0.035, 0.045, 1, 6); shaft.rotateZ(Math.PI / 2); shaft.translate(0.5, 0, 0);
    const blade = new THREE.BoxGeometry(0.14, 0.02, 1); blade.translate(0, 0, 0); // placed by scale below
    return { shaft, blade };
  })();
  const oarCount = banks.reduce((a, b) => a + b.n * 2, 0);
  const shaftMesh = new THREE.InstancedMesh(oarGeo.shaft, oak, oarCount);
  const bladeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.03, 0.18), oak, oarCount);
  shaftMesh.frustumCulled = bladeMesh.frustumCulled = false;
  group.add(shaftMesh, bladeMesh);
  const oars = [];
  for (const b of banks) for (const s of [-1, 1]) for (let i = 0; i < b.n; i++) {
    const x = -L * 0.33 + (i + 0.5) / b.n * L * 0.62;
    oars.push({ x, y: b.y, z: s * b.out, s, len: b.len, pitch: b.pitch });
  }
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _sc = new THREE.Vector3(), _bp = new THREE.Vector3();
  const _dir = new THREE.Vector3(), _X = new THREE.Vector3(1, 0, 0);
  const splashes = [];

  // lights: stern lantern and a brazier at the bow
  const lights = [
    { p: V3(-L / 2 + 1, H.deckY(-L / 2) + 3.8, 0), c: [2.2, 1.4, 0.6], size: 2.6, reflect: true },
    { p: V3(L / 2 - 2, yR + 1.6, 0), c: [2.4, 1.3, 0.5], size: 2.2, night: true, reflect: true },
    { p: V3(-L / 2 + 6, yR + 2.0, 1.4), c: [2.0, 1.3, 0.6], size: 1.6, night: true },
  ];
  const flagT = SAIL.uTime;
  const pennant = flagMesh('#7c2a1f', 1.8, 0.5, flagT);
  pennant.position.set(mastX, yR + mastH + 0.4, 0); group.add(pennant);

  let phase = 0;
  const ship = finish({
    group, batch, lights, glowMats, S, L, B, D, T, H,
    eye: V3(-L / 2 + 7.5, yR + 2.2, 0), bowLocal: V3(L / 2, 0, 0), sails, braces, WIND,
    crew: crewMesh(group, [
      { x: -L / 2 + 6.2, y: yR + 1.2, z: 0.5, face: 0 }, { x: -L / 2 + 8.5, y: yR + 1.2, z: -0.6, face: 0.3 },
      { x: L / 2 - 6, y: yR + 1.2, z: 0.4, face: 0 }, { x: 3, y: yR + 1.2, z: 0.8, face: 1.2, walk: 6 },
      { x: -6, y: yR + 1.2, z: -0.8, face: -1.4, walk: 4 },
    ], ['#8a2a20', '#d8c9a6', '#6b5a3a', '#2a3b5c']),
    extra(dt, t) {
      // ~26 strokes a minute; the stroke slows when the storm builds
      phase += dt * (2.7 - 0.9 * SAIL.reef);
      const sinp = Math.sin(phase), cosp = Math.cos(phase);
      oars.forEach((o2, i) => {
        // each oar runs outward and down to the water from its thole pin, sweeping fore-aft;
        // the blade lifts clear on the recovery stroke
        const beta = 0.42 * sinp;
        const alpha = o2.pitch - (cosp > 0 ? 0.22 * cosp : 0.04 * cosp);
        _dir.set(Math.sin(beta) * Math.cos(alpha), -Math.sin(alpha), o2.s * Math.cos(beta) * Math.cos(alpha));
        _q.setFromUnitVectors(_X, _dir);
        _m.compose(_p.set(o2.x, o2.y, o2.z), _q, _sc.set(o2.len, 1, 1));
        shaftMesh.setMatrixAt(i, _m);
        _bp.copy(_dir).multiplyScalar(o2.len - 0.3).add(_p);
        _m.compose(_bp, _q, _sc.set(1, 1, 1));
        bladeMesh.setMatrixAt(i, _m);
      });
      shaftMesh.instanceMatrix.needsUpdate = bladeMesh.instanceMatrix.needsUpdate = true;
      // the catch: blades bite the water together
      if (ship.onSplash && Math.sin(phase - dt * 2.7) < 0.95 && sinp >= 0.95) {
        splashes.length = 0;
        for (let k = 0; k < oars.length; k += 5) splashes.push(V3(oars[k].x, -0.3, oars[k].s * (B / 2 + oars[k].len * 0.8)));
        ship.onSplash(splashes, 0.4);
      }
    },
  });
  ship.kind = 'trireme';
  return ship;
}

/* ================================================================== SHIP OF THE LINE / GHOST */

export function buildSailShip(o = {}) {
  const ghost = !!o.ghost;
  const L = 69, B = 15.8, D = 12.5, T = 6.6;
  const S = shared();
  const m = S.m;
  const detail = o.spots !== false;
  const group = new THREE.Group();
  const batch = new Batch();
  const glowMats = [];
  const H = loftHull(L, D, T, {
    halfB: B / 2, rocker: 1.6, sheer: 1.6, bowRake: 3.2, sternRake: 1.8,
    plan: (u, hn) => {
      const bow = Math.pow(Math.sin(Math.PI * clamp(0.5 + (u - 0.5) * 0.96, 0, 1)), u > 0.5 ? 0.42 : 0.3);
      const stern = u < 0.2 ? lerp(lerp(0.1, 0.78, Math.pow(hn, 0.7)), 1, sstep(u, 0, 0.2)) : 1;
      return u < 0.2 ? stern * lerp(0.92, 1, sstep(u, 0, 0.2)) : bow;
    },
    section: (hn) => Math.pow(1 - Math.pow(1 - hn, 2.2), 1 / 2.2) * (1 - 0.13 * sstep(hn, 0.6, 1)), // round bilge with tumblehome
  });
  // paint scheme: copper below the waterline, black topsides with ochre strakes at each gun deck
  const gunRows = [T + 1.9, T + 4.3, T + 6.6];
  const bands = ghost ? [
    { from: 0, to: H.Hmax, color: '#2c2f2a' },
    { from: 0, to: T + 0.3, color: '#25302a' },
  ] : [
    { from: 0, to: T + 0.3, color: '#9a5a33' },
    { from: T + 0.3, to: H.Hmax, color: '#141312' },
    ...gunRows.map((y) => ({ from: y - 0.75, to: y + 0.65, color: '#c79c4a' })),
  ];
  const ht = hullTexture({ L, Hmax: H.Hmax, T, seed: ghost ? 41 : 31, bands, ghost });
  const hullMat = new THREE.MeshStandardMaterial({ map: ht.map, emissiveMap: ht.emissiveMap, emissive: ghost ? '#ffffff' : '#000000', emissiveIntensity: ghost ? 0.8 : 0, roughness: ghost ? 0.85 : 0.5, metalness: 0.05, envMapIntensity: 0.6 });
  if (ghost) { hullMat.userData.baseGlow = 0.8; glowMats.push(hullMat); }
  group.add(new THREE.Mesh(H.hull, hullMat));
  group.add(new THREE.Mesh(H.deck, new THREE.MeshStandardMaterial({ map: deckTexture(32, ghost), roughness: 0.8 })));
  const black = new THREE.MeshStandardMaterial({ color: ghost ? '#23261f' : '#151413', roughness: 0.6 });
  const ochre = new THREE.MeshStandardMaterial({ color: ghost ? '#3a3d32' : '#c79c4a', roughness: 0.55 });
  const wood = new THREE.MeshStandardMaterial({ color: ghost ? '#2e2a22' : '#6b4a2b', roughness: 0.7 });
  const gold = new THREE.MeshStandardMaterial({ color: ghost ? '#3f4a3a' : '#c9a04a', roughness: 0.35, metalness: ghost ? 0.2 : 0.8, envMapIntensity: 1.0 });
  const iron = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.45, metalness: 0.7 });
  const portRed = new THREE.MeshStandardMaterial({ color: ghost ? '#2a2a24' : '#8f2a1e', roughness: 0.6 });
  const portGlow = glowMat(glowMats, ghost ? '#5dffb0' : '#ffb35c', ghost ? 1.4 : 0.9);

  // gun decks: ports with raised lids (red inner face) and run-out guns
  const yDeck = H.deckY(0);
  for (const [k, yRow] of gunRows.entries()) {
    const y = yRow - T;
    const n = [15, 15, 13][k], span = L * [0.66, 0.7, 0.62][k];
    for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
      const x = -span / 2 + (i + 0.5) / n * span + (k === 2 ? -3 : 0);
      const z = H.halfBAt(x, y) + 0.02;
      if (ghost && (i * 7 + k * 3) % 5 === 0) continue;
      batch.box(portGlow, x, y, s * (z - 0.05), 0.85, 0.8, 0.12);
      batch.box(portRed, x, y + 0.75, s * (z + 0.32), 0.95, 0.08, 0.85, s * 1.05, 0, 0);
      if (detail || i % 2 === 0) batch.add(iron, CYL8, M(x, y - 0.05, s * (z + 0.45), Math.PI / 2, 0, 0, 0.17, 1.3, 0.17));
    }
  }
  // raised quarterdeck & poop aft, forecastle forward, with balustrade rails
  const qd = (x0, x1, h) => {
    const xm = (x0 + x1) / 2, w = Math.min(H.halfB(x0), H.halfB(x1)) * 2 - 0.4;
    batch.box(black, xm, yDeck + h / 2, 0, x1 - x0, h, w);
    batch.box(wood, xm, yDeck + h + 0.03, 0, x1 - x0, 0.06, w - 0.2);
    for (const s of [-1, 1]) for (let x = x0 + 0.5; x < x1; x += 0.8) batch.box(gold, x, yDeck + h + 0.45, s * (w / 2 - 0.1), 0.08, 0.8, 0.08);
    for (const s of [-1, 1]) batch.box(gold, xm, yDeck + h + 0.88, s * (w / 2 - 0.1), x1 - x0, 0.08, 0.14);
    return w;
  };
  qd(-L / 2 + 1, -L / 2 + 23, 2.2);
  qd(-L / 2 + 1, -L / 2 + 11, 4.4);
  qd(L / 2 - 17, L / 2 - 5, 2.0);
  // stern gallery: tiers of lit windows framed in gold, quarter galleries on each side
  const sw = H.halfB(-L / 2) * 2 - 0.6;
  const gt = galleryTexture(ghost ? 47 : 37, ghost);
  const galMat = new THREE.MeshStandardMaterial({ map: gt.map, emissiveMap: gt.emissiveMap, emissive: 0xffffff, emissiveIntensity: ghost ? 0.7 : 1.0, roughness: 0.45, metalness: 0.3, envMapIntensity: 0.8 });
  galMat.userData.baseGlow = galMat.emissiveIntensity; galMat.userData.flicker = true; glowMats.push(galMat);
  const galH = 6.8;
  const gal = new THREE.Mesh(new THREE.BoxGeometry(0.7, galH, sw), [black, galMat, black, black, black, black]);
  gal.position.set(-L / 2 - 1.0, yDeck + 0.4 + galH / 2, 0);
  gal.rotation.z = -0.08; // galleries lean outboard over the rudder
  group.add(gal);
  batch.box(gold, -L / 2 - 1.15, yDeck + 0.4 + galH + 0.35, 0, 1.0, 0.7, sw + 0.6);   // taffrail
  batch.box(gold, -L / 2 - 0.9, yDeck + 0.3, 0, 1.4, 0.35, sw + 0.4);                 // gallery foot
  for (const s of [-1, 1]) {
    const qx = -L / 2 + 5.0, qz = s * (H.halfB(qx) + 0.55);
    const q = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.4, 1.3), [black, black, black, black, s > 0 ? galMat : black, s < 0 ? galMat : black]);
    q.position.set(qx, yDeck + 2.7, qz);
    group.add(q);
    batch.add(gold, SPH, M(qx, yDeck + 0.4, qz, 0, 0, 0, 3.4, 0.9, 0.9));        // carved drop below
    batch.box(gold, qx, yDeck + 5.05, qz, 6.6, 0.35, 1.5);
  }
  // beakhead, figurehead and bowsprit with jib-boom
  const bowX = L / 2 + 1.5;
  batch.box(black, bowX - 1.5, yDeck + 0.8, 0, 3, 1.8, 4.5);
  batch.add(gold, SPH, M(bowX + 1.2, yDeck - 0.6, 0, 0, 0, -0.5, 1.3, 0.6, 0.55));
  batch.add(gold, SPH, M(bowX + 1.6, yDeck + 0.3, 0, 0, 0, 0, 0.45, 0.5, 0.45));
  const bs0 = V3(L / 2 - 4, yDeck + 1.5, 0), bs1 = V3(L / 2 + 22, yDeck + 9.5, 0);
  batch.rod(wood, bs0, bs1, 0.42, CYL8);
  batch.rod(wood, bs1.clone().lerp(bs0, 0.3), V3(L / 2 + 34, yDeck + 13, 0), 0.22, CYL8);

  // masts, tops, yards and sails (course, topsail, topgallant)
  const sailT = sailTexture({ seed: ghost ? 43 : 33, color: ghost ? '#4c5148' : '#ece5d2', seams: 14, ghost });
  const WIND = windState();
  const sMat = sailMaterial(sailT, ghost, WIND);
  const fMat = sailMaterial(sailT, ghost, WIND, true);
  if (ghost) for (const mm of [sMat, fMat]) { mm.userData.baseGlow = 0.06; glowMats.push(mm); }
  const sails = [], braces = [];
  const masts = [
    { x: 21, h: 50, yards: [[13.5, 26, 10.5], [26, 20, 10.5], [37, 13, 7]] },
    { x: 1, h: 58, yards: [[15, 30, 12], [29, 22, 12], [42, 15, 8]] },
    { x: -19, h: 42, yards: [[19, 16, 8.5], [29, 11, 6]] },
  ];
  const rig = [];
  const line = (a, b) => rig.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (const [mi, mm] of masts.entries()) {
    const y0 = yDeck;
    batch.cyl(wood, mm.x, y0 + mm.h * 0.32, 0, 0.55, mm.h * 0.64, 0, 0, 0, CYL8);
    batch.cyl(wood, mm.x, y0 + mm.h * 0.75, 0, 0.36, mm.h * 0.36, 0, 0, 0, CYL8);
    batch.cyl(wood, mm.x, y0 + mm.h * 0.94, 0, 0.2, mm.h * 0.14, 0, 0, 0, CYL8);
    batch.box(wood, mm.x, y0 + mm.h * 0.62, 0, 3.4, 0.3, 4.6);          // fighting top
    batch.box(wood, mm.x, y0 + mm.h * 0.86, 0, 1.6, 0.2, 2.4);          // crosstrees
    const brace = new THREE.Group(); brace.position.set(mm.x, 0, 0); group.add(brace); braces.push(brace);
    mm.yards.forEach(([yy, w, h], k) => {
      brace.add(yardMesh(wood, 0.5, y0 + yy, w, 0.22 - k * 0.04));
      const sail = squareSail(sMat, 0.75, y0 + yy - 0.2, w * 0.92, h, w * 0.085);
      brace.add(sail);
      // topgallants come in first, then courses; topsails stay (close-reefed)
      sails.push({ mesh: sail, reefAt: k === 2 ? 0.25 : k === 0 ? 0.55 : 0.85, reefTo: k === 1 ? 0.45 : 0.08 });
      line(V3(mm.x + 0.5, y0 + yy, w / 2), V3(mm.x - 3, y0 + yy - 6, w / 2 - 2));
      line(V3(mm.x + 0.5, y0 + yy, -w / 2), V3(mm.x - 3, y0 + yy - 6, -w / 2 + 2));
    });
    // shrouds to the channels, backstays, and stays running forward
    const topY = y0 + mm.h * 0.62, capY = y0 + mm.h;
    for (const s of [-1, 1]) for (let k = 0; k < (detail ? 6 : 3); k++) {
      const cx = mm.x - 2.5 + k * 1.0;
      line(V3(mm.x, topY, s * 0.4), V3(cx, yDeck + 0.8, s * (H.halfB(cx) + 0.4)));
      if (k < 3) line(V3(mm.x, capY - 2, s * 0.3), V3(mm.x - 1.5 + k, topY, s * 2.2));
    }
    for (const s of [-1, 1]) line(V3(mm.x, capY, 0), V3(mm.x - 12, yDeck + 0.8, s * (H.halfB(mm.x - 12) + 0.3)));
    if (mi > 0) line(V3(mm.x, capY - 2, 0), V3(masts[mi - 1].x, y0 + masts[mi - 1].h * 0.62, 0));
  }
  line(V3(21, yDeck + 50, 0), V3(L / 2 + 33, yDeck + 13, 0));
  line(V3(21, yDeck + 32, 0), bs1);
  // jibs on the forestays and a spanker on the mizzen gaff
  for (const [a, b, c] of [
    [V3(37, yDeck + 37, 0), V3(L / 2 + 31, yDeck + 13.3, 0), V3(L / 2 + 10, yDeck + 11, 0)],
    [V3(31.6, yDeck + 25.2, 0), V3(L / 2 + 19.5, yDeck + 9.6, 0), V3(L / 2 + 2, yDeck + 7.5, 0)],
  ]) {
    const j = foreAftSail(fMat, [a, b, c], 1.6); group.add(j);
    sails.push({ mesh: j, reefAt: 0.9, reefTo: 1 });
  }
  const gaffTop = V3(-19, yDeck + 19.5, 0), gaffEnd = V3(-33, yDeck + 22.5, 0);
  batch.rod(wood, gaffTop, gaffEnd, 0.18, CYL8);
  batch.rod(wood, V3(-19, yDeck + 6, 0), V3(-L / 2 - 6, yDeck + 7, 0), 0.2, CYL8);
  const spk = foreAftSail(fMat, [gaffTop, gaffEnd, V3(-L / 2 - 5.5, yDeck + 7.2, 0), V3(-19.5, yDeck + 6.5, 0)], 1.8);
  group.add(spk); sails.push({ mesh: spk, reefAt: 0.7, reefTo: 0.5 });
  const rl = new THREE.BufferGeometry(); rl.setAttribute('position', new THREE.Float32BufferAttribute(rig, 3));
  group.add(new THREE.LineSegments(rl, new THREE.LineBasicMaterial({ color: ghost ? 0x1a2a20 : 0x231a12, transparent: true, opacity: 0.85 })));

  // hull detail: raised wales, channels, catheads with anchors, hammock nettings, boats on the booms, the wheel
  for (const s of [-1, 1]) {
    for (const wy of [gunRows[0] - T - 1.1, gunRows[1] - T - 1.15, gunRows[2] - T - 1.1]) {
      for (let x = -L / 2 + 4; x < L / 2 - 4; x += 2.2) {
        const z0 = H.halfBAt(x, wy), z1 = H.halfBAt(x + 2.2, wy);
        batch.box(black, x + 1.1, wy, s * ((z0 + z1) / 2 + 0.08), 2.3, 0.32, 0.22, 0, -s * Math.atan2(z1 - z0, 2.2), 0);
      }
    }
    for (const mx of [21, 1, -19]) {
      const cy = yDeck - 0.6, cz = H.halfBAt(mx, cy) + 0.55;
      batch.box(black, mx - 1, cy, s * cz, 9, 0.22, 1.2);
      for (let k = 0; k < 6; k++) batch.rod(iron, V3(mx - 4.5 + k * 1.8, cy, s * (cz + 0.5)), V3(mx - 4.5 + k * 1.8, cy - 2.4, s * (H.halfBAt(mx, cy - 2.4) + 0.12)), 0.05, CYL8);
    }
    // cathead and anchor at the bow
    const cx = L / 2 - 6, cyy = yDeck + 0.6, cz = H.halfB(cx);
    batch.box(wood, cx, cyy, s * (cz + 0.9), 0.6, 0.6, 2.4, 0, 0, 0);
    const ax = cx - 1.5, ay = yDeck - 3.2, az = s * (H.halfBAt(ax, ay) + 0.35);
    batch.box(iron, ax, ay, az, 0.3, 4.2, 0.3);
    batch.box(iron, ax, ay - 2.0, az, 2.4, 0.35, 0.3, 0, 0, 0);
    for (const k of [-1, 1]) batch.box(iron, ax + k * 1.15, ay - 1.55, az, 0.5, 0.9, 0.35, 0, 0, -k * 0.5);
    batch.box(wood, ax, ay + 1.9, az, 0.3, 0.25, 2.0);
    // hammock nettings along the upper deck rails (rolled grey canvas)
    for (const [x0, x1] of [[-L / 2 + 23, L / 2 - 17]]) {
      const xm = (x0 + x1) / 2, z = H.halfB(xm) - 0.3;
      batch.box(new THREE.MeshStandardMaterial({ color: ghost ? '#3a3f39' : '#c9c5b6', roughness: 0.95 }), xm, yDeck + 1.1, s * z, x1 - x0, 0.9, 0.5);
    }
  }
  // ship's boats nested on the booms in the waist
  const boatMat = new THREE.MeshStandardMaterial({ color: ghost ? '#2b2e28' : '#e8e3d4', roughness: 0.6 });
  for (const [bx, bw, bl] of [[8, 2.4, 9], [8, 2.0, 7]]) {
    const boat = new THREE.CapsuleGeometry(bw / 2, bl - bw, 4, 12);
    boat.rotateZ(Math.PI / 2); boat.scale(1, 0.55, 1);
    batch.add(boatMat, boat, M(bx, yDeck + 2.0 + (bw === 2 ? 0.9 : 0), 0));
  }
  batch.box(wood, 8, yDeck + 1.3, 0, 12, 0.3, 0.4);
  // double steering wheel before the mizzen
  const WHEEL = new THREE.TorusGeometry(0.9, 0.06, 6, 20);
  for (const dz of [-0.35, 0.35]) batch.add(wood, WHEEL, M(-L / 2 + 25.5, yDeck + 2.2 + 1.1, dz, 0, Math.PI / 2, 0));
  batch.box(wood, -L / 2 + 25.5, yDeck + 2.2 + 0.5, 0, 0.4, 1.0, 1.2);

  // ensign and masthead pennant
  const ens = flagMesh(ghost ? '#1d2620' : '#f2f0ea', 4.5, 2.6, SAIL.uTime);
  ens.position.set(-L / 2 - 1, yDeck + 7.5, 0); group.add(ens);
  if (!ghost) { const cross = flagMesh('#b0261c', 4.5, 0.6, SAIL.uTime); cross.position.set(-L / 2 - 1, yDeck + 7.5, 0.01); group.add(cross); }
  const pen = flagMesh(ghost ? '#26302a' : '#b0261c', 7, 0.45, SAIL.uTime);
  pen.position.set(1, yDeck + 59, 0); group.add(pen);

  // lights: three great stern lanterns, a masthead light, deck lanterns
  const LAMP = ghost ? [0.35, 1.5, 0.85] : [2.4, 1.5, 0.6];
  const lights = [];
  const lampGlass = glowMat(glowMats, ghost ? '#4dffa6' : '#ffbf66', ghost ? 0.9 : 1.6);
  lampGlass.userData.flicker = true;
  const LANTERN = new THREE.CylinderGeometry(1, 1, 1, 6);
  for (const z of [-3.2, 0, 3.2]) {
    const ly = yDeck + galH + 1.6 + (z ? 0 : 0.9), lx = -L / 2 - 1.4;
    batch.add(gold, LANTERN, M(lx, ly, z, 0, 0, 0, 0.42, 1.1, 0.42));
    batch.add(lampGlass, LANTERN, M(lx, ly, z, 0, 0, 0, 0.44, 0.8, 0.44));
    batch.add(gold, new THREE.ConeGeometry(0.5, 0.6, 6), M(lx, ly + 0.85, z));
    batch.rod(gold, V3(lx, ly - 0.55, z), V3(lx + 0.6, ly - 1.6, z * 0.8), 0.06, CYL8);
    lights.push({ p: V3(lx, ly, z), c: LAMP, size: 1.7, reflect: true });
  }
  lights.push({ p: V3(1, yDeck + 45, 0), c: LAMP, size: 2.4 });
  for (const x of [-10, 8, 22]) for (const s of [-1, 1]) lights.push({ p: V3(x, yDeck + 1.6, s * (H.halfB(x) - 0.8)), c: LAMP, size: 2.0, night: true, reflect: x === 8 });

  const ship = finish({
    group, batch, lights, glowMats, S, L, B, D, T, H,
    eye: V3(-L / 2 + 14, yDeck + 2.2 + 1.7, 0), bowLocal: V3(L / 2, 0, 0), sails, braces, WIND,
    extra: ghost ? (dt, t) => { hullMat.emissiveIntensity *= 0.8 + 0.2 * Math.sin(t * 1.3); } : null,
    crew: ghost ? null : crewMesh(group, [
      { x: -L / 2 + 25.5, y: yDeck + 2.2, z: -1.2, face: 0 }, { x: -L / 2 + 25.5, y: yDeck + 2.2, z: 1.2, face: 0 },
      { x: -L / 2 + 18, y: yDeck + 2.2, z: 3.5, face: 0.8, walk: 2 }, { x: -L / 2 + 15, y: yDeck + 2.2, z: -3, face: -1.2 },
      { x: 2, y: yDeck, z: 4.5, face: 1.4, walk: 6 }, { x: -6, y: yDeck, z: -4.8, face: -1.4, walk: 5 },
      { x: 14, y: yDeck, z: 2, face: 0.3, walk: 4 }, { x: L / 2 - 10, y: yDeck + 2, z: 3, face: 0 },
      { x: L / 2 - 12, y: yDeck + 2, z: -2.5, face: 0.4 }, { x: 1.2, y: yDeck + 58 * 0.62 + 0.15, z: 1.2, face: 0 },
    ], ['#1d2a44', '#e9e4d4', '#7a2a22', '#3a3a3a', '#d8cdb0']),
  });
  ship.kind = ghost ? 'ghost' : 'sail';
  ship.camL = 160; // frame by the rig height, not the hull length
  return ship;
}

export { windState, sailMaterial, squareSail, foreAftSail, yardMesh, flagMesh, finish, sailTexture, deckTexture, galleryTexture, glowMat };
