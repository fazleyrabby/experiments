import * as THREE from 'three/webgpu';
import { float, fract, length, mix, mrt, normalView, output, pass, screenUV, sin, smoothstep, time, vec3, vec4, velocity } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { traa } from 'three/addons/tsl/display/TRAANode.js';
import { compileObject } from './compile.js';

export function createPost(renderer, scene, camera, tier) {
  const scenePass = pass(scene, camera);
  // Opaque surfaces write alpha 1. Additive effects write alpha 0, so they cannot disturb these buffers.
  const keepUnderTransparent = new THREE.BlendMode(THREE.NormalBlending);
  const gBuffer = mrt({ output, normal: vec4(normalView, 1), velocity: vec4(velocity.xy, 0, 1) });
  gBuffer.setBlendMode('normal', keepUnderTransparent).setBlendMode('velocity', keepUnderTransparent);
  scenePass.setMRT(gBuffer);

  const beauty = scenePass.getTextureNode('output');
  const depth = scenePass.getTextureNode('depth');
  const normal = scenePass.getTextureNode('normal');
  const motion = scenePass.getTextureNode('velocity');

  let lit = beauty;
  if (tier.ao) {
    const aoPass = ao(depth, normal, camera);
    aoPass.resolutionScale = 0.5;
    aoPass.radius.value = 0.85;
    aoPass.samples.value = tier.aoSamples;
    const occlusion = mix(float(1), aoPass.getTextureNode().r, 0.8);
    lit = vec4(beauty.rgb.mul(occlusion), beauty.a);
  }

  const resolved = tier.taa ? traa(lit, depth, motion, camera) : lit;
  const glow = tier.bloom ? bloom(resolved, 0.5, 0.62, 0.78) : vec4(0);
  const vignette = float(1).sub(smoothstep(0.28, 0.86, length(screenUV.sub(0.5))));
  const grain = fract(sin(screenUV.x.mul(1283.1).add(screenUV.y.mul(4177.7)).add(time.mul(31.7))).mul(43758.5453)).sub(0.5).mul(0.006);
  const graded = resolved.rgb.add(glow.rgb).mul(mix(float(0.56), float(1), vignette)).add(vec3(grain));

  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = vec4(graded, 1);

  return {
    render: () => pipeline.render(),
    dispose: () => pipeline.dispose(),
    precompile: (object, targetScene, onProgress = null) => compileObject(renderer, object, camera, targetScene, scenePass.renderTarget, gBuffer, onProgress),
  };
}
