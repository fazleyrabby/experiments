// Shared camp furniture: director-style canvas chairs, slatted timber tables,
// a folding cot and a few small lathe-turned pieces for the table top.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const _up = new THREE.Vector3(0, 1, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Cylinder running from point a to point b. */
export function tubeBetween(a, b, r, mat, seg = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(_up, dir.normalize());
  return m;
}

/**
 * Canvas sling: a band with real thickness that sags between two rails.
 * Spans X (rail to rail), sags in -Y, runs `length` along Z (centred).
 */
export function slingGeometry(span, length, sag, thick = 0.008, seg = 18) {
  const top = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const q = u * 2 - 1;
    top.push([-span / 2 + span * u, -sag * (1 - q * q)]);
  }
  const shape = new THREE.Shape();
  shape.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i < top.length; i++) shape.lineTo(top[i][0], top[i][1]);
  for (let i = top.length - 1; i >= 0; i--) shape.lineTo(top[i][0], top[i][1] - thick);
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, steps: 1 });
  g.translate(0, 0, -length / 2);
  // Extrude UVs are in metres; tighten them so the canvas weave reads fine
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3.2, uv.getY(i) * 3.2);
  g.computeVertexNormals();
  return g;
}

/** Soft, puffy cushion: thick in the middle, pinched at the seams. */
export function makePillowGeometry(w, h, d, seg = 12) {
  const g = new THREE.BoxGeometry(w, h, d, seg, 3, seg);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (w / 2);
    const z = pos.getZ(i) / (d / 2);
    const f = (1 - Math.pow(Math.abs(x), 4)) * (1 - Math.pow(Math.abs(z), 4));
    pos.setY(i, pos.getY(i) * (0.22 + 0.78 * f));
    // seams pull the edges in a touch
    pos.setX(i, pos.getX(i) * (1 - 0.06 * (1 - Math.abs(z))));
    pos.setZ(i, pos.getZ(i) * (1 - 0.05 * (1 - Math.abs(x))));
  }
  g.computeVertexNormals();
  return g;
}

/** Lathe from [radius, y] pairs. */
export function lathe(points, seg = 20) {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

/**
 * Director-style folding camp chair. Front faces +Z, seat centred on origin.
 * Tubular frame with scissor braces front and back, a thick canvas sling that
 * wraps the seat rails, a raked canvas back band and timber arm rests.
 */
export function createCampChair({ canvasMat, frameMat, woodMat }) {
  const chair = new THREE.Group();
  const R = 0.012;
  const hx = 0.25;       // side frames
  const seatY = 0.43;
  const armY = 0.625;    // top of the legs, under the arm rests
  const zf = 0.2;
  const zb = -0.19;
  const backTop = V(0, 0.98, zb - 0.1);
  const fabricMat = canvasMat.side === THREE.DoubleSide ? canvasMat : canvasMat.clone();
  fabricMat.side = THREE.DoubleSide;

  const put = (m, cast = true) => {
    m.castShadow = cast;
    m.receiveShadow = true;
    chair.add(m);
    return m;
  };
  const knuckle = (p, r = R * 1.35) => {
    const k = put(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), frameMat), false);
    k.position.copy(p);
  };

  const railX = hx - 0.022;
  [-1, 1].forEach((s) => {
    const x = s * hx;
    const fTop = V(x, armY, zf);
    const bTop = V(x, armY, zb);
    const uTop = V(x, backTop.y, backTop.z);

    // Legs, and the rear leg carries on up as the raked back upright
    put(tubeBetween(V(x, 0.014, zf + 0.025), fTop, R, frameMat));
    put(tubeBetween(V(x, 0.014, zb - 0.025), bTop, R, frameMat));
    put(tubeBetween(bTop, uTop, R, frameMat));
    knuckle(bTop);
    knuckle(uTop, R * 1.25);

    // Side stretcher low down, and the seat rail the sling wraps around
    put(tubeBetween(V(x, 0.11, zf + 0.018), V(x, 0.11, zb - 0.018), R * 0.85, frameMat), false);
    put(tubeBetween(V(s * railX, seatY, zf + 0.004), V(s * railX, seatY, zb - 0.004), R, frameMat), false);
    // Rail brackets back to the legs
    [zf, zb].forEach((z) => {
      put(tubeBetween(V(s * railX, seatY, z), V(x, seatY, z), R * 0.9, frameMat), false);
      knuckle(V(x, seatY, z), R * 1.3);
    });

    // Rubber feet
    [zf + 0.025, zb - 0.025].forEach((z) => {
      const foot = put(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.5, R * 1.7, 0.026, 10), frameMat), false);
      foot.position.set(x, 0.013, z);
    });

    // Timber arm rest sitting on the leg tops
    const arm = put(new THREE.Mesh(new RoundedBoxGeometry(0.056, 0.026, 0.5, 2, 0.01), woodMat));
    arm.position.set(x + s * 0.004, armY + 0.013 + R * 0.6, (zf + zb) * 0.5 + 0.03);

    // Canvas sleeve wrapped round the seat rail
    const sleeve = put(tubeBetween(V(s * railX, seatY, zf - 0.01), V(s * railX, seatY, zb + 0.01), R + 0.007, fabricMat, 10), false);
    sleeve.receiveShadow = true;
  });

  // Scissor braces front and back (this is how it folds)
  [zf, zb].forEach((z) => {
    put(tubeBetween(V(-hx, 0.07, z), V(hx, seatY - 0.02, z), R * 0.8, frameMat), false);
    put(tubeBetween(V(hx, 0.07, z), V(-hx, seatY - 0.02, z), R * 0.8, frameMat), false);
    const pivot = put(new THREE.Mesh(new THREE.CylinderGeometry(R * 1.2, R * 1.2, 0.012, 10), frameMat), false);
    pivot.rotation.x = Math.PI * 0.5;
    pivot.position.set(0, (0.07 + seatY - 0.02) * 0.5, z);
  });

  // Seat sling: wraps the rails, sags where you sit
  const seatLen = zf - zb - 0.02;
  const seat = put(new THREE.Mesh(slingGeometry(railX * 2, seatLen, 0.045, 0.009), fabricMat));
  seat.position.set(0, seatY + R + 0.002, (zf + zb) * 0.5);

  // Back band between the raked uprights, bowing away from the sitter
  const bandLen = 0.24;
  const rakeDir = V(0, backTop.y - armY, backTop.z - zb).normalize();
  const bandMid = V(0, armY, zb).addScaledVector(rakeDir, (backTop.y - armY) / rakeDir.y - bandLen * 0.5 - 0.02);
  const backGeo = slingGeometry(hx * 2, bandLen, 0.04, 0.009);
  backGeo.rotateX(Math.PI * 0.5);
  const back = put(new THREE.Mesh(backGeo, fabricMat));
  back.position.copy(bandMid);
  back.rotation.x = -Math.atan2(zb - backTop.z, backTop.y - armY);
  [-1, 1].forEach((s) => {
    const a = V(s * hx, 0, 0).add(bandMid).addScaledVector(rakeDir, -bandLen * 0.5);
    const b = V(s * hx, 0, 0).add(bandMid).addScaledVector(rakeDir, bandLen * 0.5);
    put(tubeBetween(a, b, R + 0.007, fabricMat, 10), false);
  });

  return chair;
}

/**
 * Slatted timber camp table on splayed legs with end stretchers.
 */
export function createSlattedTable({
  woodMat,
  frameMat,
  width = 0.94,
  depth = 0.62,
  height = 0.58,
  slats = 5
}) {
  const table = new THREE.Group();

  // Individual slats with gaps so the top reads as timber, not a slab
  const slatDepth = (depth - (slats - 1) * 0.012) / slats;
  for (let i = 0; i < slats; i++) {
    const slat = new THREE.Mesh(new RoundedBoxGeometry(width, 0.035, slatDepth, 2, 0.008), woodMat);
    slat.position.set(0, height, -depth * 0.5 + slatDepth * 0.5 + i * (slatDepth + 0.012));
    slat.castShadow = true;
    slat.receiveShadow = true;
    table.add(slat);
  }

  // Rails under the slats
  [-1, 1].forEach((s) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(width * 0.94, 0.05, 0.03, 2, 0.008), frameMat);
    rail.position.set(0, height - 0.042, s * depth * 0.34);
    table.add(rail);
  });

  // Splayed legs meeting the rails, with an end stretcher and a long one
  const top = height - 0.06;
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const a = V(sx * width * 0.4, top, sz * depth * 0.34);
      const b = V(sx * width * 0.44, 0.012, sz * depth * 0.37);
      const leg = tubeBetween(b, a, 0.017, frameMat);
      leg.castShadow = true;
      table.add(leg);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.024, 10), frameMat);
      foot.position.copy(b);
      table.add(foot);
    });
    table.add(tubeBetween(
      V(sx * width * 0.425, height * 0.3, -depth * 0.355),
      V(sx * width * 0.425, height * 0.3, depth * 0.355), 0.012, frameMat));
  });
  table.add(tubeBetween(V(-width * 0.425, height * 0.3, 0), V(width * 0.425, height * 0.3, 0), 0.011, frameMat));

  return table;
}

/**
 * Folding expedition cot: tubular side rails with the canvas bed wrapped round
 * them, bow legs, a puffy sleeping bag, pillow and a blanket over the foot.
 * Long axis is Z, head at -Z.
 */
export function createCampCot({ canvasMat, frameMat, bagMat, pillowMat, blanketMat }) {
  const cot = new THREE.Group();
  const R = 0.016;
  const hx = 0.4;
  const hl = 0.94;
  const bedY = 0.36;
  const fabricMat = canvasMat.side === THREE.DoubleSide ? canvasMat : canvasMat.clone();
  fabricMat.side = THREE.DoubleSide;

  const put = (m, cast = true) => {
    m.castShadow = cast;
    m.receiveShadow = true;
    cot.add(m);
    return m;
  };

  // Side rails + end bars
  [-1, 1].forEach((s) => {
    put(tubeBetween(V(s * hx, bedY, -hl), V(s * hx, bedY, hl), R, frameMat));
    put(tubeBetween(V(s * hx, bedY, -hl + 0.04), V(s * hx, bedY, hl - 0.04), R + 0.008, fabricMat, 10), false);
  });
  [-1, 1].forEach((s) => {
    put(tubeBetween(V(-hx, bedY - 0.02, s * hl), V(hx, bedY - 0.02, s * hl), R * 0.9, frameMat), false);
  });

  // Bow legs: a bent tube from rail to rail that touches the floor
  [-0.72, 0, 0.72].forEach((z) => {
    const curve = new THREE.CatmullRomCurve3([
      V(-hx, bedY - 0.01, z),
      V(-hx * 0.96, bedY * 0.45, z),
      V(-hx * 0.78, 0.022, z),
      V(0, 0.08, z),
      V(hx * 0.78, 0.022, z),
      V(hx * 0.96, bedY * 0.45, z),
      V(hx, bedY - 0.01, z)
    ]);
    put(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, R * 0.85, 8, false), frameMat));
  });

  // Canvas bed
  const bed = put(new THREE.Mesh(slingGeometry(hx * 2, hl * 2 - 0.08, 0.035, 0.01), fabricMat));
  bed.position.set(0, bedY + R + 0.004, 0);

  // Sleeping bag, pillow, blanket
  const bag = put(new THREE.Mesh(makePillowGeometry(0.66, 0.16, 1.5, 16), bagMat));
  bag.position.set(0.01, bedY + 0.04, 0.1);
  bag.rotation.y = 0.02;

  const pillow = put(new THREE.Mesh(makePillowGeometry(0.48, 0.13, 0.3), pillowMat));
  pillow.position.set(-0.02, bedY + 0.085, -0.72);
  pillow.rotation.set(-0.12, 0.08, 0);

  // Blanket folded over the foot, hanging down both sides
  const bw = 1.28;
  const bl = 0.62;
  const bGeo = new THREE.PlaneGeometry(bw, bl, 48, 18);
  bGeo.rotateX(-Math.PI * 0.5);
  const bp = bGeo.attributes.position;
  const topY = 0.1;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i);
    const z = bp.getZ(i);
    const ax = Math.abs(x);
    const edge = 0.36;
    let y = topY * (1 - Math.pow(Math.min(ax / edge, 1), 6) * 0.35);
    let nx = x;
    if (ax > edge) {
      // roll over the rail, then hang straight down outside it
      const over = ax - edge;
      nx = Math.sign(x) * (edge + Math.min(over, 0.06) * 1.1 + Math.max(over - 0.06, 0) * 0.06);
      y = topY * 0.65 - over * 0.95;
    }
    y += Math.sin(z * 23 + x * 4) * 0.006 + Math.sin(x * 17) * 0.004;
    bp.setXYZ(i, nx, y, z);
  }
  bGeo.computeVertexNormals();
  const blanketDS = blanketMat.clone();
  blanketDS.side = THREE.DoubleSide;
  const blanket = put(new THREE.Mesh(bGeo, blanketDS));
  blanket.position.set(0, bedY + 0.02, 0.52);

  return cot;
}
