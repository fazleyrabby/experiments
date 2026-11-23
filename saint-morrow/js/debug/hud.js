const WINDOW = 120;

export function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
}

export function readFrameInfo(renderer) {
  const { render, memory } = renderer.info;
  return {
    drawCalls: render.drawCalls,
    triangles: render.triangles,
    gpuMemoryMB: (memory.total ?? 0) / (1024 * 1024),
  };
}

export function createHud(element, meta, enabled) {
  const samples = [];
  let gpuMs = null;
  let frame = 0;
  element.hidden = !enabled;

  return {
    setGpuMs(value) {
      if (Number.isFinite(value) && value > 0) gpuMs = value;
    },
    update(dtMs, renderer, extra = '') {
      samples.push(dtMs);
      if (samples.length > WINDOW) samples.shift();
      if (!enabled || ++frame % 15) return;

      const info = readFrameInfo(renderer);
      const p50 = percentile(samples, 0.5);
      const size = renderer.getDrawingBufferSize(meta.size);
      element.textContent = [
        `${meta.backend} / ${meta.tier}`,
        `${size.x} x ${size.y}`,
        `fps      ${(1000 / Math.max(p50, 0.01)).toFixed(0)}`,
        `p50      ${p50.toFixed(1)} ms`,
        `p95      ${percentile(samples, 0.95).toFixed(1)} ms`,
        `gpu      ${gpuMs === null ? 'n/a' : `${gpuMs.toFixed(1)} ms`}`,
        `calls    ${info.drawCalls}`,
        `tris     ${(info.triangles / 1000).toFixed(1)} K`,
        `memory   ${info.gpuMemoryMB.toFixed(0)} MB`,
        `lights   ${meta.lights}`,
        extra,
      ].filter(Boolean).join('\n');
    },
  };
}
