import type { MetadataRoute } from "next";

// [seo-sitemap-blog-v1] File ini dulunya hasil salin-tempel dari sitemap root:
// isinya persis sama (termasuk /, /corporate, /jadi-pengajar), jadi
// /blog/sitemap.xml cuma menggandakan /sitemap.xml tanpa menambah apa pun.
// Sekarang cakupannya benar-benar blog saja.

const BASE = "https://linguo.id";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    // Time-gate: jangan bocorkan URL post terjadwal ke Google sebelum tayang.
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
