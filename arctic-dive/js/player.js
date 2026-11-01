import * as THREE from 'three';
import { lerp, clamp01, smooth } from './noise.js';
import { HIP, POSE, mixPose, mixLegs, standPose, walkPose, swimPose, sinkPose, climbPose } from './diver.js';
import { seabedHeight } from './underwater.js';

// Third-person control of the diver: walk the deck, giant-stride off the gate,
// swim at the surface or below, climb the ladder back aboard.
//
// Boat geometry mirrors tools/blender/boat.py in boat-local coordinates
// (bow +X, the dive gate and ladder on the +Z side).

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sm = (a, b, x) => smooth(clamp01((x - a) / (b - a)));
const lerpAngle = (a, b, k) => a + (((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * k;
const deckHeight = x => 1.05 + 0.42 * Math.pow(sm(0.42, 1, (x + 4.2) / 8.6), 1.5);
const halfBeam = x => {
  const t = (x + 4.2) / 8.6;
  return t < 0.48 ? 1.3 : 1.3 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.48) / 0.52, 2.4)));
};
const RADIUS = 0.25;
// Deck obstacles as [xMin, xMax, zMin, zMax]: wheelhouse + tank rack, stern bench, cooler.
const BLOCKERS = [[-1.2, 1.78, -1.06, 1.06], [-4.0, -3.5, -0.95, 0.95], [-2.65, -1.95, -0.85, -0.4]];
const GATE = { x0: -3.3, x1: -2.2 };
const LADDER = { x: -2.74, zLow: 1.85, zTop: 1.62, hipLow: -0.45, hipTop: 1.55 };
const DECK_X = [-4.0, 4.0];
const SURFACE_HIP = -0.4;
const BOARD_POS = V(-2.74, 1.05, 0.98);

export function createPlayer(ctx) {
  const { rig, boat, ladderIK, maskIK, addRipple, splash, bubbleBurst, exhale, iceColliders } = ctx;
  const p = {
    mode: 'deck',
    pos: V(-1.55, 1.05, -0.25), // soles; boat-local on deck/ladder, world in air/water
    vel: V(),
    yaw: 0.35,
    pitch: 0,
    phase: 0,
    hop: 0, hopV: 0,
    hipY: 0,        // on the ladder
    boardT: 0,
    lastWake: 0,
    events: {},
    pose: standPose(0),
    prompt: '',
  };
  const tmp = V(), wish = V(), local = V(), head = V();

  function enterFrom(diverWorldPos) {
    boat.worldToLocal(local.copy(diverWorldPos));
    const sole = local.clone().setY(local.y - HIP);
    if (sole.y > 0.6 && Math.abs(sole.z) < halfBeam(sole.x) && sole.x > DECK_X[0] && sole.x < DECK_X[1]) {
      p.mode = 'deck';
      p.pos.copy(sole).setY(deckHeight(sole.x));
      resolveDeck(p.pos);
    } else {
      p.mode = 'swim';
      p.pos.copy(diverWorldPos).setY(Math.min(diverWorldPos.y, SURFACE_HIP) - HIP);
    }
    p.vel.set(0, 0, 0);
    p.yaw = rig.root.rotation.y;
  }

  // Keep a deck position out of the obstacles and inside the rails.
  function resolveDeck(q) {
    q.x = THREE.MathUtils.clamp(q.x, DECK_X[0], DECK_X[1]);
    const lim = halfBeam(q.x) - 0.3;
    q.z = THREE.MathUtils.clamp(q.z, -lim, lim);
    for (const [x0, x1, z0, z1] of BLOCKERS) {
      const ax0 = x0 - RADIUS, ax1 = x1 + RADIUS, az0 = z0 - RADIUS, az1 = z1 + RADIUS;
      if (q.x > ax0 && q.x < ax1 && q.z > az0 && q.z < az1) {
        const pen = [q.x - ax0, ax1 - q.x, q.z - az0, az1 - q.z];
        const m = pen.indexOf(Math.min(...pen));
        if (m === 0) q.x = ax0; else if (m === 1) q.x = ax1; else if (m === 2) q.z = az0; else q.z = az1;
      }
    }
    q.y = deckHeight(q.x);
  }

  const atGate = q => q.z > halfBeam(q.x) - 0.65 && q.x > GATE.x0 && q.x < GATE.x1;

  // Horizontal wish direction from WASD relative to the camera's heading.
  function moveWish(input) {
    const f = V(-Math.sin(input.camYaw), 0, -Math.cos(input.camYaw));
    const r = V(Math.cos(input.camYaw), 0, -Math.sin(input.camYaw));
    wish.set(0, 0, 0).addScaledVector(f, input.fwd).addScaledVector(r, input.right);
    if (wish.lengthSq() > 1) wish.normalize();
    return wish;
  }

  function startSwim(time) {
    p.mode = 'swim';
    p.vel.multiplyScalar(0.35);
    addRipple(p.pos.x, p.pos.z, 1.4);
    splash(p.pos.x, p.pos.z, 100, 0.9);
    bubbleBurst(V(p.pos.x, -0.8, p.pos.z), 80, 0.8);
    p.events.entered = time;
  }

  function updateDeck(dt, time, input) {
    const w = moveWish(input);
    const speed = input.sprint ? 2.4 : 1.3;
    p.vel.lerp(tmp.copy(w).multiplyScalar(speed), 1 - Math.exp(-dt * 10));
    const next = p.pos.clone().addScaledVector(p.vel, dt);
    // Stepping out through the open gate drops you over the side.
    if (atGate(next) && next.z > halfBeam(next.x) - 0.3 && p.vel.z > 0.3) {
      return launch(time, V(p.vel.x, 0.6, Math.max(p.vel.z, 1.2)));
    }
    resolveDeck(next);
    p.vel.subVectors(next, p.pos).divideScalar(Math.max(dt, 1e-4)).setY(0);
    p.pos.copy(next);
    if (input.jump) {
      if (atGate(p.pos)) return launch(time, V(0, 1.6, 1.9));
      if (p.hop === 0) p.hopV = 2.6;
    }
    p.hopV -= 9.8 * dt;
    p.hop = Math.max(0, p.hop + p.hopV * dt);
    if (p.hop === 0) p.hopV = 0;

    const s = Math.hypot(p.vel.x, p.vel.z);
    if (s > 0.15) p.yaw = lerpAngle(p.yaw, Math.atan2(p.vel.x, p.vel.z), 1 - Math.exp(-dt * 10));
    p.phase += dt * (4 + s * 3.2);
    let P = mixPose(standPose(time), walkPose(p.phase), clamp01(s / 1.1));
    if (p.hop > 0) P = mixPose(P, POSE.fall, clamp01(p.hop * 3));
    p.pitch = 0;
    p.prompt = atGate(p.pos) ? 'space · giant stride' : '';
    return { P, worldPos: boat.localToWorld(p.pos.clone().setY(p.pos.y + p.hop)), wMask: 0, wStride: atGate(p.pos) ? 1 : 0 };
  }

  // Leave the deck with a boat-local velocity.
  function launch(time, vLocal) {
    const start = boat.localToWorld(p.pos.clone());
    p.vel.copy(vLocal).applyQuaternion(boat.quaternion);
    p.pos.copy(start);
    p.mode = 'air';
    p.yaw = Math.atan2(vLocal.x, vLocal.z);
    p.events.launch = time;
    p.prompt = '';
    return updateAir(0, time, { fwd: 0, right: 0, camYaw: 0 });
  }

  function updateAir(dt, time) {
    p.vel.y -= 9.8 * dt;
    p.pos.addScaledVector(p.vel, dt);
    const k = clamp01((time - (p.events.launch || time)) / 0.3);
    const P = mixPose(POSE.strideOut, POSE.fall, k);
    if (p.pos.y + HIP < -0.2) startSwim(time);
    return { P, worldPos: p.pos.clone(), wMask: 0, wStride: 1 };
  }

  function updateSwim(dt, time, input) {
    // W/S follow the camera's full look direction, so looking down and pressing
    // W dives; A/D strafe; space / C rise and sink.
    const look = V(-Math.sin(input.camYaw) * Math.cos(input.camPitch), -Math.sin(input.camPitch), -Math.cos(input.camYaw) * Math.cos(input.camPitch));
    const r = V(Math.cos(input.camYaw), 0, -Math.sin(input.camYaw));
    wish.set(0, 0, 0).addScaledVector(look, input.fwd).addScaledVector(r, input.right);
    wish.y += input.up;
    if (wish.lengthSq() > 1) wish.normalize();
    const speed = input.sprint ? 2.4 : 1.25;
    p.vel.lerp(tmp.copy(wish).multiplyScalar(speed), 1 - Math.exp(-dt * 2.2));
    p.pos.addScaledVector(p.vel, dt);

    let hipY = p.pos.y + HIP;
    // Float at the surface unless diving; stay off the seabed.
    const atSurface = hipY > SURFACE_HIP - 0.08 && input.up >= 0 && wish.y > -0.2;
    if (hipY > SURFACE_HIP) { hipY = SURFACE_HIP; p.vel.y = Math.min(p.vel.y, 0); }
    if (atSurface) hipY = SURFACE_HIP + Math.sin(time * 1.6) * 0.03;
    hipY = Math.max(hipY, seabedHeight(p.pos.x, p.pos.z) + 0.8);
    p.pos.y = hipY - HIP;

    // Hull: an elliptical plan down to just below the keel.
    boat.worldToLocal(local.copy(p.pos).setY(hipY));
    if (local.y > -1.1) {
      const ex = (local.x - 0.1) / 4.9, ez = local.z / 1.65;
      const e = Math.hypot(ex, ez);
      if (e < 1) { local.x = 0.1 + (ex / e) * 4.9; local.z = (ez / e) * 1.65; const w2 = boat.localToWorld(local.clone()); p.pos.x = w2.x; p.pos.z = w2.z; }
    }
    // Icebergs: vertical cylinders around their submerged mass.
    for (const c of iceColliders) {
      const dx = p.pos.x - c.x, dz = p.pos.z - c.z, d = Math.hypot(dx, dz);
      if (d < c.r && d > 1e-3) { p.pos.x = c.x + (dx / d) * c.r; p.pos.z = c.z + (dz / d) * c.r; }
    }
    const R = 160, d0 = Math.hypot(p.pos.x, p.pos.z);
    if (d0 > R) { p.pos.x *= R / d0; p.pos.z *= R / d0; }

    const s = p.vel.length();
    const moving = clamp01((s - 0.15) / 0.6);
    if (s > 0.2) p.yaw = lerpAngle(p.yaw, Math.atan2(p.vel.x, p.vel.z), 1 - Math.exp(-dt * 4));
    const prone = Math.PI / 2 + Math.asin(THREE.MathUtils.clamp(-p.vel.y / Math.max(s, 1e-3), -0.9, 0.9)) * 0.85;
    const surfaceProne = Math.PI / 2 - 0.25;
    p.pitch = lerp(p.pitch, lerp(atSurface ? 0.25 : 0.12, atSurface ? surfaceProne : prone, moving), 1 - Math.exp(-dt * 3));
    const P = mixPose(sinkPose(time), swimPose(time * (0.7 + moving * 0.6)), moving);
    if (atSurface && s > 0.3 && time - p.lastWake > 0.45) { p.lastWake = time; addRipple(p.pos.x, p.pos.z, 0.35); }
    if (!atSurface && p.events.wasSurface === false) { /* still under */ }
    if (atSurface && p.events.wasSurface === false) { addRipple(p.pos.x, p.pos.z, 0.7); splash(p.pos.x, p.pos.z, 18, 0.35); }
    p.events.wasSurface = atSurface;

    // Ladder: grab it from the surface nearby.
    const base = boat.localToWorld(V(LADDER.x, 0, LADDER.zLow));
    const near = Math.hypot(p.pos.x - base.x, p.pos.z - base.z) < 1.3 && hipY > -1.4;
    p.prompt = near ? 'e · climb the ladder' : '';
    if (near && input.interact) {
      p.mode = 'ladder';
      p.hipY = Math.max(hipY, LADDER.hipLow);
      p.prompt = '';
    }
    exhale(time, p.events);
    return { P, worldPos: p.pos.clone().setY(hipY - HIP), wMask: 0, wStride: 0 };
  }

  function updateLadder(dt, time, input) {
    p.hipY = THREE.MathUtils.clamp(p.hipY + input.fwd * 0.85 * dt, LADDER.hipLow, LADDER.hipTop);
    const k = clamp01((p.hipY - LADDER.hipLow) / (LADDER.hipTop - LADDER.hipLow));
    p.yaw = Math.PI;
    p.pitch = 0.12;
    // Legs keep kicking while still in the water and take over the climb as the hips rise.
    const P = mixLegs(sinkPose(time), climbPose(p.hipY * 6), sm(-0.45, 0.15, p.hipY));
    if (p.hipY >= LADDER.hipTop - 1e-3 && input.fwd > 0) { p.mode = 'board'; p.boardT = 0; }
    if ((p.hipY <= LADDER.hipLow + 1e-3 && input.fwd < 0) || input.interact) {
      p.mode = 'swim';
      p.pos.copy(boat.localToWorld(V(LADDER.x, p.hipY - HIP, LADDER.zLow + 0.3)));
      p.vel.set(0, 0, 0);
    }
    if (k < 0.3 && input.fwd !== 0 && time - p.lastWake > 0.5) {
      p.lastWake = time;
      const w = boat.localToWorld(V(LADDER.x, 0, 1.8));
      addRipple(w.x, w.z, 0.3);
    }
    p.prompt = p.hipY >= LADDER.hipTop - 0.05 ? 'w · climb aboard' : 'w / s · climb · e · let go';
    const local2 = V(LADDER.x, p.hipY - HIP, lerp(LADDER.zLow, LADDER.zTop, k));
    return { P, worldPos: boat.localToWorld(local2), wMask: 0, wStride: 0, ladder: 1 };
  }

  function updateBoard(dt, time) {
    p.boardT = Math.min(1, p.boardT + dt / 0.9);
    const k = smooth(p.boardT);
    const from = V(LADDER.x, LADDER.hipTop - HIP, LADDER.zTop);
    const local2 = from.lerp(BOARD_POS, k);
    p.yaw = Math.PI;
    p.pitch = lerp(0.12, 0, k);
    const P = mixPose(climbPose(LADDER.hipTop * 6), standPose(time), k);
    if (p.boardT >= 1) { p.mode = 'deck'; p.pos.copy(BOARD_POS); p.vel.set(0, 0, 0); }
    p.prompt = '';
    return { P, worldPos: boat.localToWorld(local2), wMask: 0, wStride: 0, ladder: 1 - k };
  }

  return {
    get state() { return p; },
    enterFrom,
    update(dt, time, input) {
      const r = p.mode === 'deck' ? updateDeck(dt, time, input)
        : p.mode === 'air' ? updateAir(dt, time)
        : p.mode === 'swim' ? updateSwim(dt, time, input)
        : p.mode === 'ladder' ? updateLadder(dt, time, input)
        : updateBoard(dt, time);
      const pitch = p.pitch || r.P.pitch;
      rig.root.position.copy(r.worldPos).setY(r.worldPos.y + HIP + (r.P.dy || 0));
      rig.root.rotation.set(pitch, p.yaw, 0);
      rig.apply(r.P, pitch);
      rig.root.updateMatrixWorld(true);
      if (r.ladder) ladderIK(time, r.ladder, p.mode === 'ladder');
      maskIK(r.wMask, r.wStride);
      rig.head.getWorldPosition(head);
      return head.y < -0.2;
    },
  };
}
