// Key dimensions of the YT-1300, in studs (x, z) and plates (y) unless noted.
// 1 stud is roughly 0.55 m at this scale, so the 59-stud ship is about 33 m long.
//
// Conventions: +z is the bow (the mandibles), -z the stern (the engine arc),
// +x is port, -x starboard (the cockpit side), y is up. The hull is symmetric
// about the mid-plane y = 0: the upper half occupies plates [0, H), the lower
// half [-H, 0).

/** Piecewise-linear interpolation through [[t, value], ...] sorted by t. */
export function pl(t, points) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (t <= points[i][0]) {
      const [t0, v0] = points[i - 1];
      const [t1, v1] = points[i];
      return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
  }
  return points[points.length - 1][1];
}

/** Saucer radius (outer face of the rim band). */
export const R = 24;
/** Inner face of the rim band; grid bricks stay inside this circle. */
export const RIM_INNER = 22.85;

/** Top surface of the dorsal plating as [radius, plates above the mid-plane]. */
export const HULL_PROFILE = [
  [0, 11],
  [6, 11],
  [21, 6],
  [24, 5],
];

/** Hull plating thickness, plates. */
export const PANEL_T = 1;

export const hullHeight = (r) => pl(r, HULL_PROFILE);

/** Plating rings: [inner radius, outer radius, sector count]. */
export const RINGS = [
  [4.6, 6, 12],
  [6, 10.2, 12],
  [10.2, 15, 24],
  [15, 19.5, 24],
  [19.5, 24, 24],
];

/**
 * The mandibles: two long tapered prongs. Each has a straight inner edge on the
 * docking slot (x = ±SLOT_HALF) and a diagonal outer edge that leaves the rim
 * at about 44° of azimuth and runs forward to a narrow, squared tip. Between
 * them the hull is bridged forward to the back of the slot at SLOT_Z.
 */
export const SLOT_HALF = 3;
export const SLOT_Z = 28;
export const MANDIBLE = { top: 6, tipZ: 39, edge: [[16.6, 17.4], [6, 39]] };

/** |x| of the mandible's outer edge at z. */
export function mandibleOuterX(z) {
  const [[x0, z0], [x1, z1]] = MANDIBLE.edge;
  return x0 + ((x1 - x0) * (z - z0)) / (z1 - z0);
}

/** Sublight engine arc, in degrees of azimuth either side of the stern. */
export const ENGINE_ARC = 52;

/** Cockpit: access tube from inside the hull out to the pod, which points forward. */
export const COCKPIT = {
  tubeStart: [-14, 7],
  podX: -23,
  podZ0: 12.5,
  podZ1: 20,
  podR: 2.3,
  noseZ: 24.4,
  noseR: 1.05,
  tubeR: 1.75,
};

/** Column index (0 at the centre line) of a signed X cell. */
export function columnIndex(X) {
  return X >= 0 ? X : -X - 1;
}

export const deg = (d) => (d * Math.PI) / 180;
