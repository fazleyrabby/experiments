// Camera rig. Every shot is a function of the target car's pose; the rig springs
// toward it (or cuts). Each shot also sets how shallow the depth of field is,
// which is what sells the 1:64 scale: a lens this close to a toy has almost no
// focus depth. The director cuts between shots for hands-off filming and drops
// into slow motion when a car takes the book jump.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const up = new THREE.Vector3(0, 1, 0);
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();

// trackside "TV" camera stations, low on the desk
const STATIONS = [
  [-70, 3, 54], [-20, 2.5, 50], [50, 3, 52], [146, 6, 42], [147, 5, -34], [100, 3.2, -40],
  [30, 9, -8], [-10, 11, -42], [-45, 13, -8], [-78, 5, -42], [-146, 5, -40], [-146, 6, 42], [116, 13, 5], [90, 4, 50],
];

export const SHOTS = ['chase', 'front', 'low', 'tv', 'hood', 'heli'];
const SHOT_INFO = {
  chase: { k: 7, kl: 14, fov: 46, ap: 16 },
  front: { k: 4, kl: 10, fov: 30, ap: 22 },
  low: { k: 5, kl: 12, fov: 28, ap: 22 },
  tv: { k: 0, kl: 9, fov: 20, ap: 24 },
  hood: { k: 60, kl: 60, fov: 64, ap: 5 },
  heli: { k: 3, kl: 6, fov: 34, ap: 7 },
  intro: { k: 2.5, kl: 6, fov: 28, ap: 22 },
  jump: { k: 0, kl: 18, fov: 26, ap: 16 },
  orbit: { k: 0, kl: 0, fov: 30, ap: 14 },
};

export class CameraRig {
  constructor(camera, dom) {
    this.cam = camera;
    this.mode = 'chase';
    this.shot = 'chase';
    this.pos = camera.position.clone();
    this.look = new THREE.Vector3();
    this.fov = 46; this.aperture = 10;
    this.focusDist = 20;
    this.focusPoint = new THREE.Vector3();
    this.target = null;
    this.directorT = 0; this.directorIdx = 0;
    this.side = 1; this.station = null; this.introA = 0.6;
    this.shake = 0; this.cut = true;
    this.slowmo = 0;
    this.controls = new OrbitControls(camera, dom);
    this.controls.enabled = false; this.controls.enableDamping = true; this.controls.minDistance = 4; this.controls.maxDistance = 160;
    this.focusOverride = null;
  }

  setMode(m) {
    if (m === this.mode) return;
    this.mode = m; this.cut = true; this.directorT = 0;
    this.controls.enabled = m === 'orbit';
    if (m === 'orbit' && this.target) { this.controls.target.copy(this.target.body.pos).add(v1.set(0, 0.8, 0)); this.controls.update(); }
    if (m !== 'orbit') this.focusOverride = null;
  }

  setTarget(r) { if (r !== this.target) { this.target = r; this.cut = true; } }

  bump(a) { this.shake = Math.min(1, this.shake + a); }

  update(dt, ctx) {
    const t = this.target;
    if (!t) return;
    const b = t.body;
    const p = v1.copy(b.pos);
    const fwd = v2.set(1, 0, 0).applyQuaternion(b.quat);
    const fwdFlat = v3.set(fwd.x, 0, fwd.z);
    if (fwdFlat.lengthSq() < 1e-4) fwdFlat.set(1, 0, 0); fwdFlat.normalize();
    const right = new THREE.Vector3().crossVectors(fwdFlat, up);
    let shot = this.mode;
    if (this.mode === 'director') shot = this.direct(dt, ctx, b);
    if (this.mode === 'orbit') {
      this.controls.update();
      this.fov += (SHOT_INFO.orbit.fov - this.fov) * 0.1;
      this.cam.fov = this.fov; this.cam.updateProjectionMatrix();
      const fp = this.focusOverride || this.controls.target;
      this.focusPoint.copy(fp);
      this.focusDist = this.cam.position.distanceTo(fp);
      return;
    }
    if (shot !== this.shot) { this.shot = shot; this.cut = true; if (shot === 'low') this.side = -this.side; if (shot === 'tv') this.station = null; }
    const info = SHOT_INFO[shot];
    const want = new THREE.Vector3(), look = new THREE.Vector3();
    let fov = info.fov;
    const carMid = new THREE.Vector3().copy(p).addScaledVector(up, 0.8);
    switch (shot) {
      case 'chase': {
        const sp = Math.min(1, b.speed / 72);
        want.copy(p).addScaledVector(fwdFlat, -12.5 - sp * 2).addScaledVector(up, 3.8 + sp * 0.4);
        look.copy(p).addScaledVector(fwd, 6).addScaledVector(up, 0.9);
        fov = 44 + sp * 8;
        break;
      }
      case 'front':
        want.copy(p).addScaledVector(fwdFlat, 15).addScaledVector(right, 2.5 * this.side).addScaledVector(up, 1.7);
        look.copy(carMid);
        break;
      case 'low':
        want.copy(p).addScaledVector(right, 15 * this.side).addScaledVector(fwdFlat, 5).addScaledVector(up, 1.4);
        look.copy(carMid);
        break;
      case 'hood': {
        const lu = new THREE.Vector3(0, 1, 0).applyQuaternion(b.quat);
        want.copy(p).addScaledVector(fwd, 0.4).addScaledVector(lu, 2.15);
        look.copy(want).addScaledVector(fwd, 30).addScaledVector(lu, -1.2);
        break;
      }
      case 'tv': {
        if (!this.station || this.cut || this.stationAge > 2.5) {
          let best = null, bs = -1e9;
          for (const s of STATIONS) {
            const sv = new THREE.Vector3(...s), to = sv.clone().sub(p), dist = to.length();
            const ahead = to.normalize().dot(fwdFlat);
            const score = -dist + ahead * 30 + (s === this.stationLast ? -25 : 0);
            if (dist > 12 && score > bs) { bs = score; best = s; }
          }
          if (best !== this.station) { this.stationLast = this.station; this.station = best; this.cut = true; this.stationAge = 0; }
        }
        this.stationAge = (this.stationAge || 0) + dt;
        want.set(...this.station);
        look.copy(carMid);
        const dist = want.distanceTo(carMid);
        fov = THREE.MathUtils.radToDeg(2 * Math.atan(7.5 / dist));
        fov = Math.max(5, Math.min(34, fov));
        break;
      }
      case 'heli':
        want.copy(p).addScaledVector(fwdFlat, -24).addScaledVector(right, 8).addScaledVector(up, 26);
        look.copy(p).addScaledVector(fwdFlat, 8);
        break;
      case 'intro': {
        this.introA += dt * 0.12;
        const rad = 13 + Math.sin(this.introA * 0.7) * 2.5;
        want.copy(p).add(new THREE.Vector3(Math.cos(this.introA) * rad, 4.6 + Math.sin(this.introA * 0.9) * 1.4, Math.sin(this.introA) * rad));
        look.copy(carMid);
        break;
      }
      case 'jump':
        want.set(-61, 8.5, -7.5);
        look.copy(carMid);
        fov = Math.max(14, Math.min(34, THREE.MathUtils.radToDeg(2 * Math.atan(8 / want.distanceTo(carMid)))));
        break;
    }
    const kp = info.k ? 1 - Math.exp(-dt * info.k) : 1, kl = info.kl ? 1 - Math.exp(-dt * info.kl) : 1;
    if (this.cut) { this.pos.copy(want); this.look.copy(look); this.fov = fov; this.cut = false; }
    else {
      this.pos.lerp(want, kp); this.look.lerp(look, kl); this.fov += (fov - this.fov) * Math.min(1, dt * 4);
    }
    // keep the lens above the desk
    if (this.pos.y < 0.8) this.pos.y = 0.8;
    this.cam.position.copy(this.pos);
    if (this.shake > 0) {
      const s = this.shake * 0.25;
      this.cam.position.x += (Math.random() - 0.5) * s; this.cam.position.y += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 3);
    }
    this.cam.lookAt(this.look);
    this.cam.fov = this.fov; this.cam.updateProjectionMatrix();
    this.aperture += (info.ap - this.aperture) * Math.min(1, dt * 4);
    this.focusPoint.copy(carMid);
    // focus distance along the view axis
    const viewDir = new THREE.Vector3(); this.cam.getWorldDirection(viewDir);
    this.focusDist = Math.max(1, carMid.clone().sub(this.cam.position).dot(viewDir));
  }

  direct(dt, ctx, b) {
    this.directorT += dt;
    // the jump: hold a side-on shot of the gap in slow motion
    if (ctx.jumpWatch) { this.jumpHold = 1.1; }
    if (this.jumpHold > 0) { this.jumpHold -= dt / Math.max(0.2, ctx.timeScale); return 'jump'; }
    const seq = ['chase', 'tv', 'front', 'low', 'tv', 'heli', 'chase', 'hood', 'tv', 'low'];
    const len = { chase: 4.5, tv: 3.4, front: 3, low: 3.2, heli: 3.2, hood: 2.4 }[seq[this.directorIdx]];
    if (this.directorT > len) { this.directorT = 0; this.directorIdx = (this.directorIdx + 1) % seq.length; }
    return seq[this.directorIdx];
  }
}
