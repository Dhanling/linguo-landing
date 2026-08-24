-- [harga-new-edition-langganan-v1]
-- Tiếng Việt 101 new edition memakai SLUG LAMA `modul-vietnam-101-id`, jadi
-- baris harganya sudah ada: satu tier warisan "Lifetime Rp99.000".
--
-- ⚠️ Tier warisan itu SUDAH PUNYA PEMBELI (digital_purchases.pricing_id
-- menunjuknya), jadi ia TIDAK BOLEH DIHAPUS — cukup dinonaktifkan supaya
-- berhenti dijual tanpa memutus riwayat pembelian.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk/
-- Norsk/Suomi 101 new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1. Arsipkan tier warisan (JANGAN delete).
update digital_product_pricing
   set is_active = false
 where id = '71a63bcf-3b68-40e6-92a6-1ab5882060ca';

-- 2. Pasang tiga tier langganan.
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('67b9d3c8-e61d-4cde-a7df-f850a2a27411',  79000,  180, '6 Bulan',   1, true),
  ('67b9d3c8-e61d-4cde-a7df-f850a2a27411', 149000,  365, '12 Bulan',  2, true),
  ('67b9d3c8-e61d-4cde-a7df-f850a2a27411', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris warisan nonaktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '67b9d3c8-e61d-4cde-a7df-f850a2a27411'
--  order by is_active desc, sort_order;
