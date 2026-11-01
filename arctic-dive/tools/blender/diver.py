# Rigged diver: continuous skin-modifier body + armature with automatic weights,
# rigid gear parented to bones. Blender axes: facing −Y, up +Z, soles at z = 0.
c = fresh_collection("AD_Diver")
M = {
    'suit': material("suit", (0.022, 0.025, 0.03), 0.0, 0.72),
    'panel': material("suitpanel", (0.07, 0.078, 0.088), 0.0, 0.62),
    'glove': material("glove", (0.01, 0.011, 0.012), 0.0, 0.45),
    'orange': material("suitorange", (0.85, 0.2, 0.02), 0.0, 0.5),
    'vest': material("bcd", (0.035, 0.04, 0.047), 0.0, 0.55),
    'skin': material("skin", (0.42, 0.25, 0.17), 0.0, 0.5),
    'glass': material("maskglass", (0.01, 0.02, 0.03), 0.6, 0.04),
    'rubber': material("rubberblk", (0.012, 0.012, 0.013), 0.0, 0.6),
    'steel': material("steel2", (0.7, 0.72, 0.75), 1.0, 0.25),
    'tank': material("divetank", (0.78, 0.5, 0.02), 0.35, 0.28),
    'fin': material("fin", (0.85, 0.62, 0.02), 0.0, 0.42),
}

# --- body skeleton for the Skin modifier: (name, pos, radius x, radius y, parent)
J = [
    ("pelvis", (0, 0.0, 0.97), 0.16, 0.115, None),
    ("waist", (0, 0.004, 1.1), 0.142, 0.102, "pelvis"),
    ("abdomen", (0, 0.0, 1.22), 0.158, 0.11, "waist"),
    ("chest", (0, -0.006, 1.34), 0.175, 0.122, "abdomen"),
    ("upchest", (0, 0.0, 1.44), 0.168, 0.112, "chest"),
    ("neckb", (0, 0.012, 1.52), 0.064, 0.064, "upchest"),
    ("neck", (0, 0.006, 1.58), 0.058, 0.06, "neckb"),
    ("jaw", (0, -0.012, 1.645), 0.084, 0.098, "neck"),
    ("cranium", (0, 0.0, 1.715), 0.094, 0.108, "jaw"),
    ("crown", (0, 0.01, 1.79), 0.066, 0.076, "cranium"),
]
for s in (-1, 1):
    S = "LR"[s > 0]
    J += [
        ("clav" + S, (s * 0.11, 0.0, 1.462), 0.058, 0.058, "upchest"),
        ("shoulder" + S, (s * 0.2, 0.01, 1.44), 0.066, 0.064, "clav" + S),
        ("biceps" + S, (s * 0.214, 0.016, 1.3), 0.058, 0.061, "shoulder" + S),
        ("elbow" + S, (s * 0.224, 0.028, 1.15), 0.045, 0.049, "biceps" + S),
        ("forearm" + S, (s * 0.23, 0.02, 1.06), 0.048, 0.05, "elbow" + S),
        ("wrist" + S, (s * 0.235, 0.0, 0.89), 0.03, 0.026, "forearm" + S),
        ("palm" + S, (s * 0.236, -0.006, 0.83), 0.018, 0.045, "wrist" + S),
        ("fingers" + S, (s * 0.233, -0.012, 0.735), 0.015, 0.038, "palm" + S),
        ("thumb" + S, (s * 0.222, -0.045, 0.85), 0.015, 0.015, "wrist" + S),
        ("thumbtip" + S, (s * 0.214, -0.062, 0.8), 0.012, 0.012, "thumb" + S),
        ("hip" + S, (s * 0.095, 0.0, 0.915), 0.09, 0.096, "pelvis"),
        ("thigh" + S, (s * 0.1, -0.006, 0.73), 0.076, 0.081, "hip" + S),
        ("knee" + S, (s * 0.1, -0.012, 0.5), 0.054, 0.059, "thigh" + S),
        ("calf" + S, (s * 0.1, 0.016, 0.38), 0.058, 0.062, "knee" + S),
        ("ankle" + S, (s * 0.1, 0.01, 0.1), 0.035, 0.038, "calf" + S),
        ("foot" + S, (s * 0.1, -0.11, 0.045), 0.04, 0.03, "ankle" + S),
        ("toe" + S, (s * 0.1, -0.19, 0.035), 0.034, 0.022, "foot" + S),
    ]
idx = {n: i for i, (n, *_r) in enumerate(J)}
me = bpy.data.meshes.new("DiverSkel")
me.from_pydata([p for _, p, *_r in J], [(idx[par], i) for i, (_, _, _, _, par) in enumerate(J) if par], [])
skel = bpy.data.objects.new("DiverBody", me)
c.objects.link(skel)
sk = skel.modifiers.new("Skin", 'SKIN')
sk.branch_smoothing = 0.35
for i, (_, _, rx, ry, par) in enumerate(J):
    d = me.skin_vertices[0].data[i]
    d.radius = (rx, ry)
    d.use_root = par is None
subsurf(skel, 2)
VL.update()
body = to_mesh(skel)
body.name = "DiverBody"
for p in body.data.polygons:
    p.use_smooth = True
for m in ('suit', 'panel', 'glove', 'orange'):
    body.data.materials.append(M[m])
for p in body.data.polygons:
    x, y, z = p.center
    nx, ny, nz = p.normal
    ax = abs(x)
    mi = 0
    if (ax > 0.205 and 0.66 < z < 0.895) or z < 0.13:
        mi = 2
    elif ax > 0.17 and 1.31 < z < 1.35:
        mi = 3
    elif (0.43 < z < 0.58 and ny < -0.35 and ax < 0.2) or (1.1 < z < 1.21 and ny > 0.2 and ax > 0.18) \
            or (z > 1.38 and ax > 0.12 and nz > 0.35 and z < 1.5) or (0.86 < z < 1.02 and ny > 0.45):
        mi = 1
    p.material_index = mi
log("body verts", len(body.data.vertices), "faces", len(body.data.polygons))

# --- armature
B = {
    "pelvis": ((0, 0, 0.93), (0, 0, 1.08), None),
    "spine": ((0, 0, 1.08), (0, 0, 1.26), "pelvis"),
    "chest": ((0, 0, 1.26), (0, 0.005, 1.5), "spine"),
    "neck": ((0, 0.005, 1.5), (0, 0, 1.62), "chest"),
    "head": ((0, 0, 1.62), (0, 0, 1.82), "neck"),
}
for s in (-1, 1):
    S = "LR"[s > 0]
    B.update({
        "clavicle" + S: ((s * 0.03, 0, 1.46), (s * 0.19, 0.01, 1.44), "chest"),
        "upperarm" + S: ((s * 0.2, 0.01, 1.44), (s * 0.224, 0.028, 1.15), "clavicle" + S),
        "forearm" + S: ((s * 0.224, 0.028, 1.15), (s * 0.235, 0.0, 0.89), "upperarm" + S),
        "hand" + S: ((s * 0.235, 0.0, 0.89), (s * 0.233, -0.012, 0.73), "forearm" + S),
        "thigh" + S: ((s * 0.095, 0, 0.92), (s * 0.1, -0.012, 0.5), "pelvis"),
        "shin" + S: ((s * 0.1, -0.012, 0.5), (s * 0.1, 0.01, 0.1), "thigh" + S),
        "foot" + S: ((s * 0.1, 0.01, 0.1), (s * 0.1, -0.17, 0.035), "shin" + S),
    })
ad = bpy.data.armatures.new("DiverRig")
arm = bpy.data.objects.new("DiverRig", ad)
c.objects.link(arm)
VL.objects.active = arm
arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, (h, t, par) in B.items():
    eb = ad.edit_bones.new(name)
    eb.head, eb.tail = h, t
for name, (h, t, par) in B.items():
    if par:
        ad.edit_bones[name].parent = ad.edit_bones[par]
bpy.ops.object.mode_set(mode='OBJECT')

for o in VL.objects:
    o.select_set(False)
body.select_set(True)
arm.select_set(True)
VL.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
unweighted = sum(1 for v in body.data.vertices if not any(g.weight > 0.01 for g in v.groups))
log("unweighted verts", unweighted)

# --- BCD vest: a thickened copy of the torso band, deformed by the same weights
vest = body.copy()
vest.data = body.data.copy()
vest.name = "BCD"
c.objects.link(vest)
bm = bmesh.new()
bm.from_mesh(vest.data)
kill = [f for f in bm.faces if not (1.1 < f.calc_center_median().z < 1.47 and abs(f.calc_center_median().x) < 0.172)]
bmesh.ops.delete(bm, geom=kill, context='FACES')
bm.to_mesh(vest.data)
bm.free()
vest.data.materials.clear()
vest.data.materials.append(M['vest'])
for p in vest.data.polygons:
    p.material_index = 0
so = vest.modifiers.new("Solid", 'SOLIDIFY')
so.thickness, so.offset = 0.02, 1.0
with ctx(object=vest, active_object=vest):
    bpy.ops.object.modifier_move_to_index(modifier="Solid", index=0)
    bpy.ops.object.modifier_apply(modifier="Solid")

# --- rigid gear
def attach(o, bone):
    VL.update()
    mw = o.matrix_world.copy()
    o.parent, o.parent_type, o.parent_bone = arm, 'BONE', bone
    VL.update()
    o.matrix_world = mw
    return o

R90 = (math.pi / 2, 0, 0)
attach(prim('sphere', c, "Face", M['skin'], (0, -0.072, 1.675), scale=(0.068, 0.046, 0.08), r=1, seg=24, rings=16), "head")
attach(prim('sphere', c, "MaskLens", M['glass'], (0, -0.112, 1.706), scale=(0.074, 0.024, 0.04), r=1, seg=28, rings=14), "head")
attach(prim('torus', c, "MaskFrame", M['rubber'], (0, -0.106, 1.706), R90, (1.25, 1, 0.66), R=0.059, r=0.01, seg=36, seg2=8), "head")
attach(prim('sphere', c, "MaskNose", M['rubber'], (0, -0.118, 1.672), scale=(0.024, 0.02, 0.022), r=1, seg=12, rings=8), "head")
attach(prim('torus', c, "MaskStrap", M['rubber'], (0, 0.0, 1.71), (0.12, 0, 0), (1.0, 1.13, 1), R=0.098, r=0.008, seg=40, seg2=6), "head")
attach(prim('cyl', c, "Regulator", M['rubber'], (0, -0.128, 1.642), R90, r=0.024, r2=0.028, h=0.05, seg=18), "head")
attach(prim('cyl', c, "RegPurge", M['steel'], (0, -0.155, 1.642), R90, r=0.019, h=0.008, seg=18), "head")
attach(prim('cube', c, "RegExhaust", M['rubber'], (0, -0.126, 1.615), scale=(0.075, 0.025, 0.018)), "head")
attach(prim('torus', c, "NeckSeal", M['rubber'], (0, 0.008, 1.52), scale=(1, 0.95, 1), R=0.063, r=0.012, seg=28, seg2=6), "neck")

attach(prim('cyl', c, "Tank", M['tank'], (0, 0.215, 1.2), r=0.088, h=0.6, seg=24), "chest")
attach(prim('sphere', c, "TankDome", M['tank'], (0, 0.215, 1.5), r=0.088, seg=24, rings=12), "chest")
attach(prim('cyl', c, "TankValve", M['steel'], (0, 0.215, 1.6), r=0.024, h=0.07, seg=10), "chest")
attach(prim('cyl', c, "FirstStage", M['steel'], (0, 0.215, 1.645), (0, math.pi / 2, 0), r=0.026, h=0.09, seg=12), "chest")
for z in (1.05, 1.32):
    attach(prim('torus', c, "TankBand", M['rubber'], (0, 0.215, z), R=0.09, r=0.009, seg=28, seg2=6), "chest")
attach(prim('cube', c, "Backplate", M['rubber'], (0, 0.14, 1.27), scale=(0.2, 0.015, 0.4)), "chest")
hose = tube("RegHose", [(0.04, 0.215, 1.645), (0.13, 0.17, 1.66), (0.17, 0.02, 1.62), (0.12, -0.09, 1.6), (0.04, -0.13, 1.63)], 0.011, c, M['rubber'])
attach(hose, "chest")
gauge = tube("GaugeHose", [(-0.04, 0.215, 1.645), (-0.16, 0.18, 1.55), (-0.19, 0.06, 1.3), (-0.17, -0.06, 1.12), (-0.13, -0.12, 1.06)], 0.009, c, M['rubber'])
attach(gauge, "chest")
attach(prim('cyl', c, "Console", M['rubber'], (-0.13, -0.135, 1.03), R90, r=0.035, h=0.03, seg=16), "chest")
belt = prim('torus', c, "WeightBelt", M['rubber'], (0, 0.0, 1.0), scale=(1.0, 0.72, 1), R=0.163, r=0.018, seg=40, seg2=8)
attach(belt, "pelvis")
attach(prim('cube', c, "Buckle", M['steel'], (0, -0.13, 1.0), scale=(0.07, 0.015, 0.045)), "pelvis")
for x in (-0.11, 0.11):
    attach(prim('cube', c, "Weight", M['steel'], (x, -0.1, 1.0), (0, 0, x * 4), scale=(0.06, 0.03, 0.05)), "pelvis")
attach(prim('cube', c, "DiveComputer", M['rubber'], (-0.255, -0.005, 0.95), scale=(0.02, 0.045, 0.05)), "forearmL")
attach(prim('cube', c, "Knife", M['rubber'], (0.15, -0.01, 0.33), scale=(0.025, 0.03, 0.16)), "shinR")
attach(prim('cube', c, "KnifeGrip", M['orange'], (0.15, -0.01, 0.44), scale=(0.022, 0.028, 0.06)), "shinR")

# Boots and fins on the foot bones
fin_shape = [(-0.055, 0.0), (0.055, 0.0), (0.09, -0.2), (0.118, -0.42), (0.115, -0.56), (0.03, -0.53), (0.0, -0.5),
             (-0.03, -0.53), (-0.115, -0.56), (-0.118, -0.42), (-0.09, -0.2)]
for s in (-1, 1):
    S = "LR"[s > 0]
    boot = prim('sphere', c, "Boot" + S, M['rubber'], (s * 0.1, -0.06, 0.06), scale=(0.055, 0.14, 0.06), r=1, seg=24, rings=14)
    attach(boot, "foot" + S)
    bm = bmesh.new()
    top = [bm.verts.new((s * 0.1 + x, y - 0.06, 0.035)) for x, y in fin_shape]
    bot = [bm.verts.new((s * 0.1 + x, y - 0.06, 0.02)) for x, y in fin_shape]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    for i in range(len(top)):
        j = (i + 1) % len(top)
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    blade = mesh_obj("Fin" + S, bm, c, [M['fin']], smooth=False)
    attach(blade, "foot" + S)
    for dx in (-0.1, 0.1):
        rail = prim('cube', c, "FinRail" + S, M['rubber'], (s * 0.1 + dx * 1.05, -0.33, 0.03), (0, 0, -dx * 0.18), scale=(0.012, 0.5, 0.025))
        attach(rail, "foot" + S)


# Extra gear: octopus, inflator hose, harness, drysuit zip, face seal, fin heel straps
M['yellowhose'] = material("octohose", (0.8, 0.55, 0.02), 0.0, 0.45)
octo = tube("OctoHose", [(-0.03, 0.215, 1.64), (-0.15, 0.16, 1.6), (-0.2, 0.0, 1.45), (-0.14, -0.13, 1.33), (-0.06, -0.16, 1.3)], 0.01, c, M['yellowhose'])
attach(octo, "chest")
attach(prim('cyl', c, "Octopus", M['yellowhose'], (-0.05, -0.17, 1.3), (math.pi / 2, 0, 0), r=0.024, r2=0.028, h=0.045, seg=16), "chest")
attach(prim('cyl', c, "OctoPurge", M['rubber'], (-0.05, -0.195, 1.3), (math.pi / 2, 0, 0), r=0.019, h=0.008, seg=16), "chest")
infl_pts = [(-0.17, 0.08, 1.5), (-0.2, -0.02, 1.47), (-0.19, -0.11, 1.38), (-0.16, -0.15, 1.25), (-0.14, -0.16, 1.18)]
attach(tube("InflatorHose", infl_pts, 0.014, c, M['rubber']), "chest")
for k in range(1, 12):
    t = k / 12
    i = min(int(t * (len(infl_pts) - 1)), len(infl_pts) - 2)
    f = t * (len(infl_pts) - 1) - i
    a, b = Vector(infl_pts[i]), Vector(infl_pts[i + 1])
    pnt = a.lerp(b, f)
    ring = prim('torus', c, "InflatorRib", M['rubber'], tuple(pnt), scale=(1, 1, 1), R=0.015, r=0.004, seg=12, seg2=5)
    ring.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    attach(ring, "chest")
attach(prim('cube', c, "InflatorValve", M['steel'], (-0.14, -0.165, 1.16), scale=(0.035, 0.03, 0.05)), "chest")
for sx in (-1, 1):
    strap = tube("ShoulderStrap", [(sx * 0.1, 0.15, 1.2), (sx * 0.13, 0.13, 1.42), (sx * 0.14, 0.02, 1.49), (sx * 0.13, -0.11, 1.42), (sx * 0.1, -0.15, 1.2)], 0.013, c, M['rubber'])
    attach(strap, "chest")
attach(tube("ChestStrap", [(-0.12, -0.148, 1.33), (0.0, -0.158, 1.33), (0.12, -0.148, 1.33)], 0.011, c, M['rubber']), "chest")
attach(prim('cube', c, "ChestBuckle", M['steel'], (0, -0.162, 1.33), scale=(0.05, 0.012, 0.03)), "chest")
attach(tube("DryZip", [(0.15, -0.115, 1.45), (0.06, -0.14, 1.3), (-0.03, -0.142, 1.18), (-0.1, -0.128, 1.08)], 0.0045, c, M['steel']), "chest")
seal = prim('torus', c, "FaceSeal", M['rubber'], (0, -0.098, 1.672), (math.pi / 2, 0, 0), (0.88, 1.25, 1), R=0.066, r=0.008, seg=36, seg2=6)
attach(seal, "head")
for sx in (-1, 1):
    S = "LR"[sx > 0]
    heel = prim('torus', c, "FinStrap" + S, M['rubber'], (sx * 0.1, 0.03, 0.07), (0.3, math.pi / 2, 0), (1, 1, 1.25), R=0.055, r=0.009, seg=24, seg2=6)
    attach(heel, "foot" + S)

export(c, "diver.glb")
log("bones", len(ad.bones))
