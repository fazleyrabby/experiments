import * as THREE from 'three';
import { Track, makeFrame } from './track';
import { Landscape } from './landscape';
import { patch } from '../core/shaders';
import { Rng } from '../core/noise';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { prep } from '../train/geo';

const C = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

/** Victorian lineside furniture: telegraph poles with wires, post-and-wire fencing, a semaphore signal. */
export class Lineside {
  readonly group = new THREE.Group();

  constructor(private track: Track, private land: Landscape) {
    this.group.name = 'lineside';
    this.poles();
    this.fences();
    this.signal();
  }

  private timber() {
    return patch(new THREE.MeshStandardMaterial({ color: C(0.30, 0.22, 0.15), roughness: 0.95 }), {
      key: 'timber-weathered',
      fragColor: 'diffuseColor.rgb *= 0.65 + 0.7 * heVNoise(vec3(vOPos.x * 8.0, vOPos.y * 1.5, vOPos.z * 8.0) + vRand * 9.0);',
    });
  }

  private poles() {
    const tr = this.track;
    const f = makeFrame();
    const rng = new Rng(88);
    const spacing = 55;
    const poleH = 7.2;
    const g = new THREE.CylinderGeometry(0.1, 0.17, poleH, 8, 1);
    g.translate(0, poleH / 2 - 0.4, 0);
    const arm = new THREE.BoxGeometry(2.0, 0.1, 0.12);
    arm.translate(0, poleH - 0.7, 0);
    const arm2 = arm.clone();
    arm2.translate(0, -0.65, 0);
    const poleGeo = mergeGeometries([g, arm, arm2].map(prep))!;
    const posts: { p: THREE.Vector3; yaw: number }[] = [];
    for (let s = 220; s < tr.length - 10; s += spacing) {
      tr.frame(s, f);
      const side = 1;
      const p = f.p.clone().addScaledVector(f.r, side * 7.2);
      p.y = this.land.height(p.x, p.z);
      // skip where the ground is far from the formation (cutting walls / embankments)
      if (Math.abs(p.y - (f.p.y - 0.6)) > 5.5) continue;
      posts.push({ p, yaw: Math.atan2(f.t.x, f.t.z) + Math.PI / 2 });
    }
    const mesh = new THREE.InstancedMesh(poleGeo, this.timber(), posts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    posts.forEach((o, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.yaw + rng.range(-0.03, 0.03));
      m.compose(o.p, q, new THREE.Vector3(1, rng.range(0.95, 1.05), 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);

    // insulators + sagging wires between consecutive poles
    const wirePts: number[] = [];
    const insG = new THREE.CylinderGeometry(0.035, 0.05, 0.13, 6);
    const ins = new THREE.InstancedMesh(insG, new THREE.MeshStandardMaterial({ color: C(0.55, 0.62, 0.58), roughness: 0.4, metalness: 0.1 }), posts.length * 6);
    let ic = 0;
    const offs: [number, number][] = [[-0.85, 0], [0.85, 0], [-0.55, -0.65], [0.55, -0.65], [-0.15, -0.65], [0.15, 0]];
    const tips: THREE.Vector3[][] = posts.map((o) => {
      const right = new THREE.Vector3(Math.cos(o.yaw), 0, -Math.sin(o.yaw));
      return offs.map(([dx, dy]) => o.p.clone().addScaledVector(right, dx).setY(o.p.y + poleH - 0.4 + dy + 0.12));
    });
    tips.forEach((arr) =>
      arr.forEach((t) => {
        m.makeTranslation(t.x, t.y - 0.06, t.z);
        ins.setMatrixAt(ic++, m);
      }),
    );
    ins.count = ic;
    ins.frustumCulled = false;
    this.group.add(ins);
    for (let i = 0; i + 1 < tips.length; i++) {
      if (posts[i + 1].p.distanceTo(posts[i].p) > spacing * 1.6) continue;
      for (let w = 0; w < 4; w++) {
        const a = tips[i][w], b = tips[i + 1][w];
        const n = 10;
        let prev = a.clone();
        for (let k = 1; k <= n; k++) {
          const t = k / n;
          const p = a.clone().lerp(b, t);
          p.y -= Math.sin(t * Math.PI) * 0.9;
          wirePts.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
          prev = p;
        }
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
    const wires = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: C(0.12, 0.12, 0.13) }));
    wires.frustumCulled = false;
    this.group.add(wires);
  }

  private fences() {
    const tr = this.track;
    const f = makeFrame();
    const rng = new Rng(21);
    const post = new THREE.BoxGeometry(0.09, 1.25, 0.09);
    post.translate(0, 0.5, 0);
    const posts: THREE.Matrix4[] = [];
    const lines: number[] = [];
    const step = 2.6;
    for (const side of [-1, 1]) {
      let prev: THREE.Vector3[] | null = null;
      for (let s = 175; s < tr.length - 6; s += step) {
        tr.frame(s, f);
        const p = f.p.clone().addScaledVector(f.r, side * 6.4);
        const h = this.land.height(p.x, p.z);
        // only fence where the boundary ground is reasonably level with the line
        const ok = Math.abs(h - (f.p.y - 0.6)) < 2.6 && this.land.riverDist(p.x, p.z) > 5;
        if (!ok) {
          prev = null;
          continue;
        }
        p.y = h;
        const m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng.range(0, 3)), new THREE.Vector3(1, rng.range(0.92, 1.05), 1));
        posts.push(m);
        const hs = [0.25, 0.65, 1.05].map((y) => p.clone().setY(p.y + y));
        if (prev) for (let k = 0; k < 3; k++) lines.push(prev[k].x, prev[k].y - 0.03 * (k + 1), prev[k].z, hs[k].x, hs[k].y - 0.03 * (k + 1), hs[k].z);
        prev = hs;
      }
    }
    const mesh = new THREE.InstancedMesh(post, this.timber(), posts.length);
    posts.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    this.group.add(mesh);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    const wire = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: C(0.24, 0.24, 0.26) }));
    wire.frustumCulled = false;
    this.group.add(wire);
  }

  /** A lower-quadrant semaphore signal guarding the viaduct, arm lowered ("proceed"). */
  private signal() {
    const tr = this.track;
    const f = makeFrame();
    const s = tr.length - 44;
    tr.frame(s, f);
    const base = f.p.clone().addScaledVector(f.r, -3.6);
    base.y = Math.max(this.land.height(base.x, base.z), f.p.y - 0.9);
    const yaw = Math.atan2(f.t.x, f.t.z);
    const g = new THREE.Group();
    g.position.copy(base);
    g.rotation.y = yaw;
    const white = new THREE.MeshStandardMaterial({ color: C(0.86, 0.84, 0.78), roughness: 0.6 });
    const red = new THREE.MeshStandardMaterial({ color: C(0.7, 0.05, 0.04), roughness: 0.5 });
    const black = new THREE.MeshStandardMaterial({ color: C(0.04, 0.04, 0.045), roughness: 0.6 });
    const iron = new THREE.MeshStandardMaterial({ color: C(0.2, 0.2, 0.22), roughness: 0.5, metalness: 0.6 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 7.2, 8), white);
    post.position.y = 3.2;
    g.add(post);
    // ladder
    for (const dx of [-0.16, 0.16]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 6.2, 0.03), iron);
      r.position.set(dx, 3.1, 0.2);
      g.add(r);
    }
    for (let y = 0.4; y < 6.4; y += 0.38) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.025), iron);
      r.position.set(0, y, 0.2);
      g.add(r);
    }
    // platform
    const plat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.6), iron);
    plat.position.set(0, 6.55, 0.0);
    g.add(plat);
    // arm pivoted at the post, pointing towards the track (-x is the track side in this frame)
    const pivot = new THREE.Group();
    pivot.position.set(0.0, 6.0, 0.3);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.04), red);
    arm.position.set(-0.75, 0, 0);
    pivot.add(arm);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.045), white);
    stripe.position.set(-1.05, 0, 0);
    pivot.add(stripe);
    pivot.rotation.z = 0.82; // lowered
    g.add(pivot);
    // lamp and spectacle
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.5, 0.34), black);
    lamp.position.set(-0.5, 5.2, 0.0);
    g.add(lamp);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 3.0, 1.2), toneMapped: false }));
    lens.position.set(-0.5, 5.25, -0.18);
    lens.rotation.y = Math.PI;
    g.add(lens);
    g.traverse((o) => ((o as THREE.Mesh).isMesh && ((o as THREE.Mesh).castShadow = true)));
    this.group.add(g);
  }
}
