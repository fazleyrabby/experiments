// Renders the soothing overview screencast: deterministic frames + an offline spatial soundtrack.
//   node tools/capture.mjs [url] [out.mp4]
// Needs playwright (resolved from PLAYWRIGHT_DIR or ../../showreel/node_modules) and ffmpeg.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
const pwDir = process.env.PLAYWRIGHT_DIR || '/Users/rabbi/Desktop/showreel/node_modules';
const { chromium } = require(path.join(pwDir, 'playwright'));

const url = process.argv[2] || 'http://localhost:4190/?capture';
const out = path.resolve(process.argv[3] || 'living-nature-screencast.mp4');
const DUR = 19, FPS = 30, N = DUR * FPS;
const work = path.join(os.tmpdir(), 'living-nature-capture');
if (existsSync(work)) rmSync(work, { recursive: true });
mkdirSync(work, { recursive: true });

// Hours of the day vs. time: sunrise mist -> bright midday -> golden sunset -> moonlit night.
const SEG = [[0, 4.5, 5.9, 8.2], [4.5, 8.5, 8.2, 16.4], [8.5, 13.5, 16.4, 19.6], [13.5, 19, 19.6, 22.7]];
const rate = (t) => { for (const [a, b, h0, h1] of SEG) if (t < b) return (h1 - h0) / (b - a); return 0.5; };
const hours = [];
{
  let h = SEG[0][2];
  const win = 2.0;
  for (let i = 0; i < N; i++) {
    const t = i / FPS;
    let s = 0, c = 0;
    for (let k = -win; k <= win; k += 0.1) { s += rate(Math.min(DUR, Math.max(0, t + k))); c++; }
    hours.push(h);
    h += (s / c) / FPS;
  }
}
const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.__cap, null, { timeout: 60000 });

const t0 = Date.now();
for (let i = 0; i < N; i++) {
  const t = i / FPS;
  await page.evaluate(([i, hour, t, weather, cam]) => {
    if (weather) window.__cap.set({ weather });
    window.__cap.set({ camTarget: cam });
    window.__cap.step(1 / 30, hour);
  }, [i, hours[i], t, i === Math.round(4.0 * FPS) ? 'clouds' : i === Math.round(8.0 * FPS) ? 'clear' : null, -0.7 + 1.4 * sm(t / DUR)]);
  const b64 = await page.evaluate(() => window.__cap.png());
  writeFileSync(path.join(work, `f${String(i).padStart(4, '0')}.png`), Buffer.from(b64, 'base64'));
  if (i % 60 === 0) console.log(`frame ${i}/${N}  hour ${hours[i].toFixed(2)}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
console.log('rendering soundtrack...');
const wav = await page.evaluate(([d, v]) => window.__cap.audio(d, v), [DUR, 0.85]);
writeFileSync(path.join(work, 'audio.wav'), Buffer.from(wav, 'base64'));
const evCount = await page.evaluate(() => window.__cap.log.events.reduce((m, e) => ((m[e.type] = (m[e.type] || 0) + 1), m), {}));
console.log('visual-driven sound events:', JSON.stringify(evCount));
await browser.close();

execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(work, 'f%04d.png'), '-i', path.join(work, 'audio.wav'),
  '-vf', `scale=1920:1080:flags=neighbor,fade=t=in:st=0:d=1,fade=t=out:st=${DUR - 1.4}:d=1.4,format=yuv420p`,
  '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), out], { stdio: 'inherit' });
console.log('wrote', out);
