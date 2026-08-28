-- [harga-new-edition-langganan-v1]
-- Mandarin 103 new edition (slug mandarin-103-b1-id) — modul lanjutan tingkat B1
-- untuk bahasa Mandarin. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Mandarin 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('be33966a-dfad-4aa8-8ca9-ea88c582be95',  79000,  180, '6 Bulan',   1, true),
  ('be33966a-dfad-4aa8-8ca9-ea88c582be95', 149000,  365, '12 Bulan',  2, true),
  ('be33966a-dfad-4aa8-8ca9-ea88c582be95', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'be33966a-dfad-4aa8-8ca9-ea88c582be95'
--  order by sort_order;
