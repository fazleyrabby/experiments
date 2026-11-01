import * as THREE from 'three';
import { getBrickGeometry } from './brickGeometry.js';
import { getBrickMaterial } from './brickMaterials.js';

/** Default geometry descriptor for the simple rectangular types. */
function defaultShape(type, width, height, depth) {
  const studs = [];
  if (type === 'brick' || type === 'plate') {
    for (let i = 0; i < width; i++) for (let j = 0; j < depth; j++) studs.push([i, j]);
  }
  return { shape: 'box', w: width, h: height, d: depth, studs };
}

/**
 * Reusable procedural LEGO brick generator.
 *
 * @param {object} options
 * @param {number} options.width     footprint along X, in studs
 * @param {number} options.height    height in plates (3 plates = 1 brick)
 * @param {number} options.depth     footprint along Z, in studs
 * @param {THREE.Vector3} options.position  centre of the brick
 * @param {THREE.Euler} [options.rotation]  resting orientation
 * @param {string} options.color     palette colour name (see config.js)
 * @param {string} [options.type]    'brick' | 'plate' | 'tile' | ... (see LayoutBuilder)
 * @param {object} [options.shape]   explicit geometry descriptor; overrides the
 *                                   default box built from width/height/depth
 * @returns {THREE.Mesh} one independently transformable mesh. Its geometry
 *   (body + studs merged) and material are shared with every identical brick.
 */
export function createBrick({
  width = 2,
  height = 3,
  depth = 4,
  position,
  rotation,
  color = 'red',
  type = 'brick',
  shape,
}) {
  const descriptor = shape ?? defaultShape(type, width, height, depth);
  const mesh = new THREE.Mesh(getBrickGeometry(descriptor), getBrickMaterial(color));
  if (position) mesh.position.copy(position);
  if (rotation) mesh.rotation.copy(rotation);

  const translucent = color === 'glass';
  mesh.castShadow = !translucent;
  mesh.receiveShadow = !translucent && color !== 'glow';
  if (translucent) mesh.renderOrder = 2;

  mesh.userData.brick = { type, color, width, height, depth };
  return mesh;
}
