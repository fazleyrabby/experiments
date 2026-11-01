import * as THREE from 'three';

/**
 * Sweeps superelliptic cross-sections along +Y into one smooth closed surface.
 * Used for every organic shape: torso, limbs, shoes, saddle.
 * sections: [{ y, rx, rz, cx = 0, cz = 0, p = 2 }] — rx/rz are half extents, p the superellipse exponent.
 */
export function loftGeometry(sections, radial = 24) {
  const rings = [...sections].sort((a, b) => a.y - b.y);
  const positions = [];
  const indices = [];

  for (const s of rings) {
    const p = s.p ?? 2;
    const cx = s.cx ?? 0;
    const cz = s.cz ?? 0;
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
      const ez = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / p);
      positions.push(cx + ex * s.rx, s.y, cz + ez * s.rz);
    }
  }

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < radial; i++) {
      const a = r * radial + i;
      const b = r * radial + ((i + 1) % radial);
      indices.push(a, a + radial, b, b, a + radial, b + radial);
    }
  }

  const first = rings[0];
  const last = rings[rings.length - 1];
  const bottom = positions.length / 3;
  positions.push(first.cx ?? 0, first.y, first.cz ?? 0);
  const top = bottom + 1;
  positions.push(last.cx ?? 0, last.y, last.cz ?? 0);
  const lastRing = (rings.length - 1) * radial;
  for (let i = 0; i < radial; i++) {
    const n = (i + 1) % radial;
    indices.push(bottom, i, n);
    indices.push(top, lastRing + n, lastRing + i);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Round limb hanging from its proximal joint at the origin down to -Y.
 * profile: [[t, radius]] where t is the fraction of `length` (values outside 0..1 form the rounded caps).
 */
export function limbGeometry(length, profile, radial = 18) {
  return loftGeometry(
    profile.map(([t, r]) => ({ y: -t * length, rx: r, rz: r })),
    radial,
  );
}

/** Loft whose sweep axis is +X instead of +Y. Sections: { x, halfWidth, halfHeight, cy, p }. */
export function loftAlongX(sections, radial = 24) {
  const g = loftGeometry(
    sections.map((s) => ({ y: s.x, rx: s.halfHeight, rz: s.halfWidth, cx: -(s.cy ?? 0), p: s.p })),
    radial,
  );
  g.rotateZ(-Math.PI / 2);
  return g;
}
