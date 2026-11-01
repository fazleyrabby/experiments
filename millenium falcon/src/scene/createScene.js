import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createRandom } from '../utils/random.js';
import { createEnvironment } from './createEnvironment.js';

/** Cap the pixel ratio: retina sharpness on desktop without melting phones. */
export function getPixelRatio() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
}

/**
 * Deep-space sky as an equirectangular canvas: a near-black base, a faint
 * dusty band across the sky and a few coloured nebula clouds, plus a dense
 * layer of tiny background stars. Blobs are painted three times (shifted by
 * the canvas width) so nothing breaks at the wrap-around seam.
 */
function createSky(lowPower) {
  const width = lowPower ? 2048 : 4096;
  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const random = createRandom(0x0b5c11);

  const base = context.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#010207');
  base.addColorStop(0.5, '#050815');
  base.addColorStop(1, '#010206');
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  const blob = (x, y, radius, color, alpha) => {
    for (const shift of [-width, 0, width]) {
      const gradient = context.createRadialGradient(x + shift, y, 0, x + shift, y, radius);
      gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
      gradient.addColorStop(0.45, `rgba(${color}, ${alpha * 0.45})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(x + shift - radius, y - radius, radius * 2, radius * 2);
    }
  };

  context.globalCompositeOperation = 'lighter';
  // A tilted band of faint dust, like the edge-on disc of a galaxy.
  for (let i = 0; i < 140; i++) {
    const u = random();
    const x = u * width;
    const y = height * (0.42 + 0.16 * Math.sin(u * Math.PI * 2 + 0.8)) + (random() - 0.5) * height * 0.08;
    blob(x, y, width * (0.02 + random() * 0.05), random() < 0.5 ? '70, 90, 150' : '120, 90, 140', 0.035);
  }
  // Coloured nebulae.
  const clouds = [
    [0.18, 0.3, 0.16, '90, 50, 160', 0.16],
    [0.24, 0.36, 0.09, '210, 80, 150', 0.08],
    [0.62, 0.62, 0.18, '30, 110, 170', 0.14],
    [0.7, 0.56, 0.08, '70, 200, 220', 0.07],
    [0.88, 0.28, 0.12, '170, 70, 70', 0.07],
    [0.43, 0.74, 0.12, '60, 60, 150', 0.1],
  ];
  for (const [u, v, size, color, alpha] of clouds) {
    for (let k = 0; k < 26; k++) {
      blob(
        (u + (random() - 0.5) * size * 0.9) * width,
        (v + (random() - 0.5) * size * 0.9) * height,
        width * size * (0.18 + random() * 0.35),
        color,
        alpha * (0.3 + random() * 0.7),
      );
    }
  }
  // Dust of faint stars (the bright ones are real points, see createStarfield).
  const stars = lowPower ? 5000 : 14000;
  for (let i = 0; i < stars; i++) {
    const x = random() * width;
    // Uniform on the sphere: denser toward the equator of the canvas.
    const y = (Math.acos(1 - 2 * random()) / Math.PI) * height;
    const level = Math.pow(random(), 3);
    const tint = random() < 0.2 ? '255, 220, 200' : random() < 0.4 ? '190, 210, 255' : '230, 235, 255';
    context.fillStyle = `rgba(${tint}, ${0.15 + 0.7 * level})`;
    const s = level > 0.8 ? 1.6 : 1;
    context.fillRect(x, y, s, s);
  }
  context.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Renderer + scene. The canvas is opaque (bloom needs a real framebuffer);
 * the sky is a procedural equirectangular texture and reflections come from
 * a procedural studio environment (no image assets).
 */
export function createScene(canvas, { lowPower = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(getPixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const sky = createSky(lowPower);
  scene.background = sky;
  scene.backgroundIntensity = 1;

  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.32;

  function dispose() {
    sky.dispose();
    environment.dispose();
    renderer.dispose();
  }

  return { renderer, scene, dispose };
}

/**
 * Post-processing chain: scene -> bloom (the engine arc, lamps and the
 * brightest sun glints) -> tone mapping and colour output. Bloom is skipped
 * on low-power devices, which render straight to screen.
 */
export function createComposer(renderer, scene, camera, { bloom = true } = {}) {
  if (!bloom) {
    return {
      render: () => renderer.render(scene, camera),
      setSize() {},
      setPixelRatio() {},
      dispose() {},
    };
  }

  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(size.clone(), 0.6, 0.5, 2.4);
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
    dispose() {
      composer.dispose();
      target.dispose();
    },
  };
}
