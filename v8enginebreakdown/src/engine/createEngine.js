import * as THREE from 'three';
import { createResources } from './resources.js';
import { batchStaticDetail } from './batch.js';
import { bankDirection, CRANK_RADIUS, ROD_LENGTH, THROW_PHASES, CYLINDER_Z, CRANK_Y, updateMechanism } from './mechanics.js';

export const COMPONENTS = {
  intake: { title: 'Intake manifold', description: 'Eight curved runners carry intake air into the two cylinder banks.' },
  covers: { title: 'Valve covers', description: 'Ribbed aluminum covers protect the valve gear above each bank.' },
  heads: { title: 'Cylinder heads', description: 'The cylinder heads contain the combustion chambers and valve gear.' },
  block: { title: 'Engine block', description: 'Two banks of four machined cylinder bores meet at a 90° angle.' },
  pistons: { title: 'Pistons & connecting rods', description: 'Eight pistons turn reciprocating motion into rotation through fixed-length rods.' },
  crank: { title: 'Cross-plane crankshaft', description: 'Four offset crank throws, each shared by two connecting rods.' },
  exhaust: { title: 'Exhaust manifolds', description: 'Four copper-toned runners on each bank merge into a collector.' },
  pan: { title: 'Oil pan', description: 'The ribbed sump holds lubricating oil below the crankcase.' },
};

export function createEngine() {
  const r = createResources();
  const root = new THREE.Group();
  root.name = 'Procedural V8 engine';
  const parts = [];
  const groups = Object.fromEntries(Object.keys(COMPONENTS).map(key => [key, []]));
  function part(name, category, offset, order) {
    const group = new THREE.Group();
    group.name = name;
    group.userData.category = category;
    root.add(group);
    groups[category]?.push(group);
    parts.push({ object: group, origin: group.position.clone(), offset: new THREE.Vector3(...offset), order });
    return group;
  }

  const caseGroup = part('Crankcase', 'block', [0, .12, -.45], .5);
  r.box(caseGroup, [.19, 1.12, 5.85], [-1.13, -.13, 0], 'cast');
  r.box(caseGroup, [.19, 1.12, 5.85], [1.13, -.13, 0], 'cast');
  r.box(caseGroup, [2.5, .16, 5.96], [0, -.75, 0], 'cast');
  // Shaped crankcase ends with a real aperture rather than an opaque cube.
  const caseShape = new THREE.Shape();
  caseShape.moveTo(-1.24, -.7); caseShape.lineTo(1.24, -.7);
  caseShape.lineTo(1.24, .36); caseShape.lineTo(.82, .8);
  caseShape.lineTo(-.82, .8); caseShape.lineTo(-1.24, .36); caseShape.closePath();
  const caseHole = new THREE.Path(); caseHole.absarc(0, CRANK_Y, .65, 0, Math.PI * 2, true); caseShape.holes.push(caseHole);
  const caseGeo = r.custom('crankcase-ends', () => new THREE.ExtrudeGeometry(caseShape, { depth: .15, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 2, steps: 1, curveSegments: 32 }));
  [-2.92, 2.77].forEach(z => {
    r.mesh(caseGeo, 'cast', caseGroup, [0, 0, z]);
    for (const x of [-1, 1]) for (const y of [-.48, .27]) r.bolt(caseGroup, [x, y, z + (z > 0 ? .2 : -.04)], [0, 0, z > 0 ? 1 : -1]);
  });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) r.box(caseGroup, [.12, .88, .11], [side * 1.25, -.12, -2.56 + i * .64], 'cast', .018);
    for (let i = 0; i < 5; i++) r.bolt(caseGroup, [side * 1.27, .1, -2.65 + i * 1.32], [side, 0, 0]);
  }

  const deckShape = new THREE.Shape();
  const hw = .72, hl = 2.83;
  deckShape.moveTo(-hw, -hl); deckShape.lineTo(hw, -hl); deckShape.lineTo(hw, hl); deckShape.lineTo(-hw, hl); deckShape.closePath();
  CYLINDER_Z.forEach(z => { const hole = new THREE.Path(); hole.absarc(0, z, .505, 0, 2 * Math.PI, true); deckShape.holes.push(hole); });
  const bankGeo = r.custom('bored-bank', () => {
    const g = new THREE.ExtrudeGeometry(deckShape, { depth: 1.76, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 2, curveSegments: 36 });
    g.rotateX(Math.PI / 2);
    return g;
  });
  const linerGeo = r.custom('open-cylinder-liner', () => new THREE.CylinderGeometry(.497, .497, 1.7, 40, 1, true));

  for (const side of [-1, 1]) {
    const n = bankDirection(side);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const zShift = side * .105;
    const bank = part(`${side < 0 ? 'Left' : 'Right'} cylinder bank`, 'block', [side * 2.8, .28, 0], .64);
    bank.position.set(0, CRANK_Y, zShift); bank.quaternion.copy(q);
    r.mesh(bankGeo, 'cast', bank, [0, 2.97, 0]);
    CYLINDER_Z.forEach(z => {
      r.mesh(linerGeo, 'bore', bank, [0, 2.08, z]);
      const rim = r.ring(bank, .506, .027, [0, 3.0, z], 'machined'); rim.rotation.x = -Math.PI / 2;
      for (const x of [-.59, .59]) r.bolt(bank, [x, 3.01, z]);
    });
    for (const x of [-.73, .73]) {
      r.box(bank, [.11, .22, 5.69], [x, 2.92, 0], 'machined', .025);
      r.box(bank, [.1, .16, 5.7], [x, 1.3, 0], 'cast', .02);
      for (let i = 0; i < 9; i++) r.box(bank, [.09, 1.5, .065], [x, 2.1, -2.66 + i * .66], 'cast', .015);
    }
    for (const z of [-2.9, 2.9]) {
      r.box(bank, [1.2, 1.35, .13], [0, 2.1, z], 'cast');
      for (const x of [-.42, .42]) r.bolt(bank, [x, 2.16, z + Math.sign(z) * .08], [0, 0, Math.sign(z)]);
      const plug = r.cylinder(bank, .18, .04, [0, 1.65, z + Math.sign(z) * .08], 'brass'); plug.rotation.x = Math.PI / 2;
    }

    const head = part(`${side < 0 ? 'Left' : 'Right'} cylinder head`, 'heads', [side * 1.65, 1.65, 0], .3);
    head.position.copy(bank.position); head.quaternion.copy(q);
    r.box(head, [1.57, .12, 5.82], [0, 3.12, 0], 'steel', .03);
    r.box(head, [1.49, .44, 5.72], [0, 3.39, 0], 'aluminum', .07);
    r.box(head, [1.56, .065, 5.8], [0, 3.65, 0], 'machined', .022);
    CYLINDER_Z.forEach(z => {
      // Valve springs and rocker bridges become visible when the covers lift.
      for (const x of [-.35, .35]) {
        r.cylinder(head, .06, .43, [x, 3.84, z], 'steel', 16);
        for (let i = 0; i < 5; i++) {
          const spring = r.ring(head, .12, .024, [x, 3.72 + i * .058, z], 'steel'); spring.rotation.x = Math.PI / 2;
        }
        r.cylinder(head, .145, .065, [x, 4.01, z], 'machined');
        r.box(head, [.21, .13, .48], [x, 4.07, z], 'steel', .04);
        r.bolt(head, [x, 4.16, z], [0, 1, 0], .8);
      }
      for (const x of [-.68, .68]) r.bolt(head, [x, 3.64, z]);
      // Port flanges on both edges of the head.
      for (const x of [-.79, .79]) {
        r.box(head, [.08, .34, .56], [x, 3.4, z], 'machined', .025);
        const port = r.cylinder(head, .15, .09, [x + Math.sign(x) * .02, 3.4, z], 'black'); port.rotation.z = Math.PI / 2;
      }
    });

    const cover = part(`${side < 0 ? 'Left' : 'Right'} ribbed valve cover`, 'covers', [side * 2.1, 3.04, 0], .13);
    cover.position.copy(bank.position); cover.quaternion.copy(q);
    r.box(cover, [1.64, .09, 5.93], [0, 4.17, 0], 'steel', .05);
    r.box(cover, [1.49, .42, 5.72], [0, 4.38, 0], 'black', .16);
    for (let i = 0; i < 7; i++) r.box(cover, [.048, .047, 5.2], [-.52 + i * .173, 4.599, 0], 'aluminum', .02);
    for (const x of [-.72, .72]) for (const z of [-2.5, -.84, .84, 2.5]) r.bolt(cover, [x, 4.235, z]);
    r.box(cover, [.77, .045, .64], [0, 4.635, .3], 'steel', .04);
    r.box(cover, [.035, .055, .42], [-.24, 4.668, .3], 'orange', .01);
    r.box(cover, [.035, .055, .42], [.24, 4.668, .3], 'orange', .01);
    const cap = r.cylinder(cover, .22, .105, [0, 4.63, -1.76], 'black');
    r.box(cover, [.32, .08, .08], [0, cap.position.y + .08, -1.76], 'machined', .025);
  }

  const intake = part('Eight-runner intake manifold', 'intake', [0, 3.75, 0], 0);
  r.box(intake, [1.18, .64, 4.9], [0, 3.05, 0], 'aluminum', .2);
  r.box(intake, [1.2, .08, 4.92], [0, 3.4, 0], 'machined', .035);
  for (const z of [-1.96, -1, 0, 1, 1.96]) r.box(intake, [1.04, .035, .05], [0, 3.465, z], 'steel', .01);
  for (const side of [-1, 1]) {
    const n = bankDirection(side);
    const t = new THREE.Vector3(Math.SQRT1_2, -side * Math.SQRT1_2, 0);
    CYLINDER_Z.forEach(z => {
      const endpoint = n.clone().multiplyScalar(3.4).add(t.clone().multiplyScalar(-side * .85));
      endpoint.y += CRANK_Y;
      r.tube(intake, [[side * .48, 3.14, z], [side * .99, 3.12, z + side * .13], [endpoint.x - side * .2, endpoint.y + .12, z + side * .105], [endpoint.x, endpoint.y, z + side * .105]], .19, 'aluminum');
      r.box(intake, [.36, .09, .54], [endpoint.x, endpoint.y, z + side * .105], 'machined').rotation.z = -side * Math.PI / 4;
    });
    for (const z of [-2.1, 0, 2.1]) r.bolt(intake, [side * .46, 3.475, z], [0, 1, 0], .8);
  }
  const throttle = r.cylinder(intake, .46, .47, [0, 3.04, 2.69], 'machined'); throttle.rotation.x = Math.PI / 2;
  r.ring(intake, .4, .064, [0, 3.04, 2.955], 'steel');
  const butterfly = r.cylinder(intake, .35, .035, [0, 3.04, 2.977], 'brass'); butterfly.rotation.x = Math.PI / 2 + .45;
  r.box(intake, [.9, .075, .075], [0, 3.04, 3.0], 'steel', .01);

  for (const side of [-1, 1]) {
    const manifold = part(`${side < 0 ? 'Left' : 'Right'} exhaust manifold`, 'exhaust', [side * 2.2, .35, .45], .43);
    const n = bankDirection(side);
    const t = new THREE.Vector3(Math.SQRT1_2, -side * Math.SQRT1_2, 0);
    CYLINDER_Z.forEach((z, i) => {
      const start = n.clone().multiplyScalar(3.4).add(t.clone().multiplyScalar(side * .85)); start.y += CRANK_Y;
      r.tube(manifold, [[start.x, start.y, z + side * .105], [side * (3.5 + i * .055), 1.6, z], [side * (3.4 + i * .12), .68, z + .45], [side * 3.26, .15, 1.8 + i * .09]], .155, 'copper');
      const flange = r.box(manifold, [.1, .4, .63], [start.x, start.y, z + side * .105], 'steel'); flange.rotation.z = -side * Math.PI / 4;
      for (const dz of [-.25, .25]) r.bolt(manifold, [start.x + side * .07, start.y, z + side * .105 + dz], [side, 0, 0], .7);
    });
    const collector = r.cylinder(manifold, .34, .87, [side * 3.26, .06, 2.45], 'copper'); collector.rotation.x = Math.PI / 2;
    r.ring(manifold, .34, .05, [side * 3.26, .06, 2.91], 'steel');
    r.ring(manifold, .28, .037, [side * 3.26, .06, 2.93], 'copper');
  }

  const mechanismRoot = part('Working rotating assembly', 'pistons', [0, -.9, .45], .77);
  const crank = new THREE.Group(); crank.name = 'Cross-plane crankshaft'; crank.userData.category = 'crank';
  crank.position.y = CRANK_Y; mechanismRoot.add(crank); groups.crank.push(crank);
  const mainShaft = r.cylinder(crank, .205, 6.35, [0, 0, 0], 'machined'); mainShaft.rotation.x = Math.PI / 2;
  for (let j = 0; j < 5; j++) {
    const z = -2.8 + j * 1.4;
    const journal = r.cylinder(crank, .29, .29, [0, 0, z], 'machined'); journal.rotation.x = Math.PI / 2;
    const collar = r.ring(crank, .3, .035, [0, 0, z + .16], 'steel');
    collar.name = 'Main bearing collar';
  }
  CYLINDER_Z.forEach((z, i) => {
    const a = THROW_PHASES[i];
    const pin = r.cylinder(crank, .19, .48, [Math.sin(a) * CRANK_RADIUS, Math.cos(a) * CRANK_RADIUS, z], 'machined'); pin.rotation.x = Math.PI / 2;
    for (const dz of [-.36, .36]) {
      const web = r.box(crank, [.67, .91, .2], [Math.sin(a) * .16, Math.cos(a) * .16, z + dz], 'steel', .19); web.rotation.z = -a;
      const counter = r.cylinder(crank, .48, .21, [-Math.sin(a) * .24, -Math.cos(a) * .24, z + dz], 'steel', 24); counter.rotation.x = Math.PI / 2;
      const pinEnd = r.cylinder(crank, .13, .022, [Math.sin(a) * CRANK_RADIUS, Math.cos(a) * CRANK_RADIUS, z + dz + Math.sign(dz) * .12], 'brass'); pinEnd.rotation.x = Math.PI / 2;
    }
  });
  const cylinders = [];
  for (const side of [-1, 1]) {
    const n = bankDirection(side);
    CYLINDER_Z.forEach((z, i) => {
      const piston = new THREE.Group(); piston.name = `Piston ${i * 2 + (side < 0 ? 1 : 2)}`; piston.userData.category = 'pistons';
      piston.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); mechanismRoot.add(piston);
      r.cylinder(piston, .455, .53, [0, .18, 0], 'aluminum', 40);
      r.cylinder(piston, .462, .09, [0, .49, 0], 'machined', 40);
      r.cylinder(piston, .32, .012, [0, .544, 0], 'steel', 32);
      for (const y of [.32, .39, .45]) {
        const ring = r.ring(piston, .458, .018, [0, y, 0], 'steel'); ring.rotation.x = Math.PI / 2;
      }
      const wrist = r.cylinder(piston, .093, .86, [0, 0, 0], 'brass', 20); wrist.rotation.x = Math.PI / 2;
      for (const dz of [-.434, .434]) {
        const wristHole = r.cylinder(piston, .095, .018, [0, 0, dz], 'steel', 20); wristHole.rotation.x = Math.PI / 2;
      }
      const rod = new THREE.Group(); rod.name = `Connecting rod ${i * 2 + (side < 0 ? 1 : 2)}`; rod.userData.category = 'pistons'; mechanismRoot.add(rod);
      r.ring(rod, .235, .075, [0, 0, 0], 'machined');
      r.ring(rod, .105, .05, [0, ROD_LENGTH, 0], 'machined');
      r.box(rod, [.19, ROD_LENGTH - .28, .12], [0, ROD_LENGTH / 2, 0], 'machined', .045);
      for (const dz of [-.075, .075]) r.box(rod, [.27, ROD_LENGTH - .42, .035], [0, ROD_LENGTH / 2, dz], 'steel', .025);
      r.box(rod, [.55, .17, .19], [0, -.13, 0], 'machined', .04);
      for (const x of [-.2, .2]) r.bolt(rod, [x, -.23, 0], [0, -1, 0], .75);
      cylinders.push({ side, phase: THROW_PHASES[i], z: z + side * .105, piston, rod });
    });
  }
  const mechanism = { root: mechanismRoot, crank, cylinders };
  updateMechanism(mechanism, 0);

  const pan = part('Finned oil sump', 'pan', [0, -2.55, 0], .6);
  r.box(pan, [2.65, .13, 6.02], [0, -.85, 0], 'machined', .08);
  r.box(pan, [2.31, .43, 5.68], [0, -1.08, 0], 'aluminum', .17);
  r.box(pan, [2.07, .56, 3.48], [0, -1.39, -.57], 'aluminum', .18);
  for (let i = 0; i < 9; i++) r.box(pan, [.07, .12, 3.1], [-.85 + i * .213, -1.69, -.57], 'cast', .025);
  for (const x of [-1.24, 1.24]) for (let i = 0; i < 9; i++) r.bolt(pan, [x, -.77, -2.64 + i * .66], [0, 1, 0], .7);
  r.bolt(pan, [0, -1.73, .76], [0, -1, 0], 1.2, 'brass');

  const timing = part('Front timing drive', 'crank', [0, .05, 2.5], .47);
  r.box(timing, [1.62, 1.78, .2], [0, .12, 3.07], 'cast', .3);
  const pulley = (x, y, radius, depth, material) => {
    const p = r.cylinder(timing, radius, depth, [x, y, 3.26], material); p.rotation.x = Math.PI / 2;
    r.ring(timing, radius - .04, .04, [x, y, 3.26 + depth / 2], 'machined');
    const hub = r.cylinder(timing, radius * .28, depth + .045, [x, y, 3.29], 'steel', 20); hub.rotation.x = Math.PI / 2;
    r.bolt(timing, [x, y, 3.3 + depth / 2], [0, 0, 1], 1.1);
  };
  pulley(0, CRANK_Y, .57, .26, 'steel'); pulley(0, 1.09, .42, .22, 'aluminum'); pulley(.94, .56, .3, .24, 'steel');
  r.tube(timing, [[-.51, -.18, 3.34], [-.5, .49, 3.34], [-.36, 1.34, 3.34], [.27, 1.4, 3.34], [1.21, .68, 3.34], [1.05, .29, 3.34], [.36, -.62, 3.34], [-.36, -.61, 3.34], [-.51, -.18, 3.34]], .045, 'rubber');
  for (const x of [-.58, .58]) for (const y of [-.48, .4, 1.02]) r.bolt(timing, [x, y, 3.21], [0, 0, 1], .85);

  const flywheel = part('Flywheel', 'crank', [0, -.6, -2.1], .68);
  flywheel.position.set(0, CRANK_Y, -3.05);
  const disc = r.cylinder(flywheel, 1.02, .23, [0, 0, 0], 'steel', 64); disc.rotation.x = Math.PI / 2;
  r.ring(flywheel, .97, .07, [0, 0, -.14], 'machined');
  for (let i = 0; i < 56; i++) {
    const a = i / 56 * 2 * Math.PI;
    const tooth = r.box(flywheel, [.07, .095, .23], [Math.sin(a) * 1.055, Math.cos(a) * 1.055, 0], 'machined', .012); tooth.rotation.z = -a;
  }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; r.bolt(flywheel, [Math.sin(a) * .4, Math.cos(a) * .4, -.17], [0, 0, -1], 1.1); }

  // Capture after construction: transforms include the correct bank orientations.
  parts.forEach(p => { p.origin.copy(p.object.position); p.rotation = p.object.quaternion.clone(); });
  // Movable systems and all eight piston/rod pairs retain their own Groups.
  // Hundreds of static bolt, ring, rib, and spring meshes share draw calls.
  parts.filter(p => p.object !== mechanismRoot).forEach(p => batchStaticDetail(p.object, r));
  batchStaticDetail(crank, r);
  cylinders.forEach(({ piston, rod }) => { batchStaticDetail(piston, r); batchStaticDetail(rod, r); });
  let selection = null;
  const highlightedMaterials = new Map();
  function select(category) {
    selection = category;
    root.traverse(object => {
      if (!object.isMesh) return;
      if (!object.userData.originalMaterial) object.userData.originalMaterial = object.material;
      let ancestor = object;
      while (ancestor && !ancestor.userData.category) ancestor = ancestor.parent;
      const match = category && ancestor?.userData.category === category;
      const original = object.userData.originalMaterial;
      if (match) {
        if (!highlightedMaterials.has(original)) {
          const material = original.clone(); material.emissive.set('#c4793c'); material.emissiveIntensity = .3;
          highlightedMaterials.set(original, material);
        }
        object.material = highlightedMaterials.get(original);
      } else object.material = original;
    });
  }
  return { root, parts, groups, mechanism, select, get selection() { return selection; },
    dispose() { highlightedMaterials.forEach(m => m.dispose()); r.dispose(); },
  };
}
