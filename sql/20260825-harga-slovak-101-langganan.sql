-- [harga-new-edition-langganan-v1]
-- Slovak 101 new edition (slug modul-slovak-101-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Slowakia — katalog belum pernah punya barisnya,
-- jadi tak ada tier "Lifetime Rp99.000" warisan yang perlu diarsipkan.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano 101
-- new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Kembarannya dalam JS: scripts/harga-slovak-101-langganan.mjs
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('1e3e7e5a-f40d-4858-a704-300ef1b50558',  79000,  180, '6 Bulan',   1, true),
  ('1e3e7e5a-f40d-4858-a704-300ef1b50558', 149000,  365, '12 Bulan',  2, true),
  ('1e3e7e5a-f40d-4858-a704-300ef1b50558', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '1e3e7e5a-f40d-4858-a704-300ef1b50558'
--  order by sort_order;
