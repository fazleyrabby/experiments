import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createStudio(container,reducedMotion) {
  const scene=new THREE.Scene();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Mechanical watch. Drag to rotate; scroll or pinch to zoom.');
  const camera=new THREE.PerspectiveCamera(32,1,.1,100);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=!reducedMotion;controls.dampingFactor=.075;controls.enablePan=false;
  controls.minDistance=7;controls.maxDistance=36;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI*.86;
  controls.rotateSpeed=.6;controls.zoomSpeed=.7;
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.045);
  scene.environment=environment.texture;scene.environmentIntensity=1.1;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#d5e5df','#1d231e',1.2));
  function light(color,intensity,position){const l=new THREE.DirectionalLight(color,intensity);l.position.set(...position);scene.add(l);return l;}
  const key=light('#edf4f3',2.4,[-4,8,5]);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-7,right:7,top:8,bottom:-7,near:.1,far:30});key.shadow.bias=-.0003;key.shadow.normalBias=.025;
  light('#c5dfd0',2.4,[6,4,-5]);light('#f6e4c6',1.2,[-5,2,-5]);
  key.shadow.radius=4;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.ShadowMaterial({color:'#000000',opacity:.12}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-2.05;ground.receiveShadow=true;scene.add(ground);
  const datum=new THREE.Group();scene.add(datum);datum.position.y=-1.97;
  const lineMaterial=new THREE.LineBasicMaterial({color:'#a5c3ad',transparent:true,opacity:.13});
  const radius=3.3;
  const datumGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:181},(_,i)=>{const a=i/180*Math.PI*2;return new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius);}));
  datum.add(new THREE.Line(datumGeo,lineMaterial));
  const ticks=[];
  for(let i=0;i<60;i++){const a=i/60*Math.PI*2;const inner=i%5===0?3.4:3.43;const outer=i%5===0?3.57:3.50;ticks.push(new THREE.Vector3(Math.cos(a)*inner,0,Math.sin(a)*inner),new THREE.Vector3(Math.cos(a)*outer,0,Math.sin(a)*outer));}
  const tickGeo=new THREE.BufferGeometry().setFromPoints(ticks);datum.add(new THREE.LineSegments(tickGeo,lineMaterial));
  let width=1,height=1,mobile=false,zoom=1,lastDistance=14,interacting=false,resetting=false;
  const direction=new THREE.Vector3(5.9,7.8,10.5).normalize();
  const ideal=new THREE.Vector3(),target=new THREE.Vector3(),delta=new THREE.Vector3();
  function distance(p){return(mobile?20+11*p:15+5*p)*(mobile?Math.max(1,.65/camera.aspect):Math.max(1,1.65/camera.aspect));}
  function resize(){const rect=container.getBoundingClientRect();width=rect.width;height=rect.height;mobile=width<=800;renderer.setSize(width,height);camera.aspect=width/height;
    // Keep the moving stack between the intro and component index, above transport.
    camera.setViewOffset(width,height,mobile?0:-width*.035,mobile?height*.015:height*.045,width,height);camera.updateProjectionMatrix();}
  resize();controls.target.set(0,.4,0);camera.position.copy(direction).multiplyScalar(distance(0)).add(controls.target);controls.update();lastDistance=distance(0);
  const observer=new ResizeObserver(resize);observer.observe(container);
  function start(){interacting=true;resetting=false;}
  function end(){interacting=false;zoom=THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)/lastDistance,.55,1.7);}
  controls.addEventListener('start',start);controls.addEventListener('end',end);
  function resetView(){resetting=true;zoom=1;}
  function update(dt,p){
    const base=distance(p);target.set(0,.4+p*1.05,0);
    if(!interacting){
      const factor=reducedMotion?1:1-Math.exp(-dt*3.5);
      if(resetting){ideal.copy(direction).multiplyScalar(base).add(target);camera.position.lerp(ideal,factor);controls.target.lerp(target,factor);if(camera.position.distanceTo(ideal)<.015)resetting=false;}
      else {delta.copy(camera.position).sub(controls.target).normalize().multiplyScalar(base*zoom);controls.target.lerp(target,factor);ideal.copy(controls.target).add(delta);camera.position.lerp(ideal,factor);}
    }
    lastDistance=base;lineMaterial.opacity=.10+.035*p;controls.update();
  }
  function setCaptureMode(width,height){observer.disconnect();controls.enabled=false;renderer.setPixelRatio(1);renderer.setSize(width,height,false);datum.visible=false;}
  return{scene,camera,renderer,controls,update,resetView,setCaptureMode,get interacting(){return interacting;},dispose(){observer.disconnect();controls.dispose();environment.dispose();ground.geometry.dispose();ground.material.dispose();datumGeo.dispose();tickGeo.dispose();lineMaterial.dispose();key.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();}};
}
