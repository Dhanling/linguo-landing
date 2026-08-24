-- [harga-new-edition-langganan-v1] Harga langganan "Uzbek 101 new edition".
-- Kembaran SQL dari scripts/harga-uzbek-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-uzbek-101-id (09425602-a46d-4bdd-848a-69bead24698e)
-- Katalog belum pernah punya baris bahasa Uzbek, jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('09425602-a46d-4bdd-848a-69bead24698e'::uuid,  79000,  180,  '6 Bulan',   1),
  ('09425602-a46d-4bdd-848a-69bead24698e'::uuid, 149000,  365,  '12 Bulan',  2),
  ('09425602-a46d-4bdd-848a-69bead24698e'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '09425602-a46d-4bdd-848a-69bead24698e'
order by sort_order;
