"""Shared helpers for the Storm at Sea Blender build scripts: geometry is accumulated per
material in plain lists (three.js coordinates, y up), then turned into one object per
material, AO-baked into a vertex colour layer and exported as a Draco GLB."""
import bpy, bmesh, math
from mathutils import Vector, Matrix

def clamp(x, a, b): return max(a, min(b, x))
def ss(x, a, b): t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def lerp(a, b, t): return a + (b - a) * t

# ------------------------------------------------------------------ mesh accumulation
ACC = {}
def acc(mat):
    if mat not in ACC: ACC[mat] = {'v': [], 'f': [], 's': []}
    return ACC[mat]
def emit(mat, verts, faces, smooth, M=None):
    a = acc(mat); o = len(a['v'])
    a['v'].extend([(M @ Vector(v)) if M else Vector(v) for v in verts])
    for f in faces: a['f'].append([i + o for i in f]); a['s'].append(smooth)
def emit_bm(mat, bm, M=None, smooth=False):
    bm.verts.index_update()
    emit(mat, [v.co.copy() for v in bm.verts], [[v.index for v in f.verts] for f in bm.faces], smooth, M)
    bm.free()

def frameM(o, Tx, Uy, Nz):
    return Matrix(((Tx.x, Uy.x, Nz.x, o.x), (Tx.y, Uy.y, Nz.y, o.y), (Tx.z, Uy.z, Nz.z, o.z), (0, 0, 0, 1)))
def S(sx, sy, sz): return Matrix.Diagonal((sx, sy, sz, 1))
def Tr(x, y, z): return Matrix.Translation((x, y, z))

def box(mat, M, sx, sy, sz, bev=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    if bev > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(bev, sx * 0.45, sy * 0.45, sz * 0.45), segments=1, affect='EDGES', profile=0.5)
    emit_bm(mat, bm, M, False)

def lathe(mat, M, prof, segs=12, smooth=True):
    verts, faces = [], []
    for (r, y) in prof:
        for k in range(segs):
            a = 2 * math.pi * k / segs
            verts.append((r * math.cos(a), y, r * math.sin(a)))
    n = len(prof)
    # profiles may run up or down the axis; close them along the axis and use the winding
    # of that outline so the faces always point away from the solid
    loop = list(prof) + [(0, prof[-1][1]), (0, prof[0][1])]
    area = sum(loop[i][0] * loop[(i + 1) % len(loop)][1] - loop[(i + 1) % len(loop)][0] * loop[i][1] for i in range(len(loop)))
    for i in range(n - 1):
        for k in range(segs):
            a = i * segs + k; b = i * segs + (k + 1) % segs
            faces.append([a, a + segs, b + segs, b] if area >= 0 else [b, b + segs, a + segs, a])
    emit(mat, verts, faces, smooth, M)

def sweep(mat, pts, prof, segs=10, smooth=True, caps=True):
    """Tube along pts. prof(s, theta) -> radius (s = arc length) or a list of (a, b) profile points."""
    n = len(pts)
    if n < 2: return
    s_acc = [0.0]
    for i in range(1, n): s_acc.append(s_acc[-1] + (pts[i] - pts[i - 1]).length)
    t0 = (pts[1] - pts[0]).normalized()
    ref = Vector((0, 1, 0)) if abs(t0.y) < 0.9 else Vector((1, 0, 0))
    nrm = (ref - t0 * ref.dot(t0)).normalized()
    verts, faces = [], []
    ring = len(prof) if isinstance(prof, list) else segs
    for i in range(n):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        nrm = (nrm - t * nrm.dot(t)).normalized(); b = t.cross(nrm)
        for k in range(ring):
            if isinstance(prof, list):
                pa, pb = prof[k]; verts.append(pts[i] + nrm * pa + b * pb)
            else:
                th = 2 * math.pi * k / ring; r = prof(s_acc[i], th)
                verts.append(pts[i] + (nrm * math.cos(th) + b * math.sin(th)) * r)
    for i in range(n - 1):
        for k in range(ring):
            a = i * ring + k; c = i * ring + (k + 1) % ring
            faces.append([a, c, c + ring, a + ring])
    if caps:
        faces.append(list(range(ring))[::-1]); faces.append([(n - 1) * ring + k for k in range(ring)])
    emit(mat, verts, faces, smooth)

def sheet(mat, fn, nu, nv, smooth=True, flip=False):
    verts = [fn(i / nu, j / nv) for j in range(nv + 1) for i in range(nu + 1)]
    faces = []
    for j in range(nv):
        for i in range(nu):
            a = j * (nu + 1) + i; b = a + nu + 1
            faces.append([a, b, b + 1, a + 1] if flip else [a, a + 1, b + 1, b])
    emit(mat, verts, faces, smooth)

MB = {}
def ball(family, p, r, ell=None):
    if family not in MB:
        mb = bpy.data.metaballs.new(family); mb.resolution = 0.04; mb.render_resolution = 0.04
        ob = bpy.data.objects.new(family, mb); bpy.context.scene.collection.objects.link(ob); MB[family] = ob
    el = MB[family].data.elements.new()
    el.co = p; el.radius = r
    if ell:
        el.type = 'ELLIPSOID'; el.size_x, el.size_y, el.size_z = ell
    return el
def bake_metaballs(mat, family):
    ob = MB[family]
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg); me = ev.to_mesh()
    emit(mat, [v.co.copy() for v in me.vertices], [list(p.vertices) for p in me.polygons], True, ob.matrix_world.copy())
    ev.to_mesh_clear()
    bpy.data.objects.remove(ob)


def cable(r0, amp, pitch):
    return lambda s, th: r0 + amp * math.cos(2 * th - s * pitch)
def gadroon(r0, amp, k):
    return lambda s, th: r0 + amp * abs(math.cos(k * th))

def s_len(pts): return sum((pts[i + 1] - pts[i]).length for i in range(len(pts) - 1))

def reset():
    for ob in list(bpy.data.objects): bpy.data.objects.remove(ob)
    ACC.clear(); MB.clear()

def occluder(verts, faces, name='Occluder'):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)

def loft_occluder(P, NS=120, NP=28):
    """Closed hull surface from P(u, hn) -> Vector (half-breadth in z), for AO only."""
    verts, faces = [], []
    ring = [(j / (NP - 1), -1) for j in range(NP - 1, -1, -1)] + [(j / (NP - 1), 1) for j in range(1, NP)]
    R = len(ring)
    for i in range(NS + 1):
        u = i / NS
        for hn, s in ring:
            p = P(u, hn); verts.append((p.x, p.y, p.z * s))
    for i in range(NS):
        for j in range(R - 1):
            a = i * R + j; b = a + R; faces.append([a, b, b + 1, a + 1])
    occluder(verts, faces)

def export(OUT, ao_distance=1.6, samples=48, prefix='FR_'):
    made = []
    for mat, a in ACC.items():
        me = bpy.data.meshes.new(prefix + mat)
        me.from_pydata([tuple(v) for v in a['v']], [], a['f'])
        me.validate(); me.update()
        me.polygons.foreach_set('use_smooth', a['s'][:len(me.polygons)] + [False] * max(0, len(me.polygons) - len(a['s'])))
        attr = me.color_attributes.new('AO', 'BYTE_COLOR', 'POINT')
        me.color_attributes.active_color = attr
        m = bpy.data.materials.new('M_' + mat)
        me.materials.append(m)
        ob = bpy.data.objects.new(prefix + mat, me)
        bpy.context.scene.collection.objects.link(ob)
        made.append(ob)
        print(f'{mat}: {len(me.vertices)} verts, {len(me.polygons)} faces')

    scn = bpy.context.scene
    scn.render.engine = 'CYCLES'
    scn.cycles.device = 'CPU'
    scn.cycles.samples = samples
    if scn.world is None: scn.world = bpy.data.worlds.new('W')
    scn.world.light_settings.distance = ao_distance
    scn.render.bake.target = 'VERTEX_COLORS'
    bpy.ops.object.select_all(action='DESELECT')
    for ob in made: ob.select_set(True)
    bpy.context.view_layer.objects.active = made[0]
    bpy.ops.object.bake(type='AO')

    bpy.ops.object.select_all(action='DESELECT')
    for ob in made: ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True, export_yup=False,
        export_vertex_color='ACTIVE', export_normals=True, export_materials='PLACEHOLDER',
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_color_quantization=8,
    )
    print('exported', OUT)

