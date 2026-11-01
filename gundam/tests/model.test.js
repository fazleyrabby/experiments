import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
import { createGundam } from '../src/model/createGundam.js';
import { AssemblyController } from '../src/animation/AssemblyController.js';

const model=createGundam();
test.after(()=>model.dispose());
const settle=controller=>{for(let i=0;i<500&&controller.run;i++) controller.update(.05); assert.equal(controller.run,null);};

test('procedural components have finite geometry, valid transforms and complete body regions',()=>{
  assert.ok(model.stats.components>400);
  assert.equal(model.stats.components,model.stats.armor+model.stats.frame);
  const regions=new Set(model.parts.map(p=>p.section));
  for(const region of ['feet','legs','waist','torso','arms','head','backpack','equipment']) assert.ok(regions.has(region),region);
  for(const part of model.parts) {
    assert.ok([...part.rest,...part.rotation,...part.exploded,...part.scatter].every(Number.isFinite),part.mesh.name);
    assert.ok(Math.abs(part.rotation.length()-1)<1e-6);
    assert.equal(part.mesh.parent,model.root);
    const vertices=part.mesh.geometry.attributes.position.array;
    assert.ok(vertices.every(Number.isFinite),part.mesh.name);
  }
  const bounds=new Box3().setFromObject(model.root);
  assert.ok(bounds.min.y>=-.1);
  assert.ok(bounds.max.y>17&&bounds.max.y<19);
});

test('exploded armor reveals the stationary mechanical frame',()=>{
  const controller=new AssemblyController(model.parts);
  controller.start(1); settle(controller);
  assert.equal(controller.state,'exploded');
  for(const p of model.parts) {
    assert.ok(p.mesh.position.distanceTo(p.exploded)<1e-8);
    if(p.layer==='frame') assert.ok(p.mesh.position.distanceTo(p.rest)<1e-8);
    else assert.ok(p.mesh.position.distanceTo(p.rest)>.5,p.mesh.name);
  }
});

test('weapons physically meet the palms and the left forearm mounting rail',()=>{
  const socket=name=>model.sockets.get(name).position;
  const part=name=>model.parts.find(p=>p.mesh.name===name);
  assert.ok(part('Rifle pistol grip').rest.distanceTo(socket('rightPalmGrip'))<1e-8);
  assert.ok(part('Shield hand grip').rest.distanceTo(socket('leftPalmGrip'))<1e-8);
  assert.ok(part('Shield forearm mounting shoe').rest.distanceTo(socket('leftForearmDock'))<1e-8);
  assert.ok(socket('shieldForearmDock').distanceTo(socket('leftForearmDock'))<1e-8);
  assert.ok(part('Beam rifle receiver').rest.z>socket('rightPalmGrip').z+.5);
  assert.ok(part('Rifle muzzle aperture').rest.y<socket('rightPalmGrip').y-3);
  for(const hand of model.parts.filter(p=>p.mesh.name==='Hand carpal block')) {
    assert.ok(Math.abs(hand.rest.x)>3,'Hands must hang beside the body, outside the hip armor');
  }
});

test('repeated breakdown, interruption and reassembly never drift or snap',()=>{
  const controller=new AssemblyController(model.parts);
  controller.scrub(0);
  for(let cycle=0;cycle<4;cycle++) {
    controller.start(1);
    for(let i=0;i<22;i++) controller.update(.05);
    const poses=model.parts.map(p=>p.mesh.position.clone());
    controller.start(0); controller.update(0);
    model.parts.forEach((p,i)=>assert.ok(p.mesh.position.distanceTo(poses[i])<1e-8));
    settle(controller);
    assert.equal(controller.state,'assembled');
    for(const p of model.parts) {
      assert.ok(p.mesh.position.distanceTo(p.rest)<1e-8,p.mesh.name);
      assert.ok(1-Math.abs(p.mesh.quaternion.dot(p.rotation))<1e-8);
    }
  }
});

test('intro assembly can be interrupted by scrubbing and resumed',()=>{
  const controller=new AssemblyController(model.parts);
  controller.intro(); controller.update(.25);
  controller.scrub(.45);
  assert.equal(controller.state,'inspecting');
  assert.equal(controller.separation,.45);
  assert.equal(controller.run,null);
  for(const p of model.parts) assert.ok(p.mesh.position.distanceTo(p.rest.clone().lerp(p.exploded,.45))<1e-8);
  controller.start(0); settle(controller);
  assert.equal(controller.assembledCount,model.parts.length);
});

test('reduced motion starts assembled and changes modes instantly',()=>{
  const controller=new AssemblyController(model.parts,{reducedMotion:true});
  controller.intro(); assert.equal(controller.state,'assembled'); assert.equal(controller.run,null);
  controller.start(1); assert.equal(controller.state,'exploded'); assert.equal(controller.run,null);
  controller.start(0); assert.equal(controller.state,'assembled'); assert.equal(controller.run,null);
});
