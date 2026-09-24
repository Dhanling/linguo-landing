-- [harga-new-edition-langganan-v1] Harga langganan "Vietnamese 101 new edition" A2 · B1 · B2.
-- Kembaran SQL dari scripts/harga-tieng-viet-102-104-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk (slug baru, tanpa tier warisan):
--   tieng-viet-102-a2-id (1e227fae-21cc-43c4-8de3-67d9a7c6eda3)
--   tieng-viet-103-b1-id (feb2171f-2ce0-4043-a008-a5e2e6ea77d7)
--   tieng-viet-104-b2-id (906cfaa3-4546-4a58-bc46-0d6aa234d4c1)

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select p.id, t.price, t.duration_days, t.display_label, t.sort_order, true
from digital_products p
cross join (values
  ( 79000,  180, '6 Bulan',   1),
  (149000,  365, '12 Bulan',  2),
  (249000, null, 'Selamanya', 3)
) as t(price, duration_days, display_label, sort_order)
where p.slug in ('tieng-viet-102-a2-id', 'tieng-viet-103-b1-id', 'tieng-viet-104-b2-id')
  and not exists (
    select 1 from digital_product_pricing x
    where x.product_id = p.id
      and x.duration_days is not distinct from t.duration_days
      and x.is_active is not false
  );

select p.slug, x.price, x.duration_days, x.display_label, x.is_active
from digital_product_pricing x join digital_products p on p.id = x.product_id
where p.slug like 'tieng-viet-10%'
order by p.slug, x.sort_order;
