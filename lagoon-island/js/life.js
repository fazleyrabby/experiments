import * as THREE from 'three';
import { GB, rng, lerp } from './util.js';
import { heightAt } from './world.js';

function birdGeometry() {
  const g = new GB();
  const white = [0.86, 0.85, 0.8];
  const tip = [0.42, 0.42, 0.42];
  const wing = (s) => {
    const a = g.v(0, 0, 0.1, 0, 1, 0, white[0], white[1], white[2], 0);
    const b = g.v(0, 0, -0.1, 0, 1, 0, white[0], white[1], white[2], 0);
    const c = g.v(s * 0.22, 0.015, -0.1, 0, 1, 0, white[0], white[1], white[2], 0.5);
    const d = g.v(s * 0.22, 0.015, 0.11, 0, 1, 0, white[0], white[1], white[2], 0.5);
    const e = g.v(s * 0.46, 0.03, -0.05, 0, 1, 0, tip[0], tip[1], tip[2], 1);
    const f = g.v(s * 0.46, 0.03, 0.07, 0, 1, 0, tip[0], tip[1], tip[2], 1);
    g.quad(a, b, c, d);
    g.quad(d, c, e, f);
  };
  wing(1);
  wing(-1);
  const body = (z0, z1, r0, r1) => {
    const base = g.count;
    for (const [z, r] of [[z0, r0], [z1, r1]]) {
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        g.v(Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a), Math.sin(a), 0, white[0], white[1], white[2], 0);
      }
    }
    for (let j = 0; j < 6; j++) g.quad(base + j, base + ((j + 1) % 6), base + 6 + ((j + 1) % 6), base + 6 + j);
  };
  body(-0.2, 0.08, 0.012, 0.042);
  body(0.08, 0.3, 0.042, 0.012);
  return g.build();
}

export function buildLife(U) {
  const R = rng(5150);
  const group = new THREE.Group();
  const birdMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
  const flap = (s) => {
    s.uniforms.uTime = U.uTime;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aWind; uniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float birdId = instanceMatrix[3].x * 3.1 + instanceMatrix[3].z * 1.7;
         float beat = sin(uTime * 5.4 + birdId) * (0.55 + 0.45 * sin(uTime * 0.37 + birdId));
         transformed.y += aWind.x * abs(position.x) * beat * 0.82;`,
      );
  };
  birdMat.onBeforeCompile = flap;
  birdMat.customProgramCacheKey = () => 'bird';
  const birdDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  birdDepth.onBeforeCompile = flap;
  birdDepth.customProgramCacheKey = () => 'bird-depth';
  const count = 7;
  const birds = new THREE.InstancedMesh(birdGeometry(), birdMat, count);
  birds.customDepthMaterial = birdDepth;
  birds.castShadow = true;
  birds.frustumCulled = false;
  group.add(birds);
  const flock = Array.from({ length: count }, (_, i) => ({
    off: i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.052 + (R() - 0.5) * 0.012,
    lat: i === 0 ? 0 : Math.ceil(i / 2) * 0.52 * (i % 2 ? 1 : -1) + (R() - 0.5) * 0.14,
    h: (R() - 0.5) * 0.36,
    s: 0.82 + R() * 0.3,
  }));

  const fxScene = new THREE.Scene();
  const fireCount = 130;
  const pos = new Float32Array(fireCount * 3);
  const seed = new Float32Array(fireCount * 4);
  for (let i = 0; i < fireCount; i++) {
    let x = 0;
    let z = 0;
    let y = -1;
    for (let t = 0; t < 24 && y < 0.24; t++) {
      const a = R() * Math.PI * 2;
      const r = Math.sqrt(R()) * 10.6;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = heightAt(x, z);
    }
    pos.set([x, Math.max(y, 0.1) + 0.18 + R() * 0.75, z], i * 3);
    seed.set([R() * 6.28, 0.32 + R() * 0.6, R() * 6.28, 0.5 + R() * 0.8], i * 4);
  }
  const fireGeo = new THREE.BufferGeometry();
  fireGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  fireGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const fireMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.uTime,
      uNight: { value: 0 },
      uH: { value: 800 },
      tDepth: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uInvP: { value: new THREE.Matrix4() },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime, uNight, uH;
      varying float vA;
      varying float vZ;
      void main() {
        float t = uTime * aSeed.y;
        vec3 p = position + vec3(sin(t + aSeed.x) * 0.34 + sin(t * 2.3 + aSeed.z) * 0.08,
                                 sin(t * 0.72 + aSeed.z) * 0.17,
                                 cos(t * 0.9 + aSeed.x) * 0.34);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vZ = mv.z;
        float pulse = pow(max(sin(uTime * 1.25 * aSeed.w + aSeed.x), 0.0), 3.0);
        vA = pulse * uNight;
        gl_PointSize = clamp(uH * 0.075 / -mv.z, 1.5, 22.0) * (0.7 + pulse * 0.5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDepth;
      uniform vec2 uRes;
      uniform mat4 uInvP;
      varying float vA;
      varying float vZ;
      void main() {
        if (vA < 0.01) discard;
        vec2 uv = gl_FragCoord.xy / uRes;
        vec4 c = uInvP * vec4(uv * 2.0 - 1.0, texture2D(tDepth, uv).r * 2.0 - 1.0, 1.0);
        if (c.z / c.w > vZ + 0.02) discard;
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float core = exp(-d * d * 18.0) * 7.0 + exp(-d * d * 3.2) * 0.42;
        gl_FragColor = vec4(vec3(0.82, 1.0, 0.3) * core * vA, 1.0);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendEquation: THREE.AddEquation,
  });
  const fireflies = new THREE.Points(fireGeo, fireMat);
  fireflies.frustumCulled = false;
  fxScene.add(fireflies);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler(0, 0, 0, 'YXZ');
  const p = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const birdScale = (night) => lerp(0.56, 0.001, night);

  return {
    group,
    fxScene,
    fireMat,
    update(time, night, pipeline, camera) {
      const speed = 0.082;
      const lap = time * speed;
      flock.forEach((b, i) => {
        const a = lap - Math.abs(b.off);
        const rad = 12.5 + Math.sin(a * 2.3) * 2.2 + b.lat * 0.72;
        const ang = a + b.off * 0.2;
        p.set(Math.cos(ang) * rad, 7.1 + Math.sin(a * 3.1) * 0.7 + b.h, Math.sin(ang) * rad);
        e.set(0.03, -ang + Math.PI, Math.sin(a * 2.3) * 0.2);
        q.setFromEuler(e);
        sc.setScalar(birdScale(night) * b.s);
        m.compose(p, q, sc);
        birds.setMatrixAt(i, m);
      });
      birds.instanceMatrix.needsUpdate = true;
      const u = fireMat.uniforms;
      u.uNight.value = night;
      u.uH.value = pipeline.ih;
      u.tDepth.value = pipeline.sceneRT.depthTexture;
      u.uRes.value.set(pipeline.iw, pipeline.ih);
      u.uInvP.value.copy(camera.projectionMatrixInverse);
    },
  };
}
