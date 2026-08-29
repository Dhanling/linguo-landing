-- [harga-new-edition-langganan-v1]
-- Dansk 104 new edition (slug dansk-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Denmark. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Dansk 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('4d094d95-37b1-42dd-8a1e-e2e263c15fb4',  79000,  180, '6 Bulan',   1, true),
  ('4d094d95-37b1-42dd-8a1e-e2e263c15fb4', 149000,  365, '12 Bulan',  2, true),
  ('4d094d95-37b1-42dd-8a1e-e2e263c15fb4', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '4d094d95-37b1-42dd-8a1e-e2e263c15fb4'
--  order by sort_order;
