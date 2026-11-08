// Small geometry helpers shared by the camp props: irregular rocks, sagging
// canvas slings and tapered timber.
import * as THREE from 'three';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Irregular weathered rock — an icosahedron pushed around with layered noise
 * so it never reads as a low-poly primitive.
 */
export function makeRockGeometry(radius = 0.2, detail = 1, seed = 1, roughness = 0.26) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const rnd = mulberry32(seed * 7919 + 13);
  const noise = [];
  for (let i = 0; i < 64; i++) noise.push(rnd());

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n =
      1 +
      Math.sin(x * 9.1 + seed) * roughness * 0.6 +
      Math.cos(z * 7.7 - seed * 0.7) * roughness * 0.5 +
      (noise[i % noise.length] - 0.5) * roughness;
    // flatten the top and bottom so stones sit on the ground naturally
    pos.setXYZ(i, x * n, y * n * (y > 0 ? 0.82 : 0.66), z * n);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * A canvas sling that sags between its supports, used for chair seats and
 * hammocks. Returns a plane with a catenary-ish droop and a soft edge curl.
 */
export function makeSaggingCanvasGeometry(width, depth, sag = 0.06, segX = 8, segZ = 6) {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = x / width;
    const v = y / depth;
    const droop = Math.cos(u * Math.PI) * Math.cos(v * Math.PI * 0.5);
    const curl = Math.pow(Math.abs(v) * 2, 3) * 0.05;
    pos.setZ(i, -droop * sag + curl);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Tapered timber with a slight natural bend.
 */
export function makeBranchGeometry(length, rBottom, rTop, seed = 1, bend = 0.04) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, length, 8, 4);
  const pos = geo.attributes.position;
  const rnd = mulberry32(seed * 104729 + 7);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = (y + length * 0.5) / length;
    const wobble = 1 + (rnd() - 0.5) * 0.12;
    pos.setX(i, pos.getX(i) * wobble + Math.sin(t * Math.PI) * bend);
    pos.setZ(i, pos.getZ(i) * wobble + Math.cos(t * Math.PI * 1.3) * bend * 0.6);
  }
  geo.computeVertexNormals();
  return geo;
}
