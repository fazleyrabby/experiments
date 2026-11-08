// Detailed overland 4x4 (Defender-inspired) with paint clearcoat, knobby tires,
// roof gear, bull bar, light bar, winch and a visible cabin interior.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getPaintMaps, getSoftDotTexture, getMudSplatterTexture } from './textures.js';
import { createContactShadow } from './decals.js';

// ---------------------------------------------------------------------------
// Weathering shader: caked mud climbing up from the ground with spatter above
// it, and rain on the paint/glass — beads sitting on flat panels, drops sliding
// down the doors and screens. Shared uniforms so wetness/rain drive them all.
// ---------------------------------------------------------------------------
const vehUniforms = {
  uVTime: { value: 0 },
  uVWet: { value: 1 },
  uVRain: { value: 1 }
};

const VEH_NOISE = /* glsl */`
  float vHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  vec2 vHash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float vNoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = mix(mix(vHash(i), vHash(i + vec3(1, 0, 0)), f.x), mix(vHash(i + vec3(0, 1, 0)), vHash(i + vec3(1, 1, 0)), f.x), f.y);
    float b = mix(mix(vHash(i + vec3(0, 0, 1)), vHash(i + vec3(1, 0, 1)), f.x), mix(vHash(i + vec3(0, 1, 1)), vHash(i + vec3(1, 1, 1)), f.x), f.y);
    return mix(a, b, f.z);
  }
  // Water beads: returns (dome gradient xy, coverage)
  vec3 vBeads(vec2 p, float t) {
    vec2 c = floor(p); vec2 f = fract(p);
    vec3 acc = vec3(0.0);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vHash2(c + g);
        // beads slowly grow, merge away and re-form
        float life = fract(t * (0.02 + o.x * 0.05) + o.y * 7.0);
        float r = (0.14 + 0.26 * o.y) * smoothstep(0.0, 0.25, life) * (1.0 - smoothstep(0.85, 1.0, life));
        vec2 d = g + o * 0.8 + 0.1 - f;
        float dist = length(d);
        float m = 1.0 - smoothstep(r * 0.7, r, dist);
        acc.xy += (-d / max(r, 1e-3)) * m;
        acc.z = max(acc.z, m);
      }
    }
    return acc;
  }
`;

function patchVehicleMaterial(mat, { mudBase = 0.8, mudAmt = 1, drops = 0, mudTint = 1 } = {}) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, vehUniforms);
    shader.vertexShader = 'varying vec3 vVWorld;\nvarying vec3 vVNormalW;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       vVWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
       vVNormalW = normalize(mat3(modelMatrix) * objectNormal);`
    );
    shader.fragmentShader = `
      uniform float uVTime;
      uniform float uVWet;
      uniform float uVRain;
      varying vec3 vVWorld;
      varying vec3 vVNormalW;
      ${VEH_NOISE}
    ` + shader.fragmentShader
      .replace('#include <map_fragment>', `
        #include <map_fragment>
        float mudLine = ${mudBase.toFixed(3)} + vNoise(vVWorld * 2.3) * 0.32 + vNoise(vVWorld * 7.1) * 0.12 - 0.2;
        float vMud = 1.0 - smoothstep(mudLine - 0.07, mudLine + 0.05, vVWorld.y);
        // spray: dense fine dots just above the caked line, thinning out with height
        float sprayH = 1.0 - smoothstep(mudLine - 0.05, mudLine + 0.38, vVWorld.y);
        float spk = smoothstep(0.83, 0.87, vNoise(vVWorld * 41.0)) * sprayH;
        float flick = smoothstep(0.8, 0.83, vNoise(vVWorld * 95.0 + 7.0)) * (1.0 - smoothstep(mudLine, mudLine + 0.6, vVWorld.y)) * 0.75;
        vMud = clamp(max(vMud * (0.75 + vNoise(vVWorld * 13.0) * 0.4), max(spk, flick)), 0.0, 1.0) * ${mudAmt.toFixed(3)};
        float mudN = vNoise(vVWorld * 18.0);
        vec3 mudCol = mix(vec3(0.17, 0.125, 0.085), vec3(0.36, 0.28, 0.19), mudN) * ${mudTint.toFixed(3)};
        // fresh wet mud is darker, dried edges paler
        mudCol *= mix(1.0, 0.68, uVWet * smoothstep(0.4, 1.0, vMud));
        diffuseColor.rgb = mix(diffuseColor.rgb, mudCol, vMud);
      `)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, mix(0.9, 0.38, uVWet), vMud);
      `)
      .replace('#include <metalnessmap_fragment>', `
        #include <metalnessmap_fragment>
        metalnessFactor *= 1.0 - vMud;
      `)
      .replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        float vDrop = 0.0;
        ${drops > 0 ? `
        {
          vec3 nW = normalize(vVNormalW);
          float horiz = smoothstep(0.5, 0.85, nW.y);
          float vert = 1.0 - smoothstep(0.25, 0.6, abs(nW.y));
          vec3 tW = normalize(vec3(-nW.z, 0.0, nW.x) + vec3(1e-4));
          vec3 bh = vec3(0.0);
          vec3 bv = vec3(0.0);
          float dropOn = uVWet * (1.0 - vMud);
          if (horiz > 0.01 && dropOn > 0.02) bh = vBeads(vVWorld.xz * 24.0, uVTime);
          float along = dot(vVWorld, tW);
          if (vert > 0.01 && dropOn > 0.02) {
            float col = floor(along * 20.0);
            float slide = uVTime * (0.03 + 0.09 * fract(sin(col * 12.9898) * 43758.5)) * uVRain;
            bv = vBeads(vec2(along * 20.0, (vVWorld.y + slide) * 9.0), uVTime * 0.5);
          }
          vDrop = (horiz * bh.z + vert * bv.z) * uVWet * (1.0 - vMud) * ${drops.toFixed(3)};
          vec3 g = horiz * vec3(bh.x, 0.0, bh.y) + vert * (tW * bv.x + vec3(0.0, bv.y * 0.6, 0.0));
          normal = normalize(normal + (viewMatrix * vec4(g * 0.55 * uVWet * (1.0 - vMud) * ${drops.toFixed(3)}, 0.0)).xyz);
        }` : ''}
      `)
      .replace('#include <lights_fragment_begin>', `
        roughnessFactor = mix(roughnessFactor, 0.03, vDrop);
        material.roughness = max(mix(material.roughness, 0.03, vDrop), 0.0525);
        #ifdef USE_CLEARCOAT
          material.clearcoat *= 1.0 - vMud;
        #endif
        #include <lights_fragment_begin>
      `);
  };
  mat.customProgramCacheKey = () => `veh_${mudBase}_${mudAmt}_${drops}_${mudTint}`;
  return mat;
}

export function createOverlandVehicle() {
  const vehicle = new THREE.Group();
  vehicle.name = 'OverlandDefender';

  const paintMaps = getPaintMaps();

  // --- Materials -----------------------------------------------------------
  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: 0xa9b2b6,
    metalness: 0.62,
    roughness: 0.36,
    clearcoat: 1.0,
    clearcoatRoughness: 0.16,
    normalMap: paintMaps.normalMap,
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughnessMap: paintMaps.roughnessMap,
    envMapIntensity: 1.35
  });

  const blackGlossMat = new THREE.MeshStandardMaterial({
    color: 0x0d0f11,
    metalness: 0.5,
    roughness: 0.18,
    envMapIntensity: 1.4
  });

  const blackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    metalness: 0.15,
    roughness: 0.72,
    envMapIntensity: 0.7
  });

  const gunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x3c4247,
    metalness: 0.7,
    roughness: 0.4,
    envMapIntensity: 1.0
  });

  const darkGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x141b20,
    metalness: 0.2,
    roughness: 0.06,
    transparent: true,
    opacity: 0.78,
    envMapIntensity: 1.6
  });

  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc4ccd2,
    metalness: 0.9,
    roughness: 0.22,
    envMapIntensity: 1.5
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x141618,
    roughness: 0.94,
    metalness: 0.02,
    envMapIntensity: 0.35
  });

  const headlightHaloMat = new THREE.MeshStandardMaterial({
    color: 0xfff7e3,
    emissive: 0xffe9b8,
    emissiveIntensity: 1.7,
    roughness: 0.3,
    metalness: 0.0,
    toneMapped: true
  });

  const headlightInnerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff2d0,
    emissiveIntensity: 2.1,
    roughness: 0.15
  });

  const fogLightMat = new THREE.MeshStandardMaterial({
    color: 0xffc766,
    emissive: 0xffaa22,
    emissiveIntensity: 1.5,
    roughness: 0.3
  });

  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0x6e0606,
    emissive: 0xff1408,
    emissiveIntensity: 0.9,
    roughness: 0.3
  });

  const lightBarMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dd,
    emissive: 0xffe9c0,
    emissiveIntensity: 2.2,
    roughness: 0.2
  });

  const lightComponents = {
    headlightInnerMat,
    headlightHaloMat,
    fogLightMat,
    tailLightMat,
    lightBarMat,
    headlightBeams: [],
    fogBeams: [],
    glowSprites: [],
    bodyPaintMat
  };

  patchVehicleMaterial(bodyPaintMat, { mudBase: 0.86, mudAmt: 1, drops: 1 });
  patchVehicleMaterial(blackTrimMat, { mudBase: 0.92, mudAmt: 0.9, drops: 0.6, mudTint: 1.05 });
  patchVehicleMaterial(blackGlossMat, { mudBase: 0.7, mudAmt: 0.6, drops: 0.8 });
  patchVehicleMaterial(gunmetalMat, { mudBase: 0.85, mudAmt: 0.9, drops: 0.4 });
  patchVehicleMaterial(darkGlassMat, { mudBase: 0.0, mudAmt: 0.0, drops: 1.3 });
  patchVehicleMaterial(rimMat, { mudBase: 0.75, mudAmt: 0.85, drops: 0.3 });
  patchVehicleMaterial(tireMat, { mudBase: 1.25, mudAmt: 0.8, drops: 0, mudTint: 0.72 });

  // --- Dimensions ----------------------------------------------------------
  const bodyW = 2.02;
  const bodyL = 4.75;
  const groundClearance = 0.6;

  const add = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    vehicle.add(mesh);
    return mesh;
  };

  // --- 1. Chassis / body ---------------------------------------------------
  const lowerBody = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW, 0.52, bodyL, 3, 0.1),
    bodyPaintMat
  );
  lowerBody.position.set(0, groundClearance + 0.42, 0);
  add(lowerBody);

  const rocker = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW + 0.05, 0.17, bodyL - 0.24, 2, 0.05),
    blackTrimMat
  );
  rocker.position.set(0, groundClearance + 0.1, 0);
  add(rocker);

  // Side steps
  [-1, 1].forEach(side => {
    const step = new THREE.Mesh(
      new RoundedBoxGeometry(0.22, 0.08, 1.75, 2, 0.03),
      gunmetalMat
    );
    step.position.set(side * (bodyW * 0.5 + 0.1), groundClearance + 0.03, -0.1);
    add(step);
    [-0.7, 0.7].forEach(z => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), blackTrimMat);
      bracket.position.set(side * (bodyW * 0.5 + 0.02), groundClearance + 0.1, z);
      add(bracket);
    });
  });

  // Hood with raised power bulge
  const hood = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW - 0.12, 0.2, 1.5, 2, 0.07),
    bodyPaintMat
  );
  hood.position.set(0, groundClearance + 0.74, 1.58);
  add(hood);

  const hoodBulge = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW * 0.55, 0.07, 1.18, 2, 0.04),
    bodyPaintMat
  );
  hoodBulge.position.set(0, groundClearance + 0.86, 1.55);
  add(hoodBulge);

  // Hood vent / treadplate
  const hoodTread = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.015, 0.9), blackTrimMat);
  hoodTread.position.set(0, groundClearance + 0.9, 1.55);
  vehicle.add(hoodTread);
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.02, 0.03), blackGlossMat);
    rib.position.set(0, groundClearance + 0.905, 1.2 + i * 0.17);
    vehicle.add(rib);
  }

  // Front fascia + grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.22, 0.4, 0.12), blackTrimMat);
  grille.position.set(0, groundClearance + 0.48, 2.36);
  add(grille);
  for (let i = -1; i <= 1; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.035, 0.06), blackGlossMat);
    slat.position.set(0, groundClearance + 0.51 + i * 0.085, 2.43);
    vehicle.add(slat);
  }
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), gunmetalMat);
  badge.position.set(0, groundClearance + 0.52, 2.445);
  vehicle.add(badge);

  // Front bumper / winch
  const bumper = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW + 0.08, 0.28, 0.42, 2, 0.06),
    blackTrimMat
  );
  bumper.position.set(0, groundClearance + 0.2, 2.4);
  add(bumper);

  const skidPlate = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.1, 0.4), rimMat);
  skidPlate.position.set(0, groundClearance + 0.08, 2.42);
  skidPlate.rotation.x = 0.42;
  add(skidPlate);

  const winchDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 16), gunmetalMat);
  winchDrum.rotation.z = Math.PI * 0.5;
  winchDrum.position.set(0, groundClearance + 0.33, 2.58);
  add(winchDrum);
  const fairlead = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.05), rimMat);
  fairlead.position.set(0, groundClearance + 0.3, 2.66);
  add(fairlead);

  // Red recovery hooks
  const redHookMat = new THREE.MeshStandardMaterial({ color: 0xd52616, roughness: 0.38, metalness: 0.3 });
  [-0.58, 0.58].forEach(x => {
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 18), redHookMat);
    hook.position.set(x, groundClearance + 0.17, 2.63);
    hook.rotation.x = Math.PI * 0.5;
    vehicle.add(hook);
  });

  // Bull bar
  const bullMat = gunmetalMat;
  const bullBarParts = [];
  const bullBarGeo = new THREE.CylinderGeometry(0.035, 0.035, bodyW * 0.82, 8);
  bullBarGeo.rotateZ(Math.PI * 0.5);
  bullBarGeo.translate(0, groundClearance + 0.52, 2.68);
  bullBarParts.push(bullBarGeo);
  [-0.72, 0, 0.72].forEach(x => {
    const upright = new THREE.CylinderGeometry(0.032, 0.032, 0.62, 8);
    upright.translate(x, groundClearance + 0.45, 2.68);
    bullBarParts.push(upright);
  });
  const bullMesh = new THREE.Mesh(mergeGeometries(bullBarParts, false), bullMat);
  bullBarParts.forEach(g => g.dispose());
  add(bullMesh);

  // --- 2. Lights -----------------------------------------------------------
  [-0.7, 0.7].forEach(x => {
    const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.1, 26), blackTrimMat);
    housing.rotation.x = Math.PI * 0.5;
    housing.position.set(x, groundClearance + 0.58, 2.42);
    vehicle.add(housing);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.017, 12, 30), headlightHaloMat);
    halo.position.set(x, groundClearance + 0.58, 2.475);
    vehicle.add(halo);

    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.068, 18, 14), headlightInnerMat);
    lens.scale.z = 0.6;
    lens.position.set(x, groundClearance + 0.58, 2.47);
    vehicle.add(lens);

    const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 18), fogLightMat);
    fog.rotation.x = Math.PI * 0.5;
    fog.position.set(x * 0.82, groundClearance + 0.27, 2.62);
    vehicle.add(fog);

    // Soft additive halo sprite
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getSoftDotTexture(),
      color: 0xffe6b0,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    sprite.scale.set(1.1, 1.1, 1);
    sprite.position.set(x, groundClearance + 0.58, 2.56);
    vehicle.add(sprite);
    lightComponents.glowSprites.push(sprite);
  });

  // Headlight spot beams
  [-0.7, 0.7].forEach(x => {
    const spot = new THREE.SpotLight(0xfff1d4, 0, 38, Math.PI * 0.23, 0.55, 1.1);
    spot.position.set(x, groundClearance + 0.58, 2.55);
    spot.target.position.set(x * 1.7, 0, 18);
    // No shadow map: each one cost ~3 ms a frame across the whole forest
    spot.castShadow = false;
    vehicle.add(spot);
    vehicle.add(spot.target);
    lightComponents.headlightBeams.push(spot);
  });

  // --- 3. Cabin ------------------------------------------------------------
  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW - 0.1, 0.82, 3.0, 3, 0.1),
    blackGlossMat
  );
  cabin.position.set(0, groundClearance + 1.04, -0.42);
  add(cabin);

  const roof = new THREE.Mesh(
    new RoundedBoxGeometry(bodyW - 0.08, 0.14, 3.12, 3, 0.06),
    bodyPaintMat
  );
  roof.position.set(0, groundClearance + 1.47, -0.42);
  add(roof);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(bodyW - 0.28, 0.8), darkGlassMat);
  windshield.position.set(0, groundClearance + 1.1, 1.02);
  windshield.rotation.x = -0.49;
  vehicle.add(windshield);

  // Wipers
  [-0.38, 0.38].forEach(x => {
    const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.018, 0.02), blackTrimMat);
    wiper.position.set(x, groundClearance + 0.8, 1.13);
    wiper.rotation.z = -0.16;
    vehicle.add(wiper);
  });

  // Side glass + mirrors + door handles
  [-1, 1].forEach(side => {
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.56), darkGlassMat);
    sideGlass.position.set(side * (bodyW * 0.5 - 0.03), groundClearance + 1.1, -0.42);
    sideGlass.rotation.y = side * Math.PI * 0.5;
    vehicle.add(sideGlass);

    const alpine = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.17), darkGlassMat);
    alpine.position.set(side * (bodyW * 0.5 - 0.09), groundClearance + 1.44, -0.95);
    alpine.rotation.y = side * Math.PI * 0.5;
    alpine.rotation.x = side * 0.32;
    vehicle.add(alpine);

    const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.04), blackTrimMat);
    mirrorArm.position.set(side * (bodyW * 0.5 + 0.09), groundClearance + 0.92, 0.9);
    vehicle.add(mirrorArm);
    const mirrorCap = new THREE.Mesh(
      new RoundedBoxGeometry(0.13, 0.2, 0.26, 2, 0.03),
      blackGlossMat
    );
    mirrorCap.position.set(side * (bodyW * 0.5 + 0.22), groundClearance + 0.94, 0.9);
    vehicle.add(mirrorCap);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.22), rimMat);
    handle.position.set(side * (bodyW * 0.5 + 0.015), groundClearance + 0.92, -0.15);
    vehicle.add(handle);

    // Door shut lines + body crease
    [-0.78, 0.12, 1.02].forEach(z => {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.92, 0.014), blackGlossMat);
      seam.position.set(side * (bodyW * 0.5 + 0.006), groundClearance + 0.76, z);
      vehicle.add(seam);
    });
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, bodyL - 0.5), blackTrimMat);
    crease.position.set(side * (bodyW * 0.5 + 0.006), groundClearance + 0.63, 0);
    vehicle.add(crease);

    // Round fuel filler
    const filler = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 18), gunmetalMat);
    filler.rotation.z = Math.PI * 0.5;
    filler.position.set(side * (bodyW * 0.5 + 0.01), groundClearance + 0.78, -1.28);
    vehicle.add(filler);

    // Mud flaps
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), blackTrimMat);
    flap.position.set(side * (bodyW * 0.5 + 0.02), groundClearance - 0.13, -1.72);
    vehicle.add(flap);
  });

  // Rear glass + lights + ladder
  const rearGlass = new THREE.Mesh(new THREE.PlaneGeometry(bodyW - 0.34, 0.62), darkGlassMat);
  rearGlass.position.set(0, groundClearance + 1.08, -1.94);
  rearGlass.rotation.y = Math.PI;
  vehicle.add(rearGlass);

  [-0.82, 0.82].forEach(x => {
    const tl = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.5, 0.06, 2, 0.02), tailLightMat);
    tl.position.set(x, groundClearance + 0.78, -1.92);
    vehicle.add(tl);
  });

  const ladderParts = [];
  [-0.28, 0.28].forEach(x => {
    const rail = new THREE.CylinderGeometry(0.018, 0.018, 1.05, 7);
    rail.translate(x, groundClearance + 1.02, -2.02);
    ladderParts.push(rail);
  });
  for (let i = 0; i < 5; i++) {
    const rung = new THREE.CylinderGeometry(0.014, 0.014, 0.56, 6);
    rung.rotateZ(Math.PI * 0.5);
    rung.translate(0, groundClearance + 0.62 + i * 0.2, -2.02);
    ladderParts.push(rung);
  }
  const ladder = new THREE.Mesh(mergeGeometries(ladderParts, false), gunmetalMat);
  ladderParts.forEach(g => g.dispose());
  add(ladder);

  // License plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.02), new THREE.MeshStandardMaterial({ color: 0xd8d6c8, roughness: 0.6 }));
  plate.position.set(0, groundClearance + 0.22, -2.03);
  vehicle.add(plate);

  // Visible cabin interior
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2a2b29, roughness: 0.86 });
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.7 });
  [-0.5, 0.5].forEach(x => {
    const seatBase = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.14, 0.48, 2, 0.05), seatMat);
    seatBase.position.set(x, groundClearance + 0.86, -0.5);
    vehicle.add(seatBase);
    const seatBack = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.12, 2, 0.05), seatMat);
    seatBack.position.set(x, groundClearance + 1.1, -0.72);
    seatBack.rotation.x = -0.12;
    vehicle.add(seatBack);
  });
  const dash = new THREE.Mesh(new RoundedBoxGeometry(bodyW - 0.38, 0.2, 0.34, 2, 0.05), dashMat);
  dash.position.set(0, groundClearance + 0.98, 0.62);
  vehicle.add(dash);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 20), blackTrimMat);
  wheel.position.set(0.5, groundClearance + 1.05, 0.48);
  wheel.rotation.x = 1.18;
  vehicle.add(wheel);

  // --- 4. Snorkel ----------------------------------------------------------
  const snorkelParts = [];
  const pipe1 = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10);
  pipe1.rotateX(-0.16);
  pipe1.translate(bodyW * 0.5 + 0.06, groundClearance + 0.75, 1.15);
  snorkelParts.push(pipe1);
  const pipe2 = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 10);
  pipe2.rotateX(-0.46);
  pipe2.translate(bodyW * 0.5 + 0.05, groundClearance + 1.22, 0.72);
  snorkelParts.push(pipe2);
  const snorkelMesh = new THREE.Mesh(mergeGeometries(snorkelParts, false), blackTrimMat);
  snorkelParts.forEach(g => g.dispose());
  add(snorkelMesh);

  const intakeHead = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.13, 0.26, 2, 0.03), blackTrimMat);
  intakeHead.position.set(bodyW * 0.5 + 0.05, groundClearance + 1.65, 0.3);
  add(intakeHead);

  // Antenna
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 1.1, 4), blackTrimMat);
  antenna.position.set(-0.55, groundClearance + 1.95, 0.7);
  vehicle.add(antenna);

  // --- 5. Roof rack --------------------------------------------------------
  const rackGroup = new THREE.Group();
  const railMat = gunmetalMat;

  [-0.86, 0.86].forEach(x => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 3.3, 8), railMat);
    rail.rotation.x = Math.PI * 0.5;
    rail.position.set(x, groundClearance + 1.6, -0.42);
    rail.castShadow = true;
    rackGroup.add(rail);
    for (let z = -1.7; z <= 1.0; z += 0.7) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.07), railMat);
      foot.position.set(x, groundClearance + 1.53, z);
      rackGroup.add(foot);
    }
  });

  for (let z = -1.9; z <= 1.1; z += 0.3) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.022, 0.055), railMat);
    slat.position.set(0, groundClearance + 1.6, z);
    slat.castShadow = true;
    rackGroup.add(slat);
  }

  // Recovery boards
  const traxMat = new THREE.MeshStandardMaterial({ color: 0xd46a19, roughness: 0.62, metalness: 0.05 });
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.33, 0.055, 1.2, 2, 0.02), traxMat);
  board.position.set(-0.56, groundClearance + 1.66, -0.25);
  board.castShadow = true;
  rackGroup.add(board);

  // Jerry cans
  const jerryMat = new THREE.MeshStandardMaterial({ color: 0x7d2a1f, roughness: 0.5, metalness: 0.35 });
  [-0.28, 0.28].forEach((x, i) => {
    const can = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.46, 0.16, 2, 0.03), jerryMat);
    can.position.set(x, groundClearance + 1.87, -1.62 - i * 0.02);
    can.rotation.z = (i - 0.5) * 0.05;
    can.castShadow = true;
    rackGroup.add(can);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8), blackTrimMat);
    cap.position.set(x + 0.09, groundClearance + 2.1, -1.62);
    rackGroup.add(cap);
  });

  // Hard-shell gear case
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.55, metalness: 0.2 });
  const gearCase = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.24, 1.1, 2, 0.05), caseMat);
  gearCase.position.set(0, groundClearance + 1.72, -1.15);
  gearCase.castShadow = true;
  rackGroup.add(gearCase);

  // Rolled awning bag on the driver side
  const awningBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 2.7, 12),
    new THREE.MeshStandardMaterial({ color: 0x33382f, roughness: 0.9 })
  );
  awningBag.rotation.x = Math.PI * 0.5;
  awningBag.position.set(-0.98, groundClearance + 1.68, -0.4);
  awningBag.castShadow = true;
  rackGroup.add(awningBag);

  // Roof light bar
  const lightBarBase = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.12), blackTrimMat);
  lightBarBase.position.set(0, groundClearance + 1.78, 1.02);
  rackGroup.add(lightBarBase);
  const lightBarBulbs = [];
  for (let i = 0; i < 4; i++) {
    const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16), lightBarMat);
    bulb.rotation.x = Math.PI * 0.5;
    bulb.position.set(-0.45 + i * 0.3, groundClearance + 1.78, 1.09);
    rackGroup.add(bulb);
    lightBarBulbs.push(bulb);
  }
  const barSpot = new THREE.SpotLight(0xfff1d0, 0, 45, Math.PI * 0.17, 0.6, 1.0);
  barSpot.position.set(0, groundClearance + 1.78, 1.12);
  barSpot.target.position.set(0, 0, 22);
  barSpot.castShadow = false;
  vehicle.add(barSpot);
  vehicle.add(barSpot.target);
  lightComponents.headlightBeams.push(barSpot);

  // Hi-lift jack and a recovery shovel strapped to the rack
  const jackBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 1.4), gunmetalMat);
  jackBar.position.set(0.62, groundClearance + 1.65, -0.35);
  rackGroup.add(jackBar);
  const jackFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.12), redHookMat);
  jackFoot.position.set(0.62, groundClearance + 1.66, 0.3);
  rackGroup.add(jackFoot);
  const jackBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), redHookMat);
  jackBody.position.set(0.62, groundClearance + 1.68, -0.2);
  rackGroup.add(jackBody);
  const shovelShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.7 }));
  shovelShaft.rotation.x = Math.PI * 0.5;
  shovelShaft.position.set(0.28, groundClearance + 1.64, 0.35);
  rackGroup.add(shovelShaft);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.26), gunmetalMat);
  blade.position.set(0.28, groundClearance + 1.64, 0.92);
  rackGroup.add(blade);

  vehicle.add(rackGroup);

  // --- 6. Wheels -----------------------------------------------------------
  const tireRadius = 0.48;
  const tireWidth = 0.36;

  function buildTireGeometry() {
    const parts = [];
    // Carcass: lathe profile with rounded shoulders and a bulging sidewall
    const prof = [];
    const hw = tireWidth * 0.5;
    const rIn = 0.3;
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI;           // around the cross-section
      const x = -Math.cos(a) * hw;               // across the tread
      const bulge = Math.sin(a);
      const r = rIn + (tireRadius - rIn) * Math.pow(bulge, 0.35) + (bulge > 0.98 ? 0 : 0);
      prof.push(new THREE.Vector2(r, x));
    }
    const carcass = new THREE.LatheGeometry(prof, 48);
    carcass.rotateZ(Math.PI * 0.5);
    parts.push(carcass);

    // Two staggered rows of chevron tread blocks + shoulder lugs biting the sidewall
    const lugCount = 26;
    for (let i = 0; i < lugCount; i++) {
      const a = (i / lugCount) * Math.PI * 2;
      for (const side of [-1, 1]) {
        const stagger = side > 0 ? 0 : Math.PI / lugCount;
        const lug = new THREE.BoxGeometry(tireWidth * 0.46, 0.05, 0.1);
        lug.rotateY(side * 0.32);
        lug.translate(side * tireWidth * 0.235, tireRadius + 0.012, 0);
        lug.rotateX(a + stagger);
        parts.push(lug);
        // shoulder lug wrapping onto the sidewall
        const sh = new THREE.BoxGeometry(0.05, 0.11, 0.075);
        sh.translate(side * (hw + 0.008), tireRadius - 0.045, 0);
        sh.rotateX(a + stagger + (side > 0 ? 0.06 : -0.06));
        parts.push(sh);
      }
    }
    // Sidewall lettering ridge
    [-1, 1].forEach(side => {
      const ring = new THREE.TorusGeometry(tireRadius - 0.1, 0.012, 6, 48);
      ring.rotateY(Math.PI * 0.5);
      ring.translate(side * (hw + 0.004), 0, 0);
      parts.push(ring);
    });
    const geo = mergeGeometries(parts.map(g => g.toNonIndexed ? (g.index ? g.toNonIndexed() : g) : g), false);
    parts.forEach(g => g.dispose());
    geo.computeVertexNormals();
    return geo;
  }

  function buildRimGeometry() {
    const parts = [];
    const face = tireWidth * 0.5 - 0.03;
    const barrel = new THREE.CylinderGeometry(0.3, 0.3, tireWidth - 0.04, 32, 1, true);
    barrel.rotateZ(Math.PI * 0.5);
    parts.push(barrel);
    // Beadlock ring with bolts
    const bead = new THREE.TorusGeometry(0.285, 0.022, 8, 40);
    bead.rotateY(Math.PI * 0.5);
    bead.translate(face + 0.01, 0, 0);
    parts.push(bead);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const bolt = new THREE.CylinderGeometry(0.009, 0.009, 0.022, 6);
      bolt.rotateZ(Math.PI * 0.5);
      bolt.translate(face + 0.028, Math.cos(a) * 0.285, Math.sin(a) * 0.285);
      parts.push(bolt);
    }
    // Dished face with 8 spokes
    const dish = new THREE.CylinderGeometry(0.255, 0.24, 0.02, 32);
    dish.rotateZ(Math.PI * 0.5);
    dish.translate(face - 0.03, 0, 0);
    parts.push(dish);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = new THREE.BoxGeometry(0.035, 0.2, 0.05);
      spoke.translate(0, 0.14, 0);
      spoke.rotateX(a);
      spoke.translate(face - 0.005, 0, 0);
      parts.push(spoke);
    }
    const hub = new THREE.CylinderGeometry(0.075, 0.09, 0.07, 16);
    hub.rotateZ(Math.PI * 0.5);
    hub.translate(face, 0, 0);
    parts.push(hub);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const nut = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 6);
      nut.rotateZ(Math.PI * 0.5);
      nut.translate(face + 0.035, Math.cos(a) * 0.05, Math.sin(a) * 0.05);
      parts.push(nut);
    }
    const brake = new THREE.CylinderGeometry(0.21, 0.21, 0.025, 28);
    brake.rotateZ(Math.PI * 0.5);
    brake.translate(-0.02, 0, 0);
    parts.push(brake);

    const geo = mergeGeometries(parts.map(g => (g.index ? g.toNonIndexed() : g)), false);
    parts.forEach(g => g.dispose());
    geo.computeVertexNormals();
    return geo;
  }

  const tireGeo = buildTireGeometry();
  const rimGeo = buildRimGeometry();

  function createWheel(tm = tireMat, rm = rimMat) {
    const wheelGroup = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tm);
    tire.castShadow = true;
    tire.receiveShadow = true;
    wheelGroup.add(tire);
    const rim = new THREE.Mesh(rimGeo, rm);
    rim.castShadow = true;
    wheelGroup.add(rim);
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.08), redHookMat);
    caliper.position.set(0.06, 0.13, 0);
    wheelGroup.add(caliper);
    return wheelGroup;
  }

  const wheelPositions = [
    { x: -bodyW * 0.5 - 0.03, z: 1.48 },
    { x: bodyW * 0.5 + 0.03, z: 1.48 },
    { x: -bodyW * 0.5 - 0.03, z: -1.42 },
    { x: bodyW * 0.5 + 0.03, z: -1.42 }
  ];

  // Fender flares
  wheelPositions.forEach(pos => {
    const flare = new THREE.Mesh(
      new RoundedBoxGeometry(0.14, 0.42, 1.14, 2, 0.05),
      blackTrimMat
    );
    flare.position.set(pos.x > 0 ? bodyW * 0.5 + 0.01 : -bodyW * 0.5 - 0.01, groundClearance + 0.44, pos.z);
    add(flare);
  });

  wheelPositions.forEach((pos) => {
    const wheel = createWheel();
    wheel.position.set(pos.x, groundClearance - 0.02, pos.z);
    if (pos.x < 0) wheel.rotation.y = Math.PI;
    // front wheels left turned in, as parked
    if (pos.z > 0) wheel.rotation.y += 0.2;
    // tyres settle into the soft ground
    wheel.scale.set(1, 0.985, 1);
    vehicle.add(wheel);
  });

  // --- 7. Underbody: chassis rails, axles, diffs, coils, shocks, tank -------
  const underMat = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.75, metalness: 0.35 });
  patchVehicleMaterial(underMat, { mudBase: 1.15, mudAmt: 0.9, drops: 0 });
  const shockMat = new THREE.MeshStandardMaterial({ color: 0xd8a21a, roughness: 0.4, metalness: 0.3 });
  patchVehicleMaterial(shockMat, { mudBase: 0.82, mudAmt: 0.85, drops: 0 });
  const chromeMat = rimMat;
  const underParts = [];
  [-0.46, 0.46].forEach(x => {
    const rail = new THREE.BoxGeometry(0.1, 0.16, 4.1);
    rail.translate(x, groundClearance + 0.22, 0.05);
    underParts.push(rail);
  });
  [-1.75, -0.6, 0.55, 1.85].forEach(z => {
    const xm = new THREE.BoxGeometry(0.92, 0.08, 0.08);
    xm.translate(0, groundClearance + 0.2, z);
    underParts.push(xm);
  });
  [1.48, -1.42].forEach(z => {
    const axle = new THREE.CylinderGeometry(0.05, 0.05, bodyW - 0.05, 12);
    axle.rotateZ(Math.PI * 0.5);
    axle.translate(0, groundClearance, z);
    underParts.push(axle);
    const diff = new THREE.SphereGeometry(0.16, 16, 12);
    diff.scale(0.9, 1, 1.1);
    diff.translate(0.14, groundClearance, z);
    underParts.push(diff);
    const cover = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    cover.rotateX(Math.PI * 0.5);
    cover.translate(0.14, groundClearance, z + (z > 0 ? -0.15 : 0.15));
    underParts.push(cover);
  });
  // Prop shafts to the transfer case
  const tcase = new THREE.BoxGeometry(0.3, 0.26, 0.4);
  tcase.translate(0.05, groundClearance + 0.18, 0.15);
  underParts.push(tcase);
  [[1.48, 0.15], [-1.42, 0.15]].forEach(([za, zb]) => {
    const len = Math.abs(za - zb);
    const shaft = new THREE.CylinderGeometry(0.035, 0.035, len, 10);
    shaft.rotateX(Math.PI * 0.5);
    shaft.translate(0.1, groundClearance + 0.07, (za + zb) * 0.5);
    underParts.push(shaft);
  });
  // Steering tie-rod
  const tie = new THREE.CylinderGeometry(0.02, 0.02, bodyW - 0.3, 8);
  tie.rotateZ(Math.PI * 0.5);
  tie.translate(0, groundClearance - 0.06, 1.66);
  underParts.push(tie);
  // Fuel tank + exhaust run
  const tank = new THREE.BoxGeometry(0.75, 0.24, 0.6);
  tank.translate(-0.35, groundClearance + 0.12, -1.95);
  underParts.push(tank);
  const exRun = new THREE.CylinderGeometry(0.035, 0.035, 3.0, 8);
  exRun.rotateX(Math.PI * 0.5);
  exRun.translate(-0.62, groundClearance + 0.08, -0.6);
  underParts.push(exRun);
  const underMesh = new THREE.Mesh(mergeGeometries(underParts.map(g => (g.index ? g.toNonIndexed() : g)), false), underMat);
  underParts.forEach(g => g.dispose());
  underMesh.castShadow = true;
  underMesh.receiveShadow = true;
  vehicle.add(underMesh);

  // Coil springs + remote-reservoir shocks at each corner
  class Helix extends THREE.Curve {
    constructor(r, h, turns) { super(); this.r = r; this.h = h; this.turns = turns; }
    getPoint(t, target = new THREE.Vector3()) {
      const a = t * Math.PI * 2 * this.turns;
      return target.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r);
    }
  }
  const coilGeo = new THREE.TubeGeometry(new Helix(0.075, 0.36, 6.5), 140, 0.013, 6, false);
  const springMat = new THREE.MeshStandardMaterial({ color: 0x9a2a20, roughness: 0.45, metalness: 0.4 });
  patchVehicleMaterial(springMat, { mudBase: 0.84, mudAmt: 0.9, drops: 0 });
  [1.48, -1.42].forEach(z => {
    [-0.6, 0.6].forEach(x => {
      const coil = new THREE.Mesh(coilGeo, springMat);
      coil.position.set(x, groundClearance + 0.04, z + (z > 0 ? -0.12 : 0.12));
      coil.castShadow = true;
      vehicle.add(coil);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), shockMat);
      body.position.set(x + (x > 0 ? -0.16 : 0.16), groundClearance + 0.2, z + (z > 0 ? 0.1 : -0.1));
      body.rotation.z = x > 0 ? 0.18 : -0.18;
      vehicle.add(body);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), chromeMat);
      rod.position.set(body.position.x + (x > 0 ? 0.03 : -0.03), groundClearance + 0.42, body.position.z);
      rod.rotation.z = body.rotation.z;
      vehicle.add(rod);
      const res = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10), shockMat);
      res.position.set(body.position.x, groundClearance + 0.12, body.position.z + (z > 0 ? 0.08 : -0.08));
      vehicle.add(res);
    });
  });

  // Spare wheel on the rear door
  // Spare rides high on the door: only a light dusting of spray
  const spareTireMat = patchVehicleMaterial(new THREE.MeshStandardMaterial({
    color: 0x141618, roughness: 0.9, metalness: 0.02, envMapIntensity: 0.35
  }), { mudBase: 1.6, mudAmt: 0.22, drops: 0, mudTint: 0.8 });
  const spareRimMat = patchVehicleMaterial(new THREE.MeshStandardMaterial({
    color: 0xc4ccd2, metalness: 0.9, roughness: 0.22, envMapIntensity: 1.5
  }), { mudBase: 1.4, mudAmt: 0.15, drops: 0.5 });
  const spare = createWheel(spareTireMat, spareRimMat);
  spare.position.set(0, groundClearance + 0.68, -2.22);
  spare.rotation.y = Math.PI * 0.5;
  spare.scale.setScalar(0.94);
  vehicle.add(spare);

  const spareMount = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.14), blackTrimMat);
  spareMount.position.set(0, groundClearance + 0.68, -2.0);
  add(spareMount);

  // Exhaust
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.35, 10), gunmetalMat);
  exhaust.rotation.x = Math.PI * 0.5;
  exhaust.position.set(-0.7, groundClearance - 0.08, -2.08);
  vehicle.add(exhaust);

  // Position the rig in the clearing
  vehicle.position.set(-1.4, 0, 0.6);
  vehicle.rotation.y = 0.22;

  // Grounding shadow beneath the chassis
  const underShade = createContactShadow(1.15, 2.5, 0.5, vehicle.rotation.y);
  underShade.position.y = 0.03;
  vehicle.add(underShade);

  return {
    group: vehicle,
    lights: lightComponents,
    colliders: [{ type: 'box', x: -1.4, z: 0.6, rot: 0.22, hw: 1.22, hl: 2.62 }],
    update: (time, rain = 1) => {
      vehUniforms.uVTime.value = time;
      vehUniforms.uVRain.value += (rain - vehUniforms.uVRain.value) * 0.02;
    },
    setWetness: (amount) => {
      vehUniforms.uVWet.value = amount;
      bodyPaintMat.roughness = THREE.MathUtils.lerp(0.36, 0.16, amount);
      bodyPaintMat.metalness = THREE.MathUtils.lerp(0.65, 0.9, amount);
      bodyPaintMat.clearcoatRoughness = THREE.MathUtils.lerp(0.2, 0.05, amount);
      blackTrimMat.roughness = THREE.MathUtils.lerp(0.82, 0.28, amount);
      blackGlossMat.roughness = THREE.MathUtils.lerp(0.28, 0.04, amount);
      tireMat.roughness = THREE.MathUtils.lerp(0.94, 0.62, amount);
      darkGlassMat.roughness = THREE.MathUtils.lerp(0.1, 0.03, amount);
    },
    setHeadlights: (on) => {
      headlightInnerMat.emissiveIntensity = on ? 2.1 : 0.0;
      headlightHaloMat.emissiveIntensity = on ? 1.7 : 0.02;
      headlightHaloMat.color.setHex(on ? 0xfff7e3 : 0x2a2a2a);
      fogLightMat.emissiveIntensity = on ? 1.5 : 0.0;
      tailLightMat.emissiveIntensity = on ? 0.9 : 0.25;
      lightBarMat.emissiveIntensity = on ? 2.2 : 0.0;
      lightComponents.glowSprites.forEach(s => { s.material.opacity = on ? 0.3 : 0; });
      lightComponents.headlightBeams.forEach(b => {
        b.intensity = on ? 14 : 0;
      });
    }
  };
}
