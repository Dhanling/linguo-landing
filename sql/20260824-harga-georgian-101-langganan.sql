-- [harga-new-edition-langganan-v1] Harga langganan "Georgian 101 new edition".
-- Kembaran SQL dari scripts/harga-georgian-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-georgia-101-id (7d57db49-4dbb-4840-b155-10c622ecaf5c)
-- Katalog belum pernah punya baris bahasa Georgia, jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('7d57db49-4dbb-4840-b155-10c622ecaf5c'::uuid,  79000,  180,  '6 Bulan',   1),
  ('7d57db49-4dbb-4840-b155-10c622ecaf5c'::uuid, 149000,  365,  '12 Bulan',  2),
  ('7d57db49-4dbb-4840-b155-10c622ecaf5c'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '7d57db49-4dbb-4840-b155-10c622ecaf5c'
order by sort_order;
