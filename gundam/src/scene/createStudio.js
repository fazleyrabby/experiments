import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

export function createStudio(canvas,{reducedMotion=false}={}) {
  const coarse=window.matchMedia('(pointer: coarse)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.5:1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x080b0e);
  scene.fog=new THREE.FogExp2(0x080b0e,.025);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);
  room.dispose();pmrem.dispose();
  scene.environment=environment.texture;
  scene.environmentIntensity=.42;

  const camera=new THREE.PerspectiveCamera(31,1,.1,180);
  const controls=new OrbitControls(camera,canvas);
  controls.enableDamping=!reducedMotion;controls.dampingFactor=.07;
  controls.minDistance=10;controls.maxDistance=100;
  controls.minPolarAngle=.24;controls.maxPolarAngle=Math.PI*.58;
  controls.rotateSpeed=.7;controls.zoomSpeed=.8;
  // Orbit the suit's vertical center; no side offsets or automatic turntable.
  const center=new THREE.Vector3(.28,8.55,0);
  controls.target.copy(center);
  const direction=new THREE.Vector3(.36,.045,1).normalize();

  const hemi=new THREE.HemisphereLight(0xdbe9ff,0x1a2630,1.5);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xfff4e4,4.3);key.position.set(-10,23,13);
  key.castShadow=true;key.shadow.mapSize.set(coarse?1024:2048,coarse?1024:2048);
  Object.assign(key.shadow.camera,{left:-16,right:16,top:22,bottom:-12,near:.5,far:80});
  key.shadow.normalBias=.025;key.shadow.bias=-.00015;key.shadow.radius=4;
  key.target.position.set(0,8,0);scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xc7dfff,1.8);fill.position.set(13,11,9);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xe0edff,5.2);rim.position.set(2,18,-12);scene.add(rim);
  const lowFill=new THREE.DirectionalLight(0x8ca6bf,.55);lowFill.position.set(-3,2,8);scene.add(lowFill);

  const floor=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:0x10171d,roughness:.90,metalness:.15}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.07;floor.receiveShadow=true;scene.add(floor);
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:coarse?0:4});
  const composer=new EffectComposer(renderer,target);
  composer.addPass(new RenderPass(scene,camera));
  const ao=coarse?null:new GTAOPass(scene,camera,1,1);
  if(ao) {
    ao.updateGtaoMaterial({radius:.55,distanceExponent:1.8,thickness:.9,scale:.8,samples:12});
    ao.blendIntensity=.7;composer.addPass(ao);
  }
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.21,.35,1.8);composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let width=1,height=1,separation=0,cameraMove=null;
  function distanceFor(amount=separation) {
    const fov=THREE.MathUtils.degToRad(camera.fov),aspect=width/height;
    const reserved=height<550?90:125;
    const vertical=(18.5+amount*2.7)/(2*Math.tan(fov/2))*(height/Math.max(height-reserved,180));
    const horizontal=(12.1+amount*10.5)/(2*Math.tan(fov/2)*aspect)*(width/Math.max(width-35,180));
    return Math.max(vertical,horizontal);
  }
  function resetView(immediate=false) {
    const to=center.clone().addScaledVector(direction,distanceFor());
    if(immediate||reducedMotion) {camera.position.copy(to);controls.target.copy(center);controls.update();cameraMove=null;}
    else cameraMove={from:camera.position.clone(),to,targetFrom:controls.target.clone(),targetTo:center.clone(),time:0,duration:1};
  }
  function reframe(amount) {
    separation=amount;
    const current=camera.position.clone().sub(controls.target).normalize();
    const to=center.clone().addScaledVector(current,distanceFor(amount));
    if(reducedMotion) {camera.position.copy(to);controls.target.copy(center);controls.update();cameraMove=null;}
    else cameraMove={from:camera.position.clone(),to,targetFrom:controls.target.clone(),targetTo:center.clone(),time:0,duration:1.6};
  }
  function onStart() {cameraMove=null;}
  controls.addEventListener('start',onStart);
  function resize() {
    width=canvas.clientWidth;height=canvas.clientHeight;if(!width||!height)return;
    camera.aspect=width/height;camera.clearViewOffset();
    // Shift only vertically to leave breathing room for the two bottom buttons.
    camera.setViewOffset(width,height,0,height*.035,width,height);camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);composer.setSize(width,height);
    if(ao)ao.setSize(Math.ceil(width*.8),Math.ceil(height*.8));
    resetView(true);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function update(dt) {
    if(cameraMove) {
      cameraMove.time+=dt;
      const t=Math.min(1,cameraMove.time/cameraMove.duration),e=t*t*(3-2*t);
      camera.position.lerpVectors(cameraMove.from,cameraMove.to,e);
      controls.target.lerpVectors(cameraMove.targetFrom,cameraMove.targetTo,e);
      if(t===1)cameraMove=null;
    }
    controls.update(dt);
  }
  function dispose() {
    observer.disconnect();controls.removeEventListener('start',onStart);controls.dispose();
    environment.dispose();floor.geometry.dispose();floor.material.dispose();key.shadow.dispose();
    for(const pass of composer.passes)pass.dispose?.();composer.dispose();renderer.dispose();
  }
  return {scene,camera,controls,renderer,composer,update,resize,reframe,resetView,
    setReducedMotion(value) {reducedMotion=value;controls.enableDamping=!value;if(value)resetView(true);},
    render() {composer.render();},dispose};
}
