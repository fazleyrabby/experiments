import { PLATE_HEIGHT, PLATES_PER_BRICK } from '../../config.js';
import { hullHeight, HULL_PROFILE, PANEL_T, pl } from './dims.js';

// Grid conventions used by every grid spec:
//   x  left/right in studs (the ship is symmetric about x = 0 apart from the cockpit; +x is port)
//   z  length in studs (+z is the bow, -z the stern)
//   y  height in plates (3 plates = 1 brick), 0 = the hull mid-plane
// (x, y, z) is always the minimum corner of the piece's bounding box and
// (w, h, d) its size along (x, y, z).
//
// Free-form pieces (curved hull plating, greebles, the cockpit ...) are added
// with part(): a geometry descriptor, a centre in world units, a rotation and
// an approximate size. They are exempt from the integer-grid overlap check.

const P = PLATE_HEIGHT;
const round = (v) => Math.round(v * 1e5) / 1e5;
/** Snap a greeble dimension to a 0.05 grid so similar pieces share one geometry (one draw call). */
export const snap = (v) => Math.max(0.05, Math.round(v * 20) / 20);

/** Collects piece specs. Pure data: no Three.js objects are created here. */
export class LayoutBuilder {
  constructor() {
    this.specs = [];
    this.section = 'frame';
  }

  /** Run `fn` with every added piece tagged as belonging to `section`. */
  in(section, fn) {
    const previous = this.section;
    this.section = section;
    fn();
    this.section = previous;
  }

  add(spec) {
    const full = { w: 1, d: 1, h: 1, ...spec, section: spec.section ?? this.section };
    this.specs.push(full);
    return full;
  }

  /** Studded plate, one plate high. */
  plate(x, y, z, w, d, color, extra = {}) {
    return this.add({ type: 'plate', x, y, z, w, d, h: 1, color, ...extra });
  }

  /** Studded brick, three plates high. */
  brick(x, y, z, w, d, color, extra = {}) {
    return this.add({ type: 'brick', x, y, z, w, d, h: PLATES_PER_BRICK, color, ...extra });
  }

  /** Smooth tile (no studs), one plate high. */
  tile(x, y, z, w, d, color, extra = {}) {
    return this.add({ type: 'tile', x, y, z, w, d, h: 1, color, ...extra });
  }

  /**
   * Free-form piece.
   * @param {object} geo      geometry descriptor (see brickGeometry.js)
   * @param {number[]} pos    centre, world units
   * @param {number[]} rot    Euler angles
   * @param {number[]} size   approximate extent, world units (bounds + click pitch)
   * @param {string} color
   * @param {object} [extra]  order (Euler order), explode, sortKey ...
   */
  part(geo, pos, rot, size, color, extra = {}) {
    return this.add({
      type: 'part',
      geo,
      pos: pos.map(round),
      rot: rot.map(round),
      size,
      color,
      ...extra,
    });
  }

  /** Smooth box centred at `pos` (world units), sized [w, h, d]. */
  box(pos, size, color, rot = [0, 0, 0], extra = {}) {
    size = size.map(snap);
    const geo = { shape: 'box', w: round(size[0]), h: round(size[1] / P), d: round(size[2]), studs: [] };
    return this.part(geo, pos, rot, size, color, extra);
  }

  /** Upright cylinder centred at `pos`. */
  cylinder(pos, r, length, color, rot = [0, 0, 0], extra = {}) {
    r = snap(r);
    length = snap(length);
    const geo = { shape: 'cylinder', r: round(r), length: round(length), stud: Boolean(extra.stud) };
    return this.part(geo, pos, rot, [2 * r, length, 2 * r], color, extra);
  }

  /**
   * A piece sitting on the sloped hull plating at (r, azimuth), lifted `lift`
   * world units off the surface and tilted to follow the cone. `side` is +1 for
   * the dorsal surface and -1 for the ventral one.
   */
  onHull(geo, r, azimuth, lift, size, color, side = 1, extra = {}) {
    const slope = slopeAt(r);
    const tilt = Math.atan(slope);
    const surface = hullHeight(r) * P;
    // Offset along the surface normal so tall pieces stand square on the slope.
    const nx = Math.sin(tilt);
    const ny = Math.cos(tilt);
    const y = side * (surface + ny * lift);
    const rr = r + nx * lift;
    const pos = [rr * Math.sin(azimuth), y, rr * Math.cos(azimuth)];
    const rot = side > 0 ? [tilt, azimuth, 0] : [Math.PI - tilt, azimuth, 0];
    return this.part(geo, pos, rot, size, color, { order: 'YXZ', ...extra });
  }

  /** Smooth box on the hull surface (see onHull). */
  hullBox(r, azimuth, size, color, side = 1, extra = {}) {
    size = size.map(snap);
    const geo = { shape: 'box', w: round(size[0]), h: round(size[1] / P), d: round(size[2]), studs: [] };
    return this.onHull(geo, r, azimuth, size[1] / 2, size, color, side, extra);
  }
}

/** Downward slope of the dorsal surface at radius r (positive = falling outward). */
function slopeAt(r) {
  const e = 0.01;
  return ((hullHeight(r - e) - hullHeight(r + e)) * P) / (2 * e);
}

/**
 * Descriptor + placement of one curved plating sector.
 *
 * Symmetric sectors are modelled about local azimuth 0 and turned into place
 * with a rotation about y, so every sector in a ring shares one geometry.
 * Sectors that border the docking slot (`slot` = +1 on the port side, -1 on
 * starboard) are clipped to the slot wall x = ±c and modelled in place.
 *
 * @param {object} o
 * @param {number} o.r0, o.r1      radial extent
 * @param {number} o.a0, o.a1      azimuth range (radians); local for shared sectors
 * @param {number} [o.rotY]        azimuth the shared sector is turned to
 * @param {number[][]} [o.profile] top height [[r, plates]], defaults to the hull profile
 * @param {number} [o.t]           thickness, plates
 * @param {boolean} [o.flip]       mirror into the ventral hull
 * @param {number} [o.slot]        0 | 1 | -1
 * @param {number} [o.c]           slot half width
 * @param {number} [o.bevel]       top edge chamfer, world units
 */
export function sectorPart(o) {
  const profile = o.profile ?? HULL_PROFILE;
  const t = o.t ?? PANEL_T;
  const slot = o.slot ?? 0;
  const c = o.c ?? 0;
  const rm = (o.r0 + o.r1) / 2;
  let lo = o.a0;
  let hi = o.a1;
  if (slot > 0) lo = Math.asin(c / rm);
  if (slot < 0) hi = -Math.asin(c / rm);
  const am = (lo + hi) / 2;
  const sign = o.flip ? -1 : 1;
  // Anchor: middle of the sector, half way through its thickness.
  const ym = sign * (pl(rm, profile) - t / 2) * P;
  const anchor = [rm * Math.sin(am), ym, rm * Math.cos(am)].map(round);

  const geo = {
    shape: 'sector',
    r0: round(o.r0),
    r1: round(o.r1),
    a0: round(o.a0),
    a1: round(o.a1),
    slot,
    c: round(c),
    t: round(t),
    flip: Boolean(o.flip),
    bevel: o.bevel ?? 0.05,
    profile,
    anchor,
  };
  const rotY = o.rotY ?? 0;
  const pos = [
    anchor[0] * Math.cos(rotY) + anchor[2] * Math.sin(rotY),
    anchor[1],
    -anchor[0] * Math.sin(rotY) + anchor[2] * Math.cos(rotY),
  ];
  const span = (o.r1 - o.r0) * 1.2;
  const width = rm * (hi - lo);
  return { geo, pos, rot: [0, rotY, 0], size: [Math.max(span, width), Math.max(t * P, 0.4), Math.max(span, width)] };
}
