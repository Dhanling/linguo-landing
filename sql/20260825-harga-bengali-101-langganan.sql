-- [harga-new-edition-langganan-v1] Harga langganan "Bengali 101 new edition".
-- Kembaran SQL dari scripts/harga-bengali-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-bengali-101-id (f452c029-09cc-4320-83c5-35810f55b8f4)
-- Katalog belum pernah punya baris bahasa Bengali, jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('f452c029-09cc-4320-83c5-35810f55b8f4'::uuid,  79000,  180,  '6 Bulan',   1),
  ('f452c029-09cc-4320-83c5-35810f55b8f4'::uuid, 149000,  365,  '12 Bulan',  2),
  ('f452c029-09cc-4320-83c5-35810f55b8f4'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = 'f452c029-09cc-4320-83c5-35810f55b8f4'
order by sort_order;
