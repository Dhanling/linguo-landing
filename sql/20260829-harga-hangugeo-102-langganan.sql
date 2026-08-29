-- [harga-new-edition-langganan-v1]
-- 한국어 102 new edition (slug hangugeo-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Korea. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan 한국어 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('439bbbe3-529c-4489-bfc2-eac85e7dfbca',  79000,  180, '6 Bulan',   1, true),
  ('439bbbe3-529c-4489-bfc2-eac85e7dfbca', 149000,  365, '12 Bulan',  2, true),
  ('439bbbe3-529c-4489-bfc2-eac85e7dfbca', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '439bbbe3-529c-4489-bfc2-eac85e7dfbca'
--  order by sort_order;
