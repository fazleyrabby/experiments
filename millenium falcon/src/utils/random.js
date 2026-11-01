/** Small deterministic PRNG (mulberry32). Same seed -> same sequence, every load. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniformly distributed unit vector as [x, y, z]. */
export function randomUnitVector(random) {
  const u = random() * 2 - 1;
  const phi = random() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(phi), u, s * Math.sin(phi)];
}

/** Uniformly distributed rotation as a quaternion [x, y, z, w] (Shoemake). */
export function randomQuaternion(random) {
  const u1 = random();
  const u2 = random() * Math.PI * 2;
  const u3 = random() * Math.PI * 2;
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  return [a * Math.sin(u2), a * Math.cos(u2), b * Math.sin(u3), b * Math.cos(u3)];
}
