// Central fuselage: keel, hull, structural spine, body walls, dorsal hump and
// the stepped, tapering nose. The fuselage is 6 studs wide (x -3..3) and runs
// from z = -12 (tail) to z = 12, with the nose reaching z = 20.

export function buildFuselage(b) {
  b.in('lowerFuselage', () => {
    // Keel: the lowest, narrowest layer gives the hull a V-shaped cross section.
    b.runZ('plate', -1, 0, -10, 14, 2, 4, 'charcoal');

    // Hull: two staggered rows, locked together by the keel below.
    b.runZ('plate', -2, 1, -12, 16, 2, 4, 'lightGray');
    b.runZ('plate', 0, 1, -12, 16, 2, 4, 'lightGray', { first: 2 });

    // Belly: full fuselage width, the layer the wings butt up against.
    b.runZ('plate', -3, 2, -12, 12, 2, 4, 'charcoal');
    b.runZ('plate', -1, 2, -12, 12, 2, 4, 'charcoal', { first: 2 });
    b.runZ('plate', 1, 2, -12, 12, 2, 4, 'charcoal');

    // Nose keel: a centre plate flanked by two long wedge plates.
    b.plate(-1, 2, 12, 2, 8, 'charcoal');
    b.mirror(() => b.wedge(1, 2, 12, 2, 8, 0, 'charcoal'));
  });

  b.in('structure', () => {
    // Spar plates cross the whole fuselage and reach two studs into each wing,
    // clamping the wing roots to the body.
    for (let z = -12; z < 6; z += 2) b.plate(-5, 3, z, 10, 2, 'charcoal');
    for (let z = 6; z < 12; z += 2) b.plate(-3, 3, z, 6, 2, 'charcoal');

    // Internal core: two staggered rows of bricks hidden inside the body.
    b.runZ('brick', -2, 4, -12, 4, 2, 4, 'metal');
    b.runZ('brick', 0, 4, -12, 4, 2, 4, 'metal', { first: 2 });
  });

  b.in('fuselage', () => {
    // Side walls.
    b.mirror(() => b.runZ('brick', 2, 4, -12, 4, 1, 4, 'red'));

    // Deck: ties the walls to the internal core.
    b.runZ('plate', -3, 7, -12, 4, 2, 4, 'red');
    b.runZ('plate', -1, 7, -12, 4, 2, 4, 'lightGray', { first: 2 });
    b.runZ('plate', 1, 7, -12, 4, 2, 4, 'red');

    // Dorsal hump behind the cockpit, sloping down toward the tail.
    b.runZ('brick', -2, 8, -8, 4, 2, 4, 'red');
    b.runZ('brick', 0, 8, -8, 4, 2, 4, 'red', { first: 2 });
    b.slope(-2, 8, -12, 2, 4, 3, '-z', 'red');
    b.slope(0, 8, -12, 2, 4, 3, '-z', 'red');

    // Dark shoulder tiles either side of the hump (gaps are left for the
    // engine pylons, see engines.js).
    b.mirror(() => {
      b.tile(2, 8, -12, 1, 3, 'charcoal');
      b.tile(2, 8, -8, 1, 4, 'charcoal');
      b.tile(2, 8, -3, 1, 4, 'charcoal');
      b.tile(2, 8, 1, 1, 1, 'charcoal');
      b.slope(2, 8, 2, 1, 2, 2, '+z', 'red'); // shoulder scoop behind the canopy
    });

    // Nose: stacked wedge layers, each two studs shorter than the one below,
    // so the profile steps down toward the tip.
    b.plate(-1, 3, 12, 2, 8, 'lightGray');
    b.mirror(() => b.wedge(1, 3, 12, 2, 8, 0, 'lightGray'));
    const noseLayers = [
      [4, 6],
      [5, 4],
      [6, 2],
    ];
    for (const [y, length] of noseLayers) {
      b.plate(-1, y, 12, 2, length, 'red');
      b.mirror(() => b.wedge(1, y, 12, 2, length, 0, 'red'));
    }

    // Anti-glare spine: a low slope on every nose step.
    b.slope(-1, 4, 18, 2, 2, 1, '+z', 'charcoal');
    b.slope(-1, 5, 16, 2, 2, 1, '+z', 'charcoal');
    b.slope(-1, 6, 14, 2, 2, 1, '+z', 'charcoal');
    b.slope(-1, 7, 12, 2, 2, 1, '+z', 'charcoal');

    // Sensor probe on the nose tip.
    b.axial('barrel', -0.5, 2, 20, 1, 1, 2, '+z', 'metal', { r: 0.36 });
    b.axial('cone', -0.5, 2, 21, 1, 1.5, 2, '+z', 'orange', { r: 0.3, r2: 0.05 });
  });
}
