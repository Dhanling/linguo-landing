-- [harga-new-edition-langganan-v1]
-- Tagalog 104 new edition (slug tagalog-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Tagalog. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Tagalog 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('abe1730c-855c-45a7-9c8f-1a0034ff920e',  79000,  180, '6 Bulan',   1, true),
  ('abe1730c-855c-45a7-9c8f-1a0034ff920e', 149000,  365, '12 Bulan',  2, true),
  ('abe1730c-855c-45a7-9c8f-1a0034ff920e', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'abe1730c-855c-45a7-9c8f-1a0034ff920e'
--  order by sort_order;
