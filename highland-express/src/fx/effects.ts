import * as THREE from 'three';
import { PuffSystem, Motes } from './particles';
import { Train } from '../train/train';
import { LOCO } from '../train/locomotive';
import { Water } from '../world/water';
import { Landscape } from '../world/landscape';
import { Rng } from '../core/noise';
import type { Quality } from '../core/quality';

const C = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export interface AudioEvents {
  steamBurst: number; // 0..1 intensity of discrete steam events this frame
  whistle: boolean;
}

/**
 * Smoke, steam, valley mist and waterfall spray. Everything is world-space particles so plumes
 * trail behind the moving train and drift in the wind.
 */
export class Effects {
  readonly group = new THREE.Group();
  readonly smoke: PuffSystem;
  readonly steam: PuffSystem;
  readonly mist: PuffSystem;
  readonly motes: Motes;
  private lastChuffs = 0;
  private tSafety = 14;
  private safetyLeft = 0;
  private cockLeft = 7;
  private tCock = 40;
  private injector = 0;
  private leak = 0;
  whistle = false;
  private whistleFx = 0;
  readonly events: AudioEvents = { steamBurst: 0, whistle: false };
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private sprayT = 0;
  private fireTick = 0;

  constructor(private train: Train, private water: Water, private land: Landscape, q: Quality) {
    this.smoke = new PuffSystem({
      max: q.smoke, lit: C(0.56, 0.53, 0.50), shade: C(0.07, 0.07, 0.08), opacity: 0.9, buoyancy: 1.1, drag: 0.55,
      growthPow: 0.62, turbulence: 0.45, fadeIn: 0.05, ageTint: C(1.1, 1.08, 1.05),
    });
    this.steam = new PuffSystem({
      max: Math.round(q.smoke * 1.15), lit: C(1.0, 0.98, 0.94), shade: C(0.62, 0.68, 0.76), opacity: 0.72, buoyancy: 0.5, drag: 0.9,
      growthPow: 0.5, turbulence: 0.35, fadeIn: 0.04, ageTint: C(1.0, 1.0, 1.0),
    });
    this.mist = new PuffSystem({
      max: q.mist, lit: C(0.97, 0.93, 0.86), shade: C(0.62, 0.70, 0.80), opacity: 0.2, buoyancy: 0.0, drag: 0.2,
      growthPow: 0.9, turbulence: 0.25, fadeIn: 0.25, ageTint: C(1, 1, 1), simple: true,
    });
    this.mistMax = q.mist;
    this.motes = new Motes(q.motes, 38);
    this.group.add(this.mist.mesh, this.smoke.mesh, this.steam.mesh, this.motes.points);
    this.seedMist();
  }

  private mistT = 0;
  private mistMax = 90;
  private emitMist(age0: number) {
    const r = this.land.river;
    const s = r[Math.floor(Math.random() * Math.min(r.length - 1, 620))];
    const x = s.x + rnd(-70, 70), z = s.z + rnd(-40, 40);
    const y = this.land.fastHeight(x, z) + rnd(3, 11);
    this.mist.emit(x, y, z, rnd(0.2, 0.7), 0, rnd(0.1, 0.5), rnd(40, 60), rnd(70, 110), rnd(45, 90), rnd(0.6, 1), 0.02, age0);
  }

  private seedMist() {
    // low drifting sheets over the river meadow, pre-aged so they are all present from the start
    for (let i = 0; i < Math.round(this.mistMax * 0.78); i++) this.emitMist(Math.random() * 0.8);
  }

  dispose() {
    for (const m of [this.smoke.mesh, this.steam.mesh, this.mist.mesh]) {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
    this.motes.points.geometry.dispose();
    (this.motes.points.material as THREE.Material).dispose();
  }

  /** world position of a loco-local anchor */
  private anchor(v: THREE.Vector3, out: THREE.Vector3) {
    return out.copy(v).applyMatrix4(this.train.loco.root.matrixWorld);
  }

  update(dt: number, time: number, camera: THREE.PerspectiveCamera) {
    const tr = this.train;
    const st = tr.state;
    const loco = tr.loco;
    loco.root.updateMatrixWorld(true);
    this.events.steamBurst = 0;

    // wind: gentle and slowly varying
    const wx = 1.3 + Math.sin(time * 0.13) * 0.5, wz = 0.7 + Math.cos(time * 0.11) * 0.4;
    for (const s of [this.smoke, this.steam, this.mist]) s.wind.set(wx * (s === this.mist ? 0.3 : 1), 0, wz * (s === this.mist ? 0.3 : 1));

    // velocity of the train in world space
    const tang = tr.locoFrame.t;
    const vTrain = this.tmp2.copy(tang).multiplyScalar(st.speed);

    // ---- chimney exhaust, one cluster per beat
    const chuffs = st.chuffs;
    const nNew = Math.min(6, chuffs - this.lastChuffs);
    this.lastChuffs = chuffs;
    const speedF = Math.min(1, st.speed / 8.5);
    const chimney = this.anchor(loco.anchors.chimney, new THREE.Vector3());
    for (let i = 0; i < nNew; i++) {
      // alternate hard/soft beats, stronger when working hard (accelerating)
      const hard = (chuffs - i) % 2 === 0 ? 1 : 0.75;
      const nP = 3;
      for (let k = 0; k < nP; k++) {
        const jx = rnd(-0.12, 0.12), jz = rnd(-0.12, 0.12);
        const up = rnd(3.2, 5.6) * hard * (0.7 + 0.5 * speedF);
        // inherit most of the train's speed (the exhaust is thrown back by the slipstream below)
        const slip = 0.82;
        this.smoke.emit(
          chimney.x + jx, chimney.y + k * 0.15, chimney.z + jz,
          vTrain.x * slip + rnd(-0.6, 0.6), up, vTrain.z * slip + rnd(-0.6, 0.6),
          rnd(0.35, 0.55) * hard, rnd(3.6, 6.4) * (0.8 + 0.3 * hard), rnd(5.5, 8.5), rnd(0.62, 0.9), 0.5,
        );
      }
      // brief hot steam at the stack mouth
      this.steam.emit(chimney.x, chimney.y + 0.1, chimney.z, vTrain.x * 0.85, rnd(3, 5), vTrain.z * 0.85, 0.3, rnd(1.4, 2.2), rnd(0.9, 1.5), 0.55, 0.5);
    }
    // thin steady wisp between beats when stationary or slow
    if (st.speed < 1.2 && Math.random() < dt * 12) {
      this.smoke.emit(chimney.x, chimney.y, chimney.z, rnd(-0.2, 0.2), rnd(1.5, 2.5), rnd(-0.2, 0.2), 0.3, 2.6, rnd(4, 6), 0.35, 0.3);
    }

    // ---- cylinder cocks: periodic bursts (and on pulling away)
    this.tCock -= dt;
    if (this.tCock <= 0) {
      this.cockLeft = 5 + Math.random() * 3;
      this.tCock = 38 + Math.random() * 30;
    }
    if (this.cockLeft > 0) {
      this.cockLeft -= dt;
      this.events.steamBurst = Math.max(this.events.steamBurst, 0.45);
      if (nNew > 0) {
        for (const a of loco.anchors.cylCocks) {
          const p = this.anchor(a, new THREE.Vector3());
          const side = a.x > 0 ? 1 : -1;
          const nx = tr.locoFrame.r.x, nz = tr.locoFrame.r.z; // loco right
          const sgn = a.x > 0 ? -1 : 1; // model +x is the loco's left
          void side;
          for (let k = 0; k < 2; k++) {
            this.steam.emit(
              p.x, p.y, p.z,
              vTrain.x * 0.5 + nx * sgn * rnd(1.4, 2.8), rnd(0.2, 1.1), vTrain.z * 0.5 + nz * sgn * rnd(1.4, 2.8),
              0.2, rnd(1.1, 1.9), rnd(0.9, 1.6), 0.7, 0.5,
            );
          }
        }
      }
    }

    // ---- safety valve blow-off
    this.tSafety -= dt;
    if (this.tSafety <= 0) {
      this.safetyLeft = 3.5 + Math.random() * 1.5;
      this.tSafety = 32 + Math.random() * 28;
    }
    if (this.safetyLeft > 0) {
      this.safetyLeft -= dt;
      this.events.steamBurst = Math.max(this.events.steamBurst, 1);
      const p = this.anchor(loco.anchors.safety[0], new THREE.Vector3());
      const rate = 70;
      let nEm = rate * dt;
      while (nEm > 0) {
        if (nEm < 1 && Math.random() > nEm) break;
        nEm -= 1;
        const sp = rnd(7, 11);
        const a = rnd(0, 6.28), r = rnd(0, 0.35);
        this.steam.emit(
          p.x + Math.cos(a) * 0.1 + rnd(-0.1, 0.1), p.y + rnd(0, 0.3), p.z + Math.sin(a) * 0.1 + rnd(-0.1, 0.1),
          vTrain.x * 0.7 + Math.cos(a) * r * 3, sp, vTrain.z * 0.7 + Math.sin(a) * r * 3,
          0.35, rnd(3.5, 6.0), rnd(1.6, 2.6), 0.85, 0.4,
        );
      }
    }

    // ---- whistle
    if (this.whistle) {
      this.whistleFx += dt;
      const p = this.anchor(loco.anchors.whistle, new THREE.Vector3());
      let nEm = 55 * dt;
      while (nEm > 0) {
        if (nEm < 1 && Math.random() > nEm) break;
        nEm -= 1;
        this.steam.emit(p.x, p.y, p.z, vTrain.x * 0.8 + rnd(-0.6, 0.6), rnd(3, 6), vTrain.z * 0.8 + rnd(-0.6, 0.6), 0.2, rnd(1.5, 2.8), rnd(1.1, 1.8), 0.8, 0.4);
      }
    } else this.whistleFx = 0;
    this.events.whistle = this.whistle;

    // ---- injector overflow and small leaks (constant, subtle)
    this.injector += dt;
    if (this.injector > 0.16) {
      this.injector = 0;
      for (const a of loco.anchors.injector) {
        if (Math.random() < 0.6) {
          const p = this.anchor(a, new THREE.Vector3());
          this.steam.emit(p.x, p.y, p.z, vTrain.x * 0.4 + rnd(-0.2, 0.2), rnd(-0.1, 0.4), vTrain.z * 0.4 + rnd(-0.2, 0.2), 0.15, rnd(0.7, 1.3), rnd(0.8, 1.4), 0.4, 0.3);
        }
      }
    }
    // heating-pipe leaks between the coaches
    this.leak += dt;
    if (this.leak > 0.35) {
      this.leak = 0;
      const c = tr.coaches[Math.floor(Math.random() * tr.coaches.length)];
      if (c && Math.random() < 0.7) {
        this.tmp.set(rnd(-0.4, 0.4), 0.85, Math.random() < 0.5 ? 7.7 : -7.7);
        c.root.updateMatrixWorld();
        this.tmp.applyMatrix4(c.root.matrixWorld);
        this.steam.emit(this.tmp.x, this.tmp.y, this.tmp.z, vTrain.x * 0.5, rnd(0.2, 0.8), vTrain.z * 0.5, 0.12, rnd(0.6, 1.0), rnd(0.9, 1.4), 0.3, 0.3);
      }
    }

    // ---- waterfall spray and rapids
    this.sprayT += dt;
    if (this.sprayT > 0.04) {
      this.sprayT = 0;
      const b = this.water.fallsBase;
      for (let k = 0; k < 2; k++) {
        this.steam.emit(b.x + rnd(-4, 4), b.y + rnd(0, 1.5), b.z + rnd(-3, 3) + 3, rnd(-0.4, 0.8), rnd(1.5, 4.5), rnd(0.2, 1.4), rnd(1.5, 3), rnd(7, 13), rnd(4, 7), 0.28, 0.1);
      }
      if (Math.random() < 0.3) {
        const r = this.water.rapids;
        this.steam.emit(r.x + rnd(-2, 2), r.y + 0.2, r.z + rnd(-2, 2), 0.1, rnd(0.5, 1.3), rnd(0.2, 0.8), rnd(0.8, 1.4), rnd(3, 5), rnd(2.5, 4), 0.2, 0.1);
      }
    }
    void fireTickGuard;
    // glowing firebox flicker is driven in Locomotive.update

    this.mistT += dt;
    while (this.mistT > 0.7) {
      this.mistT -= 0.7;
      this.emitMist(0);
    }

    // ---- update systems
    this.smoke.update(dt, camera, time);
    this.steam.update(dt, camera, time);
    this.mist.update(dt, camera, time);
    this.motes.update(dt, camera.position, time);
  }
}
const fireTickGuard = 0;
void Rng;
void LOCO;
