// The front fascia: intake grille, splitter, indicator and parking lenses,
// the nose badge, plus the little marker lamps along the flanks.

export function buildFront(b) {
  b.in('frontBumper', () => {
    // Central intake: a dark mouth with chrome slats.
    b.panel(-6, 6.5, 31.95, 12, 5, 0.35, 'dark');
    for (let k = 0; k < 4; k++) b.panel(-5.7, 7.1 + k * 1.15, 32.25, 11.4, 0.5, 0.22, 'trim');
    // Splitter under the nose.
    b.panel(-11, 3.4, 30.9, 22, 1.3, 1.5, 'dark');
    // Badge.
    b.panel(-0.9, 12, 31.95, 1.8, 2.6, 0.3, 'gold');
  });

  b.in('lights', () => {
    b.mirror(() => {
      // White parking / driving lamps and amber indicators.
      b.panel(3.4, 7.2, 31.95, 2.4, 3.8, 0.36, 'glowWhite');
      b.panel(6.2, 7.2, 31.95, 3.2, 3.8, 0.36, 'glowWhite');
      b.panel(9.6, 7.2, 31.95, 1.5, 3.8, 0.36, 'glowAmber');
      // Chrome bezel under the lamps.
      b.panel(3.2, 6.5, 31.9, 8.2, 0.6, 0.3, 'chrome');
    });
  });

  b.in('details', () => {
    // Flank markers just ahead of the front wheel arch and behind the rear one.
    b.mirror(() => {
      b.panel(14.95, 12.5, 26.5, 0.3, 1.4, 1.8, 'glowAmber');
      b.panel(14.95, 14.5, -28.8, 0.3, 1.4, 1.8, 'glowRed');
    });
  });
}
