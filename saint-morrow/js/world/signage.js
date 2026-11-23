import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from './geometry.js';

const SHOP_NAMES = [
  'Harrow & Sons · Ironmongers', 'Blackwater Oyster Rooms', 'Morrow Apothecary', 'Vesper Tailoring Co.',
  'Ashgrove Books & Maps', 'Greaves Clock Repair', 'The Lantern Tavern', 'Wren & Daughter · Hatters',
  'Marlowe Pawnbrokers', 'Corvin Fine Tobacco', 'Saltmarsh Chandlery', 'Thorne Photographic',
  'Pell Street Bakery', 'Kestrel Shoe Repair', 'Hollis Typewriters', 'The Drowned Bell',
];
// What each shop above sells, which selects its interior (see materials/interiors.js KIND).
const SHOP_KINDS = [5, 1, 1, 3, 7, 2, 1, 3, 5, 1, 5, 6, 4, 3, 5, 1];
const POSTERS = [
  { head: 'CIRCUS', title: 'NOCTURNE', foot: 'ONE NIGHT ONLY', paper: '#c9b184', ink: '#7a1712', accent: '#16222e' },
  { head: 'MISSING', title: 'HAVE YOU\nSEEN HER', foot: 'REWARD · ASK AT THE PIER', paper: '#ded5bd', ink: '#1a1815', accent: '#51483b' },
  { head: 'THE GRAND', title: 'MARIONETTE', foot: 'PALACE THEATRE', paper: '#20303a', ink: '#e4c47c', accent: '#8e2b1f' },
  { head: 'HARBOUR', title: 'NIGHT\nFERRY', foot: 'DEPARTS BLACKWATER 11:40', paper: '#b9c0ae', ink: '#14303d', accent: '#a5482a' },
  { head: 'CURFEW', title: 'AFTER\nMIDNIGHT', foot: 'BY ORDER OF THE WARD', paper: '#d4c6a2', ink: '#201d19', accent: '#7c1b16' },
  { head: 'BOXING', title: 'FRIDAY\nAT DOYLE\'S', foot: 'DOORS AT EIGHT', paper: '#b23a24', ink: '#f0dfb8', accent: '#1b1411' },
  { head: 'SEANCE', title: 'MADAME\nORLOVA', foot: 'THE DEAD WILL ANSWER', paper: '#2b2133', ink: '#d9c8e8', accent: '#b98a3c' },
  { head: 'TONIC', title: 'DR. PELL\'S\nELIXIR', foot: 'FOR NERVES & DAMP', paper: '#d8c493', ink: '#25402f', accent: '#8a3b1d' },
];

function drawFascia() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 2048;
  const context = canvas.getContext('2d');
  const random = seededRandom(2281);
  const boards = ['#14231f', '#1b1716', '#23161a', '#141c28', '#1d1b12', '#101816'];
  SHOP_NAMES.forEach((name, index) => {
    const y = index * 128;
    context.fillStyle = boards[index % boards.length];
    context.fillRect(0, y, 2048, 128);
    context.strokeStyle = 'rgba(205, 165, 92, 0.72)';
    context.lineWidth = 3;
    context.strokeRect(10, y + 10, 2028, 108);
    context.strokeStyle = 'rgba(205, 165, 92, 0.3)';
    context.lineWidth = 1;
    context.strokeRect(17, y + 17, 2014, 94);
    context.font = 'italic 700 70px Georgia, "Times New Roman", serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'rgba(0, 0, 0, 0.75)';
    context.fillText(name, 1027, y + 69);
    const gold = context.createLinearGradient(0, y + 26, 0, y + 102);
    gold.addColorStop(0, '#f2d58f');
    gold.addColorStop(0.5, '#b98a3e');
    gold.addColorStop(1, '#e5c278');
    context.fillStyle = gold;
    context.fillText(name, 1024, y + 66);
    for (let i = 0; i < 90; i++) {
      context.fillStyle = `rgba(${random() > 0.5 ? '10,10,10' : '120,105,85'}, ${random() * 0.4})`;
      context.fillRect(random() * 2048, y + random() * 128, 2 + random() * 22, 1 + random() * 3);
    }
  });
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function drawPosters() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  const random = seededRandom(5519);
  POSTERS.forEach((poster, index) => {
    const x = (index % 4) * 256;
    const y = Math.floor(index / 4) * 512;
    context.save();
    context.beginPath();
    context.moveTo(x + 6, y + 8);
    const jag = (a, b) => a + (random() - 0.5) * b;
    for (let i = 1; i <= 8; i++) context.lineTo(x + (i / 8) * 244 + 6, jag(y + 7, 7));
    for (let i = 1; i <= 16; i++) context.lineTo(jag(x + 249, 7), y + (i / 16) * 496 + 8);
    for (let i = 7; i >= 0; i--) context.lineTo(x + (i / 8) * 244 + 6, jag(y + 503, 18));
    for (let i = 15; i >= 0; i--) context.lineTo(jag(x + 7, 7), y + (i / 16) * 496 + 8);
    context.closePath();
    context.clip();
    context.fillStyle = poster.paper;
    context.fillRect(x, y, 256, 512);
    context.fillStyle = poster.accent;
    context.fillRect(x + 18, y + 104, 220, 5);
    context.fillRect(x + 18, y + 410, 220, 3);
    context.beginPath();
    context.arc(x + 128, y + 268, 72, 0, Math.PI * 2);
    context.globalAlpha = 0.28;
    context.fill();
    context.globalAlpha = 1;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = poster.ink;
    context.font = '700 42px Georgia, "Times New Roman", serif';
    context.fillText(poster.head, x + 128, y + 62, 224);
    context.font = '700 37px Georgia, "Times New Roman", serif';
    const lines = poster.title.split('\n');
    lines.forEach((line, i) => context.fillText(line, x + 128, y + 268 + (i - (lines.length - 1) / 2) * 46, 226));
    context.font = '700 15px Georgia, "Times New Roman", serif';
    context.fillText(poster.foot, x + 128, y + 448, 226);

    for (let i = 0; i < 180; i++) {
      context.fillStyle = `rgba(${random() > 0.6 ? '238,226,196' : '22,18,14'}, ${random() * 0.24})`;
      context.fillRect(x + random() * 256, y + random() * 512, 1 + random() * 18, 1 + random() * 2);
    }
    const stain = context.createLinearGradient(x, y, x, y + 512);
    stain.addColorStop(0, 'rgba(30, 24, 16, 0.04)');
    stain.addColorStop(1, 'rgba(25, 18, 10, 0.5)');
    context.fillStyle = stain;
    context.fillRect(x, y, 256, 512);
    context.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) {
      const tearX = x + random() * 256;
      const tearY = y + 330 + random() * 180;
      context.beginPath();
      context.moveTo(tearX, tearY);
      for (let k = 0; k < 7; k++) context.lineTo(tearX + (random() - 0.5) * 64, tearY + (random() - 0.2) * 58);
      context.closePath();
      context.fill();
    }
    context.restore();
  });
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}

function atlasPlane(width, height, u0, v0, u1, v1) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const { uv } = geometry.attributes;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return geometry;
}

export class Signage {
  constructor() {
    this.fascia = [];
    this.posters = [];
    this.nextFascia = 0;
    this.nextPoster = 0;
  }

  /** The interior kind of the shop whose fascia will be added next. */
  peekKind() {
    return SHOP_KINDS[this.nextFascia % SHOP_KINDS.length];
  }

  addFascia(wall, width, y, z) {
    const row = this.nextFascia++ % SHOP_NAMES.length;
    const geometry = atlasPlane(width, width / 16 < 0.62 ? 0.5 : 0.56, 0, 1 - (row + 1) / 16, 1, 1 - row / 16);
    geometry.translate(0, y, z);
    geometry.applyMatrix4(wall);
    this.fascia.push(geometry);
  }

  addPoster(wall, x, y, z, tilt) {
    const index = this.nextPoster++ % POSTERS.length;
    const u = (index % 4) / 4;
    const row = Math.floor(index / 4);
    const geometry = atlasPlane(0.62, 1.2, u, 0.5 - row * 0.5, u + 0.25, 1 - row * 0.5);
    geometry.rotateZ(tilt);
    geometry.translate(x, y, z);
    geometry.applyMatrix4(wall);
    this.posters.push(geometry);
  }

  build(scene) {
    if (this.fascia.length) {
      const material = new THREE.MeshStandardMaterial({ map: drawFascia(), roughness: 0.42, metalness: 0.25 });
      const mesh = new THREE.Mesh(mergeGeometries(this.fascia, false), material);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    if (this.posters.length) {
      const material = new THREE.MeshStandardMaterial({ map: drawPosters(), roughness: 0.56, alphaTest: 0.5, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(mergeGeometries(this.posters, false), material);
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
  }
}
