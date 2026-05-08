"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const LANG_FLAGS: Record<string, string> = {
  english: "🇬🇧", korean: "🇰🇷", japanese: "🇯🇵",
  mandarin: "🇨🇳", italian: "🇮🇹", turkish: "🇹🇷",
  spanish: "🇪🇸", french: "🇫🇷", german: "🇩🇪",
  arabic: "🇸🇦", multilingual: "🌐",
};

interface PricingTier {
  price: number;
  display_label: string;
  sort_order: number;
  duration_days: number | null;
}

interface Product {
  id: string;
  type: "ebook" | "elearning";
  title: string;
  slug: string;
  description: string;
  language: string | null;
  level: string | null;
  category: string | null;
  is_featured: boolean;
  digital_product_pricing: PricingTier[];
}

type FilterType = "all" | "ebook" | "elearning";

export default function TokoClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter !== "all" && p.type !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.language ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, filter, query]);

  const counts = useMemo(
    () => ({
      all: products.length,
      ebook: products.filter((p) => p.type === "ebook").length,
      elearning: products.filter((p) => p.type === "elearning").length,
    }),
    [products]
  );

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-20 left-[20%] w-[480px] h-[480px] bg-[#1A9E9E] opacity-[0.15] blur-[100px] rounded-full" />
          <div className="absolute -bottom-32 right-[15%] w-[420px] h-[420px] bg-[#F5C842] opacity-[0.18] blur-[100px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[#1A9E9E] font-bold mb-5 animate-[fadeUp_0.6s_ease-out_both]">
            🛍️ Toko Digital
          </div>
          <h1
            className="text-5xl md:text-7xl font-black text-zinc-900 leading-[0.95] tracking-tight mb-6 animate-[fadeUp_0.6s_ease-out_both]"
            style={{ animationDelay: "100ms" }}
          >
            Belajar bahasa
            <br />
            <span className="italic font-serif text-[#1A9E9E] font-medium">di waktu luangmu</span>
            <span className="text-[#F5C842]">.</span>
          </h1>
          <p
            className="text-lg md:text-xl text-zinc-600 max-w-2xl leading-relaxed animate-[fadeUp_0.6s_ease-out_both]"
            style={{ animationDelay: "200ms" }}
          >
            E-Books premium & recording class lengkap. Akses sekali, manfaat seumur hidup.{" "}
            <span className="font-semibold text-zinc-900">{counts.all} produk</span> siap dipelajari.
          </p>
        </div>
      </section>

      {/* FILTER */}
      <section className="sticky top-0 z-20 backdrop-blur-xl bg-[#fafaf7]/85 border-y border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-2.5">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")} count={counts.all}>
            Semua
          </FilterPill>
          <FilterPill active={filter === "ebook"} onClick={() => setFilter("ebook")} count={counts.ebook}>
            <span className="mr-1.5">📚</span>E-Book
          </FilterPill>
          <FilterPill active={filter === "elearning"} onClick={() => setFilter("elearning")} count={counts.elearning}>
            <span className="mr-1.5">🎬</span>E-Learning
          </FilterPill>
          <div className="ml-auto relative w-full md:w-64">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari bahasa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-zinc-200 bg-white focus:outline-none focus:border-[#1A9E9E] focus:ring-4 focus:ring-[#1A9E9E]/10 text-sm transition-all"
            />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" key={filter}>
            {filtered.map((product, idx) => (
              <ProductCard key={product.id} product={product} index={idx} />
            ))}
          </div>
        )}
      </section>

      <style jsx global>{\`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      \`}</style>
    </div>
  );
}

function FilterPill({ active, onClick, count, children }: {
  active: boolean; onClick: () => void; count: number; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={\`group relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 \${
        active
          ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 scale-[1.02]"
          : "bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300"
      }\`}
    >
      {children}
      <span className={\`ml-2 text-xs font-medium tabular-nums \${active ? "text-white/60" : "text-zinc-400"}\`}>
        {count}
      </span>
    </button>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const minPrice = product.digital_product_pricing.length > 0
    ? Math.min(...product.digital_product_pricing.map((p) => p.price))
    : 0;
  const flag = LANG_FLAGS[product.language ?? "multilingual"] ?? "🌐";
  const isEbook = product.type === "ebook";

  return (
    <Link
      href={\`/toko/\${product.slug}\`}
      className="group block animate-[fadeUp_0.55s_cubic-bezier(0.22,0.61,0.36,1)_both]"
      style={{ animationDelay: \`\${Math.min(index * 50, 600)}ms\` }}
    >
      <article
        className={\`relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 group-hover:-translate-y-1.5 \${
          product.is_featured
            ? "border-[#F5C842] shadow-[0_4px_24px_-8px_rgba(245,200,66,0.4)] group-hover:shadow-[0_24px_48px_-12px_rgba(245,200,66,0.5)]"
            : "border-zinc-200 group-hover:border-zinc-300 group-hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)]"
        }\`}
      >
        <div
          className={\`relative aspect-[5/4] overflow-hidden \${
            isEbook
              ? "bg-gradient-to-br from-[#1A9E9E] via-[#0d7474] to-[#0a4f4f]"
              : "bg-gradient-to-br from-[#F5C842] via-[#e0a93c] to-[#a87810]"
          }\`}
        >
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)", backgroundSize: "24px 24px" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[88px] group-hover:scale-110 transition-transform duration-700 ease-out">
            <span className="drop-shadow-2xl">{flag}</span>
          </div>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white backdrop-blur-md">
              {isEbook ? "📚 E-Book" : "🎬 Course"}
            </span>
            {product.level && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/25 text-white backdrop-blur-md">
                {product.level}
              </span>
            )}
          </div>
          {product.is_featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5C842] text-zinc-900 shadow-lg flex items-center gap-1">
                ⭐ Featured
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
        <div className="p-5">
          <h3 className="font-bold text-zinc-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#1A9E9E] transition-colors duration-200">
            {product.title}
          </h3>
          <p className="text-sm text-zinc-500 line-clamp-2 mb-5 leading-relaxed">{product.description}</p>
          <div className="flex items-end justify-between pt-4 border-t border-zinc-100">
            <div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mb-1">Mulai dari</div>
              <div className="text-xl font-black text-zinc-900 tabular-nums">Rp {minPrice.toLocaleString("id-ID")}</div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-[#1A9E9E] transition-colors">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Lihat</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 animate-[fadeUp_0.5s_ease-out_both]">
      <div className="text-7xl mb-6 opacity-20">🔍</div>
      <h3 className="text-xl font-bold text-zinc-700 mb-2">Gak ada yang cocok</h3>
      <p className="text-zinc-500">Coba ubah filter atau search keyword lain.</p>
    </div>
  );
}
