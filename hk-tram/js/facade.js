/* facade.js — instances the Blender-built tenement kit (assets/hk_kit.glb) onto the street faces of the
   near buildings: shopfronts at street level, then storey after storey of recessed windows, window cages,
   balconies and bay windows, with AC units and drainpipes. Only bays near the tram are instanced; the set
   is rebuilt as the tram moves. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mulberry32 } from './util.js';
import { L } from './world.js';

export const BAY = 2.6, STOREY = 3.1, SHOP_H = 4.65, MAX_FLOORS = 13;
const RANGE = 120;

function roomAtlas() {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S * 2;
  const g = c.getContext('2d');
  const rooms = [
    { wall: ['#fff1d0', '#c49a62'], lamp: '#fffbe8' },
    { wall: ['#e9fbff', '#7fa9b5'], lamp: '#ffffff' },
    { wall: ['#ffd8c0', '#a8644a'], lamp: '#fff0dc' },
    { wall: ['#dfe6ff', '#6a74a8'], lamp: '#f4f6ff' },
  ];
  rooms.forEach((r, i) => {
    const ox = (i % 2) * S, oy = Math.floor(i / 2) * S;
    g.save(); g.translate(ox, oy);
    const gr = g.createLinearGradient(0, 0, 0, S);
    gr.addColorStop(0, r.wall[0]); gr.addColorStop(1, r.wall[1]);
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    // ceiling lamp hot spot
    const rg = g.createRadialGradient(S * 0.5, S * 0.06, 2, S * 0.5, S * 0.06, S * 0.55);
    rg.addColorStop(0, r.lamp); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, S, S);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(S * 0.3, 2, S * 0.4, 6);
    // furniture silhouettes
    g.fillStyle = 'rgba(30,18,10,0.55)';
    if (i === 0) { g.fillRect(S * 0.08, S * 0.5, S * 0.22, S * 0.5); g.fillRect(S * 0.6, S * 0.72, S * 0.35, S * 0.28); }
    if (i === 1) { g.fillRect(S * 0.65, S * 0.35, S * 0.25, S * 0.65); g.fillRect(0, S * 0.8, S * 0.5, S * 0.2); }
    if (i === 2) { g.beginPath(); g.ellipse(S * 0.45, S * 0.62, S * 0.07, S * 0.09, 0, 0, 7); g.fill(); g.fillRect(S * 0.37, S * 0.7, S * 0.16, S * 0.3); }
    if (i === 3) { g.fillStyle = 'rgba(120,170,255,0.5)'; g.fillRect(S * 0.15, S * 0.45, S * 0.3, S * 0.2); g.fillStyle = 'rgba(20,20,30,0.6)'; g.fillRect(S * 0.1, S * 0.75, S * 0.8, S * 0.25); }
    // curtains
    g.fillStyle = ['rgba(200,120,90,0.85)', 'rgba(230,230,220,0.7)', 'rgba(120,40,40,0.85)', 'rgba(60,80,120,0.85)'][i];
    for (let k = 0; k < 8; k++) g.fillRect(k * 7, 0, 5, S);
    if (i % 2) for (let k = 0; k < 6; k++) g.fillRect(S - 45 + k * 7, 0, 5, S);
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** give a planar geometry facing +z simple 0..1 UVs from its bounds */
function planarUV(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = (p.getX(i) - b.min.x) / Math.max(1e-4, b.max.x - b.min.x);
    uv[i * 2 + 1] = (p.getY(i) - b.min.y) / Math.max(1e-4, b.max.y - b.min.y);
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function makeMaterials(src) {
  const rooms = roomAtlas();
  const interior = new THREE.MeshBasicMaterial({ map: rooms, fog: true });
  interior.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRoom;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvMapUv = vMapUv * 0.5 + vec2(mod(aRoom, 2.0), floor(aRoom / 2.0)) * 0.5;');
  };
  const std = (o) => new THREE.MeshStandardMaterial({ envMapIntensity: 1.0, ...o });
  return {
    wall: (map) => std({ map, roughness: 0.92, metalness: 0.0, envMapIntensity: 0.55 }),
    case: (map) => std({ map, roughness: 0.6, envMapIntensity: 0.6 }),
    frame: std({ color: 0x9da3a8, roughness: 0.32, metalness: 1.0, envMapIntensity: 1.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0d141c, roughness: 0.04, transparent: true, opacity: 0.38, depthWrite: false, envMapIntensity: 1.5 }),
    interior,
    metal: std({ color: 0x1a1c1f, roughness: 0.45, metalness: 0.7 }),
    rust: std({ color: 0x3a2214, roughness: 0.75, metalness: 0.4 }),
    shutter: std({ color: 0x7c8085, roughness: 0.38, metalness: 0.9, envMapIntensity: 1.2 }),
    plant: std({ color: 0x14361a, roughness: 0.85, envMapIntensity: 0.6 }),
    pot: std({ color: 0x6a2c16, roughness: 0.85, envMapIntensity: 0.5 }),
    src,
  };
}

/* building styles: which module each bay column uses on residential floors */
function planBuilding(b, rng) {
  if (!b.modTop) return null;
  const n = Math.floor((b.w - 0.3) / BAY);
  const floors = Math.round((b.modTop - SHOP_H) / STOREY);
  const style = rng();
  const cols = [];
  for (let i = 0; i < n; i++) {
    let type = 'win';
    if (style < 0.3) type = (i % 2) ? 'balc_open' : 'win';
    else if (style < 0.5) type = (i === Math.floor(n / 2)) ? 'bay' : 'win';
    else if (style < 0.65) type = (i % 2) ? 'balc_closed' : 'win';
    else if (style < 0.75) type = 'bay';
    cols.push({ type, cage: type === 'win' && rng() < 0.45, ac: rng() < 0.5, room: Math.floor(rng() * 4) });
  }
  const shops = Array.from({ length: n }, () => (rng() < 0.28 ? 'shop_shut' : 'shop_open'));
  const x0 = b.x0 + (b.w - n * BAY) / 2;
  return { b, n, floors, cols, shops, x0, top: SHOP_H + floors * STOREY };
}

const hash = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };

export async function createFacades(scene, near) {
  const gltf = await new GLTFLoader().loadAsync('./assets/hk_kit.glb');
  gltf.scene.updateMatrixWorld(true);
  const parts = {};   // module -> part -> { geo, srcMap }
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.name.replace(/\.\d+$/, '').match(/^([a-z_]+)__([a-z]+)$/);
    if (!m) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (m[2] === 'interior') planarUV(geo);
    (parts[m[1]] ||= {})[m[2]] = { geo, map: o.material && o.material.map };
  });
  const M = makeMaterials();
  const matFor = (mod, part, map) => {
    if (part === 'wall') return M.wall(map);
    if (part === 'case') return M.case(map);
    return M[part] || M.metal;
  };

  const rng = mulberry32(4242);
  const plans = near.map((b) => planBuilding(b, rng)).filter(Boolean);

  // one InstancedMesh per module part; capacity from a worst-case count over the visible window
  const meshes = {};
  const cap = {};
  const want = (mod, k) => { cap[mod] = (cap[mod] || 0) + k; };
  for (const p of plans) {
    for (const s of p.shops) want(s, 1);
    for (const c of p.cols) {
      want(c.type, p.floors);
      if (c.cage) want('cage', p.floors);
      if (c.ac) want('ac', p.floors);
    }
    want('pipe', p.floors * 2);
  }
  for (const mod of Object.keys(parts)) {
    const n = Math.ceil((cap[mod] || 0) * 1.2) + 8;
    meshes[mod] = {};
    for (const [part, d] of Object.entries(parts[mod])) {
      const geo = d.geo;
      if (part === 'interior') geo.setAttribute('aRoom', new THREE.InstancedBufferAttribute(new Float32Array(n), 1));
      const im = new THREE.InstancedMesh(geo, matFor(mod, part, d.map), n);
      im.count = 0;
      im.frustumCulled = false;
      if (part === 'glass') im.renderOrder = 3;
      if (part === 'wall' || part === 'interior' || part === 'case') im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      scene.add(im);
      meshes[mod][part] = im;
    }
  }

  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const flip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
  const col = new THREE.Color();
  const LIT = [[1.6, 1.25, 0.8], [1.3, 1.45, 1.55], [1.5, 1.1, 0.9], [0.9, 1.0, 1.5]];

  function place(mod, x, y, z, side, tint, room, lit) {
    const set = meshes[mod];
    if (!set) return;
    pos.set(x, y, z);
    mtx.compose(pos, side > 0 ? flip : q.identity(), one);
    for (const [part, im] of Object.entries(set)) {
      const i = im.count;
      if (i >= im.instanceMatrix.count) continue;
      im.setMatrixAt(i, mtx);
      if (part === 'wall') im.setColorAt(i, col.setRGB(tint[0] * 1.15, tint[1] * 1.15, tint[2] * 1.15));
      if (part === 'case') im.setColorAt(i, col.setRGB(0.9, 0.9, 0.88));
      if (part === 'interior') {
        const c = lit >= 0 ? LIT[lit] : [0.03, 0.035, 0.05];
        im.setColorAt(i, col.setRGB(c[0], c[1], c[2]));
        im.geometry.attributes.aRoom.setX(i, room);
      }
      im.count++;
    }
  }

  let builtAt = -1e9;
  function rebuild(tramX) {
    for (const set of Object.values(meshes)) for (const im of Object.values(set)) im.count = 0;
    const base = Math.floor(tramX / L) * L;
    for (let k = -1; k <= 1; k++) {
      const ox = base + k * L;
      for (const p of plans) {
        const b = p.b;
        if (ox + b.x0 + b.w < tramX - RANGE || ox + b.x0 > tramX + RANGE) continue;
        const zf = b.side * (b.frontBase + b.off);
        for (let i = 0; i < p.n; i++) {
          const x = ox + p.x0 + (i + 0.5) * BAY;
          place(p.shops[i], x, 0, zf, b.side, b.tint, i % 4, hash(b.seed, i, 99) < 0.75 ? Math.floor(hash(b.seed, i, 7) * 4) : -1);
          const c = p.cols[i];
          for (let f = 0; f < p.floors; f++) {
            const y = SHOP_H + f * STOREY;
            const r = hash(b.seed, i, f);
            const lit = r < 0.42 ? Math.floor(hash(f, i, b.seed) * 4) : -1;
            place(c.type, x, y, zf, b.side, b.tint, (c.room + f) % 4, lit);
            if (c.cage && hash(f, b.seed, i) < 0.8) place('cage', x, y, zf, b.side, b.tint, 0, -1);
            if (c.ac && hash(i, f, b.seed + 3) < 0.55 && c.type !== 'balc_open') {
              const ax = x + (hash(i, f, 5) - 0.5) * 1.2;
              place('ac', ax, y + (c.type === 'bay' ? 0.05 : 0.22), zf - b.side * (c.type === 'bay' ? 0.78 : (c.cage ? 0.64 : 0.28)), b.side, b.tint, 0, -1);
            }
          }
        }
        for (let f = 0; f < p.floors; f++) {
          for (const ex of [b.x0 + 0.14, b.x0 + b.w - 0.14]) place('pipe', ox + ex, SHOP_H + f * STOREY, zf, b.side, b.tint, 0, -1);
        }
      }
    }
    for (const set of Object.values(meshes)) for (const im of Object.values(set)) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      if (im.geometry.attributes.aRoom) im.geometry.attributes.aRoom.needsUpdate = true;
    }
    builtAt = tramX;
  }

  return {
    plans,
    update(tramX) { if (Math.abs(tramX - builtAt) > 20) rebuild(tramX); },
    stats() { let n = 0, t = 0; for (const set of Object.values(meshes)) for (const im of Object.values(set)) { n += im.count; t += im.count * (im.geometry.index ? im.geometry.index.count : im.geometry.attributes.position.count) / 3; } return { instances: n, tris: Math.round(t) }; },
  };
}
