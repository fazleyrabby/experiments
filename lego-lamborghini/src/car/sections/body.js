import { createRandom } from '../../utils/random.js';
import {
  BODY_BOTTOM,
  WHEEL,
  columnIndex,
  present,
  surfaceHeight,
} from '../layout/dims.js';
import { packGroups } from '../layout/packer.js';

// The painted body. It is generated from a height field rather than placed by
// hand: for every stud column the top surface height is known (dims.js), the
// outermost 2 plates become a smooth constant-thickness slab (the "skin" you
// see and the chrome reflects in), and everything under it is a hollow shell of
// real bricks. Wheel arches, the cabin and the engine bay are carved out of
// the solid first. Sections and colours are assigned per cell by region.

const MAX_SEGMENT = 8;
const MAX_SLAB_WIDTH = 8;
/** z positions where a cap run must always break (zone boundaries). */
const FORCED_KNOTS = new Set([-13, -9, -8, -2, 8, 10, 22, 26, 31]);

const cellKey = (X, Y, Z) => ((X + 32) * 128 + (Z + 64)) * 64 + Y;

/** Cap (skin) classification of a surface column at cell Z. */
function capClass(X, Z) {
  const m = columnIndex(X);
  const Zc = Z + 0.5;
  const side = X >= 0 ? 'doorLeft' : 'doorRight';

  // Louvered opening in the engine cover (the engine shows through; slats go on top).
  if (m <= 5 && Z >= -28 && Z < -17) return null;

  // Black louvred vent on the rear fender top, behind the door.
  if (m >= 10 && m <= 13 && Z >= -21 && Z < -15) return { sec: 'haunches', col: 'dark', t: 2, id: 'vent' };

  // Closed pop-up headlight pods, on the hood either side of the nose.
  if (m >= 8 && m <= 11 && Z >= 22 && Z < 26) return { sec: 'lights', col: 'dark', t: 2, id: 'lamp' };

  if (Zc >= 8) return { sec: 'hood', col: 'body', t: 2, id: 'hood' };

  if (Zc >= -2) {
    // Windscreen.
    if (m <= 7) return { sec: 'glasshouse', col: 'glass', t: 1, id: 'wind' };
    if (m <= 9) return { sec: 'glasshouse', col: 'dark', t: 1, id: 'pillar' };
    return { sec: side, col: 'body', t: 2, id: 'door' };
  }
  if (Zc >= -8) {
    // Roof.
    if (m <= 1 && Zc >= -7) return { sec: 'roof', col: 'dark', t: 2, id: 'periscope' };
    if (m <= 7) return { sec: 'roof', col: 'body', t: 2, id: 'roof' };
    if (m <= 9) return { sec: 'glasshouse', col: 'dark', t: 1, id: 'rail' };
    return { sec: side, col: 'body', t: 2, id: 'door' };
  }
  if (Zc >= -9) {
    if (m <= 7) return { sec: 'roof', col: 'body', t: 2, id: 'roof' };
    return { sec: 'haunches', col: 'body', t: 2, id: 'haunch' };
  }
  if (Zc >= -13) {
    // Rear window and quarter panels.
    if (m <= 7) return { sec: 'glasshouse', col: 'glass', t: 1, id: 'rear' };
    return { sec: 'haunches', col: 'body', t: 2, id: 'haunch' };
  }
  if (m <= 7) return { sec: 'engineCover', col: 'body', t: 2, id: 'cover' };
  return { sec: 'haunches', col: 'body', t: 2, id: 'haunch' };
}

/** Section and colour of a solid (non-cap) cell. */
function cellLabel(X, Y, Z) {
  const m = columnIndex(X);
  const side = X >= 0 ? 'doorLeft' : 'doorRight';

  if (Z >= 26 && Y < 16) return { sec: 'frontBumper', col: Y < 8 ? 'dark' : 'body' };
  if (Z <= -28) {
    // Tail panel between the haunches, and the lower corners of the rear bumper.
    if (m <= 7) return { sec: 'rearBumper', col: Y < 9 ? 'dark' : 'body' };
    if (Y < 14) return { sec: 'rearBumper', col: Y < 8 ? 'dark' : 'body' };
    // Lamp housings on the haunch ends.
    if (Z <= -32 && m >= 8 && Y >= 21 && Y < 30) return { sec: 'lights', col: 'dark' };
  }

  // NACA duct: a dark wedge cut into the flank behind the door glass.
  if (m >= 13 && Z >= -9 && Z < -3 && Y >= 19 && Y < 27 && Y - 19 < (Z + 9) * 1.4 + 1) {
    return { sec: side, col: 'dark' };
  }

  // Door: outer panel, inner panel and the glass above the belt line.
  if (Z >= -9 && Z < 12 && m >= 8 && Y >= 17) {
    if (Y >= 31 && m <= 9) {
      if (Z >= -8 && Z < 6) return { sec: side, col: 'glass' };
      if (Z >= 6) return { sec: 'glasshouse', col: 'dark' };
      return { sec: 'haunches', col: 'body' };
    }
    return { sec: side, col: 'body' };
  }
  if (Y < 17) return { sec: 'lowerBody', col: Y < 10 ? 'dark' : 'body' };
  if (Z >= 8) return { sec: 'hood', col: 'body' };
  if (Z < -9 && m >= 8) return { sec: 'haunches', col: 'body' };
  if (Z < -9) return { sec: 'engineCover', col: Y >= 24 && Y < 34 ? 'dark' : 'body' };
  return { sec: 'lowerBody', col: 'body' };
}

/** Which cells are carved out of the solid: cabin, engine bay and wheel arches. */
function isVoid(X, Y, Z) {
  const m = columnIndex(X);
  if (Y >= BODY_BOTTOM && Z >= -27 && Z < 10) {
    if (m <= 7) return true;
    if (m === 8 && ((Z < -13 && Z >= -27) || (Z >= -9 && Z < 8 && Y < 36))) return true;
  }
  // Clear lane for the chassis rails and cross members under the whole car.
  if (Y >= BODY_BOTTOM && Y < 7 && m <= 6 && Z >= -27 && Z < 30) return true;
  // Wheel arches: cylinders about the axle, open to the side.
  if (m >= 7 && m <= 14) {
    const yc = (Y + 0.5) * 0.4;
    const zc = Z + 0.5;
    for (const wheel of [WHEEL.front, WHEEL.rear]) {
      const dz = zc - wheel.z;
      const dy = yc - wheel.r;
      if (dz * dz + dy * dy <= wheel.archR * wheel.archR) return true;
    }
  }
  return false;
}

function buildCapSegments() {
  // segments[X] = array of { za, zb, ha, hb, cls }
  const columns = [];
  for (let X = -15; X <= 14; X++) {
    const m = columnIndex(X);
    const segments = [];
    let Z = -32;
    while (Z < 32) {
      if (!present(m, Z)) {
        Z++;
        continue;
      }
      // A run of consecutive present cells.
      let end = Z;
      while (end < 32 && present(m, end)) end++;
      // Split the run into class blocks, then into straight segments.
      let blockStart = Z;
      while (blockStart < end) {
        const cls = capClass(X, blockStart);
        let blockEnd = blockStart + 1;
        while (
          blockEnd < end &&
          !FORCED_KNOTS.has(blockEnd) &&
          sameClass(capClass(X, blockEnd), cls)
        ) {
          blockEnd++;
        }
        if (cls) {
          let start = blockStart;
          while (start < blockEnd) {
            let stop = start + 1;
            const slope = surfaceHeight(m, stop) - surfaceHeight(m, start);
            while (stop < blockEnd && stop - start < MAX_SEGMENT) {
              const next = surfaceHeight(m, stop + 1) - surfaceHeight(m, stop);
              if (Math.abs(next - slope) > 1e-6) break;
              stop++;
            }
            segments.push({
              za: start,
              zb: stop,
              ha: surfaceHeight(m, start),
              hb: surfaceHeight(m, stop),
              cls,
            });
            start = stop;
          }
        }
        blockStart = blockEnd;
      }
      Z = end;
    }
    columns.push({ X, segments });
  }
  return columns;
}

function sameClass(a, b) {
  if (!a || !b) return a === b;
  return a.id === b.id && a.sec === b.sec && a.col === b.col;
}

export function buildBody(b) {
  const random = createRandom(0xb0d1e5);

  // --- 1. Skin slabs, merged across neighbouring columns -----------------------
  const columns = buildCapSegments();
  const open = new Map();
  const flush = (k) => {
    const run = open.get(k);
    open.delete(k);
    const s = run.seg;
    b.in(s.cls.sec, () => b.slab(run.x0, run.w, s.za, s.zb, s.ha, s.hb, s.cls.t, s.cls.col));
  };
  for (const { X, segments } of columns) {
    const seen = new Set();
    for (const s of segments) {
      const k = `${s.za}|${s.zb}|${s.ha.toFixed(4)}|${s.hb.toFixed(4)}|${s.cls.sec}|${s.cls.col}|${s.cls.id}`;
      seen.add(k);
      const run = open.get(k);
      if (run && run.x0 + run.w === X && run.w < MAX_SLAB_WIDTH) {
        run.w++;
      } else {
        if (run) flush(k);
        open.set(k, { x0: X, w: 1, seg: s });
      }
    }
    for (const k of [...open.keys()]) if (!seen.has(k)) flush(k);
  }
  for (const k of [...open.keys()]) flush(k);

  // --- 2. Solid cells under the skin -----------------------------------------
  const fillTop = new Map(); // (X,Z) -> first empty plate under the skin
  const solid = new Set();
  const cells = [];
  for (let X = -15; X <= 14; X++) {
    const m = columnIndex(X);
    for (let Z = -32; Z < 32; Z++) {
      if (!present(m, Z)) continue;
      const cls = capClass(X, Z);
      if (!cls) continue;
      const top = Math.floor(Math.min(surfaceHeight(m, Z), surfaceHeight(m, Z + 1)) - cls.t);
      fillTop.set(cellKey(X, 0, Z), top);
      for (let Y = BODY_BOTTOM; Y < top; Y++) {
        if (isVoid(X, Y, Z)) continue;
        solid.add(cellKey(X, Y, Z));
        cells.push([X, Y, Z]);
      }
    }
  }

  // --- 3. Hollow the shell: keep walls, a skin under the cap, and arch ceilings --
  const has = (X, Y, Z) => solid.has(cellKey(X, Y, Z));
  const groups = new Map();
  for (const [X, Y, Z] of cells) {
    const top = fillTop.get(cellKey(X, 0, Z));
    const wall = !has(X - 1, Y, Z) || !has(X + 1, Y, Z) || !has(X, Y, Z - 1) || !has(X, Y, Z + 1);
    const skin = Y >= top - 3;
    const ceiling = Y > BODY_BOTTOM && !has(X, Y - 1, Z);
    if (!wall && !skin && !ceiling) continue;
    const label = cellLabel(X, Y, Z);
    const key = `${label.sec}|${label.col}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = []));
    group.push({ X, Y, Z });
  }

  packGroups(groups, (spec) => b.add(spec), random);
}
