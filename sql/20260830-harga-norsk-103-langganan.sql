-- [harga-new-edition-langganan-v1]
-- Norsk 103 new edition (slug norsk-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Norwegia. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Norsk 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('9b55bb56-8e9f-4878-a067-46d064a9df76',  79000,  180, '6 Bulan',   1, true),
  ('9b55bb56-8e9f-4878-a067-46d064a9df76', 149000,  365, '12 Bulan',  2, true),
  ('9b55bb56-8e9f-4878-a067-46d064a9df76', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '9b55bb56-8e9f-4878-a067-46d064a9df76'
--  order by sort_order;
