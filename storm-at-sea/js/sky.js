import * as THREE from 'three';

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`;

const frag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uSkyTop, uSkyHorizon, uKeyColor, uKeyDir, uFogColor, uFlashColor, uFlashDir;
uniform float uFlash, uTime, uCover, uSunVis, uStars, uDisc, uMoon;
uniform vec2 uWindDir;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < SKY_OCTAVES; i++) { s += a * noise(p); p = m * p; a *= 0.5; }
  return s;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float hh = max(h, 0.0);
  vec3 col = mix(uSkyHorizon, uSkyTop, pow(hh, 0.5));
  vec2 az = normalize(d.xz + 1e-5);
  float gapA = max(dot(az, normalize(uKeyDir.xz)), 0.0);
  col += uKeyColor * pow(gapA, 5.0) * exp(-hh * 12.0) * 0.8;

  // storm deck: three drifting layers, perspective-projected onto a ceiling
  vec2 uv = d.xz / (hh + 0.1);
  vec2 wind = uWindDir * uTime;
  float c1 = fbm(uv * 0.5 + wind * 0.004);
  float c2 = fbm(uv * 1.5 + c1 * 1.4 - wind * 0.007);
  float c3 = fbm(uv * 4.0 + c2 * 1.2 + wind * 0.016);
  float dens = clamp(c1 * 0.8 + c2 * 0.45 + c3 * 0.18 - mix(0.8, 0.42, uCover), 0.0, 1.0);
  dens = smoothstep(0.02, 0.62, dens);
  float shade = clamp(c2 * 1.3 - c3 * 0.5, 0.0, 1.0);
  vec3 cloudLight = mix(uSkyHorizon, uSkyTop, 0.25) * 1.35 + uKeyColor * pow(gapA, 3.0) * 0.25;
  cloudLight = mix(cloudLight, uKeyColor * 0.9 + uSkyHorizon * 0.45, uSunVis * 0.65);
  vec3 cloudDark = mix(uSkyTop * 0.42, uSkyHorizon * 0.75, uSunVis * 0.6);
  vec3 cloud = mix(cloudLight, cloudDark, clamp(dens * 0.85 + shade * 0.25, 0.0, 1.0));
  float cloudMask = smoothstep(-0.01, 0.16, h);
  // stars on clear nights
  if (uStars > 0.0) {
    vec2 st = vec2(atan(d.z, d.x) * 170.0, asin(clamp(d.y, 0.0, 1.0)) * 170.0);
    vec2 id = floor(st);
    float sh = hash(id);
    float star = step(0.986, sh) * smoothstep(0.45, 0.0, length(fract(st) - 0.5)) * (0.4 + 0.6 * hash(id + 7.0));
    col += vec3(0.85, 0.9, 1.0) * star * uStars * smoothstep(0.02, 0.25, h) * 1.6;
  }
  // sun / moon
  vec3 kd = normalize(uKeyDir);
  float sd = max(dot(d, kd), 0.0);
  float vis = uSunVis * uDisc;
  col += uKeyColor * vis * (1.0 - uMoon) * (pow(sd, 2400.0) * 40.0 + pow(sd, 14.0) * 0.4 + pow(sd, 3.0) * 0.07);
  // full moon: crisp disc with darker maria, soft halo
  float mAng = acos(clamp(dot(d, kd), -1.0, 1.0));
  float md = smoothstep(0.0165, 0.0145, mAng);
  vec3 off = (d - kd) * 900.0;
  float maria = noise(off.xz * 0.9 + 3.0) * 0.6 + noise(off.xy * 2.1) * 0.4;
  vec3 moonC = vec3(0.93, 0.95, 1.0) * (0.72 + 0.28 * smoothstep(0.35, 0.7, maria)) * 2.4;
  col = mix(col, moonC, md * uMoon * vis);
  col += uKeyColor * uMoon * vis * (pow(sd, 90.0) * 0.45 + pow(sd, 9.0) * 0.12);
  col = mix(col, cloud, cloudMask * mix(0.75, 0.92, uCover) * max(smoothstep(0.02, 0.32, dens), smoothstep(0.6, 0.95, uCover)));

  // rain curtains hanging under the cloud base near the horizon
  float ang = atan(d.z, d.x);
  float shafts = fbm(vec2(ang * 16.0, uTime * 0.015)) * fbm(vec2(ang * 5.0 + 3.0, 1.0));
  col = mix(col, uFogColor * 0.75, smoothstep(0.15, 0.5, shafts) * smoothstep(0.28, 0.0, hh) * 0.55 * uCover);

  // lightning: in-cloud scattering lights up the underside of the deck
  float fd = max(dot(d, uFlashDir), 0.0);
  float glow = pow(fd, 5.0) * 0.9 + pow(fd, 28.0) * 2.4;
  col += uFlashColor * uFlash * (glow * (0.3 + dens * 1.4 + shade * 0.4) + 0.08 + dens * 0.14);

  // horizon haze (matches ocean fog)
  vec3 fogC = uFogColor + uFlashColor * uFlash * 0.05;
  col = mix(col, fogC, exp(-hh * mix(16.0, 10.0, uCover)) * mix(0.6, 0.88, uCover));
  if (h < 0.0) col = mix(fogC, fogC * 0.55, clamp(-h * 4.0, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createSkyMaterial(env, octaves = 6) {
  return new THREE.ShaderMaterial({
    defines: { SKY_OCTAVES: octaves },
    uniforms: {
      uTime: env.uTime, uSkyTop: env.uSkyTop, uSkyHorizon: env.uSkyHorizon,
      uKeyColor: env.uKeyColor, uKeyDir: env.uKeyDir, uFogColor: env.uFogColor,
      uFlash: env.uFlash, uFlashColor: env.uFlashColor, uFlashDir: env.uFlashDir, uWindDir: env.uWindDir,
      uCover: env.uCover, uSunVis: env.uSunVis, uStars: env.uStars, uDisc: env.uDisc, uMoon: env.uMoon,
    },
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
  });
}

export function createSky(env, octaves = 6) {
  const mat = createSkyMaterial(env, octaves);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(20000, 64, 32), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return mesh;
}
