-- [harga-new-edition-langganan-v1]
-- Tagalog 102 new edition (slug tagalog-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Tagalog. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Tagalog 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('802c83ca-b42c-4f40-bb7f-dbad727dad85',  79000,  180, '6 Bulan',   1, true),
  ('802c83ca-b42c-4f40-bb7f-dbad727dad85', 149000,  365, '12 Bulan',  2, true),
  ('802c83ca-b42c-4f40-bb7f-dbad727dad85', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '802c83ca-b42c-4f40-bb7f-dbad727dad85'
--  order by sort_order;
