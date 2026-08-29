-- [harga-new-edition-langganan-v1]
-- Dutch 103 new edition (slug dutch-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Belanda. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Dutch 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('8cf6e267-e978-459f-805a-73f8c3940906',  79000,  180, '6 Bulan',   1, true),
  ('8cf6e267-e978-459f-805a-73f8c3940906', 149000,  365, '12 Bulan',  2, true),
  ('8cf6e267-e978-459f-805a-73f8c3940906', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '8cf6e267-e978-459f-805a-73f8c3940906'
--  order by sort_order;
