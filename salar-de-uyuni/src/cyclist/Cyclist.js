import * as THREE from 'three';
import { BIKE, Bicycle } from './Bicycle.js';
import { Rider } from './Rider.js';

const GEAR_RATIO = BIKE.chainringRadius / BIKE.cogRadius;

/** Bike + rider + the kinematics that tie them together. */
export class Cyclist {
  constructor() {
    this.root = new THREE.Group(); // ground position and heading
    this.chassis = new THREE.Group(); // leans with the bike; everything rides in here
    this.root.add(this.chassis);
    this.root.name = 'cyclist';

    this.bike = new Bicycle();
    this.rider = new Rider();
    this.chassis.add(this.bike.group, this.rider.group);

    this.position = this.root.position;
    this.heading = 0;
    this.distance = 0;
    this.forward = new THREE.Vector3(1, 0, 0);
    this.right = new THREE.Vector3(0, 0, 1);
    this.pose = {
      pedals: [new THREE.Vector3(), new THREE.Vector3()],
      grips: [new THREE.Vector3(), new THREE.Vector3()],
      pitches: [0, 0],
      crankAngle: 0,
    };
    this.update(0, 0, 0);
  }

  update(dt, speed, time) {
    const ds = speed * dt;
    this.distance += ds;

    // A barely perceptible meander, like a real rider holding a line by eye.
    const curvature = 0.012 * Math.sin(this.distance * 0.021) + 0.006 * Math.sin(this.distance * 0.057 + 1.7);
    this.heading += curvature * ds;
    this.forward.set(Math.cos(this.heading), 0, -Math.sin(this.heading));
    this.right.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.position.addScaledVector(this.forward, ds);
    this.root.rotation.y = this.heading;

    const wheelAngle = this.distance / BIKE.wheelRadius;
    const crankAngle = 0.4 - wheelAngle / GEAR_RATIO;
    const effort = Math.min(speed / 2, 1);
    this.chassis.rotation.x = (-speed * speed * curvature) / 9.81 + Math.sin(crankAngle) * 0.012 * effort;
    const steer = curvature * 1.05 + Math.sin(crankAngle) * 0.008 * effort + Math.sin(time * 0.7) * 0.004;

    // Ankling: heel slightly dropped on the downstroke, toes down on the backstroke.
    const pose = this.pose;
    pose.crankAngle = crankAngle;
    pose.pitches[0] = -0.15 + 0.15 * Math.cos(crankAngle);
    pose.pitches[1] = -0.15 + 0.15 * Math.cos(crankAngle + Math.PI);

    this.bike.setState({ wheelAngle, crankAngle, steer, pedalPitch: pose.pitches });
    for (let i = 0; i < 2; i++) {
      this.bike.pedalPosition(i, pose.pedals[i]);
      this.bike.gripPosition(i, pose.grips[i]);
    }
    this.rider.update(pose, time);
  }

  /** World-space tyre contact points: [rear, front]. */
  contactPoints(out) {
    this.root.updateMatrixWorld(true);
    out[0].set(BIKE.rearAxle.x, 0, 0).applyMatrix4(this.chassis.matrixWorld);
    out[1].set(BIKE.frontAxle.x, 0, 0).applyMatrix4(this.chassis.matrixWorld);
    out[0].y = out[1].y = 0;
    return out;
  }
}
