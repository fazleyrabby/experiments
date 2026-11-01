import * as THREE from 'three';

/* ------------------------------------------------------------------ rain */

export class Rain {
  constructor(count, env) {
    const seeds = new Float32Array(count * 2 * 4);
    const ends = new Float32Array(count * 2);
    const pos = new Float32Array(count * 2 * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random(), b = Math.random(), c = Math.random(), d = Math.random();
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k;
        seeds.set([a, b, c, d], j * 4);
        ends[j] = k;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    g.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
    this.uniforms = {
      uTime: env.uTime, uAmbient: env.uAmbient, uFlash: env.uFlash, uFlashColor: env.uFlashColor,
      uCam: { value: new THREE.Vector3() },
      uVel: { value: new THREE.Vector3(10, -12, 4) },
      uBox: { value: 70 },
      uOpacity: { value: 0.5 },
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec4 aSeed; attribute float aEnd;
        uniform float uTime, uBox; uniform vec3 uCam, uVel;
        varying float vA; varying float vEnd;
        void main() {
          vec3 vel = uVel * (0.85 + 0.3 * aSeed.w);
          vec3 p = aSeed.xyz * uBox + vel * uTime;
          p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
          p -= vel * aEnd * 0.055;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          float d = length(mv.xyz);
          vA = smoothstep(uBox * 0.5, uBox * 0.15, d) * smoothstep(0.6, 2.5, d);
          vEnd = aEnd;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uAmbient, uFlashColor; uniform float uFlash, uOpacity;
        varying float vA; varying float vEnd;
        void main() {
          vec3 col = uAmbient * 2.2 + uFlashColor * uFlash * 0.9 + 0.03;
          gl_FragColor = vec4(col, vA * uOpacity * (1.0 - vEnd * 0.85));
        }`,
    });
    this.mesh = new THREE.LineSegments(g, this.mat);
    this.mesh.frustumCulled = false;
  }
  update(camera, wind, intensity) {
    this.uniforms.uCam.value.copy(camera.position);
    this.uniforms.uVel.value.set(wind.x * 15, -13, wind.y * 15);
    this.uniforms.uOpacity.value = 0.45 * intensity;
  }
}

/* -------------------------------------------------------------- particles */

export class Particles {
  constructor(max, env, foamMap) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3);
    this.v = new Float32Array(max * 3);
    this.age = new Float32Array(max);
    this.life = new Float32Array(max);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max);
    this.a0 = new Float32Array(max); this.shade = new Float32Array(max);
    this.grav = new Float32Array(max); this.drag = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.aPos = new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.aSize = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.aShade = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.aPos);
    g.setAttribute('aSize', this.aSize);
    g.setAttribute('aAlpha', this.aAlpha);
    g.setAttribute('aShade', this.aShade);
    g.setDrawRange(0, 0);
    this.uniforms = {
      uScale: { value: 600 }, uMaxPoint: { value: 720 }, uFoamMap: { value: foamMap },
      uAmbient: env.uAmbient, uFlash: env.uFlash, uFlashColor: env.uFlashColor,
      uFogColor: env.uFogColor, uFogDensity: env.uFogDensity, uKeyColor: env.uKeyColor,
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute float aSize, aAlpha, aShade;
        uniform float uScale, uFogDensity, uMaxPoint;
        varying float vAlpha, vShade, vFog, vNear; varying vec2 vSeed;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = clamp(aSize * uScale / max(-mv.z, 1.0), 1.0, uMaxPoint);
          vAlpha = aAlpha; vShade = aShade;
          vSeed = position.xz * 0.071 + position.y * 0.03;
          float d = length(mv.xyz);
          vFog = 1.0 - exp(-pow(uFogDensity * d, 2.0));
          vNear = smoothstep(5.0, 45.0, d); // spray right at the lens reads as blobs; let it thin out
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uFoamMap;
        uniform vec3 uAmbient, uFlashColor, uFogColor, uKeyColor; uniform float uFlash;
        varying float vAlpha, vShade, vFog, vNear; varying vec2 vSeed;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float r = length(c) * 2.0;
          if (r > 1.0) discard;
          // eroded, wispy puff instead of a round disc
          float n = texture2D(uFoamMap, gl_PointCoord * 0.42 + vSeed).g;
          float n2 = texture2D(uFoamMap, gl_PointCoord * 1.1 - vSeed * 1.3).r;
          float edge = 1.0 - smoothstep(0.05, 1.0, r);
          float body = edge * (0.35 + n * 1.1) + n2 * 0.22 * vShade;
          float a = smoothstep(0.32, 0.95, body);
          // spray carries a speckle of individual droplets
          float sp = texture2D(uFoamMap, gl_PointCoord * 3.1 + vSeed * 2.7).r;
          a = max(a * (0.75 + 0.25 * n2), smoothstep(0.82, 0.98, sp) * edge * 0.9 * vShade);
          a *= vAlpha * vNear;
          vec3 base = mix(vec3(0.045, 0.043, 0.042), vec3(0.88, 0.92, 0.94), vShade);
          vec3 col = base * (uAmbient * 1.7 + uKeyColor * 0.25 + uFlashColor * uFlash * 0.7);
          col = mix(col, uFogColor, vFog);
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
  }

  emit(x, y, z, vx, vy, vz, life, s0, s1, a0, shade, grav, drag) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.age[i] = 0; this.life[i] = life; this.s0[i] = s0; this.s1[i] = s1;
    this.a0[i] = a0; this.shade[i] = shade; this.grav[i] = grav; this.drag[i] = drag;
  }

  kill(i) {
    const j = --this.n;
    if (i === j) return;
    for (let k = 0; k < 3; k++) { this.p[i * 3 + k] = this.p[j * 3 + k]; this.v[i * 3 + k] = this.v[j * 3 + k]; }
    this.age[i] = this.age[j]; this.life[i] = this.life[j]; this.s0[i] = this.s0[j]; this.s1[i] = this.s1[j];
    this.a0[i] = this.a0[j]; this.shade[i] = this.shade[j]; this.grav[i] = this.grav[j]; this.drag[i] = this.drag[j];
  }

  update(dt, windVel) {
    const P = this.aPos.array, S = this.aSize.array, A = this.aAlpha.array, Sh = this.aShade.array;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.kill(i); i--; continue; }
      const k = this.age[i] / this.life[i];
      const d = 1 - Math.exp(-this.drag[i] * dt);
      this.v[i * 3] += (windVel.x - this.v[i * 3]) * d;
      this.v[i * 3 + 2] += (windVel.z - this.v[i * 3 + 2]) * d;
      this.v[i * 3 + 1] += -this.grav[i] * dt - this.v[i * 3 + 1] * d * 0.3;
      this.p[i * 3] += this.v[i * 3] * dt;
      this.p[i * 3 + 1] += this.v[i * 3 + 1] * dt;
      this.p[i * 3 + 2] += this.v[i * 3 + 2] * dt;
      P[i * 3] = this.p[i * 3]; P[i * 3 + 1] = this.p[i * 3 + 1]; P[i * 3 + 2] = this.p[i * 3 + 2];
      S[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * (1 - (1 - k) * (1 - k));
      A[i] = this.a0[i] * Math.min(1, k * 12) * Math.pow(1 - k, 1.4);
      Sh[i] = this.shade[i];
    }
    this.points.geometry.setDrawRange(0, this.n);
    this.aPos.needsUpdate = this.aSize.needsUpdate = this.aAlpha.needsUpdate = this.aShade.needsUpdate = true;
  }
}

/* -------------------------------------------------------------- lightning */

function jag(a, b, depth, rough, r) {
  let pts = [a.clone(), b.clone()];
  for (let d = 0; d < depth; d++) {
    const np = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      np.push(p);
      const len = p.distanceTo(q);
      const m = p.clone().lerp(q, 0.38 + r() * 0.24);
      m.x += (r() - 0.5) * len * rough;
      m.z += (r() - 0.5) * len * rough;
      m.y += (r() - 0.5) * len * rough * 0.25;
      np.push(m);
    }
    np.push(pts[pts.length - 1]);
    pts = np;
  }
  return pts;
}

function ribbonGeometry(lines) {
  let nv = 0, ni = 0;
  for (const l of lines) { nv += l.pts.length * 2; ni += (l.pts.length - 1) * 6; }
  const pos = new Float32Array(nv * 3), dir = new Float32Array(nv * 3);
  const side = new Float32Array(nv), width = new Float32Array(nv), bright = new Float32Array(nv);
  const idx = new Uint32Array(ni);
  let v = 0, k = 0;
  const t = new THREE.Vector3();
  for (const l of lines) {
    const n = l.pts.length, start = v;
    for (let i = 0; i < n; i++) {
      const p = l.pts[i];
      if (i < n - 1) t.subVectors(l.pts[i + 1], p); else t.subVectors(p, l.pts[i - 1]);
      t.normalize();
      const taper = 1 - 0.6 * (i / (n - 1));
      for (const s of [-1, 1]) {
        pos.set([p.x, p.y, p.z], v * 3);
        dir.set([t.x, t.y, t.z], v * 3);
        side[v] = s; width[v] = l.width * taper; bright[v] = l.bright * (0.6 + 0.4 * taper);
        v++;
      }
      if (i < n - 1) {
        const a = start + i * 2;
        idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k); k += 6;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  g.setAttribute('aWidth', new THREE.BufferAttribute(width, 1));
  g.setAttribute('aBright', new THREE.BufferAttribute(bright, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

function boltMaterial(widthMul, core, env) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uWidthMul: { value: widthMul }, uCore: { value: core }, uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(0.75, 0.82, 1.0) },
      uFogDensity: env.uFogDensity,
    },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute vec3 aDir; attribute float aSide, aWidth, aBright;
      uniform float uWidthMul, uFogDensity;
      varying float vSide, vBright, vFog;
      void main() {
        vec3 p = position;
        vec3 toCam = normalize(cameraPosition - p);
        vec3 off = normalize(cross(aDir, toCam));
        float dist = length(cameraPosition - p);
        float w = max(aWidth * uWidthMul, dist * 0.0017 * uWidthMul);
        p += off * aSide * w;
        vSide = aSide; vBright = aBright;
        vFog = exp(-pow(uFogDensity * 0.45 * dist, 2.0));
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uCore, uIntensity; uniform vec3 uColor;
      varying float vSide, vBright, vFog;
      void main() {
        float f = 1.0 - abs(vSide);
        float a = uCore > 0.5 ? smoothstep(0.0, 0.7, f) : f * f * f;
        vec3 col = uColor * (uCore > 0.5 ? vec3(8.0, 8.4, 9.5) : vec3(1.0, 1.25, 2.1));
        gl_FragColor = vec4(col * uIntensity * vBright * a * vFog, 1.0);
      }`,
  });
}

export class Lightning {
  constructor(scene, env) {
    this.scene = scene; this.env = env;
    this.events = [];
    this.timer = 3.5;
    this.cloudTimer = 1.5;
    this.freq = 1;
    this.onStrike = null;
    this.flash = 0;
  }

  pulses(n, spread) {
    const p = [{ t0: 0, a: 0.35 }];
    let t = 0.05 + Math.random() * 0.04;
    p.push({ t0: t, a: 1 });
    for (let i = 0; i < n; i++) { t += 0.05 + Math.random() * spread; p.push({ t0: t, a: 0.35 + Math.random() * 0.6 }); }
    return p;
  }

  strike(camera, opts = {}) {
    const r = Math.random;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const camAz = Math.atan2(camDir.z, camDir.x);
    const az = opts.ahead ? camAz + (r() - 0.5) * 0.5 : r() < 0.8 ? camAz + (r() - 0.5) * 1.6 : r() * Math.PI * 2;
    let dist = opts.dist ?? 450 + Math.pow(r(), 1.6) * 4200;
    if (opts.dist === undefined && r() < 0.13) dist = 230 + r() * 220;
    const cx = camera.position.x + Math.cos(az) * dist, cz = camera.position.z + Math.sin(az) * dist;
    const top = new THREE.Vector3(cx + (r() - 0.5) * 500, 1150 + r() * 600, cz + (r() - 0.5) * 500);
    const bottom = new THREE.Vector3(cx, 0, cz);
    const main = jag(top, bottom, 8, 0.55, r);
    const lines = [{ pts: main, width: 2.2, bright: 1 }];
    const H = top.y;
    const nb = 4 + Math.floor(r() * 6);
    for (let b = 0; b < nb; b++) {
      const i = Math.floor((0.03 + r() * 0.65) * main.length);
      const s = main[i];
      const len = (0.12 + r() * 0.3) * H;
      const horiz = r() < 0.3;
      const ang = r() * Math.PI * 2;
      const e = new THREE.Vector3(s.x + Math.cos(ang) * len * (horiz ? 1 : 0.55), s.y - len * (horiz ? 0.15 : 0.8), s.z + Math.sin(ang) * len * (horiz ? 1 : 0.55));
      const bp = jag(s, e, 6, 0.6, r);
      lines.push({ pts: bp, width: 1.0, bright: 0.55 });
      if (r() < 0.6) {
        const j = Math.floor(r() * bp.length * 0.6);
        const s2 = bp[j];
        const l2 = len * (0.3 + r() * 0.3);
        const e2 = new THREE.Vector3(s2.x + (r() - 0.5) * l2, s2.y - l2 * 0.7, s2.z + (r() - 0.5) * l2);
        lines.push({ pts: jag(s2, e2, 5, 0.6, r), width: 0.55, bright: 0.35 });
      }
    }
    const geo = ribbonGeometry(lines);
    const core = boltMaterial(1, 1, this.env), glow = boltMaterial(16, 0, this.env);
    const mc = new THREE.Mesh(geo, core), mg = new THREE.Mesh(geo, glow);
    mc.frustumCulled = mg.frustumCulled = false;
    mc.renderOrder = mg.renderOrder = 8;
    this.scene.add(mc, mg);
    const ev = {
      kind: 'bolt', t: 0, dur: 1.1, pulses: this.pulses(1 + Math.floor(r() * 3), 0.12),
      gain: THREE.MathUtils.clamp(1400 / dist, 0.28, 1.7),
      meshes: [mc, mg], mats: [core, glow],
      pos: bottom.clone(), mid: new THREE.Vector3().lerpVectors(top, bottom, 0.35), dist,
    };
    this.events.push(ev);
    if (this.onStrike) this.onStrike(ev);
    return ev;
  }

  cloudFlash(camera) {
    const r = Math.random;
    const az = r() * Math.PI * 2;
    const dist = 1500 + r() * 5000;
    const p = new THREE.Vector3(camera.position.x + Math.cos(az) * dist, 900 + r() * 900, camera.position.z + Math.sin(az) * dist);
    const ev = {
      kind: 'cloud', t: 0, dur: 1.4, pulses: this.pulses(2 + Math.floor(r() * 4), 0.18),
      gain: 0.2 + r() * 0.4, meshes: [], mats: [], pos: new THREE.Vector3(p.x, 0, p.z), mid: p, dist,
    };
    this.events.push(ev);
    if (this.onStrike) this.onStrike(ev);
  }

  envelope(ev) {
    let v = 0;
    for (const p of ev.pulses) {
      const dt = ev.t - p.t0;
      if (dt >= 0) v += p.a * Math.exp(-dt / 0.055);
    }
    return v * (0.85 + Math.random() * 0.3);
  }

  update(dt, camera) {
    if (this.freq > 0) {
      this.timer -= dt * this.freq;
      if (this.timer <= 0) { this.strike(camera); this.timer = 2.5 + Math.random() * 9; }
      this.cloudTimer -= dt * this.freq;
      if (this.cloudTimer <= 0) { this.cloudFlash(camera); this.cloudTimer = 1.2 + Math.random() * 4.5; }
    }
    let f = 0, best = null, bestV = 0;
    for (let i = this.events.length - 1; i >= 0; i--) {
      const ev = this.events[i];
      ev.t += dt;
      const v = this.envelope(ev);
      for (const m of ev.mats) m.uniforms.uIntensity.value = v > 0.02 ? Math.min(v, 1.6) : 0;
      const contrib = v * ev.gain;
      f += contrib;
      if (contrib > bestV) { bestV = contrib; best = ev; }
      if (ev.t > ev.dur) {
        for (const m of ev.meshes) { this.scene.remove(m); }
        if (ev.meshes.length) ev.meshes[0].geometry.dispose();
        for (const m of ev.mats) m.dispose();
        this.events.splice(i, 1);
      }
    }
    this.flash = f;
    if (best) {
      this.env.uFlashPos.value.copy(best.pos);
      this.env.uFlashDir.value.subVectors(best.mid, camera.position).normalize();
      this.best = best;
    }
    this.env.uFlash.value = Math.min(f, 2.0);
  }
}
