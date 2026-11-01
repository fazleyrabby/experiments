import * as THREE from 'three';

// High midday sun, slightly behind the default camera so rider and clouds are front-lit.
const SUN_ELEVATION = 58;
const SUN_AZIMUTH = 28; // degrees from +Z toward +X

export const SUN_DIRECTION = new THREE.Vector3()
  .setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - SUN_ELEVATION), THREE.MathUtils.degToRad(SUN_AZIMUTH))
  .normalize();

// Uniform objects shared by reference across every custom shader in the scene.
export const atmosphere = {
  uSunDir: { value: SUN_DIRECTION.clone() },
  uSunColor: { value: new THREE.Color(1.0, 0.955, 0.9) },
  uSunIntensity: { value: 3.0 },
  uDaylight: { value: 1.0 },
  uTime: { value: 0 },
};

export const NOISE_GLSL = /* glsl */ `
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
        mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
        mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
float fbm4(vec3 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.07 + vec3(4.3, 1.1, 7.7); a *= 0.5; }
  return s;
}
`;

// Sky radiance (linear). Mirrored about the horizon so the lower hemisphere is the
// reflection of the upper one — that is what makes the horizon seam disappear.
export const SKY_GLSL = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uDaylight;
uniform float uTime;

vec3 skyGradient(vec3 dir) {
  vec3 d = normalize(vec3(dir.x, abs(dir.y), dir.z));
  float y = d.y;
  vec3 zenith  = vec3(0.014, 0.078, 0.40);
  vec3 upper   = vec3(0.030, 0.170, 0.64);
  vec3 lower   = vec3(0.140, 0.360, 0.80);
  vec3 horizon = vec3(0.600, 0.730, 0.88);
  vec3 col = mix(upper, zenith, smoothstep(0.30, 1.0, y));
  col = mix(lower, col, smoothstep(0.0, 0.32, y));
  col = mix(horizon, col, smoothstep(0.0, 0.10, y));
  float mu = max(dot(d, uSunDir), 0.0);
  col += uSunColor * (0.06 * pow(mu, 5.0) + 0.22 * pow(mu, 48.0));
  col += vec3(0.80, 0.88, 1.0) * 0.12 * exp(-y * 70.0);
  return col * uDaylight;
}

vec3 horizonHaze(vec3 dir) {
  return skyGradient(vec3(dir.x, 0.012, dir.z));
}
`;

export function sharedUniforms() {
  return { ...atmosphere };
}
