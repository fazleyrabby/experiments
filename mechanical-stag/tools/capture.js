// Offline showcase renderer for the Mechanical Stag.
// Serve with tools/capture_pipe.py, open /?capture at 1920x1080, then:
//   const cap = await import('/tools/capture.js'); await cap.setup(); await cap.shoot(20000) ... (repeat until done); await cap.finish()
// Every frame advances the scene by exactly 1/FPS seconds, so the result is perfectly smooth
// no matter how long each frame takes to render. Frames go through the GPU H.264 encoder (WebCodecs),
// get muxed into an MP4 in memory, and the finished file is POSTed to /save.
import { Muxer, ArrayBufferTarget } from 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/+esm';

export const FPS = 60, D = 25;
const C = { frame: 0 };
let muxer, enc;
let S, gl, ov, g, W, H;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- camera: keyframes [t, angle°(0 = front, 90 = left side), dist, height, tx, ty, tz] ---------- */
const CAM = [
  [0.0, 28, 4.4, 1.0, 0, 1.05, 0.05],
  [2.2, 40, 3.4, 0.6, 0, 1.08, 0.05],
  [3.6, 74, 1.4, 0.14, 0, 1.0, -0.15],
  [4.8, 92, 1.1, 0.14, 0, 1.0, 0.22],
  [6.0, 40, 1.0, 0.14, 0, 1.55, 0.72],
  [7.5, 72, 3.1, 0.32, 0, 1.0, 0.1],
  [9.4, 100, 3.1, 0.3, 0, 1.0, 0.1],
  [11.0, 62, 3.6, 0.65, 0, 1.05, 0.1],
  [12.8, 92, 3.0, 0.4, 0.05, 0.9, -0.1],
  [14.4, 104, 2.6, 0.3, 0.1, 0.78, -0.3],
  [15.8, 60, 3.3, 0.5, 0, 1.02, 0.05],
  [18.0, 40, 3.0, 0.45, 0, 1.02, 0.05],
  [20.2, 26, 3.2, 0.8, 0, 0.85, 0.05],
  [22.2, 36, 3.2, 0.5, -0.12, 1.0, 0.14],
  [25.5, 60, 3.6, 0.3, -0.24, 1.05, 0.42]
];
/* where the stag looks: [t, yaw, pitch] */
const LOOK = [[0, 0.4, 0], [3, 0.6, -0.05], [6, 0.6, 0.05], [6.6, 0, -0.02], [9.4, 0.1, 0], [10, 0.5, 0], [22, 0.6, 0.05], [25.5, 0.8, 0.1]];

/* smooth (Catmull-Rom style) interpolation through non-uniform keyframes */
function track(keys, t) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0; while (keys[i + 1][0] < t) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const h = k2[0] - k1[0], u = (t - k1[0]) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return k1.slice(1).map((p1, j) => {
    const p0 = k0[j + 1], p2 = k2[j + 1], p3 = k3[j + 1];
    const m1 = (p2 - p0) / Math.max(1e-6, k2[0] - k0[0]) * h, m2 = (p3 - p1) / Math.max(1e-6, k3[0] - k1[0]) * h;
    return h00 * p1 + h10 * m1 + h01 * p2 + h11 * m2;
  });
}

/* ---------- events ---------- */
const EVENTS = [
  [6.5, (s) => s.setWalk(true)],
  [9.3, (s) => s.setWalk(false)],
  [9.8, (s) => s.setExplode(0.5)],
  [11.3, (s) => s.setExplode(1)],
  [13.0, (s) => s.select(s.parts.find((p) => p.key === 'achilles'))],
  [14.5, (s) => s.select(null)],
  [14.7, (s) => s.setExplode(0)],
  [15.5, (s) => s.dissolve()],
  [19.9, (s) => { s.pointer.in = false; s.pointer.down = false; s.drop(); }],
  [20.8, (s) => s.assemble()]
];
/* virtual cursor that carves through the swarm */
function cursorAt(t) {
  if (t < 17.4 || t > 19.9) return null;
  if (t > 18.95) return { x: 0.02, y: 0.05, down: t < 19.7, a: 1 - sstep(19.6, 19.9, t) };
  const u = (t - 17.4) / 1.55;
  return { x: -0.5 + 1.0 * (0.5 - 0.5 * Math.cos(u * Math.PI * 2)), y: 0.1 + 0.22 * Math.sin(u * Math.PI * 2), down: false, a: sstep(17.4, 17.7, t) };
}

/* ---------- captions ---------- */
const CAPS = [
  [3.4, 6.2, '01 · DETAIL', 'Machined, riveted, stamped', '206 parts: titanium, brass, carbon, sapphire'],
  [6.6, 9.4, '02 · GAIT', 'Every stride is hydraulic', '14 actuators push, fold and lift each leg'],
  [9.8, 12.8, '03 · ANATOMY', 'Explode it layer by layer', 'Armor, actuators, skeleton, core'],
  [13.0, 14.9, '04 · INSPECT', 'Click any part', 'Name, material and job of every piece'],
  [15.6, 19.8, '05 · DISSOLVE', 'Into 12,000 micro-parts', 'Sweep a cursor through the swarm'],
  [20.0, 22.9, '06 · REBUILD', 'Drop it. Rebuild it.', 'Every piece flies home to its exact spot']
];

export async function setup() {
  while (!(window.STAG && window.STAG.ready)) await sleep(100);
  S = window.STAG;
  for (let i = 0; i < 80 && !S.gtao; i++) await sleep(100);
  await Promise.all(['600 64px "IBM Plex Sans"', '400 24px "IBM Plex Sans"', '500 18px "IBM Plex Mono"', '400 14px "IBM Plex Mono"'].map((f) => document.fonts.load(f)));
  gl = S.renderer.domElement; W = gl.width; H = gl.height;
  ov = document.createElement('canvas'); ov.width = W; ov.height = H; g = ov.getContext('2d');
  muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H, frameRate: FPS }, fastStart: 'in-memory' });
  enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { C.err = String(e); console.error(e); } });
  const cfg = { codec: 'avc1.640033', width: W, height: H, bitrate: 32_000_000, bitrateMode: 'variable', framerate: FPS, latencyMode: 'quality', avc: { format: 'avc' } };
  const sup = await VideoEncoder.isConfigSupported(cfg);
  if (!sup.supported) throw new Error('encoder config unsupported');
  enc.configure(cfg);
  S.restart();
  C.frame = 0; C.ev = 0; C.labA = new Map(); C.cardA = 0;
  return { W, H, gtao: !!S.gtao, frames: D * FPS };
}

function direct(t) {
  while (C.ev < EVENTS.length && t >= EVENTS[C.ev][0]) EVENTS[C.ev++][1](S);
  const [ang, dist, hgt, tx, ty, tz] = track(CAM, t), a = ang * Math.PI / 180;
  S.controls.target.set(tx, ty, tz);
  S.camera.position.set(tx + Math.sin(a) * dist, ty + hgt, tz + Math.cos(a) * dist);
  const [yaw, pitch] = track(LOOK, t);
  S.lookOv = { yaw, pitch };
  const c = cursorAt(t);
  if (c) { S.pointer.in = true; S.pointer.ndc.set(c.x, c.y); S.pointer.down = c.down; }
  C.cursor = c;
}

/* ---------- overlay drawing ---------- */
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function drawLabels(dt) {
  for (const L of S.LABELS) {
    const target = L.o && L.lx !== undefined ? 1 : 0;
    const a = (C.labA.get(L) ?? 0) + (target - (C.labA.get(L) ?? 0)) * (1 - Math.exp(-dt * 8));
    C.labA.set(L, a);
    if (a < 0.02) continue;
    const col = S.LAYER_COL[L.p.layer];
    const [title, sub] = [L.el.childNodes[0].textContent, L.el.querySelector('small').textContent];
    g.globalAlpha = a * (1 - 0.8 * C.cardA);
    g.strokeStyle = 'rgba(231,236,241,.45)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(L.ax, L.ay); g.lineTo(L.lx, L.ly); g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(L.ax, L.ay, 3.2, 0, Math.PI * 2); g.fill();
    g.font = '500 17px "IBM Plex Mono"'; const w1 = g.measureText(title).width + 22;
    g.font = '400 13px "IBM Plex Mono"'; const w2 = g.measureText(sub).width;
    const w = Math.max(w1, w2) + 22, h = 48, x = L.lx - w / 2, y = L.ly - h / 2;
    rr(x, y, w, h, 9); g.fillStyle = 'rgba(10,12,15,.8)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = col; g.beginPath(); g.arc(x + 15, y + 17, 3.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e7ecf1'; g.font = '500 17px "IBM Plex Mono"'; g.textBaseline = 'middle'; g.fillText(title, x + 26, y + 17);
    g.fillStyle = '#8b96a3'; g.font = '400 13px "IBM Plex Mono"'; g.fillText(sub, x + 11, y + 35);
  }
  g.globalAlpha = 1;
}
function wrap(text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function drawCard(dt) {
  const p = S.selected;
  C.cardA += ((p ? 1 : 0) - C.cardA) * (1 - Math.exp(-dt * 7));
  if (p) C.cardP = p;
  if (C.cardA < 0.02 || !C.cardP) return;
  const q = C.cardP, x = 80, y = 80 + (1 - C.cardA) * 14, w = 470;
  g.globalAlpha = C.cardA;
  g.font = '400 19px "IBM Plex Sans"';
  const role = wrap(q.role, w - 150), mat = wrap(q.mat, w - 150);
  const h = 132 + (role.length + mat.length) * 26;
  rr(x, y, w, h, 18); g.fillStyle = 'rgba(14,17,21,.84)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.stroke();
  g.textBaseline = 'alphabetic';
  g.fillStyle = S.LAYER_COL[q.layer]; g.font = '500 15px "IBM Plex Mono"'; g.fillText((S.LAYER_NAME[q.layer] + ' layer').toUpperCase().split('').join(' '), x + 26, y + 40);
  g.fillStyle = '#e7ecf1'; g.font = '600 30px "IBM Plex Sans"'; g.fillText(q.name, x + 26, y + 82);
  let yy = y + 120;
  const row = (k, lines) => { g.fillStyle = '#8b96a3'; g.font = '400 15px "IBM Plex Mono"'; g.fillText(k, x + 26, yy); g.fillStyle = '#e7ecf1'; g.font = '400 19px "IBM Plex Sans"'; lines.forEach((l, i) => g.fillText(l, x + 124, yy + i * 26)); yy += lines.length * 26 + 8; };
  row('Material', mat); row('Function', role);
  g.globalAlpha = 1;
}
function drawCaption(t) {
  for (const [t0, t1, kick, title, sub] of CAPS) {
    if (t < t0 - 0.1 || t > t1 + 0.1) continue;
    const a = sstep(t0, t0 + 0.6, t) * (1 - sstep(t1 - 0.6, t1, t)), dy = (1 - sstep(t0, t0 + 0.8, t)) * 16;
    const x = 96, y = H - 150 + dy;
    g.globalAlpha = a; g.textBaseline = 'alphabetic';
    g.fillStyle = '#5ef2ff'; g.font = '500 18px "IBM Plex Mono"'; g.fillText(kick.split('').join(' '), x, y);
    g.fillStyle = '#e7ecf1'; g.font = '600 52px "IBM Plex Sans"'; g.fillText(title, x - 2, y + 60);
    g.fillStyle = '#9aa5b1'; g.font = '400 24px "IBM Plex Sans"'; g.fillText(sub, x, y + 100);
    g.fillStyle = '#5ef2ff'; g.fillRect(x - 22, y - 16, 3, 118 * a);
  }
  g.globalAlpha = 1;
}
function drawTitle(t, t0, t1, big) {
  const a = sstep(t0, t0 + 0.9, t) * (1 - sstep(t1 - 0.9, t1, t));
  if (a <= 0) return;
  g.globalAlpha = a; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const cx = 96, y = H * 0.14;
  g.fillStyle = '#5ef2ff'; g.fillRect(cx - 22, y - 16, 3, 150);
  g.fillStyle = '#5ef2ff'; g.font = '500 18px "IBM Plex Mono"'; g.fillText('CERV-07  ·  ONLINE'.split('').join(' '), cx, y);
  g.fillStyle = '#eef2f6'; g.font = '600 76px "IBM Plex Sans"'; g.fillText('Mechanical Stag', cx, y + 86);
  g.fillStyle = '#9aa5b1'; g.font = '400 24px "IBM Plex Sans"'; g.fillText(big ? 'A clockwork stag built from 206 machined parts' : 'Explode it · inspect it · walk it · dissolve it', cx, y + 130);
  g.textAlign = 'left'; g.globalAlpha = 1;
}
function drawCursor(c) {
  if (!c) return;
  const x = (c.x * 0.5 + 0.5) * W, y = (-c.y * 0.5 + 0.5) * H, r = c.down ? 46 : 26;
  g.globalAlpha = c.a;
  g.strokeStyle = 'rgba(94,242,255,.9)'; g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(94,242,255,.15)'; g.fill();
  g.fillStyle = '#e7ecf1'; g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
}
function compose(t, dt) {
  g.drawImage(gl, 0, 0);
  const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.45, W / 2, H * 0.45, H * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  drawLabels(dt); drawCard(dt); drawCursor(C.cursor); drawCaption(t);
  drawTitle(t, 0.5, 3.3, true); drawTitle(t, 23.0, 25.2, false);
  const fade = 1 - sstep(0, 0.9, t) * (1 - sstep(D - 1.1, D, t));
  if (fade > 0.001) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, W, H); }
}

export async function shoot(maxMs = 20000) {
  const t0 = performance.now(), total = D * FPS, dt = 1 / FPS;
  let pending = [];
  while (C.frame < total && performance.now() - t0 < maxMs) {
    const t = C.frame / FPS;
    direct(t);
    S.step(1, dt);
    compose(t, dt);
    const vf = new VideoFrame(ov, { timestamp: Math.round(C.frame * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    enc.encode(vf, { keyFrame: C.frame % (FPS * 2) === 0 });
    vf.close();
    while (enc.encodeQueueSize > 6) await new Promise((r) => enc.addEventListener('dequeue', r, { once: true }));
    C.frame++;
  }
  await Promise.all(pending);
  return { frame: C.frame, total, ms: Math.round(performance.now() - t0), state: S.SW.state, err: C.err || null };
}

export async function finish() {
  await enc.flush(); enc.close();
  muxer.finalize();
  C.buf = muxer.target.buffer;
  return upload();
}
/* upload the finished mp4 in 4 MB chunks (one huge POST gets cut off) */
export async function upload() {
  const buf = C.buf, CH = 4 * 1024 * 1024;
  for (let off = 0; off < buf.byteLength; off += CH) {
    const r = await fetch(`/save?off=${off}`, { method: 'POST', body: buf.slice(off, Math.min(buf.byteLength, off + CH)) });
    if (!r.ok) throw new Error('chunk failed at ' + off);
  }
  return { bytes: buf.byteLength, err: C.err || null };
}
