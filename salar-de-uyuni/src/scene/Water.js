import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { SKY_GLSL, sharedUniforms } from './atmosphere.js';

const RIPPLE_COUNT = 48;
const RIPPLE_LIFE = 3.2;

const vertexShader = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vUvProj;
varying vec3 vWorldPos;
void main() {
  vUvProj = textureMatrix * vec4(position, 1.0);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
${SKY_GLSL}
uniform sampler2D tDiffuse;
uniform vec3 color;
uniform vec4 uRipples[${RIPPLE_COUNT}];
uniform vec3 uBikePos;
uniform vec2 uBikeDir;
uniform float uMirrorMin;
uniform float uDistort;
varying vec4 vUvProj;
varying vec3 vWorldPos;

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

// Distance to the nearest Voronoi edge: the polygonal salt crust under the water.
float saltCells(vec2 x) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  vec2 mg = vec2(0.0), mr = vec2(0.0);
  float md = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j));
    vec2 o = 0.5 + 0.4 * sin(6.2831 * hash22(n + g));
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  for (int j = -1; j <= 1; j++)
  for (int i = -1; i <= 1; i++) {
    vec2 g = mg + vec2(float(i), float(j));
    vec2 o = 0.5 + 0.4 * sin(6.2831 * hash22(n + g));
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr)));
  }
  return md;
}

void main() {
  vec3 toEye = cameraPosition - vWorldPos;
  float dist = length(toEye);
  vec3 V = toEye / dist;

  // Expanding ring ripples left by the tyres.
  vec2 grad = vec2(0.0);
  float rip = 0.0;
  vec2 pb = vWorldPos.xz - uBikePos.xz;
  if (dot(pb, pb) < 225.0) {
    for (int i = 0; i < ${RIPPLE_COUNT}; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (r.w <= 0.0 || age < 0.0 || age > ${RIPPLE_LIFE.toFixed(2)}) continue;
      vec2 dp = vWorldPos.xz - r.xy;
      float d = length(dp) + 1e-4;
      float radius = 0.04 + age * 0.30;
      float x = d - radius;
      float w = 0.035 + age * 0.06;
      float env = exp(-x * x / (w * w));
      if (env < 0.002) continue;
      float amp = r.w * exp(-age * 1.3) / (1.0 + radius * 3.0);
      float k = 6.2831853 / (0.06 + age * 0.025);
      float s = cos(x * k) * k * env * amp;
      grad += s * dp / d;
      rip += abs(s);
    }
  }
  vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));

  vec2 uv = vUvProj.xy / vUvProj.w + N.xz * uDistort;
  vec3 refl = texture2D(tDiffuse, uv).rgb;
  if (rip > 0.0) {
    // Tilted facets reflect a different part of the sky gradient.
    vec3 R0 = reflect(-V, vec3(0.0, 1.0, 0.0));
    vec3 R1 = reflect(-V, N);
    refl += (skyGradient(R1) - skyGradient(R0)) * 0.8;
  }

  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float F = mix(uMirrorMin, 1.0, pow(1.0 - cosT, 3.0));

  // Salt crust seen through a couple of centimetres of water.
  float saltFade = 1.0 - smoothstep(25.0, 70.0, dist);
  float edge = saltFade > 0.0 ? saltCells(vWorldPos.xz / 1.6) : 1.0;
  float ridge = 1.0 - smoothstep(0.0, 0.07, edge);
  vec3 albedo = vec3(0.80, 0.84, 0.88) * (1.0 + saltFade * (ridge * 0.12 - 0.03));
  vec3 ambient = vec3(0.30, 0.43, 0.66);
  vec3 lit = albedo * (uSunColor * uSunIntensity * max(uSunDir.y, 0.0) * 0.22 + ambient * 0.85) * uDaylight;

  // Soft shadow of bike and rider on the salt bed.
  vec2 sc = uBikePos.xz - uSunDir.xz / max(uSunDir.y, 0.2) * 0.75;
  vec2 q = vWorldPos.xz - sc;
  float along = dot(q, uBikeDir);
  float across = dot(q, vec2(-uBikeDir.y, uBikeDir.x));
  lit *= 1.0 - 0.45 * exp(-(along * along / 0.55 + across * across / 0.05));

  vec3 col = mix(lit * vec3(0.93, 0.97, 1.0), refl, F);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export class MirrorWater {
  constructor({ size = 40000 } = {}) {
    this.ripples = Array.from({ length: RIPPLE_COUNT }, () => new THREE.Vector4(0, 0, -1e4, 0));
    this.cursor = 0;

    const shader = {
      name: 'SalarMirror',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
      vertexShader,
      fragmentShader,
    };
    this.mesh = new Reflector(new THREE.PlaneGeometry(size, size), {
      textureWidth: 1024,
      textureHeight: 1024,
      clipBias: 0,
      multisample: 4,
      shader,
    });
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.name = 'water';

    // Reflector clones the shader uniforms; re-link the shared ones afterwards.
    Object.assign(this.mesh.material.uniforms, sharedUniforms(), {
      uRipples: { value: this.ripples },
      uBikePos: { value: new THREE.Vector3() },
      uBikeDir: { value: new THREE.Vector2(1, 0) },
      uMirrorMin: { value: 0.68 },
      uDistort: { value: 0.035 },
    });
  }

  setSize(width, height) {
    this.mesh.getRenderTarget().setSize(Math.max(64, width), Math.max(64, height));
  }

  follow(position) {
    this.mesh.position.set(position.x, 0, position.z);
  }

  setBike(position, forward) {
    const u = this.mesh.material.uniforms;
    u.uBikePos.value.copy(position);
    u.uBikeDir.value.set(forward.x, forward.z).normalize();
  }

  addRipple(x, z, time, amplitude) {
    this.ripples[this.cursor].set(x, z, time, amplitude);
    this.cursor = (this.cursor + 1) % RIPPLE_COUNT;
  }
}
