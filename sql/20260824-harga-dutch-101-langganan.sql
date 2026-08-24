-- [harga-new-edition-langganan-v1]
-- Dutch 101 new edition (slug modul-belanda-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang sama-sama
-- edisi baru — Japanese 101, Spanish 101, English 101, Deutsch 101, Mandarin
-- 101, Italiano 101, Français 101, Dansk 101 dan Korean 101 — sudah berformat
-- langganan 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: pembelian yang sudah ada bisa menunjuk ke id-nya
-- lewat digital_purchases.pricing_id (per 24 Agu 2026 ada satu baris Lunas atas
-- nama barsalriz@gmail.com). Cukup dinonaktifkan — akses pembeli menempel di
-- digital_purchases.expires_at, bukan di baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '15d7ed08-16a1-4d8c-b2d5-9942a68c0c75';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('8e32c0ad-cc9e-4193-97f5-8c3bac51cd95',  79000,  180, '6 Bulan',   1, true),
  ('8e32c0ad-cc9e-4193-97f5-8c3bac51cd95', 149000,  365, '12 Bulan',  2, true),
  ('8e32c0ad-cc9e-4193-97f5-8c3bac51cd95', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '8e32c0ad-cc9e-4193-97f5-8c3bac51cd95'
--  order by is_active desc, sort_order;
