-- [harga-new-edition-langganan-v1] Harga langganan "Türkçe 101 new edition".
-- Kembaran SQL dari scripts/harga-turkce-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-turki-101-id (98f139af-c9d7-4f70-8a51-2ab82060c6c3)
-- Baris katalog Turki LAMA dipakai ulang, jadi tier warisan "Lifetime Rp99.000"
-- (9b9fda39-6245-45ce-8f11-1cf07b4a98f5) dinonaktifkan — bukan dihapus, karena
-- pembelian lama menunjuk ke id-nya lewat digital_purchases.pricing_id.

update digital_product_pricing
set is_active = false
where id = '9b9fda39-6245-45ce-8f11-1cf07b4a98f5';

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('98f139af-c9d7-4f70-8a51-2ab82060c6c3'::uuid,  79000,  180,  '6 Bulan',   1),
  ('98f139af-c9d7-4f70-8a51-2ab82060c6c3'::uuid, 149000,  365,  '12 Bulan',  2),
  ('98f139af-c9d7-4f70-8a51-2ab82060c6c3'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '98f139af-c9d7-4f70-8a51-2ab82060c6c3'
order by sort_order;
