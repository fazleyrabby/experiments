# Aluminium cabin workboat, ~8.6 m. Blender axes: bow +X, port +Y, up +Z; waterline z = 0.
c = fresh_collection("AD_Boat")
M = {
    'top': material("hull", (0.032, 0.036, 0.042), 0.65, 0.32),
    'bottom': material("antifoul", (0.012, 0.013, 0.016), 0.0, 0.75),
    'boot': material("boot", (0.55, 0.56, 0.57), 0.1, 0.45),
    'deck': material("deck", (0.12, 0.125, 0.13), 0.0, 0.92),
    'cabin': material("cabin", (0.40, 0.43, 0.46), 0.35, 0.32),
    'glass': material("glass", (0.008, 0.012, 0.018), 0.4, 0.04),
    'port': material("portglass", (0.006, 0.009, 0.014), 0.5, 0.05),
    'console': material("console", (0.03, 0.032, 0.036), 0.1, 0.6),
    'seat': material("seat", (0.02, 0.02, 0.022), 0.0, 0.7),
    'screen': material("screen", (0.01, 0.03, 0.035), 0.0, 0.2, (0.08, 0.35, 0.4), 2.5),
    'raft': material("raft", (0.75, 0.76, 0.76), 0.0, 0.45),
    'steel': material("steel", (0.75, 0.77, 0.8), 1.0, 0.22),
    'engine': material("engine", (0.012, 0.012, 0.014), 0.2, 0.28),
    'rubber': material("rubber", (0.018, 0.018, 0.02), 0.0, 0.8),
    'orange': material("orange", (0.9, 0.22, 0.02), 0.0, 0.5),
    'white': material("white", (0.78, 0.79, 0.8), 0.0, 0.4),
    'yellow': material("tank", (0.75, 0.48, 0.02), 0.35, 0.3),
    'red': material("navred", (0.3, 0.0, 0.0), 0, 0.3, (1.0, 0.02, 0.02), 6.0),
    'green': material("navgreen", (0.0, 0.3, 0.05), 0, 0.3, (0.05, 1.0, 0.2), 6.0),
    'lamp': material("lamp", (0.9, 0.9, 0.85), 0, 0.2, (1.0, 0.95, 0.85), 12.0),
}

L0, L1, N = -4.2, 4.4, 44
def station(t):
    x = L0 + (L1 - L0) * t
    B = 1.3 if t < 0.48 else 1.3 * math.sqrt(max(0.0, 1 - ((t - 0.48) / 0.52) ** 2.4))
    B = max(B, 0.012)
    K = -0.55 + 0.98 * sm(0.6, 1.0, t) ** 1.6
    S = 1.05 + 0.42 * sm(0.42, 1.0, t) ** 1.5
    ch = K + 0.3 + (S - K - 0.3) * 0.35 * sm(0.72, 1.0, t)
    prof = [(B, S), (B * 0.997, S - 0.2), (B * 0.985, (S + ch) * 0.5), (B * 0.955, ch + 0.06), (B * 0.92, ch),
            (B * 0.62, K + (ch - K) * 0.5), (B * 0.3, K + (ch - K) * 0.16), (B * 0.06, K + 0.01), (0.0, K)]
    return x, S, B, prof

def sheer(t):
    x, S, B, _ = station(t)
    return x, B, S

# Hull: lofted closed solid (sides + flush deck at the sheer + transom + bow cap)
bm = bmesh.new()
rings = []
for i in range(N + 1):
    t = i / N
    x, S, B, prof = station(t)
    ring = [bm.verts.new((x, -y, z)) for y, z in prof] + [bm.verts.new((x, y, z)) for y, z in reversed(prof[:-1])]
    rings.append(ring)
n = len(rings[0])
for i in range(N):
    a, b = rings[i], rings[i + 1]
    for j in range(n - 1):
        bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
    bm.faces.new((a[n - 1], b[n - 1], b[0], a[0]))  # deck strip
bm.faces.new(rings[0])
bm.faces.new(list(reversed(rings[-1])))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
hull = mesh_obj("Hull", bm, c, [M['top'], M['bottom'], M['boot'], M['deck']])
for p in hull.data.polygons:
    z, nz = p.center.z, p.normal.z
    p.material_index = 3 if nz > 0.85 and z > 0.9 else (1 if z < 0.0 else (2 if z < 0.1 else 0))
    if p.material_index == 3 or p.index >= len(hull.data.polygons) - 2:
        p.use_smooth = False

# Rub rail and gunwale cap
rail_pts = lambda side, dz, inset: [(x, side * (B - inset), S + dz) for x, B, S in (sheer(i / 60) for i in range(0, 61))]
for side in (-1, 1):
    tube("RubRail", rail_pts(side, -0.07, -0.035), 0.045, c, M['rubber'])
    tube("Gunwale", rail_pts(side, 0.02, 0.03), 0.03, c, M['steel'])

# Railings: around the bow pulpit, with a dive gate on the starboard (−Y) quarter
# between t = 0.1 and 0.24 where the boarding ladder hangs.
GATE0, GATE1 = 6, 15
rail = lambda side, i: (lambda x, B, S: (x, side * (B - 0.07), S + 0.62))(*sheer(i / 60))
path = [rail(-1, i) for i in range(GATE1, 61)] + [rail(1, i) for i in range(60, 2, -1)]
aft = [rail(-1, i) for i in range(3, GATE0 + 1)]
for pts in (path, aft):
    tube("RailTop", pts, 0.021, c, M['steel'])
    tube("RailMid", [(x, y, z - 0.3) for x, y, z in pts], 0.014, c, M['steel'])
for side in (-1, 1):
    for i in list(range(4, 60, 5)) + ([GATE0, GATE1] if side < 0 else []):
        if side < 0 and GATE0 < i < GATE1:
            continue
        x, B, S = sheer(i / 60)
        tall = side < 0 and i in (GATE0, GATE1)
        prim('cyl', c, "Stanchion", M['steel'], (x, side * (B - 0.07), S + (0.36 if tall else 0.31)), r=0.02 if tall else 0.016, h=0.72 if tall else 0.62, seg=10)

# Cabin: raked windshield, bevelled hardtop with overhang
bm = bmesh.new()
x0, x1, x1t, zb, zt, w, wt = -0.95, 1.75, 1.15, 1.0, 2.62, 1.04, 0.98
v = [bm.verts.new(p) for p in [(x0, -w, zb), (x1, -w, zb), (x1, w, zb), (x0, w, zb),
                                (x0, -wt, zt), (x1t, -wt, zt), (x1t, wt, zt), (x0, wt, zt)]]
for f in [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]:
    bm.faces.new([v[i] for i in f])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
cabin = mesh_obj("Cabin", bm, c, [M['cabin']], smooth=False)
bevel(cabin, 0.07, 4)
# Hollow shell (walls 5 cm) so windows can be cut through to the interior.
shell = cabin.modifiers.new("Shell", 'SOLIDIFY')
shell.thickness, shell.offset = 0.05, -1.0
cutters = fresh_collection("AD_Cutters")
cutters.hide_render = True
roof = prim('cube', c, "Hardtop", M['cabin'], ((x0 + x1t) / 2 + 0.05, 0, zt + 0.04), scale=(x1t - x0 + 0.35, 2 * wt + 0.18, 0.08), smooth=False)
bevel(roof, 0.035, 3)

def pane(name, p0, p1, p2, thick=0.012, mat=M['glass'], cut=True):
    """Thin glass panel spanning corner p0, edge directions p1-p0 and p2-p0, pushed slightly outward.
    With `cut`, also punches the opening through the cabin wall and frames it in rubber."""
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    u, vv = p1 - p0, p2 - p0
    nrm = u.cross(vv).normalized()
    if cut:
        inset = 0.03
        a0 = p0 + u.normalized() * inset + vv.normalized() * inset
        du, dv = u - u.normalized() * 2 * inset, vv - vv.normalized() * 2 * inset
        cb = bmesh.new()
        cq = [a0, a0 + du, a0 + du + dv, a0 + dv]
        cvs = [cb.verts.new(a + nrm * 0.06) for a in cq] + [cb.verts.new(a - nrm * 0.12) for a in cq]
        cb.faces.new(cvs[:4]); cb.faces.new(list(reversed(cvs[4:])))
        for i in range(4):
            j = (i + 1) % 4
            cb.faces.new((cvs[i + 4], cvs[j + 4], cvs[j], cvs[i]))
        bmesh.ops.recalc_face_normals(cb, faces=cb.faces)
        cutter = mesh_obj(name + "Cut", cb, cutters, smooth=False)
        cutter.hide_render = True
        bo = cabin.modifiers.new(name + "Hole", 'BOOLEAN')
        bo.operation, bo.solver, bo.object = 'DIFFERENCE', 'FLOAT', cutter
        corners = [p0, p1, p1 + vv, p2, p0]
        tube(name + "Frame", [tuple(cc + nrm * 0.008) for cc in corners], 0.013, c, M['rubber'])
    bm = bmesh.new()
    q = [p0, p1, p1 + vv, p2]
    vs = [bm.verts.new(a + nrm * thick) for a in q] + [bm.verts.new(a - nrm * 0.004) for a in q]
    bm.faces.new(vs[:4]); bm.faces.new(list(reversed(vs[4:])))
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((vs[i + 4], vs[j + 4], vs[j], vs[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, c, [mat], smooth=False)

def lerp3(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
for side in (-1, 1):
    yb, yt = side * w, side * wt
    def sp(xx, zz):  # point on the (slightly tumbled-home) cabin side
        k = (zz - zb) / (zt - zb)
        return (xx, side * (w + (wt - w) * k + 0.004), zz)
    pane("SideWin", sp(-0.55, 1.78), sp(0.55, 1.78), sp(-0.55, 2.42))
    pane("SideWinF", sp(0.72, 1.78), sp(1.42, 1.78), sp(0.72, 2.42))
    pane("Porthole", sp(-0.85, 1.85), sp(-0.68, 1.85), sp(-0.85, 2.3))
# windshield: three panes on the raked front
fb0, fb1, ft0, ft1 = (x1, -w, zb), (x1, w, zb), (x1t, -wt, zt), (x1t, wt, zt)
for k in range(3):
    a, b = -0.92 + k * 0.63, -0.92 + k * 0.63 + 0.56
    s0, s1 = 0.48, 0.92
    p = lambda yy, s: lerp3((x1, yy, zb), (x1t, yy * wt / w, zt), s)
    q0, q1, q2 = p(a, s0), p(b, s0), p(a, s1)
    pane("Windshield", (q0[0] + 0.006, q0[1], q0[2]), (q1[0] + 0.006, q1[1], q1[2]), (q2[0] + 0.006, q2[1], q2[2]))
# rear: door + window
pane("Door", (x0 - 0.004, 0.25, 1.05), (x0 - 0.004, -0.4, 1.05), (x0 - 0.004, 0.25, 2.45), mat=M['cabin'], cut=False)
pane("DoorWin", (x0 - 0.02, 0.15, 1.8), (x0 - 0.02, -0.3, 1.8), (x0 - 0.02, 0.15, 2.35))
pane("RearWin", (x0 - 0.004, 0.92, 1.8), (x0 - 0.004, 0.42, 1.8), (x0 - 0.004, 0.92, 2.4))
prim('cyl', c, "DoorHandle", M['steel'], (x0 - 0.04, -0.3, 1.55), (0, math.pi / 2, 0), r=0.015, h=0.05, seg=8)

# Roof gear: radar dome, antennas, mast light, searchlight, grab rails
rz = zt + 0.08
prim('cyl', c, "RadarBase", M['white'], (0.15, 0, rz + 0.06), r=0.32, h=0.12, seg=32)
prim('sphere', c, "RadarDome", M['white'], (0.15, 0, rz + 0.12), scale=(1, 1, 0.55), r=0.32, seg=32, rings=16)
for y in (-0.7, 0.7):
    prim('cyl', c, "Antenna", M['white'], (-0.8, y, rz + 0.85), r=0.014, r2=0.006, h=1.7, seg=8)
    prim('cyl', c, "AntennaBase", M['rubber'], (-0.8, y, rz + 0.05), r=0.03, h=0.1, seg=10)
prim('cyl', c, "Mast", M['steel'], (-0.55, 0, rz + 0.45), r=0.025, h=0.9, seg=10)
prim('sphere', c, "MastLight", M['lamp'], (-0.55, 0, rz + 0.93), r=0.045, seg=12, rings=8)
prim('cyl', c, "Searchlight", M['steel'], (0.95, 0.45, rz + 0.12), (0, math.pi / 2, 0), r=0.08, h=0.16, seg=16)
prim('cyl', c, "SearchlightLens", M['lamp'], (1.035, 0.45, rz + 0.12), (0, math.pi / 2, 0), r=0.065, h=0.01, seg=16)
for y in (-0.85, 0.85):
    tube("RoofRail", [(-0.85, y, rz), (-0.8, y, rz + 0.12), (0.9, y, rz + 0.12), (0.95, y, rz)], 0.016, c, M['steel'])
    tube("GrabRail", [(-0.75, y * 1.23, 1.75), (-0.7, y * 1.24, 1.85), (0.7, y * 1.24, 1.85), (0.75, y * 1.23, 1.75)], 0.014, c, M['steel'])
prim('cube', c, "NavRed", M['red'], (1.45, 1.03, 1.55), scale=(0.08, 0.03, 0.05))
prim('cube', c, "NavGreen", M['green'], (1.45, -1.03, 1.55), scale=(0.08, 0.03, 0.05))

# Life rings on both cabin sides: orange with white bands
for side in (-1, 1):
    lr = prim('torus', c, "LifeRing", M['orange'], (-0.25, side * 1.11, 1.45), (math.pi / 2, 0, 0), R=0.26, r=0.055, seg=48, seg2=12)
    lr.data.materials.append(M['white'])
    for p in lr.data.polygons:
        a = math.atan2(p.center.y, p.center.x)
        p.material_index = 1 if (a % (math.pi / 2)) < 0.28 else 0
    prim('cube', c, "LifeRingBracket", M['steel'], (-0.25, side * 1.06, 1.72), scale=(0.08, 0.06, 0.05))

# Bow: anchor roller, cleats, portholes in the topsides
x, B, S = sheer(0.97)
prim('cube', c, "BowRoller", M['steel'], (x + 0.12, 0, S + 0.03), scale=(0.45, 0.12, 0.08))
prim('cyl', c, "Anchor", M['steel'], (x + 0.3, 0, S - 0.12), (0, 0.6, 0), r=0.05, h=0.32, seg=10)
for t in (0.05, 0.4, 0.8):
    x, B, S = sheer(t)
    for side in (-1, 1):
        prim('cube', c, "Cleat", M['steel'], (x, side * (B - 0.12), S + 0.04), scale=(0.18, 0.04, 0.04))
for t in (0.72, 0.8):
    x, B, S = sheer(t)
    for side in (-1, 1):
        prim('cyl', c, "Hullport", M['port'], (x, side * (B - 0.005), 0.72), (math.pi / 2, 0, 0), r=0.075, h=0.03, seg=20)
        prim('torus', c, "HullportRim", M['steel'], (x, side * (B + 0.008), 0.72), (math.pi / 2, 0, 0), R=0.08, r=0.012, seg=24, seg2=6)

# Aft deck: dive tank rack against the cabin, cooler, bench, coiled line, fenders
for k, y in enumerate((-0.6, -0.3, 0.0, 0.3)):
    m = M['yellow'] if k != 2 else M['steel']
    prim('cyl', c, "RackTank", m, (x0 - 0.16, y, 1.05 + 0.33), r=0.09, h=0.66, seg=20)
    prim('sphere', c, "RackTankTop", m, (x0 - 0.16, y, 1.71), r=0.09, seg=20, rings=10)
    prim('cyl', c, "RackValve", M['steel'], (x0 - 0.16, y, 1.82), r=0.022, h=0.08, seg=8)
tube("RackStrap", [(x0 - 0.02, -0.8, 1.55), (x0 - 0.27, -0.8, 1.55), (x0 - 0.27, 0.45, 1.55), (x0 - 0.02, 0.45, 1.55)], 0.012, c, M['steel'])
cool = prim('cube', c, "Cooler", M['white'], (-2.3, 0.62, 1.05 + 0.22), scale=(0.7, 0.45, 0.44), smooth=False)
bevel(cool, 0.04, 3)
bench = prim('cube', c, "Bench", M['deck'], (-3.75, 0, 1.05 + 0.24), scale=(0.5, 1.9, 0.48), smooth=False)
bevel(bench, 0.03, 2)
prim('torus', c, "CoiledLine", M['white'], (-2.9, -0.55, 1.08), R=0.2, r=0.035, seg=32, seg2=8)
prim('torus', c, "CoiledLine2", M['white'], (-2.9, -0.55, 1.14), R=0.17, r=0.032, seg=32, seg2=8)
for t in (0.25, 0.55):
    x, B, S = sheer(t)
    prim('cyl', c, "Fender", M['white'], (x, B + 0.12, 0.55), r=0.1, h=0.55, seg=16)
    tube("FenderLine", [(x, B + 0.12, 0.83), (x, B - 0.02, S + 0.6)], 0.008, c, M['white'])

# Boarding ladder on the starboard (−Y) quarter
lx, LB, LS = sheer(0.17)
for dx in (-0.2, 0.2):
    tube("LadderRail", [(lx + dx, -(LB - 0.15), LS + 0.6), (lx + dx, -(LB + 0.05), LS + 0.62), (lx + dx, -(LB + 0.12), LS + 0.3),
                        (lx + dx, -(LB + 0.12), -0.9)], 0.019, c, M['steel'])
for k in range(6):
    z = LS - 0.05 - k * 0.32
    prim('cyl', c, "Rung", M['steel'], (lx, -(LB + 0.12), z), (0, math.pi / 2, 0), r=0.016, h=0.4, seg=10)

# Twin outboards on the transom
for y in (-0.55, 0.55):
    xo = L0 - 0.42
    cow = prim('cube', c, "Cowling", M['engine'], (xo, y, 1.62), scale=(0.62, 0.46, 0.62), smooth=True)
    bevel(cow, 0.16, 5, limit=False)
    subsurf(cow, 1)
    prim('cube', c, "CowlStripe", M['white'], (xo - 0.02, y, 1.5), scale=(0.66, 0.475, 0.035), smooth=False)
    lower = prim('cube', c, "LowerCowl", M['engine'], (xo + 0.06, y, 1.17), scale=(0.44, 0.34, 0.34))
    bevel(lower, 0.07, 3, limit=False)
    leg = prim('cube', c, "Midsection", M['engine'], (xo + 0.12, y, 0.45), scale=(0.24, 0.13, 1.15))
    bevel(leg, 0.05, 3, limit=False)
    prim('cube', c, "CavPlate", M['engine'], (xo + 0.05, y, -0.14), scale=(0.5, 0.3, 0.025), smooth=False)
    prim('cyl', c, "Gearcase", M['engine'], (xo + 0.06, y, -0.42), (0, math.pi / 2, 0), r=0.09, r2=0.07, h=0.55, seg=16)
    prim('cube', c, "Skeg", M['engine'], (xo + 0.12, y, -0.6), scale=(0.18, 0.03, 0.22), smooth=False)
    prim('cyl', c, "PropHub", M['steel'], (xo - 0.25, y, -0.42), (0, math.pi / 2, 0), r=0.055, r2=0.035, h=0.14, seg=12)
    for k in range(3):
        a = k * 2 * math.pi / 3
        prim('cube', c, "Blade", M['steel'], (xo - 0.25, y + math.cos(a) * 0.13, -0.42 + math.sin(a) * 0.13),
             (a + 0.4, 0, 0), scale=(0.035, 0.1, 0.17), smooth=False)
    prim('cube', c, "Bracket", M['steel'], (L0 - 0.08, y, 0.95), scale=(0.16, 0.3, 0.3), smooth=False)


# --- Wheelhouse interior (seen through the cut windows)
prim('cube', c, "CabinFloor", M['deck'], (0.4, 0, 1.075), scale=(2.6, 1.95, 0.03), smooth=False)
bm = bmesh.new()
cv = [bm.verts.new(p) for p in [(0.95, -0.95, 1.08), (1.4, -0.95, 1.08), (1.4, 0.95, 1.08), (0.95, 0.95, 1.08),
                                 (0.95, -0.95, 1.72), (1.32, -0.95, 1.88), (1.32, 0.95, 1.88), (0.95, 0.95, 1.72)]]
for f in [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]:
    bm.faces.new([cv[i] for i in f])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
console = mesh_obj("Console", bm, c, [M['console']], smooth=False)
bevel(console, 0.02, 2)
slope = math.atan2(0.16, 0.37)
for y in (-0.5, 0.15):
    prim('cube', c, "Screen", M['screen'], (1.13, y, 1.81), (0, -slope, 0), scale=(0.3, 0.42, 0.012), smooth=False)
    prim('cube', c, "ScreenBezel", M['rubber'], (1.135, y, 1.805), (0, -slope, 0), scale=(0.33, 0.46, 0.008), smooth=False)
wheel_c = Vector((0.92, -0.45, 1.6))
tilt = (0, math.pi / 2 - 0.45, 0)
prim('torus', c, "Wheel", M['rubber'], tuple(wheel_c), tilt, R=0.19, r=0.016, seg=36, seg2=8)
prim('cyl', c, "WheelHub", M['steel'], tuple(wheel_c), tilt, r=0.035, h=0.06, seg=14)
for k in range(3):
    a = k * 2 * math.pi / 3
    spoke = prim('cube', c, "Spoke", M['steel'], tuple(wheel_c), (0, 0, 0), scale=(0.012, 0.012, 0.36), smooth=False)
    spoke.rotation_euler = Euler((a, math.pi / 2 - 0.45, 0), 'YXZ')
prim('cyl', c, "WheelShaft", M['steel'], (1.0, -0.45, 1.64), tilt, r=0.02, h=0.16, seg=10)
for y in (0.45, 0.55):
    prim('cyl', c, "Throttle", M['steel'], (1.02, y, 1.82), (0, -0.5, 0), r=0.012, h=0.16, seg=8)
    prim('sphere', c, "ThrottleKnob", M['rubber'], (0.98, y, 1.89), r=0.022, seg=10, rings=6)
for y in (-0.45, 0.45):
    prim('cyl', c, "SeatPost", M['steel'], (0.35, y, 1.32), r=0.035, h=0.5, seg=12)
    cush = prim('cube', c, "SeatCushion", M['seat'], (0.35, y, 1.6), scale=(0.42, 0.44, 0.1))
    bevel(cush, 0.035, 3, limit=False)
    back = prim('cube', c, "SeatBack", M['seat'], (0.13, y, 1.88), (0, -0.15, 0), scale=(0.09, 0.42, 0.48))
    bevel(back, 0.035, 3, limit=False)
bench_in = prim('cube', c, "Settee", M['seat'], (-0.55, 0.62, 1.3), scale=(0.65, 0.5, 0.42))
bevel(bench_in, 0.03, 2, limit=False)
prim('cube', c, "ChartTable", M['console'], (-0.55, -0.7, 1.75), scale=(0.6, 0.45, 0.04), smooth=False)
prim('cube', c, "Radio", M['rubber'], (1.0, 0.75, 2.42), scale=(0.25, 0.3, 0.08), smooth=False)
prim('cube', c, "RadioFace", M['screen'], (0.87, 0.75, 2.42), scale=(0.01, 0.2, 0.04), smooth=False)
for y in (-0.6, 0.0, 0.6):
    prim('cube', c, "Wiper", M['rubber'], (1.53, y, 1.88), (0, -math.atan2(0.6, 1.62), 0.5), scale=(0.015, 0.02, 0.48), smooth=False)

# --- Hull detail: spray rails along the bottom and plate weld seams on the topsides
for side in (-1, 1):
    for idx in (5, 6):
        pts = []
        for i in range(2, N - 1):
            x, S, Bb, prof = station(i / N)
            yy, zz = prof[idx]
            if zz > 0.25:
                break
            pts.append((x, side * (yy + 0.012), zz - 0.01))
        if len(pts) > 2:
            tube("SprayRail", pts, 0.018, c, M['bottom'])
    seam = [(x, side * (Bb * 0.996 + 0.004), 0.55) for x, Bb in ((station(i / 40)[0], station(i / 40)[2]) for i in range(1, 37))]
    tube("WeldSeamH", seam, 0.005, c, M['top'])
    for i in range(3, 36, 4):
        x, S, Bb, prof = station(i / 40)
        pts = [(x, side * (yy * 0.998 + 0.004), zz) for yy, zz in prof[:4] if zz > 0.1]
        if len(pts) > 1:
            tube("WeldSeamV", pts, 0.004, c, M['top'])

# --- Deck and roof gear
prim('cyl', c, "LifeRaft", M['raft'], (-0.55, 0.0, zt + 0.32), (math.pi / 2, 0, 0), r=0.21, h=0.62, seg=24)
for y in (-0.22, 0.22):
    prim('torus', c, "RaftBand", M['rubber'], (-0.55, y, zt + 0.32), (math.pi / 2, 0, 0), R=0.212, r=0.012, seg=28, seg2=6)
prim('cube', c, "RaftCradle", M['steel'], (-0.55, 0, zt + 0.14), scale=(0.5, 0.5, 0.06), smooth=False)
prim('cyl', c, "Horn", M['white'], (0.75, -0.55, zt + 0.16), (0, math.pi / 2, 0), r=0.035, r2=0.06, h=0.22, seg=12)
hx, hB, hS = sheer(0.85)
hatch = prim('cube', c, "ForeHatch", M['cabin'], (hx - 0.1, 0, hS + 0.04), scale=(0.6, 0.6, 0.08))
bevel(hatch, 0.02, 2, limit=False)
for y in (-0.2, 0.2):
    tube("HatchHandle", [(hx - 0.25, y, hS + 0.08), (hx - 0.25, y, hS + 0.13), (hx + 0.05, y, hS + 0.13), (hx + 0.05, y, hS + 0.08)], 0.01, c, M['steel'])
wx, wB, wS = sheer(0.93)
prim('cyl', c, "Windlass", M['steel'], (wx, 0, wS + 0.1), (math.pi / 2, 0, 0), r=0.08, h=0.18, seg=18)
prim('cube', c, "WindlassBase", M['engine'], (wx, 0, wS + 0.03), scale=(0.25, 0.25, 0.06), smooth=False)
for t in (0.22, 0.35):
    fx, fB, fS = sheer(t)
    prim('cyl', c, "FuelCap", M['steel'], (fx, -(fB - 0.2), fS + 0.01), r=0.045, h=0.02, seg=16)
for y in (-1.0, 1.0):
    prim('cube', c, "SternLight", M['lamp'], (L0 + 0.02, y, 1.0), scale=(0.03, 0.08, 0.05))

export(c, "boat.glb")
log("objects", len(c.all_objects))
