// Renders the showcase camera move frame by frame in headless Chrome and encodes an MP4.
// Usage: npm run record [-- [--landscape] output.mp4]
//   default: 1080x1920 vertical -> media/showcase.mp4
//   --landscape: 1920x1080 full frame -> media/showcase-landscape.mp4
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { openScene, root } from './headless.mjs';

const FPS = 30;
const DURATION = 14; // matches SHOWCASE_DURATION in CameraRig.js
const WARMUP = 3; // seconds simulated before the first captured frame
const args = process.argv.slice(2);
const landscape = args.includes('--landscape');
const [WIDTH, HEIGHT] = landscape ? [1920, 1080] : [1080, 1920];

const defaultName = landscape ? 'media/showcase-landscape.mp4' : 'media/showcase.mp4';
const output = path.resolve(args.find((a) => !a.startsWith('--')) ?? path.join(root, defaultName));
await mkdir(path.dirname(output), { recursive: true });

const { page, close } = await openScene({ width: WIDTH, height: HEIGHT, query: landscape ? '&frame=full' : '' });

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  output,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const encoded = new Promise((resolve, reject) => {
  ffmpeg.on('error', reject);
  ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
});

try {
  await page.evaluate((s, fps) => window.__record.warmup(s, fps), WARMUP, FPS);
  await page.evaluate(() => window.__record.startShowcase());

  const total = Math.round(DURATION * FPS);
  const started = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate((fps) => window.__record.step(fps), FPS);
    const png = await page.screenshot({ type: 'png', optimizeForSpeed: true });
    if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    if (i % FPS === 0) process.stdout.write(`\rframe ${i}/${total}`);
  }
  console.log(`\rcaptured ${total} frames in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  ffmpeg.stdin.end();
  await encoded;
  console.log(`wrote ${output}`);
} finally {
  await close();
}
