import { PLATE_HEIGHT } from '../../config.js';
import { WHEEL } from '../layout/dims.js';

// Ladder frame, floor pan, axles, wishbones and coilovers. Mostly hidden once
// the body is on, but it is what the exploded view stands the car on.

const P = PLATE_HEIGHT;

function suspension(b, wheel) {
  const { x: cx, z: cz, r, width } = wheel;
  const hubY = r / P; // plates

  // Axle shaft from the frame out to the hub.
  b.axial('barrel', 4, hubY - 0.9, cz - 0.4, cx - width * 0.4 - 4, 1.8, 0.8, '+x', 'chrome', { r: 0.4 });

  // Upper and lower wishbones.
  for (const [yy, dz] of [
    [hubY + 2, -1.6],
    [hubY + 2, 1.6],
    [hubY - 4, -1.6],
    [hubY - 4, 1.6],
  ]) {
    const hub = cx - width * 0.4;
    const railY = yy > hubY ? 5.5 : 4.8;
    const dx = hub - 6;
    const dy = (yy - railY) * P;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    b.panel(6 + dx / 2 - length / 2, (railY + yy) / 2 - 0.4, cz + dz - 0.2, length, 0.8, 0.4, 'dark', {
      rot: [0, 0, angle],
    });
  }

  // Coilover: damper body inside a gold spring.
  b.axial('ribbed', 8.1, hubY + 2.5, cz - 0.7, 1.4, 12, 1.4, '+y', 'gold', { r: 0.7 });
  b.axial('barrel', 8.1 + 0.3, hubY + 6.2, cz - 0.4, 0.8, 9, 0.8, '+y', 'chrome', { r: 0.4 });
}

export function buildChassis(b) {
  b.in('chassis', () => {
    // Longitudinal rails, two bricks high on the ground clearance line.
    b.mirror(() => {
      for (let z = -26; z < 28; z += 6) {
        b.brick(4, 4, z, 2, Math.min(6, 28 - z), 'dark');
      }
    });

    // Cross members tie the rails together and carry the pedal box, engine, radiators.
    for (const z of [-26, -22, -16, -10, -4, 2, 8, 14, 20, 26]) {
      b.brick(-4, 4, z, 8, 2, 'plastic');
    }

    // Cabin floor pan.
    for (let z = -8; z < 8; z += 4) b.plate(-7, 7, z, 14, 4, 'plastic');

    // Suspension at all four corners.
    b.mirror(() => {
      suspension(b, WHEEL.front);
      suspension(b, WHEEL.rear);
    });
  });
}
