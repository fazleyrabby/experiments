import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Shared procedural geometry and material ownership. No external textures. */
export function createResources() {
  const geometries = new Map();
  const get = (key, build) => {
    if (!geometries.has(key)) geometries.set(key, build());
    return geometries.get(key);
  };
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  // Deterministic machining lines produce very restrained brushed reflections.
  let seed = 17;
  for (let y = 0; y < 128; y++) {
    seed = (seed * 16807) % 2147483647;
    const c = 110 + seed % 35;
    ctx.fillStyle = `rgb(${c},${c},${c})`;
    ctx.fillRect(0, y, 128, 1);
  }
  const brush = new THREE.CanvasTexture(canvas);
  brush.wrapS = brush.wrapT = THREE.RepeatWrapping;
  brush.repeat.set(2, 3);
  const mat = (color, metalness, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  const materials = {
    aluminum: mat('#a6afb3', .93, .28, { bumpMap: brush, bumpScale: .012 }),
    machined: mat('#c7cdce', .96, .22, { bumpMap: brush, bumpScale: .007 }),
    cast: mat('#626d72', .88, .45, { bumpMap: brush, bumpScale: .024 }),
    steel: mat('#333c42', .94, .3),
    black: mat('#171e22', .78, .38),
    copper: mat('#9f674d', .94, .29),
    brass: mat('#ba9163', .92, .3),
    rubber: mat('#11171a', .18, .73),
    orange: mat('#c77139', .8, .35),
    bore: mat('#515e66', .92, .22),
  };
  function mesh(geometry, material, parent, position = [0, 0, 0]) {
    const result = new THREE.Mesh(geometry, typeof material === 'string' ? materials[material] : material);
    result.position.set(...position);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  function box(parent, size, position, material = 'aluminum', radius = .045) {
    const geo = get(`box:${size}:${radius}`, () => new RoundedBoxGeometry(...size, 2, radius));
    return mesh(geo, material, parent, position);
  }
  function cylinder(parent, radius, height, position, material = 'machined', segments = 32) {
    return mesh(get(`cylinder:${radius}:${height}:${segments}`, () => new THREE.CylinderGeometry(radius, radius, height, segments)), material, parent, position);
  }
  function ring(parent, radius, tube, position, material = 'steel') {
    return mesh(get(`ring:${radius}:${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 40)), material, parent, position);
  }
  function bolt(parent, position, direction = [0, 1, 0], scale = 1, material = 'machined') {
    const bolt = new THREE.Group();
    bolt.position.set(...position);
    bolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...direction).normalize());
    cylinder(bolt, .082 * scale, .065 * scale, [0, 0, 0], material, 6);
    cylinder(bolt, .1 * scale, .015 * scale, [0, -.038 * scale, 0], 'steel', 20);
    parent.add(bolt);
    return bolt;
  }
  function tube(parent, points, radius, material = 'aluminum') {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, 28, radius, 12, false);
    geometries.set(`tube:${geometries.size}`, geo);
    return mesh(geo, material, parent);
  }
  function custom(key, build) { return get(key, build); }
  return { materials, geometries, mesh, box, cylinder, ring, bolt, tube, custom,
    dispose() { geometries.forEach(g => g.dispose()); Object.values(materials).forEach(m => m.dispose()); brush.dispose(); },
  };
}
