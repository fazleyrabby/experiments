import * as THREE from 'three';
import { SUN_DIR } from '../world/layout';

export interface PuffConfig {
  max: number;
  /** base colours: lit / shadow side */
  lit: THREE.Color;
  shade: THREE.Color;
  opacity: number;
  /** vertical buoyancy (m/s^2) */
  buoyancy: number;
  drag: number;
  /** size multiplier curve: size(t) = size0 + (size1 - size0) * pow(t, growthPow) */
  growthPow: number;
  turbulence: number;
  /** soft fade-in fraction of life */
  fadeIn: number;
  /** darkening with age (smoke) or lightening */
  ageTint: THREE.Color;
  /** cheap shading for huge, faint puffs (mist) */
  simple?: boolean;
}

const vert = /* glsl */ `
attribute vec3 aPos;
attribute vec4 aData;   // x: age01, y: size, z: seed, w: opacity
attribute vec2 aRot;    // x: rotation, y: tint seed
varying vec2 vUv; varying float vAge; varying float vSeed; varying float vOpac; varying float vTint;
varying vec3 vSunView;
uniform vec3 uSunView;
#include <fog_pars_vertex>
void main(){
  vUv = position.xy * 2.0;
  vAge = aData.x; vSeed = aData.z; vOpac = aData.w; vTint = aRot.y;
  vSunView = uSunView;
  vec4 mvPosition = viewMatrix * vec4(aPos, 1.0);
  float c = cos(aRot.x), s = sin(aRot.x);
  vec2 q = vec2(c * position.x - s * position.y, s * position.x + c * position.y) * aData.y;
  mvPosition.xy += q;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const frag = /* glsl */ `
uniform vec3 uLit; uniform vec3 uShade; uniform vec3 uAgeTint;
uniform float uOpacity; uniform float uFadeIn; uniform float uSimple;
varying vec2 vUv; varying float vAge; varying float vSeed; varying float vOpac; varying float vTint;
varying vec3 vSunView;
#include <fog_pars_fragment>
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for(int i=0;i<4;i++){ s += a*vn(p); p = p*2.1 + 3.7; a *= 0.5; } return s; }
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  if (uSimple > 0.5) {
    float soft = (1.0 - r2) * (1.0 - r2);
    float nn = vn(vUv * 1.3 + vSeed * 31.0);
    float a = soft * (0.55 + 0.6 * nn) * pow(1.0 - vAge, 1.2) * smoothstep(0.0, uFadeIn, vAge) * vOpac * uOpacity;
    if (a < 0.002) discard;
    float lit = clamp(dot(normalize(vec3(vUv, 0.6)), normalize(vSunView)) * 0.5 + 0.55, 0.0, 1.0);
    gl_FragColor = vec4(mix(uShade, uLit, lit), a);
    #include <fog_fragment>
    return;
  }
  vec2 p = vUv * 1.7 + vec2(vSeed * 17.0, vSeed * 5.0);
  float n = fbm(p + vAge * 0.8);
  float n2 = fbm(p * 2.3 - 4.0 - vAge * 0.4);
  float body = smoothstep(1.0, 0.15, r2 + (n - 0.5) * 0.95 + (n2 - 0.5) * 0.4 + vAge * 0.35);
  float alpha = body * pow(1.0 - vAge, 1.35) * vOpac * uOpacity;
  alpha *= smoothstep(0.0, uFadeIn, vAge);
  if (alpha < 0.003) discard;
  // fake sphere normal in view space for sun shading
  vec3 N = normalize(vec3(vUv, sqrt(max(0.0, 1.0 - r2))));
  float lit = clamp(dot(N, normalize(vSunView)) * 0.55 + 0.5, 0.0, 1.0);
  lit = mix(lit, 0.75, 0.25 * (n - 0.5) + 0.2);
  vec3 col = mix(uShade, uLit, lit);
  col = mix(col, col * uAgeTint, smoothstep(0.0, 1.0, vAge) * 0.8);
  col *= 0.88 + 0.24 * vTint;
  // warm rim where the sun grazes the puff edge
  col += vec3(1.0, 0.7, 0.4) * pow(1.0 - r2, 2.0) * lit * 0.08;
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

interface P {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  age: number; life: number;
  s0: number; s1: number; rot: number; spin: number; seed: number; op: number; tint: number;
  alive: boolean;
}

/** Camera-facing soft billboard puffs (smoke / steam / mist), CPU-simulated, depth-sorted. */
export class PuffSystem {
  readonly mesh: THREE.Mesh;
  private ps: P[];
  private n = 0;
  private cursor = 0;
  private geo: THREE.InstancedBufferGeometry;
  private aPos: THREE.InstancedBufferAttribute;
  private aData: THREE.InstancedBufferAttribute;
  private aRot: THREE.InstancedBufferAttribute;
  private order: number[] = [];
  private depth: Float32Array;
  readonly uniforms: Record<string, THREE.IUniform>;
  wind = new THREE.Vector3(1.4, 0.0, 0.8);

  constructor(private cfg: PuffConfig) {
    this.ps = Array.from({ length: cfg.max }, () => ({
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 1, s0: 1, s1: 1, rot: 0, spin: 0, seed: 0, op: 1, tint: 0, alive: false,
    }));
    this.depth = new Float32Array(cfg.max);
    const base = new THREE.PlaneGeometry(1, 1);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute('position', base.attributes.position);
    this.geo.setAttribute('uv', base.attributes.uv);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(cfg.max * 3), 3);
    this.aData = new THREE.InstancedBufferAttribute(new Float32Array(cfg.max * 4), 4);
    this.aRot = new THREE.InstancedBufferAttribute(new Float32Array(cfg.max * 2), 2);
    for (const a of [this.aPos, this.aData, this.aRot]) a.setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('aPos', this.aPos);
    this.geo.setAttribute('aData', this.aData);
    this.geo.setAttribute('aRot', this.aRot);
    this.geo.instanceCount = 0;
    this.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uLit: { value: cfg.lit },
        uShade: { value: cfg.shade },
        uAgeTint: { value: cfg.ageTint },
        uOpacity: { value: cfg.opacity },
        uFadeIn: { value: cfg.fadeIn },
        uSimple: { value: cfg.simple ? 1 : 0 },
        uSunView: { value: new THREE.Vector3() },
      },
    ]);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    this.mesh = new THREE.Mesh(this.geo, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;
  }

  emit(
    x: number, y: number, z: number, vx: number, vy: number, vz: number,
    size0: number, size1: number, life: number, opacity = 1, spin = 0.3, age0 = 0,
  ) {
    let tries = 0;
    let i = this.cursor;
    while (this.ps[i].alive && tries < this.cfg.max) {
      i = (i + 1) % this.cfg.max;
      tries++;
    }
    if (tries >= this.cfg.max) i = this.cursor; // overwrite the oldest-ish slot
    this.cursor = (i + 1) % this.cfg.max;
    const p = this.ps[i];
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz;
    p.age = age0; p.life = life; p.s0 = size0; p.s1 = size1;
    p.rot = Math.random() * 6.283; p.spin = (Math.random() - 0.5) * spin * 2;
    p.seed = Math.random(); p.op = opacity; p.tint = Math.random();
    p.alive = true;
  }

  get count() {
    return this.n;
  }

  update(dt: number, camera: THREE.Camera, time: number) {
    const cfg = this.cfg;
    const cp = camera.position;
    const sunV = new THREE.Vector3().copy(SUN_DIR).transformDirection(camera.matrixWorldInverse);
    (this.uniforms.uSunView.value as THREE.Vector3).copy(sunV);
    let n = 0;
    const ord = this.order;
    ord.length = 0;
    for (let i = 0; i < cfg.max; i++) {
      const p = this.ps[i];
      if (!p.alive) continue;
      p.age += dt / p.life;
      if (p.age >= 1) {
        p.alive = false;
        continue;
      }
      // integrate
      const k = Math.exp(-cfg.drag * dt);
      const t = p.age;
      const turb = cfg.turbulence;
      const wx = this.wind.x + Math.sin(time * 0.7 + p.y * 0.35 + p.seed * 9.0) * turb;
      const wz = this.wind.z + Math.cos(time * 0.6 + p.x * 0.3 + p.seed * 5.0) * turb;
      p.vx = (p.vx - wx) * k + wx;
      p.vz = (p.vz - wz) * k + wz;
      p.vy = p.vy * k + cfg.buoyancy * dt * (1 - 0.5 * t);
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.rot += p.spin * dt;
      ord.push(i);
      this.depth[i] = (p.x - cp.x) * (p.x - cp.x) + (p.y - cp.y) * (p.y - cp.y) + (p.z - cp.z) * (p.z - cp.z);
    }
    ord.sort((a, b) => this.depth[b] - this.depth[a]);
    const aPos = this.aPos.array as Float32Array, aData = this.aData.array as Float32Array, aRot = this.aRot.array as Float32Array;
    for (const i of ord) {
      const p = this.ps[i];
      const size = p.s0 + (p.s1 - p.s0) * Math.pow(p.age, cfg.growthPow);
      aPos[n * 3] = p.x; aPos[n * 3 + 1] = p.y; aPos[n * 3 + 2] = p.z;
      aData[n * 4] = p.age; aData[n * 4 + 1] = size; aData[n * 4 + 2] = p.seed; aData[n * 4 + 3] = p.op;
      aRot[n * 2] = p.rot; aRot[n * 2 + 1] = p.tint;
      n++;
    }
    this.n = n;
    this.geo.instanceCount = n;
    this.aPos.needsUpdate = true;
    this.aData.needsUpdate = true;
    this.aRot.needsUpdate = true;
  }
}

/** Floating dust / pollen motes lit by the low sun, wrapped around the camera. */
export class Motes {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private seeds: Float32Array;
  private n: number;
  private u = { uTime: { value: 0 }, uSun: { value: SUN_DIR.clone() }, uSize: { value: 1 } };

  constructor(n = 700, private radius = 38) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.seeds = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 2 * radius;
      this.pos[i * 3 + 1] = (Math.random() - 0.5) * 2 * radius * 0.6;
      this.pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * radius;
      this.seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(this.seeds, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: this.u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uSize;
        varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float d = -mv.z;
          gl_PointSize = uSize * (2.0 + 2.5 * aSeed) * (260.0 / max(d, 1.0)) * 0.5;
          float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
          vA = tw * smoothstep(60.0, 8.0, d) * smoothstep(0.5, 3.0, d);
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          float a = smoothstep(1.0, 0.0, r);
          gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a * vA * 0.9, a * vA);
        }`,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    this.points.renderOrder = 11;
  }

  update(dt: number, camPos: THREE.Vector3, time: number) {
    this.u.uTime.value = time;
    const out = this.points.geometry.attributes.position.array as Float32Array;
    const r = this.radius;
    const rr = r * 2;
    for (let i = 0; i < this.n; i++) {
      const s = this.seeds[i];
      this.pos[i * 3] += Math.sin(time * 0.3 + s * 20) * 0.12 * dt + 0.35 * dt;
      this.pos[i * 3 + 1] += (Math.sin(time * 0.4 + s * 11) * 0.15 + 0.02) * dt;
      this.pos[i * 3 + 2] += Math.cos(time * 0.25 + s * 7) * 0.12 * dt + 0.2 * dt;
      for (let k = 0; k < 3; k++) {
        const c = camPos.getComponent(k) ;
        let v = this.pos[i * 3 + k] - c;
        const lim = k === 1 ? r * 0.6 : r;
        const ww = lim * 2;
        v = ((((v + lim) % ww) + ww) % ww) - lim;
        this.pos[i * 3 + k] = c + v;
        out[i * 3 + k] = c + v;
      }
    }
    void rr;
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
