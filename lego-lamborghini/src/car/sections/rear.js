import { TAIL_PANEL_Z } from '../layout/dims.js';
import { tailText } from './text.js';

// Everything on the back of the car that is not body panel: the louvred engine
// bay opening, the rear-fender vents, lamp lenses on the haunch ends, plate,
// lettering and the four tailpipes. Based on the LP400's recessed tail panel.

export function buildRear(b) {
  // Louvre slats across the engine opening (the V12 shows between them).
  b.in('engineCover', () => {
    for (let k = 0; k < 7; k++) {
      const z = -27.4 + k * 1.55;
      const deck = 33.5 + ((z + 29) / 16) * 2.5; // matches the centre line
      b.panel(-6, deck - 1.2, z, 12, 0.9, 1.1, k % 2 ? 'dark' : 'trim', { rot: [-0.32, 0, 0] });
    }
    // Side rails of the opening.
    b.panel(-6.3, 31.4, -28, 0.45, 2.6, 11, 'dark');
    b.panel(5.85, 31.4, -28, 0.45, 2.6, 11, 'dark');
  });

  b.in('haunches', () => {
    // Louvres in the rear-fender vents.
    b.mirror(() => {
      for (let k = 0; k < 5; k++) {
        b.panel(10.1, 36.35, -20.7 + k * 1.15, 3.8, 0.8, 0.45, 'trim', { rot: [-0.35, 0, 0] });
      }
    });
  });

  b.in('lights', () => {
    // Tail-lamp clusters on the haunch ends: reversing light, brake light, indicator.
    b.mirror(() => {
      b.panel(8.2, 22.4, -32.35, 1.1, 5.6, 0.4, 'glowWhite');
      b.panel(9.5, 22.4, -32.35, 2.5, 5.6, 0.4, 'glowRed');
      b.panel(12.2, 22.4, -32.35, 0.8, 5.6, 0.4, 'glowAmber');
      b.panel(8.0, 21.3, -32.2, 5.1, 0.8, 0.3, 'chrome'); // lower bezel
    });
  });

  b.in('rearBumper', () => {
    // Number plate with a black surround.
    b.panel(-3.25, 10.2, TAIL_PANEL_Z - 0.2, 6.5, 3.8, 0.2, 'plastic');
    b.panel(-3, 10.7, TAIL_PANEL_Z - 0.5, 6, 2.8, 0.3, 'chrome');

    // Four exhaust tailpipes.
    for (const x of [-5.4, -2.0, 2.0, 5.4]) {
      b.axial('nozzle', x - 0.9, 3.2, -31.7, 1.8, 4.5, 2.7, '-z', 'chrome', { r: 0.9 });
    }
  });

  b.in('details', () => {
    tailText(b, 'LAMBORGHINI', 0, 26.2, TAIL_PANEL_Z, 0.27, 'trim');
    tailText(b, 'COUNTACH', 0, 17.2, TAIL_PANEL_Z, 0.36, 'trim');
  });
}
