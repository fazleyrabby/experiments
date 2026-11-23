import * as THREE from 'three/webgpu';
import { MeshBVH } from 'three-mesh-bvh/core/MeshBVH.js';

const RADIUS = 0.3;
const SEGMENT = 1.15;
const EYE = 1.32;
const WALK = 2.9;
const SPRINT = 5.6;
const GRAVITY = -19;
const JUMP = 5.8;
const MAX_STEP = 1 / 120;

export function createPlayer(camera, colliderGeometry, element, spawn) {
  const bvh = new MeshBVH(colliderGeometry);
  const position = new THREE.Vector3(spawn.x, spawn.y + RADIUS + 0.05, spawn.z);
  const start = position.clone();
  const velocity = new THREE.Vector3();
  const wish = new THREE.Vector3();
  const segment = new THREE.Line3();
  const bounds = new THREE.Box3();
  const trianglePoint = new THREE.Vector3();
  const capsulePoint = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const keys = new Set();
  const euler = new THREE.Euler(0, spawn.yaw ?? 0, 0, 'YXZ');
  let pitch = spawn.pitch ?? 0;
  let yaw = spawn.yaw ?? 0;
  let grounded = false;
  let bob = 0;

  const onKey = (event) => {
    if (!document.pointerLockElement) return;
    if (event.type === 'keydown') keys.add(event.code);
    else keys.delete(event.code);
    if (event.code === 'Space') event.preventDefault();
  };
  const onMouse = (event) => {
    if (document.pointerLockElement !== element) return;
    yaw -= event.movementX * 0.0021;
    pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0021, -1.45, 1.45);
  };
  const onLockChange = () => {
    if (!document.pointerLockElement) keys.clear();
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  window.addEventListener('mousemove', onMouse);
  document.addEventListener('pointerlockchange', onLockChange);

  function resolve(dt) {
    segment.start.copy(position);
    segment.end.copy(position).setY(position.y + SEGMENT);
    bounds.makeEmpty().expandByPoint(segment.start).expandByPoint(segment.end).expandByScalar(RADIUS);

    bvh.shapecast({
      intersectsBounds: (box) => box.intersectsBox(bounds),
      intersectsTriangle: (triangle) => {
        const distance = triangle.closestPointToSegment(segment, trianglePoint, capsulePoint);
        if (distance >= RADIUS) return;
        const depth = RADIUS - distance;
        const direction = capsulePoint.sub(trianglePoint).normalize();
        segment.start.addScaledVector(direction, depth);
        segment.end.addScaledVector(direction, depth);
      },
    });

    delta.subVectors(segment.start, position);
    grounded = delta.y > Math.abs(velocity.y * dt) * 0.25;
    position.copy(segment.start);
    if (grounded) velocity.y = Math.max(velocity.y, 0);
    else if (delta.lengthSq() > 1e-8) velocity.addScaledVector(delta.normalize(), -Math.min(velocity.dot(delta), 0));
  }

  return {
    position,
    get grounded() { return grounded; },
    update(dt) {
      const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
      const strafe = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
      const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? SPRINT : WALK;
      wish.set(strafe, 0, -forward);
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);

      const response = 1 - Math.exp(-dt * (grounded ? 13 : 2.5));
      velocity.x += (wish.x - velocity.x) * response;
      velocity.z += (wish.z - velocity.z) * response;
      if (grounded && keys.has('Space')) {
        velocity.y = JUMP;
        grounded = false;
      }

      const steps = Math.min(8, Math.ceil(dt / MAX_STEP));
      const stepDt = dt / steps;
      for (let i = 0; i < steps; i++) {
        velocity.y += GRAVITY * stepDt;
        position.addScaledVector(velocity, stepDt);
        resolve(stepDt);
      }

      if (position.y < -6) {
        position.copy(start);
        velocity.set(0, 0, 0);
      }

      const moving = Math.hypot(velocity.x, velocity.z);
      if (grounded) bob += moving * dt * 2.35;
      camera.position.set(position.x, position.y + EYE + Math.sin(bob * 2) * 0.018 * Math.min(moving / WALK, 1), position.z);
      euler.set(pitch, yaw, Math.sin(bob) * 0.0028 * Math.min(moving / WALK, 1));
      camera.quaternion.setFromEuler(euler);
    },
  };
}
