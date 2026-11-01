import { PLATE_HEIGHT } from '../../config.js';
import { createRandom } from '../../utils/random.js';
import { RIM_INNER, RINGS, deg } from '../layout/dims.js';
import { snap } from '../layout/LayoutBuilder.js';
import { columnKind, columnTop, trenchAt, trenchSectors } from './hull.js';

// Greebles: the small mechanical clutter that makes the Falcon read as the
// Falcon. Machinery piled into the open trenches, small boxes scattered over
// the plating, round exhaust vents, rim-band detailing, landing pads,
// antennas and navigation lights.

const P = PLATE_HEIGHT;
const GREEBLE_COLORS = ['dark', 'dark', 'hull', 'hullLight', 'metal', 'black', 'tan'];

const pick = (random, list) => list[Math.floor(random() * list.length)];

/** Keep-out zones on the dorsal / ventral plating (turret, dish). */
function blocked(r, az, surface) {
  const x = r * Math.sin(az);
  const z = r * Math.cos(az);
  if (r < 6.6) return true;
  if (surface === 'top' && Math.hypot(x - 9.19, z - 9.19) < 4.2) return true; // dish
  return false;
}

const VENTS = {
  top: [
    [12.6, 105],
    [12.6, -105],
    [17.3, 60],
    [17.3, -75],
    [12.6, 15],
    [12.6, -15],
    [8.1, 135],
    [8.1, -135],
  ],
  bottom: [
    [12.6, 45],
    [12.6, -45],
    [17.3, 120],
    [17.3, -120],
  ],
};

function vents(b, surface) {
  const side = surface === 'top' ? 1 : -1;
  for (const [r, a] of VENTS[surface]) {
    const az = deg(a);
    b.onHull({ shape: 'torus', r: 1.0, tube: 0.18 }, r, az, 0.12, [2.4, 0.36, 2.4], 'hullLight', side);
    b.onHull({ shape: 'cylinder', r: 0.95, length: 0.1, stud: false }, r, az, 0.06, [1.9, 0.1, 1.9], 'black', side);
  }
}

/** Little boxes and studs scattered over the closed plating. */
function plateGreebles(b, random, surface) {
  const side = surface === 'top' ? 1 : -1;
  RINGS.forEach(([r0, r1, n], ring) => {
    if (ring === 0) return;
    const span = (Math.PI * 2) / n;
    for (let k = 0; k < n; k++) {
      if (random() > (surface === 'top' ? 0.55 : 0.3)) continue;
      const count = 1 + Math.floor(random() * 3);
      for (let i = 0; i < count; i++) {
        const r = r0 + 0.8 + random() * (r1 - r0 - 1.6);
        const margin = 0.7 / r;
        const az = k * span + (random() - 0.5) * (span - 2 * margin);
        if (blocked(r, az, surface)) continue;
        if (trenchAt(r * Math.sin(az), r * Math.cos(az), surface)) continue;
        if (VENTS[surface].some(([vr, va]) => Math.hypot(vr * Math.sin(deg(va)) - r * Math.sin(az), vr * Math.cos(deg(va)) - r * Math.cos(az)) < 1.8)) continue;
        const roll = random();
        if (roll < 0.25) {
          // A 1x1 round plate.
          b.onHull({ shape: 'cylinder', r: 0.36, length: 0.16, stud: true }, r, az, 0.08, [0.8, 0.3, 0.8], pick(random, ['hull', 'dark', 'hullLight']), side);
        } else {
          const w = 0.5 + Math.floor(random() * 3) * 0.5;
          const d = 0.5 + Math.floor(random() * 3) * 0.5;
          const h = random() < 0.6 ? 0.16 : 0.4;
          b.hullBox(r, az, [w, h, d], pick(random, GREEBLE_COLORS), side);
        }
      }
    }
  });
}

/** Machinery piled into each open trench sector: blocks, pipes and round caps. */
function trenchGreebles(b, random, surface) {
  const side = surface === 'top' ? 1 : -1;
  for (const sector of trenchSectors(surface)) {
    const { r0, r1, span, centre } = sector;
    const area = (r1 - r0) * span * ((r0 + r1) / 2);
    const count = Math.round(area / 2.2);
    for (let i = 0; i < count; i++) {
      const r = r0 + 0.5 + random() * (r1 - r0 - 1);
      const az = centre + (random() - 0.5) * (span - 1.0 / r);
      const x = r * Math.sin(az);
      const z = r * Math.cos(az);
      const X = Math.floor(x);
      const Z = Math.floor(z);
      if (columnKind(X, Z) !== 'disc') continue;
      // Exposed floor: the studded top of the frame (studs are 0.19 tall).
      const floor = columnTop(X, Z) * P + 0.12;
      const roll = random();
      const color = pick(random, GREEBLE_COLORS);
      if (roll < 0.35) {
        const w = 0.6 + random() * 1.4;
        const h = 0.3 + random() * 0.8;
        const d = 0.6 + random() * 1.6;
        b.box([x, side * (floor + h / 2), z], [w, h, d], color, [0, az + (random() < 0.5 ? 0 : Math.PI / 2), 0]);
      } else if (roll < 0.6) {
        // A pipe lying along the radius.
        const len = snap(1.2 + random() * 2.2);
        const pr = snap(0.14 + random() * 0.22);
        b.part({ shape: 'barrel', r: pr, length: len }, [x, side * (floor + pr), z], [Math.PI / 2, az, 0], [2 * pr, 2 * pr, len], pick(random, ['metal', 'dark', 'hull']), {
          order: 'YXZ',
        });
      } else if (roll < 0.8) {
        const cr = 0.3 + random() * 0.5;
        const h = 0.25 + random() * 0.9;
        b.cylinder([x, side * (floor + h / 2), z], cr, h, color);
      } else {
        b.part({ shape: 'ribbed', r: snap(0.45 + random() * 0.3), length: 0.5 }, [x, side * (floor + 0.25), z], [0, 0, 0], [1.4, 0.5, 1.4], pick(random, ['dark', 'metal']));
      }
    }
  }
}

/** Small blocks on the dark rim trench, plus navigation lights on the lip. */
function rimGreebles(b, random) {
  const segments = 96;
  for (let j = 0; j < segments; j++) {
    const az = ((j + random() * 0.6) / segments) * Math.PI * 2;
    const signed = Math.atan2(Math.sin(az), Math.cos(az));
    if (Math.abs(signed) < deg(44) || Math.abs(signed) > deg(126)) continue;
    if (Math.abs(Math.abs(signed) - Math.PI / 2) < deg(5.5)) continue; // docking rings
    if (signed < deg(-47) && signed > deg(-66)) continue; // cockpit tube
    if (random() < 0.3) continue;
    const r = 23.55 + 0.14;
    const h = 0.3 + random() * 0.55;
    const w = 0.4 + random() * 1.1;
    b.box([r * Math.sin(az), (random() - 0.5) * 0.5, r * Math.cos(az)], [w, h, 0.3], pick(random, ['hullLight', 'hull', 'metal', 'dark']), [0, az, 0], {
      explode: 'rim',
    });
  }
  for (const a of [100, -100]) {
    const az = deg(a);
    const r = (RIM_INNER + 24) / 2;
    b.cylinder([r * Math.sin(az), 1.6 + 0.12, r * Math.cos(az)], 0.2, 0.24, a > 0 ? 'glowRed' : 'glowWhite', [0, 0, 0], {
      explode: 'rim',
      beacon: true,
    });
  }
}

function antennas(b) {
  b.onHull({ shape: 'cylinder', r: 0.07, length: 2.6, stud: false }, 8.6, deg(200), 1.3, [0.14, 2.6, 0.14], 'metal', 1);
  b.onHull({ shape: 'cylinder', r: 0.2, length: 0.3, stud: false }, 8.6, deg(200), 0.15, [0.4, 0.3, 0.4], 'dark', 1);
  b.onHull({ shape: 'cylinder', r: 0.06, length: 1.6, stud: false }, 9.4, deg(160), 0.8, [0.12, 1.6, 0.12], 'metal', 1);
  // Beacon on top, aft of the turret.
  b.onHull({ shape: 'cylinder', r: 0.22, length: 0.3, stud: false }, 6.9, deg(180), 0.15, [0.44, 0.3, 0.44], 'glowRed', 1, { beacon: true });
  b.onHull({ shape: 'cylinder', r: 0.22, length: 0.3, stud: false }, 6.9, deg(180), 0.15, [0.44, 0.3, 0.44], 'glowRed', -1, { beacon: true });
}

/** Landing pads and the boarding ramp outline under the hull. */
function underside(b) {
  for (const [r, a] of [
    [15.5, 140],
    [15.5, -140],
    [10.5, 90],
    [10.5, -90],
    [16.5, 0],
  ]) {
    const az = deg(a);
    b.onHull({ shape: 'cylinder', r: 1.0, length: 0.5, stud: false }, r, az, 0.25, [2, 0.5, 2], 'dark', -1);
    b.onHull({ shape: 'cylinder', r: 0.7, length: 0.25, stud: false }, r, az, 0.62, [1.4, 0.25, 1.4], 'metal', -1);
  }
  // Boarding ramp: a hinged rectangle on the starboard aft quarter.
  const az = deg(-115);
  b.hullBox(13.6, az, [3.2, 0.14, 4.4], 'hullDark', -1);
  for (const offset of [-1.75, 1.75]) b.hullBox(13.6, az + offset / 13.6, [0.24, 0.24, 4.4], 'dark', -1);
}

export function buildDetails(b) {
  const random = createRandom(0x9fee1e);
  b.in('details', () => {
    for (const surface of ['top', 'bottom']) {
      vents(b, surface);
      plateGreebles(b, random, surface);
      trenchGreebles(b, random, surface);
    }
    rimGreebles(b, random);
    antennas(b);
    underside(b);
  });
}
