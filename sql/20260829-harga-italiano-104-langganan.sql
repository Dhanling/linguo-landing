-- [harga-new-edition-langganan-v1]
-- Italiano 104 new edition (slug italiano-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Italia. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan; baris A1 lama
-- (modul-italia-101-id) TIDAK disentuh.
--
-- Harganya disamakan persis dengan modul new edition lain supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('ef59b742-da96-4e70-9033-895841b9acc3',  79000,  180, '6 Bulan',   1, true),
  ('ef59b742-da96-4e70-9033-895841b9acc3', 149000,  365, '12 Bulan',  2, true),
  ('ef59b742-da96-4e70-9033-895841b9acc3', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'ef59b742-da96-4e70-9033-895841b9acc3'
--  order by sort_order;
