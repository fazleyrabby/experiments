// Hand-placed camp props: a live fire pit with tripod kettle, canvas chairs,
// stacked firewood, chopping stump + axe, backpack and a lantern post.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  getBarkMaps,
  getWoodMap,
  getFabricMaps,
  getFlameTexture,
  getSmokeTexture,
  getSoftDotTexture,
  getStoneMaps,
  getMetalMaps
} from './textures.js';
import { createContactShadow } from './decals.js';
import { makeRockGeometry, makeSaggingCanvasGeometry } from './geo.js';
import { createCampChair } from './furniture.js';

export function createCampProps({ getHeight }) {
  const group = new THREE.Group();
  group.name = 'CampProps';

  const bark = getBarkMaps();
  const woodMap = getWoodMap();
  const fabric = getFabricMaps();
  const stoneMaps = getStoneMaps();
  const metalMaps = getMetalMaps();

  const metalMat = new THREE.MeshStandardMaterial({
    map: metalMaps.map,
    roughnessMap: metalMaps.roughnessMap,
    color: 0x8d9296,
    metalness: 0.85,
    roughness: 0.55,
    envMapIntensity: 1.1
  });

  const woodMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    color: 0xc2a178,
    roughness: 0.82,
    metalness: 0.02
  });

  const logMat = new THREE.MeshStandardMaterial({
    map: bark.map,
    normalMap: bark.normalMap,
    color: 0x9c8975,
    roughness: 0.95,
    metalness: 0.02
  });

  const canvasMat = new THREE.MeshStandardMaterial({
    map: fabric.map,
    normalMap: fabric.normalMap,
    color: 0x7c7a60,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.DoubleSide
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneMaps.map,
    normalMap: stoneMaps.normalMap,
    color: 0xd6d2c6,
    roughness: 0.92,
    metalness: 0.02,
    envMapIntensity: 0.6
  });

  const colliders = [];
  const fireX = 4.9;
  const fireZ = 3.3;
  const fireY = getHeight(fireX, fireZ);

  // -------------------------------------------------------------------------
  // Fire pit
  // -------------------------------------------------------------------------
  const fireGroup = new THREE.Group();
  fireGroup.position.set(fireX, fireY, fireZ);

  // Scorch mark on the ground
  const scorchGeo = new THREE.CircleGeometry(0.78, 26);
  {
    const p = scorchGeo.attributes.position;
    for (let i = 1; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const a = Math.atan2(y, x);
      const n = 0.86 + Math.abs(Math.sin(a * 3.4 + 1.1)) * 0.16 + Math.abs(Math.cos(a * 6.1)) * 0.08;
      p.setXY(i, x * n, y * n);
    }
    scorchGeo.rotateX(-Math.PI * 0.5);
  }
  const scorch = new THREE.Mesh(scorchGeo, new THREE.MeshStandardMaterial({
    color: 0x1b1713,
    roughness: 1.0,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3
  }));
  scorch.position.y = 0.008;
  scorch.renderOrder = 1;
  fireGroup.add(scorch);

  // Ring of weathered stones
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 + Math.random() * 0.15;
    const r = 0.63 + (Math.random() - 0.5) * 0.05;
    const stone = new THREE.Mesh(makeRockGeometry(0.14 + Math.random() * 0.05, 1, i + 3, 0.3), stoneMat);
    stone.position.set(Math.cos(a) * r, 0.05 + Math.random() * 0.02, Math.sin(a) * r);
    stone.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    stone.scale.y = 0.78;
    stone.castShadow = true;
    stone.receiveShadow = true;
    fireGroup.add(stone);
  }

  // Steel fire ring
  const fireRing = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.018, 6, 40), metalMat);
  fireRing.rotation.x = -Math.PI * 0.5;
  fireRing.position.y = 0.035;
  fireRing.castShadow = true;
  fireGroup.add(fireRing);

  // Ash bed
  const ash = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 28),
    new THREE.MeshStandardMaterial({ color: 0x27221f, roughness: 1.0 })
  );
  ash.rotation.x = -Math.PI * 0.5;
  ash.position.y = 0.014;
  ash.receiveShadow = true;
  fireGroup.add(ash);

  // Charred logs
  const logDefs = [
    { r: 0.085, l: 0.9, x: 0, z: 0, ry: 0.4, tilt: 0.12 },
    { r: 0.075, l: 0.85, x: 0.05, z: 0.02, ry: 1.7, tilt: -0.16 },
    { r: 0.07, l: 0.8, x: -0.03, z: -0.02, ry: 2.9, tilt: 0.22 }
  ];
  const charMat = new THREE.MeshStandardMaterial({
    map: bark.map,
    color: 0x2f2620,
    roughness: 0.95
  });
  logDefs.forEach(def => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(def.r, def.r * 1.1, def.l, 8), charMat);
    log.rotation.z = Math.PI * 0.5 + def.tilt;
    log.rotation.y = def.ry;
    log.position.set(def.x, 0.1, def.z);
    log.castShadow = true;
    fireGroup.add(log);
  });

  // Embers
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0x3a1508,
    emissive: 0xff5a12,
    emissiveIntensity: 2.4,
    roughness: 0.9
  });
  for (let i = 0; i < 14; i++) {
    const ember = new THREE.Mesh(new THREE.DodecahedronGeometry(0.02 + Math.random() * 0.03, 0), emberMat);
    ember.position.set((Math.random() - 0.5) * 0.55, 0.045, (Math.random() - 0.5) * 0.45);
    fireGroup.add(ember);
  }

  // Flame sprites
  const flameTex = getFlameTexture();
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flameTex,
      color: i < 2 ? 0xffdd88 : 0xff8a2e,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    const base = 0.45 + Math.random() * 0.35;
    sprite.userData = { base, phase: Math.random() * 10 };
    sprite.position.set((Math.random() - 0.5) * 0.28, 0.28 + Math.random() * 0.12, (Math.random() - 0.5) * 0.24);
    sprite.scale.set(base, base * 1.7, 1);
    fireGroup.add(sprite);
    flames.push(sprite);
  }

  // Warm fire light
  const fireLight = new THREE.PointLight(0xff7a2a, 6, 9, 2.0);
  fireLight.position.set(0, 0.55, 0);
  fireGroup.add(fireLight);

  // -------------------------------------------------------------------------
  // Tripod + hanging kettle
  // -------------------------------------------------------------------------
  const tripod = new THREE.Group();
  const tripodTop = new THREE.Vector3(0, 1.35, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const foot = new THREE.Vector3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    const dir = tripodTop.clone().sub(foot);
    const len = dir.length();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), metalMat);
    leg.position.copy(foot).add(tripodTop).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    leg.castShadow = true;
    tripod.add(leg);
  }
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.35, 6), metalMat);
  chain.position.set(0, 1.17, 0);
  tripod.add(chain);
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb6bcc0,
    metalness: 0.9,
    roughness: 0.32,
    envMapIntensity: 1.4
  });
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.18, 18), steelMat);
  kettle.position.set(0, 0.95, 0);
  kettle.castShadow = true;
  tripod.add(kettle);
  const kettleLid = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.03, 16), steelMat);
  kettleLid.position.set(0, 1.05, 0);
  tripod.add(kettleLid);
  const kettleSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.025, 0.2, 8), steelMat);
  kettleSpout.position.set(0.16, 0.98, 0);
  kettleSpout.rotation.z = -1.0;
  tripod.add(kettleSpout);
  const kettleHook = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 5, 12, Math.PI), steelMat);
  kettleHook.position.set(0, 1.08, 0);
  kettleHook.rotation.y = Math.PI * 0.5;
  tripod.add(kettleHook);
  fireGroup.add(tripod);

  // -------------------------------------------------------------------------
  // Smoke sprites
  // -------------------------------------------------------------------------
  const smokeTex = getSmokeTexture();
  const smokePuffs = [];
  for (let i = 0; i < 9; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: smokeTex,
      color: 0xa9a49c,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    }));
    sprite.position.set((Math.random() - 0.5) * 0.2, 0.6 + Math.random() * 1.8, (Math.random() - 0.5) * 0.2);
    const s = 0.4 + Math.random() * 0.5;
    sprite.scale.set(s, s, 1);
    sprite.userData = {
      life: Math.random(),
      speed: 0.25 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.3
    };
    fireGroup.add(sprite);
    smokePuffs.push(sprite);
  }

  group.add(fireGroup);
  colliders.push({ type: 'circle', x: fireX, z: fireZ, r: 0.86 });

  // -------------------------------------------------------------------------
  // Chairs around the fire — tubular frame with a sagging canvas sling
  // -------------------------------------------------------------------------
  function makeChair() {
    return createCampChair({ canvasMat, frameMat: metalMat, woodMat });
  }

  const chairAngles = [2.15, 3.35, 4.35];
  chairAngles.forEach((a, i) => {
    const chair = makeChair();
    const cr = 1.55 + (i === 1 ? 0.15 : 0);
    const cx = fireX + Math.cos(a) * cr;
    const cz = fireZ + Math.sin(a) * cr;
    chair.position.set(cx, getHeight(cx, cz), cz);
    chair.rotation.y = -a - Math.PI * 0.5;

    const shade = createContactShadow(0.34, 0.34, 0.4);
    shade.position.y = 0.02;
    chair.add(shade);

    group.add(chair);
    colliders.push({ type: 'circle', x: cx, z: cz, r: 0.4 });
  });

  // -------------------------------------------------------------------------
  // Firewood stack + chopping stump + axe
  // -------------------------------------------------------------------------
  const stackX = 6.35;
  const stackZ = 1.35;
  const stack = new THREE.Group();
  const rows = [
    { y: 0.1, count: 4 },
    { y: 0.26, count: 3 },
    { y: 0.42, count: 2 }
  ];
  const endGrainMat = new THREE.MeshStandardMaterial({
    color: 0xb08f63,
    roughness: 0.9,
    metalness: 0.0
  });
  rows.forEach((row, ri) => {
    for (let i = 0; i < row.count; i++) {
      const lx = (i - (row.count - 1) * 0.5) * 0.18;
      const lz = (ri - 1) * 0.03;

      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.8, 10), logMat);
      log.rotation.z = Math.PI * 0.5;
      log.rotation.y = 0.08;
      log.position.set(lx, row.y, lz);
      log.castShadow = true;
      log.receiveShadow = true;
      stack.add(log);

      // Cut end grain so the stack doesn't read as plain tubes
      const end = new THREE.Mesh(new THREE.CircleGeometry(0.076, 12), endGrainMat);
      end.position.set(lx + 0.4, row.y, lz);
      end.rotation.y = Math.PI * 0.5 + 0.08;
      stack.add(end);
    }
  });

  // Ratchet strap over the stack
  const stackStrapMat = new THREE.MeshStandardMaterial({ color: 0x2f2a22, roughness: 0.9 });
  const strapBand = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.035, 0.03), stackStrapMat);
  strapBand.position.set(0, 0.28, -0.14);
  strapBand.rotation.z = 0.02;
  stack.add(strapBand);

  const stackShade = createContactShadow(0.62, 0.4, 0.45);
  stackShade.position.y = 0.02;
  stack.add(stackShade);

  stack.position.set(stackX, getHeight(stackX, stackZ), stackZ);
  stack.rotation.y = -0.5;
  group.add(stack);
  colliders.push({ type: 'box', x: stackX, z: stackZ, rot: -0.5, hw: 0.55, hl: 0.32 });

  const stumpX = 6.15;
  const stumpZ = 3.85;
  const stump = new THREE.Group();
  const stumpBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.52, 16), logMat);
  stumpBody.position.y = 0.26;
  stumpBody.castShadow = true;
  stumpBody.receiveShadow = true;
  stump.add(stumpBody);
  const stumpTop = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.295, 0.015, 20), woodMat);
  stumpTop.position.y = 0.52;
  stump.add(stumpTop);

  // Radial checking in the cut face
  for (let i = 0; i < 3; i++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.22 + Math.random() * 0.16), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 }));
    crack.position.set(0, 0.53, 0);
    crack.rotation.y = Math.random() * Math.PI;
    stump.add(crack);
  }

  const axe = new THREE.Group();
  const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.024, 0.74, 8), woodMat);
  axeHandle.position.y = 0.37;
  axeHandle.rotation.z = 0.24;
  axeHandle.castShadow = true;
  axe.add(axeHandle);
  // Head sits at the top of the haft, bit facing back
  const axeHead = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.17, 0.26, 2, 0.012), metalMat);
  axeHead.position.set(-0.085, 0.72, 0);
  axeHead.rotation.z = 0.24;
  axeHead.castShadow = true;
  axe.add(axeHead);
  const axeBit = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 4), metalMat);
  axeBit.position.set(-0.135, 0.71, 0);
  axeBit.rotation.set(0, Math.PI * 0.25, Math.PI * 0.5 + 0.24);
  axe.add(axeBit);
  axe.position.set(0.06, 0.52, 0.06);
  axe.rotation.x = 0.18;
  axe.rotation.z = -0.1;
  stump.add(axe);

  stump.position.set(stumpX, getHeight(stumpX, stumpZ), stumpZ);
  const stumpShade = createContactShadow(0.42, 0.42, 0.45);
  stumpShade.position.y = 0.02;
  stump.add(stumpShade);
  group.add(stump);
  colliders.push({ type: 'circle', x: stumpX, z: stumpZ, r: 0.42 });

  // -------------------------------------------------------------------------
  // Backpack near the tent door
  // -------------------------------------------------------------------------
  const packX = 2.95;
  const packZ = 3.05;
  const pack = new THREE.Group();
  const packBody = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.55, 0.28, 3, 0.08), canvasMat);
  packBody.position.y = 0.28;
  packBody.castShadow = true;
  pack.add(packBody);
  const packTop = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.16, 0.26, 2, 0.06), canvasMat);
  packTop.position.y = 0.6;
  pack.add(packTop);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x3a352c, roughness: 0.9 });
  [-0.1, 0.1].forEach(x => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.52, 0.015), strapMat);
    strap.position.set(x, 0.3, 0.145);
    pack.add(strap);
  });
  const packBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 10), metalMat);
  packBottle.position.set(0.26, 0.42, 0);
  pack.add(packBottle);
  const packCap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 8), metalMat);
  packCap.position.set(0.26, 0.53, 0);
  pack.add(packCap);

  // Side pocket + compression buckles
  const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.22, 0.2, 2, 0.05), canvasMat);
  pocket.position.set(-0.24, 0.26, 0);
  pack.add(pocket);
  [-0.16, 0.16].forEach((y) => {
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.03), new THREE.MeshStandardMaterial({
      color: 0x9aa0a4,
      metalness: 0.7,
      roughness: 0.45
    }));
    buckle.position.set(0, y, 0.15);
    pack.add(buckle);
  });

  const packShade = createContactShadow(0.34, 0.26, 0.45);
  packShade.position.y = 0.02;
  pack.add(packShade);

  pack.position.set(packX, getHeight(packX, packZ), packZ);
  pack.rotation.y = -0.6;
  group.add(pack);
  colliders.push({ type: 'circle', x: packX, z: packZ, r: 0.35 });

  // -------------------------------------------------------------------------
  // Lantern post near the doorway
  // -------------------------------------------------------------------------
  const postX = 3.45;
  const postZ = 2.65;
  const postY = getHeight(postX, postZ);
  const postGroup = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.55, 8), woodMat);
  post.position.y = 0.775;
  post.castShadow = true;
  postGroup.add(post);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 12, Math.PI), metalMat);
  hook.position.set(0.11, 1.54, 0);
  hook.rotation.y = Math.PI * 0.5;
  postGroup.add(hook);

  const lanternBody = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.2, 8), metalMat);
  lanternBody.position.set(0.22, 1.36, 0);
  postGroup.add(lanternBody);
  const lanternGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.065, 0.15, 10),
    new THREE.MeshStandardMaterial({
      color: 0xfff0d4,
      emissive: 0xffae4f,
      emissiveIntensity: 2.4,
      roughness: 0.3
    })
  );
  lanternGlass.position.set(0.22, 1.36, 0);
  postGroup.add(lanternGlass);

  const dotTex = getSoftDotTexture();
  const lanternGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTex,
    color: 0xffb35a,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  lanternGlow.scale.set(0.9, 0.9, 1);
  lanternGlow.position.set(0.22, 1.37, 0);
  postGroup.add(lanternGlow);

  const lanternLight = new THREE.PointLight(0xffa94f, 3.2, 4.5, 2.0);
  lanternLight.position.set(0.22, 1.35, 0);
  postGroup.add(lanternLight);

  postGroup.position.set(postX, postY, postZ);
  const postShade = createContactShadow(0.16, 0.16, 0.4);
  postShade.position.y = 0.015;
  postGroup.add(postShade);
  group.add(postGroup);
  colliders.push({ type: 'circle', x: postX, z: postZ, r: 0.18 });

  // -------------------------------------------------------------------------
  // Ember particles rising from the fire
  // -------------------------------------------------------------------------
  const emberCount = 26;
  const emberGeo = new THREE.BufferGeometry();
  const emberPos = new Float32Array(emberCount * 3);
  const emberData = [];
  for (let i = 0; i < emberCount; i++) {
    emberPos[i * 3] = fireX + (Math.random() - 0.5) * 0.5;
    emberPos[i * 3 + 1] = fireY + 0.15 + Math.random() * 1.6;
    emberPos[i * 3 + 2] = fireZ + (Math.random() - 0.5) * 0.4;
    emberData.push({ speed: 0.25 + Math.random() * 0.6, phase: Math.random() * 10 });
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
  const emberPoints = new THREE.Points(emberGeo, new THREE.PointsMaterial({
    map: dotTex,
    color: 0xff8a3a,
    size: 0.09,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false
  }));
  group.add(emberPoints);

  // -------------------------------------------------------------------------
  // Animation
  // -------------------------------------------------------------------------
  let fireOn = true;
  // How strongly the fire burns (1 = blaze). Rain douses it completely.
  const FIRE_BY_WEATHER = { heavyRain: 0, lightRain: 0 };
  let fireTarget = FIRE_BY_WEATHER.heavyRain;
  let fireAmt = fireTarget;
  const smokeDry = new THREE.Color(0xa9a49c);
  const smokeSteam = new THREE.Color(0xd3dadd);
  const emberBaseOpacity = emberPoints.material.opacity;

  return {
    group,
    colliders,
    // Rain puts the fire down; returns the level so audio can follow.
    setWeather: (key, immediate = false) => {
      fireTarget = FIRE_BY_WEATHER[key] ?? 1;
      if (immediate) fireAmt = fireTarget;
      return fireTarget;
    },
    setFire: (on) => {
      fireOn = on;
      fireLight.intensity = on ? 6 : 0;
      lanternLight.intensity = on ? 3.2 : 0;
      flames.forEach(f => { f.visible = on; });
      smokePuffs.forEach(s => { s.visible = on; });
      emberPoints.visible = on;
      lanternGlow.material.opacity = on ? 0.5 : 0;
    },
    update: (time, delta) => {
      if (!fireOn) return;

      fireAmt += (fireTarget - fireAmt) * Math.min(1, delta * 0.9);
      const burn = fireAmt;
      const wet = 1 - burn;

      // Flame flicker: height collapses first, then the tongues drop out one by one
      flames.forEach((f, i) => {
        const u = f.userData;
        const flick = 0.78 + Math.sin(time * 7.1 + u.phase) * 0.14 + Math.sin(time * 13.3 + u.phase * 2) * 0.08;
        const live = THREE.MathUtils.clamp(burn * 1.25 - i * 0.12, 0, 1);
        f.visible = live > 0.02;
        f.scale.set(u.base * flick * (0.45 + live * 0.55), u.base * 1.7 * (0.9 + flick * 0.2) * live, 1);
        f.position.x = (i - 2) * 0.055 + Math.sin(time * 2.2 + u.phase) * 0.02;
        f.material.opacity = (0.55 + flick * 0.25) * live;
      });

      const flickerLight = 0.82 + Math.sin(time * 8.7) * 0.1 + Math.sin(time * 17.3) * 0.05;
      // A doused fire leaves nothing behind: no glow, no coals, no crackle.
      const coal = THREE.MathUtils.clamp(burn * 1.6 - 0.6, 0, 1);
      fireLight.intensity = 6 * burn * flickerLight;
      emberMat.emissiveIntensity = coal * 2.2 + Math.sin(time * 3.1) * 0.12 * coal;
      emberPoints.material.opacity = emberBaseOpacity * Math.min(1, burn * 1.6);
      emberPoints.visible = burn > 0.08;

      // Smoke
      smokePuffs.forEach(p => {
        const u = p.userData;
        u.life += delta * u.speed;
        if (u.life > 1) u.life = 0;
        const life = u.life;
        p.position.y = 0.6 + life * 2.2;
        p.position.x = u.drift * life + Math.sin(time * 0.8 + u.life * 6) * 0.08;
        p.position.z = Math.cos(time * 0.5 + u.life * 4) * 0.1;
        const s = 0.35 + life * 0.9;
        p.scale.set(s, s, 1);
        // Wet logs give off pale steam rather than smoke
        p.material.color.copy(smokeDry).lerp(smokeSteam, wet);
        p.material.opacity = Math.sin(life * Math.PI) * (0.16 + wet * 0.07) * (0.22 + burn * 0.78);
      });

      // Embers
      const pos = emberGeo.attributes.position.array;
      for (let i = 0; i < emberCount; i++) {
        const d = emberData[i];
        const i3 = i * 3;
        pos[i3 + 1] += d.speed * delta;
        pos[i3] += Math.sin(time * 2.2 + d.phase) * delta * 0.18;
        pos[i3 + 2] += Math.cos(time * 1.7 + d.phase) * delta * 0.14;
        if (pos[i3 + 1] > fireY + 2.2) {
          pos[i3] = fireX + (Math.random() - 0.5) * 0.4;
          pos[i3 + 1] = fireY + 0.15;
          pos[i3 + 2] = fireZ + (Math.random() - 0.5) * 0.4;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;
    }
  };
}
