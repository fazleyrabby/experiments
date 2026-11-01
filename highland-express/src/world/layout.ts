import { noise, smoothstep } from '../core/noise';

/**
 * World layout. +x east, -z north, +y up (metres).
 * A closed railway loop circles a Highland glen. The loop crosses the glen's
 * mouth on a curved stone viaduct; a river flows south beneath it.
 */

export const VIADUCT = {
  radius: 240,
  cx: 0,
  cz: -240,
  /** half length along the centre-line (arc length) */
  halfLen: 85.5,
  /** rail-head height on the viaduct */
  railY: 38.0,
  /** bearing surface for the ballast */
  deckY: 37.4,
  width: 6.4,
  parapetH: 1.15,
  arches: 9,
  span: 14,
  pier: 4.5,
  springY: 28.2,
};
export const ARCH_PITCH = VIADUCT.span + VIADUCT.pier; // 18.5

/** Position on the viaduct centre-line for arc coordinate u (metres, 0 = centre). */
export function viaductPoint(u: number, rho = VIADUCT.radius): { x: number; z: number; theta: number } {
  const th = u / VIADUCT.radius;
  return {
    x: VIADUCT.cx + rho * Math.sin(th),
    z: VIADUCT.cz + rho * Math.cos(th),
    theta: th,
  };
}

/** Track control points (x, z) in travel order, counter-clockwise seen from above. */
export function loopControls(): [number, number][] {
  const pts: [number, number][] = [];
  const A = VIADUCT.halfLen / VIADUCT.radius;
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const th = -A + (2 * A * i) / n;
    pts.push([VIADUCT.cx + VIADUCT.radius * Math.sin(th), VIADUCT.cz + VIADUCT.radius * Math.cos(th)]);
  }
  pts.push(
    [124, -33], [172, -68], [214, -118], [240, -184], [247, -262], [231, -340],
    [190, -408], [128, -455], [58, -480], [-18, -488], [-92, -472], [-158, -436],
    [-210, -382], [-242, -312], [-252, -236], [-238, -162], [-206, -98], [-162, -52],
  );
  // the last control must lead smoothly into the first arc point
  return pts;
}

// ---------------------------------------------------------------------------
// River
// ---------------------------------------------------------------------------

/** River centre-line control points (x, z) from the glen head to the south. */
export const RIVER_PTS: [number, number][] = [
  [-26, -352], [-18, -318], [-4, -284], [12, -236], [26, -190], [14, -150],
  [-6, -112], [-14, -72], [-6, -34], [0, -8], [3, 22], [14, 62], [36, 110],
  [30, 168], [4, 232], [-30, 306], [-42, 392], [-18, 486], [22, 580],
  [74, 690], [120, 800], [170, 930],
];

/** Longitudinal profile of the valley floor along the river. */
export function floorY(z: number): number {
  // upper stream (hanging valley) -> main falls -> gentle glen -> rapids -> lowland
  const falls = smoothstep(-352, -318, z); // 0 = above falls, 1 = below
  let y = 38 + (6.4 - 38) * falls;
  if (z > -318) y = 6.4 - (z + 318) * 0.0072; // gentle slope towards viaduct
  const rapids = smoothstep(-150, -138, z);
  y -= 3.2 * rapids;
  if (z > -138) y -= (z + 138) * 0.0036;
  return y;
}

export const RIVER_BED_DEPTH = 1.1;

// ---------------------------------------------------------------------------
// Base ridge height around the loop ("rim" plateau)
// ---------------------------------------------------------------------------

export function rimY(x: number, z: number): number {
  return (
    41.5 +
    5.2 * noise.fbm2(x * 0.0085 + 3.1, z * 0.0085 - 1.7, 3) +
    2.4 * noise.n2(x * 0.03 + 11.3, z * 0.03 + 4.2)
  );
}

import * as THREE from 'three';
/** Direction *towards* the late-afternoon sun (west-south-west, low). */
export const SUN_DIR = new THREE.Vector3(-0.84, 0.36, 0.42).normalize();
