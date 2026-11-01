import * as THREE from 'three';
import { getBrickGeometry, disposeBrickGeometries, getGeometryCount } from './brickGeometry.js';
import { disposeBrickMaterials, getBrickMaterial, setLampPower } from './brickMaterials.js';
import { generateCarLayout } from './carLayout.js';

/**
 * Builds the car from the layout. Every piece is a logical "brick" with its own
 * independently animated transform, but pieces that share geometry and
 * material are drawn through one InstancedMesh, so several thousand bricks
 * cost only a few hundred draw calls.
 *
 * The animation system moves a lightweight proxy (position + quaternion) per
 * brick; `sync()` writes those transforms into the instance buffers once per
 * frame. Each returned brick record carries its permanent rest transform plus
 * the scattered and exploded poses, so animation only ever interpolates
 * between stored values and never accumulates error.
 */
export function createCar() {
  const layout = generateCarLayout();
  const pivot = new THREE.Group();
  pivot.name = 'car';

  const euler = new THREE.Euler();
  const spinQuaternion = new THREE.Quaternion();
  const tilt = new THREE.Quaternion();
  const scratch = new THREE.Vector3();
  const unit = new THREE.Vector3(1, 1, 1);
  const matrix = new THREE.Matrix4();

  const groups = new Map();

  const bricks = layout.bricks.map((data) => {
    const finalPosition = new THREE.Vector3().fromArray(data.position);
    euler.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    const finalQuaternion = new THREE.Quaternion().setFromEuler(euler);

    // Exploded pose: slide along the section's direction, optionally swinging on a hinge.
    const explodedPosition = finalPosition.clone();
    const explodedQuaternion = finalQuaternion.clone();
    if (data.explodedSpin) {
      const { pivot: hinge, axis, angle } = data.explodedSpin;
      spinQuaternion.setFromAxisAngle(scratch.fromArray(axis), angle);
      explodedPosition
        .sub(scratch.fromArray(hinge))
        .applyQuaternion(spinQuaternion)
        .add(scratch.fromArray(hinge));
      explodedQuaternion.premultiply(spinQuaternion);
    } else {
      euler.set(data.explodedTilt[0] * 0.3, data.explodedTilt[1] * 0.3, data.explodedTilt[2] * 0.3);
      tilt.setFromEuler(euler);
      explodedQuaternion.premultiply(tilt);
    }
    explodedPosition.add(scratch.fromArray(data.explodedOffset));

    const key = `${JSON.stringify(data.geo)}|${data.color}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = { geo: data.geo, color: data.color, members: [] }));

    const proxy = {
      position: finalPosition.clone(),
      quaternion: finalQuaternion.clone(),
    };
    const brick = {
      id: data.id,
      index: data.index,
      section: data.section,
      color: data.color,
      type: data.type,
      // Volume in stud-plates; drives the pitch of the brick's click.
      mass: Math.max(1, data.grid.w * data.grid.h * data.grid.d),
      mesh: proxy,
      finalPosition,
      finalQuaternion,
      scatterPosition: new THREE.Vector3().fromArray(data.scatterPosition),
      scatterQuaternion: new THREE.Quaternion().fromArray(data.scatterQuaternion),
      explodedPosition,
      explodedQuaternion,
      order: data.order,
      timingJitter: data.timingJitter,
      durationJitter: data.durationJitter,
      floatPhase: data.floatPhase,
    };
    group.members.push(brick);
    return brick;
  });

  const meshes = [];
  for (const group of groups.values()) {
    const mesh = new THREE.InstancedMesh(getBrickGeometry(group.geo), getBrickMaterial(group.color), group.members.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Pieces move far from the original bounding sphere, so never cull per mesh.
    mesh.frustumCulled = false;
    const translucent = group.color === 'glass';
    mesh.castShadow = !translucent;
    mesh.receiveShadow = !translucent;
    if (translucent) mesh.renderOrder = 2;
    mesh.name = `${group.geo.shape}-${group.color}`;
    group.members.forEach((brick, i) => {
      brick.instance = i;
    });
    group.mesh = mesh;
    meshes.push(group);
    pivot.add(mesh);
  }

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

  /** @param {number} power 0 (cold) .. 1 (running)  @param {number} time seconds */
  function setLights(power, time) {
    const flicker = 1 + Math.sin(time * 7.3) * 0.02;
    setLampPower(power * flicker);
  }

  function dispose() {
    pivot.removeFromParent();
    for (const group of meshes) group.mesh.dispose();
    disposeBrickGeometries();
    disposeBrickMaterials();
  }

  return {
    pivot,
    bricks,
    layout,
    stats: { bricks: bricks.length, geometries: getGeometryCount(), drawCalls: meshes.length },
    sync,
    setLights,
    dispose,
  };
}
