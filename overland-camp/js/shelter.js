// Overland awning room: ripstop canvas roof, clear vinyl walls with a walk-in
// doorway, festoon lights, rain cascades and a richly furnished interior.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  getFabricMaps,
  getWoodMap,
  getRugMap,
  getVinylRoughness,
  getSoftDotTexture,
  getWaterSheetTexture,
  getMetalMaps
} from './textures.js';
import { createContactShadow } from './decals.js';
import { createCampChair, createSlattedTable, createCampCot, lathe } from './furniture.js';

export function createOverlandShelter() {
  const shelter = new THREE.Group();
  shelter.name = 'AwningShelter';

  // --- Dimensions ---
  const width = 3.2;    // extends outwards from the rig (+X)
  const length = 3.6;   // along vehicle length (Z)
  const height = 2.15;  // ground -> outer eave
  const roofSlope = 0.25;
  const offsetX = -0.35;
  const offsetZ = 0.5;

  const fabric = getFabricMaps();
  const woodMap = getWoodMap();
  const rugMap = getRugMap();

  // --- Materials ---
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e21,
    metalness: 0.85,
    roughness: 0.32,
    envMapIntensity: 1.2
  });

  const roofMap = fabric.map.clone();
  roofMap.repeat.set(0.3, 0.3);
  roofMap.needsUpdate = true;
  const roofNormal = fabric.normalMap.clone();
  roofNormal.repeat.set(0.3, 0.3);
  roofNormal.needsUpdate = true;

  const canvasRoofMat = new THREE.MeshStandardMaterial({
    color: 0x6a716a,
    map: roofMap,
    normalMap: roofNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
    envMapIntensity: 0.55
  });

  const vinylRough = getVinylRoughness();
  const clearVinylMat = new THREE.MeshPhysicalMaterial({
    color: 0xe4eeee,
    metalness: 0.0,
    roughness: 0.16,
    roughnessMap: vinylRough,
    // Plain alpha instead of transmission: transmission re-renders the whole
    // forest into an extra buffer every frame.
    transparent: true,
    opacity: 0.12,
    ior: 1.42,
    reflectivity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.4
  });

  const seamBorderMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    metalness: 0.2,
    roughness: 0.68
  });

  const warmLanternMat = new THREE.MeshStandardMaterial({
    color: 0xfff0da,
    emissive: 0xffb24d,
    emissiveIntensity: 2.0,
    roughness: 0.35
  });

  const stringBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d8,
    emissive: 0xffbf66,
    emissiveIntensity: 2.2,
    roughness: 0.3
  });

  const woodMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    color: 0xc9a77d,
    roughness: 0.72,
    metalness: 0.02
  });

  const canvasChairMat = new THREE.MeshStandardMaterial({
    color: 0x8a8266,
    map: fabric.map,
    normalMap: fabric.normalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.88,
    metalness: 0.02
  });

  const coolerMat = new THREE.MeshStandardMaterial({
    color: 0xcfc3ae,
    roughness: 0.45,
    metalness: 0.05
  });

  const rugMat = new THREE.MeshStandardMaterial({
    map: rugMap,
    color: 0xc7b296,
    roughness: 0.96,
    metalness: 0.0
  });

  const add = (obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
    shelter.add(obj);
    return obj;
  };

  // -------------------------------------------------------------------------
  // 1. Frame
  // -------------------------------------------------------------------------
  const frameGroup = new THREE.Group();
  const poleRadius = 0.029;

  // The front centre upright is intentionally omitted — the walk-in doorway
  // sits there, supported by the two door-frame posts below.
  const cornerPositions = [
    { x: width, z: -length * 0.5 },
    { x: width, z: length * 0.5 },
    { x: width * 0.5, z: -length * 0.5 }
  ];

  cornerPositions.forEach(pos => {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(poleRadius, poleRadius, height, 14),
      frameMat
    );
    pole.position.set(pos.x, height * 0.5, pos.z);
    pole.castShadow = true;
    frameGroup.add(pole);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.025, 16), frameMat);
    foot.position.set(pos.x, 0.012, pos.z);
    frameGroup.add(foot);

    // Guy line + stake
    const outX = pos.x === width ? 0.9 : -0.45;
    const outZ = pos.z > 0 ? 0.75 : -0.75;
    const stake = new THREE.Vector3(pos.x + outX, 0, pos.z + outZ);
    const top = new THREE.Vector3(pos.x, height - 0.04, pos.z);
    const dist = top.distanceTo(stake);
    const guy = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, dist, 5), seamBorderMat);
    guy.position.copy(top).add(stake).multiplyScalar(0.5);
    guy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stake.clone().sub(top).normalize());
    frameGroup.add(guy);
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), frameMat);
    peg.position.set(stake.x, 0.11, stake.z);
    peg.rotation.z = 0.5;
    peg.rotation.x = 0.3;
    frameGroup.add(peg);
  });

  const makeBeam = (x1, y1, z1, x2, y2, z2, radius = poleRadius) => {
    const p1 = new THREE.Vector3(x1, y1, z1);
    const p2 = new THREE.Vector3(x2, y2, z2);
    const dist = p1.distanceTo(p2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dist, 10), frameMat);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    beam.position.copy(mid);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
    beam.castShadow = true;
    frameGroup.add(beam);
    return beam;
  };

  makeBeam(width, height, -length * 0.5, width, height, length * 0.5);
  makeBeam(0, height + roofSlope, length * 0.5, width, height, length * 0.5);
  makeBeam(0, height + roofSlope, -length * 0.5, width, height, -length * 0.5);
  makeBeam(0, height + roofSlope, 0, width, height, 0);

  // Door frame uprights (center opening)
  const doorHalf = 0.6;
  const doorX = width * 0.5;
  [-doorHalf, doorHalf].forEach(dx => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, height, 10), frameMat);
    post.position.set(doorX + dx, height * 0.5, length * 0.5);
    frameGroup.add(post);
  });

  shelter.add(frameGroup);

  // -------------------------------------------------------------------------
  // 2. Roof (slight pitch, skylight hatch)
  // -------------------------------------------------------------------------
  const roofShape = new THREE.Shape();
  roofShape.moveTo(0, -length * 0.5);
  roofShape.lineTo(width, -length * 0.5);
  roofShape.lineTo(width, length * 0.5);
  roofShape.lineTo(0, length * 0.5);
  roofShape.closePath();

  const hx = width * 0.45;
  const hz = 0.2;
  const hw = 0.42;
  const hl = 0.45;
  const hatchHole = new THREE.Path();
  hatchHole.moveTo(hx - hw, hz - hl);
  hatchHole.lineTo(hx + hw, hz - hl);
  hatchHole.lineTo(hx + hw, hz + hl);
  hatchHole.lineTo(hx - hw, hz + hl);
  hatchHole.closePath();
  roofShape.holes.push(hatchHole);

  const roofGeo = new THREE.ShapeGeometry(roofShape, 12);
  const roofMesh = new THREE.Mesh(roofGeo, canvasRoofMat);
  roofMesh.rotation.x = Math.PI * 0.5;
  roofMesh.position.set(0, height + roofSlope * 0.52, 0);
  roofMesh.rotation.y = -0.075;
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  shelter.add(roofMesh);

  // Roof ridge straps
  const roofY = height + roofSlope * 0.52;
  [-1.15, -0.3, 0.55, 1.4].forEach(z => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.02, 0.012, 0.055), seamBorderMat);
    strap.position.set(width * 0.5, roofY + 0.012, z);
    strap.rotation.z = -0.04;
    shelter.add(strap);
  });

  // Hanging valance around the eaves
  const valanceMat = canvasRoofMat;
  const valGeoLong = new THREE.PlaneGeometry(length, 0.16);
  const valOuter = new THREE.Mesh(valGeoLong, valanceMat);
  valOuter.rotation.y = -Math.PI * 0.5;
  valOuter.position.set(width + 0.008, height - 0.06, 0);
  valOuter.castShadow = true;
  shelter.add(valOuter);

  [-1, 1].forEach(sign => {
    const val = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.16), valanceMat);
    val.position.set(width * 0.5, height + roofSlope * 0.5 - 0.06, sign * length * 0.5);
    val.rotation.y = sign > 0 ? Math.PI : 0;
    shelter.add(val);
  });

  // Hatch rim + rolled flap
  const hatchRim = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 0.06, 0.07, hl * 2 + 0.06), seamBorderMat);
  hatchRim.position.set(hx, roofY + 0.035, hz);
  shelter.add(hatchRim);
  const flap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, hl * 2, 12), canvasRoofMat);
  flap.rotation.x = Math.PI * 0.5;
  flap.position.set(hx - hw - 0.02, roofY + 0.07, hz);
  shelter.add(flap);

  // -------------------------------------------------------------------------
  // 3. Camper in the hatch
  // -------------------------------------------------------------------------
  const camperGroup = new THREE.Group();
  camperGroup.name = 'CamperFigure';
  const redPonchoMat = new THREE.MeshStandardMaterial({
    color: 0xc9241f,
    roughness: 0.34,
    metalness: 0.05,
    envMapIntensity: 1.1
  });
  const camperFaceMat = new THREE.MeshStandardMaterial({ color: 0x1c1713, roughness: 0.95 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x9a6a52, roughness: 0.72 });

  // Torso tapering from the shoulders down under the hatch rim
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.66, 18), redPonchoMat);
  torso.position.set(hx, roofY + 0.23, hz);
  torso.castShadow = true;
  camperGroup.add(torso);

  // Shoulders
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 12), redPonchoMat);
  shoulders.scale.set(1.15, 0.52, 0.92);
  shoulders.position.set(hx, roofY + 0.5, hz);
  shoulders.castShadow = true;
  camperGroup.add(shoulders);

  // Neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.1, 12), skinMat);
  neck.position.set(hx, roofY + 0.6, hz);
  camperGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 14), skinMat);
  head.scale.set(0.95, 1.05, 0.95);
  head.position.set(hx, roofY + 0.71, hz + 0.01);
  head.castShadow = true;
  camperGroup.add(head);

  // Hood with a rolled brim
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), redPonchoMat);
  hood.position.set(hx, roofY + 0.7, hz - 0.01);
  hood.rotation.x = -0.16;
  hood.castShadow = true;
  camperGroup.add(hood);

  const hoodBrim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.028, 8, 20), redPonchoMat);
  hoodBrim.position.set(hx, roofY + 0.715, hz + 0.05);
  hoodBrim.rotation.x = 1.42;
  camperGroup.add(hoodBrim);

  // Face in shadow under the hood
  const faceVoid = new THREE.Mesh(new THREE.CircleGeometry(0.082, 18), camperFaceMat);
  faceVoid.position.set(hx, roofY + 0.7, hz + 0.095);
  camperGroup.add(faceVoid);

  // Arms braced on the hatch rim
  [-0.22, 0.22].forEach(side => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.062, 0.36, 12), redPonchoMat);
    arm.position.set(hx + side, roofY + 0.23, hz + 0.13);
    arm.rotation.x = 0.8;
    arm.rotation.z = side * 0.42;
    arm.castShadow = true;
    camperGroup.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), skinMat);
    hand.scale.set(1, 0.75, 1.2);
    hand.position.set(hx + side * 1.12, roofY + 0.1, hz + 0.28);
    camperGroup.add(hand);
  });

  // A warm mug in one hand
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 0.45 });
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 14), mugMat);
  mug.position.set(hx + 0.15, roofY + 0.16, hz + 0.3);
  mug.castShadow = true;
  camperGroup.add(mug);
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 5, 10, Math.PI * 1.2), mugMat);
  mugHandle.position.set(hx + 0.19, roofY + 0.16, hz + 0.3);
  mugHandle.rotation.y = Math.PI * 0.5;
  camperGroup.add(mugHandle);

  shelter.add(camperGroup);

  // -------------------------------------------------------------------------
  // 4. Vinyl walls + doorway
  // -------------------------------------------------------------------------
  const vinylWallsGroup = new THREE.Group();

  const outerWall = new THREE.Mesh(new THREE.PlaneGeometry(length, height), clearVinylMat);
  outerWall.position.set(width, height * 0.5, 0);
  outerWall.rotation.y = -Math.PI * 0.5;
  vinylWallsGroup.add(outerWall);

  // Rear wall
  const rearWall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), clearVinylMat);
  rearWall.position.set(width * 0.5, height * 0.5, -length * 0.5);
  vinylWallsGroup.add(rearWall);

  // Front wall split around the door opening
  const panelWidth = (width - doorHalf * 2) * 0.5 + 0.02;
  const leftPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, height), clearVinylMat);
  leftPanel.position.set(doorX - doorHalf - panelWidth * 0.5 + 0.02, height * 0.5, length * 0.5);
  leftPanel.rotation.y = Math.PI;
  vinylWallsGroup.add(leftPanel);

  const rightPanel = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, height), clearVinylMat);
  rightPanel.position.set(doorX + doorHalf + panelWidth * 0.5 - 0.02, height * 0.5, length * 0.5);
  rightPanel.rotation.y = Math.PI;
  vinylWallsGroup.add(rightPanel);

  // Bottom skirts / hems
  const addSeam = (w, h, d, px, py, pz) => {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), seamBorderMat);
    seam.position.set(px, py, pz);
    vinylWallsGroup.add(seam);
  };

  addSeam(0.055, 0.13, length, width, 0.065, 0);
  addSeam(width, 0.13, 0.055, width * 0.5, 0.065, length * 0.5);
  addSeam(width, 0.13, 0.055, width * 0.5, 0.065, -length * 0.5);

  // Corner / zipper trims
  addSeam(0.055, height, 0.055, width, height * 0.5, length * 0.5);
  addSeam(0.055, height, 0.055, width, height * 0.5, -length * 0.5);
  addSeam(0.055, height, 0.055, width, height * 0.5, 0);
  addSeam(0.055, height, 0.055, width * 0.5, height * 0.5, -length * 0.5);
  addSeam(0.055, height, 0.055, doorX - doorHalf, height * 0.5, length * 0.5);
  addSeam(0.055, height, 0.055, doorX + doorHalf, height * 0.5, length * 0.5);

  // Rolled-up door flaps
  [-1, 1].forEach(sign => {
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, height - 0.1, 10), clearVinylMat);
    roll.position.set(doorX + sign * (doorHalf + 0.055), height * 0.5, length * 0.5 - 0.015);
    roll.scale.z = 0.55;
    vinylWallsGroup.add(roll);
  });

  shelter.add(vinylWallsGroup);

  // Doormat
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.65),
    new THREE.MeshStandardMaterial({ color: 0x3a352b, roughness: 1.0 })
  );
  mat.rotation.x = -Math.PI * 0.5;
  mat.position.set(doorX, 0.018, length * 0.5 - 0.32);
  mat.receiveShadow = true;
  shelter.add(mat);

  // -------------------------------------------------------------------------
  // 5. Rain cascades
  // -------------------------------------------------------------------------
  const waterSheetTex = getWaterSheetTexture();
  const waterStreamMat = new THREE.MeshBasicMaterial({
    map: waterSheetTex,
    color: 0xdff4fc,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false
  });

  const waterCascades = [];
  const cascadeEaves = [
    { x: width + 0.05, z: length * 0.5 - 0.15 },
    { x: width + 0.05, z: -length * 0.5 + 0.15 },
    { x: 0.2, z: length * 0.5 + 0.05 },
    { x: width + 0.02, z: 0.4 }
  ];

  cascadeEaves.forEach((eave, idx) => {
    // Two crossed sheets so the falling water reads from every angle
    for (let k = 0; k < 2; k++) {
      const geo = new THREE.PlaneGeometry(0.34, height - 0.06, 1, 6);
      const sheet = new THREE.Mesh(geo, waterStreamMat.clone());
      sheet.position.set(eave.x, (height - 0.06) * 0.5, eave.z);
      sheet.rotation.y = idx === 2 ? k * Math.PI * 0.5 : Math.PI * 0.5 + k * Math.PI * 0.5;
      sheet.renderOrder = 3;
      shelter.add(sheet);
      waterCascades.push(sheet);
    }

    // splash ring at the base
    const ringGeo = new THREE.RingGeometry(0.04, 0.1, 18);
    ringGeo.rotateX(-Math.PI * 0.5);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0xcfe8f2,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    ring.position.set(eave.x, 0.025, eave.z);
    shelter.add(ring);
    waterCascades[waterCascades.length - 1].userData.splash = ring;
  });

  // -------------------------------------------------------------------------
  // 6. Lights
  // -------------------------------------------------------------------------
  const lanterns = [];
  const interiorLights = [];
  const glowSprites = [];

  const hangingLantern = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.42, 6), frameMat);
  cord.position.set(0, 0.21, 0);
  hangingLantern.add(cord);
  const lanternCap = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 0.06, 16), frameMat);
  hangingLantern.add(lanternCap);
  const lanternBulb = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 14), warmLanternMat);
  lanternBulb.position.set(0, -0.075, 0);
  hangingLantern.add(lanternBulb);
  const lanternCage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.19, 8, 1, true), frameMat);
  lanternCage.position.set(0, -0.085, 0);
  hangingLantern.add(lanternCage);
  hangingLantern.position.set(width * 0.5, height - 0.12, 0.15);
  shelter.add(hangingLantern);
  lanterns.push(lanternBulb);

  const mainTentLight = new THREE.PointLight(0xffab55, 12, 8.5, 1.8);
  mainTentLight.position.set(width * 0.5, height - 0.45, 0.2);
  mainTentLight.castShadow = true;
  mainTentLight.shadow.mapSize.width = 1024;
  mainTentLight.shadow.mapSize.height = 1024;
  mainTentLight.shadow.bias = -0.002;
  shelter.add(mainTentLight);
  interiorLights.push(mainTentLight);

  // Table hurricane lamp
  const tableLamp = new THREE.Group();
  const lampMetal = frameMat.clone();
  lampMetal.side = THREE.DoubleSide;
  // Fuel fount
  const lampBase = new THREE.Mesh(lathe([
    [0, 0], [0.068, 0], [0.072, 0.008], [0.07, 0.022], [0.058, 0.036], [0.042, 0.044], [0.036, 0.05]
  ], 24), lampMetal);
  lampBase.castShadow = true;
  tableLamp.add(lampBase);
  // Bulging glass globe
  const lampGlass = new THREE.Mesh(lathe([
    [0.034, 0.048], [0.046, 0.062], [0.056, 0.09], [0.058, 0.112], [0.052, 0.14], [0.036, 0.166], [0.028, 0.176]
  ], 24), warmLanternMat);
  tableLamp.add(lampGlass);
  // Chimney cap, guard wires and the bail handle
  const lampCap = new THREE.Mesh(lathe([
    [0.03, 0.172], [0.042, 0.182], [0.04, 0.196], [0.022, 0.21], [0.018, 0.222], [0, 0.224]
  ], 20), lampMetal);
  tableLamp.add(lampCap);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const pts = [[0.05, 0.045], [0.064, 0.09], [0.066, 0.112], [0.058, 0.15], [0.044, 0.182]]
      .map(([r, y]) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    tableLamp.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.0022, 4, false), frameMat));
  }
  const bail = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.0028, 5, 20, Math.PI), frameMat);
  bail.position.y = 0.19;
  bail.rotation.y = 0.5;
  tableLamp.add(bail);
  tableLamp.position.set(width * 0.55, 0.598, 0.35);
  shelter.add(tableLamp);
  lanterns.push(lampGlass);

  const tableLight = new THREE.PointLight(0xff9a33, 6, 4.5, 2.0);
  tableLight.position.set(width * 0.55, 0.8, 0.35);
  shelter.add(tableLight);
  interiorLights.push(tableLight);

  const dotTex = getSoftDotTexture();
  function addGlow(x, y, z, size, color, opacity) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: dotTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false
    }));
    sprite.scale.set(size, size, 1);
    sprite.position.set(x, y, z);
    shelter.add(sprite);
    glowSprites.push({ sprite, baseOpacity: opacity });
    return sprite;
  }

  addGlow(width * 0.5, height - 0.2, 0.15, 1.3, 0xffb45c, 0.4);
  addGlow(width * 0.55, 0.82, 0.35, 0.7, 0xffa544, 0.3);

  // Festoon string lights along the outer and front eaves
  const festoonBulbs = [];
  const wireMat = new THREE.LineBasicMaterial({ color: 0x15171a, transparent: true, opacity: 0.9 });
  const bulbGeo = new THREE.SphereGeometry(0.026, 8, 6);

  function addFestoon(from, to, count, sag, seed) {
    const points = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t);
      const y = THREE.MathUtils.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * sag;
      points.push(new THREE.Vector3(x, y, z));
    }
    const wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wireMat);
    shelter.add(wire);

    for (let i = 1; i < count; i++) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(from.x, to.x, t);
      const z = THREE.MathUtils.lerp(from.z, to.z, t);
      const y = THREE.MathUtils.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * sag - 0.035;
      const bulb = new THREE.Mesh(bulbGeo, stringBulbMat);
      bulb.position.set(x, y, z);
      bulb.userData.phase = seed + i * 1.7;
      shelter.add(bulb);
      festoonBulbs.push(bulb);
    }
  }

  addFestoon(
    new THREE.Vector3(width - 0.1, height - 0.06, -length * 0.5 + 0.1),
    new THREE.Vector3(width - 0.1, height - 0.06, length * 0.5 - 0.1),
    13, 0.18, 0.4
  );
  addFestoon(
    new THREE.Vector3(0.2, height + roofSlope * 0.45, length * 0.5 - 0.06),
    new THREE.Vector3(width - 0.1, height - 0.04, length * 0.5 - 0.06),
    10, 0.14, 2.1
  );

  const festoonLight = new THREE.PointLight(0xffc27a, 3.2, 5.5, 2.0);
  festoonLight.position.set(width * 0.55, height - 0.3, length * 0.5 - 0.3);
  shelter.add(festoonLight);
  interiorLights.push(festoonLight);

  // -------------------------------------------------------------------------
  // 7. Interior
  // -------------------------------------------------------------------------
  const interiorGroup = new THREE.Group();

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.8, length * 0.74), rugMat);
  rug.rotation.x = -Math.PI * 0.5;
  rug.position.set(width * 0.5, 0.022, 0.02);
  rug.receiveShadow = true;
  interiorGroup.add(rug);

  // Camp table
  const tableGroup = createSlattedTable({
    woodMat,
    frameMat,
    width: 0.94,
    depth: 0.62,
    height: 0.58,
    slats: 5
  });

  const kettleMat = new THREE.MeshStandardMaterial({
    color: 0x36434a,
    metalness: 0.85,
    roughness: 0.28,
    envMapIntensity: 1.3
  });
  const topY = 0.598;
  const kettleX = -0.24;
  const kettleZ = 0.08;
  const kettle = new THREE.Mesh(lathe([
    [0, 0], [0.074, 0], [0.084, 0.01], [0.088, 0.045], [0.082, 0.085], [0.062, 0.112],
    [0.04, 0.122], [0.04, 0.13], [0.036, 0.134], [0.012, 0.138], [0.008, 0.15], [0.014, 0.156], [0, 0.158]
  ], 24), kettleMat);
  kettle.position.set(kettleX, topY, kettleZ);
  kettle.castShadow = true;
  tableGroup.add(kettle);
  // Tapered spout from the belly up and out
  {
    const a = new THREE.Vector3(kettleX + 0.07, topY + 0.04, kettleZ);
    const b = new THREE.Vector3(kettleX + 0.15, topY + 0.125, kettleZ);
    const dir = b.clone().sub(a);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.019, dir.length(), 10), kettleMat);
    spout.position.copy(a).addScaledVector(dir, 0.5);
    spout.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    tableGroup.add(spout);
  }
  const kettleHandle = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.007, 6, 18, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.6 }));
  kettleHandle.position.set(kettleX, topY + 0.118, kettleZ);
  kettleHandle.rotation.y = Math.PI * 0.5;
  tableGroup.add(kettleHandle);

  // Enamel camp mugs with dark rims
  const mugDS = mugMat.clone();
  mugDS.side = THREE.DoubleSide;
  const enamelRim = new THREE.MeshStandardMaterial({ color: 0x1d2833, roughness: 0.35 });
  const brewMat = new THREE.MeshStandardMaterial({ color: 0x24160d, roughness: 0.15, metalness: 0.0 });
  const mugGeo = lathe([
    [0, 0], [0.032, 0], [0.035, 0.004], [0.036, 0.07], [0.037, 0.074], [0.033, 0.075], [0.032, 0.07], [0.031, 0.008], [0, 0.008]
  ], 22);
  [[-0.02, -0.1, 0.4], [0.16, -0.05, -0.9]].forEach(([mX, mZ, rot]) => {
    const mugG = new THREE.Group();
    const mugT = new THREE.Mesh(mugGeo, mugDS);
    mugT.castShadow = true;
    mugG.add(mugT);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0352, 0.0024, 5, 22), enamelRim);
    rim.rotation.x = Math.PI * 0.5;
    rim.position.y = 0.074;
    mugG.add(rim);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.0045, 6, 14, Math.PI * 1.15), mugDS);
    handle.position.set(0.036, 0.039, 0);
    handle.rotation.z = -Math.PI * 0.575;
    mugG.add(handle);
    const brew = new THREE.Mesh(new THREE.CircleGeometry(0.0315, 18), brewMat);
    brew.rotation.x = -Math.PI * 0.5;
    brew.position.y = 0.058;
    mugG.add(brew);
    mugG.position.set(mX, topY, mZ);
    mugG.rotation.y = rot;
    tableGroup.add(mugG);
  });

  // Plates + cutting board + book
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 0.45 });
  for (let i = 0; i < 2; i++) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.094, 0.014, 24), plateMat);
    plate.position.set(0.27, 0.596 + i * 0.014, 0.13);
    plate.castShadow = true;
    tableGroup.add(plate);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.097, 0.007, 6, 24), plateMat);
    rim.rotation.x = Math.PI * 0.5;
    rim.position.set(0.27, 0.603 + i * 0.014, 0.13);
    tableGroup.add(rim);
  }
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.018, 0.18, 2, 0.01), woodMat);
  board.position.set(0.22, 0.594, -0.18);
  board.castShadow = true;
  tableGroup.add(board);
  // Knife left on the board
  const knife = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.004, 0.16), new THREE.MeshStandardMaterial({
    color: 0x9aa0a4,
    metalness: 0.8,
    roughness: 0.3
  }));
  knife.position.set(0.16, 0.607, -0.18);
  knife.rotation.y = 0.35;
  tableGroup.add(knife);

  const bookMat = new THREE.MeshStandardMaterial({ color: 0x5c3b2a, roughness: 0.85 });
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.035, 0.26), bookMat);
  book.position.set(-0.34, 0.61, -0.16);
  book.rotation.y = 0.25;
  tableGroup.add(book);

  const tableShade = createContactShadow(0.56, 0.42, 0.4);
  tableShade.position.y = 0.028;
  tableGroup.add(tableShade);

  tableGroup.position.set(width * 0.52, 0, 0.35);
  interiorGroup.add(tableGroup);

  // Camp chairs
  function createInteriorChair() {
    return createCampChair({ canvasMat: canvasChairMat, frameMat, woodMat });
  }

  const chair1 = createInteriorChair();
  chair1.position.set(width * 0.52, 0, 1.02);
  chair1.rotation.y = Math.PI;
  const chair1Shade = createContactShadow(0.34, 0.34, 0.4);
  chair1Shade.position.y = 0.025;
  chair1.add(chair1Shade);
  interiorGroup.add(chair1);

  const chair2 = createInteriorChair();
  chair2.position.set(width * 0.2, 0, 0.35);
  chair2.rotation.y = Math.PI * 0.5;
  const chair2Shade = createContactShadow(0.34, 0.34, 0.4);
  chair2Shade.position.y = 0.025;
  chair2.add(chair2Shade);
  interiorGroup.add(chair2);

  // Cooler
  const coolerGroup = new THREE.Group();
  const cooler = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.44, 0.46, 3, 0.05), coolerMat);
  cooler.position.y = 0.22;
  cooler.castShadow = true;
  coolerGroup.add(cooler);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.06, 0.48, 2, 0.03), coolerMat);
  lid.position.y = 0.455;
  lid.castShadow = true;
  coolerGroup.add(lid);
  // Lid lip
  const lip = new THREE.Mesh(new RoundedBoxGeometry(0.73, 0.022, 0.49, 2, 0.012), seamBorderMat);
  lip.position.y = 0.425;
  coolerGroup.add(lip);
  // Corner bumpers
  [[-0.33, -0.21], [0.33, -0.21], [-0.33, 0.21], [0.33, 0.21]].forEach(([cx, cz]) => {
    const bumper = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.07, 0.07, 2, 0.02), seamBorderMat);
    bumper.position.set(cx, 0.035, cz);
    coolerGroup.add(bumper);
  });
  // Drain plug
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 10), seamBorderMat);
  plug.rotation.z = Math.PI * 0.5;
  plug.position.set(0.36, 0.06, 0.12);
  coolerGroup.add(plug);

  [-0.23, 0.23].forEach(lx => {
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.025), seamBorderMat);
    latch.position.set(lx, 0.28, -0.23);
    coolerGroup.add(latch);
  });
  const coolerHandle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 12, Math.PI), seamBorderMat);
  coolerHandle.position.set(0, 0.37, -0.245);
  coolerHandle.rotation.x = Math.PI * 0.5;
  coolerGroup.add(coolerHandle);

  const coolerShade = createContactShadow(0.42, 0.3, 0.45);
  coolerShade.position.y = 0.028;
  coolerGroup.add(coolerShade);

  coolerGroup.position.set(width * 0.78, 0, -0.65);
  interiorGroup.add(coolerGroup);

  // Cot
  const cot = createCampCot({
    canvasMat: canvasChairMat,
    frameMat,
    bagMat: new THREE.MeshStandardMaterial({ color: 0x3b4855, roughness: 0.62, metalness: 0.02 }),
    pillowMat: new THREE.MeshStandardMaterial({ color: 0xe9e1d1, roughness: 0.95 }),
    blanketMat: new THREE.MeshStandardMaterial({ color: 0x4c5c42, map: fabric.map, roughness: 0.98 })
  });

  const cotShade = createContactShadow(0.52, 0.95, 0.45);
  cotShade.position.y = 0.028;
  cot.add(cotShade);

  cot.position.set(width * 0.28, 0, -1.02);
  interiorGroup.add(cot);

  // Duffel bag
  const duffel = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.24, 0.3, 2, 0.08), new THREE.MeshStandardMaterial({ color: 0x3c4b37, roughness: 0.9 }));
  duffel.position.set(width * 0.82, 0.13, -1.04);
  duffel.rotation.y = 0.3;
  duffel.castShadow = true;
  interiorGroup.add(duffel);

  // Water jug
  const jugGroup = new THREE.Group();
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.38, 16), new THREE.MeshStandardMaterial({ color: 0x587d8c, roughness: 0.5, metalness: 0.1 }));
  jug.position.y = 0.19;
  jug.castShadow = true;
  jugGroup.add(jug);
  const jugCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 10), seamBorderMat);
  jugCap.position.y = 0.41;
  jugGroup.add(jugCap);
  const jugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3f5f6c, roughness: 0.55 }));
  jugHandle.position.y = 0.33;
  jugHandle.rotation.y = Math.PI * 0.5;
  jugGroup.add(jugHandle);
  const jugShade = createContactShadow(0.2, 0.2, 0.42);
  jugShade.position.y = 0.028;
  jugGroup.add(jugShade);
  jugGroup.position.set(width * 0.9, 0, 0.55);
  interiorGroup.add(jugGroup);

  // Boots by the door
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2b2f2a, roughness: 0.6 });
  const laceMat = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 });
  [-0.09, 0.09].forEach((dx, i) => {
    const boot = new THREE.Group();
    // Toe box pointing +Z, ankle shaft over the heel
    const foot = new THREE.Mesh(new RoundedBoxGeometry(0.105, 0.085, 0.27, 3, 0.04), bootMat);
    foot.position.set(0, 0.062, 0.035);
    foot.castShadow = true;
    boot.add(foot);
    const shaft = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.19, 0.125, 3, 0.04), bootMat);
    shaft.position.set(0, 0.17, -0.045);
    shaft.rotation.x = -0.06;
    shaft.castShadow = true;
    boot.add(shaft);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.011, 6, 16), seamBorderMat);
    collar.rotation.x = Math.PI * 0.5;
    collar.scale.set(1, 1.25, 1);
    collar.position.set(0, 0.262, -0.05);
    boot.add(collar);
    const tongue = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.16, 0.02, 2, 0.008), laceMat);
    tongue.position.set(0, 0.15, 0.022);
    tongue.rotation.x = -0.45;
    boot.add(tongue);
    const sole = new THREE.Mesh(new RoundedBoxGeometry(0.118, 0.028, 0.29, 2, 0.01), seamBorderMat);
    sole.position.set(0, 0.016, 0.025);
    boot.add(sole);
    boot.position.set(width * 0.5 + dx, 0, length * 0.5 - 0.44 + i * 0.05);
    boot.rotation.y = (i - 0.5) * 0.4;
    interiorGroup.add(boot);
  });

  // Hanging jacket
  const jacket = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.55, 0.12, 2, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8a6b3f, roughness: 0.95 })
  );
  jacket.position.set(width * 0.78, height - 0.48, -length * 0.5 + 0.12);
  jacket.rotation.y = 0.2;
  interiorGroup.add(jacket);
  const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 5, 12, Math.PI), frameMat);
  hanger.position.set(width * 0.78, height - 0.2, -length * 0.5 + 0.12);
  hanger.rotation.y = 0.2;
  interiorGroup.add(hanger);

  // Small slatted crate of supplies
  const crateMat = new THREE.MeshStandardMaterial({ map: woodMap, color: 0xb59a77, roughness: 0.85 });
  const crateGroup = new THREE.Group();
  // Corner posts
  [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]].forEach(([cx, cz]) => {
    const post = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.3, 0.035, 2, 0.008), crateMat);
    post.position.set(cx, 0.15, cz);
    post.castShadow = true;
    crateGroup.add(post);
  });
  // Horizontal slats
  for (let i = 0; i < 3; i++) {
    const y = 0.06 + i * 0.1;
    [-0.2, 0.2].forEach((z) => {
      const slat = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.07, 0.018, 2, 0.006), crateMat);
      slat.position.set(0, y, z);
      slat.castShadow = true;
      crateGroup.add(slat);
    });
    [-0.21, 0.21].forEach((x) => {
      const slat = new THREE.Mesh(new RoundedBoxGeometry(0.018, 0.07, 0.38, 2, 0.006), crateMat);
      slat.position.set(x, y, 0);
      crateGroup.add(slat);
    });
  }
  // Base boards
  [-0.12, 0, 0.12].forEach((z) => {
    const board = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.02, 0.1, 2, 0.006), crateMat);
    board.position.set(0, 0.012, z);
    crateGroup.add(board);
  });

  const crateShade = createContactShadow(0.26, 0.24, 0.42);
  crateShade.position.y = 0.028;
  crateGroup.add(crateShade);

  crateGroup.position.set(width * 0.72, 0, length * 0.5 - 0.6);
  crateGroup.rotation.y = 0.22;
  interiorGroup.add(crateGroup);
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x3f5a2c, roughness: 0.12, metalness: 0.15, side: THREE.DoubleSide });
  const corkMat = new THREE.MeshStandardMaterial({ color: 0xa07a52, roughness: 0.9 });
  const bottleGeo = lathe([
    [0, 0], [0.034, 0], [0.037, 0.006], [0.037, 0.17], [0.03, 0.2], [0.015, 0.232], [0.013, 0.272], [0.016, 0.276], [0.015, 0.286], [0, 0.286]
  ], 18);
  [[-0.1, -0.06, 0], [0.07, 0.05, 0], [0.1, -0.08, 0.16]].forEach(([bx, bz, tilt]) => {
    const bottle = new THREE.Mesh(bottleGeo, bottleMat);
    bottle.position.set(bx, 0.022, bz);
    bottle.rotation.z = tilt;
    bottle.castShadow = true;
    crateGroup.add(bottle);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.011, 0.022, 10), corkMat);
    cork.position.set(0, 0.292, 0);
    bottle.add(cork);
  });
  // Rolled tea towel tucked in the corner
  const towel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 14), new THREE.MeshStandardMaterial({ color: 0xb8432f, map: fabric.map, roughness: 0.95 }));
  towel.rotation.set(0.25, 0, Math.PI * 0.5 - 0.3);
  towel.position.set(-0.04, 0.22, 0.11);
  crateGroup.add(towel);

  shelter.add(interiorGroup);

  // Shelter is attached to the passenger side of the vehicle
  shelter.position.set(offsetX, 0, offsetZ);

  // -------------------------------------------------------------------------
  // Colliders (converted to world space)
  // -------------------------------------------------------------------------
  const colliders = [
    { type: 'circle', x: offsetX + width, z: offsetZ - length * 0.5, r: 0.1 },
    { type: 'circle', x: offsetX + width, z: offsetZ + length * 0.5, r: 0.1 },
    { type: 'circle', x: offsetX + width * 0.5, z: offsetZ - length * 0.5, r: 0.1 },
    { type: 'box', x: offsetX + width, z: offsetZ, rot: 0, hw: 0.08, hl: length * 0.5 },
    { type: 'box', x: offsetX + width * 0.5, z: offsetZ - length * 0.5, rot: 0, hw: width * 0.5, hl: 0.08 },
    { type: 'box', x: offsetX + doorX - doorHalf - panelWidth * 0.5 + 0.02, z: offsetZ + length * 0.5, rot: 0, hw: panelWidth * 0.5, hl: 0.08 },
    { type: 'box', x: offsetX + doorX + doorHalf + panelWidth * 0.5 - 0.02, z: offsetZ + length * 0.5, rot: 0, hw: panelWidth * 0.5, hl: 0.08 },
    { type: 'box', x: offsetX + width * 0.52, z: offsetZ + 0.35, rot: 0, hw: 0.5, hl: 0.34 },
    { type: 'box', x: offsetX + width * 0.78, z: offsetZ - 0.65, rot: 0, hw: 0.38, hl: 0.27 },
    { type: 'box', x: offsetX + width * 0.28, z: offsetZ - 1.02, rot: 0, hw: 0.5, hl: 0.96 },
    { type: 'circle', x: offsetX + width * 0.52, z: offsetZ + 1.02, r: 0.34 },
    { type: 'circle', x: offsetX + width * 0.2, z: offsetZ + 0.35, r: 0.34 }
  ];

  let flickerPhase = 0;

  return {
    group: shelter,
    colliders,
    setWetness: (amount) => {
      canvasRoofMat.roughness = THREE.MathUtils.lerp(0.9, 0.38, amount);
      clearVinylMat.opacity = THREE.MathUtils.lerp(0.07, 0.14, amount);
      clearVinylMat.roughness = THREE.MathUtils.lerp(0.1, 0.26, amount);
      waterCascades.forEach(c => {
        c.visible = amount > 0.42;
        c.material.opacity = amount > 0.75 ? 0.8 : 0.5;
        if (c.userData.splash) c.userData.splash.material.opacity = amount > 0.42 ? 0.35 : 0;
      });
    },
    setLanterns: (on) => {
      lanterns.forEach(l => { l.material.emissiveIntensity = on ? 2.6 : 0.0; });
      stringBulbMat.emissiveIntensity = on ? 2.2 : 0.02;
      mainTentLight.intensity = on ? 12 : 0;
      tableLight.intensity = on ? 6 : 0;
      festoonLight.intensity = on ? 3.2 : 0;
      glowSprites.forEach(g => { g.sprite.material.opacity = on ? g.baseOpacity : 0; });
    },
    update: (time, delta, weatherKey) => {
      flickerPhase += delta * 4.0;
      const flicker = 1.0 + Math.sin(flickerPhase * 3.7) * 0.055 + Math.cos(flickerPhase * 8.1) * 0.03;
      if (mainTentLight.intensity > 0.1) {
        mainTentLight.intensity = 12 * flicker;
        tableLight.intensity = 6 * flicker;
        festoonLight.intensity = 3.2 * (0.96 + Math.sin(flickerPhase * 1.3) * 0.04);
      }

      // Festoon bulbs shimmer very subtly
      stringBulbMat.emissiveIntensity = 2.2 + Math.sin(time * 2.1) * 0.08;

      const heavy = weatherKey === 'heavyRain';
      waterCascades.forEach((c, idx) => {
        if (!c.visible) return;
        const tex = c.material.map;
        if (tex) tex.offset.y -= delta * (heavy ? 1.7 : 0.9);
        c.scale.x = 0.85 + Math.sin(time * 7 + idx * 1.7) * 0.08;
        c.position.y = (height - 0.06) * 0.5 - Math.abs(Math.sin(time * 6 + idx * 2)) * 0.02;
        const splash = c.userData.splash;
        if (splash) {
          const s = 0.9 + Math.sin(time * 5.5 + idx) * 0.2;
          splash.scale.set(s, s, s);
          splash.material.opacity = 0.22 + Math.sin(time * 5.5 + idx) * 0.1;
        }
      });
    }
  };
}
