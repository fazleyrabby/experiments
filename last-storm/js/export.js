// Deterministic export: renders frame n at t = n / 24, uploads it to tools/capture_server.py,
// then renders the soundtrack offline and uploads audio.wav. Real-time speed never affects frames.
import { renderFrame } from './film.js';
import { FPS, FRAMES, DURATION } from './timeline.js';
import { renderMix, encodeWav, loadNarrationConfig } from './audio.js';

const $ = (id) => document.getElementById(id);

export async function runExport(params) {
  const w = parseInt(params.get('w') || '1920', 10);
  const h = parseInt(params.get('h') || '1080', 10);
  const from = parseInt(params.get('from') || '0', 10);
  const to = Math.min(FRAMES, parseInt(params.get('to') || String(FRAMES), 10));
  const fmt = params.get('fmt') === 'jpg' ? 'jpg' : 'png';
  const subs = params.get('subs') !== '0';
  const withAudio = params.get('audio') !== '0';

  document.title = 'Exporting — The Last Storm';
  $('poster').remove();
  $('controls').querySelector('.bar').hidden = true;
  $('scrub').hidden = true;
  const root = $('player');
  root.dataset.aspect = h > w ? 'tall' : 'wide';
  const view = $('film');
  const status = $('status');
  status.style.textAlign = 'center';
  status.style.fontSize = '13px';

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  view.width = Math.round(w / 2);
  view.height = Math.round(h / 2);
  const vg = view.getContext('2d');

  // Uploads retry with backoff, so a dropped connection does not end a long render.
  // Frames travel as base64 data-URL strings rather than Blobs: over 1,440 frames, Blobs can
  // exhaust the browser's blob store, after which even reading a fresh Blob fails.
  const put = async (name, body, headers = {}) => {
    let last = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch(`/upload/${name}`, { method: 'POST', body, headers });
        if (res.ok) return;
        last = new Error(`HTTP ${res.status}`);
      } catch (e) { last = e; }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
    throw new Error(`Upload of ${name} failed (${last && last.message}). Is tools/capture_server.py serving this page? Resume with &from=${parseInt(name.match(/\d+/)?.[0] ?? '0', 10)}.`);
  };
  const mime = fmt === 'png' ? 'image/png' : 'image/jpeg';

  const started = performance.now();
  try {
    for (let n = from; n < to; n++) {
      renderFrame(canvas, n / FPS, { quality: 1, subtitles: subs, frame: n });
      await put(`frame_${String(n).padStart(5, '0')}.${fmt}`, canvas.toDataURL(mime, 0.95), { 'X-Encoding': 'base64' });
      if (n % 4 === 0 || n === to - 1) {
        vg.drawImage(canvas, 0, 0, view.width, view.height);
        const done = n - from + 1, total = to - from;
        const per = (performance.now() - started) / done;
        status.textContent = `Rendering frame ${n + 1} / ${to} · ${w}×${h} ${fmt.toUpperCase()} · ${(per / 1000).toFixed(2)} s/frame · about ${Math.ceil(((total - done) * per) / 60000)} min left`;
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    if (withAudio) {
      status.textContent = 'Rendering soundtrack (48 kHz)…';
      let narration = null;
      try { narration = await loadNarrationConfig('audio/narration.json'); } catch (e) { console.warn('narration', e); }
      const mix = await renderMix(48000, narration);
      await put('audio.wav', encodeWav(mix));
    }
    await put('export.json', JSON.stringify({ w, h, fps: FPS, duration: DURATION, from, to, fmt, subtitles: subs, audio: withAudio, seconds: Math.round((performance.now() - started) / 1000) }, null, 2));
    status.textContent = `Done: frames ${from}–${to - 1}${withAudio ? ' and audio.wav' : ''} written. Now run tools/export.sh.`;
    window.__exportDone = true;
  } catch (e) {
    console.error(e);
    status.textContent = `Export stopped: ${e.message}`;
    window.__exportError = e.message;
  }
}
