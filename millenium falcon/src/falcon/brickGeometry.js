import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRICK_GAP, EDGE_RADIUS, PLATE_HEIGHT, STUD_HEIGHT, STUD_RADIUS } from '../config.js';
import { pl } from './layout/dims.js';

// Procedural LEGO geometry. Every distinct shape is built once and cached, so
// the several thousand pieces of the ship share a few hundred BufferGeometries.
// All geometry is centred on the piece's bounding box.

const cache = new Map();
let studTemplate = null;

/** Strip a geometry down to non-indexed position + normal so parts can be merged. */
function normalizeGeometry(geometry) {
  let result = geometry;
  if (geometry.index) {
    result = geometry.toNonIndexed();
    geometry.dispose();
  }
  for (const name of Object.keys(result.attributes)) {
    if (name !== 'position' && name !== 'normal') result.deleteAttribute(name);
  }
  return result;
}

function merge(parts) {
  if (parts.length === 1) return parts[0];
  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  return merged;
}

/** A stud with a slightly chamfered rim, sitting on y = 0. */
function getStudTemplate() {
  if (!studTemplate) {
    const profile = [
      new THREE.Vector2(STUD_RADIUS, -0.02),
      new THREE.Vector2(STUD_RADIUS, STUD_HEIGHT - 0.04),
      new THREE.Vector2(STUD_RADIUS - 0.035, STUD_HEIGHT),
      new THREE.Vector2(0, STUD_HEIGHT),
    ];
    studTemplate = normalizeGeometry(new THREE.LatheGeometry(profile, 12));
  }
  return studTemplate;
}

function studAt(x, y, z) {
  return getStudTemplate().clone().translate(x, y, z);
}

/** Brick / plate / tile body with softened edges. Sizes are in world units. */
function bodyGeometry(width, height, depth, segments = 1) {
  const radius = Math.min(EDGE_RADIUS, height / 2 - 0.005, width / 2 - 0.005, depth / 2 - 0.005);
  return normalizeGeometry(new RoundedBoxGeometry(width, height, depth, segments, Math.max(radius, 0.004)));
}

// --- Brick-like pieces -------------------------------------------------------

function boxBrick({ w, h, d, studs = [] }) {
  const height = h * PLATE_HEIGHT;
  const parts = [bodyGeometry(Math.max(w - BRICK_GAP, 0.05), Math.max(height - 0.006, 0.03), Math.max(d - BRICK_GAP, 0.05))];
  for (const [i, j] of studs) {
    parts.push(studAt(-w / 2 + i + 0.5, height / 2, -d / 2 + j + 0.5));
  }
  return merge(parts);
}

/** Upright cylinder (round plates, posts, the pedals ...). */
function cylinderPiece({ r, length, stud }) {
  const segments = r < 0.2 ? 10 : 28;
  const parts = [normalizeGeometry(new THREE.CylinderGeometry(r, r, length - 0.006, segments))];
  if (stud) parts.push(studAt(0, length / 2, 0));
  return merge(parts);
}

// --- Axial pieces: modelled along +Y, laid along the piece's axis by rotation. ---

function barrelPiece({ r, length }) {
  const len = length - BRICK_GAP;
  const bevel = Math.min(0.05, r * 0.25);
  const profile = [
    new THREE.Vector2(0, -len / 2),
    new THREE.Vector2(r - bevel, -len / 2),
    new THREE.Vector2(r, -len / 2 + bevel),
    new THREE.Vector2(r, len / 2 - bevel),
    new THREE.Vector2(r - bevel, len / 2),
    new THREE.Vector2(0, len / 2),
  ];
  return normalizeGeometry(new THREE.LatheGeometry(profile, r < 0.25 ? 12 : 32));
}

/** Collar with radial ribs: repeated geometry around a core cylinder. */
function ribbedPiece({ r, length }) {
  const len = length - BRICK_GAP;
  const core = r * 0.84;
  const parts = [normalizeGeometry(new THREE.CylinderGeometry(core, core, len, 24))];
  const ribs = r > 0.6 ? 12 : 6;
  const ribDepth = r - core;
  for (let k = 0; k < ribs; k++) {
    const angle = (k / ribs) * Math.PI * 2;
    const rib = new THREE.BoxGeometry(ribDepth * 2, len, r * 0.24).translate(core, 0, 0).rotateY(angle);
    parts.push(normalizeGeometry(rib));
  }
  return merge(parts);
}

function conePiece({ r, r2, length }) {
  const len = length - BRICK_GAP;
  return normalizeGeometry(new THREE.CylinderGeometry(Math.max(r2, 0.01), r, len, 28));
}

/** Plain torus lying in the XZ plane (steering wheel rim, lamp bezels). */
function torusPiece({ r, tube }) {
  return normalizeGeometry(new THREE.TorusGeometry(r, tube, 12, 40).rotateX(Math.PI / 2));
}

// --- Hull pieces ---------------------------------------------------------------

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const scratchN = new THREE.Vector3();

/**
 * Collects triangles, orienting each one so its face points along a hint
 * direction. Lets the hull builders emit quads in any winding.
 */
function createMesher() {
  const positions = [];
  const normals = [];
  return {
    /** Add a triangle. `hint` is the outward direction; `n` optional per-vertex normals. */
    tri(a, b, c, hint, n) {
      scratchA.subVectors(b, a);
      scratchB.subVectors(c, a);
      scratchN.crossVectors(scratchA, scratchB);
      if (scratchN.lengthSq() < 1e-14) return;
      let verts = [a, b, c];
      let norms = n;
      if (scratchN.dot(hint) < 0) {
        verts = [a, c, b];
        norms = n && [n[0], n[2], n[1]];
      }
      scratchN.normalize();
      for (let k = 0; k < 3; k++) {
        positions.push(verts[k].x, verts[k].y, verts[k].z);
        const nk = norms ? norms[k] : scratchN;
        normals.push(nk.x, nk.y, nk.z);
      }
    },
    quad(a, b, c, d, hint, n) {
      this.tri(a, b, c, hint, n && [n[0], n[1], n[2]]);
      this.tri(a, c, d, hint, n && [n[0], n[2], n[3]]);
    },
    build() {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      return geometry;
    },
  };
}

/**
 * One curved plating sector: an annular slice of the hull cone with a chamfered
 * top edge and a clearance gap all round. The top follows the height profile
 * exactly (smooth analytic normals) so highlights sweep cleanly across the
 * rings; the sides and chamfer are faceted so every panel edge catches light.
 * Sectors next to the docking slot are clipped to the slot wall x = c.
 */
function sectorPiece({ r0, r1, a0, a1, slot, c, t, flip, bevel, profile, anchor }) {
  const g = BRICK_GAP * 0.9;
  const thickness = t * PLATE_HEIGHT - 0.006;
  const height = (r) => pl(r, profile) * PLATE_HEIGHT;
  const slope = (r) => (height(r + 0.01) - height(r - 0.01)) / 0.02;
  const lo = (r) => (slot > 0 ? Math.asin(Math.min(1, c / r)) : a0);
  const hi = (r) => (slot < 0 ? -Math.asin(Math.min(1, c / r)) : a1);

  const nr = Math.max(2, Math.ceil((r1 - r0) / 1.1));
  const rm = (r0 + r1) / 2;
  const na = Math.max(2, Math.ceil(((hi(rm) - lo(rm)) * r1) / 0.7));

  /** Point on the sector at parameters (u radial, v angular), inset e, dropped `drop` below the top. */
  const point = (u, v, e, drop) => {
    const ra = r0 + g + e;
    const rb = r1 - g - e;
    const r = ra + u * (rb - ra);
    const a = lo(r) + (g + e) / r;
    const b = hi(r) - (g + e) / r;
    const az = a + v * (b - a);
    return new THREE.Vector3(r * Math.sin(az), height(r) - drop, r * Math.cos(az));
  };
  const topNormal = (p) => {
    const r = Math.hypot(p.x, p.z) || 1;
    const k = -slope(r);
    return new THREE.Vector3((k * p.x) / r, 1, (k * p.z) / r).normalize();
  };

  const mesh = createMesher();
  const up = new THREE.Vector3(0, 1, 0);
  const down = new THREE.Vector3(0, -1, 0);
  const b = Math.min(bevel, thickness * 0.45);

  // Top and bottom faces.
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < na; j++) {
      const corners = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ].map(([u, v]) => [u / nr, v / na]);
      const top = corners.map(([u, v]) => point(u, v, b, 0));
      mesh.quad(top[0], top[1], top[2], top[3], up, top.map(topNormal));
      const bottom = corners.map(([u, v]) => point(u, v, 0, thickness));
      mesh.quad(bottom[0], bottom[1], bottom[2], bottom[3], down);
    }
  }

  // Walk the boundary of the parameter square once: chamfer + side wall per step.
  const loop = [];
  for (let i = 0; i < nr; i++) loop.push([i / nr, 0]);
  for (let j = 0; j < na; j++) loop.push([1, j / na]);
  for (let i = nr; i > 0; i--) loop.push([i / nr, 1]);
  for (let j = na; j > 0; j--) loop.push([0, j / na]);
  const centre = point(0.5, 0.5, 0, 0);
  for (let k = 0; k < loop.length; k++) {
    const [u0, v0] = loop[k];
    const [u1, v1] = loop[(k + 1) % loop.length];
    const inner0 = point(u0, v0, b, 0);
    const inner1 = point(u1, v1, b, 0);
    const edge0 = point(u0, v0, 0, b);
    const edge1 = point(u1, v1, 0, b);
    const base0 = point(u0, v0, 0, thickness);
    const base1 = point(u1, v1, 0, thickness);
    const outward = new THREE.Vector3((edge0.x + edge1.x) / 2 - centre.x, 0, (edge0.z + edge1.z) / 2 - centre.z).normalize();
    mesh.quad(inner0, inner1, edge1, edge0, outward.clone().add(up));
    mesh.quad(edge0, edge1, base1, base0, outward);
  }

  const geometry = mesh.build();
  if (flip) {
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    for (let i = 0; i < position.count; i++) {
      position.setY(i, -position.getY(i));
      normal.setY(i, -normal.getY(i));
    }
    // Mirroring turns every triangle inside out: swap two corners back.
    for (let i = 0; i < position.count; i += 3) {
      for (const attribute of [position, normal]) {
        const x = attribute.getX(i + 1);
        const y = attribute.getY(i + 1);
        const z = attribute.getZ(i + 1);
        attribute.setXYZ(i + 1, attribute.getX(i + 2), attribute.getY(i + 2), attribute.getZ(i + 2));
        attribute.setXYZ(i + 2, x, y, z);
      }
    }
  }
  geometry.translate(-anchor[0], -anchor[1], -anchor[2]);
  return geometry;
}

/** Gunner's bubble: a hemisphere, open side down, centred on its bounding box. */
function domePiece({ r }) {
  return normalizeGeometry(new THREE.SphereGeometry(r, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, -r / 2, 0));
}

/** Parabolic sensor dish (concave toward +y) with a hub and ribs behind it. */
function dishPiece({ r, depth }) {
  const shell = 0.12;
  const steps = 10;
  const profile = [];
  for (let i = 0; i <= steps; i++) {
    const rho = (i / steps) * r;
    profile.push(new THREE.Vector2(rho, depth * (rho / r) ** 2 - shell));
  }
  profile.push(new THREE.Vector2(r + 0.06, depth));
  for (let i = steps; i >= 0; i--) {
    const rho = (i / steps) * r;
    profile.push(new THREE.Vector2(rho, depth * (rho / r) ** 2));
  }
  const parts = [normalizeGeometry(new THREE.LatheGeometry(profile, 48))];
  parts.push(normalizeGeometry(new THREE.CylinderGeometry(0.55, 0.7, 0.4, 20).translate(0, -shell - 0.2, 0)));
  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2;
    const rib = new THREE.BoxGeometry(0.1, 0.16, r * 0.82)
      .translate(0, 0, r * 0.45)
      .rotateX(-Math.atan((depth * 0.9) / r))
      .translate(0, -shell, 0)
      .rotateY(angle);
    parts.push(normalizeGeometry(rib));
  }
  return merge(parts).translate(0, -(depth - shell - 0.4) / 2, 0);
}

/** Window frames of the cockpit canopy: rings and struts on a cone along +y. */
function canopyFramePiece({ r, r2, length, rings, struts }) {
  const parts = [];
  const radiusAt = (f) => r + (r2 - r) * f;
  for (let i = 0; i < rings; i++) {
    const f = i / (rings - 1);
    const y = -length / 2 + f * length;
    parts.push(normalizeGeometry(new THREE.TorusGeometry(radiusAt(f), 0.075, 8, 40).rotateX(Math.PI / 2).translate(0, y, 0)));
  }
  const yAxis = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  for (let k = 0; k < struts; k++) {
    const angle = (k / struts) * Math.PI * 2;
    const a = new THREE.Vector3(Math.cos(angle) * r, -length / 2, Math.sin(angle) * r);
    const b = new THREE.Vector3(Math.cos(angle) * r2, length / 2, Math.sin(angle) * r2);
    const dir = b.clone().sub(a);
    const len = dir.length();
    quaternion.setFromUnitVectors(yAxis, dir.normalize());
    matrix.compose(a.clone().add(b).multiplyScalar(0.5), quaternion, new THREE.Vector3(1, 1, 1));
    parts.push(normalizeGeometry(new THREE.BoxGeometry(0.11, len, 0.09).applyMatrix4(matrix)));
  }
  return merge(parts);
}

const BUILDERS = {
  box: boxBrick,
  cylinder: cylinderPiece,
  barrel: barrelPiece,
  ribbed: ribbedPiece,
  cone: conePiece,
  torus: torusPiece,
  sector: sectorPiece,
  dome: domePiece,
  dish: dishPiece,
  canopyFrame: canopyFramePiece,
};

/** Shared geometry for a descriptor produced by falconLayout.js. */
export function getBrickGeometry(descriptor) {
  const key = JSON.stringify(descriptor);
  let geometry = cache.get(key);
  if (!geometry) {
    const build = BUILDERS[descriptor.shape];
    if (!build) throw new Error(`No geometry builder for shape "${descriptor.shape}"`);
    geometry = build(descriptor);
    geometry.computeBoundingSphere();
    cache.set(key, geometry);
  }
  return geometry;
}

export function getGeometryCount() {
  return cache.size;
}

export function disposeBrickGeometries() {
  for (const geometry of cache.values()) geometry.dispose();
  cache.clear();
  if (studTemplate) {
    studTemplate.dispose();
    studTemplate = null;
  }
}
