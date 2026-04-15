import { Metadata } from "next";
import BlogContent from "./BlogContent";

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
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&order=published_at.desc`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        next: { revalidate: 60 },
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
