import type { MetadataRoute } from "next";
import { languages as curriculumLanguages } from "@/data/curriculum";
import { getAllLanguageDetailSlugs } from "@/data/languages-detail";

// [seo-sitemap-lengkap-v1] Sebelumnya sitemap ini cuma memuat 4 URL statis
// (/, /blog, /corporate, /jadi-pengajar) + daftar post blog. Belasan halaman
// publik lain tidak pernah didaftarkan — termasuk /kelas/bahasa-* yang justru
// halaman paling bernilai untuk pencarian ("kursus bahasa jepang online" dsb)
// dan sudah punya Course + FAQ schema. Halaman itu juga tidak ditaut dari mana
// pun, jadi praktis tidak terlihat oleh Google.
//
// Aturan main file ini:
// - Hanya URL yang boleh diindeks. Area privat & halaman noindex TIDAK masuk
//   (lihat src/app/robots.ts).
// - Prioritas mencerminkan nilai bisnis: halaman uang > halaman info.
// - Jangan pakai URL yang kena redirect (mis. /produk → /toko/paket-elearning).

const BASE = "https://linguo.id";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

/** Halaman statis publik. `priority` relatif terhadap homepage (1.0). */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },

  // Halaman uang — konversi langsung
  { path: "/harga", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kelas", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kelas-trial", priority: 0.9, changeFrequency: "weekly" },
  { path: "/persiapan-tes", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kelas-anak", priority: 0.85, changeFrequency: "monthly" },
  { path: "/jadwal-kelas-reguler", priority: 0.85, changeFrequency: "weekly" },
  { path: "/toko", priority: 0.8, changeFrequency: "weekly" },
  { path: "/toko/paket-elearning", priority: 0.8, changeFrequency: "weekly" },
  { path: "/simulasi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/simulasi/paket", priority: 0.7, changeFrequency: "monthly" },

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
  { path: "/jadi-interpreter", priority: 0.6, changeFrequency: "monthly" },
  { path: "/jadi-penerjemah-tersumpah", priority: 0.6, changeFrequency: "monthly" },
  { path: "/afiliator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/lingfluencer", priority: 0.5, changeFrequency: "monthly" },
  { path: "/karir", priority: 0.5, changeFrequency: "weekly" },

  // Legal — nilai peringkat nol, tapi sinyal kepercayaan untuk Google
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/syarat-ketentuan", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: r.path === "/" ? BASE : `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Landing page per bahasa — prioritas paling tinggi setelah homepage, karena
  // inilah halaman yang menyasar kueri paling bernilai.
  for (const slug of getAllLanguageDetailSlugs()) {
    entries.push({
      url: `${BASE}/kelas/bahasa-${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    });
  }

  // Silabus per bahasa
  for (const lang of curriculumLanguages) {
    if (lang.available) {
      entries.push({
        url: `${BASE}/silabus/${lang.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Post blog. Time-gate: jangan bocorkan URL post terjadwal (published_at masa
  // depan) ke Google sebelum tayang — selaras dgn /blog & /blog/[slug].
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&published_at=lte.${now.toISOString()}&select=slug,published_at&order=published_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: "no-store" }
    );
    if (res.ok) {
      const posts = await res.json();
      for (const post of posts) {
        entries.push({
          url: `${BASE}/blog/${post.slug}`,
          lastModified: new Date(post.published_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {}

  return entries;
}
