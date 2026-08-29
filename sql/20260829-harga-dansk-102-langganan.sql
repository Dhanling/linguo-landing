-- [harga-new-edition-langganan-v1]
-- Dansk 102 new edition (slug dansk-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Denmark. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Dansk 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('b44ef8cb-5d46-4338-87db-b64e40b82b3e',  79000,  180, '6 Bulan',   1, true),
  ('b44ef8cb-5d46-4338-87db-b64e40b82b3e', 149000,  365, '12 Bulan',  2, true),
  ('b44ef8cb-5d46-4338-87db-b64e40b82b3e', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'b44ef8cb-5d46-4338-87db-b64e40b82b3e'
--  order by sort_order;
