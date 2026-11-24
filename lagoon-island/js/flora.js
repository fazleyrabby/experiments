import * as THREE from 'three';
import { GB, Perlin, rng, lerp, clamp, sstep } from './util.js';
import { heightAt, normalAt, clearOfStructures } from './world.js';
import { foliageMaterial, foliageDepth } from './materials.js';

const V = THREE.Vector3;
const patchNoise = new Perlin(4242);

const LEAF = {
  deep: [0.026, 0.07, 0.016],
  mid: [0.05, 0.125, 0.022],
  fresh: [0.105, 0.19, 0.03],
  olive: [0.09, 0.115, 0.026],
  palm: [0.075, 0.15, 0.03],
  palmDry: [0.26, 0.2, 0.07],
};

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

function tube(g, pts, rad, sides, col, flexFn, phase = 0) {
  const n = pts.length;
  const base = g.count;
  const T = new V();
  const Nn = new V(1, 0.1, 0.3).normalize();
  const B = new V();
  for (let i = 0; i < n; i++) {
    T.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
    Nn.addScaledVector(T, -Nn.dot(T)).normalize();
    B.crossVectors(T, Nn);
    const t = i / (n - 1);
    const r = rad(t);
    for (let j = 0; j < sides; j++) {
      const a = (j / sides) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const nx = Nn.x * ca + B.x * sa;
      const ny = Nn.y * ca + B.y * sa;
      const nz = Nn.z * ca + B.z * sa;
      const c = col(t, j / sides);
      g.v(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r, nx, ny, nz, c[0], c[1], c[2], flexFn(pts[i], t), 0, phase);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < sides; j++) {
      const a = base + i * sides + j;
      const b = base + i * sides + ((j + 1) % sides);
      const c = base + (i + 1) * sides + ((j + 1) % sides);
      const d = base + (i + 1) * sides + j;
      g.quad(a, b, c, d);
    }
  }
}

const _s = new V();
const _tip = new V();
const _mid = new V();

/** Two-triangle leaf creased along its midrib. */
function kite(g, p, d, n, len, w, col, flex, flutter, phase, fold = 0.22, droop = 0.14) {
  _s.crossVectors(d, n).normalize();
  _tip.copy(p).addScaledVector(d, len).addScaledVector(n, -len * droop);
  _mid.copy(p).addScaledVector(d, len * 0.44);
  const lx = _mid.x + _s.x * w * 0.5 - n.x * w * fold;
  const ly = _mid.y + _s.y * w * 0.5 - n.y * w * fold;
  const lz = _mid.z + _s.z * w * 0.5 - n.z * w * fold;
  const rx = _mid.x - _s.x * w * 0.5 - n.x * w * fold;
  const ry = _mid.y - _s.y * w * 0.5 - n.y * w * fold;
  const rz = _mid.z - _s.z * w * 0.5 - n.z * w * fold;
  const k = 0.42;
  const a = g.v(p.x, p.y, p.z, n.x, n.y, n.z, col[0] * 0.8, col[1] * 0.8, col[2] * 0.8, flex * 0.94, flutter * 0.35, phase);
  const l = g.v(lx, ly, lz, n.x + _s.x * k, n.y + _s.y * k, n.z + _s.z * k, col[0], col[1], col[2], flex, flutter, phase);
  const t = g.v(_tip.x, _tip.y, _tip.z, n.x, n.y, n.z, col[0] * 1.14, col[1] * 1.14, col[2] * 1.05, flex, flutter * 1.3, phase);
  const r = g.v(rx, ry, rz, n.x - _s.x * k, n.y - _s.y * k, n.z - _s.z * k, col[0], col[1], col[2], flex, flutter, phase);
  g.tri(a, l, t);
  g.tri(a, t, r);
}

function randDir(R, out = new V()) {
  const z = R() * 2 - 1;
  const a = R() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  return out.set(Math.cos(a) * s, z, Math.sin(a) * s);
}

function makeBroadleaf(seed, { h = 4.7, palette = [LEAF.deep, LEAF.mid, LEAF.fresh], clumpR = 0.82, leaves = 96 } = {}) {
  const R = rng(seed);
  const bark = new GB();
  const leaf = new GB();
  const barkTone = [0.115 + R() * 0.03, 0.085 + R() * 0.02, 0.06];
  const barkCol = (t, a) => {
    const k = 0.72 + 0.3 * Math.sin(a * 37 + t * 12) * Math.sin(a * 13);
    return mul3(barkTone, k * lerp(0.74, 1.08, t));
  };
  const fx = (p) => Math.pow(clamp(p.y / h), 1.5) * 0.92;
  const clumps = [];
  const branch = (o, dir, len, rad, lvl) => {
    const steps = lvl === 0 ? 8 : 5;
    const pts = [o.clone()];
    const d = dir.clone();
    const p = o.clone();
    for (let s = 0; s < steps; s++) {
      d.x += (R() - 0.5) * 0.3;
      d.y += (R() - 0.5) * 0.16 + 0.03;
      d.z += (R() - 0.5) * 0.3;
      d.normalize();
      p.addScaledVector(d, len / steps);
      pts.push(p.clone());
    }
    const flare = lvl === 0;
    tube(bark, pts, (t) => rad * lerp(1, 0.42, t) * (flare ? 1 + 0.72 * Math.pow(1 - t, 7) : 1), lvl === 0 ? 10 : lvl === 1 ? 6 : 4, barkCol, fx);
    if (lvl >= 2) {
      clumps.push({ c: p.clone(), r: clumpR * (0.82 + R() * 0.42) });
      const extra = new V(d.x + (R() - 0.5), 0.1 + R() * 0.4, d.z + (R() - 0.5)).normalize();
      clumps.push({ c: p.clone().addScaledVector(extra, clumpR * 0.82), r: clumpR * (0.62 + R() * 0.32) });
      return;
    }
    const kids = lvl === 0 ? 5 + Math.floor(R() * 2) : 3;
    const az0 = R() * Math.PI * 2;
    for (let k = 0; k < kids; k++) {
      const at = pts[Math.floor(lerp(steps * (lvl === 0 ? 0.56 : 0.45), steps, (k + R() * 0.6) / kids))];
      const az = az0 + (k / kids) * Math.PI * 2 + (R() - 0.5) * 0.8;
      const up = lvl === 0 ? 0.42 + R() * 0.52 : 0.1 + R() * 0.6;
      const nd = new V(Math.cos(az), up, Math.sin(az)).normalize();
      branch(at, nd.lerp(d, 0.18).normalize(), len * (lvl === 0 ? 0.56 : 0.56) * (0.8 + R() * 0.4), rad * (lvl === 0 ? 0.48 : 0.5), lvl + 1);
    }
  };
  const start = new V(0, -0.24, 0);
  branch(start, new V((R() - 0.5) * 0.14, 1, (R() - 0.5) * 0.14).normalize(), h * (0.52 + R() * 0.1), 0.135 + R() * 0.035, 0);

  const u = new V();
  const pos = new V();
  const nrm = new V();
  const dir = new V();
  const rnd = new V();
  for (const cl of clumps) {
    const phase = R() * 6.28;
    const count = Math.round(leaves * (cl.r / clumpR));
    for (let l = 0; l < count; l++) {
      randDir(R, u);
      const shell = Math.pow(R(), 0.42);
      const off = u.clone().multiplyScalar(shell * cl.r);
      off.y *= 0.62;
      pos.copy(cl.c).add(off);
      nrm.copy(off).setY(off.y + cl.r * 0.42).normalize();
      randDir(R, rnd);
      nrm.addScaledVector(rnd, 0.42).normalize();
      dir.crossVectors(nrm, randDir(R, rnd)).normalize();
      dir.y -= 0.32;
      dir.normalize();
      const local = clamp((off.y / (cl.r * 0.62) + 1) / 2);
      const ao = lerp(0.3, 1, Math.pow(local, 0.82)) * lerp(0.5, 1, shell) * lerp(0.66, 1.05, clamp(pos.y / h));
      const pick = R();
      const base = pick < 0.5 ? mix3(palette[0], palette[1], R()) : mix3(palette[1], palette[2], R() * 0.85);
      const col = mul3(base, ao * (0.78 + R() * 0.42));
      const len = 0.2 + R() * 0.11;
      kite(leaf, pos, dir, nrm, len, len * 0.5, col, clamp(pos.y / h) * 0.96 + 0.04, 1, phase + R() * 1.4);
    }
  }
  return { bark: bark.build(), leaf: leaf.build() };
}

function makePalm(seed, h = 4.5) {
  const R = rng(seed);
  const bark = new GB();
  const leaf = new GB();
  const pts = [];
  const bend = 0.34 + R() * 0.42;
  const segs = 22;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    pts.push(new V(bend * t * t * h * 0.42, -0.2 + t * h, Math.sin(t * 2.6 + seed) * 0.04));
  }
  const fx = (p) => Math.pow(clamp(p.y / h), 1.7) * 0.72;
  tube(bark, pts, (t) => lerp(0.115, 0.066, Math.pow(t, 0.7)) * (1 + 0.72 * Math.pow(1 - t, 9)) * (1 + 0.035 * Math.sin(t * 150)), 9, (t) => {
    const ring = 0.72 + 0.28 * Math.sin(t * 150);
    return mul3(mix3([0.17, 0.135, 0.095], [0.1, 0.075, 0.05], t), ring);
  }, fx);
  const top = pts[segs].clone();
  const fronds = 19 + Math.floor(R() * 5);
  const P = new V();
  const prev = new V();
  const T = new V();
  const S = new V();
  const Up = new V();
  const leafDir = new V();
  for (let f = 0; f < fronds; f++) {
    const az = f * 2.39996 + R() * 0.34;
    const age = f / (fronds - 1);
    const elev = lerp(1.25, -0.42, age) + (R() - 0.5) * 0.18;
    const L = lerp(1.55, 2.25, Math.sin(age * Math.PI) ** 0.5) * (0.88 + R() * 0.24);
    const out = new V(Math.cos(az), 0, Math.sin(az));
    const phase = R() * 6.28;
    const dry = age > 0.88 && R() < 0.58;
    const tone = dry ? LEAF.palmDry : mix3(LEAF.palm, LEAF.fresh, R() * 0.45);
    const rachis = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      rachis.push(new V().copy(top).addScaledVector(out, L * s * Math.cos(elev * 0.48)).add(new V(0, L * (Math.sin(elev) * 0.72 * s - 0.56 * s * s), 0)));
    }
    tube(bark, rachis, (t) => lerp(0.018, 0.0035, t), 3, () => (dry ? [0.3, 0.23, 0.11] : [0.2, 0.2, 0.075]), (_, t) => lerp(0.55, 1, t), phase);
    const pairs = 33;
    for (let i = 2; i < pairs; i++) {
      const s = i / pairs;
      const si = s * steps;
      const i0 = Math.min(Math.floor(si), steps - 1);
      P.lerpVectors(rachis[i0], rachis[i0 + 1], si - i0);
      prev.copy(rachis[i0]);
      T.copy(rachis[i0 + 1]).sub(prev).normalize();
      S.crossVectors(T, new V(0, 1, 0)).normalize();
      Up.crossVectors(S, T).normalize();
      const len = (0.1 + 0.64 * Math.pow(Math.sin(Math.min(1, s * 1.08) * Math.PI), 0.62)) * (0.86 + R() * 0.28);
      for (const side of [-1, 1]) {
        leafDir.copy(S).multiplyScalar(side).addScaledVector(T, 0.62).addScaledVector(Up, -0.34 - s * 0.32 + (R() - 0.5) * 0.18).normalize();
        const n = new V().crossVectors(leafDir, S).normalize();
        if (n.y < 0) n.negate();
        const col = mul3(tone, (0.68 + R() * 0.44) * lerp(0.82, 1.16, s));
        kite(leaf, P, leafDir, n, len, 0.056 + R() * 0.016, col, lerp(0.55, 1, s), 0.75 + s * 0.8, phase + s * 2.6 + R() * 0.2, 0.28, 0.32);
      }
    }
  }
  return { bark: bark.build(), leaf: leaf.build() };
}

function bananaLeaf(g, o, az, elev, L, W, tone, phase, R) {
  const rows = 13;
  const cols = 3;
  const out = new V(Math.cos(az), 0, Math.sin(az));
  const side = new V(-out.z, 0, out.x);
  const base = g.count;
  const tears = Array.from({ length: rows + 1 }, () => (R() < 0.24 ? 0.55 + R() * 0.35 : 1));
  const P = new V();
  const A = new V();
  const Bv = new V();
  const pos = (s, v, target) => {
    const profile = Math.pow(Math.sin(Math.min(1, s * 1.02 + 0.03) * Math.PI), 0.55);
    const span = v * W * profile;
    const rib = L * s;
    target.copy(o).addScaledVector(out, rib * Math.cos(elev * 0.65));
    target.y += L * (Math.sin(elev) * 0.82 * s - 0.56 * s * s);
    target.addScaledVector(side, span);
    target.y += Math.abs(v) * W * 0.32 * profile - Math.abs(v) * Math.abs(v) * W * 0.26 * profile;
    target.y += Math.sin(s * 34 + v * 2 + phase) * 0.012 * Math.abs(v);
    return target;
  };
  for (let r = 0; r <= rows; r++) {
    const s = r / rows;
    for (let c = -cols; c <= cols; c++) {
      const v = (c / cols) * (Math.abs(c) === cols ? tears[r] : 1);
      pos(s, v, P);
      pos(Math.min(1, s + 0.02), v, A).sub(pos(Math.max(0, s - 0.02), v, Bv));
      const Sx = pos(s, v + 0.05, new V()).sub(pos(s, v - 0.05, new V()));
      const n = new V().crossVectors(Sx, A).normalize();
      if (n.y < 0) n.negate();
      const rib = 1 - sstep(0, 0.16, Math.abs(v));
      const vein = 0.9 + 0.13 * Math.sin(s * 76);
      const col = mix3(mul3(tone, vein * (0.84 + 0.2 * s)), [0.28, 0.33, 0.1], rib * 0.75);
      g.v(P.x, P.y, P.z, n.x, n.y, n.z, col[0], col[1], col[2], lerp(0.45, 1, s), s * 0.9 + Math.abs(v) * 0.4, phase);
    }
  }
  const per = cols * 2 + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < per - 1; c++) {
      const a = base + r * per + c;
      const b = a + 1;
      const d = a + per;
      const e = d + 1;
      g.quad(a, b, e, d);
    }
  }
}

function makeBanana(seed) {
  const R = rng(seed);
  const bark = new GB();
  const leaf = new GB();
  const H = 1.05 + R() * 0.45;
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push(new V(Math.sin(i * 0.7 + seed) * 0.02, -0.1 + (i / 6) * H, 0));
  tube(bark, pts, (t) => lerp(0.1, 0.055, t), 8, (t) => mix3([0.13, 0.16, 0.05], [0.09, 0.15, 0.035], t), (p) => clamp(p.y / H) * 0.5);
  const top = pts[6];
  const n = 8 + Math.floor(R() * 3);
  for (let i = 0; i < n; i++) {
    const az = i * 2.39996 + R() * 0.4;
    const age = i / (n - 1);
    const tone = mix3(mix3([0.07, 0.17, 0.026], [0.13, 0.24, 0.04], R()), [0.2, 0.2, 0.05], age > 0.86 ? 0.46 : 0);
    bananaLeaf(leaf, top, az, lerp(1.2, 0.08, age), 1.34 + R() * 0.48, 0.25 + R() * 0.07, tone, R() * 6.28, R);
  }
  return { bark: bark.build(), leaf: leaf.build() };
}

function makeFern(seed) {
  const R = rng(seed);
  const g = new GB();
  const fronds = 8;
  const P = new V();
  const T = new V();
  const S = new V();
  const Up = new V();
  const d = new V();
  for (let f = 0; f < fronds; f++) {
    const az = (f / fronds) * Math.PI * 2 + R() * 0.5;
    const out = new V(Math.cos(az), 0, Math.sin(az));
    const L = 0.46 + R() * 0.3;
    const lift = 0.62 + R() * 0.58;
    const phase = R() * 6.28;
    const tone = mix3(LEAF.mid, LEAF.fresh, R() * 0.9);
    const pairs = 13;
    const at = (s, target) => target.copy(out).multiplyScalar(L * s).setY(L * (lift * s - 0.92 * s * s));
    for (let i = 1; i < pairs; i++) {
      const s = i / pairs;
      at(s, P);
      at(Math.min(1, s + 0.04), T).sub(at(Math.max(0, s - 0.04), Up)).normalize();
      S.crossVectors(T, new V(0, 1, 0)).normalize();
      Up.crossVectors(S, T).normalize();
      const len = 0.17 * Math.pow(Math.sin(Math.min(1, s * 1.02) * Math.PI), 0.8) + 0.018;
      for (const sign of [-1, 1]) {
        d.copy(S).multiplyScalar(sign).addScaledVector(T, 0.42).addScaledVector(Up, -0.18).normalize();
        const n = new V().crossVectors(d, S).normalize();
        if (n.y < 0) n.negate();
        const c = mul3(tone, (0.66 + R() * 0.42) * lerp(0.62, 1.14, s));
        kite(g, P, d, n, len, len * 0.34, c, s, 0.8, phase + s * 2, 0.16, 0.18);
      }
    }
  }
  return g.build();
}

function makeBush(seed, palette) {
  const R = rng(seed);
  const g = new GB();
  const lobes = 5;
  const centers = [];
  for (let i = 0; i < lobes; i++) {
    const a = R() * 6.28;
    const r = R() * 0.26;
    centers.push({ c: new V(Math.cos(a) * r, 0.2 + R() * 0.22, Math.sin(a) * r), r: 0.27 + R() * 0.17 });
  }
  const u = new V();
  const pos = new V();
  const n = new V();
  const d = new V();
  const rnd = new V();
  for (let i = 0; i < 340; i++) {
    const cl = centers[Math.floor(R() * lobes)];
    randDir(R, u);
    const shell = Math.pow(R(), 0.38);
    pos.copy(cl.c).addScaledVector(u, cl.r * shell);
    n.copy(u).setY(u.y + 0.45).normalize();
    randDir(R, rnd);
    n.addScaledVector(rnd, 0.36).normalize();
    d.crossVectors(n, randDir(R, rnd)).normalize();
    d.y -= 0.26;
    d.normalize();
    const ao = lerp(0.28, 1, clamp(pos.y / 0.72)) * lerp(0.55, 1, shell);
    const col = mul3(mix3(palette[Math.floor(R() * 2)], palette[2], R() * 0.55), ao * (0.8 + R() * 0.38));
    const len = 0.07 + R() * 0.055;
    kite(g, pos, d, n, len, len * 0.5, col, clamp(pos.y / 0.72), 1, R() * 6.28);
  }
  return g.build();
}

function makeGrass(seed) {
  const R = rng(seed);
  const g = new GB();
  for (let b = 0; b < 12; b++) {
    const a = R() * 6.28;
    const r = R() * 0.13;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = 0.16 + R() * 0.22;
    const lean = 0.12 + R() * 0.28;
    const dirA = R() * 6.28;
    const dx = Math.cos(dirA);
    const dz = Math.sin(dirA);
    const w = 0.012 + R() * 0.009;
    const tone = mix3([0.07, 0.13, 0.024], [0.2, 0.25, 0.055], R());
    const sx = -dz * w;
    const sz = dx * w;
    const phase = R() * 6.28;
    const base = g.count;
    for (let i = 0; i <= 3; i++) {
      const t = i / 3;
      const px = x + dx * lean * h * t * t * 2;
      const py = t * h * (1 - 0.18 * t);
      const pz = z + dz * lean * h * t * t * 2;
      const k = (1 - t * t) * 1;
      const c = mul3(tone, lerp(0.42, 1.18, t));
      g.v(px - sx * k, py, pz - sz * k, dx * 0.3, 0.9, dz * 0.3, c[0], c[1], c[2], t, t, phase);
      g.v(px + sx * k, py, pz + sz * k, dx * 0.3, 0.9, dz * 0.3, c[0], c[1], c[2], t, t, phase);
    }
    for (let i = 0; i < 3; i++) g.quad(base + i * 2, base + i * 2 + 2, base + i * 2 + 3, base + i * 2 + 1);
  }
  return g.build();
}

function scatter(R, count, minD, rMax, test) {
  const out = [];
  const cell = Math.max(minD, 0.001);
  const grid = new Map();
  const key = (i, j) => `${i},${j}`;
  let tries = count * 36;
  while (out.length < count && tries-- > 0) {
    const a = R() * Math.PI * 2;
    const r = Math.sqrt(R()) * rMax;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = heightAt(x, z);
    const extra = test(x, y, z);
    if (!extra) continue;
    if (minD > 0) {
      const ci = Math.floor(x / cell);
      const cj = Math.floor(z / cell);
      let ok = true;
      for (let i = ci - 1; i <= ci + 1 && ok; i++) {
        for (let j = cj - 1; j <= cj + 1 && ok; j++) {
          for (const q of grid.get(key(i, j)) || []) {
            if (Math.hypot(q.x - x, q.z - z) < minD) {
              ok = false;
              break;
            }
          }
        }
      }
      if (!ok) continue;
      const k = key(ci, cj);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push({ x, z });
    }
    out.push({ x, y, z, ...extra });
  }
  return out;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _qT = new THREE.Quaternion();
const _p = new V();
const _sc = new V();
const _axis = new V();
const _c = new THREE.Color();

function instanced(geo, mat, depth, items, layer, R, tintFn) {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  items.forEach((it, i) => {
    _q.setFromAxisAngle(_axis.set(0, 1, 0), it.yaw);
    if (it.tilt) {
      _axis.set(it.tz, 0, -it.tx).normalize();
      _qT.setFromAxisAngle(_axis, it.tilt);
      _q.premultiply(_qT);
    }
    _p.set(it.x, it.y, it.z);
    _sc.setScalar(it.s);
    _m.compose(_p, _q, _sc);
    mesh.setMatrixAt(i, _m);
    const t = tintFn ? tintFn(it, R) : [1, 1, 1];
    mesh.setColorAt(i, _c.setRGB(t[0], t[1], t[2]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.customDepthMaterial = depth;
  mesh.castShadow = layer === 0;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.layers.set(layer);
  return mesh;
}

export function buildFlora(U) {
  const group = new THREE.Group();
  const R = rng(9182);

  const treeBark = foliageMaterial(U, { flex: 0.17, flutter: 0, rough: 0.92, bark: true });
  const treeLeaf = foliageMaterial(U, { flex: 0.2, flutter: 1, rough: 0.46, translucent: 1 });
  const treeDepth = foliageDepth(U, { flex: 0.2, flutter: 1 });
  const palmBark = foliageMaterial(U, { flex: 0.26, flutter: 0, rough: 0.86, bark: true });
  const palmLeaf = foliageMaterial(U, { flex: 0.34, flutter: 1.3, rough: 0.38, translucent: 1.1 });
  const palmDepth = foliageDepth(U, { flex: 0.34, flutter: 1.3 });
  const bananaBark = foliageMaterial(U, { flex: 0.2, flutter: 0, rough: 0.6, bark: true });
  const bananaLeafM = foliageMaterial(U, { flex: 0.24, flutter: 0.75, rough: 0.34, translucent: 1.2 });
  const bananaDepth = foliageDepth(U, { flex: 0.24, flutter: 0.75 });
  const lowLeaf = foliageMaterial(U, { flex: 0.09, flutter: 0.75, rough: 0.48, translucent: 0.9 });
  const lowDepth = foliageDepth(U, { flex: 0.09, flutter: 0.75 });
  const grassM = foliageMaterial(U, { flex: 0.07, flutter: 0.34, rough: 0.56, translucent: 0.72 });
  const grassDepth = foliageDepth(U, { flex: 0.07, flutter: 0.34 });

  const tint = (it, r) => {
    const k = 0.84 + r() * 0.3;
    const w = r() * 0.14;
    return [k * (1 + w), k, k * (1 - w * 0.6)];
  };
  const place = (geoSet, items, layer = 0, parts = {}) => {
    const buckets = geoSet.map(() => []);
    items.forEach((it) => buckets[Math.floor(R() * geoSet.length)].push(it));
    geoSet.forEach((set, i) => {
      if (!buckets[i].length) return;
      if (set.bark) group.add(instanced(set.bark, parts.bark, parts.depth, buckets[i], layer, R, () => [1, 1, 1]));
      group.add(instanced(set.leaf || set, parts.leaf, parts.depth, buckets[i], layer, R, tint));
    });
  };

  const density = (x, z, f = 0.16) => 0.5 + 0.8 * patchNoise.fbm(x * f + 4.2, z * f - 7.7, 3);

  const palms = scatter(R, 19, 1.35, 11.8, (x, y, z) => {
    if (y < 0.24 || y > 1.05 || !clearOfStructures(x, z, 1.15)) return null;
    if (normalAt(x, z).y < 0.82) return null;
    const l = Math.hypot(x, z) || 1;
    return { yaw: R() * 6.28, s: 0.62 + R() * 0.3, tilt: 0.1 + R() * 0.25, tx: x / l, tz: z / l };
  });

  const trees = scatter(R, 44, 1.12, 10.6, (x, y, z) => {
    if (y < 0.78 || !clearOfStructures(x, z, 1.75)) return null;
    if (normalAt(x, z).y < 0.44) return null;
    return { yaw: R() * 6.28, s: lerp(0.5, 0.82, clamp(y / 2.6)) * (0.84 + R() * 0.3) };
  });

  const bananas = scatter(R, 20, 0.74, 9.6, (x, y, z) => {
    if (y < 0.34 || y > 1.5 || !clearOfStructures(x, z, 0.38) || density(x, z, 0.3) < 0.46) return null;
    if (normalAt(x, z).y < 0.76) return null;
    return { yaw: R() * 6.28, s: 0.72 + R() * 0.46 };
  });

  const bushes = scatter(R, 620, 0.2, 11.2, (x, y, z) => {
    if (y < 0.3 || !clearOfStructures(x, z, 0.16) || density(x, z) < 0.24 + R() * 0.2) return null;
    if (normalAt(x, z).y < 0.42) return null;
    return { yaw: R() * 6.28, s: 0.76 + R() * 0.72 };
  });

  const ferns = scatter(R, 620, 0.1, 11.2, (x, y, z) => {
    if (y < 0.28 || !clearOfStructures(x, z, 0.04)) return null;
    if (normalAt(x, z).y < 0.62) return null;
    return { yaw: R() * 6.28, s: 0.82 + R() * 0.95 };
  });

  const grass = scatter(R, 3000, 0, 11.6, (x, y, z) => {
    if (y < 0.17 || !clearOfStructures(x, z, -0.05)) return null;
    if (y < 0.34 && density(x, z, 0.5) < 0.5) return null;
    return { yaw: R() * 6.28, s: 0.82 + R() * 1.0 };
  });

  place([
    makeBroadleaf(11, { h: 4.9 }),
    makeBroadleaf(27, { h: 4.3, palette: [LEAF.deep, LEAF.olive, LEAF.mid], clumpR: 0.9 }),
    makeBroadleaf(53, { h: 5.4, palette: [LEAF.deep, LEAF.mid, LEAF.olive], clumpR: 0.74 }),
  ], trees, 0, { bark: treeBark, leaf: treeLeaf, depth: treeDepth });
  place([makePalm(3, 4.5), makePalm(8, 5.2), makePalm(19, 3.9)], palms, 0, { bark: palmBark, leaf: palmLeaf, depth: palmDepth });
  place([makeBanana(5), makeBanana(16)], bananas, 0, { bark: bananaBark, leaf: bananaLeafM, depth: bananaDepth });
  place([
    makeBush(31, [LEAF.deep, LEAF.mid, LEAF.fresh]),
    makeBush(44, [LEAF.deep, LEAF.olive, LEAF.mid]),
  ], bushes, 0, { leaf: lowLeaf, depth: lowDepth });
  place([makeFern(7), makeFern(12), makeFern(21)], ferns, 1, { leaf: lowLeaf, depth: lowDepth });
  place([makeGrass(2), makeGrass(9)], grass, 1, { leaf: grassM, depth: grassDepth });

  let tris = 0;
  group.traverse((o) => {
    if (o.isInstancedMesh) tris += (o.geometry.index.count / 3) * o.count;
  });
  group.userData.stats = { trees: trees.length, palms: palms.length, bananas: bananas.length, bushes: bushes.length, ferns: ferns.length, grass: grass.length, tris: Math.round(tris) };
  return group;
}
