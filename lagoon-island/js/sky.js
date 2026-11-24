import * as THREE from 'three';
import { clamp, lerp, sstep } from './util.js';
import { WORLD } from './world.js';

const SKY_FRAG = /* glsl */ `
#define PI 3.14159265
varying vec3 vDir;
uniform vec3 uSun;
uniform float uNight;
uniform float uTime;
uniform sampler2D tNoise;
const float Re = 6360e3, Ra = 6420e3, Hr = 8e3, Hm = 1.25e3;
const vec3 bR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const vec3 bM = vec3(21e-6);

vec2 sph(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd), c = dot(ro, ro) - r * r, d = b * b - c;
  if (d < 0.0) return vec2(1e9, -1e9);
  d = sqrt(d);
  return vec2(-b - d, -b + d);
}

vec3 atmosphere(vec3 rd, vec3 s) {
  vec3 ro = vec3(0.0, Re + 2.0, 0.0);
  float tMax = sph(ro, rd, Ra).y;
  float dt = tMax / 10.0;
  vec3 sumR = vec3(0.0), sumM = vec3(0.0);
  float odR = 0.0, odM = 0.0;
  float mu = dot(rd, s);
  float pR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g = 0.76, g2 = g * g;
  float pM = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu * mu)) / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * mu, 1.5));
  for (int i = 0; i < 10; i++) {
    vec3 p = ro + rd * (float(i) + 0.5) * dt;
    float h = length(p) - Re;
    float hr = exp(-h / Hr) * dt, hm = exp(-h / Hm) * dt;
    odR += hr;
    odM += hm;
    vec2 ground = sph(p, s, Re);
    if (ground.x > 0.0) continue;
    float tl = sph(p, s, Ra).y, dl = tl / 4.0, lR = 0.0, lM = 0.0;
    for (int j = 0; j < 4; j++) {
      vec3 q = p + s * (float(j) + 0.5) * dl;
      float hl = length(q) - Re;
      lR += exp(-hl / Hr) * dl;
      lM += exp(-hl / Hm) * dl;
    }
    vec3 att = exp(-(bR * (odR + lR) + bM * 1.1 * (odM + lM)));
    sumR += att * hr;
    sumM += att * hm;
  }
  return 20.0 * (sumR * bR * pR + sumM * bM * pM);
}

void main() {
  vec3 d = normalize(vDir);
  vec3 up = vec3(d.x, max(abs(d.y), 0.012), d.z);
  up = normalize(up);
  vec3 col = atmosphere(up, uSun);

  vec3 nightSky = mix(vec3(0.012, 0.019, 0.042), vec3(0.0035, 0.006, 0.017), pow(clamp(up.y, 0.0, 1.0), 0.55));
  col = col * (1.0 - uNight) + nightSky * uNight;
  if (uNight > 0.01 && d.y > 0.0) {
    vec2 sp = d.xz / (abs(d.y) + 0.4);
    float star = texture2D(tNoise, sp * 17.0).a * texture2D(tNoise, sp * 29.0 + 0.3).g;
    col += vec3(0.8, 0.86, 1.0) * smoothstep(0.43, 0.5, star) * 0.16 * uNight;
    vec3 moon = normalize(vec3(-0.46, 0.68, 0.57));
    float md = dot(d, moon);
    col += vec3(0.65, 0.72, 0.9) * (smoothstep(0.9994, 0.9997, md) * 2.2 + pow(max(md, 0.0), 180.0) * 0.08) * uNight;
  }

  if (d.y > 0.0) {
    vec2 uv = d.xz / (d.y + 0.16);
    vec2 drift = vec2(uTime * 0.0016, uTime * 0.0007);
    float base = texture2D(tNoise, uv * 0.055 + drift).r * 0.62
      + texture2D(tNoise, uv * 0.14 - drift * 1.3).b * 0.28
      + texture2D(tNoise, uv * 0.39 + drift * 1.8).g * 0.1;
    float cloud = smoothstep(0.5, 0.72, base) * smoothstep(0.0, 0.16, d.y);
    float lit = clamp(0.5 + (texture2D(tNoise, (uv + uSun.xz * 0.5) * 0.055 + drift).r - base) * 5.0, 0.0, 1.0);
    float dayK = 1.0 - uNight;
    float sunLow = 1.0 - smoothstep(0.02, 0.5, uSun.y);
    vec3 bright = mix(vec3(1.3, 1.27, 1.22), vec3(1.55, 0.86, 0.46), sunLow);
    vec3 shade = mix(vec3(0.55, 0.62, 0.74), vec3(0.38, 0.27, 0.32), sunLow);
    vec3 cCol = mix(shade, bright, lit) * dayK + vec3(0.02, 0.027, 0.045) * uNight;
    col = mix(col, cCol, cloud * 0.82);
  }

  if (d.y < 0.0) {
    vec3 ground = mix(vec3(0.09, 0.105, 0.06), vec3(0.008, 0.012, 0.012), uNight);
    col = mix(col * 0.55, ground, smoothstep(0.0, 0.24, -d.y));
  }
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Everything that changes with the clock, from a 24h decimal hour. */
export function sunState(hour) {
  const th = ((hour - 6) / 12) * Math.PI;
  const sun = new THREE.Vector3(Math.cos(th), Math.sin(th) * 0.86, 0.52).normalize();
  const moon = new THREE.Vector3(-0.46, 0.68, 0.57).normalize();
  const day = sstep(-0.05, 0.1, sun.y);
  const night = 1 - sstep(-0.1, 0.035, sun.y);
  const warm = 1 - sstep(0.03, 0.56, sun.y);
  // Twilight lift: keeps the island readable while the sun hands over to the moon.
  const dusk = 4 * night * (1 - night);
  const sunRGB = mix3([1.0, 0.95, 0.86], [1.0, 0.5, 0.2], warm);
  // The key light fades fully out before it hands over from sun to moon, so shadows never pop.
  const useMoon = day <= 0.001;
  const light = useMoon ? moon : sun;
  const color = useMoon ? [0.46, 0.58, 0.95] : sunRGB;
  const intensity = useMoon ? 1.9 * sstep(0.74, 1, night) : 6.6 * day * lerp(1, 0.78, warm);
  const backTop = mix3(mix3([0.014, 0.017, 0.02], [0.015, 0.012, 0.013], warm), [0.0035, 0.005, 0.009], night);
  const backLow = mix3(mix3([0.052, 0.06, 0.062], [0.064, 0.041, 0.031], warm), [0.008, 0.013, 0.023], night);
  return {
    hour,
    sun,
    light,
    color: new THREE.Color(color[0], color[1], color[2]),
    intensity,
    day,
    night,
    warm,
    exposure: lerp(lerp(0.66, 0.94, warm), 1.5, night) * (1 + 0.42 * dusk),
    envIntensity: lerp(1.38, 1.5, night) * (1 + 1.1 * dusk),
    backTop: new THREE.Color(backTop[0], backTop[1], backTop[2]),
    backLow: new THREE.Color(backLow[0], backLow[1], backLow[2]),
    scatter: new THREE.Color().setRGB(...mix3(mix3([0.012, 0.125, 0.118], [0.03, 0.095, 0.072], warm), [0.003, 0.012, 0.02], night)),
    volume: lerp(lerp(0.028, 0.07, warm), 0.018, night),
  };
}

export class Sky {
  constructor(renderer, scene, U) {
    this.renderer = renderer;
    this.scene = scene;
    this.U = U;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.env = null;
    this.lastHour = -99;
    this.envStep = 0.06;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: {
        uSun: { value: new THREE.Vector3(0, 1, 0) },
        uNight: { value: 0 },
        uTime: U.uTime,
        tNoise: U.tNoise,
      },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });

    // Sky dome is visible only to the mirrored water camera.
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(100, 40, 24), this.mat);
    this.dome.layers.set(2);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -10;
    scene.add(this.dome);

    this.envScene = new THREE.Scene();
    const envMesh = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 20), this.mat);
    envMesh.frustumCulled = false;
    this.envScene.add(envMesh);

    // Studio backdrop and table: what the diorama sits in.
    this.backMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color() }, uLow: { value: new THREE.Color() } },
      vertexShader: /* glsl */ `
        varying vec3 vD;
        void main() {
          vD = normalize(position);
          vec4 p = projectionMatrix * mat4(mat3(viewMatrix)) * vec4(position, 1.0);
          gl_Position = p.xyww;
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vD;
        uniform vec3 uTop, uLow;
        void main() {
          float h = clamp(vD.y * 1.7 + 0.12, 0.0, 1.0);
          vec3 c = mix(uLow, uTop, pow(h, 0.62));
          gl_FragColor = vec4(c, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
    });
    this.back = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 18), this.backMat);
    this.back.layers.set(3);
    this.back.frustumCulled = false;
    this.back.renderOrder = -10;
    scene.add(this.back);

    const tableMat = new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 0.92 });
    tableMat.onBeforeCompile = (s) => {
      s.uniforms.uTop = this.backMat.uniforms.uTop;
      s.uniforms.uLow = this.backMat.uniforms.uLow;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTW;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvTW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTW; uniform vec3 uTop, uLow;')
        .replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
           float tR = length(vTW.xz);
           float contact = smoothstep(${(WORLD.R + 0.3).toFixed(2)}, ${(WORLD.R + 4.2).toFixed(2)}, tR);
           gl_FragColor.rgb *= mix(0.2, 1.0, contact);
           vec3 tableView = normalize(vTW - cameraPosition);
           vec3 backdrop = mix(uLow, uTop, pow(clamp(tableView.y * 1.7 + 0.12, 0.0, 1.0), 0.62));
           gl_FragColor.rgb = mix(gl_FragColor.rgb, backdrop, smoothstep(22.0, 58.0, tR));`,
        );
    };
    tableMat.customProgramCacheKey = () => 'table';
    this.table = new THREE.Mesh(new THREE.CircleGeometry(115, 72), tableMat);
    this.table.rotation.x = -Math.PI / 2;
    this.table.position.y = WORLD.base;
    this.table.receiveShadow = true;
    this.table.layers.set(3);
    scene.add(this.table);
  }

  update(state, force = false) {
    this.mat.uniforms.uSun.value.copy(state.sun);
    this.mat.uniforms.uNight.value = clamp(state.night);
    this.backMat.uniforms.uTop.value.copy(state.backTop);
    this.backMat.uniforms.uLow.value.copy(state.backLow);
    if (!force && Math.abs(state.hour - this.lastHour) < this.envStep) return;
    this.lastHour = state.hour;
    const next = this.pmrem.fromScene(this.envScene, 0.015, 0.1, 100);
    this.scene.environment = next.texture;
    if (this.env) this.env.dispose();
    this.env = next;
  }
}
