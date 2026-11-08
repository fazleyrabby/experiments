// First-person exploration controller: pointer-lock mouse look, WASD movement,
// terrain following, jump, head-bob, collision resolution and touch support.
import * as THREE from 'three';

export function createFirstPersonController({
  camera,
  domElement,
  getHeight,
  colliders = [],
  onStep,
  onLockChange,
  onExitRequest
}) {
  const EYE_HEIGHT = 1.67;
  const RADIUS = 0.32;
  const WALK_SPEED = 2.7;
  const SPRINT_SPEED = 4.7;
  const GRAVITY = 19;
  const JUMP_SPEED = 5.0;

  const isTouch = window.matchMedia('(pointer: coarse)').matches ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0);

  const state = {
    active: false,
    locked: false,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    verticalVel: 0,
    onGround: true,
    bobTime: 0,
    bobAmount: 0,
    stepAccum: 0,
    sprint: false,
    baseFov: 50
  };

  const keys = new Set();
  let joystick = { active: false, pointerId: null, startX: 0, startY: 0, x: 0, y: 0 };
  let lookPointer = { id: null, lastX: 0, lastY: 0 };
  const dragLook = { active: false, id: null, x: 0, y: 0 };
  let everLocked = false;

  const joystickEl = document.getElementById('touch-joystick');
  const joystickThumb = document.getElementById('touch-thumb');
  const lookPadEl = document.getElementById('touch-look');

  // -------------------------------------------------------------------------
  // Collision helpers
  // -------------------------------------------------------------------------
  function resolveCollisions() {
    for (let pass = 0; pass < 3; pass++) {
      let corrected = false;

      for (const c of colliders) {
        if (!c) continue;

        if (c.type === 'circle') {
          const dx = state.pos.x - c.x;
          const dz = state.pos.z - c.z;
          const minDist = (c.r || 0.3) + RADIUS;
          const d = Math.hypot(dx, dz);
          if (d < minDist) {
            const nx = d > 0.0001 ? dx / d : 1;
            const nz = d > 0.0001 ? dz / d : 0;
            state.pos.x = c.x + nx * minDist;
            state.pos.z = c.z + nz * minDist;
            corrected = true;
          }
        } else if (c.type === 'box') {
          const rot = c.rot || 0;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          const dx = state.pos.x - c.x;
          const dz = state.pos.z - c.z;
          // World -> box local
          const lx = dx * cos - dz * sin;
          const lz = dx * sin + dz * cos;
          const hw = (c.hw || 0.5) + RADIUS;
          const hl = (c.hl || 0.5) + RADIUS;

          if (Math.abs(lx) < hw && Math.abs(lz) < hl) {
            const penX = hw - Math.abs(lx);
            const penZ = hl - Math.abs(lz);
            let pushX = 0;
            let pushZ = 0;
            if (penX < penZ) {
              pushX = (lx > 0 ? penX : -penX);
            } else {
              pushZ = (lz > 0 ? penZ : -penZ);
            }
            // Local -> world
            state.pos.x += pushX * cos + pushZ * sin;
            state.pos.z += -pushX * sin + pushZ * cos;
            corrected = true;
          }
        }
      }

      if (!corrected) break;
    }

    // Stay inside the playable clearing
    const r = Math.hypot(state.pos.x, state.pos.z);
    if (r > 22) {
      state.pos.x = (state.pos.x / r) * 22;
      state.pos.z = (state.pos.z / r) * 22;
    }
  }

  // -------------------------------------------------------------------------
  // Input
  // -------------------------------------------------------------------------
  const onKeyDown = (e) => {
    if (!state.active) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
      e.preventDefault();
    }
    if (k === ' ' && state.onGround) {
      state.verticalVel = JUMP_SPEED;
      state.onGround = false;
    }
    keys.add(k);
  };

  const onKeyUp = (e) => {
    keys.delete(e.key.toLowerCase());
  };

  const onMouseMove = (e) => {
    if (!state.active || !state.locked) return;
    const sensitivity = 0.0021;
    state.yaw -= e.movementX * sensitivity;
    state.pitch -= e.movementY * sensitivity;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.38, 1.35);
  };

  const onPointerLockChange = () => {
    const locked = document.pointerLockElement === domElement;
    const wasLocked = state.locked;
    state.locked = locked;
    if (locked) everLocked = true;
    // Only notify the UI when a real lock is gained, or when an existing lock
    // is released (Esc). A failed initial request must not re-open the overlay,
    // otherwise the click-drag fallback would be unusable.
    if (onLockChange && (locked || wasLocked)) onLockChange(locked, everLocked);
  };

  const requestLock = () => {
    if (state.active && !isTouch && document.pointerLockElement !== domElement) {
      const p = domElement.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);

  domElement.addEventListener('click', () => {
    if (state.active && !isTouch) requestLock();
  });

  // Touch look / joystick + desktop drag-look fallback
  const canvasPointerDown = (e) => {
    if (!state.active) return;

    if (!isTouch) {
      if (!state.locked) {
        dragLook.active = true;
        dragLook.id = e.pointerId;
        dragLook.x = e.clientX;
        dragLook.y = e.clientY;
        requestLock();
      }
      return;
    }

    if (e.clientX < window.innerWidth * 0.42 && joystick.pointerId === null) {
      joystick.pointerId = e.pointerId;
      joystick.active = true;
      joystick.startX = e.clientX;
      joystick.startY = e.clientY;
      joystick.x = 0;
      joystick.y = 0;
      if (joystickEl) {
        joystickEl.style.display = 'block';
        joystickEl.style.left = `${e.clientX}px`;
        joystickEl.style.top = `${e.clientY}px`;
      }
      if (joystickThumb) joystickThumb.style.transform = 'translate(-50%, -50%)';
    } else if (e.clientX >= window.innerWidth * 0.42 && lookPointer.id === null) {
      lookPointer.id = e.pointerId;
      lookPointer.lastX = e.clientX;
      lookPointer.lastY = e.clientY;
      if (lookPadEl) lookPadEl.classList.add('active');
    }
  };

  const canvasPointerMove = (e) => {
    if (!state.active) return;

    if (!isTouch) {
      if (dragLook.active && e.pointerId === dragLook.id && (e.buttons & 1 || e.pointerType === 'touch')) {
        const dx = e.clientX - dragLook.x;
        const dy = e.clientY - dragLook.y;
        dragLook.x = e.clientX;
        dragLook.y = e.clientY;
        state.yaw -= dx * 0.0045;
        state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0038, -1.38, 1.35);
      }
      return;
    }

    if (e.pointerId === joystick.pointerId) {
      let dx = e.clientX - joystick.startX;
      let dy = e.clientY - joystick.startY;
      const max = 55;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      joystick.x = dx / max;
      joystick.y = dy / max;
      if (joystickThumb) {
        joystickThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      }
    } else if (e.pointerId === lookPointer.id) {
      const dx = e.clientX - lookPointer.lastX;
      const dy = e.clientY - lookPointer.lastY;
      lookPointer.lastX = e.clientX;
      lookPointer.lastY = e.clientY;
      state.yaw -= dx * 0.0055;
      state.pitch = THREE.MathUtils.clamp(state.pitch - dy * 0.0045, -1.3, 1.25);
    }
  };

  const canvasPointerUp = (e) => {
    if (e.pointerId === dragLook.id) {
      dragLook.active = false;
      dragLook.id = null;
    }
    if (e.pointerId === joystick.pointerId) {
      joystick.pointerId = null;
      joystick.active = false;
      joystick.x = 0;
      joystick.y = 0;
      if (joystickEl) joystickEl.style.display = 'none';
    }
    if (e.pointerId === lookPointer.id) {
      lookPointer.id = null;
      if (lookPadEl) lookPadEl.classList.remove('active');
    }
  };

  domElement.addEventListener('pointerdown', canvasPointerDown);
  window.addEventListener('pointermove', canvasPointerMove);
  window.addEventListener('pointerup', canvasPointerUp);
  window.addEventListener('pointercancel', canvasPointerUp);

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  function enter({ x, z, yaw = 0, pitch = 0, fov = 50 }) {
    state.active = true;
    state.pos.set(x, getHeight(x, z), z);
    state.vel.set(0, 0, 0);
    state.verticalVel = 0;
    state.yaw = yaw;
    state.pitch = pitch;
    state.onGround = true;
    state.bobTime = 0;
    state.bobAmount = 0;
    state.stepAccum = 0;
    state.baseFov = fov;
    camera.fov = fov;
    camera.updateProjectionMatrix();

    camera.position.set(x, state.pos.y + EYE_HEIGHT, z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    if (!isTouch) requestLock();
    if (joystickEl) joystickEl.style.display = 'none';
  }

  function exit() {
    state.active = false;
    state.locked = false;
    keys.clear();
    joystick.active = false;
    joystick.pointerId = null;
    if (document.pointerLockElement === domElement) document.exitPointerLock();
    if (joystickEl) joystickEl.style.display = 'none';
    if (lookPadEl) lookPadEl.classList.remove('active');
    if (onLockChange) onLockChange(false);
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  const moveDir = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const targetVel = new THREE.Vector3();

  function update(delta) {
    if (!state.active) return;

    let inputX = 0;
    let inputZ = 0;

    if (keys.has('w') || keys.has('arrowup')) inputZ += 1;
    if (keys.has('s') || keys.has('arrowdown')) inputZ -= 1;
    if (keys.has('d') || keys.has('arrowright')) inputX += 1;
    if (keys.has('a') || keys.has('arrowleft')) inputX -= 1;
    if (isTouch && joystick.active) {
      inputX += joystick.x;
      inputZ += -joystick.y;
    }

    moveDir.set(inputX, 0, inputZ);
    if (moveDir.lengthSq() > 1) moveDir.normalize();

    state.sprint = keys.has('shift');
    const speed = state.sprint ? SPRINT_SPEED : WALK_SPEED;

    forward.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

    targetVel.set(0, 0, 0)
      .addScaledVector(forward, moveDir.z * speed)
      .addScaledVector(right, moveDir.x * speed);

    // Snappier acceleration on the ground, floatier in the air
    const accel = state.onGround ? 14 : 4;
    const blend = 1 - Math.exp(-accel * delta);
    state.vel.lerp(targetVel, blend);

    state.pos.x += state.vel.x * delta;
    state.pos.z += state.vel.z * delta;
    resolveCollisions();

    // Vertical motion / jump
    const ground = getHeight(state.pos.x, state.pos.z);
    if (!state.onGround || state.pos.y > ground + 0.02) {
      state.verticalVel -= GRAVITY * delta;
      state.pos.y += state.verticalVel * delta;
      if (state.pos.y <= ground) {
        state.pos.y = ground;
        state.verticalVel = 0;
        state.onGround = true;
      } else {
        state.onGround = false;
      }
    } else {
      state.pos.y = ground;
      state.onGround = true;
    }

    // Head bob + footsteps
    const horizSpeed = Math.hypot(state.vel.x, state.vel.z);
    const moving = horizSpeed > 0.25 && state.onGround;
    const targetBob = moving ? THREE.MathUtils.clamp(horizSpeed / SPRINT_SPEED, 0, 1) : 0;
    state.bobAmount += (targetBob - state.bobAmount) * Math.min(1, delta * 8);

    if (moving) {
      state.bobTime += delta * (6.0 + horizSpeed * 1.15);
      state.stepAccum += delta * horizSpeed;
      if (state.stepAccum > 1.5) {
        state.stepAccum = 0;
        if (onStep) onStep(THREE.MathUtils.clamp(horizSpeed / SPRINT_SPEED, 0.35, 1));
      }
    } else {
      state.bobTime += delta * 1.2;
    }

    const bobY = Math.sin(state.bobTime * 2.0) * 0.032 * state.bobAmount;
    const bobX = Math.cos(state.bobTime) * 0.022 * state.bobAmount;
    const roll = Math.sin(state.bobTime) * 0.008 * state.bobAmount;

    camera.position.set(
      state.pos.x + bobX * Math.cos(state.yaw),
      state.pos.y + EYE_HEIGHT + bobY,
      state.pos.z - bobX * Math.sin(state.yaw)
    );
    camera.rotation.set(state.pitch, state.yaw, roll, 'YXZ');

    // FOV widens slightly while sprinting
    const targetFov = state.baseFov + (state.sprint && moving ? 5 : 0);
    if (Math.abs(camera.fov - targetFov) > 0.02) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 6);
      camera.updateProjectionMatrix();
    }
  }

  // Debug / preset helper: place the player without touching the input state.
  function setPose(x, z, yaw = state.yaw, pitch = state.pitch) {
    state.pos.set(x, getHeight(x, z), z);
    state.vel.set(0, 0, 0);
    state.yaw = yaw;
    state.pitch = pitch;
    camera.position.set(x, state.pos.y + EYE_HEIGHT, z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  return {
    enter,
    exit,
    update,
    setPose,
    requestLock,
    isActive: () => state.active,
    isLocked: () => state.locked,
    isTouch: () => isTouch,
    getPosition: () => state.pos,
    getYaw: () => state.yaw,
    getPitch: () => state.pitch
  };
}
