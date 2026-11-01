// Final compositing pass: colour grade, bloom, vignette, paper, scratches, grain, fades.
// Bloom uses down/upsampling (no ctx.filter), thresholded by multiplying the image by itself.
import { P, mix, rgba } from './color.js';
import { textures, makeCanvas, pattern } from './textures.js';
import { hash } from './math.js';

let bloomA = null, bloomB = null, vig = null, vigKey = '';

function vignette(w, h) {
  const key = `${w}x${h}`;
  if (vig && vigKey === key) return vig;
  vig = makeCanvas(w, h);
  const g = vig.getContext('2d');
  const r = Math.hypot(w, h) * 0.6;
  const gr = g.createRadialGradient(w / 2, h * 0.48, r * 0.35, w / 2, h / 2, r);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.7, rgba(mix(P.parch, P.teal, 0.5)));
  gr.addColorStop(1, rgba(mix(P.night, P.teal, 0.3)));
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  vigKey = key;
  return vig;
}

// grade: { cold, warm, bloom, vignette, contrast, fade (0 visible .. 1 black), frame, layers }
export function post(g, canvas, w, h, grade, layers = {}) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const tex = textures();
  const cold = grade.cold || 0;

  if (layers.grade !== false) {
    // Cold drain: pull hue toward blue-green, then deepen.
    if (cold > 0.005) {
      g.globalCompositeOperation = 'color';
      g.globalAlpha = cold * 0.6;
      g.fillStyle = rgba(mix(P.teal, P.cold, 0.4));
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'multiply';
      g.globalAlpha = cold * 0.35;
      g.fillStyle = rgba(P.cold);
      g.fillRect(0, 0, w, h);
    }
    if ((grade.warm || 0) > 0.005) {
      g.globalCompositeOperation = 'soft-light';
      g.globalAlpha = grade.warm * 0.35;
      g.fillStyle = rgba(P.amber);
      g.fillRect(0, 0, w, h);
    }
    // Gentle S-curve via soft-light of the image onto itself is costly; use a mid-grey overlay instead.
    if (grade.contrast) {
      g.globalCompositeOperation = 'overlay';
      g.globalAlpha = grade.contrast;
      g.fillStyle = 'rgb(118,118,118)';
      g.fillRect(0, 0, w, h);
    }
    g.globalAlpha = 1;
  }

  // Bloom.
  const bloom = grade.bloom ?? 0.35;
  if (layers.bloom !== false && bloom > 0.01) {
    const bw = Math.max(2, Math.round(w / 8)), bh = Math.max(2, Math.round(h / 8));
    if (!bloomA || bloomA.width !== bw || bloomA.height !== bh) {
      bloomA = makeCanvas(bw, bh);
      bloomB = makeCanvas(Math.max(2, bw >> 1), Math.max(2, bh >> 1));
    }
    const a = bloomA.getContext('2d'), b = bloomB.getContext('2d');
    a.globalCompositeOperation = 'source-over';
    a.drawImage(canvas, 0, 0, bw, bh);
    a.globalCompositeOperation = 'multiply';
    a.drawImage(bloomA, 0, 0);
    a.drawImage(bloomA, 0, 0);
    b.clearRect(0, 0, bloomB.width, bloomB.height);
    b.drawImage(bloomA, 0, 0, bloomB.width, bloomB.height);
    a.globalCompositeOperation = 'source-over';
    a.drawImage(bloomB, 0, 0, bw, bh);
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = bloom;
    g.imageSmoothingQuality = 'high';
    g.drawImage(bloomA, 0, 0, w, h);
    g.globalAlpha = bloom * 0.6;
    g.drawImage(bloomB, 0, 0, w, h);
    g.globalAlpha = 1;
  }

  if (layers.texture !== false) {
    // Vignette.
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = grade.vignette ?? 0.85;
    g.drawImage(vignette(w, h), 0, 0);
    // Paper grain, static.
    const s = Math.max(1, Math.min(w, h) / 900);
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 0.16;
    g.fillStyle = pattern(g, tex.paper);
    g.save(); g.scale(s, s); g.fillRect(0, 0, w / s, h / s); g.restore();
    // Scratches, static.
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = 0.5;
    g.drawImage(tex.scratches, 0, 0, w, h);
    // Film grain, one of four tiles per frame with a frame-hashed offset.
    const f = grade.frame | 0;
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = 0.07;
    g.fillStyle = pattern(g, tex.grain[f & 3]);
    const ox = hash(f, 1) * 256, oy = hash(f, 2) * 256;
    g.save(); g.translate(-ox, -oy); g.scale(s, s); g.fillRect(0, 0, (w + 256) / s, (h + 256) / s); g.restore();
    g.globalAlpha = 1;
  }

  g.globalCompositeOperation = 'source-over';
  if ((grade.fade || 0) > 0.001) {
    g.globalAlpha = Math.min(1, grade.fade);
    g.fillStyle = rgba(mix(P.night, [0, 0, 0], 0.7));
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
  }
}
