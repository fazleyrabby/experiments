// Surface plates and decorative details: smooth tiles, grilles, warning
// stripes, weapons and sensors. Everything here sits on top of (or hangs from)
// the structure built by the other sections.

function buildDorsalSpine(b) {
  // Hump top (y = 11): a light stripe down the centre, red tiles either side.
  b.grille(-1, 11, -8, 1, 2);
  b.grille(0, 11, -8, 1, 2);
  b.tile(-1, 11, -6, 2, 4, 'lightGray');
  b.plate(-1, 11, -2, 2, 2, 'charcoal');
  b.tile(-1, 11, 0, 2, 4, 'lightGray');
  b.mirror(() => b.runZ('tile', 1, 11, -8, 4, 1, 4, 'red'));

  // Antenna and beacon on the exposed studs of the dark plate.
  b.round(-1, 12, -2, 1, 1, 1, 'metal', { r: 0.42, stud: true });
  b.round(-1, 13, -2, 1, 1, 5, 'metal', { r: 0.07 });
  b.round(0, 12, -1, 1, 1, 1, 'orange', { r: 0.38 });

  // Yellow markers flanking the front of the canopy.
  b.mirror(() => b.tile(1, 7, 12, 1, 1, 'yellow'));

  // Chin sensor under the nose.
  b.round(-1, 0, 14, 2, 2, 1, 'charcoal', { r: 0.9 });
  b.round(-0.5, -1, 14.5, 1, 1, 1, 'orange', { r: 0.45 });
}

function buildNacelleCover(b) {
  // Dressing on the engine cover plate: vents, an access panel, a fairing.
  b.grille(3, 10, -9, 1, 2);
  b.grille(4, 10, -9, 1, 2);
  b.tile(3, 10, -7, 2, 2, 'red');
  b.slope(3, 10, -5, 2, 2, 1, '+z', 'charcoal');
}

function buildWingSurface(b) {
  // Raised panel (y = 5): vent grilles, smooth red panels, hazard stripe.
  for (let x = 6; x < 10; x++) b.grille(x, 5, -10, 1, 2);
  b.tile(6, 5, -8, 2, 4, 'red');
  b.tile(8, 5, -8, 2, 4, 'red');
  for (let x = 6; x < 10; x++) b.tile(x, 5, -4, 1, 2, x % 2 === 0 ? 'yellow' : 'charcoal');

  // Flap band along the trailing edge.
  b.tile(6, 4, -12, 2, 2, 'charcoal');
  b.tile(8, 4, -12, 2, 2, 'charcoal');
  b.tile(10, 4, -12, 2, 2, 'charcoal');
  b.tile(12, 4, -12, 1, 2, 'yellow');
  b.tile(13, 4, -12, 2, 2, 'charcoal');

  // Outer panel: vents, a red access panel and a yellow marker.
  b.grille(11, 4, -10, 1, 2);
  b.grille(12, 4, -10, 1, 2);
  b.tile(11, 4, -8, 2, 4, 'red');
  b.tile(11, 4, -4, 2, 1, 'yellow');
  b.round(11, 4, -2, 1, 1, 1, 'metal', { r: 0.42, stud: true });

  // Wing-root fairing ahead of the engine intake.
  b.plate(3, 4, 0, 2, 4, 'red');
  b.grille(3, 5, 0, 1, 2);
  b.grille(4, 5, 0, 1, 2);
  b.slope(3, 5, 2, 2, 2, 2, '+z', 'red');

  // Wingtip clamp: access panel, vents, navigation light and a sensor.
  b.tile(13, 5, -10, 2, 2, 'red');
  b.grille(13, 5, -8, 1, 2);
  b.grille(14, 5, -8, 1, 2);
  b.round(15, 5, -7, 1, 1, 1, 'orange', { r: 0.38 });
  b.round(15, 5, -10, 1, 1, 1, 'metal', { r: 0.42, stud: true });
  b.round(13, 4, -4, 1, 1, 1, 'metal', { r: 0.42, stud: true });
}

function buildWeapons(b) {
  // Wing cannon lying on the upper skin.
  b.axial('barrel', 10, 4, -4, 1, 3, 2, '+z', 'charcoal', { r: 0.38 });
  b.axial('barrel', 10, 4, -1, 1, 4, 2, '+z', 'metal', { r: 0.17 });
  b.axial('barrel', 10, 4, 3, 1, 1, 2, '+z', 'orange', { r: 0.25 });

  // Wingtip pod: barrel ahead of the rail, tail cone behind it.
  b.axial('barrel', 15, 2, -4, 1, 4, 2, '+z', 'metal', { r: 0.34 });
  b.axial('cone', 15, 2, 0, 1, 2, 2, '+z', 'orange', { r: 0.34, r2: 0.08 });
  b.axial('cone', 15, 2, -14, 1, 2, 2, '-z', 'charcoal', { r: 0.38, r2: 0.12 });

  // Two under-wing missiles, each hung from a pylon plate.
  const missiles = [
    { x: 8, pylon: -9 },
    { x: 12, pylon: -11 },
  ];
  for (const { x, pylon } of missiles) {
    b.plate(x, 1, pylon, 1, 4, 'charcoal');
    b.axial('ribbed', x, -1, pylon - 2, 1, 1, 2, '+z', 'charcoal', { r: 0.4 });
    b.axial('barrel', x, -1, pylon - 1, 1, 4, 2, '+z', 'lightGray', { r: 0.36 });
    b.axial('barrel', x, -1, pylon + 3, 1, 1, 2, '+z', 'red', { r: 0.36 });
    b.axial('cone', x, -1, pylon + 4, 1, 2, 2, '+z', 'orange', { r: 0.36, r2: 0.05 });
  }
}

export function buildDetails(b) {
  b.in('details', () => {
    buildDorsalSpine(b);
    b.mirror(() => {
      buildWingSurface(b);
      buildNacelleCover(b);
      buildWeapons(b);
    });
  });
}
