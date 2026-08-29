-- [harga-new-edition-langganan-v1]
-- Italian 102 new edition (slug italiano-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Italia. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Italian 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('79e062bf-afb1-4bbd-ad17-84884f10b766',  79000,  180, '6 Bulan',   1, true),
  ('79e062bf-afb1-4bbd-ad17-84884f10b766', 149000,  365, '12 Bulan',  2, true),
  ('79e062bf-afb1-4bbd-ad17-84884f10b766', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '79e062bf-afb1-4bbd-ad17-84884f10b766'
--  order by sort_order;
