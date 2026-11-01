import { PLATE_HEIGHT } from '../../config.js';
import { WHEEL } from '../layout/dims.js';

// Four wheels, each built from separate pieces so the breakdown can peel them
// apart along the axle: tyre, five-spoke alloy, vented rotor and a red caliper.

const P = PLATE_HEIGHT;

function wheel(b, spec) {
  const { x: cx, z: cz, r, width, rimR } = spec;
  const plates = (2 * r) / P;
  const rimWidth = width * 0.9;

  // Tyre: its axis is X, and +x (outboard on the car's left) is the lathe's +Y.
  b.axial('tire', cx - width / 2, 0, cz - r, width, plates, 2 * r, '+x', 'rubber', { r, rimR, part: 'tire' });

  // Alloy rim, face outboard.
  const rimPlates = (2 * rimR) / P;
  b.axial('rim', cx - rimWidth / 2 + 0.05, r / P - rimPlates / 2, cz - rimR, rimWidth, rimPlates, 2 * rimR, '+x', 'chrome', {
    r: rimR,
    part: 'rim',
  });

  // Brake rotor, tucked inboard of the spokes.
  const rotorR = rimR * 0.9;
  const rotorPlates = (2 * rotorR) / P;
  b.axial('rotor', cx - width * 0.36, r / P - rotorPlates / 2, cz - rotorR, 0.5, rotorPlates, 2 * rotorR, '+x', 'dark', {
    r: rotorR,
    part: 'rotor',
  });

  // Caliper: a red block gripping the rotor, visible through the spokes.
  b.panel(cx - width * 0.36 - 0.22, r / P + (rotorR * 0.5) / P - 2, cz - rotorR - 0.1, 0.94, 5.2, 1.7, 'caliper', {
    part: 'caliper',
  });
}

export function buildWheels(b) {
  b.in('wheels', () => {
    b.mirror(() => {
      wheel(b, WHEEL.front);
      wheel(b, WHEEL.rear);
    });
  });
}
