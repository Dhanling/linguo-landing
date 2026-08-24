-- [harga-new-edition-langganan-v1]
-- Tagalog 101 new edition (slug tagalog-101-a1-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Tagalog dalam bahasa Indonesia. Katalog memang
-- sudah punya baris "Tagalog 101 (English Edition)" (slug modul-tagalog-101-en,
-- file_url Google Drive), tapi itu produk lain dan DIBIARKAN apa adanya —
-- jadi tak ada tier warisan yang perlu diarsipkan di sini.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk/
-- Français/Korean 101 new edition: langganan 6 bulan, 12 bulan, dan selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('14e45f94-0e7f-4d15-8ae0-a3d525cc55b1',  79000,  180, '6 Bulan',   1, true),
  ('14e45f94-0e7f-4d15-8ae0-a3d525cc55b1', 149000,  365, '12 Bulan',  2, true),
  ('14e45f94-0e7f-4d15-8ae0-a3d525cc55b1', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '14e45f94-0e7f-4d15-8ae0-a3d525cc55b1'
--  order by sort_order;
