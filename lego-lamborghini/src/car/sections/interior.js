import { PLATE_HEIGHT } from '../../config.js';

// Cockpit: bucket seats, centre tunnel, dash with gauges, steering wheel,
// shifter and pedals. Tan leather against all that mirror finish so the cabin
// reads through the glass.

const P = PLATE_HEIGHT;

export function buildInterior(b) {
  b.in('interior', () => {
    // Centre tunnel and console.
    b.brick(-2, 8, -8, 4, 13, 'plastic');
    b.plate(-2, 11, -8, 4, 13, 'leather');
    b.tile(-1, 12, -2, 2, 4, 'dark');

    // Gear stick in its gate.
    b.panel(-0.9, 12.4, 0.2, 1.8, 0.4, 3.2, 'chrome');
    b.round(-0.35, 12.8, 0.6, 1, 1, 4.5, 'chrome', { r: 0.14 });
    b.round(-0.45, 17.1, 0.5, 1, 1, 2, 'plastic', { r: 0.3 });

    // Two bucket seats (the car's left is +x).
    b.mirror(() => {
      // Base, bolsters, back and headrest.
      b.brick(2, 8, -4, 3, 4, 'leather');
      b.plate(2, 11, -4, 3, 4, 'leather');
      b.brick(5, 8, -4, 1, 4, 'leather');
      b.brick(2, 8, -5, 3, 1, 'leather');
      b.brick(2, 11, -5, 3, 1, 'leather');
      b.brick(2, 14, -5, 3, 1, 'leather');
      b.plate(2, 17, -5, 3, 1, 'leather');
      b.round(2.5, 18, -5, 2, 1, 5, 'leather', { r: 0.78 });
      // Side bolsters on the backrest.
      b.brick(5, 11, -5, 1, 2, 'leather');

      // Pedals.
      b.panel(2.2, 8.2, 7.2, 0.9, 0.4, 0.8, 'chrome');
      b.panel(3.4, 8.2, 7.2, 0.9, 0.4, 0.8, 'chrome');
      b.panel(4.6, 8.2, 7.2, 0.9, 0.4, 0.8, 'chrome');
    });

    // Dash: a low black wedge across the cabin with a binnacle over the driver.
    b.brick(-7, 8, 5, 14, 3, 'plastic');
    b.plate(-7, 11, 5, 14, 3, 'plastic');
    b.plate(-7, 12, 5.5, 14, 2, 'leather');
    b.brick(1, 12, 6, 5, 2, 'plastic');
    b.tile(1, 15, 6, 5, 2, 'dark');
    // Gauges.
    b.round(1.4, 15.3, 6.1, 2, 2, 0.8, 'chrome', { r: 0.7, rot: [-0.42, 0, 0] });
    b.round(3.9, 15.3, 6.1, 2, 2, 0.8, 'chrome', { r: 0.7, rot: [-0.42, 0, 0] });
    // Centre stack.
    b.panel(-1.3, 12.2, 5.1, 2.6, 2.6, 0.6, 'dark');
    b.panel(-1.1, 12.6, 4.95, 0.8, 0.8, 0.3, 'glowAmber');

    // Steering column and wheel on the driver's (left, +x) side.
    b.axial('barrel', 3.0, 13, 3.2, 1, 2, 3, '-z', 'plastic', { r: 0.28 });
    b.add({
      type: 'torus',
      x: 1.8,
      y: 14.2,
      z: 1.1,
      w: 3.4,
      h: 4.2,
      d: 3.4,
      r: 1.55,
      tube: 0.2,
      rot: [0.62, 0, 0],
      color: 'plastic',
    });
    b.panel(2.35, 15.8, 1.75, 2.3, 0.4, 0.3, 'chrome', { rot: [0.62, 0, 0] });
  });
}
