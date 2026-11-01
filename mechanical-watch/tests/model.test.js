import test from 'node:test';
import assert from 'node:assert/strict';
import { createWatch } from '../src/watch/createWatch.js';

test('every procedural mesh has renderable materials and finite geometry',()=>{
  // Layout and hierarchy validation only; actual raster appearance is checked in the browser.
  const noop=()=>{};
  const context=new Proxy({createRadialGradient:()=>({addColorStop:noop})},{get:(target,key)=>key in target?target[key]:noop});
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
  const watch=createWatch();let meshes=0;
  watch.root.traverse(object=>{
    if(!object.isMesh)return;
    meshes++;assert.ok(object.material?.isMaterial,`${object.parent.name} needs a Three.js material`);
    const positions=object.geometry.attributes.position;
    assert.ok(positions.count>0);
    for(const value of positions.array)assert.ok(Number.isFinite(value),'Geometry contains a non-finite vertex');
  });
  assert.ok(meshes>30&&meshes<200,'Static details should be batched into a practical draw count');
  watch.select('mainplate');watch.select(null);watch.update(.1,true);watch.dispose();
  delete globalThis.document;
});
