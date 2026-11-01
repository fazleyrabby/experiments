import * as THREE from 'three';
import { createRandom, randomUnitVector } from '../utils/random.js';

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio;
    vColor = aColor;
    vAlpha = 0.62 + 0.38 * sin(uTime * 0.7 + aPhase);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5);
    float falloff = smoothstep(0.5, 0.0, distanceToCenter);
    gl_FragColor = vec4(vColor, falloff * falloff * vAlpha);
  }
`;

/** A restrained shell of soft, slowly twinkling stars. */
export function createStarfield(scene, { count = 1300, radius = 420, pixelRatio = 1 } = {}) {
  const random = createRandom(0x57a125);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const [x, y, z] = randomUnitVector(random);
    const distance = radius * (0.72 + 0.28 * random());
    positions.set([x * distance, y * distance, z * distance], i * 3);

    // Mostly cool white, a few warmer and bluer stars.
    const tint = random();
    if (tint < 0.12) color.setRGB(1.0, 0.86, 0.72);
    else if (tint < 0.4) color.setRGB(0.7, 0.84, 1.0);
    else color.setRGB(0.9, 0.94, 1.0);
    const brightness = 0.35 + 0.65 * Math.pow(random(), 2.2);
    colors.set([color.r * brightness, color.g * brightness, color.b * brightness], i * 3);

    sizes[i] = 1.1 + Math.pow(random(), 4) * 3.4;
    phases[i] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'starfield';
  points.frustumCulled = false;
  points.renderOrder = -10;
  scene.add(points);

  return {
    points,
    update(dt, time) {
      material.uniforms.uTime.value = time;
      points.rotation.y += dt * 0.004;
    },
    setPixelRatio(value) {
      material.uniforms.uPixelRatio.value = value;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}
