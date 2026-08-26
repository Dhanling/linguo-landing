-- [harga-new-edition-langganan-v1]
-- English 103 new edition (slug english-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Inggris. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan English 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('7b87a876-889b-48ed-972b-f5d01c0062ab',  79000,  180, '6 Bulan',   1, true),
  ('7b87a876-889b-48ed-972b-f5d01c0062ab', 149000,  365, '12 Bulan',  2, true),
  ('7b87a876-889b-48ed-972b-f5d01c0062ab', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '7b87a876-889b-48ed-972b-f5d01c0062ab'
--  order by sort_order;
