import * as THREE from 'three';
import { Track, makeFrame, TrackFrame } from '../world/track';
import { Locomotive, LOCO } from './locomotive';
import { Tender, TENDER } from './tender';
import { CarriageFactory, Carriage, COACH } from './carriage';
import { InstBatch } from './inst';

const GAP_LOCO_TENDER = 0.05;
const GAP_COUPLED = 0.18;

export interface TrainState {
  s: number; // loco root position along the track
  speed: number;
  wheelAngle: number; // driver rotation (rad)
  chuffs: number; // monotonically increasing exhaust-beat counter
  jointHits: number; // rail-joint counter at the front driver (for audio)
}

const _fa = makeFrame(), _fb = makeFrame(), _fc = makeFrame();
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _l = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _mid = new THREE.Vector3();

/** Place an object on a chord between two track frames (axle / bogie centres). */
function placeChord(obj: THREE.Object3D, a: TrackFrame, b: TrackFrame) {
  _f.subVectors(a.p, b.p).normalize();
  _u.addVectors(a.u, b.u).normalize();
  _u.addScaledVector(_f, -_f.dot(_u)).normalize();
  _l.crossVectors(_u, _f).normalize();
  _m.makeBasis(_l, _u, _f);
  obj.quaternion.setFromRotationMatrix(_m);
  _mid.addVectors(a.p, b.p).multiplyScalar(0.5);
  obj.position.copy(_mid);
}

export class Train {
  readonly group = new THREE.Group();
  readonly loco: Locomotive;
  readonly tender: Tender;
  readonly coaches: Carriage[] = [];
  readonly state: TrainState = { s: 0, speed: 0, wheelAngle: 0, chuffs: 0, jointHits: 0 };
  /** world-space frames cached for effects / camera */
  readonly locoFrame = makeFrame();
  private offsets: { tender: number; coaches: number[] } = { tender: 0, coaches: [] };
  private dist = 0;
  readonly batches: InstBatch[] = [];
  paused = false;
  targetSpeed = 8.5;
  length = 0;
  private vehicles: { obj: THREE.Object3D; hx: number; y1: number; z0: number; z1: number }[] = [];
  private lastChuffPhase = 0;
  private lastJoint = 0;

  constructor(private track: Track, nCoaches = 4) {
    this.loco = new Locomotive();
    this.tender = new Tender();
    const f = new CarriageFactory();
    const labels = ['FIRST', 'THIRD', 'THIRD', 'BRAKE'];
    this.group.add(this.loco.root, this.loco.bogie, this.loco.trailing, this.tender.root);
    // positions of vehicle centres relative to the loco root (negative = behind)
    let c = LOCO.rearZ - GAP_LOCO_TENDER - 3.85;
    this.offsets.tender = c;
    c = c - 3.85 - GAP_COUPLED - COACH.bufferTip;
    for (let i = 0; i < nCoaches; i++) {
      const cr = f.create(labels[i % labels.length]);
      this.coaches.push(cr);
      this.group.add(cr.root, cr.bogieF, cr.bogieR);
      this.offsets.coaches.push(c);
      c -= COACH.bufferTip * 2 + GAP_COUPLED;
    }
    this.vehicles.push({ obj: this.loco.root, hx: 1.75, y1: 4.5, z0: -4.9, z1: 7.6 });
    this.vehicles.push({ obj: this.tender.root, hx: 1.7, y1: 4.1, z0: -4.1, z1: 4.1 });
    for (const cr of this.coaches) this.vehicles.push({ obj: cr.root, hx: 1.75, y1: 3.95, z0: -8.3, z1: 8.3 });
    // every moving part is drawn through shared instanced batches (few draw calls)
    this.batches.push(...this.loco.batches, ...this.tender.batches, ...f.batches(this.coaches));
    for (const b of this.batches) this.group.add(b.mesh);
    this.length = LOCO.frontZ - (c + COACH.bufferTip * 2 + GAP_COUPLED - COACH.bufferTip);
    this.state.s = 0;
    this.layout(0, 0);
  }

  private f(s: number, out: TrackFrame) {
    return this.track.frame(s, out);
  }

  /** advance `dt` seconds. */
  update(dt: number, time: number) {
    const st = this.state;
    // ease towards target speed
    const tgt = this.paused ? 0 : this.targetSpeed;
    st.speed += (tgt - st.speed) * Math.min(1, dt * 1.2);
    if (Math.abs(st.speed) < 0.002) st.speed = 0;
    const ds = st.speed * dt;
    st.s = this.track.wrap(st.s + ds);
    this.dist += ds;
    st.wheelAngle += ds / LOCO.driverR;
    // four exhaust beats per driver revolution
    const phase = Math.floor(st.wheelAngle / (Math.PI / 2));
    if (phase > this.lastChuffPhase) st.chuffs += phase - this.lastChuffPhase;
    this.lastChuffPhase = phase;
    const jp = Math.floor((this.dist + LOCO.driverZ[0]) / 18.3);
    if (jp > this.lastJoint) st.jointHits += jp - this.lastJoint;
    this.lastJoint = jp;
    this.layout(this.dist, time);
  }

  private layout(dist: number, time: number) {
    const st = this.state;
    const s0 = st.s;
    const tr = this.track;
    const fa = _fa, fb = _fb;

    // suspension: small vertical bounce and roll tied to rail joints and speed
    const v = Math.min(1, st.speed / 8);
    const bob = (ph: number, amp: number) => Math.sin(dist * 2 * Math.PI / 18.3 + ph) * amp * v + Math.sin(dist * 1.7 + ph * 2.1) * amp * 0.5 * v;
    const roll = (ph: number, amp: number) => Math.sin(dist * 0.9 + ph) * amp * v;

    // ---- loco: chord between front and rear driving axles
    this.f(s0 + LOCO.driverZ[0], fa);
    this.f(s0 + LOCO.driverZ[2], fb);
    placeChord(this.loco.root, fa, fb);
    this.loco.chassis.position.y = bob(0.4, 0.004);
    this.loco.chassis.rotation.z = roll(0.2, 0.0012);
    this.f(s0, this.locoFrame);

    // leading bogie & trailing truck
    this.f(s0 + LOCO.bogieZ[1] + 0.0, fa);
    this.f(s0 + LOCO.bogieZ[0], fb);
    placeChord(this.loco.bogie, fa, fb);
    this.f(s0 + LOCO.trailZ + 0.6, fa);
    this.f(s0 + LOCO.trailZ - 0.6, fb);
    placeChord(this.loco.trailing, fa, fb);

    // tender
    const sT = s0 + this.offsets.tender;
    this.f(sT + TENDER.axles[2], fa);
    this.f(sT + TENDER.axles[0], fb);
    placeChord(this.tender.root, fa, fb);
    this.tender.body.position.y = bob(1.3, 0.006);
    this.tender.body.rotation.z = roll(1.1, 0.002);

    // loco & tender mechanical state
    this.loco.update(st.wheelAngle, 1, true, time);
    this.tender.update(dist / TENDER.wheelR);

    // coaches
    this.coaches.forEach((cr, i) => {
      const sc = s0 + this.offsets.coaches[i];
      this.f(sc + COACH.bogieZ, fa);
      this.f(sc - COACH.bogieZ, fb);
      placeChord(cr.root, fa, fb);
      cr.body.position.y = bob(2.2 + i * 1.7, 0.007);
      cr.body.rotation.z = roll(2.0 + i * 1.3, 0.0025);
      // bogies on their own chords
      this.f(sc + COACH.bogieZ + COACH.bogieAxle, fa);
      this.f(sc + COACH.bogieZ - COACH.bogieAxle, fb);
      placeChord(cr.bogieF, fa, fb);
      this.f(sc - COACH.bogieZ + COACH.bogieAxle, fa);
      this.f(sc - COACH.bogieZ - COACH.bogieAxle, fb);
      placeChord(cr.bogieR, fa, fb);
      cr.update(dist / COACH.wheelR);
    });
    for (const b of this.batches) b.update();
    void tr;
    void _fc;
  }

  private _inv = new THREE.Matrix4();
  private _lp = new THREE.Vector3();
  /** Push a world point out of the rolling stock (camera collision). */
  pushOut(p: THREE.Vector3, margin = 1.2): boolean {
    let moved = false;
    for (const v of this.vehicles) {
      v.obj.updateMatrixWorld();
      const o = v.obj.matrixWorld;
      // cheap reject
      const dx = p.x - o.elements[12], dz = p.z - o.elements[14];
      if (dx * dx + dz * dz > 14 * 14 * 1.4) continue;
      this._inv.copy(o).invert();
      const l = this._lp.copy(p).applyMatrix4(this._inv);
      const ex = v.hx + margin, ey = v.y1 + margin, z0 = v.z0 - margin, z1 = v.z1 + margin;
      if (l.y < -0.8 || l.y > ey || l.x < -ex || l.x > ex || l.z < z0 || l.z > z1) continue;
      // inside the padded box: exit through the closest face (never through the floor)
      const pen = [ex - l.x, l.x + ex, ey - l.y, l.z - z0, z1 - l.z];
      let k = 0;
      for (let i = 1; i < pen.length; i++) if (pen[i] < pen[k]) k = i;
      if (k === 0) l.x = ex; else if (k === 1) l.x = -ex; else if (k === 2) l.y = ey; else if (k === 3) l.z = z0; else l.z = z1;
      p.copy(l).applyMatrix4(o);
      moved = true;
    }
    return moved;
  }

  /** Set position explicitly (debug / camera presets). */
  setDistance(s: number) {
    this.state.s = this.track.wrap(s);
    this.layout(this.dist, 0);
  }

  /** world frame of a point on the train at `offset` metres behind the loco root. */
  frameAt(offset: number, out: TrackFrame): TrackFrame {
    return this.track.frame(this.state.s + offset, out);
  }
}
