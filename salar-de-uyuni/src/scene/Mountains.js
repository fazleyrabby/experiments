import * as THREE from 'three';
import { NOISE_GLSL, SKY_GLSL, sharedUniforms } from './atmosphere.js';
import { mulberry32, smoothstep } from '../utils/random.js';

const vertexShader = /* glsl */ `
attribute float aFrac;
varying vec3 vLocal;
varying vec3 vWorld;
varying float vFrac;
void main() {
  vLocal = position;
  vFrac = aFrac;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
${SKY_GLSL}
${NOISE_GLSL}
uniform float uHaze;
varying vec3 vLocal;
varying vec3 vWorld;
varying float vFrac;

void main() {
  vec3 dir = normalize(vWorld - cameraPosition);
  float n = fbm(vec3(vLocal.x * 0.0025, vLocal.y * 0.02, vLocal.z * 0.0025));
  vec3 rock = mix(vec3(0.045, 0.055, 0.075), vec3(0.12, 0.125, 0.14), n);
  rock *= 0.85 + 0.5 * smoothstep(0.45, 0.75, n);
  float h = clamp(uHaze + pow(1.0 - vFrac, 3.0) * 0.3, 0.0, 1.0);
  vec3 col = mix(rock * uDaylight, horizonHaze(dir), h);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function mountainRing({ radius, maxHeight, seed, haze, coverage, segments = 1024, rows = 6 }) {
  const rand = mulberry32(seed);
  const broad = Array.from({ length: 5 }, (_, k) => ({
    f: k + 1 + Math.floor(rand() * 2),
    p: rand() * Math.PI * 2,
    a: 1 / (k + 1),
  }));
  const detail = Array.from({ length: 7 }, (_, k) => ({
    f: Math.round(12 * Math.pow(1.9, k) * (0.8 + rand() * 0.4)),
    p: rand() * Math.PI * 2,
    a: Math.pow(0.55, k),
  }));

  const heights = new Float32Array(segments + 1);
  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2;
    let m = 0, ms = 0;
    for (const w of broad) { m += w.a * Math.sin(w.f * th + w.p); ms += w.a; }
    m = 0.5 + 0.5 * (m / ms);
    let d = 0, ds = 0;
    for (const w of detail) { d += w.a * (1 - Math.abs(Math.sin(w.f * th * 0.5 + w.p))); ds += w.a; }
    d /= ds;
    const t0 = 1 - coverage;
    const mask = smoothstep(t0, t0 + 0.22, m);
    heights[i] = mask > 0.001 ? maxHeight * Math.pow(mask, 0.7) * Math.pow(0.15 + 0.85 * d, 1.6) : -30;
  }

  const positions = [];
  const fracs = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const th = (i / segments) * Math.PI * 2;
    const h = heights[i];
    for (let j = 0; j <= rows; j++) {
      const f = j / rows;
      const y = -40 + (h + 40) * f;
      const r = radius - (1 - f) * Math.max(h, 0) * 2.5;
      positions.push(Math.cos(th) * r, y, Math.sin(th) * r);
      fracs.push(f);
    }
  }
  const stride = rows + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < rows; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aFrac', new THREE.Float32BufferAttribute(fracs, 1));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    name: 'SalarMountains',
    uniforms: { ...sharedUniforms(), uHaze: { value: haze } },
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

// Two hazy ranges on the horizon. The group follows the camera so they behave as if infinitely far.
export function createMountains() {
  const group = new THREE.Group();
  group.name = 'mountains';
  group.add(mountainRing({ radius: 14000, maxHeight: 560, seed: 4, haze: 0.5, coverage: 0.42 }));
  group.add(mountainRing({ radius: 8000, maxHeight: 170, seed: 19, haze: 0.36, coverage: 0.3 }));
  return group;
}
