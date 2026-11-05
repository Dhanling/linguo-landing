'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  ClipboardCheck,
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
import { getLangPhoto } from '@/lib/lang-visuals';
import { sampulKecil, sampulGagal } from '@/lib/sampulKecil';
import { judulRingkas, labelBahasa } from '@/lib/katalogDigital';
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]
// [toko-simulasi-tab-v1] Simulasi Tes ikut dipajang di etalase toko. Sumber
// datanya BUKAN digital_products (entitlement-nya tabel lain:
// simulation_entitlements per jenis tes), jadi kartunya statik dari
// lib/simulasiPakets dan tombolnya mengarah ke checkout /simulasi/paket.
import { PAKET, PRICE, SKILL_META, promoPriceFor, type Paket } from '@/lib/simulasiPakets';

// [toko-rak-sampul-v1] Kartu etalase kini kembar dengan rak Perpustakaan di
// dashboard siswa (/akun?menu=pustaka): sampul potret 1:√2 (cover_url produk,
// jatuh ke foto stok bahasa, lalu gradien + glyph), ikon jenis di pojok, judul
// ringkas + bendera di bawahnya. Dulu kepala kartu lanskap bergradien + bendera
// besar — 160+ produk terbaca seperti tabel warna, dan sampul aslinya tak pernah
// kelihatan di toko.
const GRADIENTS = [
  'linear-gradient(150deg,#1FA98A,#0C8163)',
  'linear-gradient(150deg,#3B82F6,#1D4ED8)',
  'linear-gradient(150deg,#8B5CF6,#6D28D9)',
  'linear-gradient(150deg,#F59E0B,#D97706)',
  'linear-gradient(150deg,#EC4899,#BE185D)',
  'linear-gradient(150deg,#14B8A6,#0F766E)',
];
function gradFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const LANG_GLYPH: Record<string, string> = {
  english: 'EN', korean: '한', japanese: 'あ', mandarin: '中', chinese: '中', arabic: 'ع',
  french: 'FR', german: 'DE', spanish: 'ES', italian: 'IT', thai: 'TH', vietnamese: 'VN', dutch: 'NL',
};
function glyphFor(p: Product) {
  const lang = p.language?.toLowerCase().trim();
  if (lang && LANG_GLYPH[lang]) return LANG_GLYPH[lang];
  if (lang) return lang.slice(0, 2).toUpperCase();
  return p.type === 'ebook' ? 'PDF' : 'EN';
}

function TitleFlag({ language }: { language: string | null }) {
  const code = language ? FLAG_CODE_BY_SLUG[language.trim().toLowerCase()] : undefined;
  if (!code) return null;
  return <RectFlag code={code} h={13} className="shadow-sm" />;
}

/** Sampul potret ala rak Perpustakaan /akun. */
function ShelfCover({ p }: { p: Product }) {
  const foto = p.cover_url || getLangPhoto(p.language);
  return (
    <div
      className="relative aspect-[1/1.414] w-full overflow-hidden rounded-xl shadow-[0_14px_30px_-16px_rgba(18,23,43,0.6)] ring-1 ring-black/[0.06]"
      style={{ background: gradFor(p.id) }}
    >
      {foto ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={sampulKecil(foto, 440)}
          alt={p.title}
          loading="lazy"
          decoding="async"
          onError={sampulGagal(foto)}
          className={`absolute inset-0 h-full w-full object-cover${p.cover_url ? ' object-top' : ''}`}
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
          <span className="text-[38px] font-black leading-none text-white/90">{glyphFor(p)}</span>
          <span className="line-clamp-3 text-[11px] font-bold uppercase leading-snug tracking-wide text-white/75">
            {judulRingkas(p.title)}
          </span>
        </span>
      )}
      {/* punggung buku + kilau tepi */}
      <span className="pointer-events-none absolute inset-y-0 left-0 w-[9px] bg-gradient-to-r from-black/40 via-black/12 to-transparent" />
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
    </div>
  );
}

function TypeDot({ Icon, nama }: { Icon: typeof BookOpen; nama: string }) {
  return (
    <span
      title={nama}
      aria-label={nama}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#12172B] shadow-sm"
    >
      <Icon className="h-[15px] w-[15px]" strokeWidth={2.4} />
    </span>
  );
}

/** Lapisan aksi saat kursor di atas sampul (di layar sentuh selalu tampak). */
function HoverAksi({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent pb-3 opacity-0 transition duration-300 group-hover:opacity-100">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#12A37E] px-3.5 py-2 text-[12px] font-bold text-white shadow-lg">
        <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
        {label}
      </span>
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

// [toko-paginasi-v1] 4 baris × 7 sampul per halaman di layar lebar.
const PER_HALAMAN = 28;

/** Nomor halaman ringkas: 1 … 4 5 6 … 12 */
function nomorHalaman(sekarang: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, sekarang - 1, sekarang, sekarang + 1]);
  const urut = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil: (number | '…')[] = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push('…');
    hasil.push(n);
  });
  return hasil;
}

type FilterKey = 'all' | 'ebook' | 'elearning' | 'simulasi';

/** Paket simulasi yang sudah terbit (soal siap) — yang `soon` tak dipajang. */
const SIM_ITEMS: Paket[] = PAKET.filter((p) => !p.soon);

export default function TokoClient({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [halaman, setHalaman] = useState(1);
  const gridRef = useRef<HTMLElement>(null);

  // [toko-simulasi-tab-v1] kartu simulasi ikut tab "Semua"/"Simulasi Tes" + kotak cari.
  const simFiltered = useMemo(() => {
    if (filter !== 'all' && filter !== 'simulasi') return [] as Paket[];
    const q = search.trim().toLowerCase();
    if (!q) return SIM_ITEMS;
    return SIM_ITEMS.filter((p) =>
      [p.title, p.tag, p.testType, 'simulasi tes', 'prediction test', 'inggris english']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [filter, search]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (filter === 'simulasi') return [];
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
      all: products.length + SIM_ITEMS.length,
      ebook: products.filter((p) => p.type === 'ebook').length,
      elearning: products.filter((p) => p.type === 'elearning').length,
      simulasi: SIM_ITEMS.length,
    }),
    [products]
  );

  // [toko-paginasi-v1] simulasi + produk digabung jadi satu daftar, lalu dipotong per halaman.
  type Item = { kind: 'sim'; p: Paket } | { kind: 'prod'; p: Product };
  const semua = useMemo<Item[]>(
    () => [
      ...simFiltered.map((p) => ({ kind: 'sim' as const, p })),
      ...filtered.map((p) => ({ kind: 'prod' as const, p })),
    ],
    [simFiltered, filtered],
  );
  const totalHalaman = Math.max(1, Math.ceil(semua.length / PER_HALAMAN));
  const hal = Math.min(halaman, totalHalaman);
  const potongan = semua.slice((hal - 1) * PER_HALAMAN, hal * PER_HALAMAN);

  // ganti tab / ketik di kotak cari → kembali ke halaman 1
  useEffect(() => setHalaman(1), [filter, search]);

  function keHalaman(n: number) {
    setHalaman(n);
    const el = gridRef.current;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  const tabs: { key: FilterKey; label: string; Icon: typeof Sparkles }[] = [
    { key: 'all', label: 'Semua', Icon: Sparkles },
    { key: 'ebook', label: 'E-Book', Icon: BookOpen },
    { key: 'elearning', label: 'E-Learning', Icon: Clapperboard },
    { key: 'simulasi', label: 'Simulasi Tes', Icon: ClipboardCheck },
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

      {/* GRID — [toko-rak-sampul-v1] rak sampul 7 kolom, kembar Perpustakaan /akun */}
      <section ref={gridRef} className="mx-auto max-w-7xl px-4 py-10">
        {semua.length === 0 ? (
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
          <>
            <div className="mb-5 flex items-center justify-between text-[13px] font-semibold text-slate-500">
              <span>
                {semua.length} produk
                {totalHalaman > 1 && ` · halaman ${hal} dari ${totalHalaman}`}
              </span>
            </div>

            <div
              key={`${filter}-${search}-${hal}`}
              className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7"
            >
              {potongan.map((item, i) => {
                const delay = { animationDelay: `${i * 25}ms`, animationFillMode: 'forwards' as const };
                if (item.kind === 'sim') {
                  /* [toko-simulasi-tab-v1] Kartu Simulasi Tes — checkout-nya di
                     /simulasi/paket (nama/email/WA + kode promo → Xendit). */
                  const p = item.p;
                  const price = promoPriceFor(p.productKey);
                  return (
                    <Link
                      key={`sim-${p.variant}`}
                      href="/simulasi/paket"
                      prefetch={false}
                      className="group block opacity-0 animate-fadeUp"
                      style={delay}
                    >
                      <div className="relative transition duration-300 group-hover:-translate-y-1.5">
                        <div
                          className="relative aspect-[1/1.414] w-full overflow-hidden rounded-xl shadow-[0_14px_30px_-16px_rgba(18,23,43,0.6)] ring-1 ring-black/[0.06]"
                          style={{ background: `linear-gradient(150deg, ${p.accent}, #0F6E56)` }}
                        >
                          <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-3 text-center">
                            <ClipboardCheck className="h-10 w-10 text-white/90" strokeWidth={1.8} aria-hidden />
                            <span className="text-[13px] font-black uppercase leading-snug tracking-wide text-white">
                              {p.short}
                            </span>
                            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-bold text-slate-800">
                              {p.tag}
                            </span>
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 left-0 w-[9px] bg-gradient-to-r from-black/40 via-black/12 to-transparent" />
                        </div>
                        <HoverAksi label="Beli" />
                        <span className="pointer-events-none absolute left-2 top-2">
                          <TypeDot Icon={ClipboardCheck} nama="Simulasi Tes" />
                        </span>
                      </div>
                      <div className="mt-2.5 px-0.5">
                        <h3 title={p.title} className="truncate text-[12.5px] font-extrabold leading-snug text-[#12172B] group-hover:text-teal-700">
                          {p.title}
                        </h3>
                        <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-400">
                          Simulasi Tes · sekali bayar
                        </p>
                        <p className="mt-1 text-[13.5px] font-extrabold text-[#12172B]">
                          {price < PRICE && (
                            <span className="mr-1 text-[11px] font-semibold text-slate-400 line-through">
                              {formatRupiah(PRICE)}
                            </span>
                          )}
                          {formatRupiah(price)}
                        </p>
                      </div>
                    </Link>
                  );
                }

                const product = item.p;
                const { price, label } = getDisplayPrice(product);
                const isEbook = product.type === 'ebook';
                const newEdition = adalahNewEdition(product.title, product.type);
                const meta = [
                  isEbook ? 'E-Book' : 'E-Learning',
                  product.language ? labelBahasa(product.language) : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <Link
                    key={product.id}
                    href={`/toko/${product.slug}`}
                    prefetch={false}
                    className="group block opacity-0 animate-fadeUp"
                    style={delay}
                  >
                    <div className="relative transition duration-300 group-hover:-translate-y-1.5">
                      <ShelfCover p={product} />
                      <HoverAksi label="Lihat" />
                      <span className="pointer-events-none absolute left-2 top-2">
                        <TypeDot
                          Icon={isEbook ? BookOpen : Clapperboard}
                          nama={isEbook ? 'E-Book' : 'E-Learning'}
                        />
                      </span>
                      {product.is_featured && (
                        <span
                          title="Featured"
                          className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400 text-slate-900 shadow-sm"
                        >
                          <Star className="h-[14px] w-[14px] fill-current" strokeWidth={2} aria-hidden />
                        </span>
                      )}
                      {/* [ebook-new-edition-label-v1] penanda edisi baru di kaki sampul,
                          bukan di judul — judul tetap sama dengan invoice & reader. */}
                      {newEdition && (
                        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-yellow-400/95 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-slate-900 shadow transition-opacity group-hover:opacity-0">
                          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.6} aria-hidden />
                          {LABEL_NEW_EDITION}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 px-0.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <TitleFlag language={product.language} />
                        <h3
                          title={product.title}
                          className="truncate text-[12.5px] font-extrabold leading-snug text-[#12172B] group-hover:text-teal-700"
                        >
                          {judulRingkas(product.title)}
                        </h3>
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] font-semibold text-slate-400">{meta}</p>
                      <p className="mt-1 truncate text-[13.5px] font-extrabold text-[#12172B]">
                        {price > 0 ? formatRupiah(price) : '—'}
                        {label && (
                          <span className="ml-1 text-[11px] font-semibold text-slate-400">/ {label.replace(/^mulai /, '')}</span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* [toko-paginasi-v1] */}
            {totalHalaman > 1 && (
              <nav aria-label="Halaman produk" className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => keHalaman(hal - 1)}
                  disabled={hal === 1}
                  aria-label="Halaman sebelumnya"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
                {nomorHalaman(hal, totalHalaman).map((n, i) =>
                  n === '…' ? (
                    <span key={`e${i}`} className="w-6 text-center text-sm text-slate-400">…</span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => keHalaman(n)}
                      aria-current={n === hal ? 'page' : undefined}
                      className={`h-9 min-w-9 rounded-full px-3 text-sm font-bold transition ${
                        n === hal
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-500 hover:text-teal-700'
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() => keHalaman(hal + 1)}
                  disabled={hal === totalHalaman}
                  aria-label="Halaman berikutnya"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </nav>
            )}
          </>
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
