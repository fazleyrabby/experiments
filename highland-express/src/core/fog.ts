import * as THREE from 'three';
import { SUN_DIR } from '../world/layout';

/**
 * Replaces three's fog chunks with a height-aware fog: exponential distance haze,
 * a valley mist layer (exponential density falling with altitude) and a warm
 * in-scattering lobe towards the sun. `fogNear` carries the haze density.
 */
export const FOG = {
  density: 0.00052,
  mistDensity: 0.0026,
  mistBase: -2.0,
  mistScale: 0.05, // 1/m, altitude falloff
};

export function installFog() {
  const f = (n: number) => n.toFixed(5);
  const sun = `vec3(${f(SUN_DIR.x)}, ${f(SUN_DIR.y)}, ${f(SUN_DIR.z)})`;

  THREE.ShaderChunk.fog_pars_vertex = /* glsl */ `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWP;
#endif`;

  THREE.ShaderChunk.fog_vertex = /* glsl */ `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWP = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;
#endif`;

  THREE.ShaderChunk.fog_pars_fragment = /* glsl */ `
#ifdef USE_FOG
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying float vFogDepth;
  varying vec3 vFogWP;
#endif`;

  THREE.ShaderChunk.fog_fragment = /* glsl */ `
#ifdef USE_FOG
{
  vec3 heRd = vFogWP - cameraPosition;
  float heDist = length(heRd);
  vec3 heDir = heRd / max(heDist, 1e-4);
  float heF1 = 1.0 - exp(-fogNear * fogNear * heDist * heDist);
  float heK = heDir.y * ${f(FOG.mistScale)};
  float heInteg = abs(heK * heDist) < 1e-3 ? heDist : (1.0 - exp(-heK * heDist)) / heK;
  float heOd = ${f(FOG.mistDensity)} * exp(-(cameraPosition.y - ${f(FOG.mistBase)}) * ${f(FOG.mistScale)}) * heInteg;
  float heF2 = 1.0 - exp(-max(heOd, 0.0));
  float heFog = 1.0 - (1.0 - heF1) * (1.0 - heF2);
  float heSun = pow(max(dot(heDir, ${sun}), 0.0), 5.0);
  vec3 heCol = mix(fogColor, vec3(1.0, 0.74, 0.46) * 1.15, heSun * 0.62 * heF1);
  heCol = mix(heCol, vec3(0.78, 0.84, 0.90), heF2 * (1.0 - heF1) * 0.55);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, heCol, clamp(heFog, 0.0, 1.0));
}
#endif`;
}
