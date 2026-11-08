// Forest floor: surface-shaded ground (mud, ruts, boot prints, puddles with
// live rain ripples, dry needle duff under the crowns), clumped wind-swept
// grass, ferns, leafy shrubs, wildflowers, stones, mossy boulders, a fallen log
// and a distant ridge line.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  getGroundMaps,
  getBarkMaps,
  getSoftDotTexture,
  getStoneMaps,
  getFernFrondTexture,
  getLeafClusterTexture
} from './textures.js';
import { scatterLeafLitter } from './decals.js';
import { makeRockGeometry } from './geo.js';
import { createSurface } from './surface.js';
import { mulberry32, IS_MOBILE, isCampZone } from './layout.js';
import { applyWind, ensureFlutter, windUniforms } from './wind.js';
import { GeoBuilder, addCard, hsl, stripLocalLights } from './trees.js';

const NOISE_GLSL = /* glsl */`
  float gHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  vec2 gHash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float gNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(gHash(i), gHash(i + vec2(1, 0)), f.x), mix(gHash(i + vec2(0, 1)), gHash(i + vec2(1, 1)), f.x), f.y);
  }
`;

export function createOverlandTerrain() {
  const terrainGroup = new THREE.Group();
  terrainGroup.name = 'CampTerrain';

  const isMobile = IS_MOBILE;
  const surface = createSurface();
  const groundHeight = surface.getHeight;
  const groundMaps = getGroundMaps();
  const rnd = mulberry32(31337);

  // -------------------------------------------------------------------------
  // 1. Ground mesh — vertices packed densely near camp, sparser at the edge
  // -------------------------------------------------------------------------
  const groundSize = 60;
  const segments = isMobile ? 150 : 280;
  const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);
  groundGeo.rotateX(-Math.PI * 0.5);
  const posAttr = groundGeo.attributes.position;
  const uvAttr = groundGeo.attributes.uv;
  const remap = (v) => Math.sign(v) * Math.pow(Math.abs(v) / 30, 1.5) * 30;
  const colors = [];
  const col = new THREE.Color();
  for (let i = 0; i < posAttr.count; i++) {
    const x = remap(posAttr.getX(i));
    const z = remap(posAttr.getZ(i));
    posAttr.setXYZ(i, x, groundHeight(x, z), z);
    uvAttr.setXY(i, (x + 30) / 60, 1 - (z + 30) / 60);

    const s = surface.sample(x, z);
    const n = Math.sin(x * 0.8) * Math.cos(z * 0.8);
    const patch = Math.sin(x * 0.21 + 2.1) * Math.cos(z * 0.19 - 1.4);
    // Open turf: deep green under grass; under crowns: brown needle duff
    col.setHSL(0.24 + patch * 0.012, 0.4, 0.16 + n * 0.025 + patch * 0.015);
    const duff = new THREE.Color().setHSL(0.075 + n * 0.01, 0.34, 0.15 + patch * 0.02);
    col.lerp(duff, Math.min(1, s.canopy * 1.3));
    const d = Math.hypot(x - 1.2, z - 0.8);
    if (d < 3.4) col.lerp(new THREE.Color().setHSL(0.09, 0.32, 0.17), (1 - d / 3.4) * 0.6);
    colors.push(col.r, col.g, col.b);
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeo.computeVertexNormals();

  const groundUniforms = {
    uSurf: { value: surface.texture },
    uSurfExtent: { value: surface.extent },
    uSurfTexel: { value: 1 / surface.texture.image.width },
    uTime: { value: 0 },
    uRain: { value: 1 },
    uWet: { value: 1 }
  };

  const groundMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: groundMaps.map,
    normalMap: groundMaps.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: groundMaps.roughnessMap,
    roughness: 0.96,
    metalness: 0.0,
    envMapIntensity: 0.85
  });
  groundMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, groundUniforms);
    shader.vertexShader = 'varying vec3 vGWorld;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       vGWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`
    );
    shader.fragmentShader = `
      uniform sampler2D uSurf;
      uniform float uSurfExtent;
      uniform float uSurfTexel;
      uniform float uTime;
      uniform float uRain;
      uniform float uWet;
      varying vec3 vGWorld;
      ${NOISE_GLSL}
      // Expanding rain rings on standing water: two jittered cell layers
      vec2 rippleNormal(vec2 p, float t) {
        vec2 acc = vec2(0.0);
        for (int layer = 0; layer < 2; layer++) {
          float scale = layer == 0 ? 3.1 : 4.9;
          vec2 q = p * scale + float(layer) * 17.3;
          vec2 cell = floor(q);
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 c = cell + vec2(float(i), float(j));
              vec2 h = gHash2(c + float(layer) * 31.7);
              vec2 center = c + 0.15 + h * 0.7;
              float ph = fract(t * (0.75 + h.y * 0.6) + h.x * 13.0);
              vec2 d = q - center;
              float dist = length(d);
              float x = dist - ph * 1.05;
              float ring = sin(x * 40.0) * exp(-x * x * 140.0);
              float fade = (1.0 - ph) * (1.0 - ph);
              acc += (d / max(dist, 1e-3)) * ring * fade;
            }
          }
        }
        return acc;
      }
    ` + shader.fragmentShader
      .replace('#include <map_fragment>', `
        #include <map_fragment>
        vec2 sUv = vGWorld.xz / uSurfExtent + 0.5;
        float sIn = step(0.0, sUv.x) * step(sUv.x, 1.0) * step(0.0, sUv.y) * step(sUv.y, 1.0);
        vec4 surf = texture2D(uSurf, sUv);
        float gMud = surf.r * sIn;
        float gCanopy = surf.b * sIn;
        float gWet = uWet * (1.0 - gCanopy * 0.55);
        float fill = 0.12 + 0.72 * uWet;
        float gWater = smoothstep(1.0 - fill, 1.0 - fill + 0.1, surf.g * sIn);
        float mudMask = smoothstep(0.08, 0.6, gMud);
        float mn = gNoise(vGWorld.xz * 2.7) * 0.6 + gNoise(vGWorld.xz * 11.0) * 0.4;
        vec3 mudCol = mix(vec3(0.16, 0.125, 0.095), vec3(0.29, 0.235, 0.18), mn);
        mudCol *= 0.85 + (surf.a - 0.5) * 1.1;
        // small stones and grit pressed into the mud
        float grit = step(0.93, gHash(floor(vGWorld.xz * 38.0)));
        mudCol = mix(mudCol, vec3(0.34, 0.31, 0.27), grit * 0.6);
        diffuseColor.rgb = mix(diffuseColor.rgb, mudCol * (0.85 + diffuseColor.rgb * 0.6), mudMask);
        // Porous ground darkens as it soaks
        diffuseColor.rgb *= 1.0 - gWet * (0.22 + 0.28 * mudMask);
        // Standing water: dark and murky
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.2 + vec3(0.01, 0.012, 0.011), gWater);
      `)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, mix(0.82, 0.34, gWet), mudMask);
        roughnessFactor = mix(roughnessFactor, 0.07, gWater);
      `)
      .replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        {
          float e = uSurfTexel;
          float hL = texture2D(uSurf, sUv - vec2(e, 0.0)).a;
          float hR = texture2D(uSurf, sUv + vec2(e, 0.0)).a;
          float hD = texture2D(uSurf, sUv - vec2(0.0, e)).a;
          float hU = texture2D(uSurf, sUv + vec2(0.0, e)).a;
          vec3 microW = vec3(-(hR - hL), 0.0, -(hU - hD)) * 2.2 * sIn * (1.0 - gWater);
          vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
          normal = normalize(mix(normal, upV, gWater * 0.94));
          float rippleAmt = uRain * (gWater + mudMask * gWet * 0.3) * (1.0 - gCanopy * 0.85);
          if (rippleAmt > 0.01) {
            vec2 rp = rippleNormal(vGWorld.xz, uTime);
            microW.xz += rp * rippleAmt * 0.32;
          }
          normal = normalize(normal + (viewMatrix * vec4(microW, 0.0)).xyz);
        }
      `);
  };

  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.receiveShadow = true;
  terrainGroup.add(groundMesh);

  // Distant meadow floor to carry the eye to the horizon
  const farMap = groundMaps.map.clone();
  farMap.repeat.set(34, 34);
  farMap.needsUpdate = true;
  const farMat = new THREE.MeshStandardMaterial({ color: 0x1f2a1b, map: farMap, roughness: 1.0, metalness: 0.0 });
  const farPlane = new THREE.Mesh(new THREE.PlaneGeometry(320, 320, 1, 1), farMat);
  farPlane.rotation.x = -Math.PI * 0.5;
  farPlane.position.y = -0.32;
  farPlane.receiveShadow = true;
  terrainGroup.add(farPlane);

  const dummy = new THREE.Object3D();

  const isClearOfCamp = (x, z, pad = 0) =>
    !(x > -1.0 - pad && x < 3.5 + pad && z > -2.1 - pad && z < 3.1 + pad) &&
    !(x > -3.8 - pad && x < 0.8 + pad && z > -2.6 - pad && z < 3.8 + pad) &&
    !(Math.hypot(x - 4.9, z - 3.3) < 1.7 + pad);

  // -------------------------------------------------------------------------
  // 2. Clumped grass — five blades per instance, gusts roll across the meadow
  // -------------------------------------------------------------------------
  function makeClumpGeometry() {
    const positions = [];
    const normals = [];
    const bladeAttr = [];
    const cols = [];
    const indices = [];
    const SEG = 4;
    const BLADES = 5;
    const r = mulberry32(42);
    const c = new THREE.Color();
    for (let b = 0; b < BLADES; b++) {
      const a = (b / BLADES) * Math.PI * 2 + r() * 0.9;
      const off = 0.015 + r() * 0.05;
      const ox = Math.cos(a) * off, oz = Math.sin(a) * off;
      const h = 0.3 + r() * 0.26;
      const lean = 0.08 + r() * 0.18;
      const yaw = a + (r() - 0.5) * 1.2;
      const fx = Math.cos(yaw), fz = Math.sin(yaw);
      const wBase = 0.011 + r() * 0.008;
      const ph = r();
      const base = positions.length / 3;
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        const w = wBase * (1 - Math.pow(t, 1.6) * 0.92);
        const forward = Math.pow(t, 1.8) * lean;
        const cx = ox + fx * forward;
        const cz = oz + fz * forward;
        const y = t * h - Math.pow(t, 2) * lean * 0.35;
        // blade faces sideways relative to its lean
        const sx = -fz * w, sz = fx * w;
        positions.push(cx - sx, y, cz - sz, cx + sx, y, cz + sz);
        // normals bent up so the meadow lights as a soft volume
        const nx = fx * 0.35, nz = fz * 0.35;
        normals.push(nx, 0.94, nz, nx, 0.94, nz);
        bladeAttr.push(t, ph, t, ph);
        c.setHSL(0.235 - t * 0.02, 0.45, 0.07 + t * 0.32);
        cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
      for (let i = 0; i < SEG; i++) {
        const a0 = base + i * 2;
        indices.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('aBlade', new THREE.Float32BufferAttribute(bladeAttr, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(indices);
    return geo;
  }

  const grassUniforms = {
    uTime: { value: 0 },
    uWindStrength: { value: 0.3 },
    uRainTap: { value: 1 }
  };
  const grassMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.0,
    envMapIntensity: 0.5
  });
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = grassUniforms.uTime;
    shader.uniforms.uWindStrength = grassUniforms.uWindStrength;
    shader.uniforms.uRainTap = grassUniforms.uRainTap;
    shader.uniforms.uWindDir = windUniforms.uWindDir;
    shader.vertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uRainTap;
      uniform vec2 uWindDir;
      attribute vec2 aBlade;
      ${NOISE_GLSL}
    ` + shader.vertexShader.replace('#include <project_vertex>', `
      vec4 gw = vec4(transformed, 1.0);
      vec2 root = vec2(0.0);
      #ifdef USE_INSTANCING
        gw = instanceMatrix * gw;
        root = instanceMatrix[3].xz;
      #endif
      gw = modelMatrix * gw;
      float tB = aBlade.x;
      float phB = aBlade.y;
      float bend = tB * tB;
      // Bright gust bands drifting across the field
      float gust = smoothstep(0.3, 0.88, gNoise(root * 0.11 - uWindDir * uTime * 0.55));
      float sway = (sin(uTime * 1.8 + dot(root, vec2(1.3, 0.9)) + phB * 2.0) * 0.32 + 0.22 + gust * 1.05) * uWindStrength;
      vec2 off = uWindDir * sway * 0.2
        + vec2(sin(uTime * 3.7 + phB * 6.3 + root.x), cos(uTime * 4.3 + phB * 5.1 + root.y)) * 0.014 * (0.4 + uWindStrength);
      // Raindrops tapping individual blades down
      float tap = step(0.982, fract(sin(phB * 91.7 + root.x * 3.1 + floor(uTime * 6.0 + phB * 5.0)) * 43758.5)) * uRainTap;
      gw.xz += off * bend;
      gw.y -= (dot(off, off) * 1.6 + tap * 0.045) * bend;
      vec4 mvPosition = viewMatrix * gw;
      gl_Position = projectionMatrix * mvPosition;
    `);
  };

  const clumpGeo = makeClumpGeometry();
  const grassCount = isMobile ? 13000 : 30000;
  // Grass is chunked on an 8 m grid so the camera frustum can skip whole patches
  const CHUNK = 8;
  const chunks = new Map();
  let placedCount = 0;
  for (let i = 0; i < grassCount * 3 && placedCount < grassCount; i++) {
    const radius = Math.sqrt(rnd()) * 22;
    const angle = rnd() * Math.PI * 2;
    const x = 0.8 + Math.cos(angle) * radius;
    const z = 1.0 + Math.sin(angle) * radius;
    if (!isClearOfCamp(x, z, 0.05)) continue;
    const s = surface.sample(x, z);
    if (s.water > 0.25) continue;
    if (rnd() < s.mud * 1.25) continue;
    if (rnd() < s.canopy * 0.8) continue;
    const clump = Math.sin(x * 0.42) * Math.cos(z * 0.37) + Math.sin(x * 0.11 - z * 0.2);
    if (clump < -0.7 && rnd() < 0.5) continue;

    const campD = Math.hypot(x - 1.3, z - 0.9);
    const campFactor = THREE.MathUtils.smoothstep(campD, 2.8, 8.5);
    const trample = 1 - s.mud * 0.6;
    const h = (0.7 + rnd() * 0.5 + Math.max(0, clump) * 0.15) * (0.45 + campFactor * 0.65) * trample;
    dummy.position.set(x, groundHeight(x, z) - 0.01, z);
    dummy.rotation.set((rnd() - 0.5) * 0.25, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.25);
    const wsc = 0.85 + rnd() * 0.4;
    dummy.scale.set(wsc, h, wsc);
    dummy.updateMatrix();

    const dry = rnd() < 0.07;
    col.setHSL(
      dry ? 0.13 + rnd() * 0.03 : 0.235 + (rnd() - 0.5) * 0.04,
      dry ? 0.35 : 0.36 + (rnd() - 0.5) * 0.12,
      (dry ? 0.62 : 0.5) + (rnd() - 0.5) * 0.16
    );
    const key = Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK);
    if (!chunks.has(key)) chunks.set(key, []);
    chunks.get(key).push({ m: dummy.matrix.clone(), c: col.clone() });
    placedCount++;
  }
  const grassMeshes = [];
  // Far patches skip the camp's point/spot lights (they can't reach them)
  const grassFarMat = grassMat.clone();
  grassFarMat.onBeforeCompile = grassMat.onBeforeCompile;
  stripLocalLights(grassFarMat);
  chunks.forEach((list, key) => {
    const [cx, cz] = key.split(',').map(v => (parseInt(v, 10) + 0.5) * CHUNK);
    const farChunk = Math.hypot(cx - 1.5, cz - 1.5) > 13;
    const mesh = new THREE.InstancedMesh(clumpGeo, farChunk ? grassFarMat : grassMat, list.length);
    list.forEach((it, k) => { mesh.setMatrixAt(k, it.m); mesh.setColorAt(k, it.c); });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    mesh.computeBoundingSphere();
    // pad for wind sway
    mesh.boundingSphere.radius += 0.4;
    terrainGroup.add(mesh);
    grassMeshes.push(mesh);
  });

  // -------------------------------------------------------------------------
  // 3. Ferns — arching fronds with real pinnae, clustered in shade
  // -------------------------------------------------------------------------
  function makeFernGeometry(seed) {
    const r = mulberry32(seed);
    const b = new GeoBuilder();
    const fronds = 9;
    for (let f = 0; f < fronds; f++) {
      const yaw = (f / fronds) * Math.PI * 2 + r() * 0.5;
      const L = 0.55 + r() * 0.35;
      const lift = 0.95 + r() * 0.35;
      const w = L * 0.36;
      const SEG = 7;
      const dir = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      const base = b.count;
      const color = hsl(0.25 + (r() - 0.5) * 0.03, 0.42, 0.42 + r() * 0.1);
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG;
        // arch up then droop toward the tip
        const out = L * t * 0.92;
        const y = L * (lift * t - 1.05 * t * t) + 0.02;
        const cp = new THREE.Vector3().addScaledVector(dir, out);
        cp.y = y;
        const wt = w * (0.35 + Math.sin(Math.min(1, t * 1.15 + 0.1) * Math.PI) * 0.65) * (1 - t * 0.3);
        // slight twist so fronds catch light differently
        const twist = (t - 0.3) * 0.5 * (f % 2 ? 1 : -1);
        const sd = side.clone().applyAxisAngle(dir, twist);
        const n = new THREE.Vector3().crossVectors(dir, sd).normalize();
        if (n.y < 0) n.negate();
        n.lerp(new THREE.Vector3(0, 1, 0), 0.4).normalize();
        const shade = 0.6 + t * 0.4;
        const c = [color[0] * shade, color[1] * shade, color[2] * shade];
        b.vert(cp.clone().addScaledVector(sd, -wt * 0.5), n, 0, t, c, t);
        b.vert(cp.clone().addScaledVector(sd, wt * 0.5), n, 1, t, c, t);
      }
      for (let i = 0; i < SEG; i++) {
        const a = base + i * 2;
        b.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    return b.build();
  }

  const fixBackNormals = (m) => {
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (shader, rr) => {
      prev(shader, rr);
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', '')
      );
    };
    return m;
  };

  const fernMat = fixBackNormals(applyWind(new THREE.MeshStandardMaterial({
    map: getFernFrondTexture(),
    alphaTest: 0.4,
    alphaToCoverage: !isMobile,
    side: THREE.DoubleSide,
    vertexColors: true,
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.5
  }), 'plant'));

  const fernVariants = [makeFernGeometry(11), makeFernGeometry(29)];
  const fernCount = isMobile ? 120 : 300;
  const fernMeshes = fernVariants.map(g => {
    const m = new THREE.InstancedMesh(g, fernMat, fernCount);
    m.receiveShadow = true;
    m.castShadow = !isMobile;
    m.count = 0;
    return m;
  });
  for (let i = 0; i < fernCount * 8; i++) {
    const radius = 3.5 + rnd() * 18;
    const angle = rnd() * Math.PI * 2;
    const x = 0.8 + Math.cos(angle) * radius;
    const z = 1.0 + Math.sin(angle) * radius;
    if (!isClearOfCamp(x, z, 0.4) || isCampZone(x, z, 0.3)) continue;
    const s = surface.sample(x, z);
    if (s.water > 0.15 || s.mud > 0.35) continue;
    // Ferns love the shade at the forest edge
    if (rnd() > 0.15 + s.canopy * 1.1) continue;
    const mesh = fernMeshes[i % 2];
    if (mesh.count >= fernCount) continue;
    const sc = 0.7 + rnd() * 0.8;
    dummy.position.set(x, groundHeight(x, z) - 0.02, z);
    dummy.rotation.set((rnd() - 0.5) * 0.15, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.15);
    dummy.scale.set(sc, sc * (0.85 + rnd() * 0.3), sc);
    dummy.updateMatrix();
    mesh.setMatrixAt(mesh.count, dummy.matrix);
    col.setHSL(0.24 + (rnd() - 0.5) * 0.04, 0.3 + rnd() * 0.15, 0.62 + rnd() * 0.22);
    mesh.setColorAt(mesh.count, col);
    mesh.count++;
  }
  fernMeshes.forEach(m => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    terrainGroup.add(m);
  });

  // -------------------------------------------------------------------------
  // 4. Leafy understory shrubs
  // -------------------------------------------------------------------------
  function makeShrubGeometry(seed) {
    const r = mulberry32(seed);
    const b = new GeoBuilder();
    const center = new THREE.Vector3(0, 0.45, 0);
    const stems = 7;
    for (let k = 0; k < stems; k++) {
      const a = (k / stems) * Math.PI * 2 + r() * 0.6;
      const lean = 0.35 + r() * 0.5;
      const len = 0.7 + r() * 0.6;
      const dir = new THREE.Vector3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize();
      const cards = 5;
      for (let c = 0; c < cards; c++) {
        const t = 0.35 + (c / (cards - 1)) * 0.65;
        const p = dir.clone().multiplyScalar(len * t);
        p.y -= t * t * 0.18;
        const outward = p.clone().sub(center).normalize();
        const vDir = outward.clone().multiplyScalar(0.7).add(new THREE.Vector3((r() - 0.5) * 0.6, 0.35 + r() * 0.3, (r() - 0.5) * 0.6)).normalize();
        const uDir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5);
        uDir.sub(vDir.clone().multiplyScalar(uDir.dot(vDir))).normalize();
        const sz = 0.42 + r() * 0.22;
        const depth = Math.min(1, p.distanceTo(center) / 0.7);
        const color = hsl(0.24 + (r() - 0.5) * 0.04, 0.42, (0.2 + depth * 0.12) * 1.9);
        addCard(b, p, vDir, uDir, sz, sz, color, outward, 0.7, 0.3);
        const u2 = uDir.clone().applyAxisAngle(vDir, Math.PI * 0.5);
        addCard(b, p, vDir, u2, sz * 0.85, sz * 0.85, color.map(v => v * 0.9), outward, 0.7, 0.3);
      }
    }
    return b.build();
  }
  const shrubMat = fixBackNormals(applyWind(new THREE.MeshStandardMaterial({
    map: getLeafClusterTexture('broad'),
    alphaTest: 0.45,
    alphaToCoverage: !isMobile,
    side: THREE.DoubleSide,
    vertexColors: true,
    roughness: 0.68,
    metalness: 0.0,
    envMapIntensity: 0.45
  }), 'plant'));
  const shrubGeo = makeShrubGeometry(77);
  const shrubCount = isMobile ? 40 : 90;
  stripLocalLights(shrubMat);
  const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubCount);
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  const bushColliders = [];
  let shrubPlaced = 0;
  for (let i = 0; i < shrubCount * 12 && shrubPlaced < shrubCount; i++) {
    const radius = 7.5 + rnd() * 15;
    const angle = rnd() * Math.PI * 2;
    const x = 0.8 + Math.cos(angle) * radius;
    const z = 1.0 + Math.sin(angle) * radius;
    if (isCampZone(x, z, 1.0)) continue;
    const s = surface.sample(x, z);
    if (s.water > 0.1 || s.mud > 0.25) continue;
    if (x > -1.5 && x < 5.5 && z > 3 && z < 13) continue; // wide-shot sight line
    if (rnd() > 0.3 + s.canopy) continue;
    const sc = 0.75 + rnd() * 0.75;
    dummy.position.set(x, groundHeight(x, z) - 0.05, z);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.scale.set(sc * (0.85 + rnd() * 0.3), sc, sc * (0.85 + rnd() * 0.3));
    dummy.updateMatrix();
    shrubs.setMatrixAt(shrubPlaced, dummy.matrix);
    col.setHSL(0.22 + (rnd() - 0.5) * 0.05, 0.3 + rnd() * 0.15, 0.6 + rnd() * 0.25);
    shrubs.setColorAt(shrubPlaced, col);
    if (sc > 1.05) bushColliders.push({ type: 'circle', x, z, r: sc * 0.45 });
    shrubPlaced++;
  }
  shrubs.count = shrubPlaced;
  shrubs.instanceMatrix.needsUpdate = true;
  if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
  terrainGroup.add(shrubs);

  // -------------------------------------------------------------------------
  // 5. Wildflowers
  // -------------------------------------------------------------------------
  const dotTex = getSoftDotTexture();
  const flowerHeadGeo = new THREE.PlaneGeometry(0.06, 0.06);
  const head2 = flowerHeadGeo.clone();
  head2.rotateY(Math.PI * 0.5);
  const head3 = flowerHeadGeo.clone();
  head3.rotateX(-Math.PI * 0.5);
  const flowerGeo = mergeGeometries([flowerHeadGeo, head2, head3], false);
  const flowerMat = new THREE.MeshStandardMaterial({
    map: dotTex,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    roughness: 0.6,
    metalness: 0.0,
    emissive: 0x1a1608,
    emissiveIntensity: 0.35
  });
  const flowerCount = isMobile ? 220 : 520;
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
  const stemGeo = new THREE.CylinderGeometry(0.004, 0.006, 0.3, 4);
  stemGeo.translate(0, 0.15, 0);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4c6534, roughness: 0.9 });
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, flowerCount);
  let flowerPlaced = 0;
  const palette = [
    [0.13, 0.72, 0.86], [0.14, 0.82, 0.72], [0.11, 0.66, 0.7], [0.72, 0.5, 0.74], [0.6, 0.45, 0.72]
  ];
  for (let i = 0; i < flowerCount * 4 && flowerPlaced < flowerCount; i++) {
    const radius = 2.2 + rnd() * 15.0;
    const angle = rnd() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isClearOfCamp(x, z, 0.2)) continue;
    const s = surface.sample(x, z);
    if (s.mud > 0.2 || s.water > 0.1 || s.canopy > 0.4) continue;
    const h = groundHeight(x, z);
    const sh = 0.2 + rnd() * 0.22;
    dummy.position.set(x, h, z);
    dummy.rotation.set((rnd() - 0.5) * 0.2, rnd() * Math.PI, (rnd() - 0.5) * 0.2);
    dummy.scale.set(1, sh / 0.3, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(flowerPlaced, dummy.matrix);
    dummy.position.set(x, h + sh, z);
    dummy.rotation.set(0, rnd() * Math.PI, 0);
    dummy.scale.setScalar(0.8 + rnd() * 0.7);
    dummy.updateMatrix();
    flowers.setMatrixAt(flowerPlaced, dummy.matrix);
    const p = palette[(rnd() * palette.length) | 0];
    col.setHSL(p[0], p[1], p[2]);
    flowers.setColorAt(flowerPlaced, col);
    flowerPlaced++;
  }
  flowers.count = flowerPlaced;
  stems.count = flowerPlaced;
  flowers.instanceMatrix.needsUpdate = true;
  stems.instanceMatrix.needsUpdate = true;
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  terrainGroup.add(stems, flowers);

  // -------------------------------------------------------------------------
  // 6. Stones (some half-sunk in the mud)
  // -------------------------------------------------------------------------
  const stoneMaps = getStoneMaps();
  const stoneGeo = makeRockGeometry(0.12, 1, 5, 0.3);
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneMaps.map,
    normalMap: stoneMaps.normalMap,
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.5
  });
  const stoneMesh = new THREE.InstancedMesh(stoneGeo, stoneMat, 260);
  let stoneCount = 0;
  for (let i = 0; i < 520 && stoneCount < 260; i++) {
    const x = (rnd() - 0.5) * 30;
    const z = (rnd() - 0.5) * 30;
    if (!isClearOfCamp(x, z, 0.2)) continue;
    const s = surface.sample(x, z);
    if (s.water > 0.4) continue;
    const y = groundHeight(x, z);
    const sc = 0.5 + rnd() * 1.2;
    dummy.position.set(x, y + 0.03 * sc - s.mud * 0.04, z);
    dummy.rotation.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
    dummy.scale.set(sc, sc * 0.58, sc * 0.9);
    dummy.updateMatrix();
    stoneMesh.setMatrixAt(stoneCount, dummy.matrix);
    col.setHSL(0.1 + rnd() * 0.06, 0.06, 0.34 + rnd() * 0.16);
    if (rnd() < 0.32) col.setHSL(0.24, 0.18, 0.3 + rnd() * 0.1);
    if (s.mud > 0.3) col.multiplyScalar(0.7);
    stoneMesh.setColorAt(stoneCount, col);
    stoneCount++;
  }
  stoneMesh.count = stoneCount;
  stoneMesh.instanceMatrix.needsUpdate = true;
  if (stoneMesh.instanceColor) stoneMesh.instanceColor.needsUpdate = true;
  stoneMesh.receiveShadow = true;
  stoneMesh.castShadow = true;
  terrainGroup.add(stoneMesh);

  // Fallen leaves and needles on the floor (not in the mud or water)
  const litter = scatterLeafLitter({
    count: isMobile ? 380 : 900,
    innerRadius: 2.5,
    outerRadius: 20,
    getHeight: groundHeight,
    isClear: (x, z) => {
      if (isClearOfCamp(x, z, -0.15) === false) return false;
      const s = surface.sample(x, z);
      return s.mud < 0.3 && s.water < 0.1;
    }
  });
  terrainGroup.add(litter);

  // -------------------------------------------------------------------------
  // 7. Mossy boulders
  // -------------------------------------------------------------------------
  const boulderMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: stoneMaps.map,
    normalMap: stoneMaps.normalMap,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.45
  });
  const boulderDefs = [
    { x: -6.4, z: 3.6, r: 1.0 },
    { x: 7.7, z: -3.9, r: 0.85 },
    { x: -5.4, z: -6.2, r: 1.25 },
    { x: 6.9, z: 4.4, r: 0.7 },
    { x: 9.9, z: 0.2, r: 0.9 }
  ];
  const boulderColliders = [];
  boulderDefs.forEach((b, idx) => {
    const geo = makeRockGeometry(b.r, 3, idx + 3, 0.22);
    const p = geo.attributes.position;
    const vColors = [];
    const c = new THREE.Color();
    const moss = new THREE.Color().setHSL(0.24, 0.4, 0.26);
    for (let i = 0; i < p.count; i++) {
      const ny = p.getY(i);
      const m = THREE.MathUtils.smoothstep(ny / b.r, 0.0, 0.5) * (0.7 + Math.sin(p.getX(i) * 5 + idx) * 0.3);
      c.setRGB(0.5, 0.49, 0.47);
      c.lerp(moss, Math.min(1, m));
      vColors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(vColors, 3));
    const mesh = new THREE.Mesh(geo, boulderMat);
    mesh.position.set(b.x, groundHeight(b.x, b.z) + b.r * 0.18, b.z);
    mesh.rotation.y = idx * 1.4;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    terrainGroup.add(mesh);
    boulderColliders.push({ type: 'circle', x: b.x, z: b.z, r: b.r * 0.82 });
  });

  // -------------------------------------------------------------------------
  // 8. Fallen mossy log with mushrooms
  // -------------------------------------------------------------------------
  const logGroup = new THREE.Group();
  const bark = getBarkMaps();
  const logMat = new THREE.MeshStandardMaterial({
    map: bark.map,
    normalMap: bark.normalMap,
    color: 0x9a8a78,
    roughness: 0.92,
    metalness: 0.0
  });
  const logMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 3.6, 18, 3), logMat);
  logMesh.rotation.z = Math.PI * 0.5;
  logMesh.position.y = 0.3;
  logMesh.castShadow = true;
  logMesh.receiveShadow = true;
  logGroup.add(logMesh);
  [[-0.9, 0.55, 0.4], [0.4, 0.5, -0.5], [1.2, 0.45, 0.25]].forEach(([x, y, z]) => {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 0.7, 7), logMat);
    stub.position.set(x, y, z);
    stub.rotation.z = (rnd() - 0.5) * 1.2;
    stub.rotation.x = (rnd() - 0.5) * 1.2;
    stub.castShadow = true;
    logGroup.add(stub);
  });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4c6334, roughness: 0.95, metalness: 0.0 });
  for (let i = 0; i < 12; i++) {
    const patch = new THREE.Mesh(makeRockGeometry(0.13 + rnd() * 0.09, 1, i + 40, 0.4), mossMat);
    patch.position.set(-1.5 + rnd() * 3.0, 0.52 + rnd() * 0.04, (rnd() - 0.5) * 0.28);
    patch.scale.y = 0.45;
    logGroup.add(patch);
  }
  const capMat = new THREE.MeshStandardMaterial({ color: 0xc25a32, roughness: 0.45 });
  const stemMatMush = new THREE.MeshStandardMaterial({ color: 0xe6ddc8, roughness: 0.8 });
  for (let i = 0; i < 7; i++) {
    const mx = -1.8 + rnd() * 1.0;
    const mz = 0.5 + rnd() * 0.6;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.09, 6), stemMatMush);
    stem.position.set(mx, 0.045, mz);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), capMat);
    cap.position.set(mx, 0.1, mz);
    cap.scale.y = 0.6;
    logGroup.add(stem, cap);
  }
  logGroup.position.set(-7.4, groundHeight(-7.4, 0.3), 0.3);
  logGroup.rotation.y = 0.55;
  terrainGroup.add(logGroup);

  // -------------------------------------------------------------------------
  // 9. Distant rolling ridge line
  // -------------------------------------------------------------------------
  const ridgeSegments = 128;
  const ridgePositions = [];
  const ridgeIndices = [];
  for (let i = 0; i <= ridgeSegments; i++) {
    const a = (i / ridgeSegments) * Math.PI * 2;
    const wave = Math.sin(a * 2.3 + 0.7) * 0.45 + Math.sin(a * 5.1 - 1.2) * 0.28 + Math.sin(a * 9.7 + 2.4) * 0.18 +
      Math.sin(a * 23.0) * 0.05;
    const peakY = 4.5 + (wave + 0.9) * 7.5;
    ridgePositions.push(
      Math.cos(a) * 56, -1.6, Math.sin(a) * 56,
      Math.cos(a) * 64, peakY, Math.sin(a) * 64,
      Math.cos(a) * 69, -2.4, Math.sin(a) * 69
    );
  }
  for (let i = 0; i < ridgeSegments; i++) {
    const a0 = i * 3;
    const a1 = (i + 1) * 3;
    ridgeIndices.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1);
    ridgeIndices.push(a0 + 1, a1 + 1, a0 + 2, a1 + 1, a1 + 2, a0 + 2);
  }
  const ridgeGeo = new THREE.BufferGeometry();
  ridgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ridgePositions, 3));
  ridgeGeo.setIndex(ridgeIndices);
  ridgeGeo.computeVertexNormals();
  const ridge = new THREE.Mesh(ridgeGeo, new THREE.MeshStandardMaterial({ color: 0x223024, roughness: 1.0, metalness: 0.0 }));
  terrainGroup.add(ridge);

  // -------------------------------------------------------------------------
  // API
  // -------------------------------------------------------------------------
  let rainTarget = 1;
  return {
    group: terrainGroup,
    surface,
    getHeight: groundHeight,
    colliders: [...boulderColliders, ...bushColliders, { type: 'box', x: -7.4, z: 0.3, rot: 0.55, hw: 1.9, hl: 0.45 }],
    setWetness: (amount) => {
      groundUniforms.uWet.value = amount;
      groundMat.roughness = THREE.MathUtils.lerp(0.96, 0.62, amount);
      grassMat.roughness = grassFarMat.roughness = THREE.MathUtils.lerp(0.72, 0.5, amount);
      fernMat.roughness = THREE.MathUtils.lerp(0.62, 0.36, amount);
      shrubMat.roughness = THREE.MathUtils.lerp(0.68, 0.38, amount);
      flowerMat.emissiveIntensity = THREE.MathUtils.lerp(0.35, 0.12, amount);
      stoneMat.roughness = boulderMat.roughness = THREE.MathUtils.lerp(0.9, 0.45, amount);
      logMat.roughness = THREE.MathUtils.lerp(0.92, 0.55, amount);
    },
    setWind: (strength) => {
      grassUniforms.uWindStrength.value = strength;
    },
    setRain: (intensity) => { rainTarget = intensity; },
    update: (time, delta, isRaining) => {
      const target = isRaining ? rainTarget : 0;
      groundUniforms.uRain.value += (target - groundUniforms.uRain.value) * Math.min(1, delta * 1.5);
      groundUniforms.uTime.value = time;
      grassUniforms.uTime.value = time;
      grassUniforms.uRainTap.value = groundUniforms.uRain.value;
    }
  };
}
