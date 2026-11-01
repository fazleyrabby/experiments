// Visitor counter, backed by the self-hosted view-counter service.
// One request per page load: /api/hit registers the visit (the service
// de-duplicates repeat visitors itself) and returns the running total.
// The page works identically without it — on any failure the read-out simply
// stays hidden.

const ENDPOINT = import.meta.env.VITE_VIEW_COUNTER_URL || 'https://views.fazleyrabbi.xyz';
const PROJECT = 'lego-spaceship';
const KEY = 'visitors';
const TIMEOUT_MS = 5000;
const COUNT_UP_MS = 900;

function countUp(element, target) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || target <= 0) {
    element.textContent = target.toLocaleString('en-US');
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / COUNT_UP_MS, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = Math.round(target * eased).toLocaleString('en-US');
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function createViewerCount(root = document) {
  const container = root.querySelector('#views');
  const value = root.querySelector('#views-count');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const params = new URLSearchParams({ project: PROJECT, key: KEY });
  // Local development should not inflate the public number.
  if (import.meta.env.DEV) params.set('ignore', 'true');

  fetch(`${ENDPOINT}/api/hit?${params}`, { signal: controller.signal })
    .then((response) =>
      response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)),
    )
    .then((data) => {
      if (typeof data.views !== 'number') return;
      container.hidden = false;
      countUp(value, data.views);
    })
    .catch(() => {
      // Counter offline or blocked: leave the read-out hidden.
    })
    .finally(() => clearTimeout(timeout));

  return {
    dispose() {
      clearTimeout(timeout);
      controller.abort();
    },
  };
}
