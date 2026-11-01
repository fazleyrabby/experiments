import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Stage } from '../core/stage';
import { detectQuality } from '../core/quality';
import { Locomotive } from '../train/locomotive';

/** Isolated model viewer for development: ?view=loco */
export function runViewer(app: HTMLElement, kind: string) {
  const stage = new Stage(app, detectQuality());
  stage.scene.fog = null;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x3a3a35, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  ground.receiveShadow = true;
  stage.scene.add(ground);
  // rails
  const railMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.4 });
  for (const sd of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 200), railMat);
    r.position.set(sd * 0.7515, -0.075, 0);
    stage.scene.add(r);
  }
  const loco = new Locomotive();
  stage.scene.add(loco.root, loco.bogie, loco.trailing);
  loco.bogie.position.set(0, 0, 4.375);
  loco.trailing.position.set(0, 0, -4.05);
  const controls = new OrbitControls(stage.camera, stage.renderer.domElement);
  controls.target.set(0, 1.8, 1);
  stage.camera.position.set(9, 3.2, 8);
  controls.update();
  stage.updateShadow(new THREE.Vector3(0, 1, 0), 18);
  (window as any).__he = { stage, loco, controls };
  const clock = new THREE.Clock();
  let theta = 0;
  const loop = () => {
    const dt = clock.getDelta();
    if (!(window as any).__freeze) theta += dt * 3.0;
    const th = (window as any).__theta ?? theta;
    loco.update(th, 1, true, clock.elapsedTime);
    controls.update();
    stage.updateShadow(controls.target, 16);
    stage.render(clock.elapsedTime);
    requestAnimationFrame(loop);
  };
  loop();
  const loader = document.getElementById('loader');
  loader?.remove();
  void kind;
}
