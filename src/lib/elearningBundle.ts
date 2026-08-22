// [elearning-per-bahasa-v1] E-learning sekarang dijual PER BAHASA (Rp 79.000 /
// 6 bulan, Rp 150.000 / 1 tahun). Paket lama "12+ bahasa sekaligus" tidak dijual
// lagi, TAPI barisnya di `digital_products` sengaja dibiarkan aktif: 37 pembeli
// lama membacanya lewat join `digital_purchases → digital_products`, dan tombol
// "Perpanjang" di Perpustakaan mengambil tier harganya dari baris yang sama.
// Kalau baris ini dinonaktifkan, policy baca publik (is_active) ikut menutupnya
// dan produk mereka hilang dari Perpustakaan.
//
// Jadi cara menyembunyikannya bukan is_active, melainkan menyaring slug ini dari
// semua etalase publik. Satu-satunya sumber slug-nya ada di sini.
export const ELEARNING_BUNDLE_SLUG = 'paket-elearning-10-bahasa';

/** Produk ini masih boleh dijual/diperpanjang? */
export const masihDijual = (slug?: string | null) => slug !== ELEARNING_BUNDLE_SLUG;
