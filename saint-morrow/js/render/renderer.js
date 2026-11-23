import * as THREE from 'three/webgpu';
import { ClusteredLighting } from 'three/addons/lighting/ClusteredLighting.js';

export const TIERS = {
  ultra: { name: 'ultra', width: 1600, maxLights: 512, ao: true, aoSamples: 16, taa: true, bloom: true, interiors: true },
  high: { name: 'high', width: 1360, maxLights: 320, ao: true, aoSamples: 10, taa: true, bloom: true, interiors: true },
  medium: { name: 'medium', width: 1120, maxLights: 128, ao: false, aoSamples: 0, taa: false, bloom: true, interiors: false },
};

export async function createRenderer(host, { tierName = 'ultra', forceWebGL = false, timing = false } = {}) {
  const renderer = new THREE.WebGPURenderer({
    antialias: false,
    forceWebGL,
    trackTimestamp: timing,
    powerPreference: 'high-performance',
  });
  await renderer.init();

  const isWebGPU = renderer.backend.isWebGPUBackend === true;
  const tier = isWebGPU ? (TIERS[tierName] ?? TIERS.ultra) : TIERS.medium;

  renderer.lighting = new ClusteredLighting(tier.maxLights, 32, 24, 48);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.info.autoReset = false;

  let renderScale = 1;
  const resize = () => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.width / width) * renderScale);
    renderer.setSize(width, height);
    return width / height;
  };
  resize();
  host.appendChild(renderer.domElement);

  const setScale = (scale) => {
    renderScale = scale;
    resize();
  };

  return { renderer, tier, isWebGPU, resize, setScale };
}
