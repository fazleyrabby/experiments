import * as THREE from 'three';
import { Landscape } from './landscape';
import { VIADUCT, ARCH_PITCH } from './layout';
import { Rng, noise, smoothstep, clamp } from '../core/noise';
import { patch, GLSL_NOISE } from '../core/shaders';

const V = VIADUCT;
const R = V.radius;
const HALF_W = V.width / 2;
const HP = V.pier / 2; // pier half-thickness at the springing
const BATTER = 0.03;
const ARCH_R = V.span / 2;
const RING_W = 0.9;
const FACE_DEPTH = 0.9;

export const archCentre = (k: number) => (k - (V.arches - 1) / 2) * ARCH_PITCH;
export const pierCentre = (j: number) => (j - V.arches / 2) * ARCH_PITCH;
const pierHalf = (y: number) => HP + BATTER * Math.max(0, V.springY - y);
const faceOffset = (y: number) => HALF_W + BATTER * Math.max(0, V.springY - y);

interface StoneRec {
  m: THREE.Matrix4;
  c: THREE.Color;
}

export class Viaduct {
  readonly group = new THREE.Group();
  private stones: StoneRec[] = [];
  private rng = new Rng(9001);
  private minGround = -2;
  /** ground height under the viaduct centre-line for u (0.5 m resolution) */
  private ground: Float32Array;
  private groundOuter: Float32Array;
  private groundInner: Float32Array;
  private readonly u0 = -V.halfLen;

  constructor(private land: Landscape) {
    this.group.name = 'viaduct';
    const n = Math.ceil((2 * V.halfLen) / 0.5) + 1;
    this.ground = new Float32Array(n);
    this.groundOuter = new Float32Array(n);
    this.groundInner = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = this.u0 + i * 0.5;
      this.ground[i] = this.groundAt(u, 0);
      this.groundOuter[i] = this.groundAt(u, HALF_W + 2);
      this.groundInner[i] = this.groundAt(u, -HALF_W - 2);
    }
    this.buildCore();
    this.buildFaces();
    this.buildFlanks();
    this.buildArchRings();
    this.buildParapetAndCornice();
    this.finish();
  }

  // ------------------------------------------------------------------ helpers
  world(u: number, v: number, y: number, out = new THREE.Vector3()): THREE.Vector3 {
    const th = u / R;
    const rho = R + v;
    return out.set(V.cx + rho * Math.sin(th), y, V.cz + rho * Math.cos(th));
  }

  private groundAt(u: number, v: number): number {
    const p = this.world(u, v, 0);
    return this.land.height(p.x, p.z);
  }

  private gIndex(u: number): number {
    return clamp(Math.round((u - this.u0) / 0.5), 0, this.ground.length - 1);
  }

  private stoneColor(u: number, y: number, ground: number, c = new THREE.Color()): THREE.Color {
    const r = this.rng;
    // warm grey granite with subtle variation
    const t = r.range(0, 1);
    const base = 0.46 + 0.1 * (t - 0.5);
    c.setRGB(base * 1.04, base * 0.97, base * 0.88, THREE.SRGBColorSpace);
    if (r.chance(0.12)) c.multiplyScalar(0.8); // darker stones
    if (r.chance(0.07)) c.lerp(new THREE.Color().setRGB(0.55, 0.42, 0.32, THREE.SRGBColorSpace), 0.4); // ferrous staining
    // rising damp / moss near the ground and in damp patches
    const h = y - ground;
    const mossN = noise.fbm2(u * 0.35 + 3, y * 0.5, 3) * 0.5 + 0.5;
    const moss = clamp(smoothstep(11, 0, h) * (0.35 + 0.9 * mossN) + (mossN > 0.72 ? (mossN - 0.72) * 3 : 0), 0, 0.85);
    // dark weathering streaks under the string course
    const streak = smoothstep(0.55, 0.9, noise.n2(u * 1.7, y * 0.08) * 0.5 + 0.5) * 0.35;
    c.multiplyScalar(1 - streak);
    c.lerp(new THREE.Color().setRGB(0.20, 0.30, 0.11, THREE.SRGBColorSpace), moss * 0.7 * r.range(0.6, 1));
    return c;
  }

  private addStone(
    u: number, rho: number, y: number,
    sx: number, sy: number, sz: number,
    tiltX = 0, tiltZ = 0, ground = -999, shrink = 0.975,
  ) {
    const th = u / R;
    const T = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th));
    const N = new THREE.Vector3(Math.sin(th), 0, Math.cos(th));
    const b = new THREE.Matrix4().makeBasis(T, new THREE.Vector3(0, 1, 0), N);
    const q = new THREE.Quaternion().setFromRotationMatrix(b);
    const j = this.rng;
    const q1 = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(tiltX + j.range(-0.008, 0.008), j.range(-0.012, 0.012), tiltZ + j.range(-0.008, 0.008)),
    );
    q.multiply(q1);
    const pos = new THREE.Vector3(V.cx + rho * Math.sin(th), y, V.cz + rho * Math.cos(th));
    const m = new THREE.Matrix4().compose(pos, q, new THREE.Vector3(sx * shrink, sy * shrink, sz * shrink));
    this.stones.push({ m, c: this.stoneColor(u, y, ground === -999 ? this.ground[this.gIndex(u)] : ground) });
  }

  private addOriented(
    pos: THREE.Vector3, X: THREE.Vector3, Y: THREE.Vector3, Z: THREE.Vector3,
    sx: number, sy: number, sz: number, u: number, ground: number,
  ) {
    const b = new THREE.Matrix4().makeBasis(X, Y, Z);
    const q = new THREE.Quaternion().setFromRotationMatrix(b);
    const j = this.rng;
    q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(j.range(-0.01, 0.01), j.range(-0.01, 0.01), j.range(-0.01, 0.01))));
    const m = new THREE.Matrix4().compose(pos, q, new THREE.Vector3(sx * 0.975, sy * 0.975, sz * 0.975));
    this.stones.push({ m, c: this.stoneColor(u, pos.y, ground) });
  }

  /** shared course schedule: boundaries from the foundations up to the string course */
  private courseSchedule(): [number, number][] {
    const out: [number, number][] = [];
    const r = new Rng(31);
    const y0 = this.minGround - 1.2;
    const y1 = V.deckY - 0.62;
    let y = y0;
    while (y < y1 - 0.05) {
      const t = (y - y0) / (y1 - y0);
      let h = (0.64 - 0.26 * t) * r.range(0.92, 1.08);
      if (y + h > y1 - 0.2) h = y1 - y;
      out.push([y, y + h]);
      y += h;
    }
    return out;
  }

  // -------------------------------------------------------------------- core
  private buildCore() {
    // spandrel/deck mass: columns from soffit up to deck, between inner and outer faces
    const du = 0.25;
    const n = Math.round((2 * V.halfLen) / du);
    const ri = R - HALF_W + 0.12, ro = R + HALF_W - 0.12;
    const topY = V.deckY - 0.02;
    const pos: number[] = [];
    const idx: number[] = [];
    const yb = (u: number) => {
      let best = V.springY;
      for (let k = 0; k < V.arches; k++) {
        const dx = u - archCentre(k);
        const rr = ARCH_R + 0.14;
        if (Math.abs(dx) < rr) best = Math.max(best, V.springY + Math.sqrt(rr * rr - dx * dx));
      }
      return best;
    };
    // vertex layout per station: [inner top, outer top, inner bot, outer bot]
    for (let i = 0; i <= n; i++) {
      const u = -V.halfLen + i * du;
      const th = u / R;
      const s = Math.sin(th), c = Math.cos(th);
      const b = yb(u);
      for (const [rho, y] of [[ri, topY], [ro, topY], [ri, b], [ro, b]] as [number, number][]) {
        pos.push(V.cx + rho * s, y, V.cz + rho * c);
      }
    }
    const quad = (a: number, b2: number, c2: number, d: number) => idx.push(a, b2, c2, b2, d, c2);
    for (let i = 0; i < n; i++) {
      const a = i * 4, b = (i + 1) * 4;
      quad(a + 0, b + 0, a + 1, b + 1); // top
      quad(a + 2, a + 3, b + 2, b + 3); // soffit
      quad(a + 1, b + 1, a + 3, b + 3); // outer wall
      quad(a + 0, a + 2, b + 0, b + 2); // inner wall
    }
    // piers: wedge prisms, ground to springing
    const pierGeos: THREE.BufferGeometry[] = [];
    for (let j = 0; j <= V.arches; j++) {
      const uj = pierCentre(j);
      const g = this.pierPrism(uj);
      pierGeos.push(g);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = patch(new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.19, 0.18, 0.17, THREE.SRGBColorSpace), roughness: 1, side: THREE.DoubleSide }), {
      key: 'viaduct-core',
      fragColor: 'diffuseColor.rgb *= 0.7 + 0.6 * heFbm2(vWPos.xz * 0.9 + vWPos.y * 0.7);',
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    for (const g of pierGeos) {
      const m2 = new THREE.Mesh(g, mat);
      m2.castShadow = true;
      m2.receiveShadow = true;
      this.group.add(m2);
    }
  }

  /** Battered wedge pier mass (slightly inset from the stone faces). */
  private pierPrism(uj: number): THREE.BufferGeometry {
    const steps = 6;
    const pos: number[] = [];
    const idx: number[] = [];
    const yTop = V.springY + 0.3;
    const yBot = this.minGround - 1.5;
    // rings at each height: corners (u-,v-),(u+,v-),(u+,v+),(u-,v+)
    for (let i = 0; i <= steps; i++) {
      const y = yTop + ((yBot - yTop) * i) / steps;
      const hp = pierHalf(Math.min(y, V.springY)) - 0.1;
      const hv = faceOffset(Math.min(y, V.springY)) - 0.1;
      for (const [du2, dv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const u = uj + du2 * hp;
        const th = u / R;
        const rho = R + dv * hv;
        pos.push(V.cx + rho * Math.sin(th), y, V.cz + rho * Math.cos(th));
      }
    }
    for (let i = 0; i < steps; i++) {
      for (let k = 0; k < 4; k++) {
        const a = i * 4 + k, b = i * 4 + ((k + 1) % 4);
        const c = a + 4, d = b + 4;
        idx.push(a, c, b, b, c, d);
      }
    }
    // top cap
    idx.push(0, 1, 2, 0, 2, 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // ------------------------------------------------------------- face stones
  /** Solid intervals along u (at course mid-height) for the outer / inner spandrel + pier faces. */
  private faceIntervals(yb: number, yt: number): [number, number][] {
    const yc = (yb + yt) / 2;
    const out: [number, number][] = [];
    if (yb >= V.springY - 0.02) {
      // above the springing line: whole length minus ring zones
      let cuts: [number, number][] = [];
      for (let k = 0; k < V.arches; k++) {
        const uc = archCentre(k);
        const rr = ARCH_R + 0.75;
        const dy = yb - V.springY;
        if (dy < rr) {
          const w = Math.sqrt(rr * rr - dy * dy);
          cuts.push([uc - w, uc + w]);
        }
      }
      cuts.sort((a, b) => a[0] - b[0]);
      let cur = -V.halfLen;
      for (const [a, b] of cuts) {
        if (a > cur + 0.3) out.push([cur, a]);
        cur = Math.max(cur, b);
      }
      if (V.halfLen > cur + 0.3) out.push([cur, V.halfLen]);
    } else {
      for (let j = 0; j <= V.arches; j++) {
        const uj = pierCentre(j);
        const hp = pierHalf(yc);
        const a = Math.max(uj - hp, -V.halfLen), b = Math.min(uj + hp, V.halfLen);
        if (b - a > 0.3) out.push([a, b]);
      }
    }
    return out;
  }

  private buildFaces() {
    const courses = this.courseSchedule();
    const r = this.rng;
    for (const side of [1, -1]) {
      for (const [yb, yt] of courses) {
        const h = yt - yb;
        const yc = (yb + yt) / 2;
        const faceV = faceOffset(yc);
        const tilt = yc < V.springY ? Math.atan(BATTER) : 0;
        for (const [ia, ib] of this.faceIntervals(yb, yt)) {
          let u = ia;
          while (u < ib - 0.05) {
            let len = r.range(0.8, 1.75);
            if (ib - u - len < 0.55) len = ib - u;
            const uc = u + len / 2;
            const gi = this.gIndex(uc);
            const g = side > 0 ? this.groundOuter[gi] : this.groundInner[gi];
            u += len;
            if (yt < g - 0.55) continue;
            // face tilt: outward lean for y < springing
            const rho = R + side * (faceV - FACE_DEPTH / 2);
            this.addStone(uc, rho, yc, len, h, FACE_DEPTH, side > 0 ? tilt : -tilt, 0, g);
          }
        }
      }
    }
  }

  // ----------------------------------------------------------- pier flanks
  private buildFlanks() {
    const courses = this.courseSchedule();
    const r = this.rng;
    for (let j = 0; j <= V.arches; j++) {
      const uj = pierCentre(j);
      for (const s of [-1, 1]) {
        if (Math.abs(uj + s * HP) > V.halfLen + 0.01) continue;
        for (const [yb, yt] of courses) {
          if (yb > V.springY + 0.02) break;
          const h = yt - yb, yc = (yb + yt) / 2;
          const hp = pierHalf(yc);
          const vh = faceOffset(yc) - FACE_DEPTH + 0.02;
          const uFace = uj + s * hp;
          const uc = uFace - s * (FACE_DEPTH / 2 - 0.02);
          const tz = -s * Math.atan(BATTER);
          let v = -vh;
          while (v < vh - 0.05) {
            let len = r.range(0.8, 1.6);
            if (vh - v - len < 0.5) len = vh - v;
            const vc = v + len / 2;
            v += len;
            const g = this.groundAt(uFace, vc);
            if (yt < g - 0.55) continue;
            this.addStone(uc, R + vc, yc, FACE_DEPTH, h, len, 0, tz, g);
          }
        }
      }
    }
  }

  // ------------------------------------------------------------ arch rings
  private buildArchRings() {
    const r = this.rng;
    for (let k = 0; k < V.arches; k++) {
      const uc = archCentre(k);
      const th = uc / R;
      const T = new THREE.Vector3(Math.cos(th), 0, -Math.sin(th));
      const Nn = new THREE.Vector3(Math.sin(th), 0, Math.cos(th));
      const Y = new THREE.Vector3(0, 1, 0);
      const M = 27;
      const centre = this.world(uc, 0, V.springY);
      const pos = new THREE.Vector3();
      const X = new THREE.Vector3(), D = new THREE.Vector3();
      for (let m = 0; m < M; m++) {
        const phi = ((m + 0.5) * Math.PI) / M;
        const isKey = m === (M - 1) / 2;
        // tangent / radial directions in the arch plane
        const dT = -Math.cos(phi), dY = Math.sin(phi);
        const eT = Math.sin(phi), eY = Math.cos(phi);
        const arcLen = ((Math.PI * (ARCH_R + RING_W / 2)) / M) * 1.0;
        const depthR = isKey ? RING_W + 0.45 : RING_W + r.range(-0.05, 0.12);
        const rc = ARCH_R + depthR / 2;
        const dir = (a: number, b: number) => new THREE.Vector3().addScaledVector(T, a).addScaledVector(Y, b);
        X.copy(dir(eT, eY));
        D.copy(dir(dT, dY));
        // barrel (soffit) rows
        const rows = 6;
        const rowW = (2 * (HALF_W - 0.25)) / rows;
        for (let q = 0; q < rows; q++) {
          const v = -HALF_W + 0.25 + rowW * (q + 0.5);
          pos.copy(centre).addScaledVector(Nn, v).addScaledVector(T, dT * (ARCH_R + 0.45)).addScaledVector(Y, dY * (ARCH_R + 0.45));
          // face rows: slight stagger in depth for a hand-dressed look
          const stagger = (q + m) % 2 === 0 ? 0 : 0.12;
          this.addOriented(pos, X, D, Nn, arcLen * 1.0, 0.9 + stagger, rowW * 0.995, uc + dT * ARCH_R, 0);
        }
        // face rings (protruding)
        for (const side of [-1, 1]) {
          const v = side * (HALF_W + 0.12 - 0.95 / 2);
          const depth = isKey ? RING_W + 0.45 : depthR;
          const rcc = ARCH_R + depth / 2;
          pos.copy(centre).addScaledVector(Nn, v).addScaledVector(T, dT * rcc).addScaledVector(Y, dY * rcc);
          this.addOriented(pos, X, D, Nn, arcLen * (isKey ? 1.15 : 1.0), depth, 0.95, uc + dT * ARCH_R, 0);
        }
        void rc;
      }
    }
  }

  // -------------------------------------------------- cornice + parapets
  private buildParapetAndCornice() {
    const r = this.rng;
    const baluster = new THREE.Matrix4();
    this.balusters = [];
    this.posts = [];
    for (const side of [1, -1]) {
      const rhoF = R + side * HALF_W;
      // string course (projecting)
      let u = -V.halfLen;
      while (u < V.halfLen - 0.05) {
        let len = r.range(1.5, 2.3);
        if (V.halfLen - u - len < 0.8) len = V.halfLen - u;
        const uc = u + len / 2;
        u += len;
        this.addStone(uc, rhoF + side * (0.3 - FACE_DEPTH / 2), V.deckY - 0.38, len, 0.46, FACE_DEPTH, 0, 0, 0);
      }
      // parapet: plinth, balusters, coping; posts over piers and crowns
      const wallRho = rhoF - side * 0.28;
      u = -V.halfLen;
      while (u < V.halfLen - 0.05) {
        let len = r.range(1.4, 2.2);
        if (V.halfLen - u - len < 0.8) len = V.halfLen - u;
        const uc = u + len / 2;
        // plinth
        this.addStone(uc, wallRho, V.deckY + 0.16, len, 0.34, 0.58, 0, 0, 0, 0.98);
        // coping
        this.addStone(uc, wallRho, V.deckY + V.parapetH - 0.09, len, 0.18, 0.66, 0, 0, 0, 0.99);
        // balusters between
        const nb = Math.max(1, Math.round(len / 0.42));
        for (let b = 0; b < nb; b++) {
          const ub = u + ((b + 0.5) * len) / nb;
          const th = ub / R;
          baluster.makeTranslation(V.cx + wallRho * Math.sin(th), V.deckY + 0.33, V.cz + wallRho * Math.cos(th));
          this.balusters.push(baluster.clone());
        }
        u += len;
      }
      // pilasters
      const posts: number[] = [];
      for (let j = 0; j <= V.arches; j++) posts.push(pierCentre(j));
      for (let k = 0; k < V.arches; k++) posts.push(archCentre(k));
      posts.push(-V.halfLen + 0.4, V.halfLen - 0.4);
      for (const pu of posts) {
        if (Math.abs(pu) > V.halfLen - 0.2 && Math.abs(pu) > V.halfLen) continue;
        this.addStone(pu, wallRho, V.deckY + 0.72, 0.62, 1.36, 0.62, 0, 0, 0, 0.99);
        this.addStone(pu, wallRho, V.deckY + 1.44, 0.74, 0.12, 0.74, 0, 0, 0, 0.99);
        const th = pu / R;
        const m = new THREE.Matrix4().compose(
          new THREE.Vector3(V.cx + wallRho * Math.sin(th), V.deckY + 1.5 + 0.18, V.cz + wallRho * Math.cos(th)),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4 + th),
          new THREE.Vector3(0.5, 0.38, 0.5),
        );
        this.posts.push(m);
      }
    }
  }
  private balusters: THREE.Matrix4[] = [];
  private posts: THREE.Matrix4[] = [];

  // ------------------------------------------------------------- finishing
  private finish() {
    // stones
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = patch(
      new THREE.MeshStandardMaterial({ roughness: 0.93, metalness: 0 }),
      {
        key: 'stone',
        vertDecl: 'varying vec3 vSize;',
        vertMain: /* glsl */ `
          vSize = vec3(1.0);
          #ifdef USE_INSTANCING
            vSize = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
          #endif`,
        fragDecl: 'varying vec3 vSize;',
        fragColor: /* glsl */ `
          vec3 aq = abs(vOPos);
          float mq = max(aq.x, max(aq.y, aq.z));
          vec3 de = (0.5 - aq) * vSize + 10.0 * step(mq - 0.0007, aq);
          float ed = min(de.x, min(de.y, de.z));
          float rim = 1.0 - smoothstep(0.0, 0.045, ed);
          vec3 sp = vWPos * 7.0 + vRand * 31.0;
          float chisel = heFbm(sp);
          float grain = heVNoise(vWPos * 38.0);
          float streakN = heVNoise2(vec2((vWPos.x + vWPos.z) * 1.9, vWPos.y * 0.22 + vRand));
          diffuseColor.rgb *= 0.78 + 0.5 * chisel;
          diffuseColor.rgb *= 0.9 + 0.2 * grain;
          diffuseColor.rgb *= 1.0 - 0.28 * smoothstep(0.5, 0.85, streakN);
          diffuseColor.rgb *= 1.0 - 0.45 * rim;
          // lichen speckle
          float lich = smoothstep(0.74, 0.82, heVNoise(vWPos * 3.1 + 7.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.40, 0.18) * (0.6 + 0.4 * chisel), lich * 0.45);
        `,
        fragNormal: /* glsl */ `
          vec3 aq2 = abs(vOPos);
          float mq2 = max(aq2.x, max(aq2.y, aq2.z));
          vec3 de2 = (0.5 - aq2) * vSize + 10.0 * step(mq2 - 0.0007, aq2);
          float ed2 = min(de2.x, min(de2.y, de2.z));
          float bump = smoothstep(0.0, 0.05, ed2) * 0.55 + heFbm(vWPos * 9.0 + vRand * 11.0) * 0.5 + heVNoise(vWPos * 34.0) * 0.18;
          float bfd = 1.0 - smoothstep(18.0, 90.0, length(vViewPosition));
          normal = hePerturb(-vViewPosition, normal, vec2(dFdx(bump), dFdy(bump)) * (0.9 * bfd), faceDirection);
        `,
        fragRough: 'roughnessFactor = clamp(roughnessFactor + (heVNoise(vWPos * 5.0) - 0.5) * 0.18, 0.5, 1.0);',
      },
    );
    void GLSL_NOISE;
    const mesh = new THREE.InstancedMesh(geo, mat, this.stones.length);
    this.stones.forEach((s, i) => {
      mesh.setMatrixAt(i, s.m);
      mesh.setColorAt(i, s.c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.name = 'viaduct-stones';
    this.group.add(mesh);
    this.stoneCount = this.stones.length;
    this.stones = [];

    // balusters (lathe profile)
    const prof = [
      [0.0, 0.0], [0.085, 0.0], [0.085, 0.05], [0.06, 0.08], [0.05, 0.12], [0.07, 0.2], [0.075, 0.28],
      [0.055, 0.36], [0.05, 0.44], [0.07, 0.5], [0.085, 0.53], [0.085, 0.6], [0.0, 0.6],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const bGeo = new THREE.LatheGeometry(prof, 8);
    const bMat = patch(new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.50, 0.46, 0.40, THREE.SRGBColorSpace), roughness: 0.9 }), {
      key: 'baluster',
      fragColor: 'diffuseColor.rgb *= 0.8 + 0.4 * heFbm(vWPos * 14.0);',
    });
    const bal = new THREE.InstancedMesh(bGeo, bMat, this.balusters.length);
    this.balusters.forEach((m, i) => bal.setMatrixAt(i, m));
    bal.castShadow = true;
    bal.receiveShadow = true;
    bal.frustumCulled = false;
    this.group.add(bal);
    const capGeo = new THREE.ConeGeometry(1, 1, 4);
    const caps = new THREE.InstancedMesh(capGeo, bMat, this.posts.length);
    this.posts.forEach((m, i) => caps.setMatrixAt(i, m));
    caps.castShadow = true;
    caps.frustumCulled = false;
    this.group.add(caps);
  }
  stoneCount = 0;

  // -------------------------------------------------------- collision aid
  /**
   * Push a point out of the viaduct mass. Returns true if it moved.
   */
  pushOut(p: THREE.Vector3, margin = 1.5): boolean {
    const dx = p.x - V.cx, dz = p.z - V.cz;
    const rho = Math.hypot(dx, dz);
    const th = Math.atan2(dx, dz);
    const u = th * R;
    const v = rho - R;
    if (Math.abs(u) > V.halfLen + margin) return false;
    const vLim = HALF_W + margin;
    if (Math.abs(v) > vLim + 3) return false;
    const yTop = V.deckY + V.parapetH + margin;
    // soffit height at u
    let yb = V.springY - margin;
    for (let k = 0; k < V.arches; k++) {
      const d = u - archCentre(k);
      const rr = ARCH_R - margin;
      if (Math.abs(d) < rr) yb = Math.max(yb, V.springY + Math.sqrt(rr * rr - d * d));
    }
    // pier region below the springing
    let inPier = false;
    let pierU = 0;
    for (let j = 0; j <= V.arches; j++) {
      const uj = pierCentre(j);
      if (Math.abs(u - uj) < pierHalf(Math.min(p.y, V.springY)) + margin) { inPier = true; pierU = uj; }
    }
    const inV = Math.abs(v) < faceOffset(Math.min(p.y, V.springY)) + margin;
    if (!inV) return false;
    let moved = false;
    const tmp = new THREE.Vector3();
    if (p.y > V.springY - margin * 0.2 && p.y < yTop && p.y > yb) {
      // inside deck / spandrel mass: choose nearest way out
      const toTop = yTop - p.y;
      const toSide = vLim - Math.abs(v);
      if (toTop < toSide + 0.2 || p.y > V.deckY - 1) p.y = yTop + 0.05;
      else {
        const sv = Math.sign(v) || 1;
        tmp.copy(p);
        const nv = sv * (vLim + 0.05);
        const th2 = u / R;
        p.x = V.cx + (R + nv) * Math.sin(th2);
        p.z = V.cz + (R + nv) * Math.cos(th2);
      }
      moved = true;
    } else if (p.y <= V.springY && inPier) {
      const du = u - pierU;
      const nu = pierU + (du >= 0 ? 1 : -1) * (pierHalf(p.y) + margin + 0.05);
      const th2 = nu / R;
      p.x = V.cx + rho * Math.sin(th2);
      p.z = V.cz + rho * Math.cos(th2);
      moved = true;
    }
    return moved;
  }
}
