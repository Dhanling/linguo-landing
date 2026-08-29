-- [harga-new-edition-langganan-v1]
-- 한국어 103 new edition (slug hangugeo-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Korea. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan 한국어 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('91bf7b63-4fdb-4540-adfc-c3d82d239617',  79000,  180, '6 Bulan',   1, true),
  ('91bf7b63-4fdb-4540-adfc-c3d82d239617', 149000,  365, '12 Bulan',  2, true),
  ('91bf7b63-4fdb-4540-adfc-c3d82d239617', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '91bf7b63-4fdb-4540-adfc-c3d82d239617'
--  order by sort_order;
