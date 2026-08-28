-- [harga-new-edition-langganan-v1]
-- Français 104 new edition (slug francais-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Prancis. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Français 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('e2c3cc5f-f522-461a-9f76-a83cbba265fb',  79000,  180, '6 Bulan',   1, true),
  ('e2c3cc5f-f522-461a-9f76-a83cbba265fb', 149000,  365, '12 Bulan',  2, true),
  ('e2c3cc5f-f522-461a-9f76-a83cbba265fb', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'e2c3cc5f-f522-461a-9f76-a83cbba265fb'
--  order by sort_order;
