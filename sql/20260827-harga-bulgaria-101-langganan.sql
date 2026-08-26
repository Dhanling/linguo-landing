-- [harga-new-edition-langganan-v1] Harga langganan "Bulgarian 101 new edition".
-- Kembaran SQL dari scripts/harga-bulgaria-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-bulgaria-101-id (51d12821-e12f-4670-a776-8d92e22d7c48)
-- Katalog belum pernah punya baris bahasa Bulgaria, jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('51d12821-e12f-4670-a776-8d92e22d7c48'::uuid,  79000,  180,  '6 Bulan',   1),
  ('51d12821-e12f-4670-a776-8d92e22d7c48'::uuid, 149000,  365,  '12 Bulan',  2),
  ('51d12821-e12f-4670-a776-8d92e22d7c48'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '51d12821-e12f-4670-a776-8d92e22d7c48'
order by sort_order;
