import * as THREE from 'three';

const _d = new THREE.Vector3();
const _p = new THREE.Vector3();

/**
 * Analytic two-bone IK (hip-knee-ankle, shoulder-elbow-wrist).
 * The middle joint bends toward `poleDir`. Writes the middle joint into outMid and
 * the reachable end point into outEnd (equal to target whenever it is in reach).
 */
export function solveTwoBone(root, target, l1, l2, poleDir, outMid, outEnd) {
  _d.subVectors(target, root);
  let dist = _d.length();
  dist = THREE.MathUtils.clamp(dist, Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.9995);
  _d.normalize();
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  _p.copy(poleDir).addScaledVector(_d, -poleDir.dot(_d)).normalize();
  outMid.copy(root).addScaledVector(_d, a).addScaledVector(_p, h);
  outEnd.copy(root).addScaledVector(_d, dist);
  return outMid;
}
