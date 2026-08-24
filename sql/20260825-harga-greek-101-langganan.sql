-- [harga-new-edition-langganan-v1] Harga langganan "Greek 101 new edition".
-- Kembaran SQL dari scripts/harga-greek-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-yunani-101-id (24d45e8d-0ef0-4017-9e1d-e2d9b00d3396)
-- Katalog cuma punya modul-yunani-101-en (placeholder Inggris); baris ID-nya baru,
-- jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('24d45e8d-0ef0-4017-9e1d-e2d9b00d3396'::uuid,  79000,  180,  '6 Bulan',   1),
  ('24d45e8d-0ef0-4017-9e1d-e2d9b00d3396'::uuid, 149000,  365,  '12 Bulan',  2),
  ('24d45e8d-0ef0-4017-9e1d-e2d9b00d3396'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '24d45e8d-0ef0-4017-9e1d-e2d9b00d3396'
order by sort_order;
