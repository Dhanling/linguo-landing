"use client";

// simulasi-paywall-v1 — halaman pilih paket Simulasi Tes (TOEFL / IELTS @ 79k).
// Checkout via /api/create-invoice (productKey simulasi-toefl|simulasi-ielts) →
// Xendit invoice. Setelah PAID, webhook grant simulation_entitlements (by email).
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Headphones, PenLine, Mic, Sparkles, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

const TEAL = "#1A9E9E";
const TEAL_DEEP = "#0F6E56";
const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type ProductKey = "simulasi-toefl" | "simulasi-ielts";
type Variant = "itp" | "ibt" | "academic" | "general";
type SkillKey = "reading" | "listening" | "writing" | "speaking" | "structure";

const SKILL_META: Record<SkillKey, { icon: typeof BookOpen; label: string }> = {
  reading: { icon: BookOpen, label: "Reading" },
  listening: { icon: Headphones, label: "Listening" },
  writing: { icon: PenLine, label: "Writing" },
  speaking: { icon: Mic, label: "Speaking" },
  structure: { icon: PenLine, label: "Structure" },
};

// 4 varian tes. Entitlement di-grant per test_type (toefl/ielts) oleh webhook,
// jadi sekali bayar TOEFL sudah membuka ITP & iBT — begitu pula IELTS utk
// Academic & General. `variant` cuma dikirim utk pelabelan invoice.
const PAKET: {
  productKey: ProductKey;
  variant: Variant;
  testType: string;
  title: string;
  short: string;
  tag: string;
  accent: string;
  skills: SkillKey[];
  covers: string; // catatan jujur: 1x bayar mencakup kedua varian
}[] = [
  { productKey: "simulasi-toefl", variant: "itp", testType: "toefl", title: "Simulasi TOEFL ITP", short: "TOEFL ITP", tag: "Format ITP", accent: "#1A9E9E", skills: ["listening", "structure", "reading"], covers: "1x bayar TOEFL: akses ITP & iBT" },
  { productKey: "simulasi-toefl", variant: "ibt", testType: "toefl", title: "Simulasi TOEFL iBT", short: "TOEFL iBT", tag: "Format iBT", accent: "#1A9E9E", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar TOEFL: akses ITP & iBT" },
  { productKey: "simulasi-ielts", variant: "academic", testType: "ielts", title: "Simulasi IELTS Academic", short: "IELTS Academic", tag: "Academic", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General" },
  { productKey: "simulasi-ielts", variant: "general", testType: "ielts", title: "Simulasi IELTS General", short: "IELTS General", tag: "General Training", accent: "#6D5AE6", skills: ["reading", "listening", "writing", "speaking"], covers: "1x bayar IELTS: akses Academic & General" },
];

const PRICE = 79000;
const FEATURES = [
  "Sesuai format tes asli TOEFL & IELTS",
  "Skor & pembahasan langsung keluar",
  "Akses selamanya (sekali bayar)",
];

export default function SimulasiPaketPage() {
  const [open, setOpen] = useState(false);
  const [paket, setPaket] = useState<(typeof PAKET)[number] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill dari user yang sudah login → kurangi salah email (entitlement match by email).
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
      const fn = (user?.user_metadata?.full_name as string) || "";
      if (fn) setName(fn);
    })();
  }, []);

  const openCheckout = (p: (typeof PAKET)[number]) => {
    setPaket(p);
    setError("");
    setOpen(true);
  };

  const checkout = async () => {
    if (!name.trim() || !email.trim() || !wa.trim()) { setError("Lengkapi semua field"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), wa_number: wa.trim(),
          program: "simulasi", level: paket!.testType, productKey: paket!.productKey,
          variant: paket!.variant,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat invoice");
      window.location.href = data.invoice_url;
    } catch (e: any) { setError(e.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-16">
          <Link href="/simulasi" className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600">
            <ArrowLeft className="h-4 w-4" /> Simulasi
          </Link>
          <a href="https://wa.me/6282116859493" target="_blank" className="text-sm font-medium text-teal-600">Butuh bantuan?</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
        <div className="mx-auto max-w-5xl px-5 py-14 text-center text-white sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold backdrop-blur">
            <Sparkles className="h-4 w-4" /> Feedback Lengkap
          </span>
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Pilih Paket Simulasi</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Latihan tes lengkap 4 skill dengan penilaian instan + feedback. Pilih jenis tes yang ingin kamu kuasai.
          </p>
        </div>
      </section>

      {/* Paket cards — `relative z-10` wajib: section Hero di atas pakai
          position:relative, jadi tanpa ini kartu (yang ditarik naik -mt-10)
          ketutupan/overlap oleh hero. */}
      <section className="relative z-10 mx-auto -mt-10 max-w-4xl px-5 pb-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {PAKET.map((p) => (
            <div key={p.variant} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: p.accent }}>
                {p.tag}
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{p.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.skills.map((key) => {
                  const s = SKILL_META[key];
                  const Icon = s.icon;
                  return (
                    <span key={key} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      <Icon className="h-3.5 w-3.5" style={{ color: p.accent }} /> {s.label}
                    </span>
                  );
                })}
              </div>
              <ul className="mt-5 space-y-2">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} /> {p.skills.length} bagian sesuai format tes asli
                </li>
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{formatRp(PRICE)}</span>
                <span className="text-sm text-slate-400">/ sekali bayar</span>
              </div>
              <p className="mt-1.5 text-xs font-medium" style={{ color: p.accent }}>{p.covers}</p>
              <button
                onClick={() => openCheckout(p)}
                className="mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-95"
                style={{ background: p.accent }}>
                Beli {p.short}
              </button>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-400">
          Setelah pembayaran, akses simulasi otomatis terbuka di dashboard. Gunakan email yang sama
          saat login agar aksesnya cocok. Butuh bimbingan intensif?{" "}
          <Link href="/jadwal-kelas-reguler?tab=etp" className="font-semibold text-teal-600">Lihat kelas IELTS/TOEFL</Link>.
        </p>
      </section>

      {/* Checkout modal */}
      <AnimatePresence>
        {open && paket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm md:items-center"
            onClick={() => !loading && setOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="px-6 py-5 text-white" style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/70">Checkout</p>
                    <h3 className="text-lg font-bold">{paket.title}</h3>
                  </div>
                  <button onClick={() => !loading && setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">✕</button>
                </div>
                <p className="mt-2 text-2xl font-extrabold">{formatRp(PRICE)}</p>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Nama Lengkap</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" disabled={loading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Email <span className="font-normal text-slate-400">(dipakai untuk akses)</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" disabled={loading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">WhatsApp</label>
                  <input type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0821..." disabled={loading}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50" />
                </div>
                {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-500">{error}</p>}
                <button onClick={checkout} disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-60"
                  style={{ background: TEAL }}>
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>) : `Bayar ${formatRp(PRICE)}`}
                </button>
                <p className="text-center text-[11px] text-slate-400">Pembayaran aman via Xendit: QRIS, GoPay, OVO, Dana, ShopeePay, Transfer Bank</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
