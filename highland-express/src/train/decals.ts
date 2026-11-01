import * as THREE from 'three';

/** Gilt lettering generated on a canvas at start-up (no image assets involved). */
export function makeTextTexture(
  text: string,
  w = 1024,
  h = 192,
  opts: { font?: string; gold?: boolean; shadow?: boolean; letterSpacing?: number } = {},
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, w, h);
  const size = Math.floor(h * 0.62);
  g.font = opts.font ?? `600 ${size}px "Cormorant Garamond", Georgia, "Times New Roman", serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (opts.letterSpacing !== undefined) (g as unknown as { letterSpacing: string }).letterSpacing = `${opts.letterSpacing}px`;
  if (opts.shadow !== false) {
    g.fillStyle = 'rgba(30,8,4,0.85)';
    g.fillText(text, w / 2 + 4, h / 2 + 5);
  }
  const grad = g.createLinearGradient(0, h * 0.2, 0, h * 0.8);
  if (opts.gold !== false) {
    grad.addColorStop(0, '#fff0b0');
    grad.addColorStop(0.45, '#e2b13c');
    grad.addColorStop(1, '#8a5a12');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#d8d0b8');
  }
  g.fillStyle = grad;
  g.fillText(text, w / 2, h / 2);
  g.lineWidth = 2;
  g.strokeStyle = 'rgba(60,30,6,0.7)';
  g.strokeText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function decalMaterial(tex: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.04,
    roughness: 0.35,
    metalness: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}
