-- [harga-new-edition-langganan-v1]
-- Português 101 new edition (slug modul-portugis-101-id) masih memakai baris
-- harga warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang
-- sama-sama edisi baru — Japanese, Spanish, English, Deutsch, Mandarin,
-- Italiano, Français, Dansk, Korean, Magyar, ქართული, Tiếng Việt & Íslenska
-- 101 — sudah berformat langganan 6/12 bulan + opsi selamanya. Skrip ini
-- menyamakan.
--
-- Baris lama TIDAK dihapus, cukup dinonaktifkan: kalau nanti ada pembelian yang
-- menunjuk ke id-nya lewat digital_purchases.pricing_id, aksesnya menempel di
-- digital_purchases.expires_at, bukan di baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '40a8df5f-b3d9-4cce-a125-19a93428a8a2';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('1647a7c1-fc40-4ce9-a2c1-0c6dc96b9e62',  79000,  180, '6 Bulan',   1, true),
  ('1647a7c1-fc40-4ce9-a2c1-0c6dc96b9e62', 149000,  365, '12 Bulan',  2, true),
  ('1647a7c1-fc40-4ce9-a2c1-0c6dc96b9e62', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '1647a7c1-fc40-4ce9-a2c1-0c6dc96b9e62'
--  order by is_active desc, sort_order;
