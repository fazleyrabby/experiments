import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRICK_GAP, EDGE_RADIUS, PLATE_HEIGHT, STUD_HEIGHT, STUD_RADIUS } from '../config.js';

// Procedural LEGO geometry. Every distinct shape is built once and cached, so
// the several thousand pieces of the car share a few hundred BufferGeometries.
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
    studTemplate = normalizeGeometry(new THREE.LatheGeometry(profile, 14));
  }
  return studTemplate;
}

function studAt(x, y, z) {
  return getStudTemplate().clone().translate(x, y, z);
}

/** Brick / plate / tile body with softened edges. Sizes are in world units. */
function bodyGeometry(width, height, depth, segments = 2) {
  const radius = Math.min(EDGE_RADIUS, height / 2 - 0.005, width / 2 - 0.005, depth / 2 - 0.005);
  return normalizeGeometry(new RoundedBoxGeometry(width, height, depth, segments, Math.max(radius, 0.004)));
}

/**
 * Extrude a convex polygon into a flat-shaded prism. `map(a, b, t)` places a
 * polygon point (a, b) at extrusion offset t into object space.
 */
function prismGeometry(points, thickness, map) {
  const half = thickness / 2;
  const positions = [];
  const push = (point, t) => positions.push(...map(point[0], point[1], t));

  for (let i = 1; i < points.length - 1; i++) {
    push(points[0], half);
    push(points[i], half);
    push(points[i + 1], half);
    push(points[0], -half);
    push(points[i + 1], -half);
    push(points[i], -half);
  }
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    push(a, half);
    push(a, -half);
    push(b, -half);
    push(a, half);
    push(b, -half);
    push(b, half);
  }

  // Make the winding outward regardless of polygon direction / mapping handedness.
  let volume = 0;
  for (let i = 0; i < positions.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = positions.slice(i, i + 9);
    volume += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  if (volume < 0) {
    for (let i = 0; i < positions.length; i += 9) {
      for (let k = 0; k < 3; k++) {
        const tmp = positions[i + 3 + k];
        positions[i + 3 + k] = positions[i + 6 + k];
        positions[i + 6 + k] = tmp;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
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

/**
 * Constant-thickness skin whose top surface climbs `delta` plates over its
 * length (z). Built as a rounded box sheared along z, so it keeps the same
 * softened edges as every other piece and the highlights flow across seams.
 */
function slabPiece({ w, d, t, delta }) {
  const width = Math.max(w - BRICK_GAP, 0.05);
  const depth = Math.max(d - BRICK_GAP, 0.05);
  const thickness = Math.max(t * PLATE_HEIGHT - 0.006, 0.03);
  const geometry = bodyGeometry(width, thickness, depth, 3);
  const rise = delta * PLATE_HEIGHT;
  const slope = rise / d;
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  for (let i = 0; i < position.count; i++) {
    position.setY(i, position.getY(i) + (position.getZ(i) / d) * rise);
    const ny = normal.getY(i);
    if (ny !== 0) {
      const nz = normal.getZ(i) - slope * ny;
      const length = Math.hypot(normal.getX(i), ny, nz) || 1;
      normal.setXYZ(i, normal.getX(i) / length, ny / length, nz / length);
    }
  }
  position.needsUpdate = true;
  normal.needsUpdate = true;
  return geometry;
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

/** Hollow bell (exhaust tailpipe): open toward +Y, closed at the base. */
function nozzlePiece({ r, length }) {
  const len = length - BRICK_GAP;
  const throat = r * 0.86;
  const wall = Math.max(0.05, r * 0.14);
  const floor = -len / 2 + len * 0.3;
  const profile = [
    new THREE.Vector2(0, -len / 2),
    new THREE.Vector2(throat, -len / 2),
    new THREE.Vector2(throat, -len / 2 + len * 0.18),
    new THREE.Vector2(r, len / 2 - 0.04),
    new THREE.Vector2(r, len / 2),
    new THREE.Vector2(r - wall, len / 2),
    new THREE.Vector2(throat - wall, floor),
    new THREE.Vector2(0, floor),
  ];
  return normalizeGeometry(new THREE.LatheGeometry(profile, 36));
}

/** Plain torus lying in the XZ plane (steering wheel rim, lamp bezels). */
function torusPiece({ r, tube }) {
  return normalizeGeometry(new THREE.TorusGeometry(r, tube, 12, 40).rotateX(Math.PI / 2));
}

// --- Wheel parts: modelled with the wheel axis along +Y. -----------------------

/** Low-profile tyre with a shouldered tread and circumferential grooves. */
function tirePiece({ r, length, rimR }) {
  const hw = length / 2;
  const bead = rimR * 0.97;
  const shoulder = r * 0.965;
  const profile = [
    new THREE.Vector2(bead, -hw * 0.82),
    new THREE.Vector2(bead + (r - bead) * 0.34, -hw * 0.98),
    new THREE.Vector2(r * 0.9, -hw * 0.93),
    new THREE.Vector2(shoulder, -hw * 0.8),
    new THREE.Vector2(r * 0.992, -hw * 0.66),
  ];
  // Tread: flat blocks separated by three narrow grooves.
  const treadStart = -hw * 0.62;
  const treadEnd = hw * 0.62;
  const grooves = [-0.34, 0, 0.34].map((f) => f * hw);
  let cursor = treadStart;
  for (const g of grooves) {
    profile.push(new THREE.Vector2(r, cursor), new THREE.Vector2(r, g - 0.1));
    profile.push(new THREE.Vector2(r - 0.1, g - 0.07), new THREE.Vector2(r - 0.1, g + 0.07));
    cursor = g + 0.1;
  }
  profile.push(new THREE.Vector2(r, cursor), new THREE.Vector2(r, treadEnd));
  profile.push(
    new THREE.Vector2(r * 0.992, hw * 0.66),
    new THREE.Vector2(shoulder, hw * 0.8),
    new THREE.Vector2(r * 0.9, hw * 0.93),
    new THREE.Vector2(bead + (r - bead) * 0.34, hw * 0.98),
    new THREE.Vector2(bead, hw * 0.82),
    new THREE.Vector2(bead * 0.94, hw * 0.4),
    new THREE.Vector2(bead * 0.94, -hw * 0.4),
  );
  return normalizeGeometry(new THREE.LatheGeometry(profile, 72));
}

/**
 * Five-spoke wheel in the style of the Countach's Campagnolo alloys: a deep
 * barrel, five wide tapering spokes with open gaps between them, a stepped hub
 * and five lug nuts. The outboard face points along +Y.
 */
function rimPiece({ r, length }) {
  const hw = length / 2;
  const parts = [];

  // Barrel and flanges.
  const barrel = [
    new THREE.Vector2(r - 0.34, -hw),
    new THREE.Vector2(r - 0.05, -hw),
    new THREE.Vector2(r, -hw + 0.09),
    new THREE.Vector2(r, hw - 0.09),
    new THREE.Vector2(r - 0.05, hw),
    new THREE.Vector2(r - 0.22, hw),
    new THREE.Vector2(r - 0.34, hw - 0.14),
    new THREE.Vector2(r - 0.34, -hw + 0.14),
  ];
  parts.push(normalizeGeometry(new THREE.LatheGeometry(barrel, 64)));

  // Spokes: trapezoid prisms lying in the XZ plane.
  const spokeY = hw - 0.34;
  const hubR = 0.82;
  const outerR = r - 0.3;
  const count = 5;
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2 + Math.PI / 2;
    const dir = [Math.cos(angle), Math.sin(angle)];
    const side = [-dir[1], dir[0]];
    const innerHalf = 0.34;
    const outerHalf = 0.62;
    const pts = [
      [dir[0] * hubR - side[0] * innerHalf, dir[1] * hubR - side[1] * innerHalf],
      [dir[0] * outerR - side[0] * outerHalf, dir[1] * outerR - side[1] * outerHalf],
      [dir[0] * outerR + side[0] * outerHalf, dir[1] * outerR + side[1] * outerHalf],
      [dir[0] * hubR + side[0] * innerHalf, dir[1] * hubR + side[1] * innerHalf],
    ];
    parts.push(prismGeometry(pts, 0.3, (a, b, t) => [a, spokeY + t, b]));
  }

  // Stepped hub, centre cap and lug nuts.
  parts.push(normalizeGeometry(new THREE.CylinderGeometry(1.0, 1.0, 0.38, 36).translate(0, spokeY, 0)));
  parts.push(normalizeGeometry(new THREE.CylinderGeometry(0.46, 0.64, 0.3, 28).translate(0, spokeY + 0.3, 0)));
  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2 + Math.PI / 2 + Math.PI / count;
    parts.push(
      normalizeGeometry(
        new THREE.CylinderGeometry(0.11, 0.11, 0.2, 6).translate(
          Math.cos(angle) * 0.78,
          spokeY + 0.26,
          Math.sin(angle) * 0.78,
        ),
      ),
    );
  }
  return merge(parts);
}

/** Vented brake rotor with a hat. Axis along +Y. */
function rotorPiece({ r, length }) {
  const parts = [
    normalizeGeometry(new THREE.CylinderGeometry(r, r, length * 0.7, 48)),
    normalizeGeometry(new THREE.CylinderGeometry(r * 0.46, r * 0.46, length * 1.5, 24)),
  ];
  const holes = 14;
  for (let k = 0; k < holes; k++) {
    const angle = (k / holes) * Math.PI * 2;
    parts.push(
      normalizeGeometry(
        new THREE.CylinderGeometry(0.07, 0.07, length * 0.72, 8).translate(
          Math.cos(angle) * r * 0.78,
          0,
          Math.sin(angle) * r * 0.78,
        ),
      ),
    );
  }
  return merge(parts);
}

const BUILDERS = {
  box: boxBrick,
  slab: slabPiece,
  cylinder: cylinderPiece,
  barrel: barrelPiece,
  ribbed: ribbedPiece,
  cone: conePiece,
  nozzle: nozzlePiece,
  torus: torusPiece,
  tire: tirePiece,
  rim: rimPiece,
  rotor: rotorPiece,
};

/** Shared geometry for a descriptor produced by carLayout.js. */
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
