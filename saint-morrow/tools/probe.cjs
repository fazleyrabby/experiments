// Cold-loads a deployment and reports what the visitor feels: load time, failed files, main-thread freezes, stutter.
// node saint-morrow/tools/probe.cjs <playwright-module-dir> <base-url> [downloadMbps]
const [moduleDir, base, mbps] = process.argv.slice(2);
if (!moduleDir || !base) throw new Error('Usage: probe.cjs <playwright-module-dir> <base-url> [downloadMbps]');
const { chromium } = require(moduleDir);

function installProbe() {
  const probe = { longTasks: [], gaps: [], stages: [], blockingShaders: [] };
  window.__probe = probe;
  if (window.GPUDevice) {
    const create = GPUDevice.prototype.createRenderPipeline;
    GPUDevice.prototype.createRenderPipeline = function createRenderPipeline(...args) {
      probe.blockingShaders.push(Math.round(performance.now()));
      return create.apply(this, args);
    };
  }
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) probe.longTasks.push({ at: Math.round(entry.startTime), ms: Math.round(entry.duration) });
  }).observe({ type: 'longtask', buffered: true });
  let last = performance.now();
  const tick = (now) => {
    probe.gaps.push({ at: Math.round(now), ms: now - last });
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))].toFixed(1));
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (mbps) {
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 40, downloadThroughput: (Number(mbps) * 1e6) / 8, uploadThroughput: 1e6,
    });
  }
  let bytes = 0;
  let requests = 0;
  const failures = [];
  cdp.on('Network.loadingFinished', (event) => { bytes += event.encodedDataLength; requests++; });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('/saint-morrow/')) failures.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    if (request.url().includes('/saint-morrow/')) failures.push(`failed ${request.url()}`);
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 220)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/views\.|visit|CORS|Failed to load resource/i.test(message.text())) errors.push(message.text().slice(0, 220));
  });
  await page.addInitScript(installProbe);

  const started = Date.now();
  await page.goto(`${base.replace(/\/$/, '')}/saint-morrow/?bench&tier=ultra`, { waitUntil: 'commit', timeout: 120000 });
  let loaded = true;
  try {
    await page.waitForFunction(() => document.getElementById('status')?.classList.contains('done'), null, { timeout: 240000 });
  } catch {
    loaded = false;
  }
  const loadSeconds = Number(((Date.now() - started) / 1000).toFixed(1));
  const readyAt = await page.evaluate(() => performance.now());
  if (loaded) await page.waitForFunction(() => window.__morrow?.bench?.result, null, { timeout: 120000 }).catch(() => {});
  const data = await page.evaluate(() => ({
    probe: window.__probe,
    bench: window.__morrow?.bench?.result ?? null,
    status: document.getElementById('status')?.textContent,
    tier: window.__morrow?.tier?.name,
  }));

  const during = data.probe.longTasks.filter((task) => task.at < readyAt);
  const after = data.probe.longTasks.filter((task) => task.at >= readyAt + 500);
  const gaps = data.probe.gaps.filter((gap) => gap.at >= readyAt + 500).map((gap) => gap.ms);
  console.log(JSON.stringify({
    loaded,
    status: data.status,
    tier: data.tier,
    loadSeconds,
    requests,
    downloadMB: Number((bytes / 1048576).toFixed(1)),
    failures: failures.slice(0, 5),
    errors: [...new Set(errors)].slice(0, 3),
    blockingShadersAfterLoad: data.probe.blockingShaders.filter((at) => at >= readyAt + 500).length,
    loadFreeze: { longestMs: Math.max(0, ...during.map((task) => task.ms)), totalMs: during.reduce((sum, task) => sum + task.ms, 0) },
    whileMoving: {
      frames: gaps.length,
      p50: percentile(gaps, 0.5),
      p95: percentile(gaps, 0.95),
      p99: percentile(gaps, 0.99),
      maxMs: Number(Math.max(0, ...gaps).toFixed(1)),
      over50ms: gaps.filter((ms) => ms > 50).length,
      over200ms: gaps.filter((ms) => ms > 200).length,
      longTasks: after.length,
      worstTasks: after.map((task) => task.ms).sort((a, b) => b - a).slice(0, 6),
    },
  }));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
