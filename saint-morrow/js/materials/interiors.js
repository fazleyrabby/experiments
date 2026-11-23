import {
  abs, cos, dot, float, floor, fract, length, max, mix, oneMinus, pow, sin, smoothstep, step, vec2, vec3,
} from 'three/tsl';

export const KIND = { HOME: 0, BOTTLES: 1, CLOCKS: 2, GARMENTS: 3, BAKERY: 4, HARDWARE: 5, PORTRAITS: 6, BOOKS: 7 };

const isKind = (kind, value) => step(value - 0.5, kind).mul(oneMinus(step(value + 0.5, kind)));
const below = (edge, x, soft) => oneMinus(smoothstep(float(edge).sub(soft), float(edge).add(soft), x));
const hash = (a, b, seed) => fract(sin(dot(vec2(a, b), vec2(12.9898, 78.233)).add(seed.mul(41))).mul(43758.5453));

// Offsets each item inside its cell so walls read as arranged by hand rather than a printed grid.
const jitter = (h, amount) => vec2(fract(h.mul(7.7)), fract(h.mul(3.3))).sub(0.5).mul(amount);

function bottles(u, v, seed) {
  const rows = v.mul(2.4);
  const column = u.mul(7.5);
  const h = hash(floor(column), floor(rows), seed);
  const x = abs(fract(column).sub(0.5)).mul(2);
  const y = fract(rows);
  const height = h.mul(0.2).add(0.36);
  const body = below(0.6, x, 0.03).mul(below(height, y, 0.012));
  const neck = below(0.2, x, 0.03).mul(below(height.add(0.24), y, 0.012));
  const shape = max(body, neck).mul(step(0.16, h));
  const glass = mix(mix(vec3(0.42, 0.2, 0.035), vec3(0.05, 0.22, 0.1), step(0.42, h)), vec3(0.42, 0.46, 0.4), step(0.8, h));
  const sheen = pow(oneMinus(x), 1.6).mul(1.1).add(0.24);
  const stocked = mix(vec3(0.035, 0.022, 0.014), glass.mul(sheen), shape);
  return mix(stocked, vec3(0.12, 0.07, 0.04), step(0.9, y));
}

function clocks(u, v, seed) {
  const grid = vec2(u.mul(1.55), v.mul(1.55));
  const id = floor(grid);
  const h = hash(id.x, id.y, seed);
  const f = fract(grid).sub(0.5).sub(jitter(h, 0.16));
  const r = length(f);
  const radius = fract(h.mul(3.9)).mul(0.14).add(0.2);
  const face = below(radius, r, 0.008).mul(step(0.22, h));
  const rim = face.mul(smoothstep(radius.sub(0.055), radius.sub(0.035), r));
  const hand = (angle, reach, width) => {
    const direction = vec2(sin(angle), cos(angle));
    const along = dot(f, direction);
    const across = abs(dot(f, vec2(direction.y, direction.x.negate())));
    return below(width, across, 0.003).mul(step(-0.02, along)).mul(below(reach, along, 0.004));
  };
  const hands = max(hand(h.mul(6.283), 0.15, 0.014), hand(h.mul(47.1), 0.23, 0.008));
  const dial = mix(vec3(0.62, 0.55, 0.4), vec3(0.03, 0.025, 0.02), hands);
  const clock = mix(dial, mix(vec3(0.42, 0.28, 0.1), vec3(0.14, 0.08, 0.045), step(0.5, h)), rim);
  return mix(vec3(0.075, 0.05, 0.035), clock, face);
}

function garments(u, v, seed) {
  const column = u.mul(3.4);
  const h = hash(floor(column), 3, seed);
  const x = abs(fract(column).sub(0.5)).mul(2);
  const drop = float(2.36).sub(v);
  const length_ = h.mul(0.38).add(1.04);
  const width = mix(float(0.66), float(0.82), smoothstep(0.1, 0.34, drop));
  const coat = below(width, x, 0.03).mul(smoothstep(0.1, 0.13, drop)).mul(below(length_, drop, 0.02));
  const lapel = below(0.045, x, 0.012).mul(coat);
  const folds = sin(fract(column).mul(38).add(h.mul(9))).mul(0.16).add(0.84);
  const wool = mix(mix(vec3(0.08, 0.085, 0.1), vec3(0.05, 0.08, 0.17), step(0.3, h)), mix(vec3(0.24, 0.06, 0.05), vec3(0.34, 0.24, 0.13), step(0.82, h)), step(0.58, h));
  const rail = below(0.018, abs(drop), 0.004);
  const hatColumn = u.mul(2.5);
  const hatX = fract(hatColumn).sub(0.5);
  const hatY = v.sub(2.62);
  const crown = below(0.2, abs(hatX), 0.012).mul(step(0, hatY)).mul(below(0.17, hatY, 0.008));
  const brim = below(0.34, abs(hatX), 0.012).mul(below(0.018, abs(hatY), 0.005));
  const hat = max(crown, brim);
  const hatTone = mix(vec3(0.05, 0.05, 0.055), vec3(0.2, 0.13, 0.08), step(0.5, hash(floor(hatColumn), 9, seed)));
  const dressed = mix(mix(vec3(0.15, 0.125, 0.095), wool.mul(folds).mul(oneMinus(lapel.mul(0.55))), coat), vec3(0.34, 0.26, 0.12), rail);
  return mix(dressed, hatTone, hat);
}

function bakery(u, v, seed) {
  const tiles = vec2(u.mul(6.5), v.mul(9).add(step(0.5, fract(u.mul(3.25))).mul(0)));
  const grout = max(abs(fract(tiles.x).sub(0.5)), abs(fract(tiles.y).sub(0.5)));
  const wall = mix(vec3(0.48, 0.46, 0.4), vec3(0.17, 0.15, 0.12), smoothstep(0.45, 0.49, grout));
  const rows = v.mul(2.2);
  const column = u.mul(3.6);
  const h = hash(floor(column), floor(rows), seed);
  const fx = fract(column).sub(0.5);
  const fy = fract(rows).sub(0.27);
  const q = vec2(fx.div(h.mul(0.1).add(0.36)), fy.div(h.mul(0.06).add(0.2)));
  const loaf = below(1, length(q), 0.08).mul(step(0.12, h));
  const score = below(0.08, abs(fract(fx.add(fy.mul(0.7)).mul(7)).sub(0.5)), 0.04).mul(step(0, fy));
  const crust = mix(vec3(0.5, 0.26, 0.08), vec3(0.72, 0.46, 0.18), q.y.mul(0.5).add(0.5));
  const bread = crust.mul(oneMinus(score.mul(0.32)));
  const shelf = step(0.9, fract(rows));
  return mix(mix(wall, bread, loaf), vec3(0.3, 0.2, 0.11), shelf);
}

function hardware(u, v, seed) {
  const pegs = below(0.1, length(fract(vec2(u.mul(9), v.mul(9))).sub(0.5)), 0.03);
  const board = mix(vec3(0.15, 0.11, 0.07), vec3(0.035, 0.025, 0.018), pegs);
  const grid = vec2(u.mul(2.5), v.mul(2.5));
  const id = floor(grid);
  const h = hash(id.x, id.y, seed);
  const f = fract(grid).sub(0.5).sub(jitter(h, 0.12));
  const shaft = below(0.035, abs(f.x), 0.006).mul(below(0.38, abs(f.y), 0.006));
  const head = below(0.19, abs(f.x), 0.006).mul(below(0.075, abs(f.y.sub(0.28)), 0.006));
  const hammer = max(shaft, head);
  const saw = below(0.32, abs(f.x), 0.006).mul(below(0.1, abs(f.y.add(f.x.mul(0.34))), 0.006));
  const coil = below(0.045, abs(length(f).sub(0.25)), 0.008);
  const plate = below(0.27, abs(f.x), 0.006).mul(below(0.34, abs(f.y), 0.006));
  const shape = mix(mix(hammer, saw, step(0.34, h)), mix(coil, plate, step(0.84, h)), step(0.62, h)).mul(step(0.2, fract(h.mul(5.7))));
  const metal = mix(vec3(0.42, 0.42, 0.4), vec3(0.56, 0.38, 0.14), step(0.56, fract(h.mul(7.3))));
  return mix(board, metal.mul(f.y.mul(0.8).add(0.82)), shape);
}

function portraits(u, v, seed) {
  const grid = vec2(u.mul(1.9), v.mul(1.55));
  const id = floor(grid);
  const h = hash(id.x, id.y, seed);
  const f = fract(grid).sub(0.5).sub(jitter(h, 0.1));
  const width = h.mul(0.08).add(0.25);
  const height = fract(h.mul(5.1)).mul(0.08).add(0.32);
  const frame = below(width, abs(f.x), 0.006).mul(below(height, abs(f.y), 0.006));
  const photo = below(width.sub(0.045), abs(f.x), 0.005).mul(below(height.sub(0.045), abs(f.y), 0.005));
  const headShape = below(0.095, length(vec2(f.x, f.y.sub(0.055).mul(0.82))), 0.012);
  const shoulders = below(0.2, length(vec2(f.x, f.y.add(0.27).mul(0.72))), 0.016);
  const sitter = max(headShape, shoulders);
  const sepia = mix(vec3(0.5, 0.39, 0.25), vec3(0.09, 0.06, 0.04), sitter);
  const framed = mix(mix(vec3(0.26, 0.16, 0.07), vec3(0.05, 0.04, 0.035), step(0.5, h)), sepia, photo);
  return mix(vec3(0.13, 0.09, 0.075), framed, frame);
}

function books(u, v, seed) {
  const rows = v.mul(2.6);
  const column = u.mul(mix(float(11), float(16), fract(seed.mul(4.9))));
  const h = hash(floor(column), floor(rows), seed);
  const height = fract(rows).div(h.mul(0.3).add(0.5));
  const gap = smoothstep(0.03, 0.08, oneMinus(abs(fract(column).sub(0.5)).mul(2)));
  const round = sin(fract(column).mul(Math.PI)).mul(0.62).add(0.38);
  const leather = mix(mix(vec3(0.2, 0.06, 0.04), vec3(0.05, 0.1, 0.12), step(0.34, h)), vec3(0.24, 0.18, 0.09), step(0.7, h));
  const spine = leather.mul(fract(h.mul(9.1)).mul(0.5).add(0.5)).mul(round);
  const stocked = mix(vec3(0.012, 0.009, 0.007), spine, oneMinus(step(1, height)).mul(gap).mul(step(0.12, h)));
  return mix(stocked, vec3(0.13, 0.08, 0.045), step(0.88, fract(rows)));
}

/** The wall treatment for a shop, chosen by what the shop sells. */
export function shopWall(kind, u, v, seed) {
  let result = bottles(u, v, seed);
  result = mix(result, clocks(u, v, seed), isKind(kind, KIND.CLOCKS));
  result = mix(result, garments(u, v, seed), isKind(kind, KIND.GARMENTS));
  result = mix(result, bakery(u, v, seed), isKind(kind, KIND.BAKERY));
  result = mix(result, hardware(u, v, seed), isKind(kind, KIND.HARDWARE));
  result = mix(result, portraits(u, v, seed), isKind(kind, KIND.PORTRAITS));
  return mix(result, books(u, v, seed), isKind(kind, KIND.BOOKS));
}

/** Furniture on the back wall of an upper-floor room: a dresser and a framed picture or mirror. */
export function homeFurniture(base, x, v, seed, isBack) {
  const offset = x.sub(fract(seed.mul(13.7)).sub(0.5).mul(1.5));
  const dresser = below(0.72, abs(offset), 0.008).mul(below(0.86, v, 0.008));
  const drawers = below(0.012, abs(fract(v.mul(3.6)).sub(0.5)), 0.004);
  const wood = mix(vec3(0.16, 0.09, 0.05), vec3(0.05, 0.03, 0.02), drawers);
  const frame = below(0.42, abs(offset), 0.006).mul(below(0.34, abs(v.sub(1.72)), 0.006));
  const canvas = below(0.36, abs(offset), 0.006).mul(below(0.28, abs(v.sub(1.72)), 0.006));
  const scene = mix(vec3(0.16, 0.2, 0.2), vec3(0.42, 0.34, 0.2), smoothstep(1.52, 1.86, v));
  const picture = mix(vec3(0.26, 0.17, 0.07), scene, canvas);
  return mix(base, mix(mix(base, picture, frame), wood, dresser), isBack);
}

/** Parallax layers in front of the back wall: a counter, mannequins, and a row of pendant lamps. */
export function shopForeground(ro, rd, room, kind, seed, lampColor) {
  const counterPoint = ro.add(rd.mul(float(1.75).div(rd.z)));
  const counterY = counterPoint.y.add(room.y);
  const counterMask = below(0.98, counterY, 0.006).mul(step(0, counterY)).mul(below(room.x.mul(0.72), abs(counterPoint.x), 0.01));
  const panel = smoothstep(0.035, 0.06, abs(fract(counterPoint.x.mul(0.9)).sub(0.5)));
  const counterTop = step(0.9, counterY);
  const timber = mix(vec3(0.075, 0.04, 0.024), vec3(0.15, 0.085, 0.045), panel);
  const counter = mix(timber, vec3(0.34, 0.24, 0.14), counterTop).mul(lampColor).mul(0.82);

  const standPoint = ro.add(rd.mul(float(1.05).div(rd.z)));
  const standX = fract(standPoint.x.div(2.6).add(fract(seed.mul(3.3)))).sub(0.5).mul(2.6);
  const standY = standPoint.y.add(room.y);
  const torso = below(mix(float(0.15), float(0.25), smoothstep(0.92, 1.42, standY)), abs(standX), 0.008).mul(step(0.74, standY)).mul(below(1.46, standY, 0.008));
  const pole = below(0.018, abs(standX), 0.004).mul(below(0.76, standY, 0.004)).mul(step(0, standY));
  const neck = below(0.045, abs(standX), 0.005).mul(step(1.44, standY)).mul(below(1.56, standY, 0.005));
  const mannequin = max(max(torso, pole), neck).mul(isKind(kind, KIND.GARMENTS));
  const cloth = mix(vec3(0.3, 0.27, 0.22), vec3(0.2, 0.05, 0.05), step(0.5, fract(floor(standPoint.x.div(2.6)).mul(0.37).add(seed)))).mul(lampColor);

  const lampPoint = ro.add(rd.mul(room.z.mul(0.46).div(rd.z)));
  const lampX = fract(lampPoint.x.div(3.1).add(0.5)).sub(0.5).mul(3.1);
  const lampY = lampPoint.y.sub(room.y.sub(0.58));
  const bulb = below(0.05, length(vec2(lampX, lampY)), 0.02);
  const shadeWidth = mix(float(0.22), float(0.06), smoothstep(0.03, 0.2, lampY));
  const shade = below(shadeWidth, abs(lampX), 0.006).mul(step(0.025, lampY)).mul(below(0.2, lampY, 0.006));
  const cord = below(0.006, abs(lampX), 0.002).mul(step(0.18, lampY));

  const isGarment = isKind(kind, KIND.GARMENTS);
  const mask = max(counterMask.mul(oneMinus(isGarment)), mannequin);
  const color = mix(counter, cloth, mannequin);
  return { mask, color, fixture: max(shade, cord), bulb };
}
