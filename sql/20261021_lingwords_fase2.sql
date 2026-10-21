-- [lingwords-v2] Lingwords fase 2.
-- Jalankan SESUDAH sql/20261020_lingwords.sql. Aman dijalankan ulang.
--
-- 1. word_themes — cache tema per kata (Peta Kata per tema). Tema adalah sifat
--    KATA, bukan siswa, jadi satu baris dipakai bersama semua siswa: kata yang
--    sudah pernah ditandai tak pernah ditanyakan lagi ke AI. Ditulis HANYA oleh
--    rute /api/lingwords-tema (service role); siswa cukup membaca.

create table if not exists public.word_themes (
  lang       text        not null,               -- kode ISO 639-1
  word_key   text        not null,               -- lower(trim(word)), sama dgn student_words
  theme      text        not null check (theme in (
               'makanan', 'keluarga', 'angka_waktu', 'transportasi', 'rumah', 'cuaca',
               'belanja', 'sekolah_kerja', 'sapaan', 'kata_umum', 'lainnya')),
  created_at timestamptz not null default now(),
  primary key (lang, word_key)
);

alter table public.word_themes enable row level security;

drop policy if exists word_themes_select on public.word_themes;
create policy word_themes_select on public.word_themes
  for select to authenticated using (true);
-- Sengaja tanpa policy insert/update/delete: penulisan lewat service role saja.

grant select on public.word_themes to authenticated;

notify pgrst, 'reload schema';
