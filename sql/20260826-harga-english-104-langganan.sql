-- [harga-new-edition-langganan-v1]
-- English 104 new edition (slug english-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Inggris. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan English 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('82777b58-4a8a-4c0d-bc68-be537af74a97',  79000,  180, '6 Bulan',   1, true),
  ('82777b58-4a8a-4c0d-bc68-be537af74a97', 149000,  365, '12 Bulan',  2, true),
  ('82777b58-4a8a-4c0d-bc68-be537af74a97', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '82777b58-4a8a-4c0d-bc68-be537af74a97'
--  order by sort_order;
