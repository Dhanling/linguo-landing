-- [harga-new-edition-langganan-v1]
-- Mandarin 101 new edition (slug modul-mandarin-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang sama-sama edisi
-- baru — Japanese 101, Spanish 101, English 101, Italiano 101 — sudah berformat
-- langganan 6/12 bulan + opsi selamanya. Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: pembelian yang sudah ada bisa menunjuk ke id-nya lewat
-- digital_purchases.pricing_id. Cukup dinonaktifkan — akses mereka menempel di
-- digital_purchases.expires_at, bukan di baris ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = 'ceb60fae-9c6b-4df4-aba3-fe0582fa3cf2';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('8faa533c-9222-4d95-946d-8fb58f67894d',  79000,  180, '6 Bulan',   1, true),
  ('8faa533c-9222-4d95-946d-8fb58f67894d', 149000,  365, '12 Bulan',  2, true),
  ('8faa533c-9222-4d95-946d-8fb58f67894d', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '8faa533c-9222-4d95-946d-8fb58f67894d'
--  order by is_active desc, sort_order;
