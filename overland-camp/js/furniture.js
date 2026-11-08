// Shared camp furniture: tubular canvas chairs and slatted timber tables.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { makeSaggingCanvasGeometry } from './geo.js';

/**
 * Folding camp chair — tubular frame, sagging canvas sling and timber arms.
 */
export function createCampChair({ canvasMat, frameMat, woodMat }) {
  const chair = new THREE.Group();
  const seatY = 0.42;
  const tube = (len, r = 0.014) => new THREE.CylinderGeometry(r, r, len, 8);

  [-0.225, 0.225].forEach((x) => {
    const front = new THREE.Mesh(tube(seatY + 0.02), frameMat);
    front.position.set(x, (seatY + 0.02) * 0.5, 0.2);
    front.rotation.x = -0.09;
    front.castShadow = true;
    chair.add(front);

    const rear = new THREE.Mesh(tube(seatY + 0.02), frameMat);
    rear.position.set(x, (seatY + 0.02) * 0.5, -0.2);
    rear.rotation.x = 0.09;
    rear.castShadow = true;
    chair.add(rear);

    const upright = new THREE.Mesh(tube(0.52), frameMat);
    upright.position.set(x, seatY + 0.22, -0.28);
    upright.rotation.x = 0.26;
    upright.castShadow = true;
    chair.add(upright);

    [0.21, -0.21].forEach((z) => {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 6), frameMat);
      foot.position.set(x, 0.012, z);
      chair.add(foot);
    });
  });

  [-0.225, 0.225].forEach((x) => {
    const brace = new THREE.Mesh(tube(0.46, 0.011), frameMat);
    brace.position.set(x, 0.16, 0);
    brace.rotation.x = Math.PI * 0.5;
    chair.add(brace);
  });
  const spine = new THREE.Mesh(tube(0.44, 0.011), frameMat);
  spine.position.set(0, 0.16, 0);
  spine.rotation.z = Math.PI * 0.5;
  chair.add(spine);

  const seat = new THREE.Mesh(makeSaggingCanvasGeometry(0.46, 0.42, 0.075, 10, 8), canvasMat);
  seat.rotation.x = -Math.PI * 0.5;
  seat.position.y = seatY;
  seat.castShadow = true;
  seat.receiveShadow = true;
  chair.add(seat);

  const back = new THREE.Mesh(makeSaggingCanvasGeometry(0.44, 0.42, 0.055, 10, 8), canvasMat);
  back.position.set(0, seatY + 0.34, -0.34);
  back.rotation.x = 0.26;
  back.castShadow = true;
  chair.add(back);

  [-0.26, 0.26].forEach((x) => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.026, 0.42, 2, 0.012), woodMat);
    arm.position.set(x, seatY + 0.19, -0.03);
    arm.castShadow = true;
    chair.add(arm);
  });

  return chair;
}

/**
 * Slatted timber camp table with crossed legs.
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
    rail.position.set(0, height - 0.035, s * depth * 0.34);
    table.add(rail);
  });

  // Crossed legs
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, height, 8), frameMat);
      leg.position.set(sx * (width * 0.42), height * 0.5, sz * depth * 0.32);
      leg.rotation.z = -sx * 0.07;
      leg.castShadow = true;
      table.add(leg);
    });
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, depth * 0.72, 7), frameMat);
    brace.position.set(sx * (width * 0.42), height * 0.42, 0);
    brace.rotation.x = Math.PI * 0.5;
    table.add(brace);
  });

  return table;
}
