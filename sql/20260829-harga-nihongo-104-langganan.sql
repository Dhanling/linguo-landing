-- [harga-new-edition-langganan-v1]
-- 日本語 104 new edition (slug nihongo-104-b2-id) — modul lanjutan tingkat B2
-- untuk bahasa Jepang. Baris katalognya BARU, jadi tak ada tier warisan
-- ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan 日本語 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('dcd463ab-5f23-4c80-b262-ecc52be1e016',  79000,  180, '6 Bulan',   1, true),
  ('dcd463ab-5f23-4c80-b262-ecc52be1e016', 149000,  365, '12 Bulan',  2, true),
  ('dcd463ab-5f23-4c80-b262-ecc52be1e016', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'dcd463ab-5f23-4c80-b262-ecc52be1e016'
--  order by sort_order;
