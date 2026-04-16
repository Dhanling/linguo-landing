#!/usr/bin/env node
// Update landing page generateMetadata to use SEO fields from dashboard
// Run from ~/linguo-landing root
import fs from "fs";
import { execSync } from "child_process";

const FILE = "src/app/blog/[slug]/page.tsx";
if (!fs.existsSync(FILE)) {
  console.error("[ERR] " + FILE + " not found. Run from ~/linguo-landing root.");
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");

// =================================================================
// Replace generateMetadata to use SEO fields with fallbacks
// =================================================================
const OLD_METADATA = `export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) return { title: "Artikel tidak ditemukan | Linguo.id" };
  const desc = post.excerpt || (post.content?.replace(/<[^>]*>/g, "").slice(0, 160));
  return {
    title: post.title + " | Linguo.id",
    description: desc,
    openGraph: {
      title: post.title,
      description: desc,
      url: \`https://linguo.id/blog/\${post.slug}\`,
      siteName: "Linguo.id",
      type: "article",
      publishedTime: post.published_at,
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    alternates: { canonical: \`https://linguo.id/blog/\${post.slug}\` },
  };
}`;

const NEW_METADATA = `export async function generateMetadata(props: any): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) return { title: "Artikel tidak ditemukan | Linguo.id" };

  // SEO fields with smart fallbacks
  const rawContent = post.content?.replace(/<[^>]*>/g, "").replace(/\\s+/g, " ").trim() || "";
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
  const fullTitle = post.seo_title ? seoTitle : \`\${seoTitle} | Linguo.id\`;

  return {
    title: fullTitle,
    description: seoDescription,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
    authors: [{ name: "Linguo Team", url: "https://linguo.id" }],
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: \`https://linguo.id/blog/\${post.slug}\`,
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
    alternates: { canonical: \`https://linguo.id/blog/\${post.slug}\` },
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
}`;

if (src.includes('post.seo_title || post.title')) {
  console.log("OK  generateMetadata already uses SEO fields");
} else if (src.includes(OLD_METADATA)) {
  src = src.replace(OLD_METADATA, NEW_METADATA);
  console.log("[OK] generateMetadata now uses seo_title, seo_description, focus_keyword, og_image");
} else {
  console.error("[ERR] generateMetadata pattern not found. File may have been modified.");
  console.error("      Check the current generateMetadata function in src/app/blog/[slug]/page.tsx");
  process.exit(1);
}

// =================================================================
// Also enhance JSON-LD with SEO fields
// =================================================================
const OLD_JSONLD = `  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: post.cover_image || "",
    author: { "@type": "Organization", name: "Linguo.id", url: "https://linguo.id" },
    publisher: { "@type": "Organization", name: "Linguo.id", url: "https://linguo.id" },
    datePublished: post.published_at,
    url: \`https://linguo.id/blog/\${post.slug}\`,
  };`;

const NEW_JSONLD = `  const rawContent = post.content?.replace(/<[^>]*>/g, "").replace(/\\s+/g, " ").trim() || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || rawContent.slice(0, 160),
    image: post.og_image || post.cover_image || "",
    keywords: [post.focus_keyword, ...(post.tags || []), post.category].filter(Boolean).join(", "),
    articleSection: post.category,
    author: { "@type": "Organization", name: "Linguo Team", url: "https://linguo.id" },
    publisher: {
      "@type": "Organization",
      name: "Linguo.id",
      url: "https://linguo.id",
      logo: { "@type": "ImageObject", url: "https://linguo.id/images/logo-color.png" },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": \`https://linguo.id/blog/\${post.slug}\`,
    },
    url: \`https://linguo.id/blog/\${post.slug}\`,
  };`;

if (src.includes("post.seo_title || post.title")) {
  console.log("OK  JSON-LD already uses SEO fields");
} else if (src.includes(OLD_JSONLD)) {
  src = src.replace(OLD_JSONLD, NEW_JSONLD);
  console.log("[OK] JSON-LD structured data enhanced with SEO fields");
} else {
  console.warn("[WARN] JSON-LD pattern not found (non-fatal)");
}

fs.writeFileSync(FILE, src, "utf8");

// Commit & push
try {
  execSync("git add -A", { stdio: "inherit" });
  execSync('git commit -m "feat(blog): generateMetadata & JSON-LD use SEO fields from dashboard"', { stdio: "inherit" });
  execSync("git push", { stdio: "inherit" });
  console.log("\n[OK] Pushed to GitHub (linguo-landing)");
} catch (e) {
  console.error("[WARN] Git failed:", e.message);
}

// Self-delete
try {
  fs.unlinkSync(new URL(import.meta.url));
  console.log("[CLEAN] Script self-deleted");
} catch {}

console.log("");
console.log("============================================================");
console.log("BLOG SEO FULL STACK COMPLETE!");
console.log("============================================================");
console.log("");
console.log("Flow sekarang:");
console.log("1. Isi SEO Settings di dashboard (SEO title/desc/keyword)");
console.log("2. Save artikel");
console.log("3. Tunggu revalidate (~1 menit) atau trigger manual");
console.log("4. Cek di linguo.id/blog/<slug>");
console.log("5. View Source: Cmd+Opt+U");
console.log("6. Search '<meta name=\"description\"' - isinya = SEO description lo");
console.log("7. Search '<title>' - isinya = SEO title lo");
console.log("");
console.log("Bonus yg lo dapet:");
console.log("- Twitter Card meta tags (summary_large_image)");
console.log("- Keywords meta (dari focus_keyword + tags + category)");
console.log("- Enhanced JSON-LD (dateModified, logo, articleSection)");
console.log("- robots googleBot directives (max-image-preview: large)");
console.log("============================================================");
