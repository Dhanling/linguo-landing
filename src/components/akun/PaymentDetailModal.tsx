"use client";

import type { ReactNode } from "react";
import UnifiedCourseCard from "@/components/akun/UnifiedCourseCard";

type Props = {
  reg: any;
  userId: string;
  onClose: () => void;
  /** Render prop untuk PaymentCard — copy verbatim dari beranda (Xendit regenerate). */
  renderPayment: (reg: any, userId: string) => ReactNode;
};

export default function PaymentDetailModal({ reg, userId, onClose, renderPayment }: Props) {
  if (!reg) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-h-[88vh] md:max-w-md md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#12172B]">Selesaikan Pembayaran</h3>
            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
              {reg.language || reg.product}
              {reg.level ? ` — ${reg.level}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Body — UI bayar penuh (UnifiedCourseCard pending + PaymentCard) */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <UnifiedCourseCard
            reg={reg}
            index={0}
            userId={userId}
            variant="pending"
            renderPayment={renderPayment}
          />
        </div>
      </div>
    </div>
  );
}
