"""
Wreck dressing for the ghost first-rate, generated in Blender and exported as a GLB:
kelp hanging in ragged curtains from the wales and rails, and barnacle crusts along the
waterline. Run like firstrate_carved.py (output: assets/ghost_extras.glb).
"""
import bpy, math, sys, os, random
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from firstrate_form import *

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp/ghost_extras.glb'
rnd = random.Random(7)

def side_frame(u, y, s):
    e = 1e-3
    p = Vector((lerp(-L / 2, L / 2, u), y, s * zAt(u, y)))
    fx = (zAt(u + e, y) - zAt(u - e, y)) / (2 * e * L); fy = (zAt(u, y + e) - zAt(u, y - e)) / (2 * e)
    N = (Vector((-fx, -fy, 1)) * s).normalized()
    return p, N

def kelp(p, N, length, width):
    """a ribbon hanging from p, lying against the hull, frayed and twisting."""
    n = 14; tw = rnd.uniform(0, 6)
    def at(i, j):
        t = i / n; side = (j - 0.5) * width * (1 - 0.7 * t)
        down = Vector((0, -length * t, 0))
        sway = Vector((math.sin(t * 5 + tw) * 0.25 * t, 0, 0))
        off = N * (0.06 + 0.25 * t * t)
        return p + down + sway + off + Vector((side, 0, 0))
    sheet('kelp', lambda a, b: at(a * n, b), n, 1, smooth=True)

def barnacles(p, N, count):
    a = Vector((0, 1, 0)); X = (a - N * N.dot(a)).cross(N).normalized(); Y = N.cross(X)
    for _ in range(count):
        q = p + X * rnd.uniform(-0.9, 0.9) + Y * rnd.uniform(-0.35, 0.35)
        r = rnd.uniform(0.04, 0.11)
        M = frameM(q, X, N, -Y) @ S(r, r * rnd.uniform(0.8, 1.4), r)
        lathe('barnacle', M, [(1.0, -0.2), (1.0, 0.0), (0.85, 0.6), (0.45, 0.9), (0.0, 0.7)], 6)

reset()
for s in (-1, 1):
    # kelp from the rail and each main wale
    for y, n, ln in ((yMain + 1.4, 34, (1.5, 4.5)), (gunRows[2] - 0.95, 26, (1.2, 3.5)), (gunRows[1] - 0.95, 24, (1.0, 3.0)), (gunRows[0] - 0.95, 30, (0.8, 2.6))):
        for _ in range(n):
            u = rnd.uniform(0.06, 0.92)
            p, N = side_frame(u, y, s)
            kelp(p, N, rnd.uniform(*ln), rnd.uniform(0.18, 0.4))
    for _ in range(36):
        u = rnd.uniform(0.04, 0.95)
        p, N = side_frame(u, rnd.uniform(-0.1, 1.3), s)
        barnacles(p, N, rnd.randint(4, 9))
loft_occluder(P)
export(OUT, ao_distance=0.5, prefix='GH_')
