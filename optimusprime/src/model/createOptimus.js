import * as THREE from 'three';
import { Builder } from './Builder.js';
import { createIonBlaster } from './createIonBlaster.js';
import { createHead } from './createHead.js';

const PI=Math.PI;
/** The same physical assemblies are present in both modes. Poses are local to real pivots. */
export function createOptimus({batch=true}={}) {
  const b=new Builder(),root=new THREE.Group();root.name='Optimus Prime';
  const tracks=[],wheels=[],links=[];
  const rig={};
  function part(parent,name,truck,robot,start,duration=1.8){
    const g=b.group(parent,name,truck.p,truck.r||[0,0,0]);
    tracks.push({node:g,truck:{p:truck.p,r:truck.r||[0,0,0]},robot:{p:robot.p,r:robot.r||[0,0,0]},start,duration});rig[name]=g;return g;
  }
  function wheel(parent,name,p,side,r=.66){
    const w=b.group(parent,name,p);wheels.push(w);
    b.cylinder(w,'rubber',[0,0,0],r,.42,[0,0,PI/2],r,48);
    for(const s of [-1,1]){
      b.torus(w,'rubber',[s*.19,0,0],r*.79,.105,[0,PI/2,0]);
      b.cylinder(w,'dark',[s*.224,0,0],r*.68,.025,[0,0,PI/2]);
      b.cylinder(w,'chrome',[s*.247,0,0],r*.56,.04,[0,0,PI/2],r*.56,32);
      b.torus(w,'steel',[s*.272,0,0],r*.47,.025,[0,PI/2,0]);
      b.cylinder(w,'silver',[s*.286,0,0],r*.20,.09,[0,0,PI/2],r*.2,16);
      for(let j=0;j<10;j++){const a=j*PI/5;const y=Math.cos(a)*r*.35,z=Math.sin(a)*r*.35;b.cylinder(w,'dark',[s*.276,y,z],.055,.012,[0,0,PI/2],.055,12);}
      for(let j=0;j<8;j++){const a=j*PI/4;b.cylinder(w,'silver',[s*.34,Math.cos(a)*r*.24,Math.sin(a)*r*.24],.025,.025,[0,0,PI/2],.025,6);}
    }
    for(let j=0;j<44;j++){
      const a=j*PI/22;
      for(const s of [-1,1])b.box(w,'black',[s*.13,Math.cos(a)*(r+.003),Math.sin(a)*(r+.003)],[.15,.024,.075],[a,0,s*.25],.002,'Tire tread');
    }
    return w;
  }
  function piston(parent,a,z,r=.07){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...z),mid=av.clone().lerp(bv,.58);b.rod(parent,'dark',a,mid.toArray(),r*1.6);b.rod(parent,'chrome',mid.toArray(),z,r);b.axle(parent,a,r*2.1,.2);b.axle(parent,z,r*1.8,.16);}
  function emblem(parent,p,size=.22){
    // An angular machined insignia, inset rather than printed on the armor.
    const g=b.group(parent,'Insignia',p);const q=size;
    b.profile(g,'silver',[0,0,0],[[-q,q*.8],[-q*.35,q*.65],[0,q*.86],[q*.35,q*.65],[q,q*.8],[q*.8,-q*.4],[0,-q],[-q*.8,-q*.4]],.025);
    for(const s of [-1,1]){b.profile(g,'redDark',[0,0,.02],[[s*q*.15,q*.36],[s*q*.7,q*.56],[s*q*.6,q*.02],[s*q*.22,-q*.15]],.014);b.box(g,'redDark',[s*q*.35,-q*.44,.025],[q*.16,q*.36,.018]);}
    b.box(g,'redDark',[0,-q*.05,.026],[q*.12,q*.8,.02]);
  }

  // Pelvis, differential and expandable central spine.
  const pelvis=part(root,'Pelvis',{p:[0,1.35,-.65]},{p:[0,4.92,0]},2.15,3.15);
  b.box(pelvis,'dark',[0,0,0],[1.8,.65,1.1]);
  b.axle(pelvis,[0,-.07,0],.32,2.12);
  b.plate(pelvis,'silver',[0,.14,.63],.68,.58,.15);
  b.vent(pelvis,[0,.1,.72],.38,.3,5,'steel');
  for(const s of [-1,1]){
    b.plate(pelvis,'steel',[s*.72,-.26,.56],.62,.68,.18,[0,0,s*-.1]);
    b.box(pelvis,'dark',[s*.75,.11,.69],[.49,.25,.07]);
    b.box(pelvis,'silver',[s*.75,.27,.7],[.5,.055,.10]);
    piston(pelvis,[s*.32,.2,.1],[s*.78,-.43,.16],.07);
  }
  const core=part(root,'Engine core',{p:[0,2.0,.6]},{p:[0,6.25,0]},2.2,3.3);
  b.box(core,'dark',[0,0,0],[1.38,1.8,.8]);
  b.cylinder(core,'steel',[0,0,0],.47,1.7);
  for(let i=0;i<8;i++)b.torus(core,'black',[0,-.78+i*.21,0],.48,.05,[PI/2,0,0]);
  b.plate(core,'steel',[0,-.02,.58],.70,1.15,.19);
  b.vent(core,[0,.2,.71],.4,.46,6);
  for(const s of [-1,1]){
    piston(core,[s*.65,-.72,.35],[s*.82,.75,.25],.085);
    for(let i=0;i<4;i++)b.rod(core,'steel',[s*.34,-.65+i*.26,.63],[s*.96,-.35+i*.22,.26],.065);
    b.rod(core,'black',[s*.3,-.8,-.4],[s*.8,.9,-.4],.13);
  }

  for(const s of [-1,1]){
    const tag=s===-1?'Left':'Right';
    // Rear chassis halves rotate down into the legs, without swapping meshes.
    const hip=part(root,`${tag} hip`,{p:[s*.83,1.28,-.65],r:[PI/2,0,0]},{p:[s*.96,4.88,0],r:[-.035,0,s*.055]},2.4+(s+1)*.12,3.3);
    const thigh=b.group(hip,'Thigh frame'); thigh.scale.y=1.34;
    b.axle(thigh,[0,0,0],.34,.83);
    b.box(thigh,'dark',[0,-.68,0],[.73,1.25,.69]);
    for(const x of [-.23,.23])b.rod(thigh,'chrome',[x,-.12,.3],[x,-1.17,.3],.07);
    b.plate(thigh,'steel',[0,-.64,.44],.92,1.2,.20,[0,0,-s*.06]);
    b.plate(thigh,'silver',[s*.25,-.54,.56],.23,.81,.045,[0,0,-s*.07]);
    for(let i=0;i<3;i++)b.box(thigh,'dark',[-s*.26,-.4-i*.18,.565],[.12,.035,.025]);
    for(const x of [-.32,.32])for(const y of [-.23,-1.04])b.bolt(thigh,[x,y,.56]);
    const knee=part(hip,`${tag} knee`,{p:[0,-1.80,0],r:[0,0,0]},{p:[0,-1.80,0],r:[.08,0,0]},4.0+(s+1)*.14,2.1);
    b.axle(knee,[0,0,0],.34,1.04);
    b.plate(knee,'blue',[0,-.10,.48],.83,.69,.19);
    b.cylinder(knee,'dark',[0,-.03,.6],.13,.035,[PI/2,0,0]);
    b.cylinder(knee,'redDark',[0,-.29,.59],.095,.035,[PI/2,0,0]);
    const shin=b.group(knee,'Shin frame'); shin.scale.y=1.17;
    b.box(shin,'black',[0,-1.12,0],[.72,1.95,.7]);
    for(const x of [-.22,.22])piston(shin,[x,-.23,.13],[x,-1.9,.17],.07);
    b.plate(shin,'blue',[s*.47,-1.1,.02],.26,1.95,.85,[0,s*-.10,0]);
    b.plate(shin,'blueLight',[-s*.46,-1.1,.12],.22,1.91,.79,[0,-s*.08,0]);
    b.plate(shin,'blue',[0,-1.15,.48],.86,1.82,.18);
    b.vent(shin,[0,-1.12,.59],.52,1.31,11,'silver');
    for(let i=0;i<6;i++){
      b.box(shin,'steel',[s*.34,-.54-i*.23,.65],[.07,.12,.08]);
      b.bolt(shin,[-s*.34,-.54-i*.23,.60],.025);
    }
    b.box(shin,'silver',[0,-1.93,.48],[.64,.10,.16]);
    const wheelCarrier=part(knee,`${tag} rear bogie`,{p:[s*.68,0,.53]},{p:[s*.68,0,-.30],r:[0,0,0]},3.7+(s+1)*.1,1.4);
    wheel(wheelCarrier,`${tag} rear wheel A`,[0,-.57,0],s,.62);
    wheel(wheelCarrier,`${tag} rear wheel B`,[0,-1.72,0],s,.62);
    b.box(wheelCarrier,'blue',[0,-1.13,-.58],[.58,2.55,.14]);
    b.box(wheelCarrier,'blueLight',[s*.25,-1.13,-.51],[.12,2.45,.20]);
    b.rod(wheelCarrier,'dark',[0,-.55,0],[0,-1.72,0],.14);
    const ankle=part(knee,`${tag} ankle`,{p:[0,-2.58,0],r:[-PI/2,0,0]},{p:[0,-2.58,.08],r:[-.045,0,-s*.055]},4.55+(s+1)*.12,1.7);
    b.axle(ankle,[0,0,0],.25,.92);
    b.box(ankle,'dark',[0,-.15,.34],[.92,.40,1.35]);
    b.plate(ankle,'blue',[0,-.02,.54],1.08,.49,.94,[.20,0,0]);
    b.box(ankle,'steel',[0,-.26,.70],[1.04,.15,1.40]);
    for(const x of [-.31,0,.31])b.plate(ankle,'silver',[x,-.14,1.16],.25,.25,.23,[.2,0,0]);
    b.plate(ankle,'blueDark',[0,-.11,-.42],.88,.5,.43);
    for(const x of [-.25,.25])piston(ankle,[x,.11,-.2],[x,-.04,.72],.045);
    // Front tires travel onto the hips, remaining connected to the side frame.
    const front=part(root,`${tag} front axle`,{p:[s*1.61,.72,1.49]},{p:[s*1.32,4.83,-.35],r:[0,0,s*.07]},2.4+(s+1)*.12,2.7);
    wheel(front,`${tag} front wheel`,[0,0,0],s,.70);
    b.box(front,'red',[0,.66,0],[.52,.17,1.6]);
    for(const z of [-.67,.67])b.box(front,'redDark',[0,.39,z],[.52,.55,.15],[z*.55,0,0]);

    // Cab windshield halves become the recognizable upper torso.
    const cab=part(root,`${tag} windshield chest`,{p:[s*.83,2.82,1.28]},{p:[s*.83,7.54,.08],r:[0,s*-.11,s*-.035]},1.5+(s+1)*.12,3.8);
    b.box(cab,'red',[0,0,0],[1.62,1.97,1.60],undefined,.085,'Cab shell');
    b.box(cab,'redLight',[0,.18,.80],[1.58,1.47,.14],undefined,.035);
    b.box(cab,'silver',[0,.44,.90],[1.42,.93,.07],[-.05,0,0],.035,'Windshield frame');
    b.box(cab,'black',[0,.44,.944],[1.32,.82,.045],[-.05,0,0],.035,'Window rubber gasket');
    b.box(cab,'glass',[0,.45,.975],[1.23,.73,.025],[-.05,0,0],.035,'Windshield');
    b.box(cab,'steel',[-s*.42,.54,.995],[.035,.60,.012],[0,0,-s*.15],.004);
    b.rod(cab,'black',[-s*.48,.12,1.006],[s*.19,.19,1.006],.025);
    b.rod(cab,'silver',[-s*.48,.12,1.01],[-s*.59,.32,1.01],.015);
    b.box(cab,'redDark',[0,-.15,.91],[1.32,.042,.022]);
    b.box(cab,'silver',[0,-.78,.86],[1.59,.20,.18],undefined,.022);
    b.box(cab,'chrome',[0,.99,.02],[1.58,.09,1.65]);
    b.box(cab,'redLight',[0,1.04,0],[1.58,.07,1.55]);
    for(const x of [-.5,.5])b.box(cab,'amber',[x,1.08,.61],[.13,.09,.2]);
    b.cylinder(cab,'chrome',[s*.43,1.13,.10],.075,.50,[PI/2,0,0],.065);
    b.cylinder(cab,'black',[s*.43,1.13,.37],.042,.02,[PI/2,0,0]);
    b.box(cab,'redDark',[s*.81,-.04,-.1],[.035,1.5,1.1]);
    for(let j=0;j<4;j++)b.box(cab,'redDark',[0,-.43-j*.06,.89],[1.2,.023,.018]);
    for(const x of [-.70,.70])for(const y of [-.68,.85])b.bolt(cab,[x,y,.925],.025);
    // Lower cab front splits into independent abdomen panels.
    const grille=part(root,`${tag} radiator`,{p:[s*.41,1.53,2.14]},{p:[s*.40,6.63,.64],r:[.07,0,s*-.10]},2.0+(s+1)*.12,3.3);
    b.box(grille,'silver',[0,0,0],[.79,1.30,.20]);
    b.vent(grille,[0,0,.12],.68,1.16,13,'chrome');
    b.box(grille,'chrome',[-s*.36,0,.17],[.04,1.2,.05]);
    // Bumper ends fold to the lower chest and preserve the headlights.
    const bumper=part(root,`${tag} bumper`,{p:[s*.87,.78,2.19]},{p:[s*.87,6.45,.32],r:[-.12,s*-.12,s*.14]},2.15+(s+1)*.1,3.1);
    b.box(bumper,'chrome',[0,0,0],[1.7,.37,.32]);
    b.box(bumper,'red',[s*.35,.40,-.05],[.94,.55,.25]);
    for(const x of [.18,.48]){
      b.cylinder(bumper,'chrome',[s*x,.43,.12],.145,.12,[PI/2,0,0],.145,24);
      b.cylinder(bumper,'lamp',[s*x,.43,.19],.111,.035,[PI/2,0,0],.111,24);
    }
    b.cylinder(bumper,'amber',[s*.55,-.01,.176],.07,.025,[PI/2,0,0]);
    for(let j=0;j<4;j++)b.bolt(bumper,[-.65+j*.43,-.10,.18],.025);

    // Arms initially nest in the cab sides. Doors hinge out as shoulder armor.
    const shoulder=part(root,`${tag} shoulder`,{p:[s*1.37,2.9,1.05],r:[0,0,0]},{p:[s*1.91,7.50,-.04],r:[s===-1?-.30:-.06,s===-1?-.95:0,s===-1?-.24:s*.16]},1.9+(s+1)*.16,3.2);
    b.axle(shoulder,[0,0,0],.38,.75);
    b.box(shoulder,'dark',[0,-.60,0],[.54,1.03,.52]);
    for(const x of [-.17,.17])piston(shoulder,[x,-.25,.15],[x,-1.13,.19],.055);
    b.cylinder(shoulder,'steel',[0,-.57,0],.19,.96);
    for(let i=0;i<5;i++)b.torus(shoulder,'dark',[0,-.28-i*.14,0],.23,.035,[PI/2,0,0],20);
    const door=part(shoulder,`${tag} door armor`,{p:[s*.20,-.12,0],r:[0,s*PI/2,0]},{p:[s*.18,.10,.09],r:[0,s*.18,s*.14]},.9+(s+1)*.12,2.4);
    b.box(door,'red',[0,0,0],[1.00,1.60,.22],undefined,.055,'Door exterior');
    b.box(door,'redLight',[0,.44,.04],[.88,.62,.17]);
    b.box(door,'black',[0,.44,.14],[.67,.47,.025],undefined,.015,'Door window');
    b.box(door,'glass',[0,.44,.16],[.58,.4,.018],undefined,.012);
    b.box(door,'silver',[0,-.24,.14],[.99,.23,.045]);
    for(const x of [-.19,.19])b.cylinder(door,'steel',[x,-.22,.18],.075,.035,[PI/2,0,0],.075,16);
    b.box(door,'chrome',[s*.28,-.06,.18],[.17,.07,.055]);
    for(const y of [-.53,-.68])b.box(door,'redDark',[0,y,.14],[.68,.035,.018]);
    emblem(door,[0,.42,.20],.20);
    b.rod(door,'steel',[s*.48,.35,0],[s*.74,.35,.25],.025);
    b.box(door,'chrome',[s*.75,.51,.25],[.16,.38,.08]);
    // Long exhaust heat shields ride on the outer shoulder frame.
    const exhaust=part(shoulder,`${tag} exhaust`,{p:[s*.48,-.1,-.57]},{p:[s*.57,.28,-.29],r:[0,0,s*-.08]},2.4+(s+1)*.1,2.5);
    b.cylinder(exhaust,'steel',[0,0,0],.15,1.60);
    b.cylinder(exhaust,'chrome',[0,1.08,0],.085,.73,[0,0,s*.08]);
    b.cylinder(exhaust,'black',[-s*.029,1.45,0],.063,.014,[0,0,s*.08]);
    for(const y of [-.58,.58])b.torus(exhaust,'silver',[0,y,0],.16,.026,[PI/2,0,0],24);
    for(let y=0;y<10;y++)for(let j=0;j<3;j++){const a=-.8+j*.8;b.box(exhaust,'black',[Math.sin(a)*.151,-.60+y*.13,Math.cos(a)*.151],[.035,.055,.015],[0,a,0],.003);}
    const elbow=part(shoulder,`${tag} elbow`,{p:[0,-1.18,0],r:[PI*.92,0,0]},{p:[0,-1.18,0],r:[s===-1?-2.00:-.24,s===-1?0:s*-.12,s===-1?0:s*.04]},3.05+(s+1)*.15,2.6);
    b.axle(elbow,[0,0,0],.25,.68);
    b.box(elbow,'dark',[0,-.60,0],[.58,1.10,.59]);
    for(const x of [-.18,.18])b.rod(elbow,'chrome',[x,-.15,.14],[x,-1.02,.14],.053);
    b.plate(elbow,'red',[0,-.62,.37],.86,1.13,.24,[.05,0,s*-.07]);
    b.plate(elbow,'redLight',[s*.34,-.63,.19],.22,1.13,.50,[0,0,s*-.10]);
    b.vent(elbow,[-s*.16,-.61,.50],.26,.67,6,'dark');
    for(const y of [-.25,-.95])b.box(elbow,'silver',[0,y,.49],[.7,.06,.07]);
    for(const y of [-.3,-.87])b.bolt(elbow,[s*.24,y,.51],.028);
    const hand=part(elbow,`${tag} wrist`,{p:[0,-1.12,0],r:[PI/2,0,0]},{p:[0,-1.12,.02],r:[s===-1?PI/2:0,s===-1?0:s*-.1,0]},4.8+(s+1)*.13,1.4);
    b.cylinder(hand,'steel',[0,-.08,0],.21,.25);
    if(s===-1){
      // Palm behind the handle; four fingers stack vertically around its front.
      b.box(hand,'blueDark',[0,-.40,-.23],[.57,.59,.15],undefined,.04,'Weapon hand palm');
      b.plate(hand,'blue',[0,-.40,-.32],.59,.62,.08);
      for(let j=0;j<4;j++){
        const y=-.205-j*.135;
        b.cylinder(hand,'steel',[-.27,y,.03],.065,.105,[PI/2,0,0],.065,12);
        b.box(hand,'blue',[-.26,y,.12],[.13,.105,.26],undefined,.025,'Finger proximal');
        b.box(hand,'blue',[0,y,.235],[.43,.107,.14],undefined,.025,'Finger curled around grip');
        b.box(hand,'steel',[.245,y,.13],[.12,.10,.22],[0,-.25,0],.022,'Finger tip');
        b.box(hand,'silver',[-.07,y+.027,.314],[.13,.026,.018],undefined,.004);
      }
      b.box(hand,'blue',[.32,-.23,-.02],[.17,.30,.18],[.15,0,-.43],.035,'Opposing thumb');
      b.box(hand,'steel',[.235,-.34,.10],[.16,.17,.18],[0,0,-.30],.028);
    }else{
      b.box(hand,'blueDark',[0,-.39,.03],[.62,.52,.42]);
      b.plate(hand,'blue',[0,-.36,-.21],.61,.49,.09);
      for(let j=0;j<4;j++){
        const x=-.22+j*.148;
        b.cylinder(hand,'silver',[x,-.30,.28],.071,.12,[0,0,PI/2],.071,12);
        b.box(hand,'blue',[x,-.44,.31],[.125,.29,.16],[.15,0,0],.023);
        b.box(hand,'dark',[x,-.60,.23],[.12,.16,.21],[-.52,0,0],.02);
        b.box(hand,'silver',[x,-.55,.34],[.10,.04,.045]);
      }
      b.box(hand,'blue',[-s*.35,-.36,.17],[.18,.34,.19],[.2,0,s*.35],.035);
    }
    if(s===-1)createIonBlaster(b,part,hand);
    // Cylindrical fuel tanks rotate to the back of the waist.
    const tank=part(root,`${tag} fuel tank`,{p:[s*1.27,1.07,-.60],r:[PI/2,0,0]},{p:[s*1.17,5.84,-.62],r:[0,0,s*-.18]},2.7+(s+1)*.10,2.6);
    b.cylinder(tank,'chrome',[0,0,0],.30,1.55,[0,0,0],.3,32);
    for(const y of [-.55,.55])b.torus(tank,'dark',[0,y,0],.304,.037,[PI/2,0,0],32);
    b.cylinder(tank,'steel',[0,.80,0],.20,.05);
    for(let i=0;i<3;i++)b.box(tank,'silver',[s*.1,-.5+i*.31,.31],[.56,.12,.14]);
  }

  // Head rises from inside the cab: blue helmet, tall antenna fins and silver mask.
  const head=part(root,'Head lift',{p:[0,2.50,.44],r:[.24,0,0]},{p:[0,9.14,.03],r:[-.035,-.06,0]},4.75,1.9);
  createHead(b,head);

  const back=part(root,'Back chassis',{p:[0,1.55,-1.10],r:[PI/2,0,0]},{p:[0,7.1,-.84]},2.35,3.1);
  b.box(back,'dark',[0,0,0],[1.55,1.77,.32]);
  for(const x of [-.62,.62])b.box(back,'steel',[x,0,-.20],[.16,1.85,.20]);
  b.cylinder(back,'dark',[0,.38,-.28],.61,.18,[PI/2,0,0],.61,32);
  b.cylinder(back,'steel',[0,.38,-.39],.36,.07,[PI/2,0,0],.36,24);
  b.vent(back,[0,-.50,-.19],1.1,.48,6);
  for(const s of [-1,1])for(let i=0;i<5;i++)b.box(back,'silver',[s*.63,-.65+i*.31,-.32],[.1,.08,.07]);

  // Telescoping linkage rods are updated from their real moving attachment points.
  function link(a,ap,z,zp,r){const mesh=b.cylinder(root,'chrome',[0,0,0],r,1);mesh.userData.dynamic=true;links.push({a,ap:new THREE.Vector3(...ap),z,zp:new THREE.Vector3(...zp),mesh});}
  for(const s of [-1,1]){const tag=s===-1?'Left':'Right';link(core,[s*.5,.6,-.18],rig[`${tag} shoulder`],[0,-.05,-.08],.065);link(pelvis,[s*.55,.2,-.13],core,[s*.45,-.7,-.13],.06);}
  if(batch)b.batch(root);
  const va=new THREE.Vector3(),vz=new THREE.Vector3(),dir=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  function sync(){root.updateMatrixWorld(true);for(const l of links){va.copy(l.ap).applyMatrix4(l.a.matrixWorld);vz.copy(l.zp).applyMatrix4(l.z.matrixWorld);root.worldToLocal(va);root.worldToLocal(vz);dir.subVectors(vz,va);l.mesh.position.copy(va).add(vz).multiplyScalar(.5);l.mesh.scale.set(1,dir.length(),1);l.mesh.quaternion.setFromUnitVectors(up,dir.normalize());}}
  sync();
  return {root,tracks,rig,wheels,materials:b.materials,sync,sourceMeshCount:b.meshCount,dispose(){b.dispose(root);}};
}
