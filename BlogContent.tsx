"use client";
import { useState, useMemo } from "react";
import { Search, MessageCircle, Clock, ChevronRight, ChevronLeft, ArrowRight, Share2, Eye } from "lucide-react";
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

const CATEGORIES = ["Semua", "Tips", "Edukasi", "Fun", "Grammar"];
const CAT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  Tips: { bg: "bg-violet-100", text: "text-violet-600", ring: "ring-violet-200" },
  Edukasi: { bg: "bg-rose-100", text: "text-rose-600", ring: "ring-rose-200" },
  Fun: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200" },
  Grammar: { bg: "bg-pink-100", text: "text-pink-600", ring: "ring-pink-200" },
};

const GRADIENTS = [
  "from-violet-400 via-purple-400 to-fuchsia-400",
  "from-cyan-400 via-teal-400 to-emerald-400",
  "from-orange-300 via-rose-300 to-pink-400",
  "from-blue-400 via-indigo-400 to-violet-400",
  "from-emerald-300 via-cyan-300 to-blue-400",
  "from-amber-300 via-orange-300 to-red-300",
  "from-teal-300 via-cyan-400 to-blue-300",
  "from-pink-300 via-rose-300 to-red-300",
];

const LANGUAGES = [
  "English","French","Spanish","Portuguese","German","Japanese","Korean",
  "Arabic","Hindi","Italian","Russian","Mandarin"
];

const POSTS_PER_PAGE = 6;

function getGradient(slug: string) {
  const idx = (slug || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function getInitial(title: string) {
  const m = title?.match(/Bahasa\s+(\S)/);
  return m ? m[1] : title?.[0] || "L";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatDateLong(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function Badge({ category }: { category?: string }) {
  const c = category && CAT_COLORS[category] ? CAT_COLORS[category] : { bg: "bg-slate-100", text: "text-slate-600", ring: "" };
  return <span className={"inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide " + c.bg + " " + c.text}>{category || "Artikel"}</span>;
}

function CoverImage({ post, className = "", size = "md" }: { post: BlogPost; className?: string; size?: string }) {
  if (post.cover_image) {
    return <img src={post.cover_image} alt={post.title} className={"w-full h-full object-cover " + className} />;
  }
  const grad = getGradient(post.slug);
  const initial = getInitial(post.title);
  const textSize = size === "lg" ? "text-[80px]" : size === "sm" ? "text-3xl" : "text-5xl";
  return (
    <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center relative overflow-hidden ${className}`}>
      <span className={`text-white/25 font-black ${textSize} select-none`}>{initial}</span>
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white/10" />
    </div>
  );
}

/* ===================== BANNER ===================== */
function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-[#1A9E9E] via-[#2ABFBF] to-[#1A9E9E] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 shadow-sm">
      <div>
        <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">Linguo.id Blog</p>
        <h2 className="text-white text-xl sm:text-2xl font-extrabold leading-tight">Everyone Can Be a Polyglot</h2>
        <p className="text-white/80 text-sm mt-1">60+ bahasa tersedia dengan pengajar profesional</p>
      </div>
      <a href="/" className="shrink-0 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-sm hover:shadow-md">
        Mulai Belajar →
      </a>
    </div>
  );
}

/* ===================== FEATURED ===================== */
function FeaturedArticle({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group block mb-12">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
            <CoverImage post={post} className="group-hover:scale-105 transition-transform duration-700" size="lg" />
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <Badge category={post.category} />
              <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> 6 min</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 leading-tight group-hover:text-[#1A9E9E] transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 line-clamp-3">
              {post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160) + "..."}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-xs font-bold shadow-sm">L</div>
                <div>
                  <div className="text-xs font-medium text-slate-700">Linguo Team</div>
                  <div className="text-[10px] text-slate-400">{formatDateLong(post.published_at)}</div>
                </div>
              </div>
              <span className="text-[#1A9E9E] text-sm font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Baca <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ===================== ARTICLE CARD ===================== */
function ArticleCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 flex flex-col">
      <div className="aspect-[16/10] overflow-hidden relative">
        <CoverImage post={post} className="group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <Badge category={post.category} />
        <h3 className="font-bold text-[15px] text-slate-900 leading-snug mt-2.5 mb-2 line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">
          {post.title}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 100)}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center text-white text-[9px] font-bold">L</div>
            <div>
              <div className="text-[10px] font-medium text-slate-600">Linguo Team</div>
              <div className="text-[9px] text-slate-400">{formatDate(post.published_at)}</div>
            </div>
          </div>
          <span className="text-[#1A9E9E] text-xs font-semibold flex items-center gap-0.5">
            Baca <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ===================== SIDEBAR CARDS ===================== */
function TerbaruCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex gap-3.5 p-3 rounded-xl border border-slate-100 hover:border-[#1A9E9E]/20 hover:shadow-md transition-all bg-white">
      <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
        <CoverImage post={post} size="sm" />
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <Badge category={post.category} />
        <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1.5 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
          <span>{formatDate(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function PopulerCard({ post, rank }: { post: BlogPost; rank: number }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-all">
      <span className="text-3xl font-black text-[#1A9E9E]/15 group-hover:text-[#1A9E9E]/30 transition-colors w-8 text-center shrink-0">{rank}</span>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <Badge category={post.category} />
        <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1.5 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <span className="text-[10px] text-slate-400 mt-1">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

function RekomendasiCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex gap-3.5 items-center p-3 rounded-xl hover:bg-slate-50 transition-all">
      <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[#1A9E9E]/30 transition-all">
        <CoverImage post={post} size="sm" />
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <Badge category={post.category} />
        <h3 className="text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1 group-hover:text-[#1A9E9E] transition-colors">{post.title}</h3>
        <span className="text-[10px] text-slate-400 mt-1">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

/* ===================== PAGINATION ===================== */
function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | string)[] = [];
  if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
  else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return (
    <div className="flex items-center justify-center gap-1.5 my-10">
      {current > 1 && (
        <button onClick={() => onPage(current - 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={"d" + i} className="text-slate-300 px-1 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={p === current
              ? "w-9 h-9 rounded-full bg-[#1A9E9E] text-white font-bold text-sm shadow-sm"
              : "w-9 h-9 rounded-full text-slate-500 hover:bg-slate-100 font-medium text-sm transition-colors"
            }>{p}</button>
        )
      )}
      {current < total && (
        <button onClick={() => onPage(current + 1)} className="ml-1.5 px-4 py-2 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm">
          next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ===================== FOOTER ===================== */
function BlogFooter() {
  return (
    <footer className="bg-[#1A9E9E] text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-bold text-lg mb-4">Learn a Language</h4>
            <div className="space-y-1.5 text-sm text-white/80">
              {LANGUAGES.map(l => <a key={l} href={"/?lang=" + l.toLowerCase()} className="block hover:text-white transition-colors">Learn {l}</a>)}
              <a href="/" className="block hover:text-white font-medium mt-2">Learn More Languages</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Level Option</h4>
            <div className="space-y-1.5 text-sm text-white/80 mb-5">
              {["Basic","Upper Basic","Intermediate","Advance"].map(l => <span key={l} className="block">{l}</span>)}
            </div>
            <h4 className="font-bold text-lg mb-4">Program</h4>
            <div className="space-y-1.5 text-sm text-white/80">
              {["Regular Class","Private Class","IELTS Class","TOEFL Class"].map(p => <span key={p} className="block">{p}</span>)}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Teaching</h4>
            <a href="/jadi-pengajar" className="text-sm text-white/80 hover:text-white block mb-5">Become a Teacher</a>
            <p className="text-sm text-white/80 leading-relaxed mb-5">Happy Creative Hub, Jl. Cisitu Indah III No.2, Dago, Coblong, Bandung 40135</p>
            <h4 className="font-bold text-lg mb-4">Customer Service</h4>
            <div className="space-y-1 text-sm text-white/80">
              <p>WA : <a href="https://wa.me/6282116859493" className="hover:text-white">6282116859493</a></p>
              <p>Telepon : (022) 85942550</p>
              <p>Email : <a href="mailto:info@linguo.id" className="hover:text-white">info@linguo.id</a></p>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end">
            <a href="/"><img src="/images/logo-white.png" alt="Linguo" className="h-12 mb-4" /></a>
            <p className="text-sm text-white/60 mb-4">&copy; {new Date().getFullYear()} PT. Linguo Edu Indonesia</p>
            <div className="flex gap-2.5">
              {[{h:"https://facebook.com/linguo.id",l:"fb"},{h:"https://instagram.com/linguo.id",l:"ig"},{h:"https://threads.net/@linguo.id",l:"th"},{h:"https://linkedin.com/company/linguo-id",l:"in"},{h:"https://youtube.com/@linguoid",l:"yt"}].map(s => (
                <a key={s.l} href={s.h} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-xs font-bold transition-colors">{s.l}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10"><div className="max-w-7xl mx-auto px-6 py-3.5 text-center text-xs text-white/40">Linguo.id — Everyone Can Be a Polyglot</div></div>
    </footer>
  );
}

/* ===================== MAIN ===================== */
export default function BlogContent({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let posts = initialPosts;
    if (activeCategory !== "Semua") posts = posts.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q));
    }
    return posts;
  }, [initialPosts, activeCategory, search]);

  const totalPages = Math.ceil(Math.max(filtered.length - 1, 0) / POSTS_PER_PAGE);
  const featured = !search && page === 1 ? filtered[0] : null;
  const gridPosts = featured ? filtered.slice(1) : filtered;
  const paged = gridPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const terbaru = filtered.slice(0, 3);
  const populer = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3);
  const rekomendasi = filtered.length > 3 ? filtered.slice(Math.max(0, filtered.length - 3)) : filtered;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <img src="/images/logo-color.png" alt="Linguo" className="h-7 sm:h-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "/images/logo-white.png"; (e.target as HTMLImageElement).className = "h-7 sm:h-9 object-contain brightness-0"; }} />
          </a>
          <div className="hidden sm:flex items-center gap-6">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">Home</a>
            {CATEGORIES.filter(c => c !== "Semua").map(c => (
              <button key={c} onClick={() => { setActiveCategory(c); setPage(1); }} className={`text-sm transition-colors ${activeCategory === c ? "text-[#1A9E9E] font-semibold" : "text-slate-500 hover:text-slate-900"}`}>{c}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-40 pl-9 pr-3 py-1.5 rounded-full border border-slate-200 focus:border-[#1A9E9E] focus:ring-1 focus:ring-[#1A9E9E]/20 outline-none text-sm transition-all bg-slate-50 focus:bg-white" />
            </div>
            <a href="/" className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 text-sm font-bold px-5 py-2 rounded-full transition-colors shadow-sm">Log in</a>
          </div>
        </div>
      </nav>

      {/* Mobile search */}
      <div className="sm:hidden px-6 pt-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Cari artikel..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:border-[#1A9E9E] outline-none text-sm bg-white" />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Belum ada artikel{activeCategory !== "Semua" ? " untuk kategori " + activeCategory : ""}.</p>
          </div>
        ) : (
          <>
            {/* Banner */}
            {page === 1 && !search && <PromoBanner />}

            {/* Featured */}
            {featured && <FeaturedArticle post={featured} />}

            {/* Article Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
              {paged.map(post => <ArticleCard key={post.id} post={post} />)}
            </div>

            {/* Pagination */}
            <Pagination current={page} total={totalPages || 1} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

            {/* Category filters below pagination */}
            {page === 1 && !search && (
              <div className="text-center mb-10">
                <p className="text-xs text-slate-400 mb-3">Searching on categories</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat;
                    const colors = cat !== "Semua" && CAT_COLORS[cat] ? CAT_COLORS[cat] : { bg: "bg-slate-100", text: "text-slate-500", ring: "" };
                    return (
                      <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                        className={"px-5 py-2 rounded-full text-xs font-semibold transition-all " + (isActive
                          ? (cat === "Semua" ? "bg-[#1A9E9E] text-white shadow-sm" : colors.bg + " " + colors.text + " ring-2 " + colors.ring)
                          : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                        )}>{cat}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3-Column: Terbaru / Populer / Direkomendasikan */}
            {page === 1 && !search && filtered.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#1A9E9E] rounded-full"></span> Artikel Terbaru
                  </h2>
                  <div className="space-y-3">{terbaru.map(p => <TerbaruCard key={p.id} post={p} />)}</div>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#fbbf24] rounded-full"></span> Artikel Populer
                  </h2>
                  <div className="space-y-3">{populer.map((p, i) => <PopulerCard key={p.id} post={p} rank={i + 1} />)}</div>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-rose-400 rounded-full"></span> Direkomendasikan
                  </h2>
                  <div className="space-y-3">{rekomendasi.map(p => <RekomendasiCard key={p.id} post={p} />)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BlogFooter />
    </div>
  );
}
