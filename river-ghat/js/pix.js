// Software pixel painter: every primitive writes straight into a Uint32 buffer,
// so sprites are authored with hard pixel edges (no canvas anti-aliasing).
import { pack, unpack } from './util.js';

export class Pix {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint32Array(w * h);
  }
  clear() {
    this.d.fill(0);
    return this;
  }
  get(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  set(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.d[y * this.w + x] = c;
  }
  // set only where empty
  under(x, y, c) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    const i = y * this.w + x;
    if (!(this.d[i] >>> 24)) this.d[i] = c;
  }
  // blend a translucent colour (alpha 0..1) over an opaque pixel
  tint(x, y, rgb, a) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    const v = this.d[i];
    if (!(v >>> 24)) return;
    const u = unpack(v);
    this.d[i] = pack(u[0] + (rgb[0] - u[0]) * a, u[1] + (rgb[1] - u[1]) * a, u[2] + (rgb[2] - u[2]) * a, 255);
  }
  _c(c, x, y) {
    return typeof c === 'function' ? c(x, y) : c;
  }
  hl(x0, x1, y, c) {
    x0 = Math.round(x0);
    x1 = Math.round(x1);
    y = Math.floor(y);
    if (y < 0 || y >= this.h) return;
    if (x0 > x1) [x0, x1] = [x1, x0];
    if (x0 < 0) x0 = 0;
    if (x1 >= this.w) x1 = this.w - 1;
    const fn = typeof c === 'function';
    for (let x = x0; x <= x1; x++) {
      const v = fn ? c(x, y) : c;
      if (v) this.d[y * this.w + x] = v;
    }
  }
  vl(x, y0, y1, c) {
    x = Math.floor(x);
    y0 = Math.round(y0);
    y1 = Math.round(y1);
    if (x < 0 || x >= this.w) return;
    if (y0 > y1) [y0, y1] = [y1, y0];
    const fn = typeof c === 'function';
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) {
      const v = fn ? c(x, y) : c;
      if (v) this.d[y * this.w + x] = v;
    }
  }
  rect(x, y, w, h, c) {
    x = Math.round(x);
    y = Math.round(y);
    for (let j = 0; j < h; j++) this.hl(x, x + w - 1, y + j, c);
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0),
      dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1,
      sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, this._c(c, x0, y0));
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }
  disc(cx, cy, r, c) {
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) {
      const v = r * r + r * 0.7 - dy * dy;
      if (v < 0) continue;
      const hw = Math.floor(Math.sqrt(v));
      this.hl(cx - hw, cx + hw, cy + dy, c);
    }
  }
  ell(cx, cy, rx, ry, c) {
    const ri = Math.ceil(ry);
    for (let dy = -ri; dy <= ri; dy++) {
      const t = 1 - (dy * dy) / (ry * ry + ry * 0.5);
      if (t < 0) continue;
      const hw = Math.floor(rx * Math.sqrt(t) + 0.35);
      this.hl(cx - hw, cx + hw, cy + dy, c);
    }
  }
  poly(pts, c) {
    let ymin = Infinity,
      ymax = -Infinity;
    for (const p of pts) {
      if (p[1] < ymin) ymin = p[1];
      if (p[1] > ymax) ymax = p[1];
    }
    const n = pts.length;
    const y0 = Math.max(0, Math.floor(ymin)),
      y1 = Math.min(this.h - 1, Math.ceil(ymax));
    for (let y = y0; y <= y1; y++) {
      const yc = y + 0.5;
      const xs = [];
      for (let i = 0; i < n; i++) {
        const a = pts[i],
          b = pts[(i + 1) % n];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
          xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.ceil(xs[k] - 0.5),
          xb = Math.floor(xs[k + 1] - 0.5);
        if (xb >= xa) this.hl(xa, xb, y, c);
      }
    }
  }
  // shader fill over a rectangle: fn(x,y) -> packed colour or 0
  shader(x0, y0, x1, y1, fn) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, fn(x, y));
  }
  blit(src, dx, dy, o = {}) {
    const { flipX = false, flipY = false, under = false } = o;
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const v = src.d[y * src.w + x];
        if (!(v >>> 24)) continue;
        const px = dx + (flipX ? src.w - 1 - x : x),
          py = dy + (flipY ? src.h - 1 - y : y);
        if (under) this.under(px, py, v);
        else this.set(px, py, v);
      }
    }
    return this;
  }
  // add a 1px outline in colour c around opaque pixels
  outline(c, diag = false) {
    const out = new Uint32Array(this.d);
    const { w, h, d } = this;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (d[y * w + x] >>> 24) continue;
        let hit = false;
        if (x > 0 && d[y * w + x - 1] >>> 24) hit = true;
        else if (x < w - 1 && d[y * w + x + 1] >>> 24) hit = true;
        else if (y > 0 && d[(y - 1) * w + x] >>> 24) hit = true;
        else if (y < h - 1 && d[(y + 1) * w + x] >>> 24) hit = true;
        else if (diag) {
          if (x > 0 && y > 0 && d[(y - 1) * w + x - 1] >>> 24) hit = true;
          else if (x < w - 1 && y > 0 && d[(y - 1) * w + x + 1] >>> 24) hit = true;
          else if (x > 0 && y < h - 1 && d[(y + 1) * w + x - 1] >>> 24) hit = true;
          else if (x < w - 1 && y < h - 1 && d[(y + 1) * w + x + 1] >>> 24) hit = true;
        }
        if (hit) out[y * w + x] = c;
      }
    }
    this.d = out;
    return this;
  }
  bounds() {
    let x0 = this.w,
      y0 = this.h,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.d[y * this.w + x] >>> 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  toCanvas() {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    const g = c.getContext('2d');
    const id = new ImageData(new Uint8ClampedArray(this.d.buffer.slice(0)), this.w, this.h);
    g.putImageData(id, 0, 0);
    return c;
  }
  // Trim to content; anchor (ax,ay) is a point in this buffer that becomes (ox,oy) in the sprite.
  sprite(ax = 0, ay = 0) {
    const b = this.bounds();
    if (!b) {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      return { c, ox: 0, oy: 0, w: 1, h: 1 };
    }
    const w = b.x1 - b.x0 + 1,
      h = b.y1 - b.y0 + 1;
    const t = new Pix(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) t.d[y * w + x] = this.d[(y + b.y0) * this.w + x + b.x0];
    return { c: t.toCanvas(), ox: ax - b.x0, oy: ay - b.y0, w, h };
  }
}

export function drawSprite(g, s, x, y) {
  g.drawImage(s.c, Math.round(x - s.ox), Math.round(y - s.oy));
}
