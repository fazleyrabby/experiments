import * as THREE from 'three';

const WIND_HEAD = /* glsl */ `
attribute vec3 aWind;
uniform float uTime;
uniform float uWind;
uniform float uFlex;
uniform float uFlutter;

vec3 windDisp(vec3 wp, vec3 root, float flex, float flutter, float phase) {
  vec2 dir = normalize(vec2(0.82, 0.57));
  float t = uTime;
  float travel = dot(root.xz, dir);
  float gust = 0.5 + 0.5 * sin(travel * 0.34 - t * 0.82);
  gust *= gust;
  gust *= 0.6 + 0.4 * sin(dot(root.xz, dir.yx) * 0.55 + t * 0.31);
  float amp = uWind * (0.16 + gust * 1.05);
  float sway = sin(t * 1.18 + root.x * 0.31 + root.z * 0.23 + phase * 0.35)
             + 0.45 * sin(t * 2.37 + root.z * 0.47 + phase);
  float bend = flex * flex * uFlex * amp;
  vec3 d = vec3(dir.x, 0.0, dir.y) * bend * (0.62 + 0.38 * sway);
  d.y -= bend * 0.18;
  d.xz += vec2(-dir.y, dir.x) * bend * 0.22 * sin(t * 1.63 + phase * 2.0);
  float f = flutter * uFlutter * amp * 0.045;
  d += f * vec3(
    sin(t * 6.7 + phase * 6.3 + wp.x * 3.1),
    sin(t * 8.3 + phase * 9.1 + wp.z * 2.3),
    cos(t * 7.1 + phase * 5.2 + wp.y * 3.7));
  return d;
}
`;

const WIND_PROJECT = /* glsl */ `
vec4 windLocal = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  windLocal = instanceMatrix * windLocal;
  vec3 windRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
#else
  vec3 windRoot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
vec4 windWorld = modelMatrix * windLocal;
windWorld.xyz += windDisp(windWorld.xyz, windRoot, aWind.x, aWind.y, aWind.z);
vec4 mvPosition = viewMatrix * windWorld;
gl_Position = projectionMatrix * mvPosition;
`;

function bindWind(shader, U, flex, flutter) {
  shader.uniforms.uTime = U.uTime;
  shader.uniforms.uWind = U.uWind;
  shader.uniforms.uFlex = { value: flex };
  shader.uniforms.uFlutter = { value: flutter };
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${WIND_HEAD}`)
    .replace('#include <project_vertex>', WIND_PROJECT);
}

/** Leaves and bark: wind in the vertex stage, light transmission through leaves. */
export function foliageMaterial(U, { flex = 0.4, flutter = 1, rough = 0.5, translucent = 1, bark = false } = {}) {
  const m = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: rough,
    metalness: 0,
    side: bark ? THREE.FrontSide : THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
  });
  m.onBeforeCompile = (s) => {
    bindWind(s, U, flex, flutter);
    s.uniforms.uTranslucent = { value: bark ? 0 : translucent };
    s.uniforms.tNoise = U.tNoise;
    s.vertexShader = s.vertexShader
      .replace('#include <worldpos_vertex>', 'vec4 worldPosition = windWorld; vFolW = windWorld.xyz;')
      .replace('#include <common>', '#include <common>\nvarying vec3 vFolW;');
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vFolW;
         uniform float uTranslucent;
         uniform sampler2D tNoise;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         ${bark ? `
         vec2 barkUv = vec2(atan(vFolW.x, vFolW.z) * 0.8 + vFolW.y * 0.08, vFolW.y * 0.34);
         float barkN = texture2D(tNoise, barkUv).g * 0.6 + texture2D(tNoise, barkUv * 3.1).a * 0.4;
         diffuseColor.rgb *= 0.62 + barkN * 0.82;` : `
         float leafN = texture2D(tNoise, vFolW.xz * 0.11 + vFolW.y * 0.05).r;
         diffuseColor.rgb *= 0.84 + leafN * 0.34;`}`,
      )
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
         #if NUM_DIR_LIGHTS > 0
         if (uTranslucent > 0.0) {
           vec3 L = directLight.direction;
           float back = clamp(-dot(normal, L) * 0.8 + 0.2, 0.0, 1.0);
           float toward = pow(clamp(dot(normalize(vViewPosition), -L), 0.0, 1.0), 3.0);
           vec3 tint = diffuseColor.rgb * vec3(1.35, 1.75, 0.42);
           reflectedLight.directDiffuse += directLight.color * tint * RECIPROCAL_PI * (back * 0.75 + toward * 1.5) * uTranslucent;
         }
         #endif`,
      );
  };
  m.customProgramCacheKey = () => `foliage-${bark ? 1 : 0}`;
  return m;
}

export function foliageDepth(U, { flex = 0.4, flutter = 1 } = {}) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = (s) => bindWind(s, U, flex, flutter);
  m.customProgramCacheKey = () => 'foliage-depth';
  return m;
}

/** Weathered timber with grain, driven by the UVs of the plank builder. */
export function woodMaterial(U, { rough = 0.78, grainScale = 1, polish = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rough, metalness: 0 });
  m.onBeforeCompile = (s) => {
    s.uniforms.tNoise = U.tNoise;
    s.uniforms.uGrain = { value: grainScale };
    s.uniforms.uPolish = { value: polish };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vWoodUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWoodUv = uv;');
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec2 vWoodUv;
         uniform sampler2D tNoise;
         uniform float uGrain;
         uniform float uPolish;
         float woodH;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 wuv = vWoodUv * uGrain;
         float g1 = texture2D(tNoise, vec2(wuv.x * 0.06, wuv.y * 0.85)).r;
         float g2 = texture2D(tNoise, vec2(wuv.x * 0.19 + 0.3, wuv.y * 3.4)).g;
         float g3 = texture2D(tNoise, vec2(wuv.x * 0.52, wuv.y * 9.0)).a;
         float rings = sin((wuv.y * 7.0 + g1 * 11.0) * 3.14159) * 0.5 + 0.5;
         woodH = rings * 0.34 + g2 * 0.36 + g3 * 0.3;
         diffuseColor.rgb *= mix(0.42, 1.2, smoothstep(0.2, 0.82, woodH));
         float weather = texture2D(tNoise, wuv * 0.09).b;
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.34))) * vec3(1.02, 1.0, 0.95), smoothstep(0.42, 0.72, weather) * (1.0 - uPolish) * 0.62);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         roughnessFactor = clamp(roughnessFactor + (0.5 - woodH) * 0.28, 0.08, 1.0);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           vec3 vp = -vViewPosition;
           vec3 dpx = dFdx(vp), dpy = dFdy(vp);
           float dhx = dFdx(woodH), dhy = dFdy(woodH);
           vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
           float det = dot(dpx, r1);
           vec3 grad = sign(det) * (dhx * r1 + dhy * r2) * ${(0.012).toFixed(3)};
           normal = normalize(abs(det) * normal - grad);
         }`,
      );
  };
  m.customProgramCacheKey = () => 'wood';
  return m;
}
