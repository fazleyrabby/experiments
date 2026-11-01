import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface Xf {
  p?: [number, number, number];
  r?: [number, number, number]; // euler XYZ radians
  s?: [number, number, number] | number;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

export function xf(spec: Xf, out = new THREE.Matrix4()): THREE.Matrix4 {
  const p = spec.p ?? [0, 0, 0];
  const r = spec.r ?? [0, 0, 0];
  const sc = spec.s ?? 1;
  _v.set(p[0], p[1], p[2]);
  _e.set(r[0], r[1], r[2], 'XYZ');
  _q.setFromEuler(_e);
  if (typeof sc === 'number') _s.set(sc, sc, sc);
  else _s.set(sc[0], sc[1], sc[2]);
  return out.compose(_v, _q, _s);
}

/** Normalise attributes so geometries can be merged: non-indexed, position/normal/uv only. */
export function prep(g: THREE.BufferGeometry): THREE.BufferGeometry {
  let out = g;
  if (out.index) out = out.toNonIndexed();
  for (const k of Object.keys(out.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'uv') out.deleteAttribute(k);
  }
  if (!out.attributes.normal) out.computeVertexNormals();
  if (!out.attributes.uv) {
    out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((out.attributes.position.count) * 2), 2));
  }
  return out;
}

export class Bag {
  private m = new Map<string, THREE.BufferGeometry[]>();

  add(key: string, geo: THREE.BufferGeometry, spec?: Xf | THREE.Matrix4): this {
    const g = prep(geo);
    if (spec) g.applyMatrix4(spec instanceof THREE.Matrix4 ? spec : xf(spec));
    let a = this.m.get(key);
    if (!a) this.m.set(key, (a = []));
    a.push(g);
    return this;
  }

  keys(): string[] {
    return [...this.m.keys()];
  }

  merged(key: string): THREE.BufferGeometry | null {
    const a = this.m.get(key);
    if (!a || !a.length) return null;
    const g = mergeGeometries(a, false);
    for (const x of a) x.dispose();
    return g;
  }

  build(mats: Record<string, THREE.Material>, shadows = true): THREE.Group {
    const grp = new THREE.Group();
    for (const k of this.keys()) {
      const g = this.merged(k);
      if (!g) continue;
      const mat = mats[k];
      if (!mat) throw new Error(`missing material ${k}`);
      const mesh = new THREE.Mesh(g, mat);
      mesh.name = k;
      mesh.castShadow = shadows;
      mesh.receiveShadow = shadows;
      grp.add(mesh);
    }
    return grp;
  }
}

// ---------------------------------------------------------------- primitives
export const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

/** Cylinder along the given axis. */
export function cyl(rTop: number, rBot: number, h: number, seg = 16, axis: 'x' | 'y' | 'z' = 'y', open = false) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

/** Lathe around the given axis. Profile: [radius, along-axis]. */
export function lathe(profile: [number, number][], seg = 24, axis: 'x' | 'y' | 'z' = 'y') {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  else if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

export const sphere = (r: number, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);

export function torus(R: number, r: number, radial = 8, tubular = 24, axis: 'x' | 'y' | 'z' = 'z') {
  const g = new THREE.TorusGeometry(R, r, radial, tubular);
  if (axis === 'x') g.rotateY(Math.PI / 2);
  else if (axis === 'y') g.rotateX(Math.PI / 2);
  return g;
}

export function tube(points: [number, number, number][], radius: number, radial = 8, segPerPoint = 8, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal');
  return new THREE.TubeGeometry(curve, Math.max(2, (points.length - 1) * segPerPoint), radius, radial, closed);
}

export function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export function rectPath(x0: number, y0: number, x1: number, y1: number, cw = true): THREE.Path {
  const p = new THREE.Path();
  if (cw) {
    p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0);
  } else {
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.lineTo(x0, y0);
  }
  return p;
}

/** Extrude a shape along +z by `depth`, centred on z = 0, with optional bevel. */
export function extrude(shape: THREE.Shape, depth: number, bevel = 0, curveSeg = 6) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, depth - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: bevel > 0 ? 2 : 0,
    curveSegments: curveSeg,
  });
  g.translate(0, 0, -(depth - 2 * bevel) / 2);
  return g;
}

/**
 * Convert a geometry built in "rod space" (x = along rod, y = width, z = thickness)
 * into loco space (z = along, y = width, x = thickness) so it can be rotated about x.
 */
export function alongZ(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
  g.applyMatrix4(m);
  // the axis swap mirrors the mesh (det = -1): restore outward winding
  const idx = g.index;
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = idx.getX(i + 1), b = idx.getX(i + 2);
      idx.setX(i + 1, b);
      idx.setX(i + 2, a);
    }
  } else {
    for (const name of Object.keys(g.attributes)) {
      const at = g.attributes[name] as THREE.BufferAttribute;
      const n = at.itemSize;
      for (let i = 0; i + 2 < at.count; i += 3) {
        for (let k = 0; k < n; k++) {
          const t = at.array[(i + 1) * n + k];
          (at.array as Float32Array)[(i + 1) * n + k] = at.array[(i + 2) * n + k];
          (at.array as Float32Array)[(i + 2) * n + k] = t;
        }
      }
      at.needsUpdate = true;
    }
  }
  return g;
}

/** Random-ish vertex jitter for hand-built irregular shapes (coal, ballast, rocks). */
export function jitter(g: THREE.BufferGeometry, amount: number, seed = 1) {
  const p = g.attributes.position;
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const map = new Map<string, THREE.Vector3>();
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    let o = map.get(key);
    if (!o) {
      o = new THREE.Vector3((rnd() - 0.5) * amount, (rnd() - 0.5) * amount, (rnd() - 0.5) * amount);
      map.set(key, o);
    }
    p.setXYZ(i, v.x + o.x, v.y + o.y, v.z + o.z);
  }
  g.computeVertexNormals();
  return g;
}
