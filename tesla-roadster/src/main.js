import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createCar } from './car.js';
import { createWorld, createEffects } from './world.js';
import { createFlightAudio } from './audio.js';
import { sampleFlight, DURATION, FLIGHT_START, LANDING_TIME, smooth } from './flight.js';

const $=id=>document.getElementById(id),viewport=$('viewport');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={time:0,playing:false,rate:1,loop:false,camera:'cinematic',day:false,clean:false,muted:false};
const audio=createFlightAudio();
let renderer,scene,camera,controls,vehicle,world,effects,clock,frame=0,lastHud=0,idleTimer;
const desiredPosition=new THREE.Vector3(),desiredTarget=new THREE.Vector3(),target=new THREE.Vector3(-5,8,0);
function updateHud(){
  $('time').textContent=state.time.toFixed(2).padStart(5,'0');
  $('scrubber').value=state.time;$('scrubber').style.setProperty('--progress',`${state.time/DURATION*100}%`);
  $('scrubber').setAttribute('aria-valuetext',`${state.time.toFixed(1)} seconds, ${sampleFlight(state.time).phase}`);
}
function wake(){document.body.classList.remove('idle');clearTimeout(idleTimer);if(state.playing)idleTimer=setTimeout(()=>{if(!document.querySelector('.controls:hover')&&!document.querySelector('.controls:focus-within'))document.body.classList.add('idle');},2200);}
function setPlaying(playing){
  if(playing&&state.time>=DURATION)state.time=0;state.playing=playing;
  if(playing&&!state.muted)audio.start();else audio.silence();
  $('play').setAttribute('aria-label',playing?'Pause simulation':'Play simulation');
  $('play').innerHTML=`<i class="ph-fill ph-${playing?'pause':'play'}" aria-hidden="true"></i>`;
  if(playing){$('hint').classList.add('hidden');document.activeElement?.blur();}
  wake();updateHud();
}
function seek(time){state.time=THREE.MathUtils.clamp(time,0,DURATION);updateHud();updateScene(true);}
function setCamera(mode){state.camera=mode;$('camera').value=mode;controls.enableDamping=mode==='orbit';controls.target.copy(target);if(mode!=='orbit')updateScene(true);}
function setClean(clean){state.clean=clean;document.body.classList.toggle('clean',clean);document.activeElement?.blur();if(!clean)wake();}
function updateTheme(){document.body.dataset.theme=state.day?'day':'night';$('theme').innerHTML=`<i class="ph ph-${state.day?'moon':'sun'}" aria-hidden="true"></i>`;$('theme').setAttribute('aria-label',state.day?'Switch to night lighting':'Switch to daylight');world?.setDay(state.day);if(renderer)renderer.toneMappingExposure=state.day?1.05:.92;}
function updateCamera(s,snap=false,dt=1/60){
  if(state.camera==='orbit'){controls.update(dt);return;}
  const focus=smooth((state.time-2.8)/3.3);
  if(state.camera==='cinematic'){
    const x=THREE.MathUtils.lerp(-5,s.x,focus),y=THREE.MathUtils.lerp(8,s.y+1.1,focus);
    desiredTarget.set(x,y,0);desiredPosition.set(x-20,y+11,34);
    const flightFocus=smooth((state.time-FLIGHT_START)/.9)*(1-smooth((state.time-LANDING_TIME)/1.3));
    desiredPosition.x+=flightFocus*10;desiredPosition.y-=flightFocus*5;desiredPosition.z-=flightFocus*15;
  }else if(state.camera==='side'){
    desiredTarget.set(-3,10,0);desiredPosition.set(-3,11,46);
  }else if(state.camera==='chase'){
    const fx=Math.cos(s.pitch),fy=Math.sin(s.pitch);
    desiredTarget.set(s.x+fx*1.8,s.y+Math.max(0,fy)*1.4+.2,0);
    desiredPosition.set(s.x-fx*8,s.y-fy*3+4.5,6.5);
  }
  if(viewport.clientWidth<650&&state.camera!=='chase')desiredPosition.sub(desiredTarget).multiplyScalar(1.4).add(desiredTarget);
  if(snap||reducedMotion){camera.position.copy(desiredPosition);target.copy(desiredTarget);}else{const a=1-Math.exp(-dt*4.5);camera.position.lerp(desiredPosition,a);target.lerp(desiredTarget,a);}
  controls.target.copy(target);camera.lookAt(target);controls.update(dt);
}
function updateScene(snap=false,dt=1/60){
  if(!vehicle)return;
  const s=sampleFlight(state.time);vehicle.group.position.set(s.x,s.y,0);vehicle.group.rotation.set(s.roll,0,s.pitch,'ZYX');
  vehicle.wheels.forEach(w=>{w.rotation.z=-state.time*10;w.position.y=-.22+(state.time>=LANDING_TIME?Math.max(0,.65-s.y):0);});
  vehicle.wing.position.y=.34+smooth((state.time-3)/2)*.12;
  effects.update(state.time,s);audio.update(s,{playing:state.playing,muted:state.muted,rate:state.rate,hidden:document.hidden});updateCamera(s,snap,dt);renderer.render(scene,camera);
}
function animate(){
  const dt=Math.min(clock.getDelta(),.05);
  if(state.playing&&!document.hidden){state.time+=dt*state.rate;if(state.time>=DURATION){if(state.loop){state.time%=DURATION;updateScene(true);}else{state.time=DURATION;setPlaying(false);}}}
  updateScene(false,dt);const now=performance.now();if(now-lastHud>70){updateHud();lastHud=now;}frame=requestAnimationFrame(animate);
}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();updateScene(true);}
try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label','Roadster ramp flight');renderer.domElement.setAttribute('role','img');viewport.append(renderer.domElement);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(43,1,.1,450);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
  world=createWorld(scene);vehicle=createCar();scene.add(vehicle.group);effects=createEffects(scene);
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=4;controls.maxDistance=120;controls.maxPolarAngle=Math.PI*.485;controls.dampingFactor=.075;controls.addEventListener('start',()=>{if(state.camera!=='orbit')setCamera('orbit');});
  clock=new THREE.Clock();updateTheme();resize();updateHud();animate();requestAnimationFrame(()=>{$('loading').classList.add('done');$('loading').setAttribute('aria-hidden','true');});new ResizeObserver(resize).observe(viewport);
}catch(error){console.error('Unable to initialize Roadster simulation',error);$('loading').classList.add('done');$('error').hidden=false;}
$('play').addEventListener('click',()=>setPlaying(!state.playing));
$('reset').addEventListener('click',()=>{setPlaying(false);seek(0);});
$('scrubber').addEventListener('input',event=>{const time=Number(event.target.value);setPlaying(false);seek(time);});
$('rate').addEventListener('change',event=>state.rate=Number(event.target.value));
$('camera').addEventListener('change',event=>setCamera(event.target.value));
$('loop').addEventListener('click',()=>{state.loop=!state.loop;$('loop').setAttribute('aria-pressed',String(state.loop));});
$('mute').addEventListener('click',()=>{
  state.muted=!state.muted;
  const label=state.muted?'Unmute sound':'Mute sound';
  $('mute').setAttribute('aria-label',label);$('mute').setAttribute('title',label);
  $('mute').setAttribute('aria-pressed',String(state.muted));
  $('mute').innerHTML=`<i class="ph ph-speaker-${state.muted?'slash':'high'}" aria-hidden="true"></i>`;
  if(state.muted)audio.silence();else audio.start();
});
$('theme').addEventListener('click',()=>{state.day=!state.day;updateTheme();});
$('clean').addEventListener('click',()=>setClean(true));
viewport.addEventListener('dblclick',()=>{if(state.clean)setClean(false);});
viewport.addEventListener('pointerdown',event=>{if(state.clean&&event.pointerType==='touch')setClean(false);},{passive:true});
window.addEventListener('keydown',event=>{
  if(event.code==='KeyH'){setClean(!state.clean);return;}
  if(event.code==='Escape'){setClean(false);return;}
  if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  if(event.code==='Space'){event.preventDefault();setPlaying(!state.playing);}
  if(event.code==='KeyR'){setPlaying(false);seek(0);}
  if(event.code==='ArrowRight'){event.preventDefault();setPlaying(false);seek(state.time+.2);}
  if(event.code==='ArrowLeft'){event.preventDefault();setPlaying(false);seek(state.time-.2);}
  if(['Digit1','Digit2','Digit3','Digit4'].includes(event.code))setCamera(['cinematic','side','chase','orbit'][Number(event.key)-1]);
});
window.addEventListener('pointermove',wake,{passive:true});window.addEventListener('pointerdown',()=>{if(!state.clean)wake();},{passive:true});
document.addEventListener('visibilitychange',()=>{clock?.getDelta();if(document.hidden)audio.silence();});window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);audio.suspend();});
setTimeout(()=>$('hint').classList.add('hidden'),6000);
