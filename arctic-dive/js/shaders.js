// GLSL for the fullscreen passes: sky (clouds), water/underwater composite,
// a shared caustic pattern, and the display-space grade.

export const FS_VERT = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }
`;

const COMMON = /* glsl */`
  uniform mat4 uInvProj;
  uniform mat4 uCamWorld;
  vec3 rayDir(vec2 uv) {
    vec4 v = uInvProj * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
    return normalize(mat3(uCamWorld) * (v.xyz / v.w));
  }
`;

// Bright, sharp-edged network that drifts over time; used for underwater light
// shafts and for caustics painted on submerged surfaces.
export const CAUSTIC_GLSL = /* glsl */`
  float hash12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vnoise12(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
  float causticPattern(vec2 p, float t) {
    vec2 q = p + 0.55 * vec2(sin(p.y * 1.7 + t * 0.9), sin(p.x * 1.5 - t * 0.8));
    q += 0.3 * vec2(sin(q.y * 3.1 - t * 1.3), sin(q.x * 2.9 + t * 1.1));
    float v = sin(q.x * 2.3) * sin(q.y * 2.1) + 0.5 * sin((q.x + q.y) * 1.9 + t);
    return pow(max(0.0, 1.0 - abs(v) * 1.6), 4.0);
  }
`;

// One half-res buffer holds the sky above the horizon and the mirrored sky below
// it, so each pixel raymarches the clouds exactly once.
export const SKY_FRAG = /* glsl */`
  precision highp sampler3D;
  uniform sampler3D uNoise;
  uniform float uTime;
  uniform float uCoverage;
  uniform vec3 uSunDir;
  uniform vec3 uCamPos;
  uniform vec3 uHorizon;
  // Loop bounds are uniforms so the compiler can't unroll the nested march
  // (constant bounds made the first compile take ~10 s).
  uniform int uSteps;
  uniform int uLightSteps;
  // Temporal rendering: this pass covers one pixel of every 2x2 block of the
  // full-res sky buffer (uOffset cycles through the four), see RESOLVE_FRAG.
  uniform vec2 uFullRes;
  uniform vec2 uOffset;
  uniform float uFrame;
  varying vec2 vUv;
  ${COMMON}

  #define H0 900.0
  #define H1 7200.0
  const vec3 SUN = vec3(1.0, 0.95, 0.88) * 22.0;
  const float SIG = 0.006;

  float remap(float v, float a, float b, float c, float d) { return c + (v - a) / (b - a) * (d - c); }
  float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(1.0 + g2 - 2.0 * g * c, 1.5)); }

  vec3 atmosphere(vec3 rd) {
    float y = max(rd.y, 0.0);
    vec3 c = mix(uHorizon, vec3(0.14, 0.18, 0.25), pow(y, 0.5));
    float s = max(dot(rd, uSunDir), 0.0);
    c += vec3(1.0, 0.92, 0.8) * (pow(s, 24.0) * 0.1 + pow(s, 256.0) * 1.6);
    return c;
  }

  // Cumulus towers: a weather map sets coverage and how tall each cell grows;
  // tops shear downwind; billows are carved by inverted Worley at two scales.
  // The weather map varies over tens of km, so it is fetched once per march step
  // (weatherAt) and reused by that step's light and occlusion samples.
  vec4 gWeather = vec4(0.5);
  void weatherAt(vec3 p) {
    vec3 q = p + vec3(uTime * 14.0, 0.0, uTime * 5.0);
    gWeather = texture(uNoise, vec3(q.x / 40000.0, 0.37, q.z / 40000.0));
  }
  float cloudDensity(vec3 p, bool detail) {
    float h = (p.y - H0) / (H1 - H0);
    if (h < 0.0 || h > 1.0) return 0.0;
    vec3 wind = vec3(uTime * 14.0, 0.0, uTime * 5.0);
    vec3 q = p + wind;
    q.xz += h * h * vec2(1400.0, 500.0);
    vec4 w = gWeather;
    float cov = clamp(uCoverage + (w.r - 0.5) * 0.9, 0.0, 1.0);
    // Thin the deck along the line of sight to the sun so it breaks through.
    float toSun = dot(normalize(p - vec3(uCamPos.x, 0.0, uCamPos.z)), uSunDir);
    cov *= 1.0 - 0.5 * smoothstep(0.982, 0.9985, toSun);
    float top = mix(0.3, 1.0, smoothstep(0.3, 0.75, w.g));
    float profile = smoothstep(0.0, 0.035, h) * (1.0 - smoothstep(top * 0.45, top, h));
    vec4 n = texture(uNoise, q / 9000.0);
    float base = remap(n.r, n.g - 1.0, 1.0, 0.0, 1.0);
    float d = remap(base * profile, 1.0 - cov, 1.0, 0.0, 1.0);
    if (d <= 0.0) return 0.0;
    if (detail) {
      vec4 m = texture(uNoise, (q + wind * 0.5) / 1900.0);
      float billow = m.g * 0.625 + m.b * 0.25 + m.a * 0.125;
      d = remap(d, billow * 0.62, 1.0, 0.0, 1.0);
      vec4 f = texture(uNoise, (q - wind * 0.4) / 430.0);
      float fine = f.b * 0.6 + f.a * 0.4;
      d = remap(d, mix(fine, 1.0 - fine, clamp(h * 3.0, 0.0, 1.0)) * 0.32, 1.0, 0.0, 1.0);
    }
    return clamp(d * 2.2, 0.0, 1.0);
  }

  vec4 marchClouds(vec3 ro, vec3 rd, float jitter) {
    if (rd.y < 0.01) return vec4(0.0, 0.0, 0.0, 1.0);
    float t0 = (H0 - ro.y) / rd.y;
    float t1 = min((H1 - ro.y) / rd.y, t0 + 14000.0);
    // Fewer steps for short, steep rays; long grazing rays get the full budget.
    int steps = int(mix(float(uSteps), float(uSteps) * 0.55, smoothstep(0.15, 0.7, rd.y)));
    float dt = (t1 - t0) / float(steps);
    float t = t0 + dt * jitter;
    float mu = dot(rd, uSunDir);
    float T = 1.0;
    vec3 L = vec3(0.0);
    for (int i = 0; i < 96; i++) {
      if (i >= steps || t > t1) break;
      vec3 p = ro + rd * t;
      weatherAt(p);
      // Empty-space skipping: a cheap coarse test, then stride further through clear air.
      if (cloudDensity(p, false) <= 0.0) { t += dt * 1.7; continue; }
      float d = cloudDensity(p, true);
      if (d > 0.002) {
        float od = 0.0, ls = 80.0;
        vec3 lp = p;
        for (int j = 0; j < uLightSteps; j++) { lp += uSunDir * ls; od += cloudDensity(lp, false) * ls; ls *= 2.1; }
        float h = (p.y - H0) / (H1 - H0);
        // Three scattering octaves: each lets light further in with a softer phase.
        float sunLight = 0.0, a = 2.2, b = 1.0, g = 0.45;
        for (int o = 0; o < 3; o++) {
          sunLight += b * exp(-od * SIG * a) * mix(hg(mu, g), hg(mu, -0.3 * g), 0.5);
          a *= 0.3; b *= 0.5; g *= 0.5;
        }
        float powder = 1.0 - exp(-d * 8.0);
        // Sky light from above, occluded by whatever cloud sits overhead: carves
        // dark crevices under each billow and keeps the tops bright.
        float above = cloudDensity(p + vec3(0.0, 450.0, 0.0), false);
        vec3 amb = mix(vec3(0.012, 0.017, 0.028), vec3(0.38, 0.45, 0.58), smoothstep(0.0, 0.75, h)) * exp(-above * 2.4);
        vec3 S = SUN * sunLight * mix(0.25, 1.0, powder) + amb * (0.4 + 0.6 * powder);
        float tr = exp(-d * SIG * dt);
        L += T * S * (1.0 - tr);
        T *= tr;
        if (T < 0.02) break;
      }
      t += dt;
    }
    return vec4(L, T);
  }

  void main() {
    vec2 px = floor(gl_FragCoord.xy) * 2.0 + uOffset;
    vec3 rd = rayDir((px + 0.5) / uFullRes);
    rd.y = abs(rd.y); // lower half stores the mirrored sky for water reflections
    vec3 ro = vec3(uCamPos.x, 0.0, uCamPos.z);
    float jitter = fract(52.9829189 * fract(dot(px, vec2(0.06711056, 0.00583715))) + uFrame * 0.618034);
    vec3 sky = atmosphere(rd);
    vec4 cl = marchClouds(ro, rd, jitter);
    float mu = dot(rd, uSunDir);
    vec3 sun = SUN * 5.0 * smoothstep(0.99955, 0.99975, mu);
    vec3 col = (sky + sun) * cl.a + cl.rgb;
    float fog = 1.0 - exp(-H0 / max(rd.y, 1e-3) * 0.000016);
    gl_FragColor = vec4(mix(col, sky + sun * 0.3, fog), 1.0);
  }
`;

// Background composite drawn behind the meshes. Above water: the mirror sea.
// Below: the surface seen from beneath (Snell's window), in-water haze and
// light shafts.
export const WATER_FRAG = /* glsl */`
  uniform sampler2D uSky;
  uniform sampler2D uRefl;
  uniform mat4 uProj;
  uniform mat4 uView;
  uniform vec3 uCamPos;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uUnder;
  uniform vec4 uRipples[RIPPLES]; // x, z, start time, strength
  uniform vec2 uSkyTexel;
  uniform sampler2D uWaterN;
  uniform vec2 uBoat; // hull plan centre (x, z); bow along +x
  varying vec2 vUv;
  ${COMMON}
  ${CAUSTIC_GLSL}

  // Large-scale height: two long swells plus expanding ripple rings.
  float waterHeight(vec2 p) {
    float h = 0.0;
    h += sin(dot(p, vec2(0.62, 0.78)) * 0.24 + uTime * 0.55) * 0.05;
    h += sin(dot(p, vec2(-0.85, 0.53)) * 0.37 + uTime * 0.71) * 0.03;
    for (int i = 0; i < RIPPLES; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (age < 0.0 || age > 10.0) continue;
      float d = length(p - r.xy);
      float x = d - age * 1.6;
      float env = exp(-x * x / (0.35 + age * 0.5));
      h += sin(x * 5.5) * env * r.w * 0.05 * exp(-age * 0.35) / (1.0 + d * 0.5);
    }
    return h;
  }

  // Fine ripples: four drifting layers of the baked ripple normal map. A slow
  // mask leaves calm, mirror-like patches between wind-ruffled ones.
  vec2 rippleSlope(vec2 p) {
    vec2 s = vec2(0.0);
    s += (texture2D(uWaterN, p * 0.031 + uTime * vec2(0.0061, 0.0043)).rg - 0.5) * 1.0;
    s += (texture2D(uWaterN, p * 0.083 + uTime * vec2(-0.0093, 0.0071)).rg - 0.5) * 0.75;
    s += (texture2D(uWaterN, p * 0.21 + uTime * vec2(0.0127, -0.0109)).rg - 0.5) * 0.5;
    s += (texture2D(uWaterN, p * 0.53 + uTime * vec2(-0.019, -0.016)).rg - 0.5) * 0.32;
    float ruffle = smoothstep(0.3, 0.75, texture2D(uWaterN, p * 0.0021 + uTime * vec2(0.0007, 0.0004)).b);
    return s * (0.3 + 0.7 * ruffle);
  }

  vec3 waterNormal(vec2 p, float dist, float detail) {
    float e = 0.04 + dist * 0.002;
    float hx = waterHeight(p + vec2(e, 0.0)) - waterHeight(p - vec2(e, 0.0));
    float hz = waterHeight(p + vec2(0.0, e)) - waterHeight(p - vec2(0.0, e));
    vec3 n = vec3(-hx / (2.0 * e), 1.0, -hz / (2.0 * e));
    n.xz -= rippleSlope(p) * detail;
    return normalize(n);
  }

  float foam(vec2 p) {
    float f = 0.0;
    for (int i = 0; i < RIPPLES; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (age < 0.0 || age > 6.0) continue;
      vec2 o = p - r.xy;
      f += exp(-dot(o, o) * 1.5 / (0.3 + age)) * exp(-age * 0.9) * r.w;
    }
    return clamp(f, 0.0, 1.0);
  }

  // Broken foam hugging the hull where it meets the water.
  float hullFoam(vec2 p) {
    vec2 q = p - uBoat;
    float d = length(vec2(q.x / 4.5, q.y / 1.38)) - 1.0;
    float band = (1.0 - smoothstep(0.0, 0.3, d)) * step(-0.06, d);
    float n = texture2D(uWaterN, p * 0.35 + uTime * vec2(0.02, -0.015)).b * 0.6 + texture2D(uWaterN, p * 0.9 - uTime * 0.03).b * 0.4;
    return band * smoothstep(0.38, 0.72, n);
  }

  vec2 project(vec3 dir) {
    vec4 clip = uProj * (uView * vec4(dir, 0.0));
    return clip.w > 0.0 ? clamp(clip.xy / clip.w * 0.5 + 0.5, vec2(0.001), vec2(0.999)) : vUv;
  }

  // Small tent blur: hides the half-res, dithered cloud buffer when upsampled
  // and when ripples magnify it.
  vec3 skySample(vec2 uv) {
    vec2 o = uSkyTexel * 0.75;
    return (texture2D(uSky, uv).rgb * 2.0 + texture2D(uSky, uv + vec2(o.x, o.y)).rgb + texture2D(uSky, uv + vec2(-o.x, o.y)).rgb
      + texture2D(uSky, uv + vec2(o.x, -o.y)).rgb + texture2D(uSky, uv - o).rgb) / 6.0;
  }

  vec3 aboveWater(vec3 rd) {
    if (rd.y >= 0.0) return skySample(vUv);
    float t = uCamPos.y / -rd.y;
    vec3 p = uCamPos + rd * t;
    vec3 n = waterNormal(p.xz, t, 0.11);
    vec3 R = reflect(rd, n);
    R.y = max(R.y, 0.0005);
    // The sky buffer stores sky(mirror(dir)) at the pixel looking along dir,
    // so project the mirrored reflection vector to find where to sample.
    vec2 uvR = project(vec3(R.x, -R.y, R.z));
    vec3 skyR = skySample(uvR);
    vec4 obj = texture2D(uRefl, clamp(vUv + (uvR - vUv) * 0.5, vec2(0.001), vec2(0.999)));
    vec3 refl = mix(skyR, obj.rgb / max(obj.a, 1e-3), obj.a);
    float cosi = clamp(dot(-rd, n), 0.0, 1.0);
    float F = 0.02 + 0.98 * pow(1.0 - cosi, 5.0);
    F = mix(0.5, 1.0, F); // stylised: a near-perfect mirror at every angle
    vec3 col = mix(vec3(0.003, 0.009, 0.016) + vec3(0.0, 0.01, 0.016) * clamp(n.x * 8.0 + 0.5, 0.0, 1.0), refl * vec3(0.8, 0.88, 0.95), F);
    float glint = smoothstep(1.2, 3.5, dot(skyR, vec3(0.33)));
    col += vec3(1.0, 0.95, 0.85) * pow(max(dot(R, uSunDir), 0.0), 700.0) * 6.0 * glint;
    col += vec3(0.75, 0.8, 0.85) * foam(p.xz) * 0.35;
    col = mix(col, vec3(0.6, 0.66, 0.7), hullFoam(p.xz) * 0.6);
    return mix(col, uHorizon, (1.0 - exp(-t * 0.00015)) * 0.7);
  }

  const vec3 WATER_HI = vec3(0.07, 0.2, 0.24);
  const vec3 WATER_LO = vec3(0.004, 0.02, 0.032);

  // In-water radiance looking along rd from depth y.
  vec3 waterTint(vec3 rd, float y) {
    vec3 c = mix(WATER_LO, WATER_HI, smoothstep(0.15, 1.0, rd.y * 0.5 + 0.5));
    return c * exp(min(y, 0.0) * 0.045);
  }

  vec3 underWater(vec3 rd) {
    vec3 col = waterTint(rd, uCamPos.y);
    if (rd.y > 0.0) {
      float t = -uCamPos.y / rd.y;
      vec3 p = uCamPos + rd * t;
      vec3 n = waterNormal(p.xz, t, 0.34);
      vec3 T = refract(rd, -n, 1.333);
      vec3 surf;
      if (dot(T, T) < 1e-4) {
        surf = waterTint(reflect(rd, -n), uCamPos.y) * 1.5; // total internal reflection
      } else {
        vec3 sky = skySample(project(T));
        surf = mix(waterTint(rd, 0.0) * 2.2, sky * vec3(0.72, 0.9, 1.0), smoothstep(0.0, 0.3, T.y));
        surf += vec3(1.0, 0.95, 0.85) * pow(max(dot(T, uSunDir), 0.0), 300.0) * 8.0;
      }
      surf = mix(surf, vec3(0.5, 0.6, 0.62), hullFoam(p.xz) * 0.7);
      col = mix(col, surf, exp(-t * 0.045));
    }
    // Light shafts: march a few steps and look up where the sun ray through each
    // point crossed the surface; bright caustic cells there light the column.
    vec3 sunR = refract(-uSunDir, vec3(0.0, 1.0, 0.0), 1.0 / 1.333);
    float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    float shafts = 0.0;
    for (int i = 0; i < 18; i++) {
      float s = (float(i) + jit) * 1.8;
      vec3 q = uCamPos + rd * s;
      if (q.y > 0.0) break;
      vec2 sp = q.xz - sunR.xz * (q.y / sunR.y);
      shafts += causticPattern(sp * 0.16, uTime * 0.6) * exp(q.y * 0.07) * exp(-s * 0.04);
    }
    return col + vec3(0.32, 0.56, 0.6) * shafts * 0.075;
  }

  void main() {
    vec3 rd = rayDir(vUv);
    gl_FragColor = vec4(uUnder > 0.5 ? underWater(rd) : aboveWater(rd), 1.0);
  }
`;

// Rebuilds the full-res sky each frame: the pixel rendered this frame for each
// 2x2 block is blended into history; the other three are reprojected from the
// previous frame by view direction (clouds are far enough that direction alone
// is exact) and clamped to the neighbourhood of fresh samples to avoid ghosting.
export const RESOLVE_FRAG = /* glsl */`
  uniform sampler2D uCur;
  uniform sampler2D uHist;
  uniform vec2 uFullRes;
  uniform vec2 uLowRes;
  uniform vec2 uOffset;
  uniform mat4 uPrevVP;
  uniform float uHistValid;
  varying vec2 vUv;
  ${COMMON}

  void main() {
    vec2 px = floor(gl_FragCoord.xy);
    vec2 cell = floor(px * 0.5);
    vec2 uv = (px + 0.5) / uFullRes;
    vec3 cur = texture2D(uCur, (cell + 0.5) / uLowRes).rgb;
    vec3 mn = cur, mx = cur;
    for (int i = 0; i < 4; i++) {
      vec2 o = i == 0 ? vec2(1, 0) : i == 1 ? vec2(-1, 0) : i == 2 ? vec2(0, 1) : vec2(0, -1);
      vec3 c = texture2D(uCur, (cell + o + 0.5) / uLowRes).rgb;
      mn = min(mn, c);
      mx = max(mx, c);
    }
    vec3 up = texture2D(uCur, uv).rgb;
    vec4 clip = uPrevVP * vec4(rayDir(uv), 0.0);
    vec2 puv = clip.xy / clip.w * 0.5 + 0.5;
    bool valid = uHistValid > 0.5 && clip.w > 0.0 && puv.x > 0.0 && puv.y > 0.0 && puv.x < 1.0 && puv.y < 1.0;
    vec3 hist = texture2D(uHist, puv).rgb;
    vec3 pad = (mx - mn) * 0.35 + 0.015;
    hist = clamp(hist, mn - pad, mx + pad);
    bool fresh = all(equal(px - cell * 2.0, uOffset));
    vec3 col = fresh ? (valid ? mix(hist, cur, 0.45) : cur) : (valid ? hist : up);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const GRADE_FRAG = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uUnder;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv + uUnder * 0.0018 * vec2(sin(vUv.y * 38.0 + uTime * 1.7), cos(vUv.x * 31.0 + uTime * 1.3));
    vec3 c = texture2D(tDiffuse, uv).rgb;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, mix(0.8, 0.95, uUnder)) * vec3(0.97, 1.0, 1.035);
    vec2 q = vUv - 0.5;
    c *= 1.0 - dot(q, q) * mix(0.6, 1.1, uUnder);
    float g = fract(sin(dot(gl_FragCoord.xy + fract(uTime * 7.13) * 91.0, vec2(12.9898, 78.233))) * 43758.5453);
    c += (g - 0.5) * 0.028;
    gl_FragColor = vec4(c, 1.0);
  }
`;
