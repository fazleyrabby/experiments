import * as THREE from 'three';
import { Landscape } from './landscape';
import { noise, smoothstep, clamp } from '../core/noise';
import { patch } from '../core/shaders';
import { SUN_DIR } from './layout';
import { pineMask, broadleafMask, moorMask, brackenMask } from './ecology';

interface RingDef {
  cell: number;
  x0: number; x1: number;
  z0: number; z1: number;
  lod: number;
}

// all extents are multiples of the coarsest cell (48 m) so rings stitch exactly
const RINGS: RingDef[] = [
  { cell: 3, x0: -432, x1: 432, z0: -576, z1: 768, lod: 0 },
  { cell: 6, x0: -720, x1: 720, z0: -864, z1: 1056, lod: 1 },
  { cell: 12, x0: -1200, x1: 1200, z0: -1440, z1: 1632, lod: 2 },
  { cell: 24, x0: -2400, x1: 2400, z0: -2640, z1: 2880, lod: 3 },
  { cell: 48, x0: -5040, x1: 5040, z0: -5280, z1: 5520, lod: 4 },
];

// lighter mesh for phones / weak GPUs: ring 0 at 6 m, the 6 m ring dropped (~75 % fewer vertices)
const RINGS_LITE: RingDef[] = [
  { cell: 6, x0: -432, x1: 432, z0: -576, z1: 768, lod: 0 },
  RINGS[2],
  RINGS[3],
  RINGS[4],
];

const tmpC = new THREE.Color();
function srgb(r: number, g: number, b: number, out = tmpC): THREE.Color {
  return out.setRGB(r, g, b, THREE.SRGBColorSpace);
}


const grass = srgb(0.30, 0.38, 0.15, new THREE.Color());
const lush = srgb(0.22, 0.33, 0.11, new THREE.Color());
const moor = srgb(0.44, 0.35, 0.20, new THREE.Color());
const heather = srgb(0.45, 0.27, 0.36, new THREE.Color());
const bracken = srgb(0.58, 0.37, 0.14, new THREE.Color());
const rock = srgb(0.36, 0.35, 0.34, new THREE.Color());
const rockDark = srgb(0.24, 0.24, 0.24, new THREE.Color());
const scree = srgb(0.50, 0.48, 0.44, new THREE.Color());
const gravel = srgb(0.44, 0.41, 0.35, new THREE.Color());
const gravelDark = srgb(0.40, 0.38, 0.34, new THREE.Color());
const forest = srgb(0.14, 0.21, 0.09, new THREE.Color());
const rk = new THREE.Color();

class ShadowGrid {
  cell = 16;
  x0 = -2800; z0 = -3000;
  nx = 350; nz = 380;
  data: Float32Array;
  constructor(land: Landscape) {
    this.data = new Float32Array(this.nx * this.nz);
    for (let iz = 0; iz < this.nz; iz++)
      for (let ix = 0; ix < this.nx; ix++)
        this.data[iz * this.nx + ix] = land.height(this.x0 + ix * this.cell, this.z0 + iz * this.cell, 3);
  }
  sample(x: number, z: number): number {
    const fx = (x - this.x0) / this.cell, fz = (z - this.z0) / this.cell;
    if (fx < 0 || fz < 0 || fx >= this.nx - 1.001 || fz >= this.nz - 1.001) return -1e9;
    const ix = fx | 0, iz = fz | 0, tx = fx - ix, tz = fz - iz;
    const d = this.data, nx = this.nx;
    const a = d[iz * nx + ix], b = d[iz * nx + ix + 1], c = d[(iz + 1) * nx + ix], e = d[(iz + 1) * nx + ix + 1];
    return (a + (b - a) * tx) * (1 - tz) + (c + (e - c) * tx) * tz;
  }
}

export class Terrain {
  readonly group = new THREE.Group();
  readonly material: THREE.MeshStandardMaterial;

  private rings: RingDef[];

  constructor(private land: Landscape, lite = false, onProgress?: (p: number) => void) {
    this.rings = lite ? RINGS_LITE : RINGS;
    this.material = patch(
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 }),
      {
        key: 'terrain',
        vertDecl: 'attribute float aBake; varying float vBake;',
        vertMain: 'vBake = aBake;',
        fragDecl: 'varying float vBake;',
        fragColor: /* glsl */ `
          float dist = length(vViewPosition);
          float n1 = heFbm2L(vWPos.xz * 0.33);
          float slopeF = 1.0 - clamp(vWNormal.y, 0.0, 1.0);
          diffuseColor.rgb *= 0.72 + 0.56 * n1;
          float fine = 1.0 - smoothstep(25.0, 140.0, dist);
          if (dist < 150.0) {
            float n2 = heVNoise2(vWPos.xz * 2.3);
            float n3 = heVNoise2(vWPos.xz * 11.0);
            diffuseColor.rgb *= 1.0 + (n2 - 0.5) * 0.28 * (0.4 + 0.6 * fine) + (n3 - 0.5) * 0.22 * fine;
          }
          float rockW = smoothstep(0.30, 0.52, slopeF);
          if (rockW > 0.01) {
            float strata = sin(vWPos.y * 2.6 + n1 * 5.0) * 0.5 + 0.5;
            float strataFade = 1.0 - smoothstep(60.0, 380.0, dist);
            vec3 rockTone = diffuseColor.rgb * (0.82 + 0.3 * strata * strataFade);
            float rockFade = 1.0 - smoothstep(120.0, 520.0, dist);
            if (rockFade > 0.01) {
              // weathered rock: blocky joints, vertical water staining, lichen
              float jx = heVNoise(vec3(vWPos.x * 0.55, vWPos.y * 1.3, vWPos.z * 0.55));
              float jy = heVNoise(vec3(vWPos.x * 1.9, vWPos.y * 0.7, vWPos.z * 1.9));
              float joint = smoothstep(0.46, 0.5, abs(jx - 0.5)) * 0.35 + smoothstep(0.44, 0.5, abs(jy - 0.5)) * 0.2;
              float stain = smoothstep(0.55, 0.85, heVNoise2(vec2((vWPos.x + vWPos.z) * 0.9, vWPos.y * 0.07)));
              float lich = smoothstep(0.7, 0.85, heVNoise(vWPos * 0.9 + 4.0));
              vec3 rt = rockTone * (1.0 - joint * 0.7 * rockFade) * (1.0 - stain * 0.35 * rockFade);
              rt = mix(rt, vec3(0.36, 0.34, 0.14) * (0.5 + 0.5 * jx), lich * 0.4 * rockFade);
              rockTone = rt;
            }
            diffuseColor.rgb = mix(diffuseColor.rgb, rockTone, rockW);
          }
        `,
        fragNormal: /* glsl */ `
          float bdist = length(vViewPosition);
          if (bdist < 170.0) {
            float hb = (heVNoise2(vWPos.xz * 1.7) * 0.5 + heVNoise2(vWPos.xz * 6.1) * 0.25 + heVNoise2(vWPos.xz * 21.0) * 0.12);
            float rk = smoothstep(0.30, 0.55, 1.0 - clamp(vWNormal.y, 0.0, 1.0));
            if (rk > 0.01) hb += rk * (heVNoise(vec3(vWPos.x * 2.6, vWPos.y * 2.0, vWPos.z * 2.6)) * 1.6 + heVNoise(vWPos * 7.0) * 0.8);
            float bf = 1.0 - smoothstep(20.0, 160.0, bdist);
            normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * (0.55 * bf), faceDirection);
          }
        `,
        fragLightsEnd: /* glsl */ `
          float farFade = smoothstep(uShadowFocus.w * 0.72, uShadowFocus.w * 1.0, length(vWPos.xz - uShadowFocus.xz));
          float bk = mix(1.0, mix(0.1, 1.0, vBake), farFade);
          reflectedLight.directDiffuse *= bk;
          reflectedLight.directSpecular *= bk;
        `,
      },
    );

    const shadow = new ShadowGrid(land);
    onProgress?.(0.1);
    const rings = this.rings;
    rings.forEach((r, i) => {
      const mesh = this.buildRing(r, i, shadow, i > 0 ? rings[i - 1] : null, i < rings.length - 1 ? rings[i + 1] : null);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      this.group.add(mesh);
      onProgress?.(0.1 + (0.9 * (i + 1)) / rings.length);
    });
  }

  private buildRing(r: RingDef, ringIndex: number, shadow: ShadowGrid, inner: RingDef | null, outer: RingDef | null) {
    const land = this.land;
    const nx = Math.round((r.x1 - r.x0) / r.cell) + 1;
    const nz = Math.round((r.z1 - r.z0) / r.cell) + 1;
    const H = new Float32Array(nx * nz);
    const skip = new Uint8Array(nx * nz); // vertex fully inside the hole
    const inHole = (x: number, z: number) =>
      inner !== null && x > inner.x0 + 1e-3 && x < inner.x1 - 1e-3 && z > inner.z0 + 1e-3 && z < inner.z1 - 1e-3;

    for (let iz = 0; iz < nz; iz++) {
      const z = r.z0 + iz * r.cell;
      for (let ix = 0; ix < nx; ix++) {
        const x = r.x0 + ix * r.cell;
        const k = iz * nx + ix;
        if (inHole(x, z)) { skip[k] = 1; continue; }
        H[k] = land.height(x, z, r.lod);
      }
    }
    if (ringIndex === 0) this.land.setGrid(r.x0, r.z0, r.cell, nx, nz, H);
    // Stitch outer border to the next (coarser) ring: odd border vertices follow the chord.
    if (outer) {
      const stitch = (idx: (i: number) => number, count: number) => {
        for (let i = 1; i < count - 1; i += 2) H[idx(i)] = 0.5 * (H[idx(i - 1)] + H[idx(i + 1)]);
      };
      stitch((i) => i, nx); // z0 edge
      stitch((i) => (nz - 1) * nx + i, nx); // z1 edge
      stitch((i) => i * nx, nz);
      stitch((i) => i * nx + nx - 1, nz);
    }

    // index buffer, dropping cells in the hole
    const idx: number[] = [];
    for (let iz = 0; iz < nz - 1; iz++) {
      for (let ix = 0; ix < nx - 1; ix++) {
        const a = iz * nx + ix, b = a + 1, c = a + nx, d = c + 1;
        if (inner && inHole(r.x0 + (ix + 0.5) * r.cell, r.z0 + (iz + 0.5) * r.cell)) continue;
        // alternate diagonal for less directional artefacts
        if ((ix + iz) & 1) idx.push(a, c, b, b, c, d);
        else idx.push(a, c, d, a, d, b);
      }
    }

    const pos = new Float32Array(nx * nz * 3);
    const nor = new Float32Array(nx * nz * 3);
    const col = new Float32Array(nx * nz * 3);
    const bake = new Float32Array(nx * nz).fill(1);
    const sunH = new THREE.Vector2(SUN_DIR.x, SUN_DIR.z).normalize();
    const tanE = SUN_DIR.y / Math.hypot(SUN_DIR.x, SUN_DIR.z);
    const doBake = r.cell <= 24;
    const stepLen = r.cell <= 3 ? 10 : r.cell <= 6 ? 14 : 22;
    const maxDist = r.cell <= 6 ? 1600 : 2400;
    const c = new THREE.Color();

    for (let iz = 0; iz < nz; iz++) {
      const z = r.z0 + iz * r.cell;
      for (let ix = 0; ix < nx; ix++) {
        const k = iz * nx + ix;
        if (skip[k]) continue;
        const x = r.x0 + ix * r.cell;
        const h = H[k];
        pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;

        // normal via neighbours (clamped)
        const xl = Math.max(ix - 1, 0), xr = Math.min(ix + 1, nx - 1);
        const zl = Math.max(iz - 1, 0), zr = Math.min(iz + 1, nz - 1);
        let hl = H[iz * nx + xl], hr = H[iz * nx + xr], hd = H[zl * nx + ix], hu = H[zr * nx + ix];
        // neighbours in the hole -> evaluate the function directly
        if (skip[iz * nx + xl]) hl = land.height(x - r.cell, z, r.lod);
        if (skip[iz * nx + xr]) hr = land.height(x + r.cell, z, r.lod);
        if (skip[zl * nx + ix]) hd = land.height(x, z - r.cell, r.lod);
        if (skip[zr * nx + ix]) hu = land.height(x, z + r.cell, r.lod);
        const dx = (xr - xl) * r.cell, dz = (zr - zl) * r.cell;
        const nxv = -(hr - hl) / dx, nzv = -(hu - hd) / dz;
        const il = 1 / Math.hypot(nxv, 1, nzv);
        nor[k * 3] = nxv * il; nor[k * 3 + 1] = il; nor[k * 3 + 2] = nzv * il;
        const slope = Math.hypot(nxv, nzv);

        // concavity for baked AO
        const avg = 0.25 * (hl + hr + hd + hu);
        const conc = avg - h;
        const ao = 1 - 0.26 * smoothstep(0.2, 3.2, conc / (r.cell / 3));

        this.colorAt(x, z, h, slope, conc, c);
        col[k * 3] = c.r * ao; col[k * 3 + 1] = c.g * ao; col[k * 3 + 2] = c.b * ao;

        if (doBake) {
          // soft hillshadow towards the sun
          let vis = 1;
          const ox = sunH.x, oz = sunH.y;
          for (let d = stepLen; d < maxDist; d += stepLen * (1 + d / 900)) {
            const hs = shadow.sample(x + ox * d, z + oz * d);
            if (hs < -1e8) break;
            const ry = h + 1.5 + d * tanE;
            const occl = (hs - ry) / (6 + d * 0.035);
            if (occl > -1) vis = Math.min(vis, clamp(1 - (occl + 1) * 0.7, 0, 1));
            if (vis <= 0.001) break;
          }
          bake[k] = vis;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aBake', new THREE.BufferAttribute(bake, 1));
    geo.setIndex(nx * nz > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    const mesh = new THREE.Mesh(geo, this.material);
    mesh.frustumCulled = true;
    mesh.name = `terrain-ring-${ringIndex}`;
    return mesh;
  }

  private colorAt(x: number, z: number, h: number, slope: number, conc: number, out: THREE.Color) {
    const land = this.land;
    const nLarge = noise.fbm2(x * 0.006 + 13, z * 0.006 - 4, 3) * 0.5 + 0.5;
    const nMed = noise.fbm2(x * 0.03 + 5, z * 0.03 + 2, 3) * 0.5 + 0.5;
    out.copy(grass).lerp(lush, nMed);
    // altitude: moor
    const moorAmt = moorMask(x, z, h);
    out.lerp(moor, smoothstep(40, 130, h) * 0.8);
    out.lerp(heather, moorAmt * 0.55 * smoothstep(0.4, 0.7, nMed));
    out.lerp(bracken, brackenMask(x, z, h) * 0.65 * smoothstep(0.35, 0.65, nLarge));
    // forest floor
    const pm = pineMask(x, z, h, slope);
    out.lerp(forest, pm * 0.7);
    out.lerp(forest, broadleafMask(x, z, h, slope) * 0.35);
    // rock on steep ground
    const rockW = smoothstep(0.5, 0.95, slope + (nMed - 0.5) * 0.25);
    rk.copy(rock).lerp(rockDark, smoothstep(0.35, 0.75, nMed));
    out.lerp(rk, rockW);
    out.lerp(scree, smoothstep(0.85, 1.25, slope) * 0.5 * nMed);
    // wet valley floor
    out.multiplyScalar(1 - 0.22 * smoothstep(0, 4, conc) );
    // river banks
    const dR = land.riverDist(x, z);
    out.lerp(gravel, (1 - smoothstep(2.5, 7.5, dR)) * 0.85);
    // railway formation
    const dT = land.trackDistance(x, z);
    if (dT < 5.5) {
      out.lerp(gravelDark, 1 - smoothstep(3.6, 5.5, dT));
    }
    // very high ground / ridges: more bare rock
    out.lerp(rock, smoothstep(220, 380, h) * 0.35);
  }
}
