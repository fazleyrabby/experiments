// Shared, deterministic world layout: where the trees stand, where the 4x4 cut
// its ruts on the way in, the trampled footpath around camp and where rain pools.
// terrain.js, trees.js, rain.js and the ground shader all read from here so the
// mud, puddles, canopy shelter and vegetation always agree with each other.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const IS_MOBILE = typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768);

// ---------------------------------------------------------------------------
// Paths (x, z polylines)
// ---------------------------------------------------------------------------
// Centre line of the rig's wheel tracks: it reversed in off the forest trail,
// so the ruts start under the parked wheels and curve away towards the camera.
export const TRACK_PATH = [
  [-1.86, -1.45], [-1.08, 2.04], [-0.8, 3.9], [-0.45, 6.2], [0.25, 8.6],
  [1.2, 11.2], [2.0, 14.0], [2.55, 17.2], [2.8, 21.0], [2.9, 26.0]
];
export const TRACK_HALF_WIDTH = 1.04;

// Trampled footpath: tent door -> fire -> out along the walking trail.
export const FOOT_PATH = [
  [1.25, 2.55], [2.3, 3.3], [3.35, 3.85], [4.05, 4.9], [4.6, 6.4],
  [5.3, 7.8], [5.9, 9.6], [6.2, 12.5], [6.0, 16.0]
];

// Hand-placed puddles (irregular outlines are added by noise in surface.js)
export const PUDDLES = [
  { x: -3.7, z: 2.6, r: 1.15 },
  { x: -0.9, z: 3.9, r: 0.95 },
  { x: 4.7, z: -1.5, r: 1.1 },
  { x: 3.6, z: 6.1, r: 1.25 },
  { x: -4.6, z: -2.4, r: 1.3 },
  { x: -5.6, z: 4.7, r: 0.9 },
  { x: 1.1, z: -4.4, r: 1.2 },
  { x: 0.2, z: 7.7, r: 0.8 },
  { x: 7.4, z: 6.0, r: 0.7 },
  { x: -2.4, z: 9.4, r: 1.0 }
];

// Rectangles that must stay clear of trees/shrubs (camp furniture etc.)
export function isCampZone(x, z, pad = 0) {
  return (x > -1.0 - pad && x < 3.5 + pad && z > -2.1 - pad && z < 3.1 + pad) ||
    (x > -3.8 - pad && x < 0.8 + pad && z > -2.6 - pad && z < 3.8 + pad) ||
    Math.hypot(x - 4.9, z - 3.3) < 2.3 + pad ||
    Math.hypot(x - 6.3, z - 1.4) < 0.9 + pad ||
    Math.hypot(x - 6.15, z - 3.85) < 0.7 + pad;
}

// Distance from a point to a polyline, with the parameter along it.
const polyCache = new WeakMap();
const FAR = { d: 1e9, t: 0, side: 1, length: 1 };
export function polylineDistance(x, z, pts) {
  let info = polyCache.get(pts);
  if (!info) {
    const lens = [];
    let total = 0;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (let i = 0; i < pts.length; i++) {
      minX = Math.min(minX, pts[i][0]); maxX = Math.max(maxX, pts[i][0]);
      minZ = Math.min(minZ, pts[i][1]); maxZ = Math.max(maxZ, pts[i][1]);
      if (i < pts.length - 1) {
        const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        lens.push(l);
        total += l;
      }
    }
    info = { lens, total, minX, maxX, minZ, maxZ };
    polyCache.set(pts, info);
  }
  // Cheap reject: callers only care about the near field (< 4 m)
  if (x < info.minX - 4 || x > info.maxX + 4 || z < info.minZ - 4 || z > info.maxZ + 4) return FAR;
  const lens = info.lens;
  const total = info.total;
  let best = 1e9;
  let bestT = 0;
  let acc = 0;
  let side = 1;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1];
    const bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - ax) * dx + (z - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + dx * t, pz = az + dz * t;
    const d = Math.hypot(x - px, z - pz);
    if (d < best) {
      best = d;
      bestT = (acc + lens[i] * t) / total;
      side = (dx * (z - az) - dz * (x - ax)) > 0 ? 1 : -1;
    }
    acc += lens[i];
  }
  return { d: best, t: bestT, side, length: total };
}

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------
// Hero trees framing the camp keep their original spots; the forest around
// them is scattered with a seeded Poisson-disc so it's dense but never clumpy.
const HERO_TREES = [
  { x: -7.5, z: -6.5, h: 12.5, kind: 'spruce' },
  { x: -5.2, z: -7.8, h: 11.0, kind: 'fir' },
  { x: -2.8, z: -8.2, h: 13.0, kind: 'spruce' },
  { x: 0.4, z: -7.5, h: 10.5, kind: 'broad' },
  { x: 2.8, z: -7.8, h: 12.0, kind: 'spruce' },
  { x: 5.5, z: -6.8, h: 11.5, kind: 'fir' },
  { x: 7.8, z: -5.8, h: 13.5, kind: 'spruce' },
  { x: -9.0, z: -3.5, h: 11.2, kind: 'spruce' },
  { x: -10.2, z: 0.6, h: 12.8, kind: 'fir' },
  { x: -8.8, z: 4.4, h: 10.0, kind: 'broad' },
  { x: -7.6, z: 7.6, h: 11.8, kind: 'spruce' },
  { x: 9.6, z: -2.4, h: 12.0, kind: 'spruce' },
  { x: 10.4, z: 2.1, h: 11.4, kind: 'birch' },
  { x: 9.4, z: 6.8, h: 10.5, kind: 'broad' },
  { x: 7.4, z: 10.6, h: 12.2, kind: 'spruce' },
  { x: -5.6, z: -4.6, h: 8.5, kind: 'birch' },
  { x: 5.4, z: -4.2, h: 9.2, kind: 'fir' },
  { x: -4.8, z: 6.6, h: 8.8, kind: 'birch' },
  { x: 12.6, z: 4.4, h: 13.0, kind: 'spruce' }
];

function buildTreeLayout() {
  const rnd = mulberry32(90210);
  const trees = HERO_TREES.map(t => ({ ...t, lod: 0 }));
  const minSpacing = (a) => a.kind === 'broad' ? 3.1 : 2.5;

  const tooClose = (x, z, spacing) => trees.some(t => Math.hypot(t.x - x, t.z - z) < Math.max(spacing, minSpacing(t)));
  const blocked = (x, z) => {
    if (isCampZone(x, z, 2.2)) return true;
    if (Math.hypot(x - 1.0, z - 1.0) < 7.2) return true;           // open clearing
    if (polylineDistance(x, z, TRACK_PATH).d < 2.6) return true;     // keep the trail drivable
    if (polylineDistance(x, z, FOOT_PATH).d < 1.7) return true;
    // Keep the main wide camera sight-line open
    if (x > -2.5 && x < 6.5 && z > 2 && z < 14) return true;
    return false;
  };

  const kinds = ['spruce', 'spruce', 'fir', 'spruce', 'broad', 'birch', 'fir', 'broad'];
  const nearTarget = IS_MOBILE ? 55 : 115;
  for (let i = 0; i < 9000 && trees.length < nearTarget + HERO_TREES.length; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 7 + Math.sqrt(rnd()) * 26;
    const x = 1 + Math.cos(a) * r;
    const z = 1 + Math.sin(a) * r;
    if (blocked(x, z)) continue;
    const kind = kinds[(rnd() * kinds.length) | 0];
    const spacing = kind === 'broad' ? 3.0 : 2.3 + rnd() * 0.8;
    if (tooClose(x, z, spacing)) continue;
    const base = kind === 'birch' ? 9 : kind === 'broad' ? 10 : 11;
    trees.push({ x, z, h: base + rnd() * 5.5 + r * 0.06, kind, lod: r > 22 ? 1 : 0 });
  }

  // Far ring: lighter-weight trees that close off the horizon
  const farTarget = IS_MOBILE ? 90 : 200;
  let far = 0;
  for (let i = 0; i < 12000 && far < farTarget; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 33 + rnd() * 20;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (polylineDistance(x, z, TRACK_PATH).d < 2.4) continue;
    if (tooClose(x, z, 2.6)) continue;
    const kind = rnd() < 0.8 ? 'spruce' : 'broad';
    trees.push({ x, z, h: 12 + rnd() * 7, kind, lod: 2 });
    far++;
  }

  // Stable per-tree seed + yaw
  trees.forEach((t, i) => {
    t.seed = i * 7.31 + 1.7;
    t.yaw = rnd() * Math.PI * 2;
    t.scale = 0.92 + rnd() * 0.16;
    // Crown radius used by the canopy map and rain shelter
    t.crown = t.kind === 'broad' ? t.h * 0.34 : t.kind === 'birch' ? t.h * 0.22 : t.h * 0.2;
  });
  return trees;
}

export const TREE_LAYOUT = buildTreeLayout();
