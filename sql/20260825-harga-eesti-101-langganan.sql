-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-eesti-101-langganan.mjs — harga langganan "Eesti keel 101 new edition".
--
-- Produk `modul-estonia-101-id` sudah ada di katalog sejak 8 Mei 2026 (dulu
-- menunjuk berkas Google Drive, level A1-B1, 100 halaman) dan membawa satu tier
-- warisan "Lifetime Rp99.000". Tier itu DIARSIPKAN, bukan dihapus, supaya
-- riwayat pembelian lama tetap terbaca. Per 25 Agu 2026: nol pembelian.
--
-- Aman dijalankan dua kali.

begin;

-- 1. Arsipkan tier warisan.
update digital_product_pricing
   set is_active = false
 where product_id = '6ae3f27e-0a87-4760-a5c4-ade918e643be'
   and duration_days is null
   and display_label = 'Lifetime';

-- 2. Pasang tiga tier langganan, kecuali sudah ada.
insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select v.product_id, v.price, v.duration_days, v.display_label, v.sort_order, true
  from (values
    ('6ae3f27e-0a87-4760-a5c4-ade918e643be'::uuid,  79000, 180,       '6 Bulan',   1),
    ('6ae3f27e-0a87-4760-a5c4-ade918e643be'::uuid, 149000, 365,       '12 Bulan',  2),
    ('6ae3f27e-0a87-4760-a5c4-ade918e643be'::uuid, 249000, null::int, 'Selamanya', 3)
  ) as v(product_id, price, duration_days, display_label, sort_order)
 where not exists (
   select 1 from digital_product_pricing p
    where p.product_id = v.product_id
      and p.is_active
      and p.duration_days is not distinct from v.duration_days
 );

commit;
