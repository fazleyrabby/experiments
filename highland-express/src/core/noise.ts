// Seeded RNG + gradient noise used everywhere (terrain, vegetation, stone variation).

export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private r: () => number;
  constructor(seed: number) {
    this.r = mulberry32(seed);
  }
  next(): number {
    return this.r();
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.r();
  }
  int(a: number, b: number): number {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p: number): boolean {
    return this.r() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.r() * arr.length) % arr.length];
  }
  gauss(): number {
    let u = 0;
    for (let i = 0; i < 4; i++) u += this.r();
    return (u - 2) * 1.7320508;
  }
}

export function hash2(x: number, y: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function clamp(x: number, a: number, b: number): number {
  return x < a ? a : x > b ? b : x;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Smooth minimum (polynomial). */
export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

export class Noise {
  private p = new Uint8Array(512);

  constructor(seed = 1337) {
    const rnd = mulberry32(seed);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = perm[i];
      perm[i] = perm[j];
      perm[j] = t;
    }
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }

  /** 2D Perlin noise, range ~[-1,1]. */
  n2(x: number, y: number): number {
    const p = this.p;
    const xf = Math.floor(x), yf = Math.floor(y);
    const X = xf & 255, Y = yf & 255;
    x -= xf;
    y -= yf;
    const u = x * x * x * (x * (x * 6 - 15) + 10);
    const v = y * y * y * (y * (y * 6 - 15) + 10);
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const g = (h: number, dx: number, dy: number) => {
      switch (h & 7) {
        case 0: return dx + dy;
        case 1: return dx - dy;
        case 2: return -dx + dy;
        case 3: return -dx - dy;
        case 4: return dx * 1.4142;
        case 5: return -dx * 1.4142;
        case 6: return dy * 1.4142;
        default: return -dy * 1.4142;
      }
    };
    const x1 = g(aa, x, y) + u * (g(ba, x - 1, y) - g(aa, x, y));
    const x2 = g(ab, x, y - 1) + u * (g(bb, x - 1, y - 1) - g(ab, x, y - 1));
    return (x1 + v * (x2 - x1)) * 0.7;
  }

  /** 3D Perlin noise, range ~[-1,1]. */
  n3(x: number, y: number, z: number): number {
    const p = this.p;
    const xf = Math.floor(x), yf = Math.floor(y), zf = Math.floor(z);
    const X = xf & 255, Y = yf & 255, Z = zf & 255;
    x -= xf; y -= yf; z -= zf;
    const u = x * x * x * (x * (x * 6 - 15) + 10);
    const v = y * y * y * (y * (y * 6 - 15) + 10);
    const w = z * z * z * (z * (z * 6 - 15) + 10);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
    const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
    const g = (h: number, a: number, b: number, c: number) => {
      h &= 15;
      const uu = h < 8 ? a : b;
      const vv = h < 4 ? b : h === 12 || h === 14 ? a : c;
      return ((h & 1) === 0 ? uu : -uu) + ((h & 2) === 0 ? vv : -vv);
    };
    const l = (t: number, a: number, b: number) => a + t * (b - a);
    return (
      l(w,
        l(v, l(u, g(p[AA], x, y, z), g(p[BA], x - 1, y, z)),
             l(u, g(p[AB], x, y - 1, z), g(p[BB], x - 1, y - 1, z))),
        l(v, l(u, g(p[AA + 1], x, y, z - 1), g(p[BA + 1], x - 1, y, z - 1)),
             l(u, g(p[AB + 1], x, y - 1, z - 1), g(p[BB + 1], x - 1, y - 1, z - 1)))) * 0.95
    );
  }

  fbm2(x: number, y: number, oct = 5, lac = 2.03, gain = 0.5): number {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * this.n2(x * f + i * 17.3, y * f - i * 9.1);
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  }

  fbm3(x: number, y: number, z: number, oct = 4, lac = 2.03, gain = 0.5): number {
    let a = 1, f = 1, s = 0, n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * this.n3(x * f + i * 5.1, y * f + i * 3.7, z * f - i * 8.3);
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  }

  /** Ridged multifractal in [0,1]. */
  ridged2(x: number, y: number, oct = 5, lac = 2.1, gain = 0.5): number {
    let a = 1, f = 1, s = 0, n = 0, w = 1;
    for (let i = 0; i < oct; i++) {
      let r = 1 - Math.abs(this.n2(x * f + i * 31.7, y * f - i * 12.9));
      r *= r;
      r *= w;
      w = clamp(r * 1.6, 0, 1);
      s += r * a;
      n += a;
      a *= gain;
      f *= lac;
    }
    return s / n;
  }
}

export const noise = new Noise(2024);
