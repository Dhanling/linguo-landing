// src/components/RegisterRegulerModal.tsx
// Modal pendaftaran Kelas Reguler (guest checkout).
// Flow: isi Nama/WhatsApp/Email -> POST /api/create-invoice (productKey "reguler-a1")
//       -> redirect ke invoice_url Xendit.
// Self-contained: gak butuh helper dari page. Reuse infra create-invoice + leads + webhook.
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, MessageCircle, Calendar, Clock } from "lucide-react";

const WA_NUMBER = "6282116859493";
const TEAL = "#1A9E9E";

// Minimal shape — cukup field yang dipakai modal (sinkron dgn Batch di page).
export interface RegulerBatchLite {
  id: string;
  batch_code: string;
  language: string;
  level: string;
  session_day: string | null;
  session_start_time: string | null;
  session_end_time: string | null;
  total_sessions: number;
  session_duration_min: number;
  start_date: string;
  price_regular: number;
  current_price_per_student: number | null;
}

interface Props {
  batch: RegulerBatchLite | null;
  onClose: () => void;
}

function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
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

export default function RegisterRegulerModal({ batch, onClose }: Props) {
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form tiap kali batch berubah (modal dibuka untuk batch baru).
  useEffect(() => {
    if (batch) {
      setName("");
      setWa("");
      setEmail("");
      setError(null);
      setSubmitting(false);
    }
  }, [batch]);

  // Tutup dgn ESC
  useEffect(() => {
    if (!batch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [batch, submitting, onClose]);

  if (!batch) return null;

  const price = batch.current_price_per_student || batch.price_regular;
  const waMsg = encodeURIComponent(
    `Halo Linguo! Saya mau tanya soal Kelas Reguler ${batch.language} ${batch.level} (${batch.batch_code}).`
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
          productKey: "reguler-a1",
          name: name.trim(),
          email: email.trim(),
          wa_number: e164,
          language: `${batch!.language} ${batch!.level} (${batch!.batch_code})`,
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
    } catch (e) {
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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 text-white" style={{ backgroundColor: TEAL }}>
          <button
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">
            Daftar Kelas Reguler
          </div>
          <div className="text-xl font-bold mt-0.5">
            {batch.language} {batch.level}
          </div>
          <div className="text-xs opacity-90 mt-0.5">Batch {batch.batch_code}</div>
        </div>

        {/* Batch summary */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-start gap-1.5">
              <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>
                {batch.session_day}
                {batch.session_start_time ? `, ${batch.session_start_time.slice(0, 5)}` : ""}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" />
              <span>
                {batch.total_sessions} sesi × {batch.session_duration_min} mnt
              </span>
            </div>
            <div className="col-span-2 flex items-start gap-1.5">
              <span className="text-[11px]">📆</span>
              <span>Mulai {formatDate(batch.start_date)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-slate-500">Biaya</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatIDR(price)}{" "}
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
              style={{ outlineColor: TEAL }}
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
            style={{ backgroundColor: TEAL }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>Lanjut ke Pembayaran · {formatIDR(price)}</>
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
