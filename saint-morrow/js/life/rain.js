import * as THREE from 'three/webgpu';
import {
  Fn, abs, attribute, cameraPosition, cross, float, floor, fract, length, mix, normalize, oneMinus, positionGeometry,
  positionWorld, pow, sin, smoothstep, step, time, uv, vec2, vec3,
} from 'three/tsl';
import { additiveOutputs } from '../materials/surfaces.js';
import { seededRandom } from '../world/geometry.js';

const WIND = vec3(0.95, -9.6, 0.38);

function quad() {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
}

function seeds(count, salt) {
  const random = seededRandom(salt);
  const data = new Float32Array(count * 4);
  for (let i = 0; i < data.length; i++) data[i] = random();
  return new THREE.InstancedBufferAttribute(data, 4);
}

function createStreaks(count) {
  const geometry = quad();
  geometry.setAttribute('aSeed', seeds(count, 3301));
  geometry.instanceCount = count;

  const seed = attribute('aSeed', 'vec4');
  const box = vec3(36, 24, 36);
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  material.positionNode = Fn(() => {
    const speed = mix(float(0.84), float(1.16), seed.w);
    const moved = seed.xyz.add(WIND.mul(time).mul(speed).div(box)).sub(cameraPosition.div(box));
    const center = fract(moved).sub(0.5).mul(box).add(cameraPosition);
    const direction = normalize(WIND);
    const view = normalize(cameraPosition.sub(center));
    const right = normalize(cross(direction, view));
    const thickness = mix(float(0.004), float(0.01), seed.w);
    const streak = mix(float(0.42), float(0.86), seed.w);
    return center.add(right.mul(positionGeometry.x).mul(thickness)).add(direction.mul(positionGeometry.y).mul(streak));
  })();
  material.colorNode = mix(vec3(0.58, 0.66, 0.78), vec3(1, 0.72, 0.45), seed.x.mul(0.45));
  const nearFade = smoothstep(0.9, 4.2, length(positionWorld.sub(cameraPosition)));
  material.opacityNode = sin(uv().y.mul(Math.PI)).mul(smoothstep(0, 0.5, oneMinus(abs(uv().x.sub(0.5)).mul(2)))).mul(nearFade).mul(0.17);
  material.mrtNode = additiveOutputs();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 20;
  return mesh;
}

function createSplashes(count) {
  const geometry = quad();
  geometry.setAttribute('aSeed', seeds(count, 7717));
  geometry.instanceCount = count;

  const seed = attribute('aSeed', 'vec4');
  const rate = mix(float(2.6), float(4.4), seed.w);
  const clock = time.mul(rate).add(seed.z.mul(17));
  const cycle = fract(clock);
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  material.positionNode = Fn(() => {
    const id = floor(clock);
    const hash = fract(sin(id.mul(vec2(12.9898, 78.233)).add(seed.xy.mul(91.7))).mul(43758.5453));
    const relative = hash.sub(0.5).mul(30);
    const x = cameraPosition.x.add(relative.x);
    const z = cameraPosition.z.add(relative.y);
    const onSidewalk = step(5.02, abs(x));
    const inside = step(abs(x), 7.92).mul(step(abs(z), 59.5));
    const base = vec3(x, onSidewalk.mul(0.152).add(0.012), z);
    const toCamera = cameraPosition.sub(base);
    const right = normalize(vec3(toCamera.z, 0, toCamera.x.negate()));
    const size = mix(float(0.04), float(0.095), seed.y).mul(inside);
    return base.add(right.mul(positionGeometry.x).mul(size)).add(vec3(0, positionGeometry.y.mul(size), 0));
  })();

  // A small crown: thrown droplets on ballistic arcs above a thin impact rim. Nothing reaches the quad edge.
  const p = vec2(uv().x.sub(0.5).mul(2), uv().y);
  const droplet = (spread, height) => {
    const arc = cycle.mul(oneMinus(cycle)).mul(4).mul(height).add(0.05);
    const offset = p.sub(vec2(cycle.mul(spread).mul(0.8), arc));
    const size = float(0.07).mul(oneMinus(cycle.mul(0.5)));
    return oneMinus(smoothstep(size.mul(0.3), size, length(offset)));
  };
  const crown = droplet(-0.9, 0.42).add(droplet(-0.45, 0.72)).add(droplet(0.05, 0.86)).add(droplet(0.5, 0.66)).add(droplet(0.92, 0.38));
  const edge = oneMinus(smoothstep(0.86, 1, abs(p.x))).mul(oneMinus(smoothstep(0.9, 1, p.y)));
  const distanceFade = oneMinus(smoothstep(9, 17, length(positionWorld.sub(cameraPosition))));
  material.colorNode = vec3(0.8, 0.78, 0.74);
  material.opacityNode = crown.mul(edge).mul(distanceFade).mul(pow(oneMinus(cycle), 1.8)).mul(0.26);
  material.mrtNode = additiveOutputs();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 19;
  return mesh;
}

export function createRain(scene, tier) {
  const streakCount = tier.name === 'ultra' ? 15000 : tier.name === 'high' ? 10000 : 5000;
  const splashCount = tier.name === 'ultra' ? 2400 : tier.name === 'high' ? 1600 : 700;
  const streaks = createStreaks(streakCount);
  const splashes = createSplashes(splashCount);
  scene.add(streaks, splashes);
  return { streaks, splashes };
}
