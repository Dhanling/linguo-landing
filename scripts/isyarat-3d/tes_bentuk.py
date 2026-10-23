# Render grid bentuk tangan: Blender -b avatar.blend --python tes_bentuk.py -- outdir A,B,C...
import bpy, sys, math, os
sys.path.insert(0, os.path.dirname(__file__))
import isyarat as I
from mathutils import Vector as V
a = sys.argv[sys.argv.index("--") + 1:]
OUT = a[0]; NAMES = a[1].split(",")
JARI = a[2] if len(a) > 2 else "atas"; TEL = a[3] if len(a) > 3 else "depan"
sc = bpy.context.scene
for ob in sc.objects:
    if ob.type in ("MESH", "ARMATURE"):
        ob.hide_render = "pria" not in ob.name
rig = bpy.data.objects["rig_pria"]
I.R = I.Rig(rig)
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
sc.render.engine = "BLENDER_WORKBENCH"
sh = sc.display.shading; sh.light = "STUDIO"; sh.color_type = "MATERIAL"; sh.show_cavity = True
sc.render.resolution_x = sc.render.resolution_y = 360
for nm in NAMES:
    I.R.reset()
    I.pasang_bentuk("R", nm)
    Mh = I.matriks_tangan(JARI, TEL, "R")
    p = V((-0.10, -0.32, 1.30))
    I.R.set_basis("hand_R", I.R.basis["hand_R"])
    off = I.anchor_lokal("R", "telapak")
    W = p - Mh @ off
    I.ik_lengan("R", W, Mh)
    I.pasang_bentuk("L", "SANTAI")
    I.ik_lengan("L", I.titik("istirahat_L", "L") - I.matriks_tangan("dalam+0.3*depan", "atas+0.2*belakang", "L") @ I.anchor_lokal("L", "telapak"), I.matriks_tangan("dalam+0.3*depan", "atas+0.2*belakang", "L"))
    I.terapkan(rig)
    bpy.context.view_layer.update()
    cam.location = p + V((0.02, -0.42, 0.02))
    d = p - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam_d.angle = math.radians(30)
    sc.render.filepath = os.path.join(OUT, f"b_{nm}.png")
    bpy.ops.render.render(write_still=True)
