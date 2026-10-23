# [isyarat-3d-v1] Avatar penanda (signer) untuk slide Bahasa Isyarat.
#
# Jalankan:
#   Blender -b --factory-startup --python avatar.py -- <out.blend>
#
# Dua tokoh (pria jaket cokelat + wanita sweter pink, mengikuti foto referensi
# owner) dengan KERANGKA IDENTIK — nama & orientasi tulang sama persis, jadi klip
# gerak yang dipanggang untuk satu tokoh bisa diputar di tokoh lain (three.js
# mengikat trek lewat nama tulang).
#
# Konvensi: satuan meter, Z ke atas, tokoh menghadap -Y. Tangan kanan tokoh di -X.
# Tulang jari: sumbu Y = arah ruas, sumbu Z = arah telapak (align_roll), jadi
# rotasi +X = menekuk ke telapak, rotasi Z = merenggang.

import bpy, bmesh, math, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/avatar.blend"

def srgb(h):
    h = h.lstrip("#")
    return tuple(((int(h[i:i + 2], 16) / 255.0) ** 2.2) for i in (0, 2, 4)) + (1.0,)

def bersihkan():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ── Kerangka ────────────────────────────────────────────────────────────────

V = Vector
SHOULDER_Z = 1.415

def norm(v):
    v = V(v); v.normalize(); return v

# Panjang ruas (meter)
UPPER, FORE, PALM = 0.28, 0.255, 0.088

def lengan(side):
    """Posisi istirahat lengan (A-pose). side = +1 kiri (+X), -1 kanan (-X)."""
    s = side
    clav0 = V((0.02 * s, 0.0, 1.400))
    sh = V((0.175 * s, 0.012, SHOULDER_Z))
    dA = norm((0.55 * s, 0.03, -0.83))
    el = sh + dA * UPPER
    dF = norm((0.40 * s, -0.22, -0.89))
    wr = el + dF * FORE
    dH = dF
    # Telapak menghadap badan (medial) di posisi istirahat.
    med = V((-s, 0, 0))
    n0 = norm(med - dH * med.dot(dH))
    return clav0, sh, el, wr, dH, n0

# Jari: (nama, geser lateral ke arah ibu jari, pos-Y buku jari, sudut renggang°, [panjang ruas], jari-jari)
JARI = [
    ("index",  0.0275, 0.086,  4.0, [0.041, 0.025, 0.021], 0.0106),
    ("middle", 0.0090, 0.090,  0.5, [0.046, 0.028, 0.022], 0.0110),
    ("ring",  -0.0095, 0.086, -3.5, [0.042, 0.027, 0.021], 0.0104),
    ("pinky", -0.0270, 0.078, -8.0, [0.033, 0.020, 0.018], 0.0092),
]
THUMB = [0.040, 0.032, 0.027]
THUMB_R = 0.0115

def bingkai_tangan(side):
    clav0, sh, el, wr, dH, n0 = lengan(side)
    Y = dH
    Z = n0
    X = Y.cross(Z)
    t = 1.0 if side < 0 else -1.0   # +X = sisi ibu jari untuk tangan kanan
    return wr, X, Y, Z, t

def bangun_rig(nama):
    arm = bpy.data.armatures.new(nama)
    ob = bpy.data.objects.new(nama, arm)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.edit_bones

    def tulang(n, h, t, parent=None, roll_z=None, connect=False):
        b = eb.new(n)
        b.head, b.tail = V(h), V(t)
        if roll_z is not None:
            b.align_roll(V(roll_z))
        else:
            b.align_roll(V((0, -1, 0)) if abs(norm(V(t) - V(h)).y) < 0.9 else V((0, 0, 1)))
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
        return b

    tulang("hips", (0, 0, 0.93), (0, 0, 1.06))
    tulang("spine", (0, 0, 1.06), (0, 0, 1.22), "hips", connect=True)
    tulang("chest", (0, 0, 1.22), (0, 0, 1.40), "spine", connect=True)
    tulang("neck", (0, 0, 1.43), (0, -0.008, 1.525), "chest")
    tulang("head", (0, -0.008, 1.525), (0, -0.008, 1.76), "neck", connect=True)
    for s, sfx in ((1, "L"), (-1, "R")):
        tulang(f"brow_{sfx}", (0.036 * s, -0.112, 1.672), (0.036 * s, -0.135, 1.672), "head", roll_z=(0, 0, 1))
        tulang(f"eye_{sfx}", (0.037 * s, -0.093, 1.628), (0.037 * s, -0.12, 1.628), "head", roll_z=(0, 0, 1))
    tulang("mouth", (0, -0.104, 1.552), (0, -0.13, 1.552), "head", roll_z=(0, 0, 1))

    for s, sfx in ((1, "L"), (-1, "R")):
        clav0, sh, el, wr, dH, n0 = lengan(s)
        tulang(f"clavicle_{sfx}", clav0, sh, "chest", roll_z=(0, 0, 1))
        # Siku menekuk ke belakang: roll Z = arah depan lengan.
        tulang(f"upperarm_{sfx}", sh, el, f"clavicle_{sfx}", roll_z=(0, -1, 0), connect=True)
        tulang(f"forearm_{sfx}", el, wr, f"upperarm_{sfx}", roll_z=(0, -1, 0), connect=True)
        wr_, X, Y, Z, t = bingkai_tangan(s)
        tulang(f"hand_{sfx}", wr, wr + Y * PALM * 0.62, f"forearm_{sfx}", roll_z=Z, connect=True)
        for (fn, lat, ky, spr, lens, r) in JARI:
            base = wr + X * (lat * t) + Y * ky
            d = norm(Y * math.cos(math.radians(spr)) + X * (t * math.sin(math.radians(spr))))
            # Pangkal ruas di dalam telapak (metakarpal) tidak dianimasikan; ruas jari mulai di buku jari.
            prev = f"hand_{sfx}"
            p = base
            for i, L in enumerate(lens):
                q = p + d * L
                tulang(f"{fn}{i + 1}_{sfx}", p, q, prev, roll_z=Z, connect=(i > 0))
                prev = f"{fn}{i + 1}_{sfx}"
                p = q
        # Ibu jari
        cmc = wr + X * (0.020 * t) + Y * 0.018 + Z * 0.010
        dT = norm(X * (0.62 * t) + Y * 0.72 + Z * 0.30)
        zT = norm(Z * 0.35 - X * (0.94 * t))      # tekuk ibu jari = menyeberang ke telapak
        zT = norm(zT - dT * zT.dot(dT))
        p = cmc
        prev = f"hand_{sfx}"
        dd = dT
        for i, L in enumerate(THUMB):
            q = p + dd * L
            tulang(f"thumb{i + 1}_{sfx}", p, q, prev, roll_z=zT, connect=(i > 0))
            prev = f"thumb{i + 1}_{sfx}"
            p = q
            dd = norm(dd + Y * 0.10)
    bpy.ops.object.mode_set(mode="OBJECT")
    return ob

# ── Geometri ────────────────────────────────────────────────────────────────

def mesh_dari_bm(bm, nama):
    me = bpy.data.meshes.new(nama)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nama, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob

def bola(nama, c, r, seg=24, ring=16, skala=(1, 1, 1), mat=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    for v in bm.verts:
        v.co = V((v.co.x * r * skala[0], v.co.y * r * skala[1], v.co.z * r * skala[2])) + V(c)
    ob = mesh_dari_bm(bm, nama)
    if mat: ob.data.materials.append(mat)
    return ob

def kapsul(nama, a, b, r1, r2=None, seg=16, ring=10, mat=None, roll=None):
    """Kapsul meruncing dari titik a (jari-jari r1) ke b (r2): dua belahan bola
    yang tersambung — sambungan antarruas tertutup bola pada titik sendinya."""
    r2 = r1 if r2 is None else r2
    a, b = V(a), V(b)
    L = (b - a).length
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        if y > 1e-6:
            # belahan ujung
            v.co = V((x * r2, y * r2 + L, z * r2))
        else:
            v.co = V((x * r1, y * r1, z * r1))
    d = (b - a).normalized()
    up = V(roll) if roll is not None else (V((0, 0, 1)) if abs(d.z) < 0.9 else V((1, 0, 0)))
    xa = d.cross(up).normalized()
    za = xa.cross(d).normalized()
    M = Matrix((xa, d, za)).transposed()
    for v in bm.verts:
        v.co = M @ v.co + a
    ob = mesh_dari_bm(bm, nama)
    if mat: ob.data.materials.append(mat)
    return ob

def superelips(nama, c, ukuran, e=0.45, seg=24, ring=16, M=None, mat=None):
    """Kotak membulat (telapak) — bola yang 'dipersegikan'."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    for v in bm.verts:
        p = [math.copysign(abs(k) ** e, k) for k in v.co]
        v.co = V((p[0] * ukuran[0], p[1] * ukuran[1], p[2] * ukuran[2]))
        if M is not None:
            v.co = M @ v.co
        v.co += V(c)
    ob = mesh_dari_bm(bm, nama)
    if mat: ob.data.materials.append(mat)
    return ob

def mat_baru(nama, warna, kasar=0.6):
    m = bpy.data.materials.new(nama)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb(warna)
    bsdf.inputs["Roughness"].default_value = kasar
    m.diffuse_color = srgb(warna)
    return m

# ── Badan (Skin modifier → subdivisi → bobot dari jarak ke tulang) ──────────

def badan(nama, tk, mats):
    me = bpy.data.meshes.new(nama)
    ob = bpy.data.objects.new(nama, me)
    bpy.context.scene.collection.objects.link(ob)
    titik, sisi, rad = [], [], []

    def t(p, rx, ry=None):
        titik.append(V(p)); rad.append((rx, ry if ry is not None else rx)); return len(titik) - 1

    w = tk["lebar"]
    hz = t((0, 0.008, 0.70), 0.165 * w, 0.112)
    h0 = t((0, 0.005, 0.90), 0.165 * w, 0.112)
    h1 = t((0, 0.005, 1.05), 0.160 * w, 0.110)
    h2 = t((0, 0.000, 1.20), 0.172 * w, 0.118)
    h3 = t((0, 0.002, 1.32), 0.182 * w, 0.120)
    h4 = t((0, 0.010, 1.400), 0.150 * w, 0.100)
    n0 = t((0, 0.012, 1.445), 0.056, 0.054)
    n1 = t((0, 0.000, 1.535), 0.048, 0.050)
    sisi += [(hz, h0), (h0, h1), (h1, h2), (h2, h3), (h3, h4), (h4, n0), (n0, n1)]
    for s in (1, -1):
        clav0, sh, el, wr, dH, n = lengan(s)
        bahu = t(sh + V((-0.005 * s, 0, -0.016)), 0.066 * tk["lengan"], 0.062 * tk["lengan"])
        sisi.append((h4, bahu))
        prev = bahu
        for k in (0.33, 0.66):
            i = t(sh.lerp(el, k), (0.058 - 0.006 * k) * tk["lengan"], (0.056 - 0.006 * k) * tk["lengan"]); sisi.append((prev, i)); prev = i
        e = t(el, 0.048 * tk["lengan"]); sisi.append((prev, e)); prev = e
        for k in (0.35, 0.72):
            i = t(el.lerp(wr, k), (0.047 - 0.005 * k) * tk["lengan"], (0.045 - 0.007 * k) * tk["lengan"]); sisi.append((prev, i)); prev = i
        # Ujung lengan baju sedikit melewati pergelangan
        c = t(wr + dH * 0.004, 0.040 * tk["lengan"], 0.036 * tk["lengan"]); sisi.append((prev, c))
    me.from_pydata([tuple(p) for p in titik], sisi, [])
    sk = ob.modifiers.new("Skin", "SKIN")
    sk.use_smooth_shade = True
    for i, (rx, ry) in enumerate(rad):
        me.skin_vertices[0].data[i].radius = (rx, ry)
    me.skin_vertices[0].data[hz].use_root = True
    sub = ob.modifiers.new("Sub", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 2
    bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    # Material per muka: leher = kulit, dada depan = kaus dalam (kalau ada)
    ob.data.materials.append(mats["atas"])
    ob.data.materials.append(mats["kulit"])
    if "dalam" in mats:
        ob.data.materials.append(mats["dalam"])
    for f in ob.data.polygons:
        c = f.center
        if c.z > tk["leher_z"] and abs(c.x) < 0.062:
            f.material_index = 1
        elif "dalam" in mats and c.y < -0.04 and c.z > 1.08 and abs(c.x) < 0.045 + (c.z - 1.08) * 0.12 and c.z < 1.43:
            f.material_index = 2
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

# ── Kepala ──────────────────────────────────────────────────────────────────

HC = V((0, -0.012, 1.615))   # pusat kepala

def kepala(tk, mats, bagian):
    kulit = mats["kulit"]
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=28, radius=1.0)
    for v in bm.verts:
        x, y, z = v.co
        # Rahang menyempit ke dagu, pipi sedikit penuh
        sx = 0.098 * (1.0 - 0.28 * max(0.0, -z) ** 1.6)
        sy = 0.108 * (1.0 - 0.10 * max(0.0, -z))
        sz = 0.128
        yy = y * sy
        if y < 0 and z < 0:     # dagu sedikit maju
            yy -= 0.010 * (-z) * (-y)
        v.co = V((x * sx, yy, z * sz)) + HC
    ob = mesh_dari_bm(bm, "kepala")
    ob.data.materials.append(kulit)
    bagian.append((ob, "head"))
    # Telinga
    for s in (1, -1):
        e = bola(f"telinga{s}", HC + V((0.097 * s, 0.008, -0.002)), 0.026, skala=(0.45, 0.75, 1.25), mat=kulit, seg=16, ring=12)
        bagian.append((e, "head"))
    # Hidung
    bagian.append((bola("hidung", HC + V((0, -0.106, -0.016)), 0.0155, skala=(1.05, 0.85, 0.9), mat=kulit), "head"))
    bagian.append((kapsul("hidung2", HC + V((0, -0.100, 0.022)), HC + V((0, -0.108, -0.010)), 0.0075, 0.0105, mat=kulit), "head"))
    for s in (1, -1):
        bagian.append((bola(f"cuping{s}", HC + V((0.012 * s, -0.100, -0.020)), 0.0085, mat=kulit, seg=12, ring=8), "head"))
    # Mata (putih + iris + kilau)
    for s, sfx in ((1, "L"), (-1, "R")):
        c = HC + V((0.037 * s, -0.083, 0.013))
        bagian.append((bola(f"sklera{sfx}", c, 0.0185, skala=(1.15, 0.8, 0.95), mat=mats["putih_mata"]), f"eye_{sfx}"))
        bagian.append((bola(f"iris{sfx}", c + V((0, -0.0125, 0)), 0.0115, skala=(1, 0.45, 1), mat=mats["iris"]), f"eye_{sfx}"))
        bagian.append((bola(f"kilau{sfx}", c + V((0.004 * s - 0.002, -0.0165, 0.004)), 0.0025, skala=(1, 0.5, 1), mat=mats["putih_mata"], seg=8, ring=6), f"eye_{sfx}"))
        # Alis: kapsul melengkung tipis
        a = HC + V((0.016 * s, -0.103, 0.044))
        b = HC + V((0.060 * s, -0.088, 0.046))
        bagian.append((kapsul(f"alis{sfx}", a, b, tk["alis"], tk["alis"] * 0.7, mat=mats["rambut"], seg=10, ring=8), f"brow_{sfx}"))
    # Mulut: senyum = busur halus (5 ruas kapsul)
    pts = []
    for i in range(6):
        u = -1 + 2 * i / 5
        pts.append(HC + V((0.030 * u, -0.104 + 0.012 * u * u, -0.066 + 0.009 * u * u)))
    for i in range(5):
        r1 = 0.0040 + 0.0012 * (1 - abs(-1 + 2 * i / 5))
        r2 = 0.0040 + 0.0012 * (1 - abs(-1 + 2 * (i + 1) / 5))
        bagian.append((kapsul(f"mulut{i}", pts[i], pts[i + 1], r1, r2, mat=mats["bibir"], seg=10, ring=8), "mouth"))
    # Rambut
    rambut(tk, mats, bagian)
    if tk.get("jenggot"):
        jenggot(mats, bagian)
    if tk.get("anting"):
        for s in (1, -1):
            bagian.append((bola(f"anting{s}", HC + V((0.098 * s, -0.004, -0.034)), 0.0055, mat=mats["mutiara"], seg=12, ring=8), "head"))

def cangkang(nama, skala, saring, geser=None, mat=None, seg=48, ring=32, tebal=0.0):
    """Cangkang di sekitar kepala, hanya muka yang lolos `saring(arah)`."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    hapus = [f for f in bm.faces if not saring(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=hapus, context="FACES")
    for v in bm.verts:
        x, y, z = v.co
        d = V((x, y, z))
        g = geser(d) if geser else 0.0
        v.co = V((x * skala[0] * (1 + g), y * skala[1] * (1 + g), z * skala[2] * (1 + g))) + HC
    ob = mesh_dari_bm(bm, nama)
    if tebal:
        so = ob.modifiers.new("tebal", "SOLIDIFY")
        so.thickness = tebal
        so.offset = 1
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier="tebal")
    if mat: ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def acak(x, y, z, k=11.0):
    return (math.sin(x * k + 1.3) * math.cos(y * k * 1.2 + 0.7) + math.sin(z * k * 0.9 + 2.1) * math.cos(x * k * 0.8)) * 0.5

def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def lerp(a, b, t): return a + (b - a) * t

def cangkang_masker(nama, skala, masker, tinggi, mat, seg=96, ring=64):
    """Cangkang kepala: area masker=1 menonjol setinggi `tinggi`, masker=0
    tenggelam ke dalam kepala — tepinya muncul mulus dari kulit (tanpa gerigi)."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0)
    m = {}
    for v in bm.verts:
        d = v.co.copy()
        m[v.index] = masker(d)
    hapus = [f for f in bm.faces if max(m[v.index] for v in f.verts) < 0.002]
    for v in bm.verts:
        d = v.co.copy()
        k = m[v.index]
        off = tinggi(d) * k - 0.035 * (1 - k)
        v.co = V((d.x * skala[0] * (1 + off), d.y * skala[1] * (1 + off), d.z * skala[2] * (1 + off))) + HC
    bmesh.ops.delete(bm, geom=hapus, context="FACES")
    ob = mesh_dari_bm(bm, nama)
    ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def pita(nama, titik, lebar, tebal, arah_lebar, mat, n_seg=10, sub=6):
    """Sapuan penampang elips sepanjang lintasan (Catmull-Rom) — untuk helai rambut."""
    P = [V(p) for p in titik]
    def cr(i, t):
        p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[min(i + 1, len(P) - 1)]; p3 = P[min(i + 2, len(P) - 1)]
        return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
    jalur = []
    for i in range(len(P) - 1):
        for k in range(sub):
            jalur.append(cr(i, k / sub))
    jalur.append(P[-1])
    N = len(jalur)
    bm = bmesh.new()
    cinc = []
    for j, c in enumerate(jalur):
        tg = (jalur[min(j + 1, N - 1)] - jalur[max(j - 1, 0)]).normalized()
        u = j / (N - 1)
        a = V(arah_lebar(u)) if callable(arah_lebar) else V(arah_lebar)
        a = (a - tg * a.dot(tg)).normalized()
        bnorm = tg.cross(a).normalized()
        w = lebar(u) if callable(lebar) else lebar
        th = tebal(u) if callable(tebal) else tebal
        row = []
        for i in range(n_seg):
            ang = 2 * math.pi * i / n_seg
            row.append(bm.verts.new(c + a * (math.cos(ang) * w * 0.5) + bnorm * (math.sin(ang) * th * 0.5)))
        cinc.append(row)
    for j in range(N - 1):
        for i in range(n_seg):
            bm.faces.new((cinc[j][i], cinc[j][(i + 1) % n_seg], cinc[j + 1][(i + 1) % n_seg], cinc[j + 1][i]))
    bm.faces.new(list(reversed(cinc[0])))
    bm.faces.new(cinc[-1])
    ob = mesh_dari_bm(bm, nama)
    sb = ob.modifiers.new("s", "SUBSURF"); sb.levels = 1
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier="s")
    ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def rambut(tk, mats, bagian):
    mat = mats["rambut"]
    if tk["rambut"] == "pendek":
        # Rambut pendek bergelombang: samping tipis, atas bervolume, dahi terbuka
        def masker(d):
            # ambang garis rambut: depan tinggi (dahi), samping di atas telinga, belakang rendah
            y = d.y
            thr = lerp(0.14, 0.52, ss(-0.15, -0.75, y)) if y < 0 else lerp(0.14, -0.40, ss(0.1, 0.8, y))
            # pelipis sedikit masuk (huruf M)
            if y < -0.4: thr += 0.06 * ss(0.15, 0.45, abs(d.x))
            return ss(thr, thr + 0.10, d.z)
        def tinggi(d):
            atas = max(0.0, d.z - 0.15) ** 1.1
            depan = max(0.0, -d.y) * max(0.0, d.z - 0.35)
            gel = acak(d.x * 1.3, d.y, d.z, 12.0)
            return 0.030 + 0.16 * atas + 0.07 * depan + 0.03 * gel * (0.25 + atas)
        bagian.append((cangkang_masker("rambut", (0.099, 0.109, 0.128), masker, tinggi, mat), "head"))
    else:
        def masker(d):
            y = d.y
            thr = lerp(-0.05, 0.66, ss(-0.2, -0.8, y)) if y < 0 else lerp(-0.05, -0.45, ss(0.0, 0.7, y))
            # wajah tetap terbuka; sisi depan rambut turun membingkai pipi
            if y < -0.3: thr = min(thr, lerp(0.66, -0.30, ss(0.30, 0.85, abs(d.x))))
            return ss(thr - 0.06, thr + 0.16, d.z)
        def tinggi(d):
            belah = 0.020 * max(0.0, 1.0 - abs(d.x) * 7) * max(0.0, -d.y + 0.2) * max(0.0, d.z)
            return 0.050 + 0.040 * max(0.0, d.z) + 0.020 * ss(0.5, 0.95, abs(d.x)) - belah + 0.006 * acak(d.x, d.y, d.z, 16.0)
        bagian.append((cangkang_masker("rambut", (0.100, 0.112, 0.130), masker, tinggi, mat), "head"))
        # Tirai belakang (di balik bahu)
        bm = bmesh.new()
        n_u, n_v = 32, 14
        grid = []
        for j in range(n_v + 1):
            tv = j / n_v
            z = HC.z + 0.04 - tv * 0.34
            row = []
            for i in range(n_u + 1):
                a = math.radians(-82 + 164 * i / n_u)
                tepi = ss(0.65, 1.0, abs(i / n_u * 2 - 1))
                lebar = (0.118 + 0.050 * tv) * (1 - 0.22 * tepi)
                row.append(bm.verts.new((math.sin(a) * lebar, math.cos(a) * lebar * 0.95 + HC.y + 0.015 + 0.02 * tv + 0.03 * tepi, z)))
            grid.append(row)
        for j in range(n_v):
            for i in range(n_u):
                bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
        ob2 = mesh_dari_bm(bm, "rambut_belakang")
        so = ob2.modifiers.new("tebal", "SOLIDIFY"); so.thickness = 0.024; so.offset = 0
        sb = ob2.modifiers.new("sub", "SUBSURF"); sb.levels = 1
        bpy.context.view_layer.objects.active = ob2
        bpy.ops.object.modifier_apply(modifier="tebal"); bpy.ops.object.modifier_apply(modifier="sub")
        ob2.data.materials.append(mat)
        for p in ob2.data.polygons: p.use_smooth = True
        bagian.append((ob2, "rambut_panjang"))
        # Dua helai depan: dari samping kepala, melewati bahu, jatuh di dada
        for s in (1, -1):
            jalur = [
                (0.080 * s, 0.000, HC.z + 0.020),
                (0.096 * s, -0.025, HC.z - 0.030),
                (0.106 * s, -0.040, HC.z - 0.100),
                (0.118 * s, -0.070, 1.470),
                (0.122 * s, -0.098, 1.390),
                (0.118 * s, -0.108, 1.300),
                (0.112 * s, -0.110, 1.240),
            ]
            ob3 = pita(f"helai{s}", jalur,
                       lebar=lambda u: 0.020 + 0.050 * ss(0.05, 0.5, u) - 0.025 * ss(0.85, 1.0, u),
                       tebal=lambda u: 0.016 + 0.014 * ss(0.05, 0.4, u) - 0.012 * ss(0.6, 1.0, u),
                       arah_lebar=lambda u, s=s: (lerp(0.2, 1.0, ss(0.3, 0.7, u)) * 1.0, lerp(1.0, 0.25, ss(0.3, 0.7, u)) * (1 if True else 0), 0.0),
                       mat=mat)
            bagian.append((ob3, "rambut_panjang"))

def jenggot(mats, bagian):
    mat = mats["jenggot"]
    def masker(d):
        if d.y > 0.35: return 0.0
        ax = abs(d.x)
        zl = lerp(-0.66, 0.05, ss(0.05, 0.86, ax))       # garis jenggot dari dagu ke cambang
        m = ss(zl + 0.06, zl - 0.04, d.z)
        # mulut & bibir bawah tetap terlihat
        e = (d.x / 0.36) ** 2 + ((d.z + 0.50) / 0.13) ** 2
        m *= ss(0.85, 1.25, e)
        return m
    def tinggi(d):
        return 0.030 + 0.010 * acak(d.x, d.y, d.z, 28.0)
    bagian.append((cangkang_masker("jenggot", (0.098 * 0.80, 0.108, 0.128), masker, tinggi, mat), "head"))
    # Kumis
    for s in (1, -1):
        a = HC + V((0.003 * s, -0.106, -0.045))
        b = HC + V((0.030 * s, -0.095, -0.055))
        bagian.append((kapsul(f"kumis{s}", a, b, 0.0062, 0.0042, mat=mat), "head"))

# ── Tangan ──────────────────────────────────────────────────────────────────

def tangan(sfx, side, mats, bagian, rig):
    kulit, kuku = mats["kulit"], mats["kuku"]
    wr, X, Y, Z, t = bingkai_tangan(side)
    M = Matrix((X, Y, Z)).transposed()
    # Telapak: kotak membulat, sedikit lebih lebar di buku jari
    bagian.append((superelips(f"telapak_{sfx}", wr + Y * 0.050 + X * (0.0 * t), (0.040, 0.046, 0.0135), e=0.55, M=M, mat=kulit), f"hand_{sfx}"))
    bagian.append((superelips(f"telapak2_{sfx}", wr + Y * 0.078 + X * (0.0 * t), (0.042, 0.016, 0.0125), e=0.6, M=M, mat=kulit), f"hand_{sfx}"))
    # Pangkal ibu jari (otot thenar) — ikut ruas pertama ibu jari
    bagian.append((kapsul(f"pergelangan_{sfx}", wr - Y * 0.022, wr + Y * 0.010, 0.0205, 0.0225, mat=kulit, roll=Z), f"hand_{sfx}"))
    eb = rig.data.bones
    for (fn, *_rest) in JARI:
        for i in range(3):
            b = eb[f"{fn}{i + 1}_{sfx}"]
            h = rig.matrix_world @ b.head_local
            tl = rig.matrix_world @ b.tail_local
            r = _rest[-1]
            r1 = r * (1.0 - 0.07 * i)
            r2 = r * (1.0 - 0.07 * (i + 1))
            bagian.append((kapsul(f"{fn}{i + 1}_{sfx}", h, tl, r1, r2, mat=kulit, roll=Z), f"{fn}{i + 1}_{sfx}"))
            if i == 2:
                d = (tl - h).normalized()
                c = tl - d * 0.0075 - Z * (r2 * 0.70)
                kk = bola(f"kuku_{fn}_{sfx}", (0, 0, 0), 1.0, seg=12, ring=8, mat=kuku)
                Mk = Matrix((X, d, Z)).transposed() @ Matrix.Diagonal((r2 * 0.85, 0.009, r2 * 0.45))
                for v in kk.data.vertices: v.co = Mk @ v.co + c
                bagian.append((kk, f"{fn}{i + 1}_{sfx}"))
    for i in range(3):
        b = eb[f"thumb{i + 1}_{sfx}"]
        h = rig.matrix_world @ b.head_local
        tl = rig.matrix_world @ b.tail_local
        zr = (rig.matrix_world.to_3x3() @ b.matrix_local.to_3x3()) @ V((0, 0, 1))
        r1 = (THUMB_R * 1.35 if i == 0 else THUMB_R * (1.0 - 0.06 * i))
        r2 = THUMB_R * (1.0 - 0.06 * (i + 1))
        bagian.append((kapsul(f"thumb{i + 1}_{sfx}", h, tl, r1, r2, mat=kulit, roll=zr), f"thumb{i + 1}_{sfx}"))
        if i == 2:
            d = (tl - h).normalized()
            xr = d.cross(zr).normalized()
            c = tl - d * 0.008 - zr * (r2 * -0.0) + xr * 0
            # kuku ibu jari di punggungnya (berlawanan arah tekuk)
            c = tl - d * 0.008 - zr * (r2 * 0.72)
            kk = bola(f"kuku_thumb_{sfx}", (0, 0, 0), 1.0, seg=12, ring=8, mat=kuku)
            Mk = Matrix((xr, d, zr)).transposed() @ Matrix.Diagonal((r2 * 0.85, 0.010, r2 * 0.45))
            for v in kk.data.vertices: v.co = Mk @ v.co + c
            bagian.append((kk, f"thumb{i + 1}_{sfx}"))

# ── Kerah ──────────────────────────────────────────────────────────────────

def kerah(tk, mats, bagian):
    if tk["kerah"] == "jaket":
        # Kerah bomber: cincin tebal miring di pangkal leher, terbuka di depan
        bm = bmesh.new()
        n = 36
        prev = None
        cincin = []
        for j, (rr, zz) in enumerate([(0.068, 1.425), (0.072, 1.465), (0.070, 1.495)]):
            row = []
            for i in range(n + 1):
                a = math.radians(-150 + 300 * i / n)   # 0 = belakang, celah di depan
                x = math.sin(a) * rr * 1.08
                y = math.cos(a) * rr + 0.008
                row.append(bm.verts.new((x, y, zz - 0.02 * (1 - math.cos(a)) * 0.5)))
            cincin.append(row)
        for j in range(len(cincin) - 1):
            for i in range(n):
                bm.faces.new((cincin[j][i], cincin[j][i + 1], cincin[j + 1][i + 1], cincin[j + 1][i]))
        ob = mesh_dari_bm(bm, "kerah")
        so = ob.modifiers.new("t", "SOLIDIFY"); so.thickness = 0.012
        sb = ob.modifiers.new("s", "SUBSURF"); sb.levels = 1
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier="t"); bpy.ops.object.modifier_apply(modifier="s")
        ob.data.materials.append(mats["atas_gelap"])
        for p in ob.data.polygons: p.use_smooth = True
        bagian.append((ob, "chest"))
    else:
        # Leher sweter rajut: cincin bulat
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=False, segments=36, radius1=0.066, radius2=0.060, depth=0.03)
        for v in bm.verts:
            v.co = V((v.co.x * 1.1, v.co.y + 0.008, v.co.z + 1.432))
        ob = mesh_dari_bm(bm, "kerah")
        so = ob.modifiers.new("t", "SOLIDIFY"); so.thickness = 0.010
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.modifier_apply(modifier="t")
        ob.data.materials.append(mats["atas_gelap"])
        for p in ob.data.polygons: p.use_smooth = True
        bagian.append((ob, "chest"))

# ── Bobot badan ────────────────────────────────────────────────────────────

BONE_BADAN = ["hips", "spine", "chest", "neck"] + [f"{b}_{s}" for s in "LR" for b in ("clavicle", "upperarm", "forearm")]

def jarak_ruas(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (a + ab * t - p).length, t

def bobot_badan(ob, rig):
    segs = {}
    for n in BONE_BADAN:
        b = rig.data.bones[n]
        segs[n] = (b.head_local.copy(), b.tail_local.copy())
    for n in BONE_BADAN:
        ob.vertex_groups.new(name=n)
    for v in ob.data.vertices:
        p = v.co
        sisi = 1 if p.x > 0 else -1
        sfx = "L" if sisi > 0 else "R"
        ds = {}
        for n, (a, b) in segs.items():
            if n.endswith("_L") and sisi < 0: continue
            if n.endswith("_R") and sisi > 0: continue
            d, tt = jarak_ruas(p, a, b)
            ds[n] = d
        # Lengan: bagian yang jauh dari sumbu badan hanya milik tulang lengan
        tot = 0.0
        w = {}
        for n, d in ds.items():
            k = 1.0 / max(d, 0.004) ** 6
            w[n] = k; tot += k
        # Leher di atas pangkal leher: hanya neck
        if p.z > 1.47 and abs(p.x) < 0.08:
            w = {"neck": 1.0}; tot = 1.0
        for n, k in w.items():
            if k / tot > 0.01:
                ob.vertex_groups[n].add([v.index], k / tot, "REPLACE")

def bobot_rambut(ob):
    gh = ob.vertex_groups.new(name="head")
    gc = ob.vertex_groups.new(name="chest")
    for v in ob.data.vertices:
        z = v.co.z
        t = max(0.0, min(1.0, (1.56 - z) / 0.16))
        gh.add([v.index], 1.0 - t, "REPLACE")
        if t > 0: gc.add([v.index], t, "REPLACE")

# ── Rakit ──────────────────────────────────────────────────────────────────

TOKOH = {
    "pria": dict(kulit="#C8936F", rambut_w="#2A1C15", jenggot_w="#3A281E", atas="#A8774F", atas_gelap="#8A5F3C",
                 dalam="#F2F0EB", iris="#3B2618", bibir="#A0614F", rambut="pendek", jenggot=True, kerah="jaket",
                 lebar=1.0, lengan=1.0, leher_z=1.46, alis=0.0050),
    "wanita": dict(kulit="#EDC3A8", rambut_w="#3A2115", atas="#E68AAE", atas_gelap="#D9799E",
                   iris="#4A2E1E", bibir="#C9727A", rambut="panjang", anting=True, kerah="sweter",
                   lebar=0.90, lengan=0.88, leher_z=1.46, alis=0.0040),
}

def rakit(nama):
    tk = TOKOH[nama]
    mats = {
        "kulit": mat_baru(f"{nama}_kulit", tk["kulit"], 0.55),
        "rambut": mat_baru(f"{nama}_rambut", tk["rambut_w"], 0.7),
        "atas": mat_baru(f"{nama}_atas", tk["atas"], 0.85),
        "atas_gelap": mat_baru(f"{nama}_atas_gelap", tk["atas_gelap"], 0.85),
        "putih_mata": mat_baru(f"{nama}_putih_mata", "#F7F4EF", 0.2),
        "iris": mat_baru(f"{nama}_iris", tk["iris"], 0.15),
        "bibir": mat_baru(f"{nama}_bibir", tk["bibir"], 0.5),
        "kuku": mat_baru(f"{nama}_kuku", "#E7B8A6" if nama == "pria" else "#F0B9B0", 0.3),
    }
    if "dalam" in tk: mats["dalam"] = mat_baru(f"{nama}_dalam", tk["dalam"], 0.8)
    if tk.get("jenggot"): mats["jenggot"] = mat_baru(f"{nama}_jenggot", tk["jenggot_w"], 0.9)
    if tk.get("anting"): mats["mutiara"] = mat_baru(f"{nama}_mutiara", "#F4EEE6", 0.15)

    rig = bangun_rig(f"rig_{nama}")
    bagian = []
    kepala(tk, mats, bagian)
    kerah(tk, mats, bagian)
    for s, sfx in ((1, "L"), (-1, "R")):
        tangan(sfx, s, mats, bagian, rig)
    body = badan(f"badan_{nama}", tk, mats)
    bobot_badan(body, rig)
    # Bagian kaku: satu grup tulang dengan bobot 1
    for ob, bn in bagian:
        if bn == "rambut_panjang":
            bobot_rambut(ob)
            continue
        g = ob.vertex_groups.new(name=bn)
        g.add([v.index for v in ob.data.vertices], 1.0, "REPLACE")
        for p in ob.data.polygons: p.use_smooth = True
    # Gabung semua jadi satu mesh ber-skin
    bpy.ops.object.select_all(action="DESELECT")
    for ob, _ in bagian: ob.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body.name = f"tubuh_{nama}"
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = rig
    body.parent = rig
    return rig, body

if __name__ == "__main__":
    bersihkan()
    rp, bp = rakit("pria")
    rw, bw = rakit("wanita")
    bpy.ops.wm.save_as_mainfile(filepath=OUT)
    print("SIMPAN", OUT, len(bp.data.vertices), len(bw.data.vertices))
