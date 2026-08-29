-- [harga-new-edition-langganan-v1]
-- Russian 104 new edition (slug russian-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Rusia. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Russian 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('3b64bc33-8ce1-4c88-940c-e686dcd05ebc',  79000,  180, '6 Bulan',   1, true),
  ('3b64bc33-8ce1-4c88-940c-e686dcd05ebc', 149000,  365, '12 Bulan',  2, true),
  ('3b64bc33-8ce1-4c88-940c-e686dcd05ebc', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '3b64bc33-8ce1-4c88-940c-e686dcd05ebc'
--  order by sort_order;
