"use client";
// ebook-xendit-v3 — checkout Xendit otomatis
// [ebook-satuan-only-v1] Blok pemilih paket (Bundle Hemat/Populer/All-Access)
// DIHAPUS — skema bundle sudah tidak dipakai. Halaman cuma menjual e-book
// satuan: 1 bahasa per pembelian, harga mengikuti tier durasi akses.
// [ebook-durasi-akses-v1] Pemilih EDISI dihapus: landing cuma menjual seri "101
// new edition" (pengantar Bahasa Indonesia). Gantinya pemilih DURASI AKSES —
// 6 Bulan / 12 Bulan / Selamanya — persis tier di `digital_product_pricing`,
// supaya "mulai Rp 79.000" di iklan & etalase /toko cocok dengan harga di sini.
// [ebook-bahasa-dari-katalog-v1] Isi halaman dipindah ke sini dari page.tsx:
// daftar bahasanya sekarang datang dari DB (lihat src/lib/ebookBahasa.ts) lewat
// server component, bukan konstanta LANGS yang ditulis tangan — plus pratinjau
// Unit 1 dan kotak cari, karena 50+ bahasa tak lagi muat dibaca sekali lihat.
import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarClock, Check, FileText, Infinity as InfinityIcon, PenLine, RefreshCw,
  Star, Lock, Zap, Globe, X, ArrowLeft, Search, BookOpen, Loader2,
} from "lucide-react";
import { LangSlugFlag } from "@/components/RectFlag";
import TautanLegal from "@/components/TautanLegal"; // [xendit-legal-links-v1]
// [ebook-harga-katalog-sync-v1] harga paket & daftar paket dipusatkan — halaman
// ini dan /api/create-invoice membaca tabel yang sama.
import {
  EBOOK_HARGA_TERENDAH,
  EBOOK_DURASI,
  hargaEbook,
  type EbookDurasiId,
} from "@/lib/ebookPricing";
import type { BahasaEbook } from "@/lib/ebookBahasa";

/* [ebook-pratinjau-landing-v1] Reader yang sama dengan /toko/[slug] dan
   dashboard siswa — bentangan dua halaman, animasi balik, ketuk-kata-untuk-
   mendengar. Diimpor DINAMIS: bundelnya (pdf.js + latihan + panduan) ratusan KB
   dan halaman ini halaman jualan yang dibaca mesin pencari, jadi ia tak boleh
   ikut terunduh sampai tombolnya benar-benar ditekan. */
const EbookReader = dynamic(() => import("@/components/akun/EbookReader"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-[#3ED9C0]" aria-hidden />
        <p className="text-[13px] font-semibold text-white/60">Menyiapkan pratinjau…</p>
      </div>
    </div>
  ),
});

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// referral-code-field-v1 — baca ref affiliate dari ?ref= URL, cookie linguo_ref, atau localStorage
const storedRef = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const p = new URLSearchParams(window.location.search).get("ref");
  if (p) return p;
  const c = ("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0];
  return c || localStorage.getItem("linguo_ref") || undefined;
};

const featuresFor = (durasiLabel: string) => [
  "Format PDF",
  `Akses ${durasiLabel.toLowerCase()}`,
  "Kosakata praktis",
  "Latihan soal",
  "Contoh percakapan",
  "Update gratis",
];

const DURASI = EBOOK_DURASI;

export default function EbookKlien({ bahasa }: { bahasa: BahasaEbook[] }) {
  const [durasi, setDurasi] = useState<EbookDurasiId>("6bln");
  // [ebook-satuan-only-v1] satu bahasa per pembelian
  const [picked, setPicked] = useState<BahasaEbook | null>(null);
  // [ebook-bahasa-dari-katalog-v1] 50+ bahasa → kotak cari, bukan gulir panjang.
  const [cari, setCari] = useState("");
  const [baca, setBaca] = useState(false);

  // ── checkout Xendit ──
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  // referral-code-field-v1 — optional kode referral; default KOSONG (input manual).
  // Affiliate tetap ke-track lewat cookie linguo_ref / ?ref= saat submit (lihat bawah).
  const [refCode, setRefCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const price = hargaEbook(durasi, "satuan");
  const durasiLabel = DURASI.find((d) => d.id === durasi)?.label ?? "6 Bulan";
  const selamanya = durasi === "selamanya";
  const aksesLabel = selamanya ? "akses selamanya" : `akses ${durasiLabel.toLowerCase()}`;
  const ready = picked !== null;

  // Cocokkan nama Indonesia MAUPUN nama katalog: yang mengetik "romanian" atau
  // "dansk" sama-sama sedang mencari buku yang ada.
  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return bahasa;
    return bahasa.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.katalog.toLowerCase().includes(q) ||
        b.judul.toLowerCase().includes(q),
    );
  }, [bahasa, cari]);

  const toggleLang = (b: BahasaEbook) => {
    setPicked((prev) => (prev?.katalog === b.katalog ? null : b));
  };

  const checkout = async () => {
    if (!picked) return;
    if (!name.trim() || !email.trim() || !wa.trim()) {
      setError("Lengkapi nama, email, dan WhatsApp.");
      return;
    }
    if (!email.includes("@")) {
      setError("Email belum valid.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const cleanWa = wa.replace(/\D/g, "").replace(/^0/, "");
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          wa_number: cleanWa,
          // Nama INDONESIA, seperti sebelumnya: edge fn xendit-webhook
          // menerjemahkannya balik ke nama katalog lewat EBOOK_LANG_TO_CATALOG
          // sebelum mencari produknya. Nama yang tak dikenal peta itu dipakai
          // apa adanya — itu jaring terakhirnya, bukan jalur yang diandalkan.
          language: picked.label,
          // ebook-program-label-v1 — dulu "digital", jadi ketuker sama checkout
          // e-learning /produk yang juga kirim "digital": di Tagihan & Leads admin
          // dua-duanya tampil "digital" mentah. Sekarang eksplisit "e-book" (nilai
          // yang sudah dikenal PROGRAM_LABELS admin) dan /produk kirim "e-learning".
          program: "e-book",
          productKey: `ebook-satuan-id-${durasi}`,
          // referral-code-field-v1 — input manual menang; fallback ke cookie linguo_ref / ?ref=
          referral_source: refCode.trim() || storedRef() || undefined,
          ref_code: refCode.trim() || storedRef() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      window.location.href = data.invoice_url;
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      {/* [ebook-durasi-akses-v1] Offset --promo-bar-h: bar batch reguler itu `fixed`,
          jadi header `top-0` ketutupan olehnya dan tombol kembali ke beranda ikut hilang. */}
      <header className="sticky top-[var(--promo-bar-h,0px)] z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-800 hover:text-teal-600">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-bold text-lg">Linguo.id</span>
          </Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-teal-600 font-medium">
            Butuh bantuan?
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-teal-50" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6">
            <span className="text-sm font-medium text-indigo-700">E-Book Digital Linguo</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4">
            E-Book Belajar Bahasa
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-500">
              Mulai dari {formatRp(EBOOK_HARGA_TERENDAH)}
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Modul lengkap dari basic hingga intermediate. Kosakata praktis, contoh percakapan, dan latihan soal — bisa dipelajari kapan saja.
          </p>
          {bahasa.length > 0 && (
            <p className="mt-4 text-sm font-semibold text-indigo-600">
              {bahasa.length} bahasa tersedia · Unit 1 bisa dibaca gratis sebelum beli
            </p>
          )}
        </div>
      </section>

      {/* Durasi akses */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Pilih Durasi Akses</h2>
        <p className="text-sm text-slate-500 text-center mb-5">
          Materinya sama — yang berbeda hanya lama kamu bisa membukanya.
        </p>
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {DURASI.map((d) => {
            const active = d.id === durasi;
            return (
              <button
                key={d.id}
                onClick={() => setDurasi(d.id)}
                className={`relative rounded-2xl border-2 p-4 text-center transition-all ${
                  active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                {d.id === "selamanya" && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    Sekali beli
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-900">{d.label}</p>
                <p className="text-lg font-extrabold text-slate-900 mt-1">
                  {formatRp(hargaEbook(d.id, "satuan"))}
                </p>
                <p className="text-[11px] text-slate-400">per e-book</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Product card */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 bg-indigo-100 rounded-full px-3 py-1 mb-4 text-xs font-semibold text-indigo-700">
                1 E-Book · Akses {durasiLabel}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                Pilih Bahasa Favoritmu
              </h2>
              <p className="text-slate-500 mb-4">
                Setiap e-book disusun rapi oleh tim kurikulum Linguo — format PDF, {aksesLabel}.
              </p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{formatRp(price)}</span>
                <span className="text-sm text-slate-400">/ e-book</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {featuresFor(durasiLabel).map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" strokeWidth={2.5} />
                    {f}
                  </div>
                ))}
              </div>

              {/* [ebook-pratinjau-landing-v1] Sampul + tombol cicip muncul begitu
                  bahasanya dipilih: "contoh percakapan" & "latihan soal" di atas
                  cuma janji tertulis sampai calon pembeli melihat isinya sendiri. */}
              {picked && (
                <div className="mt-6 flex items-center gap-4 rounded-2xl border border-indigo-100 bg-white p-4">
                  {picked.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={picked.cover}
                      alt={`Sampul ${picked.judul}`}
                      className="h-24 w-[68px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-24 w-[68px] shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <BookOpen className="h-6 w-6 text-slate-400" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{picked.judul}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tingkat dasar (A1) · PDF · {aksesLabel}
                    </p>
                    {picked.pratinjau ? (
                      <>
                        <button
                          onClick={() => setBaca(true)}
                          className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-indigo-500 px-3.5 py-2 text-[13px] font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
                        >
                          <BookOpen className="h-4 w-4" strokeWidth={2} aria-hidden />
                          Baca Gratis Unit 1
                        </button>
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          Lihat isinya dulu — gratis, tanpa daftar.
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-[11px] text-slate-400">
                        Pratinjau modul ini belum tersedia.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">Pilih bahasa</p>
                <span className={`text-xs font-bold ${ready ? "text-emerald-600" : "text-indigo-600"}`}>
                  {ready ? picked!.label : "Pilih 1 bahasa"}
                </span>
              </div>
              {/* [ebook-bahasa-dari-katalog-v1] Kotak cari — daftarnya 50+ baris. */}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                  type="search"
                  value={cari}
                  onChange={(e) => setCari(e.target.value)}
                  placeholder={`Cari dari ${bahasa.length} bahasa…`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {tersaring.map((b) => {
                  const on = picked?.katalog === b.katalog;
                  return (
                    <button
                      key={b.katalog}
                      onClick={() => toggleLang(b)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        on ? "bg-indigo-500 text-white shadow-md" : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
                      }`}
                    >
                      <LangSlugFlag slug={b.bendera} h={16} />
                      <span className="truncate">{b.label}</span>
                    </button>
                  );
                })}
                {tersaring.length === 0 && (
                  <p className="col-span-2 py-6 text-center text-xs text-slate-400">
                    Bahasa “{cari}” belum ada e-book-nya.
                    <br />
                    <a
                      href={`https://wa.me/6282116859493?text=${encodeURIComponent(
                        `Halo Linguo.id! Saya mencari e-book bahasa ${cari}.`,
                      )}`}
                      target="_blank"
                      className="font-semibold text-indigo-500"
                    >
                      Tanyakan ke tim kami
                    </a>
                  </p>
                )}
              </div>
              <button
                disabled={!ready}
                onClick={() => {
                  setError("");
                  setOpen(true);
                }}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-all"
              >
                {ready ? `Beli E-Book ${picked!.label} — ${formatRp(price)}` : "Pilih bahasa dulu"}
              </button>
              <a
                href={`https://wa.me/6282116859493?text=${encodeURIComponent(
                  `Halo Linguo.id! Saya mau tanya soal e-book${picked ? ` bahasa ${picked.label}` : ""} (akses ${durasiLabel}).`
                )}`}
                target="_blank"
                className="block text-center text-xs text-slate-400 hover:text-indigo-500 mt-2.5"
              >
                atau tanya dulu via WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { Icon: FileText, l: "Format PDF", s: "Buka di HP / laptop" },
            selamanya
              ? { Icon: InfinityIcon, l: "Akses Selamanya", s: "Sekali beli, simpan terus" }
              : { Icon: CalendarClock, l: `Akses ${durasiLabel}`, s: "Perpanjang kapan saja" },
            { Icon: PenLine, l: "Latihan Soal", s: "Latih pemahamanmu" },
            { Icon: RefreshCw, l: "Update Gratis", s: "Revisi terbaru gratis" },
          ].map((f) => (
            <div key={f.l} className="bg-slate-50 rounded-2xl p-5 text-center">
              <f.Icon className="h-6 w-6 mx-auto mb-2 text-indigo-500" strokeWidth={1.75} />
              <p className="text-sm font-semibold text-slate-900">{f.l}</p>
              <p className="text-xs text-slate-400 mt-1">{f.s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Apa Kata Mereka?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "Budi S.", t: "E-book materinya lengkap dan rapi, jelas banget penjelasannya." },
            { n: "Lia P.", t: "Harganya terjangkau, materinya cocok buat belajar sendiri di rumah." },
            { n: "Andi W.", t: "Format PDF-nya enak dibaca di HP pas lagi senggang." },
          ].map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">&ldquo;{t.t}&rdquo;</p>
              <p className="text-sm font-semibold text-slate-900">{t.n}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-slate-50 rounded-3xl p-8 flex flex-wrap items-center justify-center gap-8">
          {[
            { Icon: Lock, l: "Pembayaran Aman" },
            { Icon: Zap, l: "Akses Instan" },
            // Angkanya ikut katalog: dulu tertulis "20+ Bahasa" padahal daftarnya
            // pas 20 dan katalognya sudah jauh lebih panjang.
            { Icon: Globe, l: `${bahasa.length || 20}+ Bahasa` },
            { Icon: Star, l: "Google Review 5.0" },
          ].map((b) => (
            <span key={b.l} className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <b.Icon className="h-4 w-4 text-slate-400" strokeWidth={2} />
              {b.l}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm text-slate-400">© 2026 Linguo.id</p>
            <TautanLegal className="text-xs text-slate-500" />
          </div>
          <div className="flex gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">WhatsApp</a>
            <a href="https://instagram.com/linguo.id" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">Instagram</a>
            <a href="https://tiktok.com/@linguoid" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">TikTok</a>
          </div>
        </div>
      </footer>

      {/* [ebook-pratinjau-landing-v1] Cicipan Unit 1 — tanpa akun. Yang menjaga
          halaman berbayarnya bukan gerbang login, melainkan servernya:
          /api/ebook/pratinjau-publik memotong PDF-nya dan cuma mengirim Unit 1. */}
      {baca && picked && (
        <EbookReader
          purchaseId={`pratinjau:${picked.slug}`}
          accessToken=""
          title={picked.judul}
          language={picked.katalog}
          pratinjauUrl={`/api/ebook/pratinjau-publik?slug=${encodeURIComponent(picked.slug)}`}
          onBeli={() => {
            setBaca(false);
            setError("");
            setTimeout(() => setOpen(true), 120);
          }}
          onClose={() => setBaca(false)}
        />
      )}

      {/* Checkout modal — Xendit */}
      {open && picked && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-indigo-100 text-xs">Checkout E-Book</p>
                  <h3 className="text-lg font-bold">
                    E-Book {picked.label} · Akses {durasiLabel}
                  </h3>
                </div>
                <button
                  onClick={() => !loading && setOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/20 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-2xl font-extrabold mt-2">{formatRp(price)}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Bahasa:</span> {picked.label}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">E-book dikirim ke email ini setelah pembayaran.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">WhatsApp</label>
                <input
                  type="tel"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder="0821xxxxxxxx"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
              {/* referral-code-field-v1 — optional, sama seperti funnel kelas */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kode Referral (opsional)</label>
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                  placeholder="Masukkan kode referral jika ada"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dapatkan dari teman atau afiliator Linguo</p>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                {loading ? "Memproses..." : `Bayar ${formatRp(price)}`}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
