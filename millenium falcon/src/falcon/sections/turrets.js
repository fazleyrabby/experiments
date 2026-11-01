import { PLATE_HEIGHT } from '../../config.js';
import { hullHeight } from '../layout/dims.js';

// Dorsal and ventral quad laser turrets: a turntable ring sunk into the
// plating, a glass gunner's dome and four forward-facing barrels.

const P = PLATE_HEIGHT;

function turret(b, s) {
  const deck = hullHeight(0) * P; // top of the central plating
  const y = (offset) => s * (deck + offset);
  const flipX = s > 0 ? 0 : Math.PI;

  b.cylinder([0, y(-0.2), 0], 4.5, 0.4, 'hull');
  b.part({ shape: 'ribbed', r: 3.1, length: 0.5 }, [0, y(0.25), 0], [0, 0, 0], [6.2, 0.5, 6.2], 'dark');
  b.cylinder([0, y(0.85), 0], 2.6, 0.7, 'hull');
  b.part({ shape: 'torus', r: 2.6, tube: 0.12 }, [0, y(1.2), 0], [0, 0, 0], [5.4, 0.3, 5.4], 'dark');
  b.part({ shape: 'dome', r: 1.45 }, [0, y(1.2 + 0.725), 0], [flipX, 0, 0], [2.9, 1.45, 2.9], 'glass');
  b.part({ shape: 'torus', r: 1.48, tube: 0.07 }, [0, y(1.25), 0], [0, 0, 0], [3.1, 0.2, 3.1], 'hullLight');

  // Gun housings either side of the dome, two barrels each.
  for (const side of [1, -1]) {
    const x = side * 2.15;
    b.box([x, y(1.55), 0.3], [0.85, 0.85, 2.6], 'dark');
    b.box([x, y(2.05), -0.2], [0.6, 0.2, 1.2], 'hull');
    for (const offset of [-0.22, 0.22]) {
      const bx = x + offset;
      b.part({ shape: 'barrel', r: 0.13, length: 3.8 }, [bx, y(1.55), 3.4], [Math.PI / 2, 0, 0], [0.3, 0.3, 3.8], 'metal');
      b.part({ shape: 'ribbed', r: 0.2, length: 0.5 }, [bx, y(1.55), 5.0], [Math.PI / 2, 0, 0], [0.4, 0.4, 0.5], 'dark');
    }
  }
}

export function buildTurrets(b) {
  b.in('turrets', () => {
    turret(b, 1);
    turret(b, -1);
  });
}
