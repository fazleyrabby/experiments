"""Detail layer for the hk-tram double-decker, fitted to the hull that js/tram.js lofts.

Run inside Blender through the BlenderMCP socket. Builds in its own scene "HKTram_TramDetail", exports
assets/tram_detail.glb and restores the previous scene; the .blend is never saved.

Hull contract (must match js/tram.js): length 11.6, width 2.36, plan corner radius 0.55, lower windows
1.30–2.20, upper windows 2.78–3.56, header to 3.86. Window bays: upper 9 × pillar 0.12, lower 8 × pillar
0.15 along the straight sides x ∈ [-5.25, 5.25]. Kerb-side doors on Blender +Y (three.js -Z) at
x ∈ [4.0, 5.0] and [-5.0, -4.0]. Blender X = tram forward, Z up.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

OUT = os.environ.get('HK_OUT', '/Users/rabbi/Desktop/Projects/Experiments/hk-tram/assets')
PREVIEW = os.environ.get('HK_PREVIEW', '')
LEN, WID, R = 11.6, 2.36, 0.55
A, B = LEN / 2, WID / 2
SIDE = A - R
Y = dict(skirt0=0.30, dado0=0.52, win0=1.30, win1=2.20, up0=2.78, up1=3.56, head1=3.86)

prev_scene = bpy.context.window.scene
scn = bpy.data.scenes.get('HKTram_TramDetail') or bpy.data.scenes.new('HKTram_TramDetail')
for o in list(scn.collection.all_objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.context.window.scene = scn
vl = bpy.context.view_layer

def mat(name, color, rough=0.5, metal=0.0, emit=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = 3.0
    return m

M = {
    'rubber': mat('tram_rubber', (0.015, 0.015, 0.016), 0.6),
    'chrome': mat('tram_chrome', (0.8, 0.8, 0.82), 0.15, 1.0),
    'dark': mat('tram_dark', (0.04, 0.045, 0.05), 0.5, 0.4),
    'steel': mat('tram_steel', (0.25, 0.26, 0.28), 0.4, 0.8),
    'amber': mat('tram_amber', (0.8, 0.4, 0.0), 0.3, 0.0, (1, 0.5, 0)),
    'grille': mat('tram_grille', (0.12, 0.13, 0.14), 0.6, 0.5),
    'wood': mat('tram_wood', (0.25, 0.13, 0.06), 0.7),
    'tube': mat('tram_tube', (1, 1, 1), 0.3, 0.0, (1, 0.97, 0.9)),
}
parts = {k: bmesh.new() for k in M}

def box(bm, x0, x1, y0, y1, z0, z1):
    m = Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Diagonal((abs(x1 - x0), abs(y1 - y0), abs(z1 - z0), 1))
    bmesh.ops.create_cube(bm, size=1.0, matrix=m)

def cyl(bm, a, b, r, seg=12, caps=True):
    a, b = Vector(a), Vector(b)
    d = b - a
    mtx = Matrix.Translation((a + b) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=caps, segments=seg, radius1=r, radius2=r, depth=d.length, matrix=mtx)

def rrect(cx, cz, w, h, r, n=6):
    """rounded rectangle loop in the (x, z) plane, counter-clockwise"""
    r = min(r, w / 2 - 1e-3, h / 2 - 1e-3)
    pts = []
    for (ox, oz, a0) in [(w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)]:
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + ox + r * math.cos(a), cz + oz + r * math.sin(a)))
    return pts

def gasket(bm, cx, cz, w, h, side, y_surf, t=0.055, depth=0.03, r=0.09):
    """rubber window gasket: a rounded ring standing proud of the side at y_surf (side = ±1)"""
    outer = rrect(cx, cz, w, h, r)
    inner = rrect(cx, cz, w - 2 * t, h - 2 * t, max(0.02, r - t))
    yo, yi = y_surf + side * depth, y_surf - side * 0.005
    vo_f = [bm.verts.new((x, yo, z)) for x, z in outer]
    vi_f = [bm.verts.new((x, yo, z)) for x, z in inner]
    vo_b = [bm.verts.new((x, yi, z)) for x, z in outer]
    vi_b = [bm.verts.new((x, yi, z)) for x, z in inner]
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        f = [vo_f[i], vo_f[j], vi_f[j], vi_f[i]]
        bm.faces.new(f if side < 0 else f[::-1])                                   # face
        g = [vo_b[i], vo_b[j], vo_f[j], vo_f[i]]
        bm.faces.new(g if side < 0 else g[::-1])                                   # outer lip
        k = [vi_f[i], vi_f[j], vi_b[j], vi_b[i]]
        bm.faces.new(k if side < 0 else k[::-1])                                   # reveal

def bays(n, pw):
    ww = (2 * SIDE - (n + 1) * pw) / n
    return [(-SIDE + pw + k * (ww + pw), -SIDE + (k + 1) * (ww + pw)) for k in range(n)]

DOORS = [(4.0, 5.0), (-5.0, -4.0)]

# ───────── side windows: gaskets, opening top sashes upstairs, door leaves ─────────
for side in (-1, 1):
    ys = side * B
    for x0, x1 in bays(9, 0.12):
        cx, w = (x0 + x1) / 2, x1 - x0
        gasket(parts['rubber'], cx, (Y['up0'] + Y['up1']) / 2, w, Y['up1'] - Y['up0'], side, ys)
        zt = Y['up1'] - 0.27                                                       # top hopper sash
        box(parts['chrome'], x0 + 0.05, x1 - 0.05, ys - side * 0.03, ys + side * 0.012, zt - 0.012, zt + 0.012)
        box(parts['chrome'], cx - 0.01, cx + 0.01, ys - side * 0.03, ys + side * 0.012, zt, Y['up1'] - 0.05)
    for x0, x1 in bays(8, 0.15):
        cx, w = (x0 + x1) / 2, x1 - x0
        if side > 0 and any(a - 0.2 < cx < b + 0.2 for a, b in DOORS):
            continue
        gasket(parts['rubber'], cx, (Y['win0'] + Y['win1']) / 2, w, Y['win1'] - Y['win0'], side, ys)
        zm = Y['win0'] + 0.36                                                      # sliding-sash meeting rail
        box(parts['chrome'], x0 + 0.05, x1 - 0.05, ys - side * 0.03, ys + side * 0.01, zm - 0.01, zm + 0.01)
    # rain eyebrows above both window rows
    box(parts['dark'], -SIDE, SIDE, ys, ys + side * 0.06, Y['up1'] + 0.01, Y['up1'] + 0.035)
    box(parts['dark'], -SIDE, SIDE, ys, ys + side * 0.05, Y['win1'] + 0.01, Y['win1'] + 0.03)
    # side indicators at the four corners
    for x in (SIDE - 0.15, -SIDE + 0.15):
        box(parts['amber'], x - 0.07, x + 0.07, ys, ys + side * 0.03, 1.12, 1.2)

# kerb-side folding doors (Blender +Y)
ys = B - 0.05
for x0, x1 in DOORS:
    for k in range(2):
        a, b = x0 + 0.06 + k * (x1 - x0 - 0.12) / 2, x0 + 0.06 + (k + 1) * (x1 - x0 - 0.12) / 2
        for (za, zb) in [(Y['dado0'] + 0.03, Y['dado0'] + 0.1), (1.24, 1.3), (Y['win1'] - 0.07, Y['win1'])]:
            box(parts['dark'], a, b, ys, ys + 0.035, za, zb)
        box(parts['dark'], a, a + 0.05, ys, ys + 0.035, Y['dado0'] + 0.03, Y['win1'])
        box(parts['dark'], b - 0.05, b, ys, ys + 0.035, Y['dado0'] + 0.03, Y['win1'])
    cyl(parts['chrome'], (x0 - 0.05, B + 0.06, 0.75), (x0 - 0.05, B + 0.06, 1.95), 0.016)     # grab rails
    cyl(parts['chrome'], (x1 + 0.05, B + 0.06, 0.75), (x1 + 0.05, B + 0.06, 1.95), 0.016)
    for z in (0.75, 1.95):
        for xx in (x0 - 0.05, x1 + 0.05):
            cyl(parts['chrome'], (xx, B, z), (xx, B + 0.06, z), 0.012)
    box(parts['steel'], x0, x1, B - 0.25, B + 0.08, 0.36, 0.4)                                 # step

# ───────── ends ─────────
for end in (1, -1):
    xe = end * A
    xs = xe + end * 0.02
    # front gaskets: lower windscreen and the three upper-deck front windows
    for (z0, z1) in [(Y['win0'], Y['win1']), (Y['up0'], Y['up1'])]:
        bm = parts['rubber']
        for (ya, yb) in [(-B + R + 0.02, -0.07), (0.07, B - R - 0.02)]:
            w, h = yb - ya, z1 - z0
            for (y0, y1, zz0, zz1) in [(ya, yb, z0, z0 + 0.05), (ya, yb, z1 - 0.05, z1), (ya, ya + 0.05, z0, z1), (yb - 0.05, yb, z0, z1)]:
                box(bm, xs - 0.015, xs + end * 0.025, y0, y1, zz0, zz1)
    # chrome bumper bar and headlamp hoods
    box(parts['chrome'], xs, xs + end * 0.07, -B + 0.35, B - 0.35, 0.6, 0.66)
    for y in (-0.72, 0.72):
        cyl(parts['dark'], (xs, y, 0.98), (xs + end * 0.09, y, 0.98), 0.165, 20, False)
        box(parts['dark'], xs, xs + end * 0.14, y - 0.17, y + 0.17, 1.12, 1.15)          # visor
    # route-number box under the destination blind
    box(parts['dark'], xs, xs + end * 0.05, -0.9, -0.6, Y['up1'] + 0.03, Y['head1'] - 0.03)
    box(parts['amber'], xs + end * 0.05, xs + end * 0.055, -0.88, -0.62, Y['up1'] + 0.05, Y['head1'] - 0.05)
    # wipers on the lower windscreen
    for y in (-0.35, 0.35):
        p0 = (xs + end * 0.035, y, Y['win0'] + 0.08)
        p1 = (xs + end * 0.035, y - 0.25, Y['win0'] + 0.62)
        cyl(parts['rubber'], p0, p1, 0.008, 6)
    # coupler / towing eye
    box(parts['steel'], xs, xs + end * 0.18, -0.12, 0.12, 0.42, 0.5)
# driver's mirror on the front kerb-side corner
cyl(parts['dark'], (A - 0.1, B, 2.0), (A + 0.15, B + 0.25, 2.1), 0.015)
box(parts['dark'], A + 0.1, A + 0.2, B + 0.18, B + 0.36, 1.85, 2.15)

# ───────── roof ─────────
zr = Y['head1'] + 0.3
for x0, x1 in [(0.2, 1.6), (1.9, 3.3)]:
    box(parts['grille'], x0, x1, -0.42, 0.42, zr, zr + 0.22)                                   # resistor grids
    for x in [x0 + 0.06 + 0.08 * k for k in range(int((x1 - x0) / 0.08))]:
        box(parts['dark'], x - 0.012, x + 0.012, -0.43, 0.43, zr + 0.02, zr + 0.2)
box(parts['wood'], -4.8, 4.8, -0.12, 0.12, zr - 0.02, zr + 0.02)                               # roof walkway
for x in (-1.45, -0.95):                                                                       # trolley base springs
    for y in (-0.12, 0.12):
        for k in range(10):
            cyl(parts['steel'], (x, y, zr + 0.12 + k * 0.015), (x - 0.4, y, zr + 0.12 + k * 0.015), 0.012, 8)
box(parts['dark'], -1.5, -0.9, -0.2, 0.2, zr, zr + 0.12)
cyl(parts['grille'], (-0.3, 0, zr), (-0.3, 0, zr + 0.25), 0.06, 10)                            # lightning arrestor

# ───────── trucks ─────────
for tx in (-3.2, 3.2):
    for side in (-1, 1):
        yy = side * 0.78
        box(parts['dark'], tx - 1.15, tx + 1.15, yy - 0.05, yy + 0.05, 0.22, 0.34)              # side frame
        for dx in (-0.75, 0.75):
            box(parts['steel'], tx + dx - 0.12, tx + dx + 0.12, yy - 0.08, yy + 0.08, 0.2, 0.46) # axle box
            for k in range(5):                                                                   # leaf spring
                L = 0.7 - k * 0.1
                box(parts['steel'], tx + dx - L / 2, tx + dx + L / 2, yy - 0.04, yy + 0.04, 0.47 + k * 0.025, 0.49 + k * 0.025)
            box(parts['dark'], tx + dx - 0.06, tx + dx + 0.06, yy - 0.12, yy - 0.06, 0.2, 0.42) # brake shoe

# ───────── interior fittings ─────────
for z in (2.17, Y['head1'] - 0.04):
    for y in (-0.45, 0.45):
        for x in [-4.6 + 1.3 * k for k in range(8)]:
            box(parts['tube'], x - 0.5, x + 0.5, y - 0.03, y + 0.03, z - 0.02, z)
            box(parts['dark'], x - 0.55, x + 0.55, y - 0.06, y + 0.06, z, z + 0.015)

objs = []
for k, bm in parts.items():
    if not bm.verts:
        bm.free(); continue
    me = bpy.data.meshes.new('tram__' + k)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('tram__' + k, me)
    ob.data.materials.append(M[k])
    scn.collection.objects.link(ob)
    objs.append(ob)

if PREVIEW:
    cam = bpy.data.objects.new('prevcam', bpy.data.cameras.new('prevcam')); scn.collection.objects.link(cam)
    cam.location = (10.5, 9.0, 5.0); cam.rotation_euler = (math.radians(72), 0, math.radians(130)); cam.data.lens = 32
    scn.camera = cam
    sun = bpy.data.objects.new('prevsun', bpy.data.lights.new('prevsun', 'SUN')); scn.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(45), 0, math.radians(120)); sun.data.energy = 3
    w = bpy.data.worlds.new('HKTramPrev'); w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.5, 0.52, 0.56, 1)
    scn.world = w
    scn.render.resolution_x, scn.render.resolution_y = 1280, 720
    scn.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True); bpy.data.objects.remove(sun, do_unlink=True)

for o in scn.collection.all_objects: o.select_set(o in objs)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'tram_detail.glb'), export_format='GLB', use_selection=True,
                          use_active_scene=True, export_apply=True, export_yup=True)
bpy.context.window.scene = prev_scene
print('exported tram_detail.glb', len(objs), 'parts')
