-- [harga-new-edition-langganan-v1]
-- German 103 new edition (slug german-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Jerman. Baris katalognya BARU, jadi tak ada tier warisan yang
-- perlu diarsipkan.
--
-- Harganya disamakan persis dengan German 101 new edition supaya pembeli tidak
-- melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('4438659d-9b21-4df8-bb43-c794373933e1',  79000,  180, '6 Bulan',   1, true),
  ('4438659d-9b21-4df8-bb43-c794373933e1', 149000,  365, '12 Bulan',  2, true),
  ('4438659d-9b21-4df8-bb43-c794373933e1', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '4438659d-9b21-4df8-bb43-c794373933e1'
--  order by sort_order;
