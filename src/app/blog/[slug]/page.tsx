import { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&status=eq.published&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch {
    return null;
  }
}

async function getRelatedPosts(category: string, currentSlug: string) {
  try {
    const url = category
      ? `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&category=eq.${category}&slug=neq.${currentSlug}&order=published_at.desc&limit=3`
      : `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&slug=neq.${currentSlug}&order=published_at.desc&limit=3`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const post = await getPost(slug);
  if (!post) return { title: "Artikel tidak ditemukan | Linguo.id" };
  return {
    title: (post.meta_title || post.title) + " | Linguo.id",
    description: post.meta_description || post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || "",
      url: `https://linguo.id/blog/${post.slug}`,
      siteName: "Linguo.id",
      type: "article",
      publishedTime: post.published_at,
      authors: [post.author || "Linguo Team"],
      ...(post.featured_image ? { images: [{ url: post.featured_image, width: 1200, height: 630 }] } : {}),
    },
    alternates: { canonical: `https://linguo.id/blog/${post.slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = params;
  const post = await getPost(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.category, slug);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: post.featured_image || "",
    author: { "@type": "Person", name: post.author || "Linguo Team" },
    publisher: { "@type": "Organization", name: "Linguo.id", url: "https://linguo.id" },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    url: `https://linguo.id/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleContent post={post} relatedPosts={related} />
    </>
  );
}
