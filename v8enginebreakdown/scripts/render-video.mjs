import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const frames = `${project}artifacts/frames/`;
const expected = Array.from({ length: 540 }, (_, i) => `frame-${String(i).padStart(4, '0')}.jpg`);
let available;
try { available = new Set(await readdir(frames)); }
catch { throw new Error('No frames found. Open the Vite dev preview with ?frames=1 and wait for the export to complete.'); }
const missing = expected.filter(name => !available.has(name));
if (missing.length) throw new Error(`The frame export is incomplete: ${missing.length} of 540 frames are missing.`);
const output = `${project}inside-the-v8-overview.mp4`;
const encoder = spawn('ffmpeg', [
  '-y', '-framerate', '30', '-i', `${frames}frame-%04d.jpg`,
  '-vf', 'scale=in_range=full:out_range=limited:out_color_matrix=bt709,format=yuv420p',
  '-frames:v', '540', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
  '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', output,
], { stdio: 'inherit' });
encoder.on('error', () => { console.error('FFmpeg is required to encode the exported frames.'); process.exitCode = 1; });
encoder.on('exit', code => { if (code !== 0) process.exitCode = code; else console.log(`Saved: ${output}`); });
