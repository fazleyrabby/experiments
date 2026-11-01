import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

/**
 * Single final full-screen pass: ACES tone mapping, sRGB encoding, restrained colour grade
 * (S-curve, split toning), vignette and film grain. Replaces OutputPass + a separate grade pass
 * so we pay for one fewer full-resolution read/write.
 */
export class FinalPass extends Pass {
  readonly uniforms = {
    tDiffuse: { value: null as THREE.Texture | null },
    toneMappingExposure: { value: 1 },
    uTime: { value: 0 },
    uVignette: { value: 0.3 },
    uGrain: { value: 0.02 },
    uSat: { value: 1.06 },
    uContrast: { value: 1.07 },
  };
  private material: THREE.RawShaderMaterial;
  private quad: FullScreenQuad;

  constructor() {
    super();
    this.material = new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      defines: { ACES_FILMIC_TONE_MAPPING: '', SRGB_TRANSFER: '' },
      vertexShader: /* glsl */ `
        precision highp float;
        uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
        attribute vec3 position; attribute vec2 uv;
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D tDiffuse;
        uniform float uTime, uVignette, uGrain, uSat, uContrast;
        #include <tonemapping_pars_fragment>
        #include <colorspace_pars_fragment>
        varying vec2 vUv;
        float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main(){
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          c = ACESFilmicToneMapping(c);
          c = sRGBTransferOETF(vec4(c, 1.0)).rgb;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = (c - 0.5) * uContrast + 0.5;
          c = mix(vec3(l), c, uSat);
          c += vec3(-0.012, 0.002, 0.018) * (1.0 - smoothstep(0.0, 0.45, l));
          c += vec3(0.020, 0.008, -0.014) * smoothstep(0.45, 1.0, l);
          vec2 q = vUv - 0.5; q.x *= 1.15;
          float v = 1.0 - smoothstep(0.2, 0.85, length(q));
          c *= mix(1.0 - uVignette, 1.0, v);
          c += (hash(vUv * 1731.0 + fract(uTime)) - 0.5) * uGrain;
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`,
    });
    this.quad = new FullScreenQuad(this.material);
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.toneMappingExposure.value = renderer.toneMappingExposure;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }
    this.quad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.quad.dispose();
  }
}
