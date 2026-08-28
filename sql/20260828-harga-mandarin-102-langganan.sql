-- [harga-new-edition-langganan-v1]
-- Mandarin 102 new edition (slug mandarin-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Mandarin. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Mandarin 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('0c21d8e6-a831-43c5-9428-d171030bc2be',  79000,  180, '6 Bulan',   1, true),
  ('0c21d8e6-a831-43c5-9428-d171030bc2be', 149000,  365, '12 Bulan',  2, true),
  ('0c21d8e6-a831-43c5-9428-d171030bc2be', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '0c21d8e6-a831-43c5-9428-d171030bc2be'
--  order by sort_order;
