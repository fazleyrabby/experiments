import { LAYOUT_SEED, PLATE_HEIGHT, SECTION_ORDER, STUD_RADIUS } from '../config.js';
import { createRandom, randomQuaternion, randomUnitVector } from '../utils/random.js';
import { LayoutBuilder } from './layout/LayoutBuilder.js';
import { wedgeDistance, wedgeStudCells } from './layout/wedgeMath.js';
import { buildFuselage } from './sections/fuselage.js';
import { buildCockpit } from './sections/cockpit.js';
import { buildWings } from './sections/wings.js';
import { buildEngines } from './sections/engines.js';
import { buildStabilizers } from './sections/stabilizers.js';
import { buildDetails } from './sections/details.js';

// Turns the hand-designed section descriptions into the final, deterministic
// list of bricks: world-space transforms, geometry descriptors, the scattered
// start pose, the exploded-view pose and the build order.
// Pure data only, so it can be validated without a renderer.

const AXIAL_TYPES = new Set(['barrel', 'ribbed', 'cone', 'nozzle', 'core']);
const SLOPE_TURNS = { '+z': 0, '+x': 1, '-z': 2, '-x': 3 };

/** Extra separation applied per section in the exploded view (world units). */
const EXPLODE_OFFSETS = {
  lowerFuselage: { x: 0, y: 0, z: 0 },
  structure: { x: 0, y: 0, z: 0 },
  fuselage: { x: 0, y: 0.6, z: 0 },
  cockpitSupport: { x: 0, y: 1.4, z: 1.5 },
  canopy: { x: 0, y: 3.4, z: 1.5 },
  wingLeft: { x: 3.2, y: 0, z: 0 },
  wingRight: { x: 3.2, y: 0, z: 0 },
  engineMounts: { x: 1.2, y: 1.0, z: -2.5 },
  engines: { x: 1.2, y: 0.4, z: -5 },
  stabilizers: { x: 2.2, y: 2.6, z: -3 },
  details: { x: 0, y: 2.2, z: 0 },
};
const EXPLODE_SCALE = { x: 1.55, y: 2.3, z: 1.45 };

/** Half-stud resolution cells [X, Y, Z] covered by a spec (used for validation). */
export function occupiedCells(spec) {
  const cells = [];
  const x0 = Math.round(spec.x * 2);
  const x1 = Math.round((spec.x + spec.w) * 2);
  const z0 = Math.round(spec.z * 2);
  const z1 = Math.round((spec.z + spec.d) * 2);
  for (let X = x0; X < x1; X++) {
    for (let Z = z0; Z < z1; Z++) {
      if (spec.type === 'wedge') {
        const inside = wedgeDistance(spec, (X + 0.5) / 2 - spec.x, (Z + 0.5) / 2 - spec.z);
        if (inside < 0) continue;
      }
      for (let Y = spec.y; Y < spec.y + spec.h; Y++) cells.push([X, Y, Z]);
    }
  }
  return cells;
}

function hasStuds(spec) {
  return spec.type === 'plate' || spec.type === 'brick' || spec.type === 'wedge';
}

/**
 * Decide which studs each brick shows. Studs stay on every plate and brick
 * (they are what makes a loose piece read as LEGO in the exploded view) except
 * where the piece above could not physically hide them: under the thin lip of
 * a slope, or straddling the diagonal edge of a wedge plate.
 */
function resolveStuds(specs) {
  const slopeCells = new Set();
  const wedges = [];
  for (const spec of specs) {
    if (spec.type === 'slope') {
      for (const [X, Y, Z] of occupiedCells(spec)) {
        if (Y === spec.y) slopeCells.add(`${X},${Y},${Z}`);
      }
    } else if (spec.type === 'wedge') {
      wedges.push(spec);
    }
  }

  for (const spec of specs) {
    if (!hasStuds(spec)) continue;
    const top = spec.y + spec.h;
    let cells;
    if (spec.type === 'wedge') {
      cells = wedgeStudCells(spec);
    } else {
      cells = [];
      for (let i = 0; i < spec.w; i++) for (let j = 0; j < spec.d; j++) cells.push([i, j]);
    }

    spec.studCells = cells.filter(([i, j]) => {
      const X = Math.round((spec.x + i) * 2);
      const Z = Math.round((spec.z + j) * 2);
      for (let dx = 0; dx < 2; dx++) {
        for (let dz = 0; dz < 2; dz++) {
          if (slopeCells.has(`${X + dx},${top},${Z + dz}`)) return false;
        }
      }
      const cx = spec.x + i + 0.5;
      const cz = spec.z + j + 0.5;
      for (const wedge of wedges) {
        if (wedge === spec || wedge.y !== top) continue;
        if (cx < wedge.x || cx > wedge.x + wedge.w || cz < wedge.z || cz > wedge.z + wedge.d) continue;
        const distance = wedgeDistance(wedge, cx - wedge.x, cz - wedge.z);
        if (Math.abs(distance) < STUD_RADIUS + 0.05) return false;
      }
      return true;
    });
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

/** Geometry descriptor + resting rotation for a spec. */
function describeGeometry(spec) {
  const { w, h, d } = spec;
  switch (spec.type) {
    case 'plate':
    case 'brick':
      return { rotation: [0, 0, 0], geo: { shape: 'box', w, h, d, studs: spec.studCells } };
    case 'tile':
      return { rotation: [0, 0, 0], geo: { shape: 'box', w, h, d, studs: [] } };
    case 'grille':
      return { rotation: [0, 0, 0], geo: { shape: 'grille', w, h, d } };
    case 'slope': {
      // Slope geometry is modelled descending toward +z and turned in place.
      const turns = SLOPE_TURNS[spec.dir];
      const swap = turns % 2 === 1;
      return {
        rotation: [0, (turns * Math.PI) / 2, 0],
        geo: { shape: 'slope', w: swap ? d : w, h, d: swap ? w : d },
      };
    }
    case 'wedge':
      return {
        rotation: [0, 0, 0],
        geo: {
          shape: 'wedge',
          w,
          h,
          d,
          cut: spec.cut,
          side: spec.side,
          lead: spec.lead,
          studs: spec.studCells,
        },
      };
    case 'round':
      return {
        rotation: [0, 0, 0],
        geo: {
          shape: 'cylinder',
          r: spec.r ?? Math.min(w, d) / 2 - 0.04,
          length: h * PLATE_HEIGHT,
          stud: Boolean(spec.stud),
        },
      };
    default: {
      if (!AXIAL_TYPES.has(spec.type)) throw new Error(`Unknown brick type "${spec.type}"`);
      // Axial pieces are modelled along +Y and laid down along Z.
      const defaultRadius = Math.min(w, h * PLATE_HEIGHT) / 2 - 0.02;
      return {
        rotation: [spec.axis === '-z' ? -Math.PI / 2 : Math.PI / 2, 0, 0],
        geo: { shape: spec.type, r: spec.r ?? defaultRadius, r2: spec.r2 ?? 0, length: d },
      };
    }
  }
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function sectionRank(section) {
  // Both wings are built at the same time.
  const name = section === 'wingRight' ? 'wingLeft' : section;
  return SECTION_ORDER.indexOf(name);
}

let cachedLayout = null;

/** Raw specs straight from the section builders (grid coordinates). */
export function generateSpecs() {
  const builder = new LayoutBuilder();
  buildFuselage(builder);
  buildCockpit(builder);
  buildWings(builder);
  buildEngines(builder);
  buildStabilizers(builder);
  buildDetails(builder);
  resolveStuds(builder.specs);
  return builder.specs;
}

/**
 * The complete spaceship description. Deterministic: every call returns the
 * same design, start poses and timings.
 */
export function generateSpaceshipLayout() {
  if (cachedLayout) return cachedLayout;

  const specs = generateSpecs();
  const bounds = computeBounds(specs);
  const size = bounds.max.map((v, k) => v - bounds.min[k]);
  // The ship is centred on the pivot so it spins about its own middle.
  const origin = [0, (bounds.min[1] + bounds.max[1]) / 2, (bounds.min[2] + bounds.max[2]) / 2];
  const bottom = -size[1] / 2;
  const platformY = bottom - 3.4;
  const radius = Math.hypot(size[0], size[2]) / 2;

  const random = createRandom(LAYOUT_SEED);

  const bricks = specs.map((spec, index) => {
    const position = [
      spec.x + spec.w / 2 - origin[0],
      (spec.y + spec.h / 2) * PLATE_HEIGHT - origin[1],
      spec.z + spec.d / 2 - origin[2],
    ];
    const { rotation, geo } = describeGeometry(spec);

    // --- Scattered start pose: a loose cloud around the ship, biased toward
    // the side each brick belongs to so pieces do not all cross the centre.
    const outward = normalize([position[0], position[1] * 2 + 0.4, position[2]]);
    const jitterDir = randomUnitVector(random);
    const direction = normalize([
      outward[0] * 0.6 + jitterDir[0] * 0.85,
      outward[1] * 0.6 + jitterDir[1] * 0.85,
      outward[2] * 0.6 + jitterDir[2] * 0.85,
    ]);
    const distance = radius * (1.15 + 0.95 * random());
    const scatterPosition = [
      direction[0] * distance,
      Math.max(direction[1] * distance * 0.8, platformY + 1.5 + random() * 2),
      direction[2] * distance,
    ];
    const scatterQuaternion = randomQuaternion(random);

    // --- Exploded pose: the design stretched apart layer by layer, anchored
    // at the keel so nothing sinks into the platform.
    const offset = EXPLODE_OFFSETS[spec.section];
    const side = Math.sign(position[0]);
    const lifted = spec.section === 'details' && spec.y < 2 ? 0 : offset.y;
    const outboard = spec.section === 'details' && Math.abs(position[0]) > 5 ? 3.2 : offset.x;
    const explodedPosition = [
      position[0] * EXPLODE_SCALE.x + side * outboard + (random() - 0.5) * 0.5,
      bottom + (position[1] - bottom) * EXPLODE_SCALE.y + lifted + (random() - 0.5) * 0.4,
      position[2] * EXPLODE_SCALE.z + offset.z + (random() - 0.5) * 0.5,
    ];
    const explodedTilt = [(random() - 0.5) * 0.5, (random() - 0.5) * 0.5, (random() - 0.5) * 0.5];

    return {
      id: `${spec.section}-${String(index).padStart(3, '0')}`,
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
      explodedPosition,
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
    const ka = Math.abs(a.position[0]) + a.position[2] * 0.5;
    const kb = Math.abs(b.position[0]) + b.position[2] * 0.5;
    return ka - kb || a.index - b.index;
  });
  sorted.forEach((brick, rank) => {
    brick.order = sorted.length > 1 ? rank / (sorted.length - 1) : 0;
  });

  // Where the soft exhaust halos sit: just behind each glowing engine core.
  const engineGlows = bricks
    .filter((brick) => brick.type === 'core')
    .map((brick) => ({
      position: [brick.position[0], brick.position[1], brick.position[2] - 0.75],
      radius: brick.geo.r,
    }));

  const sections = {};
  for (const brick of bricks) sections[brick.section] = (sections[brick.section] ?? 0) + 1;

  cachedLayout = { bricks, size, radius, bottom, platformY, engineGlows, sections };
  return cachedLayout;
}
