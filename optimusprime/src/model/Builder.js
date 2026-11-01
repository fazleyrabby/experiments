import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const palette = {
  red: [0xa91821,.38,.48], redLight:[0xcd2630,.36,.45], redDark:[0x610e15,.36,.65],
  blue:[0x173e94,.36,.50], blueLight:[0x2456ad,.38,.48], blueDark:[0x101d42,.35,.66],
  faceSilver:[0xbac5ce,.55,.68], gunmetal:[0x7c8589,.49,.82], steel:[0x66727d,.46,.82], silver:[0x9aa8b4,.42,.86], chrome:[0xaab7c2,.36,.91],
  dark:[0x232c34,.44,.8], black:[0x0b1016,.54,.5], rubber:[0x12151a,.88,.05],
  glass:[0x152e3d,.16,.68], amber:[0xffa52c,.26,.25], eye:[0x64cbff,.28,.2], lamp:[0xd7eeff,.2,.3],
};

export class Builder {
  constructor() {
    this.geometries=new Map();this.materials={};this.meshCount=0;
    for(const [key,[color,roughness,metalness]] of Object.entries(palette)) {
      const m=new THREE.MeshStandardMaterial({color,roughness,metalness});
      if(['red','redLight','blue','blueLight'].includes(key)) {
        m.onBeforeCompile=shader=>{
          shader.vertexShader='varying vec3 vLocal;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLocal = position;');
          shader.fragmentShader='varying vec3 vLocal;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
            float grain=fract(sin(dot(floor(vLocal*350.0),vec3(12.9898,78.233,37.719)))*43758.5453);
            diffuseColor.rgb *= .96 + .04*grain;`);
        };
      }
      if(key==='eye'){m.emissive.set(0x079bff);m.emissiveIntensity=4.5;}
      if(key==='lamp'){m.emissive.set(0xb7dfff);m.emissiveIntensity=2;}
      if(key==='amber'){m.emissive.set(0xff770a);m.emissiveIntensity=.8;}
      this.materials[key]=m;
    }
  }
  geometry(key,fn){if(!this.geometries.has(key))this.geometries.set(key,fn());return this.geometries.get(key);}
  group(parent,name,p=[0,0,0],r=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...p);g.rotation.set(...r);parent.add(g);return g;}
  mesh(parent,name,geo,mat,p=[0,0,0],r=[0,0,0]){const m=new THREE.Mesh(geo,this.materials[mat]);m.name=name;m.position.set(...p);m.rotation.set(...r);m.castShadow=true;m.receiveShadow=true;parent.add(m);this.meshCount++;return m;}
  box(g,mat,p,s,r=[0,0,0],radius=.035,name='Armor panel'){
    const bevel=Math.min(radius,...s.map(v=>v*.22));
    const geo=this.geometry(`b:${s}:${bevel}`,()=>new RoundedBoxGeometry(...s,1,bevel));
    return this.mesh(g,name,geo,mat,p,r);
  }
  cylinder(g,mat,p,radius,height,r=[0,0,0],rt=radius,segments=20){return this.mesh(g,'Machined cylinder',this.geometry(`c:${radius}:${rt}:${height}:${segments}`,()=>new THREE.CylinderGeometry(rt,radius,height,segments)),mat,p,r);}
  torus(g,mat,p,radius,tube,r=[0,0,0],segments=40){return this.mesh(g,'Machined ring',this.geometry(`t:${radius}:${tube}:${segments}`,()=>new THREE.TorusGeometry(radius,tube,8,segments)),mat,p,r);}
  plate(g,mat,p,w,h,d,r=[0,0,0],taper=.82){const c=Math.min(w,h)*.13;return this.profile(g,mat,p,[[-w/2+c,h/2],[w/2-c,h/2],[w/2,h/2-c],[w*taper/2,-h/2+c],[w*taper/2-c,-h/2],[-w*taper/2+c,-h/2],[-w*taper/2,-h/2+c],[-w/2,h/2-c]],d,r);}
  profile(g,mat,p,points,depth,r=[0,0,0]){
    const geo=this.geometry(`p:${points}:${depth}`,()=>{const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1,curveSegments:1});geo.translate(0,0,-depth/2);return geo;});
    return this.mesh(g,'Shaped armor plate',geo,mat,p,r);
  }
  rod(g,mat,a,z,r=.04){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...z),dir=bv.clone().sub(av);const m=this.cylinder(g,mat,av.clone().add(bv).multiplyScalar(.5).toArray(),r,dir.length());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return m;}
  bolt(g,p,r=.035,rotation=[Math.PI/2,0,0]){return this.cylinder(g,'silver',p,r,.025,rotation,r,6);}
  vent(g,p,w,h,count=7,mat='steel'){
    this.box(g,'black',p,[w,h,.045],undefined,.01,'Vent recess');
    for(let i=0;i<count;i++)this.box(g,mat,[p[0],p[1]+h*(i/(count-1)-.5)*.85,p[2]+.04],[w*.88,.035,.035],undefined,.006,'Cooling louver');
  }
  axle(g,p,r,w){this.cylinder(g,'dark',p,r,w,[0,0,Math.PI/2]);for(const s of [-1,1]){this.cylinder(g,'steel',[p[0]+s*w*.5,p[1],p[2]],r*.85,.08,[0,0,Math.PI/2]);this.cylinder(g,'silver',[p[0]+s*(w*.5+.05),p[1],p[2]],r*.4,.045,[0,0,Math.PI/2],r*.4,8);}}
  // Static details merge only within their own pivot. Every animated part stays independent.
  batch(root){
    const nodes=[];root.traverse(g=>{if(g.isGroup)nodes.push(g);});
    for(const node of nodes){const batches=new Map();for(const child of [...node.children]){if(!child.isMesh||child.userData.dynamic)continue;child.updateMatrix();const copy=child.geometry.clone().applyMatrix4(child.matrix);const geometry=copy.index?copy.toNonIndexed():copy;if(geometry!==copy)copy.dispose();geometry.deleteAttribute('uv');if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(geometry);node.remove(child);}
      for(const [material,geos] of batches){const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());const m=new THREE.Mesh(merged,material);m.name=`${node.name} surface`;m.castShadow=true;m.receiveShadow=true;node.add(m);}
    }
  }
  dispose(root){const used=new Set();root.traverse(m=>{if(m.isMesh)used.add(m.geometry);});for(const geo of this.geometries.values())used.add(geo);used.forEach(g=>g.dispose());Object.values(this.materials).forEach(m=>m.dispose());}
}
