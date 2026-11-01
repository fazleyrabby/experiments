import './style.css';
import { createGundam } from './model/createGundam.js';
import { AssemblyController } from './animation/AssemblyController.js';
import { createStudio } from './scene/createStudio.js';

const $=selector=>document.querySelector(selector);
const events=new AbortController();
const on=(element,event,handler)=>element.addEventListener(event,handler,{signal:events.signal});
const reducedQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
let studio,model,controller,loadingTimer;

function start() {
  try {studio=createStudio($('#scene'),{reducedMotion:reducedQuery.matches});}
  catch(error) {console.error('Unable to initialize WebGL',error); $('#loading').hidden=true; $('#fallback').hidden=false; return;}
  model=createGundam(); studio.scene.add(model.root);
  controller=new AssemblyController(model.parts,{reducedMotion:reducedQuery.matches});
  let previous=null,lastState='';
  function syncUI() {
    $('#breakdown').disabled=controller.target===1;
    $('#assemble').disabled=controller.target===0&&!controller.run;
    $('#status').textContent=({assembled:'Assembly complete',assembling:'Assembling',reassembling:'Assembling',disassembling:'Breaking down',exploded:'Breakdown complete'})[controller.state]||'Inspecting';
    lastState=controller.state;
  }
  function breakdown() {controller.start(1);model.sync();studio.reframe(1);syncUI();}
  function assemble() {controller.start(0);model.sync();studio.reframe(0);syncUI();}
  on($('#breakdown'),'click',breakdown);
  on($('#assemble'),'click',assemble);
  on(window,'keydown',event=>{
    if(event.target.closest('button,input,a,textarea,select')||event.ctrlKey||event.metaKey||event.altKey||event.repeat) return;
    if(event.code==='Space') {event.preventDefault();controller.target>.5?assemble():breakdown();}
    if(event.key.toLowerCase()==='r') studio.resetView();
  });
  on(reducedQuery,'change',()=>{
    controller.reducedMotion=reducedQuery.matches; studio.setReducedMotion(reducedQuery.matches);
    if(reducedQuery.matches) {controller.scrub(controller.target);model.sync();}
    syncUI();
  });
  on($('#scene'),'webglcontextlost',event=>{event.preventDefault();studio.renderer.setAnimationLoop(null);$('#fallback').hidden=false;});
  on(document,'visibilitychange',()=>{previous=null;});
  controller.intro();model.sync();syncUI();
  studio.renderer.setAnimationLoop(now=>{
    const dt=previous===null?0:Math.min((now-previous)/1000,.06);previous=now;
    if(controller.update(dt))model.sync();
    const eyes=model.materials.get('eye');
    if(eyes) eyes.emissiveIntensity=controller.state==='assembled'?2.6:.6;
    studio.update(dt,Boolean(controller.run));studio.render();
    if(lastState!==controller.state) syncUI();
  });
  $('#loading').classList.add('ready');
  loadingTimer=window.setTimeout(()=>{$('#loading').hidden=true;},550);
  if(import.meta.env.DEV) window.__RX={model,controller,studio};
}
start();
if(import.meta.hot) import.meta.hot.dispose(()=>{
  events.abort();window.clearTimeout(loadingTimer);
  if(studio) {studio.renderer.setAnimationLoop(null);model?.dispose();studio.dispose();}
  delete window.__RX;
});
