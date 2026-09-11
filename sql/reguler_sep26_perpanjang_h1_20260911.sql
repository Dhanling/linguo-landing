-- 11 Sep 2026 — perpanjangan pendaftaran Kelas Reguler Batch September 2026.
-- Dulu semua batch tutup serentak 10 Sep 23:59 WIB. Pita hitung mundur
-- (BatchRegulerTopBar), /jadwal-kelas-reguler & chat Ling/CS semuanya membaca
-- closes_at, jadi cukup kolom ini yang digeser. Keduanya sudah dijalankan di prod.

-- (1) Pertama: tiap batch sampai H-1 kelas pertamanya (23:59:59 WIB).
update regular_batches
set closes_at = ((start_date - 1)::date + time '23:59:59') at time zone 'Asia/Jakarta'
where is_published
  and status in ('Open', 'Confirmed')
  and batch_month = '2026-09-01'
  and closes_at = '2026-09-10 16:59:59+00';

-- (2) Revisi hari yang sama: semua batch dibuka sampai 19 Sep 23:59:59 WIB,
-- termasuk yang kelasnya mulai 14–18 Sep (boleh gabung menyusul). Halaman jadwal
-- & batchTag bot sekarang mengikuti closes_at walau start_date sudah lewat.
update regular_batches
set closes_at = timestamptz '2026-09-19 23:59:59+07'
where is_published
  and status in ('Open', 'Confirmed')
  and batch_month = '2026-09-01';
