-- [harga-new-edition-langganan-v1]
-- German 101 new edition (slug modul-jerman-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Empat saudaranya yang sama-sama edisi
-- baru — Japanese 101, Spanish 101, English 101, dan Italiano 101 — sudah
-- berformat langganan 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: kalau nanti ada pembelian yang menunjuk ke id-nya
-- lewat digital_purchases.pricing_id, aksesnya menempel di
-- digital_purchases.expires_at, bukan di baris tier ini. Per 23 Agu 2026 baris
-- produknya belum punya pembeli sama sekali.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '0576d05a-5557-4e3d-b2c2-60423daac6e8';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('c94c91d3-2b53-42c2-be50-cc0b915bf3e1',  79000,  180, '6 Bulan',   1, true),
  ('c94c91d3-2b53-42c2-be50-cc0b915bf3e1', 149000,  365, '12 Bulan',  2, true),
  ('c94c91d3-2b53-42c2-be50-cc0b915bf3e1', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'c94c91d3-2b53-42c2-be50-cc0b915bf3e1'
--  order by is_active desc, sort_order;
