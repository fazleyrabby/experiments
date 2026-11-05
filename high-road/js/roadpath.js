// The road and everything near it repeat every PERIOD metres along z, so the drive can
// wrap the camera back without a seam and world coordinates stay small enough for float32.
//
// A route is a sum of up to four sine harmonics for the road's sideways swing x(z) and four
// for its height y(z). Every harmonic completes a whole number of cycles per PERIOD, so any
// route stays seamless. The same numbers feed the shaders through shared uniforms.
//
// Distance along the road (s) is true arc length; a lookup table maps it back to z.
import * as THREE from 'three';

export const PERIOD = 8192;
export const HALF_WIDTH = 3.9; // asphalt half-width (two 3.5 m lanes + edge strips)
export const LANE = 1.75;      // centre of the right-hand lane

const TAU = Math.PI * 2;

// terrain: relief (small undulation), hills (big rolling hills away from the road),
// valley (walls rising on both sides, m), side (hillside: rises left, falls right, m),
// valleyW / sideL (m), farRight (height the far right side settles to), shoulder (flat verge, m)
// marks: centre line 0 yellow dashes, 1 double yellow, 2 white dashes, 3 none; edge lines 0/1
export const ROUTES = {
  plateau: {
    label: 'Plateau', desc: 'Long sweepers across the high plain',
    x: [[3, 38, 0], [7, 16, 1.3]], y: [], y0: 0,
    terrain: { relief: 1, hills: 1, valley: 0, side: 0, valleyW: 400, sideL: 250, farRight: 0, shoulder: 6 },
    marks: { centre: 0, edge: 1 }, vmax: 17, water: null,
  },
  winding: {
    label: 'Winding', desc: 'Bends one after another, gently rolling',
    x: [[9, 62, 0.4], [17, 22, 2.1], [29, 9, 4.0], [4, 40, 1.0]], y: [[6, 9, 0.3], [13, 3, 1.9]], y0: 0,
    terrain: { relief: 1.2, hills: 0.9, valley: 30, side: 0, valleyW: 600, sideL: 250, farRight: 0, shoulder: 6 },
    marks: { centre: 0, edge: 1 }, vmax: 15, water: null,
  },
  pass: {
    label: 'Mountain pass', desc: 'Tight turns and steep grades up a valley',
    x: [[21, 30, 0.2], [37, 11, 1.7], [11, 52, 3.1], [53, 4, 0.6]], y: [[5, 34, 0.0], [11, 9, 2.2], [23, 2.5, 4.1]], y0: 0,
    terrain: { relief: 1.4, hills: 0.4, valley: 260, side: 70, valleyW: 520, sideL: 160, farRight: 0, shoulder: 5.6 },
    marks: { centre: 1, edge: 1 }, vmax: 13, water: null,
  },
  rolling: {
    label: 'Rolling hills', desc: 'Over the crests and down the dips',
    x: [[5, 46, 0.9], [13, 14, 2.6], [23, 5, 0.1]], y: [[9, 11, 0.0], [19, 4.5, 1.4], [31, 1.6, 3.3]], y0: 0,
    terrain: { relief: 1.1, hills: 0.5, valley: 0, side: 0, valleyW: 400, sideL: 250, farRight: 0, shoulder: 6 },
    marks: { centre: 2, edge: 1 }, vmax: 18, water: null,
  },
  dips: {
    label: 'Desert dips', desc: 'Dead-straight stretches through dry washes',
    x: [[2, 30, 0.0], [5, 9, 2.0]], y: [[37, 2.2, 0.0], [23, 1.6, 1.2], [3, 14, 0.5]], y0: 0,
    terrain: { relief: 0.8, hills: 1.3, valley: 0, side: 0, valleyW: 400, sideL: 250, farRight: 0, shoulder: 6.5 },
    marks: { centre: 0, edge: 1 }, vmax: 24, water: null,
  },
  coast: {
    label: 'Coast road', desc: 'A cliff road above the sea',
    x: [[7, 54, 0.7], [15, 17, 2.4], [27, 6, 5.1]], y: [[6, 9, 0.2], [17, 3, 2.0]], y0: 26,
    terrain: { relief: 0.9, hills: 0.6, valley: 0, side: 150, valleyW: 400, sideL: 210, farRight: -260, shoulder: 5.8 },
    marks: { centre: 2, edge: 1 }, vmax: 15, water: { level: -18 },
  },
  lane: {
    label: 'Country lane', desc: 'Narrow, unmarked and wandering',
    x: [[13, 34, 0.9], [27, 12, 3.3], [41, 4, 1.1]], y: [[7, 6, 0.6], [21, 2.2, 2.4]], y0: 0,
    terrain: { relief: 1.0, hills: 0.7, valley: 0, side: 0, valleyW: 400, sideL: 250, farRight: 0, shoulder: 5.6 },
    marks: { centre: 3, edge: 0 }, vmax: 13, water: null,
  },
};

// ---------- active route ----------
const R = {
  key: 'plateau',
  xk: [0, 0, 0, 0], xa: [0, 0, 0, 0], xp: [0, 0, 0, 0],
  yk: [0, 0, 0, 0], ya: [0, 0, 0, 0], yp: [0, 0, 0, 0], y0: 0,
  len: PERIOD,
  zOfS: null, // Float32Array, z at every metre of arc length
};

export const roadUniforms = {
  uRXk: { value: new THREE.Vector4() }, uRXa: { value: new THREE.Vector4() }, uRXp: { value: new THREE.Vector4() },
  uRYk: { value: new THREE.Vector4() }, uRYa: { value: new THREE.Vector4() }, uRYp: { value: new THREE.Vector4() },
  uRY0: { value: 0 },
  uTerr: { value: new THREE.Vector4(1, 1, 0, 0) },   // relief, hills, valley, side
  uTerr2: { value: new THREE.Vector4(400, 250, 0, 6) }, // valleyW, sideL, farRight, shoulder
  uMarks: { value: new THREE.Vector4(0, 1, 6, 0) },   // centre style, edge lines, dash period, unused
  uWater: { value: new THREE.Vector4(-1000, 0, 0, 0) }, // level, on, time, unused
};

const w = (k) => (TAU * k) / PERIOD;

export function roadX(z) {
  let x = 0;
  for (let i = 0; i < 4; i++) if (R.xa[i]) x += R.xa[i] * Math.sin(w(R.xk[i]) * z + R.xp[i]);
  return x;
}
export function roadDX(z) {
  let d = 0;
  for (let i = 0; i < 4; i++) if (R.xa[i]) d += R.xa[i] * w(R.xk[i]) * Math.cos(w(R.xk[i]) * z + R.xp[i]);
  return d;
}
function roadDDX(z) {
  let d = 0;
  for (let i = 0; i < 4; i++) if (R.xa[i]) d -= R.xa[i] * w(R.xk[i]) ** 2 * Math.sin(w(R.xk[i]) * z + R.xp[i]);
  return d;
}
export function roadY(z) {
  let y = R.y0;
  for (let i = 0; i < 4; i++) if (R.ya[i]) y += R.ya[i] * Math.sin(w(R.yk[i]) * z + R.yp[i]);
  return y;
}
function roadDY(z) {
  let d = 0;
  for (let i = 0; i < 4; i++) if (R.ya[i]) d += R.ya[i] * w(R.yk[i]) * Math.cos(w(R.yk[i]) * z + R.yp[i]);
  return d;
}

export function setRoute(key) {
  const def = ROUTES[key] || ROUTES.plateau;
  R.key = ROUTES[key] ? key : 'plateau';
  for (let i = 0; i < 4; i++) {
    const hx = def.x[i] || [0, 0, 0], hy = def.y[i] || [0, 0, 0];
    R.xk[i] = hx[0]; R.xa[i] = hx[1]; R.xp[i] = hx[2];
    R.yk[i] = hy[0]; R.ya[i] = hy[1]; R.yp[i] = hy[2];
  }
  R.y0 = def.y0 || 0;
  // arc length table, integrated in 0.5 m steps of z
  const dz = 0.5, n = PERIOD / dz;
  const cum = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) {
    const z = -(i - 0.5) * dz;
    const a = roadDX(z), b = roadDY(z);
    cum[i] = cum[i - 1] + dz * Math.sqrt(1 + a * a + b * b);
  }
  R.len = cum[n];
  const m = Math.ceil(R.len) + 2;
  R.zOfS = new Float32Array(m);
  let j = 0;
  for (let si = 0; si < m; si++) {
    const s = Math.min(si, R.len);
    while (j < n - 1 && cum[j + 1] < s) j++;
    const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    R.zOfS[si] = -(j + t) * dz;
  }
  const u = roadUniforms;
  u.uRXk.value.fromArray(R.xk); u.uRXa.value.fromArray(R.xa); u.uRXp.value.fromArray(R.xp);
  u.uRYk.value.fromArray(R.yk); u.uRYa.value.fromArray(R.ya); u.uRYp.value.fromArray(R.yp);
  u.uRY0.value = R.y0;
  const T = def.terrain;
  u.uTerr.value.set(T.relief, T.hills, T.valley, T.side);
  u.uTerr2.value.set(T.valleyW, T.sideL, T.farRight, T.shoulder);
  // dashes: 6 m paint in a period that divides the loop exactly
  u.uMarks.value.set(def.marks.centre, def.marks.edge, R.len / Math.round(R.len / 15), 0);
  u.uWater.value.x = def.water ? def.water.level : -1000;
  u.uWater.value.y = def.water ? 1 : 0;
  return def;
}

export const routeLen = () => R.len;
export const routeKey = () => R.key;
export const route = () => ROUTES[R.key];

function zAt(s) {
  const k = Math.floor(s / R.len);
  const sl = s - k * R.len;
  const i = Math.floor(sl), t = sl - i;
  const z = R.zOfS[i] + (R.zOfS[i + 1] - R.zOfS[i]) * t;
  return z - k * PERIOD;
}

// Frame at arc length s along the road (driving toward -z).
// x, y, z: centreline; tx, tz: horizontal unit tangent; rx, rz: right; heading: yaw;
// grade: rise per horizontal metre; curv: signed horizontal curvature (1/m, + turns right).
export function frameAt(s, out = {}) {
  const z = zAt(s);
  const x = roadX(z);
  const dx = roadDX(z);
  // tangent: d/d(-z) of (x(z), z) = (-x', -1)
  const l = Math.hypot(dx, 1);
  const tx = -dx / l, tz = -1 / l;
  out.x = x; out.y = roadY(z); out.z = z;
  out.tx = tx; out.tz = tz;
  out.rx = -tz; out.rz = tx; // right = cross(T, up)
  out.heading = Math.atan2(-tx, -tz); // yaw that turns -z onto the tangent
  out.grade = -roadDY(z) / l;
  out.curv = roadDDX(z) / (l * l * l);
  return out;
}

// Rough terrain height beside the road (no noise), for keeping cameras above ground.
export function terrainApprox(s, lat) {
  const f = frameAt(s, {});
  const T = route().terrain;
  const rd = Math.abs(lat);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let h = T.valley * ss(T.valleyW * 0.04, T.valleyW, rd) * 0.55 + T.side * Math.tanh(-lat / T.sideL);
  h = f.y + h * ss(T.shoulder, T.shoulder + 28, rd);
  return Math.max(h, f.y - 0.3);
}

// Guardrail runs in long stretches with gaps between them (by -z, so seamless on any route).
export const railAtZ = (z) => ((((-z) * 6) / PERIOD) % 1 + 1) % 1 < 0.72;

export const ROAD_GLSL = /* glsl */ `
const float PERIOD = ${PERIOD.toFixed(1)};
uniform vec4 uRXk, uRXa, uRXp, uRYk, uRYa, uRYp;
uniform float uRY0;
uniform vec4 uTerr, uTerr2, uMarks;
bool railAt(float s) { return fract(s * 6.0 / PERIOD) < 0.72; }
float roadX(float z) {
  vec4 w = 6.2831853 * uRXk / PERIOD;
  return dot(uRXa, sin(w * z + uRXp));
}
float roadDX(float z) {
  vec4 w = 6.2831853 * uRXk / PERIOD;
  return dot(uRXa * w, cos(w * z + uRXp));
}
float roadY(float z) {
  vec4 w = 6.2831853 * uRYk / PERIOD;
  return uRY0 + dot(uRYa, sin(w * z + uRYp));
}
// signed distance across the road (m, + to the right of travel), perpendicular to it
float roadU(vec2 p) {
  float d = roadDX(p.y);
  return (p.x - roadX(p.y)) * inversesqrt(1.0 + d * d);
}
`;
