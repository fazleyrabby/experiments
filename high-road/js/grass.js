import * as THREE from 'three';
import { HASH, NOISE2, ATMOS, CLOUD_SHADOW, HEADLIGHT, FIELD, BIOME, WATER } from './glsl.js';
import { NEAR_H_GLSL } from './ground.js';

// Ground cover near the road: tufts, wild flowers, stones and trees. Each kind is a fixed
// grid of instances snapped to world cells around the camera; every cell hashes its own
// position, size and colour, so the cover stays put as the grid slides forward.
// The active land (scenes.js) sets colours and how much of each kind grows.

function gridGeometry(base, nx, nz, behind) {
  const g = new THREE.InstancedBufferGeometry();
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  const cell = new Float32Array(nx * nz * 2);
  let k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { cell[k++] = i - nx / 2; cell[k++] = behind - j; }
  g.setAttribute('cell', new THREE.InstancedBufferAttribute(cell, 2));
  g.instanceCount = nx * nz;
  return g;
}

// Shared vertex prologue: places one instance in its world cell. Each kind supplies a body
// that sets \`w\` (world position) and \`vCol\` (shaded, fogged colour).
function scatterMaterial(shared, cellSize, salt, body) {
  const C = cellSize.toFixed(3);
  return new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    uniforms: { ...shared, uOrigin: { value: new THREE.Vector2() }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      ${HASH}
      ${NOISE2}
      ${ATMOS}
      ${CLOUD_SHADOW}
      ${NEAR_H_GLSL}
      ${FIELD}
      ${BIOME}
      ${WATER}
      ${HEADLIGHT}
      in vec2 cell;
      in float tip;
      uniform vec2 uOrigin;
      uniform vec3 uCamW;
      uniform float uTime;
      out vec3 vCol;
      vec3 shade(vec3 alb, vec3 w, vec3 n, float sunK) {
        float sh = cloudShadow(vec3(w.x - uCamW.x, w.y, w.z - uCamW.z));
        vec3 col = alb * (uSunColor * sunK * sh + uSkyAmbient * (0.6 + 0.4 * n.y) + uGroundBounce * 0.4 + headlights(w, n));
        vec3 V = w - cameraPosition;
        float d = length(V);
        return aerial(col, d, V / d, cameraPosition.y, w.y);
      }
      void main() {
        vec2 c = uOrigin + cell * ${C};
        ivec2 ic = ivec2(floor(c / ${C} + 0.5)) + ivec2(${salt}, ${salt * 7});
        vec2 r = hash22(ic);
        vec2 p = c + (r - 0.5) * ${C};
        float rd = abs(roadU(p));
        vec2 q = p / PERIOD;
        float dist = length(p - uCamW.xz);
        vec3 w;
        float s;
        ${body.split('// -- placed')[0]}
        float gy = 0.0;
        if (s >= 0.01) {
          gy = nearH(p);
          if (uWater.y > 0.5 && gy < uWater.x + 0.6) s = 0.0;
        }
        if (s < 0.01) { vCol = vec3(0.0); gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
        ${body.split('// -- placed')[1]}
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      in vec3 vCol;
      out vec4 outColor;
      void main() { outColor = vec4(vCol, 1.0); }`,
  });
}

function withTip(g, tips) { g.setAttribute('tip', new THREE.Float32BufferAttribute(tips, 1)); return g; }

function tuftBase() {
  const pos = [], tip = [];
  const blades = 9;
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + i * 0.7;
    const lean = 0.25 + 0.35 * ((i * 37) % 10) / 10;
    const h = 0.55 + 0.45 * ((i * 53) % 10) / 10;
    const ca = Math.cos(a), sa = Math.sin(a), w = 0.035;
    pos.push(-sa * w, 0, ca * w, sa * w, 0, -ca * w, ca * lean * 0.5, h, sa * lean * 0.5);
    tip.push(0, 0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return withTip(g, tip);
}

// Three small flowers per instance: a thin stem and a five-petal star head (tip = 2).
function flowerBase() {
  const pos = [], tip = [];
  const spots = [[0, 0, 0.2], [0.09, 0.05, 0.15], [-0.06, 0.08, 0.12]];
  for (const [ox, oz, h] of spots) {
    pos.push(ox - 0.006, 0, oz, ox + 0.006, 0, oz, ox, h, oz);
    tip.push(0, 0, 0.5);
    for (let k = 0; k < 5; k++) {
      const a0 = (k / 5) * Math.PI * 2, a1 = a0 + 0.6, r = 0.05;
      pos.push(ox, h + 0.004, oz, ox + Math.cos(a0) * r, h, oz + Math.sin(a0) * r, ox + Math.cos(a1) * r, h, oz + Math.sin(a1) * r);
      tip.push(2, 2, 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return withTip(g, tip);
}

function stoneBase() {
  const g = new THREE.IcosahedronGeometry(0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 0.75 + 0.25 * Math.sin(x * 9.1 + z * 5.3);
    p.setXYZ(i, x * k * 1.2, Math.max(y, -0.1) * 0.55, z * k);
  }
  g.computeVertexNormals();
  g.deleteAttribute('uv');
  return withTip(g, new Array(p.count).fill(0));
}

// Merge parts that each carry a tip value: 0 for trunk, >0 for crown (its height fraction).
function treeParts(parts) {
  const pos = [], nor = [], tip = [];
  for (const [geo, tipFn] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      nor.push(N.getX(i), N.getY(i), N.getZ(i));
      tip.push(tipFn(P.getY(i)));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return withTip(g, tip);
}

// A spruce: a short trunk under three stacked, slightly drooping cones. ~6.4 m at scale 1.
function coniferBase() {
  const trunk = new THREE.CylinderGeometry(0.09, 0.15, 1.6, 5, 1, true).translate(0, 0.8, 0);
  const parts = [[trunk, () => 0]];
  const tiers = [[0.7, 1.55, 3.5], [2.1, 1.15, 3.0], [3.5, 0.78, 2.9]];
  for (const [y0, r, h] of tiers) {
    const c = new THREE.ConeGeometry(r, h, 8, 1, true);
    // droop the skirt so tiers read as boughs, not lampshades
    const P = c.attributes.position;
    for (let i = 0; i < P.count; i++) if (P.getY(i) < 0) P.setY(i, P.getY(i) - 0.25 * Math.sin(i * 2.3) ** 2);
    c.computeVertexNormals();
    c.translate(0, y0 + h / 2, 0);
    parts.push([c, (y) => 0.15 + 0.85 * Math.min(1, Math.max(0, (y - 0.5) / 6))]);
  }
  return treeParts(parts);
}

// A round-crowned broadleaf tree: trunk and two lumpy crowns. ~6.5 m at scale 1.
function broadleafBase() {
  const trunk = new THREE.CylinderGeometry(0.13, 0.22, 3.0, 6, 1, true).translate(0, 1.5, 0);
  const lump = (r, x, y, z, seed) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const vx = P.getX(i), vy = P.getY(i), vz = P.getZ(i);
      const k = 0.82 + 0.22 * Math.sin(vx * 3.1 + seed) * Math.cos(vz * 2.7 + vy * 1.9 + seed);
      P.setXYZ(i, vx * k, vy * k * 0.82, vz * k);
    }
    g.computeVertexNormals();
    return g.translate(x, y, z);
  };
  const tipFn = (y) => 0.2 + 0.8 * Math.min(1, Math.max(0, (y - 2.2) / 4.3));
  return treeParts([[trunk, () => 0], [lump(2.1, 0, 4.4, 0, 1.3), tipFn], [lump(1.5, 0.9, 3.5, 0.6, 4.1), tipFn], [lump(1.3, -0.8, 3.7, -0.5, 2.2), tipFn]]);
}

export function createGrass(shared) {
  const CELL = 0.85;
  const mat = scatterMaterial(shared, CELL, 0, /* glsl */ `
    float mdw = meadow(p);
    float dens = (0.62 + 0.35 * noiseP(q * 160.0, 160) + 0.25 * noiseP(q * 900.0, 900) - alkali(p) * 0.5) * uCover.x;
    float keep = step(hash12(ic + ivec2(7, 3)), dens) * step(uTerr2.w + 0.9, rd);
    s = (0.28 + 0.55 * r.x * r.y) * (1.0 + 0.4 * mdw) * keep * (1.0 - smoothstep(150.0, 235.0, dist));
    // -- placed
    float ang = r.y * 6.2831;
    float tall = uCover.y * (1.0 - 0.6 * uSnowCover);
    vec3 lp = position * vec3(s * 1.3, s * (0.7 + 0.4 * r.x) * tall, s * 1.3);
    lp.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * lp.xz;
    float sway = noise(p * 0.15 + vec2(uTime * 0.6, uTime * 0.2)) * 0.06 + sin(uTime * 2.3 + p.x * 0.7) * 0.015;
    lp.x += sway * tip * s;
    w = vec3(p.x, gy - 0.12 * uSnowCover, p.y) + lp;
    vec3 alb = mix(uTuftA, uTuftB, r.x);
    alb = mix(alb, mix(uTuftM * 0.85, uTuftM * 1.25, r.x), mdw * 0.8);
    alb = mix(alb * 0.45, alb, tip);
    vCol = shade(alb, w, vec3(0.0, 1.0, 0.0), (0.55 + 0.45 * tip) * 0.55);
  `);
  return gridMesh(gridGeometry(tuftBase(), 180, 300, 30), mat, CELL);
}

export function createFlowers(shared) {
  const CELL = 0.6;
  const mat = scatterMaterial(shared, CELL, 3, /* glsl */ `
    float mdw = meadow(p);
    // colonies: each ~7 m patch picks one colour
    ivec2 pc = ivec2(floor(p / 7.0));
    float pick = hash12(pc + ivec2(41, 9));
    float colony = smoothstep(0.25, 0.65, noiseP(q * 1100.0 + 0.3, 1100) * 0.5 + 0.5);
    float dens = (mdw * 0.95 * colony + 0.08 * colony + 0.2 * colony * (1.0 - smoothstep(9.0, 18.0, rd))) * uCover.z;
    float keep = step(hash12(ic + ivec2(5, 11)), dens) * step(uTerr2.w + 1.2, rd);
    s = (0.8 + 0.6 * r.x) * keep * (1.0 - smoothstep(70.0, 110.0, dist));
    // -- placed
    float ang = r.y * 6.2831;
    vec3 lp = position * s;
    lp.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * lp.xz;
    lp.x += (sin(uTime * 2.1 + p.y * 1.3) * 0.012 + noise(p * 0.2 + uTime * 0.5) * 0.02) * min(tip, 1.0) * s;
    w = vec3(p.x, gy, p.y) + lp;
    vec3 petal = pick < 0.3 ? vec3(0.42, 0.17, 0.62) : pick < 0.55 ? vec3(0.90, 0.70, 0.10)
               : pick < 0.75 ? vec3(0.92, 0.90, 0.84) : pick < 0.9 ? vec3(0.86, 0.30, 0.52) : vec3(0.26, 0.36, 0.86);
    petal *= 0.85 + 0.3 * r.y;
    vec3 alb = tip > 1.5 ? petal : uTuftM * 0.9;
    vCol = shade(alb, w, vec3(0.0, 1.0, 0.0), tip > 1.5 ? 0.85 : 0.5);
  `);
  return gridMesh(gridGeometry(flowerBase(), 120, 230, 20), mat, CELL);
}

export function createStones(shared) {
  const CELL = 2.6;
  const mat = scatterMaterial(shared, CELL, 5, /* glsl */ `
    float alk = alkali(p);
    float dens = (0.12 + 0.35 * alk + 0.25 * smoothstep(6.0, 8.0, rd) * (1.0 - smoothstep(9.0, 14.0, rd))) * uCover.w;
    float keep = step(hash12(ic + ivec2(13, 2)), dens) * step(uTerr2.w - 0.1, rd);
    s = (0.12 + 0.55 * pow(r.x, 3.0)) * keep * (1.0 - smoothstep(220.0, 320.0, dist));
    // -- placed
    float ang = r.y * 6.2831;
    mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec3 lp = position * s;
    lp.xz = R * lp.xz;
    vec3 nn = normal; nn.xz = R * nn.xz;
    w = vec3(p.x, gy - 0.04 * s, p.y) + lp;
    vec3 alb = mix(vec3(0.20, 0.19, 0.18), vec3(0.42, 0.38, 0.33), hash12(ic + ivec2(3, 3)));
    alb = mix(alb, uRedC * 0.75, step(0.8, r.y) * 0.6);
    alb = mix(alb, vec3(0.8, 0.83, 0.88), uSnowCover * smoothstep(0.2, 0.7, normalize(nn).y) * 0.85);
    vCol = shade(alb, w, nn, max(dot(normalize(nn), uSunDir), 0.0));
  `);
  return gridMesh(gridGeometry(stoneBase(), 70, 130, 8), mat, CELL);
}

// Trees shared body: place, scale, sway gently and shade crown vs trunk.
function treeBody(densExpr, salt, leaf) {
  return /* glsl */ `
    float fo = forest(p);
    float dens = ${densExpr};
    float clear = uTerr2.w + 3.0 + 5.0 * r.y;
    float keep = step(hash12(ic + ivec2(${salt}, 17)), dens) * step(clear, rd);
    s = (0.75 + 0.75 * r.x * r.x + 0.35 * fo) * keep * (1.0 - smoothstep(470.0, 600.0, dist));
    // -- placed
    float ang = r.y * 6.2831;
    mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
    vec3 lp = position * s * vec3(1.0, 0.9 + 0.3 * hash12(ic + ivec2(3, ${salt})), 1.0);
    lp.xz = R * lp.xz;
    vec3 nn = normal; nn.xz = R * nn.xz;
    float sway = (noise(p * 0.05 + uTime * 0.25) * 0.5 + 0.5) * 0.05 * tip * tip;
    lp.x += sway * lp.y * 0.1;
    w = vec3(p.x, gy - 0.2, p.y) + lp;
    nn = normalize(nn);
    vec3 crown = ${leaf};
    vec3 alb = tip > 0.01 ? crown * (0.55 + 0.6 * tip) : vec3(0.13, 0.09, 0.06);
    alb = mix(alb, vec3(0.78, 0.82, 0.88), uSnowCover * smoothstep(0.15, 0.7, nn.y) * step(0.01, tip) * 0.8);
    float wrap = max(dot(nn, uSunDir) * 0.6 + 0.4, 0.0) * (0.45 + 0.55 * tip);
    vCol = shade(alb, w, nn, wrap * (tip > 0.01 ? 1.0 : 0.6));
  `;
}

export function createConifers(shared) {
  const CELL = 6.2;
  const mat = scatterMaterial(shared, CELL, 9, treeBody('uTrees.x * mix(smoothstep(0.2, 0.75, fo), 1.0, uTrees.w)', 21,
    'uNeedle * (0.8 + 0.4 * r.x) * vec3(1.0, 1.0 + 0.2 * r.y, 1.0)'));
  const mesh = gridMesh(gridGeometry(coniferBase(), 92, 112, 10), mat, CELL);
  mesh.userData.kind = 'conifer';
  return mesh;
}

export function createBroadleaf(shared) {
  const CELL = 11;
  const mat = scatterMaterial(shared, CELL, 11, treeBody('uTrees.y * (fo * 0.7 + 0.08)', 29,
    'mix(uLeafA, uLeafB, r.x)'));
  const mesh = gridMesh(gridGeometry(broadleafBase(), 52, 64, 6), mat, CELL);
  mesh.userData.kind = 'broadleaf';
  return mesh;
}

function gridMesh(geo, material, cell) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.update = (camX, camZ, t) => {
    material.uniforms.uOrigin.value.set(Math.round(camX / cell) * cell, Math.round(camZ / cell) * cell);
    material.uniforms.uTime.value = t;
  };
  return mesh;
}
