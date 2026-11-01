# Distant coastal range: ridged noise heightfield with rock/snow vertex colours.
c = fresh_collection("AD_Mountains")
mat = material("mountain", (0.5, 0.5, 0.5), 0.0, 0.85)
NX, NY, W, Dp = 220, 64, 7000.0, 1500.0
bm = bmesh.new()
grid = []
for j in range(NY + 1):
    row = []
    for i in range(NX + 1):
        x = (i / NX - 0.5) * W
        y = j / NY * Dp
        p = Vector((x / 900.0, y / 900.0, 0.0))
        h = noise.ridged_multi_fractal(p, 0.9, 2.1, 6, 1.0, 2.2) * 0.5
        h += 0.35 * noise.noise(Vector((x / 2600.0, y / 2600.0, 3.0)))
        mask = sm(0.0, 0.32, y / Dp) * (1 - sm(0.75, 1.0, y / Dp)) * (0.55 + 0.45 * sm(-0.3, 0.6, noise.noise(Vector((x / 3000.0, 0, 7.0)))))
        mask *= 1 - sm(0.36, 0.5, abs(i / NX - 0.5))
        z = max(0.0, h) * 620 * mask - 25 * (1 - mask)
        row.append(bm.verts.new((x, y, z)))
    grid.append(row)
for j in range(NY):
    for i in range(NX):
        bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
o = mesh_obj("Mountains", bm, c, [mat], smooth=True)
VL.update()
me = o.data
attr = me.color_attributes.new("Col", 'FLOAT_COLOR', 'POINT')
for v in me.vertices:
    z, nz = v.co.z, v.normal.z
    streak = noise.noise(Vector((v.co.x / 60.0, v.co.y / 60.0, v.co.z / 25.0)))
    snow = sm(0.62, 0.86, nz + 0.12 * streak) * sm(90, 230, z + 60 * streak)
    rock = Vector((0.028, 0.032, 0.038)).lerp(Vector((0.05, 0.052, 0.055)), 0.5 + 0.5 * streak)
    col = rock.lerp(Vector((0.82, 0.87, 0.93)), snow)
    attr.data[v.index].color = (*col, 1.0)
me.color_attributes.active_color = attr
export(c, "mountains.glb", vc='ACTIVE')
log("mountain verts", len(me.vertices))
