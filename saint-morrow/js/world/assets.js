import * as THREE from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const BENCH_PARTS = new Set([
  'crossbar', 'legs_double', 'legs_single', 'suspended_support_01', 'back_support_r', 'back_support_l',
  'arm_rest_01', 'arm_rest_02', 'seat', 'seat_back',
]);

const DEFINITIONS = {
  lamp: { file: 'street_lamp_01' },
  hydrant: { file: 'fire_hydrant', include: (name) => name.endsWith('_aged') },
  bin: { file: 'metal_trash_can', include: (name) => name.includes('_rust') },
  binClean: { file: 'metal_trash_can', include: (name) => !name.includes('_rust') },
  bench: { file: 'modular_street_seating', include: (name) => BENCH_PARTS.has(name) },
  bag: { file: 'trashbag' },
  crate: { file: 'wooden_crate_01' },
  barrel: { file: 'barrel_03' },
  carton: { file: 'cardboard_box_01' },
  utilityA: { file: 'utility_box_01' },
  utilityB: { file: 'utility_box_02' },
  door: { file: 'large_castle_door' },
  shutter: { file: 'rollershutter_door', include: (name) => !name.includes('graffiti') },
  shutterTagged: { file: 'rollershutter_door', include: (name) => name.includes('graffiti') },
  statue: { file: 'gothic_statue' },
  car: { file: 'covered_car' },
  tyre: { file: 'old_tyre' },
  can: { file: 'can_rusted' },
  wallLamp: { file: 'industrial_wall_lamp' },
  rat: { file: 'street_rat' },
};

const NO_SHADOW = new Set(['statue', 'rat', 'can']);
const REFLECTION_SKIP = new Set([
  'statue', 'rat', 'can', 'carton', 'tyre', 'bag', 'bin', 'binClean', 'bench', 'crate', 'barrel', 'hydrant', 'wallLamp',
]);

function tuneMaterial(material, dry) {
  if (material.userData.tuned) return;
  material.userData.tuned = true;
  const isGlass = /glass/i.test(material.name) || material.transmission > 0 || material.transparent;
  if (isGlass) {
    if ('transmission' in material) material.transmission = 0;
    material.transparent = true;
    material.opacity = /wine/i.test(material.name) ? 0.76 : 0.2;
    material.roughness = 0.06;
    material.metalness = 0;
    material.depthWrite = false;
    return;
  }
  if (dry) return;
  // Rain-soaked: darker albedo and a tighter highlight on top of the scanned maps.
  material.color.multiplyScalar(0.8);
  material.roughness = Math.min(material.roughness, 0.74);
}

function nodeName(mesh, root) {
  return mesh.parent && mesh.parent !== root && mesh.parent.isGroup ? mesh.parent.name : mesh.name;
}

export const loadPropLibrary = () => loadLibrary(DEFINITIONS, 'models', false);

export async function loadLibrary(definitions, folder, dry) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const files = [...new Set(Object.values(definitions).map((definition) => definition.file))];
  const loaded = new Map(await Promise.all(files.map(async (file) => {
    const gltf = await loader.loadAsync(`./assets/${folder}/${file}.glb`);
    gltf.scene.updateMatrixWorld(true);
    return [file, gltf.scene];
  })));

  const library = {};
  for (const [key, definition] of Object.entries(definitions)) {
    const root = loaded.get(definition.file);
    const parts = [];
    const box = new THREE.Box3();
    root.traverse((object) => {
      if (!object.isMesh) return;
      if (definition.include && !definition.include(nodeName(object, root))) return;
      tuneMaterial(object.material, dry);
      object.geometry.computeBoundingBox();
      box.union(object.geometry.boundingBox.clone().applyMatrix4(object.matrixWorld));
      parts.push({ geometry: object.geometry, material: object.material, matrix: object.matrixWorld.clone() });
    });
    if (!parts.length) throw new Error(`No meshes for prop ${key}`);
    library[key] = { parts, box, size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) };
  }
  return library;
}

const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _scale = new THREE.Vector3();

export class PropField {
  constructor(library, colliders) {
    this.library = library;
    this.colliders = colliders;
    this.placements = new Map();
  }

  /** Places a prop with its footprint centred on x/z and its base resting on y. */
  place(name, { x, y = 0, z, rotY = 0, tiltX = 0, tiltZ = 0, scale = 1, solid = true }) {
    const prop = this.library[name];
    if (!prop) throw new Error(`Unknown prop: ${name}`);
    const [sx, sy, sz] = Array.isArray(scale) ? scale : [scale, scale, scale];
    _position.set(x, y, z);
    _quaternion.setFromEuler(_euler.set(tiltX, rotY, tiltZ, 'YXZ'));
    _scale.set(sx, sy, sz);
    const matrix = new THREE.Matrix4().compose(_position, _quaternion, _scale)
      .multiply(new THREE.Matrix4().makeTranslation(-prop.center.x, -prop.box.min.y, -prop.center.z));
    if (!this.placements.has(name)) this.placements.set(name, []);
    this.placements.get(name).push(matrix);

    if (solid) {
      const height = prop.size.y * sy;
      this.colliders.box(prop.size.x * sx, height, prop.size.z * sz, 0, height / 2, 0, new THREE.Matrix4().makeRotationY(rotY).setPosition(x, y, z));
    }
  }

  /** Places a prop in a facade's local space, where +Z points out of the wall. */
  placeOnWall(name, wall, rotation, localX, localY, localZ, options = {}) {
    _position.set(localX, localY, localZ).applyMatrix4(wall);
    this.place(name, { ...options, x: _position.x, y: _position.y, z: _position.z, rotY: rotation + (options.rotY ?? 0) });
  }

  /** Returns the small or high-up props that are not worth drawing again in the road reflection. */
  build(scene) {
    const instance = new THREE.Matrix4();
    const skipInReflection = [];
    for (const [name, matrices] of this.placements) {
      for (const part of this.library[name].parts) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, matrices.length);
        matrices.forEach((matrix, index) => mesh.setMatrixAt(index, instance.multiplyMatrices(matrix, part.matrix)));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        mesh.castShadow = !part.material.transparent && !NO_SHADOW.has(name);
        mesh.receiveShadow = true;
        mesh.renderOrder = part.material.transparent ? 6 : 0;
        scene.add(mesh);
        if (REFLECTION_SKIP.has(name)) skipInReflection.push(mesh);
      }
    }
    this.placements.clear();
    return skipInReflection;
  }
}
