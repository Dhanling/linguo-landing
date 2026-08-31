-- [ebook-pratinjau-unit1-v1] Izinkan source = 'preview' di digital_purchases.
--
-- Ini baris AKSES CICIP: calon pembeli yang ingin melihat isinya dulu diberi
-- baris pembelian bernilai Rp0 dengan source 'preview'. Readernya membuka Unit 1
-- saja; sisanya diburamkan + digembok dengan tombol beli.
--
-- Kenapa nilai tersendiri, bukan 'promo':
--   • 'promo' = hadiah akses PENUH (kode FREEEBOOK) — kalau dicampur, pemberian
--     kode gratis dan cicipan tak bisa dibedakan lagi di laporan mana pun;
--   • /api/ebook membaca kolom ini untuk memutuskan batas halaman. Kalau
--     nilainya salah, cicipan berubah jadi akses penuh — diam-diam.
--
-- Pola yang sama dengan 20260820_digital_purchases_source_promo.sql: constraint
-- lama dibuang lalu ditulis ulang dengan satu nilai tambahan.
alter table public.digital_purchases
  drop constraint if exists digital_purchases_source_check;

alter table public.digital_purchases
  add constraint digital_purchases_source_check
  check (source = any (array['xendit','lynk_legacy','manual','class_bundle','promo','preview']));

-- Jatah cicipan dihitung per akun per produk (lihat /api/ebook/pratinjau), dan
-- readernya membaca source tiap kali modul dibuka.
create index if not exists digital_purchases_source_idx
  on public.digital_purchases (source)
  where source = 'preview';
