-- [harga-new-edition-langganan-v1]
-- Polski 101 new edition (slug polski-101-a1-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Polandia — katalog lama cuma punya
-- "modul-polandia-101-en" (English Edition, berkas Google Drive), jadi tak ada
-- tier "Lifetime Rp99.000" warisan yang perlu diarsipkan di baris ini.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk 101
-- new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('1fcd05c1-a939-4384-9511-7135bf8609f8',  79000,  180, '6 Bulan',   1, true),
  ('1fcd05c1-a939-4384-9511-7135bf8609f8', 149000,  365, '12 Bulan',  2, true),
  ('1fcd05c1-a939-4384-9511-7135bf8609f8', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '1fcd05c1-a939-4384-9511-7135bf8609f8'
--  order by sort_order;
