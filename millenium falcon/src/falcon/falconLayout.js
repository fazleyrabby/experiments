import { LAYOUT_SEED, PLATE_HEIGHT, SECTION_ORDER } from '../config.js';
import { createRandom, randomQuaternion, randomUnitVector } from '../utils/random.js';
import { LayoutBuilder } from './layout/LayoutBuilder.js';
import { explodeFor } from './layout/explode.js';
import { buildHull } from './sections/hull.js';
import { buildMandibles } from './sections/mandibles.js';
import { buildCockpit } from './sections/cockpit.js';
import { buildTurrets } from './sections/turrets.js';
import { buildDish } from './sections/dish.js';
import { buildDetails } from './sections/details.js';

// Turns the section descriptions into the final, deterministic list of pieces:
// world-space transforms, geometry descriptors, the scattered start pose, the
// exploded-view pose and the build order. Pure data only, so it can be
// validated without a renderer.

const P = PLATE_HEIGHT;
const isWhole = (v) => Math.abs(v - Math.round(v)) < 1e-9;

/** True for pieces sitting exactly on the stud grid with no rotation (validated for overlaps). */
export function isGridPiece(spec) {
  if (spec.type === 'part' || spec.rot) return false;
  return [spec.x, spec.y, spec.z, spec.w, spec.h, spec.d].every(isWhole);
}

/** Unit cells [X, Y, Z] covered by a grid piece. */
export function occupiedCells(spec) {
  const cells = [];
  for (let X = spec.x; X < spec.x + spec.w; X++) {
    for (let Z = spec.z; Z < spec.z + spec.d; Z++) {
      for (let Y = spec.y; Y < spec.y + spec.h; Y++) cells.push([X, Y, Z]);
    }
  }
  return cells;
}

const cellKey = (X, Y, Z) => `${X},${Y},${Z}`;

/** Studs stay on every plate and brick unless another grid piece sits on top of them. */
function resolveStuds(specs) {
  const covered = new Set();
  for (const spec of specs) {
    if (isGridPiece(spec)) for (const [X, Y, Z] of occupiedCells(spec)) covered.add(cellKey(X, Y, Z));
  }
  for (const spec of specs) {
    if (!isGridPiece(spec) || (spec.type !== 'plate' && spec.type !== 'brick')) continue;
    const studs = [];
    const top = spec.y + spec.h;
    for (let i = 0; i < spec.w; i++) {
      for (let j = 0; j < spec.d; j++) {
        if (!covered.has(cellKey(spec.x + i, top, spec.z + j))) studs.push([i, j]);
      }
    }
    spec.studCells = studs;
  }
}

/** World-space centre and extent of a spec. */
function extentOf(spec) {
  if (spec.type === 'part') return { centre: spec.pos, half: spec.size.map((v) => v / 2) };
  return {
    centre: [spec.x + spec.w / 2, (spec.y + spec.h / 2) * P, spec.z + spec.d / 2],
    half: [spec.w / 2, (spec.h * P) / 2, spec.d / 2],
  };
}

function computeBounds(specs) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const spec of specs) {
    const { centre, half } = extentOf(spec);
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], centre[k] - half[k]);
      max[k] = Math.max(max[k], centre[k] + half[k]);
    }
  }
  return { min, max };
}

/** Geometry descriptor, resting rotation and centre position for a spec. */
function describe(spec) {
  if (spec.type === 'part') {
    return { position: spec.pos, rotation: spec.rot, order: spec.order ?? 'XYZ', geo: spec.geo };
  }
  const { w, h, d } = spec;
  const centre = [spec.x + w / 2, (spec.y + h / 2) * P, spec.z + d / 2];
  const studs = spec.type === 'tile' ? [] : (spec.studCells ?? []);
  return { position: centre, rotation: [0, 0, 0], order: 'XYZ', geo: { shape: 'box', w, h, d, studs } };
}

/** Rough volume in stud-plates: drives the pitch of the brick's click. */
function massOf(spec) {
  if (spec.type === 'part') return Math.max(1, (spec.size[0] * spec.size[1] * spec.size[2]) / P);
  return Math.max(1, spec.w * spec.h * spec.d);
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

let cachedLayout = null;

/** Raw specs straight from the section builders. */
export function generateSpecs() {
  const builder = new LayoutBuilder();
  buildHull(builder);
  buildMandibles(builder);
  buildCockpit(builder);
  buildTurrets(builder);
  buildDish(builder);
  buildDetails(builder);
  resolveStuds(builder.specs);
  return builder.specs;
}

/**
 * The complete ship description. Deterministic: every call returns the same
 * design, start poses and timings.
 */
export function generateFalconLayout() {
  if (cachedLayout) return cachedLayout;

  const specs = generateSpecs();
  const bounds = computeBounds(specs);
  const size = bounds.max.map((v, k) => v - bounds.min[k]);
  // The ship turns about the centre of its saucer, not its bounding box.
  const origin = [0, (bounds.min[1] + bounds.max[1]) / 2, 0];
  let radius = 0;
  for (const spec of specs) {
    const { centre, half } = extentOf(spec);
    radius = Math.max(radius, Math.hypot(Math.abs(centre[0]) + half[0], Math.abs(centre[2]) + half[2]));
  }

  const random = createRandom(LAYOUT_SEED);

  const bricks = specs.map((spec, index) => {
    const { position: world, rotation, order, geo } = describe(spec);
    const position = [world[0] - origin[0], world[1] - origin[1], world[2] - origin[2]];

    // --- Scattered start pose: a loose cloud of bricks drifting around the
    // ship, biased toward the side each piece belongs to so they do not all
    // cross the middle, and spread well above and below the saucer.
    const outward = normalize([position[0], position[1] * 2.2, position[2]]);
    const jitterDir = randomUnitVector(random);
    const direction = normalize([
      outward[0] * 0.75 + jitterDir[0] * 0.75,
      outward[1] * 0.6 + jitterDir[1] * 0.9,
      outward[2] * 0.75 + jitterDir[2] * 0.75,
    ]);
    const distance = radius * (0.7 + 0.7 * Math.sqrt(random()));
    const scatterPosition = [direction[0] * distance, direction[1] * distance * 0.7, direction[2] * distance];
    const scatterQuaternion = randomQuaternion(random);

    const { offset } = explodeFor(spec, world, random);
    const explodedTilt = [(random() - 0.5) * 0.3, (random() - 0.5) * 0.3, (random() - 0.5) * 0.3];

    return {
      id: `${spec.section}-${String(index).padStart(4, '0')}`,
      index,
      section: spec.section,
      type: spec.type,
      color: spec.color,
      level: world[1] / P,
      mass: massOf(spec),
      beacon: Boolean(spec.beacon),
      position,
      rotation,
      order,
      geo,
      grid: spec.type === 'part' ? null : { x: spec.x, y: spec.y, z: spec.z, w: spec.w, h: spec.h, d: spec.d },
      scatterPosition,
      scatterQuaternion,
      explodedOffset: offset,
      explodedTilt,
      // Per-brick timing variation, fixed for the lifetime of the page.
      timingJitter: random(),
      durationJitter: random(),
      floatPhase: random() * Math.PI * 2,
      buildOrder: 0,
    };
  });

  // Build order: section by section. The plating goes on from the middle
  // outward; everything else is built from the mid-plane outward (so both
  // hull halves grow away from the deck) and swept from stern to bow.
  const rank = (brick) => SECTION_ORDER.indexOf(brick.section);
  const radial = (brick) => Math.hypot(brick.position[0], brick.position[2]);
  const key = (brick) => {
    if (brick.section === 'upperPlating' || brick.section === 'lowerPlating' || brick.section === 'rim' || brick.section === 'engines') {
      return radial(brick) * 0.2 + Math.atan2(brick.position[0], -brick.position[2]) * 0.05;
    }
    return Math.round(Math.abs(brick.level));
  };
  const sorted = [...bricks].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    const byKey = key(a) - key(b);
    if (byKey !== 0) return byKey;
    const ka = radial(a) * 0.3 + a.position[2];
    const kb = radial(b) * 0.3 + b.position[2];
    return ka - kb || a.index - b.index;
  });
  sorted.forEach((brick, i) => {
    brick.buildOrder = sorted.length > 1 ? i / (sorted.length - 1) : 0;
  });

  const sections = {};
  for (const brick of bricks) sections[brick.section] = (sections[brick.section] ?? 0) + 1;

  cachedLayout = { bricks, size, radius, origin, sections };
  return cachedLayout;
}
