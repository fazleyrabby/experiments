import * as THREE from 'three';
import { NOISE_GLSL, SKY_GLSL, sharedUniforms } from './atmosphere.js';

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
${SKY_GLSL}
${NOISE_GLSL}
uniform float uSunDisc;
uniform float uCirrus;
varying vec3 vWorldPos;

void main() {
  vec3 dir = normalize(vWorldPos - cameraPosition);
  vec3 col = skyGradient(dir);
  float y = abs(dir.y);

  // Faint high-altitude cirrus streaks projected onto a flat layer.
  if (uCirrus > 0.0 && y > 0.02) {
    vec2 p = dir.xz / y * 0.45;
    float c = fbm(vec3(p.x * 0.6 + uTime * 0.003, p.y * 2.2, 3.7));
    c = smoothstep(0.52, 0.86, c);
    float fade = smoothstep(0.02, 0.18, y) * (1.0 - smoothstep(0.55, 0.95, y));
    col = mix(col, vec3(0.92, 0.95, 1.0) * uDaylight, c * fade * 0.26 * uCirrus);
  }

  float mu = dot(vec3(dir.x, y, dir.z), uSunDir);
  col += uSunColor * uSunDisc * 30.0 * smoothstep(0.99975, 0.9999, mu) * uDaylight;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export function createSkyMaterial({ sunDisc = 1, cirrus = 1 } = {}) {
  return new THREE.ShaderMaterial({
    name: 'SalarSky',
    uniforms: { ...sharedUniforms(), uSunDisc: { value: sunDisc }, uCirrus: { value: cirrus } },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
}

export function createSky() {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), createSkyMaterial());
  mesh.scale.setScalar(30000);
  mesh.frustumCulled = false;
  mesh.renderOrder = -100;
  mesh.name = 'sky';
  return mesh;
}

// Image-based lighting from the same sky. Because the dome is mirrored, the rider
// receives blue light from below as well — exactly what happens on the real salt flat.
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), createSkyMaterial({ sunDisc: 0, cirrus: 0 })));
  const target = pmrem.fromScene(envScene, 0.02, 0.1, 200);
  pmrem.dispose();
  return target.texture;
}
