// src/components/RegisterEtpModal.tsx
// Modal pendaftaran ETP (TOEFL & IELTS Preparation) — guest checkout.
// Flow: isi Nama/WhatsApp/Email -> POST /api/create-invoice (productKey "ielts-toefl"
//       + etp_batch_id supaya harga diambil server-side dari baris etp_batches)
//       -> redirect ke invoice_url Xendit.
// Kembarannya RegisterRegulerModal; sengaja komponen terpisah karena ETP tak punya
// add-on e-book/recording dan warnanya ikut program (teal/biru).
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, MessageCircle, Calendar, Clock, CalendarDays } from "lucide-react";

const WA_NUMBER = "6282116859493";

// Produk registrasi yang dikenali xendit-webhook (VALID_CLASS_PRODUCTS) — tanpa
// ini lead lunas tidak pernah jadi baris `registrations` alias hilang dari Overview.
const ETP_PROGRAM = "English Test Preparation (IELTS/TOEFL)";

// Minimal shape — cukup field yang dipakai modal (sinkron dgn EtpProgram di page).
export interface EtpProgramLite {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  days: string;
  time: string;
  startDate: string;
  sessions: number;
  sessionMin: number;
  price: number;
  color: string;
}

interface Props {
  program: EtpProgramLite | null;
  onClose: () => void;
}

function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

// Normalisasi nomor Indonesia -> E.164 (+62...). create-invoice pakai apa adanya kalau diawali "+".
function toWaE164(input: string): string {
  let d = (input || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  d = d.replace(/\D/g, "");
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("62")) return `+${d}`;
  return `+62${d}`;
}

function isValidWa(e164: string): boolean {
  return /^\+62\d{8,13}$/.test(e164);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterEtpModal({ program, onClose }: Props) {
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form tiap kali program berubah (modal dibuka untuk batch baru).
  useEffect(() => {
    if (program) {
      setName("");
      setWa("");
      setEmail("");
      setError(null);
      setSubmitting(false);
    }
  }, [program]);

  // Tutup dgn ESC
  useEffect(() => {
    if (!program) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [program, submitting, onClose]);

  if (!program) return null;

  const isTeal = program.color === "teal";
  const accent = isTeal ? "#1A9E9E" : "#2563eb";
  const waMsg = encodeURIComponent(
    `Halo Linguo! Saya mau tanya soal program ${program.title} (${program.subtitle}).`
  );
  const waHelpHref = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError("Nama wajib diisi.");
    const e164 = toWaE164(wa);
    if (!isValidWa(e164)) return setError("Nomor WhatsApp tidak valid. Contoh: 0812xxxxxxx");
    if (!isValidEmail(email.trim())) return setError("Email tidak valid.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey: "ielts-toefl",
          // Harga & deskripsi final ditentukan server dari baris etp_batches ini
          // (klien tidak pernah mengirim nominal — anti-tamper).
          etp_batch_id: program!.id,
          program: ETP_PROGRAM,
          level: program!.badge,
          language: "English",
          name: name.trim(),
          email: email.trim(),
          wa_number: e164,
          sessions: program!.sessions,
          duration: program!.sessionMin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoice_url) {
        setError(data.error || "Gagal membuat invoice. Coba lagi atau hubungi kami via WhatsApp.");
        setSubmitting(false);
        return;
      }
      // Redirect ke checkout Xendit
      window.location.href = data.invoice_url;
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onClose()}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 text-white" style={{ backgroundColor: accent }}>
          <button
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">
            Daftar English Test Preparation
          </div>
          <div className="text-xl font-bold mt-0.5">{program.title}</div>
          <div className="text-xs opacity-90 mt-0.5">{program.subtitle}</div>
        </div>

        {/* Ringkasan batch */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-start gap-1.5">
              <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>
                {program.days}, {program.time}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>
                {program.sessions} sesi × {program.sessionMin} mnt
              </span>
            </div>
            <div className="col-span-2 flex items-start gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>Mulai {program.startDate}</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-500">Biaya</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatIDR(program.price)}{" "}
              <span className="text-[10px] font-normal text-slate-400">/batch</span>
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pb-4 pt-2 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              placeholder="Nama kamu"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nomor WhatsApp</label>
            <input
              type="tel"
              inputMode="numeric"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              disabled={submitting}
              placeholder="0812xxxxxxx"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              placeholder="email@kamu.com"
              className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Invoice & info kelas dikirim ke email ini.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>Lanjut ke Pembayaran · {formatIDR(program.price)}</>
            )}
          </button>

          <a
            href={waHelpHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Masih ragu? Tanya dulu via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
