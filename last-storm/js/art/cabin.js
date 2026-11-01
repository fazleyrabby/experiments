// The fisherman's cabin: plank walls lit by a lantern, shelves of empty bottles, the portrait, the chair, the window.
import { P, mix, rgba } from '../core/color.js';
import { hash, fbm1, clamp, TAU } from '../core/math.js';
import { pattern, textures } from '../core/textures.js';
import { glow } from './atmos.js';

export function lanternFlicker(t) {
  return 0.82 + 0.1 * fbm1(t * 6, 3) + 0.08 * Math.sin(t * 17.3) * Math.sin(t * 5.1);
}

// Plank wall across [x0, x1], from y0 to y1, warm-lit around (lx, ly).
export function drawWall(g, V, p) {
  const { u } = V;
  const { x0, x1, y0, y1 } = p;
  const pw = 74 * u * (p.scale || 1);
  for (let i = 0, x = x0; x < x1; i++, x += pw) {
    const tone = 0.3 + hash(i, 1) * 0.16;
    g.fillStyle = rgba(mix(mix(P.rust, P.night, 0.62 - tone * 0.3), P.teal, 0.08));
    g.fillRect(x, y0, pw + 1, y1 - y0);
    // Grain.
    g.strokeStyle = rgba(P.ink, 0.28);
    g.lineWidth = 0.7 * u;
    for (let k = 0; k < 5; k++) {
      const gx = x + pw * (0.12 + k * 0.19 + (hash(i * 5 + k, 2) - 0.5) * 0.08);
      g.beginPath();
      g.moveTo(gx, y0);
      for (let y = y0; y < y1; y += 30 * u) g.lineTo(gx + fbm1(y / (90 * u) + i * 3 + k, 5) * 5 * u, y);
      g.stroke();
    }
    // Knot.
    if (hash(i, 3) < 0.55) {
      const ky = y0 + (y1 - y0) * (0.15 + hash(i, 4) * 0.7), kx = x + pw * (0.3 + hash(i, 5) * 0.4);
      g.strokeStyle = rgba(P.ink, 0.45);
      g.beginPath(); g.ellipse(kx, ky, 5 * u, 9 * u, 0, 0, TAU); g.stroke();
      g.beginPath(); g.ellipse(kx, ky, 2.4 * u, 4.6 * u, 0, 0, TAU); g.stroke();
    }
    // Seam and nails.
    g.fillStyle = rgba(P.ink, 0.75);
    g.fillRect(x, y0, 2.2 * u, y1 - y0);
    g.fillStyle = rgba(mix(P.parch, P.rust, 0.6), 0.5);
    for (const fy of [0.12, 0.5, 0.88]) {
      g.beginPath(); g.arc(x + pw * 0.5, y0 + (y1 - y0) * fy, 1.5 * u, 0, TAU); g.fill();
    }
  }
  // Weathering.
  g.save();
  g.globalAlpha = 0.35;
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = pattern(g, textures().pigment);
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore();
}

// Lantern pool: warm light over the wall (screen) and darkness away from it (multiply).
export function lanternLight(g, V, x, y, r, a, cold = 0) {
  g.save();
  g.globalCompositeOperation = 'multiply';
  const d = g.createRadialGradient(x, y, r * 0.15, x, y, r * 1.6);
  d.addColorStop(0, 'rgba(255,255,255,1)');
  d.addColorStop(0.5, rgba(mix(P.parch, P.rust, 0.4)));
  d.addColorStop(1, rgba(mix(P.night, P.teal, 0.2 + cold * 0.4)));
  g.fillStyle = d;
  g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
  g.globalCompositeOperation = 'screen';
  glow(g, x, y, r, mix(P.amber, P.orange, 0.3), 0.32 * a);
  g.restore();
}

export function drawLantern(g, V, x, y, s, t, a = 1) {
  const f = lanternFlicker(t) * a;
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin(t * 0.7) * 0.03);
  g.scale(s, s);
  g.strokeStyle = rgba(P.ink);
  g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(0, -200); g.lineTo(0, -26); g.stroke();
  glow(g, 0, 0, 60, P.amber, 0.6 * f);
  g.fillStyle = rgba(mix(P.amber, P.parch, 0.35), 0.9 * f);
  g.beginPath(); g.ellipse(0, 2, 4.2, 8 + f * 2, 0, 0, TAU); g.fill();
  g.fillStyle = rgba(mix(P.parch, [255, 255, 255], 0.4), f);
  g.beginPath(); g.ellipse(0, 4, 1.8, 4, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba(mix(P.night, P.rust, 0.3));
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-12, -16); g.lineTo(-14, 18); g.moveTo(12, -16); g.lineTo(14, 18);
  g.moveTo(-16, 18); g.lineTo(16, 18); g.moveTo(-13, -16); g.lineTo(13, -16);
  g.stroke();
  g.fillStyle = rgba(mix(P.night, P.rust, 0.3));
  g.beginPath(); g.moveTo(-15, -16); g.lineTo(0, -28); g.lineTo(15, -16); g.fill();
  g.fillRect(-17, 18, 34, 4);
  g.strokeStyle = rgba(P.amber, 0.6 * f);
  g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(-12.5, -14); g.lineTo(-14, 16); g.stroke();
  g.restore();
}

// An empty bottle of a given shape on a shelf, catching the lantern light.
export function shelfBottle(g, x, base, s, shape, light) {
  const hh = [60, 44, 70, 38][shape] * s, bw = [16, 22, 13, 24][shape] * s, nw = [5, 6, 4, 7][shape] * s;
  g.beginPath();
  g.moveTo(x - bw / 2, base);
  g.lineTo(x - bw / 2, base - hh * 0.6);
  g.quadraticCurveTo(x - bw / 2, base - hh * 0.75, x - nw / 2, base - hh * 0.8);
  g.lineTo(x - nw / 2, base - hh);
  g.lineTo(x + nw / 2, base - hh);
  g.lineTo(x + nw / 2, base - hh * 0.8);
  g.quadraticCurveTo(x + bw / 2, base - hh * 0.75, x + bw / 2, base - hh * 0.6);
  g.lineTo(x + bw / 2, base);
  g.closePath();
  g.fillStyle = rgba(mix(P.teal, P.night, 0.3), 0.45);
  g.fill();
  g.strokeStyle = rgba(P.ink, 0.8);
  g.lineWidth = Math.max(0.8, s * 1.1);
  g.stroke();
  g.strokeStyle = rgba(mix(P.amber, P.parch, 0.4), 0.25 + 0.65 * light);
  g.lineWidth = Math.max(0.8, s * 1.6);
  g.beginPath(); g.moveTo(x - bw * 0.3, base - hh * 0.08); g.lineTo(x - bw * 0.3, base - hh * 0.55); g.stroke();
  g.fillStyle = rgba(mix(P.parch, P.amber, 0.3), 0.2 + 0.7 * light);
  g.beginPath(); g.arc(x - bw * 0.28, base - hh * 0.62, s * 1.4, 0, TAU); g.fill();
}

export function drawShelf(g, V, x0, x1, y, s, seed, t, lx, ly, reach) {
  const { u } = V;
  g.fillStyle = rgba(mix(P.rust, P.night, 0.55));
  g.fillRect(x0, y, x1 - x0, 9 * u * s);
  g.fillStyle = rgba(mix(P.amber, P.rust, 0.5), 0.5);
  g.fillRect(x0, y, x1 - x0, 1.6 * u * s);
  g.fillStyle = rgba(P.ink, 0.8);
  for (const bx of [x0 + 20 * u, x1 - 30 * u]) {
    g.beginPath(); g.moveTo(bx, y + 9 * u * s); g.lineTo(bx + 10 * u * s, y + 9 * u * s); g.lineTo(bx, y + 34 * u * s); g.fill();
  }
  let x = x0 + 26 * u * s;
  let i = 0;
  const f = lanternFlicker(t);
  while (x < x1 - 30 * u * s) {
    const shape = Math.floor(hash(seed + i, 1) * 4);
    const bs = u * s * (0.95 + hash(seed + i, 2) * 0.3);
    const dist = Math.hypot(x - lx, y - ly);
    const light = clamp(1 - dist / reach) * f;
    shelfBottle(g, x, y, bs, shape, light);
    x += (28 + hash(seed + i, 3) * 22) * u * s;
    i++;
  }
}

// The portrait: an oval frame around a painted girl, erased in three steps.
// erase: [face, colour, all] each 0..1
export function drawPortrait(g, x, y, hgt, erase, light, t) {
  const w = hgt * 0.78;
  g.save();
  g.translate(x, y);
  // Frame with shadow.
  g.fillStyle = rgba(P.ink, 0.5);
  g.beginPath(); g.ellipse(hgt * 0.03, hgt * 0.04, w * 0.6, hgt * 0.6, 0, 0, TAU); g.fill();
  const fr = g.createLinearGradient(-w, -hgt, w, hgt);
  fr.addColorStop(0, rgba(mix(P.amber, P.rust, 0.4)));
  fr.addColorStop(0.5, rgba(mix(P.rust, P.night, 0.4)));
  fr.addColorStop(1, rgba(mix(P.night, P.rust, 0.2)));
  g.fillStyle = fr;
  g.beginPath(); g.ellipse(0, 0, w * 0.58, hgt * 0.58, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba(mix(P.amber, P.parch, 0.3), 0.5 * light);
  g.lineWidth = hgt * 0.012;
  g.beginPath(); g.ellipse(0, 0, w * 0.55, hgt * 0.55, 0, Math.PI * 0.95, Math.PI * 1.6); g.stroke();
  // Painting.
  g.beginPath(); g.ellipse(0, 0, w * 0.48, hgt * 0.48, 0, 0, TAU);
  g.clip();
  const paper = mix(P.parch, P.rust, 0.18);
  const bg = g.createRadialGradient(-w * 0.1, -hgt * 0.15, 0, 0, 0, hgt * 0.6);
  bg.addColorStop(0, rgba(mix(P.amber, P.parch, 0.45)));
  bg.addColorStop(1, rgba(mix(P.rust, P.parch, 0.35)));
  g.fillStyle = bg;
  g.fillRect(-w, -hgt, w * 2, hgt * 2);
  const S = hgt / 100;
  const col = 1 - erase[1] * 0.85;
  const all = 1 - erase[2];
  g.globalAlpha = all;
  // Shoulders and dress collar.
  g.fillStyle = rgba(mix(mix(P.teal, P.night, 0.3), paper, 1 - col));
  g.beginPath();
  g.moveTo(-34 * S, 50 * S); g.quadraticCurveTo(-30 * S, 20 * S, -12 * S, 16 * S); g.lineTo(12 * S, 16 * S);
  g.quadraticCurveTo(30 * S, 20 * S, 34 * S, 50 * S); g.closePath(); g.fill();
  g.fillStyle = rgba(mix(P.parch, paper, 1 - col), 0.9);
  g.beginPath(); g.moveTo(-9 * S, 16 * S); g.lineTo(0, 24 * S); g.lineTo(9 * S, 16 * S); g.lineTo(5 * S, 14 * S); g.lineTo(0, 19 * S); g.lineTo(-5 * S, 14 * S); g.fill();
  // Hair behind.
  const hair = mix(mix(P.rust, P.night, 0.55), paper, 1 - col);
  g.fillStyle = rgba(hair);
  g.beginPath();
  g.moveTo(-20 * S, 26 * S); g.quadraticCurveTo(-26 * S, -6 * S, -16 * S, -24 * S); g.quadraticCurveTo(0, -36 * S, 16 * S, -24 * S);
  g.quadraticCurveTo(26 * S, -6 * S, 20 * S, 26 * S); g.quadraticCurveTo(12 * S, 18 * S, 12 * S, 6 * S); g.lineTo(-12 * S, 6 * S); g.quadraticCurveTo(-12 * S, 18 * S, -20 * S, 26 * S);
  g.fill();
  // Neck and face.
  const skin = mix(mix(P.parch, P.orange, 0.22), paper, 1 - col);
  g.fillStyle = rgba(skin);
  g.fillRect(-4.5 * S, 4 * S, 9 * S, 13 * S);
  g.beginPath(); g.ellipse(0, -6 * S, 12.5 * S, 15.5 * S, 0, 0, TAU); g.fill();
  // Fringe.
  g.fillStyle = rgba(hair);
  g.beginPath(); g.moveTo(-13 * S, -10 * S); g.quadraticCurveTo(-8 * S, -24 * S, 8 * S, -23 * S); g.quadraticCurveTo(14 * S, -18 * S, 13 * S, -9 * S); g.quadraticCurveTo(2 * S, -16 * S, -13 * S, -10 * S); g.fill();
  // Features: the first thing to go.
  const fa = (1 - erase[0]) * all;
  if (fa > 0.01) {
    g.globalAlpha = fa;
    g.strokeStyle = rgba(mix(P.night, P.rust, 0.4), 0.85);
    g.lineWidth = 1.4 * S;
    g.lineCap = 'round';
    g.beginPath(); g.arc(-5 * S, -6 * S, 2.4 * S, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.beginPath(); g.arc(5 * S, -6 * S, 2.4 * S, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    g.fillStyle = rgba(P.night, 0.8);
    g.beginPath(); g.arc(-5 * S, -5.4 * S, 1.1 * S, 0, TAU); g.arc(5 * S, -5.4 * S, 1.1 * S, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, -3 * S); g.quadraticCurveTo(1.5 * S, 1 * S, -0.6 * S, 1.6 * S); g.stroke();
    g.strokeStyle = rgba(mix(P.orange, P.rust, 0.4), 0.8);
    g.beginPath(); g.moveTo(-3.6 * S, 4.6 * S); g.quadraticCurveTo(0, 6.8 * S, 3.6 * S, 4.6 * S); g.stroke();
    g.fillStyle = rgba(P.orange, 0.18);
    g.beginPath(); g.arc(-7 * S, 0, 3 * S, 0, TAU); g.arc(7 * S, 0, 3 * S, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
  // Age: foxing, a crack, a pale bloom where the paint has gone.
  g.fillStyle = rgba(mix(P.rust, P.parch, 0.3), 0.35);
  for (let i = 0; i < 18; i++) {
    g.beginPath(); g.arc((hash(i, 1) - 0.5) * w * 0.9, (hash(i, 2) - 0.5) * hgt * 0.9, (0.5 + hash(i, 3) * 2) * S, 0, TAU); g.fill();
  }
  const bloom = Math.max(erase[0] * 0.3, erase[1] * 0.55, erase[2]);
  g.fillStyle = rgba(paper, bloom * 0.6);
  g.fillRect(-w, -hgt, w * 2, hgt * 2);
  g.globalAlpha = 0.3;
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = pattern(g, textures().paper);
  g.fillRect(-w, -hgt, w * 2, hgt * 2);
  g.restore();
  // Glass glare.
  g.save();
  g.translate(x, y);
  g.globalCompositeOperation = 'screen';
  const gl = g.createLinearGradient(-w * 0.4, -hgt * 0.5, w * 0.1, 0);
  gl.addColorStop(0, rgba(P.amber, 0.18 * light));
  gl.addColorStop(1, rgba(P.amber, 0));
  g.fillStyle = gl;
  g.beginPath(); g.ellipse(0, 0, w * 0.48, hgt * 0.48, 0, 0, TAU); g.fill();
  g.restore();
}

// A wooden spindle chair, three-quarter view. Origin at the front-left foot, height `s` units of 100.
export function drawChair(g, x, y, s, light) {
  g.save();
  g.translate(x, y);
  g.scale(s / 100, s / 100);
  const wood = rgba(mix(P.rust, P.night, 0.55));
  const lit = rgba(mix(P.amber, P.rust, 0.4), 0.55 * light);
  g.lineCap = 'round';
  const leg = (x0, y0, x1, y1, w) => {
    g.strokeStyle = wood; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = lit; g.lineWidth = w * 0.3; g.beginPath(); g.moveTo(x0 - w * 0.3, y0); g.lineTo(x1 - w * 0.3, y1); g.stroke();
  };
  leg(4, -52, 2, 0, 4.4);
  leg(50, -54, 52, -2, 4.4);
  leg(18, -60, 18, -12, 3.6);
  leg(60, -62, 62, -14, 3.6);
  // Seat.
  g.fillStyle = wood;
  g.beginPath(); g.moveTo(-2, -54); g.lineTo(52, -56); g.lineTo(66, -64); g.lineTo(14, -63); g.closePath(); g.fill();
  g.strokeStyle = lit; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-2, -54); g.lineTo(52, -56); g.stroke();
  // Back with spindles.
  leg(14, -63, 12, -128, 4);
  leg(66, -64, 66, -130, 4);
  g.strokeStyle = wood; g.lineWidth = 7;
  g.beginPath(); g.moveTo(10, -126); g.quadraticCurveTo(40, -136, 68, -128); g.stroke();
  for (let i = 1; i < 5; i++) leg(14 + i * 10.4, -64, 13 + i * 10.6, -125, 2.4);
  // Stretcher.
  leg(4, -22, 50, -24, 2.6);
  g.restore();
}

// Window into the evening: draws `outside(g)` inside the panes, then frame and mullions.
export function drawWindow(g, V, x, y, w, h, outside, light) {
  const { u } = V;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  outside(g);
  // Glass: faint reflection and grime.
  g.globalAlpha = 0.18;
  g.fillStyle = pattern(g, textures().pigment);
  g.fillRect(x, y, w, h);
  g.globalAlpha = 1;
  g.restore();
  const fw = 14 * u;
  g.fillStyle = rgba(mix(P.rust, P.night, 0.6));
  g.fillRect(x - fw, y - fw, w + fw * 2, fw);
  g.fillRect(x - fw, y + h, w + fw * 2, fw * 1.6);
  g.fillRect(x - fw, y, fw, h);
  g.fillRect(x + w, y, fw, h);
  g.fillRect(x + w / 2 - fw * 0.35, y, fw * 0.7, h);
  g.fillRect(x, y + h * 0.48 - fw * 0.35, w, fw * 0.7);
  // Sill catching light.
  g.fillStyle = rgba(mix(P.amber, P.rust, 0.5), 0.6 * light);
  g.fillRect(x - fw, y + h, w + fw * 2, 2 * u);
}
