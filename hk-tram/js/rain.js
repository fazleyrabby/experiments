/* rain.js — GPU-animated rain streaks that wrap around the camera. */
import * as THREE from 'three';

const VERT = /* glsl */`
uniform float uTime; uniform vec3 uCam; uniform vec3 uBox; uniform float uAmount;
attribute float aEnd;
varying float vA;
void main(){
  vec3 vel = vec3(1.4, -15.0, 0.5);
  vec3 base = position * uBox;
  vec3 p = mod(base + vel*uTime - uCam, uBox) - uBox*0.5;
  vec3 dir = normalize(vel);
  vec3 wp = uCam + p - dir * 0.6 * aEnd;
  float dist = length(p.xz);
  float keep = step(position.x, uAmount);
  vA = (1.0 - smoothstep(9.0, 17.0, dist)) * (1.0 - 0.85*aEnd) * step(0.05, wp.y) * keep;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FRAG = /* glsl */`
varying float vA;
void main(){ gl_FragColor = vec4(vec3(0.62,0.74,1.0)*1.5, vA*0.3); }`;

export function createRain(count = 9000) {
  const pos = new Float32Array(count * 2 * 3);
  const end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = Math.random(), y = Math.random(), z = Math.random();
    for (let k = 0; k < 2; k++) {
      const o = (i * 2 + k) * 3;
      pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
      end[i * 2 + k] = k;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(36, 24, 36) },
      uAmount: { value: 1 },
    },
  });
  const mesh = new THREE.LineSegments(g, m);
  mesh.frustumCulled = false;
  return mesh;
}
