-- [harga-new-edition-langganan-v1]
-- Tagalog 103 new edition (slug tagalog-103-b1-id) adalah jilid B1 dari seri
-- modul buatan sendiri untuk bahasa Tagalog. Level baru = baris katalog BARU:
-- baris A1 (tagalog-101-a1-id) dan baris warisan berbahasa Inggris
-- (modul-tagalog-101-en, file_url Google Drive) DIBIARKAN apa adanya, jadi
-- tak ada tier warisan yang perlu diarsipkan di sini.
--
-- Harganya disamakan dengan seluruh seri new edition: langganan 6 bulan,
-- 12 bulan, dan selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('f23944c1-f601-4df9-b478-cc6d421e5639',  79000,  180, '6 Bulan',   1, true),
  ('f23944c1-f601-4df9-b478-cc6d421e5639', 149000,  365, '12 Bulan',  2, true),
  ('f23944c1-f601-4df9-b478-cc6d421e5639', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'f23944c1-f601-4df9-b478-cc6d421e5639'
--  order by sort_order;
