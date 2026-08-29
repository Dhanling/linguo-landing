-- [harga-new-edition-langganan-v1]
-- 日本語 103 new edition (slug nihongo-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Jepang. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan 日本語 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('1ac03507-eab4-4c7b-a909-9e7a22d5d5b8',  79000,  180, '6 Bulan',   1, true),
  ('1ac03507-eab4-4c7b-a909-9e7a22d5d5b8', 149000,  365, '12 Bulan',  2, true),
  ('1ac03507-eab4-4c7b-a909-9e7a22d5d5b8', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '1ac03507-eab4-4c7b-a909-9e7a22d5d5b8'
--  order by sort_order;
