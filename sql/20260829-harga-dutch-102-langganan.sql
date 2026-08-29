-- [harga-new-edition-langganan-v1]
-- Dutch 102 new edition (slug dutch-102-a2-id) — modul lanjutan tingkat A2
-- untuk bahasa Belanda. Baris katalognya BARU, jadi tak ada tier warisan
-- yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Dutch 101 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('a0ac0e87-427f-4613-bcf1-ad649ce73a4d',  79000,  180, '6 Bulan',   1, true),
  ('a0ac0e87-427f-4613-bcf1-ad649ce73a4d', 149000,  365, '12 Bulan',  2, true),
  ('a0ac0e87-427f-4613-bcf1-ad649ce73a4d', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'a0ac0e87-427f-4613-bcf1-ad649ce73a4d'
--  order by sort_order;
