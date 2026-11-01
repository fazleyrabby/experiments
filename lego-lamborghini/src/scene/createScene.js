import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createEnvironment } from './createEnvironment.js';

/** Cap the pixel ratio: retina sharpness on desktop without melting phones. */
export function getPixelRatio() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
}

/** Dark studio backdrop: a soft pool of blue-grey light behind the car. */
function createBackdrop() {
  const width = 8;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#04060b');
  gradient.addColorStop(0.42, '#0d1626');
  gradient.addColorStop(0.62, '#0a111d');
  gradient.addColorStop(1, '#020307');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Renderer + scene. The canvas is opaque (bloom needs a real framebuffer);
 * the backdrop is a scene texture and all reflections come from the
 * procedural studio environment (no image assets).
 */
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(getPixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const backdrop = createBackdrop();
  scene.background = backdrop;

  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.9;

  function dispose() {
    backdrop.dispose();
    environment.dispose();
    renderer.dispose();
  }

  return { renderer, scene, dispose };
}

/**
 * Post-processing chain: scene -> subtle bloom (only lamps and the hottest
 * specular glints cross the threshold) -> tone mapping and colour output.
 * Bloom is skipped on low-power devices, which render straight to screen.
 */
export function createComposer(renderer, scene, camera, { bloom = true } = {}) {
  if (!bloom) {
    return {
      render: () => renderer.render(scene, camera),
      setSize() {},
      setPixelRatio() {},
      setBloomStrength() {},
      dispose() {},
    };
  }

  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(size.clone(), 0.3, 0.5, 2.6);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  return {
    render: () => composer.render(),
    setSize(width, height) {
      composer.setSize(width, height);
    },
    setPixelRatio(ratio) {
      composer.setPixelRatio(ratio);
    },
    setBloomStrength(strength) {
      bloomPass.strength = strength;
    },
    dispose() {
      composer.dispose();
      target.dispose();
    },
  };
}
