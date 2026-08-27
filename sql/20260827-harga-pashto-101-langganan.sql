-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-pashto-101-langganan.mjs — harga langganan "Pashto 101 new edition".
--
-- Produk `modul-pashto-101-id` BARU dibuat 27 Agu 2026 oleh
-- scripts/ebook-publish.mjs. Katalog belum pernah punya baris bahasa Pashto
-- sama sekali, jadi tak ada tier warisan yang perlu diarsipkan.
--
-- Aman dijalankan dua kali.

begin;

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
  from (values
    ('4492e363-6de4-4796-aed5-1cb741624c1a'::uuid,  79000, 180,       '6 Bulan',   1),
    ('4492e363-6de4-4796-aed5-1cb741624c1a'::uuid, 149000, 365,       '12 Bulan',  2),
    ('4492e363-6de4-4796-aed5-1cb741624c1a'::uuid, 249000, null::int, 'Selamanya', 3)
  ) as v(product_id, price, duration_days, display_label, sort_order)
 where not exists (
   select 1 from digital_product_pricing p
    where p.product_id = v.product_id
      and p.is_active
      and p.duration_days is not distinct from v.duration_days
 );

commit;
