import { COMPONENTS } from './engine/createEngine.js';

const DETAILS = {
  intake: 'Eight runners feed air into the two banks.',
  covers: 'Ribbed covers protect the valve gear.',
  heads: 'Valves sit above each combustion chamber.',
  block: 'Two banks of four open cylinder bores.',
  pistons: 'Eight pistons drive fixed-length rods.',
  crank: 'Four paired throws turn motion into rotation.',
  exhaust: 'Four runners merge into each collector.',
  pan: 'The sump stores oil below the crankcase.',
};
const LAYOUT = [
  ['covers', 0, .19], ['heads', 0, .36], ['pistons', 0, .53], ['exhaust', 0, .70],
  ['intake', 1, .19], ['block', 1, .36], ['crank', 1, .53], ['pan', 1, .70],
];

export function createUI(animation, engine) {
  const byId = id => document.getElementById(id);
  const breakDown = byId('break-down');
  const reassemble = byId('reassemble');
  const selection = byId('selection-label');
  const labels = byId('component-labels');
  const controller = new AbortController();
  const listen = (element, type, handler) => element.addEventListener(type, handler, { signal: controller.signal });
  listen(breakDown, 'click', () => animation.moveTo(1));
  listen(reassemble, 'click', () => animation.moveTo(0));
  const buttons = LAYOUT.map(([category, side, y]) => {
    const button = document.createElement('button');
    button.className = 'component-detail'; button.dataset.component = category;
    button.style.left = side ? '78%' : '7%'; button.style.top = `${y * 100}%`;
    button.setAttribute('aria-pressed', 'false');
    const title = document.createElement('strong'); title.textContent = COMPONENTS[category].title;
    const detail = document.createElement('p'); detail.textContent = DETAILS[category];
    button.append(title, detail); labels.appendChild(button);
    listen(button, 'click', () => select(engine.selection === category ? null : category));
    return button;
  });
  function select(category) {
    engine.select(category);
    buttons.forEach(button => {
      const active = button.dataset.component === category;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    selection.hidden = !category;
    if (category) {
      byId('selection-title').textContent = COMPONENTS[category].title;
      byId('selection-description').textContent = COMPONENTS[category].description;
      animation.rotationPaused = true;
    } else animation.rotationPaused = false;
  }
  listen(byId('clear-selection'), 'click', () => select(null));
  let expanded = false;
  function update() {
    const show = animation.progress > .88;
    if (show !== expanded) {
      labels.classList.toggle('visible', show);
      labels.inert = !show;
      expanded = show;
    }
    breakDown.disabled = animation.target === 1 && (animation.transition !== null || animation.progress === 1);
    reassemble.disabled = animation.target === 0 && (animation.transition !== null || animation.progress === 0);
  }
  labels.inert = true;
  return { update, select, dispose() { controller.abort(); labels.replaceChildren(); } };
}
