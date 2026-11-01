import * as THREE from 'three';
import { disposeBrickGeometries, getBrickGeometry, getGeometryCount } from './brickGeometry.js';
import { disposeBrickMaterials, getBrickMaterial, setPower } from './brickMaterials.js';
import { generateFalconLayout } from './falconLayout.js';

/**
 * Builds the ship from the layout. Every piece is a logical "brick" with its
 * own independently animated transform, but pieces that share geometry and
 * material are drawn through one InstancedMesh, so four thousand bricks cost
 * only a few hundred draw calls.
 *
 * The animation system moves a lightweight proxy (position + quaternion) per
 * brick; `sync()` writes those transforms into the instance buffers once per
 * frame. Each brick record carries its permanent rest transform plus the
 * scattered and exploded poses, so animation only ever interpolates between
 * stored values and never accumulates error.
 *
 * Scene graph: root (gentle bob and bank) -> pivot (showcase spin) -> meshes.
 */
export function createFalcon() {
  const layout = generateFalconLayout();
  const root = new THREE.Group();
  root.name = 'falcon';
  const pivot = new THREE.Group();
  pivot.name = 'falcon-pivot';
  root.add(pivot);

  const euler = new THREE.Euler();
  const tilt = new THREE.Quaternion();
  const scratch = new THREE.Vector3();
  const unit = new THREE.Vector3(1, 1, 1);
  const matrix = new THREE.Matrix4();

  const groups = new Map();

  const bricks = layout.bricks.map((data) => {
    const finalPosition = new THREE.Vector3().fromArray(data.position);
    euler.set(data.rotation[0], data.rotation[1], data.rotation[2], data.order);
    const finalQuaternion = new THREE.Quaternion().setFromEuler(euler);

    // Exploded pose: slide along the section's direction with a slight tilt.
    const explodedQuaternion = finalQuaternion.clone();
    euler.set(data.explodedTilt[0], data.explodedTilt[1], data.explodedTilt[2], 'XYZ');
    tilt.setFromEuler(euler);
    explodedQuaternion.premultiply(tilt);
    const explodedPosition = finalPosition.clone().add(scratch.fromArray(data.explodedOffset));

    const key = `${JSON.stringify(data.geo)}|${data.color}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { geo: data.geo, color: data.color, members: [] }));

    const brick = {
      id: data.id,
      index: data.index,
      section: data.section,
      color: data.color,
      type: data.type,
      mass: data.mass,
      mesh: { position: finalPosition.clone(), quaternion: finalQuaternion.clone() },
      finalPosition,
      finalQuaternion,
      scatterPosition: new THREE.Vector3().fromArray(data.scatterPosition),
      scatterQuaternion: new THREE.Quaternion().fromArray(data.scatterQuaternion),
      explodedPosition,
      explodedQuaternion,
      order: data.buildOrder,
      timingJitter: data.timingJitter,
      durationJitter: data.durationJitter,
      floatPhase: data.floatPhase,
    };
    group.members.push(brick);
    return brick;
  });

  const meshes = [];
  for (const group of groups.values()) {
    const mesh = new THREE.InstancedMesh(
      getBrickGeometry(group.geo),
      getBrickMaterial(group.color),
      group.members.length,
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Pieces move far from the original bounding sphere, so never cull per mesh.
    mesh.frustumCulled = false;
    const translucent = group.color === 'glass';
    const glowing = group.color === 'engine' || group.color.startsWith('glow');
    mesh.castShadow = !translucent && !glowing;
    mesh.receiveShadow = !translucent;
    if (translucent) mesh.renderOrder = 2;
    mesh.name = `${group.geo.shape}-${group.color}`;
    group.mesh = mesh;
    meshes.push(group);
    pivot.add(mesh);
  }

  // Blue wash thrown by the engine arc onto the nearby bricks.
  const engineLight = new THREE.PointLight(0x5cc8ff, 0, layout.radius * 0.6, 2);
  engineLight.position.set(0, 0, -layout.radius * 0.8);
  pivot.add(engineLight);

  /** Write every brick's current transform into its instance buffer. */
  function sync() {
    for (const group of meshes) {
      const { mesh, members } = group;
      for (let i = 0; i < members.length; i++) {
        const proxy = members[i].mesh;
        matrix.compose(proxy.position, proxy.quaternion, unit);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
  sync();

  /**
   * @param {number} engine 0 (cold) .. 1 (running), may overshoot on ignition
   * @param {number} lamps  0 .. 1
   * @param {number} time   seconds
   */
  function setLights(engine, lamps, time) {
    const flicker = 1 + Math.sin(time * 23.0) * 0.015 + Math.sin(time * 7.3) * 0.025;
    const blink = Math.pow(Math.max(0, Math.sin(time * 2.6)), 12);
    setPower(engine * flicker, lamps, blink);
    engineLight.intensity = engine * flicker * 60;
  }

  function dispose() {
    root.removeFromParent();
    for (const group of meshes) group.mesh.dispose();
    engineLight.dispose();
    disposeBrickGeometries();
    disposeBrickMaterials();
  }

  return {
    root,
    pivot,
    bricks,
    layout,
    stats: { bricks: bricks.length, geometries: getGeometryCount(), drawCalls: meshes.length },
    sync,
    setLights,
    dispose,
  };
}
