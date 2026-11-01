/**
 * Wires the control buttons. Which buttons are enabled is derived from the
 * animation manager, so a button can never start an action that conflicts
 * with the ship's current state:
 *   BREAK DOWN  — while assembled or (re)assembling; interrupts cleanly
 *   REBUILD     — while disassembled or breaking down; interrupts cleanly
 *   RESET VIEW  — always
 *   SOUND       — mutes / unmutes the procedural brick clicks
 */
export function createControls(
  { onBreakDown, onReassemble, onResetView, onToggleSound, soundEnabled = false, soundSupported = true },
  root = document,
) {
  const breakButton = root.querySelector('#btn-break');
  const reassembleButton = root.querySelector('#btn-reassemble');
  const resetButton = root.querySelector('#btn-reset');
  const soundButton = root.querySelector('#btn-sound');
  const soundState = root.querySelector('#sound-state');

  function showSound(enabled) {
    soundButton.setAttribute('aria-pressed', String(enabled));
    soundState.textContent = enabled ? 'On' : 'Off';
  }
  showSound(soundEnabled);
  soundButton.hidden = !soundSupported;
  const handleSound = () => showSound(onToggleSound());

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
