import * as THREE from './vendor/three.module.js';
import {createCocoMotion} from './coco-motion.js';

const SCALE=.56;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));

export function createCoco({scene,contactTexture,reducedMotion=false}){
  const motion=createCocoMotion();
  const root=new THREE.Group();root.name='Coco the Crab';root.scale.setScalar(SCALE);scene.add(root);
  const body=new THREE.Group();root.add(body);
  const shellMaterial=new THREE.MeshPhysicalMaterial({color:'#e4562d',roughness:.20,metalness:.035,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:1.65});
  const clawMaterial=new THREE.MeshPhysicalMaterial({color:'#ec6535',roughness:.21,metalness:.025,clearcoat:.95,clearcoatRoughness:.13,envMapIntensity:1.55});
  const paleMaterial=new THREE.MeshPhysicalMaterial({color:'#f2ba88',roughness:.34,clearcoat:.65,envMapIntensity:.8});
  const darkMaterial=new THREE.MeshStandardMaterial({color:'#632c25',roughness:.52});
  const eyeWhite=new THREE.MeshPhysicalMaterial({color:'#fff1d1',roughness:.15,clearcoat:1,envMapIntensity:1.2});
  const eyeBlack=new THREE.MeshPhysicalMaterial({color:'#071512',roughness:.065,clearcoat:1,clearcoatRoughness:.025,envMapIntensity:2.0});
  const glint=new THREE.MeshBasicMaterial({color:'#fff9e8'});
  const sphere=new THREE.SphereGeometry(1,24,18),smallSphere=new THREE.SphereGeometry(1,12,10),cylinder=new THREE.CylinderGeometry(1,1,1,10);
  const Y=V(0,1,0),direction=V(),dummy=new THREE.Object3D();
  function ellipsoid(parent,material,x,y,z,sx,sy,sz,geometry=sphere){
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function segment(parent,material){const mesh=new THREE.Mesh(cylinder,material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function bone(mesh,a,b,radius){direction.subVectors(b,a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(radius,direction.length(),radius);mesh.quaternion.setFromUnitVectors(Y,direction.normalize());}
  function line(parent,points,radius,material){const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),18,radius,6,false);const mesh=new THREE.Mesh(geometry,material);parent.add(mesh);return mesh;}
  // The carapace is one rigid mesh. Vertex colors add shell depth without a texture.
  const shellGeometry=new THREE.SphereGeometry(1,40,28),position=shellGeometry.attributes.position,colors=[];
  const warm=new THREE.Color('#f38b4b'),deep=new THREE.Color('#b52e21'),color=new THREE.Color();
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
    position.setXYZ(i,x*(1+.018*Math.cos(z*8)),y,z);
    color.copy(deep).lerp(warm,Math.max(0,Math.min(1,y*.46+.52+z*.06)));colors.push(color.r,color.g,color.b);
  }
  shellGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));shellGeometry.computeVertexNormals();
  const carapaceMaterial=shellMaterial.clone();carapaceMaterial.color.set('#ffffff');carapaceMaterial.vertexColors=true;
  const shell=ellipsoid(body,carapaceMaterial,0,.53,-.035,.61,.33,.46,shellGeometry);shell.name='Coco rigid shell';
  ellipsoid(body,paleMaterial,0,.34,.025,.53,.13,.39);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.55,.026,7,48),shellMaterial);rim.rotation.x=Math.PI/2;rim.position.set(0,.43,-.02);rim.scale.y=.76;body.add(rim);
  // Two shallow ridges and tiny rounded lobes read as polished chitin, never fur.
  line(body,[V(-.37,.72,-.20),V(-.25,.81,-.10),V(-.12,.85,.01)],.008,clawMaterial);
  line(body,[V(.37,.72,-.20),V(.25,.81,-.10),V(.12,.85,.01)],.008,clawMaterial);
  for(const side of [-1,1])for(let i=0;i<3;i++)ellipsoid(body,shellMaterial,side*(.49-i*.03),.46,-.26+i*.15,.065,.055,.065,smallSphere);
  const eyes=[];
  for(const side of [-1,1]){
    const stalk=new THREE.Group();stalk.position.set(side*.255,.67,.24);body.add(stalk);
    ellipsoid(stalk,clawMaterial,0,.11,-.025,.055,.16,.055,smallSphere);
    const eye=new THREE.Group();eye.position.set(0,.28,.005);stalk.add(eye);
    ellipsoid(eye,eyeWhite,0,0,0,.152,.177,.135);
    const pupil=ellipsoid(eye,eyeBlack,-side*.012,-.005,.105,.095,.126,.061);
    ellipsoid(pupil,glint,-.25,.35,.85,.24,.23,.18,smallSphere);
    eyes.push({stalk,eye,pupil});
  }
  line(body,[V(-.09,.41,.438),V(0,.373,.455),V(.09,.41,.438)],.015,darkMaterial);
  const blush=new THREE.MeshStandardMaterial({color:'#f39c6e',roughness:.4});
  for(const side of [-1,1])ellipsoid(body,blush,side*.31,.445,.389,.09,.038,.025,smallSphere);

  // Tapered curved pincers are meshes with smooth closed ends, not open tubes.
  function finger(points,radii,segments=20,sides=10){
    const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(segments,false),vertices=[],normals=[],indices=[];
    for(let i=0;i<=segments;i++){
      const t=i/segments,point=curve.getPoint(t),f=t*(radii.length-1),k=Math.min(radii.length-2,Math.floor(f)),r=THREE.MathUtils.lerp(radii[k],radii[k+1],f-k);
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,n=frames.normals[i],b=frames.binormals[i];
        const nx=Math.cos(a)*n.x+Math.sin(a)*b.x,ny=Math.cos(a)*n.y+Math.sin(a)*b.y,nz=Math.cos(a)*n.z+Math.sin(a)*b.z;
        vertices.push(point.x+nx*r,point.y+ny*r,point.z+nz*r);normals.push(nx,ny,nz);
        if(i<segments&&j<sides){const v=i*(sides+1)+j;indices.push(v,v+1,v+sides+1,v+1,v+sides+2,v+sides+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setIndex(indices);return g;
  }
  const fixedFinger= finger([V(-.115,0,.10),V(-.21,.01,.29),V(-.16,.015,.44),V(-.045,.01,.50)],[.125,.11,.061,.004]);
  const movingFinger=finger([V(.10,0,.12),V(.20,.0,.28),V(.15,.0,.40),V(.035,.0,.47)],[.12,.10,.052,.004]);
  const claws=[];
  for(const side of [-1,1]){
    const arm=segment(body,shellMaterial),forearm=segment(body,clawMaterial);
    const shoulder=V(side*.43,.46,.20),elbow=V(side*.65,.65,.26);
    bone(arm,shoulder,elbow,.075);
    const wrist=new THREE.Group();wrist.position.set(side*.75,.95,.32);wrist.scale.setScalar(1.28);body.add(wrist);wrist.rotation.y=-side*.30;
    ellipsoid(wrist,clawMaterial,0,0,0,.22,.18,.24);
    const fixed=new THREE.Mesh(fixedFinger,clawMaterial);fixed.castShadow=true;fixed.receiveShadow=true;wrist.add(fixed);
    const jawPivot=new THREE.Group();jawPivot.position.set(.10,0,.11);wrist.add(jawPivot);
    const jaw=new THREE.Mesh(movingFinger,clawMaterial);jaw.position.set(-.10,0,-.11);jaw.castShadow=true;jaw.receiveShadow=true;jawPivot.add(jaw);
    ellipsoid(wrist,paleMaterial,-.07,.02,.475,.042,.035,.034,smallSphere);
    claws.push({side,arm,forearm,shoulder,elbow,wrist,jawPivot});
  }
  // Crab legs form inverted arches: an outward upper segment, an outboard
  // knee, then a descending shin and inward-curved pointed dactyl. The segments
  // are flattened chitin plates; small recessed joints avoid a pipe-and-ball look.
  const legProfile=new THREE.LatheGeometry([[.48,-.5],[.68,-.44],[.95,-.28],[1.06,-.04],[.98,.20],[.78,.38],[.59,.46],[.48,.5]].map(([r,y])=>new THREE.Vector2(r,y)),10);
  const shinProfile=new THREE.LatheGeometry([[.63,-.5],[.92,-.42],[1.04,-.25],[.88,.10],[.65,.40],[.48,.5]].map(([r,y])=>new THREE.Vector2(r,y)),10);
  for(const geometry of [legProfile,shinProfile]){
    const legColors=[];
    for(let i=0;i<geometry.attributes.position.count;i++){
      const y=geometry.attributes.position.getY(i),shade=Math.abs(y)>.44?.66:Math.abs(y)>.38?.86:1;
      legColors.push(shade,shade*.98,shade*.95);
    }
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(legColors,3));
  }
  const legMaterial=shellMaterial.clone();legMaterial.color.set('#df4c2c');legMaterial.vertexColors=true;
  function legSegment(geometry=legProfile){const mesh=new THREE.Mesh(geometry,legMaterial);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;}
  const toeGeometry=finger([V(),V(0,-.055,.010),V(0,-.125,.043),V(0,-.17,.075)],[.072,.060,.032,.002],16,8);
  const toes=new THREE.InstancedMesh(toeGeometry,shellMaterial,6);toes.name='Coco curved tapered feet';toes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);toes.castShadow=true;toes.receiveShadow=true;toes.frustumCulled=false;root.add(toes);
  const legJoints=new THREE.InstancedMesh(smallSphere,shellMaterial,12);legJoints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);legJoints.castShadow=true;legJoints.frustumCulled=false;root.add(legJoints);
  const legs=[];
  for(const side of [-1,1])for(let i=0;i<3;i++){
    const home=V(side*(.67+i*.12),.055,.50-i*.47);
    const hip=V(side*.43,.39,.27-i*.29),knee=V(),ankle=V(),foot=V();
    const upper=legSegment(),lower=legSegment(shinProfile);upper.name=`Coco leg ${side} ${i} upper`;lower.name=`Coco leg ${side} ${i} shin`;
    legs.push({side,i,home,hip,knee,ankle,foot,upper,lower,x:motion.state.x+home.x*SCALE,z:motion.state.z+home.z*SCALE,startX:0,startZ:0,goalX:0,goalZ:0,progress:1,phase:((i+(side>0?1:0))%2)*Math.PI});
  }
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.65,1.35),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,opacity:.72,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.115;scene.add(shadow);
  let blink=0,nextBlink=3.5,bob=0,bobVelocity=0,lastGreetings=0;
  function update(dt,time,pip,obstacles){
    const s=motion.update(dt,pip,obstacles);
    root.position.set(s.x,.06,s.z);root.rotation.y=s.yaw;
    const moving=Math.min(1,s.speed/1.0),motionAmount=reducedMotion?.3:1;
    const desiredBob=Math.abs(Math.sin(s.gait))*moving*.075*motionAmount+s.delight*.045;
    bobVelocity+=(desiredBob-bob)*95*dt;bobVelocity*=Math.exp(-dt*13);bob+=bobVelocity*dt;
    body.position.y=bob;body.rotation.z=Math.sin(s.gait)*moving*.045*motionAmount;body.rotation.x=Math.sin(time*2.2)*.008*motionAmount;
    if(time>nextBlink){blink=.17;nextBlink=time+3.3+Math.sin(time*1.7)*1.1;}
    blink=Math.max(0,blink-dt);const blinkScale=blink>0?Math.max(.08,Math.abs(blink-.085)/.085):1;
    for(let i=0;i<eyes.length;i++){
      const e=eyes[i],side=i===0?-1:1;
      e.eye.scale.y=blinkScale;e.stalk.rotation.z=Math.sin(time*2.3+i)*.045*motionAmount+(s.state==='startled'?-side*.12:0);
      e.pupil.position.x=damp(e.pupil.position.x,Math.max(-.028,Math.min(.028,(pip.x-s.x)*.02))-side*.012,7,dt);
    }
    for(let i=0;i<claws.length;i++){
      const c=claws[i],wave=s.wave*(i===0?1:.48),fidget=Math.sin(time*(2.2+i*.4)+i*2)*.035*motionAmount;
      // Lift the pincers clear of the front knees so all six legs can read.
      c.wrist.position.y=.95+wave*.30+s.delight*.025+Math.sin(s.gait+i)*moving*.025;
      c.wrist.rotation.z=c.side*(wave*.30+fidget);c.wrist.rotation.x=-.80-wave*.12+fidget;
      c.jawPivot.rotation.y=.34+(Math.sin(time*(3+i*.8)+i)*.5+.5)*(.13+s.delight*.16)+wave*(.28+.12*Math.sin(time*12));
      bone(c.forearm,c.elbow,c.wrist.position,.09);
    }
    const cosine=Math.cos(s.yaw),sine=Math.sin(s.yaw);
    for(let i=0;i<legs.length;i++){
      const l=legs[i],hx=s.x+(l.home.x*cosine+l.home.z*sine)*SCALE,hz=s.z+(-l.home.x*sine+l.home.z*cosine)*SCALE;
      const reachError=Math.hypot(hx-l.x,hz-l.z);
      if(l.progress>=1&&reachError>.07&&(reachError>.12||Math.sin(s.gait+l.phase+(s.speed<.05?time*.9:0))>0)){l.startX=l.x;l.startZ=l.z;l.goalX=hx+s.vx*.035;l.goalZ=hz+s.vz*.035;l.progress=0;}
      if(l.progress<1){l.progress=Math.min(1,l.progress+dt*(s.state==='startled'?15:11));const t=l.progress*l.progress*(3-2*l.progress);l.x=THREE.MathUtils.lerp(l.startX,l.goalX,t);l.z=THREE.MathUtils.lerp(l.startZ,l.goalZ,t);}
      const dx=(l.x-s.x)/SCALE,dz=(l.z-s.z)/SCALE;
      l.foot.set(dx*cosine-dz*sine,.055+Math.sin(l.progress*Math.PI)*.12*motionAmount,dx*sine+dz*cosine);
      l.hip.y=.39+bob;
      l.knee.set(l.foot.x+l.side*.10,.49+l.i*.015+bob*.6+Math.sin(l.progress*Math.PI)*.045,l.foot.z-.045);
      l.ankle.set(l.foot.x+l.side*.075,l.foot.y+.17,l.foot.z);
      bone(l.upper,l.hip,l.knee,.105);l.upper.scale.z*=.64;
      bone(l.lower,l.knee,l.ankle,.092);l.lower.scale.z*=.64;
      dummy.rotation.set(0,0,0);dummy.position.copy(l.knee);dummy.scale.set(.049,.042,.040);dummy.updateMatrix();legJoints.setMatrixAt(i*2,dummy.matrix);
      dummy.position.copy(l.ankle);dummy.scale.set(.042,.037,.036);dummy.updateMatrix();legJoints.setMatrixAt(i*2+1,dummy.matrix);
      dummy.position.copy(l.ankle);dummy.scale.set(1,1,1);dummy.rotation.y=-l.side*Math.PI/2;dummy.updateMatrix();toes.setMatrixAt(i,dummy.matrix);
    }
    legJoints.instanceMatrix.needsUpdate=true;toes.instanceMatrix.needsUpdate=true;shadow.position.set(s.x,.115,s.z);
    const greeted=s.greetings!==lastGreetings;lastGreetings=s.greetings;
    return greeted;
  }
  function reset(){motion.reset();bob=0;bobVelocity=0;lastGreetings=0;blink=0;nextBlink=0;for(const l of legs){l.x=motion.state.x+l.home.x*SCALE;l.z=motion.state.z+l.home.z*SCALE;l.progress=1;}root.position.set(motion.state.x,.06,motion.state.z);root.rotation.y=0;}
  reset();
  return {root,update,reset,greet:motion.greet,startle:motion.startle,getState:()=>({...motion.state,scale:SCALE,legs:legs.length,shellRigid:true})};
}
