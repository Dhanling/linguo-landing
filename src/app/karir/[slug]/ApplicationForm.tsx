"use client";

// =============================================================================
// ApplicationForm.tsx — [linguo-patch:karir-apply-wizard-v1]
// Form lamaran loker, sekarang berupa WIZARD POP-UP 3 langkah (bukan inline).
// Tombol "Lamar Sekarang" membuka modal wizard.
//
// Perubahan vs versi lama:
//  - Tampil sebagai modal wizard 3-step (Data Diri / Profil & Lampiran / Pengalaman)
//  - TAMBAH field CV (link Google Drive) — WAJIB. Disimpan ke kolom job_applications.cv_url
//    (butuh migration: ADD COLUMN cv_url text — lihat catatan deploy).
//  - HAPUS field "Portfolio / Karya". Kolom portfolio_url DB dibiarkan (tidak diisi lagi).
//  - LinkedIn jadi OPSIONAL (tetap divalidasi formatnya kalau diisi).
// =============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import {
  Loader2,
  CheckCircle,
  Briefcase,
  GraduationCap,
  FileText,
  FileUp,
  X,
} from "lucide-react";

type Props = {
  openingId: string;
  openingTitle: string;
};

const TEAL = "#1A9E9E";
const TOTAL = 3;
const STEP_TITLES = ["Data Diri", "Profil & Lampiran", "Pengalaman"];

const LINKEDIN_PATTERN =
  /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-%.]+\/?(\?.*)?$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLinkedIn(url: string): boolean {
  return LINKEDIN_PATTERN.test(url.trim());
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return "https://" + trimmed;
}

// CV wajib dari Google Drive / Google Docs (link share file atau folder).
function isGoogleDriveUrl(url: string): boolean {
  try {
    const u = new URL(normalizeUrl(url));
    const h = u.hostname.toLowerCase();
    return h === "drive.google.com" || h === "docs.google.com";
  } catch {
    return false;
  }
}

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  cv_url: "",
  linkedin_url: "",
  education: "",
  experience_summary: "",
  cover_letter: "",
};

export default function ApplicationForm({ openingId, openingTitle }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const resetAll = () => {
    setStep(1);
    setSubmitting(false);
    setDone(false);
    setError(null);
    setForm({ ...EMPTY });
  };

  const closeModal = () => {
    setOpen(false);
    setTimeout(resetAll, 200);
  };

  // ── Validasi per langkah ──
  const stepError = (s: number): string => {
    if (s === 1) {
      if (!form.name.trim()) return "Nama lengkap wajib diisi.";
      if (!EMAIL_PATTERN.test(form.email.trim())) return "Email tidak valid.";
      if (!form.phone.trim()) return "Nomor WhatsApp wajib diisi.";
    }
    if (s === 2) {
      if (!form.cv_url.trim()) return "Link CV (Google Drive) wajib diisi.";
      if (!isGoogleDriveUrl(form.cv_url))
        return "Link CV harus dari Google Drive atau Google Docs.";
      if (form.linkedin_url.trim() && !validateLinkedIn(form.linkedin_url))
        return "Format LinkedIn salah. Contoh: linkedin.com/in/nama-lo";
    }
    if (s === 3) {
      if (form.experience_summary.trim().length < 20)
        return "Ceritain pengalaman lo minimal 20 karakter.";
    }
    return "";
  };

  const next = () => {
    const e = stepError(step);
    if (e) {
      setError(e);
      return;
    }
    setError(null);
    setStep((s) => Math.min(TOTAL, s + 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    // Validasi semua langkah sebelum kirim; lompat ke langkah pertama yg error
    for (let s = 1; s <= TOTAL; s++) {
      const e = stepError(s);
      if (e) {
        setError(e);
        setStep(s);
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        opening_id: openingId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        cv_url: normalizeUrl(form.cv_url),
        linkedin_url: form.linkedin_url.trim()
          ? normalizeUrl(form.linkedin_url)
          : null,
        education: form.education.trim() || null,
        experience_summary: form.experience_summary.trim(),
        cover_letter: form.cover_letter.trim() || null,
        status: "screening",
      };

      const { error: insertError } = await supabase
        .from("job_applications")
        .insert(payload);

      if (insertError) {
        throw new Error("Submit lamaran gagal: " + insertError.message);
      }

      setDone(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Style helpers ──
  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-[#1A9E9E] focus:ring-2 focus:ring-teal-100 outline-none transition-colors";
  const labelCls =
    "text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5";
  const reqStar = <span className="text-red-500">*</span>;
  const optTag = <span className="text-gray-400 font-normal">(opsional)</span>;

  return (
    <>
      {/* Tombol pemicu — dirender di card "Lamar" pada halaman /karir/[slug] */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1A9E9E] hover:bg-[#178585] text-white font-semibold px-6 py-3 rounded-xl transition-colors active:scale-95"
      >
        Lamar Sekarang →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
          onClick={closeModal}
        >
          <div
            className="w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col bg-white w-full rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh]">
              {done ? (
                // ── Sukses ──
                <div className="text-center px-6 py-10">
                  <CheckCircle className="h-14 w-14 mx-auto text-green-500 mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Lamaran Terkirim!
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    Terima kasih sudah melamar di posisi{" "}
                    <strong>{openingTitle}</strong>. Tim HR Linguo bakal
                    menghubungi kamu via WhatsApp atau email kalau profil cocok.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
                      style={{ background: TEAL }}
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/karir")}
                      className="text-sm text-[#1A9E9E] hover:underline font-medium"
                    >
                      ← Lihat lowongan lain
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className="text-[11px] font-bold tracking-wide"
                          style={{ color: TEAL }}
                        >
                          LAMARAN · LANGKAH {step}/{TOTAL}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                          {STEP_TITLES[step - 1]}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {openingTitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        aria-label="Tutup"
                        className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      {Array.from({ length: TOTAL }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{ background: i < step ? TEAL : "#f1f1f1" }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-5 sm:px-6 py-5 overflow-y-auto">
                    {step === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>
                            Nama Lengkap {reqStar}
                          </label>
                          <input
                            className={inputCls}
                            placeholder="Nama lengkap"
                            value={form.name}
                            onChange={(e) => set("name", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Email {reqStar}</label>
                          <input
                            className={inputCls}
                            type="email"
                            placeholder="nama@email.com"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>
                            Nomor WhatsApp {reqStar}
                          </label>
                          <input
                            className={inputCls}
                            type="tel"
                            inputMode="numeric"
                            placeholder="081234567890"
                            value={form.phone}
                            onChange={(e) => set("phone", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>
                            <FileUp className="h-3.5 w-3.5 text-[#1A9E9E]" />
                            Lampirkan CV (Google Drive) {reqStar}
                          </label>
                          <input
                            className={inputCls}
                            type="text"
                            inputMode="url"
                            placeholder="drive.google.com/file/d/..."
                            value={form.cv_url}
                            onChange={(e) => set("cv_url", e.target.value)}
                          />
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                            Upload CV kamu ke Google Drive, terus tempel
                            link-nya di sini. Set akses ke{" "}
                            <strong>Siapa saja yang punya link</strong> — jangan
                            dikunci, biar tim HR bisa buka.
                          </p>
                        </div>
                        <div>
                          <label className={labelCls}>
                            <Briefcase className="h-3.5 w-3.5 text-[#0a66c2]" />
                            LinkedIn Profile {optTag}
                          </label>
                          <input
                            className={inputCls}
                            type="text"
                            placeholder="linkedin.com/in/nama-lo"
                            value={form.linkedin_url}
                            onChange={(e) =>
                              set("linkedin_url", e.target.value)
                            }
                          />
                          <p className="text-[10px] text-gray-500 mt-1">
                            Kalau diisi, pastikan profile public biar tim HR
                            bisa review.
                          </p>
                        </div>
                        <div>
                          <label className={labelCls}>
                            <GraduationCap className="h-3.5 w-3.5 text-gray-500" />
                            Pendidikan Terakhir {optTag}
                          </label>
                          <input
                            className={inputCls}
                            type="text"
                            placeholder="Contoh: S1 Pendidikan Bahasa Inggris UPI 2022"
                            value={form.education}
                            onChange={(e) => set("education", e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            Pengalaman Relevan {reqStar}
                          </label>
                          <textarea
                            rows={5}
                            className={inputCls + " resize-none"}
                            placeholder="Ceritain singkat pengalaman lo terkait posisi ini — kerja sebelumnya, project, sertifikat, dll. Minimal 20 karakter."
                            value={form.experience_summary}
                            onChange={(e) =>
                              set("experience_summary", e.target.value)
                            }
                          />
                          <p className="text-[10px] text-gray-400 mt-1">
                            {form.experience_summary.trim().length} / 20 karakter
                            minimum
                          </p>
                        </div>
                        <div>
                          <label className={labelCls}>
                            Cover Letter / Pesan Singkat {optTag}
                          </label>
                          <textarea
                            rows={3}
                            className={inputCls + " resize-none"}
                            placeholder="Kenapa lo cocok untuk posisi ini?"
                            value={form.cover_letter}
                            onChange={(e) => set("cover_letter", e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-5 sm:px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
                    {error && (
                      <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={back}
                          disabled={submitting}
                          className="rounded-xl px-5 py-3 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                        >
                          Kembali
                        </button>
                      )}
                      <div className="flex-1" />
                      {step < TOTAL ? (
                        <button
                          type="button"
                          onClick={next}
                          className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity active:scale-95"
                          style={{ background: TEAL }}
                        >
                          Lanjut →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={submit}
                          disabled={submitting}
                          className="rounded-xl px-6 py-3 text-sm font-bold text-white transition-opacity active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                          style={{ background: TEAL }}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Mengirim…
                            </>
                          ) : (
                            "Kirim Lamaran"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
