import { PLATES_PER_BRICK } from '../../config.js';

// Grid conventions used by every spec:
//   x  left/right in studs (the ship is symmetric about x = 0)
//   z  length in studs (+z is the nose, -z the engines)
//   y  height in plates (3 plates = 1 brick)
// (x, y, z) is always the minimum corner of the brick's bounding box and
// (w, h, d) its size along (x, y, z).

const SECTION_MIRROR = { wingRight: 'wingLeft', wingLeft: 'wingRight' };
const DIR_MIRROR = { '+x': '-x', '-x': '+x' };

function mirrorSpec(spec) {
  const mirrored = { ...spec, x: -(spec.x + spec.w) };
  if (spec.type === 'wedge') mirrored.side = -(spec.side ?? 1);
  if (spec.dir && DIR_MIRROR[spec.dir]) mirrored.dir = DIR_MIRROR[spec.dir];
  if (SECTION_MIRROR[spec.section]) mirrored.section = SECTION_MIRROR[spec.section];
  return mirrored;
}

/** Collects brick specs. Pure data — no Three.js objects are created here. */
export class LayoutBuilder {
  constructor() {
    this.specs = [];
    this.section = 'structure';
  }

  /** Run `fn` with every added brick tagged as belonging to `section`. */
  in(section, fn) {
    const previous = this.section;
    this.section = section;
    fn();
    this.section = previous;
  }

  /** Run `fn` and add an X-mirrored copy of every brick it created. */
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

  /** Smooth tile (no studs). `extra.h` turns it into a smooth panel block. */
  tile(x, y, z, w, d, color, extra = {}) {
    return this.add({ type: 'tile', x, y, z, w, d, h: 1, color, ...extra });
  }

  /** Grille tile: a tile with raised slats. */
  grille(x, y, z, w, d, color = 'charcoal', extra = {}) {
    return this.add({ type: 'grille', x, y, z, w, d, h: 1, color, ...extra });
  }

  /** Slope brick descending toward `dir` ('+z', '-z', '+x' or '-x'). */
  slope(x, y, z, w, d, h, dir, color, extra = {}) {
    return this.add({ type: 'slope', x, y, z, w, d, h, dir, color, ...extra });
  }

  /** Wedge plate; see wedgeMath.js for the meaning of cut / side / lead. */
  wedge(x, y, z, w, d, cut, color, extra = {}) {
    return this.add({ type: 'wedge', x, y, z, w, d, h: 1, cut, side: 1, lead: 1, color, ...extra });
  }

  /** Upright round piece (round plate, antenna, pilot head ...). */
  round(x, y, z, w, d, h, color, extra = {}) {
    return this.add({ type: 'round', x, y, z, w, d, h, color, ...extra });
  }

  /**
   * Round piece lying along the Z axis (engines, cannons, missiles).
   * `kind` is 'barrel' | 'ribbed' | 'cone' | 'nozzle' | 'core' and `axis`
   * ('+z' | '-z') is the direction its tip / opening faces.
   */
  axial(kind, x, y, z, w, d, h, axis, color, extra = {}) {
    return this.add({ type: kind, x, y, z, w, d, h, axis, color, snot: true, ...extra });
  }

  /**
   * Lay a row of identical pieces along Z between z0 and z1.
   * `first` shortens the first piece so neighbouring rows can be staggered
   * like real brickwork.
   */
  runZ(type, x, y, z0, z1, w, length, color, { first, ...extra } = {}) {
    let z = z0;
    let pieceLength = first ?? length;
    while (z < z1) {
      const d = Math.min(pieceLength, z1 - z);
      this[type](x, y, z, w, d, color, extra);
      z += d;
      pieceLength = length;
    }
  }
}
