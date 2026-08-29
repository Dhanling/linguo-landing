-- [harga-new-edition-langganan-v1]
-- Italian 103 new edition (slug italiano-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Italia. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Italian 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('fe39561e-e38f-4419-8b74-d8794e86243a',  79000,  180, '6 Bulan',   1, true),
  ('fe39561e-e38f-4419-8b74-d8794e86243a', 149000,  365, '12 Bulan',  2, true),
  ('fe39561e-e38f-4419-8b74-d8794e86243a', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'fe39561e-e38f-4419-8b74-d8794e86243a'
--  order by sort_order;
