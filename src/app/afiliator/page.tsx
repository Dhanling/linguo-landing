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
// ============================================================================

import { useState, type ReactNode } from "react";
import {
  Wallet,
  Megaphone,
  Sparkles,
  Link2,
  Check,
  Loader2,
  Camera,
  Music2,
} from "lucide-react";

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

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function AfiliatorSignupPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  // Light client-side guard — the API re-validates everything.
  function clientError(): string | null {
    if (form.name.trim().length < 2) return "Nama lengkap wajib diisi.";
    if (!isValidEmail(form.email.trim())) return "Email tidak valid.";
    if (form.whatsapp.replace(/[^\d]/g, "").length < 9)
      return "Nomor WhatsApp tidak valid.";
    return null;
  }

  async function submit() {
    const ce = clientError();
    if (ce) {
      setError(ce);
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
        setError(json?.error || "Gagal mengirim pendaftaran. Coba lagi.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Gagal terhubung ke server. Cek koneksi & coba lagi.");
      setBusy(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7F8] px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 text-center shadow-[0_12px_48px_-16px_rgba(20,120,120,0.22)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A9E9E] to-[#147878] shadow-lg shadow-[#1A9E9E]/25">
            <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-800">
            Pendaftaran terkirim! 🎉
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Terima kasih sudah mendaftar jadi Afiliator Linguo. Tim kami akan
            meninjau pendaftaran kamu dan menghubungi lewat WhatsApp atau email
            dalam beberapa hari kerja.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-[#1A9E9E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#147878]"
          >
            Kembali ke Linguo.id
          </a>
        </div>
      </div>
    );
  }

  const inputCls =
    "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1A9E9E] focus:bg-white focus:ring-2 focus:ring-[#1A9E9E]/20";

  // ── Signup form ──────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F7F8]">
      {/* Atmospheric background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1A9E9E]/12 blur-3xl" />
        <div className="absolute bottom-0 -right-24 h-72 w-72 rounded-full bg-amber-300/12 blur-3xl" />
      </div>

      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1A9E9E]/20 bg-[#1A9E9E]/10 px-3 py-1 text-xs font-bold text-[#147878]">
            <Megaphone className="h-3.5 w-3.5" />
            Program Afiliator Linguo
          </span>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-slate-800 sm:text-3xl">
            Bagikan Linguo, Dapat Komisi
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Punya audiens yang suka belajar bahasa? Gabung jadi afiliator —
            sebarkan link referral kamu, dapat komisi dari tiap penjualan.
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
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
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="mt-7 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-base font-bold text-slate-800">
            Formulir Pendaftaran
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Isi data di bawah. Tim Linguo akan meninjau & menghubungi kamu.
          </p>

          <div className="mt-5 space-y-3.5">
            <Field label="Nama lengkap" required>
              <input
                className={inputCls}
                placeholder="Nama kamu"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            <Field label="Email" required>
              <input
                type="email"
                className={inputCls}
                placeholder="email@contoh.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>

            <Field label="Nomor WhatsApp" required>
              <input
                type="tel"
                inputMode="numeric"
                className={inputCls}
                placeholder="08123456789"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Instagram (opsional)">
                <div className="relative">
                  <Camera className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inputCls + " pl-10"}
                    placeholder="username"
                    value={form.ig_handle}
                    onChange={(e) => set("ig_handle", e.target.value)}
                  />
                </div>
              </Field>
              <Field label="TikTok (opsional)">
                <div className="relative">
                  <Music2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className={inputCls + " pl-10"}
                    placeholder="username"
                    value={form.tiktok_handle}
                    onChange={(e) => set("tiktok_handle", e.target.value)}
                  />
                </div>
              </Field>
            </div>

            <Field label="Perkiraan total followers (opsional)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                className={inputCls}
                placeholder="Contoh: 5000"
                value={form.followers}
                onChange={(e) => set("followers", e.target.value)}
              />
            </Field>

            <Field label="Kenapa mau jadi afiliator Linguo? (opsional)">
              <textarea
                rows={3}
                className={
                  inputCls.replace("h-12", "min-h-[88px] py-3") + " resize-y"
                }
                placeholder="Ceritakan sedikit tentang audiens & rencana promosi kamu…"
                value={form.motivation}
                onChange={(e) => set("motivation", e.target.value)}
              />
            </Field>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] text-sm font-bold text-white shadow-sm transition hover:bg-[#147878] active:scale-[0.99] disabled:opacity-60"
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

          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
            Sudah jadi afiliator?{" "}
            <a
              href="/akun/afiliator"
              className="font-semibold text-[#147878] hover:underline"
            >
              Masuk ke dashboard
            </a>
          </p>
        </div>

        <p className="mt-6 text-center">
          <a
            href="/"
            className="text-xs text-slate-400 transition hover:text-slate-600"
          >
            Kembali ke Linguo.id
          </a>
        </p>
      </div>
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
