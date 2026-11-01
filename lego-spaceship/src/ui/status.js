import { ShipState } from '../animation/AnimationManager.js';

const LABELS = {
  [ShipState.ASSEMBLING]: 'Assembling',
  [ShipState.ASSEMBLED]: 'System ready',
  [ShipState.BREAKING_DOWN]: 'Disassembling',
  [ShipState.DISASSEMBLED]: 'Ship disassembled',
  [ShipState.REASSEMBLING]: 'Reassembling',
};

const pad = (value, length) => String(value).padStart(length, '0');

/**
 * Status read-out: state label, placed-brick counter and progress bar.
 * Values come straight from the animation manager each frame; the DOM is only
 * touched when a displayed value actually changes.
 */
export function createStatus(root = document) {
  const app = root.querySelector('#app');
  const label = root.querySelector('#status-label');
  const count = root.querySelector('#status-count');
  const percent = root.querySelector('#status-percent');
  const progress = root.querySelector('#progress');
  const fill = root.querySelector('#progress-fill');

  let shownPercent = -1;
  let shownCount = -1;
  let shownScale = -1;

  return {
    setState(state) {
      app.dataset.state = state;
      label.textContent = LABELS[state] ?? state;
    },

    /**
     * @param {number} integrity 0..1 fraction of the ship that is assembled
     * @param {number} placed    bricks locked in their final position
     * @param {number} total     total brick count
     */
    setProgress(integrity, placed, total) {
      const scale = Math.round(integrity * 1000) / 1000;
      if (scale !== shownScale) {
        shownScale = scale;
        fill.style.transform = `scaleX(${scale})`;
      }

      const nextPercent = Math.round(integrity * 100);
      if (nextPercent !== shownPercent) {
        shownPercent = nextPercent;
        percent.textContent = `${pad(nextPercent, 3)}%`;
        progress.setAttribute('aria-valuenow', String(nextPercent));
      }

      if (placed !== shownCount) {
        shownCount = placed;
        const digits = String(total).length;
        count.textContent = `${pad(placed, digits)} / ${total}`;
      }
    },
  };
}
