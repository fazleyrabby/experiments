import { createRandom } from '../../utils/random.js';
import {
  ENGINE_ARC,
  MANDIBLE,
  R,
  PANEL_T,
  RIM_INNER,
  RINGS,
  SLOT_HALF,
  SLOT_Z,
  columnIndex,
  deg,
  hullHeight,
  mandibleOuterX,
} from '../layout/dims.js';
import { packGroups } from '../layout/packer.js';
import { sectorPart } from '../layout/LayoutBuilder.js';

// The saucer. Two layers:
//  1. A grid-brick frame: every stud column inside the rim gets a hollow shell
//     of real plates and bricks whose top steps down with the hull profile,
//     a dark mid deck, and walls wherever the column meets open space. The
//     mandibles are part of the same column field, so nothing ever overlaps.
//  2. Curved hull plating: concentric rings of sector-shaped panels laid over
//     the frame on the cone, mirrored underneath. Some sectors are left open
//     as trenches so the studded frame and the greebles inside show through.

const cellKey = (X, Y, Z) => ((X + 64) * 256 + (Z + 128)) * 128 + (Y + 64);

/** Distance from the hull axis to the farthest corner of cell (X, Z). */
function farRadius(X, Z) {
  const x = Math.max(Math.abs(X), Math.abs(X + 1));
  const z = Math.max(Math.abs(Z), Math.abs(Z + 1));
  return Math.hypot(x, z);
}

/** What occupies stud column (X, Z): 'disc', 'mandible' or null. */
export function columnKind(X, Z) {
  const m = columnIndex(X);
  if (farRadius(X, Z) <= RIM_INNER) return 'disc';
  if (Z < 12 || Z >= MANDIBLE.tipZ) return null;
  // The bridge between the prongs, up to the back of the docking slot.
  if (m < SLOT_HALF) return Z < SLOT_Z ? 'mandible' : null;
  // A prong: the whole cell stays inside the diagonal outer edge.
  return m + 1 <= mandibleOuterX(Z + 0.5) ? 'mandible' : null;
}

/** First empty plate above column (X, Z): the frame stops one panel below the plating. */
export function columnTop(X, Z) {
  const kind = columnKind(X, Z);
  if (kind === 'disc') return Math.floor(hullHeight(farRadius(X, Z)) - PANEL_T);
  if (kind === 'mandible') return MANDIBLE.top - 1;
  return 0;
}

// Open trench sectors, as [ring, sector index] per surface. Sector k of a ring
// is centred on azimuth k * 360 / n (0 = bow, positive toward port).
const TRENCHES = {
  top: [
    [2, 6],
    [2, 18],
    [3, 10],
    [3, 11],
    [3, 13],
    [3, 14],
    [4, 20],
    [1, 6],
    [4, 4],
  ],
  bottom: [
    [2, 6],
    [2, 18],
    [3, 9],
    [3, 15],
    [1, 3],
    [1, 9],
  ],
};

/** Hull markings: [ring, sector] painted dark red (the famous ANH weathered stripes). */
const RED = {
  top: [
    [3, 2],
    [3, 3],
    [2, 22],
    [4, 21],
    [1, 11],
    [2, 9],
  ],
  bottom: [[3, 21]],
};

const has = (list, ring, k) => list.some(([r, s]) => r === ring && s === k);

/** Is the point (x, z) inside the given open trench sector of a surface? */
export function trenchAt(x, z, surface) {
  const r = Math.hypot(x, z);
  const az = Math.atan2(x, z);
  for (const [ring, k] of TRENCHES[surface]) {
    const [r0, r1, n] = RINGS[ring];
    if (r < r0 - 0.3 || r > r1 + 0.3) continue;
    const span = (Math.PI * 2) / n;
    let d = az - k * span;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) <= span / 2) return { ring, k, r0, r1, span, centre: k * span };
  }
  return null;
}

/** All open trench sectors of a surface, for the greeble pass. */
export function trenchSectors(surface) {
  return TRENCHES[surface].map(([ring, k]) => {
    const [r0, r1, n] = RINGS[ring];
    const span = (Math.PI * 2) / n;
    return { ring, k, r0, r1, span, centre: k * span };
  });
}

function buildFrame(b, random) {
  const solid = new Set();
  const cells = [];
  for (let X = -25; X <= 24; X++) {
    for (let Z = -25; Z <= 36; Z++) {
      const kind = columnKind(X, Z);
      if (!kind) continue;
      const top = columnTop(X, Z);
      for (let Y = -top; Y < top; Y++) {
        solid.add(cellKey(X, Y, Z));
        cells.push([X, Y, Z, kind, top]);
      }
    }
  }

  const filled = (X, Y, Z) => solid.has(cellKey(X, Y, Z));
  const groups = new Map();
  for (const [X, Y, Z, kind, top] of cells) {
    const wall = !filled(X - 1, Y, Z) || !filled(X + 1, Y, Z) || !filled(X, Y, Z - 1) || !filled(X, Y, Z + 1);
    const skin = Y >= top - 2 || Y < -top + 2;
    const deck = Y === -1 || Y === 0;
    if (!wall && !skin && !deck) continue;

    let section;
    let color;
    if (kind === 'mandible') {
      section = 'mandibles';
      // A dark service trench runs around every exposed face of the mandibles.
      color = (wall && Y >= -3 && Y < 3) || deck ? 'dark' : 'hull';
    } else if (deck) {
      section = 'frame';
      color = 'dark';
    } else {
      section = Y >= 0 ? 'upperHull' : 'lowerHull';
      const surface = Y >= 0 ? 'top' : 'bottom';
      const exposedTop = Y >= top - 1 || Y < -top + 1;
      if (exposedTop && trenchAt(X + 0.5, Z + 0.5, surface)) color = 'dark';
      else color = 'hull';
    }
    const key = `${section}|${color}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = []));
    group.push({ X, Y, Z });
  }
  packGroups(groups, (spec) => b.add(spec), random, { origin: 0 });
}

function panelColor(random) {
  const roll = random();
  if (roll < 0.62) return 'hull';
  if (roll < 0.9) return 'hullLight';
  return 'hullDark';
}

function buildPlating(b, random) {
  for (const [surface, flip] of [
    ['top', false],
    ['bottom', true],
  ]) {
    b.in(flip ? 'lowerPlating' : 'upperPlating', () => {
      RINGS.forEach(([r0, r1, n], ring) => {
        const span = (Math.PI * 2) / n;
        for (let k = 0; k < n; k++) {
          if (has(TRENCHES[surface], ring, k)) continue;
          const color = has(RED[surface], ring, k) ? 'red' : panelColor(random);
          const extra = { ring, explodeRing: ring };
          const piece = sectorPart({ r0, r1, a0: -span / 2, a1: span / 2, rotY: k * span, flip });
          b.part(piece.geo, piece.pos, piece.rot, piece.size, color, extra);
        }
      });
    });
  }
}

/** The rim band: an upper and lower lip with a recessed dark service trench between. */
function buildRim(b) {
  const segments = 48;
  const span = (Math.PI * 2) / segments;
  b.in('rim', () => {
    for (let j = 0; j < segments; j++) {
      const az = j * span;
      const signed = Math.atan2(Math.sin(az), Math.cos(az));
      if (Math.abs(signed) < deg(42)) continue; // under the mandibles
      if (Math.abs(signed) > deg(180 - ENGINE_ARC)) continue; // engine arc, see buildEngines
      const lip = { r0: RIM_INNER, r1: R, a0: -span / 2, a1: span / 2, rotY: az, profile: [[0, 4]], t: 2.4 };
      for (const flip of [false, true]) {
        const piece = sectorPart({ ...lip, flip });
        b.part(piece.geo, piece.pos, piece.rot, piece.size, j % 6 === 3 ? 'hullLight' : 'hull');
      }
      const band = sectorPart({ r0: RIM_INNER, r1: 23.55, a0: -span / 2, a1: span / 2, rotY: az, profile: [[0, 1.6]], t: 3.2, bevel: 0.02 });
      b.part(band.geo, band.pos, band.rot, band.size, 'dark');
    }

    // Docking rings, port and starboard.
    for (const side of [1, -1]) {
      const rot = [0, 0, -side * (Math.PI / 2)];
      b.part({ shape: 'barrel', r: 1.75, length: 1.6 }, [side * 24.2, 0, 0], rot, [1.6, 3.5, 3.5], 'hull');
      b.part({ shape: 'ribbed', r: 1.45, length: 0.5 }, [side * 25.15, 0, 0], rot, [0.5, 2.9, 2.9], 'dark');
      b.part({ shape: 'barrel', r: 0.95, length: 0.4 }, [side * 25.45, 0, 0], rot, [0.4, 1.9, 1.9], 'hullLight');
      b.part({ shape: 'torus', r: 1.9, tube: 0.13 }, [side * 24.95, 0, 0], [0, 0, Math.PI / 2], [0.3, 4, 4], 'dark');
    }
  });
}

/** Sublight engine arc: a glowing grille between two lips, split by dark vertical slats. */
function buildEngines(b) {
  const segments = 48;
  const span = (Math.PI * 2) / segments;
  b.in('engines', () => {
    for (let j = 0; j < segments; j++) {
      const az = j * span;
      const signed = Math.atan2(Math.sin(az), Math.cos(az));
      if (Math.abs(signed) <= deg(180 - ENGINE_ARC)) continue;
      const lip = { r0: RIM_INNER, r1: R + 0.15, a0: -span / 2, a1: span / 2, rotY: az, profile: [[0, 4]], t: 1.2 };
      for (const flip of [false, true]) {
        const piece = sectorPart({ ...lip, flip });
        b.part(piece.geo, piece.pos, piece.rot, piece.size, 'hull');
      }
      const glow = sectorPart({ r0: 22.9, r1: 23.75, a0: -span / 2, a1: span / 2, rotY: az, profile: [[0, 2.8]], t: 5.6, bevel: 0.02 });
      b.part(glow.geo, glow.pos, glow.rot, glow.size, 'engine');
      // Thin vanes in front of the glow: two per segment, so the arc reads as one bright band.
      for (let k = 0; k < 2; k++) {
        const a = az - span / 2 + ((k + 0.5) * span) / 2;
        const r = 23.95;
        b.box([r * Math.sin(a), 0, r * Math.cos(a)], [0.12, 2.24, 0.4], 'metal', [0, a, 0]);
      }
    }
  });
}

export function buildHull(b) {
  const random = createRandom(0x5a0c3e);
  buildFrame(b, random);
  buildPlating(b, random);
  buildRim(b);
  buildEngines(b);
}

