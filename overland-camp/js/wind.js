// Shared vegetation wind: one set of uniforms drives trees, shrubs and ferns so
// gusts roll across the whole forest together. Patched into standard materials
// (and their shadow depth materials) with onBeforeCompile.
import * as THREE from 'three';

export const windUniforms = {
  uWindTime: { value: 0 },
  uWindStrength: { value: 0.4 },
  uWindDir: { value: new THREE.Vector2(0.88, 0.47) },
  uRainHit: { value: 0 }
};

const WIND_PARS = /* glsl */`
  uniform float uWindTime;
  uniform float uWindStrength;
  uniform vec2 uWindDir;
  uniform float uRainHit;
  attribute float aFlutter;
  float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float wNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y);
  }
`;

// kind: 'tree' (whole-trunk bend + branch bob + leaf flutter),
//       'plant' (low plants: bend from the base, stronger flutter)
function windChunk(kind) {
  return /* glsl */`
    #include <begin_vertex>
    {
      #ifdef USE_INSTANCING
        vec3 wRoot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #else
        vec3 wRoot = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #endif
      float ph = dot(wRoot.xz, vec2(0.37, 0.23));
      // Travelling gust field: slow bright bands of wind sweeping through
      float gust = wNoise(wRoot.xz * 0.06 - uWindDir * uWindTime * 0.35);
      gust = smoothstep(0.25, 0.9, gust);
      float s = uWindStrength * (0.55 + gust * 0.9);
      ${kind === 'tree' ? `
      float hN = max(position.y, 0.0) / 12.0;
      float bend = hN * hN;
      float sway = sin(uWindTime * 0.62 + ph) * 0.6 + sin(uWindTime * 1.13 + ph * 1.7) * 0.25 + gust * 0.9;
      vec3 dirL = vec3(uWindDir.x, 0.0, uWindDir.y);
      transformed.xz += dirL.xz * sway * bend * s * 0.55;
      transformed.y -= bend * s * s * 0.06;
      // Branches bob with their reach from the trunk
      float reach = length(position.xz);
      transformed.y += sin(uWindTime * 1.7 + ph + reach * 1.3) * reach * 0.012 * s;
      // Leaves / needle sprays flutter at their free edge
      float fl = aFlutter;
      transformed += vec3(
        sin(uWindTime * 6.1 + ph * 3.0 + position.y * 2.1),
        sin(uWindTime * 7.3 + ph * 2.0 + position.x * 2.7) * 0.8,
        cos(uWindTime * 5.4 + ph * 2.6 + position.z * 1.9)
      ) * fl * (0.012 + s * 0.03);
      // Raindrops knocking the leaves
      transformed.y -= fl * uRainHit * 0.02 * step(0.92, fract(sin(dot(position, vec3(12.9, 78.2, 37.7)) + floor(uWindTime * 9.0)) * 4375.85));
      ` : `
      float hN = clamp(position.y / 0.9, 0.0, 1.0);
      float bend = hN * hN;
      float sway = sin(uWindTime * 1.4 + ph) * 0.5 + gust;
      transformed.xz += uWindDir * sway * bend * s * 0.18;
      transformed += vec3(
        sin(uWindTime * 4.7 + ph * 3.0 + position.x * 5.0),
        sin(uWindTime * 6.3 + ph * 2.0 + position.z * 4.0) * 0.6,
        cos(uWindTime * 4.1 + ph * 2.6 + position.y * 5.0)
      ) * aFlutter * (0.01 + s * 0.035);
      transformed.y -= aFlutter * uRainHit * 0.025 * step(0.9, fract(sin(dot(position, vec3(12.9, 78.2, 37.7)) + floor(uWindTime * 8.0)) * 4375.85));
      `}
    }
  `;
}

export function applyWind(material, kind = 'tree') {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    if (prev) prev(shader, renderer);
    Object.assign(shader.uniforms, windUniforms);
    shader.vertexShader = WIND_PARS + shader.vertexShader.replace('#include <begin_vertex>', windChunk(kind));
  };
  material.customProgramCacheKey = () => 'wind_' + kind + (material.alphaTest > 0 ? '_a' : '');
  return material;
}

// Matching depth material so shadows sway with the foliage
export function windDepthMaterial(map, alphaTest, kind = 'tree') {
  const m = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: map || null,
    alphaTest: alphaTest || 0
  });
  return applyWind(m, kind);
}

// Every wind-patched geometry needs an aFlutter attribute (0 = rigid)
export function ensureFlutter(geo, value = 0) {
  if (!geo.attributes.aFlutter) {
    geo.setAttribute('aFlutter', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count).fill(value), 1));
  }
  return geo;
}

export function updateWind(time, strength, rain = 0) {
  windUniforms.uWindTime.value = time;
  windUniforms.uWindStrength.value += (strength - windUniforms.uWindStrength.value) * 0.02;
  windUniforms.uRainHit.value += (rain - windUniforms.uRainHit.value) * 0.02;
}
