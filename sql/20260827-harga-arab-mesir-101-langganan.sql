-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-arab-mesir-101-langganan.mjs — harga langganan "Egyptian Arabic 101 new edition".
--
-- Produk `modul-arab-mesir-101-id` BARU dibuat 27 Agu 2026 oleh
-- scripts/ebook-publish.mjs. Katalog belum pernah punya baris bahasa
-- Arab Mesir sama sekali (yang ada cuma Arab Fusha, produk berbeda), jadi tak
-- ada tier warisan yang perlu diarsipkan.
--
-- Aman dijalankan dua kali.

begin;

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
  from (values
    ('93236808-4a6a-4b38-8355-2ff101bc58b8'::uuid,  79000, 180,       '6 Bulan',   1),
    ('93236808-4a6a-4b38-8355-2ff101bc58b8'::uuid, 149000, 365,       '12 Bulan',  2),
    ('93236808-4a6a-4b38-8355-2ff101bc58b8'::uuid, 249000, null::int, 'Selamanya', 3)
  ) as v(product_id, price, duration_days, display_label, sort_order)
 where not exists (
   select 1 from digital_product_pricing p
    where p.product_id = v.product_id
      and p.is_active
      and p.duration_days is not distinct from v.duration_days
 );

commit;
