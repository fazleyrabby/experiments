// Captures the reference camera shots in real Chrome and reports errors and render stats.
// Serve on :4441, then: node saint-morrow/tools/shots.cjs <playwright-module-dir> <out-dir> [shot numbers...]
const fs = require('fs');
const path = require('path');

const [moduleDir, outDir, ...requested] = process.argv.slice(2);
if (!moduleDir || !outDir) throw new Error('Usage: shots.cjs <playwright-module-dir> <out-dir> [shots...]');
const { chromium } = require(moduleDir);
// A plain number is a reference shot; s<number> looks into that shop, for example s1.
const shots = requested.length ? requested : ['1', '2', '3', '4', '5', '6'];

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-unsafe-webgpu', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
  });

  let failed = false;
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 260)); });
    page.on('pageerror', (error) => errors.push(String(error).slice(0, 260)));
    page.on('crash', () => errors.push('PAGE CRASHED'));
    page.on('requestfailed', (request) => errors.push(`request failed: ${request.url()}`));

    let hud = '';
    try {
      const view = shot.startsWith('s') ? `shop=${shot.slice(1)}` : `shot=${shot}`;
      await page.goto(`http://127.0.0.1:4441/?${view}&hud`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.getElementById('status')?.classList.contains('done'), null, { timeout: 90000 });
      await page.waitForTimeout(3200);
      hud = await page.evaluate(() => document.getElementById('hud').textContent.replace(/\s+/g, ' '));
      await page.evaluate(() => { document.getElementById('hud').hidden = true; });
      await page.screenshot({ path: path.join(outDir, `shot-${shot}.png`) });
    } catch (error) {
      errors.push(String(error).slice(0, 260));
    }
    const unique = [...new Set(errors)];
    failed ||= unique.length > 0;
    console.log(JSON.stringify({ shot, hud, errorCount: errors.length, errors: unique.slice(0, 3) }));
    await page.close().catch(() => {});
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
