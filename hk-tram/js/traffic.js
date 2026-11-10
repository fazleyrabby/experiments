/* traffic.js — red-and-silver taxis, green minibuses and an umbrella crowd, kept in a window around the tram.
   Vehicles are Blender models (tools/blender_vehicles.py → assets/*.glb) with materials swapped for
   neon-reflective paint and glass; pedestrians walk with swinging legs and arms under ribbed umbrellas. */
import * as THREE from 'three';
import { mulberry32, glowTexture, mod } from './util.js';
import { L } from './world.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const LANE_Z = 5.6;
export const KERB_Y = 0.15;
const glow = glowTexture(64);

const sprite = (r, g, b) => new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const HEAD = sprite(2.0, 1.8, 1.4);
const TAIL = sprite(2.4, 0.22, 0.16);
const tyre = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.85 });
const chrome = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.18, metalness: 1.0, envMapIntensity: 1.4 });

/* ───────────── taxis and minibuses: Blender models (tools/blender_vehicles.py) ───────────── */
const basic = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
const SHARED = {
  veh_silver: new THREE.MeshPhysicalMaterial({ color: 0xb4b7bb, roughness: 0.28, metalness: 0.7, clearcoat: 0.8, envMapIntensity: 1.2 }),
  veh_glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1016, roughness: 0.04, transparent: true, opacity: 0.55, depthWrite: false, envMapIntensity: 1.9, clearcoat: 1 }),
  veh_trim: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.5, metalness: 0.2 }),
  veh_chrome: chrome,
  veh_tyre: tyre,
  veh_steel: new THREE.MeshStandardMaterial({ color: 0x6a6e74, roughness: 0.35, metalness: 0.9, envMapIntensity: 1.2 }),
  veh_head: basic(3.0, 2.8, 2.3),
  veh_tail: basic(2.2, 0.12, 0.08),
  veh_amber: basic(1.1, 0.45, 0.04),
  veh_taxisign: basic(0.95, 0.88, 0.78),
  veh_plate_front: basic(0.6, 0.6, 0.58),
  veh_plate_rear: basic(0.7, 0.55, 0.07),
  veh_cream: new THREE.MeshPhysicalMaterial({ color: 0xe6dfc8, roughness: 0.35, clearcoat: 0.8, envMapIntensity: 1.0 }),
  veh_green: new THREE.MeshPhysicalMaterial({ color: 0x1b7a46, roughness: 0.35, clearcoat: 0.8, envMapIntensity: 1.0 }),
  veh_red: new THREE.MeshPhysicalMaterial({ color: 0xb0141c, roughness: 0.35, clearcoat: 0.8 }),
  veh_led: basic(2.4, 1.15, 0.12),
  veh_seat: basic(0.02, 0.02, 0.025),
  veh_skin: basic(0.16, 0.1, 0.07),
  veh_cloth: basic(0.03, 0.035, 0.05),
  veh_cabinlight: basic(2.4, 2.3, 2.0),
};
const paintCache = new Map();
function paint(color) {
  if (!paintCache.has(color)) paintCache.set(color, new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.25 }));
  return paintCache.get(color);
}
function prepare(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = (o.material.name || '').replace(/\.\d+$/, '');
    o.userData.mat = name;
    o.material = SHARED[name] || SHARED.veh_trim;
    if (name === 'veh_glass') o.renderOrder = 3;
  });
  return root;
}
function vehicle(src, color, front, rear, lampY, tailY, zOff, headSize = 0.85) {
  const g = new THREE.Group();
  const body = src.clone(true);
  if (color != null) body.traverse((o) => { if (o.isMesh && o.userData.mat === 'veh_paint') o.material = paint(color); });
  g.add(body);
  for (const s of [-1, 1]) {
    const hs = new THREE.Sprite(HEAD); hs.scale.set(headSize, headSize, 1); hs.position.set(front + 0.1, lampY, s * zOff); g.add(hs);
    const ts = new THREE.Sprite(TAIL); ts.scale.set(0.55, 0.55, 1); ts.position.set(rear - 0.08, tailY, s * zOff); g.add(ts);
  }
  return g;
}
async function loadVehicles() {
  const loader = new GLTFLoader();
  const [t, b] = await Promise.all([loader.loadAsync('./assets/taxi.glb'), loader.loadAsync('./assets/minibus.glb')]);
  const taxi = prepare(t.scene), bus = prepare(b.scene);
  return {
    taxi: (color) => vehicle(taxi, color, 2.42, -2.38, 0.65, 0.73, 0.64),
    minibus: () => vehicle(bus, null, 3.6, -3.6, 0.81, 0.95, 0.77, 1.0),
  };
}

/* ───────────── pedestrians ───────────── */
function makeCrowd(scene, rng, N) {
  const parts = {
    torso: new THREE.CapsuleGeometry(1, 1, 3, 10),
    head: new THREE.SphereGeometry(1, 12, 10),
    leg: (() => { const g = new THREE.CapsuleGeometry(0.065, 0.72, 3, 8); g.translate(0, -0.43, 0); return g; })(),
    arm: (() => { const g = new THREE.CapsuleGeometry(0.05, 0.5, 3, 6); g.translate(0, -0.3, 0); return g; })(),
    canopy: (() => {
      const g = new THREE.ConeGeometry(0.56, 0.26, 8, 2, true);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
        const a = Math.atan2(z, x);
        const rim = Math.max(0, -y / 0.13);
        p.setY(i, y + rim * 0.035 * (1 - Math.abs(Math.cos(a * 4))));
      }
      g.computeVertexNormals(); g.translate(0, 0.13, 0);
      return g;
    })(),
    shaft: (() => { const g = new THREE.CylinderGeometry(0.01, 0.01, 0.95, 5); g.translate(0, -0.47, 0); return g; })(),
  };
  const mats = {
    cloth: new THREE.MeshStandardMaterial({ roughness: 0.85, emissive: 0x050608 }),
    skin: new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: 0x0a0605 }),
    umb: new THREE.MeshPhysicalMaterial({ roughness: 0.35, side: THREE.DoubleSide, clearcoat: 1, envMapIntensity: 1.2, emissive: 0x111111 }),
    shaft: new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.7, roughness: 0.3 }),
  };
  const im = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, N); m.frustumCulled = false; scene.add(m); return m; };
  const meshes = {
    torso: im(parts.torso, mats.cloth), head: im(parts.head, mats.skin),
    legL: im(parts.leg, mats.cloth), legR: im(parts.leg, mats.cloth),
    armL: im(parts.arm, mats.cloth), armR: im(parts.arm, mats.cloth),
    canopy: im(parts.canopy, mats.umb), shaft: im(parts.shaft, mats.shaft),
  };
  const coats = [0x14161c, 0x1e2230, 0x2a2a2e, 0x3a2f28, 0xd9d4c8, 0x4a1c22, 0x1c3440, 0x5c5f66, 0x0e0e10];
  const pants = [0x0f1014, 0x1a2236, 0x2a2a2a, 0x3b3530];
  const skins = [0xd8a888, 0xc08f6a, 0x9c6b48, 0xe8c0a0];
  const umbs = [0x0c0c0e, 0x0c0c0e, 0x15203a, 0x15203a, 0x8a1020, 0xc8c8d0, 0x2b5bff, 0x1f6b3a, 0xe0a020, 0xff2e88, 0x6a4b8c];
  const peds = [];
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1;
    const standing = rng() < 0.2;
    const d = {
      z: side * (8.1 + rng() * 1.6), dir: rng() < 0.5 ? 1 : -1, speed: standing ? 0 : 1.0 + rng() * 0.55,
      phase: rng() * L, ph: rng() * 6, h: 0.92 + rng() * 0.14, umb: rng() < 0.85, wide: 0.9 + rng() * 0.25,
    };
    if (standing) d.z = side * (9.6 + rng() * 0.4);
    peds.push(d);
    const coat = c.set(coats[Math.floor(rng() * coats.length)]).clone();
    meshes.torso.setColorAt(i, coat); meshes.armL.setColorAt(i, coat); meshes.armR.setColorAt(i, coat);
    const p = c.set(pants[Math.floor(rng() * pants.length)]).clone();
    meshes.legL.setColorAt(i, p); meshes.legR.setColorAt(i, p);
    meshes.head.setColorAt(i, c.set(skins[Math.floor(rng() * skins.length)]));
    meshes.canopy.setColorAt(i, c.set(umbs[Math.floor(rng() * umbs.length)]));
    meshes.shaft.setColorAt(i, c.set(0x1a1a1c));
  }
  const root = new THREE.Object3D();
  const child = {};
  for (const k of Object.keys(meshes)) { child[k] = new THREE.Object3D(); root.add(child[k]); }
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    update(t, lo) {
      for (let i = 0; i < N; i++) {
        const d = peds[i];
        const x = lo + mod(d.phase + d.dir * d.speed * t - lo, L);
        const walk = d.speed > 0;
        const cyc = walk ? t * d.speed * 4.2 + d.ph : d.ph;
        const swing = walk ? Math.sin(cyc) * 0.42 : 0;
        const bob = walk ? Math.abs(Math.cos(cyc)) * 0.035 : 0;
        const H = d.h;
        root.position.set(x, KERB_Y + bob, d.z);
        root.rotation.set(0, d.dir > 0 ? 0 : Math.PI, 0);
        root.scale.set(1, H, 1);
        child.torso.position.set(0, 1.18, 0); child.torso.scale.set(0.19 * d.wide, 0.19, 0.13);
        child.head.position.set(0.02, 1.62, 0); child.head.scale.set(0.105, 0.125 / H, 0.105);
        child.legL.position.set(0, 0.92, -0.09); child.legL.rotation.set(0, 0, swing);
        child.legR.position.set(0, 0.92, 0.09); child.legR.rotation.set(0, 0, -swing);
        child.armL.position.set(0, 1.42, -0.23); child.armL.rotation.set(0, 0, d.umb ? 0.55 : -swing * 0.8);
        child.armR.position.set(0, 1.42, 0.23); child.armR.rotation.set(0.15, 0, swing * 0.8);
        child.canopy.position.set(0.18, 2.12, -0.12); child.canopy.rotation.set(-0.08, cyc * 0.05, 0.05);
        child.canopy.scale.set(1, 1 / H, 1);
        child.shaft.position.set(0.18, 2.12, -0.12); child.shaft.rotation.set(0, 0, 0.05);
        root.updateMatrixWorld(true);
        for (const k of Object.keys(meshes)) {
          if ((k === 'canopy' || k === 'shaft') && !d.umb) meshes[k].setMatrixAt(i, hide);
          else meshes[k].setMatrixAt(i, child[k].matrixWorld);
        }
      }
      for (const m of Object.values(meshes)) m.instanceMatrix.needsUpdate = true;
    },
  };
}

export function createTraffic(scene) {
  const rng = mulberry32(88);
  const vehicles = [];
  const add = (obj, lane, dir, speed, phase) => { scene.add(obj); vehicles.push({ obj, z: lane, dir, speed, phase, wob: rng() * 6 }); };
  // red urban, green New Territories, blue Lantau taxis
  const taxiColors = [0xb5121b, 0xb5121b, 0xb5121b, 0xa80f18, 0xb5121b, 0x1f7a3a, 0xb5121b, 0x1b4fa8];
  loadVehicles().then((make) => {
    for (let i = 0; i < 6; i++) add(make.taxi(taxiColors[i % taxiColors.length]), -LANE_Z, 1, 5.5 + rng() * 3, (i + rng() * 0.7) * (L / 6));
    add(make.minibus(), -LANE_Z, 1, 6.0, rng() * L);
    for (let i = 0; i < 5; i++) add(make.taxi(taxiColors[(i + 2) % taxiColors.length]), LANE_Z, -1, 5 + rng() * 3.5, (i + rng() * 0.7) * (L / 5) + 30);
    add(make.minibus(), LANE_Z, -1, 6.5, rng() * L);
  }).catch((e) => console.error('vehicles', e));

  const crowd = makeCrowd(scene, rng, 56);

  return {
    update(t, tramX) {
      const lo = tramX - L / 2;
      for (const v of vehicles) {
        const x = lo + mod(v.phase + v.dir * v.speed * t - lo, L);
        v.obj.position.set(x, 0, v.z + Math.sin(t * 0.4 + v.wob) * 0.1);
        v.obj.rotation.y = v.dir > 0 ? 0 : Math.PI;
      }
      crowd.update(t, lo);
    },
  };
}
