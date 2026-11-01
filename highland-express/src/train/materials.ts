import * as THREE from 'three';
import { patch } from '../core/shaders';

const c = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

interface PaintOpts {
  key: string;
  color: THREE.Color;
  rough?: number;
  clearcoat?: number;
  metal?: number;
  /** object-space y below which grime accumulates */
  grimeBelow?: number;
  grimeAmount?: number;
  soot?: number; // soot toward +z and high y (smokebox / chimney end)
  chips?: number; // edge-less random paint wear
  streaks?: number;
}

/** Glossy painted metal or timber with procedural dirt, soot, streaks and wear. */
export function paint(o: PaintOpts): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: o.color,
    roughness: o.rough ?? 0.42,
    metalness: o.metal ?? 0.0,
    clearcoat: o.clearcoat ?? 0.55,
    clearcoatRoughness: 0.22,
    envMapIntensity: 1.0,
    side: THREE.DoubleSide,
  });
  const gb = (o.grimeBelow ?? 1.2).toFixed(3);
  const ga = (o.grimeAmount ?? 0.45).toFixed(3);
  const so = (o.soot ?? 0).toFixed(3);
  const ch = (o.chips ?? 0.35).toFixed(3);
  const st = (o.streaks ?? 0.35).toFixed(3);
  return patch(mat, {
    key: o.key,
    fragColor: /* glsl */ `
      float gN = heFbm(vOPos * vec3(2.7, 2.7, 1.4) + 3.0);
      float fine = heVNoise(vOPos * 38.0);
      float low = 1.0 - smoothstep(0.0, ${gb}, vOPos.y);
      float grime = clamp(low * ${ga} * (0.55 + 0.9 * gN), 0.0, 0.85);
      // vertical rain / oil streaks
      float stk = heVNoise2(vec2(vOPos.x * 14.0 + vOPos.z * 6.5, vOPos.y * 0.9 + gN));
      float streak = smoothstep(0.58, 0.9, stk) * ${st};
      // soot toward the chimney end
      float sootAmt = ${so} * smoothstep(1.6, 5.0, vOPos.z) * smoothstep(1.2, 3.6, vOPos.y) * (0.5 + gN);
      diffuseColor.rgb *= 1.0 - 0.9 * (grime + streak * 0.5 + sootAmt);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.18, 1.0, 0.8) * 0.8, grime * 0.4);
      // paint chips / dust patches
      float chipN = smoothstep(0.80, 0.92, heVNoise(vOPos * 21.0 + 5.0)) * ${ch};
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.045, 0.04), chipN * 0.6);
      diffuseColor.rgb *= 0.94 + 0.12 * fine;
    `,
    fragRough: /* glsl */ `
      float rg = heFbm(vOPos * vec3(2.7, 2.7, 1.4) + 3.0);
      float lowR = 1.0 - smoothstep(0.0, ${gb}, vOPos.y);
      roughnessFactor = clamp(roughnessFactor + (rg - 0.5) * 0.22 + lowR * 0.25 * ${ga}, 0.18, 1.0);
    `,
  });
}

export function metal(key: string, color: THREE.Color, rough = 0.3, tarnish = 0.0): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 1.0, envMapIntensity: 1.2, side: THREE.DoubleSide });
  return patch(mat, {
    key,
    fragColor: /* glsl */ `
      float mN = heFbm(vOPos * 11.0);
      diffuseColor.rgb *= 0.86 + 0.28 * mN;
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.45, 0.38), ${tarnish.toFixed(2)} * smoothstep(0.45, 0.85, heFbm(vOPos * 5.0 + 9.0)));
    `,
    fragRough: 'roughnessFactor = clamp(roughnessFactor + (heFbm(vOPos * 17.0) - 0.5) * 0.25, 0.12, 0.9);',
  });
}

export interface TrainMaterials {
  [k: string]: THREE.Material;
}

export function makeLocoMaterials(): TrainMaterials {
  const green = paint({ key: 'loco-green', color: c(0.055, 0.29, 0.16), rough: 0.36, clearcoat: 0.8, grimeBelow: 2.1, grimeAmount: 0.5, soot: 0.5, streaks: 0.4 });
  const black = paint({ key: 'loco-black', color: c(0.035, 0.036, 0.04), rough: 0.5, clearcoat: 0.35, grimeBelow: 3.0, grimeAmount: 0.25, soot: 0.15, chips: 0.2, streaks: 0.2 });
  const red = paint({ key: 'loco-red', color: c(0.50, 0.035, 0.03), rough: 0.4, clearcoat: 0.7, grimeBelow: 1.2, grimeAmount: 0.5, chips: 0.5 });
  const cream = paint({ key: 'loco-cream', color: c(0.86, 0.76, 0.46), rough: 0.45, clearcoat: 0.6, grimeBelow: 1.0, grimeAmount: 0.2, chips: 0.0 });
  const wood = paint({ key: 'loco-wood', color: c(0.36, 0.2, 0.09), rough: 0.55, clearcoat: 0.5, grimeBelow: 1.0, grimeAmount: 0.4 });
  const footplate = new THREE.MeshStandardMaterial({ color: c(0.18, 0.15, 0.12), roughness: 0.85, metalness: 0.2 });
  const brass = metal('brass', c(0.93, 0.70, 0.30), 0.24, 0.1);
  const copper = metal('copper', c(0.86, 0.45, 0.27), 0.3, 0.15);
  const steel = metal('steel', c(0.80, 0.80, 0.82), 0.2, 0.0);
  const iron = metal('iron', c(0.22, 0.22, 0.23), 0.5, 0.2);
  const coal = patch(new THREE.MeshStandardMaterial({ color: c(0.045, 0.045, 0.05), roughness: 0.55, metalness: 0.25 }), {
    key: 'coal',
    fragColor: 'diffuseColor.rgb *= 0.55 + 1.2 * heVNoise(vOPos * 22.0 + vRand * 10.0);',
    fragRough: 'roughnessFactor = clamp(0.35 + 0.5 * heVNoise(vOPos * 31.0), 0.2, 0.95);',
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: c(0.75, 0.88, 0.92), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.22,
    envMapIntensity: 1.4, depthWrite: false, side: THREE.DoubleSide,
  });
  const fire = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.38, 0.08), toneMapped: false });
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.5, 3.6, 1.6), toneMapped: false });
  const dial = new THREE.MeshStandardMaterial({ color: c(0.95, 0.93, 0.85), roughness: 0.4 });
  const leather = new THREE.MeshStandardMaterial({ color: c(0.12, 0.07, 0.05), roughness: 0.7 });
  return { green, black, red, cream, wood, footplate, brass, copper, steel, iron, coal, glass, fire, lamp, dial, leather };
}

export function makeCarriageMaterials(): TrainMaterials {
  const lake = paint({ key: 'coach-lake', color: c(0.30, 0.025, 0.04), rough: 0.34, clearcoat: 0.85, grimeBelow: 1.6, grimeAmount: 0.55, streaks: 0.5, chips: 0.25 });
  const cream = paint({ key: 'coach-cream', color: c(0.80, 0.70, 0.46), rough: 0.4, clearcoat: 0.7, grimeBelow: 2.6, grimeAmount: 0.35, streaks: 0.5, chips: 0.2 });
  const roof = paint({ key: 'coach-roof', color: c(0.68, 0.66, 0.60), rough: 0.7, clearcoat: 0.1, grimeBelow: 4.0, grimeAmount: 0.25, streaks: 0.6, chips: 0.1 });
  const under = paint({ key: 'coach-under', color: c(0.04, 0.04, 0.045), rough: 0.7, clearcoat: 0.0, grimeBelow: 1.2, grimeAmount: 0.1, chips: 0.1, streaks: 0.0 });
  const timber = paint({ key: 'coach-timber', color: c(0.30, 0.15, 0.06), rough: 0.5, clearcoat: 0.5, grimeBelow: 1.0, grimeAmount: 0.3 });
  const gold = metal('gold', c(0.95, 0.74, 0.25), 0.3, 0.05);
  const brass = metal('cbrass', c(0.93, 0.70, 0.30), 0.26, 0.1);
  const steel = metal('csteel', c(0.78, 0.78, 0.8), 0.22, 0.0);
  const iron = metal('ciron', c(0.18, 0.18, 0.19), 0.55, 0.25);
  const glass = new THREE.MeshPhysicalMaterial({
    color: c(0.80, 0.9, 0.9), roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.14,
    envMapIntensity: 1.5, depthWrite: false, side: THREE.DoubleSide,
  });
  const interior = patch(new THREE.MeshStandardMaterial({
    color: c(0.55, 0.38, 0.2), roughness: 0.8, emissive: new THREE.Color(1.0, 0.62, 0.26), emissiveIntensity: 1.1,
  }), {
    key: 'coach-interior',
    fragEmissive: /* glsl */ `
      float lampFall = 0.45 + 0.9 * smoothstep(0.0, 1.0, (vOPos.y - 1.0) / 2.5);
      float n = 0.8 + 0.4 * heVNoise(vOPos * 7.0);
      totalEmissiveRadiance *= lampFall * n;
    `,
  });
  const seat = new THREE.MeshStandardMaterial({ color: c(0.28, 0.06, 0.05), roughness: 0.9, emissive: new THREE.Color(0.55, 0.16, 0.06), emissiveIntensity: 0.55 });
  const lampGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 3.2, 1.4), toneMapped: false });
  const rubber = new THREE.MeshStandardMaterial({ color: c(0.03, 0.03, 0.03), roughness: 0.8 });
  const red = paint({ key: 'coach-red', color: c(0.5, 0.04, 0.03), rough: 0.45, clearcoat: 0.5, grimeBelow: 1.2, grimeAmount: 0.4 });
  const leather = new THREE.MeshStandardMaterial({ color: c(0.16, 0.08, 0.04), roughness: 0.7 });
  return { lake, cream, roof, under, timber, gold, brass, steel, iron, glass, interior, seat, lampGlow, rubber, red, leather };
}
