-- [harga-new-edition-langganan-v1]
-- ภาษาไทย 101 new edition (slug modul-thai-101-id) adalah baris katalog BARU —
-- dibuat oleh scripts/ebook-publish.mjs, bukan warisan modul lama. Karena itu
-- tidak ada tier "Lifetime Rp99.000" yang perlu diarsipkan seperti pada
-- Magyar/Georgian; skrip ini cuma memasang tiga tier langganannya, persis pola
-- new edition yang lain.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('a24e1b06-80e0-464a-9026-835ad12eadf5',  79000,  180, '6 Bulan',   1, true),
  ('a24e1b06-80e0-464a-9026-835ad12eadf5', 149000,  365, '12 Bulan',  2, true),
  ('a24e1b06-80e0-464a-9026-835ad12eadf5', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'a24e1b06-80e0-464a-9026-835ad12eadf5'
--  order by is_active desc, sort_order;
