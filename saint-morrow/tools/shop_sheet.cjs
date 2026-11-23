// Photographs every open shop's interior from the pavement and tiles them into one contact sheet.
// Serve on :4441, then: node saint-morrow/tools/shop_sheet.cjs <playwright-module-dir> <out.jpg>
const path = require('path');
const sharp = require(path.join(__dirname, 'node_modules', 'sharp'));

const [moduleDir, out] = process.argv.slice(2);
if (!moduleDir || !out) throw new Error('Usage: shop_sheet.cjs <playwright-module-dir> <out.jpg>');
const { chromium } = require(moduleDir);
const KINDS = ['home', 'bottles', 'clocks', 'garments', 'bakery', 'hardware', 'portraits', 'books'];
const TILE = { width: 640, height: 416 };
const COLUMNS = 3;

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 260)); });
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 260)));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });

  const started = Date.now();
  await page.goto('http://127.0.0.1:4441/?shop=0&hud', { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('status')?.classList.contains('done'), null, { timeout: 240000 });
  const loadSeconds = ((Date.now() - started) / 1000).toFixed(1);
  const shots = await page.evaluate(() => window.__morrow.world.shopShots);

  const tiles = [];
  for (let index = 0; index < shots.length; index++) {
    await page.evaluate(({ position, target }) => {
      const { camera } = window.__morrow;
      camera.position.set(...position);
      camera.lookAt(...target);
    }, shots[index]);
    await page.waitForTimeout(1500);
    const image = await page.screenshot({ type: 'png' });
    const label = Buffer.from(`<svg width="${TILE.width}" height="26"><rect width="${TILE.width}" height="26" fill="#111"/><text x="6" y="18" font-size="15" fill="#fff" font-family="Arial">${index}: ${KINDS[shots[index].kind]}</text></svg>`);
    const input = await sharp(image).resize(TILE.width, TILE.height).composite([{ input: label, top: 0, left: 0 }]).png().toBuffer();
    tiles.push({ input, left: (index % COLUMNS) * TILE.width, top: Math.floor(index / COLUMNS) * TILE.height });
  }
  const hud = await page.evaluate(() => document.getElementById('hud').textContent.replace(/\s+/g, ' '));
  await sharp({ create: { width: COLUMNS * TILE.width, height: Math.ceil(shots.length / COLUMNS) * TILE.height, channels: 3, background: '#111' } })
    .composite(tiles).jpeg({ quality: 84 }).toFile(out);
  console.log(JSON.stringify({ shops: shots.length, kinds: shots.map((shot) => KINDS[shot.kind]), loadSeconds, hud, errors: [...new Set(errors)].slice(0, 4) }));
  await browser.close();
})().catch((error) => { console.error(error); process.exit(1); });
