// Swept delta wings. Described once for the right wing (x > 0) and mirrored.
//
// Planform: the leading edge runs along z = 11 - x, from the wing root
// (x = 3, z = 8) to the tip (x = 15, z = -4); the trailing edge sits at z = -12.
// Two skins of plates are laid with offset column seams (3|7|11|15 below,
// 5|9|13|15 above) so every lower plate is locked by the layer on top.

export function buildWings(b) {
  b.in('wingRight', () => {
    b.mirror(() => {
      // Lower skin (y = 2).
      for (let z = -12; z < 0; z += 2) b.plate(3, 2, z, 4, 2, 'charcoal');
      b.wedge(3, 2, 0, 4, 8, 4, 'charcoal');
      for (let z = -12; z < -4; z += 2) b.plate(7, 2, z, 4, 2, 'charcoal');
      b.wedge(7, 2, -4, 4, 8, 4, 'charcoal');
      for (let z = -12; z < -8; z += 2) b.plate(11, 2, z, 4, 2, 'charcoal');
      b.wedge(11, 2, -8, 4, 8, 4, 'charcoal');

      // Upper skin (y = 3). The innermost two studs are covered by the
      // fuselage spar plates.
      b.wedge(3, 3, 6, 2, 2, 0, 'lightGray');
      for (let z = -12; z < -2; z += 2) b.plate(5, 3, z, 4, 2, 'lightGray');
      b.wedge(5, 3, -2, 4, 8, 4, 'lightGray');
      for (let z = -12; z < -6; z += 2) b.plate(9, 3, z, 4, 2, 'lightGray');
      b.wedge(9, 3, -6, 4, 8, 4, 'lightGray');
      b.plate(13, 3, -12, 2, 4, 'lightGray');
      b.wedge(13, 3, -8, 2, 6, 4, 'lightGray');

      // Raised inboard panel, inset one stud from the leading edge.
      b.plate(6, 4, -10, 4, 4, 'red');
      b.plate(6, 4, -6, 4, 4, 'red');
      b.wedge(6, 4, -2, 4, 6, 2, 'red');

      // Doubler plates under the lower skin, bridging its column seams.
      b.runZ('plate', 6, 1, -10, -2, 2, 4, 'lightGray');
      b.plate(10, 1, -12, 2, 4, 'lightGray');

      // Wingtip rail: two stacked plates hung from a clamp plate that
      // overhangs the wing by one stud.
      b.runZ('plate', 15, 2, -12, -4, 1, 4, 'charcoal');
      b.runZ('plate', 15, 3, -12, -4, 1, 4, 'charcoal');
      b.plate(13, 4, -10, 3, 4, 'charcoal');
    });
  });
}
