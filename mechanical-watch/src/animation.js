const clamp = x => Math.max(0, Math.min(1, x));
export const smoothstep = t => t*t*t*(t*(t*6-15)+10);

/** One timeline owns assembly transforms, including reversals and direct scrubbing. */
export class WatchAnimation {
  constructor(parts, { reducedMotion = false } = {}) {
    this.parts=parts; this.reducedMotion=reducedMotion;
    this.progress=0; this.target=0; this.auto=!reducedMotion; this.running=!reducedMotion;
    this.transition=null; this.elapsed=0;
  }
  moveTo(target,manual=true) {
    target=target?1:0;
    if(manual)this.auto=false;
    if(this.transition&&this.target===target)return;
    this.target=target; this.elapsed=0;
    if(Math.abs(this.progress-target)<.000001&&!this.transition)return;
    this.transition={elapsed:0,duration:(this.reducedMotion?.35:3.8)*Math.max(.35,Math.abs(target-this.progress)),from:this.progress,starts:this.parts.map(p=>p.object.position.clone())};
  }
  scrub(value) {
    this.auto=false;this.transition=null;this.elapsed=0;
    this.progress=clamp(value);this.target=this.progress;
    this.parts.forEach(p=>p.object.position.copy(p.origin).addScaledVector(p.offset,this.progress));
  }
  toggleAuto(){this.auto=!this.auto;this.elapsed=0;return this.auto;}
  get state(){return this.transition?(this.target?'Separating components':'Reassembling watch'):(this.progress<.001?'Fully assembled':this.progress>.999?'Exploded view':'Exploring the movement');}
  update(dt){
    if(this.transition){
      const t=this.transition;t.elapsed+=dt;const fraction=clamp(t.elapsed/t.duration);
      this.progress=t.from+(this.target-t.from)*smoothstep(fraction);
      this.parts.forEach((p,i)=>{
        const delay=(this.target?p.order:1-p.order)*.15;
        const local=smoothstep(clamp((fraction-delay)/(1-delay)));
        p.object.position.copy(t.starts[i]).lerp(p.origin.clone().addScaledVector(p.offset,this.target),local);
      });
      if(fraction>=1){this.progress=this.target;this.parts.forEach(p=>p.object.position.copy(p.origin).addScaledVector(p.offset,this.target));this.transition=null;this.elapsed=0;}
    }else if(this.auto){
      this.elapsed+=dt;
      if(this.progress<.001&&this.elapsed>=5)this.moveTo(1,false);
      else if(this.progress>.999&&this.elapsed>=8)this.moveTo(0,false);
      else if(this.progress>=.001&&this.progress<=.999&&this.elapsed>=2)this.moveTo(1,false);
    }
  }
}
