// Post chain: scene -> ground-truth AO -> macro depth of field -> bloom -> tone map -> grade.
// The depth of field reuses the AO pass's depth buffer. Circle of confusion follows
// the thin-lens shape (|1 - focus / depth|), so near objects blur fast and the far
// room melts into soft bokeh, the way a phone lens sees a toy from 10 cm away.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const DOF = {
  uniforms: {
    tDiffuse: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2(1, 1) },
    uNear: { value: 0.25 }, uFar: { value: 2000 }, uFocus: { value: 20 }, uK: { value: 12 }, uMax: { value: 22 }, uOn: { value: 1 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform vec2 uRes;
    uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uK; uniform float uMax; uniform float uOn;
    varying vec2 vUv;
    float lin(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
    float coc(float d){ return clamp(uK * abs(1.0 - uFocus / d), 0.0, uMax); }
    void main(){
      vec4 c0 = texture2D(tDiffuse, vUv);
      if (uOn < 0.5) { gl_FragColor = c0; return; }
      float d0 = lin(vUv), k0 = coc(d0);
      vec3 acc = c0.rgb; float ws = 1.0;
      for (int i = 0; i < 44; i++) {
        float fi = float(i) + 0.5;
        float r = sqrt(fi / 44.0) * uMax;
        float a = fi * 2.39996323;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * r / uRes;
        vec3 c = texture2D(tDiffuse, uv).rgb;
        float d = lin(uv), k = coc(d);
        if (d > d0) k = min(k, k0 * 1.5 + 0.4);
        float w = clamp(k - r + 1.0, 0.0, 1.0);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        w *= 1.0 + smoothstep(2.0, 6.0, l) * 2.5;
        acc += c * w; ws += w;
      }
      gl_FragColor = vec4(acc / ws, c0.a);
    }`,
};

const GRADE = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      // a whisper of lateral chromatic aberration toward the corners
      float ca = dot(d, d) * 0.006;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.06);
      c = (c - 0.5) * 1.04 + 0.5;
      c *= mix(vec3(0.97, 0.99, 1.03), vec3(1.035, 1.0, 0.95), smoothstep(0.1, 0.8, l));
      vec2 dv = d; dv.x *= uRes.x / uRes.y;
      c *= 1.0 - 0.3 * smoothstep(0.38, 1.1, length(dv));
      c += (h(vUv * uRes + fract(uTime) * 61.0) - 0.5) * 0.016;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

export class Post {
  constructor(renderer, scene, camera) {
    this.renderer = renderer; this.camera = camera;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    this.composer.addPass(new RenderPass(scene, camera));
    this.ao = new GTAOPass(scene, camera, size.x, size.y);
    try {
      this.ao.updateGtaoMaterial({ radius: 2.2, distanceExponent: 1.4, thickness: 1.6, scale: 1.2, samples: 12, distanceFallOff: 1.0 });
      this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 10 });
    } catch (_) { /* keep defaults */ }
    this.ao.blendIntensity = 0.9;
    const hide = this.ao.overrideVisibility.bind(this.ao);
    this.ao.overrideVisibility = () => { hide(); scene.traverse((o) => { if (o.isSprite || o.userData.noAO) o.visible = false; }); };
    this.composer.addPass(this.ao);
    this.dof = new ShaderPass(DOF);
    this.dof.uniforms.tDepth.value = this.ao.depthTexture;
    this.composer.addPass(this.dof);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.16, 0.5, 2.2);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GRADE);
    this.composer.addPass(this.grade);
    this.setSize(size.x, size.y, true);
  }
  setSize(w, h, drawing = false) {
    if (!drawing) this.composer.setSize(w, h);
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.ao.setSize(size.x, size.y);
    this.dof.uniforms.tDepth.value = this.ao.depthTexture;
    this.dof.uniforms.uRes.value.copy(size);
    this.grade.uniforms.uRes.value.copy(size);
    this.scaleK = size.y / 1080;
  }
  render(dt, focusDist, aperture) {
    const u = this.dof.uniforms;
    u.uFocus.value = focusDist; u.uNear.value = this.camera.near; u.uFar.value = this.camera.far;
    u.uK.value = aperture * this.scaleK; u.uMax.value = Math.max(4, 30 * this.scaleK);
    this.grade.uniforms.uTime.value += dt;
    this.composer.render(dt);
  }
}
