/* tram.js — a Hong Kong double-decker tram built from its real plan shape:
   rounded-end hull lofted around a perimeter, full-body ad wrap, inset glass with a lit teak interior,
   seated passengers, trucks, headlamps, destination blinds and a trolley pole on the wire. */
import * as THREE from 'three';
import { glowTexture, Mesher, col, mulberry32 } from './util.js';
import { WIRE_Y } from './world.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const TRAM = { LEN: 11.6, WID: 2.36 };
const LEN = TRAM.LEN, WID = TRAM.WID, R = 0.55;
const A = LEN / 2, B = WID / 2;
const Y = { skirt0: 0.30, dado0: 0.52, win0: 1.30, win1: 2.20, up0: 2.78, up1: 3.56, head1: 3.86 };
const FONT = '"PingFang HK","Hiragino Sans","Noto Sans CJK TC","Microsoft JhengHei","Heiti TC",sans-serif';
const LATIN = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const glow = glowTexture(128);

/* Blender detail layer (tools/blender_tram.py): gaskets, sashes, doors, bumper, hoods, roof gear, trucks, tubes */
const DETAIL_MATS = {
  tram_rubber: new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.6 }),
  tram_chrome: new THREE.MeshStandardMaterial({ color: 0xd0d3d8, roughness: 0.15, metalness: 1.0, envMapIntensity: 1.4 }),
  tram_dark: new THREE.MeshStandardMaterial({ color: 0x16191d, roughness: 0.5, metalness: 0.3 }),
  tram_steel: new THREE.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.4, metalness: 0.8 }),
  tram_amber: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.6, 0.05) }),
  tram_grille: new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.6, metalness: 0.5 }),
  tram_wood: new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.8 }),
  tram_tube: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.45, 2.1) }),
};
const detailPromise = new GLTFLoader().loadAsync('./assets/tram_detail.glb').then((g) => {
  g.scene.traverse((o) => { if (o.isMesh) o.material = DETAIL_MATS[(o.material.name || '').replace(/\.\d+$/, '')] || DETAIL_MATS.tram_dark; });
  return g.scene;
});

/* ───────────── perimeter of the rounded-rectangle plan ─────────────
   Traversed so that s always increases to the right of someone standing outside looking at the tram. */
function makePerimeter(a, b, r) {
  const segs = [];
  const line = (x0, z0, x1, z1) => segs.push({ t: 'L', x0, z0, x1, z1, len: Math.hypot(x1 - x0, z1 - z0) });
  const arc = (cx, cz, a0, a1) => segs.push({ t: 'A', cx, cz, a0, a1, len: Math.abs(a1 - a0) * r });
  line(a, 0, a, -(b - r));
  arc(a - r, -(b - r), 0, -Math.PI / 2);
  line(a - r, -b, -(a - r), -b);
  arc(-(a - r), -(b - r), -Math.PI / 2, -Math.PI);
  line(-a, -(b - r), -a, b - r);
  arc(-(a - r), b - r, -Math.PI, -1.5 * Math.PI);
  line(-(a - r), b, a - r, b);
  arc(a - r, b - r, -1.5 * Math.PI, -2 * Math.PI);
  line(a, b - r, a, 0);
  let acc = 0;
  for (const g of segs) { g.s0 = acc; acc += g.len; }
  const P = { segs, total: acc, r };
  P.at = (s) => {
    s = Math.min(Math.max(s, 0), acc);
    for (const g of segs) {
      if (s <= g.s0 + g.len + 1e-9) {
        const k = g.len ? (s - g.s0) / g.len : 0;
        if (g.t === 'L') {
          const tx = (g.x1 - g.x0) / g.len, tz = (g.z1 - g.z0) / g.len;
          return { x: g.x0 + (g.x1 - g.x0) * k, z: g.z0 + (g.z1 - g.z0) * k, nx: -tz, nz: tx };
        }
        const th = g.a0 + (g.a1 - g.a0) * k;
        return { x: g.cx + r * Math.cos(th), z: g.cz + r * Math.sin(th), nx: Math.cos(th), nz: Math.sin(th) };
      }
    }
    return null;
  };
  P.samples = (s0, s1) => {
    const out = [s0, s1];
    for (const g of segs) {
      const e = g.s0 + g.len;
      if (g.t === 'A') for (let i = 1; i < 12; i++) { const s = g.s0 + (g.len * i) / 12; if (s > s0 && s < s1) out.push(s); }
      if (e > s0 && e < s1) out.push(e);
      if (g.s0 > s0 && g.s0 < s1) out.push(g.s0);
    }
    return [...new Set(out.map((v) => +v.toFixed(5)))].sort((p, q) => p - q);
  };
  const S1 = segs[2].s0, S3 = segs[6].s0;
  P.sx = (side, x) => (side < 0 ? S1 + (a - r - x) : S3 + (x + a - r));
  P.sideRange = (side) => (side < 0 ? [segs[2].s0, segs[2].s0 + segs[2].len] : [segs[6].s0, segs[6].s0 + segs[6].len]);
  P.endCentre = { front: 0, back: segs[4].s0 + segs[4].len / 2 };
  return P;
}
const PER = makePerimeter(A, B, R);

/* ───────────── geometry builder for lofted bands ───────────── */
class Loft {
  constructor() { this.p = []; this.n = []; this.uv = []; }
  tri(a, b, c) { for (const v of [a, b, c]) { this.p.push(v.x, v.y, v.z); this.n.push(v.nx, v.ny, v.nz); this.uv.push(v.u, v.v); } }
  /** vertical band between y0,y1 over perimeter range [s0,s1], inset inward; inward=true faces the inside */
  band(s0, s1, y0, y1, inset = 0, inward = false) {
    const ss = PER.samples(s0, s1);
    const sgn = inward ? -1 : 1;
    for (let i = 0; i < ss.length - 1; i++) {
      const a = PER.at(ss[i]), b = PER.at(ss[i + 1]);
      const v = (p, s, y) => ({ x: p.x - p.nx * inset, y, z: p.z - p.nz * inset, nx: p.nx * sgn, ny: 0, nz: p.nz * sgn, u: s / PER.total, v: y / Y.head1 });
      const a0 = v(a, ss[i], y0), b0 = v(b, ss[i + 1], y0), b1 = v(b, ss[i + 1], y1), a1 = v(a, ss[i], y1);
      if (inward) { this.tri(a0, b1, b0); this.tri(a0, a1, b1); } else { this.tri(a0, b0, b1); this.tri(a0, b1, a1); }
    }
    return this;
  }
  /** loft through rings {inset, y} around the whole perimeter, then cap with a fan */
  roof(rings, capY) {
    const ss = PER.samples(0, PER.total);
    for (let r = 0; r < rings.length - 1; r++) {
      const r0 = rings[r], r1 = rings[r + 1];
      const dy = r1.y - r0.y, di = r1.inset - r0.inset;
      const l = Math.hypot(dy, di) || 1;
      for (let i = 0; i < ss.length - 1; i++) {
        const pa = PER.at(ss[i]), pb = PER.at(ss[i + 1]);
        const v = (p, ring) => ({
          x: p.x - p.nx * ring.inset, y: ring.y, z: p.z - p.nz * ring.inset,
          nx: (p.nx * dy) / l, ny: di / l, nz: (p.nz * dy) / l, u: 0, v: 0,
        });
        const a0 = v(pa, r0), b0 = v(pb, r0), b1 = v(pb, r1), a1 = v(pa, r1);
        this.tri(a0, b0, b1); this.tri(a0, b1, a1);
      }
    }
    const last = rings[rings.length - 1];
    const c = { x: 0, y: capY, z: 0, nx: 0, ny: 1, nz: 0, u: 0, v: 0 };
    for (let i = 0; i < ss.length - 1; i++) {
      const pa = PER.at(ss[i]), pb = PER.at(ss[i + 1]);
      const v = (p) => ({ x: p.x - p.nx * last.inset, y: last.y, z: p.z - p.nz * last.inset, nx: 0, ny: 1, nz: 0, u: 0, v: 0 });
      this.tri(v(pa), v(pb), c);
    }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    return g;
  }
}

/** flat rounded-rect fill at height y (floor faces up, ceiling faces down) */
function plateGeo(inset, y, up = true) {
  const s = new THREE.Shape();
  const a = A - inset, b = B - inset, r = Math.max(0.05, R - inset);
  s.moveTo(a, 0); s.lineTo(a, b - r); s.absarc(a - r, b - r, r, 0, Math.PI / 2);
  s.lineTo(-(a - r), b); s.absarc(-(a - r), b - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-a, -(b - r)); s.absarc(-(a - r), -(b - r), r, Math.PI, 1.5 * Math.PI);
  s.lineTo(a - r, -b); s.absarc(a - r, -(b - r), r, 1.5 * Math.PI, 2 * Math.PI);
  const g = new THREE.ShapeGeometry(s, 6);
  g.rotateX(up ? -Math.PI / 2 : Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/* ───────────── window layout ───────────── */
function pillarRanges(deck) {
  const out = [];
  const side = (sd, n, pw) => {
    const [s0, s1] = PER.sideRange(sd);
    const ww = (s1 - s0 - (n + 1) * pw) / n;
    for (let k = 0; k <= n; k++) out.push([s0 + k * (ww + pw), s0 + k * (ww + pw) + pw]);
  };
  if (deck === 'upper') { side(-1, 9, 0.12); side(1, 9, 0.12); }
  else { side(-1, 8, 0.15); side(1, 8, 0.15); }
  for (const c of [PER.endCentre.front, PER.endCentre.back]) out.push([c - 0.05, c + 0.05]);
  for (const g of PER.segs) if (g.t === 'A') { out.push([g.s0 - 0.03, g.s0 + 0.04]); out.push([g.s0 + g.len - 0.04, g.s0 + g.len + 0.03]); }
  out.push([PER.total - 0.05, PER.total]);
  return out.map(([a, b]) => [Math.max(0, a), Math.min(PER.total, b)]);
}
// kerb-side (local -z) doors: front exit and rear entrance
function doorRanges() {
  const front = [PER.sx(-1, A - R - 0.25), PER.sx(-1, A - R - 1.25)].sort((p, q) => p - q);
  const rear = [PER.sx(-1, -(A - R) + 1.25), PER.sx(-1, -(A - R) + 0.25)].sort((p, q) => p - q);
  return [front, rear];
}
function subtract(full, holes) {
  let parts = [full];
  for (const [h0, h1] of holes) {
    const next = [];
    for (const [p0, p1] of parts) {
      if (h1 <= p0 || h0 >= p1) { next.push([p0, p1]); continue; }
      if (h0 > p0) next.push([p0, h0]);
      if (h1 < p1) next.push([h1, p1]);
    }
    parts = next;
  }
  return parts;
}

/* ───────────── textures ───────────── */
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

function wrapTexture(skin) {
  const W = 4096, H = 512;
  const [c, g] = canvas(W, H);
  const yRow = (y) => (1 - y / Y.head1) * H;
  const uCol = (s) => (s / PER.total) * W;
  const grad = g.createLinearGradient(0, yRow(Y.head1), 0, yRow(0));
  grad.addColorStop(0, skin.top); grad.addColorStop(0.55, skin.a); grad.addColorStop(1, skin.b);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = skin.header; g.fillRect(0, yRow(Y.head1), W, yRow(Y.up1) - yRow(Y.head1));
  g.fillStyle = skin.trim;
  g.fillRect(0, yRow(Y.up0) - 4, W, 8); g.fillRect(0, yRow(Y.win0) - 4, W, 8);

  for (const sd of [-1, 1]) {
    const [s0, s1] = PER.sideRange(sd);
    const x0 = uCol(s0), x1 = uCol(s1), w = x1 - x0;
    const dg = g.createLinearGradient(x0, 0, x1, 0);
    dg.addColorStop(0, skin.ad0); dg.addColorStop(1, skin.ad1);
    g.fillStyle = dg;
    g.fillRect(x0, yRow(Y.win0) + 6, w, yRow(Y.dado0) - yRow(Y.win0) - 6);
    g.fillRect(x0, yRow(Y.up0) + 6, w, yRow(Y.win1) - yRow(Y.up0) - 6);
    g.save();
    g.beginPath(); g.rect(x0, yRow(Y.win0) + 6, w, yRow(Y.dado0) - yRow(Y.win0) - 6); g.clip();
    g.globalAlpha = 0.16; g.fillStyle = '#ffffff';
    for (let k = -4; k < 24; k++) { g.beginPath(); const xx = x0 + k * 90; g.moveTo(xx, yRow(Y.dado0)); g.lineTo(xx + 60, yRow(Y.dado0)); g.lineTo(xx + 160, yRow(Y.win0)); g.lineTo(xx + 100, yRow(Y.win0)); g.fill(); }
    g.restore();
    g.textBaseline = 'middle';
    const midDado = (yRow(Y.win0) + yRow(Y.dado0)) / 2;
    const midBelt = (yRow(Y.up0) + yRow(Y.win1)) / 2;
    g.fillStyle = skin.fg; g.font = `900 64px ${FONT}`; g.textAlign = 'left';
    g.fillText(skin.zh, x0 + 70, midDado - 2);
    g.font = `italic 900 58px ${LATIN}`; g.textAlign = 'right'; g.fillStyle = skin.fg2;
    g.fillText(skin.en, x1 - 70, midDado);
    g.font = `800 40px ${FONT}`; g.textAlign = 'center'; g.fillStyle = skin.beltFg;
    g.fillText(skin.belt, (x0 + x1) / 2, midBelt + 1);
    g.font = `600 14px ${LATIN}`; g.textAlign = 'left'; g.fillStyle = 'rgba(255,255,255,0.75)';
    g.fillText('香港電車  HONG KONG TRAMWAYS', x0 + 70, yRow(Y.dado0) - 12);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    for (let k = 1; k < 9; k++) { const xx = x0 + (w * k) / 9; g.beginPath(); g.moveTo(xx, yRow(Y.win0) + 8); g.lineTo(xx, yRow(Y.dado0)); g.stroke(); }
  }
  g.font = `800 34px ${LATIN}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = skin.trim;
  const ny = yRow(0.7);
  g.fillText(skin.no, 0, ny); g.fillText(skin.no, W, ny);
  g.fillText(skin.no, uCol(PER.endCentre.back), ny);
  for (const cx of [0, W, uCol(PER.endCentre.back)]) g.fillRect(cx - 120, yRow(1.2), 240, 4);
  return tex(c);
}

function blindTexture(zh, en) {
  const [c, g] = canvas(512, 128);
  g.fillStyle = '#080503'; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#ffb23a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 56px ${FONT}`; g.fillText(zh, 256, 46);
  g.font = `700 30px ${LATIN}`; g.fillText(en, 256, 100);
  const img = g.getImageData(0, 0, 512, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 512; x++) {
    if (x % 4 === 3 || y % 4 === 3) { const i = (y * 512 + x) * 4; img.data[i] *= 0.25; img.data[i + 1] *= 0.25; img.data[i + 2] *= 0.25; }
  }
  g.putImageData(img, 0, 0);
  return tex(c);
}

const SKINS = {
  hero: {
    top: '#2a1b3d', a: '#3b1d5e', b: '#22103a', header: '#1d1430', trim: '#f4e6c8',
    ad0: '#ff2e88', ad1: '#7a2bd6', fg: '#fff3e0', fg2: '#ffe14d', beltFg: '#fff3e0',
    zh: '叮叮 · 一百二十年', en: 'DING DING', belt: '港島線  ·  ISLAND LINE  ·  HKD 3.3 ANYWHERE', no: '120',
    dest: ['堅尼地城', 'KENNEDY TOWN'], back: ['筲箕灣', 'SHAU KEI WAN'],
  },
  oncoming: {
    top: '#0f3a2b', a: '#14583e', b: '#0b3324', header: '#0c2a20', trim: '#efe4c4',
    ad0: '#ffd23d', ad1: '#ff9a1f', fg: '#14281e', fg2: '#8a1010', beltFg: '#ffe9a8',
    zh: '凍檸茶 少甜', en: 'ICED LEMON TEA', belt: '茶餐廳之選  ·  SINCE 1952', no: '88',
    dest: ['筲箕灣', 'SHAU KEI WAN'], back: ['堅尼地城', 'KENNEDY TOWN'],
  },
};

/* ───────────── interior: seats and passengers ───────────── */
function interior(rng) {
  const wood = new Mesher();
  const people = new Mesher();
  const phones = new Mesher();
  const teak = col(0x6b3a1c, 0.55), teakDark = col(0x4a2812, 0.5), metal = col(0xb0b4b8, 0.45);
  const shirts = [0x1c2433, 0x2c2c30, 0xe8e2d6, 0x6a1f2a, 0x22404f, 0x3b3f2a, 0xbfa58a, 0x101015, 0x5a6e8c];
  const skins = [0xe0b48f, 0xc99a74, 0xa87652, 0xf0c8a2];
  const hair = [0x0b0908, 0x1a1210, 0x2a1d16, 0x5a5550];
  const sphere = new THREE.SphereGeometry(1, 10, 8);
  const capsule = new THREE.CapsuleGeometry(1, 1, 3, 8);
  const person = (x, y, z, seated, face) => {
    const sh = col(shirts[Math.floor(rng() * shirts.length)], 0.5);
    const sk = col(skins[Math.floor(rng() * skins.length)], 0.6);
    const hr = col(hair[Math.floor(rng() * hair.length)], 0.6);
    const torsoY = seated ? y + 0.38 : y + 1.2;
    people.geo(capsule, x, torsoY, z, sh, null, [0.19, 0.17, 0.13]);
    people.geo(sphere, x + face * 0.02, torsoY + 0.42, z, sk, null, [0.1, 0.12, 0.1]);
    people.geo(sphere, x - face * 0.015, torsoY + 0.47, z, hr, null, [0.105, 0.09, 0.105]);
    if (!seated) {
      people.box(x, y + 0.42, z - 0.08, 0.13, 0.84, 0.11, col(0x15171c, 0.5));
      people.box(x, y + 0.42, z + 0.08, 0.13, 0.84, 0.11, col(0x15171c, 0.5));
    } else {
      people.box(x + face * 0.22, y + 0.08, z, 0.38, 0.13, 0.3, col(0x15171c, 0.5));
    }
    if (rng() < 0.55) phones.box(x + face * 0.2, torsoY + 0.15, z, 0.02, 0.12, 0.07, new THREE.Color(1.6, 1.8, 2.2), [0, 0, face * 0.5]);
  };
  const yU = 2.3;
  for (let x = -A + 1.1; x < A - 0.9; x += 0.82) {
    for (const zc of [-0.62, 0.62]) {
      wood.box(x, yU + 0.42, zc, 0.42, 0.06, 0.88, teak);
      wood.box(x - 0.2, yU + 0.7, zc, 0.05, 0.5, 0.88, teakDark);
      wood.box(x - 0.2, yU + 0.96, zc, 0.06, 0.04, 0.9, metal);
      if (rng() < 0.55) person(x + 0.02, yU + 0.42, zc + (rng() - 0.5) * 0.3, true, 1);
    }
  }
  const yL = 0.55;
  for (const sd of [-1, 1]) {
    wood.box(-0.4, yL + 0.42, sd * 0.86, 6.8, 0.06, 0.42, teak);
    wood.box(-0.4, yL + 0.7, sd * 1.05, 6.8, 0.5, 0.05, teakDark);
    for (let x = -3.6; x < 2.8; x += 0.62) if (rng() < 0.45) person(x, yL + 0.42, sd * 0.84, true, -sd);
  }
  for (const zz of [-0.35, 0.35]) wood.box(0, 2.05, zz, LEN - 1.4, 0.03, 0.03, metal);
  for (let i = 0; i < 4; i++) person(-A + 1.2 + rng() * 1.4 + (i > 1 ? LEN - 3.6 : 0), yL, (rng() - 0.5) * 0.6, false, 1);
  for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) wood.box(sx * (A - 1.15), yL + 0.28 + k * 0.25, -0.5 + k * 0.17, 0.55, 0.06, 0.25, teakDark);
  return { wood: wood.build(), people: people.build(), phones: phones.build() };
}

/* ───────────── main factory ───────────── */
export function createTram(kind = 'hero') {
  const skin = SKINS[kind];
  const rng = mulberry32(kind === 'hero' ? 120 : 88);
  const group = new THREE.Group();

  const wrapTex = wrapTexture(skin);
  const paint = new THREE.MeshPhysicalMaterial({
    map: wrapTex, emissiveMap: wrapTex, emissive: new THREE.Color(0.09, 0.09, 0.09),
    roughness: 0.42, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 0.9,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15181d, roughness: 0.55, metalness: 0.3 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.35, metalness: 0.4 });
  const roofMat = new THREE.MeshStandardMaterial({ color: kind === 'hero' ? 0x2b2f38 : 0x26332c, roughness: 0.6, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x1b2632, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.3, depthWrite: false,
    envMapIntensity: 1.6, side: THREE.DoubleSide,
  });
  const lining = new THREE.MeshBasicMaterial({ color: col(0x8a5a32, 0.5) });
  const cream = new THREE.MeshBasicMaterial({ color: col(0xf2e6c8, 0.3) });
  const floorMat = new THREE.MeshBasicMaterial({ color: col(0x3a2a20, 0.4) });

  /* hull */
  const doors = doorRanges();
  const paintL = new Loft();
  for (const [a, b] of subtract([0, PER.total], doors)) paintL.band(a, b, Y.dado0, Y.win0);
  paintL.band(0, PER.total, Y.win1, Y.up0);
  paintL.band(0, PER.total, Y.up1, Y.head1);
  for (const [a, b] of pillarRanges('lower')) paintL.band(a, b, Y.win0, Y.win1);
  for (const [a, b] of pillarRanges('upper')) paintL.band(a, b, Y.up0, Y.up1);
  for (const [a, b] of doors) { paintL.band(a, a + 0.07, Y.dado0, Y.win1); paintL.band(b - 0.07, b, Y.dado0, Y.win1); }
  group.add(new THREE.Mesh(paintL.build(), paint));

  const trimL = new Loft();
  trimL.band(0, PER.total, Y.win0 - 0.03, Y.win0 + 0.02, -0.018);
  trimL.band(0, PER.total, Y.up0 - 0.03, Y.up0 + 0.02, -0.018);
  trimL.band(0, PER.total, Y.head1 - 0.02, Y.head1 + 0.03, -0.035);
  group.add(new THREE.Mesh(trimL.build(), trim));

  const darkL = new Loft();
  darkL.band(0, PER.total, Y.skirt0, Y.dado0, 0.05);
  darkL.band(0, PER.total, 0.46, 0.58, -0.035);
  group.add(new THREE.Mesh(darkL.build(), dark));

  const roof = new Loft().roof([
    { inset: 0, y: Y.head1 + 0.03 }, { inset: 0.05, y: Y.head1 + 0.12 }, { inset: 0.2, y: Y.head1 + 0.22 },
    { inset: 0.42, y: Y.head1 + 0.28 },
  ], Y.head1 + 0.3);
  group.add(new THREE.Mesh(roof.build(), roofMat));

  /* glass */
  const glassL = new Loft();
  glassL.band(0, PER.total, Y.win0, Y.win1, 0.035);
  glassL.band(0, PER.total, Y.up0, Y.up1, 0.035);
  for (const [a, b] of doors) glassL.band(a + 0.07, b - 0.07, Y.dado0 + 0.03, Y.win0, 0.05);
  const glassMesh = new THREE.Mesh(glassL.build(), glass);
  glassMesh.renderOrder = 2;
  group.add(glassMesh);

  /* interior */
  const liner = new Loft();
  for (const [a, b] of subtract([0, PER.total], doors)) liner.band(a, b, Y.dado0, Y.win0, 0.07, true);
  liner.band(0, PER.total, Y.win1, Y.up0, 0.07, true);
  liner.band(0, PER.total, Y.up1, Y.head1, 0.07, true);
  group.add(new THREE.Mesh(liner.build(), lining));
  group.add(new THREE.Mesh(plateGeo(0.07, 0.55, true), floorMat));
  group.add(new THREE.Mesh(plateGeo(0.07, 2.3, true), floorMat));
  group.add(new THREE.Mesh(plateGeo(0.07, 2.18, false), cream));
  group.add(new THREE.Mesh(plateGeo(0.07, Y.head1 - 0.02, false), cream));
  detailPromise.then((d) => group.add(d.clone(true))).catch((e) => console.error('tram detail', e));
  const inside = interior(rng);
  const vc = new THREE.MeshBasicMaterial({ vertexColors: true });
  group.add(new THREE.Mesh(inside.wood, vc));
  group.add(new THREE.Mesh(inside.people, vc));
  group.add(new THREE.Mesh(inside.phones, vc));

  /* running gear, lifeguards, roof equipment */
  const gear = new Mesher();
  const steel = col(0x2a2e33, 0.6), black = col(0x0b0c0e);
  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.1, 20);
  for (const tx of [-3.2, 3.2]) {
    gear.box(tx, 0.42, 0, 2.3, 0.22, 1.5, black);
    for (const dx of [-0.75, 0.75]) for (const z of [-0.6, 0.6]) {
      gear.geo(wheel, tx + dx, 0.34, z, steel, [Math.PI / 2, 0, 0]);
      gear.box(tx + dx, 0.34, z * 1.32, 0.22, 0.2, 0.14, black);
    }
  }
  for (const sx of [-1, 1]) gear.box(sx * (A + 0.12), 0.2, 0, 0.32, 0.05, WID - 0.5, col(0x3b2a1a, 0.6));
  gear.box(0.6, Y.head1 + 0.38, 0, 1.6, 0.16, 0.7, col(0x2e3238, 0.6));
  gear.box(-1.2, Y.head1 + 0.38, 0, 0.6, 0.18, 0.45, col(0x1e2226, 0.6));
  group.add(new THREE.Mesh(gear.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.4 })));

  /* lamps */
  const sprite = (r, g, b) => new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const headGlow = sprite(2.2, 2.0, 1.55), tailGlow = sprite(2.4, 0.25, 0.18);
  const ring = new THREE.TorusGeometry(0.13, 0.025, 8, 20); ring.rotateY(Math.PI / 2);
  const lens = new THREE.CircleGeometry(0.12, 20); lens.rotateY(Math.PI / 2);
  const headLens = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.0, 2.5) });
  const tailLens = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.15, 0.1) });
  for (const z of [-0.72, 0.72]) {
    for (const [sx, lm, gl, sc] of [[1, headLens, headGlow, 1.0], [-1, tailLens, tailGlow, 0.55]]) {
      const r = new THREE.Mesh(ring, trim); r.position.set(sx * (A + 0.01), 0.98, z); if (sx < 0) r.rotation.y = Math.PI; group.add(r);
      const l = new THREE.Mesh(lens, lm); l.position.set(sx * (A + 0.02), 0.98, z); if (sx < 0) l.rotation.y = Math.PI; group.add(l);
      const s = new THREE.Sprite(gl); s.scale.set(sc, sc, 1); s.position.set(sx * (A + 0.12), 0.98, z); group.add(s);
    }
  }
  for (const [sx, txt] of [[1, skin.dest], [-1, skin.back]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.28), new THREE.MeshBasicMaterial({ map: blindTexture(txt[0], txt[1]), color: new THREE.Color(1.9, 1.9, 1.9) }));
    m.position.set(sx * (A + 0.012), (Y.up1 + Y.head1) / 2, 0);
    m.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(m);
  }
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshBasicMaterial({
    map: glow, color: new THREE.Color(0.75, 0.68, 0.5), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(A + 6, 0.05, 0);
  group.add(pool);

  /* trolley pole */
  const base = new THREE.Vector3(-1.2, Y.head1 + 0.5, 0);
  const plen = 4.4;
  const dy = WIRE_Y - 0.12 - base.y;
  const tip = new THREE.Vector3(base.x - Math.sqrt(plen * plen - dy * dy), WIRE_Y - 0.12, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.05, plen, 8), dark);
  pole.position.copy(base).add(tip).multiplyScalar(0.5);
  pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(base).normalize());
  group.add(pole);
  const harp = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), dark);
  harp.position.copy(tip); group.add(harp);
  const rope = new THREE.BufferGeometry().setFromPoints([tip, new THREE.Vector3(-A - 0.05, 1.6, 0.4)]);
  group.add(new THREE.Line(rope, new THREE.LineBasicMaterial({ color: 0x0a0a0a })));

  const spark = new THREE.Sprite(sprite(0, 0, 0));
  spark.scale.set(1.2, 1.2, 1);
  spark.position.copy(tip).add(new THREE.Vector3(0, 0.1, 0));
  group.add(spark);
  const sparkLight = new THREE.PointLight(0x9fc4ff, 0, 16, 2);
  sparkLight.position.copy(tip).add(new THREE.Vector3(0, -0.3, 0));
  group.add(sparkLight);

  return {
    group,
    length: LEN,
    update(t, sparkRate = 1) {
      group.rotation.x = Math.sin(t * 1.7) * 0.0035;
      group.rotation.z = Math.sin(t * 2.3 + 1) * 0.0018;
      group.position.y = Math.sin(t * 6.1) * 0.005;
      const flick = Math.random() < 0.05 * sparkRate ? 1 : 0;
      const v = flick ? 2.5 + Math.random() * 4 : 0.0;
      spark.material.color.setRGB(v * 0.7, v * 0.85, v);
      sparkLight.intensity = flick ? 30 + Math.random() * 90 : 0;
    },
  };
}
