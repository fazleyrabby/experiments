// Offline capture driver for the overview screencast. Load the scene with
// ?capture&q=1&t=-1, then: const cap = await import('/tools/capture.js');
// await cap.setup(); await cap.shoot() (repeat until done). Frames are POSTed
// to a capture server (storm-at-sea/tools/capture_server.py) as JPEGs.
import * as THREE from 'three';

export const D = 18, FPS = 30;
const C = { frame: 0 };
const ready = () => new Promise(r => { const i = setInterval(() => { if (window.__arctic) { clearInterval(i); r(); } }, 200); });
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = u => { u = Math.min(Math.max(u, 0), 1); return u * u * (3 - 2 * u); };
const blend = (a, b, k) => ({ pos: a.pos.clone().lerp(b.pos, k), target: a.target.clone().lerp(b.target, k) });

// Shots, in seconds of video (= seconds of sim time from t = 0):
//   0 – 6.4   wide orbit from the port quarter, round the stern to the dive gate
//   6.0 – 8.7 locked-off at the gate: mask check, walk, giant stride, splash
//   8.6 – 11  follow the diver down through the surface
//   11 – 18   alongside the swimmer, torch on, through the fish and kelp
function shot(v, A) {
  const diver = A.rig.root.position;
  const yaw = A.rig.root.rotation.y;
  const wide = (() => {
    const e = ease(v / 6.4);
    const a = -2.3 + e * 2.55, R = 30 - e * 19, h = 12 - e * 9;
    const c = V(0, 1, 0).lerp(V(-2.2, 1.6, 0.6), e);
    return { pos: c.clone().add(V(Math.sin(a) * R, h, Math.cos(a) * R)), target: c };
  })();
  const gateCam = V(-0.6, 1.8, 6.2);
  const gate = { pos: gateCam, target: V(diver.x, Math.max(diver.y, 0.3), diver.z) };
  const swim = (() => {
    const a = yaw + Math.PI / 2 + 0.5 * Math.sin(v * 0.2 + 1);
    const p = diver.clone().add(V(Math.sin(a) * 5.6, 0.9, Math.cos(a) * 5.6));
    p.y = Math.min(p.y, -0.7);
    return { pos: p, target: diver.clone() };
  })();
  const down = (() => {
    const e = ease((v - 8.6) / 2.6);
    const p = diver.clone().add(V(2.6, 0.6, 3.6));
    p.y = Math.min(p.y, -0.8);
    return { pos: gateCam.clone().lerp(p, e), target: diver.clone() };
  })();
  if (v < 6.0) return wide;
  if (v < 6.8) return blend(wide, gate, ease((v - 6.0) / 0.8));
  if (v < 8.6) return gate;
  if (v < 10.8) return down;
  if (v < 11.8) return blend(down, swim, ease((v - 10.8) / 1.0));
  return swim;
}

export async function setup() {
  await ready();
  const A = window.__arctic;
  A.setCamHook((dt, t) => {
    const s = shot(Math.max(t, 0), A);
    A.camera.position.copy(s.pos);
    A.camera.lookAt(s.target);
  });
  // Warm up history buffers and particles before the first recorded frame.
  while (A.time < -1 / (2 * FPS)) A.tick(1 / FPS);
  return { t: A.time };
}

export async function shoot(maxMs = 20000) {
  const A = window.__arctic, cv = A.renderer.domElement;
  const t0 = performance.now();
  while (C.frame < D * FPS && performance.now() - t0 < maxMs) {
    A.tick(1 / FPS);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.94));
    await fetch(`/upload/f${String(C.frame).padStart(4, '0')}.jpg`, { method: 'POST', body: blob });
    C.frame++;
  }
  return { frame: C.frame, total: D * FPS, ms: Math.round(performance.now() - t0) };
}
