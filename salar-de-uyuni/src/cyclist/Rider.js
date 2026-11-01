import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loftAlongX, loftGeometry, limbGeometry } from '../geometry/loft.js';
import { v3 } from '../geometry/builders.js';
import { solveTwoBone } from './ik.js';
import { createRiderMaterials } from './materials.js';

const DEG = Math.PI / 180;
const DOWN = new THREE.Vector3(0, -1, 0);

// ~1.75 m adult. All positions in bike space; torso-local values are relative to the hip centre.
export const RIDER = {
  hipCenter: v3(-0.205, 1.045, 0),
  hipJoint: v3(0.02, 0.0, 0.088),
  shoulderJoint: v3(0.02, 0.475, 0.168),
  neckBase: v3(0.03, 0.56, 0),
  lean: 34 * DEG,
  thigh: 0.43,
  shin: 0.43,
  upperArm: 0.32,
  forearm: 0.265,
  ankleFromBall: new THREE.Vector2(-0.12, 0.109),
  wristFromGrip: v3(-0.068, 0.034, 0),
};

const PROFILES = {
  thigh: [[-0.12, 0.02], [-0.08, 0.06], [0, 0.083], [0.15, 0.086], [0.45, 0.076], [0.75, 0.064], [0.95, 0.055], [1.05, 0.04], [1.09, 0.012]],
  shin: [[-0.08, 0.015], [-0.05, 0.045], [0, 0.054], [0.18, 0.058], [0.35, 0.056], [0.65, 0.046], [0.9, 0.04], [1.0, 0.038], [1.04, 0.02]],
  upperArm: [[-0.12, 0.02], [-0.07, 0.05], [0, 0.056], [0.25, 0.052], [0.6, 0.046], [0.92, 0.043], [1.05, 0.035], [1.1, 0.012]],
  forearm: [[-0.08, 0.015], [-0.04, 0.04], [0, 0.044], [0.2, 0.045], [0.55, 0.04], [0.85, 0.034], [0.97, 0.035], [1.0, 0.036], [1.03, 0.012]],
  palm: [[-0.15, 0.012], [-0.05, 0.025], [0, 0.028], [0.5, 0.033], [0.9, 0.034], [1.1, 0.02]],
  neck: [[-0.1, 0.03], [0, 0.05], [0.5, 0.047], [1.0, 0.049], [1.1, 0.03]],
};

function pelvisGeometry() {
  return loftGeometry([
    { y: -0.12, rx: 0.04, rz: 0.06, cx: -0.02 },
    { y: -0.1, rx: 0.105, rz: 0.14, cx: -0.03 },
    { y: -0.05, rx: 0.128, rz: 0.168, cx: -0.02 },
    { y: 0.02, rx: 0.118, rz: 0.162, cx: -0.005 },
    { y: 0.07, rx: 0.108, rz: 0.15, cx: 0 },
    { y: 0.09, rx: 0.07, rz: 0.09, cx: 0 },
  ].map((s) => ({ ...s, p: 2.3 })), 32);
}

const JACKET_P = 2.4;
const JACKET = [
  { y: 0.0, rx: 0.06, rz: 0.08, cx: -0.005 },
  { y: 0.02, rx: 0.127, rz: 0.173, cx: -0.005 },
  { y: 0.07, rx: 0.126, rz: 0.172, cx: 0.0 },
  { y: 0.18, rx: 0.117, rz: 0.16, cx: 0.01 },
  { y: 0.3, rx: 0.124, rz: 0.168, cx: 0.015 },
  { y: 0.4, rx: 0.128, rz: 0.183, cx: 0.015 },
  { y: 0.465, rx: 0.12, rz: 0.19, cx: 0.005 },
  { y: 0.52, rx: 0.1, rz: 0.165, cx: 0.0 },
  { y: 0.56, rx: 0.075, rz: 0.1, cx: 0.01 },
  { y: 0.595, rx: 0.06, rz: 0.065, cx: 0.02 },
  { y: 0.615, rx: 0.035, rz: 0.035, cx: 0.025 },
];

function jacketGeometry() {
  return loftGeometry(JACKET.map((s) => ({ ...s, p: JACKET_P })), 36);
}

/**
 * A point resting on the jacket surface (torso space), lifted off it by `lift`.
 * face: 'front' | 'back' | 'side' | 'top' — which part of the cross-section to sit on.
 */
function onJacket(face, y, z, lift = 0.008) {
  let i = 0;
  while (i < JACKET.length - 2 && y > JACKET[i + 1].y) i++;
  const a = JACKET[i];
  const b = JACKET[i + 1];
  const t = THREE.MathUtils.clamp((y - a.y) / (b.y - a.y), 0, 1);
  const rx = THREE.MathUtils.lerp(a.rx, b.rx, t);
  const rz = THREE.MathUtils.lerp(a.rz, b.rz, t);
  const cx = THREE.MathUtils.lerp(a.cx, b.cx, t);
  if (face === 'side') return v3(cx, y, Math.sign(z) * (rz + lift));
  if (face === 'top') return v3(cx, y + lift, z);
  const q = Math.min(Math.abs(z) / rz, 0.999);
  const depth = rx * Math.pow(1 - Math.pow(q, JACKET_P), 1 / JACKET_P);
  return v3(cx + (face === 'front' ? 1 : -1) * (depth + lift), y, z);
}

// Flat webbing swept along a curve; its flat side faces away from the torso core.
function ribbonGeometry(points, width, thickness, segments = 64) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const core = v3(0, 0.32, 0);
  const positions = [];
  const indices = [];
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const P = curve.getPointAt(i / segments);
    curve.getTangentAt(i / segments, T);
    N.subVectors(P, core).normalize();
    B.crossVectors(T, N).normalize();
    N.crossVectors(B, T).normalize();
    for (const [sb, sn] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      positions.push(
        P.x + B.x * sb * width * 0.5 + N.x * sn * thickness * 0.5,
        P.y + B.y * sb * width * 0.5 + N.y * sn * thickness * 0.5,
        P.z + B.z * sb * width * 0.5 + N.z * sn * thickness * 0.5,
      );
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k;
      const b = i * 4 + ((k + 1) % 4);
      indices.push(a, b, a + 4, b, b + 4, a + 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Shoulder straps: out of the pack top, over the shoulder, down the chest,
// under the arm and back into the bottom corner of the pack.
function strapGeometry(s) {
  const pts = [
    v3(-0.14, 0.46, s * 0.07),
    onJacket('back', 0.5, s * 0.08),
    onJacket('back', 0.55, s * 0.088),
    onJacket('top', 0.575, s * 0.092),
    onJacket('front', 0.55, s * 0.095),
    onJacket('front', 0.48, s * 0.1),
    onJacket('front', 0.38, s * 0.1),
    onJacket('front', 0.28, s * 0.105),
    onJacket('front', 0.2, s * 0.125),
    onJacket('side', 0.15, s),
    onJacket('back', 0.15, s * 0.14),
    v3(-0.13, 0.16, s * 0.115),
  ];
  return ribbonGeometry(pts, 0.042, 0.007, 72);
}

function sternumStrapGeometry() {
  const pts = [-0.1, -0.05, 0, 0.05, 0.1].map((z) => onJacket('front', 0.38, z, 0.011));
  return ribbonGeometry(pts, 0.016, 0.005, 24);
}

function shoeGeometry() {
  const S = [
    [-0.082, 0.02, 0.02, -0.065], [-0.075, 0.037, 0.04, -0.058], [-0.055, 0.044, 0.05, -0.05],
    [-0.02, 0.046, 0.058, -0.042], [0.02, 0.046, 0.052, -0.048], [0.07, 0.049, 0.043, -0.057],
    [0.12, 0.05, 0.034, -0.066], [0.16, 0.046, 0.027, -0.073], [0.19, 0.035, 0.02, -0.08], [0.205, 0.015, 0.01, -0.088],
  ];
  return loftAlongX(S.map(([x, w, h, cy]) => ({ x, halfWidth: w, halfHeight: h, cy, p: 2.5 })), 24);
}

function ellipsoid(rx, ry, rz, w = 20, h = 14) {
  const g = new THREE.SphereGeometry(1, w, h);
  g.scale(rx, ry, rz);
  return g;
}

function buildHead(m, mesh) {
  const head = new THREE.Group();

  const skull = new THREE.SphereGeometry(1, 36, 28);
  const p = skull.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    const y = p.getY(i);
    let z = p.getZ(i);
    if (y < 0) {
      // Narrower jaw, chin slightly forward.
      const t = -y;
      z *= 1 - 0.18 * t;
      x += 0.12 * t * Math.max(x, 0);
    }
    p.setXYZ(i, x * 0.098, y * 0.117, z * 0.079);
  }
  skull.computeVertexNormals();
  head.add(mesh(skull, m.skin));

  const hair = ellipsoid(0.086, 0.078, 0.0805);
  hair.translate(-0.02, -0.004, 0);
  head.add(mesh(hair, m.hair));

  const helmet = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  helmet.scale(0.128, 0.122, 0.104);
  const helmetMesh = mesh(helmet, m.helmet);
  helmetMesh.position.set(-0.012, 0.022, 0);
  helmetMesh.rotation.z = -0.14;
  head.add(helmetMesh);

  const glasses = new THREE.CylinderGeometry(1, 1, 0.034, 24, 1, true, Math.PI / 2 - 0.8, 1.6);
  glasses.scale(0.102, 1, 0.084);
  const glassesMesh = mesh(glasses, m.glasses);
  glassesMesh.position.set(0.002, 0.008, 0);
  head.add(glassesMesh);

  const nose = new THREE.ConeGeometry(0.013, 0.032, 10);
  nose.rotateZ(-Math.PI / 2);
  nose.translate(0.1, -0.018, 0);
  head.add(mesh(nose, m.skin));

  for (const s of [-1, 1]) {
    const ear = ellipsoid(0.012, 0.022, 0.01, 10, 8);
    ear.translate(-0.008, -0.005, s * 0.079);
    head.add(mesh(ear, m.skin));
  }
  return head;
}

const _M = new THREE.Matrix4();
const _euler = new THREE.Euler();
const _dir = new THREE.Vector3();
const _hip = new THREE.Vector3();
const _knee = new THREE.Vector3();
const _ankle = new THREE.Vector3();
const _ankleOut = new THREE.Vector3();
const _shoulder = new THREE.Vector3();
const _elbow = new THREE.Vector3();
const _wrist = new THREE.Vector3();
const _wristOut = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _neck = new THREE.Vector3();
const _headPos = new THREE.Vector3();

function placeSegment(mesh, a, b) {
  mesh.position.copy(a);
  _dir.subVectors(b, a).normalize();
  mesh.quaternion.setFromUnitVectors(DOWN, _dir);
}

export class Rider {
  constructor() {
    const m = (this.materials = createRiderMaterials());
    this.group = new THREE.Group();
    this.group.name = 'rider';

    const mesh = (geometry, material) => {
      const o = new THREE.Mesh(geometry, material);
      o.castShadow = true;
      o.receiveShadow = true;
      return o;
    };

    // Torso: pelvis in trousers, jacket over it, small daypack with straps.
    this.torso = new THREE.Group();
    this.torso.add(mesh(pelvisGeometry(), m.pants), mesh(jacketGeometry(), m.jacket));
    const pack = mesh(new RoundedBoxGeometry(0.11, 0.36, 0.27, 3, 0.035), m.pack);
    pack.position.set(-0.168, 0.31, 0);
    pack.rotation.z = 0.05;
    this.torso.add(pack);
    for (const s of [-1, 1]) this.torso.add(mesh(strapGeometry(s), m.strap));
    this.torso.add(mesh(sternumStrapGeometry(), m.strap));
    const buckle = mesh(new RoundedBoxGeometry(0.012, 0.026, 0.034, 2, 0.004), m.glasses);
    buckle.position.copy(onJacket('front', 0.38, 0, 0.015));
    this.torso.add(buckle);
    this.group.add(this.torso);

    const thighGeo = limbGeometry(RIDER.thigh, PROFILES.thigh, 20);
    const shinGeo = limbGeometry(RIDER.shin, PROFILES.shin, 20);
    const shoeGeo = shoeGeometry();
    const kneeGeo = new THREE.SphereGeometry(0.056, 16, 12);
    this.legs = [0, 1].map(() => {
      const leg = {
        thigh: mesh(thighGeo, m.pants),
        shin: mesh(shinGeo, m.pants),
        knee: mesh(kneeGeo, m.pants),
        foot: mesh(shoeGeo, m.shoe),
      };
      this.group.add(leg.thigh, leg.shin, leg.knee, leg.foot);
      return leg;
    });

    const upperGeo = limbGeometry(RIDER.upperArm, PROFILES.upperArm, 18);
    const foreGeo = limbGeometry(RIDER.forearm, PROFILES.forearm, 18);
    const palmGeo = limbGeometry(RIDER.wristFromGrip.length(), PROFILES.palm, 14);
    const fistGeo = ellipsoid(0.041, 0.043, 0.052, 16, 12);
    const deltoidGeo = new THREE.SphereGeometry(0.062, 16, 12);
    const elbowGeo = new THREE.SphereGeometry(0.042, 14, 10);
    this.arms = [0, 1].map(() => {
      const arm = {
        deltoid: mesh(deltoidGeo, m.jacket),
        upper: mesh(upperGeo, m.jacket),
        elbow: mesh(elbowGeo, m.jacket),
        fore: mesh(foreGeo, m.jacket),
        palm: mesh(palmGeo, m.skin),
        fist: mesh(fistGeo, m.skin),
      };
      this.group.add(...Object.values(arm));
      return arm;
    });

    this.neck = mesh(limbGeometry(0.09, PROFILES.neck, 16), m.skin);
    this.head = buildHead(m, mesh);
    this.group.add(this.neck, this.head);
  }

  /**
   * pose: { pedals: [V3, V3], pitches: [r, l], grips: [V3, V3], crankAngle }, all in bike space.
   * Index 0 is the right side (+Z).
   */
  update(pose, time) {
    const { pedals, pitches, grips, crankAngle } = pose;

    // Subtle life: breathing, pelvis rocking with each stroke, a slow look around.
    const lean = RIDER.lean + Math.sin(time * 1.15) * 0.01;
    const roll = Math.sin(crankAngle) * 0.028;
    const yaw = Math.sin(crankAngle) * 0.012;
    const bob = Math.cos(crankAngle * 2) * 0.004;
    this.torso.position.copy(RIDER.hipCenter);
    this.torso.position.y += bob;
    _euler.set(roll, yaw, -lean, 'XYZ');
    this.torso.quaternion.setFromEuler(_euler);
    this.torso.updateMatrix();
    _M.copy(this.torso.matrix);

    for (let i = 0; i < 2; i++) {
      const s = i === 0 ? 1 : -1;
      const leg = this.legs[i];
      const pitch = pitches[i];
      const c = Math.cos(pitch);
      const sn = Math.sin(pitch);
      const { x: bx, y: by } = RIDER.ankleFromBall;

      _hip.set(RIDER.hipJoint.x, RIDER.hipJoint.y, s * RIDER.hipJoint.z).applyMatrix4(_M);
      _ankle.set(pedals[i].x + bx * c - by * sn, pedals[i].y + bx * sn + by * c, pedals[i].z - s * 0.004);
      _pole.set(1, 0.25, s * 0.12);
      solveTwoBone(_hip, _ankle, RIDER.thigh, RIDER.shin, _pole, _knee, _ankleOut);

      placeSegment(leg.thigh, _hip, _knee);
      placeSegment(leg.shin, _knee, _ankleOut);
      leg.knee.position.copy(_knee);
      leg.foot.position.copy(_ankleOut);
      leg.foot.rotation.set(0, 0, pitch);

      const arm = this.arms[i];
      const sj = RIDER.shoulderJoint;
      _shoulder.set(sj.x, sj.y, s * sj.z).applyMatrix4(_M);
      _wrist.copy(grips[i]).add(RIDER.wristFromGrip);
      _pole.set(-0.25, -0.5, s * 0.85);
      solveTwoBone(_shoulder, _wrist, RIDER.upperArm, RIDER.forearm, _pole, _elbow, _wristOut);

      arm.deltoid.position.copy(_shoulder);
      placeSegment(arm.upper, _shoulder, _elbow);
      arm.elbow.position.copy(_elbow);
      placeSegment(arm.fore, _elbow, _wristOut);
      placeSegment(arm.palm, _wristOut, grips[i]);
      arm.fist.position.set(grips[i].x + 0.004, grips[i].y + 0.008, grips[i].z);
    }

    _neck.copy(RIDER.neckBase).applyMatrix4(_M);
    _headPos.set(_neck.x + 0.06, _neck.y + 0.135, _neck.z);
    this.head.position.copy(_headPos);
    _euler.set(-roll * 0.5, Math.sin(time * 0.13) * 0.08 + Math.sin(time * 0.31) * 0.03, -0.06, 'YXZ');
    this.head.quaternion.setFromEuler(_euler);
    _headPos.x -= 0.015;
    _headPos.y -= 0.05;
    _neck.addScaledVector(_dir.subVectors(_neck, _headPos).normalize(), 0.02);
    placeSegment(this.neck, _neck, _headPos);
  }
}
