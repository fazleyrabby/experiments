/* signs.js — procedural neon sign atlases (vertical blades + horizontal fascias) drawn on canvas. */
import * as THREE from 'three';

const FONT = '"PingFang HK","Hiragino Sans","Noto Sans CJK TC","Microsoft JhengHei","Heiti TC","Arial Unicode MS",sans-serif';

const NEON = [
  { c: '#ff2e88', core: '#ffe3ef' }, { c: '#27e6ff', core: '#e2fcff' },
  { c: '#ffe44d', core: '#fffbd8' }, { c: '#6dff6a', core: '#eaffe6' },
  { c: '#ff8a2e', core: '#ffe9d2' }, { c: '#b56bff', core: '#f1e5ff' },
  { c: '#ff4040', core: '#ffdcdc' },
];

export const BLADE_TEXTS = [
  '金龍海鮮酒家', '大排檔', '老友記', '茶餐廳', '燒鵝飯店', '中藥行', '牛腩麵家', '旅館',
  '當舖', '足療按摩', '珠寶金行', '潮州粥麵', '打邊爐', '糖水', '叉燒', '酒店',
];
export const FLAT_TEXTS = [
  '茶餐廳 CHA CHAAN TENG', '海鮮酒家', '24 HRS 便利店', '藥房 PHARMACY', '金鋪 GOLD', 'KARAOKE 卡拉OK',
  '麵家 NOODLES', '大排檔', 'BAR 酒吧', '點心 DIM SUM', '中藥行', '幸運 LUCKY',
  '燒味 BBQ', '糖水 DESSERT', '電器 ELECTRONICS', '洗衣 LAUNDRY',
];

function neonText(ctx, txt, x, y, size, col) {
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.shadowColor = col.c;
  ctx.shadowBlur = size * 0.3;
  ctx.lineWidth = size * 0.09;
  ctx.strokeStyle = col.c;
  ctx.strokeText(txt, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = col.core;
  ctx.fillText(txt, x, y);
  ctx.restore();
}

function panel(ctx, w, h, kind, col, col2) {
  const pad = 12;
  ctx.beginPath();
  ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 26);
  if (kind === 1) {
    ctx.fillStyle = col.c;
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#16040e');
    g.addColorStop(1, '#0a0614');
    ctx.fillStyle = g;
  }
  ctx.fill();
  ctx.save();
  ctx.lineWidth = 9;
  ctx.strokeStyle = kind === 1 ? '#fff4e0' : col2.c;
  ctx.shadowColor = kind === 1 ? '#ffffff' : col2.c;
  ctx.shadowBlur = 16;
  ctx.stroke();
  ctx.restore();
}

function drawBlade(ctx, i) {
  const col = NEON[i % NEON.length];
  const col2 = NEON[(i * 3 + 2) % NEON.length];
  const kind = i % 3;
  panel(ctx, 256, 1024, kind, col, col2);
  const chars = [...BLADE_TEXTS[i]];
  const n = chars.length;
  const size = Math.min(180, (1024 - 150) / n);
  for (let k = 0; k < n; k++) {
    const y = 75 + ((1024 - 150) * (k + 0.5)) / n;
    if (kind === 1) {
      ctx.font = `900 ${size}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2a0610';
      ctx.fillText(chars[k], 128, y);
    } else {
      neonText(ctx, chars[k], 128, y, size, kind === 0 ? col : col2);
    }
  }
}

function drawFlat(ctx, i) {
  const col = NEON[(i * 5 + 1) % NEON.length];
  const col2 = NEON[(i * 2 + 4) % NEON.length];
  const kind = i % 3;
  panel(ctx, 1024, 256, kind, col, col2);
  const txt = FLAT_TEXTS[i];
  let size = 130;
  ctx.font = `800 ${size}px ${FONT}`;
  const wMax = 1024 - 120;
  const m = ctx.measureText(txt).width;
  if (m > wMax) size = Math.floor((size * wMax) / m);
  if (kind === 1) {
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a0610';
    ctx.fillText(txt, 512, 132);
  } else {
    neonText(ctx, txt, 512, 132, size, kind === 0 ? col : col2);
  }
}

function makeAtlas(cols, rows, cw, ch, count, drawFn) {
  const c = document.createElement('canvas');
  c.width = cols * cw;
  c.height = rows * ch;
  const ctx = c.getContext('2d');
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.translate((i % cols) * cw, Math.floor(i / cols) * ch);
    ctx.beginPath();
    ctx.rect(0, 0, cw, ch);
    ctx.clip();
    drawFn(ctx, i);
    ctx.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export function createSignAtlases() {
  return {
    blade: { tex: makeAtlas(8, 2, 256, 1024, 16, drawBlade), cols: 8, rows: 2 },
    flat: { tex: makeAtlas(2, 8, 1024, 256, 16, drawFlat), cols: 2, rows: 8 },
  };
}

/** UV rect (u0, v0, du, dv) of atlas cell i — canvas row 0 is the top, so v is flipped. */
export function cellRect(i, cols, rows) {
  const c = i % cols;
  const r = Math.floor(i / cols);
  return [c / cols, 1 - (r + 1) / rows, 1 / cols, 1 / rows];
}
