import * as THREE from 'three';
import { HASH, NOISE2, ATMOS, CLOUD_SHADOW } from './glsl.js';
import { fullscreenQuad } from './sky.js';

// The mountains live in the "backdrop" frame: they travel with the camera's xz position
// (they are tens of kilometres away, so the drive never closes the distance) but keep
// world orientation, so the road's curves still swing them across the view.

// Detail heightmap covers the massif; the coarse one covers everything out to the horizon.
export const DETAIL_RECT = { x0: -42000, z0: -47000, x1: 42000, z1: -5000, w: 4096, h: 2048 };
export const COARSE_RECT = { x0: -160000, z0: -160000, x1: 160000, z1: 160000, w: 1024, h: 1024 };

const TERRAIN_FN = /* glsl */ `
float fbm2(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = mat2(1.6, -1.2, 1.2, 1.6) * p + 7.3; a *= 0.5; } return s; }

float dome(vec2 p, vec2 c, vec2 r, float h) {
  vec2 q = (p - c) / r;
  return h * exp(-dot(q, q) * 1.5);
}
// flatter-topped massif, like a broad ice dome
float bigDome(vec2 p, vec2 c, vec2 r, float h) {
  vec2 q = (p - c) / r;
  float d = dot(q, q);
  return h * exp(-pow(d * 1.5, 1.6));
}

// Broad shape of the ranges, in km.
float massif(vec2 p) {
  float h = 0.0;
  h += bigDome(p, vec2(-2.5, -19.0), vec2(8.0, 6.0), 3.6);  // the big snow dome
  h += dome(p, vec2(-10.5, -16.5), vec2(4.0, 3.2), 1.0);
  h += dome(p, vec2(5.5, -19.5), vec2(5.0, 4.0), 1.5);
  h += dome(p, vec2(13.0, -20.5), vec2(6.0, 4.5), 2.6);
  h += dome(p, vec2(23.0, -22.5), vec2(6.5, 5.0), 2.5);
  h += dome(p, vec2(34.0, -25.0), vec2(8.0, 6.0), 2.2);
  h += dome(p, vec2(-16.0, -20.5), vec2(5.5, 4.5), 1.9);
  h += dome(p, vec2(-26.0, -23.0), vec2(7.5, 5.5), 1.9);
  h += dome(p, vec2(-38.0, -26.0), vec2(9.0, 6.0), 1.6);
  h += dome(p, vec2(-8.0, -35.0), vec2(22.0, 6.0), 1.7);  // range behind
  h += dome(p, vec2(24.0, -38.0), vec2(16.0, 6.0), 2.0);
  // far ranges ringing the plateau
  float r = length(p);
  float ring = smoothstep(55.0, 85.0, r) * (1.0 - smoothstep(130.0, 150.0, r));
  float side = 0.6 + 0.4 * noise(vec2(atan(p.y, p.x) * 3.0, 1.7));
  h += ring * side * (1.1 + 0.6 * noise(p * 0.03));
  return h;
}

// Pre-erosion height (km).
float baseKm(vec2 p, int oct) {
  float m = massif(p);
  vec2 w = p + 2.6 * vec2(fbm2(p * 0.07), fbm2(p * 0.07 + 3.1));
  float r = 0.0, amp = 0.55, f = 0.17, prev = 1.0, norm = 0.0;
  for (int i = 0; i < 9; i++) {
    if (i >= oct) break;
    float n = 1.0 - abs(noise(w * f));
    n *= n;
    r += n * amp * prev;
    norm += amp;
    prev = clamp(n * 1.7, 0.0, 1.0);
    amp *= 0.5; f *= 2.05;
    w = mat2(0.8, -0.6, 0.6, 0.8) * w + 3.7;
  }
  r /= norm;
  float top = smoothstep(2.4, 3.6, m);
  float mtn = m * mix(0.5 + 0.62 * r, 0.86 + 0.2 * r, top);
  // alluvial aprons soften the foot of the range
  float apron = 0.18 * smoothstep(0.0, 1.6, m);
  // low dunes and foothills on the plain
  float dunes = 0.025 * (0.5 + 0.5 * noise(p * 0.35)) + 0.012 * noise(p * 1.3);
  float hills = 0.32 * pow(max(0.0, noise(p * 0.11 + 4.2) * 0.5 + 0.35), 3.0);
  float hillMask = smoothstep(9.0, 13.0, length(p)) * (1.0 - smoothstep(0.4, 1.4, m));
  return max(mtn, apron + dunes) + hills * hillMask;
}

vec3 erosion(vec2 p, vec2 dir) {
  vec2 ip = floor(p), fp = p - ip;
  vec3 va = vec3(0.0);
  float wt = 0.0;
  for (int i = -2; i <= 1; i++)
  for (int j = -2; j <= 1; j++) {
    vec2 o = vec2(i, j);
    vec2 h = hash22(ivec2(ip - o)) * 0.5;
    vec2 pp = fp + o - h;
    float d = dot(pp, pp);
    float w = exp(-d * 2.0);
    wt += w;
    float mag = dot(pp, dir) * 2.0 * 3.14159265;
    va += vec3(cos(mag), -sin(mag) * dir) * w;
  }
  return va / wt;
}

float terrainKm(vec2 p, int oct, int erode) {
  float h = baseKm(p, oct);
  if (erode == 0) return h;
  float e = 0.03;
  vec2 g = vec2(baseKm(p + vec2(e, 0.0), oct) - baseKm(p - vec2(e, 0.0), oct),
                baseKm(p + vec2(0.0, e), oct) - baseKm(p - vec2(0.0, e), oct)) / (2.0 * e);
  float gl = length(g);
  vec2 dir = vec2(g.y, -g.x) / (gl + 1e-5) * smoothstep(0.05, 0.5, gl);
  vec3 er = vec3(0.0);
  float a = 1.0, f = 1.3;
  for (int i = 0; i < 6; i++) {
    if (i >= erode) break;
    er += erosion(p * f, dir + er.zy * vec2(1.0, -1.0) * 0.35) * a * vec3(1.0, f, f);
    a *= 0.42; f *= 2.1;
  }
  float mask = smoothstep(0.25, 1.2, h) * smoothstep(0.08, 0.5, gl);
  return h + er.x * 0.14 * mask - 0.04 * mask;
}
`;

const VERT_FS = /* glsl */ `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BAKE_H = /* glsl */ `
precision highp float;
${HASH}
${NOISE2}
${TERRAIN_FN}
uniform vec4 uRect; // x0, z0, sizeX, sizeZ (m)
uniform int uOct;
uniform int uErode;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 p = (uRect.xy + vUv * uRect.zw) / 1000.0;
  outColor = vec4(terrainKm(p, uOct, uErode) * 1000.0, 0.0, 0.0, 1.0);
}`;

// Normals, sun shadow (soft, marched over the heightmap) and concavity.
const BAKE_N = /* glsl */ `
precision highp float;
uniform sampler2D uH;
uniform vec4 uRect;
uniform vec2 uTexel; // 1/size
uniform vec3 uSun;
in vec2 vUv;
out vec4 outColor;
float H(vec2 uv) { return texture(uH, uv).r; }
void main() {
  vec2 cell = uRect.zw * uTexel;
  float hl = H(vUv - vec2(uTexel.x, 0.0)), hr = H(vUv + vec2(uTexel.x, 0.0));
  float hd = H(vUv - vec2(0.0, uTexel.y)), hu = H(vUv + vec2(0.0, uTexel.y));
  vec3 n = normalize(vec3((hl - hr) / (2.0 * cell.x), 1.0, (hd - hu) / (2.0 * cell.y)));
  float h0 = H(vUv);
  // soft shadow toward the sun
  vec2 sd = normalize(uSun.xz);
  float tanE = uSun.y / length(uSun.xz);
  float res = 1.0, t = cell.x * 0.75;
  for (int i = 0; i < 72; i++) {
    vec2 uv = vUv + sd * t / uRect.zw;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) break;
    float ray = h0 + 3.0 + t * tanE;
    float dh = ray - H(uv);
    res = min(res, 9.0 * dh / t);
    if (res < -0.05) break;
    t *= 1.075;
  }
  float sh = smoothstep(0.0, 1.0, res);
  // concavity: height relative to a ring average (m); negative in gullies and valleys
  float avg = 0.0;
  for (int k = 0; k < 12; k++) {
    float a = float(k) * 0.5236;
    float rad = (k % 2 == 0 ? 180.0 : 420.0);
    avg += H(vUv + vec2(cos(a), sin(a)) * rad / uRect.zw);
  }
  avg /= 12.0;
  outColor = vec4(n.x, n.z, sh, h0 - avg);
}`;

export class Mountains {
  constructor(renderer, shared) {
    this.renderer = renderer;
    const floatLinear = !!renderer.extensions.get('OES_texture_float_linear');
    const mk = (r, type, format) => new THREE.WebGLRenderTarget(r.w, r.h, {
      type, format, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, depthBuffer: false,
    });
    const hType = floatLinear ? THREE.FloatType : THREE.HalfFloatType;
    this.detailH = mk(DETAIL_RECT, hType, THREE.RedFormat);
    this.coarseH = mk(COARSE_RECT, hType, THREE.RedFormat);
    this.detailN = mk(DETAIL_RECT, THREE.HalfFloatType, THREE.RGBAFormat);
    this.coarseN = mk(COARSE_RECT, THREE.HalfFloatType, THREE.RGBAFormat);

    this.cam = new THREE.Camera();
    this.bakeHMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT_FS, fragmentShader: BAKE_H,
      uniforms: { uRect: { value: new THREE.Vector4() }, uOct: { value: 8 }, uErode: { value: 5 } },
      depthTest: false, depthWrite: false,
    });
    this.bakeNMat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VERT_FS, fragmentShader: BAKE_N,
      uniforms: { uH: { value: null }, uRect: { value: new THREE.Vector4() }, uTexel: { value: new THREE.Vector2() }, uSun: { value: new THREE.Vector3() } },
      depthTest: false, depthWrite: false,
    });
    this.quad = fullscreenQuad(this.bakeHMat);
    this.bakeScene = new THREE.Scene();
    this.bakeScene.add(this.quad);

    this.mesh = this.buildMesh(shared);
  }

  rectVec(r) { return new THREE.Vector4(r.x0, r.z0, r.x1 - r.x0, r.z1 - r.z0); }

  bakeHeights() {
    const r = this.renderer;
    this.quad.material = this.bakeHMat;
    const u = this.bakeHMat.uniforms;
    u.uRect.value.copy(this.rectVec(COARSE_RECT)); u.uOct.value = 6; u.uErode.value = 2;
    r.setRenderTarget(this.coarseH); r.render(this.bakeScene, this.cam);
    u.uRect.value.copy(this.rectVec(DETAIL_RECT)); u.uOct.value = 9; u.uErode.value = 6;
    r.setRenderTarget(this.detailH); r.render(this.bakeScene, this.cam);
    r.setRenderTarget(null);
  }

  bakeLighting(sunDir) {
    const r = this.renderer;
    this.quad.material = this.bakeNMat;
    const u = this.bakeNMat.uniforms;
    u.uSun.value.copy(sunDir);
    for (const [rect, h, n] of [[COARSE_RECT, this.coarseH, this.coarseN], [DETAIL_RECT, this.detailH, this.detailN]]) {
      u.uH.value = h.texture;
      u.uRect.value.copy(this.rectVec(rect));
      u.uTexel.value.set(1 / rect.w, 1 / rect.h);
      r.setRenderTarget(n); r.render(this.bakeScene, this.cam);
    }
    r.setRenderTarget(null);
  }

  // A grid that is dense over the massif and stretches to the horizon elsewhere.
  buildMesh(shared) {
    const NX = 2560, NZ = 960;
    const mapX = (t) => 45105 * t + 104895 * Math.pow(t, 7); // ~35 m spacing over the massif
    const mapZ = (t) => -23500 + 23950 * t + (t > 0 ? 102000 - 23950 : 136500 - 23950) * Math.pow(t, 7);
    const pos = new Float32Array(NX * NZ * 3);
    let k = 0;
    for (let j = 0; j < NZ; j++) {
      const z = mapZ((j / (NZ - 1)) * 2 - 1);
      for (let i = 0; i < NX; i++) {
        pos[k++] = mapX((i / (NX - 1)) * 2 - 1); pos[k++] = 0; pos[k++] = z;
      }
    }
    const idx = new Uint32Array((NX - 1) * (NZ - 1) * 6);
    k = 0;
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));

    const rectU = (r) => ({ value: new THREE.Vector4(r.x0, r.z0, 1 / (r.x1 - r.x0), 1 / (r.z1 - r.z0)) });
    const SAMPLE = /* glsl */ `
      uniform sampler2D uDH, uCH, uDN, uCN;
      uniform vec4 uDRect, uCRect;
      float detailW(vec2 p) {
        vec2 uv = (p - uDRect.xy) * uDRect.zw;
        vec2 e = min(uv, 1.0 - uv) / (uDRect.zw * 3000.0);
        return clamp(min(e.x, e.y), 0.0, 1.0);
      }
      vec2 uvD(vec2 p) { return (p - uDRect.xy) * uDRect.zw; }
      vec2 uvC(vec2 p) { return (p - uCRect.xy) * uCRect.zw; }
      float heightAt(vec2 p) {
        float w = detailW(p);
        float hc = textureLod(uCH, uvC(p), 0.0).r;
        return w > 0.0 ? mix(hc, textureLod(uDH, uvD(p), 0.0).r, w) : hc;
      }`;

    const material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        ...shared,
        uDH: { value: this.detailH.texture }, uCH: { value: this.coarseH.texture },
        uDN: { value: this.detailN.texture }, uCN: { value: this.coarseN.texture },
        uDRect: rectU(DETAIL_RECT), uCRect: rectU(COARSE_RECT),
      },
      vertexShader: /* glsl */ `
        ${SAMPLE}
        out vec3 vB;
        out vec3 vW;
        void main() {
          vec2 p = position.xz;
          float h = heightAt(p);
          float r = length(p);
          h = mix(-40.0, h, smoothstep(7000.0, 7900.0, r));
          vB = vec3(p.x, h, p.y);
          vec4 w = modelMatrix * vec4(vB, 1.0);
          vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        ${HASH}
        ${NOISE2}
        ${ATMOS}
        ${CLOUD_SHADOW}
        ${SAMPLE}
        uniform vec3 uCamB;
        uniform float uPixAngle;
        in vec3 vB;
        in vec3 vW;
        out vec4 outColor;
        float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.07 + 5.3; a *= 0.5; } return s; }
        void main() {
          vec2 p = vB.xz;
          float w = detailW(p);
          vec4 nc = texture(uCN, uvC(p));
          vec4 nd = w > 0.0 ? texture(uDN, uvD(p)) : nc;
          vec4 N4 = mix(nc, nd, w);
          vec3 n = normalize(vec3(N4.x, sqrt(max(0.0, 1.0 - N4.x * N4.x - N4.y * N4.y)), N4.y));
          float sunSh = N4.z;
          float conc = N4.w; // metres above ring average
          float hr = vB.y;
          vec3 V = vW - cameraPosition;
          float dist = length(V);
          vec3 vd = V / dist;

          // fine detail
          // fine relief the heightmap can't hold: two octaves of bumps on rock, faded by pixel size
          float pix = dist * uPixAngle;
          vec3 d1 = noised(p / 70.0 + 1.7);
          float w1 = 1.0 - smoothstep(25.0, 70.0, pix);
          float w2 = 1.0 - smoothstep(7.0, 22.0, pix);
          vec3 d2 = w2 > 0.0 ? noised(p / 22.0 + 3.1) : vec3(0.0);
          vec2 g = d1.yz * (26.0 / 70.0) * w1 + d2.yz * (8.0 / 22.0) * w2;
          float steep = smoothstep(0.15, 0.5, 1.0 - n.y);
          n = normalize(n + vec3(-g.x, 0.0, -g.y) * (0.35 + 0.65 * steep));
          float n1 = fbm(p / 260.0);
          float n2 = fbm(p / 2400.0);
          float slope = 1.0 - n.y;

          // materials
          vec3 plain = mix(vec3(0.46, 0.27, 0.13), vec3(0.52, 0.33, 0.17), 0.5 + 0.5 * n2);
          plain = mix(plain, vec3(0.42, 0.30, 0.20), smoothstep(0.1, 0.5, n1) * 0.4);
          vec3 scree = mix(vec3(0.34, 0.28, 0.23), vec3(0.42, 0.35, 0.28), 0.5 + 0.5 * n1);
          float strata = 0.5 + 0.5 * sin(hr / 38.0 + n1 * 4.0 + d2.x * 1.5);
          vec3 rock = mix(vec3(0.085, 0.08, 0.078), vec3(0.22, 0.195, 0.17), strata * 0.55 + 0.25 * n1 + 0.2 * d2.x * w2);
          rock = mix(rock, vec3(0.26, 0.17, 0.12), smoothstep(0.3, 0.7, d1.x) * 0.35);
          vec3 snowC = vec3(0.86, 0.89, 0.93);
          vec3 iceC = vec3(0.62, 0.74, 0.80);

          vec3 alb = plain;
          alb = mix(alb, scree, smoothstep(120.0, 500.0, hr + n2 * 200.0));
          alb = mix(alb, rock, smoothstep(0.28, 0.5, slope + 0.1 * n1) * smoothstep(250.0, 700.0, hr));
          // glaciers: concave valleys at mid altitude, flowing out onto the aprons
          float glacier = smoothstep(-15.0, -60.0, conc + n1 * 25.0) * smoothstep(350.0, 800.0, hr) * (1.0 - smoothstep(0.35, 0.55, slope));
          vec3 glC = mix(iceC, vec3(0.80, 0.84, 0.88), 0.5 + 0.5 * fbm(p / 90.0));
          alb = mix(alb, glC, glacier);
          // snow: above a ragged snow line, missing from steep rock ribs
          float snowLine = 1000.0 + 320.0 * n2 + 200.0 * n1;
          float snow = smoothstep(snowLine - 200.0, snowLine + 260.0, hr - conc * 4.0);
          snow *= 1.0 - smoothstep(0.5, 0.72, slope + conc * 0.006 + 0.12 * n1);
          snow *= 1.0 - 0.8 * smoothstep(18.0, 55.0, conc + n1 * 15.0) * smoothstep(0.3, 0.5, slope);
          alb = mix(alb, snowC, snow);
          float isSnow = max(snow, glacier * 0.8);

          // lighting
          float sh = sunSh * cloudShadow(vB);
          float ndl = max(dot(n, uSunDir), 0.0);
          float ao = clamp(1.0 + conc / 160.0, 0.45, 1.0);
          vec3 L = uSunColor * ndl * sh;
          vec3 A = uSkyAmbient * (0.6 + 0.4 * n.y) * ao + uGroundBounce * (0.5 - 0.5 * n.y);
          vec3 col = alb * (L + A);
          // snow sheen toward the sun
          vec3 hv = normalize(uSunDir - vd);
          col += isSnow * uSunColor * sh * 0.06 * pow(max(dot(n, hv), 0.0), 18.0);

          col = aerial(col, dist, vd, uCamB.y, hr);
          outColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false;
    return mesh;
  }
}
