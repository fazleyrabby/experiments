import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const CAMERA_MODES = ['cinematic', 'chase', 'mirror', 'orbit'];

// Scripted "hands-on" move for the showcase recording: push in, orbit the rider,
// dip to the waterline for the reflection, then pull back out wide.
// az: angle from the rider's right side toward the front (rad); h: camera height;
// ty: look-at height; lead: look-at distance ahead of the bike.
const SHOWCASE_KEYS = [
  { t: 0.0, az: 0.0, dist: 18, h: 2.0, ty: 2.8, lead: 1.6 },
  { t: 2.5, az: 0.15, dist: 9, h: 1.7, ty: 1.6, lead: 0.6 },
  { t: 5.0, az: 0.8, dist: 4.2, h: 1.45, ty: 1.0, lead: 0.1 },
  { t: 7.5, az: 1.6, dist: 3.6, h: 1.05, ty: 0.95, lead: 0.0 },
  { t: 9.5, az: 2.3, dist: 5.0, h: 0.35, ty: 0.9, lead: 0.0 },
  { t: 11.5, az: 2.9, dist: 10, h: 1.6, ty: 1.3, lead: 0.5 },
  { t: 14.0, az: 3.3, dist: 20, h: 2.0, ty: 2.7, lead: 1.8 },
];
export const SHOWCASE_DURATION = SHOWCASE_KEYS[SHOWCASE_KEYS.length - 1].t;
// Keys were framed for the 52° portrait lens; other lenses scale distance to match.
const SHOWCASE_HALF_FOV_TAN = Math.tan(THREE.MathUtils.degToRad(26));

const catmullRom = (p0, p1, p2, p3, u) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

function sampleShowcase(t) {
  const K = SHOWCASE_KEYS;
  t = THREE.MathUtils.clamp(t, 0, SHOWCASE_DURATION);
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1].t) i++;
  const u = (t - K[i].t) / (K[i + 1].t - K[i].t);
  const k0 = K[Math.max(i - 1, 0)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(i + 2, K.length - 1)];
  const out = {};
  for (const key of ['az', 'dist', 'h', 'ty', 'lead']) out[key] = catmullRom(k0[key], k1[key], k2[key], k3[key], u);
  return out;
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _delta = new THREE.Vector3();

// Interpolate camera offsets around the rider in cylindrical coordinates so mode
// changes swing around the cyclist instead of cutting through them.
function lerpOrbital(current, target, k) {
  const r0 = Math.hypot(current.x, current.z);
  const r1 = Math.hypot(target.x, target.z);
  const a0 = Math.atan2(current.z, current.x);
  let da = Math.atan2(target.z, target.x) - a0;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  const a = a0 + da * k;
  const r = r0 + (r1 - r0) * k;
  current.set(Math.cos(a) * r, current.y + (target.y - current.y) * k, Math.sin(a) * r);
}

export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.mode = 'cinematic';
    this.time = 0;
    this.offset = new THREE.Vector3();
    this.lookOffset = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.lastBike = new THREE.Vector3();
    this.initialized = false;
    this.onModeChange = null;
    this.showcaseTime = 0;

    const controls = (this.controls = new OrbitControls(camera, dom));
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI / 2 - 0.004;
    controls.rotateSpeed = 0.6;
    // Any drag or zoom hands the camera to the user.
    controls.addEventListener('start', () => this.setMode('orbit'));
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (mode === 'showcase') this.showcaseTime = 0;
    if (mode === 'orbit') {
      this.controls.target.copy(this.target);
      this.controls.update();
    }
    this.onModeChange?.(mode);
  }

  desired(c, outPos, outLook) {
    const f = c.forward;
    const r = c.right;
    const t = this.time;
    switch (this.mode) {
      case 'showcase': {
        const s = sampleShowcase(this.showcaseTime);
        const zoom = SHOWCASE_HALF_FOV_TAN / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
        const dist = s.dist * zoom;
        outPos.copy(r).multiplyScalar(Math.cos(s.az) * dist).addScaledVector(f, Math.sin(s.az) * dist).setY(s.h);
        outLook.copy(f).multiplyScalar(s.lead * zoom).setY(s.ty);
        break;
      }
      case 'chase':
        outPos.copy(f).multiplyScalar(-5).addScaledVector(r, 1.4).setY(1.6);
        outLook.copy(f).multiplyScalar(5).setY(1.0);
        break;
      case 'mirror':
        outPos.copy(r).multiplyScalar(8).addScaledVector(f, 1.2).setY(0.3);
        outLook.copy(f).multiplyScalar(1.2).setY(0.95);
        break;
      default: {
        // Slow documentary-style tracking shot from the side, horizon just below centre.
        const swing = 0.22 * Math.sin(t * 0.031);
        const dist = 18.5 + 2 * Math.sin(t * 0.023 + 1.0);
        const height = 2.0 + 0.25 * Math.sin(t * 0.05);
        outPos.copy(r).multiplyScalar(Math.cos(swing) * dist).addScaledVector(f, Math.sin(swing) * dist).setY(height);
        // Lead room ahead of the rider puts them roughly on the left third.
        outLook.copy(f).multiplyScalar(dist * 0.09).setY(height + dist * 0.045);
      }
    }
  }

  update(dt, cyclist) {
    this.time += dt;
    const bike = cyclist.position;

    if (!this.initialized) {
      this.desired(cyclist, this.offset, this.lookOffset);
      this.lastBike.copy(bike);
      this.initialized = true;
    }

    if (this.mode === 'orbit') {
      _delta.subVectors(bike, this.lastBike);
      this.camera.position.add(_delta);
      this.controls.target.add(_delta);
      this.controls.update();
      if (this.camera.position.y < 0.15) this.camera.position.y = 0.15;
      this.target.copy(this.controls.target);
      this.offset.subVectors(this.camera.position, bike);
      this.lookOffset.subVectors(this.target, bike);
    } else {
      this.desired(cyclist, _pos, _look);
      if (this.mode === 'showcase') {
        // The spline is already smooth; follow it exactly.
        this.showcaseTime += dt;
        this.offset.copy(_pos);
        this.lookOffset.copy(_look);
      } else {
        const k = 1 - Math.exp(-dt * 1.8);
        lerpOrbital(this.offset, _pos, k);
        this.lookOffset.lerp(_look, k);
      }
      this.camera.position.copy(bike).add(this.offset);
      this.target.copy(bike).add(this.lookOffset);
      this.camera.lookAt(this.target);
    }
    this.lastBike.copy(bike);
  }
}
