import { Quaternion, Vector3 } from 'three';
import { TIMING } from '../config.js';
import { clamp01, easeInCubic, easeInOutCubic, easeOutCubic, smoothstep } from './easing.js';

export const ShipState = Object.freeze({
  ASSEMBLING: 'ASSEMBLING',
  ASSEMBLED: 'ASSEMBLED',
  BREAKING_DOWN: 'BREAKING_DOWN',
  DISASSEMBLED: 'DISASSEMBLED',
  REASSEMBLING: 'REASSEMBLING',
});

/** Fraction of an assembly move after which the brick hovers above its slot and clicks down. */
const SETTLE_START = 0.84;
/** Fraction of an assembly move by which the brick is already squared up. */
const ROTATION_END = 0.8;
const AT_TARGET_EPSILON = 1e-6;

/**
 * Central animation system. One track per brick, advanced from the single
 * render loop with delta time — there are no per-brick timers or loops.
 *
 * Initial assembly, breakdown and reassembly are the same mechanism: a "run"
 * that moves every brick from wherever it currently is to a stored target
 * pose. Starting a run while another is in flight simply re-bases each track
 * on the brick's current transform, so interruptions never snap, and finished
 * tracks copy the stored target exactly, so repeated cycles never drift.
 */
export class AnimationManager {
  /**
   * @param {Array} bricks brick records from createSpaceship()
   * @param {object} [options]
   * @param {(state: string) => void} [options.onStateChange]
   * @param {(brick: object) => void} [options.onBrickPlaced]   a brick clicked into its final position
   * @param {(brick: object) => void} [options.onBrickReleased] a brick started leaving the model
   */
  constructor(bricks, { onStateChange, onBrickPlaced, onBrickReleased } = {}) {
    this.onStateChange = onStateChange;
    this.onBrickPlaced = onBrickPlaced;
    this.onBrickReleased = onBrickReleased;
    this.tracks = bricks.map((brick) => ({
      brick,
      mesh: brick.mesh,
      from: new Vector3(),
      fromQuat: new Quaternion(),
      to: brick.finalPosition,
      toQuat: brick.finalQuaternion,
      delay: 0,
      duration: 1,
      lift: 0,
      done: true,
      floating: false,
      floatAmount: 0,
      moving: false,
      // 0 = fully away from the model, 1 = locked in its final position.
      home: 1,
      homeFrom: 1,
    }));
    this.state = ShipState.ASSEMBLED;
    this.run = null;
    /** Seconds since the current run started. */
    this.clock = 0;
    this.time = 0;
    /** Fraction of the ship that is assembled, derived from the live tracks. */
    this.integrity = 1;
    /** Number of bricks locked in their final position. */
    this.placedCount = this.tracks.length;
  }

  get total() {
    return this.tracks.length;
  }

  get canBreakDown() {
    return (
      this.state === ShipState.ASSEMBLED ||
      this.state === ShipState.ASSEMBLING ||
      this.state === ShipState.REASSEMBLING
    );
  }

  get canReassemble() {
    return this.state === ShipState.DISASSEMBLED || this.state === ShipState.BREAKING_DOWN;
  }

  /** Scatter every brick to its start pose and begin the opening assembly. */
  startInitialAssembly() {
    for (const track of this.tracks) {
      track.mesh.position.copy(track.brick.scatterPosition);
      track.mesh.quaternion.copy(track.brick.scatterQuaternion);
      track.home = 0;
      track.floating = false;
    }
    this.#startRun('assemble', ShipState.ASSEMBLING, TIMING.assemble);
  }

  breakDown() {
    if (!this.canBreakDown) return false;
    this.#startRun('explode', ShipState.BREAKING_DOWN, TIMING.explode);
    return true;
  }

  reassemble() {
    if (!this.canReassemble) return false;
    this.#startRun('assemble', ShipState.REASSEMBLING, TIMING.reassemble);
    return true;
  }

  #setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange?.(state);
  }

  #startRun(kind, state, timing) {
    const assembling = kind === 'assemble';
    let earliest = Infinity;

    for (const track of this.tracks) {
      const { brick, mesh } = track;
      // Re-base on the live transform: this is what makes interruption seamless.
      track.from.copy(mesh.position);
      track.fromQuat.copy(mesh.quaternion);
      track.to = assembling ? brick.finalPosition : brick.explodedPosition;
      track.toQuat = assembling ? brick.finalQuaternion : brick.explodedQuaternion;
      track.homeFrom = track.home;
      track.floating = false;
      track.floatAmount = 0;

      const alreadyThere =
        track.from.distanceToSquared(track.to) < AT_TARGET_EPSILON &&
        1 - Math.abs(track.fromQuat.dot(track.toQuat)) < AT_TARGET_EPSILON;
      if (alreadyThere) {
        this.#finish(track, assembling);
        continue;
      }

      // Assembly follows the build order; breakdown peels it off in reverse.
      const order = assembling ? brick.order : 1 - brick.order;
      track.delay = order * timing.spread + brick.timingJitter * 0.16;
      track.duration = timing.duration + brick.durationJitter * timing.durationJitter;
      track.lift = timing.lift * (0.75 + 0.5 * brick.durationJitter);
      track.done = false;
      track.moving = false;
      earliest = Math.min(earliest, track.delay);
    }

    // After an interruption only some bricks need to move; start them at once.
    if (earliest !== Infinity && earliest > 0) {
      for (const track of this.tracks) if (!track.done) track.delay -= earliest;
    }

    this.run = { kind };
    this.clock = 0;
    this.#setState(state);
  }

  #finish(track, assembling) {
    // Exact copy of the stored pose: no accumulated floating point error.
    track.mesh.position.copy(track.to);
    track.mesh.quaternion.copy(track.toQuat);
    track.done = true;
    track.home = assembling ? 1 : 0;
    track.floating = !assembling;
  }

  #applyAssemble(track, raw) {
    const { mesh } = track;
    const travel = easeInOutCubic(clamp01(raw / SETTLE_START));
    mesh.position.lerpVectors(track.from, track.to, travel);
    // Rise onto an approach path, hover over the slot, then click down.
    const hover =
      smoothstep(0, 0.4, raw) * (1 - easeInCubic(clamp01((raw - SETTLE_START) / (1 - SETTLE_START))));
    mesh.position.y += track.lift * hover;
    mesh.quaternion.slerpQuaternions(
      track.fromQuat,
      track.toQuat,
      easeInOutCubic(clamp01(raw / ROTATION_END)),
    );
    track.home = track.homeFrom + (1 - track.homeFrom) * raw;
  }

  #applyExplode(track, raw) {
    const { mesh } = track;
    // Pop off the studs first, then drift out to the exploded pose.
    const pop = easeOutCubic(clamp01(raw / 0.2));
    const travel = easeInOutCubic(clamp01((raw - 0.1) / 0.9));
    mesh.position.lerpVectors(track.from, track.to, travel);
    mesh.position.y += track.lift * pop * (1 - travel);
    mesh.quaternion.slerpQuaternions(track.fromQuat, track.toQuat, travel);
    track.home = track.homeFrom * (1 - raw);
  }

  /** Gentle weightless bob for pieces resting in the exploded view. */
  #applyFloat(track, dt) {
    track.floatAmount = Math.min(1, track.floatAmount + dt * 0.5);
    const amount = track.floatAmount;
    const phase = track.brick.floatPhase;
    const t = this.time;
    track.mesh.position.set(
      track.to.x + Math.sin(t * 0.47 + phase) * 0.1 * amount,
      track.to.y + Math.sin(t * 0.63 + phase * 1.7) * 0.2 * amount,
      track.to.z + Math.cos(t * 0.41 + phase * 0.6) * 0.1 * amount,
    );
  }

  /** Advance every track. Call once per frame from the render loop. */
  update(dt) {
    this.time += dt;
    const run = this.run;
    if (!run && this.state === ShipState.ASSEMBLED) return;

    const assembling = run?.kind === 'assemble';
    if (run) this.clock += dt;

    let pending = 0;
    let homeSum = 0;
    let placed = 0;

    for (const track of this.tracks) {
      if (!track.done) {
        const raw = (this.clock - track.delay) / track.duration;
        if (raw >= 1) {
          this.#finish(track, assembling);
          if (assembling) this.onBrickPlaced?.(track.brick);
        } else {
          pending++;
          if (raw > 0) {
            if (!track.moving) {
              track.moving = true;
              if (!assembling && track.homeFrom >= 1) this.onBrickReleased?.(track.brick);
            }
            if (assembling) this.#applyAssemble(track, raw);
            else this.#applyExplode(track, raw);
          }
        }
      }
      if (track.floating) this.#applyFloat(track, dt);
      homeSum += track.home;
      if (track.home >= 1) placed++;
    }

    this.integrity = homeSum / this.tracks.length;
    this.placedCount = placed;

    if (run && pending === 0) {
      this.run = null;
      this.#setState(assembling ? ShipState.ASSEMBLED : ShipState.DISASSEMBLED);
    }
  }
}
