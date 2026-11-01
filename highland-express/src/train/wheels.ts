import * as THREE from 'three';
import { Bag, lathe, cyl, xf } from './geo';
import { RAIL_HALF } from '../world/track';

export interface WheelSpec {
  radius: number; // tread radius
  spokes: number;
  hubR?: number;
  /** crank pin: radius from axle, pin angle on the right wheel (rad), left wheel angle, outward length */
  crank?: { r: number; right: number; left: number; len: number; boss: number };
  counterweight?: boolean;
  axleR?: number;
  rimDepth?: number;
}

const rotX = (phi: number) => new THREE.Matrix4().makeRotationX(phi);

/** Wheel centre-plane x offset: tread centred on the rail head. */
export const WHEEL_X = RAIL_HALF;

/**
 * Wheelset (axle + two spoked wheels) spinning about +x at the origin. Feature angles are
 * measured from +y towards +z, so rotating the group by θ about x moves a pin at angle φ to θ+φ.
 * Returned bag keys: wbody, tyre, axle, brass.
 */
export function buildWheelset(spec: WheelSpec): Bag {
  const bag = new Bag();
  const R = spec.radius;
  const hub = spec.hubR ?? Math.min(0.2, R * 0.2);
  const rim = spec.rimDepth ?? Math.max(0.06, R * 0.075);
  const axleR = spec.axleR ?? Math.max(0.06, R * 0.09);

  for (const side of [1, -1]) {
    const xc = side * WHEEL_X;
    // --- tyre with flange on the inner face
    const inX = xc - side * 0.07, outX = xc + side * 0.07;
    const flangeX = xc - side * 0.046;
    const tyreProfile: [number, number][] = [
      [R - rim - 0.005, inX],
      [R + 0.03, inX + side * 0.004],
      [R + 0.034, flangeX - side * 0.008],
      [R + 0.004, flangeX + side * 0.004],
      [R, outX - side * 0.006],
      [R - 0.003, outX],
      [R - rim - 0.005, outX],
      [R - rim - 0.005, inX],
    ];
    if (side < 0) tyreProfile.reverse();
    bag.add('tyre', lathe(tyreProfile, Math.max(36, Math.round(R * 60)), 'x'));

    // --- rim plate behind the tyre
    const rimProfile: [number, number][] = [
      [R - rim - 0.004, xc - 0.055],
      [R - rim - 0.045, xc - 0.04],
      [R - rim - 0.05, xc + 0.04],
      [R - rim - 0.004, xc + 0.055],
    ];
    if (side < 0) rimProfile.reverse();
    bag.add('wbody', lathe(rimProfile, Math.max(32, Math.round(R * 50)), 'x'));

    // --- hub
    const hubProfile: [number, number][] = [
      [0.001, xc - 0.1],
      [hub * 0.92, xc - 0.1],
      [hub, xc - 0.08],
      [hub, xc + 0.08],
      [hub * 0.92, xc + 0.1],
      [0.001, xc + 0.1],
    ];
    if (side < 0) hubProfile.reverse();
    bag.add('wbody', lathe(hubProfile, 20, 'x'));
    // brass hub cap
    const capProfile: [number, number][] = [
      [0.001, xc + side * 0.115],
      [hub * 0.55, xc + side * 0.112],
      [hub * 0.6, xc + side * 0.1],
      [0.001, xc + side * 0.1],
    ];
    if (side < 0) capProfile.reverse();
    bag.add('brass', lathe(capProfile, 16, 'x'));

    // --- spokes
    const len = R - rim - 0.05 - hub * 0.8;
    for (let i = 0; i < spec.spokes; i++) {
      const phi = (i / spec.spokes) * Math.PI * 2 + 0.07;
      const g = new THREE.CylinderGeometry(R * 0.028 + 0.012, R * 0.04 + 0.014, len, 6);
      g.scale(0.75, 1, 1.15);
      g.translate(xc, hub * 0.8 + len / 2, 0);
      g.applyMatrix4(rotX(phi));
      bag.add('wbody', g);
    }

    // --- counterweight (crescent opposite the crank pin)
    if (spec.counterweight && spec.crank) {
      const opp = (side > 0 ? spec.crank.right : spec.crank.left) + Math.PI;
      const r0 = hub + 0.1, r1 = R - rim - 0.07, span = 0.9;
      const sh = new THREE.Shape();
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const a = -span / 2 + (span * i) / n;
        const rr = r1;
        const x = rr * Math.cos(a), y = rr * Math.sin(a);
        if (i === 0) sh.moveTo(x, y);
        else sh.lineTo(x, y);
      }
      for (let i = n; i >= 0; i--) {
        const a = -span / 2 * 0.8 + (span * 0.8 * i) / n;
        sh.lineTo(r0 * 1.0 * Math.cos(a), r0 * 1.0 * Math.sin(a));
      }
      sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 4 });
      // shape plane (X,Y) -> (y,z); extrusion (Z) -> x. angle 0 of the shape points along +y.
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
      g.applyMatrix4(m);
      g.translate(xc + side * 0.045 - (side > 0 ? 0 : 0.05), 0, 0);
      g.applyMatrix4(rotX(opp));
      bag.add('wbody', g);
    }

    // --- crank pin
    if (spec.crank) {
      const phi = side > 0 ? spec.crank.right : spec.crank.left;
      const rc = spec.crank.r;
      const base = xc + side * 0.07;
      const pin = cyl(0.046, 0.046, spec.crank.len, 14, 'x');
      pin.translate(base + (side * spec.crank.len) / 2, rc * Math.cos(phi), rc * Math.sin(phi));
      bag.add('axle', pin);
      const boss = cyl(spec.crank.boss, spec.crank.boss, 0.05, 20, 'x');
      boss.translate(base + side * 0.025, rc * Math.cos(phi), rc * Math.sin(phi));
      bag.add('brass', boss);
      const cap = cyl(0.062, 0.062, 0.035, 14, 'x');
      cap.translate(base + side * (spec.crank.len + 0.005), rc * Math.cos(phi), rc * Math.sin(phi));
      bag.add('brass', cap);
    }
  }
  // --- axle between the wheels, with journals running out to the axle boxes
  const ax = cyl(axleR, axleR, 2 * WHEEL_X + 0.22, 14, 'x');
  bag.add('axle', ax);
  return bag;
}

/** Kinematic anchor for a crank pin at wheel angle `theta` (loco local, y/z plane). */
export function pinPos(axleY: number, axleZ: number, rc: number, theta: number): [number, number] {
  return [axleY + rc * Math.cos(theta), axleZ + rc * Math.sin(theta)];
}

export { xf };
