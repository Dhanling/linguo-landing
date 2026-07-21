"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// simulasi-paywall-v1: invoice simulasi punya external_id `LINGUO-SIM-<toefl|ielts>-<ts>`.
// Setelah PAID, webhook grant simulation_entitlements by email → begitu buyer login
// dengan email yang sama, akses simulasi otomatis terbuka di menu Simulasi Tes.
// Halaman ini mengarahkan buyer ke dashboard, BUKAN pesan "dihubungi utk jadwal kelas".
function parseSim(id: string | null): { type: "TOEFL" | "IELTS" } | null {
  const m = /^LINGUO-SIM-(toefl|ielts)-/.exec(id || "");
  if (!m) return null;
  return { type: m[1] === "toefl" ? "TOEFL" : "IELTS" };
}

function SimulasiSuccess({ id, type }: { id: string | null; type: "TOEFL" | "IELTS" }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h1>
        <p className="text-gray-600 mb-4">
          Akses <span className="font-semibold text-teal-700">Simulasi {type}</span> kamu sudah aktif.
          Yuk langsung kerjakan di dashboard.
        </p>
        <div className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/60 px-5 py-4 text-left text-sm text-slate-600">
          <p className="font-semibold text-slate-800 mb-1">Cara mulai:</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Masuk ke dashboard pakai <span className="font-semibold">email yang sama</span> saat checkout tadi.
            </li>
            <li>Buka menu <span className="font-semibold">Simulasi Tes</span> lalu klik simulasinya.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-400">
            Kalau paketnya belum muncul, tunggu beberapa detik lalu muat ulang — akses aktif otomatis setelah pembayaran terkonfirmasi.
          </p>
        </div>
        {id && <p className="text-sm text-gray-400 mb-6">Order ID: {id}</p>}
        <div className="flex flex-col gap-3">
          <a
            href="/akun?menu=simulasi"
            className="bg-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-700 transition"
          >
            Mulai Simulasi →
          </a>
          <a
            href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20bayar%20simulasi%20dengan%20ID%3A%20"
            target="_blank"
            className="text-teal-600 hover:underline text-sm"
          >
            Butuh bantuan? Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const sim = parseSim(id);

  if (sim) return <SimulasiSuccess id={id} type={sim.type} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Terima kasih sudah mendaftar di Linguo! Kami akan menghubungi kamu via WhatsApp dalam 1x24 jam untuk jadwal kelas.
        </p>
        <p className="text-sm text-gray-400 mb-8">Order ID: {id}</p>
        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/6282116859493?text=Halo%20Linguo%2C%20saya%20sudah%20bayar%20dengan%20ID%3A%20"
            target="_blank"
            className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-600 transition"
          >
            💬 Chat WhatsApp
          </a>
          <a href="/" className="text-teal-600 hover:underline text-sm">
            ← Kembali ke halaman utama
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
