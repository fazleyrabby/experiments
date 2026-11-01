// Offline capture driver. Load the scene with ?capture, then:
//   const cap = await import('/tools/capture.js'); await cap.setup(); await cap.shoot(20000) ...; await cap.audio()
// Frames and the soundtrack are POSTed to tools/capture_server.py.

const D = 18, FPS = 30;
const STRIKES = [[1.0, 1700], [4.3, 950], [7.4, 2300], [10.2, 520], [13.3, 1400], [16.2, 800]];
const C = { frame: 0, start: null, fired: 0 };

const ready = () => new Promise((r) => { const i = setInterval(() => { if (window.__storm) { clearInterval(i); r(); } }, 200); });

export async function setup() {
  await ready();
  const S = window.__storm;
  S.atmos.override('lightning', 0);
  const look = S.camera.position.clone();
  S.setCamHook((dt, t, target) => {
    const tc = C.start === null ? 0 : t - C.start;
    const u = Math.min(Math.max(tc / D, 0), 1);
    const e = u * u * (3 - 2 * u) * 0.25 + u * 0.75;
    const a = 0.9 + e * Math.PI * 2;
    const R = 330 + 70 * Math.sin(e * Math.PI * 2 + 0.6);
    const h = 70 + 38 * Math.sin(e * Math.PI * 4 + 1.0);
    S.camera.position.set(target.x + Math.cos(a) * R, target.y + h, target.z + Math.sin(a) * R);
    look.set(target.x, target.y - 4, target.z);
    S.camera.lookAt(look);
    if (C.start !== null) {
      while (C.fired < STRIKES.length && tc >= STRIKES[C.fired][0]) {
        S.lightning.strike(S.camera, { dist: STRIKES[C.fired][1], ahead: true });
        C.fired++;
      }
      if (Math.random() < dt * 0.5) S.lightning.cloudFlash(S.camera);
    }
  });
  for (let i = 0; i < 180; i++) S.tick(1 / FPS);
  S.triggerRogue();
  S.waves.rogue.t0 = S.getTime() - (950 - 230) / 13.5;
  C.start = S.getTime();
  S.eventLog.length = 0;
  S.mixLog.length = 0;
  return { t: C.start };
}

export async function shoot(maxMs = 20000) {
  const S = window.__storm, cv = S.renderer.domElement;
  const t0 = performance.now();
  while (C.frame < D * FPS && performance.now() - t0 < maxMs) {
    S.tick(1 / FPS);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.94));
    await fetch(`/upload/f${String(C.frame).padStart(4, '0')}.jpg`, { method: 'POST', body: blob });
    C.frame++;
  }
  return { frame: C.frame, total: D * FPS, ms: Math.round(performance.now() - t0) };
}

// Render the soundtrack offline, replaying the mix and events logged during the take.
export async function audio() {
  const S = window.__storm;
  const { StormAudio } = await import('/js/audio.js');
  const sr = 48000, dur = D + 0.5;
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
  const a = new StormAudio();
  a.vol = 0.9;
  a.start(ctx);
  const mix = S.mixLog.filter((m) => m.t > C.start);
  const events = S.eventLog.map((e) => ({ ...e, t: e.t - C.start })).filter((e) => e.t >= 0).sort((x, y) => x.t - y.t);
  let ei = 0;
  for (const m of mix) {
    const t = m.t - C.start;
    a.tOffset = t;
    a.update(m.dt, m);
    while (ei < events.length && events[ei].t <= t) {
      const e = events[ei++];
      if (e.type === 'thunder') a.thunder(e.dist, e.pan, e.cloud);
      else a.slam(e.I, e.att, e.pan);
    }
  }
  // fade out
  a.master.gain.setTargetAtTime(0, D - 0.8, 0.35);
  const buf = await ctx.startRendering();
  const wav = toWav(buf);
  await fetch('/upload/audio.wav', { method: 'POST', body: wav });
  return { events: events.length, seconds: buf.duration };
}

function toWav(buf) {
  const ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
  out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  w(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    const v = Math.max(-1, Math.min(1, data[c][i]));
    out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2;
  }
  return new Blob([out.buffer], { type: 'audio/wav' });
}
