# Avatar isyarat 3D (ASL) — [isyarat-3d-v1]

Model & animasi dibuat di Blender (headless), lalu dikemas untuk web.

```
B=/Applications/Blender.app/Contents/MacOS/Blender
$B -b --factory-startup --python avatar.py -- out/avatar.blend      # 2 tokoh, rig identik
$B -b out/avatar.blend --python tanda.py -- out/glb [KODE,…] [--cek]  # panggang klip kamus.py
$B -b out/glb/baked.blend --python poster.py -- out/poster            # sampul/tujuan/poster
node kemas.mjs out/glb out/web   # butuh @gltf-transform/core|functions|extensions@4
```

Salin `out/web/*` ke `public/models/isyarat/asl/` di KEDUA repo (landing & dashboard).
Isyarat baru = tambah entri di `kamus.py` (titik tubuh & bentuk tangan di `isyarat.py`),
cek visual dengan `--cek` (render 3 bingkai per isyarat), lalu panggang ulang.
⚠️ Gerak ditulis dari kamus umum ASL — perlu dicek pengajar Tuli.
