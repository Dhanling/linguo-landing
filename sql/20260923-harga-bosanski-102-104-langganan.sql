-- [harga-new-edition-langganan-v1] Harga langganan "Bosnian 101 new edition" A2 · B1 · B2.
-- Kembaran SQL dari scripts/harga-bosanski-102-104-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk (slug baru, tanpa tier warisan):
--   bosanski-102-a2-id (73723986-9b0b-4ace-9b4b-22e2776fa4c5)
--   bosanski-103-b1-id (d0a38635-f9c1-4abe-9c35-f46c0d1c4cf3)
--   bosanski-104-b2-id (e575d78c-7417-4cba-8932-2a61613b7a59)

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select p.id, t.price, t.duration_days, t.display_label, t.sort_order, true
from digital_products p
cross join (values
  ( 79000,  180, '6 Bulan',   1),
  (149000,  365, '12 Bulan',  2),
  (249000, null, 'Selamanya', 3)
) as t(price, duration_days, display_label, sort_order)
where p.slug in ('bosanski-102-a2-id', 'bosanski-103-b1-id', 'bosanski-104-b2-id')
  and not exists (
    select 1 from digital_product_pricing x
    where x.product_id = p.id
      and x.duration_days is not distinct from t.duration_days
      and x.is_active is not false
  );

select p.slug, x.price, x.duration_days, x.display_label, x.is_active
from digital_product_pricing x join digital_products p on p.id = x.product_id
where p.slug like 'bosanski-10%'
order by p.slug, x.sort_order;
