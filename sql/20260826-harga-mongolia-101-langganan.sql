-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-mongolia-101-langganan.mjs — harga langganan "Монгол хэл 101 new edition".
--
-- Produk `modul-mongolia-101-id` BARU dibuat 26 Agu 2026 oleh
-- scripts/ebook-publish.mjs. Katalog belum pernah punya baris bahasa Mongolia
-- sama sekali, jadi tak ada tier warisan yang perlu diarsipkan.
--
-- Aman dijalankan dua kali.

begin;

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
  from (values
    ('e424e164-6962-4e05-86bd-2dc205f3d5bf'::uuid,  79000, 180,       '6 Bulan',   1),
    ('e424e164-6962-4e05-86bd-2dc205f3d5bf'::uuid, 149000, 365,       '12 Bulan',  2),
    ('e424e164-6962-4e05-86bd-2dc205f3d5bf'::uuid, 249000, null::int, 'Selamanya', 3)
  ) as v(product_id, price, duration_days, display_label, sort_order)
 where not exists (
   select 1 from digital_product_pricing p
    where p.product_id = v.product_id
      and p.is_active
      and p.duration_days is not distinct from v.duration_days
 );

commit;
