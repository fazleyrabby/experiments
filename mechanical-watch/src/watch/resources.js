import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createResources() {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const cache = new Map();
  const keep = geometry => { geometries.add(geometry); return geometry; };
  function geo(key, make) { if (!cache.has(key)) cache.set(key, keep(make())); return cache.get(key); }
  function texture(size, draw) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    draw(canvas.getContext('2d'), size);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; textures.add(t); return t;
  }
  const brush = texture(512, (ctx, s) => {
    ctx.fillStyle = '#b4b4b4'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1600; i++) {
      const y = (i * 73.37) % s, value = 120 + (i * 31 % 100);
      ctx.strokeStyle = `rgba(${value},${value},${value},.18)`; ctx.lineWidth = .35;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y + .8); ctx.stroke();
    }
  });
  brush.wrapS = brush.wrapT = THREE.RepeatWrapping;
  const mat = properties => { const m = new THREE.MeshStandardMaterial(properties); materials.add(m); return m; };
  const palette = {
    steel: mat({ color: '#c7ced1', metalness: 1, roughness: .13 }),
    brushed: mat({ color: '#929c9d', metalness: 1, roughness: .32, roughnessMap: brush }),
    darkSteel: mat({ color: '#48504d', metalness: .95, roughness: .32 }),
    nickel: mat({ color: '#b5b1a0', metalness: .94, roughness: .32, roughnessMap: brush }),
    gold: mat({ color: '#a98b44', metalness: .95, roughness: .27 }),
    goldEdge: mat({ color: '#d7b96e', metalness: 1, roughness: .17 }),
    dial: mat({ color: '#103c33', metalness: .78, roughness: .3 }),
    white: mat({ color: '#e3e7db', metalness: .25, roughness: .3 }),
    lume: mat({ color: '#cbd9ba', roughness: .55, emissive: '#a5c695', emissiveIntensity: .06 }),
    ruby: mat({ color: '#8b2247', metalness: .35, roughness: .17 }),
    blue: mat({ color: '#294350', metalness: .85, roughness: .23 }),
  };
  const glass = new THREE.MeshPhysicalMaterial({ color: '#b6d8ce', metalness: 0, roughness: .055, transparent: true, opacity: .025, side: THREE.DoubleSide, depthWrite: false, clearcoat: 1 });
  materials.add(glass); palette.glass = glass;
  function mesh(group, geometry, material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z);
    m.castShadow = material !== glass; m.receiveShadow = true; group.add(m); return m;
  }
  function cylinder(group, r, h, material, x = 0, y = 0, z = 0, segments = 64) {
    return mesh(group, geo(`c${r},${h},${segments}`, () => new THREE.CylinderGeometry(r, r, h, segments)), material, x, y, z);
  }
  function box(group, w, h, d, material, x = 0, y = 0, z = 0) {
    return mesh(group, geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), material, x, y, z);
  }
  function ring(group, outer, inner, height, material, x = 0, y = 0, z = 0, bevel = .015, start = 0, length = Math.PI * 2) {
    const key = `r${outer},${inner},${height},${bevel},${start},${length}`;
    const geometry = geo(key, () => {
      if (length >= Math.PI * 2 - .001) {
        // Turned surfaces stay smooth around the circumference, with a rounded chamfer.
        const b = Math.min(bevel, height * .45, (outer-inner)*.4), h = height/2;
        const profile = [[inner,-h+b],[inner+b*.3,-h+b*.3],[inner+b,-h],[outer-b,-h],[outer-b*.3,-h+b*.3],[outer,-h+b],[outer,h-b],[outer-b*.3,h-b*.3],[outer-b,h],[inner+b,h],[inner+b*.3,h-b*.3],[inner,h-b],[inner,-h+b]];
        return new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),160);
      }
      const shape = new THREE.Shape();
      shape.absarc(0, 0, outer, start, start + length, false);
      if (length >= Math.PI * 2 - .001) {
        const hole = new THREE.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole);
      } else {
        shape.absarc(0, 0, inner, start + length, start, true); shape.closePath();
      }
      return new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 64 }).rotateX(-Math.PI / 2).translate(0, -height / 2, 0);
    });
    return mesh(group, geometry, material, x, y, z);
  }
  function plate(group, points, h, material, x = 0, y = 0, z = 0, holes = [], bevel = .025) {
    const shape = new THREE.Shape(points.map(([px, pz]) => new THREE.Vector2(px, -pz)));
    holes.forEach(([hx, hz, radius]) => { const hole = new THREE.Path(); hole.absarc(hx, -hz, radius, 0, Math.PI * 2, true); shape.holes.push(hole); });
    const geometry = keep(new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: bevel > 0, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: Math.min(bevel, h*.4) }).rotateX(-Math.PI / 2).translate(0, -h / 2, 0));
    return mesh(group, geometry, material, x, y, z);
  }
  function screw(group, x, y, z, radius = .07) {
    ring(group, radius*1.2, radius*.98, .012, palette.steel, x, y-.014,z,.002);
    cylinder(group, radius, .035, palette.blue, x, y, z, 32);
    box(group, radius * 1.52, .006, .012, palette.darkSteel, x, y + .02, z).rotation.y = .4;
  }
  function jewel(group, x, y, z, radius = .055) {
    ring(group, radius * 1.55, radius, .02, palette.goldEdge, x, y, z, .004);
    cylinder(group, radius, .027, palette.ruby, x, y, z, 24);
    cylinder(group, radius * .3, .034, palette.steel, x, y + .005, z, 12);
  }
  function spiral(group, { radius, turns, thickness = .015, y = 0, x = 0, z = 0, material = palette.steel }) {
    const count = Math.ceil(turns * 90) + 1;
    const points = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1), a = t * turns * Math.PI * 2;
      const r = .045 + t * radius;
      return new THREE.Vector3(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
    });
    return mesh(group, keep(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length, thickness, 4, false)), material);
  }
  function ribbonSpring(group,{radius,turns,y=0,height=.065,width=.009,material=palette.steel}) {
    const count=Math.ceil(turns*100), edges=[[],[]];
    for(let i=0;i<=count;i++) {const t=i/count,a=t*turns*Math.PI*2,rad=.075+t*radius;
      edges[0].push(new THREE.Vector2(Math.cos(a)*(rad-width/2),Math.sin(a)*(rad-width/2)));
      edges[1].push(new THREE.Vector2(Math.cos(a)*(rad+width/2),Math.sin(a)*(rad+width/2)));
    }
    const shape=new THREE.Shape([...edges[0],...edges[1].reverse()]);shape.closePath();
    return mesh(group,keep(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1}).rotateX(-Math.PI/2)),material,0,y,0);
  }
  // Static detail is merged per material inside each independently moving group.
  function batch(group) {
    group.children.filter(child => child.isGroup).forEach(batch);
    const buckets = new Map();
    for (const child of [...group.children]) {
      if (!child.isMesh || child.material.transparent || child.userData.unbatched) continue;
      child.updateMatrix();
      if (!buckets.has(child.material)) buckets.set(child.material, []);
      buckets.get(child.material).push(child);
    }
    for (const [material, meshes] of buckets) {
      if (meshes.length < 2) continue;
      const copies = meshes.map(m => {
        const geometry = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        return geometry.applyMatrix4(m.matrix);
      });
      const merged = mergeGeometries(copies, false); copies.forEach(g => g.dispose());
      if (!merged) continue;
      meshes.forEach(m => group.remove(m)); mesh(group, keep(merged), material);
    }
  }
  return { ...palette, keep, geo, texture, mesh, cylinder, box, ring, plate, screw, jewel, spiral, ribbonSpring, batch,
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); },
  };
}
