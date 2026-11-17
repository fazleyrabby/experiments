// The four die-cast bodies as signed-distance fields, in real-car metres.
// Car frame: +x forward, +y up, +z to the car's right; the ground is y = 0.
// Toy die-casts exaggerate the stance: wheels are a touch bigger and the
// rear rides wider than the real thing. Everything here is pure maths, so it
// can be meshed inside a worker.
import { polySDF, roundExtrude, smin, smax, sdRoundBox, sdRoundRect, pw, sstep, clamp } from './sdf.js';

// cut a wheel arch only through the outer skin (so the hood stays intact between the wheels)
function archCut(d, x, y, az, ax, ay, R, zIn, shape) {
  const dc = shape === 'rect'
    ? sdRoundRect(x - ax, y - ay - R * 0.08, R * 0.98, R * 1.02, R * 0.62)
    : Math.hypot(x - ax, y - ay) - R;
  const cut = Math.max(dc, zIn - az);
  return smax(d, -cut, 0.02);
}

// ---------------------------------------------------------------- Countach LP400
const C_BODY = polySDF([
  2.07, 0.24, 2.11, 0.34, 2.09, 0.45, 2.02, 0.53, 1.60, 0.625, 1.10, 0.712, 0.75, 0.772,
  0.20, 0.86, -0.90, 0.918, -1.50, 0.915, -2.00, 0.885, -2.09, 0.845, -2.11, 0.55,
  -2.07, 0.30, -1.95, 0.20, -1.55, 0.165, 1.60, 0.165, 1.95, 0.19,
]);
const C_CAB = polySDF([
  0.98, 0.70, 0.82, 0.775, -0.12, 1.062, -0.30, 1.072, -0.72, 1.062, -1.00, 0.985,
  -1.55, 0.93, -1.72, 0.86, -1.72, 0.70,
]);
const C_NACA = polySDF([-0.10, 0.655, -0.78, 0.69, -0.78, 0.585]);
const countach = {
  id: 'countach', name: 'Countach LP400',
  length: 4.14, width: 1.89, height: 1.07,
  axleF: 1.12, axleR: -1.33,
  rF: 0.33, rR: 0.345, tireWF: 0.21, tireWR: 0.26, trackF: 0.745, trackR: 0.79,
  wheelStyle: 'dial', wheelFinish: 'chrome',
  bounds: { min: [-2.2, 0.1, -1.0], max: [2.2, 1.14, 1.0] },
  halfW(x, y) {
    let w = pw(x, [[-2.1, 0.925], [-1.6, 0.955], [-0.6, 0.95], [0.6, 0.92], [1.4, 0.885], [2.1, 0.80]]);
    w -= Math.max(0, y - 0.6) * 0.24 + Math.max(0, 0.34 - y) * 0.45;
    if (x > 1.82) w -= ((x - 1.82) / 0.28) ** 2 * 0.13;
    if (x < -1.9) w -= ((-1.9 - x) / 0.2) ** 2 * 0.05;
    // the LP400's diagonal side crease: the lower door steps in below it
    if (x < 0.85 && x > -1.05) {
      const yc = 0.50 + (0.85 - x) * 0.085;
      w -= 0.02 * sstep(yc + 0.006, yc - 0.006, y) * sstep(0.85, 0.7, x) * sstep(-1.05, -0.92, x);
    }
    return w;
  },
  sdf(x, y, z) {
    const az = Math.abs(z);
    let d = roundExtrude(C_BODY(x, y), az - this.halfW(x, y), 0.035);
    const cw = pw(x, [[-1.72, 0.84], [-1.0, 0.79], [-0.6, 0.70], [0.1, 0.68], [0.8, 0.735], [0.98, 0.76]]) - Math.max(0, y - 0.8) * 0.62;
    d = smin(d, roundExtrude(C_CAB(x, y), az - cw, 0.05), 0.035);
    d = archCut(d, x, y, az, this.axleF, this.rF, 0.36, this.trackF - this.tireWF / 2 - 0.07, 'round');
    d = archCut(d, x, y, az, this.axleR, this.rR, 0.375, this.trackR - this.tireWR / 2 - 0.07, 'rect');
    // periscope trough in the roof
    d = smax(d, -sdRoundBox(x + 0.40, y - 1.085, z, 0.25, 0.04, 0.30, 0.025), 0.015);
    // NACA duct on the flank, deepening toward the rear
    const depth = 0.05 * clamp((-x - 0.1) / 0.68, 0, 1);
    const naca = Math.max(C_NACA(x, y), (this.halfW(x, y) - depth) - az);
    d = smax(d, -naca, 0.008);
    // recessed rear grille panel
    d = smax(d, -sdRoundBox(x + 2.13, y - 0.6, z, 0.06, 0.1, 0.62, 0.02), 0.01);
    return d;
  },
};

// ---------------------------------------------------------------- "Brawler": a fictional 70s fastback
const M_BODY = polySDF([
  2.37, 0.30, 2.40, 0.62, 2.34, 0.78, 1.80, 0.865, 0.55, 0.915, -0.60, 0.965,
  -2.15, 0.985, -2.37, 1.0, -2.41, 0.88, -2.37, 0.40, -2.20, 0.30, -1.90, 0.25,
  1.90, 0.23, 2.25, 0.25,
]);
const M_CAB = polySDF([0.80, 0.84, 0.58, 0.915, -0.25, 1.265, -0.95, 1.285, -2.10, 0.99, -2.15, 0.84]);
const brawler = {
  id: 'brawler', name: 'Brawler 440',
  length: 4.78, width: 1.92, height: 1.30,
  axleF: 1.32, axleR: -1.46,
  rF: 0.33, rR: 0.385, tireWF: 0.22, tireWR: 0.32, trackF: 0.75, trackR: 0.79,
  wheelStyle: 'dish', wheelFinish: 'chrome',
  bounds: { min: [-2.5, 0.12, -1.02], max: [2.5, 1.36, 1.02] },
  halfW(x, y) {
    let w = pw(x, [[-2.4, 0.90], [-1.46, 0.965], [-0.7, 0.925], [0.3, 0.915], [1.3, 0.935], [2.4, 0.90]]);
    w -= Math.max(0, y - 0.74) * 0.3 + Math.max(0, 0.42 - y) * 0.35;
    if (x > 2.2) w -= ((x - 2.2) / 0.2) ** 2 * 0.06;
    return w;
  },
  sdf(x, y, z) {
    const az = Math.abs(z);
    let d = roundExtrude(M_BODY(x, y), az - this.halfW(x, y), 0.04);
    const cw = pw(x, [[-2.15, 0.84], [-1.0, 0.77], [0.0, 0.745], [0.8, 0.79]]) - Math.max(0, y - 0.93) * 0.45;
    d = smin(d, roundExtrude(M_CAB(x, y), az - cw, 0.06), 0.04);
    // hood scoop with an open mouth
    d = smin(d, sdRoundBox(x - 1.2, y - 0.905, z, 0.36, 0.07, 0.27, 0.045), 0.04);
    d = smax(d, -sdRoundBox(x - 1.58, y - 0.95, z, 0.05, 0.03, 0.21, 0.012), 0.008);
    // recessed grille
    d = smax(d, -sdRoundBox(x - 2.41, y - 0.62, z, 0.04, 0.115, 0.78, 0.02), 0.01);
    // ducktail lip
    d = smin(d, sdRoundBox(x + 2.3, y - 1.0, z, 0.1, 0.025, 0.82, 0.02), 0.03);
    d = archCut(d, x, y, az, this.axleF, this.rF, 0.375, this.trackF - this.tireWF / 2 - 0.07, 'round');
    d = archCut(d, x, y, az, this.axleR, this.rR, 0.43, this.trackR - this.tireWR / 2 - 0.07, 'round');
    return d;
  },
};

// ---------------------------------------------------------------- "Rally 12": a fictional boxy rally hatch
const H_BODY = polySDF([1.97, 0.26, 2.0, 0.66, 1.93, 0.79, 1.30, 0.845, 0.70, 0.88, -1.75, 0.925, -1.98, 0.925, -2.0, 0.30, -1.85, 0.22, 1.80, 0.22]);
const H_CAB = polySDF([0.88, 0.82, 0.72, 0.88, -0.02, 1.37, -1.60, 1.395, -1.90, 1.30, -1.975, 0.92, -1.975, 0.80]);
const hatch = {
  id: 'hatch', name: 'Rally 12',
  length: 3.98, width: 1.82, height: 1.42,
  axleF: 1.24, axleR: -1.2,
  rF: 0.33, rR: 0.33, tireWF: 0.25, tireWR: 0.25, trackF: 0.76, trackR: 0.76,
  wheelStyle: 'six', wheelFinish: 'gold',
  bounds: { min: [-2.1, 0.12, -1.0], max: [2.1, 1.46, 1.0] },
  halfW(x, y) {
    let w = 0.80 - Math.max(0, y - 0.86) * 0.12 - Math.max(0, 0.36 - y) * 0.3;
    if (x > 1.86) w -= ((x - 1.86) / 0.14) ** 2 * 0.05;
    return w;
  },
  sdf(x, y, z) {
    const az = Math.abs(z);
    let d = roundExtrude(H_BODY(x, y), az - this.halfW(x, y), 0.045);
    const cw = pw(x, [[-1.98, 0.735], [-1.0, 0.755], [0.6, 0.755], [0.88, 0.775]]) - Math.max(0, y - 0.9) * 0.26;
    d = smin(d, roundExtrude(H_CAB(x, y), az - cw, 0.065), 0.03);
    // boxed Group-B style flares
    for (const ax of [this.axleF, this.axleR]) {
      d = smin(d, sdRoundBox(x - ax, y - 0.56, az - 0.80, 0.56, 0.29, 0.105, 0.06), 0.035);
    }
    // roof spoiler
    d = smin(d, sdRoundBox(x + 1.83, y - 1.405, z, 0.17, 0.026, 0.67, 0.02), 0.03);
    // front grille slot and bonnet vents
    d = smax(d, -sdRoundBox(x - 2.0, y - 0.70, z, 0.04, 0.06, 0.6, 0.02), 0.008);
    d = smax(d, -sdRoundBox(x - 1.45, y - 0.86, az - 0.3, 0.16, 0.02, 0.1, 0.02), 0.008);
    d = archCut(d, x, y, az, this.axleF, this.rF, 0.375, 0.6, 'round');
    d = archCut(d, x, y, az, this.axleR, this.rR, 0.375, 0.6, 'round');
    return d;
  },
};

// ---------------------------------------------------------------- "Hauler": a fictional hot-rod delivery van
const V_BODY = polySDF([
  2.15, 0.29, 2.18, 0.80, 2.07, 0.925, 1.30, 1.005, 1.08, 1.06, 0.58, 1.755,
  0.40, 1.80, -1.95, 1.81, -2.13, 1.74, -2.16, 0.42, -2.02, 0.29, 1.92, 0.27,
]);
const van = {
  id: 'van', name: 'Hauler',
  length: 4.32, width: 1.92, height: 1.84,
  axleF: 1.40, axleR: -1.22,
  rF: 0.30, rR: 0.41, tireWF: 0.19, tireWR: 0.38, trackF: 0.72, trackR: 0.84,
  wheelStyle: 'five', wheelFinish: 'chrome',
  bounds: { min: [-2.25, 0.12, -1.0], max: [2.25, 1.88, 1.0] },
  halfW(x, y) {
    let w = pw(x, [[-2.16, 0.885], [1.0, 0.885], [2.18, 0.84]]);
    w -= Math.max(0, y - 1.15) * 0.1 + Math.max(0, 0.38 - y) * 0.3;
    return w;
  },
  sdf(x, y, z) {
    const az = Math.abs(z);
    let d = roundExtrude(V_BODY(x, y), az - this.halfW(x, y), 0.07);
    // grille recess, side beltline swage, hood opening for the blower
    d = smax(d, -sdRoundBox(x - 2.19, y - 0.60, z, 0.04, 0.14, 0.62, 0.03), 0.01);
    d = smin(d, sdRoundBox(x + 0.3, y - 1.08, az - 0.885, 1.9, 0.025, 0.02, 0.012), 0.02);
    d = smax(d, -sdRoundBox(x - 1.62, y - 0.98, z, 0.25, 0.06, 0.2, 0.03), 0.01);
    d = archCut(d, x, y, az, this.axleF, this.rF, 0.345, this.trackF - this.tireWF / 2 - 0.07, 'round');
    d = archCut(d, x, y, az, this.axleR, this.rR, 0.47, 0.5, 'round');
    return d;
  },
};

export const CARS = { countach, brawler, hatch, van };
export const STEP = 0.022; // mesh cell size, real metres (0.34 mm on the toy)
