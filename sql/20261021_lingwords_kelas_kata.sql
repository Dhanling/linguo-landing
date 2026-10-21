-- [lingwords-kelas-kata-v1] Cache kelas kata bersama untuk bar kartu Lingwords
-- (kata benda / kerja / sifat / lainnya). Pola sama dengan word_themes: kelas kata
-- adalah sifat KATA, bukan siswa, jadi satu baris dipakai semua siswa dan kata yang
-- sudah pernah ditandai tak ditanyakan lagi ke AI. Ditulis HANYA oleh rute
-- /api/lingwords-tema (jenis "kelas", service role); siswa cukup membaca.
-- Sebelum dijalankan: kelas kata tetap jalan lewat AI + localStorage per perangkat.

create table if not exists public.word_pos (
  lang       text        not null,               -- kode ISO 639-1
  word_key   text        not null,               -- lower(trim(word)), sama dgn student_words
  pos        text        not null check (pos in ('benda', 'kerja', 'sifat', 'lainnya')),
  created_at timestamptz not null default now(),
  primary key (lang, word_key)
);

alter table public.word_pos enable row level security;

drop policy if exists word_pos_select on public.word_pos;
create policy word_pos_select on public.word_pos
  for select to authenticated using (true);
-- Sengaja tanpa policy insert/update/delete: penulisan lewat service role saja.

grant select on public.word_pos to authenticated;
