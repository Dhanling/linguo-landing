"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Gift,
  Percent,
  Music,
  Video,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Users,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────
// inline X icon (lucide-react dropped Twitter export)
// ────────────────────────────────────────────────────────────────────

function XLogo({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────────
// constants
// ────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "ig_reels", label: "IG Reels", icon: Video },
  { id: "ig_story", label: "IG Story", subLabel: "min. 5 story", icon: Camera },
  { id: "ig_feeds", label: "IG Feeds", icon: ImageIcon },
  { id: "twitter", label: "X (Twitter)", subLabel: "berupa Thread", icon: XLogo },
  { id: "tiktok", label: "TikTok", icon: Music },
] as const;

// ────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────

function normalizeWaInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("08")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

function isValidIndoWa(normalized: string): boolean {
  return /^628\d{8,12}$/.test(normalized);
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
    hasError
      ? "border-rose-300 focus:border-rose-500"
      : "border-slate-200 focus:border-[#1A9E9E]"
  }`;

// ────────────────────────────────────────────────────────────────────
// main wrapper (Suspense for useSearchParams in Next 16)
// ────────────────────────────────────────────────────────────────────

export default function LingfluencerPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#1A9E9E]" size={32} />
        </div>
      }
    >
      <LingfluencerPage />
    </Suspense>
  );
}

// ────────────────────────────────────────────────────────────────────
// page
// ────────────────────────────────────────────────────────────────────

function LingfluencerPage() {
  const searchParams = useSearchParams();
  const picFromUrl = searchParams.get("pic") || "";

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    gmail: "",
    content_platforms: [] as string[],
    socmed_username: "",
    pic_name: picFromUrl,
    socmed_review_consent: false,
    gbusiness_review_consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const togglePlatform = (id: string) => {
    setForm((p) => ({
      ...p,
      content_platforms: p.content_platforms.includes(id)
        ? p.content_platforms.filter((x) => x !== id)
        : [...p.content_platforms, id],
    }));
    if (errors.content_platforms) {
      setErrors((e) => ({ ...e, content_platforms: "" }));
    }
  };

  const updateField = (key: keyof typeof form, value: any) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.name.trim()) e.name = "Nama wajib diisi";

    const normalizedWa = normalizeWaInput(form.whatsapp);
    if (!form.whatsapp.trim()) e.whatsapp = "Nomor WhatsApp wajib diisi";
    else if (!isValidIndoWa(normalizedWa))
      e.whatsapp = "Format: 628xxxxxxxxxx (10-14 digit setelah 628)";

    const gmail = form.gmail.trim().toLowerCase();
    if (!gmail) e.gmail = "Gmail wajib diisi";
    else if (!gmail.endsWith("@gmail.com"))
      e.gmail = "Wajib pakai alamat @gmail.com";

    if (form.content_platforms.length === 0)
      e.content_platforms = "Pilih minimal 1 platform";

    if (!form.socmed_username.trim())
      e.socmed_username = "Username sosmed wajib diisi";

    if (!form.pic_name.trim()) e.pic_name = "Nama PIC wajib diisi";

    if (!form.socmed_review_consent)
      e.socmed_review_consent = "Wajib disetujui";
    if (!form.gbusiness_review_consent)
      e.gbusiness_review_consent = "Wajib disetujui";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!validate()) {
      const firstError = document.querySelector("[data-error='true']");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/lingfluencer-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          whatsapp: normalizeWaInput(form.whatsapp),
          gmail: form.gmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Gagal submit, coba lagi sebentar.");
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "Network error — coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <SuccessView name={form.name} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A9E9E]/5 via-white to-white pb-24">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto px-4 pt-12 pb-8 text-center"
      >
        <div className="inline-flex items-center gap-2 bg-[#1A9E9E]/10 text-[#1A9E9E] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
          <Sparkles size={14} />
          Lingfluencer Program
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
          Belajar Bahasa{" "}
          <span className="bg-[#1A9E9E]/20 px-2 rounded">Gratis</span>,
          <br />
          <span className="text-[#1A9E9E]">Komisi 10%</span> Tiap Pembelian
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Join program kolaborasi Linguo — dapet akses paket e-learning 10+
          bahasa & komunitas eksklusif. Sebagai feedback, kamu share pengalaman
          belajar via konten sosmed.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 text-left"
          >
            <Gift className="text-[#1A9E9E] mb-2" size={24} />
            <div className="font-bold text-slate-900 text-sm">
              Paket E-learning FREE
            </div>
            <div className="text-xs text-slate-500 mt-1">
              10+ bahasa + komunitas
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 text-left"
          >
            <Percent className="text-[#1A9E9E] mb-2" size={24} />
            <div className="font-bold text-slate-900 text-sm">Komisi 10%</div>
            <div className="text-xs text-slate-500 mt-1">
              Tiap pembelian via kode kamu
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Form */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-2xl mx-auto px-4"
      >
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          {/* Nama */}
          <Field label="Nama Lengkap" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={inputClass(!!errors.name)}
              placeholder="Misal: Nadia Permata"
              data-error={!!errors.name}
            />
          </Field>

          {/* Gmail (unified email — buat kontak + akses e-learning) */}
          <Field
            label="Gmail"
            required
            error={errors.gmail}
            hint="Wajib @gmail.com — dipakai buat kontak & akses paket e-learning Linguo"
          >
            <input
              type="email"
              value={form.gmail}
              onChange={(e) => updateField("gmail", e.target.value)}
              className={inputClass(!!errors.gmail)}
              placeholder="nadia.belajar@gmail.com"
              data-error={!!errors.gmail}
            />
          </Field>

          {/* WhatsApp */}
          <Field
            label="No. WhatsApp"
            required
            error={errors.whatsapp}
            hint="Format akhir: 628xxxxxxxxxx — boleh tulis 08xxx, otomatis di-convert"
          >
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              className={inputClass(!!errors.whatsapp)}
              placeholder="081234567890"
              data-error={!!errors.whatsapp}
            />
            {form.whatsapp && !errors.whatsapp && (
              <p className="text-xs text-slate-400 mt-1">
                Tersimpan sebagai:{" "}
                <span className="font-mono text-slate-700">
                  {normalizeWaInput(form.whatsapp) || "—"}
                </span>
              </p>
            )}
          </Field>

          {/* Platforms */}
          <Field
            label="Konten review akan dipost di mana?"
            required
            error={errors.content_platforms}
            hint="Pilih satu atau lebih platform"
          >
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              data-error={!!errors.content_platforms}
            >
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const checked = form.content_platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm transition-colors text-left ${
                      checked
                        ? "border-[#1A9E9E] bg-[#1A9E9E]/5 text-slate-900"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={checked ? "text-[#1A9E9E]" : "text-slate-400"}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-semibold ${checked ? "text-[#1A9E9E]" : ""}`}
                      >
                        {p.label}
                      </div>
                      {"subLabel" in p && p.subLabel && (
                        <div className="text-xs text-slate-500">
                          {p.subLabel}
                        </div>
                      )}
                    </div>
                    {checked && (
                      <CheckCircle2
                        size={18}
                        className="text-[#1A9E9E] flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* SocMed username */}
          <Field
            label="Username sosmed untuk posting konten"
            required
            error={errors.socmed_username}
            hint="Tanpa @. Kalau pake beberapa platform dengan handle berbeda, pisahkan dengan koma"
          >
            <input
              type="text"
              value={form.socmed_username}
              onChange={(e) => updateField("socmed_username", e.target.value)}
              className={inputClass(!!errors.socmed_username)}
              placeholder="nadia.belajarbahasa"
              data-error={!!errors.socmed_username}
            />
          </Field>

          {/* PIC */}
          <Field
            label="Nama PIC yang menghubungi kamu"
            required
            error={errors.pic_name}
            hint="Nama tim Linguo yang outreach (misal: Intan)"
          >
            <div className="relative">
              <Users
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={form.pic_name}
                onChange={(e) => updateField("pic_name", e.target.value)}
                className={`${inputClass(!!errors.pic_name)} pl-10`}
                placeholder="Intan"
                data-error={!!errors.pic_name}
              />
            </div>
          </Field>

          {/* Consents */}
          <div className="border-t border-slate-200 pt-6 space-y-3">
            <p className="text-sm font-bold text-slate-900 mb-3">
              Komitmen Kolaborasi <span className="text-rose-500">*</span>
            </p>
            <ConsentBox
              checked={form.socmed_review_consent}
              onToggle={() =>
                updateField(
                  "socmed_review_consent",
                  !form.socmed_review_consent
                )
              }
              error={errors.socmed_review_consent}
              label="Saya bersedia memberikan honest review di sosmed maksimal 14 hari setelah e-learning dikirim"
            />
            <ConsentBox
              checked={form.gbusiness_review_consent}
              onToggle={() =>
                updateField(
                  "gbusiness_review_consent",
                  !form.gbusiness_review_consent
                )
              }
              error={errors.gbusiness_review_consent}
              label="Saya bersedia memberikan honest review di Google Business Linguo maksimal 14 hari setelah e-learning dikirim"
            />
          </div>

          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex items-start gap-2"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1A9E9E] hover:bg-[#157d7d] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Daftar Lingfluencer
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            Setelah submit, tim Linguo akan WhatsApp kamu dalam 1-7 hari
            untuk konfirmasi & kirim paket e-learning + kode affiliate kamu.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// reusable Field
// ────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// ConsentBox
// ────────────────────────────────────────────────────────────────────

function ConsentBox({
  checked,
  onToggle,
  error,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  error?: string;
  label: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        data-error={!!error}
        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
          checked
            ? "border-[#1A9E9E] bg-[#1A9E9E]/5"
            : error
            ? "border-rose-200 hover:border-rose-300"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div
          className={`flex-shrink-0 w-5 h-5 rounded mt-0.5 border-2 flex items-center justify-center transition-colors ${
            checked
              ? "bg-[#1A9E9E] border-[#1A9E9E]"
              : "border-slate-300 bg-white"
          }`}
        >
          {checked && <CheckCircle2 size={14} className="text-white" />}
        </div>
        <span
          className={`text-sm leading-relaxed ${
            checked ? "text-slate-900 font-medium" : "text-slate-700"
          }`}
        >
          {label}
        </span>
      </button>
      {error && (
        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 px-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// SuccessView
// ────────────────────────────────────────────────────────────────────

function SuccessView({ name }: { name: string }) {
  const firstName = name.trim().split(" ")[0] || "kamu";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-b from-[#1A9E9E]/5 via-white to-white flex items-center justify-center px-4 py-12"
    >
      <div className="max-w-md w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-[#1A9E9E] rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-[#1A9E9E]/30"
        >
          <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
        </motion.div>

        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Yay, kamu udah daftar! 🎉
          </h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Hi <span className="font-semibold text-slate-900">{firstName}</span>
            , makasih udah join Lingfluencer. Tim Linguo akan WhatsApp kamu
            dalam <span className="font-semibold">1-7 hari</span> untuk
            konfirmasi kolaborasi, kirim paket e-learning, dan kasih kode
            affiliate kamu.
          </p>

          <div className="bg-[#1A9E9E]/5 border border-[#1A9E9E]/20 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#1A9E9E]" />
              <p className="text-xs font-bold text-[#1A9E9E] uppercase tracking-wider">
                Next Step
              </p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Pastikan WhatsApp kamu aktif. Kalau dalam 7 hari belum ada
              kontak dari tim Linguo, kamu bisa follow up ke{" "}
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1A9E9E] font-semibold hover:underline"
              >
                CS Linguo
              </a>
              .
            </p>
          </div>

          <a
            href="https://linguo.id"
            className="inline-flex items-center gap-2 text-[#1A9E9E] font-semibold hover:underline"
          >
            Kembali ke Linguo.id
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
