import * as THREE from 'three';
import { noise, smoothstep, clamp, mix, smin } from '../core/noise';
import { Track } from './track';
import { RIVER_PTS, RIVER_BED_DEPTH, floorY, rimY, VIADUCT } from './layout';

class Grid {
  data: Float32Array;
  constructor(
    public x0: number,
    public z0: number,
    public cell: number,
    public nx: number,
    public nz: number,
    fill = 0,
  ) {
    this.data = new Float32Array(nx * nz).fill(fill);
  }
  sample(x: number, z: number): number {
    const fx = clamp((x - this.x0) / this.cell, 0, this.nx - 1.001);
    const fz = clamp((z - this.z0) / this.cell, 0, this.nz - 1.001);
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const tx = fx - ix, tz = fz - iz;
    const d = this.data, nx = this.nx;
    const a = d[iz * nx + ix], b = d[iz * nx + ix + 1];
    const c = d[(iz + 1) * nx + ix], e = d[(iz + 1) * nx + ix + 1];
    return (a + (b - a) * tx) * (1 - tz) + (c + (e - c) * tx) * tz;
  }
  inside(x: number, z: number): boolean {
    return x >= this.x0 && z >= this.z0 && x < this.x0 + (this.nx - 1) * this.cell && z < this.z0 + (this.nz - 1) * this.cell;
  }
}

export interface RiverSample {
  x: number;
  z: number;
  y: number; // water surface
  w: number; // half width
}

/**
 * Terrain height model: bowl + hills + mountains, river glen, rock crags, and
 * carved railway formation. All queries are analytic / grid-backed so any module
 * can ask for ground height.
 */
export class Landscape {
  readonly river: RiverSample[] = [];
  private sdGrid!: Grid;
  private riverFine!: Grid;
  private riverCoarse!: Grid;
  private trackDist!: Grid;
  private trackY!: Grid;
  private fine?: Grid;

  constructor(readonly track: Track) {
    this.buildRiver();
    this.buildLoopField();
    this.buildTrackField();
  }

  // -------------------------------------------------------------------------
  private buildRiver() {
    const curve = new THREE.CatmullRomCurve3(
      [...RIVER_PTS, [250, 1160], [320, 1400], [380, 1700], [410, 2100], [420, 2500]].map(
        ([x, z]) => new THREE.Vector3(x, 0, z),
      ),
      false,
      'centripetal',
    );
    curve.arcLengthDivisions = 4000;
    const len = curve.getLength();
    const step = 2;
    const n = Math.floor(len / step);
    const p = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      curve.getPointAt(i / n, p);
      const fy = floorY(p.z);
      // river widens downstream and narrows near the falls
      const half = clamp(2.6 + (p.z + 350) * 0.0045, 2.6, 7.5);
      this.river.push({ x: p.x, z: p.z, y: fy - 0.42, w: half });
    }

    // fine raster (2 m) around the first ~1.3 km of the river; coarse for the glen profile
    const fx0 = -120, fz0 = -400, fcell = 2;
    const fnx = Math.ceil((300 - fx0) / fcell), fnz = Math.ceil((1000 - fz0) / fcell);
    this.riverFine = new Grid(fx0, fz0, fcell, fnx, fnz, 999);
    const R = 40;
    for (const s of this.river) {
      const ix0 = Math.max(0, Math.floor((s.x - R - fx0) / fcell)), ix1 = Math.min(fnx - 1, Math.ceil((s.x + R - fx0) / fcell));
      const iz0 = Math.max(0, Math.floor((s.z - R - fz0) / fcell)), iz1 = Math.min(fnz - 1, Math.ceil((s.z + R - fz0) / fcell));
      for (let iz = iz0; iz <= iz1; iz++) {
        const wz = fz0 + iz * fcell;
        for (let ix = ix0; ix <= ix1; ix++) {
          const wx = fx0 + ix * fcell;
          const d = Math.hypot(wx - s.x, wz - s.z);
          const k = iz * fnx + ix;
          if (d < this.riverFine.data[k]) this.riverFine.data[k] = d;
        }
      }
    }
    const cx0 = -900, cz0 = -700, ccell = 16;
    const cnx = Math.ceil(2200 / ccell), cnz = Math.ceil(3500 / ccell);
    this.riverCoarse = new Grid(cx0, cz0, ccell, cnx, cnz, 0);
    const coarse: RiverSample[] = this.river.filter((_, i) => i % 3 === 0);
    for (let iz = 0; iz < cnz; iz++) {
      for (let ix = 0; ix < cnx; ix++) {
        const wx = cx0 + ix * ccell, wz = cz0 + iz * ccell;
        let best = 1e12;
        for (let k = 0; k < coarse.length; k++) {
          const dx = coarse[k].x - wx, dz = coarse[k].z - wz;
          const d = dx * dx + dz * dz;
          if (d < best) best = d;
        }
        this.riverCoarse.data[iz * cnx + ix] = Math.sqrt(best);
      }
    }
  }

  /** Distance to river centre line. */
  riverDist(x: number, z: number): number {
    if (this.riverFine.inside(x, z)) {
      const d = this.riverFine.sample(x, z);
      if (d < 36) return d;
    }
    return Math.max(this.riverCoarse.sample(x, z), 36);
  }

  /** Nearest river sample (brute force over a window — only for placement helpers). */
  nearestRiver(x: number, z: number): { s: RiverSample; d: number } {
    let best = 1e12, bs = this.river[0];
    for (const s of this.river) {
      const dx = s.x - x, dz = s.z - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; bs = s; }
    }
    return { s: bs, d: Math.sqrt(best) };
  }

  // -------------------------------------------------------------------------
  private buildLoopField() {
    const tr = this.track;
    const pts: { x: number; z: number; open: boolean }[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < tr.n; i += 8) {
      tr.sampleXYZ(i, v);
      const s = i * tr.ds;
      pts.push({ x: v.x, z: v.z, open: !(s <= tr.viaductS1 + 6) });
    }
    const x0 = -3600, z0 = -3800, cell = 24;
    const nx = Math.ceil(7200 / cell), nz = Math.ceil(7200 / cell);
    this.sdGrid = new Grid(x0, z0, cell, nx, nz, 0);
    const openPts = pts.filter((p) => p.open);
    for (let iz = 0; iz < nz; iz++) {
      const wz = z0 + iz * cell;
      for (let ix = 0; ix < nx; ix++) {
        const wx = x0 + ix * cell;
        let best = 1e12;
        for (let k = 0; k < openPts.length; k++) {
          const dx = openPts[k].x - wx, dz = openPts[k].z - wz;
          const d = dx * dx + dz * dz;
          if (d < best) best = d;
        }
        // even-odd inside test against the whole loop polygon
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const a = pts[i], b = pts[j];
          if (a.z > wz !== b.z > wz && wx < ((b.x - a.x) * (wz - a.z)) / (b.z - a.z) + a.x) inside = !inside;
        }
        const d = Math.sqrt(best);
        this.sdGrid.data[iz * nx + ix] = inside ? -d : d;
      }
    }
  }

  private buildTrackField() {
    const tr = this.track;
    const cell = 1.5;
    const x0 = -300, z0 = -540, nx = Math.ceil(600 / cell), nz = Math.ceil(600 / cell);
    this.trackDist = new Grid(x0, z0, cell, nx, nz, 999);
    this.trackY = new Grid(x0, z0, cell, nx, nz, 0);
    const R = 28;
    const v = new THREE.Vector3();
    for (let i = 0; i < tr.n; i++) {
      tr.sampleXYZ(i, v);
      const ix0 = Math.max(0, Math.floor((v.x - R - x0) / cell)), ix1 = Math.min(nx - 1, Math.ceil((v.x + R - x0) / cell));
      const iz0 = Math.max(0, Math.floor((v.z - R - z0) / cell)), iz1 = Math.min(nz - 1, Math.ceil((v.z + R - z0) / cell));
      for (let iz = iz0; iz <= iz1; iz++) {
        const wz = z0 + iz * cell;
        for (let ix = ix0; ix <= ix1; ix++) {
          const wx = x0 + ix * cell;
          const d = Math.hypot(wx - v.x, wz - v.z);
          const k = iz * nx + ix;
          if (d < this.trackDist.data[k]) {
            this.trackDist.data[k] = d;
            this.trackY.data[k] = v.y;
          }
        }
      }
    }
  }

  /** Register the ring-0 height lattice so everyone can query terrain height cheaply. */
  setGrid(x0: number, z0: number, cell: number, nx: number, nz: number, data: Float32Array) {
    const g = new Grid(x0, z0, cell, nx, nz);
    g.data = data;
    this.fine = g;
  }

  /** Fast terrain height consistent with the visible mesh (bilinear on the ring-0 lattice). */
  fastHeight(x: number, z: number): number {
    if (this.fine && this.fine.inside(x, z)) return this.fine.sample(x, z);
    return this.height(x, z, 1);
  }

  fastSlope(x: number, z: number): number {
    const e = 3;
    const hx = this.fastHeight(x + e, z) - this.fastHeight(x - e, z);
    const hz = this.fastHeight(x, z + e) - this.fastHeight(x, z - e);
    return Math.hypot(hx, hz) / (2 * e);
  }

  /** Distance from the track centreline in XZ (<= 28, else 999) */
  trackDistance(x: number, z: number): number {
    if (!this.trackDist.inside(x, z)) return 999;
    return this.trackDist.sample(x, z);
  }

  // -------------------------------------------------------------------------
  /** Signed distance to the open loop (negative inside the glen). */
  sd(x: number, z: number): number {
    return this.sdGrid.sample(x, z);
  }

  /** Smooth large-scale terrain without crags / carving. */
  smoothBase(x: number, z: number, lod = 0): number {
    const sd0 = this.sdGrid.sample(x, z);
    const rim = rimY(x, z);
    const zc = clamp(z, -352, 1200);
    const fy = floorY(zc);
    // directional bias: tall ranges north / east, low rolling country towards the south-west sun
    const ddx = x - VIADUCT.cx, ddz = z - VIADUCT.cz;
    const dl = Math.hypot(ddx, ddz) + 1e-6;
    const north = (ddx * 0.35 + ddz * -0.94) / dl;
    const dirF = 0.26 + 0.74 * smoothstep(-0.35, 0.85, north);
    let h: number;
    if (sd0 < 0) {
      // domain-warped slope so the glen has spurs and re-entrants rather than a perfect cone
      const wf = smoothstep(0, 45, -sd0);
      const sd = sd0 + wf * 34 * noise.fbm2(x * 0.0065 + 17, z * 0.0065 - 5, 3);
      const t = clamp(-sd / (120 + 40 * noise.n2(x * 0.004, z * 0.004)), 0, 1);
      const s = t * t * (3 - 2 * t);
      h = rim - (rim - fy) * Math.pow(s, 0.9);
      if (lod < 3) {
        // spurs, gullies and hummocks on the glen sides
        const mask = smoothstep(0.04, 0.3, t) * (1 - smoothstep(0.82, 1.0, t));
        h += mask * 15 * (noise.ridged2(x * 0.011 + 3, z * 0.011 + 9, lod > 1 ? 2 : 4) - 0.45);
        h += (1 - mask * 0.5) * 1.6 * noise.fbm2(x * 0.02, z * 0.02, 2) * smoothstep(0.5, 1.0, t);
      }
      // the head of the glen: a steep corrie wall behind the waterfall
      const corrie = smoothstep(-300, -420, z) * smoothstep(-sd0, 30, 120);
      h += 14 * corrie * (0.55 + 0.9 * (noise.fbm2(x * 0.011 + 8, z * 0.011, 3) * 0.5 + 0.5));
    } else {
      const sd = sd0;
      const rise = 26 * smoothstep(0, 220, sd) + 105 * dirF * smoothstep(30, 520, sd);
      const oct = lod > 1 ? 3 : 5;
      const ridge = 0.25 + 0.75 * noise.ridged2(x * 0.0017 + 5.3, z * 0.0017 - 2.9, oct);
      const spur = 0.55 + 0.9 * noise.ridged2(x * 0.0065 + 1.1, z * 0.0065 + 7.7, lod > 1 ? 2 : 4);
      const big = 330 * dirF * Math.pow(smoothstep(220, 2400, sd), 1.2);
      const hills = 26 * noise.fbm2(x * 0.004 + 9.1, z * 0.004 + 1.3, lod > 1 ? 2 : 3) * smoothstep(0, 300, sd);
      h = rim + rise * spur + big * ridge + hills;
    }
    // river glen cut
    const dR = this.riverDist(x, z);
    const widen = 1 + 1.6 * smoothstep(0, 450, z);
    const glen = fy + 21 * Math.pow(dR / (52 * widen), 1.55);
    h = smin(h, glen, 26);
    return h;
  }

  /** Full-detail terrain height used by everything. */
  height(x: number, z: number, lod = 0): number {
    let h = this.smoothBase(x, z, lod);
    if (lod <= 1) {
      // crags on steep ground
      const e = 5;
      const hx = this.smoothBase(x + e, z, lod) - this.smoothBase(x - e, z, lod);
      const hz = this.smoothBase(x, z + e, lod) - this.smoothBase(x, z - e, lod);
      const slope = Math.hypot(hx, hz) / (2 * e);
      const rocky = smoothstep(0.42, 0.95, slope);
      const rough = noise.fbm2(x * 0.045, z * 0.045, 3);
      h += 1.4 * rough + 0.45 * noise.n2(x * 0.19, z * 0.19);
      if (rocky > 0.001) {
        const crag = (noise.ridged2(x * 0.06 + 1.7, z * 0.06 + 8.3, 3) * 0.7 + 0.3 * noise.ridged2(x * 0.13, z * 0.13, 2)) * (0.55 + 0.9 * (noise.fbm2(x * 0.02 - 4, z * 0.02 + 6, 2) * 0.5 + 0.5));
        const step = Math.round(h * 0.4 + noise.n2(x * 0.02, z * 0.02) * 2) * 2.5;
        const strata = mix(h, step, 0.18 * rocky);
        h = strata + rocky * (2.6 * crag - 0.2 + 0.8 * noise.n2(x * 0.21 + 4, z * 0.21));
      }
    }
    // river channel and meadow
    const dR = this.riverDist(x, z);
    if (dR < 34) {
      const zc = clamp(z, -352, 1200);
      const fy = floorY(zc);
      const meadow = 1 - smoothstep(14, 34, dR);
      const target = fy + 0.5 * noise.n2(x * 0.06, z * 0.06) + 0.35 * smoothstep(5, 20, dR);
      h = mix(h, Math.min(h, target + 1.2 + 4 * smoothstep(10, 32, dR)), meadow * 0.5);
      const bankT = 1 - smoothstep(4, 12, dR);
      const bed = fy - 0.42 - RIVER_BED_DEPTH * (1 - smoothstep(0, 5.2, dR) * 0.6);
      const flat = fy + 0.4 * smoothstep(5, 14, dR);
      h = mix(h, flat, bankT);
      if (dR < 6.2) h = mix(h, bed, 1 - smoothstep(2.4, 6.2, dR));
    }
    // railway formation (cutting / embankment)
    if (this.trackDist.inside(x, z)) {
      const d = this.trackDist.sample(x, z);
      if (d < 28) {
        const ty = this.trackY.sample(x, z);
        const bed = ty - 0.62;
        const clearance = ty - h;
        const vw = 1 - smoothstep(10, 17, clearance);
        if (vw > 0) {
          const t = Math.max(0, d - 3.6);
          const lo = bed - t * 0.66;
          const hi = bed + t * 0.9 + 0.35 * Math.max(0, d - 6) * noise.n2(x * 0.2, z * 0.2);
          const target = d <= 3.6 ? bed : clamp(h, lo, hi);
          h = mix(h, target, vw);
        }
      }
    }
    return h;
  }

  /** Surface normal from finite differences. */
  normal(x: number, z: number, out = new THREE.Vector3(), e = 1.2): THREE.Vector3 {
    const hx = this.height(x + e, z) - this.height(x - e, z);
    const hz = this.height(x, z + e) - this.height(x, z - e);
    return out.set(-hx, 2 * e, -hz).normalize();
  }

  slope(x: number, z: number): number {
    const e = 1.5;
    const hx = this.height(x + e, z) - this.height(x - e, z);
    const hz = this.height(x, z + e) - this.height(x, z - e);
    return Math.hypot(hx, hz) / (2 * e);
  }

  /** Is this point clear of the track formation, river and viaduct footprint? */
  isFree(x: number, z: number, trackClear = 6, riverClear = 6): boolean {
    if (this.trackDistance(x, z) < trackClear) return false;
    if (this.riverDist(x, z) < riverClear) return false;
    // viaduct footprint
    const dx = x - VIADUCT.cx, dz = z - VIADUCT.cz;
    const rho = Math.hypot(dx, dz);
    if (Math.abs(rho - VIADUCT.radius) < VIADUCT.width / 2 + 5) {
      const th = Math.atan2(dx, dz);
      if (Math.abs(th * VIADUCT.radius) < VIADUCT.halfLen + 5) return false;
    }
    return true;
  }
}
