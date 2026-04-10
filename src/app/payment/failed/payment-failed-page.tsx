"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailedContent() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Gagal 😔</h1>
        <p className="text-gray-600 mb-6">
          Sepertinya ada kendala pada pembayaranmu. Jangan khawatir, kamu bisa coba lagi atau hubungi kami.
        </p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href="/" className="bg-[#1A9E9E] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition">
            Coba Lagi
          </a>
          <a
            href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20pembayaran%20saya%20gagal%20dengan%20ID%3A%20"
            target="_blank"
            className="text-teal-600 hover:underline text-sm"
          >
            💬 Butuh bantuan? Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailed() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FailedContent />
    </Suspense>
  );
}
