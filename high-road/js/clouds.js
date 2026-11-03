import * as THREE from 'three';
import { HASH, NOISE2, ATMOS } from './glsl.js';
import { fullscreenQuad } from './sky.js';

// Volumetric clouds, ray-marched at reduced resolution in the backdrop frame and
// accumulated over frames. Two kinds: a cumulus field that piles up against the range,
// and a smooth lenticular cap cloud parked over the big summit.

const VERT = /* glsl */ `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const NOISE_SIZE = 128;
export const SHADOW_RECT = { x0: -70000, z0: -70000, size: 140000 };

// Tileable Perlin-Worley (r) and Worley fBm at three frequencies (gba).
const NOISE3D = /* glsl */ `
precision highp float;
${HASH}
uniform float uSlice;
in vec2 vUv;
out vec4 outColor;
vec3 grad(ivec3 c, int per) { ivec3 w = c & (per - 1); return normalize(hash33(w) * 2.0 - 1.0); }
float perlin(vec3 p, int per) {
  vec3 fl = floor(p); ivec3 i = ivec3(fl); vec3 f = p - fl;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(grad(i, per), f);
  float n100 = dot(grad(i + ivec3(1, 0, 0), per), f - vec3(1, 0, 0));
  float n010 = dot(grad(i + ivec3(0, 1, 0), per), f - vec3(0, 1, 0));
  float n110 = dot(grad(i + ivec3(1, 1, 0), per), f - vec3(1, 1, 0));
  float n001 = dot(grad(i + ivec3(0, 0, 1), per), f - vec3(0, 0, 1));
  float n101 = dot(grad(i + ivec3(1, 0, 1), per), f - vec3(1, 0, 1));
  float n011 = dot(grad(i + ivec3(0, 1, 1), per), f - vec3(0, 1, 1));
  float n111 = dot(grad(i + ivec3(1, 1, 1), per), f - vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float worley(vec3 p, int per) {
  vec3 fl = floor(p); ivec3 i = ivec3(fl); vec3 f = p - fl;
  float d = 1e9;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    ivec3 o = ivec3(x, y, z);
    ivec3 c = (i + o) & (per - 1);
    vec3 r = vec3(o) + hash33(c) - f;
    d = min(d, dot(r, r));
  }
  return 1.0 - sqrt(d);
}
float remap(float v, float a, float b, float c, float d) { return c + (v - a) / (b - a) * (d - c); }
float wfbm(vec3 p, int f) { return worley(p * float(f), f) * 0.625 + worley(p * float(f * 2), f * 2) * 0.25 + worley(p * float(f * 4), f * 4) * 0.125; }
void main() {
  vec3 p = vec3(vUv, (uSlice + 0.5) / ${NOISE_SIZE.toFixed(1)});
  float pf = 0.0, a = 1.0, norm = 0.0;
  int f = 4;
  for (int o = 0; o < 5; o++) { pf += a * perlin(p * float(f), f); norm += a; a *= 0.5; f *= 2; }
  pf = pf / norm * 0.5 + 0.5;
  pf = clamp(remap(pf, 0.15, 0.85, 0.0, 1.0), 0.0, 1.0);
  float w1 = wfbm(p, 4), w2 = wfbm(p, 8), w3 = wfbm(p, 16);
  float pw = clamp(remap(pf, w1 - 1.0, 1.0, 0.0, 1.0), 0.0, 1.0);
  outColor = vec4(pw, w1, w2, w3);
}`;

// Weather map: cumulus coverage, cloud-top height, base jitter over a 140 km square.
const WEATHER = /* glsl */ `
precision highp float;
${HASH}
${NOISE2}
in vec2 vUv;
out vec4 outColor;
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.02 + 3.7; a *= 0.5; } return s; }
void main() {
  vec2 p = (vUv - 0.5) * 140000.0;
  float n = fbm(p / 7000.0);
  float n2 = fbm(p / 2600.0 + 9.0);
  // orographic band: cumulus bank up along the range, thickest under the cap
  vec2 m = (p - vec2(0.0, -13500.0)) / vec2(40000.0, 4500.0);
  float oro = exp(-dot(m, m));
  vec2 m2 = (p - vec2(-2500.0, -15000.0)) / vec2(16000.0, 3500.0);
  float oro2 = exp(-dot(m2, m2));
  float clump = smoothstep(-0.05, 0.4, n2 + 0.35 * n);
  float cov = 0.78 * oro * clump + 0.3 * oro2 * smoothstep(-0.3, 0.3, n2);
  // scattered fair-weather cumulus elsewhere, sparse overhead
  float scatter = smoothstep(0.1, 0.5, n * 0.8 + n2 * 0.5) * 0.62;
  float near = smoothstep(4000.0, 14000.0, length(p));
  cov = max(cov, scatter * near);
  float top = clamp(0.25 + 0.35 * oro + 0.25 * n2, 0.0, 1.0);
  outColor = vec4(clamp(cov, 0.0, 1.0), top, 0.5 + 0.5 * n2, 1.0);
}`;

export const DENSITY = /* glsl */ `
uniform highp sampler3D uNoise;
uniform sampler2D uWeather;
uniform vec2 uWind;
uniform float uCapFlow;
uniform float uCoverage;
const float SLAB_BOT = 2000.0;
const float SLAB_TOP = 6200.0;
float remap(float v, float a, float b, float c, float d) { return c + (v - a) / (b - a) * (d - c); }

float cumulus(vec3 p, bool detail) {
  vec4 wm = texture(uWeather, (p.xz - uWind * 0.25) / 140000.0 + 0.5);
  float cov = clamp(wm.r + uCoverage, 0.0, 1.0);
  if (cov < 0.02) return 0.0;
  float base = 2250.0 + 350.0 * (wm.b - 0.5);
  float top = mix(3100.0, 4700.0, wm.g);
  float hf = (p.y - base) / (top - base);
  if (hf <= 0.0 || hf >= 1.0) return 0.0;
  float prof = smoothstep(0.0, 0.1, hf) * smoothstep(1.0, 0.55, hf);
  vec3 q = (p - vec3(uWind.x, 0.0, uWind.y)) / 4300.0;
  vec4 n = texture(uNoise, q);
  float fb = n.g * 0.625 + n.b * 0.25 + n.a * 0.125;
  float shape = remap(n.r, fb - 1.0, 1.0, 0.0, 1.0);
  float d = remap(shape * prof, 1.0 - cov, 1.0, 0.0, 1.0);
  d = clamp(d, 0.0, 1.0) * cov;
  if (detail && d > 0.0) {
    vec4 dn = texture(uNoise, q * 5.3 + vec3(0.0, -0.1, 0.0) * hf);
    float df = dn.g * 0.625 + dn.b * 0.25 + dn.a * 0.125;
    float m = mix(df, 1.0 - df, clamp(hf * 3.0, 0.0, 1.0));
    d = clamp(remap(d, m * 0.45, 1.0, 0.0, 1.0), 0.0, 1.0);
  }
  return d;
}

// Lenticular cap: two or three smooth plates stacked over the summit, with long silky
// striations streaming through them while the cloud itself stays put.
float capPlate(vec3 p, vec3 c, vec2 R, float rLeft, float halfT, float lift) {
  vec2 d = p.xz - c.xz;
  vec2 e = vec2(d.x / (d.x < 0.0 ? rLeft : R.x), d.y / R.y);
  float r2 = dot(e, e);
  if (r2 >= 1.0) return 0.0;
  float k = 1.0 - r2;
  float yc = c.y + lift * k;
  float th = halfT * pow(k, 0.55);
  vec3 q = vec3((p.x - uCapFlow) / 21000.0, p.y / 2200.0, p.z / 7000.0);
  float n = texture(uNoise, q).g;
  float streak = texture(uNoise, vec3((p.x - uCapFlow * 1.4) / 40000.0, p.y / 700.0, p.z / 1500.0)).b;
  th *= 0.7 + 0.45 * n;
  float v = 1.0 - abs(p.y - yc) / max(th, 1.0);
  float dens = smoothstep(0.0, 0.22, v);
  dens *= 0.75 + 0.5 * streak;
  dens *= smoothstep(1.0, 0.7, sqrt(r2) + 0.18 * (n - 0.5));
  return dens;
}
float capCloud(vec3 p) {
  if (p.y < 4100.0 || p.y > 6200.0) return 0.0;
  float d = capPlate(p, vec3(-2600.0, 4500.0, -18500.0), vec2(7600.0, 4600.0), 11500.0, 210.0, 300.0);
  d = max(d, capPlate(p, vec3(-2000.0, 5050.0, -18800.0), vec2(5400.0, 3600.0), 7800.0, 110.0, 180.0) * 0.8);
  return d * 0.45;
}
`;

const MARCH = /* glsl */ `
precision highp float;
${HASH}
${NOISE2}
${ATMOS}
${DENSITY}
uniform sampler2D uDepth;
uniform sampler2D uHistory;
uniform mat4 uInvProjView;   // rotation-only view, inverse
uniform mat4 uPrevProjView;  // rotation-only, previous frame
uniform vec2 uCamNF;
uniform float uCamY;
uniform float uFrame;
uniform float uBlend;
uniform float uExt;
uniform float uBright;
uniform vec2 uRes;
in vec2 vUv;
out vec4 outColor;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

float lightOD(vec3 p) {
  float od = 0.0;
  float t = 0.0;
  float step = 140.0;
  for (int i = 0; i < 5; i++) {
    t += step;
    vec3 q = p + uSunDir * t;
    od += (cumulus(q, false) + capCloud(q) * 0.25) * step;
    step *= 1.9;
  }
  return od * uExt;
}

void main() {
  vec4 ndc = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec4 wp = uInvProjView * ndc;
  vec3 rd = normalize(wp.xyz / wp.w);
  float depth = texture(uDepth, vUv).r;
  float maxT = 140000.0;
  if (depth < 1.0) {
    float z = depth * 2.0 - 1.0;
    float n = uCamNF.x, f = uCamNF.y;
    float viewZ = 2.0 * n * f / (f + n - z * (f - n));
    // convert view depth to distance along this ray
    vec4 fwd = uInvProjView * vec4(0.0, 0.0, 1.0, 1.0);
    vec3 fd = normalize(fwd.xyz / fwd.w);
    maxT = viewZ / max(dot(rd, fd), 1e-3);
  }
  vec3 ro = vec3(0.0, uCamY, 0.0);
  vec3 col = vec3(0.0);
  float T = 1.0;
  float wsum = 0.0, dsum = 0.0;
  if (rd.y > 0.002) {
    float t0 = (SLAB_BOT - ro.y) / rd.y;
    float t1 = min((SLAB_TOP - ro.y) / rd.y, min(maxT, 140000.0));
    if (t1 > t0) {
      const int STEPS = 96;
      float dt = (t1 - t0) / float(STEPS);
      float jit = ign(gl_FragCoord.xy + 5.588238 * mod(uFrame, 64.0));
      float t = t0 + dt * jit;
      float mu = dot(rd, uSunDir);
      float ph1 = hgPhase(mu, 0.72), ph2 = hgPhase(mu, -0.25), phs = mix(ph2, ph1, 0.72);
      for (int i = 0; i < STEPS; i++) {
        vec3 p = ro + rd * t;
        float dc = capCloud(p);
        float d = cumulus(p, true) + dc;
        if (d > 0.003) {
          float sig = d * uExt;
          float od = lightOD(p);
          float hf = clamp((p.y - 2200.0) / 2600.0, 0.0, 1.0);
          // multiple-scattering approximation (three octaves)
          vec3 sun = vec3(0.0);
          float a = 1.0, b = 1.0, c = 1.0;
          for (int o = 0; o < 3; o++) {
            float ph = mix(hgPhase(mu, -0.25 * c), hgPhase(mu, 0.72 * c), 0.72);
            sun += a * exp(-od * b) * ph;
            a *= 0.5; b *= 0.45; c *= 0.5;
          }
          float powder = 1.0 - exp(-sig * 160.0);
          vec3 S = uSunColor * sun * mix(0.6, 1.0, powder) * uBright
                 + uSkyAmbient * mix(0.8, 1.5, hf) * 1.5 + uGroundBounce * (1.0 - hf) * 0.8;
          float tr = exp(-sig * dt);
          col += T * S * (1.0 - tr);
          dsum += T * (1.0 - tr) * t;
          wsum += T * (1.0 - tr);
          T *= tr;
          if (T < 0.01) break;
        }
        t += dt;
        if (t > t1) break;
      }
    }
  }
  // aerial perspective on the clouds themselves
  if (wsum > 0.0) {
    float dc = dsum / wsum;
    float h = ro.y + rd.y * dc;
    vec3 Tm = exp(-(BETA_R * odExp(ro.y, h, dc, H_R) + BETA_M * uHaze * odExp(ro.y, h, dc, H_M)));
    vec3 haze = skyLUT(normalize(vec3(rd.x, max(rd.y, 0.015), rd.z)));
    col = col * Tm + haze * (1.0 - Tm) * (1.0 - T);
  }
  vec4 cur = vec4(col, T);
  // temporal accumulation (camera only rotates in this frame)
  vec4 prev = uPrevProjView * vec4(rd, 0.0);
  vec2 puv = prev.xy / prev.w * 0.5 + 0.5;
  if (prev.w > 0.0 && all(greaterThan(puv, vec2(0.0))) && all(lessThan(puv, vec2(1.0))) && uBlend > 0.0) {
    vec4 h = texture(uHistory, puv);
    cur = mix(cur, h, uBlend);
  }
  outColor = cur;
}`;

const SHADOW = /* glsl */ `
precision highp float;
${HASH}
${NOISE2}
${DENSITY}
uniform float uExt;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 xz = vec2(${SHADOW_RECT.x0.toFixed(1)}, ${SHADOW_RECT.z0.toFixed(1)}) + vUv * ${SHADOW_RECT.size.toFixed(1)};
  float cu = 0.0, cap = 0.0;
  const int N = 18;
  float dy = (SLAB_TOP - SLAB_BOT) / float(N);
  for (int i = 0; i < N; i++) {
    vec3 p = vec3(xz.x, SLAB_BOT + (float(i) + 0.5) * dy, xz.y);
    cu += cumulus(p, false) * dy;
    cap += capCloud(p) * dy;
  }
  outColor = vec4(cu * uExt, cap * uExt, 0.0, 1.0);
}`;

export class Clouds {
  constructor(renderer, shared) {
    this.renderer = renderer;
    this.cam = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.quad = fullscreenQuad(null);
    this.scene.add(this.quad);

    this.noise = new THREE.WebGL3DRenderTarget(NOISE_SIZE, NOISE_SIZE, NOISE_SIZE, { depthBuffer: false });
    const nt = this.noise.texture;
    nt.format = THREE.RGBAFormat; nt.type = THREE.UnsignedByteType;
    nt.wrapS = nt.wrapT = nt.wrapR = THREE.RepeatWrapping;
    nt.minFilter = nt.magFilter = THREE.LinearFilter;
    nt.generateMipmaps = false;

    this.weather = new THREE.WebGLRenderTarget(512, 512, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.shadow = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

    this.uniforms = {
      uNoise: { value: nt }, uWeather: { value: this.weather.texture },
      uWind: { value: new THREE.Vector2() }, uCapFlow: { value: 0 }, uCoverage: { value: 0 },
      uExt: { value: 0.016 },
    };
    const mat = (frag, extra = {}) => new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: frag,
      uniforms: { ...shared, ...this.uniforms, ...extra }, depthTest: false, depthWrite: false,
    });
    this.noiseMat = mat(NOISE3D, { uSlice: { value: 0 } });
    this.weatherMat = mat(WEATHER);
    this.shadowMat = mat(SHADOW);
    this.marchMat = mat(MARCH, {
      uDepth: { value: null }, uHistory: { value: null },
      uInvProjView: { value: new THREE.Matrix4() }, uPrevProjView: { value: new THREE.Matrix4() },
      uCamNF: { value: new THREE.Vector2() }, uCamY: { value: 2 }, uFrame: { value: 0 },
      uBlend: { value: 0 }, uBright: { value: 5.0 }, uRes: { value: new THREE.Vector2() },
    });
    this.history = [null, null];
    this.frame = 0;
    this.prevPV = new THREE.Matrix4();
    this.hasHistory = false;
    this.shadowAge = 1e9;
  }

  draw(material, target, layer) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target, layer);
    this.renderer.render(this.scene, this.cam);
  }

  bake() {
    for (let z = 0; z < NOISE_SIZE; z++) {
      this.noiseMat.uniforms.uSlice.value = z;
      this.draw(this.noiseMat, this.noise, z);
    }
    this.draw(this.weatherMat, this.weather);
    this.renderer.setRenderTarget(null);
  }

  resize(w, h) {
    for (let i = 0; i < 2; i++) {
      this.history[i]?.dispose();
      this.history[i] = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
    this.marchMat.uniforms.uRes.value.set(w, h);
    this.hasHistory = false;
  }

  reset() { this.hasHistory = false; this.shadowAge = 1e9; }

  get texture() { return this.history[this.frame % 2].texture; }

  update(dt, t) {
    const u = this.uniforms;
    u.uWind.value.set(t * 4.0, t * 1.2);
    u.uCapFlow.value = t * 22.0;
    this.shadowAge += dt;
    if (this.shadowAge > 0.5) {
      this.shadowAge = 0;
      this.draw(this.shadowMat, this.shadow);
    }
  }

  // camera: the far-pass camera; depthTex: far-pass depth.
  render(camera, depthTex) {
    const m = this.marchMat.uniforms;
    const rot = new THREE.Matrix4().extractRotation(camera.matrixWorld);
    const viewRot = rot.clone().invert();
    const pv = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, viewRot);
    m.uInvProjView.value.copy(pv).invert();
    m.uPrevProjView.value.copy(this.hasHistory ? this.prevPV : pv);
    m.uCamNF.value.set(camera.near, camera.far);
    m.uCamY.value = camera.position.y;
    m.uDepth.value = depthTex;
    m.uFrame.value = this.frame;
    m.uBlend.value = this.hasHistory ? 0.9 : 0.0;
    const src = this.history[this.frame % 2];
    const dst = this.history[(this.frame + 1) % 2];
    m.uHistory.value = src.texture;
    this.draw(this.marchMat, dst);
    this.renderer.setRenderTarget(null);
    this.frame++;
    this.prevPV.copy(pv);
    this.hasHistory = true;
  }
}
