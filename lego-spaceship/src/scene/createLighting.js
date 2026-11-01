import * as THREE from 'three';

/**
 * Studio lighting rig:
 *  - hemisphere fill for general visibility
 *  - warm-white key light (the only shadow caster, softened with PCF)
 *  - a broad, shadowless top light standing in for a large softbox
 *  - cool blue rim light from behind to cut out the silhouette
 *  - a subtle warm accent from low on the opposite side
 */
export function createLighting(scene, { radius, shadows = true, shadowMapSize = 2048 }) {
  const group = new THREE.Group();
  group.name = 'lighting';

  const hemisphere = new THREE.HemisphereLight(0xc4d8ff, 0x0b0e16, 0.38);
  group.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff3e4, 2.05);
  key.position.set(radius * 0.9, radius * 1.7, radius * 1.1);
  key.castShadow = shadows;
  if (shadows) {
    const extent = radius * 1.9;
    key.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    key.shadow.camera.left = -extent;
    key.shadow.camera.right = extent;
    key.shadow.camera.top = extent;
    key.shadow.camera.bottom = -extent;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = radius * 6;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 4;
  }
  group.add(key);
  group.add(key.target);

  const softbox = new THREE.DirectionalLight(0xdfe9ff, 0.45);
  softbox.position.set(-radius * 0.3, radius * 2.2, radius * 0.2);
  group.add(softbox);

  // Kept steep so its mirror reflection off the flat tiles misses the camera.
  const rim = new THREE.DirectionalLight(0x4aa3ff, 1.05);
  rim.position.set(-radius * 1.1, radius * 1.9, -radius * 1.4);
  group.add(rim);

  const accent = new THREE.DirectionalLight(0xff9a52, 0.55);
  accent.position.set(-radius * 1.5, -radius * 0.15, radius * 1.1);
  group.add(accent);

  scene.add(group);

  function dispose() {
    key.shadow.map?.dispose();
    scene.remove(group);
  }

  return { group, key, dispose };
}
