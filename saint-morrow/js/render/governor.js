// Each level trades a little fidelity for speed. Resolution goes first because it is the least visible.
const LEVELS = [
  { scale: 1, rain: 1, rooms: 4, fineDistance: 62 },
  { scale: 0.86, rain: 1, rooms: 3, fineDistance: 52 },
  { scale: 0.72, rain: 0.7, rooms: 2, fineDistance: 42 },
  { scale: 0.6, rain: 0.5, rooms: 1, fineDistance: 32 },
];
const SLOW_FRAME_MS = 23;
const SAMPLE_FRAMES = 90;
const SETTLE_FRAMES = 150;

/** Steps quality down when the machine cannot hold a smooth frame rate. It never steps back up, to avoid flicker. */
export function createGovernor(apply) {
  const samples = [];
  let level = 0;
  let settle = SETTLE_FRAMES;

  return {
    get level() { return level; },
    update(dtMs) {
      if (document.hidden || level === LEVELS.length - 1) return;
      if (settle > 0) {
        settle--;
        return;
      }
      samples.push(dtMs);
      if (samples.length < SAMPLE_FRAMES) return;
      const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
      samples.length = 0;
      if (median <= SLOW_FRAME_MS) return;
      level++;
      settle = SETTLE_FRAMES;
      apply(LEVELS[level]);
    },
  };
}
