import { MetadataRoute } from "next";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: "https://linguo.id", lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: "https://linguo.id/blog", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://linguo.id/corporate", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://linguo.id/jadi-pengajar", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&select=slug,published_at&order=published_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const posts = await res.json();
      for (const post of posts) {
        entries.push({
          url: `https://linguo.id/blog/${post.slug}`,
          lastModified: new Date(post.published_at),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {}

  return entries;
}
