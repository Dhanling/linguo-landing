-- Watch & Learn — metadata video pada cache transkrip (buat tab "Siap").
--
-- Kenapa: tab "Siap" menampilkan video yang transkripnya SUDAH diproses (baca
-- langsung dari cache → instan, tanpa biaya AI / kuota YouTube). Tabel
-- yt_transcripts semula cuma simpan cue; biar bisa ditampilkan sebagai kartu
-- (judul + channel + durasi) tanpa panggil YouTube lagi, simpan metadata ringan
-- ini saat transkrip disimpan. Thumbnail diturunkan dari video_id di client.
--
-- Semua kolom NULLABLE: baris lama (sebelum migrasi) tetap valid; hanya baris
-- yang punya title yang muncul di tab "Siap".
--
-- JALANKAN MANUAL di Supabase SQL editor (project jbtgciepdmqxxcjflrxz).

alter table public.yt_transcripts
  add column if not exists title   text,
  add column if not exists channel text,
  add column if not exists dur     integer;   -- durasi video dalam detik

-- Tab "Siap" mengurutkan video terbaru per bahasa; indeks ini menjaga query
-- `where lang = ? and title is not null order by created_at desc` tetap cepat.
create index if not exists yt_transcripts_ready_idx
  on public.yt_transcripts (lang, created_at desc)
  where title is not null;
