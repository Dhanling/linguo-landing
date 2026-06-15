"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CreditCard,
  MessageCircle,
  XCircle,
} from "lucide-react";

// [enroll-remove-manual-transfer-v1] Opsi "Bayar manual via transfer bank"
// (rekening BCA + Upload Bukti Transfer) dihapus. Pembayaran hanya lewat
// Xendit (otomatis) atau kontak admin via WhatsApp.

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
  // [enroll-remove-manual-transfer-v1] dipertahankan utk kompat caller (upload manual sudah dihapus).
  onUploadSuccess?: () => void;
  onRegenerateXendit?: () => Promise<string | null>;
};

export default function PaymentCard({
  registration: reg,
  onRegenerateXendit,
}: Props) {
  const [regenerating, setRegenerating] = useState(false);

  const amount =
    reg.total_amount > 0 ? reg.total_amount : calculateDefaultAmount(reg.product, reg.level);
  const hasUploaded = !!reg.payment_proof_url;
  const isRejected = !!reg.payment_rejection_reason;
  const waMsg =
    "Halo admin, saya sudah transfer untuk kelas " +
    reg.language + " " + reg.level + " (" + reg.product + ") sebesar " +
    formatRupiah(amount) + ". Mohon dicek ya. Terima kasih.";

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

  // ─── State A: Menunggu verifikasi admin (row lama yg sudah upload bukti) ─
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

  // ─── State B: Belum bayar — Xendit (otomatis) + kontak admin via WA ─────
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
    </div>
  );
}
