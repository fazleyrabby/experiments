import * as THREE from 'three';

// Shared wave field: the exact same Gerstner sum runs on the GPU (ocean shader)
// and on the CPU (ship buoyancy, spray, camera clamp), so ships ride the waves you see.

export const NW = 12;
const G = 9.81;

// [angle relative to wind (rad), wavelength (m), amplitude (m), phase]
const SPECS = [
  [0.00, 235, 3.40, 0.0],
  [0.28, 172, 2.50, 1.3],
  [-0.33, 138, 2.05, 2.1],
  [0.62, 104, 1.45, 4.0],
  [-0.71, 81, 1.10, 0.7],
  [0.15, 61, 0.80, 5.2],
  [-0.18, 46, 0.56, 3.3],
  [1.05, 34, 0.40, 1.9],
  [-1.10, 25, 0.29, 0.4],
  [0.48, 18, 0.19, 2.8],
  [-0.52, 13, 0.13, 4.6],
  [0.90, 9, 0.08, 1.1],
];

// Slow interference envelope: waves arrive in sets, with calmer stretches between them.
export function groups(x, z, t) {
  const a = Math.sin(x * 0.0036 + z * 0.0021 - t * 0.055);
  const b = Math.sin(-x * 0.0017 + z * 0.0039 + t * 0.041 + 1.3);
  return 0.62 + (0.5 + 0.5 * a) * (0.7 + 0.3 * b);
}

export class WaveField {
  constructor(windAngle) {
    this.windAngle = windAngle;
    this.dir = new THREE.Vector2(Math.cos(windAngle), Math.sin(windAngle));
    this.waves = SPECS.map(([a, lambda, amp, ph]) => {
      const ang = windAngle + a;
      const k = (2 * Math.PI) / lambda;
      return { dx: Math.cos(ang), dz: Math.sin(ang), k, A0: amp, A: amp, w: Math.sqrt(G * k), ph, lambda, Q: 0.8 };
    });
    this.uA = this.waves.map(() => new THREE.Vector4());
    this.uB = this.waves.map(() => new THREE.Vector4());

    // rogue wave packet: a localized wall travelling with the sea
    const lambda = 260, k = (2 * Math.PI) / lambda;
    this.rogue = {
      active: false, t0: 0, k, w: Math.sqrt(G * k), A: 0, Amax: 11, Q: 0.55,
      sigma: 150, lateral: 700, s0: -950, speed: 13.5, sc: -1e5,
      origin: new THREE.Vector2(), dir: this.dir.clone(),
    };
    this.uRogueA = new THREE.Vector4();
    this.uRogueB = new THREE.Vector4();
    this.uRogueC = new THREE.Vector4();
    this.intensity = 1;
    this.setIntensity(1);
    this.update(0);
  }

  setIntensity(v) {
    this.intensity = v;
    let sumKA = 0;
    for (const w of this.waves) { w.A = w.A0 * v; sumKA += w.k * w.A; }
    const Q = Math.min(1.0, 0.66 / sumKA);
    this.waves.forEach((w, i) => {
      w.Q = Q;
      this.uA[i].set(w.dx, w.dz, w.k, w.A);
      this.uB[i].set(w.w, w.ph, w.Q, w.lambda);
    });
  }

  // significant wave height of the sum (4 sigma)
  get Hs() {
    let s = 0;
    for (const w of this.waves) s += w.A * w.A * 0.5;
    return 4 * Math.sqrt(s);
  }

  triggerRogue(center, t) {
    const r = this.rogue;
    r.active = true; r.t0 = t; r.origin.copy(center);
  }

  update(t) {
    const r = this.rogue;
    if (r.active) {
      const e = t - r.t0;
      r.sc = r.s0 + r.speed * e;
      const ramp = THREE.MathUtils.smoothstep(e, 0, 10) * (1 - THREE.MathUtils.smoothstep(r.sc, 700, 1100));
      r.A = r.Amax * this.intensity * ramp;
      if (r.sc > 1100) { r.active = false; r.A = 0; }
    } else r.A = 0;
    this.uRogueA.set(r.dir.x, r.dir.y, r.k, r.A);
    this.uRogueB.set(r.w, r.sc, r.sigma, r.Q);
    this.uRogueC.set(r.origin.x, r.origin.y, r.lateral, 0);
  }

  // envelope of the rogue packet at a world point (0..1), for audio/HUD
  rogueEnvelope(x, z) {
    const r = this.rogue;
    if (r.A <= 0) return 0;
    const rx = x - r.origin.x, rz = z - r.origin.y;
    const s = rx * r.dir.x + rz * r.dir.y, l = -rx * r.dir.y + rz * r.dir.x;
    const u = (s - r.sc) / r.sigma, q = l / r.lateral;
    return Math.exp(-u * u - q * q) * (r.A / r.Amax);
  }

  // displacement of the undisplaced grid point (x0,z0). out = {x,y,z,jac}
  sample(x0, z0, t, out, wantJac = false) {
    let dx = 0, dy = 0, dz = 0, jxx = 1, jzz = 1, jxz = 0;
    const grp = groups(x0, z0, t);
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      const A = i >= 2 ? w.A * grp : w.A;
      const th = w.k * (w.dx * x0 + w.dz * z0) - w.w * t + w.ph;
      const s = Math.sin(th), c = Math.cos(th);
      const qa = w.Q * A;
      dx += qa * w.dx * c; dz += qa * w.dz * c; dy += A * s;
      if (wantJac) {
        const q = w.Q * w.k * A * s;
        jxx -= q * w.dx * w.dx; jzz -= q * w.dz * w.dz; jxz -= q * w.dx * w.dz;
      }
    }
    const r = this.rogue;
    if (r.A > 0) {
      const rx = x0 - r.origin.x, rz = z0 - r.origin.y;
      const sA = rx * r.dir.x + rz * r.dir.y, la = -rx * r.dir.y + rz * r.dir.x;
      const u = (sA - r.sc) / r.sigma, q = la / r.lateral;
      const E = Math.exp(-u * u - q * q);
      if (E > 1e-4) {
        const th = r.k * sA - r.w * t;
        const A = r.A * E, s = Math.sin(th), c = Math.cos(th);
        dy += A * s;
        dx += r.dir.x * r.Q * A * c; dz += r.dir.y * r.Q * A * c;
        if (wantJac) {
          const qq = r.Q * r.k * A * s;
          jxx -= qq * r.dir.x * r.dir.x; jzz -= qq * r.dir.y * r.dir.y; jxz -= qq * r.dir.x * r.dir.y;
        }
      }
    }
    out.x = dx; out.y = dy; out.z = dz;
    if (wantJac) out.jac = jxx * jzz - jxz * jxz;
    return out;
  }

  // surface height at world (x,z): invert the horizontal displacement by fixed-point iteration
  heightAt(x, z, t) {
    const o = this._o || (this._o = { x: 0, y: 0, z: 0, jac: 1 });
    let x0 = x, z0 = z;
    for (let i = 0; i < 3; i++) {
      this.sample(x0, z0, t, o);
      x0 = x - o.x; z0 = z - o.z;
    }
    this.sample(x0, z0, t, o);
    return o.y;
  }
}

// GLSL twin of WaveField
export const WAVE_GLSL = /* glsl */ `
#define NW ${NW}
uniform vec4 uWaveA[NW]; // dirX, dirZ, k, A
uniform vec4 uWaveB[NW]; // omega, phase, Q, wavelength
uniform vec4 uRogueA;    // dirX, dirZ, k, A
uniform vec4 uRogueB;    // omega, centre, sigma, Q
uniform vec4 uRogueC;    // originX, originZ, lateral, -
uniform float uTime;

float waveGroups(vec2 p) {
  float a = sin(p.x * 0.0036 + p.y * 0.0021 - uTime * 0.055);
  float b = sin(-p.x * 0.0017 + p.y * 0.0039 + uTime * 0.041 + 1.3);
  return 0.62 + (0.5 + 0.5 * a) * (0.7 + 0.3 * b);
}

vec3 waveDisp(vec2 p, float spacing) {
  vec3 d = vec3(0.0);
  float grp = waveGroups(p);
  for (int i = 0; i < NW; i++) {
    vec4 a = uWaveA[i]; vec4 b = uWaveB[i];
    float fade = clamp((b.w - 3.0 * spacing) / (3.0 * spacing), 0.0, 1.0);
    float A = a.w * fade * (i >= 2 ? grp : 1.0);
    float th = a.z * dot(a.xy, p) - b.x * uTime + b.y;
    float s = sin(th), c = cos(th);
    d.x += b.z * A * a.x * c;
    d.z += b.z * A * a.y * c;
    d.y += A * s;
  }
  if (uRogueA.w > 0.0) {
    vec2 dir = uRogueA.xy;
    vec2 rel = p - uRogueC.xy;
    float sA = dot(rel, dir), la = dot(rel, vec2(-dir.y, dir.x));
    float u = (sA - uRogueB.y) / uRogueB.z, q = la / uRogueC.z;
    float E = exp(-u * u - q * q);
    float th = uRogueA.z * sA - uRogueB.x * uTime;
    float A = uRogueA.w * E;
    d.y += A * sin(th);
    d.xz += dir * uRogueB.w * A * cos(th);
  }
  return d;
}

void waveNormal(vec2 p, float fw, out vec3 n, out float jac, out float rogueE) {
  float nx = 0.0, nz = 0.0, ny = 1.0, jxx = 1.0, jzz = 1.0, jxz = 0.0;
  float grp = waveGroups(p);
  for (int i = 0; i < NW; i++) {
    vec4 a = uWaveA[i]; vec4 b = uWaveB[i];
    float fade = clamp(b.w / (fw * 5.0) - 1.0, 0.0, 1.0);
    float A = a.w * fade * (i >= 2 ? grp : 1.0);
    float th = a.z * dot(a.xy, p) - b.x * uTime + b.y;
    float s = sin(th), c = cos(th);
    float wa = a.z * A;
    nx -= a.x * wa * c; nz -= a.y * wa * c; ny -= b.z * wa * s;
    jxx -= b.z * wa * a.x * a.x * s; jzz -= b.z * wa * a.y * a.y * s; jxz -= b.z * wa * a.x * a.y * s;
  }
  rogueE = 0.0;
  if (uRogueA.w > 0.0) {
    vec2 dir = uRogueA.xy; vec2 perp = vec2(-dir.y, dir.x);
    vec2 rel = p - uRogueC.xy;
    float sA = dot(rel, dir), la = dot(rel, perp);
    float u = (sA - uRogueB.y) / uRogueB.z, lq = la / uRogueC.z;
    float E = exp(-u * u - lq * lq);
    float k = uRogueA.z, A = uRogueA.w;
    float th = k * sA - uRogueB.x * uTime;
    float s = sin(th), c = cos(th);
    float dEds = E * (-2.0 * u / uRogueB.z);
    float dEdl = E * (-2.0 * lq / uRogueC.z);
    vec2 g = dir * A * (dEds * s + E * k * c) + perp * A * dEdl * s;
    nx -= g.x; nz -= g.y;
    float q = uRogueB.w * k * A * E * s;
    ny -= q;
    jxx -= q * dir.x * dir.x; jzz -= q * dir.y * dir.y; jxz -= q * dir.x * dir.y;
    rogueE = E * smoothstep(0.0, 1.0, A / 6.0) * max(s, 0.0);
  }
  n = normalize(vec3(nx, ny, nz));
  jac = jxx * jzz - jxz * jxz;
}
`;
