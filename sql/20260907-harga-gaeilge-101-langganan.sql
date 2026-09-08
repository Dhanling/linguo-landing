-- [harga-new-edition-langganan-v1]
-- Gaeilge 101 new edition (slug gaeilge-101-a1-id) adalah modul buatan sendiri
-- yang PERTAMA untuk bahasa Irlandia — katalog belum pernah punya barisnya,
-- jadi tak ada tier "Lifetime Rp99.000" warisan yang perlu diarsipkan.
--
-- Harganya disamakan dengan Japanese/Spanish/English/German/Italiano 101
-- new edition: langganan 6 bulan, 12 bulan, dan opsi selamanya.
--
-- Kembaran skrip: scripts/harga-gaeilge-101-langganan.mjs
-- Jalankan di Supabase SQL Editor (project jbtgciepdmqxxcjflrxz).

begin;

insert into digital_product_pricing
  (product_id, price, duration_days, display_label, sort_order, is_active)
values
  ('17d527b4-6802-43f7-8085-79a85a59455e',  79000,  180, '6 Bulan',   1, true),
  ('17d527b4-6802-43f7-8085-79a85a59455e', 149000,  365, '12 Bulan',  2, true),
  ('17d527b4-6802-43f7-8085-79a85a59455e', 249000, null, 'Selamanya', 3, true);

commit;
