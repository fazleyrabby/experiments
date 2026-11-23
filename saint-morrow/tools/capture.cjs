// Renders the showcase video on a virtual clock, so every frame is perfectly paced however long it takes.
// Serve on :4441, then:
// node saint-morrow/tools/capture.cjs <playwright-module-dir> <out.mp4> <rain-audio> <thunder-audio>
const { spawn } = require('child_process');

const [moduleDir, out, rainAudio, thunderAudio] = process.argv.slice(2);
if (!moduleDir || !out || !rainAudio || !thunderAudio) throw new Error('Usage: capture.cjs <playwright-module-dir> <out.mp4> <rain> <thunder>');
const { chromium } = require(moduleDir);

const WIDTH = 1600;
const HEIGHT = 900;
const FPS = 30;
const DURATION = 20;
const KEY_SPACING = 2.5;

// Evenly timed camera keys: low over the wet road, along the shopfronts, then up to the cathedral.
const KEYS = [
  { p: [-1.6, 0.42, 42], l: [-0.5, 3, -20] },
  { p: [-1.5, 0.55, 33], l: [-0.3, 4, -25] },
  { p: [-1, 0.85, 24], l: [0, 5, -30] },
  { p: [1.8, 1.25, 15], l: [4, 4, -20] },
  { p: [5.6, 1.55, 7.5], l: [9, 2.5, -2] },
  { p: [6.35, 1.6, -3], l: [9.2, 2.3, -9] },
  { p: [6.35, 1.6, -15], l: [9, 2.4, -21] },
  { p: [3.4, 1.6, -29], l: [0, 12, -60] },
  { p: [0.2, 1.35, -41], l: [0, 20, -60] },
];

const catmull = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);

function pose(seconds) {
  const position = Math.min(seconds / KEY_SPACING, KEYS.length - 1.0001);
  const index = Math.floor(position);
  const t = position - index;
  const key = (i) => KEYS[Math.max(0, Math.min(KEYS.length - 1, i))];
  const sample = (field) => [0, 1, 2].map((axis) => catmull(key(index - 1)[field][axis], key(index)[field][axis], key(index + 1)[field][axis], key(index + 2)[field][axis], t));
  return { position: sample('p'), target: sample('l') };
}

function installVirtualClock() {
  const realNow = performance.now.bind(performance);
  const realFrame = window.requestAnimationFrame.bind(window);
  let virtual = null;
  let queued = [];
  performance.now = () => virtual ?? realNow();
  window.requestAnimationFrame = (callback) => {
    if (virtual === null) return realFrame(callback);
    queued.push(callback);
    return queued.length;
  };
  window.__capture = {
    begin() { virtual = realNow(); },
    // Rendering and readback share one task: a WebGPU canvas is cleared once the task ends.
    frame(ms, position, target) {
      const { camera, renderer } = window.__morrow;
      camera.position.set(...position);
      camera.lookAt(...target);
      virtual += ms;
      const callbacks = queued;
      queued = [];
      callbacks.forEach((callback) => callback(virtual));
      return renderer.domElement.toDataURL('image/jpeg', 0.96).split(',')[1];
    },
  };
}

(async () => {
  const encoder = spawn('ffmpeg', [
    '-y', '-v', 'error',
    '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
    '-stream_loop', '-1', '-i', rainAudio,
    '-i', thunderAudio,
    '-filter_complex',
    `[1:a]atrim=0:${DURATION},asetpts=N/SR/TB,aformat=channel_layouts=stereo,volume=0.95,afade=t=in:d=1.4,afade=t=out:st=${DURATION - 1.8}:d=1.8[rain];`
    + '[2:a]aformat=channel_layouts=stereo,lowpass=f=900,volume=0.8,adelay=11500|11500[thunder];'
    + `[rain][thunder]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.9[audio]`,
    '-map', '0:v', '-map', '[audio]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', String(DURATION), out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const encoded = new Promise((resolve, reject) => encoder.on('close', (code) => (code ? reject(new Error(`ffmpeg exited ${code}`)) : resolve())));

  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-webgpu', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text().slice(0, 240)); });
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 240)));
  await page.addInitScript(installVirtualClock);
  await page.goto('http://127.0.0.1:4441/?shot=1', { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('status')?.classList.contains('done'), null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__capture.begin());
  await page.waitForTimeout(150);

  const frameMs = 1000 / FPS;
  const settle = pose(0);
  for (let i = 0; i < 45; i++) await page.evaluate(([ms, p, t]) => { window.__capture.frame(ms, p, t); }, [frameMs, settle.position, settle.target]);

  const total = DURATION * FPS;
  for (let frame = 0; frame < total; frame++) {
    const { position, target } = pose(frame / FPS);
    const jpeg = await page.evaluate(([ms, p, t]) => window.__capture.frame(ms, p, t), [frameMs, position, target]);
    if (!encoder.stdin.write(Buffer.from(jpeg, 'base64'))) await new Promise((resolve) => encoder.stdin.once('drain', resolve));
    if (frame % 60 === 0) console.log(`frame ${frame}/${total}`);
  }
  encoder.stdin.end();
  await encoded;
  await browser.close();
  console.log(JSON.stringify({ out, frames: total, errors: [...new Set(errors)].slice(0, 3) }));
})().catch((error) => { console.error(error); process.exit(1); });
