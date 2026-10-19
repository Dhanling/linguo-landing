-- [akun-student-kembar-v2] 19 Okt 2026 — Anisa Kristy Mega Aulia (kristyanisa10@gmail.com)
-- Bayar Rp300.000 lewat funnel 18 Okt (Kelas Reguler German A1.1 Rp150rb + Modul E-Book
-- Rp150rb, xendit PAID). Baris digital_purchases e-book "German 101 - A1"
-- (5e1e8240…, source class_bundle) tertinggal "Belum Bayar" / access_granted false,
-- jadi e-book tak muncul di dashboard. Registrasi Reguler-nya lalu dipindah ke Private
-- (b5f2c39d…) 19 Okt — e-book tetap hak siswa.
--
-- Pakai fungsi resmi yang sama dengan xendit-webhook (beriAksesEbookAddon), idempoten:
-- hasil yang diharapkan 'akses lama dihidupkan' (atau 'sudah punya akses' kalau diulang).
select public.grant_ebook_for_registration(
  '6859bed0-2695-4c27-900e-0122ebce2973'::uuid, true, 150000, '2026-10-18'::date);

-- Verifikasi
select id, payment_status, access_granted, expires_at
  from public.digital_purchases
 where id = '5e1e8240-c6b4-44fa-a442-12756fa59584';
