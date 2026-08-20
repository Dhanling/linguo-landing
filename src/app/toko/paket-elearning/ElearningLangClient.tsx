'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Clapperboard,
  Globe,
  MessageCircle,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { FLAG_CODE_BY_SLUG, RectFlag } from '@/components/RectFlag';
import type { ElearningProduct, PricingTier } from './page';

// [elearning-per-bahasa-v1] Etalase e-learning per bahasa. Dulu halaman ini
// satu form checkout untuk paket "12+ bahasa sekaligus"; sekarang tiap bahasa
// produknya sendiri dan checkout-nya di /toko/<slug> (CheckoutSection), jadi di
// sini cukup kartu bahasa + penjelasan harga.

const WA_URL =
  'https://wa.me/6282116859493?text=' +
  encodeURIComponent('Halo Linguo! Saya mau tanya soal E-Learning (rekaman kelas) per bahasa.');

function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function sortedTiers(p: ElearningProduct): PricingTier[] {
  return [...(p.digital_product_pricing ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

/** Harga termurah produk — null kalau tier-nya belum diisi admin. */
function cheapest(p: ElearningProduct): PricingTier | null {
  return sortedTiers(p)[0] ?? null;
}

function flagCodeFor(language: string | null): string | undefined {
  if (!language) return undefined;
  return FLAG_CODE_BY_SLUG[language.trim().toLowerCase()];
}

/** Nama bahasa versi Indonesia dari judul produk ("E-Learning Bahasa Jepang …" → "Jepang"). */
function namaBahasa(p: ElearningProduct): string {
  const m = /E-Learning Bahasa ([^—]+)/i.exec(p.title);
  return (m ? m[1] : p.language ?? p.title).replace(/\s*Linguo\s*$/i, '').trim();
}

export default function ElearningLangClient({ products }: { products: ElearningProduct[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.title, p.language, p.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [products, search]);

  // Harga acuan untuk hero — diambil dari data, bukan angka hardcode, biar
  // ikut berubah kalau tier di dashboard diubah.
  const tierContoh = useMemo(() => sortedTiers(products[0] ?? ({} as ElearningProduct)), [products]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* HERO */}
      <section className="relative overflow-hidden pt-20 pb-12 md:pt-28 md:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-10 left-1/4 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
            <Clapperboard className="h-4 w-4" strokeWidth={2} aria-hidden />
            E-Learning Linguo
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
            Belajar dari{' '}
            <span className="font-serif italic text-teal-600">rekaman kelas</span>, per bahasa
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Pilih satu bahasa, tonton rekaman kelas level Basic dari pengajar Linguo sesuka kamu.
            Bayar cuma untuk bahasa yang kamu pelajari.
          </p>

          {/* Dua pilihan durasi — harga sama untuk semua bahasa */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 max-w-xl mx-auto">
            {(tierContoh.length ? tierContoh : []).map((t, i) => (
              <div
                key={t.id}
                className={`rounded-2xl border p-4 text-left ${
                  i === 1
                    ? 'border-teal-500 bg-teal-50 shadow-sm shadow-teal-600/10'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Akses {t.display_label}
                  </span>
                  {i === 1 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      <Star className="h-3 w-3 fill-current" strokeWidth={2} aria-hidden />
                      Hemat
                    </span>
                  )}
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {formatRupiah(t.price)}
                </div>
                <div className="text-xs text-slate-500">per bahasa</div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Durasi di atas adalah lama <strong>akses</strong> materinya, bukan tingkat levelnya.
          </p>
        </div>
      </section>

      {/* PENCARIAN */}
      <div className="sticky top-[var(--promo-bar-h,0px)] z-30 border-y border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <Globe className="h-4 w-4 text-teal-600" strokeWidth={2} aria-hidden />
            {products.length} bahasa tersedia
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari bahasa…"
              className="w-full pl-9 pr-3 py-2 rounded-full border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" strokeWidth={2} aria-hidden />
          </div>
        </div>
      </div>

      {/* GRID BAHASA */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <SearchX className="mx-auto mb-4 h-12 w-12 text-slate-300" strokeWidth={1.5} aria-hidden />
            <p className="text-slate-600 text-lg">Bahasa itu belum ada e-learning-nya.</p>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
              Tanya admin soal bahasa lain
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => {
              const tier = cheapest(p);
              const code = flagCodeFor(p.language);
              return (
                <Link
                  key={p.id}
                  href={`/toko/${p.slug}`}
                  prefetch={false}
                  className="group relative block"
                >
                  <article
                    className={`relative h-full rounded-2xl overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      p.is_featured ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : 'shadow-sm'
                    }`}
                  >
                    <div className="relative h-36 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                      {code ? (
                        <RectFlag code={code} h={64} className="relative shadow-lg" />
                      ) : (
                        <span
                          aria-hidden
                          className="relative inline-flex h-16 w-[89px] items-center justify-center rounded-[10px] bg-white/20 ring-1 ring-white/40 shadow-lg backdrop-blur"
                        >
                          <Clapperboard className="h-8 w-8 text-white" strokeWidth={1.8} />
                        </span>
                      )}
                      <div className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        <Clapperboard className="h-3 w-3" strokeWidth={2} aria-hidden />
                        {p.level ? `Basic ${p.level}` : 'E-Learning'}
                      </div>
                    </div>

                    <div className="p-4">
                      <h2 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        Bahasa {namaBahasa(p)}
                      </h2>
                      <p className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                        Rekaman kelas level Basic, bisa diulang kapan saja.
                      </p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500">
                            {tier ? `mulai ${tier.display_label}` : 'Segera hadir'}
                          </div>
                          <div className="font-bold text-slate-900 text-lg leading-none">
                            {tier ? formatRupiah(tier.price) : '—'}
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

      {/* YANG KAMU DAPAT */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Yang kamu dapat</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Rekaman kelas level Basic (A1) untuk bahasa yang kamu pilih',
              'Ditonton kapan saja dari HP atau laptop, boleh diulang',
              'Akses lewat dashboard linguo.id/akun sesuai durasi yang dibeli',
              'Bisa diperpanjang kapan saja tanpa mengulang dari awal',
            ].map((f) => (
              <div key={f} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" strokeWidth={2.5} aria-hidden />
                <span className="text-slate-700">{f}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <div className="mb-1 inline-flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-teal-600" strokeWidth={2} aria-hidden />
              Jujur soal isinya
            </div>
            Materi e-learning berhenti di level Basic (A1). Kalau kamu mau lanjut ke A2 ke atas,
            jalurnya kelas Private bareng pengajar — bukan menambah durasi e-learning.{' '}
            <Link href="/kursus" className="font-medium text-teal-700 hover:underline">
              Lihat kelas Private
            </Link>
            .
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/toko"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
              Lihat semua produk digital
            </Link>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
              Tanya admin dulu
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
