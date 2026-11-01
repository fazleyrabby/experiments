import { gsap } from 'gsap';

export const TRANSFORM_DURATION=7.6;
export const FILM_DURATION=14;

export class Transformation {
  constructor(model,studio,{reducedMotion=false,onState=()=>{}}={}){
    this.model=model;this.studio=studio;this.reducedMotion=reducedMotion;this.onState=onState;this.target='robot';this.cameraTimeline=null;
    this.timeline=gsap.timeline({paused:true,onComplete:()=>this.notify('robot'),onReverseComplete:()=>this.notify('truck')});
    for(const {node,truck,robot,start,duration} of model.tracks){
      this.timeline.fromTo(node.position,{x:truck.p[0],y:truck.p[1],z:truck.p[2]},{x:robot.p[0],y:robot.p[1],z:robot.p[2],duration,ease:'power2.inOut',immediateRender:true},start);
      this.timeline.fromTo(node.rotation,{x:truck.r[0],y:truck.r[1],z:truck.r[2]},{x:robot.r[0],y:robot.r[1],z:robot.r[2],duration,ease:'power2.inOut',immediateRender:true},start);
    }
    for(let i=0;i<model.wheels.length;i++)this.timeline.fromTo(model.wheels[i].rotation,{x:0},{x:Math.PI*2,duration:3.2,ease:'power2.inOut'},2.2+i*.065);
    this.timeline.fromTo(model.materials.eye,{emissiveIntensity:0},{emissiveIntensity:5,duration:.38,ease:'power2.out'},6.25);
    this.timeline.to(model.materials.eye,{emissiveIntensity:3.4,duration:.65},6.63);
    this.timeline.to({hold:0},{hold:1,duration:.32},TRANSFORM_DURATION-.32);
    studio.onInterrupt(()=>this.cameraTimeline?.kill());
  }
  notify(state){this.state=state;this.onState(state);}
  cameraFilm(){
    this.cameraTimeline?.kill();this.studio.beginCinematic();const v=this.studio.view;
    Object.assign(v,{azimuth:.66,elevation:.21,distance:1.02,focusX:0,focusY:2,focusZ:-1.2});
    this.cameraTimeline=gsap.timeline();
    this.cameraTimeline.to(v,{azimuth:.32,elevation:.12,distance:.94,duration:2.1,ease:'power1.inOut'},0);
    this.cameraTimeline.to(v,{focusX:-1.4,focusY:4.85,focusZ:.8,elevation:.07,distance:1,azimuth:-.28,duration:4.4,ease:'power2.inOut'},2.1);
    this.cameraTimeline.to(v,{azimuth:.48,elevation:.10,duration:1.5,ease:'power1.inOut'},6.5);
    this.cameraTimeline.to(v,{azimuth:.48+Math.PI*2,elevation:.16,duration:6,ease:'power1.inOut'},8);
  }
  replay(){
    this.target='robot';this.timeline.timeScale(1).pause(0);this.notify('transforming');
    if(this.reducedMotion){this.seek(TRANSFORM_DURATION);return;}
    this.cameraFilm();this.timeline.play(0);
  }
  toggle(){this.transform(this.target==='robot'?'truck':'robot');}
  transform(target){
    this.target=target;this.cameraTimeline?.kill();
    const robot=target==='robot';
    if(this.reducedMotion){this.timeline.pause().time(robot?TRANSFORM_DURATION:0,true);this.setView(robot);this.model.sync();this.notify(target);return;}
    this.studio.beginCinematic();
    // Continue smoothly from the current orbit angle, including when interrupted mid-sequence.
    const p=this.studio.camera.position.clone().sub(this.studio.controls.target);
    const v=this.studio.view;v.azimuth=Math.atan2(p.x,p.z);v.elevation=Math.atan2(p.y,Math.hypot(p.x,p.z));
    const seconds=Math.max(.8,robot?TRANSFORM_DURATION-this.timeline.time():this.timeline.time());
    this.cameraTimeline=gsap.timeline().to(v,{focusX:robot?-1.4:0,focusY:robot?4.85:2,focusZ:robot?.8:-1.2,azimuth:robot?.48:.66,elevation:robot?.10:.21,distance:1,duration:seconds*.83,ease:'power2.inOut'});
    this.notify(robot?'transforming':'reverting');this.timeline.timeScale(1);
    robot?this.timeline.play():this.timeline.reverse();
    if(robot)this.cameraTimeline.to(v,{azimuth:.48+Math.PI*2,elevation:.16,duration:6,ease:'power1.inOut'},seconds+.4);
  }
  setView(robot){this.cameraTimeline?.kill();Object.assign(this.studio.view,{azimuth:.48,elevation:.14,distance:1,focusX:robot?-1.4:0,focusY:robot?4.85:2,focusZ:robot?.8:-1.2});this.studio.beginCinematic();this.studio.update();}
  seek(time){this.cameraTimeline?.kill();this.timeline.pause().time(time,true);this.target=time===0?'truck':'robot';this.setView(time>3.5);this.model.sync();this.notify(time===0?'truck':time>=TRANSFORM_DURATION?'robot':'transforming');}
  setReducedMotion(value){this.reducedMotion=value;if(value){this.timeline.pause().time(this.target==='robot'?TRANSFORM_DURATION:0,true);this.setView(this.target==='robot');this.model.sync();this.notify(this.target);}}
  dispose(){this.timeline.kill();this.cameraTimeline?.kill();}
}
