// Key dimensions of the Countach, in studs (x, z) and plates (y) unless noted.
// 1 stud is roughly 6.5 cm at this scale, so the 64-stud car is about 4.1 m long.

/** Piecewise-linear interpolation through [[z, value], ...] sorted by z. */
export function pl(z, points) {
  if (z <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (z <= points[i][0]) {
      const [z0, v0] = points[i - 1];
      const [z1, v1] = points[i];
      return v0 + ((v1 - v0) * (z - z0)) / (z1 - z0);
    }
  }
  return points[points.length - 1][1];
}

export const HALF_LENGTH = 32;
export const HALF_WIDTH = 15;
/** Underside of the body shell, in plates. Ground clearance is 4 plates (about 10 cm). */
export const BODY_BOTTOM = 4;

/** Wheel geometry in world units (1 unit = 1 stud = 2.5 plates). */
export const WHEEL = {
  front: { z: 18.5, x: 11.4, r: 5.0, width: 3.4, rimR: 3.25, archR: 5.45 },
  rear: { z: -19.5, x: 11.5, r: 5.3, width: 5.2, rimR: 3.5, archR: 5.8 },
};

/** Centre line of the roof, hood, windscreen and deck, as [z, height in plates]. */
export const CENTER_LINE = [
  [-32, 33.5],
  [-29, 33.5],
  [-13, 36],
  [-8, 41],
  [-2, 41],
  [8, 33.5],
  [19, 29.5],
  [31, 15.5],
  [32, 14],
];

/** Shoulder / belt line along the flanks (fenders, doors, haunches). */
export const SHOULDER_LINE = [
  [-32, 36],
  [-31, 36.5],
  [-25, 37],
  [-14, 37.5],
  [-9, 31],
  [8, 31],
  [14, 30.2],
  [19, 29.4],
  [31, 15],
  [32, 13],
];

/** How far the inboard columns rise above the shoulder line (cabin tumblehome and hood crown). */
export const STEP_9 = [
  [-32, 0],
  [-15, 0],
  [-9, 5],
  [8, 5],
  [10, 1.5],
  [31, 1.5],
];
export const STEP_8 = [
  [-32, 0],
  [-15, 0],
  [-9, 9],
  [8, 9],
  [10, 3],
  [31, 3],
];

/** Number of body columns (each side of the centre line) present at cell Z. */
export function planHalf(Z) {
  if (Z >= 30) return 12;
  if (Z === 29) return 13;
  if (Z === 28) return 14;
  if (Z <= -32) return 13;
  if (Z === -31) return 14;
  return 15;
}

/** Rear end of the centre (engine cover / tail panel) columns: the tail panel sits recessed between the haunches. */
export const TAIL_PANEL_Z = -29;

/** Is body column m present at cell Z? */
export function present(m, Z) {
  if (m >= planHalf(Z)) return false;
  if (m <= 7 && Z < TAIL_PANEL_Z) return false;
  return true;
}

/** Column index (0 at the centre line) of a signed X cell. */
export function columnIndex(X) {
  return X >= 0 ? X : -X - 1;
}

/** Top surface height (plates) of body column m at z. */
export function surfaceHeight(m, z) {
  const centre = pl(z, CENTER_LINE);
  if (m >= 10) return Math.min(centre, pl(z, SHOULDER_LINE));
  if (m === 9) return Math.min(centre, pl(z, SHOULDER_LINE) + pl(z, STEP_9));
  if (m === 8) return Math.min(centre, pl(z, SHOULDER_LINE) + pl(z, STEP_8));
  return centre;
}
