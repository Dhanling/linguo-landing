'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Product } from './page';

const FLAG_MAP: Record<string, string> = {
  english: '🇬🇧',
  korean: '🇰🇷',
  japanese: '🇯🇵',
  mandarin: '🇨🇳',
  italian: '🇮🇹',
  turkish: '🇹🇷',
  spanish: '🇪🇸',
  french: '🇫🇷',
  german: '🇩🇪',
  arabic: '🇸🇦',
  multilingual: '🌐',
};

function flagFor(language: string | null): string {
  if (!language) return '📖';
  return FLAG_MAP[language.toLowerCase()] ?? '📖';
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function getDisplayPrice(product: Product): { price: number; label: string } {
  const tiers = [...(product.digital_product_pricing ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
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
        const haystack = [p.title, p.language, p.description, p.category]
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

  const tabs: { key: FilterKey; label: string; emoji: string }[] = [
    { key: 'all', label: 'Semua', emoji: '✨' },
    { key: 'ebook', label: 'E-Book', emoji: '📚' },
    { key: 'elearning', label: 'E-Learning', emoji: '🎬' },
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
            🛍️ Toko Linguo
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Belajar bahasa{' '}
            <span className="font-serif italic text-teal-600">di waktu luangmu</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            E-Book ringkas & E-Learning interaktif. Akses kapan saja, dari mana saja, dalam 10+ bahasa.
          </p>
        </div>
      </section>

      {/* STICKY FILTER */}
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="mr-1.5">{tab.emoji}</span>
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
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* GRID */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
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
                        ⭐ Featured
                      </div>
                    )}

                    <div
                      className={`relative h-40 bg-gradient-to-br ${headerGradient} flex items-center justify-center overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                      <span
                        className="relative text-7xl drop-shadow-lg"
                        role="img"
                        aria-label={product.language ?? ''}
                      >
                        {flagFor(product.language)}
                      </span>
                      <div className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        {isEbook ? '📚 E-Book' : '🎬 E-Learning'}
                      </div>
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
                        <span className="text-teal-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Lihat →
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
    </main>
  );
}
