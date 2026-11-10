/* env.js — a small neon-street environment baked to a PMREM so paint, glass and chrome pick up
   pink/cyan/amber reflections the way they do on a wet night in Hong Kong. */
import * as THREE from 'three';

export function createNeonEnvironment(renderer) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.012, 0.01, 0.025), side: THREE.BackSide }));
  room.position.y = 12;
  s.add(room);
  const panel = (w, h, x, y, z, ry, r, g, b) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; s.add(m);
  };
  // shopfront strips along both sides of the street
  for (const sd of [-1, 1]) {
    for (let i = -5; i <= 5; i++) {
      const k = (i + 5 + (sd > 0 ? 3 : 0)) % 4;
      const c = [[1.6, 1.25, 0.8], [0.9, 1.4, 1.6], [1.8, 0.5, 0.9], [1.2, 1.1, 0.7]][k];
      panel(4.5, 2.6, i * 5.5, 1.6, sd * 12, 0, c[0], c[1], c[2]);
    }
    // neon blades higher up
    const neon = [[3.5, 0.3, 1.6], [0.3, 2.6, 3.2], [3.2, 2.4, 0.4], [0.4, 3.2, 0.6], [3.6, 0.6, 0.3]];
    for (let i = 0; i < 9; i++) {
      const c = neon[(i + (sd > 0 ? 2 : 0)) % neon.length];
      panel(1.0, 4.5, -22 + i * 5.5, 7.5, sd * 11, Math.PI / 2, c[0], c[1], c[2]);
    }
  }
  // city glow overhead and a sodium lamp row
  panel(60, 6, 0, 26, 0, 0, 0.12, 0.05, 0.1);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.07, 0.035, 0.08) }));
  sky.rotation.x = Math.PI / 2; sky.position.y = 26.5; s.add(sky);
  for (let i = -3; i <= 3; i++) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 3.8, 1.6) }));
    l.position.set(i * 9, 8, (i % 2 ? 1 : -1) * 7); s.add(l);
  }
  // wet road below
  const road = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.03, 0.025, 0.04) }));
  road.rotation.x = -Math.PI / 2; s.add(road);

  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.035, 0.1, 100);
  pm.dispose();
  s.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt.texture;
}
