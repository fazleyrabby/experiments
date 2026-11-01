import * as THREE from 'three';

// Stripes that scroll along the chain tube to suggest moving links.
function chainTexture() {
  const d = [58, 60, 62, 255, 176, 178, 182, 255, 176, 178, 182, 255, 58, 60, 62, 255];
  const t = new THREE.DataTexture(new Uint8Array(d), 4, 1);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export function createBikeMaterials() {
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: 0x1d4a40, metalness: 0.35, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.1,
    }),
    alloy: new THREE.MeshStandardMaterial({ color: 0xc4c8cc, metalness: 1, roughness: 0.28 }),
    darkAlloy: new THREE.MeshStandardMaterial({ color: 0x26282c, metalness: 0.75, roughness: 0.38 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.88 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.75 }),
    spoke: new THREE.MeshStandardMaterial({ color: 0xd9dde0, metalness: 1, roughness: 0.22 }),
    rotor: new THREE.MeshStandardMaterial({ color: 0xaab0b6, metalness: 1, roughness: 0.18 }),
    saddle: new THREE.MeshPhysicalMaterial({
      color: 0x141414, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.5,
    }),
    cable: new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.5 }),
    chain: new THREE.MeshStandardMaterial({ color: 0xffffff, map: chainTexture(), metalness: 0.9, roughness: 0.45 }),
  };
}

export function createRiderMaterials() {
  return {
    jacket: new THREE.MeshPhysicalMaterial({
      color: 0xb8391f, roughness: 0.8, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xff9a7a),
    }),
    pants: new THREE.MeshPhysicalMaterial({
      color: 0x262a31, roughness: 0.85, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x667080),
    }),
    skin: new THREE.MeshPhysicalMaterial({
      color: 0xc08560, roughness: 0.52, sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffc9a8),
    }),
    hair: new THREE.MeshStandardMaterial({ color: 0x24190f, roughness: 0.7 }),
    shoe: new THREE.MeshStandardMaterial({ color: 0xd9d9d4, roughness: 0.62 }),
    helmet: new THREE.MeshPhysicalMaterial({
      color: 0xf1f1ef, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, side: THREE.DoubleSide,
    }),
    glasses: new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 0.6, roughness: 0.08, side: THREE.DoubleSide }),
    pack: new THREE.MeshPhysicalMaterial({
      color: 0x313a30, roughness: 0.82, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x7a8a74),
    }),
    strap: new THREE.MeshPhysicalMaterial({
      color: 0x262b25, roughness: 0.7, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x6d7a68),
    }),
  };
}
