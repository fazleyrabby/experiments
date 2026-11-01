import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Stage } from '../core/stage';
import { Train } from '../train/train';
import { Landscape } from '../world/landscape';
import { Viaduct } from '../world/viaduct';
import type { Vegetation } from '../world/vegetation';
import { makeFrame } from '../world/track';

export type CamMode = 'cinematic' | 'orbit' | 'follow';

interface Pose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
}

const smooth = (t: number) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const lerpPose = (a: Pose, b: Pose, t: number, out: Pose) => {
  out.pos.lerpVectors(a.pos, b.pos, t);
  out.target.lerpVectors(a.target, b.target, t);
  out.fov = a.fov + (b.fov - a.fov) * t;
  return out;
};
const mkPose = (): Pose => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), fov: 40 });

/** Duration of the scripted opening sequence in seconds. */
export const INTRO_LENGTH = 76;

export class CameraRig {
  mode: CamMode = 'cinematic';
  readonly controls: OrbitControls;
  private t = 0;
  private fr = makeFrame();
  private tmp = new THREE.Vector3();
  private pa = mkPose();
  private pb = mkPose();
  private pc = mkPose();
  private lastTarget = new THREE.Vector3();
  private blending = 0;
  private userDrag = false;
  onModeChange?: (m: CamMode) => void;

  constructor(
    private stage: Stage,
    private train: Train,
    private land: Landscape,
    private viaduct: Viaduct,
    private veg?: Vegetation,
  ) {
    const cam = stage.camera;
    this.controls = new OrbitControls(cam, stage.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 1400;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.zoomSpeed = 0.9;
    this.controls.rotateSpeed = 0.6;
    this.controls.target.set(0, 32, -60);
    this.controls.enabled = false;
    const el = stage.renderer.domElement;
    const grab = () => {
      if (this.mode === 'cinematic' && this.t > 1.5) this.setMode('orbit');
    };
    el.addEventListener('pointerdown', grab);
    el.addEventListener('wheel', grab, { passive: true });
  }

  /** keep the horizontal field of view usable on tall (portrait) screens */
  private fovFor(base: number) {
    const aspect = this.stage.camera.aspect;
    const minAspect = 1.35;
    if (aspect >= minAspect) return base;
    const h = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(base) / 2) * minAspect);
    return Math.min(95, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect)));
  }

  /** world point relative to the loco frame: x = right, y = up, z = forward */
  private rel(x: number, y: number, z: number, out: THREE.Vector3) {
    const f = this.train.locoFrame;
    return out.copy(f.p).addScaledVector(f.r, x).addScaledVector(f.u, y).addScaledVector(f.t, z);
  }

  /** camera-position variant of rel(): pulls back on tall screens so the loco still fits the frame */
  private relP(x: number, y: number, z: number, out: THREE.Vector3) {
    const a = this.stage.camera.aspect;
    const k = a < 1.35 ? Math.min(2.1, 1 + (1.35 - a) * 1.1) : 1;
    return this.rel(x * k, y * (0.6 + 0.4 * k), z * k, out);
  }

  setMode(m: CamMode) {
    if (m === this.mode) return;
    const cam = this.stage.camera;
    if (m === 'cinematic') {
      this.t = 0;
    } else {
      if (this.mode === 'cinematic') {
        // hand over exactly where the director left the camera
        this.controls.target.copy(this.lastTarget);
      }
      if (m === 'follow') {
        const f = this.train.locoFrame;
        // keep the current view but orbit the locomotive
        const off = cam.position.clone().sub(this.controls.target);
        this.controls.target.copy(f.p).addScaledVector(f.u, 2);
        if (off.length() > 70 || this.mode === 'cinematic') {
          off.copy(f.r).multiplyScalar(14).addScaledVector(f.u, 5).addScaledVector(f.t, -9);
        }
        cam.position.copy(this.controls.target).add(off);
      }
    }
    this.mode = m;
    this.controls.enabled = m !== 'cinematic';
    this.onModeChange?.(m);
  }

  restartIntro(distance: number) {
    this.train.setDistance(distance);
    this.train.state.speed = this.train.targetSpeed;
    this.t = 0;
    this.mode = 'cinematic';
    this.controls.enabled = false;
    this.onModeChange?.('cinematic');
  }

  /** debugging: jump the director to time t (train position handled by the caller) */
  seek(t: number) {
    this.mode = 'cinematic';
    this.controls.enabled = false;
    this.t = t;
    this.onModeChange?.('cinematic');
  }

  get introTime() {
    return this.t;
  }

  // ------------------------------------------------------------------ shots
  private shotA(t: number, out: Pose) {
    // wide establishing: the whole glen, viaduct and the train approaching along the rim
    const k = smooth(t / 12);
    out.pos.set(-125 + 62 * k, 96 - 28 * k, 305 - 60 * k);
    out.target.set(-8 + 6 * k, 33, -45);
    out.fov = 40;
    // gently pull the target towards the train as it comes into view
    this.rel(0, 2, 0, this.tmp);
    out.target.lerp(this.tmp, 0.35 * smooth((t - 4) / 8));
    return out;
  }

  private shotB(t: number, out: Pose) {
    // approach: glide towards the locomotive from ahead and to its right
    const k = smooth(t / 12);
    this.relP(14 - 8 * k, 5.2 - 2.8 * k, 30 - 22 * k, out.pos);
    this.rel(0, 1.9, 1.5, out.target);
    out.fov = 36 - 5 * k;
    return out;
  }

  private shotC(t: number, out: Pose) {
    // low, alongside the driving wheels: rods and cranks fill the frame
    const k = smooth(t / 11);
    this.relP(8.4 - 1.4 * k, 3.0 + 0.2 * k, 5.5 - 7.5 * k, out.pos);
    this.rel(0, 1.05, 0.6 - 1.6 * k, out.target);
    out.fov = 37;
    return out;
  }

  private shotD(t: number, out: Pose) {
    // tracking alongside while the train crosses the arches, seen from below the viaduct
    const k = smooth(t / 13);
    out.pos.set(-60 + 100 * k, 38 + 4 * k, 128 - 14 * k);
    this.rel(0, 1.8, 0, out.target);
    out.fov = 36 - 4 * k;
    return out;
  }

  private shotE(t: number, out: Pose) {
    // pull back and rise to reveal the scale of the structure
    const k = smooth(t / 14);
    out.pos.set(25 - 135 * k, 24 + 66 * k, 80 + 160 * k);
    this.rel(0, 3, 0, this.tmp);
    this.pc.target.set(0, 30, -35);
    out.target.lerpVectors(this.tmp, this.pc.target, smooth((t - 1) / 11));
    out.fov = 34 + 6 * k;
    return out;
  }

  private shotF(t: number, out: Pose) {
    // final dramatic wide, drifting slowly
    const k = t / 24;
    out.pos.set(-215 + 55 * k, 118 + 8 * k, 330 - 15 * k);
    out.target.set(10, 32, -125);
    out.fov = 41;
    return out;
  }

  private director(t: number, out: Pose) {
    const shots: [number, (t: number, o: Pose) => Pose][] = [
      [0, (tt, o) => this.shotA(tt, o)],
      [11, (tt, o) => this.shotB(tt, o)],
      [23, (tt, o) => this.shotC(tt, o)],
      [34, (tt, o) => this.shotD(tt, o)],
      [47, (tt, o) => this.shotE(tt, o)],
      [60, (tt, o) => this.shotF(tt, o)],
    ];
    const blend = 3.2;
    let i = 0;
    for (let k = 0; k < shots.length; k++) if (t >= shots[k][0]) i = k;
    const [t0, fn] = shots[i];
    fn(t - t0, this.pa);
    const next = shots[i + 1];
    if (next && t > next[0] - blend) {
      const w = smooth((t - (next[0] - blend)) / blend);
      next[1](t - next[0], this.pb);
      lerpPose(this.pa, this.pb, w, out);
    } else {
      out.pos.copy(this.pa.pos);
      out.target.copy(this.pa.target);
      out.fov = this.pa.fov;
    }
    return out;
  }

  // --------------------------------------------------------------- collision
  resolve(pos: THREE.Vector3) {
    for (let i = 0; i < 3; i++) {
      const h = this.land.fastHeight(pos.x, pos.z);
      const hMin = h + 2.2;
      if (pos.y < hMin) pos.y = hMin;
      this.viaduct.pushOut(pos, 1.6);
      this.train.pushOut(pos, 1.0);
      this.veg?.pushOut(pos, 1.0);
    }
  }

  // ------------------------------------------------------------------ update
  update(dt: number, time: number) {
    const cam = this.stage.camera;
    if (this.mode === 'cinematic') {
      if (!this.train.paused) this.t += dt;
      this.director(this.t, this.pc);
      cam.position.copy(this.pc.pos);
      this.resolve(cam.position);
      this.lastTarget.copy(this.pc.target);
      cam.lookAt(this.pc.target);
      const wantFov = this.fovFor(this.pc.fov);
      if (Math.abs(cam.fov - wantFov) > 0.01) {
        cam.fov = wantFov;
        cam.updateProjectionMatrix();
      }
      if (this.t > INTRO_LENGTH) this.setMode('orbit');
      return;
    }
    const wantFov = this.fovFor(40);
    if (Math.abs(cam.fov - wantFov) > 0.01) {
      cam.fov += (wantFov - cam.fov) * Math.min(1, dt * 3);
      cam.updateProjectionMatrix();
    }
    if (this.mode === 'follow') {
      const f = this.train.locoFrame;
      const want = this.tmp.copy(f.p).addScaledVector(f.u, 2.2);
      const delta = want.clone().sub(this.controls.target);
      // stay locked on the locomotive; carry the camera with it
      this.controls.target.add(delta);
      cam.position.add(delta);
    }
    this.controls.update();
    this.resolve(cam.position);
    void time;
    void this.blending;
    void this.userDrag;
  }
}
