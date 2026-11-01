# Sea life for instancing: kelp plant, anemone, arctic cod. Each is one
# vertex-coloured mesh so three.js can tint instances. Blender: −Y forward.
mat = material("sealife", (1, 1, 1), 0.0, 0.6)

def finish(name, bm, colfn, fname):
    c = fresh_collection("AD_" + name)
    o = mesh_obj(name, bm, c, [mat], smooth=True)
    VL.update()
    attr = o.data.color_attributes.new("Col", 'FLOAT_COLOR', 'POINT')
    for v in o.data.vertices:
        attr.data[v.index].color = (*colfn(v.co), 1.0)
    o.data.color_attributes.active_color = attr
    export(c, fname, vc='ACTIVE')
    log(name, "verts", len(o.data.vertices))

def ribbon(bm, pts, widths, normals, ruffle, seed):
    """Strip through `pts` with per-point half-width, ruffled at the edges."""
    rows = []
    for i, (p, w, n) in enumerate(zip(pts, widths, normals)):
        row = []
        for j in range(5):
            u = j / 4 * 2 - 1
            edge = abs(u) ** 2
            off = n * (u * w) + Vector((0, 0, 0))
            wav = math.sin(i * 1.7 + seed + u * 2) * ruffle * edge
            row.append(bm.verts.new(p + off + Vector((0, wav, wav * 0.3))))
        rows.append(row)
    for r0, r1 in zip(rows, rows[1:]):
        for j in range(4):
            bm.faces.new((r0[j], r0[j + 1], r1[j + 1], r1[j]))
    # single-sided; rendered double-sided in three.js

# Kelp: holdfast, a slightly wandering stipe (height 1), blades along the upper half
bm = bmesh.new()
random.seed(3)
stipe = [Vector((0.02 * math.sin(i * 0.9), 0.02 * math.cos(i * 0.7), i / 20)) for i in range(21)]
ring_prev = None
for i, p in enumerate(stipe):
    r = 0.012 * (1 - 0.4 * i / 20)
    ring = [bm.verts.new(p + Vector((math.cos(a) * r, math.sin(a) * r, 0))) for a in (2 * math.pi * k / 6 for k in range(6))]
    if ring_prev:
        for k in range(6):
            bm.faces.new((ring_prev[k], ring_prev[(k + 1) % 6], ring[(k + 1) % 6], ring[k]))
    ring_prev = ring
hold = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.05)
for v in hold['verts']:
    v.co.z = v.co.z * 0.4
for b in range(7):
    base = stipe[6 + b * 2]
    ang = b * 2.4
    d = Vector((math.cos(ang), math.sin(ang), 0))
    side = Vector((-d.y, d.x, 0))
    L = 0.35 + random.random() * 0.25
    pts = [base + d * (0.02 + L * 0.35 * (k / 10) ** 0.7) + Vector((0, 0, L * k / 10)) for k in range(11)]
    widths = [0.012 + 0.05 * math.sin(math.pi * min(1.0, k / 10 * 1.1)) for k in range(11)]
    ribbon(bm, pts, widths, [side] * 11, 0.012, b)
finish("Kelp", bm, lambda co: Vector((0.16, 0.13, 0.04)).lerp(Vector((0.42, 0.42, 0.13)), min(1.0, co.z * 1.1)), "kelp.glb")

# Anemone: lathe column, oral disc, ~40 curling tentacles
bm = bmesh.new()
prof = [(0.07, 0.0), (0.085, 0.02), (0.075, 0.08), (0.07, 0.16), (0.09, 0.22), (0.11, 0.25)]
rings = []
for r, z in prof:
    rings.append([bm.verts.new((math.cos(a) * r, math.sin(a) * r, z)) for a in (2 * math.pi * k / 18 for k in range(18))])
for r0, r1 in zip(rings, rings[1:]):
    for k in range(18):
        bm.faces.new((r0[k], r0[(k + 1) % 18], r1[(k + 1) % 18], r1[k]))
top = bm.verts.new((0, 0, 0.245))
for k in range(18):
    bm.faces.new((rings[-1][k], rings[-1][(k + 1) % 18], top))
for t in range(40):
    a = t * 2.399
    rr = 0.035 + 0.07 * ((t % 3) / 2)
    start = Vector((math.cos(a) * rr, math.sin(a) * rr, 0.245))
    out = Vector((math.cos(a), math.sin(a), 0))
    prev = None
    for k in range(7):
        f = k / 6
        p = start + out * (0.07 * f) + Vector((0, 0, 0.09 * math.sin(f * 2.2)))
        r = 0.009 * (1 - f * 0.8)
        ring = [bm.verts.new(p + Vector((math.cos(b) * r, math.sin(b) * r, 0))) for b in (2 * math.pi * m / 5 for m in range(5))]
        if prev:
            for m in range(5):
                bm.faces.new((prev[m], prev[(m + 1) % 5], ring[(m + 1) % 5], ring[m]))
        prev = ring
finish("Anemone", bm, lambda co: Vector((0.55, 0.5, 0.45)) if co.z < 0.24 else Vector((0.95, 0.9, 0.85)).lerp(Vector((1.0, 0.55, 0.45)), min(1.0, (co.z - 0.24) * 8)), "anemone.glb")

# Arctic cod: lofted elliptical body (head at −Y), forked tail, three dorsal fins, pectorals, eyes
bm = bmesh.new()
L = 0.3
secs = []
for i in range(17):
    t = i / 16
    y = -L / 2 + L * t
    h = 0.045 * math.sin(math.pi * min(1.0, t * 1.05)) ** 0.8 + 0.004
    w = h * 0.55
    zc = 0.006 * math.sin(t * math.pi)
    secs.append([bm.verts.new((math.cos(a) * w, y, zc + math.sin(a) * h)) for a in (2 * math.pi * k / 12 for k in range(12))])
for s0, s1 in zip(secs, secs[1:]):
    for k in range(12):
        bm.faces.new((s0[k], s1[k], s1[(k + 1) % 12], s0[(k + 1) % 12]))
nose = bm.verts.new((0, -L / 2 - 0.01, 0.0))
for k in range(12):
    bm.faces.new((secs[0][(k + 1) % 12], secs[0][k], nose))
def fin(pts):
    vs = [bm.verts.new(p) for p in pts]
    bm.faces.new(vs)
    bm.faces.new(list(reversed([bm.verts.new(p) for p in pts])))
yt = L / 2
fin([(0, yt - 0.01, 0.0), (0, yt + 0.06, 0.045), (0, yt + 0.035, 0.0), (0, yt + 0.06, -0.045)])
for y0, y1, hgt in ((-0.06, -0.01, 0.035), (0.0, 0.05, 0.03), (0.06, 0.11, 0.022)):
    fin([(0, y0, 0.038), (0, (y0 + y1) / 2, 0.038 + hgt), (0, y1, 0.03)])
for y0, y1 in ((0.0, 0.05), (0.06, 0.1)):
    fin([(0, y0, -0.036), (0, (y0 + y1) / 2, -0.06), (0, y1, -0.028)])
for sx in (-1, 1):
    fin([(sx * 0.024, -0.07, -0.01), (sx * 0.06, -0.035, -0.02), (sx * 0.026, -0.045, -0.018)])
    eye = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=0.007)
    for v in eye['verts']:
        v.co += Vector((sx * 0.017, -0.115, 0.012))
def cod_color(co):
    if abs(co.x) > 0.014 and co.y < -0.105 and co.z > 0.0 and co.y > -0.125:
        return Vector((0.02, 0.02, 0.02))
    back = Vector((0.2, 0.22, 0.16)); belly = Vector((0.85, 0.85, 0.8))
    k = max(0.0, min(1.0, 0.5 - co.z * 14))
    spot = 0.85 + 0.15 * math.sin(co.y * 140) * math.sin(co.z * 120)
    return back.lerp(belly, k) * spot
finish("Cod", bm, cod_color, "fish.glb")
