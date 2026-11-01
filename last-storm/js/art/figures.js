// The boat, the fisherman and the daughter, drawn in local units.
// Boat: 100 units bow-to-stern, origin at the waterline centre, bow pointing +x.
// Figures: origin at the feet, up is −y. A standing man is ~60 units tall.
import { P, mix, rgba } from '../core/color.js';
import { hash, lerp, TAU } from '../core/math.js';
import { pattern, textures } from '../core/textures.js';
import { drawBottle } from './bottle.js';

const WOOD = mix(P.night, P.rust, 0.32);
const WOOD_DK = mix(P.night, P.rust, 0.12);
const COAT = mix(P.night, P.teal, 0.18);

// Draw `paint(color)` twice: once offset in the rim colour, then in the body colour.
export function rimlit(g, paint, body, rim, dx, dy, rimA = 1) {
  if (rimA > 0.01) {
    g.save();
    g.translate(dx, dy);
    g.globalAlpha *= rimA;
    paint(rgba(rim));
    g.restore();
  }
  paint(rgba(body));
}

function hullPath(g) {
  g.beginPath();
  g.moveTo(-50, -24);
  g.quadraticCurveTo(0, -12, 53, -31);
  g.quadraticCurveTo(50, -10, 40, 7);
  g.quadraticCurveTo(0, 14, -44, 7);
  g.quadraticCurveTo(-48, -6, -50, -24);
  g.closePath();
}

// o: { t, wind, lantern, crate, glow, ropeWhip, rim, rimA, light }
export function drawBoat(g, o) {
  const t = o.t || 0, wind = o.wind ?? 0.3;
  const rim = o.rim || P.amber, rimA = o.rimA ?? 0.8;
  const ld = o.light ?? -1; // light comes from left (−1) or right (+1)
  const rimU = 1.8 / (o.px || 1.8);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // Mast, yard and furled sail behind everything else in the boat.
  const sway = Math.sin(t * 1.1) * 0.8 * (0.5 + wind);
  const mx = 14, mTop = -112;
  const mastPaint = (c) => {
    g.strokeStyle = c;
    g.lineWidth = 2.6;
    g.beginPath(); g.moveTo(mx, -16); g.lineTo(mx + sway, mTop); g.stroke();
    // Crosstree.
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(mx + sway - 7, mTop + 14); g.lineTo(mx + sway + 7, mTop + 14); g.stroke();
  };
  rimlit(g, mastPaint, WOOD_DK, rim, ld * rimU, -0.6 * rimU, rimA * 0.8);

  // Pennant at the masthead.
  g.fillStyle = rgba(mix(P.orange, P.rust, 0.3));
  g.beginPath();
  g.moveTo(mx + sway, mTop);
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    g.lineTo(mx + sway - k * 16 * (0.6 + wind), mTop + 1.5 + Math.sin(t * 7 - k * 5) * 1.6 * k * (0.4 + wind));
  }
  for (let i = 8; i >= 0; i--) {
    const k = i / 8;
    g.lineTo(mx + sway - k * 16 * (0.6 + wind), mTop + 5 - k * 3 + Math.sin(t * 7 - k * 5) * 1.6 * k * (0.4 + wind));
  }
  g.fill();

  // Stays: masthead to bow and stern, sagging and tugged by wind.
  const whip = o.ropeWhip || 0;
  const rope = (x0, y0, x1, y1, sag, ph) => {
    const cx = (x0 + x1) / 2 + Math.sin(t * (2 + whip * 6) + ph) * (1 + whip * 6) + wind * 4;
    const cy = (y0 + y1) / 2 + sag + Math.cos(t * (1.6 + whip * 5) + ph) * (0.6 + whip * 4);
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
  };
  g.strokeStyle = rgba(mix(P.parch, P.rust, 0.55), 0.75);
  g.lineWidth = 0.7;
  rope(mx + sway, mTop + 2, 51, -30, 4, 0);
  rope(mx + sway, mTop + 2, -49, -25, 6, 1.3);
  rope(mx + sway, mTop + 30, -20, -20, 3, 2.1);

  // Lantern pole at the stern, lantern swinging.
  g.strokeStyle = rgba(WOOD_DK);
  g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-46, -22); g.lineTo(-50, -64); g.lineTo(-60, -66); g.stroke();
  const swing = Math.sin(t * 1.7) * 0.18 * (0.5 + wind);
  g.save();
  g.translate(-60, -66);
  g.rotate(swing);
  g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 5); g.stroke();
  const lan = o.lantern ?? 0.8;
  if (lan > 0) {
    const flick = 0.85 + 0.15 * Math.sin(t * 13.3) * Math.sin(t * 7.1);
    const lg = g.createRadialGradient(0, 9, 0, 0, 9, 22);
    lg.addColorStop(0, rgba(P.amber, 0.55 * lan * flick));
    lg.addColorStop(1, rgba(P.amber, 0));
    g.fillStyle = lg;
    g.fillRect(-22, -13, 44, 44);
    g.fillStyle = rgba(mix(P.amber, P.parch, 0.4), lan * flick);
    g.fillRect(-2, 6, 4, 6);
  }
  g.strokeStyle = rgba(WOOD_DK);
  g.lineWidth = 0.8;
  g.strokeRect(-2.6, 5, 5.2, 8);
  g.beginPath(); g.moveTo(-3, 5); g.lineTo(0, 3); g.lineTo(3, 5); g.stroke();
  g.restore();

  // Inner far gunwale (gives the hull depth), then the crate of bottles.
  g.fillStyle = rgba(WOOD_DK);
  g.beginPath();
  g.moveTo(-50, -24);
  g.quadraticCurveTo(0, -21, 53, -31);
  g.quadraticCurveTo(0, -12, -50, -24);
  g.fill();

  const crate = o.crate || 0;
  if (crate > 0) {
    for (let i = 0; i < crate; i++) {
      const bx = 26 + i * 3.4, by = -21 - (i % 2) * 0.6;
      const glowA = (o.glow ?? 1) * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
      const gg = g.createRadialGradient(bx, by - 4, 0, bx, by - 4, 7);
      gg.addColorStop(0, rgba(P.amber, 0.5 * glowA));
      gg.addColorStop(1, rgba(P.amber, 0));
      g.fillStyle = gg;
      g.fillRect(bx - 7, by - 11, 14, 14);
      g.fillStyle = rgba(mix(P.teal, P.night, 0.4), 0.95);
      g.beginPath();
      g.moveTo(bx - 1.3, by); g.lineTo(bx - 1.3, by - 5); g.quadraticCurveTo(bx - 1.3, by - 6.5, bx - 0.5, by - 7);
      g.lineTo(bx - 0.5, by - 9); g.lineTo(bx + 0.5, by - 9); g.lineTo(bx + 0.5, by - 7);
      g.quadraticCurveTo(bx + 1.3, by - 6.5, bx + 1.3, by - 5); g.lineTo(bx + 1.3, by); g.fill();
      g.fillStyle = rgba(P.amber, 0.7 * glowA);
      g.fillRect(bx - 0.7, by - 4.5, 1.4, 3);
    }
  }
  if (o.figure) o.figure();

  // Hull with rim light, planks and weathering.
  rimlit(g, (c) => { g.fillStyle = c; hullPath(g); g.fill(); }, WOOD, rim, ld * rimU, -rimU, rimA);
  g.save();
  hullPath(g);
  g.clip();
  const sh = g.createLinearGradient(0, -30, 0, 12);
  sh.addColorStop(0, rgba(mix(WOOD, P.orange, 0.25), 0.6));
  sh.addColorStop(0.5, rgba(WOOD, 0));
  sh.addColorStop(1, rgba(P.night, 0.7));
  g.fillStyle = sh;
  g.fillRect(-55, -35, 110, 50);
  g.globalAlpha = 0.35;
  g.fillStyle = pattern(g, textures().pigment);
  g.save(); g.scale(0.15, 0.15); g.fillRect(-400, -250, 800, 350); g.restore();
  g.globalAlpha = 1;
  g.strokeStyle = rgba(P.ink, 0.7);
  g.lineWidth = 0.5;
  const strake = (a, b, c) => { g.beginPath(); g.moveTo(-51, a); g.quadraticCurveTo(0, b, 54, c); g.stroke(); };
  strake(-15, -5, -20);
  strake(-6, 4, -9);
  strake(2, 10, 1);
  // Scratches and nail heads.
  g.strokeStyle = rgba(mix(P.parch, P.rust, 0.5), 0.25);
  g.lineWidth = 0.3;
  for (let i = 0; i < 14; i++) {
    const x = -44 + hash(i, 3) * 88, y = -18 + hash(i, 4) * 22;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 + hash(i, 5) * 6, y + (hash(i, 6) - 0.5) * 1.2); g.stroke();
  }
  g.fillStyle = rgba(P.ink, 0.8);
  for (let i = 0; i < 9; i++) {
    g.beginPath(); g.arc(-40 + i * 10, -13 + Math.abs(i - 4.5) * -0.6 + (i * 10 - 40) * -0.02, 0.45, 0, TAU); g.fill();
  }
  g.restore();
  // Gunwale rail catching light.
  g.strokeStyle = rgba(mix(WOOD, P.amber, 0.45));
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-50, -24); g.quadraticCurveTo(0, -12, 53, -31); g.stroke();
  g.strokeStyle = rgba(rim, 0.55 * rimA);
  g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(-50, -25); g.quadraticCurveTo(0, -13, 53, -32); g.stroke();

  // A mooring rope trailing over the side.
  g.strokeStyle = rgba(mix(P.parch, P.rust, 0.5), 0.8);
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(34, -22);
  g.bezierCurveTo(38, -14, 37 + Math.sin(t * 1.4) * 2, -4, 42 + Math.sin(t) * 2, 4);
  g.stroke();

  // Oar across the stern.
  g.strokeStyle = rgba(WOOD_DK);
  g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(-36, -30); g.lineTo(-64, -6); g.stroke();
  g.fillStyle = rgba(WOOD_DK);
  g.beginPath(); g.ellipse(-66, -4, 6, 1.8, -0.7, 0, TAU); g.fill();
}

// ——— Fisherman ———
// Tapered limb along a quadratic curve p0 → p1 (control) → p2, widths w0 → w2.
function limb(g, p0, p1, p2, w0, w2) {
  const N = 8, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const k = i / N, a = 1 - k;
    const x = a * a * p0[0] + 2 * a * k * p1[0] + k * k * p2[0];
    const y = a * a * p0[1] + 2 * a * k * p1[1] + k * k * p2[1];
    const dx = 2 * a * (p1[0] - p0[0]) + 2 * k * (p2[0] - p1[0]);
    const dy = 2 * a * (p1[1] - p0[1]) + 2 * k * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w2 - w0) * k) / 2;
    L.push([x - (dy / len) * w, y + (dx / len) * w]);
    R.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  g.beginPath();
  g.moveTo(L[0][0], L[0][1]);
  for (const q of L) g.lineTo(q[0], q[1]);
  for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  g.closePath();
  g.fill();
}

// o: { t, raise (0..1), seated (0..1), look (−1 down .. 1 up), wind, bottle: fn(handX, handY), px: pixels per unit }
export function drawFisherman(g, o, body = COAT, rim = P.amber, rimDx = -1, rimDy = -0.6, rimA = 0.9) {
  const t = o.t || 0, wind = o.wind ?? 0.3, raise = o.raise ?? 0, seat = o.seated ?? 0, look = o.look ?? 0;
  const breath = Math.sin(t * 1.3) * 0.35;
  const rimU = 1.8 / (o.px || 1.8);
  const hip = [0, lerp(-22, -9, seat)];
  const lean = 0.06 + seat * 0.2;
  const flap = Math.sin(t * 3.1) * wind * 1.4;
  // Torso-local → figure coordinates (rotate by lean about the hip).
  const cs = Math.cos(lean), sn = Math.sin(lean);
  const T = (x, y) => [hip[0] + x * cs - y * sn, hip[1] + x * sn + y * cs + (y < -18 ? breath * ((-y - 18) / 12) : 0)];
  const head = T(7.5, -32.5);
  const shoulder = T(4, -23.5);
  const hand = [lerp(shoulder[0] + 6, shoulder[0] + 14, raise), lerp(shoulder[1] + 14, shoulder[1] - 17, raise)];
  const elbow = [lerp(shoulder[0] + 4, shoulder[0] + 10, raise), lerp(shoulder[1] + 8, shoulder[1] - 3, raise)];

  const paint = (c) => {
    g.fillStyle = c;
    g.strokeStyle = c;
    g.lineJoin = 'round';
    g.lineCap = 'round';
    // Back arm, mostly hidden behind the body.
    const bs = T(-2, -22);
    limb(g, bs, [bs[0] - 3, bs[1] + 8], [bs[0] + 1 + seat * 7, bs[1] + 15], 4.4, 3.2);
    // Legs.
    if (seat > 0.5) {
      limb(g, [hip[0] - 1, hip[1] + 1], [hip[0] + 6, hip[1] - 4], [hip[0] + 11, hip[1] - 2], 6, 5);
      limb(g, [hip[0] + 11, hip[1] - 2], [hip[0] + 12, hip[1] + 4], [hip[0] + 12, hip[1] + 9], 4.6, 4);
      g.beginPath(); g.ellipse(hip[0] + 13.5, hip[1] + 9, 3.4, 1.4, 0, 0, TAU); g.fill();
    } else {
      limb(g, [-2.5, -20], [-2.8, -10], [-2.6, -1], 4.6, 3.8);
      limb(g, [2.5, -20], [2.8, -10], [3.2, -1], 4.6, 3.8);
      g.beginPath(); g.ellipse(-1.5, -0.6, 3.4, 1.3, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(4.6, -0.6, 3.4, 1.3, 0, 0, TAU); g.fill();
    }
    // Coat: hunched back, turned-up collar, flared hem flapping in the wind.
    const hemY = seat > 0.5 ? 2 : 11;
    const pts = [
      T(-9 - flap, hemY), T(-10, 0), T(-10.5, -10), T(-9.5, -19), T(-5.5, -24.5), T(-1.5, -27.5),
      T(0.5, -30.5), T(4.5, -30), T(7.5, -27.5), T(8.6, -22), T(8, -12), T(7.6, 0), T(8.4 + flap * 0.4, hemY),
    ];
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    // Hem with a couple of folds.
    const h0 = pts[pts.length - 1], h1 = pts[0];
    g.quadraticCurveTo((h0[0] + h1[0]) / 2 + 1, Math.max(h0[1], h1[1]) + 1.2 + flap * 0.4, h1[0], h1[1]);
    g.fill();
    // Head.
    g.save();
    g.translate(head[0], head[1]);
    g.rotate(lean * 0.4 - look * 0.32);
    g.beginPath(); g.ellipse(0.4, 0.2, 3.9, 4.4, 0, 0, TAU); g.fill();
    g.beginPath();
    g.moveTo(2.2, -3.2); g.lineTo(3.7, -2.6); g.lineTo(4.5, -1.2); g.lineTo(4.6, -0.5);
    g.quadraticCurveTo(7.6, 1.2, 6.9, 1.7); g.lineTo(4.8, 1.9); g.lineTo(4.6, 2.6);
    // Beard: full, ending in a wispy point that moves in the wind.
    g.quadraticCurveTo(6, 6, 4.4 - wind * 0.8, 10 + Math.sin(t * 2.3) * 0.3);
    g.quadraticCurveTo(2, 7.2, 0.4, 7.6);
    g.quadraticCurveTo(-1.4, 5.4, -2.6, 3.2);
    g.lineTo(0, 0);
    g.closePath();
    g.fill();
    // Sou'wester: low crown, wide brim sloping down all round, long back flap.
    g.beginPath();
    g.moveTo(-4.4, -1.8);
    g.bezierCurveTo(-4.6, -6.6, -1.6, -7.8, 0.6, -7.8);
    g.bezierCurveTo(3.6, -7.8, 4.8, -6, 4.6, -2.8);
    g.quadraticCurveTo(8.6, -2.6, 11.4, -0.2);
    g.quadraticCurveTo(10.6, 0.4, 9.6, 0.2);
    g.quadraticCurveTo(6.6, -1, 3.8, -1.2);
    g.quadraticCurveTo(-1, -1.2, -4.6, 0.6);
    g.quadraticCurveTo(-8, 3.4, -11 - wind * 1.2, 7 + Math.sin(t * 2) * 0.35);
    g.quadraticCurveTo(-11.2, 5.4, -10, 3.4);
    g.quadraticCurveTo(-7.4, -0.4, -4.4, -1.8);
    g.closePath();
    g.fill();
    g.restore();
    // Scarf tail streaming downwind.
    const sc0 = T(0, -28.5);
    g.lineWidth = 1.7;
    g.beginPath();
    g.moveTo(sc0[0], sc0[1]);
    g.bezierCurveTo(sc0[0] - 4, sc0[1] + 1, sc0[0] - 8 - wind * 6, sc0[1] + 2 + Math.sin(t * 5) * 1.2, sc0[0] - 11 - wind * 10, sc0[1] + 4 + Math.sin(t * 4.2) * 1.8);
    g.stroke();
    // Front arm: tapered sleeve, cuff, fist.
    limb(g, shoulder, elbow, hand, 5.2, 3.6);
    g.beginPath(); g.ellipse(hand[0], hand[1], 2.2, 2.6, raise * -0.4, 0, TAU); g.fill();
  };
  rimlit(g, paint, body, rim, rimDx * rimU, rimDy * rimU, rimA);
  // Ink details: coat seam and collar fold.
  g.strokeStyle = rgba(P.ink, 0.55);
  g.lineWidth = Math.max(0.25, rimU * 0.3);
  const a = T(6.5, -26), b = T(6.2, -12), c = T(6.4, seat > 0.5 ? 1 : 10);
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0] - 0.5, b[1], c[0], c[1]); g.stroke();
  if (o.bottle) o.bottle(hand[0], hand[1], raise);
  return { hand, head };
}

// ——— Daughter ——— (≈ 36 units tall; long hair, simple dress)
export function drawDaughter(g, o, body = mix(P.night, P.teal, 0.3), rim = P.parch, rimDx = 1, rimDy = -0.6, rimA = 0.8) {
  const t = o.t || 0, wind = o.wind ?? 0.3, seat = o.seated ?? 0;
  const sink = seat * 9;
  const flow = Math.sin(t * 2.6) * wind;
  const paint = (c) => {
    g.fillStyle = c;
    g.strokeStyle = c;
    g.lineCap = 'round';
    if (seat > 0.5) {
      g.beginPath(); g.moveTo(-4, -6); g.quadraticCurveTo(4, -12, 10, -8); g.lineTo(10, -1); g.lineTo(6, 0); g.lineTo(6, -5); g.lineTo(-4, -2); g.fill();
    } else {
      g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(-1.6, 0); g.lineTo(-1.3, -9); g.moveTo(1.6, 0); g.lineTo(1.3, -9); g.stroke();
    }
    // Dress.
    g.beginPath();
    g.moveTo(-6.5 - flow, -7 + sink * 0.4);
    g.quadraticCurveTo(-4, -18 + sink, -3, -25 + sink);
    g.lineTo(3, -25 + sink);
    g.quadraticCurveTo(4.4, -18 + sink, 6.5 - flow * 0.6, -8 + sink * 0.4);
    g.quadraticCurveTo(0, -6 + sink * 0.4, -6.5 - flow, -7 + sink * 0.4);
    g.fill();
    // Arms.
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(-2.6, -23 + sink); g.quadraticCurveTo(-4.6, -18 + sink, -4.2, -14 + sink); g.stroke();
    g.beginPath(); g.moveTo(2.6, -23 + sink); g.quadraticCurveTo(4.8, -18 + sink, 4.4, -14 + sink); g.stroke();
    // Head and hair streaming.
    g.beginPath(); g.ellipse(0.4, -29.5 + sink, 3.1, 3.6, 0, 0, TAU); g.fill();
    g.beginPath();
    g.moveTo(-2.6, -32 + sink);
    g.bezierCurveTo(-6 - wind * 5, -31 + sink, -7 - wind * 7, -24 + sink + flow, -9 - wind * 8, -21 + sink + flow * 1.5);
    g.quadraticCurveTo(-4, -24 + sink, -1.5, -26 + sink);
    g.fill();
  };
  const rimU = 1.8 / (o.px || 1.8);
  rimlit(g, paint, body, rim, rimDx * rimU, rimDy * rimU, rimA);
}

// Held bottle: the detailed bottle at hand scale (17 units tall per unit of `s`).
export function drawSmallBottle(g, x, y, s, o) {
  g.save();
  g.translate(x, y + 2);
  g.scale(0.17 * s, 0.17 * s);
  drawBottle(g, { t: o.t, storm: o.glow ?? 1, glow: o.glow ?? 1, cork: o.cork === false ? 1 : 0, tag: o.tag, wind: o.wind });
  g.restore();
}
