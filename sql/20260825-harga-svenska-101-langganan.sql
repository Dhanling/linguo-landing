-- [harga-new-edition-langganan-v1] Harga langganan "Svenska 101 new edition".
-- Kembaran SQL dari scripts/harga-svenska-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-swedia-101-id (4f5b9614-cee9-4039-9a1a-8ce0753b4d2e)
-- Baris katalog Swedia lama (modul-swedia-101-en, edisi Inggris A1-B1 di Google
-- Drive) TIDAK dipakai ulang — beda bahasa pengantar dan beda level, jadi ia
-- produk lain. Tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('4f5b9614-cee9-4039-9a1a-8ce0753b4d2e'::uuid,  79000,  180,  '6 Bulan',   1),
  ('4f5b9614-cee9-4039-9a1a-8ce0753b4d2e'::uuid, 149000,  365,  '12 Bulan',  2),
  ('4f5b9614-cee9-4039-9a1a-8ce0753b4d2e'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '4f5b9614-cee9-4039-9a1a-8ce0753b4d2e'
order by sort_order;
