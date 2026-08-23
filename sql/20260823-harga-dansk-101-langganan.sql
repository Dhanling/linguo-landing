-- [harga-new-edition-langganan-v1]
-- Dansk 101 new edition (slug dansk-101-a1-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Denmark — katalog belum pernah punya barisnya,
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
  ('cb9559e4-62cd-408c-b737-f796765b4514',  79000,  180, '6 Bulan',   1, true),
  ('cb9559e4-62cd-408c-b737-f796765b4514', 149000,  365, '12 Bulan',  2, true),
  ('cb9559e4-62cd-408c-b737-f796765b4514', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'cb9559e4-62cd-408c-b737-f796765b4514'
--  order by sort_order;
