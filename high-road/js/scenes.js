import * as THREE from 'three';

// Land: the palette and plant cover laid over whichever route is active.
// Colours are linear albedo. cover = tufts, tuft height, flowers, stones;
// trees = conifers, broadleaf, distant canopy tint, forest everywhere (0) or only in patches (1).
export const BIOMES = {
  steppe: {
    label: 'Golden steppe',
    grassA: [0.46, 0.27, 0.12], grassB: [0.55, 0.34, 0.17], scrub: [0.34, 0.22, 0.12], bare: [0.50, 0.40, 0.30],
    meadow: [0.27, 0.27, 0.11], red: [0.60, 0.42, 0.26], alk: [0.66, 0.62, 0.54],
    tuftA: [0.42, 0.27, 0.12], tuftB: [0.62, 0.45, 0.24], tuftM: [0.24, 0.27, 0.10],
    cover: [1, 1, 1, 1], trees: [0, 0, 0, 0], snow: 0,
    needle: [0.05, 0.09, 0.05], leafA: [0.10, 0.16, 0.05], leafB: [0.20, 0.24, 0.07],
    plainA: [0.46, 0.27, 0.13], plainB: [0.52, 0.33, 0.17], snowLine: 1000,
  },
  alpine: {
    label: 'Alpine meadow',
    grassA: [0.13, 0.21, 0.06], grassB: [0.21, 0.29, 0.08], scrub: [0.09, 0.14, 0.05], bare: [0.36, 0.34, 0.29],
    meadow: [0.17, 0.27, 0.06], red: [0.30, 0.25, 0.18], alk: [0.40, 0.40, 0.38],
    tuftA: [0.12, 0.20, 0.05], tuftB: [0.26, 0.34, 0.10], tuftM: [0.16, 0.30, 0.06],
    cover: [1.1, 1.15, 1.9, 1.4], trees: [0.4, 0, 0.6, 0.1], snow: 0,
    needle: [0.035, 0.07, 0.04], leafA: [0.10, 0.16, 0.05], leafB: [0.20, 0.24, 0.07],
    plainA: [0.13, 0.20, 0.07], plainB: [0.19, 0.25, 0.09], snowLine: 700,
  },
  forest: {
    label: 'Pine forest',
    grassA: [0.10, 0.13, 0.05], grassB: [0.17, 0.17, 0.07], scrub: [0.16, 0.10, 0.05], bare: [0.24, 0.17, 0.10],
    meadow: [0.12, 0.19, 0.05], red: [0.26, 0.15, 0.08], alk: [0.30, 0.27, 0.22],
    tuftA: [0.10, 0.15, 0.05], tuftB: [0.22, 0.26, 0.08], tuftM: [0.12, 0.22, 0.05],
    cover: [0.7, 0.9, 0.4, 0.8], trees: [1.0, 0.15, 1.0, 0.75], snow: 0,
    needle: [0.03, 0.06, 0.035], leafA: [0.08, 0.14, 0.04], leafB: [0.16, 0.20, 0.06],
    plainA: [0.07, 0.11, 0.05], plainB: [0.10, 0.14, 0.06], snowLine: 1100,
  },
  farmland: {
    label: 'Green farmland',
    grassA: [0.16, 0.27, 0.06], grassB: [0.27, 0.36, 0.09], scrub: [0.30, 0.30, 0.10], bare: [0.38, 0.30, 0.19],
    meadow: [0.20, 0.33, 0.07], red: [0.44, 0.38, 0.15], alk: [0.50, 0.46, 0.22],
    tuftA: [0.15, 0.26, 0.05], tuftB: [0.30, 0.38, 0.10], tuftM: [0.18, 0.34, 0.06],
    cover: [1.0, 1.25, 1.5, 0.5], trees: [0.05, 0.5, 0.35, 0], snow: 0,
    needle: [0.04, 0.08, 0.04], leafA: [0.07, 0.15, 0.03], leafB: [0.17, 0.25, 0.05],
    plainA: [0.15, 0.24, 0.07], plainB: [0.24, 0.30, 0.09], snowLine: 1100,
  },
  desert: {
    label: 'Red desert',
    grassA: [0.62, 0.34, 0.17], grassB: [0.70, 0.43, 0.24], scrub: [0.50, 0.30, 0.18], bare: [0.74, 0.58, 0.42],
    meadow: [0.40, 0.33, 0.18], red: [0.60, 0.25, 0.12], alk: [0.80, 0.72, 0.60],
    tuftA: [0.40, 0.30, 0.16], tuftB: [0.55, 0.45, 0.28], tuftM: [0.30, 0.30, 0.15],
    cover: [0.35, 0.8, 0.15, 2.2], trees: [0, 0, 0, 0], snow: 0,
    needle: [0.05, 0.09, 0.05], leafA: [0.10, 0.16, 0.05], leafB: [0.20, 0.24, 0.07],
    plainA: [0.58, 0.32, 0.16], plainB: [0.66, 0.40, 0.22], snowLine: 1500,
  },
  snow: {
    label: 'Snowfield',
    grassA: [0.70, 0.73, 0.78], grassB: [0.78, 0.81, 0.85], scrub: [0.50, 0.53, 0.57], bare: [0.62, 0.65, 0.70],
    meadow: [0.66, 0.70, 0.76], red: [0.30, 0.27, 0.25], alk: [0.82, 0.85, 0.89],
    tuftA: [0.30, 0.25, 0.17], tuftB: [0.46, 0.38, 0.26], tuftM: [0.30, 0.28, 0.20],
    cover: [0.35, 0.7, 0, 0.6], trees: [0.4, 0, 0.5, 0.15], snow: 1,
    needle: [0.03, 0.06, 0.04], leafA: [0.10, 0.16, 0.05], leafB: [0.20, 0.24, 0.07],
    plainA: [0.72, 0.75, 0.80], plainB: [0.80, 0.83, 0.87], snowLine: 120,
  },
  coastal: {
    label: 'Coastal grass',
    grassA: [0.28, 0.27, 0.10], grassB: [0.38, 0.34, 0.15], scrub: [0.18, 0.20, 0.08], bare: [0.52, 0.46, 0.34],
    meadow: [0.20, 0.27, 0.08], red: [0.48, 0.36, 0.22], alk: [0.60, 0.56, 0.46],
    tuftA: [0.28, 0.27, 0.10], tuftB: [0.46, 0.40, 0.20], tuftM: [0.18, 0.27, 0.07],
    cover: [1.0, 1.0, 1.2, 1.2], trees: [0, 0.12, 0.2, 0], snow: 0,
    needle: [0.04, 0.08, 0.04], leafA: [0.08, 0.14, 0.04], leafB: [0.16, 0.22, 0.06],
    plainA: [0.28, 0.27, 0.11], plainB: [0.36, 0.33, 0.15], snowLine: 1100,
  },
};

const V3 = () => ({ value: new THREE.Vector3() });
export const biomeUniforms = {
  uGrassA: V3(), uGrassB: V3(), uScrub: V3(), uBare: V3(), uMeadowC: V3(), uRedC: V3(), uAlkC: V3(),
  uTuftA: V3(), uTuftB: V3(), uTuftM: V3(), uNeedle: V3(), uLeafA: V3(), uLeafB: V3(),
  uPlainA: V3(), uPlainB: V3(),
  uCover: { value: new THREE.Vector4(1, 1, 1, 1) },
  uTrees: { value: new THREE.Vector4() },
  uSnowCover: { value: 0 },
  uSnowLine: { value: 1000 },
};

export function setBiome(key) {
  const B = BIOMES[key] || BIOMES.steppe;
  const u = biomeUniforms;
  const pairs = { uGrassA: 'grassA', uGrassB: 'grassB', uScrub: 'scrub', uBare: 'bare', uMeadowC: 'meadow', uRedC: 'red', uAlkC: 'alk',
    uTuftA: 'tuftA', uTuftB: 'tuftB', uTuftM: 'tuftM', uNeedle: 'needle', uLeafA: 'leafA', uLeafB: 'leafB', uPlainA: 'plainA', uPlainB: 'plainB' };
  for (const [k, f] of Object.entries(pairs)) u[k].value.fromArray(B[f]);
  u.uCover.value.fromArray(B.cover);
  u.uTrees.value.fromArray(B.trees);
  u.uSnowCover.value = B.snow;
  u.uSnowLine.value = B.snowLine;
  return B;
}

// Scenes: a road, a land and a light that belong together.
export const SCENES = {
  plateau: { label: 'High plateau', route: 'plateau', biome: 'steppe', light: 'day' },
  pass: { label: 'Mountain pass', route: 'pass', biome: 'alpine', light: 'day' },
  coast: { label: 'Coast road', route: 'coast', biome: 'coastal', light: 'golden' },
  forest: { label: 'Forest road', route: 'winding', biome: 'forest', light: 'day' },
  hills: { label: 'Farm hills', route: 'rolling', biome: 'farmland', light: 'golden' },
  desert: { label: 'Desert highway', route: 'dips', biome: 'desert', light: 'day' },
  snow: { label: 'Snowfield', route: 'lane', biome: 'snow', light: 'day' },
};

export const VIEWS = {
  windscreen: { label: 'Windscreen', key: '1' },
  cockpit: { label: 'Cockpit', key: '2' },
  hood: { label: 'Bonnet', key: '3' },
  bumper: { label: 'Bumper', key: '4' },
  chase: { label: 'Chase', key: '5' },
  far: { label: 'Far chase', key: '6' },
  cinema: { label: 'Cinematic', key: '7' },
};

export const PAINTS = {
  red: { label: 'Rosso', color: 0x9e0f12 },
  blue: { label: 'Night blue', color: 0x14284a },
  silver: { label: 'Silver', color: 0xa9adb2 },
  papaya: { label: 'Papaya', color: 0xd8570f },
  green: { label: 'Racing green', color: 0x12301f },
  white: { label: 'White', color: 0xe6e5e0 },
  black: { label: 'Black', color: 0x121314 },
};

export const PACES = {
  cruise: { label: 'Cruise', speed: 1, lat: 1.7 },
  brisk: { label: 'Brisk', speed: 1.45, lat: 3.4 },
  fast: { label: 'Fast', speed: 2.0, lat: 5.5 },
};
