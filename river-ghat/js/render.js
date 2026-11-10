// Frame pipeline: sky -> far bank -> water -> mid river (hazed) -> mist -> ghat (graded) -> lights -> post.
import { W, H, clamp, lerp, smooth, bayer, hash2, vnoise, pack, makeCanvas } from './util.js';
import { buildScene, HZ, WL, KILN, STOVE, KETTLE, LANTERN } from './scene.js';
import { computeLight, grade, Sky, glowSprite, mistBand, tint } from './light.js';
import { Ripples, Splashes, Smoke, Ferry, Sailboat, Fisher, Kheya, Moored, People, Crows, Flock } from './life.js';

const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const css = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`);
function layer() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  return { c, g };
}

export class Renderer {
  constructor(canvas, hooks = {}) {
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    this.hooks = hooks;
    const sc = (this.sc = buildScene());
    this.sky = new Sky();
    this.farSrc = sc.far;
    this.far = makeCanvas(W, H);
    this.farImg = this.far.g.createImageData(W, H);
    this.farData = new Uint32Array(this.farImg.data.buffer);
    this.farKey = '';
    const wc = makeCanvas(W, H - HZ);
    this.wc = wc;
    this.wImg = wc.g.createImageData(W, H - HZ);
    this.wBuf = new Uint32Array(this.wImg.data.buffer);
    this.mid = layer();
    this.near = layer();

    this.ripples = new Ripples();
    this.splashes = new Splashes();
    const fx = {
      onNet: (x, y) => {
        this.ripples.spawn(x, y, 12, 1.8, 0.9);
        this.ripples.spawn(x, y, 7, 1.2, 0.7);
        this.splashes.burst(x, y, 6, 0.45);
        hooks.onNet && hooks.onNet(x);
      },
      onJump: (x, y) => {
        this.ripples.spawn(x, y, 16, 2.4, 1);
        this.ripples.spawn(x, y, 9, 1.6, 1);
        this.splashes.burst(x, y - 2, 18, 1.1);
        hooks.onSplash && hooks.onSplash(x, 1);
      },
      onSwim: (x, y) => this.ripples.spawn(x, y, 5, 1, 0.7),
      onSlap: (x, y) => {
        this.splashes.burst(x, y, 4, 0.45);
        this.ripples.spawn(x + 4, WL + 1, 5, 1, 0.6);
        hooks.onSlap && hooks.onSlap(x);
      },
      onOar: (x, y) => {
        this.ripples.spawn(x, y + 1, 8, 1.6, 0.7);
        hooks.onOar && hooks.onOar(x);
      },
      onHorn: (x) => hooks.onHorn && hooks.onHorn(x),
      onCaw: (x, n) => hooks.onCaw && hooks.onCaw(x, n),
      onClink: () => hooks.onClink && hooks.onClink(),
    };
    this.ferry = new Ferry(fx);
    this.sail = new Sailboat();
    this.fisher = new Fisher(fx);
    this.kheya = new Kheya(fx);
    this.moored = new Moored();
    this.people = new People(fx);
    this.crows = new Crows(fx);
    this.flock = new Flock();
    this.steam = new Smoke(KETTLE.x - 6, KETTLE.y - 1, { rate: 3, rise: 5, size: 1.6, life: 3.2, drift: 2, a: 0.5 });
    this.kiln = new Smoke(KILN.x, KILN.y - 1, { rate: 2.2, rise: 3, size: 2.4, life: 9, drift: 3, a: 0.45 });

    this.mist = [
      { m: mistBand(40, 3, 0.95), y: 92, sp: 1.3, k: 1, off: 0 },
      { m: mistBand(48, 7, 0.75), y: 118, sp: 2.2, k: 0.85, off: 300 },
      { m: mistBand(60, 11, 0.5), y: 160, sp: 3.4, k: 0.55, off: 600 },
    ];
    this.mistKey = '';
    this.glowLamp = glowSprite(16, [255, 196, 110], 1.4);
    this.glowFire = glowSprite(9, [255, 120, 50], 1.3);
    this.glowSun = glowSprite(70, [255, 200, 140], 1.8, 0.7);
    this.glowSmall = glowSprite(6, [255, 200, 120], 1.3);
    this.vig = this._vignette();
    this.fl = 1;
    this.flT = 0;
  }

  _vignette() {
    const { c, g } = makeCanvas(W, H);
    const grd = g.createRadialGradient(W * 0.55, H * 0.5, H * 0.42, W * 0.55, H * 0.5, W * 0.66);
    grd.addColorStop(0, 'rgb(255,255,255)');
    grd.addColorStop(1, 'rgb(150,144,140)');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    return c;
  }

  gradeRGB(rgb, haze = 0) {
    const L = this.L;
    let r = rgb[0] * L.mul[0] + L.add[0],
      g = rgb[1] * L.mul[1] + L.add[1],
      b = rgb[2] * L.mul[2] + L.add[2];
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    r = l + (r - l) * L.sat;
    g = l + (g - l) * L.sat;
    b = l + (b - l) * L.sat;
    return mix3([clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)], L.mist, haze);
  }

  _far(L, mist) {
    const key = `${L.hour.toFixed(3)}|${mist.toFixed(2)}`;
    if (key === this.farKey) return;
    this.farKey = key;
    const d = this.farImg.data;
    d.set(new Uint8ClampedArray(this.farSrc.d.buffer));
    grade(d, L, 0.3 + 0.45 * mist, L.mist);
    this.far.g.putImageData(this.farImg, 0, 0);
  }

  _water(L, t) {
    const buf = this.wBuf,
      far = this.farData,
      rows = this.sky.rows,
      body = L.body;
    const sunK = L.sunVis * (0.3 + 0.7 * L.low);
    const sun = mix3(L.sun, [255, 250, 235], 0.4);
    const tk = Math.floor(t * 7);
    for (let y = HZ; y < H; y++) {
      const d = (y - HZ) / (H - HZ);
      const sr = rows[Math.max(0, Math.round(HZ - 1 - (y - HZ) * 0.9))];
      const hr = rows[Math.max(0, Math.round(HZ - 14 - (y - HZ) * 1.3))];
      const mf = 0.18 + 0.5 * d;
      const br = lerp(sr[0], body[0], mf),
        bg = lerp(sr[1], body[1], mf),
        bb = lerp(sr[2], body[2], mf);
      const wob = Math.round(Math.sin(y * 0.55 + t * 1.6) * (0.4 + d * 2) + Math.sin(y * 1.7 - t * 2.3) * 0.5);
      const my = HZ - 1 - (y - HZ);
      const fx = 0.05 / (0.12 + d),
        fy = 0.5 / (0.15 + d * 1.2);
      const spread = 5 + d * 70;
      const row = (y - HZ) * W;
      for (let x = 0; x < W; x++) {
        let r = br,
          g = bg,
          b = bb;
        if (my >= 60) {
          const fp = far[my * W + clamp(x + wob, 0, W - 1)];
          if (fp >>> 24) {
            r = lerp(r, (fp & 255) * 0.8, 0.82);
            g = lerp(g, ((fp >>> 8) & 255) * 0.8, 0.82);
            b = lerp(b, ((fp >>> 16) & 255) * 0.82, 0.82);
          }
        }
        const v = vnoise(x * fx + Math.sin(y * 0.4) * 0.6, y * fy * 0.3 - t * 0.35, 1);
        if (v > 0.66) {
          const k = (v - 0.66) * 1.4;
          r = lerp(r, hr[0] + 18, k);
          g = lerp(g, hr[1] + 18, k);
          b = lerp(b, hr[2] + 18, k);
        } else if (v < 0.32) {
          const k = 1 - (0.32 - v) * 0.5;
          r *= k;
          g *= k;
          b *= k;
        }
        if (sunK > 0.02) {
          const dx = Math.abs(x - L.sunX);
          const s = sunK * Math.exp(-dx / spread) * (0.35 + 0.65 * d);
          r = lerp(r, sun[0], s * 0.5);
          g = lerp(g, sun[1], s * 0.5);
          b = lerp(b, sun[2], s * 0.5);
          if (dx < spread * 1.4 && v > 0.5 && hash2(x, y, tk) > 0.97 - s * 0.25) {
            r = sun[0];
            g = sun[1];
            b = sun[2];
          }
        }
        const j = (bayer(x, y) - 0.5) * 5;
        buf[row + x] = pack(clamp(Math.round((r + j) / 3) * 3, 0, 255), clamp(Math.round((g + j) / 3) * 3, 0, 255), clamp(Math.round((b + j) / 3) * 3, 0, 255));
      }
    }
    this.wc.g.putImageData(this.wImg, 0, 0);
  }

  _mist(g, L, t, dt, eff, which) {
    const key = L.mist.map((v) => Math.round(v / 6)).join(',');
    if (key !== this.mistKey) {
      this.mistKey = key;
      for (const b of this.mist) b.c = tint(b.m, L.mist);
    }
    const lift = smooth(5.9, 8.5, L.hour);
    for (const i of which) {
      const b = this.mist[i];
      b.off = (b.off + b.sp * dt) % b.m.width;
      const a = eff * b.k * (i === 0 ? 1 : 1 - lift * 0.4);
      if (a < 0.01) continue;
      g.globalAlpha = Math.min(1, a);
      const y = Math.round(b.y - (i === 0 ? lift * 12 : i === 1 ? lift * 6 : 0));
      const o = Math.round(b.off);
      g.drawImage(b.c, o - b.m.width, y);
      g.drawImage(b.c, o, y);
    }
    g.globalAlpha = 1;
  }

  frame(st, dt) {
    const g = this.g,
      t = st.t;
    const L = (this.L = computeLight(st.hour));
    const mistEff = st.mist * (1 - 0.88 * smooth(6.1, 9.2, st.hour));
    const wind = 0.2;

    // --- update
    this.ripples.update(dt);
    this.splashes.update(dt);
    this.ferry.update(dt, t, wind);
    this.sail.update(dt);
    this.fisher.update(dt);
    this.kheya.update(dt);
    this.people.update(dt, st.hour);
    this.crows.update(dt, st.hour);
    this.flock.update(dt, st.hour);
    this.steam.update(dt, wind);
    this.kiln.update(dt, wind);
    if (Math.random() < dt * 0.9) this.ripples.spawn(236 + Math.random() * 92, 245, 6, 1.4, 0.45);
    if (Math.random() < dt * 0.5) this.ripples.spawn(184 + Math.random() * 30, WL + 2, 5, 1.2, 0.5);
    this.flT += dt;
    if (this.flT > 1 / 10) {
      this.flT = 0;
      this.fl += (0.75 + Math.random() * 0.3 - this.fl) * 0.5;
    }

    // --- sky and far bank
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    this.sky.draw(g, L, t, dt);
    if (L.sunVis > 0.01) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.5 * L.sunVis * (0.35 + 0.65 * L.low);
      g.drawImage(this.glowSun, Math.round(L.sunX - 70), Math.round(L.sunY - 49));
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    this.flock.draw(g, t, css(mix3(L.mid, [20, 20, 30], 0.7)));
    this._far(L, mistEff);
    g.drawImage(this.far.c, 0, 0);
    this.kiln.draw(g, this.gradeRGB([96, 90, 88], 0.35 + 0.4 * mistEff));

    // --- water
    this._water(L, t);
    g.drawImage(this.wc.c, 0, HZ);
    this.ripples.draw(g, css(mix3(L.hz, [255, 255, 255], 0.35), 0.75));
    this._mist(g, L, t, dt, mistEff, [0]);

    // --- mid river, hazed
    const mg = this.mid.g;
    mg.clearRect(0, 0, W, H);
    this.sail.draw(mg, t);
    this.ferry.draw(mg, t);
    this.fisher.draw(mg, t);
    const my0 = 60,
      mh = 150;
    const mid = mg.getImageData(0, my0, W, mh);
    grade(mid.data, L, 0.12 + 0.42 * mistEff, L.mist);
    mg.putImageData(mid, 0, my0);
    g.drawImage(this.mid.c, 0, 0);
    this.ferry.smoke.draw(g, this.gradeRGB([70, 70, 74], 0.2 + 0.3 * mistEff));
    this._mist(g, L, t, dt, mistEff, [1]);

    // --- the ghat
    const ng = this.near.g;
    ng.clearRect(0, 0, W, H);
    ng.globalAlpha = 0.2;
    ng.drawImage(this.sc.sub, 0, 0);
    ng.globalAlpha = 0.38;
    for (let i = 0; i < 52; i++) {
      const dy = WL + i;
      const off = Math.round(Math.sin(dy * 0.7 + t * 2.2) * (0.5 + i * 0.05));
      ng.drawImage(this.sc.near, 96, WL - 1 - i, 150, 1, 96 + off, dy, 150, 1);
    }
    ng.globalAlpha = 1;
    this.moored.reflections(ng, t);
    this.kheya.draw(ng, t);
    ng.drawImage(this.sc.near, 0, 0);
    this.people.drawBack(ng);
    this.moored.draw(ng, t);
    this.people.draw(ng);
    this.crows.draw(ng, t);
    const nd = ng.getImageData(0, 0, W, H);
    grade(nd.data, L, 0.05 * mistEff, L.mist);
    ng.putImageData(nd, 0, 0);
    g.drawImage(this.near.c, 0, 0);
    this.splashes.draw(g, css(this.gradeRGB([230, 236, 238])));
    this.steam.draw(g, this.gradeRGB([236, 236, 232]));

    // --- lamps
    const lamp = 1 - smooth(6.0, 6.6, st.hour);
    g.globalCompositeOperation = 'lighter';
    if (lamp > 0.01) {
      g.globalAlpha = 0.75 * lamp * this.fl;
      g.drawImage(this.glowLamp, LANTERN.x - 16, LANTERN.y - 16);
      g.fillStyle = '#ffd890';
      g.fillRect(LANTERN.x - 1, LANTERN.y - 2, 3, 3);
    }
    g.globalAlpha = (0.3 + 0.5 * L.night) * this.fl;
    g.drawImage(this.glowFire, STOVE.x - 9, STOVE.y - 9);
    g.fillStyle = '#ff9a40';
    g.fillRect(STOVE.x - 1, STOVE.y - 2, 3, 2);
    if (L.night > 0.02) {
      g.globalAlpha = L.night;
      const [fx, fy] = this.fisher.lantern();
      g.drawImage(this.glowSmall, fx - 6, fy - 6);
      g.fillStyle = '#ffd890';
      g.fillRect(fx, fy, 1, 2);
      for (let i = 2; i < 14; i += 2) if (hash2(i, Math.floor(t * 5), 3) > 0.35) g.fillRect(fx + Math.round((hash2(i, Math.floor(t * 5), 7) - 0.5) * 2), this.fisher.wl + i, 1, 1);
      g.fillStyle = `rgba(255,196,120,${(0.85 * L.night).toFixed(2)})`;
      for (const [wx, wy] of this.ferry.lights()) g.fillRect(Math.round(wx), Math.round(wy), 1, 1);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    this._mist(g, L, t, dt, mistEff, [2]);

    // --- post
    g.globalCompositeOperation = 'multiply';
    g.drawImage(this.vig, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }
}
