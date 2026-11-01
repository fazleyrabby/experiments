import { LAYOUT_SEED, PLATE_HEIGHT, SECTION_ORDER } from '../config.js';
import { createRandom, randomQuaternion, randomUnitVector } from '../utils/random.js';
import { LayoutBuilder } from './layout/LayoutBuilder.js';
import { explodeFor } from './layout/explode.js';
import { buildChassis } from './sections/chassis.js';
import { buildWheels } from './sections/wheels.js';
import { buildBody } from './sections/body.js';
import { buildDrivetrain } from './sections/drivetrain.js';
import { buildInterior } from './sections/interior.js';
import { buildFront } from './sections/front.js';
import { buildRear } from './sections/rear.js';
import { buildDetails } from './sections/details.js';

// Turns the section descriptions into the final, deterministic list of pieces:
// world-space transforms, geometry descriptors, the scattered start pose, the
// exploded-view pose and the build order. Pure data only, so it can be
// validated without a renderer.

const AXIS_ROTATION = {
  '+x': [0, 0, -Math.PI / 2],
  '-x': [0, 0, Math.PI / 2],
  '+z': [Math.PI / 2, 0, 0],
  '-z': [-Math.PI / 2, 0, 0],
  '+y': [0, 0, 0],
  '-y': [Math.PI, 0, 0],
};
const AXIAL_TYPES = new Set(['barrel', 'ribbed', 'cone', 'nozzle', 'tire', 'rim', 'rotor']);

const isWhole = (v) => Math.abs(v - Math.round(v)) < 1e-9;

/** True for pieces sitting exactly on the stud grid with no rotation (validated for overlaps). */
export function isGridPiece(spec) {
  if (spec.rot || spec.type === 'slab') return false;
  if (AXIAL_TYPES.has(spec.type) || spec.type === 'torus' || spec.type === 'round') return false;
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

/**
 * Studs stay on every plate and brick unless something sits on top of them:
 * another grid piece, or a smooth skin slab.
 */
function resolveStuds(specs) {
  const covered = new Set();
  for (const spec of specs) {
    if (isGridPiece(spec)) {
      for (const [X, Y, Z] of occupiedCells(spec)) covered.add(cellKey(X, Y, Z));
    } else if (spec.type === 'slab') {
      const x0 = Math.floor(spec.x);
      const x1 = Math.ceil(spec.x + spec.w);
      const z0 = Math.floor(spec.z);
      const z1 = Math.ceil(spec.z + spec.d);
      for (let X = x0; X < x1; X++) {
        for (let Z = z0; Z < z1; Z++) {
          for (let Y = Math.floor(spec.y); Y < Math.ceil(spec.y + spec.h); Y++) covered.add(cellKey(X, Y, Z));
        }
      }
    }
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

function computeBounds(specs) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const s of specs) {
    const lo = [s.x, s.y * PLATE_HEIGHT, s.z];
    const hi = [s.x + s.w, (s.y + s.h) * PLATE_HEIGHT, s.z + s.d];
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], lo[k]);
      max[k] = Math.max(max[k], hi[k]);
    }
  }
  return { min, max };
}

/** Geometry descriptor, resting rotation and centre position for a spec. */
function describe(spec) {
  const { w, h, d } = spec;
  const centre = [spec.x + w / 2, (spec.y + h / 2) * PLATE_HEIGHT, spec.z + d / 2];
  switch (spec.type) {
    case 'plate':
    case 'brick':
      return { position: centre, rotation: spec.rot ?? [0, 0, 0], geo: { shape: 'box', w, h, d, studs: spec.studCells ?? [] } };
    case 'tile':
      return { position: centre, rotation: spec.rot ?? [0, 0, 0], geo: { shape: 'box', w, h, d, studs: [] } };
    case 'slab': {
      const mid = (spec.ha + spec.hb) / 2 - spec.t / 2;
      return {
        position: [centre[0], mid * PLATE_HEIGHT, centre[2]],
        rotation: [0, 0, 0],
        geo: { shape: 'slab', w, d, t: spec.t, delta: spec.hb - spec.ha },
      };
    }
    case 'round':
      return {
        position: centre,
        rotation: spec.rot ?? [0, 0, 0],
        geo: { shape: 'cylinder', r: spec.r ?? Math.min(w, d) / 2 - 0.04, length: h * PLATE_HEIGHT, stud: Boolean(spec.stud) },
      };
    case 'torus':
      return {
        position: centre,
        rotation: spec.rot ?? [0, 0, 0],
        geo: { shape: 'torus', r: spec.r, tube: spec.tube },
      };
    default: {
      if (!AXIAL_TYPES.has(spec.type)) throw new Error(`Unknown piece type "${spec.type}"`);
      const axis = spec.axis ?? '+y';
      const length = axis.endsWith('x') ? w : axis.endsWith('z') ? d : h * PLATE_HEIGHT;
      const defaultRadius = Math.min(axis.endsWith('x') ? d : w, axis.endsWith('y') ? d : h * PLATE_HEIGHT) / 2;
      return {
        position: centre,
        rotation: spec.rot ?? AXIS_ROTATION[axis],
        geo: { shape: spec.type, r: spec.r ?? defaultRadius, r2: spec.r2 ?? 0, rimR: spec.rimR, length },
      };
    }
  }
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function sectionName(section) {
  return section === 'doorLeft' || section === 'doorRight' ? 'door' : section;
}

function sectionRank(section) {
  return SECTION_ORDER.indexOf(sectionName(section));
}

let cachedLayout = null;

/** Raw specs straight from the section builders (grid coordinates). */
export function generateSpecs() {
  const builder = new LayoutBuilder();
  buildChassis(builder);
  buildWheels(builder);
  buildDrivetrain(builder);
  buildInterior(builder);
  buildBody(builder);
  buildFront(builder);
  buildRear(builder);
  buildDetails(builder);
  resolveStuds(builder.specs);
  return builder.specs;
}

/**
 * The complete car description. Deterministic: every call returns the same
 * design, start poses and timings.
 */
export function generateCarLayout() {
  if (cachedLayout) return cachedLayout;

  const specs = generateSpecs();
  const bounds = computeBounds(specs);
  const size = bounds.max.map((v, k) => v - bounds.min[k]);
  // The car is centred on the pivot so it spins about its own middle.
  const origin = [0, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2];
  const bottom = bounds.min[1] - origin[1];
  const floorY = bottom - 0.02;
  const radius = Math.hypot(size[0], size[2]) / 2;

  const random = createRandom(LAYOUT_SEED);

  const bricks = specs.map((spec, index) => {
    const { position: world, rotation, geo } = describe(spec);
    const position = [world[0] - origin[0], world[1] - origin[1], world[2] - origin[2]];

    // --- Scattered start pose: a loose swarm around the car, biased toward the
    // side each piece belongs to so they do not all cross the middle.
    const outward = normalize([position[0], position[1] * 1.5 + 0.6, position[2] * 0.5]);
    const jitterDir = randomUnitVector(random);
    const direction = normalize([
      outward[0] * 0.7 + jitterDir[0] * 0.8,
      outward[1] * 0.5 + jitterDir[1] * 0.8,
      outward[2] * 0.7 + jitterDir[2] * 0.8,
    ]);
    const distance = radius * (0.95 + 0.9 * random());
    const scatterPosition = [
      direction[0] * distance,
      Math.max(direction[1] * distance * 0.8, floorY + 3 + random() * 6),
      direction[2] * distance,
    ];
    const scatterQuaternion = randomQuaternion(random);

    const { offset, spin: rawSpin } = explodeFor(spec, world, random);
    const spin = rawSpin && {
      ...rawSpin,
      pivot: [rawSpin.pivot[0] - origin[0], rawSpin.pivot[1] - origin[1], rawSpin.pivot[2] - origin[2]],
    };
    const explodedTilt = [(random() - 0.5) * 0.3, (random() - 0.5) * 0.3, (random() - 0.5) * 0.3];

    return {
      id: `${spec.section}-${String(index).padStart(4, '0')}`,
      index,
      section: spec.section,
      type: spec.type,
      color: spec.color,
      grid: { x: spec.x, y: spec.y, z: spec.z, w: spec.w, h: spec.h, d: spec.d },
      position,
      rotation,
      geo,
      scatterPosition,
      scatterQuaternion,
      explodedOffset: offset,
      explodedSpin: spin,
      explodedTilt,
      // Per-brick timing variation, fixed for the lifetime of the page.
      timingJitter: random(),
      durationJitter: random(),
      floatPhase: random() * Math.PI * 2,
      order: 0,
    };
  });

  // Build order: section by section, bottom-up, sweeping from the centreline
  // outwards and from tail to nose.
  const sorted = [...bricks].sort((a, b) => {
    const rank = sectionRank(a.section) - sectionRank(b.section);
    if (rank !== 0) return rank;
    if (a.grid.y !== b.grid.y) return a.grid.y - b.grid.y;
    const ka = Math.abs(a.position[0]) * 0.4 + a.position[2];
    const kb = Math.abs(b.position[0]) * 0.4 + b.position[2];
    return ka - kb || a.index - b.index;
  });
  sorted.forEach((brick, rank) => {
    brick.order = sorted.length > 1 ? rank / (sorted.length - 1) : 0;
  });

  const sections = {};
  for (const brick of bricks) sections[brick.section] = (sections[brick.section] ?? 0) + 1;

  cachedLayout = { bricks, size, radius, bottom, floorY, origin, sections };
  return cachedLayout;
}
