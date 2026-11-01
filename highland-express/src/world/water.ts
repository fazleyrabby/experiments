import * as THREE from 'three';
import { Landscape } from './landscape';
import { SUN_DIR } from './layout';
import { shared } from '../core/shaders';

const vert = /* glsl */ `
attribute float aLat;     // -1..1 across the channel
attribute float aAlong;   // metres along the flow
attribute float aSlope;   // |dy/ds| of the bed (0 flat, ~1 waterfall)
attribute float aWide;    // channel half width
varying float vLat; varying float vAlong; varying float vSlope; varying float vWide;
varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vLat = aLat; vAlong = aAlong; vSlope = aSlope; vWide = aWide;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const frag = /* glsl */ `
uniform float uTime;
uniform vec3 uSun;
varying float vLat; varying float vAlong; varying float vSlope; varying float vWide;
varying vec3 vWorld;
#include <fog_pars_fragment>

float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.07 + 4.3; a *= 0.5; } return s; }

vec3 skyCol(vec3 d){
  float h = clamp(d.y, 0.0, 1.0);
  vec3 horizon = vec3(0.62, 0.66, 0.70), mid = vec3(0.17, 0.33, 0.62), zen = vec3(0.045, 0.13, 0.36);
  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.3, h));
  c = mix(c, zen, smoothstep(0.22, 0.95, h));
  float sd = max(dot(d, uSun), 0.0);
  c += vec3(1.0, 0.52, 0.2) * pow(sd, 6.0) * exp(-abs(d.y) * 5.5) * 0.9;
  c += vec3(1.0, 0.75, 0.45) * pow(sd, 90.0) * 1.2;
  return c;
}

void main(){
  float steep = smoothstep(0.08, 0.5, vSlope);
  float speed = 1.2 + vSlope * 9.0;
  // flow-aligned coordinates (metres)
  vec2 q = vec2(vLat * vWide * 0.9, vAlong * (0.55 - 0.25 * steep) - uTime * speed * 0.5);
  float n1 = fbm(q * vec2(1.3, 0.6));
  float n2 = fbm(q * vec2(3.1, 1.4) + 9.0);
  float n3 = vn(q * vec2(7.0, 2.5) + 31.0);
  float eps = 0.06;
  float hx = fbm((q + vec2(eps, 0.0)) * vec2(1.3, 0.6)) - n1;
  float hz = fbm((q + vec2(0.0, eps)) * vec2(1.3, 0.6)) - n1;
  vec3 N = normalize(vec3(-hx * 6.0 * (1.0 + steep * 1.5), 1.0, -hz * 6.0));
  // world normal ~ up (river is nearly level except at falls); tilt along flow for falls
  N = normalize(vec3(N.x, N.y, N.z - steep * 0.5));
  vec3 V = normalize(cameraPosition - vWorld);
  float fres = 0.025 + 0.975 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y);
  vec3 refl = skyCol(normalize(R));
  // body colour: peat-stained teal, lighter over shallow edges
  float edge = smoothstep(0.35, 1.0, abs(vLat));
  vec3 deep = vec3(0.012, 0.045, 0.045);
  vec3 shallow = vec3(0.07, 0.11, 0.075);
  vec3 body = mix(deep, shallow, edge * 0.8 + n2 * 0.25);
  // subsurface-ish glow on ripples facing the sun
  body += vec3(0.02, 0.05, 0.04) * smoothstep(0.5, 0.9, n1) * 0.7;
  vec3 col = mix(body, refl, clamp(fres + 0.06, 0.0, 1.0));
  // sun glints
  vec3 H = normalize(uSun + V);
  float spec = pow(max(dot(N, H), 0.0), 380.0);
  col += vec3(1.0, 0.82, 0.55) * spec * 4.0 * (1.0 - steep * 0.5);
  // foam: channel edges, rapids and falls
  float foamEdge = smoothstep(0.84, 1.0, abs(vLat) + (n2 - 0.5) * 0.45) * 0.3;
  float streak = smoothstep(0.42, 0.78, fbm(vec2(vLat * vWide * 2.2, vAlong * 0.12 - uTime * speed * 0.18)) + n3 * 0.25);
  float foam = clamp(foamEdge + steep * (0.45 + streak * 0.7) + smoothstep(0.03, 0.12, vSlope) * streak * 0.45, 0.0, 1.0);
  col = mix(col, vec3(0.88, 0.92, 0.95), foam * 0.88);
  float alpha = (1.0 - smoothstep(0.82, 1.0, abs(vLat))) * mix(0.92, 1.0, foam);
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

export class Water {
  readonly group = new THREE.Group();
  readonly material: THREE.ShaderMaterial;
  /** top of the main falls (for spray emitters / audio) */
  readonly fallsBase = new THREE.Vector3();
  readonly fallsTop = new THREE.Vector3();
  readonly rapids = new THREE.Vector3();

  constructor(private land: Landscape) {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: shared.uTime, uSun: { value: SUN_DIR.clone() } }]),
      transparent: true,
      depthWrite: false,
      fog: true,
      side: THREE.DoubleSide,
    });
    this.material.uniforms.uTime = shared.uTime;

    const R = land.river.filter((s) => s.z > -356 && s.z < 1500);
    const n = R.length;
    const pos: number[] = [], lat: number[] = [], along: number[] = [], slope: number[] = [], wide: number[] = [];
    const idx: number[] = [];
    let dist = 0;
    const tmpT = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = R[Math.max(0, i - 1)], b = R[Math.min(n - 1, i + 1)];
      tmpT.set(b.x - a.x, 0, b.z - a.z).normalize();
      const nx = -tmpT.z, nz = tmpT.x;
      if (i > 0) dist += Math.hypot(R[i].x - R[i - 1].x, R[i].z - R[i - 1].z);
      const dy = (b.y - a.y) / Math.max(0.01, Math.hypot(b.x - a.x, b.z - a.z));
      const sl = Math.abs(dy);
      for (const side of [-1, 1]) {
        const w = R[i].w * (1 + 0.25 * Math.min(1, sl * 4)) + 0.4;
        const px = R[i].x + nx * w * side, pz = R[i].z + nz * w * side;
        pos.push(px, R[i].y, pz);
        lat.push(side);
        along.push(dist);
        slope.push(sl);
        wide.push(w);
      }
      if (i < n - 1) {
        const k = i * 2;
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aLat', new THREE.Float32BufferAttribute(lat, 1));
    g.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
    g.setAttribute('aSlope', new THREE.Float32BufferAttribute(slope, 1));
    g.setAttribute('aWide', new THREE.Float32BufferAttribute(wide, 1));
    g.setIndex(idx);
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, this.material);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    this.group.add(mesh);

    const at = (z: number) => R.reduce((p, c) => (Math.abs(c.z - z) < Math.abs(p.z - z) ? c : p));
    const base = at(-318), top = at(-350), rap = at(-139);
    this.fallsBase.set(base.x, base.y + 0.3, base.z);
    this.fallsTop.set(top.x, top.y, top.z);
    this.rapids.set(rap.x, rap.y, rap.z);
  }
}
