-- 11 Sep 2026 — perpanjangan pendaftaran Kelas Reguler Batch September 2026.
-- Dulu semua batch tutup serentak 10 Sep 23:59 WIB; sekarang tiap batch masih
-- bisa didaftar sampai H-1 kelas pertamanya (23:59:59 WIB). Pita hitung mundur
-- (BatchRegulerTopBar), /jadwal-kelas-reguler & chat Ling/CS semuanya membaca
-- closes_at, jadi cukup kolom ini yang digeser. Sudah dijalankan di prod.
update regular_batches
set closes_at = ((start_date - 1)::date + time '23:59:59') at time zone 'Asia/Jakarta'
where is_published
  and status in ('Open', 'Confirmed')
  and batch_month = '2026-09-01'
  and closes_at = '2026-09-10 16:59:59+00';
