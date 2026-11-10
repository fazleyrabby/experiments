/* post.js — HDR scene target, bloom chain and the art-style pass.
   Every style is a fragment-shader function of the same rendered frame; a wipe (or a draggable split)
   decides which style each pixel shows. */
import * as THREE from 'three';

export const STYLES = [
  { id: 0, key: 'real', name: 'Realistic', short: 'Neon' },
  { id: 1, key: 'dither', name: '1-Bit Dither', short: 'Dither' },
  { id: 2, key: 'ukiyo', name: 'Ukiyo-e', short: 'Woodblock' },
  { id: 3, key: 'comic', name: 'Comic Halftone', short: 'Comic' },
  { id: 4, key: 'blueprint', name: 'Blueprint', short: 'Blueprint' },
  { id: 5, key: 'thermal', name: 'Thermal Cam', short: 'Thermal' },
  { id: 6, key: 'gameboy', name: 'Game Boy', short: 'Game Boy' },
];

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BRIGHT_FRAG = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  vec3 c = textureLod(tSrc, vUv + uTexel*vec2(-0.5,-0.5), 0.0).rgb + textureLod(tSrc, vUv + uTexel*vec2(0.5,-0.5), 0.0).rgb
         + textureLod(tSrc, vUv + uTexel*vec2(-0.5,0.5), 0.0).rgb + textureLod(tSrc, vUv + uTexel*vec2(0.5,0.5), 0.0).rgb;
  c *= 0.25; c = min(c, vec3(8.0));
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * max(l - 0.85, 0.0) / max(l, 1e-3), 1.0);
}`;
const COPY_FRAG = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
void main(){
  vec3 c = textureLod(tSrc, vUv + uTexel*vec2(-0.5,-0.5), 0.0).rgb + textureLod(tSrc, vUv + uTexel*vec2(0.5,-0.5), 0.0).rgb
         + textureLod(tSrc, vUv + uTexel*vec2(-0.5,0.5), 0.0).rgb + textureLod(tSrc, vUv + uTexel*vec2(0.5,0.5), 0.0).rgb;
  gl_FragColor = vec4(c*0.25, 1.0);
}`;
const BLUR_FRAG = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = textureLod(tSrc, vUv, 0.0).rgb * 0.2270270270;
  c += (textureLod(tSrc, vUv + uDir*1.3846153846, 0.0).rgb + textureLod(tSrc, vUv - uDir*1.3846153846, 0.0).rgb) * 0.3162162162;
  c += (textureLod(tSrc, vUv + uDir*3.2307692308, 0.0).rgb + textureLod(tSrc, vUv - uDir*3.2307692308, 0.0).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;

const STYLE_FRAG = /* glsl */`
precision highp float;
uniform sampler2D tScene, tDepth, tB0, tB1, tB2;
uniform vec2 uRes; uniform float uTime, uNear, uFar, uBloom;
uniform int uA, uB; uniform float uWipe, uSlant, uLine;
varying vec2 vUv;

float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
vec3 aces(vec3 x){ x *= 0.95; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
vec3 toSrgb(vec3 c){ return pow(c, vec3(1.0/2.2)); }

vec3 hdrAt(vec2 uv){
  vec3 c = textureLod(tScene, uv, 0.0).rgb;
  vec3 b = textureLod(tB0, uv, 0.0).rgb*0.55 + textureLod(tB1, uv, 0.0).rgb*0.7 + textureLod(tB2, uv, 0.0).rgb*0.9;
  return c + b*uBloom;
}
vec3 tonedAt(vec2 uv){ return toSrgb(aces(hdrAt(uv))); }
float lumAt(vec2 uv){ return lum(toSrgb(aces(textureLod(tScene, uv, 0.0).rgb))); }
float linDepth(vec2 uv){
  float z = textureLod(tDepth, uv, 0.0).x;
  float ndc = z*2.0 - 1.0;
  return 2.0*uNear*uFar / (uFar + uNear - ndc*(uFar - uNear));
}
// depth + colour edges, thickness in pixels
float edgeAt(vec2 uv, float thick){
  vec2 px = thick / uRes;
  float d0 = linDepth(uv);
  float dl = linDepth(uv - vec2(px.x,0.0)), dr = linDepth(uv + vec2(px.x,0.0));
  float du = linDepth(uv + vec2(0.0,px.y)), dd = linDepth(uv - vec2(0.0,px.y));
  float dg = (abs(dl-d0) + abs(dr-d0) + abs(du-d0) + abs(dd-d0)) / max(d0, 1.0);
  float e1 = smoothstep(0.05, 0.22, dg);
  float l0 = lumAt(uv);
  float cg = abs(lumAt(uv - vec2(px.x,0.0)) - l0) + abs(lumAt(uv + vec2(px.x,0.0)) - l0)
           + abs(lumAt(uv + vec2(0.0,px.y)) - l0) + abs(lumAt(uv - vec2(0.0,px.y)) - l0);
  float e2 = smoothstep(0.30, 0.85, cg);
  return max(e1, e2*0.75);
}
vec2 quant(vec2 uv, float px){ return (floor(uv*uRes/px) + 0.5) * px / uRes; }

const float BAYER[16] = float[16](0.,8.,2.,10., 12.,4.,14.,6., 3.,11.,1.,9., 15.,7.,13.,5.);
float bayer4(vec2 cell){ ivec2 i = ivec2(mod(cell, 4.0)); return (BAYER[i.y*4 + i.x] + 0.5) / 16.0; }

vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y); float e = 1e-10;
  return vec3(abs(q.z + (q.w - q.y)/(6.0*d + e)), d/(q.x + e), q.x);
}

/* 0 — realistic */
vec3 stReal(vec2 uv){
  vec2 d = uv - 0.5;
  float ca = dot(d,d) * 0.012;
  vec3 c = vec3(hdrAt(uv + d*ca).r, hdrAt(uv).g, hdrAt(uv - d*ca).b);
  c = toSrgb(aces(c));
  c += (hash12(uv*uRes + fract(uTime)*91.0) - 0.5) * 0.03;
  c *= 1.0 - 0.85*dot(d,d);
  return c;
}

/* 1 — 1-bit Bayer dither */
vec3 stDither(vec2 uv){
  float px = max(2.0, floor(uRes.y/300.0));
  vec2 q = quant(uv, px);
  vec3 c = tonedAt(q);
  float l = clamp(pow(lum(c), 0.8) * 1.25, 0.0, 1.0);
  float t = bayer4(floor(gl_FragCoord.xy/px));
  float v = step(t, l);
  vec3 paper = vec3(0.94, 0.91, 0.80), ink = vec3(0.05, 0.05, 0.08);
  vec3 col = mix(ink, paper, v);
  float e = edgeAt(q, px);
  return mix(col, ink, e*0.85);
}

/* 2 — ukiyo-e woodblock */
vec3 stUkiyo(vec2 uv){
  vec2 px = 1.0/uRes;
  vec2 cuv = uv + vec2(2.5, 1.5)*px;       // colour plate misregistered against the key block
  vec3 c = (tonedAt(cuv)*2.0 + tonedAt(cuv+vec2(px.x*2.0,0.0)) + tonedAt(cuv-vec2(px.x*2.0,0.0))
          + tonedAt(cuv+vec2(0.0,px.y*2.0)) + tonedAt(cuv-vec2(0.0,px.y*2.0))) / 6.0;
  c = pow(c, vec3(0.78)) * 1.3;
  float l = lum(c);
  vec3 hsv = rgb2hsv(clamp(c, 0.0, 1.0));
  vec3 base;
  if (l < 0.13)      base = vec3(0.05,0.07,0.15);
  else if (l < 0.27) base = vec3(0.10,0.17,0.33);
  else if (l < 0.43) base = vec3(0.16,0.34,0.50);
  else if (l < 0.63) base = vec3(0.56,0.70,0.74);
  else               base = vec3(0.94,0.89,0.75);
  if (hsv.y > 0.40 && hsv.z > 0.28) {
    float h = hsv.x; vec3 acc = base;
    if (h < 0.04 || h > 0.86) acc = vec3(0.82,0.20,0.15);        // vermilion
    else if (h < 0.19)        acc = vec3(0.90,0.67,0.26);        // ochre
    else if (h < 0.45)        acc = vec3(0.36,0.52,0.34);        // moss
    else if (h > 0.72)        acc = vec3(0.64,0.30,0.42);        // plum
    base = mix(base, acc, smoothstep(0.40, 0.58, hsv.y));
  }
  // paper fibre and wood grain
  vec2 fc = gl_FragCoord.xy;
  float grain = vnoise(vec2(fc.x*0.05, fc.y*0.9)) * 0.5 + vnoise(fc*0.7) * 0.5;
  base *= 0.88 + 0.16*grain;
  float e = edgeAt(uv, 1.4);
  vec3 sumi = vec3(0.07,0.055,0.07);
  return mix(base, sumi, e*0.92);
}

/* 3 — comic halftone */
vec2 rot(vec2 p, float a){ float s = sin(a), c = cos(a); return mat2(c,-s,s,c)*p; }
float dotMask(vec2 fc, float ang, float cell, float amt){
  vec2 p = rot(fc, ang)/cell; vec2 f = fract(p) - 0.5;
  float r = sqrt(clamp(amt, 0.0, 1.0)) * 0.74;
  float aa = 1.3/cell;
  return smoothstep(r + aa, r - aa, length(f));
}
vec3 stComic(vec2 uv){
  float cell = max(5.0, uRes.y/110.0);
  vec3 c = pow(tonedAt(uv), vec3(0.72)) * 1.15;
  float sat = 1.5; float l = lum(c); c = clamp(mix(vec3(l), c, sat), 0.0, 1.0);
  float k = 1.0 - max(c.r, max(c.g, c.b));
  vec3 cmy = (1.0 - c - k) / max(1.0 - k, 1e-3);
  vec2 fc = gl_FragCoord.xy;
  float aC = dotMask(fc, 0.26, cell, cmy.x);
  float aM = dotMask(fc, 1.31, cell, cmy.y);
  float aY = dotMask(fc, 0.0, cell, cmy.z);
  float aK = dotMask(fc, 0.785, cell, k*1.1);
  vec3 col = vec3(0.97,0.95,0.88);
  col *= mix(vec3(1.0), vec3(0.08,0.66,0.93), aC);
  col *= mix(vec3(1.0), vec3(0.95,0.12,0.58), aM);
  col *= mix(vec3(1.0), vec3(1.0,0.93,0.12), aY);
  col *= mix(vec3(1.0), vec3(0.10,0.09,0.13), aK);
  float e = edgeAt(uv, 2.0);
  return mix(col, vec3(0.04,0.03,0.06), e);
}

/* 4 — blueprint */
vec3 stBlueprint(vec2 uv){
  vec2 fc = gl_FragCoord.xy;
  vec3 bg = vec3(0.035, 0.16, 0.38);
  float l = lum(tonedAt(uv));
  vec3 col = bg + vec3(0.06, 0.20, 0.42) * smoothstep(0.02, 0.9, l) * 0.9;
  vec2 g1 = abs(fract(fc/16.0) - 0.5), g2 = abs(fract(fc/80.0) - 0.5);
  float minor = step(0.5 - 1.0/16.0, max(g1.x, g1.y));
  float major = step(0.5 - 1.5/80.0, max(g2.x, g2.y));
  col += vec3(0.30, 0.52, 0.85) * (minor*0.07 + major*0.16);
  float e = edgeAt(uv, 1.0);
  col = mix(col, vec3(0.88, 0.96, 1.0), e*0.95);
  float hatch = step(0.5, fract((fc.x + fc.y)/6.0)) * smoothstep(0.35, 0.0, l) * 0.0;
  return col + hatch;
}

/* 5 — thermal camera */
vec3 iron(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c = vec3(0.0, 0.0, 0.03);
  c = mix(c, vec3(0.20,0.0,0.45), smoothstep(0.00, 0.22, t));
  c = mix(c, vec3(0.72,0.07,0.38), smoothstep(0.18, 0.46, t));
  c = mix(c, vec3(1.00,0.45,0.02), smoothstep(0.42, 0.70, t));
  c = mix(c, vec3(1.00,0.95,0.30), smoothstep(0.66, 0.90, t));
  c = mix(c, vec3(1.0), smoothstep(0.88, 1.0, t));
  return c;
}
vec3 stThermal(vec2 uv){
  float px = max(2.0, floor(uRes.y/240.0));
  vec2 q = quant(uv, px);
  float h = lum(hdrAt(q));
  float t = smoothstep(0.0, 3.3, sqrt(h) * 1.7);
  t += (hash12(floor(gl_FragCoord.xy/px) + fract(uTime)*37.0) - 0.5) * 0.04;
  vec3 col = iron(t);
  col *= 0.94 + 0.06*sin(gl_FragCoord.y*1.5);
  return col;
}

/* 6 — Game Boy */
vec3 stGameboy(vec2 uv){
  float px = max(2.0, floor(uRes.y/144.0));
  vec2 q = quant(uv, px);
  float l = clamp(pow(lum(tonedAt(q)), 0.9) * 1.3, 0.0, 1.0);
  float t = bayer4(floor(gl_FragCoord.xy/px));
  float v = clamp(floor(l*3.0 + (t - 0.5)*0.35 + 0.5), 0.0, 3.0);
  if (edgeAt(q, px) > 0.55) v = 0.0;
  vec3 p0 = vec3(0.059,0.220,0.059), p1 = vec3(0.188,0.384,0.188), p2 = vec3(0.545,0.675,0.059), p3 = vec3(0.608,0.737,0.059);
  vec3 col = v < 0.5 ? p0 : (v < 1.5 ? p1 : (v < 2.5 ? p2 : p3));
  // LCD grid
  vec2 g = fract(gl_FragCoord.xy/px);
  col *= 0.92 + 0.08*step(0.12, min(g.x, g.y));
  return col;
}

vec3 styleColor(int id, vec2 uv){
  if (id == 0) return stReal(uv);
  if (id == 1) return stDither(uv);
  if (id == 2) return stUkiyo(uv);
  if (id == 3) return stComic(uv);
  if (id == 4) return stBlueprint(uv);
  if (id == 5) return stThermal(uv);
  return stGameboy(uv);
}

void main(){
  vec2 uv = vUv;
  float s = uv.x + (uv.y - 0.5)*uSlant;
  vec3 col;
  if (uWipe <= -0.05) col = styleColor(uA, uv);
  else if (uWipe >= 1.05) col = styleColor(uB, uv);
  else col = (s < uWipe) ? styleColor(uB, uv) : styleColor(uA, uv);
  if (uLine > 0.5) {
    float d = abs(s - uWipe) * uRes.x;
    col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 2.2, d));
    col += vec3(1.0, 0.25, 0.65) * exp(-d*0.04) * 0.10;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.size = new THREE.Vector2(1, 1);
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const mk = (frag, uniforms) => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    });
    this.bright = mk(BRIGHT_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.copy = mk(COPY_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.blur = mk(BLUR_FRAG, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.style = mk(STYLE_FRAG, {
      tScene: { value: null }, tDepth: { value: null }, tB0: { value: null }, tB1: { value: null }, tB2: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 }, uNear: { value: 0.1 }, uFar: { value: 400 },
      uBloom: { value: 0.7 }, uA: { value: 0 }, uB: { value: 0 }, uWipe: { value: -0.1 }, uSlant: { value: 0.15 }, uLine: { value: 0 },
    });

    this.sceneRT = null;
    this.halfRT = null;
    this.levels = [];
    this.resize(innerWidth, innerHeight, 1);
  }

  rt(w, h, extra = {}) {
    return new THREE.WebGLRenderTarget(Math.max(2, w | 0), Math.max(2, h | 0), {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, ...extra,
    });
  }

  resize(w, h, dpr) {
    const W = Math.max(2, Math.floor(w * dpr)), H = Math.max(2, Math.floor(h * dpr));
    this.size.set(W, H);
    this.dispose();
    const depth = new THREE.DepthTexture(W, H);
    depth.type = THREE.UnsignedIntType;
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: true, depthTexture: depth, samples: 4,
    });
    this.halfRT = this.rt(W / 2, H / 2);
    this.levels = [4, 8, 16].map((d) => ({ a: this.rt(W / d, H / d), b: this.rt(W / d, H / d) }));
    this.style.uniforms.uRes.value.set(W, H);
    this.style.uniforms.tScene.value = this.sceneRT.texture;
    this.style.uniforms.tDepth.value = this.sceneRT.depthTexture;
    this.style.uniforms.tB0.value = this.levels[0].a.texture;
    this.style.uniforms.tB1.value = this.levels[1].a.texture;
    this.style.uniforms.tB2.value = this.levels[2].a.texture;
  }

  dispose() {
    for (const r of [this.sceneRT, this.halfRT]) r && r.dispose();
    for (const l of this.levels) { l.a.dispose(); l.b.dispose(); }
    if (this.sceneRT && this.sceneRT.depthTexture) this.sceneRT.depthTexture.dispose();
  }

  pass(mat, target, setup) {
    this.quad.material = mat;
    setup && setup(mat.uniforms);
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.cam);
  }

  render(scene, camera, time) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);

    // bloom chain
    const W = this.size.x, H = this.size.y;
    this.pass(this.bright, this.halfRT, (u) => { u.tSrc.value = this.sceneRT.texture; u.uTexel.value.set(1 / W, 1 / H); });
    let src = this.halfRT, srcW = W / 2, srcH = H / 2;
    for (let i = 0; i < this.levels.length; i++) {
      const { a, b } = this.levels[i];
      const w = a.width, h = a.height;
      this.pass(this.copy, a, (u) => { u.tSrc.value = src.texture; u.uTexel.value.set(1 / srcW, 1 / srcH); });
      this.pass(this.blur, b, (u) => { u.tSrc.value = a.texture; u.uDir.value.set(1 / w, 0); });
      this.pass(this.blur, a, (u) => { u.tSrc.value = b.texture; u.uDir.value.set(0, 1 / h); });
      src = a; srcW = w; srcH = h;
    }

    // style pass to screen
    const u = this.style.uniforms;
    u.uTime.value = time;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    this.quad.material = this.style;
    r.setRenderTarget(null);
    r.render(this.scene, this.cam);
  }
}
