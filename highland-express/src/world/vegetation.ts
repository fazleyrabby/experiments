import * as THREE from 'three';
import { Landscape } from './landscape';
import { Track } from './track';
import { Rng, noise, smoothstep } from '../core/noise';
import { patch, WIND_VERT } from '../core/shaders';
import { pineMask, broadleafMask, moorMask, brackenMask } from './ecology';
import { VIADUCT } from './layout';
import type { Quality } from '../core/quality';
import {
  buildPine, buildScots, buildBroadleaf, buildHeather, buildGorse, buildBracken, buildGrass, buildFlower, buildRock,
  PineSpec, BroadSpec,
} from './flora';

const C = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

interface Variant {
  hi: THREE.BufferGeometry;
  lo?: THREE.BufferGeometry;
  mat: THREE.Material;
  hiDist: number; // switch to lo beyond this
  maxDist: number; // hide beyond this
  shadow: boolean;
  batch?: 'trees' | 'rocks';
  aoR?: number; // contact-shadow radius (metres, before instance scale)
  crown?: { kind: 'cone' | 'ball'; r: number; y0: number; y1: number }; // collision envelope (unit scale)
}

interface BatchInst {
  key: string;
  m: THREE.Matrix4;
  c: THREE.Color;
  x: number; y: number; z: number;
  hiDist: number;
  hiId: number;
  loId: number;
}

interface Inst {
  m: THREE.Matrix4;
  c?: THREE.Color;
}

interface CellGroup {
  hi: THREE.InstancedMesh;
  lo?: THREE.InstancedMesh;
  v: Variant;
}

interface Cell {
  cx: number; cz: number;
  groups: CellGroup[];
}

const CELL = 150;

export class Vegetation {
  readonly group = new THREE.Group();
  private variants = new Map<string, Variant>();
  private buckets = new Map<string, Map<string, Inst[]>>();
  private cells: Cell[] = [];
  private frame = 0;
  private batches: { hi: THREE.BatchedMesh; lo: THREE.BatchedMesh; inst: BatchInst[] }[] = [];
  private batchBuckets = new Map<string, BatchInst[]>();
  private ao: { x: number; y: number; z: number; r: number; op: number }[] = [];
  private colliders: { x: number; y: number; z: number; sx: number; sy: number; c: NonNullable<Variant['crown']> }[] = [];
  private hash = new Map<number, number[]>();
  stats = { trees: 0, shrubs: 0, grass: 0, flowers: 0, rocks: 0 };

  private q: Quality;

  constructor(private land: Landscape, private track: Track, quality: Quality) {
    this.q = quality;
    this.group.name = 'vegetation';
    this.makeVariants();
    this.place();
    this.finalize();
    this.buildContactAO();
    this.colliders.forEach((c, i) => {
      const k = Math.floor(c.x / 16) * 4096 + Math.floor(c.z / 16);
      let a = this.hash.get(k);
      if (!a) this.hash.set(k, (a = []));
      a.push(i);
    });
  }

  /** Nudge a point (the camera) out of tree crowns so orbiting never ploughs through foliage. */
  pushOut(p: THREE.Vector3, margin = 1.2): boolean {
    let moved = false;
    const cx = Math.floor(p.x / 16), cz = Math.floor(p.z / 16);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const arr = this.hash.get((cx + dx) * 4096 + (cz + dz));
        if (!arr) continue;
        for (const i of arr) {
          const t = this.colliders[i];
          const yr = (p.y - t.y) / t.sy;
          const c = t.c;
          if (yr < -0.5 || yr > c.y1 + 0.8) continue;
          let r: number;
          if (c.kind === 'cone') {
            if (yr < c.y0 * 0.6) r = 0.35;
            else r = c.r * Math.max(0.12, 1 - Math.max(0, yr - c.y0) / Math.max(0.1, c.y1 - c.y0));
          } else {
            const mid = (c.y0 + c.y1) / 2, hh = (c.y1 - c.y0) / 2 + 0.3;
            const k = (yr - mid) / hh;
            r = k * k >= 1 ? (yr < c.y0 ? 0.4 : 0) : c.r * Math.sqrt(1 - k * k);
          }
          if (r <= 0) continue;
          const rr = r * t.sx + margin;
          const ex = p.x - t.x, ez = p.z - t.z;
          const d = Math.hypot(ex, ez);
          if (d < rr) {
            const nx = d > 1e-3 ? ex / d : 1, nz = d > 1e-3 ? ez / d : 0;
            p.x = t.x + nx * (rr + 0.05);
            p.z = t.z + nz * (rr + 0.05);
            moved = true;
          }
        }
      }
    }
    return moved;
  }

  // ---------------------------------------------------------------- variants
  private makeVariants() {
    const a2c = this.q.msaa > 0;
    const dsc = this.q.veg.distScale;
    const foliage = (key: string, sway: number) =>
      patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, alphaToCoverage: sway <= 1.0 && this.q.msaa > 0 }), {
        key,
        vertDecl: `const float heSwayAmp = ${sway.toFixed(2)};`,
        vertMain: WIND_VERT,
        fragColor: /* glsl */ `
          float hv = heVNoise(vWPos * 1.6 + vRand * 20.0);
          diffuseColor.rgb *= 0.82 + 0.36 * hv;
          ${sway > 1.0 ? '' : `
          // leafy, ragged silhouettes: noise-driven cut-outs that grow towards the edges of each clump
          float leaf = step(vColor.r * 1.04, vColor.g);
          if (leaf > 0.5 && length(vViewPosition) < 420.0) {
            vec3 nn = normalize(vNormal);
            float facing = abs(dot(nn, normalize(vViewPosition)));
            float cn = heVNoise(vOPos * 10.0 + vRand * 11.0) * 0.6 + heVNoise(vOPos * 27.0 + 3.0) * 0.4;
            float cut = 0.22 + 0.5 * (1.0 - facing);
            diffuseColor.a = smoothstep(cut - 0.05, cut + 0.05, cn);
            if (diffuseColor.a < ${a2c ? '0.02' : '0.5'}) discard;
            diffuseColor.rgb *= 0.7 + 0.45 * heVNoise(vOPos * 16.0);
          }`}
        `,
        fragEmissive: /* glsl */ `
          vec3 Vv = normalize(cameraPosition - vWPos);
          float back = pow(clamp(dot(-Vv, uSunDir), 0.0, 1.0), 2.5);
          totalEmissiveRadiance += diffuseColor.rgb * back * 0.55;
        `,
      });
    const treeMat = foliage('tree', 0.5);
    const shrubMat = foliage('shrub', 1.1);
    const grassMat = foliage('grass', 2.2);
    const flowerMat = foliage('flower', 2.0);
    const rockMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), {
      key: 'rock',
      fragColor: /* glsl */ `
        float rn = heFbm(vWPos * 2.2 + vRand * 9.0);
        float rg = heVNoise(vWPos * 18.0);
        diffuseColor.rgb *= 0.7 + 0.55 * rn;
        diffuseColor.rgb *= 0.9 + 0.2 * rg;
      `,
      fragNormal: /* glsl */ `
        float hb = heFbm(vWPos * 6.0 + vRand * 5.0) * 0.8 + heVNoise(vWPos * 24.0) * 0.25;
        float bf = 1.0 - smoothstep(14.0, 70.0, length(vViewPosition));
        normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * (0.5 * bf), faceDirection);
      `,
    });

    // conifers
    const specs: PineSpec[] = [
      { height: 11, clear: 1.4, tiers: 16, radius: 2.2, droop: 0.42, blades: [22, 10], dark: C(0.035, 0.10, 0.05), light: C(0.09, 0.22, 0.09), taper: 0.9, jag: 0.0 },
      { height: 8.6, clear: 1.0, tiers: 13, radius: 1.9, droop: 0.62, blades: [20, 9], dark: C(0.04, 0.115, 0.055), light: C(0.11, 0.25, 0.10), taper: 0.85, jag: 0.1 },
      { height: 14, clear: 2.0, tiers: 19, radius: 1.7, droop: 0.3, blades: [18, 8], dark: C(0.03, 0.085, 0.045), light: C(0.07, 0.19, 0.09), taper: 1.0, jag: 0.0 },
      { height: 10, clear: 1.6, tiers: 14, radius: 1.8, droop: 0.7, blades: [16, 8], dark: C(0.09, 0.19, 0.07), light: C(0.22, 0.36, 0.12), taper: 0.9, jag: 0.2 }, // larch
    ];
    specs.forEach((s, i) => {
      const g = buildPine(s, 100 + i * 13);
      this.variants.set(`pine${i}`, { hi: g.hi, lo: g.lo, mat: treeMat, hiDist: 105 * dsc, maxDist: 1900, shadow: true, batch: 'trees', aoR: s.radius * 0.95, crown: { kind: 'cone', r: s.radius, y0: s.clear, y1: s.height } });
    });
    for (let i = 0; i < 3; i++) {
      const g = buildScots(300 + i * 7);
      this.variants.set(`scots${i}`, { hi: g.hi, lo: g.lo, mat: treeMat, hiDist: 105 * dsc, maxDist: 1700, shadow: true, batch: 'trees', aoR: 1.7, crown: { kind: 'ball', r: 2.6, y0: 6, y1: 13.5 } });
    }
    const broad: { key: string; spec: BroadSpec }[] = [
      { key: 'birch0', spec: { trunkH: 4.6, trunkR: 0.11, spread: 3.2, levels: 2, blobR: 1.15, bark: C(0.78, 0.76, 0.70), barkMark: C(0.07, 0.06, 0.05), leaf: C(0.26, 0.38, 0.10), leaf2: C(0.42, 0.50, 0.15), droop: 0.5 } },
      { key: 'birch1', spec: { trunkH: 5.6, trunkR: 0.12, spread: 3.6, levels: 2, blobR: 1.25, bark: C(0.8, 0.78, 0.72), barkMark: C(0.08, 0.07, 0.06), leaf: C(0.22, 0.34, 0.08), leaf2: C(0.38, 0.47, 0.12), droop: 0.7 } },
      { key: 'oak0', spec: { trunkH: 2.6, trunkR: 0.3, spread: 5.2, levels: 2, blobR: 2.0, bark: C(0.17, 0.12, 0.08), barkMark: C(0.08, 0.06, 0.04), leaf: C(0.10, 0.24, 0.06), leaf2: C(0.25, 0.38, 0.08), droop: 0.1 } },
      { key: 'oak1', spec: { trunkH: 3.4, trunkR: 0.34, spread: 6.2, levels: 2, blobR: 2.3, bark: C(0.19, 0.13, 0.09), barkMark: C(0.09, 0.07, 0.05), leaf: C(0.12, 0.26, 0.06), leaf2: C(0.34, 0.40, 0.08), droop: 0.2 } },
      { key: 'rowan0', spec: { trunkH: 3.4, trunkR: 0.14, spread: 3.2, levels: 2, blobR: 1.2, bark: C(0.30, 0.25, 0.22), barkMark: C(0.15, 0.12, 0.1), leaf: C(0.15, 0.30, 0.08), leaf2: C(0.32, 0.44, 0.12), droop: 0.3, berries: true } },
    ];
    for (const b of broad) {
      const g = buildBroadleaf(b.spec, 500 + b.key.charCodeAt(0) * 3 + b.key.charCodeAt(b.key.length - 1));
      this.variants.set(b.key, { hi: g.hi, lo: g.lo, mat: treeMat, hiDist: 75 * dsc, maxDist: 900, shadow: true, batch: 'trees', aoR: b.spec.spread * 0.7 + b.spec.blobR * 0.5, crown: { kind: 'ball', r: b.spec.spread * 0.85 + b.spec.blobR * 0.7, y0: b.spec.trunkH * 0.9, y1: b.spec.trunkH + b.spec.spread * 1.3 + b.spec.blobR } });
    }
    for (let i = 0; i < 3; i++) this.variants.set(`heather${i}`, { hi: buildHeather(700 + i), mat: shrubMat, hiDist: 1e9, maxDist: 320 * dsc, shadow: false });
    for (let i = 0; i < 2; i++) this.variants.set(`gorse${i}`, { hi: buildGorse(800 + i), mat: shrubMat, hiDist: 1e9, maxDist: 420 * dsc, shadow: false });
    for (let i = 0; i < 3; i++) this.variants.set(`bracken${i}`, { hi: buildBracken(900 + i), mat: shrubMat, hiDist: 1e9, maxDist: 300 * dsc, shadow: false });
    for (let i = 0; i < 2; i++) this.variants.set(`grass${i}`, { hi: buildGrass(1000 + i), mat: grassMat, hiDist: 1e9, maxDist: 115 * dsc, shadow: false });
    for (let i = 0; i < 2; i++) this.variants.set(`flower${i}`, { hi: buildFlower(1100 + i), mat: flowerMat, hiDist: 1e9, maxDist: 95 * dsc, shadow: false });
    for (let i = 0; i < 8; i++) this.variants.set(`rock${i}`, { hi: buildRock(1200 + i * 5, 0.5 + (i % 3) * 0.18, i < 4 ? 2 : 3), lo: buildRock(1200 + i * 5, 0.5 + (i % 3) * 0.18, 1), mat: rockMat, hiDist: (i < 4 ? 70 : 220) * dsc, maxDist: (i < 4 ? 520 : 1600) * dsc, shadow: true, batch: 'rocks', aoR: 1.25 });
  }

  /** open ground in front of (south of) and beneath the viaduct, keeps the great view clear */
  private inViaductClearing(x: number, z: number, pad = 0): boolean {
    const dx = x - VIADUCT.cx, dz = z - VIADUCT.cz;
    const rho = Math.hypot(dx, dz);
    const u = Math.atan2(dx, dz) * VIADUCT.radius;
    return Math.abs(u) < VIADUCT.halfLen + 28 + pad && rho - VIADUCT.radius > -14 - pad && rho - VIADUCT.radius < 92 + pad;
  }

  // --------------------------------------------------------------- placement
  private add(key: string, pos: THREE.Vector3, rotY: number, sx: number, sy: number, sz: number, color?: THREE.Color, tilt?: [number, number]) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt?.[0] ?? 0, rotY, tilt?.[1] ?? 0, 'YXZ'));
    m.compose(pos, q, new THREE.Vector3(sx, sy, sz));
    const vv = this.variants.get(key)!;
    if (vv.batch) {
      let arr = this.batchBuckets.get(vv.batch);
      if (!arr) this.batchBuckets.set(vv.batch, (arr = []));
      arr.push({ key, m, c: color ?? new THREE.Color(1, 1, 1), x: pos.x, y: pos.y, z: pos.z, hiDist: vv.hiDist, hiId: -1, loId: -1 });
      if (vv.crown) this.colliders.push({ x: pos.x, y: pos.y, z: pos.z, sx: sx, sy: sy, c: vv.crown });
      if (vv.aoR) this.ao.push({ x: pos.x, y: pos.y, z: pos.z, r: vv.aoR * Math.max(sx, sz), op: key.startsWith('rock') ? 0.5 : 0.55 });
      return;
    }
    const ck = `${Math.floor(pos.x / CELL)},${Math.floor(pos.z / CELL)}`;
    let cell = this.buckets.get(ck);
    if (!cell) this.buckets.set(ck, (cell = new Map()));
    let list = cell.get(key);
    if (!list) cell.set(key, (list = []));
    list.push({ m, c: color });
  }

  private place() {
    const land = this.land;
    const rng = new Rng(2025);
    const p = new THREE.Vector3();
    const grassTints = [C(0.9, 1.0, 0.7), C(1.0, 1.0, 0.8), C(0.8, 0.95, 0.65), C(1.1, 1.0, 0.7), C(0.95, 0.85, 0.6)];

    // ---- conifer woodland
    const x0 = -560, x1 = 560, z0 = -700, z1 = 860, step = this.q.veg.pine;
    for (let z = z0; z < z1; z += step) {
      for (let x = x0; x < x1; x += step) {
        const j = step * 0.42;
        const px = x + rng.range(-j, j), pz = z + rng.range(-j, j);
        const h = land.fastHeight(px, pz);
        const slope = land.fastSlope(px, pz);
        const m = pineMask(px, pz, h, slope);
        if (m < 0.05) continue;
        if (rng.next() > m * 0.8) continue;
        if (!land.isFree(px, pz, 22, 9)) continue;
        if (this.inViaductClearing(px, pz)) continue;
        // thin out in clearings
        if (noise.n2(px * 0.08, pz * 0.08) > 0.55) continue;
        p.set(px, land.height(px, pz), pz);
        const r = rng.next();
        const sc = rng.range(0.7, 1.35) * (0.8 + 0.3 * smoothstep(0, 40, 100 - Math.abs(h - 50)));
        const key = r < 0.7 ? `pine${rng.int(0, 2)}` : r < 0.84 ? `pine3` : `scots${rng.int(0, 2)}`;
        const s2 = key.startsWith('scots') ? rng.range(0.8, 1.2) : sc;
        this.add(key, p, rng.range(0, 6.28), s2 * rng.range(0.9, 1.1), s2, s2 * rng.range(0.9, 1.1), undefined, [rng.range(-0.04, 0.04), rng.range(-0.04, 0.04)]);
        this.stats.trees++;
      }
    }

    // ---- broadleaf along streams, valley floor and track cuttings
    const bs = this.q.veg.broad;
    for (let z = -520; z < 760; z += bs) {
      for (let x = -420; x < 420; x += bs) {
        const px = x + rng.range(-bs * 0.43, bs * 0.43), pz = z + rng.range(-bs * 0.43, bs * 0.43);
        const h = land.fastHeight(px, pz);
        const slope = land.fastSlope(px, pz);
        let m = broadleafMask(px, pz, h, slope);
        // riparian strip
        const dR = land.riverDist(px, pz);
        m += 0.7 * smoothstep(40, 12, dR) * (1 - smoothstep(0.4, 0.7, slope));
        m = Math.min(1, m);
        if (m < 0.1 || rng.next() > m * 0.55) continue;
        if (pineMask(px, pz, h, slope) > 0.5 && rng.chance(0.7)) continue;
        if (!land.isFree(px, pz, 16, 5.5)) continue;
        if (this.inViaductClearing(px, pz, -20) && dR > 14) continue;
        p.set(px, land.height(px, pz), pz);
        const wet = dR < 30;
        const k = wet ? (rng.chance(0.6) ? `birch${rng.int(0, 1)}` : 'rowan0') : rng.chance(0.4) ? `oak${rng.int(0, 1)}` : rng.chance(0.5) ? `birch${rng.int(0, 1)}` : 'rowan0';
        const sc = rng.range(0.6, 1.0);
        this.add(k, p, rng.range(0, 6.28), sc, sc * rng.range(0.9, 1.1), sc);
        this.stats.trees++;
      }
    }

    // ---- shrubs: heather, gorse, bracken
    const sx0 = -380, sx1 = 380, sz0 = -560, sz1 = 560;
    const ss = this.q.veg.shrub;
    for (let z = sz0; z < sz1; z += ss) {
      for (let x = sx0; x < sx1; x += ss) {
        const px = x + rng.range(-ss * 0.47, ss * 0.47), pz = z + rng.range(-ss * 0.47, ss * 0.47);
        const h = land.fastHeight(px, pz);
        const slope = land.fastSlope(px, pz);
        if (slope > 1.0) continue;
        if (!land.isFree(px, pz, 4.5, 3)) continue;
        const pm = pineMask(px, pz, h, slope);
        if (pm > 0.35 && rng.chance(0.75)) continue;
        const moor = moorMask(px, pz, h);
        const brk = brackenMask(px, pz, h);
        const gor = smoothstep(0.55, 0.8, noise.fbm2(px * 0.03 + 71, pz * 0.03 - 9, 2) * 0.5 + 0.5);
        const r = rng.next();
        let key: string | null = null;
        if (r < moor * 0.55) key = `heather${rng.int(0, 2)}`;
        else if (r < moor * 0.55 + brk * 0.5) key = `bracken${rng.int(0, 2)}`;
        else if (r < moor * 0.55 + brk * 0.5 + gor * 0.35) key = `gorse${rng.int(0, 1)}`;
        else if (r < 0.06 && slope < 0.6) key = `bracken${rng.int(0, 2)}`;
        if (!key) continue;
        p.set(px, land.height(px, pz) - 0.05, pz);
        const sc = rng.range(0.7, 1.7);
        this.add(key, p, rng.range(0, 6.28), sc, sc * rng.range(0.7, 1.2), sc, key.startsWith('heather') ? C(1 + rng.range(-0.1, 0.2), 0.95, 1 + rng.range(-0.2, 0.1)) : undefined);
        this.stats.shrubs++;
      }
    }

    // ---- grass tufts around the railway and valley floor
    const gx0 = -340, gx1 = 340, gz0 = -540, gz1 = 400;
    const gs = this.q.veg.grass;
    for (let z = gz0; z < gz1; z += gs) {
      for (let x = gx0; x < gx1; x += gs) {
        const px = x + rng.range(-gs * 0.48, gs * 0.48), pz = z + rng.range(-gs * 0.48, gs * 0.48);
        if (this.land.trackDistance(px, pz) < 2.9) continue;
        const slope = land.fastSlope(px, pz);
        if (slope > 0.85) continue;
        const dR = land.riverDist(px, pz);
        if (dR < 3.5) continue;
        const h = land.fastHeight(px, pz);
        const pm = pineMask(px, pz, h, slope);
        const dens = (0.35 + 0.65 * (1 - smoothstep(60, 140, h))) * (1 - 0.7 * pm) * (0.5 + 0.5 * (noise.n2(px * 0.05, pz * 0.05) * 0.5 + 0.5));
        const dt = this.land.trackDistance(px, pz);
        const nearTrack = dt < 9 ? 1.2 : 1;
        if (rng.next() > dens * nearTrack * 0.75) continue;
        p.set(px, land.fastHeight(px, pz) - 0.02, pz);
        const sc = rng.range(0.55, 1.15);
        this.add(`grass${rng.int(0, 1)}`, p, rng.range(0, 6.28), sc, sc * rng.range(0.8, 1.5), sc, rng.pick(grassTints));
        this.stats.grass++;
      }
    }

    // ---- wildflower drifts
    const cols = [C(0.52, 0.30, 0.72), C(0.98, 0.82, 0.12), C(0.96, 0.96, 0.92), C(0.30, 0.40, 0.85), C(0.82, 0.48, 0.66), C(0.95, 0.60, 0.15)];
    for (let i = 0; i < this.q.veg.flowerClusters; i++) {
      const cx = rng.range(-300, 300), cz = rng.range(-520, 380);
      const h = land.fastHeight(cx, cz);
      if (land.fastSlope(cx, cz) > 0.7 || h > 100 || !land.isFree(cx, cz, 5, 3)) continue;
      const col = cols[Math.floor(rng.next() * cols.length)];
      const n = rng.int(10, 28);
      const rad = rng.range(2, 6);
      for (let k = 0; k < n; k++) {
        const a = rng.range(0, 6.28), d = Math.sqrt(rng.next()) * rad;
        const fx = cx + Math.cos(a) * d, fz = cz + Math.sin(a) * d;
        if (!land.isFree(fx, fz, 3.5, 2.5)) continue;
        p.set(fx, land.fastHeight(fx, fz), fz);
        const sc = rng.range(0.55, 1.0);
        const c = col.clone().multiplyScalar(rng.range(0.85, 1.15));
        this.add(`flower${rng.int(0, 1)}`, p, rng.range(0, 6.28), sc, sc, sc, c);
        this.stats.flowers++;
      }
    }

    // ---- rocks and boulders: steep ground, river banks, around the viaduct piers
    const rockAt = (px: number, pz: number, big: boolean, sinkMul = 0.25) => {
      p.set(px, land.height(px, pz), pz);
      const sc = big ? rng.range(2.0, 4.8) : rng.range(0.35, 1.5);
      const k = `rock${big ? rng.int(4, 7) : rng.int(0, 3)}`;
      p.y -= sc * sinkMul;
      this.add(k, p, rng.range(0, 6.28), sc * rng.range(0.8, 1.4), sc * rng.range(0.6, 1.1), sc * rng.range(0.8, 1.4), C(1, 1, 1).multiplyScalar(rng.range(0.8, 1.15)), [rng.range(-0.25, 0.25), rng.range(-0.25, 0.25)]);
      this.stats.rocks++;
    };
    const rs = this.q.veg.rock;
    for (let z = -560; z < 800; z += rs) {
      for (let x = -420; x < 420; x += rs) {
        const px = x + rng.range(-rs * 0.44, rs * 0.44), pz = z + rng.range(-rs * 0.44, rs * 0.44);
        const slope = land.fastSlope(px, pz);
        const dR = land.riverDist(px, pz);
        const clump = 0.25 + 1.3 * smoothstep(0.35, 0.8, noise.n2(px * 0.022 + 5, pz * 0.022 - 3) * 0.5 + 0.5);
        let prob = smoothstep(0.42, 0.95, slope) * 0.75 * clump + (dR < 14 ? 0.2 : 0) + noise.n2(px * 0.02, pz * 0.02) * 0.02;
        if (prob < 0.02 || rng.next() > prob) continue;
        if (land.trackDistance(px, pz) < 4.5 && slope < 0.6) continue;
        if (!land.isFree(px, pz, 3.2, dR < 14 ? 1.6 : 4)) continue;
        rockAt(px, pz, slope > 0.5 && rng.chance(0.55));
      }
    }
    // piers: footing boulders around the viaduct bases
    for (let j = 0; j <= VIADUCT.arches; j++) {
      const u = (j - VIADUCT.arches / 2) * (VIADUCT.span + VIADUCT.pier);
      for (let k = 0; k < 9; k++) {
        const th = u / VIADUCT.radius;
        const v = rng.range(-5.2, 5.2) * (rng.chance(0.5) ? 1 : 1.4);
        const du = rng.range(-5.2, 5.2);
        const th2 = (u + du) / VIADUCT.radius;
        const rho = VIADUCT.radius + v;
        const px = VIADUCT.cx + rho * Math.sin(th2), pz = VIADUCT.cz + rho * Math.cos(th2);
        void th;
        const h = land.height(px, pz);
        if (h > VIADUCT.springY - 4) continue;
        if (this.land.riverDist(px, pz) < 4) continue;
        rockAt(px, pz, rng.chance(0.4));
      }
    }
  }

  /** Soft dark discs under trees and boulders: baked-looking contact occlusion for the price of one draw. */
  private buildContactAO() {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    const mat = patch(new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), {
      key: 'contact-ao',
      fragColor: `
        float rr = length(vOPos.xz) * 2.0;
        float fall = pow(clamp(1.0 - rr, 0.0, 1.0), 1.6);
        diffuseColor.a = fall * (0.18 + 0.82 * vRand) * 0.6;
        diffuseColor.rgb = vec3(0.01, 0.015, 0.0);
      `,
    });
    const mesh = new THREE.InstancedMesh(g, mat, this.ao.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3();
    this.ao.forEach((a, i) => {
      this.land.normal(a.x, a.z, n, 2.0);
      q.setFromUnitVectors(up, n);
      m.compose(new THREE.Vector3(a.x, a.y + 0.07 + a.r * 0.01, a.z), q, new THREE.Vector3(a.r * 2, 1, a.r * 2));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.renderOrder = 1;
    mesh.frustumCulled = false;
    mesh.name = 'contact-ao';
    this.group.add(mesh);
    this.ao = [];
  }

  // --------------------------------------------------------------- finalize
  private finalize() {
    for (const [kind, list] of this.batchBuckets) {
      const keys = [...new Set(list.map((i) => i.key))];
      let verts = 0;
      for (const k of keys) {
        const v = this.variants.get(k)!;
        verts += v.hi.attributes.position.count + (v.lo?.attributes.position.count ?? 0);
      }
      const mat = this.variants.get(keys[0])!.mat;
      const mk = () => {
        const bm = new THREE.BatchedMesh(list.length, verts + 64, 0, mat);
        bm.sortObjects = false;
        bm.perObjectFrustumCulled = true;
        bm.receiveShadow = true;
        return bm;
      };
      const hi = mk(), lo = mk();
      // phones skip tree shadows (they dominate the shadow pass); the viaduct and train still cast
      const treeShadows = this.q.tier === 'high';
      hi.castShadow = kind === 'rocks' ? treeShadows : treeShadows;
      lo.castShadow = kind === 'rocks' && treeShadows;
      const hiGeo = new Map<string, number>(), loGeo = new Map<string, number>();
      for (const k of keys) {
        const v = this.variants.get(k)!;
        hiGeo.set(k, hi.addGeometry(v.hi));
        loGeo.set(k, lo.addGeometry(v.lo ?? v.hi));
      }
      for (const it of list) {
        it.hiId = hi.addInstance(hiGeo.get(it.key)!);
        it.loId = lo.addInstance(loGeo.get(it.key)!);
        hi.setMatrixAt(it.hiId, it.m);
        lo.setMatrixAt(it.loId, it.m);
        hi.setColorAt(it.hiId, it.c);
        lo.setColorAt(it.loId, it.c);
        lo.setVisibleAt(it.loId, false);
      }
      hi.name = `${kind}-hi`;
      lo.name = `${kind}-lo`;
      this.group.add(hi, lo);
      this.batches.push({ hi, lo, inst: list });
    }
    this.batchBuckets.clear();
    for (const [ck, items] of this.buckets) {
      const [cx, cz] = ck.split(',').map(Number);
      const cell: Cell = { cx, cz, groups: [] };
      for (const [key, list] of items) {
        const v = this.variants.get(key)!;
        const hi = new THREE.InstancedMesh(v.hi, v.mat, list.length);
        let anyColor = false;
        list.forEach((it, i) => {
          hi.setMatrixAt(i, it.m);
          if (it.c) {
            hi.setColorAt(i, it.c);
            anyColor = true;
          }
        });
        if (anyColor && hi.instanceColor) {
          // instances without an explicit colour stay white
          const arr = hi.instanceColor.array as Float32Array;
          list.forEach((it, i) => {
            if (!it.c) arr.set([1, 1, 1], i * 3);
          });
        }
        hi.instanceMatrix.needsUpdate = true;
        hi.castShadow = v.shadow;
        hi.receiveShadow = true;
        hi.computeBoundingSphere();
        const g: CellGroup = { hi, v };
        this.group.add(hi);
        if (v.lo) {
          const lo = new THREE.InstancedMesh(v.lo, v.mat, list.length);
          lo.instanceMatrix = hi.instanceMatrix;
          if (hi.instanceColor) lo.instanceColor = hi.instanceColor;
          lo.count = list.length;
          lo.castShadow = v.shadow;
          lo.receiveShadow = true;
          lo.boundingSphere = hi.boundingSphere;
          lo.visible = false;
          g.lo = lo;
          this.group.add(lo);
        }
        cell.groups.push(g);
      }
      this.cells.push(cell);
    }
    this.buckets.clear();
  }

  /** LOD / distance culling; call each frame (cheap: throttled internally). */
  update(camPos: THREE.Vector3, force = false) {
    this.frame++;
    if (!force && this.frame % 6 !== 0) return;
    for (const b of this.batches) {
      for (const it of b.inst) {
        const dx = it.x - camPos.x, dy = it.y - camPos.y, dz = it.z - camPos.z;
        const near = dx * dx + dy * dy + dz * dz < it.hiDist * it.hiDist;
        b.hi.setVisibleAt(it.hiId, near);
        b.lo.setVisibleAt(it.loId, !near);
      }
    }
    const half = CELL * 0.75;
    for (const c of this.cells) {
      const dx = Math.max(0, Math.abs((c.cx + 0.5) * CELL - camPos.x) - CELL / 2);
      const dz = Math.max(0, Math.abs((c.cz + 0.5) * CELL - camPos.z) - CELL / 2);
      const d = Math.hypot(dx, dz, 0) ;
      void half;
      for (const g of c.groups) {
        const v = g.v;
        if (d > v.maxDist) {
          g.hi.visible = false;
          if (g.lo) g.lo.visible = false;
        } else if (g.lo) {
          const useHi = d < v.hiDist;
          g.hi.visible = useHi;
          g.lo.visible = !useHi;
        } else {
          g.hi.visible = true;
        }
      }
    }
  }
}
