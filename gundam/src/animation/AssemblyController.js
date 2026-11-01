import { Quaternion, Vector3 } from 'three';

const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const arc = new Vector3();

/** One reversible timeline. Each run starts from the current pose, including mid-animation. */
export class AssemblyController {
  constructor(parts, { reducedMotion = false } = {}) {
    this.parts = parts;
    this.reducedMotion = reducedMotion;
    this.state = 'assembled';
    this.separation = 0;
    this.target = 0;
    this.run = null;
    this.tracks = parts.map(part => ({ part, from: new Vector3(), fromRotation: new Quaternion(), to: new Vector3(), toRotation: new Quaternion(), delay: 0, duration: 1 }));
  }
  intro() {
    if (this.reducedMotion) return;
    for (const part of this.parts) {
      part.mesh.position.copy(part.scatter);
      part.mesh.quaternion.copy(part.scatterRotation);
    }
    this.start(0, true);
  }
  start(target, intro = false) {
    this.target = Math.max(0, Math.min(1, target));
    if (this.reducedMotion) { this.scrub(this.target); return; }
    const releasing = this.target > .5;
    this.state = intro ? 'assembling' : releasing ? 'disassembling' : 'reassembling';
    const spread = intro ? 4.5 : releasing ? 1.35 : 2.5;
    let duration = 0;
    this.tracks.forEach((track, i) => {
      const { part } = track;
      track.from.copy(part.mesh.position);
      track.fromRotation.copy(part.mesh.quaternion);
      track.to.lerpVectors(part.rest, part.exploded, this.target);
      track.toRotation.copy(part.rotation);
      track.delay = (releasing ? 1 - part.order : part.order) * spread;
      track.duration = (intro ? 1.6 : releasing ? 1.55 : 1.45) + (i % 9) * .025;
      if (track.from.distanceToSquared(track.to) < 1e-10 && 1 - Math.abs(track.fromRotation.dot(track.toRotation)) < 1e-8) {
        track.delay = 0; track.duration = 0;
      }
      duration = Math.max(duration, track.delay + track.duration);
    });
    this.run = { time: 0, duration, initialSeparation: this.separation, intro };
  }
  scrub(value) {
    this.run = null;
    this.separation = this.target = Math.max(0, Math.min(1, value));
    for (const part of this.parts) {
      part.mesh.position.lerpVectors(part.rest, part.exploded, this.separation);
      part.mesh.quaternion.copy(part.rotation);
    }
    this.state = this.separation === 0 ? 'assembled' : this.separation === 1 ? 'exploded' : 'inspecting';
  }
  update(dt) {
    if (!this.run) return false;
    const run = this.run;
    run.time += Math.max(0, dt);
    for (const track of this.tracks) {
      const { part, duration, delay } = track;
      const raw = duration === 0 ? 1 : Math.max(0, Math.min(1, (run.time - delay) / duration));
      const eased = smooth(raw);
      part.mesh.position.lerpVectors(track.from, track.to, eased);
      // A small approach arc conveys weight without wobbling panels at rest.
      if (raw > 0 && raw < 1) {
        arc.set(0, Math.sin(Math.PI * raw) * (run.intro ? .9 : .26), 0);
        part.mesh.position.add(arc);
      }
      part.mesh.quaternion.slerpQuaternions(track.fromRotation, track.toRotation, smooth(Math.min(1, raw * 1.16)));
    }
    const progress = smooth(run.duration ? run.time / run.duration : 1);
    this.separation = run.initialSeparation + (this.target - run.initialSeparation) * progress;
    if (run.time >= run.duration) this.scrub(this.target);
    return true;
  }
  get assembledCount() {
    return this.parts.reduce((sum, p) => sum + (p.mesh.position.distanceToSquared(p.rest) < .0001 ? 1 : 0), 0);
  }
}
