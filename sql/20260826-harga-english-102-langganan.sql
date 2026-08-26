-- [harga-new-edition-langganan-v1]
-- English 102 new edition (slug english-102-a2-id) — modul lanjutan tingkat A2
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
  ('e42efe91-3627-48ef-9503-11a79ea7f058',  79000,  180, '6 Bulan',   1, true),
  ('e42efe91-3627-48ef-9503-11a79ea7f058', 149000,  365, '12 Bulan',  2, true),
  ('e42efe91-3627-48ef-9503-11a79ea7f058', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'e42efe91-3627-48ef-9503-11a79ea7f058'
--  order by sort_order;
