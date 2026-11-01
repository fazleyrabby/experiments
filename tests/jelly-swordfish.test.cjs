const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '../jelly-swordfish/index.html'), 'utf8');
function section(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1);
  const to = html.indexOf(end, from);
  assert.notEqual(to, -1);
  return html.slice(from, to);
}

// Run the real animation/status code without requiring a GPU or the CDN.
// Vector operations are only the small interface consumed by that code.
class Vector {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  addScaledVector(v, scale) { this.x += v.x * scale; this.y += v.y * scale; this.z += v.z * scale; return this; }
  multiplyScalar(scale) { this.x *= scale; this.y *= scale; this.z *= scale; return this; }
  applyQuaternion() { return this; } // Identity orientation for these animation tests.
  clampLength(min, max) {
    const length = Math.hypot(this.x, this.y, this.z);
    return this.multiplyScalar(Math.max(min, Math.min(max, length)) / (length || 1));
  }
}

function fixture() {
  const ctx = vm.createContext({
    time: 0, previousTime: 0, accumulator: 0, STEP: 1 / 120,
    hand: null, statusTimer: 0, status: { textContent: '' },
    halfWidth: 5, halfHeight: 3, MIN_CENTER_Y: -.18,
    center: new Vector(), velocity: new Vector(), home: new Vector(),
    goal: new Vector(), scratch: new Vector(), pull: new Vector(),
    inverseFishRotation: {},
    document: { hidden: false }, loading: { hidden: true }, canvas: { dataset: {} },
    scene: {}, camera: {}, renders: 0, physicsSteps: 0,
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    landingSquish() {}, updateSkin() {},
  });
  ctx.stepJelly = () => { ctx.physicsSteps++; };
  ctx.renderer = { render() { ctx.renders++; } };
  vm.runInContext([
    section('function setStatus(', 'function announce('),
    section('function step(dt)', 'function updateSkin()'),
    section('function frame(now)', "canvas.addEventListener('webglcontextlost'"),
  ].join('\n'), ctx);
  let now = 1000;
  ctx.advance = seconds => {
    for (let i = 0; i < Math.ceil(seconds * 60); i++) {
      now += 1000 / 60;
      ctx.frame(now);
    }
  };
  return ctx;
}

test('animation survives repeated jump, poke, release, and reset message expiry', () => {
  const app = fixture();
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const [label, duration] of [
      ['A little jelly jump', 1.2], ['A little jelly wobble', 2.2],
      ['Catch that wobble', 1.6], ['Back in shape', 1.8],
    ]) {
      app.velocity.y = 5.2;
      app.setStatus(label, duration);
      const before = app.renders;
      app.advance(4);
      assert.ok(app.renders >= before + 240, 'rendering continues after the message expires');
      assert.equal(app.status.textContent, 'Ready to wobble');
      assert.ok(Number.isFinite(app.center.y));
    }
  }
  assert.ok(app.physicsSteps > app.renders);
});

test('a grab can move in depth when the camera is rotated', () => {
  const app = fixture();
  app.hand = { world: new Vector(0, 1, 1.3), offset: new Vector(), moved: true };
  app.home.copy(app.hand.world);
  app.advance(2);
  assert.ok(app.center.z > 1.2, 'depth movement is retained');
  app.hand = null;
  app.velocity.z = 3;
  app.advance(.2);
  assert.ok(app.center.z > 1.6, 'release retains depth momentum');
});

test('a held grab and a later release both continue to animate', () => {
  const app = fixture();
  for (let repeat = 0; repeat < 3; repeat++) {
    app.hand = { world: new Vector(1, 1, 0), offset: new Vector(), moved: true };
    app.home.copy(app.hand.world);
    app.setStatus('Jelly in your hands', 1);
    app.advance(2);
    assert.ok(app.center.y > .5, 'held fish follows the grab');
    app.hand = null;
    app.setStatus('Catch that wobble', 1.6);
    app.advance(4);
    assert.equal(app.status.textContent, 'Ready to wobble');
    assert.equal(app.center.y, app.MIN_CENTER_Y);
  }
});
