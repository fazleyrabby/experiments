// Procedural canvas textures — bark, soil, ripstop canvas, timber, kilim wool,
// wet vinyl smears and soft particle sprites. Everything is generated at runtime
// so the scene stays dependency-free (only three.js is loaded from the CDN).
import * as THREE from 'three';

let MAX_ANISO = 4;
export function setMaxAnisotropy(value) {
  MAX_ANISO = Math.max(1, value || 4);
}

const cache = new Map();
function memo(key, factory) {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function makeTexture(canvas, { repeat = [1, 1], srgb = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = MAX_ANISO;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------------------
// Tiny value-noise toolkit
// ---------------------------------------------------------------------------
function fract(x) { return x - Math.floor(x); }
function hash2(x, y) {
  return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
}
function smooth(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x, y, octaves = 4, lacunarity = 2.03, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x, y) * amp;
    norm += amp;
    x *= lacunarity;
    y *= lacunarity;
    amp *= gain;
  }
  return sum / norm;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sobel-ish height -> tangent-space normal map.
function normalFromHeight(heightCanvas, strength = 2.0) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d', { willReadFrequently: true });
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const at = (x, y) => {
    const px = ((x + w) % w);
    const py = ((y + h) % h);
    return src[(py * w + px) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      const i = (y * w + x) * 4;
      data[i] = (nx * 0.5 + 0.5) * 255;
      data[i + 1] = (ny * 0.5 + 0.5) * 255;
      data[i + 2] = (nz * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}

// ---------------------------------------------------------------------------
// Ground: damp forest floor with leaf litter, moss flecks and small stones
// ---------------------------------------------------------------------------
export function getGroundMaps() {
  return memo('groundMaps', () => {
    const size = 512;
    const color = makeCanvas(size, size);
    const height = makeCanvas(size, size);
    const rough = makeCanvas(size, size);
    const cCtx = color.getContext('2d', { willReadFrequently: true });
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const rCtx = rough.getContext('2d', { willReadFrequently: true });
    const cImg = cCtx.createImageData(size, size);
    const hImg = hCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    const rnd = mulberry32(7717);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;
        const broad = fbm(nx * 5.5, ny * 5.5, 4);
        const fine = fbm(nx * 33, ny * 33, 3);
        const grain = hash2(x * 0.73, y * 0.91);

        // Neutral-ish olive detail so vertex colours still drive the palette.
        let base = 0.62 + broad * 0.30 + fine * 0.12;
        let r = base * 0.98;
        let g = base * 1.0;
        let b = base * 0.84;

        // Damp dark patches
        if (broad < 0.34) {
          r *= 0.74; g *= 0.76; b *= 0.7;
        }
        // Dry leaf litter flecks
        if (grain > 0.965) {
          r *= 1.12; g *= 0.93; b *= 0.7;
        }
        // Tiny wet pebbles
        if (grain > 0.988) {
          r = 0.52; g = 0.55; b = 0.56;
        }

        cImg.data[i] = Math.min(255, r * 255);
        cImg.data[i + 1] = Math.min(255, g * 255);
        cImg.data[i + 2] = Math.min(255, b * 255);
        cImg.data[i + 3] = 255;

        const hv = 0.42 + broad * 0.34 + fine * 0.24;
        hImg.data[i] = hv * 255;
        hImg.data[i + 1] = hv * 255;
        hImg.data[i + 2] = hv * 255;
        hImg.data[i + 3] = 255;

        const rv = 0.66 + fine * 0.28 - broad * 0.12;
        rImg.data[i] = rv * 255;
        rImg.data[i + 1] = rv * 255;
        rImg.data[i + 2] = rv * 255;
        rImg.data[i + 3] = 255;
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    hCtx.putImageData(hImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);
    void rnd;

    return {
      map: makeTexture(color, { repeat: [11, 11], srgb: true }),
      normalMap: makeTexture(normalFromHeight(height, 2.6), { repeat: [11, 11] }),
      roughnessMap: makeTexture(rough, { repeat: [11, 11] })
    };
  });
}

// ---------------------------------------------------------------------------
// Bark: wet, deeply fissured conifer bark
// ---------------------------------------------------------------------------
export function getBarkMaps() {
  return memo('barkMaps', () => {
    const w = 256;
    const h = 256;
    const color = makeCanvas(w, h);
    const height = makeCanvas(w, h);
    const ctx = color.getContext('2d', { willReadFrequently: true });
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const rnd = mulberry32(4242);

    ctx.fillStyle = '#5c4a3a';
    ctx.fillRect(0, 0, w, h);
    hCtx.fillStyle = '#808080';
    hCtx.fillRect(0, 0, w, h);

    // Deep vertical fissures
    for (let i = 0; i < 60; i++) {
      const x = rnd() * w;
      const width = 1 + rnd() * 6;
      const shade = 25 + rnd() * 45;
      ctx.strokeStyle = `rgba(${shade},${shade * 0.78},${shade * 0.6},${0.35 + rnd() * 0.4})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      let px = x;
      let py = -10;
      while (py < h + 10) {
        const nx = px + (rnd() - 0.5) * 9;
        ctx.lineTo(nx, py);
        px = nx;
        py += 14 + rnd() * 20;
      }
      ctx.stroke();

      hCtx.strokeStyle = `rgba(${40 + rnd() * 70},${40 + rnd() * 70},${40 + rnd() * 70},0.7)`;
      hCtx.lineWidth = width;
      hCtx.beginPath();
      px = x;
      py = -10;
      while (py < h + 10) {
        const nx = px + (rnd() - 0.5) * 9;
        hCtx.lineTo(nx, py);
        px = nx;
        py += 14 + rnd() * 20;
      }
      hCtx.stroke();
    }

    // Lighter raised ridges + lichen
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w;
      ctx.strokeStyle = `rgba(${120 + rnd() * 40},${100 + rnd() * 35},${78 + rnd() * 25},0.25)`;
      ctx.lineWidth = 1 + rnd() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 8, h * 0.3, x - 8, h * 0.7, x + 4, h);
      ctx.stroke();
    }

    // Knots
    for (let i = 0; i < 4; i++) {
      const x = 20 + rnd() * (w - 40);
      const y = 20 + rnd() * (h - 40);
      const r = 5 + rnd() * 8;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, 'rgba(28,20,14,0.95)');
      g.addColorStop(0.6, 'rgba(48,35,24,0.8)');
      g.addColorStop(1, 'rgba(70,55,40,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 1.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moss speckling at the base portion
    for (let i = 0; i < 700; i++) {
      const x = rnd() * w;
      const y = h * 0.55 + rnd() * h * 0.45;
      ctx.fillStyle = `rgba(${60 + rnd() * 35},${85 + rnd() * 45},${38 + rnd() * 25},${0.12 + rnd() * 0.3})`;
      ctx.fillRect(x, y, 1 + rnd() * 3, 1 + rnd() * 3);
    }

    // Build height from luminance
    const data = ctx.getImageData(0, 0, w, h).data;
    const hImg = hCtx.createImageData(w, h);
    for (let i = 0; i < data.length; i += 4) {
      const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      const n = fbm((i / 4 % w) * 0.12, Math.floor(i / 4 / w) * 0.12, 2) * 40;
      hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = Math.min(255, lum * 0.75 + 40 + n);
      hImg.data[i + 3] = 255;
    }
    hCtx.putImageData(hImg, 0, 0);

    return {
      map: makeTexture(color, { repeat: [2, 3], srgb: true }),
      normalMap: makeTexture(normalFromHeight(height, 2.2), { repeat: [2, 3] })
    };
  });
}

// ---------------------------------------------------------------------------
// Ripstop canvas / awning fabric
// ---------------------------------------------------------------------------
export function getFabricMaps() {
  return memo('fabricMaps', () => {
    const s = 256;
    const color = makeCanvas(s, s);
    const height = makeCanvas(s, s);
    const ctx = color.getContext('2d', { willReadFrequently: true });
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const rnd = mulberry32(991);

    ctx.fillStyle = '#c9c9c4';
    ctx.fillRect(0, 0, s, s);

    // Weave noise
    const img = ctx.getImageData(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const n = (fbm(x * 0.12, y * 0.12, 3) - 0.5) * 28 + (hash2(x, y) - 0.5) * 12;
        const weave = (Math.sin(x * 1.7) + Math.sin(y * 1.7)) * 2.2;
        const v = Math.max(0, Math.min(255, 205 + n + weave));
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v * 0.98;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Ripstop grid
    ctx.strokeStyle = 'rgba(30,30,32,0.16)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= s; i += 32) {
      ctx.beginPath(); ctx.moveTo(i + 0.5, 0); ctx.lineTo(i + 0.5, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i + 0.5); ctx.lineTo(s, i + 0.5); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    for (let i = 2; i <= s; i += 32) {
      ctx.beginPath(); ctx.moveTo(i + 0.5, 0); ctx.lineTo(i + 0.5, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i + 0.5); ctx.lineTo(s, i + 0.5); ctx.stroke();
    }

    // Random seam creases
    for (let i = 0; i < 18; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      ctx.strokeStyle = `rgba(0,0,0,${0.04 + rnd() * 0.06})`;
      ctx.lineWidth = 1 + rnd() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 20, y + (rnd() - 0.5) * 12, x + 50, y + (rnd() - 0.5) * 8);
      ctx.stroke();
    }

    hCtx.drawImage(color, 0, 0);
    const hData = hCtx.getImageData(0, 0, s, s);
    for (let i = 0; i < hData.data.length; i += 4) {
      const v = 120 + (hData.data[i] - 205) * 0.7;
      hData.data[i] = hData.data[i + 1] = hData.data[i + 2] = v;
    }
    hCtx.putImageData(hData, 0, 0);

    return {
      map: makeTexture(color, { repeat: [5, 5], srgb: true }),
      normalMap: makeTexture(normalFromHeight(height, 1.0), { repeat: [5, 5] })
    };
  });
}

// ---------------------------------------------------------------------------
// Timber: weathered camp furniture / firewood
// ---------------------------------------------------------------------------
export function getWoodMap() {
  return memo('woodMap', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const rnd = mulberry32(1337);

    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, '#a97e51');
    g.addColorStop(0.5, '#8e6139');
    g.addColorStop(1, '#a87c50');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    // Grain rings
    for (let i = 0; i < 90; i++) {
      const y = rnd() * s;
      const alpha = 0.06 + rnd() * 0.16;
      ctx.strokeStyle = rnd() > 0.5
        ? `rgba(70,44,24,${alpha})`
        : `rgba(220,180,130,${alpha})`;
      ctx.lineWidth = 0.5 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= s; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 2.4 + (rnd() - 0.5) * 1.5);
      }
      ctx.stroke();
    }

    // Plank seams
    ctx.strokeStyle = 'rgba(40,24,12,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(s, s * 0.5);
    ctx.stroke();

    // Knots
    for (let i = 0; i < 3; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const r = 3 + rnd() * 4;
      ctx.strokeStyle = 'rgba(55,32,15,0.6)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    return makeTexture(c, { repeat: [2, 2], srgb: true });
  });
}

// ---------------------------------------------------------------------------
// Kilim rug pattern
// ---------------------------------------------------------------------------
export function getRugMap() {
  return memo('rugMap', () => {
    const s = 512;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });

    ctx.fillStyle = '#9c452c';
    ctx.fillRect(0, 0, s, s);

    // Woven noise
    const img = ctx.getImageData(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const n = (hash2(x * 0.5, y * 2.0) - 0.5) * 18;
        img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
        img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
        img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
      }
    }
    ctx.putImageData(img, 0, 0);

    const stripes = ['#d8c6a3', '#41483a', '#c07a3c', '#7d3a2a', '#d8c6a3'];
    // Borders
    ctx.fillStyle = '#e0cfab';
    ctx.fillRect(0, 0, s, 26);
    ctx.fillRect(0, s - 26, s, 26);
    ctx.fillRect(0, 0, 26, s);
    ctx.fillRect(s - 26, 0, 26, s);
    ctx.fillStyle = '#3d4234';
    ctx.fillRect(10, 10, s - 20, 6);
    ctx.fillRect(10, s - 16, s - 20, 6);
    ctx.fillRect(10, 10, 6, s - 20);
    ctx.fillRect(s - 16, 10, 6, s - 20);

    // Horizontal bands
    for (let i = 0; i < 5; i++) {
      const y = 42 + i * 88;
      ctx.fillStyle = stripes[i % stripes.length];
      ctx.fillRect(30, y, s - 60, 9);
      ctx.fillStyle = stripes[(i + 2) % stripes.length];
      ctx.fillRect(30, y + 14, s - 60, 4);
    }

    // Diamond motifs
    const drawDiamond = (cx, cy, r, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.fill();
    };
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cx = 82 + col * 116;
        const cy = 120 + row * 88;
        drawDiamond(cx, cy, 34, '#2f352b');
        drawDiamond(cx, cy, 25, '#d8c6a3');
        drawDiamond(cx, cy, 15, '#a34c30');
        drawDiamond(cx, cy, 6, '#3d4234');
      }
    }

    // Fringe at short ends
    ctx.strokeStyle = '#d8c6a3';
    ctx.lineWidth = 2;
    for (let x = 12; x < s; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, s - 4);
      ctx.lineTo(x, s);
      ctx.stroke();
    }

    return makeTexture(c, { repeat: [1, 1], srgb: true });
  });
}

// ---------------------------------------------------------------------------
// Vehicle paint: orange-peel clearcoat + rain streak roughness
// ---------------------------------------------------------------------------
export function getPaintMaps() {
  return memo('paintMaps', () => {
    const s = 256;
    const height = makeCanvas(s, s);
    const rough = makeCanvas(s, s);
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const rCtx = rough.getContext('2d', { willReadFrequently: true });
    const hImg = hCtx.createImageData(s, s);
    const rImg = rCtx.createImageData(s, s);
    const rnd = mulberry32(606);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const fine = fbm(x * 0.55, y * 0.55, 2);
        const hv = 128 + (fine - 0.5) * 34;
        hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = hv;
        hImg.data[i + 3] = 255;

        // Vertical run-off streaks, subtle
        const streak = Math.max(0, (valueNoise(x * 0.16, 0.4) - 0.62)) * 130;
        const rv = 80 + fine * 35 + streak;
        rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = Math.min(255, rv);
        rImg.data[i + 3] = 255;
      }
    }
    void rnd;
    hCtx.putImageData(hImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    return {
      normalMap: makeTexture(normalFromHeight(height, 0.8), { repeat: [2, 2] }),
      roughnessMap: makeTexture(rough, { repeat: [3, 3] })
    };
  });
}

// ---------------------------------------------------------------------------
// Clear vinyl: faint smears / rain runs for the roughness channel
// ---------------------------------------------------------------------------
export function getVinylRoughness() {
  return memo('vinylRoughness', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const img = ctx.createImageData(s, s);
    const rnd = mulberry32(8080);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const n = fbm(x * 0.05, y * 0.05, 3);
        const run = Math.max(0, (valueNoise(x * 0.09, y * 0.006) - 0.58)) * 150;
        const v = 26 + n * 46 + run;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, v);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // A few condensed droplets
    for (let i = 0; i < 140; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const r = 1 + rnd() * 4;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(230,230,230,0.7)');
      g.addColorStop(1, 'rgba(230,230,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return makeTexture(c, { repeat: [3, 1] });
  });
}

// ---------------------------------------------------------------------------
// Soft round sprite (rain splashes, fireflies, stars, mist, flames)
// ---------------------------------------------------------------------------
export function getSoftDotTexture() {
  return memo('softDot', () => {
    const s = 64;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

export function getMistTexture() {
  return memo('mist', () => {
    const s = 128;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.20)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // break up the perfect circle
    const img = ctx.getImageData(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const n = 0.55 + fbm(x * 0.045, y * 0.045, 3) * 0.75;
        img.data[i + 3] *= Math.min(1, n);
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

export function getFlameTexture() {
  return memo('flame', () => {
    const w = 64;
    const h = 128;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const g = ctx.createRadialGradient(w / 2, h * 0.66, 2, w / 2, h * 0.6, h * 0.52);
    g.addColorStop(0, 'rgba(255,255,230,1)');
    g.addColorStop(0.22, 'rgba(255,226,130,0.95)');
    g.addColorStop(0.52, 'rgba(255,138,36,0.62)');
    g.addColorStop(0.82, 'rgba(190,52,10,0.18)');
    g.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 2);
    ctx.bezierCurveTo(w * 0.9, h * 0.45, w * 0.86, h * 0.84, w * 0.5, h - 2);
    ctx.bezierCurveTo(w * 0.14, h * 0.84, w * 0.1, h * 0.45, w * 0.5, 2);
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

export function getSmokeTexture() {
  return memo('smoke', () => {
    const s = 128;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const img = ctx.getImageData(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const n = 0.4 + fbm(x * 0.05, y * 0.05, 3) * 0.9;
        img.data[i + 3] *= Math.min(1, n);
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

// Grayscale pine branch with dense needles (alpha-tested foliage card).
export function getPineBranchTexture() {
  return memo('pineBranch', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, s, s);
    const rnd = mulberry32(31415);

    // Main stem
    ctx.strokeStyle = 'rgba(150,150,150,0.95)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s - 4);
    ctx.bezierCurveTo(s * 0.48, s * 0.7, s * 0.53, s * 0.45, s * 0.5, 12);
    ctx.stroke();

    // Side sub-branches + needles
    for (let i = 0; i < 260; i++) {
      const t = i / 260;
      const y = s - 10 - t * (s - 24);
      const side = i % 2 ? 1 : -1;
      const maxLen = 16 + (1 - t) * 68;
      const len = 9 + Math.pow(rnd(), 0.65) * maxLen;
      const rise = 4 + rnd() * 17 + (1 - t) * 9;
      const x0 = s * 0.5 + side * (1 + rnd() * 3);
      const x1 = x0 + side * len;
      const y1 = y - rise;
      const lum = 185 + Math.floor(rnd() * 70);
      ctx.strokeStyle = `rgba(${lum},${lum},${lum},${0.8 + rnd() * 0.2})`;
      ctx.lineWidth = 0.9 + rnd() * 1.8;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Secondary needle pairs at the tip
      if (rnd() > 0.35) {
        ctx.lineWidth = 0.8 + rnd() * 1.1;
        ctx.beginPath();
        ctx.moveTo(x0 + (x1 - x0) * 0.55, y - rise * 0.55);
        ctx.lineTo(x0 + (x1 - x0) * 0.55 + side * len * 0.45, y - rise * 0.55 - 10);
        ctx.stroke();
      }
      if (rnd() > 0.5) {
        ctx.lineWidth = 0.7 + rnd() * 0.9;
        ctx.beginPath();
        ctx.moveTo(x0 + (x1 - x0) * 0.78, y - rise * 0.78);
        ctx.lineTo(x0 + (x1 - x0) * 0.78 + side * len * 0.25, y - rise * 0.78 + 8);
        ctx.stroke();
      }
    }

    // A few outward twigs with needle tufts
    for (let i = 0; i < 9; i++) {
      const t = 0.08 + rnd() * 0.7;
      const y = s - 10 - t * (s - 30);
      const side = i % 2 ? 1 : -1;
      const len = 30 + rnd() * 55;
      ctx.strokeStyle = 'rgba(185,185,185,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s * 0.5, y);
      ctx.lineTo(s * 0.5 + side * len, y - 14 - rnd() * 16);
      ctx.stroke();
      for (let n = 0; n < 14; n++) {
        const nt = rnd();
        const nx = s * 0.5 + side * len * nt;
        const ny = y - (14 + rnd() * 16) * nt;
        ctx.strokeStyle = `rgba(${170 + (rnd() * 70) | 0},${170 + (rnd() * 70) | 0},${170 + (rnd() * 70) | 0},0.9)`;
        ctx.lineWidth = 0.8 + rnd();
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx + side * (5 + rnd() * 10), ny - (7 + rnd() * 12));
        ctx.stroke();
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// Grayscale leafy spray for broadleaf canopy cards.
export function getLeafSprayTexture() {
  return memo('leafSpray', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, s, s);
    const rnd = mulberry32(2718);

    // Twigs
    ctx.strokeStyle = 'rgba(150,150,150,0.9)';
    ctx.lineWidth = 2;
    for (let b = 0; b < 5; b++) {
      const x0 = s * 0.5;
      const y0 = s - 8;
      const x1 = x0 + (rnd() - 0.5) * s * 0.55;
      const y1 = 20 + rnd() * s * 0.35;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5 + (rnd() - 0.5) * 30, (y0 + y1) * 0.5, x1, y1);
      ctx.stroke();
    }

    const leaf = (cx, cy, rx, ry, rot) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      const lum = 150 + Math.floor(rnd() * 95);
      ctx.fillStyle = `rgba(${lum},${lum},${lum},${0.85 + rnd() * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      // vein
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -ry);
      ctx.lineTo(0, ry);
      ctx.stroke();
      ctx.restore();
    };

    for (let i = 0; i < 110; i++) {
      const cx = s * 0.5 + (rnd() - 0.5) * s * 0.82;
      const cy = s * 0.5 + (rnd() - 0.5) * s * 0.82;
      const edge = Math.hypot(cx - s * 0.5, cy - s * 0.5) / (s * 0.5);
      if (edge > 0.96) continue;
      leaf(cx, cy, 4 + rnd() * 9, 9 + rnd() * 14, rnd() * Math.PI);
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

export function getWaterSheetTexture() {
  return memo('waterSheet', () => {
    const w = 128;
    const h = 256;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    const rnd = mulberry32(1919);
    for (let i = 0; i < 34; i++) {
      const x = rnd() * w;
      const alpha = 0.12 + rnd() * 0.4;
      ctx.strokeStyle = `rgba(220,242,250,${alpha})`;
      ctx.lineWidth = 0.6 + rnd() * 2.4;
      ctx.beginPath();
      let px = x;
      for (let y = -10; y <= h + 10; y += 8) {
        px += (rnd() - 0.5) * 3;
        if (y < 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
    // Foamy bright threads
    for (let i = 0; i < 10; i++) {
      const x = rnd() * w;
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + rnd() * 0.22})`;
      ctx.lineWidth = 0.8 + rnd() * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + 6, h * 0.3, x - 6, h * 0.7, x + 2, h);
      ctx.stroke();
    }

    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    return t;
  });
}

// Soft dark blob used as a fake contact shadow / ambient occlusion patch.
export function getContactShadowTexture() {
  return memo('contactShadow', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const img = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const dx = (x / s - 0.5) * 2;
        const dy = (y / s - 0.5) * 2;
        const d = Math.min(1, Math.hypot(dx, dy));
        const a = Math.pow(1 - d, 1.9) * 0.92;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
        img.data[i + 3] = a * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

// Mottled granite with lichen, used for the fire pit ring and scattered stones.
export function getStoneMaps() {
  return memo('stoneMaps', () => {
    const s = 256;
    const color = makeCanvas(s, s);
    const height = makeCanvas(s, s);
    const cCtx = color.getContext('2d', { willReadFrequently: true });
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const cImg = cCtx.createImageData(s, s);
    const hImg = hCtx.createImageData(s, s);
    const rnd = mulberry32(2024);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const nx = x / s;
        const ny = y / s;
        const grain = fbm(nx * 26, ny * 26, 3);
        const blotch = fbm(nx * 4.5, ny * 4.5, 3);
        let lum = 92 + grain * 78 + blotch * 42;
        let r = lum * 1.02;
        let g = lum * 1.0;
        let b = lum * 0.95;
        // mineral speckles
        if (hash2(x * 1.7, y * 2.3) > 0.972) { r += 42; g += 42; b += 46; }
        if (hash2(x * 2.9, y * 1.1) > 0.982) { r -= 38; g -= 38; b -= 36; }
        // lichen patches
        if (blotch > 0.63) {
          const k = (blotch - 0.63) * 2.6;
          r = r * (1 - k) + 126 * k;
          g = g * (1 - k) + 138 * k;
          b = b * (1 - k) + 96 * k;
        }
        cImg.data[i] = Math.min(255, r);
        cImg.data[i + 1] = Math.min(255, g);
        cImg.data[i + 2] = Math.min(255, b);
        cImg.data[i + 3] = 255;
        const hv = 110 + grain * 90 + blotch * 40;
        hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = Math.min(255, hv);
        hImg.data[i + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    hCtx.putImageData(hImg, 0, 0);
    void rnd;

    return {
      map: makeTexture(color, { repeat: [2, 2], srgb: true }),
      normalMap: makeTexture(normalFromHeight(height, 2.4), { repeat: [2, 2] })
    };
  });
}

// Scatter of dry fallen leaves, alpha tested, laid flat on the forest floor.
export function getLeafLitterTexture() {
  return memo('leafLitter', () => {
    const s = 256;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, s, s);
    const rnd = mulberry32(777);

    const leaf = (cx, cy, len, wid, rot, tone) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(0, -len * 0.5, 0, len * 0.5);
      g.addColorStop(0, `rgba(${tone[0]},${tone[1]},${tone[2]},0.95)`);
      g.addColorStop(1, `rgba(${tone[0] * 0.72 | 0},${tone[1] * 0.7 | 0},${tone[2] * 0.66 | 0},0.95)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.5);
      ctx.bezierCurveTo(wid, -len * 0.18, wid * 0.8, len * 0.28, 0, len * 0.5);
      ctx.bezierCurveTo(-wid * 0.8, len * 0.28, -wid, -len * 0.18, 0, -len * 0.5);
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,44,26,0.5)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.46);
      ctx.lineTo(0, len * 0.46);
      ctx.stroke();
      ctx.restore();
    };

    const tones = [
      [148, 104, 52], [122, 88, 44], [168, 132, 74], [96, 74, 40], [186, 156, 96]
    ];
    for (let i = 0; i < 22; i++) {
      leaf(
        rnd() * s,
        rnd() * s,
        26 + rnd() * 34,
        7 + rnd() * 9,
        rnd() * Math.PI * 2,
        tones[(rnd() * tones.length) | 0]
      );
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    return t;
  });
}

// Mud splatter for the lower bodywork of the rig.
export function getMudSplatterTexture() {
  return memo('mudSplat', () => {
    const w = 512;
    const h = 256;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    const rnd = mulberry32(4242);

    // Grime film climbing up from the bottom
    const grad = ctx.createLinearGradient(0, h, 0, h * 0.35);
    grad.addColorStop(0, 'rgba(74,56,36,0.85)');
    grad.addColorStop(0.45, 'rgba(92,70,44,0.45)');
    grad.addColorStop(1, 'rgba(96,74,48,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Dried spatter
    for (let i = 0; i < 620; i++) {
      const x = rnd() * w;
      const bias = Math.pow(rnd(), 1.8);
      const y = h - bias * h * 0.72;
      const r = 1 + rnd() * 6 * (1 - bias * 0.6);
      ctx.fillStyle = `rgba(${64 + rnd() * 40 | 0},${48 + rnd() * 30 | 0},${28 + rnd() * 22 | 0},${0.25 + rnd() * 0.5})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.55 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Vertical drips
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w;
      const len = 20 + rnd() * 90;
      const y = h - len;
      const g = ctx.createLinearGradient(0, y, 0, h);
      g.addColorStop(0, 'rgba(80,60,38,0)');
      g.addColorStop(1, 'rgba(70,52,32,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 1 + rnd() * 3, len);
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    return t;
  });
}

// Weathered galvanised metal with rust blooms.
export function getMetalMaps() {
  return memo('metalMaps', () => {
    const s = 256;
    const color = makeCanvas(s, s);
    const rough = makeCanvas(s, s);
    const cCtx = color.getContext('2d', { willReadFrequently: true });
    const rCtx = rough.getContext('2d', { willReadFrequently: true });
    const cImg = cCtx.createImageData(s, s);
    const rImg = rCtx.createImageData(s, s);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const nx = x / s;
        const ny = y / s;
        const brush = fbm(nx * 60, ny * 6, 2);
        const rust = fbm(nx * 5.5 + 3.1, ny * 5.5 - 1.7, 4);
        const base = 150 + brush * 44;
        let r = base * 0.98, g = base, b = base * 1.02;
        if (rust > 0.66) {
          const k = (rust - 0.66) * 3;
          r = r * (1 - k) + 138 * k;
          g = g * (1 - k) + 82 * k;
          b = b * (1 - k) + 46 * k;
        }
        cImg.data[i] = Math.min(255, r);
        cImg.data[i + 1] = Math.min(255, g);
        cImg.data[i + 2] = Math.min(255, b);
        cImg.data[i + 3] = 255;
        const rv = 70 + brush * 60 + (rust > 0.66 ? 90 : 0);
        rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = Math.min(255, rv);
        rImg.data[i + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    return {
      map: makeTexture(color, { repeat: [2, 2], srgb: true }),
      roughnessMap: makeTexture(rough, { repeat: [2, 2] })
    };
  });
}

export function getLeafTexture() {
  return memo('leaf', () => {
    const w = 64;
    const h = 128;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const grad = ctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, 'rgba(52,84,36,1)');
    grad.addColorStop(0.6, 'rgba(74,110,46,1)');
    grad.addColorStop(1, 'rgba(108,146,66,1)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.bezierCurveTo(w * 0.95, h * 0.25, w * 0.9, h * 0.7, w / 2, h);
    ctx.bezierCurveTo(w * 0.1, h * 0.7, w * 0.05, h * 0.25, w / 2, 0);
    ctx.fill();
    // central rib
    ctx.strokeStyle = 'rgba(30,50,20,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w / 2, h - 4);
    ctx.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}

// ===========================================================================
// High-detail vegetation textures (forest upgrade)
// ===========================================================================

// Elongated Voronoi plates: scaly spruce / fir bark. Tiling texture; tree UVs
// are scaled by circumference and height so plates stay the same size on
// every trunk.
export function getTreeBarkMaps(kind = 'conifer') {
  return memo('treeBark_' + kind, () => {
    const s = kind === 'conifer' ? 512 : 256;
    const color = makeCanvas(s, s);
    const height = makeCanvas(s, s);
    const rough = makeCanvas(s, s);
    const cCtx = color.getContext('2d', { willReadFrequently: true });
    const hCtx = height.getContext('2d', { willReadFrequently: true });
    const rCtx = rough.getContext('2d', { willReadFrequently: true });
    const cImg = cCtx.createImageData(s, s);
    const hImg = hCtx.createImageData(s, s);
    const rImg = rCtx.createImageData(s, s);

    const birch = kind === 'birch';
    const broad = kind === 'broad';
    // Cell grid (tileable): plates are taller than wide
    const cellsX = birch ? 5 : broad ? 9 : 11;
    const cellsY = birch ? 22 : broad ? 7 : 6;
    const rndCell = (cx, cy, k) => hash2(((cx % cellsX) + cellsX) % cellsX + k * 17.3, ((cy % cellsY) + cellsY) % cellsY + k * 3.1);

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const i = (y * s + x) * 4;
        const u = (x / s) * cellsX;
        const v = (y / s) * cellsY;
        // Domain warp so cracks meander
        const wu = u + (fbm(x / s * 6, y / s * 6, 3) - 0.5) * 0.9;
        const wv = v + (fbm(x / s * 5 + 9, y / s * 5 - 3, 3) - 0.5) * 0.6;
        const cu = Math.floor(wu), cv = Math.floor(wv);
        let d1 = 9, d2 = 9, id = 0;
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const gx = cu + ox, gy = cv + oy;
            const px = gx + rndCell(gx, gy, 1);
            const py = gy + rndCell(gx, gy, 2);
            const dx = wu - px, dy = (wv - py) * (birch ? 0.35 : 1.0);
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < d1) { d2 = d1; d1 = d; id = rndCell(gx, gy, 3); }
            else if (d < d2) d2 = d;
          }
        }
        const edge = d2 - d1; // 0 at cracks
        const fine = fbm(x * 0.09, y * 0.05, 3);
        const grain = hash2(x * 1.3, y * 0.7);
        let r, g, b, hv, rv;

        if (birch) {
          // Chalky white with dark lenticel dashes, grey blotches and scars
          const lent = edge < 0.06 ? 1 : 0;
          let lum = 0.86 + fine * 0.12 - id * 0.06;
          r = lum; g = lum * 0.985; b = lum * 0.95;
          const blotch = fbm(x / s * 4 + 2, y / s * 4, 3);
          if (blotch > 0.62) { const k = Math.min(1, (blotch - 0.62) * 4); r -= k * 0.42; g -= k * 0.42; b -= k * 0.4; }
          if (lent) { r = r * 0.25 + 0.04; g = g * 0.25 + 0.035; b = b * 0.25 + 0.03; }
          if (grain > 0.985) { r *= 0.7; g *= 0.7; b *= 0.68; }
          // Warm peel
          if (id > 0.9 && edge > 0.18) { r = 0.78; g = 0.6; b = 0.48; }
          hv = 0.6 + fine * 0.2 - lent * 0.35;
          rv = 0.55 + lent * 0.3 + fine * 0.1;
        } else {
          const crack = Math.max(0, 1 - edge / (broad ? 0.14 : 0.1));
          const plate = 0.5 + id * 0.35 + fine * 0.35;
          // Conifer: warm grey-brown plates; broadleaf: cooler grey ridged bark
          if (broad) { r = 0.36 * plate; g = 0.33 * plate; b = 0.29 * plate; }
          else { r = 0.43 * plate; g = 0.33 * plate; b = 0.25 * plate; }
          // Weathered silver on plate tops
          const silver = Math.max(0, fine - 0.55) * 1.4;
          r += silver * 0.18; g += silver * 0.18; b += silver * 0.17;
          // Cracks: deep dark
          const dark = Math.pow(crack, 1.6);
          r *= 1 - dark * 0.82; g *= 1 - dark * 0.82; b *= 1 - dark * 0.8;
          // Lichen / moss specks
          const lich = fbm(x / s * 7 + 5, y / s * 7, 3);
          if (lich > 0.64 && crack < 0.3) {
            const k = Math.min(1, (lich - 0.64) * 3.2) * 0.75;
            r = r * (1 - k) + 0.46 * k; g = g * (1 - k) + 0.5 * k; b = b * (1 - k) + 0.36 * k;
          }
          hv = (1 - dark) * (0.55 + fine * 0.35) + id * 0.1;
          rv = 0.7 + dark * 0.25;
        }

        cImg.data[i] = Math.min(255, Math.max(0, r * 255));
        cImg.data[i + 1] = Math.min(255, Math.max(0, g * 255));
        cImg.data[i + 2] = Math.min(255, Math.max(0, b * 255));
        cImg.data[i + 3] = 255;
        hImg.data[i] = hImg.data[i + 1] = hImg.data[i + 2] = Math.min(255, Math.max(0, hv * 255));
        hImg.data[i + 3] = 255;
        rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = Math.min(255, Math.max(0, rv * 255));
        rImg.data[i + 3] = 255;
      }
    }
    cCtx.putImageData(cImg, 0, 0);
    hCtx.putImageData(hImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);

    return {
      map: makeTexture(color, { srgb: true }),
      normalMap: makeTexture(normalFromHeight(height, birch ? 1.6 : 4.5)),
      roughnessMap: makeTexture(rough)
    };
  });
}

// Spruce/fir spray: a twig running up the card (v axis) with dense fine
// needles and side shoots. Near-white so per-vertex colour sets the hue.
export function getNeedleSprayTexture() {
  return memo('needleSpray', () => {
    const w = 256;
    const h = 512;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    const rnd = mulberry32(27182);
    ctx.lineCap = 'round';

    const needle = (x, y, ang, len, lum, width) => {
      ctx.strokeStyle = `rgba(${lum},${lum},${(lum * 0.94) | 0},1)`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      ctx.stroke();
    };

    // Branchlet from (x0,y0) heading `dir` (radians, screen), covered in needles
    const shoot = (x0, y0, dir, len, depth) => {
      const steps = Math.max(6, Math.floor(len / 3));
      let x = x0, y = y0, a = dir;
      ctx.strokeStyle = 'rgba(120,108,92,1)';
      ctx.lineWidth = depth === 0 ? 3.2 : 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const pts = [];
      for (let k = 0; k <= steps; k++) {
        a += (rnd() - 0.5) * 0.08;
        x += Math.cos(a) * (len / steps);
        y += Math.sin(a) * (len / steps);
        ctx.lineTo(x, y);
        pts.push([x, y, a, k / steps]);
      }
      ctx.stroke();
      // needles along the shoot, angled forward, shorter towards the tip
      pts.forEach(([px, py, pa, t]) => {
        const n = depth === 0 ? 7 : 5;
        for (let q = 0; q < n; q++) {
          const side = q % 2 ? 1 : -1;
          const ang = pa + side * (0.55 + rnd() * 0.5) - (rnd() - 0.5) * 0.25;
          const nl = (depth === 0 ? 17 : 13) * (1 - t * 0.45) * (0.7 + rnd() * 0.5);
          const lum = 150 + ((rnd() * 105) | 0);
          needle(px + (rnd() - 0.5) * 2, py + (rnd() - 0.5) * 2, ang, nl, lum, 1.0 + rnd() * 0.9);
        }
      });
      return pts;
    };

    // Main twig up the middle (canvas y grows downward; tip at the top)
    const main = shoot(w * 0.5, h - 6, -Math.PI * 0.5, h - 30, 0);
    // Side shoots, alternating, longer near the base (fishbone / flat spray)
    for (let k = 2; k < main.length - 2; k += 2) {
      const [px, py, pa, t] = main[k];
      const side = (k / 2) % 2 ? 1 : -1;
      const len = (1 - t) * 95 + 22 + rnd() * 18;
      const sub = shoot(px, py, pa + side * (0.75 + rnd() * 0.25), len, 1);
      // a third level on the bigger side shoots
      if (len > 70) {
        const [sx, sy, sa] = sub[Math.floor(sub.length * 0.45)];
        shoot(sx, sy, sa - side * 0.7, len * 0.35, 1);
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// Broadleaf cluster: real leaf silhouettes (serrated ovate blades with midrib
// and veins) on petioles. Mid-grey with per-leaf variation; tinted by vertex colour.
export function getLeafClusterTexture(kind = 'broad') {
  return memo('leafCluster_' + kind, () => {
    const s = 512;
    const c = makeCanvas(s, s);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, s, s);
    const rnd = mulberry32(kind === 'birch' ? 9001 : 4096);
    const birch = kind === 'birch';
    const leafLen = birch ? 46 : 80;
    const leafWid = birch ? 30 : 44;

    const drawLeaf = (x, y, ang, scale) => {
      const L = leafLen * scale;
      const W = leafWid * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      // blade outline with fine serration
      ctx.beginPath();
      const steps = 22;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const width = Math.sin(Math.pow(t, birch ? 0.8 : 0.7) * Math.PI) * W * 0.5 * (birch ? 1.05 - t * 0.35 : 1);
        const serr = (k % 2 ? 1 : 0.86);
        ctx.lineTo(width * serr, -t * L);
      }
      for (let k = steps; k >= 0; k--) {
        const t = k / steps;
        const width = Math.sin(Math.pow(t, birch ? 0.8 : 0.7) * Math.PI) * W * 0.5 * (birch ? 1.05 - t * 0.35 : 1);
        const serr = (k % 2 ? 1 : 0.86);
        ctx.lineTo(-width * serr, -t * L);
      }
      ctx.closePath();
      const base = 165 + ((rnd() * 70) | 0);
      const grad = ctx.createLinearGradient(-W * 0.5, 0, W * 0.5, -L);
      grad.addColorStop(0, `rgb(${base * 0.82 | 0},${base * 0.86 | 0},${base * 0.78 | 0})`);
      grad.addColorStop(1, `rgb(${Math.min(255, base * 1.08) | 0},${Math.min(255, base * 1.1) | 0},${base * 0.98 | 0})`);
      ctx.fillStyle = grad;
      ctx.fill();
      // midrib + veins
      ctx.strokeStyle = 'rgba(235,240,215,0.45)';
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -L * 0.95);
      ctx.stroke();
      ctx.lineWidth = 0.7 * scale;
      for (let v = 1; v < 7; v++) {
        const t = v / 7;
        const wv = Math.sin(Math.pow(t, 0.7) * Math.PI) * W * 0.42;
        ctx.beginPath();
        ctx.moveTo(0, -t * L);
        ctx.lineTo(wv, -t * L - L * 0.12);
        ctx.moveTo(0, -t * L);
        ctx.lineTo(-wv, -t * L - L * 0.12);
        ctx.stroke();
      }
      // a few insect nibbles / dark spots
      if (rnd() < 0.25) {
        ctx.fillStyle = 'rgba(70,60,40,0.5)';
        ctx.beginPath();
        ctx.arc((rnd() - 0.5) * W * 0.4, -L * (0.3 + rnd() * 0.5), 1.5 + rnd() * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    // Twig skeleton from the bottom centre, leaves along each twig
    const twigs = birch ? 6 : 5;
    for (let b = 0; b < twigs; b++) {
      const a0 = -Math.PI * 0.5 + (b / (twigs - 1) - 0.5) * (birch ? 1.9 : 1.6) + (rnd() - 0.5) * 0.2;
      let x = s * 0.5, y = s - 6, a = a0;
      const len = s * (0.62 + rnd() * 0.25);
      const steps = 10;
      ctx.strokeStyle = birch ? 'rgba(90,70,55,1)' : 'rgba(110,95,75,1)';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      const pts = [];
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < steps; k++) {
        a += (rnd() - 0.5) * 0.18 + (birch ? 0.03 : 0);
        x += Math.cos(a) * len / steps;
        y += Math.sin(a) * len / steps;
        ctx.lineTo(x, y);
        pts.push([x, y, a]);
        ctx.lineWidth = Math.max(1, 3.2 - k * 0.25);
      }
      ctx.stroke();
      pts.forEach(([px, py, pa], k) => {
        if (k < 2) return;
        for (const side of [-1, 1]) {
          if (rnd() < 0.15) continue;
          const la = pa + side * (0.7 + rnd() * 0.5) + Math.PI * 0.5;
          const sc = (0.55 + rnd() * 0.45) * (0.75 + k / steps * 0.35);
          // petiole
          ctx.strokeStyle = 'rgba(120,110,80,1)';
          ctx.lineWidth = 1.2;
          const ex = px + Math.cos(la - Math.PI * 0.5) * 8 * sc;
          const ey = py + Math.sin(la - Math.PI * 0.5) * 8 * sc;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey); ctx.stroke();
          drawLeaf(ex, ey, la, sc);
        }
      });
      // terminal leaf
      const [tx, ty, ta] = pts[pts.length - 1];
      drawLeaf(tx, ty, ta + Math.PI * 0.5, 0.9);
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// Fern frond: rachis up the middle (v axis), pinnae with lobed pinnules.
export function getFernFrondTexture() {
  return memo('fernFrond', () => {
    const w = 192;
    const h = 512;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    const rnd = mulberry32(1123);
    const cx = w * 0.5;

    ctx.strokeStyle = 'rgb(96,120,62)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, h - 2);
    ctx.lineTo(cx, 6);
    ctx.stroke();

    const pairs = 26;
    for (let p = 0; p < pairs; p++) {
      const t = p / pairs;
      const y = h - 30 - t * (h - 44);
      // pinna length: short at base, max ~1/3 up, tapering to the tip
      const L = (Math.sin(Math.min(1, t * 1.25 + 0.12) * Math.PI) * 0.9 + 0.1) * (w * 0.47) * (1 - t * 0.25);
      for (const side of [-1, 1]) {
        const ang = -0.35 - t * 0.25;
        const lobes = Math.max(3, Math.floor(L / 7));
        for (let k = 0; k < lobes; k++) {
          const u = k / lobes;
          const px = cx + side * (4 + u * L);
          const py = y + ang * u * L * 0.6;
          const lr = (1 - u * 0.7) * 6.2 + rnd() * 1.2;
          const g = 110 + ((rnd() * 60) | 0);
          ctx.fillStyle = `rgb(${(g * 0.62) | 0},${g + 30},${(g * 0.45) | 0})`;
          ctx.beginPath();
          ctx.ellipse(px, py, lr * 0.75, lr, side * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(80,110,50,0.9)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx + side * (4 + L), y + ang * L * 0.6);
        ctx.stroke();
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = MAX_ANISO;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}
