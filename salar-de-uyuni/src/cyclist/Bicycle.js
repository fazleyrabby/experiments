import * as THREE from 'three';
import { GeometryBatch, boxAt, cylinderBetween, sphereAt, tubeThrough, v3 } from '../geometry/builders.js';
import { loftAlongX } from '../geometry/loft.js';
import { createBikeMaterials } from './materials.js';

const DEG = Math.PI / 180;
const HEAD_ANGLE = 69 * DEG;
const SEAT_ANGLE = 73 * DEG;

// Hybrid / trail bike geometry in metres. Bike space: +X forward, +Y up, +Z rider's right.
// Origin sits on the ground directly below the bottom bracket.
export const BIKE = (() => {
  const wheelRadius = 0.346;
  const headTop = v3(0.42, 0.86, 0);
  const steerAxis = v3(Math.cos(HEAD_ANGLE), -Math.sin(HEAD_ANGLE), 0); // down the steerer
  return {
    wheelRadius,
    bb: v3(0, 0.28, 0),
    rearAxle: v3(-0.43, wheelRadius, 0),
    frontAxle: v3(0.66, wheelRadius, 0),
    headTop,
    headBottom: headTop.clone().addScaledVector(steerAxis, 0.15),
    steerAxis,
    seatDir: v3(-Math.cos(SEAT_ANGLE), Math.sin(SEAT_ANGLE), 0),
    crankLength: 0.17,
    chainringRadius: 0.076,
    cogRadius: 0.047,
    pedalOffset: 0.125,
    gripCenter: v3(0.454, 0.9637, 0.28),
  };
})();

const along = (p, d, t) => p.clone().addScaledVector(d, t);

function saddleGeometry() {
  const S = [
    [-0.142, 0.03, 0.008, 0.0],
    [-0.135, 0.062, 0.02, 0.002],
    [-0.115, 0.078, 0.026, 0.004],
    [-0.08, 0.077, 0.027, 0.004],
    [-0.04, 0.06, 0.025, 0.003],
    [0.0, 0.04, 0.023, 0.002],
    [0.05, 0.027, 0.021, 0.0],
    [0.1, 0.022, 0.019, -0.002],
    [0.13, 0.018, 0.015, -0.003],
    [0.142, 0.008, 0.007, -0.003],
  ];
  return loftAlongX(S.map(([x, w, h, cy]) => ({ x, halfWidth: w, halfHeight: h, cy, p: 2.6 })), 28);
}

function chainringGeometry(r, teeth) {
  const shape = new THREE.Shape();
  const n = teeth * 2;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = i % 2 === 0 ? r + 0.0035 : r - 0.0022;
    if (i === 0) shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, r - 0.012, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.003, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -0.0015);
  return g;
}

function buildWheel(materials, rear) {
  const b = new GeometryBatch();
  const rim = new THREE.TorusGeometry(0.3085, 0.0115, 10, 96);
  rim.scale(1, 1, 1.35);
  b.add('alloy', rim);
  b.add('rubber', new THREE.TorusGeometry(0.3225, 0.0235, 16, 128));
  b.add('alloy', cylinderBetween(v3(0, 0, -0.052), v3(0, 0, 0.052), 0.0165, 0.0165, 20));
  for (const s of [-1, 1]) {
    b.add('alloy', cylinderBetween(v3(0, 0, s * 0.028), v3(0, 0, s * 0.033), 0.028, 0.028, 24));
  }
  // 32 spokes, two-cross style tangential lacing.
  for (let i = 0; i < 32; i++) {
    const side = i % 2 ? 1 : -1;
    const a = (i / 32) * Math.PI * 2;
    const lead = ((i >> 1) % 2 ? 1 : -1) * 0.38;
    const hub = v3(Math.cos(a) * 0.024, Math.sin(a) * 0.024, side * 0.031);
    const rimP = v3(Math.cos(a + lead) * 0.299, Math.sin(a + lead) * 0.299, side * 0.004);
    b.add('spoke', cylinderBetween(hub, rimP, 0.00105, 0.00105, 4, false));
  }
  // Disc brake rotor on the left.
  b.add('rotor', cylinderBetween(v3(0, 0, -0.0455), v3(0, 0, -0.0437), 0.08, 0.08, 48));
  b.add('darkAlloy', cylinderBetween(v3(0, 0, -0.047), v3(0, 0, -0.042), 0.034, 0.034, 6));
  if (rear) {
    for (let k = 0; k < 9; k++) {
      const r = 0.062 - k * 0.0045;
      const z = 0.02 + k * 0.0038;
      b.add('rotor', cylinderBetween(v3(0, 0, z), v3(0, 0, z + 0.0019), r, r, 36));
    }
  }
  return b.build(materials);
}

export class Bicycle {
  constructor() {
    this.materials = createBikeMaterials();
    this.group = new THREE.Group();
    this.group.name = 'bicycle';
    this.buildFrame();
    this.buildSteering();
    this.buildDrivetrain();
    this.buildPedals();

    this.rearWheel = buildWheel(this.materials, true);
    this.rearWheel.position.copy(BIKE.rearAxle);
    this.group.add(this.rearWheel);
  }

  buildFrame() {
    const f = new GeometryBatch();
    const { bb, rearAxle: ra, headTop: ht, headBottom: hb, steerAxis: sa, seatDir } = BIKE;
    const seatTop = along(bb, seatDir, 0.52);
    const ttEnd = along(bb, seatDir, 0.465);

    f.add('paint', cylinderBetween(along(hb, sa, 0.008), along(ht, sa, -0.008), 0.024, 0.023, 24));
    f.add('paint', cylinderBetween(along(ht, sa, 0.03), ttEnd, 0.0185, 0.0165, 18));
    f.add('paint', cylinderBetween(along(hb, sa, -0.03), bb, 0.0245, 0.022, 18));
    f.add('paint', cylinderBetween(bb, seatTop, 0.0165, 0.0165, 18));
    f.add('paint', sphereAt(ttEnd, 0.0175));
    f.add('paint', cylinderBetween(v3(bb.x, bb.y, -0.037), v3(bb.x, bb.y, 0.037), 0.022, 0.022, 24));
    f.add('darkAlloy', cylinderBetween(along(seatTop, seatDir, -0.012), along(seatTop, seatDir, 0.012), 0.0195, 0.0195, 18));

    for (const s of [-1, 1]) {
      f.add('paint', tubeThrough([
        v3(bb.x - 0.03, bb.y + 0.004, s * 0.03), v3(-0.2, 0.305, s * 0.058), v3(ra.x + 0.02, ra.y - 0.004, s * 0.066),
      ], 0.0105, 24, 10));
      f.add('paint', tubeThrough([
        v3(seatTop.x - 0.012, seatTop.y - 0.04, s * 0.022), v3(-0.3, 0.56, s * 0.055), v3(ra.x + 0.014, ra.y + 0.012, s * 0.066),
      ], 0.0085, 24, 10));
      f.add('darkAlloy', boxAt(v3(ra.x + 0.008, ra.y + 0.004, s * 0.067), 0.045, 0.04, 0.007));
    }
    f.add('darkAlloy', boxAt(v3(ra.x + 0.03, ra.y + 0.078, -0.052), 0.055, 0.026, 0.028, -0.38));

    // Seat post, rails and saddle.
    const clamp = along(bb, seatDir, 0.648);
    f.add('alloy', cylinderBetween(along(seatTop, seatDir, -0.03), clamp, 0.0136, 0.0136, 16));
    f.add('darkAlloy', cylinderBetween(v3(clamp.x - 0.01, clamp.y + 0.004, -0.022), v3(clamp.x - 0.01, clamp.y + 0.004, 0.022), 0.011, 0.011, 12));
    for (const s of [-1, 1]) {
      f.add('alloy', tubeThrough([
        v3(-0.3, 0.912, s * 0.03), v3(-0.25, 0.905, s * 0.022), v3(-0.13, 0.905, s * 0.02), v3(-0.09, 0.914, s * 0.012),
      ], 0.0035, 16, 6));
    }
    const saddle = saddleGeometry();
    saddle.translate(-0.205, 0.926, 0);
    f.add('saddle', saddle);

    // Rear derailleur.
    const P1 = v3(ra.x + 0.005, ra.y - 0.065, 0.042);
    const P2 = v3(ra.x + 0.022, ra.y - 0.115, 0.042);
    for (const P of [P1, P2]) {
      f.add('darkAlloy', cylinderBetween(v3(P.x, P.y, P.z - 0.003), v3(P.x, P.y, P.z + 0.003), 0.016, 0.016, 18));
    }
    const mid = P1.clone().lerp(P2, 0.5);
    const cageTilt = Math.atan2(P2.x - P1.x, P1.y - P2.y);
    f.add('darkAlloy', boxAt(v3(mid.x, mid.y, 0.049), 0.03, 0.085, 0.003, cageTilt));
    f.add('darkAlloy', boxAt(v3(mid.x, mid.y, 0.035), 0.03, 0.085, 0.003, cageTilt));
    f.add('darkAlloy', boxAt(v3(ra.x - 0.012, ra.y - 0.035, 0.066), 0.03, 0.05, 0.016, 0.3));

    this.group.add(f.build(this.materials));
  }

  buildSteering() {
    const { headTop: ht, headBottom: hb, steerAxis: sa, frontAxle: fa } = BIKE;
    this.steer = new THREE.Group();
    this.steer.position.copy(ht);
    this.steerAxisUp = sa.clone().negate();
    this.group.add(this.steer);

    const rel = (x, y, z = 0) => v3(x - ht.x, y - ht.y, z);
    const relV = (p) => p.clone().sub(ht);
    const axis = (t) => sa.clone().multiplyScalar(t);
    const s = new GeometryBatch();

    // Headset, spacers, stem.
    s.add('darkAlloy', cylinderBetween(axis(0.004), axis(-0.018), 0.027, 0.026, 24));
    s.add('darkAlloy', cylinderBetween(axis(0.146), axis(0.166), 0.027, 0.027, 24));
    s.add('darkAlloy', cylinderBetween(axis(-0.018), axis(-0.075), 0.0175, 0.0175, 18));
    s.add('darkAlloy', sphereAt(axis(-0.077), 0.0175));
    const barC = rel(0.487, 0.932);
    s.add('darkAlloy', cylinderBetween(axis(-0.05), barC, 0.0165, 0.0155, 16));
    s.add('darkAlloy', cylinderBetween(barC.clone().setZ(-0.026), barC.clone().setZ(0.026), 0.02, 0.02, 18));

    // Riser bar with backsweep.
    const half = [[0.487, 0.932, 0.1], [0.481, 0.952, 0.19], [0.466, 0.961, 0.235], [0.44, 0.966, 0.345]];
    const barPts = [];
    for (let i = half.length - 1; i >= 0; i--) barPts.push(rel(half[i][0], half[i][1], -half[i][2]));
    barPts.push(rel(0.487, 0.932, 0));
    for (const h of half) barPts.push(rel(h[0], h[1], h[2]));
    s.add('darkAlloy', tubeThrough(barPts, 0.011, 64, 12));

    for (const side of [1, -1]) {
      const a = rel(0.4675, 0.9612, side * 0.212);
      const b = rel(0.4405, 0.9662, side * 0.347);
      s.add('grip', cylinderBetween(a, b, 0.0168, 0.0168, 18));
      s.add('grip', sphereAt(b, 0.0168));
      const lc = rel(0.483, 0.951, side * 0.178);
      s.add('darkAlloy', sphereAt(lc, 0.014));
      s.add('alloy', tubeThrough([lc, rel(0.51, 0.952, side * 0.205), rel(0.515, 0.945, side * 0.26), rel(0.505, 0.94, side * 0.29)], 0.0045, 16, 8));
      s.add('cable', tubeThrough([
        lc.clone().add(v3(0.012, 0.008, 0)), rel(0.56, 0.94, side * 0.13), rel(0.55, 0.83, side * 0.06), rel(0.5, 0.76, side * 0.035),
      ], 0.0025, 24, 6));
    }
    // Shifter pod on the right.
    s.add('darkAlloy', boxAt(rel(0.47, 0.94, 0.195), 0.03, 0.02, 0.025, 0.4));

    // Fork.
    const hbR = relV(hb);
    s.add('paint', cylinderBetween(hbR.clone().add(v3(0.004, -0.012, -0.058)), hbR.clone().add(v3(0.004, -0.012, 0.058)), 0.021, 0.021, 18));
    for (const side of [-1, 1]) {
      s.add('paint', tubeThrough([
        hbR.clone().add(v3(0.006, -0.014, side * 0.05)),
        relV(along(hb, sa, 0.2)).add(v3(0, 0, side * 0.052)),
        rel(0.625, 0.45, side * 0.053),
        rel(fa.x, fa.y, side * 0.053),
      ], 0.0135, 32, 12));
      s.add('darkAlloy', boxAt(rel(fa.x + 0.004, fa.y + 0.006, side * 0.054), 0.035, 0.04, 0.008));
    }
    s.add('darkAlloy', boxAt(rel(fa.x - 0.04, fa.y + 0.07, -0.058), 0.055, 0.026, 0.028, 0.52));

    this.steer.add(s.build(this.materials));
    this.gripLocal = [rel(BIKE.gripCenter.x, BIKE.gripCenter.y, BIKE.gripCenter.z), rel(BIKE.gripCenter.x, BIKE.gripCenter.y, -BIKE.gripCenter.z)];

    this.frontWheel = buildWheel(this.materials, false);
    this.frontWheel.position.copy(relV(fa));
    this.steer.add(this.frontWheel);
  }

  buildDrivetrain() {
    const { bb, rearAxle: ra, crankLength: L, chainringRadius: r1, cogRadius: r2 } = BIKE;
    this.crank = new THREE.Group();
    this.crank.position.copy(bb);
    this.group.add(this.crank);

    const c = new GeometryBatch();
    c.add('darkAlloy', cylinderBetween(v3(0, 0, -0.082), v3(0, 0, 0.082), 0.012, 0.012, 16));
    for (const s of [1, -1]) {
      const end = v3(s * L, 0, s * 0.09);
      c.add('alloy', cylinderBetween(v3(0, 0, s * 0.078), end, 0.013, 0.009, 14));
      c.add('alloy', sphereAt(v3(0, 0, s * 0.078), 0.0135));
      c.add('alloy', sphereAt(end, 0.0095));
      c.add('alloy', cylinderBetween(end, v3(s * L, 0, s * 0.162), 0.0055, 0.0055, 10));
    }
    const ring = chainringGeometry(r1, 36);
    ring.translate(0, 0, 0.062);
    c.add('darkAlloy', ring);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + 0.3;
      c.add('darkAlloy', cylinderBetween(v3(0, 0, 0.066), v3(Math.cos(a) * (r1 - 0.01), Math.sin(a) * (r1 - 0.01), 0.063), 0.006, 0.005, 8));
    }
    this.crank.add(c.build(this.materials));

    // Chain loop: chainring front -> lower run through derailleur pulleys -> around the cog.
    const chainZ = (x) => THREE.MathUtils.lerp(0.034, 0.062, THREE.MathUtils.clamp((x - ra.x) / (bb.x - ra.x), 0, 1));
    const pts = [];
    const push = (x, y) => pts.push(v3(x, y, chainZ(x)));
    for (let a = 95; a >= -95; a -= 15) push(bb.x + r1 * Math.cos(a * DEG), bb.y + r1 * Math.sin(a * DEG));
    const pr = 0.017;
    push(ra.x + 0.022 + pr * 0.4, ra.y - 0.115 - pr);
    push(ra.x + 0.022 - pr, ra.y - 0.115);
    push(ra.x + 0.005 + pr, ra.y - 0.065);
    for (let a = -60; a >= -270; a -= 15) push(ra.x + r2 * Math.cos(a * DEG), ra.y + r2 * Math.sin(a * DEG));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    this.chainLength = curve.getLength();
    const chainMat = this.materials.chain;
    chainMat.map.repeat.set(this.chainLength / 0.0254, 1);
    const chain = new THREE.Mesh(new THREE.TubeGeometry(curve, 220, 0.0035, 6, true), chainMat);
    chain.castShadow = true;
    this.group.add(chain);
  }

  buildPedals() {
    const b = new GeometryBatch();
    b.add('darkAlloy', boxAt(v3(0, 0, 0), 0.095, 0.018, 0.075));
    b.add('alloy', cylinderBetween(v3(0, 0, -0.04), v3(0, 0, 0.04), 0.008, 0.008, 10));
    const proto = b.build(this.materials);
    this.pedals = [proto, proto.clone()];
    this.group.add(...this.pedals);
  }

  /**
   * crankAngle: angle of the right crank arm in the bike's XY plane.
   * pedalPitch: [right, left] foot pitch; pedals spin freely and follow the shoe.
   */
  setState({ wheelAngle, crankAngle, steer, pedalPitch }) {
    this.rearWheel.rotation.z = -wheelAngle;
    this.frontWheel.rotation.z = -wheelAngle;
    this.crank.rotation.z = crankAngle;
    this.steer.quaternion.setFromAxisAngle(this.steerAxisUp, steer);
    this.steer.updateMatrix();

    const { bb, crankLength: L, pedalOffset } = BIKE;
    for (let i = 0; i < 2; i++) {
      const a = crankAngle + i * Math.PI;
      const p = this.pedals[i];
      p.position.set(bb.x + Math.cos(a) * L, bb.y + Math.sin(a) * L, (i === 0 ? 1 : -1) * pedalOffset);
      p.rotation.z = pedalPitch[i];
    }

    const map = this.materials.chain.map;
    map.offset.x = ((crankAngle * BIKE.chainringRadius) / this.chainLength) * map.repeat.x;
  }

  pedalPosition(i, out) {
    return out.copy(this.pedals[i].position);
  }

  gripPosition(i, out) {
    return out.copy(this.gripLocal[i]).applyMatrix4(this.steer.matrix);
  }
}
