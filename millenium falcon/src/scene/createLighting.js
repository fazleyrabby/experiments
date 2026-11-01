import * as THREE from 'three';

/**
 * Deep-space lighting rig:
 *  - a hard warm-white sun (the only shadow caster), high on the port bow
 *  - a cool blue bounce from below
 *  - a pale rim light from behind to cut the silhouette out of the dark
 *  - a very dim hemisphere fill so the shadow side never goes fully black
 */
export function createLighting(scene, { radius, shadows = true, shadowMapSize = 2048 }) {
  const group = new THREE.Group();
  group.name = 'lighting';

  const hemisphere = new THREE.HemisphereLight(0x9fb8ff, 0x1a2238, 0.55);
  group.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
  sun.position.set(radius * 1.1, radius * 1.5, radius * 0.7);
  sun.castShadow = shadows;
  if (shadows) {
    const extent = radius * 1.2;
    sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    sun.shadow.camera.left = -extent;
    sun.shadow.camera.right = extent;
    sun.shadow.camera.top = extent;
    sun.shadow.camera.bottom = -extent;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = radius * 6;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = 3;
  }
  group.add(sun);
  group.add(sun.target);

  const bounce = new THREE.DirectionalLight(0x4f8fe0, 0.9);
  bounce.position.set(-radius * 1.2, -radius * 1.0, -radius * 0.6);
  group.add(bounce);

  const rim = new THREE.DirectionalLight(0xb6ccff, 1.1);
  rim.position.set(-radius * 0.8, radius * 0.6, -radius * 1.6);
  group.add(rim);

  scene.add(group);

  function dispose() {
    sun.shadow.map?.dispose();
    scene.remove(group);
  }

  return { group, sun, dispose };
}
