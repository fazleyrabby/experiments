const isolated = new WeakSet();

/**
 * compileAsync pauses between shaders so frames can render. In r187 every pause restores the target and MRT
 * that were active when the compile started, which here are the scene pass's, so the next frame would draw
 * into the wrong buffers. Compiles only ever start between frames, so each pause now restores that idle state.
 */
function isolatePrecompileState(renderer) {
  if (isolated.has(renderer)) return;
  isolated.add(renderer);
  const finish = renderer._finishPreCompile;
  renderer._finishPreCompile = function finishIsolated() {
    const state = this._precompilationState;
    state.outputRenderTarget = null;
    state.outputMRT = null;
    state.activeCubeFace = 0;
    state.activeMipmapLevel = 0;
    finish.call(this);
  };
}

/**
 * Compiles an object's shaders without blocking rendering. Without this the GPU compiles each shader
 * the first time it comes into view, which freezes the page for seconds at a time while walking.
 * Culling is lifted so objects outside the current view are compiled too. Three.js collects the
 * objects synchronously, so the renderer state can be restored before the compile finishes.
 */
export function compileObject(renderer, object, camera, targetScene, target, mrt, onProgress = null) {
  isolatePrecompileState(renderer);
  const previousTarget = renderer.getRenderTarget();
  const previousMrt = renderer.getMRT();
  const culled = [];
  object.traverse((child) => {
    if (child.isMesh && child.frustumCulled) {
      culled.push(child);
      child.frustumCulled = false;
    }
  });
  renderer.setRenderTarget(target);
  renderer.setMRT(mrt);
  const pending = renderer.compileAsync(object, camera, targetScene, onProgress);
  renderer.setRenderTarget(previousTarget);
  renderer.setMRT(previousMrt);
  culled.forEach((child) => { child.frustumCulled = true; });
  return pending;
}
