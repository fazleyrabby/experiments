import * as THREE from 'three';
import { Perlin, clamp, lerp, sstep } from './util.js';
import { woodMaterial } from './materials.js';

const N = new Perlin(20261);
const N2 = new Perlin(771);

export const WORLD = {
  R: 14.6,
  floor: -3.1,
  base: -4.35,
  hut: { x: 3.1, z: 2.1, rot: 0.2, y: 0.74, scale: 0.8 },
};

const smax = (a, b, k) => {
  const h = clamp(0.5 + (0.5 * (a - b)) / k);
  return lerp(b, a, h) + k * h * (1 - h);
};

export function landField(x, z) {
  const wx = x + 1.3 * N.fbm(x * 0.085 + 7.1, z * 0.085 - 2.3, 3);
  const wz = z + 1.3 * N.fbm(x * 0.085 - 4.4, z * 0.085 + 9.2, 3);
  const a = 1 - Math.hypot((wx + 1.1) / 8.9, (wz + 1.3) / 7.6);
  const b = 1 - Math.hypot((wx - 4.4) / 4.9, (wz - 1.8) / 4.6);
  const c = 1 - Math.hypot((wx + 5.3) / 3.9, (wz - 3.6) / 3.2);
  let f = smax(smax(a, b, 0.2), c, 0.18);
  const cove = 1 - Math.hypot((x - 3.6) / 2.7, (z - 7.0) / 2.5);
  f -= 0.62 * sstep(-0.25, 0.9, cove);
  return f;
}

export function heightAt(x, z) {
  const f = landField(x, z);
  let h;
  if (f < 0) {
    const t = clamp(-f / 0.7);
    h = -2.45 * Math.pow(t, 1.12) + N2.fbm(x * 0.22, z * 0.22, 3) * 0.24 * t;
  } else {
    const inl = sstep(0.07, 0.82, f);
    const ridge = N.ridged(x * 0.12 + 3.3, z * 0.12 - 8.1, 5);
    const m = N.fbm(x * 0.33, z * 0.33, 4);
    const hutD = Math.hypot((x - WORLD.hut.x) / 2.35, (z - WORLD.hut.z) / 2.0);
    const dome = (1 - Math.pow(1 - inl, 2.1)) * lerp(0.1, 1, sstep(0.9, 2.7, hutD));
    h = 0.34 * sstep(0, 0.1, f)
      + dome * (1.02 + 1.34 * ridge)
      + inl * m * 0.34
      + sstep(0.03, 0.22, f) * N2.fbm(x * 0.7, z * 0.7, 3) * 0.09;
  }
  const H = WORLD.hut;
  const pad = 1 - sstep(0.72, 1.25, Math.hypot((x - H.x) / 2.35, (z - H.z) / 2.0));
  if (pad > 0) h = lerp(h, H.y - 0.08, pad);
  const r = Math.hypot(x, z);
  return Math.min(h, lerp(10, -2.2, sstep(12.6, 14.4, r)));
}

export function normalAt(x, z, e = 0.06) {
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  return new THREE.Vector3(-dx, 2 * e, -dz).normalize();
}

export function toHutLocal(x, z) {
  const H = WORLD.hut;
  const dx = x - H.x;
  const dz = z - H.z;
  const c = Math.cos(H.rot);
  const s = Math.sin(H.rot);
  return { x: (c * dx - s * dz) / H.scale, z: (s * dx + c * dz) / H.scale };
}

/** True when a plant of radius `m` stays out of the hut, porch and dock. */
export function clearOfStructures(x, z, m = 0.2) {
  const l = toHutLocal(x, z);
  if (Math.abs(l.x) < 1.75 + m && l.z > -1.75 - m && l.z < 2.0 + m) return false;
  if (Math.abs(l.x) < 0.62 + m && l.z > 1.5 && l.z < 7.2 + m) return false;
  return true;
}

function terrainMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = (s) => {
    s.uniforms.tNoise = U.tNoise;
    s.uniforms.uTime = U.uTime;
    s.uniforms.uRim = { value: WORLD.R };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vWNor;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vWNor = normalize(mat3(modelMatrix) * objectNormal);`,
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWPos; varying vec3 vWNor;
         uniform sampler2D tNoise; uniform float uTime; uniform float uRim;
         float terrH; float terrRough; float terrBump;
         float caustic(vec2 p, float t) {
           float a = texture2D(tNoise, p * 0.052 + vec2(t * 0.011, t * 0.007)).r;
           float b = texture2D(tNoise, p * 0.071 - vec2(t * 0.009, -t * 0.013)).g;
           float c = 1.0 - abs(a - b) * 9.0;
           float d = 1.0 - abs(texture2D(tNoise, p * 0.13 + vec2(-t * 0.016, t * 0.012)).b - a) * 7.0;
           return pow(clamp(c, 0.0, 1.0), 5.0) + 0.55 * pow(clamp(d, 0.0, 1.0), 6.0);
         }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec3 P = vWPos;
         vec2 q = P.xz + P.y * vec2(0.37, -0.23);
         vec4 n0 = texture2D(tNoise, q * 0.019);
         vec4 n1 = texture2D(tNoise, q * 0.073);
         vec4 n2 = texture2D(tNoise, q * 0.29);
         vec4 n3 = texture2D(tNoise, q * 1.13);
         float grain = n2.a * 0.5 + n3.r * 0.5;
         float slope = 1.0 - clamp(vWNor.y, 0.0, 1.0);
         float y = P.y + (n1.r - 0.5) * 0.17 + (n2.g - 0.5) * 0.05;
         vec3 bedDeep = vec3(0.30, 0.36, 0.29), bed = vec3(0.56, 0.52, 0.38);
         vec3 wet = vec3(0.2, 0.158, 0.105), sand = vec3(0.47, 0.375, 0.255);
         vec3 soil = vec3(0.105, 0.07, 0.042), litter = vec3(0.17, 0.115, 0.055);
         vec3 mossA = vec3(0.055, 0.105, 0.024), mossB = vec3(0.125, 0.17, 0.04);
         vec3 rock = mix(vec3(0.075, 0.07, 0.06), vec3(0.18, 0.165, 0.14), n2.b);
         rock = mix(rock, mossA * 1.25, smoothstep(0.36, 0.62, n1.g * 0.6 + n2.r * 0.4));
         vec3 c = mix(bedDeep, bed, smoothstep(-1.7, -0.25, y));
         c = mix(c, wet, smoothstep(-0.22, -0.02, y));
         c = mix(c, sand * (0.82 + grain * 0.32), smoothstep(0.035, 0.15, y));
         vec3 ground = mix(soil, litter, smoothstep(0.38, 0.68, n1.g));
         vec3 moss = mix(mossA, mossB, smoothstep(0.34, 0.7, n1.b * 0.6 + n2.r * 0.4));
         ground = mix(ground, moss, smoothstep(0.34, 0.6, n0.r * 0.45 + n1.r * 0.35 + n2.g * 0.2 + (y - 0.5) * 0.1));
         c = mix(c, ground * (0.74 + grain * 0.52), smoothstep(0.24, 0.46, y + (n1.a - 0.5) * 0.18));
         float rocky = smoothstep(0.34, 0.56, slope + (n1.b - 0.5) * 0.28) * smoothstep(0.2, 0.42, y);
         c = mix(c, rock * (0.68 + n3.g * 0.62), rocky);
         terrRough = mix(0.96, 0.82, rocky);
         terrBump = mix(0.012, 0.042, rocky) + smoothstep(0.24, 0.46, y) * 0.016;
         terrH = rocky > 0.5 ? n2.b * 0.6 + n3.a * 0.4 : grain;
         float wetness = 1.0 - smoothstep(-0.015, 0.12, y + sin(uTime * 0.42 + P.x * 0.7 + P.z * 0.5) * 0.018);
         c *= mix(1.0, 0.58, wetness);
         terrRough = mix(terrRough, 0.46, wetness);
         float rimR = length(P.xz);
         if (rimR > uRim - 0.018 && abs(vWNor.y) < 0.35) {
           float bandY = P.y + (n1.r - 0.5) * 0.18 + sin(atan(P.z, P.x) * 9.0) * 0.025;
           float s1 = smoothstep(-2.82, -2.74, bandY), s2 = smoothstep(-2.42, -2.36, bandY), s3 = smoothstep(-2.72, -2.66, bandY);
           vec3 strata = mix(vec3(0.095, 0.07, 0.05), vec3(0.34, 0.27, 0.18), s1);
           strata = mix(strata, vec3(0.2, 0.155, 0.1), s3 * (1.0 - s2) * 0.72);
           strata = mix(strata, vec3(0.58, 0.49, 0.34), s2);
           float pebble = smoothstep(0.66, 0.72, texture2D(tNoise, vec2(atan(P.z, P.x) * 4.6, P.y * 0.42)).a);
           c = mix(strata * (0.72 + grain * 0.5), vec3(0.11, 0.1, 0.09), pebble * 0.8);
           terrRough = 0.95;
           terrBump = 0.03;
         }
         if (P.y < 0.0) {
           float depthFade = exp(P.y * 0.72);
           c *= 1.0 + caustic(P.xz, uTime) * 0.62 * depthFade;
         }
         diffuseColor.rgb = c;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = terrRough;',
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           vec3 vp = -vViewPosition;
           vec3 dpx = dFdx(vp), dpy = dFdy(vp);
           float dhx = dFdx(terrH), dhy = dFdy(terrH);
           vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
           float det = dot(dpx, r1);
           vec3 grad = sign(det) * (dhx * r1 + dhy * r2) * terrBump;
           normal = normalize(abs(det) * normal - grad);
         }`,
      );
  };
  m.customProgramCacheKey = () => 'terrain';
  return m;
}

function buildTerrainGeometry() {
  const rings = 250;
  const segs = 600;
  const count = rings * segs + 1;
  const pos = new Float32Array(count * 3);
  pos[0] = 0;
  pos[1] = heightAt(0, 0);
  pos[2] = 0;
  let k = 3;
  for (let i = 1; i <= rings; i++) {
    const r = WORLD.R * Math.pow(i / rings, 0.82);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      pos[k++] = x;
      pos[k++] = heightAt(x, z);
      pos[k++] = z;
    }
  }
  const idx = new Uint32Array((segs * 3 + (rings - 1) * segs * 6));
  let n = 0;
  for (let j = 0; j < segs; j++) {
    idx[n++] = 0;
    idx[n++] = 1 + ((j + 1) % segs);
    idx[n++] = 1 + j;
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < segs; j++) {
      const a = 1 + i * segs + j;
      const b = 1 + i * segs + ((j + 1) % segs);
      const c = 1 + (i + 1) * segs + j;
      const d = 1 + (i + 1) * segs + ((j + 1) % segs);
      idx[n++] = a;
      idx[n++] = b;
      idx[n++] = c;
      idx[n++] = b;
      idx[n++] = d;
      idx[n++] = c;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

function buildSkirt() {
  const segs = 600;
  const pos = new Float32Array((segs + 1) * 2 * 3);
  const nor = new Float32Array((segs + 1) * 2 * 3);
  const idx = [];
  for (let j = 0; j <= segs; j++) {
    const a = (j / segs) * Math.PI * 2;
    const x = Math.cos(a) * WORLD.R;
    const z = Math.sin(a) * WORLD.R;
    const k = j * 6;
    pos.set([x, heightAt(x, z), z, x, WORLD.floor, z], k);
    nor.set([Math.cos(a), 0, Math.sin(a), Math.cos(a), 0, Math.sin(a)], k);
    if (j < segs) {
      const i = j * 2;
      idx.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

function buildPlinth(U) {
  const R = WORLD.R;
  const top = WORLD.floor;
  const b = WORLD.base;
  const profile = [
    [0, top - 0.02], [R + 0.03, top - 0.02], [R + 0.05, top], [R + 0.12, top - 0.015],
    [R + 0.16, top - 0.06], [R + 0.16, top - 0.2], [R + 0.11, top - 0.25], [R + 0.11, top - 0.3],
    [R + 0.25, top - 0.42], [R + 0.3, top - 0.62], [R + 0.3, b + 0.2], [R + 0.42, b + 0.14],
    [R + 0.45, b + 0.06], [R + 0.42, b],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(profile, 200);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 48, uv.getY(i) * 3.2);
  const col = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < col.length; i += 3) {
    col[i] = 0.17;
    col[i + 1] = 0.085;
    col[i + 2] = 0.045;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const walnut = new THREE.Mesh(geo, woodMaterial(U, { rough: 0.34, grainScale: 1, polish: 1 }));
  walnut.castShadow = walnut.receiveShadow = true;

  const brass = new THREE.Mesh(
    new THREE.TorusGeometry(R + 0.17, 0.035, 12, 220),
    new THREE.MeshStandardMaterial({ color: 0xb08a4a, metalness: 1, roughness: 0.3 }),
  );
  brass.rotation.x = Math.PI / 2;
  brass.position.y = top - 0.13;
  const group = new THREE.Group();
  group.add(walnut, brass);
  return group;
}

export function buildTerrain(U) {
  const group = new THREE.Group();
  const mat = terrainMaterial(U);
  const land = new THREE.Mesh(buildTerrainGeometry(), mat);
  land.castShadow = land.receiveShadow = true;
  const skirt = new THREE.Mesh(buildSkirt(), mat);
  skirt.receiveShadow = true;
  group.add(land, skirt, buildPlinth(U));

  const size = 256;
  const data = new Float32Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const wx = ((x + 0.5) / size - 0.5) * 2 * WORLD.R;
      const wz = ((y + 0.5) / size - 0.5) * 2 * WORLD.R;
      const i = (x + y * size) * 4;
      data[i] = Math.hypot(wx, wz) > WORLD.R ? 1 : heightAt(wx, wz);
      data[i + 3] = 1;
    }
  }
  const heightTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  heightTex.minFilter = heightTex.magFilter = THREE.NearestFilter;
  heightTex.needsUpdate = true;
  return { group, heightTex };
}
