// Twin vertical stabilizers, one stud thick, standing on the wings just
// outboard of the engine nacelles. Each layer is shifted one stud aft and
// fronted by a slope, giving a swept-back fin.

export function buildStabilizers(b) {
  b.in('stabilizers', () => {
    b.mirror(() => {
      const x = 5;
      b.brick(x, 4, -11, 1, 4, 'charcoal');
      b.slope(x, 4, -7, 1, 2, 3, '+z', 'charcoal');
      b.plate(x, 7, -12, 1, 5, 'lightGray');
      b.brick(x, 8, -12, 1, 3, 'red');
      b.slope(x, 8, -9, 1, 2, 3, '+z', 'red');
      b.brick(x, 11, -13, 1, 2, 'red');
      b.slope(x, 11, -11, 1, 2, 3, '+z', 'red');
      b.tile(x, 14, -13, 1, 2, 'yellow');
    });
  });
}
