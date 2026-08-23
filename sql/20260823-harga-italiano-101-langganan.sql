-- [harga-new-edition-langganan-v1]
-- Italiano 101 new edition (slug modul-italia-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Tiga saudaranya yang sama-sama edisi
-- baru — Japanese 101, Spanish 101, dan English 101 — sudah berformat langganan
-- 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: pembelian Incha Fatmala (inchafatmala.p@gmail.com)
-- bisa menunjuk ke id-nya lewat digital_purchases.pricing_id. Cukup
-- dinonaktifkan — aksesnya menempel di digital_purchases.expires_at, bukan di
-- baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '4472d7f0-97b4-492b-8de8-e477f9a27195';

-- 2) tiga tier langganan, persis pola Japanese/Spanish/English 101 new edition
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('9cd064ed-1eec-4a62-bcdd-72aac3f2e731',  79000,  180, '6 Bulan',   1, true),
  ('9cd064ed-1eec-4a62-bcdd-72aac3f2e731', 149000,  365, '12 Bulan',  2, true),
  ('9cd064ed-1eec-4a62-bcdd-72aac3f2e731', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '9cd064ed-1eec-4a62-bcdd-72aac3f2e731'
--  order by is_active desc, sort_order;
