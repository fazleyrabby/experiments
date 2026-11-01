import { deg } from '../layout/dims.js';

// The rectangular-mount sensor dish on the port bow quarter, tilted up and out.

export function buildDish(b) {
  const r = 13;
  const az = deg(45);
  const tilt = 0.85;

  b.in('dish', () => {
    // Mount sunk into the plating, then a vertical mast.
    const base = b.onHull({ shape: 'cylinder', r: 1.0, length: 0.4, stud: false }, r, az, 0.2, [2, 0.4, 2], 'dark', 1);
    const [bx, by, bz] = base.pos;
    const mastLength = 2.3;
    b.cylinder([bx, by + 0.2 + mastLength / 2, bz], 0.32, mastLength, 'metal');
    const top = [bx, by + 0.2 + mastLength, bz];
    b.box(top, [1.6, 0.5, 0.9], 'hull', [0, az, 0]);

    // The dish itself, facing outward and up. Its local +y is the boresight.
    const n = [Math.sin(tilt) * Math.sin(az), Math.cos(tilt), Math.sin(tilt) * Math.cos(az)];
    const along = (d) => [top[0] + n[0] * d, top[1] + n[1] * d, top[2] + n[2] * d];
    const rot = [tilt, az, 0];
    b.part({ shape: 'dish', r: 3.1, depth: 0.75 }, along(0.45), rot, [6.2, 1, 6.2], 'hull', { order: 'YXZ' });
    b.part({ shape: 'barrel', r: 0.13, length: 1.6 }, along(1.3), rot, [0.3, 1.6, 0.3], 'metal', { order: 'YXZ' });
    b.part({ shape: 'cone', r: 0.32, r2: 0.12, length: 0.4 }, along(2.2), rot, [0.6, 0.4, 0.6], 'dark', { order: 'YXZ' });
  });
}
