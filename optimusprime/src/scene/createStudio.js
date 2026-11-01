import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createStudio(canvas,{reducedMotion=false}={}){
  const mobile=matchMedia('(pointer: coarse)').matches;
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.35:1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x080b10);scene.fog=new THREE.FogExp2(0x080b10,.021);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const env=pmrem.fromScene(room,.05);room.dispose();pmrem.dispose();scene.environment=env.texture;scene.environmentIntensity=.38;
  const camera=new THREE.PerspectiveCamera(33,1,.15,160);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=!reducedMotion;controls.dampingFactor=.065;
  controls.minDistance=11;controls.maxDistance=44;controls.maxPolarAngle=Math.PI*.50;controls.minPolarAngle=.20;controls.enablePan=false;
  const view={azimuth:.66,elevation:.21,distance:1,focusX:0,focusY:2.0,focusZ:-1.2};let cinematic=true,width=1,height=1;
  const hemi=new THREE.HemisphereLight(0xc6ddff,0x26232b,1.3);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffeee0,2.7);key.position.set(-7,14,11);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);
  Object.assign(key.shadow.camera,{left:-9,right:9,top:12,bottom:-8,near:.5,far:45});key.shadow.normalBias=.025;key.shadow.bias=-.00012;key.shadow.radius=3;key.target.position.set(0,4,0);scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0x9dc9ff,1.5);fill.position.set(8,9,6);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xc6ddff,2.7);rim.position.set(3,13,-10);scene.add(rim);
  const redRim=new THREE.DirectionalLight(0xff7771,.65);redRim.position.set(-8,6,-6);scene.add(redRim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0x0b1018,metalness:.15,roughness:.8}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
  const pool=new THREE.SpotLight(0x8cb8de,35,30,.9,.95,1);pool.position.set(0,11,2);pool.target.position.set(0,0,0);scene.add(pool,pool.target);
  const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:mobile?0:4});
  const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
  const ao=mobile?null:new GTAOPass(scene,camera,1,1);
  if(ao){ao.updateGtaoMaterial({radius:.32,distanceExponent:1.6,thickness:.5,scale:1,samples:8});ao.blendIntensity=.65;composer.addPass(ao);}
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.12,.28,3.0);composer.addPass(bloom);composer.addPass(new OutputPass());
  function frameDistance(){const f=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));const robot=THREE.MathUtils.smoothstep(view.focusY,2,4.9);const h=THREE.MathUtils.lerp(8.4,13.6,robot);const w=THREE.MathUtils.lerp(10.8,10.5,robot);return Math.max(h/(2*f),w/(2*f*camera.aspect))*view.distance;}
  function placeCamera(){const d=frameDistance();const flat=d*Math.cos(view.elevation);controls.target.set(view.focusX,view.focusY,view.focusZ);camera.position.set(view.focusX+Math.sin(view.azimuth)*flat,view.focusY+d*Math.sin(view.elevation),view.focusZ+Math.cos(view.azimuth)*flat);camera.lookAt(controls.target);}
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);composer.setSize(width,height);if(ao)ao.setSize(Math.ceil(width*.65),Math.ceil(height*.65));if(cinematic)placeCamera();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const listeners=new Set();function interrupt(){cinematic=false;listeners.forEach(fn=>fn());}controls.addEventListener('start',interrupt);
  return {scene,camera,controls,renderer,composer,view,resize,
    get cinematic(){return cinematic;},
    onInterrupt(fn){listeners.add(fn);},
    beginCinematic(){cinematic=true;},
    setReducedMotion(v){reducedMotion=v;controls.enableDamping=!v;},
    update(){if(cinematic)placeCamera();else controls.update();},
    render(){composer.render();},
    dispose(){observer.disconnect();controls.removeEventListener('start',interrupt);controls.dispose();listeners.clear();env.dispose();floor.geometry.dispose();floor.material.dispose();key.shadow.dispose();composer.passes.forEach(p=>p.dispose?.());composer.dispose();renderer.dispose();}
  };
}
