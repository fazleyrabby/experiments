// Device quality tiers. Picked once from the device, overridable with ?q=low|medium|high,
// then refined at runtime by the adaptive governor in main.js.

export const TIERS = {
  low: {
    name: 'low', dprMax: 1.0, dprMin: 0.6, msaa: 0, bloom: false,
    oceanRings: 300, oceanSegs: 256, skyOctaves: 4, waterDetail: false,
    rain: 6000, particles: 2500, spume: 10, extraShips: 1,
    heroTexW: 2048, shipTexW: 1024, envRes: 32,
  },
  medium: {
    name: 'medium', dprMax: 1.25, dprMin: 0.75, msaa: 2, bloom: true,
    oceanRings: 420, oceanSegs: 384, skyOctaves: 5, waterDetail: true,
    rain: 12000, particles: 5000, spume: 16, extraShips: 2,
    heroTexW: 2048, shipTexW: 1024, envRes: 48,
  },
  high: {
    name: 'high', dprMax: 1.5, dprMin: 0.85, msaa: 4, bloom: true,
    oceanRings: 560, oceanSegs: 512, skyOctaves: 6, waterDetail: true,
    rain: 22000, particles: 9000, spume: 26, extraShips: 2,
    heroTexW: 4096, shipTexW: 2048, envRes: 64,
  },
};

function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  } catch { return ''; }
}

export function detectTier() {
  const q = new URLSearchParams(location.search).get('q');
  if (q && TIERS[q]) return TIERS[q];
  const ua = navigator.userAgent;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const ipadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const mobile = /Android|iPhone|iPod|Mobi/i.test(ua) || ipadOS || (coarse && Math.min(screen.width, screen.height) < 900);
  const mem = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  const gpu = gpuName();
  const weakGpu = /Mali-G(5|6|7[0-6])|Adreno \(TM\) [3-6]\d\d|PowerVR|Intel\(R\) (HD|UHD) Graphics [1-6]\d\d|SwiftShader|llvmpipe/i.test(gpu);
  if (mobile) {
    const tablet = ipadOS || Math.min(screen.width, screen.height) >= 700;
    if (weakGpu || mem <= 4 || cores <= 4) return TIERS.low;
    return tablet ? TIERS.medium : TIERS.low;
  }
  if (weakGpu || mem <= 4) return TIERS.medium;
  return TIERS.high;
}
