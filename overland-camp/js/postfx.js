// Cinematic post-processing: bloom for lanterns/headlights, gentle grade,
// vignette, film grain and a touch of edge chromatic aberration.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.028 },
    uAberration: { value: 0.0016 }
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 dir = uv - 0.5;
      float dist = dot(dir, dir);

      // Very subtle lens fringing towards the corners.
      vec3 col;
      col.r = texture2D(tDiffuse, uv + dir * uAberration).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - dir * uAberration).b;

      // Soft vignette
      float vig = smoothstep(0.95, 0.18, length(dir) * 1.12);
      col *= mix(1.0, vig, uVignette);

      // Filmic grain, strongest in the shadows
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      float grain = (rand(uv * 900.0 + fract(uTime) * 100.0) - 0.5) * uGrain;
      col += grain * mix(1.25, 0.35, smoothstep(0.0, 0.7, luma));

      // Gentle lift + saturation
      col = max(col, vec3(0.0));
      col = pow(col, vec3(0.985));
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(lum), col, 1.045);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export function createPostFX(renderer, scene, camera) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  // CSS size — EffectComposer applies the pixel ratio when sizing the target,
  // so passing the drawing-buffer size here would double-scale on retina.
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: isMobile ? THREE.UnsignedByteType : THREE.HalfFloatType,
    samples: isMobile ? 0 : 4
  });

  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    isMobile ? 0.18 : 0.24, // strength
    0.55,                   // radius
    0.86                    // threshold
  );
  composer.addPass(bloomPass);

  composer.addPass(new OutputPass());

  const gradePass = new ShaderPass(GradeShader);
  gradePass.renderToScreen = true;
  composer.addPass(gradePass);

  function setSize(width, height) {
    // EffectComposer forwards the correctly scaled size to every pass.
    composer.setSize(width, height);
  }

  return {
    composer,
    setSize,
    setBloom: (on) => { bloomPass.enabled = on; },
    render: (delta) => {
      gradePass.uniforms.uTime.value = (gradePass.uniforms.uTime.value + delta) % 1000;
      composer.render(delta);
    }
  };
}
