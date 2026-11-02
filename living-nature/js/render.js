// Frame compositor: sky, backdrop, reflective lake, land, props, creatures, weather.
import { W, H, M, HOR, makeCanvas, tintInto, clamp, lerp, smooth, css, mixc, bay, hex } from './util.js';
import { makeMoon } from './art2.js';
import { hash } from './world.js';
import { isLake, nearY, BRIDGE_POS, CABIN_POS } from './geometry.js';
import { CABIN, BRIDGE } from './art2.js';

const BACK = [
  ['mtnFar', 1.0, 3],
  ['mtnNear', 0.85, 5],
  ['hills', 0.6, 7],
  ['shoreBack', 0.75, 9],
  ['shoreFront', 0.4, 11],
];
const STEP = 9;
const OX_LAND = 13, OX_FORE = 24;

export class Scene {
  constructor(canvas, parts) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    Object.assign(this, parts); // S, layout, backdrop, land, masks, world
    this.bg = makeCanvas(W, HOR + 2);
    this.bgx = this.bg.getContext('2d');
    this.skyCv = makeCanvas(W, HOR + 2);
    this.skyImg = this.skyCv.getContext('2d').createImageData(W, HOR + 2);
    this.moon = makeMoon();
    this.landT = makeCanvas(this.land.cv.width, this.land.cv.height);
    this.layers = {};
    for (const [k] of BACK) this.layers[k] = makeCanvas(this.backdrop[k].width, this.backdrop[k].height);
    this.ripples = Array.from({ length: 170 }, (_, i) => {
      const f = Math.pow(hash(i, 1), 0.75);
      return { x: hash(i, 2) * W, y: HOR + 2 + f * 78, len: 2 + Math.round(hash(i, 3) * (3 + f * 7)), spd: 0.4 + hash(i, 4) * 1.1, ph: hash(i, 5) * 6.28, dr: 1.5 + hash(i, 6) * 5, dark: hash(i, 7) < 0.5 };
    });
    this.vig = this.makeVignette();
    this.skyHash = '';
    this.skyAge = 99;
    this.cam = { x: 0 };
  }

  makeVignette() {
    const cv = makeCanvas(W, H), x = cv.getContext('2d');
    const img = x.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++)
      for (let xx = 0; xx < W; xx++) {
        const dx = (xx - W / 2) / (W / 2), dy = (y - H * 0.46) / (H * 0.56);
        const v = clamp((Math.hypot(dx * 0.92, dy) - 0.72) * 0.9);
        const a = Math.floor(v * v * 5 + bay(xx, y)) / 5;
        const o = (y * W + xx) * 4;
        d[o] = 4; d[o + 1] = 6; d[o + 2] = 14; d[o + 3] = Math.floor(clamp(a) * 255 * 0.85);
      }
    x.putImageData(img, 0, 0);
    return cv;
  }

  retint(look) {
    this.look = look;
    for (const [k, mult] of BACK) tintInto(this.layers[k], this.backdrop[k], look.tint, look.haze, look.hazeA * mult);
    tintInto(this.landT, this.land.cv, look.tint, look.haze, look.hazeA * 0.12);
    for (const s of this.sprites) s.retint(look);
    this.world.retint(look);
    this.waterTint = mixc([14, 60, 88], [60, 146, 150], 0.25).map((v, i) => v * look.tint[i] / 255);
  }

  // ---- sky gradient with ordered dithering ----
  renderSky(look) {
    const d = this.skyImg.data;
    const { top, mid, hor } = look;
    const goldF = smooth(66, 122, look.sunY) * look.sunVis * look.clearSky;
    const sunCol = mixc([255, 240, 205], [255, 150, 72], goldF);
    const sunStr = 0.5 * look.clearSky * look.sunVis;
    const sunR = 52 + goldF * 46;
    const moonStr = 0.3 * look.night * look.moonVis * (1 - look.cover * 0.8);
    const horGlow = goldF * 0.6;
    for (let y = 0; y < HOR + 2; y++) {
      const f = y / HOR;
      const c = f < 0.5 ? mixc(top, mid, smooth(0, 0.5, f)) : mixc(mid, hor, smooth(0.42, 1, f));
      for (let x = 0; x < W; x++) {
        let r = c[0], g = c[1], b = c[2];
        if (sunStr > 0.01) {
          const dx = x - look.sunX, dy = (y - look.sunY) * 1.1;
          const q = Math.exp(-((dx * dx + dy * dy) / (sunR * sunR))) * sunStr;
          r += (sunCol[0] - r) * q; g += (sunCol[1] - g) * q; b += (sunCol[2] - b) * q;
        }
        if (horGlow > 0.01) {
          const hx = Math.exp(-(((x - look.sunX) / 160) ** 2)) * horGlow * Math.pow(f, 2.4);
          r += (255 - r) * hx; g += (132 - g) * hx; b += (70 - b) * hx;
        }
        if (moonStr > 0.01) {
          const dx = x - look.moonX, dy = y - look.moonY;
          const q = Math.exp(-((dx * dx + dy * dy) / 1700)) * moonStr;
          r += (150 - r) * q; g += (172 - g) * q; b += (255 - b) * q;
        }
        const t = bay(x, y);
        const o = (y * W + x) * 4;
        d[o] = clamp(Math.floor(r / STEP + t) * STEP, 0, 255);
        d[o + 1] = clamp(Math.floor(g / STEP + t) * STEP, 0, 255);
        d[o + 2] = clamp(Math.floor(b / STEP + t) * STEP, 0, 255);
        d[o + 3] = 255;
      }
    }
    this.skyCv.getContext('2d').putImageData(this.skyImg, 0, 0);
  }

  drawBackdrop(look, t, env) {
    const x = this.bgx;
    const cx = this.cam.x;
    x.globalAlpha = 1;
    x.drawImage(this.skyCv, 0, 0);
    this.world.sky.drawStars(x, look, t);
    // sun
    const sunA = look.sunVis * look.clearSky * look.clearSky;
    if (sunA > 0.04 && look.sunY < HOR + 12) {
      const goldF = smooth(66, 122, look.sunY);
      const core = mixc([255, 250, 224], [255, 190, 100], goldF), rim = mixc([255, 226, 140], [255, 130, 60], goldF);
      const R = 8;
      for (const [rad, col, a] of [[R + 9, rim, 0.1], [R + 5, rim, 0.18], [R + 2, rim, 0.4]]) {
        x.globalAlpha = a * sunA;
        x.fillStyle = css(col);
        for (let dy = -rad; dy <= rad; dy++) {
          const hw = Math.round(Math.sqrt(rad * rad - dy * dy));
          x.fillRect(Math.round(look.sunX) - hw, Math.round(look.sunY) + dy, hw * 2 + 1, 1);
        }
      }
      x.globalAlpha = sunA;
      for (let dy = -R; dy <= R; dy++) {
        const hw = Math.round(Math.sqrt(R * R + 0.5 - dy * dy));
        x.fillStyle = css(Math.abs(dy) > R - 2 ? rim : core);
        x.fillRect(Math.round(look.sunX) - hw, Math.round(look.sunY) + dy, hw * 2 + 1, 1);
      }
    }
    // moon
    const moonA = look.moonVis * smooth(0.15, 0.7, look.night) * (1 - look.cover * 0.88);
    if (moonA > 0.04) {
      x.globalAlpha = moonA;
      x.drawImage(this.moon, Math.round(look.moonX - 9), Math.round(look.moonY - 9));
    }
    x.globalAlpha = 1;
    this.world.sky.drawClouds(x, look, -cx * 2);
    for (const [k, , par] of BACK) {
      const ox = -Math.round(cx * par) - M;
      x.drawImage(this.layers[k], ox, 0);
    }
    x.globalAlpha = 1;
  }

  drawWater(ctx, look, t, wind, ox) {
    const wt = this.waterTint;
    const y0 = HOR + 1, y1 = 224;
    for (let y = y0; y < y1; y++) {
      const f = (y - HOR) / 80;
      const base = mixc([12, 52, 80], [54, 140, 146], Math.pow(f, 1.4)).map((v, i) => v * look.tint[i] / 255);
      ctx.fillStyle = css(base);
      ctx.fillRect(0, y, W, 1);
    }
    for (let y = y0; y < y1; y++) {
      const dy = y - HOR;
      const f = dy / 80;
      if (hash(y, Math.floor(t * 2.2)) < 0.07 + 0.3 * f) continue;
      const src = HOR - dy * (1 + 0.016 * dy);
      if (src < 0) continue;
      const amp = (0.45 + 2.3 * f) * (0.75 + wind * 0.9 + look.rain * 0.5);
      const dx = Math.round(Math.sin(y * 0.9 + t * 1.5) * amp + Math.sin(y * 0.37 - t * 0.85) * amp * 0.75);
      ctx.globalAlpha = lerp(0.78, 0.4, Math.pow(f, 0.9));
      ctx.drawImage(this.bg, 0, Math.floor(src), W, 1, dx, y, W, 1);
    }
    ctx.globalAlpha = 1;
    // reflections of shore props
    for (const p of this.layout.props) {
      if (!p.reflect) continue;
      const v = p.sp.v[p.y < 172 ? 0 : 1];
      const px = Math.round(p.x - p.sp.ax + ox);
      const hh = Math.min(p.sp.h, 46);
      for (let r = 0; r < hh; r++) {
        const sy = p.sp.h - 1 - r;
        const dyy = p.y + 1 + Math.floor(r * 0.85);
        if (dyy >= y1) break;
        const wob = Math.round(Math.sin(dyy * 0.9 + t * 1.5) * (0.5 + (dyy - HOR) / 60));
        ctx.globalAlpha = 0.5 * (1 - r / hh);
        ctx.drawImage(v, 0, p.sp.h - 1 - r, p.sp.w, 1, px + wob, dyy, p.sp.w, 1);
      }
    }
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = css(wt.map((v) => v * 1.3));
    ctx.fillRect(0, y0, W, y1 - y0);
    ctx.globalAlpha = 1;
    // ripples
    const lightC = look.hor.map((v) => clamp(v * 0.55 + 125, 0, 255));
    const darkC = wt.map((v) => v * 0.55);
    for (const r of this.ripples) {
      const a = 0.5 + 0.5 * Math.sin(t * r.spd + r.ph);
      if (a < 0.42) continue;
      const x = ((r.x + t * r.dr * (0.35 + wind)) % (W + 30)) - 15;
      if (!isLake(x + ox * 0, r.y) && r.y > 150) continue;
      ctx.globalAlpha = (a - 0.4) * (r.dark ? 0.8 : 0.9) * (0.6 + look.day * 0.4);
      ctx.fillStyle = css(r.dark ? darkC : lightC);
      ctx.fillRect(Math.round(x), Math.round(r.y), r.len, 1);
    }
    ctx.globalAlpha = 1;
    // sun / moon glitter
    const sunStr = look.sunVis * look.sunLight;
    const moonStr = look.moonVis * look.night * (1 - look.cover * 0.85);
    const lx = sunStr > moonStr ? look.sunX : look.moonX;
    const gl = Math.max(sunStr, moonStr * 0.85);
    if (gl > 0.05 && (sunStr > moonStr ? look.sunY < HOR - 2 : look.moonY < HOR - 8)) {
      const gc = sunStr > moonStr ? mixc([255, 250, 220], [255, 190, 110], smooth(66, 122, look.sunY)) : [210, 225, 255];
      ctx.fillStyle = css(gc);
      const spin = Math.floor(t * 6);
      for (let y = y0 + 1; y < y1; y += 1) {
        const f = (y - HOR) / 80;
        const sigma = 3 + f * 18;
        for (let k = 0; k < 2; k++) {
          const h = hash(y * 7 + k, spin);
          if (h > 0.34) continue;
          const g = (hash(y * 3 + k, spin + 11) - 0.5) * 2 * sigma;
          ctx.globalAlpha = gl * (0.9 - f * 0.35) * (1 - Math.abs(g) / (sigma * 1.2));
          ctx.fillRect(Math.round(lx + g), y, 1 + Math.round(hash(y, spin + k) * (2 + f * 4)), 1);
        }
      }
      ctx.globalAlpha = 1;
    }
    // lily pads
    const padC = [58, 120, 52].map((v, i) => v * look.tint[i] / 255);
    for (const l of this.layout.lilies) {
      const y = Math.round(l.y + Math.sin(t * 0.8 + l.ph) * 0.5);
      const rx = Math.round(l.r);
      ctx.fillStyle = css(padC.map((v) => v * 0.7));
      ctx.fillRect(Math.round(l.x) - rx, y + 1, rx * 2, 1);
      ctx.fillStyle = css(padC);
      ctx.fillRect(Math.round(l.x) - rx + 1, y, rx * 2 - 1, 1);
      ctx.fillStyle = css(padC.map((v) => v * 1.25));
      ctx.fillRect(Math.round(l.x) - 1, y, 1, 1);
      if (l.bloom) {
        ctx.fillStyle = css([240, 150, 190].map((v, i) => v * look.tint[i] / 255));
        ctx.fillRect(Math.round(l.x) + 1, y - 1, 2, 1);
        ctx.fillStyle = css([255, 230, 150].map((v, i) => v * look.tint[i] / 255));
        ctx.fillRect(Math.round(l.x) + 1, y - 2, 1, 1);
      }
    }
  }

  drawStream(ctx, look, t, wind, ox) {
    // moving highlights flowing down the outlet stream
    const pts = this.world.streamPts;
    const hi = look.hor.map((v, i) => clamp((v * 0.5 + 130) * look.tint[i] / 255, 0, 255));
    const lo = this.waterTint.map((v) => v * 0.6);
    const total = pts.length;
    for (const f of this.world.flow) {
      const s = ((f.s + t * f.v) % total + total) % total;
      const p = pts[Math.floor(s)];
      if (!p) continue;
      const x = Math.round(p.x + f.o * p.r * 0.85 + ox);
      const y = Math.round(p.y);
      const a = 0.75 * smooth(0, 0.2, s / total);
      ctx.globalAlpha = a * (0.6 + look.day * 0.4);
      ctx.fillStyle = css(f.dark ? lo : hi);
      ctx.fillRect(x, y, f.len, 1);
      if (!f.dark && f.len > 2) ctx.fillRect(x + 1, y + 1, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  glowSpill(ctx, look, ox) {
    const L = look.lights;
    if (L < 0.03) return;
    const flick = 0.92 + 0.08 * Math.sin(this.t * 7.3) * Math.sin(this.t * 3.1);
    const cx = Math.round(CABIN_POS.x - 33 + ox);
    const cy = CABIN_POS.y - 54;
    ctx.globalCompositeOperation = 'lighter';
    // window light on the ground
    ctx.fillStyle = `rgba(255,170,70,${0.13 * L * flick})`;
    for (const [dx, dy, w, h] of [[8, 47, 26, 5], [12, 49, 18, 5], [14, 51, 12, 3]]) ctx.fillRect(cx + dx, cy + dy, w, h);
    ctx.fillStyle = `rgba(255,190,90,${0.1 * L * flick})`;
    for (const [dx, dy, w, h] of [[32, 44, 16, 6], [20, 41, 12, 4]]) ctx.fillRect(cx + dx, cy + dy, w, h);
    // halos around lantern and windows
    ctx.fillStyle = `rgba(255,200,110,${0.12 * L * flick})`;
    ctx.fillRect(cx + 23, cy + 34, 9, 10);
    ctx.fillRect(cx + 32, cy + 31, 18, 13);
    ctx.fillStyle = `rgba(255,200,110,${0.08 * L * flick})`;
    ctx.fillRect(cx + 21, cy + 32, 13, 14);
    ctx.fillRect(cx + 30, cy + 29, 22, 17);
    ctx.globalCompositeOperation = 'source-over';
  }

  drawProps(ctx, look, t, wind, oxL, oxF) {
    const props = this.layout.props;
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      const ox = p.fore ? oxF : oxL;
      const sp = p.sp;
      const dx = Math.round(p.x - sp.ax + ox), dy = Math.round(p.y - sp.ay);
      if (dx > W + 4 || dx + sp.w < -4 || dy > H) continue;
      const v = sp.v[p.y < 172 ? 0 : p.y < 214 ? 1 : 2];
      if (p.type === 'bridge') {
        ctx.fillStyle = 'rgba(8,20,30,0.28)';
        ctx.fillRect(dx + 14, p.y - 12, 68, 5);
        ctx.fillStyle = 'rgba(8,20,30,0.18)';
        ctx.fillRect(dx + 20, p.y - 8, 56, 3);
        ctx.drawImage(v, dx, dy);
        continue;
      }
      if (p.type === 'cabin') {
        ctx.drawImage(v, dx, dy);
        const L = look.lights;
        if (L > 0.02) {
          ctx.globalAlpha = L * (0.94 + 0.06 * Math.sin(t * 7.3));
          ctx.drawImage(this.S.cabinGlow, dx, dy);
          ctx.globalAlpha = 1;
        }
        continue;
      }
      if (p.strip > 50 || p.amp === 0) { ctx.drawImage(v, dx, dy); continue; }
      const tall = p.type === 'tree';
      const base = wind * 0.55;
      const osc = Math.sin(t * (1.0 + wind * 1.1) + p.ph + p.x * 0.018) * 0.65 + Math.sin(t * 2.4 + p.ph * 1.7) * 0.35 * wind;
      const sway = (base + osc * (0.3 + wind * 0.85)) * p.amp * (tall ? 1 : 1.15);
      if (Math.abs(sway) < 0.45) { ctx.drawImage(v, dx, dy); continue; }
      const h = sp.h, w = sp.w, st = p.strip;
      for (let sy = 0; sy < h; sy += st) {
        const hh = Math.min(st, h - sy);
        const f = 1 - (sy + hh / 2) / h;
        const off = Math.round(sway * f * f);
        ctx.drawImage(v, 0, sy, w, hh, dx + off, dy + sy, w, hh);
      }
    }
  }

  frame(t, env, wind) {
    this.t = t;
    const look = env.look;
    const ctx = this.ctx;
    const cx = this.cam.x;
    const oxL = -Math.round(cx * OX_LAND), oxF = -Math.round(cx * OX_FORE);
    this.skyAge++;
    if (this.skyAge > 4 || env.dirty) { this.renderSky(look); this.skyAge = 0; }
    this.drawBackdrop(look, t, env);
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bg, 0, 0, W, HOR + 2);
    this.drawWater(ctx, look, t, wind, oxL);
    this.world.ripples.draw(ctx, look);
    this.world.fish.draw(ctx, look);
    this.world.mist.draw(ctx, look, t, false, oxL * 0.5);
    ctx.drawImage(this.landT, -M + oxL, 0);
    this.drawStream(ctx, look, t, wind, oxL);
    this.drawProps(ctx, look, t, wind, oxL, oxF);
    this.world.frogs.draw(ctx, look, oxL);
    this.world.smoke.draw(ctx, look, oxL);
    this.glowSpill(ctx, look, oxL);
    this.world.leaves.draw(ctx, look, oxL);
    this.world.butterflies.draw(ctx, look, oxL, env.butterflyVis);
    this.world.birds.draw(ctx, look, -cx * 3);
    this.world.fireflies.draw(ctx, look, t, oxL, env.fireflyVis);
    this.world.mist.draw(ctx, look, t, true, oxL);
    this.world.rain.draw(ctx, look, env);
    ctx.globalAlpha = 0.5 + look.night * 0.3 + look.rain * 0.1;
    ctx.drawImage(this.vig, 0, 0);
    ctx.globalAlpha = 1;
  }
}
