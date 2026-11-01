import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRICK_GAP, EDGE_RADIUS, PLATE_HEIGHT, STUD_HEIGHT, STUD_RADIUS } from '../config.js';
import { wedgePolygon } from './layout/wedgeMath.js';

// Procedural LEGO geometry. Every distinct shape is built once and cached, so
// the several hundred bricks of the ship share a few dozen BufferGeometries.
// All geometry is centred on the brick's bounding box.

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

/** Brick / plate / tile body with softened edges. */
function bodyGeometry(width, height, depth) {
  const radius = Math.min(EDGE_RADIUS, height / 2 - 0.01, width / 2 - 0.01, depth / 2 - 0.01);
  return normalizeGeometry(new RoundedBoxGeometry(width, height, depth, 2, radius));
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

function boxBrick({ w, h, d, studs }) {
  const height = h * PLATE_HEIGHT;
  const parts = [bodyGeometry(w - BRICK_GAP, height - 0.006, d - BRICK_GAP)];
  for (const [i, j] of studs) {
    parts.push(studAt(-w / 2 + i + 0.5, height / 2, -d / 2 + j + 0.5));
  }
  return merge(parts);
}

function grilleTile({ w, h, d }) {
  const height = h * PLATE_HEIGHT;
  const baseHeight = height * 0.55;
  const parts = [
    normalizeGeometry(
      new THREE.BoxGeometry(w - BRICK_GAP, baseHeight, d - BRICK_GAP).translate(
        0,
        -height / 2 + baseHeight / 2,
        0,
      ),
    ),
  ];
  // Slats run across the short side and repeat along the long side.
  const alongZ = d >= w;
  const long = alongZ ? d : w;
  const short = alongZ ? w : d;
  const count = Math.round(long * 3) - 1;
  const slatHeight = height - baseHeight;
  for (let k = 0; k < count; k++) {
    const offset = -long / 2 + ((k + 1) * long) / (count + 1);
    const slat = new THREE.BoxGeometry(
      alongZ ? short - 0.16 : 0.13,
      slatHeight,
      alongZ ? 0.13 : short - 0.16,
    ).translate(alongZ ? 0 : offset, height / 2 - slatHeight / 2 - 0.003, alongZ ? offset : 0);
    parts.push(normalizeGeometry(slat));
  }
  // Solid rim at both ends, like the real part.
  for (const end of [-1, 1]) {
    const rim = new THREE.BoxGeometry(
      alongZ ? short - BRICK_GAP : 0.1,
      slatHeight,
      alongZ ? 0.1 : short - BRICK_GAP,
    ).translate(
      alongZ ? 0 : end * (long / 2 - 0.05 - BRICK_GAP / 2),
      height / 2 - slatHeight / 2 - 0.003,
      alongZ ? end * (long / 2 - 0.05 - BRICK_GAP / 2) : 0,
    );
    parts.push(normalizeGeometry(rim));
  }
  return merge(parts);
}

/** Slope brick, full height at -z and descending to a thin lip at +z. */
function slopeBrick({ w, h, d }) {
  const height = h * PLATE_HEIGHT;
  const depth = d - BRICK_GAP;
  const lip = Math.min(0.16, height * 0.3);
  const ridge = 0.14;
  const profile = [
    [-depth / 2, -height / 2],
    [depth / 2, -height / 2],
    [depth / 2, -height / 2 + lip],
    [-depth / 2 + ridge, height / 2],
    [-depth / 2, height / 2],
  ];
  return prismGeometry(profile, w - BRICK_GAP, (z, y, x) => [x, y, z]);
}

function wedgePlate(spec) {
  const { w, h, d, studs } = spec;
  const height = h * PLATE_HEIGHT;
  const sx = (w - BRICK_GAP) / w;
  const sz = (d - BRICK_GAP) / d;
  const outline = wedgePolygon(spec).map(([x, z]) => [x * sx, z * sz]);
  const parts = [prismGeometry(outline, height - 0.006, (x, z, y) => [x, y, z])];
  for (const [i, j] of studs) {
    parts.push(studAt(-w / 2 + i + 0.5, height / 2, -d / 2 + j + 0.5));
  }
  return merge(parts);
}

/** Upright cylinder (round plates, antennas, the pilot's head). */
function cylinderPiece({ r, length, stud }) {
  const segments = r < 0.2 ? 10 : 24;
  const parts = [normalizeGeometry(new THREE.CylinderGeometry(r, r, length - 0.006, segments))];
  if (stud) parts.push(studAt(0, length / 2, 0));
  return merge(parts);
}

// --- Axial pieces: modelled along +Y, laid along Z by the brick's rotation. ---

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
  return normalizeGeometry(new THREE.LatheGeometry(profile, r < 0.25 ? 12 : 28));
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
  return normalizeGeometry(new THREE.CylinderGeometry(Math.max(r2, 0.01), r, len, 24));
}

/** Hollow bell (exhaust nozzle / intake): open toward +Y, closed at the base. */
function nozzlePiece({ r, length }) {
  const len = length - BRICK_GAP;
  const throat = r * 0.8;
  const wall = Math.max(0.06, r * 0.1);
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
  return normalizeGeometry(new THREE.LatheGeometry(profile, 32));
}

function corePiece({ r, length }) {
  return normalizeGeometry(new THREE.CylinderGeometry(r * 0.9, r, length, 24));
}

const BUILDERS = {
  box: boxBrick,
  grille: grilleTile,
  slope: slopeBrick,
  wedge: wedgePlate,
  cylinder: cylinderPiece,
  barrel: barrelPiece,
  ribbed: ribbedPiece,
  cone: conePiece,
  nozzle: nozzlePiece,
  core: corePiece,
};

/** Shared geometry for a descriptor produced by spaceshipLayout.js. */
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
