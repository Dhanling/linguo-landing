-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-russian-101-langganan.mjs.
--
-- "Russian 101 new edition" memakai ulang baris katalog modul Rusia lama
-- (modul-rusia-101-id), jadi tier warisan "Lifetime Rp99.000" perlu
-- DINONAKTIFKAN — bukan dihapus, supaya digital_purchases.pricing_id lama
-- tidak menggantung.

begin;

-- 1. Arsipkan tier warisan.
update digital_product_pricing
set is_active = false
where id = '94e9b92c-031c-448b-98fb-addc3cefd181';

-- 2. Tiga tier langganan, sama dengan modul new edition lainnya.
insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('65a0eb7d-1e09-4246-ba48-1aa31934c0f9',  79000, 180,  '6 Bulan',   1, true),
  ('65a0eb7d-1e09-4246-ba48-1aa31934c0f9', 149000, 365,  '12 Bulan',  2, true),
  ('65a0eb7d-1e09-4246-ba48-1aa31934c0f9', 249000, null, 'Selamanya', 3, true);

commit;

-- Cek hasilnya:
-- select price, duration_days, display_label, sort_order, is_active
-- from digital_product_pricing
-- where product_id = '65a0eb7d-1e09-4246-ba48-1aa31934c0f9'
-- order by sort_order;
