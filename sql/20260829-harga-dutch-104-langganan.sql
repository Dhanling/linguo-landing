-- [harga-new-edition-langganan-v1]
-- Nederlands 104 new edition (slug nederlands-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Belanda. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Nederlands 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('90e6a2ec-4b5f-4cf4-a302-c8aec3557e6d',  79000,  180, '6 Bulan',   1, true),
  ('90e6a2ec-4b5f-4cf4-a302-c8aec3557e6d', 149000,  365, '12 Bulan',  2, true),
  ('90e6a2ec-4b5f-4cf4-a302-c8aec3557e6d', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '90e6a2ec-4b5f-4cf4-a302-c8aec3557e6d'
--  order by sort_order;
