'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ElearningProduct, PricingTier } from './page';

type TierMeta = {
  tagline: string;
  features: string[];
  cta: string;
};

const TIER_META: Record<'short' | 'mid' | 'long', TierMeta> = {
  short: {
    tagline: 'Cocok buat coba-coba dulu',
    features: [
      'Akses 10+ bahasa',
      'Video materi lengkap',
      'Komunitas belajar',
    ],
    cta: 'Mulai Coba',
  },
  mid: {
    tagline: 'Pilihan paling populer — sweet spot durasi & harga',
    features: [
      'Semua di paket 1 bulan',
      'Update materi gratis',
      'Konsultasi WA prioritas',
    ],
    cta: 'Pilih Paket Ini',
  },
  long: {
    tagline: 'Komitmen 1 tahun = harga per bulan terbaik',
    features: [
      'Semua di paket 6 bulan',
      'E-sertifikat resmi Linguo',
      'Bonus 3 e-book pilihan',
    ],
    cta: 'Pilih Paket Ini',
  },
};

function tierKey(t: PricingTier): 'short' | 'mid' | 'long' {
  const d = t.duration_days ?? 30;
  if (d <= 31) return 'short';
  if (d <= 200) return 'mid';
  return 'long';
}

function formatRupiah(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function months(t: PricingTier): number {
  if (!t.duration_days) return 1;
  return Math.max(1, Math.round(t.duration_days / 30));
}

function perMonth(t: PricingTier): number {
  return Math.round(t.price / months(t));
}

export default function PaketElearningClient({
  product,
}: {
  product: ElearningProduct;
}) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);

  const tiers = useMemo(
    () =>
      [...(product.digital_product_pricing ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      ),
    [product]
  );

  const monthlyBaseline = tiers[0] ? perMonth(tiers[0]) : 0;

  function openCheckout(tier: PricingTier) {
    setSelectedTier(tier);
    setError(null);
  }

  function closeCheckout() {
    if (submitting) return;
    setSelectedTier(null);
    setError(null);
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email) {
      setError('Nama dan email wajib diisi');
      return;
    }
    if (!selectedTier) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/xendit-create-digital-invoice`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pricing_id: selectedTier.id,
            buyer_email: form.email,
            buyer_name: form.name,
            buyer_phone: form.phone || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.invoice_url) {
        throw new Error(data.error ?? 'Gagal bikin invoice');
      }

      window.location.href = data.invoice_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-10 md:pt-16 md:pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl animate-blob" />
          <div className="absolute top-10 right-1/4 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="mx-auto max-w-5xl px-4">
          <Link
            href="/toko"
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-teal-700 transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Kembali ke Toko</span>
          </Link>

          <div className="mt-8 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 ring-1 ring-teal-200">
              🎬 Paket E-Learning
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
              {product.title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              {product.description ??
                'Akses video materi 10+ bahasa, komunitas belajar, dan banyak lagi. Pilih durasi yang sesuai dengan ritme belajarmu.'}
            </p>
            {monthlyBaseline > 0 && (
              <div className="mt-5 text-sm text-slate-500">
                Mulai dari{' '}
                <span className="font-bold text-slate-900">
                  {formatRupiah(monthlyBaseline)}/bulan
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch pt-6">
          {tiers.map((tier, i) => {
            const meta = TIER_META[tierKey(tier)];
            const m = months(tier);
            const pm = perMonth(tier);
            const savings =
              monthlyBaseline > 0 && m > 1
                ? Math.round(((monthlyBaseline - pm) / monthlyBaseline) * 100)
                : 0;
            const isMid = i === 1;

            return (
              <div key={tier.id} className={`relative ${isMid ? 'md:-mt-4' : ''}`}>
                {isMid && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-3.5 z-10">
                    <div className="rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-bold text-slate-900 shadow-md">
                      ⭐ Paling Populer
                    </div>
                  </div>
                )}

                <article
                  className={`relative h-full flex flex-col rounded-2xl p-7 transition-all duration-300 ${
                    isMid
                      ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-xl shadow-teal-600/30 ring-2 ring-yellow-400'
                      : 'bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      isMid ? 'text-teal-100' : 'text-teal-600'
                    }`}
                  >
                    Berlangganan
                  </div>
                  <div
                    className={`mt-1 text-2xl font-bold ${
                      isMid ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {tier.display_label}
                  </div>

                  <div className="mt-5">
                    <div
                      className={`text-4xl font-bold tracking-tight ${
                        isMid ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {formatRupiah(tier.price)}
                    </div>
                    {m > 1 && (
                      <div
                        className={`mt-1 text-sm ${
                          isMid ? 'text-teal-100' : 'text-slate-500'
                        }`}
                      >
                        ≈ {formatRupiah(pm)}/bulan
                      </div>
                    )}
                    {savings > 0 && (
                      <div
                        className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isMid
                            ? 'bg-yellow-400 text-slate-900'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}
                      >
                        Hemat {savings}% per bulan
                      </div>
                    )}
                  </div>

                  <p
                    className={`mt-4 text-sm ${
                      isMid ? 'text-teal-50' : 'text-slate-600'
                    }`}
                  >
                    {meta.tagline}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {meta.features.map((f, j) => (
                      <li
                        key={j}
                        className={`flex items-start gap-2 text-sm ${
                          isMid ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex-shrink-0 font-bold ${
                            isMid ? 'text-yellow-300' : 'text-teal-600'
                          }`}
                          aria-hidden
                        >
                          ✓
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => openCheckout(tier)}
                    className="mt-auto pt-7"
                  >
                    <span
                      className={`block w-full rounded-xl py-3 font-semibold transition-all ${
                        isMid
                          ? 'bg-white text-teal-700 hover:bg-yellow-50 shadow-md'
                          : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20'
                      }`}
                    >
                      {meta.cta}
                    </span>
                  </button>
                </article>
              </div>
            );
          })}
        </div>

        {/* TRUST STRIP */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="font-semibold text-slate-900">Pembayaran Aman</div>
            <p className="mt-1 text-sm text-slate-600">
              QRIS, e-wallet, transfer bank via Xendit.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-slate-900">Akses Instan</div>
            <p className="mt-1 text-sm text-slate-600">
              Begitu pembayaran terkonfirmasi, langsung bisa belajar.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-5 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-semibold text-slate-900">Butuh Bantuan?</div>
            <p className="mt-1 text-sm text-slate-600">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline"
              >
                Chat WA tim Linguo
              </a>
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
            Pertanyaan yang sering ditanyakan
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Apakah saya bisa berhenti berlangganan kapan saja?',
                a: 'Paket berlaku sampai durasi habis. Setelah itu, tidak ada auto-renewal — kamu bisa pilih perpanjang atau berhenti tanpa biaya tambahan.',
              },
              {
                q: 'Bagaimana cara akses materinya setelah bayar?',
                a: 'Setelah pembayaran terkonfirmasi (instan untuk QRIS/e-wallet), kamu akan dapat email + bisa langsung login di linguo.id/akun untuk akses semua materi.',
              },
              {
                q: 'Apakah e-sertifikat di paket 12 bulan diakui?',
                a: 'E-sertifikat resmi dari Linguo Edu Indonesia (PT terdaftar), bisa digunakan untuk portofolio belajar mandiri dan referensi level CEFR (A1–B2).',
              },
              {
                q: 'Bahasa apa saja yang tersedia?',
                a: 'Saat ini 10+ bahasa termasuk Inggris, Korea, Jepang, Mandarin, Spanyol, Prancis, Jerman, Arab, Italia, dan Turki. Daftar lengkap akan ditampilkan setelah login.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group rounded-xl bg-white border border-slate-200 p-5 open:shadow-md transition-shadow"
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-900 list-none">
                  <span>{item.q}</span>
                  <span className="text-teal-600 group-open:rotate-45 transition-transform text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CHECKOUT MODAL */}
      {selectedTier && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={closeCheckout}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-teal-100">Berlangganan</div>
                  <div className="text-xl font-bold">
                    {selectedTier.display_label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeCheckout}
                  disabled={submitting}
                  className="text-white/80 hover:text-white text-2xl leading-none disabled:opacity-50"
                  aria-label="Tutup"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 text-3xl font-bold">
                {formatRupiah(selectedTier.price)}
              </div>
              {months(selectedTier) > 1 && (
                <div className="mt-1 text-sm text-teal-100">
                  ≈ {formatRupiah(perMonth(selectedTier))}/bulan
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={submitting}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50"
                  placeholder="Contoh: Andi Pratama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={submitting}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50"
                  placeholder="andi@example.com"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Kami kirim akses materi & invoice ke email ini
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nomor WhatsApp{' '}
                  <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50"
                  placeholder="08123456789"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 transition-colors shadow-md shadow-teal-600/20"
              >
                {submitting ? 'Memproses…' : 'Lanjut ke Pembayaran'}
              </button>

              <p className="text-center text-xs text-slate-500">
                Pembayaran aman via Xendit. QRIS, e-wallet, transfer bank.
              </p>
            </form>
          </div>
        </div>
      )}

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
        .animate-blob {
          animation: blob 14s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
