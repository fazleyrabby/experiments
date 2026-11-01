import * as THREE from 'three';

const metal = (color, roughness=.35, metalness=.65) => new THREE.MeshStandardMaterial({color,roughness,metalness});
function mesh(geometry,material,parent,position=[0,0,0],rotation=[0,0,0]) {
  const object=new THREE.Mesh(geometry,material);
  object.position.set(...position);object.rotation.set(...rotation);
  object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
function box(parent,material,size,position,rotation) {return mesh(new THREE.BoxGeometry(...size),material,parent,position,rotation);}
function panel(parent,material,points,indices) {
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  return mesh(geometry,material,parent);
}
function line(parent,points,color=0x313238) {
  const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color}));parent.add(l);return l;
}
export function createCar() {
  const car=new THREE.Group();
  const paint=new THREE.MeshPhysicalMaterial({color:0xe5e8e9,metalness:.42,roughness:.28,clearcoat:1,clearcoatRoughness:.18,side:THREE.DoubleSide});
  const dark=metal(0x15171a,.48,.45), carbon=metal(0x080b0e,.65,.25), titanium=metal(0x8e9397,.26,.95), rubber=metal(0x0c0e10,.86,.02);
  const glass=new THREE.MeshPhysicalMaterial({color:0x30291f,metalness:.63,roughness:.15,clearcoat:1,clearcoatRoughness:.07,side:THREE.DoubleSide});
  const headlight=new THREE.MeshStandardMaterial({color:0xf0f4f7,emissive:0xe4f1ff,emissiveIntensity:4});
  const tail=new THREE.MeshStandardMaterial({color:0xec2725,emissive:0xff1510,emissiveIntensity:3});
  box(car,carbon,[4.23,.17,1.71],[0,-.39,0]);
  // Longitudinal body sections. Fine samples cut actual wheel openings in the sills.
  const stations=[[-2.34,.86,.12,.22],[-2.12,1.01,.22,.34],[-1.42,1.04,.25,.4],[-.7,.98,.19,.28],[.2,.97,.12,.25],[.9,1,.12,.34],[1.43,1.025,.1,.39],[1.97,.93,-.01,.19],[2.34,.72,-.1,-.04]];
  function section(x){let a=stations[0],b=stations[1];for(let i=0;i<stations.length-1;i++){if(x>=stations[i][0]){a=stations[i];b=stations[i+1];}}const u=THREE.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);return [THREE.MathUtils.lerp(a[1],b[1],u),THREE.MathUtils.lerp(a[2],b[2],u),THREE.MathUtils.lerp(a[3],b[3],u)];}
  const positions=[],indices=[],steps=160;
  for(let i=0;i<=steps;i++){
    const x=-2.34+i/steps*4.68;const [w,top,shoulder]=section(x);
    let bottom=-.37;
    for(const axle of [-1.42,1.43]){const dx=Math.abs(x-axle);if(dx<.49)bottom=Math.max(bottom,-.22+Math.sqrt(.49*.49-dx*dx));}
    const ring=[[-w,bottom],[-w*1.005,shoulder-.1],[-w*.87,shoulder],[-w*.65,top],[0,top-.015],[w*.65,top],[w*.87,shoulder],[w*1.005,shoulder-.1],[w,bottom]];
    for(const [z,y] of ring) positions.push(x,y,z);
    if(i<steps)for(let j=0;j<8;j++){const k=i*9+j;indices.push(k,k+9,k+1,k+1,k+9,k+10);}
  }
  const bodyGeo=new THREE.BufferGeometry();bodyGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));bodyGeo.setIndex(indices);bodyGeo.computeVertexNormals();mesh(bodyGeo,paint,car);
  // Flat front fascia, swept hood and splitter.
  panel(car,dark,[[2.345,-.12,-.72],[2.345,-.12,.72],[2.22,-.36,.81],[2.22,-.36,-.81]],[0,1,2,0,2,3]);
  box(car,carbon,[.24,.055,1.75],[2.15,-.385,0]);
  for(const side of [-1,1]){
    panel(car,headlight,[[1.94,.14,side*.91],[2.24,-.01,side*.745],[2.09,-.015,side*.74],[1.91,.09,side*.89]],[0,1,2,0,2,3]);
    line(car,[[1.93,.15,side*.915],[1.38,.405,side*.89],[.55,.295,side*.855],[-.62,.295,side*.84],[-1.65,.38,side*.86]],0xb4b8ba);
    line(car,[[.43,.27,side*.86],[.25,-.18,side*.981],[-.74,-.22,side*.991],[-.97,.25,side*.91]],0x5d6266);
    box(car,carbon,[1.45,.045,.055],[-.2,-.36,side*.98]);
    box(car,titanium,[.19,.018,.025],[-.68,.19,side*.982]);
  }
  // Single gold-glazed canopy with a low roof and sharply raked windshield.
  const canopySections=[[-1.69,.23,.53],[-1.05,.63,.62],[-.54,.74,.64],[-.05,.73,.62],[.9,.17,.65]];
  const cp=[],ci=[];
  canopySections.forEach(([x,y,w],i)=>{
    cp.push(x,.22,-w,x,y,-w*.79,x,y+.025,0,x,y,w*.79,x,.22,w);
    if(i<canopySections.length-1)for(let j=0;j<4;j++){const k=i*5+j;ci.push(k,k+5,k+1,k+1,k+5,k+6);}
  });
  const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cg.setIndex(ci);cg.computeVertexNormals();mesh(cg,glass,car);
  for(const side of [-1,1]){
    line(car,[[.91,.185,side*.65],[-.05,.744,side*.49],[-.54,.75,side*.506],[-1.05,.64,side*.49],[-1.7,.24,side*.53]],0xa6a5a0);
    line(car,[[-.54,.755,side*.51],[-.7,.22,side*.65]],0x171a1d);
    box(car,paint,[.22,.065,.17],[.43,.24,side*1.02],[0,side*.2,0]);
    box(car,dark,[.14,.025,.12],[.43,.2,side*.91]);
  }
  // Body-coloured roof spine gives the canopy the two-seat silhouette.
  box(car,dark,[.56,.028,1.02],[-.47,.755,0]);
  // Continuous full-width rear light, diffuser and four exposed cold-gas nozzles.
  box(car,dark,[.075,.31,1.81],[-2.31,-.12,0]);
  box(car,tail,[.045,.035,1.82],[-2.36,.16,0]);
  for(let i=-3;i<=3;i++)box(car,carbon,[.62,.16,.035],[-2.07,-.365,i*.24],[0,0,.06]);
  const thrusters=[];
  for(const z of [-.66,-.22,.22,.66]){
    mesh(new THREE.CylinderGeometry(.083,.115,.2,24,1,true),titanium,car,[-2.37,-.19,z],[0,0,Math.PI/2]);
    mesh(new THREE.CircleGeometry(.079,24),carbon,car,[-2.48,-.19,z],[0,-Math.PI/2,0]);
    mesh(new THREE.TorusGeometry(.084,.012,8,24),titanium,car,[-2.475,-.19,z],[0,Math.PI/2,0]);
    thrusters.push(new THREE.Vector3(-2.48,-.19,z));
  }
  for(const x of [-1.3,1.35])for(const z of [-.71,.71]){
    mesh(new THREE.CylinderGeometry(.09,.115,.08,20),titanium,car,[x,-.47,z]);
    mesh(new THREE.CircleGeometry(.087,20),dark,car,[x,-.515,z],[Math.PI/2,0,0]);
  }
  const wing=new THREE.Group();wing.position.set(-1.94,.34,0);car.add(wing);
  box(wing,paint,[.32,.045,1.95],[0,.12,0],[0,0,.025]);
  for(const side of [-1,1])box(wing,carbon,[.12,.14,.035],[0,.025,side*.69]);
  const wheels=[];
  for(const x of [-1.42,1.43])for(const side of [-1,1]){
    const wheel=new THREE.Group();wheel.position.set(x,-.22,side*.986);car.add(wheel);wheels.push(wheel);
    mesh(new THREE.CylinderGeometry(.365,.365,.25,48),rubber,wheel,[0,0,0],[Math.PI/2,0,0]);
    for(const z of [-.074,.074])mesh(new THREE.TorusGeometry(.337,.09,12,48),rubber,wheel,[0,0,z]);
    mesh(new THREE.CylinderGeometry(.293,.293,.22,48),dark,wheel,[0,0,0],[Math.PI/2,0,0]);
    mesh(new THREE.TorusGeometry(.29,.016,8,48),titanium,wheel,[0,0,side*.134]);
    mesh(new THREE.CylinderGeometry(.25,.25,.018,40),metal(0x46494b,.6,.8),wheel,[0,0,side*.073],[Math.PI/2,0,0]);
    box(wheel,metal(0x50231e,.5,.4),[.095,.22,.07],[.19,.03,side*.08]);
    const spokeMat=metal(0xa6aaac,.24,.9);
    for(let i=0;i<10;i++){
      const angle=i/10*Math.PI*2;
      box(wheel,spokeMat,[.025,.25,.024],[Math.sin(angle)*.17,Math.cos(angle)*.17,side*.139],[0,0,-angle]);
    }
    mesh(new THREE.CylinderGeometry(.073,.073,.035,24),titanium,wheel,[0,0,side*.15],[Math.PI/2,0,0]);
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;mesh(new THREE.SphereGeometry(.009,6,6),dark,wheel,[Math.sin(a)*.047,Math.cos(a)*.047,side*.174]);}
  }
  // Real text, rendered once to a small texture, for the demonstration plate.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#191e22';ctx.fillRect(0,0,256,80);ctx.strokeStyle='#92989c';ctx.lineWidth=3;ctx.strokeRect(3,3,250,74);ctx.font='36px Georgia';ctx.textAlign='center';ctx.fillStyle='#c7cbce';ctx.fillText('RDSTR',128,53);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(.4,.125),new THREE.MeshStandardMaterial({map:texture,roughness:.6}),car,[-2.356,-.025,0],[0,-Math.PI/2,0]);
  return {group:car,wheels,wing,thrusters,paint};
}
