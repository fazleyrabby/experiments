import * as THREE from 'three';
import { DEFAULT_FINISH, FINISHES, PALETTE_NAMES } from '../config.js';

// One shared material per palette name: plain glossy ABS plastic, like a real
// LEGO set. Only a faint sheen from the soft studio environment.

const cache = new Map();
let currentFinish = DEFAULT_FINISH;

const ABS = { metalness: 0, roughness: 0.3, clearcoat: 0, clearcoatRoughness: 0, envMapIntensity: 0.55 };
const plastic = (color) => ({ ...ABS, color });

/** Body and trim colours for every selectable finish (LEGO colour names). */
const FINISH_PARAMS = {
  red: { body: plastic(0xc91a09), trim: plastic(0xf2f3ee) },
  yellow: { body: plastic(0xf2cd37), trim: plastic(0x1d1f24) },
  white: { body: plastic(0xf2f3ee), trim: plastic(0xc91a09) },
  blue: { body: plastic(0x0055bf), trim: plastic(0xf2f3ee) },
  orange: { body: plastic(0xfe8a18), trim: plastic(0x1d1f24) },
};

function applyParams(material, params) {
  material.color.set(params.color);
  material.metalness = params.metalness;
  material.roughness = params.roughness;
  material.clearcoat = params.clearcoat ?? 0;
  material.clearcoatRoughness = params.clearcoatRoughness ?? 0;
  material.envMapIntensity = params.envMapIntensity ?? 1;
  material.needsUpdate = true;
}

function createMaterial(name) {
  switch (name) {
    case 'body': {
      const material = new THREE.MeshPhysicalMaterial();
      applyParams(material, FINISH_PARAMS[currentFinish].body);
      return material;
    }
    case 'trim': {
      const material = new THREE.MeshPhysicalMaterial();
      applyParams(material, FINISH_PARAMS[currentFinish].trim);
      return material;
    }
    case 'chrome': // light-grey plastic: wheels, trim, mirrors
      return new THREE.MeshStandardMaterial({ color: 0xb9bec8, metalness: 0, roughness: 0.28, envMapIntensity: 0.6 });
    case 'dark': // dark bluish grey
      return new THREE.MeshStandardMaterial({ color: 0x3b3f48, metalness: 0, roughness: 0.34, envMapIntensity: 0.5 });
    case 'gold': // pearl gold
      return new THREE.MeshStandardMaterial({ color: 0xd8a526, metalness: 0.15, roughness: 0.32, envMapIntensity: 0.6 });
    case 'rubber':
      return new THREE.MeshStandardMaterial({ color: 0x1a1b1e, metalness: 0, roughness: 0.75, envMapIntensity: 0.25 });
    case 'glass': // transparent light blue
      return new THREE.MeshPhysicalMaterial({
        color: 0x8fd0ee,
        transparent: true,
        opacity: 0.45,
        roughness: 0.12,
        metalness: 0,
        envMapIntensity: 0.8,
        depthWrite: false,
      });
    case 'leather':
      return new THREE.MeshStandardMaterial({ color: 0xc19a6b, metalness: 0, roughness: 0.5, envMapIntensity: 0.4 });
    case 'plastic':
      return new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0, roughness: 0.38, envMapIntensity: 0.45 });
    case 'caliper':
      return new THREE.MeshStandardMaterial({ color: 0xc91a09, metalness: 0, roughness: 0.3, envMapIntensity: 0.5 });
    case 'glowRed':
      return new THREE.MeshStandardMaterial({
        color: 0x2a0306,
        emissive: 0xff1c10,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0,
      });
    case 'glowAmber':
      return new THREE.MeshStandardMaterial({
        color: 0x2a1604,
        emissive: 0xff9a1a,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0,
      });
    case 'glowWhite':
      return new THREE.MeshStandardMaterial({
        color: 0x2a2822,
        emissive: 0xfff0d8,
        emissiveIntensity: 0.65,
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
    if (name === 'glass') material.userData.translucent = true;
    cache.set(name, material);
  }
  return material;
}

/** Repaint the body and trim materials in place. Every brick updates at once. */
export function setFinish(finish) {
  if (!FINISH_PARAMS[finish] || !FINISHES[finish]) return currentFinish;
  currentFinish = finish;
  const body = cache.get('body');
  const trim = cache.get('trim');
  if (body) applyParams(body, FINISH_PARAMS[finish].body);
  if (trim) applyParams(trim, FINISH_PARAMS[finish].trim);
  return currentFinish;
}

export function getFinish() {
  return currentFinish;
}

/** Drive the lamp materials: 0 = lenses cold, 1 = lit. */
export function setLampPower(power) {
  const levels = { glowRed: 0.4 + 1.5 * power, glowAmber: 0.4 + 1.1 * power, glowWhite: 0.5 + 1.3 * power };
  for (const [name, intensity] of Object.entries(levels)) {
    const material = cache.get(name);
    if (material) material.emissiveIntensity = intensity;
  }
}

export function disposeBrickMaterials() {
  for (const material of cache.values()) material.dispose();
  cache.clear();
}
