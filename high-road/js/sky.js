import * as THREE from 'three';
import { HASH, NOISE2, ATMOS } from './glsl.js';

// Lighting presets. Sun azimuth is measured from the direction of travel (-z), positive to the left.
export const LIGHTS = {
  day: { label: 'Day', elev: 38, azim: 32, exposure: 0.78, haze: 1.0, sunScale: 1.0, skyExposure: 1.25, coverage: 0.07, warm: 0.0 },
  golden: { label: 'Golden', elev: 5.5, azim: 48, exposure: 1.45, haze: 2.6, sunScale: 1.0, skyExposure: 1.0, coverage: 0.04, warm: 1.0 },
  night: { label: 'Night', elev: 17, azim: -24, exposure: 3.0, haze: 0.8, sunScale: 0.08, skyExposure: 0.06, coverage: 0.0, warm: 0.0, night: 1 },
};

const R_PLANET = 6371e3;
const R_ATMOS = 6471e3;
const BASE_ALT = 3600;
const BETA_R = [5.8e-6, 13.5e-6, 33.1e-6];
const BETA_M = 4e-6;

export function sunDirection(L) {
  const e = THREE.MathUtils.degToRad(L.elev);
  const a = THREE.MathUtils.degToRad(L.azim);
  // forward is -z, left is -x
  return new THREE.Vector3(-Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize();
}

// Sun radiance reaching the plateau, from the optical depth along the slant path.
export function sunColor(L, dir) {
  const e = Math.max(Math.asin(dir.y), 0.002);
  const deg = (e * 180) / Math.PI;
  const am = 1 / (Math.sin(e) + 0.50572 * Math.pow(deg + 6.07995, -1.6364)); // Kasten–Young air mass
  const rho = (H) => Math.exp(-BASE_ALT / H) * H * am;
  const odR = rho(8000), odM = rho(1400) * L.haze * 1.1;
  const E = 3.2 * L.sunScale;
  // moonlight reads cool to the eye
  const tint = L.night ? [0.82, 0.92, 1.12] : [1, 1, 1];
  return new THREE.Vector3(
    E * tint[0] * Math.exp(-(BETA_R[0] * odR + BETA_M * odM)),
    E * tint[1] * Math.exp(-(BETA_R[1] * odR + BETA_M * odM)),
    E * tint[2] * Math.exp(-(BETA_R[2] * odR + BETA_M * odM)),
  );
}

// Single-scattering sky, baked into a small LUT indexed by (azimuth from sun, elevation).
const LUT_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uSun;
uniform float uHazeK;
in vec2 vUv;
out vec4 outColor;
const float PI = 3.14159265;
vec2 rsi(vec3 r0, vec3 rd, float sr) {
  float a = dot(rd, rd), b = 2.0 * dot(rd, r0), c = dot(r0, r0) - sr * sr;
  float d = b * b - 4.0 * a * c;
  if (d < 0.0) return vec2(1e5, -1e5);
  return vec2((-b - sqrt(d)) / (2.0 * a), (-b + sqrt(d)) / (2.0 * a));
}
void main() {
  float az = vUv.x * PI;
  float v = vUv.y;
  float elev = v * v * 0.5 * PI;
  vec2 sh = normalize(uSun.xz + vec2(1e-5));
  float sa = atan(sh.y, sh.x);
  vec3 r = vec3(cos(elev) * cos(sa + az), sin(elev), cos(elev) * sin(sa + az));
  vec3 r0 = vec3(0.0, ${R_PLANET.toFixed(1)} + ${BASE_ALT.toFixed(1)}, 0.0);
  vec3 kR = vec3(5.5e-6, 13.0e-6, 22.4e-6);
  float kM = 21e-6 * uHazeK;
  float shR = 8e3, shM = 1.2e3, g = 0.758;
  vec2 p = rsi(r0, r, ${R_ATMOS.toFixed(1)});
  float pl = rsi(r0, r, ${R_PLANET.toFixed(1)}).x;
  if (pl > 0.0) p.y = min(p.y, pl);
  float iStep = (p.y - max(p.x, 0.0)) / 24.0;
  float iTime = 0.0, odR = 0.0, odM = 0.0;
  vec3 totR = vec3(0), totM = vec3(0);
  float mu = dot(r, uSun);
  float pR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float pM = 3.0 / (8.0 * PI) * ((1.0 - g * g) * (mu * mu + 1.0)) / (pow(1.0 + g * g - 2.0 * mu * g, 1.5) * (2.0 + g * g));
  for (int i = 0; i < 24; i++) {
    vec3 iPos = r0 + r * (iTime + iStep * 0.5);
    float h = length(iPos) - ${R_PLANET.toFixed(1)};
    float dR = exp(-h / shR) * iStep, dM = exp(-h / shM) * iStep;
    odR += dR; odM += dM;
    float jStep = rsi(iPos, uSun, ${R_ATMOS.toFixed(1)}).y / 8.0;
    float jTime = 0.0, jR = 0.0, jM = 0.0;
    for (int j = 0; j < 8; j++) {
      vec3 jPos = iPos + uSun * (jTime + jStep * 0.5);
      float jh = length(jPos) - ${R_PLANET.toFixed(1)};
      jR += exp(-jh / shR) * jStep; jM += exp(-jh / shM) * jStep;
      jTime += jStep;
    }
    vec3 att = exp(-(kM * (odM + jM) + kR * (odR + jR)));
    totR += dR * att; totM += dM * att;
    iTime += iStep;
  }
  vec3 c = 22.0 * (pR * kR * totR + pM * kM * totM);
  outColor = vec4(c * 0.42, 1.0);
}`;

const FS_VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export function fullscreenQuad(material) {
  const geo = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

export class SkyLUT {
  constructor(renderer) {
    this.renderer = renderer;
    this.target = new THREE.WebGLRenderTarget(192, 96, {
      type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, depthBuffer: false,
    });
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: FS_VERT, fragmentShader: LUT_FRAG,
      uniforms: { uSun: { value: new THREE.Vector3(0, 1, 0) }, uHazeK: { value: 1 } },
      depthTest: false, depthWrite: false,
    });
    this.scene = new THREE.Scene();
    this.scene.add(fullscreenQuad(this.material));
    this.camera = new THREE.Camera();
  }
  bake(sunDir, haze) {
    this.material.uniforms.uSun.value.copy(sunDir);
    this.material.uniforms.uHazeK.value = haze;
    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
  }
  get texture() { return this.target.texture; }
}

// Sky dome drawn first in the far pass: LUT sky, sun disc and a thin high cirrus veil.
export function createSkyDome(shared) {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...shared, uTime: { value: 0 }, uNight: { value: 0 } },
    vertexShader: /* glsl */ `
      out vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${HASH}
      ${NOISE2}
      ${ATMOS}
      uniform float uTime;
      uniform float uNight;
      in vec3 vDir;
      // star field: one candidate star per cell on two scales, brightness heavily skewed
      vec3 stars(vec3 d, float band) {
        vec3 acc = vec3(0.0);
        for (int k = 0; k < 2; k++) {
          float sc = k == 0 ? 180.0 : 420.0;
          vec3 p = d * sc;
          vec3 cc = floor(p);
          ivec3 ic = ivec3(cc) + ivec3(k * 977);
          vec3 h = hash33(ic);
          vec3 sp = cc + 0.25 + 0.5 * h;
          float dd = length(p - sp) * (220.0 / sc);
          float b = pow(hash13(ic + ivec3(17)), k == 0 ? 34.0 : 26.0 - band * 10.0);
          b *= k == 0 ? 60.0 : 10.0 * (1.0 + 2.5 * band);
          float tw = 0.75 + 0.25 * sin(uTime * (2.0 + h.x * 5.0) + h.y * 40.0);
          vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.82, 0.62), h.z);
          acc += tint * b * tw * exp(-dd * dd * 9.0);
        }
        return acc;
      }
      out vec4 outColor;
      float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = skyLUT(vec3(d.x, max(d.y, 0.0), d.z));
        float mu = dot(d, uSunDir);
        // sun disc with limb darkening
        float ang = acos(clamp(mu, -1.0, 1.0));
        if (uNight < 0.5) {
          float disc = 1.0 - smoothstep(0.0042, 0.0050, ang);
          float limb = sqrt(max(0.0, 1.0 - pow(ang / 0.0050, 2.0)));
          c += uSunColor * disc * (6.0 + 22.0 * limb);
        } else {
          // night: Milky Way, stars and a waxing gibbous moon
          float hz = smoothstep(0.0, 0.18, d.y);
          vec3 mwN = normalize(vec3(0.55, 0.42, -0.72));
          float lat = dot(d, mwN);
          vec2 mq = vec2(atan(d.z, d.x) * 3.0, lat * 9.0);
          float band = exp(-pow(lat / 0.2, 2.0));
          float cloud = 0.55 + 0.45 * noise(mq * 1.3) + 0.25 * noise(mq * 4.1);
          float dust = smoothstep(0.1, 0.55, noise(mq * vec2(2.2, 5.0) + 3.0) * 0.6 + noise(mq * 7.0) * 0.4) * exp(-pow(lat / 0.07, 2.0));
          vec3 mw = vec3(0.52, 0.55, 0.62) * band * cloud * (1.0 - 0.8 * dust) * 0.06;
          c += (mw + stars(d, band) * 0.012) * hz;
          // moon disc with dark maria and a lit limb facing the sun
          float mr = 0.0085;
          if (ang < mr * 1.05) {
            vec3 t1 = normalize(cross(uSunDir, vec3(0.0, 1.0, 0.0)));
            vec3 t2 = cross(t1, uSunDir);
            vec2 uv = vec2(dot(d - uSunDir, t1), dot(d - uSunDir, t2)) / mr;
            float rr = dot(uv, uv);
            vec3 sph = vec3(uv, sqrt(max(0.0, 1.0 - rr)));
            float lit = smoothstep(-0.15, 0.2, dot(sph, normalize(vec3(-0.55, 0.15, 0.8))));
            float maria = 0.72 + 0.28 * smoothstep(-0.2, 0.4, noise(uv * 2.2 + 4.0) + 0.5 * noise(uv * 6.0));
            float edge = 1.0 - smoothstep(0.92, 1.0, sqrt(rr));
            c = mix(c, vec3(0.95, 0.96, 1.0) * 1.6 * maria * (0.03 + lit), edge);
          }
          c += vec3(0.75, 0.82, 1.0) * 0.012 * exp(-ang * 40.0) + vec3(0.75, 0.82, 1.0) * 0.004 * exp(-ang * 6.0);
        }
        // cirrus veil at ~9 km
        if (d.y > 0.01) {
          vec2 p = d.xz / d.y * 9000.0;
          p += vec2(uTime * 6.0, uTime * 1.5);
          vec2 q = p * vec2(0.00011, 0.00035);
          q += 0.9 * vec2(fbm(p * 0.00008), fbm(p * 0.00008 + 4.0));
          float n = fbm(q * 1.4);
          float streak = fbm(vec2(q.x * 0.5, q.y * 6.0));
          float a = smoothstep(0.08, 0.55, n * 0.7 + streak * 0.45) * smoothstep(0.01, 0.2, d.y);
          a *= 0.55 * smoothstep(-0.35, 0.25, fbm(p * 0.000025 + 9.0));
          vec3 lit = uSunColor * (0.18 + 2.2 * hgPhase(mu, 0.6)) + uSkyAmbient * 0.6;
          c = mix(c, lit * 0.55, a * 0.28);
        }
        outColor = vec4(c, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}
