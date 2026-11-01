export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeInCubic = (t) => t * t * t;

export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Hermite smoothstep of t between two edges. */
export const smoothstep = (edge0, edge1, t) => {
  const x = clamp01((t - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

/** Frame-rate independent exponential approach factor. */
export const damp = (rate, dt) => 1 - Math.exp(-rate * dt);
