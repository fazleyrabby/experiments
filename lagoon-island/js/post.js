import * as THREE from 'three';

const FS_VERT = 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const AO_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tDepth;
uniform mat4 uInvP;
uniform vec2 uTexel;
uniform float uFrame, uProj, uFadeZ;
vec3 vp(vec2 uv) {
  float d = texture2D(tDepth, uv).r;
  vec4 c = uInvP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return c.xyz / c.w;
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  float d = texture2D(tDepth, vUv).r;
  if (d >= 0.99995) { gl_FragColor = vec4(1.0); return; }
  vec3 P = vp(vUv);
  vec3 l = P - vp(vUv - vec2(uTexel.x, 0.0)), r = vp(vUv + vec2(uTexel.x, 0.0)) - P;
  vec3 b = P - vp(vUv - vec2(0.0, uTexel.y)), t = vp(vUv + vec2(0.0, uTexel.y)) - P;
  vec3 dx = abs(l.z) < abs(r.z) ? l : r;
  vec3 dy = abs(b.z) < abs(t.z) ? b : t;
  vec3 N = normalize(cross(dx, dy));
  float radius = 0.52;
  float sr = radius * uProj / max(-P.z, 0.1);
  float a0 = ign(gl_FragCoord.xy + mod(uFrame, 16.0) * 5.588238) * 6.28318;
  float occ = 0.0;
  const int S = 11;
  for (int i = 0; i < S; i++) {
    float fi = (float(i) + 0.5) / float(S);
    float a = a0 + float(i) * 2.39996;
    vec2 o = vec2(cos(a), sin(a)) * sr * sqrt(fi);
    vec3 v = vp(vUv + o) - P;
    float vv = dot(v, v);
    float vn = dot(v, N) - 0.012;
    float f = max(radius * radius - vv, 0.0);
    occ += f * f * f * max(vn / (0.008 + vv), 0.0);
  }
  float norm = pow(radius, 6.0);
  float ao = clamp(1.0 - 3.4 * occ / (norm * float(S)), 0.0, 1.0);
  ao = mix(ao, 1.0, smoothstep(uFadeZ + 16.0, uFadeZ + 28.0, -P.z));
  gl_FragColor = vec4(vec3(ao), 1.0);
}
`;

const AO_BLUR = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tAO, tDepth;
uniform vec2 uTexel;
uniform mat4 uInvP;
float lz(vec2 uv) {
  float d = texture2D(tDepth, uv).r;
  vec4 c = uInvP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return c.z / c.w;
}
void main() {
  float z = lz(vUv), sum = 0.0, w = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 uv = vUv + vec2(float(x), float(y)) * uTexel * 1.5;
    float k = exp(-abs(lz(uv) - z) * 8.0) * exp(-float(x * x + y * y) * 0.3);
    sum += texture2D(tAO, uv).r * k;
    w += k;
  }
  gl_FragColor = vec4(vec3(sum / max(w, 1e-4)), 1.0);
}
`;

const VOL_FRAG = /* glsl */ `
#include <packing>
varying vec2 vUv;
uniform sampler2D tDepth, tShadow, tNoise;
uniform mat4 uInvVP, uShadowM;
uniform vec3 uCam, uLight, uLightCol;
uniform float uR, uTime, uDensity, uFrame, uLightI, uHasShadow, uTop;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  float d = texture2D(tDepth, vUv).r;
  vec4 w = uInvVP * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  w /= w.w;
  vec3 ro = uCam, rv = w.xyz - ro;
  float sceneT = length(rv);
  vec3 rd = rv / sceneT;
  float a = dot(rd.xz, rd.xz), b = dot(ro.xz, rd.xz), c = dot(ro.xz, ro.xz) - uR * uR, disc = b * b - a * c;
  if (disc <= 0.0 || a < 1e-5) { gl_FragColor = vec4(0.0); return; }
  disc = sqrt(disc);
  float t0 = (-b - disc) / a, t1 = (-b + disc) / a;
  float y0 = (0.0 - ro.y) / rd.y, y1 = (uTop - ro.y) / rd.y;
  if (y0 > y1) { float s = y0; y0 = y1; y1 = s; }
  t0 = max(max(t0, y0), 0.0);
  t1 = min(min(t1, y1), sceneT);
  if (t1 <= t0) { gl_FragColor = vec4(0.0); return; }
  const int STEPS = 12;
  float dt = (t1 - t0) / float(STEPS);
  float jit = ign(gl_FragCoord.xy + mod(uFrame, 32.0) * 5.588238);
  float mu = dot(rd, uLight), g = 0.68;
  float phase = (1.0 - g * g) / (12.566 * pow(1.0 + g * g - 2.0 * g * mu, 1.5)) + 0.06;
  float sum = 0.0, amb = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + jit) * dt);
    float n = texture2D(tNoise, p.xz * 0.04 + vec2(uTime * 0.006, -uTime * 0.004) + p.y * 0.03).r;
    float n2 = texture2D(tNoise, p.xz * 0.13 - vec2(uTime * 0.009, uTime * 0.003)).b;
    float density = exp(-p.y * 0.62) * smoothstep(0.26, 0.74, n * 0.68 + n2 * 0.32) * 1.5 + 0.1;
    density *= (1.0 - smoothstep(uR * 0.6, uR * 0.97, length(p.xz))) * (1.0 - smoothstep(1.2, uTop, p.y));
    float vis = 1.0;
    if (uHasShadow > 0.5) {
      vec4 sc = uShadowM * vec4(p, 1.0);
      vec3 q = sc.xyz / sc.w;
      if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) vis = step(q.z - 0.002, unpackRGBAToDepth(texture2D(tShadow, q.xy)));
    }
    sum += density * vis * dt;
    amb += density * dt;
  }
  vec3 col = uLightCol * uLightI * phase * sum * uDensity + uLightCol * amb * uDensity * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`;

const BASE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tScene, tAO;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  float ao = texture2D(tAO, vUv).r;
  gl_FragColor = vec4(c * mix(0.22, 1.0, ao), 1.0);
}
`;

const COPY_FRAG = 'varying vec2 vUv; uniform sampler2D t; void main(){ gl_FragColor = texture2D(t, vUv); }';

const TAA_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tCur, tHist, tDepth;
uniform mat4 uInvVP, uPrevVP;
uniform vec2 uCurTexel, uHistTexel, uJit;
uniform float uReset;
vec3 toY(vec3 c) { return vec3(dot(c, vec3(0.25, 0.5, 0.25)), dot(c, vec3(0.5, 0.0, -0.5)), dot(c, vec3(-0.25, 0.5, -0.25))); }
vec3 fromY(vec3 c) { return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z); }
vec3 comp(vec3 c) { return c / (1.0 + max(c.r, max(c.g, c.b))); }
vec3 decomp(vec3 c) { return c / max(1e-4, 1.0 - max(c.r, max(c.g, c.b))); }
vec3 catmull(sampler2D tex, vec2 uv, vec2 texel) {
  vec2 pos = uv / texel;
  vec2 c = floor(pos - 0.5) + 0.5;
  vec2 f = pos - c;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 o12 = w2 / w12;
  vec2 p0 = (c - 1.0) * texel, p3 = (c + 2.0) * texel, p12 = (c + o12) * texel;
  vec3 r = texture2D(tex, vec2(p12.x, p0.y)).rgb * w12.x * w0.y
    + texture2D(tex, vec2(p0.x, p12.y)).rgb * w0.x * w12.y
    + texture2D(tex, p12).rgb * w12.x * w12.y
    + texture2D(tex, vec2(p3.x, p12.y)).rgb * w3.x * w12.y
    + texture2D(tex, vec2(p12.x, p3.y)).rgb * w12.x * w3.y;
  float wt = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return r / max(wt, 1e-4);
}
vec3 clipBox(vec3 lo, vec3 hi, vec3 h) {
  vec3 c = 0.5 * (hi + lo), e = 0.5 * (hi - lo) + 1e-4, v = h - c;
  vec3 a = abs(v / e);
  float m = max(a.x, max(a.y, a.z));
  return m > 1.0 ? c + v / m : h;
}
void main() {
  vec2 uv = vUv + uJit;
  vec3 cur = toY(comp(max(texture2D(tCur, uv).rgb, 0.0)));
  if (uReset > 0.5) { gl_FragColor = vec4(decomp(fromY(cur)), 1.0); return; }
  vec3 m1 = vec3(0.0), m2 = vec3(0.0);
  float best = 1.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 o = vec2(float(x), float(y)) * uCurTexel;
    vec3 s = toY(comp(max(texture2D(tCur, uv + o).rgb, 0.0)));
    m1 += s;
    m2 += s * s;
    best = min(best, texture2D(tDepth, vUv + o).r);
  }
  vec3 mu = m1 / 9.0, sig = sqrt(max(m2 / 9.0 - mu * mu, 0.0));
  vec3 lo = mu - 1.18 * sig, hi = mu + 1.18 * sig;
  vec4 w = uInvVP * vec4(vUv * 2.0 - 1.0, best * 2.0 - 1.0, 1.0);
  w /= w.w;
  vec4 pc = uPrevVP * w;
  vec2 puv = pc.xy / pc.w * 0.5 + 0.5;
  if (puv.x < 0.0 || puv.x > 1.0 || puv.y < 0.0 || puv.y > 1.0) { gl_FragColor = vec4(decomp(fromY(cur)), 1.0); return; }
  vec3 h = clipBox(lo, hi, toY(comp(max(catmull(tHist, puv, uHistTexel), 0.0))));
  float motion = length((puv - vUv) / uHistTexel);
  float keep = mix(0.925, 0.82, clamp(motion / 10.0, 0.0, 1.0));
  gl_FragColor = vec4(max(decomp(fromY(mix(cur, h, keep))), 0.0), 1.0);
}
`;

const DOWN_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D t;
uniform vec2 uTexel;
uniform float uThreshold;
vec3 s(vec2 o) { return texture2D(t, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = s(vec2(0.0)) * 0.125;
  c += (s(vec2(-2, -2)) + s(vec2(2, -2)) + s(vec2(-2, 2)) + s(vec2(2, 2))) * 0.03125;
  c += (s(vec2(-2, 0)) + s(vec2(2, 0)) + s(vec2(0, -2)) + s(vec2(0, 2))) * 0.0625;
  c += (s(vec2(-1, -1)) + s(vec2(1, -1)) + s(vec2(-1, 1)) + s(vec2(1, 1))) * 0.125;
  if (uThreshold > 0.0) {
    c = min(c, vec3(24.0));
    float l = max(c.r, max(c.g, c.b));
    float k = smoothstep(uThreshold * 0.55, uThreshold * 1.45, l);
    c *= k;
  }
  gl_FragColor = vec4(c, 1.0);
}
`;

const UP_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D t, tAdd;
uniform vec2 uTexel;
uniform float uMix;
void main() {
  vec3 c = texture2D(t, vUv).rgb * 4.0;
  c += (texture2D(t, vUv + vec2(uTexel.x, 0.0)).rgb + texture2D(t, vUv - vec2(uTexel.x, 0.0)).rgb
      + texture2D(t, vUv + vec2(0.0, uTexel.y)).rgb + texture2D(t, vUv - vec2(0.0, uTexel.y)).rgb) * 2.0;
  c += texture2D(t, vUv + uTexel).rgb + texture2D(t, vUv - uTexel).rgb
     + texture2D(t, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture2D(t, vUv + vec2(-uTexel.x, uTexel.y)).rgb;
  gl_FragColor = vec4(texture2D(tAdd, vUv).rgb + c / 16.0 * uMix, 1.0);
}
`;

const FINAL_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tColor, tBloom;
uniform vec2 uTexel;
uniform float uExposure, uTime, uWarm, uNight;
vec3 aces(vec3 v) {
  const mat3 inM = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 outM = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  v = inM * v;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return clamp(outM * (a / b), 0.0, 1.0);
}
vec3 lift(vec3 c) { return aces(c * uExposure * 1.5); }
void main() {
  vec3 c0 = texture2D(tColor, vUv).rgb;
  vec3 bloom = texture2D(tBloom, vUv).rgb;
  vec3 c = lift(c0 + bloom * 0.075);
  vec3 n = lift(texture2D(tColor, vUv + vec2(0.0, uTexel.y)).rgb);
  vec3 s = lift(texture2D(tColor, vUv - vec2(0.0, uTexel.y)).rgb);
  vec3 e = lift(texture2D(tColor, vUv + vec2(uTexel.x, 0.0)).rgb);
  vec3 w = lift(texture2D(tColor, vUv - vec2(uTexel.x, 0.0)).rgb);
  vec3 mn = min(c, min(n, min(s, min(e, w))));
  vec3 mx = max(c, max(n, max(s, max(e, w))));
  vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-3), 0.0, 1.0));
  vec3 wgt = -amp / 6.2;
  c = clamp((c + (n + s + e + w) * wgt) / (1.0 + 4.0 * wgt), 0.0, 1.0);

  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, 1.1);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.2);
  c *= mix(vec3(1.0), vec3(1.035, 1.0, 0.95), uWarm * 0.6 * (1.0 - uNight));

  vec2 q = vUv - 0.5;
  c *= 1.0 - smoothstep(0.34, 0.92, length(q * vec2(1.05, 1.0))) * 0.34;

  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
  float g = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  c += g * 0.012;
  gl_FragColor = vec4(c, 1.0);
}
`;

const halton = (i, b) => {
  let f = 1;
  let r = 0;
  while (i > 0) {
    f /= b;
    r += f * (i % b);
    i = Math.floor(i / b);
  }
  return r;
};

export class Pipeline {
  constructor(renderer) {
    this.renderer = renderer;
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.quad = new THREE.Mesh(tri);
    this.quad.frustumCulled = false;
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.quad);
    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const mk = (fragmentShader, uniforms, extra = {}) => new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      ...extra,
    });
    const v2 = () => ({ value: new THREE.Vector2() });
    const m4 = () => ({ value: new THREE.Matrix4() });
    this.ao = mk(AO_FRAG, { tDepth: { value: null }, uInvP: m4(), uTexel: v2(), uFrame: { value: 0 }, uProj: { value: 1 }, uFadeZ: { value: 50 } });
    this.aoBlur = mk(AO_BLUR, { tAO: { value: null }, tDepth: { value: null }, uTexel: v2(), uInvP: m4() });
    this.vol = mk(VOL_FRAG, {
      tDepth: { value: null },
      tShadow: { value: null },
      tNoise: { value: null },
      uInvVP: m4(),
      uShadowM: m4(),
      uCam: { value: new THREE.Vector3() },
      uLight: { value: new THREE.Vector3() },
      uLightCol: { value: new THREE.Color() },
      uR: { value: 14.6 },
      uTop: { value: 7.5 },
      uTime: { value: 0 },
      uDensity: { value: 0.1 },
      uFrame: { value: 0 },
      uLightI: { value: 1 },
      uHasShadow: { value: 0 },
    });
    this.base = mk(BASE_FRAG, { tScene: { value: null }, tAO: { value: null } });
    this.copy = mk(COPY_FRAG, { t: { value: null } });
    this.addVol = mk(COPY_FRAG, { t: { value: null } }, {
      transparent: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquation: THREE.AddEquation,
    });
    this.taa = mk(TAA_FRAG, {
      tCur: { value: null },
      tHist: { value: null },
      tDepth: { value: null },
      uInvVP: m4(),
      uPrevVP: m4(),
      uCurTexel: v2(),
      uHistTexel: v2(),
      uJit: v2(),
      uReset: { value: 1 },
    });
    this.down = mk(DOWN_FRAG, { t: { value: null }, uTexel: v2(), uThreshold: { value: 0 } });
    this.up = mk(UP_FRAG, { t: { value: null }, tAdd: { value: null }, uTexel: v2(), uMix: { value: 0.8 } });
    this.final = mk(FINAL_FRAG, {
      tColor: { value: null },
      tBloom: { value: null },
      uTexel: v2(),
      uExposure: { value: 1 },
      uTime: { value: 0 },
      uWarm: { value: 0 },
      uNight: { value: 0 },
    });

    this.targets = [];
    this.frame = 0;
    this.unjProj = new THREE.Matrix4();
    this.prevVP = new THREE.Matrix4();
    this.curVP = new THREE.Matrix4();
    this.invVP = new THREE.Matrix4();
    this.jitInvVP = new THREE.Matrix4();
    this.hasHistory = false;
  }

  rt(w, h, opts = {}) {
    const t = new THREE.WebGLRenderTarget(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)), {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      ...opts,
    });
    this.targets.push(t);
    return t;
  }

  setSize(w, h, scale) {
    this.targets.forEach((t) => {
      if (t.depthTexture) t.depthTexture.dispose();
      t.dispose();
    });
    this.targets = [];
    this.w = w;
    this.h = h;
    this.iw = Math.max(2, Math.round(w * scale));
    this.ih = Math.max(2, Math.round(h * scale));
    const depth = new THREE.DepthTexture(this.iw, this.ih);
    depth.type = THREE.UnsignedIntType;
    depth.minFilter = depth.magFilter = THREE.NearestFilter;
    this.sceneRT = this.rt(this.iw, this.ih, { depthBuffer: true, depthTexture: depth });
    this.aoRT = this.rt(this.iw / 2, this.ih / 2, { type: THREE.UnsignedByteType });
    this.aoBlurRT = this.rt(this.iw / 2, this.ih / 2, { type: THREE.UnsignedByteType });
    this.volRT = this.rt(this.iw / 2, this.ih / 2);
    this.baseRT = this.rt(this.iw, this.ih);
    this.litRT = this.rt(this.iw, this.ih);
    this.histA = this.rt(w, h);
    this.histB = this.rt(w, h);
    this.bloomDown = [];
    this.bloomUp = [];
    let bw = w / 2;
    let bh = h / 2;
    for (let i = 0; i < 6; i++) {
      this.bloomDown.push(this.rt(bw, bh));
      this.bloomUp.push(this.rt(bw, bh));
      bw = Math.max(2, bw / 2);
      bh = Math.max(2, bh / 2);
    }
    this.hasHistory = false;
  }

  fs(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.fsScene, this.fsCam);
  }

  render({ scene, camera, water, fxScene, light, state, time, noise, sky }) {
    const r = this.renderer;
    this.frame++;
    camera.clearViewOffset();
    camera.updateMatrixWorld();
    this.unjProj.copy(camera.projectionMatrix);
    this.curVP.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.invVP.copy(this.curVP).invert();

    const idx = (this.frame % 16) + 1;
    const jx = halton(idx, 2) - 0.5;
    const jy = halton(idx, 3) - 0.5;
    camera.setViewOffset(this.iw, this.ih, jx, jy, this.iw, this.ih);
    this.jitInvVP.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);

    r.shadowMap.autoUpdate = false;
    r.shadowMap.needsUpdate = this.everyFrame || this.frame % 2 === 1 || this.frame < 4;
    camera.layers.set(0);
    camera.layers.enable(1);
    camera.layers.enable(3);
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);

    const shadowTex = light.shadow.map ? light.shadow.map.texture : null;
    if (this.everyFrame || this.frame % 2 === 0 || !this.hasHistory) {
      sky.dome.position.set(0, 0, 0);
      water.renderReflection(scene, camera, this.unjProj);
    }

    const depth = this.sceneRT.depthTexture;
    const pInv = camera.projectionMatrixInverse;
    this.ao.uniforms.tDepth.value = depth;
    this.ao.uniforms.uInvP.value.copy(pInv);
    this.ao.uniforms.uTexel.value.set(1 / this.aoRT.width, 1 / this.aoRT.height);
    this.ao.uniforms.uFrame.value = this.frame;
    this.ao.uniforms.uProj.value = camera.projectionMatrix.elements[5] * 0.5;
    this.ao.uniforms.uFadeZ.value = camera.position.length();
    this.fs(this.ao, this.aoRT);
    this.aoBlur.uniforms.tAO.value = this.aoRT.texture;
    this.aoBlur.uniforms.tDepth.value = depth;
    this.aoBlur.uniforms.uTexel.value.set(1 / this.aoRT.width, 1 / this.aoRT.height);
    this.aoBlur.uniforms.uInvP.value.copy(pInv);
    this.fs(this.aoBlur, this.aoBlurRT);

    const v = this.vol.uniforms;
    v.tDepth.value = depth;
    v.tNoise.value = noise;
    v.tShadow.value = shadowTex;
    v.uHasShadow.value = shadowTex ? 1 : 0;
    v.uInvVP.value.copy(this.jitInvVP);
    v.uShadowM.value.copy(light.shadow.matrix);
    v.uCam.value.setFromMatrixPosition(camera.matrixWorld);
    v.uLight.value.copy(state.light);
    v.uLightCol.value.copy(state.color);
    v.uLightI.value = state.intensity;
    v.uDensity.value = state.volume;
    v.uTime.value = time;
    v.uFrame.value = this.frame;
    this.fs(this.vol, this.volRT);

    this.base.uniforms.tScene.value = this.sceneRT.texture;
    this.base.uniforms.tAO.value = this.aoBlurRT.texture;
    this.fs(this.base, this.baseRT);

    this.copy.uniforms.t.value = this.baseRT.texture;
    this.fs(this.copy, this.litRT);

    const wu = water.mat.uniforms;
    wu.tBase.value = this.baseRT.texture;
    wu.tDepth.value = depth;
    wu.uInvP.value.copy(pInv);
    wu.uRes.value.set(this.iw, this.ih);
    water.setState(state, light);

    const autoClear = r.autoClear;
    r.autoClear = false;
    r.setRenderTarget(this.litRT);
    r.render(water.scene, camera);
    r.render(fxScene, camera);
    this.addVol.uniforms.t.value = this.volRT.texture;
    this.fs(this.addVol, this.litRT);
    r.autoClear = autoClear;

    const t = this.taa.uniforms;
    t.tCur.value = this.litRT.texture;
    t.tHist.value = this.histA.texture;
    t.tDepth.value = depth;
    t.uInvVP.value.copy(this.invVP);
    t.uPrevVP.value.copy(this.prevVP);
    t.uCurTexel.value.set(1 / this.iw, 1 / this.ih);
    t.uHistTexel.value.set(1 / this.w, 1 / this.h);
    t.uJit.value.set(-jx / this.iw, jy / this.ih);
    t.uReset.value = this.hasHistory ? 0 : 1;
    this.fs(this.taa, this.histB);
    const swap = this.histA;
    this.histA = this.histB;
    this.histB = swap;
    this.hasHistory = true;
    this.prevVP.copy(this.curVP);
    camera.clearViewOffset();

    let src = this.histA.texture;
    let sw = this.w;
    let sh = this.h;
    this.bloomDown.forEach((target, i) => {
      this.down.uniforms.t.value = src;
      this.down.uniforms.uTexel.value.set(1 / sw, 1 / sh);
      this.down.uniforms.uThreshold.value = i === 0 ? 1.15 : 0;
      this.fs(this.down, target);
      src = target.texture;
      sw = target.width;
      sh = target.height;
    });
    let upSrc = this.bloomDown[this.bloomDown.length - 1].texture;
    for (let i = this.bloomDown.length - 2; i >= 0; i--) {
      const target = this.bloomUp[i];
      this.up.uniforms.t.value = upSrc;
      this.up.uniforms.tAdd.value = this.bloomDown[i].texture;
      this.up.uniforms.uTexel.value.set(1 / target.width, 1 / target.height);
      this.fs(this.up, target);
      upSrc = target.texture;
    }

    const f = this.final.uniforms;
    f.tColor.value = this.histA.texture;
    f.tBloom.value = upSrc;
    f.uTexel.value.set(1 / this.w, 1 / this.h);
    f.uExposure.value = state.exposure;
    f.uTime.value = time;
    f.uWarm.value = state.warm;
    f.uNight.value = state.night;
    this.fs(this.final, null);
  }
}
