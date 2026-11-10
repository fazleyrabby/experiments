/* world.js — the periodic street: wet reflective road, raised kerbs with railings, tenement facades with
   canopies, AC units and ledges, framed neon signs, lamps, signals, tram-stop islands, wires and sky.
   The street repeats every L metres. Three chunks sit side by side and the whole group is re-centred on the
   tram by whole periods, so the tram can run forever without any visible seam. */
import * as THREE from 'three';
import { mulberry32, mergeGeometries, glowTexture, Mesher, col } from './util.js';
import { createSignAtlases, cellRect } from './signs.js';

export const L = 240;          // street period (m)
export const FRONT = 10;       // z of the first building line
export const TRACK_Z = { hero: -1.6, oncoming: 1.6 };
export const WIRE_Y = 5.9;
const KERB = 0.15, ROAD_HALF = 7.4, WALK_OUT = 10.6;
const CROSSINGS = [60, 180];
const STOPS = [{ x0: 100, x1: 116, side: -1 }, { x0: 30, x1: 46, side: 1 }];

const FOG_COLOR = new THREE.Color(0.030, 0.022, 0.058);
export const FOG_DENSITY = 0.019;

export const shared = {
  uTime: { value: 0 },
  tRefl: { value: null },
  uReflM: { value: new THREE.Matrix4() },
  uCam: { value: new THREE.Vector3() },
};

const mats = (extraUniforms) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, extraUniforms]);
const FONT = '"PingFang HK","Hiragino Sans","Noto Sans CJK TC","Microsoft JhengHei",sans-serif';

/* ───────────────────────── building facades ───────────────────────── */

const BUILDING_VERT = /* glsl */`
attribute float aSeed; attribute vec3 aTint; attribute vec2 aGrid; attribute float aMod;
varying vec3 vLocal; varying vec3 vN; varying float vSeed; varying vec3 vTint; varying vec2 vGrid; varying float vMod;
#include <fog_pars_vertex>
void main(){
  vLocal = position; vN = normal; vSeed = aSeed; vTint = aTint; vGrid = aGrid; vMod = aMod;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const BUILDING_FRAG = /* glsl */`
uniform float uTime;
varying vec3 vLocal; varying vec3 vN; varying float vSeed; varying vec3 vTint; varying vec2 vGrid; varying float vMod;
#include <fog_pars_fragment>
float h11(float n){ return fract(sin(n*127.1+13.7)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }

void main(){
  vec3 N = normalize(vN);
  vec3 col = vec3(0.0);
  vec3 emis = vec3(0.0);
  float y = vLocal.y;
  float seed = vSeed;
  vec3 spillC = mix(vec3(1.0,0.15,0.55), vec3(0.1,0.7,1.0), h11(seed*5.0+0.3));
  float spill = exp(-abs(y-8.0)/7.0);

  if (N.y > 0.5) {
    col = vec3(0.035,0.04,0.045) * (0.6 + 0.8*vn(vLocal.xz*0.8));
  } else {
    bool front = abs(N.z) > 0.5;
    float u = front ? vLocal.x : vLocal.z;
    float streak = vn(vec2(u*2.3 + seed*31.0, y*0.06));
    float grime  = vn(vec2(u*0.7 + seed*7.0,  y*0.2));
    vec3 wall = vTint * (0.5 + 0.5*streak) * (0.65 + 0.5*grime);
    // rain streaks running down from each window sill
    wall *= 0.85 + 0.15*smoothstep(0.2, 0.8, vn(vec2(u*9.0, y*0.4 + seed)));
    wall *= mix(0.55, 1.0, smoothstep(0.0, 14.0, y));
    // mosaic tile cladding on some blocks
    if (h11(seed*7.0) > 0.55) {
      vec2 tg = abs(fract(vec2(u, y)*9.0) - 0.5);
      wall *= 0.86 + 0.14*step(max(tg.x, tg.y), 0.42);
      wall *= 0.9 + 0.2*h21(floor(vec2(u, y)*9.0));
    }

    if (front && y < vMod) {
      col = wall*0.7;                       // covered by the instanced facade kit
    } else if (y < 4.6 && front) {
      float bu = u/3.0 + seed*3.0;
      float bid = floor(bu);
      float bf = fract(bu);
      float t = h21(vec2(bid, seed*9.0+1.0));
      float opening = step(0.06,bf)*step(bf,0.94)*step(y,3.55)*step(0.15,y);
      vec3 inner;
      if (t < 0.34) inner = vec3(1.0,0.80,0.48)*1.5;
      else if (t < 0.58) inner = vec3(0.70,0.95,1.0)*1.35;
      else if (t < 0.72) inner = vec3(1.0,0.38,0.62)*1.15;
      else if (t < 0.90) inner = vec3(0.34,0.36,0.40)*0.55*(0.65+0.35*step(0.5,fract(y*5.0)));
      else inner = vec3(0.015);
      inner *= 0.6 + 0.6*smoothstep(0.0,3.4,y);
      // shelves, goods and silhouettes inside the shop
      float shelf = step(0.82, fract(y*1.6)) * step(t, 0.72);
      inner *= 1.0 - 0.45*shelf;
      inner *= 0.7 + 0.3*vn(vec2(u*6.0 + bid*3.0, y*2.0));
      if (t < 0.72 && h21(vec2(bid, 7.0)) > 0.5) {
        float px = fract(bu*2.3 + 0.3);
        float body = smoothstep(0.06, 0.03, abs(px - 0.5)) * step(y, 1.75) + smoothstep(0.035, 0.02, length(vec2((px-0.5)*3.0, y-1.86)*vec2(1.0,1.0)))*0.0;
        float head = step(length(vec2((px - 0.5)*3.0, (y - 1.9)*1.0)), 0.13);
        inner *= 1.0 - 0.8*clamp(body + head, 0.0, 1.0);
      }
      col = wall*0.8;
      emis = inner*opening;
    } else {
      float fh = 3.1;
      float fy = y/fh;
      float fid = floor(fy);
      float fl = fract(fy);
      float sp = vGrid.x;
      float cu = u/sp + vGrid.y;
      float cid = floor(cu);
      float fu = fract(cu);
      float r = h21(vec2(cid, fid + seed*17.0));
      float slab = 1.0 - smoothstep(0.17,0.2,fl);
      float inW = step(0.2,fu)*step(fu,0.8)*step(0.32,fl)*step(fl,0.9);
      if (y < 4.6) inW = 0.0;

      col = wall;
      col = mix(col, wall*1.25 + 0.015, slab);

      float lit = step(r, 0.40);
      vec3 lc = r < 0.18 ? vec3(1.0,0.78,0.45) : (r < 0.30 ? vec3(0.75,0.95,1.0)
              : vec3(0.45,0.6,1.0)*(0.55+0.45*h21(vec2(floor(uTime*7.0+r*40.0),cid))));
      vec3 glass = vec3(0.012,0.018,0.03) + vec3(0.02,0.03,0.05)*smoothstep(0.3,0.9,fl);
      vec3 win = lit > 0.5 ? lc*(0.85+0.3*h21(vec2(fid,cid))) : glass;
      // curtains, ceiling lamp falloff and furniture shapes inside lit flats
      if (lit > 0.5) {
        win *= 0.55 + 0.45*smoothstep(0.32, 0.85, fl);
        win *= 0.72 + 0.28*step(0.45, fract(fl*14.0))*step(0.5,h21(vec2(cid,fid)));
        float side = step(0.6, h21(vec2(cid+1.0, fid)));
        win *= 1.0 - 0.6*side*step(fu, 0.38);
      }
      // recessed reveal: darker band inside the frame
      float edge = min(min(fu-0.2, 0.8-fu)*sp, min(fl-0.32, 0.9-fl)*fh);
      win *= 0.45 + 0.55*smoothstep(0.0, 0.09, edge);
      // security grilles on some windows
      float grille = step(0.72, h21(vec2(cid*1.7, fid+seed)));
      float bars = step(0.86, fract(fu*sp*7.0)) + step(0.9, fract(fl*fh*2.2));
      win = mix(win, vec3(0.05,0.05,0.055) + win*0.15, clamp(bars,0.0,1.0)*grille);
      // window frame
      float frame = inW * (1.0 - step(0.24,fu)*step(fu,0.76)*step(0.35,fl)*step(fl,0.87));
      col = mix(col, vec3(0.05,0.05,0.055), inW);
      emis = win * (inW - frame*0.75);

      // laundry poles
      float lau = step(0.86, h21(vec2(cid+9.0, fid+seed*2.0)))*step(0.1,fu)*step(fu,0.9)*step(0.55,fl)*step(fl,0.78);
      vec3 lcol = vec3(h21(vec2(cid,seed)), h21(vec2(fid,seed+4.0)), 0.8)*0.6;
      float hang = step(0.35, fract(fu*9.0));
      col = mix(col, lcol, lau*hang*(1.0-inW));
      emis = mix(emis, emis*0.25, lau*hang*inW);

      // bamboo scaffolding on some buildings
      float scaf = step(0.87, h11(seed*3.1)) * step(y, 34.0);
      float lx = step(fract(u/1.3), 0.04);
      float ly = step(fract(y/1.55), 0.035);
      col = mix(col, vec3(0.42,0.33,0.16), max(lx,ly)*scaf*0.9);
      emis *= 1.0 - 0.35*scaf*max(lx,ly);
      // green safety netting behind scaffold
      col = mix(col, vec3(0.05,0.12,0.07), scaf*0.35);
      emis *= 1.0 - scaf*0.45;
    }
  }
  vec3 amb = vec3(0.075,0.07,0.11);
  vec3 outc = col*(amb + spillC*spill*0.55) + emis;
  gl_FragColor = vec4(outc, 1.0);
  #include <fog_fragment>
}`;

/* ───────────────────────── neon signs ───────────────────────── */

const SIGN_VERT = /* glsl */`
attribute vec2 aLocal; attribute vec4 aRect; attribute vec3 aInfo;
varying vec2 vLocal; varying vec4 vRect; varying vec3 vInfo;
#include <fog_pars_vertex>
void main(){
  vLocal = aLocal; vRect = aRect; vInfo = aInfo;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SIGN_FRAG = /* glsl */`
uniform sampler2D tAtlas; uniform float uTime;
varying vec2 vLocal; varying vec4 vRect; varying vec3 vInfo;
#include <fog_pars_fragment>
float h11(float n){ return fract(sin(n*127.1+13.7)*43758.5453); }
void main(){
  float lu = gl_FrontFacing ? vLocal.x : 1.0 - vLocal.x;
  vec2 uv = vRect.xy + vec2(lu, vLocal.y)*vRect.zw;
  vec4 t = texture2D(tAtlas, uv);
  vec3 c = t.rgb;
  if (t.a < 0.5) c = vec3(0.012, 0.01, 0.014);          // sign box backing where the panel art is transparent
  float fl = 1.0;
  if (vInfo.z > 0.5) { float n = h11(floor(uTime*9.0 + vInfo.x*50.0)); fl = n > 0.84 ? 0.22 : 1.0; }
  float pulse = 0.94 + 0.06*sin(uTime*2.0 + vInfo.x*20.0);
  gl_FragColor = vec4(c * vInfo.y * fl * pulse, 1.0);
  #include <fog_fragment>
}`;

/* ───────────────────────── wet road ───────────────────────── */

const GROUND_VERT = /* glsl */`
uniform mat4 uReflM;
varying vec4 vRefl; varying vec2 vXZ; varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vXZ = position.xz; vRefl = uReflM * wp;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const GROUND_FRAG = /* glsl */`
uniform sampler2D tRefl; uniform float uTime; uniform vec3 uCam;
varying vec4 vRefl; varying vec2 vXZ; varying vec3 vWorld;
#include <fog_pars_fragment>
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float hp(vec2 p, float per){ p.x = mod(p.x, per); return h21(p); }
float vn(vec2 p, float per){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hp(i,per),hp(i+vec2(1,0),per),f.x), mix(hp(i+vec2(0,1),per),hp(i+vec2(1,1),per),f.x), f.y); }

vec2 ripples(vec2 p){
  vec2 acc = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 1.6 : 2.7;
    vec2 q = p*sc; vec2 id = floor(q); vec2 f = fract(q) - 0.5;
    float h = h21(id + float(k)*17.0);
    float ph = fract(uTime*0.85 + h);
    vec2 c = (vec2(h21(id+3.3), h21(id+7.7)) - 0.5)*0.5;
    vec2 d = f - c; float r = length(d);
    float rad = ph*0.46;
    float w = exp(-pow((r-rad)*20.0, 2.0)) * (1.0-ph);
    acc += normalize(d + 1e-4) * w * sin((r-rad)*70.0);
  }
  return acc;
}

void main(){
  float az = abs(vXZ.y);
  bool road = az < 7.4;
  float n = vn(vXZ/6.0, 40.0)*0.55 + vn(vXZ/3.0, 80.0)*0.3 + vn(vXZ/1.5, 160.0)*0.15;
  float puddle = smoothstep(0.40, 0.62, n);

  vec3 albedo; float wet; float refl = 1.0;
  if (road) {
    albedo = vec3(0.034,0.036,0.043) * (0.8 + 0.4*h21(floor(vXZ*40.0)));
    // patched asphalt
    albedo *= 0.85 + 0.3*step(0.72, vn(vXZ/vec2(4.0, 2.0), 60.0));
    float tl = abs(az - 1.6);
    if (tl < 1.38) albedo = vec3(0.060,0.060,0.066) * (0.85 + 0.3*h21(floor(vXZ*16.0)));
    float rail = step(abs(tl - 0.533), 0.045);
    float groove = step(abs(tl - 0.533 + 0.06), 0.015);
    albedo = mix(albedo, vec3(0.30,0.31,0.33), rail);
    albedo *= 1.0 - 0.7*groove;
    refl = mix(1.0, 1.5, rail);
    float yl = step(abs(az - 3.06), 0.07);
    albedo = mix(albedo, vec3(0.55,0.43,0.07), yl);
    float dash = step(abs(az - 5.6 + 1.9), 0.06) * step(fract(vXZ.x/6.0), 0.5);
    albedo = mix(albedo, vec3(0.5,0.5,0.48), dash);
    float cw = step(60.0, vXZ.x)*step(vXZ.x, 64.5) + step(180.0, vXZ.x)*step(vXZ.x, 184.5);
    float stripe = step(mod(vXZ.y + 0.25, 1.0), 0.5) * step(3.2, az);
    albedo = mix(albedo, vec3(0.55,0.55,0.52), clamp(cw,0.0,1.0)*stripe);
    // manhole covers
    vec2 mh = vec2(mod(vXZ.x - 12.0, 24.0) - 12.0, az - 4.6);
    float mr = length(mh);
    float cover = step(mr, 0.36);
    float pat = step(0.5, fract((mh.x + mh.y)*9.0)) * 0.3 + step(abs(mr - 0.33), 0.025);
    albedo = mix(albedo, vec3(0.07,0.07,0.075)*(1.0 + pat), cover);
    refl *= 1.0 - 0.6*cover;
    // kerb-side drain grates
    float drain = step(6.95, az) * step(az, 7.35) * step(mod(vXZ.x, 12.0), 0.9);
    albedo = mix(albedo, vec3(0.01)*(1.0 + step(0.5, fract(vXZ.x*14.0))*3.0), drain);
    wet = mix(0.6, 1.0, puddle);
  } else {
    vec2 g = vXZ/0.55;
    float tile = h21(floor(g));
    albedo = vec3(0.105,0.100,0.105) * (0.75 + 0.4*tile);
    vec2 fg = abs(fract(g) - 0.5);
    albedo *= 0.55 + 0.45*smoothstep(0.0, 0.07, 0.5 - max(fg.x, fg.y));
    // tactile paving strip near the kerb at crossings
    float cw = step(59.0, vXZ.x)*step(vXZ.x, 65.5) + step(179.0, vXZ.x)*step(vXZ.x, 185.5);
    float tact = clamp(cw, 0.0, 1.0) * step(az, 8.3);
    albedo = mix(albedo, vec3(0.32,0.26,0.06)*(0.8+0.4*step(0.5, fract(vXZ.x*6.0))), tact);
    float curb = step(az, 7.65);
    albedo = mix(albedo, vec3(0.20,0.19,0.20), curb);
    wet = mix(0.38, 0.85, puddle);
  }

  vec3 V = normalize(uCam - vWorld);
  float cosT = clamp(V.y, 0.0, 1.0);
  float F = mix(0.14, 1.0, pow(1.0 - cosT, 2.5));

  vec2 rip = ripples(vXZ) * wet;
  vec2 uvR = vRefl.xy / vRefl.w;
  uvR += rip * 0.012 + (vec2(vn(vXZ*9.0, 2160.0), vn(vXZ*9.0 + 7.0, 2160.0)) - 0.5) * 0.004 * (1.0 - puddle);
  float rough = mix(0.0085, 0.0012, puddle);
  vec3 r = vec3(0.0); float ws = 0.0;
  for (int i = -3; i <= 3; i++) {
    float w = exp(-float(i*i)*0.18);
    r += textureLod(tRefl, uvR + vec2(0.0, float(i)*rough), 0.0).rgb * w;
    ws += w;
  }
  r /= ws;
  float strength = F * wet * refl * (road ? 0.95 : 0.7);
  vec3 col = albedo * vec3(0.55,0.5,0.75) + r * strength;
  col += vec3(0.5,0.6,0.8) * clamp(length(rip), 0.0, 1.0) * 0.03 * wet;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

/* ───────────────────────── sky dome ───────────────────────── */

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const SKY_FRAG = /* glsl */`
uniform float uTime; varying vec3 vDir;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 horizon = vec3(0.030,0.022,0.058);
  vec3 glow = vec3(0.12,0.045,0.10);
  vec3 zenith = vec3(0.004,0.006,0.016);
  vec3 c = mix(horizon, glow, smoothstep(0.0,0.18,h)*(1.0-smoothstep(0.18,0.6,h)));
  c = mix(c, zenith, smoothstep(0.15,0.85,h));
  vec2 p = d.xz/(d.y+0.35)*2.2 + vec2(uTime*0.02, 0.0);
  float cl = vn(p*1.3)*0.6 + vn(p*2.9)*0.4;
  c += vec3(0.10,0.05,0.09) * smoothstep(0.45,0.85,cl) * (1.0-smoothstep(0.0,0.7,h)) * 0.8;
  gl_FragColor = vec4(c, 1.0);
}`;

/* ───────────────────────── layout ───────────────────────── */

function genRow(rng, side, frontBase, hMin, hMax, wMin, wMax, depthMin, depthMax) {
  const rows = [];
  let x = 0;
  while (x < L - 0.01) {
    let w = wMin + rng() * (wMax - wMin);
    if (L - x - w < wMin) w = L - x;
    const h = hMin + Math.pow(rng(), 1.4) * (hMax - hMin);
    const depth = depthMin + rng() * (depthMax - depthMin);
    const off = rng() * 0.7;
    rows.push({
      x0: x, w, h, depth, off, side, frontBase, seed: rng() * 100,
      sp: 2.2 + Math.floor(rng() * 3) * 0.35, phase: rng(), tint: WALLS[Math.floor(rng() * WALLS.length)],
      canopy: frontBase === FRONT && rng() < 0.66,
    });
    const r = rows[rows.length - 1];
    const nb = Math.floor((r.w - 0.3) / 2.6);
    const floors = Math.min(13, Math.floor((r.h - 4.65 - 0.4) / 3.1));
    r.modTop = frontBase === FRONT && nb >= 1 && floors >= 1 ? 4.65 + floors * 3.1 : 0;
    x += w;
  }
  return rows;
}

const WALLS = [
  [0.55, 0.50, 0.45], [0.45, 0.50, 0.50], [0.60, 0.55, 0.40], [0.50, 0.42, 0.42],
  [0.38, 0.44, 0.50], [0.62, 0.60, 0.55], [0.45, 0.55, 0.45], [0.66, 0.62, 0.58], [0.42, 0.40, 0.46],
];
const zFront = (b) => b.side * (b.frontBase + b.off);

function buildingGeometry(list) {
  const geos = [];
  for (const b of list) {
    const g = new THREE.BoxGeometry(b.w - 0.08, b.h, b.depth);
    g.translate(b.x0 + b.w / 2, b.h / 2 - 0.05, b.side * (b.frontBase + b.off + b.depth / 2));
    const n = g.attributes.position.count;
    const seed = new Float32Array(n).fill(b.seed);
    const t = new Float32Array(n * 3);
    const grid = new Float32Array(n * 2);
    const mod = new Float32Array(n).fill(b.modTop || 0);
    for (let i = 0; i < n; i++) {
      t[i * 3] = b.tint[0]; t[i * 3 + 1] = b.tint[1]; t[i * 3 + 2] = b.tint[2];
      grid[i * 2] = b.sp; grid[i * 2 + 1] = b.phase;
    }
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(t, 3));
    g.setAttribute('aGrid', new THREE.BufferAttribute(grid, 2));
    g.setAttribute('aMod', new THREE.BufferAttribute(mod, 1));
    geos.push(g);
  }
  return mergeGeometries(geos);
}

/** window cell centres on the street face of a building (same grid the facade shader uses) */
function windowCells(b) {
  const out = [];
  const c0 = Math.ceil(b.x0 / b.sp + b.phase), c1 = Math.floor((b.x0 + b.w) / b.sp + b.phase) - 1;
  for (let c = c0; c <= c1; c++) {
    const uc = (c + 0.5 - b.phase) * b.sp;
    if (uc - b.sp * 0.4 > b.x0 + 0.1 && uc + b.sp * 0.4 < b.x0 + b.w - 0.1) out.push(uc);
  }
  return out;
}

function signGeometry(buildings, rng, atlases, metal) {
  const bladeV = [], bladeL = [], bladeR = [], bladeI = [];
  const flatV = [], flatL = [], flatR = [], flatI = [];
  const quad = (V, Lc, R, I, p0, p1, p2, p3, rect, info) => {
    const pts = [p0, p1, p2, p0, p2, p3];
    const loc = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
    for (let k = 0; k < 6; k++) { V.push(...pts[k]); Lc.push(...loc[k]); R.push(...rect); I.push(...info); }
  };
  const frame = col(0x22252a, 0.5);
  const T = 0.11;
  for (const b of buildings) {
    if (b.frontBase !== FRONT) continue;
    const zf = zFront(b);
    if (rng() < 0.62) {
      const idx = Math.floor(rng() * 16);
      const x = b.x0 + b.w * (0.2 + rng() * 0.6);
      const hh = 3.4 + rng() * 3.2;
      const y0 = 4.9 + rng() * 5.5;
      const y1 = y0 + hh;
      const wd = 1.0 + rng() * 0.35;
      const gap = 1.3;
      const zA = zf - b.side * gap, zB = zf - b.side * (gap + wd);
      const zmax = Math.max(zA, zB), zmin = Math.min(zA, zB);
      const rect = cellRect(idx, atlases.blade.cols, atlases.blade.rows);
      const info = [rng() * 10, 1.9 + rng() * 1.2, rng() < 0.16 ? 1 : 0];
      // two faces of the sign box
      for (const dx of [T, -T]) {
        quad(bladeV, bladeL, bladeR, bladeI, [x + dx, y0, zmax], [x + dx, y0, zmin], [x + dx, y1, zmin], [x + dx, y1, zmax], rect, info);
      }
      // box edges and the brackets that hold it off the wall
      const zc = (zA + zB) / 2;
      metal.box(x, y1 + 0.03, zc, T * 2 + 0.04, 0.06, wd, frame);
      metal.box(x, y0 - 0.03, zc, T * 2 + 0.04, 0.06, wd, frame);
      metal.box(x, (y0 + y1) / 2, zB, T * 2 + 0.04, hh + 0.12, 0.05, frame);
      metal.box(x, (y0 + y1) / 2, zA, T * 2 + 0.04, hh + 0.12, 0.05, frame);
      for (const yy of [y0 + 0.4, y1 - 0.4]) metal.box(x, yy, (zf + zA) / 2, 0.06, 0.06, gap + 0.02, frame);
      metal.strut(new THREE.Vector3(x, y1 + 0.9, zf), new THREE.Vector3(x, y1 + 0.03, zB), 0.04, frame);
    }
    // fascia: on the canopy edge where there is one, otherwise on the wall
    if (rng() < 0.75) {
      const idx = Math.floor(rng() * 16);
      const wd = Math.min(b.w - 0.6, 3.6 + rng() * 1.8);
      const xc = b.x0 + b.w / 2;
      const hh = wd / 4;
      const y0 = b.canopy ? 4.47 : 3.7 + rng() * 0.3;
      const z = b.canopy ? zf - b.side * 1.62 : zf - b.side * 0.42;
      const rect = cellRect(idx, atlases.flat.cols, atlases.flat.rows);
      const info = [rng() * 10, 1.7 + rng() * 1.0, rng() < 0.12 ? 1 : 0];
      const xl = b.side > 0 ? xc + wd / 2 : xc - wd / 2;
      const xr = b.side > 0 ? xc - wd / 2 : xc + wd / 2;
      quad(flatV, flatL, flatR, flatI, [xl, y0, z], [xr, y0, z], [xr, y0 + hh, z], [xl, y0 + hh, z], rect, info);
      metal.box(xc, y0 + hh + 0.03, z + b.side * 0.06, wd + 0.08, 0.06, 0.14, frame);
      metal.box(xc, y0 - 0.02, z + b.side * 0.06, wd + 0.08, 0.05, 0.14, frame);
    }
  }
  const mk = (V, Lc, R, I) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
    g.setAttribute('aLocal', new THREE.Float32BufferAttribute(Lc, 2));
    g.setAttribute('aRect', new THREE.Float32BufferAttribute(R, 4));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 3));
    return g;
  };
  return { blade: mk(bladeV, bladeL, bladeR, bladeI), flat: mk(flatV, flatL, flatR, flatI) };
}

function wireGeometry() {
  const pts = [];
  const seg = (a, b) => pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  for (const z of [TRACK_Z.hero, TRACK_Z.oncoming]) seg([0, WIRE_Y, z], [L, WIRE_Y, z]);
  for (let x = 10; x < L; x += 20) {
    const N = 14, ya = 9.6, sag = 0.7;
    let prev = [x, ya, -9.4];
    for (let i = 1; i <= N; i++) {
      const t = i / N;
      const p = [x, ya - sag * Math.sin(Math.PI * t), -9.4 + 18.8 * t];
      seg(prev, p); prev = p;
    }
    for (const tz of [TRACK_Z.hero, TRACK_Z.oncoming]) {
      const t = (tz + 9.4) / 18.8;
      seg([x, ya - sag * Math.sin(Math.PI * t), tz], [x, WIRE_Y, tz]);
    }
  }
  for (const z of [-8.4, 8.4, -9.2, 9.2, -9.7, 9.7]) {
    const y0 = 8.4 + (Math.abs(z) > 9 ? 1.0 : 0) + (Math.abs(z) > 9.5 ? 0.9 : 0);
    for (let x = 0; x < L; x += 30) {
      const N = 8;
      let prev = [x, y0, z];
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const p = [x + 30 * t, y0 - 0.9 * Math.sin(Math.PI * t), z];
        seg(prev, p); prev = p;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/* HK roadside railing: posts, three rails and close vertical bars */
function railing(m, x0, x1, z, y0, c) {
  const len = x1 - x0;
  const n = Math.max(1, Math.round(len / 2.4));
  const seg = len / n;
  for (let k = 0; k < n; k++) {
    const a = x0 + k * seg, b = a + seg;
    m.box(a + 0.04, y0 + 0.52, z, 0.06, 1.04, 0.06, c);
    m.box((a + b) / 2, y0 + 1.02, z, seg, 0.05, 0.05, c);
    m.box((a + b) / 2, y0 + 0.62, z, seg, 0.03, 0.03, c);
    m.box((a + b) / 2, y0 + 0.2, z, seg, 0.035, 0.035, c);
    for (let x = a + 0.22; x < b - 0.1; x += 0.2) m.box(x, y0 + 0.61, z, 0.018, 0.8, 0.018, c);
  }
  m.box(x1 - 0.04, y0 + 0.52, z, 0.06, 1.04, 0.06, c);
}

function textTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function streetFurniture(rng, near) {
  const metal = new Mesher();
  const detail = new Mesher();
  const glowM = new Mesher();
  const lampGlow = [], downGlow = [];
  const galv = col(0x9aa0a6, 0.55), pole = col(0x5a6068, 0.45), dark = col(0x1a1c20, 0.6);

  /* kerbside railings, broken for crossings, stops and random gaps */
  for (const sd of [-1, 1]) {
    let x = 0;
    while (x < L) {
      const len = 4.8 + Math.floor(rng() * 4) * 2.4;
      let x1 = Math.min(L, x + len);
      const hitsCrossing = CROSSINGS.some((c) => x1 > c - 3 && x < c + 7.5);
      if (!hitsCrossing && rng() < 0.82) railing(metal, x, x1, sd * 7.66, KERB, galv);
      x = x1 + (rng() < 0.3 ? 2.4 : 0.6);
    }
  }

  /* street lamps: tapered pole, outreach arm, shoebox luminaire */
  const poleGeo = new THREE.CylinderGeometry(0.065, 0.11, 8.4, 10);
  for (let x = 7.5; x < L; x += 30) {
    for (const sd of [-1, 1]) {
      const px = x + (sd > 0 ? 15 : 0);
      metal.geo(poleGeo, px, KERB + 4.2, sd * 8.9, pole);
      metal.strut(new THREE.Vector3(px, KERB + 8.1, sd * 8.9), new THREE.Vector3(px, KERB + 8.45, sd * 7.25), 0.07, pole);
      metal.box(px, KERB + 8.38, sd * 6.95, 0.34, 0.14, 0.75, pole);
      glowM.box(px, KERB + 8.3, sd * 6.95, 0.26, 0.02, 0.6, new THREE.Color(5.0, 3.3, 1.5));
      lampGlow.push(px, KERB + 8.15, sd * 6.95);
      metal.box(px, KERB + 0.15, sd * 8.9, 0.3, 0.3, 0.3, pole);
    }
  }

  /* traffic signals at the crossings */
  const sigPole = new THREE.CylinderGeometry(0.06, 0.07, 3.6, 8);
  for (const cx of CROSSINGS) {
    for (const sd of [-1, 1]) {
      const px = sd < 0 ? cx - 1.0 : cx + 5.5;
      metal.geo(sigPole, px, KERB + 1.8, sd * 7.85, dark);
      // vehicle head facing oncoming traffic on this side
      const face = sd < 0 ? -1 : 1;
      metal.box(px, KERB + 3.0, sd * 7.85, 0.3, 0.95, 0.32, dark);
      const lens = [[3.2, 0.15, 0.1], [0.12, 0.08, 0.02], [0.02, 0.1, 0.05]];
      for (let k = 0; k < 3; k++) glowM.box(px + face * 0.16, KERB + 3.3 - k * 0.3, sd * 7.85, 0.02, 0.2, 0.2, new THREE.Color(...lens[k]));
      // pedestrian head facing across the road, plus the yellow push-button box
      metal.box(px, KERB + 2.2, sd * 7.85, 0.32, 0.6, 0.28, dark);
      glowM.box(px, KERB + 2.32, sd * 7.85 - sd * 0.15, 0.2, 0.2, 0.02, new THREE.Color(3.0, 0.2, 0.12));
      glowM.box(px, KERB + 2.08, sd * 7.85 - sd * 0.15, 0.2, 0.2, 0.02, new THREE.Color(0.02, 0.12, 0.05));
      detail.box(px, KERB + 1.1, sd * 7.85 - sd * 0.1, 0.2, 0.32, 0.14, col(0xd9a400, 0.45));
      lampGlow.push(px + face * 0.3, KERB + 3.3, sd * 7.85);
    }
  }

  /* tram-stop islands with shelters */
  const stopTex = textTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#0e3b2a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 58px ${FONT}`; g.fillText('電車站', w / 2, 48);
    g.font = '700 26px Helvetica, Arial, sans-serif'; g.fillText('TRAM STOP · 西行 WESTBOUND', w / 2, 100);
  });
  const stopSigns = [];
  for (const s of STOPS) {
    const z0 = s.side * 3.0, z1 = s.side * 4.15, zc = (z0 + z1) / 2;
    detail.box((s.x0 + s.x1) / 2, 0.1, zc, s.x1 - s.x0, 0.2, 1.15, col(0x6d6a66, 0.16));
    detail.box((s.x0 + s.x1) / 2, 0.205, zc, s.x1 - s.x0, 0.01, 0.1, col(0xd9a400, 0.4));
    railing(metal, s.x0 + 0.3, s.x1 - 0.3, s.side * 4.05, 0.2, galv);
    for (let x = s.x0 + 1.2; x < s.x1 - 0.8; x += 4.4) metal.box(x, 1.5, s.side * 3.95, 0.08, 2.6, 0.08, col(0x1d4a36, 0.5));
    metal.box((s.x0 + s.x1) / 2, 2.82, zc, s.x1 - s.x0 - 1.4, 0.08, 1.4, col(0x1d4a36, 0.5));
    glowM.box((s.x0 + s.x1) / 2, 2.76, zc, s.x1 - s.x0 - 2.2, 0.02, 0.12, new THREE.Color(2.4, 2.4, 2.2));
    for (let x = s.x0 + 2; x < s.x1 - 1.5; x += 2.2) downGlow.push(x, 2.7, zc);
    metal.box((s.x0 + s.x1) / 2, 0.65, s.side * 3.9, s.x1 - s.x0 - 3, 0.05, 0.4, col(0x9a9ea2, 0.5));
    stopSigns.push({ x: s.x0 + 0.6, y: 2.4, z: zc });
  }

  /* building-attached details */
  for (const b of near) {
    const zf = zFront(b);
    const tintDark = new THREE.Color(b.tint[0], b.tint[1], b.tint[2]).multiplyScalar(0.085);
    // concrete shop canopy with a lit underside and downlights
    if (b.canopy) {
      const cw = 1.6;
      const under = new THREE.Color(0.55, 0.42, 0.3).multiplyScalar(0.55 + rng() * 0.4);
      detail.box(b.x0 + b.w / 2, 4.32, zf - b.side * cw / 2, b.w - 0.1, 0.24, cw, (nx, ny) => (ny < -0.5 ? under : ny > 0.5 ? col(0x0c0c0e) : tintDark));
      for (let x = b.x0 + 0.6; x < b.x0 + b.w - 0.4; x += 1.25) downGlow.push(x, 4.17, zf - b.side * cw * 0.55);
    }
    const floors = Math.floor(b.h / 3.1);
    // rooftop: water tank, stair hut, antenna
    const rz = b.side * (FRONT + b.off + 2 + rng() * (b.depth - 4));
    detail.geo(new THREE.CylinderGeometry(0.8, 0.8, 1.6, 12), b.x0 + 1.2 + rng() * (b.w - 2.4), b.h + 1.6, rz, col(0x2e3a44, 0.3));
    for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) detail.box(b.x0 + b.w * 0.3 + dx, b.h + 0.4, rz + dz, 0.08, 0.8, 0.08, col(0x222222, 0.2));
    if (rng() < 0.6) detail.box(b.x0 + b.w * 0.7, b.h + 1.2, b.side * (FRONT + b.off + b.depth * 0.6), 2.2, 2.4, 2.2, tintDark);
    if (rng() < 0.5) metal.strut(new THREE.Vector3(b.x0 + b.w * 0.5, b.h, rz), new THREE.Vector3(b.x0 + b.w * 0.5, b.h + 4 + rng() * 3, rz), 0.05, dark);
  }

  return { metal: metal.build(), detail: detail.build(), glow: glowM.build(), lampGlow, downGlow, stopTex, stopSigns };
}

export function createWorld() {
  const rng = mulberry32(1997);
  const atlases = createSignAtlases();

  const near = [
    ...genRow(rng, -1, FRONT, 18, 56, 5, 9.5, 12, 20),
    ...genRow(rng, 1, FRONT, 18, 56, 5, 9.5, 12, 20),
  ];
  const far = [
    ...genRow(rng, -1, 34, 45, 95, 8, 15, 14, 24),
    ...genRow(rng, 1, 34, 45, 95, 8, 15, 14, 24),
  ];
  const buildingGeo = buildingGeometry([...near, ...far]);
  const furn = streetFurniture(rng, near);
  const signMetal = new Mesher();
  const signs = signGeometry(near, rng, atlases, signMetal);
  const signMetalGeo = signMetal.build();
  const wires = wireGeometry();

  // ground: road at 0, raised pavements, kerb faces
  const roadGeo = new THREE.PlaneGeometry(L, ROAD_HALF * 2, 1, 1); roadGeo.rotateX(-Math.PI / 2); roadGeo.translate(L / 2, 0, 0);
  const walkW = WALK_OUT - ROAD_HALF;
  const walkGeos = [-1, 1].map((sd) => { const g = new THREE.PlaneGeometry(L, walkW, 1, 1); g.rotateX(-Math.PI / 2); g.translate(L / 2, KERB, sd * (ROAD_HALF + walkW / 2)); return g; });
  const kerb = new Mesher();
  for (const sd of [-1, 1]) kerb.box(L / 2, KERB / 2, sd * (ROAD_HALF + 0.05), L, KERB, 0.1, col(0x7a7670, 0.13));
  const kerbGeo = kerb.build();

  const buildingMat = new THREE.ShaderMaterial({ vertexShader: BUILDING_VERT, fragmentShader: BUILDING_FRAG, fog: true, uniforms: mats({ uTime: shared.uTime }) });
  buildingMat.uniforms.uTime = shared.uTime;
  const mkSignMat = (tex) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: SIGN_VERT, fragmentShader: SIGN_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: mats({ tAtlas: { value: tex }, uTime: shared.uTime }),
    });
    m.uniforms.uTime = shared.uTime;
    return m;
  };
  const bladeMat = mkSignMat(atlases.blade.tex);
  const flatMat = mkSignMat(atlases.flat.tex);
  const groundMat = new THREE.ShaderMaterial({
    vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true,
    uniforms: mats({ tRefl: shared.tRefl, uReflM: shared.uReflM, uTime: shared.uTime, uCam: shared.uCam }),
  });
  for (const k of ['tRefl', 'uReflM', 'uTime', 'uCam']) groundMat.uniforms[k] = shared[k];

  const wireMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.10, 0.11, 0.15), fog: true });
  const metalMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.75, envMapIntensity: 1.1 });
  const detailMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
  const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
  const glowTex = glowTexture(128);
  const pointsMat = (size, r, g, b) => new THREE.PointsMaterial({
    size, map: glowTex, color: new THREE.Color(r, g, b), transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: true,
  });
  const lampPts = new THREE.BufferGeometry(); lampPts.setAttribute('position', new THREE.Float32BufferAttribute(furn.lampGlow, 3));
  const downPts = new THREE.BufferGeometry(); downPts.setAttribute('position', new THREE.Float32BufferAttribute(furn.downGlow, 3));
  const lampPtsMat = pointsMat(4.5, 2.0, 1.3, 0.6);
  const downPtsMat = pointsMat(1.1, 2.2, 1.7, 1.1);

  const stopSignMat = new THREE.MeshBasicMaterial({ map: furn.stopTex, color: new THREE.Color(1.6, 1.6, 1.6), side: THREE.DoubleSide });

  const root = new THREE.Group();
  const grounds = [];
  for (let k = -1; k <= 1; k++) {
    const chunk = new THREE.Group();
    chunk.position.x = k * L;
    for (const g of [roadGeo, ...walkGeos]) {
      const m = new THREE.Mesh(g, groundMat); m.frustumCulled = false; grounds.push(m); chunk.add(m);
    }
    const add = (o) => { o.frustumCulled = false; chunk.add(o); return o; };
    add(new THREE.Mesh(kerbGeo, detailMat));
    add(new THREE.Mesh(buildingGeo, buildingMat));
    add(new THREE.Mesh(signs.blade, bladeMat));
    add(new THREE.Mesh(signs.flat, flatMat));
    add(new THREE.Mesh(signMetalGeo, metalMat));
    add(new THREE.Mesh(furn.metal, metalMat));
    add(new THREE.Mesh(furn.detail, detailMat));
    add(new THREE.Mesh(furn.glow, glowMat));
    add(new THREE.LineSegments(wires, wireMat));
    add(new THREE.Points(lampPts, lampPtsMat));
    add(new THREE.Points(downPts, downPtsMat));
    for (const s of furn.stopSigns) {
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.28), stopSignMat);
      sign.position.set(s.x, s.y, s.z); sign.rotation.y = Math.PI / 2;
      add(sign);
    }
    root.add(chunk);
  }

  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: shared.uTime },
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(340, 28, 16), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;

  return {
    root, sky, grounds, near,
    fog: new THREE.FogExp2(FOG_COLOR, FOG_DENSITY),
    fogColor: FOG_COLOR,
    setGroundVisible(v) { for (const g of grounds) g.visible = v; },
    recentre(x) { root.position.x = Math.floor(x / L) * L; },
  };
}
