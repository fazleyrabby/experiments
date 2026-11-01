// Close-up hands: a weathered fist around a bottle, thumb on the cork, an open palm, a giving hand.
// All drawn as rim-lit silhouettes with a little knuckle and crease ink.
import { P, mix, rgba } from '../core/color.js';
import { rimlit } from './figures.js';
import { TAU } from '../core/math.js';

const SKIN = mix(mix(P.rust, P.night, 0.55), P.teal, 0.12);

function capsule(g, x0, y0, x1, y1, r) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  g.beginPath();
  g.arc(x0, y0, r, a + Math.PI / 2, a - Math.PI / 2);
  g.arc(x1, y1, r * 0.92, a - Math.PI / 2, a + Math.PI / 2);
  g.closePath();
  g.fill();
}

// Fingers wrapped around the bottle body (bottle units: body x ±26, y 0..−48).
// side: −1 = hand from the left, +1 from the right. y: top finger's centre.
export function drawGrip(g, o) {
  const side = o.side ?? -1, y0 = o.y ?? -36, px = o.px || 2;
  const rim = o.rim || P.amber;
  const rimU = 1.6 / px;
  const fy = [0, 9.6, 18.8, 27.2].map((d) => y0 + d);
  const reach = [17, 19, 17, 13];
  const th = [10, 10.4, 9.8, 8.6];
  const finger = (i) => {
    // A band wrapping the cylinder: slightly bowed downward, rounded fingertip on the far side.
    const y = fy[i], r = th[i] / 2, far = -side * reach[i];
    g.beginPath();
    g.moveTo(side * 30, y - r);
    g.quadraticCurveTo(0, y - r + 2.4, far, y - r + 1.6);
    g.arc(far, y + 1.6, r, -Math.PI / 2, Math.PI / 2, side > 0);
    g.quadraticCurveTo(0, y + r + 2.4, side * 30, y + r);
    g.closePath();
    g.fill();
  };
  const paint = (c) => {
    g.fillStyle = c;
    // Back of the hand, just past the glass edge, and the wrist going down and out.
    g.beginPath();
    g.moveTo(side * 22, fy[0] - 7);
    g.quadraticCurveTo(side * 36, fy[0] - 9, side * 40, fy[1]);
    g.quadraticCurveTo(side * 44, fy[3] + 6, side * 52, fy[3] + 26);
    g.lineTo(side * 26, fy[3] + 34);
    g.quadraticCurveTo(side * 22, fy[3] + 12, side * 22, fy[3] + 4);
    g.closePath();
    g.fill();
    for (let i = 3; i >= 0; i--) finger(i);
    // Thumb over the top finger, pointing across.
    g.beginPath();
    g.ellipse(side * 12, fy[0] - 6.5, 13, 4.4, side * 0.12, 0, TAU);
    g.fill();
  };
  rimlit(g, paint, o.skin || SKIN, rim, side * rimU * 0.8, -rimU, o.rimA ?? 0.9);
  // Creases between fingers, knuckle lines, nails catching light.
  g.strokeStyle = rgba(P.ink, 0.6);
  g.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    const y = (fy[i] + fy[i + 1]) / 2 + 1.6;
    g.beginPath(); g.moveTo(side * 26, y); g.quadraticCurveTo(0, y + 2.2, -side * (reach[i + 1] - 2), y + 1.2); g.stroke();
  }
  g.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    g.beginPath(); g.moveTo(side * 8, fy[i] - 3); g.quadraticCurveTo(side * 9.5, fy[i] + 1, side * 8, fy[i] + 4); g.stroke();
  }
  g.strokeStyle = rgba(rim, 0.35);
  g.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    g.beginPath(); g.arc(-side * reach[i], fy[i] + 1.6, th[i] * 0.36, side > 0 ? Math.PI * 0.7 : -Math.PI * 0.3, side > 0 ? Math.PI * 1.3 : Math.PI * 0.3); g.stroke();
  }
}

// A thumb pushing the cork up from the right, with the hand behind the neck.
export function drawCorkThumb(g, o) {
  const push = o.push || 0, px = o.px || 2, rim = o.rim || P.amber;
  const rimU = 1.6 / px;
  const lift = push * 6;
  const paint = (c) => {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(10, -78);
    g.quadraticCurveTo(28, -84, 50, -70);
    g.lineTo(76, -40);
    g.lineTo(52, -26);
    g.quadraticCurveTo(26, -50, 10, -60);
    g.closePath();
    g.fill();
    // Index finger curled behind the neck.
    capsule(g, 14, -66, -11, -70, 3.4);
    // Thumb rising to the cork's underside.
    capsule(g, 28, -78, 9, -94 - lift, 3.8);
  };
  rimlit(g, paint, o.skin || SKIN, rim, rimU * 0.5, -rimU, o.rimA ?? 0.9);
  g.strokeStyle = rgba(P.ink, 0.5);
  g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(12.6, -95 - lift); g.quadraticCurveTo(10, -92 - lift, 12, -89 - lift); g.stroke();
}

// Cupped hand seen from the side, palm up; origin at the wrist, fingers toward +x. ~80 units long.
export function drawPalm(g, o) {
  const px = o.px || 2, rim = o.rim || P.amber;
  const rimU = 1.6 / px;
  const curl = o.curl || 0;
  const paint = (c) => {
    g.fillStyle = c;
    // Sleeve with a turned cuff.
    g.beginPath();
    g.moveTo(-120, -6); g.lineTo(-8, -14); g.lineTo(-4, 14); g.lineTo(-120, 26); g.closePath(); g.fill();
    // Hand: underside with knuckle bumps, concave palm on top, fingertips curling up.
    const tipY = -16 - curl * 10;
    g.beginPath();
    g.moveTo(-6, -9);
    g.quadraticCurveTo(14, -4, 30, -4);
    g.quadraticCurveTo(50, -4, 62, tipY + 6);
    g.quadraticCurveTo(68, tipY - 2, 74, tipY);
    g.quadraticCurveTo(80, tipY + 3, 77, tipY + 9);
    g.quadraticCurveTo(76, 4, 66, 10);
    g.quadraticCurveTo(60, 13, 54, 12);
    g.quadraticCurveTo(46, 15, 38, 13);
    g.quadraticCurveTo(20, 16, -6, 12);
    g.closePath();
    g.fill();
    // Thumb on the near side, raised.
    g.beginPath();
    g.moveTo(8, -6);
    g.quadraticCurveTo(18, -20, 30, -24 - curl * 3);
    g.quadraticCurveTo(36, -24, 35, -19);
    g.quadraticCurveTo(26, -12, 22, -4);
    g.closePath();
    g.fill();
  };
  rimlit(g, paint, o.skin || SKIN, rim, 0, -rimU, o.rimA ?? 0.9);
  g.strokeStyle = rgba(P.ink, 0.55);
  g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(52, 2); g.quadraticCurveTo(60, -2, 66, -9 - curl * 6); g.stroke();
  g.beginPath(); g.moveTo(-6, -9); g.lineTo(-4, 13); g.stroke();
  g.strokeStyle = rgba(P.amber, 0.35);
  g.beginPath(); g.moveTo(4, -7); g.quadraticCurveTo(30, -3, 58, -10); g.stroke();
}

// A paler, younger hand reaching down from above, side view, fingers opening. Origin at the knuckles.
export function drawGivingHand(g, o) {
  const open = o.open || 0, px = o.px || 2;
  const rimU = 1.6 / px;
  const paint = (c) => {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(-14, -160); g.lineTo(14, -160); g.lineTo(13, -26); g.quadraticCurveTo(12, -6, 6, 0); g.lineTo(-12, 0); g.quadraticCurveTo(-16, -14, -14, -30); g.closePath(); g.fill();
    // Fingers curled under, opening to let the coins fall.
    g.save();
    g.translate(-2, -2);
    g.rotate(-0.9 + open * 0.75);
    g.beginPath();
    g.moveTo(-8, 0); g.quadraticCurveTo(-10, 18, -2, 30); g.quadraticCurveTo(4, 33, 8, 28); g.quadraticCurveTo(4, 14, 8, 0); g.closePath(); g.fill();
    g.restore();
    // Thumb.
    g.beginPath();
    g.moveTo(10, -18); g.quadraticCurveTo(22 + open * 6, -8, 18 + open * 8, 6); g.quadraticCurveTo(14, 8, 12, 2); g.quadraticCurveTo(12, -6, 6, -10); g.closePath(); g.fill();
  };
  rimlit(g, paint, mix(mix(P.parch, P.rust, 0.5), P.night, 0.45), P.parch, -rimU * 0.6, -rimU * 0.2, 0.7);
}
