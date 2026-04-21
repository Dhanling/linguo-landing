"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, Home } from "lucide-react";

// ────────────────────────────────────────────────────────────────
// Multilingual goodbye — rotates every 3.2s
// ────────────────────────────────────────────────────────────────
const GOODBYES = [
  { text: "Sampai jumpa!", lang: "Indonesia" },
  { text: "See you soon!", lang: "English" },
  { text: "またね!", lang: "日本語" },
  { text: "또 만나요!", lang: "한국어" },
  { text: "再见!", lang: "中文" },
  { text: "مع السلامة", lang: "العربية" },
  { text: "¡Hasta pronto!", lang: "Español" },
  { text: "A presto!", lang: "Italiano" },
  { text: "À bientôt!", lang: "Français" },
  { text: "Bis bald!", lang: "Deutsch" },
  { text: "Até logo!", lang: "Português" },
  { text: "До свидания!", lang: "Русский" },
  { text: "Görüşürüz!", lang: "Türkçe" },
  { text: "फिर मिलेंगे!", lang: "हिन्दी" },
  { text: "Nähdään!", lang: "Suomi" },
];

export default function LogoutPage() {
  const [greetIdx, setGreetIdx] = useState(0);

  // Rotate greeting every 3.2s
  useEffect(() => {
    const t = setInterval(() => {
      setGreetIdx((i) => (i + 1) % GOODBYES.length);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  const greet = GOODBYES[greetIdx];

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* ───────────── Background: sky gradient ───────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #A6E0E0 0%, #C8EDEC 28%, #E4F5F1 55%, #F0F9F7 80%, #FFFFFF 100%)",
        }}
      />

      {/* ───────────── Decorative clouds (bottom only) ───────────── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="logout-cloud-dense" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle arc lines */}
        <circle cx="800" cy="1800" r="1400" fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1.5" />
        <circle cx="800" cy="1900" r="1300" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />
        <circle cx="800" cy="2000" r="1200" fill="none" stroke="#FFFFFF" strokeOpacity="0.2" strokeWidth="1.5" />

        {/* Bottom dense cloud bank only */}
        <ellipse cx="200" cy="820" rx="400" ry="120" fill="url(#logout-cloud-dense)" />
        <ellipse cx="550" cy="860" rx="320" ry="100" fill="url(#logout-cloud-dense)" />
        <ellipse cx="900" cy="840" rx="380" ry="110" fill="url(#logout-cloud-dense)" />
        <ellipse cx="1280" cy="860" rx="360" ry="115" fill="url(#logout-cloud-dense)" />
        <ellipse cx="1500" cy="820" rx="280" ry="95" fill="url(#logout-cloud-dense)" />
        <ellipse cx="700" cy="900" rx="500" ry="80" fill="url(#logout-cloud-dense)" />
        <ellipse cx="1100" cy="900" rx="500" ry="80" fill="url(#logout-cloud-dense)" />
      </svg>

      {/* ───────────── Corner brand ───────────── */}
      <Link href="/" className="absolute left-6 top-6 z-20 flex items-center gap-2.5 md:left-10 md:top-8 hover:opacity-80 transition-opacity">
        <img
          src="/logo-icon.png"
          alt="Linguo"
          className="h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(13,71,71,0.2)]"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-tight text-slate-900">Linguo.id</span>
          <span className="text-[11px] font-medium text-slate-600">Everyone can be polyglot</span>
        </div>
      </Link>

      {/* ───────────── Liquid Glass Center Card ───────────── */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="liquid-glass relative rounded-[28px] p-8 md:p-10">
          {/* Small goodbye icon tile (like hand wave) */}
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_-4px_rgba(13,71,71,0.2)] ring-1 ring-slate-900/5">
            <span className="text-2xl" role="img" aria-label="wave">👋</span>
          </div>

          {/* Rotating greeting heading */}
          <div className="relative text-center">
            <div className="relative h-10 md:h-11 overflow-hidden">
              <h1
                key={greetIdx}
                className="greeting-fade text-[26px] md:text-[28px] font-bold tracking-tight text-slate-900"
                lang={greet.lang}
              >
                {greet.text}
              </h1>
            </div>
            <p className="mx-auto mt-2.5 max-w-xs text-sm leading-relaxed text-slate-600">
              Kamu berhasil keluar dari akun Linguo. Terima kasih sudah belajar bersama kami hari ini.
            </p>
          </div>

          {/* CTAs */}
          <div className="relative mt-8 flex flex-col gap-3">
            <Link
              href="/akun"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1A9E9E] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-4px_rgba(26,158,158,0.5)] hover:bg-[#158585] active:bg-[#0F6F6F] transition"
            >
              <LogIn className="h-4 w-4" />
              Masuk lagi
            </Link>
            <Link
              href="/"
              className="glass-ghost inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold text-slate-700 transition"
            >
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>

        {/* Footer under card */}
        <p className="mt-6 text-center text-[11px] text-slate-600">
          © Linguo.id 2026 · PT. Linguo Edu Indonesia
        </p>
      </div>

      {/* ───────────── Inline styles for liquid glass effect ───────────── */}
      <style>{`
        .liquid-glass {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.35) 40%,
            rgba(255, 255, 255, 0.25) 100%
          );
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow:
            0 20px 60px -15px rgba(13, 71, 71, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
            inset 0 -1px 0 0 rgba(255, 255, 255, 0.2);
          position: relative;
        }
        .liquid-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(255, 255, 255, 0) 35%
          );
          pointer-events: none;
        }
        .liquid-glass::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(
            120% 60% at 50% 0%,
            rgba(26, 158, 158, 0.12) 0%,
            rgba(26, 158, 158, 0) 60%
          );
          pointer-events: none;
        }
        .glass-ghost {
          background: rgba(255, 255, 255, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .glass-ghost:hover {
          background: rgba(255, 255, 255, 0.7);
        }
        @keyframes greetIn {
          0%   { opacity: 0; transform: translateY(10px); }
          15%  { opacity: 1; transform: translateY(0); }
          85%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .greeting-fade {
          animation: greetIn 3.2s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
