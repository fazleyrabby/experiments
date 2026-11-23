import * as THREE from 'three/webgpu';
import { percentile, readFrameInfo } from './hud.js';

const WARMUP_MS = 2500;

export function createBench(camera, route, durationMs = 20000) {
  const curve = new THREE.CatmullRomCurve3(route.map((p) => new THREE.Vector3(...p)), true, 'centripetal');
  const look = new THREE.Vector3();
  const frameTimes = [];
  let elapsed = 0;
  let maxCalls = 0;
  let maxTriangles = 0;
  const triangleSamples = [];
  let maxMemoryMB = 0;
  let result = null;

  return {
    get result() { return result; },
    get label() {
      if (result) return `bench    done`;
      return elapsed < WARMUP_MS ? 'bench    warmup' : `bench    ${Math.round(((elapsed - WARMUP_MS) / durationMs) * 100)}%`;
    },
    update(dtMs) {
      if (result) return;
      elapsed += dtMs;
      const u = Math.max(Math.min((elapsed - WARMUP_MS) / durationMs, 1), 0);
      curve.getPointAt(u, camera.position);
      curve.getPointAt((u + 0.015) % 1, look);
      camera.lookAt(look);
    },
    // Call after rendering so the renderer's per-frame counters are populated.
    record(dtMs, renderer) {
      if (result || elapsed < WARMUP_MS) return;
      const t = Math.min((elapsed - WARMUP_MS) / durationMs, 1);

      frameTimes.push(dtMs);
      const info = readFrameInfo(renderer);
      maxCalls = Math.max(maxCalls, info.drawCalls);
      maxTriangles = Math.max(maxTriangles, info.triangles);
      triangleSamples.push(info.triangles);
      maxMemoryMB = Math.max(maxMemoryMB, info.gpuMemoryMB);

      if (t >= 1) {
        const p50 = percentile(frameTimes, 0.5);
        result = {
          frames: frameTimes.length,
          fpsP50: Number((1000 / p50).toFixed(1)),
          frameMsP50: Number(p50.toFixed(2)),
          frameMsP95: Number(percentile(frameTimes, 0.95).toFixed(2)),
          maxDrawCalls: maxCalls,
          maxTriangles,
          trianglesP95: percentile(triangleSamples, 0.95),
          maxGpuMemoryMB: Number(maxMemoryMB.toFixed(1)),
        };
        console.info('[saint-morrow bench]', JSON.stringify(result));
      }
    },
  };
}
