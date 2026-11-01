import './style.css';
import * as THREE from 'three';
import { createWatch } from './watch/createWatch.js';
import { createStudio } from './scene.js';
import { WatchAnimation } from './animation.js';
import { createUI } from './ui.js';
import { createMovie } from './movie.js';

const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let dispose=()=>{};
try{
  const studio=createStudio(document.getElementById('viewport'),reducedMotion);
  const watch=createWatch();studio.scene.add(watch.root);
  const animation=new WatchAnimation(watch.parts,{reducedMotion});
  const ui=createUI(animation,watch,studio);
  const query=new URLSearchParams(location.search);
  const movie=query.has('film')||(import.meta.env.DEV&&query.has('frames'))?createMovie(studio,watch,animation,{exportFrames:import.meta.env.DEV&&query.has('frames')}):null;
  const canvas=studio.renderer.domElement;
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  function pointerDown(e){down={x:e.clientX,y:e.clientY,time:performance.now()};}
  function pointerCancel(){down=null;}
  function pointerUp(e){
    if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||performance.now()-down.time>650){down=null;return;}
    down=null;
    const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,studio.camera);
    const hit=raycaster.intersectObject(watch.root,true).find(h=>!h.object.material.transparent);
    if(hit){let object=hit.object;while(object&&!object.userData.part)object=object.parent;if(object)ui.select(watch.selected===object.userData.part?null:object.userData.part,true);}
  }
  function cancelAuto(){animation.auto=false;ui.update();}
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);studio.controls.addEventListener('start',cancelAuto);
  function contextLost(e){e.preventDefault();document.getElementById('error').hidden=false;studio.renderer.setAnimationLoop(null);}
  canvas.addEventListener('webglcontextlost',contextLost);
  let last=performance.now();
  studio.renderer.setAnimationLoop(now=>{
    const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;
    if(movie){movie.update(dt);return;}
    animation.update(dt);watch.update(dt,animation.running);studio.update(dt,animation.progress);ui.update();studio.renderer.render(studio.scene,studio.camera);
  });
  if(!movie)studio.renderer.render(studio.scene,studio.camera);
  document.getElementById('loading').hidden=true;
  dispose=()=>{studio.renderer.setAnimationLoop(null);movie?.dispose();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);canvas.removeEventListener('webglcontextlost',contextLost);studio.controls.removeEventListener('start',cancelAuto);ui.dispose();watch.dispose();studio.dispose();};
}catch(error){console.error('Watch study initialization failed:',error);dispose();document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;}
if(import.meta.hot)import.meta.hot.dispose(()=>dispose());
