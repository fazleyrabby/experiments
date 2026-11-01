import * as THREE from 'three';
import { createResources } from './resources.js';

export const COMPONENTS = [
  { id: 'crystal', title: 'Crystal & bezel', description: 'A clear crystal protects the dial. The polished bezel holds it in place and finishes the edge of the case.' },
  { id: 'hands', title: 'The hands', description: 'Concentric shafts carry the hour, minute, and seconds hands. The motion works reduce the minute hand’s rotation to one turn of the hour hand every twelve hours.' },
  { id: 'dial', title: 'The dial', description: 'The visible face of the watch. Applied hour markers and a fine minute track turn the movement’s rotations into a readable display of time.' },
  { id: 'bridges', title: 'Movement bridges', description: 'These rigid supports secure the wheel pivots above the mainplate. Jewel bearings reduce friction and wear at the moving shafts.' },
  { id: 'train', title: 'Going train', description: 'A sequence of toothed wheels carries energy from the mainspring barrel to the escapement. The different wheel sizes establish the movement’s gear ratios.' },
  { id: 'balance', title: 'Balance & escapement', description: 'The balance and hairspring oscillate back and forth. The escapement releases energy in small steps and gives the balance an impulse to keep it moving.' },
  { id: 'barrel', title: 'Mainspring barrel', description: 'Winding the crown coils a long spring inside this drum. As the spring unwinds, it turns the barrel and supplies energy to the wheel train.' },
  { id: 'mainplate', title: 'The mainplate', description: 'The foundation of the movement. Precisely located bearings hold the lower ends of the wheel pivots and keep the mechanism aligned.' },
  { id: 'case', title: 'Case & crown', description: 'The steel case protects the movement, and the lugs attach a strap. Turning the knurled crown transmits motion through the winding stem to the mainspring.' },
];

export function createWatch() {
  const r = createResources();
  const root = new THREE.Group(); root.name = 'Mechanical watch';
  const parts = [];
  function part(id, y, offset) {
    const object = new THREE.Group(); object.name = id; object.userData.part = id; object.position.y = y; root.add(object);
    const p = { ...COMPONENTS.find(c => c.id === id), object, origin: object.position.clone(), offset: new THREE.Vector3(...offset), order: 0 };
    parts.push(p); return object;
  }
  const crystal = part('crystal', .615, [0, 4.65, 0]);
  r.ring(crystal, 2.43, 2.12, .105, r.steel, 0, 0, 0, .035);
  r.ring(crystal, 2.45, 2.39, .035, r.brushed, 0, -.063, 0, .012);
  r.ring(crystal, 2.135, 2.10, .018, r.goldEdge, 0, .047, 0, .004);
  r.ring(crystal, 2.13, 2.105, .04, r.darkSteel, 0, .065);
  r.cylinder(crystal, 2.105, .045, r.glass, 0, .055);
  r.ring(crystal, 2.1, 2.085, .018, r.steel, 0, .07, 0, .002);

  const hands = part('hands', .51, [.12, 3.54, .1]);
  function hand(length, width, material, y, tail = .2) {
    const g = new THREE.Group(); g.position.y = y; hands.add(g);
    r.plate(g, [[-width * .32, tail], [-width / 2, -.23], [0, -length], [width / 2, -.23], [width * .32, tail]], .018, material,0,0,0,[],.002);
    // A second, darker facet gives the dauphine hand a crisp central ridge.
    r.plate(g, [[0,tail],[-width*.44,-.23],[0,-length+.035]], .005, r.darkSteel,0,.016,0,[],.001);
    return g;
  }
  const hour = hand(1.23, .18, r.steel, 0);
  const minute = hand(1.76, .125, r.steel, .043);
  const second = hand(1.85, .019, r.goldEdge, .085, .43);
  r.ring(second, .11, .077, .018, r.goldEdge, 0, .015, .36, .003);
  r.cylinder(hands, .095, .12, r.steel, 0, .04);
  r.cylinder(hands, .05, .025, r.gold, 0, .11);

  const dial = part('dial', .405, [-.08, 2.65, .12]);
  r.ring(dial, 2.105, .11, .08, r.dial, 0, 0, 0, .01);
  const sunburst=r.texture(1024,(ctx,s)=>{
    ctx.fillStyle='#929292';ctx.fillRect(0,0,s,s);
    for(let i=0;i<3000;i++){const a=i/3000*Math.PI*2,v=105+(i*73%95);ctx.strokeStyle=`rgb(${v},${v},${v})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(512,512);ctx.lineTo(512+Math.cos(a)*730,512+Math.sin(a)*730);ctx.stroke();}
  });
  const dialSurface=new THREE.MeshStandardMaterial({color:'#0d352b',metalness:.86,roughness:.46,roughnessMap:sunburst});
  r.mesh(dial,r.keep(new THREE.RingGeometry(.11,2.1,160).rotateX(-Math.PI/2)),dialSurface,0,.045);
  r.ring(dial, 2.05, 2.035, .008, r.gold, 0, .048, 0, .001);
  r.ring(dial, 1.69, 1.68, .006, r.gold, 0, .05, 0, .001);
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, major = i % 5 === 0;
    const marker = r.box(dial, major ? .066 : .013, major ? .035 : .009, major ? .23 : .06, major ? r.steel : r.gold,
      Math.sin(a) * (major ? 1.80 : 1.945), .052, -Math.cos(a) * (major ? 1.80 : 1.945));
    marker.rotation.y = -a;
    if (major) {
      const facet = r.box(dial, .020, .007, .20, r.goldEdge, Math.sin(a) * 1.80, .074, -Math.cos(a) * 1.80); facet.rotation.y = -a;
      r.cylinder(dial,.018,.008,r.lume,Math.sin(a)*1.995,.055,-Math.cos(a)*1.995,12);
    }
  }
  const printing = r.texture(2048, (ctx, s) => {
    ctx.scale(2,2);s=1024;
    ctx.clearRect(0, 0, s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#d8dfd3'; ctx.font = '300 52px Georgia';
    for (const n of [12, 3, 6, 9]) {
      const a = n / 12 * Math.PI * 2; ctx.fillText(n.toString().padStart(2, '0'), s / 2 + Math.sin(a) * 342, s / 2 - Math.cos(a) * 342);
    }
    ctx.font = '29px Georgia'; ctx.fillStyle = '#dfd9bc'; ctx.fillText('M É C A N I Q U E', s / 2, 342);
    ctx.font = '12px Arial'; ctx.fillStyle = '#bdcbb7'; ctx.fillText('A T E L I E R', s / 2, 374);
    ctx.font = '14px Georgia'; ctx.fillStyle = '#a3b3a0'; ctx.fillText('Mouvement mécanique', s / 2, 683);
    ctx.font = '9px Arial'; ctx.fillText('M A N U A L   W I N D I N G', s / 2, 711);
    ctx.font = '10px Arial';ctx.fillStyle='#aebaa4';
    for(let i=1;i<=12;i++){const a=i/12*Math.PI*2;ctx.save();ctx.translate(s/2+Math.sin(a)*469,s/2-Math.cos(a)*469);ctx.rotate(a);ctx.fillText(String(i*5).padStart(2,'0'),0,0);ctx.restore();}
    // Fine radial sunburst and a concentric guilloche centre, visible when zoomed.
    ctx.strokeStyle = '#c1d3c60b'; ctx.lineWidth = .5;
    for(let i=0;i<1440;i++){const a=i/1440*Math.PI*2;ctx.beginPath();ctx.moveTo(512+Math.cos(a)*22,512+Math.sin(a)*22);ctx.lineTo(512+Math.cos(a)*485,512+Math.sin(a)*485);ctx.stroke();}
    ctx.strokeStyle='#c1d3c60a';
    for(let rad=50;rad<285;rad+=2.2){ctx.beginPath();ctx.arc(512,512,rad,0,Math.PI*2);ctx.stroke();}
  });
  const ink = new THREE.MeshBasicMaterial({ map: printing, transparent: true, depthWrite: false });
  const printMesh = r.mesh(dial, r.keep(new THREE.PlaneGeometry(4.2, 4.2).rotateX(-Math.PI / 2)), ink, 0, .051); printMesh.castShadow = false;

  const bridges = part('bridges', .255, [.1, 1.74, -.08]);
  r.plate(bridges, [[-1.7,-.7],[-1.6,-1.15],[-.9,-1.65],[.05,-1.56],[.52,-1.15],[.36,-.75],[-.5,-.3],[-1.13,-.25]], .11, r.nickel, 0, 0, 0, [[-.7,-.85,.20]]);
  r.plate(bridges, [[-.5,.02],[-.15,-.35],[.7,-.35],[1.45,.1],[1.5,.55],[1.22,.74],[.6,.4],[.15,.4]], .10, r.brushed, 0, .015, 0, [[.49,.04,.12],[1.1,.5,.09]]);
  r.plate(bridges, [[-.7,.7],[-.36,1.03],[-.25,1.6],[-.65,1.72],[-1.03,1.2]], .08, r.nickel);
  [[-1.48,-.75],[-.58,-1.4],[.17,-1.16],[1.3,.26],[-.4,1.48]].forEach(([x,z]) => r.screw(bridges,x,.08,z));
  [[-.7,-.85],[.49,.04],[1.1,.5],[-.88,1.02],[-.4,.15]].forEach(([x,z]) => r.jewel(bridges,x,.08,z));
  // Narrow decorative grooves and polished anglage around the broad bridge.
  for (let i = 0; i < 16; i++) r.box(bridges,.76,.002,.003,r.darkSteel,-.82,.078,-1.25 + i*.045);
  r.ring(bridges,.255,.22,.008,r.steel,-.7,.08,-.85,.002);
  [[-.7,-.85],[.49,.04],[1.1,.5]].forEach(([x,z])=>r.ring(bridges,.11,.088,.01,r.goldEdge,x,.092,z,.002));
  // A small engraved maker's cartouche on the barrel bridge.
  const bridgePrint=r.texture(512,(ctx,s)=>{ctx.clearRect(0,0,s,s);ctx.textAlign='center';ctx.fillStyle='#374540';ctx.font='32px Georgia';ctx.fillText('MÉCANIQUE',256,230);ctx.font='18px Arial';ctx.fillText('A T E L I E R',256,273);});
  const bridgeInk=new THREE.MeshBasicMaterial({map:bridgePrint,transparent:true,depthWrite:false});
  const bridgeLabel=r.mesh(bridges,r.keep(new THREE.PlaneGeometry(.68,.68).rotateX(-Math.PI/2)),bridgeInk,-.8,.083,-1.22);bridgeLabel.castShadow=false;

  function gear(parent, radius, teeth, x, y, z, material = r.gold) {
    const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g);
    const shape = new THREE.Shape();
    const points = [];
    for (let i = 0; i < teeth; i++) {
      for (const [fraction, scale] of [[0,.91],[.22,1],[.65,1],[.88,.91]]) {
        const a = (i + fraction) / teeth * Math.PI * 2;
        points.push(new THREE.Vector2(Math.cos(a) * radius * scale, Math.sin(a) * radius * scale));
      }
    }
    shape.setFromPoints(points); shape.closePath();
    for (let i = 0; i < 5; i++) {
      const hole = new THREE.Path(), a = i / 5 * Math.PI * 2 + .15, b = a + .85;
      hole.moveTo(Math.cos(a) * radius * .3, Math.sin(a) * radius * .3);
      hole.lineTo(Math.cos(b) * radius * .3, Math.sin(b) * radius * .3);
      hole.absarc(0,0,radius*.75,b,a,true); hole.closePath(); shape.holes.push(hole);
    }
    r.mesh(g,r.keep(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:1,steps:1}).rotateX(-Math.PI/2)),material);
    r.cylinder(g,radius*.22,.09,r.goldEdge,0,.025);
    r.cylinder(g,.035,.29,r.steel,0,.075,0,16);
    r.ring(g,radius*.86,radius*.82,.008,r.goldEdge,0,.051,0,.001);
    r.ring(g,radius*.23,radius*.17,.014,r.steel,0,.08,0,.003);
    return g;
  }
  const train = part('train', .065, [.12, 1.04, -.02]);
  const wheels = [gear(train,.64,56,-.48,0,.22),gear(train,.4,36,.49,.045,.04),gear(train,.35,30,1.1,.01,.5),gear(train,.29,24,.94,.055,1.12)];
  const wheelRates = [.19,-.19*56/36,.19*56/30,-.19*56/24];
  wheels.forEach((wheel,i) => { wheel.rotation.y = i*.17; });

  const balancePart = part('balance', .095, [-.85, .34, .35]);
  const balance = new THREE.Group(); balance.position.set(-.91,0,1.02); balancePart.add(balance);
  r.ring(balance,.57,.48,.045,r.goldEdge,0,0,0,.009);
  for (let i = 0; i < 3; i++) { const a = i*Math.PI*2/3; const arm = r.box(balance,.075,.035,.49,r.gold,Math.sin(a)*.25,0,Math.cos(a)*.25);arm.rotation.y = a; }
  for (let i = 0; i < 12; i++) { const a = i*Math.PI*2/12; r.cylinder(balance,.025,.065,r.gold,Math.sin(a)*.53,0,Math.cos(a)*.53,8); }
  r.cylinder(balance,.085,.09,r.steel);
  const hairspring = new THREE.Group(); hairspring.position.copy(balance.position);balancePart.add(hairspring);
  r.spiral(hairspring,{radius:.38,turns:5.5,thickness:.006,y:.08,material:r.blue});
  r.cylinder(balancePart,.028,.26,r.steel,-.91,.1,1.02,16);
  r.ring(balancePart,.12,.075,.025,r.goldEdge,-.91,.145,1.02,.005);
  r.jewel(balancePart,-.91,.16,1.02,.045);
  r.plate(balancePart,[[-1.58,.72],[-1.38,.65],[-.9,.94],[-.85,1.1],[-1,1.15],[-1.48,.89]],.055,r.brushed,0,.14);
  r.screw(balancePart,-1.42,.19,.77,.06);
  r.box(balancePart,.022,.09,.10,r.blue,-1.26,.12,.85);
  const lever = new THREE.Group();lever.position.set(.27,.025,1.05);balancePart.add(lever);
  r.plate(lever,[[-.12,-.07],[.35,-.12],[.48,-.25],[.5,-.1],[.35,.02],[.48,.19],[.46,.28],[.26,.07],[-.12,.07]],.026,r.steel);
  r.box(lever,.055,.035,.08,r.ruby,.43,.025,-.18);
  r.box(lever,.055,.035,.08,r.ruby,.43,.025,.19);
  r.jewel(balancePart,.27,.05,1.05,.04);

  const barrelPart = part('barrel', .06, [-.68, .65, -.38]);
  const barrel = gear(barrelPart,.73,64,-.7,0,-.85,r.gold);
  r.ring(barrel,.64,.59,.15,r.gold,0,.09,0,.01);
  r.cylinder(barrel,.59,.018,r.darkSteel,0,.045);
  r.ribbonSpring(barrel,{radius:.49,turns:7.5,y:.065,height:.075,width:.011,material:r.steel});
  r.cylinder(barrel,.08,.23,r.steel,0,.12);
  const winding=gear(barrelPart,.31,36,.41,.025,-1.32,r.steel);
  gear(barrelPart,.28,32,1.02,.025,-1.11,r.steel);
  r.screw(winding,0,.18,0,.065);
  r.plate(barrelPart,[[.11,-1.5],[.17,-1.65],[.7,-1.6],[.85,-1.45],[.45,-1.3]],.025,r.brushed);
  // The open barrel intentionally exposes the power spring in this teaching model.

  const mainplate = part('mainplate', -.115, [0,-.23,0]);
  r.ring(mainplate,1.98,.13,.12,r.nickel,0,0,0,.025);
  r.ring(mainplate,1.91,1.85,.008,r.steel,0,.07,0,.001);
  const perlage=r.texture(1024,(ctx,s)=>{
    ctx.fillStyle='#a7a69b';ctx.fillRect(0,0,s,s);
    for(let row=-1;row<21;row++)for(let col=-1;col<21;col++){
      const x=col*52+(row%2)*26,y=row*52;
      const gradient=ctx.createRadialGradient(x-10,y-10,1,x,y,40);gradient.addColorStop(0,'#b9bab0');gradient.addColorStop(.7,'#9ea399');gradient.addColorStop(1,'#afb0a3');
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,38,0,Math.PI*2);ctx.fill();
      for(let radius=3;radius<38;radius+=1.8){ctx.strokeStyle=radius%4?'#e3e0ce18':'#636f6618';ctx.lineWidth=.5;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();}
    }
  });
  const perlageMaterial=new THREE.MeshStandardMaterial({map:perlage,metalness:.86,roughness:.37});
  r.mesh(mainplate,r.keep(new THREE.RingGeometry(.13,1.84,128).rotateX(-Math.PI/2)),perlageMaterial,0,.067);
  [[-1.65,-.45],[.4,-1.65],[1.65,.13],[.4,1.7],[-1.5,1]].forEach(([x,z]) => r.screw(mainplate,x,.083,z));
  [[-.48,.22],[.49,.04],[1.1,.5],[.94,1.12],[-.91,1.02],[-.7,-.85]].forEach(([x,z]) => r.jewel(mainplate,x,.083,z));
  r.ring(mainplate,.30,.22,.06,r.darkSteel,1.35,0,-.9,.01);
  const engraving=r.texture(1024,(ctx,s)=>{
    ctx.clearRect(0,0,s,s);ctx.fillStyle='#34433f';ctx.textAlign='center';ctx.font='19px Georgia';
    const text='M É C A N I Q U E   ·   A T E L I E R';
    [...text].forEach((c,i)=>{const a=-1+(i/text.length)*2;ctx.save();ctx.translate(s/2+Math.sin(a)*410,s/2-Math.cos(a)*410);ctx.rotate(a);ctx.fillText(c,0,0);ctx.restore();});
  });
  const engravingMaterial=new THREE.MeshBasicMaterial({map:engraving,transparent:true,depthWrite:false});
  const engravingMesh=r.mesh(mainplate,r.keep(new THREE.PlaneGeometry(3.8,3.8).rotateX(-Math.PI/2)),engravingMaterial,0,.072);engravingMesh.castShadow=false;

  const casePart = part('case', 0, [0,-1.55,0]);
  r.ring(casePart,2.40,2.12,.45,r.brushed,0,.035,0,.055);
  r.ring(casePart,2.41,2.13,.045,r.steel,0,.278,0,.018);
  r.ring(casePart,2.405,2.37,.018,r.darkSteel,0,.235,0,.004);
  r.ring(casePart,2.39,2.30,.04,r.steel,0,-.225,0,.015);
  r.ring(casePart,2.35,1.92,.10,r.steel,0,-.35,0,.04);
  r.cylinder(casePart,1.93,.028,r.glass,0,-.38);
  r.ring(casePart,2.26,2.14,.028,r.darkSteel,0,-.418,0,.005);
  const lugShape=new THREE.Shape();lugShape.moveTo(1.04,-1.90);lugShape.quadraticCurveTo(1.48,-1.74,1.69,-1.61);lugShape.quadraticCurveTo(1.69,-2.15,1.55,-2.72);lugShape.quadraticCurveTo(1.51,-2.84,1.28,-2.86);lugShape.lineTo(1.22,-2.70);lugShape.quadraticCurveTo(1.36,-2.2,1.04,-1.90);
  const lugGeometry=r.keep(new THREE.ExtrudeGeometry(lugShape,{depth:.235,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:4,curveSegments:20,steps:1}).rotateX(-Math.PI/2).translate(0,-.14,0));
  const pos=lugGeometry.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)-Math.max(0,Math.abs(pos.getZ(i))-1.9)*.18);
  lugGeometry.computeVertexNormals();
  for(const sx of [-1,1])for(const sz of [-1,1]){const lug=r.mesh(casePart,lugGeometry,r.steel);lug.scale.set(sx,1,sz);}
  for(const sz of [-1,1]){const pin=r.cylinder(casePart,.04,2.66,r.steel,0,-.21,sz*2.64,24);pin.rotation.z=Math.PI/2;}
  const stem = r.cylinder(casePart,.10,.60,r.steel,2.48,.015,0,24);stem.rotation.z = Math.PI/2;
  const crown = new THREE.Group(); crown.position.set(2.84,.015,0);crown.rotation.z = -Math.PI/2;casePart.add(crown);
  r.cylinder(crown,.265,.29,r.steel,0,0,0,48);
  r.cylinder(crown,.22,.014,r.darkSteel,0,.155,0,48);
  r.ring(crown,.24,.20,.02,r.steel,0,.165,0,.003);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const petal=r.box(crown,.025,.008,.11,r.goldEdge,Math.sin(a)*.065,.169,Math.cos(a)*.065);petal.rotation.y=a;}
  r.cylinder(crown,.04,.012,r.goldEdge,0,.176,0,24);
  for(let i=0;i<40;i++){const a=i/40*Math.PI*2;const ridge=r.box(crown,.022,.25,.022,r.brushed,Math.sin(a)*.265,0,Math.cos(a)*.265);ridge.rotation.y=a;}
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;r.screw(casePart,Math.cos(a)*2.17,-.416,Math.sin(a)*2.17,.055);}

  parts.sort((a,b) => COMPONENTS.findIndex(c=>c.id===a.id)-COMPONENTS.findIndex(c=>c.id===b.id));
  parts.forEach((p,i) => { p.order = (parts.length - 1 - i) / (parts.length - 1); });
  r.batch(root);
  const variants = new Map();
  let selected = null;
  function select(id) {
    selected = id;
    parts.forEach(p => p.object.traverse(mesh => {
      if (!mesh.isMesh) return;
      mesh.userData.originalMaterial ??= mesh.material;
      const original = mesh.userData.originalMaterial;
      if (!id) { mesh.material = original; return; }
      const state = p.id === id ? 'selected' : 'dim';
      const key = original.uuid+state;
      if(!variants.has(key)) {
        const material = original.clone();
        if(state==='selected') { if(material.emissive) { material.emissive.set('#bed8bc');material.emissiveIntensity=.18; } }
        else { material.color.multiplyScalar(.35); if(material.emissive)material.emissiveIntensity=0; }
        variants.set(key,material);
      }
      mesh.material=variants.get(key);
    }));
  }
  let elapsed = 0;
  function update(dt, running) {
    if (running) elapsed += dt;
    const seconds = 10 + elapsed;
    hour.rotation.y = -(10 + 10/60 + seconds/3600)/12*Math.PI*2;
    minute.rotation.y = -(10 + seconds/60)/60*Math.PI*2;
    second.rotation.y = -seconds/60*Math.PI*2;
    wheels.forEach((g,i)=>g.rotation.y=i*.17+elapsed*wheelRates[i]);
    balance.rotation.y=Math.sin(elapsed*Math.PI*4)*1.1;
    hairspring.scale.setScalar(1+Math.sin(elapsed*Math.PI*4)*.045);
    lever.rotation.y=Math.sin(elapsed*Math.PI*4)*.13;
    barrel.rotation.y=-elapsed*.032;
  }
  update(0,false);
  return { root,parts,select,update,get selected(){return selected;},dispose(){r.dispose();ink.dispose();dialSurface.dispose();bridgeInk.dispose();perlageMaterial.dispose();engravingMaterial.dispose();variants.forEach(m=>m.dispose());} };
}
