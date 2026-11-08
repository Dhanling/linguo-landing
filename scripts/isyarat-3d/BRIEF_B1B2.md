# Brief agen: kamus isyarat + dek slide ASL/BISINDO B1–B2 [isyarat-b1b2-v1]

Linguo (sekolah bahasa online Indonesia) punya dek slide ASL dan BISINDO A1.1–A2.4 dengan avatar 3D
VRoid (Rio & Mia) yang memperagakan isyarat. Sekarang kita menulis B1.1–B2.7. Kamu mengerjakan DUA
sublevel dari SATU bahasa (lihat prompt), berurutan: sublevel pertama selesai penuh dulu (kamus +
dek + validasi), baru sublevel kedua. Bahasa konten: Indonesia (siswa Indonesia).

Folder:  W=~/linguo-isyarat-work   D=~/linguo-admin-wt/isyarat-b1b2
Bahasa → nama berkas:
- ASL:     kamus  $W/blender/kamus_<sub>.py           (mis. kamus_b1_1.py)   — impor: `from kamus import S, k, A, lingkar, bolak, cermin, IST`
           dek    $D/src/data/dekSilabus/asl-<sub>.ts  (mis. asl-b1-1.ts)
- BISINDO: kamus  $W/blender/kamus_bisindo_<sub>.py   (mis. kamus_bisindo_b1_1.py) — impor: `from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST`
           dek    $D/src/data/dekSilabus/bisindo-<sub>.ts
Kedua kamus sudah otomatis mengimpor berkas B1–B2 kalau berkasnya ada (kamus rusak → baris "KAMUS GAGAL" di keluaran).

## Baca dulu
- Silabus sublevelmu (judul + topik tiap sesi): $D/src/data/silabus/<asl|bisindo>.ts
- Kode isyarat yang SUDAH ADA (A1–A2, pakai ulang sebanyak mungkin!): $W/KODE_ASL.txt atau $W/KODE_BISINDO.txt
- Format kamus: $W/blender/kamus.py (ASL, S()/k()/lingkar()/bolak()/cermin(), WAJAH: netral, senang, ya_tidak,
  wh, sedih, tidur) dan contoh sublevel: $W/blender/kamus_a2_4.py / $W/blender/kamus_bisindo_a2_4.py
  (BISINDO: S() punya argumen `ragu=True`).
- $W/blender/isyarat.py — BENTUK (handshape), TITIK tubuh (dahi, pelipis, mata, pipi, hidung, telinga, mulut,
  sudut_mulut, dagu, rahang, leher, dada, dada_kanan/kiri, bahu_kanan/kiri, perut, netral, netral_kiri, tengah,
  samping, eja, angka …), anchor tangan (telapak, punggung, buku, sisi_telunjuk, sisi_kelingking, tumit,
  jari_telunjuk, jari_tengah, jari_kelingking, ujung, pergelangan, jempol …), arah (atas, bawah, depan,
  belakang, dalam, luar).
- Dek contoh (pola slide yang HARUS diikuti, salin header + helper persis): $D/src/data/dekSilabus/asl-a2-4.ts
  atau bisindo-a2-4.ts.
- Referensi brief lama yang lebih rinci: $W/BRIEF.md (ASL) / $W/BRIEF_BISINDO.md (BISINDO) — aturan akurasinya tetap berlaku.

## Bagian 1 — isyarat baru (Blender)
- KODE BARU WAJIB berawalan sublevelmu: B11_, B12_, … B27_ (mis. `B13_ARGUMENT`, `B21_PEMERINTAH`), karena
  agen lain menulis sublevel lain bersamaan. JANGAN mendefinisikan ulang kode yang sudah ada di KODE_*.txt
  (pakai saja). `gloss=` isi gloss tampilan (mis. gloss="ARGUMENT") supaya awalan tak tampil.
- Target ±30–50 isyarat baru per sublevel (kosakata inti topik sesi); sisanya pakai ulang kode A1–A2.
  Kata yang memang dieja jari / tanpa isyarat baku: S(kode, …, [], cara="Dieja jari: …") (tanpa gerak = dieja otomatis).
- ASL: bentuk sitasi ASL standar (Lifeprint/HandSpeak). BISINDO: bentuk BISINDO yang umum (BUKAN bentuk ASL),
  banyak ikonik + gerak bibir; setiap isyarat yang bentuknya tidak kamu yakini/bervariasi daerah WAJIB `ragu=True`.
  Riset lewat WebSearch/WebFetch boleh. Lebih baik jujur ragu daripada terlihat pasti.
- Bentuk tangan baru → I.BENTUK.update dengan nama berawalan sublevel (mis. "B13_…").
- Cek visual (render 3 bingkai per isyarat):
    B=/Applications/Blender.app/Contents/MacOS/Blender
    cd $W && [KAMUS=kamus_bisindo] $B -b out/avatar.blend --python blender/tanda.py -- out/cek-<bhs>-<sub> KODE1,KODE2 --cek 2>&1 | grep -E "Error|Traceback|PANGGANG|GAGAL"
    → out/cek-<bhs>-<sub>/cek/<KODE>_{0,1,2}.png (opsi --sudut samping|atas|eja|eja2). Lembar kontak: ./sheet.sh out.png 6 f1.png …
  LIHAT gambarnya (Read tool, sebaiknya lembar kontak per ±8–12 isyarat) dan perbaiki: tangan di lokasi benar, tak
  menembus badan/kepala, bentuk tangan terbaca. Semua isyarat baru minimal dirender & dilihat sekali.
  ⚠️ JANGAN jalankan tanda.py TANPA --cek (itu mengekspor GLB bersama). Hapus out/cek-<bhs>-<sub> sesudah dilihat.
- JANGAN sunting kamus.py, kamus_bisindo.py, isyarat.py, tanda.py, atau berkas sublevel lain.

## Bagian 2 — dek slide
16 sesi, kunci 1..16, heading slide title = "Sesi N · <judul silabus PERSIS>". Tiap sesi 8–10 slide: title →
"Tujuan sesi ini" (points) → ≥1 kamus() (≥6 isyarat, isi ke-4 `cara` singkat) → dialog() Rio (A) & Mia (B)
4–8 baris (urut = kode klip berurutan; "#NAMA" dieja jari; wajah "ya_tidak" / "wh") → pattern (tata bahasa,
≥3 contoh) → points budaya/tips → practice (questions+answers) → quiz (≥4 soal, 3–4 opsi, TIAP soal punya
`explain`, posisi jawaban benar bervariasi) → recap + homework. ±2 slide isyarat per sesi; sesi review/proyek
tetap punya slide isyarat. Tingkat B1–B2: dialog lebih panjang (6–8 baris), tata bahasa lebih dalam, diskusi.
Konten harus BENAR (linguistik & budaya Tuli); pakai "Tuli" (T besar). Jangan mengarang fakta, tanggal, nama
tokoh, statistik — kalau ragu, jangan tulis. Untuk BISINDO sampaikan tata bahasa dengan hati-hati ("umumnya",
"sering") dan sarankan menanyakan variasi daerah ke pengajar Tuli.
Semua kode di slide isyarat WAJIB ada di kamus (milikmu atau KODE_*.txt). Jangan memakai kode B1x_/B2x_ milik
sublevel lain (mungkin belum ada).

## Validasi (dari $D), tiap sublevel
  node --import tsx scripts/cek-dek-silabus.ts <asl|bisindo> <b1-1>                         → target 0 masalah
  [KAMUS=kamus_bisindo] node --import tsx $W/cek_kode.mjs $PWD/src/data/dekSilabus/<bhs>-<sub>.ts  → 0 hilang

## Aturan
- Jangan git commit/push, jangan sunting berkas selain 4 berkasmu (2 kamus + 2 dek) dan out/cek-*.
- Jangan buat worktree, jangan npm install, jangan jalankan build/tsc proyek.
- Kalau waktu/konteks hampir habis, pastikan berkas yang sudah ditulis tetap valid (sintaks benar).
- Laporan akhir (ringkas, ≤12 baris): per sublevel jumlah isyarat baru (berapa ragu), jumlah slide, hasil 2
  validasi, dan isyarat yang paling meragukan.
