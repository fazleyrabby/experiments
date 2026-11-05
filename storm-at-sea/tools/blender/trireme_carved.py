"""
Trireme carved work, generated in Blender and exported as a GLB.

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup \
      --python tools/blender/trireme_carved.py -- assets/trireme_carved.glb

Built from code: the three-finned bronze ram with its boar-headed proembolion, the
stolos curling aft over the bow, marble eye plaques, catheads (epotides), the open
outrigger frame the top bank rows through, zygite and thalamite oar ports (with leather
bags on the lowest bank), the canopy deck on its stanchions with a rail of hoplite shields,
the fan of the aphlaston, steering oars, the helmsman's awning. AO is baked against the
hull, which is present only as an occluder. Hull form mirrors js/trireme.js.
"""
import bpy, math, sys, os
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/trireme_carved.glb'

# ------------------------------------------------------------------ hull form (from trireme.js)
L, B, D, T = 37.0, 5.4, 2.7, 1.1
hb = 1.95
def keelY(u): return 2.4 * max(0, (0.16 - u) / 0.16) ** 2 + 0.15 * max(0, (u - 0.9) / 0.1) ** 2
def topY(u): return D + 0.35 * (2 * u - 1) ** 2 + 2.6 * max(0, (0.12 - u) / 0.12) ** 1.6 + 0.5 * max(0, (u - 0.88) / 0.12) ** 1.5
def xAt(u, hn): return -L / 2 + u * L - 1.4 * hn ** 1.3 * (1 - u) ** 8 - 0.5 * hn * u ** 16
def plan(u): return math.sin(math.pi * clamp(0.015 + 0.97 * u, 0, 1)) ** 0.62
def section(hn): return (1 - (1 - hn) ** 2.6) ** (1 / 2.6) * (1 + 0.08 * ss(hn, 0.6, 1))
def P(u, hn): return Vector((xAt(u, hn), lerp(keelY(u), topY(u), hn) - T, hb * plan(u) * section(hn)))
def uOf(x): return clamp((x + L / 2) / L, 0, 1)
def hnAt(u, y): return clamp((y + T - keelY(u)) / (topY(u) - keelY(u)), 0, 1)
def zAt(u, y): return P(u, hnAt(u, y)).z
yR = D - T                   # rail amidships
yC = yR + 1.25               # canopy deck
def oarX(i, n): return -L * 0.33 + (i + 0.5) / n * L * 0.62
def zOut(x): return zAt(uOf(x), yR) + 0.62
BANKS = [(27, 0.95), (27, 0.45)]   # zygite and thalamite ports in the hull side

def hframe(x, y, s):
    e = 1e-3
    f = lambda xx, yy: zAt(uOf(xx), yy)
    fx = (f(x + e, y) - f(x - e, y)) / (2 * e); fy = (f(x, y + e) - f(x, y - e)) / (2 * e)
    p = Vector((x, y, s * f(x, y)))
    N = (Vector((-fx, -fy, 1)) * s).normalized()
    Tx = (Vector((1, 0, s * fx)) * s).normalized()
    U = N.cross(Tx).normalized()
    return p, Tx, U, N
def axis_frame(a, b, side=Vector((1, 0, 0))):
    Y = (b - a).normalized()
    X = (side - Y * Y.dot(side)).normalized()
    return frameM(a, X, Y, X.cross(Y)), (b - a).length
def facing(c, n):
    """lathe y axis along n (outward), right-handed."""
    n = n.normalized(); a = Vector((0, 1, 0)) if abs(n.y) < 0.9 else Vector((1, 0, 0))
    X = (a - n * n.dot(a)).cross(n).normalized()
    return frameM(c, X, n, X.cross(n))

# ------------------------------------------------------------------ ram & bow
def squircle_loft(mat, secs, k=4, segs=20):
    """secs: list of (x, yc, halfW, halfH); superellipse sections along x, capped."""
    verts, faces = [], []
    for (x, yc, w, h) in secs:
        for j in range(segs):
            a = 2 * math.pi * j / segs; c, s = math.cos(a), math.sin(a)
            verts.append((x, yc + h * math.copysign(abs(s) ** (2 / k), s), w * math.copysign(abs(c) ** (2 / k), c)))
    n = len(secs)
    for i in range(n - 1):
        for j in range(segs):
            a = i * segs + j; b = i * segs + (j + 1) % segs
            faces.append([a, b, b + segs, a + segs])
    faces.append(list(range(segs))); faces.append([(n - 1) * segs + j for j in range(segs)][::-1])
    emit(mat, verts, [f[::-1] for f in faces], True)

def build_bow():
    x0, x1 = L / 2 - 1.7, L / 2 + 1.9
    secs = []
    for i in range(15):
        t = i / 14; x = lerp(x0, x1, t)
        head = ss(t, 0.45, 1)
        secs.append((x, -0.45 + 0.05 * head, lerp(0.44, 0.3, head) * (1 - 0.25 * ss(t, 0.95, 1)), lerp(0.72, 0.42, head) * (1 - 0.15 * ss(t, 0.95, 1))))
    squircle_loft('bronze', secs)
    for dy, ext in ((-0.28, 0.13), (0.0, 0.18), (0.28, 0.13)):        # the three cutting fins
        for side in (-1, 1):
            verts = []
            xa, xb = x1 - 1.1, x1 + 0.04
            wa, wb = 0.3, 0.28 + ext
            pts = [(xa, wa), (xb, wb), (xb, 0), (xa, 0)]
            for (x, z) in pts: verts += [(x, -0.45 + dy + 0.045, side * z), (x, -0.45 + dy - 0.045, side * z)]
            faces = [[0, 2, 4, 6], [1, 7, 5, 3], [0, 1, 3, 2], [2, 3, 5, 4], [4, 5, 7, 6], [6, 7, 1, 0]]
            if side < 0: faces = [f[::-1] for f in faces]
            emit('bronze', verts, faces, False)
    box('bronze', Tr(L / 2 + 0.9, 0.05, 0), 1.6, 0.18, 0.08, 0.02)    # top fin running into the stem
    box('bronze', Tr(L / 2 - 0.9, -0.45, 0), 1.6, 1.5, 0.95, 0.06)     # bolted sheath round the forefoot
    for k in range(5):
        for side in (-1, 1):
            lathe('bronze', facing(Vector((L / 2 - 1.5 + k * 0.35, -0.45 + 0.4 * ((k % 2) * 2 - 1) * 0.6, side * 0.49)), Vector((0, 0, side))), [(0, 0.04), (0.04, 0.03), (0.05, 0)], 6)
    # proembolion: a smaller bronze ram-head shaped like a boar, on the stem above the main ram
    st = P(1, hnAt(1, 0.7)); bx = st.x - 0.25
    ball('Boar', Vector((bx + 0.25, 0.7, 0)), 0.32, (1.5, 0.9, 0.8))
    ball('Boar', Vector((bx + 0.7, 0.66, 0)), 0.2, (1.2, 0.8, 0.8))     # snout
    ball('Boar', Vector((bx + 0.92, 0.64, 0)), 0.13)
    for z in (-0.13, 0.13):
        ball('Boar', Vector((bx + 0.35, 0.92, z)), 0.09, (0.7, 1.4, 0.6))  # ears
        ball('Boar', Vector((bx + 0.78, 0.55, z * 0.9)), 0.05, (1.6, 0.6, 0.6))  # tusks
    bake_metaballs('bronze', 'Boar')
    # stolos: the stem post rising and curling back over the bow in a volute
    top = P(1, 1); xs, ys = top.x - 0.05, top.y - 0.2
    pts = [Vector((xs, ys - 0.6, 0)), Vector((xs + 0.05, ys, 0)), Vector((xs + 0.13, ys + 0.6, 0))]
    r0 = 0.55; c = Vector((xs + 0.15 - r0, ys + 0.9, 0))
    for i in range(1, 41):
        ph = i / 40 * 1.75 * math.pi; r = r0 * (1 - 0.62 * i / 40)
        pts.append(c + Vector((r * math.cos(ph), r * math.sin(ph), 0)))
    total = s_len(pts)
    sweep('dark', pts, lambda s, th: 0.16 - 0.09 * s / total, 10)
    # marble eyes, one each side of the bow
    for s in (-1, 1):
        p, Tx, U, N = hframe(L / 2 - 2.6, 0.85, s)
        M = frameM(p + N * 0.015, Tx, N, -U)
        lathe('marble', M @ S(1, 1, 0.6), [(0, 0.05), (0.32, 0.045), (0.46, 0.02), (0.48, 0)], 20)
        lathe('iris', M @ Tr(0.04, 0.0, 0), [(0, 0.075), (0.17, 0.07), (0.19, 0.05)], 16)
        lathe('pupil', M @ Tr(0.04, 0.0, 0), [(0, 0.09), (0.085, 0.085), (0.095, 0.07)], 12)
        ring = []
        for k in range(41):
            a = 2 * math.pi * k / 40
            ring.append(M @ Vector((0.47 * math.cos(a), 0.05, 0.27 * math.sin(a) * (1 - 0.25 * math.cos(a)))))
        sweep('pupil', ring, lambda s, th: 0.025, 6, caps=False)
        brow = [M @ Vector((lerp(-0.5, 0.62, t), 0.05, -0.36 - 0.12 * math.sin(t * math.pi))) for t in [k / 16 for k in range(17)]]
        sweep('pupil', brow, lambda s, th: 0.028, 6)
    # epotides: heavy catheads projecting either side of the bow, bronze-capped
    for s in (-1, 1):
        x = L / 2 - 3.6; z0 = zAt(uOf(x), yR + 0.3)
        a, b = Vector((x, yR + 0.3, 0)), Vector((x - 0.25, yR + 0.35, s * (z0 + 0.85)))
        M, ln = axis_frame(a, b)
        box('dark', M @ Tr(0, ln / 2, 0), 0.34, ln, 0.34, 0.03)
        lathe('bronze', facing(b, b - a), [(0.0, 0.08), (0.12, 0.08), (0.2, 0.05), (0.22, 0.0)], 14)
        lathe('bronze', facing(b + (b - a).normalized() * 0.08, b - a), [(0, 0.06), (0.06, 0.04), (0.07, 0)], 10)
    # bow platform
    x0 = L * 0.33; x1 = L / 2 - 1.2; y = yR + 0.45
    sheet('deck', lambda i, j: Vector((lerp(x0, x1, i), y, lerp(-1, 1, j) * max(0.15, zAt(uOf(lerp(x0, x1, i)), y) - 0.05))), 12, 4, smooth=False)

# ------------------------------------------------------------------ outrigger, ports, canopy, shields
def build_sides():
    xo0, xo1 = -L * 0.345, L * 0.305
    n31 = 31
    for s in (-1, 1):
        for yy, r in ((yR + 0.12, 0.1), (yR - 0.38, 0.08)):
            pts = [Vector((lerp(xo0, xo1, k / 40), yy, s * zOut(lerp(xo0, xo1, k / 40)))) for k in range(41)]
            sweep('wood', pts, [(-r, -0.09), (r, -0.09), (r, 0.09), (-r, 0.09)], smooth=False)
        sweep('paint', [Vector((lerp(xo0, xo1, k / 40), yR + 0.24, s * (zOut(lerp(xo0, xo1, k / 40)) + 0.02))) for k in range(41)], lambda q, th: 0.045, 6)
        for i in range(n31 + 1):           # posts between the thranite oars
            x = lerp(oarX(0, n31), oarX(n31 - 1, n31), i / n31) - (oarX(1, n31) - oarX(0, n31)) / 2
            box('wood', Tr(x, yR - 0.13, s * zOut(x)), 0.07, 0.5, 0.09, 0.01)
        for k in range(14):                # knees and cross-beams carrying the outrigger
            x = lerp(xo0 + 0.6, xo1 - 0.6, k / 13)
            zi = zAt(uOf(x), yR - 0.95)
            pts = [Vector((x, yR - 0.95, s * zi)).lerp(Vector((x, yR - 0.42, s * zOut(x))), t) + Vector((0, -0.18 * math.sin(t * math.pi), 0)) for t in [q / 10 for q in range(11)]]
            sweep('dark', pts, lambda q, th: 0.06, 6)
            a, b = Vector((x, yR + 0.12, s * (zAt(uOf(x), yR) - 0.1))), Vector((x, yR + 0.12, s * zOut(x)))
            M, ln = axis_frame(a, b)
            box('dark', M @ Tr(0, ln / 2, 0), 0.12, ln, 0.14, 0.01)
        # zygite ports, thalamite ports with leather askomata
        for (n, y), bag in zip(BANKS, (False, True)):
            for i in range(n):
                p, Tx, U, N = hframe(oarX(i, n), y, s)
                M = frameM(p, Tx, N, -U)
                lathe('port', M @ S(1, 1, 0.82), [(0, 0.012), (0.1, 0.012), (0.115, 0.0)], 12)
                lathe('dark', M @ S(1, 1, 0.82), [(0.11, 0.0), (0.14, 0.03), (0.16, 0.0)], 12)
                if bag:
                    lathe('leather', M, [(0.11, 0.0), (0.17, 0.05), (0.15, 0.11), (0.1, 0.14), (0.075, 0.15)], 12)
        # stanchions carrying the canopy deck
        for i in range(0, n31, 3):
            x = oarX(i, n31) - 0.42
            sweep('wood', [Vector((x, yR + 0.2, s * (zOut(x) - 0.08))), Vector((x, yC - 0.05, s * (zOut(x) - 0.08)))], lambda q, th: 0.055, 8)
    # canopy deck (katastroma)
    cx0, cx1 = -L * 0.36, L * 0.33
    hw = lambda x: zOut(x) - 0.04
    sheet('deck', lambda i, j: Vector((lerp(cx0, cx1, i), yC, lerp(-1, 1, j) * hw(lerp(cx0, cx1, i)))), 60, 6, smooth=False, flip=True)
    sheet('deck', lambda i, j: Vector((lerp(cx0, cx1, i), yC - 0.12, lerp(-1, 1, j) * hw(lerp(cx0, cx1, i)))), 60, 6, smooth=False)
    for s in (-1, 1):
        edge = [Vector((lerp(cx0, cx1, k / 60), yC - 0.06, s * hw(lerp(cx0, cx1, k / 60)))) for k in range(61)]
        sweep('paint', edge, [(-0.07, -0.05), (0.07, -0.05), (0.07, 0.05), (-0.07, 0.05)], smooth=False)
        rail = [p + Vector((0, 0.62, -s * 0.06)) for p in edge]
        sweep('wood', rail, lambda q, th: 0.045, 6)
        for k in range(0, 61, 3): sweep('wood', [edge[k] + Vector((0, 0.05, -s * 0.06)), rail[k]], lambda q, th: 0.035, 6)
        # hoplite shields hung outboard on the rail: red, black and bronze-faced
        x = -L * 0.33; k = 0
        while x < L * 0.3:
            c = Vector((x, yC + 0.36, s * (hw(x) + 0.09)))
            M = facing(c, Vector((0, 0, s)))
            face = ('shieldA', 'shieldB', 'bronze')[k % 3]
            lathe(face, M, [(0, 0.13), (0.18, 0.115), (0.33, 0.07), (0.41, 0.02), (0.42, 0.0)], 18)
            lathe('bronze', M, [(0.41, 0.03), (0.46, 0.01), (0.47, -0.02), (0.43, -0.04)], 18)
            lathe('bronze', M, [(0, 0.17), (0.05, 0.16), (0.07, 0.13)], 8)
            # wooden back with the arm-band (porpax) and hand-grip (antilabe)
            lathe('dark', facing(c - Vector((0, 0, s * 0.03)), Vector((0, 0, -s))), [(0, 0.05), (0.25, 0.035), (0.44, 0.0)], 18)
            box('leather', Tr(c.x, c.y + 0.05, c.z - s * 0.1), 0.06, 0.32, 0.05, 0.01)
            box('leather', Tr(c.x - 0.3, c.y - 0.05, c.z - s * 0.08), 0.05, 0.05, 0.05, 0.01)
            x += 1.12; k += 1

# ------------------------------------------------------------------ stern
def build_stern():
    st = P(0, 1)
    # aphlaston: a fan of tapering timbers springing from the sternpost and arching forward
    ribs = 7
    bar = []
    for r in range(ribs):
        zs = lerp(-0.85, 0.85, r / (ribs - 1)); R0 = 1.35 - 0.12 * abs(zs)
        c = st + Vector((R0, 0.05, 0))
        pts = []
        for i in range(31):
            t = i / 30; ph = math.pi - t * 0.88 * math.pi
            R = R0 * (1 - 0.42 * t)
            pts.append(c + Vector((R * math.cos(ph), R * math.sin(ph) + 0.25 * t, zs * t ** 0.75)))
        sweep('dark', pts, lambda q, th, LL=s_len(pts): 0.11 - 0.075 * q / LL, 8)
        bar.append(pts[11])
    sweep('paint', bar, lambda q, th: 0.06, 6)
    sweep('bronze', [p + Vector((0, 0.35, 0)) for p in bar], lambda q, th: 0.04, 6)
    # steering oars (pedalia) through their brackets, tillers inboard
    for s in (-1, 1):
        x0 = -L / 2 + 2.7; zr = zAt(uOf(x0), yR + 0.3)
        p0 = Vector((x0, yR + 0.75, s * (zr + 0.32))); p1 = Vector((-L / 2 + 0.6, -1.35, s * (zr + 0.6)))
        M, ln = axis_frame(p0, p1)
        lathe('dark', M, [(0.0, -0.2), (0.07, -0.18), (0.075, 0.0), (0.07, ln * 0.6), (0.06, ln * 0.62)], 10)
        lathe('wood', M @ S(1, 1, 0.16), [(0.06, ln * 0.58), (0.2, ln * 0.68), (0.3, ln * 0.85), (0.3, ln * 0.97), (0.0, ln)], 14)
        box('dark', Tr(x0 + 0.05, yR + 0.3, s * (zr + 0.2)), 0.5, 0.5, 0.45, 0.04)
        sweep('dark', [p0, p0 + Vector((0.85, 0.12, -s * 0.55))], lambda q, th: 0.035, 6)
    # helmsman's platform with an awning
    x0, x1 = -L / 2 + 2.2, -L * 0.36
    hwid = lambda x: max(0.3, zAt(uOf(x), yC) - 0.05)
    sheet('deck', lambda i, j: Vector((lerp(x0, x1, i), yC, lerp(-1, 1, j) * hwid(lerp(x0, x1, i)))), 10, 4, smooth=False, flip=True)
    for px in (x0 + 0.3, x1 - 0.2):
        for s in (-1, 1): sweep('wood', [Vector((px, yC, s * 0.85)), Vector((px, yC + 1.85, s * 0.85))], lambda q, th: 0.05, 8)
    sheet('canvas', lambda i, j: Vector((lerp(x0 + 0.1, x1, i), yC + 1.85 + 0.3 * (1 - lerp(-1, 1, j) ** 2), lerp(-1.1, 1.1, j))), 8, 8, flip=True)
    sheet('canvas', lambda i, j: Vector((lerp(x0 + 0.1, x1, i), yC + 1.84 + 0.3 * (1 - lerp(-1, 1, j) ** 2), lerp(-1.1, 1.1, j))), 8, 8)
    box('dark', Tr(x0 + 1.2, yC + 0.25, 0), 0.6, 0.5, 1.1, 0.04)

# ------------------------------------------------------------------ build, bake, export
reset()
build_bow()
build_sides()
build_stern()
loft_occluder(P_hull := (lambda u, hn: P(u, hn)))
export(OUT, ao_distance=0.7, prefix='TR_')
