import * as THREE from 'three/webgpu';

const LAMP_INTENSITY = 34;
const LAMP_COLOR = 0xffa24c;
const SHADOW_SLOTS = 3;
const FADE_SPEED = 3.2;

export function createEnvironment() {
  const width = 256;
  const height = 128;
  const data = new Uint16Array(width * height * 4);
  const glows = [
    { az: 0.08, el: 0.1, color: [0.5, 0.26, 0.09], size: 0.012 },
    { az: 0.31, el: 0.14, color: [0.1, 0.32, 0.4], size: 0.01 },
    { az: 0.55, el: 0.08, color: [0.5, 0.25, 0.08], size: 0.016 },
    { az: 0.78, el: 0.16, color: [0.45, 0.06, 0.13], size: 0.009 },
  ];
  for (let y = 0; y < height; y++) {
    const elevation = (y / (height - 1)) * 2 - 1;
    const up = Math.max(elevation, 0);
    for (let x = 0; x < width; x++) {
      const azimuth = x / width;
      const horizon = Math.exp(-Math.abs(elevation) * 7);
      const rgb = [
        0.012 + up * 0.012 + horizon * 0.085,
        0.017 + up * 0.018 + horizon * 0.06,
        0.03 + up * 0.035 + horizon * 0.048,
      ];
      for (const glow of glows) {
        const da = Math.min(Math.abs(azimuth - glow.az), 1 - Math.abs(azimuth - glow.az));
        const de = (elevation - glow.el) * 0.5;
        const weight = Math.exp(-(da * da + de * de) / glow.size);
        rgb[0] += glow.color[0] * weight;
        rgb[1] += glow.color[1] * weight;
        rgb[2] += glow.color[2] * weight;
      }
      const offset = (x + y * width) * 4;
      data[offset] = THREE.DataUtils.toHalfFloat(rgb[0]);
      data[offset + 1] = THREE.DataUtils.toHalfFloat(rgb[1]);
      data[offset + 2] = THREE.DataUtils.toHalfFloat(rgb[2]);
      data[offset + 3] = THREE.DataUtils.toHalfFloat(1);
    }
  }
  const environment = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.LinearSRGBColorSpace;
  environment.minFilter = THREE.LinearFilter;
  environment.magFilter = THREE.LinearFilter;
  environment.needsUpdate = true;
  return environment;
}

export function createMoon(scene) {
  const moon = new THREE.DirectionalLight(0x8ea9dc, 0.2);
  moon.position.set(-34, 86, 26);
  moon.target.position.set(0, 0, -4);
  moon.castShadow = true;
  moon.shadow.mapSize.setScalar(2048);
  Object.assign(moon.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, near: 8, far: 190 });
  moon.shadow.bias = -0.0006;
  moon.shadow.normalBias = 0.05;
  moon.shadow.autoUpdate = false;
  moon.shadow.needsUpdate = true;
  scene.add(moon, moon.target, new THREE.HemisphereLight(0x3a4a66, 0x1a1512, 0.62));
  return moon;
}

/** Every lamp is a cheap clustered light; the nearest few crossfade to shadowed spots. */
export function createLampLights(scene, positions) {
  const lamps = positions.map((position) => {
    const point = new THREE.PointLight(LAMP_COLOR, LAMP_INTENSITY, 21, 2);
    point.position.copy(position);
    scene.add(point);
    return { position, point, weight: 0, slot: null };
  });

  const slots = Array.from({ length: Math.min(SHADOW_SLOTS, lamps.length) }, () => {
    const spot = new THREE.SpotLight(LAMP_COLOR, 0, 22, 1.36, 1, 2);
    spot.castShadow = true;
    spot.shadow.mapSize.setScalar(1024);
    spot.shadow.camera.near = 0.35;
    spot.shadow.camera.far = 22;
    spot.shadow.bias = -0.0009;
    spot.shadow.normalBias = 0.035;
    spot.shadow.autoUpdate = false;
    scene.add(spot, spot.target);
    return { spot, lamp: null, next: null, weight: 0 };
  });

  const assign = (slot, lamp) => {
    slot.lamp = lamp;
    slot.next = null;
    lamp.slot = slot;
    slot.spot.position.copy(lamp.position);
    slot.spot.target.position.set(lamp.position.x, 0, lamp.position.z);
    slot.spot.target.updateMatrixWorld();
    slot.spot.updateMatrixWorld();
    slot.spot.shadow.needsUpdate = true;
  };

  let timer = 0;
  return {
    count: lamps.length,
    update(dt, cameraPosition) {
      timer -= dt;
      if (timer <= 0) {
        timer = 0.35;
        const wanted = [...lamps]
          .sort((a, b) => a.position.distanceToSquared(cameraPosition) - b.position.distanceToSquared(cameraPosition))
          .slice(0, slots.length);
        const missing = wanted.filter((lamp) => !lamp.slot);
        for (const slot of slots) {
          slot.next = null;
          if (!slot.lamp || !wanted.includes(slot.lamp)) slot.next = missing.shift() ?? null;
        }
      }

      // At most one shadow map is redrawn per frame, so passing a lamp never causes a visible hitch.
      let redrawn = false;
      for (const slot of slots) {
        const target = slot.next ? 0 : 1;
        slot.weight = THREE.MathUtils.clamp(slot.weight + Math.sign(target - slot.weight) * dt * FADE_SPEED, 0, 1);
        if (slot.next && slot.weight === 0 && !redrawn) {
          redrawn = true;
          if (slot.lamp) {
            slot.lamp.slot = null;
            slot.lamp.point.intensity = LAMP_INTENSITY;
          }
          if (!slot.next.slot) assign(slot, slot.next);
          else slot.next = null;
        }
        if (slot.lamp) slot.lamp.point.intensity = LAMP_INTENSITY * (1 - slot.weight);
        slot.spot.intensity = LAMP_INTENSITY * 1.25 * slot.weight;
      }
    },
  };
}
