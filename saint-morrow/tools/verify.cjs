// End-to-end check in real Chrome: load time, benchmark route, walking, collisions, and the WebGL2 fallback.
// Serve on :4441, then: node saint-morrow/tools/verify.cjs <playwright-module-dir>
const [moduleDir] = process.argv.slice(2);
if (!moduleDir) throw new Error('Usage: verify.cjs <playwright-module-dir>');
const { chromium } = require(moduleDir);
const BASE = 'http://127.0.0.1:4441/';
const READY = () => document.getElementById('status')?.classList.contains('done');

async function open(browser, query) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 240)); });
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 240)));
  page.on('requestfailed', (request) => errors.push(`failed: ${request.url()}`));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
  const started = Date.now();
  await page.goto(`${BASE}${query}`, { waitUntil: 'load' });
  await page.waitForFunction(READY, null, { timeout: 180000 });
  return { page, errors, loadSeconds: Number(((Date.now() - started) / 1000).toFixed(1)) };
}

async function walk(page) {
  return page.evaluate(async () => {
    const { player, camera } = window.__morrow;
    const settle = (frames) => new Promise((done) => { let n = 0; const tick = () => (++n >= frames ? done() : requestAnimationFrame(tick)); tick(); });
    const pose = () => ({ x: +player.position.x.toFixed(2), y: +player.position.y.toFixed(2), z: +player.position.z.toFixed(2), grounded: player.grounded });
    const lockTarget = window.__morrow.renderer.domElement;
    Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => lockTarget });
    const press = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));

    await settle(40);
    const spawn = pose();
    press('KeyW', 'keydown');
    press('ShiftLeft', 'keydown');
    await new Promise((done) => setTimeout(done, 2500));
    const forward = pose();
    press('KeyW', 'keyup');
    press('KeyD', 'keydown');
    await new Promise((done) => setTimeout(done, 3200));
    const intoWall = pose();
    press('KeyD', 'keyup');
    press('ShiftLeft', 'keyup');
    await settle(30);
    press('Space', 'keydown');
    await settle(8);
    const jumpPeak = pose();
    press('Space', 'keyup');
    await new Promise((done) => setTimeout(done, 1200));
    const landed = pose();
    delete document.pointerLockElement;
    return { spawn, forward, intoWall, jumpPeak, landed, eyeY: +camera.position.y.toFixed(2) };
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });

  const bench = await open(browser, '?bench&tier=ultra');
  await bench.page.waitForFunction(() => window.__morrow?.bench?.result, null, { timeout: 120000 });
  console.log('bench', JSON.stringify({ loadSeconds: bench.loadSeconds, ...(await bench.page.evaluate(() => window.__morrow.bench.result)), errors: [...new Set(bench.errors)].slice(0, 3) }));
  await bench.page.close();

  const play = await open(browser, '');
  await play.page.waitForTimeout(1500);
  const enterVisible = await play.page.evaluate(() => !document.getElementById('enter').hidden);
  console.log('walk', JSON.stringify({ enterVisible, ...(await walk(play.page)), errors: [...new Set(play.errors)].slice(0, 3) }));
  await play.page.close();

  const fallback = await open(browser, '?hud&renderer=webgl');
  await fallback.page.waitForTimeout(4000);
  console.log('webgl2', JSON.stringify({
    loadSeconds: fallback.loadSeconds,
    hud: await fallback.page.evaluate(() => document.getElementById('hud').textContent.replace(/\s+/g, ' ')),
    errors: [...new Set(fallback.errors)].slice(0, 3),
  }));
  await fallback.page.close();
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
