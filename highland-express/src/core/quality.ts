/**
 * Quality tiers. "high" is the full scene; "lite" targets phones, tablets and weak / integrated
 * GPUs with a lighter terrain mesh, sparser planting, a smaller shadow map and no MSAA.
 * Auto-detected on start; override with ?quality=lite|high or the Q key (remembered).
 */
export type Tier = 'high' | 'lite';

export interface Quality {
  tier: Tier;
  shadowMap: number;
  msaa: number;
  pixelCap: number;
  minScale: number;
  startScale: number;
  bloomScale: number;
  terrainLite: boolean;
  /** planting grid spacings (metres) */
  veg: { pine: number; broad: number; shrub: number; grass: number; flowerClusters: number; rock: number; distScale: number };
  mist: number;
  motes: number;
  smoke: number;
}

const HIGH: Quality = {
  tier: 'high',
  shadowMap: 4096,
  msaa: 2,
  pixelCap: 1.75,
  minScale: 0.5,
  startScale: 1,
  bloomScale: 0.5,
  terrainLite: false,
  veg: { pine: 5.2, broad: 7, shrub: 3.4, grass: 2.1, flowerClusters: 520, rock: 9, distScale: 1 },
  mist: 90,
  motes: 700,
  smoke: 1300,
};

const LITE: Quality = {
  tier: 'lite',
  shadowMap: 2048,
  msaa: 0,
  pixelCap: 1.25,
  minScale: 0.4,
  startScale: 0.8,
  bloomScale: 0.3,
  terrainLite: true,
  veg: { pine: 8, broad: 10, shrub: 5.6, grass: 3.6, flowerClusters: 200, rock: 13, distScale: 0.65 },
  mist: 40,
  motes: 220,
  smoke: 700,
};

function gpuName(): string {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return '';
  }
}

export function detectQuality(): Quality {
  const qs = new URLSearchParams(location.search).get('quality');
  let stored: string | null = null;
  try {
    stored = localStorage.getItem('he-quality');
  } catch {
    /* storage may be blocked */
  }
  const forced = qs ?? stored;
  if (forced === 'lite') return LITE;
  if (forced === 'high') return HIGH;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(screen.width, screen.height) < 900;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const gpu = gpuName();
  const weakGpu = /Mali|Adreno|PowerVR|SwiftShader|llvmpipe|Intel\(R\) (HD|UHD)|Intel.*(HD|UHD) Graphics/i.test(gpu);
  if ((coarse && smallScreen) || mem <= 4 || cores <= 4 || weakGpu) return LITE;
  return HIGH;
}

export function setStoredQuality(t: Tier) {
  try {
    localStorage.setItem('he-quality', t);
  } catch {
    /* ignore */
  }
}
