import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { patch } from '../core/shaders';
import { prep, Bag } from './geo';
import { buildWheelset, WheelSpec } from './wheels';

const c = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

export interface PackPart {
  geo: THREE.BufferGeometry;
  color: THREE.Color;
  metal: number;
  rough: number;
}

/** Merge parts into one geometry carrying vertex colour + per-vertex (metalness, roughness). */
export function packGeometry(parts: PackPart[]): THREE.BufferGeometry {
  const gs: THREE.BufferGeometry[] = [];
  for (const p of parts) {
    const g = prep(p.geo);
    g.deleteAttribute('uv');
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3), pbr = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      col[i * 3] = p.color.r; col[i * 3 + 1] = p.color.g; col[i * 3 + 2] = p.color.b;
      pbr[i * 2] = p.metal; pbr[i * 2 + 1] = p.rough;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aPbr', new THREE.BufferAttribute(pbr, 2));
    gs.push(g);
  }
  const out = mergeGeometries(gs, false)!;
  for (const g of gs) g.dispose();
  out.computeBoundingSphere();
  return out;
}

let packedMat: THREE.MeshPhysicalMaterial | null = null;
/** One material for every packed (vertex-coloured) mechanical part. */
export function packedMaterial(): THREE.MeshPhysicalMaterial {
  if (packedMat) return packedMat;
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide, envMapIntensity: 1.1, clearcoat: 0.25, clearcoatRoughness: 0.3,
  });
  packedMat = patch(m, {
    key: 'packed',
    vertDecl: 'attribute vec2 aPbr; varying vec2 vPbr;',
    vertMain: 'vPbr = aPbr;',
    fragDecl: 'varying vec2 vPbr;',
    fragColor: /* glsl */ `
      float pn = heFbm(vOPos * 9.0);
      float pg = 1.0 - smoothstep(0.0, 0.5, vOPos.y + 0.5);
      diffuseColor.rgb *= 0.82 + 0.3 * pn;
      diffuseColor.rgb *= 1.0 - 0.25 * pg * heVNoise(vOPos * 5.0);
    `,
    fragMetal: 'metalnessFactor = vPbr.x;',
    fragRough: 'roughnessFactor = clamp(vPbr.y + (heFbm(vOPos * 14.0) - 0.5) * 0.18, 0.1, 1.0);',
  });
  return packedMat;
}

export const STEEL = c(0.78, 0.78, 0.80);
export const STEEL_DARK = c(0.42, 0.42, 0.44);
export const BRASS = c(0.93, 0.70, 0.30);

/** Build a wheelset geometry (tyre + painted centre + axle + brass) in a single packed mesh. */
export function packWheelset(spec: WheelSpec, paint: THREE.Color, extra: PackPart[] = []): THREE.BufferGeometry {
  const bag: Bag = buildWheelset(spec);
  const parts: PackPart[] = [];
  const add = (k: string, color: THREE.Color, metal: number, rough: number) => {
    const g = bag.merged(k);
    if (g) parts.push({ geo: g, color, metal, rough });
  };
  add('wbody', paint, 0.05, 0.42);
  add('tyre', STEEL, 1.0, 0.22);
  add('axle', STEEL_DARK, 1.0, 0.38);
  add('brass', BRASS, 1.0, 0.3);
  return packGeometry([...parts, ...extra]);
}

/**
 * Draws many copies of one geometry whose transforms live on scene-graph nodes
 * (wheels, rods, whole carriages). `update` copies the nodes' world matrices.
 */
export class InstBatch {
  readonly mesh: THREE.InstancedMesh;
  constructor(geo: THREE.BufferGeometry, mat: THREE.Material, readonly nodes: THREE.Object3D[], shadows = true) {
    this.mesh = new THREE.InstancedMesh(geo, mat, nodes.length);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = shadows;
    this.mesh.receiveShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }
  update() {
    const m = this.mesh;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      n.updateWorldMatrix(true, false);
      m.setMatrixAt(i, n.matrixWorld);
    }
    m.instanceMatrix.needsUpdate = true;
  }
}
