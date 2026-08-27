-- [harga-new-edition-langganan-v1]
-- German 102 new edition (slug german-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Jerman. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan German 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('15c9be87-82e9-4812-8a17-f4f03f66c68b',  79000,  180, '6 Bulan',   1, true),
  ('15c9be87-82e9-4812-8a17-f4f03f66c68b', 149000,  365, '12 Bulan',  2, true),
  ('15c9be87-82e9-4812-8a17-f4f03f66c68b', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '15c9be87-82e9-4812-8a17-f4f03f66c68b'
--  order by sort_order;
