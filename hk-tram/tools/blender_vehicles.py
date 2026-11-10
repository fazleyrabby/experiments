"""Hong Kong taxi (Crown Comfort style) and green minibus (Coaster style) for hk-tram.

Run inside Blender through the BlenderMCP socket. Builds both vehicles in their own scene
"HKTram_Vehicles" from lofted superellipse sections + Catmull-Clark subdivision, cuts the wheel arches
with booleans, places trim on the real body surface by raycasting, then exports assets/taxi.glb and
assets/minibus.glb. Restores the previously open scene and never saves the .blend.

Blender axes: X forward, +Y = vehicle's left (kerb side in Hong Kong), Z up. Origin at ground centre.
Material names are the contract with js/traffic.js.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

OUT = os.environ.get('HK_OUT', '/Users/rabbi/Desktop/Projects/Experiments/hk-tram/assets')
PREVIEW = os.environ.get('HK_PREVIEW', '')
os.makedirs(OUT, exist_ok=True)

prev_scene = bpy.context.window.scene
scn = bpy.data.scenes.get('HKTram_Vehicles') or bpy.data.scenes.new('HKTram_Vehicles')
for o in list(scn.collection.all_objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.context.window.scene = scn
vl = bpy.context.view_layer
log = []

def mat(name, color, rough=0.5, metal=0.0, emit=None, alpha=1.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Alpha'].default_value = alpha
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = 3.0
    return m

M = {k: mat(*v) for k, v in {
    'paint': ('veh_paint', (0.55, 0.02, 0.03), 0.25),
    'silver': ('veh_silver', (0.62, 0.63, 0.65), 0.3, 0.8),
    'glass': ('veh_glass', (0.02, 0.03, 0.04), 0.03, 0.0, None, 0.35),
    'trim': ('veh_trim', (0.015, 0.015, 0.017), 0.5),
    'chrome': ('veh_chrome', (0.8, 0.8, 0.82), 0.12, 1.0),
    'tyre': ('veh_tyre', (0.02, 0.02, 0.02), 0.85),
    'steel': ('veh_steel', (0.35, 0.36, 0.38), 0.35, 0.9),
    'head': ('veh_head', (1, 1, 1), 0.1, 0.0, (1.0, 0.95, 0.85)),
    'tail': ('veh_tail', (0.6, 0.0, 0.0), 0.2, 0.0, (1.0, 0.05, 0.02)),
    'amber': ('veh_amber', (0.8, 0.4, 0.0), 0.2, 0.0, (1.0, 0.5, 0.0)),
    'taxisign': ('veh_taxisign', (1, 1, 1), 0.3, 0.0, (1, 1, 1)),
    'plate_f': ('veh_plate_front', (0.9, 0.9, 0.88), 0.4),
    'plate_r': ('veh_plate_rear', (0.9, 0.75, 0.1), 0.4),
    'cream': ('veh_cream', (0.82, 0.78, 0.66), 0.3),
    'green': ('veh_green', (0.03, 0.32, 0.12), 0.3),
    'red': ('veh_red', (0.6, 0.02, 0.03), 0.3),
    'led': ('veh_led', (1, 0.5, 0.05), 0.4, 0.0, (1.0, 0.5, 0.05)),
    'seat': ('veh_seat', (0.05, 0.05, 0.055), 0.8),
    'skin': ('veh_skin', (0.55, 0.38, 0.27), 0.7),
    'cloth': ('veh_cloth', (0.08, 0.09, 0.12), 0.9),
    'cabinlight': ('veh_cabinlight', (1, 1, 1), 0.5, 0.0, (1.0, 0.95, 0.85)),
}.items()}

# ───────────────────────── helpers ─────────────────────────
def new_obj(name, bm, materials, parent, recalc=True):
    if recalc:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)
    for m in materials:
        ob.data.materials.append(m)
    ob.parent = parent
    return ob

def ring(x, zb, zt, hwb, hwt, n, Mn=36):
    zc, hz = (zb + zt) / 2, (zt - zb) / 2
    pts = []
    for i in range(Mn):
        a = 2 * math.pi * i / Mn
        c, s = math.cos(a), math.sin(a)
        z = zc + hz * math.copysign(abs(s) ** (2 / n), s)
        t = (z - zb) / max(1e-6, zt - zb)
        hw = hwb + (hwt - hwb) * t
        y = hw * math.copysign(abs(c) ** (2 / n), c)
        pts.append((x, y, z))
    return pts

def loft(sections, n):
    """sections: list of (x, zb, zt, hw_bottom, hw_top) ordered front→back"""
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in ring(*s, n)] for s in sections]
    Mn = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for j in range(Mn):
            bm.faces.new((a[j], b[j], b[(j + 1) % Mn], a[(j + 1) % Mn]))
    bm.faces.new(rings[0])
    bm.faces.new(rings[-1][::-1])
    return bm

def box(bm, x0, x1, y0, y1, z0, z1):
    m = Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)) @ Matrix.Diagonal((abs(x1 - x0), abs(y1 - y0), abs(z1 - z0), 1))
    bmesh.ops.create_cube(bm, size=1.0, matrix=m, calc_uvs=True)

def cyl_y(bm, x, y0, y1, z, r, seg=24):
    m = Matrix.Translation((x, (y0 + y1) / 2, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=abs(y1 - y0), matrix=m)

def cyl_z(bm, x, y, z0, z1, r, seg=12):
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=abs(z1 - z0), matrix=Matrix.Translation((x, y, (z0 + z1) / 2)))

def sphere(bm, x, y, z, sx, sy, sz):
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0, matrix=Matrix.Translation((x, y, z)) @ Matrix.Diagonal((sx, sy, sz, 1)))

def activate(ob):
    for o in scn.collection.all_objects: o.select_set(False)
    vl.objects.active = ob
    ob.select_set(True)

def apply_all(ob):
    activate(ob)
    for md in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)

def subdivide(ob, levels=2):
    md = ob.modifiers.new('sub', 'SUBSURF'); md.levels = levels; md.render_levels = levels
    apply_all(ob)

def cut_arches(ob, wheels, r, zc, liner):
    cutters = []
    for x in wheels:
        bm = bmesh.new()
        cyl_y(bm, x, -2, 2, zc, r, 40)
        c = new_obj(f'cut_{ob.name}_{x}', bm, [liner], None)
        cutters.append(c)
        md = ob.modifiers.new(f'arch{x}', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = c
        try: md.solver = 'EXACT'
        except Exception: pass
        try: md.material_mode = 'TRANSFER'
        except Exception: pass
    apply_all(ob)
    for c in cutters: bpy.data.objects.remove(c, do_unlink=True)

def surface_y(ob, x, z, side):
    """y of the body surface at (x, z) on the given side, by raycast from outside"""
    deps = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(ob, deps)
    hit = bvh.ray_cast(Vector((x, side * 3.0, z)), Vector((0, -side, 0)))
    return hit[0].y if hit[0] else side * 0.8

def surface_x(ob, y, z, end):
    deps = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(ob, deps)
    hit = bvh.ray_cast(Vector((end * 6.0, y, z)), Vector((-end, 0, 0)))
    return hit[0].x if hit[0] else end * 2.3

def wheel(bm_t, bm_s, x, y, z, r, w, side):
    # tyre with rounded shoulders, steel rim, hub cap
    seg = 32
    for k, (rr, ww) in enumerate([(r * 0.93, w), (r, w * 0.82)]):
        cyl_y(bm_t, x, y - ww / 2, y + ww / 2, z, rr, seg)
    cyl_y(bm_s, x, y + side * (w / 2 - 0.02), y + side * (w / 2 + 0.005), z, r * 0.62, 28)
    cyl_y(bm_s, x, y + side * (w / 2), y + side * (w / 2 + 0.03), z, r * 0.28, 20)
    for k in range(5):
        a = k * 2 * math.pi / 5
        cyl_y(bm_s, x + math.cos(a) * r * 0.42, y + side * (w / 2), y + side * (w / 2 + 0.012), z + math.sin(a) * r * 0.42, r * 0.07, 10)

def person(bm_skin, bm_cloth, x, y, z, s=1.0):
    sphere(bm_cloth, x, y, z + 0.28 * s, 0.17 * s, 0.21 * s, 0.3 * s)
    sphere(bm_skin, x + 0.02, y, z + 0.68 * s, 0.09 * s, 0.085 * s, 0.11 * s)
    sphere(bm_cloth, x - 0.01, y, z + 0.74 * s, 0.095 * s, 0.09 * s, 0.07 * s)   # hair

def assign(ob, fn):
    me = ob.data
    names = [m.name for m in me.materials]
    for p in me.polygons:
        k = fn(p.center, p.normal)
        if k is not None:
            if k not in names:
                me.materials.append(bpy.data.materials[k]); names.append(k)
            p.material_index = names.index(k)

# ───────────────────────── taxi ─────────────────────────
def build_taxi():
    root = bpy.data.objects.new('taxi', None); scn.collection.objects.link(root)
    body_secs = [
        (2.36, 0.40, 0.70, 0.74, 0.72),
        (2.33, 0.31, 0.79, 0.82, 0.80),
        (2.22, 0.27, 0.86, 0.855, 0.83),
        (1.60, 0.26, 0.91, 0.865, 0.84),
        (1.05, 0.26, 0.955, 0.87, 0.845),
        (0.00, 0.26, 0.975, 0.87, 0.845),
        (-1.50, 0.26, 0.985, 0.87, 0.845),
        (-1.85, 0.26, 0.975, 0.865, 0.84),
        (-2.18, 0.29, 0.945, 0.85, 0.83),
        (-2.32, 0.33, 0.87, 0.82, 0.80),
        (-2.36, 0.42, 0.76, 0.76, 0.74),
    ]
    body = new_obj('taxi__body', loft(body_secs, 9), [M['paint']], root)
    subdivide(body, 2)
    cut_arches(body, [1.38, -1.38], 0.385, 0.31, M['trim'])

    cab_secs = [
        (1.10, 0.90, 0.985, 0.80, 0.79),
        (0.80, 0.90, 1.20, 0.80, 0.74),
        (0.45, 0.90, 1.43, 0.80, 0.665),
        (0.00, 0.90, 1.455, 0.80, 0.665),
        (-0.95, 0.90, 1.465, 0.80, 0.665),
        (-1.25, 0.90, 1.30, 0.80, 0.70),
        (-1.60, 0.90, 1.0, 0.80, 0.77),
    ]
    cab = new_obj('taxi__cab', loft(cab_secs, 7), [M['glass']], root)
    subdivide(cab, 2)

    def cab_mat(c, n):
        if n.z > 0.75 and c.z > 1.36: return 'veh_silver'
        if c.z < 0.985: return 'veh_trim'
        if abs(n.y) > 0.62:
            if -0.34 < c.x < -0.16: return 'veh_silver'     # B pillar
            if c.x < -1.18: return 'veh_silver'             # C pillar
            if c.x > 0.62: return 'veh_silver'              # A pillar root
            if c.z > 1.40: return 'veh_silver'              # drip rail
            return 'veh_glass'
        if n.x > 0.2 and abs(n.y) > 0.42: return 'veh_silver'   # A pillars
        if n.x < -0.2 and abs(n.y) > 0.42: return 'veh_silver'  # C corners
        return 'veh_glass'
    assign(cab, cab_mat)

    # body-surface trim: rubbing strip, door seams, handles, fender mirrors
    tr, ch, rest = bmesh.new(), bmesh.new(), {}
    for side in (-1, 1):
        for x0, x1 in [(-2.1, -1.84), (-0.92, 0.94), (1.84, 2.1)]:
            y = surface_y(body, (x0 + x1) / 2, 0.6, side)
            box(tr, x0, x1, y - side * 0.01, y + side * 0.018, 0.575, 0.625)
        for x in (0.97, -0.2, -1.42):
            y = surface_y(body, x, 0.7, side)
            box(tr, x - 0.006, x + 0.006, y - side * 0.004, y + side * 0.004, 0.36, 0.95)
        for x in (0.62, -0.55):
            y = surface_y(body, x, 0.86, side)
            box(ch, x - 0.09, x + 0.09, y, y + side * 0.025, 0.845, 0.875)
        y = surface_y(body, 1.75, 0.9, side)
        cyl_z(tr, 1.75, y - side * 0.02, 0.88, 1.06, 0.012, 8)
        box(tr, 1.70, 1.80, y - side * 0.05, y + side * 0.06, 1.04, 1.12)
    trim = new_obj('taxi__trim', tr, [M['trim']], root)
    new_obj('taxi__chrome', ch, [M['chrome']], root)

    # front and rear details on the actual nose / tail
    fx = surface_x(body, 0, 0.62, 1)
    rx = surface_x(body, 0, 0.7, -1)
    f = {k: bmesh.new() for k in ('trim', 'chrome', 'head', 'tail', 'amber', 'plate_f', 'plate_r', 'silver')}
    box(f['chrome'], fx - 0.03, fx + 0.035, -0.46, 0.46, 0.53, 0.75)           # grille surround
    box(f['trim'], fx - 0.02, fx + 0.04, -0.42, 0.42, 0.56, 0.72)
    for z in (0.6, 0.64, 0.68):
        box(f['chrome'], fx + 0.035, fx + 0.045, -0.42, 0.42, z - 0.006, z + 0.006)
    for side in (-1, 1):
        box(f['chrome'], fx - 0.05, fx + 0.03, side * 0.48, side * 0.8, 0.56, 0.74)
        box(f['head'], fx + 0.03, fx + 0.04, side * 0.5, side * 0.78, 0.58, 0.72)
        box(f['amber'], fx - 0.04, fx + 0.045, side * 0.58, side * 0.76, 0.42, 0.47)
        box(f['tail'], rx - 0.04, rx + 0.02, side * 0.58, side * 0.8, 0.56, 0.9)
        box(f['amber'], rx - 0.042, rx + 0.0, side * 0.58, side * 0.8, 0.5, 0.555)
    box(f['silver'], fx - 0.06, fx + 0.1, -0.86, 0.86, 0.3, 0.47)              # front bumper
    box(f['silver'], rx - 0.1, rx + 0.06, -0.86, 0.86, 0.32, 0.5)              # rear bumper
    box(f['trim'], fx + 0.1, fx + 0.11, -0.86, 0.86, 0.36, 0.4)
    box(f['plate_f'], fx + 0.1, fx + 0.115, -0.25, 0.25, 0.33, 0.44)
    box(f['plate_r'], rx - 0.045, rx - 0.035, -0.25, 0.25, 0.6, 0.72)
    for k, bm in f.items():
        new_obj(f'taxi__{k}', bm, [M[k]], root)

    # roof sign
    s = bmesh.new()
    box(s, -0.48, -0.02, -0.17, 0.17, 1.5, 1.66)
    new_obj('taxi__taxisign', s, [M['taxisign']], root)
    b = bmesh.new()
    box(b, -0.46, -0.04, -0.12, 0.12, 1.455, 1.5)
    new_obj('taxi__signbase', b, [M['trim']], root)

    # wheels
    tb, sb = bmesh.new(), bmesh.new()
    for x in (1.38, -1.38):
        for side in (-1, 1):
            wheel(tb, sb, x, side * 0.72, 0.31, 0.31, 0.2, side)
    new_obj('taxi__tyre', tb, [M['tyre']], root, False)
    new_obj('taxi__steel', sb, [M['steel']], root, False)

    # interior: seats, dash, wheel, driver
    se, sk, cl = bmesh.new(), bmesh.new(), bmesh.new()
    box(se, 0.55, 0.95, -0.72, 0.72, 0.8, 1.0)                     # dashboard
    for x in (-0.2, -1.05):
        for y in ((-0.38, 0.38) if x > -0.5 else (0.0,)):
            box(se, x - 0.25, x + 0.15, y - 0.28 if y else -0.66, y + 0.28 if y else 0.66, 0.45, 0.62)
            box(se, x - 0.27, x - 0.17, y - 0.26 if y else -0.66, y + 0.26 if y else 0.66, 0.6, 1.2)
    bmesh.ops.create_cone(se, cap_ends=False, segments=16, radius1=0.18, radius2=0.18, depth=0.02,
                          matrix=Matrix.Translation((0.42, -0.38, 1.0)) @ Matrix.Rotation(math.radians(60), 4, 'Y'))
    person(sk, cl, -0.08, -0.38, 0.62)
    person(sk, cl, -1.0, 0.35, 0.62, 0.95)
    new_obj('taxi__seat', se, [M['seat']], root, False)
    new_obj('taxi__skin', sk, [M['skin']], root, False)
    new_obj('taxi__cloth', cl, [M['cloth']], root, False)
    return root

# ───────────────────────── minibus ─────────────────────────
def build_minibus():
    root = bpy.data.objects.new('minibus', None); scn.collection.objects.link(root)
    secs = [
        (3.52, 0.46, 1.05, 0.93, 0.92),
        (3.49, 0.36, 1.55, 1.0, 0.99),
        (3.36, 0.34, 2.10, 1.015, 0.99),
        (3.16, 0.34, 2.45, 1.015, 0.975),
        (2.85, 0.34, 2.60, 1.015, 0.965),
        (2.30, 0.34, 2.64, 1.015, 0.96),
        (-3.20, 0.34, 2.64, 1.015, 0.96),
        (-3.44, 0.34, 2.58, 1.01, 0.955),
        (-3.52, 0.40, 2.40, 0.99, 0.94),
    ]
    body = new_obj('minibus__body', loft(secs, 10), [M['cream']], root)
    subdivide(body, 2)
    cut_arches(body, [2.15, -1.95], 0.5, 0.38, M['trim'])
    win_x = [(-3.15, -2.15), (-2.05, -1.05), (-0.95, 0.05), (0.15, 1.15), (1.25, 2.1)]
    def bus_mat(c, n):
        if c.x > 3.0:                                                              # nose: wrap-around screen
            if c.z > 2.42: return 'veh_green'
            if 1.5 < c.z <= 2.42: return 'veh_glass'
            return None
        if c.z > 2.36 and (n.z > 0.2 or abs(n.y) > 0.5): return 'veh_green'
        if n.x > 0.45 and 1.5 < c.z < 2.5: return 'veh_glass'                     # windscreen
        if n.x < -0.45 and 1.5 < c.z < 2.28: return 'veh_glass'                   # rear window
        if abs(n.y) > 0.6:
            if 1.42 < c.z < 2.24:
                if any(a < c.x < b for a, b in win_x): return 'veh_glass'
                if c.y > 0 and 2.2 < c.x < 3.0: return 'veh_glass'               # kerbside door
                if c.y < 0 and 2.2 < c.x < 3.0: return 'veh_glass'               # driver window
                return 'veh_trim'
            if c.y > 0 and 2.2 < c.x < 3.0 and c.z > 0.42: return 'veh_glass'    # glazed door
            if 1.3 < c.z < 1.36: return 'veh_red'
            if 2.24 <= c.z <= 2.36: return 'veh_green'
        return None
    assign(body, bus_mat)

    f = {k: bmesh.new() for k in ('trim', 'chrome', 'head', 'tail', 'amber', 'plate_f', 'plate_r', 'led', 'seat', 'skin', 'cloth', 'cabinlight')}
    fx = surface_x(body, 0, 0.75, 1)
    rx = surface_x(body, 0, 0.8, -1)
    box(f['trim'], fx - 0.05, fx + 0.12, -1.02, 1.02, 0.34, 0.6)                  # front bumper
    box(f['trim'], rx - 0.12, rx + 0.05, -1.02, 1.02, 0.34, 0.58)
    box(f['trim'], fx - 0.03, fx + 0.03, -0.55, 0.55, 0.66, 0.98)                 # grille
    for z in (0.72, 0.8, 0.88):
        box(f['chrome'], fx + 0.03, fx + 0.04, -0.52, 0.52, z - 0.01, z + 0.01)
    for side in (-1, 1):
        box(f['head'], fx - 0.02, fx + 0.035, side * 0.62, side * 0.92, 0.72, 0.9)
        box(f['amber'], fx - 0.02, fx + 0.036, side * 0.62, side * 0.92, 0.66, 0.71)
        box(f['tail'], rx - 0.035, rx + 0.02, side * 0.78, side * 0.96, 0.75, 1.15)
        # bus mirrors on long arms, the Coaster signature
        y0 = side * 1.0
        for (a, b) in [((fx - 0.15, y0, 2.15), (fx + 0.28, side * 1.18, 2.2)), ((fx + 0.28, side * 1.18, 2.2), (fx + 0.32, side * 1.2, 1.85))]:
            va, vb = Vector(a), Vector(b)
            d = vb - va
            mtx = Matrix.Translation((va + vb) / 2) @ d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            bmesh.ops.create_cone(f['trim'], cap_ends=True, segments=8, radius1=0.018, radius2=0.018, depth=d.length, matrix=mtx)
        box(f['trim'], fx + 0.26, fx + 0.36, side * 1.1, side * 1.3, 1.55, 1.9)
    box(f['plate_f'], fx + 0.12, fx + 0.13, -0.26, 0.26, 0.38, 0.5)
    box(f['plate_r'], rx - 0.13, rx - 0.12, -0.26, 0.26, 0.62, 0.74)
    # LED destination board behind the top of the windscreen, roof marker lights
    box(f['led'], fx - 0.42, fx - 0.36, -0.62, 0.62, 2.28, 2.44)
    for y in (-0.8, -0.3, 0.3, 0.8):
        box(f['amber'], 2.9, 3.0, y - 0.05, y + 0.05, 2.62, 2.67)
    # interior
    box(f['cabinlight'], -3.0, 2.6, -0.06, 0.06, 2.5, 2.52)
    for x in [2.6 - 0.82 * k for k in range(7)]:
        for y in (-0.52, 0.52):
            box(f['seat'], x - 0.22, x + 0.2, y - 0.38, y + 0.38, 0.75, 0.88)
            box(f['seat'], x - 0.24, x - 0.16, y - 0.36, y + 0.36, 0.85, 1.5)
            if (int(x * 10) + int(y * 10)) % 3 != 0:
                person(f['skin'], f['cloth'], x + 0.02, y, 0.88, 1.0)
    person(f['skin'], f['cloth'], 2.85, -0.5, 0.9, 1.0)   # driver
    for k, bm in f.items():
        new_obj(f'minibus__{k}', bm, [M[k]], root, k not in ('seat', 'skin', 'cloth'))

    tb, sb = bmesh.new(), bmesh.new()
    for x in (2.15, -1.95):
        for side in (-1, 1):
            wheel(tb, sb, x, side * 0.86, 0.37, 0.37, 0.24, side)
    new_obj('minibus__tyre', tb, [M['tyre']], root, False)
    new_obj('minibus__steel', sb, [M['steel']], root, False)
    return root

taxi = build_taxi()
bus = build_minibus()
bus.location = (0, 0, 0)

def export(root, name):
    for o in scn.collection.all_objects: o.select_set(False)
    def sel(o):
        o.select_set(True)
        for c in o.children: sel(c)
    sel(root)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name), export_format='GLB', use_selection=True,
                              use_active_scene=True, export_apply=True, export_yup=True)
    log.append('exported ' + name)

if PREVIEW:
    # side-by-side studio render for checking shapes
    bus.location = (0, 3.2, 0)
    cam = bpy.data.objects.new('prevcam', bpy.data.cameras.new('prevcam')); scn.collection.objects.link(cam)
    cam.location = (9.5, -8.5, 3.2); cam.rotation_euler = (math.radians(78), 0, math.radians(48))
    cam.data.lens = 40
    scn.camera = cam
    sun = bpy.data.objects.new('prevsun', bpy.data.lights.new('prevsun', 'SUN')); scn.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(30)); sun.data.energy = 3
    w = bpy.data.worlds.get('HKKitWorld') or bpy.data.worlds.new('HKVehWorld')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.35, 0.37, 0.42, 1)
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.8
    scn.world = w
    scn.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
    scn.render.resolution_x, scn.render.resolution_y = 1280, 720
    scn.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True); bpy.data.objects.remove(sun, do_unlink=True)
    bus.location = (0, 0, 0)
    log.append('preview ' + PREVIEW)

export(taxi, 'taxi.glb')
export(bus, 'minibus.glb')
bpy.context.window.scene = prev_scene
print('\n'.join(log))
