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

// [aeo-ai-crawlers-v1] Mesin jawaban (ChatGPT, Claude, Gemini, Perplexity,
// AI Overviews) memakai crawler TERPISAH dari Googlebot, dan sebagian dari
// mereka menghormati aturan per-user-agent yang eksplisit jauh lebih patuh
// daripada aturan "*". Situs ini sebelumnya hanya punya blok "*": secara teknis
// itu sudah mengizinkan mereka, tapi TIDAK menyatakan apa pun — tidak ada bukti
// eksplisit kalau nanti ada yang menambahkan Disallow global tanpa sadar.
//
// Blok di bawah menyatakan izin itu hitam di atas putih. Isi disallow-nya
// SENGAJA sama persis dengan blok "*" (lihat PRIVATE_PATHS): area privat siswa
// tetap tidak boleh dirayapi siapa pun, termasuk AI.
//
// Catatan penting soal dua nama di daftar ini:
// - Google-Extended: BUKAN crawler. Ini kenop yang menentukan boleh-tidaknya
//   isi situs dipakai Gemini & grounding AI Overviews. Kalau di-disallow,
//   halaman tetap terindeks Google Search tapi hilang dari jawaban AI-nya.
// - Applebot-Extended: kenop serupa untuk Apple Intelligence.
// Keduanya harus ALLOW supaya konten Linguo boleh dikutip.
//
// Bytespider (ByteDance/TikTok) ikut diizinkan: audiens Linguo besar di TikTok
// dan pencarian dalam-aplikasi TikTok mengambil dari indeks ini.
const AI_CRAWLERS = [
  // OpenAI — GPTBot (latih & jawab), ChatGPT-User (browsing saat diminta user),
  // OAI-SearchBot (indeks ChatGPT Search).
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  // Anthropic — ClaudeBot (crawl), Claude-User (browsing atas permintaan user),
  // Claude-SearchBot (indeks pencarian Claude).
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  // Perplexity — crawler indeks & fetch saat menjawab.
  "PerplexityBot",
  "Perplexity-User",
  // Google & Apple — kenop pemakaian konten untuk AI, bukan crawler baru.
  "Google-Extended",
  "Applebot-Extended",
  // Lainnya.
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "cohere-ai",
  "DuckAssistBot",
];

/**
 * Path yang tidak boleh dirayapi SIAPA PUN — dipakai blok "*" maupun blok AI.
 * Satu daftar supaya keduanya mustahil berbeda.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/akun",          // dashboard siswa (butuh login)
  "/akun/",
  "/student/",      // dashboard siswa lama
  "/auth/",         // callback & reset password
  "/payment/",      // halaman hasil pembayaran
  "/onboarding/",   // ber-token, unik per orang
  "/pendataan/",    // form pendataan siswa, ber-token per registrasi
  "/kosakata",      // flashcard kata tersimpan siswa (localStorage, butuh akun)
  "/kuis/",         // lembar kerja ber-token, satu siswa satu link
  "/kelas/konfirmasi/", // konfirmasi jadwal, ber-token per sesi
  "/laporan-b2b/",  // laporan klien, tidak untuk publik
  "/riset",         // sudah noindex, sekalian jangan dirayapi
  "/riset/",
  "/pretest/",
  "/micro-teaching", // materi internal rekrutmen pengajar
  "/*?ref=",        // parameter afiliasi → cegah duplikat konten
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      // [aeo-ai-crawlers-v1] Izin eksplisit per mesin jawaban.
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: [
      `${BASE}/sitemap.xml`,
      `${BASE}/blog/sitemap.xml`,
      `${BASE}/silabus/sitemap.xml`,
    ],
    host: BASE,
  };
}
