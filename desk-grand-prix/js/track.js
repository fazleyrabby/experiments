// The orange toy track: a closed Catmull-Rom centreline across the desk, sampled
// every 2.5 mm into frames (tangent T, right B, up N). Hairpins bank themselves
// from their curvature; the back straight climbs a ramp onto a stack of books and
// ends in a kicker with a real gap before the landing ramp. Units: centimetres,
// desk top at y = 0, cars run toward +x on the front straight.
import * as THREE from 'three';

export const HALF_W = 7.2;        // inner floor half-width
export const WALL_T = 0.4;
export const WALL_H = 1.3;
export const FLOOR_T = 0.25;
export const PIECE = 30.48;       // one moulded piece (one foot)
export const BOOK_TOP = 6.3;
export const BOOKS = { x0: -56, x1: -28, z0: -35.5, z1: -12.5 };
export const GAP = { x0: -59.4, x1: -56.15 };

// [x, z, floor-bottom height]; about 6 m of track on a 3 m desk
const CTRL = [
  [-104, 36, 0], [-75, 36, 0], [-45, 36, 0], [-20, 35.5, 0], [-3, 26.5, 0], [17, 25.8, 0], [35, 35, 0],
  [60, 36, 0], [82, 31.5, 0], [100, 34.5, 0], [117, 34, 0], [132, 26, 0], [140, 4, 0], [132, -17, 0], [117, -24, 0],
  [100, -24, 0], [75, -24, 0], [40, -24, 2.1], [5, -24, 4.4], [-29, -24, BOOK_TOP], [-42, -24, BOOK_TOP],
  [-51, -24, BOOK_TOP + 0.05], [-56, -24, BOOK_TOP + 0.55],
  [-59.6, -24, 4.9], [-75, -24, 1.6], [-92, -24, 0], [-115, -20, 0], [-131, -4, 0], [-133, 16, 0], [-122, 31.5, 0],
];

export class Track {
  constructor() {
    const curve = new THREE.CatmullRomCurve3(CTRL.map(([x, z, h]) => new THREE.Vector3(x, h, z)), true, 'centripetal');
    const L = curve.getLength();
    const N = this.N = Math.round(L / 0.25);
    const pts = curve.getSpacedPoints(N); pts.pop();
    this.length = L; this.ds = L / N;
    const P = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { P[3 * i] = pts[i].x; P[3 * i + 1] = pts[i].y + FLOOR_T; P[3 * i + 2] = pts[i].z; }
    const wrap = (i) => ((i % N) + N) % N;
    // horizontal heading and curvature
    const head = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1), b = wrap(i + 1);
      head[i] = Math.atan2(P[3 * b + 2] - P[3 * a + 2], P[3 * b] - P[3 * a]);
    }
    const kh = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let d = head[wrap(i + 1)] - head[wrap(i - 1)];
      d = Math.atan2(Math.sin(d), Math.cos(d));
      kh[i] = d / (2 * this.ds);
    }
    const smooth = (arr, rad) => {
      const out = new Float32Array(N); let acc = 0;
      for (let j = -rad; j <= rad; j++) acc += arr[wrap(j)];
      for (let i = 0; i < N; i++) { out[i] = acc / (2 * rad + 1); acc += arr[wrap(i + rad + 1)] - arr[wrap(i - rad)]; }
      return out;
    };
    const ks = smooth(smooth(kh, 24), 24);
    this.kSmooth = ks;
    // bank only on desk-level running, and lift the centreline so the low edge still sits on the desk
    const bankRaw = new Float32Array(N);
    for (let i = 0; i < N; i++) bankRaw[i] = (P[3 * i + 1] - FLOOR_T) < 0.3 ? -Math.max(-0.2, Math.min(0.2, ks[i] * 3.6)) : 0;
    const bank = this.bank = smooth(smooth(bankRaw, 30), 30);
    for (let i = 0; i < N; i++) P[3 * i + 1] += (HALF_W + WALL_T) * Math.abs(Math.sin(bank[i]));
    this.P = P;
    // frames
    const T = this.T = new Float32Array(N * 3), B = this.B = new Float32Array(N * 3), Nn = this.Nn = new Float32Array(N * 3);
    const t = new THREE.Vector3(), b0 = new THREE.Vector3(), n0 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1), c = wrap(i + 1);
      t.set(P[3 * c] - P[3 * a], P[3 * c + 1] - P[3 * a + 1], P[3 * c + 2] - P[3 * a + 2]).normalize();
      b0.crossVectors(t, up).normalize(); n0.crossVectors(b0, t).normalize();
      const cb = Math.cos(bank[i]), sb = Math.sin(bank[i]);
      T.set([t.x, t.y, t.z], 3 * i);
      B.set([b0.x * cb + n0.x * sb, b0.y * cb + n0.y * sb, b0.z * cb + n0.z * sb], 3 * i);
      Nn.set([n0.x * cb - b0.x * sb, n0.y * cb - b0.y * sb, n0.z * cb - b0.z * sb], 3 * i);
    }
    // geodesic (in-plane) and normal curvature
    this.kGeo = new Float32Array(N); this.kNorm = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1), c = wrap(i + 1), inv = 1 / (2 * this.ds);
      const dx = (T[3 * c] - T[3 * a]) * inv, dy = (T[3 * c + 1] - T[3 * a + 1]) * inv, dz = (T[3 * c + 2] - T[3 * a + 2]) * inv;
      this.kGeo[i] = dx * B[3 * i] + dy * B[3 * i + 1] + dz * B[3 * i + 2];
      this.kNorm[i] = dx * Nn[3 * i] + dy * Nn[3 * i + 1] + dz * Nn[3 * i + 2];
    }
    this.kGeoS = smooth(this.kGeo, 6);
    this.kNormS = smooth(this.kNorm, 3);
    // the jump gap
    this.gap = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const x = P[3 * i], z = P[3 * i + 2];
      if (z < 0 && x > GAP.x0 && x < GAP.x1) this.gap[i] = 1;
    }
    // start line on the front straight
    this.sStart = this.nearestIndex(-60, 36) * this.ds;
    this.buildRacingLine();
    this._s = { p: new THREE.Vector3(), T: new THREE.Vector3(), B: new THREE.Vector3(), N: new THREE.Vector3(), kGeo: 0, kNorm: 0, gap: 0, i: 0 };
  }

  wrapS(s) { const L = this.length; return ((s % L) + L) % L; }

  nearestIndex(x, z, y = null) {
    let best = 1e9, bi = 0;
    for (let i = 0; i < this.N; i++) {
      let d = (this.P[3 * i] - x) ** 2 + (this.P[3 * i + 2] - z) ** 2;
      if (y !== null) d += (this.P[3 * i + 1] - y) ** 2;
      if (d < best) { best = d; bi = i; }
    }
    return bi;
  }

  // interpolated frame at arc length s (returns a shared scratch object)
  sample(s, out = this._s) {
    s = this.wrapS(s);
    const f = s / this.ds, i = Math.floor(f) % this.N, j = (i + 1) % this.N, u = f - Math.floor(f);
    const lerp3 = (arr, v) => v.set(
      arr[3 * i] + (arr[3 * j] - arr[3 * i]) * u,
      arr[3 * i + 1] + (arr[3 * j + 1] - arr[3 * i + 1]) * u,
      arr[3 * i + 2] + (arr[3 * j + 2] - arr[3 * i + 2]) * u);
    lerp3(this.P, out.p); lerp3(this.T, out.T).normalize(); lerp3(this.B, out.B).normalize(); lerp3(this.Nn, out.N).normalize();
    out.kGeo = this.kGeoS[i] + (this.kGeoS[j] - this.kGeoS[i]) * u;
    out.kNorm = this.kNormS[i] + (this.kNormS[j] - this.kNormS[i]) * u;
    out.gap = this.gap[i] || this.gap[j];
    out.i = i;
    return out;
  }

  // world point -> track coordinates near a hint index
  project(p, hint = -1, out = {}) {
    const N = this.N, P = this.P;
    let best = 1e18, bi = 0;
    const scan = (i) => { const d = (P[3 * i] - p.x) ** 2 + (P[3 * i + 1] - p.y) ** 2 * 0.25 + (P[3 * i + 2] - p.z) ** 2; if (d < best) { best = d; bi = i; } };
    if (hint < 0) for (let i = 0; i < N; i++) scan(i);
    else for (let k = -80; k <= 80; k++) scan(((hint + k) % N + N) % N);
    const T = this.T;
    const along = (p.x - P[3 * bi]) * T[3 * bi] + (p.y - P[3 * bi + 1]) * T[3 * bi + 1] + (p.z - P[3 * bi + 2]) * T[3 * bi + 2];
    const s = this.wrapS(bi * this.ds + Math.max(-this.ds, Math.min(this.ds, along)));
    const f = this.sample(s);
    const dx = p.x - f.p.x, dy = p.y - f.p.y, dz = p.z - f.p.z;
    out.s = s; out.i = f.i; out.gap = f.gap;
    out.d = dx * f.B.x + dy * f.B.y + dz * f.B.z;
    out.h = dx * f.N.x + dy * f.N.y + dz * f.N.z;
    out.dist2 = best;
    return out;
  }

  // AI reference: a racing line that swings inside on corners, and the fastest
  // speed each sample allows (forward/backward passes with grip-limited accel)
  buildRacingLine() {
    const N = this.N, ks = this.kSmooth;
    const raw = new Float32Array(N);
    for (let i = 0; i < N; i++) raw[i] = Math.max(-1, Math.min(1, ks[i] * 60));
    const line = new Float32Array(N), R = 90;
    let acc = 0;
    for (let j = -R; j <= R; j++) acc += raw[((j % N) + N) % N];
    for (let i = 0; i < N; i++) { line[i] = acc / (2 * R + 1); acc += raw[(i + R + 1) % N] - raw[((i - R) % N + N) % N]; }
    this.line = line.map((v) => v * (HALF_W - 2.6) * 1.6).map((v) => Math.max(-(HALF_W - 2.7), Math.min(HALF_W - 2.7, v)));
    const g = 981, mu = 0.4, vtop = 72, ds = this.ds;
    const v = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const k = Math.max(Math.abs(this.kGeoS[i]), 1e-4);
      v[i] = Math.min(vtop, Math.sqrt(mu * g * Math.max(0.3, this.Nn[3 * i + 1]) / k));
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = N * 2; i > 0; i--) { const a = i % N, b = (i + 1) % N; v[a] = Math.min(v[a], Math.sqrt(v[b] * v[b] + 2 * 300 * ds)); }
      for (let i = 0; i < N * 2; i++) { const a = i % N, b = (i + 1) % N; v[b] = Math.min(v[b], Math.sqrt(v[a] * v[a] + 2 * 140 * ds)); }
    }
    this.vRef = v;
  }

  // --------------------------------------------------------------- meshes
  build(textures) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xff4d00, roughness: 0.55, metalness: 0, specularIntensity: 0.45,
      map: textures.map, normalMap: textures.normalMap, normalScale: new THREE.Vector2(0.35, 0.35),
    });
    const prof = [
      [-HALF_W - WALL_T, -FLOOR_T], [-HALF_W - WALL_T, WALL_H - 0.1], [-HALF_W - WALL_T + 0.08, WALL_H], [-HALF_W - 0.08, WALL_H], [-HALF_W, WALL_H - 0.1],
      [-HALF_W, 0.12], [-HALF_W + 0.12, 0], [HALF_W - 0.12, 0], [HALF_W, 0.12],
      [HALF_W, WALL_H - 0.1], [HALF_W + 0.08, WALL_H], [HALF_W + WALL_T - 0.08, WALL_H], [HALF_W + WALL_T, WALL_H - 0.1], [HALF_W + WALL_T, -FLOOR_T],
    ];
    const segs = [];
    let plen = 0;
    for (let k = 0; k < prof.length; k++) {
      const a = prof[k], b = prof[(k + 1) % prof.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      segs.push({ a, b, n: [-dy / l, dx / l], v0: plen, v1: plen + l });
      plen += l;
    }
    const pos = [], nrm = [], uv = [], idx = [];
    const N = this.N;
    const f = new THREE.Vector3(), Bv = new THREE.Vector3(), Nv = new THREE.Vector3();
    const ringStart = [];
    for (let r = 0; r <= N; r++) {
      const i = r % N;
      ringStart.push(pos.length / 3);
      f.set(this.P[3 * i], this.P[3 * i + 1], this.P[3 * i + 2]);
      Bv.set(this.B[3 * i], this.B[3 * i + 1], this.B[3 * i + 2]);
      Nv.set(this.Nn[3 * i], this.Nn[3 * i + 1], this.Nn[3 * i + 2]);
      const u = (r * this.ds) / PIECE;
      for (const sg of segs) {
        for (const q of [sg.a, sg.b]) {
          pos.push(f.x + Bv.x * q[0] + Nv.x * q[1], f.y + Bv.y * q[0] + Nv.y * q[1], f.z + Bv.z * q[0] + Nv.z * q[1]);
          nrm.push(Bv.x * sg.n[0] + Nv.x * sg.n[1], Bv.y * sg.n[0] + Nv.y * sg.n[1], Bv.z * sg.n[0] + Nv.z * sg.n[1]);
        }
        uv.push(u, sg.v0 / plen, u, sg.v1 / plen);
      }
    }
    for (let r = 0; r < N; r++) {
      const i = r % N, j = (r + 1) % N;
      if (this.gap[i] || this.gap[j]) continue;
      const A = ringStart[r], C = ringStart[r + 1];
      for (let k = 0; k < segs.length; k++) {
        const a0 = A + 2 * k, a1 = a0 + 1, c0 = C + 2 * k, c1 = c0 + 1;
        idx.push(a0, c0, a1, a1, c0, c1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    // make sure the faces point outward
    {
      const a = new THREE.Vector3().fromArray(pos, idx[0] * 3), b = new THREE.Vector3().fromArray(pos, idx[1] * 3), c = new THREE.Vector3().fromArray(pos, idx[2] * 3);
      const fn = b.sub(a).cross(c.sub(a)), nn = new THREE.Vector3().fromArray(nrm, idx[0] * 3);
      if (fn.dot(nn) < 0) { for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } g.setIndex(idx); }
    }
    const mesh = new THREE.Mesh(g, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    // end caps where the track stops at the gap
    const contour = prof.map(([x, y]) => new THREE.Vector2(x, y));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    const capPos = [], capN = [];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      let dir = 0;
      if (!this.gap[i] && this.gap[j]) dir = 1; else if (this.gap[i] && !this.gap[j]) { dir = -1; }
      if (!dir) continue;
      const k = dir > 0 ? i : j;
      f.set(this.P[3 * k], this.P[3 * k + 1], this.P[3 * k + 2]);
      Bv.set(this.B[3 * k], this.B[3 * k + 1], this.B[3 * k + 2]);
      Nv.set(this.Nn[3 * k], this.Nn[3 * k + 1], this.Nn[3 * k + 2]);
      const Tv = new THREE.Vector3(this.T[3 * k], this.T[3 * k + 1], this.T[3 * k + 2]).multiplyScalar(dir);
      for (const t of tris) {
        const order = dir > 0 ? t : [t[0], t[2], t[1]];
        for (const vi of order) {
          const [x, y] = prof[vi];
          capPos.push(f.x + Bv.x * x + Nv.x * y, f.y + Bv.y * x + Nv.y * y, f.z + Bv.z * x + Nv.z * y);
          capN.push(Tv.x, Tv.y, Tv.z);
        }
      }
    }
    if (capPos.length) {
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(capPos, 3));
      cg.setAttribute('normal', new THREE.Float32BufferAttribute(capN, 3));
      const cap = new THREE.Mesh(cg, new THREE.MeshPhysicalMaterial({ color: 0xff5a0c, roughness: 0.45, side: THREE.DoubleSide }));
      cap.castShadow = true; group.add(cap);
    }
    group.add(this.buildSupports());
    group.add(this.buildStartLine());
    this.mesh = mesh;
    return group;
  }

  // grey plastic support pylons wherever a wall's underside is clear of what's below it
  buildSupports() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd0, roughness: 0.38, clearcoat: 0.2 });
    const post = new THREE.CylinderGeometry(0.45, 0.55, 1, 16);
    const foot = new THREE.CylinderGeometry(1.5, 1.6, 0.22, 24);
    const cradle = new THREE.BoxGeometry(1.4, 0.35, 1.6);
    const step = Math.round(13 / this.ds);
    for (let i = 0; i < this.N; i += step) {
      if (this.gap[i]) continue;
      for (const side of [-1, 1]) {
        const bx = this.P[3 * i] + this.B[3 * i] * side * (HALF_W + WALL_T * 0.5) - this.Nn[3 * i] * FLOOR_T;
        const by = this.P[3 * i + 1] + this.B[3 * i + 1] * side * (HALF_W + WALL_T * 0.5) - this.Nn[3 * i + 1] * FLOOR_T;
        const bz = this.P[3 * i + 2] + this.B[3 * i + 2] * side * (HALF_W + WALL_T * 0.5) - this.Nn[3 * i + 2] * FLOOR_T;
        const onBooks = bx > BOOKS.x0 && bx < BOOKS.x1 && bz > BOOKS.z0 && bz < BOOKS.z1;
        const floorY = onBooks ? BOOK_TOP : 0;
        const h = by - floorY;
        if (h < 0.55) continue;
        const heading = Math.atan2(this.T[3 * i + 2], this.T[3 * i]);
        const p = new THREE.Mesh(post, mat); p.scale.y = h - 0.3; p.position.set(bx, floorY + (h - 0.3) / 2 + 0.1, bz);
        const ft = new THREE.Mesh(foot, mat); ft.position.set(bx, floorY + 0.11, bz);
        const cr = new THREE.Mesh(cradle, mat); cr.position.set(bx, by - 0.17, bz); cr.rotation.y = -heading;
        for (const m of [p, ft, cr]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
      }
    }
    return g;
  }

  buildStartLine() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64;
    const c = cv.getContext('2d');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 16; x++) { c.fillStyle = (x + y) % 2 ? '#111' : '#f4f2ea'; c.fillRect(x * 32, y * 32, 32, 32); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * HALF_W - 0.3, 1.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    const f = this.sample(this.sStart);
    m.position.copy(f.p).addScaledVector(f.N, 0.01);
    const basis = new THREE.Matrix4().makeBasis(f.B.clone(), f.T.clone(), f.N.clone());
    m.quaternion.setFromRotationMatrix(basis);
    m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m);
    // painted grid slots
    const slotMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 });
    for (let k = 0; k < 4; k++) {
      const s = this.sStart - 8 - k * 7.5, d = k % 2 ? 3.4 : -3.4;
      const fr = this.sample(s);
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.25), slotMat);
      bar.position.copy(fr.p).addScaledVector(fr.B, d).addScaledVector(fr.N, 0.01);
      bar.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(fr.B.clone(), fr.T.clone(), fr.N.clone()));
      g.add(bar);
    }
    return g;
  }

  // centreline in plan view, for the minimap and the notebook sketch
  plan(step = 8) {
    const out = [];
    for (let i = 0; i < this.N; i += step) out.push([this.P[3 * i], this.P[3 * i + 2], this.gap[i]]);
    return out;
  }
}
