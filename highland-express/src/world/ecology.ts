import { noise, smoothstep } from '../core/noise';

/** Shared habitat masks: terrain colouring and vegetation placement agree. */

export function pineMask(x: number, z: number, h: number, slope: number): number {
  const n = noise.fbm2(x * 0.0072 + 40, z * 0.0072 - 12, 3) * 0.5 + 0.5;
  const patches = smoothstep(0.5, 0.64, n);
  const elev = smoothstep(2, 9, h) * (1 - smoothstep(95, 150, h));
  const steep = 1 - smoothstep(0.62, 1.0, slope);
  return patches * elev * steep;
}

export function broadleafMask(x: number, z: number, h: number, slope: number): number {
  const n = noise.fbm2(x * 0.011 - 7, z * 0.011 + 21, 3) * 0.5 + 0.5;
  const low = 1 - smoothstep(18, 50, h);
  return smoothstep(0.42, 0.62, n) * low * (1 - smoothstep(0.5, 0.9, slope));
}

/** Heather / moor cover (above the forest, open hillsides). */
export function moorMask(x: number, z: number, h: number): number {
  const n = noise.fbm2(x * 0.02 + 90, z * 0.02 + 33, 3) * 0.5 + 0.5;
  return smoothstep(0.35, 0.65, n) * smoothstep(20, 70, h);
}

export function brackenMask(x: number, z: number, h: number): number {
  const n = noise.fbm2(x * 0.017 - 50, z * 0.017 + 13, 3) * 0.5 + 0.5;
  return smoothstep(0.55, 0.72, n) * (1 - smoothstep(60, 120, h));
}
