-- [harga-new-edition-langganan-v1]
-- 한국어 104 new edition (slug hangugeo-104-b2-id) — modul lanjutan tingkat B2
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
  ('af2281de-197a-4d0d-ba96-45d61104bfc0',  79000,  180, '6 Bulan',   1, true),
  ('af2281de-197a-4d0d-ba96-45d61104bfc0', 149000,  365, '12 Bulan',  2, true),
  ('af2281de-197a-4d0d-ba96-45d61104bfc0', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'af2281de-197a-4d0d-ba96-45d61104bfc0'
--  order by sort_order;
