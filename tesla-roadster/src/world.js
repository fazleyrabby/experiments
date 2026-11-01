import * as THREE from 'three';
import {RAMP_RADIUS, RAMP_ANGLE, rampPoint, sampleFlight, FLIGHT_START, LANDING_TIME} from './flight.js';

function box(parent,material,size,position,rotation=[0,0,0]){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.position.set(...position);m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function beam(parent,a,b,radius,material){const direction=new THREE.Vector3().subVectors(b,a);const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,direction.length(),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());m.castShadow=true;parent.add(m);return m;}
function strip(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,points.length*2,radius,6,false),material);parent.add(m);return m;}
function asphalt(){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const data=ctx.createImageData(512,512);let seed=173;for(let i=0;i<data.data.length;i+=4){seed=(seed*16807)%2147483647;const v=77+(seed%37);data.data[i]=v;data.data[i+1]=v+1;data.data[i+2]=v+3;data.data[i+3]=255;}ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(16,16);texture.colorSpace=THREE.SRGBColorSpace;return texture;}
function label(parent,text,width,height,x,z){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.font='500 140px Helvetica, Arial';ctx.fillStyle='#8e9398';ctx.textAlign='center';ctx.fillText(text,512,173);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map,transparent:true,opacity:.27,depthWrite:false,roughness:1}));m.rotation.x=-Math.PI/2;m.rotation.z=-Math.PI/2;m.position.set(x,.019,z);parent.add(m);}
export function createWorld(scene){
  const world=new THREE.Group();scene.add(world);
  const texture=asphalt();
  const floorMaterial=new THREE.MeshStandardMaterial({color:0x3b3e43,map:texture,roughness:.94,metalness:.08});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(350,350),floorMaterial);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;world.add(floor);
  const runwayMaterial=new THREE.MeshStandardMaterial({color:0x45494e,roughness:.86,metalness:.1,map:texture});
  const road=new THREE.Mesh(new THREE.PlaneGeometry(110,8.4),runwayMaterial);road.rotation.x=-Math.PI/2;road.position.set(-13,.012,0);road.receiveShadow=true;world.add(road);
  const steel=new THREE.MeshStandardMaterial({color:0x353b40,metalness:.78,roughness:.45});
  const rampMaterial=new THREE.MeshStandardMaterial({color:0x8a8f93,map:texture,roughness:.79,metalness:.26,side:THREE.DoubleSide});
  const red=new THREE.MeshStandardMaterial({color:0x8c241f,emissive:0xe42921,emissiveIntensity:1.7,roughness:.5});
  const stripeMat=new THREE.MeshStandardMaterial({color:0xc5c7c6,roughness:.9});
  function surface(halfWidth,offset,material,z=0){const p=[],uv=[],ix=[];const steps=100;for(let i=0;i<=steps;i++){const a=RAMP_ANGLE*i/steps;const point=rampPoint(a,offset);p.push(point.x,point.y,z-halfWidth,point.x,point.y,z+halfWidth);uv.push(0,i/steps*4,1,i/steps*4);if(i<steps){const k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;world.add(m);return m;}
  surface(3.9,0,rampMaterial);
  surface(.045,.018,stripeMat);
  for(const side of [-1,1]){
    surface(.038,.025,red,side*3.75);
    const edge=[],outer=[];
    for(let i=0;i<=50;i++){const a=i/50*RAMP_ANGLE;const p=rampPoint(a,-.12),q=rampPoint(a,-1.3);edge.push(new THREE.Vector3(p.x,p.y,side*4));outer.push(new THREE.Vector3(q.x,q.y,side*4));}
    strip(world,edge,.07,steel);strip(world,outer,.085,steel);
    for(let i=0;i<14;i++){
      const a=i/13*RAMP_ANGLE,b=(i+1)/13*RAMP_ANGLE;
      const p=rampPoint(a,-.12),q=rampPoint(a,-1.3),n=rampPoint(Math.min(b,RAMP_ANGLE),-.12);
      beam(world,new THREE.Vector3(p.x,p.y,side*4),new THREE.Vector3(q.x,q.y,side*4),.055,steel);
      if(i<13)beam(world,new THREE.Vector3(q.x,q.y,side*4),new THREE.Vector3(n.x,n.y,side*4),.045,steel);
      if(i%2===0){beam(world,new THREE.Vector3(q.x,q.y,-4),new THREE.Vector3(q.x,q.y,4),.065,steel);}
    }
    const top=rampPoint(1.3,-1.3);beam(world,new THREE.Vector3(top.x,top.y,side*4),new THREE.Vector3(15,0,side*5),.11,steel);
    beam(world,new THREE.Vector3(15,0,side*5),new THREE.Vector3(10,0,side*4),.085,steel);
    const upper=rampPoint(1.9,-1.3);beam(world,new THREE.Vector3(upper.x,upper.y,side*4),new THREE.Vector3(15,0,side*5),.085,steel);
    for(let x=-45;x<20;x+=2.4){box(world,red,[.42,.035,.055],[x,.04,side*4.5]);}
    const line=new THREE.Mesh(new THREE.PlaneGeometry(72,.045),stripeMat);line.rotation.x=-Math.PI/2;line.position.set(-21,.018,side*3.75);world.add(line);
  }
  for(let x=-45;x<0;x+=5){const m=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.055),stripeMat);m.rotation.x=-Math.PI/2;m.position.set(x,.021,0);world.add(m);}
  label(world,'ROADSTER',11,2.75,-20,6.9);
  label(world,'FLIGHT TEST',7,1.75,-5,-6.9);
  // Distant industrial silhouettes and floodlight rigs establish the scale of the ramp.
  const building=new THREE.MeshStandardMaterial({color:0x171d24,roughness:1});
  box(world,building,[62,5,14],[-5,2.5,-60]);
  box(world,building,[20,3,14],[-57,1.5,-34]);
  const lightMat=new THREE.MeshBasicMaterial({color:0xc8d7e6});
  for(const x of [-30,19])for(const z of [-16]){
    box(world,steel,[.12,13,.12],[x,6.5,z]);box(world,steel,[3,.09,.12],[x,13,z]);
    for(let i=0;i<4;i++)box(world,lightMat,[.38,.22,.15],[x-1.05+i*.7,12.95,z]);
  }
  const pathPoints=[];for(let t=0;t<=14;t+=.04){const s=sampleFlight(t);pathPoints.push(new THREE.Vector3(s.x,s.y+.08,s.z));}
  const pathGeo=new THREE.BufferGeometry().setFromPoints(pathPoints);
  const path=new THREE.Line(pathGeo,new THREE.LineDashedMaterial({color:0xe87b67,dashSize:.3,gapSize:.22,transparent:true,opacity:.65,depthTest:false}));path.computeLineDistances();path.visible=false;scene.add(path);
  const hemi=new THREE.HemisphereLight(0xb1c3dc,0x303038,1.8);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xe4ebf7,4.5);key.position.set(-16,32,15);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-40;key.shadow.camera.right=40;key.shadow.camera.top=33;key.shadow.camera.bottom=-33;key.shadow.camera.far=100;key.shadow.normalBias=.035;key.shadow.bias=-.0002;scene.add(key);
  const fill=new THREE.DirectionalLight(0x9cbbda,2.3);fill.position.set(8,13,-18);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xffe6c7,1.3);rim.position.set(-20,8,-5);scene.add(rim);
  const apron=new THREE.SpotLight(0xd8e4f0,650,.0,.67,.6,1.6);apron.position.set(-12,16,7);apron.target.position.set(-12,0,0);scene.add(apron,apron.target);
  function setDay(day){floorMaterial.color.set(day?0x858b90:0x3b3e43);runwayMaterial.color.set(day?0x737a7f:0x45494e);rampMaterial.color.set(day?0xb0b5b9:0x8a8f93);building.color.set(day?0x7b838d:0x171d24);steel.color.set(day?0x747c83:0x353b40);hemi.intensity=day?2.8:1.8;key.intensity=day?4:4.5;fill.intensity=day?1.4:2.3;rim.intensity=day?.8:1.3;red.emissiveIntensity=day?.4:1.7;apron.intensity=day?0:650;scene.background=new THREE.Color(day?0xc4cbd0:0x11161e);scene.fog=new THREE.FogExp2(day?0xc4cbd0:0x11161e,day?.009:.014);}
  return {path,setDay};
}

export function createEffects(scene){
  const count=1000,positions=new Float32Array(count*3),sizes=new Float32Array(count),opacities=new Float32Array(count);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('particleSize',new THREE.BufferAttribute(sizes,1));geometry.setAttribute('particleOpacity',new THREE.BufferAttribute(opacities,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pixelRatio:{value:Math.min(devicePixelRatio,2)},tint:{value:new THREE.Color(0xc9e0ed)}},vertexShader:`attribute float particleSize; attribute float particleOpacity; varying float vOpacity; uniform float pixelRatio; void main(){vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=min(180.0,particleSize*pixelRatio*260.0/max(1.0,-mv.z)); vOpacity=particleOpacity;}`,fragmentShader:`varying float vOpacity; uniform vec3 tint; void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;float a=pow(1.0-d*d,2.5)*vOpacity;gl_FragColor=vec4(tint,a);}`});
  const particles=new THREE.Points(geometry,material);particles.frustumCulled=false;scene.add(particles);
  const v=new THREE.Vector3(),normal=new THREE.Vector3(),q=new THREE.Quaternion(),e=new THREE.Euler(0,0,0,'ZYX');
  const seeds=Array.from({length:count},(_,i)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);});
  const shadowTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,64,3,64,64,64);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(7,4),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.65}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;scene.add(shadow);
  // A separate, longer-lived ground cloud catches the thruster wash at touchdown.
  // Emission is sampled from replay time, so backwards scrubbing is deterministic.
  const smokeCount=480,smokePositions=new Float32Array(smokeCount*3),smokeSizes=new Float32Array(smokeCount),smokeOpacity=new Float32Array(smokeCount);
  const smokeGeometry=new THREE.BufferGeometry();
  smokeGeometry.setAttribute('position',new THREE.BufferAttribute(smokePositions,3));
  smokeGeometry.setAttribute('particleSize',new THREE.BufferAttribute(smokeSizes,1));
  smokeGeometry.setAttribute('particleOpacity',new THREE.BufferAttribute(smokeOpacity,1));
  const smokeMaterial=material.clone();
  smokeMaterial.uniforms.tint.value.set(0xdce3e6);
  smokeMaterial.fragmentShader=`varying float vOpacity; uniform vec3 tint;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 uv=gl_PointCoord;float d=length(uv-.5)*2.;if(d>1.)discard;
    float cloud=noise(uv*5.)*.5+noise(uv*11.)*.3+noise(uv*23.)*.2;
    float alpha=pow(max(0.,1.-d*d),1.4)*vOpacity*(.45+cloud*.85);
    gl_FragColor=vec4(tint*(.82+cloud*.18),alpha);}`;
  const smoke=new THREE.Points(smokeGeometry,smokeMaterial);smoke.frustumCulled=false;scene.add(smoke);
  function update(time,state){
    shadow.position.x=state.x;shadow.material.opacity=.7/(1+state.altitude*.23);shadow.scale.setScalar(1+state.altitude*.05);
    for(let i=0;i<count;i++){
      const age=seeds[i]*1.05;const emitTime=time-age;const s=sampleFlight(emitTime);const active=emitTime>=FLIGHT_START&&emitTime<=LANDING_TIME+.38&&s.thrust>.025;
      if(!active){opacities[i]=0;continue;}
      e.set(s.roll,0,s.pitch,'ZYX');q.setFromEuler(e);
      const nozzle=i%4, nx=nozzle<2?-1.3:1.35,nz=nozzle%2?-.71:.71;
      v.set(nx,-.51,nz).applyQuaternion(q);v.x+=s.x;v.y+=s.y;
      normal.set(0,-1,0).applyQuaternion(q);
      const spread=age*(.35+seeds[(i+43)%count]*1.1),angle=seeds[(i+137)%count]*Math.PI*2;
      v.addScaledVector(normal,age*(7+s.thrust*7));v.x+=Math.cos(angle)*spread;v.z+=Math.sin(angle)*spread;v.y+=Math.sin(angle*3)*spread*.3;
      v.y=Math.max(.07+age*.3,v.y);
      positions[i*3]=v.x;positions[i*3+1]=v.y;positions[i*3+2]=v.z;
      sizes[i]=.18+age*1.15;opacities[i]=(1-age/1.05)*s.thrust*.7;
    }
    for(let i=0;i<smokeCount;i++){
      const seed=seeds[i],seed2=seeds[(i+91)%count],seed3=seeds[(i+193)%count];
      const emitTime=LANDING_TIME-.65+seed*1.1;
      const age=time-emitTime;
      if(age<0||age>5.5){smokeOpacity[i]=0;continue;}
      const source=sampleFlight(emitTime);
      const angle=seed2*Math.PI*2;
      const outward=(1.5+seed3*3)*age;
      smokePositions[i*3]=source.x+Math.cos(angle)*outward+source.vx*age*.13;
      smokePositions[i*3+1]=.3+age*(.8+seed3*.8)+Math.sin(seed2*15)*.16;
      smokePositions[i*3+2]=Math.sin(angle)*outward+(i%2?-.7:.7);
      smokeSizes[i]=2.6+age*(2.2+seed3*.7);
      const fadeIn=Math.min(1,age/.22),fadeOut=Math.pow(Math.max(0,1-age/5.5),1.15);
      smokeOpacity[i]=fadeIn*fadeOut*(.5+seed2*.15);
    }
    smokeGeometry.attributes.position.needsUpdate=true;
    smokeGeometry.attributes.particleSize.needsUpdate=true;
    smokeGeometry.attributes.particleOpacity.needsUpdate=true;
    geometry.attributes.position.needsUpdate=true;geometry.attributes.particleSize.needsUpdate=true;geometry.attributes.particleOpacity.needsUpdate=true;
  }
  return {update};
}
