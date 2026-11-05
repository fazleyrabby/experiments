"""
First-rate carved work, generated in Blender and exported as a GLB.

Run headless (never touches an open .blend):
  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
      --python tools/blender/firstrate_carved.py -- assets/firstrate_carved.glb

Everything here is built from code: the stern gallery (three tiers of framed windows,
pilasters, cable mouldings, paterae, open stern walks with turned balusters and scroll
brackets), carved quarter-piece figures, the taffrail with its arms and three lanterns,
the quarter galleries, a leaping lion figurehead and a 32-pounder barrel for instancing.
Ambient occlusion is baked into a vertex colour layer ("AO") against the hull, which is
present only as an occluder. Coordinates are the ship's local three.js frame (y up,
+x forward), exported with export_yup=False so they arrive unchanged.

The hull form functions mirror js/firstrate.js; keep them in step.
"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/firstrate_carved.glb'

from firstrate_form import *

# surface frame on the stern gallery at (hn, w): position, across (+z-ish), up, outward (aft)
def gframe(hn, w):
    e = 1e-3
    p = sternAt(hn, w)
    Tw = (sternAt(hn, w + e) - sternAt(hn, w - e)).normalized()
    Uh = (sternAt(hn + e, w) - sternAt(hn - e, w)).normalized()
    N = Tw.cross(Uh).normalized(); U = N.cross(Tw).normalized()
    return p, Tw, U, N
def flat_out(N):
    h = Vector((N.x, 0, N.z)); return h.normalized()

BAL = [(0.065, 0), (0.065, 0.05), (0.035, 0.09), (0.05, 0.16), (0.075, 0.3), (0.078, 0.38), (0.05, 0.5), (0.03, 0.6), (0.032, 0.66), (0.055, 0.7), (0.06, 0.76), (0.06, 0.8)]
PATERA = [(0.0, 0.07), (0.05, 0.065), (0.09, 0.045), (0.11, 0.02), (0.13, 0.0)]

# ------------------------------------------------------------------ stern gallery
def window(o, Tw, U, N, w, h, frame='frame'):
    M = frameM(o, Tw, U, N)
    t = 0.085
    for (x, y, sx, sy) in [(-w / 2, 0, t, h + t), (w / 2, 0, t, h + t), (0, -h / 2, w + t, t), (0, h / 2, w + t, t)]:
        box(frame, M @ Tr(x, y, 0.05), sx, sy, 0.13, 0.02)
    box(frame, M @ Tr(0, 0, 0.02), 0.035, h, 0.06)                      # mullion
    for k in range(1, 4): box(frame, M @ Tr(0, -h / 2 + k * h / 4, 0.02), w, 0.03, 0.06)  # glazing bars
    box('glass', M @ Tr(0, 0, -0.01), w, h, 0.02)
    box('gilt', M @ Tr(0, -h / 2 - 0.09, 0.09), w + 0.26, 0.07, 0.18, 0.02)  # sill
    box('gilt', M @ Tr(0, h / 2 + 0.1, 0.1), w + 0.3, 0.09, 0.2, 0.03)     # head moulding
    box('frame', M @ Tr(0, h / 2 + 0.2, 0.07), w + 0.2, 0.12, 0.12, 0.03)

def pilaster(o, Tw, U, N, h):
    M = frameM(o, Tw, U, N)
    box('gilt', M @ Tr(0, 0, 0.07), 0.2, h, 0.12, 0.02)
    for x in (-0.05, 0.05): box('frame', M @ Tr(x, 0, 0.13), 0.025, h * 0.82, 0.02)   # flutes
    box('gilt', M @ Tr(0, h / 2 + 0.06, 0.1), 0.34, 0.12, 0.2, 0.03)                 # capital
    box('gilt', M @ Tr(0, h / 2 + 0.15, 0.12), 0.4, 0.06, 0.24, 0.02)
    box('gilt', M @ Tr(0, -h / 2 - 0.05, 0.1), 0.32, 0.1, 0.18, 0.02)               # base

def build_stern():
    # base surface of the galleries
    sheet('stern', lambda i, j: sternAt(lerp(hG0 - 0.01, 1, j), lerp(-1, 1, i)), 40, 28)
    tiers = 3
    cols = 7
    for k in range(tiers):
        h0 = lerp(hG0, 1, k / tiers); h1 = lerp(hG0, 1, (k + 1) / tiers)
        hm = lerp(h0, h1, 0.5); th = (yOfHn(h1) - yOfHn(h0))
        wh = th * 0.56
        ws = [lerp(-0.86, 0.86, (c + 0.5) / cols) for c in range(cols)]
        for wc in ws:
            p, Tw, U, N = gframe(hm, wc)
            span = (sternAt(hm, wc + 0.86 / cols) - sternAt(hm, wc - 0.86 / cols)).length
            window(p, Tw, U, N, span * 0.62, wh)
            # patera on the frieze above
            pt, Tt, Ut, Nt = gframe(lerp(h0, h1, 0.9), wc)
            lathe('gilt', frameM(pt + Nt * 0.06, Tt, Nt, -Ut) @ S(1, 1, 1), PATERA, 12)
        for c in range(cols + 1):
            wb = lerp(-0.86, 0.86, c / cols)
            p, Tw, U, N = gframe(hm, wb)
            pilaster(p, Tw, U, N, wh + 0.1)
        # cable moulding at the head of the tier, flat band under it
        for hh, prof in ((lerp(h0, h1, 0.97), cable(0.075, 0.02, 9.0)), (lerp(h0, h1, 0.8), gadroon(0.05, 0.015, 4))):
            pts = []
            for i in range(61):
                p, Tw, U, N = gframe(hh, lerp(-1, 1, i / 60)); pts.append(p + N * 0.08)
            sweep('gilt', pts, prof, 10)
        # open stern walk on the lower two tiers
        if k < 2:
            walk(h0 + 0.004)
    # carved quarter pieces: a draped figure at each corner, holding up the top cornice
    for s in (-1, 1):
        terms(s)
    taffrail()

def walk(hn):
    y = yOfHn(hn)
    inner, outer = [], []
    n = 30
    for i in range(n + 1):
        w = lerp(-1.0, 1.0, i / n)
        p, Tw, U, N = gframe(hn, w)
        out = flat_out(N)
        inner.append(Vector((p.x, y, p.z))); outer.append(Vector((p.x, y, p.z)) + out * 1.15)
    # deck boards of the walk
    for i in range(n):
        a, b, c, d = inner[i], inner[i + 1], outer[i + 1], outer[i]
        verts = [a, b, c, d, a - Vector((0, 0.14, 0)), b - Vector((0, 0.14, 0)), c - Vector((0, 0.14, 0)), d - Vector((0, 0.14, 0))]
        faces = [[0, 1, 2, 3], [7, 6, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 0, 4, 5], [2, 1, 5, 6]]
        emit('wood', verts, faces, False)
    # carved fascia along the front edge
    sweep('gilt', [p - Vector((0, 0.1, 0)) for p in outer], gadroon(0.09, 0.025, 3), 10)
    # turned balusters, rails
    total = sum((outer[i + 1] - outer[i]).length for i in range(n))
    count = int(total / 0.3)
    acc_l = [0.0]
    for i in range(n): acc_l.append(acc_l[-1] + (outer[i + 1] - outer[i]).length)
    def at(s):
        for i in range(n):
            if acc_l[i + 1] >= s:
                t = (s - acc_l[i]) / max(1e-6, acc_l[i + 1] - acc_l[i]); return outer[i].lerp(outer[i + 1], t)
        return outer[-1]
    for k in range(count + 1):
        p = at(total * k / count) - (outer[1] - inner[1]).normalized() * 0.08
        lathe('gilt', Tr(p.x, p.y + 0.05, p.z), BAL, 8)
    rail = [p - (outer[min(i, n - 1) + 0] - inner[min(i, n - 1)]).normalized() * 0.08 + Vector((0, 0.9, 0)) for i, p in enumerate(outer)]
    sweep('gilt', rail, [(0.05, -0.07), (0.07, 0), (0.05, 0.07), (-0.03, 0.06), (-0.03, -0.06)], smooth=True)
    sweep('gilt', [p - Vector((0, 0.82, 0)) for p in rail], lambda s, th: 0.04, 6)
    # scroll brackets under the walk
    for c in range(8):
        w = lerp(-0.86, 0.86, c / 7)
        p, Tw, U, N = gframe(hn, w)
        out = flat_out(N); base = Vector((p.x, y, p.z))
        pts = []
        for i in range(25):
            a = i / 24
            if a < 0.8:
                q = a / 0.8
                pts.append(base + out * (1.0 * math.sin(q * math.pi / 2)) - Vector((0, 1.0 * math.cos(q * math.pi / 2) + 0.16, 0)))
            else:
                q = (a - 0.8) / 0.2
                pts.append(base + out * (1.0 - 0.18 * math.sin(q * math.pi)) - Vector((0, 0.16 + 0.2 * q, 0)))
        sweep('gilt', pts, lambda s, th, L0=s_len(pts): 0.05 + 0.05 * (1 - s / L0), 8)
        # curl at the foot
        foot = pts[0]
        sp = [foot + out * (0.14 * (1 - t) * math.sin(t * 5)) - Vector((0, 0.14 * (1 - t) * (1 - math.cos(t * 5)), 0)) for t in [i / 16 for i in range(17)]]
        sweep('gilt', sp, lambda s, th: 0.05, 8)


def terms(s):
    w = s * 0.985
    p0, Tw, U, N = gframe(hnOfY(yOfHn(hG0) + 2.6), w)
    p1, _, _, _ = gframe(0.985, w)
    fam = 'Terms' + ('P' if s < 0 else 'S')
    out = N * 0.32
    H = (p1 - p0).length
    up = (p1 - p0).normalized()
    # tapering pedestal of acanthus, then torso, arms raised to the cornice, head
    for i in range(10):
        t = i / 9
        ball(fam, p0 + up * (t * H * 0.45) + out, 0.16 + 0.1 * t)
    for i in range(6):
        ball(fam, p0 + up * (H * 0.47 + i * 0.12) + out, 0.2 + 0.04 * math.sin(i * 0.7), (1, 1, 0.8))
    ball(fam, p0 + up * (H * 0.47 + 0.66) + out * 1.1, 0.24, (1.0, 0.9, 0.8))    # chest
    ball(fam, p0 + up * (H * 0.47 + 1.02) + out * 1.25, 0.17)                    # head
    for side in (-1, 1):
        a = p0 + up * (H * 0.47 + 0.85) + out + Tw * (side * 0.22)
        b = p0 + up * (H * 0.47 + 1.32) + out * 0.8 + Tw * (side * 0.3)
        for i in range(6): ball(fam, a.lerp(b, i / 5), 0.085)
    for i in range(9):   # drapery falling from the shoulders
        t = i / 8
        ball(fam, p0 + up * (H * 0.47 + 0.6 - t * 0.9) + out * 1.2 + Tw * (0.18 * math.sin(t * 6)), 0.11, (1, 1.6, 0.7))
    bake_metaballs('gilt', fam)

def taffrail():
    pts = []
    for i in range(41):
        w = lerp(-1, 1, i / 40); p = sternAt(1, w)
        pts.append(Vector((p.x - 0.05, p.y + 0.45 + 0.35 * (1 - w * w), p.z)))
    sweep('gilt', pts, gadroon(0.24, 0.07, 5), 16)
    sweep('frame', [p - Vector((0, 0.42, 0)) for p in pts], lambda s, th: 0.16, 8)
    # royal arms: shield, crown and supporting scrolls
    c = sternAt(1, 0); c = Vector((c.x - 0.25, c.y + 1.15, 0))
    ball('Arms', c, 0.62, (0.25, 1.0, 0.85))
    ball('Arms', c + Vector((0, 0.75, 0)), 0.3, (0.6, 0.6, 1.0))
    for k in range(5):
        a = (k / 4 - 0.5) * 1.4
        ball('Arms', c + Vector((0, 1.0, math.sin(a) * 0.32)), 0.1)
    for side in (-1, 1):
        for i in range(10):
            t = i / 9
            ball('Arms', c + Vector((-0.05, -0.5 + 0.7 * math.sin(t * 2.6), side * (0.55 + 0.45 * t))), 0.13 * (1 - 0.5 * t) + 0.05)
    bake_metaballs('gilt', 'Arms')
    # three great lanterns on curved iron brackets (positions match firstrate.js)
    for w in (-0.75, 0.0, 0.75):
        p = sternAt(1, w)
        ly = p.y + 1.35 + (0.35 if w == 0 else 0); lx = p.x - 0.55
        lan = Tr(lx, ly, p.z)
        lathe('gilt', lan, [(0, -1.05), (0.09, -1.0), (0.05, -0.9), (0.12, -0.82), (0.3, -0.72), (0.46, -0.6), (0.52, -0.54), (0.5, -0.5)], 12)
        lathe('lampglass', lan, [(0.46, -0.52), (0.47, 0.0), (0.46, 0.46)], 12)
        lathe('gilt', lan, [(0.5, 0.45), (0.56, 0.5), (0.5, 0.56), (0.3, 0.78), (0.12, 0.95), (0.14, 1.02), (0.06, 1.12), (0.08, 1.2), (0.0, 1.32)], 12)
        for k in range(6):
            a = 2 * math.pi * k / 6 + math.pi / 6
            box('gilt', lan @ Tr(math.cos(a) * 0.48, 0, math.sin(a) * 0.48) @ Matrix.Rotation(-a, 4, 'Y'), 0.05, 1.0, 0.05)
        base = Vector((lx, ly - 1.0, p.z)); root = Vector((p.x + 0.1, p.y + 0.4, p.z))
        arm = [root.lerp(base, t) + Vector((-0.25 * math.sin(t * math.pi), -0.35 * math.sin(t * math.pi), 0)) for t in [i / 12 for i in range(13)]]
        sweep('iron', arm, lambda s, th: 0.06, 8)

# ------------------------------------------------------------------ quarter galleries
def qg_point(s, i, j):
    u = lerp(0.02, 0.13, i); y = lerp(gunRows[2] - 0.6, yP - 0.4, j)
    bulge = 1.15 * math.sin(math.pi * i) ** 0.7 * math.sin(math.pi * (0.15 + 0.85 * j)) ** 0.6
    return Vector((lerp(-L / 2, L / 2, u), y, s * (zAt(u, y) + bulge)))

def build_quarter(s):
    sheet('stern', lambda i, j: qg_point(s, i, j), 20, 16, flip=(s < 0))
    e = 1e-3
    def fr(i, j):
        p = qg_point(s, i, j)
        Ti = (qg_point(s, i + e, j) - qg_point(s, i - e, j)).normalized()
        Uj = (qg_point(s, i, j + e) - qg_point(s, i, j - e)).normalized()
        N = Ti.cross(Uj).normalized()
        if N.z * s < 0: N = -N; Ti = -Ti
        U = N.cross(Ti).normalized()
        return p, Ti, U, N
    for j0, j1 in ((0.12, 0.5), (0.56, 0.92)):
        jm = (j0 + j1) / 2; hgt = (j1 - j0) * (yP - 0.4 - gunRows[2] + 0.6) * 0.7
        for i in (0.3, 0.5, 0.7):
            p, Ti, U, N = fr(i, jm); window(p, Ti, U, N, 0.62, hgt)
        for i in (0.2, 0.4, 0.6, 0.8):
            p, Ti, U, N = fr(i, jm); pilaster(p, Ti, U, N, hgt + 0.1)
        pts = [fr(i / 30 * 0.9 + 0.05, j1 + 0.03)[0] + fr(i / 30 * 0.9 + 0.05, j1 + 0.03)[3] * 0.08 for i in range(31)]
        sweep('gilt', pts, cable(0.06, 0.018, 9.0), 10)
    # domed roof with a finial, onion drop below
    top = qg_point(s, 0.5, 1.0); bot = qg_point(s, 0.5, 0.0)
    cz = top.z - s * 0.25
    lathe('frame', Tr(top.x, top.y, cz) @ S(2.3, 1.0, 0.95), [(1.0, 0.0), (1.0, 0.08), (0.92, 0.3), (0.72, 0.58), (0.42, 0.8), (0.0, 0.88)], 20)
    lathe('gilt', Tr(top.x, top.y, cz) @ S(2.35, 1.0, 1.0), [(1.02, -0.05), (1.06, 0.0), (1.02, 0.06)], 20)
    lathe('gilt', Tr(top.x, top.y + 0.85, cz), [(0.12, 0), (0.16, 0.08), (0.08, 0.2), (0.16, 0.34), (0.06, 0.5), (0.0, 0.58)], 12)
    cz2 = bot.z - s * 0.3
    lathe('gilt', Tr(bot.x, bot.y, cz2) @ S(2.0, 1.0, 0.8), [(0.0, -1.5), (0.1, -1.4), (0.18, -1.2), (0.42, -0.9), (0.62, -0.55), (0.6, -0.45), (0.8, -0.3), (0.96, -0.08), (1.0, 0.0)], 20)

# ------------------------------------------------------------------ lion figurehead
def build_lion():
    yBow = topY(1) - T
    fx, fy = L / 2 + 5.4, yBow - 1.0
    def V(x, y, z=0): return Vector((fx + x, fy + y, z))
    for i in range(8):   # body rising from the knee of the head
        t = i / 7
        ball('Lion', V(-1.9 + 1.9 * t, -1.1 + 1.25 * t), 0.36 + 0.2 * math.sin(t * math.pi * 0.9), (1.2, 1, 0.9))
    ball('Lion', V(0.05, 0.25), 0.55, (1, 1.1, 0.95))                      # chest
    ball('Lion', V(0.32, 0.78), 0.4)                                          # head
    ball('Lion', V(0.7, 0.66), 0.22, (1.2, 0.9, 0.9))                        # muzzle
    ball('Lion', V(0.62, 0.47), 0.15)                                         # jaw
    for z in (-0.17, 0.17):
        ball('Lion', V(0.55, 0.92, z), 0.09)                                  # brows
        ball('Lion', V(0.22, 1.12, z * 1.6), 0.08)                            # ears
    # mane: overlapping locks that merge into one mass, ruffled at the edge
    for ring, (rr, br, n) in enumerate(((0.4, 0.22, 22), (0.54, 0.2, 26), (0.68, 0.16, 30), (0.8, 0.11, 34))):
        for k in range(n):
            a = 2 * math.pi * k / n + ring * 0.37
            wob = 1 + 0.08 * math.sin(a * 5 + ring)
            ball('Lion', V(0.2 - ring * 0.13, 0.72 + math.cos(a) * rr * wob, math.sin(a) * rr * wob), br)
    for z in (-0.3, 0.3):    # forelegs reaching forward, paws out
        a, b = V(0.1, 0.0, z), V(0.85, -0.55, z * 1.05)
        for i in range(7): ball('Lion', a.lerp(b, i / 6), 0.17 - 0.03 * i / 6)
        ball('Lion', b + Vector((0.12, -0.04, 0)), 0.16, (1.3, 0.8, 1))
        for k in (-1, 0, 1): ball('Lion', b + Vector((0.25, -0.05, k * 0.07)), 0.05)
    bake_metaballs('gilt', 'Lion')
    # crown
    lathe('gilt', Tr(fx + 0.25, fy + 1.18, 0) @ Matrix.Rotation(-0.35, 4, 'Z'), [(0.0, 0), (0.24, 0), (0.26, 0.05), (0.22, 0.18), (0.25, 0.24), (0.0, 0.24)], 14)
    for k in range(6):
        a = 2 * math.pi * k / 6
        lathe('gilt', Tr(fx + 0.25 + 0.08 + math.cos(a) * 0.2, fy + 1.4, math.sin(a) * 0.2), [(0.0, 0), (0.05, 0.02), (0.03, 0.1), (0.045, 0.14), (0.0, 0.2)], 6)

# ------------------------------------------------------------------ 32-pounder barrel (instanced in JS; breech at 0, muzzle at +y)
def build_gun():
    prof = [(0.0, -0.32), (0.07, -0.3), (0.085, -0.24), (0.05, -0.18), (0.06, -0.12), (0.2, -0.08), (0.27, -0.02), (0.29, 0.06),
            (0.31, 0.08), (0.31, 0.15), (0.28, 0.17), (0.265, 0.95), (0.29, 0.97), (0.29, 1.04), (0.255, 1.06), (0.235, 1.65),
            (0.255, 1.67), (0.255, 1.73), (0.22, 1.75), (0.175, 2.6), (0.2, 2.67), (0.225, 2.78), (0.205, 2.86), (0.2, 2.9),
            (0.09, 2.9), (0.085, 2.5), (0.0, 2.5)]
    lathe('gun', Matrix(), prof, 16)
    lathe('gun', Tr(0, 1.2, 0) @ Matrix.Rotation(math.pi / 2, 4, 'Z'), [(0, -0.42), (0.075, -0.42), (0.075, 0.42), (0, 0.42)], 10)


# ------------------------------------------------------------------ gun carriage (instanced in JS)
def prism(mat, poly, x0, x1):
    """extrude a (z, y) outline across x from x0 to x1."""
    n = len(poly)
    verts = [(x0, y, z) for (z, y) in poly] + [(x1, y, z) for (z, y) in poly]
    area = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n))
    cap0 = list(range(n)); cap1 = [n + i for i in range(n)][::-1]
    faces = [cap0, cap1] if area < 0 else [cap0[::-1], cap1[::-1]]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i] if area >= 0 else [i, n + i, n + j, j])
    emit(mat, verts, faces, False)

def build_carriage():
    # origin on the deck under the trunnions, +z outboard, y up
    cheek = [(-1.25, 0.06), (0.25, 0.06), (0.25, 0.6), (0.02, 0.6), (-0.08, 0.5), (-0.45, 0.5), (-0.55, 0.4), (-0.85, 0.4), (-0.95, 0.3), (-1.25, 0.3)]
    for x in (-0.31, 0.31):
        prism('carriage', cheek, x - 0.055, x + 0.055)
    box('carriage', Tr(0, 0.2, 0.05), 0.9, 0.16, 0.18, 0.02)          # fore axletree
    box('carriage', Tr(0, 0.18, -1.0), 0.9, 0.15, 0.18, 0.02)         # hind axletree
    box('carriage', Tr(0, 0.3, -0.6), 0.56, 0.08, 0.5, 0.01)          # bed
    box('carriage', Tr(0, 0.42, -0.95), 0.3, 0.1, 0.42, 0.01)         # quoin
    for z, r in ((0.05, 0.2), (-1.0, 0.18)):                         # trucks
        for x in (-0.45, 0.45):
            lathe('carriage', Tr(x, r, z) @ Matrix.Rotation(math.pi / 2, 4, 'Z'), [(0.0, -0.05), (r, -0.05), (r, 0.05), (0.0, 0.05)], 12, smooth=False)

# ------------------------------------------------------------------ running rigging belayed on deck
def coil(c, r0=0.12, r1=0.34, turns=4.5):
    pts = []
    for i in range(int(turns * 16) + 1):
        a = i / 16 * 2 * math.pi; r = lerp(r0, r1, i / (turns * 16))
        pts.append(c + Vector((r * math.cos(a), 0.035 + 0.002 * math.sin(a * 3), r * math.sin(a))))
    sweep('rope', pts, lambda q, th: 0.028, 5, caps=False)

def pin_rail(a, b, n):
    sweep('wood', [a, b], [(-0.05, -0.07), (0.05, -0.07), (0.05, 0.07), (-0.05, 0.07)], smooth=False)
    for k in range(n):
        p = a.lerp(b, (k + 0.5) / n)
        lathe('wood', Tr(p.x, p.y - 0.12, p.z), [(0.0, 0.0), (0.025, 0.0), (0.02, 0.18), (0.035, 0.22), (0.03, 0.3), (0.0, 0.31)], 6)

def build_belaying():
    rnd_c = [0.0]
    for mx, dy in ((19, yF), (-1, yMain), (-19, yQ)):
        # fife rail: a horseshoe of pins on stanchions round the after side of the mast
        pts = [Vector((mx - 0.9 - 0.6 * math.sin(a), dy + 0.85, 1.25 * math.cos(a))) for a in [k / 12 * math.pi for k in range(13)]]
        sweep('wood', pts, [(-0.05, -0.08), (0.05, -0.08), (0.05, 0.08), (-0.05, 0.08)], smooth=False)
        for k in (0, 4, 8, 12):
            box('wood', Tr(pts[k].x, dy + 0.42, pts[k].z), 0.1, 0.84, 0.1, 0.015)
        for k in range(1, 12):
            lathe('wood', Tr(pts[k].x, pts[k].y - 0.12, pts[k].z), [(0.0, 0.0), (0.025, 0.0), (0.02, 0.18), (0.035, 0.22), (0.03, 0.3), (0.0, 0.31)], 6)
        for k in (2, 5, 8, 11):
            coil(Vector((pts[k].x - 0.4, dy, pts[k].z * 0.8)), 0.08, 0.26, 3.5)
    # pin rails inside the waist bulwarks, with coils hanging below and lying at their feet
    for s in (-1, 1):
        for x0, x1 in ((-16, -9), (-6, 2), (5, 13)):
            y = yMain + 0.95
            za = s * (zAt(uOf_(x0), y) - 0.28); zb = s * (zAt(uOf_(x1), y) - 0.28)
            pin_rail(Vector((x0, y, za)), Vector((x1, y, zb)), 10)
            for k in range(4):
                x = lerp(x0 + 0.8, x1 - 0.8, k / 3)
                coil(Vector((x, yMain, s * (zAt(uOf_(x), yMain + 0.3) - 0.75))), 0.1, 0.32, 4.0)

def uOf_(x): return clamp((x + L / 2) / L, 0, 1)

# ------------------------------------------------------------------ build, bake, export
reset()
build_stern()
for s in (-1, 1): build_quarter(s)
build_lion()
build_gun()
build_carriage()
build_belaying()
loft_occluder(P)
for y, u0, u1 in ((yP, 0.0, 0.17), (yQ, 0.0, 0.36), (yMain, 0.0, 1.0)):
    occluder([(lerp(-L / 2, L / 2, u0) - 4, y, -8), (lerp(-L / 2, L / 2, u1), y, -8), (lerp(-L / 2, L / 2, u1), y, 8), (lerp(-L / 2, L / 2, u0) - 4, y, 8)], [[0, 1, 2, 3]], 'OccDeck')
export(OUT)
