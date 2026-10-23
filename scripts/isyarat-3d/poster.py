# Render sampul/tujuan/poster dek ASL (EEVEE).
#   Blender -b avatar.blend --python poster.py -- <glb-dir-blend> <outdir>
# Memakai aksi hasil tanda.py (berkas .blend yang sudah dipanggang).
import bpy, sys, math, os
from mathutils import Vector as V

a = sys.argv[sys.argv.index("--") + 1:]
OUT = a[0]
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.film_transparent = False
try:
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
except Exception:
    pass

def dunia(warna_atas, warna_bawah, kuat=1.0):
    w = bpy.data.worlds.new("w") if not sc.world else sc.world
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs[1].default_value = kuat
    amb = nt.nodes.new("ShaderNodeBackground"); amb.inputs[0].default_value = (0.55, 0.55, 0.58, 1); amb.inputs[1].default_value = 0.35
    lp = nt.nodes.new("ShaderNodeLightPath"); mx = nt.nodes.new("ShaderNodeMixShader")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Window"], sep.inputs[0])
    nt.links.new(sep.outputs["Y"], ramp.inputs[0])
    ramp.color_ramp.elements[0].color = warna_bawah
    ramp.color_ramp.elements[1].color = warna_atas
    nt.links.new(ramp.outputs[0], bg.inputs[0])
    nt.links.new(lp.outputs["Is Camera Ray"], mx.inputs[0])
    nt.links.new(amb.outputs[0], mx.inputs[1]); nt.links.new(bg.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs[0])

def lin(h):
    h = h.lstrip("#"); return tuple(((int(h[i:i + 2], 16) / 255) ** 2.2) for i in (0, 2, 4)) + (1,)

def lampu():
    for n, (loc, en, sz) in {"kunci": ((-2.2, -3.0, 3.0), 520, 3.0), "isi": ((2.8, -2.2, 2.0), 170, 4.0), "belakang": ((0.5, 2.5, 3.2), 260, 2.0)}.items():
        d = bpy.data.lights.new(n, "AREA"); d.energy = en; d.size = sz
        o = bpy.data.objects.new(n, d); sc.collection.objects.link(o)
        o.location = V(loc); o.rotation_euler = (V((0, 0, 1.3)) - V(loc)).to_track_quat("-Z", "Y").to_euler()

def pose(tokoh, aksi, frame, x, rotz):
    rig = bpy.data.objects[f"rig_{tokoh}"]
    rig.location = V((x, 0, 0)); rig.rotation_euler = (0, 0, math.radians(rotz))
    rig.animation_data_create()
    act = bpy.data.actions[aksi]
    rig.animation_data.action = act
    try:
        if act.slots: rig.animation_data.action_slot = act.slots[0]
    except Exception as e:
        print("slot", e)
    rig.animation_data.action_extrapolation = "HOLD"
    return rig

def tampil(*tokoh):
    for ob in sc.objects:
        if ob.type in ("MESH", "ARMATURE"):
            ob.hide_render = not any(t in ob.name for t in tokoh)

cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
def kamera(p, t, fov):
    cam.location = V(p); cam.rotation_euler = (V(t) - V(p)).to_track_quat("-Z", "Y").to_euler(); cam_d.angle = math.radians(fov)

lampu()
for ad in [o.animation_data for o in sc.objects if o.animation_data]:
    for tr in list(ad.nla_tracks): ad.nla_tracks.remove(tr)

def render(nama, w, h):
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.filepath = os.path.join(OUT, nama)
    sc.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)

# 1) Sampul: dua tokoh di separuh bawah, latar teal
dunia(lin("#2BB3B1"), lin("#0E7C7B"))
tampil("pria", "wanita")
pose("pria", "HELLO", 14, -0.42, -28)
pose("wanita", "THANK_YOU", 16, 0.42, 28)
sc.frame_set(14)
kamera((0, -4.0, 1.95), (0, 0, 1.78), 30)
render("sampul.png", 1920, 1080)

# 2) Tujuan: pria di kanan, latar krem terang
dunia(lin("#F4FBFA"), lin("#D7F0EE"))
tampil("pria")
bpy.data.objects["rig_wanita"].location = V((5, 0, 0))
pose("pria", "HELLO", 9, 0.0, -18)
sc.frame_set(9)
kamera((-0.45, -2.7, 1.40), (-0.45, 0, 1.34), 30)
render("tujuan.png", 1920, 1080)

# 3) Poster penampil (transparan) — pria & dialog
sc.render.film_transparent = True
pose("pria", "IDLE", 1, 0, 0)
sc.frame_set(1)
kamera((0, -2.2, 1.34), (0, 0, 1.30), 28)
render("poster-pria.png", 900, 900)
tampil("pria", "wanita")
pose("pria", "IDLE", 1, -0.40, -32)
pose("wanita", "IDLE", 1, 0.40, 32)
kamera((0, -3.0, 1.38), (0, 0, 1.28), 30)
render("poster-dialog.png", 1200, 800)
tampil("wanita")
pose("wanita", "IDLE", 1, 0, 0)
bpy.data.objects["rig_pria"].location = V((5, 0, 0))
sc.frame_set(1)
kamera((0, -2.2, 1.34), (0, 0, 1.30), 28)
render("poster-wanita.png", 900, 900)
