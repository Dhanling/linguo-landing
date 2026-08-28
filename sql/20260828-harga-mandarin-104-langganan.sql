-- [harga-new-edition-langganan-v1]
-- Mandarin 104 new edition (slug mandarin-104-b2-id) — modul mahir tingkat B2
-- yang menutup seri 中文 101–104. Baris katalognya BARU, jadi tak ada tier
-- warisan ("Lifetime Rp99.000") yang perlu diarsipkan.
--
-- Harganya disamakan persis dengan Mandarin 101–103 new edition supaya pembeli
-- tidak melihat lompatan harga saat naik level.
--
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('61bf74da-2a17-4e14-ac36-0a168118eb2c',  79000,  180, '6 Bulan',   1, true),
  ('61bf74da-2a17-4e14-ac36-0a168118eb2c', 149000,  365, '12 Bulan',  2, true),
  ('61bf74da-2a17-4e14-ac36-0a168118eb2c', 249000, null, 'Selamanya', 3, true);

commit;

-- Pemeriksaan sesudahnya — harus keluar 3 baris aktif:
-- select price, duration_days, display_label, sort_order, is_active
--   from digital_product_pricing
--  where product_id = '61bf74da-2a17-4e14-ac36-0a168118eb2c'
--  order by sort_order;
