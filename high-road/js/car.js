import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { box, cyl, merge, paint } from './props.js';
import { profile, roundPoly, wheel, arch, Shadow } from './vehicles.js';

// Our own car: a low grand-tourer coupe, built from side profiles like the traffic, with
// wheels that roll and steer, a body that leans and pitches, and a cabin for the cockpit view.
// Local frame: origin on the ground midway between the axles, -z forward, x right.

const GLASS = 0x07090b;
const TRIM = 0x0e0f10;
const CARBON = 0x18191b;
const CABIN = 0x1c1c1e;
const R_FRONT = 0.345, R_REAR = 0.355;
const U_REAR = 0.98, U_FRONT = 3.62;        // axle positions from the tail (m)
const MID = (U_REAR + U_FRONT) / 2;          // origin sits here
export const WHEELBASE = U_FRONT - U_REAR;
export const TRACK = 0.845;                   // half track (wheel centre x)
export const CAR_LEN = 4.56;

// the tail-based authoring frame: u along the car from its rear, y up
const shift = (g) => { g.translate(0, 0, MID); return g; };

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// plan and section taper: the sides tuck in toward the roof (tumblehome) and the
// nose and tail narrow, so the extrusions read as a shaped body rather than a slab
const taper = (u, y) => (1 - 0.17 * ss(0.6, 1.3, y)) * (1 - 0.11 * ss(3.75, 4.6, u)) * (1 - 0.08 * ss(0.7, 0.0, u));

// A body panel: side profile extruded across the width with a generous bevel, then
// tapered and smooth-shaded. Authored in the tail frame, returned in the car frame.
function panel(pts, width, color, rough, metal, bevel = 0.08, radius = 0.14) {
  const shape = new THREE.Shape(roundPoly(pts, radius));
  const depth = Math.max(0.01, width - bevel * 2);
  let g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.45, bevelSegments: 4, curveSegments: 1 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, -depth / 2, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const u = -P.getZ(i), y = P.getY(i);
    P.setX(i, P.getX(i) * taper(u, y));
  }
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
  g.translate(0, 0, MID);
  return paint(g, color, rough, metal);
}
const atU = (w, h, d, x, y, u, color, rough, metal, emissive) => box(w, h, d, x, y, -u + MID, color, rough, metal, emissive);

function bodyGeometry(color) {
  const p = [];
  const P = (g) => p.push(shift(g));
  // wheel-arch openings cut into every side profile: the bottom edge, running toward the
  // tail, climbs over each wheel along a circle a little larger than the tyre
  const ARCH_F = [U_FRONT, R_FRONT, R_FRONT + 0.055], ARCH_R = [U_REAR, R_REAR, R_REAR + 0.06];
  const arc = ([uc, yc, r], yCut) => {
    const dx = Math.sqrt(Math.max(r * r - (yCut - yc) ** 2, 0));
    const a0 = Math.atan2(yCut - yc, dx), out = [];
    for (let k = 0; k <= 12; k++) { const a = a0 + ((Math.PI - 2 * a0) * k) / 12; out.push([uc + r * Math.cos(a), yc + r * Math.sin(a), 0.01]); }
    return out;
  };
  // lower body: tail, deck, beltline, bonnet and nose
  p.push(panel([[0.06, 0.30, 0.05], [0.0, 0.50, 0.1], [0.03, 0.84, 0.14], [0.13, 0.925, 0.04], [0.58, 0.95, 0.3], [1.0, 0.975, 0.12],
    [2.95, 0.985, 0.25], [3.2, 0.95, 0.35], [4.12, 0.79, 0.4], [4.47, 0.66, 0.2], [4.56, 0.47, 0.13], [4.54, 0.26, 0.04], [4.2, 0.24, 0.05],
    ...arc(ARCH_F, 0.245), [2.6, 0.24, 0.05], [1.6, 0.25, 0.05], ...arc(ARCH_R, 0.255), [0.42, 0.26, 0.05]],
    1.84, color, 0.22, 0.6, 0.12));
  // wide haunches over the rear wheels and swollen front wings
  p.push(panel([[0.36, 0.34], [0.36, 0.84, 0.25], [0.95, 0.965, 0.35], [1.75, 0.9, 0.3], [1.95, 0.34], ...arc(ARCH_R, 0.34)], 1.98, color, 0.22, 0.6, 0.12));
  p.push(panel([[3.0, 0.34], [3.05, 0.86, 0.3], [3.75, 0.86, 0.3], [4.28, 0.72, 0.2], [4.32, 0.34], ...arc(ARCH_F, 0.34)], 1.95, color, 0.22, 0.6, 0.12));
  // glasshouse: fastback rear glass, roof, raked windscreen
  p.push(panel([[0.98, 0.965, 0.04], [1.6, 1.215, 0.35], [2.3, 1.265, 0.35], [2.8, 1.215, 0.22], [3.16, 0.975, 0.04]], 1.46, GLASS, 0.05, 0, 0.06));
  p.push(panel([[1.62, 1.215], [2.76, 1.215], [2.74, 1.27, 0.2], [2.3, 1.29, 0.3], [1.66, 1.25]], 1.4, color, 0.24, 0.6, 0.04));
  for (const s of [-1, 1]) {
    // A-pillars and sail panels framing the side glass
    const a = profile([[2.78, 1.2], [3.13, 0.97], [3.2, 0.975], [2.84, 1.235]], 0.07, color, 0.24, 0.6, 0.015);
    a.translate(s * 0.64, 0, 0); P(a);
    const c = profile([[0.98, 0.965], [1.62, 1.215], [1.92, 1.2], [1.48, 0.965]], 0.06, color, 0.24, 0.6, 0.015);
    c.translate(s * 0.66, 0, 0); P(c);
    p.push(atU(0.03, 0.2, 0.06, s * 0.665, 1.08, 1.98, TRIM, 0.5, 0.2));
    // mirrors
    p.push(atU(0.16, 0.09, 0.2, s * 1.03, 1.03, 2.86, color, 0.24, 0.6));
    p.push(atU(0.1, 0.03, 0.05, s * 0.95, 1.0, 2.9, TRIM, 0.5, 0.3));
    // side skirt between the arches
    p.push(atU(0.07, 0.09, 1.7, s * 0.93, 0.29, 2.3, CARBON, 0.45, 0.2));
    // lamps: slim headlamps and a wraparound tail lamp
    p.push(atU(0.44, 0.065, 0.16, s * 0.58, 0.665, 4.47, 0xe9eef2, 0.05, 0.4, 0.45));
    p.push(atU(0.3, 0.025, 0.1, s * 0.56, 0.625, 4.53, 0xdfe8ff, 0.1, 0.2, 0.9));
    p.push(atU(0.44, 0.1, 0.08, s * 0.58, 0.79, -0.035, 0x1a0707, 0.1, 0.3));
    p.push(atU(0.42, 0.035, 0.085, s * 0.58, 0.79, -0.04, 0xff1a10, 0.2, 0, 1.6));
    p.push(cyl(0.05, 0.14, s * 0.24, 0.36, 0.06 + MID, 0x2b2c2d, 0.3, 0.9, 'z', 12));
  }
  p.push(atU(0.74, 0.018, 0.08, 0, 0.79, -0.03, 0xff1a10, 0.2, 0, 1.2));
  // nose intake, splitter, diffuser
  p.push(atU(1.24, 0.17, 0.08, 0, 0.39, 4.6, TRIM, 0.6, 0.1));
  for (const sx of [-1, 1]) p.push(atU(0.26, 0.12, 0.08, sx * 0.72, 0.42, 4.5, TRIM, 0.6, 0.1));
  p.push(atU(1.7, 0.03, 0.18, 0, 0.245, 4.5, CARBON, 0.4, 0.2));
  p.push(atU(1.56, 0.2, 0.3, 0, 0.33, 0.1, CARBON, 0.5, 0.2));
  p.push(atU(1.66, 0.04, 0.06, 0, 0.47, 0.0, CARBON, 0.45, 0.2));
  for (let i = -2; i <= 2; i++) p.push(atU(0.025, 0.14, 0.3, i * 0.24, 0.3, 0.12, TRIM, 0.5, 0.2));
  p.push(atU(0.48, 0.11, 0.02, 0, 0.6, -0.06, 0xe9e7da, 0.4, 0));
  // dark wells behind the wheels
  const wells = [];
  arch(wells, U_REAR, R_REAR - 0.02, 1.3);
  arch(wells, U_FRONT, R_FRONT - 0.02, 1.3);
  for (const g of wells) p.push(shift(g));
  return merge(p);
}

// A wheel centred on its hub, rolling about x.
function wheelGeometry(r, side) {
  const p = [];
  wheel(p, 0, 0, r, 0.27, 0x2c2e31);
  // ten bright split spokes over the dark wheel face
  for (let k = 0; k < 10; k++) {
    const g = new THREE.BoxGeometry(0.02, r * 0.56, 0.035);
    g.translate(side * 0.155, r * 0.3, 0);
    g.rotateX((k / 10) * Math.PI * 2);
    g.translate(0, r, 0);
    p.push(paint(g, 0xb4b8bd, 0.3, 0.9));
  }
  // brake disc and caliper peeking through the spokes
  p.push(cyl(r * 0.52, 0.03, -side * 0.06, r, 0, 0x55585b, 0.45, 0.8, 'x', 20));
  const g = merge(p);
  g.translate(0, -r, 0);
  return g;
}

function caliperGeometry(r, side) {
  const g = box(0.06, 0.2, 0.09, -side * 0.08, r * 0.38, 0, 0xc01818, 0.35, 0.3);
  return g;
}

// Cabin seen from the driver's seat (left-hand drive): dash, binnacle, pillars, roof.
function cabinGeometry() {
  const p = [];
  const P = (g) => p.push(shift(g));
  P(profile([[2.66, 0.66], [2.68, 0.83, 0.05], [2.9, 0.865, 0.08], [3.14, 0.93, 0.04], [3.14, 0.66]], 1.66, CABIN, 0.85, 0, 0.03, 0, 0.05));
  // binnacle hood and dials
  P((() => { const g = profile([[2.7, 0.84], [2.74, 0.935, 0.04], [2.88, 0.945, 0.04], [2.92, 0.865]], 0.42, CABIN, 0.8, 0, 0.02); g.translate(-0.37, 0, 0); return g; })());
  for (const dx of [-0.1, 0.1]) p.push(shift(cyl(0.06, 0.01, -0.37 + dx, 0.885, -2.745, 0x6a8fb0, 0.3, 0, 'z', 20)));
  for (const dx of [-0.1, 0.1]) p.push(atU(0.006, 0.045, 0.012, -0.37 + dx, 0.9, 2.752, 0xff6a20, 0.3, 0, 1.2));
  // centre screen and vents
  p.push(atU(0.3, 0.13, 0.02, 0.02, 0.9, 2.77, 0x0f1a24, 0.2, 0, 0.35));
  for (const x of [-0.6, 0.6, 0.15]) p.push(atU(0.16, 0.05, 0.03, x, 0.8, 2.685, 0x2a2b2d, 0.6, 0.4));
  for (const s of [-1, 1]) {
    // A-pillars from the cowl up to the roof
    const a = new THREE.BoxGeometry(0.075, 0.62, 0.085);
    a.rotateX(0.98);
    a.translate(s * 0.665, 1.13, -(2.94 - MID));
    p.push(paint(a, CABIN, 0.85, 0));
    // door tops and window sills
    p.push(atU(0.12, 0.08, 1.5, s * 0.74, 0.9, 2.15, 0x222224, 0.8, 0));
    p.push(atU(0.04, 0.04, 1.4, s * 0.78, 0.955, 2.15, 0x3a3b3e, 0.5, 0.6));
  }
  // roof header, liner and mirror
  // (raised a little above the real roofline so the view isn't all headliner)
  p.push(atU(1.42, 0.07, 0.14, 0, 1.315, 2.68, CABIN, 0.9, 0));
  p.push(atU(1.36, 0.02, 1.15, 0, 1.335, 2.1, 0x2a2a2c, 0.95, 0));
  p.push(atU(0.2, 0.055, 0.025, 0.0, 1.25, 2.66, 0x1a1a1a, 0.5, 0.2));
  p.push(atU(0.18, 0.04, 0.004, 0.0, 1.25, 2.645, 0x6f7f8f, 0.05, 0.9));
  p.push(atU(0.015, 0.05, 0.015, 0.0, 1.29, 2.66, 0x1a1a1a, 0.5, 0.2));
  // bonnet seen over the dash
  P(profile([[3.12, 0.82], [3.12, 0.952, 0.02], [3.2, 0.95, 0.3], [4.12, 0.79, 0.4], [4.47, 0.66, 0.2], [4.47, 0.6]], 1.9, 0xffffff, 0.22, 0.6, 0.06));
  return p;
}

function steeringGeometry() {
  const p = [];
  const rim = new THREE.TorusGeometry(0.175, 0.022, 10, 36);
  p.push(paint(rim, 0x151515, 0.7, 0));
  for (const a of [Math.PI / 2 + 0.2, Math.PI / 2 - 0.2 + Math.PI, -Math.PI / 2]) {
    const g = new THREE.BoxGeometry(0.16, 0.03, 0.02);
    g.translate(0.08, 0, 0);
    g.rotateZ(a);
    p.push(paint(g, 0x2b2c2e, 0.5, 0.4));
  }
  p.push(cyl(0.05, 0.05, 0, 0, 0.0, 0x222222, 0.6, 0.2, 'z', 16));
  p.push(box(0.04, 0.02, 0.012, 0, 0.17, -0.012, 0xc81e1e, 0.4, 0));
  return merge(p);
}

export class PlayerCar {
  constructor(scene, propMaterial, interiorMaterial, shadowMat) {
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.material = propMaterial;
    this.exterior = new THREE.Mesh(new THREE.BufferGeometry(), propMaterial);
    this.exterior.frustumCulled = false;
    this.body.add(this.exterior);
    // cabin: dash etc. plus a bonnet repainted with the body colour
    const parts = cabinGeometry();
    this.cabinParts = parts;
    this.cabin = new THREE.Mesh(new THREE.BufferGeometry(), interiorMaterial);
    this.cabin.frustumCulled = false;
    this.body.add(this.cabin);
    this.steer = new THREE.Mesh(steeringGeometry(), interiorMaterial);
    this.steer.frustumCulled = false;
    this.steerPivot = new THREE.Group();
    this.steerPivot.position.set(-0.37, 0.8, -(2.62 - MID));
    this.steerPivot.rotation.x = -0.42;
    this.steerPivot.add(this.steer);
    this.body.add(this.steerPivot);

    this.wheels = [];
    for (const [u, r] of [[U_FRONT, R_FRONT], [U_REAR, R_REAR]]) for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * TRACK, r, -(u - MID));
      const spin = new THREE.Mesh(wheelGeometry(r, s), propMaterial);
      spin.frustumCulled = false;
      const cal = new THREE.Mesh(caliperGeometry(r, s), propMaterial);
      cal.frustumCulled = false;
      pivot.add(spin, cal);
      this.root.add(pivot);
      this.wheels.push({ pivot, spin, r, front: u === U_FRONT });
    }
    this.shadow = new Shadow(shadowMat);
    this.shadow.mesh.material = shadowMat;
    scene.add(this.root, this.shadow.mesh);

    // lamps for the night glows, in the body's local frame
    this.model = { lights: [] };
    for (const s of [-1, 1]) {
      this.model.lights.push({ kind: 'head', p: new THREE.Vector3(s * 0.6, 0.665, -(4.52 - MID)), size: 0.42 });
      this.model.lights.push({ kind: 'tail', p: new THREE.Vector3(s * 0.6, 0.8, -(-0.03 - MID)), size: 0.3 });
    }
    this.roll = 0; this.pitch = 0; this.rollV = 0; this.pitchV = 0;
    this.spinA = 0; this.steerA = 0; this.bump = 0;
    this.brake = 0;
    this.setPaint(0x9e0f12);
  }

  setPaint(color) {
    this.exterior.geometry.dispose();
    this.exterior.geometry = bodyGeometry(color);
    // bonnet piece (last cabin part) takes the paint; the rest keeps its own colours
    const parts = this.cabinParts.slice();
    const bonnet = parts.pop().clone();
    const c = new THREE.Color(color);
    const col = bonnet.attributes.color;
    for (let i = 0; i < col.count; i++) col.setXYZ(i, c.r, c.g, c.b);
    this.cabin.geometry.dispose();
    this.cabin.geometry = merge([...parts, bonnet]);
  }

  // mode: which parts show. 'none' hides the car, 'cabin' shows cockpit, 'full' the whole car
  setMode(mode) {
    this.root.visible = mode !== 'none';
    this.shadow.mesh.visible = mode !== 'none';
    this.exterior.visible = mode === 'full';
    this.cabin.visible = this.steerPivot.visible = mode === 'cabin';
    for (const w of this.wheels) w.pivot.visible = mode === 'full';
  }

  // f: road frame at the car's position (with lateral offset lat), speed (m/s),
  // accel (m/s²), latAcc (m/s², + toward the right)
  update(dt, f, lat, speed, accel, latAcc, t, sun) {
    const x = f.x + f.rx * lat, z = f.z + f.rz * lat;
    const y = f.y + 0.1;
    this.root.position.set(x, y, z);
    this.root.rotation.set(Math.atan(f.grade), f.heading + this.yawOff, 0, 'YXZ');
    // spring-damped lean: the body rolls out of a turn and squats or dives with the throttle
    const k = 26, c = 7.5;
    const rollT = latAcc * 0.009, pitchT = accel * 0.006;
    this.rollV += (k * (rollT - this.roll) - c * this.rollV) * dt;
    this.pitchV += (k * (pitchT - this.pitch) - c * this.pitchV) * dt;
    this.roll += this.rollV * dt; this.pitch += this.pitchV * dt;
    const vib = t * 11;
    this.bump = 0.0025 * Math.sin(vib) * Math.sin(vib * 0.37 + 1) + 0.0015 * Math.sin(vib * 2.3);
    this.body.position.y = this.bump;
    this.body.rotation.set(this.pitch, 0, this.roll, 'YXZ');
    // wheels
    this.spinA -= (speed * dt);
    const steerT = -Math.atan(WHEELBASE * f.curv) * 1.0 - this.yawRate * 0.3;
    this.steerA += (steerT - this.steerA) * Math.min(1, dt * 8);
    for (const w of this.wheels) {
      w.spin.rotation.x = this.spinA / w.r;
      w.pivot.rotation.y = w.front ? this.steerA : 0;
    }
    this.steer.rotation.z = this.steerA * 14;
    this.root.updateMatrixWorld(true);
    // contact shadow, from the bounding box
    const corners = [];
    const v = new THREE.Vector3();
    for (const xx of [-0.98, 0.98]) for (const yy of [0.25, 1.25]) for (const zz of [-(4.5 - MID), MID - 0.02]) {
      corners.push(v.set(xx, yy, zz).applyMatrix4(this.root.matrixWorld).clone());
    }
    this.shadow.update(corners, sun, f.y + 0.12, { x, z, tx: f.tx, tz: f.tz, grade: f.grade });
  }
  yawOff = 0;
  yawRate = 0;
}
