import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleFlight, rampPoint, RIDE_HEIGHT, CLIMB_START, FLIGHT_START, LANDING_TIME, DURATION, RAMP_ANGLE} from '../src/flight.js';

test('trajectory stays finite, above ground, and within the replay interval',()=>{
  for(let t=-1;t<=DURATION+1;t+=.007){const s=sampleFlight(t);for(const key of ['x','y','pitch','roll','speed','thrust'])assert.ok(Number.isFinite(s[key]),`${key} at ${t}`);assert.ok(s.y>=RIDE_HEIGHT-.11);assert.ok(s.time>=0&&s.time<=DURATION);assert.ok(s.thrust>=0&&s.thrust<=1);}
});
test('phase boundaries have continuous position and orientation',()=>{
  for(const t of [CLIMB_START,FLIGHT_START,LANDING_TIME]){
    const a=sampleFlight(t-.00001),b=sampleFlight(t+.00001);
    for(const key of ['x','y','pitch','roll'])assert.ok(Math.abs(a[key]-b[key])<.001,`${key} jumps at ${t}`);
  }
});
test('wall climb follows the ramp with normal clearance',()=>{
  for(let t=CLIMB_START;t<FLIGHT_START;t+=.03){const s=sampleFlight(t),p=rampPoint(s.pitch);assert.ok(Math.abs(Math.hypot(s.x-p.x,s.y-p.y)-RIDE_HEIGHT)<1e-8);}
  assert.ok(RAMP_ANGLE>Math.PI/2,'ramp must curl beyond vertical');
});
test('flight ends upright, facing the return direction, and at rest',()=>{
  const s=sampleFlight(DURATION);
  // Z-pitch π plus local X-roll π yields a Y-turn π with world up preserved.
  const upY=Math.cos(s.pitch)*Math.cos(s.roll);
  assert.ok(upY>.9999);assert.ok(Math.cos(s.pitch)<-.9999);assert.ok(s.speed<.1);assert.equal(s.thrust,0);assert.equal(s.phase,'Touchdown');
});
test('time sampling is deterministic, including scrubbing backwards',()=>{
  const before=sampleFlight(8.5);sampleFlight(13);sampleFlight(2);assert.deepEqual(sampleFlight(8.5),before);
});
