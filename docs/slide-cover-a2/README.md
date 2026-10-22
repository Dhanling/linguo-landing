# Cover materi 23 bahasa — A1.1 sampai A2.4

Desain SVG vector asli: dua pelajar cute, objek sesuai topik sesi, siluet tempat
yang sederhana, dan latar tenang. Teal brand `#1A9E9E` tetap menjadi aksen utama.
Area atas sampul disisakan untuk logo dan judul putih; halaman tujuan menyediakan
ruang teks di sisi kiri. Latar isi lebih tenang lagi agar panel materi mudah dibaca.

## Cakupan

Jepang, Korea, Prancis, Arab, Ibrani, Persia, Jawa, Sunda, BIPA, Georgia, Yunani,
Rusia, Swedia, Norwegia, Denmark, Finlandia, Polandia, Hungaria, Rumania, Turki,
Bulgaria, Ukraina, dan Islandia.

- 23 bahasa × 7 sublevel × 16 sesi = 2.576 sesi.
- 5.152 sampul/tujuan berbeda berkas, ditambah 23 latar isi = 5.175 SVG per repo.
- Komposisi mengikuti jenis halaman; ilustrasi dengan topik sama berbagi sistem
  bentuk dan objek, dengan variasi pose dan warna. Bukan 5.152 ilustrasi manual
  yang sepenuhnya berbeda.
- Semua aset SVG mandiri berukuran 1600 × 900, tanpa font, skrip, atau sumber luar.
- Ilustrasi dibuat sebagai vector melalui kode; tidak memakai Imagegen/API.
- Judul, tujuan, nomor sesi, isi materi, dan badge berasal dari dek aslinya.
- Aset lama dipertahankan. Desain baru hanya dipilih untuk 23 bahasa A1–A2.

Peta sesi, judul silabus, judul materi jika tersedia, tema, dan URL ada di
`manifest.json`. Pratinjau sampul dan tujuan untuk setiap bahasa ada di
`pratinjau.jpg`. Generator memakai judul dek yang tersedia sebagai acuan tema;
untuk dek yang belum ada, judul silabus menjadi acuannya.

## Ketersediaan materi

Pada saat dibuat, 141 dek / 2.256 sesi sudah tersedia. Materi A2.1–A2.4 untuk
Ibrani, Persia, Jawa, Sunda, dan BIPA belum tersedia (20 dek / 320 sesi).
Cover untuk semuanya sudah dibuat. Peta artwork akan mengaktifkannya otomatis
ketika dek tersebut ditambahkan; pekerjaan ini tidak membuat isi pelajaran.

`src/data/cuteVectorA2Artwork.ts` diprioritaskan oleh `artworkDek` pada dashboard.
Build menghasilkan JSON siswa lewat `scripts/dek-siswa-json.ts`, sehingga materi
siap pakai di dashboard siswa ikut memakai pasangan cover yang sama.
SVG disalin ke public landing dan dashboard agar tidak bergantung pada fallback.
Materi lama yang sudah disimpan ke kelas tidak diubah di database.

## Pembuatan ulang dan pemeriksaan

Dari repo dashboard (memerlukan TypeScript):

```sh
node scripts/build-cover-a2.cjs /path/linguo-landing /path/linguo-admin-dashboard
node --import tsx scripts/dek-ke-json.ts
node --import tsx scripts/cek-cover-a2.ts /path/linguo-landing
node --import tsx scripts/dek-siswa-json.ts
npm run build
```

Pemeriksaan memastikan seluruh pasangan tersedia dan identik di kedua repo,
URL lolos normalisasi, halaman tujuan memakai ruang kiri, latar isi terpasang,
rentang bahasa/sublevel/sesi dibatasi, dan artwork bahasa lain tidak tertimpa.
Seluruh SVG juga diperiksa dengan rasterisasi; pratinjau lintas bahasa ditinjau visual.
