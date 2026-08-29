-- [harga-new-edition-langganan-v1]
-- Dansk 103 new edition (slug dansk-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Denmark. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Dansk 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('64ed3ad8-6fa4-4fd3-abb3-420434648999',  79000,  180, '6 Bulan',   1, true),
  ('64ed3ad8-6fa4-4fd3-abb3-420434648999', 149000,  365, '12 Bulan',  2, true),
  ('64ed3ad8-6fa4-4fd3-abb3-420434648999', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '64ed3ad8-6fa4-4fd3-abb3-420434648999'
--  order by sort_order;
