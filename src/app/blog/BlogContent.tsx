"use client";
import { useState, useMemo } from "react";
import { Search, MessageCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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

const CATEGORIES = ["Semua", "Tips", "Edukasi", "Fun", "Grammar"];
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

const POSTS_PER_PAGE = 9;

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function CategoryBadge({ category }: { category?: string }) {
  const c = category && CATEGORY_COLORS[category] ? CATEGORY_COLORS[category] : { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span className={"inline-block px-3 py-0.5 rounded-full text-xs font-medium " + c.bg + " " + c.text}>
      {category || "Artikel"}
    </span>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
        <div className="grid md:grid-cols-5 gap-0">
          <div className="md:col-span-3 relative overflow-hidden aspect-[16/10] md:aspect-auto">
            {post.featured_image ? (
              <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-[#1A9E9E] to-[#2ABFBF] flex items-center justify-center">
                <span className="text-white/30 text-6xl font-bold">L</span>
              </div>
            )}
          </div>
          <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <CategoryBadge category={post.category} />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-[#1A9E9E] transition-colors line-clamp-3">
              {post.title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">
              {post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 150) + "..."}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
              <span>By {post.author || "Linguo Team"}</span>
              <span>·</span>
              <span>{formatDate(post.published_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TerbaruCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-[#1A9E9E]/30 hover:shadow-md transition-all duration-300 bg-white">
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden">
        {post.featured_image ? (
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-200 to-pink-200" />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <CategoryBadge category={post.category} />
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
          <span>{formatDate(post.published_at)}</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {post.view_count || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function PopulerCard({ post, rank }: { post: BlogPost; rank: number }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all duration-300">
      <span className="text-4xl font-black text-[#1A9E9E]/20 group-hover:text-[#1A9E9E]/40 transition-colors w-10 text-center shrink-0">
        {rank}
      </span>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <CategoryBadge category={post.category} />
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
          <span>{formatDate(post.published_at)}</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {post.view_count || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function RekomendasiCard({ post }: { post: BlogPost }) {
  return (
    <Link href={"/blog/" + post.slug} className="group flex gap-4 items-center p-3 rounded-xl hover:bg-slate-50 transition-all duration-300">
      <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden ring-2 ring-slate-100 group-hover:ring-[#1A9E9E]/30 transition-all">
        {post.featured_image ? (
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-200 to-emerald-200" />
        )}
      </div>
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <CategoryBadge category={post.category} />
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors">
          {post.title}
        </h3>
        <span className="text-[11px] text-slate-400 mt-1">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

function Pagination({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | string)[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={"dot" + i} className="text-slate-400 px-1">…</span>
        ) : (
          <button key={p} onClick={() => onPage(p)}
            className={p === current
              ? "w-10 h-10 rounded-full bg-[#1A9E9E] text-white font-bold text-sm"
              : "w-10 h-10 rounded-full text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors"
            }>
            {p}
          </button>
        )
      )}
      {current < total && (
        <button onClick={() => onPage(current + 1)} className="ml-2 px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 font-bold text-sm rounded-full transition-colors flex items-center gap-1">
          next <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
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

export default function BlogContent({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let posts = initialPosts;
    if (activeCategory !== "Semua") {
      posts = posts.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
    }
    return posts;
  }, [initialPosts, activeCategory, search]);

  const totalPages = Math.ceil(filtered.length / POSTS_PER_PAGE);
  const paged = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const featured = filtered[0];
  const terbaru = filtered.slice(0, 3);
  const populer = [...filtered].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 3);
  const rekomendasi = filtered.length > 3 ? filtered.slice(Math.max(0, filtered.length - 3)) : filtered.slice(0, 3);

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
            <span className="text-sm font-semibold text-[#1A9E9E]">Blog</span>
            <a href="/" className="bg-[#1A9E9E] text-white text-sm font-bold px-5 py-2 rounded-full hover:bg-[#178585] transition-colors">
              Mulai Belajar
            </a>
          </div>
        </div>
      </nav>

      {/* Hero / Search */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">Blog Linguo</h1>
          <p className="text-slate-400 mb-6">Tips, panduan, dan inspirasi belajar bahasa</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 focus:border-[#1A9E9E] focus:ring-2 focus:ring-[#1A9E9E]/20 outline-none text-sm transition-all"
            />
          </div>
          {/* Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <span className="text-xs text-slate-400 mr-1">Kategori:</span>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat;
              const colors = cat !== "Semua" && CATEGORY_COLORS[cat] ? CATEGORY_COLORS[cat] : { bg: "bg-slate-100", text: "text-slate-600" };
              return (
                <button key={cat} onClick={() => { setActiveCategory(cat); setPage(1); }}
                  className={"px-4 py-1.5 rounded-full text-xs font-medium transition-all " + (isActive
                    ? (cat === "Semua" ? "bg-[#1A9E9E] text-white" : colors.bg + " " + colors.text + " ring-2 ring-current/30")
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">Belum ada artikel{activeCategory !== "Semua" ? " untuk kategori " + activeCategory : ""}.</p>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featured && page === 1 && !search && (
              <div className="mb-12">
                <FeaturedCard post={featured} />
              </div>
            )}

            {/* 3-Column Grid */}
            {page === 1 && !search && filtered.length >= 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-14">
                {/* Artikel Terbaru */}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-5">Artikel Terbaru</h2>
                  <div className="space-y-3">
                    {terbaru.map(p => <TerbaruCard key={p.id} post={p} />)}
                  </div>
                </div>

                {/* Artikel Populer */}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-5">Artikel Populer</h2>
                  <div className="space-y-3">
                    {populer.map((p, i) => <PopulerCard key={p.id} post={p} rank={i + 1} />)}
                  </div>
                </div>

                {/* Direkomendasikan */}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 mb-5">Direkomendasikan</h2>
                  <div className="space-y-3">
                    {rekomendasi.map(p => <RekomendasiCard key={p.id} post={p} />)}
                  </div>
                </div>
              </div>
            )}

            {/* All Articles Grid (paginated) */}
            {(page > 1 || search || filtered.length > 3) && (
              <>
                <h2 className="text-xl font-extrabold text-slate-900 mb-6">
                  {search ? "Hasil Pencarian" : "Semua Artikel"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paged.map(post => (
                    <Link key={post.id} href={"/blog/" + post.slug} className="group bg-white rounded-xl overflow-hidden border border-slate-100 hover:shadow-lg hover:border-[#1A9E9E]/20 transition-all duration-300">
                      <div className="aspect-[16/10] overflow-hidden">
                        {post.featured_image ? (
                          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#1A9E9E]/20 to-[#2ABFBF]/20 flex items-center justify-center">
                            <span className="text-[#1A9E9E]/30 text-4xl font-bold">L</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryBadge category={post.category} />
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.read_time || "4 min"}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#1A9E9E] transition-colors mb-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 100)}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatDate(post.published_at)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" /> {post.view_count || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            <Pagination current={page} total={totalPages} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
          </>
        )}
      </main>

      <BlogFooter />
    </div>
  );
}
