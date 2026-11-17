// The desk and the room around it, all modelled and textured in code.
// Late-afternoon sun comes through a window behind the desk; its mullions throw
// bar shadows across the oak. A warm desk lamp lights the mug hairpin.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as TX from './textures.js';
import { BOOKS, BOOK_TOP, HALF_W } from './track.js';

export const DESK = { x0: -150, x1: 150, z0: -62, z1: 62, thick: 4, floorY: -75 };
const WALL_Z = -64;
const WIN = { x0: -148, x1: 140, y0: 3, y1: 112 };
export const SUN_DIR = new THREE.Vector3(-0.2, 0.58, -0.79).normalize();   // toward the sun

const std = (o) => new THREE.MeshStandardMaterial(o);
const phys = (o) => new THREE.MeshPhysicalMaterial(o);
function shadow(m, cast = true, recv = true) { m.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recv; } }); return m; }

export function buildWorld(scene, renderer, track) {
  const W = { group: new THREE.Group(), animated: [] };
  scene.add(W.group);
  const add = (m, parent = W.group) => { parent.add(m); return m; };

  // ------------------------------------------------------------ desk
  const oak = TX.oakPlank(3);
  const plankN = Math.round((DESK.z1 - DESK.z0) / 20), plankW = (DESK.z1 - DESK.z0) / plankN, r = TX.rng(11);
  for (let k = 0; k < plankN; k++) {
    const g = new RoundedBoxGeometry(DESK.x1 - DESK.x0, DESK.thick, plankW - 0.08, 2, 0.25);
    const offU = r(), flip = r() < 0.5;
    const mk = (t) => { const c = t.clone(); c.repeat.set((DESK.x1 - DESK.x0) / 140 * (flip ? -1 : 1), plankW / 17.5); c.offset.set(offU, r()); c.needsUpdate = true; return c; };
    const m = new THREE.Mesh(g, phys({ map: mk(oak.map), roughnessMap: mk(oak.roughnessMap), normalMap: mk(oak.normalMap), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 1, clearcoat: 0.25, clearcoatRoughness: 0.3 }));
    m.position.set(0, -DESK.thick / 2, DESK.z0 + plankW * (k + 0.5));
    m.receiveShadow = true; m.castShadow = true;
    add(m);
  }
  // steel frame and legs
  const steel = std({ color: 0x24262a, metalness: 0.8, roughness: 0.45 });
  for (const x of [DESK.x0 + 8, DESK.x1 - 8]) for (const z of [DESK.z0 + 6, DESK.z1 - 6]) {
    const leg = add(new THREE.Mesh(new THREE.BoxGeometry(5, -DESK.floorY - DESK.thick, 5), steel));
    leg.position.set(x, (DESK.floorY - DESK.thick) / 2, z); leg.castShadow = true;
  }
  const apron = add(new THREE.Mesh(new THREE.BoxGeometry(DESK.x1 - DESK.x0 - 20, 6, 3), steel)); apron.position.set(0, -DESK.thick - 3, DESK.z0 + 6);

  // ------------------------------------------------------------ room
  const wallTex = TX.plasterWall('#e8dfd2'); wallTex.repeat.set(4, 2);
  const wallMat = std({ map: wallTex, roughness: 0.92 });
  const floorTex = TX.floorBoards(); floorTex.repeat.set(4, 4);
  const floor = add(new THREE.Mesh(new THREE.PlaneGeometry(600, 520), std({ map: floorTex, roughness: 0.6 })));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, DESK.floorY, 80); floor.receiveShadow = true;
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(600, 520), std({ color: 0xf2efe8, roughness: 1 })));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 195, 80);
  const wallBox = (w, h, x, y, z, ry = 0) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), wallMat)); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; return m; };
  // back wall with the window opening
  const H0 = DESK.floorY, H1 = 195, wz = WALL_Z - 3;
  wallBox(WIN.x0 + 300, H1 - H0, (-300 + WIN.x0) / 2, (H0 + H1) / 2, wz);
  wallBox(300 - WIN.x1, H1 - H0, (WIN.x1 + 300) / 2, (H0 + H1) / 2, wz);
  wallBox(WIN.x1 - WIN.x0, WIN.y0 - H0, (WIN.x0 + WIN.x1) / 2, (H0 + WIN.y0) / 2, wz);
  wallBox(WIN.x1 - WIN.x0, H1 - WIN.y1, (WIN.x0 + WIN.x1) / 2, (WIN.y1 + H1) / 2, wz);
  wallBox(520, H1 - H0, -300, (H0 + H1) / 2, 80, Math.PI / 2);
  wallBox(520, H1 - H0, 300, (H0 + H1) / 2, 80, Math.PI / 2);
  wallBox(600, H1 - H0, 0, (H0 + H1) / 2, 340);
  // window frame, mullions and transom (they cast the bar shadows on the desk)
  const frameMat = std({ color: 0xf3f1ec, roughness: 0.5 });
  const bar = (w, h, d, x, y, z) => { const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const fz = WALL_Z - 4;
  bar(WIN.x1 - WIN.x0 + 6, 4, 8, (WIN.x0 + WIN.x1) / 2, WIN.y0 + 1, fz);
  bar(WIN.x1 - WIN.x0 + 6, 4, 8, (WIN.x0 + WIN.x1) / 2, WIN.y1 - 1, fz);
  bar(4, WIN.y1 - WIN.y0, 8, WIN.x0 + 1, (WIN.y0 + WIN.y1) / 2, fz);
  bar(4, WIN.y1 - WIN.y0, 8, WIN.x1 - 1, (WIN.y0 + WIN.y1) / 2, fz);
  for (const x of [-76, -4, 68]) bar(3.2, WIN.y1 - WIN.y0, 5, x, (WIN.y0 + WIN.y1) / 2, fz);
  bar(WIN.x1 - WIN.x0, 3.2, 5, (WIN.x0 + WIN.x1) / 2, 64, fz);
  bar(WIN.x1 - WIN.x0 + 14, 2.2, 14, (WIN.x0 + WIN.x1) / 2, WIN.y0 - 0.6, WALL_Z + 1);   // sill
  const glass = add(new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), phys({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.06 })));
  glass.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, fz - 1);
  const sky = add(new THREE.Mesh(new THREE.PlaneGeometry(1400, 700), new THREE.MeshBasicMaterial({ map: TX.skyView(), color: new THREE.Color(4.2, 4.1, 3.9) })));
  sky.position.set(-120, 120, -520);
  sky.userData.noAO = true;

  // shelf on the right wall: books and boxed die-casts, soft in the background
  const shelfMat = std({ color: 0x6b4a32, roughness: 0.6 });
  for (const y of [40, 80]) {
    const s = add(new THREE.Mesh(new THREE.BoxGeometry(28, 2.5, 120), shelfMat)); s.position.set(282, y, -40);
    for (let i = 0; i < 14; i++) {
      const h = 18 + r() * 8, w = 2.5 + r() * 3;
      const b = add(new THREE.Mesh(new THREE.BoxGeometry(18, h, w), std({ color: new THREE.Color().setHSL(r(), 0.45, 0.25 + r() * 0.3), roughness: 0.8 })));
      b.position.set(284, y + 1.25 + h / 2, -95 + i * 7.5);
    }
  }
  const poster = add(new THREE.Mesh(new THREE.PlaneGeometry(60, 80), std({ map: TX.blisterCard(), roughness: 0.6 })));
  poster.position.set(-296, 90, -10); poster.rotation.y = Math.PI / 2;

  // ------------------------------------------------------------ desk lamp
  const lampMat = phys({ color: 0x1c3b2e, metalness: 0.6, roughness: 0.32, clearcoat: 0.6 });
  const lampBase = new THREE.Vector3(132, 0, -52);
  const lb = add(new THREE.Mesh(new THREE.CylinderGeometry(8, 8.6, 1.6, 40), lampMat)); lb.position.copy(lampBase).setY(0.8);
  const joint1 = lampBase.clone().setY(2), joint2 = new THREE.Vector3(126, 40, -44), head = new THREE.Vector3(115, 36, -15);
  const arm = (a, b, rad) => {
    const d = b.clone().sub(a), m = add(new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, d.length(), 14), lampMat));
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m;
  };
  arm(joint1, joint2, 0.7); arm(joint2, head, 0.6);
  for (const j of [joint2]) { const s = add(new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), lampMat)); s.position.copy(j); }
  const target = new THREE.Vector3(115, 0, 6);
  const shadeDir = target.clone().sub(head).normalize();
  const shade = add(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(1.5, 3), new THREE.Vector2(2.4, 2.5), new THREE.Vector2(6.5, -4.5), new THREE.Vector2(6.8, -5.2)], 40), phys({ color: 0x1c3b2e, metalness: 0.6, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide })));
  shade.position.copy(head); shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), shadeDir);
  const bulb = add(new THREE.Mesh(new THREE.SphereGeometry(2.1, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.2, 4.8) })));
  bulb.position.copy(head).addScaledVector(shadeDir, 1.5);
  shadow(lb); shadow(shade);
  const lamp = new THREE.SpotLight(0xffc68a, 3200, 0, 0.62, 0.75, 2);
  lamp.position.copy(head).addScaledVector(shadeDir, 2.5);
  lamp.target.position.copy(target);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004; lamp.shadow.radius = 4;
  lamp.shadow.camera.near = 3; lamp.shadow.camera.far = 120;
  scene.add(lamp, lamp.target);
  W.lamp = lamp;

  // ------------------------------------------------------------ monitor on a wall arm, with live timing
  const screenCv = TX.screenCanvas();
  const screenTex = TX.canvasTexture(screenCv);
  const mon = new THREE.Group(); add(mon);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(62, 36, 2.2, 3, 0.8), std({ color: 0x141518, roughness: 0.4, metalness: 0.4 }));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(60, 33.75), new THREE.MeshBasicMaterial({ map: screenTex, color: new THREE.Color(1.4, 1.4, 1.4) }));
  screen.position.z = 1.15; mon.add(bezel, screen);
  mon.position.set(22, 46, -54); mon.rotation.x = -0.06;
  const monArm = add(new THREE.Mesh(new THREE.BoxGeometry(4, 4, 12), steel)); monArm.position.set(22, 46, -60);
  shadow(mon);
  W.screen = { cv: screenCv, tex: screenTex };

  // ------------------------------------------------------------ keyboard, mouse, pad
  buildKeyboard(add, r);
  const pad = add(new THREE.Mesh(new RoundedBoxGeometry(26, 0.3, 22, 2, 0.12), std({ color: 0x1e2226, roughness: 0.95 })));
  pad.position.set(78, 0.15, -48); pad.receiveShadow = true;
  const mouse = add(new THREE.Mesh(new THREE.SphereGeometry(3, 32, 20), phys({ color: 0xe8e6e1, roughness: 0.35, clearcoat: 0.4 })));
  mouse.scale.set(1, 0.48, 1.9); mouse.position.set(78, 0.9, -49); shadow(mouse);

  // ------------------------------------------------------------ mug of coffee inside the hairpin
  const mugPos = new THREE.Vector3(115, 0, 5);
  const glaze = phys({ color: 0x245e63, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
  const mugPts = [];
  for (let i = 0; i <= 12; i++) { const t = i / 12; mugPts.push(new THREE.Vector2(4.2 + Math.sin(t * Math.PI) * 0.15, t * 9.8)); }
  mugPts.push(new THREE.Vector2(4.25, 10), new THREE.Vector2(3.85, 10.05), new THREE.Vector2(3.8, 9.6));
  for (let i = 12; i >= 0; i--) mugPts.push(new THREE.Vector2(3.8, 0.6 + i / 12 * 9));
  mugPts.unshift(new THREE.Vector2(0, 0.02), new THREE.Vector2(3.9, 0), new THREE.Vector2(4.15, 0.25));
  const mug = add(new THREE.Mesh(new THREE.LatheGeometry(mugPts, 64), glaze)); mug.position.copy(mugPos);
  const handle = add(new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.55, 16, 40, Math.PI * 1.2), glaze));
  handle.position.copy(mugPos).add(new THREE.Vector3(4.0, 5.0, 0)); handle.rotation.z = -Math.PI * 0.6;
  const coffee = add(new THREE.Mesh(new THREE.CircleGeometry(3.8, 48), phys({ color: 0x1b0d06, roughness: 0.05, clearcoat: 1 })));
  coffee.rotation.x = -Math.PI / 2; coffee.position.copy(mugPos).setY(8.6);
  const crema = add(new THREE.Mesh(new THREE.RingGeometry(3.2, 3.8, 48), std({ color: 0x8a5a32, roughness: 0.6, transparent: true, opacity: 0.6 })));
  crema.rotation.x = -Math.PI / 2; crema.position.copy(mugPos).setY(8.61);
  shadow(mug); shadow(handle);
  W.steam = buildSteam(add, mugPos.clone().setY(9));
  W.animated.push(W.steam);

  // ------------------------------------------------------------ books under the jump, with an eraser wedge under the kicker
  const bookA = makeBook(27.5, 3.4, 23, '#1d3b5c', 'Vehicle Dynamics', 'third edition', 3);
  bookA.position.set((BOOKS.x0 + BOOKS.x1) / 2 + 0.3, 1.7, (BOOKS.z0 + BOOKS.z1) / 2); bookA.rotation.y = 0.02; add(bookA);
  const bookB = makeBook(26.5, 2.9, 21.5, '#7a2520', 'The Art of the Drift', 'a field guide', 8);
  bookB.position.set((BOOKS.x0 + BOOKS.x1) / 2 - 0.2, 3.4 + 1.45, (BOOKS.z0 + BOOKS.z1) / 2 + 0.4); bookB.rotation.y = -0.015; add(bookB);
  const eraserMat = phys({ color: 0xf28fa0, roughness: 0.7, sheen: 0.5 });
  const wedge = add(new THREE.Mesh(new RoundedBoxGeometry(5.5, 0.55, 3.2, 2, 0.12), eraserMat));
  wedge.position.set(-53.5, BOOK_TOP + 0.27, -24); shadow(wedge);

  // ------------------------------------------------------------ pencils: a knocked-over cup spilling into the chicane, and the start gantry
  const cup = add(new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 11, 40, 1, true), phys({ color: 0x2b2b2e, metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide, clearcoat: 0.5 })));
  cup.rotation.z = Math.PI / 2; cup.rotation.y = 0.25; cup.position.set(10, 4, 50); shadow(cup);
  const cupBase = add(new THREE.Mesh(new THREE.CircleGeometry(4, 40), phys({ color: 0x2b2b2e, metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide })));
  cupBase.position.set(15.3, 4, 48.6); cupBase.rotation.y = Math.PI / 2 + 0.25;
  const spill = [[-1, 0.37, 47, 0.1], [-6, 0.37, 52, -0.35], [-2, 0.37, 55.5, 0.4], [-10, 0.37, 49.5, 0.15]];
  spill.forEach(([x, y, z, a], i) => { const p = makePencil(i); p.position.set(x, y, z); p.rotation.y = a; p.rotation.z = Math.PI / 2; add(p); });
  const fs = track.sample(track.sStart);
  const posts = [];
  for (const side of [-1, 1]) {
    const base = fs.p.clone().addScaledVector(fs.B, side * (HALF_W + 2.6)); base.y = 0;
    const er = add(new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.4, 2, 2, 0.25), eraserMat)); er.position.copy(base).setY(0.7); shadow(er);
    const p = makePencil(side > 0 ? 5 : 6); p.position.copy(base).setY(1.0 + 8.75); add(p);
    posts.push(base);
  }
  const banCv = TX.canvas(1024, 192), bc = banCv.getContext('2d');
  bc.fillStyle = '#f6f3ea'; bc.fillRect(0, 0, 1024, 192);
  for (let x = 0; x < 32; x++) for (let y = 0; y < 2; y++) { bc.fillStyle = (x + y) % 2 ? '#141414' : '#f6f3ea'; bc.fillRect(x * 32, y * 32, 32, 32); bc.fillRect(x * 32, 128 + y * 32, 32, 32); }
  bc.fillStyle = '#e8361b'; bc.font = '900 74px "Archivo", Arial Black, sans-serif'; bc.textAlign = 'center'; bc.textBaseline = 'middle'; bc.fillText('DESK  GRAND  PRIX', 512, 98);
  const banTex = TX.canvasTexture(banCv);
  const span = posts[1].clone().sub(posts[0]);
  const banner = add(new THREE.Mesh(new THREE.PlaneGeometry(span.length() - 0.8, 2.6, 16, 1), std({ map: banTex, roughness: 0.8, side: THREE.DoubleSide })));
  banner.position.copy(posts[0]).add(posts[1]).multiplyScalar(0.5).setY(15.2);
  banner.rotation.y = -Math.atan2(span.z, span.x);
  { const pa = banner.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i) / (span.length() / 2); pa.setY(i, pa.getY(i) - (1 - x * x) * 0.5); } pa.needsUpdate = true; banner.geometry.computeVertexNormals(); }
  shadow(banner);

  // ------------------------------------------------------------ infield: notebook with the track sketch, sticky notes, blister card, coins, clip
  const plan = track.plan(6);
  const sketch = (c) => {
    c.strokeStyle = 'rgba(30,44,107,0.85)'; c.lineWidth = 3.2; c.lineJoin = 'round';
    for (const off of [-10, 10]) {
      c.beginPath();
      plan.forEach(([x, z], i) => { const px = x * 2.2 + Math.sin(i * 0.7) * 1.2, pz = z * 2.2 + off * 0.0 + Math.cos(i * 0.5) * 1.2; i ? c.lineTo(px + off * 0.3, pz) : c.moveTo(px + off * 0.3, pz); });
      c.closePath(); c.stroke();
    }
    c.fillStyle = 'rgba(30,44,107,0.85)'; c.font = '600 30px "Caveat", cursive';
    c.strokeRect(-56 * 2.2, -35.5 * 2.2, 28 * 2.2, 23 * 2.2); c.fillText('books', -52 * 2.2, -28 * 2.2);
    c.beginPath(); c.arc(115 * 2.2, 5 * 2.2, 12, 0, Math.PI * 2); c.stroke(); c.fillText('mug', 105 * 2.2, 14 * 2.2);
    c.beginPath(); c.moveTo(-60 * 2.2, 30 * 2.2); c.lineTo(-60 * 2.2, 42 * 2.2); c.stroke(); c.fillText('START', -72 * 2.2, 52 * 2.2);
  };
  const nb = new THREE.Group(); add(nb);
  const pageTex = TX.notebookPage(sketch);
  const book = new THREE.Mesh(new RoundedBoxGeometry(29.7, 0.7, 21, 2, 0.15), [
    std({ color: 0x24324a, roughness: 0.7 }), std({ color: 0x24324a, roughness: 0.7 }), std({ map: pageTex, roughness: 0.85 }),
    std({ color: 0x24324a }), std({ color: 0xefe8d6, roughness: 0.9 }), std({ color: 0xefe8d6, roughness: 0.9 }),
  ]);
  book.position.y = 0.35; nb.add(book);
  for (let i = 0; i < 26; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 6, 16), std({ color: 0x9a9da2, metalness: 1, roughness: 0.3 })); ring.position.set(-14.4 + i * 1.14, 0.55, -10.5); ring.rotation.y = Math.PI / 2; nb.add(ring); }
  nb.position.set(-45, 0, 5); nb.rotation.y = 0.06; shadow(nb);
  const pencilOnPad = makePencil(2); pencilOnPad.position.set(-37, 1.05, 11); pencilOnPad.rotation.set(0, 0.9, Math.PI / 2); add(pencilOnPad);
  const note = (text, color, x, z, a, seed) => {
    const g = new THREE.PlaneGeometry(7.6, 7.6, 8, 8); g.rotateX(-Math.PI / 2);
    const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const zz = pa.getZ(i); pa.setY(i, Math.max(0, zz - 1.5) ** 2 * 0.08); } g.computeVertexNormals();
    const m = add(new THREE.Mesh(g, std({ map: TX.stickyNote(text, color, '#1d2c6b', seed), roughness: 0.85, side: THREE.DoubleSide })));
    m.position.set(x, 0.06, z); m.rotation.y = a; m.receiveShadow = true; m.castShadow = true; return m;
  };
  note([{ t: 'BEAT' }, { t: '9.80s', s: 120, w: 700 }, { t: '— me', s: 70, r: -4 }], '#ffe873', 10, -4, 0.18, 2);
  note([{ t: 'buy more' }, { t: 'track!!', s: 104 }], '#ff9ec1', 55, -10, -0.22, 5);
  // the empty blister card the Countach came out of
  const cardTex = TX.blisterCard();
  const card = add(new THREE.Mesh(new RoundedBoxGeometry(11, 0.08, 15, 1, 0.03), [std({ color: 0xdcd8cf }), std({ color: 0xdcd8cf }), std({ map: cardTex, roughness: 0.55 }), std({ color: 0xdcd8cf }), std({ color: 0xdcd8cf }), std({ color: 0xdcd8cf })]));
  card.position.set(75, 0.05, 8); card.rotation.y = -0.4 - Math.PI / 2; shadow(card);
  const bubble = add(new THREE.Mesh(new RoundedBoxGeometry(5, 2.2, 9, 4, 1.0), phys({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.18, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide })));
  bubble.position.set(81, 1.1, 8.5); bubble.rotation.y = -0.4; bubble.userData.noAO = true;
  const coinMat = std({ color: 0xc89b5c, metalness: 1, roughness: 0.3 });
  [[-104, 5, 0], [-102.5, 7.2, 0.18], [-105, 8.2, 0.36]].forEach(([x, z, y]) => { const c = add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.18, 40), coinMat)); c.position.set(x, 0.09 + y, z); c.rotation.z = y * 0.1; shadow(c); });
  const clipPath = new THREE.CurvePath();
  const pts = [[0, 0], [3.2, 0], [3.2, 0.9], [-0.4, 0.9], [-0.4, 0.2], [2.6, 0.2], [2.6, 0.7], [0.4, 0.7]].map(([a, b]) => new THREE.Vector3(a, 0, b));
  const clip = add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1), 80, 0.05, 6), std({ color: 0xc0c4ca, metalness: 1, roughness: 0.25 })));
  clip.position.set(-98, 0.05, -6); clip.rotation.y = 0.6; clip.scale.setScalar(1.3); shadow(clip);

  // ------------------------------------------------------------ succulent in the back corner
  const pot = add(new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(4.4, 0), new THREE.Vector2(5.6, 9), new THREE.Vector2(6.0, 9.2), new THREE.Vector2(6.0, 10), new THREE.Vector2(5.4, 10), new THREE.Vector2(5.2, 8.5)], 40), std({ color: 0xb8643e, roughness: 0.85 })));
  pot.position.set(-138, 0, -52); shadow(pot);
  const leafMat = phys({ color: 0x6f9a6a, roughness: 0.5, clearcoat: 0.3, sheen: 0.6, sheenColor: new THREE.Color(0xd8a0b0) });
  for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 8 + ring * 2; i++) {
    const a = i / (8 + ring * 2) * Math.PI * 2 + ring * 0.3, len = 4.5 - ring * 1.1;
    const leaf = add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), leafMat));
    leaf.scale.set(len, 0.55, 1.2 - ring * 0.2);
    leaf.position.set(-138 + Math.cos(a) * len * 0.75, 9.6 + ring * 1.2, -52 + Math.sin(a) * len * 0.75);
    leaf.rotation.set(0, -a, 0.35 + ring * 0.25);
    shadow(leaf);
  }

  // ------------------------------------------------------------ light
  const sun = new THREE.DirectionalLight(0xffe2c0, 1.55);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.00015; sun.shadow.normalBias = 0.02; sun.shadow.radius = 2.5;
  const sc = sun.shadow.camera; sc.left = -62; sc.right = 62; sc.top = 62; sc.bottom = -62; sc.near = 1; sc.far = 700;
  scene.add(sun, sun.target);
  W.sun = sun;
  const hemi = new THREE.HemisphereLight(0xdfe7ff, 0x7a5a40, 0.16);
  scene.add(hemi);
  // focus the sharp shadow box on wherever the camera is looking, snapped to texels
  W.followShadow = (focus) => {
    const texel = (sc.right - sc.left) / sun.shadow.mapSize.x;
    const lightRot = new THREE.Matrix4().lookAt(new THREE.Vector3(), SUN_DIR.clone().negate(), new THREE.Vector3(0, 1, 0));
    const inv = lightRot.clone().invert();
    const f = focus.clone().applyMatrix4(inv);
    f.x = Math.round(f.x / texel) * texel; f.y = Math.round(f.y / texel) * texel;
    f.applyMatrix4(lightRot);
    sun.target.position.copy(f);
    sun.position.copy(f).addScaledVector(SUN_DIR, 350);
    sun.target.updateMatrixWorld();
  };
  W.followShadow(new THREE.Vector3(0, 0, 0));

  // environment for reflections: a simple copy of the room with a bright window
  W.env = buildEnvironment(renderer);
  scene.environment = W.env;
  scene.background = new THREE.Color(0x1a1714);

  W.dust = buildDust(add);
  W.animated.push(W.dust);
  W.update = (dt, t) => { for (const a of W.animated) a.update(dt, t); };
  return W;
}

// ---------------------------------------------------------------- pieces
function makePencil(seed) {
  const g = new THREE.Group(), r = TX.rng(seed + 50);
  const colors = [0xf2b51c, 0xf2b51c, 0x2d5aa8, 0xf2b51c, 0xd8342c, 0xf2b51c, 0x1f7a4d];
  const paint = new THREE.MeshPhysicalMaterial({ color: colors[seed % colors.length], roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  const len = 14 + r() * 3;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, len, 6), paint); g.add(body);
  const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.36, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0xe0b98a, roughness: 0.8 }));
  wood.position.y = len / 2 + 0.9; g.add(wood);
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.5, roughness: 0.35 }));
  lead.position.y = len / 2 + 1.95; g.add(lead);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 1.1, 20), new THREE.MeshStandardMaterial({ color: 0xc9a650, metalness: 1, roughness: 0.3 }));
  ferrule.position.y = -len / 2 - 0.55; g.add(ferrule);
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.9, 20), new THREE.MeshStandardMaterial({ color: 0xf28fa0, roughness: 0.8 }));
  eraser.position.y = -len / 2 - 1.5; g.add(eraser);
  return shadow(g);
}

function makeBook(w, h, d, color, title, sub, seed) {
  const cover = new THREE.MeshPhysicalMaterial({ map: TX.bookCover(color, title, sub, seed), roughness: 0.75, sheen: 0.3 });
  const pages = new THREE.MeshStandardMaterial({ map: TX.pageEdges(), roughness: 0.9 });
  const spine = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.2), [pages, spine, cover, cover, pages, pages]);
  return shadow(m);
}

function buildKeyboard(add, r) {
  const g = new THREE.Group();
  const caseM = new THREE.MeshPhysicalMaterial({ color: 0x3a3d42, metalness: 0.85, roughness: 0.35 });
  const kcase = new THREE.Mesh(new RoundedBoxGeometry(44, 2.2, 14, 3, 0.6), caseM); kcase.position.y = 1.1; g.add(kcase);
  const rows = [
    ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'del'],
    ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'ret'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift', '↑'],
    ['ctrl', 'opt', 'cmd', ' ', 'cmd', 'fn', '←', '↓', '→'],
  ];
  const widths = { esc: 1, del: 1.5, tab: 1.5, '\\': 1, caps: 1.75, ret: 2.25, shift: 2.25, ctrl: 1.25, opt: 1.25, cmd: 1.25, ' ': 6.25, fn: 1 };
  const labels = [], keys = [];
  const U = 2.85;
  rows.forEach((row, ri) => {
    let x = 0;
    row.forEach((k) => {
      const w = widths[k] || 1;
      const accent = k === 'esc' || k === 'ret';
      const mod = k.length > 1 && !accent;
      labels.push({ t: k === ' ' ? '' : k, bg: accent ? '#e8641e' : mod ? '#8a8f97' : '#ece7dc', ink: accent ? '#fff' : mod ? '#f2f2f2' : '#3c3f44' });
      keys.push({ x: x + w * U / 2, z: ri * U, w, li: labels.length - 1 });
      x += w * U;
    });
  });
  const atlas = TX.keyAtlas(labels);
  const capGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
  const pos = [], nrm = [], uv = [], idx = [];
  const base = capGeo.attributes, bi = capGeo.index ? capGeo.index.array : Array.from({ length: base.position.count }, (_, i) => i);
  for (const k of keys) {
    const o = pos.length / 3, w = k.w * U - 0.35, d = U - 0.35, h = 1.1;
    const cu = (k.li % 10) / 10, cvv = 1 - (Math.floor(k.li / 10) + 1) / 10;
    for (let i = 0; i < base.position.count; i++) {
      const px = base.position.getX(i), py = base.position.getY(i), pz = base.position.getZ(i);
      const taper = py > 0 ? 0.86 : 1;
      pos.push(k.x - 21.6 + px * w * taper, 2.2 + 0.55 + py * h, k.z - 5.7 + pz * d * taper);
      nrm.push(base.normal.getX(i), base.normal.getY(i), base.normal.getZ(i));
      const top = base.normal.getY(i) > 0.7;
      uv.push(top ? cu + (px + 0.5) * 0.1 : cu + 0.01, top ? cvv + (0.5 - pz) * 0.1 : cvv + 0.01);
    }
    for (const t of bi) idx.push(o + t);
  }
  const kg = new THREE.BufferGeometry();
  kg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  kg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  kg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  kg.setIndex(idx);
  const caps = new THREE.Mesh(kg, new THREE.MeshPhysicalMaterial({ map: atlas, roughness: 0.55, sheen: 0.2 }));
  g.add(caps);
  g.position.set(22, 0, -51); g.rotation.y = 0.02;
  shadow(g);
  add(g);
}

function buildSteam(add, origin) {
  const cv = TX.canvas(128, 128), c = cv.getContext('2d');
  const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
  const t = TX.canvasTexture(cv);
  const puffs = [];
  for (let i = 0; i < 16; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    s.userData.noAO = true; s.userData.age = i / 16 * 3.2; s.userData.seed = Math.random() * 10;
    add(s); puffs.push(s);
  }
  return {
    update(dt, time) {
      for (const s of puffs) {
        const u = s.userData; u.age += dt;
        if (u.age > 3.2) { u.age -= 3.2; u.seed = Math.random() * 10; }
        const a = u.age / 3.2;
        s.position.set(origin.x + Math.sin(time * 0.7 + u.seed) * (0.6 + a * 2.5), origin.y + a * 16, origin.z + Math.cos(time * 0.5 + u.seed * 2) * (0.6 + a * 2));
        s.scale.setScalar(2 + a * 7);
        s.material.opacity = Math.sin(a * Math.PI) * 0.16;
        s.material.rotation = u.seed + a;
      }
    },
  };
}

function buildDust(add) {
  const n = 900, pos = new Float32Array(n * 3), seed = new Float32Array(n), r = TX.rng(77);
  for (let i = 0; i < n; i++) { pos[3 * i] = -150 + r() * 300; pos[3 * i + 1] = 1 + r() * 70; pos[3 * i + 2] = -60 + r() * 120; seed[i] = r() * 100; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 600 } },
    vertexShader: /* glsl */`
      attribute float seed; uniform float uTime; uniform float uScale; varying float vA;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.11 + seed) * 3.0 + uTime * 0.6;
        p.y += sin(uTime * 0.17 + seed * 1.7) * 2.0;
        p.z += cos(uTime * 0.13 + seed * 0.7) * 3.0;
        p.x = mod(p.x + 150.0, 300.0) - 150.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(uScale * (0.05 + fract(seed) * 0.05) / -mv.z, 1.0, 26.0);
        vA = (0.35 + 0.65 * fract(seed * 3.1)) * smoothstep(1.0, 12.0, -mv.z) * (0.6 + 0.4 * sin(uTime * 0.8 + seed));
      }`,
    fragmentShader: /* glsl */`
      varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * a * vA * 0.5, 1.0); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.userData.noAO = true;
  add(pts);
  return { mat, update(dt, t) { mat.uniforms.uTime.value = t; } };
}

function buildEnvironment(renderer) {
  const env = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(600, 270, 520), new THREE.MeshBasicMaterial({ color: 0x38332d, side: THREE.BackSide }));
  room.position.set(0, 60, 80); env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 520), new THREE.MeshBasicMaterial({ color: 0x3e2c20 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -74, 80); env.add(floor);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(300, 124), new THREE.MeshBasicMaterial({ color: 0x8a6440 }));
  desk.rotation.x = -Math.PI / 2; desk.position.y = -1; env.add(desk);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ color: new THREE.Color(4.2, 4.0, 3.6) }));
  win.position.set((WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2, WALL_Z - 3); env.add(win);
  for (const x of [-76, -4, 68]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(3.2, WIN.y1 - WIN.y0), new THREE.MeshBasicMaterial({ color: 0xbbb6ad })); b.position.set(x, (WIN.y0 + WIN.y1) / 2, WALL_Z - 2.5); env.add(b); }
  const ceilLight = new THREE.Mesh(new THREE.PlaneGeometry(90, 26), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.1, 2.9) }));
  ceilLight.rotation.x = Math.PI / 2; ceilLight.position.set(0, 194, 60); env.add(ceilLight);
  const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 10, 6) }));
  lampGlow.position.set(115, 36, -15); env.add(lampGlow);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.02, 0.5, 2000);
  pm.dispose();
  return rt.texture;
}

// live timing on the monitor
export function drawScreen(W, rows, lapInfo) {
  const c = W.screen.cv.getContext('2d'), w = 1024, h = 576;
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0d1424'); g.addColorStop(1, '#1b2a48');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ff6a10'; c.fillRect(0, 0, w, 64);
  c.fillStyle = '#fff'; c.font = '900 40px "Archivo", Arial Black, sans-serif'; c.textBaseline = 'middle'; c.fillText('DESK GP · LIVE TIMING', 28, 34);
  c.font = '600 28px "JetBrains Mono", monospace'; c.fillText(lapInfo, w - 300, 34);
  rows.forEach((row, i) => {
    const y = 120 + i * 96;
    c.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'; c.fillRect(20, y - 40, w - 40, 84);
    c.fillStyle = row.color; c.fillRect(20, y - 40, 12, 84);
    c.fillStyle = '#fff'; c.font = '900 48px "Archivo", Arial Black, sans-serif'; c.fillText(String(i + 1), 56, y);
    c.font = '700 40px "Archivo", Arial, sans-serif'; c.fillText(row.name, 130, y);
    c.font = '600 34px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillText(row.gap, w - 260, y);
  });
  W.screen.tex.needsUpdate = true;
}
