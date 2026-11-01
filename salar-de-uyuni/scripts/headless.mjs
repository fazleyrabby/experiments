// Shared setup for the capture scripts: a private Vite server plus GPU-backed headless Chrome
// with the scene loaded in record mode (window.__record available).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';

const PORT = 5180;
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function openScene({ width, height, query = '' }) {
  const server = await createServer({ root, logLevel: 'warn', server: { port: PORT, strictPort: true } });
  await server.listen();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  });
  const close = async () => {
    await browser.close();
    await server.close();
  };
  try {
    const page = await browser.newPage();
    page.on('console', (m) => m.type() === 'error' && console.error('[page]', m.text()));
    page.on('pageerror', (e) => console.error('[page]', e.message));
    await page.goto(`http://localhost:${PORT}/?record${query}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__record !== undefined);
    const gpu = await page.evaluate(() => {
      const gl = document.querySelector('canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
    });
    console.log(`GPU: ${gpu}`);
    return { page, close };
  } catch (err) {
    await close();
    throw err;
  }
}
