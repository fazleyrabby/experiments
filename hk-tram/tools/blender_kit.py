"""Hong Kong tenement facade kit for hk-tram.

Run inside Blender (e.g. through the BlenderMCP socket). Builds the kit in its own scene "HKTram_Kit",
bakes grime + ambient occlusion for the masonry parts with Cycles, exports assets/hk_kit.glb and
switches the window back to whatever scene was open. The .blend file is never saved.

Kit conventions (Blender, Z up): a module is W wide along X, sits on Z=0, its back face is the
building wall at Y=0 and it protrudes toward -Y (the street). glTF export turns -Y into +Z.
Objects are named "<module>__<part>"; parts map to materials in three.js by material name.
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix

OUT = os.environ.get('HK_OUT', '/Users/rabbi/Desktop/Projects/Experiments/hk-tram/assets')
BAKE_DIR = os.environ.get('HK_BAKE', '/tmp/hk_bake')
os.makedirs(OUT, exist_ok=True)
os.makedirs(BAKE_DIR, exist_ok=True)
random.seed(7)

W, H, D = 2.6, 3.1, 0.28          # bay width, storey height, wall panel depth
SHOP_H = 4.65
BAKE_SIZE = 512

prev_scene = bpy.context.window.scene
scn = bpy.data.scenes.get('HKTram_Kit') or bpy.data.scenes.new('HKTram_Kit')
for o in list(scn.collection.all_objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.context.window.scene = scn
log = []

# ───────────────────────── materials ─────────────────────────
def principled(name, color, rough=0.5, metal=0.0, alpha=1.0, emit=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    p.inputs['Alpha'].default_value = alpha
    if emit:
        p.inputs['Emission Color'].default_value = (*emit, 1)
        p.inputs['Emission Strength'].default_value = 1.0
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    return m

def grime_material(name, base=(0.78, 0.76, 0.72), dark=(0.42, 0.40, 0.37)):
    """procedural weathered paint: vertical rain streaks + blotchy dirt, used only for baking"""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    p = nt.nodes.new('ShaderNodeBsdfPrincipled')
    p.inputs['Roughness'].default_value = 0.9
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (14.0, 14.0, 0.7)
    n1 = nt.nodes.new('ShaderNodeTexNoise'); n1.inputs['Scale'].default_value = 3.0; n1.inputs['Detail'].default_value = 6.0
    n2 = nt.nodes.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 2.2; n2.inputs['Detail'].default_value = 10.0
    r1 = nt.nodes.new('ShaderNodeValToRGB'); r1.color_ramp.elements[0].position = 0.45; r1.color_ramp.elements[1].position = 0.75
    r2 = nt.nodes.new('ShaderNodeValToRGB'); r2.color_ramp.elements[0].position = 0.35; r2.color_ramp.elements[1].position = 0.7
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*base, 1)
    mix.inputs['B'].default_value = (*dark, 1)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], n1.inputs['Vector'])
    nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    nt.links.new(n1.outputs['Fac'], r1.inputs['Fac'])
    nt.links.new(n2.outputs['Fac'], r2.inputs['Fac'])
    nt.links.new(r1.outputs['Color'], mx.inputs[0])
    nt.links.new(r2.outputs['Color'], mx.inputs[1])
    nt.links.new(mx.outputs['Value'], mix.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], p.inputs['Base Color'])
    nt.links.new(p.outputs['BSDF'], out.inputs['Surface'])
    return m

MAT = {
    'frame': principled('kit_frame', (0.72, 0.73, 0.74), 0.3, 1.0),
    'glass': principled('kit_glass', (0.05, 0.07, 0.09), 0.03, 0.0, 0.3),
    'interior': principled('kit_interior', (0.0, 0.0, 0.0), 1.0, 0.0, 1.0, (1.0, 0.8, 0.5)),
    'metal': principled('kit_metal', (0.06, 0.065, 0.07), 0.45, 0.6),
    'rust': principled('kit_rust', (0.20, 0.10, 0.06), 0.7, 0.4),
    'shutter': principled('kit_shutter', (0.55, 0.56, 0.57), 0.4, 0.9),
    'plant': principled('kit_plant', (0.05, 0.16, 0.06), 0.8),
    'pot': principled('kit_pot', (0.35, 0.14, 0.08), 0.8),
}

# ───────────────────────── mesh helpers ─────────────────────────
class Part:
    def __init__(self, closed=True):
        self.bm = bmesh.new()
        self.closed = closed

    def box(self, x0, x1, y0, y1, z0, z1):
        bm = self.bm
        x0, x1 = min(x0, x1), max(x0, x1); y0, y1 = min(y0, y1), max(y0, y1); z0, z1 = min(z0, z1), max(z0, z1)
        v = [bm.verts.new((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
        for f in [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]:
            bm.faces.new([v[i] for i in f])
        return self

    def plane(self, x0, x1, z0, z1, y):
        """vertical plane facing -Y (the street)"""
        bm = self.bm
        v = [bm.verts.new(p) for p in [(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)]]
        bm.faces.new(v)
        return self

    def cyl(self, x, y, z0, z1, r, seg=10, axis='Z'):
        m = Matrix.Translation((x, y, (z0 + z1) / 2)) if axis == 'Z' else None
        bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=abs(z1 - z0), matrix=m)
        return self

    def cyl_y(self, x, y0, y1, z, r, seg=10):
        m = Matrix.Translation((x, (y0 + y1) / 2, z)) @ Matrix.Rotation(math.pi / 2, 4, 'X')
        bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=abs(y1 - y0), matrix=m)
        return self

    def ico(self, x, y, z, r):
        bmesh.ops.create_icosphere(self.bm, subdivisions=1, radius=r, matrix=Matrix.Translation((x, y, z)))
        return self

    def finish(self, name, mat, parent, bevel=0.0):
        if self.closed:
            bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces[:])
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        ob = bpy.data.objects.new(name, me)
        scn.collection.objects.link(ob)
        ob.data.materials.append(mat)
        ob.parent = parent
        if bevel > 0:
            md = ob.modifiers.new('bevel', 'BEVEL')
            md.width = bevel; md.segments = 1; md.limit_method = 'ANGLE'
        return ob

def module(name):
    e = bpy.data.objects.new(name, None)
    scn.collection.objects.link(e)
    return e

def wall_with_opening(p, ox0, ox1, oz0, oz1, w=W, h=H, d=D):
    p.box(-w / 2, ox0, -d, 0, 0, h)
    p.box(ox1, w / 2, -d, 0, 0, h)
    if oz0 > 0: p.box(ox0, ox1, -d, 0, 0, oz0)
    if oz1 < h: p.box(ox0, ox1, -d, 0, oz1, h)

def floor_band(p, w=W, d=D):
    p.box(-w / 2, w / 2, -d - 0.035, -d, 0.0, 0.3)

def window_frame(f, g, ox0, ox1, oz0, oz1, y=-0.11):
    t = 0.045
    f.box(ox0, ox1, y - 0.03, y + 0.03, oz0, oz0 + t)
    f.box(ox0, ox1, y - 0.03, y + 0.03, oz1 - t, oz1)
    f.box(ox0, ox0 + t, y - 0.03, y + 0.03, oz0, oz1)
    f.box(ox1 - t, ox1, y - 0.03, y + 0.03, oz0, oz1)
    tz = oz0 + (oz1 - oz0) * 0.72
    f.box(ox0, ox1, y - 0.03, y + 0.03, tz - 0.02, tz + 0.02)                  # transom
    mx = (ox0 + ox1) / 2
    f.box(mx - 0.025, mx + 0.025, y - 0.045, y + 0.0, oz0, tz)               # meeting rails of the sliding sashes
    f.box(mx - 0.02, mx + 0.02, y, y + 0.03, oz0, tz)
    g.plane(ox0 + t, ox1 - t, oz0 + t, oz1 - t, y + 0.005)

# ───────────────────────── modules ─────────────────────────
def build_window():
    e = module('win')
    wall, fr, gl, it = Part(), Part(), Part(False), Part(False)
    ox0, ox1, oz0, oz1 = -0.8, 0.8, 0.85, 2.65
    wall_with_opening(wall, ox0, ox1, oz0, oz1)
    floor_band(wall)
    wall.box(ox0 - 0.06, ox1 + 0.06, -D - 0.06, -D + 0.12, oz0 - 0.07, oz0)  # sill
    wall.box(ox0 - 0.04, ox1 + 0.04, -D - 0.04, -D + 0.05, oz1, oz1 + 0.08)   # hood
    window_frame(fr, gl, ox0, ox1, oz0, oz1)
    it.plane(ox0 - 0.02, ox1 + 0.02, oz0 - 0.02, oz1 + 0.02, -0.004)
    wall.finish('win__wall', grime_material('bake_win'), e, 0.012)
    fr.finish('win__frame', MAT['frame'], e)
    gl.finish('win__glass', MAT['glass'], e)
    it.finish('win__interior', MAT['interior'], e)
    return e

def build_cage():
    e = module('cage')
    m, pl, pt = Part(), Part(), Part()
    x0, x1, y0, y1, z0, z1 = -0.9, 0.9, -D, -D - 0.36, 0.78, 2.78
    t = 0.022
    for (xa, xb) in [(x0, x0 + t), (x1 - t, x1)]:
        for (ya, yb) in [(y0, y0 - t), (y1 + t, y1)]:
            m.box(xa, xb, ya, yb, z0, z1)
    for z in (z0, z0 + 0.42, z1 - t):
        m.box(x0, x1, y1, y1 + t, z, z + t)
        m.box(x0, x0 + t, y0, y1, z, z + t); m.box(x1 - t, x1, y0, y1, z, z + t)
    m.box(x0, x1, y0, y1, z0 - 0.015, z0)            # plant tray
    m.box(x0 - 0.02, x1 + 0.02, y0, y1 - 0.02, z1, z1 + 0.012)  # rain hood
    x = x0 + 0.1
    while x < x1 - 0.05:
        m.box(x - 0.006, x + 0.006, y1, y1 + 0.012, z0, z1); x += 0.1
    y = y0 - 0.1
    while y > y1 + 0.05:
        m.box(x0, x0 + 0.012, y - 0.006, y + 0.006, z0, z1); m.box(x1 - 0.012, x1, y - 0.006, y + 0.006, z0, z1); y -= 0.1
    for i in range(3):
        px = x0 + 0.3 + i * 0.55 + random.uniform(-0.1, 0.1)
        pt.cyl(px, y0 - 0.17, z0, z0 + 0.18, 0.1, 10)
        pl.ico(px, y0 - 0.17, z0 + 0.32, 0.17 + random.uniform(0, 0.06))
        pl.ico(px + 0.08, y0 - 0.13, z0 + 0.45, 0.11)
    m.finish('cage__metal', MAT['rust'], e)
    pl.finish('cage__plant', MAT['plant'], e)
    pt.finish('cage__pot', MAT['pot'], e)
    return e

def build_balcony(closed):
    name = 'balc_closed' if closed else 'balc_open'
    e = module(name)
    wall, fr, gl, it, mt = Part(), Part(), Part(False), Part(False), Part()
    ox0, ox1, oz0, oz1 = -0.85, 0.85, 0.16, 2.4
    wall_with_opening(wall, ox0, ox1, oz0, oz1)
    floor_band(wall)
    sd = 0.95
    wall.box(-W / 2, W / 2, -D - sd, -D, 0.0, 0.16)                       # slab
    wall.box(-W / 2, W / 2, -D - sd, -D - sd + 0.03, -0.05, 0.0)           # drip edge
    window_frame(fr, gl, ox0, ox1, oz0, oz1, -0.12)
    it.plane(ox0 - 0.02, ox1 + 0.02, oz0, oz1 + 0.02, -0.004)
    yf = -D - sd + 0.04
    if closed:
        wall.box(-W / 2 + 0.02, W / 2 - 0.02, yf, yf + 0.1, 0.16, 1.0)          # solid upstand
        wall.box(-W / 2, -W / 2 + 0.1, -D - sd, -D, 0.16, H)                     # side cheeks
        wall.box(W / 2 - 0.1, W / 2, -D - sd, -D, 0.16, H)
        t = 0.04
        z0, z1 = 1.0, H - 0.02
        fr.box(-W / 2 + 0.1, W / 2 - 0.1, yf, yf + 0.06, z0, z0 + t)
        fr.box(-W / 2 + 0.1, W / 2 - 0.1, yf, yf + 0.06, z1 - t, z1)
        for k in range(5):
            x = -W / 2 + 0.1 + k * (W - 0.2) / 4
            fr.box(x - t / 2, x + t / 2, yf, yf + 0.06, z0, z1)
        gl.plane(-W / 2 + 0.1, W / 2 - 0.1, z0, z1, yf + 0.03)
    else:
        t = 0.03
        for x in (-W / 2 + 0.05, W / 2 - 0.05):
            mt.box(x - t, x + t, yf - t, yf + t, 0.16, 1.2)
        mt.box(-W / 2 + 0.02, W / 2 - 0.02, yf - 0.035, yf + 0.035, 1.17, 1.23)   # handrail
        for xs in (-W / 2 + 0.05, W / 2 - 0.05):
            mt.box(xs - 0.02, xs + 0.02, -D - sd, -D, 1.17, 1.21)
        x = -W / 2 + 0.15
        while x < W / 2 - 0.1:
            mt.box(x - 0.008, x + 0.008, yf - 0.008, yf + 0.008, 0.16, 1.17); x += 0.12
        y = -D - 0.1
        while y > yf + 0.05:
            for xs in (-W / 2 + 0.05, W / 2 - 0.05):
                mt.box(xs - 0.008, xs + 0.008, y - 0.008, y + 0.008, 0.16, 1.17)
            y -= 0.12
    wall.finish(f'{name}__wall', grime_material(f'bake_{name}'), e, 0.012)
    fr.finish(f'{name}__frame', MAT['frame'], e)
    gl.finish(f'{name}__glass', MAT['glass'], e)
    it.finish(f'{name}__interior', MAT['interior'], e)
    if not closed:
        mt.finish(f'{name}__metal', MAT['metal'], e)
    return e

def build_bay():
    e = module('bay')
    wall, fr, gl, it = Part(), Part(), Part(False), Part(False)
    bx0, bx1, by = -1.05, 1.05, -D - 0.5
    z0, z1 = 0.72, 2.78
    wall.box(-W / 2, W / 2, -D, 0, 0, z0)
    wall.box(-W / 2, W / 2, -D, 0, z1, H)
    wall.box(-W / 2, bx0, -D, 0, z0, z1)
    wall.box(bx1, W / 2, -D, 0, z0, z1)
    floor_band(wall)
    wall.box(bx0, bx1, by, -D, z0 - 0.14, z0)      # bay base
    wall.box(bx0 - 0.03, bx1 + 0.03, by - 0.03, -D, z1, z1 + 0.14)  # bay roof
    t = 0.045
    for x in (bx0, -0.35, 0.35, bx1 - t):
        fr.box(x, x + t, by, by + 0.05, z0, z1)
    for z in (z0, z1 - t, z0 + (z1 - z0) * 0.7):
        fr.box(bx0, bx1, by, by + 0.05, z, z + t)
    for x in (bx0, bx1 - t):
        fr.box(x, x + t, by, -D, z0, z0 + t); fr.box(x, x + t, by, -D, z1 - t, z1)
    gl.plane(bx0, bx1, z0, z1, by + 0.025)
    # side glass (two planes facing ±X)
    bm = gl.bm
    for x, flip in ((bx0 + 0.01, True), (bx1 - 0.01, False)):
        v = [bm.verts.new(p) for p in [(x, -D, z0), (x, by, z0), (x, by, z1), (x, -D, z1)]]
        bm.faces.new(v[::-1] if flip else v)
    it.plane(bx0 + 0.02, bx1 - 0.02, z0, z1, -D - 0.005)
    wall.finish('bay__wall', grime_material('bake_bay'), e, 0.012)
    fr.finish('bay__frame', MAT['frame'], e)
    gl.finish('bay__glass', MAT['glass'], e)
    it.finish('bay__interior', MAT['interior'], e)
    return e

def build_shop(shutter):
    name = 'shop_shut' if shutter else 'shop_open'
    e = module(name)
    wall, fr, gl, it, mt = Part(), Part(), Part(False), Part(False), Part()
    h = SHOP_H
    wall.box(-W / 2, -W / 2 + 0.22, -0.34, 0, 0, h)
    wall.box(W / 2 - 0.22, W / 2, -0.34, 0, 0, h)
    wall.box(-W / 2, W / 2, -0.34, 0, 3.62, h)
    wall.box(-W / 2 + 0.22, W / 2 - 0.22, -0.2, 0, 0, 0.06)                     # threshold
    mt.box(-W / 2 + 0.22, W / 2 - 0.22, -0.4, -0.08, 3.36, 3.62)                 # shutter box
    ox0, ox1 = -W / 2 + 0.22, W / 2 - 0.22
    if shutter:
        z = 0.06
        while z < 3.36:
            mt.box(ox0, ox1, -0.13, -0.09, z, z + 0.075)
            mt.box(ox0, ox1, -0.105, -0.085, z + 0.075, z + 0.09)
            z += 0.09
        mt.box(ox0 - 0.03, ox0 + 0.02, -0.16, -0.06, 0.06, 3.36)
        mt.box(ox1 - 0.02, ox1 + 0.03, -0.16, -0.06, 0.06, 3.36)
    else:
        t = 0.05
        y = -0.14
        for x in (ox0, -0.025, ox1 - t):
            fr.box(x, x + t, y - 0.03, y + 0.03, 0.06, 3.36)
        for z in (0.06, 0.55, 2.7, 3.36 - t):
            fr.box(ox0, ox1, y - 0.03, y + 0.03, z, z + t)
        gl.plane(ox0, ox1, 0.06, 3.36, y)
        it.plane(ox0, ox1, 0.0, 3.4, -0.004)
        mt.box(ox0 - 0.03, ox0 + 0.02, -0.16, -0.06, 0.06, 3.36)
        mt.box(ox1 - 0.02, ox1 + 0.03, -0.16, -0.06, 0.06, 3.36)
    wall.finish(f'{name}__wall', grime_material(f'bake_{name}', (0.62, 0.6, 0.58), (0.3, 0.29, 0.28)), e, 0.012)
    mt.finish(f'{name}__shutter', MAT['shutter'], e)
    if not shutter:
        fr.finish(f'{name}__frame', MAT['frame'], e)
        gl.finish(f'{name}__glass', MAT['glass'], e)
        it.finish(f'{name}__interior', MAT['interior'], e)
    return e

def build_ac():
    e = module('ac')
    case, mt = Part(), Part()
    x0, x1, y0, y1, z0, z1 = -0.4, 0.4, -0.06, -0.36, 0.0, 0.56
    case.box(x0, x1, y0, y1, z0, z1)
    # fan grille: rings and spokes proud of the front face
    cx, cz, r = 0.08, 0.28, 0.21
    yf = y1 - 0.012
    for k in range(5):
        rr = r * (k + 1) / 5
        seg = 28
        for i in range(seg):
            a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
            xa, za = cx + rr * math.cos(a0), cz + rr * math.sin(a0)
            xb, zb = cx + rr * math.cos(a1), cz + rr * math.sin(a1)
            mt.box(min(xa, xb) - 0.004, max(xa, xb) + 0.004, yf, yf + 0.01, min(za, zb) - 0.004, max(za, zb) + 0.004)
    for k in range(4):
        a = k * math.pi / 4
        mt.box(cx - r * abs(math.cos(a)) - 0.004, cx + r * abs(math.cos(a)) + 0.004, yf, yf + 0.01, cz - 0.004, cz + 0.004) if k == 0 else None
    mt.box(cx - 0.004, cx + 0.004, yf, yf + 0.01, cz - r, cz + r)
    mt.cyl_y(cx, y1, y1 + 0.05, cz, 0.06, 12)                      # hub
    case.box(x0 + 0.03, x0 + 0.22, y1 - 0.004, y1, 0.06, 0.5)       # side grille panel
    # brackets and pipe to the wall
    for x in (x0 + 0.08, x1 - 0.08):
        mt.box(x - 0.02, x + 0.02, 0.0, y1 - 0.03, -0.06, -0.02)
        mt.box(x - 0.02, x + 0.02, -0.04, 0.0, -0.42, 0.0)
        mt.box(x - 0.012, x + 0.012, -0.03, y1, -0.4, -0.04)       # diagonal stand-in strut
    mt.cyl_y(x0 + 0.1, 0.0, y0, 0.12, 0.02, 8)
    mt.cyl_y(x0 + 0.16, 0.0, y0, 0.12, 0.012, 8)
    case.finish('ac__case', grime_material('bake_ac', (0.85, 0.85, 0.82), (0.55, 0.52, 0.46)), e, 0.02)
    mt.finish('ac__metal', MAT['metal'], e)
    return e

def build_pipe():
    e = module('pipe')
    p = Part()
    p.cyl(0, -0.08, 0, H, 0.05, 10)
    for z in (0.4, 2.2):
        p.box(-0.06, 0.06, -0.14, 0.0, z, z + 0.05)
    p.finish('pipe__metal', MAT['metal'], e)
    return e

modules = [build_window(), build_cage(), build_balcony(False), build_balcony(True), build_bay(),
           build_shop(False), build_shop(True), build_ac(), build_pipe()]
# spread modules out so baking does not see neighbours
for i, m in enumerate(modules):
    m.location = (i * 4.0, 0, 0)

# ───────────────────────── bake grime + AO ─────────────────────────
scn.render.engine = 'CYCLES'
scn.cycles.samples = 48
scn.cycles.use_denoising = False
world = bpy.data.worlds.get('HKKitWorld') or bpy.data.worlds.new('HKKitWorld')
world.use_nodes = True
bg = world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value = (1, 1, 1, 1)
bg.inputs['Strength'].default_value = 1.0
scn.world = world
vl = bpy.context.view_layer

def bake(ob):
    me = ob.data
    vl.objects.active = ob
    for o in scn.collection.all_objects: o.select_set(False)
    ob.select_set(True)
    # apply bevel first so the bake matches the exported mesh
    for md in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)
    if not me.uv_layers:
        me.uv_layers.new(name='UVMap')
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.015)
    bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(ob.name + '_bake', BAKE_SIZE, BAKE_SIZE)
    mat = ob.material_slots[0].material
    nt = mat.node_tree
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = img
    nt.nodes.active = tex
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT', 'COLOR'}, margin=6, use_clear=True)
    path = os.path.join(BAKE_DIR, ob.name + '.png')
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    # swap to a plain textured material for export
    out = bpy.data.materials.new('kit_wall_' + ob.name.split('__')[0])
    out.use_nodes = True
    ont = out.node_tree
    p = ont.nodes.get('Principled BSDF')
    t2 = ont.nodes.new('ShaderNodeTexImage')
    t2.image = bpy.data.images.load(path, check_existing=False)
    ont.links.new(t2.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = 0.9
    ob.material_slots[0].material = out
    log.append(f'baked {ob.name}')

for ob in list(scn.collection.all_objects):
    if ob.type == 'MESH' and (ob.name.endswith('__wall') or ob.name == 'ac__case'):
        bake(ob)

# reset positions for export: every module at the origin
for m in modules:
    m.location = (0, 0, 0)

# ───────────────────────── export ─────────────────────────
for o in scn.collection.all_objects: o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, 'hk_kit.glb'), export_format='GLB', use_selection=True,
    export_apply=True, export_yup=True, use_active_scene=True, export_image_format='JPEG', export_jpeg_quality=88,
)
log.append('exported ' + os.path.join(OUT, 'hk_kit.glb'))
bpy.context.window.scene = prev_scene
print('\n'.join(log))
