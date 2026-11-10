/* camera.js — looping cinematic shots, plus a draggable orbit camera that follows the tram. */
import * as THREE from 'three';
import { clamp, lerp, smooth } from './util.js';
import { TRACK_Z } from './world.js';

const TZ = TRACK_Z.hero;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* Each shot returns { pos, target, fov } from shot-local time u and tram x. `a` is the tram x when the shot began. */
const SHOTS = [
  { name: 'Approach', dur: 8.5, f: (u, x, a) => ({
      pos: V(a + 24, 2.5, -8.7), target: V(x + 2.0, 2.0, TZ), fov: 50 }) },
  { name: 'Side track', dur: 9, f: (u, x) => ({
      pos: V(x - 2.5 + u * 0.35, 1.7, -9.0), target: V(x + 0.4, 2.5, TZ), fov: 64 }) },
  { name: 'Upper deck', dur: 9, f: (u, x) => ({
      pos: V(x + 5.35, 3.45 + Math.sin(u * 1.6) * 0.015, TZ - 0.35 + Math.sin(u * 0.5) * 0.08), target: V(x + 40, 3.3, TZ + Math.sin(u * 0.4) * 1.5), fov: 64 }) },
  { name: 'Street crane', dur: 9, f: (u, x) => ({
      pos: V(x - 22 + u * 0.6, 14.5 - u * 0.35, -6.2), target: V(x + 10, 3.2, TZ + 1), fov: 48 }) },
  { name: 'Neon walk', dur: 9, f: (u, x, a) => {
      const k = smooth((u - 1.5) / 4.5);
      return { pos: V(a + 17, 1.7, -8.7), target: V().lerpVectors(V(a - 25, 6.0, -1.5), V(x + 0.5, 3.0, TZ), k), fov: 56 };
    } },
  { name: 'Chase', dur: 9, f: (u, x) => ({
      pos: V(x - 11.5 + Math.sin(u * 0.5) * 0.6, 1.5 + u * 0.05, TZ - 1.1), target: V(x + 9, 2.7, TZ), fov: 56 }) },
];
export const SHOT_NAMES = SHOTS.map((s) => s.name);

export class CameraRig {
  constructor(camera, dom, onTakeover) {
    this.camera = camera;
    this.dom = dom;
    this.onTakeover = onTakeover;
    this.mode = 'cinematic';
    this.shot = 0;
    this.shotT = 0;
    this.anchor = 0;
    this.blend = 1;
    this.fromPose = null;
    this.pose = { pos: V(0, 2, 8), target: V(0, 2, 0), fov: 50 };

    this.orbit = { yaw: -2.5, pitch: 0.24, dist: 16, vy: 0, vp: 0 };
    this.drag = null;
    this.pinch = null;
    this.interacting = false;
    this.lastInput = -99;
    this.look = V(0, 2, 0);
    this._bind();
  }

  setMode(m, tram) {
    if (m === this.mode) return;
    this.mode = m;
    if (m === 'cinematic') this.startShot(this.shot, tram.x, true);
    else {
      // continue from current view as an orbit around the tram
      const o = this.orbit;
      const c = this.camera.position;
      const t = V(tram.x, 2.2, TZ);
      const d = c.clone().sub(t);
      o.dist = clamp(d.length(), 7, 40);
      o.yaw = Math.atan2(d.x, d.z);
      o.pitch = clamp(Math.asin(clamp(d.y / Math.max(d.length(), 0.01), -1, 1)), 0.05, 1.2);
    }
  }

  startShot(i, x, keep = false) {
    this.shot = i % SHOTS.length;
    this.shotT = 0;
    this.anchor = x;
    this.fromPose = keep ? { pos: this.camera.position.clone(), target: this.look.clone(), fov: this.camera.fov } : this.fromPose;
    this.blend = keep ? 0 : 1;
  }

  nextShot(tram) { this.startShot(this.shot + 1, tram.x, true); }

  _bind() {
    const el = this.dom;
    el.addEventListener('pointerdown', (e) => {
      if (e.target !== el) return;
      el.setPointerCapture(e.pointerId);
      this.drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 };
      this.pointers = this.pointers || new Map();
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    el.addEventListener('pointermove', (e) => {
      if (this.pointers && this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch) this._zoom((this.pinch - d) * 0.05);
        this.pinch = d;
        this._takeover();
        return;
      }
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX; this.drag.y = e.clientY;
      this.drag.moved += Math.abs(dx) + Math.abs(dy);
      if (this.drag.moved > 4) {
        this._takeover();
        this.orbit.vy -= dx * 0.0045; this.orbit.vp += dy * 0.0035;
        this.orbit.yaw -= dx * 0.0045; this.orbit.pitch = clamp(this.orbit.pitch + dy * 0.0035, 0.04, 1.3);
      }
    });
    const up = (e) => {
      if (this.pointers) this.pointers.delete(e.pointerId);
      if (this.pointers && this.pointers.size < 2) this.pinch = null;
      if (this.drag && e.pointerId === this.drag.id) this.drag = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', (e) => { e.preventDefault(); this._takeover(); this._zoom(e.deltaY * 0.02); }, { passive: false });
  }

  _zoom(d) { this.orbit.dist = clamp(this.orbit.dist * (1 + d * 0.06), 6, 42); }
  _takeover() { this.lastInput = performance.now() / 1000; if (this.mode !== 'orbit') this.onTakeover && this.onTakeover(); }

  update(dt, tram) {
    const cam = this.camera;
    let pos, target, fov;
    if (this.mode === 'cinematic') {
      this.shotT += dt;
      const s = SHOTS[this.shot];
      if (this.shotT > s.dur) { this.startShot(this.shot + 1, tram.x, true); }
      const p = SHOTS[this.shot].f(this.shotT, tram.x, this.anchor);
      if (this.blend < 1 && this.fromPose) {
        this.blend = Math.min(1, this.blend + dt / 1.3);
        const k = smooth(this.blend);
        pos = this.fromPose.pos.clone().lerp(p.pos, k);
        target = this.fromPose.target.clone().lerp(p.target, k);
        fov = lerp(this.fromPose.fov, p.fov, k);
      } else { pos = p.pos; target = p.target; fov = p.fov; }
    } else {
      const o = this.orbit;
      const idle = performance.now() / 1000 - this.lastInput > 4;
      if (idle) o.yaw += dt * 0.05;
      const t = V(tram.x + 0.5, 2.1, TZ);
      pos = V(
        t.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.dist,
        t.y + Math.sin(o.pitch) * o.dist,
        t.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.dist,
      );
      target = t; fov = 50;
    }
    // keep the camera inside the street canyon
    pos.z = clamp(pos.z, -9.0, 9.0);
    pos.y = clamp(pos.y, 0.55, 30);
    cam.position.copy(pos);
    this.look.copy(target);
    cam.fov = fov;
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
}
