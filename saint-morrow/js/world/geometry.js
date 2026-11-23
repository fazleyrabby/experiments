import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const WHITE = [1, 1, 1];

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box whose UVs are measured in world metres, so textures keep a constant scale. */
export function metricBox(width, height, depth, tile = 2.5) {
  const geometry = new THREE.BoxGeometry(width, height, depth).toNonIndexed();
  const { position, normal, uv } = geometry.attributes;
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    if (nx > 0.5) uv.setXY(i, position.getZ(i) / tile, position.getY(i) / tile);
    else if (ny > 0.5) uv.setXY(i, position.getX(i) / tile, position.getZ(i) / tile);
    else uv.setXY(i, position.getX(i) / tile, position.getY(i) / tile);
  }
  return geometry;
}

export function scaleUv(geometry, factor) {
  const { uv } = geometry.attributes;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * factor, uv.getY(i) * factor);
  return geometry;
}

/** Counter-clockwise outline of an equilateral gothic arch. */
export function gothicPoints(cx, y, width, height, segments = 8) {
  const spring = y + height - width * Math.sin(Math.PI / 3);
  const points = [new THREE.Vector2(cx - width / 2, y), new THREE.Vector2(cx + width / 2, y)];
  for (let i = 0; i <= segments; i++) {
    const angle = (Math.PI / 3) * (i / segments);
    points.push(new THREE.Vector2(cx - width / 2 + width * Math.cos(angle), spring + width * Math.sin(angle)));
  }
  for (let i = 1; i <= segments; i++) {
    const angle = (2 * Math.PI) / 3 + (Math.PI / 3) * (i / segments);
    points.push(new THREE.Vector2(cx + width / 2 + width * Math.cos(angle), spring + width * Math.sin(angle)));
  }
  return points;
}

export function circlePoints(cx, cy, radius, segments = 28) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
  }
  return points;
}

export function extrudeRing(outer, inner, depth, z, tile) {
  const shape = new THREE.Shape(outer);
  shape.holes.push(new THREE.Path(inner));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geometry.translate(0, 0, z);
  return scaleUv(geometry, 1 / tile);
}

export class Batches {
  constructor() {
    this.groups = new Map();
  }

  add(key, geometry, matrix = null, tint = WHITE) {
    const part = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    for (const name of Object.keys(part.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) part.deleteAttribute(name);
    }
    if (matrix) part.applyMatrix4(matrix);
    const tints = new Float32Array(part.attributes.position.count * 3);
    for (let i = 0; i < tints.length; i += 3) tints.set(tint, i);
    part.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
    if (!this.groups.has(key)) this.groups.set(key, []);
    this.groups.get(key).push(part);
  }

  /** Merges per material and street cell so the renderer can frustum-cull each block. */
  build(materials, parent, noShadow = new Set()) {
    const fine = [];
    for (const [key, parts] of this.groups) {
      if (!materials[key]) throw new Error(`Missing material: ${key}`);
      for (const { parts: cellParts, isFine } of splitIntoCells(parts)) {
        const mesh = new THREE.Mesh(mergeGeometries(cellParts, false), materials[key]);
        mesh.name = key;
        mesh.geometry.computeBoundingSphere();
        mesh.castShadow = !noShadow.has(key);
        mesh.receiveShadow = !noShadow.has(key);
        parent.add(mesh);
        if (isFine) fine.push(mesh);
      }
      parts.forEach((part) => part.dispose());
    }
    this.groups.clear();
    return fine;
  }
}

const CELL_SIZE = 24;
const FINE_SIZE = 0.42;
const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

/** Groups geometries by side of the street and distance along it, separating small ornament. */
export function splitIntoCells(parts) {
  const cells = new Map();
  for (const part of parts) {
    _box.setFromBufferAttribute(part.attributes.position);
    _box.getCenter(_center);
    _box.getSize(_size);
    const isFine = Math.max(_size.x, _size.y, _size.z) < FINE_SIZE;
    const id = `${Math.sign(_center.x)}:${Math.floor(_center.z / CELL_SIZE)}:${isFine}`;
    if (!cells.has(id)) cells.set(id, { parts: [], isFine });
    cells.get(id).parts.push(part);
  }
  return [...cells.values()];
}

export class Colliders {
  constructor() {
    this.parts = [];
  }

  box(width, height, depth, x, y, z, matrix = null) {
    const geometry = new THREE.BoxGeometry(width, height, depth).toNonIndexed();
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    geometry.translate(x, y, z);
    if (matrix) geometry.applyMatrix4(matrix);
    this.parts.push(geometry);
  }

  build() {
    const merged = mergeGeometries(this.parts, false);
    this.parts.forEach((part) => part.dispose());
    this.parts = [];
    return merged;
  }
}
