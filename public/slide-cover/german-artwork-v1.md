# Jerman A1.1 — ilustrasi slide

Dibuat 12 Oktober 2026 menggunakan image generation bawaan Codex, dengan referensi cover Mandarin A1.1 sesi 1. Gaya ilustrasi cute, rounded, warna teal/coral/gold, ruang teks yang lega.

- Slide 1 tiap sesi: `german-a1-1-sesi-N.jpg`, ilustrasi pembuka unik dengan ruang judul putih di atas.
- Slide 2 tiap sesi: `german-a1-1-sesi-N-tujuan.jpg`, ilustrasi berbeda dengan ruang tujuan di kiri.
- Slide 3 sampai akhir: `german-latar.jpg`, satu latar ivory/aqua bersama dengan dekorasi kecil di sudut.
- 33 JPEG 1600×900 di `public/slide-cover/`; salinan identik di repo landing untuk materi tersimpan siswa.
- Berlaku hanya untuk 16 sesi Jerman A1.1. Isi materi dan level lainnya tidak diubah.

Prompt dan sumber gambar tercatat di `german-a1-1-artwork.json`.

Validasi: `node --import tsx scripts/cek-slide-jerman.ts` memeriksa loader produksi, 32 hash gambar berbeda, JPEG, tujuan utuh, latar slide 3+, serta simpan/buka ulang.
