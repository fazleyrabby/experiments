import * as THREE from 'three';
import { Batch, M, V3, CYL, CYL8, SPH, hullModel, buildHullGeometry, shared } from './ship.js';
import { makeCruiseHullTextures, makeBalconyTexture, makePublicTexture } from './textures.js';

/*
  Procedural cruise ship (~320 m): white hull with portholes, a terraced block of
  balcony decks over two glazed public decks, recessed lifeboat deck, bridge with
  full-width wings, pool deck with a waterslide, and a big raked funnel.
  Same interface as buildShip(), so it can ride the same seakeeping and lighting.
*/

const lerp = THREE.MathUtils.lerp;

export function buildCruiseShip(o = {}) {
  const L = o.L ?? 320, B = o.B ?? 40, D = o.D ?? 16, T = o.T ?? 8.6;
  const S = shared();
  const m = S.m;
  const group = new THREE.Group();
  const batch = new Batch();
  const glowMats = [], sprites = [], spots = [];
  const glow = (mat) => { mat.userData.baseGlow = mat.emissiveIntensity; glowMats.push(mat); return mat; };
  const rnd = (() => { let a = (o.seed ?? 9) >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

  /* ---- hull */
  const H = hullModel(L, B, D, T);
  const G = buildHullGeometry(H, L, B, D, T);
  const { deckY, halfB, halfBAt } = H;
  const ht = makeCruiseHullTextures({ L, D, T, W: o.texW ?? 4096, name: o.name ?? 'AURELIA', line: o.brand ?? 'SEAVANTE' });
  const hullMat = glow(new THREE.MeshStandardMaterial({ map: ht.map, emissiveMap: ht.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 0.32, metalness: 0.1, envMapIntensity: 0.9 }));
  const white = new THREE.MeshStandardMaterial({ color: '#f0f1ed', roughness: 0.38, metalness: 0.08, envMapIntensity: 0.8 });
  const teak = new THREE.MeshStandardMaterial({ color: '#9a7a58', roughness: 0.7, metalness: 0.0, envMapIntensity: 0.5 });
  group.add(new THREE.Mesh(G.hull, hullMat), new THREE.Mesh(G.deck, teak), new THREE.Mesh(G.transom, white));
  batch.sph(m.red, L / 2 - 7, -T + 4.2, 0, 8.5, 2.6, 2.3);

  /* ---- twin azimuth pods */
  const props = [];
  for (const s of [-1, 1]) {
    const pod = new THREE.Group();
    const pb = new Batch();
    pb.cyl(m.white, 0, 0, 0, 1.6, 7, 0, 0, Math.PI / 2);
    pb.sph(m.white, 3.5, 0, 0, 1.6);
    pb.box(m.white, 0.5, 2.6, 0, 3.0, 4, 0.7);
    pb.build(pod);
    const prop = new THREE.Group();
    const pp = new Batch();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      pp.add(m.bronze, SPH, new THREE.Matrix4().makeRotationX(a).multiply(new THREE.Matrix4().makeTranslation(0, 1.9, 0)).multiply(new THREE.Matrix4().makeRotationY(0.6)).multiply(new THREE.Matrix4().makeScale(0.15, 1.5, 0.9)));
    }
    pp.cyl(m.bronze, 0, 0, 0, 0.7, 1.2, 0, 0, Math.PI / 2);
    pp.build(prop);
    prop.position.x = 4.4;
    pod.add(prop);
    pod.position.set(-L / 2 + 16, -T + 2.6, s * 7);
    group.add(pod);
    props.push(prop);
  }

  /* ---- superstructure */
  const dh = 2.95, N = 12;
  const yBase = deckY(0) + 0.1;
  const bal = makeBalconyTexture(16, 4, (o.seed ?? 9) + 1);
  const pub = makePublicTexture((o.seed ?? 9) + 2);
  for (const t of [bal.map, bal.emissiveMap]) t.repeat.set(1 / bal.tileW, 1 / bal.tileH);
  for (const t of [pub.map, pub.emissiveMap]) t.repeat.set(1 / pub.tileW, 1 / pub.tileH);
  const balMat = glow(new THREE.MeshStandardMaterial({ map: bal.map, emissiveMap: bal.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.15, envMapIntensity: 0.9 }));
  const pubMat = glow(new THREE.MeshStandardMaterial({ map: pub.map, emissiveMap: pub.emissiveMap, emissive: 0xffffff, emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.3, envMapIntensity: 1.0 }));
  const capMat = new THREE.MeshStandardMaterial({ color: '#d9dbd6', roughness: 0.6, metalness: 0.05 });
  const ledMat = glow(new THREE.MeshStandardMaterial({ color: '#dfe8ef', emissive: '#bfe6ff', emissiveIntensity: 1.4, roughness: 0.4 }));

  const plan = (k) => {
    const xa = -L / 2 + 12 + Math.max(0, k - 5) * 6.5;          // terraced stern
    const xf = L / 2 - 44 - k * 2.4;                            // raked, rounded front
    const hw = k === 2 ? B / 2 - 4.4 : k < 2 ? B / 2 - 1.2 : B / 2 - 0.25;
    return { xa, xf, hw, rf: Math.min(26, (xf - xa) * 0.4) };
  };
  const outline = ({ xa, xf, hw, rf }, grow = 0) => {
    const s = new THREE.Shape();
    const w = hw + grow, a = xa - grow, f = xf + grow, xc = f - rf;
    s.moveTo(a, -w);
    s.lineTo(xc, -w);
    s.absellipse(xc, 0, rf + 0, w, -Math.PI / 2, Math.PI / 2, false, 0);
    s.lineTo(a, w);
    s.closePath();
    return s;
  };
  // world-space UVs: walls get (along, height above the stack base); caps get plan coords
  const worldUV = (g) => {
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
      if (Math.abs(ny) > 0.5) uv.setXY(i, p.getX(i) / 6, p.getZ(i) / 6);
      else uv.setXY(i, Math.abs(nz) >= Math.abs(nx) ? p.getX(i) : p.getZ(i), p.getY(i) - yBase);
    }
  };
  const slabs = [], leds = [];
  for (let k = 0; k < N; k++) {
    const P = plan(k);
    const g = new THREE.ExtrudeGeometry(outline(P), { depth: dh, bevelEnabled: false, curveSegments: 18 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, yBase + k * dh, 0);
    g.computeVertexNormals();
    worldUV(g);
    const face = k < 2 ? pubMat : k === 2 ? white : balMat;
    group.add(new THREE.Mesh(g, [k === N - 1 ? teak : capMat, face]));
    // white slab lip at every deck, LED cove light every third deck
    const sg = new THREE.ExtrudeGeometry(outline(P, 0.45), { depth: 0.24, bevelEnabled: false, curveSegments: 18 });
    sg.rotateX(-Math.PI / 2); sg.translate(0, yBase + (k + 1) * dh - 0.12, 0);
    if (k === N - 1) batch.add(teak, sg); else slabs.push(sg);
    if (k % 3 === 2 || k === N - 1) {
      const lg = new THREE.ExtrudeGeometry(outline(P, 0.5), { depth: 0.07, bevelEnabled: false, curveSegments: 18 });
      lg.rotateX(-Math.PI / 2); lg.translate(0, yBase + (k + 1) * dh - 0.2, 0);
      leds.push(lg);
    }
  }
  for (const g of slabs) batch.add(white, g);
  for (const g of leds) batch.add(ledMat, g);
  const yTop = yBase + N * dh;
  const top = plan(N - 1);

  /* ---- lifeboats in the recess on deck 3 */
  const lbGeo = new THREE.CapsuleGeometry(1.7, 6.5, 6, 16);
  const orange = m.orange;
  const yLb = yBase + 2 * dh + 1.5;
  for (const s of [-1, 1]) {
    for (let x = -L / 2 + 62; x < L / 2 - 92; x += 11) {
      const z = s * (B / 2 - 2.0);
      batch.add(orange, lbGeo, M(x, yLb, z, 0, 0, Math.PI / 2, 1, 1, 0.85));
      batch.box(white, x, yLb + 1.35, z, 6.8, 0.5, 2.2);
      for (const dx of [-3.0, 3.0]) {
        batch.rod(m.grey, V3(x + dx, yLb - 1.8, s * (B / 2 - 4.4)), V3(x + dx, yLb + 2.4, s * (B / 2 - 1.6)), 0.16, CYL8);
      }
    }
  }

  /* ---- top deck: bridge, pools, waterslide, funnel, mast */
  const bridgeX = top.xf - 14;
  const bridgeGlass = glow(new THREE.MeshStandardMaterial({ color: '#0e161c', emissive: '#4a8f86', emissiveIntensity: 0.25, roughness: 0.05, metalness: 0.9, envMapIntensity: 1.3 }));
  // bridge front band one deck below the top, wings out past the hull
  const yBr = yBase + (N - 2) * dh;
  batch.box(white, bridgeX, yBr + dh / 2, 0, 8, dh, B + 3);
  batch.box(bridgeGlass, bridgeX + 4.05, yBr + dh * 0.55, 0, 0.12, dh * 0.55, B + 2.6);
  for (const s of [-1, 1]) batch.rod(white, V3(bridgeX, yBr - 4, s * (B / 2 - 0.4)), V3(bridgeX, yBr, s * (B / 2 + 1.2)), 0.35, CYL8);
  // pool deck surfaces
  const poolMat = glow(new THREE.MeshStandardMaterial({ color: '#3fb7d6', emissive: '#2fa9d0', emissiveIntensity: 0.5, roughness: 0.05, metalness: 0.2, envMapIntensity: 1.4 }));
  batch.box(poolMat, 10, yTop + 0.3, 0, 22, 0.35, 12);
  batch.box(poolMat, -30, yTop + 0.3, 0, 14, 0.35, 9);
  batch.box(white, 10, yTop + 0.25, 0, 23, 0.5, 13);
  // glass windscreens along the top deck edge
  const glassMat = new THREE.MeshStandardMaterial({ color: '#a8c4d2', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.35, envMapIntensity: 1.2 });
  for (const s of [-1, 1]) batch.box(glassMat, (top.xa + top.xf) / 2 - 8, yTop + 0.7, s * (top.hw - 0.2), top.xf - top.xa - 20, 1.4, 0.06);
  // loungers with coloured cushions, umbrellas, hot tubs
  const cushA = new THREE.MeshStandardMaterial({ color: '#2a63ad', roughness: 0.8 });
  const cushB = new THREE.MeshStandardMaterial({ color: '#f0eee6', roughness: 0.8 });
  const umbA = new THREE.MeshStandardMaterial({ color: '#f2b51d', roughness: 0.7 });
  const umbB = new THREE.MeshStandardMaterial({ color: '#2fa3a8', roughness: 0.7 });
  const UMB = new THREE.ConeGeometry(1.5, 0.6, 16, 1, true);
  for (const s of [-1, 1]) {
    for (const row of [top.hw - 3.5, top.hw - 6.5]) {
      for (let x = -24; x < 44; x += 2.3) {
        if (x > -2 && x < 22 && row < top.hw - 5) continue;
        batch.box(m.grey, x, yTop + 0.25, s * row, 1.9, 0.12, 0.75);
        batch.box((Math.floor(x / 2.3) + (row > top.hw - 5 ? 0 : 1)) % 3 ? cushA : cushB, x, yTop + 0.36, s * row, 1.8, 0.1, 0.68);
      }
    }
    for (let x = -22; x < 44; x += 9.2) {
      const z = s * (top.hw - 5);
      batch.rod(white, V3(x, yTop, z), V3(x, yTop + 2.4, z), 0.04, CYL8);
      batch.add(((x / 9.2) | 0) % 2 ? umbA : umbB, UMB, M(x, yTop + 2.6, z));
    }
  }
  for (const [x, z] of [[-6, 4.5], [-6, -4.5], [26, 7], [26, -7]]) {
    batch.cyl(white, x, yTop + 0.35, z, 2.0, 0.7);
    batch.cyl(poolMat, x, yTop + 0.55, z, 1.65, 0.4);
  }
  // twisting waterslide on a tower
  const sx = top.xa + 30, sz = 9;
  batch.cyl(white, sx, yTop + 8, sz, 0.6, 16);
  const helix = [];
  for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 6; helix.push(V3(sx + Math.cos(a) * 4.2, yTop + 16 - i / 120 * 14, sz + Math.sin(a) * 4.2)); }
  helix.push(V3(sx + 10, yTop + 1, sz - 2));
  const slideMat = glow(new THREE.MeshStandardMaterial({ color: '#f2b51d', emissive: '#f2b51d', emissiveIntensity: 0.15, roughness: 0.25 }));
  const slideMat2 = glow(new THREE.MeshStandardMaterial({ color: '#1f6fd1', emissive: '#1f6fd1', emissiveIntensity: 0.15, roughness: 0.25 }));
  batch.add(slideMat, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 240, 0.75, 10, false));
  const helix2 = helix.map((p) => V3(sx - (p.x - sx), p.y - 1.5, sz - (p.z - sz)));
  batch.add(slideMat2, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix2), 240, 0.65, 10, false));
  // spa dome forward of the funnel
  batch.add(glassMat, new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(top.xf - 40, yTop, 0, 0, 0, 0, 9, 4, 9));

  // funnel: big, oval, raked, white with a navy/blue company band and black top
  const fx = top.xa + 60, fH = 18, rake = 0.24;
  {
    const fg = new THREE.CylinderGeometry(1, 1.12, 1, 56, 6, false);
    fg.scale(11, fH, 7.2);
    const pa = fg.attributes.position;
    for (let i = 0; i < pa.count; i++) pa.setX(i, pa.getX(i) - (pa.getY(i) + fH / 2) * rake);
    fg.translate(fx, yTop + fH / 2, 0);
    fg.computeVertexNormals();
    batch.add(white, fg);
    const band = (y0, h, mat, grow) => {
      const g = new THREE.CylinderGeometry(1 + grow, 1 + grow, 1, 56, 1, true);
      g.scale(11 * (1 + grow), h, 7.2 * (1 + grow));
      const q = g.attributes.position;
      for (let i = 0; i < q.count; i++) q.setX(i, q.getX(i) - (q.getY(i) + h / 2 + y0) * rake);
      g.translate(fx, yTop + y0 + h / 2, 0);
      g.computeVertexNormals();
      batch.add(mat, g);
    };
    band(fH * 0.55, fH * 0.22, new THREE.MeshStandardMaterial({ color: '#13294a', roughness: 0.4, metalness: 0.2 }), 0.008);
    band(fH * 0.59, fH * 0.04, new THREE.MeshStandardMaterial({ color: '#2f7fc1', roughness: 0.4 }), 0.012);
    band(fH * 0.9, fH * 0.1, m.black, 0.01);
    for (const dz of [-2.2, 0, 2.2]) batch.cyl(m.dark, fx - fH * rake - 1, yTop + fH + 1.2, dz, 0.7, 2.6);
  }
  // radar mast over the bridge
  const mx = bridgeX - 4;
  batch.box(white, mx, yTop + 3, 0, 2.2, 6, 2.2);
  batch.box(white, mx, yTop + 6.2, 0, 1.2, 0.3, 9);
  batch.cyl(white, mx, yTop + 9, 0, 0.3, 6, 0, 0, 0, CYL8);
  batch.sph(white, mx - 6, yTop + 1.6, 6, 1.1);
  batch.sph(white, mx - 6, yTop + 1.6, -6, 1.1);
  const radars = [];
  for (const [y, len, sp] of [[yTop + 6.6, 4.4, 2.0], [yTop + 12.2, 3.2, 2.7]]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, 0.3), m.offwhite);
    r.position.set(mx, y, 0);
    group.add(r);
    radars.push({ r, sp, ph: rnd() * 6 });
  }

  /* ---- detail pass: 3D balcony fins, promenade rails, funnel wings, pool-deck features */
  const detail = o.spots !== false;
  if (detail) {
    for (let k = 3; k < N; k++) {
      const P = plan(k), xc = P.xf - P.rf;
      const y = yBase + k * dh + dh / 2 + 0.1;
      for (const s of [-1, 1]) for (let x = P.xa + 3; x < xc; x += 3) batch.box(white, x, y, s * (P.hw + 0.28), 0.16, dh - 0.3, 0.56);
    }
  }
  for (let k = 0; k < 2; k++) {
    const P = plan(k), y = yBase + (k + 1) * dh;
    for (const s of [-1, 1]) batch.rail(m.rail, [V3(P.xa + 2, y, s * (P.hw + 0.5)), V3(P.xf - P.rf, y, s * (P.hw + 0.5))], 1.1, 2.4, 0.03);
  }
  // swept wind deflector fins either side of the funnel
  for (const s of [-1, 1]) batch.box(white, fx - 3 - fH * 0.6 * rake, yTop + fH * 0.62, s * 7.2, 9, 1.2, 0.5, s * 0.35, 0, 0.32);
  // sail shades over the main pool
  const sailMat = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  for (const [x0, z0, f] of [[2, -5, 1], [16, 4, -1], [8, 0, 1]]) {
    const g = new THREE.BufferGeometry().setFromPoints([V3(x0 - 7, yTop + 4.5, z0 - 4 * f), V3(x0 + 7, yTop + 6.5, z0 - 1 * f), V3(x0, yTop + 5.2, z0 + 6 * f)]);
    g.computeVertexNormals();
    group.add(new THREE.Mesh(g, sailMat));
    for (const p of [V3(x0 - 7, 0, z0 - 4 * f), V3(x0 + 7, 0, z0 - 1 * f), V3(x0, 0, z0 + 6 * f)]) batch.rod(white, V3(p.x, yTop, p.z), V3(p.x, yTop + 6.6, p.z), 0.09, CYL8);
  }
  // big outdoor screen facing the pool
  const scr = document.createElement('canvas'); scr.width = 256; scr.height = 128;
  { const x = scr.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#2b6fb3'); g.addColorStop(0.55, '#7fc3e8'); g.addColorStop(0.56, '#1b4f7a'); g.addColorStop(1, '#0d2c46'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    x.fillStyle = 'rgba(255,240,200,0.9)'; x.beginPath(); x.arc(190, 52, 14, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = '600 18px Arial'; x.fillText('SEAVANTE', 16, 30); }
  const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = glow(new THREE.MeshStandardMaterial({ map: scrTex, emissiveMap: scrTex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.3 }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), screenMat);
  screen.position.set(25, yTop + 6.5, 0); screen.rotation.y = -Math.PI / 2;
  group.add(screen);
  batch.box(m.dark, 25.3, yTop + 6.5, 0, 0.4, 5.4, 9.4);
  batch.box(white, 25.6, yTop + 2, 0, 0.6, 4, 1.2);
  // sports court and mini-golf on the aft top deck
  const court = new THREE.MeshStandardMaterial({ color: '#2f7d5b', roughness: 0.85 });
  const courtB = new THREE.MeshStandardMaterial({ color: '#2a5d9c', roughness: 0.85 });
  batch.box(court, top.xa + 52, yTop + 0.12, -8, 24, 0.1, 14);
  batch.box(courtB, top.xa + 52, yTop + 0.14, -8, 16, 0.1, 9);
  batch.rail(m.rail, [V3(top.xa + 40, yTop, -15), V3(top.xa + 64, yTop, -15), V3(top.xa + 64, yTop, -1), V3(top.xa + 40, yTop, -1), V3(top.xa + 40, yTop, -15)], 3.2, 2.0, 0.04);
  for (let i = 0; i < 6; i++) batch.box(court, top.xa + 44 + (i % 3) * 7, yTop + 0.14, 4 + Math.floor(i / 3) * 5, 5, 0.08, 3.2);
  for (let i = 0; i < 6; i++) { const x = top.xa + 45 + (i % 3) * 7, z = 4.5 + Math.floor(i / 3) * 5; batch.rod(white, V3(x, yTop, z), V3(x, yTop + 1.2, z), 0.02); batch.box(m.red, x + 0.2, yTop + 1.1, z, 0.4, 0.25, 0.02); }

  // waving flags (stern ensign + mast), animated in the vertex shader
  const flagT = { value: 0 };
  const flagMat = new THREE.MeshStandardMaterial({ color: '#1d3f7a', roughness: 0.75, side: THREE.DoubleSide });
  flagMat.onBeforeCompile = (sh) => {
    sh.uniforms.uFlagT = flagT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFlagT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float w = position.x + 1.2;
        transformed.z += sin(uFlagT * 7.0 - w * 3.2) * 0.22 * w + sin(uFlagT * 11.0 - w * 5.0) * 0.06 * w;
        transformed.y -= 0.05 * w * w;`);
  };
  const flagGeo = new THREE.PlaneGeometry(2.4, 1.5, 14, 6);
  for (const [px, py] of [[-L / 2 + 1.2, deckY(-L / 2) + 7], [mx, yTop + 12]]) {
    const fl = new THREE.Mesh(flagGeo, flagMat);
    fl.position.set(px - 1.2, py, 0);
    group.add(fl);
    batch.cyl(white, px, py - 2.5, 0, 0.07, 6, 0, 0, 0, CYL8);
  }

  /* ---- lights */
  const lights = [];
  const WARM = [1.9, 1.4, 0.85], COOL = [1.4, 1.7, 2.1];
  lights.push({ p: V3(mx, yTop + 12.5, 0), c: [2.6, 2.6, 2.4], size: 4 });
  lights.push({ p: V3(fx - fH * rake, yTop + fH + 3.2, 0), c: [2.6, 0.2, 0.15], size: 3 });
  lights.push({ p: V3(-L / 2 + 0.7, deckY(-L / 2) + 3, 0), c: [2.4, 2.4, 2.2], size: 3.4 });
  for (const s of [-1, 1]) {
    lights.push({ p: V3(bridgeX + 2, yBr + 2.2, s * (B / 2 + 1.4)), c: s < 0 ? [3.0, 0.15, 0.12] : [0.15, 2.6, 0.6], size: 4.2 });
    // festoon lights along the top deck and down the terraced stern
    for (let x = top.xa + 4; x < top.xf - 8; x += 9) lights.push({ p: V3(x, yTop + 1.8, s * (top.hw - 0.3)), c: rnd() < 0.5 ? WARM : COOL, size: 2.2, night: true, reflect: x > top.xf - 30 });
    for (let k = 6; k < N; k++) { const P = plan(k); lights.push({ p: V3(P.xa + 0.5, yBase + (k + 1) * dh, s * (P.hw - 3)), c: WARM, size: 2.4, night: true }); }
    lights.push({ p: V3(10, yTop + 3, s * 7), c: [0.8, 1.6, 2.2], size: 6, night: true, reflect: true });
    lights.push({ p: V3(fx + 6, yTop + 1, s * 5), c: WARM, size: 6, night: true, reflect: true });
  }

  batch.build(group);

  const reflectLights = [];
  for (const l of lights) {
    const mat = new THREE.SpriteMaterial({ map: S.glow, color: new THREE.Color(...l.c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
    mat.userData.baseColor = mat.color.clone();
    mat.userData.night = !!l.night;
    const sp = new THREE.Sprite(mat);
    sp.position.copy(l.p); sp.scale.setScalar(l.size);
    group.add(sp); sprites.push(sp);
    if (l.reflect || (!l.night && l.size >= 3.4)) reflectLights.push({ p: l.p.clone(), c: new THREE.Color(...l.c), night: !!l.night });
  }

  let nightAmt = 0, navAmt = 1, propA = 0, curWindows = 1;
  const _w = new THREE.Vector3();
  return {
    group, L, B, D, T, deckY, halfB, halfBAt,
    setLights(windows, nav) {
      nightAmt = Math.min(1, Math.max(0, (windows - 0.6) / 1.2));
      navAmt = nav;
      curWindows = windows;
      for (const mm of glowMats) mm.emissiveIntensity = mm.userData.baseGlow * windows;
      for (const sp of sprites) {
        const k = sp.material.userData.night ? nav * nightAmt : nav;
        sp.material.color.copy(sp.material.userData.baseColor).multiplyScalar(k);
        sp.visible = k > 0.01;
      }
    },
    reflections(outPos, outCol, max = 8) {
      let n = 0;
      for (const r of reflectLights) {
        if (n >= max) break;
        const k = r.night ? navAmt * nightAmt : navAmt * (0.04 + 0.96 * nightAmt);
        if (k < 0.01) continue;
        outPos[n].copy(_w.copy(r.p).applyMatrix4(group.matrixWorld));
        outCol[n].copy(r.c).multiplyScalar(k * 0.022);
        n++;
      }
      for (let i = n; i < max; i++) outCol[i].setRGB(0, 0, 0);
    },
    bowLocal: V3(L / 2 - 2, 0, 0),
    eye: V3(bridgeX + 4.45, yBr + 1.65, 0),
    funnelTop: V3(fx - fH * rake - 1, yTop + fH + 2.8, 0),
    smoke: { shade: 0.55, alpha: 0.12 },
    update(dt, t, racing = 0) {
      flagT.value = t;
      // colour-cycling LED coves at night, shimmering pools
      ledMat.emissive.setHSL((t * 0.015) % 1, 0.55, 0.62);
      poolMat.emissiveIntensity = poolMat.userData.baseGlow * curWindows * (0.85 + 0.15 * Math.sin(t * 2.3));
      for (const rd of radars) rd.r.rotation.y = t * rd.sp + rd.ph;
      propA += dt * (6 + racing * 8);
      for (const p of props) p.rotation.x = propA;
    },
  };
}
