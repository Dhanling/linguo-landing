-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-taiwan-101-langganan.mjs — harga langganan "台灣華語 101 new edition".
--
-- Produk `modul-taiwan-101-id` BARU dibuat 27 Agu 2026 oleh
-- scripts/ebook-publish.mjs. Katalog belum pernah punya baris Mandarin Taiwan
-- sama sekali, jadi tak ada tier warisan yang perlu diarsipkan.
--
-- ⚠️ Produk ini TERPISAH dari `modul-mandarin-101-id` (Mandarin daratan, aksara
-- sederhana) yang sudah punya pembelinya sendiri — jangan disatukan.
--
-- Aman dijalankan dua kali.

begin;

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
  from (values
    ('f55d9aef-1cab-440c-91a3-3a70deab0071'::uuid,  79000, 180,       '6 Bulan',   1),
    ('f55d9aef-1cab-440c-91a3-3a70deab0071'::uuid, 149000, 365,       '12 Bulan',  2),
    ('f55d9aef-1cab-440c-91a3-3a70deab0071'::uuid, 249000, null::int, 'Selamanya', 3)
  ) as v(product_id, price, duration_days, display_label, sort_order)
 where not exists (
   select 1 from digital_product_pricing p
    where p.product_id = v.product_id
      and p.is_active
      and p.duration_days is not distinct from v.duration_days
 );

commit;
