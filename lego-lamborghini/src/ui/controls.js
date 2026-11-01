import { FINISHES } from '../config.js';

/**
 * Wires the control buttons. Which buttons are enabled is derived from the
 * animation manager, so a button can never start an action that conflicts
 * with the car's current state:
 *   BREAK DOWN  — while assembled or (re)assembling; interrupts cleanly
 *   REASSEMBLE  — while disassembled or breaking down; interrupts cleanly
 *   RESET VIEW  — always
 *   SOUND       — mutes / unmutes the procedural brick clicks
 *   FINISH      — repaints the body (candy red, mirror silver, gold ...)
 */
export function createControls(
  {
    onBreakDown,
    onReassemble,
    onResetView,
    onToggleSound,
    onFinish,
    finish,
    soundEnabled = false,
    soundSupported = true,
  },
  root = document,
) {
  const breakButton = root.querySelector('#btn-break');
  const reassembleButton = root.querySelector('#btn-reassemble');
  const resetButton = root.querySelector('#btn-reset');
  const soundButton = root.querySelector('#btn-sound');
  const soundState = root.querySelector('#sound-state');
  const finishRoot = root.querySelector('#finishes');

  function showSound(enabled) {
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundState.textContent = enabled ? 'On' : 'Off';
  }
  showSound(soundEnabled);
  soundButton.hidden = !soundSupported;
  const handleSound = () => showSound(onToggleSound());

  // Finish swatches.
  const swatches = new Map();
  for (const [key, { label, swatch }] of Object.entries(FINISHES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.title = label;
    button.setAttribute('aria-label', `Finish: ${label}`);
    button.style.setProperty('--swatch', swatch);
    button.addEventListener('click', () => select(key));
    finishRoot.append(button);
    swatches.set(key, button);
  }
  function select(key) {
    onFinish(key);
    for (const [name, button] of swatches) button.setAttribute('aria-pressed', String(name === key));
    finishRoot.dataset.finish = key;
  }
  for (const [name, button] of swatches) button.setAttribute('aria-pressed', String(name === finish));

  const listeners = [
    [breakButton, onBreakDown],
    [reassembleButton, onReassemble],
    [resetButton, onResetView],
    [soundButton, handleSound],
  ];
  for (const [button, handler] of listeners) button.addEventListener('click', handler);

  return {
    /** Refresh the enabled state after every state change. */
    sync(manager) {
      breakButton.disabled = !manager.canBreakDown;
      reassembleButton.disabled = !manager.canReassemble;
    },
    dispose() {
      for (const [button, handler] of listeners) button.removeEventListener('click', handler);
    },
  };
}
