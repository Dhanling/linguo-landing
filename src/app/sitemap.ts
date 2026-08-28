import type { MetadataRoute } from "next";
import { getAllLanguageDetailSlugs } from "@/data/languages-detail";
import { ALL_LANG_SLUGS } from "@/lib/funnelRouting";

// [seo-sitemap-lengkap-v1] Sebelumnya sitemap ini cuma memuat 4 URL statis
// (/, /blog, /corporate, /jadi-pengajar) + daftar post blog. Belasan halaman
// publik lain tidak pernah didaftarkan — termasuk /kursus/bahasa-* yang justru
// halaman paling bernilai untuk pencarian ("kursus bahasa jepang online" dsb)
// dan sudah punya Course + FAQ schema. Halaman itu juga tidak ditaut dari mana
// pun, jadi praktis tidak terlihat oleh Google.
//
// Aturan main file ini:
// - Hanya URL yang boleh diindeks. Area privat & halaman noindex TIDAK masuk
//   (lihat src/app/robots.ts).
// - Prioritas mencerminkan nilai bisnis: halaman uang > halaman info.
// - Jangan pakai URL yang kena redirect (mis. /produk → /toko/paket-elearning).
//
// [seo-sitemap-tanpa-tumpang-tindih-v1] File ini TIDAK LAGI memuat /blog/* dan
// /silabus/*. Dulu ketiga sitemap saling menimpa: /sitemap.xml memuat 445 URL
// yang sudah termasuk 325 post blog (juga diumumkan lewat /blog/sitemap.xml)
// dan 48 silabus (juga lewat /silabus/sitemap.xml). Akibat praktisnya di
// Search Console, laporan "halaman ditemukan vs terindeks" per sitemap jadi
// tidak bisa dibaca — tidak ketahuan berapa persen artikel blog yang benar-
// benar terindeks karena angkanya bercampur dengan halaman statis.
//
// Sekarang pembagiannya tegas, satu URL cuma diumumkan satu sitemap:
//   /sitemap.xml         → halaman statis + 45 landing /kursus/bahasa-*
//   /blog/sitemap.xml    → /blog, arsip, kategori, dan semua post
//   /silabus/sitemap.xml → /silabus + silabus per bahasa
// Ketiganya tetap didaftarkan di robots.ts dan tetap dikirim ke GSC.

const BASE = "https://linguo.id";

// [seo-lastmod-jujur-v1] Dulu SEMUA entri dicap `new Date()` alias "berubah
// hari ini" tiap kali sitemap di-generate. Google membandingkan lastmod dengan
// isi halaman yang sebenarnya; kalau selalu bergerak padahal isinya diam, sinyal
// ini dinilai tidak dapat dipercaya lalu diabaikan seluruhnya untuk domain ini.
// Jadi tanggalnya sekarang dipatok manual. NAIKKAN tanggal di bawah HANYA saat
// isi halaman yang bersangkutan benar-benar diubah.
const STATIC_UPDATED = new Date("2026-08-17");
/** Landing /kursus/bahasa-* pindah URL dari /kelas pada 17 Agustus 2026. */
const KURSUS_UPDATED = new Date("2026-08-17");
/** Funnel pendaftaran /daftar lahir sebagai halaman pada 17 Agustus 2026. */
const DAFTAR_UPDATED = new Date("2026-08-17");

/** Halaman statis publik. `priority` relatif terhadap homepage (1.0). */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },

  // Halaman uang — konversi langsung
  // [daftar-page-funnel-v1] /daftar = hub pendaftaran (dulu modal di homepage).
  // Langkah dalamnya (/daftar/<bahasa>/<program>/...) noindex — JANGAN didaftarkan.
  { path: "/daftar", priority: 0.9, changeFrequency: "weekly" },
  { path: "/harga", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kursus", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kelas-trial", priority: 0.9, changeFrequency: "weekly" },
  { path: "/persiapan-tes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kelas-anak", priority: 0.85, changeFrequency: "monthly" },
  { path: "/jadwal-kelas-reguler", priority: 0.85, changeFrequency: "weekly" },
  { path: "/toko", priority: 0.8, changeFrequency: "weekly" },
  { path: "/toko/paket-elearning", priority: 0.8, changeFrequency: "weekly" },
  // [seo-ebook-canonical-v1] /produk/ebook halaman jualan sungguhan (ditaut dari
  // homepage) yang dulu tidak pernah didaftarkan di sini DAN canonical-nya
  // menunjuk homepage — praktis mustahil diindeks. Lihat produk/ebook/layout.tsx.
  { path: "/produk/ebook", priority: 0.8, changeFrequency: "weekly" },
  { path: "/simulasi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/simulasi/paket", priority: 0.7, changeFrequency: "monthly" },

  // [aeo-halaman-entitas-v1] Dua halaman yang sasarannya mesin jawaban, bukan
  // kueri transaksional: /tentang mendefinisikan entitas Linguo.id (dipakai
  // model untuk menjawab "apa itu Linguo"), /perbandingan menjawab kueri
  // "X vs Y" yang selama ini dijawab pihak ketiga.
  { path: "/tentang", priority: 0.8, changeFrequency: "monthly" },
  { path: "/perbandingan", priority: 0.8, changeFrequency: "monthly" },

  // Konten & alat gratis — mesin akuisisi organik
  { path: "/blog", priority: 0.9, changeFrequency: "daily" },
  { path: "/silabus", priority: 0.8, changeFrequency: "weekly" },
  // [seo-metadata-halaman-v1] /kosakata DIKELUARKAN. Isinya flashcard kata
  // tersimpan milik siswa (dibaca dari localStorage, tombol tutupnya jatuh ke
  // /akun) — bukan konten yang bisa dirayapi, dan buat crawler selalu tampak
  // kosong. Sekarang noindex + disallow di robots.ts.
  { path: "/watch-learn", priority: 0.75, changeFrequency: "weekly" },
  { path: "/watch", priority: 0.6, changeFrequency: "weekly" },

  // B2B & layanan
  { path: "/corporate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/corporate-pricelist", priority: 0.6, changeFrequency: "monthly" },
  { path: "/interpreter", priority: 0.7, changeFrequency: "monthly" },
  { path: "/translator", priority: 0.7, changeFrequency: "monthly" },

  // Rekrutmen & kemitraan
  { path: "/jadi-pengajar", priority: 0.7, changeFrequency: "monthly" },
  // [seo-halaman-yatim-v1] Versi Inggris halaman rekrutmen pengajar. Sudah
  // punya judul, deskripsi, dan canonical sendiri serta boleh diindeks, tapi
  // tidak pernah diumumkan di sitemap mana pun — padahal justru halaman ini
  // yang menyasar pelamar non-Indonesia (banyak pengajar Linguo penutur asli).
  { path: "/jadi-pengajar/en", priority: 0.6, changeFrequency: "monthly" },
  { path: "/jadi-interpreter", priority: 0.6, changeFrequency: "monthly" },
  { path: "/jadi-penerjemah-tersumpah", priority: 0.6, changeFrequency: "monthly" },
  { path: "/afiliator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/lingfluencer", priority: 0.5, changeFrequency: "monthly" },
  { path: "/karir", priority: 0.5, changeFrequency: "weekly" },

  // Legal — nilai peringkat nol, tapi sinyal kepercayaan untuk Google
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/syarat-ketentuan", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: r.path === "/" ? BASE : `${BASE}${r.path}`,
    lastModified: STATIC_UPDATED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Landing page per bahasa — prioritas paling tinggi setelah homepage, karena
  // inilah halaman yang menyasar kueri paling bernilai.
  for (const slug of getAllLanguageDetailSlugs()) {
    entries.push({
      url: `${BASE}/kursus/bahasa-${slug}`,
      lastModified: KURSUS_UPDATED,
      changeFrequency: "weekly",
      priority: 0.95,
    });
  }

  // [daftar-page-funnel-v1] Halaman pendaftaran per bahasa. Pasangan transaksional
  // dari /kursus/bahasa-*: yang satu menjelaskan, yang satu menerima pendaftaran.
  // Prioritasnya di bawah landing supaya landing tetap yang dimenangkan Google
  // untuk kueri informasional.
  for (const slug of ALL_LANG_SLUGS) {
    entries.push({
      url: `${BASE}/daftar/${slug}`,
      lastModified: DAFTAR_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
