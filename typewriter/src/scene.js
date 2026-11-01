import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { COLUMNS } from './document.js';

const TAU = Math.PI * 2;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export class TypewriterScene {
  constructor(container, { onKey, onReady, onError }) {
    this.container = container;
    this.onKey = onKey;
    this.keys = new Map();
    this.keyMeshes = [];
    this.pressedKeys = [];
    this.strikes = [];
    this.row = 0;
    this.column = 0;
    this.carriageTarget = 1.82;
    this.pageAdvance = 0;
    this.dark = document.documentElement.dataset.theme === 'dark';
    this.view = 'studio';
    this.cameraTransition = null;
    this.lastFrame = performance.now();
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    } catch (error) { onError(error); return; }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.localClippingEnabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.append(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !reducedMotion.matches;
    this.controls.dampingFactor = .07;
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 60;
    this.controls.minPolarAngle = .18;
    this.controls.maxPolarAngle = Math.PI * .48;
    this.controls.addEventListener('start', () => { this.cameraTransition = null; });
    this.setupLighting();
    this.setupMaterials();
    this.buildMachine();
    this.setTheme(this.dark);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.setupPicking();
    this.resize();
    this.setView('studio', true);
    this.renderer.setAnimationLoop(() => this.animate());
    requestAnimationFrame(onReady);
  }

  setupLighting() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, .04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .8;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xfaf7ec, 0x4e5a43, 1.8));
    const key = new THREE.DirectionalLight(0xfff4de, 3.0);
    key.position.set(-5, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -11, right: 11, top: 10, bottom: -10, near: .5, far: 40 });
    key.shadow.bias = -.0004;
    key.shadow.normalBias = .035;
    key.shadow.radius = 5;
    key.shadow.blurSamples = 8;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xe5ede3, 1.6);
    fill.position.set(6, 5, -4);
    this.scene.add(fill);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0xe7e8df, toneMapped: false }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = .02;
    this.ground = ground;
    this.scene.add(ground);
    const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .18 }));
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = .023;
    shadowFloor.receiveShadow = true;
    this.scene.add(shadowFloor);
    // A radial contact shadow keeps the machine grounded between the small mechanical feet.
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(24,35,22,.32)');
    gradient.addColorStop(.5, 'rgba(24,35,22,.18)');
    gradient.addColorStop(1, 'rgba(24,35,22,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, .025, .3);
    this.scene.add(shadow);
  }

  setupMaterials() {
    const grain = document.createElement('canvas');
    grain.width = grain.height = 256;
    const ctx = grain.getContext('2d');
    const data = ctx.createImageData(256, 256);
    let seed = 9301;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const value = 120 + (seed % 25);
      data.data.set([value, value, value, 255], i);
    }
    ctx.putImageData(data, 0, 0);
    const texture = new THREE.CanvasTexture(grain);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    this.materials = {
      enamel: new THREE.MeshPhysicalMaterial({ color: 0x254638, metalness: .4, roughness: .32, clearcoat: .55, clearcoatRoughness: .28, bumpMap: texture, bumpScale: .012 }),
      enamelDark: new THREE.MeshStandardMaterial({ color: 0x214135, metalness: .35, roughness: .43 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xc8ccbd, metalness: .94, roughness: .24 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x777e72, metalness: .85, roughness: .38 }),
      black: new THREE.MeshStandardMaterial({ color: 0x171d18, roughness: .72, metalness: .15 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x242923, roughness: .95 }),
      ivory: new THREE.MeshPhysicalMaterial({ color: 0xe6dfc7, roughness: .38, clearcoat: .3 }),
      ribbon: new THREE.MeshStandardMaterial({ color: 0x201c1c, roughness: .95, side: THREE.DoubleSide }),
      redRibbon: new THREE.MeshStandardMaterial({ color: 0x714039, roughness: .9, side: THREE.DoubleSide }),
      bronze: new THREE.MeshStandardMaterial({ color: 0x8b7850, metalness: .8, roughness: .32 }),
    };
  }

  box(parent, size, position, material, radius = .05) {
    const geometry = radius ? new RoundedBoxGeometry(...size, 3, radius) : new THREE.BoxGeometry(...size);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  cylinder(parent, radius, height, position, material, rotationZ = 0, segments = 40) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
    mesh.position.set(...position);
    mesh.rotation.z = rotationZ;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  rod(parent, start, end, radius, material) {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const mesh = this.cylinder(parent, radius, a.distanceTo(b), [0, 0, 0], material, 0, 10);
    mesh.position.copy(a.clone().add(b).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return mesh;
  }

  makeLabel(text, { width = 256, height = 128, fontSize = 44, color = '#c4c6ae', font = 'Georgia', background = null, spacing = 0 } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, width, height); }
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, width / 2, height / 2 + 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  buildMachine() {
    const m = this.materials;
    this.machine = new THREE.Group();
    this.scene.add(this.machine);
    for (const x of [-2.9, 2.9]) for (const z of [-1.65, 1.9]) {
      this.cylinder(this.machine, .34, .24, [x, .18, z], m.rubber);
      this.cylinder(this.machine, .25, .08, [x, .32, z], m.steel);
    }
    this.box(this.machine, [7.55, .64, 5.25], [0, .65, .15], m.enamel, .3);
    this.box(this.machine, [7.3, .16, 4.85], [0, .38, .15], m.enamelDark, .07);
    // Raised shoulders frame an open, sloping keyboard bed, rather than a solid rectangular case.
    for (const x of [-3.46, 3.46]) {
      const side = this.box(this.machine, [.63, .76, 4.55], [x, 1.03, .05], m.enamel, .22);
      side.rotation.x = .14;
      const trim = this.box(this.machine, [.035, .045, 3.9], [x * .93, 1.32, .22], m.chrome, .015);
      trim.rotation.x = .15;
    }
    this.box(this.machine, [7.25, .8, 1.32], [0, 1.31, -1.57], m.enamel, .25);
    const deck = this.box(this.machine, [6.65, .12, 3.65], [0, 1.02, .50], m.black, .13);
    deck.rotation.x = .18;
    this.box(this.machine, [6.55, .31, .35], [0, .95, 2.50], m.enamel, .11);
    const frontTrim = this.box(this.machine, [6.3, .035, .045], [0, 1.11, 2.66], m.chrome, .014);
    frontTrim.castShadow = false;
    const cover = this.box(this.machine, [6.45, .29, .93], [0, 1.54, -1.06], m.enamel, .12);
    cover.rotation.x = .14;
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .30), new THREE.MeshStandardMaterial({ map: this.makeLabel('keystroke', { fontSize: 40, font: 'Georgia', color: '#d1d0ac', spacing: 1 }), transparent: true, roughness: .5, metalness: .2, depthWrite: false }));
    badge.position.set(0, 1.57, -.55);
    badge.rotation.x = -.28;
    this.machine.add(badge);
    // Ribbon spools, hubs, and fan of individual steel typebars.
    for (const x of [-2.02, 2.02]) {
      this.cylinder(this.machine, .69, .10, [x, 1.78, -1.40], m.black);
      this.cylinder(this.machine, .53, .07, [x, 1.85, -1.40], m.steel);
      this.cylinder(this.machine, .38, .08, [x, 1.88, -1.40], m.ribbon);
      this.cylinder(this.machine, .12, .17, [x, 1.91, -1.40], m.chrome);
      for (let k = 0; k < 6; k++) {
        const angle = k / 6 * TAU;
        this.cylinder(this.machine, .065, .014, [x + Math.cos(angle) * .46, 1.895, -1.4 + Math.sin(angle) * .46], m.black, 0, 16);
      }
    }
    for (let i = 0; i < 36; i++) {
      const angle = -.95 + i / 35 * 1.9;
      const start = [Math.sin(angle) * 1.70, 1.66, -1.72 + Math.cos(angle) * .65];
      const end = [Math.sin(angle) * .46, 1.92, -1.72 + Math.cos(angle) * .26];
      this.rod(this.machine, start, end, .022, i % 3 === 0 ? m.chrome : m.steel);
    }
    this.box(this.machine, [4.2, .105, .025], [0, 2.01, -1.64], m.ribbon, 0);
    this.box(this.machine, [4.2, .085, .026], [0, 1.92, -1.64], m.redRibbon, 0);
    for (const x of [-.28, .28]) {
      this.rod(this.machine, [x, 1.83, -1.46], [x, 2.24, -1.68], .032, m.chrome);
      this.box(this.machine, [.055, .19, .04], [x, 2.17, -1.68], m.chrome, .01);
    }
    this.typebar = new THREE.Group();
    this.typebar.position.set(0, 1.48, -.45);
    this.rod(this.typebar, [0, 0, 0], [0, .1, -1.2], .038, m.chrome);
    this.box(this.typebar, [.17, .10, .14], [0, .1, -1.2], m.steel, .02);
    this.machine.add(this.typebar);
    this.typebar.visible = false;

    this.buildKeys();
    this.buildCarriage();
    // Small case screws, ribbon selector, and a mechanical line-spacing lever.
    for (const x of [-3.43, 3.43]) for (const z of [-1.35, 1.9]) {
      this.cylinder(this.machine, .064, .018, [x, 1.35 - (z + 1.35) * .09, z], m.chrome, 0, 16);
      this.box(this.machine, [.067, .006, .011], [x, 1.361 - (z + 1.35) * .09, z], m.black, 0);
    }
    this.rod(this.machine, [3.0, 1.6, -.7], [3.0, 1.91, -.83], .035, m.chrome);
    this.cylinder(this.machine, .08, .12, [3, 1.96, -.83], m.redRibbon, 0, 20);
    for (let i = 0; i < 12; i++) this.box(this.machine, [.022, .015, .32], [-2.5 + i * .055, 1.72, -1.0], m.black, .004);
  }

  buildKeys() {
    const m = this.materials;
    const rows = [
      { chars: '1234567890', z: -.32, offset: 0 },
      { chars: 'QWERTYUIOP', z: .32, offset: -.14 },
      { chars: 'ASDFGHJKL;', z: .96, offset: -.02 },
      { chars: 'ZXCVBNM,.?', z: 1.60, offset: .12 },
    ];
    const keyGeometry = new THREE.CylinderGeometry(.224, .245, .125, 32);
    const rimGeometry = new THREE.TorusGeometry(.226, .018, 8, 32);
    const topGeometry = new THREE.CircleGeometry(.214, 32);
    rows.forEach((row, rowIndex) => {
      for (let col = 0; col < row.chars.length; col++) {
        const char = row.chars[col];
        const x = (col - 4.5) * .574 + row.offset;
        const y = 1.15 + (1.6 - row.z) * .19;
        this.rod(this.machine, [x, y - .18, row.z + .08], [x, y + .02, row.z], .045, m.steel);
        const key = new THREE.Group();
        key.position.set(x, y + .09, row.z);
        key.rotation.x = .16;
        key.userData = { char, restY: key.position.y, row: rowIndex };
        const cap = new THREE.Mesh(keyGeometry, m.ivory);
        cap.castShadow = true;
        cap.receiveShadow = true;
        key.add(cap);
        const rim = new THREE.Mesh(rimGeometry, m.chrome);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = .064;
        key.add(rim);
        const label = new THREE.Mesh(topGeometry, new THREE.MeshBasicMaterial({ toneMapped: false, map: this.makeLabel(char, { width: 128, height: 128, fontSize: 57, color: '#333b30', font: 'Georgia', background: '#e7dfc8' }) }));
        label.rotation.x = -Math.PI / 2;
        label.position.y = .064;
        label.userData.key = key;
        cap.userData.key = key;
        key.add(label);
        this.keyMeshes.push(label, cap);
        this.keys.set(char.toLowerCase(), key);
        this.machine.add(key);
      }
    });
    for (const [x, text, char] of [[-3.02, '⇧', 'Shift'], [3.02, '⇧', 'ShiftRight']]) {
      const key = new THREE.Group();
      key.position.set(x, 1.18, 1.57);
      key.userData = { char, restY: 1.18 };
      this.box(key, [.48, .14, .53], [0, 0, 0], m.ivory, .09);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(.30, .28), new THREE.MeshBasicMaterial({ map: this.makeLabel(text, { width: 128, height: 128, fontSize: 70, color: '#414638' }), transparent: true, depthWrite: false }));
      label.rotation.x = -Math.PI / 2;
      label.position.y = .075;
      key.add(label);
      this.machine.add(key);
      this.keys.set(char.toLowerCase(), key);
    }
    const space = new THREE.Group();
    space.position.set(0, 1.04, 2.23);
    space.userData = { char: ' ', restY: 1.04 };
    const bar = this.box(space, [3.9, .17, .34], [0, 0, 0], m.ivory, .08);
    bar.userData.key = space;
    this.machine.add(space);
    this.keyMeshes.push(bar);
    this.keys.set(' ', space);
    for (const x of [-2.7, 2.7]) this.box(this.machine, [.42, .17, .3], [x, 1.05, 2.22], m.enamelDark, .04);
  }

  buildCarriage() {
    const m = this.materials;
    this.carriage = new THREE.Group();
    this.carriage.position.x = this.carriageTarget;
    this.machine.add(this.carriage);
    for (const z of [-1.95, -2.25]) this.cylinder(this.machine, .075, 8.05, [0, 1.91, z], m.chrome, Math.PI / 2);
    this.box(this.carriage, [7.95, .19, .38], [0, 2.00, -2.02], m.enamelDark, .06);
    this.platen = this.cylinder(this.carriage, .29, 6.9, [0, 2.20, -1.97], m.rubber, Math.PI / 2, 64);
    for (const x of [-3.55, 3.55]) {
      this.cylinder(this.carriage, .17, .33, [x, 2.2, -1.97], m.chrome, Math.PI / 2);
      this.cylinder(this.carriage, .31, .28, [x * 1.11, 2.20, -1.97], m.black, Math.PI / 2, 48);
      this.cylinder(this.carriage, .22, .025, [x * 1.155, 2.20, -1.97], m.chrome, Math.PI / 2);
      for (let j = 0; j < 20; j++) {
        const a = j / 20 * TAU;
        this.rod(this.carriage, [x * 1.11 - .12, 2.2 + Math.sin(a) * .305, -1.97 + Math.cos(a) * .305], [x * 1.11 + .12, 2.2 + Math.sin(a) * .305, -1.97 + Math.cos(a) * .305], .012, m.steel);
      }
      this.box(this.carriage, [.22, .66, .62], [x * .96, 2.0, -2.02], m.enamel, .07);
    }
    this.rod(this.carriage, [-3.57, 2.32, -2.00], [-4.12, 2.66, -1.46], .055, m.chrome);
    this.rod(this.carriage, [-4.12, 2.66, -1.46], [-4.25, 2.66, -.38], .055, m.chrome);
    this.box(this.carriage, [.27, .13, .74], [-4.25, 2.66, -.18], m.ivory, .06);
    this.box(this.carriage, [6.1, .045, .3], [0, 2.53, -2.12], m.steel, .02);
    for (let i = 0; i < 47; i++) this.box(this.carriage, [.014, .008, i % 5 === 0 ? .15 : .08], [-2.9 + i * .126, 2.557, -2.08], m.ivory, 0);
    this.paper = this.createPaper();
    this.carriage.add(this.paper);
    // A chrome paper bail and two rubber rollers sit in front of the sheet.
    this.cylinder(this.carriage, .035, 6.30, [0, 2.38, -1.63], m.chrome, Math.PI / 2);
    for (const x of [-2.06, 2.06]) {
      this.cylinder(this.carriage, .11, .28, [x, 2.38, -1.63], m.rubber, Math.PI / 2);
      this.rod(this.carriage, [x, 2.38, -1.63], [x, 2.18, -2.14], .028, m.chrome);
    }
    this.box(this.machine, [.10, .14, .045], [0, 2.50, -1.60], m.redRibbon, .012);
    this.updatePaper({ lines: [''], row: 0, column: 0 });
  }

  createPaper() {
    this.paperCanvas = document.createElement('canvas');
    this.paperCanvas.width = 1400;
    this.paperCanvas.height = 1680;
    this.paperContext = this.paperCanvas.getContext('2d');
    this.paperTexture = new THREE.CanvasTexture(this.paperCanvas);
    this.paperTexture.colorSpace = THREE.SRGBColorSpace;
    this.paperTexture.anisotropy = Math.min(16, this.renderer.capabilities.getMaxAnisotropy());
    const geometry = new THREE.PlaneGeometry(5.15, 5.8, 28, 54);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      const x = positions.getX(i);
      // Subtle curved shoulders and a curled top edge catch the studio light.
      const t = (y + 2.9) / 5.8;
      positions.setZ(i, -.11 * Math.pow(t, 4) + .025 * Math.cos(x * 1.2) * t * t);
    }
    geometry.computeVertexNormals();
    // Keep the printed ink true to its texture under the bright studio lights.
    const material = new THREE.MeshBasicMaterial({ map: this.paperTexture, toneMapped: false, side: THREE.DoubleSide, clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.32)], clipShadows: true });
    const paper = new THREE.Mesh(geometry, material);
    paper.position.set(0, 2.8, -1.88);
    paper.rotation.x = -.065;
    paper.castShadow = true;
    paper.receiveShadow = true;
    return paper;
  }

  updatePaper(layout) {
    const { lines, row, column } = layout;
    const ctx = this.paperContext;
    const w = this.paperCanvas.width, h = this.paperCanvas.height;
    ctx.fillStyle = '#f5f0df';
    ctx.fillRect(0, 0, w, h);
    // Deterministic fibers stay fixed to the sheet as the text changes.
    let seed = 5932;
    for (let i = 0; i < 22000; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed % w;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = seed % h;
      ctx.fillStyle = i % 3 ? 'rgba(105,89,56,.027)' : 'rgba(255,255,248,.12)';
      ctx.fillRect(x, y, 1, 2);
    }
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, 'rgba(144,121,75,.12)');
    edge.addColorStop(.025, 'rgba(144,121,75,0)');
    edge.addColorStop(.975, 'rgba(144,121,75,0)');
    edge.addColorStop(1, 'rgba(144,121,75,.10)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, w, h);
    const advance = Math.min(row, 7) * .20;
    const charWidth = 30;
    const lineHeight = 72;
    const baseline = 898 + advance / 5.8 * h;
    ctx.font = '47px "Special Elite", "Courier New", monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    lines.forEach((line, lineIndex) => {
      const y = baseline - (row - lineIndex) * lineHeight;
      for (let i = 0; i < line.length; i++) {
        const variation = ((lineIndex * 19 + i * 7) % 11) / 180;
        ctx.fillStyle = `rgba(16,20,15,${.94 + variation})`;
        ctx.fillText(line[i], 156 + i * charWidth, y + Math.sin(i * 9.3 + lineIndex) * 1.1);
      }
    });
    this.paperTexture.needsUpdate = true;
    this.pageAdvance = advance;
    this.carriageTarget = 2.0 - column * (5.15 * charWidth / w);
    this.row = row;
    this.column = column;
  }

  strike(char) {
    const key = this.keys.get(char.toLowerCase()) || this.keys.get('?');
    if (key && !reducedMotion.matches) {
      this.pressedKeys = this.pressedKeys.filter(item => item.key !== key);
      this.pressedKeys.push({ key, time: performance.now() });
    }
    if (char !== ' ' && char !== '\n' && !reducedMotion.matches) this.strikes.push(performance.now());
  }

  setupPicking() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = null;
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      down = null;
      const rect = canvas.getBoundingClientRect();
      pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, this.camera);
      const hit = raycaster.intersectObjects(this.keyMeshes)[0];
      if (hit) this.onKey(hit.object.userData.key.userData.char);
      else this.container.dispatchEvent(new CustomEvent('write-focus'));
    });
  }

  setTheme(dark) {
    if (!this.renderer) return;
    this.dark = dark;
    const color = new THREE.Color(dark ? '#2d382f' : '#e7e8df');
    this.scene.background = color;
    this.ground.material.color.copy(color);
    this.scene.fog = new THREE.Fog(color, 27, 65);
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (!this.initialized) { this.initialized = true; this.setView(this.view, true); }
    if (this.lastAspect && Math.abs(this.lastAspect - this.camera.aspect) > this.lastAspect * .2) this.setView(this.view, true);
    this.lastAspect = this.camera.aspect;
  }

  setView(name, instant = false) {
    if (!this.renderer) return;
    this.view = name;
    const views = {
      studio: { position: [8.3, 8.3, 13.4], target: [.55, 2.6, -.15] },
      paper: { position: [.7, 5.1, 10.1], target: [.4, 3.7, -1.8] },
      detail: { position: [6.3, 6.8, 7.5], target: [0, 1.35, .4] },
    };
    const view = views[name] || views.studio;
    const position = new THREE.Vector3(...view.position), target = new THREE.Vector3(...view.target);
    const minimumAspect = name === 'studio' ? 1.2 : .75;
    position.sub(target).multiplyScalar(Math.max(1, minimumAspect / this.camera.aspect)).add(target);
    if (instant || reducedMotion.matches) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
    } else this.cameraTransition = { position, target };
  }

  animate() {
    const time = performance.now();
    const dt = Math.min((time - this.lastFrame) / 1000, .05);
    this.lastFrame = time;
    const smoothing = 1 - Math.exp(-14 * dt);
    this.carriage.position.x = THREE.MathUtils.lerp(this.carriage.position.x, this.carriageTarget, reducedMotion.matches ? 1 : smoothing);
    this.paper.position.y = THREE.MathUtils.lerp(this.paper.position.y, 2.8 + this.pageAdvance, smoothing);
    this.platen.rotation.x = -this.pageAdvance / .29;
    this.pressedKeys = this.pressedKeys.filter(item => {
      const elapsed = (time - item.time) / 160;
      item.key.position.y = item.key.userData.restY - Math.sin(Math.min(elapsed, 1) * Math.PI) * .14;
      return elapsed < 1;
    });
    this.strikes = this.strikes.filter(t => time - t < 110);
    this.typebar.visible = this.strikes.length > 0;
    if (this.strikes.length) this.typebar.rotation.x = Math.sin(Math.min(1, (time - this.strikes.at(-1)) / 110) * Math.PI) * .65;
    if (this.cameraTransition) {
      const alpha = 1 - Math.exp(-5 * dt);
      this.camera.position.lerp(this.cameraTransition.position, alpha);
      this.controls.target.lerp(this.cameraTransition.target, alpha);
      if (this.camera.position.distanceTo(this.cameraTransition.position) < .006) this.cameraTransition = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver?.disconnect();
    this.renderer?.setAnimationLoop(null);
    this.controls?.dispose();
    this.scene?.traverse(object => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (!material) continue;
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose();
      }
    });
    this.environment?.dispose();
    this.renderer?.dispose();
  }
}
