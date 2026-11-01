// Engines: two main nacelles flanking the fuselage (x 3..5, resting on the wing
// roots) and two auxiliary thrusters in the tail. Every round section lies
// along the Z axis and is a separate brick.

export function buildEngines(b) {
  b.in('engineMounts', () => {
    b.mirror(() => {
      // Two square brackets per nacelle; a pylon plate on top of each ties the
      // bracket to the fuselage deck.
      for (const z of [-9, -4]) {
        b.brick(3, 4, z, 2, 1, 'charcoal');
        b.plate(3, 7, z, 2, 1, 'charcoal');
        b.plate(2, 8, z, 3, 1, 'charcoal');
      }
      // Cover plate bridging both pylons over the top of the nacelle.
      b.plate(3, 9, -9, 2, 6, 'charcoal');
    });
  });

  b.in('engines', () => {
    b.mirror(() => {
      const x = 3;
      const y = 4;
      const w = 2;
      const h = 5; // five plates = two studs: the nacelle diameter

      // Front to back: intake with shock cone, red casing, rear casing,
      // ribbed collar, exhaust bell and its glowing core.
      b.axial('nozzle', x, y, -3, w, 2, h, '+z', 'metal', { r: 0.98 });
      b.axial('cone', x, y, -2.5, w, 2.5, h, '+z', 'orange', { r: 0.5, r2: 0.05, nested: true });
      b.axial('barrel', x, y, -6, w, 2, h, '+z', 'red', { r: 0.98 });
      b.axial('barrel', x, y, -7, w, 1, h, '+z', 'yellow', { r: 0.98 });
      b.axial('barrel', x, y, -8, w, 1, h, '+z', 'red', { r: 0.98 });
      b.axial('barrel', x, y, -10, w, 1, h, '+z', 'lightGray', { r: 0.98 });
      b.axial('barrel', x, y, -11, w, 1, h, '+z', 'metal', { r: 0.98 });
      b.axial('ribbed', x, y, -12, w, 1, h, '+z', 'charcoal', { r: 1.0 });
      b.axial('nozzle', x, y, -14, w, 2, h, '-z', 'metal', { r: 0.96 });
      b.axial('core', x, y, -13.5, w, 1, h, '-z', 'glow', { r: 0.62, nested: true });
    });

    // Tail lights on the rear face of the side walls.
    b.mirror(() => b.axial('barrel', 2, 5, -13, 1, 1, 2, '-z', 'orange', { r: 0.3 }));

    // Auxiliary thrusters plugged into the rear face of the internal core.
    b.mirror(() => {
      b.axial('nozzle', 0, 4, -14, 2, 2, 3, '-z', 'metal', { r: 0.58 });
      b.axial('core', 0, 4, -13.5, 2, 1, 3, '-z', 'glow', { r: 0.36, nested: true });
    });
  });
}
