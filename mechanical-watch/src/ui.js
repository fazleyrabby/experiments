import { COMPONENTS } from './watch/createWatch.js';

export function createUI(animation,watch,studio){
  const listeners=[];
  const el=id=>document.getElementById(id);
  function on(target,event,handler){target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));}
  const list=el('component-list');
  COMPONENTS.forEach((part,i)=>{const button=document.createElement('button');button.className='component';button.dataset.part=part.id;button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><span>${part.title}</span><span class="indicator" aria-hidden="true">↗</span>`;on(button,'click',()=>select(watch.selected===part.id?null:part.id,true));list.appendChild(button);});
  const slider=el('separation');
  function select(id,reveal=false){
    watch.select(id);const info=COMPONENTS.find(p=>p.id===id);
    el('inspector').hidden=!info;
    list.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===id)));
    if(info){el('part-number').textContent=`COMPONENT ${String(COMPONENTS.indexOf(info)+1).padStart(2,'0')}`;el('part-title').textContent=info.title;el('part-description').textContent=info.description;if(reveal&&animation.progress<.7)animation.moveTo(1);}
    animation.auto=false;update();
  }
  on(el('break-down'),'click',()=>animation.moveTo(1));
  on(el('reassemble'),'click',()=>{select(null);animation.moveTo(0);});
  on(slider,'input',()=>{animation.scrub(Number(slider.value)/100);update();});
  on(el('auto-cycle'),'click',()=>{animation.toggleAuto();update();});
  on(el('movement'),'click',()=>{animation.running=!animation.running;update();});
  on(el('reset-view'),'click',()=>studio.resetView());
  on(el('clear-selection'),'click',()=>select(null));
  on(document,'keydown',e=>{if(e.key==='Escape'&&watch.selected)select(null);});
  let lastStatus='';
  function update(){
    const percent=Math.round(animation.progress*100);slider.value=animation.progress*100;slider.style.setProperty('--progress',`${percent}%`);el('separation-value').value=`${percent}%`;
    if(lastStatus!==animation.state){lastStatus=animation.state;el('view-status').textContent=lastStatus;}
    el('auto-cycle').setAttribute('aria-pressed',String(animation.auto));el('movement').setAttribute('aria-pressed',String(animation.running));el('movement').textContent=animation.running?'Pause movement':'Resume movement';el('mechanism-status').textContent=animation.running?'Movement running':'Movement paused';el('mechanism-status').parentElement.classList.toggle('paused',!animation.running);
  }
  update();
  return{select,update,dispose(){listeners.forEach(off=>off());list.replaceChildren();}};
}
