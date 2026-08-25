-- [harga-new-edition-langganan-v1]
-- Čeština 101 new edition (slug cestina-101-a1-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Ceko — katalog belum pernah punya barisnya,
-- jadi tak ada tier "Lifetime Rp99.000" warisan yang perlu diarsipkan.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano 101
-- new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('78252f01-2c21-4dfb-b7fc-a847a9650f41',  79000,  180, '6 Bulan',   1, true),
  ('78252f01-2c21-4dfb-b7fc-a847a9650f41', 149000,  365, '12 Bulan',  2, true),
  ('78252f01-2c21-4dfb-b7fc-a847a9650f41', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '78252f01-2c21-4dfb-b7fc-a847a9650f41'
--  order by sort_order;
