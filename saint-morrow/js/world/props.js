import * as THREE from 'three/webgpu';
import { texture, uniform, vec3 } from 'three/tsl';
import { additiveOutputs } from '../materials/surfaces.js';
import { metricBox, scaleUv, seededRandom } from './geometry.js';

const LAMP_SCALE = 1.25;
const IRON = [0.12, 0.13, 0.14];
const _m = new THREE.Matrix4();

function box(ctx, key, width, height, depth, x, y, z, tint = IRON, tile = 1.2) {
  ctx.batches.add(key, metricBox(width, height, depth, tile), _m.makeTranslation(x, y, z), tint);
}

export function addLamp(ctx, x, z) {
  ctx.props.place('lamp', { x, y: 0.15, z, scale: LAMP_SCALE, solid: false });
  ctx.colliders.box(0.36, 4.8, 0.36, x, 2.55, z);
  const height = ctx.props.library.lamp.size.y * LAMP_SCALE;
  const lantern = new THREE.Vector3(x, 0.15 + height - 0.46, z);
  const bulb = new THREE.SphereGeometry(0.075, 12, 8);
  bulb.scale(1, 1.45, 1);
  bulb.translate(lantern.x, lantern.y, lantern.z);
  ctx.batches.add('lantern', bulb, null, [1, 1, 1]);
  return lantern;
}

function addManhole(ctx, x, z) {
  const plate = new THREE.CylinderGeometry(0.44, 0.44, 0.014, 32);
  scaleUv(plate, 0.9);
  plate.translate(x, 0.008, z);
  ctx.batches.add('iron', plate, null, [0.2, 0.2, 0.2]);
  const rim = new THREE.TorusGeometry(0.455, 0.022, 6, 32);
  rim.rotateX(Math.PI / 2);
  rim.translate(x, 0.016, z);
  ctx.batches.add('iron', rim, null, [0.16, 0.16, 0.16]);
  for (let i = -3; i <= 3; i++) {
    const half = Math.sqrt(Math.max(0.15 - (i * 0.1) ** 2, 0.01));
    box(ctx, 'iron', half * 2, 0.012, 0.028, x, 0.019, z + i * 0.1, [0.28, 0.27, 0.25]);
  }
}

function addGutterDrain(ctx, side, z) {
  const x = side * 4.72;
  box(ctx, 'iron', 0.46, 0.012, 0.86, x, 0.008, z, [0.08, 0.08, 0.08]);
  for (let i = -4; i <= 4; i++) box(ctx, 'iron', 0.42, 0.018, 0.035, x, 0.016, z + i * 0.085, [0.2, 0.2, 0.19]);
}

function addTramRails(ctx) {
  for (const x of [-2.72, -1.28, 1.28, 2.72]) {
    box(ctx, 'iron', 0.068, 0.012, 120, x, 0.009, 0, [0.38, 0.37, 0.36], 1.6);
    box(ctx, 'iron', 0.032, 0.006, 120, x + 0.058, 0.004, 0, [0.04, 0.04, 0.04], 1.6);
  }
}

function addCable(ctx, from, to, sag) {
  const mid = from.clone().lerp(to, 0.5);
  mid.y -= sag;
  const tube = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(from, mid, to), 22, 0.012, 5);
  ctx.batches.add('iron', tube, null, [0.06, 0.06, 0.06]);
}

function addTrashCluster(ctx, side, z, random) {
  const wall = side * 7.46;
  const rotation = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  ctx.props.place('bin', { x: wall, z, rotY: random() * Math.PI, scale: 1.08 });
  if (random() > 0.35) ctx.props.place('binClean', { x: wall, z: z + 0.72, rotY: random() * Math.PI, scale: 1.04 });
  ctx.props.place('bag', { x: wall + side * -0.46, y: 0.15, z: z - 0.56, rotY: random() * 6, scale: 1.08, solid: false });
  ctx.props.place('bag', { x: wall + side * -0.16, y: 0.15, z: z - 0.98, rotY: random() * 6, scale: 0.92, solid: false });
  ctx.props.place('carton', { x: wall + side * 0.05, y: 0.15, z: z + 1.46, rotY: rotation + 0.4, solid: false });
  ctx.props.place('can', { x: wall - side * 0.72, y: 0.15, z: z + 0.42, rotY: random() * 6, tiltX: Math.PI / 2, scale: 1, solid: false });
}

function addCrateStack(ctx, side, z, random) {
  const x = side * 7.42;
  const rotation = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  ctx.props.place('crate', { x, y: 0.15, z, rotY: rotation + 0.06 });
  ctx.props.place('crate', { x: x + side * 0.03, y: 0.5, z: z + 0.08, rotY: rotation - 0.13, scale: 0.92, solid: false });
  ctx.props.place('barrel', { x: x - side * 0.06, y: 0.15, z: z + 1.05, rotY: random() * 6 });
  ctx.props.place('tyre', { x: x - side * 0.24, y: 0.15, z: z - 0.88, rotY: rotation, tiltX: -0.28, solid: false });
}

export function addStreetProps(ctx) {
  const random = seededRandom(9127);
  addTramRails(ctx);
  for (let z = -48; z <= 48; z += 16) addManhole(ctx, (Math.abs(z) % 32 === 0 ? 1 : -1) * 0.1, z + 3.4);
  for (let z = -54; z <= 54; z += 18) {
    addGutterDrain(ctx, 1, z);
    addGutterDrain(ctx, -1, z + 9);
  }

  addTrashCluster(ctx, 1, -34, random);
  addTrashCluster(ctx, -1, -9, random);
  addTrashCluster(ctx, 1, 18, random);
  addTrashCluster(ctx, -1, 41, random);
  addCrateStack(ctx, -1, -27, random);
  addCrateStack(ctx, 1, 13, random);

  for (const [x, z] of [[-5.56, -39], [5.56, 3], [-5.56, 27]]) ctx.props.place('hydrant', { x, y: 0.15, z, rotY: random() * 6, scale: 1.05 });
  for (const [side, z] of [[1, -15], [-1, 15], [1, 34]]) {
    ctx.props.place('bench', { x: side * 7.25, y: 0.15, z, rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2 });
  }
  for (const [name, side, z] of [['utilityA', 1, -44], ['utilityB', -1, 4], ['utilityA', -1, 33], ['utilityB', 1, 26]]) {
    ctx.props.place(name, { x: side * 7.74, y: 0.15, z, rotY: side > 0 ? -Math.PI / 2 : Math.PI / 2, scale: 0.92 });
  }
  ctx.props.place('car', { x: 3.82, y: 0, z: -11, rotY: 0.012 });
  ctx.props.place('car', { x: -3.82, y: 0, z: 22, rotY: Math.PI - 0.018 });
  ctx.props.place('rat', { x: 7.02, y: 0.155, z: -32.6, rotY: 2.2, solid: false });
  ctx.props.place('rat', { x: -6.9, y: 0.155, z: -10.1, rotY: -0.9, scale: 0.9, solid: false });

  for (let i = 0; i < 8; i++) {
    const z = -50 + i * 14;
    addCable(ctx, new THREE.Vector3(-8, 9.9 + (i % 3), z), new THREE.Vector3(8, 11.2 - (i % 2), z + 3.4), 0.86);
    if (i % 2 === 0) addCable(ctx, new THREE.Vector3(-8, 8.8 + (i % 3), z + 1.2), new THREE.Vector3(8, 9.8 - (i % 2), z + 4.2), 0.72);
  }
}

function signCanvas(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 86px Georgia, "Times New Roman", serif';
  const letters = [...text];
  const step = Math.min(92, 590 / letters.length);
  const start = canvas.height / 2 - (step * (letters.length - 1)) / 2;
  context.shadowColor = color;
  for (const blur of [26, 10, 0]) {
    context.shadowBlur = blur;
    context.fillStyle = blur ? color : '#fff6ea';
    letters.forEach((letter, i) => context.fillText(letter, canvas.width / 2, start + i * step));
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}

export function addBladeSign(ctx, parent, { text, color, x, y, z, side }) {
  const height = Math.max(2.7, text.length * 0.56);
  const width = height / 4;
  const signX = x - side * (width / 2 + 0.28);
  box(ctx, 'iron', width + 0.1, height + 0.1, 0.09, signX, y, z, [0.09, 0.1, 0.11]);
  box(ctx, 'iron', width + 0.16, 0.05, 0.13, signX, y + height / 2 + 0.05, z, IRON);
  box(ctx, 'iron', width + 0.16, 0.05, 0.13, signX, y - height / 2 - 0.05, z, IRON);
  for (const k of [-0.36, 0.36]) box(ctx, 'iron', 0.3, 0.04, 0.04, x - side * 0.14, y + k * height, z);

  const level = uniform(1);
  const map = signCanvas(text, color);
  const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide });
  const sample = texture(map);
  material.colorNode = sample.rgb.mul(vec3(3.3)).mul(level);
  material.opacityNode = sample.a;
  material.mrtNode = additiveOutputs();
  const geometry = new THREE.PlaneGeometry(width, height);
  for (const face of [1, -1]) {
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(signX, y, z + face * 0.052);
    plane.rotation.y = face > 0 ? 0 : Math.PI;
    parent.add(plane);
  }

  const light = new THREE.PointLight(color, 13, 10, 2);
  light.position.set(signX - side * 0.25, y, z);
  parent.add(light);
  const seed = text.length * 1.37 + z * 0.13;
  return {
    update(time) {
      const buzz = 0.94 + Math.sin(time * 41 + seed) * 0.03;
      const dropout = Math.sin(time * 0.71 + seed) > 0.985 && Math.sin(time * 37 + seed) > -0.2 ? 0.16 : 1;
      level.value = buzz * dropout;
      light.intensity = 13 * level.value;
    },
  };
}
