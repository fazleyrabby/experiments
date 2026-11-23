import * as THREE from 'three/webgpu';
import {
  color, densityFogFactor, fog, max, mix, normalWorldGeometry, normalize, oneMinus, pow, smoothstep, texture, time, vec2, vec3,
} from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createGlowMaterial, createGroundMaterials, createInteriorMaterial, createLightConeMaterial, createNoiseTexture,
  createStainedGlassMaterial, createWallMaterial, loadTextureSets,
} from '../materials/surfaces.js';
import { createRain } from '../life/rain.js';
import { loadPropLibrary, PropField } from './assets.js';
import { addBuilding, addCathedral } from './buildings.js';
import { Batches, Colliders, metricBox, splitIntoCells } from './geometry.js';
import { createEnvironment, createLampLights, createMoon } from './lighting.js';
import { addBladeSign, addLamp, addStreetProps } from './props.js';
import { createShopInteriors, shopShots } from './shops.js';
import { Signage } from './signage.js';

const HALF_LENGTH = 60;
const ROAD = 5;
const CURB = 0.15;
const FACADE = 8;
const FINE_DRAW_DISTANCE = 62;

const LEFT = [
  { width: 16, floors: 5, wall: 'brick', tint: [0.66, 0.5, 0.42], gabled: true },
  { width: 19, floors: 6, wall: 'plaster', tint: [0.56, 0.52, 0.46], gabled: false, escape: true },
  { width: 15, floors: 4, wall: 'brick', tint: [0.52, 0.42, 0.38], gabled: true },
  { width: 21, floors: 7, wall: 'stone', tint: [0.55, 0.52, 0.47], gabled: false },
  { width: 14, floors: 5, wall: 'brick', tint: [0.72, 0.52, 0.42], gabled: true, escape: true },
  { width: 18, floors: 6, wall: 'plaster', tint: [0.48, 0.47, 0.44], gabled: true },
  { width: 17, floors: 4, wall: 'brick', tint: [0.6, 0.46, 0.4], gabled: false },
];
const RIGHT = [
  { width: 20, floors: 6, wall: 'stone', tint: [0.5, 0.48, 0.44], gabled: true },
  { width: 14, floors: 4, wall: 'brick', tint: [0.64, 0.44, 0.36], gabled: true, escape: true },
  { width: 18, floors: 7, wall: 'plaster', tint: [0.52, 0.49, 0.45], gabled: false },
  { width: 16, floors: 5, wall: 'brick', tint: [0.58, 0.46, 0.42], gabled: true },
  { width: 21, floors: 6, wall: 'stone', tint: [0.58, 0.55, 0.49], gabled: false, escape: true },
  { width: 15, floors: 4, wall: 'brick', tint: [0.7, 0.5, 0.4], gabled: true },
  { width: 16, floors: 5, wall: 'plaster', tint: [0.45, 0.45, 0.43], gabled: false },
];
const SIGNS = [
  { text: 'HOTEL', color: '#ff3b52', x: -FACADE, y: 8.6, z: -31, side: -1 },
  { text: 'OYSTERS', color: '#38d8ff', x: FACADE, y: 7.9, z: -22, side: 1 },
  { text: 'TAVERN', color: '#ffb347', x: -FACADE, y: 7.4, z: -5, side: -1 },
  { text: 'PAWN', color: '#6dff9d', x: FACADE, y: 6.6, z: 8, side: 1 },
  { text: 'ROOMS', color: '#ff4fa8', x: -FACADE, y: 8.1, z: 22, side: -1 },
  { text: 'NOCTIS', color: '#7fb0ff', x: FACADE, y: 8.4, z: 38, side: 1 },
];

export const SHOTS = [
  { position: [1.5, 1.65, 44], target: [0, 8.5, -60] },
  { position: [-2.1, 0.34, 21], target: [1.4, 2.9, -32] },
  { position: [6.3, 1.62, 11], target: [8.1, 2.6, -5] },
  { position: [-3, 1.6, -9], target: [8, 16, -20] },
  { position: [0.4, 1.7, -49], target: [0, 4.2, 40] },
  { position: [-6.4, 1.62, -18], target: [-3.4, 3.6, -36] },
];

function layoutSide(ctx, buildings, side, seedBase) {
  const total = buildings.reduce((sum, building) => sum + building.width, 0);
  const scale = (HALF_LENGTH * 2) / total;
  let cursor = -HALF_LENGTH;
  const shopLights = [];
  buildings.forEach((building, index) => {
    const width = building.width * scale;
    const placed = addBuilding(ctx, {
      ...building,
      width,
      seed: seedBase + index * 97,
      x: side * FACADE,
      z: cursor + width / 2,
      rotation: side > 0 ? -Math.PI / 2 : Math.PI / 2,
    });
    if (placed.lightPosition) shopLights.push(placed.lightPosition);
    cursor += width;
  });
  return shopLights;
}

function addGround(ctx, scene, materials) {
  const road = new THREE.PlaneGeometry(ROAD * 2, HALF_LENGTH * 2).rotateX(-Math.PI / 2);
  const { position, uv } = road.attributes;
  for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i) / 1.9, position.getZ(i) / 1.9);
  const roadMesh = new THREE.Mesh(road, materials.road);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  const walks = [];
  for (const side of [-1, 1]) {
    const walk = metricBox(FACADE - ROAD, CURB, HALF_LENGTH * 2, 2.1);
    walk.translate(side * (ROAD + FACADE) / 2, CURB / 2, 0);
    walks.push(walk);
    for (let z = -HALF_LENGTH + 0.8; z < HALF_LENGTH; z += 1.6) {
      const shade = 0.56 + ((Math.sin(z * 37.1 + side) + 1) / 2) * 0.16;
      ctx.batches.add('stone', metricBox(0.3, CURB + 0.014, 1.585, 1.6), new THREE.Matrix4().makeTranslation(side * (ROAD + 0.14), (CURB + 0.014) / 2, z), [shade, shade, shade * 0.96]);
    }
    ctx.colliders.box(FACADE - ROAD, CURB, HALF_LENGTH * 2, side * (ROAD + FACADE) / 2, CURB / 2, 0);
  }
  const walkMesh = new THREE.Mesh(mergeGeometries(walks), materials.pavement);
  walkMesh.receiveShadow = true;
  scene.add(walkMesh);
  ctx.colliders.box(ROAD * 2 + 8, 1, HALF_LENGTH * 2 + 8, 0, -0.5, 0);
}

function addLightCones(scene, lanterns) {
  const parts = lanterns.map((lantern) => {
    const cone = new THREE.ConeGeometry(3.05, lantern.y - 0.1, 24, 1, true);
    cone.rotateX(Math.PI);
    const uvs = cone.attributes.uv;
    for (let i = 0; i < uvs.count; i++) uvs.setY(i, 1 - uvs.getY(i));
    cone.translate(lantern.x, (lantern.y + 0.1) / 2, lantern.z);
    return cone;
  });
  const mesh = new THREE.Mesh(mergeGeometries(parts), createLightConeMaterial(0xffa24c));
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  scene.add(mesh);
}

function createNightSky(noise) {
  const direction = normalize(normalWorldGeometry);
  const up = max(direction.y, 0.02);
  const cloudUv = direction.xz.div(up.add(0.35)).mul(0.17);
  const broad = texture(noise, cloudUv.add(vec2(time.mul(0.0021), time.mul(0.0007)))).r;
  const fine = texture(noise, cloudUv.mul(2.8).sub(vec2(time.mul(0.0034), 0))).g;
  const cloud = smoothstep(0.36, 0.7, broad.mul(0.72).add(fine.mul(0.28)));
  const horizon = pow(oneMinus(up), 5);
  const clear = mix(vec3(0.007, 0.01, 0.019), vec3(0.06, 0.05, 0.052), horizon);
  const lit = mix(vec3(0.04, 0.046, 0.064), vec3(0.17, 0.115, 0.085), horizon);
  return mix(clear, lit, cloud);
}

export async function createStreet(renderer, tier, loader) {
  const scene = new THREE.Scene();
  const environment = createEnvironment();
  scene.environment = environment;
  scene.environmentIntensity = 1.05;
  scene.fogNode = fog(color(0x1a1d26), densityFogFactor(0.0072));

  loader.trackDownloads('Bringing in the street', 0.08, 0.62);
  const [sets, library] = await Promise.all([loadTextureSets(renderer), loadPropLibrary()]);
  loader.stopTracking();
  loader.stage('Raising the buildings', 0.62, 0.78);
  await loader.paint();
  const noise = createNoiseTexture();
  scene.backgroundNode = createNightSky(noise);
  const { road, pavement, reflectionHidden, reflectionHooks, compileReflection } = createGroundMaterials(sets, noise, scene, environment);
  const materials = {
    road,
    pavement,
    brick: createWallMaterial(sets.brick, noise, { wetness: 0.62 }),
    plaster: createWallMaterial(sets.plaster, noise, { wetness: 0.7, normalScale: 0.8 }),
    stone: createWallMaterial(sets.stone, noise, { wetness: 0.5 }),
    slate: createWallMaterial(sets.slate, noise, { wetness: 0.72 }),
    iron: createWallMaterial(sets.iron, noise, { wetness: 0.8, normalScale: 0.65, metal: true }),
    lantern: createGlowMaterial(0xffc27a, 12),
  };

  const colliders = new Colliders();
  const ctx = {
    batches: new Batches(),
    colliders,
    glass: [],
    stained: [],
    shops: [],
    props: new PropField(library, colliders),
    signage: new Signage(),
  };
  addGround(ctx, scene, materials);
  loader.progress(0.08);
  await loader.paint();
  const shopLights = layoutSide(ctx, LEFT, -1, 1200);
  loader.progress(0.3);
  await loader.paint();
  shopLights.push(...layoutSide(ctx, RIGHT, 1, 4300));
  loader.progress(0.52);
  await loader.paint();
  addCathedral(ctx, -HALF_LENGTH);
  addBuilding(ctx, { width: 16, floors: 7, wall: 'stone', tint: [0.5, 0.48, 0.45], gabled: true, seed: 8800, x: 0, z: HALF_LENGTH, rotation: Math.PI });

  const lanterns = [];
  for (let i = 0; i < 9; i++) lanterns.push(addLamp(ctx, (i % 2 ? 1 : -1) * 5.46, -52 + i * 13));
  addStreetProps(ctx);
  const signs = SIGNS.map((sign) => addBladeSign(ctx, scene, sign));
  loader.progress(0.72);
  await loader.paint();

  const fineMeshes = ctx.batches.build(materials, scene, new Set(['lantern']));
  reflectionHidden.push(...fineMeshes, ...ctx.props.build(scene));
  ctx.signage.build(scene);
  const interiorMaterial = createInteriorMaterial(noise);
  for (const { parts } of splitIntoCells(ctx.glass)) {
    const interiors = new THREE.Mesh(mergeGeometries(parts, false), interiorMaterial);
    interiors.geometry.computeBoundingSphere();
    scene.add(interiors);
  }
  const shopRooms = createShopInteriors({ scene, shops: ctx.shops, renderer, tier, noise, paneMaterial: interiorMaterial });
  reflectionHooks.push(shopRooms);
  const stainedMaterial = createStainedGlassMaterial();
  const stained = new THREE.Mesh(mergeGeometries(ctx.stained, false), stainedMaterial);
  stained.frustumCulled = false;
  scene.add(stained);

  addLightCones(scene, lanterns);
  createMoon(scene);
  const lamps = createLampLights(scene, lanterns);
  const rain = createRain(scene, tier);
  reflectionHidden.push(rain.streaks, rain.splashes);
  const fineCenters = fineMeshes.map((mesh) => mesh.geometry.boundingSphere.center);

  for (const position of shopLights) {
    const light = new THREE.PointLight(0xffb36b, 7, 8.5, 2);
    light.position.copy(position);
    scene.add(light);
  }
  const roseLight = new THREE.PointLight(0xc75a52, 34, 26, 2);
  roseLight.position.set(0, 19, -55);
  scene.add(roseLight);
  const floods = [[-6.4, 0.7, -56.5], [6.4, 0.7, -56.5], [-12.2, 1, -54.4], [12.2, 1, -54.4]].map(([x, y, z]) => {
    const flood = new THREE.SpotLight(0xffc58a, 340, 50, 0.7, 0.9, 1.7);
    flood.position.set(x, y, z);
    flood.target.position.set(x * 0.72, 21, -60);
    scene.add(flood, flood.target);
    return flood;
  });

  loader.progress(1);
  const streakCount = rain.streaks.geometry.instanceCount;
  const splashCount = rain.splashes.geometry.instanceCount;
  let fineDrawDistance = FINE_DRAW_DISTANCE;
  const lightCount = lamps.count + signs.length + shopLights.length + floods.length + shopRooms.lightCount + 1;
  const route = [
    [0, 1.7, 46], [3.2, 1.7, 22], [-3.2, 1.7, 0], [3.2, 1.7, -24], [0, 2.2, -46],
    [-3.2, 1.7, -24], [3.2, 1.7, 0], [-3.2, 1.7, 24],
  ];

  return {
    scene,
    lightCount,
    route,
    shots: SHOTS,
    collider: ctx.colliders.build(),
    reflectionHidden,
    shopRooms,
    shopShots: shopShots(ctx.shops),
    compileReflection: (activeRenderer, camera) => compileReflection(activeRenderer, scene, camera),
    setDetail({ rain: rainAmount, rooms, fineDistance }) {
      rain.streaks.geometry.instanceCount = Math.floor(streakCount * rainAmount);
      rain.splashes.geometry.instanceCount = Math.floor(splashCount * rainAmount);
      fineDrawDistance = fineDistance;
      shopRooms.setNearLimit(rooms);
    },
    spawn: { x: 1.2, y: 0.02, z: 45, yaw: 0.02, pitch: 0.08 },
    update(now, dt, cameraPosition) {
      fineMeshes.forEach((mesh, index) => {
        mesh.visible = fineCenters[index].distanceToSquared(cameraPosition) < fineDrawDistance ** 2;
      });
      shopRooms.update(dt, cameraPosition);
      lamps.update(dt, cameraPosition);
      signs.forEach((sign) => sign.update(now));
      const pulse = 0.92 + Math.sin(now * 0.34) * 0.05 + Math.sin(now * 1.3) * 0.025;
      stainedMaterial.userData.pulse.value = pulse;
      roseLight.intensity = 34 * pulse;
    },
  };
}
