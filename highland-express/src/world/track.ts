import * as THREE from 'three';
import { VIADUCT, loopControls, rimY } from './layout';
import { smoothstep } from '../core/noise';

export interface TrackFrame {
  p: THREE.Vector3; // rail-head level centre point
  t: THREE.Vector3; // tangent
  u: THREE.Vector3; // up (canted)
  r: THREE.Vector3; // right
}

export function makeFrame(): TrackFrame {
  return { p: new THREE.Vector3(), t: new THREE.Vector3(), u: new THREE.Vector3(), r: new THREE.Vector3() };
}

export const GAUGE = 1.435;
export const RAIL_HALF = GAUGE / 2 + 0.034; // rail head centre offset

/**
 * Closed, arc-length parameterised track. Samples are 0.5 m apart; positions are at
 * rail-head level on the centre line.
 */
export class Track {
  readonly length: number;
  readonly n: number;
  readonly ds: number;
  readonly viaductS0: number;
  readonly viaductS1: number;
  private P: Float32Array;
  private T: Float32Array;
  private U: Float32Array;
  readonly curvature: Float32Array;

  constructor() {
    const ctrl = loopControls().map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
    curve.arcLengthDivisions = 12000;
    const L = curve.getLength();
    const n = Math.round(L / 0.5);
    this.n = n;
    this.length = L;
    this.ds = L / n;

    const xs = new Float64Array(n), zs = new Float64Array(n);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      curve.getPointAt(i / n, tmp);
      xs[i] = tmp.x;
      zs[i] = tmp.z;
    }

    // locate the viaduct (arc start) -> index of sample nearest to arc start
    const A = VIADUCT.halfLen / VIADUCT.radius;
    const sx = VIADUCT.cx + VIADUCT.radius * Math.sin(-A);
    const sz = VIADUCT.cz + VIADUCT.radius * Math.cos(-A);
    let i0 = 0, best = 1e9;
    for (let i = 0; i < n; i++) {
      const d = (xs[i] - sx) ** 2 + (zs[i] - sz) ** 2;
      if (d < best) { best = d; i0 = i; }
    }
    // rotate arrays so s = 0 at the viaduct entrance
    const rx = new Float64Array(n), rz = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      rx[i] = xs[(i + i0) % n];
      rz[i] = zs[(i + i0) % n];
    }
    this.viaductS0 = 0;
    this.viaductS1 = (2 * VIADUCT.halfLen);

    // -- elevation --------------------------------------------------------
    const raw = new Float64Array(n);
    for (let i = 0; i < n; i++) raw[i] = rimY(rx[i], rz[i]) + 0.2;
    // gaussian low-pass (periodic)
    const sig = 55 / this.ds;
    const half = Math.ceil(sig * 3);
    const ker: number[] = [];
    let ksum = 0;
    for (let k = -half; k <= half; k++) {
      const w = Math.exp(-0.5 * (k / sig) ** 2);
      ker.push(w);
      ksum += w;
    }
    const sm = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = -half; k <= half; k++) s += raw[(i + k + n * 4) % n] * ker[k + half];
      sm[i] = s / ksum;
    }
    // pin the viaduct height with smooth blend
    const y = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const s = i * this.ds;
      let wv = 1;
      if (s > this.viaductS1) {
        const dd = Math.min(s - this.viaductS1, L - s + this.viaductS0);
        wv = 1 - smoothstep(0, 150, dd);
      }
      y[i] = sm[i] * (1 - wv) + VIADUCT.railY * wv;
    }
    // gradient limiting (max grade ~2.3 %)
    const maxStep = 0.023 * this.ds;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < n; i++) {
        const a = (i + n - 1) % n;
        const d = y[i] - y[a];
        if (Math.abs(d) > maxStep) y[i] = y[a] + Math.sign(d) * maxStep;
      }
      for (let i = n - 1; i >= 0; i--) {
        const a = (i + 1) % n;
        const d = y[i] - y[a];
        if (Math.abs(d) > maxStep) y[i] = y[a] + Math.sign(d) * maxStep;
      }
    }
    // restore exact viaduct level after clamping
    for (let i = 0; i < n; i++) {
      const s = i * this.ds;
      if (s >= this.viaductS0 && s <= this.viaductS1) y[i] = VIADUCT.railY;
    }
    // light smoothing to remove kinks
    const y2 = new Float64Array(n);
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < n; i++) {
        const s = i * this.ds;
        const inV = s >= this.viaductS0 && s <= this.viaductS1;
        y2[i] = inV ? VIADUCT.railY : (y[(i + n - 2) % n] + 2 * y[(i + n - 1) % n] + 2 * y[i] + 2 * y[(i + 1) % n] + y[(i + 2) % n]) / 8;
      }
      y.set(y2);
    }

    // -- frames -----------------------------------------------------------
    this.P = new Float32Array(n * 3);
    this.T = new Float32Array(n * 3);
    this.U = new Float32Array(n * 3);
    this.curvature = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.P[i * 3] = rx[i];
      this.P[i * 3 + 1] = y[i];
      this.P[i * 3 + 2] = rz[i];
    }
    const t = new THREE.Vector3();
    const t0 = new THREE.Vector3();
    const t1 = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = (i + n - 1) % n, b = (i + 1) % n;
      t.set(rx[b] - rx[a], y[b] - y[a], rz[b] - rz[a]).normalize();
      this.T[i * 3] = t.x; this.T[i * 3 + 1] = t.y; this.T[i * 3 + 2] = t.z;
    }
    // signed horizontal curvature (positive = left turn seen from above)
    const kraw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = (i + n - 4) % n, b = (i + 4) % n;
      t0.set(this.T[a * 3], 0, this.T[a * 3 + 2]).normalize();
      t1.set(this.T[b * 3], 0, this.T[b * 3 + 2]).normalize();
      kraw[i] = (t0.x * t1.z - t0.z * t1.x) * -1 / (8 * this.ds);
    }
    // smooth curvature
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = -40; k <= 40; k++) { s += kraw[(i + k + n) % n]; c++; }
      this.curvature[i] = s / c;
    }
    const up = new THREE.Vector3(0, 1, 0);
    const r0 = new THREE.Vector3();
    const u = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      t.set(this.T[i * 3], this.T[i * 3 + 1], this.T[i * 3 + 2]);
      r0.crossVectors(t, up).normalize();
      const cant = THREE.MathUtils.clamp(this.curvature[i] * 7.5, -0.05, 0.05);
      u.copy(up).multiplyScalar(Math.cos(cant)).addScaledVector(r0, -Math.sin(cant));
      u.addScaledVector(t, -t.dot(u)).normalize();
      this.U[i * 3] = u.x; this.U[i * 3 + 1] = u.y; this.U[i * 3 + 2] = u.z;
    }
  }

  wrap(s: number): number {
    s %= this.length;
    return s < 0 ? s + this.length : s;
  }

  frame(s: number, out: TrackFrame): TrackFrame {
    s = this.wrap(s);
    const f = s / this.ds;
    const i = Math.floor(f);
    const a = i % this.n, b = (i + 1) % this.n;
    const k = f - i;
    const P = this.P, T = this.T, U = this.U;
    out.p.set(
      P[a * 3] + (P[b * 3] - P[a * 3]) * k,
      P[a * 3 + 1] + (P[b * 3 + 1] - P[a * 3 + 1]) * k,
      P[a * 3 + 2] + (P[b * 3 + 2] - P[a * 3 + 2]) * k,
    );
    out.t.set(
      T[a * 3] + (T[b * 3] - T[a * 3]) * k,
      T[a * 3 + 1] + (T[b * 3 + 1] - T[a * 3 + 1]) * k,
      T[a * 3 + 2] + (T[b * 3 + 2] - T[a * 3 + 2]) * k,
    ).normalize();
    out.u.set(
      U[a * 3] + (U[b * 3] - U[a * 3]) * k,
      U[a * 3 + 1] + (U[b * 3 + 1] - U[a * 3 + 1]) * k,
      U[a * 3 + 2] + (U[b * 3 + 2] - U[a * 3 + 2]) * k,
    );
    out.u.addScaledVector(out.t, -out.t.dot(out.u)).normalize();
    out.r.crossVectors(out.t, out.u).normalize();
    return out;
  }

  /** s of track sample nearest to world XZ (coarse, for placement helpers). */
  nearestS(x: number, z: number): number {
    let best = 1e12, bi = 0;
    for (let i = 0; i < this.n; i += 2) {
      const dx = this.P[i * 3] - x, dz = this.P[i * 3 + 2] - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bi = i; }
    }
    return bi * this.ds;
  }

  /** Raw access for field rasterisation. */
  sampleXYZ(i: number, out: THREE.Vector3): THREE.Vector3 {
    i = ((i % this.n) + this.n) % this.n;
    return out.set(this.P[i * 3], this.P[i * 3 + 1], this.P[i * 3 + 2]);
  }

  inViaduct(s: number): boolean {
    s = this.wrap(s);
    return s >= this.viaductS0 && s <= this.viaductS1;
  }
}
