import './style.css';
import { createOptimus } from './model/createOptimus.js';
import { createStudio } from './scene/createStudio.js';
import { createEffects } from './scene/createEffects.js';
import { Transformation } from './animation/Transformation.js';

const $=s=>document.querySelector(s),events=new AbortController();
const listen=(el,event,handler)=>el.addEventListener(event,handler,{signal:events.signal});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let studio,model,effects,controller,timer,alive=true,elapsed=0,last=null;
listen($('#reload'),'click',()=>location.reload());
function fail(error){console.error(error);$('#loading').hidden=true;$('#fallback').hidden=false;studio?.renderer.setAnimationLoop(null);}
async function start(){
  try{
    studio=createStudio($('#scene'),{reducedMotion:reduced.matches});
    model=createOptimus();studio.scene.add(model.root);effects=createEffects(studio.scene);
    controller=new Transformation(model,studio,{reducedMotion:reduced.matches,onState(state){
      const names={truck:'Truck mode',robot:'Robot mode. Transformation complete',transforming:'Transforming into Optimus Prime',reverting:'Transforming into truck mode'};
      $('#status').textContent=names[state];$('#transform').textContent=controller?.target==='truck'?'Robot mode':'Truck mode';$('#transform').setAttribute('aria-pressed',String(controller?.target!=='truck'));
    }});
    await studio.renderer.compileAsync(studio.scene,studio.camera);if(!alive)return;
    // Compile the entire render pipeline before the loading scrim fades.
    studio.render();$('#loading').classList.add('ready');timer=setTimeout(()=>{$('#loading').hidden=true;},650);
    if(reduced.matches)controller.seek(7.6);else controller.replay();
    listen($('#replay'),'click',()=>controller.replay());listen($('#transform'),'click',()=>controller.toggle());
    listen(window,'keydown',e=>{if(e.target.closest('button,input,a,textarea,select')||e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;if(e.code==='Space'){e.preventDefault();controller.toggle();}if(e.code==='KeyR')controller.replay();});
    listen(reduced,'change',()=>{studio.setReducedMotion(reduced.matches);controller.setReducedMotion(reduced.matches);});
    listen(document,'visibilitychange',()=>{last=null;const hidden=document.hidden;controller.timeline.paused(hidden||!['transforming','reverting'].includes(controller.state));if(controller.cameraTimeline)controller.cameraTimeline.paused(hidden);});
    listen($('#scene'),'webglcontextlost',e=>{e.preventDefault();$('#error-message').textContent='The graphics session was interrupted. Reload to restore the scene.';fail(new Error('WebGL context lost'));});
    studio.renderer.setAnimationLoop(now=>{if(document.hidden)return;const dt=last===null?0:Math.min((now-last)/1000,.05);last=now;elapsed+=dt;model.sync();effects.update(elapsed,controller.timeline.time(),controller.timeline.isActive(),reduced.matches);studio.update();studio.render();});
    if(import.meta.env.DEV)window.__OPTIMUS={model,studio,controller,effects};
  }catch(error){fail(error);}
}
start();
if(import.meta.hot)import.meta.hot.dispose(()=>{alive=false;events.abort();clearTimeout(timer);controller?.dispose();effects?.dispose();model?.dispose();if(studio){studio.renderer.setAnimationLoop(null);studio.dispose();}delete window.__OPTIMUS;});
