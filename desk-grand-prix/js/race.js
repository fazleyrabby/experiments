// Race control and the AI drivers. AI cars follow a racing line that swings to the
// inside of each corner, brake to a per-sample reference speed (scaled by skill),
// look ahead for slower cars and pick a side to pass. A light rubber band keeps
// the pack close to the player without making them sit still.
import { HALF_W } from './track.js';

export class AIDriver {
  constructor(racer, track, skill, bias, seed) {
    this.racer = racer; this.track = track; this.skill = skill; this.bias = bias;
    this.avoid = 0; this.t = seed * 10; this.mood = 1;
  }
  update(dt, racers, player) {
    const b = this.racer.body, tr = this.track, inp = b.input;
    this.t += dt;
    if (b.air || b.crashed > 0) { inp.throttle = 0.6; inp.brake = 0; inp.steer = 0; return; }
    const u = Math.max(0, b.u);
    // rubber band against the player's progress
    let band = 1;
    if (player && player !== this.racer && !player.finished) {
      const gap = this.racer.progress - player.progress;
      band = gap > 70 ? 0.94 : gap < -90 ? 1.05 : 1;
    }
    this.mood += (band - this.mood) * Math.min(1, dt * 0.8);
    // traffic: pick a side when closing on someone
    let want = 0;
    for (const o of racers) {
      if (o === this.racer || o.body.crashed > 0) continue;
      let ds = o.body.s - b.s; const L = tr.length;
      if (ds < -L / 2) ds += L; if (ds > L / 2) ds -= L;
      if (ds > 0 && ds < 16 && Math.abs(o.body.d - b.d) < 4.2 && u > o.body.u - 4) {
        want = o.body.d > 0 ? o.body.d - 3.6 : o.body.d + 3.6;
      }
    }
    this.avoid += ((want || 0) - this.avoid) * Math.min(1, dt * 3);
    const Ls = 7 + 0.13 * u;
    const ia = Math.floor(tr.wrapS(b.s + Ls) / tr.ds) % tr.N;
    let dT = tr.line[ia] * 0.9 + this.bias + this.avoid + Math.sin(this.t * 0.7) * 0.25;
    dT = Math.max(-HALF_W + 2.8, Math.min(HALF_W - 2.8, dT));
    const psiD = Math.atan2(dT - b.d, Ls);
    const fAhead = tr.sample(b.s + Ls * 0.5);
    const ff = Math.atan((b.a + b.b) * fAhead.kGeo);
    const delta = ff + 1.5 * (psiD - b.psi) - 0.035 * (b.r - u * fAhead.kGeo);
    inp.steer = Math.max(-1, Math.min(1, delta / b.maxDelta()));
    const iv = Math.floor(tr.wrapS(b.s + u * 0.16) / tr.ds) % tr.N;
    const vt = tr.vRef[iv] * this.skill * this.mood;
    if (u < vt) { inp.throttle = Math.min(1, 0.45 + (vt - u) * 0.08); inp.brake = 0; }
    else { inp.throttle = 0; inp.brake = u > vt + 4 ? Math.min(1, (u - vt) * 0.05) : 0; }
    inp.handbrake = 0;
  }
}

export class Race {
  constructor(track, racers, laps = 4) {
    this.track = track; this.racers = racers; this.laps = laps;
    this.state = 'idle'; this.t = 0; this.raceTime = 0; this.lights = 0; this.order = racers.slice();
    this.finishOrder = [];
  }

  grid(playerSlot = 3) {
    const tr = this.track;
    const others = this.racers.filter((r) => !r.isPlayer), player = this.racers.find((r) => r.isPlayer);
    const order = others.slice(); order.splice(playerSlot, 0, player);
    order.forEach((r, k) => {
      const s = tr.sStart - 8 - k * 7.5 + 2.2, d = k % 2 ? 3.4 : -3.4;
      r.body.reset(s, d);
      r.body.input.throttle = 0; r.body.input.brake = 0; r.body.input.steer = 0;
      r.crossings = 0; r.lapStart = 0; r.lapTimes = []; r.best = null; r.finished = false; r.finishTime = null;
      r.prevRel = tr.wrapS(r.body.s - tr.sStart); r.progress = r.prevRel - tr.length;
    });
    this.finishOrder = [];
    this.order = order.slice();
  }

  startCountdown() {
    this.state = 'countdown'; this.t = 0; this.lights = 0; this.raceTime = 0;
    this.hold = 0.5 + Math.random() * 0.8; this.go = false;
  }

  startDemo() { this.state = 'demo'; this.raceTime = 0; }

  update(dt, events) {
    const tr = this.track, L = tr.length;
    if (this.state === 'countdown') {
      this.t += dt;
      const n = Math.min(3, Math.floor((this.t - 0.4) / 0.9) + 1);
      if (n > this.lights && this.t > 0.4) { this.lights = n; events.push({ type: 'light', n }); }
      if (this.t > 0.4 + 0.9 * 3 + this.hold && !this.go) { this.go = true; this.state = 'race'; this.lights = 0; events.push({ type: 'go' }); }
      return;
    }
    if (this.state !== 'race' && this.state !== 'demo' && this.state !== 'cooldown') return;
    this.raceTime += dt;
    for (const r of this.racers) {
      const rel = tr.wrapS(r.body.s - tr.sStart);
      if (r.prevRel > L * 0.75 && rel < L * 0.25) {
        r.crossings++;
        if (r.crossings === 1) r.lapStart = this.raceTime;
        else if (!r.finished) {
          const lt = this.raceTime - r.lapStart;
          r.lapTimes.push(lt); r.lapStart = this.raceTime;
          if (r.best === null || lt < r.best) { r.best = lt; if (this.state === 'race' || this.state === 'cooldown') events.push({ type: 'best', racer: r, t: lt }); }
          if (this.state !== 'demo' && r.lapTimes.length >= this.laps) {
            r.finished = true; r.finishTime = this.raceTime; this.finishOrder.push(r);
            events.push({ type: 'finish', racer: r, pos: this.finishOrder.length });
          } else if (this.state !== 'demo') events.push({ type: 'lap', racer: r, lap: r.lapTimes.length + 1, t: lt });
        }
      } else if (r.prevRel < L * 0.25 && rel > L * 0.75) r.crossings--;
      r.prevRel = rel;
      r.progress = (r.crossings - 1) * L + rel;
    }
    const live = this.racers.filter((r) => !r.finished).sort((a, b) => b.progress - a.progress);
    this.order = this.finishOrder.concat(live);
  }

  position(r) { return this.order.indexOf(r) + 1; }
}

export function fmtTime(t) {
  if (t === null || t === undefined || !isFinite(t)) return '–';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m ? `${m}:${s.toFixed(2).padStart(5, '0')}` : s.toFixed(2);
}
