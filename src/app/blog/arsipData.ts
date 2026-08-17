// [seo-blog-bisa-dirayapi-v1]
// Masalah yang diperbaiki file ini: /blog merender daftar artikelnya lewat
// komponen klien dengan infinite scroll (FEED_BATCH = 8). Artinya di HTML yang
// diterima Googlebot cuma ada 8 tautan artikel — dari 375 post yang terbit.
// Sisanya hanya diumumkan lewat sitemap, sinyal paling lemah yang ada, dan
// tidak punya satu pun jalur tautan internal. Itu sebabnya 326 URL blog
// terdaftar di Search Console tapi tidak satu pun artikel muncul di laporan
// konten teratas.
//
// Solusinya bukan mengubah UX /blog (infinite scroll-nya tetap), melainkan
// menambah halaman arsip & kategori yang dirender di server dan berisi tautan
// <a href> sungguhan ke SETIAP artikel. Halaman itu lalu ditaut dari /blog
// (lihat JelajahiNav.tsx) sehingga jalur rayapnya lengkap:
//
//   /blog → /blog/arsip           → 375 artikel
//   /blog → /blog/kategori/<slug> → semua artikel kategori tsb
//
// Query di sini sengaja hanya mengambil kolom yang dipakai daftar (bukan
// `content` yang berisi seluruh badan artikel), supaya halaman arsip tidak
// menarik belasan MB dari Supabase tiap kali dirayapi.

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

export type ArsipPost = {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  published_at: string;
};

export type BlogKategori = {
  /** Bagian URL: /blog/kategori/<slug> */
  slug: string;
  /** Nilai kolom `category` di tabel blog_posts. Case-sensitive. */
  dbValue: string;
  label: string;
  title: string;
  description: string;
  /** Kalimat pembuka halaman kategori. */
  intro: string;
};

export const BLOG_KATEGORI: BlogKategori[] = [
  {
    slug: "grammar",
    dbValue: "Grammar",
    label: "Grammar",
    title: "Artikel Grammar — Tata Bahasa Lengkap | Blog Linguo.id",
    description:
      "Kumpulan pembahasan tata bahasa: tenses, kata kerja, struktur kalimat, dan aturan grammar berbagai bahasa. Dijelaskan dengan contoh, gratis dibaca.",
    intro:
      "Pembahasan tata bahasa dari dasar sampai lanjutan — tenses, struktur kalimat, kata kerja, dan aturan yang paling sering bikin bingung, lengkap dengan contoh pemakaiannya.",
  },
  {
    slug: "edukasi",
    dbValue: "Edukasi",
    label: "Edukasi",
    title: "Artikel Edukasi Bahasa — Panduan Belajar | Blog Linguo.id",
    description:
      "Panduan belajar bahasa asing: kosakata, pengucapan, persiapan ujian, dan penjelasan seputar bahasa dunia. Gratis dibaca di blog Linguo.id.",
    intro:
      "Panduan dan penjelasan seputar bahasa dunia — kosakata tematik, pengucapan, sistem tulisan, sampai persiapan ujian kemahiran bahasa.",
  },
  {
    slug: "fun",
    dbValue: "Fun",
    label: "Fun",
    title: "Artikel Bahasa Seru & Ringan | Blog Linguo.id",
    description:
      "Sisi menyenangkan dari belajar bahasa: fakta unik, istilah gaul, budaya, dan hal-hal ringan seputar bahasa asing. Gratis dibaca di blog Linguo.id.",
    intro:
      "Sisi ringan dari belajar bahasa — fakta unik, istilah gaul, budaya penuturnya, dan hal-hal yang bikin belajar bahasa terasa menyenangkan.",
  },
  {
    slug: "tips",
    dbValue: "Tips",
    label: "Tips",
    title: "Tips Belajar Bahasa Asing yang Terbukti | Blog Linguo.id",
    description:
      "Cara belajar bahasa asing yang efektif: metode menghafal kosakata, melatih speaking, dan menjaga konsistensi. Gratis dibaca di blog Linguo.id.",
    intro:
      "Cara belajar yang benar-benar jalan — metode menghafal kosakata, melatih speaking dan listening, sampai menjaga konsistensi supaya tidak berhenti di tengah jalan.",
  },
];

export function getKategori(slug: string): BlogKategori | undefined {
  return BLOG_KATEGORI.find((k) => k.slug === slug);
}

/**
 * Ambil post yang sudah terbit, terbaru dulu.
 *
 * Time-gate `published_at <= now` wajib dipertahankan: sama seperti /blog dan
 * /blog/[slug], post terjadwal tidak boleh bocor URL-nya sebelum tayang.
 */
export async function getArsipPosts(dbCategory?: string): Promise<ArsipPost[]> {
  try {
    const now = new Date().toISOString();
    const filter = dbCategory ? `&category=eq.${encodeURIComponent(dbCategory)}` : "";
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&published_at=lte.${now}${filter}` +
        `&select=slug,title,excerpt,category,published_at&order=published_at.desc`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as ArsipPost[];
  } catch {
    return [];
  }
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function formatTanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Kelompokkan post per bulan terbit, urut terbaru dulu. */
export function kelompokkanPerBulan(posts: ArsipPost[]) {
  const map = new Map<string, { judul: string; posts: ArsipPost[] }>();
  for (const p of posts) {
    const d = new Date(p.published_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(key, { judul: `${BULAN[d.getMonth()]} ${d.getFullYear()}`, posts: [] });
    }
    map.get(key)!.posts.push(p);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, v]) => ({ key, ...v }));
}
