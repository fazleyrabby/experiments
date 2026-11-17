// Toy-car dynamics. On the track a car lives in track coordinates: arc length s,
// lateral offset d, heading psi relative to the track tangent, plus car-frame
// velocities (u forward, v right) and yaw rate r. Tyre forces come from slip
// angles with a soft saturation; gravity is split along the track frame, so the
// ramp slows you and the banked hairpins hold you in. When the normal load goes
// negative (the kicker) or the track runs out (the gap) the car flies as a rigid
// body until it touches the track or the desk again.
// Units: cm, s. Real gravity, so the little cars fall like little cars.
import * as THREE from 'three';
import { HALF_W, BOOKS, BOOK_TOP } from './track.js';

export const G = 981;
const MU = 0.42, MU_R = 0.44, ALPHA_P = 0.11;
// power-limited drive plus air drag: about 0.5 s to half speed, top out near 72 cm/s
// (roughly 165 km/h at 1:64), so the cars move like scale cars rather than slot cars
const A0 = 230, POWER = 5200, DRAG = 0.011, BRAKE = 380, ROLL = 14;
const SUB = 4;

const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4();
const floorAt = (x, z) => (x > BOOKS.x0 && x < BOOKS.x1 && z > BOOKS.z0 && z < BOOKS.z1 ? BOOK_TOP : 0);
const sat = (x) => Math.sin(1.45 * Math.atan(x));

export class CarBody {
  constructor(track, car) {
    this.track = track;
    this.len = car.length; this.wid = car.width;
    this.a = car.cgToFront * 0.95; this.b = car.cgToRear * 0.95;
    this.k2 = (this.a * this.a + this.b * this.b) * 0.45;
    this.input = { throttle: 0, brake: 0, steer: 0, handbrake: 0 };
    this.steer = 0; this.delta = 0;
    this.power = 1; this.draft = 0;   // engine multiplier, slipstream 0..1
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.quat = new THREE.Quaternion(); this.omega = new THREE.Vector3();
    this.events = [];
    this.reset(0, 0);
  }

  reset(s, d) {
    this.s = this.track.wrapS(s); this.d = d; this.psi = 0; this.u = 0; this.v = 0; this.r = 0;
    this.air = false; this.crashed = 0; this.airTime = 0; this.lastGroundS = this.s; this.hint = -1;
    this.spin = 0; this.ghost = 0; this.wallScrape = 0; this.slip = 0;
    this.updatePose();
  }

  // the steering lock shrinks with speed so full lock never asks for more than the tyres give
  maxDelta() { return 0.52 / (1 + Math.abs(this.u) / 45); }

  step(dt) {
    const h = dt / SUB;
    // steering rack: rate-limited toward the request
    const target = this.input.steer * this.maxDelta();
    const rate = 4.5 * h;
    this.delta += Math.max(-rate, Math.min(rate, target - this.delta));
    for (let i = 0; i < SUB; i++) {
      if (this.crashed > 0) { this.stepCrash(h); continue; }
      if (this.air) this.stepAir(h); else this.stepGround(h);
    }
    if (this.ghost > 0) this.ghost -= dt;
    this.spin += this.u * dt;
    this.updatePose();
  }

  stepGround(dt) {
    const tr = this.track, f = tr.sample(this.s);
    const { T, B, N } = f;
    const c = Math.cos(this.psi), sn = Math.sin(this.psi);
    const vT = this.u * c - this.v * sn;
    const vs = vT / (1 - f.kGeo * this.d);
    const load = G * N.y + vs * vs * f.kNorm;               // per unit mass
    if (f.gap || load < 0.12 * G) { this.launch(f, vs); return; }
    this.lastGroundS = this.s;
    const gT = -G * T.y, gB = -G * B.y;
    const gx = gT * c + gB * sn, gy = -gT * sn + gB * c;
    const L = this.a + this.b, Nf = load * this.b / L, Nr = load * this.a / L;
    const uu = Math.max(Math.abs(this.u), 9);
    const dir = this.u >= -1 ? 1 : -1;
    const af = Math.atan2(this.v + this.a * this.r, uu) - this.delta * dir;
    const ar = Math.atan2(this.v - this.b * this.r, uu);
    const inp = this.input;
    // longitudinal: drive, brake / reverse, rolling drag
    let Fx = 0;
    if (inp.brake > 0 && this.u > 2) Fx -= BRAKE * inp.brake;
    else if (inp.brake > 0) Fx -= 140 * inp.brake * Math.max(0, 1 + this.u / 20);
    if (inp.throttle > 0 && this.u > -2) Fx += inp.throttle * Math.min(A0, this.power * POWER / Math.max(1, this.u));
    else if (inp.throttle > 0) Fx += BRAKE * inp.throttle;
    Fx -= ROLL * Math.sign(this.u) * Math.min(1, Math.abs(this.u) / 3) + DRAG * (1 - 0.45 * this.draft) * this.u * Math.abs(this.u);
    if (inp.handbrake) Fx -= 200 * Math.sign(this.u) * Math.min(1, Math.abs(this.u) / 5);
    const muR = MU_R * (inp.handbrake ? 0.42 : 1);
    let Fyf = -MU * Nf * sat(af / ALPHA_P);
    const rearCap = Math.sqrt(Math.max(0.0001, (muR * Nr) ** 2 - Math.min((muR * Nr) ** 2 * 0.85, (Fx * 0.6) ** 2)));
    let Fyr = -rearCap * sat(ar / ALPHA_P);
    const cd = Math.cos(this.delta);
    let du = Fx + gx + this.v * this.r - Fyf * Math.sin(this.delta);
    let dv = Fyf * cd + Fyr + gy - this.u * this.r;
    let dr = (this.a * Fyf * cd - this.b * Fyr) / this.k2;
    this.u += du * dt; this.v += dv * dt; this.r += dr * dt;
    // creeping: kill the lateral jitter of a parked car
    if (Math.abs(this.u) < 6) { const k = Math.exp(-dt * 10); this.v *= k; this.r *= k; }
    this.slip = Math.max(Math.abs(ar), Math.abs(af)) * Math.min(1, Math.abs(this.u) / 30);
    // kinematics in the track frame
    const c2 = Math.cos(this.psi), s2 = Math.sin(this.psi);
    let vT2 = this.u * c2 - this.v * s2, vB2 = this.u * s2 + this.v * c2;
    const sdot = vT2 / (1 - f.kGeo * this.d);
    this.s = tr.wrapS(this.s + sdot * dt);
    this.d += vB2 * dt;
    this.psi += (this.r - f.kGeo * sdot) * dt;
    this.psi = Math.atan2(Math.sin(this.psi), Math.cos(this.psi));
    // walls
    const e = (this.len / 2) * Math.abs(Math.sin(this.psi)) + (this.wid / 2) * Math.abs(Math.cos(this.psi));
    const lim = HALF_W - e;
    if (Math.abs(this.d) > lim) {
      const side = Math.sign(this.d);
      const into = vB2 * side;
      this.d = side * lim;
      if (into > 0) {
        if (into > 12) this.events.push({ type: 'wall', v: into });
        this.wallScrape = Math.max(this.wallScrape, Math.abs(vT2) * 0.01);
        vB2 = -into * 0.22 * side;
        vT2 *= 1 - 0.18 * Math.min(1, into / 70);
        this.psi *= 0.82; this.r *= 0.55;
        this.u = vT2 * Math.cos(this.psi) + vB2 * Math.sin(this.psi);
        this.v = -vT2 * Math.sin(this.psi) + vB2 * Math.cos(this.psi);
      }
    }
  }

  launch(f, vs) {
    this.updatePose();
    const c = Math.cos(this.psi), sn = Math.sin(this.psi);
    const vT = this.u * c - this.v * sn, vB = this.u * sn + this.v * c;
    this.vel.copy(f.T).multiplyScalar(vT).addScaledVector(f.B, vB);
    this.omega.copy(f.N).multiplyScalar(this.r).addScaledVector(f.B, vs * f.kNorm);
    this.air = true; this.airTime = 0;
    this.events.push({ type: 'launch' });
  }

  stepAir(dt) {
    this.airTime += dt;
    this.vel.y -= G * dt;
    this.vel.multiplyScalar(1 - 0.02 * dt);
    this.pos.addScaledVector(this.vel, dt);
    // a little nose-down pitch as the rear wheels leave last
    tmpV.set(0, 0, 1).applyQuaternion(this.quat);
    this.omega.addScaledVector(tmpV, -1.6 * dt);
    const w = this.omega.length();
    if (w > 1e-6) { tmpQ.setFromAxisAngle(tmpV2.copy(this.omega).divideScalar(w), w * dt); this.quat.premultiply(tmpQ).normalize(); }
    // touch down on the track?
    const pr = this.track.project(this.pos, this.hint, this._pr || (this._pr = {}));
    this.hint = pr.i;
    if (!pr.gap && Math.abs(pr.d) < HALF_W + 0.2 && pr.h <= 0.02 && pr.h > -2.5 && pr.dist2 < 400 && this.airTime > 0.03 && this.vel.dot(this.track.sample(pr.s).N) < 0) {
      const f = this.track.sample(pr.s);
      const vT = this.vel.dot(f.T), vB = this.vel.dot(f.B), vN = this.vel.dot(f.N);
      tmpV.set(1, 0, 0).applyQuaternion(this.quat);
      this.psi = Math.atan2(tmpV.dot(f.B), tmpV.dot(f.T));
      if (Math.abs(this.psi) > 1.4) this.psi = Math.sign(this.psi) * 1.4;
      const c = Math.cos(this.psi), sn = Math.sin(this.psi);
      this.u = vT * c + vB * sn; this.v = (-vT * sn + vB * c) * 0.5;
      this.r = this.omega.dot(f.N) * 0.5;
      this.s = pr.s; this.d = Math.max(-HALF_W + 1.5, Math.min(HALF_W - 1.5, pr.d));
      this.air = false;
      this.events.push({ type: 'land', v: -vN });
      return;
    }
    // or the desk / the books?
    const floorY = floorAt(this.pos.x, this.pos.z);
    if (this.pos.y <= floorY) {
      this.pos.y = floorY;
      this.events.push({ type: 'crash', v: -this.vel.y });
      this.crashed = 1.1;
      this.vel.y = Math.abs(this.vel.y) * 0.25; this.vel.x *= 0.5; this.vel.z *= 0.5;
    }
  }

  stepCrash(dt) {
    // bounce, skid to a stop, then the hand of god puts it back on the track
    this.crashed -= dt;
    this.vel.y -= G * dt;
    this.pos.addScaledVector(this.vel, dt);
    const fy = floorAt(this.pos.x, this.pos.z);
    if (this.pos.y < fy) { this.pos.y = fy; this.vel.y = Math.abs(this.vel.y) * 0.2; this.vel.x *= 0.96; this.vel.z *= 0.96; }
    this.omega.multiplyScalar(0.985);
    const w = this.omega.length();
    if (w > 1e-6) { tmpQ.setFromAxisAngle(tmpV2.copy(this.omega).divideScalar(w), w * dt); this.quat.premultiply(tmpQ).normalize(); }
    if (this.crashed <= 0) this.respawn();
  }

  respawn() {
    let s = this.lastGroundS - 30;
    for (let k = 0; k < 40; k++) { const f = this.track.sample(s); if (!f.gap) break; s -= 5; }
    this.reset(s, 0);
    this.ghost = 1.5;
    this.events.push({ type: 'respawn' });
  }

  updatePose() {
    if (this.air || this.crashed > 0) return;
    const f = this.track.sample(this.s);
    this.pos.copy(f.p).addScaledVector(f.B, this.d);
    const c = Math.cos(this.psi), sn = Math.sin(this.psi);
    const fwd = tmpV.copy(f.T).multiplyScalar(c).addScaledVector(f.B, sn);
    const right = tmpV2.copy(f.T).multiplyScalar(-sn).addScaledVector(f.B, c);
    tmpM.makeBasis(fwd, f.N, right);
    this.quat.setFromRotationMatrix(tmpM);
    this.vel.copy(f.T).multiplyScalar(this.u * c - this.v * sn).addScaledVector(f.B, this.u * sn + this.v * c);
  }

  // world-space velocity -> car-frame (for collisions)
  setWorldVelocity(vel) {
    if (this.air || this.crashed > 0) { this.vel.copy(vel); return; }
    const f = this.track.sample(this.s);
    const vT = vel.dot(f.T), vB = vel.dot(f.B), c = Math.cos(this.psi), sn = Math.sin(this.psi);
    this.u = vT * c + vB * sn; this.v = -vT * sn + vB * c;
  }

  nudge(delta) {
    if (this.air || this.crashed > 0) { this.pos.add(delta); return; }
    const f = this.track.sample(this.s);
    this.s = this.track.wrapS(this.s + delta.dot(f.T));
    this.d = Math.max(-HALF_W + 1.2, Math.min(HALF_W - 1.2, this.d + delta.dot(f.B)));
  }

  get speed() { return this.air || this.crashed > 0 ? this.vel.length() : Math.hypot(this.u, this.v); }
}

// slipstream: tucked in close behind another car, drag drops by up to 45%
export function applyDraft(bodies, track) {
  const L = track.length;
  for (const A of bodies) {
    let best = 0;
    if (!A.air && A.crashed <= 0 && A.u > 25) {
      for (const B of bodies) {
        if (B === A || B.air || B.crashed > 0) continue;
        let ds = B.s - A.s; if (ds < -L / 2) ds += L; if (ds > L / 2) ds -= L;
        const lat = Math.abs(B.d - A.d);
        if (ds > 4 && ds < 26 && lat < 3.2) best = Math.max(best, (1 - (ds - 4) / 22) * (1 - lat / 3.2));
      }
    }
    A.draft += (best - A.draft) * 0.15;
  }
}

// two circles per car, equal masses, a little restitution and yaw from the contact offset
const cA = new THREE.Vector3(), cB = new THREE.Vector3(), n = new THREE.Vector3(), fwdA = new THREE.Vector3(), fwdB = new THREE.Vector3();
export function collideCars(bodies, onHit) {
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const A = bodies[i], B = bodies[j];
    if (A.crashed > 0 || B.crashed > 0 || A.ghost > 0 || B.ghost > 0) continue;
    if (Math.abs(A.pos.y - B.pos.y) > 2.5) continue;
    if (A.pos.distanceToSquared(B.pos) > 100) continue;
    fwdA.set(1, 0, 0).applyQuaternion(A.quat); fwdB.set(1, 0, 0).applyQuaternion(B.quat);
    const ra = A.wid * 0.5, rb = B.wid * 0.5, oa = A.len / 2 - ra, ob = B.len / 2 - rb;
    for (const ka of [-1, 1]) for (const kb of [-1, 1]) {
      cA.copy(A.pos).addScaledVector(fwdA, ka * oa); cB.copy(B.pos).addScaledVector(fwdB, kb * ob);
      n.subVectors(cB, cA); n.y = 0;
      const dist = n.length(), pen = ra + rb - dist;
      if (pen <= 0 || dist < 1e-4) continue;
      n.divideScalar(dist);
      A.nudge(n.clone().multiplyScalar(-pen * 0.5)); B.nudge(n.clone().multiplyScalar(pen * 0.5));
      const vrel = tmpV.subVectors(B.vel, A.vel).dot(n);
      if (vrel < 0) {
        const J = -(1 + 0.3) * vrel / 2;
        const va = A.vel.clone().addScaledVector(n, -J), vb = B.vel.clone().addScaledVector(n, J);
        A.setWorldVelocity(va); B.setWorldVelocity(vb);
        // yaw kick from where the hit landed
        const yawKick = (body, fwd, k, off, sign) => {
          const right = tmpV2.crossVectors(fwd, new THREE.Vector3(0, 1, 0));
          const jx = n.dot(fwd) * J * sign, jy = n.dot(right) * J * sign;
          body.r += (k * off * jy) / body.k2 * 0.6;
          return jx;
        };
        yawKick(A, fwdA, ka, oa, -1); yawKick(B, fwdB, kb, ob, 1);
        onHit && onHit(A, B, J);
      }
    }
  }
}
