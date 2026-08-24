-- [harga-new-edition-langganan-v1]
-- Suomi 101 new edition (slug suomi-101-a1-id) adalah modul buatan sendiri
-- PERTAMA untuk bahasa Finlandia dalam edisi Indonesia. Katalog cuma punya baris
-- English Edition (modul-finlandia-101-en) yang tak disentuh sama sekali,
-- jadi tak ada tier "Lifetime Rp99.000" warisan yang perlu diarsipkan.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk 101
-- new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('04b6a39c-2d72-45fa-8cd4-c7c364ec03e5',  79000,  180, '6 Bulan',   1, true),
  ('04b6a39c-2d72-45fa-8cd4-c7c364ec03e5', 149000,  365, '12 Bulan',  2, true),
  ('04b6a39c-2d72-45fa-8cd4-c7c364ec03e5', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '04b6a39c-2d72-45fa-8cd4-c7c364ec03e5'
--  order by sort_order;
