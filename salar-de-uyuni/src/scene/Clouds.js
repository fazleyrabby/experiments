import * as THREE from 'three';
import { NOISE_GLSL, SKY_GLSL, sharedUniforms, atmosphere } from './atmosphere.js';
import { mulberry32 } from '../utils/random.js';

const TILE = 24000; // clouds wrap around the camera inside this square
const FADE_START = 9000;
const FADE_END = 11000;

const vertexShader = /* glsl */ `
attribute vec4 iCenter; // xyz, puff radius
attribute vec4 iParams; // cloud base y, cloud height, seed, density
uniform vec2 uCenter;
uniform vec2 uWind;
uniform float uTime;
uniform float uTile;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vRight;
varying vec3 vUp;
varying vec3 vToCam;
varying vec4 vParams;
varying float vFade;

void main() {
  vec3 c = iCenter.xyz;
  c.xz += uWind * uTime;
  vec2 rel = mod(c.xz - uCenter + 0.5 * uTile, uTile) - 0.5 * uTile;
  c.xz = uCenter + rel;
  vFade = 1.0 - smoothstep(${FADE_START.toFixed(1)}, ${FADE_END.toFixed(1)}, length(rel));

  // Billboard in world space so lighting stays correct in the mirrored reflection pass.
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  // Puffs are slightly wider than tall, like real cumulus towers seen from afar.
  vec3 wp = c + (right * position.x * 1.3 + up * position.y) * iCenter.w;

  vUv = position.xy;
  vWorld = wp;
  vRight = right;
  vUp = up;
  vToCam = normalize(cameraPosition - c);
  vParams = iParams;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

const fragmentShader = /* glsl */ `
${SKY_GLSL}
${NOISE_GLSL}
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vRight;
varying vec3 vUp;
varying vec3 vToCam;
varying vec4 vParams;
varying float vFade;

void main() {
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  float seed = vParams.z;
  float n = fbm4(vec3(vUv * 1.7 + seed * 13.1, seed * 7.0 + uTime * 0.012));
  float edge = 1.0 - sqrt(r2);
  float dens = smoothstep(0.02, 0.5, edge * 1.1 + (n - 0.5) * 0.8);

  // Flat cumulus base.
  float rel = (vWorld.y - vParams.x) / vParams.y;
  dens *= smoothstep(-0.02, 0.1, rel);

  float alpha = dens * vParams.w * vFade;
  if (alpha < 0.004) discard;

  float nz = sqrt(max(1.0 - r2, 0.0));
  vec3 N = normalize(vRight * vUv.x + vUp * vUv.y + vToCam * nz);
  float ndl = dot(N, uSunDir) * 0.5 + 0.5;
  float light = clamp(ndl * 0.45 + clamp(rel, 0.0, 1.0) * 0.55 + (n - 0.5) * 0.35, 0.0, 1.0);

  vec3 shade = vec3(0.50, 0.57, 0.70);
  vec3 lit = vec3(1.22, 1.20, 1.16);
  vec3 col = mix(shade, lit, smoothstep(0.1, 0.8, light));
  col += vec3(0.12) * pow(1.0 - nz, 3.0) * ndl;

  vec3 toFrag = vWorld - cameraPosition;
  float d = length(toFrag);
  float haze = 1.0 - exp(-d / 9000.0);
  col = mix(col * uDaylight, horizonHaze(toFrag / d), haze * 0.75);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

function generatePuffs(count, seed) {
  const rand = mulberry32(seed);
  const puffs = [];
  for (let c = 0; c < count; c++) {
    const ang = rand() * Math.PI * 2;
    const dist = 600 + Math.sqrt(rand()) * 10000;
    const cx = Math.cos(ang) * dist;
    const cz = Math.sin(ang) * dist;
    const width = 260 + rand() * rand() * 900;
    const height = width * (0.35 + rand() * 0.3);
    const base = 620 + rand() * 480;
    const orient = rand() * Math.PI;
    const elong = 1 + rand() * 1.2;
    const cs = Math.cos(orient);
    const sn = Math.sin(orient);
    const cloudSeed = rand() * 100;
    const n = Math.round(12 + width / 32);
    for (let p = 0; p < n; p++) {
      let u, v;
      do {
        u = rand() * 2 - 1;
        v = rand() * 2 - 1;
      } while (u * u + v * v > 1);
      const rn = Math.sqrt(u * u + v * v);
      const lx = u * width * 0.5 * elong;
      const lz = v * width * 0.5;
      const dome = height * (1 - rn * rn * 0.85);
      // Large overlapping puffs keep the silhouette continuous (no floating satellites).
      const r = width * (0.2 + rand() * 0.12) * (1 - rn * 0.35);
      puffs.push({
        x: cx + lx * cs - lz * sn,
        y: base + Math.pow(rand(), 0.7) * dome * 0.75,
        z: cz + lx * sn + lz * cs,
        r,
        base,
        height,
        seed: cloudSeed + p * 0.37,
        density: 0.85 + rand() * 0.15,
      });
    }
  }
  return puffs;
}

export class Clouds {
  constructor({ count = 220, seed = 1337 } = {}) {
    this.puffs = generatePuffs(count, seed);
    const n = this.puffs.length;

    const quad = new THREE.PlaneGeometry(2, 2);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = quad.index;
    geometry.setAttribute('position', quad.getAttribute('position'));
    this.centerAttr = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    this.paramAttr = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('iCenter', this.centerAttr);
    geometry.setAttribute('iParams', this.paramAttr);
    geometry.instanceCount = n;

    this.uniforms = {
      ...sharedUniforms(),
      uCenter: { value: new THREE.Vector2() },
      uWind: { value: new THREE.Vector2(2.2, 0.8) },
      uTile: { value: TILE },
    };
    const material = new THREE.ShaderMaterial({
      name: 'SalarClouds',
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.name = 'clouds';

    this.order = Array.from({ length: n }, (_, i) => i);
    this.dist = new Float32Array(n);
    this.sortTimer = 0;
    this.sort(new THREE.Vector3());
  }

  update(camera, dt) {
    this.uniforms.uCenter.value.set(camera.position.x, camera.position.z);
    this.sortTimer -= dt;
    if (this.sortTimer <= 0) {
      this.sortTimer = 0.35;
      this.sort(camera.position);
    }
  }

  // Back-to-front ordering so shaded puffs blend correctly over lit ones.
  sort(cam) {
    const t = atmosphere.uTime.value;
    const wind = this.uniforms.uWind.value;
    const wrap = (v) => ((((v + TILE / 2) % TILE) + TILE) % TILE) - TILE / 2;
    for (let i = 0; i < this.puffs.length; i++) {
      const p = this.puffs[i];
      const dx = wrap(p.x + wind.x * t - cam.x);
      const dz = wrap(p.z + wind.y * t - cam.z);
      const dy = p.y - cam.y;
      this.dist[i] = dx * dx + dy * dy + dz * dz;
    }
    this.order.sort((a, b) => this.dist[b] - this.dist[a]);
    const c = this.centerAttr.array;
    const q = this.paramAttr.array;
    this.order.forEach((idx, k) => {
      const p = this.puffs[idx];
      c.set([p.x, p.y, p.z, p.r], k * 4);
      q.set([p.base, p.height, p.seed, p.density], k * 4);
    });
    this.centerAttr.needsUpdate = true;
    this.paramAttr.needsUpdate = true;
  }
}
