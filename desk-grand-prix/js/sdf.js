// Signed-distance helpers and a surface-nets mesher. No three.js dependency, so the
// same code runs in the mesh workers and (as a fallback) on the main thread.
// Distances are in real-car metres; the toy is scaled down to 1:64 afterwards.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function smin(a, b, k) { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); }
export function smax(a, b, k) { return -smin(-a, -b, k); }

// piecewise-linear lookup: table = [[x0, v0], [x1, v1], ...] sorted by x
export function pw(x, table) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, v0] = table[i - 1], [x1, v1] = table[i];
      return v0 + (v1 - v0) * (x - x0) / (x1 - x0);
    }
  }
  return table[table.length - 1][1];
}

// exact 2D polygon distance (negative inside), flat [x0, y0, x1, y1, ...]
export function polySDF(pts) {
  const n = pts.length / 2;
  return (px, py) => {
    let d = (px - pts[0]) ** 2 + (py - pts[1]) ** 2, s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const xi = pts[2 * i], yi = pts[2 * i + 1], xj = pts[2 * j], yj = pts[2 * j + 1];
      const ex = xj - xi, ey = yj - yi, wx = px - xi, wy = py - yi;
      const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1);
      const bx = wx - ex * t, by = wy - ey * t, dd = bx * bx + by * by;
      if (dd < d) d = dd;
      const c1 = py >= yi, c2 = py < yj, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };
}

// extrude a 2D profile distance d2 by a lateral distance dl (= |z| - halfWidth), with
// every edge rounded to radius r while keeping the outer dimensions
export function roundExtrude(d2, dl, r) {
  const a = d2 + r, b = dl + r;
  const ox = a > 0 ? a : 0, oy = b > 0 ? b : 0;
  return Math.min(Math.max(a, b), 0) + Math.sqrt(ox * ox + oy * oy) - r;
}

export function sdRoundBox(px, py, pz, hx, hy, hz, r) {
  const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r, qz = Math.abs(pz) - hz + r;
  const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

// rounded rectangle in 2D
export function sdRoundRect(px, py, hx, hy, r) {
  const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r;
  const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0;
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - r;
}

const CORNERS = [];
for (let c = 0; c < 8; c++) CORNERS.push([c & 1, (c >> 1) & 1, (c >> 2) & 1]);
const EDGES = [];
for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) {
  const x = a ^ b; if (x === 1 || x === 2 || x === 4) EDGES.push([a, b]);
}

// Surface nets: one vertex per sign-changing cell, projected onto the surface along the
// gradient, quads across every sign-changing grid edge. Normals come from the field
// gradient, so the soft die-cast edges shade smoothly. 'wear' is the field's Laplacian
// (high on convex edges), used by the paint shader for chipped edges.
export function surfaceNets(f, min, max, step) {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const sxy = nx * ny;
  const vals = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) {
    const z = min[2] + k * step;
    for (let j = 0; j < ny; j++) {
      const y = min[1] + j * step;
      let o = j * nx + k * sxy;
      for (let i = 0; i < nx; i++) vals[o++] = f(min[0] + i * step, y, z);
    }
  }
  const cnx = nx - 1, cny = ny - 1, cnz = nz - 1;
  const cellV = new Int32Array(cnx * cny * cnz).fill(-1);
  const pos = [], nrm = [], wear = [];
  const e = step * 0.9, e2 = e * e, h = step * 0.25;
  const cv = new Float32Array(8);
  for (let k = 0; k < cnz; k++) for (let j = 0; j < cny; j++) for (let i = 0; i < cnx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const C = CORNERS[c];
      const v = vals[(i + C[0]) + (j + C[1]) * nx + (k + C[2]) * sxy];
      cv[c] = v; if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let ax = 0, ay = 0, az = 0, cnt = 0;
    for (const [a, b] of EDGES) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), A = CORNERS[a], B = CORNERS[b];
      ax += A[0] + (B[0] - A[0]) * t; ay += A[1] + (B[1] - A[1]) * t; az += A[2] + (B[2] - A[2]) * t; cnt++;
    }
    let px = min[0] + (i + ax / cnt) * step, py = min[1] + (j + ay / cnt) * step, pz = min[2] + (k + az / cnt) * step;
    // one Newton step onto the surface, kept inside a cell-and-a-half
    {
      const d = f(px, py, pz);
      const gx = f(px + h, py, pz) - f(px - h, py, pz), gy = f(px, py + h, pz) - f(px, py - h, pz), gz = f(px, py, pz + h) - f(px, py, pz - h);
      const g2 = (gx * gx + gy * gy + gz * gz) / (4 * h * h);
      if (g2 > 1e-8) {
        const s = d / g2 / (2 * h);
        const cx = min[0] + (i + 0.5) * step, cy = min[1] + (j + 0.5) * step, cz = min[2] + (k + 0.5) * step, lim = step * 0.95;
        px = clamp(px - gx * s, cx - lim, cx + lim); py = clamp(py - gy * s, cy - lim, cy + lim); pz = clamp(pz - gz * s, cz - lim, cz + lim);
      }
    }
    const d0 = f(px, py, pz);
    const xp = f(px + e, py, pz), xm = f(px - e, py, pz), yp = f(px, py + e, pz), ym = f(px, py - e, pz), zp = f(px, py, pz + e), zm = f(px, py, pz - e);
    let nx_ = xp - xm, ny_ = yp - ym, nz_ = zp - zm;
    const nl = Math.hypot(nx_, ny_, nz_) || 1;
    nx_ /= nl; ny_ /= nl; nz_ /= nl;
    const lap = (xp + xm + yp + ym + zp + zm - 6 * d0) / e2;
    cellV[i + j * cnx + k * cnx * cny] = pos.length / 3;
    pos.push(px, py, pz); nrm.push(nx_, ny_, nz_); wear.push(lap);
  }
  const idx = [];
  const cell = (i, j, k) => cellV[i + j * cnx + k * cnx * cny];
  const quad = (a, b, c, d) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    // pick the shorter diagonal, then orient by the averaged vertex normal
    const P = pos, N = nrm;
    const dac = (P[3 * a] - P[3 * c]) ** 2 + (P[3 * a + 1] - P[3 * c + 1]) ** 2 + (P[3 * a + 2] - P[3 * c + 2]) ** 2;
    const dbd = (P[3 * b] - P[3 * d]) ** 2 + (P[3 * b + 1] - P[3 * d + 1]) ** 2 + (P[3 * b + 2] - P[3 * d + 2]) ** 2;
    const tris = dac <= dbd ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const [p, q, r] of tris) {
      const ux = P[3 * q] - P[3 * p], uy = P[3 * q + 1] - P[3 * p + 1], uz = P[3 * q + 2] - P[3 * p + 2];
      const vx = P[3 * r] - P[3 * p], vy = P[3 * r + 1] - P[3 * p + 1], vz = P[3 * r + 2] - P[3 * p + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      const ax = N[3 * p] + N[3 * q] + N[3 * r], ay = N[3 * p + 1] + N[3 * q + 1] + N[3 * r + 1], az = N[3 * p + 2] + N[3 * q + 2] + N[3 * r + 2];
      if (fx * ax + fy * ay + fz * az >= 0) idx.push(p, q, r); else idx.push(p, r, q);
    }
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const o = i + j * nx + k * sxy, v0 = vals[o] < 0;
    // edge along x: the four cells around it share ci = i
    if (i < cnx && j >= 1 && j < cny && k >= 1 && k < cnz && v0 !== (vals[o + 1] < 0))
      quad(cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k));
    // edge along y
    if (j < cny && i >= 1 && i < cnx && k >= 1 && k < cnz && v0 !== (vals[o + nx] < 0))
      quad(cell(i - 1, j, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i - 1, j, k));
    // edge along z
    if (k < cnz && i >= 1 && i < cnx && j >= 1 && j < cny && v0 !== (vals[o + sxy] < 0))
      quad(cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k));
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(nrm),
    wear: new Float32Array(wear),
    index: new Uint32Array(idx),
  };
}
