// Scene 2 — The Trade: a storm released over the coast, rain on the village, a match cut, gold.
import { P, mix, rgba } from '../core/color.js';
import { easeInOut, easeOut, lerp, ramp, clamp, hash, TAU } from '../core/math.js';
import { seascape, camera } from './seascape.js';
import { drawCoast, drawVillageClose } from '../art/village.js';
import { drawSky, drawCloud, cloudSprite, spriteRes, drawHaze } from '../art/sky.js';
import { drawRain, drawMotes, glow, drawMist } from '../art/atmos.js';
import { drawBottle } from '../art/bottle.js';
import { drawGrip, drawPalm, drawGivingHand } from '../art/hands.js';
import { BEATS, at } from '../timeline.js';

// Amber vapour ribbon from a bottle to the sky: several wavering strands, drawn up to `prog`.
export function vapour(g, V, a, b, prog, t, width = 1, alpha = 1) {
  if (prog <= 0.001 || alpha <= 0.001) return;
  const { u } = V;
  const c1 = [a[0] + (b[0] - a[0]) * 0.1, a[1] - (a[1] - b[1]) * 0.9];
  const c2 = [b[0] - (b[0] - a[0]) * 0.35, b[1] + (a[1] - b[1]) * 0.05];
  const pt = (k) => {
    const m = 1 - k;
    return [m * m * m * a[0] + 3 * m * m * k * c1[0] + 3 * m * k * k * c2[0] + k * k * k * b[0],
      m * m * m * a[1] + 3 * m * m * k * c1[1] + 3 * m * k * k * c2[1] + k * k * k * b[1]];
  };
  g.save();
  g.globalCompositeOperation = 'screen';
  g.lineCap = 'round';
  const N = 40;
  for (let s = 0; s < 6; s++) {
    for (let i = 0; i < N; i++) {
      const k0 = i / N, k1 = (i + 1) / N;
      if (k0 > prog) break;
      const p0 = pt(k0), p1 = pt(Math.min(k1, prog));
      const wob = (k) => Math.sin(t * (1.6 + s * 0.3) + k * 9 + s * 1.7) * (6 + k * 40) * u * width;
      const tail = clamp((prog - k0) * 6);
      g.strokeStyle = rgba(s % 2 ? P.amber : mix(P.orange, P.amber, 0.5), 0.16 * alpha * tail * (1 - k0 * 0.4));
      g.lineWidth = (2 + k0 * 26 + s * 2) * u * width;
      g.beginPath();
      g.moveTo(p0[0] + wob(k0), p0[1] + wob(k0 + 0.3) * 0.4);
      g.lineTo(p1[0] + wob(k1), p1[1] + wob(k1 + 0.3) * 0.4);
      g.stroke();
    }
  }
  g.restore();
  const head = pt(prog);
  glow(g, head[0], head[1], 60 * u * width, P.amber, 0.25 * alpha);
  return { head, pt };
}

function handScreen(V, b, raise = 1, bottleScale = 1) {
  // Approximate bottle-neck position for a standing fisherman (see drawFisherman).
  const sc = b.scale * V.u;
  return [b.x * V.w + sc * ((b.man.x ?? -14) + 19.4), b.y * V.h + sc * (-15 - 62 - 15 * bottleScale) * raise];
}

export const shots = {
  '2A'(g, V) {
    const pt = V.portrait;
    const t = V.t;
    const k = easeInOut(V.k);
    const rel = ramp(t, BEATS.release, BEATS.release + 3.6);
    const grow = (d) => easeOut(ramp(t, at(12 + d), at(15 + d)));
    const sun = { x: pt ? 0.3 : 0.32, y: pt ? 0.6 : 0.62, r: 0.7, a: 0.9 };
    const s = {
      horizon: pt ? 0.6 : 0.62, warm: 0.9, sun, sunFront: 0.18,
      streaks: { count: 18, y: pt ? 0.58 : 0.6, spread: 0.04, color: P.orange, color2: P.amber, a: 0.3, seed: 9 },
      clouds: [
        { seed: 21, shape: 'bank', x: 0.2, y: pt ? 0.6 : 0.62, width: 0.9, a: 0.8, drift: 0.3 },
        { seed: 31, x: pt ? 0.7 : 0.72, y: pt ? 0.5 : 0.53, width: 0.55, grow: grow(0), fromX: 0.78, fromY: 0.4, mood: 'storm' },
        { seed: 33, x: pt ? 0.9 : 0.86, y: pt ? 0.52 : 0.55, width: 0.62, grow: grow(0.5), fromX: 0.78, fromY: 0.4, mood: 'storm' },
        { seed: 35, x: pt ? 0.55 : 0.98, y: pt ? 0.52 : 0.54, width: 0.5, grow: grow(1.0), fromX: 0.78, fromY: 0.4, mood: 'storm' },
      ],
      lightX: sun.x, light: 0.7, amp: 0.7,
      under: (gg) => {
        drawCoast(gg, V, { x0: V.w * (pt ? 0.45 : 0.55), x1: V.w * 1.1, y: (pt ? 0.6 : 0.62) * V.h, h: V.h * (pt ? 0.05 : 0.085), t, lights: 0.4 + rel * 0.6, scale: pt ? 0.8 : 1 });
        // Rain falling on the coast beneath the new clouds.
        const ra = ramp(t, at(13.6), at(15.0));
        if (ra > 0) {
          gg.save();
          gg.beginPath(); gg.rect(V.w * (pt ? 0.5 : 0.62), 0, V.w, (pt ? 0.6 : 0.62) * V.h); gg.clip();
          drawRain(gg, V, { t, amount: ra * 0.9, wind: 0.12, lightX: V.w * 0.8, warm: 0.9, top: V.h * 0.35, seed: 4, lenScale: 0.6 });
          gg.restore();
        }
      },
      boat: { x: pt ? 0.3 : 0.24, y: pt ? 0.84 : 0.88, scale: pt ? 2.6 : 2.4, crate: 6, lantern: 0.9, wind: 0.35,
        man: { raise: 1, look: 0.7, bottle: { glow: 1 - rel * 0.85, cork: false } } },
      mist: { y: pt ? 0.61 : 0.63, n: 5, a: 0.08 },
    };
    camera(g, V, lerp(1.05, 1.0, k), V.w / 2, V.h / 2, lerp(0, -V.w * 0.02, k), 0);
    seascape(g, V, s);
    const a = handScreen(V, s.boat, 1, 1);
    const b = [V.w * 0.78, V.h * (pt ? 0.38 : 0.4)];
    vapour(g, V, a, b, rel, t, pt ? 0.8 : 1, 1 - ramp(t, at(14.6), at(15.4)) * 0.6);
    drawMotes(g, V, { t, t0: BEATS.release, n: Math.round(26 * rel * (1 - ramp(t, at(14), at(15.4)))), x: lerp(a[0], b[0], 0.5), y: lerp(a[1], b[1], 0.5), spread: V.w * 0.3, rise: 60 * V.u, drift: 40 * V.u, seed: 3 });
  },

  '2B'(g, V) {
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const lh = { x: w * (pt ? 0.68 : 0.72), top: h * (pt ? 0.22 : 0.2), base: h * (pt ? 0.74 : 0.8), w: w * (pt ? 0.12 : 0.07) };
    camera(g, V, lerp(1.0, 1.04, k), lh.x, h * 0.5, (lh.x - w / 2) * 0, 0);
    drawSky(g, V, { horizon: h * 0.7, warm: 0.7, cold: 0.15, sun: { x: w * 0.2, y: h * 0.7, r: 700 * u, a: 0.6 } });
    const res = spriteRes(V, 1400 * u);
    const sky = [[45, 0.15, 0.42, 1.2], [47, 0.6, 0.38, 1.3], [49, 1.05, 0.4, 1.2]];
    for (const [seed, x, y, wd] of sky) drawCloud(g, cloudSprite(seed, 'storm', 'bank', res, Math.PI * 0.5), w * x + t * 6 * u, h * y, wd * 1000 * u, 0.95);
    drawHaze(g, V, h * 0.62, 80 * u, mix(P.amber, P.rust, 0.4), 0.3);
    drawRain(g, V, { t, amount: 0.55, wind: 0.1, lightX: w * 0.4, warm: 0.5, seed: 7, bottom: h * 0.75 });
    drawVillageClose(g, V, { t, lights: 1, lh });
    drawRain(g, V, { t, amount: 1, wind: 0.14, lightX: w * 0.45, warm: 0.85, seed: 8 });
    drawMist(g, V, { t, n: 4, y: h * 0.82, spread: h * 0.06, color: mix(P.parch, P.rust, 0.3), a: 0.1, seed: 2 });
  },

  '2C'(g, V) {
    // Match cut: the lighthouse becomes the empty bottle, same place, same height.
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const k = easeInOut(V.k);
    const lh = { x: w * (pt ? 0.68 : 0.72), top: h * (pt ? 0.22 : 0.2), base: h * (pt ? 0.74 : 0.8) };
    drawSky(g, V, { horizon: h * 0.82, warm: 0.8, cold: 0.1, sun: { x: w * 0.3, y: h * 0.8, r: 800 * u, a: 0.7 } });
    const res = spriteRes(V, 1200 * u);
    drawCloud(g, cloudSprite(31, 'storm', 'tower', res, Math.PI * 0.75), w * 0.25 + t * 4 * u, h * 0.8, 1100 * u, 0.85);
    drawCloud(g, cloudSprite(21, 'warm', 'bank', res), w * 0.85, h * 0.83, 900 * u, 0.8);
    drawHaze(g, V, h * 0.82, 40 * u, mix(P.amber, P.parch, 0.3), 0.6);
    g.fillStyle = rgba(mix(P.teal, P.night, 0.3));
    g.fillRect(0, h * 0.82, w, h);
    // Distant rain veil over the coast.
    g.save();
    g.beginPath(); g.rect(0, h * 0.55, w * 0.5, h * 0.27); g.clip();
    drawRain(g, V, { t, amount: 0.5, wind: 0.08, lightX: w * 0.3, warm: 0.9, top: h * 0.5, seed: 12, lenScale: 0.5 });
    g.restore();
    // The bottle, held up by its body.
    const sc = (lh.base - lh.top) / 92;
    g.save();
    g.translate(lh.x, lh.base + lerp(0, -4, k) * u);
    g.rotate(lerp(0.0, -0.03, k));
    g.scale(sc, sc);
    drawBottle(g, { t, empty: true, glow: 0.15, cork: 1, tag: true, wind: 0.3 });
    // Rain beads on the glass.
    g.fillStyle = rgba(P.parch, 0.6);
    for (let i = 0; i < 14; i++) {
      const bx = -20 + hash(i, 1) * 40, by = -6 - hash(i, 2) * 50 + ((t * 6 * hash(i, 3)) % 8);
      g.beginPath(); g.ellipse(bx, by, 0.7, 1, 0, 0, TAU); g.fill();
    }
    drawGrip(g, { side: 1, y: -34, px: sc, rim: P.amber });
    // Sleeve to the frame edge.
    g.fillStyle = rgba(mix(P.night, P.teal, 0.18));
    g.beginPath();
    g.moveTo(46, 2); g.lineTo(150, 70); g.lineTo(150, 200); g.lineTo(18, 200); g.lineTo(22, 12); g.closePath();
    g.fill();
    g.strokeStyle = rgba(P.amber, 0.4);
    g.lineWidth = 1.6 / sc;
    g.beginPath(); g.moveTo(22, 12); g.lineTo(46, 2); g.stroke();
    g.restore();
    drawRain(g, V, { t, amount: 0.35, wind: 0.1, lightX: lh.x, warm: 0.7, seed: 13 });
  },

  '2D'(g, V) {
    // Gold: three coins fall from a pale hand into his open palm.
    const { w, h, u, t } = V;
    const pt = V.portrait;
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, rgba(mix(P.night, P.rust, 0.35)));
    bg.addColorStop(0.7, rgba(mix(P.night, P.teal, 0.3)));
    bg.addColorStop(1, rgba(P.night));
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    // Bokeh: village windows out of focus behind.
    g.save();
    g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 16; i++) {
      const x = w * hash(i, 1), y = h * (0.15 + hash(i, 2) * 0.5);
      const r = (24 + hash(i, 3) * 50) * u;
      const a = 0.08 + hash(i, 4) * 0.12 + 0.03 * Math.sin(t * 2 + i);
      g.fillStyle = rgba(hash(i, 5) < 0.6 ? P.amber : P.orange, a);
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.restore();
    drawRain(g, V, { t, amount: 0.4, wind: 0.08, lightX: w * 0.5, warm: 0.6, seed: 21, lenScale: 0.7 });

    const palmS = (pt ? 6.4 : 5.6) * u;
    const palm = [w * (pt ? 0.2 : 0.3), h * (pt ? 0.66 : 0.7)];
    const cup = [palm[0] + 40 * palmS, palm[1] - 6 * palmS];
    // Giving hand from the top.
    const give = [cup[0] + 2 * palmS, h * (pt ? 0.3 : 0.24)];
    const open = ramp(t, at(20.1), at(20.6));
    g.save();
    g.translate(give[0], give[1] - (1 - ramp(t, at(20.0), at(20.4))) * 30 * u + ramp(t, at(21.2), at(22)) * -40 * u);
    g.scale(palmS * 0.9, palmS * 0.9);
    drawGivingHand(g, { open, px: palmS });
    g.restore();
    // His palm, then the coins landing in it.
    g.save();
    g.translate(palm[0], palm[1]);
    g.rotate(-0.08);
    g.scale(palmS, palmS);
    drawPalm(g, { curl: ramp(t, at(21.0), at(21.9)) * 0.6, px: palmS });
    g.restore();
    // Coins.
    BEATS.coins.forEach((tl, i) => {
      const ts = tl - 0.34;
      if (t < ts) return;
      const sx = give[0] + (i - 1) * 3 * palmS, sy = give[1] + 22 * palmS;
      const ex = cup[0] + (i - 1) * 8 * palmS, ey = cup[1] - 3 * palmS - (i === 1 ? 2.2 : 0) * palmS;
      let x, y, spin;
      if (t < tl) {
        const k = (t - ts) / (tl - ts);
        x = lerp(sx, ex, k); y = lerp(sy, ey, k * k);
        spin = (t - ts) * 22 + i;
      } else {
        const d = t - tl;
        x = ex; y = ey - Math.abs(Math.sin(d * 18)) * Math.exp(-d * 9) * 8 * palmS;
        spin = Math.PI / 2 + Math.exp(-d * 6) * Math.sin(d * 30) * 0.5;
      }
      const r = 4.6 * palmS;
      const sq = Math.abs(Math.sin(spin));
      glow(g, x, y, r * 3, P.amber, 0.25);
      g.fillStyle = rgba(mix(P.amber, P.rust, 0.25));
      g.beginPath(); g.ellipse(x, y, r, Math.max(1, r * (t < tl ? sq : 0.42)), 0, 0, TAU); g.fill();
      g.strokeStyle = rgba(mix(P.amber, P.parch, 0.5), 0.9);
      g.lineWidth = 0.8 * palmS * 0.4;
      g.beginPath(); g.ellipse(x, y, r * 0.75, Math.max(0.5, r * 0.75 * (t < tl ? sq : 0.42)), 0, Math.PI, TAU); g.stroke();
      // Glint on landing.
      const gl = t >= tl ? Math.exp(-(t - tl) * 5) : 0;
      if (gl > 0.02) {
        g.save();
        g.globalCompositeOperation = 'screen';
        g.strokeStyle = rgba(P.parch, gl);
        g.lineWidth = 1.2 * u;
        const L = r * 2.4 * gl;
        g.beginPath(); g.moveTo(x - L, y - r * 0.3); g.lineTo(x + L, y - r * 0.3); g.moveTo(x, y - r * 0.3 - L); g.lineTo(x, y - r * 0.3 + L); g.stroke();
        g.restore();
      }
    });
  },
};
