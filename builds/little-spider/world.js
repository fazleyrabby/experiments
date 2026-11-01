import * as THREE from './vendor/three.module.js';
import {createCoco} from './coco.js';

const $ = s => document.querySelector(s);
const canvas = $('#world');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 700px)').matches;
const TAU = Math.PI * 2;
const SPIDER_SCALE = .65;
const GARDEN_SCALE = 1.12;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
let seed = 5729;
const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const range = (a, b) => a + rand() * (b - a);
const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const settings = {color:'#78746e', fluff:1, night:true, breeze:true, sound:false};
try { const stored=JSON.parse(localStorage.getItem('pip-world') || '{}');if((stored.version||0)<4){stored.color='#78746e';stored.fluff=1;}Object.assign(settings,stored); } catch {}
delete settings.size;
settings.version=4;
function saveSettings(){try {localStorage.setItem('pip-world',JSON.stringify(settings));}catch{}}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
} catch {
  $('#loader').remove(); $('#error').hidden=false; throw new Error('WebGL is unavailable.');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 1.8));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.10;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#101c1b');
scene.fog=new THREE.FogExp2('#101c1b',.036);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,100);
const lookAt=V(0,.6,0);
let zoom=1, cameraAngle=0, cameraAngleTarget=0;
const hemisphere=new THREE.HemisphereLight('#c7e3dd','#5c492a',1.0); scene.add(hemisphere);
const key=new THREE.DirectionalLight('#ffe3b7',3.0); key.position.set(-3,7,6); key.castShadow=true;
key.shadow.mapSize.set(2048,2048); Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:25}); key.shadow.normalBias=.025;key.shadow.bias=-.0002; key.shadow.radius=3;scene.add(key);
const rim=new THREE.DirectionalLight('#bedbd8',3.0);rim.position.set(2,4,-5);scene.add(rim);
const fill=new THREE.PointLight('#eacb94',9,14,2);fill.position.set(1,3,4);scene.add(fill);

// A generated studio environment gives the eyes broad, soft reflections.
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#536264');
for(const [x,y,z,sx,sy,color,intensity] of [[-3,5,4,5,3,'#fff1d1',6],[4,3,2,2,5,'#b8dfe6',3],[-2,1,-4,4,3,'#e5d1ac',2]]){
  const p=new THREE.Mesh(new THREE.PlaneGeometry(sx,sy),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity),side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);envScene.add(p);
}
const pmrem=new THREE.PMREMGenerator(renderer);
const envMap=pmrem.fromScene(envScene,.025).texture;scene.environment=envMap;scene.environmentIntensity=.38;pmrem.dispose();
envScene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});

const sphereGeo=new THREE.SphereGeometry(1,40,28);
const smallSphere=new THREE.SphereGeometry(1,16,12);
const cylinderGeo=new THREE.CylinderGeometry(1,1,1,12,1);
const mat=(color,roughness=.8,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
const mossMat=mat('#42563a');
const woodMat=mat('#574434',.9);
const stemMat=mat('#a39468');
const leafMat=mat('#58764b',.7,{side:THREE.DoubleSide});
const lightLeafMat=mat('#7e9658',.7,{side:THREE.DoubleSide});
const dirtMat=mat('#2e3828',1);
const creamMat=mat('#e4d2a0',.85);
const furUniform={value:settings.fluff};
const coatMats=[];
function ball(parent,material,position,scale,geo=sphereGeo){
  const m=new THREE.Mesh(geo,material);m.position.copy(position);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function connect(mesh,a,b,r1,r2=r1){
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.scale.set(r1,a.distanceTo(b),r2);
  mesh.quaternion.setFromUnitVectors(V(0,1,0),b.clone().sub(a).normalize());
}
function rod(parent,a,b,radius,material){const m=new THREE.Mesh(cylinderGeo,material);connect(m,a,b,radius);m.castShadow=true;parent.add(m);return m;}
function curveTube(parent,points,radius,material,segments=32){const curve=new THREE.CatmullRomCurve3(points);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,7,false),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function makeTexture(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#5b6641';ctx.fillRect(0,0,512,512);
  for(let i=0;i<26000;i++){const x=rand()*512,y=rand()*512,v=range(30,90);ctx.fillStyle=`rgba(${v*.9|0},${v+10|0},${v*.57|0},${range(.1,.4)})`;ctx.beginPath();ctx.ellipse(x,y,range(.4,2.2),range(.5,3),rand()*TAU,0,TAU);ctx.fill();}
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(4,4);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;return tex;
}
const groundTex=makeTexture();mossMat.map=groundTex;mossMat.bumpMap=groundTex;mossMat.bumpScale=.08;
const island=new THREE.Group();scene.add(island);
island.scale.set(GARDEN_SCALE,1,GARDEN_SCALE);
ball(island,dirtMat,V(0,-.47,0),[6.2,.55,3.9]);
ball(island,mossMat,V(0,-.29,0),[6.18,.37,3.88]);
const groundPlane=new THREE.Plane(V(0,1,0),-.05);
const mossPoints=[],mossColors=[];
for(let i=0;i<(mobile?12000:20000);i++){
  const a=rand()*TAU,r=Math.sqrt(rand()),x=Math.cos(a)*r*6.04,z=Math.sin(a)*r*3.78;
  const h=range(.025,.105),y=.055-Math.pow(r,3)*.20;
  const c=new THREE.Color().setHSL(range(.19,.28),range(.18,.4),range(.14,.30));
  const lean=range(-.028,.028);
  mossPoints.push(x-.006,y,z,x+lean,y+h,z+.015,x+.006,y,z);
  for(let j=0;j<3;j++)mossColors.push(c.r,c.g,c.b);
}
const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(mossPoints,3));mg.setAttribute('color',new THREE.Float32BufferAttribute(mossColors,3));mg.computeVertexNormals();
const moss=new THREE.Mesh(mg,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));moss.receiveShadow=true;island.add(moss);

const interactables=[],plants=[],mushrooms=[],flowers=[],webs=[],treats=[],particles=[];
function register(group,type){group.userData.type=type;group.userData.response=0;interactables.push(group);return group;}
function disposeGroup(group){group.traverse(o=>{if(o.geometry&&!['SphereGeometry','CylinderGeometry'].includes(o.geometry.type))o.geometry.dispose();if(o.material&&o.userData.disposeMaterial)o.material.dispose();});}

// Thin folded leaf surfaces, central veins, and stems are all generated geometry.
function leaf(parent,origin,angle,length,width,material=leafMat){
  const g=new THREE.BufferGeometry(),p=[],idx=[];
  for(let i=0;i<=12;i++){
    const t=i/12,spread=Math.pow(Math.sin(t*Math.PI),.8)*width;
    const y=t*length*.44+Math.sin(t*Math.PI)*length*.16;
    p.push(-spread,y-.03*Math.sin(t*Math.PI),t*length,0,y+.035,t*length,spread,y-.03*Math.sin(t*Math.PI),t*length);
    if(i<12){let n=i*3;idx.push(n,n+3,n+1,n+1,n+3,n+4,n+1,n+4,n+2,n+2,n+4,n+5);}
  }
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();
  const group=new THREE.Group();group.position.copy(origin);group.rotation.y=angle;parent.add(group);
  const mesh=new THREE.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  curveTube(group,[V(0,0,0),V(0,length*.32,length*.5),V(0,length*.44,length)],.008,mat('#9aa16a'),12);
  return group;
}
function makePlant(x,z,scale=1){
  const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group);
  for(let i=0;i<7;i++)leaf(group,V(0,.04,0),i*TAU/7+range(-.2,.2),range(.6,1.2),range(.12,.23),i%3?leafMat:lightLeafMat);
  group.userData.phase=rand()*TAU;plants.push(register(group,'plant'));return group;
}
function makeClover(x,z,scale=.75){
  const g=new THREE.Group();g.position.set(x,.05,z);g.scale.setScalar(scale);scene.add(g);
  for(let j=0;j<7;j++){
    const x=range(-.35,.35),z=range(-.35,.35),h=range(.22,.65);
    curveTube(g,[V(x,0,z),V(x+.07,h*.6,z),V(x,h,z)],.009,leafMat,7);
    for(let i=0;i<3;i++){
      const a=i*TAU/3;const l=ball(g,i%2?leafMat:lightLeafMat,V(x+Math.sin(a)*.10,h,z+Math.cos(a)*.1),[.115,.025,.15],smallSphere);l.rotation.y=a;
    }
  }
  g.userData.phase=rand()*TAU;plants.push(register(g,'plant'));return g;
}
const mushroomColors=['#b47a5a','#c8986c','#9c5a44'];
function makeMushroom(x,z,size=1){
  const group=new THREE.Group();group.position.set(x,0,z);group.scale.setScalar(size);scene.add(group);
  const h=range(.55,.9),r=range(.35,.55);
  const stem=ball(group,stemMat,V(0,h*.45,0),[.1,h*.55,.11]);stem.rotation.z=range(-.12,.12);
  const capMat=mat(mushroomColors[Math.floor(rand()*mushroomColors.length)],.75);
  const cap=ball(group,capMat,V(0,h,0),[r,r*.50,r]);
  const under=ball(group,creamMat,V(0,h-.025,0),[r*.94,.035,r*.94]);
  for(let i=0;i<18;i++){
    const a=rand()*TAU,rr=Math.sqrt(rand())*.87,y=Math.sqrt(1-rr*rr)*r*.50;
    const dot=ball(group,creamMat,V(Math.cos(a)*rr*r,h+y,Math.sin(a)*rr*r),[range(.02,.05),.008,range(.02,.05)],smallSphere);
    dot.quaternion.setFromUnitVectors(V(0,1,0),V(dot.position.x/r,y/(r*.5)*1.3,(dot.position.z)/r).normalize());
  }
  for(let i=0;i<22;i++){
    const a=i/22*TAU;
    rod(group,V(Math.cos(a)*r*.22,h-.04,Math.sin(a)*r*.22),V(Math.cos(a)*r*.87,h-.04,Math.sin(a)*r*.87),.004,stemMat);
  }
  group.userData.phase=rand()*TAU;mushrooms.push(register(group,'mushroom'));return group;
}
function makeFlower(x,z,size=.8){
  const g=new THREE.Group();g.position.set(x,.03,z);g.scale.setScalar(size);scene.add(g);
  const petalMat=mat(['#d4a491','#d8c89c','#c2bbd0'][Math.floor(rand()*3)],.8,{side:THREE.DoubleSide});
  for(let j=0;j<3;j++){
    const xx=range(-.3,.3),zz=range(-.3,.3),h=range(.5,.9);
    curveTube(g,[V(xx,0,zz),V(xx+.08,h*.5,zz),V(xx,h,zz)],.013,leafMat,8);
    for(let i=0;i<7;i++){const a=i/7*TAU;const p=ball(g,petalMat,V(xx+Math.sin(a)*.11,h,zz+Math.cos(a)*.11),[.06,.023,.14],smallSphere);p.rotation.y=a;p.rotation.x=.2;}
    ball(g,mat('#c6a25b'),V(xx,h+.018,zz),[.065,.035,.065],smallSphere);
    leaf(g,V(xx,h*.3,zz),range(0,TAU),.25,.06);
  }
  g.userData.phase=rand()*TAU;flowers.push(register(g,'flower'));return g;
}

makePlant(-4.15,-.55,1.25);makePlant(4.1,-1.6,1.3);makePlant(-2.9,-2.5,.9);makePlant(4.8,.8,.85);
makeClover(-3.6,1.2,1);makeClover(2.5,-2,.9);makeClover(2.5,2,.55);makeClover(-1.5,2.5,.55);
makeMushroom(3.1,.1,1.3);makeMushroom(3.85,.65,.75);makeMushroom(2.65,-.35,.55);
makeMushroom(-3.25,-1.45,.8);makeMushroom(-3.7,-1.15,.48);
makeFlower(-3.4,.1,.8);makeFlower(3.6,-1.65,.7);
for(let i=0;i<32;i++){
 const a=rand()*TAU,r=range(.82,1),x=Math.cos(a)*r*5.8,z=Math.sin(a)*r*3.5;
 const stone=ball(scene,mat(new THREE.Color().setHSL(.15,.08,range(.17,.27)),.94),V(x,range(-.03,.06),z),[range(.08,.30),range(.07,.18),range(.1,.24)],smallSphere);stone.rotation.set(rand(),rand(),rand());
}

// A low branch frames the world; the open center remains a walkable playground.
const branch=new THREE.Group();scene.add(branch);
curveTube(branch,[V(-5,-.1,-1.6),V(-4.2,1.3,-1.9),V(-3.8,2.7,-2.2),V(-2.7,3.5,-2.3),V(-1.3,3.6,-2.5),V(.15,3.4,-2.65)],.11,woodMat,50);
curveTube(branch,[V(-3.8,2.5,-2.2),V(-4.3,3.1,-2.3),V(-4.6,3.65,-2.3)],.055,woodMat);
curveTube(branch,[V(-2.7,3.5,-2.3),V(-2.8,4.2,-2.25),V(-3.05,4.55,-2.3)],.044,woodMat);
curveTube(branch,[V(-1.7,3.6,-2.5),V(-1.3,4.1,-2.5),V(-.7,4.25,-2.5)],.045,woodMat);
for(let i=0;i<7;i++)leaf(branch,V(-3.05+i*.43,3.5+Math.sin(i)*.1,-2.4),i%2?.25:2.3,.5,.12,lightLeafMat);
register(branch,'branch');
const silkMaterial=new THREE.LineBasicMaterial({color:'#d7e6d9',transparent:true,opacity:.33,depthWrite:false});
const starterWeb=new THREE.Group();scene.add(starterWeb);
function webGeometry(center,radius,spokes=12,tilt=.6){
  const pos=[];
  const point=(a,r)=>V(center.x+Math.cos(a)*r,center.y+Math.sin(a)*r*tilt,center.z+Math.sin(a)*r*(1-tilt));
  for(let i=0;i<spokes;i++){const a=i/spokes*TAU;const p=point(a,radius);pos.push(center.x,center.y,center.z,p.x,p.y,p.z);}
  for(let ring=1;ring<=7;ring++)for(let i=0;i<spokes;i++){
    const a=i/spokes*TAU,b=(i+1)/spokes*TAU,r=radius*ring/7;
    const p=point(a,r),q=point(b,r),mid=point((a+b)/2,r*.95);
    pos.push(p.x,p.y,p.z,mid.x,mid.y,mid.z,mid.x,mid.y,mid.z,q.x,q.y,q.z);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));return g;
}
const starter=new THREE.LineSegments(webGeometry(V(-2.55,2.8,-2.3),.9,11,.85),silkMaterial);starterWeb.add(starter);

// Fur is individual tapered geometry. Surface roots stay fixed while the fluff slider
// moves each tip in the shader, so changing the coat never rebuilds the character.
function furMaterial(base){
  const m=mat(base,.88,{vertexColors:true,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{s.uniforms.uFluff=furUniform;s.vertexShader='attribute vec3 furOffset; uniform float uFluff;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += furOffset * uFluff;');};
  m.customProgramCacheKey=()=> 'pip-fur-1';coatMats.push(m);return m;
}
function furryEllipsoid(parent,position,scale,count,base,kind='head'){
  const g=new THREE.Group();g.position.copy(position);g.scale.set(...scale);parent.add(g);
  const skin=mat(base,.9);coatMats.push(skin);ball(g,skin,V(),[1,1,1]);
  const roots=[],offsets=[],normals=[],colors=[];
  const up=V(0,1,0);
  for(let i=0;i<count;i++){
    const y=range(-1,1),a=rand()*TAU,r=Math.sqrt(1-y*y),n=V(Math.cos(a)*r,y,Math.sin(a)*r);
    const root=n.clone().multiplyScalar(.99);
    const tangent=V().crossVectors(Math.abs(y)>.95?V(1,0,0):up,n).normalize();
    const bitangent=V().crossVectors(n,tangent).normalize();
    let len=range(.075,.23);
    if(rand()<.09)len*=1.5;
    if(kind==='head'&&n.z>.35)len*=.52;
    if(kind==='leg')len=range(.23,.62);
    const curl=range(-.45,.45);
    const tip=n.clone().multiplyScalar(len).addScaledVector(tangent,len*curl).addScaledVector(bitangent,-len*.2);
    const middle=tip.clone().multiplyScalar(.5).addScaledVector(bitangent,len*.13);
    const w=kind==='leg'?range(.004,.009):range(.0009,.0026);
    let shade=range(.55,1.30);
    if(kind==='body')shade*=.70+.30*Math.sin(n.z*12+1.2);
    if(kind==='leg')shade*=.84+.16*Math.cos(n.y*12);
    const c=new THREE.Color(shade,shade*.97,shade*.91);
    const verts=[tangent.clone().multiplyScalar(-w),tangent.clone().multiplyScalar(w),middle.clone().addScaledVector(tangent,w*.52),tangent.clone().multiplyScalar(-w),middle.clone().addScaledVector(tangent,w*.52),middle.clone().addScaledVector(tangent,-w*.52),middle.clone().addScaledVector(tangent,-w*.52),middle.clone().addScaledVector(tangent,w*.52),tip];
    for(const o of verts){roots.push(root.x,root.y,root.z);offsets.push(o.x,o.y,o.z);normals.push(n.x,n.y,n.z);colors.push(c.r,c.g,c.b);}
  }
  const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(roots,3));fg.setAttribute('furOffset',new THREE.Float32BufferAttribute(offsets,3));fg.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));fg.boundingSphere=new THREE.Sphere(V(),1.4);
  const f=new THREE.Mesh(fg,furMaterial(base));g.add(f);
  // A second coat of curved, softly translucent guard hairs gives the silhouette
  // its downy fringe and the cheeks their longer, pale whiskers.
  const hp=[],hc=[],ho=[];
  const guardCount=kind==='leg'?Math.floor(count*.48):Math.floor(count*.40);
  for(let i=0;i<guardCount;i++){
    const yy=range(-1,1),aa=rand()*TAU,rr=Math.sqrt(1-yy*yy),n=V(Math.cos(aa)*rr,yy,Math.sin(aa)*rr);
    const root=n.clone().multiplyScalar(1.005),tangent=V().crossVectors(Math.abs(yy)>.96?V(1,0,0):V(0,1,0),n).normalize();
    let length=range(.09,.24);
    if(kind==='head'&&n.z>.55)length=yy<-.12?range(.15,.32):range(.025,.08);
    if(kind==='leg')length=range(.32,.70);
    const tip=n.clone().multiplyScalar(length).addScaledVector(tangent,range(-.07,.07));tip.y-=length*.20;
    if(kind==='head'&&n.z>.45&&yy<.08){tip.multiplyScalar(.50);tip.x+=Math.sign(n.x)*length*range(.42,.80);tip.y-=length*range(.32,.62);}
    if(kind==='leg'){tip.y-=length*range(.08,.32);tip.x+=Math.sign(n.x)*length*.16;}
    const mid=tip.clone().multiplyScalar(.5);mid.y+=length*.12;
    const shade=range(.7,1.25)*(kind==='body'?.62+.38*Math.sin(n.z*12+1.2):1);
    for(const [offset,factor] of [[V(),.48],[mid,1.15],[mid,1.15],[tip,1.65]]){
      hp.push(root.x,root.y,root.z);ho.push(offset.x,offset.y,offset.z);hc.push(shade*factor,shade*factor*.98,shade*factor*.91);
    }
  }
  const hg=new THREE.BufferGeometry();hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));hg.setAttribute('furOffset',new THREE.Float32BufferAttribute(ho,3));hg.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));hg.boundingSphere=new THREE.Sphere(V(),1.8);
  const hm=new THREE.LineBasicMaterial({color:base,vertexColors:true,transparent:true,opacity:kind==='leg'?.43:.36,depthWrite:false});
  hm.onBeforeCompile=s=>{s.uniforms.uFluff=furUniform;s.vertexShader='attribute vec3 furOffset; uniform float uFluff;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += furOffset * uFluff;');};hm.customProgramCacheKey=()=> 'pip-guard-fur';coatMats.push(hm);
  g.add(new THREE.LineSegments(hg,hm));g.userData.skin=skin;return g;
}
const spider=new THREE.Group();spider.position.set(.0,0,.65);scene.add(spider);
const torso=new THREE.Group();spider.add(torso);
const abdomen=furryEllipsoid(torso,V(0,.76,-.54),[.65,.46,.69],mobile?14000:22000,'#69655e','body');
const head=furryEllipsoid(torso,V(0,.72,.42),[.85,.65,.64],mobile?16000:24000,'#78746e');
// The face has two large forward eyes and two small secondary eyes, no fangs.
const eyes=[];
const eyeMat=new THREE.MeshPhysicalMaterial({color:'#060c0b',roughness:.055,metalness:.02,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:2.3});
const eyeRimMat=mat('#8e633e',.55);
for(const side of [-1,1]){
  const eyeRoot=new THREE.Group();eyeRoot.position.set(side*.405,.22,.87);head.add(eyeRoot);
  ball(eyeRoot,eyeRimMat,V(),[.377,.565,.262]);
  const eye=ball(eyeRoot,eyeMat,V(0,.0,.05),[.340,.530,.263]);
  const glintMat=new THREE.MeshBasicMaterial({color:'#fff4db'});
  ball(eyeRoot,glintMat,V(-.085,.205,.278),[.065,.083,.016],smallSphere);
  ball(eyeRoot,new THREE.MeshBasicMaterial({color:'#b2d3c8'}),V(.10,-.150,.288),[.024,.029,.012],smallSphere);
  eyes.push(eyeRoot);
  ball(head,eyeRimMat,V(side*.84,.23,.51),[.125,.14,.12]);
  ball(head,eyeMat,V(side*.84,.23,.55),[.095,.109,.10]);
  ball(head,glintMat,V(side*.84-.023,.27,.638),[.02,.023,.01],smallSphere);
  const cheek=ball(head,mat('#bc8178',.95,{transparent:true,opacity:.25}),V(side*.64,-.30,.74),[.13,.085,.025],smallSphere);cheek.rotation.y=side*.37;
}
const palps=[];
for(const side of [-1,1])palps.push(furryEllipsoid(torso,V(side*.25,.43,1.0),[.20,.21,.23],mobile?1500:2300,'#a1927d','leg'));
const smile=curveTube(head,[V(-.09,-.36,.947),V(0,-.40,.951),V(.09,-.36,.947)],.012,mat('#453c30'),12);
const legs=[];
for(const side of [-1,1])for(let i=0;i<4;i++){
  const hip=V(side*.49,.62,.48-i*.31);
  const home=V(side*(.98+Math.sin(i/3*Math.PI)*.27),.07,.98-i*.60);
  const upper=furryEllipsoid(spider,V(),[.145,.3,.145],mobile?1100:1800,'#8d7d65','leg');
  const lower=furryEllipsoid(spider,V(),[.12,.3,.12],mobile?1100:1800,'#a1927c','leg');
  const joint=ball(spider,mat('#8d7d65'),V(),[.14,.14,.14],smallSphere);coatMats.push(joint.material);
  legs.push({side,i,hip,home,foot:home.clone(),start:home.clone(),goal:home.clone(),phase:((i+(side>0?1:0))%2)*Math.PI,upper,lower,joint});
}
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.8,3.2),new THREE.ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.09;shadow.receiveShadow=true;scene.add(shadow);
// Soft contact shadow is procedural canvas, independent of real-time shadow resolution.
const sc=document.createElement('canvas');sc.width=sc.height=128;const sctx=sc.getContext('2d');const sg=sctx.createRadialGradient(64,64,8,64,64,64);sg.addColorStop(0,'rgba(6,12,7,.42)');sg.addColorStop(.5,'rgba(6,12,7,.2)');sg.addColorStop(1,'rgba(6,12,7,0)');sctx.fillStyle=sg;sctx.fillRect(0,0,128,128);
const contact=new THREE.Mesh(new THREE.PlaneGeometry(3.5,3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sc),transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.11;scene.add(contact);
const coco=createCoco({scene,contactTexture:contact.material.map,reducedMotion});
register(coco.root,'crab');
const cocoPip={x:spider.position.x,z:spider.position.z,heading:0,speed:0};

// Small drifting fireflies and motes, with no downloaded image assets.
const gc=document.createElement('canvas');gc.width=gc.height=64;const gctx=gc.getContext('2d');const gg=gctx.createRadialGradient(32,32,0,32,32,32);gg.addColorStop(0,'rgba(255,244,183,1)');gg.addColorStop(.1,'rgba(241,233,156,.9)');gg.addColorStop(.28,'rgba(218,228,142,.25)');gg.addColorStop(1,'rgba(202,224,147,0)');gctx.fillStyle=gg;gctx.fillRect(0,0,64,64);const glowTex=new THREE.CanvasTexture(gc);
const fireflies=[];
for(let i=0;i<28;i++){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(range(-7,7),range(.4,5.4),range(-5,3));const s=range(.055,.14);sprite.scale.set(s,s,s);scene.add(sprite);fireflies.push({sprite,origin:sprite.position.clone(),phase:rand()*TAU,speed:range(.3,.8)});
}
const motePos=[];for(let i=0;i<110;i++)motePos.push(range(-8,8),range(.3,7),range(-7,4));
const moteGeo=new THREE.BufferGeometry();moteGeo.setAttribute('position',new THREE.Float32BufferAttribute(motePos,3));const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:'#bfc9a8',size:.018,transparent:true,opacity:.32,depthWrite:false}));scene.add(motes);

let mode='wander',plantType='mushroom',time=0,last=performance.now(),target=spider.position.clone(),heading=0,headingTarget=0,gait=0,speed=0,hop=0,pet=0,nextBlink=3,blink=0,bubbleUntil=0,idleTime=0,cocoGreeting=0;
let pointer=new THREE.Vector2(),pointerWorld=V(0,1,3),pointerActive=false,pressed=null,orbiting=false,webAnchor=null,webPreview=null;
const raycaster=new THREE.Raycaster();const pointerPosition=new THREE.Vector2();
const mood=$('#mood'),bubble=$('#bubble');
let moodUntil=0,toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);$('#announcements').textContent=message;}
function say(message,duration=2.8){bubble.textContent=message;bubbleUntil=time+duration;bubble.classList.add('visible');}
function setMood(message,seconds=5){mood.textContent=message;moodUntil=time+seconds;}
function setMode(next){
  if(next==='style'&&mode==='style')next='wander';
  if(next==='garden'&&mode==='garden'){
    if($('#garden-panel').hidden){$('#garden-panel').hidden=false;$('[data-mode="garden"]').setAttribute('aria-expanded','true');return;}
    next='wander';
  }
  mode=next;
  document.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));if(b.hasAttribute('aria-expanded'))b.setAttribute('aria-expanded',String(on));});
  $('#style-panel').hidden=mode!=='style';$('#garden-panel').hidden=mode!=='garden';
  $('#hint-text').textContent=({wander:'Click anywhere. Pip will follow.',web:webAnchor?'One more click to weave a little magic.':'Click two spots to weave a web.',treat:'Click to leave Pip a little berry.',garden:'Click the moss to plant something lovely.',style:'Make your tiny friend feel like you.'})[mode];
  canvas.style.cursor=mode==='web'?'crosshair':mode==='treat'||mode==='garden'?'copy':'default';
  if(mode!=='web')clearAnchor();
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{setMode(b.dataset.mode);chime(440,.04);}));
document.querySelectorAll('.close-panel').forEach(b=>b.addEventListener('click',()=>setMode('wander')));
function setCoat(hex){
  settings.color=hex;const c=new THREE.Color(hex);
  coatMats.forEach((m,i)=>{m.color.copy(c);if(i<2)m.color.multiplyScalar(.84);});
  document.querySelectorAll('.swatch').forEach(b=>{const yes=b.dataset.color===hex;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));});
  $('#custom-color').value=hex;saveSettings();
}
document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{setCoat(b.dataset.color);pet=1;say('looking fluffy!');chime(660,.07);}));
$('#custom-color').addEventListener('input',e=>setCoat(e.target.value));
$('#fluff').value=settings.fluff;
$('#fluff-value').textContent=settings.fluff<.8?'Velvety':settings.fluff>1.25?'Cloud level':'Just right';
$('#fluff').addEventListener('input',e=>{settings.fluff=Number(e.target.value);furUniform.value=settings.fluff;$('#fluff-value').textContent=settings.fluff<.8?'Velvety':settings.fluff>1.25?'Cloud level':'Just right';saveSettings();});
document.querySelectorAll('[data-plant]').forEach(b=>b.addEventListener('click',()=>{plantType=b.dataset.plant;document.querySelectorAll('[data-plant]').forEach(p=>{p.classList.toggle('selected',p===b);p.setAttribute('aria-pressed',String(p===b));});$('#garden-panel').hidden=true;$('[data-mode="garden"]').setAttribute('aria-expanded','false');canvas.focus();}));
$('#breeze').addEventListener('click',()=>{settings.breeze=!settings.breeze;$('#breeze').setAttribute('aria-pressed',String(settings.breeze));$('#breeze .toggle').classList.toggle('on',settings.breeze);saveSettings();});
function updateDay(){
  $('#day use').setAttribute('href',settings.night?'#i-moon':'#i-sun');$('#day').setAttribute('aria-label',settings.night?'Switch to daylight':'Switch to moonlight');
  document.documentElement.style.setProperty('--muted',settings.night?'#b5b9a7':'#d2d6ba');
}
$('#day').addEventListener('click',()=>{settings.night=!settings.night;updateDay();toast(settings.night?'Good evening, little world.':'A little golden afternoon.');saveSettings();});

// Sound is synthesized after a user gesture; it never fetches an audio file.
let audio=null,ambient=null,ambientGain=null;
function initAudio(){
  if(audio){audio.resume();return;}
  audio=new AudioContext();ambientGain=audio.createGain();ambientGain.gain.value=0;ambientGain.connect(audio.destination);
  const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),data=buffer.getChannelData(0);let value=0;
  for(let i=0;i<data.length;i++){value=(value+(Math.random()*2-1)*.015)/1.015;data[i]=value;}
  ambient=audio.createBufferSource();ambient.buffer=buffer;ambient.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;ambient.connect(filter).connect(ambientGain);ambient.start();
}
function chime(freq=600,duration=.13){
  if(!settings.sound||!audio)return;
  const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.8,audio.currentTime+duration);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
}
function updateSound(){const active=settings.sound&&!!audio;$('#sound use').setAttribute('href',active?'#i-sound':'#i-mute');$('#sound').setAttribute('aria-label',active?'Turn garden sound off':'Turn garden sound on');if(ambientGain)ambientGain.gain.setTargetAtTime(active?.22:0,audio.currentTime,.4);}
$('#sound').addEventListener('click',()=>{initAudio();settings.sound=!settings.sound;updateSound();chime(640,.2);saveSettings();});
// A remembered enabled preference still waits for a gesture before starting sound.
canvas.addEventListener('pointerdown',()=>{if(settings.sound){initAudio();updateSound();}},{once:true});

function worldPoint(clientX,clientY){const rect=canvas.getBoundingClientRect();pointerPosition.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointerPosition,camera);const p=V();if(!raycaster.ray.intersectPlane(groundPlane,p))return null;return p;}
function isOnIsland(p){return (p.x/(5.65*GARDEN_SCALE))**2+(p.z/(3.35*GARDEN_SCALE))**2<1;}
function clampIsland(p,margin=1){const r=Math.sqrt((p.x/(5.2*GARDEN_SCALE*margin))**2+(p.z/(3.0*GARDEN_SCALE*margin))**2);if(r>1){p.x/=r;p.z/=r;}p.y=0;return p;}
function walkTo(p){target.copy(clampIsland(p));setMood('Pip is feeling curious');ringAt(p);chime(520,.07);}
const ringMat=new THREE.MeshBasicMaterial({color:'#dce5b3',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
const destinationRing=new THREE.Mesh(new THREE.RingGeometry(.115,.13,40),ringMat);destinationRing.rotation.x=-Math.PI/2;destinationRing.position.y=.14;scene.add(destinationRing);let ringAge=99;
function ringAt(p){destinationRing.position.set(p.x,.14,p.z);ringAge=0;}
function clearAnchor(){webAnchor=null;if(webPreview){scene.remove(webPreview);webPreview.geometry.dispose();webPreview=null;}}
function addWeb(a,b){
  if(webs.length>=18){const oldest=webs.shift();scene.remove(oldest);oldest.traverse(o=>{o.geometry?.dispose();if(o.material!==silkMaterial)o.material?.dispose();});}
  const center=a.clone().add(b).multiplyScalar(.5),distance=a.distanceTo(b),radius=clamp(distance*.44,.35,1.45);center.y=.45+radius*.2;
  const group=new THREE.Group();scene.add(group);
  const wm=silkMaterial.clone();wm.opacity=.62;const web=new THREE.LineSegments(webGeometry(center,radius,12,.72),wm);group.add(web);
  const anchors=new THREE.BufferGeometry().setFromPoints([V(a.x,.10,a.z),center,V(b.x,.10,b.z)]);group.add(new THREE.Line(anchors,wm));
  for(let i=0;i<14;i++){
    const angle=rand()*TAU,r=range(.25,.95)*radius;
    const dew=ball(group,new THREE.MeshPhysicalMaterial({color:'#d1e6dd',roughness:.05,transmission:0,transparent:true,opacity:.72,metalness:.15}),V(center.x+Math.cos(angle)*r,center.y+Math.sin(angle)*r*.72,center.z+Math.sin(angle)*r*.28),[.014,.018,.014],smallSphere);dew.castShadow=false;
  }
  group.userData.birth=time;webs.push(group);setMood('Pip made something lovely');say('made it just for you');chime(860,.2);walkTo(b.clone());
}
function clearWebs(){webs.forEach(w=>{scene.remove(w);w.traverse(o=>{o.geometry?.dispose();if(o.material!==silkMaterial)o.material?.dispose();});});webs.length=0;clearAnchor();}
function berryAt(p){
  if(treats.length>=10){toast('Pip has plenty of berries to find.');return;}
  const g=new THREE.Group();g.position.set(p.x,.24,p.z);scene.add(g);
  const bm=mat('#a84f58',.42);ball(g,bm,V(),[.14,.17,.14],smallSphere);ball(g,bm,V(.07,.01,.02),[.10,.13,.11],smallSphere);
  for(let i=0;i<5;i++)leaf(g,V(0,.12,0),i*TAU/5,.11,.028,leafMat);
  for(let i=0;i<12;i++){const a=rand()*TAU,y=range(-.1,.11);ball(g,creamMat,V(Math.cos(a)*.125,y,Math.sin(a)*.125),[.009,.014,.009],smallSphere);}
  g.userData.birth=time;treats.push(g);target.copy(clampIsland(p.clone()));setMood('Pip spotted a little treat');say('for me?');ringAt(p);chime(780,.08);
}
function puffAt(pos,color='#d9cbb1',amount=12){
  for(let i=0;i<amount;i++){
    const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,depthWrite:false}));m.position.copy(pos);m.scale.setScalar(range(.07,.14));scene.add(m);particles.push({mesh:m,velocity:V(range(-.5,.5),range(.4,1),range(-.5,.5)),life:1.4,max:1.4});
  }
}
function petPip(){pet=1;hop=.02;setMood('Pip feels very loved');say(['oh, hello!','you’re my favorite','that tickles!','a little hug?'][Math.floor(rand()*4)]);puffAt(spider.position.clone().add(V(0,1.7,.2)),'#e4a4a1',9);chime(700,.16);}
function hitInteractive(){
  const hits=raycaster.intersectObjects(interactables,true);
  if(!hits.length)return null;
  let o=hits[0].object;while(o.parent&&!o.userData.type)o=o.parent;
  return o.userData.type?o:null;
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button===2||e.altKey){orbiting=true;pressed={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);return;}
  pressed={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  const p=worldPoint(e.clientX,e.clientY);pointer.set(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);pointerActive=true;if(p)pointerWorld.copy(p).setY(1.1);
  if(orbiting&&pressed){cameraAngleTarget+=(e.clientX-pressed.x)*.005;cameraAngleTarget=clamp(cameraAngleTarget,-.65,.65);pressed={x:e.clientX,y:e.clientY};}
  if(mode==='web'&&webAnchor&&p&&webPreview){webPreview.geometry.setFromPoints([webAnchor,V(p.x,.10,p.z)]);}
  if(mode==='wander'&&!pressed){const hits=raycaster.intersectObject(spider,true);canvas.style.cursor=hits.length||hitInteractive()?'pointer':'default';}
});
canvas.addEventListener('pointerup',e=>{
  if(orbiting){orbiting=false;pressed=null;return;}
  const start=pressed;pressed=null;if(!start||Math.hypot(start.x-e.clientX,start.y-e.clientY)>12)return;
  const p=worldPoint(e.clientX,e.clientY);if(!p)return;
  if(mode==='wander'||mode==='style'){
    const spiderHits=raycaster.intersectObject(spider,true);
    if(spiderHits.length){petPip();return;}
    const thing=hitInteractive();
    if(thing?.userData.type==='crab'){coco.greet();cocoGreeting=1.8;setMood('Coco gives Pip a little wave');say('hi, Coco!',2);chime(760,.12);return;}
    if(thing){thing.userData.response=1;if(thing.userData.type==='mushroom'){puffAt(thing.position.clone().add(V(0,.8,0)),'#e4c391',15);say('boing!');chime(360,.18);}else{puffAt(thing.position.clone().add(V(0,.5,0)),'#b9d38d',8);chime(900,.1);}return;}
    if(isOnIsland(p)){walkTo(p);if(mode==='style')setMode('wander');}else{setMood('The moss is Pip’s happy place');toast('Click the moss to explore.');}
  }else if(mode==='web'){
    if(!isOnIsland(p)){toast('Pick two spots inside the garden.');return;}
    if(!webAnchor){webAnchor=V(p.x,.10,p.z);webPreview=new THREE.Line(new THREE.BufferGeometry().setFromPoints([webAnchor,webAnchor]),silkMaterial);scene.add(webPreview);ringAt(p);$('#hint-text').textContent='One more click to weave a little magic.';chime(620,.1);}
    else if(webAnchor.distanceTo(p)<.35){toast('Choose a second spot a little farther away.');}
    else{addWeb(webAnchor,p);clearAnchor();$('#hint-text').textContent='Click two spots to weave another web.';}
  }else if(mode==='treat'){
    if(isOnIsland(p))berryAt(p);else toast('Leave the berry on the moss for Pip.');
  }else if(mode==='garden'){
    if(!isOnIsland(p)){toast('Little things grow best on the moss.');return;}
    if(userPlants.length>=35){toast('The garden is full of little wonders. Start fresh to grow a new one.');return;}
    if(p.distanceTo(spider.position)<1||Math.hypot(p.x-coco.root.position.x,p.z-coco.root.position.z)<.75){toast('Give the little friends some room to wiggle.');return;}
    const object=plantType==='mushroom'?makeMushroom(p.x,p.z,range(.5,.85)):plantType==='flower'?makeFlower(p.x,p.z,.7):makeClover(p.x,p.z,.7);object.userData.grow=0;userPlants.push(object);puffAt(p,'#c7d99e',12);chime(750,.14);setMood('Pip likes your gardening');
  }
});
canvas.addEventListener('pointercancel',()=>{pressed=null;orbiting=false;});
canvas.addEventListener('pointerleave',()=>{pointerActive=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.0005,.75,1.3);},{passive:false});
const userPlants=[];
function doHop(){if(hop<=.01){hop=1;cocoPip.x=spider.position.x;cocoPip.z=spider.position.z;coco.startle(cocoPip);setMood('A little jump for joy');say('wheee!',1.6);chime(880,.15);}}
function reset(){
  clearWebs();treats.forEach(g=>{scene.remove(g);disposeGroup(g);});treats.length=0;
  userPlants.forEach(g=>{scene.remove(g);for(const arr of [interactables,plants,mushrooms,flowers]){const i=arr.indexOf(g);if(i>=0)arr.splice(i,1);}disposeGroup(g);});userPlants.length=0;
  target.set(0,0,.65);spider.position.copy(target);heading=0;headingTarget=0;speed=0;cameraAngleTarget=0;zoom=1;setMode('wander');setMood('Pip is happy to see you');toast('A fresh little beginning.');
  coco.reset();cocoGreeting=0;
}
$('#reset').addEventListener('click',reset);
window.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select')||e.metaKey||e.ctrlKey||e.altKey)return;
  const k=e.key.toLowerCase();const modes={v:'wander',t:'treat',g:'garden',c:'style'};
  if(modes[k]){e.preventDefault();setMode(modes[k]);}
  if(k==='escape'){setMode('wander');clearAnchor();}
  if(k===' '){e.preventDefault();doHop();}
  if(k==='r')reset();
  if(k.startsWith('arrow')){e.preventDefault();const p=target.clone();if(k==='arrowleft')p.x-=.5;if(k==='arrowright')p.x+=.5;if(k==='arrowup')p.z-=.5;if(k==='arrowdown')p.z+=.5;walkTo(p);}
});
$('#photo').addEventListener('click',()=>{renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob){toast('Couldn’t save that picture. Try again.');return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='pips-little-world.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('A little moment, saved.');},'image/png');});

function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}window.addEventListener('resize',resize);resize();
function updateCamera(dt){
  cameraAngle=lerp(cameraAngle,cameraAngleTarget,Math.min(1,dt*4));
  const portrait=camera.aspect<.8,dist=portrait?12.5:11.8;
  camera.fov=portrait?48:42;camera.updateProjectionMatrix();
  const parallax=reducedMotion?0:.16;
  const cp=V(Math.sin(cameraAngle)*dist+pointer.x*parallax,(portrait?6.8:5.8)*zoom,Math.cos(cameraAngle)*dist*zoom);
  camera.position.lerp(cp,Math.min(1,dt*3));camera.lookAt(lookAt);
}
camera.position.set(0,5.8,11.8);camera.lookAt(lookAt);
let lastStep=0,nightBlend=settings.night?1:0;
const nightColor=new THREE.Color('#101c1b'),dayColor=new THREE.Color('#465346');
const qtemp=new THREE.Quaternion(),tmp=V();
function updateSpider(dt){
  const delta=target.clone().sub(spider.position);delta.y=0;const distance=delta.length();
  const desired=distance>.06?Math.min(2.2,distance*3):0;speed=lerp(speed,desired,Math.min(dt*5,1));
  if(distance>.04){idleTime=0;headingTarget=Math.atan2(delta.x,delta.z);const step=Math.min(distance,speed*dt);spider.position.addScaledVector(delta.normalize(),step);}
  else {idleTime+=dt;if(idleTime>1.2&&speed<.03)headingTarget=0;}
  const diff=Math.atan2(Math.sin(headingTarget-heading),Math.cos(headingTarget-heading));heading+=diff*Math.min(1,dt*7);spider.rotation.y=heading;
  gait+=speed*dt*7.5;const moving=clamp(speed/1.5,0,1);
  hop=Math.max(0,hop-dt*1.7);const jump=Math.sin(hop*Math.PI)*.85;
  pet=Math.max(0,pet-dt*.8);
  cocoGreeting=Math.max(0,cocoGreeting-dt);
  torso.position.y=(!reducedMotion?Math.sin(time*2.4)*.025+Math.sin(gait*2)*moving*.025:0)+jump;
  torso.rotation.z=Math.sin(gait)*moving*.035+Math.sin(time*14)*pet*.04;
  torso.rotation.x=-moving*.04;
  abdomen.rotation.x=Math.sin(time*2.4)*.025;abdomen.scale.y=.46*(1+Math.sin(time*2.4)*.025);
  if(time>nextBlink){blink=.18;nextBlink=time+range(2.8,6.5);}
  blink=Math.max(0,blink-dt);const blinkScale=blink>0?Math.max(.08,Math.abs(blink-.09)/.09):1;
  eyes.forEach(e=>{e.scale.y=blinkScale;e.rotation.y=clamp(pointer.x*.08,-.1,.1);});
  const headTurn=pointerActive?clamp((pointerWorld.x-spider.position.x)*.025,-.13,.13):cocoGreeting>0?-.12:0;
  head.rotation.y=lerp(head.rotation.y,headTurn,dt*4);head.rotation.z=Math.sin(time*1.1)*.025+pet*.09;
  palps.forEach((p,i)=>{p.rotation.x=Math.sin(time*5+i)*.06+pet*Math.sin(time*16)*.2;});
  spider.scale.setScalar(SPIDER_SCALE);
  legs.forEach(l=>{
    const phase=gait+l.phase;
    const swing=Math.max(0,Math.sin(phase));
    const stride=Math.cos(phase)*.26*moving;
    const foot=l.home.clone();foot.z+=stride;foot.y+=swing*.22*moving+jump*.25;
    if(pet>0&&l.i===0){foot.y+=pet*.20;foot.x+=l.side*pet*.06;}
    if(cocoGreeting>0&&l.i===0&&l.side===-1){foot.y+=Math.sin(cocoGreeting/1.8*Math.PI)*.22;foot.x-=.08*Math.sin(time*10)*Math.sin(cocoGreeting/1.8*Math.PI);}
    const hip=l.hip.clone();hip.y+=torso.position.y*.75;
    const knee=V(l.side*(.91+Math.sin(l.i/3*Math.PI)*.15),.49+Math.sin(l.i)*.065,lerp(hip.z,foot.z,.58));knee.y+=jump*.75+swing*moving*.04;
    connect(l.upper,hip,knee,.145,.145);
    // Furry limbs are unit ellipsoids, so their long axis is half their length.
    l.upper.scale.y*=.57;
    connect(l.lower,knee,foot,.12,.12);l.lower.scale.y*=.57;
    l.joint.position.copy(knee);
  });
  contact.position.set(spider.position.x,.11,spider.position.z);contact.scale.setScalar(SPIDER_SCALE*(1-jump*.10));contact.material.opacity=1-jump*.5;
  shadow.position.set(spider.position.x,.09,spider.position.z);
  for(let i=treats.length-1;i>=0;i--){const g=treats[i];g.rotation.y=time*.2;g.position.y=.20+Math.sin(time*3+i)*.025;if(g.position.distanceTo(spider.position.clone().setY(.2))<.64){scene.remove(g);disposeGroup(g);treats.splice(i,1);pet=1;puffAt(spider.position.clone().add(V(0,1.0,.6)),'#df9c9a',12);say('mmm. berry lovely.');setMood('One very happy little spider');chime(980,.2);}}
  if(moodUntil&&time>moodUntil){mood.textContent=speed>.1?'Pip is exploring the garden':'Pip is happy to see you';moodUntil=0;}
  if(bubbleUntil&&time>bubbleUntil){bubble.classList.remove('visible');bubbleUntil=0;}
  if(bubbleUntil){const pos=spider.position.clone().add(V(0,2.05*SPIDER_SCALE,0)).project(camera);bubble.style.left=`${(pos.x*.5+.5)*innerWidth}px`;bubble.style.top=`${(-pos.y*.5+.5)*innerHeight}px`;}
  if(settings.sound&&speed>.3&&time-lastStep>.20){lastStep=time;chime(range(140,210),.035);}
}
function updateGarden(dt){
  const breeze=settings.breeze&&!reducedMotion?1:0;
  for(const arr of [plants,flowers,mushrooms])for(const p of arr){
    const response=p.userData.response||0;
    p.userData.response=Math.max(0,response-dt*1.1);
    const wobble=Math.sin(time*13)*response*.18;
    p.rotation.z=Math.sin(time*1.2+p.userData.phase)*.025*breeze+wobble;
    if(p.userData.grow!==undefined){p.userData.grow=Math.min(1,p.userData.grow+dt*2.5);if(!p.userData.finalScale)p.userData.finalScale=p.scale.x;p.scale.setScalar(p.userData.finalScale*(1-Math.pow(1-p.userData.grow,3)));}
  }
  branch.rotation.z=Math.sin(time*.7)*.003*breeze+Math.sin(time*8)*(branch.userData.response||0)*.008;
  branch.userData.response=Math.max(0,(branch.userData.response||0)-dt);
  fireflies.forEach(f=>{const t=time*f.speed+f.phase;f.sprite.position.copy(f.origin).add(V(Math.sin(t)*.3,Math.sin(t*1.3)*.18,Math.cos(t)*.2));f.sprite.material.opacity=(.3+.7*Math.pow(Math.sin(time*1.5+f.phase)*.5+.5,2))*(.2+.8*nightBlend);});
  if(!reducedMotion)motes.rotation.y=time*.006;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){scene.remove(p.mesh);p.mesh.material.dispose();particles.splice(i,1);continue;}p.mesh.position.addScaledVector(p.velocity,dt);p.velocity.y-=dt*.18;p.mesh.material.opacity=p.life/p.max;}
  ringAge+=dt;ringMat.opacity=Math.max(0,1-ringAge/.9)*.7;destinationRing.scale.setScalar(1+ringAge*.8);
  nightBlend=lerp(nightBlend,settings.night?1:0,Math.min(dt*1.8,1));scene.background.copy(dayColor).lerp(nightColor,nightBlend);scene.fog.color.copy(scene.background);hemisphere.intensity=lerp(1.7,1.0,nightBlend);key.intensity=lerp(4.0,3.0,nightBlend);rim.intensity=lerp(1.8,3.0,nightBlend);
  webs.forEach(g=>{const born=time-g.userData.birth;g.children[0].material.opacity=clamp(born*1.3,0,.62);});
}
let paused=false;
document.addEventListener('visibilitychange',()=>{paused=document.hidden;if(!paused)last=performance.now();if(audio){if(paused)audio.suspend();else if(settings.sound)audio.resume();}});
function frame(now){
  requestAnimationFrame(frame);if(paused)return;
  const dt=Math.min((now-last)/1000,.045);last=now;time+=dt;
  updateCamera(dt);updateSpider(dt);
  cocoPip.x=spider.position.x;cocoPip.z=spider.position.z;cocoPip.heading=heading;cocoPip.speed=speed;
  if(coco.update(dt,time,cocoPip,interactables)){cocoGreeting=1.8;if(!bubbleUntil){say('hi, Coco!',1.8);setMood('Pip and Coco are keeping company');}}
  updateGarden(dt);renderer.render(scene,camera);
}
setCoat(settings.color);updateDay();updateSound();
requestAnimationFrame(frame);
setTimeout(()=>{$('#loader').classList.add('ready');setTimeout(()=>$('#loader').remove(),650);say('oh, hello!',3.5);},250);
// Read-only diagnostics help verify state transitions without coupling the UI to tests.
window.pipWorld={getState:()=>({ready:true,mode,position:spider.position.toArray(),target:target.toArray(),webs:webs.length,treats:treats.length,plants:userPlants.length,color:settings.color,fluff:settings.fluff,size:SPIDER_SCALE,night:settings.night,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,coco:coco.getState()})};
