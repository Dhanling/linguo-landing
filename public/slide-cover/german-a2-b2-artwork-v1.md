# Cover Jerman A2–B2

507 dari 512 cover selesai melalui image generation bawaan Codex, JPEG 1600×900. Prompt dan sumber setiap gambar tercatat di german-a2-b2-artwork.json. Aset berada di public/slide-cover/ pada dashboard dan landing.

A2.1–A2.4, B1.1–B1.5, B2.1–B2.6 lengkap: 240 sesi, 480 cover aktif. Setiap sesi memiliki cover slide 1 dan 2 berbeda; slide 3+ memakai german-latar.jpg bersama. Gaya cute minimalist mengikuti palet referensi Mandarin A1.1; karakter dan properti sesuai topik, tanpa maskot alfabet.

B2.7 memiliki 27 dari 32 gambar tersimpan, belum diaktifkan. Lima tertunda akibat usage_limit_reached pada generator bawaan Codex, reset yang dilaporkan 13 Oktober 2026 pukul 05:49:46 WIB: tujuan sesi 13, 14, 15; cover dan tujuan sesi 16. Setelah dibuat, review B2.7, tambah german-b2-7 pada mapping, lalu jalankan tes all dan deploy kedua repo.

Validasi aktif: node --import tsx scripts/cek-slide-jerman-lanjutan.ts ready. Pemeriksaan TypeScript umum masih gagal pada kesalahan lama supabase/functions/suggest-reply/index.ts:177.
