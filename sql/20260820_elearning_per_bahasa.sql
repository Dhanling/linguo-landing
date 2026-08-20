-- [elearning-per-bahasa-v1] E-learning dipecah: dijual PER BAHASA.
--
-- Sebelumnya cuma ada satu produk "Paket E-Learning 12+ Bahasa" (slug
-- paket-elearning-10-bahasa) seharga 29rb/1 bln, 99rb/6 bln, 179rb/12 bln,
-- dengan daftar bahasanya di `digital_product_langs`. Sekarang tiap bahasa
-- jadi produk sendiri dengan dua tier harga yang sama rata:
--   Rp 79.000  → akses 6 bulan  (180 hari)
--   Rp 150.000 → akses 1 tahun  (365 hari)
--
-- Bahasa diambil dari pilihan yang sudah ada di dashboard (digital_product_langs
-- milik paket lama): 13 bahasa.
--
-- CATATAN: baris paket lama SENGAJA dibiarkan is_active = true. 37 pembeli lama
-- membacanya lewat join digital_purchases → digital_products, dan tombol
-- "Perpanjang" di Perpustakaan mengambil tier harganya dari baris yang sama;
-- kalau dimatikan, policy baca publik (is_active) ikut menutupnya dan produk
-- mereka hilang dari Perpustakaan. Penyembunyiannya dilakukan di aplikasi lewat
-- saringan slug — lihat src/lib/elearningBundle.ts.
--
-- Sudah DIJALANKAN di prod 20 Agustus 2026 (lewat PostgREST service role).
-- File ini disimpan sebagai catatan + supaya bisa diulang di lingkungan lain.
-- Idempoten: aman dijalankan berkali-kali.

with bahasa(en, id_nama, slug, urut) as (
  values
    ('English',   'Inggris',            'inggris',    1),
    ('Spanish',   'Spanyol',            'spanyol',    2),
    ('German',    'Jerman',             'jerman',     3),
    ('Japanese',  'Jepang',             'jepang',     4),
    ('Mandarin',  'Mandarin',           'mandarin',   5),
    ('Dutch',     'Belanda',            'belanda',    6),
    ('Arabic',    'Arab',               'arab',       7),
    ('French',    'Prancis',            'prancis',    8),
    ('Korean',    'Korea',              'korea',      9),
    ('Tagalog',   'Tagalog (Filipina)', 'tagalog',   10),
    ('Italian',   'Italia',             'italia',    11),
    ('Ukrainian', 'Ukraina',            'ukraina',   12),
    ('Finnish',   'Finlandia',          'finlandia', 13)
)
insert into digital_products
  (type, title, slug, description, language, level, category, video_provider, is_active, is_featured)
select
  'elearning',
  'E-Learning Bahasa ' || id_nama || ' Linguo — Rekaman Kelas Basic',
  'elearning-' || slug,
  'Rekaman kelas bahasa ' || id_nama || ' level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
  en,
  'A1',
  'fundamentals',
  'youtube',
  true,
  en = 'English'
from bahasa
on conflict (slug) do nothing;

-- Dua tier harga untuk tiap produk e-learning per bahasa.
insert into digital_product_pricing (product_id, price, duration_days, display_label, sort_order, is_active)
select p.id, t.price, t.duration_days, t.display_label, t.sort_order, true
from digital_products p
cross join (values
  (79000,  180, '6 Bulan',  1),
  (150000, 365, '12 Bulan', 2)
) as t(price, duration_days, display_label, sort_order)
where p.type = 'elearning'
  and p.slug like 'elearning-%'
  and not exists (
    select 1 from digital_product_pricing dp
    where dp.product_id = p.id and dp.duration_days = t.duration_days
  );
