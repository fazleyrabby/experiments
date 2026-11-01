import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createOptimus } from '../src/model/createOptimus.js';
import { Transformation, TRANSFORM_DURATION } from '../src/animation/Transformation.js';

function fixture(){
  const model=createOptimus();
  const studio={view:{},camera:{position:new THREE.Vector3(10,8,20)},controls:{target:new THREE.Vector3(0,4,0)},beginCinematic(){},update(){},onInterrupt(){}};
  const controller=new Transformation(model,studio);
  return {model,controller,dispose(){controller.dispose();model.dispose();}};
}
test('Truck and robot preserve every rigid articulated assembly through reversible endpoints',()=>{
  const f=fixture();try{
    assert.equal(f.model.wheels.length,6);
    assert.ok(f.model.tracks.length>=30);
    for(const time of [0,TRANSFORM_DURATION,0,TRANSFORM_DURATION]){
      f.controller.seek(time);
      for(const track of f.model.tracks){
        const target=time===0?track.truck:track.robot;
        for(let i=0;i<3;i++){
          assert.ok(Math.abs(track.node.position.getComponent(i)-target.p[i])<1e-5,`${track.node.name}: position ${i}`);
          assert.ok(Math.abs(track.node.rotation[['x','y','z'][i]]-target.r[i])<1e-5,`${track.node.name}: rotation ${i}`);
        }
      }
    }
    assert.equal(f.controller.timeline.duration(),TRANSFORM_DURATION);
    assert.ok(f.model.rig['Ion blaster deployment']);
    assert.ok(f.model.rig['Ion barrel extension']);
  }finally{f.dispose();}
});
test('Batched geometry and linkage transforms stay finite throughout the sequence',()=>{
  const f=fixture();try{
    let renderMeshes=0;f.model.root.traverse(m=>{if(m.isMesh){renderMeshes++;assert.ok(m.geometry.attributes.position.count>0);}});
    assert.ok(renderMeshes<350,`Expected fewer than 350 render meshes, got ${renderMeshes}`);
    assert.ok(renderMeshes < f.model.sourceMeshCount * .2, 'Static detail batching should remove at least 80% of mesh draws');
    for(let t=0;t<=TRANSFORM_DURATION;t+=.19){
      f.controller.seek(t);f.model.root.updateMatrixWorld(true);
      f.model.root.traverse(n=>assert.ok(n.matrixWorld.elements.every(Number.isFinite),`${n.name} at ${t}`));
    }
  }finally{f.dispose();}
});
test('Reduced motion changes modes immediately and keeps the eye lighting consistent',()=>{
  const f=fixture();try{
    f.controller.setReducedMotion(true);f.controller.transform('truck');assert.equal(f.controller.timeline.time(),0);assert.equal(f.controller.state,'truck');assert.equal(f.model.materials.eye.emissiveIntensity,0);
    f.controller.transform('robot');assert.equal(f.controller.timeline.time(),TRANSFORM_DURATION);assert.equal(f.controller.state,'robot');assert.ok(f.model.materials.eye.emissiveIntensity>3);
  }finally{f.dispose();}
});
