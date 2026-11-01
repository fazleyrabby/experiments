import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/*
  Procedural marine life: a pod of bottlenose dolphins riding the hero's bow wave,
  and a humpback whale that surfaces, blows, dives and sometimes breaches.
  Bodies are lofted from elliptical cross-sections; countershading is baked into vertex colours.
*/

const lerp = THREE.MathUtils.lerp;

const sstep = THREE.MathUtils.smoothstep;

// Lofted body along +x (tail at -L/2, rostrum at +L/2), t in 0..1 from tail.
// shape(t) -> { r: lateral radius, h: vertical/lateral ratio, y: centre offset }
// bump(t, a) -> radial displacement, paint(t, a, out) -> vertex colour
function loftBody(L, shape, paint, { segsL = 56, segsR = 20, bump = null } = {}) {
  const pos = [], col = [], idx = [];
  const c = new THREE.Color();
  for (let i = 0; i <= segsL; i++) {
    const t = i / segsL;
    const { r, h, y: yo } = shape(t);
    const x = -L / 2 + t * L;
    for (let j = 0; j <= segsR; j++) {
      const a = (j / segsR) * Math.PI * 2;
      const rr = Math.max(1e-3, r + (bump ? bump(t, a) : 0));
      pos.push(x, yo + Math.sin(a) * rr * h, Math.cos(a) * rr);
      paint(t, a, c);
      col.push(c.r, c.g, c.b);
    }
  }
  const R = segsR + 1;
  for (let i = 0; i < segsL; i++) for (let j = 0; j < segsR; j++) {
    const a = i * R + j, b = (i + 1) * R + j;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// thin fin from a smooth 2D outline (quadratic through the points), extruded and placed
function fin(points, thick, color, m) {
  const s = new THREE.Shape();
  s.moveTo(...points[0]);
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i], [x1, y1] = points[i + 1];
    s.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  s.lineTo(...points[points.length - 1]);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.45, bevelSize: thick * 0.45, bevelSegments: 2, curveSegments: 8 });
  g.translate(0, 0, -thick / 2);
  g.applyMatrix4(m);
  const cc = new THREE.Color(color);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([cc.r, cc.g, cc.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  return g;
}

const M = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)));
const mirrorZ = (pts) => pts.map(([x, y]) => [x, -y]);

/* ---------------------------------------------------------- bottlenose dolphin (2.7 m) */
function dolphinGeometry() {
  const L = 2.7;
  const CAPE = new THREE.Color('#27313a'), SIDE = new THREE.Color('#66737d'), BELLY = new THREE.Color('#dde2e4'), EYE = new THREE.Color('#0d1013');
  const bodyR = (t) => 0.31 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(t, 0.9), 0.78)), 0.62);
  const shape = (t) => {
    let r = bodyR(t), h = 1.06, y = 0;
    if (t < 0.3) { const q = t / 0.3; r *= lerp(0.32, 1, q); h = lerp(2.1, 1.06, q); }          // keeled tail stock
    if (t > 0.8 && t < 0.93) y += 0.035 * Math.sin(((t - 0.8) / 0.13) * Math.PI);                  // melon
    if (t > 0.9) { const q = (t - 0.9) / 0.1; r = lerp(bodyR(0.9), 0.075, sstep(q, 0, 0.35)) * lerp(1, 0.6, q); y -= 0.075 * sstep(q, 0, 0.4); h = lerp(1.06, 0.85, q); } // beak
    return { r, h, y };
  };
  const paint = (t, a, c) => {
    const up = Math.sin(a);
    const capeLine = 0.62 - 0.28 * Math.sin(Math.PI * sstep(t, 0.3, 0.95));
    c.copy(SIDE).lerp(CAPE, sstep(up, capeLine - 0.12, capeLine + 0.08));
    c.lerp(BELLY, sstep(-up, 0.05, 0.4));
    const eye = Math.hypot((t - 0.882) * 40, (Math.abs(Math.cos(a)) - 0.93) * 18);
    if (up > -0.2 && eye < 1) c.lerp(EYE, 1 - eye);
  };
  const body = loftBody(L, shape, paint, { segsL: 64, segsR: 22 });
  const dark = '#28323b';
  const dorsal = fin([[0, 0], [-0.05, 0.16], [-0.17, 0.33], [-0.36, 0.44], [-0.31, 0.3], [-0.3, 0.14], [-0.44, 0]], 0.045, dark, M(0.12, 0.27, 0));
  const flukeHalf = [[0, 0], [-0.04, 0.12], [-0.16, 0.33], [-0.33, 0.44], [-0.27, 0.27], [-0.2, 0.09], [-0.24, 0]];
  const flukes = [flukeHalf, mirrorZ(flukeHalf)].map((pts) => fin(pts, 0.035, dark, M(-1.28, 0, 0, Math.PI / 2, 0, 0)));
  const pec = [[0, 0], [-0.08, 0.1], [-0.26, 0.17], [-0.36, 0.15], [-0.18, 0.02], [-0.12, -0.03]];
  const pecL = fin(pec, 0.03, dark, M(0.55, -0.13, 0.2, -1.0, 0.25, 0.35));
  const pecR = fin(mirrorZ(pec), 0.03, dark, M(0.55, -0.13, -0.2, 1.0, -0.25, 0.35));
  return merge([body, dorsal, ...flukes, pecL, pecR]);
}

/* ---------------------------------------------------------- humpback whale (14 m) */
function whaleGeometry() {
  const L = 14;
  const BLACK = new THREE.Color('#14181b'), GREY = new THREE.Color('#3a4247'), WHITE = new THREE.Color('#cdd2d3'), GROOVE = new THREE.Color('#6d767a');
  const bodyR = (t) => 1.6 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.7)), 0.78);
  const shape = (t) => {
    let r = bodyR(t), h = 0.95, y = 0;
    if (t < 0.32) { const q = t / 0.32; r *= lerp(0.2, 1, Math.pow(q, 0.8)); h = lerp(1.9, 0.95, q); }
    if (t > 0.78) { const q = (t - 0.78) / 0.22; h = lerp(0.95, 0.6, q); y = -0.35 * q; r *= lerp(1, 0.86, q); } // flat broad rostrum
    if (t > 0.955) r *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.955) / 0.045, 2))); // rounded snout
    return { r, h, y };
  };
  // knobbly tubercles along the top of the head
  const bump = (t, a) => {
    if (t < 0.8 || Math.sin(a) < 0.35) return 0;
    const k = Math.pow(Math.max(0, Math.sin(t * 260) * Math.sin(a * 13)), 6);
    return k * 0.09 * sstep(t, 0.8, 0.86);
  };
  const paint = (t, a, c) => {
    const up = Math.sin(a);
    c.copy(BLACK).lerp(GREY, sstep(-up, -0.2, 0.3) * 0.5);
    const mottle = 0.5 + 0.5 * Math.sin(t * 90 + a * 7) * Math.sin(t * 37 - a * 3);
    c.lerp(WHITE, sstep(-up, 0.35, 0.75) * sstep(mottle, 0.25, 0.65));
    if (t > 0.6 && t < 0.97 && up < -0.45) {                                // ventral throat grooves
      const g = sstep(Math.cos(a * 46), 0.6, 0.9) * sstep(-up, 0.45, 0.7);
      c.lerp(GROOVE, g * 0.45);
    }
  };
  const body = loftBody(L, shape, paint, { segsL: 90, segsR: 30, bump });
  const dark = '#15191c', pale = '#d0d5d6';
  const hump = fin([[0, 0], [-0.4, 0.3], [-0.9, 0.46], [-1.4, 0.3], [-1.7, 0]], 0.3, dark, M(-1.6, 1.45, 0));
  // flukes: wide, serrated trailing edge; pale underside layer
  const flukeHalf = [[0, 0], [-0.4, 0.9], [-1.4, 2.0], [-2.5, 2.5], [-2.2, 1.9], [-2.0, 1.4], [-1.85, 0.9], [-1.7, 0.4], [-1.85, 0]];
  const flukes = [flukeHalf, mirrorZ(flukeHalf)].flatMap((pts) => [
    fin(pts, 0.14, dark, M(-6.7, 0.04, 0, Math.PI / 2, 0, 0)),
    fin(pts, 0.04, pale, M(-6.7, -0.1, 0, Math.PI / 2, 0, 0)),
  ]);
  // long white pectoral flippers with a scalloped leading edge
  const pec = [[0, 0], [-0.3, 0.35], [-1.2, 0.55], [-1.6, 0.75], [-2.4, 0.78], [-2.8, 0.98], [-3.6, 0.95], [-4.0, 1.1], [-4.7, 0.9], [-4.5, 0.6], [-2.6, 0.2], [-1.0, -0.15], [-0.2, -0.3]];
  const pecL = fin(pec, 0.2, pale, M(3.6, -0.75, 1.3, -0.95, -0.55, 0.3, 1.25));
  const pecR = fin(mirrorZ(pec), 0.2, pale, M(3.6, -0.75, -1.3, 0.95, 0.55, 0.3, 1.25));
  return merge([body, hump, ...flukes, pecL, pecR]);
}

// MeshStandardMaterial plus a travelling tail-beat wave in the vertex shader
function swimMaterial(halfLen, amp, freq, time) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.05, envMapIntensity: 1.0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSwimT = time;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uSwimT;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fw = smoothstep(${(halfLen * 0.2).toFixed(3)}, ${(-halfLen).toFixed(3)}, position.x);
        float ph = 0.0;
        #ifdef USE_INSTANCING
          ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.21;
        #endif
        transformed.y += sin(uSwimT * ${freq.toFixed(3)} + ph - position.x * ${(1.7 / halfLen).toFixed(4)}) * ${amp.toFixed(3)} * fw * fw;`);
  };
  return mat;
}

export class SeaLife {
  constructor(scene, waves, particles, { dolphins = 8, whale = true } = {}) {
    this.waves = waves; this.particles = particles;
    this.swimT = { value: 0 };
    this.pod = new THREE.InstancedMesh(dolphinGeometry(), swimMaterial(1.35, 0.11, 8.5, this.swimT), dolphins);
    this.pod.frustumCulled = false;
    this.pod.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.pod);
    this.dolphins = [...Array(dolphins)].map(() => ({
      ax: 18 + Math.random() * 45, az: (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 22),
      period: 2.6 + Math.random() * 2.2, phase: Math.random() * 10, h: 2.2 + Math.random() * 1.6,
      wob: Math.random() * 6, prevS: 1,
    }));
    this.whale = whale ? new THREE.Mesh(whaleGeometry(), swimMaterial(7, 0.45, 1.4, this.swimT)) : null;
    if (this.whale) {
      this.whale.frustumCulled = false;
      scene.add(this.whale);
      this.w = { state: 'swim', t: 0, dur: 6, ax: 180, az: -140, y: -8, pitch: 0, roll: 0, yaw: 0.25 };
    }
    this.onSplash = null;
    this.enabled = true;
    // sightings are random: long empty stretches, then a visit
    const rnd = (a, b) => a + Math.random() * (b - a);
    this.rnd = rnd;
    this.podTimer = rnd(25, 90);   // until the pod shows up
    this.podOn = false;
    this.whaleTimer = rnd(45, 150); // until the whale shows up
    this.whaleOn = false;
    this.whaleEvents = 0;
    this.pod.visible = false;
    if (this.whale) this.whale.visible = false;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(0, 0, 0, 'YZX');
    this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1);
  }

  setVisible(v) {
    this.enabled = v;
    this.pod.visible = v && this.podOn;
    if (this.whale) this.whale.visible = v && this.whaleOn;
  }

  // force a sighting (debug / photo mode)
  summon() { this.podTimer = 0; this.whaleTimer = 0; }

  local(m, lx, lz, out) {
    const c = Math.cos(m.heading), s = Math.sin(m.heading);
    out.x = m.pos.x + lx * c + lz * s;
    out.z = m.pos.y - lx * s + lz * c;
    return out;
  }

  splash(x, y, z, n, size, up) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3, rr = Math.random() * size * 0.35;
      this.particles.emit(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr,
        Math.cos(a) * sp, up * (0.4 + Math.random() * 0.8), Math.sin(a) * sp,
        0.8 + Math.random() * 1.0, size * 0.4, size * (1.2 + Math.random()), 0.45, 1, 9, 0.4);
    }
  }

  update(dt, t, hero) {
    if (!this.enabled) return;
    this.headingRef = hero.heading;
    this.swimT.value = t;
    const W = this.waves;
    const L = hero.ship.L;
    const pt = { x: 0, z: 0 };
    this.podTimer -= dt;
    if (this.podTimer <= 0) {
      this.podOn = !this.podOn;
      this.podTimer = this.podOn ? this.rnd(40, 90) : this.rnd(90, 260);
      if (this.podOn) this.dolphins.forEach((d) => { d.join = this.rnd(0, 12); d.ax = 18 + Math.random() * 45; d.az = (Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 22); });
    }
    this.pod.visible = this.podOn;
    // dolphins porpoise ahead of the bow, matching the ship's speed
    if (this.podOn) this.dolphins.forEach((d, i) => {
      d.join -= dt;
      if (d.join > 0 || this.podTimer < (i % 4) * 2.5) { // arrive and leave one by one
        this._m.makeTranslation(0, -500, 0); this.pod.setMatrixAt(i, this._m); return;
      }
      const lx = L / 2 + d.ax + Math.sin(t * 0.3 + d.wob) * 6;
      const lz = d.az + Math.sin(t * 0.21 + d.wob * 2) * 4;
      this.local(hero, lx, lz, pt);
      const water = W.heightAt(pt.x, pt.z, t);
      const u = ((t + d.phase) % d.period) / d.period;
      const leapFrac = 0.42;
      let y, pitch;
      if (u < leapFrac) {
        const s = u / leapFrac;
        y = water - 1.3 + d.h * 4 * s * (1 - s);
        const dy = d.h * 4 * (1 - 2 * s), dx = (hero.speed + 4) * d.period * leapFrac;
        pitch = Math.atan2(dy, dx);
        if (d.prevS > s) this.splash(pt.x, water, pt.z, 10, 1.6, 4);   // exit
        if (s > 0.93 && d.prevS <= 0.93) { this.splash(pt.x, water, pt.z, 14, 1.8, 3); if (this.onSplash) this.onSplash(pt, 0.08); }
        d.prevS = s;
      } else {
        y = water - 2.4; pitch = 0; d.prevS = 1;
      }
      this._e.set(Math.sin(t * 2 + d.wob) * 0.08, hero.heading + Math.sin(t * 0.4 + d.wob) * 0.08, pitch);
      this._q.setFromEuler(this._e);
      this._m.compose(this._p.set(pt.x, y, pt.z), this._q, this._s);
      this.pod.setMatrixAt(i, this._m);
    });
    this.pod.instanceMatrix.needsUpdate = true;

    if (!this.whale) return;
    const w = this.w;
    if (!this.whaleOn) {
      this.whaleTimer -= dt;
      this.whale.visible = false;
      if (this.whaleTimer > 0) return;
      this.whaleOn = true; this.whaleEvents = 1 + Math.floor(Math.random() * 3);
      w.state = 'swim'; w.t = 0; w.dur = 2 + Math.random() * 4; w.y = -12;
    }
    this.whale.visible = true;
    w.t += dt;
    w.ax += (hero.speed * 0.15) * dt; // drifts slowly aft relative to the ship
    if (w.ax < -L) w.ax = 260;
    this.local(hero, w.ax, w.az, pt);
    const water = W.heightAt(pt.x, pt.z, t);
    const k = Math.min(1, w.t / w.dur);
    const next = (state, dur) => { w.state = state; w.t = 0; w.dur = dur; };
    switch (w.state) {
      case 'swim':
        w.y = lerp(w.y, -9, 1 - Math.exp(-dt)); w.pitch = lerp(w.pitch, 0, dt);
        if (k >= 1) {
          if (Math.random() < 0.35) next('breach', 3.6);
          else { next('surface', 6); this.blow(pt, water); }
          w.ax = 140 + Math.random() * 120; w.az = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 110);
        }
        break;
      case 'surface':
        w.y = lerp(w.y, water - 0.9, 1 - Math.exp(-dt * 1.5));
        w.pitch = Math.sin(k * Math.PI) * 0.06;
        if (k > 0.45 && k - dt / w.dur <= 0.45) this.blow(pt, water);
        if (k >= 1) next('dive', 4);
        break;
      case 'dive': {
        // arch and lift the flukes clear as it sounds
        w.pitch = -Math.sin(Math.min(1, k * 1.1) * Math.PI * 0.5) * 1.05;
        w.y = water - 1.2 - k * 6;
        if (k > 0.55 && k - dt / w.dur <= 0.55) this.splash(pt.x, water, pt.z, 30, 3, 5);
        if (k >= 1) { next('swim', 10 + Math.random() * 10); this.endEvent(); }
        break;
      }
      case 'breach': {
        const s = k;
        if (s < 0.45) { const q = s / 0.45; w.y = lerp(-10, water + 3.5, Math.sin(q * Math.PI * 0.5)); w.pitch = lerp(1.2, 1.15, q); w.roll = q * 0.6; }
        else { const q = (s - 0.45) / 0.55; w.y = lerp(water + 3.5, water - 6, q * q); w.pitch = lerp(1.15, -0.2, q); w.roll = 0.6 + q * 1.2; }
        if (s > 0.08 && s - dt / w.dur <= 0.08) this.splash(pt.x, water, pt.z, 50, 4, 9);
        if (s > 0.72 && s - dt / w.dur <= 0.72) { this.splash(pt.x, water, pt.z, 140, 6, 16); if (this.onSplash) this.onSplash(pt, 0.9); }
        if (k >= 1) { w.roll = 0; next('swim', 14 + Math.random() * 10); this.endEvent(); }
        break;
      }
    }
    this.whale.position.set(pt.x, w.y, pt.z);
    this.whale.rotation.set(w.roll, hero.heading + w.yaw, w.pitch, 'YZX');
  }

  endEvent() {
    if (--this.whaleEvents <= 0) { this.whaleOn = false; this.whaleTimer = this.rnd(120, 360); }
  }

  blow(pt, water) {
    const hx = Math.cos(this.headingRef || 0) * 4.5, hz = -Math.sin(this.headingRef || 0) * 4.5;
    // the spout: a tall bushy column of vapour that the wind leans over
    for (let i = 0; i < 46; i++) {
      this.particles.emit(pt.x + hx + (Math.random() - 0.5), water + 1.2, pt.z + hz + (Math.random() - 0.5),
        (Math.random() - 0.5) * 2, 9 + Math.random() * 6, (Math.random() - 0.5) * 2,
        1.8 + Math.random() * 1.4, 1.2, 6 + Math.random() * 5, 0.4, 1, 3, 0.6);
    }
    if (this.onSplash) this.onSplash(pt, 0.15);
  }
}
