import bpy, bmesh, math, random, os, contextlib
from mathutils import Vector, Matrix, noise, Euler

# Runs in a headless, factory-startup Blender: start from an empty scene.
SC = bpy.context.scene
VL = bpy.context.view_layer
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
ASSETS = "/Users/rabbi/Desktop/Projects/Experiments/arctic-dive/assets/"
os.makedirs(ASSETS, exist_ok=True)
LOG = []
def log(*a): LOG.append(" ".join(str(x) for x in a))

def ctx(**kw):
    return bpy.context.temp_override(**kw) if kw else contextlib.nullcontext()

def sm(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def fresh_collection(name):
    c = bpy.data.collections.get(name)
    if c is None:
        c = bpy.data.collections.new(name)
        SC.collection.children.link(c)
    elif c.name not in SC.collection.children:
        SC.collection.children.link(c)
    for o in list(c.all_objects):
        bpy.data.objects.remove(o, do_unlink=True)
    return c

def material(name, color, metal=0.0, rough=0.5, emit=None, strength=0.0):
    m = bpy.data.materials.get("AD_" + name) or bpy.data.materials.new("AD_" + name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1.0)
        b.inputs["Emission Strength"].default_value = strength
    return m

def mesh_obj(name, bm, c, mats=(), smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    c.objects.link(o)
    return o

def prim(kind, c, name, mat=None, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), smooth=True, **kw):
    bm = bmesh.new()
    if kind == 'cube':
        bmesh.ops.create_cube(bm, size=1.0)
    elif kind == 'cyl':
        r = kw.get('r', 0.5)
        bmesh.ops.create_cone(bm, cap_ends=True, segments=kw.get('seg', 24), radius1=r, radius2=kw.get('r2', r), depth=kw.get('h', 1.0))
    elif kind == 'sphere':
        bmesh.ops.create_uvsphere(bm, u_segments=kw.get('seg', 24), v_segments=kw.get('rings', 16), radius=kw.get('r', 0.5))
    elif kind == 'torus':
        R, r, su, sv = kw.get('R', 0.3), kw.get('r', 0.05), kw.get('seg', 32), kw.get('seg2', 10)
        verts = [[bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
                  for b in (2 * math.pi * j / sv for j in range(sv))] for a in (2 * math.pi * i / su for i in range(su))]
        for i in range(su):
            for j in range(sv):
                bm.faces.new((verts[i][j], verts[(i + 1) % su][j], verts[(i + 1) % su][(j + 1) % sv], verts[i][(j + 1) % sv]))
    o = mesh_obj(name, bm, c, [mat] if mat else [], smooth)
    o.location, o.rotation_euler, o.scale = loc, rot, scale
    return o

def bevel(o, w, seg=3, limit=True):
    m = o.modifiers.new("Bevel", 'BEVEL')
    m.width, m.segments = w, seg
    m.limit_method = 'ANGLE' if limit else 'NONE'
    return m

def subsurf(o, lv=1):
    m = o.modifiers.new("Subd", 'SUBSURF')
    m.levels = m.render_levels = lv
    return m

def to_mesh(o):
    """Bake an object's evaluated state (curve bevel, modifiers) into a plain mesh object."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    n = bpy.data.objects.new(o.name, me)
    n.matrix_world = o.matrix_world.copy()
    for c in o.users_collection:
        c.objects.link(n)
    bpy.data.objects.remove(o, do_unlink=True)
    return n

def tube(name, pts, r, c, mat, cyclic=False):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth, cu.bevel_resolution, cu.fill_mode = r, 3, 'FULL'
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for p, v in zip(sp.points, pts):
        p.co = (*v, 1.0)
    sp.use_cyclic_u = cyclic
    o = bpy.data.objects.new(name, cu)
    c.objects.link(o)
    cu.materials.append(mat)
    VL.update()
    return to_mesh(o)

def export(c, fname, vc='MATERIAL'):
    with ctx():
        for o in VL.objects:
            o.select_set(False)
        for o in c.all_objects:
            o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=ASSETS + fname, export_format='GLB', use_selection=True, export_apply=True,
                                  export_yup=True, export_animations=False, export_vertex_color=vc,
                                  export_image_format='NONE', export_extras=False)
    log("exported", fname, os.path.getsize(ASSETS + fname), "bytes")
