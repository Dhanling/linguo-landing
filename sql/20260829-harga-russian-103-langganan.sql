-- [harga-new-edition-langganan-v1]
-- Russian 103 new edition (slug russian-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Rusia. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Russian 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('32b89415-552a-4c9e-83ed-1a68274ee9f9',  79000,  180, '6 Bulan',   1, true),
  ('32b89415-552a-4c9e-83ed-1a68274ee9f9', 149000,  365, '12 Bulan',  2, true),
  ('32b89415-552a-4c9e-83ed-1a68274ee9f9', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '32b89415-552a-4c9e-83ed-1a68274ee9f9'
--  order by sort_order;
