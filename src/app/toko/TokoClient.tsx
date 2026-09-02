'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  Globe,
  Search,
  SearchX,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react';
import { FLAG_CODE_BY_SLUG, RectFlag } from '@/components/RectFlag';
import type { Product } from './page';
import { BRAND_FACTS } from '@/lib/brand-facts';
import { LABEL_NEW_EDITION, adalahNewEdition } from '@/lib/ebookEdisi';
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]

// linguo-patch:toko-rectflag-lucide-v1 — kartu toko dulu pakai emoji bendera
// (render-nya beda-beda per OS, di Windows malah cuma kode negara). Sekarang
// bendera SVG rounded-rectangle + ikon Lucide, sesuai ikon halaman lain.
function flagCodeFor(language: string | null): string | undefined {
  if (!language) return undefined;
  return FLAG_CODE_BY_SLUG[language.trim().toLowerCase()];
}

/** Ubin bendera di kepala kartu; tanpa bendera → ikon Lucide sesuai jenis produk. */
function ProductFlag({
  language,
  isEbook,
}: {
  language: string | null;
  isEbook: boolean;
}) {
  const code = flagCodeFor(language);
  if (code) return <RectFlag code={code} h={64} className="shadow-lg" />;
  const Icon = language ? Globe : isEbook ? BookOpen : Clapperboard;
  return (
    <span
      aria-hidden
      className="inline-flex h-16 w-[89px] items-center justify-center rounded-[10px] bg-white/20 ring-1 ring-white/40 shadow-lg backdrop-blur"
    >
      <Icon className="h-8 w-8 text-white" strokeWidth={1.8} />
    </span>
  );
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function getDisplayPrice(product: Product): { price: number; label: string } {
  // [harga-tier-arsip-v1] Tier yang sudah tidak dijual (is_active=false) tetap
  // ada di tabel demi pembeli lama — jangan dipakai jadi "harga mulai", karena
  // etalase bakal memasang harga/paket yang tak ada lagi di halaman produknya.
  const tiers = [...(product.digital_product_pricing ?? [])]
    .filter((t) => t.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order);
  if (tiers.length === 0) return { price: 0, label: '' };
  const cheapest = tiers[0];
  return {
    price: cheapest.price,
    label: tiers.length > 1 ? `mulai ${cheapest.display_label}` : cheapest.display_label,
  };
}

type FilterKey = 'all' | 'ebook' | 'elearning';

export default function TokoClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (q) {
        const haystack = [
          p.title,
          p.language,
          p.description,
          p.category,
          // Label edisinya cuma hiasan di kartu; tanpa baris ini mengetik
          // "new edition" di kotak cari malah menghasilkan nol produk.
          adalahNewEdition(p.title, p.type) ? LABEL_NEW_EDITION : null,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, filter, search]);

  const counts = useMemo(
    () => ({
      all: products.length,
      ebook: products.filter((p) => p.type === 'ebook').length,
      elearning: products.filter((p) => p.type === 'elearning').length,
    }),
    [products]
  );

  const tabs: { key: FilterKey; label: string; Icon: typeof Sparkles }[] = [
    { key: 'all', label: 'Semua', Icon: Sparkles },
    { key: 'ebook', label: 'E-Book', Icon: BookOpen },
    { key: 'elearning', label: 'E-Learning', Icon: Clapperboard },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-14 md:pt-28 md:pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl animate-blob" />
          <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-yellow-300/30 blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-1/3 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl animate-blob animation-delay-4000" />
        </div>

        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 ring-1 ring-teal-200">
            <ShoppingBag className="h-4 w-4" strokeWidth={2} aria-hidden />
            Toko Linguo
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Belajar bahasa{' '}
            <span className="font-serif italic text-teal-600">di waktu luangmu</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            {/* [aeo-klaim-toko-v1] "10+ bahasa" itu angka lama dari zaman paket
                e-learning semua-bahasa. Katalog e-book saja sudah 20 bahasa. */}
            E-Book ringkas & E-Learning interaktif. Akses kapan saja, dari mana saja,
            dalam {BRAND_FACTS.catalog.ebookLanguages}+ bahasa.
          </p>
        </div>
      </section>

      {/* STICKY FILTER */}
      <div className="sticky top-[var(--promo-bar-h,0px)] z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <tab.Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {tab.label}
                  <span
                    className={`ml-2 text-xs ${
                      active ? 'text-teal-100' : 'text-slate-500'
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bahasa…"
              className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
            <Search
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              strokeWidth={2}
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <SearchX
              className="mx-auto mb-4 h-12 w-12 text-slate-300"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="text-slate-600 text-lg">
              Tidak ada produk yang cocok.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('all');
                setSearch('');
              }}
              className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product, i) => {
              const { price, label } = getDisplayPrice(product);
              const isEbook = product.type === 'ebook';
              const newEdition = adalahNewEdition(product.title, product.type);
              const headerGradient = isEbook
                ? 'from-teal-500 to-teal-700'
                : 'from-amber-400 to-orange-500';

              return (
                <Link
                  key={product.id}
                  href={`/toko/${product.slug}`}
                  prefetch={true}
                  className="group relative block opacity-0 animate-fadeUp"
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <article
                    className={`relative h-full rounded-2xl overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      product.is_featured
                        ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20'
                        : 'shadow-sm'
                    }`}
                  >
                    {product.is_featured && (
                      <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-slate-900 shadow">
                        <Star className="h-3 w-3 fill-current" strokeWidth={2} aria-hidden />
                        Featured
                      </div>
                    )}

                    <div
                      className={`relative h-40 bg-gradient-to-br ${headerGradient} flex items-center justify-center overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                      <span className="relative" aria-label={product.language ?? undefined}>
                        <ProductFlag language={product.language} isEbook={isEbook} />
                      </span>
                      <div className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        {isEbook ? (
                          <BookOpen className="h-3 w-3" strokeWidth={2} aria-hidden />
                        ) : (
                          <Clapperboard className="h-3 w-3" strokeWidth={2} aria-hidden />
                        )}
                        {isEbook ? 'E-Book' : 'E-Learning'}
                      </div>
                      {/* [ebook-new-edition-label-v1] Penanda edisi baru di
                          kepala kartu — bukan disisipkan ke judul, supaya judul
                          di etalase tetap sama persis dengan judul di invoice,
                          Perpustakaan, dan reader. */}
                      {newEdition && (
                        <div className="absolute bottom-2 right-3 inline-flex items-center gap-1 rounded-full bg-yellow-400/95 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-900 shadow">
                          <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                          {LABEL_NEW_EDITION}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {product.title}
                      </h3>
                      {product.description && (
                        <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500">
                            {label || 'Harga'}
                          </div>
                          <div className="font-bold text-slate-900 text-lg leading-none">
                            {formatRupiah(price)}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-teal-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Lihat
                          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <style jsx global>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 12s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeUp {
          animation: fadeUp 0.5s ease-out;
        }
      `}</style>

      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <TautanLegal className="mb-2 px-4 text-slate-500" />
        © {new Date().getFullYear()} PT. Linguo Edu Indonesia
      </footer>
    </main>
  );
}
