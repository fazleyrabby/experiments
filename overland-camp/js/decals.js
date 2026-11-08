// Shared decal helpers: soft contact shadows that ground objects on the
// forest floor and scattered leaf litter for a lived-in look.
import * as THREE from 'three';
import { getContactShadowTexture, getLeafLitterTexture } from './textures.js';

let shadowMaterial = null;
function getShadowMaterial() {
  if (!shadowMaterial) {
    shadowMaterial = new THREE.MeshBasicMaterial({
      map: getContactShadowTexture(),
      color: 0x05070a,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4
    });
  }
  return shadowMaterial;
}

/**
 * Soft occlusion patch under an object.
 * @param {number} radiusX  half-width along X
 * @param {number} radiusZ  half-depth along Z
 */
export function createContactShadow(radiusX, radiusZ = radiusX, opacity = 0.5, angle = 0) {
  const mat = getShadowMaterial().clone();
  mat.opacity = opacity;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.rotation.x = -Math.PI * 0.5;
  mesh.rotateZ(angle);
  mesh.scale.set(radiusX * 2, radiusZ * 2, 1);
  mesh.renderOrder = 1;
  mesh.matrixAutoUpdate = true;
  return mesh;
}

/**
 * Instanced dry leaves lying flat on the ground.
 * @param {object} opts count, innerRadius, outerRadius, getHeight, isClear
 */
export function scatterLeafLitter({
  count = 600,
  innerRadius = 2,
  outerRadius = 22,
  getHeight,
  isClear = () => true,
  centerX = 0,
  centerZ = 0
} = {}) {
  const geo = new THREE.PlaneGeometry(0.55, 0.55);
  geo.rotateX(-Math.PI * 0.5);
  const mat = new THREE.MeshStandardMaterial({
    map: getLeafLitterTexture(),
    alphaTest: 0.35,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.receiveShadow = true;
  mesh.renderOrder = 1;

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let placed = 0;

  for (let i = 0; i < count * 3 && placed < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = innerRadius + Math.sqrt(Math.random()) * (outerRadius - innerRadius);
    const x = centerX + Math.cos(angle) * radius;
    const z = centerZ + Math.sin(angle) * radius;
    if (!isClear(x, z)) continue;

    dummy.position.set(x, getHeight(x, z) + 0.014 + Math.random() * 0.01, z);
    dummy.rotation.set((Math.random() - 0.5) * 0.18, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.18);
    const s = 0.55 + Math.random() * 0.9;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);

    col.setHSL(0.08 + Math.random() * 0.06, 0.25 + Math.random() * 0.2, 0.55 + Math.random() * 0.3);
    mesh.setColorAt(placed, col);
    placed++;
  }

  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
