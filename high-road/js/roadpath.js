// The road and everything near it repeat every PERIOD metres along z, so the drive can
// wrap the camera back without a seam and world coordinates stay small enough for float32.
export const PERIOD = 8192;
export const HALF_WIDTH = 3.9; // asphalt half-width (two 3.5 m lanes + edge strips)
export const LANE = 1.75;      // centre of the right-hand lane

const TAU = Math.PI * 2;

export function roadX(z) {
  return 38 * Math.sin((TAU * 3 * z) / PERIOD) + 16 * Math.sin((TAU * 7 * z) / PERIOD + 1.3);
}
export function roadDX(z) {
  return 38 * ((TAU * 3) / PERIOD) * Math.cos((TAU * 3 * z) / PERIOD) + 16 * ((TAU * 7) / PERIOD) * Math.cos((TAU * 7 * z) / PERIOD + 1.3);
}

// Frame at distance s along the road (driving toward -z).
export function frameAt(s, out = {}) {
  const z = -s;
  const x = roadX(z);
  // tangent: d/ds of (roadX(-s), -s) = (-roadX'(z), -1)
  let tx = -roadDX(z), tz = -1;
  const l = Math.hypot(tx, tz);
  tx /= l; tz /= l;
  out.x = x; out.z = z;
  out.tx = tx; out.tz = tz;
  out.rx = -tz; out.rz = tx; // right = cross(T, up)
  out.heading = Math.atan2(-tx, -tz); // yaw that turns -z onto the tangent
  return out;
}

// Guardrail runs in long stretches with gaps between them.
export const railAt = (s) => (((s * 6) / PERIOD) % 1 + 1) % 1 < 0.72;

export const ROAD_GLSL = /* glsl */ `
const float PERIOD = ${PERIOD.toFixed(1)};
bool railAt(float s) { return fract(s * 6.0 / PERIOD) < 0.72; }
float roadX(float z) {
  return 38.0 * sin(6.2831853 * 3.0 * z / PERIOD) + 16.0 * sin(6.2831853 * 7.0 * z / PERIOD + 1.3);
}
`;
