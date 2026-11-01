// Shared open-sea set: sky, cloud towers, haze, ocean, boat and fisherman, rain and gulls.
// Shots describe a composition with plain parameters; this draws it with consistent depth order.
import { P, mix, rgba } from '../core/color.js';
import { hash, clamp } from '../core/math.js';
import { drawSky, drawCloud, cloudSprite, spriteRes, drawHaze, drawStreaks } from '../art/sky.js';
import { drawOcean, surfaceAt, drawMirrorColumn } from '../art/ocean.js';
import { drawBoat, drawFisherman, drawSmallBottle } from '../art/figures.js';
import { drawRain, drawMist, glow } from '../art/atmos.js';

// Apply a push/pull camera: zoom about a focus point given in screen pixels.
export function camera(g, V, zoom, fx, fy, ox = 0, oy = 0) {
  g.translate(V.w / 2 + ox, V.h / 2 + oy);
  g.scale(zoom, zoom);
  g.translate(-fx, -fy);
}

export function drawGulls(g, V, p) {
  const { u } = V;
  g.save();
  g.strokeStyle = rgba(p.color || mix(P.night, P.rust, 0.3), p.a ?? 0.8);
  g.lineCap = 'round';
  for (let i = 0; i < p.n; i++) {
    const s = i * 13 + (p.seed || 0);
    const x = p.x + (hash(s, 1) - 0.5) * p.spread + p.t * (10 + hash(s, 2) * 12) * u * (p.dir ?? 1);
    const y = p.y + (hash(s, 3) - 0.5) * p.spread * 0.3 + Math.sin(p.t * 0.6 + s) * 6 * u;
    const sz = (4 + hash(s, 4) * 4) * u * (p.size ?? 1);
    const flap = Math.sin(p.t * (5 + hash(s, 5) * 2) + s);
    g.lineWidth = Math.max(0.8, sz * 0.18);
    g.beginPath();
    g.moveTo(x - sz, y - flap * sz * 0.5);
    g.quadraticCurveTo(x - sz * 0.4, y - sz * 0.35 - flap * sz * 0.2, x, y);
    g.quadraticCurveTo(x + sz * 0.4, y - sz * 0.35 - flap * sz * 0.2, x + sz, y - flap * sz * 0.5);
    g.stroke();
  }
  g.restore();
}

// s: composition (see shots). Returns { boatX, boatY, scale, hand } for overlays.
export function seascape(g, V, s) {
  const { w, h, u, t } = V;
  const hz = s.horizon * h;
  const camX = s.camX || 0;
  const flash = s.flash || 0;

  // Sky.
  g.save();
  g.translate(camX * 0.05, 0);
  drawSky(g, V, { horizon: hz, warm: s.warm, cold: s.cold, sun: s.sun && { ...s.sun, x: s.sun.x * w, y: s.sun.y * h, r: s.sun.r * u * 1000 } });
  g.restore();

  // Far streaks and banks (behind towers).
  if (s.streaks) drawStreaks(g, V, { ...s.streaks, y: s.streaks.y * h, spread: s.streaks.spread * h, drift: t * 6 * u });

  // Cloud masses, back to front.
  for (const c of s.clouds || []) {
    let light = c.light ?? s.cloudLight ?? -Math.PI * 0.72;
    if (c.light === undefined && s.sun && s.sunLight !== false) {
      // Light each mass toward the sun from its resting position (stable, so the sprite stays cached).
      const cy = c.y * h - c.width * u * 1000 * 0.45;
      light = Math.round(Math.atan2(s.sun.y * h - cy, (s.sun.x - c.x) * w) * 20) / 20;
    }
    const spr = cloudSprite(c.seed, c.mood || 'warm', c.shape || 'tower', spriteRes(V, c.width * u * 1000 * Math.max(1, s.zoom || 1)), light);
    const grow = c.grow ?? 1;
    if (grow <= 0.001) continue;
    const width = c.width * u * 1000 * grow;
    const px = c.x * w + (c.drift || 0) * t * u * 10 + camX * (c.par ?? 0.25) + (c.fromX !== undefined ? (c.fromX * w - c.x * w) * (1 - grow) : 0);
    const py = c.y * h + (c.fromY !== undefined ? (c.fromY * h - c.y * h) * (1 - grow) : 0);
    const lit = flash * (c.lit ?? 1) * (0.5 + 0.5 * clamp(1 - Math.abs(px - (s.flashX ?? 0.5) * w) / (w * 0.6)));
    drawCloud(g, spr, px, py, width, (c.a ?? 1) * Math.min(1, grow * 1.6), lit);
  }

  if (s.sunFront) {
    // Glow bleeding over the cloud base.
    g.save();
    g.globalCompositeOperation = 'screen';
    glow(g, s.sun.x * w, s.sun.y * h, s.sunFront * u * 1000, P.amber, 0.35);
    g.restore();
  }
  if (s.under) s.under(g);

  drawHaze(g, V, hz, 26 * u, mix(mix(P.amber, P.parch, 0.4), P.cold, s.cold || 0), s.haze ?? 0.55);

  const ocean = {
    horizon: hz, t: t * (s.seaSpeed ?? 1), amp: s.amp ?? 1, stillness: s.still || 0,
    warm: s.warm ?? 1, cold: s.cold || 0, lightX: (s.lightX ?? 0.5) * w, light: s.light ?? 0.7,
    lightColor: s.lightColor, camX, contour: s.contour, foam: s.foam, lightSpread: s.lightSpread,
  };

  const column = () => {
    if ((s.light ?? 0.7) > 0.05) drawMirrorColumn(g, V, ocean.lightX, hz, h * 1.2, (s.columnW ?? 0.09) * w, mix(P.amber, P.parch, 0.2), (s.light ?? 0.7) * (s.column ?? 0.22));
  };
  const b = V.layers && V.layers.figures === false ? null : s.boat;
  if (!b) {
    drawOcean(g, V, ocean);
    column();
  } else {
    const bx = b.x * w + camX, by = b.y * h;
    const sc = b.scale * u;
    const surf = surfaceAt(V, ocean, bx, by);
    const bob = surf.dy + Math.sin(t * 1.3) * 1.2 * sc * (b.bob ?? 1);
    const roll = surf.slope * (b.roll ?? 1) + Math.sin(t * 0.9) * 0.025 * (b.bob ?? 1);
    drawOcean(g, V, { ...ocean, part: 'back', split: by });
    column();
    // Reflection glow of the lantern / bottle under the boat.
    if (b.lantern) glow(g, bx - 60 * sc, by + 6 * sc, 40 * sc, P.amber, 0.12 * b.lantern);
    g.save();
    g.translate(bx, by + bob);
    g.rotate(roll);
    g.scale(sc, sc);
    let hand = null;
    drawBoat(g, {
      t, wind: b.wind ?? 0.3, lantern: b.lantern ?? 0.8, crate: b.crate || 0, glow: b.glow, ropeWhip: b.whip, px: sc,
      rim: s.rim || P.amber, rimA: s.rimA ?? 0.8, light: s.lightSide ?? -1,
      figure: () => {
        if (!b.man) return;
        g.save();
        g.translate(b.man.x ?? -14, -15);
        const holding = b.man.bottle;
        const res2 = drawFisherman(g, { t, wind: b.wind ?? 0.3, px: sc, ...b.man,
          bottle: holding ? (hx, hy) => drawSmallBottle(g, hx, hy, b.man.bottleScale ?? 1, { t, glow: holding.glow ?? 1, cork: holding.cork, wind: b.wind }) : null,
        }, undefined, s.rim || P.amber, s.lightSide ?? -1, -0.6, s.rimA ?? 0.9);
        hand = res2.hand.map((v, i) => v + (i ? -15 : b.man.x ?? -14));
        if (b.extra) b.extra(g);
        g.restore();
      },
    });
    g.restore();
    drawOcean(g, V, { ...ocean, part: 'front', split: by });
    s._boat = { x: bx, y: by + bob, sc, roll, hand };
  }

  if (s.mist) drawMist(g, V, { t, n: s.mist.n ?? 6, y: s.mist.y * h, spread: (s.mist.spread ?? 0.06) * h, color: s.mist.color || mix(P.parch, P.teal, 0.4), a: s.mist.a ?? 0.12, seed: 3 });
  if (s.gulls) drawGulls(g, V, { ...s.gulls, t, x: s.gulls.x * w, y: s.gulls.y * h, spread: s.gulls.spread * w });
  if (s.rain) drawRain(g, V, { t, amount: s.rain, wind: s.rainWind ?? 0.22, lightX: (s.lightX ?? 0.5) * w, warm: s.rainWarm ?? 0.6, seed: 1 });
  return s._boat;
}
