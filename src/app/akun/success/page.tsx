"use client";

import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.location.href = "/akun";
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-gray-600 mb-6">
          Terima kasih, kami sudah menerima pembayaranmu. Tim Linguo akan menghubungimu
          dalam 1×24 jam untuk pengaturan jadwal kelas pertama.
        </p>
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-teal-700 mb-1">📌 Yang akan terjadi:</p>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Email konfirmasi dari Xendit (cek inbox)</li>
            <li>Admin Linguo hubungi via WhatsApp untuk schedule</li>
            <li>Pengajar dimatch berdasarkan preferensi</li>
            <li>Mulai kelas! 🚀</li>
          </ol>
        </div>
        <a
          href="/akun"
          className="inline-block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Kembali ke Dashboard ({countdown})
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Auto-redirect dalam {countdown} detik
        </p>
      </div>
    </div>
  );
}
