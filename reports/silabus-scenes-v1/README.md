# Silabus berilustrasi semua bahasa

Halaman `/silabus/[lang]` mengikuti susunan bahasa Inggris: header, pilihan level/chapter, serta kartu sesi yang bisa dibuka untuk membaca topik. Karakter berbeda untuk masing-masing bahasa dan ilustrasi tidak memakai dekorasi daun.

Chapter awal memakai 16 adegan khusus berdasarkan judul dan topik sesi asli setiap bahasa. Header dan chapter lanjutan memakai set adegan sesuai materi (alfabet, sapaan, keluarga, tata bahasa, waktu, makanan, perjalanan, dan lainnya). Karakter dipertahankan konsisten dalam satu bahasa.

Gambar dibuat dengan Imagegen bawaan Codex dan disimpan sebagai atlas WebP. Prompt, profil karakter, sesi sumber, dan metadata hasil tersimpan di folder laporan ini serta `reports/silabus-first-chapter-v1/`. Browser mengunduh dua gambar per bahasa, bukan satu gambar besar untuk tiap kartu.

Validasi: `scripts/cek-silabus-scenes.mjs` memeriksa kelengkapan, ukuran, dan keunikan aset seluruh bahasa; pengujian komponen memeriksa 55 bahasa, tujuan pendaftaran/placement test, dan adegan berbeda untuk 16 sesi chapter awal. Interaksi level, chapter, buka/tutup topik, gambar, dan lebar mobile juga diperiksa dengan browser headless.
