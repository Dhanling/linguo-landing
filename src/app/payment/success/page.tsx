"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import successAnim from "./success-anim.json";

// payment-success-lottie-v1: render Lottie client-only (ssr:false) so the
// success page never risks an SSR/hydration error after a real payment.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get("id");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        {/* payment-success-lottie-v1: ceklis hijau, main sekali (ga loop) */}
        <div className="w-40 h-40 mx-auto mb-2">
          <Lottie animationData={successAnim} loop={false} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-600 mb-6">Terima kasih sudah mendaftar di Linguo! Sekarang lengkapi data kamu supaya kami bisa siapkan kelas terbaik.</p>
        <p className="text-sm text-gray-400 mb-6">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href={`/onboarding/${id}`}
            className="bg-[#1A9E9E] text-white px-6 py-3.5 rounded-full font-bold hover:bg-[#178888] transition shadow-lg shadow-[#1A9E9E]/25 inline-block">
            Lengkapi Data Diri →
          </a>
          <a href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20bayar" target="_blank"
            className="text-green-600 font-medium hover:underline text-sm">Chat WhatsApp</a>
          <a href="/" className="text-slate-400 hover:underline text-sm">Kembali ke halaman utama</a>
        </div>
      </div>
    </div>
  );
}
export default function PaymentSuccess() {
  return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}><SuccessContent /></Suspense>);
}
