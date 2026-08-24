-- [harga-new-edition-langganan-v1]
-- Norsk 101 new edition memakai ULANG baris katalog modul Norwegia lama
-- (slug modul-norwegia-101-id). Baris harga warisannya "Lifetime Rp99.000"
-- DINONAKTIFKAN, bukan dihapus — digital_purchases.pricing_id bisa menunjuk
-- ke id-nya, dan akses pembeli lama menempel di expires_at.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Mandarin/
-- Korean/Dansk 101 new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

update digital_product_pricing
   set is_active = false
 where id = 'a17379e5-a715-4a15-87b3-d3e8955fadc9';  -- Lifetime Rp99.000

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('fe0ed796-fa3c-4cf1-848a-7ecc8211dad1',  79000,  180, '6 Bulan',   1, true),
  ('fe0ed796-fa3c-4cf1-848a-7ecc8211dad1', 149000,  365, '12 Bulan',  2, true),
  ('fe0ed796-fa3c-4cf1-848a-7ecc8211dad1', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'fe0ed796-fa3c-4cf1-848a-7ecc8211dad1'
--  order by sort_order;
