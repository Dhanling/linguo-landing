-- [harga-new-edition-langganan-v1]
-- Spanish 102 new edition (slug espanol-102-a2-id) — modul lanjutan tingkat A2
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
  ('abd4aaf6-6a56-498f-ae13-86d69f4ad188',  79000,  180, '6 Bulan',   1, true),
  ('abd4aaf6-6a56-498f-ae13-86d69f4ad188', 149000,  365, '12 Bulan',  2, true),
  ('abd4aaf6-6a56-498f-ae13-86d69f4ad188', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'abd4aaf6-6a56-498f-ae13-86d69f4ad188'
--  order by sort_order;
