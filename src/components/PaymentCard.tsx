"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Bank rekening Linguo — edit di sini kalau ganti
const BANK_NAME = "BCA";
const ACCOUNT_NUMBER = "3370687641";
const ACCOUNT_NAME = "Lisana Rachmawati";
const WA_ADMIN = "6282116859493";

// Fallback pricing jika registration.total_amount = 0 di DB
function calculateDefaultAmount(product: string, level: string): number {
  if (product === "Kelas Private") return 720000; // 8 sesi × 90k
  if (product === "Kelas Reguler") return 150000; // per 2 bulan
  if (product === "IELTS/TOEFL Prep") return 300000;
  if (product === "Kelas Kids") {
    const lvl = (level || "").toLowerCase();
    if (lvl.includes("young")) return 680000; // 8 × 85k
    return 600000; // little learner: 8 × 75k
  }
  return 720000;
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

type Props = {
  registration: {
    id: string;
    product: string;
    language: string;
    level: string;
    total_amount: number;
    payment_status: string;
    payment_proof_url?: string | null;
    payment_proof_uploaded_at?: string | null;
    payment_verified_at?: string | null;
    payment_rejection_reason?: string | null;
  };
  userId: string;
  onUploadSuccess?: () => void;
};

export default function PaymentCard({ registration: reg, userId, onUploadSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const amount =
    reg.total_amount > 0 ? reg.total_amount : calculateDefaultAmount(reg.product, reg.level);
  const hasUploaded = !!reg.payment_proof_url;
  const isRejected = !!reg.payment_rejection_reason;
  const waMsg =
    "Halo admin, saya sudah transfer untuk kelas " +
    reg.language +
    " " +
    reg.level +
    " (" +
    reg.product +
    ") sebesar " +
    formatRupiah(amount) +
    ". Mohon dicek ya. Terima kasih.";

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file max 5MB");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Format harus JPG, PNG, WebP, atau PDF");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = userId + "/" + reg.id + "-" + Date.now() + "." + ext;

      // Step 1: Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      // Step 2: Update registration row via API (service role bypasses RLS)
      const res = await fetch("/api/upload-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id, proofPath: path, userId }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        // Show full server error for debugging (status + error + detail)
        const parts: string[] = [];
        parts.push("HTTP " + res.status);
        if (data?.error) parts.push(data.error);
        if (data?.detail) parts.push("Detail: " + (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)));
        throw new Error(parts.join(" | "));
      }

      onUploadSuccess?.();
    } catch (err: any) {
      console.error("Upload error (full):", err);
      setError("Upload gagal: " + (err.message || "coba lagi"));
    } finally {
      setUploading(false);
    }
  };

  // ─── State A: Bukti uploaded, menunggu verifikasi admin ─────────────
  if (hasUploaded && !isRejected && !reg.payment_verified_at) {
    return (
      <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-1.5">
          <span className="text-base">⏳</span>
          <span className="text-sm font-semibold">Menunggu Verifikasi Admin</span>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Bukti transfer kamu sudah diterima. Admin akan verify dalam 1×24 jam kerja.
        </p>
        <a
          href={"https://wa.me/" + WA_ADMIN + "?text=" + encodeURIComponent(waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 h-9 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors border border-green-200"
        >
          💬 Follow-up via WhatsApp
        </a>
      </div>
    );
  }

  // ─── State B: Need upload (first time OR rejected re-upload) ─────────
  return (
    <div className="mt-3 bg-white/70 rounded-xl p-3 border border-amber-300">
      {isRejected && (
        <div className="mb-3 bg-red-50 rounded-lg p-2.5 border border-red-200">
          <p className="text-xs font-semibold text-red-700 mb-0.5">❌ Bukti transfer ditolak</p>
          <p className="text-[11px] text-red-600">Alasan: {reg.payment_rejection_reason}</p>
        </div>
      )}

      <p className="text-xs font-semibold text-amber-900 mb-2">💳 Transfer ke rekening:</p>
      <div className="bg-amber-50/60 rounded-lg p-3 space-y-1.5 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Bank</span>
          <span className="font-semibold">{BANK_NAME}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Nomor Rekening</span>
          <button
            onClick={() => copy(ACCOUNT_NUMBER, "no")}
            className="flex items-center gap-1.5 hover:text-teal-700"
          >
            <span className="font-mono font-semibold">{ACCOUNT_NUMBER}</span>
            <span className="text-[10px] opacity-70">{copied === "no" ? "✓" : "📋"}</span>
          </button>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Atas Nama</span>
          <span className="font-semibold text-right text-xs">{ACCOUNT_NAME}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-amber-200/70">
          <span className="text-xs text-gray-700 font-semibold">Jumlah Transfer</span>
          <button
            onClick={() => copy(String(amount), "amount")}
            className="flex items-center gap-1.5 hover:text-teal-700"
          >
            <span className="text-base font-bold text-amber-900">{formatRupiah(amount)}</span>
            <span className="text-[10px] opacity-70">{copied === "amount" ? "✓" : "📋"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Error detail (kirim ke admin):</p>
          <p className="text-[11px] font-mono text-red-800 break-all select-all">{error}</p>
        </div>
      )}

      <label className="mt-3 block cursor-pointer">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <div
          className={
            "inline-flex w-full items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors " +
            (uploading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-teal-600 text-white hover:bg-teal-700 cursor-pointer")
          }
        >
          {uploading
            ? "Mengunggah..."
            : isRejected
            ? "📤 Upload Ulang Bukti Transfer"
            : "📤 Upload Bukti Transfer"}
        </div>
      </label>

      <a
        href={"https://wa.me/" + WA_ADMIN + "?text=" + encodeURIComponent(waMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex w-full items-center justify-center gap-2 h-9 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors border border-green-200"
      >
        💬 atau Konfirmasi via WhatsApp
      </a>
    </div>
  );
}
