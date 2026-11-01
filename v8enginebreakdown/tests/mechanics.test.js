import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { solveSliderCrank, ROD_LENGTH, CRANK_RADIUS, THROW_PHASES } from '../src/engine/mechanics.js';
import { EngineAnimation } from '../src/animation.js';

test('all eight sliders preserve rod length and cylinder axis through two revolutions', () => {
  for (const side of [-1, 1]) for (const phase of THROW_PHASES) {
    for (let i = 0; i <= 720; i++) {
      const p = solveSliderCrank(i * Math.PI / 180, side, phase);
      assert.ok(Math.abs(Math.hypot(p.pistonX - p.crankX, p.pistonY - p.crankY) - ROD_LENGTH) < 1e-12);
      assert.ok(Math.abs(p.pistonX - side * p.pistonY) < 1e-12);
      assert.ok(p.distance >= ROD_LENGTH - CRANK_RADIUS - 1e-12);
      assert.ok(p.distance <= ROD_LENGTH + CRANK_RADIUS + 1e-12);
    }
  }
});

const makeParts = () => Array.from({ length: 8 }, (_, i) => {
  const object = new THREE.Group(); object.position.set(i * .1, i * .2, -i * .3);
  return { object, origin: object.position.clone(), offset: new THREE.Vector3(i % 2 ? 2 : -2, i * .4, 1), order: i / 8 };
});
const advance = (animation, seconds) => { for (let i = 0; i < Math.ceil(seconds * 60); i++) animation.update(1 / 60); };

test('automatic cycle explodes then returns every part precisely to its original position', () => {
  const parts = makeParts(); const animation = new EngineAnimation(parts);
  advance(animation, 10);
  assert.equal(animation.state, 'EXPLODED'); assert.equal(animation.progress, 1);
  parts.forEach(p => assert.ok(p.object.position.distanceTo(p.origin.clone().add(p.offset)) < 1e-12));
  advance(animation, 12);
  assert.equal(animation.state, 'ASSEMBLED'); assert.equal(animation.progress, 0);
  parts.forEach(p => assert.ok(p.object.position.distanceTo(p.origin) < 1e-12));
});

test('rapid reversals start from the current transforms without jumps or stale completion', () => {
  const parts = makeParts(); const animation = new EngineAnimation(parts);
  animation.moveTo(1); advance(animation, 1.5);
  const before = parts.map(p => p.object.position.clone());
  animation.moveTo(0); animation.update(0);
  parts.forEach((p, i) => assert.ok(p.object.position.distanceTo(before[i]) < 1e-12));
  advance(animation, .25); animation.moveTo(1); advance(animation, .4); animation.moveTo(0);
  advance(animation, 6);
  assert.equal(animation.auto, false); assert.equal(animation.state, 'ASSEMBLED');
  parts.forEach(p => assert.ok(p.object.position.distanceTo(p.origin) < 1e-12));
});

test('reduced motion stays assembled until manually activated', () => {
  const animation = new EngineAnimation(makeParts(), { reducedMotion: true });
  advance(animation, 30);
  assert.equal(animation.progress, 0); assert.equal(animation.rotation, 0); assert.equal(animation.crankAngle, 0);
  animation.moveTo(1); advance(animation, 1); assert.equal(animation.state, 'EXPLODED');
});
