import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { easeInOutCubic, easeInOutSine } from '../animation/easing.js';

const FOV = 32;
const HOME_AZIMUTH = THREE.MathUtils.degToRad(38);
const HOME_ELEVATION = THREE.MathUtils.degToRad(23);

/**
 * Perspective camera + OrbitControls + a small tween rig.
 *
 * The camera itself never auto-rotates — the ship spins on its own pivot —
 * so the only automatic camera motion is the opening dolly, framing changes
 * and RESET VIEW, all of which yield immediately to user input.
 *
 * @param {HTMLElement} domElement element that receives pointer input
 * @param {object} framing
 * @param {{h:number, v:number, targetY:number}} framing.normal  half extents to keep in view when assembled
 * @param {{h:number, v:number, targetY:number}} framing.wide    same, for the exploded view
 */
export function createCameraRig(domElement, framing) {
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 1500);
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.6;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minPolarAngle = Math.PI * 0.06;
  controls.maxPolarAngle = Math.PI * 0.58;

  let aspect = 1;
  let mode = 'normal';
  let tween = null;
  let userActive = false;
  let userAdjusted = false;
  let idle = Infinity;

  const scratchOffset = new THREE.Vector3();
  const scratchSpherical = new THREE.Spherical();
  const panLimit = framing.normal.h * 0.7;

  function homeDistance(which) {
    const frame = framing[which];
    const vertical = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const horizontal = vertical * aspect;
    // Fit both extents, then back off a little for perspective and the UI.
    const fit = Math.max(frame.h / horizontal, frame.v / vertical);
    const padding = aspect < 1 ? 1.15 : 1.16;
    return fit * padding + frame.h * 0.42;
  }

  /** Target and spherical offset (around that target) of a framing. */
  function homePose(which, azimuth = HOME_AZIMUTH, elevation = HOME_ELEVATION, zoom = 1) {
    return {
      target: new THREE.Vector3(0, framing[which].targetY, 0),
      spherical: new THREE.Spherical(homeDistance(which) * zoom, Math.PI / 2 - elevation, azimuth),
    };
  }

  function applyPose(pose) {
    controls.target.copy(pose.target);
    camera.position.setFromSpherical(pose.spherical).add(pose.target);
    camera.lookAt(pose.target);
  }

  function updateLimits() {
    controls.minDistance = homeDistance('normal') * 0.38;
    controls.maxDistance = homeDistance('wide') * 1.7;
  }

  function tweenTo(pose, duration, ease = easeInOutCubic) {
    scratchOffset.copy(camera.position).sub(controls.target);
    const from = new THREE.Spherical().setFromVector3(scratchOffset);
    // Take the short way around the ship.
    let deltaTheta = pose.spherical.theta - from.theta;
    deltaTheta = THREE.MathUtils.euclideanModulo(deltaTheta + Math.PI, Math.PI * 2) - Math.PI;
    tween = {
      elapsed: 0,
      duration,
      ease,
      from,
      deltaTheta,
      to: pose.spherical,
      fromTarget: controls.target.clone(),
      toTarget: pose.target,
    };
  }

  controls.addEventListener('start', () => {
    userActive = true;
    userAdjusted = true;
    tween = null; // the user always wins
  });
  controls.addEventListener('end', () => {
    userActive = false;
    idle = 0;
  });

  return {
    camera,
    controls,

    get userActive() {
      return userActive;
    },
    /** Seconds since the user last touched the camera. */
    get idleTime() {
      return userActive ? 0 : idle;
    },

    /** Start far out and off-axis, then settle into the showcase view. */
    playIntro(duration) {
      mode = 'normal';
      userAdjusted = false;
      applyPose(homePose('normal', HOME_AZIMUTH - 0.85, HOME_ELEVATION + 0.3, 1.42));
      tweenTo(homePose('normal'), duration, easeInOutSine);
    },

    /** Switch framing ('normal' | 'wide') unless the user has taken over the camera. */
    setMode(nextMode, duration = 1.6) {
      mode = nextMode;
      if (!userAdjusted) tweenTo(homePose(mode), duration);
    },

    /** RESET VIEW: back to the default position, zoom and target for the current mode. */
    reset(duration = 1.1) {
      userAdjusted = false;
      idle = Infinity;
      tweenTo(homePose(mode), duration);
    },

    resize(width, height) {
      aspect = width / Math.max(height, 1);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      updateLimits();
      const home = homePose(mode);
      if (tween) {
        tween.to = home.spherical;
        tween.toTarget = home.target;
      } else if (!userAdjusted) {
        applyPose(home);
      }
    },

    update(dt) {
      idle += dt;
      if (tween) {
        tween.elapsed += dt;
        const t = Math.min(tween.elapsed / tween.duration, 1);
        const k = tween.ease(t);
        controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
        scratchSpherical.set(
          THREE.MathUtils.lerp(tween.from.radius, tween.to.radius, k),
          THREE.MathUtils.lerp(tween.from.phi, tween.to.phi, k),
          tween.from.theta + tween.deltaTheta * k,
        );
        camera.position.setFromSpherical(scratchSpherical).add(controls.target);
        if (t >= 1) tween = null;
      }
      controls.update();
      if (controls.target.lengthSq() > panLimit * panLimit) controls.target.setLength(panLimit);
    },

    dispose() {
      controls.dispose();
    },
  };
}
