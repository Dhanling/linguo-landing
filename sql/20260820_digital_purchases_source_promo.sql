-- [pustaka-promo-kode-v1 · fix] Izinkan source = 'promo' di digital_purchases.
--
-- Gejala: kode promo (mis. FREEEBOOK) di Perpustakaan /akun selalu gagal dengan
-- "Gagal menerbitkan akses. Coba lagi sebentar." Penyebabnya bukan kode promonya —
-- /api/promo-digital menulis baris dengan source = 'promo', sementara CHECK
-- constraint `digital_purchases_source_check` cuma mengenal 4 nilai lama
-- (xendit / lynk_legacy / manual / class_bundle), jadi INSERT-nya ditolak 23514.
--
-- 'promo' sengaja jadi nilai tersendiri (bukan 'manual') supaya baris hadiah bisa
-- dihitung terpisah: jatah maksPerAkun di /api/promo-digital menghitung baris
-- ber-source 'promo', dan laporan omzet tidak ikut menghitungnya sebagai penjualan.
alter table public.digital_purchases
  drop constraint if exists digital_purchases_source_check;

alter table public.digital_purchases
  add constraint digital_purchases_source_check
  check (source = any (array['xendit','lynk_legacy','manual','class_bundle','promo']));
