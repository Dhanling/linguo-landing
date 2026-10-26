# Brief agen: kamus isyarat + dek slide BISINDO satu sublevel [isyarat-bisindo-a1a2-v1]

Linguo (sekolah bahasa online) punya slide ASL A1–A2 dengan avatar 3D VRoid yang memperagakan
isyarat. Sekarang kita membuat versi BISINDO (Bahasa Isyarat Indonesia) A1.1–A2.4 dengan desain
yang SAMA PERSIS (pola slide, helper, tokoh Rio & Mia). Kamu mengerjakan SATU sublevel (lihat
prompt): (1) animasi isyarat BISINDO di Blender, (2) dek slide 16 sesi. Bahasa konten: Indonesia.

Folder:  W=~/linguo-isyarat-work   D=~/linguo-admin-dashboard/.claude/worktrees/bisindo-dek

## Baca dulu
- $W/ALOKASI_BISINDO.md — kode yang BOLEH kamu definisikan (baris sublevelmu saja) + kode yang sudah ada.
- $W/blender/kamus_bisindo.py — kamus BISINDO (abjad jari dua tangan, angka 1–10), S() BISINDO punya
  argumen `ragu=True`. Contoh gaya penulisan isyarat yang lebih banyak: $W/blender/kamus.py dan
  $W/blender/kamus_a1_2.py (ASL — JANGAN disalin bentuknya, hanya teknik penulisannya: S()/k()/lingkar()/
  bolak()/cermin(), bentuk tangan tambahan, WAJAH: netral, senang, ya_tidak, wh, sedih, tidur).
- $W/blender/isyarat.py — BENTUK (handshape), TITIK tubuh (dahi, pelipis, mata, pipi, hidung, telinga,
  mulut, sudut_mulut, dagu, rahang, leher, dada, dada_kanan/kiri, bahu_kanan/kiri, perut, netral,
  netral_kiri, tengah, samping, eja, angka …), anchor tangan (telapak, punggung, buku, sisi_telunjuk,
  sisi_kelingking, tumit, jari_telunjuk, jari_tengah, jari_kelingking, ujung, pergelangan, jempol …),
  kata arah (atas, bawah, depan, belakang, dalam, luar — dalam/luar ikut sisi tangan).
- Dek contoh (pola slide yang HARUS diikuti): $D/src/data/dekSilabus/asl-a1-1.ts dan asl-a2-1.ts.
- Silabus BISINDO: $D/src/data/silabus/bisindo.ts (judul + topik tiap sesi sublevelmu).

## Bagian 1 — isyarat BISINDO (Blender)
Tulis $W/blender/kamus_bisindo_<sub>.py (mis. kamus_bisindo_a1_2.py), diawali:
  from kamus_bisindo import S, k, A, lingkar, bolak, cermin, IST
  import isyarat as I
(kamus_bisindo.py sudah otomatis mengimpor berkasmu.) Definisikan SEMUA kode di baris sublevelmu
di ALOKASI_BISINDO.md, tangan dominan kanan; isi `arti`, `kat`, `cara` (bahasa Indonesia, 1 kalimat,
jelas: bentuk tangan, lokasi, gerak) dan `wajah` bila relevan. Bentuk tangan baru → I.BENTUK.update
dengan nama berawalan sublevel (mis. "B12_…"). JANGAN sunting kamus_bisindo.py, kamus*.py lain,
isyarat.py, tanda.py, berkas sublevel lain.

⚠️ AKURASI — ini yang paling penting. Isyarat BISINDO BERBEDA dari ASL; jangan memakai bentuk ASL
sebagai pengganti. Pakai bentuk BISINDO yang umum dipakai (banyak isyarat BISINDO ikonik: MAKAN =
ujung jari kuncup ke mulut, MINUM = tangan C seperti memegang gelas ke mulut, TIDUR = telapak di pipi
+ kepala miring, RUMAH = dua telapak membentuk atap, dsb.). Riset lewat WebSearch/WebFetch bila
perlu (kata kunci mis. "isyarat BISINDO <kata>", "kamus BISINDO", Pusbisindo, Gerkatin, dataset
BISINDO; sumber gambar/video yang punya keterangan teks). Untuk setiap isyarat yang bentuknya
tidak kamu yakini (atau bervariasi antardaerah) WAJIB pasang `ragu=True` — lebih baik jujur ragu
daripada terlihat pasti. Banyak BISINDO memakai gerak bibir (mouthing) kata Indonesianya; boleh
disebut di `cara` ("sambil mengucapkan 'makan' tanpa suara"). Kata yang di komunitas memang
dieja jari / tak punya isyarat baku (mis. sebagian nama kota) boleh S(kode, …, [], cara="Dieja jari: …")
— entri tanpa gerak = dieja otomatis di slide.

Cek visual (render 3 bingkai per isyarat):
  B=/Applications/Blender.app/Contents/MacOS/Blender
  cd $W && KAMUS=kamus_bisindo $B -b out/avatar.blend --python blender/tanda.py -- out/cek-bis-<sub> KODE1,KODE2 --cek 2>&1 | grep -E "Error|Traceback|PANGGANG"
  → out/cek-bis-<sub>/cek/<KODE>_{0,1,2}.png (opsi --sudut samping|atas|eja|eja2).
  Gabung jadi lembar kontak: ./sheet.sh out.png 6 f1.png f2.png …
LIHAT gambarnya (Read tool) dan perbaiki: tangan di lokasi benar, tidak menembus badan/kepala,
bentuk tangan terbaca, gerak terlihat. Kerjakan per kelompok ±8–12 isyarat; semua isyarat harus
dirender & dilihat minimal sekali. Isyarat dua tangan: isi L=… (cermin() untuk simetris).
⚠️ JANGAN jalankan tanda.py TANPA --cek (itu mengekspor GLB dan menimpa hasil bersama). Disk laptop
tinggal ±3 GB: hapus out/cek-bis-<sub> sesudah dilihat tiap kelompok, dan di akhir.

## Bagian 2 — dek slide
Tulis $D/src/data/dekSilabus/bisindo-<sub>.ts (mis. bisindo-a1-2.ts) meniru asl-a1-1.ts: salin
header (ganti jadi BISINDO) + helper kamus()/dialog()/huruf()/angka() dengan `bahasa: "bisindo"`,
`avatar: "vrm"`; tokoh dialog tetap A = Rio (pria), B = Mia (wanita). 16 sesi, kunci 1..16, heading
slide title = "Sesi N · <judul silabus PERSIS>". Tiap sesi 8–10 slide: title → "Tujuan sesi ini"
(points) → ≥1 kamus() (≥6 isyarat, isi ke-4 `cara` singkat) → dialog() Rio & Mia 4–8 baris (urut =
kode klip berurutan; "#NAMA" dieja jari; wajah "ya_tidak" untuk tanya ya/tidak, "wh" untuk tanya
kata tanya) → pattern (pola/tata bahasa, ≥3 contoh) → points budaya/tips → practice
(questions+answers) → quiz (≥4 soal, TIAP soal punya `explain`) → recap + homework. ±2 slide isyarat
(kamus/dialog) per sesi. Gloss BISINDO huruf besar (gloss = urutan isyarat, bukan kalimat Indonesia
baku; arti = terjemahan Indonesia natural).
Konten harus BENAR: tata bahasa BISINDO hanya yang lazim terdokumentasi (penanda SUDAH/BELUM/AKAN,
ekspresi wajah untuk pertanyaan, gerak bibir, menunjuk untuk kata ganti, pengulangan untuk jamak/
aspek, ruang isyarat); sampaikan dengan bahasa hati-hati ("umumnya", "sering") dan sarankan siswa
menanyakan variasi daerah ke pengajar Tuli. Pakai "Tuli" (T besar), bukan "tunarungu"/"bisu".
Jangan mengarang fakta, tanggal, nama tokoh, atau statistik — kalau tidak yakin, jangan tulis.
Fakta aman: BISINDO ≠ SIBI; Gerkatin & Pusbisindo; UU No. 8/2016 tentang Penyandang Disabilitas;
Hari Bahasa Isyarat Internasional 23 September; Kata Kolok di Desa Bengkala, Bali.
Sesi review/proyek tetap punya slide isyarat (ulang kosakata sublevel).
Semua kode di slide isyarat WAJIB ada di kamus BISINDO (milikmu, kamus_bisindo.py, atau sublevel
lain di ALOKASI_BISINDO.md — milik sublevel lain yang belum ditulis tetap boleh dipakai).

Validasi (dari $D):
  node --import tsx scripts/cek-dek-silabus.ts bisindo <a1-2>        → target 0 masalah
  KAMUS=kamus_bisindo node --import tsx $W/cek_kode.mjs $PWD/src/data/dekSilabus/bisindo-<sub>.ts
  (kode "hilang" milik sublevel lain di ALOKASI_BISINDO.md boleh — sebutkan di laporan)

## Aturan
- Jangan git commit/push, jangan sunting berkas lain selain dua berkasmu (dan out/cek-bis-<sub>).
- Jangan buat worktree, jangan npm install, jangan jalankan build.
- Laporan akhir (ringkas): jumlah isyarat dibuat (berapa ragu=True), jumlah slide, hasil 2 validasi,
  kode sublevel lain yang kamu pakai, dan sumber rujukan yang benar-benar kamu pakai.
