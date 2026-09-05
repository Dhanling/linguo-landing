'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Globe,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  SearchX,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { FLAG_CODE_BY_SLUG, RectFlag } from '@/components/RectFlag';
// [elearning-kartu-foto-v1] Foto stok bahasa — sumber yang sama dengan kartu kelas
// di dashboard siswa & katalog Perpustakaan (public/lang/<slug>.jpg).
import { getLangPhoto } from '@/lib/lang-visuals';
import type { ElearningProduct, PricingTier } from './page';
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]

// [elearning-per-bahasa-v1] Etalase e-learning per bahasa. Dulu halaman ini
// satu form checkout untuk paket "12+ bahasa sekaligus"; sekarang tiap bahasa
// produknya sendiri dan checkout-nya di /toko/<slug> (CheckoutSection), jadi di
// sini cukup kartu bahasa + penjelasan harga.
//
// [elearning-multi-bahasa-v1] Satu bahasa per transaksi dulu memaksa orang yang
// mau Inggris + Jepang + Korea bayar tiga kali (tiga invoice, tiga biaya
// transfer). Sekarang kartunya bisa dicentang dan seluruh pilihan dibayar lewat
// SATU invoice keranjang (`/api/create-cart-invoice`, external_id
// `LINGUO-CART-*`) — jalur yang sama dengan keranjang Perpustakaan, jadi
// pemenuhannya sudah ditangani `handleCartPurchase` di edge fn xendit-webhook.
// Tombol "Lihat" per kartu sengaja dipertahankan: yang cuma mau satu bahasa
// tetap lewat halaman produk seperti biasa.

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

/** Tier produk pada urutan durasi ke-`idx`; jatuh ke termurah kalau tak ada. */
function tierPada(p: ElearningProduct, idx: number): PricingTier | null {
  const t = sortedTiers(p);
  return t[idx] ?? t[0] ?? null;
}

export default function ElearningLangClient({ products }: { products: ElearningProduct[] }) {
  const [search, setSearch] = useState('');
  // ── Keranjang: id produk yang dicentang + pilihan durasi (indeks tier).
  // Durasinya SATU untuk seisi keranjang: harga e-learning rata untuk semua
  // bahasa, jadi pilihan per-bahasa cuma menambah kebingungan.
  const [dipilih, setDipilih] = useState<string[]>([]);
  const [durasiIdx, setDurasiIdx] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', ref: '' });
  const [kirim, setKirim] = useState(false);
  const [salah, setSalah] = useState<string | null>(null);

  // Kalau pengunjung sudah login, data dirinya tak perlu diketik ulang.
  useEffect(() => {
    let batal = false;
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (batal || !u?.email) return;
      setForm((f) => ({
        ...f,
        name: f.name || (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || '',
        email: f.email || u.email!,
      }));
    });
    return () => { batal = true; };
  }, []);

  const terpilih = useMemo(
    () => dipilih.map((id) => products.find((p) => p.id === id)).filter((p): p is ElearningProduct => !!p),
    [dipilih, products],
  );
  const totalKeranjang = terpilih.reduce((n, p) => n + (tierPada(p, durasiIdx)?.price ?? 0), 0);

  const toggle = (id: string) =>
    setDipilih((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function checkout() {
    setSalah(null);
    if (!form.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      setSalah('Nama dan email yang valid wajib diisi.');
      return;
    }
    setKirim(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/create-cart-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Sesi login dikirim kalau ada supaya barisnya langsung nempel ke akun;
          // tanpa itu server memakai jalur tamu (cocok lewat email).
          accessToken: data.session?.access_token ?? '',
          buyer_name: form.name.trim(),
          buyer_email: form.email.trim(),
          buyer_phone: form.phone.trim() || null,
          referral_code:
            form.ref.trim() ||
            (typeof document !== 'undefined'
              ? ('; ' + document.cookie).split('; linguo_ref=')[1]?.split(';')[0] ?? null
              : null),
          items: terpilih
            .map((p) => ({ productId: p.id, pricingId: tierPada(p, durasiIdx)?.id ?? '' }))
            .filter((x) => x.pricingId),
        }),
      });
      const j = await res.json();
      if (!res.ok || !j.invoice_url) throw new Error(j.error ?? 'Gagal membuat invoice');
      window.location.href = j.invoice_url;
    } catch (e) {
      setSalah(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setKirim(false);
    }
  }

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
      {/* [nav-kembali-beranda-v1] Halaman ini sering dibuka LANGSUNG dari iklan,
          link afiliator, dan hasil pencarian — tanpa header, pengunjung mentok di
          sini tanpa jalan pulang. Offset `--promo-bar-h` wajib: pita batch reguler
          itu `fixed`, jadi header `top-0` bakal ketutupan olehnya. */}
      <header className="sticky top-[var(--promo-bar-h,0px)] z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-800 transition-colors hover:text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
            <span className="text-base font-bold">Linguo.id</span>
          </Link>
          <Link href="/toko" className="text-sm font-medium text-teal-600 hover:text-teal-700">
            Semua Produk Digital
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-12 pb-12 md:pt-20 md:pb-16">
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
            Tonton rekaman kelas level Basic dari pengajar Linguo sesuka kamu. Bayar cuma untuk
            bahasa yang kamu pelajari — <strong>boleh pilih beberapa bahasa sekaligus</strong> dalam
            satu pembayaran.
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
          {/* [elearning-multi-bahasa-v1] Durasi dipilih SEKALI untuk semua
              bahasa di keranjang — harganya rata untuk tiap bahasa. */}
          {sortedTiers(products[0] ?? ({} as ElearningProduct)).length > 1 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-semibold">
              {sortedTiers(products[0]).map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDurasiIdx(i)}
                  className={`rounded-full px-3 py-1.5 transition ${
                    durasiIdx === i ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.display_label}
                </button>
              ))}
            </div>
          )}
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
              const tier = tierPada(p, durasiIdx) ?? cheapest(p);
              const code = flagCodeFor(p.language);
              const foto = getLangPhoto(p.language);
              const dicentang = dipilih.includes(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/toko/${p.slug}`}
                  prefetch={false}
                  className="group relative block"
                >
                  {/* [elearning-multi-bahasa-v1] Centang = masuk keranjang.
                      preventDefault dipakai karena tombolnya duduk DI DALAM
                      <Link> — tanpa itu satu klik ikut membuka halaman produk. */}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(p.id); }}
                    aria-pressed={dicentang}
                    aria-label={`${dicentang ? 'Hapus' : 'Tambah'} Bahasa ${namaBahasa(p)} ${dicentang ? 'dari' : 'ke'} keranjang`}
                    className={`absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold shadow-sm ring-1 transition ${
                      dicentang
                        ? 'bg-teal-600 text-white ring-teal-600'
                        : 'bg-white/90 text-slate-700 ring-slate-200 backdrop-blur hover:bg-white'
                    }`}
                  >
                    {dicentang ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Plus className="h-3.5 w-3.5" strokeWidth={3} />}
                    {dicentang ? 'Dipilih' : 'Pilih'}
                  </button>
                  <article
                    className={`relative h-full rounded-2xl overflow-hidden bg-white border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      dicentang
                        ? 'border-teal-500 ring-2 ring-teal-500 shadow-lg shadow-teal-600/15'
                        : p.is_featured
                          ? 'border-slate-200 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20'
                          : 'border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* [elearning-kartu-foto-v1] Banner poster ala kartu kelas dashboard
                        siswa: foto bahasa memenuhi banner, nama bahasa duduk DI DALAM
                        foto di atas gradien hitam. Gradiennya wajib — tanpa itu teks
                        putih hilang di sampul terang (mis. langit siang). Bahasa yang
                        belum punya foto jatuh balik ke banner oranye + bendera. */}
                    <div
                      className={`relative isolate flex h-44 items-end overflow-hidden transform-gpu [backface-visibility:hidden] ${
                        foto ? 'bg-[#0E1526]' : 'bg-gradient-to-br from-amber-400 to-orange-500'
                      }`}
                    >
                      {foto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={foto}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transform-gpu scale-[1.02] transition-transform duration-300 ease-out [backface-visibility:hidden] group-hover:scale-[1.07]"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_60%)]" />
                          {code ? (
                            <RectFlag code={code} h={64} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[65%] shadow-lg" />
                          ) : (
                            <span
                              aria-hidden
                              className="absolute left-1/2 top-1/2 inline-flex h-16 w-[89px] -translate-x-1/2 -translate-y-[65%] items-center justify-center rounded-[10px] bg-white/20 ring-1 ring-white/40 shadow-lg backdrop-blur"
                            >
                              <Clapperboard className="h-8 w-8 text-white" strokeWidth={1.8} />
                            </span>
                          )}
                        </>
                      )}
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                        <Clapperboard className="h-3 w-3" strokeWidth={2} aria-hidden />
                        {p.level ? `Basic ${p.level}` : 'E-Learning'}
                      </span>
                      <div className="relative w-full p-3">
                        <div className="flex items-center gap-2">
                          {code && <RectFlag code={code} h={16} className="shrink-0 shadow" />}
                          <h2 className="truncate text-[15px] font-extrabold leading-tight text-white drop-shadow">
                            Bahasa {namaBahasa(p)}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        Rekaman kelas level Basic, bisa diulang kapan saja.
                      </p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500">
                            {tier ? `akses ${tier.display_label}` : 'Segera hadir'}
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

      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        <TautanLegal className="mb-2 px-4 text-slate-500" />
        © {new Date().getFullYear()} PT. Linguo Edu Indonesia
      </footer>

      {/* ── KERANJANG (bilah bawah) ───────────────────────────────────────── */}
      {terpilih.length > 0 && (
        <>
          {/* Ruang kosong biar bilahnya tak menutupi baris terakhir halaman. */}
          <div className="h-24" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShoppingCart className="h-4 w-4 text-teal-600" strokeWidth={2} aria-hidden />
                  {terpilih.length} bahasa dipilih
                  <button
                    type="button"
                    onClick={() => setDipilih([])}
                    className="text-xs font-medium text-slate-400 underline hover:text-slate-600"
                  >
                    kosongkan
                  </button>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {terpilih.map((p) => namaBahasa(p)).join(', ')}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">
                    Total · akses {tierPada(terpilih[0], durasiIdx)?.display_label ?? ''}
                  </div>
                  <div className="text-lg font-bold leading-tight text-slate-900">
                    {formatRupiah(totalKeranjang)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Bayar sekaligus
                  <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FORM DATA PEMBELI ─────────────────────────────────────────────── */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => !kirim && setFormOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Data pembeli</h2>
                <p className="text-sm text-slate-500">
                  Akses dikirim ke email ini dan bisa dibuka di linguo.id/akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !kirim && setFormOpen(false)}
                aria-label="Tutup"
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mb-4 space-y-1 rounded-2xl bg-slate-50 p-3 text-sm">
              {terpilih.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-slate-700">Bahasa {namaBahasa(p)}</span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {formatRupiah(tierPada(p, durasiIdx)?.price ?? 0)}
                  </span>
                </li>
              ))}
              <li className="mt-1 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Total</span>
                <span>{formatRupiah(totalKeranjang)}</span>
              </li>
            </ul>

            <div className="space-y-3">
              {[
                { k: 'name' as const, label: 'Nama lengkap *', type: 'text', ph: 'Nama kamu' },
                { k: 'email' as const, label: 'Email *', type: 'email', ph: 'email@kamu.com' },
                { k: 'phone' as const, label: 'Nomor WhatsApp', type: 'tel', ph: '08xxxxxxxxxx' },
                { k: 'ref' as const, label: 'Kode referral (opsional)', type: 'text', ph: 'Kode afiliator' },
              ].map((f) => (
                <label key={f.k} className="block">
                  <span className="mb-1 block text-[13px] font-medium text-slate-700">{f.label}</span>
                  <input
                    type={f.type}
                    value={form[f.k]}
                    onChange={(e) => setForm((v) => ({ ...v, [f.k]: e.target.value }))}
                    placeholder={f.ph}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </label>
              ))}
            </div>

            {salah && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{salah}</p>
            )}

            <button
              type="button"
              onClick={checkout}
              disabled={kirim}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {kirim ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {kirim ? 'Menyiapkan invoice…' : `Bayar ${formatRupiah(totalKeranjang)}`}
            </button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Pembayaran diproses Xendit. Bahasa yang sudah kamu miliki otomatis tidak ditagih lagi.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
