// Renders the 1280x720 gallery card for the Experiments landing page.
// Usage: npm run preview-image [-- path/to/out.png]   (also writes a .webp next to it)
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { openScene, root } from './headless.mjs';

const FPS = 30;
const output = path.resolve(process.argv[2] ?? path.join(root, '../gallery/previews/salar-de-uyuni.png'));

const { page, close } = await openScene({ width: 1280, height: 720, query: '&frame=full' });
try {
  // Let the ripple trail build up, then stop on the side push-in of the showcase move.
  await page.evaluate((fps) => window.__record.warmup(3, fps), FPS);
  await page.evaluate(() => window.__record.startShowcase());
  await page.evaluate((fps) => window.__record.warmup(3.4, fps), FPS);
  const dataUrl = await page.evaluate((fps) => window.__record.snapshot(fps), FPS);
  await writeFile(output, Buffer.from(dataUrl.split(',')[1], 'base64'));
  const webp = output.replace(/\.png$/, '.webp');
  execFileSync('cwebp', ['-quiet', '-q', '82', output, '-o', webp]);
  console.log(`wrote ${output}\nwrote ${webp}`);
} finally {
  await close();
}
