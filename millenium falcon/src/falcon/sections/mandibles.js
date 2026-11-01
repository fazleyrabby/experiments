import { PLATE_HEIGHT } from '../../config.js';
import { createRandom } from '../../utils/random.js';
import { MANDIBLE, SLOT_HALF, SLOT_Z, mandibleOuterX } from '../layout/dims.js';
import { packGroups } from '../layout/packer.js';
import { columnKind } from './hull.js';

// The forward mandibles. Their brick frame comes from the hull column field
// (hull.js); this adds the smooth tiled deck on top and underneath, a smooth
// edge skin along each diagonal outer edge (so the stepped bricks read as one
// straight taper), the raised studded equipment strips, the round vents, the
// side-trench greebles and the lights on the tips.

const P = PLATE_HEIGHT;
const TOP = MANDIBLE.top; // plates above the mid-plane

function tileColor(random) {
  const roll = random();
  if (roll < 0.6) return 'hull';
  if (roll < 0.88) return 'hullLight';
  return 'hullDark';
}

function buildDecks(b, random) {
  const cells = new Map([
    ['mandibles|top', []],
    ['mandibles|bottom', []],
  ]);
  for (let X = -12; X <= 11; X++) {
    for (let Z = 12; Z <= MANDIBLE.tipZ; Z++) {
      if (columnKind(X, Z) !== 'mandible') continue;
      cells.get('mandibles|top').push({ X, Y: TOP - 1, Z });
      cells.get('mandibles|bottom').push({ X, Y: -TOP, Z });
    }
  }
  // One layer each, so the packer only emits plates: turn them into smooth tiles.
  packGroups(
    cells,
    (spec) => b.add({ ...spec, type: 'tile', color: tileColor(random) }),
    random,
    { maxWidth: 2, maxLength: 4, origin: 0 },
  );
}

/** A round vent: a light collar around a black recessed disc, on a flat deck. */
function vent(b, x, y, z, side, radius = 1.05) {
  const lift = side * 0.04;
  b.part({ shape: 'torus', r: radius, tube: 0.17 }, [x, y + lift + side * 0.1, z], [0, 0, 0], [2.4, 0.35, 2.4], 'hull', {
    explode: 'mandibles',
  });
  b.cylinder([x, y + lift + side * 0.05, z], radius - 0.05, 0.12, 'black', [0, 0, 0], { explode: 'mandibles' });
}

/** Where each prong's outer edge leaves the rim, and the tip. */
const EDGE_START = 18.6;

function buildEdges(b) {
  const height = MANDIBLE.top * 2 * P + 0.08;
  const z0 = EDGE_START;
  const z1 = MANDIBLE.tipZ;
  const segments = 3;
  for (const s of [1, -1]) {
    const dx = s * (mandibleOuterX(z1) - mandibleOuterX(z0));
    const angle = Math.atan2(dx, z1 - z0);
    const length = Math.hypot(dx, z1 - z0) / segments;
    for (let i = 0; i < segments; i++) {
      const z = z0 + ((i + 0.5) * (z1 - z0)) / segments;
      // Centred a little inboard of the edge line so it hides the brick steps on both sides of it.
      const x = s * (mandibleOuterX(z) - 0.25);
      b.box([x, 0, z], [1.0, height, length], i === 1 ? 'hullLight' : 'hull', [0, angle, 0]);
    }
  }
}

function buildDetails(b, random) {
  const deckY = TOP * P;
  for (const s of [1, -1]) {
    // Round exhaust vents in the deck, top and bottom (two per prong, as on the real ship).
    for (const [x, z] of [
      [6.6, 30],
      [10, 23.6],
    ]) {
      vent(b, s * x, deckY, z, 1);
      vent(b, s * x, -deckY, z, -1);
    }

    // Raised studded equipment strip along the slot edge, with tiles over part of it.
    const x0 = s > 0 ? SLOT_HALF : -SLOT_HALF - 2;
    b.in('mandibles', () => {
      b.plate(x0, TOP, 32, 2, 6, 'hull');
      b.tile(x0, TOP + 1, 33, 2, 2, 'dark');
      // A dark box of machinery inboard of the rear vent, with a red marking.
      const xo = s > 0 ? 5 : -7;
      b.plate(xo, TOP, 24, 2, 3, 'dark');
      b.tile(xo, TOP + 1, 24, 2, 1, 'red');
      b.plate(xo, -TOP - 1, 25, 2, 4, 'dark');
    });

    // Greebles in the side trenches: along the diagonal outer edge and the slot face.
    const edgeAngle = Math.atan2(s * (mandibleOuterX(MANDIBLE.tipZ) - mandibleOuterX(EDGE_START)), MANDIBLE.tipZ - EDGE_START);
    for (let z = EDGE_START + 1; z < MANDIBLE.tipZ - 1; z += 1.25 + random() * 0.9) {
      const tall = 0.35 + random() * 0.7;
      const long = 0.5 + random() * 0.9;
      const color = random() < 0.5 ? 'hullLight' : random() < 0.5 ? 'metal' : 'hull';
      b.box([s * (mandibleOuterX(z) + 0.36), (random() - 0.5) * 0.8, z], [0.24, tall, long], color, [0, edgeAngle, 0], {
        explode: 'mandibles',
      });
    }
    for (let z = SLOT_Z + 0.8; z < MANDIBLE.tipZ - 0.5; z += 1.25 + random() * 0.9) {
      const tall = 0.35 + random() * 0.7;
      const long = 0.5 + random() * 0.9;
      const color = random() < 0.5 ? 'hullLight' : random() < 0.5 ? 'metal' : 'hull';
      b.box([s * (SLOT_HALF - 0.12), (random() - 0.5) * 0.8, z], [0.24, tall, long], color, [0, 0, 0], { explode: 'mandibles' });
    }

    // Lights and a little machinery on the narrow tips.
    const tipZ = MANDIBLE.tipZ + 0.1;
    b.part({ shape: 'barrel', r: 0.32, length: 0.3 }, [s * 4.1, 0.35, tipZ], [Math.PI / 2, 0, 0], [0.64, 0.64, 0.3], 'glowWhite', {
      explode: 'mandibles',
    });
    b.part({ shape: 'barrel', r: 0.22, length: 0.28 }, [s * 5.4, 0.35, tipZ], [Math.PI / 2, 0, 0], [0.44, 0.44, 0.3], 'glowRed', {
      explode: 'mandibles',
    });
    b.box([s * 4.6, -0.6, tipZ + 0.02], [2.2, 0.4, 0.24], 'metal', [0, 0, 0], { explode: 'mandibles' });
  }
}

export function buildMandibles(b) {
  const random = createRandom(0x3a4d1b);
  b.in('mandibles', () => {
    buildDecks(b, random);
    buildEdges(b);
  });
  b.in('details', () => buildDetails(b, random));
}
