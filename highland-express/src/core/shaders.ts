import * as THREE from 'three';

/** Uniforms shared by every patched material (updated once per frame). */
export const shared = {
  uTime: { value: 0 },
  uWindDir: { value: new THREE.Vector2(0.83, 0.55) },
  uWind: { value: 1 },
  /** xyz: centre of the real-time shadow region, w: its radius (baked terrain shadow fades in outside) */
  uShadowFocus: { value: new THREE.Vector4(0, 0, 0, 80) },
  uSunDir: { value: new THREE.Vector3(-0.6, 0.3, 0.6).normalize() },
};

export const GLSL_NOISE = /* glsl */ `
float heHash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float heHash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float heVNoise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = heHash13(i), b = heHash13(i+vec3(1,0,0));
  float c = heHash13(i+vec3(0,1,0)), d = heHash13(i+vec3(1,1,0));
  float e = heHash13(i+vec3(0,0,1)), g = heHash13(i+vec3(1,0,1));
  float h = heHash13(i+vec3(0,1,1)), k = heHash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
}
float heFbm(vec3 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<4;i++){ s += a*heVNoise(p); p = p*2.03 + 7.1; a *= 0.5; }
  return s;
}
float heFbm2L(vec2 p);
float heVNoise2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = heHash12(i), b = heHash12(i+vec2(1,0));
  float c = heHash12(i+vec2(0,1)), d = heHash12(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float heFbm2(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ s += a*heVNoise2(p); p = p*2.03 + 5.7; a *= 0.5; }
  return s;
}
float heFbm2L(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<3;i++){ s += a*heVNoise2(p); p = p*2.03 + 5.7; a *= 0.5; }
  return s * 1.14;
}
vec3 hePerturb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
  vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
  vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
  vec3 vN = surf_norm;
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 ) * faceDirection;
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  vec3 pn = abs( fDet ) * surf_norm - vGrad;
  float pl = length( pn );
  return pl > 1e-5 && fDet == fDet ? pn / pl : surf_norm;
}
`;

export interface PatchOpts {
  key: string;
  uniforms?: Record<string, { value: unknown }>;
  vertDecl?: string;
  vertMain?: string; // after begin_vertex (variable `transformed` available)
  fragDecl?: string;
  fragColor?: string; // after color_fragment (diffuseColor)
  fragRough?: string; // after roughnessmap_fragment (roughnessFactor)
  fragMetal?: string; // after metalnessmap_fragment (metalnessFactor)
  fragNormal?: string; // after normal_fragment_maps (normal, faceDirection)
  fragEmissive?: string; // after emissivemap_fragment (totalEmissiveRadiance)
  fragLightsEnd?: string; // after lights_fragment_end (reflectedLight)
  fragEnd?: string; // after output_fragment (gl_FragColor)
}

/**
 * Inject procedural shading into a built-in three.js material.
 * Provides varyings: vWPos (world), vOPos (object/instance-local), vRand (per instance).
 */
export function patch<T extends THREE.Material>(mat: T, o: PatchOpts): T {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, o.uniforms ?? {});
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWPos; varying vec3 vOPos; varying float vRand; varying vec3 vWNormal;
uniform float uTime; uniform vec2 uWindDir; uniform float uWind;
${o.vertDecl ?? ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vOPos = position;
mat4 heInst = mat4(1.0);
#ifdef USE_INSTANCING
  heInst = instanceMatrix;
#endif
#ifdef USE_BATCHING
  heInst = batchingMatrix;
#endif
vRand = fract(sin(dot(heInst[3].xz, vec2(12.9898,78.233)) + heInst[3].y*0.37) * 43758.5453);
${o.vertMain ?? ''}
{
  vec4 hwp = heInst * vec4(transformed, 1.0);
  vWPos = (modelMatrix * hwp).xyz;
  vec3 hn = mat3(heInst) * normal;
  vWNormal = normalize(mat3(modelMatrix) * hn);
}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vWPos; varying vec3 vOPos; varying float vRand; varying vec3 vWNormal;
uniform float uTime; uniform vec4 uShadowFocus; uniform vec3 uSunDir;
${GLSL_NOISE}
${o.fragDecl ?? ''}`,
      );
    const inject = (marker: string, code?: string) => {
      if (!code) return;
      shader.fragmentShader = shader.fragmentShader.replace(marker, `${marker}\n{\n${code}\n}`);
    };
    inject('#include <color_fragment>', o.fragColor);
    inject('#include <roughnessmap_fragment>', o.fragRough);
    inject('#include <metalnessmap_fragment>', o.fragMetal);
    inject('#include <normal_fragment_maps>', o.fragNormal);
    inject('#include <emissivemap_fragment>', o.fragEmissive);
    inject('#include <lights_fragment_end>', o.fragLightsEnd);
    inject('#include <opaque_fragment>', o.fragEnd);
  };
  mat.customProgramCacheKey = () => o.key;
  return mat;
}

/** Vertex-shader wind sway for instanced vegetation (adds to `transformed`). */
export const WIND_VERT = /* glsl */ `
{
  float hH = max(position.y, 0.0);
  vec2 wp2 = heInst[3].xz;
  float ph = dot(wp2, vec2(0.05, 0.043)) + uTime * 1.3;
  float gust = sin(uTime * 0.37 + dot(wp2, uWindDir) * 0.012) * 0.5 + 0.5;
  float amp = (0.012 + 0.03 * gust) * uWind * heSwayAmp;
  float k = hH * hH * amp;
  transformed.xz += uWindDir * k * (sin(ph) + 0.4 * sin(ph * 2.3 + position.x * 3.0));
  transformed.xz += vec2(-uWindDir.y, uWindDir.x) * k * 0.4 * sin(ph * 1.7 + 1.3);
}
`;
