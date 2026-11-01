// Shared across the published experiments. Visits are counted once per browser
// session, with previews and automated visitors reading the total only.
//
// The VPS counter is the primary store. The Cloudflare counter is the fallback:
// a visit goes there only when the VPS cannot be reached, and the VPS sync job
// folds those visits back in, so both stores converge on the same total. The
// page shows the higher of the two totals it can read.
(() => {
  'use strict';
  const project = document.currentScript?.dataset.project;
  const el = document.getElementById('visits');
  if (!project || !el) return;
  const VPS = 'https://views.fazleyrabbi.xyz/api';
  const BACKUP = 'https://experiments-visit-backup.fazley111.workers.dev/api';
  const name = encodeURIComponent(project);
  const cacheKey = `${project}:backupVisits`, sessionKey = `${project}:visitTracked`;
  const idKey = `${project}:backupVisitId`;
  const read = (store, key) => { try { return window[store].getItem(key); } catch { return null; } };
  const write = (store, key, value) => { try { window[store].setItem(key, value); } catch { /* Storage disabled. */ } };
  const valid = total => Number.isSafeInteger(total) && total >= 0;
  let hasTotal = false;
  const show = total => {
    hasTotal = true;
    el.textContent = `Visits ${total.toLocaleString('en-US')}`;
    el.title = 'Total visits · one visit per browser session';
    el.dataset.state = 'ready'; el.hidden = false;
  };
  const cached = read('localStorage', cacheKey);
  if (cached !== null && valid(Number(cached))) show(Number(cached));
  else { el.textContent = 'Visits loading'; el.dataset.state = 'loading'; el.hidden = false; }

  const host = location.hostname, agent = navigator.userAgent.toLowerCase();
  const preview = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) || host.endsWith('.local') || location.port !== '' || host.endsWith('.vercel.app');
  const automated = navigator.webdriver || ['bot', 'spider', 'crawler', 'preview', 'lighthouse', 'headless', 'playwright', 'puppeteer', 'selenium', 'curl', 'wget', 'uptime'].some(word => agent.includes(word));
  const track = !preview && !automated && read('sessionStorage', sessionKey) !== 'true';
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let visitId = read('sessionStorage', idKey);
  if (track && !uuid.test(visitId || '')) {
    visitId = crypto.randomUUID();
    write('sessionStorage', idKey, visitId);
  }

  // Resolves with a store's total, or rejects if it is down, slow or answers nonsense.
  async function total(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Visits service unavailable');
      const views = (await response.json())?.views;
      if (!valid(views)) throw new Error('Invalid visit total');
      return views;
    } finally { clearTimeout(timeout); }
  }
  const vps = record => total(`${VPS}/${record ? 'hit' : 'get'}?project=${name}&key=visitors`);
  const backup = record => total(`${BACKUP}/${record ? 'hit' : 'get'}?project=${name}`, record
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: visitId }) }
    : {});
  const quiet = promise => promise.catch(() => null);

  let inFlight = false;
  async function update(attempt = 0, recordVisit = track) {
    if (inFlight) return;
    inFlight = true;
    try {
      let totals;
      if (recordVisit) {
        // One visit, one store: the VPS first, Cloudflare only if that fails.
        // (A VPS request that times out after being counted can, rarely, be counted twice.)
        let counted = await quiet(vps(true)), other;
        if (counted !== null) other = await quiet(backup(false));
        else { counted = await backup(true); other = await quiet(vps(false)); }
        write('sessionStorage', sessionKey, 'true');
        totals = [counted, other];
      } else {
        totals = await Promise.all([quiet(vps(false)), quiet(backup(false))]);
      }
      const known = totals.filter(value => value !== null);
      if (!known.length) throw new Error('Visits service unavailable');
      const highest = Math.max(...known);
      write('localStorage', cacheKey, String(highest)); show(highest);
    } catch {
      el.dataset.state = hasTotal ? 'cached' : 'unavailable';
      if (!hasTotal) el.textContent = 'Visits 0';
      el.title = hasTotal ? 'Last known visit total · visits service unavailable' : 'Visits service unavailable · try again later';
      el.hidden = false;
      // A retry reuses the same visit ID, so Cloudflare cannot count it twice.
      if (attempt === 0) setTimeout(() => update(1, recordVisit), 1500);
    } finally { inFlight = false; }
  }
  update();
  // Keep an open experiment current after a sync or another visitor arrives.
  // Refreshes only read totals; they never add a visit.
  setInterval(() => {
    if (document.visibilityState === 'visible') update(0, false);
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') update(0, false);
  });
})();
