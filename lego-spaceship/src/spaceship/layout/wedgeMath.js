import { STUD_RADIUS } from '../../config.js';

// A wedge plate is a rectangular footprint (w x d) with one diagonal edge.
// In canonical orientation (side = 1, lead = 1) the inner edge (x = 0) keeps the
// full depth `d` and the outer edge (x = w) is shortened to `cut`, so the
// diagonal runs from (0, d) to (w, cut). `side = -1` mirrors it in X (left
// wing), `lead = -1` mirrors it in Z (trailing edge).

/**
 * Signed distance from a point to the diagonal, positive on the solid side.
 * `px`/`pz` are measured from the footprint's minimum corner.
 */
export function wedgeDistance(spec, px, pz) {
  const { w, d, cut = 0, side = 1, lead = 1 } = spec;
  const x = side === 1 ? px : w - px;
  const z = lead === 1 ? pz : d - pz;
  const length = Math.hypot(w, d - cut);
  return (x * (cut - d) - (z - d) * w) / length;
}

/** Stud cells [i, j] whose stud fits completely on the wedge. */
export function wedgeStudCells(spec) {
  const cells = [];
  for (let i = 0; i < spec.w; i++) {
    for (let j = 0; j < spec.d; j++) {
      if (wedgeDistance(spec, i + 0.5, j + 0.5) >= STUD_RADIUS + 0.06) cells.push([i, j]);
    }
  }
  return cells;
}

/** Footprint outline as [x, z] pairs centred on the bounding box. */
export function wedgePolygon(spec) {
  const { w, d, cut = 0, side = 1, lead = 1 } = spec;
  const canonical = [
    [0, 0],
    [w, 0],
    [w, cut],
    [0, d],
  ];
  if (cut <= 0) canonical.splice(2, 1);
  return canonical.map(([x, z]) => [(side === 1 ? x : w - x) - w / 2, (lead === 1 ? z : d - z) - d / 2]);
}
