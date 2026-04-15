"use client";
import { Clock, ArrowLeft, MessageCircle, Share2, Facebook, Twitter } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  category?: string;
  tags?: string[];
  author?: string;
  read_time?: string;
  status: string;
  published_at: string;
  created_at: string;
  view_count?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Tips: { bg: "bg-violet-100", text: "text-violet-600" },
  Edukasi: { bg: "bg-rose-100", text: "text-rose-600" },
  Fun: { bg: "bg-emerald-50", text: "text-emerald-600" },
  Grammar: { bg: "bg-pink-100", text: "text-pink-600" },
};

const LANGUAGES = [
  "English","French","Spanish","Portuguese","German","Japanese","Korean",
  "Arabic","Hindi","Italian","Russian","Mandarin"
];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function CategoryBadge({ category }: { category?: string }) {
  const c = category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={"inline-block px-3 py-0.5 rounded-full text-xs font-medium " + c.bg + " " + c.text}>
      {category || "Artikel"}
    </span>
  );
}

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-[#1A9E9E]/20 transition-all duration-300">
      <div className="aspect-[16/10] overflow-hidden">
        {post.featured_image ? (
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A9E9E]/20 to-[#2ABFBF]/20 flex items-center justify-center">
            <span className="text-[#1A9E9E]/30 text-4xl font-bold">L</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={post.category} />
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
          </span>
        </div>
        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">
          {post.title}
        </h3>
        <span className="text-[11px] text-slate-400 mt-2 block">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

function BlogFooter() {
  return (
    <footer className="bg-[#1A9E9E] text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-bold text-lg mb-4">Learn a Language</h4>
            <div className="space-y-2 text-sm text-white/80">
              {LANGUAGES.map(l => (
                <a key={l} href={"/?lang=" + l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>
              ))}
              <a href="/" className="block hover:text-white transition-colors font-medium mt-2">Learn More Languages</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Level Option</h4>
            <div className="space-y-2 text-sm text-white/80 mb-6">
              {["Basic","Upper Basic","Intermediate","Advance"].map(l => (
                <span key={l} className="block">{l}</span>
              ))}
            </div>
            <h4 className="font-bold text-lg mb-4">Program</h4>
            <div className="space-y-2 text-sm text-white/80">
              {["Regular Class","Private Class","IELTS Class","TOEFL Class"].map(p => (
                <span key={p} className="block">{p}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Teaching</h4>
            <a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white transition-colors block mb-6">Become a Teacher</a>
            <p className="text-sm text-white/80 leading-relaxed mb-6">
              Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung City, West Java 40135
            </p>
            <h4 className="font-bold text-lg mb-4">Customer Service</h4>
            <div className="space-y-1.5 text-sm text-white/80">
              <p>WA : <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p>
              <p>Telepon : (022) 85942550</p>
              <p>Email : <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <a href="/">
              <img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4" />
            </a>
            <p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p>
            <div className="flex gap-3">
              {[
                { href: "https://facebook.com/linguo.id", label: "fb" },
                { href: "https://instagram.com/linguo.id", label: "ig" },
                { href: "https://threads.net/@linguo.id", label: "th" },
                { href: "https://linkedin.com/company/linguo-id", label: "in" },
                { href: "https://youtube.com/@linguoid", label: "yt" },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-white/40">
          Linguo.id — Everyone Can Be a Polyglot
        </div>
      </div>
    </footer>
  );
}

export default function ArticleContent({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo-white.png"; (e.target as HTMLImageElement).className = "h-8 sm:h-10 object-contain brightness-0"; }} />
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Home</a>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Blog</Link>
            <a href="/" className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors">
              Mulai Belajar
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#1A9E9E] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
        </Link>

        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <CategoryBadge category={post.category} />
            {post.tags && post.tags.length > 0 && post.tags.map(tag => (
              <span key={tag} className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">#{tag}</span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1A9E9E] flex items-center justify-center text-white font-bold text-xs">
                {(post.author || "L")[0].toUpperCase()}
              </div>
              <span>By <span className="font-medium text-slate-600">{post.author || "Linguo Team"}</span></span>
            </div>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.read_time || "4 min read"}</span>
            {/* Share buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => navigator.clipboard?.writeText(shareUrl)} className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Copy link">
                <Share2 className="w-4 h-4 text-slate-400" />
              </button>
              <a href={"https://wa.me/?text=" + encodeURIComponent(post.title + " " + shareUrl)} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-green-50 transition-colors" title="Share via WhatsApp">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </a>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="rounded-2xl overflow-hidden mb-10 shadow-sm">
            <img src={post.featured_image} alt={post.title} className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {/* Article Body */}
        <article className="prose prose-slate prose-lg max-w-none mb-16
          prose-headings:font-extrabold prose-headings:text-slate-900
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:leading-relaxed prose-p:text-slate-600
          prose-a:text-[#1A9E9E] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-900
          prose-ul:text-slate-600 prose-ol:text-slate-600
          prose-blockquote:border-l-[#1A9E9E] prose-blockquote:text-slate-500
          prose-img:rounded-xl prose-img:shadow-sm
        ">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-8 border-b border-slate-200 mb-10">
            <span className="text-sm text-slate-400 mr-1">Tags:</span>
            {post.tags.map(tag => (
              <Link key={tag} href={"/blog?tag=" + tag} className="text-xs bg-slate-100 hover:bg-[#1A9E9E]/10 hover:text-[#1A9E9E] text-slate-500 px-3 py-1 rounded-full transition-colors">
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#1A9E9E] rounded-2xl p-8 text-center text-white mb-14">
          <h3 className="text-xl font-bold mb-2">Tertarik belajar bahasa baru?</h3>
          <p className="text-white/80 text-sm mb-5">Coba kelas private 1-on-1 dengan pengajar profesional</p>
          <a href="/" className="inline-block bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-3 rounded-full text-sm transition-colors">
            Mulai Belajar Sekarang
          </a>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map(p => <RelatedCard key={p.id} post={p} />)}
            </div>
          </div>
        )}
      </main>

      <BlogFooter />
    </div>
  );
}
