"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Upload,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  Landmark,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Bank rekening Linguo — edit di sini kalau ganti
const BANK_NAME = "BCA";
const ACCOUNT_NUMBER = "3370687641";
const ACCOUNT_NAME = "Lisana Rachmawati";
const WA_ADMIN = "6282116859493";

function calculateDefaultAmount(product: string, level: string): number {
  if (product === "Kelas Private") return 720000;
  if (product === "Kelas Reguler") return 150000;
  if (product === "IELTS/TOEFL Prep") return 300000;
  if (product === "Kelas Kids") {
    const lvl = (level || "").toLowerCase();
    if (lvl.includes("young")) return 680000;
    return 600000;
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
    xendit_invoice_url?: string | null;
  };
  userId: string;
  onUploadSuccess?: () => void;
  onRegenerateXendit?: () => Promise<string | null>;
};

export default function PaymentCard({
  registration: reg,
  userId,
  onUploadSuccess,
  onRegenerateXendit,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const amount =
    reg.total_amount > 0 ? reg.total_amount : calculateDefaultAmount(reg.product, reg.level);
  const hasUploaded = !!reg.payment_proof_url;
  const isRejected = !!reg.payment_rejection_reason;
  const waMsg =
    "Halo admin, saya sudah transfer untuk kelas " +
    reg.language + " " + reg.level + " (" + reg.product + ") sebesar " +
    formatRupiah(amount) + ". Mohon dicek ya. Terima kasih.";

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  };

  const handleXenditPay = async () => {
    if (reg.xendit_invoice_url) {
      window.location.href = reg.xendit_invoice_url;
      return;
    }
    if (!onRegenerateXendit) {
      alert("Link pembayaran tidak tersedia. Silakan hubungi admin via WhatsApp.");
      return;
    }
    setRegenerating(true);
    try {
      const url = await onRegenerateXendit();
      if (url) {
        window.location.href = url;
      } else {
        alert("Gagal generate link pembayaran. Coba lagi atau hubungi admin via WhatsApp.");
      }
    } finally {
      setRegenerating(false);
    }
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

      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Sesi login expired, refresh halaman dulu ya");
      }

      const res = await fetch("/api/upload-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: reg.id, proofPath: path, userId, accessToken }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
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

  // ─── State A: Menunggu verifikasi admin ─────────────────────────────
  if (hasUploaded && !isRejected && !reg.payment_verified_at) {
    return (
      <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 mb-1.5">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
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
          <MessageCircle className="w-3.5 h-3.5" />
          Follow-up via WhatsApp
        </a>
      </div>
    );
  }

  // ─── State B: Belum bayar — Xendit primary + manual collapsible ─────
  return (
    <div className="mt-3 bg-white/70 rounded-xl p-3 border border-amber-300">
      {isRejected && (
        <div className="mb-3 bg-red-50 rounded-lg p-2.5 border border-red-200">
          <div className="flex items-center gap-1.5 mb-0.5">
            <XCircle className="w-3.5 h-3.5 text-red-700" strokeWidth={2.5} />
            <p className="text-xs font-semibold text-red-700">Bukti transfer ditolak</p>
          </div>
          <p className="text-[11px] text-red-600 ml-5">Alasan: {reg.payment_rejection_reason}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-200/70">
        <span className="text-xs text-gray-700">Total Pembayaran</span>
        <span className="text-base font-bold text-amber-900">{formatRupiah(amount)}</span>
      </div>

      <motion.button
        onClick={handleXenditPay}
        disabled={regenerating}
        whileHover={{ scale: regenerating ? 1 : 1.01 }}
        whileTap={{ scale: regenerating ? 1 : 0.99 }}
        transition={{ duration: 0.15 }}
        className={
          "inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-shadow " +
          (regenerating
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600")
        }
      >
        {regenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"
            />
            Mempersiapkan link...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" strokeWidth={2.5} />
            Lanjutkan Pembayaran
          </>
        )}
      </motion.button>
      <p className="text-[10px] text-gray-500 mt-1.5 text-center">
        Bayar via VA, QRIS, atau e-wallet · konfirmasi otomatis &lt;1 menit
      </p>

      <a
        href={"https://wa.me/" + WA_ADMIN + "?text=" + encodeURIComponent(waMsg)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-medium text-gray-600 hover:text-teal-700 hover:bg-gray-50 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        atau hubungi admin via WhatsApp
      </a>

      <button
        onClick={() => setShowManual(!showManual)}
        className="mt-2 w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium text-gray-600"
        aria-expanded={showManual}
      >
        <span className="inline-flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" />
          Bayar manual via transfer bank
        </span>
        <motion.span
          animate={{ rotate: showManual ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-block"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {showManual && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3 pt-1">
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Transfer ke rekening:
              </p>
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
                    {copied === "no" ? (
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
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
                    {copied === "amount" ? (
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-700" strokeWidth={2.5} />
                    <p className="text-xs font-semibold text-red-700">Error detail (kirim ke admin):</p>
                  </div>
                  <p className="text-[11px] font-mono text-red-800 break-all select-all ml-5">{error}</p>
                </div>
              )}

              <label className="block cursor-pointer">
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
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"
                      />
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" strokeWidth={2.5} />
                      {isRejected ? "Upload Ulang Bukti Transfer" : "Upload Bukti Transfer"}
                    </>
                  )}
                </div>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
