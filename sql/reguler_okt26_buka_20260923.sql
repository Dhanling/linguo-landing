-- 23 Sep 2026 — membuka Kelas Reguler gelombang OKTOBER 2026.
--
-- Keputusan tim: bahasa, hari, jam, durasi, jumlah sesi & harga PERSIS sama
-- dengan batch September; yang digeser cuma tanggalnya, tepat 4 minggu (+28
-- hari) supaya hari kelas tiap bahasa tidak berubah (Isyarat tetap Senin, Arab
-- tetap Selasa, dst). Pekan mulainya jadi 12–18 Okt 2026 — konsisten dengan
-- pola pekan Senin ke-2 tiap bulan (Agu: 10 Agt · Sep: 14 Sep · Okt: 12 Okt).
--
-- Pendaftaran DIBUKA SEKARANG (opens_at = now) dan tutup H-1 kelas pertama
-- tiap bahasa, 23:59:59 WIB — sama seperti keputusan 11 Sep 2026. Pita hitung
-- mundur landing, /jadwal-kelas-reguler, panel Pembayaran WA Inbox, dan blok
-- "JADWAL BATCH REGULER" di ketiga bot semuanya membaca tabel ini, jadi tak ada
-- daftar jadwal yang perlu ditulis ulang di kode.
--
-- teacher_id ikut disalin (pola Agu→Sep juga begitu). Catatan: batch September
-- baru selesai 2–8 Nov, jadi slot hari/jam yang sama tumpang tindih ~4 pekan —
-- pengajar yang sudah terisi perlu dicek/ditugaskan ulang lewat menu Reguler.
--
-- Idempoten: NOT EXISTS di bawah bikin skrip ini aman dijalankan dua kali.

insert into regular_batches (
  batch_code, batch_month, language, level, teacher_id,
  session_day, session_start_time, session_end_time, session_duration_min,
  total_sessions, start_date, end_date,
  price_small_group, price_regular,
  min_capacity, small_group_max, max_capacity,
  status, is_published, opens_at, closes_at
)
select
  replace(s.batch_code, 'SEP26', 'OCT26'),
  '2026-10-01',
  s.language, s.level, s.teacher_id,
  s.session_day, s.session_start_time, s.session_end_time, s.session_duration_min,
  s.total_sessions,
  s.start_date + 28,
  s.end_date + 28,
  s.price_small_group, s.price_regular,
  s.min_capacity, s.small_group_max, s.max_capacity,
  'Open', true, now(),
  ((s.start_date + 27)::date + time '23:59:59') at time zone 'Asia/Jakarta'
from regular_batches s
where s.batch_month = '2026-09-01'
  and not exists (
    select 1 from regular_batches x
    where x.batch_code = replace(s.batch_code, 'SEP26', 'OCT26')
  );
