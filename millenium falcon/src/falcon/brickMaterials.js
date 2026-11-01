import * as THREE from 'three';
import { PALETTE_NAMES } from '../config.js';

// One shared material per palette name: plain glossy ABS plastic, like a real
// LEGO set, with a faint sheen from the environment. Emissive parts (engine,
// lamps) are driven at runtime through setPower().

const cache = new Map();

const plastic = (color, roughness = 0.44, envMapIntensity = 0.6) =>
  new THREE.MeshStandardMaterial({ color, metalness: 0, roughness, envMapIntensity });

function createMaterial(name) {
  switch (name) {
    case 'hull': // light bluish grey
      return plastic(0xa3a8ad);
    case 'hullLight': // white, slightly dulled by space grime
      return plastic(0xd7d8d2);
    case 'hullDark': // a step darker for panel variation
      return plastic(0x8b9095);
    case 'dark': // dark bluish grey
      return plastic(0x4f535a, 0.4, 0.45);
    case 'black':
      return plastic(0x16171a, 0.45, 0.4);
    case 'red': // dark red
      return plastic(0x8c1a1a, 0.36, 0.5);
    case 'tan': // dark tan
      return plastic(0x9b8a68, 0.4, 0.45);
    case 'metal': // pearl dark grey
      return new THREE.MeshStandardMaterial({ color: 0x6b6e73, metalness: 0.55, roughness: 0.32, envMapIntensity: 0.9 });
    case 'glass': // trans-black smoke
      return new THREE.MeshPhysicalMaterial({
        color: 0x2a3644,
        transparent: true,
        opacity: 0.6,
        roughness: 0.18,
        metalness: 0,
        clearcoat: 0.25,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.2,
        depthWrite: false,
      });
    case 'engine':
      return new THREE.MeshStandardMaterial({
        color: 0x0c2233,
        emissive: 0x3aa8ff,
        emissiveIntensity: 0.25,
        roughness: 0.3,
        metalness: 0,
      });
    case 'glowRed':
      return new THREE.MeshStandardMaterial({
        color: 0x2a0306,
        emissive: 0xff2414,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0,
      });
    case 'glowWhite':
      return new THREE.MeshStandardMaterial({
        color: 0x2a2822,
        emissive: 0xf4f6ff,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0,
      });
    default:
      throw new Error(`Unknown brick colour "${name}"`);
  }
}

export function getBrickMaterial(name) {
  if (!PALETTE_NAMES.includes(name)) throw new Error(`Unknown brick colour "${name}"`);
  let material = cache.get(name);
  if (!material) {
    material = createMaterial(name);
    material.name = `brick-${name}`;
    cache.set(name, material);
  }
  return material;
}

/**
 * Drive the emissive materials.
 * @param {number} engine  0 = cold, 1 = sublights running (values above 1 flare)
 * @param {number} lamps   0 = dark, 1 = lit
 * @param {number} blink   0..1 strobe level for the red beacons
 */
export function setPower(engine, lamps, blink) {
  const set = (name, intensity) => {
    const material = cache.get(name);
    if (material) material.emissiveIntensity = intensity;
  };
  set('engine', 0.3 + 7 * engine);
  set('glowWhite', 0.4 + 1.6 * lamps);
  set('glowRed', 0.3 + (0.6 + 2.2 * blink) * lamps);
}

export function disposeBrickMaterials() {
  for (const material of cache.values()) material.dispose();
  cache.clear();
}
