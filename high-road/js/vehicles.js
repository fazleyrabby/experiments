import * as THREE from 'three';
import { box, cyl, merge, paint } from './props.js';
import { frameAt, LANE, PERIOD } from './roadpath.js';

// Vehicles are modelled facing -z with the rear at z = 0, x to the right.
// Bodies are side profiles (u = metres from the rear, y = height) extruded across the
// width with a bevel, so they get rounded edges and proper silhouettes.

const GLASS = 0x0a0d10;
const TRIM = 0x161718;
const CHROME = 0xb9bdc0;

// Fillet every corner of a polygon with a short quadratic arc (radius r, or a per-point
// third value), so bodies read as pressed metal rather than boxes.
function roundPoly(pts, r) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [px, py, pr = r] = pts[i];
    const [ax, ay] = pts[(i + n - 1) % n], [bx, by] = pts[(i + 1) % n];
    const la = Math.hypot(ax - px, ay - py), lb = Math.hypot(bx - px, by - py);
    const rr = Math.min(pr, la / 2.2, lb / 2.2);
    if (rr < 0.005) { out.push(new THREE.Vector2(px, py)); continue; }
    const s = [px + ((ax - px) / la) * rr, py + ((ay - py) / la) * rr];
    const e = [px + ((bx - px) / lb) * rr, py + ((by - py) / lb) * rr];
    for (let k = 0; k <= 4; k++) {
      const t = k / 4, m = 1 - t;
      out.push(new THREE.Vector2(m * m * s[0] + 2 * m * t * px + t * t * e[0], m * m * s[1] + 2 * m * t * py + t * t * e[1]));
    }
  }
  return out;
}

function profile(pts, width, color, rough = 0.3, metal = 0.5, bevel = 0.05, emissive = 0, radius = 0.14) {
  const shape = new THREE.Shape(roundPoly(pts, radius));
  const depth = Math.max(0.01, width - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 1 });
  // (u, y, e) -> (e - depth/2, y, -u)
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, -depth / 2, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));
  g.computeVertexNormals();
  return paint(g, color, rough, metal, emissive);
}

// a box placed by its rear position u along the body
const at = (w, h, d, x, y, u, color, rough, metal, emissive) => box(w, h, d, x, y, -u, color, rough, metal, emissive);

function wheel(parts, x, u, r, w = 0.24, rim = 0x9ea2a5) {
  parts.push(cyl(r, w, x, r, -u, 0x141414, 0.92, 0, 'x', 24));
  parts.push(cyl(r * 0.94, w + 0.01, x, r, -u, 0x1c1c1c, 0.85, 0, 'x', 24));
  parts.push(cyl(r * 0.6, w + 0.02, x, r, -u, rim, 0.35, 0.8, 'x', 18));
  parts.push(cyl(r * 0.18, w + 0.04, x, r, -u, 0x5a5d60, 0.4, 0.8, 'x', 10));
  for (let k = 0; k < 5; k++) {
    const g = new THREE.BoxGeometry(w + 0.03, r * 0.95, 0.05);
    g.rotateX((k / 5) * Math.PI);
    g.translate(x, r, -u);
    parts.push(paint(g, rim, 0.35, 0.8));
  }
}

// dark wheel-arch disc across the body so wheels sit in wells
function arch(parts, u, r, width) { parts.push(cyl(r + 0.07, width, 0, r, -u, 0x0b0b0b, 0.9, 0, 'x', 24)); }

function lamp(lights, kind, x, y, u, size) {
  lights.push({ kind, p: new THREE.Vector3(x, y, -u), size });
}

// ---------- cars ----------

function sedan(color) {
  const p = [], L = [];
  p.push(profile([[0, 0.36, 0.08], [0, 0.66, 0.2], [0.1, 0.92, 0.2], [0.9, 1.0, 0.3], [1.12, 1.02], [3.5, 1.02, 0.4], [4.25, 0.88, 0.35], [4.62, 0.74, 0.18], [4.66, 0.5, 0.12], [4.58, 0.36, 0.08]], 1.8, color, 0.25, 0.55, 0.08));
  p.push(profile([[1.0, 1.0, 0.05], [1.5, 1.38, 0.25], [2.85, 1.42, 0.3], [3.62, 1.01, 0.05]], 1.62, GLASS, 0.06, 0, 0.05));
  p.push(profile([[1.55, 1.37], [2.82, 1.41], [2.8, 1.47], [1.6, 1.43]], 1.5, color, 0.35, 0.5, 0.03));
  for (const u of [1.5, 2.35, 2.82]) p.push(at(1.64, 0.36, 0.07, 0, 1.2, u, color, 0.35, 0.5));
  p.push(at(1.84, 0.2, 0.25, 0, 0.42, 4.55, TRIM, 0.7, 0.1));
  p.push(at(1.84, 0.2, 0.22, 0, 0.42, 0.1, TRIM, 0.7, 0.1));
  p.push(at(0.9, 0.16, 0.04, 0, 0.6, 4.66, 0x0c0c0c, 0.5, 0.3));
  for (const s of [-1, 1]) {
    p.push(at(0.36, 0.11, 0.05, s * 0.62, 0.74, 4.62, 0xe8eef2, 0.05, 0.5, 0.3));
    p.push(at(0.38, 0.12, 0.04, s * 0.64, 0.86, 0.0, 0xb01010, 0.2, 0, 0.35));
    p.push(at(0.08, 0.1, 0.18, s * 0.98, 1.06, 3.3, color, 0.35, 0.5));
    wheel(p, s * 0.8, 0.95, 0.33, 0.22);
    wheel(p, s * 0.8, 3.72, 0.33, 0.22);
    if (s > 0) { arch(p, 0.95, 0.33, 1.84); arch(p, 3.72, 0.33, 1.84); }
    lamp(L, 'head', s * 0.62, 0.74, 4.7, 0.5);
    lamp(L, 'tail', s * 0.64, 0.86, -0.04, 0.32);
  }
  p.push(at(0.5, 0.12, 0.02, 0, 0.6, -0.01, 0x1a3a8c, 0.4, 0));
  return { geo: merge(p), lights: L, length: 4.66, height: 1.47, width: 1.8 };
}

function suv(color) {
  const p = [], L = [];
  p.push(profile([[0, 0.45, 0.08], [0, 1.0, 0.15], [0.05, 1.15, 0.12], [3.85, 1.16, 0.3], [4.42, 1.04, 0.3], [4.66, 0.88, 0.15], [4.68, 0.52, 0.1], [4.56, 0.45, 0.06]], 1.9, color, 0.25, 0.55, 0.09));
  p.push(profile([[0.2, 1.14, 0.05], [0.3, 1.66, 0.15], [3.25, 1.7, 0.25], [3.92, 1.15, 0.05]], 1.76, GLASS, 0.06, 0, 0.05));
  p.push(profile([[0.28, 1.64], [3.25, 1.68], [3.2, 1.77], [0.3, 1.75]], 1.72, color, 0.35, 0.5, 0.03));
  for (const u of [0.32, 1.5, 2.45, 3.22]) p.push(at(1.78, 0.5, 0.08, 0, 1.4, u, color, 0.35, 0.5));
  for (const s of [-1, 1]) p.push(at(0.05, 0.05, 2.8, s * 0.72, 1.82, 1.75, 0x222222, 0.5, 0.6));
  p.push(at(1.96, 0.28, 0.25, 0, 0.55, 4.6, 0x2a2a2a, 0.75, 0.1));
  p.push(at(1.96, 0.26, 0.22, 0, 0.55, 0.08, 0x2a2a2a, 0.75, 0.1));
  p.push(at(1.1, 0.26, 0.04, 0, 0.82, 4.68, 0x0c0c0c, 0.4, 0.5));
  p.push(cyl(0.36, 0.24, 0, 0.95, 0.1, 0x151515, 0.9, 0, 'z', 20));
  for (const s of [-1, 1]) {
    p.push(at(0.4, 0.13, 0.05, s * 0.66, 0.9, 4.66, 0xe8eef2, 0.05, 0.5, 0.3));
    p.push(at(0.14, 0.4, 0.04, s * 0.88, 1.0, 0.0, 0xb01010, 0.2, 0, 0.35));
    p.push(at(0.08, 0.12, 0.2, s * 1.03, 1.22, 3.45, 0x1a1a1a, 0.4, 0.3));
    p.push(at(0.1, 0.2, 3.9, s * 0.96, 0.5, 2.35, 0x262626, 0.8, 0.1));
    wheel(p, s * 0.84, 0.95, 0.38, 0.26);
    wheel(p, s * 0.84, 3.75, 0.38, 0.26);
    if (s > 0) { arch(p, 0.95, 0.38, 1.94); arch(p, 3.75, 0.38, 1.94); }
    lamp(L, 'head', s * 0.66, 0.9, 4.72, 0.55);
    lamp(L, 'tail', s * 0.88, 1.05, -0.04, 0.36);
  }
  return { geo: merge(p), lights: L, length: 4.68, height: 1.82, width: 1.9 };
}

function pickup(color) {
  const p = [], L = [];
  p.push(profile([[0, 0.5, 0.06], [0, 1.05, 0.08], [5.0, 1.07, 0.3], [5.25, 0.96, 0.15], [5.36, 0.55, 0.1], [5.25, 0.5, 0.06]], 1.86, color, 0.25, 0.55, 0.08));
  p.push(profile([[2.15, 1.05], [2.2, 1.68], [3.85, 1.7], [4.45, 1.06]], 1.72, GLASS, 0.06, 0, 0.03));
  p.push(profile([[2.18, 1.66], [3.85, 1.68], [3.8, 1.76], [2.2, 1.74]], 1.7, color, 0.35, 0.5, 0.03));
  for (const u of [2.2, 3.1, 3.82]) p.push(at(1.74, 0.6, 0.08, 0, 1.36, u, color, 0.35, 0.5));
  // open bed
  for (const s of [-1, 1]) p.push(at(0.08, 0.3, 2.05, s * 0.9, 1.22, 1.05, color, 0.35, 0.5));
  p.push(at(1.86, 0.3, 0.08, 0, 1.22, 0.04, color, 0.35, 0.5));
  p.push(at(1.7, 0.05, 2.0, 0, 1.08, 1.05, 0x2a2622, 0.9, 0));
  p.push(at(1.9, 0.24, 0.2, 0, 0.6, 5.3, CHROME, 0.25, 0.9));
  p.push(at(1.9, 0.22, 0.2, 0, 0.6, 0.06, CHROME, 0.25, 0.9));
  p.push(at(1.2, 0.3, 0.04, 0, 0.82, 5.37, 0x101010, 0.4, 0.5));
  for (const s of [-1, 1]) {
    p.push(at(0.34, 0.14, 0.05, s * 0.7, 0.86, 5.34, 0xe8eef2, 0.05, 0.5, 0.3));
    p.push(at(0.1, 0.32, 0.04, s * 0.88, 1.0, 0.0, 0xb01010, 0.2, 0, 0.35));
    p.push(at(0.1, 0.14, 0.22, s * 1.0, 1.2, 4.05, CHROME, 0.25, 0.9));
    wheel(p, s * 0.82, 1.0, 0.39, 0.26);
    wheel(p, s * 0.82, 4.25, 0.39, 0.26);
    if (s > 0) { arch(p, 1.0, 0.39, 1.9); arch(p, 4.25, 0.39, 1.9); }
    lamp(L, 'head', s * 0.7, 0.86, 5.4, 0.55);
    lamp(L, 'tail', s * 0.88, 1.0, -0.04, 0.34);
  }
  return { geo: merge(p), lights: L, length: 5.36, height: 1.76, width: 1.86 };
}

function minibus(color) {
  const p = [], L = [];
  p.push(profile([[0, 0.42], [0, 2.1], [0.12, 2.28], [4.35, 2.3], [4.95, 1.62], [5.36, 1.1], [5.42, 0.52], [5.3, 0.42]], 1.98, color, 0.35, 0.4, 0.07));
  p.push(profile([[4.32, 2.24], [4.88, 1.62], [4.97, 1.65], [4.41, 2.27]], 1.86, GLASS, 0.05, 0, 0.02));
  for (const s of [-1, 1]) {
    p.push(at(0.03, 0.52, 3.6, s * 1.0, 1.82, 2.45, GLASS, 0.06, 0));
    p.push(at(0.03, 0.04, 4.6, s * 1.0, 1.25, 2.7, 0x7a7d80, 0.4, 0.6));
    p.push(at(0.36, 0.16, 0.05, s * 0.68, 0.98, 5.4, 0xe8eef2, 0.05, 0.5, 0.3));
    p.push(at(0.14, 0.3, 0.04, s * 0.88, 1.05, 0.0, 0xb01010, 0.2, 0, 0.35));
    p.push(at(0.06, 0.28, 0.12, s * 1.08, 1.8, 4.75, 0x1a1a1a, 0.4, 0.3));
    wheel(p, s * 0.86, 0.95, 0.36, 0.24);
    wheel(p, s * 0.86, 4.35, 0.36, 0.24);
    if (s > 0) { arch(p, 0.95, 0.36, 2.02); arch(p, 4.35, 0.36, 2.02); }
    lamp(L, 'head', s * 0.68, 0.98, 5.45, 0.55);
    lamp(L, 'tail', s * 0.88, 1.05, -0.04, 0.34);
  }
  p.push(at(1.5, 0.95, 0.03, 0, 1.75, -0.01, GLASS, 0.06, 0));
  p.push(at(2.02, 0.26, 0.2, 0, 0.55, 5.36, 0x2a2a2a, 0.7, 0.1));
  p.push(at(2.02, 0.24, 0.2, 0, 0.55, 0.06, 0x2a2a2a, 0.7, 0.1));
  return { geo: merge(p), lights: L, length: 5.42, height: 2.3, width: 1.98 };
}

// ---------- trucks ----------

// Cab-over tractor; u0 is where the back of the cab sits.
function tractor(p, L, u0, color, tall) {
  const c = (pts) => pts.map(([u, y]) => [u + u0, y]);
  p.push(profile(c([[0, 1.15], [0, 3.62], [0.25, 3.9], [1.85, 3.92], [2.12, 3.7], [2.26, 3.1], [2.32, 2.3], [2.36, 1.45], [2.3, 1.15]]), 2.46, color, 0.32, 0.35, 0.08));
  if (tall) p.push(profile(c([[0.1, 3.9], [1.7, 3.9], [1.35, 4.12], [0.2, 4.15]]), 2.3, color, 0.32, 0.35, 0.06));
  // windscreen, side glass, visor
  p.push(profile(c([[2.13, 3.62], [2.26, 3.08], [2.3, 2.58], [2.34, 2.6], [2.3, 3.1], [2.17, 3.64]]), 2.24, GLASS, 0.05, 0, 0.02));
  p.push(at(2.3, 0.08, 0.04, 0, 3.08, u0 + 2.29, 0x111111, 0.4, 0.3));
  p.push(at(2.4, 0.08, 0.35, 0, 3.78, u0 + 2.2, 0x1a1a1a, 0.5, 0.3));
  for (const s of [-1, 1]) {
    p.push(at(0.03, 0.75, 0.95, s * 1.235, 3.0, u0 + 1.55, GLASS, 0.06, 0));
    // mirror on its arm
    p.push(at(0.04, 0.04, 0.5, s * 1.3, 3.15, u0 + 2.28, 0x2a2a2a, 0.4, 0.6));
    p.push(at(0.08, 0.5, 0.2, s * 1.52, 2.95, u0 + 2.5, 0x1a1a1a, 0.4, 0.3));
    // steps, fuel tank, lamps
    p.push(at(0.35, 0.05, 0.5, s * 1.08, 0.95, u0 + 1.65, 0x777a7d, 0.4, 0.7));
    p.push(at(0.35, 0.05, 0.5, s * 1.08, 0.55, u0 + 1.65, 0x777a7d, 0.4, 0.7));
    p.push(at(0.38, 0.22, 0.12, s * 0.92, 1.45, u0 + 2.36, 0xeef2f4, 0.05, 0.5, 0.3));
    p.push(at(0.14, 0.08, 0.1, s * 1.12, 3.95, u0 + 2.0, 0xffa020, 0.3, 0, 0.6));
    lamp(L, 'head', s * 0.92, 1.45, u0 + 2.45, 0.6);
    lamp(L, 'marker', s * 1.12, 3.95, u0 + 2.06, 0.14);
  }
  p.push(cyl(0.32, 1.2, -1.0, 1.05, -(u0 - 0.6), 0xb4b8bb, 0.3, 0.85, 'z', 18));
  p.push(at(2.4, 0.4, 0.3, 0, 0.85, u0 + 2.3, 0x2a2a2a, 0.6, 0.3));
  p.push(at(1.7, 0.75, 0.05, 0, 1.95, u0 + 2.34, 0x1b1d1f, 0.4, 0.5));
  for (let i = 0; i < 6; i++) p.push(at(1.6, 0.03, 0.06, 0, 1.65 + i * 0.11, u0 + 2.35, CHROME, 0.25, 0.9));
  p.push(at(1.2, 0.35, 0.8, 0, 1.2, u0 - 0.6, 0x222222, 0.7, 0.4));
  for (const s of [-1, 1]) {
    wheel(p, s * 0.98, u0 + 1.55, 0.52, 0.32, 0xc8ccce);
    wheel(p, s * 0.82, u0 - 1.4, 0.52, 0.3, 0x8a8e90);
    wheel(p, s * 1.12, u0 - 1.4, 0.52, 0.3, 0x8a8e90);
    wheel(p, s * 0.82, u0 - 2.7, 0.52, 0.3, 0x8a8e90);
    wheel(p, s * 1.12, u0 - 2.7, 0.52, 0.3, 0x8a8e90);
    p.push(at(0.15, 0.3, u0 + 1.5, s * 0.5, 1.0, (u0 + 1.5) / 2 - 0.4, 0x1f1f1f, 0.7, 0.3));
  }
}

function trailerRear(p, L, W, y0) {
  // under-ride guard, lamps, plate, mud flaps
  p.push(at(2.3, 0.14, 0.1, 0, 0.55, 0.05, 0xd83030, 0.5, 0.2));
  for (let i = 0; i < 6; i++) p.push(at(0.19, 0.142, 0.102, -1.0 + i * 0.4, 0.55, 0.05, 0xeeeeee, 0.5, 0.2, 0.25));
  for (const s of [-1, 1]) {
    p.push(at(0.36, 0.15, 0.06, s * 0.98, 1.0, 0.1, 0xb01515, 0.25, 0, 0.35));
    p.push(at(0.12, 0.15, 0.061, s * 0.72, 1.0, 0.1, 0xd88a10, 0.25, 0, 0.3));
    p.push(at(0.6, 0.55, 0.02, s * 0.95, 0.6, 1.0, 0x151515, 0.9, 0));
    lamp(L, 'tail', s * 0.98, 1.0, -0.02, 0.38);
  }
  p.push(at(0.44, 0.22, 0.02, 0, 0.85, 0.08, 0xd8c020, 0.4, 0));
  for (const s of [-1, 1]) {
    wheel(p, s * 0.8, 1.6, 0.5, 0.3, 0x8a8e90);
    wheel(p, s * 1.1, 1.6, 0.5, 0.3, 0x8a8e90);
    wheel(p, s * 0.8, 2.95, 0.5, 0.3, 0x8a8e90);
    wheel(p, s * 1.1, 2.95, 0.5, 0.3, 0x8a8e90);
    wheel(p, s * 0.8, 4.3, 0.5, 0.3, 0x8a8e90);
    wheel(p, s * 1.1, 4.3, 0.5, 0.3, 0x8a8e90);
  }
}

function boxTruck(cab, boxColor) {
  const p = [], L = [];
  const len = 13, W = 2.5, y0 = 1.3, H = 2.75;
  p.push(profile([[0, y0], [0, y0 + H], [len, y0 + H], [len, y0]], W, boxColor, 0.55, 0.15, 0.04));
  for (let u = 0.6; u < len; u += 0.6) for (const s of [-1, 1]) p.push(at(0.03, H - 0.25, 0.06, s * (W / 2 + 0.03), y0 + H / 2, u, 0xc4c3bd, 0.55, 0.2));
  // rear frame, doors, hinges, lock rods
  p.push(at(W + 0.06, 0.12, 0.08, 0, y0 + H - 0.06, -0.03, 0x9a9c9c, 0.4, 0.8));
  p.push(at(W + 0.06, 0.16, 0.1, 0, y0 + 0.02, -0.04, 0x707274, 0.4, 0.8));
  for (const x of [-W / 2, W / 2]) p.push(at(0.1, H, 0.1, x, y0 + H / 2, -0.04, 0x9a9c9c, 0.4, 0.8));
  p.push(at(0.03, H - 0.2, 0.04, 0, y0 + H / 2, -0.03, 0x8d8f8f, 0.4, 0.8));
  for (const x of [-0.85, -0.35, 0.35, 0.85]) p.push(cyl(0.022, H - 0.3, x, y0 + H / 2, 0.07, 0xa8aaa8, 0.35, 0.85, 'y', 8));
  for (const x of [-1.08, 1.08]) for (const y of [0.4, 1.35, 2.3]) p.push(at(0.16, 0.08, 0.04, x, y0 + y, -0.06, 0x7f8182, 0.4, 0.8));
  // conspicuity tape around the rear and along the sides; marker lamps
  for (let i = 0; i < 10; i++) p.push(at(0.25, 0.06, 0.012, -W / 2 + 0.125 + i * 0.25, y0 + 0.16, -0.095, i % 2 ? 0xf2f2f2 : 0xc81e1e, 0.35, 0, 0.25));
  for (let u = 0.25; u < len - 0.3; u += 0.5) for (const s of [-1, 1]) p.push(at(0.012, 0.06, 0.5, s * (W / 2 + 0.035), y0 + 0.18, u, ((u * 2) | 0) % 2 ? 0xf2f2f2 : 0xc81e1e, 0.35, 0, 0.25));
  for (const s of [-1, 1]) {
    p.push(at(0.1, 0.06, 0.04, s * 1.15, y0 + H - 0.1, -0.06, 0xd01010, 0.3, 0, 0.6));
    lamp(L, 'tail', s * 1.15, y0 + H - 0.1, -0.08, 0.14);
    for (let u = 2; u < len; u += 3.5) { p.push(at(0.04, 0.06, 0.1, s * (W / 2 + 0.03), y0 - 0.05, u, 0xffa020, 0.3, 0, 0.6)); lamp(L, 'marker', s * (W / 2 + 0.04), y0 - 0.05, u, 0.1); }
  }
  for (const s of [-1, 1]) p.push(at(0.15, 0.3, len - 0.6, s * 0.5, 1.05, len / 2, 0x1f1f1f, 0.7, 0.3));
  trailerRear(p, L, W, y0);
  tractor(p, L, len + 1.1, cab, true);
  return { geo: merge(p), lights: L, length: len + 3.5, height: y0 + H, width: W };
}

function tanker(cab) {
  const p = [], L = [];
  const len = 11.5;
  const tank = new THREE.CylinderGeometry(1.15, 1.15, len - 1.2, 32, 1, false);
  tank.rotateX(Math.PI / 2); tank.scale(1.08, 0.95, 1); tank.translate(0, 2.45, -len / 2);
  p.push(paint(tank, 0xc9ced2, 0.25, 0.85));
  for (const u of [0.6, len - 0.6]) {
    const cap = new THREE.SphereGeometry(1.15, 24, 12);
    cap.scale(1.08, 0.95, 0.5); cap.translate(0, 2.45, -u);
    p.push(paint(cap, 0xc9ced2, 0.25, 0.85));
  }
  for (let u = 1.5; u < len - 1; u += 2.4) p.push(cyl(1.19, 0.12, 0, 2.45, -u, 0xa9aeb2, 0.35, 0.8, 'z', 32));
  p.push(at(0.6, 0.05, len - 2, 0, 3.58, len / 2, 0x8d9295, 0.5, 0.6));
  for (const s of [-1, 1]) p.push(at(0.03, 0.4, len - 2, s * 0.3, 3.75, len / 2, 0xd9c020, 0.5, 0.3));
  for (let i = 0; i < 9; i++) p.push(at(0.5, 0.03, 0.04, 0, 1.0 + i * 0.28, -0.1 - i * 0.02, 0x9a9ea2, 0.4, 0.7));
  for (const s of [-1, 1]) p.push(at(0.15, 0.3, len - 0.4, s * 0.5, 1.05, len / 2, 0x1f1f1f, 0.7, 0.3));
  for (const s of [-1, 1]) for (let u = 1.5; u < len; u += 3) p.push(at(0.012, 0.06, 0.5, s * 1.24, 1.55, u, 0xc81e1e, 0.35, 0, 0.25));
  trailerRear(p, L, 2.5, 1.3);
  tractor(p, L, len + 1.1, cab, false);
  return { geo: merge(p), lights: L, length: len + 3.5, height: 3.95, width: 2.5 };
}

function flatbed(cab, tarp) {
  const p = [], L = [];
  const len = 12.5;
  p.push(at(2.5, 0.22, len, 0, 1.25, len / 2, 0x3a3836, 0.8, 0.3));
  for (const s of [-1, 1]) for (let u = 0.5; u < len; u += 1.0) p.push(at(0.06, 0.18, 0.06, s * 1.24, 1.2, u, 0x2a2826, 0.6, 0.4));
  // tarp-covered load with tie-down straps
  p.push(profile([[0.4, 1.36], [0.4, 3.4], [0.6, 3.62], [len - 0.8, 3.62], [len - 0.6, 3.4], [len - 0.6, 1.36]], 2.4, tarp, 0.85, 0, 0.12));
  for (let u = 1.2; u < len - 0.6; u += 1.6) p.push(profile([[u, 1.3], [u, 3.7], [u + 0.06, 3.7], [u + 0.06, 1.3]], 2.48, 0x1b1b1b, 0.7, 0, 0.02));
  for (const s of [-1, 1]) p.push(at(0.15, 0.3, len - 0.4, s * 0.5, 1.0, len / 2, 0x1f1f1f, 0.7, 0.3));
  trailerRear(p, L, 2.5, 1.3);
  tractor(p, L, len + 1.1, cab, false);
  return { geo: merge(p), lights: L, length: len + 3.5, height: 3.7, width: 2.5 };
}

// Soft contact + sun shadow: the convex hull of the vehicle's bounding box projected
// along the sun onto the road, drawn as a translucent dark polygon with a feathered rim.
const _pts = [];
function hull(points) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of points) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (let i = points.length - 1; i >= 0; i--) { const p = points[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

class Shadow {
  constructor(material) {
    this.max = 24;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((this.max * 2 + 1) * 3), 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(this.max * 2 + 1), 1));
    const idx = [];
    for (let i = 0; i < this.max; i++) {
      const a = 1 + i, b = 1 + ((i + 1) % this.max), oa = 1 + this.max + i, ob = 1 + this.max + ((i + 1) % this.max);
      idx.push(0, b, a, a, b, ob, a, ob, oa);
    }
    g.setIndex(idx);
    this.geo = g;
    this.mesh = new THREE.Mesh(g, material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
  }
  update(corners, sun, y0) {
    _pts.length = 0;
    const k = 1 / Math.max(sun.y, 0.05);
    for (const c of corners) {
      const t = (c.y - y0) * k;
      _pts.push([c.x - sun.x * t, c.z - sun.z * t]);
    }
    const h = hull(_pts);
    const pos = this.geo.attributes.position.array, al = this.geo.attributes.alpha.array;
    let cx = 0, cz = 0;
    for (const p of h) { cx += p[0]; cz += p[1]; }
    cx /= h.length; cz /= h.length;
    pos[0] = cx; pos[1] = y0; pos[2] = cz; al[0] = 1;
    for (let i = 0; i < this.max; i++) {
      const p = h[Math.min(i, h.length - 1)];
      const dx = p[0] - cx, dz = p[1] - cz, l = Math.hypot(dx, dz) || 1;
      const j = 1 + i, o = 1 + this.max + i;
      pos[j * 3] = p[0] - (dx / l) * 0.15; pos[j * 3 + 1] = y0; pos[j * 3 + 2] = p[1] - (dz / l) * 0.15; al[j] = 1;
      pos[o * 3] = p[0] + (dx / l) * 0.35; pos[o * 3 + 1] = y0; pos[o * 3 + 2] = p[1] + (dz / l) * 0.35; al[o] = 0;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.alpha.needsUpdate = true;
  }
}

export function createShadowMaterial() {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: { uStrength: { value: 0.62 } },
    vertexShader: /* glsl */ `
      in float alpha;
      out float vA;
      void main() { vA = alpha; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uStrength;
      in float vA;
      out vec4 outColor;
      void main() { outColor = vec4(0.0, 0.0, 0.0, uStrength * smoothstep(0.0, 1.0, vA)); }`,
  });
}

// Additive halos for every lamp: headlights, tail lights and amber markers. Only visible
// at night; headlamps and tail lamps fade out when seen from the side or behind.
const GLOW_MAX = 600;
const LAMP = {
  head: { c: [9, 8.2, 7], dir: -1 },
  tail: { c: [5, 0.25, 0.12], dir: 1 },
  marker: { c: [4, 1.6, 0.25], dir: 0 },
};
class Glows {
  constructor() {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(GLOW_MAX * 3);
    this.col = new Float32Array(GLOW_MAX * 3);
    this.dir = new Float32Array(GLOW_MAX * 3);
    this.size = new Float32Array(GLOW_MAX);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('gcolor', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('gdir', new THREE.BufferAttribute(this.dir, 3));
    g.setAttribute('gsize', new THREE.BufferAttribute(this.size, 1));
    g.setDrawRange(0, 0);
    this.geo = g;
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPxPerUnit: { value: 1000 }, uGlow: { value: 0 } },
      vertexShader: /* glsl */ `
        in vec3 gcolor; in vec3 gdir; in float gsize;
        uniform float uPxPerUnit, uGlow;
        out vec3 vC;
        out float vCore;
        void main() {
          vec4 mv = viewMatrix * vec4(position, 1.0);
          float dist = max(-mv.z, 0.1);
          vec3 toCam = normalize(cameraPosition - position);
          float facing = dot(gdir, gdir) > 0.0 ? smoothstep(-0.05, 0.6, dot(toCam, gdir)) : 1.0;
          float px = gsize * uPxPerUnit / dist;
          float ps = clamp(px * 9.0, 3.0, 180.0);
          gl_PointSize = ps;
          vCore = clamp(px / ps, 0.05, 1.0);
          // far lamps shrink below a pixel: keep them as a dimmer minimum-size dot
          float energy = min(1.0, px * 2.0 + 0.3);
          vC = gcolor * facing * uGlow * energy * exp(-dist / 6000.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        in vec3 vC;
        in float vCore;
        out vec4 outColor;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          float core = exp(-pow(r / vCore, 2.0) * 2.0);
          float halo = exp(-r * r * 12.0) * 0.025 + exp(-r * 18.0) * 0.05;
          outColor = vec4(vC * (core + halo) * (1.0 - smoothstep(0.75, 1.0, r)), 1.0);
        }`,
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.n = 0;
    this._v = new THREE.Vector3();
    this._d = new THREE.Vector3();
  }
  begin() { this.n = 0; }
  push(mesh, model, brake) {
    const m = mesh.matrixWorld;
    const fwd = this._d.set(0, 0, -1).transformDirection(m);
    for (const l of model.lights) {
      if (this.n >= GLOW_MAX) return;
      const i = this.n++;
      const L = LAMP[l.kind];
      this._v.copy(l.p).applyMatrix4(m);
      this.pos.set([this._v.x, this._v.y, this._v.z], i * 3);
      const k = l.kind === 'tail' ? 1 + brake * 1.8 : 1;
      this.col.set([L.c[0] * k, L.c[1] * k, L.c[2] * k], i * 3);
      const s = -L.dir;
      this.dir.set([fwd.x * s * (L.dir ? 1 : 0), fwd.y * s * (L.dir ? 1 : 0), fwd.z * s * (L.dir ? 1 : 0)], i * 3);
      this.size[i] = l.size;
    }
  }
  end() {
    const g = this.geo;
    g.setDrawRange(0, this.n);
    for (const k of ['position', 'gcolor', 'gdir', 'gsize']) g.attributes[k].needsUpdate = true;
  }
}

const CABS = [0xb8322a, 0x2c5d8f, 0xe4e2dc, 0x3d6b45, 0xd2731e, 0x8a1c1c];
const BOXES = [0xd9d8d2, 0xc9c6bd, 0x9fb3c4, 0xe6e4dd];
const TARPS = [0x2f5d8a, 0x3f6b3a, 0x7a7466, 0xb0442c];
const CARS = [0xf0f0ee, 0x1c1c1e, 0x9aa0a6, 0x2b4a6a, 0x7a1f1f, 0xc8c2b4, 0x4d5a3c];

// Traffic: a truck we follow, a few vehicles far ahead and occasional oncoming ones.
export class Traffic {
  constructor(scene, propMaterial) {
    this.scene = scene;
    this.material = propMaterial;
    this.shadowMat = createShadowMaterial();
    const r = mulberry(11);
    const pick = (a) => a[Math.floor(r() * a.length)];
    this.models = {
      truck: [
        ...CABS.map((c, i) => boxTruck(c, BOXES[i % BOXES.length])),
        tanker(pick(CABS)), tanker(0xe4e2dc),
        flatbed(pick(CABS), TARPS[0]), flatbed(pick(CABS), TARPS[1]), flatbed(pick(CABS), TARPS[3]),
      ],
      car: [...CARS.map((c, i) => [sedan, suv, pickup, suv, sedan, minibus, pickup][i](c)), minibus(0xe8e6e0), suv(0xf0f0ee)],
    };
    this.list = [];
    this.f = {};
    this.spawnTimer = 6;
    this.rand = mulberry(7);
    this.glows = new Glows();
    scene.add(this.glows.points);
  }
  add(kind, s, lat, speed, dir, model) {
    const set = this.models[kind];
    model ||= set[Math.floor(this.rand() * set.length)];
    const mesh = new THREE.Mesh(model.geo, this.material);
    mesh.frustumCulled = false;
    const shadow = new Shadow(this.shadowMat);
    this.scene.add(mesh, shadow.mesh);
    const v = { kind, model, mesh, shadow, s, lat, speed, dir, base: speed, phase: this.rand() * 10, brake: 0 };
    this.list.push(v);
    return v;
  }
  remove(v) {
    this.scene.remove(v.mesh, v.shadow.mesh);
    v.shadow.geo.dispose();
    this.list.splice(this.list.indexOf(v), 1);
  }
  init(sCam, speed) {
    this.lead = this.add('truck', sCam + 72, LANE, speed, 1, this.models.truck[2]);
    this.add('truck', sCam + 640, LANE, speed * 0.97, 1);
    this.add('car', sCam + 1500, LANE, speed * 1.05, 1);
    this.add('car', sCam + 900, -LANE, speed * 1.1, -1);
  }
  wrap() { for (const v of this.list) v.s -= PERIOD; }
  update(dt, t, sCam, camSpeed, sun, glow) {
    for (const v of [...this.list]) {
      const before = v.speed;
      if (v === this.lead) {
        // keep a relaxed following gap that breathes over time
        const gap = 70 + 14 * Math.sin(t * 0.045 + 1.0) + 6 * Math.sin(t * 0.13);
        const err = v.s - sCam - gap;
        v.speed += (camSpeed - err * 0.04 - v.speed) * Math.min(1, dt * 0.5);
      } else if (v.dir > 0) {
        v.speed = v.base * (1 + 0.03 * Math.sin(t * 0.05 + v.phase));
        if (v.s - sCam > 4000 || v.s - sCam < 150) { this.remove(v); continue; }
      } else if (v.s < sCam - 60) { this.remove(v); continue; }
      const decel = dt > 0 ? (before - v.speed) / dt : 0;
      v.brake += ((decel > 0.12 ? 1 : 0) - v.brake) * Math.min(1, dt * 4);
      v.s += v.speed * v.dir * dt;
      this.place(v, sun);
    }
    const ahead = this.list.filter((v) => v.dir > 0 && v !== this.lead).length;
    if (ahead < 2) this.add(this.rand() < 0.6 ? 'truck' : 'car', sCam + 2200 + this.rand() * 1200, LANE, camSpeed * (0.94 + this.rand() * 0.04), 1);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 14 + this.rand() * 34;
      const kind = this.rand() < 0.45 ? 'truck' : 'car';
      this.add(kind, sCam + 3200, -LANE, 15 + this.rand() * 8, -1);
    }
    this.glows.material.uniforms.uGlow.value = glow;
    if (glow > 0) {
      this.glows.begin();
      for (const v of this.list) this.glows.push(v.mesh, v.model, v.brake);
      this.glows.end();
    } else this.glows.geo.setDrawRange(0, 0);
  }
  setPixelScale(pxPerUnit) { this.glows.material.uniforms.uPxPerUnit.value = pxPerUnit; }
  place(v, sun) {
    const f = frameAt(v.s, this.f);
    const x = f.x + f.rx * v.lat, z = f.z + f.rz * v.lat;
    v.mesh.position.set(x, 0.1, z);
    v.mesh.rotation.y = f.heading + (v.dir < 0 ? Math.PI : 0);
    v.mesh.updateMatrixWorld();
    const m = v.model;
    const corners = [];
    const c = new THREE.Vector3();
    for (const xx of [-m.width / 2, m.width / 2]) for (const yy of [0.2, m.height]) for (const zz of [0.2, -m.length]) {
      c.set(xx, yy, zz).applyMatrix4(v.mesh.matrixWorld);
      corners.push(c.clone());
    }
    v.shadow.update(corners, sun, 0.13);
  }
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
