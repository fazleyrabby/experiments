import { PLATES_PER_BRICK } from '../../config.js';

// Grid conventions used by every spec:
//   x  left/right in studs (the car is symmetric about x = 0; +x is the car's left side)
//   z  length in studs (+z is the nose, -z the tail)
//   y  height in plates (3 plates = 1 brick), 0 = the ground
// (x, y, z) is always the minimum corner of the piece's bounding box and
// (w, h, d) its size along (x, y, z). Values may be fractional for detail
// parts; those are exempt from the integer-grid overlap validation.

const SECTION_MIRROR = { doorLeft: 'doorRight', doorRight: 'doorLeft' };
const AXIS_MIRROR = { '+x': '-x', '-x': '+x' };

function mirrorSpec(spec) {
  const mirrored = { ...spec, x: -(spec.x + spec.w) };
  if (spec.axis && AXIS_MIRROR[spec.axis]) mirrored.axis = AXIS_MIRROR[spec.axis];
  if (spec.rot) mirrored.rot = [spec.rot[0], -spec.rot[1], -spec.rot[2]];
  if (spec.side) mirrored.side = -spec.side;
  if (SECTION_MIRROR[spec.section]) mirrored.section = SECTION_MIRROR[spec.section];
  return mirrored;
}

/** Collects piece specs. Pure data: no Three.js objects are created here. */
export class LayoutBuilder {
  constructor() {
    this.specs = [];
    this.section = 'chassis';
  }

  /** Run `fn` with every added piece tagged as belonging to `section`. */
  in(section, fn) {
    const previous = this.section;
    this.section = section;
    fn();
    this.section = previous;
  }

  /** Run `fn` and add an X-mirrored copy of every piece it created. */
  mirror(fn) {
    const start = this.specs.length;
    fn();
    const created = this.specs.slice(start);
    for (const spec of created) this.specs.push(mirrorSpec(spec));
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

  /** Smooth tile (no studs), one plate high unless `extra.h` says otherwise. */
  tile(x, y, z, w, d, color, extra = {}) {
    return this.add({ type: 'tile', x, y, z, w, d, h: 1, color, ...extra });
  }

  /** Smooth block of any size: detail panels, lenses, trim. Dimensions in studs / plates. */
  panel(x, y, z, w, h, d, color, extra = {}) {
    return this.add({ type: 'tile', x, y, z, w, h, d, color, ...extra });
  }

  /** Upright round piece (round plate, post, antenna ...). */
  round(x, y, z, w, d, h, color, extra = {}) {
    return this.add({ type: 'round', x, y, z, w, d, h, color, ...extra });
  }

  /**
   * Round piece lying along an axis ('+z' | '-z' | '+x' | '-x'); `kind` is
   * 'barrel' | 'ribbed' | 'cone' | 'nozzle'. The tip / opening faces `axis`.
   */
  axial(kind, x, y, z, w, h, d, axis, color, extra = {}) {
    return this.add({ type: kind, x, y, z, w, h, d, axis, color, ...extra });
  }

  /**
   * Smooth cap whose top surface runs from height `ha` (plates) at z = za to
   * `hb` at z = zb. `t` is its thickness in plates; the underside follows the
   * top so it stays a constant-thickness skin.
   */
  slab(x, w, za, zb, ha, hb, t, color, extra = {}) {
    const bottomA = ha - t;
    const bottomB = hb - t;
    return this.add({
      type: 'slab',
      x,
      w,
      z: za,
      d: zb - za,
      y: Math.min(bottomA, bottomB),
      h: Math.max(ha, hb) - Math.min(bottomA, bottomB),
      ha,
      hb,
      t,
      color,
      ...extra,
    });
  }
}
