"use client";

// =============================================================================
// /kelas-trial/success
// [linguo-patch:trial-class-v1]
// Halaman yang dituju setelah siswa balik dari checkout Xendit. Verifikasi
// status pembayaran ke /api/verify-trial-payment (redirect-verify pattern).
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";

const TEAL = "#1A9E9E";
const WA_ADMIN = "https://wa.me/6282116859493";

type State = "checking" | "paid" | "pending" | "error";

export default function TrialSuccessPage() {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ext = new URLSearchParams(window.location.search).get("ext") || "";
    if (!ext) {
      setState("error");
      return;
    }

    let cancelled = false;
    let tries = 0;

    const check = async () => {
      tries++;
      try {
        const res = await fetch(
          `/api/verify-trial-payment?ext=${encodeURIComponent(ext)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.paid) {
          setState("paid");
          return;
        }
        if (tries >= 5) {
          setState("pending");
          return;
        }
        setTimeout(check, 2500);
      } catch {
        if (cancelled) return;
        if (tries >= 5) {
          setState("error");
          return;
        }
        setTimeout(check, 2500);
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const content: Record<
    State,
    { icon: string; title: string; desc: string }
  > = {
    checking: {
      icon: "⏳",
      title: "Mengkonfirmasi pembayaran…",
      desc: "Sebentar ya, kami sedang mengecek status pembayaran kamu.",
    },
    paid: {
      icon: "✅",
      title: "Pembayaran berhasil!",
      desc: "Terima kasih sudah daftar Trial Class Linguo. Tim kami akan menghubungi kamu via WhatsApp untuk mengatur jadwal sesi trial.",
    },
    pending: {
      icon: "🕐",
      title: "Pembayaran sedang diproses",
      desc: "Kalau kamu sudah menyelesaikan pembayaran, statusnya akan terkonfirmasi sebentar lagi. Tim kami tetap akan menghubungi kamu via WhatsApp.",
    },
    error: {
      icon: "⚠️",
      title: "Tidak bisa memuat status",
      desc: "Kami tidak bisa memverifikasi status saat ini. Kalau kamu sudah membayar, jangan khawatir — hubungi admin via WhatsApp untuk konfirmasi.",
    },
  };

  const c = content[state];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/60 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-3">{c.icon}</div>
        <h1 className="text-xl font-bold text-gray-900">{c.title}</h1>
        <p className="mt-2 text-sm text-gray-500">{c.desc}</p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={WA_ADMIN}
            target="_blank"
            rel="noreferrer"
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: TEAL }}
          >
            Chat Admin via WhatsApp
          </a>
          <Link
            href="/"
            className="w-full rounded-xl py-3 text-sm font-medium text-gray-600 border border-gray-200"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
