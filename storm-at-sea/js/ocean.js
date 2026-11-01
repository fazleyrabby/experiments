import * as THREE from 'three';
import { WAVE_GLSL } from './waves.js';

// Radial grid centred on the camera: dense near the viewer, sparse toward the horizon.
function polarGrid(rings, segs, radius, power) {
  const pos = [0, 0, 0];
  for (let i = 1; i <= rings; i++) {
    const r = radius * Math.pow(i / rings, power);
    for (let j = 0; j < segs; j++) {
      const a = (j / segs) * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  }
  const idx = [];
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a0 = 1 + (i - 1) * segs, b0 = 1 + i * segs;
    for (let j = 0; j < segs; j++) {
      const j1 = (j + 1) % segs;
      idx.push(a0 + j, a0 + j1, b0 + j);
      idx.push(a0 + j1, b0 + j1, b0 + j);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

const vert = /* glsl */ `
${WAVE_GLSL}
uniform vec2 uCenter;
uniform vec2 uGrid; // radial spacing coefficient, tangential spacing (rad)
varying vec3 vWorld;
varying vec2 vP0;
void main() {
  vec2 p0 = position.xz + uCenter;
  float r = length(position.xz);
  float spacing = max(uGrid.x * pow(r + 1.0, 0.583), uGrid.y * r);
  vec3 d = waveDisp(p0, spacing);
  vec3 w = vec3(p0.x + d.x, d.y, p0.y + d.z);
  vWorld = w;
  vP0 = p0;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}
`;

const frag = /* glsl */ `
${WAVE_GLSL}
uniform sampler2D uNormalMap, uFoamMap;
uniform vec3 uDeep, uScatter, uFoamCol, uSkyTop, uSkyHorizon, uAmbient, uFogColor;
uniform vec3 uFlashColor, uFlashDir, uFlashPos, uKeyDir, uKeyColor;
uniform float uFlash, uFogDensity, uStorm, uSunVis, uCover;
#ifndef NPT
#define NPT 8
#endif
uniform vec3 uPtPos[8];
uniform vec3 uPtCol[8];
uniform vec2 uWindDir;
uniform vec4 uShips[3];
uniform vec4 uShipDims[3];
varying vec3 vWorld;
varying vec2 vP0;

float shipFoam(vec2 p, out float hullMask) {
  float f = 0.0;
  hullMask = 0.0;
  for (int i = 0; i < 3; i++) {
    vec4 s = uShips[i]; vec4 d = uShipDims[i];
    if (d.z < 0.5) continue;
    vec2 r = p - s.xy;
    float c = cos(s.z), sn = sin(s.z);
    float lx = r.x * c - r.y * sn;
    float lz = r.x * sn + r.y * c;
    float hl = d.x, hb = d.y;
    float taper = max(0.0, (lx - hl * 0.38) / (hl * 0.62));
    float hullW = hb * max(0.0, 1.0 - pow(taper, 1.8));
    float stern = max(0.0, (-lx - hl * 0.8) / (hl * 0.2));
    hullW *= 1.0 - 0.3 * stern;
    float side = abs(lz) - hullW;
    // hull wash fades in and out along the hull, no hard cut-offs
    float win = smoothstep(-hl - 14.0, -hl + 4.0, lx) * smoothstep(hl + 22.0, hl - 2.0, lx);
    if (win > 0.0) {
      float bow = smoothstep(-hl * 0.2, hl, lx);
      float w = 2.0 + bow * (3.0 + 4.5 * uStorm);
      f += exp(-max(side, 0.0) / w) * smoothstep(-3.0, 0.0, side) * (0.3 + bow * 0.7) * win;
      hullMask = max(hullMask, smoothstep(0.5, -1.5, side) * win);
    }
    float back = -(lx + hl);
    float ws = smoothstep(-8.0, 12.0, back);
    if (ws > 0.0) {
      back = max(back, 0.0);
      float w = hb * 0.65 + back * 0.05;
      f += exp(-pow(lz / w, 2.0)) * exp(-back / 650.0) * 1.1 * ws;
      float arm = abs(abs(lz) - (hb * 0.7 + back * 0.354));
      f += exp(-arm / (3.0 + back * 0.02)) * exp(-back / 300.0) * 0.7 * ws;
    }
  }
  return f;
}

void main() {
  vec3 V = cameraPosition - vWorld;
  float dist = length(V);
  V /= dist;
  float fw = length(fwidth(vP0)) + 1e-3;

  vec3 n; float jac; float rogueE;
  waveNormal(vP0, fw, n, jac, rogueE);

  // capillary / wind chop detail
  vec2 wt = uWindDir * uTime;
  vec2 d1 = texture2D(uNormalMap, vP0 / 61.0 + wt * 0.006).xy * 2.0 - 1.0;
  vec2 d2 = texture2D(uNormalMap, vP0 / 23.0 + vec2(-wt.y, wt.x) * 0.011 + 0.37).xy * 2.0 - 1.0;
  vec2 det = d1 * 0.55 + d2 * 0.42;
#ifdef WATER_DETAIL
  vec2 d3 = texture2D(uNormalMap, vP0 / 7.5 + wt * 0.045 + 0.71).xy * 2.0 - 1.0;
  det += d3 * 0.32 * clamp(1.0 - dist / 350.0, 0.0, 1.0);
#endif
  // gusts roughen some patches and leave others glassy, so the reflection breaks up
  float gust = texture2D(uFoamMap, vP0 / 950.0 + wt * 0.0009).g;
  float rough = mix(0.5, 1.5, smoothstep(0.3, 0.72, gust));
  float detAmt = (0.18 + 0.22 * uStorm) * rough / (1.0 + dist * 0.002);
  n = normalize(n + vec3(det.x, 0.0, det.y) * detAmt);

  float NdV = max(dot(n, V), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - NdV, 5.0);
  fres = min(fres, 0.8);

  vec3 R = reflect(-V, n);
  R.y = abs(R.y);
  vec3 sky = mix(uSkyHorizon, uSkyTop, pow(R.y, 0.5));
  float gapR = pow(max(dot(normalize(R.xz + 1e-4), normalize(uKeyDir.xz)), 0.0), 6.0) * exp(-R.y * 8.0);
  sky += uKeyColor * gapR * 0.6;
  // clouds mirrored in the water
  vec2 cuv = R.xz / (R.y + 0.12) * 0.45 + uWindDir * uTime * 0.004;
  float cl = texture2D(uFoamMap, cuv * 0.16).g * 0.62 + texture2D(uFoamMap, cuv * 0.47 + 0.3).g * 0.38;
  float cd = smoothstep(mix(0.72, 0.3, uCover), 0.88, cl) * smoothstep(0.0, 0.18, R.y);
  vec3 cloudC = mix(uSkyHorizon * 0.9, uKeyColor * 0.85 + uSkyHorizon * 0.45, uSunVis * 0.65);
  sky = mix(sky, cloudC, cd * 0.75);
  float fd = max(dot(R, uFlashDir), 0.0);
  sky += uFlashColor * uFlash * (0.22 + pow(fd, 10.0) * 2.2);

  float hgt = vWorld.y;
  float crest = smoothstep(-2.0, 8.5 * uStorm, hgt);
  vec3 lightAmt = uAmbient + uFlashColor * uFlash * 0.3;
  vec3 body = uDeep * (lightAmt * 2.6 + 0.004);
  float thin = pow(1.0 - NdV, 2.0);
  vec3 sss = uScatter * lightAmt * crest * (0.35 + thin * 1.1);
  float back = pow(max(dot(-V, normalize(vec3(uKeyDir.x, -0.2, uKeyDir.z))), 0.0), 3.0);
  sss += uScatter * uKeyColor * back * crest * 1.4;
  sss += uScatter * uFlashColor * uFlash * crest * 0.8;

  vec3 col = mix(body + sss, sky, fres);

  vec3 H = normalize(uKeyDir + V);
  // sun/moon glitter: strong only when the sky is actually open, and capped so bloom can't wash the frame
  float open = uSunVis * (1.0 - 0.85 * uCover);
  vec3 glint = uKeyColor * (pow(max(dot(n, H), 0.0), 260.0) * (0.6 + 4.0 * open) + pow(max(dot(n, H), 0.0), 36.0) * 0.08 * open);
  col += min(glint, vec3(2.5));
  // ship lights glinting on the swell
  for (int i = 0; i < NPT; i++) {
    vec3 lc = uPtCol[i];
    if (lc.r + lc.g + lc.b < 0.001) continue;
    vec3 Lp = uPtPos[i] - vWorld;
    float ld = length(Lp);
    vec3 L = Lp / ld;
    float sp = pow(max(dot(n, normalize(L + V)), 0.0), 220.0);
    col += lc * (sp * 18.0 / (1.0 + ld * 0.012) + max(dot(n, L), 0.0) * 30.0 / (ld * ld * 0.02 + 30.0) * 0.035);
  }
  vec3 toF = normalize(uFlashPos - vWorld);
  vec3 Hf = normalize(toF + V);
  float flashNear = 1.0 / (1.0 + pow(length(uFlashPos.xz - vWorld.xz) / 900.0, 2.0));
  col += uFlashColor * uFlash * (pow(max(dot(n, Hf), 0.0), 80.0) * 5.0 * flashNear + flashNear * 0.1);

  // foam
  vec2 wr = vec2(dot(vP0, uWindDir), dot(vP0, vec2(-uWindDir.y, uWindDir.x)));
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  vec4 fm1 = texture2D(uFoamMap, (rot * vP0) / 52.0 + wt * 0.004);
  vec4 fm2 = texture2D(uFoamMap, (vP0 * rot) / 17.0 - wt * 0.01 + 0.5);
  float foamTex = fm1.r * 0.65 + fm2.r * 0.55;
  // whitecaps: where the surface folds (low Jacobian) and on the highest crests
  float crestFoam = smoothstep(0.9, 0.48, jac) * smoothstep(0.12, 0.45, uStorm);
  crestFoam += smoothstep(max(3.5 * uStorm, 2.6), max(8.0 * uStorm, 4.8), hgt) * 0.55;
  crestFoam = clamp(crestFoam * (foamTex * 1.9 + 0.05), 0.0, 1.0);
  crestFoam = max(crestFoam, smoothstep(0.35, 0.9, rogueE) * (0.4 + foamTex));
  // long fibrous wind-rows: the cellular foam stretched along the wind and wavered
  float patchy = texture2D(uFoamMap, vP0 / 310.0 + wt * 0.0015).g;
  vec2 sw = vec2(wr.x / 420.0, wr.y / 26.0 + sin(wr.x / 140.0) * 0.6);
  float streak = texture2D(uFoamMap, sw + vec2(uTime * 0.002, 0.0)).r;
  float streakFoam = smoothstep(0.45, 0.9, streak) * smoothstep(0.4, 0.75, patchy) * 0.38 * uStorm;
  streakFoam *= 0.4 + fm2.r * 0.8;
  float lace = smoothstep(0.62, 0.98, fm1.r * fm2.g * 1.6) * 0.16 * uStorm * smoothstep(0.35, 0.7, patchy);
  float hullMask;
  float wake = shipFoam(vP0, hullMask);
  float wakeFoam = clamp(wake * (foamTex * 1.35 - 0.12), 0.0, 1.0);
  float foam = clamp(crestFoam + streakFoam + lace + wakeFoam, 0.0, 1.0);
  foam *= mix(1.0, 0.55, smoothstep(700.0, 4000.0, dist));
  vec3 foamLit = uFoamCol * (uAmbient * 1.3 + uKeyColor * 0.15 + uFlashColor * uFlash * (0.25 + 0.6 * flashNear));
  foamLit *= 0.85 + 0.15 * n.y;
  col = mix(col, foamLit, foam * 0.93);

  float fog = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
  col = mix(col, uFogColor + uFlashColor * uFlash * 0.05, fog);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createOcean(waves, env, normalMap, foamMap, { rings = 560, segs = 512, detail = true, lights = 8 } = {}) {
  const R = 12000, P = 2.4;
  const geo = polarGrid(rings, segs, R, P);
  const ships = [0, 1, 2].map(() => new THREE.Vector4());
  const dims = [0, 1, 2].map(() => new THREE.Vector4());
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: env.uTime,
      uWaveA: { value: waves.uA }, uWaveB: { value: waves.uB },
      uRogueA: { value: waves.uRogueA }, uRogueB: { value: waves.uRogueB }, uRogueC: { value: waves.uRogueC },
      uCenter: { value: new THREE.Vector2() },
      uGrid: { value: new THREE.Vector2((P * Math.pow(R, 1 / P)) / rings, (Math.PI * 2) / segs) },
      uNormalMap: { value: normalMap }, uFoamMap: { value: foamMap },
      uDeep: { value: new THREE.Color('#0b2a30') },
      uScatter: { value: new THREE.Color('#2f8a83') },
      uFoamCol: { value: new THREE.Color('#e9eeee') },
      uSkyTop: env.uSkyTop, uSkyHorizon: env.uSkyHorizon,
      uAmbient: env.uAmbient, uFogColor: env.uFogColor, uFogDensity: env.uFogDensity,
      uFlash: env.uFlash, uFlashColor: env.uFlashColor, uFlashDir: env.uFlashDir, uFlashPos: env.uFlashPos,
      uKeyDir: env.uKeyDir, uKeyColor: env.uKeyColor,
      uWindDir: env.uWindDir, uStorm: env.uStorm, uSunVis: env.uSunVis, uCover: env.uCover,
      uPtPos: { value: [...Array(8)].map(() => new THREE.Vector3()) }, uPtCol: { value: [...Array(8)].map(() => new THREE.Color(0, 0, 0)) },
      uShips: { value: ships }, uShipDims: { value: dims },
    },
    vertexShader: vert,
    fragmentShader: frag,
    defines: { ...(detail ? { WATER_DETAIL: '' } : {}), NPT: lights },
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    mesh,
    update(camera, motions) {
      mat.uniforms.uCenter.value.set(camera.position.x, camera.position.z);
      for (let i = 0; i < 3; i++) {
        const m = motions[i];
        if (!m) { dims[i].z = 0; continue; }
        ships[i].set(m.pos.x, m.pos.y, m.heading, m.speed);
        dims[i].set(m.ship.L / 2, m.ship.B / 2, 1, 0);
      }
    },
  };
}
