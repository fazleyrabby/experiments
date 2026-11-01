import * as THREE from 'three';

export const CRANK_RADIUS = .46;
export const ROD_LENGTH = 1.88;
export const THROW_PHASES = [0, Math.PI / 2, 3 * Math.PI / 2, Math.PI];
export const CYLINDER_Z = [-2.1, -.7, .7, 2.1];
export const CRANK_Y = -.18;
export const bankDirection = side => new THREE.Vector3(side * Math.SQRT1_2, Math.SQRT1_2, 0);

/** Intersection of a fixed-length rod with its cylinder's line of travel. */
export function solveSliderCrank(angle, side, phase = 0) {
  const a = angle + phase;
  const x = Math.sin(a) * CRANK_RADIUS;
  const y = Math.cos(a) * CRANK_RADIUS;
  const nx = side * Math.SQRT1_2;
  const ny = Math.SQRT1_2;
  const projection = x * nx + y * ny;
  const distance = projection + Math.sqrt(ROD_LENGTH ** 2 - CRANK_RADIUS ** 2 + projection ** 2);
  return { crankX: x, crankY: y, pistonX: nx * distance, pistonY: ny * distance, distance };
}

export function updateMechanism(mechanism, angle) {
  mechanism.crank.rotation.z = -angle;
  for (const item of mechanism.cylinders) {
    const p = solveSliderCrank(angle, item.side, item.phase);
    item.piston.position.set(p.pistonX, CRANK_Y + p.pistonY, item.z);
    // The rod's local +Y points from its big-end center to its small-end center.
    item.rod.position.set(p.crankX, CRANK_Y + p.crankY, item.z);
    item.rod.rotation.z = Math.atan2(-(p.pistonX - p.crankX), p.pistonY - p.crankY);
  }
}
