// Frame pipeline: sky -> mountains -> snowfield -> cabin -> life -> snowfall -> post.
import { W, H, clamp, smooth, hash2, makeCanvas } from './util.js';
import { buildScene, HORIZON, MOON, WIN, WIN2, LANTERN, CHIMNEY, POND } from './scene.js';
import { Sky } from './sky.js';
import { Snow, Smoke, Clumps, Glints, Spindrift, glowSprite, spillSprite } from './fx.js';
import { Deer, Owl } from './fauna.js';

export class Renderer {
  constructor(canvas, hooks = {}) {
    this.g = canvas.getContext('2d');
    this.g.imageSmoothingEnabled = false;
    const sc = (this.sc = buildScene());
    this.sky = new Sky();
    this.snow = new Snow();
    this.smoke = new Smoke();
    this.glints = new Glints(sc.glints);
    this.drift = new Spindrift();
    this.clumps = new Clumps([...sc.trees.mid, ...sc.trees.fore, ...sc.trees.fore], (x, p) => hooks.onThump && hooks.onThump(x, p));
    this.deer = new Deer((x) => hooks.onStep && hooks.onStep(x));
    this.owl = new Owl(() => hooks.onHoot && hooks.onHoot(this.owlAt.wx));

    // owl perch: a bough of the near-left pine, about eye level
    const tr = sc.trees.fore[0],
      m = tr.model;
    let best = null;
    for (const T of m.tiers) {
      const dx = Math.round(T.hw * 0.56);
      const py = m.surf(T, dx);
      const wy = tr.wy(py);
      if (!best || Math.abs(wy - 166) < Math.abs(best.wy - 166)) best = { wx: tr.wx(m.cx + dx), wy, row: tr.row(py) };
    }
    this.owlAt = best;

    // aurora light on the snow: the ground silhouette filled with one colour
    const gt = makeCanvas(W, H);
    gt.g.drawImage(sc.ground, 0, 0);
    gt.g.globalCompositeOperation = 'source-in';
    gt.g.fillStyle = 'rgb(60,215,160)';
    gt.g.fillRect(0, 0, W, H);
    this.groundTint = gt.c;

    this.pbox = { x: POND.cx - POND.rx - 1, y: POND.cy - POND.ry - 1, w: POND.rx * 2 + 3, h: POND.ry * 2 + 3 };
    this.pt = makeCanvas(this.pbox.w, this.pbox.h);

    this.glowWin = glowSprite(30, [255, 170, 82], 1.6);
    this.glowSmall = glowSprite(11, [255, 170, 82], 1.5);
    this.glowLamp = glowSprite(14, [255, 186, 96], 1.4);
    this.glowEmber = glowSprite(6, [255, 130, 60], 1.3);
    this.spill = spillSprite();
    this.vig = this._vignette();

    this.fl = 0.92;
    this.flT = 0;
    this.lampFl = 1;
    this.sil = { next: 13, pos: 0, dir: 1, pause: 0, on: false };
  }

  _vignette() {
    const { c, g } = makeCanvas(W, H);
    const grd = g.createRadialGradient(W / 2, H * 0.55, H * 0.42, W / 2, H * 0.55, W * 0.66);
    grd.addColorStop(0, 'rgb(255,255,255)');
    grd.addColorStop(1, 'rgb(118,124,150)');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    return c;
  }

  _swayAt(tr, row, t, wind) {
    const f = 1 - row / tr.spr.h;
    return Math.round(tr.amp * Math.pow(clamp(f, 0, 1), 1.4) * (wind.lean * 0.7 + wind.osc * Math.sin(t * tr.sp + tr.ph + f * 2.2)));
  }

  _tree(g, tr, t, wind) {
    const s = tr.spr;
    const x0 = Math.round(tr.x - s.ox),
      y0 = Math.round(tr.y - s.oy);
    for (let sy = 0; sy < s.h; sy += tr.slice) {
      const hh = Math.min(tr.slice, s.h - sy);
      if (y0 + sy >= H) break;
      g.drawImage(s.c, 0, sy, s.w, hh, x0 + this._swayAt(tr, sy + hh / 2, t, wind), y0 + sy, s.w, hh);
    }
  }

  _pond(g, t, clear) {
    const { x: bx, y: by, w: bw, h: bh } = this.pbox;
    const pg = this.pt.g;
    pg.globalCompositeOperation = 'source-over';
    pg.clearRect(0, 0, bw, bh);
    const col = this.sky.col;
    for (let x = 0; x < bw; x++) {
      const a = Math.min(0.5, Math.floor(col[bx + x] * 0.5 * 8) / 8);
      if (a <= 0) continue;
      pg.fillStyle = `rgba(60,225,165,${a})`;
      pg.fillRect(x, 0, 1, bh);
    }
    if (clear > 0.2) {
      pg.fillStyle = `rgba(190,212,255,${(0.75 * clear).toFixed(2)})`;
      const mx = MOON.x - bx;
      const k = Math.floor(t * 5);
      for (let y = 2; y < bh - 2; y++) {
        if (hash2(y, k, 11) < 0.3) continue;
        const w = 1 + (hash2(y, k, 3) > 0.5 ? 1 : 0) + (y > bh / 2 ? 1 : 0);
        pg.fillRect(mx - (w >> 1) + Math.round((hash2(y, k, 7) - 0.5) * 3), y, w, 1);
      }
    }
    pg.globalCompositeOperation = 'destination-in';
    pg.drawImage(this.sc.pondMask, bx, by, bw, bh, 0, 0, bw, bh);
    g.globalCompositeOperation = 'lighter';
    g.drawImage(this.pt.c, bx, by);
    g.globalCompositeOperation = 'source-over';
  }

  _window(g, dt) {
    const a = clamp((1 - this.fl) * 0.95, 0, 0.3);
    g.fillStyle = `rgba(140,48,0,${a.toFixed(3)})`;
    g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    g.fillRect(WIN2.x, WIN2.y, WIN2.w, WIN2.h);
    // someone moving about inside
    const s = this.sil;
    if (!s.on) {
      s.next -= dt;
      if (s.next <= 0) {
        s.on = true;
        s.dir = Math.random() < 0.5 ? 1 : -1;
        s.pos = s.dir > 0 ? -5 : WIN.w + 5;
        s.pause = Math.random() < 0.55 ? 2.5 + Math.random() * 3 : 0;
      }
    } else {
      const mid = WIN.w * 0.32;
      if (s.pause > 0 && Math.abs(s.pos - mid) < 0.6) s.pause -= dt;
      else s.pos += s.dir * 5.5 * dt;
      if (s.pos < -6 || s.pos > WIN.w + 6) {
        s.on = false;
        s.next = 16 + Math.random() * 30;
      }
      g.save();
      g.beginPath();
      g.rect(WIN.x, WIN.y, WIN.w, WIN.h);
      g.clip();
      const px = Math.round(WIN.x + s.pos);
      g.fillStyle = '#5e2c12';
      g.fillRect(px - 2, WIN.y + 3, 4, 4);
      g.fillRect(px - 1, WIN.y + 2, 2, 1);
      g.fillRect(px - 3, WIN.y + 7, 6, WIN.h - 7);
      g.fillRect(px - 4, WIN.y + 9, 8, WIN.h - 9);
      g.restore();
    }
    g.fillStyle = '#24160f';
    g.fillRect(WIN.x + 10, WIN.y, 1, WIN.h);
    g.fillRect(WIN.x, WIN.y + 6, WIN.w, 1);
  }

  frame(st, dt) {
    const g = this.g,
      sc = this.sc,
      t = st.t,
      wind = st.wind;
    const clear = 1 - smooth(0.32, 0.86, st.snow);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    // --- update
    this.snow.update(dt, wind, t);
    this.smoke.update(dt, wind, t);
    this.drift.update(dt, wind, t);
    this.clumps.update(dt, wind);
    this.deer.update(dt, wind, t);
    this.owl.update(dt, wind);
    this.flT += dt;
    if (this.flT >= 1 / 12) {
      this.flT = 0;
      this.fl += (0.78 + Math.random() * 0.26 - this.fl) * 0.55;
      this.lampFl += (0.86 + Math.random() * 0.18 - this.lampFl) * 0.4;
    }

    // --- sky and distance
    this.sky.draw(g, t, dt, clear, st.aurora);
    g.drawImage(sc.mountains, 0, 0);
    if (clear < 0.99) {
      g.fillStyle = `rgba(30,42,82,${((1 - clear) * 0.82).toFixed(3)})`;
      g.fillRect(0, 0, W, HORIZON + 8);
    }
    g.drawImage(sc.treeline, 0, 0);
    g.drawImage(sc.ground, 0, 0);
    const al = this.sky.level;
    if (al > 0.02) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(0.2, al * 0.2);
      g.drawImage(this.groundTint, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    this._pond(g, t, clear);
    this.snow.draw(g, 0, st.snow, wind);

    // --- cabin and its pines
    for (const tr of sc.trees.mid) this._tree(g, tr, t, wind);
    this.clumps.draw(g, false);
    g.drawImage(sc.cabin, 0, 0);
    this._window(g, dt);
    g.globalCompositeOperation = 'lighter';
    const wcx = Math.round(WIN.x + WIN.w / 2),
      wcy = Math.round(WIN.y + WIN.h / 2);
    g.globalAlpha = 0.5 * this.fl;
    g.drawImage(this.glowWin, wcx - (this.glowWin.width >> 1), wcy - (this.glowWin.height >> 1));
    g.globalAlpha = 0.62 * this.fl;
    g.drawImage(this.spill, wcx - 35, 216);
    g.globalAlpha = 0.4 * this.fl;
    g.drawImage(this.glowSmall, WIN2.x + 3 - (this.glowSmall.width >> 1), WIN2.y + 4 - (this.glowSmall.height >> 1));
    g.globalAlpha = 0.6 * this.lampFl;
    g.drawImage(this.glowLamp, LANTERN.x - (this.glowLamp.width >> 1), LANTERN.y - (this.glowLamp.height >> 1) + 1);
    g.globalAlpha = 0.4 * this.fl;
    g.drawImage(this.glowEmber, CHIMNEY.x - 6, CHIMNEY.y - 5);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    this.deer.draw(g);
    this.smoke.draw(g);
    this.glints.draw(g, t, clear * (1 - wind.speed * 0.6));
    this.snow.draw(g, 1, st.snow, wind);

    // --- near pines frame the scene
    const fore = sc.trees.fore;
    this._tree(g, fore[0], t, wind);
    this.owl.draw(g, this.owlAt.wx + this._swayAt(fore[0], this.owlAt.row, t, wind), this.owlAt.wy);
    this._tree(g, fore[1], t, wind);
    this.clumps.draw(g, true);
    this.snow.draw(g, 2, st.snow, wind);
    this.drift.draw(g, wind);

    // --- post
    const white = smooth(0.55, 1, st.snow) * (0.1 + 0.16 * wind.speed);
    if (white > 0.01) {
      g.fillStyle = `rgba(150,170,214,${white.toFixed(3)})`;
      g.fillRect(0, 0, W, H);
    }
    g.globalCompositeOperation = 'multiply';
    g.drawImage(this.vig, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }
}
