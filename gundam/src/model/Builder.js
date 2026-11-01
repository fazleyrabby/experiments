import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const SECTION_LABELS = {
  feet: 'Foot and ankle assemblies', legs: 'Leg armor and knee guards', waist: 'Waist and skirt armor',
  torso: 'Chest armor and cooling vents', arms: 'Shoulder and arm assemblies', head: 'Head unit and V-fin',
  backpack: 'Backpack and beam sabers', equipment: 'Shield and beam rifle', frame: 'Mechanical inner frame',
};

const COLORS = {
  white: [0xc8d0d2, .52, .20], whiteLight: [0xe9edeb, .46, .17], whiteDark: [0x879ba7, .49, .28],
  blue: [0x233e92, .43, .25], blueLight: [0x354fa5, .43, .23], blueDark: [0x172550, .46, .35],
  red: [0xa71d2c, .45, .22], redLight: [0xcb2835, .43, .22], yellow: [0xd7a64c, .39, .5],
  dark: [0x222b31, .45, .65], black: [0x0d151a, .55, .38], steel: [0x6c7c84, .3, .82],
  silver: [0xb9c6ca, .24, .86], gold: [0x9c7439, .32, .73], eye: [0xffc128, .2, .3], sensor: [0x5ecb9d,.22,.35],
};

/** All body panels are generated from chamfered profiles, not external meshes. */
export class Builder {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = 'RX-78-2';
    this.parent = this.root;
    this.section = 'frame';
    this.layer = 'frame';
    this.parts = [];
    this.geometries = new Map();
    this.materials = new Map();
    this.sockets = new Map();
  }
  material(color) {
    if (!this.materials.has(color)) {
      const [hex, roughness, metalness] = COLORS[color];
      const material = new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
      if (color === 'eye') { material.emissive.set(0xffb814); material.emissiveIntensity = 3; }
      if (color === 'sensor') { material.emissive.set(0x25bb80); material.emissiveIntensity = 1.3; }
      if (!['eye','sensor','black'].includes(color)) {
        material.onBeforeCompile = shader => {
          shader.vertexShader = 'varying vec3 vPaintPosition;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPaintPosition = position;');
          shader.fragmentShader = 'varying vec3 vPaintPosition;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
            float paintGrain = fract(sin(dot(floor(vPaintPosition * 390.0), vec3(12.9898,78.233,37.719))) * 43758.5453);
            float paintMottle = sin(vPaintPosition.x * 35.0 + sin(vPaintPosition.y * 28.0)) * sin(vPaintPosition.z * 42.0 + vPaintPosition.y * 31.0);
            diffuseColor.rgb *= .975 + .025 * paintGrain + .012 * paintMottle;`);
        };
      }
      this.materials.set(color, material);
    }
    return this.materials.get(color);
  }
  geometry(key, create) {
    if (!this.geometries.has(key)) this.geometries.set(key, create());
    return this.geometries.get(key);
  }
  group(section, layer, position, rotation, build) {
    const saved = [this.parent, this.section, this.layer];
    const group = new THREE.Group();
    group.position.set(...position);
    group.rotation.set(...rotation);
    this.parent.add(group);
    this.parent = group; this.section = section; this.layer = layer;
    build();
    [this.parent, this.section, this.layer] = saved;
    return group;
  }
  scope(layer, build) { const previous = this.layer; this.layer = layer; build(); this.layer = previous; }
  socket(name,position,rotation=[0,0,0]) {
    const socket=new THREE.Object3D();
    socket.name=name;socket.position.set(...position);socket.rotation.set(...rotation);
    this.parent.add(socket);this.sockets.set(name,socket);return socket;
  }
  add(name, geometry, color, position, rotation = [0, 0, 0], options = {}) {
    const mesh = new THREE.Mesh(geometry, this.material(color));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.rotation.set(rotation[0] ?? 0, rotation[1] ?? 0, rotation[2] ?? 0);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData = { section: this.section, layer: this.layer, ...options };
    this.parent.add(mesh);
    this.parts.push(mesh);
    return mesh;
  }
  box(name, color, position, size, rotation = [0, 0, 0], radius = .055, options = {}) {
    const r = Math.min(radius, ...size.map(v => v * .22));
    const geometry = this.geometry(`box:${size}:${r}`, () => new RoundedBoxGeometry(...size, 1, r));
    return this.add(name, geometry, color, position, rotation, options);
  }
  profile(name, color, position, points, depth, rotation = [0, 0, 0], bevel = .035) {
    const geometry = this.geometry(`profile:${points}:${depth}:${bevel}`, () => {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, steps: 1, curveSegments: 1 });
      geo.translate(0, 0, -depth / 2);
      return geo;
    });
    return this.add(name, geometry, color, position, rotation);
  }
  panel(name, color, position, size, rotation = [0, 0, 0], taper = .86) {
    const [w, h, d] = size;
    const c = Math.min(w, h) * .14;
    return this.profile(name, color, position, [
      [-w / 2 + c, h / 2], [w / 2 - c, h / 2], [w / 2, h / 2 - c],
      [w * taper / 2, -h / 2 + c], [w * taper / 2 - c, -h / 2],
      [-w * taper / 2 + c, -h / 2], [-w * taper / 2, -h / 2 + c], [-w / 2, h / 2 - c],
    ], d, rotation);
  }
  /** A solid tapered hull, built from independently shaped octagonal cross sections. */
  hull(name,color,position,rings,rotation=[0,0,0],cut=.23) {
    const geometry=this.geometry(`hull:${rings}:${cut}`,()=>{
      const points=[];
      for(const [y,w,d,z=0] of rings) {
        const cx=w*cut,cz=d*cut;
        points.push([-w+cx,y,z+d],[w-cx,y,z+d],[w,y,z+d-cz],[w,y,z-d+cz],
          [w-cx,y,z-d],[-w+cx,y,z-d],[-w,y,z-d+cz],[-w,y,z+d-cz]);
      }
      const vertices=[];
      const tri=(a,b,c)=>vertices.push(...points[a],...points[b],...points[c]);
      for(let r=0;r<rings.length-1;r++) for(let n=0;n<8;n++) {
        const a=r*8+n,b=r*8+(n+1)%8,c=(r+1)*8+n,d=(r+1)*8+(n+1)%8;
        tri(a,b,c);tri(b,d,c);
      }
      for(let n=1;n<7;n++) {tri(0,n+1,n); const last=(rings.length-1)*8;tri(last,last+n,last+n+1);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();return geo;
    });
    return this.add(name,geometry,color,position,rotation);
  }
  torus(name,color,position,radius,tube,rotation=[0,0,0]) {
    const geometry=this.geometry(`torus:${radius}:${tube}`,()=>new THREE.TorusGeometry(radius,tube,6,32));
    return this.add(name,geometry,color,position,rotation);
  }
  line(name,color,points,radius=.009) {
    for(let n=0;n<points.length-1;n++) this.rod(name,color,points[n],points[n+1],radius);
  }
  slot(position,size,rotation=[0,0,0]) {
    this.box('Recessed service latch','dark',position,size,rotation,.008);
    this.box('Latch inset','whiteDark',[position[0],position[1],position[2]+size[2]*.5+.008],[size[0]*.47,size[1]*.67,.012],rotation,.003);
  }
  jointDetail(position,radius,width) {
    this.axle('Articulated joint',position,radius,width);
    for(const side of [-1,1]) {
      const x=position[0]+side*(width*.5+.12);
      this.cylinder('Joint dust cover','whiteDark',[x,position[1],position[2]],radius*.86,.10,[0,0,Math.PI/2],radius*.86,32);
      this.torus('Joint rim','steel',[x+side*.065,position[1],position[2]],radius*.65,.035,[0,Math.PI/2,0]);
      this.cylinder('Joint locking plate','dark',[x+side*.065,position[1],position[2]],radius*.43,.06,[0,0,Math.PI/2],radius*.43,8);
      for(let n=0;n<6;n++) {
        const a=n/6*Math.PI*2;
        this.bolt([x+side*.11,position[1]+Math.sin(a)*radius*.53,position[2]+Math.cos(a)*radius*.53],[0,0,Math.PI/2],.035);
      }
    }
  }
  cylinder(name, color, position, radius, length, rotation = [0, 0, 0], radiusTop = radius, segments = 16) {
    const geometry = this.geometry(`cyl:${radius}:${length}:${radiusTop}:${segments}`, () => new THREE.CylinderGeometry(radiusTop, radius, length, segments));
    return this.add(name, geometry, color, position, rotation);
  }
  sphere(name, color, position, radius, scale = [1, 1, 1]) {
    const geometry = this.geometry(`sphere:${radius}:${scale}`, () => {
      const geo = new THREE.SphereGeometry(radius, 16, 10);
      geo.scale(...scale); return geo;
    });
    return this.add(name, geometry, color, position);
  }
  rod(name, color, a, b, radius = .08) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const mesh = this.cylinder(name, color, from.clone().add(to).multiplyScalar(.5).toArray(), radius, from.distanceTo(to));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
    return mesh;
  }
  bolt(position, rotation = [Math.PI / 2, 0, 0], radius = .045) {
    this.cylinder('Recessed fastener', 'steel', position, radius, .028, rotation, radius, 6);
  }
  seam(position, size, rotation = [0, 0, 0]) { this.box('Inset panel seam', 'dark', position, size, rotation, .006); }
  mark(position, size = [.16, .04, .014], color = 'red') { this.box('Service marking', color, position, size, [0, 0, 0], .002); }
  axle(name, position, radius, width) {
    this.cylinder(`${name} axis`, 'black', position, radius, width, [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) {
      const p = [position[0] + s * width * .51, position[1], position[2]];
      this.cylinder(`${name} rim`, 'steel', p, radius * .82, .07, [0, 0, Math.PI / 2]);
      p[0] += s * .05;
      this.cylinder(`${name} hub`, 'dark', p, radius * .49, .09, [0, 0, Math.PI / 2], radius * .49, 8);
    }
  }
  finish() {
    // Flatten temporary modeling groups so every component can animate independently.
    this.root.updateMatrixWorld(true);
    const sockets=new Map([...this.sockets].map(([name,socket])=>[name,{
      position:socket.getWorldPosition(new THREE.Vector3()),
      quaternion:socket.getWorldQuaternion(new THREE.Quaternion()),
    }]));
    const poses = this.parts.map(mesh => mesh.matrixWorld.clone());
    this.root.clear();
    const records = this.parts.map((mesh, i) => {
      poses[i].decompose(mesh.position, mesh.quaternion, mesh.scale);
      this.root.add(mesh);
      const p = mesh.position;
      const section = mesh.userData.section;
      const side = p.x < 0 ? -1 : 1;
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
      let offset;
      switch (section) {
        case 'feet': offset = [side * 1.45, -.05, 1.25]; break;
        case 'legs': offset = [side * 2.1, .12, p.z > .3 ? 2.3 : -1.7]; break;
        case 'waist': offset = [p.x * 1.1, .3, p.z > 0 ? 2.7 : -2.3]; break;
        case 'torso': offset = [p.x * .55, .9, p.z >= 0 ? 3.3 : -2.5]; break;
        case 'arms': offset = [side * 3.7, .3, p.z > .3 ? 1.2 : -.6]; break;
        case 'head': offset = [p.x * 1.5, 3.1, p.z > .3 ? 1.55 : -.85]; break;
        case 'backpack': offset = [p.x * 1.0, .8, -3.4]; break;
        case 'equipment': offset = [side * 4.7, .4, 1.25]; break;
        default: offset = [0, 0, 0];
      }
      if (mesh.userData.layer === 'frame') offset = [0, 0, 0];
      else {
        // Individual separation within a region gives the exploded view depth.
        const factor = .3 + (i % 7) * .075;
        offset[0] += normal.x * factor;
        offset[1] += normal.y * factor;
        offset[2] += normal.z * factor;
      }
      const rest = p.clone();
      const order = mesh.userData.layer === 'frame' ? Math.max(0, p.y / 19) * .18 :
        .18 + ({ feet: 0, legs: .12, waist: .28, torso: .37, arms: .49, backpack: .58, head: .66, equipment: .76 }[section] ?? 0);
      const angle = i * 2.399963;
      return {
        mesh, section, layer: mesh.userData.layer, rest, rotation: mesh.quaternion.clone(),
        exploded: rest.clone().add(new THREE.Vector3(...offset)),
        scatter: new THREE.Vector3(Math.cos(angle) * (10 + i % 7), 1 + ((i * 37) % 200) / 10, Math.sin(angle) * (7 + i % 5)),
        scatterRotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(angle * .3, angle * .4, angle * .2)),
        order: Math.min(.98, order + (i % 11) * .003),
      };
    });
    // Identical hardware shares draw calls; component meshes retain animation poses.
    const batches=new Map();
    for(const record of records) {
      const {mesh}=record,key=mesh.geometry.uuid+':'+mesh.material.uuid;
      if(!batches.has(key))batches.set(key,{geometry:mesh.geometry,material:mesh.material,records:[]});
      batches.get(key).records.push(record);mesh.visible=false;
    }
    for(const batch of batches.values()) {
      const instances=new THREE.InstancedMesh(batch.geometry,batch.material,batch.records.length);
      instances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instances.castShadow=true;instances.receiveShadow=true;instances.frustumCulled=false;
      batch.mesh=instances;this.root.add(instances);
    }
    const matrix=new THREE.Matrix4();
    function sync() {
      for(const batch of batches.values()) {
        batch.records.forEach((record,index)=>{
          const p=record.mesh;matrix.compose(p.position,p.quaternion,p.scale);batch.mesh.setMatrixAt(index,matrix);
        });
        batch.mesh.instanceMatrix.needsUpdate=true;
      }
    }
    sync();
    const geometries = this.geometries, materials = this.materials;
    return { root: this.root, parts: records, materials,sync,sockets,
      stats: { components: records.length, armor: records.filter(p => p.layer !== 'frame').length, frame: records.filter(p => p.layer === 'frame').length,drawCalls:batches.size },
      dispose() { batches.forEach(b=>b.mesh.dispose());geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); this.root.clear(); },
    };
  }
}

