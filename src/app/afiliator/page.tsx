// linguo-patch:afiliator-wizard-modal-v1 — Redesign form jadi wizard 3-step di modal (refined, flat icon, teal #1A9E9E, sonner)
"use client";

// ============================================================================
// /afiliator — Public Affiliate Signup
// Affiliate Program — Phase 3A
// ----------------------------------------------------------------------------
// Public self-signup form. Phase 1–2 were invite-only; this page opens the
// program to the public. Submits to POST /api/affiliate/signup which inserts
// an `affiliates` row with status='pending_review' for the team to review.
//
// Not an authed page — visitors are typically logged out. user_id stays NULL;
// /api/affiliate/me later matches the person by email when they log in.
//
// REDESIGN (afiliator-wizard-modal-v1): hero + benefits stay on the page; the
// form is now a 3-step wizard inside a modal (Identitas → Sosial Media →
// Motivasi). The /api/affiliate/signup contract is UNCHANGED — same 7 fields,
// none of the server-set fields (status/tier/source/user_id/referral_code) are
// ever sent from the client.
// ============================================================================

import { useState, useEffect, type ReactNode } from "react";
import {
  Wallet,
  Megaphone,
  Sparkles,
  Link2,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import KomisiKalkulator from "@/components/afiliator/KomisiKalkulator";

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

const BENEFITS: { icon: typeof Wallet; title: string; desc: string }[] = [
  {
    icon: Wallet,
    title: "Komisi hingga 30%",
    desc: "Dapat komisi dari tiap pembelian yang masuk lewat link referral kamu.",
  },
  {
    icon: Link2,
    title: "Satu link, banyak tujuan",
    desc: "Link referral kamu bisa diarahkan ke halaman mana pun di linguo.id.",
  },
  {
    icon: Sparkles,
    title: "Materi promosi siap pakai",
    desc: "Caption & pesan promosi tinggal salin-tempel — nggak usah mikir copy.",
  },
];

const STEPS: { key: string; label: string; icon: typeof User }[] = [
  { key: "identitas", label: "Identitas", icon: User },
  { key: "sosmed", label: "Sosial Media", icon: Share2 },
  { key: "motivasi", label: "Motivasi", icon: MessageSquare },
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const inputCls =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
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

      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1A9E9E]/20 bg-[#1A9E9E]/10 px-3 py-1 text-xs font-bold text-[#147878]">
            <Megaphone className="h-3.5 w-3.5" />
            Program Afiliator Linguo
          </span>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-800 sm:text-3xl">
            Bagikan Linguo, Dapat Komisi
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-500">
            Punya audiens yang suka belajar bahasa? Gabung jadi afiliator —
            sebarkan link referral kamu, dapat komisi dari tiap penjualan.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + i * 0.08 }}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A9E9E]/12 text-[#1A9E9E]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-2.5 text-sm font-bold text-slate-800">
                  {b.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {b.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Kalkulator Komisi */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          className="mt-7"
        >
          <KomisiKalkulator />
        </motion.div>

        {/* CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.34 }}
          className="mt-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-sm sm:p-8"
        >
          <h2 className="text-base font-bold text-slate-800 sm:text-lg">
            Siap mulai? Daftar dalam 3 langkah singkat.
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
            Cukup isi data dasar — tim Linguo akan meninjau & menghubungi kamu.
          </p>
          <button
            onClick={openModal}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] text-sm font-bold text-white shadow-sm shadow-[#1A9E9E]/20 transition hover:bg-[#147878] active:scale-[0.99] sm:w-auto sm:px-8"
          >
            Daftar Jadi Afiliator
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            Sudah jadi afiliator?{" "}
            <a
              href="/akun/afiliator"
              className="font-semibold text-[#147878] hover:underline"
            >
              Masuk ke dashboard
            </a>
          </p>
        </motion.div>

        <p className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 transition hover:text-slate-600"
          >
            Kembali ke Linguo.id
          </a>
        </p>
      </div>

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
