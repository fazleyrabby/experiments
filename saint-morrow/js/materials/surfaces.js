import * as THREE from 'three/webgpu';
import {
  Fn, abs, attribute, cameraPosition, cos, dot, float, floor, fract, length, max, min, mix, mrt, normalMap, normalView,
  normalize, oneMinus, output, positionViewDirection, positionWorld, pow, reflector, saturate, sign, sin, smoothstep, step,
  texture, time, uniform, uv, vec2, vec3, vec4,
} from 'three/tsl';
import { seededRandom } from '../world/geometry.js';
import { homeFurniture, shopForeground, shopWall } from './interiors.js';

const SETS = ['cobble', 'pavement', 'brick', 'stone', 'plaster', 'slate', 'iron'];

/**
 * Keeps additive effects out of the normal and velocity buffers, so AO and TAA ignore their quads.
 * Those buffers alpha-blend (see render/post.js), so writing alpha 0 leaves the opaque data intact.
 */
export const additiveOutputs = () => mrt({ output, normal: vec4(0), velocity: vec4(0) });

export async function loadTextureSets(renderer, names = SETS, folder = './assets/tex') {
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(8, renderer.getMaxAnisotropy());
  const load = async (name, colorSpace) => {
    const map = await loader.loadAsync(`${folder}/${name}.webp`);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = colorSpace;
    map.anisotropy = anisotropy;
    return map;
  };
  const entries = await Promise.all(names.map(async (name) => {
    const [color, normal, orm] = await Promise.all([
      load(`${name}_color`, THREE.SRGBColorSpace),
      load(`${name}_normal`, THREE.NoColorSpace),
      load(`${name}_orm`, THREE.NoColorSpace),
    ]);
    return [name, { color, normal, orm }];
  }));
  return Object.fromEntries(entries);
}

/** Tileable two-channel fractal noise used for puddles and wall streaks. */
export function createNoiseTexture(size = 256) {
  const random = seededRandom(7741);
  const layer = (cells) => {
    const grid = Array.from({ length: cells * cells }, () => random());
    return (x, y) => {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const x0 = Math.floor(fx) % cells;
      const y0 = Math.floor(fy) % cells;
      const x1 = (x0 + 1) % cells;
      const y1 = (y0 + 1) % cells;
      const sx = (fx % 1) * (fx % 1) * (3 - 2 * (fx % 1));
      const sy = (fy % 1) * (fy % 1) * (3 - 2 * (fy % 1));
      const a = grid[x0 + y0 * cells] * (1 - sx) + grid[x1 + y0 * cells] * sx;
      const b = grid[x0 + y1 * cells] * (1 - sx) + grid[x1 + y1 * cells] * sx;
      return a * (1 - sy) + b * sy;
    };
  };
  const lowA = [4, 8, 16, 32].map(layer);
  const lowB = [8, 16, 32, 64].map(layer);
  const fbm = (layers, x, y) => layers.reduce((sum, sample, i) => sum + sample(x, y) / 2 ** (i + 1), 0) / 0.9375;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (x + y * size) * 4;
      data[offset] = fbm(lowA, x, y) * 255;
      data[offset + 1] = fbm(lowB, x, y) * 255;
      data[offset + 3] = 255;
    }
  }
  const noise = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.minFilter = THREE.LinearMipmapLinearFilter;
  noise.magFilter = THREE.LinearFilter;
  noise.generateMipmaps = true;
  noise.needsUpdate = true;
  return noise;
}

const rippleLayer = Fn(([p, t]) => {
  const cell = floor(p);
  const local = fract(p);
  const seed = fract(sin(dot(cell, vec2(127.1, 311.7))).mul(43758.5453));
  const phase = fract(t.mul(0.95).add(seed));
  // Keep every ring inside its grid cell: centres stay 0.32 from the edge and rings fade out by 0.3.
  const center = vec2(fract(seed.mul(7.31)), fract(seed.mul(13.77))).mul(0.36).add(0.32);
  const delta = local.sub(center);
  const radius = length(delta);
  const front = phase.mul(0.26);
  const band = oneMinus(smoothstep(0, 0.05, abs(radius.sub(front))));
  const boundary = oneMinus(smoothstep(0.22, 0.3, radius));
  const active = step(0.35, fract(seed.mul(3.1)));
  const envelope = band.mul(boundary).mul(active).mul(pow(oneMinus(phase), 2));
  return delta.div(radius.add(0.001)).mul(cos(radius.sub(front).mul(70))).mul(envelope);
});

export function createGroundMaterials(sets, noise, scene, environment) {
  const reflection = reflector({ resolutionScale: 0.5, bounces: false });
  reflection.target.rotateX(-Math.PI / 2);
  reflection.target.position.y = 0.002;
  scene.add(reflection.target);

  const baseUv = uv();
  const field = texture(noise, positionWorld.xz.mul(0.031)).r.mul(0.72).add(texture(noise, positionWorld.xz.mul(0.13)).g.mul(0.28));
  const gutter = oneMinus(smoothstep(0, 1.7, abs(abs(positionWorld.x).sub(5))));
  const ripples = rippleLayer(positionWorld.xz.mul(1.6), time).add(rippleLayer(positionWorld.xz.mul(2.7).add(3.1), time.mul(1.17)));
  const sharedDistortion = texture(noise, positionWorld.xz.mul(0.9)).rg.sub(0.5).mul(0.012);
  reflection.uvNode = reflection.uvNode.add(ripples.mul(0.014)).add(sharedDistortion);

  // Staggered flagstones for the sidewalks: dark joints plus per-slab tone variation.
  const flagRows = positionWorld.z.div(0.92);
  const flagRow = floor(flagRows);
  const flagColumn = positionWorld.x.div(1.25).add(fract(flagRow.mul(0.5)));
  const joint = smoothstep(0.476, 0.496, max(abs(fract(flagRows).sub(0.5)), abs(fract(flagColumn).sub(0.5))));
  const slabTone = mix(float(0.74), float(1.2), fract(sin(floor(flagColumn).mul(12.9898).add(flagRow.mul(78.233))).mul(43758.5453)));

  const make = (set, puddleLow, puddleHigh, strength, albedo, flagged = false) => {
    const material = new THREE.MeshStandardNodeMaterial();
    // The planar reflection already carries the sky, so the environment only adds a faint sheen.
    material.envMap = environment;
    material.envMapIntensity = 0.12;
    const color = texture(set.color, baseUv);
    const orm = texture(set.orm, baseUv);
    const normal = texture(set.normal, baseUv).xyz.mul(2).sub(1);
    const cavity = oneMinus(orm.r);
    const puddle = smoothstep(puddleLow, puddleHigh, field.add(gutter.mul(0.17)).add(cavity.mul(0.16))).mul(strength);
    const flat = mix(float(1), float(0.08), puddle);
    const tangent = normalize(vec3(normal.xy.mul(flat).add(ripples.mul(puddle).mul(0.42)), normal.z));
    const fresnel = float(0.035).add(float(0.965).mul(pow(oneMinus(saturate(dot(normalView, positionViewDirection))), 5)));

    const grey = dot(color.rgb, vec3(0.3, 0.59, 0.11));
    const pattern = flagged ? slabTone.mul(oneMinus(joint.mul(0.82))) : float(1);
    const jointRoughness = flagged ? joint.mul(0.34) : float(0);
    material.colorNode = mix(color.rgb, vec3(grey), 0.3).mul(albedo).mul(pattern).mul(mix(float(1), float(0.45), puddle));
    material.roughnessNode = mix(orm.g.mul(0.58).add(0.05).add(jointRoughness), float(0.04), puddle);
    material.metalnessNode = float(0);
    material.aoNode = orm.r;
    material.normalNode = normalMap(tangent.mul(0.5).add(0.5));
    material.emissiveNode = reflection.rgb.mul(fresnel).mul(mix(float(0.42), float(1.15), puddle));
    return material;
  };

  const road = make(sets.cobble, 0.47, 0.56, 1, 0.56);
  const pavement = make(sets.pavement, 0.56, 0.65, 0.82, 0.3, true);

  // The reflector only hides the material that triggered it. Both ground materials sample its
  // texture, so both must be hidden while it renders or WebGPU rejects the pass. Fine ornament
  // is skipped too: it costs a full extra draw and cannot be resolved in a rippled puddle.
  const reflectionHidden = [];
  const reflectionHooks = [];
  const base = reflection.reflector;
  // Effects declare a named `output`, so the reflection target's colour attachment must carry that name.
  const getReflectionTarget = base.getRenderTarget.bind(base);
  base.getRenderTarget = (camera) => {
    const target = getReflectionTarget(camera);
    target.texture.name = 'output';
    return target;
  };
  const renderReflection = base.updateBefore.bind(base);
  base.updateBefore = (frame) => {
    road.visible = false;
    pavement.visible = false;
    const restored = reflectionHidden.filter((mesh) => mesh.visible);
    restored.forEach((mesh) => { mesh.visible = false; });
    reflectionHooks.forEach((hook) => hook.before());
    const result = renderReflection(frame);
    reflectionHooks.forEach((hook) => hook.after());
    restored.forEach((mesh) => { mesh.visible = true; });
    road.visible = true;
    pavement.visible = true;
    return result;
  };
  return { road, pavement, reflectionHidden, reflectionHooks };
}

export function createWallMaterial(set, noise, { wetness = 0.5, normalScale = 1, metal = false } = {}) {
  const material = new THREE.MeshStandardNodeMaterial();
  const baseUv = uv();
  const orm = texture(set.orm, baseUv);
  const along = positionWorld.x.add(positionWorld.z);
  const streak = smoothstep(0.42, 0.72, texture(noise, vec2(along.mul(0.075), positionWorld.y.mul(0.012))).r);
  const splash = oneMinus(smoothstep(0.05, 1.5, positionWorld.y));
  const wet = saturate(streak.mul(wetness).add(splash.mul(0.65)));

  // Large soot patches and damp moss near the pavement stop repeated textures reading as clean tiles.
  const soot = smoothstep(0.34, 0.68, texture(noise, vec2(along.mul(0.021), positionWorld.y.mul(0.027))).g);
  const moss = oneMinus(smoothstep(0.1, 1.15, positionWorld.y)).mul(smoothstep(0.48, 0.62, texture(noise, vec2(along.mul(0.19), positionWorld.y.mul(0.22))).r));
  const aged = texture(set.color, baseUv).rgb.mul(attribute('aTint', 'vec3')).mul(mix(float(0.6), float(1.08), soot));
  material.colorNode = mix(aged, aged.mul(vec3(0.42, 0.52, 0.28)), moss.mul(0.62)).mul(mix(float(0.86), float(0.46), wet));
  material.roughnessNode = orm.g.mul(mix(float(1), float(0.48), wet));
  material.metalnessNode = metal ? orm.b : float(0);
  material.aoNode = orm.r;
  material.normalNode = normalMap(texture(set.normal, baseUv), float(normalScale));
  return material;
}

export function createInteriorMaterial(noise) {
  const material = new THREE.MeshStandardNodeMaterial();
  const local = attribute('aLocal', 'vec2');
  const room = attribute('aRoom', 'vec4');
  const lit = attribute('aLit', 'float');
  const tangent = attribute('aTan', 'vec3');
  const facing = attribute('aFace', 'vec3');
  const seed = room.w;
  const isShop = step(2.6, room.x);

  const view = normalize(positionWorld.sub(cameraPosition));
  const rd = vec3(dot(view, tangent).add(0.00001), view.y.add(0.00001), max(dot(view, facing.negate()), 0.02));
  const ro = vec3(local, 0);
  const tx = sign(rd.x).mul(room.x).sub(ro.x).div(rd.x);
  const ty = sign(rd.y).mul(room.y).sub(ro.y).div(rd.y);
  const tz = room.z.div(rd.z);
  const t = min(tx, min(ty, tz));
  const hit = ro.add(rd.mul(t));

  const isBack = step(tz, min(tx, ty));
  const isHorizontal = step(ty, min(tx, tz));
  const isFloor = isHorizontal.mul(step(rd.y, 0));
  const isCeiling = isHorizontal.mul(step(0, rd.y));
  const isWall = oneMinus(isHorizontal);
  const wallCoord = mix(hit.z, hit.x, isBack);
  const fromFloor = hit.y.add(room.y);

  const paperA = mix(vec3(0.3, 0.19, 0.12), vec3(0.14, 0.21, 0.18), step(0.5, fract(seed.mul(3.7))));
  const paperB = mix(paperA, vec3(0.26, 0.12, 0.13), step(0.72, fract(seed.mul(6.1))));
  const paper = paperB.mul(sin(wallCoord.mul(mix(float(24), float(38), fract(seed.mul(2.3))))).mul(0.09).add(0.95));
  const wainscot = oneMinus(step(0.92, fromFloor));
  const panels = smoothstep(0.03, 0.06, abs(fract(wallCoord.mul(1.3)).sub(0.5)));
  const wall = mix(paper, vec3(0.1, 0.06, 0.035).mul(panels.mul(0.5).add(0.5)), wainscot);

  // Shops dress their walls by trade; upper rooms get a dresser and a picture on the back wall.
  const kind = attribute('aKind', 'float');
  const shelfArea = isShop.mul(isWall).mul(step(0.62, fromFloor));
  const home = homeFurniture(wall, hit.x, fromFloor, seed, isBack.mul(oneMinus(isShop)));
  const dressed = mix(home, shopWall(kind, wallCoord, fromFloor, seed), shelfArea);

  const checker = fract(floor(hit.x.mul(1.7)).add(floor(hit.z.mul(1.7))).mul(0.5)).mul(2);
  const planks = sin(hit.x.mul(19).add(floor(hit.z.mul(0.9)).mul(2.4))).mul(0.14).add(0.86);
  const floorColor = mix(vec3(0.13, 0.08, 0.045).mul(planks), mix(vec3(0.03, 0.03, 0.032), vec3(0.2, 0.19, 0.17), checker), isShop);
  const beams = smoothstep(0.32, 0.38, abs(fract(hit.z.mul(1.25)).sub(0.5)));
  const ceilingColor = mix(vec3(0.4, 0.36, 0.28), vec3(0.09, 0.06, 0.04), beams);
  const surface = mix(mix(dressed, floorColor, isFloor), ceilingColor, isCeiling);

  const repeated = fract(hit.x.div(3.1).add(0.5)).sub(0.5).mul(3.1);
  const lampX = mix(fract(seed.mul(9.1)).sub(0.5).mul(room.x).sub(hit.x).negate(), repeated, isShop);
  const lampOffset = vec3(lampX, hit.y.sub(room.y.sub(0.42)), hit.z.sub(room.z.mul(0.46)));
  const glow = float(1).div(float(1).add(dot(lampOffset, lampOffset).mul(0.72))).add(0.045);
  const lampColor = mix(vec3(1, 0.58, 0.28), vec3(1, 0.76, 0.5), fract(seed.mul(5.3)));

  // Upper rooms: a figure on some back walls, and curtains framing the opening.
  const figureX = hit.x.sub(fract(seed.mul(17.3)).sub(0.5).mul(room.x));
  const head = oneMinus(smoothstep(0.13, 0.15, length(vec2(figureX, fromFloor.sub(1.62)))));
  const body = oneMinus(smoothstep(0.2, 0.25, abs(figureX))).mul(oneMinus(step(1.44, fromFloor)));
  const figure = saturate(head.add(body)).mul(isBack).mul(step(0.8, fract(seed.mul(23.7)))).mul(oneMinus(isShop));
  // Shops fall off harder, leaving pools of lamplight with dim corners instead of an evenly lit wall.
  const falloff = mix(glow.mul(2.6), pow(glow, 1.5).mul(3), isShop);
  const roomLight = surface.mul(falloff).mul(lampColor).mul(oneMinus(figure.mul(0.94)));

  const edge = abs(local.x).div(room.x.mul(0.4));
  const folds = sin(local.x.mul(46).add(seed.mul(30))).mul(0.5).add(0.5);
  const curtain = smoothstep(0.58, 0.76, edge.add(sin(local.y.mul(5).add(seed.mul(17))).mul(0.06))).mul(oneMinus(isShop));
  const curtainColor = mix(vec3(0.3, 0.07, 0.045), vec3(0.2, 0.18, 0.1), fract(seed.mul(11.3))).mul(folds.mul(0.5).add(0.5)).mul(lampColor).mul(0.95);
  const front = shopForeground(ro, rd, room, kind, seed, lampColor);
  const withCounter = mix(roomLight, front.color, front.mask.mul(isShop));
  const withFixtures = mix(withCounter, vec3(0.012, 0.01, 0.008), front.fixture.mul(isShop));
  const lamps = lampColor.mul(front.bulb).mul(isShop).mul(6.5);
  const interior = mix(withFixtures.add(lamps), curtainColor, curtain);

  // Rain running down the glass breaks up the view into the room.
  const along = positionWorld.x.add(positionWorld.z);
  const runnels = smoothstep(0.32, 0.62, texture(noise, vec2(along.mul(0.72), positionWorld.y.mul(0.055).add(time.mul(0.012)))).r);
  const droplets = smoothstep(0.62, 0.7, texture(noise, vec2(along.mul(3.4), positionWorld.y.mul(2.1))).g);

  material.colorNode = vec3(0.012, 0.014, 0.018);
  material.roughnessNode = mix(float(0.06), float(0.24), droplets);
  material.metalnessNode = float(0);
  material.emissiveNode = interior.mul(lit).mul(mix(float(0.66), float(1), runnels)).mul(oneMinus(droplets.mul(0.3)));
  return material;
}

export function createStainedGlassMaterial() {
  const material = new THREE.MeshBasicNodeMaterial();
  const p = attribute('aLocal', 'vec2');
  const radius = length(p);
  const angle = p.y.atan(p.x);
  const wedge = angle.div(Math.PI * 2).add(0.5).mul(12);
  const ringCoord = radius.mul(1.25);
  const wedgeEdge = abs(fract(wedge).sub(0.5));
  const ringEdge = abs(fract(ringCoord).sub(0.5));
  const lead = oneMinus(smoothstep(0.42, 0.5, wedgeEdge)).mul(oneMinus(smoothstep(0.41, 0.5, ringEdge))).mul(smoothstep(0.12, 0.2, radius));

  // Each cell breaks into small hand-cut panes, mostly cobalt with ruby and amber accents.
  const paneCoord = vec2(wedge.mul(3), ringCoord.mul(2.4));
  const paneId = floor(paneCoord);
  const hash = fract(sin(dot(paneId, vec2(12.9898, 78.233))).mul(43758.5453));
  const paneEdge = max(abs(fract(paneCoord.x).sub(0.5)), abs(fract(paneCoord.y).sub(0.5)));
  const paneLead = oneMinus(smoothstep(0.43, 0.5, paneEdge));
  const hue = mix(mix(vec3(0.035, 0.1, 0.46), vec3(0.5, 0.045, 0.05), step(0.62, hash)), vec3(0.66, 0.36, 0.07), step(0.88, hash));
  const tone = fract(hash.mul(7.7)).mul(0.62).add(0.38);
  const backlight = oneMinus(smoothstep(0, 3.4, radius)).mul(0.5).add(0.5);
  const pulse = uniform(1);
  material.colorNode = hue.mul(tone).mul(lead).mul(paneLead).mul(backlight).mul(pulse).mul(0.9).add(vec3(0.003));
  material.userData.pulse = pulse;
  return material;
}

export function createGlowMaterial(color, intensity) {
  const material = new THREE.MeshBasicNodeMaterial();
  material.colorNode = vec3(new THREE.Color(color)).mul(intensity);
  return material;
}

export function createLightConeMaterial(color) {
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const facing = pow(abs(dot(normalView, positionViewDirection)), 2.6);
  material.colorNode = vec3(new THREE.Color(color));
  material.opacityNode = facing.mul(pow(uv().y, 1.7)).mul(0.06);
  material.mrtNode = additiveOutputs();
  return material;
}
