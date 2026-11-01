import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FinalPass } from './finalpass';
import { SUN_DIR } from '../world/layout';
import { Sky } from '../world/sky';
import { installFog, FOG } from './fog';
import { shared } from './shaders';
import type { Quality } from './quality';

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;
  readonly sky = new Sky();
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  private bloom: UnrealBloomPass;
  private grade: FinalPass;
  private shadowSize: number;
  private pixelRatioCap: number;
  /** dynamic-resolution multiplier (adapts to keep the frame rate smooth) */
  pixelScale: number;
  shadowFocus = new THREE.Vector3();
  shadowRadius = 90;

  constructor(readonly container: HTMLElement, readonly quality: Quality) {
    installFog();
    this.shadowSize = quality.shadowMap;
    this.pixelRatioCap = quality.pixelCap;
    this.pixelScale = quality.startScale;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.setPixelRatio(this.basePR() * this.pixelScale);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.25, 16000);
    this.camera.position.set(-150, 70, 180);

    // atmosphere
    this.scene.background = null;
    this.scene.fog = new THREE.Fog(new THREE.Color().setRGB(0.50, 0.60, 0.72), FOG.density, 1);
    this.scene.add(this.sky.mesh);
    this.scene.environment = this.sky.buildEnvironment(this.renderer);
    this.scene.environmentIntensity = 0.78;

    // lights
    this.sun = new THREE.DirectionalLight(new THREE.Color().setRGB(1.0, 0.76, 0.52), 5.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.shadowSize, this.shadowSize);
    this.sun.shadow.bias = -0.00035;
    this.sun.shadow.normalBias = 0.06;
    this.sun.shadow.radius = 2.0;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 1700;
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(new THREE.Color().setRGB(0.50, 0.66, 0.92), new THREE.Color().setRGB(0.20, 0.24, 0.12), 0.7);
    this.scene.add(this.hemi);

    // post
    const w = container.clientWidth, h = container.clientHeight;
    const pr = this.renderer.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, samples: quality.msaa });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w * quality.bloomScale, h * quality.bloomScale), 0.26, 0.62, 0.92);
    this.composer.addPass(this.bloom);
    this.grade = new FinalPass();
    this.composer.addPass(this.grade);
    this.composer.setSize(w, h);

    window.addEventListener('resize', this.onResize);
  }

  private basePR() {
    return Math.min(window.devicePixelRatio, this.pixelRatioCap);
  }

  /** change the render resolution multiplier (0.5 .. 1) */
  setPixelScale(k: number) {
    k = Math.max(this.quality.minScale, Math.min(1, k));
    if (Math.abs(k - this.pixelScale) < 0.01) return;
    this.pixelScale = k;
    this.onResize();
  }

  private onResize = () => {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (w < 2 || h < 2) return;
    this.renderer.setPixelRatio(this.basePR() * this.pixelScale);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w * this.quality.bloomScale, h * this.quality.bloomScale);
  };

  /** Fit the shadow frustum to a focus sphere (snapped to shadow texels to avoid shimmer). */
  updateShadow(focus: THREE.Vector3, radius: number) {
    radius = Math.max(radius, 20);
    this.shadowRadius += (radius - this.shadowRadius) * 0.08;
    const r = this.shadowRadius;
    const cam = this.sun.shadow.camera;
    cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r;
    cam.updateProjectionMatrix();
    // texel snapping in light space
    const texel = (2 * r) / this.shadowSize;
    const lightDir = SUN_DIR;
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, lightDir).normalize();
    const trueUp = new THREE.Vector3().crossVectors(lightDir, right).normalize();
    const fx = Math.round(focus.dot(right) / texel) * texel;
    const fy = Math.round(focus.dot(trueUp) / texel) * texel;
    const fz = focus.dot(lightDir);
    const snapped = new THREE.Vector3().addScaledVector(right, fx).addScaledVector(trueUp, fy).addScaledVector(lightDir, fz);
    this.sun.target.position.copy(snapped);
    this.sun.position.copy(snapped).addScaledVector(lightDir, 800);
    this.sun.target.updateMatrixWorld();
    this.shadowFocus.copy(snapped);
    shared.uShadowFocus.value.set(snapped.x, snapped.y, snapped.z, r);
  }

  render(time: number) {
    this.grade.uniforms.uTime.value = time;
    this.sky.update(this.camera.position, time);
    this.composer.render();
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
  }
}
