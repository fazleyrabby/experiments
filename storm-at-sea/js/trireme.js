import * as THREE from 'three';
import { Batch, M, V3, BOX, CYL, CYL8, shared } from './ship.js';
import { SAIL, windState, sailMaterial, squareSail, flagMesh, finish, sailTexture, deckTexture } from './wooden.js';
import { buildCrew } from './humans.js';
import { hullTextures, loadCarved, liftAO } from './firstrate.js';

/*
  Athenian trireme, rebuilt:
  - a slim lofted hull whose keel sweeps up aft into the sternpost, oiled oak strakes with
    relief, pitch below the waterline, painted bands and a meander frieze;
  - carved work from tools/blender/trireme_carved.py: bronze ram and boar-headed proembolion,
    stolos, marble eyes, epotides, the open outrigger, oar ports and leather askomata,
    canopy deck with a rail of shields, aphlaston, steering oars, the helmsman's awning;
  - three banks of oars (31 thranite, 27 zygite, 27 thalamite a side) pulling in time,
    with the top bank's rowers visible under the canopy;
  - a square mainsail and an artemon that brace to the wind.
  Simple code-built stand-ins are shown until the GLB arrives.
*/

const lerp = THREE.MathUtils.lerp;
const sstep = THREE.MathUtils.smoothstep;
const clamp = THREE.MathUtils.clamp;

// hull form; tools/blender/trireme_carved.py mirrors these
const L = 37, B = 5.4, D = 2.7, T = 1.1, hb = 1.95;
const keelY = (u) => 2.4 * Math.max(0, (0.16 - u) / 0.16) ** 2 + 0.15 * Math.max(0, (u - 0.9) / 0.1) ** 2;
const topY = (u) => D + 0.35 * (2 * u - 1) ** 2 + 2.6 * Math.max(0, (0.12 - u) / 0.12) ** 1.6 + 0.5 * Math.max(0, (u - 0.88) / 0.12) ** 1.5;
const xAt = (u, hn) => -L / 2 + u * L - 1.4 * hn ** 1.3 * (1 - u) ** 8 - 0.5 * hn * u ** 16;
const plan = (u) => Math.sin(Math.PI * clamp(0.015 + 0.97 * u, 0, 1)) ** 0.62;
const section = (hn) => (1 - (1 - hn) ** 2.6) ** (1 / 2.6) * (1 + 0.08 * sstep(hn, 0.6, 1));
const P = (u, hn) => [xAt(u, hn), lerp(keelY(u), topY(u), hn) - T, hb * plan(u) * section(hn)];
const uOf = (x) => clamp((x + L / 2) / L, 0, 1);
const hnAt = (u, y) => clamp((y + T - keelY(u)) / (topY(u) - keelY(u)), 0, 1);
const zAt = (u, y) => P(u, hnAt(u, y))[2];
const yR = D - T, yC = yR + 1.25;
const oarX = (i, n) => -L * 0.33 + (i + 0.5) / n * L * 0.62;
const zOut = (x) => zAt(uOf(x), yR) + 0.62;

// running meander (Greek key) painted along a band
function meander({ x, Y, pxm, pym, W }, y0, y1, color) {
  const h = (y1 - y0) * pym, top = Y(y1);
  x.strokeStyle = color; x.lineWidth = Math.max(2, h * 0.11); x.lineCap = 'square';
  for (let px = 0; px < W; px += h) {
    const P2 = (u, v) => [px + u * h, top + (1 - v) * h];
    x.beginPath();
    for (const [k, [u, v]] of [[0, 0.1], [0, 0.88], [0.78, 0.88], [0.78, 0.34], [0.34, 0.34], [0.34, 0.62], [0.56, 0.62]].entries()) { const [a, b] = P2(u, v); k ? x.lineTo(a, b) : x.moveTo(a, b); }
    x.stroke();
    x.beginPath(); const [a, b] = P2(0, 0.1), [c, d] = P2(1, 0.1); x.moveTo(a, b); x.lineTo(c, d); x.stroke();
  }
}

export function buildTrireme(o = {}) {
  const hi = o.spots !== false;
  const S = shared();
  const group = new THREE.Group();
  const batch = new Batch();
  const carved = new Batch(), carvedGroup = new THREE.Group();
  group.add(carvedGroup);
  const glowMats = [];

  /* ---------- hull */
  const NS = hi ? 140 : 90, NP = hi ? 22 : 16, Hmax = topY(0) + 0.2;
  const us = []; for (let i = 0; i <= NS; i++) { const t = i / NS; us.push(t * 0.4 + (0.5 - 0.5 * Math.cos(Math.PI * t)) * 0.6); }
  const ring = [];
  for (let j = NP - 1; j >= 0; j--) ring.push([j / (NP - 1), -1]);
  for (let j = 1; j < NP; j++) ring.push([j / (NP - 1), 1]);
  const R = ring.length, pos = [], uv = [], idx = [];
  for (const u of us) for (const [hn, s] of ring) { const [x, y, z] = P(u, hn); pos.push(x, y, z * s); uv.push(x / 6, (y + T) / Hmax); }
  for (let i = 0; i < NS; i++) for (let j = 0; j < R - 1; j++) { const a = i * R + j, b = (i + 1) * R + j; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  hullGeo.setIndex(idx); hullGeo.computeVertexNormals();
  const top = yR + T;
  const ht = hullTextures({
    Hmax, T, seed: 23, hi, copper: false, plank: 0.22, tile: 6,
    bands: [
      { from: 0, to: Hmax, color: '#8a5a32', rough: '#7a7a7a' },               // oiled oak
      { from: 0, to: T + 0.2, color: '#14110e', rough: '#9a9a9a' },            // pitch below the waterline
      { from: top - 0.5, to: top - 0.18, color: '#7c2a1f', rough: '#7a7a7a' },
      { from: top - 0.98, to: top - 0.7, color: '#b98d4e', rough: '#7a7a7a' },
      { from: top - 1.1, to: top - 1.02, color: '#22436b', rough: '#7a7a7a' },
    ],
    paint: (c) => meander(c, top - 0.96, top - 0.72, '#1a1410'),
  });
  const hullMat = new THREE.MeshStandardMaterial({ map: ht.map, normalMap: ht.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: ht.roughnessMap, roughness: 1, metalness: 0.04, envMapIntensity: 0.6, side: THREE.DoubleSide });
  hullMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.16, 0.1, 0.06);`);
  };
  group.add(new THREE.Mesh(hullGeo, hullMat));
  // the rowers' space below the canopy, in shadow
  {
    const p = [], ix = [], n = 50, y = 0.3;
    for (let i = 0; i <= n; i++) { const u = lerp(0.12, 0.92, i / n), x = lerp(-L / 2, L / 2, u), z = Math.max(0.1, zAt(u, y) - 0.05); p.push(x, y, -z, x, y, z); if (i < n) { const k = i * 2; ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); g.computeVertexNormals();
    group.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#241810', roughness: 0.9 })));
  }

  const oak = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.6 });
  const darkWood = new THREE.MeshStandardMaterial({ color: '#4a2f1a', roughness: 0.7 });
  const bronze = new THREE.MeshStandardMaterial({ color: '#a8743a', roughness: 0.32, metalness: 0.92, envMapIntensity: 1.2 });
  const red = new THREE.MeshStandardMaterial({ color: '#7c2a1f', roughness: 0.6 });

  /* ---------- stand-ins until the carved GLB is in */
  carved.add(bronze, new THREE.ConeGeometry(0.45, 2.6, 4), M(L / 2 + 0.9, -0.45, 0, 0, 0, -Math.PI / 2));
  for (const s of [-1, 1]) {
    carved.box(oak, 0, yR - 0.1, s * (zOut(0) - 0.25), L * 0.65, 0.5, 0.5);
    for (let x = -L * 0.33; x < L * 0.3; x += 1.12) carved.add(s > 0 ? red : bronze, CYL, M(x, yC + 0.36, s * (zOut(x) + 0.05), Math.PI / 2, 0, 0, 0.42, 0.06, 0.42));
  }
  carved.box(oak, -1, yC, 0, L * 0.69, 0.12, zOut(0) * 2);
  {
    const [sx, sy] = P(0, 1), sp = [];
    for (let i = 0; i <= 30; i++) { const a = Math.PI - (i / 30) * 0.88 * Math.PI, r = 1.35 * (1 - 0.42 * i / 30); sp.push(V3(sx + 1.35 + r * Math.cos(a), sy + r * Math.sin(a), 0)); }
    carved.add(darkWood, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 40, 0.1, 6, false));
  }

  /* ---------- mast, sails, rigging */
  const mastX = 1.5, mastH = 12, yardY = yC + mastH - 0.6;
  batch.cyl(oak, mastX, yC + mastH / 2 - 1, 0, 0.18, mastH + 2, 0, 0, 0, CYL8);
  const st = sailTexture({ seed: 23, color: '#e2d3b2', seams: 1, grid: 6 });
  const WIND = windState();
  const sailMat = sailMaterial(st, false, WIND);
  const sails = [], braces = [];
  const mainBrace = new THREE.Group(); mainBrace.position.set(mastX, 0, 0); group.add(mainBrace); braces.push(mainBrace);
  { const y = new THREE.Mesh(CYL8, oak); y.position.set(0.25, yardY, 0); y.rotation.x = Math.PI / 2; y.scale.set(0.12, 15, 0.12); mainBrace.add(y); }
  const main = squareSail(sailMat, 0.45, yardY, 14, 8.8, 1.6, 1.05, hi ? [18, 12] : [10, 8]);
  mainBrace.add(main); sails.push({ mesh: main, reefAt: 0.55, reefTo: 0.12 });
  const art0 = V3(L / 2 - 4.5, yR + 0.6, 0), art1 = V3(L / 2 + 0.2, yR + 5.4, 0);
  batch.rod(oak, art0, art1, 0.1, CYL8);
  const artBrace = new THREE.Group(); artBrace.position.set(art1.x - 0.2, 0, 0); group.add(artBrace); braces.push(artBrace);
  { const y = new THREE.Mesh(CYL8, oak); y.position.set(0, art1.y - 0.2, 0); y.rotation.x = Math.PI / 2; y.scale.set(0.07, 4.5, 0.07); artBrace.add(y); }
  const art = squareSail(sailMat, 0.15, art1.y - 0.2, 4.2, 3, 0.45);
  artBrace.add(art); sails.push({ mesh: art, reefAt: 0.45, reefTo: 0.12 });
  const rig = [];
  const add = (a, b) => rig.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const mTop = V3(mastX, yC + mastH - 1, 0);
  add(mTop, V3(L / 2 - 1.5, topY(1) - T + 0.4, 0)); add(mTop, V3(-L / 2 + 3, topY(0.06) - T, 0));
  for (const s of [-1, 1]) { add(mTop, V3(mastX - 1, yC, s * (zOut(mastX) - 0.1))); add(mTop, V3(mastX + 1.5, yC, s * (zOut(mastX) - 0.1))); add(V3(mastX + 0.3, yardY, s * 7), V3(mastX - 4, yC + 0.6, s * 2)); }
  const rl = new THREE.BufferGeometry(); rl.setAttribute('position', new THREE.Float32BufferAttribute(rig, 3));
  group.add(new THREE.LineSegments(rl, new THREE.LineBasicMaterial({ color: 0x2b1d12, transparent: true, opacity: 0.8 })));

  /* ---------- three banks of oars */
  const banks = [
    { n: 31, y: yR - 0.13, z: (x) => zOut(x) + 0.02, len: 4.4, pitch: 0.5, lag: 0 },
    { n: 27, y: 0.95, z: (x) => zAt(uOf(x), 0.95) + 0.03, len: 4.0, pitch: 0.42, lag: 0.05 },
    { n: 27, y: 0.45, z: (x) => zAt(uOf(x), 0.45) + 0.06, len: 3.4, pitch: 0.3, lag: 0.1 },
  ];
  const oars = [];
  for (const b of banks) for (const s of [-1, 1]) for (let i = 0; i < b.n; i++) { const x = oarX(i, b.n); oars.push({ x, y: b.y, z: s * b.z(x), s, len: b.len, pitch: b.pitch, lag: b.lag }); }
  const shaftGeo = new THREE.CylinderGeometry(0.035, 0.045, 1, 6); shaftGeo.rotateZ(Math.PI / 2); shaftGeo.translate(0.5, 0, 0);
  const shaftMesh = new THREE.InstancedMesh(shaftGeo, oak, oars.length);
  const bladeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.75, 0.03, 0.19), oak, oars.length);
  shaftMesh.frustumCulled = bladeMesh.frustumCulled = false;
  group.add(shaftMesh, bladeMesh);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _sc = new THREE.Vector3(), _bp = new THREE.Vector3();
  const _dir = new THREE.Vector3(), _X = new THREE.Vector3(1, 0, 0);
  const splashes = [];

  /* ---------- crew: thranites at their oars under the canopy, and the men on deck */
  const rowers = [];
  for (const s of [-1, 1]) for (let i = 0; i < 31; i += hi ? 2 : 4) {
    const x = oarX(i, 31);
    rowers.push({ x: x + 0.2, y: yR - 1.02, z: s * (zOut(x) - 1.15), face: -Math.PI / 2, role: 'rower', action: 'row', phase: 0, seed: i });
  }
  const rowUpdate = buildCrew(group, rowers);
  const deckUpdate = buildCrew(group, [
    { x: -L / 2 + 3.3, y: yC, z: 0, face: Math.PI / 2, role: 'greek', action: 'wheel' },
    { x: -L / 2 + 5.6, y: yC, z: 0.6, face: Math.PI / 2, role: 'greek', action: 'idle', seed: 1 },
    { x: -8, y: yC, z: 1.6, face: Math.PI / 2 + 1.2, role: 'greek', action: 'idle', rail: true, seed: 2 },
    { x: -2.5, y: yC, z: -1.6, face: -1.3, role: 'greek', action: 'idle', rail: true, seed: 3 },
    { x: 5, y: yC, z: 1.5, face: 1.8, role: 'greek', action: 'idle', rail: true, seed: 4 },
    { x: 9.5, y: yC, z: -1.4, face: -1.2, role: 'greek', action: 'idle', seed: 5 },
    { x: 0, y: yC, z: 0.2, face: 0, role: 'greek', action: 'walk', walk: 6, walkDir: 0, seed: 6 },
    { x: L * 0.38, y: yR + 0.45, z: 0.4, face: Math.PI / 2, role: 'greek', action: 'lookout', seed: 7 },
  ].slice(0, hi ? 8 : 4));

  /* ---------- lights */
  const lights = [
    { p: V3(-L / 2 + 3.6, yC + 1.55, 0), c: [2.2, 1.4, 0.6], size: 2.2, reflect: true },
    { p: V3(L * 0.4, yR + 1.0, 0), c: [2.4, 1.3, 0.5], size: 2.2, night: true, reflect: true },
  ];
  const pennant = flagMesh('#7c2a1f', 1.8, 0.5, SAIL.uTime);
  pennant.position.set(mastX, yC + mastH - 0.6, 0); group.add(pennant);

  carved.build(carvedGroup);
  let phase = 0;
  const ship = finish({
    group, batch, lights, glowMats, S, L, B, D, T,
    H: { deckY: () => yC, halfB: (x) => zAt(uOf(x), yR), halfBAt: (x, y) => zAt(uOf(x), y) },
    eye: V3(-L / 2 + 4.2, yC + 1.72, 0), bowLocal: V3(L / 2, 0, 0), sails, braces, WIND,
    crew: (t) => { deckUpdate(t); rowUpdate(phase - 0.6); },
    extra(dt, t) {
      // ~26 strokes a minute; the stroke slows when the storm builds
      phase += dt * (2.7 - 0.9 * SAIL.reef);
      oars.forEach((o2, i) => {
        // each oar runs outward and down to the water from its pivot, sweeping fore-aft;
        // the blade lifts clear on the recovery stroke
        const ph = phase - o2.lag, sinp = Math.sin(ph), cosp = Math.cos(ph);
        const beta = 0.42 * sinp;
        const alpha = o2.pitch - (cosp > 0 ? 0.22 * cosp : 0.04 * cosp);
        _dir.set(Math.sin(beta) * Math.cos(alpha), -Math.sin(alpha), o2.s * Math.cos(beta) * Math.cos(alpha));
        _q.setFromUnitVectors(_X, _dir);
        _m.compose(_p.set(o2.x, o2.y, o2.z), _q, _sc.set(o2.len, 1, 1));
        shaftMesh.setMatrixAt(i, _m);
        _bp.copy(_dir).multiplyScalar(o2.len - 0.32).add(_p);
        _m.compose(_bp, _q, _sc.set(1, 1, 1));
        bladeMesh.setMatrixAt(i, _m);
      });
      shaftMesh.instanceMatrix.needsUpdate = bladeMesh.instanceMatrix.needsUpdate = true;
      // the catch: blades bite the water together
      const sinp = Math.sin(phase);
      if (ship.onSplash && Math.sin(phase - dt * 2.7) < 0.95 && sinp >= 0.95) {
        splashes.length = 0;
        for (let k = 0; k < oars.length; k += 5) splashes.push(V3(oars[k].x, -0.3, oars[k].s * (Math.abs(oars[k].z) + oars[k].len * 0.8)));
        ship.onSplash(splashes, 0.4);
      }
    },
  });
  ship.kind = 'trireme';
  ship.camL = 90;

  loadCarved('trireme_carved.glb').then((gltf) => {
    const ao = (m) => { const c = m.clone(); c.vertexColors = true; return c; };
    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, vertexColors: true, ...extra });
    const deckMat = new THREE.MeshStandardMaterial({ map: deckTexture(24), roughness: 0.78, vertexColors: true, side: THREE.DoubleSide });
    const table = {
      TR_bronze: ao(bronze), TR_dark: ao(darkWood), TR_wood: ao(oak), TR_deck: deckMat,
      TR_marble: std('#ebe6dc', { roughness: 0.35 }), TR_iris: std('#7a3320', { roughness: 0.4 }), TR_pupil: std('#0e0c0b', { roughness: 0.4 }),
      TR_paint: std('#7c2a1f'), TR_port: std('#090605', { roughness: 0.9 }), TR_leather: std('#5b3b24', { roughness: 0.75 }),
      TR_shieldA: std('#8f2a1d', { roughness: 0.45 }), TR_shieldB: std('#151312', { roughness: 0.4 }),
      TR_canvas: std('#d6c8aa', { roughness: 0.95, side: THREE.DoubleSide }),
    };
    const out = new THREE.Group();
    gltf.scene.traverse((m) => {
      if (!m.isMesh) return;
      const name = m.name.replace(/[._]\d+$/, ''), g = m.geometry;
      liftAO(g, 0.35);
      if (name === 'TR_deck' && !g.attributes.uv) {
        const p = g.attributes.position, a = new Float32Array(p.count * 2);
        for (let i = 0; i < p.count; i++) { a[i * 2] = p.getX(i) / 3; a[i * 2 + 1] = p.getZ(i) / 3; }
        g.setAttribute('uv', new THREE.BufferAttribute(a, 2));
      }
      if (table[name]) out.add(new THREE.Mesh(g, table[name]));
    });
    group.remove(carvedGroup);
    group.add(out);
  }).catch(() => {});
  return ship;
}
