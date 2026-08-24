-- [harga-new-edition-langganan-v1]
-- Magyar 101 new edition (slug modul-hungaria-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang sama-sama
-- edisi baru — Japanese 101, Spanish 101, English 101, Deutsch 101, Mandarin 101,
-- Italiano 101, Français 101, Dansk 101, dan Korean 101 — sudah berformat
-- langganan 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus, cukup dinonaktifkan: kalau nanti ada pembelian yang
-- menunjuk ke id-nya lewat digital_purchases.pricing_id, aksesnya menempel di
-- digital_purchases.expires_at, bukan di baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = 'a742815e-a6b3-4650-a662-7e93ce82204d';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('27d63ff7-6c1c-4aa8-8fc4-2830ef3e8047',  79000,  180, '6 Bulan',   1, true),
  ('27d63ff7-6c1c-4aa8-8fc4-2830ef3e8047', 149000,  365, '12 Bulan',  2, true),
  ('27d63ff7-6c1c-4aa8-8fc4-2830ef3e8047', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '27d63ff7-6c1c-4aa8-8fc4-2830ef3e8047'
--  order by is_active desc, sort_order;
