import * as THREE from 'three/webgpu';

// Files the street loads, counting images inside models. The manager only learns about those as each model
// opens, so without this estimate the bar would jump backwards.
const EXPECTED_STREET_ITEMS = 110;
const SLOW_AFTER_MS = 12000;

export function createLoader() {
  const root = document.getElementById('loader');
  const track = document.getElementById('loader-track');
  const bar = document.getElementById('loader-bar');
  const percent = document.getElementById('loader-percent');
  const status = document.getElementById('status');
  const hint = document.getElementById('loader-hint');
  const retry = document.getElementById('loader-retry');
  let shown = 0;
  let from = 0;
  let to = 0;
  let lastChange = performance.now();

  const set = (value) => {
    const next = Math.max(shown, Math.min(value, 1));
    if (next > shown) {
      lastChange = performance.now();
      hint.hidden = true;
    }
    shown = next;
    bar.style.transform = `scaleX(${shown})`;
    const rounded = Math.round(shown * 100);
    percent.textContent = `${rounded}%`;
    track.setAttribute('aria-valuenow', String(rounded));
  };

  const watchdog = window.setInterval(() => {
    if (performance.now() - lastChange > SLOW_AFTER_MS) hint.hidden = false;
  }, 1000);

  retry.addEventListener('click', () => location.reload());
  root.classList.add('determinate');

  const loader = {
    stage(label, start, end) {
      status.textContent = label;
      from = start;
      to = end;
      set(start);
    },
    progress(fraction) {
      set(from + (to - from) * Math.min(fraction, 1));
    },
    trackDownloads(label, start, end) {
      loader.stage(label, start, end);
      THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => {
        loader.progress(loaded / Math.max(total, EXPECTED_STREET_ITEMS));
      };
    },
    stopTracking() {
      THREE.DefaultLoadingManager.onProgress = undefined;
    },
    /** Lets the browser draw the bar before the next stretch of heavy work. Still resolves in a hidden tab. */
    paint() {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.setTimeout(resolve, 0);
        };
        requestAnimationFrame(finish);
        window.setTimeout(finish, 60);
      });
    },
    finish() {
      window.clearInterval(watchdog);
      loader.stopTracking();
      set(1);
      hint.hidden = true;
      status.classList.add('done');
      root.classList.add('done');
      window.setTimeout(() => { root.hidden = true; }, 800);
    },
    fail(message) {
      window.clearInterval(watchdog);
      loader.stopTracking();
      root.classList.remove('determinate');
      root.classList.add('failed');
      status.textContent = message;
      status.classList.add('error');
      hint.hidden = true;
      retry.hidden = false;
    },
  };
  return loader;
}
