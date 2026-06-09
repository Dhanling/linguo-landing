// linguo-patch:afiliator-page-redesign-v1 — Full landing redesign (hero, stats, how-it-works, tier table, kalkulator, FAQ, CTA). Signup wizard modal + /api/affiliate/signup contract UNCHANGED. teal #1A9E9E, sonner.
"use client";

// ============================================================================
// /afiliator — Public Affiliate Recruitment Landing
// Affiliate Program — Phase 3A
// ----------------------------------------------------------------------------
// Public self-signup. Visitors are typically logged out; user_id stays NULL and
// /api/affiliate/me later matches them by email at login.
//
// REDESIGN (afiliator-page-redesign-v1): full marketing landing built to
// convert cold visitors — Hero → Stats → How it works → Tier system (+ full
// commission table) → Kalkulator → FAQ → Final CTA. The 3-step signup wizard
// lives in a modal opened by every "Daftar" CTA; its /api/affiliate/signup
// contract (7 fields, no server-set fields ever sent) is UNCHANGED. The tier
// rates render from @/lib/affiliate-komisi so they never drift from the engine.
// ============================================================================

import { useState, useEffect, type ReactNode } from "react";
import {
  Megaphone,
  Check,
  Loader2,
  Camera,
  Music2,
  User,
  Share2,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Globe,
  Percent,
  CalendarDays,
  Users,
  UserPlus,
  Coins,
  ChevronDown,
  Medal,
  Award,
  Trophy,
  Crown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import KomisiKalkulator from "@/components/afiliator/KomisiKalkulator";
import { PRODUCTS, TIERS } from "@/lib/affiliate-komisi";

const DASHBOARD_URL = "/akun/afiliator";

type FormState = {
  name: string;
  email: string;
  whatsapp: string;
  ig_handle: string;
  tiktok_handle: string;
  followers: string;
  motivation: string;
};

const EMPTY: FormState = {
  name: "",
  email: "",
  whatsapp: "",
  ig_handle: "",
  tiktok_handle: "",
  followers: "",
  motivation: "",
};

// ── Content config ───────────────────────────────────────────────────────────
const STATS: { icon: typeof Globe; value: string; label: string }[] = [
  { icon: Globe, value: "60+", label: "Bahasa diajarkan" },
  { icon: Percent, value: "30%", label: "Komisi hingga" },
  { icon: CalendarDays, value: "Tiap 25", label: "Pencairan bulanan" },
  { icon: Users, value: "500+", label: "Pelajar aktif" },
];

const HOW_STEPS: { icon: typeof UserPlus; title: string; desc: string }[] = [
  {
    icon: UserPlus,
    title: "Daftar & dapat link unik",
    desc: "Isi data singkat, tim Linguo tinjau, lalu kamu dapat kode referral sendiri.",
  },
  {
    icon: Share2,
    title: "Bagikan ke audiens kamu",
    desc: "Sebarkan link di Instagram, TikTok, WhatsApp, atau di mana pun audiensmu berada.",
  },
  {
    icon: Coins,
    title: "Dapat komisi tiap ada yang beli",
    desc: "Setiap pembelian lewat linkmu otomatis tercatat — komisi langsung masuk saldo.",
  },
];

// Per-tier visual treatment. Rates/labels come from @/lib/affiliate-komisi.
const TIER_META: Record<
  string,
  {
    icon: typeof Medal;
    badge: string;
    iconWrap: string;
    perks: string[];
    highlight?: boolean;
  }
> = {
  standard: {
    icon: Medal,
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
    iconWrap: "bg-slate-100 text-slate-500",
    perks: ["Tier awal semua afiliator baru", "Komisi langsung aktif tanpa syarat"],
  },
  bronze: {
    icon: Award,
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    iconWrap: "bg-amber-100 text-amber-700",
    perks: ["Komisi naik di semua produk", "Untuk afiliator yang mulai aktif"],
  },
  silver: {
    icon: Trophy,
    badge: "bg-slate-200 text-slate-700 ring-slate-300",
    iconWrap: "bg-slate-200 text-slate-600",
    perks: ["Komisi lebih besar di tiap penjualan", "Untuk performa yang konsisten"],
  },
  gold: {
    icon: Crown,
    badge: "bg-gradient-to-br from-amber-400 to-amber-500 text-white ring-amber-300",
    iconWrap: "bg-gradient-to-br from-amber-400 to-amber-500 text-white",
    perks: ["Komisi tertinggi — sampai 30%", "Untuk top affiliator Linguo"],
    highlight: true,
  },
};

const FAQS: { q: string; a: string }[] = [
  {
    q: "Kapan komisi dicairkan?",
    a: "Komisi bisa dicairkan kapan saja selama saldo minimal Rp10.000. Biaya admin penarikan Rp2.500 ditanggung afiliator.",
  },
  {
    q: "Apa bedanya tier Standard, Bronze, Silver, Gold?",
    a: "Tier menentukan persentase komisi kamu. Semakin tinggi tier, semakin besar komisi per penjualan. Tier ditentukan oleh tim Linguo berdasarkan performa dan kontribusi afiliator.",
  },
  {
    q: "Bagaimana cara kerja link referral?",
    a: "Setiap afiliator punya kode unik (contoh: linguo.id?ref=KODEKAMU). Siapapun yang mengklik link kamu dan membeli dalam 60 hari akan tercatat sebagai referral kamu. Link/kode afiliasi kamu berlaku selama 1 tahun sejak tanggal pendaftaran. Mendekati 1 tahun, kamu akan menerima email konfirmasi untuk memperpanjang status afiliator.",
  },
  {
    q: "Produk apa saja yang menghasilkan komisi?",
    a: "Semua produk Linguo — Private, Reguler, Kids, IELTS/TOEFL, E-Learning, dan E-Book.",
  },
  {
    q: "Apakah saya bisa membeli produk Linguo lewat link sendiri?",
    a: "Tidak, sistem kami mendeteksi self-referral dan tidak akan mencatat komisi jika kamu membeli lewat link sendiri.",
  },
  {
    q: "Apakah ada biaya untuk bergabung?",
    a: "Gratis sepenuhnya. Tidak ada biaya pendaftaran atau biaya bulanan.",
  },
  {
    q: "Bagaimana cara saya tahu sudah ada penjualan?",
    a: "Login ke dashboard afiliator di linguo.id/akun/afiliator — kamu bisa lihat klik, konversi, dan saldo komisi secara real-time.",
  },
  {
    q: "Apakah komisi dipotong pajak?",
    a: "Ya, berlaku pemotongan PPh 21 sebesar 5% sesuai ketentuan perpajakan Indonesia.",
  },
];

const STEPS: { key: string; label: string; icon: typeof User }[] = [
  { key: "identitas", label: "Identitas", icon: User },
  { key: "sosmed", label: "Sosial Media", icon: Share2 },
  { key: "motivasi", label: "Motivasi", icon: MessageSquare },
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

// Commission span across all products for a tier index → "8–15%".
function tierRange(tierIdx: number): string {
  const rates = PRODUCTS.map((p) => p.rates[tierIdx]);
  return `${Math.round(Math.min(...rates) * 100)}–${Math.round(
    Math.max(...rates) * 100
  )}%`;
}

const inputCls =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

// Shared scroll-reveal props for below-the-fold sections.
const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

export default function AfiliatorSignupPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Lock body scroll + Esc-to-close while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) closeModal();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy]);

  function openModal() {
    setError(null);
    if (done) {
      // Fresh start after a previous successful submit.
      setForm(EMPTY);
      setStep(0);
      setDone(false);
    }
    setOpen(true);
  }

  function closeModal() {
    if (busy) return;
    setOpen(false);
    setError(null);
    if (done) {
      setForm(EMPTY);
      setStep(0);
      setDone(false);
    }
  }

  // Per-step validation. The API re-validates everything server-side.
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (form.name.trim().length < 2) return "Nama lengkap minimal 2 karakter.";
      if (!isValidEmail(form.email.trim())) return "Email tidak valid.";
      if (form.whatsapp.replace(/\D/g, "").length < 9)
        return "Nomor WhatsApp tidak valid.";
      return null;
    }
    if (s === 1) {
      if (form.followers.trim() !== "" && Number(form.followers) < 0)
        return "Jumlah followers tidak valid.";
      return null;
    }
    return null; // Step 2 (motivasi) is fully optional.
  }

  function goNext() {
    const ce = validateStep(step);
    if (ce) {
      setError(ce);
      return;
    }
    setError(null);
    setDir(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    // Re-check required identity fields before firing the request.
    const ce = validateStep(0);
    if (ce) {
      setError(ce);
      setDir(-1);
      setStep(0);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          whatsapp: form.whatsapp,
          ig_handle: form.ig_handle,
          tiktok_handle: form.tiktok_handle,
          followers: form.followers,
          motivation: form.motivation,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.error ||
          (res.status === 409
            ? "Email ini sudah terdaftar sebagai afiliator."
            : "Gagal mengirim pendaftaran. Coba lagi.");
        setError(msg);
        setBusy(false);
        toast.error(msg);
        return;
      }
      setBusy(false);
      setDone(true);
      toast.success("Pendaftaran terkirim!");
    } catch {
      const msg = "Gagal terhubung ke server. Cek koneksi & coba lagi.";
      setError(msg);
      setBusy(false);
      toast.error(msg);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7F8]">
      {/* Atmospheric background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1A9E9E]/12 blur-3xl" />
        <div className="absolute bottom-0 -right-24 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl" />
      </div>

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Subtle teal gradient + dotted grid backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#1A9E9E]/[0.07] via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#1A9E9E_1px,transparent_1px)] opacity-[0.06] [background-size:22px_22px]" />

        <div className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1A9E9E]/20 bg-[#1A9E9E]/10 px-3.5 py-1.5 text-xs font-bold text-[#147878]">
              <Megaphone className="h-3.5 w-3.5" />
              Program Afiliator Linguo
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-800 sm:text-5xl">
              Rekomendasikan Linguo.{" "}
              <span className="text-[#1A9E9E]">Dapat Komisi.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Punya audiens yang suka belajar bahasa? Bagikan link referral kamu
              dan dapat komisi hingga 30% dari tiap penjualan yang masuk.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={openModal}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] px-8 text-sm font-bold text-white shadow-lg shadow-[#1A9E9E]/25 transition hover:bg-[#147878] active:scale-[0.99] sm:w-auto"
              >
                Daftar Jadi Afiliator
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={DASHBOARD_URL}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-8 text-sm font-bold text-slate-700 backdrop-blur transition hover:border-[#1A9E9E]/40 hover:text-[#147878] sm:w-auto"
              >
                Masuk ke Dashboard
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. STATS BAR (social proof) ─────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4">
        <motion.div
          {...reveal}
          className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1FB3B3] via-[#1A9E9E] to-[#0F6B6B] p-6 shadow-[0_22px_55px_-22px_rgba(15,107,107,0.6)] sm:p-8"
        >
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center text-white">
                  <Icon className="mx-auto h-6 w-6 text-white/70" />
                  <div className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-white/75">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── 3. CARA KERJA ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pt-16">
        <motion.div {...reveal} className="text-center">
          <SectionHeading
            eyebrow="Cara Kerja"
            title="Mulai dapat komisi dalam 3 langkah"
          />
        </motion.div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {HOW_STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                {...reveal}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-slate-100">
                  {i + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A9E9E]/12 text-[#1A9E9E]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-800">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {s.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 4. TIER SYSTEM ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pt-16">
        <motion.div {...reveal} className="text-center">
          <SectionHeading
            eyebrow="Sistem Tier"
            title="Semakin Aktif, Semakin Besar Komisimu"
            desc="Tier menentukan persentase komisimu di setiap produk. Naik tier, naik komisi."
          />
        </motion.div>

        {/* Tier cards */}
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((t, i) => {
            const meta = TIER_META[t.key];
            const Icon = meta.icon;
            return (
              <motion.div
                key={t.key}
                {...reveal}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
                className={
                  "relative flex flex-col rounded-2xl bg-white p-5 shadow-sm transition " +
                  (meta.highlight
                    ? "border-2 border-[#1A9E9E] shadow-[0_18px_45px_-20px_rgba(20,120,120,0.45)]"
                    : "border border-slate-200/80")
                }
              >
                {meta.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1A9E9E] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    Paling Cuan
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${meta.badge}`}
                  >
                    {t.label}
                  </span>
                </div>
                <div className="mt-4 text-2xl font-extrabold tracking-tight text-slate-800">
                  {tierRange(i)}
                </div>
                <div className="text-xs font-medium text-slate-400">
                  rentang komisi
                </div>
                <ul className="mt-4 space-y-2">
                  {meta.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1A9E9E]" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Full commission table — products × tiers */}
        <motion.div
          {...reveal}
          className="mt-7 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-800">
              Komisi lengkap per produk
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Persentase komisi yang kamu dapat untuk tiap produk di setiap tier.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Produk</th>
                  {TIERS.map((t) => (
                    <th
                      key={t.key}
                      className={
                        "px-4 py-3 text-center font-semibold " +
                        (TIER_META[t.key].highlight
                          ? "bg-[#1A9E9E]/5 text-[#147878]"
                          : "")
                      }
                    >
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => (
                  <tr
                    key={p.key}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-700">
                      {p.label}
                    </td>
                    {p.rates.map((rate, ti) => (
                      <td
                        key={ti}
                        className={
                          "px-4 py-3 text-center tabular-nums " +
                          (TIER_META[TIERS[ti].key].highlight
                            ? "bg-[#1A9E9E]/5 font-bold text-[#147878]"
                            : "font-medium text-slate-600")
                        }
                      >
                        {pct(rate)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── 5. KALKULATOR KOMISI ────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-4 pt-16">
        <motion.div {...reveal} className="text-center">
          <SectionHeading
            eyebrow="Simulasi"
            title="Hitung Potensi Komisimu"
            desc="Pilih produk & tier, lalu lihat perkiraan komisi yang bisa kamu kumpulkan tiap bulan."
          />
        </motion.div>
        <motion.div {...reveal} className="mt-8">
          <KomisiKalkulator />
        </motion.div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-4 pt-16">
        <motion.div {...reveal} className="text-center">
          <SectionHeading eyebrow="FAQ" title="Pertanyaan Umum" />
        </motion.div>
        <motion.div {...reveal} className="mt-8">
          <FaqAccordion items={FAQS} />
        </motion.div>
      </section>

      {/* ── 7. FINAL CTA ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-16">
        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1FB3B3] via-[#1A9E9E] to-[#0F6B6B] px-6 py-12 text-center shadow-[0_22px_55px_-22px_rgba(15,107,107,0.6)] sm:px-10 sm:py-14"
        >
          <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-emerald-300/15 blur-2xl" />
          <div className="relative">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Siap mulai dapat komisi?
            </h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/80">
              Daftar gratis dalam beberapa menit. Tim Linguo akan meninjau &amp;
              menghubungi kamu.
            </p>
            <button
              onClick={openModal}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-[#147878] shadow-lg transition hover:bg-white/90 active:scale-[0.99]"
            >
              Daftar Sekarang
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        <p className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 transition hover:text-slate-600"
          >
            Kembali ke Linguo.id
          </a>
        </p>
      </section>

      {/* ── Wizard modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              key="sheet"
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_80px_-20px_rgba(20,120,120,0.35)] sm:rounded-3xl"
            >
              {/* Close */}
              {!done && (
                <button
                  onClick={closeModal}
                  aria-label="Tutup"
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {done ? (
                /* ── Success ── */
                <div className="px-6 py-10 text-center sm:px-8">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#147878] shadow-lg shadow-[#1A9E9E]/25"
                  >
                    <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <h2 className="mt-5 text-xl font-bold text-slate-800">
                    Pendaftaran terkirim! 🎉
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                    Terima kasih sudah mendaftar jadi Afiliator Linguo. Tim kami
                    akan meninjau pendaftaran kamu dan menghubungi lewat WhatsApp
                    atau email dalam beberapa hari kerja.
                  </p>
                  <a
                    href="/"
                    className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#1A9E9E] text-sm font-semibold text-white transition hover:bg-[#147878]"
                  >
                    Kembali ke Linguo.id
                  </a>
                  <button
                    onClick={closeModal}
                    className="mt-3 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                /* ── Wizard ── */
                <div>
                  {/* Header + stepper */}
                  <div className="border-b border-slate-100 px-6 pb-5 pt-6 sm:px-7">
                    <h2 className="text-base font-bold text-slate-800">
                      Daftar Jadi Afiliator
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Langkah {step + 1} dari {STEPS.length}
                    </p>

                    <div className="mt-4 flex items-center">
                      {STEPS.map((s, i) => {
                        const Icon = s.icon;
                        const state =
                          i < step ? "done" : i === step ? "current" : "todo";
                        return (
                          <div
                            key={s.key}
                            className="flex flex-1 items-center last:flex-none"
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <div
                                className={
                                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors " +
                                  (state === "done"
                                    ? "border-[#1A9E9E] bg-[#1A9E9E] text-white"
                                    : state === "current"
                                    ? "border-[#1A9E9E] bg-[#1A9E9E]/10 text-[#147878]"
                                    : "border-slate-200 bg-white text-slate-300")
                                }
                              >
                                {state === "done" ? (
                                  <Check className="h-4 w-4" strokeWidth={2.5} />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                              </div>
                              <span
                                className={
                                  "text-[10px] font-semibold " +
                                  (state === "todo"
                                    ? "text-slate-300"
                                    : "text-[#147878]")
                                }
                              >
                                {s.label}
                              </span>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className="mx-1.5 -mt-4 h-0.5 flex-1 rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#1A9E9E] transition-all duration-300"
                                  style={{ width: i < step ? "100%" : "0%" }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step body */}
                  <div className="px-6 pb-2 pt-5 sm:px-7">
                    <div className="relative min-h-[232px]">
                      <AnimatePresence mode="wait" custom={dir}>
                        <motion.div
                          key={step}
                          custom={dir}
                          variants={stepVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="space-y-3.5"
                        >
                          {step === 0 && (
                            <>
                              <Field label="Nama lengkap" required>
                                <input
                                  className={inputCls}
                                  placeholder="Nama kamu"
                                  autoFocus
                                  value={form.name}
                                  onChange={(e) => set("name", e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                                />
                              </Field>
                              <Field label="Email" required>
                                <input
                                  type="email"
                                  className={inputCls}
                                  placeholder="email@contoh.com"
                                  value={form.email}
                                  onChange={(e) => set("email", e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                                />
                              </Field>
                              <Field label="Nomor WhatsApp" required>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  className={inputCls}
                                  placeholder="08123456789"
                                  value={form.whatsapp}
                                  onChange={(e) =>
                                    set("whatsapp", e.target.value)
                                  }
                                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                                />
                              </Field>
                            </>
                          )}

                          {step === 1 && (
                            <>
                              <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-500">
                                Bagian ini opsional — boleh dilewati. Tapi info
                                sosmed bantu tim kami kenal audiens kamu.
                              </p>
                              <div className="grid gap-3.5 sm:grid-cols-2">
                                <Field label="Instagram">
                                  <div className="relative">
                                    <Camera className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                      className={inputCls + " pl-10"}
                                      placeholder="username"
                                      value={form.ig_handle}
                                      onChange={(e) =>
                                        set("ig_handle", e.target.value)
                                      }
                                    />
                                  </div>
                                </Field>
                                <Field label="TikTok">
                                  <div className="relative">
                                    <Music2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                      className={inputCls + " pl-10"}
                                      placeholder="username"
                                      value={form.tiktok_handle}
                                      onChange={(e) =>
                                        set("tiktok_handle", e.target.value)
                                      }
                                    />
                                  </div>
                                </Field>
                              </div>
                              <Field label="Perkiraan total followers">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  className={inputCls}
                                  placeholder="Contoh: 5000"
                                  value={form.followers}
                                  onChange={(e) =>
                                    set("followers", e.target.value)
                                  }
                                />
                              </Field>
                            </>
                          )}

                          {step === 2 && (
                            <Field label="Kenapa mau jadi afiliator Linguo?">
                              <textarea
                                rows={5}
                                className={
                                  inputCls.replace("h-12", "min-h-[140px] py-3") +
                                  " resize-y leading-relaxed"
                                }
                                placeholder="Ceritakan sedikit tentang audiens & rencana promosi kamu… (opsional)"
                                value={form.motivation}
                                onChange={(e) =>
                                  set("motivation", e.target.value)
                                }
                              />
                            </Field>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {error && (
                      <div className="mt-1 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Footer nav */}
                  <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 sm:px-7">
                    {step > 0 ? (
                      <button
                        onClick={goBack}
                        disabled={busy}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#1A9E9E]" />
                        Data kamu aman
                      </div>
                    )}

                    <div className="flex-1" />

                    {!isLast ? (
                      <button
                        onClick={goNext}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#147878] active:scale-[0.99]"
                      >
                        Lanjut
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={submit}
                        disabled={busy}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#147878] active:scale-[0.99] disabled:opacity-60"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Mengirim…
                          </>
                        ) : (
                          "Daftar Jadi Afiliator"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <>
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A9E9E]">
        {eyebrow}
      </span>
      <h2 className="mx-auto mt-2 max-w-2xl text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
        {title}
      </h2>
      {desc && (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          {desc}
        </p>
      )}
    </>
  );
}

// ── FAQ accordion (inline, no library) ───────────────────────────────────────
function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className={
              "overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors " +
              (isOpen ? "border-[#1A9E9E]/40" : "border-slate-200/80")
            }
          >
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-slate-800">{item.q}</span>
              <ChevronDown
                className={
                  "h-4 w-4 shrink-0 text-[#1A9E9E] transition-transform duration-300 " +
                  (isOpen ? "rotate-180" : "")
                }
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-500">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
