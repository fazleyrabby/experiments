import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Track, makeFrame, RAIL_HALF } from './track';
import { patch } from '../core/shaders';
import { Rng } from '../core/noise';

/** Rail section outline, x across, y up, head top at y = 0 (metres). */
const RAIL_PROFILE: [number, number][] = [
  [-0.032, 0], [0.032, 0], [0.035, -0.009], [0.034, -0.030], [0.013, -0.046], [0.009, -0.062],
  [0.009, -0.118], [0.070, -0.134], [0.070, -0.146], [-0.070, -0.146], [-0.070, -0.134],
  [-0.009, -0.118], [-0.009, -0.062], [-0.013, -0.046], [-0.034, -0.030], [-0.035, -0.009],
];

export class TrackMeshes {
  readonly group = new THREE.Group();
  /** sleeper top relative to rail head top */
  static SLEEPER_TOP = -0.146;

  constructor(private track: Track) {
    this.group.name = 'track';
    this.buildBallast();
    this.buildRails();
    this.buildSleepersAndFittings();
  }

  private buildBallast() {
    const tr = this.track;
    const f = makeFrame();
    const prof: [number, number][] = [
      [3.05, -0.82], [2.15, -0.21], [1.9, -0.172], [-1.9, -0.172], [-2.15, -0.21], [-3.05, -0.82],
    ];
    const step = 1;
    const count = Math.floor(tr.length / step);
    const verts: number[] = [];
    const cols: number[] = [];
    const idx: number[] = [];
    const rng = new Rng(77);
    const c = new THREE.Color();
    for (let i = 0; i <= count; i++) {
      const s = i * step;
      tr.frame(s, f);
      for (let k = 0; k < prof.length; k++) {
        const [x, y] = prof[k];
        verts.push(
          f.p.x + f.r.x * x + f.u.x * y,
          f.p.y + f.r.y * x + f.u.y * y,
          f.p.z + f.r.z * x + f.u.z * y,
        );
        const g = 0.5 + rng.range(-0.08, 0.08);
        c.setRGB(g * 0.86, g * 0.83, g * 0.78, THREE.SRGBColorSpace);
        cols.push(c.r, c.g, c.b);
      }
    }
    const nk = prof.length;
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < nk - 1; k++) {
        const a = i * nk + k, b = a + 1, c2 = a + nk, d = c2 + 1;
        idx.push(a, c2, b, b, c2, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, metalness: 0 }), {
      key: 'ballast',
      fragColor: /* glsl */ `
        float g1 = heVNoise2(vWPos.xz * 26.0 + vWPos.y * 9.0);
        float g2 = heVNoise2(vWPos.xz * 71.0 - vWPos.y * 13.0);
        float g3 = heVNoise2(vWPos.xz * 7.0);
        diffuseColor.rgb *= 0.55 + 0.9 * g1 * (0.6 + 0.8 * g2);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.15, 1.02, 0.85), smoothstep(0.55, 0.9, g3) * 0.5);
      `,
      fragNormal: /* glsl */ `
        float hb = heVNoise2(vWPos.xz * 26.0 + vWPos.y * 9.0) * 0.5 + heVNoise2(vWPos.xz * 71.0 - vWPos.y * 13.0) * 0.35;
        float bf = 1.0 - smoothstep(10.0, 55.0, length(vViewPosition));
        normal = hePerturb(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * 0.9 * bf, faceDirection);
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    this.group.add(mesh);
  }

  private buildRails() {
    const tr = this.track;
    const f = makeFrame();
    const step = 1;
    const count = Math.floor(tr.length / step);
    const np = RAIL_PROFILE.length;
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const steel = new THREE.Color().setRGB(0.72, 0.72, 0.74, THREE.SRGBColorSpace);
    const rust = new THREE.Color().setRGB(0.30, 0.18, 0.11, THREE.SRGBColorSpace);

    const edgeN: [number, number][] = [];
    for (let k = 0; k < np; k++) {
      const [x0, y0] = RAIL_PROFILE[k];
      const [x1, y1] = RAIL_PROFILE[(k + 1) % np];
      const ex = x1 - x0, ey = y1 - y0;
      const l = Math.hypot(ex, ey);
      edgeN.push([-ey / l, ex / l]); // outward for clockwise-ordered outline
    }

    for (const side of [-1, 1]) {
      const base = pos.length / 3;
      for (let i = 0; i <= count; i++) {
        tr.frame(i * step, f);
        for (let k = 0; k < np; k++) {
          const [x, y] = RAIL_PROFILE[k];
          const lx = side * RAIL_HALF + x;
          pos.push(
            f.p.x + f.r.x * lx + f.u.x * y,
            f.p.y + f.r.y * lx + f.u.y * y,
            f.p.z + f.r.z * lx + f.u.z * y,
          );
          // vertex normals: average of adjacent edge normals
          const n0 = edgeN[(k + np - 1) % np], n1 = edgeN[k];
          let nx = n0[0] + n1[0], ny = n0[1] + n1[1];
          const l = Math.hypot(nx, ny) || 1;
          nx /= l; ny /= l;
          nor.push(
            f.r.x * nx + f.u.x * ny,
            f.r.y * nx + f.u.y * ny,
            f.r.z * nx + f.u.z * ny,
          );
          const head = y > -0.05 ? 1 : 0;
          const c = head ? steel : rust;
          col.push(c.r, c.g, c.b);
        }
      }
      for (let i = 0; i < count; i++) {
        for (let k = 0; k < np; k++) {
          const a = base + i * np + k;
          const b = base + i * np + ((k + 1) % np);
          const c = a + np, d = b + np;
          idx.push(a, b, c, b, d, c);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.85, side: THREE.FrontSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  private buildSleepersAndFittings() {
    const tr = this.track;
    const f = makeFrame();
    const pitch = 0.7;
    const count = Math.floor(tr.length / pitch);

    const sleeperGeo = new THREE.BoxGeometry(2.6, 0.13, 0.26, 1, 1, 1);
    const sleepers = new THREE.InstancedMesh(
      sleeperGeo,
      patch(new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0 }), {
        key: 'sleeper',
        fragColor: /* glsl */ `
          float grain = heVNoise2(vec2(vOPos.x * 3.0, vOPos.z * 90.0 + vRand * 40.0));
          float g2 = heVNoise2(vec2(vOPos.x * 14.0 + vRand * 9.0, vOPos.z * 30.0));
          diffuseColor.rgb *= 0.72 + 0.5 * grain * (0.7 + 0.5 * g2);
          // creosote/oil near the rail seats, pale weathered ends
          float endW = smoothstep(1.0, 1.3, abs(vOPos.x));
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.35, 1.25, 1.1), endW * 0.5);
        `,
      }),
      count,
    );
    sleepers.castShadow = false;
    sleepers.receiveShadow = true;

    // cast-iron chair + key
    const parts: THREE.BufferGeometry[] = [];
    const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      g.translate(x, y, z);
      return g;
    };
    parts.push(box(0.2, 0.022, 0.13, 0, 0.011, 0));
    parts.push(box(0.025, 0.07, 0.12, -0.054, 0.045, 0));
    parts.push(box(0.025, 0.065, 0.12, 0.054, 0.04, 0));
    parts.push(box(0.012, 0.045, 0.1, 0.034, 0.055, 0));
    const chairGeo = mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g; }))!;
    const chairs = new THREE.InstancedMesh(
      chairGeo,
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.20, 0.16, 0.13, THREE.SRGBColorSpace), roughness: 0.7, metalness: 0.6 }),
      count * 2,
    );

    const m = new THREE.Matrix4();
    const basis = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const rng = new Rng(4242);
    const col = new THREE.Color();
    const yawQ = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3(1, 1, 1);
    const jitterPos = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      tr.frame(i * pitch, f);
      basis.makeBasis(f.r, f.u, f.t);
      q.setFromRotationMatrix(basis);
      yawQ.setFromAxisAngle(up, 0);
      const yaw = rng.range(-0.012, 0.012);
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().copy(f.u), yaw);
      q.premultiply(qy);
      jitterPos.copy(f.r).multiplyScalar(rng.range(-0.025, 0.025));
      pos.copy(f.p).addScaledVector(f.u, TrackMeshes.SLEEPER_TOP - 0.065).add(jitterPos);
      const sy = rng.range(0.97, 1.04);
      m.compose(pos, q, scl.set(rng.range(0.99, 1.01), sy, 1));
      sleepers.setMatrixAt(i, m);
      const tone = rng.range(0.55, 1.0);
      col.setRGB(0.20 * tone, 0.16 * tone, 0.12 * tone, THREE.SRGBColorSpace);
      if (rng.chance(0.08)) col.setRGB(0.36, 0.31, 0.25, THREE.SRGBColorSpace);
      sleepers.setColorAt(i, col);
      // chairs
      for (let sd = 0; sd < 2; sd++) {
        const side = sd === 0 ? -1 : 1;
        pos.copy(f.p).addScaledVector(f.u, TrackMeshes.SLEEPER_TOP).addScaledVector(f.r, side * RAIL_HALF).add(jitterPos);
        m.compose(pos, q, scl.set(side, 1, 1));
        chairs.setMatrixAt(i * 2 + sd, m);
      }
    }
    sleepers.instanceMatrix.needsUpdate = true;
    if (sleepers.instanceColor) sleepers.instanceColor.needsUpdate = true;
    chairs.instanceMatrix.needsUpdate = true;
    chairs.castShadow = false;
    chairs.receiveShadow = true;
    sleepers.frustumCulled = false;
    chairs.frustumCulled = false;
    this.group.add(sleepers, chairs);

    // fishplates at rail joints
    const jointPitch = 18.3;
    const jcount = Math.floor(tr.length / jointPitch);
    const plate = mergeGeometries([
      box(0.014, 0.075, 0.62, 0.0, -0.08, 0),
      ...[-0.22, -0.08, 0.08, 0.22].map((z) => {
        const g = new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6).toNonIndexed();
        g.rotateZ(Math.PI / 2);
        g.translate(0.01, -0.08, z);
        return g;
      }),
    ].map((g) => { g.deleteAttribute('uv'); return g; }))!;
    const plates = new THREE.InstancedMesh(
      plate,
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.28, 0.22, 0.18, THREE.SRGBColorSpace), roughness: 0.6, metalness: 0.7 }),
      jcount * 4,
    );
    for (let i = 0; i < jcount; i++) {
      tr.frame(i * jointPitch + (i % 2) * 0.3, f);
      basis.makeBasis(f.r, f.u, f.t);
      q.setFromRotationMatrix(basis);
      for (let sd = 0; sd < 4; sd++) {
        const side = sd < 2 ? -1 : 1;
        const face = sd % 2 === 0 ? 1 : -1;
        pos.copy(f.p).addScaledVector(f.r, side * RAIL_HALF + face * 0.0105 * 1);
        m.compose(pos, q, scl.set(face, 1, 1));
        plates.setMatrixAt(i * 4 + sd, m);
      }
    }
    plates.instanceMatrix.needsUpdate = true;
    plates.frustumCulled = false;
    plates.receiveShadow = true;
    this.group.add(plates);
  }

  dispose() {
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
  }
}
