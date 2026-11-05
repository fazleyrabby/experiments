// Shared GLSL chunks. Every shader in the scene is GLSL3 (WebGL2).

// Integer hashes (pcg family) — stable on all GPUs, no sin() banding.
export const HASH = /* glsl */ `
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float hash12(ivec2 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y)))) * (1.0 / 4294967295.0);
}
vec2 hash22(ivec2 p) {
  uint h = pcg(uint(p.x) + pcg(uint(p.y)));
  return vec2(float(h), float(pcg(h))) * (1.0 / 4294967295.0);
}
float hash13(ivec3 p) {
  return float(pcg(uint(p.x) + pcg(uint(p.y) + pcg(uint(p.z))))) * (1.0 / 4294967295.0);
}
vec3 hash33(ivec3 p) {
  uint h = pcg(uint(p.x) + pcg(uint(p.y) + pcg(uint(p.z))));
  uint h2 = pcg(h);
  return vec3(float(h), float(h2), float(pcg(h2))) * (1.0 / 4294967295.0);
}
`;

// Value noise with analytic derivatives (returns value in [-1,1], d/dx, d/dy).
// The periodic variant wraps the lattice every \`period\` cells.
export const NOISE2 = /* glsl */ `
vec3 noised(vec2 x) {
  vec2 fl = floor(x);
  ivec2 i = ivec2(fl);
  vec2 f = x - fl;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = hash12(i), b = hash12(i + ivec2(1, 0));
  float c = hash12(i + ivec2(0, 1)), d = hash12(i + ivec2(1, 1));
  float k1 = b - a, k2 = c - a, k4 = a - b - c + d;
  return vec3(-1.0 + 2.0 * (a + k1 * u.x + k2 * u.y + k4 * u.x * u.y),
              2.0 * du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}
float noise(vec2 x) { return noised(x).x; }

float noiseP(vec2 x, int period) {
  vec2 fl = floor(x);
  vec2 f = x - fl;
  vec2 u = f * f * (3.0 - 2.0 * f);
  ivec2 i0 = ivec2(mod(fl, float(period)));
  ivec2 i1 = (i0 + 1) % period;
  float a = hash12(i0), b = hash12(ivec2(i1.x, i0.y));
  float c = hash12(ivec2(i0.x, i1.y)), d = hash12(i1);
  return -1.0 + 2.0 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

// Atmosphere helpers shared by every lit surface and by the cloud pass.
// World is metres, y up, plain at y = 0 which sits ~3600 m above sea level.
export const ATMOS = /* glsl */ `
uniform sampler2D uSkyLUT;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyAmbient;
uniform vec3 uGroundBounce;
uniform float uHaze;
uniform float uSkyExposure;

const float PI = 3.14159265;
const vec3 BETA_R = vec3(5.8e-6, 13.5e-6, 33.1e-6);
const float BETA_M = 4.0e-6;
const float H_R = 8000.0;
const float H_M = 1400.0;
const float BASE_ALT = 3600.0;

vec3 skyLUT(vec3 dir) {
  float elev = asin(clamp(dir.y, -1.0, 1.0));
  float v = sqrt(clamp(elev / (0.5 * PI), 0.0, 1.0));
  vec2 sh = normalize(uSunDir.xz + vec2(1e-5));
  vec2 dh = normalize(dir.xz + vec2(1e-5, 0.0));
  float az = acos(clamp(dot(sh, dh), -1.0, 1.0)) / PI;
  return texture(uSkyLUT, vec2(az, v)).rgb * uSkyExposure;
}

// Optical depth through an exponential atmosphere between two altitudes over distance d.
float odExp(float h0, float h1, float d, float H) {
  float a0 = exp(-(h0 + BASE_ALT) / H);
  float dh = h1 - h0;
  float k = abs(dh) < 1.0 ? 1.0 : (1.0 - exp(-dh / H)) / (dh / H);
  return a0 * k * d;
}

// Aerial perspective: fade a surface at distance d along viewDir into the horizon sky.
vec3 aerial(vec3 col, float d, vec3 viewDir, float camH, float pH) {
  float odR = odExp(camH, pH, d, H_R);
  float odM = odExp(camH, pH, d, H_M);
  vec3 T = exp(-(BETA_R * odR + BETA_M * uHaze * odM * 1.1));
  vec3 hd = normalize(vec3(viewDir.x, max(viewDir.y, 0.015), viewDir.z));
  vec3 haze = skyLUT(hd);
  return col * T + haze * (1.0 - T);
}

float hgPhase(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * c, 1.5));
}
`;

// Cloud shadow lookup shared by the terrain shaders. The map holds vertical optical
// depth of the cumulus layer (r) and the cap cloud (g) over the backdrop frame.
export const CLOUD_SHADOW = /* glsl */ `
uniform sampler2D uCloudShadow;
uniform vec4 uCloudShadowRect; // xz min, 1/size
float cloudShadow(vec3 pB) {
  float s = 1.0;
  float slant = 1.0 / max(uSunDir.y, 0.08);
  for (int i = 0; i < 2; i++) {
    float mid = i == 0 ? 3000.0 : 4700.0;
    if (pB.y > mid) continue;
    vec2 q = pB.xz + uSunDir.xz * (mid - pB.y) / max(uSunDir.y, 0.08);
    vec2 uv = (q - uCloudShadowRect.xy) * uCloudShadowRect.zw;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) continue;
    vec2 t = texture(uCloudShadow, uv).rg;
    s *= exp(-(i == 0 ? t.r : t.g) * slant);
  }
  return mix(0.18, 1.0, s);
}
`;

// Our own low beams. Irradiance at p (normal n) from both lamps; zero by day.
export const HEADLIGHT = /* glsl */ `
uniform vec3 uHeadPos;
uniform vec3 uHeadDir;
uniform vec3 uHeadRight;
uniform float uHeadOn;
uniform float uLampBoost;
vec3 headlights(vec3 p, vec3 n) {
  if (uHeadOn <= 0.0) return vec3(0.0);
  vec3 up = cross(uHeadRight, uHeadDir);
  float e = 0.0;
  for (int i = 0; i < 2; i++) {
    vec3 lp = uHeadPos + uHeadRight * (i == 0 ? -0.72 : 0.72);
    vec3 d = p - lp;
    float f = dot(d, uHeadDir);
    if (f <= 0.2) continue;
    float ax = dot(d, uHeadRight) / f;
    float ay = dot(d, up) / f;
    // low beam: wide and flat, cut off just above the lamps, kicked up a little to the kerb side
    float cut = smoothstep(0.014, -0.006, ay - max(ax, 0.0) * 0.07);
    float beam = exp(-pow(ax / 0.45, 2.0)) * exp(-pow((ay + 0.03) / 0.05, 2.0) * 0.5);
    beam = max(beam, 0.12 * exp(-pow(ax / 0.8, 2.0)));
    float r2 = dot(d, d);
    vec3 l = -d * inversesqrt(r2);
    e += beam * cut * max(dot(n, l), 0.0) / (r2 + 1.0);
  }
  return vec3(1.0, 0.93, 0.82) * uHeadOn * e;
}
`;

// Land palette and cover (see scenes.js).
export const BIOME = /* glsl */ `
uniform vec3 uGrassA, uGrassB, uScrub, uBare, uMeadowC, uRedC, uAlkC;
uniform vec3 uTuftA, uTuftB, uTuftM, uNeedle, uLeafA, uLeafB;
uniform vec3 uPlainA, uPlainB;
uniform vec4 uCover; // tufts, tuft height, flowers, stones
uniform vec4 uTrees; // conifers, broadleaf, distant canopy, how much of the land is forested regardless of patches
uniform float uSnowCover;
uniform float uSnowLine;
`;

// Open water: level, on, time. Shading for a sea surface seen from the cliff road.
export const WATER = /* glsl */ `
uniform vec4 uWater;
vec3 waterShade(vec3 pos, vec3 vd, float dist, float depth, float shadow) {
  vec2 p = pos.xz;
  float t = uWater.z;
  float fade = 1.0 - smoothstep(150.0, 2500.0, dist);
  vec3 a = noised(p * 0.045 + vec2(t * 0.020, t * 0.011));
  vec3 b = noised(p * 0.19 + vec2(-t * 0.045, t * 0.03));
  vec3 c = noised(p * 0.9 + vec2(t * 0.16, -t * 0.12));
  vec2 g = a.yz * 0.045 * 1.6 + b.yz * 0.19 * 0.45 + c.yz * 0.9 * 0.06 * (1.0 - smoothstep(20.0, 160.0, dist));
  vec3 n = normalize(vec3(-g.x * fade, 1.0, -g.y * fade));
  float ndv = max(dot(n, -vd), 0.0);
  float F = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 r = reflect(vd, n);
  r.y = max(r.y, 0.02);
  vec3 refl = skyLUT(r);
  float shallow = 1.0 - smoothstep(0.0, 9.0, depth);
  vec3 body = mix(vec3(0.004, 0.018, 0.03), vec3(0.02, 0.10, 0.10), shallow);
  body *= uSunColor * max(uSunDir.y, 0.0) * 0.6 * shadow + uSkyAmbient * 0.9;
  vec3 h = normalize(uSunDir - vd);
  float spec = pow(max(dot(n, h), 0.0), 600.0) * 90.0 + pow(max(dot(n, h), 0.0), 60.0) * 0.6;
  vec3 col = mix(body, refl, F) + uSunColor * spec * shadow * F * 4.0;
  // surf where it breaks on the rocks
  float foam = (1.0 - smoothstep(0.0, 1.1, depth)) * (0.55 + 0.45 * sin(t * 0.9 + p.x * 0.05 + p.y * 0.03));
  col = mix(col, vec3(0.85) * (uSunColor * max(uSunDir.y, 0.0) + uSkyAmbient), foam * 0.75);
  return col;
}
`;

// Patches across the plain, shared by the ground shader and the scatter (flowers, stones).
export const FIELD = /* glsl */ `
float forest(vec2 p) {
  vec2 q = p / PERIOD;
  float m = noiseP(q * 30.0 + 0.53, 30) * 0.65 + noiseP(q * 140.0 + 0.2, 140) * 0.35;
  return smoothstep(-0.25, 0.35, m);
}
float meadow(vec2 p) {
  vec2 q = p / PERIOD;
  float m = noiseP(q * 40.0 + 0.21, 40) * 0.6 + noiseP(q * 170.0 + 0.6, 170) * 0.4;
  return smoothstep(0.02, 0.38, m);
}
float alkali(vec2 p) {
  vec2 q = p / PERIOD;
  return smoothstep(0.5, 0.75, noiseP(q * 26.0 + 0.43, 26) * 0.7 + noiseP(q * 310.0, 310) * 0.3);
}
float redSoil(vec2 p) {
  vec2 q = p / PERIOD;
  return smoothstep(0.35, 0.7, noiseP(q * 60.0 + 0.77, 60) * 0.7 + noiseP(q * 420.0 + 0.1, 420) * 0.3);
}
`;
