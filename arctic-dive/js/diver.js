import * as THREE from 'three';
import { lerp } from './noise.js';

// Height of the hip joint above the soles; the rig root pivots there.
export const HIP = 0.93;

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const [_va, _vb, _vc, _vd, _ve, _vf, _vg, _vh] = Array.from({ length: 8 }, () => new THREE.Vector3());
const [_q1, _q2, _q3, _qa, _qb] = Array.from({ length: 5 }, () => new THREE.Quaternion());

// Rotate a bone (in world space) so its direction `from` turns to `to`.
function aimBone(bone, from, to) {
  _qa.setFromUnitVectors(from, to).multiply(bone.getWorldQuaternion(_qb));
  bone.quaternion.copy(bone.parent.getWorldQuaternion(_qb).invert().multiply(_qa));
}

// Wraps the skinned diver from diver.glb. Joint rotations are given in
// character axes (x: pitch forward/back, y: twist, z: sideways), whatever the
// bone's own rest orientation, so poses read the same as nested groups would.
export class DiverRig {
  constructor(gltf) {
    this.root = new THREE.Group();
    this.root.rotation.order = 'YXZ';
    this.model = gltf.scene;
    this.model.position.y = -HIP;
    this.root.add(this.model);
    this.bones = {};
    this.model.traverse(o => {
      if (o.isBone) this.bones[o.name] = o;
      if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; }
    });
    this.root.updateMatrixWorld(true);
    this.rest = {};
    for (const [name, b] of Object.entries(this.bones)) {
      const char = b.getWorldQuaternion(new THREE.Quaternion());
      this.rest[name] = { local: b.quaternion.clone(), char, charInv: char.clone().invert() };
    }
    this.head = this.bones.head;
    this.feet = [this.bones.footL, this.bones.footR];
    this.regulator = this.model.getObjectByName('Regulator') || this.head;
  }

  // local = rest · charRest⁻¹ · R · charRest: R applied about the joint in character axes.
  set(name, x, y = 0, z = 0) {
    const r = this.rest[name];
    _q.setFromEuler(_e.set(x, y, z));
    this.bones[name].quaternion.copy(r.local).multiply(r.charInv).multiply(_q).multiply(r.char);
  }

  apply(P, pitch) {
    this.set('spine', P.spine * 0.5);
    this.set('chest', P.spine * 0.5);
    this.set('neck', P.neck * 0.5, P.look * 0.5);
    this.set('head', P.neck * 0.5, P.look * 0.5);
    ['L', 'R'].forEach((S, i) => {
      const s = i ? 1 : -1;
      this.set('upperarm' + S, P.sh[i], 0, s * P.shZ[i]);
      this.set('forearm' + S, P.el[i]);
      this.set('hand' + S, P.wr[i]);
      this.set('thigh' + S, P.hip[i], 0, s * P.hipZ[i]);
      this.set('shin' + S, P.knee[i]);
      // `plant` keeps the sole level with the ground: cancel body pitch + hip + knee.
      this.set('foot' + S, lerp(P.ank[i], -(pitch + P.hip[i] + P.knee[i]), P.plant));
    });
  }

  // Two-bone IK: bend upper→lower so the end bone's joint reaches `target`, with
  // the middle joint swung toward `pole`. Blended over the FK pose by `w`.
  solveLimb(upper, lower, end, target, pole, w) {
    if (w <= 0) return;
    const U = this.bones[upper], L = this.bones[lower], E = this.bones[end];
    const a = U.getWorldPosition(_va), b = L.getWorldPosition(_vb), c = E.getWorldPosition(_vc);
    const la = a.distanceTo(b), lb = b.distanceTo(c);
    const dir = _vd.subVectors(target, a);
    const dist = THREE.MathUtils.clamp(dir.length(), 0.05, (la + lb) * 0.999);
    dir.normalize();
    const cosA = THREE.MathUtils.clamp((la * la + dist * dist - lb * lb) / (2 * la * dist), -1, 1);
    const bend = _ve.subVectors(pole, a);
    bend.addScaledVector(dir, -bend.dot(dir)).normalize();
    const mid = _vf.copy(a).addScaledVector(dir, cosA * la).addScaledVector(bend, Math.sqrt(1 - cosA * cosA) * la);
    _q1.copy(U.quaternion);
    _q2.copy(L.quaternion);
    aimBone(U, _vg.subVectors(b, a).normalize(), _vh.subVectors(mid, a).normalize());
    U.updateMatrixWorld(true);
    L.getWorldPosition(_vb);
    E.getWorldPosition(_vc);
    aimBone(L, _vg.subVectors(_vc, _vb).normalize(), _vh.subVectors(target, _vb).normalize());
    if (w < 1) {
      U.quaternion.slerpQuaternions(_q1, _q3.copy(U.quaternion), w);
      L.quaternion.slerpQuaternions(_q2, _q3.copy(L.quaternion), w);
    }
    U.updateMatrixWorld(true);
  }

  lowestFootY(v) {
    return Math.min(...this.feet.map(f => f.getWorldPosition(v).y)) - 0.08;
  }
}

// ---------------------------------------------------------------------------
// Poses. Joint angles in radians, [left, right] pairs for limbs. Signs:
// sh/hip negative = forward, el negative = bend forward, knee positive = bend
// back, ank positive = point the toes.
// ---------------------------------------------------------------------------
const base = {
  pitch: 0, dy: 0, spine: 0.04, neck: 0.12, look: 0,
  sh: [0.08, 0.02], shZ: [0.1, 0.1], el: [-0.25, -0.35], wr: [0.1, 0.1],
  hip: [0, -0.06], hipZ: [0.02, 0.02], knee: [0.03, 0.12], ank: [0, 0], plant: 1,
};
const pose = o => ({ ...base, ...o });

export const POSE = {
  stand: base,
  maskCheck: pose({ neck: 0.05, sh: [-2.2, -2.2], shZ: [0.45, 0.45], el: [-2.0, -2.0], wr: [0.3, 0.3] }),
  // Giant-stride ready: right hand holds mask and regulator, left on the weight belt.
  stride: pose({ pitch: 0.05, spine: 0.08, neck: 0.1, sh: [0.35, -2.25], shZ: [0.3, 0.5], el: [-1.4, -2.05], wr: [0, 0.3], hip: [0.05, -0.15], knee: [0.08, 0.1] }),
  strideOut: pose({ pitch: 0.1, spine: 0.06, neck: 0.15, sh: [0.35, -2.25], shZ: [0.3, 0.5], el: [-1.4, -2.05], wr: [0, 0.3], hip: [0.35, -1.0], knee: [0.25, 0.1], ank: [0.2, 0.3], plant: 0 }),
  fall: pose({ spine: 0, neck: 0.05, sh: [0.35, -2.25], shZ: [0.3, 0.5], el: [-1.4, -2.05], wr: [0, 0.3], hip: [0.05, -0.15], knee: [0.1, 0.1], ank: [0.7, 0.7], plant: 0 }),
};

export const mixPose = (a, b, k) => {
  const out = {};
  for (const key in a) out[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k);
  return out;
};

// Blend only the legs of `b` over `a`'s (upper body comes from `b`).
export const mixLegs = (a, b, k) => {
  const out = { ...b };
  for (const key of ['hip', 'hipZ', 'knee', 'ank']) out[key] = a[key].map((v, i) => lerp(v, b[key][i], k));
  out.plant = lerp(a.plant, b.plant, k);
  return out;
};

export const standPose = t => pose({
  neck: 0.12 + Math.sin(t * 0.53) * 0.06, look: Math.sin(t * 0.4) * 0.4,
  sh: [0.08 + Math.sin(t * 1.6) * 0.02, 0.02 + Math.sin(t * 1.6 + 1) * 0.02],
});

// Short shuffling steps (fins on): opposite arm swing, swing-leg knee bend.
export const walkPose = phi => {
  const a = Math.sin(phi), c = Math.cos(phi);
  return pose({
    dy: -0.025 * Math.abs(a), spine: 0.08,
    sh: [0.25 * a, -0.25 * a], el: [-0.35, -0.35],
    hip: [-0.28 * a, 0.28 * a], knee: [0.1 + 0.5 * Math.max(0, c), 0.1 + 0.5 * Math.max(0, -c)],
    plant: 0.6,
  });
};

const kick = (t, rate, amp) => {
  const k = Math.sin(t * rate);
  return {
    hip: [0.2 + amp * k, 0.2 - amp * k],
    knee: [0.35 + 0.25 * Math.max(0, Math.sin(t * rate + 1)), 0.35 + 0.25 * Math.max(0, -Math.sin(t * rate + 1))],
  };
};

// Prone fin-kicking; body pitch comes from the swim path. Forearms folded under
// the chest, head lifted to look ahead.
export const swimPose = t => pose({
  spine: -0.05, neck: -0.75, look: Math.sin(t * 0.4) * 0.3,
  sh: [-0.25, -0.25], shZ: [0.32, 0.32], el: [-1.9, -1.9], wr: [0.2, 0.2],
  ...kick(t, 3.4, 0.32), hipZ: [0.08, 0.08], ank: [1.15, 1.15], plant: 0,
});

export const sinkPose = t => pose({
  pitch: 0.05, spine: 0.05, neck: 0.35, sh: [0.1, 0.1], shZ: [0.55, 0.55], el: [-0.6, -0.6], wr: [-0.3, -0.3],
  ...kick(t, 1.6, 0.15), ank: [0.9, 0.9], plant: 0,
});

// Controlled ascent: one hand raised overhead, looking up.
export const ascendPose = t => pose({
  spine: 0.05, neck: -0.5, sh: [0.1, -2.9], shZ: [0.4, 0.15], el: [-0.5, -0.1], wr: [0, 0],
  ...kick(t, 2.2, 0.2), ank: [0.9, 0.9], plant: 0,
});

// Hand-over-hand up the boarding ladder.
export const climbPose = phi => {
  const a = Math.sin(phi);
  return pose({
    pitch: 0.12, spine: 0.15, neck: -0.1,
    sh: [-2.2 - 0.45 * a, -2.2 + 0.45 * a], shZ: [0.28, 0.28], el: [-0.9 - 0.4 * a, -0.9 + 0.4 * a], wr: [0.3, 0.3],
    hip: [-1.0 - 0.45 * a, -1.0 + 0.45 * a], knee: [1.3 + 0.4 * a, 1.3 - 0.4 * a], ank: [0.2, 0.2], plant: 0,
  });
};
