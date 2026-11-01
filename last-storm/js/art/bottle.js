// The storm bottle: 100 units tall, origin at the base centre, up is −y.
// Translucent glass, internal reflections, a small storm system orbiting inside, cork, twine and tag.
import { P, mix, rgba } from '../core/color.js';
import { hash, clamp, TAU } from '../core/math.js';

function bodyPath(g, inset = 0) {
  const w = 26 - inset, n = 9 - inset * 0.6;
  g.beginPath();
  g.moveTo(-w + 6, -inset);
  g.quadraticCurveTo(-w, -inset, -w, -6 - inset);
  g.lineTo(-w, -48);
  g.bezierCurveTo(-w, -62, -n, -62, -n, -72);
  g.lineTo(-n, -88 + inset);
  g.lineTo(n, -88 + inset);
  g.lineTo(n, -72);
  g.bezierCurveTo(n, -62, w, -62, w, -48);
  g.lineTo(w, -6 - inset);
  g.quadraticCurveTo(w, -inset, w - 6, -inset);
  g.closePath();
}

// o: { t, storm (0..1), glow, cork (0 seated → 1 gone), sweep (−1 none, 0..1 progress), tag, empty, wind, flick }
export function drawBottle(g, o) {
  const t = o.t || 0;
  const storm = o.empty ? 0 : (o.storm ?? 1);
  const glow = o.glow ?? storm;
  g.save();
  g.lineJoin = 'round';
  g.lineCap = 'round';

  // Outer glow.
  if (glow > 0.01) {
    const gg = g.createRadialGradient(0, -32, 4, 0, -32, 120);
    gg.addColorStop(0, rgba(P.amber, 0.45 * glow));
    gg.addColorStop(0.35, rgba(P.orange, 0.16 * glow));
    gg.addColorStop(1, rgba(P.orange, 0));
    g.fillStyle = gg;
    g.fillRect(-120, -152, 240, 240);
  }

  // Glass body tint.
  bodyPath(g);
  g.fillStyle = rgba(mix(P.teal, P.night, 0.35), o.empty ? 0.32 : 0.55);
  g.fill();

  // Interior: a little storm system turning inside.
  g.save();
  bodyPath(g, 2.2);
  g.clip();
  if (storm > 0.01) {
    const spin = t * (1.4 + storm * 1.6) * (o.spin ?? 1);
    const core = g.createRadialGradient(0, -30, 0, 0, -30, 34);
    core.addColorStop(0, rgba(mix(P.amber, P.parch, 0.3), 0.75 * storm));
    core.addColorStop(0.4, rgba(P.orange, 0.42 * storm));
    core.addColorStop(1, rgba(P.night, 0));
    g.fillStyle = core;
    g.fillRect(-30, -80, 60, 80);
    // Cloud lumps orbiting on tilted ellipses; back half drawn darker.
    for (let layer = 0; layer < 4; layer++) {
      const cy = -12 - layer * 11;
      const rx = 17 - layer * 2.5, ry = 4.2 - layer * 0.4;
      for (let i = 0; i < 6; i++) {
        const a = spin * (1 + layer * 0.22) + (i / 6) * TAU + layer;
        const x = Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        const front = Math.sin(a) > 0;
        const r = (3.8 + hash(i, layer) * 3.4) * (front ? 1 : 0.85);
        const lg = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
        lg.addColorStop(0, rgba(front ? mix(P.amber, P.parch, 0.35) : P.orange, (front ? 0.85 : 0.5) * storm));
        lg.addColorStop(0.6, rgba(front ? P.orange : P.rust, (front ? 0.6 : 0.4) * storm));
        lg.addColorStop(1, rgba(P.rust, 0));
        g.fillStyle = lg;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    }
    // Spiral wind strokes.
    g.strokeStyle = rgba(P.amber, 0.55 * storm);
    g.lineWidth = 0.8;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.ellipse(0, -18 - i * 8, 15 - i * 1.6, 3.4, 0, spin * 1.3 + i, spin * 1.3 + i + 2.2);
      g.stroke();
    }
    // Rain veil inside.
    g.strokeStyle = rgba(mix(P.parch, P.teal, 0.4), 0.3 * storm);
    g.lineWidth = 0.4;
    g.beginPath();
    for (let i = 0; i < 18; i++) {
      const x = -16 + hash(i, 5) * 32;
      const y = -8 - ((hash(i, 6) * 30 + t * 40) % 30);
      g.moveTo(x, y); g.lineTo(x - 1, y + 4);
    }
    g.stroke();
    // A tiny lightning flicker every so often.
    const slot = Math.floor(t * 2.3);
    const ph = t * 2.3 - slot;
    if (hash(slot, 77) < 0.45 * storm + (o.flick || 0) && ph < 0.18) {
      const a = 1 - ph / 0.18;
      g.strokeStyle = rgba(mix(P.parch, P.amber, 0.3), a * storm);
      g.lineWidth = 0.9;
      g.beginPath();
      let x = (hash(slot, 3) - 0.5) * 14, y = -46;
      g.moveTo(x, y);
      for (let k = 1; k < 7; k++) { x += (hash(slot * 9 + k, 4) - 0.5) * 7; y += 5; g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = rgba(P.amber, 0.25 * a * storm);
      g.fillRect(-30, -80, 60, 80);
    }
  }
  // Internal reflections: the far wall's highlight seen through the glass.
  g.strokeStyle = rgba(P.parch, 0.12);
  g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(16, -10); g.lineTo(16, -44); g.stroke();
  g.restore();

  // Glass edges: dark refraction line, then a thin inner light line.
  bodyPath(g);
  g.strokeStyle = rgba(P.ink, 0.75);
  g.lineWidth = 1.6;
  g.stroke();
  bodyPath(g, 1.6);
  g.strokeStyle = rgba(mix(P.parch, P.teal, 0.3), 0.22);
  g.lineWidth = 0.8;
  g.stroke();

  // Thick glass base.
  g.strokeStyle = rgba(mix(P.parch, P.amber, 0.3), 0.35);
  g.lineWidth = 1;
  g.beginPath(); g.ellipse(0, -3, 19, 2.2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();

  // Specular highlights.
  const hi = rgba(mix(P.parch, [255, 255, 255], 0.35), 0.7);
  g.strokeStyle = hi;
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(-19.5, -10); g.lineTo(-19.5, -46); g.stroke();
  g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(-14.5, -14); g.lineTo(-14.5, -30); g.stroke();
  g.beginPath(); g.moveTo(-18, -55); g.quadraticCurveTo(-12, -62, -6.5, -66); g.stroke();
  g.beginPath(); g.moveTo(-6, -74); g.lineTo(-6, -85); g.stroke();
  g.strokeStyle = rgba(P.parch, 0.35);
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(21, -12); g.lineTo(21, -30); g.stroke();
  g.fillStyle = rgba(P.parch, 0.85);
  g.beginPath(); g.ellipse(-19.5, -50, 1.4, 2.2, 0, 0, TAU); g.fill();

  // Highlight sweep across the glass (cork release).
  const sw = o.sweep ?? -1;
  if (sw >= 0 && sw <= 1) {
    g.save();
    bodyPath(g);
    g.clip();
    const x = -50 + sw * 110;
    const sg = g.createLinearGradient(x - 14, 0, x + 14, 0);
    sg.addColorStop(0, rgba(P.parch, 0));
    sg.addColorStop(0.5, rgba(mix(P.parch, [255, 255, 255], 0.5), 0.75 * Math.sin(sw * Math.PI)));
    sg.addColorStop(1, rgba(P.parch, 0));
    g.fillStyle = sg;
    g.save();
    g.transform(1, 0, -0.45, 1, 0, 0);
    g.fillRect(x - 60, -110, 120, 120);
    g.restore();
    g.restore();
  }

  // Lip ring.
  g.fillStyle = rgba(mix(P.teal, P.night, 0.2), 0.8);
  g.beginPath();
  g.moveTo(-11.5, -88); g.lineTo(-11.5, -93); g.quadraticCurveTo(-11.5, -95, -9, -95);
  g.lineTo(9, -95); g.quadraticCurveTo(11.5, -95, 11.5, -93); g.lineTo(11.5, -88); g.closePath();
  g.fill();
  g.strokeStyle = rgba(P.ink, 0.7);
  g.lineWidth = 0.9;
  g.stroke();
  g.strokeStyle = rgba(mix(P.parch, P.amber, 0.2), 0.75);
  g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(-10, -93.6); g.lineTo(4, -93.6); g.stroke();

  // Twine around the neck and a paper tag.
  g.strokeStyle = rgba(mix(P.parch, P.rust, 0.45));
  g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-9.5, -80); g.quadraticCurveTo(0, -77.5, 9.5, -80); g.stroke();
  g.beginPath(); g.moveTo(-9.5, -77.5); g.quadraticCurveTo(0, -75, 9.5, -77.5); g.stroke();
  if (o.tag !== false) {
    const sway = Math.sin(t * 1.6) * 0.12 + (o.wind || 0) * 0.3;
    g.save();
    g.translate(9, -78);
    g.rotate(0.45 + sway);
    g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(3, 6, 2, 12); g.stroke();
    g.translate(2, 12);
    g.rotate(-0.2);
    g.fillStyle = rgba(mix(P.parch, P.rust, 0.12));
    g.beginPath();
    g.moveTo(-4, 0); g.lineTo(4, 0); g.lineTo(5.5, 3); g.lineTo(5.5, 16); g.lineTo(-5.5, 16); g.lineTo(-5.5, 3); g.closePath();
    g.fill();
    g.fillStyle = rgba(P.rust, 0.35);
    g.fillRect(-5.5, 12, 11, 4);
    g.strokeStyle = rgba(P.ink, 0.65);
    g.lineWidth = 0.45;
    // Hand-written scrawl, not legible text.
    for (let l = 0; l < 3; l++) {
      g.beginPath();
      g.moveTo(-3.8, 5.5 + l * 3);
      for (let k = 1; k < 9; k++) g.lineTo(-3.8 + k * 0.9, 5.5 + l * 3 + (hash(k + l * 9, 61) - 0.5) * 1.6);
      g.stroke();
    }
    g.fillStyle = rgba(P.night, 0.9);
    g.beginPath(); g.arc(0, 1.8, 0.7, 0, TAU); g.fill();
    g.restore();
  }

  // Cork: seated, or flying off.
  const c = clamp(o.cork ?? 0);
  if (c < 1) {
    g.save();
    g.translate(c * 34, -c * 70 - c * c * 30);
    g.rotate(c * 2.4);
    g.globalAlpha *= 1 - smoothFade(c);
    const cg = g.createLinearGradient(-8, 0, 8, 0);
    cg.addColorStop(0, rgba(mix(P.rust, P.parch, 0.25)));
    cg.addColorStop(0.35, rgba(mix(P.orange, P.parch, 0.45)));
    cg.addColorStop(1, rgba(mix(P.rust, P.night, 0.35)));
    g.fillStyle = cg;
    g.beginPath();
    g.moveTo(-7.2, -90); g.lineTo(-8, -105); g.quadraticCurveTo(0, -107.5, 8, -105); g.lineTo(7.2, -90);
    g.quadraticCurveTo(0, -88.5, -7.2, -90);
    g.fill();
    g.strokeStyle = rgba(P.ink, 0.6);
    g.lineWidth = 0.7;
    g.stroke();
    g.fillStyle = rgba(P.rust, 0.6);
    for (let i = 0; i < 12; i++) {
      g.beginPath(); g.arc(-6 + hash(i, 8) * 12, -102 + hash(i, 9) * 11, 0.35 + hash(i, 10) * 0.4, 0, TAU); g.fill();
    }
    g.restore();
  }
  g.restore();
}

function smoothFade(c) { return c < 0.6 ? 0 : (c - 0.6) / 0.4; }
