import { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleContent from "./ArticleContent";

// Safety net: revalidate every 60s even if webhook fails
export const revalidate = 60;

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&status=eq.published&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch { return null; }
}

async function getRelatedPosts(category: string, currentSlug: string) {
  try {
    const url = category
      ? `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&category=eq.${encodeURIComponent(category)}&slug=neq.${currentSlug}&order=published_at.desc&limit=3`
      : `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&slug=neq.${currentSlug}&order=published_at.desc&limit=3`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) return { title: "Artikel tidak ditemukan | Linguo.id" };

  // SEO fields with smart fallbacks
  const rawContent = post.content?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
  const seoTitle = (post.seo_title || post.title).trim();
  const seoDescription = (post.seo_description || post.excerpt || rawContent.slice(0, 160)).trim();
  const shareImage = post.og_image || post.cover_image;
  const keywords = [
    post.focus_keyword,
    ...(post.tags || []),
    post.category,
    "Linguo.id",
    "belajar bahasa",
  ].filter(Boolean) as string[];

  // Title: use SEO title as-is if user set it, else append "| Linguo.id"
  const fullTitle = post.seo_title ? seoTitle : `${seoTitle} | Linguo.id`;

  return {
    title: fullTitle,
    description: seoDescription,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: [{ name: "Linguo Team", url: "https://linguo.id" }],
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `https://linguo.id/blog/${post.slug}`,
      siteName: "Linguo.id",
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: ["Linguo Team"],
      tags: post.tags,
      locale: "id_ID",
      ...(shareImage ? {
        images: [{
          url: shareImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
        }]
      } : {}),
    },
    twitter: {
      card: shareImage ? "summary_large_image" : "summary",
      title: seoTitle,
      description: seoDescription,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    alternates: { canonical: `https://linguo.id/blog/${post.slug}` },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ArticlePage(props: any) {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.category, params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: post.cover_image || "",
    author: { "@type": "Organization", name: "Linguo.id", url: "https://linguo.id" },
    publisher: { "@type": "Organization", name: "Linguo.id", url: "https://linguo.id" },
    datePublished: post.published_at,
    url: `https://linguo.id/blog/${post.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleContent post={post} relatedPosts={related} />
    </>
  );
}
