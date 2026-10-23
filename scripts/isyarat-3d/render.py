# Render cek cepat (Workbench): Blender -b x.blend --python render.py -- <out.png> <tokoh> [kamera] [aksi] [frame]
# kamera: depan | samping | tangan_R | dekat
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
OUT, TOKOH = a[0], a[1]
KAM = a[2] if len(a) > 2 else "depan"
AKSI = a[3] if len(a) > 3 else ""
FRAME = int(a[4]) if len(a) > 4 else 1

sc = bpy.context.scene
for ob in sc.objects:
    if ob.type in ("MESH", "ARMATURE"):
        mine = TOKOH in ob.name
        ob.hide_render = not mine
        ob.hide_viewport = not mine

rig = bpy.data.objects.get(f"rig_{TOKOH}")
if AKSI and rig:
    rig.animation_data_create()
    rig.animation_data.action = bpy.data.actions[AKSI]
    if hasattr(rig.animation_data, "action_slot") and bpy.data.actions[AKSI].slots:
        rig.animation_data.action_slot = bpy.data.actions[AKSI].slots[0]
sc.frame_set(FRAME)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
sc.collection.objects.link(cam)
sc.camera = cam
POS = {
    "depan": ((0, -2.4, 1.32), (0, 0, 1.30), 30),
    "samping": ((-2.2, -0.9, 1.35), (0, -0.1, 1.30), 30),
    "tangan_R": ((-0.25, -0.75, 1.0), (-0.25, 0, 0.95), 30),
    "dekat": ((0, -0.9, 1.60), (0, 0, 1.58), 30),
    "atas": ((0.4, -1.6, 2.0), (0, -0.1, 1.30), 30),
}
p, t, fov = POS[KAM]
cam.location = Vector(p)
d = Vector(t) - Vector(p)
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam_d.angle = math.radians(fov)

sc.render.engine = "BLENDER_WORKBENCH"
sh = sc.display.shading
sh.light = "STUDIO"
sh.color_type = "MATERIAL"
sh.show_cavity = True
sh.show_shadows = False
sc.render.resolution_x = int(a[5]) if len(a) > 5 else 640
sc.render.resolution_y = int(a[6]) if len(a) > 6 else 640
sc.render.film_transparent = False
sc.world = sc.world or bpy.data.worlds.new("w")
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
