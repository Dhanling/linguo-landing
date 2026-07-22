"use client";
// [test-prep-v1] Flow katalog + checkout Persiapan Ujian Bahasa (HSK/JLPT/TOPIK/
// Goethe). Pilih produk → format (semi-private / private) → level → (private:
// jumlah sesi) → isi identitas → checkout Xendit lewat /api/create-funnel-invoice.
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenTool, GraduationCap, ScrollText, Award, Users, User, Check, X,
  ArrowLeft, Clock, Sparkles, type LucideIcon,
} from "lucide-react";
import { RectFlag } from "@/components/RectFlag";
import {
  TEST_PREP_PRODUCTS, quoteTestPrep, formatRupiah, SESSION_MINUTES,
  SEMI_SESSIONS, PRIVATE_SESSION_OPTS, DEFAULT_PRIVATE_SESSIONS,
  type TestPrepProduct, type TestPrepFormat,
} from "@/lib/testPrep";

const TEAL = "#1A9E9E";
const ICON: Record<string, LucideIcon> = { PenTool, GraduationCap, ScrollText, Award };

export default function PersiapanTesClient() {
  const [active, setActive] = useState<TestPrepProduct | null>(null);

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
            <ArrowLeft className="h-4 w-4" /> Linguo.id
          </Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm font-medium text-teal-600">Butuh bantuan?</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-indigo-50" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Persiapan ujian terstruktur + mock test</span>
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-5xl">
            Persiapan Ujian Bahasa<br />
            <span className="bg-gradient-to-r from-teal-500 to-indigo-500 bg-clip-text text-transparent">HSK · JLPT · TOPIK · Goethe</span>
          </h1>
          <p className="mx-auto mb-2 max-w-2xl text-base text-slate-500 sm:text-lg">
            Kelas persiapan sertifikasi resmi dengan pengajar berpengalaman. Pilih grup kecil (semi-private) yang ekonomis atau private 1-on-1 yang fleksibel.
          </p>
        </div>
      </section>

      {/* Katalog produk */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid gap-5 sm:grid-cols-2">
          {TEST_PREP_PRODUCTS.map((p) => {
            const Icon = ICON[p.icon] ?? Award;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p)}
                className="group flex flex-col rounded-3xl border-2 border-slate-100 p-6 text-left transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl"
                style={{ background: p.bg }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: p.accent }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-lg font-extrabold text-slate-900">{p.test}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <RectFlag code={p.flagCode} h={13} /> {p.language === "Japanese" ? "Jepang" : p.language === "Korean" ? "Korea" : p.language === "German" ? "Jerman" : "Mandarin"}
                      </div>
                    </div>
                  </div>
                  {p.demandTag && (
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold" style={{ color: p.accent }}>{p.demandTag}</span>
                  )}
                </div>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-600">{p.blurb}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Mulai dari</p>
                    <p className="text-xl font-extrabold text-slate-900">{formatRupiah(p.semiPrice)}</p>
                    <p className="text-[11px] text-slate-400">/orang · {SEMI_SESSIONS} sesi semi-private</p>
                  </div>
                  <span className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition group-hover:brightness-110" style={{ background: p.accent }}>
                    Daftar
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Perbandingan format */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              <p className="font-bold text-slate-900">Semi-Private (grup kecil)</p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {["Grup 3–6 orang, harga per orang lebih hemat", "Ada partner latihan speaking & writing", "Paket 12 sesi @90 menit, kurikulum terstruktur", "Cukup 3 orang untuk buka kelas"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="mb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              <p className="font-bold text-slate-900">Private 1-on-1</p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {["Fokus penuh ke kamu, jadwal fleksibel", "Materi menyesuaikan target skor & kelemahan", "Pilih 8 / 12 / 16 sesi @90 menit", "Cocok untuk kejar deadline ujian"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-3xl bg-slate-50 p-6">
          {["Pengajar bersertifikat", "Mock test + feedback", "Materi sesuai format ujian resmi", "Pembayaran aman via Xendit"].map((b) => (
            <span key={b} className="flex items-center gap-1.5 text-sm font-medium text-slate-500"><Check className="h-4 w-4 text-teal-500" />{b}</span>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {active && <CheckoutModal product={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </main>
  );
}

function CheckoutModal({ product, onClose }: { product: TestPrepProduct; onClose: () => void }) {
  const [format, setFormat] = useState<TestPrepFormat>("semi");
  const [level, setLevel] = useState(product.levels[0]?.id ?? "");
  const [sessions, setSessions] = useState<number>(DEFAULT_PRIVATE_SESSIONS);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");

  const quote = quoteTestPrep(product, format, level, sessions);

  const checkout = async () => {
    if (!name.trim() || !email.trim() || !email.includes("@") || !wa.trim()) {
      setError("Lengkapi nama, email, dan WhatsApp yang valid."); return;
    }
    setLoading(true); setError("");
    try {
      const ref = typeof window !== "undefined" ? localStorage.getItem("linguo_ref") || undefined : undefined;
      const res = await fetch("/api/create-funnel-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), wa_number: wa.trim(),
          program: "Test Prep", language: product.language, level,
          sessions: quote.sessions, test_prep_id: product.id, test_prep_format: format,
          ref_code: ref,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      window.location.href = data.invoice_url;
    } catch (e: any) { setError(e.message); setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center"
      onClick={() => !loading && onClose()}>
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 text-white" style={{ background: product.accent }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Persiapan Ujian</p>
              <h3 className="text-lg font-bold">{product.test} — {product.language === "Japanese" ? "Jepang" : product.language === "Korean" ? "Korea" : product.language === "German" ? "Jerman" : "Mandarin"}</h3>
            </div>
            <button onClick={() => !loading && onClose()} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Format */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">Pilih format kelas</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { k: "semi", icon: Users, label: "Semi-Private", sub: "Grup kecil, hemat" },
                { k: "private", icon: User, label: "Private 1-on-1", sub: "Fokus & fleksibel" },
              ] as const).map((f) => {
                const Icon = f.icon; const on = format === f.k;
                return (
                  <button key={f.k} onClick={() => setFormat(f.k)}
                    className={`rounded-2xl border-2 p-3 text-left transition ${on ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <Icon className={`mb-1 h-5 w-5 ${on ? "text-teal-600" : "text-slate-400"}`} />
                    <p className="text-sm font-bold text-slate-900">{f.label}</p>
                    <p className="text-[11px] text-slate-500">{f.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">Target level ujian</p>
            <div className="flex flex-wrap gap-2">
              {product.levels.map((l) => {
                const on = level === l.id;
                return (
                  <button key={l.id} onClick={() => setLevel(l.id)} title={l.desc}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-slate-700 hover:border-teal-300"}`}>
                    {l.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jumlah sesi (private) */}
          {format === "private" && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">Jumlah sesi</p>
              <div className="flex gap-2">
                {PRIVATE_SESSION_OPTS.map((s) => {
                  const on = sessions === s;
                  return (
                    <button key={s} onClick={() => setSessions(s)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${on ? "border-teal-500 bg-teal-500 text-white" : "border-slate-200 text-slate-700 hover:border-teal-300"}`}>
                      {s} sesi
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ringkasan harga */}
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" /> {quote.sessions} sesi @{SESSION_MINUTES} menit
              {format === "semi" && <span>· harga per orang</span>}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{formatRupiah(quote.amount)}</span>
              {format === "private" && <span className="text-xs text-slate-400">({formatRupiah(quote.perSession)}/sesi)</span>}
            </div>
          </div>

          {/* Identitas */}
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
            <input type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="Nomor WhatsApp (08...)" disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}

          <button onClick={checkout} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-60"
            style={{ background: TEAL }}>
            {loading ? "Memproses..." : `Daftar & Bayar ${formatRupiah(quote.amount)}`}
          </button>
          <p className="text-center text-[11px] text-slate-400">Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
