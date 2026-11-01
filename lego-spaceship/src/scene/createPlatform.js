import * as THREE from 'three';

function createFloorGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(90,160,255,0.5)');
  gradient.addColorStop(0.35, 'rgba(60,130,230,0.2)');
  gradient.addColorStop(0.75, 'rgba(30,80,180,0.05)');
  gradient.addColorStop(1, 'rgba(20,60,160,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Polar grid: concentric circles plus spokes, as a single LineSegments object. */
function createGridGeometry(radius) {
  const positions = [];
  const rings = [0.28, 0.52, 0.76];
  const segments = 96;
  for (const ring of rings) {
    const r = radius * ring;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      positions.push(Math.cos(a0) * r, 0, Math.sin(a0) * r, Math.cos(a1) * r, 0, Math.sin(a1) * r);
    }
  }
  const spokes = 24;
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2;
    const inner = radius * rings[0];
    const outer = radius * 0.94;
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

/** Short radial tick marks around the rim, like a turntable scale. */
function createTickGeometry(radius) {
  const positions = [];
  const ticks = 120;
  for (let i = 0; i < ticks; i++) {
    const angle = (i / ticks) * Math.PI * 2;
    const major = i % 10 === 0;
    const inner = radius * (major ? 0.945 : 0.965);
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
 * Presentation turntable under the ship: a dark, faintly reflective disc that
 * catches the ship's shadow, a thin illuminated rim and a barely-there grid.
 */
export function createPlatform(scene, { radius, y }) {
  const group = new THREE.Group();
  group.name = 'platform';
  group.position.y = y;
  const disposables = [];
  const track = (resource) => {
    disposables.push(resource);
    return resource;
  };

  const disc = new THREE.Mesh(
    track(new THREE.CircleGeometry(radius, 128)),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x080d17,
        roughness: 0.82,
        metalness: 0.15,
        envMapIntensity: 0.12,
      }),
    ),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  group.add(disc);

  const glow = new THREE.Mesh(
    track(new THREE.PlaneGeometry(radius * 1.5, radius * 1.5)),
    track(
      new THREE.MeshBasicMaterial({
        map: track(createFloorGlowTexture()),
        transparent: true,
        opacity: 0.11,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  group.add(glow);

  // Everything that turns with the ship lives in the spinner.
  const spinner = new THREE.Group();
  spinner.position.y = 0.04;
  group.add(spinner);

  const gridMaterial = track(
    new THREE.LineBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.08, depthWrite: false }),
  );
  spinner.add(new THREE.LineSegments(track(createGridGeometry(radius)), gridMaterial));

  const tickMaterial = track(
    new THREE.LineBasicMaterial({ color: 0x7fe0ff, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  spinner.add(new THREE.LineSegments(track(createTickGeometry(radius)), tickMaterial));

  const rimMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0x4fd8ff,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const rim = new THREE.Mesh(track(new THREE.RingGeometry(radius, radius * 1.008, 160)), rimMaterial);
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = 0.03;
  group.add(rim);

  const haloMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0x2f9dff,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  const halo = new THREE.Mesh(
    track(new THREE.RingGeometry(radius * 1.008, radius * 1.09, 160)),
    haloMaterial,
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  group.add(halo);

  scene.add(group);

  return {
    group,
    /** Keep the turntable markings in step with the ship's rotation. */
    setRotation(angle) {
      spinner.rotation.y = angle;
    },
    /** Pulse the rim very slightly so the stage feels powered. */
    update(time) {
      rimMaterial.opacity = 0.78 + Math.sin(time * 1.3) * 0.1;
    },
    dispose() {
      scene.remove(group);
      for (const resource of disposables) resource.dispose();
    },
  };
}
