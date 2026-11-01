import { PLATE_HEIGHT } from '../../config.js';

// Exploded-view design. Instead of scattering pieces randomly, each section
// slides along its own assembly direction, like a technical exploded diagram:
// wheels pull out along their axles in layers, the doors swing up on their
// hinge, the hood and engine cover lift, the glasshouse floats on top.
//
// Offsets are in world units. +x is the car's left, +z the nose.

const P = PLATE_HEIGHT;

/** Scissor-door hinge: the front of each door, just under the belt line. */
const DOOR_HINGE = { y: 24 * P, z: 11 };
const DOOR_SWING = 1.02; // radians

const WHEEL_LAYER = { tire: 15, rim: 10.5, rotor: 5.2, caliper: 5.2, axle: 0 };

/**
 * @param {object} spec  layout spec
 * @param {number[]} world  piece centre in car coordinates (before the pivot shift)
 * @param {() => number} random
 * @returns {{offset:number[], spin:{pivot:number[], axis:number[], angle:number}|null}}
 */
export function explodeFor(spec, world, random) {
  const sx = world[0] === 0 ? 0 : Math.sign(world[0]);
  const jitter = () => (random() - 0.5) * 0.6;
  let offset = [0, 0, 0];
  let spin = null;

  switch (spec.section) {
    case 'chassis':
      offset = [0, 0, 0];
      break;
    case 'wheels': {
      const out = WHEEL_LAYER[spec.part] ?? 10;
      offset = [sx * out, 0, world[2] > 0 ? 4 : -4];
      break;
    }
    case 'drivetrain':
      offset = [0, 9, -11];
      break;
    case 'interior':
      offset = [0, 17, 2];
      break;
    case 'lowerBody':
      offset = [sx * 8, 4, 0];
      break;
    case 'frontBumper':
      offset = [0, 3, 15];
      break;
    case 'rearBumper':
      offset = [0, 3, -15];
      break;
    case 'haunches':
      offset = [sx * 10, 13, -7];
      break;
    case 'engineCover':
      offset = [0, 24, -13];
      break;
    case 'hood':
      offset = [0, 24, 12];
      break;
    case 'doorLeft':
    case 'doorRight':
      offset = [sx * 15, 8, 5];
      spin = { pivot: [world[0], DOOR_HINGE.y, DOOR_HINGE.z], axis: [1, 0, 0], angle: DOOR_SWING };
      break;
    case 'glasshouse':
      offset = [0, 31, 0];
      break;
    case 'roof':
      offset = [0, 38, -1];
      break;
    case 'wing':
      offset = [0, 30, -22];
      break;
    case 'lights':
      offset = world[2] > 0 ? [0, 24, 12] : [0, 3, -15];
      break;
    case 'details':
      offset = world[2] > 6 ? [0, 24, 12] : world[2] < -6 ? [0, 24, -13] : [0, 34, 0];
      break;
    default:
      offset = [0, 10, 0];
  }

  return { offset: [offset[0] + jitter(), offset[1] + jitter(), offset[2] + jitter()], spin };
}
