-- [harga-new-edition-langganan-v1]
-- Korean 101 new edition (slug modul-korea-101-id) masih memakai baris harga
-- warisan modul lama: "Lifetime Rp99.000". Saudara-saudaranya yang sama-sama
-- edisi baru — Japanese 101, Spanish 101, English 101, Deutsch 101, Mandarin 101
-- dan Italiano 101 — sudah berformat langganan 6/12 bulan + opsi selamanya.
-- Skrip ini menyamakan.
--
-- Baris lama TIDAK dihapus: pembelian yang sudah ada bisa menunjuk ke id-nya
-- lewat digital_purchases.pricing_id (per 23 Agu 2026 ada satu baris "Belum
-- Bayar" atas nama faujiahhsnh@gmail.com). Cukup dinonaktifkan — akses pembeli
-- menempel di digital_purchases.expires_at, bukan di baris tier ini.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

-- 1) arsipkan tier lifetime warisan
update digital_product_pricing
   set is_active = false
 where id = '5b001b61-9f6d-415d-868b-679d257ff4d4';

-- 2) tiga tier langganan, persis pola new edition yang lain
insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('d6be5c16-49fb-472f-9095-a709ee57d0bc',  79000,  180, '6 Bulan',   1, true),
  ('d6be5c16-49fb-472f-9095-a709ee57d0bc', 149000,  365, '12 Bulan',  2, true),
  ('d6be5c16-49fb-472f-9095-a709ee57d0bc', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif + 1 baris arsip:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = 'd6be5c16-49fb-472f-9095-a709ee57d0bc'
--  order by is_active desc, sort_order;
