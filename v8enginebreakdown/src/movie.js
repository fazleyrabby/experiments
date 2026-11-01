import * as THREE from 'three';
import { updateMechanism } from './engine/mechanics.js';

/** A local-only capture mode, ?record=1, uses the same geometry and timeline. */
export function createMovie(studio, engine, animation) {
  const width = 1280, height = 720, duration = 18;
  const offline = import.meta.env.DEV && new URLSearchParams(window.location.search).has('frames');
  const frameTotal = 540;
  let frameIndex = 0, pending = false;
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  canvas.className = 'movie-canvas'; canvas.setAttribute('aria-label', 'Recording the 18 second V8 overview');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  const camera = new THREE.PerspectiveCamera(35, width / height, .1, 150);
  const target = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3(1.05, .73, 1.32).normalize();
  const stream = offline ? null : canvas.captureStream(30);
  const mimeType = ['video/webm;codecs=vp8', 'video/webm;codecs=vp9', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType && !offline) throw new Error('This browser cannot record WebM video. Use Chrome.');
  const recorder = offline ? null : new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
  const chunks = [];
  let elapsed = 0, started = false, finished = false, disposed = false;
  let blobURL = null, downloadLink = null;
  animation.auto = false; animation.rotationPaused = true; animation.operation = true;
  let expanded = false, assembled = false;
  recorder?.addEventListener('dataavailable', e => { if (e.data.size) chunks.push(e.data); });
  recorder?.addEventListener('stop', async () => {
    if (disposed) return;
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    blobURL = url;
    const link = document.createElement('a'); link.href = url; link.download = 'inside-the-v8-overview.webm';
    link.id = 'movie-download'; link.textContent = 'SAVE OVERVIEW VIDEO'; link.className = 'movie-download';
    document.body.appendChild(link);
    downloadLink = link;
    stream.getTracks().forEach(track => track.stop());
    document.body.dataset.recording = 'complete';
    if (import.meta.env.DEV) {
      try {
        const response = await fetch('/__recording', { method: 'POST', body: blob, headers: { 'Content-Type': mimeType } });
        if (response.ok) { document.body.dataset.recording = 'saved'; link.textContent = 'OVERVIEW SAVED LOCALLY'; }
      } catch (error) { console.warn('Local recording export unavailable; use the download link.', error); }
    }
    // Keep the local Blob alive until the page is closed or hot-replaced.
  });
  function drawFrame() {
    const progress = animation.progress;
    engine.root.rotation.y = elapsed / duration * Math.PI * 2;
    target.set(0, 1 + progress * .15, 0);
    camera.position.copy(direction).multiplyScalar(THREE.MathUtils.lerp(20.8, 27.8, progress)).add(target);
    camera.lookAt(target);
    studio.renderer.render(studio.scene, camera);
    const bg = ctx.createRadialGradient(width * .5, height * .5, 20, width * .5, height * .5, width * .7);
    bg.addColorStop(0, '#282e32'); bg.addColorStop(.55, '#171c20'); bg.addColorStop(1, '#111315');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    // Source canvas is resized to exactly 16:9 before capture, avoiding distortion.
    ctx.drawImage(studio.renderer.domElement, 0, 0, width, height);
    ctx.fillStyle = '#d0d7d8'; ctx.font = '12px monospace'; ctx.letterSpacing = '2px'; ctx.textAlign = 'center';
    ctx.fillText(elapsed < 13 ? 'BREAK DOWN' : 'REASSEMBLE', width / 2, height - 54);
    ctx.fillStyle = '#839199'; ctx.font = '11px Arial'; ctx.letterSpacing = '0px';
    ctx.fillText(elapsed < 2 ? 'The complete 90° V8' : elapsed < 6.5 ? 'Separating the engine systems' : elapsed < 13 ? 'Eight pistons, fixed-length rods, and a cross-plane crankshaft' : 'Returning each component to its original position', width / 2, height - 30);
    ctx.textAlign = 'left';
  }
  function simulate(dt) {
    if (elapsed >= 2 && !expanded) { animation.moveTo(1, false); expanded = true; }
    if (elapsed >= 13 && !assembled) { animation.moveTo(0, false); assembled = true; }
    animation.update(dt);
    updateMechanism(engine.mechanism, animation.crankAngle);
    drawFrame();
  }
  function saveFrame() {
    pending = true;
    canvas.toBlob(async blob => {
      if (disposed) return;
      try {
        const response = await fetch('/__frame', { method: 'POST', body: blob, headers: { 'Content-Type': 'image/jpeg', 'X-Frame-Index': String(frameIndex) } });
        if (!response.ok) throw new Error('Frame export failed');
        frameIndex++;
        document.body.dataset.exportedFrames = String(frameIndex);
        if (frameIndex === frameTotal) {
          finished = true; document.body.dataset.recording = 'frames-saved';
          const label = document.createElement('span'); label.className = 'movie-download'; label.textContent = '540 FRAMES SAVED LOCALLY';
          document.body.appendChild(label); downloadLink = label;
        }
      } catch (error) { finished = true; document.body.dataset.recording = 'failed'; console.error(error); }
      pending = false;
    }, 'image/jpeg', .95);
  }
  return {
    update(dt) {
      if (finished || pending) return;
      if (!started) {
        studio.renderer.setSize(width, height); studio.renderer.setPixelRatio(1);
        studio.controls.enabled = false; drawFrame(); recorder?.start(1000);
        document.body.dataset.recording = offline ? 'exporting-frames' : 'active'; started = true;
        if (!offline) return;
      }
      if (offline) {
        // Advance only after the preceding frame is safely written. No dropped frames.
        elapsed = frameIndex / (frameTotal - 1) * duration;
        simulate(frameIndex === 0 ? 0 : duration / (frameTotal - 1));
        saveFrame(); return;
      }
      elapsed += dt;
      simulate(dt);
      if (elapsed >= duration) { recorder.stop(); finished = true; }
    },
    dispose() { disposed = true; if (recorder && recorder.state !== 'inactive') recorder.stop(); stream?.getTracks().forEach(track => track.stop()); if (blobURL) URL.revokeObjectURL(blobURL); downloadLink?.remove(); canvas.remove(); },
  };
}
