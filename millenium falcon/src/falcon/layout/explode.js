import { RINGS } from './dims.js';

// Exploded-view design. Instead of scattering pieces randomly, each section
// slides along its own assembly direction, like a technical exploded diagram:
// the dorsal plating lifts off in concentric rings, the ventral plating drops,
// the rim band and engine arc pull out radially, the mandibles slide forward,
// the cockpit swings out to starboard and the turrets rise on their axis.
//
// Offsets are in world units. +x is port, +z the bow, +y up.

function ringOf(r) {
  for (let i = RINGS.length - 1; i >= 0; i--) if (r >= RINGS[i][0]) return i;
  return 0;
}

/** Which section a free-standing detail travels with. */
function hostOf(spec, world) {
  if (spec.explode) return spec.explode;
  const r = Math.hypot(world[0], world[2]);
  if (r > 23 && Math.abs(world[1]) < 2.2) return 'rim';
  return world[1] >= 0 ? 'upperPlating' : 'lowerPlating';
}

/**
 * @param {object} spec  layout spec
 * @param {number[]} world  piece centre in ship coordinates (before the pivot shift)
 * @param {() => number} random
 * @returns {{offset:number[]}}
 */
export function explodeFor(spec, world, random) {
  const [x, y, z] = world;
  const r = Math.hypot(x, z) || 1;
  const rx = x / r;
  const rz = z / r;
  const sx = x === 0 ? 0 : Math.sign(x);
  const jitter = () => (random() - 0.5) * 0.7;
  const section = spec.section === 'details' ? hostOf(spec, world) : spec.section;
  let offset;

  switch (section) {
    case 'frame':
      offset = [0, 0, 0];
      break;
    case 'upperHull':
      offset = [rx * 2.5, 7, rz * 2.5];
      break;
    case 'lowerHull':
      offset = [rx * 2.5, -7, rz * 2.5];
      break;
    case 'upperPlating':
    case 'lowerPlating': {
      const ring = spec.ring ?? ringOf(r);
      const up = section === 'upperPlating' ? 1 : -1;
      const out = 3 + ring * 2.2;
      offset = [rx * out, up * (14 + (4 - ring) * 1.6), rz * out];
      break;
    }
    case 'rim':
      offset = [rx * 10, y * 0.6, rz * 10];
      break;
    case 'engines':
      offset = [rx * 8, y * 0.8, rz * 8 - 4];
      break;
    case 'mandibles':
      offset = [sx * 3.5, y * 0.4, 14];
      break;
    case 'cockpit':
      offset = [-10, 2.5, 7];
      break;
    case 'turrets':
      offset = [0, y >= 0 ? 25 : -25, 0];
      break;
    case 'dish':
      offset = [6, 23, 6];
      break;
    default:
      offset = [0, 10, 0];
  }

  return { offset: [offset[0] + jitter(), offset[1] + jitter(), offset[2] + jitter()] };
}
