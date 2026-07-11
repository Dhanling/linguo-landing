-- Badge level CEFR di tab "Siap" Watch & Learn.
-- Menambah kolom `level` di yt_transcripts untuk menyimpan estimasi level CEFR
-- (A1–C1) yang dihitung dari transkrip (lihat src/lib/cefr.ts). Diisi lazy oleh
-- route /api/yt-transcript-cache?list=1 saat pertama kali daftar dibaca, lalu
-- dipakai ulang (tak dihitung tiap request).
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz). Idempotent.

alter table public.yt_transcripts
  add column if not exists level text;

-- Verifikasi
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'yt_transcripts'
   and column_name = 'level';
