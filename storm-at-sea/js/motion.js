import * as THREE from 'three';

// Rigid-body seakeeping: heave / pitch / roll as damped oscillators driven by the
// wave surface sampled under the hull. The ship lags, overshoots and rolls at its
// own natural period instead of glueing itself to the water.
export class ShipMotion {
  constructor(ship, waves, { x = 0, z = 0, heading = 0, speed = 5 } = {}) {
    this.ship = ship;
    this.waves = waves;
    this.pos = new THREE.Vector2(x, z);
    this.heading0 = heading;
    this.heading = heading;
    this.speed0 = speed;
    this.speed = speed;
    this.heave = 0; this.vh = 0;
    this.pitch = 0; this.vp = 0;
    this.roll = 0; this.vr = 0;
    this.prevImm = 0; this.bowImm = 0; this.cool = 0;
    this.racing = 0;
    this.rudder = 0;      // -1 port .. +1 starboard (helm input)
    this.telegraph = 1;   // engine order as a fraction of service speed
    this.phase = Math.random() * 100;
    this.onSlam = null;
    this.setShip(ship);
    this.initialised = false;
  }

  // swap the hull riding this track (ship selector); motion state carries over
  setShip(ship) {
    this.ship = ship;
    const s = Math.sqrt(230 / ship.L);
    this.wH = 0.95 * s; this.wP = 1.05 * s; this.wR = 0.42 * s;
  }

  world(lx, lz, out) {
    const c = Math.cos(this.heading), s = Math.sin(this.heading);
    out.x = this.pos.x + lx * c + lz * s;
    out.y = this.pos.y - lx * s + lz * c;
    return out;
  }

  h(lx, lz, t) {
    const p = this.world(lx, lz, this._p || (this._p = new THREE.Vector2()));
    return this.waves.heightAt(p.x, p.y, t);
  }

  get forward() {
    return new THREE.Vector2(Math.cos(this.heading), -Math.sin(this.heading));
  }

  update(dt, t) {
    const { L, B } = this.ship;
    // helm: full rudder turns about 1.2°/s at service speed; steerage fades as the ship slows
    this.heading0 -= this.rudder * 0.021 * Math.min(1.2, this.speed / 5) * dt;
    this.heading = this.heading0 + 0.035 * Math.sin(t * 0.11 + this.phase) + 0.02 * Math.sin(t * 0.27 + this.phase * 2) - this.roll * 0.04;

    const xs = [-0.44, -0.22, 0, 0.22, 0.44];
    const hs = xs.map((x) => this.h(x * L, 0, t));
    const hp = this.h(0, -0.48 * B, t), hst = this.h(0, 0.48 * B, t);
    const hBow = this.h(0.49 * L, 0, t);
    const hStern = this.h(-0.47 * L, 0, t);

    const tgtHeave = (hs[0] + hs[1] + 2 * hs[2] + hs[3] + hs[4] + hp + hst) / 8;
    let num = 0;
    for (let i = 0; i < 5; i++) num += xs[i] * L * hs[i];
    const tgtPitch = Math.atan(num / (0.484 * L * L));
    const tgtRoll = -Math.atan2(hst - hp, 0.96 * B) * 1.5 - 0.035 + this.rudder * 0.05 * Math.min(1, this.speed / 5);

    if (!this.initialised) {
      this.heave = tgtHeave; this.pitch = tgtPitch; this.roll = tgtRoll; this.initialised = true;
    }

    const sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      this.vh += ((tgtHeave - this.heave) * this.wH * this.wH - this.vh * 2 * 0.55 * this.wH) * h;
      this.heave += this.vh * h;
      this.vp += ((tgtPitch - this.pitch) * this.wP * this.wP - this.vp * 2 * 0.45 * this.wP) * h;
      this.pitch += this.vp * h;
      this.vr += ((tgtRoll - this.roll) * this.wR * this.wR - this.vr * 2 * 0.1 * this.wR) * h;
      this.roll += this.vr * h;
    }
    this.roll = THREE.MathUtils.clamp(this.roll, -0.42, 0.42);
    // small hulls can't leave the water: keep the waterline within a fraction of the draft of the surface
    if (L < 120) {
      const lim = this.ship.T * 0.45;
      if (this.heave > hs[2] + lim) { this.heave = hs[2] + lim; this.vh = Math.min(this.vh, 0); }
      if (this.heave < hs[2] - lim * 1.6) { this.heave = hs[2] - lim * 1.6; this.vh = Math.max(this.vh, 0); }
      const pl = Math.atan2(hs[4] - hs[0], 0.88 * L);
      this.pitch = THREE.MathUtils.clamp(this.pitch, pl - 0.12, pl + 0.12);
    }

    // slow down when climbing a sea, surge when sliding down the back
    this.speed = THREE.MathUtils.lerp(this.speed, this.speed0 * this.telegraph * (1 - THREE.MathUtils.clamp(this.pitch * 4, -0.25, 0.6)), 1 - Math.exp(-dt * 0.25));
    const f = this.forward;
    this.pos.x += f.x * this.speed * dt;
    this.pos.y += f.y * this.speed * dt;

    const g = this.ship.group;
    g.position.set(this.pos.x, this.heave, this.pos.y);
    g.rotation.set(this.roll, this.heading, this.pitch, 'YZX');

    // bow immersion -> slamming & green water
    const bowY = this.heave + Math.sin(this.pitch) * 0.49 * L;
    const imm = hBow - bowY;
    const rate = (imm - this.prevImm) / Math.max(dt, 1e-3);
    this.prevImm = imm;
    this.bowImm = imm;
    this.cool -= dt;
    if (imm > 1.2 && rate > 2.2 && this.cool <= 0) {
      const I = THREE.MathUtils.clamp(0.3 + rate / 9 + imm / 10, 0.3, 1.6);
      this.cool = 1.4;
      if (this.onSlam) this.onSlam(this, I);
    }
    // propeller racing when the stern lifts clear
    const sternY = this.heave - Math.sin(this.pitch) * 0.47 * L;
    const propDepth = hStern - (sternY - this.ship.T + 4.5);
    this.racing = THREE.MathUtils.clamp(1 - propDepth / 3, 0, 1);
    this.ship.update(dt, t, this.racing);
  }
}
