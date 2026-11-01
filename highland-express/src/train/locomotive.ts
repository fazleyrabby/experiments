import * as THREE from 'three';
import { Bag, box, cyl, lathe, sphere, torus, tube, extrude, roundedRect, alongZ, xf } from './geo';
import { packedMaterial, packGeometry, packWheelset, InstBatch, PackPart, STEEL, STEEL_DARK, BRASS } from './inst';
import { makeLocoMaterials, TrainMaterials } from './materials';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Rng } from '../core/noise';

/** Principal dimensions (loco local space: +z forward, y up from rail head, z = 0 at middle driving axle). */
export const LOCO = {
  driverR: 0.97,
  driverZ: [2.15, 0, -2.15] as number[],
  crankR: 0.32,
  yCyl: 1.38,
  mainRod: 2.75,
  pistonRod: 1.26,
  cylRear: 3.6,
  cylFront: 4.75,
  bogieZ: [3.4, 5.35] as number[],
  bogieR: 0.52,
  trailZ: -4.05,
  trailR: 0.55,
  bufferBeamZ: 6.5,
  frontZ: 7.0,
  rearZ: -4.75,
  boilerY: 2.58,
  chimneyZ: 5.5,
  chimneyTopY: 4.3,
  refLength: 11.75,
};

const RR = 0.12; // return crank offset from the crank pin
const X_RODS = 0.92, X_MAIN = 1.0, X_VG = 1.14;

interface Side {
  s: number;
  main: THREE.Object3D;
  coupF: THREE.Object3D;
  coupR: THREE.Object3D;
  crosshead: THREE.Object3D;
  pistonRod: THREE.Object3D;
  eccRod: THREE.Object3D;
  link: THREE.Object3D;
  radRod: THREE.Object3D;
  lever: THREE.Object3D;
  valveRod: THREE.Object3D;
  dieBlock: THREE.Object3D;
  beta: number;
  /** piston position (0..1) cached for steam events */
  stroke: number;
}

function rodGeo(len: number, w0: number, w1: number, thick: number, hole = 0.04, ribbed = true): THREE.BufferGeometry {
  const sh = new THREE.Shape();
  const r0 = w0 / 2, r1 = w1 / 2;
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (Math.PI * i) / n;
    const x = r0 * Math.cos(a) * 1.0, y = r0 * Math.sin(a);
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  // bottom edge to far boss
  sh.lineTo(len, -r1);
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n;
    sh.lineTo(len + r1 * Math.cos(a), r1 * Math.sin(a));
  }
  sh.lineTo(0, r0);
  for (const cx of [0, len]) {
    const h = new THREE.Path();
    h.absarc(cx, 0, hole, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 10 });
  g.translate(0, 0, -thick / 2);
  alongZ(g);
  if (!ribbed) return g;
  // central fluting rib (reads as an I-section rod)
  const rib = box(thick * 1.25, Math.min(w0, w1) * 0.28, Math.max(0.01, len - r0 - r1 - 0.06));
  rib.translate(0, 0, len / 2);
  return mergeGeometries([g, rib.toNonIndexed()].map((x) => {
    const y = x.index ? x.toNonIndexed() : x;
    for (const k of Object.keys(y.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') y.deleteAttribute(k);
    if (!y.attributes.uv) y.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(y.attributes.position.count * 2), 2));
    return y;
  }))!;
}

export class Locomotive {
  readonly root = new THREE.Group();
  readonly chassis = new THREE.Group(); // bobs on the springs
  readonly bogie = new THREE.Group();
  readonly trailing = new THREE.Group();
  readonly mats: TrainMaterials;
  private driverSets: THREE.Object3D[] = [];
  private bogieSets: THREE.Object3D[] = [];
  private trailSet!: THREE.Object3D;
  readonly batches: InstBatch[] = [];
  private sides: Side[] = [];
  /** anchors for steam / smoke effects (loco local) */
  readonly anchors = {
    chimney: new THREE.Vector3(0, LOCO.chimneyTopY + 0.05, LOCO.chimneyZ),
    safety: [new THREE.Vector3(0.0, 3.82, -0.55)],
    whistle: new THREE.Vector3(-0.28, 3.75, 0.1),
    cylCocks: [] as THREE.Vector3[],
    injector: [new THREE.Vector3(1.2, 0.85, -1.5), new THREE.Vector3(-1.2, 0.85, -1.5)],
    domeTop: new THREE.Vector3(0, 3.95, 2.2),
    headlamp: new THREE.Vector3(0, 3.62, 6.0),
    firebox: new THREE.Vector3(0, 1.8, -2.5),
  };
  readonly fireLight = new THREE.PointLight(0xff7a2a, 0, 6, 2);
  readonly headLight = new THREE.SpotLight(0xffd9a0, 0, 90, 0.5, 0.7, 1.5);
  private glow!: THREE.Sprite;
  private fireMat: THREE.MeshBasicMaterial;
  private lampMat: THREE.MeshBasicMaterial;
  /** most recent wheel angle */
  theta = 0;

  constructor() {
    this.mats = makeLocoMaterials();
    this.fireMat = this.mats.fire as THREE.MeshBasicMaterial;
    this.lampMat = this.mats.lamp as THREE.MeshBasicMaterial;
    this.root.add(this.chassis);
    this.buildBody();
    this.buildRunningGear();
    this.buildBogies();
    this.root.name = 'locomotive';

    this.fireLight.position.set(0, 2.2, -2.9);
    this.chassis.add(this.fireLight);
    // soft halo around the lit lens (additive sprite)
    const gc = document.createElement('canvas');
    gc.width = gc.height = 128;
    const gg = gc.getContext('2d')!;
    const grad = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,236,190,1)');
    grad.addColorStop(0.18, 'rgba(255,200,120,0.55)');
    grad.addColorStop(1, 'rgba(255,170,80,0)');
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 128, 128);
    const gt = new THREE.CanvasTexture(gc);
    gt.colorSpace = THREE.SRGBColorSpace;
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, toneMapped: false, opacity: 0.9 }));
    this.glow.scale.set(1.3, 1.3, 1);
    this.glow.position.set(0, 3.78, 6.22);
    this.chassis.add(this.glow);
    this.headLight.position.set(0, 3.62, 6.1);
    this.headLight.target.position.set(0, 1.0, 40);
    this.chassis.add(this.headLight, this.headLight.target);
  }

  // =================================================================== BODY
  private buildBody() {
    const bag = new Bag();
    const R = new Rng(11);
    const BY = LOCO.boilerY;

    // ---- boiler barrel + smokebox (lathe along z)
    // profile [radius, z]
    const barrel: [number, number][] = [
      [0.001, 0.55], [0.86, 0.55], [0.845, 1.4], [0.82, 2.6], [0.80, 3.8], [0.79, 4.84],
      [0.805, 4.86], [0.86, 4.88], [0.865, 5.0], [0.865, 6.2], [0.86, 6.24], [0.001, 6.24],
    ];
    const boilerG = lathe(barrel, 56, 'z');
    boilerG.translate(0, BY, 0);
    bag.add('green', boilerG);
    // smokebox in black (cut as separate cylinder overlapping the lathe's front part)
    const smoke = lathe([[0.001, 4.86], [0.875, 4.86], [0.878, 5.0], [0.878, 6.2], [0.87, 6.26], [0.001, 6.26]], 56, 'z');
    smoke.translate(0, BY, 0);
    bag.add('black', smoke);
    // smokebox ring and door dome
    bag.add('steel', lathe([[0.84, 6.24], [0.9, 6.26], [0.9, 6.32], [0.84, 6.32]], 56, 'z'), { p: [0, BY, 0] });
    bag.add('black', lathe([[0.001, 6.42], [0.2, 6.41], [0.5, 6.37], [0.74, 6.32], [0.84, 6.28], [0.8, 6.27], [0.001, 6.27]], 56, 'z'), { p: [0, BY, 0] });
    // dart and handle wheel
    bag.add('brass', lathe([[0.001, 6.44], [0.06, 6.43], [0.07, 6.40], [0.001, 6.39]], 20, 'z'), { p: [0, BY, 0] });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const g = cyl(0.016, 0.016, 0.42, 8, 'y');
      g.translate(0, 0.21, 0);
      g.rotateZ(a);
      bag.add('brass', g, { p: [0, BY, 6.43] });
      bag.add('brass', sphere(0.034, 10, 8), { p: [Math.sin(-a) * 0.42, BY + Math.cos(a) * 0.42, 6.43] });
    }
    bag.add('steel', cyl(0.025, 0.025, 0.14, 10, 'z'), { p: [0, BY, 6.4] });
    // door bolts around the rim
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      bag.add('steel', cyl(0.024, 0.024, 0.03, 8, 'z'), { p: [Math.cos(a) * 0.86, BY + Math.sin(a) * 0.86, 6.34] });
    }
    // hinge straps
    for (const sd of [-1, 1]) {
      for (const yy of [0.44, -0.44]) {
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push([sd * (0.88 - t * 0.55), BY + yy * (1 - t * 0.35), 6.43 - Math.sin(t * 3.0) * 0.02]);
        }
        bag.add('black', tube(pts, 0.026, 6, 3));
        bag.add('steel', cyl(0.035, 0.035, 0.1, 10, 'y'), { p: [sd * 0.88, BY + yy, 6.38] });
      }
    }
    // latch handle
    bag.add('steel', box(0.04, 0.2, 0.025), { p: [0.58, BY, 6.42] });

    // ---- boiler cladding bands (brass) and joint rings
    const bandZ = [0.75, 1.9, 3.1, 4.25, 5.1];
    for (const z of bandZ) {
      const r = 0.845 - (z - 0.55) * 0.012;
      bag.add('brass', lathe([[r + 0.004, z - 0.045], [r + 0.022, z - 0.04], [r + 0.026, z], [r + 0.022, z + 0.04], [r + 0.004, z + 0.045]], 56, 'z'), { p: [0, BY, 0] });
    }
    // rivets along bands and seams
    const rivetG = sphere(0.014, 6, 4);
    rivetG.scale(1, 1, 0.6);
    const rv = [] as THREE.BufferGeometry[];
    const addRivetRing = (z: number, r: number, n: number, a0 = 0, a1 = Math.PI * 2) => {
      for (let i = 0; i < n; i++) {
        const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
        const g = rivetG.clone();
        const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), new THREE.Vector3(Math.sin(a), Math.cos(a), 0), new THREE.Vector3(0, 0, 1));
        g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(Math.sin(a), Math.cos(a), 0))));
        void m;
        g.translate(Math.sin(a) * r, BY + Math.cos(a) * r, z);
        rv.push(g);
      }
    };
    for (const z of bandZ) addRivetRing(z - 0.03, 0.845 - (z - 0.55) * 0.012 + 0.02, 54);
    addRivetRing(4.875, 0.87, 60);
    addRivetRing(0.62, 0.86, 54);
    addRivetRing(6.2, 0.868, 60);
    rv.forEach((g) => bag.add('iron', g));

    // ---- firebox (Belpaire wrapper) — rounded-rect extrusion along z
    const fbShape = new THREE.Shape();
    {
      const w = 0.93, y0 = 1.28, y1 = BY + 0.9, rr = 0.1;
      fbShape.moveTo(-w + rr, y0);
      fbShape.lineTo(w - rr, y0);
      fbShape.quadraticCurveTo(w, y0, w, y0 + rr);
      fbShape.lineTo(w, y1 - rr);
      fbShape.quadraticCurveTo(w, y1, w - rr, y1);
      fbShape.lineTo(-w + rr, y1);
      fbShape.quadraticCurveTo(-w, y1, -w, y1 - rr);
      fbShape.lineTo(-w, y0 + rr);
      fbShape.quadraticCurveTo(-w, y0, -w + rr, y0);
    }
    const fbG = extrude(fbShape, 3.1, 0.035);
    fbG.translate(0, 0, -1.0);
    bag.add('green', fbG);
    // firebox top with Belpaire hump: a lower, raised panel
    bag.add('green', box(1.35, 0.1, 2.2), { p: [0, BY + 0.93, -1.05] });
    // wrapper brass band at the join
    bag.add('brass', box(1.9, 0.045, 0.08), { p: [0, BY + 0.9, 0.58] });
    // firebox rivet lines
    for (let i = 0; i < 40; i++) {
      const z = -2.45 + i * 0.075;
      for (const sd of [-1, 1]) bag.add('iron', rivetG, { p: [sd * 0.955, 2.0, z] });
    }
    // firebox lagging stripes
    for (const z of [-0.2, -1.2, -2.2]) {
      for (const sd of [-1, 1]) bag.add('brass', box(0.012, 1.4, 0.04), { p: [sd * 0.968, 2.0, z] });
    }

    // ---- chimney
    const chim = lathe([
      [0.001, 3.38], [0.34, 3.4], [0.30, 3.46], [0.21, 3.54], [0.17, 3.64], [0.165, 3.9], [0.175, 4.12],
      [0.20, 4.2], [0.235, 4.25], [0.235, 4.28], [0.19, 4.3], [0.15, 4.26], [0.15, 4.2],
    ], 40, 'y');
    chim.translate(0, 0, LOCO.chimneyZ);
    bag.add('black', chim);
    bag.add('copper', lathe([[0.152, 4.23], [0.19, 4.31], [0.24, 4.3], [0.245, 4.265], [0.2, 4.24]], 40, 'y'), { p: [0, 0, LOCO.chimneyZ] });
    // dark interior of the stack
    bag.add('iron', lathe([[0.001, 4.0], [0.15, 4.0], [0.15, 4.26], [0.001, 4.26]], 24, 'y'), { p: [0, 0, LOCO.chimneyZ], s: [0.98, 1, 0.98] });

    // ---- steam dome (brass) and sand dome
    const dome = lathe([
      [0.001, 3.38], [0.44, 3.4], [0.42, 3.48], [0.30, 3.56], [0.27, 3.7], [0.30, 3.82], [0.31, 3.9],
      [0.27, 3.98], [0.18, 4.04], [0.07, 4.08], [0.001, 4.09],
    ], 40, 'y');
    dome.translate(0, 0, 2.2);
    bag.add('brass', dome);
    bag.add('steel', lathe([[0.42, 3.4], [0.47, 3.4], [0.47, 3.43], [0.42, 3.46]], 40, 'y'), { p: [0, 0, 2.2] });
    // sand dome
    bag.add('green', lathe([[0.001, 3.36], [0.3, 3.38], [0.26, 3.5], [0.22, 3.6], [0.2, 3.7], [0.12, 3.76], [0.001, 3.77]], 32, 'y'), { p: [0, 0, 0.95] });
    bag.add('brass', lathe([[0.2, 3.62], [0.22, 3.64], [0.22, 3.68], [0.2, 3.7]], 32, 'y'), { p: [0, 0, 0.95] });
    bag.add('brass', sphere(0.05, 10, 8), { p: [0, 3.8, 0.95] });

    // ---- safety valves: twin Ramsbottom columns with lever
    const sv = lathe([
      [0.001, 3.5], [0.2, 3.5], [0.2, 3.56], [0.12, 3.6], [0.1, 3.78], [0.12, 3.8], [0.13, 3.9], [0.11, 3.96], [0.06, 4.0], [0.001, 4.02],
    ], 24, 'y');
    bag.add('brass', sv, { p: [0, 0, -0.55] });
    bag.add('brass', sv.clone(), { p: [0, 0, -1.05] });
    bag.add('steel', box(0.03, 0.04, 1.35), { p: [0, 3.84, -0.8] });
    bag.add('brass', box(0.5, 0.03, 0.3), { p: [0, 3.52, -0.8] });
    // spring balance in front of the cab
    bag.add('steel', cyl(0.018, 0.018, 0.26, 8, 'y'), { p: [0, 3.65, -1.5] });
    bag.add('brass', cyl(0.04, 0.04, 0.12, 12, 'y'), { p: [0, 3.55, -1.5] });

    // ---- whistle (brass bell)
    bag.add('brass', lathe([[0.001, 3.4], [0.05, 3.4], [0.04, 3.55], [0.075, 3.62], [0.08, 3.78], [0.07, 3.8], [0.05, 3.72], [0.05, 3.62], [0.001, 3.6]], 20, 'y'), { p: [-0.28, 0, 0.1], s: 1 });
    bag.add('brass', cyl(0.012, 0.012, 0.3, 6, 'y'), { p: [-0.28, 3.5, 0.1] });

    // ---- handrails + stanchions along the boiler
    for (const sd of [-1, 1]) {
      const y = 2.98;
      const pts: [number, number, number][] = [
        [sd * 0.98, y - 0.12, 6.0], [sd * 0.93, y, 5.7], [sd * 0.9, y, 4.5], [sd * 0.9, y, 0.7], [sd * 0.98, y, -0.1], [sd * 1.02, y, -1.0],
      ];
      bag.add('brass', tube(pts, 0.019, 8, 14));
      for (const z of [5.6, 4.2, 3.0, 1.8, 0.9, 0.2]) {
        const a = Math.acos(clampN((y - BY) / 0.82));
        const bx = sd * Math.sin(a) * 0.82;
        bag.add('brass', cyl(0.012, 0.012, Math.abs(sd * 0.9 - bx) + 0.02, 6, 'x'), { p: [(bx + sd * 0.9) / 2, y, z] });
        bag.add('brass', sphere(0.032, 10, 8), { p: [sd * 0.9, y, z] });
      }
      // lower smokebox rail
      bag.add('brass', tube([[sd * 0.5, 3.35, 6.38], [sd * 0.2, 3.5, 6.4], [sd * 0.2, 3.5, 6.0]], 0.014, 6, 4));
    }

    // ---- feed pipes, clack valves, injector pipes (copper)
    for (const sd of [-1, 1]) {
      bag.add('copper', tube([[sd * 0.74, 2.05, 1.9], [sd * 0.95, 2.0, 1.9], [sd * 1.06, 1.85, 1.2], [sd * 1.08, 1.7, -0.6]], 0.03, 8, 8));
      bag.add('brass', lathe([[0.001, 2.0], [0.07, 2.0], [0.07, 2.1], [0.05, 2.14], [0.001, 2.16]], 14, 'y'), { p: [sd * 0.78, 0.0, 1.9] });
      bag.add('brass', cyl(0.055, 0.055, 0.12, 12, 'x'), { p: [sd * 0.86, 2.28, 1.9] });
      bag.add('brass', sphere(0.06, 12, 8), { p: [sd * 0.84, 2.55, 1.2] });
      // vacuum / brake pipe along the left side
      bag.add('iron', tube([[sd * 1.0, 1.52, 6.3], [sd * 1.05, 1.5, 2.0], [sd * 1.05, 1.5, -3.8]], 0.022, 8, 10));
    }
    // steam pipes (outside) to the steam chests
    for (const sd of [-1, 1]) {
      bag.add('copper', tube([[sd * 0.86, 3.0, 5.4], [sd * 1.08, 2.6, 5.2], [sd * 1.1, 2.1, 5.0], [sd * 1.0, 1.95, 4.7]], 0.045, 10, 8));
      bag.add('brass', torus(0.06, 0.016, 6, 14, 'x'), { p: [sd * 1.09, 2.4, 5.1] });
    }

    // ---- running boards
    for (const sd of [-1, 1]) {
      const rb = box(0.58, 0.05, 7.6);
      bag.add('black', rb, { p: [sd * 1.12, 2.05, 2.3] });
      bag.add('red', box(0.03, 0.2, 7.6), { p: [sd * 1.42, 1.96, 2.3] }); // valance, red lined edge
      bag.add('cream', box(0.012, 0.012, 7.6), { p: [sd * 1.434, 2.0, 2.3] });
      // brackets
      for (let z = -1.0; z <= 5.8; z += 1.1) bag.add('iron', box(0.04, 0.3, 0.05), { p: [sd * 0.9, 1.88, z] });
      // lubricator box and oil pipes on the board
      bag.add('brass', box(0.18, 0.12, 0.2), { p: [sd * 1.12, 2.14, 5.6] });
      bag.add('brass', lathe([[0.001, 2.2], [0.06, 2.2], [0.05, 2.3], [0.001, 2.32]], 12, 'y'), { p: [sd * 1.12, 0, 5.6] });
      bag.add('copper', tube([[sd * 1.12, 2.15, 5.5], [sd * 1.06, 2.0, 5.1], [sd * 1.02, 1.7, 4.9]], 0.012, 6, 6));
    }
    // front footstep/platform above the buffer beam
    bag.add('black', box(2.6, 0.045, 0.62), { p: [0, 1.62, 6.17] });
    // smokebox saddle
    bag.add('black', box(1.7, 0.6, 1.4), { p: [0, 1.65, 5.55] });

    // ---- buffer beam (red) with buffers, hook and lamp irons
    bag.add('red', box(2.7, 0.42, 0.12), { p: [0, 1.0, LOCO.bufferBeamZ] });
    for (const sd of [-1, 1]) {
      bag.add('iron', box(0.1, 0.5, 0.22), { p: [sd * 0.92, 1.0, LOCO.bufferBeamZ - 0.16] }); // stiffeners
      for (let i = 0; i < 3; i++) bag.add('iron', cyl(0.025, 0.025, 0.04, 8, 'z'), { p: [sd * (1.1 + i * 0.07), 1.18 - i * 0.12, LOCO.bufferBeamZ + 0.07] });
      // buffer: stock (cylinder) + sprung head
      bag.add('steel', cyl(0.11, 0.11, 0.42, 20, 'z'), { p: [sd * 0.9, 1.0, LOCO.bufferBeamZ + 0.28] });
      bag.add('brass', torus(0.112, 0.014, 6, 20, 'z'), { p: [sd * 0.9, 1.0, LOCO.bufferBeamZ + 0.07] });
      bag.add('steel', lathe([[0.001, 0.0], [0.22, 0.0], [0.23, 0.02], [0.23, 0.055], [0.2, 0.075], [0.001, 0.08]], 28, 'z'), { p: [sd * 0.9, 1.0, LOCO.bufferBeamZ + 0.46] });
    }
    // drawhook + screw coupling with link, chain and safety chains
    bag.add('iron', box(0.1, 0.12, 0.34), { p: [0, 0.94, LOCO.bufferBeamZ + 0.2] });
    bag.add('iron', tube([[0, 0.94, LOCO.bufferBeamZ + 0.32], [0, 0.94, LOCO.bufferBeamZ + 0.5], [0.0, 0.82, LOCO.bufferBeamZ + 0.55]], 0.025, 8, 6));
    bag.add('steel', torus(0.1, 0.018, 6, 20, 'x'), { p: [0, 0.8, LOCO.bufferBeamZ + 0.58] });
    for (const sd of [-1, 1]) {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push([sd * (0.22 - t * 0.18), 0.82 - Math.sin(t * Math.PI) * 0.12, LOCO.bufferBeamZ + 0.1 + t * 0.4]);
      }
      bag.add('iron', tube(pts, 0.008, 5, 4));
    }
    // vacuum pipe stub + steam-heat hose, red-lined
    bag.add('iron', tube([[0.3, 1.0, LOCO.bufferBeamZ + 0.06], [0.34, 1.22, LOCO.bufferBeamZ + 0.18], [0.3, 1.42, LOCO.bufferBeamZ + 0.1]], 0.03, 8, 6));
    bag.add('brass', cyl(0.045, 0.045, 0.05, 10, 'y'), { p: [0.3, 1.45, LOCO.bufferBeamZ + 0.1] });
    // lamp irons on the beam top
    for (const sd of [-1, 1]) bag.add('iron', box(0.1, 0.06, 0.1), { p: [sd * 1.0, 1.24, LOCO.bufferBeamZ + 0.02] });

    // ---- cowcatcher / pilot: V of iron bars below the beam
    this.buildPilot(bag);

    // ---- headlamp on the smokebox top
    bag.add('black', box(0.34, 0.2, 0.3), { p: [0, 3.5, 6.0] });
    bag.add('black', box(0.34, 0.36, 0.3), { p: [0, 3.78, 6.0] });
    bag.add('brass', lathe([[0.001, 0.0], [0.16, 0.0], [0.17, 0.03], [0.1, 0.1], [0.04, 0.15], [0.001, 0.16]], 16, 'y'), { p: [0, 3.96, 6.0] });
    bag.add('lamp', cyl(0.085, 0.085, 0.02, 20, 'z'), { p: [0, 3.78, 6.16] });
    bag.add('brass', torus(0.09, 0.015, 8, 20, 'z'), { p: [0, 3.78, 6.16] });
    bag.add('iron', box(0.1, 0.24, 0.1), { p: [0, 3.35, 5.98] });
    // side lamps low on the beam (unlit)
    for (const sd of [-1, 1]) {
      bag.add('black', box(0.22, 0.28, 0.2), { p: [sd * 1.0, 1.42, LOCO.bufferBeamZ + 0.04] });
      bag.add('brass', lathe([[0.001, 0.0], [0.1, 0.0], [0.08, 0.1], [0.001, 0.12]], 12, 'y'), { p: [sd * 1.0, 1.56, LOCO.bufferBeamZ + 0.04] });
      bag.add('glass', cyl(0.07, 0.07, 0.02, 14, 'z'), { p: [sd * 1.0, 1.42, LOCO.bufferBeamZ + 0.15] });
    }

    // ---- frames (plate frames, mostly hidden behind the wheels) + axleboxes + hornguides
    for (const sd of [-1, 1]) {
      bag.add('black', box(0.04, 0.55, 10.3), { p: [sd * 0.6, 1.05, 1.9] });
      bag.add('black', box(0.04, 0.8, 1.0), { p: [sd * 0.6, 0.95, -3.7] });
      for (const z of LOCO.driverZ) {
        bag.add('iron', box(0.1, 0.36, 0.34), { p: [sd * 0.64, 1.02, z] });
        bag.add('iron', box(0.08, 0.48, 0.1), { p: [sd * 0.64, 0.8, z + 0.28] });
        bag.add('iron', box(0.08, 0.48, 0.1), { p: [sd * 0.64, 0.8, z - 0.28] });
        // leaf springs above the axleboxes
        const spr = tube([[sd * 0.66, 1.24, z - 0.62], [sd * 0.66, 1.3, z - 0.3], [sd * 0.66, 1.32, z], [sd * 0.66, 1.3, z + 0.3], [sd * 0.66, 1.24, z + 0.62]], 0.022, 6, 10);
        bag.add('steel', spr);
        bag.add('iron', cyl(0.012, 0.012, 0.26, 6, 'y'), { p: [sd * 0.66, 1.1, z - 0.62] });
        bag.add('iron', cyl(0.012, 0.012, 0.26, 6, 'y'), { p: [sd * 0.66, 1.1, z + 0.62] });
      }
      // brake blocks and hangers
      for (const z of LOCO.driverZ) {
        for (const f of [-1, 1]) {
          bag.add('iron', box(0.12, 0.14, 0.34), { p: [sd * 0.87, 0.4, z + f * 0.82] });
          bag.add('iron', box(0.035, 0.5, 0.05), { p: [sd * 0.87, 0.7, z + f * 0.8] });
        }
        bag.add('iron', cyl(0.025, 0.025, 1.8, 6, 'x'), { p: [0, 0.52, z + 0.82] });
      }
      // sand pipes
      for (const z of [2.15, 0.0]) {
        bag.add('brass', tube([[sd * 0.88, 1.55, z + 1.0], [sd * 0.86, 1.0, z + 1.12], [sd * 0.78, 0.15, z + 1.0]], 0.02, 6, 6));
      }
      // cab steps
      bag.add('iron', box(0.04, 0.05, 0.3), { p: [sd * 1.4, 1.1, -2.7] });
      bag.add('iron', box(0.35, 0.04, 0.5), { p: [sd * 1.28, 1.15, -2.9] });
      bag.add('iron', box(0.35, 0.04, 0.5), { p: [sd * 1.28, 0.5, -2.9] });
      bag.add('iron', box(0.03, 0.7, 0.04), { p: [sd * 1.28, 0.82, -2.65] });
      bag.add('iron', box(0.03, 0.7, 0.04), { p: [sd * 1.28, 0.82, -3.15] });
    }
    // stretchers / cross-members
    bag.add('black', box(1.2, 0.3, 0.1), { p: [0, 1.0, 3.7] });
    bag.add('black', box(1.2, 0.3, 0.1), { p: [0, 1.0, -3.2] });
    // rear beam & drag box + buffer plates
    bag.add('red', box(2.6, 0.38, 0.1), { p: [0, 1.05, LOCO.rearZ + 0.1] });
    for (const sd of [-1, 1]) bag.add('steel', box(0.36, 0.3, 0.05), { p: [sd * 0.9, 1.05, LOCO.rearZ - 0.0] });
    bag.add('iron', box(0.24, 0.2, 0.3), { p: [0, 0.95, LOCO.rearZ - 0.1] });

    // ---- CYLINDERS (static parts) and steam chests
    this.buildCylinders(bag);

    // ---- CAB
    this.buildCab(bag);

    // ---- build merged meshes
    const mats = this.mats;
    const grp = bag.build(mats as Record<string, THREE.Material>);
    // emissive/glass meshes should not cast shadows
    grp.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (m.name === 'glass' || m.name === 'lamp' || m.name === 'fire')) m.castShadow = false;
    });
    this.chassis.add(grp);
  }

  private buildPilot(bag: Bag) {
    const z0 = LOCO.bufferBeamZ - 0.02;
    const zTip = 7.55;
    const yT = 0.74, yB = 0.3;
    // bar frame: two side rails converging to a point plus a lower rail
    const top: [number, number, number][] = [[-1.2, yT, z0], [-0.55, 0.66, 7.0], [0, yB + 0.1, zTip]];
    const topR: [number, number, number][] = [[1.2, yT, z0], [0.55, 0.66, 7.0], [0, yB + 0.1, zTip]];
    bag.add('black', tube(top, 0.04, 8, 8));
    bag.add('black', tube(topR, 0.04, 8, 8));
    bag.add('black', tube([[-1.05, 0.5, z0 + 0.02], [-0.45, 0.4, 7.0], [0, yB, zTip - 0.05]], 0.022, 8, 8));
    bag.add('black', tube([[1.05, 0.5, z0 + 0.02], [0.45, 0.4, 7.0], [0, yB, zTip - 0.05]], 0.022, 8, 8));
    // vertical slats
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      for (const sd of [-1, 1]) {
        const x0 = sd * (1.18 - t * 1.0), z1 = z0 + t * 0.9;
        const yTop = yT - t * 0.1, yBot = 0.52 - t * 0.2;
        const g = cyl(0.018, 0.018, yTop - yBot, 6, 'y');
        bag.add('black', g, { p: [x0, (yTop + yBot) / 2, z1 + 0.14 + t * 0.4] });
      }
    }
    for (const sd of [-1, 1]) bag.add('iron', box(0.05, 0.08, 0.5), { p: [sd * 1.15, 0.78, z0 + 0.25] });
    // centre spine
    bag.add('black', tube([[0, yT - 0.05, z0], [0, 0.5, 7.2], [0, yB + 0.05, zTip - 0.02]], 0.02, 6, 6));
  }

  private buildCylinders(bag: Bag) {
    const zc = (LOCO.cylRear + LOCO.cylFront) / 2;
    const len = LOCO.cylFront - LOCO.cylRear;
    const cocks: THREE.Vector3[] = [];
    for (const sd of [-1, 1]) {
      const x = sd * X_MAIN;
      // cylinder barrel + lagging (green with brass bands) + covers
      bag.add('green', cyl(0.29, 0.29, len, 36, 'z'), { p: [x, LOCO.yCyl, zc] });
      for (const z of [LOCO.cylRear + 0.1, LOCO.cylFront - 0.1]) bag.add('brass', cyl(0.3, 0.3, 0.06, 36, 'z'), { p: [x, LOCO.yCyl, z] });
      bag.add('black', lathe([[0.001, 0.0], [0.24, 0.0], [0.3, 0.03], [0.29, 0.07], [0.15, 0.13], [0.001, 0.14]], 28, 'z'), { p: [x, LOCO.yCyl, LOCO.cylFront] });
      bag.add('steel', cyl(0.06, 0.06, 0.05, 12, 'z'), { p: [x, LOCO.yCyl, LOCO.cylFront + 0.16] });
      // rear cover with gland + stuffing box
      bag.add('black', lathe([[0.001, 0.0], [0.26, 0.0], [0.27, -0.03], [0.1, -0.1], [0.07, -0.18], [0.001, -0.18]], 24, 'z'), { p: [x, LOCO.yCyl, LOCO.cylRear] });
      bag.add('brass', cyl(0.065, 0.065, 0.1, 14, 'z'), { p: [x, LOCO.yCyl, LOCO.cylRear - 0.2] });
      // steam chest above
      bag.add('green', cyl(0.2, 0.2, len - 0.1, 32, 'z'), { p: [x, 1.76, zc] });
      for (const z of [LOCO.cylRear + 0.08, LOCO.cylFront - 0.08]) bag.add('brass', cyl(0.21, 0.21, 0.05, 28, 'z'), { p: [x, 1.76, z] });
      bag.add('black', box(0.34, 0.3, len - 0.1), { p: [x, 1.57, zc] });
      bag.add('brass', cyl(0.05, 0.05, 0.12, 12, 'z'), { p: [x, 1.76, LOCO.cylRear - 0.05] });
      // cylinder cocks (drain valves) at front and rear underneath
      for (const z of [LOCO.cylRear + 0.2, LOCO.cylFront - 0.2]) {
        bag.add('brass', cyl(0.03, 0.03, 0.14, 8, 'y'), { p: [x, LOCO.yCyl - 0.35, z] });
        cocks.push(new THREE.Vector3(x, LOCO.yCyl - 0.45, z));
      }
      // slide bar brackets + guide bars (static)
      for (const dy of [0.115, -0.115]) bag.add('steel', box(0.04, 0.03, 1.16), { p: [x, LOCO.yCyl + dy, 3.0] });
      bag.add('iron', box(0.1, 0.4, 0.1), { p: [x, 1.3, 2.35] });
      bag.add('iron', box(0.1, 0.4, 0.08), { p: [x, 1.3, 3.0] });
      // cylinder support bracket to frame
      bag.add('iron', box(0.45, 0.1, 1.0), { p: [sd * 0.82, 1.15, zc] });
      // link support (bracket from the frame to expansion-link trunnion)
      bag.add('iron', box(0.55, 0.06, 0.12), { p: [sd * 0.88, 1.52, 1.35] });
      bag.add('brass', cyl(0.05, 0.05, 0.1, 12, 'x'), { p: [sd * X_VG, 1.52, 1.35] });
      // valve-rod guide on the steam-chest rear
      bag.add('iron', box(0.08, 0.14, 0.18), { p: [x + sd * 0.0, 1.76, 3.45] });
    }
    this.anchors.cylCocks = cocks;
  }

  private buildCab(bag: Bag) {
    const zF = -1.65, zR = -4.4;
    const xw = 1.3;
    const L = zF - zR; // 2.75
    const zm = (zF + zR) / 2;
    // side sheets with window opening, extruded along x
    for (const sd of [-1, 1]) {
      const sh = new THREE.Shape();
      const y0 = 1.5, y1 = 3.48;
      sh.moveTo(0, y0);
      sh.lineTo(L, y0);
      sh.lineTo(L, y1 - 0.2);
      sh.quadraticCurveTo(L, y1, L - 0.2, y1);
      sh.lineTo(0.2, y1);
      sh.quadraticCurveTo(0, y1, 0, y1 - 0.2);
      sh.lineTo(0, y0);
      // window opening
      const hole = new THREE.Path();
      const wx0 = 0.5, wx1 = L - 0.5, wy0 = 2.3, wy1 = 3.18, rr = 0.1;
      hole.moveTo(wx0 + rr, wy0);
      hole.lineTo(wx1 - rr, wy0);
      hole.quadraticCurveTo(wx1, wy0, wx1, wy0 + rr);
      hole.lineTo(wx1, wy1 - rr);
      hole.quadraticCurveTo(wx1, wy1, wx1 - rr, wy1);
      hole.lineTo(wx0 + rr, wy1);
      hole.quadraticCurveTo(wx0, wy1, wx0, wy1 - rr);
      hole.lineTo(wx0, wy0 + rr);
      hole.quadraticCurveTo(wx0, wy0, wx0 + rr, wy0);
      sh.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 6 });
      g.translate(0, 0, -0.02);
      // shape x -> -z (cab runs rearward), shape y -> y, extrusion -> x
      const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0));
      g.applyMatrix4(m);
      // basis det = +1? (0,0,-1)x(0,1,0) = (1,0,0)... flip winding if needed
      g.translate(sd * xw, 0, zF);
      bag.add('green', g);
      // window frame (brass) — a thin ring around the opening
      const frame = new THREE.Shape();
      const fo = 0.045;
      frame.moveTo(wx0 - fo, wy0 - fo);
      frame.lineTo(wx1 + fo, wy0 - fo);
      frame.lineTo(wx1 + fo, wy1 + fo);
      frame.lineTo(wx0 - fo, wy1 + fo);
      frame.lineTo(wx0 - fo, wy0 - fo);
      const fh = new THREE.Path();
      fh.moveTo(wx0, wy0);
      fh.lineTo(wx0, wy1);
      fh.lineTo(wx1, wy1);
      fh.lineTo(wx1, wy0);
      fh.lineTo(wx0, wy0);
      frame.holes.push(fh);
      const fg = new THREE.ExtrudeGeometry(frame, { depth: 0.02, bevelEnabled: false });
      fg.applyMatrix4(m);
      fg.translate(sd * (xw + sd * 0.018), 0, zF);
      bag.add('brass', fg);
      // lining on the side sheet: cream border strips
      const lin = (y: number) => bag.add('cream', box(0.012, 0.025, L - 0.3), { p: [sd * (xw + sd * 0.024), y, zm] });
      lin(1.62);
      lin(3.36);
      bag.add('cream', box(0.012, 1.7, 0.025), { p: [sd * (xw + sd * 0.024), 2.5, zF - 0.14] });
      bag.add('cream', box(0.012, 1.7, 0.025), { p: [sd * (xw + sd * 0.024), 2.5, zR + 0.14] });
      // glass
      bag.add('glass', box(0.01, 0.88, L - 1.0), { p: [sd * xw, 2.74, zm] });
      // sliding window runner
      bag.add('brass', box(0.014, 0.03, L - 0.9), { p: [sd * (xw + sd * 0.02), 2.74, zm] });
      // rivets down the cab edges
      const rv = sphere(0.014, 6, 4);
      for (let i = 0; i < 24; i++) {
        bag.add('iron', rv, { p: [sd * (xw + sd * 0.028), 1.58 + i * 0.077, zF - 0.06] });
        bag.add('iron', rv, { p: [sd * (xw + sd * 0.028), 1.58 + i * 0.077, zR + 0.06] });
      }
      // nameplate: brass-edged curved plate on the cab side
      bag.add('brass', box(0.014, 0.22, 1.0), { p: [sd * (xw + sd * 0.03), 1.92, zm] });
      // grab handles at the cab entrance
      bag.add('brass', tube([[sd * (xw + sd * 0.07), 3.2, zF - 0.25], [sd * (xw + sd * 0.1), 3.2, zF - 0.28], [sd * (xw + sd * 0.1), 1.8, zF - 0.28], [sd * (xw + sd * 0.07), 1.8, zF - 0.25]], 0.014, 6, 4));
      // seat
      bag.add('wood', box(0.5, 0.05, 0.55), { p: [sd * 0.98, 1.95, zR + 0.45] });
      bag.add('iron', box(0.04, 0.34, 0.04), { p: [sd * 1.18, 1.77, zR + 0.45] });
    }
    // front spectacle plate with two round windows
    {
      const sh = new THREE.Shape();
      const y0 = 1.5, y1 = 3.48;
      sh.moveTo(-xw, y0);
      sh.lineTo(xw, y0);
      sh.lineTo(xw, y1 - 0.2);
      sh.quadraticCurveTo(xw, y1, xw - 0.2, y1);
      sh.lineTo(-xw + 0.2, y1);
      sh.quadraticCurveTo(-xw, y1, -xw, y1 - 0.2);
      sh.lineTo(-xw, y0);
      for (const cx of [-0.8, 0.8]) {
        const h = new THREE.Path();
        h.absarc(cx, 2.95, 0.2, 0, Math.PI * 2, true);
        sh.holes.push(h);
      }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false, curveSegments: 20 });
      g.translate(0, 0, zF - 0.1);
      bag.add('green', g);
      for (const cx of [-0.8, 0.8]) {
        bag.add('brass', torus(0.215, 0.028, 8, 28, 'z'), { p: [cx, 2.95, zF - 0.045] });
        bag.add('glass', cyl(0.2, 0.2, 0.01, 24, 'z'), { p: [cx, 2.95, zF - 0.075] });
      }
    }
    // roof: arched shell along z
    {
      const sh = new THREE.Shape();
      const n = 24, h0 = 3.4, rise = 0.38, hw = 1.42;
      for (let i = 0; i <= n; i++) {
        const t = -1 + (2 * i) / n;
        const x = t * hw;
        const y = h0 + rise * (1 - t * t);
        if (i === 0) sh.moveTo(x, y);
        else sh.lineTo(x, y);
      }
      for (let i = n; i >= 0; i--) {
        const t = -1 + (2 * i) / n;
        sh.lineTo(t * (hw - 0.04), h0 - 0.05 + (rise - 0.01) * (1 - t * t));
      }
      const g = extrude(sh, 3.2, 0.012);
      g.translate(0, 0, zm - 0.05);
      bag.add('cream', g);
      // roof ribs
      for (let i = 0; i < 9; i++) {
        const z = zF + 0.05 - i * 0.37;
        const rib = new THREE.Shape();
        const nn = 20;
        for (let k = 0; k <= nn; k++) {
          const t = -1 + (2 * k) / nn;
          const x = t * (hw + 0.01);
          const y = h0 + 0.025 + rise * (1 - t * t);
          if (k === 0) rib.moveTo(x, y);
          else rib.lineTo(x, y);
        }
        for (let k = nn; k >= 0; k--) {
          const t = -1 + (2 * k) / nn;
          rib.lineTo(t * (hw + 0.01), h0 + 0.0 + rise * (1 - t * t));
        }
        bag.add('black', extrude(rib, 0.03, 0), { p: [0, 0, z] });
      }
      // roof ventilator
      bag.add('brass', lathe([[0.001, 3.78], [0.14, 3.78], [0.12, 3.85], [0.09, 3.96], [0.001, 3.99]], 20, 'y'), { p: [0, 0, zm - 0.1] });
      bag.add('black', cyl(0.06, 0.06, 0.1, 12, 'y'), { p: [0, 3.74, zm - 0.1] });
      // gutter/drip rails
      for (const sd of [-1, 1]) bag.add('iron', box(0.03, 0.03, 3.2), { p: [sd * 1.4, 3.37, zm - 0.05] });
      // lamp bracket with oil lamp on the roof front
      bag.add('black', box(0.1, 0.12, 0.1), { p: [0, 3.86, zF + 0.15] });
    }
    // floor / footplate
    bag.add('footplate', box(2.6, 0.06, 3.1), { p: [0, 1.52, zm - 0.15] });
    // wooden duckboards
    for (let i = 0; i < 8; i++) bag.add('wood', box(0.55, 0.025, 0.32), { p: [(i % 2 ? 0.34 : -0.34), 1.56, zF - 0.25 - i * 0.34] });
    // rear toolbox / water-can lockers & lamp
    bag.add('wood', box(2.2, 0.06, 0.5), { p: [0, 2.1, zR + 0.05] });
    bag.add('iron', box(2.0, 0.05, 0.05), { p: [0, 2.06, zR + 0.32] });
    // storm sheet roll at the roof back edge
    bag.add('leather', cyl(0.09, 0.09, 2.5, 12, 'x'), { p: [0, 3.34, zR + 0.03] });

    // ---------- BACKHEAD on the firebox rear face (z = -2.55)
    const zB = -2.56;
    bag.add('black', box(1.7, 1.7, 0.06), { p: [0, 2.35, zB] });
    bag.add('green', box(1.7, 0.08, 0.1), { p: [0, 3.22, zB - 0.02] });
    // firehole door (rounded) with glowing fire
    bag.add('iron', extrude(roundedRect(0.52, 0.42, 0.08), 0.06, 0.01), { p: [0, 1.86, zB - 0.06] });
    bag.add('brass', torus(0.2, 0.016, 8, 24, 'z'), { p: [0, 1.86, zB - 0.105], s: [1.1, 0.85, 1] });
    bag.add('fire', box(0.3, 0.2, 0.01), { p: [0, 1.86, zB - 0.04] });
    bag.add('iron', box(0.32, 0.03, 0.03), { p: [0, 2.1, zB - 0.12] });
    bag.add('steel', cyl(0.02, 0.02, 0.22, 8, 'x'), { p: [0, 2.15, zB - 0.14] });
    // fire-hole door bar
    // regulator
    bag.add('brass', cyl(0.025, 0.025, 0.7, 10, 'x'), { p: [-0.25, 3.0, zB - 0.12] });
    bag.add('brass', cyl(0.018, 0.018, 0.45, 8, 'y'), { p: [-0.58, 3.22, zB - 0.12] });
    bag.add('wood', sphere(0.04, 10, 8), { p: [-0.58, 3.47, zB - 0.12] });
    // pressure gauges (dial discs in brass bezels)
    for (const [x, y, r] of [[0.32, 3.05, 0.12], [0.62, 3.05, 0.1], [-0.18, 2.62, 0.075]]) {
      bag.add('brass', torus(r, 0.016, 8, 20, 'z'), { p: [x, y, zB - 0.1] });
      bag.add('dial', cyl(r, r, 0.012, 20, 'z'), { p: [x, y, zB - 0.075] });
      bag.add('steel', box(0.01, r * 0.8, 0.008), { p: [x, y + r * 0.2, zB - 0.095], r: [0, 0, 0.8] });
    }
    // water gauge glasses with brass frames
    for (const x of [-0.72, 0.72]) {
      bag.add('brass', cyl(0.028, 0.028, 0.66, 10, 'y'), { p: [x, 2.65, zB - 0.1] });
      bag.add('glass', cyl(0.02, 0.02, 0.5, 8, 'y'), { p: [x, 2.65, zB - 0.12] });
      bag.add('brass', cyl(0.04, 0.04, 0.06, 10, 'y'), { p: [x, 2.98, zB - 0.1] });
      bag.add('brass', cyl(0.04, 0.04, 0.06, 10, 'y'), { p: [x, 2.32, zB - 0.1] });
    }
    // valve wheels (injector steam & water, blower, ejector)
    for (let i = 0; i < 6; i++) {
      const x = -0.65 + i * 0.26;
      bag.add('brass', cyl(0.018, 0.018, 0.1, 6, 'z'), { p: [x, 2.5, zB - 0.1] });
      bag.add('brass', torus(0.05, 0.011, 6, 12, 'z'), { p: [x, 2.5, zB - 0.16] });
    }
    // steam manifold pipe
    bag.add('copper', tube([[-0.9, 2.8, zB - 0.05], [0.9, 2.8, zB - 0.05]], 0.026, 8, 4));
    // reversing lever with quadrant, brake handle
    bag.add('steel', box(0.03, 1.2, 0.03), { p: [-1.0, 2.1, zB - 0.5], r: [0.28, 0, 0] });
    bag.add('iron', extrude(roundedRect(0.5, 0.16, 0.05), 0.025, 0), { p: [-1.0, 1.7, zB - 0.7] });
    bag.add('brass', sphere(0.035, 10, 8), { p: [-1.0, 2.65, zB - 0.63] });
    bag.add('steel', cyl(0.02, 0.02, 0.9, 8, 'y'), { p: [1.0, 2.0, zB - 0.4] });
    bag.add('wood', cyl(0.028, 0.028, 0.35, 8, 'x'), { p: [1.0, 2.45, zB - 0.4] });
    // fire irons rack and shovel leaning
    bag.add('iron', box(0.02, 1.0, 0.02), { p: [0.55, 2.0, zB - 0.4], r: [0.0, 0, 0.12] });
    bag.add('iron', box(0.2, 0.01, 0.22), { p: [0.52, 1.52, zB - 0.4] });
    // whistle chain (brass thin line)
    bag.add('brass', tube([[-0.28, 3.4, 0.1], [-0.5, 3.3, -0.5], [-0.58, 3.3, zB - 0.12]], 0.006, 4, 6));
    // cab lamp
    bag.add('brass', lathe([[0.001, 0], [0.06, 0], [0.05, 0.12], [0.001, 0.14]], 10, 'y'), { p: [0.9, 3.24, zF - 0.3] });
    // coal shovel heap on floor
    const rng = new Rng(5);
    for (let i = 0; i < 24; i++) bag.add('coal', sphere(rng.range(0.03, 0.06), 5, 4), { p: [rng.range(-0.3, 0.9), 1.6, rng.range(zB - 0.9, zB - 0.4)] });
    // nameplate-ish builders plate on the splasher side
    // cab roof bracket etc. omitted
  }

  // ============================================================ RUNNING GEAR
  private buildRunningGear() {
    const mat = packedMaterial();
    const green = new THREE.Color().setRGB(0.055, 0.29, 0.16, THREE.SRGBColorSpace);
    // one driving-wheelset geometry (3 instances); crank pins sit 90 degrees apart left/right
    const driverGeo = packWheelset(
      { radius: LOCO.driverR, spokes: 18, hubR: 0.22, crank: { r: LOCO.crankR, right: 0, left: -Math.PI / 2, len: 0.38, boss: 0.1 }, counterweight: true, axleR: 0.11 },
      green,
    );
    const nodes: THREE.Object3D[] = [];
    for (const z of LOCO.driverZ) {
      const n = new THREE.Object3D();
      n.position.set(0, LOCO.driverR, z);
      this.root.add(n);
      nodes.push(n);
      this.driverSets.push(n);
    }
    this.batches.push(new InstBatch(driverGeo, mat, nodes));

    // return cranks: arms from the crank pin to the eccentric-rod pin, spinning with the main axle
    const parts: PackPart[] = [];
    for (const sd of [-1, 1]) {
      const a = sd > 0 ? 0 : -Math.PI / 2;
      const L = RR + 0.05;
      const arm = box(0.025, 0.07, L);
      arm.translate(0, 0, L / 2 - 0.03);
      arm.applyMatrix4(new THREE.Matrix4().makeRotationX(a));
      arm.translate(sd * X_VG, LOCO.crankR * Math.cos(a), LOCO.crankR * Math.sin(a));
      parts.push({ geo: arm, color: STEEL_DARK, metal: 1, rough: 0.4 });
      const tip = cyl(0.05, 0.05, 0.05, 12, 'x');
      tip.translate(sd * (X_VG + 0.02), LOCO.crankR * Math.cos(a) - RR * Math.sin(a), LOCO.crankR * Math.sin(a) + RR * Math.cos(a));
      parts.push({ geo: tip, color: BRASS, metal: 1, rough: 0.3 });
    }
    const retNode = new THREE.Object3D();
    retNode.position.set(0, LOCO.driverR, 0);
    this.root.add(retNode);
    this.driverSets.push(retNode);
    this.batches.push(new InstBatch(packGeometry(parts), mat, [retNode]));

    this.buildRods();
  }

  private buildRods() {
    const mat = packedMaterial();
    const node = (x: number): THREE.Object3D => {
      const n = new THREE.Object3D();
      n.position.x = x;
      this.chassis.add(n);
      return n;
    };
    const boss = (r: number, w: number, z: number, y = 0) => {
      const g = cyl(r, r, w, 16, 'x');
      g.translate(0, y, z);
      return { geo: g, color: BRASS, metal: 1, rough: 0.28 } as PackPart;
    };
    const steel = (g: THREE.BufferGeometry): PackPart => ({ geo: g, color: STEEL, metal: 1, rough: 0.24 });
    const pair = (geo: THREE.BufferGeometry, x: number): [THREE.Object3D, THREE.Object3D] => {
      const r = node(x), l = node(-x);
      this.batches.push(new InstBatch(geo, mat, [r, l]));
      return [r, l];
    };

    const main = pair(packGeometry([steel(rodGeo(LOCO.mainRod, 0.26, 0.17, 0.045, 0.05)), boss(0.092, 0.06, 0), boss(0.062, 0.06, LOCO.mainRod)]), X_MAIN);
    const cF = pair(packGeometry([steel(rodGeo(2.15, 0.17, 0.17, 0.035, 0.05)), boss(0.075, 0.045, 0), boss(0.075, 0.045, 2.15)]), X_RODS);
    const cR = pair(packGeometry([steel(rodGeo(2.15, 0.17, 0.17, 0.035, 0.05)), boss(0.075, 0.045, 0), boss(0.075, 0.045, 2.15)]), X_RODS);

    const ch1 = box(0.1, 0.24, 0.3);
    const ch2 = box(0.06, 0.12, 0.22);
    ch2.translate(0, 0, -0.2);
    const ch3 = box(0.03, 0.2, 0.05);
    ch3.translate(0, -0.14, 0.14);
    const crossG = packGeometry([steel(ch1), steel(ch2), steel(ch3), boss(0.05, 0.12, 0)]);
    const cross = pair(crossG, X_MAIN);
    const pr = cyl(0.03, 0.03, LOCO.pistonRod, 14, 'z');
    pr.translate(0, 0, LOCO.pistonRod / 2);
    const gland = cyl(0.045, 0.045, 0.03, 14, 'z');
    const pist = pair(packGeometry([steel(pr), { geo: gland, color: BRASS, metal: 1, rough: 0.3 }]), X_MAIN);

    const ecc = pair(packGeometry([steel(rodGeo(1.46, 0.07, 0.07, 0.03, 0.025, false)), boss(0.04, 0.035, 0), boss(0.04, 0.035, 1.46)]), X_VG + 0.05);

    const lk = new THREE.Shape();
    {
      const hw = 0.045, hl = 0.32;
      lk.moveTo(-hw, -hl); lk.lineTo(hw, -hl); lk.lineTo(hw, hl); lk.lineTo(-hw, hl); lk.lineTo(-hw, -hl);
      const slot = new THREE.Path();
      slot.moveTo(-0.014, -0.26); slot.lineTo(0.014, -0.26); slot.lineTo(0.014, 0.24); slot.lineTo(-0.014, 0.24); slot.lineTo(-0.014, -0.26);
      lk.holes.push(slot);
    }
    const lkG = new THREE.ExtrudeGeometry(lk, { depth: 0.03, bevelEnabled: false });
    lkG.translate(0, 0, -0.015);
    alongZ(lkG);
    const link = pair(packGeometry([steel(lkG), boss(0.045, 0.05, 0)]), X_VG + 0.02);
    const die = pair(packGeometry([{ geo: box(0.05, 0.05, 0.026), color: BRASS, metal: 1, rough: 0.3 }]), X_VG + 0.02);
    const rad = pair(packGeometry([steel(rodGeo(1.5, 0.05, 0.05, 0.025, 0.018, false))]), X_VG + 0.03);
    const lev = pair(packGeometry([steel(rodGeo(0.6, 0.06, 0.05, 0.025, 0.018, false))]), X_VG + 0.01);
    const vg = cyl(0.022, 0.022, 1.0, 10, 'z');
    vg.translate(0, 0, 0.5);
    const vrod = pair(packGeometry([steel(vg)]), X_MAIN);

    [1, -1].forEach((s, i) => {
      this.sides.push({
        s, main: main[i], coupF: cF[i], coupR: cR[i], crosshead: cross[i], pistonRod: pist[i], eccRod: ecc[i], link: link[i], radRod: rad[i],
        lever: lev[i], valveRod: vrod[i], dieBlock: die[i], beta: 0, stroke: 0,
      });
    });
    // node x for the left side is mirrored
    for (const sd of this.sides) {
      for (const n of [sd.main, sd.coupF, sd.coupR, sd.crosshead, sd.pistonRod, sd.eccRod, sd.link, sd.radRod, sd.lever, sd.valveRod, sd.dieBlock]) {
        n.position.x = sd.s * Math.abs(n.position.x);
      }
    }
  }

  // ============================================================== BOGIES
  private buildBogies() {
    const m = this.mats;
    const mat = packedMaterial();
    const green = new THREE.Color().setRGB(0.055, 0.29, 0.16, THREE.SRGBColorSpace);
    const bag = new Bag();
    for (const sd of [-1, 1]) {
      bag.add('black', box(0.04, 0.3, 2.7), { p: [sd * 0.62, 0.78, 0] });
      for (const z of [-0.95, 0.95]) {
        bag.add('iron', box(0.12, 0.26, 0.3), { p: [sd * 0.66, 0.66, z] });
        bag.add('steel', tube([[sd * 0.7, 1.0, z - 0.5], [sd * 0.7, 1.06, z], [sd * 0.7, 1.0, z + 0.5]], 0.02, 6, 8));
      }
      bag.add('iron', box(0.05, 0.1, 1.9), { p: [sd * 0.62, 1.0, 0] });
    }
    bag.add('black', box(1.3, 0.14, 0.28), { p: [0, 0.82, 0] });
    bag.add('iron', cyl(0.12, 0.12, 0.24, 14, 'y'), { p: [0, 0.97, 0] });
    bag.add('iron', box(1.3, 0.1, 0.1), { p: [0, 0.6, 0.95] });
    bag.add('iron', box(1.3, 0.1, 0.1), { p: [0, 0.6, -0.95] });
    this.bogie.add(bag.build(m as Record<string, THREE.Material>));

    const bg = packWheelset({ radius: LOCO.bogieR, spokes: 12, hubR: 0.13, axleR: 0.07 }, green);
    const bn: THREE.Object3D[] = [];
    for (const z of [-0.95, 0.95]) {
      const n = new THREE.Object3D();
      n.position.set(0, LOCO.bogieR, z);
      this.bogie.add(n);
      bn.push(n);
      this.bogieSets.push(n);
    }
    this.batches.push(new InstBatch(bg, mat, bn));

    const tb = new Bag();
    for (const sd of [-1, 1]) {
      tb.add('black', box(0.04, 0.3, 1.4), { p: [sd * 0.62, 0.78, 0] });
      tb.add('iron', box(0.12, 0.26, 0.3), { p: [sd * 0.66, 0.66, 0] });
      tb.add('steel', tube([[sd * 0.7, 1.0, -0.55], [sd * 0.7, 1.08, 0], [sd * 0.7, 1.0, 0.55]], 0.02, 6, 8));
    }
    this.trailing.add(tb.build(m as Record<string, THREE.Material>));
    const tn = new THREE.Object3D();
    tn.position.set(0, LOCO.trailR, 0);
    this.trailing.add(tn);
    this.trailSet = tn;
    this.batches.push(new InstBatch(packWheelset({ radius: LOCO.trailR, spokes: 12, hubR: 0.14, axleR: 0.07 }, green), mat, [tn]));
  }

  // ============================================================== ANIMATION
  /**
   * Advance mechanical state. theta = driver wheel rotation (rad, increasing when moving forward).
   */
  update(theta: number, firebox: number, headlamp: boolean, time: number) {
    this.theta = theta;
    for (const g of this.driverSets) g.rotation.x = theta;
    for (const g of this.bogieSets) g.rotation.x = theta * (LOCO.driverR / LOCO.bogieR);
    this.trailSet.rotation.x = theta * (LOCO.driverR / LOCO.trailR);

    for (const side of this.sides) {
      const a = theta + (side.s > 0 ? 0 : -Math.PI / 2);
      const sinA = Math.sin(a), cosA = Math.cos(a);
      const Y0 = LOCO.driverR;
      // crank pins on each axle
      const pinY = Y0 + LOCO.crankR * cosA;
      const pinZ = [0, 1, 2].map((i) => LOCO.driverZ[i] + LOCO.crankR * sinA);
      const P2 = { y: pinY, z: pinZ[1] };
      // crosshead
      const dyx = P2.y - LOCO.yCyl;
      const Xz = P2.z + Math.sqrt(LOCO.mainRod * LOCO.mainRod - dyx * dyx);
      const rodTo = (grp: THREE.Object3D, ay: number, az: number, by: number, bz: number) => {
        grp.position.y = ay;
        grp.position.z = az;
        grp.rotation.x = Math.atan2(-(by - ay), bz - az);
      };
      rodTo(side.main, P2.y, P2.z, LOCO.yCyl, Xz);
      rodTo(side.coupF, pinY, pinZ[1], pinY, pinZ[0]);
      rodTo(side.coupR, pinY, pinZ[2], pinY, pinZ[1]);
      side.crosshead.position.set(side.crosshead.position.x, LOCO.yCyl, Xz);
      side.pistonRod.position.set(side.pistonRod.position.x, LOCO.yCyl, Xz);
      side.stroke = (Xz - 2.43) / 0.64;

      // return crank point (attached to crank pin, 90° ahead, offset RR)
      const Ry = pinY - RR * sinA;
      const Rz = pinZ[1] + RR * cosA;
      // expansion link: trunnion T0, foot on arc radius lf
      const T0y = 1.52, T0z = 1.35, lf = 0.3, Le = 1.46;
      const dx = Rz - T0z, dy = Ry - T0y;
      const d = Math.hypot(dx, dy);
      const cosg = (lf * lf + d * d - Le * Le) / (2 * lf * d);
      const gam = Math.acos(Math.max(-1, Math.min(1, cosg)));
      const phi = Math.atan2(dy, dx); // direction T0 -> R in (z,y)
      // two candidate foot directions: phi ± gam; choose the one closer to hanging down
      const cands = [phi + gam, phi - gam];
      let best = cands[0], bestScore = 1e9;
      for (const ang of cands) {
        const fz = Math.cos(ang), fy = Math.sin(ang);
        const score = Math.abs(Math.atan2(fz, -fy) - side.beta);
        if (score < bestScore) { bestScore = score; best = ang; }
      }
      const fz = T0z + lf * Math.cos(best), fy = T0y + lf * Math.sin(best);
      const beta = Math.atan2(Math.cos(best), -Math.sin(best));
      side.beta = beta;
      rodTo(side.eccRod, Ry, Rz, fy, fz);
      side.link.position.set(side.link.position.x, T0y, T0z);
      side.link.rotation.x = -beta;
      // die block on the link, above the trunnion
      const ds = 0.1;
      const Dy = T0y + ds * Math.cos(beta), Dz = T0z - ds * Math.sin(beta);
      side.dieBlock.position.set(side.dieBlock.position.x, Dy, Dz);
      side.dieBlock.rotation.x = -beta;
      // radius rod to the combination lever
      const yE = 1.616, yB = 1.2, yV = 1.72, q = 0.8;
      const Lr = 1.5;
      const Ez = Dz + Math.sqrt(Math.max(0.01, Lr * Lr - (yE - Dy) * (yE - Dy)));
      rodTo(side.radRod, Dy, Dz, yE, Ez);
      // combination lever: bottom pinned to crosshead arm, top slides on valve-rod line
      const Bz = Xz + 0.14;
      const Vz = Bz + (Ez - Bz) / q;
      const lev = side.lever;
      const lvLen = Math.hypot(Vz - Bz, yV - yB);
      lev.position.set(lev.position.x, yB, Bz);
      lev.rotation.x = Math.atan2(-(yV - yB), Vz - Bz);
      lev.scale.z = lvLen / 0.6;
      // valve rod from V forward
      side.valveRod.position.set(side.valveRod.position.x, yV, Vz);
    }

    // glowing firebox and headlamp
    const flick = 0.8 + 0.2 * Math.sin(time * 13.0) * Math.sin(time * 7.3 + 1.0);
    this.fireLight.intensity = firebox * 7 * flick;
    this.fireMat.color.setRGB(1.0 * (0.9 + 0.1 * flick), 0.34 * flick, 0.07);
    this.headLight.intensity = headlamp ? 35 : 0;
    this.glow.visible = headlamp;
    this.lampMat.visible = true;
    (this.lampMat.color as THREE.Color).setRGB(headlamp ? 5.5 : 0.5, headlamp ? 3.6 : 0.4, headlamp ? 1.6 : 0.3);
  }
}

function clampN(x: number): number {
  return x < -1 ? -1 : x > 1 ? 1 : x;
}

void xf;
