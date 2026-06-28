import { Metadata } from "next";
import BlogContent from "./BlogContent";

// Render per-request: time-gate post terjadwal harus dievaluasi dgn `now` yang
// selalu segar. ISR durable cache (Vercel) pernah bikin post terjadwal bocor
// tayang lebih awal karena halaman ke-cache tidak ter-regenerate dgn filter
// `published_at<=now`. force-dynamic menjamin filter selalu live.
export const dynamic = "force-dynamic";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

export const metadata: Metadata = {
  title: "Blog | Linguo.id — Kursus Bahasa Online 60+ Bahasa",
  description: "Artikel, tips, dan panduan belajar bahasa dari Linguo.id. Pelajari berbagai bahasa dengan metode interaktif.",
  openGraph: {
    title: "Blog | Linguo.id",
    description: "Artikel, tips, dan panduan belajar bahasa dari Linguo.id",
    url: "https://linguo.id/blog",
    siteName: "Linguo.id",
    type: "website",
  },
  alternates: { canonical: "https://linguo.id/blog" },
};

async function getPosts() {
  try {
    // Time-gate: sembunyikan post terjadwal (published_at di masa depan).
    // `now` dievaluasi per-request (force-dynamic + no-store) → post terjadwal
    // tayang otomatis tepat waktu tanpa bisa bocor lewat cache basi.
    const now = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&published_at=lte.${now}&order=published_at.desc`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <BlogContent initialPosts={posts} />;
}
