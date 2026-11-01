import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Underwater set dressing: textured seabed, boulders and pebbles, kelp, sea stars,
// anemones, urchins, jellyfish, a school of fish and the diver's torch beam. Everything here sits below y = 0.

const hash2 = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
const fbm2 = (x, y, oct = 5) => {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2(x * f, y * f); a *= 0.5; f *= 2.02; }
  return v;
};

// Seabed height: a basin around −17 m with a ridge rising toward the near iceberg.
export function seabedHeight(x, z) {
  const ridge = Math.exp(-(((x - 16) ** 2) / 900 + ((z - 14) ** 2) / 500)) * 6;
  return -17 + fbm2(x * 0.03, z * 0.03) * 5 + fbm2(x * 0.15, z * 0.15, 3) * 0.8 + ridge;
}

export function createUnderwater(world, { addCaustics, clipPlane, rng, models }) {
  const group = new THREE.Group();
  world.add(group);

  // Seabed
  const size = 280, seg = 180;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2).translate(6, 0, 6);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const rock = new THREE.Color(0.05, 0.055, 0.06), rock2 = new THREE.Color(0.11, 0.1, 0.09), sand = new THREE.Color(0.32, 0.3, 0.25);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, seabedHeight(x, z));
    const patch = THREE.MathUtils.smoothstep(fbm2(x * 0.05 + 9, z * 0.05), 0.05, 0.3);
    c.copy(rock).lerp(rock2, 0.5 + 0.5 * noise2(x * 0.4, z * 0.4)).lerp(sand, patch);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const bedMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, clippingPlanes: [clipPlane] });
  // Break up the vertex colours with layered noise and pale pebble speckles.
  addCaustics(bedMat, { color: /* glsl */`
    float bd1 = vnoise12(vCWorld.xz * 1.7), bd2 = vnoise12(vCWorld.xz * 6.3), bd3 = vnoise12(vCWorld.xz * 0.35);
    diffuseColor.rgb *= 0.55 + 0.35 * bd1 + 0.25 * bd2 + 0.3 * bd3;
    vec2 cell = floor(vCWorld.xz * 9.0);
    float speck = step(0.92, hash12(cell)) * smoothstep(0.45, 0.2, length(fract(vCWorld.xz * 9.0) - 0.5));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.38, 0.36, 0.31), speck * 0.7);
  ` });
  const bed = new THREE.Mesh(geo, bedMat);
  bed.receiveShadow = true;
  group.add(bed);

  // Boulders
  const lump = new THREE.IcosahedronGeometry(1, 2);
  const lp = lump.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < lp.count; i++) {
    v.fromBufferAttribute(lp, i);
    v.multiplyScalar(1 + 0.3 * noise2(v.x * 2 + v.z, v.y * 2 + 3));
    lp.setXYZ(i, v.x, v.y * 0.7, v.z);
  }
  lump.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.95, flatShading: true, clippingPlanes: [clipPlane] });
  addCaustics(rockMat);
  const boulders = new THREE.InstancedMesh(lump, rockMat, 70);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
  for (let i = 0; i < boulders.count; i++) {
    const x = -30 + rng() * 70, z = -30 + rng() * 70, k = 0.4 + rng() ** 2 * 3.2;
    q.setFromEuler(e.set(rng(), rng() * 6.28, rng()));
    m.compose(v.set(x, seabedHeight(x, z) + k * 0.25, z), q, s.set(k * (0.8 + rng() * 0.5), k, k * (0.8 + rng() * 0.5)));
    boulders.setMatrixAt(i, m);
  }
  group.add(boulders);

  // Kelp (kelp.glb, 1 m tall): stipe and ruffled blades that sway, in clumps on the rises.
  const kelpMat = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0x8a7a4c, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x080a03, clippingPlanes: [clipPlane] });
  addCaustics(kelpMat, { vertex: /* glsl */`
    float kph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
    float kb = pow(max(position.y, 0.0), 1.4);
    transformed.x += (sin(uCausticTime * 0.7 + kph + position.y * 2.2) * 0.35 + sin(uCausticTime * 1.3 + kph * 2.0) * 0.12) * kb;
    transformed.z += cos(uCausticTime * 0.55 + kph + position.y * 1.7) * 0.25 * kb;
  ` });
  const kelp = new THREE.InstancedMesh(models.kelp, kelpMat, 190);
  let n = 0;
  const clumps = [[-6, 8], [3, 12], [10, -4], [14, 6], [-10, -6], [-2, -10], [7, 18], [-14, 4]];
  for (const [cx, cz] of clumps) {
    for (let j = 0; j < 24 && n < kelp.count; j++, n++) {
      const x = cx + (rng() - 0.5) * 6, z = cz + (rng() - 0.5) * 6, h = 2.5 + rng() * 4.5;
      q.setFromEuler(e.set((rng() - 0.5) * 0.25, rng() * 6.28, (rng() - 0.5) * 0.25));
      m.compose(v.set(x, seabedHeight(x, z) - 0.05, z), q, s.set(h * 0.9, h, h * 0.9));
      kelp.setMatrixAt(n, m);
    }
  }
  kelp.count = n;
  group.add(kelp);


  // Small life on the bottom, all instanced and tinted per instance.
  const onBed = (x, z, lift = 0) => v.set(x, seabedHeight(x, z) + lift, z);
  const scatter = (mesh, n, place) => {
    for (let i = 0; i < n; i++) {
      const x = -26 + rng() * 64, z = -26 + rng() * 64;
      place(i, x, z);
      mesh.setMatrixAt(i, m);
    }
    group.add(mesh);
  };
  const tint = new THREE.Color();

  const pebbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true, clippingPlanes: [clipPlane] });
  addCaustics(pebbleMat);
  const pebbles = new THREE.InstancedMesh(lump, pebbleMat, 520);
  scatter(pebbles, 520, (i, x, z) => {
    const k = 0.05 + rng() ** 2 * 0.25;
    q.setFromEuler(e.set(rng() * 3, rng() * 6.28, rng() * 3));
    m.compose(onBed(x, z, k * 0.2), q, s.set(k, k * 0.8, k));
    pebbles.setColorAt(i, tint.setRGB(0.08 + rng() * 0.18, 0.08 + rng() * 0.15, 0.07 + rng() * 0.12));
  });

  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.38 : 1;
    i ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = new THREE.ExtrudeGeometry(star, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.1, bevelSegments: 2 }).rotateX(-Math.PI / 2);
  const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, clippingPlanes: [clipPlane] });
  addCaustics(starMat);
  const stars = new THREE.InstancedMesh(starGeo, starMat, 90);
  const starCols = [[0.8, 0.22, 0.06], [0.75, 0.38, 0.08], [0.38, 0.08, 0.3], [0.85, 0.5, 0.35]];
  scatter(stars, 90, (i, x, z) => {
    const k = 0.1 + rng() * 0.14;
    q.setFromEuler(e.set((rng() - 0.5) * 0.3, rng() * 6.28, (rng() - 0.5) * 0.3));
    m.compose(onBed(x, z, 0.02), q, s.set(k, k, k));
    stars.setColorAt(i, tint.setRGB(...starCols[i % starCols.length]));
  });

  // Anemones (anemone.glb): column, oral disc and a crown of tentacles that sway.
  const anemoneMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, clippingPlanes: [clipPlane] });
  addCaustics(anemoneMat, { vertex: /* glsl */`
    float aph = instanceMatrix[3].x * 1.9 + instanceMatrix[3].z * 1.3;
    float aw = smoothstep(0.24, 0.34, position.y);
    transformed.x += sin(uCausticTime * 1.1 + aph + position.x * 20.0) * 0.03 * aw;
    transformed.z += cos(uCausticTime * 0.9 + aph + position.z * 20.0) * 0.025 * aw;
  ` });
  const anemones = new THREE.InstancedMesh(models.anemone, anemoneMat, 120);
  const anCols = [[1, 1, 1], [1, 0.7, 0.55], [1, 0.5, 0.55], [1, 0.8, 0.4]];
  scatter(anemones, 120, (i, x, z) => {
    const k = 0.8 + rng() * 1.6;
    q.setFromEuler(e.set((rng() - 0.5) * 0.3, rng() * 6.28, (rng() - 0.5) * 0.3));
    m.compose(onBed(x, z, -0.02), q, s.set(k, k, k));
    anemones.setColorAt(i, tint.setRGB(...anCols[i % anCols.length]));
  });

  const urchinGeo = new THREE.IcosahedronGeometry(1, 2);
  {
    const up = urchinGeo.attributes.position;
    for (let i = 0; i < up.count; i++) {
      v.fromBufferAttribute(up, i);
      const spike = hash2(Math.round(v.x * 50), Math.round(v.y * 50 + v.z * 30)) > 0.55 ? 1.9 : 1;
      up.setXYZ(i, v.x * spike, Math.max(v.y * spike, -0.4), v.z * spike);
    }
    urchinGeo.computeVertexNormals();
  }
  const urchinMat = new THREE.MeshStandardMaterial({ color: 0x2a1030, roughness: 0.5, flatShading: true, clippingPlanes: [clipPlane] });
  addCaustics(urchinMat);
  const urchins = new THREE.InstancedMesh(urchinGeo, urchinMat, 80);
  scatter(urchins, 80, (i, x, z) => {
    const k = 0.05 + rng() * 0.05;
    q.setFromEuler(e.set(0, rng() * 6.28, 0));
    m.compose(onBed(x, z, k * 0.5), q, s.set(k, k, k));
  });

  // Jellyfish: translucent pulsing bells trailing fine tentacles.
  const bellGeo = new THREE.SphereGeometry(0.32, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xff9a60, emissive: 0x401406, roughness: 0.25, transparent: true, opacity: 0.5,
    side: THREE.DoubleSide, depthWrite: false, clippingPlanes: [clipPlane],
  });
  const tentMat = new THREE.LineBasicMaterial({ color: 0xffb080, transparent: true, opacity: 0.45, depthWrite: false, clippingPlanes: [clipPlane] });
  const TENT = 22, SEGS = 14;
  const jellies = Array.from({ length: 7 }, (_, j) => {
    const g = new THREE.Group();
    const bell = new THREE.Mesh(bellGeo, bellMat);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 6, 28).rotateX(Math.PI / 2), bellMat);
    lip.position.y = 0.05;
    const tpos = new Float32Array(TENT * SEGS * 2 * 3);
    const tgeo = new THREE.BufferGeometry();
    tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
    const lines = new THREE.LineSegments(tgeo, tentMat);
    lines.frustumCulled = false;
    g.add(bell, lip, lines);
    group.add(g);
    return { g, bell, tpos, tgeo, ph: rng() * 6.28, cx: -8 + rng() * 26, cz: -6 + rng() * 22, cy: -3 - rng() * 6, len: 1.2 + rng() * 1.6, r: 2 + rng() * 4 };
  });

  // A school of small silver fish circling a centre that drifts along the route.
  const fishMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.45, roughness: 0.35, side: THREE.DoubleSide, clippingPlanes: [clipPlane] });
  addCaustics(fishMat, { vertex: /* glsl */`
    float fph = instanceMatrix[3].x * 3.1 + instanceMatrix[3].y * 1.7;
    transformed.x += sin(uCausticTime * 14.0 + fph + position.z * 22.0) * 0.03 * smoothstep(0.02, -0.2, position.z);
  ` });
  const FISH = 140;
  const fish = new THREE.InstancedMesh(models.fish, fishMat, FISH);
  fish.frustumCulled = false;
  const fishData = Array.from({ length: FISH }, () => ({
    a: rng() * 6.28, r: 1.2 + rng() * 2.6, h: (rng() - 0.5) * 2.2, sp: 0.35 + rng() * 0.25, wob: rng() * 6.28,
  }));
  group.add(fish);

  // Dive torch: spot light plus a soft additive beam cone.
  const torch = new THREE.SpotLight(0xd8f4ff, 0, 24, 0.33, 0.65, 1.3);
  world.add(torch, torch.target);
  const beamGeo = new THREE.CylinderGeometry(0.04, 2.4, 9, 32, 1, true).translate(0, -4.5, 0).rotateX(-Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uK: { value: 0 } },
    vertexShader: `varying float vL; varying vec3 vN; varying vec3 vV;
      void main() { vL = position.z / 9.0; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying float vL; varying vec3 vN; varying vec3 vV;
      void main() { float edge = pow(abs(dot(vN, vV)), 1.5);
        gl_FragColor = vec4(vec3(0.55, 0.8, 0.9) * edge * (1.0 - vL) * (1.0 - vL) * 0.16 * uK, 1.0); }`,
  }));
  beam.frustumCulled = false;
  world.add(beam);

  const centre = new THREE.Vector3(), fwd = new THREE.Vector3(), head = new THREE.Vector3(), tmp = new THREE.Vector3();
  const look = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0);

  return {
    group,
    update(t, rig, diverUnder, cameraUnder) {
      // jellyfish: pulse, drift, tentacles trail behind the motion
      for (const J of jellies) {
        const pulse = Math.sin(t * 1.6 + J.ph);
        const a = t * 0.04 + J.ph;
        J.g.position.set(J.cx + Math.cos(a) * J.r, J.cy + Math.sin(t * 0.25 + J.ph) * 0.8 + Math.max(0, pulse) * 0.05, J.cz + Math.sin(a) * J.r);
        J.bell.scale.set(1 + pulse * 0.1, 1 - pulse * 0.12, 1 + pulse * 0.1);
        let k = 0;
        for (let i = 0; i < TENT; i++) {
          const ang = (i / TENT) * Math.PI * 2, rr = 0.24 * (1 + pulse * 0.1);
          let px = Math.cos(ang) * rr, py = 0.04, pz = Math.sin(ang) * rr;
          for (let sgi = 0; sgi < SEGS; sgi++) {
            const f = (sgi + 1) / SEGS;
            const nx = Math.cos(ang) * rr * (1 - f * 0.6) + Math.sin(t * 0.9 + J.ph + f * 4 + i) * 0.12 * f;
            const ny = 0.04 - f * J.len;
            const nz = Math.sin(ang) * rr * (1 - f * 0.6) + Math.cos(t * 0.8 + J.ph + f * 3.5 + i * 0.7) * 0.12 * f;
            J.tpos.set([px, py, pz, nx, ny, nz], k);
            k += 6;
            px = nx; py = ny; pz = nz;
          }
        }
        J.tgeo.attributes.position.needsUpdate = true;
      }

      // fish
      centre.set(5 + Math.sin(t * 0.05) * 6, -8.5 + Math.sin(t * 0.13) * 1.2, 5 + Math.cos(t * 0.05) * 6);
      for (let i = 0; i < FISH; i++) {
        const f = fishData[i];
        const a = f.a + t * f.sp;
        const r = f.r + Math.sin(t * 0.7 + f.wob) * 0.35;
        v.set(centre.x + Math.cos(a) * r, centre.y + f.h + Math.sin(t * 1.1 + f.wob) * 0.25, centre.z + Math.sin(a) * r);
        tmp.set(-Math.sin(a), 0.08 * Math.cos(t * 1.1 + f.wob), Math.cos(a)).add(v);
        look.lookAt(tmp, v, up);
        q.setFromRotationMatrix(look);
        m.compose(v, q, s.set(1, 1, 1));
        fish.setMatrixAt(i, m);
      }
      fish.instanceMatrix.needsUpdate = true;

      // torch follows the diver's head, aimed along the body's forward axis
      const k = diverUnder ? 1 : 0;
      torch.intensity = 40 * k;
      beam.material.uniforms.uK.value = k;
      // The beam is an in-water effect only: seen from above (and in the mirrored
      // reflection pass) its additive cone would write alpha without colour and
      // show up as a black slab on the sea.
      beam.visible = diverUnder && cameraUnder;
      if (diverUnder) {
        rig.head.getWorldPosition(head);
        // aim along the direction of travel, tipped slightly down
        const yaw = rig.root.rotation.y;
        fwd.set(Math.sin(yaw), -0.3, Math.cos(yaw)).normalize();
        torch.position.copy(head).addScaledVector(fwd, 0.25);
        torch.target.position.copy(head).addScaledVector(fwd, 10);
        torch.target.updateMatrixWorld();
        beam.position.copy(torch.position);
        beam.lookAt(torch.target.position);
      }
    },
  };
}
