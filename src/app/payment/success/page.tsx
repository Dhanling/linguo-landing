"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-600 mb-6">Terima kasih sudah mendaftar di Linguo! Kami akan menghubungi kamu via WhatsApp dalam 1x24 jam untuk jadwal kelas.</p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20bayar" target="_blank"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition">Chat WhatsApp</a>
          <a href="/" className="text-teal-600 hover:underline text-sm">Kembali ke halaman utama</a>
        </div>
      </div>
    </div>
  );
}
export default function PaymentSuccess() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><SuccessContent /></Suspense>);
}
