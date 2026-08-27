-- [harga-new-edition-langganan-v1]
-- German 104 new edition (slug deutsch-104-b2-id) — modul lanjutan tingkat B2
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
  ('62c757fc-e705-431b-bc67-c317617676b6',  79000,  180, '6 Bulan',   1, true),
  ('62c757fc-e705-431b-bc67-c317617676b6', 149000,  365, '12 Bulan',  2, true),
  ('62c757fc-e705-431b-bc67-c317617676b6', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '62c757fc-e705-431b-bc67-c317617676b6'
--  order by sort_order;
