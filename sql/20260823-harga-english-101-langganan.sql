-- [harga-new-edition-langganan-v1]
-- English 101 new edition (slug modul-inggris-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Dua saudaranya yang sama-sama edisi
-- baru — Japanese 101 (nihongo-101-a1-id) dan Spanish 101 (espanol-101-a1-id) —
-- sudah berformat langganan 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: dua pembelian (andiwijaya240786@, julian.prasetya@)
-- menunjuk ke id-nya lewat digital_purchases.pricing_id. Cukup dinonaktifkan —
-- akses mereka menempel di digital_purchases.expires_at, bukan di baris ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '20299187-7b97-4af9-8f5e-989583a3608f';

-- 2) tiga tier langganan, persis pola Japanese/Spanish 101 new edition
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('b49754dc-07de-42df-9ef8-2164c7e0224c',  79000,  180, '6 Bulan',   1, true),
  ('b49754dc-07de-42df-9ef8-2164c7e0224c', 149000,  365, '12 Bulan',  2, true),
  ('b49754dc-07de-42df-9ef8-2164c7e0224c', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'b49754dc-07de-42df-9ef8-2164c7e0224c'
--  order by is_active desc, sort_order;
