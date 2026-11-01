import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const _dir = new THREE.Vector3();
const _q = new THREE.Quaternion();

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Cylinder from a (radius r0) to b (radius r1), already transformed into place. */
export function cylinderBetween(a, b, r0, r1 = r0, radial = 14, capped = true) {
  _dir.subVectors(b, a);
  const len = _dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, 1, !capped);
  g.translate(0, len / 2, 0);
  _q.setFromUnitVectors(UP, _dir.normalize());
  g.applyQuaternion(_q);
  g.translate(a.x, a.y, a.z);
  return g;
}

export function sphereAt(p, r, w = 16, h = 12) {
  const g = new THREE.SphereGeometry(r, w, h);
  g.translate(p.x, p.y, p.z);
  return g;
}

export function boxAt(p, sx, sy, sz, rotZ = 0) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (rotZ) g.rotateZ(rotZ);
  g.translate(p.x, p.y, p.z);
  return g;
}

export function tubeThrough(points, r, segments = 32, radial = 10, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.TubeGeometry(curve, segments, r, radial, closed);
}

/**
 * Collects geometries per material key and merges them, so a part made of
 * dozens of tubes costs one draw call per material (twice: main + mirror pass).
 */
export class GeometryBatch {
  constructor() {
    this.groups = new Map();
  }

  add(key, geometry) {
    if (!this.groups.has(key)) this.groups.set(key, []);
    this.groups.get(key).push(geometry);
    return this;
  }

  build(materials, { castShadow = true, receiveShadow = true } = {}) {
    const group = new THREE.Group();
    for (const [key, list] of this.groups) {
      const prepared = list.map((g) => {
        const n = g.index ? g.toNonIndexed() : g;
        for (const name of Object.keys(n.attributes)) {
          if (name !== 'position' && name !== 'normal') n.deleteAttribute(name);
        }
        if (n !== g) g.dispose();
        return n;
      });
      const merged = mergeGeometries(prepared, false);
      prepared.forEach((g) => g.dispose());
      const mesh = new THREE.Mesh(merged, materials[key]);
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.name = key;
      group.add(mesh);
    }
    return group;
  }
}
