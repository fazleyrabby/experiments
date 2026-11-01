import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/** Radial alpha: translucent under the car, opaque toward the rim, so reflections fade out. */
function createFadeTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const stops = [
    [0, 0.7],
    [0.35, 0.78],
    [0.7, 0.92],
    [1, 1],
  ];
  for (const [at, value] of stops) {
    const channel = Math.round(value * 255);
    gradient.addColorStop(at, `rgb(${channel},${channel},${channel})`);
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Short radial tick marks around the rim, like a turntable scale. */
function createTickGeometry(radius) {
  const positions = [];
  const ticks = 144;
  for (let i = 0; i < ticks; i++) {
    const angle = (i / ticks) * Math.PI * 2;
    const major = i % 12 === 0;
    const inner = radius * (major ? 0.935 : 0.96);
    const outer = radius * 0.985;
    positions.push(
      Math.cos(angle) * inner,
      0,
      Math.sin(angle) * inner,
      Math.cos(angle) * outer,
      0,
      Math.sin(angle) * outer,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

/**
 * Showroom turntable: a dark mirror disc that reflects the car, a soft shadow
 * catcher, a thin illuminated rim and rotating scale marks.
 */
export function createFloor(scene, { radius, y, reflections = true, textureSize = 1024 }) {
  const group = new THREE.Group();
  group.name = 'floor';
  group.position.y = y;
  const disposables = [];
  const track = (resource) => {
    disposables.push(resource);
    return resource;
  };

  const discGeometry = track(new THREE.CircleGeometry(radius, 128));
  let reflector = null;
  if (reflections) {
    reflector = new Reflector(discGeometry, {
      clipBias: 0.003,
      textureWidth: textureSize,
      textureHeight: textureSize,
      color: 0x6a7080,
      multisample: 4,
    });
    reflector.rotation.x = -Math.PI / 2;
    group.add(reflector);
  }

  // Dark film over the mirror: fades the reflection toward the rim.
  const fadeMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0x04060b,
      transparent: true,
      alphaMap: track(createFadeTexture()),
      depthWrite: false,
      toneMapped: false,
    }),
  );
  if (!reflections) {
    fadeMaterial.alphaMap = null;
    fadeMaterial.color.set(0x1d222d);
    fadeMaterial.transparent = false;
    fadeMaterial.depthWrite = true;
  }
  const fade = new THREE.Mesh(discGeometry, fadeMaterial);
  fade.rotation.x = -Math.PI / 2;
  fade.position.y = 0.012;
  fade.renderOrder = 1;
  group.add(fade);

  const shadowMaterial = track(new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.6, depthWrite: false }));
  const shadow = new THREE.Mesh(discGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.receiveShadow = true;
  shadow.renderOrder = 2;
  group.add(shadow);

  const spinner = new THREE.Group();
  spinner.position.y = 0.04;
  group.add(spinner);

  const tickMaterial = track(
    new THREE.LineBasicMaterial({ color: 0xcfd8ea, transparent: true, opacity: 0.32, depthWrite: false }),
  );
  spinner.add(new THREE.LineSegments(track(createTickGeometry(radius)), tickMaterial));

  const rimMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0xdfe6f5,
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const rim = new THREE.Mesh(track(new THREE.RingGeometry(radius, radius * 1.006, 192)), rimMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.03;
  group.add(rim);

  const haloMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0x6f9cff,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const halo = new THREE.Mesh(track(new THREE.RingGeometry(radius * 1.006, radius * 1.1, 192)), haloMaterial);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  group.add(halo);

  scene.add(group);

  return {
    group,
    reflector,
    /** Keep the scale marks in step with the car's rotation. */
    setRotation(angle) {
      spinner.rotation.y = angle;
    },
    update(time) {
      rimMaterial.opacity = 0.74 + Math.sin(time * 1.3) * 0.1;
    },
    dispose() {
      scene.remove(group);
      reflector?.getRenderTarget?.().dispose();
      reflector?.material.dispose();
      for (const resource of disposables) resource.dispose();
    },
  };
}
