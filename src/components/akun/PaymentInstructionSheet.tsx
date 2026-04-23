"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────
type Props = {
  totalAmount: number;
  regId: string;
  /** Is the user currently on "Menunggu Verifikasi" (already uploaded proof)? */
  isVerifying?: boolean;
  /** Was proof rejected? Show rejection reason */
  rejectionReason?: string | null;
  /** Existing proof URL (re-upload case) */
  existingProofUrl?: string | null;
  /** Callback after successful upload */
  onUploadSuccess?: () => void;
};

const BANK_ACCOUNTS = [
  {
    bank: "BCA",
    number: "5470-3636-85",
    name: "PT Linguo Edu Indonesia",
    icon: "🏦",
  },
];

export default function PaymentInstructionSheet({
  totalAmount,
  regId,
  isVerifying = false,
  rejectionReason,
  existingProofUrl,
  onUploadSuccess,
}: Props) {
  const [expanded, setExpanded] = useState(!isVerifying);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/-/g, "")).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const formattedAmount = totalAmount > 0
    ? `Rp${totalAmount.toLocaleString("id-ID")}`
    : "Akan dikonfirmasi admin";

  return (
    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💳</span>
          <span className="text-xs font-semibold text-amber-900">
            {isVerifying ? "Bukti terkirim — menunggu verifikasi" : "Instruksi Pembayaran"}
          </span>
        </div>
        <span className={`text-amber-600 text-xs transition-transform ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-3 border-t border-amber-200/60">
              {/* Rejection warning */}
              {rejectionReason && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <p className="font-semibold mb-0.5">❌ Bukti ditolak</p>
                  <p>{rejectionReason}</p>
                  <p className="mt-1 text-red-600 font-medium">Silakan upload ulang bukti yang benar.</p>
                </div>
              )}

              {/* Verification pending */}
              {isVerifying && !rejectionReason && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                  <p className="font-semibold">⏳ Menunggu verifikasi admin</p>
                  <p className="mt-0.5 text-blue-600">Biasanya 1–2 jam di jam kerja (08:00–17:00 WIB)</p>
                </div>
              )}

              {/* Amount */}
              {totalAmount > 0 && (
                <div className="mt-3 flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <span className="text-xs text-gray-500">Total Transfer</span>
                  <button
                    onClick={() => copyToClipboard(String(totalAmount), "amount")}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-sm font-bold text-gray-900">{formattedAmount}</span>
                    <span className="text-[10px] text-amber-600 font-medium">
                      {copied === "amount" ? "✓ Tersalin" : "Salin"}
                    </span>
                  </button>
                </div>
              )}

              {/* Bank accounts */}
              {BANK_ACCOUNTS.map((acct) => (
                <div key={acct.number} className="bg-white rounded-lg px-3 py-2.5 border border-amber-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span>{acct.icon}</span>
                      <span className="text-xs font-semibold text-gray-800">{acct.bank}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(acct.number, acct.bank)}
                      className="text-[10px] text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                    >
                      {copied === acct.bank ? "✓ Tersalin" : "📋 Salin"}
                    </button>
                  </div>
                  <p className="text-xs font-mono font-bold text-gray-900 tracking-wide break-all">{acct.number}</p>
                  <p className="text-[11px] text-gray-500">a.n. {acct.name}</p>
                </div>
              ))}

              {/* Tips */}
              <div className="text-[11px] text-amber-700 bg-amber-100/50 rounded-lg px-3 py-2 space-y-0.5">
                <p>💡 <strong>Transfer persis sesuai nominal</strong> agar mudah diverifikasi.</p>
                <p>💡 Setelah transfer, upload bukti di bawah — atau kirim via WhatsApp.</p>
              </div>

              {/* Existing proof thumbnail */}
              {existingProofUrl && (
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <img src={existingProofUrl} alt="Bukti" className="h-10 w-10 rounded object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">Bukti sudah diupload</p>
                    <p className="text-[10px] text-gray-400">Klik upload lagi untuk mengganti</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
