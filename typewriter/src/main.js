import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/special-elite/400.css';
import '@phosphor-icons/web/regular';
import './style.css';
import { PaperDocument, COLUMNS } from './document.js';
import { TypewriterScene } from './scene.js';
import { TypewriterSound } from './sound.js';

const $ = selector => document.querySelector(selector);
const paper = new PaperDocument();
const sound = new TypewriterSound();
const manuscript = $('#manuscript');
const playButton = $('#play-demo');
const directInput = $('#direct-input');
const speeds = [290, 200, 125, 80, 45];
let demo = null;
let demoTimer = null;
let toastTimer;
let recorder = null;
let recording = false;
let recordingFinishTimer = null;
let scene;
let sceneReady = false;

function readPreference(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function storePreference(key, value) { try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ } }
const systemDark = matchMedia('(prefers-color-scheme: dark)');
let themePreference = readPreference('keystroke-theme', 'system');
const isDark = () => themePreference === 'system' ? systemDark.matches : themePreference === 'dark';
function updateTheme() {
  const dark = isDark();
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('#theme-toggle i').className = dark ? 'ph ph-moon' : 'ph ph-sun';
  $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  scene?.setTheme(dark);
}
updateTheme();
systemDark.addEventListener('change', () => { if (themePreference === 'system') updateTheme(); });
$('#theme-toggle').addEventListener('click', () => {
  themePreference = isDark() ? 'light' : 'dark';
  storePreference('keystroke-theme', themePreference);
  updateTheme();
});
sound.enabled = readPreference('keystroke-sound', 'on') === 'on';
function updateSound() {
  const button = $('#sound-toggle');
  button.setAttribute('aria-pressed', String(sound.enabled));
  button.setAttribute('aria-label', sound.enabled ? 'Mute sound' : 'Enable sound');
  button.title = sound.enabled ? 'Mute sound' : 'Enable sound';
  button.querySelector('i').className = sound.enabled ? 'ph ph-speaker-high' : 'ph ph-speaker-slash';
}
updateSound();
$('#sound-toggle').addEventListener('click', async () => {
  sound.enabled = !sound.enabled;
  storePreference('keystroke-sound', sound.enabled ? 'on' : 'off');
  updateSound();
  if (sound.enabled) { await sound.unlock(); sound.strike(); }
});
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3500);
}
function status(message) { $('#status').textContent = message; }
function syncPaper() {
  scene?.updatePaper(paper.layout);
  $('#accessible-transcript').textContent = paper.text;
}
function stamp(char, manual = false) {
  if (!sceneReady) return false;
  if (manual && demo) stopDemo();
  const previousRow = paper.layout.row;
  if (!paper.append(char)) { toast('Page full. Start a fresh page.'); return false; }
  scene.strike(char);
  const layout = paper.layout;
  if (layout.row !== previousRow) sound.carriage();
  else sound.strike(char === ' ');
  if (layout.column === COLUMNS - 5) sound.bell();
  syncPaper();
  return true;
}
function resetPage() {
  stopDemo();
  if (recording) stopRecording();
  paper.clear();
  syncPaper();
  sound.carriage();
  status('Fresh page.');
}
function setPlayState(playing = false, paused = false) {
  playButton.querySelector('i').className = playing ? 'ph ph-pause' : 'ph ph-play';
  playButton.querySelector('span').textContent = paused ? 'Resume' : playing ? 'Pause' : 'Play demo';
  playButton.setAttribute('aria-label', playing ? 'Pause demo' : paused ? 'Resume demo' : 'Play demo');
  document.body.classList.toggle('playing', playing);
  if (playing) $('#scene').focus({ preventScroll: true });
}
function stopDemo() {
  clearTimeout(demoTimer);
  demoTimer = null;
  demo = null;
  setPlayState();
}
function nextDemoCharacter() {
  if (!demo || demo.paused) return;
  if (demo.index >= demo.text.length) {
    stopDemo();
    status('Demo complete.');
    if (recording) recordingFinishTimer = setTimeout(stopRecording, 1600);
    return;
  }
  const char = demo.text[demo.index++];
  if (!stamp(char)) { stopDemo(); if (recording) stopRecording(); return; }
  const pause = /[,.?!]/.test(char) ? 2.8 : char === ' ' ? 1.3 : 1;
  const rhythm = 1 + Math.sin(demo.index * 4.3) * .17;
  demoTimer = setTimeout(nextDemoCharacter, speeds[$('#typing-speed').value - 1] * pause * rhythm);
}
async function startDemo() {
  if (!sceneReady) return;
  closeEditor();
  if (demo) {
    demo.paused = !demo.paused;
    setPlayState(!demo.paused, demo.paused);
    if (demo.paused) clearTimeout(demoTimer);
    else nextDemoCharacter();
    return;
  }
  const text = manuscript.value.replace(/\r\n?/g, '\n');
  if (!text.trim()) { openEditor(); manuscript.focus(); return; }
  await sound.unlock();
  paper.clear();
  syncPaper();
  demo = { text: Array.from(text), index: 0, paused: false };
  setPlayState(true);
  status('Typing demo. Press Space to pause or Escape to stop.');
  demoTimer = setTimeout(nextDemoCharacter, 650);
}
playButton.addEventListener('click', startDemo);
$('#new-page').addEventListener('click', resetPage);
function openEditor() { $('#editor').hidden = false; $('#edit-text').setAttribute('aria-expanded', 'true'); }
function closeEditor() { $('#editor').hidden = true; $('#edit-text').setAttribute('aria-expanded', 'false'); }
$('#edit-text').addEventListener('click', () => { if ($('#editor').hidden) openEditor(); else closeEditor(); });
$('#close-editor').addEventListener('click', closeEditor);

function focusWriting() {
  if (!sceneReady || recording || demo) return;
  closeEditor();
  sound.unlock();
  directInput.focus({ preventScroll: true });
}
$('#scene').addEventListener('write-focus', focusWriting);
function manualBackspace() {
  if (demo) stopDemo();
  paper.backspace();
  sound.strike(true);
  syncPaper();
}
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (recording) stopRecording();
    stopDemo();
    closeEditor();
    document.body.classList.remove('cinema');
    directInput.blur();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); startDemo(); return; }
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  const editable = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target.isContentEditable;
  if (editable && event.target !== directInput) return;
  if (demo && event.key === ' ') { event.preventDefault(); startDemo(); return; }
  if (recording) return;
  if (event.target === directInput && event.key !== 'Backspace' && event.key !== 'Enter') return;
  if (event.key === 'Backspace') { event.preventDefault(); manualBackspace(); }
  else if (event.key === 'Enter' && event.target === directInput) { event.preventDefault(); stamp('\n', true); }
  else if (event.key.length === 1 && !(event.key === ' ' && event.target instanceof HTMLButtonElement)) {
    event.preventDefault(); sound.unlock(); stamp(event.key, true);
  }
});
directInput.addEventListener('beforeinput', event => {
  if (event.isComposing || event.inputType === 'insertFromPaste') return;
  if (event.inputType === 'insertText') {
    event.preventDefault();
    for (const char of event.data || '') stamp(char, true);
  } else if (event.inputType === 'insertLineBreak') { event.preventDefault(); stamp('\n', true); }
  else if (event.inputType === 'deleteContentBackward') { event.preventDefault(); manualBackspace(); }
});
directInput.addEventListener('compositionend', event => {
  for (const char of event.data) stamp(char, true);
  directInput.value = '';
});
directInput.addEventListener('paste', event => {
  event.preventDefault();
  for (const char of event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n')) {
    if (!stamp(char, true)) break;
  }
});
directInput.addEventListener('input', () => { directInput.value = ''; });
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    scene?.setView(button.dataset.view);
    for (const item of document.querySelectorAll('[data-view]')) {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    }
  });
}

async function startRecording() {
  if (recording) { stopRecording(); return; }
  if (!sceneReady || !window.MediaRecorder || !scene?.renderer.domElement.captureStream) {
    toast('Video recording needs a recent browser such as Chrome.'); return;
  }
  if (!manuscript.value.trim()) { openEditor(); manuscript.focus(); return; }
  stopDemo();
  closeEditor();
  await sound.unlock();
  const formats = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  const mimeType = formats.find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) { toast('Video export is unavailable in this browser.'); return; }
  const stream = scene.renderer.domElement.captureStream(30);
  for (const track of sound.destination?.stream.getAudioTracks() || []) stream.addTrack(track);
  const chunks = [];
  try {
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { toast('Recording failed. Try Chrome.'); stopRecording(); };
    recorder.onstop = () => {
      stream.getVideoTracks().forEach(track => track.stop());
      if (chunks.length) {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `typewriter-demo.${mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        status('Video downloaded.');
      }
    };
    recording = true;
    document.body.classList.add('cinema');
    $('#record-demo i').className = 'ph ph-stop-circle';
    $('#record-demo').setAttribute('aria-label', 'Stop recording');
    recorder.start(200);
    await startDemo();
  } catch (error) {
    stream.getVideoTracks().forEach(track => track.stop());
    recording = false;
    document.body.classList.remove('cinema');
    $('#record-demo i').className = 'ph ph-record';
    $('#record-demo').setAttribute('aria-label', 'Record demo');
    toast('Couldn’t record. Try Chrome.');
    console.error(error);
  }
}
function stopRecording() {
  clearTimeout(recordingFinishTimer);
  recordingFinishTimer = null;
  if (!recording) return;
  recording = false;
  if (recorder?.state !== 'inactive') recorder.stop();
  document.body.classList.remove('cinema');
  $('#record-demo i').className = 'ph ph-record';
  $('#record-demo').setAttribute('aria-label', 'Record demo');
}
$('#record-demo').addEventListener('click', startRecording);
await document.fonts.ready;
scene = new TypewriterScene($('#scene'), {
  onKey: char => { if (!demo && !recording) { sound.unlock(); stamp(char, true); } },
  onReady: () => {
    sceneReady = true;
    $('#scene-loading').classList.add('loaded');
    $('#scene-loading').setAttribute('aria-hidden', 'true');
    syncPaper();
    document.documentElement.dataset.ready = 'true';
  },
  onError: error => {
    $('#scene-loading').innerHTML = '<p>Enable graphics acceleration to view the typewriter.</p>';
    playButton.disabled = true;
    console.error(error);
  },
});
window.addEventListener('pagehide', () => { stopDemo(); stopRecording(); scene?.dispose(); });
if (import.meta.hot) import.meta.hot.dispose(() => { stopDemo(); stopRecording(); scene?.dispose(); });
