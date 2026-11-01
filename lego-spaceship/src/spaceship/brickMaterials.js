import * as THREE from 'three';
import { PALETTE } from '../config.js';

// One shared material per palette colour. ABS plastic: non-metallic, fairly
// glossy, with restrained environment reflections.

const cache = new Map();

function createMaterial(colorName) {
  const color = PALETTE[colorName];
  if (color === undefined) throw new Error(`Unknown brick colour "${colorName}"`);

  switch (colorName) {
    case 'glass':
      // Translucent canopy. Rendered after the opaque bricks so the pilot and
      // cockpit interior stay visible through it.
      return new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity: 0.4,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.5,
        depthWrite: false,
      });
    case 'glow':
      // Engine cores. Emissive strength is driven at runtime (see createSpaceship).
      return new THREE.MeshStandardMaterial({
        color: 0x0a1c33,
        emissive: color,
        emissiveIntensity: 0.1,
        roughness: 0.4,
        metalness: 0,
      });
    case 'metal':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.34,
        metalness: 0.82,
        envMapIntensity: 0.9,
      });
    case 'charcoal':
    case 'black':
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.42,
        metalness: 0.05,
        envMapIntensity: 0.7,
      });
    default:
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0,
        envMapIntensity: 0.6,
      });
  }
}

export function getBrickMaterial(colorName) {
  let material = cache.get(colorName);
  if (!material) {
    material = createMaterial(colorName);
    material.name = `brick-${colorName}`;
    cache.set(colorName, material);
  }
  return material;
}

export function disposeBrickMaterials() {
  for (const material of cache.values()) material.dispose();
  cache.clear();
}
