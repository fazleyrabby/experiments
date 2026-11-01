import * as THREE from 'three';

export function createEffects(scene){
  const count=140,positions=new Float32Array(count*3),seeds=[];
  for(let i=0;i<count;i++){const s=[Math.sin(i*127.1)*.5+.5,Math.sin(i*311.7)*.5+.5,Math.cos(i*74.7)*.5+.5];seeds.push(s);positions.set([(s[0]-.5)*22,s[1]*12,(s[2]-.5)*18],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const dustMat=new THREE.PointsMaterial({color:0xa4c4e2,size:.026,transparent:true,opacity:.32,depthWrite:false,sizeAttenuation:true});
  const dust=new THREE.Points(geometry,dustMat);dust.frustumCulled=false;scene.add(dust);
  const n=72,sparkPositions=new Float32Array(n*3),colors=new Float32Array(n*3);
  const sparkGeo=new THREE.BufferGeometry();sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPositions,3));sparkGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const sparkMat=new THREE.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
  const sparks=new THREE.Points(sparkGeo,sparkMat);sparks.frustumCulled=false;scene.add(sparks);
  const impactGeo=new THREE.RingGeometry(.98,1,80);const impactMat=new THREE.MeshBasicMaterial({color:0x94caff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
  const impact=new THREE.Mesh(impactGeo,impactMat);impact.rotation.x=-Math.PI/2;impact.position.y=.015;scene.add(impact);
  return {update(time,t,active,reduced){
    dust.visible=!reduced;sparks.visible=active&&!reduced;impact.visible=!reduced;
    if(reduced)return;
    dust.rotation.y=time*.008;dust.position.y=Math.sin(time*.15)*.1;
    const burst=Math.max(0,Math.sin((t-2.6)*2.4))*Math.max(0,Math.min(1,(t-2)/.4,(6.6-t)/.5));
    sparkMat.opacity=active?burst*.8:0;
    for(let i=0;i<n;i++){const s=seeds[i],life=(t*1.7+s[1])%1;const side=i%2?1:-1;sparkPositions.set([side*(1.6+life*s[0]*1.4),3+t*.4-life*life*2.5,Math.sin(i*43)*.7+life*(s[2]-.5)*2],i*3);colors.set([1,.46+life*.3,.12+life*.5],i*3);}
    sparkGeo.attributes.position.needsUpdate=true;sparkGeo.attributes.color.needsUpdate=true;
    const k=(t-6.25)/1.0;impactMat.opacity=active&&k>0&&k<1?(1-k)*.12:0;impact.scale.setScalar(1+Math.max(0,k)*5);
  },dispose(){scene.remove(dust,sparks,impact);geometry.dispose();dustMat.dispose();sparkGeo.dispose();sparkMat.dispose();impactGeo.dispose();impactMat.dispose();}};
}
