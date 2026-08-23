-- [harga-new-edition-langganan-v1]
-- Français 101 new edition (slug modul-prancis-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang sama-sama
-- edisi baru — Japanese 101, Spanish 101, English 101, Deutsch 101, Mandarin 101,
-- dan Italiano 101 — sudah berformat langganan 6/12 bulan + opsi selamanya.
-- Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: pembelian Muhammad Yanuar Yusuf
-- (yanuaryusuf1945@gmail.com) menunjuk ke id-nya lewat
-- digital_purchases.pricing_id. Cukup dinonaktifkan — aksesnya menempel di
-- digital_purchases.expires_at, bukan di baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = 'c4195a23-8fdc-4162-afb2-7ededb96eab0';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('294f32f3-7411-4bd4-bcb8-0fa330ddca24',  79000,  180, '6 Bulan',   1, true),
  ('294f32f3-7411-4bd4-bcb8-0fa330ddca24', 149000,  365, '12 Bulan',  2, true),
  ('294f32f3-7411-4bd4-bcb8-0fa330ddca24', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '294f32f3-7411-4bd4-bcb8-0fa330ddca24'
--  order by is_active desc, sort_order;
