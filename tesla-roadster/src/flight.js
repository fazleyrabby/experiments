// Metres and seconds are illustrative scene units, not Tesla performance claims.
export const DURATION = 14;
export const RAMP_RADIUS = 11;
export const RAMP_ANGLE = 2.65;
export const RIDE_HEIGHT = 0.65;
export const CLIMB_START = 3.2;
export const FLIGHT_START = 6.9;
export const LANDING_TIME = 10.8;
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
export function hermite(a, b, va, vb, t, duration) {
  return (2*t*t*t-3*t*t+1)*a + (t*t*t-2*t*t+t)*va*duration + (-2*t*t*t+3*t*t)*b + (t*t*t-t*t)*vb*duration;
}
export function rampPoint(angle, clearance = 0) {
  return { x: (RAMP_RADIUS-clearance)*Math.sin(angle), y: RAMP_RADIUS*(1-Math.cos(angle))+clearance*Math.cos(angle) };
}
const release = rampPoint(RAMP_ANGLE, RIDE_HEIGHT);
function poseAt(time) {
  const t = clamp(time, 0, DURATION);
  let x, y = RIDE_HEIGHT, pitch = 0, roll = 0, thrust = 0, phase = 'Approach';
  if (t < CLIMB_START) {
    const u = t / CLIMB_START;
    x = hermite(-19, 0, 0, 11, u, CLIMB_START);
  } else if (t < FLIGHT_START) {
    const u = (t-CLIMB_START)/(FLIGHT_START-CLIMB_START);
    pitch = hermite(0, RAMP_ANGLE, 11/(RAMP_RADIUS-RIDE_HEIGHT), .34, u, FLIGHT_START-CLIMB_START);
    ({x,y} = rampPoint(pitch,RIDE_HEIGHT));
    phase = 'Wall climb';
  } else if (t < LANDING_TIME) {
    const duration = LANDING_TIME-FLIGHT_START;
    const u = (t-FLIGHT_START)/duration;
    x = hermite(release.x, -12, Math.cos(RAMP_ANGLE)*3.519, -7, u, duration);
    y = hermite(release.y, RIDE_HEIGHT, Math.sin(RAMP_ANGLE)*3.519, -.9, u, duration);
    // Nose follows the overhanging lip, then cold-gas jets level the vehicle.
    pitch = RAMP_ANGLE+(Math.PI-RAMP_ANGLE)*smooth(u/.62);
    roll = Math.PI*smooth(u/.83);
    thrust = smooth((u-.15)/.2) * (1-.25*smooth((u-.85)/.15));
    phase = 'Flight';
  } else {
    const elapsed = t-LANDING_TIME;
    const u = elapsed/(DURATION-LANDING_TIME);
    x = hermite(-12,-23,-7,0,u,DURATION-LANDING_TIME);
    pitch = Math.PI;
    roll = Math.PI;
    y += -.095*Math.exp(-elapsed*5)*Math.sin(elapsed*12);
    thrust = .75 * (1-smooth(elapsed/.38));
    phase = 'Touchdown';
  }
  return {time:t,x,y,z:0,pitch,roll,thrust,phase};
}
export function sampleFlight(time) {
  const state=poseAt(time);
  const before=poseAt(Math.max(0,state.time-.005));
  const after=poseAt(Math.min(DURATION,state.time+.005));
  const dt=after.time-before.time;
  state.vx=dt ? (after.x-before.x)/dt : 0;
  state.vy=dt ? (after.y-before.y)/dt : 0;
  state.speed=Math.hypot(state.vx,state.vy)*3.6;
  state.altitude=Math.max(0,state.y-RIDE_HEIGHT);
  return state;
}
