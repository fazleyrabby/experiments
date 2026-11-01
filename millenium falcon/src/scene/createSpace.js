import * as THREE from 'three';
import { createRandom, randomUnitVector } from '../utils/random.js';

// Set dressing far behind the ship: a spiral galaxy and a loose field of
// tumbling asteroids. Everything is procedural (canvas textures and displaced
// geometry).

/** Spiral galaxy sprite: a bright core and logarithmic arms of soft dots. */
function createGalaxyTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const random = createRandom(0x6a1a87);
  const c = size / 2;
  context.globalCompositeOperation = 'lighter';
  const dot = (x, y, r, color, alpha) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (let i = 0; i < 2600; i++) {
    const arm = i % 2;
    const t = Math.pow(random(), 0.8);
    const angle = t * Math.PI * 3.4 + arm * Math.PI + (random() - 0.5) * 0.5;
    const radius = t * c * 0.92;
    const x = c + Math.cos(angle) * radius + (random() - 0.5) * 10 * (1 + t * 3);
    const y = c + Math.sin(angle) * radius * 0.55 + (random() - 0.5) * 8 * (1 + t * 3);
    const color = t < 0.25 ? '255, 214, 170' : random() < 0.5 ? '150, 170, 255' : '210, 150, 230';
    dot(x, y, 3 + random() * 9, color, 0.12 * (1 - t * 0.6));
  }
  dot(c, c, c * 0.3, '255, 220, 180', 0.55);
  dot(c, c, c * 0.08, '255, 245, 230', 0.9);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A lumpy rock: an icosphere pushed in and out by a few sine-noise octaves. */
function createAsteroidGeometry(random) {
  const geometry = new THREE.IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  const v = new THREE.Vector3();
  const a = [random() * 6, random() * 6, random() * 6];
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n =
      Math.sin(v.x * 2.3 + a[0]) * Math.sin(v.y * 2.1 + a[1]) * Math.sin(v.z * 2.7 + a[2]) * 0.28 +
      Math.sin(v.x * 5.1 + a[1]) * Math.sin(v.z * 4.7 + a[0]) * 0.08;
    v.multiplyScalar(1 + n);
    v.x *= 1.25;
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry.toNonIndexed();
}

/**
 * @param {THREE.Scene} scene
 * @param {object} options
 * @param {number} options.radius               ship radius (asteroids keep clear of it)
 * @param {boolean} [options.lowPower]
 */
export function createSpace(scene, { radius, lowPower = false }) {
  const group = new THREE.Group();
  group.name = 'space';
  const disposables = [];
  const track = (resource) => {
    disposables.push(resource);
    return resource;
  };

  // --- Spiral galaxy, high in the opposite corner.
  const galaxy = new THREE.Sprite(
    track(
      new THREE.SpriteMaterial({
        map: track(createGalaxyTexture(512)),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.85,
      }),
    ),
  );
  galaxy.position.set(260, 420, -900);
  galaxy.scale.set(380, 380, 1);
  galaxy.material.rotation = -0.5;
  group.add(galaxy);

  // --- Asteroids: one shared rock material, a handful of shapes, instanced.
  const random = createRandom(0xa57e40);
  const rockMaterial = track(new THREE.MeshStandardMaterial({ color: 0x5b534d, roughness: 0.95, metalness: 0, flatShading: true }));
  const shapes = 5;
  const perShape = lowPower ? 8 : 14;
  const rocks = [];
  for (let s = 0; s < shapes; s++) {
    const mesh = new THREE.InstancedMesh(track(createAsteroidGeometry(random)), rockMaterial, perShape);
    mesh.frustumCulled = false;
    for (let i = 0; i < perShape; i++) {
      const [dx, dy, dz] = randomUnitVector(random);
      const distance = radius * (5.5 + random() * 5);
      // Keep them out of the default camera's line of sight to the ship.
      const position = new THREE.Vector3(dx, dy * 0.45 - 0.15, dz).normalize().multiplyScalar(distance);
      if (position.x > 0 && position.z > 0) position.x *= -1;
      rocks.push({
        mesh,
        index: i,
        position,
        scale: 0.8 + Math.pow(random(), 3) * 6,
        axis: new THREE.Vector3(...randomUnitVector(random)),
        spin: (random() - 0.5) * 0.4,
        angle: random() * Math.PI * 2,
      });
    }
    group.add(mesh);
  }
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const orbit = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const moved = new THREE.Vector3();

  function updateRocks(time) {
    // The whole field drifts slowly around the ship; each rock tumbles.
    orbit.setFromAxisAngle(up, time * 0.006);
    for (const rock of rocks) {
      quaternion.setFromAxisAngle(rock.axis, rock.angle + time * rock.spin);
      scale.setScalar(rock.scale);
      moved.copy(rock.position).applyQuaternion(orbit);
      matrix.compose(moved, quaternion, scale);
      rock.mesh.setMatrixAt(rock.index, matrix);
    }
    for (let s = 0; s < group.children.length; s++) {
      const child = group.children[s];
      if (child.isInstancedMesh) child.instanceMatrix.needsUpdate = true;
    }
  }
  updateRocks(0);

  scene.add(group);

  return {
    group,
    update(time) {
      updateRocks(time);
    },
    dispose() {
      scene.remove(group);
      for (const child of group.children) if (child.isInstancedMesh) child.dispose();
      for (const resource of disposables) resource.dispose();
    },
  };
}
