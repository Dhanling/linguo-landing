import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleContent from "./ArticleContent";
import TableOfContents from "./TableOfContents";

// Safety net: revalidate every 60s even if webhook fails
export const revalidate = 60;

const SUPABASE_URL = "https://jbtgciepdmqxxcjflrxz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidGdjaWVwZG1xeHhjamZscnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzE1MjMsImV4cCI6MjA5MDYwNzUyM30.29Md_mApQjnCoCzYAKcvLU2CB7Y3KZzyepSMcvV_7hs";

async function getPost(slug: string) {
  try {
    // Time-gate: post terjadwal (published_at masa depan) → 404 sampai waktunya tiba.
    const now = new Date().toISOString();
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?slug=eq.${slug}&status=eq.published&published_at=lte.${now}&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch { return null; }
}

async function getRelatedPosts(category: string, currentSlug: string) {
  try {
    const now = new Date().toISOString();
    const url = category
      ? `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&published_at=lte.${now}&category=eq.${encodeURIComponent(category)}&slug=neq.${currentSlug}&order=published_at.desc&limit=3`
      : `${SUPABASE_URL}/rest/v1/blog_posts?status=eq.published&published_at=lte.${now}&slug=neq.${currentSlug}&order=published_at.desc&limit=3`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// Shared SEO fields builder — used by both generateMetadata and the JSON-LD schema
function buildSeoFields(post: any) {
  const rawContent = post.content?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() || "";
  const seoTitle = (post.seo_title || post.title).trim();
  const seoDescription = (post.seo_description || post.excerpt || rawContent.slice(0, 160)).trim();
  const shareImage = post.og_image || post.cover_image;
  return { seoTitle, seoDescription, shareImage };
}

export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) return { title: "Artikel tidak ditemukan | Linguo.id" };

  const { seoTitle, seoDescription, shareImage } = buildSeoFields(post);

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

  const { seoDescription, shareImage } = buildSeoFields(post);
  const articleUrl = `https://linguo.id/blog/${post.slug}`;

  // ============================================================================
  // BlogPosting Schema — eligible for Google rich results
  // Required fields: headline, image, datePublished, author
  // Recommended: dateModified, publisher.logo, mainEntityOfPage, description
  // ============================================================================
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${articleUrl}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    headline: post.title,
    description: seoDescription,
    ...(shareImage ? {
      image: {
        "@type": "ImageObject",
        url: shareImage,
        width: 1200,
        height: 630,
      }
    } : {}),
    author: {
      "@type": "Organization",
      name: "Linguo.id",
      url: "https://linguo.id",
    },
    publisher: {
      "@type": "Organization",
      name: "Linguo.id",
      url: "https://linguo.id",
      logo: {
        "@type": "ImageObject",
        url: "https://linguo.id/images/logo-color.png",
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    inLanguage: "id-ID",
    ...(post.category ? { articleSection: post.category } : {}),
    ...(Array.isArray(post.tags) && post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
  };

  // ============================================================================
  // BreadcrumbList Schema — enables breadcrumb display in search results
  // ============================================================================
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Beranda",
        item: "https://linguo.id",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://linguo.id/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Visible breadcrumb — server-rendered for SEO + UX */}
      <nav
        aria-label="Breadcrumb"
        className="border-b border-slate-100 bg-white"
      >
        <ol className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-sm text-slate-600">
          <li className="shrink-0">
            <Link href="/" className="transition hover:text-[#1A9E9E]">
              Beranda
            </Link>
          </li>
          <li aria-hidden className="shrink-0 text-slate-400">/</li>
          <li className="shrink-0">
            <Link href="/blog" className="transition hover:text-[#1A9E9E]">
              Blog
            </Link>
          </li>
          <li aria-hidden className="shrink-0 text-slate-400">/</li>
          <li
            className="truncate font-medium text-slate-900"
            aria-current="page"
            title={post.title}
          >
            {post.title}
          </li>
        </ol>
      </nav>

      <ArticleContent post={post} relatedPosts={related} />
      <TableOfContents />
    </>
  );
}
