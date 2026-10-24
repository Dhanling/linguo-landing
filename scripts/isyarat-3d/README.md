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

## Avatar VRoid (VRM) — [isyarat-vrm-v1]

Slide dengan `avatar: "vrm"` memakai `isyarat-pria.vrm` / `isyarat-wanita.vrm` (ekspor
VRoid Studio, VRM 1.0). Klip TETAP dipanggang di rig Blender; SlideIsyarat memutarnya di
rangka bayangan (`rangka` di isyarat-gerak.json, ditulis kemas.mjs) lalu me-retarget ke
tulang humanoid VRM tiap bingkai. Ganti avatar = ekspor VRM baru, kecilkan dengan
`kecilkan_vrm.py` (buang morph NORMAL, morph POSITION jadi sparse, thumbnail 256 px),
salin ke `public/models/isyarat/asl/` KEDUA repo, render ulang `vrm-poster-*.png`.

## A1.2–A2.4 — [isyarat-asl-a1a2-v1]

Kosakata per sublevel ada di `kamus_a1_2.py` … `kamus_a2_4.py` (diimpor otomatis di akhir
`kamus.py`); pembagian kode di `ALOKASI.md` supaya tidak bentrok. Cek semua kode dek ada di kamus:
`node --import tsx cek_kode.mjs <dek.ts>…` (dari worktree dashboard; `cek_kode.mjs` memanggil
`daftar_kode.py` lewat Blender — taruh keduanya di folder kerja seperti ~/linguo-isyarat-work).

## BISINDO — [isyarat-bisindo-v1]

Kamus terpisah `kamus_bisindo.py` (abjad jari dua tangan A–Z + angka 1–10; rujukan: dataset
terbuka Mendeley BISINDO, lihat kepala berkas). Pilih kamus lewat env `KAMUS`:
`KAMUS=kamus_bisindo $B -b out/avatar.blend --python tanda.py -- out/glb-bisindo [KODE,…] [--cek --sudut eja2]`
→ kemas ke `public/models/isyarat/bisindo/` di KEDUA repo (dek memakai `bahasa: "bisindo"`).
⚠️ Belum dicek pengajar Tuli; Q & S paling meragukan. Kosakata BISINDO BELUM ada — jangan dikarang.
