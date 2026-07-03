# Linguo Landing — CLAUDE.md

## Tentang Project
Website utama Linguo (linguo.id) — online language school dengan 60+ bahasa.
Stack: Next.js, Tailwind CSS, Supabase, Vercel (auto-deploy dari main branch).

## Brand
- Teal utama: #1A9E9E
- Jangan ganti warna brand tanpa instruksi eksplisit

## Supabase
- Project ID: jbtgciepdmqxxcjflrxz
- Jangan hapus atau modifikasi migration files tanpa konfirmasi

## Struktur Penting
- /app — halaman Next.js (App Router)
- /components — reusable components
- /lib — utility functions & Supabase client
- /public — static assets
- languages.ts — daftar bahasa yang tersedia (jangan hapus entry yang ada)

## Rules
- JANGAN hapus file .env atau .env.local
- JANGAN commit langsung ke main tanpa instruksi
- JANGAN ubah schema Supabase langsung dari sini
- Selalu pakai bahasa Indonesia untuk komentar & pesan commit
- Pesan commit format: "feat/fix/chore: deskripsi singkat"

## Deploy
- Push ke main → auto-deploy ke Vercel
- Cek build error sebelum push kalau ada perubahan besar
