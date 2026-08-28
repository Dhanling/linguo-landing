-- [harga-new-edition-langganan-v1]
-- Français 103 new edition (slug francais-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Prancis. Baris katalognya BARU, jadi tak ada tier warisan yang
-- perlu diarsipkan.
--
-- Harganya disamakan persis dengan Français 101 new edition supaya pembeli tidak
-- melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('bff9f6fc-9588-4c7b-a0cd-6918670749b9',  79000,  180, '6 Bulan',   1, true),
  ('bff9f6fc-9588-4c7b-a0cd-6918670749b9', 149000,  365, '12 Bulan',  2, true),
  ('bff9f6fc-9588-4c7b-a0cd-6918670749b9', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'bff9f6fc-9588-4c7b-a0cd-6918670749b9'
--  order by sort_order;
