import * as THREE from 'three';
import { Bag, box, cyl, lathe, sphere, torus, tube, extrude, roundedRect, jitter } from './geo';
import { packWheelset, packedMaterial, InstBatch } from './inst';
import { makeLocoMaterials, TrainMaterials } from './materials';
import { Rng, noise } from '../core/noise';
import { makeTextTexture, decalMaterial } from './decals';

export const TENDER = {
  wheelR: 0.58,
  axles: [-1.85, 0, 1.85],
  halfLen: 3.55, // to buffer faces
  bodyHalf: 3.3,
  frontBufferZ: 3.55,
  rearBufferZ: -3.55,
};

export class Tender {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  private sets: THREE.Object3D[] = [];
  readonly batches: InstBatch[] = [];
  readonly mats: TrainMaterials;

  constructor(mats?: TrainMaterials) {
    this.mats = mats ?? makeLocoMaterials();
    this.root.add(this.body);
    this.buildBody();
    this.buildRunning();
  }

  private buildBody() {
    const bag = new Bag();
    const rng = new Rng(77);
    const W = 1.25;
    const Z = TENDER.bodyHalf;

    // main tank: rounded-rect cross-section extruded along z
    const sh = roundedRect(2 * W, 1.45, 0.1);
    const tank = extrude(sh, 2 * Z, 0.02);
    tank.translate(0, 1.7, 0);
    bag.add('green', tank);
    // plinth / skirt in black
    bag.add('black', box(2 * W - 0.1, 0.18, 2 * Z - 0.1), { p: [0, 0.98, 0] });
    // top deck over the water space
    bag.add('green', box(2 * W - 0.1, 0.05, 3.55), { p: [0, 2.43, -1.4] });
    // coal bunker: raised sides and front coal plate
    for (const sd of [-1, 1]) {
      bag.add('green', box(0.06, 0.62, 3.0), { p: [sd * (W - 0.04), 2.64, 1.8] });
      bag.add('brass', box(0.09, 0.03, 3.02), { p: [sd * (W - 0.04), 2.97, 1.8] });
    }
    bag.add('green', box(2 * W - 0.1, 0.9, 0.06), { p: [0, 2.85, Z - 0.05] });
    bag.add('brass', box(2 * W - 0.1, 0.03, 0.09), { p: [0, 3.3, Z - 0.05] });
    bag.add('green', box(2 * W - 0.1, 0.42, 0.05), { p: [0, 2.62, 0.32] });
    // fire-iron hoops on the coal plate
    for (const dx of [-0.7, 0.7]) bag.add('iron', torus(0.12, 0.012, 6, 14, 'z'), { p: [dx, 3.05, Z - 0.13] });
    bag.add('iron', box(0.025, 0.025, 1.5), { p: [0.2, 3.08, Z - 0.5] });

    // coal heap: displaced low-poly mound with lumps
    const heap = new THREE.IcosahedronGeometry(1, 4);
    const p = heap.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = noise.n3(v.x * 3.2, v.y * 3.2, v.z * 3.2) * 0.12 + noise.n3(v.x * 9, v.y * 9, v.z * 9) * 0.04;
      const r = 1 + n;
      p.setXYZ(i, v.x * r * 1.1, Math.max(v.y, -0.1) * r * 0.55, v.z * r * 1.4);
    }
    heap.computeVertexNormals();
    bag.add('coal', heap, { p: [0, 2.42, 1.85], s: [1.0, 1.0, 1.1] });
    const lumpG = new THREE.DodecahedronGeometry(0.07, 0);
    for (let i = 0; i < 160; i++) {
      const x = rng.range(-1.05, 1.05), z = rng.range(0.4, 3.2);
      const hy = 2.42 + 0.55 * Math.max(0, 1 - Math.pow(Math.abs(x) / 1.1, 2)) * Math.max(0, 1 - Math.pow((z - 1.85) / 1.5, 2)) + 0.05;
      const g = jitter(lumpG.clone(), 0.05, i + 1);
      bag.add('coal', g, { p: [x, hy, z], r: [rng.range(0, 6), rng.range(0, 6), rng.range(0, 6)], s: [rng.range(0.6, 1.5), rng.range(0.5, 1.2), rng.range(0.6, 1.4)] });
    }

    // water filler dome and manhole
    bag.add('brass', lathe([[0.001, 2.46], [0.34, 2.46], [0.33, 2.52], [0.26, 2.58], [0.001, 2.6]], 24, 'y'), { p: [0, 0, -1.55] });
    bag.add('steel', torus(0.34, 0.02, 6, 28, 'y'), { p: [0, 2.48, -1.55] });
    bag.add('iron', box(0.04, 0.06, 0.4), { p: [0, 2.62, -1.55] });
    // toolbox lids / lockers on the deck
    for (const sd of [-1, 1]) {
      bag.add('wood', box(0.45, 0.22, 1.2), { p: [sd * 0.82, 2.58, -2.4] });
      bag.add('brass', box(0.03, 0.03, 1.22), { p: [sd * 0.82, 2.7, -2.4] });
    }

    // lining: cream bead outlines on the side panels
    for (const sd of [-1, 1]) {
      const x = sd * (W + 0.006);
      const bead = (cx: number, cy: number, w: number, h: number) => {
        bag.add('cream', box(0.01, 0.02, w), { p: [x, cy - h / 2, cx] });
        bag.add('cream', box(0.01, 0.02, w), { p: [x, cy + h / 2, cx] });
        bag.add('cream', box(0.01, h, 0.02), { p: [x, cy, cx - w / 2] });
        bag.add('cream', box(0.01, h, 0.02), { p: [x, cy, cx + w / 2] });
      };
      bead(0, 1.7, 6.0, 1.15);
      bead(0, 1.7, 5.8, 1.0);
      // vertical panel joints and rivet strips
      for (const z of [-2.9, -1.0, 1.0, 2.9]) bag.add('green', box(0.014, 1.3, 0.1), { p: [x, 1.7, z] });
      const rv = sphere(0.014, 6, 4);
      for (let i = 0; i < 70; i++) {
        bag.add('iron', rv, { p: [x + sd * 0.004, 1.02, -3.15 + i * 0.09] });
        bag.add('iron', rv, { p: [x + sd * 0.004, 2.38, -3.15 + i * 0.09] });
      }
      // handrail steps at the rear corners
      bag.add('brass', tube([[sd * 1.28, 2.4, -3.0], [sd * 1.34, 2.4, -3.0], [sd * 1.34, 1.2, -3.0], [sd * 1.28, 1.2, -3.0]], 0.014, 6, 4));
    }

    // buffer beams + buffers (rear)
    const beam = (zc: number, dir: number) => {
      bag.add('red', box(2.6, 0.42, 0.12), { p: [0, 1.0, zc] });
      for (const sd of [-1, 1]) {
        bag.add('steel', cyl(0.11, 0.11, 0.4, 20, 'z'), { p: [sd * 0.9, 1.0, zc + dir * 0.26] });
        bag.add('steel', lathe([[0.001, 0.0], [0.22, 0.0], [0.23, 0.02], [0.23, 0.055], [0.2, 0.075], [0.001, 0.08]], 28, 'z'), { p: [sd * 0.9, 1.0, zc + dir * 0.42], s: [1, 1, dir] });
        bag.add('iron', box(0.1, 0.5, 0.2), { p: [sd * 0.9, 1.0, zc - dir * 0.14] });
      }
    };
    beam(TENDER.frontBufferZ - 0.12, 1);
    beam(TENDER.rearBufferZ + 0.12, -1);
    // front drawbar
    bag.add('iron', box(0.12, 0.1, 0.5), { p: [0, 0.95, 3.7] });
    // rear coupling
    bag.add('iron', box(0.1, 0.12, 0.34), { p: [0, 0.94, -3.75] });
    bag.add('steel', torus(0.1, 0.018, 6, 20, 'x'), { p: [0, 0.8, -4.1] });
    bag.add('iron', tube([[0, 0.94, -3.9], [0, 0.94, -4.0], [0, 0.82, -4.05]], 0.025, 8, 6));
    for (const sd of [-1, 1]) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push([sd * (0.22 - t * 0.18), 0.82 - Math.sin(t * Math.PI) * 0.12, -3.62 - t * 0.4]);
      }
      bag.add('iron', tube(pts, 0.008, 5, 4));
    }
    // vac hose at the rear + lamp bracket
    bag.add('iron', tube([[0.32, 1.0, -3.65], [0.36, 1.25, -3.8], [0.3, 1.45, -3.7]], 0.03, 8, 6));
    bag.add('brass', cyl(0.045, 0.045, 0.05, 10, 'y'), { p: [0.3, 1.48, -3.7] });
    bag.add('iron', box(0.12, 0.08, 0.12), { p: [0, 1.35, -3.68] });
    // tail lamp
    bag.add('black', box(0.2, 0.26, 0.18), { p: [0, 1.5, -3.73] });
    bag.add('lamp', box(0.1, 0.12, 0.01), { p: [0, 1.5, -3.83] });
    // hand-brake column and wheel
    bag.add('iron', cyl(0.025, 0.025, 1.1, 8, 'y'), { p: [-1.0, 3.3, 2.9] });
    bag.add('iron', torus(0.2, 0.014, 8, 24, 'y'), { p: [-1.0, 3.8, 2.9] });
    bag.add('brass', sphere(0.04, 8, 6), { p: [-1.0, 3.85, 2.9] });
    // water scoop handle
    bag.add('iron', cyl(0.02, 0.02, 0.9, 8, 'y'), { p: [1.0, 2.9, 2.9] });
    bag.add('wood', cyl(0.03, 0.03, 0.3, 8, 'x'), { p: [1.0, 3.35, 2.9] });

    // chassis: frames, stretchers, springs, axleboxes, brake gear
    for (const sd of [-1, 1]) {
      bag.add('black', box(0.05, 0.5, 6.9), { p: [sd * 0.64, 1.0, 0] });
      for (const z of TENDER.axles) {
        bag.add('iron', box(0.12, 0.34, 0.32), { p: [sd * 0.7, 0.85, z] });
        bag.add('steel', tube([[sd * 0.72, 1.15, z - 0.6], [sd * 0.72, 1.22, z - 0.2], [sd * 0.72, 1.24, z], [sd * 0.72, 1.22, z + 0.2], [sd * 0.72, 1.15, z + 0.6]], 0.02, 6, 8));
        bag.add('iron', cyl(0.012, 0.012, 0.3, 6, 'y'), { p: [sd * 0.72, 1.0, z - 0.6] });
        bag.add('iron', cyl(0.012, 0.012, 0.3, 6, 'y'), { p: [sd * 0.72, 1.0, z + 0.6] });
      }
      for (const z of [-0.93, 0.93, -2.78, 2.78]) {
        bag.add('iron', box(0.1, 0.14, 0.34), { p: [sd * 0.88, 0.5, z + (z > 0 ? -0.0 : 0.0)] });
        bag.add('iron', box(0.03, 0.5, 0.05), { p: [sd * 0.88, 0.78, z] });
      }
    }
    for (const z of [-0.93, 0.93]) bag.add('iron', cyl(0.025, 0.025, 1.8, 6, 'x'), { p: [0, 0.5, z] });
    bag.add('iron', box(1.3, 0.2, 0.15), { p: [0, 1.0, 0] });

    const grp = bag.build(this.mats as Record<string, THREE.Material>);
    grp.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.name === 'glass' || m.name === 'lamp')) m.castShadow = false;
    });
    this.body.add(grp);

    // gilt lettering on both sides
    const tex = makeTextTexture('HIGHLAND  RAILWAY', 1024, 160, { letterSpacing: 6 });
    const dm = decalMaterial(tex);
    for (const sd of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.56), dm);
      m.position.set(sd * (W + 0.012), 1.7, 0);
      m.rotation.y = sd * Math.PI / 2;
      this.body.add(m);
    }
    // small crest roundel
    for (const sd of [-1, 1]) {
      for (const z of [-2.35, 2.35]) {
        const r = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.62, 0.05, 0.05, THREE.SRGBColorSpace), metalness: 0.2, roughness: 0.4 }));
        r.position.set(sd * (W + 0.011), 1.7, z);
        r.rotation.y = sd * Math.PI / 2;
        this.body.add(r);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 28), this.mats.brass);
        ring.position.set(sd * (W + 0.012), 1.7, z);
        ring.rotation.y = sd * Math.PI / 2;
        this.body.add(ring);
      }
    }
  }

  private buildRunning() {
    const green = new THREE.Color().setRGB(0.055, 0.29, 0.16, THREE.SRGBColorSpace);
    const geo = packWheelset({ radius: TENDER.wheelR, spokes: 14, hubR: 0.15, axleR: 0.075 }, green);
    const nodes: THREE.Object3D[] = [];
    for (const z of TENDER.axles) {
      const n = new THREE.Object3D();
      n.position.set(0, TENDER.wheelR, z);
      this.root.add(n);
      nodes.push(n);
      this.sets.push(n);
    }
    this.batches.push(new InstBatch(geo, packedMaterial(), nodes));
  }

  update(theta: number) {
    for (const s of this.sets) s.rotation.x = theta;
  }
}
