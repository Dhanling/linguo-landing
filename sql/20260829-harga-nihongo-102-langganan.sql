-- [harga-new-edition-langganan-v1]
-- 日本語 102 new edition (slug nihongo-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Jepang. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan 日本語 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('7b2d9143-2b4e-4ce7-9531-e1b91682c17c',  79000,  180, '6 Bulan',   1, true),
  ('7b2d9143-2b4e-4ce7-9531-e1b91682c17c', 149000,  365, '12 Bulan',  2, true),
  ('7b2d9143-2b4e-4ce7-9531-e1b91682c17c', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '7b2d9143-2b4e-4ce7-9531-e1b91682c17c'
--  order by sort_order;
