import * as THREE from 'three';

const VERT = /* glsl */ `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Far scene + clouds -> main HDR target (before the near pass draws on top).
export function createCompositeMaterial() {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, depthTest: false, depthWrite: false,
    uniforms: { uFar: { value: null }, uClouds: { value: null } },
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uFar, uClouds;
      in vec2 vUv;
      out vec4 outColor;
      void main() {
        vec4 c = texture(uClouds, vUv);
        outColor = vec4(texture(uFar, vUv).rgb * c.a + c.rgb, 1.0);
      }`,
  });
}

// Tone map, grade and grain to the screen.
export function createFinalMaterial() {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, depthTest: false, depthWrite: false,
    uniforms: {
      uSrc: { value: null }, uExposure: { value: 1 }, uTime: { value: 0 }, uWarm: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) }, uFade: { value: 0 }, uNight: { value: 0 },
    },
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uSrc;
      uniform float uExposure, uTime, uWarm, uFade, uNight;
      uniform vec2 uRes;
      in vec2 vUv;
      out vec4 outColor;
      // ACES fitted (Stephen Hill)
      vec3 aces(vec3 v) {
        const mat3 i = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
        const mat3 o = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
        v = i * v;
        vec3 a = v * (v + 0.0245786) - 0.000090537;
        vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
        return clamp(o * (a / b), 0.0, 1.0);
      }
      vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 uv = vUv;
        // a touch of lateral chromatic aberration, like a phone lens
        vec2 dc = (uv - 0.5);
        float ca = 0.0012 * dot(dc, dc);
        vec3 c;
        c.r = texture(uSrc, uv - dc * ca * 4.0).r;
        c.g = texture(uSrc, uv).g;
        c.b = texture(uSrc, uv + dc * ca * 4.0).b;
        c *= uExposure;
        c = aces(c * 1.05);
        // gentle grade: lift shadows toward blue, warm highlights at golden hour
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(c, c * vec3(1.06, 1.0, 0.92), uWarm * smoothstep(0.2, 0.9, l));
        c += vec3(-0.004, 0.0, 0.01) * (1.0 - l);
        c = mix(vec3(l), c, 1.06);
        // night: the eye loses colour in the dark and shifts toward blue
        float dark = uNight * (1.0 - smoothstep(0.05, 0.5, l));
        c = mix(c, vec3(l) * vec3(0.78, 0.9, 1.15), dark * 0.6);
        float vig = 1.0 - 0.22 * pow(length(dc * vec2(1.0, 0.85)) * 1.25, 2.6);
        c *= vig;
        c = srgb(clamp(c, 0.0, 1.0));
        float g = h(uv * uRes + fract(uTime * 7.31) * 113.0) - 0.5;
        c += g * (0.018 + 0.012 * uNight);
        c *= uFade;
        outColor = vec4(c, 1.0);
      }`,
  });
}
