"use client";
import { Clock, ArrowLeft, MessageCircle, Share2 } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  tags?: string[];
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

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function CategoryBadge({ category }: { category?: string }) {
  const c = category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : { bg: "bg-slate-100", text: "text-slate-600" };
  return <span className={"inline-block px-3 py-1 rounded-full text-xs font-medium " + c.bg + " " + c.text}>{category || "Artikel"}</span>;
}

function RelatedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-[#1A9E9E]/20 transition-all duration-300">
      <div className="aspect-[16/10] overflow-hidden">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1A9E9E]/10 via-[#2ABFBF]/10 to-[#1A9E9E]/20 flex items-center justify-center">
            <span className="text-[#1A9E9E]/20 text-5xl font-black">{post.title?.[0] || "L"}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <CategoryBadge category={post.category} />
        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 mt-2 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <span className="text-[11px] text-slate-400 mt-2 block">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

// Custom article CSS to bypass Tailwind v4 prose issues
const ARTICLE_CSS = `
.article-body h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 0.5rem;
}
.article-body h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.article-body p {
  color: #475569;
  line-height: 1.8;
  margin-bottom: 1.25rem;
  font-size: 1.05rem;
}
.article-body strong {
  color: #1e293b;
  font-weight: 700;
}
.article-body a {
  color: #1A9E9E;
  text-decoration: none;
  font-weight: 500;
}
.article-body a:hover {
  text-decoration: underline;
}
.article-body ul, .article-body ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #475569;
}
.article-body li {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}
.article-body blockquote {
  border-left: 4px solid #1A9E9E;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  background: #f8fafc;
  border-radius: 0 0.5rem 0.5rem 0;
  color: #64748b;
  font-style: italic;
}
.article-body img {
  border-radius: 1rem;
  margin: 1.5rem 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.article-body hr {
  border: none;
  border-top: 2px solid #f1f5f9;
  margin: 2rem 0;
}
`;

export default function ArticleContent({ post, relatedPosts }: { post: BlogPost; relatedPosts: BlogPost[] }) {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // Generate gradient cover based on slug
  const gradients = [
    "from-violet-500 via-purple-500 to-fuchsia-500",
    "from-cyan-500 via-teal-500 to-emerald-500",
    "from-orange-400 via-rose-400 to-pink-500",
    "from-blue-500 via-indigo-500 to-violet-500",
    "from-emerald-400 via-cyan-400 to-blue-500",
    "from-amber-400 via-orange-400 to-red-400",
    "from-teal-400 via-cyan-500 to-blue-400",
    "from-pink-400 via-rose-400 to-red-400",
  ];
  const gradIdx = (post.slug || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % gradients.length;
  const grad = gradients[gradIdx];

  // Extract language name from title
  const langMatch = post.title?.match(/Bahasa\s+([^:]+)/);
  const langName = langMatch ? langMatch[1].trim() : "";

  return (
    <div className="min-h-screen bg-white">
      <style dangerouslySetInnerHTML={{ __html: ARTICLE_CSS }} />

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-8 sm:h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo-white.png"; (e.target as HTMLImageElement).className = "h-8 sm:h-10 object-contain brightness-0"; }} />
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">Home</a>
            <Link href="/blog" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Blog</Link>
            <a href="/" className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors">Mulai Belajar</a>
          </div>
        </div>
      </nav>

      {/* Cover Image / Hero */}
      <div className={`relative w-full h-[280px] sm:h-[360px] bg-gradient-to-br ${grad} overflow-hidden`}>
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white/20 text-[120px] sm:text-[160px] font-black leading-none select-none">{langName?.[0] || "L"}</div>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-white/5" />
          </div>
        )}
        {/* Category overlay */}
        <div className="absolute top-6 left-6">
          <span className="bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
            {post.category || "Artikel"}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6">
        {/* Article Meta */}
        <div className="relative -mt-10 bg-white rounded-2xl shadow-sm border border-slate-100 px-6 sm:px-10 py-8 mb-8">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <span key={tag} className="text-xs text-[#1A9E9E] bg-[#1A9E9E]/5 px-2.5 py-0.5 rounded-full font-medium">#{tag}</span>
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight mb-6">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white font-bold text-sm shadow-sm">L</div>
              <div>
                <div className="font-medium text-slate-700 text-sm">Linguo Team</div>
                <div className="text-xs text-slate-400">{formatDate(post.published_at)}</div>
              </div>
            </div>
            <span className="hidden sm:block text-slate-200">|</span>
            <span className="flex items-center gap-1 text-xs"><Clock className="w-3.5 h-3.5" /> 6 min read</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <button onClick={() => navigator.clipboard?.writeText(shareUrl)} className="p-2 rounded-full hover:bg-slate-100 transition-colors" title="Copy link">
                <Share2 className="w-4 h-4 text-slate-400" />
              </button>
              <a href={"https://wa.me/?text=" + encodeURIComponent(post.title + " " + shareUrl)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-green-50 transition-colors" title="Share via WhatsApp">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </a>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <article className="article-body px-0 sm:px-4 mb-16">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Tags bottom */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-8 border-t border-slate-100 pt-6 mb-8">
            <span className="text-sm text-slate-400 mr-1">Tags:</span>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full hover:border-[#1A9E9E]/30 hover:text-[#1A9E9E] transition-colors cursor-default">#{tag}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-[#1A9E9E] to-[#178585] rounded-2xl p-8 sm:p-10 text-center text-white mb-14 shadow-lg">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">Tertarik belajar {langName || "bahasa baru"}?</h3>
          <p className="text-white/80 text-sm mb-6 max-w-md mx-auto">Coba kelas private 1-on-1 dengan pengajar profesional. Jadwal fleksibel, materi disesuaikan.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/" className="inline-block bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-8 py-3 rounded-full text-sm transition-colors shadow-sm">Mulai Belajar Sekarang</a>
            <a href="https://wa.me/6282116859493" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-full text-sm transition-colors">
              <MessageCircle className="w-4 h-4" /> Konsultasi Gratis
            </a>
          </div>
        </div>

        {/* Back to Blog */}
        <div className="text-center mb-10">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-[#1A9E9E] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
          </Link>
        </div>

        {/* Related */}
        {relatedPosts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedPosts.map(p => <RelatedCard key={p.id} post={p} />)}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1A9E9E] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <h4 className="font-bold text-lg mb-4">Learn a Language</h4>
              <div className="space-y-2 text-sm text-white/80">
                {["English","French","Spanish","Portuguese","German","Japanese","Korean","Arabic","Hindi","Italian","Russian","Mandarin"].map(l => (
                  <a key={l} href={"/?lang=" + l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Level Option</h4>
              <div className="space-y-2 text-sm text-white/80 mb-6">
                {["Basic","Upper Basic","Intermediate","Advance"].map(l => <span key={l} className="block">{l}</span>)}
              </div>
              <h4 className="font-bold text-lg mb-4">Program</h4>
              <div className="space-y-2 text-sm text-white/80">
                {["Regular Class","Private Class","IELTS Class","TOEFL Class"].map(p => <span key={p} className="block">{p}</span>)}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Teaching</h4>
              <a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white block mb-6">Become a Teacher</a>
              <p className="text-sm text-white/80 leading-relaxed mb-6">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
              <h4 className="font-bold text-lg mb-4">Customer Service</h4>
              <div className="space-y-1.5 text-sm text-white/80">
                <p>WA : <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p>
                <p>Telepon : (022) 85942550</p>
                <p>Email : <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end">
              <a href="/"><img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4" /></a>
              <p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p>
              <div className="flex gap-3">
                {[{href:"https://facebook.com/linguo.id",l:"fb"},{href:"https://instagram.com/linguo.id",l:"ig"},{href:"https://threads.net/@linguo.id",l:"th"},{href:"https://linkedin.com/company/linguo-id",l:"in"},{href:"https://youtube.com/@linguoid",l:"yt"}].map(s => (
                  <a key={s.l} href={s.href} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">{s.l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-6 py-4 text-center text-xs text-white/40">Linguo.id — Everyone Can Be a Polyglot</div></div>
      </footer>
    </div>
  );
}
