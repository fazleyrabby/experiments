import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Perlin {
  constructor(seed = 1) {
    const r = rng(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    this.gx = new Float32Array(256);
    this.gy = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const a = r() * Math.PI * 2;
      this.gx[i] = Math.cos(a);
      this.gy[i] = Math.sin(a);
    }
  }

  noise(x, y, period = 256) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const X0 = ((xi % period) + period) % period;
    const Y0 = ((yi % period) + period) % period;
    const X1 = (X0 + 1) % period;
    const Y1 = (Y0 + 1) % period;
    const P = this.perm;
    const h00 = P[P[X0 & 255] + (Y0 & 255)];
    const h10 = P[P[X1 & 255] + (Y0 & 255)];
    const h01 = P[P[X0 & 255] + (Y1 & 255)];
    const h11 = P[P[X1 & 255] + (Y1 & 255)];
    const a = this.gx[h00] * xf + this.gy[h00] * yf;
    const b = this.gx[h10] * (xf - 1) + this.gy[h10] * yf;
    const c = this.gx[h01] * xf + this.gy[h01] * (yf - 1);
    const d = this.gx[h11] * (xf - 1) + this.gy[h11] * (yf - 1);
    const l1 = a + (b - a) * u;
    const l2 = c + (d - c) * u;
    return (l1 + (l2 - l1) * v) * 1.414;
  }

  fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let amp = 0.5;
    let f = 1;
    let s = 0;
    let norm = 0;
    for (let i = 0; i < oct; i++) {
      s += amp * this.noise(x * f + i * 17.3, y * f - i * 9.1);
      norm += amp;
      amp *= gain;
      f *= lac;
    }
    return s / norm;
  }

  ridged(x, y, oct = 4) {
    let amp = 0.5;
    let f = 1;
    let s = 0;
    let norm = 0;
    let weight = 1;
    for (let i = 0; i < oct; i++) {
      let n = 1 - Math.abs(this.noise(x * f + i * 5.7, y * f + i * 3.1));
      n *= n;
      s += n * amp * weight;
      weight = clamp(n * 1.6);
      norm += amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return s / norm;
  }

  tile(x, y, period, oct) {
    let amp = 0.5;
    let f = 1;
    let s = 0;
    let norm = 0;
    for (let i = 0; i < oct; i++) {
      s += amp * this.noise(x * period * f, y * period * f, period * f);
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / norm;
  }
}

/** Tiling four-channel noise used by every procedural surface shader. */
export function makeNoiseTexture(size = 256) {
  const a = new Perlin(11);
  const b = new Perlin(23);
  const c = new Perlin(37);
  const d = new Perlin(53);
  const data = new Uint8Array(size * size * 4);
  const enc = (v) => Math.round(clamp(0.5 + v * 0.92) * 255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const i = (x + y * size) * 4;
      data[i] = enc(a.tile(u, v, 6, 5));
      data[i + 1] = enc(b.tile(u, v, 12, 4));
      data[i + 2] = enc(c.tile(u, v, 4, 5));
      data[i + 3] = enc(d.tile(u, v, 28, 3));
    }
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Compact geometry builder with colour and wind attributes. */
export class GB {
  constructor() {
    this.p = [];
    this.n = [];
    this.c = [];
    this.w = [];
    this.i = [];
    this.count = 0;
  }

  v(px, py, pz, nx, ny, nz, r, g, b, flex = 0, flutter = 0, phase = 0) {
    this.p.push(px, py, pz);
    this.n.push(nx, ny, nz);
    this.c.push(r, g, b);
    this.w.push(flex, flutter, phase);
    return this.count++;
  }

  tri(a, b, c) {
    this.i.push(a, b, c);
  }

  quad(a, b, c, d) {
    this.i.push(a, b, c, a, c, d);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute('aWind', new THREE.BufferAttribute(new Float32Array(this.w), 3));
    const Index = this.count > 65535 ? Uint32Array : Uint16Array;
    g.setIndex(new THREE.BufferAttribute(new Index(this.i), 1));
    this.p = this.n = this.c = this.w = this.i = null;
    return g;
  }
}

export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
