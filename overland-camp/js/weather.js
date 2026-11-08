// Dynamic weather: overcast downpour, drizzle, moonlit night, dawn and sun.
// Includes a procedural cloud sky, PMREM environment reflections, mist, rain,
// splashes, fireflies, stars, moon/sun discs and lightning.
import * as THREE from 'three';
import { getSoftDotTexture, getMistTexture } from './textures.js';
import { createRain } from './rain.js';

export function createWeatherSystem(scene, renderer) {
  const weatherGroup = new THREE.Group();
  weatherGroup.name = 'WeatherSystem';

  // --- Presets -------------------------------------------------------------
  const PRESETS = {
    heavyRain: {
      name: 'Heavy Rain',
      skyTop: 0x4a5762,
      skyBottom: 0x98a4ab,
      fogColor: 0x7c888f,
      fogDensity: 0.026,
      sunColor: 0xbdcdd6,
      sunIntensity: 1.6,
      sunPos: new THREE.Vector3(7, 15, 9),
      hemiSky: 0x8f9ca6,
      hemiGround: 0x3a4332,
      hemiIntensity: 1.28,
      rainCount: 14500,
      rainSpeed: 31,
      windStrength: 0.68,
      wetness: 1.0,
      fireflies: false,
      stars: false,
      lightningChance: 0.00045,
      cloudCoverage: 0.9,
      cloudOpacity: 0.93,
      cloudColor: 0x4c565e,
      cloudLight: 0x9aa4ac,
      sunGlow: 0.22,
      sunDisc: 0.0,
      moon: 0.0,
      mist: 0.14,
      exposure: 1.12
    },
    lightRain: {
      name: 'Light Rain',
      skyTop: 0x5c7183,
      skyBottom: 0xa7b6c0,
      fogColor: 0x8b99a2,
      fogDensity: 0.018,
      sunColor: 0xc8d8e2,
      sunIntensity: 1.7,
      sunPos: new THREE.Vector3(9, 17, 10),
      hemiSky: 0xa5b4be,
      hemiGround: 0x44503a,
      hemiIntensity: 1.15,
      rainCount: 4800,
      rainSpeed: 19,
      windStrength: 0.3,
      wetness: 0.72,
      fireflies: false,
      stars: false,
      lightningChance: 0.0,
      cloudCoverage: 0.62,
      cloudOpacity: 0.72,
      cloudColor: 0x76848d,
      cloudLight: 0xd4dde2,
      sunGlow: 0.42,
      sunDisc: 0.25,
      moon: 0.0,
      mist: 0.09,
      exposure: 1.08
    },
    moonlitNight: {
      name: 'Moonlit Night',
      skyTop: 0x04070f,
      skyBottom: 0x101a2b,
      fogColor: 0x0a1120,
      fogDensity: 0.018,
      sunColor: 0x9ec5ff,
      sunIntensity: 0.85,
      sunPos: new THREE.Vector3(-14, 20, -12),
      hemiSky: 0x1a2a46,
      hemiGround: 0x080e0a,
      hemiIntensity: 0.58,
      rainCount: 0,
      rainSpeed: 0,
      windStrength: 0.2,
      wetness: 0.35,
      fireflies: true,
      stars: true,
      lightningChance: 0.0,
      cloudCoverage: 0.36,
      cloudOpacity: 0.55,
      cloudColor: 0x0a101c,
      cloudLight: 0x243349,
      sunGlow: 0.35,
      sunDisc: 0.0,
      moon: 1.0,
      mist: 0.055,
      exposure: 1.12
    },
    dawn: {
      name: 'Dawn',
      skyTop: 0x3d4f86,
      skyBottom: 0xf3ac7d,
      fogColor: 0x8f7478,
      fogDensity: 0.018,
      sunColor: 0xffc08a,
      sunIntensity: 3.2,
      sunPos: new THREE.Vector3(16, 12, 14),
      hemiSky: 0xa6a0c4,
      hemiGround: 0x454a2e,
      hemiIntensity: 1.5,
      rainCount: 0,
      rainSpeed: 0,
      windStrength: 0.24,
      wetness: 0.45,
      fireflies: false,
      stars: false,
      lightningChance: 0.0,
      cloudCoverage: 0.5,
      cloudOpacity: 0.62,
      cloudColor: 0x9b7c86,
      cloudLight: 0xffd6b8,
      sunGlow: 1.0,
      sunDisc: 0.95,
      moon: 0.0,
      mist: 0.11,
      exposure: 1.3
    },
    sunny: {
      name: 'Sunny',
      skyTop: 0x2f79bd,
      skyBottom: 0xa9d5f0,
      fogColor: 0x9dc2d9,
      fogDensity: 0.0085,
      sunColor: 0xffedc8,
      sunIntensity: 3.4,
      sunPos: new THREE.Vector3(13, 22, 11),
      hemiSky: 0xa8d4f4,
      hemiGround: 0x46512f,
      hemiIntensity: 0.92,
      rainCount: 0,
      rainSpeed: 0,
      windStrength: 0.28,
      wetness: 0.05,
      fireflies: false,
      stars: false,
      lightningChance: 0.0,
      cloudCoverage: 0.34,
      cloudOpacity: 0.48,
      cloudColor: 0xe7eef2,
      cloudLight: 0xffffff,
      sunGlow: 0.55,
      sunDisc: 1.0,
      moon: 0.0,
      mist: 0.0,
      exposure: 1.0
    }
  };

  let currentWeatherKey = 'heavyRain';
  let targetWeatherKey = 'heavyRain';
  let lerpT = 1.0;

  // --- Sky dome ------------------------------------------------------------
  const skyGeo = new THREE.SphereGeometry(70, 40, 26);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(PRESETS.heavyRain.skyTop) },
      bottomColor: { value: new THREE.Color(PRESETS.heavyRain.skyBottom) },
      cloudColor: { value: new THREE.Color(PRESETS.heavyRain.cloudColor) },
      cloudLight: { value: new THREE.Color(PRESETS.heavyRain.cloudLight) },
      sunColor: { value: new THREE.Color(PRESETS.heavyRain.sunColor) },
      sunDir: { value: PRESETS.heavyRain.sunPos.clone().normalize() },
      cloudCoverage: { value: PRESETS.heavyRain.cloudCoverage },
      cloudOpacity: { value: PRESETS.heavyRain.cloudOpacity },
      sunGlow: { value: PRESETS.heavyRain.sunGlow },
      uTime: { value: 0 },
      offset: { value: 8.0 },
      exponent: { value: 0.6 }
    },
    vertexShader: /* glsl */`
      varying vec3 vWorldPosition;
      varying vec3 vDir;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 cloudColor;
      uniform vec3 cloudLight;
      uniform vec3 sunColor;
      uniform vec3 sunDir;
      uniform float cloudCoverage;
      uniform float cloudOpacity;
      uniform float sunGlow;
      uniform float uTime;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      varying vec3 vDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += noise(p) * a;
          p = p * 2.03 + 11.7;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);
        float h = max(dir.y, 0.0);

        // Sky gradient
        vec3 sky = mix(bottomColor, topColor, pow(h, exponent));

        // Sun / moon halo
        float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
        sky += sunColor * pow(sunDot, 260.0) * sunGlow * 2.4;
        sky += sunColor * pow(sunDot, 9.0) * sunGlow * 0.12;

        // Layered clouds projected onto the sky dome
        if (dir.y > 0.008) {
          vec2 uv1 = dir.xz / (dir.y + 0.18);
          vec2 uv2 = dir.xz / (dir.y + 0.35);
          float n1 = fbm(uv1 * 0.55 + vec2(uTime * 0.0035, uTime * 0.0012));
          float n2 = fbm(uv2 * 1.05 - vec2(uTime * 0.005, 0.0));
          float n = n1 * 0.68 + n2 * 0.32;
          float threshold = mix(0.66, 0.3, cloudCoverage);
          float cover = smoothstep(threshold, threshold + 0.24, n);
          cover *= smoothstep(0.0, 0.18, dir.y);
          vec3 cloudShade = mix(cloudColor, cloudLight, smoothstep(0.3, 0.85, n));
          // Sunlit cloud edges
          cloudShade += sunColor * pow(sunDot, 6.0) * 0.15;
          sky = mix(sky, cloudShade, cover * cloudOpacity);
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.frustumCulled = false;
  weatherGroup.add(skyDome);

  // --- Stars ---------------------------------------------------------------
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1800;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 66.0;
    const sinPhi = Math.sin(phi);
    starPositions[i * 3] = r * sinPhi * Math.cos(theta);
    starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
    starPositions[i * 3 + 2] = r * sinPhi * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    map: getSoftDotTexture(),
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const starField = new THREE.Points(starGeo, starMat);
  weatherGroup.add(starField);

  const dotTex = getSoftDotTexture();

  // Moon + sun discs (sprites so they read through the sky shader)
  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTex,
    color: 0xdce9ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  moonSprite.scale.set(7.5, 7.5, 1);
  weatherGroup.add(moonSprite);

  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dotTex,
    color: 0xffd69a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  }));
  sunSprite.scale.set(11, 11, 1);
  weatherGroup.add(sunSprite);

  // --- Lights --------------------------------------------------------------
  const sunLight = new THREE.DirectionalLight(PRESETS.heavyRain.sunColor, PRESETS.heavyRain.sunIntensity);
  sunLight.position.copy(PRESETS.heavyRain.sunPos);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 16;
  sunLight.shadow.camera.top = 16;
  sunLight.shadow.camera.bottom = -16;
  sunLight.shadow.bias = -0.0008;
  sunLight.shadow.normalBias = 0.025;
  scene.add(sunLight);

  const hemiLight = new THREE.HemisphereLight(
    PRESETS.heavyRain.hemiSky,
    PRESETS.heavyRain.hemiGround,
    PRESETS.heavyRain.hemiIntensity
  );
  scene.add(hemiLight);

  // A soft fill from the sky opposite the sun keeps shadowed surfaces readable
  const fillLight = new THREE.DirectionalLight(0x93a6b4, 0.35);
  fillLight.position.set(-8, 9, -10);
  scene.add(fillLight);

  // Sky bounce from the camera side so the front of the rig stays readable
  // (merged into the hemisphere light: every extra light is paid per pixel)
  const frontFill = { color: new THREE.Color(), intensity: 0 };

  scene.fog = new THREE.FogExp2(PRESETS.heavyRain.fogColor, PRESETS.heavyRain.fogDensity);

  // --- Environment reflections --------------------------------------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envCache = new Map();

  function buildEnvTexture(key) {
    const p = PRESETS[key];
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const toHex = (num) => `#${num.toString(16).padStart(6, '0')}`;
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, toHex(p.skyTop));
    grad.addColorStop(0.5, toHex(p.skyBottom));
    grad.addColorStop(0.58, toHex(p.fogColor));
    grad.addColorStop(0.64, toHex(p.fogColor));
    grad.addColorStop(1, '#20261f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);

    // Sun/moon hotspot
    const dir = p.sunPos.clone().normalize();
    const u = (Math.atan2(dir.x, dir.z) / (Math.PI * 2) + 0.5) * 256;
    const v = (0.5 - Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)) / Math.PI) * 128;
    const glow = ctx.createRadialGradient(u, v, 0, u, v, 40);
    const glowColor = p.moon > 0.5 ? '190,215,255' : '255,235,200';
    glow.addColorStop(0, `rgba(${glowColor},0.9)`);
    glow.addColorStop(0.25, `rgba(${glowColor},0.35)`);
    glow.addColorStop(1, `rgba(${glowColor},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 128);

    // Horizon haze band
    const haze = ctx.createLinearGradient(0, 60, 0, 90);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(0.5, `rgba(255,255,255,${p.rainCount > 0 ? 0.12 : 0.05})`);
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 60, 256, 30);

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    const rt = pmrem.fromEquirectangular(tex);
    tex.dispose();
    return rt.texture;
  }

  function applyEnvironment(key) {
    if (!envCache.has(key)) envCache.set(key, buildEnvTexture(key));
    scene.environment = envCache.get(key);
  }
  applyEnvironment('heavyRain');

  // --- Rain ----------------------------------------------------------------
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  const rain = createRain({ isMobile });
  weatherGroup.add(rain.group);

  // --- Ground mist --------------------------------------------------------
  const mistTex = getMistTexture();
  const mistSprites = [];
  for (let i = 0; i < 16; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mistTex,
      color: 0xc8d4da,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 22;
    const s = 9 + Math.random() * 13;
    sprite.scale.set(s, s * 0.45, 1);
    sprite.position.set(Math.cos(angle) * radius, 0.4 + Math.random() * 2.6, Math.sin(angle) * radius);
    sprite.userData = { phase: Math.random() * 10, baseX: sprite.position.x, baseZ: sprite.position.z };
    weatherGroup.add(sprite);
    mistSprites.push(sprite);
  }

  // --- Fireflies -----------------------------------------------------------
  const fireflyCount = 130;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyPos = new Float32Array(fireflyCount * 3);
  const fireflyData = [];
  for (let i = 0; i < fireflyCount; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = 0.3 + Math.random() * 1.9;
    const z = (Math.random() - 0.5) * 20;
    fireflyPos[i * 3] = x;
    fireflyPos[i * 3 + 1] = y;
    fireflyPos[i * 3 + 2] = z;
    fireflyData.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.5 });
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
  const fireflyMat = new THREE.PointsMaterial({
    map: dotTex,
    color: 0xcaff86,
    size: 0.2,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const fireflyPoints = new THREE.Points(fireflyGeo, fireflyMat);
  weatherGroup.add(fireflyPoints);

  // --- Lightning -----------------------------------------------------------
  let lightningTimer = 0;
  let flashBoost = 0;
  let swell = 1;
  let dripLevel = 1;

  // --- Interpolated state --------------------------------------------------
  const p0 = PRESETS.heavyRain;
  const activeParams = {
    skyTop: new THREE.Color(p0.skyTop),
    skyBottom: new THREE.Color(p0.skyBottom),
    fogColor: new THREE.Color(p0.fogColor),
    fogDensity: p0.fogDensity,
    sunColor: new THREE.Color(p0.sunColor),
    sunIntensity: p0.sunIntensity,
    sunPos: p0.sunPos.clone(),
    hemiSky: new THREE.Color(p0.hemiSky),
    hemiGround: new THREE.Color(p0.hemiGround),
    hemiIntensity: p0.hemiIntensity,
    rainOpacity: 0.46,
    windStrength: p0.windStrength,
    wetness: p0.wetness,
    starsOpacity: 0,
    firefliesOpacity: 0,
    mistOpacity: p0.mist,
    cloudCoverage: p0.cloudCoverage,
    cloudOpacity: p0.cloudOpacity,
    cloudColor: new THREE.Color(p0.cloudColor),
    cloudLight: new THREE.Color(p0.cloudLight),
    sunGlow: p0.sunGlow,
    sunDisc: p0.sunDisc,
    moon: p0.moon,
    exposure: p0.exposure
  };

  return {
    group: weatherGroup,
    rain,
    getWeatherKey: () => targetWeatherKey,
    getSwell: () => swell,
    getRainOpacity: () => activeParams.rainOpacity,
    getWetness: () => activeParams.wetness,
    getPreset: (key) => PRESETS[key] || PRESETS.heavyRain,
    setWeather: (key) => {
      if (!PRESETS[key]) return;
      targetWeatherKey = key;
      lerpT = 0;
      applyEnvironment(key);
    },
    update: (time, delta, callbacks = {}, focus = null) => {
      // 1. Blend presets
      if (lerpT < 1.0) {
        lerpT = Math.min(1.0, lerpT + delta * 0.85);
        if (lerpT >= 1.0) currentWeatherKey = targetWeatherKey;

        const from = PRESETS[currentWeatherKey];
        const to = PRESETS[targetWeatherKey];
        const t = THREE.MathUtils.smoothstep(lerpT, 0, 1);

        activeParams.skyTop.setHex(from.skyTop).lerp(new THREE.Color(to.skyTop), t);
        activeParams.skyBottom.setHex(from.skyBottom).lerp(new THREE.Color(to.skyBottom), t);
        activeParams.cloudColor.setHex(from.cloudColor).lerp(new THREE.Color(to.cloudColor), t);
        activeParams.cloudLight.setHex(from.cloudLight).lerp(new THREE.Color(to.cloudLight), t);
        activeParams.fogColor.setHex(from.fogColor).lerp(new THREE.Color(to.fogColor), t);
        activeParams.fogDensity = THREE.MathUtils.lerp(from.fogDensity, to.fogDensity, t);

        activeParams.sunColor.setHex(from.sunColor).lerp(new THREE.Color(to.sunColor), t);
        activeParams.sunIntensity = THREE.MathUtils.lerp(from.sunIntensity, to.sunIntensity, t);
        activeParams.sunPos.lerpVectors(from.sunPos, to.sunPos, t);

        activeParams.hemiSky.setHex(from.hemiSky).lerp(new THREE.Color(to.hemiSky), t);
        activeParams.hemiGround.setHex(from.hemiGround).lerp(new THREE.Color(to.hemiGround), t);
        activeParams.hemiIntensity = THREE.MathUtils.lerp(from.hemiIntensity, to.hemiIntensity, t);

        const fromRain = from.rainCount > 0 ? (from.rainCount > 8000 ? 0.46 : 0.32) : 0.0;
        const toRain = to.rainCount > 0 ? (to.rainCount > 8000 ? 0.46 : 0.32) : 0.0;
        activeParams.rainOpacity = THREE.MathUtils.lerp(fromRain, toRain, t);

        activeParams.windStrength = THREE.MathUtils.lerp(from.windStrength, to.windStrength, t);
        activeParams.wetness = THREE.MathUtils.lerp(from.wetness, to.wetness, t);
        activeParams.starsOpacity = THREE.MathUtils.lerp(from.stars ? 0.9 : 0, to.stars ? 0.9 : 0, t);
        activeParams.firefliesOpacity = THREE.MathUtils.lerp(from.fireflies ? 0.95 : 0, to.fireflies ? 0.95 : 0, t);
        activeParams.mistOpacity = THREE.MathUtils.lerp(from.mist, to.mist, t);
        activeParams.cloudCoverage = THREE.MathUtils.lerp(from.cloudCoverage, to.cloudCoverage, t);
        activeParams.cloudOpacity = THREE.MathUtils.lerp(from.cloudOpacity, to.cloudOpacity, t);
        activeParams.sunGlow = THREE.MathUtils.lerp(from.sunGlow, to.sunGlow, t);
        activeParams.sunDisc = THREE.MathUtils.lerp(from.sunDisc, to.sunDisc, t);
        activeParams.moon = THREE.MathUtils.lerp(from.moon, to.moon, t);
        activeParams.exposure = THREE.MathUtils.lerp(from.exposure, to.exposure, t);

        if (callbacks.onWetnessChange) callbacks.onWetnessChange(activeParams.wetness);
        if (callbacks.onWindChange) callbacks.onWindChange(activeParams.windStrength);
      }

      // 2. Apply state every frame
      skyMat.uniforms.topColor.value.copy(activeParams.skyTop);
      skyMat.uniforms.bottomColor.value.copy(activeParams.skyBottom);
      skyMat.uniforms.cloudColor.value.copy(activeParams.cloudColor);
      skyMat.uniforms.cloudLight.value.copy(activeParams.cloudLight);
      skyMat.uniforms.sunColor.value.copy(activeParams.sunColor);
      skyMat.uniforms.sunDir.value.copy(activeParams.sunPos).normalize();
      skyMat.uniforms.cloudCoverage.value = activeParams.cloudCoverage;
      skyMat.uniforms.cloudOpacity.value = activeParams.cloudOpacity;
      skyMat.uniforms.sunGlow.value = activeParams.sunGlow;
      skyMat.uniforms.uTime.value = time;

      scene.fog.color.copy(activeParams.fogColor);
      scene.fog.density = activeParams.fogDensity;

      sunLight.color.copy(activeParams.sunColor);
      sunLight.intensity = activeParams.sunIntensity;
      sunLight.position.copy(activeParams.sunPos);
      fillLight.color.copy(activeParams.hemiSky);
      fillLight.intensity = 0.15 + activeParams.hemiIntensity * 0.18;
      frontFill.color.copy(activeParams.hemiSky);
      frontFill.intensity = 0.12 + activeParams.hemiIntensity * 0.22;

      hemiLight.color.copy(activeParams.hemiSky);
      hemiLight.groundColor.copy(activeParams.hemiGround);
      hemiLight.intensity = activeParams.hemiIntensity * 1.12;

      renderer.toneMappingExposure = activeParams.exposure;

      starMat.opacity = activeParams.starsOpacity;
      fireflyMat.opacity = activeParams.firefliesOpacity;
      fireflyPoints.visible = activeParams.firefliesOpacity > 0.02;

      mistSprites.forEach(s => { s.material.opacity = activeParams.mistOpacity; });

      // Sun / moon discs
      const sunDir = activeParams.sunPos.clone().normalize();
      sunSprite.position.copy(sunDir).multiplyScalar(58);
      sunSprite.material.opacity = activeParams.sunDisc * 0.7;
      sunSprite.material.color.copy(activeParams.sunColor);
      moonSprite.position.copy(sunDir).multiplyScalar(58);
      moonSprite.material.opacity = activeParams.moon * 0.85;


      // 3. Rain (GPU-animated; follows the player so the storm never ends at the camp edge)
      // The downpour breathes: slow, overlapping swells instead of a constant hiss.
      const rainPreset = PRESETS[targetWeatherKey];
      swell = 0.74 + 0.26 * (0.5 + 0.5 * Math.sin(time * 0.047 + 0.6)) * (0.65 + 0.35 * Math.sin(time * 0.131 + 2.1));
      const raining = activeParams.rainOpacity > 0.01;
      const dripTarget = raining ? 1 : activeParams.wetness * 0.45;
      dripLevel += (dripTarget - dripLevel) * Math.min(1, delta * (dripTarget > dripLevel ? 0.6 : 0.045));
      rain.update(time, {
        focus,
        density: raining ? (rainPreset.rainCount || 0) * 1.6 : 0,
        opacity: activeParams.rainOpacity,
        fallSpeed: rainPreset.rainSpeed || 26,
        windStrength: activeParams.windStrength,
        fogDensity: scene.fog ? scene.fog.density : 0.03,
        fogColor: scene.fog ? scene.fog.color : null,
        viewportHeight: renderer.domElement.height,
        fov: callbacks.fov,
        wetness: activeParams.wetness,
        swell,
        dripRate: dripLevel
      });

      // 4. Mist drift
      if (activeParams.mistOpacity > 0.005) {
        mistSprites.forEach((s, i) => {
          const u = s.userData;
          s.position.x = u.baseX + Math.sin(time * 0.08 + u.phase) * 2.2;
          s.position.z = u.baseZ + Math.cos(time * 0.06 + u.phase * 1.3) * 1.6;
          s.material.opacity = activeParams.mistOpacity * (0.7 + Math.sin(time * 0.3 + i) * 0.2);
        });
      }

      // 5. Fireflies
      if (activeParams.firefliesOpacity > 0.02) {
        const fPos = fireflyGeo.attributes.position.array;
        for (let i = 0; i < fireflyCount; i++) {
          const d = fireflyData[i];
          d.phase += delta * d.speed;
          fPos[i * 3] = d.x + Math.sin(time * 0.4 + i) * 0.8;
          fPos[i * 3 + 1] = THREE.MathUtils.clamp(d.y + Math.sin(time * 0.8 + i * 2) * 0.35, 0.2, 2.5);
          fPos[i * 3 + 2] = d.z + Math.cos(time * 0.4 + i) * 0.8;
        }
        fireflyGeo.attributes.position.needsUpdate = true;
      }

      // 6. Lightning
      if (targetWeatherKey === 'heavyRain') {
        if (lightningTimer > 0) {
          lightningTimer -= delta;
          flashBoost *= 0.86;
          if (lightningTimer <= 0) flashBoost = 0;
        } else if (Math.random() < PRESETS.heavyRain.lightningChance * delta * 60) {
          lightningTimer = 0.13 + Math.random() * 0.08;
          flashBoost = 2.4;
          if (callbacks.onThunder) callbacks.onThunder();
        }
      }
      if (flashBoost > 0.01) {
        sunLight.intensity = activeParams.sunIntensity + flashBoost;
        skyMat.uniforms.topColor.value.lerp(new THREE.Color(0xc9dcf0), Math.min(0.75, flashBoost * 0.2));
        skyMat.uniforms.bottomColor.value.lerp(new THREE.Color(0xdce9f4), Math.min(0.6, flashBoost * 0.16));
      }
    }
  };
}
