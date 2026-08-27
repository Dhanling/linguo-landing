-- [harga-new-edition-langganan-v1] Kembaran SQL dari
-- scripts/harga-arab-syam-101-langganan.mjs.
--
-- "Levantine Arabic 101 new edition" (slug modul-arab-syam-101-id) adalah
-- produk BARU: katalog belum pernah punya baris bahasa Arab Syam sama sekali,
-- jadi tak ada tier warisan yang perlu diarsipkan dan tak ada pembeli lama yang
-- bisa terganggu. Baris "Arabic" yang sudah ada adalah modul Fusha — produk
-- berbeda, sengaja tidak disentuh.
--
-- Aman dijalankan dua kali: WHERE NOT EXISTS menjaga dari tier kembar.

insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select p.id, v.price, v.duration_days, v.display_label, v.sort_order, true
from digital_products p
cross join (values
  (79000,  180::int,  '6 Bulan',   1),
  (149000, 365::int,  '12 Bulan',  2),
  (249000, null::int, 'Selamanya', 3)
) as v(price, duration_days, display_label, sort_order)
where p.slug = 'modul-arab-syam-101-id'
  and not exists (
    select 1 from digital_product_pricing d
    where d.product_id = p.id and d.is_active is not false and d.duration_days = 180
  );

select p.slug, d.price, d.duration_days, d.display_label, d.is_active
from digital_product_pricing d
join digital_products p on p.id = d.product_id
where p.slug = 'modul-arab-syam-101-id'
order by d.sort_order;
