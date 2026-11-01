import * as THREE from 'three';
import { SUN_DIR } from './layout';

const vert = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // always at far plane
}`;

const frag = /* glsl */ `
varying vec3 vDir;
uniform vec3 uSun;
uniform float uTime;
uniform float uGround;   // 1 = paint a ground colour below the horizon (environment capture)
uniform float uClouds;

float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){
  float s = 0.0, a = 0.5;
  for(int i=0;i<6;i++){ s += a*vn(p); p = mat2(1.6,1.2,-1.2,1.6)*p + 3.7; a *= 0.5; }
  return s;
}

void main(){
  vec3 d = normalize(vDir);
  float y = d.y;
  float h = clamp(y, 0.0, 1.0);
  vec3 zenith  = vec3(0.045, 0.13, 0.36);
  vec3 midc    = vec3(0.17, 0.33, 0.62);
  vec3 horizon = vec3(0.62, 0.66, 0.70);
  vec3 col = mix(horizon, midc, smoothstep(0.0, 0.30, h));
  col = mix(col, zenith, smoothstep(0.22, 0.95, h));
  float sd = max(dot(d, uSun), 0.0);
  // horizon warms towards the sun
  float horizonBand = exp(-abs(y) * 5.5);
  col += vec3(1.0, 0.52, 0.20) * pow(sd, 6.0) * horizonBand * 0.9;
  col += vec3(1.0, 0.62, 0.30) * pow(sd, 3.0) * 0.12;
  col += vec3(1.0, 0.75, 0.45) * pow(sd, 90.0) * 1.2;
  float disc = smoothstep(0.99935, 0.99975, sd);

  // clouds on a virtual plane
  float cl = 0.0; vec3 clCol = vec3(1.0);
  if (y > 0.015 && uClouds > 0.5) {
    vec2 uv = d.xz / (y + 0.09) * 0.55 + vec2(uTime * 0.0035, uTime * 0.0012);
    float base = fbm(uv * vec2(1.0, 1.35) + 2.0);
    float cover = smoothstep(0.50, 0.74, base);
    float sunSide = fbm(uv * vec2(1.0, 1.35) + 2.0 + normalize(uSun.xz + 1e-4) * 0.09);
    float lit = clamp((base - sunSide) * 6.0 + 0.55, 0.0, 1.0);
    vec3 shade = vec3(0.34, 0.40, 0.52);
    vec3 sunl  = vec3(1.25, 0.95, 0.72);
    clCol = mix(shade, sunl, lit);
    clCol += vec3(1.0, 0.7, 0.4) * pow(sd, 4.0) * 0.5 * (1.0 - cover * 0.5);
    float fade = smoothstep(0.015, 0.20, y);
    cl = cover * fade;
    // thin cirrus streaks
    float ci = fbm(vec2(uv.x * 0.7 + uv.y * 0.15, uv.y * 3.4) + 11.0);
    float cir = smoothstep(0.55, 0.8, ci) * 0.28 * fade * smoothstep(0.1, 0.5, y);
    col = mix(col, vec3(1.0, 0.9, 0.8), cir);
  }
  col = mix(col, clCol, cl * 0.92);

  if (y < 0.0) {
    vec3 gcol = vec3(0.10, 0.12, 0.07);
    col = mix(col, mix(horizon * 0.8, gcol, uGround), (1.0 - smoothstep(-0.05, 0.0, y)));
  }
  col += vec3(12.0, 9.5, 6.5) * disc * (1.0 - cl * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export class Sky {
  readonly mesh: THREE.Mesh;
  readonly uniforms = {
    uSun: { value: SUN_DIR.clone() },
    uTime: { value: 0 },
    uGround: { value: 0 },
    uClouds: { value: 1 },
  };
  private mat: THREE.ShaderMaterial;

  constructor() {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), this.mat);
    this.mesh.scale.setScalar(9000);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  /** Render the sky to a PMREM environment so metals reflect it. */
  buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
    const scene = new THREE.Scene();
    const envMesh = new THREE.Mesh(this.mesh.geometry, this.mat.clone());
    const m = envMesh.material as THREE.ShaderMaterial;
    m.uniforms = {
      uSun: { value: SUN_DIR.clone() },
      uTime: { value: 20 },
      uGround: { value: 1 },
      uClouds: { value: 1 },
    };
    envMesh.scale.setScalar(900);
    scene.add(envMesh);
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(scene, 0.0, 1, 5000);
    pm.dispose();
    m.dispose();
    return rt.texture;
  }

  update(camPos: THREE.Vector3, time: number) {
    this.mesh.position.copy(camPos);
    this.uniforms.uTime.value = time;
  }
}
