# Tabular icebergs + growlers, vertex coloured. Origin at the waterline; the
# submerged mass is modelled too because the camera goes underwater.
c = fresh_collection("AD_Ice")
ice_mat = material("ice", (0.6, 0.8, 0.9), 0.0, 0.35)
random.seed(4)

def fbm(p, oct=4):
    v, a, f = 0.0, 0.5, 1.0
    for _ in range(oct):
        v += a * noise.noise(p * f)
        a *= 0.5
        f *= 2.03
    return v

def paint(o, colfn):
    me = o.data
    attr = me.color_attributes.new("Col", 'FLOAT_COLOR', 'POINT')
    for v in me.vertices:
        attr.data[v.index].color = (*colfn(v.co, v.normal), 1.0)
    me.color_attributes.active_color = attr

def ice_color(co, n, top, seed):
    z = co.z
    k = fbm(co * 0.15 + Vector((seed, 0, 0)), 3)
    snow = Vector((0.9, 0.95, 1.0))
    cliff = Vector((0.4, 0.7, 0.86))
    deep = Vector((0.16, 0.5, 0.78))
    notch = Vector((0.24, 0.66, 0.8))
    under = Vector((0.18, 0.5, 0.66))
    if z < -0.3:
        col = under.lerp(deep, min(1.0, -z / 30.0) * 0.5)
    elif z < 1.2:
        col = notch
    else:
        col = cliff.lerp(deep, max(0.0, -k) * 1.6)
        col = col.lerp(snow, sm(0.8, 0.95, n.z) * sm(top - 1.0, top + 0.3, z))
        col = col.lerp(snow, 0.18 * max(0.0, k) + 0.1 * sm(top - 4, top, z))
    return col

def berg(name, size, H, D, seed, nseg=128, tilt=0.0, dome=0.0):
    """Lofted rings from the keel up to the deck, then a gently undulating top."""
    sx, sy = size
    bm = bmesh.new()
    def outline(a):
        # superellipse (boxy) outline with low-frequency wobble
        ca, sa = math.cos(a), math.sin(a)
        e = 0.5
        r = 1.0 / ((abs(ca) ** (2 / e) + abs(sa) ** (2 / e)) ** (e / 2))
        r *= 1.0 + 0.2 * noise.noise(Vector((ca * 1.3 + seed, sa * 1.3, 0.3))) + 0.08 * noise.noise(Vector((ca * 4 + seed, sa * 4, 1.7))) + 0.025 * noise.noise(Vector((ca * 12 + seed, sa * 12, 4.1)))
        return r * ca * sx * 0.5, r * sa * sy * 0.5
    levels = []
    zs = [-D + D * (i / 14) ** 0.8 for i in range(14)] + [-1.0, -0.3, 0.2, 0.7, 1.2] + [1.2 + (H - 1.2) * (i / 12) for i in range(1, 13)]
    def scale_at(z):
        if z < 0:
            u = -z / D
            return (1.08 + 0.12 * math.sin(u * math.pi)) * (1.0 - 0.55 * u ** 2.2)
        if z < 1.2:
            return 1.0 - 0.035 * math.sin(z / 1.2 * math.pi) * 2.2  # wave-cut notch
        u = (z - 1.2) / (H - 1.2)
        return 1.0 - dome * u ** 1.6 + 0.02 * math.sin(u * math.pi) - 0.05 * sm(0.9, 1.0, u)
    for z in zs:
        s = scale_at(z)
        ring = []
        for i in range(nseg):
            a = 2 * math.pi * i / nseg
            x, y = outline(a)
            p = Vector((x * s, y * s, z))
            d = Vector((x, y, 0)).normalized()
            if z > 1.2:
                strata = 0.1 * math.sin(z * 3.3 + 3 * noise.noise(p * 0.05))
                flute = 0.9 * noise.noise(Vector((a * 22 + seed, z * 0.03, 0))) + 0.4 * noise.noise(Vector((a * 60 + seed, z * 0.1, 2)))
                p += d * (strata + flute + 1.8 * fbm(p * 0.06 + Vector((seed, 0, 0)), 3))
            else:
                p += d * 2.2 * fbm(p * 0.05 + Vector((seed, 4, 0)), 3)
            p.z += tilt * p.x
            ring.append(bm.verts.new(p))
        levels.append(ring)
    for r0, r1 in zip(levels, levels[1:]):
        for i in range(nseg):
            j = (i + 1) % nseg
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    # top: concentric inset rings with a soft rounded rim
    prev = levels[-1]
    top_rings = []
    for k, f in enumerate((0.96, 0.9, 0.78, 0.62, 0.45, 0.28, 0.12)):
        ring = []
        for i in range(nseg):
            q = prev[i].co if k == 0 else top_rings[0][i].co
            base = levels[-1][i].co
            p = Vector((base.x * f, base.y * f, H + tilt * base.x * f))
            p.z += (0.5 if k == 0 else 0.7) + 0.6 * fbm(p * 0.04 + Vector((seed, 9, 0)), 3)
            ring.append(bm.verts.new(p))
        top_rings.append(ring)
        for i in range(nseg):
            j = (i + 1) % nseg
            bm.faces.new((prev[i], prev[j], ring[j], ring[i]))
        prev = ring
    centre = bm.verts.new((0, 0, H + 0.9 + 0.6 * fbm(Vector((seed, 9, 0)))))
    for i in range(nseg):
        bm.faces.new((prev[i], prev[(i + 1) % nseg], centre))
    bot = bm.verts.new((0, 0, -D - 2))
    for i in range(nseg):
        bm.faces.new((levels[0][(i + 1) % nseg], levels[0][i], bot))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = mesh_obj(name, bm, c, [ice_mat], smooth=True)
    VL.update()
    paint(o, lambda co, n: ice_color(co, n, H, seed))
    return o

bergs = [
    berg("BergTabularA", (62, 34), 13, 46, 1.3),
    berg("BergTabularB", (115, 42), 17, 58, 7.1),
    berg("BergBroken", (24, 15), 6.5, 20, 3.7, nseg=96, tilt=0.06),
    berg("BergDome", (40, 30), 21, 55, 9.9, dome=0.45),
]
for k, o in enumerate(bergs):
    o.location.x = k * 160  # spread out so the exported nodes don't overlap; repositioned in three.js

# Growlers / bergy bits: faceted lumps
for k in range(8):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    sd = random.random() * 50
    for v in bm.verts:
        p = v.co.copy()
        v.co = p * (1 + 0.35 * noise.noise(p * 1.4 + Vector((sd, 0, 0))))
        v.co.z = v.co.z * 0.55 + 0.15
        if v.co.z > 0.45:
            v.co.z = 0.45 + (v.co.z - 0.45) * 0.2
    o = mesh_obj("Growler%d" % k, bm, c, [ice_mat], smooth=False)
    s = 1.2 + random.random() * 2.8
    o.scale = (s * (0.8 + random.random() * 0.6), s * (0.8 + random.random() * 0.6), s)
    o.location = (k * 12, -300, 0)
    VL.update()
    paint(o, lambda co, n: Vector((0.85, 0.93, 1.0)).lerp(Vector((0.35, 0.68, 0.85)), sm(0.3, -0.6, n.z) * 0.8 + (0.3 if co.z < 0 else 0)))

export(c, "ice.glb", vc='ACTIVE')
log("verts", sum(len(o.data.vertices) for o in c.objects))
