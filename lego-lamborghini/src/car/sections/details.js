// Door furniture and glass accessories: outline shut-lines, handles, wing
// mirrors on stalks, and the windscreen wipers.

export function buildDetails(b) {
  b.in('doorLeft', () => {
    b.mirror(() => {
      // Shut lines around the door.
      b.panel(14.94, 17, 11.3, 0.18, 14.2, 0.45, 'dark');
      b.panel(14.94, 17, -9.6, 0.18, 14.2, 0.45, 'dark');
      b.panel(14.94, 17, -9.6, 0.18, 0.7, 21.4, 'dark');
      // Handle.
      b.panel(14.94, 24.4, -5.2, 0.3, 1.6, 2.8, 'chrome');
      // Wing mirror on a stalk, folded back from the A-pillar.
      b.panel(10.4, 31.4, 6.2, 2.4, 0.8, 0.5, 'dark');
      b.panel(11.8, 32.2, 4.9, 2.2, 3.4, 1.5, 'trim');
      b.panel(11.95, 32.5, 4.8, 1.9, 2.6, 0.14, 'chrome');
    });
  });

  b.in('details', () => {
    // Wipers parked at the base of the windscreen.
    for (const x of [-4.6, 1.6]) {
      b.panel(x, 36.4, 1.2, 0.28, 0.45, 4.8, 'plastic', { rot: [0.3, 0, 0] });
    }
  });
}
