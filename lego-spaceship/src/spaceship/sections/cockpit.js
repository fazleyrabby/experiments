// Cockpit: a two-stud-wide tub (x -1..1, z 5..11) sunk into the fuselage,
// a dark frame around its rim and a translucent stepped canopy on top.

export function buildCockpit(b) {
  b.in('cockpitSupport', () => {
    b.mirror(() => {
      b.runZ('brick', 2, 4, 4, 12, 1, 4, 'red'); // outer wall
      b.runZ('brick', 1, 4, 4, 12, 1, 4, 'charcoal'); // tub wall
      b.runZ('plate', 1, 7, 4, 12, 2, 4, 'charcoal'); // canopy sill
      b.runZ('tile', 2, 8, 4, 12, 1, 4, 'charcoal'); // frame trim outside the glass
    });

    // Bulkheads closing the tub front and rear, capped by the sill.
    b.brick(-1, 4, 4, 2, 1, 'charcoal');
    b.brick(-1, 4, 11, 2, 1, 'charcoal');
    b.plate(-1, 7, 4, 2, 1, 'charcoal');
    b.plate(-1, 7, 11, 2, 1, 'charcoal');

    // Interior: seat, floor, instrument console and control stick.
    b.plate(-1, 4, 5, 2, 2, 'charcoal');
    b.tile(-1, 4, 7, 2, 2, 'metal');
    b.slope(-1, 4, 9, 2, 2, 2, '-z', 'charcoal');
    b.round(-0.5, 5, 8, 1, 1, 2, 'metal', { r: 0.11 });

    // Pilot: torso on the seat, head rising into the canopy.
    b.add({ type: 'tile', x: -1, y: 5, z: 6, w: 2, d: 1, h: 2, color: 'orange' });
    b.round(-0.5, 7, 6, 1, 1, 2, 'yellow', { r: 0.4, nested: true });
  });

  b.in('canopy', () => {
    b.tile(-2, 8, 4, 4, 2, 'glass', { h: 3 });
    b.tile(-2, 8, 6, 4, 2, 'glass', { h: 3 });
    b.slope(-2, 8, 8, 4, 4, 3, '+z', 'glass');
    // Dark frame bars over the glass.
    b.tile(-2, 11, 4, 4, 1, 'charcoal');
    b.tile(-2, 11, 7, 4, 1, 'charcoal');
  });
}
