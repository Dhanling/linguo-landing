-- [harga-new-edition-langganan-v1]
-- Russian 102 new edition (slug russian-102-a2-id) — modul lanjutan tingkat A2
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
  ('8deff7c0-4f80-4bf1-9998-7ba2aa36ef65',  79000,  180, '6 Bulan',   1, true),
  ('8deff7c0-4f80-4bf1-9998-7ba2aa36ef65', 149000,  365, '12 Bulan',  2, true),
  ('8deff7c0-4f80-4bf1-9998-7ba2aa36ef65', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '8deff7c0-4f80-4bf1-9998-7ba2aa36ef65'
--  order by sort_order;
