-- [harga-new-edition-langganan-v1]
-- Spanish 103 new edition (slug espanol-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Spanyol. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Spanish 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('7b7c63d9-84d3-4b56-ab23-a69fe30905eb',  79000,  180, '6 Bulan',   1, true),
  ('7b7c63d9-84d3-4b56-ab23-a69fe30905eb', 149000,  365, '12 Bulan',  2, true),
  ('7b7c63d9-84d3-4b56-ab23-a69fe30905eb', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '7b7c63d9-84d3-4b56-ab23-a69fe30905eb'
--  order by sort_order;
