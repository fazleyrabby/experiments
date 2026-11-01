import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { createBrick } from './createBrick.js';
import { disposeBrickGeometries, getGeometryCount } from './brickGeometry.js';
import { disposeBrickMaterials, getBrickMaterial } from './brickMaterials.js';
import { generateSpaceshipLayout } from './spaceshipLayout.js';

/** Soft radial falloff used for the engine exhaust halos. */
function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, 'rgba(190,230,255,0.75)');
  gradient.addColorStop(0.45, 'rgba(70,160,255,0.22)');
  gradient.addColorStop(1, 'rgba(30,110,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds the ship from the layout: one mesh per brick, all parented to a pivot
 * group centred on the model so it can be spun as a whole.
 *
 * Each returned brick record carries its permanent rest transform plus the
 * scattered and exploded poses, so the animation system only ever interpolates
 * between stored values and never accumulates error.
 */
export function createSpaceship() {
  const layout = generateSpaceshipLayout();
  const pivot = new THREE.Group();
  pivot.name = 'spaceship';

  const euler = new THREE.Euler();
  const tilt = new THREE.Quaternion();

  const bricks = layout.bricks.map((data) => {
    const finalPosition = new THREE.Vector3().fromArray(data.position);
    euler.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    const finalQuaternion = new THREE.Quaternion().setFromEuler(euler);

    const mesh = createBrick({
      width: data.grid.w,
      height: data.grid.h,
      depth: data.grid.d,
      position: finalPosition,
      rotation: euler,
      color: data.color,
      type: data.type,
      shape: data.geo,
    });
    mesh.name = data.id;
    pivot.add(mesh);

    euler.set(data.explodedTilt[0], data.explodedTilt[1], data.explodedTilt[2]);
    tilt.setFromEuler(euler);

    return {
      id: data.id,
      index: data.index,
      section: data.section,
      // Volume in stud-plates; drives the pitch of the brick's click.
      mass: data.grid.w * data.grid.h * data.grid.d,
      mesh,
      finalPosition,
      finalQuaternion,
      scatterPosition: new THREE.Vector3().fromArray(data.scatterPosition),
      scatterQuaternion: new THREE.Quaternion().fromArray(data.scatterQuaternion),
      explodedPosition: new THREE.Vector3().fromArray(data.explodedPosition),
      explodedQuaternion: tilt.clone().multiply(finalQuaternion),
      order: data.order,
      timingJitter: data.timingJitter,
      durationJitter: data.durationJitter,
      floatPhase: data.floatPhase,
    };
  });

  // --- Engine effects (not bricks): exhaust halos and one soft light. They
  // only come alive while the ship is whole.
  const glowTexture = createGlowTexture();
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: PALETTE.glow,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const halos = layout.engineGlows.map((glow) => {
    const sprite = new THREE.Sprite(glowMaterial);
    sprite.position.fromArray(glow.position);
    sprite.scale.setScalar(glow.radius * 5.2);
    sprite.visible = false;
    pivot.add(sprite);
    return sprite;
  });

  const engineLight = new THREE.PointLight(PALETTE.glow, 0, 18, 2);
  const rear = layout.engineGlows.reduce((z, glow) => Math.min(z, glow.position[2]), 0);
  engineLight.position.set(0, layout.engineGlows[0]?.position[1] ?? 0, rear - 1.2);
  pivot.add(engineLight);

  const coreMaterial = getBrickMaterial('glow');

  /** @param {number} power 0 (cold) .. 1 (running)  @param {number} time seconds */
  function setEnginePower(power, time) {
    const flicker = 1 + Math.sin(time * 9.1) * 0.035 + Math.sin(time * 23.7) * 0.02;
    coreMaterial.emissiveIntensity = 0.1 + 2.7 * power * flicker;
    glowMaterial.opacity = 0.8 * power * flicker;
    engineLight.intensity = 55 * power * flicker;
    const visible = power > 0.003;
    for (const halo of halos) halo.visible = visible;
  }

  function dispose() {
    pivot.removeFromParent();
    glowTexture.dispose();
    glowMaterial.dispose();
    disposeBrickGeometries();
    disposeBrickMaterials();
  }

  return {
    pivot,
    bricks,
    layout,
    stats: { bricks: bricks.length, geometries: getGeometryCount() },
    setEnginePower,
    dispose,
  };
}
