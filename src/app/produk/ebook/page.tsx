"use client";
// ebook-xendit-v3 — edisi toggle + paket bundle + multi-select kuota + checkout Xendit otomatis
import { useState } from "react";
import Link from "next/link";
import { Check, FileText, Infinity as InfinityIcon, PenLine, RefreshCw, Star, Lock, Zap, Globe, X, ArrowLeft } from "lucide-react";
import { RectFlag } from "@/components/RectFlag";

const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

// referral-code-field-v1 — baca ref affiliate dari ?ref= URL, cookie linguo_ref, atau localStorage
const storedRef = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const p = new URLSearchParams(window.location.search).get("ref");
  if (p) return p;
  const c = ("; " + document.cookie).split("; linguo_ref=")[1]?.split(";")[0];
  return c || localStorage.getItem("linguo_ref") || undefined;
};

// Bendera dirender pakai RectFlag (rounded rectangle SVG), bukan emoji. code = ISO-2.
const LANGS: { name: string; code: string }[] = [
  { name: "Inggris", code: "gb" }, { name: "Spanyol", code: "es" }, { name: "Jerman", code: "de" },
  { name: "Jepang", code: "jp" }, { name: "Mandarin", code: "cn" }, { name: "Belanda", code: "nl" },
  { name: "Arab", code: "sa" }, { name: "Prancis", code: "fr" }, { name: "Korea", code: "kr" },
  { name: "Tagalog", code: "ph" }, { name: "Italia", code: "it" }, { name: "Turki", code: "tr" },
  { name: "Rusia", code: "ru" }, { name: "Portugis", code: "pt" }, { name: "Thailand", code: "th" },
  { name: "Vietnam", code: "vn" }, { name: "Hindi", code: "in" }, { name: "Swedia", code: "se" },
  { name: "Norwegia", code: "no" }, { name: "Finlandia", code: "fi" },
];

const FEATURES = ["Format PDF","Akses selamanya","Kosakata praktis","Latihan soal","Contoh percakapan","Update gratis"];

type EditionId = "id" | "en";
const EDITIONS: { id: EditionId; label: string; hint: number }[] = [
  { id: "id", label: "Bahasa Indonesia", hint: 99000 },
  { id: "en", label: "English", hint: 79000 },
];

type Paket = { id: string; label: string; qty: number; hemat: number };
const PAKETS: Paket[] = [
  { id: "satuan",  label: "Satuan",         qty: 1,  hemat: 0 },
  { id: "hemat",   label: "Bundle Hemat",   qty: 3,  hemat: 20 },
  { id: "populer", label: "Bundle Populer", qty: 5,  hemat: 29 },
  { id: "all",     label: "All-Access",     qty: 20, hemat: 62 },
];

const PRICES: Record<EditionId, Record<string, number>> = {
  id: { satuan: 99000, hemat: 239000, populer: 349000, all: 749000 },
  en: { satuan: 79000, hemat: 189000, populer: 279000, all: 599000 },
};

export default function EbookPage() {
  const [edition, setEdition] = useState<EditionId>("id");
  const [paketId, setPaketId] = useState("satuan");
  const [picked, setPicked] = useState<string[]>([]);

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

  const paket = PAKETS.find((p) => p.id === paketId) ?? PAKETS[0];
  const isAll = paket.id === "all";
  const quota = paket.qty;
  const price = PRICES[edition][paket.id];
  const editionLabel = EDITIONS.find((e) => e.id === edition)?.label ?? "Bahasa Indonesia";
  const selected = isAll ? LANGS.map((l) => l.name) : picked;
  const ready = isAll || picked.length === quota;
  const remaining = quota - picked.length;
  const langLabel = isAll ? "Semua 20 bahasa" : selected.join(", ");

  const choosePaket = (id: string) => {
    const p = PAKETS.find((x) => x.id === id) ?? PAKETS[0];
    setPaketId(id);
    setPicked((prev) => prev.slice(0, p.qty));
  };

  const toggleLang = (nm: string) => {
    if (isAll) return;
    setPicked((prev) => {
      if (prev.includes(nm)) return prev.filter((x) => x !== nm);
      if (prev.length >= quota) return prev;
      return [...prev, nm];
    });
  };

  const checkout = async () => {
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
          language: langLabel,
          program: "digital",
          productKey: `ebook-${paket.id}-${edition}`,
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
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
              Mulai dari Rp 79.000
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Modul lengkap dari basic hingga intermediate. Kosakata praktis, contoh percakapan, dan latihan soal — bisa dipelajari kapan saja.
          </p>
        </div>
      </section>

      {/* Edition selector */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-2">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Pilih Edisi E-Book</h2>
        <p className="text-sm text-slate-500 text-center mb-5">Edisi menentukan bahasa pengantar materi.</p>
        <div className="flex gap-3 max-w-md mx-auto">
          {EDITIONS.map((e) => {
            const active = e.id === edition;
            return (
              <button
                key={e.id}
                onClick={() => setEdition(e.id)}
                className={`flex-1 rounded-2xl border-2 p-4 text-center transition-all ${
                  active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{e.label}</p>
                <p className="text-xs text-slate-400 mt-1">mulai {formatRp(e.hint)}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Paket selector */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-4">
        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">Pilih Paket</h2>
        <p className="text-sm text-slate-500 text-center mb-6">Makin banyak bahasa, makin hemat per e-book.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAKETS.map((p) => {
            const active = p.id === paketId;
            const pPrice = PRICES[edition][p.id];
            return (
              <button
                key={p.id}
                onClick={() => choosePaket(p.id)}
                className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
                  active ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                {p.id === "populer" && (
                  <span className="absolute -top-2.5 left-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Paling laku
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                <p className="text-xs text-slate-400 mb-2">{p.qty} bahasa</p>
                <p className="text-lg font-extrabold text-slate-900">{formatRp(pPrice)}</p>
                <p className="text-[11px] text-slate-400">{formatRp(Math.round(pPrice / p.qty))} / e-book</p>
                {p.hemat > 0 && (
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                    Hemat {p.hemat}%
                  </span>
                )}
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
                {paket.label} · Edisi {editionLabel}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                {isAll ? "Semua Bahasa, Sekali Beli" : `Pilih ${quota} Bahasa Favoritmu`}
              </h2>
              <p className="text-slate-500 mb-4">
                Rakit paketmu sendiri. Setiap e-book disusun rapi oleh tim kurikulum Linguo — format PDF, akses selamanya.
              </p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{formatRp(price)}</span>
                <span className="text-sm text-slate-400">/ {quota} bahasa</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-indigo-500 shrink-0" strokeWidth={2.5} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-80 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">Pilih bahasa</p>
                <span className={`text-xs font-bold ${ready ? "text-emerald-600" : "text-indigo-600"}`}>
                  {selected.length}/{quota}
                </span>
              </div>
              {isAll && (
                <p className="text-xs text-slate-400 mb-3">All-Access — semua 20 bahasa sudah termasuk.</p>
              )}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {LANGS.map((l) => {
                  const nm = l.name;
                  const on = selected.includes(nm);
                  const locked = !on && !isAll && picked.length >= quota;
                  return (
                    <button
                      key={nm}
                      onClick={() => toggleLang(nm)}
                      disabled={isAll || locked}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        on
                          ? "bg-indigo-500 text-white shadow-md"
                          : locked
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "bg-slate-50 text-slate-700 hover:bg-indigo-50"
                      }`}
                    >
                      <RectFlag code={l.code} h={16} className={locked ? "opacity-40" : ""} />
                      {nm}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={!ready}
                onClick={() => {
                  setError("");
                  setOpen(true);
                }}
                className="w-full mt-4 py-3 rounded-2xl font-bold text-sm bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 transition-all"
              >
                {ready ? `Beli ${paket.label} — ${formatRp(price)}` : `Pilih ${remaining} bahasa lagi`}
              </button>
              <a
                href={`https://wa.me/6282116859493?text=${encodeURIComponent(
                  `Halo Linguo.id! Saya mau tanya soal e-book ${paket.label} (Edisi ${editionLabel}).`
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
            { Icon: InfinityIcon, l: "Akses Selamanya", s: "Sekali beli, simpan terus" },
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
            { n: "Lia P.", t: "Ambil bundle 3 bahasa, hemat lumayan buat belajar bareng temen." },
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
            { Icon: Globe, l: "20+ Bahasa" },
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
          <p className="text-sm text-slate-400">© 2026 Linguo.id</p>
          <div className="flex gap-4">
            <a href="https://wa.me/6282116859493" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">WhatsApp</a>
            <a href="https://instagram.com/linguo.id" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">Instagram</a>
            <a href="https://tiktok.com/@linguoid" target="_blank" className="text-sm text-slate-500 hover:text-teal-600">TikTok</a>
          </div>
        </div>
      </footer>

      {/* Checkout modal — Xendit */}
      {open && (
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
                    {paket.label} · {editionLabel}
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
                <span className="font-semibold text-slate-800">Bahasa:</span> {langLabel}
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
