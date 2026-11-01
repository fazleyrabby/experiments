// The mid-mounted V12 and its gearbox, sitting in the engine bay behind the seats.
// Everything here lives in the void the body leaves open: x -8..8, z -27..-9.

export function buildDrivetrain(b) {
  b.in('drivetrain', () => {
    // Sump and block.
    b.brick(-3, 7, -24, 6, 12, 'dark');
    b.brick(-4, 10, -25, 8, 13, 'dark');

    // Twin cylinder banks with chrome heads and studded valve covers.
    b.mirror(() => {
      b.brick(1, 13, -25, 3, 13, 'chrome');
      b.plate(1, 16, -25, 3, 13, 'trim');
      // Spark-plug turrets along the cover.
      for (let k = 0; k < 6; k++) b.round(2, 17, -24 + k * 2.2 - 0.0, 1, 1, 2, 'gold', { r: 0.28 });
    });

    // Intake plenum between the banks with six trumpets.
    b.brick(-1, 13, -24, 2, 12, 'gold');
    for (let k = 0; k < 6; k++) {
      b.round(-1, 16, -24 + k * 2, 2, 2, 6, 'chrome', { stud: true });
    }

    // Gearbox ahead of the engine, under the rear of the cabin.
    b.brick(-3, 7, -12, 6, 4, 'dark');
    b.plate(-3, 10, -12, 6, 4, 'trim');

    // Exhaust headers sweeping back to the tailpipes.
    b.mirror(() => {
      b.axial('barrel', 4.1, 10.5, -27, 1.4, 3.5, 4, '-z', 'chrome', { r: 0.55 });
      b.axial('barrel', 3.3, 8.2, -27.4, 1.2, 3, 2, '-z', 'chrome', { r: 0.5 });
    });

    // Rear subframe cross tube.
    b.axial('barrel', -6.5, 9.5, -22, 13, 3, 1.2, '+x', 'chrome', { r: 0.5 });
  });
}
