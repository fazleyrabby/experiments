import test from 'node:test';
import assert from 'node:assert/strict';
import { movieSeparation, MOVIE } from '../src/movie.js';

test('film fits 18 seconds at 60fps with assembled opening and closing holds',()=>{
  assert.equal(MOVIE.frames/MOVIE.fps,18);
  for(const t of [0,1,2.5,16,17,18])assert.equal(movieSeparation(t),0);
  for(const t of [6.5,8,10,12])assert.equal(movieSeparation(t),1);
});
test('camera-independent breakdown profile has continuous eased joins',()=>{
  for(const boundary of [2.5,6.5,12,16]){
    const epsilon=.0001;
    assert.ok(Math.abs(movieSeparation(boundary+epsilon)-movieSeparation(boundary-epsilon))<.00001);
  }
  for(let i=0;i<1080;i++){const p=movieSeparation(i/60);assert.ok(Number.isFinite(p)&&p>=0&&p<=1);}
});
