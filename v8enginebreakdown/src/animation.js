import { MathUtils } from 'three';

export const smoothstep = t => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = value => Math.max(0, Math.min(1, value));

/** One interruptible timeline. No timers, queued tweens, or overlapping animations. */
export class EngineAnimation {
  constructor(parts, { reducedMotion = false } = {}) {
    this.parts = parts;
    this.reducedMotion = reducedMotion;
    this.duration = reducedMotion ? .55 : 4.5;
    this.progress = 0;
    this.target = 0;
    this.state = 'ASSEMBLED';
    this.auto = !reducedMotion;
    this.elapsed = 0;
    this.transition = null;
    this.rotation = 0;
    this.crankAngle = 0;
    this.rotationPaused = false;
    this.operation = true;
  }

  moveTo(target, manual = true) {
    target = target ? 1 : 0;
    if (manual) this.auto = false;
    this.elapsed = 0;
    if (this.target === target && this.transition) return;
    this.target = target;
    if (Math.abs(this.progress - target) < .00001) { this.transition = null; return; }
    // Snapshot all actual offsets, so a mid-flight reversal is continuous.
    this.transition = {
      elapsed: 0,
      duration: this.duration * Math.max(.3, Math.abs(target - this.progress)),
      fromProgress: this.progress,
      starts: this.parts.map(part => part.object.position.clone()),
    };
    // UI uses the specified three states; direction is exposed separately.
    this.state = 'DISASSEMBLING';
  }

  toggleAuto() { this.auto = !this.auto; this.elapsed = 0; return this.auto; }
  get direction() { return this.transition ? (this.target ? 'EXPANDING' : 'REASSEMBLING') : ''; }

  update(dt) {
    this.elapsed += dt;
    if (this.transition) {
      const transition = this.transition;
      transition.elapsed += dt;
      const t = clamp(transition.elapsed / transition.duration);
      this.progress = MathUtils.lerp(transition.fromProgress, this.target, smoothstep(t));
      this.parts.forEach((part, i) => {
        // Reverse the stagger order during assembly: the core seats first.
        const delay = (this.target ? part.order : 1 - part.order) * .24;
        const local = smoothstep(clamp((t - delay) / (1 - delay)));
        const end = part.origin.clone().addScaledVector(part.offset, this.target);
        part.object.position.lerpVectors(transition.starts[i], end, local);
      });
      if (t >= 1) {
        this.progress = this.target;
        this.parts.forEach(part => part.object.position.copy(part.origin).addScaledVector(part.offset, this.target));
        this.transition = null;
        this.state = this.target ? 'EXPLODED' : 'ASSEMBLED';
        this.elapsed = 0;
      }
    } else if (this.auto) {
      if (this.progress === 0 && this.elapsed >= 5) this.moveTo(1, false);
      else if (this.progress === 1 && this.elapsed >= 7) this.moveTo(0, false);
    }
    if (!this.rotationPaused && !this.reducedMotion) {
      // Almost stationary when exploded, so component relationships stay legible.
      this.rotation += dt * .07 * (1 - this.progress);
    }
    if (this.operation && !this.reducedMotion) {
      // Slow demonstration speed rather than simulated operating RPM.
      this.crankAngle = (this.crankAngle + dt * 1.8) % (Math.PI * 2);
    }
  }
}
