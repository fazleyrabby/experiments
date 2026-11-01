// Low-angle waterline shot: the boat above, its rippled reflection below.
// The reflection is rendered separately, so it can hold someone the upper world does not.
import { P, mix, rgba } from '../core/color.js';
import { makeCanvas } from '../core/textures.js';
import { drawBoat, drawFisherman, drawDaughter, drawSmallBottle } from '../art/figures.js';
import { drawRipples, drawRain, glow } from '../art/atmos.js';

let bufA = null, bufR = null;
function buffers(w, h) {
  if (!bufA || bufA.width !== w || bufA.height !== h) { bufA = makeCanvas(w, h); bufR = makeCanvas(w, h); }
  return [bufA, bufR];
}

// p: { t, wl (frac), sky(g), boatX (frac), scale (u per boat unit), man, girl: {a, x, seated}, ripple, rain, rainWarm,
//      rim, girlRim, tint, flash, onWater(g) }
export function reflectionShot(g, V, p) {
  const { w, h, u, t } = V;
  const wl = p.wl * h;
  const sc = p.scale * u;
  const bx = p.boatX * w;
  const [A, R] = buffers(w, h);

  const upper = (gg, withGirl) => {
    gg.setTransform(1, 0, 0, 1, 0, 0);
    gg.globalAlpha = 1;
    gg.globalCompositeOperation = 'source-over';
    gg.clearRect(0, 0, w, h);
    p.sky(gg);
    const bob = Math.sin(t * 1.2) * 1.2 * sc * (p.bob ?? 1);
    if (V.layers && V.layers.figures === false) return;
    gg.save();
    gg.translate(bx, wl + bob);
    gg.rotate(Math.sin(t * 0.9) * 0.02 * (p.bob ?? 1));
    gg.scale(sc, sc);
    drawBoat(gg, {
      t, wind: p.wind ?? 0.3, lantern: p.lantern ?? 0.8, crate: 0, ropeWhip: p.whip || 0, rim: p.rim || P.amber, rimA: 0.9, light: p.lightSide ?? -1, px: sc,
      figure: () => {
        gg.save();
        gg.translate(p.man.x ?? -14, -15);
        drawFisherman(gg, { t, wind: p.wind ?? 0.3, px: sc, ...p.man,
          bottle: p.man.bottle ? (hx, hy) => drawSmallBottle(gg, hx, hy, 1, { t, glow: 0, cork: false }) : null,
        }, undefined, p.rim || P.amber, p.lightSide ?? -1, -0.6, 0.9);
        gg.restore();
        if (withGirl && p.girl && p.girl.a > 0.01) {
          gg.save();
          gg.globalAlpha = p.girl.a;
          gg.translate(p.girl.x ?? 6, -15);
          gg.scale(1.15, 1.15);
          glow(gg, 0, -16, 34, p.girlRim || P.parch, 0.45);
          drawDaughter(gg, { t, wind: p.wind ?? 0.3, seated: p.girl.seated ? 1 : 0, px: sc / 2.6 }, mix(mix(P.teal, P.parch, 0.4), P.night, 0.2), p.girlRim || P.parch, 1, -0.6, 1);
          gg.restore();
        }
      },
    });
    gg.restore();
  };
  upper(A.getContext('2d'), false);
  upper(R.getContext('2d'), true);

  // Upper world.
  g.drawImage(A, 0, 0, w, wl, 0, 0, w, wl);

  // Reflection: mirrored slices with a travelling ripple offset.
  const slice = Math.max(2, Math.round(3 * u));
  const amp = (p.ripple ?? 1) * 7 * u;
  for (let y = wl; y < h; y += slice) {
    const d = (y - wl) / (h - wl);
    const sy = wl - (y - wl) * 0.92;
    if (sy < 0) break;
    const off = Math.sin(y * 0.045 / u + t * 2.6) * amp * (0.3 + d * 1.4) + Math.sin(y * 0.11 / u - t * 4.1) * amp * 0.4 * d;
    g.save();
    g.translate(off, y + slice);
    g.scale(1, -1);
    g.drawImage(R, 0, Math.max(0, sy - slice * 0.92), w, slice * 0.92, 0, 0, w, slice);
    g.restore();
  }
  // Water body over the reflection: darker with depth, tinted.
  const tint = p.tint || P.teal;
  const wg = g.createLinearGradient(0, wl, 0, h);
  wg.addColorStop(0, rgba(mix(tint, P.night, 0.3), 0.25));
  wg.addColorStop(0.4, rgba(mix(tint, P.night, 0.55), 0.45));
  wg.addColorStop(1, rgba(P.night, 0.78));
  g.fillStyle = wg;
  g.fillRect(0, wl, w, h - wl);
  // Waterline glint.
  g.save();
  g.globalCompositeOperation = 'screen';
  const lg = g.createLinearGradient(0, 0, w, 0);
  lg.addColorStop(0, rgba(P.parch, 0));
  lg.addColorStop(0.5, rgba(mix(P.parch, P.amber, 0.4), 0.35 + (p.flash || 0) * 0.4));
  lg.addColorStop(1, rgba(P.parch, 0));
  g.fillStyle = lg;
  g.fillRect(0, wl - 0.8 * u, w, 1.6 * u);
  g.restore();
  if (p.onWater) p.onWater(g, { wl, bx, sc });
  if (p.ripples) drawRipples(g, V, { t, y0: wl + 6 * u, y1: h, count: p.ripples, a: 0.28, color: mix(P.parch, tint, 0.3) });
  if (p.rain) drawRain(g, V, { t, amount: p.rain, wind: p.rainWind ?? 0.12, lightX: bx, warm: p.rainWarm ?? 0.5, seed: 31 });
  return { wl, bx, sc };
}

// A single expanding ring on the water (used to erase her reflection).
export function ring(g, V, x, y, k, a) {
  if (k <= 0 || k >= 1) return;
  const { u } = V;
  const r = k * 420 * u;
  g.save();
  g.strokeStyle = rgba(P.parch, a * (1 - k));
  g.lineWidth = 2 * u * (1 - k * 0.6);
  g.beginPath(); g.ellipse(x, y, r, r * 0.2, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = rgba(P.parch, a * 0.5 * (1 - k));
  g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.14, 0, 0, Math.PI * 2); g.stroke();
  g.restore();
}
