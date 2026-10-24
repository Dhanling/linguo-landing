# [isyarat-3d-v1] Panggang semua isyarat di kamus.py jadi aksi Blender lalu
# ekspor GLB.
#
#   Blender -b avatar.blend --python tanda.py -- <outdir> [KODE,KODE…] [--cek]
#
# Hasil:  <outdir>/isyarat-pria.glb   (rig + mesh pria + SEMUA klip)
#         <outdir>/isyarat-wanita.glb (rig + mesh wanita, tanpa klip — klip pria
#                                      diputar di rig wanita lewat nama tulang)
#         <outdir>/kamus.json         (kode, arti, kategori, cara, gloss, durasi, wajah)
# --cek  : tidak ekspor, render 3 bingkai per isyarat ke <outdir>/cek/

import bpy, sys, os, json, math
sys.path.insert(0, os.path.dirname(__file__))
import isyarat as I
import importlib
# [isyarat-bisindo-v1] KAMUS=kamus_bisindo → kamus BISINDO; bawaan ASL.
K = importlib.import_module(os.environ.get("KAMUS", "kamus"))
from mathutils import Vector as V, Quaternion

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
PILIH = [a for a in argv[1:] if not a.startswith("--")]
PILIH = PILIH[0].split(",") if PILIH else None
CEK = "--cek" in argv
FPS = 30

os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
sc.render.fps = FPS
rig = bpy.data.objects["rig_pria"]
I.R = I.Rig(rig)
rig.animation_data_create()

SISI = ("R", "L")
TULANG_LENGAN = [f"{b}_{s}" for s in SISI for b in
                 ["upperarm", "forearm", "hand"] + [f"{f}{i}" for f in ("thumb", "index", "middle", "ring", "pinky") for i in (1, 2, 3)]]
TULANG_KEPALA = ["neck", "head"]

def smooth(u): return u * u * (3 - 2 * u)

def lengkapi(keys, sisi):
    """Waris bidang kunci sebelumnya + hitung pergelangan, orientasi, sudut jari."""
    out = []
    cur = dict(putar=0.0, siku=None, kurva=False)
    for kk in keys:
        cur = dict(cur)
        cur["kurva"] = False
        cur.update(kk)
        I.R.reset()
        sd = I.sudut_bentuk(sisi, cur["b"])
        I.pasang_sudut(sisi, sd)
        M = I.matriks_tangan(cur["j"], cur["tp"], sisi, cur.get("putar", 0.0))
        o = I.anchor_lokal(sisi, cur["a"])
        P = I.titik(cur["p"], sisi)
        W = P - M @ o
        out.append(dict(t=cur["t"], W=W, Q=M.to_quaternion(), sd=sd, siku=cur.get("siku"), kurva=cur.get("kurva", False)))
    # Kuaternion berurutan sebelahan
    for i in range(1, len(out)):
        if out[i]["Q"].dot(out[i - 1]["Q"]) < 0:
            out[i]["Q"].negate()
    return out

def cr(p0, p1, p2, p3, t):
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)

def evaluasi(ks, tau):
    if tau <= ks[0]["t"] or len(ks) == 1:
        k0 = ks[0]; return k0["W"], k0["Q"], k0["sd"], k0["siku"]
    if tau >= ks[-1]["t"]:
        k1 = ks[-1]; return k1["W"], k1["Q"], k1["sd"], k1["siku"]
    for i in range(len(ks) - 1):
        a, b = ks[i], ks[i + 1]
        if a["t"] <= tau <= b["t"]:
            u = (tau - a["t"]) / max(1e-6, b["t"] - a["t"])
            kurva = a["kurva"] and b["kurva"]
            e = u if kurva else smooth(u)
            if kurva:
                p0 = ks[i - 1]["W"] if i > 0 and ks[i - 1]["kurva"] else a["W"] * 2 - b["W"]
                p3 = ks[i + 2]["W"] if i + 2 < len(ks) and ks[i + 2]["kurva"] else b["W"] * 2 - a["W"]
                W = cr(p0, a["W"], b["W"], p3, e)
            else:
                W = a["W"].lerp(b["W"], e)
            Q = a["Q"].slerp(b["Q"], e)
            sd = [x + (y - x) * e for x, y in zip(a["sd"], b["sd"])]
            return W, Q, sd, b["siku"] or a["siku"]
    k1 = ks[-1]; return k1["W"], k1["Q"], k1["sd"], k1["siku"]

def evaluasi_kepala(kep, tau):
    if not kep: return (0, 0, 0)
    pts = [(0.0, 0, 0, 0)] + list(kep) if kep[0][0] > 0 else list(kep)
    if tau >= pts[-1][0]: return pts[-1][1:]
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        if a[0] <= tau <= b[0]:
            u = smooth((tau - a[0]) / max(1e-6, b[0] - a[0]))
            return tuple(x + (y - x) * u for x, y in zip(a[1:], b[1:]))
    return pts[-1][1:]

def aksi_baru(nama):
    if nama in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[nama])
    act = bpy.data.actions.new(nama)
    act.use_fake_user = True
    rig.animation_data.action = act
    I._q_prev.clear()
    return act

def panggang(kode, entri):
    keys = {"R": entri["R"] or [dict(K.IST["R"], t=0)], "L": entri["L"] or [dict(K.IST["L"], t=0)]}
    ks = {s: lengkapi(keys[s], s) for s in SISI}
    dur = max(ks["R"][-1]["t"], ks["L"][-1]["t"], max([p[0] for p in entri["kepala"]] or [0]))
    n = max(1, round(dur * FPS))
    act = aksi_baru(kode)
    phi = {"R": None, "L": None}
    for f in range(n + 1):
        tau = f / FPS
        I.R.reset()
        for s in SISI:
            W, Q, sd, siku = evaluasi(ks[s], tau)
            I.pasang_sudut(s, sd)
            phi[s] = I.ik_lengan(s, W, Q.to_matrix(), phi[s], siku)
        I.pasang_kepala(*evaluasi_kepala(entri["kepala"], tau))
        I.tulis_kunci(rig, TULANG_LENGAN + TULANG_KEPALA, f, awal=(f == 0))
    return act, dur

def panggang_diam():
    """IDLE 4 dtk berulang: tangan istirahat, napas & kepala bergeser halus."""
    act = aksi_baru("IDLE")
    ks = {s: lengkapi([dict(K.IST[s], t=0)], s) for s in SISI}
    n = 4 * FPS
    phi = {"R": None, "L": None}
    for f in range(n + 1):
        tau = f / FPS
        w = 2 * math.pi * tau / 4.0
        I.R.reset()
        for s in SISI:
            W, Q, sd, siku = evaluasi(ks[s], 0)
            W = W + V((0, 0, 0.004 * math.sin(w)))
            I.pasang_sudut(s, sd)
            phi[s] = I.ik_lengan(s, W, Q.to_matrix(), phi[s], siku)
        I.pasang_kepala(1.5 * math.sin(w + 0.6), 2.5 * math.sin(w * 0.5 if False else w), 1.2 * math.sin(w + 1.7))
        I.tulis_kunci(rig, TULANG_LENGAN + TULANG_KEPALA, f, awal=(f == 0))
    return act

def panggang_wajah(nama, w):
    """Lapis ekspresi: hanya alis (lokasi+rotasi), mata (skala), mulut (skala). 4 dtk berulang + kedip."""
    act = aksi_baru(f"WAJAH_{nama.upper()}")
    pb = rig.pose.bones
    naik, tengah, putar = w["alis"]
    n = 4 * FPS
    for f in range(n + 1):
        tau = f / FPS
        # kedip di 1,6 dtk & 3,5 dtk (0,16 dtk)
        kedip = 1.0
        for tb in (1.6, 3.5):
            d = abs(tau - tb)
            if d < 0.08: kedip = min(kedip, 0.1 + 0.9 * (d / 0.08))
        mata = w["mata"] * kedip if w["mata"] > 0.2 else w["mata"]
        for s, sg in (("R", 1), ("L", -1)):
            b = pb[f"brow_{s}"]
            b.rotation_mode = "QUATERNION"
            b.location = V((-tengah * sg, 0, naik))
            b.rotation_quaternion = Quaternion((0, 1, 0), math.radians(putar * sg))
            b.keyframe_insert("location", frame=f, group=b.name)
            b.keyframe_insert("rotation_quaternion", frame=f, group=b.name)
            e = pb[f"eye_{s}"]
            e.scale = V((1, 1, mata))
            e.keyframe_insert("scale", frame=f, group=e.name)
        m = pb["mouth"]
        m.scale = V((w["mulut"][0], 1, w["mulut"][1]))
        m.keyframe_insert("scale", frame=f, group=m.name)
        if f == 0 or f == n:
            continue
    # kembalikan pose wajah
    for s in SISI:
        pb[f"brow_{s}"].location = V((0, 0, 0)); pb[f"brow_{s}"].rotation_quaternion = Quaternion()
        pb[f"eye_{s}"].scale = V((1, 1, 1))
    pb["mouth"].scale = V((1, 1, 1))
    return act

def ke_nla(acts):
    ad = rig.animation_data
    for act in acts:
        tr = ad.nla_tracks.new()
        tr.name = act.name
        st = tr.strips.new(act.name, 0, act)
        try:
            if act.slots: st.action_slot = act.slots[0]
        except Exception:
            pass
        tr.mute = True
    ad.action = None

# ── Jalankan ───────────────────────────────────────────────────────────────

kodes = [k for k in K.KAMUS if (PILIH is None or k in PILIH) and (K.KAMUS[k]["R"] or K.KAMUS[k]["L"])]
acts, meta = [], []
for kode in kodes:
    e = K.KAMUS[kode]
    act, dur = panggang(kode, e)
    acts.append(act)
    meta.append(dict(kode=kode, arti=e["arti"], kat=e["kat"], cara=e["cara"], gloss=e["gloss"], dur=round(dur, 3), wajah=e["wajah"]))
    print("PANGGANG", kode, round(dur, 2))
for kode in K.KAMUS:
    if not (K.KAMUS[kode]["R"] or K.KAMUS[kode]["L"]):
        e = K.KAMUS[kode]
        meta.append(dict(kode=kode, arti=e["arti"], kat=e["kat"], cara=e["cara"], gloss=e["gloss"], dur=0, wajah=e["wajah"], eja=True))

if CEK:
    # Render 3 bingkai (awal, tengah, akhir) per isyarat
    import importlib
    cek = os.path.join(OUT, "cek"); os.makedirs(cek, exist_ok=True)
    for ob in sc.objects:
        if ob.type in ("MESH", "ARMATURE"):
            ob.hide_render = "pria" not in ob.name
    cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
    sudut = argv[argv.index("--sudut") + 1] if "--sudut" in argv else "depan"
    pos = {"depan": ((0.0, -1.75, 1.36), (0, 0, 1.30)), "samping": ((-1.45, -0.95, 1.40), (0, -0.12, 1.30)),
           "atas": ((-0.5, -1.4, 1.95), (0, -0.15, 1.30)),
           "eja": ((-0.10, -0.95, 1.40), (-0.11, -0.30, 1.37)),
           "eja2": ((-0.03, -0.98, 1.40), (-0.03, -0.30, 1.36))}[sudut]
    cam.location = V(pos[0]); cam.rotation_euler = (V(pos[1]) - V(pos[0])).to_track_quat("-Z", "Y").to_euler()
    cam_d.angle = math.radians(32)
    sc.render.engine = "BLENDER_WORKBENCH"
    shd = sc.display.shading; shd.light = "STUDIO"; shd.color_type = "MATERIAL"; shd.show_cavity = True
    sc.render.resolution_x = 300; sc.render.resolution_y = 300
    for act in acts:
        rig.animation_data.action = act
        fr = act.frame_range
        for i, f in enumerate((fr[0], (fr[0] + fr[1]) / 2, fr[1])):
            sc.frame_set(int(round(f)))
            sc.render.filepath = os.path.join(cek, f"{act.name}_{i}.png")
            bpy.ops.render.render(write_still=True)
    sys.exit(0)

acts.append(panggang_diam())
for nm, w in K.WAJAH.items():
    acts.append(panggang_wajah(nm, w))
ke_nla(acts)
I.R.reset(); I.terapkan(rig)
for pb in rig.pose.bones:
    pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)

def ekspor(nama, anim):
    bpy.ops.object.select_all(action="DESELECT")
    r = bpy.data.objects[f"rig_{nama}"]; m = bpy.data.objects[f"tubuh_{nama}"]
    r.select_set(True); m.select_set(True)
    bpy.context.view_layer.objects.active = r
    path = os.path.join(OUT, f"isyarat-{nama}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True,
        export_animations=anim, export_animation_mode="ACTIONS", export_force_sampling=True,
        export_optimize_animation_size=True, export_skins=True, export_def_bones=False,
        export_apply=False, export_yup=True, export_texcoords=False, export_normals=True,
        export_materials="EXPORT", export_cameras=False, export_lights=False,
        export_anim_single_armature=True, export_reset_pose_bones=True,
    )
    print("EKSPOR", path, os.path.getsize(path))

ekspor("pria", True)
ekspor("wanita", False)
json.dump(dict(fps=FPS, isyarat=meta, wajah=list(K.WAJAH.keys())), open(os.path.join(OUT, "kamus.json"), "w"), ensure_ascii=False, indent=1)
print("SELESAI", len(acts))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "baked.blend"))
