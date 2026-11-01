import * as THREE from 'three';

/**
 * Procedural photo-studio used as the reflection source for every chrome part.
 *
 * Chrome shows nothing but what it reflects, so this is a dark room with a few
 * very bright, sharply defined light sources: a big overhead softbox, tall
 * strip lights either side, a long rim strip behind, a warm and a cool accent,
 * and a faint floor bounce. Strong light/dark contrast is what sells a mirror
 * finish. The room is rendered once into a PMREM cube and never touched again.
 */
function lightPanel(width, height, intensity, color = 0xffffff) {
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false });
  material.color.set(color).multiplyScalar(intensity);
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

/** Place a panel on the sphere at an azimuth / elevation (degrees), facing the centre. */
function placeOnSphere(mesh, azimuth, elevation, distance) {
  const a = THREE.MathUtils.degToRad(azimuth);
  const e = THREE.MathUtils.degToRad(elevation);
  mesh.position.set(
    Math.sin(a) * Math.cos(e) * distance,
    Math.sin(e) * distance,
    Math.cos(a) * Math.cos(e) * distance,
  );
  mesh.lookAt(0, 0, 0);
  return mesh;
}

function createStudio() {
  const studio = new THREE.Scene();
  const RADIUS = 90;

  // Dome: a cool glow hugging the horizon (what a low camera sees mirrored in
  // the bonnet, roof and flanks), fading to near black overhead and below.
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 64, 32),
    new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true, toneMapped: false }),
  );
  const colors = [];
  const position = dome.geometry.attributes.position;
  const tint = new THREE.Color(0.72, 0.82, 1.0);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const elevation = Math.asin(y / RADIUS); // radians
    const azimuth = Math.atan2(x, z);
    let level;
    // Below the horizon is a pale studio floor (what vertical flanks reflect).
    if (elevation < 0) level = 0.1 + 0.55 * Math.exp(elevation / 0.32);
    else level = 0.05 + 0.65 * Math.exp(-elevation / 0.4);
    // Uneven around the room so the flanks do not reflect one flat grey.
    level *= 0.7 + 0.3 * Math.cos(azimuth * 2 + 0.6);
    colors.push(tint.r * level, tint.g * level, tint.b * level);
  }
  dome.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  studio.add(dome);

  const D = 70;
  // Overhead softbox (the big white sweep across the bonnet and roof).
  studio.add(placeOnSphere(lightPanel(50, 30, 5.5), 0, 86, D));
  // Long strip lights low around the room: bright streaks that slide across the bodywork.
  studio.add(placeOnSphere(lightPanel(70, 7, 6.5), 20, 15, D));
  studio.add(placeOnSphere(lightPanel(70, 7, 6.5, 0xfff0dc), 200, 17, D));
  studio.add(placeOnSphere(lightPanel(60, 9, 5, 0xe8f1ff), 100, 22, D));
  studio.add(placeOnSphere(lightPanel(60, 9, 5, 0xe8f1ff), -100, 22, D));
  studio.add(placeOnSphere(lightPanel(50, 6, 6, 0xffffff), -50, 38, D));
  studio.add(placeOnSphere(lightPanel(50, 6, 6, 0xffffff), 140, 40, D));
  // Tall vertical strips either side: long highlights down the flanks.
  studio.add(placeOnSphere(lightPanel(8, 44, 7, 0xeaf3ff), 62, 12, D));
  studio.add(placeOnSphere(lightPanel(8, 44, 7, 0xfff2e2), -62, 12, D));
  studio.add(placeOnSphere(lightPanel(8, 44, 6, 0xffffff), 160, 12, D));
  // Low coloured accents for the lower bodywork.
  studio.add(placeOnSphere(lightPanel(36, 5, 4.5, 0x6fb4ff), -140, 4, D));
  studio.add(placeOnSphere(lightPanel(36, 5, 4.5, 0xff9a52), 35, 4, D));
  // Strips on the studio floor: the streaks a mirror flank shows when looked at from above.
  studio.add(placeOnSphere(lightPanel(70, 8, 4.5, 0xffffff), 0, -14, D));
  studio.add(placeOnSphere(lightPanel(70, 8, 4.5, 0xe6efff), 90, -18, D));
  studio.add(placeOnSphere(lightPanel(70, 8, 4.5, 0xfff0dc), -90, -18, D));
  studio.add(placeOnSphere(lightPanel(70, 8, 4.5, 0xffffff), 180, -14, D));
  studio.add(placeOnSphere(lightPanel(40, 5, 5, 0xffffff), 45, -30, D));
  studio.add(placeOnSphere(lightPanel(40, 5, 5, 0xffffff), -45, -30, D));

  return studio;
}

/** Bakes the studio into an environment texture. Returns it with a dispose helper. */
export function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = createStudio();
  const target = pmrem.fromScene(studio, 0.015, 0.1, 400);

  studio.traverse((object) => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  pmrem.dispose();

  return {
    texture: target.texture,
    dispose() {
      target.dispose();
    },
  };
}
