-- [harga-new-edition-langganan-v1] Harga langganan "Bahasa Melayu 101 new edition".
-- Kembaran SQL dari scripts/harga-melayu-101-langganan.mjs — jalankan salah satu, bukan dua-duanya.
--
-- Produk: modul-melayu-101-id (247046f0-0504-4c86-ae31-9c924533512a)
-- Katalog belum pernah punya baris modul bahasa Melayu sama sekali — modul ini
-- yang pertama, jadi tak ada tier warisan yang perlu diarsipkan.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
from (values
  ('247046f0-0504-4c86-ae31-9c924533512a'::uuid,  79000,  180,  '6 Bulan',   1),
  ('247046f0-0504-4c86-ae31-9c924533512a'::uuid, 149000,  365,  '12 Bulan',  2),
  ('247046f0-0504-4c86-ae31-9c924533512a'::uuid, 249000, null,  'Selamanya', 3)
) as v(product_id, price, duration_days, display_label, sort_order)
where not exists (
  select 1 from digital_product_pricing p
  where p.product_id = v.product_id
    and p.duration_days is not distinct from v.duration_days
    and p.is_active is not false
);

select price, duration_days, display_label, sort_order, is_active
from digital_product_pricing
where product_id = '247046f0-0504-4c86-ae31-9c924533512a'
order by sort_order;
