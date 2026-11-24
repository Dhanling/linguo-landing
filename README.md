# Linguo Landing

Website utama [linguo.id](https://linguo.id) — sekolah bahasa online dengan 60+ bahasa.

## Stack
- Next.js 16 (App Router) + React 19
- Tailwind CSS
- Supabase
- Vercel (auto-deploy dari branch `main`)

## Menjalankan di lokal

Butuh **Node.js 20.9 atau lebih baru**.

1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Buat berkas `.env.local` di root repo dan isi minimal:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   Minta nilainya ke admin. Tanpa dua variabel ini setiap halaman gagal (error 500).
   Fitur AI (mis. /konsultasi) butuh kunci tambahan seperti `DEEPSEEK_API_KEY`.
   **Jangan pernah commit `.env.local`.**
3. Jalankan server dev:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

## Alur kerja
1. Buat branch baru dari `main`.
2. Commit perubahan dalam **bahasa Indonesia**, format `feat/fix/chore(scope opsional): deskripsi singkat`.
3. Jalankan `npm run build` untuk cek error build sebelum push (wajib untuk perubahan besar).
4. Buka Pull Request; cek preview Vercel sebelum merge.
5. Merge ke `main` → otomatis deploy ke linguo.id.
