import * as THREE from 'three';
import { WORLD } from './world.js';

const FS_VERT = 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const SIM_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D tPrev, tHeight;
uniform vec2 uTexel;
uniform vec3 uDrop;
void main() {
  vec4 c = texture2D(tPrev, vUv);
  float l = texture2D(tPrev, vUv - vec2(uTexel.x, 0.0)).r;
  float r = texture2D(tPrev, vUv + vec2(uTexel.x, 0.0)).r;
  float d = texture2D(tPrev, vUv - vec2(0.0, uTexel.y)).r;
  float u = texture2D(tPrev, vUv + vec2(0.0, uTexel.y)).r;
  float v = (c.g + ((l + r + d + u) * 0.25 - c.r) * 1.72) * 0.9945;
  float h = (c.r + v) * 0.9992;
  if (uDrop.z != 0.0) {
    float dist = length(vUv - uDrop.xy);
    float d2 = dist * dist;
    h += uDrop.z * (exp(-d2 / 0.00006) - 0.55 * exp(-d2 / 0.00015));
  }
  float rim = length(vUv - 0.5);
  if (texture2D(tHeight, vUv).r > -0.015 || rim > 0.497) { h = 0.0; v = 0.0; }
  gl_FragColor = vec4(h, v, r - l, u - d);
}
`;

const WATER_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec4 vRefl;
uniform mat4 uTexMat;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vRefl = uTexMat * w;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const WATER_FRAG = /* glsl */ `
#include <packing>
varying vec3 vW;
varying vec3 vN;
varying vec4 vRefl;
uniform sampler2D tBase, tDepth, tRefl, tNoise, tRipple, tShadow;
uniform mat4 uInvP, uShadowM;
uniform vec2 uRes;
uniform vec3 uLight, uLightCol, uScatter, uSkyTint;
uniform float uTime, uWind, uR, uLightI, uHasShadow, uEnvI;

vec3 viewAt(vec2 uv, float d) {
  vec4 c = uInvP * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return c.xyz / c.w;
}

float H(vec2 p) {
  float t = uTime;
  return texture2D(tNoise, p * 0.034 + vec2(0.0061, 0.0037) * t).r
    + texture2D(tNoise, p * 0.083 + vec2(-0.0117, 0.0083) * t).g * 0.46
    + texture2D(tNoise, p * 0.21 + vec2(0.0179, -0.0221) * t).b * 0.2
    + texture2D(tNoise, p * 0.57 + vec2(-0.031, 0.027) * t).a * 0.085;
}

float sunVis(vec3 p) {
  if (uHasShadow < 0.5) return 1.0;
  vec4 sc = uShadowM * vec4(p, 1.0);
  vec3 c = sc.xyz / sc.w;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0) return 1.0;
  float s = 0.0;
  float spin = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.28318;
  for (int i = 0; i < 8; i++) {
    float fi = float(i) + 0.5;
    float a = fi * 2.39996 + spin;
    vec2 o = vec2(cos(a), sin(a)) * sqrt(fi / 8.0) * (4.5 / 4096.0);
    s += step(c.z - 0.0016, unpackRGBAToDepth(texture2D(tShadow, c.xy + o)));
  }
  return s / 8.0;
}

void main() {
  vec2 suv = gl_FragCoord.xy / uRes;
  float sd = texture2D(tDepth, suv).r;
  vec3 sceneV = viewAt(suv, sd);
  vec4 wv = viewMatrix * vec4(vW, 1.0);
  if (sceneV.z > wv.z + 0.004) discard;

  vec3 V = normalize(cameraPosition - vW);
  bool isTop = vN.y > 0.5;
  vec3 N = normalize(vN);
  float rippleAmt = 0.0;
  float rippleLight = 0.0;
  if (isTop) {
    float e = 0.055;
    float h0 = H(vW.xz);
    vec2 g = vec2(H(vW.xz + vec2(e, 0.0)) - h0, H(vW.xz + vec2(0.0, e)) - h0) / e;
    float amp = 0.026 + uWind * 0.085;
    vec4 rip = texture2D(tRipple, vW.xz / (2.0 * uR) + 0.5);
    rippleAmt = abs(rip.r);
    rippleLight = clamp((rip.b * uLight.x + rip.a * uLight.z) * -38.0, -0.16, 0.26);
    N = normalize(vec3(-g.x * amp - rip.b * 24.0, 1.0, -g.y * amp - rip.a * 24.0));
  }

  vec2 offs = isTop ? N.xz * (0.014 + 0.03 * clamp(length(sceneV - wv.xyz), 0.0, 1.5)) : vec2(0.0);
  vec2 ruv = clamp(suv + offs, 0.001, 0.999);
  float rd = texture2D(tDepth, ruv).r;
  vec3 rv = viewAt(ruv, rd);
  if (rv.z > wv.z) { ruv = suv; rv = sceneV; }
  vec3 refr = texture2D(tBase, ruv).rgb;
  float thick = clamp(length(rv - wv.xyz), 0.0, 9.0);
  if (!isTop) thick = min(thick, 7.0);

  float vis = isTop ? sunVis(vW + vec3(0.0, 0.01, 0.0)) : 1.0;
  float sunUp = max(uLight.y, 0.0);
  vec3 absorb = vec3(0.98, 0.25, 0.31);
  vec3 T = exp(-absorb * thick);
  vec3 scatter = uScatter * (uEnvI * 0.92 + uLightCol * uLightI * sunUp * (0.05 + 0.1 * vis));
  vec3 under = refr * T + scatter * (1.0 - T);

  float NoV = max(dot(N, V), 0.0);
  float F = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
  vec3 col;
  if (isTop) {
    vec2 ru = vRefl.xy / vRefl.w + N.xz * 0.02;
    vec3 refl = texture2D(tRefl, ru).rgb;
    col = mix(under, refl, clamp(F * 1.05, 0.0, 1.0));

    vec3 Hv = normalize(V + uLight);
    float NoH = max(dot(N, Hv), 0.0);
    float glint = pow(NoH, 1500.0) * 26.0 + pow(NoH, 180.0) * 0.14;
    col += uLightCol * uLightI * glint * vis * 0.34;

    float foamEdge = smoothstep(0.26, 0.035, thick) * smoothstep(0.0, 0.03, thick);
    float foamN = texture2D(tNoise, vW.xz * 0.34 + vec2(uTime * 0.012, -uTime * 0.009)).a;
    float foamW = texture2D(tNoise, vW.xz * 0.11 - vec2(uTime * 0.008, 0.0)).r;
    float lap = 0.5 + 0.5 * sin(uTime * 0.62 + foamW * 18.0 + thick * 22.0);
    float foam = foamEdge * smoothstep(0.5, 0.82, foamN + lap * 0.3);
    vec3 foamLight = uSkyTint * uEnvI * 0.62 + uLightCol * uLightI * sunUp * vis * 0.11;
    col = mix(col, foamLight, foam * 0.26);
    col *= 1.0 + rippleLight;
  } else {
    vec3 glass = uSkyTint * uEnvI * 0.6;
    col = under + glass * F * 0.8;
    float seam = smoothstep(-0.05, 0.0, vW.y);
    col += uSkyTint * uEnvI * seam * 0.05;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Water {
  constructor(renderer, U, heightTex) {
    this.renderer = renderer;
    this.U = U;
    this.scene = new THREE.Scene();
    this.simSize = 384;
    const opts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    };
    this.simA = new THREE.WebGLRenderTarget(this.simSize, this.simSize, opts);
    this.simB = this.simA.clone();
    this.drops = [];
    this.simMat = new THREE.ShaderMaterial({
      vertexShader: FS_VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        tPrev: { value: null },
        tHeight: { value: heightTex },
        uTexel: { value: new THREE.Vector2(1 / this.simSize, 1 / this.simSize) },
        uDrop: { value: new THREE.Vector3() },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.simQuad = new THREE.Mesh(tri, this.simMat);
    this.simQuad.frustumCulled = false;
    this.simScene = new THREE.Scene();
    this.simScene.add(this.simQuad);
    this.simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    for (const target of [this.simA, this.simB]) {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
    }
    renderer.setRenderTarget(null);

    this.reflRT = new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    this.mirror = new THREE.PerspectiveCamera();
    this.texMat = new THREE.Matrix4();

    this.mat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      uniforms: {
        tBase: { value: null },
        tDepth: { value: null },
        tRefl: { value: this.reflRT.texture },
        tNoise: U.tNoise,
        tRipple: { value: this.simA.texture },
        tShadow: { value: null },
        uInvP: { value: new THREE.Matrix4() },
        uShadowM: { value: new THREE.Matrix4() },
        uTexMat: { value: this.texMat },
        uRes: { value: new THREE.Vector2(1, 1) },
        uLight: { value: new THREE.Vector3(0, 1, 0) },
        uLightCol: { value: new THREE.Color(1, 1, 1) },
        uScatter: { value: new THREE.Color(0, 0.1, 0.1) },
        uSkyTint: { value: new THREE.Color(0.6, 0.7, 0.8) },
        uTime: U.uTime,
        uWind: U.uWind,
        uR: { value: WORLD.R + 0.008 },
        uLightI: { value: 1 },
        uHasShadow: { value: 0 },
        uEnvI: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });

    const top = new THREE.Mesh(new THREE.CircleGeometry(WORLD.R + 0.008, 220), this.mat);
    top.rotation.x = -Math.PI / 2;
    top.frustumCulled = false;
    const wallGeo = new THREE.CylinderGeometry(WORLD.R + 0.008, WORLD.R + 0.008, -WORLD.floor, 220, 1, true);
    wallGeo.translate(0, WORLD.floor / 2, 0);
    const wall = new THREE.Mesh(wallGeo, this.mat);
    wall.frustumCulled = false;
    this.scene.add(wall, top);
  }

  addDrop(x, z, strength = 0.05) {
    if (this.drops.length > 8) return;
    this.drops.push(new THREE.Vector3(x / (2 * WORLD.R) + 0.5, z / (2 * WORLD.R) + 0.5, strength));
  }

  stepSim() {
    const r = this.renderer;
    const steps = Math.max(1, Math.min(2, this.drops.length));
    for (let i = 0; i < steps; i++) {
      const d = this.drops.shift();
      this.simMat.uniforms.uDrop.value.copy(d || new THREE.Vector3());
      this.simMat.uniforms.tPrev.value = this.simA.texture;
      r.setRenderTarget(this.simB);
      r.render(this.simScene, this.simCam);
      const t = this.simA;
      this.simA = this.simB;
      this.simB = t;
    }
    this.mat.uniforms.tRipple.value = this.simA.texture;
  }

  /** Planar reflection across y = 0, with an oblique near plane at the water line. */
  renderReflection(scene, camera, unjitteredProj) {
    const m = this.mirror;
    const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const rot = new THREE.Matrix4().extractRotation(camera.matrixWorld);
    const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(rot);
    const target = camPos.clone().add(dir);
    m.position.set(camPos.x, -camPos.y, camPos.z);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(rot);
    up.y = -up.y;
    m.up.copy(up);
    m.lookAt(target.x, -target.y, target.z);
    m.near = camera.near;
    m.far = camera.far;
    m.updateMatrixWorld();
    m.projectionMatrix.copy(unjitteredProj);

    this.texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.texMat.multiply(m.projectionMatrix).multiply(m.matrixWorldInverse);

    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.002, 0));
    plane.applyMatrix4(m.matrixWorldInverse);
    const clip = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
    const p = m.projectionMatrix.elements;
    const q = new THREE.Vector4(
      (Math.sign(clip.x) + p[8]) / p[0],
      (Math.sign(clip.y) + p[9]) / p[5],
      -1,
      (1 + p[10]) / p[14],
    );
    clip.multiplyScalar(2 / clip.dot(q));
    p[2] = clip.x;
    p[6] = clip.y;
    p[10] = clip.z + 1;
    p[14] = clip.w;
    m.projectionMatrixInverse.copy(m.projectionMatrix).invert();

    m.layers.set(0);
    m.layers.enable(2);
    const r = this.renderer;
    const autoShadow = r.shadowMap.autoUpdate;
    const needs = r.shadowMap.needsUpdate;
    r.shadowMap.autoUpdate = false;
    r.shadowMap.needsUpdate = false;
    r.setRenderTarget(this.reflRT);
    r.clear();
    r.render(scene, m);
    r.shadowMap.autoUpdate = autoShadow;
    r.shadowMap.needsUpdate = needs;
  }

  setState(state, light) {
    const u = this.mat.uniforms;
    u.uLight.value.copy(state.light);
    u.uLightCol.value.copy(state.color);
    u.uLightI.value = state.intensity;
    u.uScatter.value.copy(state.scatter);
    u.uEnvI.value = state.envIntensity;
    u.uSkyTint.value.setRGB(0.62, 0.72, 0.82).lerp(new THREE.Color(0.95, 0.62, 0.42), state.warm * 0.6);
    const toNight = THREE.MathUtils.smoothstep(state.night, 0.15, 0.9);
    u.uSkyTint.value.lerp(new THREE.Color(0.05, 0.08, 0.14), toNight);
    if (light.shadow.map) {
      u.tShadow.value = light.shadow.map.texture;
      u.uShadowM.value.copy(light.shadow.matrix);
      u.uHasShadow.value = 1;
    }
  }
}
