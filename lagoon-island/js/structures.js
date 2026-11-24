import * as THREE from 'three';
import { GB, Perlin, rng, lerp, clamp, sstep } from './util.js';
import { WORLD, heightAt, clearOfStructures } from './world.js';
import { woodMaterial } from './materials.js';

const V = THREE.Vector3;
const TONE = {
  weather: [0.3, 0.24, 0.175],
  dark: [0.15, 0.108, 0.075],
  light: [0.43, 0.345, 0.245],
  wet: [0.075, 0.06, 0.042],
};

const FACES = [
  [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
  [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
  [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
];

/** Timber kit: boxes, beams and round posts with world-scale grain UVs. */
class Kit {
  constructor(seed = 1) {
    this.R = rng(seed);
    this.p = [];
    this.n = [];
    this.u = [];
    this.c = [];
    this.i = [];
    this.count = 0;
  }

  vary(t, amt = 0.2) {
    const k = 1 + (this.R() - 0.5) * amt * 2;
    const w = (this.R() - 0.5) * 0.08;
    return [t[0] * k * (1 + w), t[1] * k, t[2] * k * (1 - w)];
  }

  box(m, sx, sy, sz, tone) {
    const hs = [sx / 2, sy / 2, sz / 2];
    const nm = new THREE.Matrix3().setFromMatrix4(m);
    const c = this.vary(tone);
    const ox = this.R() * 40;
    const oy = this.R() * 40;
    const P = new V();
    const Nn = new V();
    for (const [n, a, b] of FACES) {
      const hn = Math.abs(n[0]) * hs[0] + Math.abs(n[1]) * hs[1] + Math.abs(n[2]) * hs[2];
      const hu = Math.abs(a[0]) * hs[0] + Math.abs(a[1]) * hs[1] + Math.abs(a[2]) * hs[2];
      const hv = Math.abs(b[0]) * hs[0] + Math.abs(b[1]) * hs[1] + Math.abs(b[2]) * hs[2];
      const base = this.count;
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        P.set(
          n[0] * hn + a[0] * hu * su + b[0] * hv * sv,
          n[1] * hn + a[1] * hu * su + b[1] * hv * sv,
          n[2] * hn + a[2] * hu * su + b[2] * hv * sv,
        ).applyMatrix4(m);
        Nn.set(n[0], n[1], n[2]).applyMatrix3(nm).normalize();
        this.p.push(P.x, P.y, P.z);
        this.n.push(Nn.x, Nn.y, Nn.z);
        if (hu >= hv) this.u.push(ox + su * hu, oy + sv * hv);
        else this.u.push(ox + sv * hv, oy + su * hu);
        this.c.push(c[0], c[1], c[2]);
        this.count++;
      }
      this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  at(x, y, z, sx, sy, sz, tone, ry = 0, rx = 0, rz = 0) {
    const m = new THREE.Matrix4().compose(
      new V(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new V(1, 1, 1),
    );
    this.box(m, sx, sy, sz, tone);
  }

  beam(a, b, w, h, tone) {
    const X = new V().subVectors(b, a);
    const len = X.length();
    X.normalize();
    const ref = Math.abs(X.y) > 0.92 ? new V(1, 0, 0) : new V(0, 1, 0);
    const Z = new V().crossVectors(X, ref).normalize();
    const Y = new V().crossVectors(Z, X).normalize();
    const m = new THREE.Matrix4().makeBasis(X, Y, Z);
    m.setPosition(new V().addVectors(a, b).multiplyScalar(0.5));
    this.box(m, len, h, w, tone);
  }

  post(a, b, r, colorFn, segs = 10) {
    const axis = new V().subVectors(b, a);
    const len = axis.length();
    axis.normalize();
    const ref = Math.abs(axis.y) > 0.9 ? new V(1, 0, 0) : new V(0, 1, 0);
    const S = new V().crossVectors(axis, ref).normalize();
    const T = new V().crossVectors(S, axis).normalize();
    const rows = Math.max(3, Math.ceil(len / 0.16));
    const base = this.count;
    const ou = this.R() * 30;
    const wob = this.R() * 6.28;
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      const c = colorFn(t, lerp(a.y, b.y, t));
      const rr = r * (1 + 0.07 * Math.sin(t * 9 + wob) + 0.04 * Math.sin(t * 23 + wob));
      for (let j = 0; j <= segs; j++) {
        const an = (j / segs) * Math.PI * 2;
        const nx = S.x * Math.cos(an) + T.x * Math.sin(an);
        const ny = S.y * Math.cos(an) + T.y * Math.sin(an);
        const nz = S.z * Math.cos(an) + T.z * Math.sin(an);
        this.p.push(a.x + axis.x * len * t + nx * rr, a.y + axis.y * len * t + ny * rr, a.z + axis.z * len * t + nz * rr);
        this.n.push(nx, ny, nz);
        this.u.push(ou + t * len, (j / segs) * r * 6.28 + ou);
        this.c.push(c[0], c[1], c[2]);
        this.count++;
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < segs; j++) {
        const p = base + i * (segs + 1) + j;
        const q = p + segs + 1;
        this.i.push(p, q, p + 1, p + 1, q, q + 1);
      }
    }
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.u), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(this.i), 1));
    return g;
  }
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function rope(points, radius, color = 0x8c7450) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(16, points.length * 12), radius, 6, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
  );
  return shadowed(mesh);
}

function sag(a, b, drop, n = 9) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new V().lerpVectors(a, b, t);
    p.y -= Math.sin(t * Math.PI) * drop;
    out.push(p);
  }
  return out;
}

function thatch(F, roofY, xMin, xMax, zRidge, zEave, seed) {
  const R = rng(seed);
  const rows = 36;
  const perRow = 430;
  const down = new V(0, roofY(zEave) - roofY(zRidge), zEave - zRidge).normalize();
  const side = new V(1, 0, 0);
  const n = new V().crossVectors(zEave > zRidge ? side : side.clone().negate(), down).normalize();
  if (n.y < 0) n.negate();
  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const z = lerp(zRidge, zEave, t);
    const y = roofY(z);
    for (let b = 0; b < perRow; b++) {
      const x = lerp(xMin, xMax, (b + R()) / perRow);
      const len = 0.36 + R() * 0.2;
      const w = 0.006 + R() * 0.012;
      const lift = 0.025 + R() * 0.07;
      const skew = (R() - 0.5) * 0.09;
      const age = R();
      const base = age < 0.55 ? [0.3, 0.225, 0.122] : age < 0.86 ? [0.17, 0.128, 0.075] : [0.44, 0.345, 0.195];
      const shade = (0.62 + R() * 0.46) * lerp(0.92, 1.08, t);
      const hx = x;
      const hy = y + n.y * lift;
      const hz = z + n.z * lift;
      const tx = hx + skew;
      const ty = hy + down.y * len - n.y * 0.018;
      const tz = hz + down.z * len - n.z * 0.018;
      const a = F.v(hx - w, hy, hz, n.x, n.y, n.z, base[0] * shade * 0.55, base[1] * shade * 0.55, base[2] * shade * 0.55);
      const c = F.v(hx + w, hy, hz, n.x, n.y, n.z, base[0] * shade * 0.55, base[1] * shade * 0.55, base[2] * shade * 0.55);
      const d = F.v(tx + w * 0.42, ty, tz, n.x, n.y, n.z, base[0] * shade, base[1] * shade, base[2] * shade);
      const e = F.v(tx - w * 0.42, ty, tz, n.x, n.y, n.z, base[0] * shade, base[1] * shade, base[2] * shade);
      if (zEave > zRidge) F.quad(a, e, d, c);
      else F.quad(a, c, d, e);
    }
  }
}

function buildBoat(U) {
  const g = new GB();
  const L = 2.3;
  const W = 0.42;
  const D = 0.29;
  const hull = (s, a) => {
    const sp = Math.sin(Math.PI * clamp(s, 0.002, 0.998));
    const beam = W * Math.pow(sp, 0.62);
    const depth = D * Math.pow(sp, 0.42);
    const sheer = 0.16 * (2 * s - 1) ** 2;
    const an = (a * Math.PI) / 2;
    return new V(beam * Math.sin(an), sheer - depth * Math.cos(an) * (1 - 0.14 * Math.abs(Math.sin(an))), (s - 0.5) * L);
  };
  const R = rng(77);
  const strakes = 8;
  const stations = 34;
  for (let k = 0; k < strakes; k++) {
    const a0 = -1 + (k / strakes) * 2;
    const a1 = -1 + ((k + 1) / strakes) * 2;
    const near = Math.abs((a0 + a1) / 2);
    const paint = near > 0.72 ? [0.62, 0.58, 0.47] : [0.045, 0.19, 0.2];
    const tint = 0.84 + R() * 0.26;
    const base = g.count;
    for (let i = 0; i <= stations; i++) {
      const s = i / stations;
      const p0 = hull(s, a0 + 0.008);
      const p1 = hull(s, a1 - 0.008);
      const ds = hull(Math.min(1, s + 0.01), (a0 + a1) / 2).sub(hull(Math.max(0, s - 0.01), (a0 + a1) / 2));
      const n = new V().crossVectors(new V().subVectors(p1, p0), ds).normalize();
      const worn = 0.72 + 0.34 * Math.abs(Math.sin(s * 23 + k * 3.1) * Math.sin(s * 7.7 + k));
      const low = lerp(0.54, 1, sstep(-0.28, 0.02, p0.y));
      const c = [paint[0] * tint * worn * low, paint[1] * tint * worn * low, paint[2] * tint * worn * low];
      g.v(p0.x, p0.y, p0.z, n.x, n.y, n.z, c[0], c[1], c[2]);
      g.v(p1.x, p1.y, p1.z, n.x, n.y, n.z, c[0], c[1], c[2]);
    }
    for (let i = 0; i < stations; i++) {
      const a = base + i * 2;
      g.quad(a, a + 1, a + 3, a + 2);
    }
  }
  const shell = shadowed(new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.62,
    side: THREE.DoubleSide,
  })));

  const kit = new Kit(301);
  for (const z of [-0.54, 0.02, 0.56]) {
    const s = z / L + 0.5;
    const half = W * Math.pow(Math.sin(Math.PI * s), 0.62) * 0.98;
    kit.at(0, 0.015 + 0.16 * (2 * s - 1) ** 2 - 0.05, z, half * 2, 0.024, 0.14, TONE.light);
  }
  kit.at(0, -0.2, 0, 0.42, 0.016, 1.42, TONE.dark);
  const wood = shadowed(new THREE.Mesh(kit.build(), woodMaterial(U)));

  const boat = new THREE.Group();
  boat.add(shell, wood);
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 26; i++) {
      const p = hull(i / 26, side);
      p.y += 0.008;
      pts.push(p);
    }
    boat.add(rope(pts, 0.018, 0x5c4630));
  }
  const oar = new Kit(302);
  oar.post(new V(-0.3, 0.02, -0.72), new V(0.2, 0.09, 0.82), 0.014, () => TONE.light, 6);
  oar.at(0.235, 0.1, 0.92, 0.09, 0.012, 0.3, TONE.light, 0.31);
  boat.add(shadowed(new THREE.Mesh(oar.build(), woodMaterial(U))));
  return boat;
}

function buildBarrel(U, tone = TONE.weather) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new THREE.Vector2(0.15 + 0.038 * Math.sin(t * Math.PI), t * 0.42));
  }
  pts.push(new THREE.Vector2(0.135, 0.42), new THREE.Vector2(0, 0.405));
  const geo = new THREE.LatheGeometry(pts, 28);
  const uv = geo.attributes.uv;
  const col = new Float32Array(uv.count * 3);
  for (let i = 0; i < uv.count; i++) {
    const a = uv.getX(i);
    const stave = 0.78 + 0.28 * Math.sin(Math.floor(a * 18) * 12.9898) ** 2;
    col[i * 3] = tone[0] * stave;
    col[i * 3 + 1] = tone[1] * stave;
    col[i * 3 + 2] = tone[2] * stave;
    uv.setXY(i, uv.getY(i) * 1.2, a * 3.2);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(geo, woodMaterial(U))));
  const metal = new THREE.MeshStandardMaterial({ color: 0x35302a, metalness: 0.75, roughness: 0.52 });
  for (const y of [0.07, 0.33]) {
    const r = 0.15 + 0.038 * Math.sin((y / 0.42) * Math.PI) + 0.004;
    const band = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 5, 32), metal));
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  }
  return g;
}

function rockGeometry(seed, detailX = 34, detailY = 22) {
  const P = new Perlin(seed);
  const radius = (d) => {
    const a = P.fbm(d.x * 1.15 + d.z * 0.7 + 3.1, d.y * 1.15 - d.z * 0.5, 5) * 0.52;
    const b = Math.abs(P.fbm(d.x * 2.8 - d.z, d.y * 2.8 + d.z * 0.8 + 9, 3)) * -0.22;
    return 1 + a + b;
  };
  const g = new THREE.SphereGeometry(1, detailX, detailY);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const d = new V();
  const t1 = new V();
  const t2 = new V();
  const a = new V();
  const b = new V();
  const c = new V();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const r = radius(d);
    t1.crossVectors(d, Math.abs(d.y) > 0.9 ? new V(1, 0, 0) : new V(0, 1, 0)).normalize();
    t2.crossVectors(d, t1).normalize();
    const e = 0.035;
    a.copy(d).multiplyScalar(r);
    const pu = new V().copy(d).addScaledVector(t1, e).normalize();
    b.copy(pu).multiplyScalar(radius(pu));
    const pv = new V().copy(d).addScaledVector(t2, e).normalize();
    c.copy(pv).multiplyScalar(radius(pv));
    const n = new V().crossVectors(b.sub(a), c.sub(a)).normalize();
    if (n.dot(d) < 0) n.negate();
    pos.setXYZ(i, a.x, a.y * 0.72, a.z);
    nor.setXYZ(i, n.x, n.y / 0.72, n.z);
    const k = 0.76 + P.fbm(d.x * 4, d.y * 4 + d.z * 3, 3) * 0.72;
    col[i * 3] = 0.25 * k;
    col[i * 3 + 1] = 0.225 * k;
    col[i * 3 + 2] = 0.195 * k;
  }
  nor.needsUpdate = true;
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeBoundingSphere();
  return g;
}

function rockMaterial(U) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86 });
  m.onBeforeCompile = (s) => {
    s.uniforms.tNoise = U.tNoise;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRockW;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
         #ifdef USE_INSTANCING
         vRockW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
         #else
         vRockW = (modelMatrix * vec4(transformed, 1.0)).xyz;
         #endif`,
      );
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRockW; uniform sampler2D tNoise; float rockH; float rockWet;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         vec2 rq = vRockW.xz + vRockW.y * vec2(0.71, -0.53);
         float r1 = texture2D(tNoise, rq * 0.31).b;
         float r2 = texture2D(tNoise, rq * 1.27).a;
         rockH = r1 * 0.6 + r2 * 0.4;
         diffuseColor.rgb *= 0.58 + rockH * 0.9;
         rockWet = 1.0 - smoothstep(0.015, 0.2 + r1 * 0.12, vRockW.y);
         diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.34, 0.37, 0.3), rockWet);
         float rockMoss = smoothstep(0.42, 0.68, texture2D(tNoise, rq * 0.17).r) * smoothstep(0.16, 0.44, vRockW.y);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.06, 0.105, 0.025) * (0.7 + r2 * 0.6), rockMoss * 0.82);`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.88, 0.2, rockWet);')
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           vec3 vp = -vViewPosition;
           vec3 dpx = dFdx(vp), dpy = dFdy(vp);
           float dhx = dFdx(rockH), dhy = dFdy(rockH);
           vec3 r1v = cross(dpy, normal), r2v = cross(normal, dpx);
           float det = dot(dpx, r1v);
           vec3 grad = sign(det) * (dhx * r1v + dhy * r2v) * 0.05;
           normal = normalize(abs(det) * normal - grad);
         }`,
      );
  };
  m.customProgramCacheKey = () => 'rock';
  return m;
}

function buildRocks(U) {
  const R = rng(7741);
  const group = new THREE.Group();
  const shapes = [rockGeometry(101), rockGeometry(202), rockGeometry(303)];
  const mat = rockMaterial(U);
  const items = [];
  let tries = 2600;
  while (items.length < 84 && tries-- > 0) {
    const a = R() * Math.PI * 2;
    const r = 3 + R() * 9.9;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = heightAt(x, z);
    if (y < -0.55 || y > 0.44 || !clearOfStructures(x, z, 0.4)) continue;
    const big = R() < 0.16;
    items.push({ x, y: y - 0.04, z, s: big ? 0.42 + R() * 0.42 : 0.08 + R() * 0.2, yaw: R() * 6.28, tilt: R() * 0.5 });
  }
  items.push({ x: -9.9, y: -0.22, z: 7.4, s: 1.05, yaw: 1.2, tilt: 0.2 });
  items.push({ x: -9.1, y: -0.32, z: 8.25, s: 0.64, yaw: 3.1, tilt: 0.1 });
  items.push({ x: 10.2, y: -0.34, z: -4.6, s: 0.86, yaw: 0.4, tilt: 0.3 });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  shapes.forEach((geo, si) => {
    const list = items.filter((_, i) => i % shapes.length === si);
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      q.setFromEuler(new THREE.Euler(it.tilt, it.yaw, it.tilt * 0.6));
      m.compose(new V(it.x, it.y, it.z), q, new V(it.s, it.s * (0.72 + (i % 4) * 0.08), it.s * 1.12));
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  return group;
}

export function buildStructures(U) {
  const H = WORLD.hut;
  const root = new THREE.Group();
  root.position.set(H.x, 0, H.z);
  root.rotation.y = H.rot;
  root.scale.setScalar(H.scale);
  const ground = (lx, lz) => {
    const c = Math.cos(H.rot);
    const s = Math.sin(H.rot);
    return heightAt(H.x + (c * lx + s * lz) * H.scale, H.z + (-s * lx + c * lz) * H.scale) / H.scale;
  };

  const kit = new Kit(4021);
  const F = 0.86;
  const TOP = 1.88;
  const pileColor = (_, y) => {
    const dry = sstep(-0.02, 0.2, y);
    const algae = (1 - sstep(-0.1, 0.12, y)) * 0.6;
    const c = [lerp(TONE.wet[0], TONE.weather[0] * 0.78, dry), lerp(TONE.wet[1], TONE.weather[1] * 0.78, dry), lerp(TONE.wet[2], TONE.weather[2] * 0.78, dry)];
    return [lerp(c[0], 0.035, algae), lerp(c[1], 0.07, algae), lerp(c[2], 0.03, algae)];
  };

  for (const x of [-1.27, -0.42, 0.42, 1.27]) {
    for (const z of [-1.08, 0.76, 1.6]) {
      kit.post(new V(x, ground(x, z) - 0.18, z), new V(x, z === 1.6 ? 1.76 : F, z), 0.052, pileColor, 9);
    }
  }
  for (const z of [-1.08, 0.76, 1.6]) kit.at(0, F - 0.075, z, 2.72, 0.085, 0.09, TONE.dark);
  for (const x of [-1.27, -0.64, 0, 0.64, 1.27]) kit.at(x, F - 0.05, 0.26, 0.07, 0.07, 2.82, TONE.dark);
  for (let z = -1.14; z < 1.68; z += 0.122) {
    const bow = (kit.R() - 0.5) * 0.008;
    kit.at((kit.R() - 0.5) * 0.04, F + bow, z, 2.74 + kit.R() * 0.06, 0.03, 0.112, TONE.weather, (kit.R() - 0.5) * 0.009);
  }

  const wall = (ax, az, bx, bz, openings = []) => {
    const len = Math.hypot(bx - ax, bz - az);
    const ry = -Math.atan2(bz - az, bx - ax);
    const count = Math.round(len / 0.112);
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const px = lerp(ax, bx, u);
      const pz = lerp(az, bz, u);
      const lu = u * len;
      let spans = [[F + 0.012, TOP]];
      for (const o of openings) {
        if (lu > o.u0 && lu < o.u1) {
          spans = spans.flatMap(([y0, y1]) => {
            const out = [];
            if (o.y0 > y0) out.push([y0, Math.min(o.y0, y1)]);
            if (o.y1 < y1) out.push([Math.max(o.y1, y0), y1]);
            return out;
          });
        }
      }
      for (const [y0, y1] of spans) {
        if (y1 - y0 < 0.02) continue;
        const tone = kit.R() < 0.14 ? TONE.dark : kit.R() < 0.3 ? TONE.light : TONE.weather;
        kit.at(px, (y0 + y1) / 2, pz, 0.104, y1 - y0, 0.026, tone, ry);
      }
    }
    for (const o of openings) {
      const fa = o.u0 / len;
      const fb = o.u1 / len;
      const pa = new V(lerp(ax, bx, fa), 0, lerp(az, bz, fa));
      const pb = new V(lerp(ax, bx, fb), 0, lerp(az, bz, fb));
      const out = new V(bz - az, 0, -(bx - ax)).normalize().multiplyScalar(0.022);
      const frame = (x0, y0, z0, x1, y1, z1) => kit.beam(new V(x0 + out.x, y0, z0 + out.z), new V(x1 + out.x, y1, z1 + out.z), 0.032, 0.05, TONE.dark);
      frame(pa.x, o.y1, pa.z, pb.x, o.y1, pb.z);
      if (o.y0 > F + 0.05) frame(pa.x, o.y0, pa.z, pb.x, o.y0, pb.z);
      frame(pa.x, o.y0, pa.z, pa.x, o.y1, pa.z);
      frame(pb.x, o.y0, pb.z, pb.x, o.y1, pb.z);
      if (o.mullion) frame((pa.x + pb.x) / 2, o.y0, (pa.z + pb.z) / 2, (pa.x + pb.x) / 2, o.y1, (pa.z + pb.z) / 2);
    }
  };
  wall(-1.25, 0.75, 1.25, 0.75, [
    { u0: 1.02, u1: 1.48, y0: F, y1: 1.62 },
    { u0: 1.76, u1: 2.2, y0: 1.18, y1: 1.56, mullion: true },
    { u0: 0.26, u1: 0.7, y0: 1.18, y1: 1.56, mullion: true },
  ]);
  wall(1.25, -1.05, -1.25, -1.05);
  wall(1.25, 0.75, 1.25, -1.05, [{ u0: 0.66, u1: 1.14, y0: 1.2, y1: 1.56, mullion: true }]);
  wall(-1.25, -1.05, -1.25, 0.75);

  for (const [x, z] of [[-1.25, 0.75], [1.25, 0.75], [1.25, -1.05], [-1.25, -1.05]]) kit.at(x, (F + TOP) / 2, z, 0.075, TOP - F, 0.075, TONE.dark);
  kit.at(0, TOP - 0.015, 0.75, 2.62, 0.075, 0.07, TONE.dark);
  kit.at(0, TOP - 0.015, -1.05, 2.62, 0.075, 0.07, TONE.dark);
  kit.at(1.25, TOP - 0.015, -0.15, 0.07, 0.075, 1.88, TONE.dark);
  kit.at(-1.25, TOP - 0.015, -0.15, 0.07, 0.075, 1.88, TONE.dark);

  const roofY = (z) => (z >= 0.02 ? lerp(2.74, 1.68, (z - 0.02) / 1.92) : lerp(2.74, 1.74, (0.02 - z) / 1.76));
  for (const xSide of [-1.25, 1.25]) {
    for (let z = -1.02; z < 0.76; z += 0.108) {
      const top = roofY(z) - 0.035;
      if (top > TOP + 0.02) kit.at(xSide, (TOP + top) / 2, z, 0.024, top - TOP, 0.1, kit.R() < 0.25 ? TONE.dark : TONE.weather);
    }
  }
  for (let x = -1.72; x <= 1.74; x += 0.42) {
    kit.beam(new V(x, 2.72, 0.02), new V(x, 1.665, 1.94), 0.052, 0.07, TONE.dark);
    kit.beam(new V(x, 2.72, 0.02), new V(x, 1.725, -1.74), 0.052, 0.07, TONE.dark);
  }
  kit.at(0, 2.72, 0.02, 3.62, 0.09, 0.09, TONE.dark);
  kit.at(0, 1.74, 1.6, 2.98, 0.08, 0.09, TONE.dark);

  // Porch rail, with a gap for the dock stairs.
  for (const x of [-1.27, 1.27]) {
    kit.beam(new V(x, F + 0.42, 0.78), new V(x, F + 0.42, 1.6), 0.046, 0.05, TONE.weather);
    kit.beam(new V(x, F + 0.2, 0.78), new V(x, F + 0.2, 1.6), 0.03, 0.036, TONE.dark);
  }
  for (const sign of [-1, 1]) {
    kit.beam(new V(sign * 1.27, F + 0.42, 1.6), new V(sign * 0.52, F + 0.42, 1.6), 0.046, 0.05, TONE.weather);
    kit.beam(new V(sign * 1.27, F + 0.2, 1.6), new V(sign * 0.52, F + 0.2, 1.6), 0.03, 0.036, TONE.dark);
    for (let x = 0.6; x < 1.26; x += 0.135) kit.at(sign * x, F + 0.21, 1.6, 0.024, 0.42, 0.024, TONE.weather);
    kit.post(new V(sign * 0.52, F, 1.6), new V(sign * 0.52, F + 0.5, 1.6), 0.035, () => TONE.weather, 8);
  }

  // Dock: a short ramp then a long low walkway.
  const D = 0.54;
  const dockY = (z) => (z < 2.62 ? lerp(F - 0.02, D, sstep(1.62, 2.62, z)) : D);
  const dockEnd = 7.0;
  for (let z = 1.72; z < dockEnd; z += 0.128) {
    const y = dockY(z);
    const width = 0.92 + (kit.R() - 0.5) * 0.09;
    if (kit.R() < 0.018) continue;
    const tone = kit.R() < 0.18 ? TONE.dark : kit.R() < 0.3 ? TONE.light : TONE.weather;
    kit.at((kit.R() - 0.5) * 0.05, y + (kit.R() - 0.5) * 0.01, z, width, 0.028, 0.114, tone, (kit.R() - 0.5) * 0.045, (dockY(z + 0.05) - dockY(z - 0.05)) * -0.9, (kit.R() - 0.5) * 0.018);
  }
  for (const x of [-0.36, 0, 0.36]) {
    kit.beam(new V(x, F - 0.08, 1.66), new V(x, D - 0.055, 2.64), 0.06, 0.07, TONE.dark);
    kit.beam(new V(x, D - 0.055, 2.64), new V(x, D - 0.055, dockEnd), 0.06, 0.07, TONE.dark);
  }
  const pileZ = [];
  for (let z = 2.62; z < dockEnd + 0.1; z += 0.88) pileZ.push(z);
  for (const z of pileZ) {
    for (const x of [-0.52, 0.52]) {
      const tall = z > dockEnd - 1.2 || Math.round(z * 10) % 2 === 0;
      kit.post(new V(x, ground(x, z) - 0.25, z), new V(x + (kit.R() - 0.5) * 0.02, D + (tall ? 0.42 : 0.12), z), 0.05, pileColor, 10);
    }
    kit.at(0, D - 0.11, z, 1.08, 0.07, 0.06, TONE.dark);
  }

  // Crates.
  for (const [x, y, z, s, r] of [[-0.98, F + 0.135, 1.2, 0.26, 0.3], [-0.72, F + 0.1, 1.28, 0.19, -0.2], [-0.92, F + 0.34, 1.2, 0.16, 0.8]]) {
    for (let j = 0; j < 4; j++) {
      const py = y - s / 2 + (s / 4) * (j + 0.5);
      for (const [dx, dz, w, d] of [[0, s / 2, s, 0.012], [0, -s / 2, s, 0.012], [s / 2, 0, 0.012, s], [-s / 2, 0, 0.012, s]]) {
        kit.at(x + dx * Math.cos(r) + dz * Math.sin(r), py, z - dx * Math.sin(r) + dz * Math.cos(r), w, s / 4 - 0.006, d, TONE.light, r);
      }
    }
    kit.at(x, y + s / 2, z, s * 1.02, 0.012, s * 1.02, TONE.weather, r);
  }

  const wood = shadowed(new THREE.Mesh(kit.build(), woodMaterial(U)));
  root.add(wood);

  // Interior: a dark box with warm panes that light up after sunset.
  const interior = new THREE.Mesh(
    new THREE.BoxGeometry(2.43, TOP - F - 0.02, 1.73),
    new THREE.MeshStandardMaterial({ color: 0x0d0a07, roughness: 1, side: THREE.BackSide }),
  );
  interior.position.set(0, (F + TOP) / 2, -0.15);
  root.add(interior);
  const warmMat = new THREE.MeshStandardMaterial({ color: 0x120c06, emissive: 0xff9a3c, emissiveIntensity: 0, roughness: 0.25 });
  const pane = (x, y, z, w, h, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), warmMat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    root.add(m);
  };
  pane(-0.77, 1.37, 0.735, 0.44, 0.38);
  pane(0.73, 1.37, 0.735, 0.44, 0.38);
  pane(-0.0, 1.24, 0.72, 0.46, 0.76);
  pane(1.235, 1.38, -0.15, 0.48, 0.36, Math.PI / 2);

  // Thatched roof.
  const roofShell = new Kit(5120);
  const roofA = new V(0, (roofY(0.02) + roofY(1.94)) / 2 + 0.008, 0.98);
  const roofB = new V(0, (roofY(0.02) + roofY(-1.76)) / 2 + 0.008, -0.87);
  const lenFront = Math.hypot(1.92, roofY(0.02) - roofY(1.94));
  const lenBack = Math.hypot(1.78, roofY(0.02) - roofY(-1.76));
  roofShell.at(roofA.x, roofA.y, roofA.z, 3.6, 0.024, lenFront, TONE.dark, 0, Math.atan2(roofY(0.02) - roofY(1.94), 1.92));
  roofShell.at(roofB.x, roofB.y, roofB.z, 3.6, 0.024, lenBack, TONE.dark, 0, -Math.atan2(roofY(0.02) - roofY(-1.76), 1.78));
  root.add(shadowed(new THREE.Mesh(roofShell.build(), woodMaterial(U))));
  const straw = new GB();
  thatch(straw, roofY, -1.86, 1.86, 0.02, 1.96, 61);
  thatch(straw, roofY, -1.86, 1.86, 0.02, -1.78, 62);
  const strawMesh = shadowed(new THREE.Mesh(straw.build(), new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    side: THREE.DoubleSide,
  })));
  root.add(strawMesh);
  const ridge = shadowed(new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 3.74, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a3820, roughness: 1 }),
  ));
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(0, 2.79, 0.02);
  root.add(ridge);

  // Barrels and rope.
  const barrels = [[1.0, F + 0.015, 1.2, 1], [0.66, F + 0.015, 1.3, 0.9], [-0.28, D + 0.012, 6.56, 0.86]];
  barrels.forEach(([x, y, z, s], i) => {
    const b = buildBarrel(U, i === 1 ? TONE.dark : TONE.weather);
    b.position.set(x, y, z);
    b.rotation.y = i * 1.7;
    b.scale.setScalar(s);
    root.add(b);
  });
  for (let j = 0; j < 4; j++) {
    const coil = shadowed(new THREE.Mesh(
      new THREE.TorusGeometry(0.12 - j * 0.006, 0.015, 6, 24),
      new THREE.MeshStandardMaterial({ color: 0x8e7650, roughness: 1 }),
    ));
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0.28, D + 0.03 + j * 0.026, 6.56);
    root.add(coil);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < pileZ.length - 1; i++) {
      root.add(rope(sag(new V(side * 0.52, D + 0.28, pileZ[i]), new V(side * 0.52, D + 0.28, pileZ[i + 1]), 0.07), 0.0085));
    }
  }

  // Moored boat.
  const boat = buildBoat(U);
  const boatHome = new V(1.42, 0.075, 5.75);
  boat.position.copy(boatHome);
  boat.rotation.y = 0.11;
  root.add(boat);
  const mooringA = rope(sag(new V(0.52, D + 0.16, pileZ[pileZ.length - 2]), new V(1.34, 0.22, 4.62), 0.1), 0.009);
  root.add(mooringA);

  // Lanterns.
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, emissive: 0xffa24a, emissiveIntensity: 0, roughness: 0.3 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x1f1b17, metalness: 0.8, roughness: 0.5 });
  const makeLantern = (x, y, z) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.09, 10), lampMat);
    glow.position.y = -0.085;
    const cap = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.05, 8), iron));
    cap.position.y = -0.025;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.012, 8), iron);
    base.position.y = -0.135;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 5, 12), iron);
    hook.position.y = 0.008;
    g.add(glow, cap, base, hook);
    root.add(g);
    return g;
  };
  const lanternA = makeLantern(0.46, 1.68, 1.58);
  const lanternB = makeLantern(0.52, D + 0.42, pileZ[pileZ.length - 1] + 0.055);
  const lightA = new THREE.PointLight(0xff9a48, 0, 5.5, 2);
  lightA.position.set(0.46, 1.58, 1.62);
  root.add(lightA);
  const lightB = new THREE.PointLight(0xff9a48, 0, 4.2, 2);
  lightB.position.set(0.52, D + 0.3, pileZ[pileZ.length - 1] + 0.08);
  root.add(lightB);

  const group = new THREE.Group();
  group.add(root, buildRocks(U));

  return {
    group,
    root,
    update(time, wind, night) {
      boat.position.y = boatHome.y + Math.sin(time * 0.86) * 0.016 + Math.sin(time * 1.37 + 1.1) * 0.008;
      boat.position.x = boatHome.x + Math.sin(time * 0.23) * 0.028 * (0.4 + wind);
      boat.rotation.z = Math.sin(time * 0.71 + 0.5) * 0.024 * (0.5 + wind);
      boat.rotation.x = Math.sin(time * 0.93 + 1.9) * 0.014 * (0.5 + wind);
      boat.rotation.y = 0.11 + Math.sin(time * 0.19) * 0.022;
      const sway = Math.sin(time * 1.3) * 0.05 * (0.3 + wind);
      lanternA.rotation.z = sway;
      lanternB.rotation.x = sway * 0.6;
      const flicker = 0.9 + 0.07 * Math.sin(time * 9.3) + 0.05 * Math.sin(time * 23.1 + 1.2);
      warmMat.emissiveIntensity = night * 2.6 * flicker;
      lampMat.emissiveIntensity = night * 16 * flicker + 0.02;
      lightA.intensity = night * 3.4 * flicker;
      lightB.intensity = night * 2.1 * flicker;
    },
  };
}
