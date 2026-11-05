import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HASH, NOISE2, ATMOS, CLOUD_SHADOW, HEADLIGHT } from './glsl.js';

// One lit material for every hard-surface prop (guardrail, posts, vehicles).
// Per-vertex attributes carry albedo (color) and pbr = (roughness, metalness, emissive).
// interior: the cabin of our own car, mostly shaded by its roof and lit through the glass.
export function createPropMaterial(shared, { interior = false } = {}) {
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    defines: interior ? { INTERIOR: 1 } : {},
    uniforms: { ...shared },
    vertexShader: /* glsl */ `
      in vec3 color;
      in vec3 pbr;
      out vec3 vW;
      out vec3 vN;
      out vec3 vAlb;
      out vec3 vPbr;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vAlb = color;
        vPbr = pbr;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${HASH}
      ${NOISE2}
      ${ATMOS}
      ${CLOUD_SHADOW}
      ${HEADLIGHT}
      uniform vec3 uCamW;
      in vec3 vW;
      in vec3 vN;
      in vec3 vAlb;
      in vec3 vPbr;
      out vec4 outColor;
      void main() {
        vec3 n = normalize(vN);
        if (!gl_FrontFacing) n = -n;
        vec3 V = vW - cameraPosition;
        float dist = length(V);
        vec3 vd = V / dist;
        if (dot(n, vd) > 0.0) n = normalize(n - vd * dot(n, vd) * 1.01);
        float rough = vPbr.x, metal = vPbr.y;
        vec3 alb = vAlb;
        // a little grime so nothing looks freshly modelled
        float g = noise(vW.xz * 3.1 + vW.y * 2.3) * 0.5 + 0.5;
        alb *= 0.9 + 0.1 * g;
        float shadow = cloudShadow(vec3(vW.x - uCamW.x, vW.y, vW.z - uCamW.z));
        #ifdef INTERIOR
        shadow *= 0.1 + 0.3 * smoothstep(0.2, 0.9, n.y);
        #endif
        vec3 l = uSunDir;
        vec3 v = -vd;
        vec3 h = normalize(l + v);
        float ndl = max(dot(n, l), 0.0);
        float ndv = max(dot(n, v), 1e-3);
        float ndh = max(dot(n, h), 0.0);
        float a = rough * rough;
        float a2 = a * a;
        float dd = ndh * ndh * (a2 - 1.0) + 1.0;
        float D = a2 / (PI * dd * dd);
        float k = (rough + 1.0) * (rough + 1.0) / 8.0;
        float G = (ndl / (ndl * (1.0 - k) + k)) * (ndv / (ndv * (1.0 - k) + k));
        vec3 F0 = mix(vec3(0.04), alb, metal);
        vec3 F = F0 + (1.0 - F0) * pow(1.0 - max(dot(h, v), 0.0), 5.0);
        vec3 spec = D * G * F / (4.0 * ndl * ndv + 1e-4);
        vec3 diff = alb * (1.0 - metal);
        vec3 L = uSunColor * shadow;
        vec3 col = (diff + spec * PI) * L * ndl;
        #ifdef INTERIOR
        col += diff * (uSkyAmbient * 0.6 + uGroundBounce * 0.4);
        #else
        col += diff * (uSkyAmbient * (0.6 + 0.4 * n.y) + uGroundBounce * (0.5 - 0.5 * n.y));
        #endif
        // environment: sky above the horizon, warm plain below
        vec3 r = reflect(vd, n);
        vec3 env = r.y > 0.0 ? skyLUT(r) : uGroundBounce * 1.4;
        vec3 Fe = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0) * (1.0 - rough);
        col += env * Fe * (1.0 - rough * 0.85);
        vec3 hl = headlights(vW, n);
        col += (diff + spec * PI * 0.5) * hl;
        // lamps glow, and retro-reflective tape and reflectors light up in our beams
        col += alb * vPbr.z * uLampBoost;
        col += alb * vPbr.z * 40.0 * hl;
        col = aerial(col, dist, vd, cameraPosition.y, vW.y);
        outColor = vec4(col, 1.0);
      }`,
  });
}

// Geometry helpers: every part is baked with its own colour and pbr values, then merged.
export function paint(geo, color, rough = 0.6, metal = 0, emissive = 0) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3), p = new Float32Array(n * 3);
  const col = new THREE.Color(color);
  for (let i = 0; i < n; i++) {
    c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    p[i * 3] = rough; p[i * 3 + 1] = metal; p[i * 3 + 2] = emissive;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('pbr', new THREE.BufferAttribute(p, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}

export function box(w, h, d, x, y, z, color, rough, metal, emissive) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return paint(g, color, rough, metal, emissive);
}

export function cyl(r, len, x, y, z, color, rough, metal, axis = 'x', seg = 18) {
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  g.translate(x, y, z);
  return paint(g, color, rough, metal);
}

export function merge(parts) {
  return mergeGeometries(parts, false);
}
