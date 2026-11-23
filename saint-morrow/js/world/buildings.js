import * as THREE from 'three/webgpu';
import { circlePoints, extrudeRing, gothicPoints, metricBox, scaleUv, seededRandom } from './geometry.js';

const FLOOR = 3.7;
export const GROUND = 4.5;
export const ROOM_DEPTH = 5.6;
const DEPTH = 14;
const TILE = { brick: 2.4, plaster: 2.8, stone: 2.2, slate: 2.2, iron: 1.2 };
const PAINTED_IRON = [0.13, 0.14, 0.15];
const OLD_PAINT = [0.2, 0.16, 0.13];
const BRASS = [0.86, 0.64, 0.3];
const _translate = new THREE.Matrix4();
const _a = new THREE.Vector3();
const _axis = new THREE.Vector3(1, 0, 0);
const _dir = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3(1, 1, 1);

function boxAt(ctx, key, width, height, depth, x, y, z, matrix, tint = key === 'iron' ? PAINTED_IRON : undefined) {
  _translate.makeTranslation(x, y, z).premultiply(matrix);
  ctx.batches.add(key, metricBox(width, height, depth, TILE[key] ?? 2.4), _translate, tint);
}

function coneAt(ctx, key, radius, height, x, y, z, matrix, tint, sides = 8) {
  const geometry = new THREE.ConeGeometry(radius, height, sides);
  scaleUv(geometry, 1.4);
  geometry.translate(x, y + height / 2, z);
  ctx.batches.add(key, geometry, matrix, tint);
}

function cylinderAt(ctx, key, radius, height, x, y, z, matrix, tint = PAINTED_IRON, sides = 8) {
  const geometry = new THREE.CylinderGeometry(radius, radius, height, sides);
  scaleUv(geometry, 0.8);
  geometry.translate(x, y + height / 2, z);
  ctx.batches.add(key, geometry, matrix, tint);
}

/** A square-section beam between two local points. */
function beam(ctx, key, from, to, thickness, matrix, tint = PAINTED_IRON) {
  _dir.subVectors(to, from);
  const length = _dir.length();
  _q.setFromUnitVectors(_axis, _dir.normalize());
  _a.addVectors(from, to).multiplyScalar(0.5);
  _translate.compose(_a, _q, _s).premultiply(matrix);
  ctx.batches.add(key, metricBox(length, thickness, thickness, TILE[key] ?? 1.2), _translate, tint);
}

function archBand(cx, y, width, height, thickness) {
  const outer = gothicPoints(cx, y, width + thickness * 2, height + thickness * 1.6, 8).slice(2);
  const inner = gothicPoints(cx, y, width, height, 8).slice(2).reverse();
  return new THREE.Shape([...outer, ...inner]);
}

/** Adds a glass pane whose shader fakes a furnished room behind it. */
export function addGlass(ctx, points, cx, cy, z, matrix, room) {
  const geometry = new THREE.ShapeGeometry(new THREE.Shape(points)).toNonIndexed();
  const count = geometry.attributes.position.count;
  const local = new Float32Array(count * 2);
  const rooms = new Float32Array(count * 4);
  const lit = new Float32Array(count);
  const kinds = new Float32Array(count).fill(room.kind ?? 0);
  const tangents = new Float32Array(count * 3);
  const faces = new Float32Array(count * 3);
  const tangent = new THREE.Vector3(1, 0, 0).transformDirection(matrix);
  const face = new THREE.Vector3(0, 0, 1).transformDirection(matrix);
  for (let i = 0; i < count; i++) {
    local[i * 2] = geometry.attributes.position.getX(i) - cx;
    local[i * 2 + 1] = geometry.attributes.position.getY(i) - cy;
    rooms.set([room.halfWidth, room.halfHeight, room.depth, room.seed], i * 4);
    lit[i] = room.lit;
    tangents.set([tangent.x, tangent.y, tangent.z], i * 3);
    faces.set([face.x, face.y, face.z], i * 3);
  }
  geometry.translate(0, 0, z);
  geometry.applyMatrix4(matrix);
  geometry.deleteAttribute('uv');
  geometry.setAttribute('aLocal', new THREE.BufferAttribute(local, 2));
  geometry.setAttribute('aRoom', new THREE.BufferAttribute(rooms, 4));
  geometry.setAttribute('aLit', new THREE.BufferAttribute(lit, 1));
  geometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1));
  geometry.setAttribute('aTan', new THREE.BufferAttribute(tangents, 3));
  geometry.setAttribute('aFace', new THREE.BufferAttribute(faces, 3));
  ctx.glass.push(geometry);
}

function addTracery(ctx, cx, y, width, height, matrix, stone) {
  const plate = new THREE.Shape(gothicPoints(cx, y + 0.012, width - 0.024, height - 0.024, 8));
  const lancet = width * 0.36;
  const lancetHeight = height * 0.6;
  plate.holes.push(
    new THREE.Path(gothicPoints(cx - width * 0.225, y + 0.05, lancet, lancetHeight, 5)),
    new THREE.Path(gothicPoints(cx + width * 0.225, y + 0.05, lancet, lancetHeight, 5)),
    new THREE.Path(circlePoints(cx, y + height * 0.75, width * 0.17, 14)),
  );
  const geometry = new THREE.ExtrudeGeometry(plate, { depth: 0.08, bevelEnabled: false, curveSegments: 1 });
  geometry.translate(0, 0, -0.31);
  ctx.batches.add('stone', scaleUv(geometry, 1 / TILE.stone), matrix, stone);
  for (const side of [-1, 1]) {
    for (const k of [0.2, 0.4]) boxAt(ctx, 'iron', lancet, 0.018, 0.022, cx + side * width * 0.225, y + height * k, -0.35, matrix);
  }
}

function addUpperWindow(ctx, shape, cx, y, width, height, matrix, random, stone, withPanel) {
  const hole = gothicPoints(cx, y, width, height);
  shape.holes.push(new THREE.Path(hole));
  const outer = gothicPoints(cx, y - 0.1, width + 0.26, height + 0.24);
  const inner = gothicPoints(cx, y + 0.012, width - 0.024, height - 0.024);
  ctx.batches.add('stone', extrudeRing(outer, inner, 0.24, -0.09, TILE.stone), matrix, stone);

  const hood = new THREE.ExtrudeGeometry(archBand(cx, y - 0.1, width + 0.26, height + 0.24, 0.1), { depth: 0.2, bevelEnabled: false, curveSegments: 1 });
  hood.translate(0, 0, 0.02);
  ctx.batches.add('stone', scaleUv(hood, 1 / TILE.stone), matrix, stone);
  const spring = y + height - width * Math.sin(Math.PI / 3);
  for (const side of [-1, 1]) {
    boxAt(ctx, 'stone', 0.17, 0.2, 0.25, cx + side * (width / 2 + 0.21), spring - 0.13, 0.12, matrix, stone);
    coneAt(ctx, 'stone', 0.075, 0.13, cx + side * (width / 2 + 0.21), spring - 0.04, 0.13, matrix, stone, 6);
  }

  addTracery(ctx, cx, y, width, height, matrix, stone);
  boxAt(ctx, 'stone', width + 0.5, 0.09, 0.36, cx, y - 0.13, 0.11, matrix, stone);
  boxAt(ctx, 'stone', width + 0.36, 0.06, 0.26, cx, y - 0.2, 0.08, matrix, stone);
  for (const side of [-1, 1]) boxAt(ctx, 'stone', 0.14, 0.18, 0.22, cx + side * (width / 2 + 0.05), y - 0.31, 0.07, matrix, stone);

  if (withPanel) {
    boxAt(ctx, 'stone', width * 0.88, 0.42, 0.045, cx, y - 0.62, 0.02, matrix, stone.map((v) => v * 0.82));
    ctx.batches.add('stone', extrudeRing(circlePoints(cx, y - 0.62, 0.16, 14), circlePoints(cx, y - 0.62, 0.105, 14), 0.05, 0.03, TILE.stone), matrix, stone);
  }

  addGlass(ctx, hole, cx, y + height / 2, -0.41, matrix, {
    halfWidth: Math.max(width * 1.25, 1.35),
    halfHeight: 1.5,
    depth: 3.4,
    seed: random(),
    lit: random() < 0.4 ? 0.55 + random() * 0.45 : 0,
  });
}

function addAwning(ctx, shopWidth, matrix, random) {
  const palette = [[[0.42, 0.11, 0.09], [0.7, 0.62, 0.48]], [[0.12, 0.23, 0.2], [0.66, 0.62, 0.5]], [[0.13, 0.17, 0.3], [0.68, 0.64, 0.54]]][Math.floor(random() * 3)];
  const width = shopWidth * 0.84;
  const strips = Math.max(6, Math.round(width / 0.46));
  const step = width / strips;
  const slope = new THREE.Matrix4().makeRotationX(0.42).setPosition(0, 3.72, 0.74).premultiply(matrix);
  for (let i = 0; i < strips; i++) {
    const x = -width / 2 + step * (i + 0.5);
    const tint = palette[i % 2];
    _translate.makeTranslation(x, 0, 0).premultiply(slope);
    ctx.batches.add('plaster', metricBox(step * 0.99, 0.035, 1.58, 1.4), _translate, tint);
    _translate.makeTranslation(x, -0.09, 0.79).premultiply(slope);
    ctx.batches.add('plaster', metricBox(step * 0.92, 0.2, 0.016, 1.4), _translate, tint);
  }
  for (const side of [-1, 1]) {
    beam(ctx, 'iron', new THREE.Vector3(side * width / 2, 3.98, 0), new THREE.Vector3(side * width / 2, 3.42, 1.46), 0.03, matrix);
  }
  beam(ctx, 'iron', new THREE.Vector3(-width / 2, 3.42, 1.46), new THREE.Vector3(width / 2, 3.42, 1.46), 0.028, matrix);
}

function addShopfront(ctx, shape, width, matrix, rotation, random, stone) {
  const shopWidth = width - 2.3;
  const left = -shopWidth / 2;
  const hole = [
    new THREE.Vector2(left, 0.46), new THREE.Vector2(-left, 0.46),
    new THREE.Vector2(-left, 3.78), new THREE.Vector2(left, 3.78),
  ];
  shape.holes.push(new THREE.Path(hole));
  const closed = random() < 0.3;
  const kind = ctx.signage.peekKind();
  const seed = random();
  // Open shops keep their painted pane separate: it is the far LOD of the real room behind it.
  const paneSink = closed ? ctx : { glass: [] };
  addGlass(paneSink, hole, 0, 2.12, -0.42, matrix, {
    halfWidth: shopWidth / 2 + 0.12,
    halfHeight: 1.72,
    depth: 4.4,
    seed,
    lit: closed ? 0.1 : 0.72 + random() * 0.28,
    kind,
  });

  const bays = Math.max(3, Math.round(shopWidth / 2.2));
  const bayWidth = shopWidth / bays;
  const doorBay = Math.floor(random() * bays);
  const doorX = left + bayWidth * (doorBay + 0.5);
  const paint = [OLD_PAINT, [0.08, 0.14, 0.12], [0.16, 0.07, 0.07], [0.07, 0.09, 0.15]][Math.floor(random() * 4)];

  for (let i = 0; i <= bays; i++) {
    const x = left + bayWidth * i;
    boxAt(ctx, 'iron', 0.12, 3.34, 0.14, x, 2.12, -0.33, matrix, paint);
    boxAt(ctx, 'iron', 0.2, 0.16, 0.2, x, 3.02, -0.3, matrix, paint);
    boxAt(ctx, 'iron', 0.18, 0.2, 0.18, x, 0.62, -0.31, matrix, paint);
  }
  boxAt(ctx, 'iron', shopWidth, 0.09, 0.15, 0, 3.0, -0.33, matrix, paint);
  for (let i = 0; i < bays; i++) {
    for (let k = 1; k < 4; k++) boxAt(ctx, 'iron', 0.025, 0.72, 0.04, left + bayWidth * (i + k / 4), 3.4, -0.37, matrix, paint);
    if (i === doorBay) continue;
    const x = left + bayWidth * (i + 0.5);
    boxAt(ctx, 'iron', bayWidth - 0.12, 0.6, 0.1, x, 0.76, -0.34, matrix, paint);
    boxAt(ctx, 'iron', bayWidth - 0.42, 0.34, 0.03, x, 0.76, -0.28, matrix, paint.map((v) => v * 1.5));
    boxAt(ctx, 'iron', bayWidth - 0.12, 0.05, 0.2, x, 1.08, -0.28, matrix, paint);
  }

  const doorWidth = bayWidth * 0.82;
  boxAt(ctx, 'iron', doorWidth, 1.05, 0.07, doorX, 1.0, -0.3, matrix, paint);
  boxAt(ctx, 'iron', doorWidth * 0.68, 0.62, 0.025, doorX, 1.0, -0.255, matrix, paint.map((v) => v * 1.6));
  for (const side of [-1, 1]) boxAt(ctx, 'iron', 0.1, 2.36, 0.09, doorX + side * (doorWidth / 2), 1.66, -0.3, matrix, paint);
  boxAt(ctx, 'iron', doorWidth, 0.09, 0.09, doorX, 2.86, -0.3, matrix, paint);
  boxAt(ctx, 'iron', 0.035, 0.26, 0.05, doorX + doorWidth * 0.34, 1.46, -0.24, matrix, BRASS);
  boxAt(ctx, 'iron', 0.2, 0.035, 0.02, doorX, 1.32, -0.25, matrix, BRASS);

  boxAt(ctx, 'stone', bayWidth * 0.98, 0.15, 0.82, doorX, 0.31, 0.18, matrix, stone);
  boxAt(ctx, 'stone', bayWidth * 1.12, 0.15, 1.1, doorX, 0.16, 0.3, matrix, stone);
  boxAt(ctx, 'stone', width, 0.46, 0.08, 0, 0.23, 0.04, matrix, stone);
  boxAt(ctx, 'stone', width + 0.06, 0.07, 0.14, 0, 0.47, 0.05, matrix, stone);

  boxAt(ctx, 'iron', shopWidth + 0.28, 0.66, 0.2, 0, GROUND - 0.44, 0.1, matrix, paint);
  ctx.signage.addFascia(matrix, Math.min(shopWidth - 0.1, 9.4), GROUND - 0.44, 0.205);
  boxAt(ctx, 'stone', width + 0.1, 0.1, 0.5, 0, GROUND - 0.04, 0.14, matrix, stone);
  boxAt(ctx, 'stone', width + 0.2, 0.07, 0.62, 0, GROUND + 0.04, 0.16, matrix, stone);
  for (const side of [-1, 1]) {
    const pierX = side * (width / 2 - 0.42);
    boxAt(ctx, 'stone', 0.76, GROUND - 0.4, 0.2, pierX, (GROUND - 0.4) / 2, 0.08, matrix, stone);
    boxAt(ctx, 'stone', 0.9, 0.16, 0.3, pierX, GROUND - 0.62, 0.11, matrix, stone);
    boxAt(ctx, 'stone', 0.86, 0.3, 0.26, pierX, 0.15, 0.11, matrix, stone);
    for (let k = 0; k < 7; k++) boxAt(ctx, 'stone', 0.8, 0.018, 0.21, pierX, 0.62 + k * 0.48, 0.09, matrix, stone.map((v) => v * 0.55));
    boxAt(ctx, 'iron', 0.24, 0.52, 0.36, side * (shopWidth / 2 + 0.05), GROUND - 0.48, 0.28, matrix, paint);
    if (random() < 0.55) ctx.signage.addPoster(matrix, pierX, 1.72, 0.185, (random() - 0.5) * 0.08);
  }

  if (closed) {
    const count = Math.max(2, Math.round(shopWidth / 3));
    const shutterWidth = shopWidth / count;
    const prop = ctx.props.library.shutter;
    for (let i = 0; i < count; i++) {
      const name = random() < 0.55 ? 'shutterTagged' : 'shutter';
      ctx.props.placeOnWall(name, matrix, rotation, left + shutterWidth * (i + 0.5), 0.46, -0.12, {
        solid: false,
        scale: [shutterWidth / prop.size.x, 3.34 / prop.size.y, 0.5],
      });
    }
  } else if (random() < 0.72) {
    addAwning(ctx, shopWidth, matrix, random);
  }
  return closed ? { open: false } : { open: true, pane: paneSink.glass[0], kind, seed, shopWidth };
}

/** The building mass with a shop-sized void left at ground level. */
function addHollowCore(ctx, wall, width, height, roomHalf, matrix, tint) {
  const coreDepth = DEPTH - 0.55;
  const coreZ = -(DEPTH + 0.55) / 2;
  const top = GROUND - 0.1;
  boxAt(ctx, wall, width, height - top, coreDepth, 0, (height + top) / 2, coreZ, matrix, tint);
  const side = width / 2 - roomHalf;
  for (const s of [-1, 1]) boxAt(ctx, wall, side, top, coreDepth, s * (roomHalf + side / 2), top / 2, coreZ, matrix, tint);
  const behind = coreDepth - ROOM_DEPTH;
  boxAt(ctx, wall, roomHalf * 2, top, behind, 0, top / 2, -(0.55 + ROOM_DEPTH + behind / 2), matrix, tint);
}

function addQuoins(ctx, width, height, matrix, stone) {
  for (const side of [-1, 1]) {
    let course = 0;
    for (let y = GROUND + 0.2; y < height - 0.2; y += 0.46) {
      const length = course++ % 2 ? 0.48 : 0.86;
      boxAt(ctx, 'stone', length, 0.4, 0.09, side * (width / 2 - length / 2), y + 0.2, 0.03, matrix, stone);
    }
  }
}

function addCornice(ctx, width, height, matrix, stone) {
  boxAt(ctx, 'stone', width + 0.04, 0.16, 0.24, 0, height - 0.5, 0.08, matrix, stone);
  const corbels = Math.floor(width / 0.56);
  const spacing = width / corbels;
  for (let i = 0; i < corbels; i++) {
    const x = -width / 2 + spacing * (i + 0.5);
    boxAt(ctx, 'stone', 0.17, 0.24, 0.28, x, height - 0.28, 0.13, matrix, stone);
    boxAt(ctx, 'stone', 0.12, 0.12, 0.18, x, height - 0.42, 0.08, matrix, stone);
  }
  const dentils = Math.floor(width / 0.22);
  for (let i = 0; i < dentils; i++) {
    boxAt(ctx, 'stone', 0.1, 0.09, 0.11, -width / 2 + (width / dentils) * (i + 0.5), height - 0.08, 0.27, matrix, stone);
  }
}

function addDrainpipe(ctx, x, height, matrix) {
  cylinderAt(ctx, 'iron', 0.058, height - 0.36, x, 0.18, 0.12, matrix, PAINTED_IRON, 10);
  boxAt(ctx, 'iron', 0.26, 0.3, 0.26, x, height - 0.22, 0.14, matrix);
  boxAt(ctx, 'iron', 0.32, 0.05, 0.32, x, height - 0.05, 0.14, matrix);
  for (let y = 1.2; y < height - 0.6; y += 1.85) {
    boxAt(ctx, 'iron', 0.18, 0.04, 0.17, x, y, 0.06, matrix);
    cylinderAt(ctx, 'iron', 0.067, 0.07, x, y - 0.035, 0.12, matrix, PAINTED_IRON, 10);
  }
  const shoe = new THREE.Vector3(x, 0.2, 0.12);
  beam(ctx, 'iron', shoe, new THREE.Vector3(x, 0.03, 0.34), 0.1, matrix);
}

function addFireEscape(ctx, cx, floors, matrix) {
  const width = 3.5;
  const depth = 1.08;
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let floor = 1; floor < floors; floor++) {
    const y = GROUND + (floor - 1) * FLOOR + 0.34;
    for (let i = 0; i <= 16; i++) boxAt(ctx, 'iron', 0.024, 0.03, depth, cx - width / 2 + (width * i) / 16, y, depth / 2 + 0.03, matrix);
    for (const z of [0.05, depth]) boxAt(ctx, 'iron', width, 0.07, 0.04, cx, y, z, matrix);
    for (const side of [-1, 1]) {
      boxAt(ctx, 'iron', 0.04, 0.07, depth, cx + side * width / 2, y, depth / 2 + 0.03, matrix);
      beam(ctx, 'iron', v(cx + side * (width / 2 - 0.08), y - 0.82, 0.02), v(cx + side * (width / 2 - 0.08), y - 0.02, depth - 0.08), 0.04, matrix);
    }
    boxAt(ctx, 'iron', width, 0.035, 0.035, cx, y + 1.02, depth, matrix);
    boxAt(ctx, 'iron', width, 0.02, 0.02, cx, y + 0.52, depth, matrix);
    for (let i = 0; i <= 14; i++) boxAt(ctx, 'iron', 0.016, 1.02, 0.016, cx - width / 2 + (width * i) / 14, y + 0.51, depth, matrix);
    for (const side of [-1, 1]) {
      boxAt(ctx, 'iron', 0.035, 0.035, depth, cx + side * width / 2, y + 1.02, depth / 2 + 0.03, matrix);
      for (let i = 0; i <= 3; i++) boxAt(ctx, 'iron', 0.016, 1.02, 0.016, cx + side * width / 2, y + 0.51, 0.1 + i * 0.3, matrix);
    }
    if (floor < floors - 1) {
      const direction = floor % 2 ? 1 : -1;
      const low = v(cx - direction * 1.24, y + 0.03, 0.62);
      const high = v(cx + direction * 1.28, y + FLOOR + 0.03, 0.62);
      for (const z of [0.36, 0.88]) {
        beam(ctx, 'iron', v(low.x, low.y, z), v(high.x, high.y, z), 0.05, matrix);
        beam(ctx, 'iron', v(low.x, low.y + 0.86, z), v(high.x, high.y + 0.86, z), 0.028, matrix);
      }
      const treads = 13;
      for (let i = 1; i < treads; i++) {
        const k = i / treads;
        boxAt(ctx, 'iron', 0.13, 0.024, 0.5, low.x + (high.x - low.x) * k, low.y + (high.y - low.y) * k, 0.62, matrix);
        if (i % 3 === 0) for (const z of [0.36, 0.88]) boxAt(ctx, 'iron', 0.016, 0.86, 0.016, low.x + (high.x - low.x) * k, low.y + (high.y - low.y) * k + 0.43, z, matrix);
      }
    }
  }
}

function addBalcony(ctx, cx, y, width, matrix, stone) {
  boxAt(ctx, 'stone', width + 0.8, 0.13, 0.86, cx, y, 0.44, matrix, stone);
  boxAt(ctx, 'stone', width + 0.66, 0.08, 0.72, cx, y - 0.1, 0.38, matrix, stone);
  for (const side of [-1, 1]) {
    boxAt(ctx, 'stone', 0.2, 0.34, 0.54, cx + side * (width / 2 + 0.16), y - 0.28, 0.28, matrix, stone);
    boxAt(ctx, 'iron', 0.04, 0.92, 0.04, cx + side * (width / 2 + 0.36), y + 0.5, 0.82, matrix);
    boxAt(ctx, 'iron', 0.04, 0.035, 0.76, cx + side * (width / 2 + 0.36), y + 0.94, 0.44, matrix);
    for (let i = 0; i < 4; i++) boxAt(ctx, 'iron', 0.014, 0.88, 0.014, cx + side * (width / 2 + 0.36), y + 0.5, 0.18 + i * 0.17, matrix);
  }
  boxAt(ctx, 'iron', width + 0.76, 0.04, 0.04, cx, y + 0.94, 0.82, matrix);
  boxAt(ctx, 'iron', width + 0.76, 0.022, 0.022, cx, y + 0.18, 0.82, matrix);
  const bars = Math.round((width + 0.72) / 0.095);
  for (let i = 0; i <= bars; i++) {
    const x = cx - (width + 0.72) / 2 + ((width + 0.72) * i) / bars;
    boxAt(ctx, 'iron', 0.013, 0.8, 0.013, x, y + 0.56, 0.82, matrix);
    if (i % 4 === 0) coneAt(ctx, 'iron', 0.022, 0.07, x, y + 0.96, 0.82, matrix, PAINTED_IRON, 5);
  }
}

function addChimney(ctx, x, z, base, wallKey, tint, stone, matrix, random) {
  const height = 2.6 + random() * 1.5;
  boxAt(ctx, wallKey, 1.28, height, 0.74, x, base + height / 2, z, matrix, tint);
  boxAt(ctx, 'stone', 1.44, 0.11, 0.9, x, base + height, z, matrix, stone);
  boxAt(ctx, 'stone', 1.34, 0.08, 0.8, x, base + height + 0.09, z, matrix, stone);
  for (const offset of [-0.34, 0, 0.34]) {
    const pot = new THREE.CylinderGeometry(0.1, 0.14, 0.5 + random() * 0.18, 10);
    scaleUv(pot, 0.8);
    pot.translate(x + offset, base + height + 0.38, z);
    ctx.batches.add('brick', pot, matrix, [0.72, 0.42, 0.3]);
  }
}

function addDormer(ctx, x, y, z, matrix, random, stone) {
  const width = 1.46;
  boxAt(ctx, 'plaster', width, 1.62, 1.5, x, y + 0.81, z - 0.76, matrix, [0.34, 0.33, 0.31]);
  const gableShape = new THREE.Shape([new THREE.Vector2(x - width / 2 - 0.12, y + 1.58), new THREE.Vector2(x + width / 2 + 0.12, y + 1.58), new THREE.Vector2(x, y + 2.42)]);
  const gable = new THREE.ExtrudeGeometry(gableShape, { depth: 1.76, bevelEnabled: false, curveSegments: 1 });
  gable.translate(0, 0, z - 1.72);
  ctx.batches.add('slate', scaleUv(gable, 1 / TILE.slate), matrix, [0.52, 0.56, 0.62]);
  coneAt(ctx, 'stone', 0.09, 0.42, x, y + 2.38, z + 0.03, matrix, stone, 6);
  const pane = gothicPoints(x, y + 0.2, 0.88, 1.6, 6);
  ctx.batches.add('stone', extrudeRing(gothicPoints(x, y + 0.14, 1.08, 1.78, 6), pane, 0.1, z - 0.02, TILE.stone), matrix, stone);
  boxAt(ctx, 'iron', 0.03, 1.5, 0.03, x, y + 0.92, z + 0.02, matrix);
  boxAt(ctx, 'iron', 0.86, 0.025, 0.03, x, y + 0.86, z + 0.02, matrix);
  addGlass(ctx, pane, x, y + 1, z + 0.005, matrix, { halfWidth: 1.2, halfHeight: 1.1, depth: 2.2, seed: random(), lit: random() < 0.28 ? 0.8 : 0 });
}

function addRoofAndCrown(ctx, width, height, matrix, wallKey, tint, stone, gabled, random) {
  if (gabled) {
    const rise = Math.min(width * 0.46, 6.2);
    const roofShape = new THREE.Shape([
      new THREE.Vector2(-width / 2, height - 0.2),
      new THREE.Vector2(width / 2, height - 0.2),
      new THREE.Vector2(0, height + rise),
    ]);
    const roof = new THREE.ExtrudeGeometry(roofShape, { depth: DEPTH - 0.8, bevelEnabled: false, curveSegments: 1 });
    roof.translate(0, 0, -DEPTH);
    ctx.batches.add('slate', scaleUv(roof, 1 / TILE.slate), matrix, [0.58, 0.62, 0.68]);

    const gable = new THREE.ExtrudeGeometry(roofShape, { depth: 0.55, bevelEnabled: false, curveSegments: 1 });
    gable.translate(0, 0, -0.55);
    ctx.batches.add(wallKey, scaleUv(gable, 1 / TILE[wallKey]), matrix, tint);
    const gableWindow = gothicPoints(0, height + rise * 0.14, 1.05, rise * 0.48, 6);
    ctx.batches.add('stone', extrudeRing(gothicPoints(0, height + rise * 0.14 - 0.08, 1.27, rise * 0.48 + 0.2, 6), gableWindow, 0.14, -0.04, TILE.stone), matrix, stone);
    addGlass(ctx, gableWindow, 0, height + rise * 0.38, 0.005, matrix, { halfWidth: 1.2, halfHeight: 1.3, depth: 2.5, seed: random(), lit: random() < 0.3 ? 0.7 : 0 });

    const slope = Math.atan2(rise + 0.2, width / 2);
    const length = Math.hypot(width / 2, rise + 0.2) + 0.28;
    for (const side of [-1, 1]) {
      const coping = new THREE.Matrix4()
        .makeRotationZ(side * -slope)
        .setPosition(side * (width / 4), height - 0.1 + (rise + 0.2) / 2 + 0.07, 0.03)
        .premultiply(matrix);
      ctx.batches.add('stone', metricBox(length, 0.2, 0.72, TILE.stone), coping, stone);
      coneAt(ctx, 'stone', 0.17, 1.05, side * (width / 2 - 0.12), height + 0.02, 0.05, matrix, stone);
      const crockets = Math.floor(length / 0.92);
      for (let i = 1; i < crockets; i++) {
        const k = i / crockets;
        coneAt(ctx, 'stone', 0.075, 0.24, side * (width / 2) * (1 - k), height - 0.1 + (rise + 0.2) * k + 0.16, 0.05, matrix, stone, 5);
      }
    }
    coneAt(ctx, 'stone', 0.22, 1.7, 0, height + rise + 0.05, 0.03, matrix, stone);
    addChimney(ctx, width * 0.28, -6.8, height + rise * 0.44, wallKey, tint, stone, matrix, random);
    return;
  }

  boxAt(ctx, 'stone', width + 0.16, 0.22, 0.62, 0, height + 0.03, 0.08, matrix, stone);
  boxAt(ctx, 'stone', width + 0.34, 0.14, 0.82, 0, height + 0.21, 0.1, matrix, stone);
  boxAt(ctx, wallKey, width, 0.86, 0.42, 0, height + 0.7, -0.1, matrix, tint);
  const panels = Math.max(3, Math.round(width / 1.75));
  for (let i = 0; i < panels; i++) {
    const x = -width / 2 + (width / panels) * (i + 0.5);
    const blind = gothicPoints(x, height + 0.36, 0.52, 0.68, 4);
    ctx.batches.add('stone', extrudeRing(gothicPoints(x, height + 0.32, 0.64, 0.76, 4), blind, 0.05, 0.11, TILE.stone), matrix, stone);
  }
  boxAt(ctx, 'stone', width + 0.12, 0.12, 0.62, 0, height + 1.2, -0.08, matrix, stone);
  const finials = Math.max(2, Math.round(width / 3.1));
  for (let i = 0; i <= finials; i++) {
    const x = -width / 2 + 0.2 + ((width - 0.4) * i) / finials;
    boxAt(ctx, 'stone', 0.32, 0.42, 0.32, x, height + 1.45, -0.08, matrix, stone);
    coneAt(ctx, 'stone', 0.16, 0.92, x, height + 1.65, -0.08, matrix, stone);
  }

  const mansard = new THREE.Shape([
    new THREE.Vector2(-0.6, height + 0.1), new THREE.Vector2(-2.3, height + 3.5),
    new THREE.Vector2(-DEPTH + 1.4, height + 3.5), new THREE.Vector2(-DEPTH + 0.2, height + 0.1),
  ]);
  const roof = new THREE.ExtrudeGeometry(mansard, { depth: width - 0.2, bevelEnabled: false, curveSegments: 1 });
  roof.rotateY(-Math.PI / 2);
  roof.translate(width / 2 - 0.1, 0, 0);
  ctx.batches.add('slate', scaleUv(roof, 1 / TILE.slate), matrix, [0.5, 0.54, 0.6]);
  const dormers = Math.max(2, Math.floor(width / 4));
  for (let i = 0; i < dormers; i++) addDormer(ctx, -width / 2 + (width / dormers) * (i + 0.5), height + 1.05, -1.08, matrix, random, stone);
  addChimney(ctx, -width * 0.32, -7.2, height + 3.3, wallKey, tint, stone, matrix, random);
  addChimney(ctx, width * 0.3, -9.4, height + 3.3, wallKey, tint, stone, matrix, random);
}

export function addBuilding(ctx, spec) {
  const { width, floors, wall, tint, seed, gabled, x, z, rotation, escape } = spec;
  const random = seededRandom(seed);
  const matrix = new THREE.Matrix4().makeRotationY(rotation).setPosition(x, 0, z);
  const stone = [0.72 + random() * 0.12, 0.69 + random() * 0.1, 0.62 + random() * 0.09];
  const height = GROUND + (floors - 1) * FLOOR + 0.55;

  const shape = new THREE.Shape([
    new THREE.Vector2(-width / 2, 0), new THREE.Vector2(width / 2, 0),
    new THREE.Vector2(width / 2, height), new THREE.Vector2(-width / 2, height),
  ]);
  const shop = addShopfront(ctx, shape, width, matrix, rotation, random, stone);

  const usable = width - 1.5;
  const bays = Math.max(2, Math.floor(usable / 2.75));
  const spacing = usable / bays;
  const windowWidth = Math.min(1.4, spacing * 0.56);
  const escapeBay = escape ? Math.floor(random() * bays) : -1;
  for (let floor = 1; floor < floors; floor++) {
    const y = GROUND + (floor - 1) * FLOOR + 0.58;
    const windowHeight = floor === floors - 1 ? 2.25 : 2.62;
    for (let bay = 0; bay < bays; bay++) {
      const cx = -usable / 2 + spacing * (bay + 0.5);
      addUpperWindow(ctx, shape, cx, y, windowWidth, windowHeight, matrix, random, stone, floor > 1);
      if (floor === 2 && bay !== escapeBay && random() < 0.34) addBalcony(ctx, cx, y - 0.26, windowWidth, matrix, stone);
    }
    boxAt(ctx, 'stone', width + 0.06, 0.15, 0.26, 0, GROUND + floor * FLOOR - 0.03, 0.08, matrix, stone);
    boxAt(ctx, 'stone', width + 0.02, 0.05, 0.18, 0, GROUND + floor * FLOOR - 0.14, 0.06, matrix, stone);
    for (let bay = 0; bay <= bays; bay++) {
      const pierX = -usable / 2 + spacing * bay;
      boxAt(ctx, wall, 0.34, FLOOR - 0.14, 0.17, pierX, y + FLOOR / 2 - 0.62, 0.075, matrix, tint);
      boxAt(ctx, 'stone', 0.46, 0.15, 0.25, pierX, y + FLOOR - 0.86, 0.11, matrix, stone);
      boxAt(ctx, 'stone', 0.42, 0.12, 0.23, pierX, y - 0.52, 0.1, matrix, stone);
    }
  }

  const facade = new THREE.ExtrudeGeometry(shape, { depth: 0.55, bevelEnabled: false, curveSegments: 1 });
  facade.translate(0, 0, -0.55);
  ctx.batches.add(wall, scaleUv(facade, 1 / TILE[wall]), matrix, tint);
  const coreTint = tint.map((v) => v * 0.72);
  if (shop.open) {
    const roomHalf = shop.shopWidth / 2 + 0.12;
    addHollowCore(ctx, wall, width, height, roomHalf, matrix, coreTint);
    ctx.shops.push({ matrix, pane: shop.pane, kind: shop.kind, seed: shop.seed, roomHalf });
  } else {
    boxAt(ctx, wall, width, height, DEPTH - 0.55, 0, height / 2, -(DEPTH + 0.55) / 2, matrix, coreTint);
  }
  addQuoins(ctx, width, height, matrix, stone);
  addCornice(ctx, width, height, matrix, stone);
  addDrainpipe(ctx, (random() > 0.5 ? 1 : -1) * (width / 2 - 0.16), height, matrix);
  if (escapeBay >= 0) addFireEscape(ctx, -usable / 2 + spacing * (escapeBay + 0.5), floors, matrix);
  addRoofAndCrown(ctx, width, height, matrix, wall, tint, stone, gabled, random);
  ctx.colliders.box(width, height + 2, DEPTH, 0, (height + 2) / 2, -DEPTH / 2, matrix);

  const lightPosition = shop.open ? new THREE.Vector3(0, 2.7, 1.25).applyMatrix4(matrix) : null;
  return { matrix, height, lightPosition };
}

function addPortal(ctx, cx, width, height, matrix, stone, rings) {
  for (let i = 0; i < rings; i++) {
    const inset = i * 0.24;
    const ringWidth = width + 1.8 - inset * 2;
    const ringHeight = height + 2 - inset * 1.7;
    ctx.batches.add('stone', extrudeRing(
      gothicPoints(cx, 0, ringWidth, ringHeight),
      gothicPoints(cx, 0, ringWidth - 0.3, ringHeight - 0.26),
      0.36 + (rings - i) * 0.14,
      -0.28 - i * 0.05,
      TILE.stone,
    ), matrix, stone.map((v) => v * (i % 2 ? 0.86 : 1.02)));
    for (const side of [-1, 1]) {
      const columnX = cx + side * (ringWidth / 2 - 0.15);
      cylinderAt(ctx, 'stone', 0.105, ringHeight * 0.52, columnX, 0.3, 0.16 - i * 0.05, matrix, stone, 10);
      boxAt(ctx, 'stone', 0.34, 0.3, 0.34, columnX, 0.15, 0.16 - i * 0.05, matrix, stone);
      coneAt(ctx, 'stone', 0.2, 0.2, columnX, ringHeight * 0.52 + 0.28, 0.16 - i * 0.05, matrix, stone, 8);
    }
  }
  const spring = height - width * Math.sin(Math.PI / 3);
  const tympanum = new THREE.Shape(gothicPoints(cx, spring, width, height - spring));
  const plate = new THREE.ExtrudeGeometry(tympanum, { depth: 0.1, bevelEnabled: false, curveSegments: 1 });
  plate.translate(0, 0, -0.74);
  ctx.batches.add('stone', scaleUv(plate, 1 / TILE.stone), matrix, stone.map((v) => v * 0.86));
  const figures = Math.max(3, Math.round(width * 1.15));
  for (let i = 0; i < figures; i++) {
    const fx = cx - width * 0.32 + (width * 0.64 * i) / (figures - 1);
    const figureHeight = (height - spring) * (0.34 + 0.22 * (1 - Math.abs((i / (figures - 1)) * 2 - 1)));
    cylinderAt(ctx, 'stone', 0.1, figureHeight, fx, spring + 0.12, -0.64, matrix, stone, 8);
    coneAt(ctx, 'stone', 0.12, 0.2, fx, spring + 0.12 + figureHeight, -0.64, matrix, stone, 8);
  }
}

export function addCathedral(ctx, z) {
  const matrix = new THREE.Matrix4().makeTranslation(0, 0, z);
  const stone = [0.68, 0.66, 0.62];
  const dark = stone.map((v) => v * 0.78);
  const width = 18;
  const height = 27;
  const shape = new THREE.Shape(gothicPoints(0, 0, width, height + 9, 2));

  const portal = gothicPoints(0, 0, 4.6, 8.8);
  const portals = [-5.9, 5.9].map((x) => gothicPoints(x, 0, 2.7, 5.9));
  const rose = circlePoints(0, 20.2, 3.25, 48);
  shape.holes.push(new THREE.Path(portal), new THREE.Path(rose), ...portals.map((points) => new THREE.Path(points)));
  const body = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false, curveSegments: 1 });
  body.translate(0, 0, -1.2);
  ctx.batches.add('stone', scaleUv(body, 1 / TILE.stone), matrix, stone);
  boxAt(ctx, 'stone', width + 12, height + 9, 24, 0, (height + 9) / 2, -13.2, matrix, [0.34, 0.34, 0.34]);

  addPortal(ctx, 0, 4.6, 8.8, matrix, stone, 5);
  for (const x of [-5.9, 5.9]) addPortal(ctx, x, 2.7, 5.9, matrix, stone, 3);
  ctx.props.place('door', { x: 0, y: 0.02, z: z - 0.98, scale: [2.2, 2.42, 1.2], solid: false });
  for (const x of [-5.9, 5.9]) ctx.props.place('door', { x, y: 0.02, z: z - 0.98, scale: [1.28, 1.42, 0.9], solid: false });
  for (let step = 0; step < 4; step++) boxAt(ctx, 'stone', 20 - step * 0.5, 0.17, 2.3 - step * 0.46, 0, 0.085 + step * 0.17, 1.15 - step * 0.23, matrix, stone);

  boxAt(ctx, 'stone', width + 0.2, 0.28, 0.72, 0, 11.3, 0.3, matrix, stone);
  boxAt(ctx, 'stone', width + 0.1, 0.13, 0.5, 0, 11.05, 0.2, matrix, stone);
  const niches = 9;
  for (let i = 0; i < niches; i++) {
    const nx = -7.2 + (14.4 * i) / (niches - 1);
    const niche = gothicPoints(nx, 11.45, 1.16, 3.3, 6);
    const recess = new THREE.ExtrudeGeometry(new THREE.Shape(niche), { depth: 0.04, bevelEnabled: false, curveSegments: 1 });
    recess.translate(0, 0, 0.01);
    ctx.batches.add('stone', scaleUv(recess, 1 / TILE.stone), matrix, dark.map((v) => v * 0.58));
    ctx.batches.add('stone', extrudeRing(gothicPoints(nx, 11.38, 1.46, 3.58, 6), niche, 0.36, 0.0, TILE.stone), matrix, stone);
    coneAt(ctx, 'stone', 0.14, 0.72, nx, 15.05, 0.17, matrix, stone, 6);
    ctx.props.place('statue', { x: nx, y: 11.46, z: z + 0.42, scale: 0.92, solid: false });
  }
  boxAt(ctx, 'stone', width + 0.2, 0.26, 0.64, 0, 15.75, 0.26, matrix, stone);

  ctx.batches.add('stone', extrudeRing(circlePoints(0, 20.2, 4.1, 48), circlePoints(0, 20.2, 3.22, 48), 0.5, -0.2, TILE.stone), matrix, stone);
  ctx.batches.add('stone', extrudeRing(circlePoints(0, 20.2, 4.42, 48), circlePoints(0, 20.2, 4.14, 48), 0.3, -0.1, TILE.stone), matrix, dark);
  ctx.batches.add('stone', extrudeRing(circlePoints(0, 20.2, 1.02, 24), circlePoints(0, 20.2, 0.82, 24), 0.2, -0.82, TILE.stone), matrix, stone);
  ctx.batches.add('stone', extrudeRing(circlePoints(0, 20.2, 2.18, 36), circlePoints(0, 20.2, 2.03, 36), 0.18, -0.81, TILE.stone), matrix, stone);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    beam(ctx, 'stone', new THREE.Vector3(c * 0.9, 20.2 + s * 0.9, -0.72), new THREE.Vector3(c * 3.2, 20.2 + s * 3.2, -0.72), 0.13, matrix, stone);
    const bead = new THREE.SphereGeometry(0.14, 8, 6);
    bead.translate(c * 4.28, 20.2 + s * 4.28, 0.25);
    ctx.batches.add('stone', bead, matrix, stone);
  }

  const roseGlass = new THREE.ShapeGeometry(new THREE.Shape(rose)).toNonIndexed();
  const local = new Float32Array(roseGlass.attributes.position.count * 2);
  for (let i = 0; i < roseGlass.attributes.position.count; i++) {
    local[i * 2] = roseGlass.attributes.position.getX(i);
    local[i * 2 + 1] = roseGlass.attributes.position.getY(i) - 20.2;
  }
  roseGlass.setAttribute('aLocal', new THREE.BufferAttribute(local, 2));
  roseGlass.translate(0, 0, -0.92);
  roseGlass.applyMatrix4(matrix);
  roseGlass.deleteAttribute('uv');
  ctx.stained.push(roseGlass);

  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 4; tier++) {
      const buttressHeight = 30 - tier * 6.5;
      const depth = 0.75 + tier * 0.46;
      boxAt(ctx, 'stone', 1.05 - tier * 0.06, buttressHeight, depth, side * 8.85, buttressHeight / 2, depth / 2, matrix, stone);
      boxAt(ctx, 'stone', 1.2 - tier * 0.06, 0.2, depth + 0.14, side * 8.85, buttressHeight, depth / 2, matrix, stone);
    }
    coneAt(ctx, 'stone', 0.52, 3.6, side * 8.85, 30.1, 0.36, matrix, stone);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      coneAt(ctx, 'stone', 0.14, 1.1, side * 8.85 + Math.cos(angle) * 0.46, 30.1, 0.36 + Math.sin(angle) * 0.46, matrix, stone, 5);
    }

    const towerX = side * 12.4;
    boxAt(ctx, 'stone', 7, 44, 7, towerX, 22, -2.7, matrix, stone);
    for (const level of [10.6, 21, 31.4, 43.7]) {
      boxAt(ctx, 'stone', 7.56, 0.3, 7.56, towerX, level, -2.7, matrix, stone);
      boxAt(ctx, 'stone', 7.3, 0.14, 7.3, towerX, level - 0.21, -2.7, matrix, stone);
      const blocks = 26;
      for (let i = 0; i < blocks; i++) boxAt(ctx, 'stone', 0.13, 0.15, 0.2, towerX - 3.6 + (7.2 * i) / (blocks - 1), level - 0.38, 0.86, matrix, stone);
    }
    for (const a of [-1, 1]) {
      boxAt(ctx, 'stone', 0.82, 44, 0.82, towerX + a * 3.4, 22, 0.56, matrix, stone);
      coneAt(ctx, 'stone', 0.56, 4.4, towerX + a * 3.4, 44, 0.56, matrix, stone);
      for (const b of [-1, 1]) coneAt(ctx, 'stone', 0.5, 4.2, towerX + a * 3.25, 44, -2.7 + b * 3.25, matrix, stone);
    }
    for (const [level, tall] of [[12.2, 7.2], [22.5, 7.2], [32.8, 9.2]]) {
      for (const offset of [-1.42, 1.42]) {
        const opening = gothicPoints(towerX + offset, level, 1.72, tall);
        ctx.batches.add('stone', extrudeRing(gothicPoints(towerX + offset, level - 0.08, 2.08, tall + 0.3), opening, 0.26, 0.72, TILE.stone), matrix, stone);
        const pane = new THREE.ExtrudeGeometry(new THREE.Shape(opening), { depth: 0.02, bevelEnabled: false, curveSegments: 1 });
        pane.translate(0, 0, 0.74);
        ctx.batches.add('stone', scaleUv(pane, 1 / TILE.stone), matrix, dark.map((v) => v * 0.42));
        addTracery(ctx, towerX + offset, level + 0.12, 1.54, tall - 0.26, new THREE.Matrix4().makeTranslation(0, 0, 1.12).premultiply(matrix), stone);
        ctx.glass.push(makeTowerPane(towerX + offset, level, tall, matrix));
      }
    }
    const spire = new THREE.ConeGeometry(4.65, 27, 8);
    scaleUv(spire, 8);
    spire.translate(towerX, 57.5, -2.7);
    ctx.batches.add('slate', spire, matrix, [0.55, 0.58, 0.62]);
    for (let band = 1; band < 7; band++) {
      const y = 44 + band * 3.7;
      const radius = 4.65 * (1 - (y - 44) / 27) + 0.05;
      for (let i = 0; i < 8; i++) {
        const angle = ((i + 0.5) / 8) * Math.PI * 2;
        coneAt(ctx, 'stone', 0.13, 0.42, towerX + Math.sin(angle) * radius, y, -2.7 + Math.cos(angle) * radius, matrix, stone, 5);
      }
    }
  }

  const coping = Math.atan2(9 + height - (height + 9 - width * Math.sin(Math.PI / 3)), width / 2);
  for (const side of [-1, 1]) {
    const start = new THREE.Vector3(side * 8.5, height + 9 - width * Math.sin(Math.PI / 3) + 1, 0.12);
    const end = new THREE.Vector3(0, height + 9.15, 0.12);
    beam(ctx, 'stone', start, end, 0.42, matrix, stone);
    for (let i = 1; i < 16; i++) {
      const k = i / 16;
      coneAt(ctx, 'stone', 0.14, 0.42, start.x * (1 - k), start.y + (end.y - start.y) * k + 0.14, 0.14, matrix, stone, 5);
    }
  }
  if (coping) {
    boxAt(ctx, 'stone', 0.16, 1.5, 0.16, 0, height + 10, 0.12, matrix, stone);
    boxAt(ctx, 'stone', 0.82, 0.14, 0.14, 0, height + 10.3, 0.12, matrix, stone);
  }
  ctx.colliders.box(46, 44, 30, 0, 22, -15, matrix);
  ctx.colliders.box(20, 0.7, 2.4, 0, 0.35, 1.15, matrix);
}

function makeTowerPane(cx, y, tall, matrix) {
  const stub = { glass: [] };
  addGlass(stub, gothicPoints(cx, y + 0.06, 1.6, tall - 0.14), cx, y + tall / 2, 0.8, matrix, {
    halfWidth: 1.8,
    halfHeight: tall / 2,
    depth: 3,
    seed: Math.abs(cx * y) % 1,
    lit: y < 13 ? 0.3 : 0,
  });
  return stub.glass[0];
}
