# Jerman A2 — cover sesuai topik

64 sesi A2.1–A2.4, 128 gambar unik dari image generation bawaan Codex. Referensi gaya: cover Mandarin A1.1, dengan karakter manusia cute dan palet teal/coral/gold. Tidak memakai maskot alfabet.

- Slide 1: `german-a2-N-sesi-S-v1.jpg`; adegan sesuai topik dan ruang judul di atas.
- Slide 2: `german-a2-N-sesi-S-tujuan-v1.jpg`; adegan berbeda dan ruang tujuan di kiri.
- Slide 3 sampai akhir: satu `german-latar.jpg` bersama.
- JPEG 1600×900 disimpan di `public/slide-cover/` dashboard dan disalin identik ke repo landing agar terbaca pada materi tersimpan siswa.
- Prompt final serta sumber 128 gambar tercatat di `german-a2-artwork.json`.

Validasi: `node --import tsx scripts/cek-slide-jerman-lanjutan.ts a2` memeriksa 128 hash gambar berbeda, loader produksi, isi tujuan, latar slide 3+, serta simpan/buka ulang.
