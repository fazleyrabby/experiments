// GPU rain that knows what it is landing on.
//
//  - Streaks: camera-facing quads, wind-slanted, thinned under tree crowns,
//    culled under the awning and rig, and lit up when they cross a headlight
//    beam or pass near a lantern / the campfire.
//  - Splashes: re-rolled every cycle, then shaped by the surface field:
//      puddles -> crown splash with a central jet (rings are drawn by the ground shader)
//      mud     -> low, heavy, brown-tinted spatter
//      grass   -> mostly swallowed by the blades
//      roofs   -> crisp bright bounces on the rig's hood/roof rack and the awning
//      canopy  -> almost none (the crown caught the drop)
//  - Drips: big slow drops falling from tree crowns, the roof rack and awning
//    edges; they keep falling for a while after the rain stops.
//
// Everything is animated in vertex shaders around the focus point.
import * as THREE from 'three';

const MAX_OCC = 3;
const MAX_SPOTS = 3;
const MAX_LAMPS = 3;

const COMMON = /* glsl */`
  uniform float uTime;
  uniform vec3 uCenter;
  uniform vec3 uBox;
  uniform vec4 uOccA[${MAX_OCC}]; // cx, cz, cos, sin
  uniform vec4 uOccB[${MAX_OCC}]; // halfWidth, halfLength, top, enabled
  uniform vec4 uOccC[${MAX_OCC}]; // roofY front, roofY back, split lz, slope along lx
  uniform sampler2D uGround;
  uniform float uGroundExtent;
  uniform sampler2D uSurf;
  uniform float uSurfExtent;
  uniform vec3 uSpotPos[${MAX_SPOTS}];
  uniform vec3 uSpotDir[${MAX_SPOTS}];
  uniform vec4 uSpotP[${MAX_SPOTS}];   // cosOuter, range, intensity, -
  uniform vec3 uSpotColor;
  uniform vec4 uLamp[${MAX_LAMPS}];    // x, y, z, intensity
  uniform vec3 uLampColor[${MAX_LAMPS}];

  float groundAt(vec2 xz) {
    vec2 uv = xz / uGroundExtent + 0.5;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return mix(-0.32, texture2D(uGround, clamp(uv, 0.0, 1.0)).r, inside);
  }

  vec4 surfAt(vec2 xz) {
    vec2 uv = xz / uSurfExtent + 0.5;
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return texture2D(uSurf, clamp(uv, 0.0, 1.0)) * inside;
  }

  vec2 occLocal(int i, vec2 xz) {
    vec2 d = xz - uOccA[i].xy;
    return vec2(d.x * uOccA[i].z - d.y * uOccA[i].w, d.x * uOccA[i].w + d.y * uOccA[i].z);
  }

  // 1.0 when the point sits under a roof / inside a body and should not be rained on.
  float sheltered(vec3 p) {
    float hit = 0.0;
    for (int i = 0; i < ${MAX_OCC}; i++) {
      vec2 l = occLocal(i, p.xz);
      float inBox = step(abs(l.x), uOccB[i].x) * step(abs(l.y), uOccB[i].y);
      hit = max(hit, inBox * step(p.y, uOccB[i].z) * uOccB[i].w);
    }
    return hit;
  }

  // Height of the roof surface above xz, or -10 if none
  float roofAt(vec2 xz) {
    float y = -10.0;
    for (int i = 0; i < ${MAX_OCC}; i++) {
      vec2 l = occLocal(i, xz);
      float inBox = step(abs(l.x), uOccB[i].x * 0.96) * step(abs(l.y), uOccB[i].y * 0.97) * uOccB[i].w;
      float ry = (l.y > uOccC[i].z ? uOccC[i].x : uOccC[i].y) + uOccC[i].w * l.x;
      y = max(y, mix(-10.0, ry, inBox));
    }
    return y;
  }

  // Light scattered by a drop at p: headlight cones + warm point lights
  vec3 dropLight(vec3 p) {
    vec3 c = vec3(0.0);
    for (int i = 0; i < ${MAX_SPOTS}; i++) {
      vec3 d = p - uSpotPos[i];
      float dist = length(d);
      float cosA = dot(d / max(dist, 1e-3), uSpotDir[i]);
      float cone = smoothstep(uSpotP[i].x, uSpotP[i].x + 0.06, cosA);
      float fall = clamp(1.0 - dist / uSpotP[i].y, 0.0, 1.0);
      c += uSpotColor * cone * fall * fall * uSpotP[i].z;
    }
    for (int i = 0; i < ${MAX_LAMPS}; i++) {
      float dist = length(p - uLamp[i].xyz);
      c += uLampColor[i] * uLamp[i].w / (1.0 + dist * dist * 1.6);
    }
    return c;
  }

  vec2 wrapXZ(vec2 v) {
    return mod(v - uCenter.xz + 0.5 * uBox.xz, uBox.xz) - 0.5 * uBox.xz + uCenter.xz;
  }
`;

const RAIN_VERT = /* glsl */`
  ${COMMON}
  uniform vec3 uWind;
  uniform float uSpeed;
  uniform float uWidth;
  uniform float uLen;
  uniform float uFogDensity;
  uniform float uDensity;
  attribute vec4 aRand;
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vLight;

  void main() {
    float sp = uSpeed * (0.85 + 0.3 * aRand.z);
    vec3 vel = vec3(uWind.x, -sp, uWind.z);
    vec3 dir = normalize(vel);

    vec2 xz = wrapXZ(aRand.xw * uBox.xz + uWind.xz * uTime);
    float gy = groundAt(xz);
    float fall = mod(aRand.y * uBox.y - uTime * sp, uBox.y);
    vec3 p = vec3(xz.x, gy + fall, xz.y);

    float len = uLen * (0.6 + 0.8 * fract(aRand.z * 7.13));
    vec3 tail = p - dir * len;
    vec3 mid = mix(tail, p, position.y);

    vec3 toCam = cameraPosition - mid;
    float dist = length(toCam);
    vec3 side = normalize(cross(dir, toCam));
    float w = uWidth * (0.7 + 0.6 * fract(aRand.z * 3.7)) * (1.0 + dist * 0.045);
    vec3 world = mid + side * position.x * w;

    // Tree crowns catch most of the rain below them
    float canopy = surfAt(xz).b;
    float underCrown = step(fract(aRand.z * 53.17), canopy * 0.8) * step(p.y, 7.5);
    // Intensity swell: drop instances in and out instead of popping
    float keep = step(fract(aRand.x * 91.7 + aRand.w * 13.1), uDensity);

    float hidden = max(sheltered(p), underCrown);
    float fogFade = exp(-pow(dist * uFogDensity, 2.0));
    float nearFade = smoothstep(0.9, 3.6, dist);
    vLight = dropLight(p);
    float lit = min(2.5, dot(vLight, vec3(0.33)));
    vAlpha = (1.0 - hidden) * keep * fogFade * nearFade * (0.5 + 0.5 * fract(aRand.z * 11.3)) * (1.0 + lit * 0.8);
    vUv = vec2(position.x + 0.5, position.y);

    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
    if (hidden > 0.5 || keep < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const RAIN_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vAlpha;
  varying vec3 vLight;

  void main() {
    float tail = pow(smoothstep(0.0, 1.0, vUv.y), 1.5);
    float across = 1.0 - pow(abs(vUv.x * 2.0 - 1.0), 2.0);
    float head = 1.0 + 0.7 * smoothstep(0.8, 1.0, vUv.y);
    float a = tail * across * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4((uColor + vLight) * head, min(a, 1.0));
  }
`;

const SPLASH_VERT = /* glsl */`
  ${COMMON}
  uniform float uPointScale;
  uniform float uSize;
  uniform float uFogDensity;
  uniform float uFill;
  uniform float uDensity;
  uniform vec3 uColor;
  attribute vec3 aCenter; // x, z, period
  attribute vec4 aDrop;   // angle, speed, phase, index
  varying float vAlpha;
  varying vec3 vCol;

  float h1(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float life = 0.42;
    float cyc = uTime / aCenter.z + aDrop.z;
    float tt = fract(cyc) * aCenter.z;
    float seedId = floor(cyc) + aDrop.z * 91.7;

    // Re-roll the spot each cycle so splashes keep landing in new places
    vec2 jitter = vec2(h1(seedId * 12.9898 + aCenter.x * 7.0), h1(seedId * 78.233 + aCenter.y * 5.0));
    vec2 xz = wrapXZ(aCenter.xy * uBox.xz + jitter * 4.0);
    float gy = groundAt(xz);
    float roof = roofAt(xz);
    float onRoof = step(gy + 0.25, roof);
    vec4 surf = surfAt(xz) * (1.0 - onRoof);
    float water = smoothstep(1.0 - uFill, 1.0 - uFill + 0.1, surf.g);
    float mud = smoothstep(0.15, 0.6, surf.r) * (1.0 - water);
    float grass = (1.0 - water) * (1.0 - mud) * (1.0 - onRoof);
    float canopyCull = step(h1(seedId * 3.7 + aCenter.x), surf.b * 0.9);

    float upMul = onRoof * 1.15 + water * 1.05 + mud * 0.5 + grass * 0.55;
    float outMul = onRoof * 0.8 + water * 0.38 + mud * 0.55 + grass * 0.45;
    float alphaMul = onRoof * 1.0 + water * 1.0 + mud * 0.85 + grass * 0.22;

    float up = aDrop.y * upMul;
    vec2 out2 = vec2(cos(aDrop.x), sin(aDrop.x)) * aDrop.y * outMul;
    // Puddles throw a little central jet (Worthington jet)
    float jet = water * step(aDrop.w, 0.5);
    out2 *= 1.0 - jet;
    up *= 1.0 + jet * 0.45;

    float baseY = mix(gy, roof, onRoof) + 0.015;
    vec3 p = vec3(xz.x + out2.x * tt, baseY + up * tt - 7.8 * tt * tt, xz.y + out2.y * tt);

    float alive = step(tt, life) * step(baseY - 0.02, p.y);
    float fade = 1.0 - tt / life;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    float underRoof = sheltered(vec3(xz.x, baseY + 0.05, xz.y)) * (1.0 - onRoof);
    float keep = step(fract(aCenter.x * 37.1 + aCenter.y * 11.7), uDensity);
    float fogFade = exp(-pow(dist * uFogDensity, 2.0));
    vec3 lightC = dropLight(p);
    vAlpha = alive * fade * (1.0 - underRoof) * (1.0 - canopyCull) * keep * alphaMul * fogFade * smoothstep(0.4, 1.4, dist);
    vCol = mix(uColor, uColor * vec3(0.72, 0.58, 0.44), mud) + lightC;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, uSize * (1.0 + water * 0.25 + onRoof * 0.15) * uPointScale / max(dist, 0.1));
  }
`;

const SPLASH_FRAG = /* glsl */`
  uniform float uOpacity;
  varying float vAlpha;
  varying vec3 vCol;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float a = (1.0 - smoothstep(0.35, 1.0, d)) * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vCol, a);
  }
`;

const DRIP_VERT = /* glsl */`
  ${COMMON}
  uniform float uFogDensity;
  uniform float uDripRate;
  attribute vec3 aSrc;
  attribute vec4 aParam; // period, phase, rand, groundY
  varying float vAlpha;
  varying vec2 vUv;
  varying vec3 vLight;

  float h1(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float period = aParam.x;
    float cyc = uTime / period + aParam.y;
    float t = fract(cyc) * period;
    float id = floor(cyc) + aParam.z * 71.3;
    // A different drop forms each time, a little off the last one
    vec3 src = aSrc + vec3(h1(id * 1.7) - 0.5, 0.0, h1(id * 2.9) - 0.5) * 0.22;
    float v = 9.8 * t;
    float y = src.y - 4.9 * t * t;
    float alive = step(aParam.w, y) * step(h1(id * 5.3 + aParam.z), uDripRate);
    vec3 p = vec3(src.x, y, src.z);

    float len = clamp(v * 0.022, 0.02, 0.28);
    vec3 mid = p + vec3(0.0, len * (1.0 - position.y), 0.0);
    vec3 toCam = cameraPosition - mid;
    float dist = length(toCam);
    vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    float w = 0.013 * (1.0 + dist * 0.04);
    vec3 world = mid + side * position.x * w;

    vLight = dropLight(p);
    float fogFade = exp(-pow(dist * uFogDensity, 2.0));
    vAlpha = alive * fogFade * smoothstep(0.4, 1.4, dist) * (1.0 + min(2.0, dot(vLight, vec3(0.33))) * 1.5);
    vUv = vec2(position.x + 0.5, position.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
    if (alive < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const DRIP_FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying vec2 vUv;
  varying vec3 vLight;
  void main() {
    float across = 1.0 - pow(abs(vUv.x * 2.0 - 1.0), 2.0);
    float head = smoothstep(0.0, 0.35, vUv.y) * (0.6 + 0.6 * smoothstep(0.7, 1.0, vUv.y));
    float a = across * head * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4((uColor * 1.15 + vLight), min(a, 1.0));
  }
`;

export function createRain({ isMobile = false } = {}) {
  const group = new THREE.Group();
  group.name = 'Rain';

  const maxDrops = isMobile ? 9000 : 26000;
  const maxSplashes = isMobile ? 260 : 900;
  const DROPS_PER_SPLASH = 5;
  const box = new THREE.Vector3(30, 18, 30);

  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
  blank.needsUpdate = true;
  const groundTex = new THREE.DataTexture(new Float32Array([0]), 1, 1, THREE.RedFormat, THREE.FloatType);
  groundTex.needsUpdate = true;
  const shared = {
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector3() },
    uBox: { value: box },
    uOccA: { value: Array.from({ length: MAX_OCC }, () => new THREE.Vector4(0, 0, 1, 0)) },
    uOccB: { value: Array.from({ length: MAX_OCC }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uOccC: { value: Array.from({ length: MAX_OCC }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uGround: { value: groundTex },
    uGroundExtent: { value: 40 },
    uSurf: { value: blank },
    uSurfExtent: { value: 44 },
    uSpotPos: { value: Array.from({ length: MAX_SPOTS }, () => new THREE.Vector3()) },
    uSpotDir: { value: Array.from({ length: MAX_SPOTS }, () => new THREE.Vector3(0, -1, 0)) },
    uSpotP: { value: Array.from({ length: MAX_SPOTS }, () => new THREE.Vector4(1, 1, 0, 0)) },
    uSpotColor: { value: new THREE.Color(0xfff0d0) },
    uLamp: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Vector4(0, -100, 0, 0)) },
    uLampColor: { value: Array.from({ length: MAX_LAMPS }, () => new THREE.Color(0xffb060)) },
    uFogDensity: { value: 0.03 },
    uColor: { value: new THREE.Color(0xcfe3ee) },
    uOpacity: { value: 0 },
    uDensity: { value: 1 }
  };

  // Streaks ----------------------------------------------------------------
  const quad = new THREE.PlaneGeometry(1, 1);
  quad.translate(0, 0.5, 0);
  const rainGeo = new THREE.InstancedBufferGeometry();
  rainGeo.index = quad.index;
  rainGeo.setAttribute('position', quad.attributes.position);
  const rand = new Float32Array(maxDrops * 4);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  rainGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
  rainGeo.instanceCount = 0;

  const rainMat = new THREE.ShaderMaterial({
    vertexShader: RAIN_VERT,
    fragmentShader: RAIN_FRAG,
    uniforms: {
      ...shared,
      uWind: { value: new THREE.Vector3() },
      uSpeed: { value: 28 },
      uWidth: { value: 0.0095 },
      uLen: { value: 0.7 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const rainMesh = new THREE.Mesh(rainGeo, rainMat);
  rainMesh.frustumCulled = false;
  rainMesh.renderOrder = 8;
  group.add(rainMesh);

  // Splash sprays ----------------------------------------------------------
  const splashGeo = new THREE.BufferGeometry();
  const total = maxSplashes * DROPS_PER_SPLASH;
  const aCenter = new Float32Array(total * 3);
  const aDrop = new Float32Array(total * 4);
  const dummyPos = new Float32Array(total * 3);
  for (let s = 0; s < maxSplashes; s++) {
    const cx = Math.random();
    const cz = Math.random();
    const period = 0.3 + Math.random() * 0.5;
    const phase = Math.random();
    for (let d = 0; d < DROPS_PER_SPLASH; d++) {
      const i = s * DROPS_PER_SPLASH + d;
      aCenter[i * 3] = cx;
      aCenter[i * 3 + 1] = cz;
      aCenter[i * 3 + 2] = period;
      aDrop[i * 4] = (d / DROPS_PER_SPLASH) * Math.PI * 2 + Math.random() * 1.2;
      aDrop[i * 4 + 1] = 0.8 + Math.random() * 0.9;
      aDrop[i * 4 + 2] = phase;
      aDrop[i * 4 + 3] = d;
    }
  }
  splashGeo.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
  splashGeo.setAttribute('aCenter', new THREE.BufferAttribute(aCenter, 3));
  splashGeo.setAttribute('aDrop', new THREE.BufferAttribute(aDrop, 4));
  splashGeo.setDrawRange(0, 0);

  const splashMat = new THREE.ShaderMaterial({
    vertexShader: SPLASH_VERT,
    fragmentShader: SPLASH_FRAG,
    uniforms: {
      ...shared,
      uBox: { value: new THREE.Vector3(18, 18, 18) },
      uPointScale: { value: 600 },
      uSize: { value: 0.024 },
      uFill: { value: 0.8 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const splashPoints = new THREE.Points(splashGeo, splashMat);
  splashPoints.frustumCulled = false;
  splashPoints.renderOrder = 8;
  group.add(splashPoints);

  // Drips (built when sources are supplied) ---------------------------------
  const dripGroup = new THREE.Group();
  dripGroup.name = 'Drips';
  const dripMat = new THREE.ShaderMaterial({
    vertexShader: DRIP_VERT,
    fragmentShader: DRIP_FRAG,
    uniforms: { ...shared, uDripRate: { value: 0 }, uOpacity: { value: 0.8 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  let dripMesh = null;

  function setDripSources(sources, getHeight) {
    if (dripMesh) { dripGroup.remove(dripMesh); dripMesh.geometry.dispose(); }
    const per = 2;
    const n = sources.length * per;
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index;
    g.setAttribute('position', quad.attributes.position);
    const src = new Float32Array(n * 3);
    const prm = new Float32Array(n * 4);
    sources.forEach((s, i) => {
      for (let k = 0; k < per; k++) {
        const j = i * per + k;
        src[j * 3] = s.x; src[j * 3 + 1] = s.y; src[j * 3 + 2] = s.z;
        prm[j * 4] = s.period ? s.period * (0.8 + Math.random() * 0.4) : 1.4 + Math.random() * 3.2;
        prm[j * 4 + 1] = Math.random();
        prm[j * 4 + 2] = Math.random();
        prm[j * 4 + 3] = s.groundY !== undefined ? s.groundY : (getHeight ? getHeight(s.x, s.z) : 0);
      }
    });
    g.setAttribute('aSrc', new THREE.InstancedBufferAttribute(src, 3));
    g.setAttribute('aParam', new THREE.InstancedBufferAttribute(prm, 4));
    g.instanceCount = n;
    dripMesh = new THREE.Mesh(g, dripMat);
    dripMesh.frustumCulled = false;
    dripMesh.renderOrder = 8;
    dripGroup.add(dripMesh);
  }

  // Public API -------------------------------------------------------------
  function setGroundSampler(getHeight, size = 192, extent = 40) {
    const data = new Float32Array(size * size);
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const x = ((i + 0.5) / size - 0.5) * extent;
        const z = ((j + 0.5) / size - 0.5) * extent;
        data[j * size + i] = getHeight(x, z);
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.FloatType);
    tex.minFilter = tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    shared.uGround.value = tex;
    shared.uGroundExtent.value = extent;
  }

  function setSurface(texture, extent) {
    shared.uSurf.value = texture;
    shared.uSurfExtent.value = extent;
  }

  // boxes: [{ x, z, rot, hw, hl, top, roofFront, roofBack, split, slope }]
  function setOccluders(boxes) {
    for (let i = 0; i < MAX_OCC; i++) {
      const b = boxes[i];
      if (!b) { shared.uOccB.value[i].set(0, 0, 0, 0); continue; }
      shared.uOccA.value[i].set(b.x, b.z, Math.cos(b.rot || 0), Math.sin(b.rot || 0));
      shared.uOccB.value[i].set(b.hw, b.hl, b.top, 1);
      const rf = b.roofFront ?? b.top;
      shared.uOccC.value[i].set(rf, b.roofBack ?? rf, b.split ?? 0, b.slope ?? 0);
    }
  }

  // spots: [{ pos, dir, cos, range, intensity }], lamps: [{ pos, intensity, color }]
  function setLights(spots = [], lamps = []) {
    for (let i = 0; i < MAX_SPOTS; i++) {
      const s = spots[i];
      if (!s) { shared.uSpotP.value[i].set(1, 1, 0, 0); continue; }
      shared.uSpotPos.value[i].copy(s.pos);
      shared.uSpotDir.value[i].copy(s.dir).normalize();
      shared.uSpotP.value[i].set(s.cos, s.range, s.intensity, 0);
    }
    for (let i = 0; i < MAX_LAMPS; i++) {
      const l = lamps[i];
      if (!l) { shared.uLamp.value[i].set(0, -100, 0, 0); continue; }
      shared.uLamp.value[i].set(l.pos.x, l.pos.y, l.pos.z, l.intensity);
      if (l.color) shared.uLampColor.value[i].copy(l.color);
    }
  }

  const tint = new THREE.Color();
  function update(time, {
    focus, density, opacity, fallSpeed, windStrength, fogDensity, fogColor,
    viewportHeight, fov, wetness = 1, swell = 1, dripRate = 0
  }) {
    shared.uTime.value = time;
    if (focus) shared.uCenter.value.copy(focus);

    // Scene fog colour, lifted so streaks read against the dark forest
    if (fogColor) tint.copy(fogColor).multiplyScalar(1.45).addScalar(0.07);
    shared.uColor.value.copy(tint);
    shared.uFogDensity.value = fogDensity ?? 0.03;

    dripMat.uniforms.uDripRate.value = dripRate;
    dripGroup.visible = dripRate > 0.01 && !!dripMesh;

    const visible = opacity > 0.01 && density > 0;
    rainMesh.visible = splashPoints.visible = visible;
    if (!visible) return;

    const drops = Math.min(density, maxDrops);
    rainGeo.instanceCount = drops;
    shared.uDensity.value = swell;
    rainMat.uniforms.uSpeed.value = fallSpeed;
    rainMat.uniforms.uWind.value.set(windStrength * 3.6, 0, windStrength * 1.9);
    const heavy = THREE.MathUtils.clamp(fallSpeed / 31, 0.4, 1);
    rainMat.uniforms.uLen.value = 0.28 + heavy * 0.34;
    rainMat.uniforms.uWidth.value = 0.0065 + heavy * 0.0038;

    const splashes = Math.min(maxSplashes, Math.floor(drops * 0.036));
    splashGeo.setDrawRange(0, splashes * DROPS_PER_SPLASH);
    splashMat.uniforms.uFill.value = 0.12 + 0.72 * wetness;

    shared.uOpacity.value = Math.min(1, opacity * 1.15);

    const tanHalf = Math.tan(THREE.MathUtils.degToRad((fov || 60) * 0.5));
    splashMat.uniforms.uPointScale.value = (viewportHeight || 720) / (2 * tanHalf);
  }

  group.add(dripGroup);
  return { group, update, setGroundSampler, setOccluders, setSurface, setLights, setDripSources };
}
