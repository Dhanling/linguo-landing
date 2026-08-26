-- [harga-new-edition-langganan-v1]
-- Spanish 104 new edition (slug espanol-104-b2-id) — modul lanjutan tingkat B2
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
  ('45362c95-c76d-46b1-84c0-b7d11f5589f8',  79000,  180, '6 Bulan',   1, true),
  ('45362c95-c76d-46b1-84c0-b7d11f5589f8', 149000,  365, '12 Bulan',  2, true),
  ('45362c95-c76d-46b1-84c0-b7d11f5589f8', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '45362c95-c76d-46b1-84c0-b7d11f5589f8'
--  order by sort_order;
