import {
  abs, dot, float, floor, fract, mix, oneMinus, sin, smoothstep, step, vec2, vec3,
} from 'three/tsl';

export const KIND = { HOME: 0, BOTTLES: 1, CLOCKS: 2, GARMENTS: 3, BAKERY: 4, HARDWARE: 5, PORTRAITS: 6, BOOKS: 7 };

const isKind = (kind, value) => step(value - 0.5, kind).mul(oneMinus(step(value + 0.5, kind)));
const below = (edge, x, soft) => oneMinus(smoothstep(float(edge).sub(soft), float(edge).add(soft), x));
const hash = (a, b, seed) => fract(sin(dot(vec2(a, b), vec2(12.9898, 78.233)).add(seed.mul(41))).mul(43758.5453));

/**
 * The distant view of a shop wall. Close shops show real 3D rooms, so this only has to read at range
 * and in the road reflection. It is one small pattern on purpose: this shader runs on every window,
 * and a large one can stall the GPU for many seconds while it compiles.
 */
export function shopWall(kind, u, v, seed) {
  const sparse = isKind(kind, KIND.CLOCKS).add(isKind(kind, KIND.PORTRAITS));
  const density = float(7).add(isKind(kind, KIND.BOOKS).mul(7)).sub(sparse.mul(5)).sub(isKind(kind, KIND.GARMENTS).mul(3));
  const rows = v.mul(mix(float(2.4), float(1.5), sparse));
  const column = u.mul(density);
  const cell = vec2(fract(column), fract(rows)).sub(0.5);
  const h = hash(floor(column), floor(rows), seed);
  const block = below(0.38, abs(cell.x), 0.04).mul(below(h.mul(0.14).add(0.24), abs(cell.y.add(0.08)), 0.03));
  const item = block.mul(step(0.18, h));
  const tone = mix(mix(vec3(0.3, 0.12, 0.06), vec3(0.09, 0.17, 0.18), step(0.36, h)), vec3(0.42, 0.32, 0.16), step(0.7, h));
  const stocked = mix(vec3(0.03, 0.02, 0.014), tone.mul(h.mul(0.3).add(0.36)), item);
  return mix(stocked, vec3(0.12, 0.07, 0.04), step(0.9, fract(rows)).mul(oneMinus(sparse)));
}

/** Furniture on the back wall of an upper-floor room: a dresser and a framed picture or mirror. */
export function homeFurniture(base, x, v, seed, isBack) {
  const offset = x.sub(fract(seed.mul(13.7)).sub(0.5).mul(1.5));
  const dresser = below(0.72, abs(offset), 0.008).mul(below(0.86, v, 0.008));
  const drawers = below(0.012, abs(fract(v.mul(3.6)).sub(0.5)), 0.004);
  const wood = mix(vec3(0.16, 0.09, 0.05), vec3(0.05, 0.03, 0.02), drawers);
  const frame = below(0.42, abs(offset), 0.006).mul(below(0.34, abs(v.sub(1.72)), 0.006));
  const canvas = below(0.36, abs(offset), 0.006).mul(below(0.28, abs(v.sub(1.72)), 0.006));
  const scene = mix(vec3(0.16, 0.2, 0.2), vec3(0.42, 0.34, 0.2), smoothstep(1.52, 1.86, v));
  const picture = mix(vec3(0.26, 0.17, 0.07), scene, canvas);
  return mix(base, mix(mix(base, picture, frame), wood, dresser), isBack);
}
