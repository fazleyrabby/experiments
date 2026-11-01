import * as THREE from 'three';

/**
 * Studio lighting rig. The environment map does the heavy reflective lifting
 * on the chrome; these lights add shape, a crisp shadow and a little colour:
 *  - dim hemisphere fill
 *  - warm-white key light (the only shadow caster, softened with PCF)
 *  - cool rim from behind to cut the silhouette out of the dark
 *  - a warm accent from low on the opposite side
 */
export function createLighting(scene, { radius, shadows = true, shadowMapSize = 2048 }) {
  const group = new THREE.Group();
  group.name = 'lighting';

  const hemisphere = new THREE.HemisphereLight(0xc4d8ff, 0x0b0e16, 0.25);
  group.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(radius * 0.8, radius * 1.6, radius * 0.9);
  key.castShadow = shadows;
  if (shadows) {
    const extent = radius * 1.25;
    key.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    key.shadow.camera.left = -extent;
    key.shadow.camera.right = extent;
    key.shadow.camera.top = extent;
    key.shadow.camera.bottom = -extent;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = radius * 6;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 5;
  }
  group.add(key);
  group.add(key.target);

  const rim = new THREE.DirectionalLight(0x6fa8ff, 1.3);
  rim.position.set(-radius * 1.1, radius * 1.2, -radius * 1.4);
  group.add(rim);

  const accent = new THREE.DirectionalLight(0xff9a52, 0.7);
  accent.position.set(-radius * 1.5, radius * 0.25, radius * 1.1);
  group.add(accent);

  scene.add(group);

  function dispose() {
    key.shadow.map?.dispose();
    scene.remove(group);
  }

  return { group, key, dispose };
}
