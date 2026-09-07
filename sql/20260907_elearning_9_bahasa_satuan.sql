-- [elearning-per-bahasa-v1] E-learning tidak lagi dijual sebagai paket
-- "12+ bahasa sekaligus" (slug paket-elearning-10-bahasa, isinya 22 playlist di
-- digital_product_langs). Yang dijual sekarang satu produk per bahasa.
--
-- Dari 22 bahasa di paket lama, baru 13 yang punya produk satuan. Skrip ini
-- melengkapi 9 sisanya — Vietnam, Thailand, Hungaria, Swahili, Rusia, Yunani,
-- Polandia, NORWEGIA, dan Estonia — supaya semua bahasa yang dulu ikut paket
-- tetap bisa dibeli satuan di /toko/paket-elearning.
--
-- Playlist-nya diambil dari baris paket lama (digital_product_langs), jadi tidak
-- ada materi baru yang perlu diunggah. Kolom `language` sengaja memakai nama
-- Inggris: itu kunci bendera (FLAG_CODE_BY_SLUG) dan foto stok (LANG_PHOTO_SLUG)
-- di landing. Harga rata seperti bahasa lain: Rp 79.000 / 6 bulan, Rp 150.000 / 1 tahun.
--
-- Aman diulang (ON CONFLICT / NOT EXISTS).

insert into digital_products
  (type, title, slug, description, language, level, category, video_provider, video_playlist_url, is_active, is_featured)
values
  ('elearning','E-Learning Bahasa Vietnam Linguo — Rekaman Kelas Basic','elearning-vietnam',
   'Rekaman kelas bahasa Vietnam level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Vietnamese','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD1YI4zr3p8cmuqy-qrc5Boo',true,false),
  ('elearning','E-Learning Bahasa Thailand Linguo — Rekaman Kelas Basic','elearning-thailand',
   'Rekaman kelas bahasa Thailand level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Thai','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD2l5oMUa63h2WChJ-6uzyKZ',true,false),
  ('elearning','E-Learning Bahasa Hungaria Linguo — Rekaman Kelas Basic','elearning-hungaria',
   'Rekaman kelas bahasa Hungaria level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Hungarian','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD0AIqVIz85FqFw7p-_xtdc0',true,false),
  ('elearning','E-Learning Bahasa Swahili Linguo — Rekaman Kelas Basic','elearning-swahili',
   'Rekaman kelas bahasa Swahili level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Swahili','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD0_PJqOm859TjpaI4jVG9WS',true,false),
  ('elearning','E-Learning Bahasa Rusia Linguo — Rekaman Kelas Basic','elearning-rusia',
   'Rekaman kelas bahasa Rusia level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Russian','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD2dXiYP62okntIKmL75_hH7',true,false),
  ('elearning','E-Learning Bahasa Yunani Linguo — Rekaman Kelas Basic','elearning-yunani',
   'Rekaman kelas bahasa Yunani level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Greek','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD26y8m2h1uY1OlyOw-b_Lkx',true,false),
  ('elearning','E-Learning Bahasa Polandia Linguo — Rekaman Kelas Basic','elearning-polandia',
   'Rekaman kelas bahasa Polandia level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Polish','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD1vp5TOeq0cVnHxARWimNw4',true,false),
  ('elearning','E-Learning Bahasa Norwegia Linguo — Rekaman Kelas Basic','elearning-norwegia',
   'Rekaman kelas bahasa Norwegia level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Norwegian','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD2MczrmH_sYeprsVFGBatyj',true,false),
  ('elearning','E-Learning Bahasa Estonia Linguo — Rekaman Kelas Basic','elearning-estonia',
   'Rekaman kelas bahasa Estonia level Basic (A1) dari pengajar Linguo. Belajar mandiri lewat video, ulang sesukamu, akses dari HP atau laptop. Pilih akses 6 bulan atau 1 tahun.',
   'Estonian','A1','fundamentals','youtube','https://www.youtube.com/playlist?list=PL7Ie066ouJD1EFGM6y0R3WWa09Dls6r5f',true,false)
on conflict (slug) do nothing;

-- Tier harga: sama persis dengan 13 bahasa yang sudah terbit.
insert into digital_product_pricing (product_id, duration_days, price, display_label, is_active, sort_order)
select p.id, t.duration_days, t.price, t.display_label, true, t.sort_order
from digital_products p
cross join (values (180, 79000, '6 Bulan', 1), (365, 150000, '12 Bulan', 2))
  as t(duration_days, price, display_label, sort_order)
where p.slug in (
  'elearning-vietnam','elearning-thailand','elearning-hungaria','elearning-swahili',
  'elearning-rusia','elearning-yunani','elearning-polandia','elearning-norwegia','elearning-estonia'
)
and not exists (
  select 1 from digital_product_pricing dp
  where dp.product_id = p.id and dp.duration_days = t.duration_days
);
