import * as THREE from 'three/webgpu';
import {
  attribute, float, lights, mix, normalMap, positionWorld, smoothstep, texture, time, uv, vec2, vec3,
} from 'three/tsl';
import { KIND } from '../materials/interiors.js';
import { additiveOutputs, createGlowMaterial, loadTextureSets } from '../materials/surfaces.js';
import { loadLibrary, PropField } from './assets.js';
import { GROUND, ROOM_DEPTH } from './buildings.js';
import { Batches, metricBox, scaleUv, seededRandom } from './geometry.js';

const NEAR_SHOPS = 4;
const NEAR_DISTANCE = 30;
const LAMP_INTENSITY = 27;
const LAMPS_PER_SHOP = 3;
const DISPLAY_TOP = 1.16;
const WHITE = [1, 1, 1];
const TIMBER = [0.5, 0.33, 0.22];
const DARK_TIMBER = [0.2, 0.13, 0.09];
const IRON = [0.1, 0.1, 0.11];
const BRASS = [0.72, 0.52, 0.24];
const WALL_PAINT = {
  [KIND.BOTTLES]: [0.42, 0.26, 0.19],
  [KIND.CLOCKS]: [0.26, 0.34, 0.3],
  [KIND.GARMENTS]: [0.66, 0.59, 0.48],
  [KIND.BAKERY]: [0.9, 0.87, 0.78],
  [KIND.HARDWARE]: [0.46, 0.43, 0.36],
  [KIND.PORTRAITS]: [0.36, 0.13, 0.13],
  [KIND.BOOKS]: [0.2, 0.28, 0.24],
};
const COAT_COLORS = [[0.09, 0.1, 0.12], [0.07, 0.1, 0.2], [0.3, 0.08, 0.07], [0.42, 0.31, 0.18], [0.2, 0.2, 0.19], [0.1, 0.17, 0.13]];

const INTERIOR_MODELS = {
  cabinet: { file: 'GothicCabinet_01' },
  drawers: { file: 'drawer_cabinet' },
  drawersOld: { file: 'vintage_wooden_drawer_01' },
  display: { file: 'wooden_display_shelves_01' },
  bookcase: { file: 'wooden_bookshelf_worn' },
  paintedShelves: { file: 'painted_wooden_shelves' },
  register: { file: 'CashRegister_01' },
  chandelier: { file: 'lantern_chandelier_01' },
  pendant: { file: 'hanging_industrial_lamp' },
  table: { file: 'WoodenTable_02' },
  stool: { file: 'wooden_stool_01' },
  barStool: { file: 'bar_chair_round_01' },
  bottleA: { file: 'wine_bottles_01', include: (name) => name === 'wine_bottles_01_bordeaux' },
  bottleB: { file: 'wine_bottles_01', include: (name) => name === 'wine_bottles_01_alsace' },
  bottleC: { file: 'wine_bottles_01', include: (name) => name === 'wine_bottles_01_burgundy' },
  bottleD: { file: 'wine_bottles_01', include: (name) => name === 'wine_bottles_01_champagne' },
  barrel: { file: 'wine_barrel_01' },
  gobletA: { file: 'brass_goblets', include: (name) => name === 'brass_goblet_01' },
  gobletB: { file: 'brass_goblets', include: (name) => name === 'brass_goblet_02' },
  grandfather: { file: 'vintage_grandfather_clock_01' },
  mantel: { file: 'mantel_clock_01' },
  wallClock: { file: 'wall_clock' },
  alarm: { file: 'alarm_clock_01' },
  hat: { file: 'fishermans_hat' },
  boots: { file: 'rubber_boots', include: (name) => name === 'rubber_boots_l' || name === 'rubber_boots_r' },
  suitcase: { file: 'vintage_suitcase' },
  croissant: { file: 'croissant' },
  bunA: { file: 'hamburger_buns', include: (name) => name === 'hamburger_buns_01' },
  bunB: { file: 'hamburger_buns', include: (name) => name === 'hamburger_buns_02' },
  carrotCake: { file: 'carrot_cake' },
  berryCake: { file: 'strawberry_chocolate_cake' },
  basket: { file: 'wicker_basket_01' },
  toolbox: { file: 'metal_toolbox' },
  wrench: { file: 'pipe_wrench' },
  hammer: { file: 'cross_pein_hammer' },
  saw: { file: 'handsaw_wood' },
  bucket: { file: 'wooden_bucket_01' },
  oilCan: { file: 'small_oil_can_01' },
  wateringCan: { file: 'watering_can_metal_01' },
  ladder: { file: 'wooden_ladder' },
  vice: { file: 'bench_vice_01' },
  camera: { file: 'Camera_01' },
  frameA: { file: 'hanging_picture_frame_01' },
  frameB: { file: 'hanging_picture_frame_02' },
  frameC: { file: 'hanging_picture_frame_03' },
  frameStanding: { file: 'standing_picture_frame_01' },
  mirror: { file: 'ornate_mirror_01' },
  ...Object.fromEntries(['01', '02', '03', '04', '05', '06'].map((id) => [`book${id}`, {
    file: 'book_encyclopedia_set_01',
    include: (name) => name === `book_encyclopedia_set_01_book${id}`,
  }])),
};
const BOOKS = ['book01', 'book02', 'book03', 'book04', 'book05', 'book06'];
const BOTTLES = ['bottleA', 'bottleB', 'bottleC', 'bottleD'];

const _m = new THREE.Matrix4();
const COPIED_PROPERTIES = [
  'name', 'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'aoMapIntensity', 'emissiveMap', 'emissiveIntensity',
  'alphaMap', 'roughness', 'metalness', 'opacity', 'transparent', 'depthWrite', 'alphaTest', 'side',
];

/** Rebuilds a scanned material as a node material so it can be lit only by the room's own lamps. */
function toRoomMaterial(source, roomLights) {
  const material = new THREE.MeshStandardNodeMaterial();
  for (const key of COPIED_PROPERTIES) if (source[key] !== undefined) material[key] = source[key];
  material.color.copy(source.color);
  material.emissive.copy(source.emissive);
  material.normalScale.copy(source.normalScale);
  material.lightsNode = roomLights;
  if (material.transparent) material.mrtNode = additiveOutputs();
  return material;
}

function dryMaterial(set, { normalScale = 1, roughness = 1 } = {}) {
  const material = new THREE.MeshStandardNodeMaterial();
  const orm = texture(set.orm, uv());
  material.colorNode = texture(set.color, uv()).rgb.mul(attribute('aTint', 'vec3'));
  material.roughnessNode = orm.g.mul(roughness);
  material.metalnessNode = float(0);
  material.aoNode = orm.r;
  material.normalNode = normalMap(texture(set.normal, uv()), float(normalScale));
  return material;
}

function metalMaterial() {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.58, metalness: 0.6 });
  material.colorNode = attribute('aTint', 'vec3');
  return material;
}

/** Real shop-window glass: nearly clear, with rain running down it. */
function createShopGlass(noise) {
  const material = new THREE.MeshStandardNodeMaterial({ transparent: true, depthWrite: false });
  const along = positionWorld.x.add(positionWorld.z);
  const runnels = smoothstep(0.42, 0.66, texture(noise, vec2(along.mul(0.72), positionWorld.y.mul(0.055).add(time.mul(0.012)))).r);
  const droplets = smoothstep(0.62, 0.7, texture(noise, vec2(along.mul(3.4), positionWorld.y.mul(2.1))).g);
  material.colorNode = vec3(0.03, 0.036, 0.042);
  material.roughnessNode = mix(float(0.05), float(0.26), droplets);
  material.metalnessNode = float(0);
  material.opacityNode = float(0.07).add(runnels.mul(0.08)).add(droplets.mul(0.16));
  material.mrtNode = additiveOutputs();
  return material;
}

class Room {
  constructor(shop, library) {
    this.shop = shop;
    this.kind = shop.kind;
    this.library = library;
    this.random = seededRandom(Math.floor(shop.seed * 1e6) + shop.kind * 17);
    this.halfWidth = shop.roomHalf;
    this.floor = 0.32;
    this.ceiling = GROUND - 0.18;
    this.front = -0.4;
    this.back = -(0.55 + ROOM_DEPTH);
    this.batches = new Batches();
    this.items = new PropField(library, null);
    this.lampPoints = [];
  }

  box(key, width, height, depth, x, y, z, tint = WHITE, tile = 1.6) {
    this.batches.add(key, metricBox(width, height, depth, tile), _m.makeTranslation(x, y, z), tint);
  }

  put(name, x, y, z, options = {}) {
    this.items.place(name, { x, y, z, solid: false, ...options });
  }

  size(name, scale = 1) {
    const { x, y, z } = this.library[name].size;
    return { x: x * scale, y: y * scale, z: z * scale };
  }

  pick(list) {
    return list[Math.floor(this.random() * list.length)];
  }
}

function buildShell(room) {
  const { halfWidth: w, floor, ceiling, front, back, kind } = room;
  const depth = front - back;
  const midZ = (front + back) / 2;
  const height = ceiling - floor;
  const midY = (ceiling + floor) / 2;
  const paint = WALL_PAINT[kind] ?? WHITE;
  const tiled = kind === KIND.BAKERY;
  const floorKey = tiled || kind === KIND.PORTRAITS ? 'floorTile' : 'floorWood';
  
  room.box(floorKey, w * 2 + 0.3, 0.08, depth + 0.2, 0, floor - 0.04, midZ, floorKey === 'floorTile' ? [0.72, 0.7, 0.66] : [0.62, 0.48, 0.36], 1.5);
  room.box('wallPlaster', w * 2 + 0.3, 0.08, depth + 0.2, 0, ceiling + 0.04, midZ, [0.13, 0.12, 0.1], 2);
  // Inner faces sit 2 cm proud of the building core so the two surfaces never z-fight.
  room.box('wallPlaster', w * 2 + 0.3, height, 0.1, 0, midY, back - 0.03, paint, 2.2);
  for (const side of [-1, 1]) {
    room.box('wallPlaster', 0.1, height, depth + 0.2, side * (w + 0.03), midY, midZ, paint, 2.2);
    room.box('wood', 0.05, 0.98, depth, side * (w - 0.025), floor + 0.49, midZ, DARK_TIMBER);
    room.box('wood', 0.08, 0.05, depth, side * (w - 0.04), floor + 1, midZ, TIMBER);
    room.box('wood', 0.08, 0.14, depth, side * (w - 0.04), floor + 0.07, midZ, DARK_TIMBER);
    room.box('wood', 0.1, 0.12, depth, side * (w - 0.05), ceiling - 0.06, midZ, TIMBER);
    for (let z = back + 0.45; z < front; z += 0.82) room.box('wood', 0.02, 0.62, 0.62, side * (w - 0.06), floor + 0.54, z, TIMBER);
  }
  room.box('wood', w * 2, 0.12, 0.1, 0, ceiling - 0.06, back + 0.05, TIMBER);
  for (let z = back + 0.65; z < front; z += 1.3) room.box('wood', w * 2, 0.2, 0.2, 0, ceiling - 0.1, z, DARK_TIMBER);
}

function addPendants(room) {
  const { halfWidth: w, ceiling, front, back, kind } = room;
  const count = THREE.MathUtils.clamp(Math.round((w * 2) / 3.6), 1, LAMPS_PER_SHOP);
  const z = (front + back) / 2 + 1;
  const name = kind === KIND.BOTTLES || kind === KIND.BOOKS || kind === KIND.PORTRAITS ? 'chandelier' : 'pendant';
  const size = room.library[name].size;
  const scale = Math.min(1, 0.82 / size.y);
  for (let i = 0; i < count; i++) {
    const x = -w + (w * 2 * (i + 0.5)) / count;
    room.put(name, x, ceiling - size.y * scale, z, { scale });
    const lampY = ceiling - size.y * scale * 0.72;
    const bulb = new THREE.SphereGeometry(0.042, 10, 8);
    bulb.translate(x, lampY, z);
    room.batches.add('bulb', bulb);
    room.lampPoints.push(new THREE.Vector3(x, lampY - 0.55, z));
  }
}

function addBackShelves(room, levels, tint = DARK_TIMBER) {
  const { halfWidth: w, floor, back } = room;
  const x0 = -w + 0.14;
  const x1 = w - 0.14;
  const width = x1 - x0;
  const z = back + 0.2;
  const top = levels[levels.length - 1] + 0.42;
  room.box('wood', width, top - floor, 0.03, 0, (top + floor) / 2, back + 0.03, tint);
  room.box('wood', width, 0.62, 0.38, 0, floor + 0.31, z, tint);
  const bays = Math.max(2, Math.round(width / 1.25));
  for (let i = 0; i <= bays; i++) room.box('wood', 0.05, top - floor, 0.38, x0 + (width * i) / bays, (top + floor) / 2, z, tint);
  for (const y of levels) room.box('wood', width, 0.035, 0.38, 0, y - 0.018, z, TIMBER);
  room.box('wood', width + 0.08, 0.09, 0.44, 0, top, z, TIMBER);
  return { x0: x0 + 0.05, x1: x1 - 0.05, z: z + 0.02, levels, bays, width };
}

/** Lines a shelf with goods at natural, slightly untidy spacing. */
function fillShelf(room, names, x0, x1, y, z, { scale = 1, spacing = 0.03, gap = 0.12, twist = 0.4, depthJitter = 0.05 } = {}) {
  let x = x0;
  while (x < x1) {
    const name = room.pick(names);
    const size = room.size(name, scale);
    const width = Math.max(size.x, 0.02);
    if (x + width > x1) break;
    if (room.random() > gap) {
      room.put(name, x + width / 2, y, z + (room.random() - 0.5) * depthJitter, { scale, rotY: (room.random() - 0.5) * twist });
    }
    x += width + spacing * (0.5 + room.random());
  }
}

/** Shelf-filling books as simple boxes: hundreds per shop would be too heavy as scanned meshes. */
function addBookRow(room, x0, x1, y, z) {
  const bindings = [[0.24, 0.05, 0.04], [0.05, 0.1, 0.17], [0.06, 0.15, 0.09], [0.3, 0.2, 0.09], [0.09, 0.07, 0.06], [0.42, 0.33, 0.2], [0.16, 0.05, 0.1]];
  let x = x0;
  while (x < x1) {
    const thickness = 0.022 + room.random() * 0.05;
    if (x + thickness > x1) break;
    if (room.random() < 0.05) {
      x += 0.05 + room.random() * 0.1;
      continue;
    }
    const height = 0.2 + room.random() * 0.13;
    const depth = 0.15 + room.random() * 0.09;
    const lean = room.random() < 0.08 ? (room.random() - 0.5) * 0.24 : 0;
    const tint = room.pick(bindings);
    const place = new THREE.Matrix4().makeRotationZ(lean).setPosition(x + thickness / 2, y + height / 2, z + (room.random() - 0.5) * 0.03);
    room.batches.add('cloth', metricBox(thickness, height, depth, 0.7), place, tint);
    for (const band of [0.32, 0.72]) {
      const gold = new THREE.Matrix4().makeTranslation(0, height * (band - 0.5), depth / 2 + 0.001).premultiply(place);
      room.batches.add('metal', metricBox(thickness * 0.9, 0.006, 0.002, 1), gold, BRASS);
    }
    x += thickness + 0.001;
  }
}

/** A stepped, cloth-draped platform behind the glass, the first thing seen from the street. */
function addWindowDisplay(room, goods, cloth, options = {}) {
  const x0 = -room.halfWidth + 0.26;
  const x1 = room.halfWidth - 0.26;
  const width = x1 - x0;
  room.box('cloth', width + 0.34, DISPLAY_TOP - room.floor, 0.96, 0, (DISPLAY_TOP + room.floor) / 2, -0.985, cloth, 0.9);
  room.box('cloth', width * 0.84, 0.27, 0.34, 0, DISPLAY_TOP + 0.135, -1.26, cloth.map((v) => v * 0.78), 0.9);
  if (!goods.length) return { x0, x1 };
  const settings = { spacing: 0.16, gap: 0.24, twist: 0.8, depthJitter: 0.1, ...options };
  fillShelf(room, goods, x0 + 0.05, x1 - 0.05, DISPLAY_TOP, -0.82, settings);
  fillShelf(room, goods, x0 + width * 0.1, x1 - width * 0.1, DISPLAY_TOP + 0.27, -1.26, { ...settings, spacing: settings.spacing * 1.4 });
  return { x0, x1 };
}

function addCounter(room, length, z, x = 0) {
  const { floor } = room;
  room.box('wood', length, 0.9, 0.62, x, floor + 0.45, z, DARK_TIMBER);
  room.box('wood', length + 0.03, 0.12, 0.65, x, floor + 0.06, z, [0.12, 0.08, 0.055]);
  const panels = Math.max(2, Math.round(length / 0.72));
  for (let i = 0; i < panels; i++) {
    const px = x - length / 2 + (length * (i + 0.5)) / panels;
    room.box('wood', length / panels - 0.12, 0.56, 0.025, px, floor + 0.5, z + 0.32, TIMBER);
    room.box('wood', length / panels - 0.24, 0.4, 0.02, px, floor + 0.5, z + 0.338, DARK_TIMBER);
  }
  room.box('wood', length + 0.14, 0.055, 0.76, x, floor + 0.93, z, [0.62, 0.42, 0.26]);
  return floor + 0.96;
}

function addSideFurniture(room, name, side, z, scale = 1) {
  const size = room.size(name, scale);
  room.put(name, side * (room.halfWidth - size.z / 2 - 0.08), room.floor, z, { rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, scale });
}

function furnishBar(room) {
  const shelf = addBackShelves(room, [1.24, 1.72, 2.2, 2.68, 3.16]);
  for (const y of shelf.levels) fillShelf(room, BOTTLES, shelf.x0, shelf.x1, y, shelf.z, { spacing: 0.06, gap: 0.2 });
  const length = room.halfWidth * 1.5;
  const counterZ = room.back + 1.9;
  const top = addCounter(room, length, counterZ);
  room.put('register', length * 0.32, top, counterZ, { scale: 0.86 });
  for (let i = 0; i < 6; i++) room.put(room.pick(['gobletA', 'gobletB']), -length * 0.42 + i * 0.28, top, counterZ + (room.random() - 0.5) * 0.3, { scale: 0.9 });
  for (let i = 0; i < 3; i++) room.put(room.pick(BOTTLES), -length * 0.06 + i * 0.16, top, counterZ - 0.12, { rotY: room.random() });
  const stools = Math.max(2, Math.floor(length / 1.05));
  for (let i = 0; i < stools; i++) room.put('stool', -length / 2 + (length * (i + 0.5)) / stools, room.floor, counterZ + 0.86, { rotY: room.random() * 6, scale: 0.92 });
  for (const side of [-1, 1]) {
    const x = side * (room.halfWidth - 0.48);
    room.put('barrel', x, room.floor, -1.92, { rotY: room.random() * 6, scale: 0.92 });
    room.put('barrel', x - side * 0.02, room.floor, -2.76, { rotY: room.random() * 6, scale: 0.92 });
  }
  addSideFurniture(room, 'cabinet', -1, room.back + 2.75, 0.8);
  addWindowDisplay(room, [...BOTTLES, 'gobletA', 'gobletB'], [0.3, 0.06, 0.06]);
}

function furnishClocks(room) {
  const shelf = addBackShelves(room, [1.24, 1.76]);
  for (const y of shelf.levels) fillShelf(room, ['mantel', 'alarm', 'alarm'], shelf.x0, shelf.x1, y, shelf.z, { spacing: 0.1, gap: 0.16, twist: 0.5 });
  const backZ = room.back + 0.06;
  for (let row = 0; row < 3; row++) {
    const y = 2.34 + row * 0.56;
    for (let x = -room.halfWidth + 0.46 + (row % 2) * 0.28; x < room.halfWidth - 0.34; x += 0.74) {
      if (room.random() < 0.16) continue;
      room.put('wallClock', x + (room.random() - 0.5) * 0.12, y + (room.random() - 0.5) * 0.08, backZ, { scale: 0.82 + room.random() * 0.62 });
    }
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) addSideFurniture(room, 'grandfather', side, room.back + 1.1 + i * 1.05);
  }
  const length = room.halfWidth * 1.1;
  const counterZ = room.back + 2.5;
  const top = addCounter(room, length, counterZ);
  for (let i = 0; i < 5; i++) room.put(i % 2 ? 'alarm' : 'mantel', -length * 0.4 + (i * length * 0.8) / 4, top, counterZ, { rotY: (room.random() - 0.5) * 0.7 });
  addWindowDisplay(room, ['mantel', 'alarm', 'alarm'], [0.07, 0.13, 0.11], { spacing: 0.2 });
}

function coatGeometry(width, height, random) {
  const profile = [[0.02, 0], [0.09, -0.02], [0.2, -0.06], [0.235, -0.16], [0.235, -0.42], [0.25, -0.72], [0.28, -1], [0.3, -1.1]]
    .map(([r, y]) => new THREE.Vector2(r * width, y * height));
  const coat = new THREE.LatheGeometry(profile, 18);
  const { position } = coat.attributes;
  const phase = random() * 6;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const hem = Math.min(1, -y / height);
    const fold = Math.sin(angle * 7 + phase) * 0.018 * hem + Math.sin(angle * 13 + phase * 2) * 0.008 * hem;
    position.setXYZ(i, x * (1 + fold * 3), y, z * 0.42 * (1 + fold * 5));
  }
  coat.computeVertexNormals();
  return scaleUv(coat, 1.8);
}

function addRail(room, length, x, y, z) {
  const rail = new THREE.CylinderGeometry(0.016, 0.016, length, 8).rotateZ(Math.PI / 2);
  rail.translate(x, y, z);
  room.batches.add('metal', rail, null, BRASS);
  for (const side of [-1, 1]) {
    const post = new THREE.CylinderGeometry(0.018, 0.018, y - room.floor, 8);
    post.translate(x + side * (length / 2), (y + room.floor) / 2, z);
    room.batches.add('metal', post, null, BRASS);
    room.box('wood', 0.08, 0.04, 0.62, x + side * (length / 2), room.floor + 0.02, z, DARK_TIMBER);
  }
  for (let cx = x - length / 2 + 0.16; cx < x + length / 2 - 0.1; cx += 0.21 + room.random() * 0.1) {
    if (room.random() < 0.1) continue;
    const coat = coatGeometry(0.92 + room.random() * 0.22, 0.86 + room.random() * 0.22, room.random);
    const tilt = new THREE.Matrix4().makeRotationY(Math.PI / 2 + (room.random() - 0.5) * 0.3).setPosition(cx, y - 0.05, z);
    room.batches.add('cloth', coat, tilt, room.pick(COAT_COLORS));
    const hook = new THREE.TorusGeometry(0.03, 0.004, 5, 10, Math.PI * 1.4).rotateY(Math.PI / 2);
    hook.translate(cx, y + 0.012, z);
    room.batches.add('metal', hook, null, [0.6, 0.6, 0.58]);
  }
}

function addMannequin(room, x, z, floor = room.floor) {
  const torso = new THREE.LatheGeometry([
    [0.01, 0], [0.15, 0.02], [0.17, 0.12], [0.135, 0.34], [0.16, 0.56], [0.185, 0.68], [0.15, 0.76], [0.055, 0.8], [0.048, 0.88], [0.012, 0.9],
  ].map(([r, y]) => new THREE.Vector2(r, y)), 22);
  torso.scale(1, 1, 0.68);
  scaleUv(torso, 1.2);
  torso.translate(x, floor + 0.78, z);
  room.batches.add('cloth', torso, null, room.pick(COAT_COLORS.concat([[0.72, 0.64, 0.5]])));
  const pole = new THREE.CylinderGeometry(0.016, 0.018, 0.82, 8);
  pole.translate(x, floor + 0.41, z);
  room.batches.add('metal', pole, null, BRASS);
  const foot = new THREE.CylinderGeometry(0.17, 0.2, 0.035, 18);
  scaleUv(foot, 0.7);
  foot.translate(x, floor + 0.018, z);
  room.batches.add('wood', foot, null, DARK_TIMBER);
}

function furnishGarments(room) {
  const shelf = addBackShelves(room, [2.72, 3.2], TIMBER);
  for (const y of shelf.levels) fillShelf(room, ['hat'], shelf.x0, shelf.x1, y, shelf.z, { spacing: 0.08, gap: 0.14, twist: 1.2, scale: 0.92 });
  addRail(room, room.halfWidth * 1.72, 0, 2.3, room.back + 0.56);
  addRail(room, room.halfWidth * 1.1, 0, 1.92, room.back + 2.2);
  const dummies = Math.max(2, Math.round(room.halfWidth / 1.1));
  for (let i = 0; i < dummies; i++) addMannequin(room, -room.halfWidth * 0.72 + (room.halfWidth * 1.44 * i) / (dummies - 1), -1.02, DISPLAY_TOP);
  for (let i = 0; i < 3; i++) {
    room.put('suitcase', room.halfWidth - 0.62, room.floor + i * 0.2, room.back + 3.7, { rotY: 0.2 * (i - 1) + Math.PI / 2, scale: 0.86 - i * 0.08 });
  }
  for (let i = 0; i < 3; i++) room.put('boots', -room.halfWidth + 0.5 + i * 0.5, room.floor, room.back + 3.5, { rotY: 0.4 + (room.random() - 0.5) * 0.4 });
  addSideFurniture(room, 'drawersOld', -1, room.back + 3.9, 0.9);
  addWindowDisplay(room, ['hat'], [0.5, 0.45, 0.36], { spacing: 0.62, gap: 0.2, twist: 1.6, scale: 0.9 });
}

function furnishBakery(room) {
  const shelf = addBackShelves(room, [1.24, 1.68, 2.12, 2.56, 3], [0.46, 0.34, 0.24]);
  const breads = ['croissant', 'bunA', 'bunB', 'bunB', 'croissant'];
  for (const y of shelf.levels) fillShelf(room, breads, shelf.x0, shelf.x1, y, shelf.z, { spacing: 0.015, gap: 0.05, twist: 3, depthJitter: 0.14, scale: 1.05 });
  const length = room.halfWidth * 1.62;
  const counterZ = room.back + 2.2;
  const top = addCounter(room, length, counterZ);
  room.box('metal', length, 0.008, 0.68, 0, top - 0.006, counterZ, [0.5, 0.5, 0.48]);
  for (let i = 0; i < 6; i++) {
    const x = -length * 0.42 + (length * 0.84 * i) / 5;
    room.put(i % 2 ? 'carrotCake' : 'berryCake', x, top, counterZ, { rotY: room.random() * 6, scale: 0.82 });
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const x = side * (room.halfWidth - 0.48);
      const z = -1.92 - i * 0.8;
      room.put('basket', x, room.floor, z, { rotY: room.random() * 6 });
      const basket = room.size('basket');
      for (let k = 0; k < 5; k++) {
        const angle = (k / 5) * Math.PI * 2;
        room.put(room.pick(['bunA', 'bunB', 'croissant']), x + Math.cos(angle) * basket.x * 0.2, room.floor + basket.y * 0.62, z + Math.sin(angle) * basket.z * 0.2, { rotY: room.random() * 6, scale: 0.9 });
      }
    }
  }
  addWindowDisplay(room, ['carrotCake', 'berryCake', 'bunA', 'croissant', 'basket'], [0.66, 0.6, 0.48], { spacing: 0.09, gap: 0.12, twist: 3 });
}

function hangTools(room, x0, x1, y0, y1, z) {
  const tools = ['hammer', 'wrench', 'saw', 'hammer', 'wrench'];
  for (let y = y0; y < y1; y += 0.62) {
    for (let x = x0; x < x1; x += 0.4 + room.random() * 0.18) {
      if (room.random() < 0.15) continue;
      const name = room.pick(tools);
      const size = room.library[name].size;
      const long = Math.max(size.x, size.z);
      const scale = name === 'saw' ? 0.82 : 1;
      room.put(name, x, y, z, { rotY: name === 'saw' ? Math.PI / 2 : (room.random() - 0.5) * 0.08, scale });
      if (long * scale > 0.5) x += 0.32;
    }
  }
}

function furnishHardware(room) {
  const shelf = addBackShelves(room, [1.24, 1.72], [0.3, 0.22, 0.15]);
  fillShelf(room, ['oilCan', 'wateringCan', 'oilCan', 'bucket'], shelf.x0, shelf.x1, shelf.levels[0], shelf.z, { spacing: 0.07, gap: 0.12, twist: 1 });
  fillShelf(room, ['toolbox', 'oilCan', 'oilCan'], shelf.x0, shelf.x1, shelf.levels[1], shelf.z, { spacing: 0.08, gap: 0.14, twist: 0.3, scale: 0.72 });
  const width = shelf.x1 - shelf.x0;
  room.box('wood', width, 1.74, 0.03, 0, 3.08, room.back + 0.06, [0.42, 0.33, 0.22]);
  hangTools(room, shelf.x0 + 0.2, shelf.x1 - 0.18, 2.42, 3.8, room.back + 0.11);
  const length = room.halfWidth * 1.2;
  const counterZ = room.back + 2.3;
  const top = addCounter(room, length, counterZ);
  room.put('toolbox', length * 0.22, top, counterZ, { rotY: -0.2, scale: 0.82 });
  room.put('ladder', room.halfWidth - 0.56, room.floor, room.back + 0.84, { tiltX: -0.16, rotY: Math.PI });
  for (let i = 0; i < 3; i++) room.put('bucket', -room.halfWidth + 0.46, room.floor + i * 0.19, -1.92 - (i % 2) * 0.03, { rotY: i, scale: 1 - i * 0.03 });
  room.put('wateringCan', room.halfWidth - 0.58, room.floor, -1.92, { rotY: 2.2 });
  addSideFurniture(room, 'drawers', -1, room.back + 3.1, 0.92);
  addWindowDisplay(room, ['oilCan', 'wateringCan', 'toolbox', 'oilCan'], [0.17, 0.2, 0.17], { spacing: 0.14, scale: 0.78 });
}

function furnishPortraits(room) {
  const backZ = room.back + 0.06;
  const frames = ['frameA', 'frameB', 'frameC', 'frameA', 'frameB'];
  for (let row = 0; row < 3; row++) {
    const y = 1.38 + row * 0.86;
    for (let x = -room.halfWidth + 0.5 + (row % 2) * 0.22; x < room.halfWidth - 0.34;) {
      const name = room.pick(frames);
      const scale = 0.74 + room.random() * 0.44;
      const size = room.size(name, scale);
      room.put(name, x + size.x / 2, y + (room.random() - 0.5) * 0.1, backZ, { scale });
      x += size.x + 0.14 + room.random() * 0.18;
    }
  }
  room.put('mirror', 0, 1.2, backZ + 0.02, { scale: Math.min(1, 1.9 / room.library.mirror.size.y) });
  const length = room.halfWidth * 0.82;
  const tableZ = room.back + 2.6;
  const top = addCounter(room, length, tableZ);
  room.put('camera', -length * 0.18, top, tableZ, { rotY: 0.5 });
  for (let i = 0; i < 4; i++) room.put('frameStanding', length * 0.04 + i * 0.16, top, tableZ - 0.08 + (i % 2) * 0.12, { rotY: (room.random() - 0.5) * 0.7, scale: 0.8 });
  addSideFurniture(room, 'cabinet', 1, room.back + 2.2, 0.86);
  addSideFurniture(room, 'drawersOld', -1, room.back + 2.2, 0.9);
  addWindowDisplay(room, ['frameStanding', 'frameStanding', 'camera'], [0.08, 0.08, 0.1], { spacing: 0.2, twist: 0.5 });
}

function furnishBooks(room) {
  const shelf = addBackShelves(room, [1.08, 1.5, 1.92, 2.34, 2.76, 3.18]);
  const bookScale = Math.min(1, 0.31 / room.library.book01.size.y);
  for (const y of shelf.levels) addBookRow(room, shelf.x0, shelf.x1, y, shelf.z);
  for (const side of [-1, 1]) {
    addSideFurniture(room, 'bookcase', side, room.back + 1.4);
    addSideFurniture(room, 'bookcase', side, room.back + 3.1);
  }
  room.put('ladder', room.halfWidth * 0.3, room.floor, room.back + 0.72, { tiltX: -0.16, rotY: Math.PI });
  const length = room.halfWidth * 0.82;
  const tableZ = room.back + 2.9;
  const top = addCounter(room, length, tableZ);
  for (let stack = 0; stack < 4; stack++) {
    const x = -length * 0.36 + (stack * length * 0.72) / 3;
    for (let i = 0; i < 3; i++) {
      room.put(room.pick(BOOKS), x, top + i * 0.06, tableZ, { scale: bookScale, tiltZ: Math.PI / 2, rotY: room.random() * 0.5 });
    }
  }
  const display = addWindowDisplay(room, [], [0.1, 0.16, 0.13]);
  addBookRow(room, display.x0 + 0.1, display.x1 - 0.1, DISPLAY_TOP, -0.86);
  addBookRow(room, display.x0 + 0.5, display.x1 - 0.5, DISPLAY_TOP + 0.27, -1.26);
}

const FURNISH = {
  [KIND.BOTTLES]: furnishBar,
  [KIND.CLOCKS]: furnishClocks,
  [KIND.GARMENTS]: furnishGarments,
  [KIND.BAKERY]: furnishBakery,
  [KIND.HARDWARE]: furnishHardware,
  [KIND.PORTRAITS]: furnishPortraits,
  [KIND.BOOKS]: furnishBooks,
};

export async function createShopInteriors({ scene, shops, renderer, tier, noise, paneMaterial }) {
  for (const shop of shops) {
    shop.paneMesh = new THREE.Mesh(shop.pane, paneMaterial);
    shop.paneMesh.geometry.computeBoundingSphere();
    scene.add(shop.paneMesh);
  }
  if (!tier.interiors) return { lightCount: 0, update() {}, before() {}, after() {} };

  const [sets, library] = await Promise.all([
    loadTextureSets(renderer, ['floorWood', 'floorTile', 'wallPlaster'], './assets/interiors/tex'),
    loadLibrary(INTERIOR_MODELS, 'interiors', true),
  ]);
  // Rooms are lit only by this pool, so street lamps and moonlight cannot leak through the facade.
  const lightPool = Array.from({ length: NEAR_SHOPS * LAMPS_PER_SHOP }, () => {
    const light = new THREE.PointLight(0xffbd7d, 0, 7.5, 2);
    scene.add(light);
    return light;
  });
  const roomLights = lights([...lightPool, new THREE.AmbientLight(0xffd9b0, 0.17)]);
  const roomMaterials = new Map();
  for (const prop of Object.values(library)) {
    for (const part of prop.parts) {
      if (!roomMaterials.has(part.material)) roomMaterials.set(part.material, toRoomMaterial(part.material, roomLights));
      part.material = roomMaterials.get(part.material);
    }
  }
  for (const part of library.wallClock.parts) if (!part.material.transparent) part.material.color.multiplyScalar(0.62);

  const materials = {
    floorWood: dryMaterial(sets.floorWood),
    floorTile: dryMaterial(sets.floorTile, { roughness: 0.6 }),
    wallPlaster: dryMaterial(sets.wallPlaster, { normalScale: 0.6 }),
    wood: dryMaterial(sets.floorWood, { normalScale: 0.5, roughness: 0.72 }),
    cloth: dryMaterial(sets.wallPlaster, { normalScale: 0.4 }),
    metal: metalMaterial(),
    bulb: createGlowMaterial(0xffc27a, 2.4),
  };
  for (const [key, material] of Object.entries(materials)) if (key !== 'bulb') material.lightsNode = roomLights;
  const noCast = new Set(Object.keys(materials));
  const glassMaterial = createShopGlass(noise);

  for (const shop of shops) {
    const room = new Room(shop, library);
    buildShell(room);
    (FURNISH[shop.kind] ?? furnishBar)(room);
    addPendants(room);

    const group = new THREE.Group();
    group.applyMatrix4(shop.matrix);
    room.batches.build(materials, group, noCast);
    room.items.build(group);
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
    });
    scene.add(group);

    shop.group = group;
    shop.glass = new THREE.Mesh(shop.pane, glassMaterial);
    shop.glass.renderOrder = 15;
    scene.add(shop.glass);
    shop.center = new THREE.Vector3(0, 2, (room.front + room.back) / 2).applyMatrix4(shop.matrix);
    shop.near = true;
    shop.lampPoints = room.lampPoints.map((point) => point.clone().applyMatrix4(shop.matrix));
  }

  const assignLights = () => {
    const points = shops.filter((shop) => shop.near).flatMap((shop) => shop.lampPoints);
    lightPool.forEach((light, index) => {
      const point = points[index];
      light.intensity = point ? LAMP_INTENSITY : 0;
      if (point) light.position.copy(point);
    });
  };
  const setNear = (shop, near) => {
    shop.near = near;
    shop.group.visible = near;
    shop.glass.visible = near;
    shop.paneMesh.visible = !near;
  };
  assignLights();

  // Every room stays visible for the first frames so all its shaders compile during loading.
  let warmFrames = 4;
  let timer = 0;
  return {
    lightCount: lightPool.length,
    update(dt, cameraPosition) {
      if (warmFrames > 0) {
        warmFrames--;
        return;
      }
      timer -= dt;
      if (timer > 0) return;
      timer = 0.2;
      const wanted = new Set([...shops]
        .map((shop) => ({ shop, distance: shop.center.distanceTo(cameraPosition) }))
        .filter(({ shop, distance }) => distance < NEAR_DISTANCE + (shop.near ? 4 : 0))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, NEAR_SHOPS)
        .map(({ shop }) => shop));
      let changed = false;
      for (const shop of shops) {
        if (wanted.has(shop) === shop.near) continue;
        setNear(shop, wanted.has(shop));
        changed = true;
      }
      if (changed) assignLights();
    },
    // The rippled road reflection cannot resolve rooms, so it always sees the cheap painted panes.
    before() {
      for (const shop of shops) {
        if (!shop.near) continue;
        shop.group.visible = false;
        shop.glass.visible = false;
        shop.paneMesh.visible = true;
      }
    },
    after() {
      for (const shop of shops) {
        if (!shop.near) continue;
        shop.group.visible = true;
        shop.glass.visible = true;
        shop.paneMesh.visible = false;
      }
    },
  };
}

/** Camera positions looking straight into each shop, used to verify the rooms. */
export function shopShots(shops) {
  return shops.map((shop) => ({
    kind: shop.kind,
    position: new THREE.Vector3(0, 1.7, 2.9).applyMatrix4(shop.matrix).toArray(),
    target: new THREE.Vector3(0, 1.95, -5).applyMatrix4(shop.matrix).toArray(),
  }));
}
