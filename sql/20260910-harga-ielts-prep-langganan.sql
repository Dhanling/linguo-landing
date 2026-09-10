-- Kembaran scripts/harga-ielts-prep-langganan.mjs: tier langganan untuk
-- "IELTS Prep - Band 6.5+" (slug modul-ielts-prep-id). Produk baru, tak ada tier warisan.
insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select p.id, t.price, t.duration_days, t.display_label, t.sort_order, true
from digital_products p
cross join (values
  (79000, 180, '6 Bulan', 1),
  (149000, 365, '12 Bulan', 2),
  (249000, null::int, 'Selamanya', 3)
) as t(price, duration_days, display_label, sort_order)
where p.slug = 'modul-ielts-prep-id'
  and not exists (
    select 1 from digital_product_pricing x
    where x.product_id = p.id and x.duration_days = 180 and coalesce(x.is_active, true)
  );
