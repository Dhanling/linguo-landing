-- [harga-new-edition-langganan-v1] Harga langganan "Hebrew 101 new edition"
-- Kembaran SQL dari scripts/harga-hebrew-101-langganan.mjs
-- Produk: modul-hebrew-101-id (cbf71b0c-ef35-4a49-9619-f075e7b19731)
--
-- Baris katalognya BARU, jadi tak ada tier Lifetime warisan yang perlu diarsipkan.
-- Baris lama `modul-hebrew-101-en` (edisi bahasa Inggris, link Drive) tidak disentuh.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select 'cbf71b0c-ef35-4a49-9619-f075e7b19731'::uuid, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  (79000,  180,  '6 Bulan',   1),
  (149000, 365,  '12 Bulan',  2),
  (249000, null, 'Selamanya', 3)
) as v(price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = 'cbf71b0c-ef35-4a49-9619-f075e7b19731'::uuid
    and p.duration_days = 180 and p.is_active
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = 'cbf71b0c-ef35-4a49-9619-f075e7b19731'::uuid
order by sort_order;
