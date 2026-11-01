import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makeCloudNoise, makeWaterNormals, lerp, clamp01, smooth } from './noise.js';
import { FS_VERT, SKY_FRAG, RESOLVE_FRAG, WATER_FRAG, GRADE_FRAG, CAUSTIC_GLSL } from './shaders.js';
import { createUnderwater, seabedHeight } from './underwater.js';
import { createPlayer } from './player.js';
import {
  DiverRig, HIP, POSE, mixPose, mixLegs, standPose, walkPose, swimPose, sinkPose, ascendPose, climbPose,
} from './diver.js';

const params = new URLSearchParams(location.search);
const SUN_DIR = new THREE.Vector3(0.75, 0.11, -0.65).normalize();
const HORIZON = new THREE.Color(0.34, 0.39, 0.45); // linear
const WATER_LO = new THREE.Color(0.004, 0.02, 0.032), WATER_HI = new THREE.Color(0.07, 0.2, 0.24);
const RIPPLES = 16;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ss = (a, b, x) => smooth(clamp01((x - a) / (b - a)));
const lerpAngle = (a, b, k) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;

const loadingEl = document.getElementById('loading');
// Let the label paint before the next blocking step; the timer covers background
// tabs, where animation frames are paused.
const setLoading = text => {
  loadingEl.textContent = text;
  return new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 60); });
};

// ---------------------------------------------------------------------------
// Assets (modelled in Blender, see tools/blender) and cloud noise
// ---------------------------------------------------------------------------
await setLoading('LOADING ASSETS…');
const loader = new GLTFLoader();
const assets = Promise.all(['boat.glb', 'diver.glb', 'ice.glb', 'mountains.glb', 'kelp.glb', 'anemone.glb', 'fish.glb'].map(f => loader.loadAsync('assets/' + f)));
await setLoading('GENERATING CLOUD NOISE…');
const bakeStart = performance.now();
const cloudNoise = makeCloudNoise(96);
console.info(`cloud noise ${Math.round(performance.now() - bakeStart)} ms`);
const waterNormals = makeWaterNormals(256);
const [boatGltf, diverGltf, iceGltf, mountainGltf, kelpGltf, anemoneGltf, fishGltf] = await assets;
// Single-mesh models used for instancing: bake the node transform, keep only
// position / normal / vertex colour.
const instanceGeometry = gltf => {
  let geo;
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o => { if (o.isMesh && !geo) geo = o.geometry.clone().applyMatrix4(o.matrixWorld); });
  for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'color'].includes(name)) geo.deleteAttribute(name);
  return geo;
};
await setLoading('COMPILING SHADERS…');

// ---------------------------------------------------------------------------
// Renderer, camera, controls
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 9000);
camera.position.set(8, 3.5, 13);
if (params.has('cam')) camera.position.fromArray(params.get('cam').split(',').map(Number));

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-1.5, 1.5, 0.5);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.5;
controls.maxDistance = 90;
controls.maxPolarAngle = Math.PI - 0.05;
// Camera modes: 'auto' flies itself, 'orbit' drags around the diver (falls back
// to auto after a pause), 'fly' is free WASD + mouse-look movement.
let camMode = params.has('cam') ? 'orbit' : 'auto', idleTimer = 0;
controls.addEventListener('start', () => { if (camMode === 'auto') setMode('orbit'); clearTimeout(idleTimer); });
controls.addEventListener('end', () => { idleTimer = setTimeout(() => camMode === 'orbit' && setMode('auto'), 8000); });

// Gradient environments for image-based lighting, above and below the surface.
function gradientEnv(top, horizon, bottom, sunK) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uTop: { value: top }, uHor: { value: horizon }, uBot: { value: bottom }, uSun: { value: SUN_DIR }, uSunK: { value: sunK } },
    vertexShader: `varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 uTop, uHor, uBot, uSun; uniform float uSunK; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = d.y > 0.0 ? mix(uHor, uTop, pow(d.y, 0.5)) : mix(uHor, uBot, pow(-d.y, 0.35));
        gl_FragColor = vec4(c + vec3(1.0, 0.92, 0.8) * pow(max(dot(d, uSun), 0.0), 24.0) * uSunK, 1.0);
      }`,
  })));
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0).texture;
  pm.dispose();
  return tex;
}
const envAbove = gradientEnv(new THREE.Color(0.09, 0.12, 0.16), new THREE.Color(0.4, 0.45, 0.51), new THREE.Color(0.025, 0.04, 0.055), 3);
const envBelow = gradientEnv(new THREE.Color(0.1, 0.27, 0.3), new THREE.Color(0.025, 0.09, 0.11), new THREE.Color(0.002, 0.01, 0.018), 0.4);

// ---------------------------------------------------------------------------
// Pass 1: sky into a half-res buffer (direct sky above the horizon, mirrored below)
// ---------------------------------------------------------------------------
const skyUniforms = {
  uNoise: { value: cloudNoise },
  uTime: { value: 0 },
  uCoverage: { value: parseFloat(params.get('cov')) || 0.55 },
  uSteps: { value: 64 },
  uLightSteps: { value: 4 },
  uSunDir: { value: SUN_DIR },
  uCamPos: { value: camera.position },
  uHorizon: { value: HORIZON },
  uInvProj: { value: camera.projectionMatrixInverse },
  uCamWorld: { value: camera.matrixWorld },
  uFullRes: { value: new THREE.Vector2(2, 2) },
  uOffset: { value: new THREE.Vector2() },
  uFrame: { value: 0 },
};
const quadGeo = new THREE.PlaneGeometry(2, 2);
const skyScene = new THREE.Scene();
const skyQuad = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({
  uniforms: skyUniforms, vertexShader: FS_VERT, fragmentShader: SKY_FRAG, depthTest: false, depthWrite: false,
}));
skyQuad.frustumCulled = false;
skyScene.add(skyQuad);
const quadCam = new THREE.Camera();
// Temporal sky: a quarter-pixel cloud pass, resolved into ping-ponged full-res buffers.
const rtOpts = { type: THREE.HalfFloatType, depthBuffer: false };
const cloudRT = new THREE.WebGLRenderTarget(2, 2, { ...rtOpts, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
const skyRTs = [new THREE.WebGLRenderTarget(2, 2, rtOpts), new THREE.WebGLRenderTarget(2, 2, rtOpts)];
let skyCur = 0, skyFrame = 0;
const prevVP = new THREE.Matrix4();
const resolveUniforms = {
  uCur: { value: cloudRT.texture },
  uHist: { value: skyRTs[1].texture },
  uFullRes: skyUniforms.uFullRes,
  uLowRes: { value: new THREE.Vector2(1, 1) },
  uOffset: skyUniforms.uOffset,
  uPrevVP: { value: prevVP },
  uHistValid: { value: 0 },
  uInvProj: { value: camera.projectionMatrixInverse },
  uCamWorld: { value: camera.matrixWorld },
};
const resolveScene = new THREE.Scene();
const resolveQuad = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({
  uniforms: resolveUniforms, vertexShader: FS_VERT, fragmentShader: RESOLVE_FRAG, depthTest: false, depthWrite: false,
}));
resolveQuad.frustumCulled = false;
resolveScene.add(resolveQuad);
const SKY_OFFSETS = [[0, 0], [1, 1], [1, 0], [0, 1]];
function renderSky() {
  const [ox, oy] = SKY_OFFSETS[skyFrame % 4];
  skyUniforms.uOffset.value.set(ox, oy);
  skyUniforms.uFrame.value = skyFrame % 64;
  renderer.setRenderTarget(cloudRT);
  renderer.render(skyScene, quadCam);
  const next = 1 - skyCur;
  resolveUniforms.uHist.value = skyRTs[skyCur].texture;
  renderer.setRenderTarget(skyRTs[next]);
  renderer.render(resolveScene, quadCam);
  skyCur = next;
  waterUniforms.uSky.value = skyRTs[skyCur].texture;
  prevVP.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  resolveUniforms.uHistValid.value = 1;
  skyFrame++;
}
const reflRT = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 2 });

// ---------------------------------------------------------------------------
// Background: water composite (or the underwater view), drawn behind meshes
// ---------------------------------------------------------------------------
const ripples = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
let rippleIdx = 0;
let simTime = parseFloat(params.get('t')) || 0;
function addRipple(x, z, strength) {
  ripples[rippleIdx].set(x, z, simTime, strength);
  rippleIdx = (rippleIdx + 1) % RIPPLES;
}
const waterUniforms = {
  uSky: { value: skyRTs[0].texture },
  uRefl: { value: reflRT.texture },
  uProj: { value: camera.projectionMatrix },
  uView: { value: camera.matrixWorldInverse },
  uInvProj: { value: camera.projectionMatrixInverse },
  uCamWorld: { value: camera.matrixWorld },
  uCamPos: { value: camera.position },
  uHorizon: { value: HORIZON },
  uSunDir: { value: SUN_DIR },
  uTime: { value: 0 },
  uUnder: { value: 0 },
  uRipples: { value: ripples },
  uSkyTexel: { value: new THREE.Vector2() },
  uWaterN: { value: waterNormals },
  uBoat: { value: new THREE.Vector2(0.1, 0) },
};
const bgQuad = new THREE.Mesh(quadGeo, new THREE.ShaderMaterial({
  uniforms: waterUniforms, vertexShader: FS_VERT, fragmentShader: WATER_FRAG,
  defines: { RIPPLES }, depthTest: false, depthWrite: false,
}));
bgQuad.frustumCulled = false;
bgQuad.renderOrder = -1;

// ---------------------------------------------------------------------------
// World. The whole group is mirrored about y = 0 for the reflection pass,
// lights included; a clip plane hides whichever side of the surface the camera
// can't see.
// ---------------------------------------------------------------------------
const scene = new THREE.Scene();
const fogAbove = new THREE.FogExp2(HORIZON.clone(), 0.00024);
const fogBelow = new THREE.FogExp2(new THREE.Color(), 0.035);
scene.fog = fogAbove;
scene.environment = envAbove;
scene.add(bgQuad);
const world = new THREE.Group();
scene.add(world);
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const sun = new THREE.DirectionalLight(0xfff1e0, 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(80);
sun.target.position.set(-1, 0, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 200 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
const hemi = new THREE.HemisphereLight(0xa9b8c8, 0x1a2228, 1.6);
world.add(sun, sun.target, hemi);

// Caustics on submerged surfaces, patched into the stock PBR materials, plus
// optional detail hooks (all may use vCWorld = world position, vObjPos = mesh-
// local bind-pose position):
//   vertex: after <begin_vertex>, may displace `transformed` (kelp sway)
//   color:  after <color_fragment>, may vary `diffuseColor`
//   normal: after <normal_fragment_maps>, may bend `normal`, set roughnessFactor
//   light:  before <opaque_fragment>, may add to `outgoingLight`
const causticTime = { value: 0 };
function addCaustics(mat, { vertex = '', color = '', normal = '', light = '' } = {}) {
  mat.onBeforeCompile = shader => {
    shader.uniforms.uCausticTime = causticTime;
    shader.vertexShader = 'varying vec3 vCWorld;\nvarying vec3 vObjPos;\nuniform float uCausticTime;\n' + shader.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vObjPos = position;\n' + vertex)
      .replace('#include <project_vertex>', `#include <project_vertex>
  #ifdef USE_INSTANCING
    vCWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vCWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif`);
    shader.fragmentShader = 'varying vec3 vCWorld;\nvarying vec3 vObjPos;\nuniform float uCausticTime;\n' + CAUSTIC_GLSL + shader.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + color)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + normal)
      .replace('#include <opaque_fragment>', `
      if (vCWorld.y < 0.0) {
        vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
        float facing = clamp(dot(normal, upV) * 0.7 + 0.3, 0.0, 1.0);
        float cs = causticPattern(vCWorld.xz * 0.55 + vCWorld.y * 0.12, uCausticTime * 0.6);
        outgoingLight += diffuseColor.rgb * vec3(0.5, 0.8, 0.85) * cs * facing * 1.2 * exp(vCWorld.y * 0.12);
      }
      ${light}
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'caustics' + vertex + color + normal + light;
}

// Bump the shading normal by a procedural height `h` (metres) using screen-space
// derivatives, so detail needs no textures or UVs.
const bump = (h, k = 1) => /* glsl */`
  {
    float bh = (${h});
    vec3 bp = -vViewPosition, bdx = dFdx(bp), bdy = dFdy(bp);
    vec3 br1 = cross(bdy, normal), br2 = cross(normal, bdx);
    float bdet = dot(bdx, br1);
    normal = normalize(abs(bdet) * normal - sign(bdet) * (dFdx(bh) * br1 + dFdy(bh) * br2) * ${k.toFixed(3)});
  }`;

// Surface detail per material, keyed by the material names exported from Blender.
const DETAIL = {
  // Hull topsides: rust/grime streaks running down from the gunwale, a pale scum
  // band at the waterline, slight plate waviness.
  AD_hull: {
    color: /* glsl */`
      float hy = vObjPos.y;
      float streak = vnoise12(vec2((vObjPos.x + vObjPos.z) * 6.0, 0.5)) * vnoise12(vec2((vObjPos.x - vObjPos.z) * 21.0, hy * 0.8));
      float drip = smoothstep(0.25, 1.0, hy) * smoothstep(0.42, 0.75, streak);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.065, 0.03), drip * 0.65);
      float band = smoothstep(0.0, 0.08, hy) * (1.0 - smoothstep(0.1, 0.32, hy));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.14, 0.12), band * (0.45 + 0.55 * vnoise12(vObjPos.xz * vec2(9.0, 3.0) + hy * 4.0)));`,
    normal: bump('vnoise12(vec2(vObjPos.x * 1.3, vObjPos.y * 2.0 + vObjPos.z)) * 0.004', 1) +
      '\n      roughnessFactor = clamp(roughnessFactor + (streak - 0.4) * 0.35 + band * 0.3, 0.08, 1.0);',
  },
  AD_cabin: {
    color: /* glsl */`
      float cst = vnoise12(vec2((vObjPos.x + vObjPos.z) * 14.0, 0.3)) * smoothstep(1.2, 1.75, vObjPos.y) * (1.0 - smoothstep(1.75, 1.8, vObjPos.y));
      diffuseColor.rgb *= 1.0 - 0.18 * smoothstep(0.45, 0.8, cst) - 0.08 * vnoise12(vObjPos.xy * 3.0);`,
  },
  // Non-slip deck: fine raised dots and scuffed, dirtier patches.
  AD_deck: {
    color: 'diffuseColor.rgb *= 0.75 + 0.45 * vnoise12(vObjPos.xz * 2.3);',
    normal: bump('smoothstep(0.55, 0.75, vnoise12(vObjPos.xz * 70.0)) * 0.0015', 1),
  },
  // Drysuit fabric: soft creases, finer wrinkles, and weave that fades with distance.
  AD_suit: { normal: bump(/* glsl */`
      vnoise12(vec2(vObjPos.y * 38.0, (vObjPos.x + vObjPos.z) * 7.0)) * 0.004
      + vnoise12(vObjPos.xy * vec2(22.0, 95.0)) * 0.0015
      + sin(vObjPos.x * 650.0) * sin(vObjPos.y * 650.0) * 0.00025 * (1.0 - smoothstep(0.0, 0.002, fwidth(vObjPos.y)))`, 1) },
  AD_suitpanel: { normal: bump('vnoise12(vObjPos.xy * vec2(30.0, 80.0)) * 0.002 + smoothstep(0.6, 0.8, vnoise12(vObjPos.xz * 140.0)) * 0.0006', 1) },
  AD_bcd: { normal: bump('vnoise12(vec2(vObjPos.y * 55.0, vObjPos.x * 12.0)) * 0.003', 1) },
  AD_glove: { normal: bump('smoothstep(0.5, 0.7, vnoise12(vObjPos.xy * 220.0)) * 0.0006', 1) },
};
// Ice: cold blue glow at grazing angles and a gently rippled, melted surface.
const ICE_DETAIL = {
  normal: bump('vnoise12(vObjPos.xz * 0.9 + vObjPos.y) * 0.06 + vnoise12(vObjPos.xy * 3.1) * 0.02', 1),
  light: /* glsl */`
    float iceRim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 3.0);
    outgoingLight += vec3(0.07, 0.36, 0.48) * iceRim * 0.3;`,
};

// Boat
const boat = boatGltf.scene;
boat.traverse(o => {
  if (!o.isMesh) return;
  o.castShadow = o.receiveShadow = true;
  // Painted steel hull: a touch lighter and less metallic so the wear reads.
  // (the material is shared by the weld-seam tubes too, so adjust it only once)
  if (o.material.name === 'AD_hull' && !o.material.userData.tuned) {
    Object.assign(o.material, { metalness: 0.4, roughness: 0.42 });
    o.material.color.multiplyScalar(1.7);
    o.material.userData.tuned = true;
  }
  // Wheelhouse glass: tinted and reflective, but see-through to the interior.
  if (o.material.name === 'AD_glass') {
    Object.assign(o.material, { transparent: true, opacity: 0.38, depthWrite: false, envMapIntensity: 1.6 });
    o.castShadow = false;
    o.renderOrder = 2;
  }
});
world.add(boat);

// Ice: hero bergs, distant tabular bergs near the horizon, scattered growlers
const iceMat = new THREE.MeshPhysicalMaterial({
  vertexColors: true, roughness: 0.34, clearcoat: 0.4, clearcoatRoughness: 0.25,
  emissive: new THREE.Color(0.005, 0.022, 0.035), envMapIntensity: 1.0,
});
const icePieces = {};
iceGltf.scene.traverse(o => { if (o.isMesh) icePieces[o.name] = o; });
// Cylinders around each berg's submerged bulk, for the swimmer to bump into.
const iceColliders = [];
const placeIce = (name, x, z, rot, s = 1) => {
  const m = new THREE.Mesh(icePieces[name].geometry, iceMat);
  if (name.startsWith('Berg')) {
    const g = icePieces[name].geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const b = g.boundingBox;
    iceColliders.push({ x, z, r: Math.max(-b.min.x, b.max.x, -b.min.z, b.max.z) * s * 0.92 });
  }
  m.position.set(x, 0, z);
  m.rotation.y = rot;
  m.scale.setScalar(s);
  m.receiveShadow = true;
  world.add(m);
  return m;
};
placeIce('BergBroken', 22, 18, 0.6);
placeIce('BergTabularA', -170, -250, 0.3);
placeIce('BergTabularB', 430, -640, -0.2);
placeIce('BergDome', -520, 280, 1.2);
placeIce('BergTabularB', 950, -1300, 0.1, 1.4);
placeIce('BergTabularA', -800, -1000, -0.5, 1.2);
placeIce('BergTabularA', 260, 720, 2.0, 0.8);
placeIce('BergBroken', -70, 95, 2.2, 0.9);
{
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 18; i++) {
    let x, z;
    do { const a = rnd() * 6.28, r = 16 + rnd() * 120; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    while (Math.abs(x) < 14 && z > -6 && z < 22);
    const g = placeIce('Growler' + (i % 8), x, z, rnd() * 6.28, 0.6 + rnd() * 0.9);
    g.position.y = -0.1;
    g.castShadow = true;
  }
}

// Mountains far off, hazed by fog, reflected in the sea
const mountains = mountainGltf.scene;
mountains.traverse(o => { if (o.isMesh) o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }); });
mountains.position.set(-900, 0, -3300);
mountains.rotation.y = 0.35;
mountains.scale.set(1, 0.7, 1);
world.add(mountains);

// Diver
const rig = new DiverRig(diverGltf);
world.add(rig.root);

const patched = new Set();
world.traverse(o => {
  if (!o.material) return;
  for (const m of [].concat(o.material)) {
    if (patched.has(m)) continue;
    patched.add(m);
    m.clippingPlanes = [clipPlane];
    if (!o.isPoints && !mountains.getObjectById(o.id)) addCaustics(m, m === iceMat ? ICE_DETAIL : DETAIL[m.name]);
  }
});

let seedU = 29;
const rngU = () => ((seedU = (seedU * 16807) % 2147483647) / 2147483647);
const underwater = createUnderwater(world, {
  addCaustics, clipPlane, rng: rngU,
  models: { kelp: instanceGeometry(kelpGltf), anemone: instanceGeometry(anemoneGltf), fish: instanceGeometry(fishGltf) },
});

const player = createPlayer({ rig, boat, ladderIK, maskIK, addRipple, splash, bubbleBurst, exhale, iceColliders });

// Brash ice: small floating chunks riding the surface, seen from above and as
// silhouettes from below.
const brash = (() => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position, v = V(0, 0, 0);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + 0.35 * Math.sin(v.x * 5.1 + v.z * 3.7) * Math.cos(v.y * 4.3 - v.x * 2.9);
    p.setXYZ(i, v.x * k, Math.max(-0.9, Math.min(0.35, v.y * 0.55 * k)), v.z * k);
  }
  g.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xd8eef6, roughness: 0.4, clearcoat: 0.3, emissive: new THREE.Color(0.01, 0.035, 0.05), clippingPlanes: [clipPlane],
  });
  addCaustics(mat, ICE_DETAIL);
  const n = 240, mesh = new THREE.InstancedMesh(g, mat, n);
  const items = [];
  for (let i = 0; i < n; i++) {
    let x, z;
    do { const a = rngU() * 6.28, r = 7 + rngU() ** 0.7 * 85; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    while ((Math.abs(x + 1) < 7 && Math.abs(z) < 4.5) || (Math.abs(x + 2.7) < 3 && z > 0 && z < 5));
    const s = 0.2 + rngU() ** 2 * 1.1;
    items.push({ x, z, s, sy: s * (0.5 + rngU() * 0.5), rot: rngU() * 6.28, ph: rngU() * 6.28 });
  }
  mesh.castShadow = mesh.receiveShadow = true;
  world.add(mesh);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V(0, 0, 0), ps = V(0, 0, 0);
  return {
    update(t) {
      items.forEach((it, i) => {
        q.setFromEuler(e.set(Math.sin(t * 0.7 + it.ph) * 0.04, it.rot + t * 0.004, Math.cos(t * 0.6 + it.ph) * 0.04));
        m.compose(ps.set(it.x + Math.sin(t * 0.03 + it.ph) * 0.6, Math.sin(t * 0.9 + it.ph) * 0.02 - 0.04 * it.s, it.z), q, sc.set(it.s, it.sy, it.s * 0.9));
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
})();

// ---------------------------------------------------------------------------
// Particles: splash spray (above), bubbles and marine snow (below)
// ---------------------------------------------------------------------------
const dotTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const ringTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(28, 26, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.15)');
  gr.addColorStop(0.8, 'rgba(255,255,255,0.35)');
  gr.addColorStop(0.95, 'rgba(255,255,255,0.8)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(32, 32, 31, 0, Math.PI * 2);
  g.fill();
  return new THREE.CanvasTexture(c);
})();

function particleSystem(n, material) {
  const pos = new Float32Array(n * 3).fill(-1000), col = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  scene.add(points);
  return { n, pos, col, vel: new Float32Array(n * 3), life: new Float32Array(n), next: 0, points, geo };
}
const spray = particleSystem(240, new THREE.PointsMaterial({
  size: 0.09, map: dotTex, vertexColors: true, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, clippingPlanes: [clipPlane],
}));
const bubbles = particleSystem(500, new THREE.PointsMaterial({
  size: 0.06, map: ringTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
const snow = particleSystem(1400, new THREE.PointsMaterial({
  size: 0.025, map: dotTex, color: 0x9fc3c8, transparent: true, opacity: 0.55, depthWrite: false,
}));
for (let i = 0; i < snow.n; i++) {
  snow.pos[i * 3] = (Math.random() - 0.5) * 30;
  snow.pos[i * 3 + 1] = -Math.random() * 30;
  snow.pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
}
snow.geo.attributes.position.needsUpdate = true;

function emit(sys, x, y, z, vx, vy, vz, life) {
  const k = sys.next;
  sys.next = (k + 1) % sys.n;
  sys.pos.set([x, y, z], k * 3);
  sys.vel.set([vx, vy, vz], k * 3);
  sys.life[k] = life;
}
function splash(x, z, count, power) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 6.28, r = Math.random();
    emit(spray, x + Math.cos(a) * 0.3 * r, 0.02, z + Math.sin(a) * 0.3 * r,
      Math.cos(a) * (0.3 + r * 1.6) * power, (1.8 + Math.random() * 3.8) * power, Math.sin(a) * (0.3 + r * 1.6) * power, 0.8 + Math.random() * 0.4);
  }
}
function bubbleBurst(p, count, spread) {
  for (let i = 0; i < count; i++) {
    emit(bubbles, p.x + (Math.random() - 0.5) * spread, p.y + (Math.random() - 0.5) * spread, p.z + (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * 0.2, 0.5 + Math.random() * 0.7, (Math.random() - 0.5) * 0.2, 1);
  }
}

let lastBubbleRipple = 0;
function updateParticles(dt, t) {
  for (let k = 0; k < spray.n; k++) {
    if (spray.life[k] <= 0) continue;
    const i = k * 3;
    spray.vel[i + 1] -= 9.8 * dt;
    for (let a = 0; a < 3; a++) spray.pos[i + a] += spray.vel[i + a] * dt;
    spray.life[k] -= dt * 0.8;
    if (spray.pos[i + 1] < -0.05) spray.life[k] = 0;
    spray.col.fill(Math.max(spray.life[k], 0) * 0.9, i, i + 3);
    if (spray.life[k] <= 0) spray.pos[i + 1] = -1000;
  }
  for (let k = 0; k < bubbles.n; k++) {
    if (bubbles.life[k] <= 0) continue;
    const i = k * 3;
    bubbles.vel[i + 1] = Math.min(bubbles.vel[i + 1] + dt * 0.6, 1.6);
    bubbles.pos[i] += (bubbles.vel[i] + Math.sin(t * 9 + k) * 0.12) * dt;
    bubbles.pos[i + 1] += bubbles.vel[i + 1] * dt;
    bubbles.pos[i + 2] += (bubbles.vel[i + 2] + Math.cos(t * 8 + k * 1.3) * 0.12) * dt;
    bubbles.col.fill(0.75, i, i + 3);
    if (bubbles.pos[i + 1] > -0.04) {
      if (t - lastBubbleRipple > 0.2) { lastBubbleRipple = t; addRipple(bubbles.pos[i], bubbles.pos[i + 2], 0.12); }
      bubbles.life[k] = 0;
      bubbles.pos[i + 1] = -1000;
    }
  }
  // Marine snow lives in a 30 m box that wraps around the camera.
  const c = camera.position;
  for (let k = 0; k < snow.n; k++) {
    const i = k * 3;
    snow.pos[i + 1] -= dt * 0.03;
    for (let a = 0; a < 3; a++) {
      const o = snow.pos[i + a] - c.getComponent(a);
      if (o > 15) snow.pos[i + a] -= 30; else if (o < -15) snow.pos[i + a] += 30;
    }
    if (snow.pos[i + 1] > 0) snow.pos[i + 1] -= 30;
  }
  for (const s of [spray, bubbles, snow]) {
    s.geo.attributes.position.needsUpdate = true;
    s.geo.attributes.color.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------
// Choreography (boat-local coordinates; bow +X, the dive gate on +Z)
// ---------------------------------------------------------------------------
const DECK = 1.05;
const P0 = V(-1.55, DECK, -0.25);      // by the tank rack
const PG = V(-2.74, DECK, 0.98);       // at the dive gate
const SWIM_PATH = new THREE.CatmullRomCurve3([
  V(-2.74, -2.6, 2.2), V(0.5, -4.2, 5.5), V(5.5, -5.8, 8.5), V(9.0, -6.6, 5.0),
  V(4.5, -5.6, 0.8), V(0.5, -4.4, -1.4), V(-2.2, -3.0, 0.4), V(-2.74, -1.9, 1.85),
], false, 'centripetal');
const YAW0 = 0.35, WALK_YAW = Math.atan2(PG.x - P0.x, PG.z - P0.z), BACK_YAW = Math.atan2(P0.x - PG.x, P0.z - PG.z);
const T = { mask: 3, walk: 4.4, turn: 6.6, stride: 7.4, fall: 8, sink: 8.75, swim: 11, ascend: 36, hang: 38, climb: 38.6, board: 41, back: 42, settle: 44.2 };
const CYCLE = 45;

let cycleId = -1, ev = {};
const diverPos = V(0, 0, 0), tmp = V(0, 0, 0), tangent = V(0, 0, 0), regPos = V(0, 0, 0);
const onBoat = v => boat.localToWorld(v.clone());

function updateDiver(time) {
  const id = Math.floor(time / CYCLE), c = time - id * CYCLE;
  if (id !== cycleId) { cycleId = id; ev = { bubble: 0, ladder: 0 }; }
  let P, yaw = YAW0, pitch = 0, pos;

  if (c < T.walk) {
    P = mixPose(standPose(time), POSE.maskCheck, ss(T.mask, T.mask + 0.4, c) * (1 - ss(T.walk - 0.4, T.walk, c)));
    pos = P0.clone();
  } else if (c < T.turn) {
    const k = (c - T.walk) / (T.turn - T.walk);
    P = mixPose(walkPose((c - T.walk) * 7), standPose(time), ss(0.85, 1, k) + 1 - ss(0, 0.12, k));
    yaw = lerpAngle(YAW0, WALK_YAW, ss(0, 0.15, k));
    pos = P0.clone().lerp(PG, lerp(k, smooth(k), 0.5));
  } else if (c < T.stride) {
    const k = ss(T.turn, T.stride, c);
    P = mixPose(standPose(time), POSE.stride, k);
    yaw = lerpAngle(WALK_YAW, 0, k);
    pos = PG.clone();
  } else if (c < T.fall) {
    const k = ss(T.stride, T.fall, c);
    P = mixPose(POSE.stride, POSE.strideOut, ss(T.stride, T.stride + 0.4, c));
    yaw = 0;
    pos = V(PG.x, DECK - 0.1 * k, lerp(PG.z, 1.75, k));
  } else if (c < T.sink) {
    const tau = c - T.fall;
    P = mixPose(POSE.strideOut, POSE.fall, ss(0, 0.25, tau));
    yaw = 0;
    pos = V(PG.x, DECK - 0.1 - 4.9 * tau * tau, lerp(1.75, 1.95, tau / (T.sink - T.fall)));
  } else if (c < T.swim) {
    const k = (c - T.sink) / (T.swim - T.sink);
    const start = SWIM_PATH.getPointAt(0);
    SWIM_PATH.getTangentAt(0, tangent);
    P = mixPose(mixPose(POSE.fall, sinkPose(time), ss(0, 0.25, k)), swimPose(time), ss(0.6, 1, k));
    yaw = lerpAngle(0, Math.atan2(tangent.x, tangent.z), ss(0.5, 1, k));
    pitch = lerp(0, Math.PI / 2 + Math.asin(-tangent.y), ss(0.55, 1, k));
    pos = V(PG.x, lerp(-0.88, start.y, 1 - (1 - k) * (1 - k)) - HIP, lerp(1.95, start.z, k));
  } else if (c < T.ascend) {
    const s = (c - T.swim) / (T.ascend - T.swim);
    const u = lerp(s, smooth(s), 0.5);
    pos = SWIM_PATH.getPointAt(u).sub(V(0, HIP, 0));
    pos.y += Math.sin(time * 1.7) * 0.05;
    SWIM_PATH.getTangentAt(u, tangent);
    yaw = Math.atan2(tangent.x, tangent.z);
    const swimPitch = Math.PI / 2 + Math.asin(-tangent.y);
    const up = ss(0.94, 1, s);
    pitch = lerp(swimPitch, 0.1, up);
    P = mixPose(swimPose(time), ascendPose(time), up);
  } else if (c < T.hang) {
    const k = (c - T.ascend) / (T.hang - T.ascend);
    const end = SWIM_PATH.getPointAt(1);
    SWIM_PATH.getTangentAt(1, tangent);
    P = ascendPose(time);
    yaw = lerpAngle(Math.atan2(tangent.x, tangent.z), Math.PI, ss(0, 0.6, k));
    pitch = lerp(0.1, 0, k);
    pos = V(lerp(end.x, PG.x, k), lerp(end.y, -0.45, smooth(k)) - HIP, lerp(end.z, 1.85, k));
  } else if (c < T.climb) {
    P = mixLegs(ascendPose(time), mixPose(ascendPose(time), climbPose(0), ss(T.hang, T.climb, c)), 0);
    yaw = Math.PI;
    pos = V(PG.x, -0.45 - HIP + Math.sin(time * 2.2) * 0.03, 1.85);
  } else if (c < T.board) {
    const k = (c - T.climb) / (T.board - T.climb);
    const hipY = lerp(-0.45, DECK + 0.5, smooth(k));
    P = mixLegs(ascendPose(time), climbPose((c - T.climb) * 5.4), ss(-0.45, 0.15, hipY));
    yaw = Math.PI;
    pos = V(PG.x, hipY - HIP, lerp(1.85, 1.62, k));
    if (k < 0.4 && time - ev.ladder > 0.45) { ev.ladder = time; const w = onBoat(V(PG.x, 0, 1.8)); addRipple(w.x, w.z, 0.3); }
  } else if (c < T.back) {
    const k = ss(T.board, T.back, c);
    P = mixPose(climbPose((T.board - T.climb) * 5.4), standPose(time), k);
    yaw = Math.PI;
    pos = V(PG.x, lerp(DECK + 0.5 - HIP, DECK, k), lerp(1.62, PG.z, k));
  } else if (c < T.settle) {
    const k = (c - T.back) / (T.settle - T.back);
    P = mixPose(walkPose((c - T.back) * 7), standPose(time), ss(0.85, 1, k) + 1 - ss(0, 0.12, k));
    yaw = lerpAngle(Math.PI, BACK_YAW, ss(0, 0.2, k));
    pos = PG.clone().lerp(P0, lerp(k, smooth(k), 0.5));
  } else {
    P = standPose(time);
    yaw = lerpAngle(BACK_YAW, YAW0 + Math.PI * 2, ss(T.settle, CYCLE, c));
    pos = P0.clone();
  }

  // pos is where the soles would be standing; the rig pivots at the hips.
  pos.y += HIP + (P.dy || 0);
  const aboard = c < T.fall || c >= T.board;
  rig.root.position.copy(aboard ? onBoat(pos) : pos);
  rig.root.rotation.set(pitch || P.pitch, yaw, 0);
  rig.apply(P, pitch || P.pitch);
  rig.root.updateMatrixWorld(true);
  applyIK(time, c);
  diverPos.copy(rig.root.position);

  // Events
  if (c > T.fall && !ev.entry && rig.lowestFootY(tmp) < 0) {
    ev.entry = 1;
    addRipple(diverPos.x, diverPos.z, 1.5);
    splash(diverPos.x, diverPos.z, 110, 1.0);
    bubbleBurst(V(diverPos.x, -0.8, diverPos.z), 90, 0.8);
  }
  rig.head.getWorldPosition(tmp);
  if (c > T.ascend && !ev.surface && tmp.y > -0.05) {
    ev.surface = 1;
    addRipple(tmp.x, tmp.z, 0.8);
    splash(tmp.x, tmp.z, 26, 0.4);
  }
  exhale(time, ev);
}

// Breathe out a stream of bubbles every 3.6 s while the head is under.
function exhale(time, state) {
  rig.head.getWorldPosition(tmp);
  if (tmp.y > -0.3 || time % 3.6 > 0.7 || time - (state.bubble || 0) < 0.035) return;
  state.bubble = time;
  rig.regulator.getWorldPosition(regPos);
  bubbleBurst(regPos, 2, 0.06);
}

// IK targets. The ladder matches tools/blender/boat.py (boat-local): rails at
// x = PG.x ± 0.2, z = 1.42; rungs every 0.32 m; rails rise to 1.65 above the deck.
const LADDER_Z = 1.42;
const RUNGS = [1.0, 0.68, 0.36, 0.04, -0.28, -0.6];
const GRIPS = [1.6, 1.32, ...RUNGS];
const limbSteps = {};
const ikTarget = V(0, 0, 0), ikPole = V(0, 0, 0), ikTmp = V(0, 0, 0), hipLocal = V(0, 0, 0);
const charDir = (x, y, z) => V(x, y, z).applyQuaternion(rig.root.quaternion);
// Hands and feet hop between holds: when the chosen hold changes, swing to the
// new one over 0.3 s along a small arc instead of snapping. A limb that wasn't
// on a hold a moment ago starts its swing from where it actually is (`start`),
// so nothing is remembered from the previous climb.
function stepTo(key, goal, time, lift, start) {
  let st = limbSteps[key];
  if (!st || time - st.used > 0.5) {
    st = limbSteps[key] = { from: (start || goal).clone(), to: goal.clone(), t0: start ? time : -9, used: time };
  }
  st.used = time;
  const at = k => st.from.clone().lerp(st.to, smooth(k));
  if (st.to.distanceToSquared(goal) > 1e-4) { st.from.copy(at(clamp01((time - st.t0) / 0.3))); st.to.copy(goal); st.t0 = time; }
  const k = clamp01((time - st.t0) / 0.3);
  return at(k).addScaledVector(lift, Math.sin(k * Math.PI));
}
const pickHold = (holds, parity, below) => holds.filter((h, i) => i % 2 === parity && h <= below).reduce((a, b) => Math.max(a, b), -Infinity);

function applyIK(time, c) {
  // Ladder: hands on the rails, feet on the rungs.
  const wClimb = ss(T.hang, T.climb, c) * (1 - ss(T.board - 0.1, T.board + 0.5, c));
  if (c < T.back) ladderIK(time, wClimb, c < T.board);
  const wCheck = ss(T.mask, T.mask + 0.4, c) * (1 - ss(T.walk - 0.4, T.walk, c));
  const wStride = ss(T.turn, T.stride, c) * (1 - ss(T.sink - 0.2, T.sink + 0.3, c));
  maskIK(wCheck, wStride);
}

function ladderIK(time, wClimb, withFeet) {
  const yaw = rig.root.rotation.y;
  if (wClimb > 0) {
    boat.worldToLocal(hipLocal.copy(rig.root.position));
    ['L', 'R'].forEach((S, i) => {
      const s = i ? 1 : -1, side = s * Math.cos(yaw);
      let g = pickHold(GRIPS, i, hipLocal.y + 0.85);
      if (!isFinite(g)) g = GRIPS[GRIPS.length - 1 - i];
      const handNow = boat.worldToLocal(rig.bones['hand' + S].getWorldPosition(ikTmp));
      const hand = stepTo('hand' + S, V(PG.x + side * 0.2, g - 0.06, LADDER_Z + 0.06), time, V(0, 0.05, 0.08), handNow);
      rig.solveLimb('upperarm' + S, 'forearm' + S, 'hand' + S, onBoat(hand), rig.bones['upperarm' + S].getWorldPosition(ikPole).add(charDir(s * 0.5, -0.6, -0.4)), wClimb);
      // A foot only takes a rung that is below it and within reach; until then
      // the leg keeps its FK kick, and the IK fades in as the rung comes in range.
      const r = withFeet ? pickHold(RUNGS, i, hipLocal.y - 0.62) : -Infinity;
      if (isFinite(r)) {
        const reach = hipLocal.y - (r + 0.07);
        const wFoot = wClimb * ss(0.6, 0.75, reach) * (1 - ss(0.92, 1.02, reach));
        const footNow = boat.worldToLocal(rig.bones['foot' + S].getWorldPosition(ikTmp));
        const foot = stepTo('foot' + S, V(PG.x + side * 0.11, r + 0.07, LADDER_Z + 0.1), time, V(0, 0.08, 0.1), footNow);
        if (wFoot > 0) rig.solveLimb('thigh' + S, 'shin' + S, 'foot' + S, onBoat(foot), rig.bones['thigh' + S].getWorldPosition(ikPole).add(charDir(0, 0.2, 1)), wFoot);
      }
    });
  }
}

// Hands to the mask (and belt) for the mask check and the giant stride.
function maskIK(wCheck, wStride) {
  const mask = rig.model.getObjectByName('MaskLens');
  const buckle = rig.model.getObjectByName('Buckle');
  if (mask && (wCheck > 0 || wStride > 0)) {
    ['L', 'R'].forEach((S, i) => {
      const s = i ? 1 : -1;
      const w = Math.max(wCheck, i === 1 ? wStride : 0);
      const toBelt = i === 0 && wStride > wCheck && buckle;
      const w2 = toBelt ? wStride : w;
      if (w2 <= 0) return;
      if (toBelt) buckle.getWorldPosition(ikTarget).add(charDir(-0.06, 0.0, 0.06));
      else mask.getWorldPosition(ikTarget).add(charDir(s * 0.06, -0.03, 0.07));
      rig.solveLimb('upperarm' + S, 'forearm' + S, 'hand' + S, ikTarget, rig.bones['upperarm' + S].getWorldPosition(ikPole).add(charDir(s * 0.6, -0.5, -0.3)), w2);
    });
  }
}

function updateBoat(t) {
  boat.position.set(0, Math.sin(t * 0.7) * 0.03, 0);
  boat.rotation.set(Math.sin(t * 0.53) * 0.014, 0, Math.sin(t * 0.37) * 0.008);
  if (Math.floor(t / 2.3) !== Math.floor((t - 1 / 60) / 2.3)) addRipple(4.4, (Math.random() - 0.5) * 0.6, 0.12);
}

// ---------------------------------------------------------------------------
// Camera director: orbits the boat while the diver is aboard, follows them under
// the surface, looks up as they ascend.
// ---------------------------------------------------------------------------
const camGoal = V(0, 0, 0), targetGoal = V(0, 0, 0);
function directCamera(time, dt) {
  const c = time % CYCLE;
  const ang = time * 0.045;
  const underPhase = c >= T.fall + 0.6 && c < T.climb;
  if (!underPhase) {
    targetGoal.copy(onBoat(V(-1.2, 1.4, 0.2))).lerp(diverPos, 0.55);
    targetGoal.y = THREE.MathUtils.clamp(targetGoal.y, 0.8, 2.2);
    const a = 0.75 + Math.sin(ang) * 0.9;
    camGoal.set(Math.sin(a) * 12.5, 3.0, Math.cos(a) * 12.5).add(targetGoal);
    camGoal.y = Math.max(camGoal.y, 0.9);
  } else {
    targetGoal.copy(diverPos);
    // Stay off to the diver's side, swinging slowly between front and rear quarters.
    const a = rig.root.rotation.y + Math.PI / 2 + Math.sin(time * 0.11) * 0.9;
    const r = c < T.swim ? 5.5 : 6.5;
    const lift = c > T.ascend - 0.5 ? -1.8 : 0.9;
    camGoal.set(Math.sin(a) * r, lift, Math.cos(a) * r).add(targetGoal);
    camGoal.y = Math.min(camGoal.y, -0.7);
  }
  const k = 1 - Math.exp(-dt * 0.9);
  camera.position.lerp(camGoal, k);
  controls.target.lerp(targetGoal, 1 - Math.exp(-dt * 2.2));
}
const prevTarget = V(0, 0, 0), followGoal = V(0, 0, 0);
function followDiver(dt) {
  followGoal.copy(diverPos);
  prevTarget.copy(controls.target);
  controls.target.lerp(followGoal, 1 - Math.exp(-dt * 1.5));
  camera.position.add(prevTarget.sub(controls.target).negate());
}

// ---------------------------------------------------------------------------
// Post: bloom, tone map, then grade / vignette / grain in display space
// ---------------------------------------------------------------------------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(renderer.getPixelRatio());
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.7, 0.92));
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uUnder: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: GRADE_FRAG,
});
composer.addPass(grade);

// ---------------------------------------------------------------------------
// Sizing, adaptive sky resolution, input
// ---------------------------------------------------------------------------
const fixedQ = params.has('q');
let skyScale = fixedQ ? parseFloat(params.get('q')) : 0.9;
function sizeTargets() {
  const w = Math.max(4, Math.round(innerWidth * skyScale)), h = Math.max(4, Math.round(innerHeight * skyScale));
  skyRTs.forEach(rt => rt.setSize(w, h));
  cloudRT.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
  skyUniforms.uFullRes.value.set(w, h);
  resolveUniforms.uLowRes.value.set(Math.ceil(w / 2), Math.ceil(h / 2));
  resolveUniforms.uHistValid.value = 0;
  waterUniforms.uSkyTexel.value.set(1 / w, 1 / h);
  reflRT.setSize(Math.round(innerWidth * 0.75), Math.round(innerHeight * 0.75));
}
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  sizeTargets();
}
addEventListener('resize', resize);
resize();

let paused = params.has('pause');
if (params.has('debug')) window.__ad = { camera, controls, rig, boat, get player() { return player; }, skyUniforms, renderer, scene, renderSky: () => renderSky(), composer, setSkyScale: v => { skyScale = v; sizeTargets(); }, get camMode() { return camMode; }, setMode: m => setMode(m) };
const hud = document.getElementById('hud'), chip = document.getElementById('chip'), stats = document.getElementById('stats');
const promptEl = document.getElementById('prompt'), playBtn = document.getElementById('play');
const VIEW_HELP = hud.querySelector('#controls').innerHTML;
const PLAY_HELP = 'WASD · move &nbsp; mouse · look (click to lock) &nbsp; shift · fast &nbsp; scroll · zoom<br>space · jump / rise &nbsp; c · sink &nbsp; e · ladder &nbsp; p · pause &nbsp; g · exit play';
playBtn.addEventListener('click', () => setMode(camMode === 'play' ? 'auto' : 'play'));

// Fly mode
const keys = new Set();
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'];
const TURN_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const fly = { yaw: 0, pitch: 0, speed: 5, vel: V(0, 0, 0), dragging: false };
const flyEuler = new THREE.Euler(0, 0, 0, 'YXZ'), flyMove = V(0, 0, 0), flyAxis = V(0, 0, 0);
function setMode(m) {
  const wasPlay = camMode === 'play';
  camMode = m;
  clearTimeout(idleTimer);
  controls.enabled = m === 'orbit';
  if (m === 'play' && !wasPlay) {
    player.enterFrom(rig.root.position);
    const off = camera.position.clone().sub(rig.root.position);
    tp.yaw = Math.atan2(off.x, off.z);
    tp.pitch = 0.25;
  }
  if (wasPlay && m !== 'play') { promptEl.textContent = ''; if (document.pointerLockElement) document.exitPointerLock(); }
  hud.querySelector('#controls').innerHTML = m === 'play' ? PLAY_HELP : VIEW_HELP;
  playBtn.textContent = m === 'play' ? 'exit play · g' : 'play as diver · g';
  if (m === 'fly') {
    flyEuler.setFromQuaternion(camera.quaternion, 'YXZ');
    fly.yaw = flyEuler.y;
    fly.pitch = flyEuler.x;
    fly.vel.set(0, 0, 0);
  } else if (document.pointerLockElement) document.exitPointerLock();
  if (m === 'orbit') controls.target.copy(camera.position).add(V(0, 0, -8).applyQuaternion(camera.quaternion));
  updateChip();
}
function updateChip() {
  const label = { auto: 'auto camera', orbit: 'orbit', fly: 'fly · WASD + mouse', play: 'playing · ' + player.state.mode }[camMode];
  chip.textContent = label + (wasUnder ? ' · underwater' : '');
}
function updateFly(dt) {
  const k = c => (keys.has(c) ? 1 : 0);
  fly.yaw += (k('ArrowLeft') - k('ArrowRight')) * 1.4 * dt;
  fly.pitch = THREE.MathUtils.clamp(fly.pitch + (k('ArrowUp') - k('ArrowDown')) * 1.0 * dt, -1.5, 1.5);
  camera.quaternion.setFromEuler(flyEuler.set(fly.pitch, fly.yaw, 0, 'YXZ'));
  flyMove.set(0, 0, 0);
  flyMove.addScaledVector(flyAxis.set(0, 0, -1).applyQuaternion(camera.quaternion), k('KeyW') - k('KeyS'));
  flyMove.addScaledVector(flyAxis.set(1, 0, 0).applyQuaternion(camera.quaternion), k('KeyD') - k('KeyA'));
  flyMove.y += k('KeyE') - k('KeyQ');
  if (flyMove.lengthSq() > 1) flyMove.normalize();
  const speed = fly.speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4 : 1);
  fly.vel.lerp(flyMove.multiplyScalar(speed), 1 - Math.exp(-dt * 8));
  camera.position.addScaledVector(fly.vel, dt);
}
const canvas = renderer.domElement;
// Third-person chase camera (play mode)
const tp = { yaw: 0, pitch: 0.25, dist: 4.2, dragging: false };
const tpPivot = V(0, 0, 0);
function chaseCamera(dt) {
  tpPivot.copy(diverPos).add(V(0, 0.55, 0));
  const cp = Math.cos(tp.pitch);
  camGoal.set(Math.sin(tp.yaw) * cp, Math.sin(tp.pitch), Math.cos(tp.yaw) * cp).multiplyScalar(tp.dist).add(tpPivot);
  camGoal.y = Math.max(camGoal.y, seabedHeight(camGoal.x, camGoal.z) + 0.5);
  camera.position.lerp(camGoal, 1 - Math.exp(-dt * 12));
  camera.lookAt(tpPivot);
}
canvas.addEventListener('pointerdown', e => {
  if (camMode === 'play') {
    if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    tp.dragging = true;
    return;
  }
  if (camMode !== 'fly') return;
  fly.dragging = true;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', () => { fly.dragging = false; tp.dragging = false; });
canvas.addEventListener('pointermove', e => {
  if (camMode === 'play') {
    if (!(tp.dragging || document.pointerLockElement === canvas)) return;
    tp.yaw -= e.movementX * 0.003;
    tp.pitch = THREE.MathUtils.clamp(tp.pitch + e.movementY * 0.003, -1.1, 1.3);
    return;
  }
  if (camMode !== 'fly' || !(fly.dragging || document.pointerLockElement === canvas)) return;
  fly.yaw -= e.movementX * 0.0025;
  fly.pitch = THREE.MathUtils.clamp(fly.pitch - e.movementY * 0.0025, -1.5, 1.5);
});
canvas.addEventListener('dblclick', () => { if (camMode === 'fly') canvas.requestPointerLock(); });
canvas.addEventListener('wheel', e => {
  if (camMode === 'play') {
    tp.dist = THREE.MathUtils.clamp(tp.dist * (e.deltaY > 0 ? 1.12 : 0.89), 1.8, 14);
    e.preventDefault();
    return;
  }
  if (camMode !== 'fly') return;
  fly.speed = THREE.MathUtils.clamp(fly.speed * (e.deltaY > 0 ? 0.87 : 1.15), 0.5, 80);
  e.preventDefault();
}, { passive: false });
addEventListener('blur', () => keys.clear());
addEventListener('keyup', e => keys.delete(e.code));
const justPressed = new Set();
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'KeyG') { setMode(camMode === 'play' ? 'auto' : 'play'); return; }
  if (camMode === 'play') {
    keys.add(e.code);
    if (!e.repeat) justPressed.add(e.code);
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyE'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyP') paused = !paused;
    if (e.code === 'KeyH') { hud.classList.toggle('hidden'); chip.classList.toggle('hidden'); }
    return;
  }
  const move = MOVE_KEYS.includes(e.code) || TURN_KEYS.includes(e.code);
  if (move || e.code.startsWith('Shift')) keys.add(e.code);
  if (move) {
    e.preventDefault();
    if (camMode !== 'fly') setMode('fly');
  }
  if (e.code === 'KeyP' || e.code === 'Space') { paused = !paused; e.preventDefault(); }
  if (e.code === 'KeyH') { hud.classList.toggle('hidden'); chip.classList.toggle('hidden'); }
  if (e.code === 'KeyC') setMode('auto');
  if (e.code === 'KeyO') setMode('orbit');
  if (e.code === 'Escape' && camMode === 'fly') setMode('orbit');
});

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let frameAcc = 0, frameCount = 0, first = true, wasUnder = null;

function setUnderwater(under) {
  scene.fog = under ? fogBelow : fogAbove;
  scene.environment = under ? envBelow : envAbove;
  sun.intensity = under ? 1.7 : 2.6;
  sun.color.set(under ? 0x9fd8e6 : 0xfff1e0);
  hemi.color.set(under ? 0x4fa3b0 : 0xa9b8c8);
  hemi.groundColor.set(under ? 0x02080c : 0x1a2228);
  hemi.intensity = under ? 1.5 : 1.6;
  bubbles.points.visible = snow.points.visible = under;
  // Everything in the set sits below the clip plane; skip drawing it from above.
  underwater.group.visible = under;
  spray.points.visible = !under;
  waterUniforms.uUnder.value = grade.uniforms.uUnder.value = under ? 1 : 0;
  wasUnder = under;
  updateChip();
}

// One simulated + rendered frame. The live loop feeds it wall-clock time; the
// offline capture (tools/capture.js) feeds it a fixed step.
let camHook = null;
function step(dt) {
  if (!paused) simTime += dt;

  updateBoat(simTime);
  if (camMode === 'play') {
    const k = c => (keys.has(c) ? 1 : 0);
    player.update(paused ? 0 : dt, simTime, {
      fwd: k('KeyW') - k('KeyS'), right: k('KeyD') - k('KeyA'), up: k('Space') - k('KeyC'),
      sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      jump: justPressed.has('Space'), interact: justPressed.has('KeyE'),
      camYaw: tp.yaw, camPitch: tp.pitch,
    });
    justPressed.clear();
    diverPos.copy(rig.root.position);
    if (promptEl.textContent !== player.state.prompt) promptEl.textContent = player.state.prompt;
    updateChip();
  } else updateDiver(simTime);
  if (!paused) updateParticles(dt, simTime);

  const prevCamY = camera.position.y;
  if (camMode === 'fly') updateFly(dt);
  else if (camMode === 'play') chaseCamera(dt);
  else if (camMode === 'capture') { if (camHook) camHook(dt, simTime); }
  else {
    if (camMode === 'auto') directCamera(simTime, dt); else followDiver(dt);
    controls.update();
  }
  // Keep the lens off the waterline itself, hopping to whichever side it's heading.
  if (Math.abs(camera.position.y) < 0.2) {
    const below = camMode === 'auto' || camMode === 'play' ? camGoal.y < 0 : camera.position.y < prevCamY;
    camera.position.y = below ? -0.2 : 0.2;
  }
  camera.updateMatrixWorld();

  const under = camera.position.y < 0;
  if (under !== wasUnder) setUnderwater(under);
  if (under) {
    // Match mesh fog to the background's horizontal water colour at this depth.
    fogBelow.color.copy(WATER_LO).lerp(WATER_HI, 0.39).multiplyScalar(Math.exp(camera.position.y * 0.045));
  }
  rig.head.getWorldPosition(tmp);
  underwater.update(simTime, rig, tmp.y < -0.2, under);
  brash.update(simTime);

  skyUniforms.uTime.value = waterUniforms.uTime.value = grade.uniforms.uTime.value = causticTime.value = simTime;
  renderSky();

  if (!under) {
    bgQuad.visible = spray.points.visible = false;
    world.scale.y = -1;
    world.updateMatrixWorld(true);
    clipPlane.normal.set(0, -1, 0);
    renderer.setRenderTarget(reflRT);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    world.scale.y = 1;
    world.updateMatrixWorld(true);
    bgQuad.visible = spray.points.visible = true;
  }
  clipPlane.normal.set(0, under ? -1 : 1, 0);
  renderer.setRenderTarget(null);
  composer.render();

  frameAcc += dt;
  if (++frameCount === 60) {
    const avg = frameAcc / frameCount;
    if (!fixedQ) {
      if (avg > 0.026 && skyScale > 0.5) { skyScale = Math.max(0.5, skyScale - 0.08); sizeTargets(); }
      else if (avg < 0.013 && skyScale < 1) { skyScale = Math.min(1, skyScale + 0.05); sizeTargets(); }
    }
    stats.textContent = `${Math.round(1 / avg)} fps · clouds ${Math.round(skyScale * 100)}%${paused ? ' · paused' : ''}`;
    frameAcc = frameCount = 0;
  }

  if (first) {
    first = false;
    // Fade out, then take the overlay out of the way of pointer events entirely.
    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 900);
  }
}

function frame() {
  step(Math.min(clock.getDelta(), 0.05));
  requestAnimationFrame(frame);
}

if (params.has('capture')) {
  // Offline capture: no live loop, 1:1 pixels, camera driven by a hook.
  camMode = 'capture';
  controls.enabled = false;
  renderer.setPixelRatio(1);
  composer.setPixelRatio(1);
  resize();
  hud.style.display = chip.style.display = playBtn.style.display = 'none';
  window.__arctic = { tick: step, setCamHook: fn => { camHook = fn; }, camera, rig, renderer, get time() { return simTime; } };
  step(1 / 30);
} else requestAnimationFrame(frame);
