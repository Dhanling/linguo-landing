-- [harga-new-edition-langganan-v1]
-- Indonesian 101 new edition (slug indonesian-101-a1-en) adalah modul BIPA
-- pertama: bahasa yang DIPELAJARI adalah bahasa Indonesia, pengantarnya bahasa
-- Inggris. Karena itu barisnya baru sama sekali — tak ada produk lama yang
-- dipakai ulang dan tak ada tier warisan yang perlu diarsipkan di sini.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk/
-- Français/Korean/Tagalog 101 new edition: langganan 6 bulan, 12 bulan,
-- dan selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('289818ef-29a8-4d56-b52d-00c52954bd1d',  79000,  180, '6 Bulan',   1, true),
  ('289818ef-29a8-4d56-b52d-00c52954bd1d', 149000,  365, '12 Bulan',  2, true),
  ('289818ef-29a8-4d56-b52d-00c52954bd1d', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '289818ef-29a8-4d56-b52d-00c52954bd1d'
--  order by sort_order;
