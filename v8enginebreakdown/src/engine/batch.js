import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Bake static detail into a handful of material batches per movable component. */
export function batchStaticDetail(group, resources) {
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert();
  const byMaterial = new Map();
  const meshes = [];
  group.traverse(object => {
    if (!object.isMesh) return;
    meshes.push(object);
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
    if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
    byMaterial.get(object.material).push(geometry);
  });
  for (const [material, geometries] of byMaterial) {
    const merged = mergeGeometries(geometries);
    if (!merged) throw new Error(`Unable to batch ${group.name}`);
    merged.computeBoundingSphere();
    resources.geometries.set(`batch:${group.uuid}:${material.uuid}`, merged);
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `${group.name}: ${material.color.getHexString()} detail`;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach(geometry => geometry.dispose());
  }
  meshes.forEach(mesh => mesh.removeFromParent());
}
