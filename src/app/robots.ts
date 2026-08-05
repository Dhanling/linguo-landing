import type { MetadataRoute } from "next";

// [seo-robots-v1] Sebelumnya situs ini TIDAK punya robots.txt sama sekali.
// Akibatnya dua hal: (1) sitemap tidak pernah diumumkan ke crawler, dan
// (2) area privat (dashboard siswa, halaman bayar, token onboarding) ikut
// dirayapi — jatah crawl kebuang di halaman yang memang tidak boleh, dan
// tidak mungkin, dapat peringkat.
//
// Catatan: Disallow di sini urusan CRAWL, bukan INDEX. Halaman privat juga
// diberi `robots: { index: false }` lewat layout masing-masing supaya kalau
// terlanjur ada yang menaut ke sana, tetap tidak muncul di hasil pencarian.

const BASE = "https://linguo.id";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/akun",          // dashboard siswa (butuh login)
          "/akun/",
          "/student/",      // dashboard siswa lama
          "/auth/",         // callback & reset password
          "/payment/",      // halaman hasil pembayaran
          "/onboarding/",   // ber-token, unik per orang
          "/pendataan/",    // form pendataan siswa, ber-token per registrasi
          "/kuis/",         // lembar kerja ber-token, satu siswa satu link
          "/kelas/konfirmasi/", // konfirmasi jadwal, ber-token per sesi
          "/laporan-b2b/",  // laporan klien, tidak untuk publik
          "/riset",         // sudah noindex, sekalian jangan dirayapi
          "/riset/",
          "/pretest/",
          "/micro-teaching", // materi internal rekrutmen pengajar
          "/*?ref=",        // parameter afiliasi → cegah duplikat konten
        ],
      },
    ],
    sitemap: [
      `${BASE}/sitemap.xml`,
      `${BASE}/blog/sitemap.xml`,
      `${BASE}/silabus/sitemap.xml`,
    ],
    host: BASE,
  };
}
