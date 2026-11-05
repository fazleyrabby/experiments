"""First-rate hull form, mirrored from js/firstrate.js (keep in step)."""
import math
from mathutils import Vector
from common import clamp, ss, lerp

L, B, D, T = 60.0, 15.8, 14.6, 6.6
half = B / 2
def keelY(u): return 3.4 * max(0, (u - 0.86) / 0.14) ** 2.2 + 0.8 * max(0, (0.1 - u) / 0.1) ** 2
def topY(u): return D + 0.6 * (2 * u - 1) ** 2 + 1.9 * (1 - ss(u, 0.36, 0.44)) + 1.5 * (1 - ss(u, 0.17, 0.22)) + 1.4 * ss(u, 0.7, 0.78)
def xAt(u, hn): return -L / 2 + u * L - 3.6 * ss(hn, 0.42, 1) * (1 - u) ** 7 + 2.4 * hn ** 1.6 * u ** 14
def plan(u, hn):
    if u >= 0.5:
        q = (u - 0.5) / 0.5
        return math.sqrt(max(0, 1 - q ** 3))
    q = u / 0.5
    low = math.sin(math.pi / 2 * min(1, q * 1.08)) ** 1.35
    high = lerp(0.64, 1, ss(q, 0, 0.6))
    return lerp(low, high, ss(hn, 0.3, 0.74))
def section(hn): return (1 - (1 - hn) ** 2.3) ** (1 / 2.3) * (1 - 0.15 * ss(hn, 0.55, 1))
def P(u, hn): return Vector((xAt(u, hn), lerp(keelY(u), topY(u), hn) - T, half * plan(u, hn) * section(hn)))
def hnAt(u, y): return clamp((y + T - keelY(u)) / (topY(u) - keelY(u)), 0, 1)
def zAt(u, y): return P(u, hnAt(u, y)).z
yMain = D - T - 1.6; yQ = yMain + 2.1; yP = yQ + 2.0; yF = yMain + 1.9
gunRows = [2.2, 4.6, yMain + 0.65]
hG0 = 0.55
def sternAt(hn, w):
    p = P(0, hn)
    return Vector((p.x - 0.95 * (1 - w * w) - 0.15, p.y, p.z * w))
def yOfHn(hn): return lerp(keelY(0), topY(0), hn) - T
def hnOfY(y): return (y + T - keelY(0)) / (topY(0) - keelY(0))

