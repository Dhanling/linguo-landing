-- [harga-new-edition-langganan-v1]
-- Íslenska 101 new edition (slug islenska-101-a1-id) adalah modul PERTAMA untuk
-- bahasa Islandia di katalog: sebelum ini `digital_products` tak punya satu pun
-- baris bahasa Islandia — tak ada edisi Indonesia maupun English Edition.
-- Jadi tak ada tier "Lifetime Rp99.000" warisan yang perlu diarsipkan dan tak
-- ada pembeli lama yang terganggu.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano/Dansk/
-- Norsk/Suomi 101 new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('ff269a27-7183-4f76-a680-904b6e964fbd',  79000,  180, '6 Bulan',   1, true),
  ('ff269a27-7183-4f76-a680-904b6e964fbd', 149000,  365, '12 Bulan',  2, true),
  ('ff269a27-7183-4f76-a680-904b6e964fbd', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'ff269a27-7183-4f76-a680-904b6e964fbd'
--  order by sort_order;
