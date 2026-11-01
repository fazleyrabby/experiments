import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Landscape } from './landscape';
import { Rng, noise, smoothstep } from '../core/noise';
import { patch } from '../core/shaders';
import { pineMask } from './ecology';
import { VIADUCT } from './layout';
import { prep } from '../train/geo';

const C = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

type Mode = 'graze' | 'walk' | 'watch';

interface Sheep {
  x: number; z: number;
  h: number; // heading (rad, 0 = +z)
  speed: number;
  mode: Mode;
  timer: number;
  graze: number; // 0..1 head down
  phase: number;
  seed: number;
  scale: number;
  flock: number;
  hx: number; hz: number; // cached hazard push
  nextBleat: number;
}

interface Flock {
  cx: number; cz: number; // home
  radius: number;
  members: number[];
}

/**
 * Highland blackface sheep: procedural geometry (lumpy wool body, dark face and legs), GPU-animated
 * legs / head, simple boid flocking on the real terrain, grazing, and looking up when the train passes.
 */
export class SheepFlocks {
  readonly group = new THREE.Group();
  private sheep: Sheep[] = [];
  private flocks: Flock[] = [];
  private mesh: THREE.InstancedMesh; // near sheep: full detail
  private meshLo: THREE.InstancedMesh; // distant sheep: simplified
  private state: THREE.InstancedBufferAttribute;
  private stateLo: THREE.InstancedBufferAttribute;
  private frame = 0;
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private fwd = new THREE.Vector3();
  private right = new THREE.Vector3();
  private up = new THREE.Vector3();
  private pos = new THREE.Vector3();
  private scl = new THREE.Vector3();
  /** distance-weighted bleat request from the last update (0 = none) */
  bleat = 0;
  readonly count: number;

  constructor(private land: Landscape, count: number, shadows: boolean) {
    this.group.name = 'sheep';
    const rng = new Rng(555);
    this.placeFlocks(rng, count);
    this.count = this.sheep.length;

    const geo = this.buildGeometry(true);
    const geoLo = this.buildGeometry(false);
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }), {
      key: 'sheep',
      vertDecl: 'attribute vec4 aState; attribute vec3 aAnim; varying float vWool;',
      vertMain: /* glsl */ `
        vWool = aAnim.z;
        float walk = aState.y;
        float ph = aState.x;
        // legs swing about the hip (diagonal pairs), weight grows towards the hoof
        float lw = clamp(1.0 - position.y / 0.36, 0.0, 1.0) * abs(aAnim.x);
        transformed.z += sin(ph + (aAnim.x > 0.0 ? 0.0 : 3.14159)) * 0.16 * walk * lw;
        transformed.y += max(0.0, cos(ph + (aAnim.x > 0.0 ? 0.0 : 3.14159))) * 0.05 * walk * lw;
        // body sway and head: down to graze (with chewing), alert head up
        float hw = aAnim.y;
        float graze = aState.z;
        transformed.y -= hw * graze * 0.34;
        transformed.z += hw * graze * 0.16;
        transformed.y += hw * (1.0 - graze) * (1.0 - walk) * 0.03;
        transformed.y += hw * graze * sin(uTime * 7.0 + aState.w * 20.0) * 0.012;
        transformed.y += sin(ph * 2.0) * 0.012 * walk;
        transformed.x += sin(ph) * 0.02 * walk * (1.0 - abs(aAnim.x));
      `,
      fragDecl: 'varying float vWool;',
      fragColor: /* glsl */ `
        float fl = heVNoise(vOPos * 22.0 + 3.0);
        diffuseColor.rgb *= mix(1.0, 0.8 + 0.4 * fl, vWool);
        // curly wool: darker pockets
        diffuseColor.rgb *= mix(1.0, 0.72 + 0.4 * heVNoise(vOPos * 46.0), vWool * 0.8);
      `,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.sheep.length);
    this.meshLo = new THREE.InstancedMesh(geoLo, mat, this.sheep.length);
    this.stateLo = new THREE.InstancedBufferAttribute(new Float32Array(this.sheep.length * 4), 4);
    this.stateLo.setUsage(THREE.DynamicDrawUsage);
    geoLo.setAttribute('aState', this.stateLo);
    this.meshLo.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.meshLo.castShadow = false;
    this.meshLo.receiveShadow = true;
    this.meshLo.frustumCulled = false;
    this.group.add(this.meshLo);
    this.state = new THREE.InstancedBufferAttribute(new Float32Array(this.sheep.length * 4), 4);
    this.state.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aState', this.state);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = shadows;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.writeAll(0);
  }

  // ------------------------------------------------------------- geometry
  private buildGeometry(hi: boolean): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];
    const add = (g: THREE.BufferGeometry, m: THREE.Matrix4, colour: (p: THREE.Vector3) => THREE.Color, anim: (p: THREE.Vector3) => [number, number, number]) => {
      const gg = prep(g);
      gg.deleteAttribute('uv');
      gg.applyMatrix4(m);
      const p = gg.attributes.position;
      const col = new Float32Array(p.count * 3), an = new Float32Array(p.count * 3);
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const c = colour(v);
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        const a = anim(v);
        an[i * 3] = a[0]; an[i * 3 + 1] = a[1]; an[i * 3 + 2] = a[2];
      }
      gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      gg.setAttribute('aAnim', new THREE.BufferAttribute(an, 3));
      parts.push(gg);
    };
    const T = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0) =>
      new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(sx, sy, sz));
    const wool = C(0.80, 0.76, 0.66), woolDark = C(0.62, 0.58, 0.50);
    const dark = C(0.07, 0.065, 0.06);

    // woolly body: displaced icosphere, plus a couple of overlapping lumps
    const body = (sx: number, sy: number, sz: number, ox: number, oy: number, oz: number, seed: number) => {
      const g = new THREE.IcosahedronGeometry(1, hi ? 2 : 0);
      const p = g.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const k = 1 + 0.16 * noise.n3(v.x * 3.2 + seed, v.y * 3.2, v.z * 3.2) + 0.07 * noise.n3(v.x * 9 + seed, v.y * 9, v.z * 9);
        p.setXYZ(i, v.x * k, v.y * k, v.z * k);
      }
      g.computeVertexNormals();
      add(g, T(ox, oy, oz, sx, sy, sz), (q) => wool.clone().lerp(woolDark, Math.max(0, 0.45 - q.y * 0.9)), () => [0, 0, 1]);
    };
    body(0.27, 0.27, 0.46, 0, 0.5, -0.02, 1);
    body(0.22, 0.2, 0.2, 0, 0.62, 0.3, 7); // shoulders / ruff
    body(0.2, 0.2, 0.2, 0, 0.55, -0.34, 4);

    // legs: weights + diagonal gait signs (FL/BR = +, FR/BL = -)
    const legs: [number, number, number][] = [[0.12, 0.26, 1], [-0.12, 0.26, -1], [0.12, -0.26, -1], [-0.12, -0.26, 1]];
    for (const [x, z, sign] of legs) {
      const g = new THREE.CylinderGeometry(0.032, 0.026, 0.4, hi ? 6 : 4, 1);
      add(g, T(x, 0.2, z), () => dark, () => [sign, 0, 0]);
      add(new THREE.SphereGeometry(0.036, hi ? 6 : 4, hi ? 4 : 3), T(x, 0.02, z, 1, 0.6, 1.3), () => C(0.04, 0.04, 0.04), () => [sign, 0, 0]);
    }
    // head and neck (head group moves as one: weight 1), black face, pale ears
    const head = new THREE.SphereGeometry(0.1, hi ? 10 : 6, hi ? 8 : 4);
    add(head, T(0, 0.68, 0.58, 0.9, 1.0, 1.35), () => dark, () => [0, 1, 0]);
    add(new THREE.SphereGeometry(0.06, 8, 6), T(0, 0.64, 0.7, 0.9, 0.9, 1.3), () => C(0.12, 0.11, 0.1), () => [0, 1, 0]);
    // neck: starts well inside the shoulders and blends from fixed (weight 0) to the moving head (weight 1)
    // so the head can drop to graze without ever pulling away from the body
    add(new THREE.CylinderGeometry(0.078, 0.115, 0.52, hi ? 8 : 5, hi ? 4 : 2), T(0, 0.605, 0.4, 1, 1, 1, 1.22), () => dark, (p) => [0, Math.min(1, Math.max(0, (p.z - 0.2) / 0.36)), 0]);
    add(new THREE.SphereGeometry(0.15, 8, 6), T(0, 0.56, 0.25, 1, 0.95, 1), () => wool, () => [0, 0, 1]); // wool ruff hiding the join
    for (const sx of [-1, 1]) {
      add(new THREE.SphereGeometry(0.05, 6, 4), T(sx * 0.13, 0.73, 0.54, 1.2, 0.35, 0.8), () => C(0.14, 0.12, 0.1), () => [0, 1, 0]);
      // curled horns (rams are common on the hill)
      add(new THREE.TorusGeometry(0.06, 0.013, hi ? 5 : 3, hi ? 9 : 5, Math.PI * 1.35), new THREE.Matrix4().compose(new THREE.Vector3(sx * 0.1, 0.77, 0.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, sx * 1.1, 0)), new THREE.Vector3(1, 1, 1)), () => C(0.5, 0.44, 0.34), () => [0, 1, 0]);
    }
    add(new THREE.SphereGeometry(0.05, 6, 5), T(0, 0.66, -0.5, 1, 1.4, 1), () => wool, () => [0, 0, 1]); // tail
    const merged = mergeGeometries(parts, false)!;
    merged.computeBoundingSphere();
    return merged;
  }

  // -------------------------------------------------------------- placement
  private placeFlocks(rng: Rng, total: number) {
    const land = this.land;
    const per = 14;
    const nFlocks = Math.max(2, Math.round(total / per));
    const candidates: { x: number; z: number; score: number }[] = [];
    for (let i = 0; i < 4200; i++) {
      // bias: half around the viaduct glen, half along the line
      const near = i % 2 === 0;
      const x = near ? rng.range(-190, 200) : rng.range(-360, 360);
      const z = near ? rng.range(-70, 230) : rng.range(-520, 330);
      const h = land.fastHeight(x, z);
      const slope = land.fastSlope(x, z);
      if (slope > 0.3 || h < 1.5 || h > 90) continue;
      const td = land.trackDistance(x, z);
      if (td < 16) continue;
      if (land.riverDist(x, z) < 9) continue;
      if (pineMask(x, z, h, slope) > 0.15) continue;
      const dx = x - VIADUCT.cx, dz = z - VIADUCT.cz;
      const rho = Math.hypot(dx, dz);
      if (Math.abs(rho - VIADUCT.radius) < 16 && Math.abs(Math.atan2(dx, dz) * VIADUCT.radius) < VIADUCT.halfLen + 10) continue;
      let score = rng.next();
      if (td < 90) score += 0.5;
      if (near) score += 0.6;
      candidates.push({ x, z, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const chosen: { x: number; z: number }[] = [];
    for (const c of candidates) {
      if (chosen.length >= nFlocks) break;
      if (chosen.every((o) => Math.hypot(o.x - c.x, o.z - c.z) > 58)) chosen.push(c);
    }
    chosen.forEach((c, fi) => {
      const n = Math.max(5, Math.round(per * rng.range(0.6, 1.35)));
      const f: Flock = { cx: c.x, cz: c.z, radius: rng.range(38, 62), members: [] };
      for (let k = 0; k < n; k++) {
        const a = rng.range(0, Math.PI * 2), d = Math.sqrt(rng.next()) * 14;
        const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
        if (land.fastSlope(x, z) > 0.45 || land.riverDist(x, z) < 5) continue;
        const lamb = rng.chance(0.18);
        f.members.push(this.sheep.length);
        this.sheep.push({
          x, z, h: rng.range(0, Math.PI * 2), speed: 0, mode: rng.chance(0.7) ? 'graze' : 'walk', timer: rng.range(1, 9),
          graze: 0, phase: rng.range(0, 6.28), seed: rng.next(), scale: lamb ? rng.range(0.55, 0.7) : rng.range(0.9, 1.12), flock: fi, hx: 0, hz: 0,
          nextBleat: rng.range(5, 40),
        });
      }
      this.flocks.push(f);
    });
  }

  // ------------------------------------------------------------- simulation
  private hazard(x: number, z: number): number {
    const land = this.land;
    const h = land.fastHeight(x, z);
    const slope = land.fastSlope(x, z);
    let hz = smoothstep(0.35, 0.7, slope);
    hz = Math.max(hz, 1 - smoothstep(5, 11, land.trackDistance(x, z)));
    hz = Math.max(hz, 1 - smoothstep(3.5, 8, land.riverDist(x, z)));
    hz = Math.max(hz, smoothstep(0.1, 0.45, pineMask(x, z, h, slope)));
    return hz;
  }

  private writeAll(time: number) {
    const arr = this.state.array as Float32Array;
    this.sheep.forEach((s, i) => this.write(s, i, arr, time));
    this.mesh.count = this.sheep.length;
    this.meshLo.count = 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.state.needsUpdate = true;
  }

  write(s: Sheep, i: number, arr: Float32Array, _time: number, mesh: THREE.InstancedMesh = this.mesh) {
    const land = this.land;
    const y = land.fastHeight(s.x, s.z);
    this.fwd.set(Math.sin(s.h), 0, Math.cos(s.h));
    // tilt to the ground: sample ahead / behind and to the sides
    const yf = land.fastHeight(s.x + this.fwd.x * 0.45, s.z + this.fwd.z * 0.45);
    const yb = land.fastHeight(s.x - this.fwd.x * 0.45, s.z - this.fwd.z * 0.45);
    const yl = land.fastHeight(s.x + this.fwd.z * 0.3, s.z - this.fwd.x * 0.3);
    const yr = land.fastHeight(s.x - this.fwd.z * 0.3, s.z + this.fwd.x * 0.3);
    this.fwd.y = (yf - yb) / 0.9;
    this.fwd.normalize();
    this.right.set(this.fwd.z, (yl - yr) / 0.6, -this.fwd.x).normalize();
    this.up.crossVectors(this.fwd, this.right).normalize(); // (z x x) = y
    if (this.up.y < 0) this.up.negate();
    this.right.crossVectors(this.up, this.fwd).normalize();
    this.m.makeBasis(this.right, this.up, this.fwd);
    this.q.setFromRotationMatrix(this.m);
    this.pos.set(s.x, y - 0.02, s.z);
    this.scl.setScalar(s.scale);
    this.m.compose(this.pos, this.q, this.scl);
    mesh.setMatrixAt(i, this.m);
    arr[i * 4] = s.phase;
    arr[i * 4 + 1] = Math.min(1, s.speed / 0.8);
    arr[i * 4 + 2] = s.graze;
    arr[i * 4 + 3] = s.seed;
  }

  /**
   * @param train world position of the locomotive (sheep watch it go by)
   * @param cam   camera position (for distance-based work)
   */
  update(dt: number, time: number, train: THREE.Vector3, cam: THREE.Vector3) {
    this.frame++;
    this.bleat = 0;
    dt = Math.min(dt, 0.1);
    const arrHi = this.state.array as Float32Array;
    const arrLo = this.stateLo.array as Float32Array;
    let nHi = 0, nLo = 0;
    const S = this.sheep;
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      const f = this.flocks[s.flock];
      // refresh hazard push for this sheep on a staggered schedule
      if ((this.frame + i) % 14 === 0) {
        const e = 4;
        const hx = this.hazard(s.x + e, s.z) - this.hazard(s.x - e, s.z);
        const hz = this.hazard(s.x, s.z + e) - this.hazard(s.x, s.z - e);
        s.hx = -hx; s.hz = -hz;
        const here = this.hazard(s.x, s.z);
        if (here > 0.6) { s.hx *= 3; s.hz *= 3; }
      }
      const dTrain = Math.hypot(s.x - train.x, s.z - train.z);
      s.timer -= dt;
      if (dTrain < 55 && dTrain > 9 && s.mode !== 'watch') {
        s.mode = 'watch';
        s.timer = 3 + s.seed * 4;
      }
      if (s.mode === 'watch') {
        // stand and track the locomotive with their head up
        const want = Math.atan2(train.x - s.x, train.z - s.z);
        let dh = want - s.h;
        dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        s.h += dh * Math.min(1, dt * 2.2);
        s.speed *= Math.max(0, 1 - dt * 4);
        s.graze += (0 - s.graze) * Math.min(1, dt * 5);
        if (dTrain > 70 || dTrain < 9) {
          s.mode = 'graze';
          s.timer = 2 + s.seed * 6;
        }
      } else {
        if (s.timer <= 0) {
          // flock behaviour: sheep near walkers are more likely to follow
          let walkers = 0, n = 0;
          for (const j of f.members) {
            if (j === i) continue;
            const o = S[j];
            if (Math.hypot(o.x - s.x, o.z - s.z) < 14) { n++; if (o.mode === 'walk') walkers++; }
          }
          const pWalk = 0.2 + 0.6 * (n ? walkers / n : 0);
          if (s.mode === 'graze' && Math.random() < pWalk) { s.mode = 'walk'; s.timer = 3 + Math.random() * 6; }
          else { s.mode = 'graze'; s.timer = 4 + Math.random() * 9; }
        }
        // boid steering
        let sx = 0, sz = 0, ax = 0, az = 0, cx = 0, cz = 0, n = 0;
        for (const j of f.members) {
          if (j === i) continue;
          const o = S[j];
          const dx = o.x - s.x, dz = o.z - s.z;
          const d2 = dx * dx + dz * dz;
          if (d2 > 18 * 18) continue;
          n++;
          cx += o.x; cz += o.z;
          ax += Math.sin(o.h); az += Math.cos(o.h);
          if (d2 < 1.7 * 1.7) { const d = Math.sqrt(d2) + 1e-3; sx -= dx / d * (1.7 - d); sz -= dz / d * (1.7 - d); }
        }
        let vx = Math.sin(s.h), vz = Math.cos(s.h);
        if (n) {
          cx = cx / n - s.x; cz = cz / n - s.z;
          const cd = Math.hypot(cx, cz) + 1e-3;
          const coh = Math.min(1, Math.max(0, (cd - 5) / 10));
          vx += (cx / cd) * coh * 0.9 + (ax / n) * 0.35 + sx * 1.6;
          vz += (cz / cd) * coh * 0.9 + (az / n) * 0.35 + sz * 1.6;
        }
        // tether to the home range and avoid hazards (slopes, track, river, woods)
        const hxh = f.cx - s.x, hzh = f.cz - s.z;
        const hd = Math.hypot(hxh, hzh);
        if (hd > f.radius * 0.7) { const k = Math.min(2, (hd - f.radius * 0.7) / 12); vx += (hxh / hd) * k; vz += (hzh / hd) * k; }
        vx += s.hx * 5; vz += s.hz * 5;
        // lazy wander
        const wn = noise.n2(time * 0.12 + s.seed * 50, s.seed * 9);
        vx += Math.cos(wn * 6) * 0.4; vz += Math.sin(wn * 6) * 0.4;
        const want = Math.atan2(vx, vz);
        let dh = want - s.h;
        dh = Math.atan2(Math.sin(dh), Math.cos(dh));
        const walkSpeed = 0.5 + 0.3 * s.seed;
        const targetSpeed = s.mode === 'walk' ? walkSpeed : 0;
        s.speed += (targetSpeed - s.speed) * Math.min(1, dt * 1.6);
        if (s.speed > 0.05) s.h += dh * Math.min(1, dt * 1.6);
        const tg = s.mode === 'graze' ? 1 : 0;
        s.graze += (tg - s.graze) * Math.min(1, dt * 1.4);
      }
      if (s.speed > 0.02) {
        s.x += Math.sin(s.h) * s.speed * dt;
        s.z += Math.cos(s.h) * s.speed * dt;
        s.phase += dt * (3.2 + s.speed * 6) * (s.scale < 0.8 ? 1.4 : 1);
      }
      // occasional bleat, only worth the audio work when the camera is within earshot
      s.nextBleat -= dt;
      if (s.nextBleat <= 0) {
        s.nextBleat = 12 + Math.random() * 40;
        const dc = Math.hypot(s.x - cam.x, s.z - cam.z);
        if (dc < 160) this.bleat = Math.max(this.bleat, 1 - dc / 160);
      }
      // near sheep get the detailed model, far ones a cheap one; very distant ones are skipped
      const ddx = s.x - cam.x, ddz = s.z - cam.z;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < 75 * 75) this.write(s, nHi++, arrHi, time, this.mesh);
      else if (d2 < 650 * 650) this.write(s, nLo++, arrLo, time, this.meshLo);
    }
    this.mesh.count = nHi;
    this.meshLo.count = nLo;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.meshLo.instanceMatrix.needsUpdate = true;
    this.state.needsUpdate = true;
    this.stateLo.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.meshLo.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
