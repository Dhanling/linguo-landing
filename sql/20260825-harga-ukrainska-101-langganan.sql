-- [harga-new-edition-langganan-v1]
-- Ukrainian 101 new edition (slug ukrainska-101-a1-id) adalah modul e-book yang
-- PERTAMA untuk bahasa Ukraina. Katalog `digital_products` sama sekali belum
-- punya baris e-book Ukraina — satu-satunya baris berbahasa Ukraina adalah
-- `elearning-ukraina` (rekaman kelas, type e-learning), dan itu produk lain yang
-- DIBIARKAN apa adanya. Jadi tak ada slug lama yang dipakai ulang dan tak ada
-- tier warisan yang perlu diarsipkan di sini.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk/
-- Français/Korean/Russian 101 new edition: langganan 6 bulan, 12 bulan, dan
-- selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('5b2957c1-8bdd-4d89-b980-1ca14e3e5168',  79000,  180, '6 Bulan',   1, true),
  ('5b2957c1-8bdd-4d89-b980-1ca14e3e5168', 149000,  365, '12 Bulan',  2, true),
  ('5b2957c1-8bdd-4d89-b980-1ca14e3e5168', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '5b2957c1-8bdd-4d89-b980-1ca14e3e5168'
--  order by sort_order;
