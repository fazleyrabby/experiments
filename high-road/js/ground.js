import * as THREE from 'three';
import { HASH, NOISE2, ATMOS, CLOUD_SHADOW, HEADLIGHT, FIELD } from './glsl.js';
import { ROAD_GLSL, PERIOD } from './roadpath.js';

export const NEAR_RADIUS = 8000;

// Height of the plain near the road, in world space. Periodic in both axes so the
// camera can wrap without a seam.
export const NEAR_H_GLSL = /* glsl */ `
${ROAD_GLSL}
float nearH(vec2 p) {
  vec2 q = p / PERIOD;
  float rd = abs(p.x - roadX(p.y));
  float h = 4.0 * noiseP(q * 9.0, 9) + 1.4 * noiseP(q * 33.0 + 0.5, 33) + 0.35 * noiseP(q * 140.0, 140) + 0.08 * noiseP(q * 700.0, 700);
  float hn = noiseP(q * 3.0 + vec2(0.37, 0.11), 3) * 0.5 + 0.5;
  float hn2 = noiseP(q * 7.0 + vec2(0.2, 0.7), 7) * 0.5 + 0.5;
  float hills = pow(max(hn - 0.42, 0.0) / 0.58, 2.0) * 300.0 + pow(max(hn2 - 0.55, 0.0) / 0.45, 2.0) * 90.0;
  h += hills * smoothstep(150.0, 900.0, rd);
  return mix(-0.3, h, smoothstep(6.0, 34.0, rd));
}
`;

export function createGround(shared) {
  // Cubic spacing: ~6 m cells by the camera, ~70 m at the rim.
  const N = 400;
  const map = (t) => NEAR_RADIUS * (0.22 * t + 0.78 * t * t * t);
  const pos = new Float32Array(N * N * 3);
  let k = 0;
  for (let j = 0; j < N; j++) {
    const z = map((j / (N - 1)) * 2 - 1);
    for (let i = 0; i < N; i++) { pos[k++] = map((i / (N - 1)) * 2 - 1); pos[k++] = 0; pos[k++] = z; }
  }
  const idx = new Uint32Array((N - 1) * (N - 1) * 6);
  k = 0;
  for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
    const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const cellStep = NEAR_RADIUS * 0.22 * 2 / (N - 1);

  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      ${HASH}
      ${NOISE2}
      ${NEAR_H_GLSL}
      uniform vec3 uCamW;
      out vec3 vW;
      out vec3 vN;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        float d = length(w.xz - uCamW.xz);
        float fade = 1.0 - smoothstep(6500.0, 7800.0, d);
        float h = nearH(w.xz) * fade;
        float e = 0.8 + d * 0.004;
        float hx = (nearH(w.xz + vec2(e, 0.0)) - h / max(fade, 1e-3)) * fade;
        float hz = (nearH(w.xz + vec2(0.0, e)) - h / max(fade, 1e-3)) * fade;
        vN = normalize(vec3(-hx, e, -hz));
        w.y = h;
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${HASH}
      ${NOISE2}
      ${ATMOS}
      ${CLOUD_SHADOW}
      ${NEAR_H_GLSL}
      ${FIELD}
      ${HEADLIGHT}
      uniform vec3 uCamW;
      uniform vec3 uShadowStrip; // guardrail shadow: lateral offset, half-width, enabled
      in vec3 vW;
      in vec3 vN;
      out vec4 outColor;
      float fbmP(vec2 q, int per) { float s = 0.0, a = 0.5; int f = per; for (int i = 0; i < 3; i++) { s += a * noiseP(q * float(f), f); f *= 2; a *= 0.5; } return s; }
      void main() {
        vec2 p = vW.xz;
        vec3 V = vW - cameraPosition;
        float dist = length(V);
        vec3 vd = V / dist;
        vec3 n = normalize(vN);

        float rx = roadX(p.y);
        float u = p.x - rx;
        float rd = abs(u);
        vec2 q = p / PERIOD;
        float fw = dist * 0.0015; // rough metres per pixel
        // micro detail fades out once it would alias
        float m1 = noiseP(q * 4096.0, 4096) * (1.0 - smoothstep(0.15, 0.6, fw));
        float m2 = noiseP(q * 1024.0, 1024) * (1.0 - smoothstep(0.6, 2.5, fw));
        float m3 = noiseP(q * 256.0, 256) * (1.0 - smoothstep(3.0, 12.0, fw));
        float m4 = fbmP(q + 0.3, 48);
        float patchy = fbmP(q * 1.0 + 0.71, 160);

        // golden steppe grass with darker scrub and pale bare ground
        vec3 grass = mix(vec3(0.46, 0.27, 0.12), vec3(0.55, 0.34, 0.17), 0.5 + 0.5 * m4);
        grass = mix(grass, vec3(0.34, 0.22, 0.12), smoothstep(0.05, 0.45, patchy) * 0.55);
        grass = mix(grass, vec3(0.50, 0.40, 0.30), smoothstep(0.25, 0.6, -patchy) * 0.35);
        grass *= 0.86 + 0.14 * m3 + 0.12 * m2 + 0.10 * m1;
        // short stubble between the tufts
        float stub = noiseP(q * 16384.0 + 0.5, 16384) * (1.0 - smoothstep(0.02, 0.08, fw));
        grass *= 0.92 + 0.14 * stub;
        // patches: olive meadow in the hollows, pale alkali crust, rust-red soil, stony ground
        float mdw = meadow(p), alk = alkali(p), red = redSoil(p);
        vec3 olive = mix(vec3(0.27, 0.27, 0.11), vec3(0.36, 0.33, 0.14), 0.5 + 0.5 * m3);
        grass = mix(grass, olive * (0.85 + 0.15 * m2), mdw * 0.85);
        grass = mix(grass, vec3(0.60, 0.42, 0.26) * (0.9 + 0.1 * m2), red * 0.45 * (1.0 - mdw));
        grass = mix(grass, vec3(0.66, 0.62, 0.54) * (0.92 + 0.08 * m1), alk * 0.8 * (1.0 - mdw));
        float stones = smoothstep(0.62, 0.8, noiseP(q * 8192.0 + 0.37, 8192)) * (1.0 - smoothstep(0.08, 0.3, fw));
        grass = mix(grass, vec3(0.2, 0.19, 0.18), stones * (0.4 + 0.5 * alk));
        // dark scrub tufts
        float tuft = smoothstep(0.55, 0.8, noiseP(q * 2048.0 + 0.13, 2048)) * (1.0 - smoothstep(0.3, 1.2, fw));
        grass = mix(grass, grass * 0.55, tuft);
        // gravel shoulder and embankment
        vec3 gravel = mix(vec3(0.24, 0.21, 0.18), vec3(0.32, 0.28, 0.24), 0.5 + 0.5 * m1);
        gravel *= 0.8 + 0.15 * m2 + 0.25 * noiseP(q * 16384.0, 16384) * (1.0 - smoothstep(0.03, 0.12, fw));
        float sh = smoothstep(5.7, 6.9, rd + m2 * 0.5 + m3 * 0.4);
        vec3 alb = mix(gravel, grass, sh);

        float shadow = cloudShadow(vec3(p.x - uCamW.x, vW.y, p.y - uCamW.z));
        // guardrail shadow strip
        if (uShadowStrip.z > 0.5 && railAt(-p.y)) {
          float gd = abs(u - uShadowStrip.x);
          shadow *= mix(1.0, 0.35, (1.0 - smoothstep(uShadowStrip.y * 0.6, uShadowStrip.y, gd)) * (1.0 - smoothstep(30.0, 200.0, dist)));
        }
        float ndl = max(dot(n, uSunDir), 0.0);
        vec3 L = uSunColor * ndl * shadow;
        vec3 A = uSkyAmbient * (0.6 + 0.4 * n.y) + uGroundBounce * (0.5 - 0.5 * n.y);
        vec3 col = alb * (L + A + headlights(vW, n));
        col = aerial(col, dist, vd, cameraPosition.y, vW.y);
        outColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.userData.cellStep = cellStep;
  return mesh;
}
