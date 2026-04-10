import { readFileSync, writeFileSync } from "fs";

// Update payment success page to include onboarding link
const successPage = `"use client";
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
        <p className="text-gray-600 mb-6">Terima kasih sudah mendaftar di Linguo! Sekarang lengkapi data kamu supaya kami bisa siapkan kelas terbaik.</p>
        <p className="text-sm text-gray-400 mb-6">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a href={\`/onboarding/\${id}\`}
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
}`;

writeFileSync("src/app/payment/success/page.tsx", successPage);
console.log("✅ Payment success page updated with onboarding link");
