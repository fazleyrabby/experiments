import * as THREE from 'three';
import { HASH, NOISE2, ATMOS, CLOUD_SHADOW, HEADLIGHT, BIOME } from './glsl.js';
import { PERIOD, HALF_WIDTH, frameAt, railAtZ, routeLen } from './roadpath.js';
import { box, paint, merge } from './props.js';

const STEP = 2;
const RAIL_OFFSET = 5.0; // post centreline, metres right of the road centre
const curbAtZ = (z) => (((((-z) * 11) / PERIOD + 0.3) % 1) + 1) % 1 < 0.45;

// Lateral cross-section: asphalt with a slight crown, then a gravel batter down to the plain.
const LATS = [-5.8, -HALF_WIDTH, -2, 0, 2, HALF_WIDTH, 5.8];
const crown = (u) => (Math.abs(u) <= HALF_WIDTH ? 0.06 + 0.05 * (1 - (u / HALF_WIDTH) ** 2) : -0.34);

function roadGeometry() {
  const len = routeLen();
  const rows = Math.ceil(len / STEP) + 1;
  const n = LATS.length;
  const pos = new Float32Array(rows * n * 3), uv = new Float32Array(rows * n * 2), nor = new Float32Array(rows * n * 3);
  const f = {};
  let k = 0, t = 0;
  for (let r = 0; r < rows; r++) {
    const s = Math.min(r * STEP, len);
    frameAt(s, f);
    for (const u of LATS) {
      pos[k] = f.x + f.rx * u; pos[k + 1] = f.y + crown(u); pos[k + 2] = f.z + f.rz * u;
      nor[k] = 0; nor[k + 1] = 1; nor[k + 2] = 0;
      k += 3;
      uv[t++] = u; uv[t++] = s;
    }
  }
  const idx = [];
  for (let r = 0; r < rows - 1; r++) for (let i = 0; i < n - 1; i++) {
    const a = r * n + i, b = a + 1, c = a + n, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// W-beam profile: (distance toward the road from the beam root, height).
const W_BEAM = [[0, -0.155], [0.03, -0.14], [0.072, -0.095], [0.08, -0.06], [0.05, -0.02], [0.042, 0], [0.05, 0.02], [0.08, 0.06], [0.072, 0.095], [0.03, 0.14], [0, 0.155]];

function railGeometry() {
  const parts = [];
  const f = {};
  // beam: one ribbon per continuous stretch
  let strip = null;
  const flush = () => {
    if (!strip || strip.length < 2) { strip = null; return; }
    const m = W_BEAM.length;
    const pos = [], idx = [];
    for (const [s, fr] of strip) {
      for (const [dl, dy] of W_BEAM) {
        const lat = RAIL_OFFSET - 0.2 - dl;
        pos.push(fr.x + fr.rx * lat, fr.y + 0.62 + dy, fr.z + fr.rz * lat);
      }
    }
    for (let r = 0; r < strip.length - 1; r++) for (let i = 0; i < m - 1; i++) {
      const a = r * m + i, b = a + 1, c = a + m, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    parts.push(paint(flat, 0xa9afb2, 0.5, 0.45));
    strip = null;
  };
  const len = routeLen();
  for (let s = 0; s <= len; s += STEP) {
    const fr = frameAt(s, {});
    if (railAtZ(fr.z)) { (strip ||= []).push([s, fr]); }
    else flush();
  }
  flush();

  // posts and blockouts every 4 m along the rail; white delineators every 50 m elsewhere
  for (let s = 0; s < len; s += 4) {
    frameAt(s, f);
    const ang = Math.atan2(-f.tx, -f.tz);
    const place = (g, lat) => { g.rotateY(ang); g.translate(f.x + f.rx * lat, f.y, f.z + f.rz * lat); parts.push(g); };
    if (railAtZ(f.z)) {
      place(box(0.1, 1.15, 0.15, 0, 0.12, 0, 0x9ba1a4, 0.55, 0.45), RAIL_OFFSET);
      place(box(0.16, 0.2, 0.1, 0.0, 0.62, 0, 0x7d8487, 0.55, 0.8), RAIL_OFFSET - 0.12);
    } else if (s % 48 === 0) {
      for (const lat of [RAIL_OFFSET - 0.4, -RAIL_OFFSET + 0.4]) {
        place(box(0.1, 1.2, 0.1, 0, 0.25, 0, 0xe8e6e0, 0.7, 0), lat);
        place(box(0.105, 0.18, 0.105, 0, 0.62, 0, 0x1a1a1a, 0.6, 0), lat);
        place(box(0.11, 0.07, 0.06, 0, 0.75, 0.0, 0xffa020, 0.3, 0, 0.6), lat);
      }
    }
  }
  // painted concrete kerb blocks along the far side of the oncoming lane
  for (let s = 0; s < len; s += 1.6) {
    frameAt(s, f);
    if (!curbAtZ(f.z)) continue;
    const g = box(0.24, 0.32, 0.9, 0, -0.04, 0, s % 3.2 < 1.6 ? 0xdedbd2 : 0xd5d1c6, 0.85, 0);
    g.rotateY(Math.atan2(-f.tx, -f.tz));
    g.translate(f.x - f.rx * 4.55, f.y, f.z - f.rz * 4.55);
    parts.push(g);
  }
  return merge(parts);
}

export function createRoad(shared, propMaterial) {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: { ...shared },
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    vertexShader: /* glsl */ `
      out vec3 vW;
      out vec2 vUv;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${HASH}
      ${NOISE2}
      ${ATMOS}
      ${CLOUD_SHADOW}
      ${HEADLIGHT}
      ${BIOME}
      uniform vec4 uMarks; // centre style, edge lines, dash period
      uniform vec3 uCamW;
      in vec3 vW;
      in vec2 vUv;
      out vec4 outColor;
      float band(float x, float a, float b, float w) { return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x); }
      void main() {
        float u = vUv.x, s = vUv.y;
        float au = abs(u);
        vec3 V = vW - cameraPosition;
        float dist = length(V);
        vec3 vd = V / dist;
        float fw = max(fwidth(u), 1e-4);
        float fs = fwidth(s);
        vec2 q = vec2(u, s);

        // asphalt: aggregate, tyre-polished tracks, sealed cracks and patches
        float agg = noise(q * vec2(31.0, 31.0)) * (1.0 - smoothstep(0.02, 0.08, fw));
        float mid = noise(q * vec2(3.0, 0.9));
        float big = noise(q * vec2(0.4, 0.05) + 3.0);
        vec3 asph = vec3(0.085, 0.085, 0.09) * (1.0 + 0.18 * agg + 0.12 * mid + 0.15 * big);
        float tracks = 0.0;
        for (int i = 0; i < 2; i++) {
          float c = i == 0 ? 0.85 : 2.65;
          tracks += exp(-pow(au - c, 2.0) / 0.12);
        }
        asph *= 1.0 - 0.18 * tracks;
        float crack = 1.0 - smoothstep(0.0, 0.012 + fw * 0.5, abs(noise(q * vec2(1.7, 0.6) + 11.0) + 0.15 * noise(q * 9.0)));
        crack *= smoothstep(0.25, 0.6, noise(q * 0.06 + 5.0)) * (1.0 - smoothstep(0.03, 0.12, fw));
        asph = mix(asph, vec3(0.05), crack * 0.45);
        float patchy = smoothstep(0.55, 0.6, noise(floor(q * vec2(0.5, 0.06)) + 0.5));
        asph *= 1.0 - 0.25 * patchy;

        // markings
        float wear = 0.75 + 0.25 * smoothstep(-0.4, 0.4, noise(q * vec2(6.0, 1.5)));
        float mode = uMarks.x;
        float edge = band(au, 3.48, 3.63, fw) * uMarks.y;
        float dashOn = band(mod(s, uMarks.z), 0.0, 6.0, fs + 0.02);
        float centre = 0.0;
        vec3 centreC = vec3(0.80, 0.56, 0.12);
        if (mode < 0.5) centre = band(u, -0.075, 0.075, fw) * dashOn;
        else if (mode < 1.5) centre = max(band(u, -0.2, -0.08, fw), band(u, 0.08, 0.2, fw));
        else if (mode < 2.5) { centre = band(u, -0.075, 0.075, fw) * band(mod(s, uMarks.z * 2.0), 0.0, 4.0, fs + 0.02); centreC = vec3(0.78, 0.78, 0.74); }
        vec3 alb = asph;
        alb = mix(alb, vec3(0.78, 0.78, 0.74), edge * wear);
        alb = mix(alb, centreC, centre * wear);
        float paint = max(edge, centre) * wear;

        // gravel batter beyond the asphalt; an unmarked lane has a ragged, crumbling edge
        float rag = mode > 2.5 ? 0.45 + 0.35 * noise(q * vec2(2.0, 0.35)) + 0.12 * noise(q * vec2(9.0, 2.0)) : 0.0;
        float gr = smoothstep(${HALF_WIDTH.toFixed(2)} - rag, ${(HALF_WIDTH + 0.12).toFixed(2)} - rag, au);
        vec3 gravel = mix(vec3(0.24, 0.21, 0.18), vec3(0.32, 0.28, 0.24), 0.5 + 0.5 * noise(q * 9.0));
        alb = mix(alb, gravel, gr);

        // snow packed on the verge and dusted on the crown, clear in the wheel tracks
        if (uSnowCover > 0.0) {
          float dust = smoothstep(2.9, 3.9, au) * 0.8 + (1.0 - tracks) * 0.28 * (0.5 + 0.5 * mid);
          alb = mix(alb, vec3(0.70, 0.73, 0.78), uSnowCover * clamp(dust + gr, 0.0, 1.0) * (0.75 + 0.25 * agg));
        }
        float rough = mix(mix(0.62, 0.42, tracks * 0.6), 0.5, paint);
        rough = mix(rough, 0.95, gr);
        vec3 n = vec3(0.0, 1.0, 0.0);
        float shadow = cloudShadow(vec3(vW.x - uCamW.x, vW.y, vW.z - uCamW.z));
        vec3 l = uSunDir, v = -vd, h = normalize(l + v);
        float ndl = max(dot(n, l), 0.0), ndv = max(dot(n, v), 1e-3), ndh = max(dot(n, h), 0.0);
        float a = rough * rough, a2 = a * a;
        float dd = ndh * ndh * (a2 - 1.0) + 1.0;
        float D = a2 / (PI * dd * dd);
        float k = (rough + 1.0) * (rough + 1.0) / 8.0;
        float G = (ndl / (ndl * (1.0 - k) + k)) * (ndv / (ndv * (1.0 - k) + k));
        float F = 0.04 + 0.96 * pow(1.0 - max(dot(h, v), 0.0), 5.0);
        vec3 col = alb * (uSunColor * ndl * shadow + uSkyAmbient + uGroundBounce * 0.2);
        col += uSunColor * shadow * D * G * F / (4.0 * ndv + 1e-3) * (1.0 - gr);
        // grazing sky reflection gives the distant road its sheen
        float Fe = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
        col += skyLUT(reflect(vd, n)) * Fe * (1.0 - rough) * 0.6 * (1.0 - gr);
        // our low beams; painted lines carry glass beads and bounce the light back
        vec3 hl = headlights(vW, n);
        col += alb * hl + hl * 0.25 * (1.0 - rough) * (1.0 - gr);
        col += alb * hl * paint * 7.0;
        col = aerial(col, dist, vd, cameraPosition.y, vW.y);
        outColor = vec4(col, 1.0);
      }`,
  });

  const group = new THREE.Group();
  const roads = [], rails = [];
  for (const off of [PERIOD, 0, -PERIOD]) {
    const r = new THREE.Mesh(undefined, material);
    r.position.z = off;
    r.frustumCulled = false;
    const p = new THREE.Mesh(undefined, propMaterial);
    p.position.z = off;
    p.frustumCulled = false;
    roads.push(r); rails.push(p);
    group.add(r, p);
  }
  // the active route changed: rebuild the strip and its furniture
  group.rebuild = () => {
    roads[0].geometry?.dispose?.(); rails[0].geometry?.dispose?.();
    const roadGeo = roadGeometry();
    const railGeo = railGeometry();
    for (const r of roads) r.geometry = roadGeo;
    for (const p of rails) p.geometry = railGeo;
  };
  group.rebuild();
  return group;
}

// Lateral offset and half-width of the guardrail's ground shadow for a given sun.
export function railShadow(sunDir) {
  const y = Math.max(sunDir.y, 0.05);
  // project beam (0.47–0.78 m high) along the sun onto the ground; lateral is roughly world x
  const lo = RAIL_OFFSET - 0.2 - (sunDir.x * 0.47) / y;
  const hi = RAIL_OFFSET - 0.2 - (sunDir.x * 0.78) / y;
  return new THREE.Vector3((lo + hi) / 2, Math.abs(hi - lo) / 2 + 0.06, 1);
}
