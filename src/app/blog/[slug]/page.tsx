import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

function getSupabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); }

export async function generateStaticParams() {
  const { data } = await getSupabase().from("blog_posts").select("slug").eq("status", "published");
  return (data || []).map((p: any) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await getSupabase().from("blog_posts").select("title, excerpt, meta_title, meta_description, cover_image, slug").eq("slug", slug).eq("status", "published").single();
  if (!post) return { title: "Tidak Ditemukan" };
  return {
    title: post.meta_title || post.title + " | Linguo.id",
    description: post.meta_description || post.excerpt,
    openGraph: { title: post.meta_title || post.title, description: post.meta_description || post.excerpt || "", url: "https://linguo.id/blog/" + post.slug, siteName: "Linguo.id", type: "article" },
    alternates: { canonical: "https://linguo.id/blog/" + post.slug },
  };
}

export const revalidate = 3600;

function renderMd(content: string): string {
  return content.split("\n").map((line) => {
    if (line.startsWith("### ")) return "<h3 class=\"text-xl font-bold text-gray-900 mt-8 mb-3\">" + line.slice(4) + "</h3>";
    if (line.startsWith("## ")) return "<h2 class=\"text-2xl font-bold text-gray-900 mt-10 mb-4\">" + line.slice(3) + "</h2>";
    if (line.startsWith("- ")) return "<li class=\"ml-6 text-gray-700 mb-1 list-disc\">" + line.slice(2) + "</li>";
    if (line.match(/^\d+\. /)) return "<li class=\"ml-6 text-gray-700 mb-1 list-decimal\">" + line.replace(/^\d+\.\s/, "") + "</li>";
    if (line.trim() === "") return "";
    const processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return "<p class=\"text-gray-700 leading-relaxed mb-4\">" + processed + "</p>";
  }).join("\n");
}

export default async function BlogArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabase();
  const { data: post } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
  if (!post) notFound();
  supabase.from("blog_posts").update({ views: (post.views || 0) + 1 }).eq("id", post.id).then(() => {});
  const { data: related } = await supabase.from("blog_posts").select("slug, title, excerpt, category").eq("status", "published").neq("slug", slug).order("published_at", { ascending: false }).limit(3);
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: post.title, description: post.meta_description || post.excerpt, url: "https://linguo.id/blog/" + post.slug, datePublished: post.published_at, author: { "@type": "Organization", name: "Linguo.id" } };
  const contentHtml = renderMd(post.content);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-teal-600">Home</Link><span>/</span>
            <Link href="/blog" className="hover:text-teal-600">Blog</Link><span>/</span>
            <span className="text-gray-600 truncate">{post.title}</span>
          </nav>
        </div>
        <article className="max-w-3xl mx-auto px-4 py-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">{post.category}</span>
              <span className="text-sm text-gray-400">{new Date(post.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="text-sm text-gray-400">{post.views || 0} views</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-gray-500 leading-relaxed">{post.excerpt}</p>}
          </header>
          {post.cover_image && <div className="rounded-2xl overflow-hidden mb-8"><img src={post.cover_image} alt={post.title} className="w-full h-auto" /></div>}
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-100">
              {post.tags.map((tag: string) => (<span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">#{tag}</span>))}
            </div>
          )}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-8 mt-10 text-white text-center">
            <h3 className="text-xl font-bold mb-2">Tertarik Belajar Bahasa Ini?</h3>
            <p className="text-teal-100 mb-4">Kelas private 1-on-1 dengan pengajar berpengalaman.</p>
            <a href="/" className="inline-block bg-white text-teal-700 font-bold px-8 py-3 rounded-full hover:bg-teal-50 transition-colors">Mulai Belajar Sekarang</a>
          </div>
        </article>
        {related && related.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <Link key={r.slug} href={"/blog/" + r.slug} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <span className="text-xs text-teal-600 font-medium">{r.category}</span>
                  <h3 className="font-bold text-gray-900 mt-1 mb-2 line-clamp-2">{r.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}