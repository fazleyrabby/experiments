// Meshes one die-cast body off the main thread.
import { CARS, STEP } from './cars.js';
import { surfaceNets } from './sdf.js';

self.onmessage = (e) => {
  const def = CARS[e.data.id];
  const m = surfaceNets((x, y, z) => def.sdf(x, y, z), def.bounds.min, def.bounds.max, STEP);
  self.postMessage({ id: e.data.id, ...m }, [m.position.buffer, m.normal.buffer, m.wear.buffer, m.index.buffer]);
};
