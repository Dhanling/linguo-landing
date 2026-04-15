import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Linguo.id - Tips & Panduan Belajar Bahasa",
  description: "Baca artikel dan panduan belajar 60+ bahasa asing di Linguo.id.",
  openGraph: { title: "Blog | Linguo.id", description: "Tips dan panduan belajar 60+ bahasa.", url: "https://linguo.id/blog", siteName: "Linguo.id", type: "website" },
  alternates: { canonical: "https://linguo.id/blog" },
};

async function getPosts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.from("blog_posts").select("slug, title, excerpt, cover_image, category, published_at, tags, views").eq("status", "published").order("published_at", { ascending: false });
  return data || [];
}

export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getPosts();
  const jsonLd = { "@context": "https://schema.org", "@type": "Blog", name: "Linguo.id Blog", url: "https://linguo.id/blog", publisher: { "@type": "Organization", name: "Linguo.id" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white">
        <section className="bg-gradient-to-b from-teal-600 to-teal-700 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Blog Linguo.id</h1>
            <p className="text-lg text-teal-100 max-w-2xl mx-auto">Tips, panduan, dan insight untuk belajar 60+ bahasa asing.</p>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-12">
          {posts.length === 0 ? (<p className="text-center text-gray-500 py-20">Belum ada artikel.</p>) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post: any) => (
                <Link key={post.slug} href={"/blog/" + post.slug} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-teal-50 relative overflow-hidden">
                    {post.cover_image ? (<img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />) : (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-5xl">{post.category === "Bahasa" ? "🌍" : "📝"}</span></div>
                    )}
                    <span className="absolute top-3 left-3 bg-teal-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{post.category}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">{post.title}</h2>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-3">{post.excerpt}</p>
                    <span className="text-xs text-gray-400">{new Date(post.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="bg-teal-50 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Siap Mulai Belajar?</h2>
            <p className="text-gray-600 mb-6">Kursus private 60+ bahasa dengan pengajar berpengalaman.</p>
            <a href="/" className="inline-block bg-teal-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-teal-700 transition-colors">Mulai Belajar Sekarang</a>
          </div>
        </section>
      </main>
    </>
  );
}