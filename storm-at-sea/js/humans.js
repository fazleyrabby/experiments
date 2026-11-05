import * as THREE from 'three';

/*
  Procedural crew. Each figure is a small jointed skeleton (pelvis, torso, head, two-segment
  arms and legs) posed every frame with forward kinematics, drawn with a handful of
  InstancedMeshes so a whole crew costs ~8 draw calls. Roles set the clothing:
  sailors (shirt, canvas trousers, tarred round hat), officers (blue coat, white breeches,
  boots, bicorne), marines (red coat, white trousers, round hat), Greek oarsmen/hoplites
  (chiton, bare legs, helmet), rowers (bare-headed, chiton). Actions: idle, walk, haul, wheel, lookout, row.
*/

const SKIN = ['#e0b394', '#c99271', '#a8714f', '#7a4f33', '#efc8a8'];
const ROLE = {
  sailor: { top: ['#e9e5d8', '#d9d2bf', '#b9c3cc'], legs: ['#4f5a68', '#cfc6b0', '#6b6152'], shin: null, hat: 'round', hatC: '#1b1b1b' },
  officer: { top: ['#1b2540'], legs: ['#e9e4d6'], shin: '#111111', hat: 'bicorne', hatC: '#121212' },
  marine: { top: ['#9e231b'], legs: ['#e9e4d6'], shin: '#1a1a1a', hat: 'round', hatC: '#141414' },
  greek: { top: ['#d9cdb0', '#b8452f', '#c9b48a'], legs: null, shin: null, hat: 'helmet', hatC: '#a8743a' },
  rower: { top: ['#d9cdb0', '#c9b48a', '#b8a27a', '#9c4a32'], legs: null, shin: null, hat: 'none', hatC: '#000000' },
  ghost: { top: ['#3f4a44'], legs: ['#2f3833'], shin: null, hat: 'none', hatC: '#000000' },
};

export function buildCrew(parent, figures, { scale = 1 } = {}) {
  const n = figures.length;
  if (!n) return () => {};
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, ...o });
  const limbGeo = new THREE.CylinderGeometry(1, 0.85, 1, 8);
  const torsoGeo = new THREE.CylinderGeometry(0.19, 0.15, 0.56, 10); torsoGeo.translate(0, 0.28, 0);
  const pelvisGeo = new THREE.BoxGeometry(0.32, 0.18, 0.2);
  const headGeo = new THREE.SphereGeometry(0.11, 14, 10); headGeo.scale(0.9, 1.08, 0.95);
  const handGeo = new THREE.SphereGeometry(0.048, 8, 6);
  const footGeo = new THREE.BoxGeometry(0.1, 0.07, 0.25); footGeo.translate(0, -0.035, 0.05);
  const roundHat = new THREE.CylinderGeometry(0.12, 0.13, 0.09, 12); roundHat.translate(0, 0.1, 0);
  const brim = new THREE.CylinderGeometry(0.19, 0.19, 0.012, 14); brim.translate(0, 0.06, 0);
  const bicorne = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); bicorne.scale(0.27, 0.12, 0.1); bicorne.translate(0, 0.06, 0);
  const helmet = new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62); helmet.translate(0, 0.02, 0);
  const crest = new THREE.BoxGeometry(0.03, 0.12, 0.26); crest.translate(0, 0.17, -0.02);

  const mk = (geo, count, mat) => {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    parent.add(m);
    return m;
  };
  const cloth = std({});
  const limbs = mk(limbGeo, n * 8, cloth);
  const torsos = mk(torsoGeo, n, cloth);
  const pelvis = mk(pelvisGeo, n, cloth);
  const heads = mk(headGeo, n, std({ roughness: 0.6 }));
  const hands = mk(handGeo, n * 2, std({ roughness: 0.6 }));
  const feet = mk(footGeo, n * 2, std({ color: '#151210' }));
  const hats = {
    round: [mk(roundHat, n, std({ color: '#141414', roughness: 0.5 })), mk(brim, n, std({ color: '#141414', roughness: 0.5 }))],
    bicorne: [mk(bicorne, n, std({ color: '#111111', roughness: 0.6 }))],
    helmet: [mk(helmet, n, std({ color: '#a8743a', roughness: 0.35, metalness: 0.9 })), mk(crest, n, std({ color: '#7d1d16' }))],
  };

  // per-figure clothing colours
  const c = new THREE.Color();
  const pick = (a, i) => a[i % a.length];
  figures.forEach((f, i) => {
    const R = ROLE[f.role || 'sailor'];
    const top = pick(R.top, i + (f.seed || 0)), skin = pick(SKIN, i * 3 + (f.seed || 0));
    const legs = R.legs ? pick(R.legs, i * 2 + (f.seed || 0)) : skin;
    const shin = R.shin || legs;
    torsos.setColorAt(i, c.set(top));
    pelvis.setColorAt(i, c.set(R.legs ? legs : top));
    heads.setColorAt(i, c.set(f.role === 'ghost' ? '#7c8f86' : skin));
    for (let k = 0; k < 2; k++) hands.setColorAt(i * 2 + k, c.set(f.role === 'ghost' ? '#7c8f86' : skin));
    // limb order: upperArm L/R, foreArm L/R, thigh L/R, shin L/R
    const cols = [top, top, f.role === 'sailor' ? skin : top, f.role === 'sailor' ? skin : top, legs, legs, shin, shin];
    if (f.role === 'sailor' && i % 2) { cols[2] = top; cols[3] = top; }        // some with sleeves down
    cols.forEach((col, k) => limbs.setColorAt(i * 8 + k, c.set(col)));
    f._hat = R.hat;
  });
  for (const m of [limbs, torsos, pelvis, heads, hands]) m.instanceColor.needsUpdate = true;

  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  const root = new THREE.Matrix4(), tmp = new THREE.Matrix4(), J = new THREE.Matrix4(), out = new THREE.Matrix4();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const rot = (x, y, z, order = 'XYZ') => tmp.makeRotationFromEuler(e.set(x, y, z, order));
  const at = (m, x, y, z) => m.multiply(new THREE.Matrix4().makeTranslation(x, y, z));
  const T = new THREE.Matrix4();
  // a limb hanging from joint J (already rotated); returns the matrix at the far end
  const segment = (mesh, idx, Jm, len, rad) => {
    out.copy(Jm).multiply(T.makeTranslation(0, -len / 2, 0)).multiply(new THREE.Matrix4().makeScale(rad, len, rad));
    mesh.setMatrixAt(idx, out);
    return Jm.clone().multiply(T.makeTranslation(0, -len, 0));
  };

  return function update(t) {
    figures.forEach((f, i) => {
      const ph = t * (f.speed || 1) + (f.phase ?? i * 1.37);
      // ---------------------------------------------------------------- pose
      let lean = 0.04 * Math.sin(ph * 0.7), twist = 0, headYaw = 0.25 * Math.sin(ph * 0.23 + i);
      let hipL = 0, hipR = 0, kneeL = 0.05, kneeR = 0.05, shPL = 0.08, shPR = 0.08, shRL = 0.12, shRR = 0.12, elL = -0.25, elR = -0.25;
      let walk = 0, turn = 0, bob = 0;
      switch (f.action) {
        case 'walk': {
          const w = ph * 3.2;
          hipL = 0.42 * Math.sin(w); hipR = -hipL;
          kneeL = 0.7 * Math.max(0, Math.sin(w + 1.6)); kneeR = 0.7 * Math.max(0, Math.sin(w + 1.6 + Math.PI));
          shPL = -0.35 * Math.sin(w); shPR = -shPL; elL = elR = -0.35;
          walk = Math.sin(ph * 0.12) * (f.walk || 3);
          turn = Math.cos(ph * 0.12) >= 0 ? 0 : Math.PI;
          bob = Math.abs(Math.cos(w)) * 0.03;
          break;
        }
        case 'haul': {
          const h = Math.sin(ph * 1.6);
          lean = 0.32 + 0.12 * h; hipL = -0.35; hipR = 0.25; kneeL = 0.45; kneeR = 0.15;
          shPL = shPR = -1.25 + 0.45 * h; shRL = shRR = 0.05; elL = elR = -0.35 - 0.3 * h;
          break;
        }
        case 'wheel': {
          const w = 0.15 * Math.sin(ph * 0.4);
          lean = 0.12; shPL = -0.95 + w; shPR = -0.95 - w; elL = elR = -0.7; shRL = shRR = 0.25;
          headYaw = 0.15 * Math.sin(ph * 0.3);
          break;
        }
        case 'lookout': {
          lean = -0.04; shPR = -2.3; shRR = 0.4; elR = -2.0; shPL = 0.05; elL = -0.2;
          headYaw = 0.5 * Math.sin(ph * 0.15);
          break;
        }
        case 'row': {
          const r = Math.sin(ph);
          lean = 0.15 + 0.45 * r; shPL = shPR = -1.35 + 0.35 * r; elL = elR = -0.2 - 0.5 * Math.max(0, r);
          hipL = hipR = -1.35; kneeL = kneeR = 1.4; // seated
          break;
        }
        default: { // idle: weight shift, a hand on the rail now and then
          const g = Math.sin(ph * 0.35);
          hipL = 0.06 * g; hipR = -0.06 * g; kneeL = 0.08 + 0.06 * Math.max(0, g); kneeR = 0.08 + 0.06 * Math.max(0, -g);
          if (f.rail) { shPR = -0.7; elR = -0.5; }
        }
      }
      // ---------------------------------------------------------------- skeleton
      root.makeRotationY((f.face || 0) + turn);
      root.setPosition(f.x, f.y, f.z);
      if (walk) root.setPosition(f.x + walk * Math.cos(f.walkDir || 0), f.y, f.z + walk * Math.sin(f.walkDir || 0));
      const sc = scale * (f.size || 1);
      root.multiply(new THREE.Matrix4().makeScale(sc, sc, sc));
      const seated = f.action === 'row';
      const hipY = seated ? 0.5 : 0.93 + bob;
      // pelvis
      const P = root.clone().multiply(T.makeTranslation(0, hipY, 0));
      pelvis.setMatrixAt(i, P);
      // torso
      const Tm = P.clone().multiply(rot(lean, twist, 0)).multiply(T.makeTranslation(0, 0.06, 0));
      torsos.setMatrixAt(i, Tm);
      // head + hat
      const H = Tm.clone().multiply(T.makeTranslation(0, 0.68, 0)).multiply(rot(-lean * 0.5, headYaw, 0));
      heads.setMatrixAt(i, H);
      for (const [name, list] of Object.entries(hats)) for (const m of list) m.setMatrixAt(i, name === f._hat ? H : ZERO);
      // arms
      for (const [k, side] of [[0, -1], [1, 1]]) {
        const sp = k ? shPR : shPL, sr = k ? shRR : shRL, el = k ? elR : elL;
        const S = Tm.clone().multiply(T.makeTranslation(side * 0.21, 0.5, 0)).multiply(rot(sp, 0, side * sr));
        const E = segment(limbs, i * 8 + k, S, 0.3, 0.055);
        E.multiply(rot(el, 0, 0));
        const W = segment(limbs, i * 8 + 2 + k, E, 0.27, 0.045);
        hands.setMatrixAt(i * 2 + k, W);
      }
      // legs
      for (const [k, side] of [[0, -1], [1, 1]]) {
        const hp = k ? hipR : hipL, kn = k ? kneeR : kneeL;
        const Hj = P.clone().multiply(T.makeTranslation(side * 0.1, -0.05, 0)).multiply(rot(hp, 0, side * 0.03));
        const K = segment(limbs, i * 8 + 4 + k, Hj, 0.44, 0.075);
        K.multiply(rot(kn, 0, 0));
        const A = segment(limbs, i * 8 + 6 + k, K, 0.43, 0.06);
        A.multiply(rot(-(hp + kn) * (seated ? 0.4 : 1) + (seated ? 0 : 0), 0, 0));
        feet.setMatrixAt(i * 2 + k, A);
      }
    });
    for (const m of [limbs, torsos, pelvis, heads, hands, feet, ...Object.values(hats).flat()]) m.instanceMatrix.needsUpdate = true;
  };
}
