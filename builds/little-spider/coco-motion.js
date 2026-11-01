const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angleDifference=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

// Companion steering stays separate from the render loop so movement, personal
// space, and startle recovery can be verified without a browser or GPU.
export function createCocoMotion(){
  const s={x:-1.72,z:.95,vx:0,vz:0,yaw:0,gait:0,speed:0,state:'approaching',wave:0,delight:0,startles:0,greetings:0};
  let greetingLeft=0,greetingCooldown=2.2,fleeLeft=0,fleeX=0,fleeZ=0,jumpCount=0,startleCooldown=0,settled=0;
  const homeX=-1.72,homeZ=.95;
  function confine(){
    const r=Math.hypot(s.x/5.35,s.z/3.02);
    if(r>1){s.x/=r;s.z/=r;s.vx*=.25;s.vz*=.25;}
  }
  function startle(pip){
    jumpCount++;
    if(Math.hypot(s.x-pip.x,s.z-pip.z)>2.9||startleCooldown>0||jumpCount%3===2)return false;
    // The escape is lateral in Coco's own frame, never a jump or shell squash.
    const side=s.x>=pip.x?1:-1;
    fleeX=Math.cos(s.yaw)*side;fleeZ=-Math.sin(s.yaw)*side;
    fleeLeft=.78;startleCooldown=3.2;greetingLeft=0;s.wave=0;s.startles++;s.state='startled';return true;
  }
  function greet(){greetingLeft=1.8;greetingCooldown=11;s.greetings++;s.state='greeting';s.delight=1;}
  function reset(){Object.assign(s,{x:homeX,z:homeZ,vx:0,vz:0,yaw:0,gait:0,speed:0,state:'approaching',wave:0,delight:0,startles:0,greetings:0});greetingLeft=0;greetingCooldown=2.2;fleeLeft=0;startleCooldown=0;settled=0;jumpCount=0;}
  function update(dt,pip,obstacles=[]){
    dt=clamp(dt,0,.05);greetingCooldown=Math.max(0,greetingCooldown-dt);startleCooldown=Math.max(0,startleCooldown-dt);
    s.delight=Math.max(0,s.delight-dt*.6);
    const gap=Math.hypot(pip.x-s.x,pip.z-s.z);
    let desiredX=0,desiredZ=0,maxSpeed=.78;
    if(fleeLeft>0){
      fleeLeft=Math.max(0,fleeLeft-dt);desiredX=fleeX*2.45;desiredZ=fleeZ*2.45;maxSpeed=2.45;s.state='startled';
    }else{
      const h=pip.heading||0;
      let goalX=pip.x-1.40*Math.cos(h)+.32*Math.sin(h),goalZ=pip.z+1.40*Math.sin(h)+.32*Math.cos(h);
      const edge=Math.hypot(goalX/5.15,goalZ/2.85);
      if(edge>1){goalX=pip.x+1.40*Math.cos(h)+.32*Math.sin(h);goalZ=pip.z-1.40*Math.sin(h)+.32*Math.cos(h);}
      const dx=goalX-s.x,dz=goalZ-s.z,distance=Math.hypot(dx,dz);
      settled=gap<1.9&&(pip.speed||0)<.15?settled+dt:0;
      if(settled>.7&&greetingCooldown<=0&&greetingLeft<=0)greet();
      if(greetingLeft>0){
        greetingLeft=Math.max(0,greetingLeft-dt);s.state='greeting';
        s.wave=Math.sin((1-greetingLeft/1.8)*Math.PI);
      }else{
        s.wave=0;s.state=gap>2?'following':distance>.18?'approaching':'keeping-company';
        maxSpeed=gap>2.8?1.65:gap>2?1.22:.65;
        if(distance>.10){const velocity=Math.min(maxSpeed,distance*2.1);desiredX=dx/distance*velocity;desiredZ=dz/distance*velocity;}
      }
    }
    // Smooth obstacle steering uses existing plant bounds; no new navigation grid.
    for(const obstacle of obstacles){
      const type=obstacle.userData?.type;
      if(type!=='plant'&&type!=='flower'&&type!=='mushroom')continue;
      const dx=s.x-obstacle.position.x,dz=s.z-obstacle.position.z,d=Math.hypot(dx,dz),radius=.46+(obstacle.scale?.x||1)*.28;
      if(d<radius&&d>.001){const push=(radius-d)*5;desiredX+=dx/d*push;desiredZ+=dz/d*push;}
    }
    if(gap<1.08&&gap>.001){desiredX+=(s.x-pip.x)/gap*(1.08-gap)*7;desiredZ+=(s.z-pip.z)/gap*(1.08-gap)*7;}
    const requested=Math.hypot(desiredX,desiredZ);
    if(requested>maxSpeed){desiredX*=maxSpeed/requested;desiredZ*=maxSpeed/requested;}
    const response=1-Math.exp(-dt*(s.state==='startled'?13:5.5));
    s.vx+=(desiredX-s.vx)*response;s.vz+=(desiredZ-s.vz)*response;
    s.x+=s.vx*dt;s.z+=s.vz*dt;confine();
    // Final separation also handles Pip walking directly through Coco's old spot.
    const px=s.x-pip.x,pz=s.z-pip.z,near=Math.hypot(px,pz);
    if(near<1.02){const nx=near>.001?px/near:-1,nz=near>.001?pz/near:0;s.x+=nx*(1.02-near);s.z+=nz*(1.02-near);confine();}
    s.speed=Math.hypot(s.vx,s.vz);s.gait+=s.speed*dt*14;
    let desiredYaw=clamp(Math.atan2(pip.x-s.x,2.8),-.38,.38);
    if(s.speed>.10&&s.state!=='greeting'){
      const direction=Math.atan2(s.vx,s.vz);
      const first=direction-Math.PI/2,second=direction+Math.PI/2;
      desiredYaw=Math.abs(angleDifference(first,s.yaw))<Math.abs(angleDifference(second,s.yaw))?first:second;
    }
    s.yaw+=angleDifference(desiredYaw,s.yaw)*(1-Math.exp(-dt*5));
    return s;
  }
  return {state:s,update,startle,greet,reset};
}
