import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Bag, box, cyl, lathe, sphere, torus, tube, extrude, alongZ, prep, xf } from './geo';
import { packWheelset, packedMaterial, InstBatch } from './inst';
import { makeCarriageMaterials, TrainMaterials } from './materials';
import { makeTextTexture, decalMaterial } from './decals';

export const COACH = {
  bodyHalf: 7.5,
  beamZ: 7.62,
  bufferTip: 8.1,
  length: 16.2,
  bogieZ: 5.2,
  bogieAxle: 1.2,
  wheelR: 0.5,
  halfW: 1.31,
};

/** Flat sheet in the z-y plane with rectangular holes, thickness along x. */
function sheet(z0: number, z1: number, y0: number, y1: number, holes: [number, number, number, number][] = [], thick = 0.05, r = 0.04): THREE.BufferGeometry {
  const sh = new THREE.Shape();
  sh.moveTo(z0, y0);
  sh.lineTo(z1, y0);
  sh.lineTo(z1, y1);
  sh.lineTo(z0, y1);
  sh.lineTo(z0, y0);
  for (const [a, b, c, d] of holes) {
    const h = new THREE.Path();
    h.moveTo(a + r, b);
    h.lineTo(c - r, b);
    h.quadraticCurveTo(c, b, c, b + r);
    h.lineTo(c, d - r);
    h.quadraticCurveTo(c, d, c - r, d);
    h.lineTo(a + r, d);
    h.quadraticCurveTo(a, d, a, d - r);
    h.lineTo(a, b + r);
    h.quadraticCurveTo(a, b, a + r, b);
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -thick / 2);
  return alongZ(g);
}

/** Thin rectangular frame (outline) in the z-y plane. */
function frameRect(z0: number, z1: number, y0: number, y1: number, w: number, thick: number): THREE.BufferGeometry {
  return sheet(z0 - w, z1 + w, y0 - w, y1 + w, [[z0, y0, z1, y1]], thick, 0.0);
}

interface Built {
  statics: Record<string, THREE.BufferGeometry>;
  bogieStatics: Record<string, THREE.BufferGeometry>;
  wheelPacked: THREE.BufferGeometry;
  decals: THREE.BufferGeometry;
}

export class CarriageFactory {
  readonly mats: TrainMaterials;
  private built: Built;
  private labels = new Map<string, THREE.Material>();

  constructor() {
    this.mats = makeCarriageMaterials();
    this.built = this.buildAll();
  }

  private buildAll(): Built {
    const body = new Bag();
    const HW = COACH.halfW;
    const L = COACH.bodyHalf;
    const comp = [-6, -3, 0, 3, 6];

    // ---- lower panels (lake) and upper band (cream)
    const windowHoles: [number, number, number, number][] = [];
    for (const zc of comp) {
      windowHoles.push([zc - 1.17, 2.12, zc - 0.07, 2.98]); // fixed light
      windowHoles.push([zc + 0.2, 2.15, zc + 0.96, 2.98]); // door light
    }
    for (const sd of [-1, 1]) {
      body.add('lake', sheet(-L, L, 0.86, 2.04, [], 0.05), { p: [sd * HW, 0, 0] });
      body.add('cream', sheet(-L, L, 2.04, 3.2, windowHoles, 0.05), { p: [sd * HW, 0, 0] });
      // waist moulding and cantrail
      body.add('gold', box(0.03, 0.025, 2 * L), { p: [sd * (HW + 0.02), 2.04, 0] });
      body.add('gold', box(0.03, 0.02, 2 * L), { p: [sd * (HW + 0.02), 0.92, 0] });
      body.add('timber', box(0.05, 0.07, 2 * L + 0.1), { p: [sd * (HW + 0.0), 3.22, 0] });
      body.add('timber', box(0.06, 0.1, 2 * L + 0.05), { p: [sd * (HW + 0.01), 0.84, 0] });
      for (const zc of comp) {
        // raised door panel on the lower body with gilt bead, handle, hinges, grab bar
        const dz0 = zc + 0.12, dz1 = zc + 1.04;
        body.add('lake', sheet(dz0, dz1, 0.9, 2.02, [], 0.02), { p: [sd * (HW + 0.03), 0, 0] });
        body.add('gold', frameRect(dz0 + 0.07, dz1 - 0.07, 1.0, 1.92, 0.012, 0.01), { p: [sd * (HW + 0.045), 0, 0] });
        // upper door frame (cream bead around the door light)
        body.add('timber', frameRect(zc + 0.2, zc + 0.96, 2.15, 2.98, 0.035, 0.07), { p: [sd * (HW + 0.0), 0, 0] });
        body.add('timber', frameRect(zc - 1.17, zc - 0.07, 2.12, 2.98, 0.035, 0.07), { p: [sd * (HW + 0.0), 0, 0] });
        // door vertical edges (shut lines)
        body.add('under', box(0.03, 2.2, 0.012), { p: [sd * (HW + 0.03), 2.0, dz0] });
        body.add('under', box(0.03, 2.2, 0.012), { p: [sd * (HW + 0.03), 2.0, dz1] });
        // brass handle + hinges + grab handle
        body.add('brass', cyl(0.015, 0.015, 0.16, 8, 'z'), { p: [sd * (HW + 0.07), 2.05, dz0 + 0.08] });
        body.add('brass', sphere(0.03, 8, 6), { p: [sd * (HW + 0.07), 2.05, dz0 + 0.02] });
        for (const hy of [1.0, 2.0, 2.9]) body.add('iron', box(0.025, 0.07, 0.14), { p: [sd * (HW + 0.045), hy, dz1 - 0.07] });
        body.add('brass', tube([[sd * (HW + 0.03), 3.05, dz1 + 0.12], [sd * (HW + 0.1), 3.05, dz1 + 0.12], [sd * (HW + 0.1), 1.2, dz1 + 0.12], [sd * (HW + 0.03), 1.2, dz1 + 0.12]], 0.014, 6, 3));
        // glass + droplight strap
        body.add('glass', box(0.012, 0.83, 0.76), { p: [sd * (HW - 0.01), 2.565, zc + 0.58] });
        body.add('glass', box(0.012, 0.86, 1.1), { p: [sd * (HW - 0.01), 2.55, zc - 0.62] });
        body.add('leather', box(0.02, 0.22, 0.04), { p: [sd * (HW + 0.045), 2.82, zc + 0.58] });
        // window centre bars
        body.add('timber', box(0.04, 0.86, 0.035), { p: [sd * (HW + 0.0), 2.55, zc - 0.62] });
        // footboard bracket
        body.add('iron', box(0.04, 0.2, 0.05), { p: [sd * (HW + 0.18), 0.62, zc + 0.3] });
        body.add('iron', box(0.04, 0.2, 0.05), { p: [sd * (HW + 0.18), 0.62, zc + 0.88] });
        // door ventilator / toplight louvres above the windows
        for (let k = 0; k < 4; k++) body.add('timber', box(0.02, 0.02, 0.5), { p: [sd * (HW + 0.03), 3.07 + k * 0.025, zc + 0.58] });
      }
      // footboard (running step) along the whole side
      body.add('timber', box(0.28, 0.04, 2 * L - 0.3), { p: [sd * (HW + 0.18), 0.66, 0] });
      body.add('iron', box(0.02, 0.025, 2 * L - 0.3), { p: [sd * (HW + 0.32), 0.66, 0] });
      // lamp-iron brackets and roof drain
      body.add('iron', cyl(0.02, 0.02, 0.2, 6, 'y'), { p: [sd * (HW + 0.05), 3.3, 7.3] });
    }

    // ---- ends
    for (const dir of [-1, 1]) {
      body.add('lake', box(2 * HW, 2.33, 0.05), { p: [0, 2.04, dir * (L + 0.0)] });
      body.add('gold', frameRect(-0.9, 0.9, 1.2, 2.9, 0.012, 0.01).applyMatrix4(new THREE.Matrix4()), { p: [0, 0, dir * (L + 0.04)], r: [0, Math.PI / 2, 0] });
      // end panel details: lamp iron, tail lamp bracket, door-less
      body.add('iron', box(0.1, 0.07, 0.12), { p: [0, 3.0, dir * (L + 0.08)] });
      body.add('iron', box(0.1, 0.07, 0.12), { p: [0.8, 1.4, dir * (L + 0.08)] });
      body.add('iron', box(0.1, 0.07, 0.12), { p: [-0.8, 1.4, dir * (L + 0.08)] });
      // end steps and grab rails at the corners
      for (const sd of [-1, 1]) body.add('brass', tube([[sd * 1.15, 3.1, dir * (L + 0.1)], [sd * 1.15, 1.0, dir * (L + 0.1)]], 0.014, 6, 2));
      // headstock beam with buffers and couplings
      body.add('red', box(2.64, 0.4, 0.1), { p: [0, 0.98, dir * COACH.beamZ] });
      body.add('iron', box(2.5, 0.14, 0.12), { p: [0, 0.74, dir * (COACH.beamZ - 0.05)] });
      for (const sd of [-1, 1]) {
        body.add('steel', cyl(0.1, 0.1, 0.38, 18, 'z'), { p: [sd * 0.9, 0.98, dir * (COACH.beamZ + 0.24)] });
        body.add('steel', lathe([[0.001, 0.0], [0.2, 0.0], [0.21, 0.02], [0.21, 0.05], [0.18, 0.07], [0.001, 0.075]], 24, 'z'), { p: [sd * 0.9, 0.98, dir * (COACH.beamZ + 0.4)], s: [1, 1, dir] });
        body.add('iron', box(0.1, 0.46, 0.2), { p: [sd * 0.9, 0.98, dir * (COACH.beamZ - 0.12)] });
      }
      // screw coupling: hook + shackle + screw + safety chains
      body.add('iron', box(0.1, 0.1, 0.4), { p: [0, 0.92, dir * (COACH.beamZ + 0.16)] });
      body.add('steel', torus(0.09, 0.016, 6, 18, 'x'), { p: [0, 0.8, dir * (COACH.beamZ + 0.42)] });
      body.add('steel', cyl(0.02, 0.02, 0.5, 8, 'z'), { p: [0, 0.8, dir * (COACH.beamZ + 0.3)] });
      for (const sd of [-1, 1]) {
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 8; i++) {
          const t = i / 8;
          pts.push([sd * (0.24 - t * 0.2), 0.84 - Math.sin(t * Math.PI) * 0.11, dir * (COACH.beamZ + 0.05 + t * 0.4)]);
        }
        body.add('iron', tube(pts, 0.008, 5, 4));
      }
      // brake / heating pipes with flexible hoses
      body.add('iron', tube([[0.34, 0.95, dir * (COACH.beamZ + 0.02)], [0.36, 1.2, dir * (COACH.beamZ + 0.18)], [0.3, 1.38, dir * (COACH.beamZ + 0.12)]], 0.028, 8, 6));
      body.add('rubber', tube([[-0.34, 0.95, dir * (COACH.beamZ + 0.02)], [-0.38, 1.12, dir * (COACH.beamZ + 0.22)], [-0.3, 1.34, dir * (COACH.beamZ + 0.15)]], 0.036, 8, 6));
      body.add('brass', cyl(0.05, 0.05, 0.05, 10, 'y'), { p: [-0.3, 1.38, dir * (COACH.beamZ + 0.15)] });
      body.add('brass', cyl(0.045, 0.045, 0.05, 10, 'y'), { p: [0.3, 1.4, dir * (COACH.beamZ + 0.12)] });
    }

    // ---- roof: elliptical arch with ribs, vents and lamp pots
    {
      const n = 28, h0 = 3.18, rise = 0.5, hw = 1.4;
      const sh = new THREE.Shape();
      for (let i = 0; i <= n; i++) {
        const t = -1 + (2 * i) / n;
        const x = t * hw;
        const y = h0 + rise * Math.sqrt(Math.max(0, 1 - t * t * 0.96));
        if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
      }
      for (let i = n; i >= 0; i--) {
        const t = -1 + (2 * i) / n;
        sh.lineTo(t * (hw - 0.05), h0 - 0.04 + (rise - 0.01) * Math.sqrt(Math.max(0, 1 - t * t * 0.96)));
      }
      const g = extrude(sh, 2 * L + 0.5, 0.01);
      body.add('roof', g);
      // canvas-seam ribs
      for (let i = 0; i <= 30; i++) {
        const z = -L - 0.2 + (i * (2 * L + 0.4)) / 30;
        const rib = new THREE.Shape();
        const nn = 22;
        for (let k = 0; k <= nn; k++) {
          const t = -1 + (2 * k) / nn;
          const y = h0 + 0.012 + rise * Math.sqrt(Math.max(0, 1 - t * t * 0.96));
          if (k === 0) rib.moveTo(t * hw, y); else rib.lineTo(t * hw, y);
        }
        for (let k = nn; k >= 0; k--) {
          const t = -1 + (2 * k) / nn;
          rib.lineTo(t * hw, h0 - 0.01 + rise * Math.sqrt(Math.max(0, 1 - t * t * 0.96)));
        }
        body.add('roof', extrude(rib, 0.025, 0), { p: [0, 0.003, z] });
      }
      // rain gutters
      for (const sd of [-1, 1]) body.add('iron', box(0.04, 0.05, 2 * L + 0.5), { p: [sd * 1.4, 3.16, 0] });
      // torpedo ventilators and lamp pots
      for (const zc of comp) {
        body.add('steel', lathe([[0.001, -0.38], [0.07, -0.34], [0.1, -0.2], [0.11, 0], [0.1, 0.2], [0.07, 0.34], [0.001, 0.38]], 14, 'y').rotateX(Math.PI / 2), { p: [0, h0 + rise + 0.07, zc] });
        body.add('iron', box(0.18, 0.06, 0.07), { p: [0, h0 + rise + 0.01, zc - 0.18] });
        body.add('iron', box(0.18, 0.06, 0.07), { p: [0, h0 + rise + 0.01, zc + 0.18] });
        body.add('brass', lathe([[0.001, 0], [0.08, 0], [0.07, 0.07], [0.05, 0.13], [0.001, 0.15]], 12, 'y'), { p: [0, h0 + rise - 0.02, zc + 1.1] });
        body.add('iron', cyl(0.045, 0.045, 0.1, 10, 'y'), { p: [0, h0 + rise - 0.04, zc + 1.1] });
      }
      body.add('brass', lathe([[0.001, 0], [0.08, 0], [0.07, 0.07], [0.05, 0.13], [0.001, 0.15]], 12, 'y'), { p: [0, h0 + rise - 0.02, -L + 0.5] });
    }

    // ---- interior (emissive, warm gas-lit) seen through the windows
    for (const sd of [-1, 1]) {
      body.add('interior', box(0.02, 1.2, 2 * L - 0.1), { p: [sd * (HW - 0.06), 2.6, 0] });
    }
    body.add('interior', box(2 * HW - 0.1, 0.04, 2 * L - 0.1), { p: [0, 3.2, 0] });
    body.add('timber', box(2 * HW - 0.1, 0.06, 2 * L - 0.1), { p: [0, 0.97, 0] });
    for (const zc of comp) {
      for (const dz of [-1.5, 1.5]) {
        if (dz > 0 && zc === 6) {
          body.add('interior', box(2 * HW - 0.14, 2.3, 0.04), { p: [0, 2.1, zc + dz] });
          continue;
        }
        body.add('interior', box(2 * HW - 0.14, 2.3, 0.04), { p: [0, 2.1, zc + dz] });
      }
      for (const sd of [-1, 1]) {
        // bench seats facing each other across the compartment
        for (const f of [-1, 1]) {
          const zs = zc + f * 1.0;
          body.add('seat', box(0.62, 0.28, 1.0), { p: [sd * 0.78, 1.28, zs - f * 0.0] });
          body.add('seat', box(0.14, 0.9, 1.0), { p: [sd * 1.08, 1.8, zs] });
        }
      }
      // gas lamp globe
      body.add('lampGlow', sphere(0.11, 12, 8), { p: [0, 3.05, zc] });
      body.add('brass', cyl(0.03, 0.03, 0.12, 8, 'y'), { p: [0, 3.14, zc] });
      // luggage racks
      for (const sd of [-1, 1]) {
        body.add('brass', tube([[sd * 1.2, 2.55, zc - 1.2], [sd * 1.2, 2.55, zc + 1.2]], 0.012, 6, 2));
        body.add('brass', tube([[sd * 0.9, 2.5, zc - 1.2], [sd * 0.9, 2.5, zc + 1.2]], 0.012, 6, 2));
      }
    }

    // ---- underframe
    body.add('under', box(2.42, 0.1, 2 * L), { p: [0, 0.8, 0] });
    for (const sd of [-1, 1]) {
      body.add('iron', box(0.08, 0.22, 2 * L + 0.2), { p: [sd * 1.18, 0.74, 0] });
      // trussing: truss rods with queen posts
      body.add('iron', tube([[sd * 1.0, 0.7, -6.8], [sd * 1.0, 0.38, -2.6], [sd * 1.0, 0.38, 2.6], [sd * 1.0, 0.7, 6.8]], 0.022, 8, 14));
      for (const z of [-2.6, 2.6]) body.add('iron', box(0.05, 0.36, 0.08), { p: [sd * 1.0, 0.55, z] });
    }
    // brake cylinder, gas bottles, battery/axle-generator boxes
    body.add('iron', cyl(0.22, 0.22, 1.1, 16, 'z'), { p: [0, 0.5, 0.4] });
    body.add('steel', cyl(0.05, 0.05, 0.5, 8, 'z'), { p: [0, 0.5, -0.5] });
    for (const sd of [-1, 1]) {
      body.add('under', cyl(0.2, 0.2, 3.2, 16, 'z'), { p: [sd * 0.55, 0.5, 4.2] });
      body.add('under', cyl(0.2, 0.2, 3.2, 16, 'z'), { p: [sd * 0.55, 0.5, -4.2] });
      for (const z of [2.7, 5.7, -2.7, -5.7]) body.add('iron', box(0.07, 0.07, 0.2), { p: [sd * 0.55, 0.28, z] });
    }
    body.add('under', box(1.2, 0.3, 0.8), { p: [-0.4, 0.55, -1.8] });
    body.add('under', box(0.9, 0.3, 0.6), { p: [0.5, 0.55, -1.8] });
    // vacuum pipe along the frame
    body.add('iron', tube([[0.34, 0.8, -7.7], [0.34, 0.8, 7.7]], 0.026, 8, 4));

    // ---- decal (class numerals), merged into one mesh
    const geos: THREE.BufferGeometry[] = [];
    for (const sd of [-1, 1]) {
      for (const zc of comp) {
        const g = new THREE.PlaneGeometry(0.5, 0.3);
        g.rotateY(sd * Math.PI / 2);
        g.translate(sd * (HW + 0.045), 1.45, zc + 0.58);
        geos.push(prep(g));
      }
    }
    const decals = mergeGeometries(geos)!;

    const statics: Record<string, THREE.BufferGeometry> = {};
    for (const k of body.keys()) statics[k] = body.merged(k)!;

    // ---- bogie statics
    const bg = new Bag();
    const ax = COACH.bogieAxle;
    for (const sd of [-1, 1]) {
      bg.add('under', box(0.05, 0.3, 2 * ax + 0.5), { p: [sd * 0.62, 0.72, 0] });
      bg.add('iron', box(0.04, 0.12, 2 * ax + 0.6), { p: [sd * 0.62, 0.9, 0] });
      for (const z of [-ax, ax]) {
        bg.add('iron', box(0.12, 0.3, 0.3), { p: [sd * 0.68, 0.6, z] });
        // leaf spring
        bg.add('steel', tube([[sd * 0.72, 0.86, z - 0.5], [sd * 0.72, 0.93, z - 0.2], [sd * 0.72, 0.95, z], [sd * 0.72, 0.93, z + 0.2], [sd * 0.72, 0.86, z + 0.5]], 0.018, 6, 8));
        bg.add('iron', cyl(0.012, 0.012, 0.3, 6, 'y'), { p: [sd * 0.72, 0.78, z - 0.5] });
        bg.add('iron', cyl(0.012, 0.012, 0.3, 6, 'y'), { p: [sd * 0.72, 0.78, z + 0.5] });
        // brake block and hanger
        bg.add('iron', box(0.1, 0.13, 0.3), { p: [sd * 0.86, 0.38, z + (z > 0 ? 0.55 : -0.55)] });
      }
    }
    bg.add('under', box(1.3, 0.12, 0.28), { p: [0, 0.8, 0] });
    bg.add('iron', cyl(0.12, 0.12, 0.2, 12, 'y'), { p: [0, 0.92, 0] });
    bg.add('iron', box(1.3, 0.08, 0.1), { p: [0, 0.5, ax + 0.6] });
    bg.add('iron', box(1.3, 0.08, 0.1), { p: [0, 0.5, -ax - 0.6] });
    const bogieStatics: Record<string, THREE.BufferGeometry> = {};
    for (const k of bg.keys()) bogieStatics[k] = bg.merged(k)!;

    // ---- wheelset geometry (shared by every wheel on the train)
    const wheelPacked = packWheelset({ radius: COACH.wheelR, spokes: 12, hubR: 0.14, axleR: 0.075 }, new THREE.Color().setRGB(0.05, 0.05, 0.055, THREE.SRGBColorSpace));

    return { statics, bogieStatics, wheelPacked, decals };
  }

  private labelMaterial(text: string): THREE.Material {
    let m = this.labels.get(text);
    if (!m) {
      m = decalMaterial(makeTextTexture(text, 256, 160, { letterSpacing: 2 }));
      this.labels.set(text, m);
    }
    return m;
  }

  /** Build all instanced draw batches for a set of carriages (one draw per material for the whole rake). */
  batches(coaches: Carriage[]): InstBatch[] {
    const out: InstBatch[] = [];
    const b = this.built;
    const m = this.mats as Record<string, THREE.Material>;
    const bodies = coaches.map((c) => c.body);
    for (const k of Object.keys(b.statics)) {
      const noShadow = k === 'glass' || k === 'interior' || k === 'lampGlow';
      out.push(new InstBatch(b.statics[k], m[k], bodies, !noShadow));
    }
    // class legends: one batch per distinct label
    const byLabel = new Map<string, THREE.Object3D[]>();
    coaches.forEach((c) => {
      const arr = byLabel.get(c.label) ?? [];
      arr.push(c.body);
      byLabel.set(c.label, arr);
    });
    for (const [label, nodes] of byLabel) out.push(new InstBatch(b.decals, this.labelMaterial(label), nodes, false));
    const bogies = coaches.flatMap((c) => [c.bogieF, c.bogieR]);
    for (const k of Object.keys(b.bogieStatics)) out.push(new InstBatch(b.bogieStatics[k], m[k], bogies, true));
    const wheels = coaches.flatMap((c) => c.wheelNodes);
    out.push(new InstBatch(b.wheelPacked, packedMaterial(), wheels, true));
    return out;
  }

  create(label: string): Carriage {
    return new Carriage(label);
  }
}

/** Transform holder for one coach; geometry is drawn by the shared instanced batches. */
export class Carriage {
  readonly body = new THREE.Object3D();
  readonly root = new THREE.Object3D();
  readonly bogieF = new THREE.Object3D();
  readonly bogieR = new THREE.Object3D();
  readonly wheelNodes: THREE.Object3D[] = [];

  constructor(readonly label: string) {
    this.root.add(this.body);
    for (const bg of [this.bogieF, this.bogieR]) {
      for (const z of [-COACH.bogieAxle, COACH.bogieAxle]) {
        const n = new THREE.Object3D();
        n.position.set(0, COACH.wheelR, z);
        bg.add(n);
        this.wheelNodes.push(n);
      }
    }
  }

  update(theta: number) {
    for (const n of this.wheelNodes) n.rotation.x = theta;
  }
}

void xf;
