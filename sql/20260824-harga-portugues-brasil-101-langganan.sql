-- [harga-new-edition-langganan-v1] Harga langganan "Português do Brasil 101 new edition"
-- Kembaran SQL dari scripts/harga-portugues-brasil-101-langganan.mjs
-- Produk: modul-portugues-brasil-101-id (0e452d4b-9b90-4a96-b00f-dfc19b6d3de8)
--
-- Baris katalognya BARU, jadi tak ada tier Lifetime warisan yang perlu diarsipkan.
-- Baris lama `modul-portugis-101-id` (Portugis Eropa) sengaja tidak disentuh.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select '0e452d4b-9b90-4a96-b00f-dfc19b6d3de8'::uuid, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  (79000,  180,  '6 Bulan',   1),
  (149000, 365,  '12 Bulan',  2),
  (249000, null, 'Selamanya', 3)
) as v(price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = '0e452d4b-9b90-4a96-b00f-dfc19b6d3de8'::uuid
    and p.duration_days = 180 and p.is_active
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '0e452d4b-9b90-4a96-b00f-dfc19b6d3de8'::uuid
order by sort_order;
