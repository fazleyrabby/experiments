import * as THREE from 'three';
import { smoothstep } from './animation.js';

export const MOVIE = { width: 1920, height: 1080, fps: 60, duration: 18, frames: 1080 };
const clamp = value => Math.max(0,Math.min(1,value));

// A fixed-time shot: 2.5s hero, 4s reveal, 5.5s inspection, 4s rebuild, 2s hero.
export function movieSeparation(time) {
  if(time<2.5)return 0;
  if(time<6.5)return smoothstep((time-2.5)/4);
  if(time<12)return 1;
  if(time<16)return 1-smoothstep((time-12)/4);
  return 0;
}

export function createMovie(studio,watch,animation,{exportFrames=false}={}){
  const {width,height,duration,frames}=MOVIE;
  animation.auto=false;animation.running=true;watch.select(null);
  studio.setCaptureMode(width,height);
  document.body.classList.add('cinematic');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.className='movie-canvas';canvas.setAttribute('aria-label','Mechanical watch cinematic, without interface overlays');document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:false});
  const camera=new THREE.PerspectiveCamera(32,width/height,.1,100);
  const target=new THREE.Vector3();
  const background=ctx.createRadialGradient(width*.5,height*.46,20,width*.5,height*.46,width*.64);
  background.addColorStop(0,'#29332d');background.addColorStop(.43,'#171e1a');background.addColorStop(1,'#0b100d');
  let elapsed=0,index=0,pending=false,finished=false,disposed=false,previous=0;
  document.body.dataset.recording=exportFrames?'exporting-frames':'preview';
  function render(time){
    const progress=movieSeparation(time),shot=smoothstep(clamp(time/duration));
    // Exact coordinates at every frame; capture speed cannot change the animation.
    animation.scrub(progress);
    // Additional breathing room between the balance, barrel and wheel train in the film.
    const azimuth=.45+shot*Math.PI*1.1;
    const elevation=THREE.MathUtils.lerp(.70,.46,progress);
    const distance=THREE.MathUtils.lerp(12.4,19.6,progress);
    target.set(0,.18+progress*1.55,0);
    camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance).add(target);
    camera.lookAt(target);
    watch.update(Math.max(0,time-previous),true);previous=time;
    studio.renderer.render(studio.scene,camera);
    ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
    ctx.drawImage(studio.renderer.domElement,0,0,width,height);
  }
  async function saveFrame(){
    pending=true;
    try{
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.97));
      if(disposed)return;
      if(!blob)throw new Error('Could not encode the capture frame.');
      const response=await fetch('/__watch_frame',{method:'POST',body:blob,headers:{'Content-Type':'image/jpeg','X-Frame-Index':String(index)}});
      if(!response.ok)throw new Error(`Frame ${index} could not be saved (${response.status}).`);
      index++;document.body.dataset.exportedFrames=String(index);
      if(index===frames){finished=true;document.body.dataset.recording='frames-saved';}
    }catch(error){finished=true;document.body.dataset.recording='failed';console.error('Watch film export:',error);}
    finally{pending=false;}
  }
  render(0);
  return{
    update(dt){
      if(disposed||pending||finished)return;
      if(exportFrames){elapsed=index/(frames-1)*duration;render(elapsed);saveFrame();}
      else{elapsed=Math.min(duration,elapsed+dt);render(elapsed);if(elapsed===duration)finished=true;}
    },
    dispose(){disposed=true;canvas.remove();document.body.classList.remove('cinematic');},
  };
}
